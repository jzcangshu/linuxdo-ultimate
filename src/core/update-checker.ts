import type { StorageAdapter } from "./types";

export const UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/jzcangshu/linuxdo-ultimate/main/updates/latest.json";
const UPDATE_CACHE_KEY = "linuxdo-ultimate:update-cache";
const UPDATE_ATTEMPT_KEY = "linuxdo-ultimate:update-attempt";
const UPDATE_CACHE_TTL_MS = 24 * 60 * 60_000;
const UPDATE_FAILURE_COOLDOWN_MS = 60 * 60_000;

export interface UpdateManifest {
  schemaVersion: 1;
  version: string;
  publishedAt: string;
  releaseUrl: string;
  changelog: string[];
}

export type UpdateResult =
  | { status: "checking" }
  | { status: "available"; manifest: UpdateManifest }
  | { status: "current"; version: string }
  | { status: "error"; message: string };

export interface UpdateRequestOptions {
  method: "GET";
  url: string;
  headers: Record<string, string>;
  timeout: number;
  onload: (response: { status: number; responseText: string }) => void;
  onerror: (error: unknown) => void;
  ontimeout: () => void;
}

export type UpdateRequest = (options: UpdateRequestOptions) => { abort?: () => void };

interface CachedUpdate {
  checkedAt: number;
  checkedByVersion: string;
  manifest: UpdateManifest;
}

export function compareVersions(left: string, right: string): number {
  const parse = (value: string): [number, number, number] | null => {
    const match = value.trim().replace(/^v/i, "").match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  };
  const a = parse(left);
  const b = parse(right);
  if (!a || !b) return 0;
  for (let index = 0; index < a.length; index += 1) {
    const leftPart = a[index] ?? 0;
    const rightPart = b[index] ?? 0;
    if (leftPart !== rightPart) return leftPart > rightPart ? 1 : -1;
  }
  return 0;
}

export function validateUpdateManifest(value: unknown): UpdateManifest {
  if (!value || typeof value !== "object") throw new Error("更新清单格式无效");
  const source = value as Record<string, unknown>;
  const version = typeof source.version === "string" ? source.version : "";
  const publishedAt = typeof source.publishedAt === "string" ? source.publishedAt : "";
  const releaseUrl = typeof source.releaseUrl === "string" ? source.releaseUrl : "";
  const changelog = Array.isArray(source.changelog)
    ? source.changelog.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];
  if (source.schemaVersion !== 1 || !/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(version) || !publishedAt || changelog.length === 0) {
    throw new Error("更新清单内容不完整");
  }
  const parsedUrl = new URL(releaseUrl);
  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "github.com" || parsedUrl.pathname !== "/jzcangshu/linuxdo-ultimate/releases/tag/v" + version.replace(/^v/i, "")) {
    throw new Error("更新清单发布地址无效");
  }
  return { schemaVersion: 1, version, publishedAt, releaseUrl, changelog };
}

function defaultRequest(options: UpdateRequestOptions): { abort?: () => void } {
  if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest(options);
  let aborted = false;
  void fetch(options.url, { headers: options.headers, signal: AbortSignal.timeout(options.timeout) })
    .then(async (response) => {
      if (!aborted) options.onload({ status: response.status, responseText: await response.text() });
    })
    .catch((error: unknown) => { if (!aborted) options.onerror(error); });
  return { abort: () => { aborted = true; } };
}

export function getCurrentVersion(): string {
  try {
    if (typeof chrome !== "undefined") {
      const version = chrome.runtime?.getManifest?.().version;
      if (version) return version;
    }
  } catch { /* use the userscript metadata fallback */ }
  try {
    if (typeof GM_info !== "undefined" && GM_info.script.version) return GM_info.script.version;
  } catch { /* use the development fallback */ }
  return "0.0.0";
}

export class UpdateChecker {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly request: UpdateRequest = defaultRequest,
    private readonly currentVersion = getCurrentVersion(),
  ) {}

  async check(force = false): Promise<UpdateResult> {
    const now = Date.now();
    const cached = await Promise.resolve(this.storage.get<CachedUpdate | null>(UPDATE_CACHE_KEY, null));
    if (!force && cached?.checkedByVersion === this.currentVersion && now - cached.checkedAt < UPDATE_CACHE_TTL_MS) {
      return this.compare(cached.manifest);
    }
    const lastAttempt = await Promise.resolve(this.storage.get<number>(UPDATE_ATTEMPT_KEY, 0));
    if (!force && lastAttempt > 0 && now - lastAttempt < UPDATE_FAILURE_COOLDOWN_MS) {
      return cached ? this.compare(cached.manifest) : { status: "current", version: this.currentVersion };
    }
    this.storage.set(UPDATE_ATTEMPT_KEY, now);
    return new Promise<UpdateResult>((resolve) => {
      const finishError = (message: string) => resolve({ status: "error", message });
      this.request({
        method: "GET",
        url: force ? `${UPDATE_MANIFEST_URL}?t=${now}` : UPDATE_MANIFEST_URL,
        headers: { Accept: "application/json" },
        timeout: 10_000,
        onload: (response) => {
          if (response.status < 200 || response.status >= 300) { finishError(`HTTP ${response.status}`); return; }
          try {
            const manifest = validateUpdateManifest(JSON.parse(response.responseText));
            this.storage.set(UPDATE_CACHE_KEY, {
              checkedAt: now,
              checkedByVersion: this.currentVersion,
              manifest,
            } satisfies CachedUpdate);
            resolve(this.compare(manifest));
          } catch (error) {
            finishError(error instanceof Error ? error.message : "更新清单解析失败");
          }
        },
        onerror: () => finishError("网络连接失败"),
        ontimeout: () => finishError("请求超时"),
      });
    });
  }

  private compare(manifest: UpdateManifest): UpdateResult {
    return compareVersions(manifest.version, this.currentVersion) > 0
      ? { status: "available", manifest }
      : { status: "current", version: this.currentVersion };
  }
}
