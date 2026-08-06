import {
  DEFAULT_SETTINGS,
  LATEST_SESSION_CANDIDATE_KEY,
  LATEST_SESSION_KEY,
  SESSION_ID_KEY,
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
  get<T>(key: string, fallback: T): T {
    try {
      if (typeof GM_getValue === "function") return GM_getValue(key, fallback) as T;
    } catch {
      // Fall through to local storage.
    }
    try {
      return safeJsonParse(window.localStorage.getItem(key), fallback);
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(key, value);
        return;
      }
    } catch {
      // Fall through to local storage.
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage failures.
    }
  }

  remove(key: string): void {
    try {
      if (typeof GM_deleteValue === "function") {
        GM_deleteValue(key);
        return;
      }
    } catch {
      // Fall through to local storage.
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
  const candidate = storage.get<unknown | null>(LATEST_SESSION_CANDIDATE_KEY, null);
  const confirmed = storage.get<unknown | null>(LATEST_SESSION_KEY, null);
  const stored = candidate ?? confirmed;
  if (stored === null || stored === undefined) return null;
  const normalized = normalizeSession(stored, createSession(sessionId, listUrl, now));
  clearRestorableSessions(storage);
  if (normalized.tabs.length === 0) return null;
  return { ...normalized, sessionId };
}

export function saveSession(storage: StorageAdapter, session: SessionState): void {
  storage.set(`${SESSION_KEY_PREFIX}${session.sessionId}`, session);
}

export function stageSessionClose(storage: StorageAdapter, session: SessionState): void {
  if (session.tabs.length === 0) return;
  const previous = storage.get<SessionState | null>(LATEST_SESSION_CANDIDATE_KEY, null) as SessionState | null;
  if (previous && previous.sessionId !== session.sessionId && previous.tabs?.length) {
    storage.set(LATEST_SESSION_KEY, previous);
  }
  storage.set(LATEST_SESSION_CANDIDATE_KEY, session);
}

export function reconcileSessionClose(storage: StorageAdapter, sessionId: string): void {
  const candidate = storage.get<SessionState | null>(LATEST_SESSION_CANDIDATE_KEY, null) as SessionState | null;
  if (candidate?.sessionId === sessionId) storage.remove(LATEST_SESSION_CANDIDATE_KEY);
}

export function clearRestorableSessions(storage: StorageAdapter): void {
  storage.remove(LATEST_SESSION_CANDIDATE_KEY);
  storage.remove(LATEST_SESSION_KEY);
}

export function clearSession(storage: StorageAdapter, sessionId: string): void {
  storage.remove(`${SESSION_KEY_PREFIX}${sessionId}`);
}
