import type { TopicInfo } from "./routes";

const PREFIX = "linuxdo-ultimate:view:v1:";
const PENDING_TTL_MS = 30_000;
const DONE_TTL_MS = 8 * 60 * 60 * 1_000;
const FETCH_TIMEOUT_MS = 8_000;
const TRACKING_SESSION_KEY = `${PREFIX}session-id`;
const LOCK_INDEX_KEY = `${PREFIX}lock-index`;

export type TrackSource = "split-open" | "restored-tab" | "browser-open" | "topic-fallback" | "manual-retry";
export type TrackStatus = "confirmed" | "accepted" | "failed" | "skipped";

export interface TrackResult {
  status: TrackStatus;
  confirmedBy?: "pageview" | "topic-json";
}

interface LockState {
  status: "pending" | "confirmed" | "accepted";
  token: string;
  source: TrackSource;
  expiresAt: number;
}

export interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MemoryWebStorage implements WebStorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
  keys(): string[] { return [...this.values.keys()]; }
}

interface ViewTrackerOptions {
  storage: WebStorageLike;
  fetcher?: typeof fetch;
  now?: () => number;
  csrfToken: () => string;
  trackingSessionId: () => string;
  basePath?: () => string;
  timeoutMs?: number;
  beforeClaimConfirmation?: () => void;
}

interface AttemptResult {
  ok: boolean;
  confirmed: boolean;
}

export class ViewTracker {
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private readonly timeoutMs: number;
  private readonly memoryLocks = new Map<string, LockState>();

  constructor(private readonly options: ViewTrackerOptions) {
    this.fetcher = options.fetcher ?? fetch.bind(globalThis);
    this.now = options.now ?? Date.now;
    this.timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS;
  }

  async track(info: TopicInfo, source: TrackSource, referrerUrl: string, force = false): Promise<TrackResult> {
    if (info.url.origin !== "https://linux.do") return { status: "skipped" };
    const token = this.claim(info, source, force);
    if (!token) return { status: "skipped" };
    this.options.beforeClaimConfirmation?.();
    if (!this.owns(info, token)) return { status: "skipped" };

    const attempts: AttemptResult[] = [];
    try {
      const pageview = await this.sendPageview(info, referrerUrl);
      attempts.push(pageview);
      if (pageview.confirmed) {
        this.complete(info, token, source, "confirmed");
        return { status: "confirmed", confirmedBy: "pageview" };
      }
    } catch {
      attempts.push({ ok: false, confirmed: false });
    }

    try {
      const fallback = await this.sendTopicJson(info);
      attempts.push(fallback);
      if (fallback.confirmed) {
        this.complete(info, token, source, "confirmed");
        return { status: "confirmed", confirmedBy: "topic-json" };
      }
    } catch {
      attempts.push({ ok: false, confirmed: false });
    }

    if (attempts.some((attempt) => attempt.ok)) {
      this.complete(info, token, source, "accepted");
      return { status: "accepted" };
    }

    this.clearIfOwned(info, token);
    return { status: "failed" };
  }

  private stateKey(info: TopicInfo): string {
    return `${PREFIX}${info.url.hostname}:${info.topicId}`;
  }

  private readState(info: TopicInfo): LockState | null {
    const key = this.stateKey(info);
    try {
      const stored = JSON.parse(this.options.storage.getItem(key) ?? "null") as LockState | null;
      return stored ?? this.memoryLocks.get(key) ?? null;
    } catch {
      return this.memoryLocks.get(key) ?? null;
    }
  }

  private claim(info: TopicInfo, source: TrackSource, force: boolean): string | null {
    this.cleanupExpiredLocks();
    const existing = this.readState(info);
    if (!force && existing?.expiresAt && existing.expiresAt > this.now()) return null;
    const token = globalThis.crypto?.randomUUID?.() ?? `${this.now()}-${Math.random().toString(36).slice(2)}`;
    const state = {
      status: "pending",
      token,
      source,
      expiresAt: this.now() + PENDING_TTL_MS,
    } satisfies LockState;
    this.writeState(this.stateKey(info), state);
    return this.owns(info, token) ? token : null;
  }

  private complete(info: TopicInfo, token: string, source: TrackSource, status: "confirmed" | "accepted"): void {
    this.writeState(this.stateKey(info), {
      status,
      token,
      source,
      expiresAt: this.now() + DONE_TTL_MS,
    });
  }

  private clearIfOwned(info: TopicInfo, token: string): void {
    if (this.readState(info)?.token === token) this.removeState(this.stateKey(info));
  }

  private owns(info: TopicInfo, token: string): boolean {
    return this.readState(info)?.token === token;
  }

