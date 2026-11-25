import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { AddressInfo } from 'node:net';
import { Accounts, LEGACY_SHIFT_MICROS } from '../src/accounts.ts';
import { createApp } from '../src/http.ts';
import { Freemius } from '../src/freemius.ts';
import { creditAllowance, FALLBACK_PRICE, parseTopUps, Pricing, reportedCost } from '../src/billing.ts';
import type { Price } from '../src/billing.ts';
import { safeNext, sessionCookie } from '../src/auth.ts';
import { assistant, call } from '../src/manager.ts';
import type { ManagerDriver } from '../src/manager.ts';
import type { Session } from '../src/session.ts';
import type { GameEvent } from '../src/types.ts';
import { en } from '../src/i18n/en.ts';
import { exec } from './player.ts';

test('accounts: starter credit once on sign-up, one account per verified email', () => {
  const a = new Accounts(':memory:', 250_000);
  const { account, created } = a.signIn('google', 'g1', 'Ann@example.com', 'Ann');
  assert.equal(created, true);
  assert.equal(account.balance, 250_000);
  assert.equal(account.granted, 250_000);
  assert.equal(account.toppedUp, false);
  a.charge(account.id, 100_000);
  const again = a.signIn('github', '77', 'ann@example.com', 'ann-gh');
  assert.equal(again.created, false);
  assert.equal(again.account.id, account.id);
  assert.equal(again.account.name, 'Ann');
  assert.equal(again.account.balance, 150_000, 'signing in again gives no new starter');
  assert.equal(a.signIn('github', '77', '', '').account.balance, 150_000);
  a.charge(account.id, 1_000_000);
  assert.equal(a.balance(account.id), 0, 'never below 0');
});

test('accounts: a top-up is credited once per license and resets what "% left" counts from; a refund takes back what is left', () => {
  const a = new Accounts(':memory:', 250_000);
  const id = a.signIn('google', 'g1', 'ann@example.com', 'Ann').account.id;
  a.charge(id, 200_000);
  assert.equal(a.credit('L1', id, 10_000_000), true);
  assert.equal(a.credit('L1', id, 10_000_000), false, 'a license is credited once');
  let acc = a.get(id)!;
  assert.equal(acc.balance, 10_050_000);
  assert.equal(acc.granted, 10_050_000);
  assert.equal(acc.toppedUp, true);
  a.charge(id, 4_000_000);
  assert.equal(a.get(id)!.granted, 10_050_000, 'usage does not move the reference');
  assert.equal(a.refund('L1'), id);
  assert.equal(a.refund('L1'), null, 'a refund is taken back once');
  acc = a.get(id)!;
  assert.equal(acc.balance, 0, 'only what is left is taken back, never below 0');
  assert.equal(acc.toppedUp, false);
});

test('a license finds its buyer by the checkout opened with the same email', () => {
  const a = new Accounts(':memory:', 0);
  const one = a.signIn('google', 'g1', 'one@example.com', '').account;
  a.openCheckout(one.id, 'one@example.com');
  assert.equal(a.ownerOf('L9', 'ONE@example.com'), one.id);
  assert.equal(a.ownerOf('L9', ''), one.id, 'claimed for good');
  assert.equal(a.ownerOf('L10', 'one@example.com'), null, 'one checkout, one license');
});

test('sign-in only sends players back to this site', () => {
  assert.equal(safeNext('/play?x=1'), '/play?x=1');
  assert.equal(safeNext('//evil.example'), '/');
  assert.equal(safeNext('https://evil.example'), '/');
  assert.equal(safeNext('/\\evil.example'), '/');
});

