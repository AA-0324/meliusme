// ─── Periodic local DB / storage cleanup ───────────────────────────
// Trims aged-out records to keep IndexedDB + localStorage lean.
// Safe to run repeatedly — only deletes data we no longer need.

import { encrypt, decrypt, isEncrypted } from './crypto';
import { getAllWaterData } from './db';

const CLEANUP_KEY = 'melius-last-cleanup';
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // once per day

const XP_LEDGER_KEY = 'melius-xp-ledger';
const TEMP_UNLOCKS_KEY = 'melius-temp-pro-unlocks';
const EDIT_HISTORY_KEY = 'melius-meal-edits';
const WATER_KEY = 'melius-water';
const GOAL_TOAST_PREFIX = 'meliusme-goal-toasts-';
const DAILY_XP_AWARDED_PREFIX = 'melius-daily-xp-awarded-';
const CONFETTI_PREFIX = 'melius-confetti-';

const KEEP_LEDGER_DAYS = 60;
const KEEP_WATER_DAYS = 365;
const KEEP_EDIT_DAYS = 90;

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

async function readEnc<T>(key: string, fallback: T): Promise<T> {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  let plaintext = raw;
  if (isEncrypted(raw)) {
    try { plaintext = await decrypt(raw); } catch { return fallback; }
  }
  try { return JSON.parse(plaintext) as T; } catch { return fallback; }
}

async function writeEnc(key: string, value: unknown): Promise<void> {
  try { localStorage.setItem(key, await encrypt(JSON.stringify(value))); }
  catch { localStorage.setItem(key, JSON.stringify(value)); }
}

export async function runCleanup(force = false): Promise<void> {
  try {
    if (!force) {
      const last = parseInt(localStorage.getItem(CLEANUP_KEY) || '0', 10);
      if (Date.now() - last < CLEANUP_INTERVAL_MS) return;
    }

    const ledgerCutoff = daysAgoISO(KEEP_LEDGER_DAYS);
    const waterCutoff = daysAgoISO(KEEP_WATER_DAYS);
    const editCutoffMs = Date.now() - KEEP_EDIT_DAYS * 24 * 60 * 60 * 1000;
    const today = new Date().toISOString().split('T')[0];

    // XP ledger
    const ledger = await readEnc<Array<{ date: string; amount: number; source: string }>>(XP_LEDGER_KEY, []);
    const newLedger = ledger.filter(e => e.date >= ledgerCutoff);
    if (newLedger.length !== ledger.length) await writeEnc(XP_LEDGER_KEY, newLedger);

    // Expired temp Pro unlocks
    const unlocks = await readEnc<Array<{ expiresAt: number }>>(TEMP_UNLOCKS_KEY, []);
    const now = Date.now();
    const active = unlocks.filter(u => u.expiresAt > now);
    if (active.length !== unlocks.length) await writeEnc(TEMP_UNLOCKS_KEY, active);

    // Meal edit history
    const edits = await readEnc<Array<{ timestamp: number }>>(EDIT_HISTORY_KEY, []);
    const newEdits = edits.filter(e => e.timestamp >= editCutoffMs);
    if (newEdits.length !== edits.length) await writeEnc(EDIT_HISTORY_KEY, newEdits);

    // Water records older than retention
    try {
      const water = await getAllWaterData();
      let changed = false;
      const trimmed: Record<string, number> = {};
      for (const [date, g] of Object.entries(water)) {
        if (date >= waterCutoff) trimmed[date] = g as number;
        else changed = true;
      }
      if (changed) await writeEnc(WATER_KEY, trimmed);
    } catch { }

    // Per-day session flags from prior days (cheap, sessionStorage may carry these)
    const dropPrefixes = [GOAL_TOAST_PREFIX, DAILY_XP_AWARDED_PREFIX, CONFETTI_PREFIX];
    for (const store of [localStorage, sessionStorage]) {
      const toRemove: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (!k) continue;
        for (const p of dropPrefixes) {
          if (k.startsWith(p) && !k.endsWith(today)) toRemove.push(k);
        }
      }
      toRemove.forEach(k => store.removeItem(k));
    }

    localStorage.setItem(CLEANUP_KEY, Date.now().toString());
  } catch (err) {
    console.warn('[cleanup] non-fatal:', err);
  }
}