  private writeState(key: string, state: LockState): void {
    this.memoryLocks.set(key, state);
    try {
      this.options.storage.setItem(key, JSON.stringify(state));
      const entries = this.readLockIndex().filter((entry) => entry.key !== key);
      entries.push({ key, expiresAt: state.expiresAt });
      this.options.storage.setItem(LOCK_INDEX_KEY, JSON.stringify(entries));
    } catch {
      // The in-memory lock still prevents duplicate requests in this document.
    }
  }

  private removeState(key: string): void {
    this.memoryLocks.delete(key);
    try {
      this.options.storage.removeItem(key);
      this.options.storage.setItem(
        LOCK_INDEX_KEY,
        JSON.stringify(this.readLockIndex().filter((entry) => entry.key !== key)),
      );
    } catch {
      // Storage can be unavailable in private mode; memory cleanup is sufficient there.
    }
  }

  private readLockIndex(): Array<{ key: string; expiresAt: number }> {
    try {
      const value = JSON.parse(this.options.storage.getItem(LOCK_INDEX_KEY) ?? "[]") as unknown;
      if (!Array.isArray(value)) return [];
      return value.filter((entry): entry is { key: string; expiresAt: number } => Boolean(
        entry && typeof entry === "object"
          && typeof (entry as { key?: unknown }).key === "string"
          && typeof (entry as { expiresAt?: unknown }).expiresAt === "number",
      ));
    } catch {
      return [];
    }
  }

  private cleanupExpiredLocks(): void {
    const now = this.now();
    for (const [key, state] of this.memoryLocks) {
      if (state.expiresAt <= now) this.memoryLocks.delete(key);
    }
    const entries = this.readLockIndex();
    const retained = entries.filter((entry) => {
      if (entry.expiresAt > now) return true;
      try { this.options.storage.removeItem(entry.key); } catch { /* ignore */ }
      return false;
    });
    if (retained.length !== entries.length) {
      try { this.options.storage.setItem(LOCK_INDEX_KEY, JSON.stringify(retained)); } catch { /* ignore */ }
    }
  }

  private commonHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      "Discourse-Present": "true",
    };
    const csrf = this.options.csrfToken();
    if (csrf) headers["X-CSRF-Token"] = csrf;
    return headers;
  }

  private async sendPageview(info: TopicInfo, referrerUrl: string): Promise<AttemptResult> {
    const headers = {
      ...this.commonHeaders(),
      "Discourse-Track-View-Deferred": "true",
      "Discourse-Track-View-Topic-Id": info.topicId,
      "Discourse-Track-View-Url": info.url.href,
      "Discourse-Track-View-Referrer": referrerUrl,
      "Discourse-Track-View-Session-Id": this.options.trackingSessionId(),
    };
    const response = await this.fetchWithTimeout(`${info.url.origin}${this.basePath()}/pageview`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      keepalive: true,
      headers,
    });
    return this.readAttempt(response);
  }

  private async sendTopicJson(info: TopicInfo): Promise<AttemptResult> {
    const response = await this.fetchWithTimeout(
      `${info.url.origin}${this.basePath()}/t/${info.topicId}.json?track_visit=true&forceLoad=true`,
      {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          ...this.commonHeaders(),
          "Discourse-Track-View": "true",
          "Discourse-Track-View-Topic-Id": info.topicId,
        },
      },
    );
    return this.readAttempt(response);
  }

  private basePath(): string {
    const value = this.options.basePath?.() ?? "";
    return value ? `/${value.replace(/^\/+|\/+$/g, "")}` : "";
  }

  private readAttempt(response: Response): AttemptResult {
    const trackView = response.headers.get("x-discourse-trackview");
    const browserPageView = response.headers.get("x-discourse-browserpageview");
    return {
      ok: response.ok,
      confirmed: trackView === "1" || browserPageView === "1",
    };
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetcher(url, { ...init, signal: controller.signal });
    } finally {
      globalThis.clearTimeout(timer);
    }
  }
}

export function createBrowserViewTracker(): ViewTracker {
  return new ViewTracker({
    storage: window.localStorage,
    csrfToken: () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "",
    trackingSessionId: () => getOrCreateTrackingSessionId(
      window.sessionStorage,
      document.querySelector<HTMLMetaElement>('meta[name="discourse-track-view-session-id"]')?.content ?? "",
    ),
    basePath: () => document.querySelector<HTMLMetaElement>('meta[name="discourse-base-uri"]')?.content ?? "",
  });
}

let memoryTrackingSessionId = "";

export function getOrCreateTrackingSessionId(storage: WebStorageLike, metaValue = "", createId = randomId): string {
  if (metaValue) return metaValue;
  try {
    const existing = storage.getItem(TRACKING_SESSION_KEY);
    if (existing) return existing;
    const value = createId();
    storage.setItem(TRACKING_SESSION_KEY, value);
    return value;
  } catch {
    if (!memoryTrackingSessionId) memoryTrackingSessionId = createId();
    return memoryTrackingSessionId;
  }
}

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
