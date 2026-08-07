import {
  DEFAULT_SETTINGS,
  LATEST_SESSION_CANDIDATE_KEY,
  LATEST_SESSION_KEY,
  SESSION_ID_KEY,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
  SESSION_OWNER_KEY_PREFIX,
  SETTINGS_KEY,
  normalizeSettings,
} from "./defaults";
import { createSession, normalizeSession } from "./session";
import type { SessionState, Settings, StorageAdapter } from "./types";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, unknown>();

  get<T>(key: string, fallback: T): T {
    return (this.values.get(key) as T | undefined) ?? fallback;
  }

  set<T>(key: string, value: T): void {
    this.values.set(key, value);
  }

  remove(key: string): void {
    this.values.delete(key);
  }

  keys(): string[] { return [...this.values.keys()]; }

  snapshot(): string { return JSON.stringify([...this.values.entries()]); }
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly area: Storage) {}

  get<T>(key: string, fallback: T): T {
    return safeJsonParse(this.area.getItem(key), fallback);
  }

  set<T>(key: string, value: T): void {
    try {
      this.area.setItem(key, JSON.stringify(value));
    } catch {
      // Quota/private-mode failures must not break the forum page.
    }
  }

  remove(key: string): void {
    try {
      this.area.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  }
}

export class UserscriptStorage implements StorageAdapter {
  private readonly backend: "userscript" | "local" = typeof GM_getValue === "function"
    && typeof GM_setValue === "function"
    && typeof GM_deleteValue === "function"
    ? "userscript"
    : "local";

  get<T>(key: string, fallback: T): T {
    if (this.backend === "userscript") {
      try { return GM_getValue(key, fallback) as T; } catch { return fallback; }
    }
    try {
      return safeJsonParse(window.localStorage.getItem(key), fallback);
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    if (this.backend === "userscript") {
      try { GM_setValue(key, value); } catch { /* keep one authoritative backend */ }
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage failures.
    }
  }

  remove(key: string): void {
    if (this.backend === "userscript") {
      try { GM_deleteValue(key); } catch { /* keep one authoritative backend */ }
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  }
}

export function getSessionId(storage: Storage = window.sessionStorage): string {
  try {
    const existing = storage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    storage.setItem(SESSION_ID_KEY, value);
    return value;
  } catch {
    return "ephemeral";
  }
}

export interface SessionLease {
  sessionId: string;
  ownerId: string;
}

export function isReloadNavigation(
  performanceApi: Pick<Performance, "getEntriesByType"> = window.performance,
): boolean {
  try {
    const navigation = performanceApi.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return navigation?.type === "reload";
  } catch {
    return false;
  }
}

interface StoredSessionOwner {
  ownerId: string;
  updatedAt: number;
}

const SESSION_OWNER_TTL_MS = 5 * 60_000;
const SESSION_RETENTION_MS = 30 * 24 * 60 * 60_000;
const MAX_RESTORABLE_SESSIONS = 8;

interface SessionIndexEntry { sessionId: string; updatedAt: number }
interface RestorableSessionEntry { session: SessionState; closedAt: number }

function readRestorableSessions(storage: StorageAdapter): RestorableSessionEntry[] {
  const candidate = storage.get<unknown | null>(LATEST_SESSION_CANDIDATE_KEY, null);
  if (Array.isArray(candidate)) {
    return candidate.filter((entry): entry is RestorableSessionEntry => Boolean(
      entry && typeof entry === "object"
        && typeof (entry as RestorableSessionEntry).closedAt === "number"
        && (entry as RestorableSessionEntry).session
        && typeof (entry as RestorableSessionEntry).session.sessionId === "string",
    ));
  }
  const legacy = [candidate, storage.get<unknown | null>(LATEST_SESSION_KEY, null)]
    .filter((value): value is SessionState => Boolean(
      value && typeof value === "object" && typeof (value as SessionState).sessionId === "string",
    ));
  return legacy.map((session) => ({ session, closedAt: session.updatedAt || 0 }));
}

function writeRestorableSessions(storage: StorageAdapter, entries: RestorableSessionEntry[]): void {
  storage.set(LATEST_SESSION_CANDIDATE_KEY, entries);
  storage.remove(LATEST_SESSION_KEY);
}

function readSessionIndex(storage: StorageAdapter): SessionIndexEntry[] {
  const value = storage.get<unknown>(SESSION_INDEX_KEY, []);
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is SessionIndexEntry => Boolean(
    entry && typeof entry === "object"
      && typeof (entry as SessionIndexEntry).sessionId === "string"
      && typeof (entry as SessionIndexEntry).updatedAt === "number",
  ));
}

function writeSessionIndex(storage: StorageAdapter, entries: SessionIndexEntry[]): void {
  storage.set(SESSION_INDEX_KEY, entries);
}

function touchSessionIndex(storage: StorageAdapter, sessionId: string, updatedAt: number): void {
  const entries = readSessionIndex(storage).filter((entry) => entry.sessionId !== sessionId);
  entries.push({ sessionId, updatedAt });
  writeSessionIndex(storage, entries);
}

export function claimSessionId(
  storage: StorageAdapter,
  tabStorage: Storage = window.sessionStorage,
  now = Date.now(),
  reuseExistingSession = false,
): SessionLease {
  let sessionId = getSessionId(tabStorage);
  const existing = storage.get<StoredSessionOwner | null>(`${SESSION_OWNER_KEY_PREFIX}${sessionId}`, null) as StoredSessionOwner | null;
  if (!reuseExistingSession && existing && now >= existing.updatedAt && now - existing.updatedAt < SESSION_OWNER_TTL_MS) {
    sessionId = createUniqueId();
    try {
      tabStorage.setItem(SESSION_ID_KEY, sessionId);
    } catch {
      // Ephemeral mode remains isolated for the current document.
    }
  }
  const lease = { sessionId, ownerId: createUniqueId() };
  storage.set(`${SESSION_OWNER_KEY_PREFIX}${sessionId}`, { ownerId: lease.ownerId, updatedAt: now } satisfies StoredSessionOwner);
  return lease;
}

export function refreshSessionLease(storage: StorageAdapter, lease: SessionLease, now = Date.now()): void {
  const owner = storage.get<StoredSessionOwner | null>(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`, null) as StoredSessionOwner | null;
  if (owner?.ownerId === lease.ownerId) {
    storage.set(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`, { ...owner, updatedAt: now });
    touchSessionIndex(storage, lease.sessionId, now);
  }
}