test('an existing accounts.db from the shift-pack days becomes credit', () => {
  const dir = mkdtempSync(join(tmpdir(), 'w755-migrate-'));
  const file = join(dir, 'accounts.db');
  try {
    const old = new DatabaseSync(file);
    old.exec(`
      CREATE TABLE accounts (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL,
        free_shifts INTEGER NOT NULL DEFAULT 0, paid_shifts INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
      CREATE INDEX accounts_email ON accounts(lower(email));
      CREATE TABLE identities (provider TEXT NOT NULL, subject TEXT NOT NULL, account_id TEXT NOT NULL, PRIMARY KEY (provider, subject));
      CREATE TABLE checkouts (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, email TEXT NOT NULL, created_at INTEGER NOT NULL, license_id TEXT);
      CREATE TABLE purchases (license_id TEXT PRIMARY KEY, account_id TEXT NOT NULL, shifts INTEGER NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL);
      INSERT INTO accounts VALUES ('owner', 'o@example.com', 'Owner', 0, 10, 1), ('new', 'n@example.com', 'New', 1, 0, 2);
      INSERT INTO identities VALUES ('google', 'g-owner', 'owner');
      INSERT INTO purchases VALUES ('900', 'owner', 10, 'paid', 3);
    `);
    old.close();
    let a = new Accounts(file, 250_000);
    const owner = a.get('owner')!;
    assert.equal(owner.balance, 10 * LEGACY_SHIFT_MICROS, 'bought shifts become what they cost');
    assert.equal(owner.granted, owner.balance);
    assert.equal(owner.toppedUp, true, 'a pack counts as a top-up');
    assert.equal(a.get('new')!.balance, 250_000, 'an unplayed free shift becomes the starter');
    assert.equal(a.signIn('google', 'g-owner', 'o@example.com', '').account.id, 'owner');
    a.close();
    // Opening it again changes nothing; the old pack's refund takes back its credit.
    a = new Accounts(file, 250_000);
    assert.equal(a.balance('owner'), 10 * LEGACY_SHIFT_MICROS);
    a.charge('owner', 1_000_000);
    assert.equal(a.refund('900'), 'owner');
    assert.equal(a.balance('owner'), 0);
    a.close();
    const cols = (t: string) => (new DatabaseSync(file).prepare(`PRAGMA table_info(${t})`).all() as { name: string }[]).map((c) => c.name);
    assert.deepEqual(cols('accounts').filter((c) => /shifts/.test(c)), []);
    assert.deepEqual(cols('purchases').filter((c) => /shifts/.test(c)), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a call costs the account twice its price: the reported cost, else the catalogue, never 0', async () => {
  const logs: string[] = [];
  const pricing = new Pricing(async () => new Map<string, Price>([['a/one', { input: 1e-6, output: 4e-6, cachedInput: 1e-7 }]]), (l) => logs.push(l));
  await pricing.refresh();
  const a = new Accounts(':memory:', 10_000_000);
  const id = a.signIn('google', 'g1', 'p@example.com', '').account.id;
  const allowance = creditAllowance(a, id, { pricing, multiplier: 2 }, null);
  assert.equal(allowance.kind, 'credit');
  // 1000 fresh input + 9000 cached + 500 output = 0.001 + 0.0009 + 0.002 = $0.0039; twice that.
  allowance.spend(0, { model: 'a/one', inputTokens: 10_000, cachedInputTokens: 9_000, outputTokens: 500 });
  assert.equal(a.balance(id), 10_000_000 - 7_800);
  // The provider's own figure wins.
  allowance.spend(0, { model: 'a/one', inputTokens: 10_000, outputTokens: 500, cost: 0.01 });
  assert.equal(a.balance(id), 10_000_000 - 7_800 - 20_000);
  // A model with no price is charged at the fallback, and logged once.
  allowance.spend(0, { model: 'b/unknown', inputTokens: 1_000, outputTokens: 0 });
  allowance.spend(0, { model: 'b/unknown', inputTokens: 1_000, outputTokens: 0 });
  assert.equal(a.balance(id), 10_000_000 - 7_800 - 20_000 - 2 * Math.ceil(1_000 * FALLBACK_PRICE.input * 2 * 1_000_000));
  assert.equal(logs.filter((l) => l.includes('b/unknown')).length, 1);
  // Token-only bookings (the director's estimate) cost nothing by themselves.
  const before = a.balance(id);
  allowance.spend(2_500);
  assert.equal(a.balance(id), before);
  assert.equal(allowance.canSpend(), true);
  a.charge(id, a.balance(id));
  assert.equal(allowance.canSpend(), false);

  assert.equal(reportedCost({ gateway: { cost: '0.0012' } }), 0.0012);
  assert.equal(reportedCost({ gateway: { cost: 0 } }), undefined);
  assert.equal(reportedCost(undefined), undefined);
  assert.deepEqual(parseTopUps('11:10, 12:20,13:$50 ,bad, 14:200'), { 11: 10, 12: 20, 13: 50, 14: 200 });
});

const SECRET = 'test-secret';
const FM_SECRET = 'fm-secret';

/** Google's token endpoint, and Freemius's API with licenses of the $10 and $20 plans and of the old pack. */
function fakeProviders(): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    if (url === 'https://oauth2.googleapis.com/token') {
      const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
      const claims = { iss: 'https://accounts.google.com', aud: 'gid', sub: 'g-42', email: 'p@example.com', email_verified: true, name: 'Pat', exp: Date.now() / 1000 + 600 };
      return Response.json({ id_token: `${b64({ alg: 'none' })}.${b64(claims)}.sig` });
    }
    if (url.endsWith('/licenses/555.json')) return Response.json({ id: 555, plan_id: 9, user_id: 3 });
    if (url.endsWith('/licenses/556.json')) return Response.json({ id: 556, plan_id: 10, user_id: 3 });
    if (url.endsWith('/licenses/557.json')) return Response.json({ id: 557, plan_id: 1, user_id: 3 });
    if (url.endsWith('/users/3.json')) return Response.json({ id: 3, email: 'p@example.com' });
    return new Response('', { status: 404 });
  }) as typeof fetch;
}

