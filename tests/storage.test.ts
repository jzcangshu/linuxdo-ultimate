import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/core/defaults";
import {
  MemoryStorage,
  claimSessionId,
  clearRestorableSessions,
  clearSession,
  isReloadNavigation,
  loadLatestSession,
  loadSession,
  loadSessionIfPresent,
  loadSettings,
  reconcileSessionClose,
  releaseSessionLease,
  saveSession,
  saveSettings,
  stageSessionClose,
} from "../src/core/storage";
import { createSession } from "../src/core/session";

describe("storage", () => {
  it("normalizes malformed settings without changing defaults", () => {
    const settings = normalizeSettings({ layoutPreference: "invalid", paneSizes: { sidebar: 2 } });
    expect(settings.layoutPreference).toBe("auto");
    expect(settings.paneSizes.sidebar).toBe(160);
    expect(settings.previewEnabled).toBe(false);
    expect(settings.creditEnabled).toBe(true);
    expect(settings.restoreSession).toBe(false);
    expect(settings.colorizeTabs).toBe(true);
  });

  it("migrates legacy settings to opt-in restoration and an active internal runtime", () => {
    const settings = normalizeSettings({
      schemaVersion: 1,
      enabled: false,
      restoreSession: true,
      previewEnabled: true,
    });
    expect(settings.schemaVersion).toBe(2);
    expect(settings.enabled).toBe(true);
    expect(settings.restoreSession).toBe(false);
    expect(settings.previewEnabled).toBe(true);
  });

  it("preserves an explicit restoration choice after schema version 2 migration", () => {
    expect(normalizeSettings({ schemaVersion: 2, restoreSession: true }).restoreSession).toBe(true);
    expect(normalizeSettings({ schemaVersion: 2, restoreSession: false }).restoreSession).toBe(false);
  });

  it("keeps tab category coloring enabled by default and preserves an explicit opt-out", () => {
    expect(normalizeSettings({ schemaVersion: 2 }).colorizeTabs).toBe(true);
    expect(normalizeSettings({ schemaVersion: 2, colorizeTabs: false }).colorizeTabs).toBe(false);
  });

  it("migrates legacy pixel list widths to the adaptive default", () => {
    const settings = normalizeSettings({ paneSizes: { sidebar: 216, list: 500 } });
    expect(settings.paneSizes).toEqual({ sidebar: 216, listRatio: 0.35 });
  });

  it("persists a user-dragged pane ratio as a long-term setting", () => {
    const storage = new MemoryStorage();
    saveSettings(storage, { ...DEFAULT_SETTINGS, paneSizes: { sidebar: 232, listRatio: 0.42 } });
    expect(loadSettings(storage).paneSizes).toEqual({ sidebar: 232, listRatio: 0.42 });
  });

  it("allows up to ten live topic pages", () => {
    expect(normalizeSettings({ maxLiveFrames: 10 }).maxLiveFrames).toBe(10);
    expect(normalizeSettings({ maxLiveFrames: 99 }).maxLiveFrames).toBe(10);
  });

  it("round-trips settings and session state", () => {
    const storage = new MemoryStorage();
    const settings = { ...DEFAULT_SETTINGS, previewEnabled: true };
    const session = createSession("a", "https://linux.do/latest", 1);
    saveSettings(storage, settings);
    saveSession(storage, session);
    expect(loadSettings(storage).previewEnabled).toBe(true);
    expect(loadSession(storage, "a", "/", 2)).toEqual(session);
    clearSession(storage, "a");
    expect(loadSession(storage, "a", "/", 2).listUrl).toBe("/");
  });

  it("restores the current browser-tab session independently of the next-visit preference", () => {
    const storage = new MemoryStorage();
    const session = createSession("current-tab", "https://linux.do/latest", 10);
    session.tabs.push({
      id: "topic-42",
      topicId: "42",
      url: "https://linux.do/t/topic/42",
      title: "Current topic",
      scrollY: 120,
      suspended: false,
      lastActiveAt: 11,
    });
    session.activeTabId = "topic-42";
    saveSession(storage, session);

    expect(loadSessionIfPresent(storage, "current-tab", "/", 20)?.tabs).toHaveLength(1);
    expect(loadSessionIfPresent(storage, "new-tab", "/", 20)).toBeNull();
  });

  it("gives a copied browser tab its own session while preserving normal refresh identity", () => {
    const storage = new MemoryStorage();
    const originalTab = new TestTabStorage();
    originalTab.setItem("linuxdo-ultimate:session-id", "copied-session");
    const copiedTab = new TestTabStorage(originalTab);

    const original = claimSessionId(storage, originalTab, 1_000);
    const copied = claimSessionId(storage, copiedTab, 1_001);
    expect(copied.sessionId).not.toBe(original.sessionId);

    releaseSessionLease(storage, original);
    const refreshed = claimSessionId(storage, originalTab, 1_002);
    expect(refreshed.sessionId).toBe(original.sessionId);
  });

  it("recognizes only an explicit reload navigation", () => {
    const performanceApi = (type: NavigationTimingType) => ({
      getEntriesByType: () => [{ type } as PerformanceNavigationTiming],
    });

    expect(isReloadNavigation(performanceApi("reload"))).toBe(true);
    expect(isReloadNavigation(performanceApi("navigate"))).toBe(false);
    expect(isReloadNavigation(performanceApi("back_forward"))).toBe(false);
  });

  it("rebases an opted-in previous session onto the new browser tab", () => {
    const storage = new MemoryStorage();
    const previous = createSession("closed-tab", "https://linux.do/c/develop/4", 10);
    previous.tabs.push({ id: "topic-1", topicId: "1", url: "https://linux.do/t/topic/1", title: "Closed", scrollY: 0, suspended: false, lastActiveAt: 11 });
    previous.activeTabId = "topic-1";
    saveSession(storage, previous);
    stageSessionClose(storage, previous);

    expect(loadLatestSession(storage, "new-tab", "https://linux.do/", 20)).toMatchObject({
      sessionId: "new-tab",
      listUrl: "https://linux.do/c/develop/4",
    });
  });

  it("does not replace the latest restorable session for an untouched empty tab", () => {
    const storage = new MemoryStorage();
    const previous = createSession("closed-tab", "https://linux.do/c/develop/4", 10);
    previous.tabs.push({ id: "topic-1", topicId: "1", url: "https://linux.do/t/topic/1", title: "Closed", scrollY: 0, suspended: false, lastActiveAt: 11 });
    previous.activeTabId = "topic-1";
    saveSession(storage, previous);
    stageSessionClose(storage, previous);
    saveSession(storage, createSession("empty-tab", "https://linux.do/", 20));

    expect(loadLatestSession(storage, "new-tab", "https://linux.do/", 30)?.listUrl)
      .toBe("https://linux.do/c/develop/4");
  });

  it("restores exactly the last closed browser-tab session without merging sessions", () => {
    const storage = new MemoryStorage();
    const first = createSession("window-a", "https://linux.do/c/develop/4", 1);
    first.tabs.push({ id: "topic-1", topicId: "1", url: "https://linux.do/t/topic/1", title: "A", scrollY: 0, suspended: false, lastActiveAt: 2 });
    first.activeTabId = "topic-1";
    const second = createSession("window-b", "https://linux.do/c/news/34", 3);
    second.tabs.push({ id: "topic-2", topicId: "2", url: "https://linux.do/t/topic/2", title: "B", scrollY: 0, suspended: false, lastActiveAt: 4 });
    second.activeTabId = "topic-2";

    saveSession(storage, first);
    saveSession(storage, second);
    stageSessionClose(storage, first);
    stageSessionClose(storage, second);

    const restored = loadLatestSession(storage, "window-c", "https://linux.do/", 5)!;
    expect(restored.sessionId).toBe("window-c");
    expect(restored.tabs.map((tab) => tab.topicId)).toEqual(["2"]);
    expect(loadLatestSession(storage, "window-d", "https://linux.do/", 6)).toBeNull();
  });

  it("cancels a reload candidate while preserving the previously closed session", () => {
    const storage = new MemoryStorage();
    const closed = createSession("closed-window", "https://linux.do/latest", 1);
    closed.tabs.push({ id: "topic-1", topicId: "1", url: "https://linux.do/t/topic/1", title: "Closed", scrollY: 0, suspended: false, lastActiveAt: 2 });
    closed.activeTabId = "topic-1";
    const refreshing = createSession("refreshing-window", "https://linux.do/latest", 3);
    refreshing.tabs.push({ id: "topic-2", topicId: "2", url: "https://linux.do/t/topic/2", title: "Refreshing", scrollY: 0, suspended: false, lastActiveAt: 4 });
    refreshing.activeTabId = "topic-2";

    stageSessionClose(storage, closed);
    stageSessionClose(storage, refreshing);
    reconcileSessionClose(storage, "refreshing-window");

    expect(loadLatestSession(storage, "new-window", "https://linux.do/", 5)?.tabs.map((tab) => tab.topicId)).toEqual(["1"]);
  });

  it("clears shared restoration state when the preference is disabled", () => {
    const storage = new MemoryStorage();
    const session = createSession("closed-window", "https://linux.do/latest", 1);
    session.tabs.push({ id: "topic-1", topicId: "1", url: "https://linux.do/t/topic/1", title: "Closed", scrollY: 0, suspended: false, lastActiveAt: 2 });
    session.activeTabId = "topic-1";
    stageSessionClose(storage, session);
    clearRestorableSessions(storage);
    expect(loadLatestSession(storage, "new-window", "https://linux.do/", 3)).toBeNull();
  });
});

class TestTabStorage implements Storage {
  private readonly values = new Map<string, string>();
  constructor(source?: TestTabStorage) {
    if (source) for (const [key, value] of source.values) this.values.set(key, value);
  }
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}