export function releaseSessionLease(storage: StorageAdapter, lease: SessionLease): void {
  const owner = storage.get<StoredSessionOwner | null>(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`, null) as StoredSessionOwner | null;
  if (owner?.ownerId === lease.ownerId) storage.remove(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`);
}

function createUniqueId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadSettings(storage: StorageAdapter): Settings {
  return normalizeSettings(storage.get(SETTINGS_KEY, DEFAULT_SETTINGS));
}

export function saveSettings(storage: StorageAdapter, settings: Settings): void {
  storage.set(SETTINGS_KEY, normalizeSettings(settings));
}

export function loadSession(storage: StorageAdapter, sessionId: string, listUrl: string, now: number): SessionState {
  return loadSessionIfPresent(storage, sessionId, listUrl, now) ?? createSession(sessionId, listUrl, now);
}

export function loadSessionIfPresent(
  storage: StorageAdapter,
  sessionId: string,
  listUrl: string,
  now: number,
): SessionState | null {
  const stored = storage.get<unknown | null>(`${SESSION_KEY_PREFIX}${sessionId}`, null);
  if (stored === null || stored === undefined) return null;
  return normalizeSession(stored, createSession(sessionId, listUrl, now));
}

export function loadLatestSession(
  storage: StorageAdapter,
  sessionId: string,
  listUrl: string,
  now: number,
): SessionState | null {
  const entry = readRestorableSessions(storage)
    .filter((candidate) => candidate.session.sessionId !== sessionId)
    .sort((a, b) => a.closedAt - b.closedAt)
    .at(-1);
  if (!entry) return null;
  const normalized = normalizeSession(entry.session, createSession(sessionId, listUrl, now));
  if (normalized.sessionId !== sessionId) clearSession(storage, normalized.sessionId);
  clearRestorableSessions(storage);
  if (normalized.tabs.length === 0) return null;
  return { ...normalized, sessionId };
}

export function saveSession(storage: StorageAdapter, session: SessionState): void {
  storage.set(`${SESSION_KEY_PREFIX}${session.sessionId}`, session);
  touchSessionIndex(storage, session.sessionId, session.updatedAt);
}

export function stageSessionClose(storage: StorageAdapter, session: SessionState, closedAt = Date.now()): void {
  if (session.tabs.length === 0) return;
  const entries = readRestorableSessions(storage).filter((entry) => entry.session.sessionId !== session.sessionId);
  entries.push({ session, closedAt });
  writeRestorableSessions(storage, entries.sort((a, b) => a.closedAt - b.closedAt).slice(-MAX_RESTORABLE_SESSIONS));
}

export function reconcileSessionClose(storage: StorageAdapter, sessionId: string): void {
  const restorable = readRestorableSessions(storage).filter((entry) => entry.session.sessionId !== sessionId);
  if (restorable.length > 0) writeRestorableSessions(storage, restorable);
  else clearRestorableSessions(storage);
}

export function cleanupExpiredSessions(storage: StorageAdapter, now = Date.now()): void {
  const retained: SessionIndexEntry[] = [];
  for (const entry of readSessionIndex(storage)) {
    if (now - entry.updatedAt >= SESSION_RETENTION_MS) {
      storage.remove(`${SESSION_KEY_PREFIX}${entry.sessionId}`);
      storage.remove(`${SESSION_OWNER_KEY_PREFIX}${entry.sessionId}`);
    } else {
      retained.push(entry);
    }
  }
  writeSessionIndex(storage, retained);
}

export function clearRestorableSessions(storage: StorageAdapter): void {
  storage.remove(LATEST_SESSION_CANDIDATE_KEY);
  storage.remove(LATEST_SESSION_KEY);
}

export function clearSession(storage: StorageAdapter, sessionId: string): void {
  storage.remove(`${SESSION_KEY_PREFIX}${sessionId}`);
  storage.remove(`${SESSION_OWNER_KEY_PREFIX}${sessionId}`);
  writeSessionIndex(storage, readSessionIndex(storage).filter((entry) => entry.sessionId !== sessionId));
}