test('a signed-in player plays on the starter, tops up through Freemius, and a refund takes it back', async () => {
  const store = new Accounts(':memory:', 250_000);
  const request = fakeProviders();
  const freemius = new Freemius(
    { productId: '1', topUps: { 9: 10, 10: 20, 11: 50, 12: 200 }, publicKey: 'pk', secretKey: FM_SECRET, apiKey: 'api', sandbox: true, fetch: request },
    store,
  );
  const app = createApp({
    mock: true,
    timeoutMs: 5000,
    mockDelayMs: 0,
    openPerAddress: 1000,
    log: () => {},
    accounts: { store, auth: { secret: SECRET, google: { id: 'gid', secret: 'gsecret' }, fetch: request }, freemius, billing: { floor: 50_000 } },
  });
  await new Promise<void>((r) => app.server.listen(0, '127.0.0.1', () => r()));
  const base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  try {
    let cookies = '';
    const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
      fetch(base + path, {
        method,
        redirect: 'manual',
        headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(cookies ? { cookie: cookies } : {}), ...headers },
        body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      });
    const keep = (res: Response) => {
      const jar = new Map(cookies.split('; ').filter(Boolean).map((c) => c.split('=') as [string, string]));
      for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(';');
        const at = pair.indexOf('=');
        jar.set(pair.slice(0, at), pair.slice(at + 1));
      }
      cookies = [...jar].filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('; ');
    };
    const me = async () => (await call('GET', '/api/me')).json();

    assert.equal((await call('POST', '/api/sessions', {})).status, 401, 'no shift on our key without signing in');
    assert.deepEqual((await me()).signIn, ['google']);
    assert.equal((await call('GET', '/api/auth/github')).status, 404);

    const start = await call('GET', '/api/auth/google?next=/play');
    assert.equal(start.status, 302);
    const to = new URL(start.headers.get('location')!);
    assert.equal(to.host, 'accounts.google.com');
    assert.equal(to.searchParams.get('redirect_uri'), `${base}/api/auth/google/callback`);
    keep(start);
    const forged = await call('GET', '/api/auth/google/callback?code=c&state=wrong');
    assert.equal(forged.headers.get('location'), '/?signin=failed');
    const back = await call('GET', `/api/auth/google/callback?code=c&state=${to.searchParams.get('state')}`);
    assert.equal(back.headers.get('location'), '/play');
    keep(back);
    const first = await me();
    assert.deepEqual(first.account, { name: 'Pat', email: 'p@example.com', usage: { left: 0.25, of: 0.25, topUp: false } });
    assert.deepEqual(first.topUps, [10, 20, 50, 200]);
    assert.equal(first.floor, 0.05);

    assert.equal((await call('POST', '/api/sessions', {})).status, 201, 'the starter plays');
    const id = store.signIn('google', 'g-42', '', '').account.id;
    store.charge(id, 210_000);
    const low = await call('POST', '/api/sessions', { language: 'en' });
    assert.equal(low.status, 402, 'below the floor');
    assert.equal((await low.json()).error, en.errors.usageLimit);

    assert.equal((await call('POST', '/api/billing/checkout', { amount: 15 })).status, 400, 'no such top-up');
    const checkout = await (await call('POST', '/api/billing/checkout', { amount: 20 })).json();
    const co = new URL(checkout.url);
    assert.equal(co.host, 'checkout.freemius.com');
    assert.match(co.pathname, /\/plan\/10\/$/);
    assert.equal(co.searchParams.get('user_email'), 'p@example.com');
    assert.ok(co.searchParams.get('sandbox'));

    const sig = (s: string) => createHmac('sha256', FM_SECRET).update(s).digest('hex');
    const webhook = (license: number, type = 'license.created') => {
      const event = JSON.stringify({ type, objects: type.includes('refund') ? { payment: { license_id: license } } : { license: { id: license } } });
      return call('POST', '/api/billing/webhook', event, { 'x-signature': sig(event) });
    };
    const forgedHook = JSON.stringify({ type: 'license.created', objects: { license: { id: 555 } } });
    assert.equal((await call('POST', '/api/billing/webhook', forgedHook, { 'x-signature': 'f'.repeat(64) })).status, 401);
    assert.equal((await webhook(556)).status, 200);
    assert.equal((await webhook(556)).status, 200);
    assert.deepEqual((await me()).account.usage, { left: 20.04, of: 20.04, topUp: true }, '$20, credited once');
    await call('POST', '/api/billing/checkout', { amount: 10 });
    assert.equal((await webhook(555)).status, 200);
    assert.deepEqual((await me()).account.usage, { left: 30.04, of: 30.04, topUp: true }, 'each plan adds its own amount');
    assert.equal((await webhook(557)).status, 200);
    assert.equal((await me()).account.usage.left, 30.04, 'a plan that is not a top-up adds nothing');
    assert.equal((await call('POST', '/api/sessions', {})).status, 201);

    assert.equal((await webhook(556, 'payment.refund')).status, 200);
    assert.equal((await me()).account.usage.left, 10.04);

    keep(await call('POST', '/api/auth/signout'));
    assert.equal((await me()).account, null);
  } finally {
    await app.close();
  }
});

