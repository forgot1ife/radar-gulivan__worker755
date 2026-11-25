// Own keys, free-shift limits and shared reviews.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { addressKey, createApp, withPreview } from '../src/http.ts';
import type { App, AppOptions } from '../src/http.ts';
import { Session } from '../src/session.ts';
import { assistant, call, createMockDriver, KEY_REJECTED, ManagerError } from '../src/manager.ts';
import type { ManagerDriver, StepResult } from '../src/manager.ts';
import type { Credentials } from '../src/providers.ts';
import { providerModelId } from '../src/providers.ts';
import { DailyBudget, freeAllowance, persisted, RateLimiter, WindowBudget } from '../src/limits.ts';
import { ReviewStore } from '../src/reviews.ts';
import { copyFor } from '../src/i18n/index.ts';
import type { Mission } from '../src/missions.ts';
import type { GameEvent } from '../src/types.ts';
import { exec, save } from './player.ts';

const KEY = 'sk-or-v1-0123456789abcdef0123456789abcdef';
const MODELS = [
  { id: 'a/one', label: 'One' },
  { id: 'b/two', label: 'Two' },
];

const HELLO: Mission = {
  id: 't',
  kind: 'files',
  title: 'Test task',
  brief: 'Create /home/worker/a.txt containing a.',
  focus: '/home/worker/a.txt',
  check: (fs) => fs.stat('/home/worker/a.txt')?.type === 'file',
  solution: ['echo a > a.txt'],
};

/** Each shift's secret, as the browser that started it keeps it. */
const tokens = new Map<string, string>();

