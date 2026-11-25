// Players who sign in, and the credit they play on with the server's key. One SQLite file in
// DATA_DIR. Amounts are integer micro-dollars. A new account gets a one-time starter credit; top-ups
// bought through Freemius add to it; every model call on the server's key takes its price off.

import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';

export type Provider = 'google' | 'github';

/** Micro-dollars in a dollar. */
export const MICROS = 1_000_000;

/** What one unplayed shift from the old shift packs ($9.90 for 10) is worth as credit. */
export const LEGACY_SHIFT_MICROS = 990_000;

export interface Account {
  id: string;
  email: string;
  name: string;
  /** Credit left, in micro-dollars. */
  balance: number;
  /** The balance right after the last grant (the starter or a top-up): what "% left" is counted from. */
  granted: number;
  /** Has a top-up that was not refunded: every model on offer may be used. */
  toppedUp: boolean;
}

/** The starter every account got before accounts kept their own: FREE_CREDIT_USD's old default, $0.25. */
export const EARLIER_STARTER_MICROS = 250_000;

/** How long a checkout may claim the license of a buyer with the same email. */
const CLAIM_MS = 30 * 24 * 60 * 60_000;

interface Row {
  id: string;
  email: string;
  name: string;
  balance: number;
  granted: number;
  topped_up: number;
}

const toAccount = (r: Row): Account => ({
  id: r.id,
  email: r.email,
  name: r.name,
  balance: r.balance,
  granted: r.granted,
  toppedUp: r.topped_up > 0,
});

export class Accounts {
  private readonly db: DatabaseSync;
  private readonly starter: number;
  private readonly now: () => number;