function waitFor(s: Session, pred: (e: GameEvent) => boolean, timeoutMs = 5000): Promise<GameEvent> {
  const found = s.events.find(pred);
  if (found) return Promise.resolve(found);
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      off();
      reject(new Error('timed out waiting for event'));
    }, timeoutMs);
    const off = s.subscribe((e) => {
      if (pred(e)) {
        clearTimeout(t);
        off();
        resolve(e);
      }
    });
  });
}


/**
 * A manager whose every call reads 100k input tokens: one instruction per task, signed off once the
 * subagent reports. At $1 per million input tokens and 2x, each call costs the account $0.20.
 */
function pricey(model = 'a/one'): ManagerDriver {
  let instructed = false;
  return {
    model,
    async step(req) {
      let res = assistant('Review: fine.', []);
      if (req.tools) {
        res = instructed
          ? assistant('', [call('MissionComplete', { summary: 'Done.' })])
          : assistant('', [call('Agent', { description: 'Do it', prompt: 'Create the file.' })]);
        instructed = !instructed;
      }
      return { ...res, usage: { inputTokens: 100_000, outputTokens: 0 } };
    },
  };
}

async function billedApp(store: Accounts, directorFor?: Parameters<typeof createApp>[0]['directorFor']) {
  const pricing = new Pricing(async () => new Map<string, Price>([['a/one', { input: 1e-6, output: 1e-6, cachedInput: 1e-7 }], ['a/big', { input: 1e-5, output: 1e-5, cachedInput: 1e-6 }]]));
  const app = createApp({
    mock: false,
    timeoutMs: 5000,
    openPerAddress: 1000,
    log: () => {},
    models: async () => [{ id: 'a/one', label: 'One' }, { id: 'a/big', label: 'Big' }],
    driverFor: (model) => pricey(model),
    directorFor,
    // A spent daily pool and a tiny token cap stop free shifts, never an account.
    free: { sessionTokens: 10, dailyTokens: 10, perAddressPerDay: 1, credentials: { provider: 'gateway', apiKey: 'hosted-key-0123456789abcdef' } },
    accounts: { store, auth: { secret: SECRET }, billing: { pricing, multiplier: 2, floor: 50_000 } },
  });
  await new Promise<void>((r) => app.server.listen(0, '127.0.0.1', () => r()));
  const base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  return { app, base };
}

