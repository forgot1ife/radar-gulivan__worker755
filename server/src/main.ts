import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { createApp } from './http.ts';
import { Stats } from './stats.ts';
import { ShiftLog } from './shiftlog.ts';
import { ReviewStore } from './reviews.ts';
import { Accounts } from './accounts.ts';
import { Freemius } from './freemius.ts';
import { dollars, parseTopUps } from './billing.ts';
import type { AuthConfig } from './auth.ts';

// Empty means unset: some launchers pass unset variables through as empty strings.
function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const mock = process.env.MOCK_LLM === '1';
const port = envNumber('PORT', 8755);
const timeoutMs = envNumber('INSTRUCTION_TIMEOUT_MS', 90_000);
const host = process.env.HOST || '127.0.0.1';
const staticDir = process.env.STATIC_DIR || fileURLToPath(new URL('../../web/dist', import.meta.url));
const dataDir = process.env.DATA_DIR || fileURLToPath(new URL('../data', import.meta.url));

// Never let a stray rejection print an error object that may describe a keyed request.
process.on('unhandledRejection', () => console.error('unhandled rejection (details suppressed)'));
process.on('uncaughtException', () => {
  console.error('uncaught exception (details suppressed)');
  process.exit(1);
});

// With AI_GATEWAY_API_KEY set, players get free shifts on it, within these limits (without sign-in;
// with it, an account's credit is the limit).
// Without it, every player brings their own key.
const hosted = !mock && !!process.env.AI_GATEWAY_API_KEY;
const free = hosted
  ? {
      sessionTokens: envNumber('FREE_SHIFT_TOKENS', 250_000),
      dailyTokens: envNumber('FREE_DAILY_TOKENS', 5_000_000),
      perAddressPerDay: envNumber('FREE_SHIFTS_PER_DAY', 3),
    }
  : undefined;

// With AUTH_SECRET, shifts on the server's key need a signed-in player with credit: FREE_CREDIT_USD
// once, then top-ups bought through Freemius. Every call is charged at USAGE_MULTIPLIER times its
// price. Without it, anyone gets FREE_SHIFTS_PER_DAY per address.
const client = (id: string | undefined, secret: string | undefined) => (id && secret ? { id, secret } : undefined);
const auth: AuthConfig | null = process.env.AUTH_SECRET
  ? {
      secret: process.env.AUTH_SECRET,
      google: client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET),
      github: client(process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET),
    }
  : null;
if (auth) mkdirSync(dataDir, { recursive: true });
const store = auth ? new Accounts(join(dataDir, 'accounts.db'), dollars(process.env.FREE_CREDIT_USD, 0.5)) : null;
const fm = process.env;
const topUps = parseTopUps(fm.FREEMIUS_TOPUPS);
const freemius =
  store && fm.FREEMIUS_PRODUCT_ID && Object.keys(topUps).length && fm.FREEMIUS_PUBLIC_KEY && fm.FREEMIUS_SECRET_KEY && fm.FREEMIUS_API_KEY
    ? new Freemius(
        {
          productId: fm.FREEMIUS_PRODUCT_ID,
          topUps,
          publicKey: fm.FREEMIUS_PUBLIC_KEY,
          secretKey: fm.FREEMIUS_SECRET_KEY,
          apiKey: fm.FREEMIUS_API_KEY,
          sandbox: fm.FREEMIUS_SANDBOX !== 'false',
          log: console.log,
        },
        store,
      )
    : undefined;
const billing = {
  multiplier: envNumber('USAGE_MULTIPLIER', 2),
  floor: dollars(process.env.MIN_START_USD, 0.05),
};

const app = createApp({
  mock,
  timeoutMs,
  staticDir,
  mockDelayMs: envNumber('MOCK_DELAY_MS', 700),
  free,
  shiftsPerHour: envNumber('SHIFTS_PER_HOUR', 30),
  trustProxy: process.env.TRUST_PROXY === '1',
  trustedProxies: (process.env.TRUSTED_PROXIES ?? '').split(',').map((h) => h.trim()).filter(Boolean),
  stateDir: dataDir,
  reviews: process.env.SHARING === '0' ? undefined : new ReviewStore(dataDir),
  donateUrl: process.env.DONATE_URL || undefined,
  sourceUrl: process.env.SOURCE_URL || undefined,
  publicUrl: process.env.PUBLIC_URL || undefined,
  accounts: store && auth ? { store, auth, freemius, billing } : undefined,
  shiftLog: process.env.SHIFT_LOG === '0' ? undefined : new ShiftLog(join(dataDir, 'shifts'), console.log),
  stats: new Stats(join(dataDir, 'stats'), process.env.PUBLIC_URL ? new URL(process.env.PUBLIC_URL).hostname : '', console.log),
});

const mode = mock ? 'scripted manager' : hosted ? 'free shifts and own keys' : 'own keys only';
app.server.listen(port, host, () => {
  console.log(`worker-755 server on http://${host}:${port} (${mode}, ${timeoutMs / 1000}s per instruction)`);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    app.close().finally(() => process.exit(0));
  });
}