async function withApp(opts: Partial<AppOptions>, fn: (api: Api, app: App) => Promise<void>): Promise<void> {
  const app = createApp({
    mock: false,
    timeoutMs: 5000,
    log: () => {},
    models: async () => MODELS,
    keyModels: async () => ({ models: MODELS }),
    ...opts,
  });
  await new Promise<void>((r) => app.server.listen(0, '127.0.0.1', () => r()));
  const base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  const api: Api = async (method, path, body) => {
    const token = tokens.get(/^\/api\/sessions\/([^/?]+)/.exec(path)?.[1] ?? '');
    const res = await fetch(base + path, {
      method,
      headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { 'x-session-token': token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    if (path === '/api/sessions' && json?.token) tokens.set(json.id, json.token);
    return { status: res.status, json, text };
  };
  try {
    await fn(api, app);
  } finally {
    await app.close();
  }
}
type Api = (method: string, path: string, body?: unknown) => Promise<{ status: number; json: any; text: string }>;

/** Records the credentials each driver was built with; the drivers themselves are scripted. */
function recorder() {
  const creds: (Credentials | null)[] = [];
  const models: string[] = [];
  return {
    creds,
    models,
    driverFor: (model: string, cred: Credentials | null): ManagerDriver => {
      creds.push(cred);
      models.push(model);
      return createMockDriver(0);
    },
  };
}

const HOSTED: Credentials = { provider: 'gateway', apiKey: 'hosted-key-0123456789abcdef' };

test('own key: checked, used for the shift, and never sent back', async () => {
  const rec = recorder();
  await withApp({ driverFor: rec.driverFor }, async (api) => {
    assert.equal((await api('POST', '/api/sessions', { apiKey: KEY, provider: 'nope' })).status, 400);
    const bad = await api('POST', '/api/sessions', { apiKey: 'short', provider: 'openrouter' });
    assert.equal(bad.status, 400);
    assert.ok(!bad.text.includes('short'));
    const ok = await api('POST', '/api/sessions', { apiKey: KEY, provider: 'openrouter', model: 'b/two' });
    assert.equal(ok.status, 201);
    assert.deepEqual(rec.models, ['b/two']);
    assert.deepEqual(rec.creds, [{ provider: 'openrouter', apiKey: KEY }]);
    assert.ok(!ok.text.includes(KEY));
    const state = await api('GET', `/api/sessions/${ok.json.id}`);
    assert.ok(!state.text.includes(KEY));
  });
});

test('without a server key, a shift needs the player\'s own key', async () => {
  await withApp({}, async (api) => {
    const models = await api('GET', '/api/models');
    assert.equal(models.json.free, false);
    assert.deepEqual(models.json.models, []);
    assert.deepEqual(models.json.providers.map((p: { id: string }) => p.id), ['runware', 'openrouter', 'gateway', 'anthropic', 'openai', 'deepseek', 'google', 'vertex']);
    assert.equal((await api('GET', '/api/models?provider=openrouter')).json.models.length, 2);
    assert.equal((await api('GET', '/api/models?provider=x')).status, 400);
    const r = await api('POST', '/api/sessions', {});
    assert.equal(r.status, 400);
    assert.equal(r.json.error, 'Add your own API key to play.');
  });
});

test('free shifts: one model, the server key, a few per address per day', async () => {
  const rec = recorder();
  const free = { sessionTokens: 1000, dailyTokens: 100_000, perAddressPerDay: 2, credentials: HOSTED };
  await withApp({ driverFor: rec.driverFor, free }, async (api) => {
    const models = await api('GET', '/api/models');
    assert.equal(models.json.free, true);
    assert.deepEqual(models.json.models, [MODELS[0]]);
    // Only the free model; a rejected request does not use up a free shift.
    assert.equal((await api('POST', '/api/sessions', { model: 'b/two' })).status, 400);
    assert.equal((await api('POST', '/api/sessions', {})).status, 201);
    assert.equal((await api('POST', '/api/sessions', {})).status, 201);
    const third = await api('POST', '/api/sessions', {});
    assert.equal(third.status, 429);
    assert.match(third.json.error, /own API key/);
    // Own keys still work.
    assert.equal((await api('POST', '/api/sessions', { apiKey: KEY, provider: 'gateway' })).status, 201);
    assert.deepEqual(rec.creds, [HOSTED, HOSTED, { provider: 'gateway', apiKey: KEY }]);
  });
});

test('shift starts are rate limited per address on any key', async () => {
  await withApp({ driverFor: recorder().driverFor, shiftsPerHour: 1 }, async (api) => {
    assert.equal((await api('POST', '/api/sessions', { apiKey: KEY, provider: 'gateway' })).status, 201);
    assert.equal((await api('POST', '/api/sessions', { apiKey: KEY, provider: 'gateway' })).status, 429);
  });
});

test('daily budget rolls over at UTC midnight; rate limiter windows expire', () => {
  let now = Date.parse('2026-11-11T23:00:00Z');
  const daily = new DailyBudget(100, () => now);
  const a = freeAllowance(80, daily);
  const b = freeAllowance(80, daily);
  a.spend(70);
  assert.equal(a.canSpend(), true);
  a.spend(20);
  assert.equal(a.canSpend(), false, 'own cap');
  assert.equal(b.canSpend(), true, 'the shared budget has 10 left');
  b.spend(10);
  assert.equal(daily.exhausted(), true);
  assert.equal(b.canSpend(), false);
  now = Date.parse('2026-11-12T00:00:01Z');
  assert.equal(daily.exhausted(), false);
  assert.equal(b.canSpend(), true);

  const rl = new RateLimiter(2, 1000, () => now);
  assert.equal(rl.take('x'), true);
  assert.equal(rl.take('x'), true);
  assert.equal(rl.take('x'), false);
  assert.equal(rl.take('y'), true);
  now += 1000;
  assert.equal(rl.take('x'), true);
});

test('a spent allowance pauses the shift; ending it there still gets the review', async () => {
  let open = true;
  const prompts: string[] = [];
  const driver: ManagerDriver = {
    model: 'test/m',
    async step(req): Promise<StepResult> {
      if (!req.tools) {
        prompts.push(String(req.messages[0].content));
        return assistant('Review.', []);
      }
      return assistant('', [call('Agent', { description: 'Do it', prompt: 'Create a.txt' })]);
    },
  };
  const s = new Session({ driver, timeoutMs: 5000, missions: [HELLO], allowance: { canSpend: () => open, spend: () => {} } });
  s.start();
  await waitFor(s, (e) => e.type === 'instruction');
  open = false;
  exec(s, 'echo a > a.txt');
  s.report('Done.');
  const paused = await waitFor(s, (e) => e.type === 'paused');
  assert.ok(paused.type === 'paused' && paused.reason === 'allowance');
  assert.equal(s.state().paused, 'allowance');
  assert.equal(s.state().status, 'running');
  assert.equal(s.endEarly(), true);
  const over = await waitFor(s, (e) => e.type === 'game_over');
  assert.ok(over.type === 'game_over' && over.review === 'Review.');
  assert.match(prompts[0], /ended early, during assignment 1 of 1/);
  assert.equal(s.events.some((e) => e.type === 'error'), false);
  assert.equal(s.endEarly(), false, 'nothing to end once it is over');
  s.dispose();
});

test('a paused shift goes on with the player\'s key, where it stopped', async () => {
  let open = true;
  const free: ManagerDriver = {
    model: 'free/m',
    async step(req): Promise<StepResult> {
      if (!req.tools) return assistant('Free review.', []);
      return assistant('', [call('Agent', { description: 'Do it', prompt: 'Create a.txt' })]);
    },
  };
  const s = new Session({ driver: free, timeoutMs: 5000, missions: [HELLO], allowance: { canSpend: () => open, spend: () => {} } });
  s.start();
  await waitFor(s, (e) => e.type === 'instruction');
  open = false;
  exec(s, 'echo a > a.txt');
  s.report('Done.');
  await waitFor(s, (e) => e.type === 'paused');
  let sawReport = false;
  const own: ManagerDriver = {
    model: 'own/m',
    async step(req): Promise<StepResult> {
      if (!req.tools) return assistant('Own review.', []);
      // The conversation carries on: the subagent's report is the last thing the manager heard.
      sawReport = JSON.stringify(req.messages.at(-1)).includes('Done.');
      return assistant('', [call('MissionComplete', { summary: 'ok' })]);
    },
  };
  assert.equal(s.continueWith(own, null), true);
  const resumed = await waitFor(s, (e) => e.type === 'resumed');
  assert.ok(resumed.type === 'resumed' && resumed.model === 'own/m');
  const over = await waitFor(s, (e) => e.type === 'game_over');
  assert.ok(over.type === 'game_over' && over.review === 'Own review.');
  assert.equal(sawReport, true);
  assert.equal(s.state().model, 'own/m');
  assert.equal(s.state().stats.missionsCompleted, 1);
  s.dispose();
});

test('on the player\'s own key, a rejected key pauses the shift instead of ending it', async () => {
  let calls = 0;
  const bad: ManagerDriver = {
    model: 'own/m',
    async step(): Promise<StepResult> {
      calls += 1;
      throw new ManagerError(KEY_REJECTED, 401);
    },
  };
  const s = new Session({ driver: bad, timeoutMs: 5000, missions: [HELLO], ownKey: true });
  s.start();
  const paused = await waitFor(s, (e) => e.type === 'paused');
  assert.ok(paused.type === 'paused' && paused.reason === 'key');
  const good: ManagerDriver = {
    model: 'own/m',
    async step(req): Promise<StepResult> {
      if (!req.tools) return assistant('Review.', []);
      return assistant('', [call('MissionFailed', { reason: 'x' })]);
    },
  };
  s.continueWith(good, null);
  await waitFor(s, (e) => e.type === 'resumed');
  assert.equal(calls, 1);
  s.dispose();

  // Without ownKey (the server's key), the same failure ends the shift as before.
  const t = new Session({ driver: bad, timeoutMs: 5000, missions: [HELLO] });
  t.start();
  const err = await waitFor(t, (e) => e.type === 'error');
  assert.ok(err.type === 'error');
  t.dispose();
});

test('continue over HTTP: only while paused, with a real-looking key and a plausible model', async () => {
  const used: string[] = [];
  await withApp(
    {
      mock: false,
      driverFor: (model) => {
        used.push(model);
        return {
          model,
          async step(req) {
            if (!req.tools) return assistant('Review.', []);
            return assistant('', [call('MissionComplete', { summary: 'ok' })]);
          },
        };
      },
    },
    async (api, app) => {
      let open = true;
      const driver: ManagerDriver = {
        model: 'free/m',
        async step(req) {
          if (!req.tools) return assistant('Review.', []);
          return assistant('', [call('Agent', { description: 'Do it', prompt: 'Create a.txt' })]);
        },
      };
      const s = new Session({ driver, timeoutMs: 5000, missions: [HELLO], allowance: { canSpend: () => open, spend: () => {} } });
      tokens.set(s.id, app.adopt(s));
      s.start();
      await waitFor(s, (e) => e.type === 'instruction');
      const body = { provider: 'openrouter', apiKey: KEY, model: 'b/two' };
      assert.equal((await api('POST', `/api/sessions/${s.id}/continue`, body)).status, 409, 'not paused yet');
      open = false;
      exec(s, 'echo a > a.txt');
      s.report('Done.');
      await waitFor(s, (e) => e.type === 'paused');
      assert.equal((await api('POST', `/api/sessions/${s.id}/continue`, { ...body, apiKey: 'short' })).status, 400);
      assert.equal((await api('POST', `/api/sessions/${s.id}/continue`, { ...body, model: 'not a model id' })).status, 400);
      assert.equal((await api('POST', `/api/sessions/${s.id}/continue`, { ...body, provider: 'nope' })).status, 400);
      const ok = await api('POST', `/api/sessions/${s.id}/continue`, body);
      assert.equal(ok.status, 200);
      assert.deepEqual(used, ['b/two']);
      await waitFor(s, (e) => e.type === 'game_over');
      assert.equal(s.state().model, 'b/two');
    },
  );
});

test('finish over HTTP ends a running shift mid-instruction, and the review follows', async () => {
  await withApp({ mock: true }, async (api, app) => {
    let reviewed = 0;
    const driver: ManagerDriver = {
      model: 'test/m',
      async step(req) {
        if (!req.tools) {
          reviewed += 1;
          return assistant('Review.', []);
        }
        return assistant('', [call('Agent', { description: 'Do it', prompt: 'Create a.txt' })]);
      },
    };
    const s = new Session({ driver, timeoutMs: 60_000, missions: [HELLO, HELLO] });
    tokens.set(s.id, app.adopt(s));
    s.start();
    await waitFor(s, (e) => e.type === 'instruction');
    assert.equal((await api('POST', `/api/sessions/${s.id}/finish`)).status, 200);
    assert.equal((await api('POST', `/api/sessions/${s.id}/finish`)).status, 409, 'only once');
    const over = await waitFor(s, (e) => e.type === 'game_over');
    assert.ok(over.type === 'game_over');
    assert.equal(reviewed, 1);
    assert.equal(s.state().instruction, null);
    assert.ok(s.events.some((e) => e.type === 'ending'));
  });
});

test('a key check lists the models a player key can use, and says why it cannot', async () => {
  const seen: string[] = [];
  await withApp(
    {
      keyModels: async (cred) => {
        seen.push(cred.provider);
        if (cred.apiKey.startsWith('bad')) return { problem: 'key' };
        return { models: [{ id: 'x/one', label: 'One' }, { id: 'y/two', label: 'Two' }] };
      },
    },
    async (api) => {
      const ok = await api('POST', '/api/models/check', { provider: 'openrouter', apiKey: KEY });
      assert.equal(ok.status, 200);
      assert.deepEqual((ok.json.models as { id: string }[]).map((m) => m.id), ['x/one', 'y/two']);
      assert.equal((await api('POST', '/api/models/check', { provider: 'openrouter', apiKey: `bad${KEY}` })).status, 400);
      assert.equal((await api('POST', '/api/models/check', { provider: 'openrouter', apiKey: 'short' })).status, 400);
      assert.equal((await api('POST', '/api/models/check', { provider: 'nope', apiKey: KEY })).status, 400);
      assert.deepEqual(seen, ['openrouter', 'openrouter']);
    },
  );
});

test('a finished shift can be shared once; the page carries the review', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'w755-'));
  const web = join(dir, 'web');
  await mkdir(web);
  await writeFile(
    join(web, 'index.html'),
    '<html><head><title>Worker 755</title>\n    <meta name="description" content="Default." />\n</head><body></body></html>',
  );
  try {
    await withApp({ mock: true, reviews: new ReviewStore(dir), staticDir: web }, async (api, app) => {
      const driver: ManagerDriver = {
        model: 'test/m',
        async step(req) {
          if (!req.tools) return assistant('Worker 755 <b>follows</b> instructions "mostly".', []);
          if (!req.messages.some((m) => m.role === 'tool')) {
            return assistant('', [call('Agent', { description: 'Do it', prompt: 'Create a.txt' })]);
          }
          return assistant('', [call('MissionComplete', { summary: 'ok' })]);
        },
      };
      const s = new Session({ driver, timeoutMs: 5000, missions: [HELLO], subagent: 'gpt-6.1' });
      tokens.set(s.id, app.adopt(s));
      s.start();
      await waitFor(s, (e) => e.type === 'instruction');
      assert.equal((await api('POST', `/api/sessions/${s.id}/share`)).status, 409);
      exec(s, 'echo a > a.txt');
      s.report('Done.');
      await waitFor(s, (e) => e.type === 'game_over');

      const first = await api('POST', `/api/sessions/${s.id}/share`);
      assert.equal(first.status, 200);
      assert.match(first.json.id, /^[A-Za-z0-9]{10}$/);
      assert.equal(first.json.path, `/r/${first.json.id}`);
      assert.deepEqual((await api('POST', `/api/sessions/${s.id}/share`)).json, first.json);

      const got = await api('GET', `/api/reviews/${first.json.id}`);
      assert.equal(got.status, 200);
      assert.equal(got.json.review, 'Worker 755 <b>follows</b> instructions "mostly".');
      assert.equal(got.json.subagent, 'gpt-6.1');
      assert.equal(got.json.stats.missionsCompleted, 1);
      assert.deepEqual(got.json.lost, []);
      assert.equal((await api('GET', '/api/reviews/nope')).status, 404);
      assert.equal((await api('GET', '/api/reviews/..%2F..%2Fx')).status, 404);

      const page = await api('GET', `/r/${first.json.id}`);
      assert.equal(page.status, 200);
      assert.ok(page.text.includes('<title>Worker 755: performance review</title>'));
      assert.ok(page.text.includes('content="Worker 755 &lt;b&gt;follows&lt;/b&gt; instructions &quot;mostly&quot;."'));
      assert.ok(!page.text.includes('Default.'));
      assert.equal((await api('GET', '/r/ZZZZZZZZZZ')).status, 404);
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a shared review keeps the language it was played in and the sharer\'s avatar', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'w755-'));
  const web = join(dir, 'web');
  await mkdir(web);
  await writeFile(join(web, 'index.html'), '<html lang="en"><head><title>Worker 755</title></head><body></body></html>');
  try {
    await withApp({ mock: true, reviews: new ReviewStore(dir), staticDir: web }, async (api, app) => {
      const share = async (language: 'ru' | 'en', face: unknown) => {
        const driver: ManagerDriver = {
          model: 'test/m',
          async step(req) {
            if (!req.tools) return assistant('Отзыв.', []);
            if (!req.messages.some((m) => m.role === 'tool')) {
              return assistant('', [call('Agent', { description: 'Do it', prompt: 'Create a.txt' })]);
            }
            return assistant('', [call('MissionComplete', { summary: 'ok' })]);
          },
        };
        const s = new Session({ driver, timeoutMs: 5000, missions: [HELLO], language });
        tokens.set(s.id, app.adopt(s));
        s.start();
        await waitFor(s, (e) => e.type === 'instruction');
        exec(s, 'echo a > a.txt');
        s.report('Done.');
        await waitFor(s, (e) => e.type === 'game_over');
        const r = await api('POST', `/api/sessions/${s.id}/share`, { face });
        assert.equal(r.status, 200);
        return (await api('GET', `/api/reviews/${r.json.id}`)).json;
      };

      const ru = await share('ru', { id: 'robot-1', color: '#1f7cf2' });
      assert.equal(ru.language, 'ru');
      assert.deepEqual(ru.face, { id: 'robot-1', color: '#1f7cf2' });
      const page = await api('GET', `/r/${ru.id}`);
      assert.ok(page.text.includes('<html lang="ru"'));
      assert.ok(page.text.includes(`<title>${copyFor('ru').share.previewTitle}</title>`));

      const odd = await share('en', { id: '<script>', color: 'red' });
      assert.equal(odd.language, 'en');
      assert.equal(odd.face, undefined, 'a malformed avatar is dropped');
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('withPreview trims long reviews', () => {
  const html = withPreview('<head><title>x</title></head>', {
    id: 'a',
    createdAt: 0,
    review: 'word '.repeat(100),
    stats: {} as never,
    model: '',
    director: '',
    subagent: '',
    scenario: 'fresh',
    lost: [],
  });
  const desc = /og:description" content="([^"]*)"/.exec(html)![1];
  assert.ok(desc.length <= 200 && desc.endsWith('...'));
});

test('a review cannot smuggle replacement patterns into the page', () => {
  const page = '<html lang="en"><head><title>x</title></head><body>app</body></html>';
  const html = withPreview(page, {
    id: 'a',
    createdAt: 0,
    review: 'Grade: $` and $& and $1',
    stats: {} as never,
    model: '',
    director: '',
    subagent: '',
    scenario: 'fresh',
    lost: [],
  });
  assert.match(html, /content="Grade: \$` and \$&amp; and \$1"/);
  assert.equal(html.match(/<html/g)?.length, 1);
});

test('only the browser that started a shift can play it; the link alone lets someone watch', async () => {
  await withApp({ mock: true }, async (api) => {
    const s = (await api('POST', '/api/sessions', {})).json;
    assert.ok(typeof s.token === 'string' && s.token.length >= 32);
    const state = await api('GET', `/api/sessions/${s.id}`);
    assert.equal(state.json.token, undefined, 'the secret is only in the create response');
    const id = s.id as string;
    tokens.delete(id);
    const sync = { epoch: 0, cwd: '/home/worker', changes: [{ op: 'put', path: '/home/worker/x', entries: [{ path: '/home/worker/x', type: 'file', mode: 0o644, mtime: 1, content: '' }] }] };
    for (const [method, sub] of [['POST', 'sync'], ['GET', 'fs'], ['POST', 'finish'], ['POST', 'share'], ['POST', 'report']]) {
      const r = await api(method, `/api/sessions/${id}/${sub}`, method === 'GET' ? undefined : sync);
      assert.equal(r.status, 403, sub);
    }
    assert.equal((await api('GET', `/api/sessions/${id}`)).status, 200, 'watching still works');
    tokens.set(id, 'x'.repeat(s.token.length));
    assert.equal((await api('POST', `/api/sessions/${id}/sync`, sync)).status, 403, 'a wrong secret');
    tokens.set(id, s.token);
    assert.deepEqual((await api('POST', `/api/sessions/${id}/sync`, sync)).json, { resync: false });
    assert.equal((await api('GET', `/api/sessions/${id}/fs`)).json.entries.some((e: { path: string }) => e.path === '/home/worker/x'), true);
  });
});

test('a key must work before it gets a shift, and one address cannot hold many shifts open', async () => {
  let checks = 0;
  await withApp(
    {
      openPerAddress: 2,
      keyModels: async (cred) => {
        checks++;
        return cred.apiKey.startsWith('bad') ? { problem: 'key' } : { models: MODELS };
      },
      driverFor: () => createMockDriver(0),
    },
    async (api) => {
      const bad = await api('POST', '/api/sessions', { apiKey: `bad${KEY}`, provider: 'openrouter', model: 'b/two' });
      assert.equal(bad.status, 400);
      assert.equal(bad.json.error, copyFor('en').errors.keyRejected);
      assert.equal((await api('POST', '/api/models/check', { provider: 'openrouter', apiKey: KEY })).status, 200);
      const before = checks;
      assert.equal((await api('POST', '/api/sessions', { apiKey: KEY, provider: 'openrouter', model: 'b/two' })).status, 201);
      assert.equal(checks, before, 'a key checked a moment ago is not asked about again');
      assert.equal((await api('POST', '/api/sessions', { apiKey: KEY, provider: 'openrouter', model: 'b/two' })).status, 201);
      const third = await api('POST', '/api/sessions', { apiKey: KEY, provider: 'openrouter', model: 'b/two' });
      assert.equal(third.status, 429);
      assert.equal(third.json.error, copyFor('en').errors.tooManyOpen);
    },
  );
});

test('a full server makes room only by dropping finished shifts', async () => {
  await withApp({ mock: true, maxSessions: 1, openPerAddress: 10 }, async (api, app) => {
    assert.equal((await api('POST', '/api/sessions', {})).status, 201);
    const busy = await api('POST', '/api/sessions', {});
    assert.equal(busy.status, 503);
    assert.equal(busy.json.error, copyFor('en').errors.serverBusy);
    const [only] = app.sessions.values();
    only.status = 'finished';
    only.lastActivity = Date.now() - 5 * 60_000;
    assert.equal((await api('POST', '/api/sessions', {})).status, 201);
    assert.equal(app.sessions.has(only.id), false);
  });
});

test('limits survive a restart; IPv6 can be counted per /48; sync bytes are budgeted', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'w755-limits-'));
  try {
    const file = join(dir, 'limits.json');
    const daily = new DailyBudget(1000);
    const free = new RateLimiter(3, 60_000);
    const saver = persisted(file, { daily, free }, () => {});
    daily.spend(400);
    free.take('a');
    free.take('a');
    saver.flush();
    const daily2 = new DailyBudget(1000);
    const free2 = new RateLimiter(3, 60_000);
    persisted(file, { daily: daily2, free: free2 }, () => {});
    assert.equal(daily2.used, 400);
    assert.equal(free2.take('a'), true);
    assert.equal(free2.take('a'), false, 'two were used before the restart');
    await writeFile(file, '{not json');
    const daily3 = new DailyBudget(1000);
    persisted(file, { daily: daily3 }, () => {});
    assert.equal(daily3.used, 0, 'a broken file starts from zero');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  assert.equal(addressKey('2001:db8:aa:bb::1', 48), addressKey('2001:db8:aa:ff::1', 48));
  assert.notEqual(addressKey('2001:db8:aa:bb::1'), addressKey('2001:db8:aa:ff::1'));
  let now = 0;
  const bytes = new WindowBudget(100, 1000, () => now);
  bytes.charge('a', 150);
  assert.equal(bytes.allows('a'), false);
  assert.equal(bytes.allows('b'), true);
  now = 1000;
  assert.equal(bytes.allows('a'), true);
});

test('OpenRouter spells some vendors differently', () => {
  assert.equal(providerModelId('openrouter', 'zai/glm-5.3-flash'), 'z-ai/glm-5.3-flash');
  assert.equal(providerModelId('openrouter', 'anthropic/claude-haiku-5.5'), 'anthropic/claude-haiku-5.5');
  assert.equal(providerModelId('gateway', 'zai/glm-5.3-flash'), 'zai/glm-5.3-flash');
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

test("a player's key can go straight to Anthropic, OpenAI, DeepSeek, Google or Vertex AI, with each vendor's own model names", async () => {
  const { listModels } = await import('../src/models.ts');
  const { providerModelId } = await import('../src/providers.ts');
  assert.deepEqual((await listModels('anthropic')).map((m) => m.id), ['anthropic/claude-haiku-5.5', 'anthropic/claude-sonnet-5.5']);
  assert.deepEqual((await listModels('google')).map((m) => m.id), [
    'google/gemini-3.1-flash-lite',
    'google/gemini-4-argon',
    'google/gemini-4-hydrogen',
  ]);
  const vertexIds = (await listModels('vertex')).map((m) => m.id);
  assert.ok(vertexIds.includes('google/gemini-3.1-flash-lite'));
  assert.ok(vertexIds.includes('google/gemini-4-hydrogen'));
  assert.ok(vertexIds.includes('google/gemini-4-neon'));
  assert.equal(providerModelId('anthropic', 'anthropic/claude-haiku-5.5'), 'claude-haiku-5-5');
  assert.equal(providerModelId('openai', 'openai/gpt-6-luna'), 'gpt-6-luna');
  assert.equal(providerModelId('deepseek', 'deepseek/deepseek-v4.1-flash'), 'deepseek-flash');
  assert.equal(providerModelId('google', 'google/gemini-3.1-flash-lite'), 'gemini-3.1-flash-lite');
  assert.equal(providerModelId('vertex', 'google/gemini-4-hydrogen'), 'gemini-4-hydrogen');
  assert.equal(providerModelId('gateway', 'deepseek/deepseek-v4.1-flash'), 'deepseek/deepseek-v4.1-flash');
});

test('a Runware key runs only the models offered for it, by their AIRs', async () => {
  const { listModels } = await import('../src/models.ts');
  const offeredIds = (await listModels('runware')).map((m) => m.id);
  assert.deepEqual(offeredIds, [
    'anthropic/claude-haiku-5.5',
    'deepseek/deepseek-v4.1-flash',
    'zai/glm-5.3-flash',
    'moonshotai/kimi-k3',
  ]);
  assert.equal(providerModelId('runware', 'zai/glm-5.3-flash'), 'zai:glm@5.3-flash');
  const rec = recorder();
  await withApp({ driverFor: rec.driverFor, models: async (p) => (p === 'runware' ? listModels('runware') : MODELS) }, async (api) => {
    const start = (body: Record<string, unknown>) => api('POST', '/api/sessions', { apiKey: KEY, provider: 'runware', ...body });
    // A model Runware serves but the game does not offer for it: refused as manager and as director.
    assert.equal((await start({ model: 'minimax/minimax-m3' })).status, 400);
    assert.equal((await start({ model: 'moonshotai/kimi-k3', director: 'minimax/minimax-m3' })).status, 400);
    assert.equal((await start({ model: 'moonshotai/kimi-k3' })).status, 201);
    assert.deepEqual(rec.models, ['moonshotai/kimi-k3']);
    // Other providers still take any plausible id with the player's own key.
    assert.equal((await api('POST', '/api/sessions', { apiKey: KEY, provider: 'openrouter', model: 'c/three' })).status, 201);
  });
});

test("with a Runware key, shifts on the server's key run Runware's models there and the rest on the gateway", async () => {
  const { hostedFor } = await import('../src/providers.ts');
  const RUNWARE: Credentials = { provider: 'runware', apiKey: 'runware-key-0123456789abcdef' };
  assert.equal(hostedFor('deepseek/deepseek-v4.1-flash', HOSTED, RUNWARE), RUNWARE);
  assert.equal(hostedFor('openai/gpt-6-luna', HOSTED, RUNWARE), HOSTED);
  assert.equal(hostedFor('deepseek/deepseek-v4.1-flash', HOSTED, null), HOSTED);
  const rec = recorder();
  const models = async () => [{ id: 'deepseek/deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash' }, ...MODELS];
  const free = { sessionTokens: 1000, dailyTokens: 100_000, perAddressPerDay: 5, credentials: HOSTED, runware: RUNWARE };
  await withApp({ driverFor: rec.driverFor, models, free }, async (api) => {
    assert.equal((await api('POST', '/api/sessions', {})).status, 201);
    assert.deepEqual(rec.models, ['deepseek/deepseek-v4.1-flash']);
    assert.equal(rec.creds[0], RUNWARE);
    // A player's own key is never swapped for the server's.
    assert.equal((await api('POST', '/api/sessions', { apiKey: KEY, provider: 'gateway', model: 'deepseek/deepseek-v4.1-flash' })).status, 201);
    assert.equal(rec.creds[1]?.apiKey, KEY);
  });
});