/** Answers every open instruction until the shift pauses or ends. */
async function playUntilStop(s: Session): Promise<GameEvent> {
  const from = s.events.at(-1)?.seq ?? 0;
  const open = (e: GameEvent) =>
    e.type === 'instruction' && !s.events.some((r) => r.type === 'instruction_result' && r.id === e.instruction.id);
  for (;;) {
    const next = await waitFor(s, (e) => (e.seq > from && (e.type === 'game_over' || e.type === 'paused')) || open(e));
    if (next.type !== 'instruction') return next;
    exec(s, 'echo done > done.txt');
    s.report('Done.');
  }
}

test('the starter offers the free model only; after a top-up every model on offer, on our key', async () => {
  const store = new Accounts(':memory:', 250_000);
  const player = store.signIn('google', 'g1', 'p@example.com', 'Pat').account;
  const { app, base } = await billedApp(store);
  const cookie = sessionCookie(SECRET, player.id, false).split(';')[0];
  const ids = async () => ((await (await fetch(`${base}/api/models`, { headers: { cookie } })).json()).models as { id: string }[]).map((m) => m.id);
  const start = (model: string) => fetch(`${base}/api/sessions`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ model }) });
  try {
    assert.deepEqual(await ids(), ['a/one']);
    assert.equal((await start('a/big')).status, 400);
    store.credit('L1', player.id, 10_000_000);
    assert.deepEqual(await ids(), ['a/one', 'a/big']);
    assert.equal((await start('a/big')).status, 201);
  } finally {
    await app.close();
  }
});

test('out of credit mid-shift: the user blames the nerfed limits, the shift pauses, a top-up resumes it, the review is written', async () => {
  const store = new Accounts(':memory:', 250_000);
  const player = store.signIn('google', 'g1', 'p@example.com', 'Pat').account;
  const { app, base } = await billedApp(store);
  const cookie = sessionCookie(SECRET, player.id, false).split(';')[0];
  try {
    const res = await fetch(`${base}/api/sessions`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: '{}' });
    assert.equal(res.status, 201);
    const { id, token } = await res.json();
    const s = app.sessions.get(id)!;
    const resume = (c = cookie) => fetch(`${base}/api/sessions/${id}/resume`, { method: 'POST', headers: { cookie: c, 'x-session-token': token } });
    assert.equal((await resume()).status, 409, 'not paused yet');
    s.start();
    // $0.25: one instruction and its sign-off ($0.20 each) spend it all.
    const stop = await playUntilStop(s);
    assert.deepEqual(stop.type === 'paused' && stop.reason, 'usage');
    assert.equal(s.missionIndex, 1, 'mid-shift: the first task is done, the next one waits');
    assert.equal(store.balance(player.id), 0);
    const lines = s.events.filter((e) => e.type === 'director_text');
    assert.equal(lines.at(-1)?.type === 'director_text' && lines.at(-1)!.seq, stop.seq - 2, 'the complaint comes right before the pause');
    assert.ok(en.director.limit.some((l) => lines.at(-1)?.type === 'director_text' && lines.at(-1)!.text === l));

    assert.equal((await resume()).status, 402, 'no credit yet');
    const other = store.signIn('github', 'x', 'x@example.com', '').account;
    store.credit('L9', other.id, 10_000_000);
    assert.equal((await resume(sessionCookie(SECRET, other.id, false).split(';')[0])).status, 403, 'only the account that pays');
    store.credit('L1', player.id, 10_000_000);
    assert.equal((await resume()).status, 200);
    assert.equal(s.paused, null);
    const end = await playUntilStop(s);
    assert.equal(end.type, 'game_over');
    assert.ok(end.type === 'game_over' && end.review.length > 0);
    assert.ok(store.balance(player.id) < 10_000_000, 'the rest of the shift is charged too');
  } finally {
    await app.close();
  }
});

