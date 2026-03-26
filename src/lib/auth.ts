import type { UserSession } from '../types';

const ACCOUNTS = 'sbu-foodfinder-accounts';
const SESSION = 'sbu-foodfinder-session';

export function isStonyBrookEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return e.endsWith('@stonybrook.edu');
}

interface StoredAccount {
  email: string;
  displayName: string;
  password: string;
}

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS);
    if (!raw) return [];
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(a: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS, JSON.stringify(a));
}

export function getSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION);
    if (!raw) return null;
    const v = JSON.parse(raw) as UserSession;
    if (v && typeof v.email === 'string' && typeof v.displayName === 'string') return v;
    return null;
  } catch {
    return null;
  }
}

export function setSession(u: UserSession | null) {
  if (!u) localStorage.removeItem(SESSION);
  else localStorage.setItem(SESSION, JSON.stringify(u));
}

export function signUp(email: string, password: string, displayName: string): { ok: true } | { ok: false; error: string } {
  const em = email.trim().toLowerCase();
  if (!isStonyBrookEmail(em)) {
    return { ok: false, error: 'Use your @stonybrook.edu email address.' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters (demo app — do not reuse a real password).' };
  }
  const name = displayName.trim() || em.split('@')[0];
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === em)) {
    return { ok: false, error: 'An account with this email already exists. Sign in instead.' };
  }
  accounts.push({ email: em, displayName: name, password });
  writeAccounts(accounts);
  setSession({ email: em, displayName: name });
  return { ok: true };
}

export function signIn(email: string, password: string): { ok: true } | { ok: false; error: string } {
  const em = email.trim().toLowerCase();
  const accounts = readAccounts();
  const hit = accounts.find((a) => a.email === em);
  if (!hit || hit.password !== password) {
    return { ok: false, error: 'Email or password is incorrect.' };
  }
  setSession({ email: hit.email, displayName: hit.displayName });
  return { ok: true };
}

export function signOut() {
  setSession(null);
}