  /** file: the database, or ':memory:' (tests). starter: the sign-up credit, in micro-dollars. */
  constructor(file: string, starter = 250_000, now: () => number = Date.now) {
    this.db = new DatabaseSync(file);
    this.starter = starter;
    this.now = now;
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        balance INTEGER NOT NULL DEFAULT 0,
        granted INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS accounts_email ON accounts(lower(email));
      CREATE TABLE IF NOT EXISTS identities (
        provider TEXT NOT NULL,
        subject TEXT NOT NULL,
        account_id TEXT NOT NULL,
        PRIMARY KEY (provider, subject)
      );
      CREATE TABLE IF NOT EXISTS checkouts (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        license_id TEXT
      );
      CREATE TABLE IF NOT EXISTS purchases (
        license_id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        credit INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    this.migrate();
    this.raiseStarter();
  }

  /**
   * Each account keeps the starter it got. When the starter goes up (FREE_CREDIT_USD), every account
   * that got less gets the difference once, as balance and as what "% left" counts from. It never
   * goes down. Accounts from before this column got EARLIER_STARTER_MICROS.
   */
  private raiseStarter(): void {
    const columns = (this.db.prepare('PRAGMA table_info(accounts)').all() as { name: string }[]).map((c) => c.name);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (!columns.includes('starter')) {
        this.db.exec(`ALTER TABLE accounts ADD COLUMN starter INTEGER NOT NULL DEFAULT ${EARLIER_STARTER_MICROS}`);
      }
      this.db
        .prepare('UPDATE accounts SET balance = balance + (? - starter), granted = granted + (? - starter), starter = ? WHERE starter < ?')
        .run(this.starter, this.starter, this.starter, this.starter);
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /**
   * Databases from the shift-pack days count shifts. Unplayed shifts become credit: a free one is worth
   * the starter, a bought one what it cost (LEGACY_SHIFT_MICROS), and a pack's purchase the credit it
   * gave, so refunding it still takes back what it added.
   */
  private migrate(): void {
    const columns = (table: string) => (this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
    const accounts = columns('accounts');
    const purchases = columns('purchases');
    if (accounts.includes('balance') && !purchases.includes('shifts')) return;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (!accounts.includes('balance')) {
        this.db.exec('ALTER TABLE accounts ADD COLUMN balance INTEGER NOT NULL DEFAULT 0');
        this.db.exec('ALTER TABLE accounts ADD COLUMN granted INTEGER NOT NULL DEFAULT 0');
      }
      if (accounts.includes('free_shifts')) {
        this.db
          .prepare('UPDATE accounts SET balance = free_shifts * ? + paid_shifts * ?')
          .run(this.starter, LEGACY_SHIFT_MICROS);
        this.db.exec('UPDATE accounts SET granted = balance');
        this.db.exec('ALTER TABLE accounts DROP COLUMN free_shifts');
        this.db.exec('ALTER TABLE accounts DROP COLUMN paid_shifts');
      }
      if (purchases.includes('shifts')) {
        if (!purchases.includes('credit')) this.db.exec('ALTER TABLE purchases ADD COLUMN credit INTEGER NOT NULL DEFAULT 0');
        this.db.prepare('UPDATE purchases SET credit = shifts * ?').run(LEGACY_SHIFT_MICROS);
        this.db.exec('ALTER TABLE purchases DROP COLUMN shifts');
      }
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  get(id: string): Account | null {
    const row = this.db
      .prepare(
        `SELECT a.*, EXISTS (SELECT 1 FROM purchases p WHERE p.account_id = a.id AND p.status = 'paid' AND p.credit > 0) AS topped_up
         FROM accounts a WHERE a.id = ?`,
      )
      .get(id) as Row | undefined;
    return row ? toAccount(row) : null;
  }

  /** Credit left, in micro-dollars; 0 for an unknown account. */
  balance(id: string): number {
    const row = this.db.prepare('SELECT balance FROM accounts WHERE id = ?').get(id) as { balance: number } | undefined;
    return row?.balance ?? 0;
  }

  /**
   * The account of someone signing in: the one this identity already has, else the one with the same
   * verified email (so Google and GitHub with one address are one account), else a new one with the
   * starter credit.
   */
  signIn(provider: Provider, subject: string, email: string, name: string): { account: Account; created: boolean } {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const known = this.db
        .prepare('SELECT account_id FROM identities WHERE provider = ? AND subject = ?')
        .get(provider, subject) as { account_id: string } | undefined;
      let id = known?.account_id;
      let created = false;
      if (!id && email) {
        const same = this.db
          .prepare('SELECT id FROM accounts WHERE lower(email) = lower(?) ORDER BY created_at LIMIT 1')
          .get(email) as { id: string } | undefined;
        id = same?.id;
      }
      if (!id) {
        id = randomBytes(12).toString('base64url');
        created = true;
        this.db
          .prepare('INSERT INTO accounts (id, email, name, balance, granted, starter, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(id, email, name, this.starter, this.starter, this.starter, this.now());
      }
      if (!known) this.db.prepare('INSERT INTO identities (provider, subject, account_id) VALUES (?, ?, ?)').run(provider, subject, id);
      if (name) this.db.prepare("UPDATE accounts SET name = ? WHERE id = ? AND name = ''").run(name, id);
      this.db.exec('COMMIT');
      return { account: this.get(id)!, created };
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /** Takes the price of a model call off the balance; it never goes below 0 (the last call may cost more than was left). */
  charge(id: string, micros: number): void {
    if (!(micros > 0)) return;
    this.db.prepare('UPDATE accounts SET balance = max(0, balance - ?) WHERE id = ?').run(Math.ceil(micros), id);
  }

  /** Notes that this account is about to pay, so the license can find it by the buyer's email. */
  openCheckout(accountId: string, email: string): void {
    this.db
      .prepare('INSERT INTO checkouts (id, account_id, email, created_at) VALUES (?, ?, ?, ?)')
      .run(randomBytes(9).toString('base64url'), accountId, email, this.now());
  }

  /** The account a license belongs to: already credited, already claimed, or the latest open checkout with this email. */
  ownerOf(licenseId: string, email: string): string | null {
    const bought = this.db.prepare('SELECT account_id FROM purchases WHERE license_id = ?').get(licenseId) as { account_id: string } | undefined;
    if (bought) return bought.account_id;
    const claimed = this.db.prepare('SELECT account_id FROM checkouts WHERE license_id = ?').get(licenseId) as { account_id: string } | undefined;
    if (claimed) return claimed.account_id;
    if (!email) return null;
    const open = this.db
      .prepare(
        'SELECT id, account_id FROM checkouts WHERE lower(email) = lower(?) AND license_id IS NULL AND created_at > ? ORDER BY created_at DESC LIMIT 1',
      )
      .get(email, this.now() - CLAIM_MS) as { id: string; account_id: string } | undefined;
    if (!open) return null;
    this.db.prepare('UPDATE checkouts SET license_id = ? WHERE id = ?').run(licenseId, open.id);
    return open.account_id;
  }

  /**
   * Adds a top-up's credit once per license; the new balance becomes what "% left" counts from.
   * Returns false when this license was already credited.
   */
  credit(licenseId: string, accountId: string, micros: number): boolean {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const done = this.db.prepare('SELECT 1 FROM purchases WHERE license_id = ?').get(licenseId);
      if (done) {
        this.db.exec('COMMIT');
        return false;
      }
      this.db
        .prepare("INSERT INTO purchases (license_id, account_id, credit, status, created_at) VALUES (?, ?, ?, 'paid', ?)")
        .run(licenseId, accountId, micros, this.now());
      this.db.prepare('UPDATE accounts SET balance = balance + ?, granted = balance + ? WHERE id = ?').run(micros, micros, accountId);
      this.db.exec('COMMIT');
      return true;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  /** A refunded top-up takes back its credit, as much as is left. Returns the account, or null when nothing changed. */
  refund(licenseId: string): string | null {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const p = this.db
        .prepare("SELECT account_id, credit FROM purchases WHERE license_id = ? AND status = 'paid'")
        .get(licenseId) as { account_id: string; credit: number } | undefined;
      if (p) {
        this.db.prepare("UPDATE purchases SET status = 'refunded' WHERE license_id = ?").run(licenseId);
        this.db.prepare('UPDATE accounts SET balance = max(0, balance - ?) WHERE id = ?').run(p.credit, p.account_id);
      }
      this.db.exec('COMMIT');
      return p?.account_id ?? null;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  close(): void {
    this.db.close();
  }
}