test('out of credit mid-shift: the player can go on with their own key, or end it and still get the review', async () => {
  const store = new Accounts(':memory:', 250_000);
  const player = store.signIn('google', 'g1', 'p@example.com', 'Pat').account;
  const { app, base } = await billedApp(store);
  const cookie = sessionCookie(SECRET, player.id, false).split(';')[0];
  const begin = async () => {
    store.credit(`L${Math.random()}`, player.id, 250_000 - store.balance(player.id));
    const res = await fetch(`${base}/api/sessions`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: '{}' });
    const { id, token } = await res.json();
    const s = app.sessions.get(id)!;
    s.start();
    const stop = await playUntilStop(s);
    assert.equal(stop.type === 'paused' && stop.reason, 'usage');
    const post = (sub: string, body?: unknown) =>
      fetch(`${base}/api/sessions/${id}/${sub}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-session-token': token }, body: JSON.stringify(body ?? {}) });
    return { s, post };
  };
  try {
    const own = await begin();
    const cont = await own.post('continue', { provider: 'openrouter', apiKey: 'sk-or-player-0123456789abcdef', model: 'a/one' });
    assert.equal(cont.status, 200);
    const end = await playUntilStop(own.s);
    assert.equal(end.type, 'game_over', 'played to the end on the player key');
    assert.equal(store.balance(player.id), 0, 'nothing more charged to the account');

    const quit = await begin();
    assert.equal((await quit.post('finish')).status, 200);
    const over = await waitFor(quit.s, (e) => e.type === 'game_over');
    assert.ok(over.type === 'game_over' && over.review.length > 0, 'the review is written with no credit left');
  } finally {
    await app.close();
  }
});

test('with a director model, the user complains about the limit in their own words, even with no credit left', async () => {
  const store = new Accounts(':memory:', 250_000);
  const player = store.signIn('google', 'g1', 'p@example.com', 'Pat').account;
  const moments: string[] = [];
  const { app, base } = await billedApp(store, (model) => ({
    model,
    async speak(req) {
      moments.push(req.moment);
      return { text: req.moment === 'limit' ? 'They nerfed the limits again.' : 'Hurry up.', inputTokens: 1_000, outputTokens: 0 };
    },
  }));
  const cookie = sessionCookie(SECRET, player.id, false).split(';')[0];
  try {
    const res = await fetch(`${base}/api/sessions`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ director: 'a/one' }) });
    const s = app.sessions.get((await res.json()).id)!;
    s.start();
    const stop = await playUntilStop(s);
    assert.equal(stop.type === 'paused' && stop.reason, 'usage');
    assert.equal(moments.at(-1), 'limit');
    const said = s.events.filter((e) => e.type === 'director_text').at(-1);
    assert.equal(said?.type === 'director_text' && said.text, 'They nerfed the limits again.');
  } finally {
    await app.close();
  }
});

test('accounts: raising the starter gives every existing account the difference once', () => {
  const dir = mkdtempSync(join(tmpdir(), 'w755-starter-'));
  const file = join(dir, 'accounts.db');
  try {
    // A database from before accounts kept their starter: everyone got $0.25.
    const old = new DatabaseSync(file);
    old.exec(`
      CREATE TABLE accounts (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, balance INTEGER NOT NULL DEFAULT 0, granted INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
      INSERT INTO accounts VALUES ('spent', 's@example.com', 'Spent', 0, 250000, 1), ('some', 'o@example.com', 'Some', 100000, 250000, 2), ('paid', 'p@example.com', 'Paid', 2000000, 2100000, 3);
    `);
    old.close();
    let a = new Accounts(file, 500_000);
    assert.equal(a.balance('spent'), 250_000, 'a used-up starter gets the difference');
    assert.equal(a.get('some')!.balance, 350_000);
    assert.equal(a.get('some')!.granted, 500_000);
    assert.equal(a.balance('paid'), 2_250_000, 'a top-up keeps its credit and gets the difference too');
    a.close();
    // Opening it again, or with a smaller starter, changes nothing.
    a = new Accounts(file, 500_000);
    assert.equal(a.balance('spent'), 250_000);
    a.close();
    a = new Accounts(file, 250_000);
    assert.equal(a.balance('spent'), 250_000);
    const fresh = a.signIn('google', 'g-new', 'n@example.com', 'New').account;
    assert.equal(fresh.balance, 250_000);
    a.close();
    // A new account made on the smaller starter is raised later like the rest.
    a = new Accounts(file, 500_000);
    assert.equal(a.balance(fresh.id), 500_000);
    assert.equal(a.balance('spent'), 250_000);
    a.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
