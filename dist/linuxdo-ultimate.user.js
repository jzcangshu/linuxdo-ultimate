// ==UserScript==
// @name         Linux Do Ultimate
// @name:zh-CN   Linux Do Ultimate
// @namespace    https://linux.do/
// @version      0.6.12
// @description  Independent split reading, in-page topic tabs, reliable view tracking and multi-tab link previews for Linux.do.
// @description:zh-CN 持久化分屏阅读、页内帖子标签、阅读计数修复、403 自动过盾与多标签链接预览。
// @author       Linux.do Community
// @license      MIT
// @match        https://linux.do/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-start
// ==/UserScript==

"use strict";
(() => {
  // src/core/defaults.ts
  var DEFAULT_SETTINGS = {
    schemaVersion: 5,
    enabled: true,
    layoutPreference: "auto",
    tabsEnabled: true,
    tabPresentation: "horizontal",
    verticalTabsAutoCollapse: true,
    groupVerticalTabs: false,
    restoreSession: false,
    colorizeTabs: true,
    cleanModeEnabled: true,
    minimalHidePosters: true,
    minimalHideNotices: true,
    minimalHideCategoryBadges: true,
    minimalHideTags: true,
    lowEndOptimizationEnabled: false,
    previewEnabled: false,
    creditEnabled: true,
    previewClickMode: "double",
    maxLiveFrames: 3,
    maxOpenTabs: 50,
    paneSizes: { sidebar: 216, listRatio: 0.35 },
    dualPaneSizes: { sidebar: 216, listRatio: 0.35 }
  };
  var SESSION_SCHEMA_VERSION = 1;
  var SETTINGS_KEY = "linuxdo-ultimate:settings";
  var SESSION_KEY_PREFIX = "linuxdo-ultimate:session:";
  var SESSION_ID_KEY = "linuxdo-ultimate:session-id";
  var SESSION_OWNER_KEY_PREFIX = "linuxdo-ultimate:session-owner:";
  var SESSION_INDEX_KEY = "linuxdo-ultimate:session-index";
  var LATEST_SESSION_KEY = "linuxdo-ultimate:latest-session";
  var LATEST_SESSION_CANDIDATE_KEY = "linuxdo-ultimate:latest-session-candidate";
  function normalizeSettings(value) {
    if (!value || typeof value !== "object") return structuredClone(DEFAULT_SETTINGS);
    const source = value;
    const preservesSessionChoice = source.schemaVersion === 2 || source.schemaVersion === 3 || source.schemaVersion === 4 || source.schemaVersion === DEFAULT_SETTINGS.schemaVersion;
    const cleanModeEnabled = source.schemaVersion === 3 || source.schemaVersion === 4 || source.schemaVersion === DEFAULT_SETTINGS.schemaVersion ? source.cleanModeEnabled !== false : source.cleanModeEnabled === true || source.hidePosters !== false;
    const hasMinimalOptions = source.schemaVersion === 4 || source.schemaVersion === DEFAULT_SETTINGS.schemaVersion;
    const paneSizes = source.paneSizes && typeof source.paneSizes === "object" ? source.paneSizes : {};
    const dualPaneSizes = source.dualPaneSizes && typeof source.dualPaneSizes === "object" ? source.dualPaneSizes : {};
    return {
      ...DEFAULT_SETTINGS,
      enabled: true,
      layoutPreference: source.layoutPreference === "two" || source.layoutPreference === "three" ? source.layoutPreference : "auto",
      tabsEnabled: source.tabsEnabled !== false,
      tabPresentation: source.tabPresentation === "vertical" ? "vertical" : "horizontal",
      verticalTabsAutoCollapse: source.verticalTabsAutoCollapse !== false,
      groupVerticalTabs: source.groupVerticalTabs === true,
      restoreSession: preservesSessionChoice && source.restoreSession === true,
      colorizeTabs: source.colorizeTabs !== false,
      cleanModeEnabled,
      minimalHidePosters: hasMinimalOptions ? source.minimalHidePosters !== false : true,
      minimalHideNotices: hasMinimalOptions ? source.minimalHideNotices !== false : true,
      minimalHideCategoryBadges: hasMinimalOptions ? source.minimalHideCategoryBadges !== false : true,
      minimalHideTags: hasMinimalOptions ? source.minimalHideTags !== false : true,
      lowEndOptimizationEnabled: source.lowEndOptimizationEnabled === true,
      previewEnabled: source.previewEnabled === true,
      creditEnabled: source.creditEnabled !== false,
      previewClickMode: source.previewClickMode === "single" ? "single" : "double",
      maxLiveFrames: clampSetting(source.maxLiveFrames, 1, 10, DEFAULT_SETTINGS.maxLiveFrames),
      maxOpenTabs: clampSetting(source.maxOpenTabs, 5, 50, DEFAULT_SETTINGS.maxOpenTabs),
      paneSizes: {
        sidebar: clampSetting(paneSizes.sidebar, 160, 360, DEFAULT_SETTINGS.paneSizes.sidebar),
        listRatio: clampRatio(paneSizes.listRatio, DEFAULT_SETTINGS.paneSizes.listRatio)
      },
      dualPaneSizes: {
        sidebar: clampSetting(dualPaneSizes.sidebar, 160, 360, DEFAULT_SETTINGS.dualPaneSizes.sidebar),
        listRatio: clampRatio(dualPaneSizes.listRatio, DEFAULT_SETTINGS.dualPaneSizes.listRatio)
      }
    };
  }
  function clampSetting(value, min, max, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? Math.round(Math.min(max, Math.max(min, value))) : fallback;
  }
  function clampRatio(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? Math.min(0.7, Math.max(0.3, value)) : fallback;
  }

  // src/core/session.ts
  var MAX_TABS = 50;
  function normalizePaneSizes(value, fallback) {
    if (!value || typeof value !== "object") return { ...fallback };
    const candidate = value;
    return {
      sidebar: clampNumber(candidate.sidebar, 160, 360, fallback.sidebar),
      listRatio: clampRatio2(candidate.listRatio, fallback.listRatio)
    };
  }
  function clampRatio2(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? Math.min(0.7, Math.max(0.3, value)) : fallback;
  }
  function clampNumber(value, min, max, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? Math.round(Math.min(max, Math.max(min, value))) : fallback;
  }
  function normalizeTab(value) {
    if (!value || typeof value !== "object") return null;
    const tab = value;
    if (typeof tab.id !== "string" || typeof tab.topicId !== "string" || typeof tab.url !== "string") return null;
    return {
      id: tab.id,
      topicId: tab.topicId,
      url: tab.url,
      title: typeof tab.title === "string" && tab.title.trim() ? tab.title : `\u4E3B\u9898 ${tab.topicId}`,
      ...typeof tab.postNumber === "number" && Number.isFinite(tab.postNumber) ? { postNumber: Math.max(1, Math.floor(tab.postNumber)) } : {},
      suspended: tab.suspended === true,
      lastActiveAt: clampNumber(tab.lastActiveAt, 0, Number.MAX_SAFE_INTEGER, 0)
    };
  }
  function limitTabs(tabs, keepId) {
    if (tabs.length <= MAX_TABS) return tabs;
    const removeIds = new Set(
      tabs.filter((tab) => tab.id !== keepId).sort((a, b) => a.lastActiveAt - b.lastActiveAt).slice(0, tabs.length - MAX_TABS).map((tab) => tab.id)
    );
    return tabs.filter((tab) => !removeIds.has(tab.id));
  }
  function createSession(sessionId, listUrl, now) {
    return {
      schemaVersion: SESSION_SCHEMA_VERSION,
      sessionId,
      listUrl,
      listScrollY: 0,
      layoutMode: "native",
      paneSizes: { ...DEFAULT_SETTINGS.paneSizes },
      dualPaneSizes: { ...DEFAULT_SETTINGS.dualPaneSizes },
      tabs: [],
      activeTabId: null,
      secondaryTabIds: [],
      secondaryActiveTabId: null,
      updatedAt: now
    };
  }
  function normalizeSession(value, fallback) {
    if (!value || typeof value !== "object") return fallback;
    const source = value;
    if (source.schemaVersion !== SESSION_SCHEMA_VERSION || typeof source.sessionId !== "string") return fallback;
    const tabs = Array.isArray(source.tabs) ? source.tabs.map(normalizeTab).filter((tab) => tab !== null) : [];
    const uniqueTabs = limitTabs(
      Array.from(new Map(tabs.map((tab) => [tab.topicId, tab])).values()),
      typeof source.activeTabId === "string" ? source.activeTabId : ""
    );
    const validTabIds = new Set(uniqueTabs.map((tab) => tab.id));
    const secondaryTabIds = Array.isArray(source.secondaryTabIds) ? [...new Set(source.secondaryTabIds.filter((id) => typeof id === "string" && validTabIds.has(id)))] : [];
    const secondaryIds = new Set(secondaryTabIds);
    const primaryTabs = uniqueTabs.filter((tab) => !secondaryIds.has(tab.id));
    const activeTabId = primaryTabs.some((tab) => tab.id === source.activeTabId) ? source.activeTabId : primaryTabs.at(-1)?.id ?? null;
    const secondaryActiveTabId = secondaryTabIds.includes(source.secondaryActiveTabId ?? "") ? source.secondaryActiveTabId : secondaryTabIds.at(-1) ?? null;
    return {
      schemaVersion: SESSION_SCHEMA_VERSION,
      sessionId: source.sessionId,
      listUrl: typeof source.listUrl === "string" && source.listUrl ? source.listUrl : fallback.listUrl,
      listScrollY: clampNumber(source.listScrollY, 0, 1e7, 0),
      layoutMode: source.layoutMode === "two" || source.layoutMode === "three" ? source.layoutMode : "native",
      paneSizes: normalizePaneSizes(source.paneSizes, fallback.paneSizes),
      dualPaneSizes: normalizePaneSizes(source.dualPaneSizes, fallback.dualPaneSizes),
      tabs: uniqueTabs,
      activeTabId,
      secondaryTabIds,
      secondaryActiveTabId,
      updatedAt: clampNumber(source.updatedAt, 0, Number.MAX_SAFE_INTEGER, fallback.updatedAt)
    };
  }
  function upsertTopicTab(session, input, now) {
    const existing = session.tabs.find((tab) => tab.topicId === input.topicId);
    const nextTab = existing ? { ...existing, ...input, suspended: false, lastActiveAt: now } : {
      id: `topic-${input.topicId}`,
      topicId: input.topicId,
      url: input.url,
      title: input.title || `\u4E3B\u9898 ${input.topicId}`,
      ...input.postNumber ? { postNumber: input.postNumber } : {},
      suspended: false,
      lastActiveAt: now
    };
    const tabs = limitTabs(
      existing ? session.tabs.map((tab) => tab.topicId === input.topicId ? nextTab : tab) : [...session.tabs, nextTab],
      nextTab.id
    );
    const staysSecondary = session.secondaryTabIds.includes(nextTab.id);
    return {
      ...session,
      tabs,
      activeTabId: staysSecondary ? session.activeTabId : nextTab.id,
      secondaryActiveTabId: staysSecondary ? nextTab.id : session.secondaryActiveTabId,
      updatedAt: now
    };
  }
  function closeTopicTab(session, tabId, now) {
    const index = session.tabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) return session;
    const tabs = session.tabs.filter((tab) => tab.id !== tabId);
    const secondaryTabIds = session.secondaryTabIds.filter((id) => id !== tabId);
    const secondaryIds = new Set(secondaryTabIds);
    const primaryTabs = tabs.filter((tab) => !secondaryIds.has(tab.id));
    const nextActive = session.activeTabId === tabId ? primaryTabs[Math.min(index, primaryTabs.length - 1)]?.id ?? primaryTabs.at(-1)?.id ?? null : session.activeTabId;
    const nextSecondaryActive = session.secondaryActiveTabId === tabId ? secondaryTabIds.at(-1) ?? null : session.secondaryActiveTabId;
    return {
      ...session,
      tabs,
      activeTabId: nextActive,
      secondaryTabIds,
      secondaryActiveTabId: nextSecondaryActive,
      updatedAt: now
    };
  }

  // src/core/storage.ts
  function safeJsonParse(raw, fallback) {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  var UserscriptStorage = class {
    backend = typeof GM_getValue === "function" && typeof GM_setValue === "function" && typeof GM_deleteValue === "function" ? "userscript" : "local";
    get(key, fallback) {
      if (this.backend === "userscript") {
        try {
          return GM_getValue(key, fallback);
        } catch {
          return fallback;
        }
      }
      try {
        return safeJsonParse(window.localStorage.getItem(key), fallback);
      } catch {
        return fallback;
      }
    }
    set(key, value) {
      if (this.backend === "userscript") {
        try {
          GM_setValue(key, value);
        } catch {
        }
        return;
      }
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
      }
    }
    remove(key) {
      if (this.backend === "userscript") {
        try {
          GM_deleteValue(key);
        } catch {
        }
        return;
      }
      try {
        window.localStorage.removeItem(key);
      } catch {
      }
    }
  };
  function getSessionId(storage = window.sessionStorage) {
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
  function isReloadNavigation(performanceApi = window.performance) {
    try {
      const navigation = performanceApi.getEntriesByType("navigation")[0];
      return navigation?.type === "reload";
    } catch {
      return false;
    }
  }
  var SESSION_OWNER_TTL_MS = 5 * 6e4;
  var SESSION_RETENTION_MS = 30 * 24 * 60 * 6e4;
  var MAX_RESTORABLE_SESSIONS = 8;
  function readRestorableSessions(storage) {
    const candidate = storage.get(LATEST_SESSION_CANDIDATE_KEY, null);
    if (Array.isArray(candidate)) {
      return candidate.filter((entry) => Boolean(
        entry && typeof entry === "object" && typeof entry.closedAt === "number" && entry.session && typeof entry.session.sessionId === "string"
      ));
    }
    const legacy = [candidate, storage.get(LATEST_SESSION_KEY, null)].filter((value) => Boolean(
      value && typeof value === "object" && typeof value.sessionId === "string"
    ));
    return legacy.map((session) => ({ session, closedAt: session.updatedAt || 0 }));
  }
  function writeRestorableSessions(storage, entries) {
    storage.set(LATEST_SESSION_CANDIDATE_KEY, entries);
    storage.remove(LATEST_SESSION_KEY);
  }
  function readSessionIndex(storage) {
    const value = storage.get(SESSION_INDEX_KEY, []);
    if (!Array.isArray(value)) return [];
    return value.filter((entry) => Boolean(
      entry && typeof entry === "object" && typeof entry.sessionId === "string" && typeof entry.updatedAt === "number"
    ));
  }
  function writeSessionIndex(storage, entries) {
    storage.set(SESSION_INDEX_KEY, entries);
  }
  function touchSessionIndex(storage, sessionId, updatedAt) {
    const entries = readSessionIndex(storage).filter((entry) => entry.sessionId !== sessionId);
    entries.push({ sessionId, updatedAt });
    writeSessionIndex(storage, entries);
  }
  function claimSessionId(storage, tabStorage = window.sessionStorage, now = Date.now(), reuseExistingSession = false) {
    let sessionId = getSessionId(tabStorage);
    const existing = storage.get(`${SESSION_OWNER_KEY_PREFIX}${sessionId}`, null);
    if (!reuseExistingSession && existing && now >= existing.updatedAt && now - existing.updatedAt < SESSION_OWNER_TTL_MS) {
      sessionId = createUniqueId();
      try {
        tabStorage.setItem(SESSION_ID_KEY, sessionId);
      } catch {
      }
    }
    const lease = { sessionId, ownerId: createUniqueId() };
    storage.set(`${SESSION_OWNER_KEY_PREFIX}${sessionId}`, { ownerId: lease.ownerId, updatedAt: now });
    return lease;
  }
  function refreshSessionLease(storage, lease, now = Date.now()) {
    const owner = storage.get(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`, null);
    if (owner?.ownerId === lease.ownerId) {
      storage.set(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`, { ...owner, updatedAt: now });
      touchSessionIndex(storage, lease.sessionId, now);
    }
  }
  function releaseSessionLease(storage, lease) {
    const owner = storage.get(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`, null);
    if (owner?.ownerId === lease.ownerId) storage.remove(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`);
  }
  function createUniqueId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  function loadSettings(storage) {
    return normalizeSettings(storage.get(SETTINGS_KEY, DEFAULT_SETTINGS));
  }
  function saveSettings(storage, settings) {
    storage.set(SETTINGS_KEY, normalizeSettings(settings));
  }
  function loadSessionIfPresent(storage, sessionId, listUrl, now) {
    const stored = storage.get(`${SESSION_KEY_PREFIX}${sessionId}`, null);
    if (stored === null || stored === void 0) return null;
    return normalizeSession(stored, createSession(sessionId, listUrl, now));
  }
  function loadLatestSession(storage, sessionId, listUrl, now) {
    const entry = readRestorableSessions(storage).filter((candidate) => candidate.session.sessionId !== sessionId).sort((a, b) => a.closedAt - b.closedAt).at(-1);
    if (!entry) return null;
    const normalized = normalizeSession(entry.session, createSession(sessionId, listUrl, now));
    if (normalized.sessionId !== sessionId) clearSession(storage, normalized.sessionId);
    clearRestorableSessions(storage);
    if (normalized.tabs.length === 0) return null;
    return { ...normalized, sessionId };
  }
  function saveSession(storage, session) {
    storage.set(`${SESSION_KEY_PREFIX}${session.sessionId}`, session);
    touchSessionIndex(storage, session.sessionId, session.updatedAt);
  }
  function stageSessionClose(storage, session, closedAt = Date.now()) {
    if (session.tabs.length === 0) return;
    const entries = readRestorableSessions(storage).filter((entry) => entry.session.sessionId !== session.sessionId);
    entries.push({ session, closedAt });
    writeRestorableSessions(storage, entries.sort((a, b) => a.closedAt - b.closedAt).slice(-MAX_RESTORABLE_SESSIONS));
  }
  function reconcileSessionClose(storage, sessionId) {
    const restorable = readRestorableSessions(storage).filter((entry) => entry.session.sessionId !== sessionId);
    if (restorable.length > 0) writeRestorableSessions(storage, restorable);
    else clearRestorableSessions(storage);
  }
  function cleanupExpiredSessions(storage, now = Date.now()) {
    const retained = [];
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
  function clearRestorableSessions(storage) {
    storage.remove(LATEST_SESSION_CANDIDATE_KEY);
    storage.remove(LATEST_SESSION_KEY);
  }
  function clearSession(storage, sessionId) {
    storage.remove(`${SESSION_KEY_PREFIX}${sessionId}`);
    storage.remove(`${SESSION_OWNER_KEY_PREFIX}${sessionId}`);
    writeSessionIndex(storage, readSessionIndex(storage).filter((entry) => entry.sessionId !== sessionId));
  }

  // src/discourse/routes.ts
  var LIST_PATHS = /* @__PURE__ */ new Set([
    "/",
    "/latest",
    "/new",
    "/unseen",
    "/hot",
    "/top",
    "/read",
    "/posted",
    "/bookmarks",
    "/categories",
    "/tags"
  ]);
  function isAllowedHost(hostname) {
    if (hostname === "linux.do" || hostname.endsWith(".linux.do")) return true;
    const testWindow = globalThis.window;
    return testWindow?.__LDU_TEST_MODE__ === true && (hostname === "localhost" || hostname === "127.0.0.1");
  }
  function getTopicInfo(rawUrl, baseUrl = "https://linux.do/") {
    let url;
    try {
      url = new URL(rawUrl, baseUrl);
    } catch {
      return null;
    }
    if (!isAllowedHost(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((part) => part === "t" || part === "n");
    if (marker < 0) return null;
    const idIndex = parts.findIndex((part, index) => index > marker && /^\d+$/.test(part));
    if (idIndex < 0) return null;
    const postNumber = parts[idIndex + 1] && /^\d+$/.test(parts[idIndex + 1]) ? Number(parts[idIndex + 1]) : void 0;
    return { url, topicId: parts[idIndex], ...postNumber ? { postNumber } : {} };
  }
  function classifyRoute(rawUrl, baseUrl = "https://linux.do/") {
    let url;
    try {
      url = new URL(rawUrl, baseUrl);
    } catch {
      return "other";
    }
    if (getTopicInfo(url.href)) return "topic";
    if (url.pathname === "/chat" || url.pathname.startsWith("/chat/")) return "chat";
    if (url.pathname === "/search" || url.pathname.startsWith("/search/")) return "search";
    if (url.pathname.startsWith("/u/")) return "user";
    if (LIST_PATHS.has(url.pathname) || url.pathname.startsWith("/c/") || url.pathname.startsWith("/tag/")) return "list";
    return "other";
  }
  function isSplitRoute(rawUrl, baseUrl = "https://linux.do/") {
    const route = classifyRoute(rawUrl, baseUrl);
    return route === "list" || route === "search";
  }
  function isSupportedTopicTarget(targetUrl, currentUrl) {
    const target = getTopicInfo(targetUrl, currentUrl);
    const current = getTopicInfo(currentUrl, currentUrl);
    return Boolean(target && (!current || target.topicId !== current.topicId));
  }

  // src/discourse/view-tracker.ts
  var PREFIX = "linuxdo-ultimate:view:v1:";
  var PENDING_TTL_MS = 3e4;
  var DONE_TTL_MS = 8 * 60 * 60 * 1e3;
  var FETCH_TIMEOUT_MS = 8e3;
  var TRACKING_SESSION_KEY = `${PREFIX}session-id`;
  var LOCK_INDEX_KEY = `${PREFIX}lock-index`;
  var ViewTracker = class {
    constructor(options) {
      this.options = options;
      this.fetcher = options.fetcher ?? fetch.bind(globalThis);
      this.now = options.now ?? Date.now;
      this.timeoutMs = options.timeoutMs ?? FETCH_TIMEOUT_MS;
    }
    fetcher;
    now;
    timeoutMs;
    memoryLocks = /* @__PURE__ */ new Map();
    async track(info, source, referrerUrl, force = false) {
      if (info.url.origin !== "https://linux.do") return { status: "skipped" };
      const token = this.claim(info, source, force);
      if (!token) return { status: "skipped" };
      this.options.beforeClaimConfirmation?.();
      if (!this.owns(info, token)) return { status: "skipped" };
      const attempts = [];
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
    stateKey(info) {
      return `${PREFIX}${info.url.hostname}:${info.topicId}`;
    }
    readState(info) {
      const key = this.stateKey(info);
      try {
        const stored = JSON.parse(this.options.storage.getItem(key) ?? "null");
        return stored ?? this.memoryLocks.get(key) ?? null;
      } catch {
        return this.memoryLocks.get(key) ?? null;
      }
    }
    claim(info, source, force) {
      this.cleanupExpiredLocks();
      const existing = this.readState(info);
      if (!force && existing?.expiresAt && existing.expiresAt > this.now()) return null;
      const token = globalThis.crypto?.randomUUID?.() ?? `${this.now()}-${Math.random().toString(36).slice(2)}`;
      this.writeState(this.stateKey(info), {
        status: "pending",
        token,
        source,
        expiresAt: this.now() + PENDING_TTL_MS
      });
      return this.owns(info, token) ? token : null;
    }
    complete(info, token, source, status) {
      this.writeState(this.stateKey(info), {
        status,
        token,
        source,
        expiresAt: this.now() + DONE_TTL_MS
      });
    }
    clearIfOwned(info, token) {
      if (this.readState(info)?.token === token) this.removeState(this.stateKey(info));
    }
    owns(info, token) {
      return this.readState(info)?.token === token;
    }
    writeState(key, state) {
      this.memoryLocks.set(key, state);
      try {
        this.options.storage.setItem(key, JSON.stringify(state));
        const entries = this.readLockIndex().filter((entry) => entry.key !== key);
        entries.push({ key, expiresAt: state.expiresAt });
        this.options.storage.setItem(LOCK_INDEX_KEY, JSON.stringify(entries));
      } catch {
      }
    }
    removeState(key) {
      this.memoryLocks.delete(key);
      try {
        this.options.storage.removeItem(key);
        this.options.storage.setItem(
          LOCK_INDEX_KEY,
          JSON.stringify(this.readLockIndex().filter((entry) => entry.key !== key))
        );
      } catch {
      }
    }
    readLockIndex() {
      try {
        const value = JSON.parse(this.options.storage.getItem(LOCK_INDEX_KEY) ?? "[]");
        if (!Array.isArray(value)) return [];
        return value.filter((entry) => Boolean(
          entry && typeof entry === "object" && typeof entry.key === "string" && typeof entry.expiresAt === "number"
        ));
      } catch {
        return [];
      }
    }
    cleanupExpiredLocks() {
      const now = this.now();
      for (const [key, state] of this.memoryLocks) {
        if (state.expiresAt <= now) this.memoryLocks.delete(key);
      }
      const entries = this.readLockIndex();
      const retained = entries.filter((entry) => {
        if (entry.expiresAt > now) return true;
        try {
          this.options.storage.removeItem(entry.key);
        } catch {
        }
        return false;
      });
      if (retained.length !== entries.length) {
        try {
          this.options.storage.setItem(LOCK_INDEX_KEY, JSON.stringify(retained));
        } catch {
        }
      }
    }
    commonHeaders() {
      const headers = {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Discourse-Present": "true"
      };
      const csrf = this.options.csrfToken();
      if (csrf) headers["X-CSRF-Token"] = csrf;
      return headers;
    }
    async sendPageview(info, referrerUrl) {
      const headers = {
        ...this.commonHeaders(),
        "Discourse-Track-View-Deferred": "true",
        "Discourse-Track-View-Topic-Id": info.topicId,
        "Discourse-Track-View-Url": info.url.href,
        "Discourse-Track-View-Referrer": referrerUrl,
        "Discourse-Track-View-Session-Id": this.options.trackingSessionId()
      };
      const response = await this.fetchWithTimeout(`${info.url.origin}${this.basePath()}/pageview`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        keepalive: true,
        headers
      });
      return this.readAttempt(response);
    }
    async sendTopicJson(info) {
      const response = await this.fetchWithTimeout(
        `${info.url.origin}${this.basePath()}/t/${info.topicId}.json?track_visit=true&forceLoad=true`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            ...this.commonHeaders(),
            "Discourse-Track-View": "true",
            "Discourse-Track-View-Topic-Id": info.topicId
          }
        }
      );
      return this.readAttempt(response);
    }
    basePath() {
      const value = this.options.basePath?.() ?? "";
      return value ? `/${value.replace(/^\/+|\/+$/g, "")}` : "";
    }
    readAttempt(response) {
      const trackView = response.headers.get("x-discourse-trackview");
      const browserPageView = response.headers.get("x-discourse-browserpageview");
      return {
        ok: response.ok,
        confirmed: trackView === "1" || browserPageView === "1"
      };
    }
    async fetchWithTimeout(url, init) {
      const controller = new AbortController();
      const timer = globalThis.setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        return await this.fetcher(url, { ...init, signal: controller.signal });
      } finally {
        globalThis.clearTimeout(timer);
      }
    }
  };
  function createBrowserViewTracker() {
    return new ViewTracker({
      storage: window.localStorage,
      csrfToken: () => document.querySelector('meta[name="csrf-token"]')?.content ?? "",
      trackingSessionId: () => getOrCreateTrackingSessionId(
        window.sessionStorage,
        document.querySelector('meta[name="discourse-track-view-session-id"]')?.content ?? ""
      ),
      basePath: () => document.querySelector('meta[name="discourse-base-uri"]')?.content ?? ""
    });
  }
  var memoryTrackingSessionId = "";
  function getOrCreateTrackingSessionId(storage, metaValue = "", createId = randomId) {
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
  function randomId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // src/tabs/frame-pool.ts
  var TopicFramePool = class {
    constructor(container, maxLiveFrames, onMessage, onSuspend) {
      this.container = container;
      this.maxLiveFrames = maxLiveFrames;
      this.onMessage = onMessage;
      this.onSuspend = onSuspend;
      this.liveLimit = Math.max(1, maxLiveFrames);
    }
    frames = /* @__PURE__ */ new Map();
    liveLimit;
    previewConfig = { enabled: false, clickMode: "double" };
    pageToolsConfig = {
      ownerOnlyEnabled: false,
      minimalHidePosters: false,
      minimalHideNotices: false,
      minimalHideCategoryBadges: false,
      minimalHideTags: false,
      lowEndOptimizationEnabled: false
    };
    activeTabId = null;
    setMaxLiveFrames(value) {
      this.liveLimit = Math.max(1, Math.min(10, Math.floor(value)));
      this.suspendOverflow("");
    }
    setPreviewConfig(config) {
      if (samePreviewConfig(this.previewConfig, config)) return;
      this.previewConfig = { ...config };
      for (const record of this.frames.values()) this.sendPreviewConfig(record.iframe);
    }
    setPageToolsConfig(config) {
      if (samePageToolsConfig(this.pageToolsConfig, config)) return;
      this.pageToolsConfig = { ...config };
      for (const record of this.frames.values()) this.sendPageToolsConfig(record.iframe);
    }
    activate(tab, now) {
      const switchingToAnotherFrame = this.activeTabId !== tab.id;
      const record = this.ensureRecord(tab, now);
      if (switchingToAnotherFrame) {
        for (const [tabId, current] of this.frames) {
          this.setFrameActive(current, tabId === tab.id);
        }
        this.activeTabId = tab.id;
      }
      this.suspendOverflow(tab.id);
      return record.iframe;
    }
    prepare(tab, now) {
      const activeTabId = this.activeTabId && this.frames.has(this.activeTabId) ? this.activeTabId : "";
      const record = this.ensureRecord(tab, now);
      if (tab.id !== activeTabId) this.setFrameActive(record, false);
      this.suspendOverflow(activeTabId);
      return record.iframe;
    }
    ensureRecord(tab, now) {
      let record = this.frames.get(tab.id);
      if (!record) {
        const iframe = document.createElement("iframe");
        iframe.className = "ldu-topic-frame";
        iframe.name = `ldu-topic:${tab.id}`;
        iframe.title = tab.title;
        iframe.dataset.tabId = tab.id;
        const loadListener = () => {
          const current = this.frames.get(tab.id);
          if (!current || current.iframe !== iframe) return;
          current.loaded = true;
          current.configSentForDocument = false;
          this.sendLifecycleState(current);
          this.sendInitialConfigs(current);
          this.flushCommands(current);
          this.onMessage({ type: "ldu:frame-ready", tabId: tab.id, url: iframe.src }, iframe);
        };
        iframe.addEventListener("load", loadListener);
        iframe.src = tab.url;
        record = {
          iframe,
          lastUsedAt: now,
          reportedUrl: null,
          loaded: false,
          softFrozen: true,
          commands: [],
          loadListener,
          configSentForDocument: false
        };
        this.frames.set(tab.id, record);
        this.container.append(iframe);
      } else {
        record.lastUsedAt = now;
        record.iframe.title = tab.title;
        const requestedUrl = new URL(tab.url, document.baseURI).href;
        if (record.iframe.src !== requestedUrl && record.reportedUrl !== requestedUrl) {
          record.reportedUrl = null;
          record.loaded = false;
          record.configSentForDocument = false;
          record.iframe.src = requestedUrl;
        }
      }
      return record;
    }
    handleMessage(event) {
      const data = event.data;
      if (!data || !["ldu:frame-state", "ldu:frame-ready", "ldu:frame-interaction", "ldu:bookmark-result", "ldu:preview-open", "ldu:preview-dismiss", "ldu:topic-open", "ldu:list-navigate"].includes(data.type ?? "") || typeof data.tabId !== "string") return;
      const record = this.frames.get(data.tabId);
      if (!record || event.source !== record.iframe.contentWindow) return;
      if ((data.type === "ldu:frame-state" || data.type === "ldu:frame-ready") && data.url) {
        try {
          record.reportedUrl = new URL(data.url, document.baseURI).href;
        } catch {
          record.reportedUrl = null;
        }
      }
      if (data.type === "ldu:frame-ready") {
        record.loaded = true;
        this.sendLifecycleState(record);
        this.sendInitialConfigs(record);
        this.flushCommands(record);
      }
      this.onMessage(data, record.iframe);
    }
    remove(tabId) {
      const record = this.frames.get(tabId);
      if (!record) return;
      record.commands = [];
      record.iframe.removeEventListener("load", record.loadListener);
      record.iframe.remove();
      this.frames.delete(tabId);
      if (this.activeTabId === tabId) this.activeTabId = null;
    }
    sendCommand(tabId, command) {
      const record = this.frames.get(tabId);
      if (!record) return;
      if (!record.loaded) {
        record.commands.push(command);
        return;
      }
      record.iframe.contentWindow?.postMessage(command, location.origin);
    }
    getFrame(tabId) {
      return this.frames.get(tabId)?.iframe ?? null;
    }
    reload(tabId) {
      const record = this.frames.get(tabId);
      if (!record) return false;
      record.loaded = false;
      record.reportedUrl = null;
      record.configSentForDocument = false;
      try {
        record.iframe.contentWindow?.location.reload();
      } catch {
        record.iframe.src = record.iframe.src;
      }
      return true;
    }
    detach(tabId) {
      const record = this.frames.get(tabId);
      if (!record) return null;
      record.iframe.removeEventListener("load", record.loadListener);
      record.iframe.remove();
      this.frames.delete(tabId);
      if (this.activeTabId === tabId) this.activeTabId = null;
      return record;
    }
    adopt(tab, transfer, now) {
      const iframe = transfer.iframe;
      iframe.name = `ldu-topic:${tab.id}`;
      iframe.dataset.tabId = tab.id;
      iframe.title = tab.title;
      const loadListener = () => {
        const current = this.frames.get(tab.id);
        if (!current || current.iframe !== iframe) return;
        current.loaded = true;
        current.configSentForDocument = false;
        this.sendInitialConfigs(current);
        this.flushCommands(current);
        this.onMessage({ type: "ldu:frame-ready", tabId: tab.id, url: iframe.src }, iframe);
      };
      iframe.addEventListener("load", loadListener);
      const requestedUrl = new URL(tab.url, document.baseURI).href;
      if (iframe.src !== requestedUrl && transfer.reportedUrl !== requestedUrl) iframe.src = requestedUrl;
      const record = {
        ...transfer,
        lastUsedAt: now,
        reportedUrl: null,
        loaded: false,
        loadListener,
        configSentForDocument: false
      };
      this.frames.set(tab.id, record);
      this.container.append(iframe);
      this.activate(tab, now);
      return iframe;
    }
    destroy() {
      for (const record of this.frames.values()) {
        record.commands = [];
        record.iframe.removeEventListener("load", record.loadListener);
        record.iframe.remove();
      }
      this.frames.clear();
      this.activeTabId = null;
    }
    sendPreviewConfig(iframe) {
      iframe.contentWindow?.postMessage({ type: "ldu:preview-config", ...this.previewConfig }, location.origin);
    }
    sendPageToolsConfig(iframe) {
      iframe.contentWindow?.postMessage({ type: "ldu:page-tools-config", ...this.pageToolsConfig }, location.origin);
    }
    sendInitialConfigs(record) {
      if (record.configSentForDocument) return;
      record.configSentForDocument = true;
      this.sendPreviewConfig(record.iframe);
      this.sendPageToolsConfig(record.iframe);
    }
    setFrameActive(record, active) {
      const hidden = String(!active);
      if (record.iframe.getAttribute("aria-hidden") !== hidden) record.iframe.setAttribute("aria-hidden", hidden);
      const tabIndex = active ? 0 : -1;
      if (record.iframe.tabIndex !== tabIndex) record.iframe.tabIndex = tabIndex;
      const softFrozen = !active;
      if (record.softFrozen === softFrozen) return;
      record.softFrozen = softFrozen;
      if (record.loaded) this.sendLifecycleState(record);
    }
    sendLifecycleState(record) {
      record.iframe.contentWindow?.postMessage({
        type: "ldu:frame-lifecycle",
        active: !record.softFrozen
      }, location.origin);
    }
    flushCommands(record) {
      const commands = record.commands.splice(0);
      for (const command of commands) record.iframe.contentWindow?.postMessage(command, location.origin);
    }
    suspendOverflow(activeTabId) {
      while (this.frames.size > this.liveLimit) {
        const candidates = [...this.frames.entries()].filter(([tabId2]) => tabId2 !== activeTabId).sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt);
        const candidate = candidates[0];
        if (!candidate) return;
        const [tabId, record] = candidate;
        record.commands = [];
        record.iframe.removeEventListener("load", record.loadListener);
        record.iframe.remove();
        this.frames.delete(tabId);
        if (this.activeTabId === tabId) this.activeTabId = null;
        this.onSuspend(tabId);
      }
    }
  };
  function samePreviewConfig(left, right) {
    return left.enabled === right.enabled && left.clickMode === right.clickMode;
  }
  function samePageToolsConfig(left, right) {
    return left.ownerOnlyEnabled === right.ownerOnlyEnabled && left.minimalHidePosters === right.minimalHidePosters && left.minimalHideNotices === right.minimalHideNotices && left.minimalHideCategoryBadges === right.minimalHideCategoryBadges && left.minimalHideTags === right.minimalHideTags && left.lowEndOptimizationEnabled === right.lowEndOptimizationEnabled;
  }

  // src/tabs/list-frame.ts
  var ListFrameController = class {
    constructor(container, frameId, onMessage) {
      this.container = container;
      this.frameId = frameId;
      this.onMessage = onMessage;
    }
    iframe = null;
    reportedUrl = "";
    frameConfig = {
      enabled: false,
      clickMode: "double",
      pageTools: {
        ownerOnlyEnabled: false,
        minimalHidePosters: false,
        minimalHideNotices: false,
        minimalHideCategoryBadges: false,
        minimalHideTags: false,
        lowEndOptimizationEnabled: false
      }
    };
    configSentForDocument = false;
    restoreScrollY = 0;
    restoreTimer = null;
    restoreDeadline = 0;
    mount(url) {
      if (!this.iframe) {
        const iframe = document.createElement("iframe");
        iframe.className = "ldu-list-frame";
        iframe.name = `ldu-list:${this.frameId}`;
        iframe.title = "\u5E16\u5B50\u5217\u8868\u548C\u7AD9\u5185\u9875\u9762";
        iframe.dataset.frameId = this.frameId;
        iframe.addEventListener("load", () => {
          this.configSentForDocument = false;
          this.sendInitialConfigs(iframe);
          this.onMessage({ type: "ldu:list-ready", frameId: this.frameId, url: iframe.src }, iframe);
        });
        this.iframe = iframe;
        this.container.append(iframe);
      }
      const requestedUrl = this.resolveSameOrigin(url) ?? new URL("/", location.href);
      const requested = requestedUrl.href;
      if (this.iframe.src !== requested && this.reportedUrl !== requested) {
        this.reportedUrl = "";
        this.configSentForDocument = false;
        this.iframe.src = requested;
      }
      if (!this.iframe.src) this.iframe.src = requested;
      return this.iframe;
    }
    navigate(url) {
      const target = this.resolveSameOrigin(url);
      if (!target) return;
      if (!this.iframe) {
        this.mount(target.href);
        return;
      }
      const requested = target.href;
      if (this.iframe.src === requested || this.reportedUrl === requested) return;
      this.reportedUrl = "";
      this.configSentForDocument = false;
      this.iframe.src = requested;
    }
    restoreScroll(scrollY) {
      if (!this.iframe?.contentWindow || scrollY <= 0) return;
      this.restoreScrollY = scrollY;
      this.restoreDeadline = Date.now() + 5e3;
      this.attemptScrollRestore();
    }
    getElement() {
      return this.iframe;
    }
    setConfig(config) {
      const previewChanged = this.frameConfig.enabled !== config.enabled || this.frameConfig.clickMode !== config.clickMode;
      const pageTools = config.pageTools ? { ...config.pageTools } : this.frameConfig.pageTools;
      const pageToolsChanged = !samePageToolsConfig2(this.frameConfig.pageTools, pageTools);
      this.frameConfig = {
        ...this.frameConfig,
        ...config,
        pageTools
      };
      if (this.iframe) {
        if (previewChanged) this.sendPreviewConfig(this.iframe);
        if (pageToolsChanged) this.sendPageToolsConfig(this.iframe);
      }
    }
    handleMessage(event) {
      const data = event.data;
      if (!data || !["ldu:list-ready", "ldu:list-visual-ready", "ldu:list-state", "ldu:list-interaction", "ldu:list-topic-open", "ldu:list-navigate", "ldu:list-preview-open", "ldu:list-preview-dismiss"].includes(data.type ?? "")) return;
      if (data.frameId !== this.frameId || !this.iframe || event.source !== this.iframe.contentWindow || event.origin !== location.origin) return;
      if ((data.type === "ldu:list-ready" || data.type === "ldu:list-visual-ready" || data.type === "ldu:list-state") && data.url) {
        try {
          this.reportedUrl = new URL(data.url, document.baseURI).href;
        } catch {
          this.reportedUrl = "";
        }
      }
      if (data.type === "ldu:list-ready") this.sendInitialConfigs(this.iframe);
      this.onMessage(data, this.iframe);
    }
    sendPreviewConfig(iframe) {
      iframe.contentWindow?.postMessage({ type: "ldu:preview-config", ...this.frameConfig }, location.origin);
    }
    sendPageToolsConfig(iframe) {
      iframe.contentWindow?.postMessage({ type: "ldu:page-tools-config", ...this.frameConfig.pageTools }, location.origin);
    }
    sendInitialConfigs(iframe) {
      if (this.configSentForDocument) return;
      this.configSentForDocument = true;
      this.sendPreviewConfig(iframe);
      this.sendPageToolsConfig(iframe);
    }
    resolveSameOrigin(url) {
      try {
        const resolved = new URL(url, document.baseURI);
        return resolved.origin === location.origin && /^https?:$/.test(resolved.protocol) ? resolved : null;
      } catch {
        return null;
      }
    }
    attemptScrollRestore() {
      const iframe = this.iframe;
      const target = this.restoreScrollY;
      if (!iframe?.contentWindow || target <= 0) return;
      if (this.restoreTimer !== null) window.clearTimeout(this.restoreTimer);
      iframe.contentWindow.scrollTo({ top: target, behavior: "instant" });
      if (Math.abs(iframe.contentWindow.scrollY - target) <= 2 || Date.now() >= this.restoreDeadline) {
        this.restoreScrollY = 0;
        this.restoreDeadline = 0;
        this.restoreTimer = null;
        return;
      }
      this.restoreTimer = window.setTimeout(() => {
        this.restoreTimer = null;
        if (this.iframe === iframe) this.attemptScrollRestore();
      }, 100);
    }
    destroy() {
      if (this.restoreTimer !== null) window.clearTimeout(this.restoreTimer);
      this.restoreTimer = null;
      this.restoreScrollY = 0;
      this.restoreDeadline = 0;
      this.iframe?.remove();
      this.iframe = null;
      this.reportedUrl = "";
      this.configSentForDocument = false;
    }
  };
  function samePageToolsConfig2(left, right) {
    return left.ownerOnlyEnabled === right.ownerOnlyEnabled && left.minimalHidePosters === right.minimalHidePosters && left.minimalHideNotices === right.minimalHideNotices && left.minimalHideCategoryBadges === right.minimalHideCategoryBadges && left.minimalHideTags === right.minimalHideTags && left.lowEndOptimizationEnabled === right.lowEndOptimizationEnabled;
  }

  // src/tabs/tab-store.ts
  var TopicTabStore = class {
    constructor(session, maxTabs, onChange) {
      this.session = session;
      this.maxTabs = maxTabs;
      this.onChange = onChange;
    }
    getSession() {
      return this.session;
    }
    getTabs() {
      return this.session.tabs.map((tab) => ({ ...tab }));
    }
    get(tabId) {
      const tab = this.session.tabs.find((candidate) => candidate.id === tabId);
      return tab ? { ...tab } : null;
    }
    getPrimaryTabs() {
      const secondary = new Set(this.session.secondaryTabIds);
      return this.session.tabs.filter((tab) => !secondary.has(tab.id)).map((tab) => ({ ...tab }));
    }
    getSecondaryTabs() {
      const byId = new Map(this.session.tabs.map((tab) => [tab.id, tab]));
      return this.session.secondaryTabIds.flatMap((id) => byId.has(id) ? [{ ...byId.get(id) }] : []);
    }
    getActive() {
      return this.session.tabs.find((tab) => tab.id === this.session.activeTabId) ?? null;
    }
    getSecondaryActive() {
      return this.session.tabs.find((tab) => tab.id === this.session.secondaryActiveTabId) ?? null;
    }
    setSessionFields(fields, now, notify = true) {
      this.session = { ...this.session, ...fields, updatedAt: now };
      if (notify) this.emit();
    }
    open(input, now) {
      this.session = upsertTopicTab(this.session, input, now);
      if (this.session.tabs.length > this.maxTabs) {
        const removable = this.session.tabs.filter((tab) => tab.id !== this.session.activeTabId);
        const removeCount = this.session.tabs.length - this.maxTabs;
        const removeIds = new Set(removable.slice(0, removeCount).map((tab) => tab.id));
        this.session = { ...this.session, tabs: this.session.tabs.filter((tab) => !removeIds.has(tab.id)) };
      }
      this.repairPanelOwnership();
      this.emit();
      return this.getActive();
    }
    openSecondary(input, now) {
      this.session = upsertTopicTab(this.session, input, now);
      const tab = this.session.tabs.find((candidate) => candidate.topicId === input.topicId);
      if (!this.session.secondaryTabIds.includes(tab.id)) {
        this.session = {
          ...this.session,
          secondaryTabIds: [...this.session.secondaryTabIds, tab.id],
          secondaryActiveTabId: tab.id,
          activeTabId: this.session.activeTabId === tab.id ? this.getPrimaryTabs().find((candidate) => candidate.id !== tab.id)?.id ?? null : this.session.activeTabId
        };
      }
      this.repairPanelOwnership();
      this.emit();
      return { ...tab };
    }
    activate(tabId, now) {
      if (!this.getPrimaryTabs().some((tab) => tab.id === tabId)) return null;
      this.session = {
        ...this.session,
        activeTabId: tabId,
        tabs: this.session.tabs.map((tab) => tab.id === tabId ? { ...tab, lastActiveAt: now, suspended: false } : tab),
        updatedAt: now
      };
      this.emit();
      return this.getActive();
    }
    activateSecondary(tabId, now) {
      if (!this.session.secondaryTabIds.includes(tabId)) return null;
      this.session = {
        ...this.session,
        secondaryActiveTabId: tabId,
        tabs: this.session.tabs.map((tab) => tab.id === tabId ? { ...tab, lastActiveAt: now, suspended: false } : tab),
        updatedAt: now
      };
      this.emit();
      return this.getSecondaryActive();
    }
    moveToSecondary(tabId, now, notify = true) {
      if (!this.session.tabs.some((tab) => tab.id === tabId)) return null;
      if (this.session.secondaryTabIds.includes(tabId)) return this.activateSecondary(tabId, now);
      const primaryTabs = this.getPrimaryTabs();
      const index = primaryTabs.findIndex((tab) => tab.id === tabId);
      const remaining = primaryTabs.filter((tab) => tab.id !== tabId);
      this.session = {
        ...this.session,
        secondaryTabIds: [...this.session.secondaryTabIds, tabId],
        secondaryActiveTabId: tabId,
        activeTabId: this.session.activeTabId === tabId ? remaining[Math.min(index, remaining.length - 1)]?.id ?? null : this.session.activeTabId,
        tabs: this.session.tabs.map((tab) => tab.id === tabId ? { ...tab, lastActiveAt: now, suspended: false } : tab),
        updatedAt: now
      };
      if (notify) this.emit();
      return this.getSecondaryActive();
    }
    mergeSecondaryIntoPrimary(now, notify = true) {
      if (this.session.secondaryTabIds.length === 0) return;
      const lastSecondary = this.session.secondaryActiveTabId;
      this.session = {
        ...this.session,
        activeTabId: this.session.activeTabId ?? lastSecondary,
        secondaryTabIds: [],
        secondaryActiveTabId: null,
        updatedAt: now
      };
      if (notify) this.emit();
    }
    closeOthersInPane(tabId, now) {
      const secondary = this.session.secondaryTabIds.includes(tabId);
      const paneTabs = secondary ? this.getSecondaryTabs() : this.getPrimaryTabs();
      const removeIds = paneTabs.filter((tab) => tab.id !== tabId).map((tab) => tab.id);
      if (removeIds.length === 0) return [];
      const removeSet = new Set(removeIds);
      this.session = {
        ...this.session,
        tabs: this.session.tabs.filter((tab) => !removeSet.has(tab.id)),
        activeTabId: secondary ? this.session.activeTabId : tabId,
        secondaryTabIds: this.session.secondaryTabIds.filter((id) => !removeSet.has(id)),
        secondaryActiveTabId: secondary ? tabId : this.session.secondaryActiveTabId,
        updatedAt: now
      };
      this.emit();
      return removeIds;
    }
    reorderInPane(tabId, targetTabId, position, now) {
      if (tabId === targetTabId) return false;
      const secondary = this.session.secondaryTabIds.includes(tabId);
      if (secondary !== this.session.secondaryTabIds.includes(targetTabId)) return false;
      const paneIds = (secondary ? this.getSecondaryTabs() : this.getPrimaryTabs()).map((tab) => tab.id);
      const original = [...paneIds];
      const sourceIndex = paneIds.indexOf(tabId);
      if (sourceIndex < 0 || !paneIds.includes(targetTabId)) return false;
      paneIds.splice(sourceIndex, 1);
      const targetIndex = paneIds.indexOf(targetTabId);
      paneIds.splice(targetIndex + (position === "after" ? 1 : 0), 0, tabId);
      if (paneIds.every((id, index) => id === original[index])) return false;
      const paneSet = new Set(paneIds);
      const byId = new Map(this.session.tabs.map((tab) => [tab.id, tab]));
      let nextPaneIndex = 0;
      this.session = {
        ...this.session,
        tabs: this.session.tabs.map((tab) => paneSet.has(tab.id) ? byId.get(paneIds[nextPaneIndex++]) : tab),
        secondaryTabIds: secondary ? paneIds : this.session.secondaryTabIds,
        updatedAt: now
      };
      this.emit();
      return true;
    }
    update(tabId, patch, now, notify = true) {
      this.session = {
        ...this.session,
        tabs: this.session.tabs.map((tab) => tab.id === tabId ? { ...tab, ...patch, lastActiveAt: now } : tab),
        updatedAt: now
      };
      if (notify) this.emit();
    }
    suspend(tabId, now) {
      this.update(tabId, { suspended: true }, now);
    }
    close(tabId, now, notify = true) {
      this.session = closeTopicTab(this.session, tabId, now);
      if (notify) this.emit();
    }
    clear(now) {
      if (this.session.tabs.length === 0) return;
      this.session = { ...this.session, tabs: [], activeTabId: null, secondaryTabIds: [], secondaryActiveTabId: null, updatedAt: now };
      this.emit();
    }
    emit() {
      this.onChange?.(this.session);
    }
    repairPanelOwnership() {
      const validIds = new Set(this.session.tabs.map((tab) => tab.id));
      const secondaryTabIds = this.session.secondaryTabIds.filter((id) => validIds.has(id));
      const secondaryIds = new Set(secondaryTabIds);
      const primaryTabs = this.session.tabs.filter((tab) => !secondaryIds.has(tab.id));
      this.session = {
        ...this.session,
        secondaryTabIds,
        activeTabId: this.session.activeTabId && primaryTabs.some((tab) => tab.id === this.session.activeTabId) ? this.session.activeTabId : primaryTabs.at(-1)?.id ?? null,
        secondaryActiveTabId: this.session.secondaryActiveTabId && secondaryTabIds.includes(this.session.secondaryActiveTabId) ? this.session.secondaryActiveTabId : secondaryTabIds.at(-1) ?? null
      };
    }
  };

  // src/discourse/category.ts
  var PRIMARY_CATEGORY_COLORS = [
    ["\u5F00\u53D1\u8C03\u4F18", "rgb(50, 195, 195)"],
    ["\u56FD\u4EA7\u66FF\u4EE3", "rgb(209, 44, 37)"],
    ["\u8D44\u6E90\u835F\u8403", "rgb(18, 168, 157)"],
    ["\u6587\u6863\u5171\u5EFA", "rgb(156, 182, 196)"],
    ["\u8DF3\u86A4\u5E02\u573A", "rgb(237, 32, 123)"],
    ["\u79EF\u5206\u4E50\u56ED", "rgb(252, 202, 68)"],
    ["\u975E\u6211\u83AB\u5C5E", "rgb(168, 198, 254)"],
    ["\u8BFB\u4E66\u6210\u8BD7", "rgb(224, 217, 0)"],
    ["\u626C\u5E06\u8D77\u822A", "rgb(255, 152, 56)"],
    ["\u524D\u6CBF\u5FEB\u8BAF", "rgb(187, 143, 206)"],
    ["\u7F51\u7EDC\u8BB0\u5FC6", "rgb(247, 148, 29)"],
    ["\u798F\u5229\u7F8A\u6BDB", "rgb(228, 87, 53)"],
    ["\u641E\u4E03\u637B\u4E09", "rgb(58, 181, 74)"],
    ["\u793E\u533A\u5B75\u5316", "rgb(255, 187, 0)"],
    ["\u866B\u6D1E\u5E7F\u573A", "rgb(255, 0, 247)"],
    ["\u8FD0\u8425\u53CD\u9988", "rgb(128, 130, 129)"],
    ["\u6DF1\u6D77\u5E7D\u57DF", "rgb(69, 183, 209)"]
  ];
  function resolveFixedPrimaryCategory(title) {
    const titleWithoutSite = title.replace(/\s+-\s+LINUX DO(?:\s.*)?$/i, "");
    const separatorIndex = titleWithoutSite.lastIndexOf(" - ");
    const category = titleWithoutSite.slice(separatorIndex < 0 ? 0 : separatorIndex + 3).trim();
    const match = PRIMARY_CATEGORY_COLORS.find(([name]) => category === name || category.startsWith(`${name} /`) || category.startsWith(`${name},`));
    return match ? { name: match[0], color: match[1] } : null;
  }

  // src/ui/icons.ts
  var ICON_CONTENT = {
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.95 4.6 1.7 1.7 0 0 0 9.98 3.04V3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    split: '<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/><path d="M12 9v6m-3-3h6"/>',
    external: '<path d="M15 4h5v5M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
    refresh: '<path d="M20 6v5h-5"/><path d="M19 11a7 7 0 1 0 1 5"/>',
    copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    bookmark: '<path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',
    "bookmark-filled": '<path class="ldu-symbol-fill" d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',
    "close-others": '<rect x="3" y="5" width="13" height="12" rx="2"/><path d="M8 3h10a3 3 0 0 1 3 3v8"/><path d="m18 16 4 4m0-4-4 4"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    "tab-list": '<path d="m4 6 5 6-5 6M11 6h9M11 12h9M11 18h9"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    maximize: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
    restore: '<path d="M9 9H4V4M15 9h5V4M9 15H4v5M15 15h5v5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    "thumbs-up": '<path d="M7 10v11M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7A2 2 0 0 1 17.5 21H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z"/>',
    "thumbs-down": '<path d="M17 14V3M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.6l2.3-7A2 2 0 0 1 6.5 3H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9Z"/>',
    github: '<path d="M15 22v-3.9c.04-1-.35-1.76-.8-2.2 2.6-.3 5.3-1.27 5.3-5.75A4.5 4.5 0 0 0 18.3 7c.12-.3.52-1.53-.12-3.18 0 0-.98-.31-3.2 1.2a11.1 11.1 0 0 0-5.83 0c-2.22-1.51-3.2-1.2-3.2-1.2C5.3 5.47 5.7 6.7 5.82 7a4.5 4.5 0 0 0-1.2 3.15c0 4.47 2.72 5.46 5.32 5.75-.34.3-.64.82-.75 1.59-.67.3-2.37.82-3.42-.98 0 0-.62-1.13-1.8-1.21M9 19c-2.25 1-2.5-1-3.5-1.5"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M7.5 8C6.1 8 5 7 5 5.7S6.1 3.5 7.5 3.5C9.6 3.5 12 8 12 8s2.4-4.5 4.5-4.5C17.9 3.5 19 4.4 19 5.7S17.9 8 16.5 8"/>'
  };
  function iconSvg(name, size = 20) {
    return `<svg class="ldu-symbol ldu-symbol-${name}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_CONTENT[name]}</svg>`;
  }
  function setIcon(element, name, size = 20) {
    element.innerHTML = iconSvg(name, size);
  }
  function createIcon(doc, name, size = 18) {
    const icon = doc.createElement("span");
    icon.className = "ldu-context-icon";
    icon.innerHTML = iconSvg(name, size);
    return icon;
  }

  // src/tabs/tab-strip.ts
  var tabStripStates = /* @__PURE__ */ new WeakMap();
  function resetTabDragVisuals(root) {
    root.querySelectorAll(":scope > .ldu-tab-item[data-tab-id]").forEach((item) => {
      item.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
      item.setAttribute("aria-grabbed", "false");
      item.style.transform = "";
    });
    root.classList.remove("is-reordering");
  }
  function createTabItem(root) {
    const item = document.createElement("div");
    item.className = "ldu-tab-item";
    item.setAttribute("role", "presentation");
    item.setAttribute("aria-grabbed", "false");
    item.addEventListener("contextmenu", (event) => {
      const tabId = item.dataset.tabId;
      const state = tabStripStates.get(root);
      if (!tabId || !state) return;
      event.preventDefault();
      event.stopPropagation();
      state.callbacks.onContextMenu?.(tabId, event.clientX, event.clientY);
    });
    item.addEventListener("auxclick", (event) => {
      if (event.button !== 1) return;
      const tabId = item.dataset.tabId;
      const state = tabStripStates.get(root);
      if (!tabId || !state) return;
      event.preventDefault();
      event.stopPropagation();
      state.callbacks.onClose(tabId);
    });
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ldu-tab-button";
    button.setAttribute("role", "tab");
    const glyph = document.createElement("span");
    glyph.className = "ldu-tab-glyph";
    setIcon(glyph, "list", 15);
    const label = document.createElement("span");
    label.className = "ldu-tab-title";
    button.append(glyph, label);
    button.addEventListener("click", () => {
      const tabId = item.dataset.tabId;
      const state = tabStripStates.get(root);
      if (tabId && state) state.callbacks.onActivate(tabId);
    });
    button.addEventListener("keydown", (event) => {
      const tabId = item.dataset.tabId;
      const state = tabStripStates.get(root);
      if (!tabId || !state) return;
      const visibleItems = [...root.querySelectorAll(":scope > .ldu-tab-item[data-tab-id]")];
      const index = visibleItems.findIndex((candidate) => candidate.dataset.tabId === tabId);
      if (index < 0) return;
      const vertical = root.classList.contains("is-vertical");
      const previousKey = vertical ? "ArrowUp" : "ArrowLeft";
      const nextKey = vertical ? "ArrowDown" : "ArrowRight";
      let next = index;
      if (event.key === previousKey || event.key === nextKey) {
        event.preventDefault();
        next = (index + (event.key === nextKey ? 1 : -1) + visibleItems.length) % visibleItems.length;
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        next = event.key === "Home" ? 0 : visibleItems.length - 1;
      } else if (event.key === "Delete") {
        event.preventDefault();
        state.callbacks.onClose(tabId);
        return;
      } else {
        return;
      }
      const nextItem = visibleItems[next];
      if (!nextItem?.dataset.tabId) return;
      state.callbacks.onActivate(nextItem.dataset.tabId);
      nextItem.querySelector(".ldu-tab-button")?.focus();
    });
    const close = document.createElement("button");
    close.type = "button";
    close.className = "ldu-tab-close";
    close.draggable = false;
    setIcon(close, "close", 16);
    close.title = "\u5173\u95ED\u5E16\u5B50\u6807\u7B7E";
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      const tabId = item.dataset.tabId;
      const state = tabStripStates.get(root);
      if (tabId && state) state.callbacks.onClose(tabId);
    });
    item.append(button, close);
    return item;
  }
  function updateTabItem(item, tab, activeTabId, callbacks) {
    const active = tab.id === activeTabId;
    const title = tab.title || `\u4E3B\u9898 ${tab.topicId}`;
    item.dataset.tabId = tab.id;
    item.draggable = Boolean(callbacks.onReorder);
    item.classList.toggle("is-active", active);
    item.title = `${tab.title}
${tab.url}`;
    const category = resolveFixedPrimaryCategory(tab.title);
    item.dataset.categoryGroup = category?.name ?? "other";
    if (category) item.style.setProperty("--ldu-tab-category-color", category.color);
    else item.style.removeProperty("--ldu-tab-category-color");
    const button = item.querySelector(".ldu-tab-button");
    button.querySelector(".ldu-tab-title").textContent = title;
    button.id = `ldu-tab-${tab.id}`;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
    button.setAttribute("aria-label", `\u6253\u5F00 ${title}`);
    item.querySelector(".ldu-tab-close")?.setAttribute("aria-label", `\u5173\u95ED ${title}`);
  }
  function createGroupHeader(key) {
    const header = document.createElement("div");
    header.className = "ldu-tab-group-header";
    header.dataset.groupKey = key;
    header.setAttribute("role", "presentation");
    const marker = document.createElement("span");
    marker.className = "ldu-tab-group-marker";
    const label = document.createElement("span");
    label.className = "ldu-tab-group-label";
    header.append(marker, label);
    return header;
  }
  function renderTabStrip(root, tabs, activeTabId, callbacks, options = {}) {
    tabStripStates.set(root, { tabs, callbacks });
    resetTabDragVisuals(root);
    const orientation = options.orientation === "vertical" ? "vertical" : "horizontal";
    const grouped = orientation === "vertical" && options.groupByCategory === true;
    root.classList.toggle("is-vertical", orientation === "vertical");
    root.classList.toggle("is-grouped", grouped);
    root.setAttribute("aria-orientation", orientation);
    root.classList.toggle("is-category-colors-enabled", options.colorizeTabs !== false);
    let draggedTabId = null;
    let dropTarget = null;
    let dragMetrics = null;
    let insertionIndex = null;
    const clearDragState = () => {
      resetTabDragVisuals(root);
      draggedTabId = null;
      dropTarget = null;
      dragMetrics = null;
      insertionIndex = null;
    };
    const updateDragPosition = (pointerPosition) => {
      if (!draggedTabId || !dragMetrics) return;
      const source = dragMetrics.find((metric) => metric.tabId === draggedTabId);
      if (!source) return;
      const available = dragMetrics.filter((metric) => metric.tabId !== draggedTabId);
      const nextInsertionIndex = available.filter((metric) => pointerPosition >= metric.center).length;
      if (nextInsertionIndex === insertionIndex) return;
      insertionIndex = nextInsertionIndex;
      const destinationIndex = nextInsertionIndex;
      for (const metric of dragMetrics) {
        let offset = 0;
        if (destinationIndex > source.index && metric.index > source.index && metric.index <= destinationIndex) {
          offset = -source.shift;
        } else if (destinationIndex < source.index && metric.index >= destinationIndex && metric.index < source.index) {
          offset = source.shift;
        }
        metric.item.style.transform = offset ? orientation === "vertical" ? `translate3d(0, ${offset}px, 0)` : `translate3d(${offset}px, 0, 0)` : "";
        metric.item.classList.remove("is-drop-before", "is-drop-after");
      }
      const target = destinationIndex === 0 ? available[0] : available[destinationIndex - 1];
      if (!target) {
        dropTarget = null;
        return;
      }
      const position = destinationIndex === 0 ? "before" : "after";
      target.item.classList.add(position === "before" ? "is-drop-before" : "is-drop-after");
      dropTarget = { tabId: target.tabId, position };
    };
    root.ondragstart = (event) => {
      if (!callbacks.onReorder || !(event.target instanceof Element) || event.target.closest(".ldu-tab-close")) {
        event.preventDefault();
        return;
      }
      const item = event.target.closest(".ldu-tab-item[data-tab-id]");
      if (!item?.dataset.tabId) return;
      draggedTabId = item.dataset.tabId;
      const sourceGroup = item.dataset.categoryGroup;
      const items = [...root.querySelectorAll(".ldu-tab-item[data-tab-id]")].filter((candidate) => !grouped || candidate.dataset.categoryGroup === sourceGroup);
      const rects = items.map((candidate) => candidate.getBoundingClientRect());
      dragMetrics = items.map((candidate, index) => {
        const rect = rects[index];
        const nextRect = rects[index + 1];
        const previousRect = rects[index - 1];
        const start = orientation === "vertical" ? rect.top : rect.left;
        const end = orientation === "vertical" ? rect.bottom : rect.right;
        const size = orientation === "vertical" ? rect.height : rect.width;
        const nextStart = nextRect ? orientation === "vertical" ? nextRect.top : nextRect.left : null;
        const previousEnd = previousRect ? orientation === "vertical" ? previousRect.bottom : previousRect.right : null;
        const gap = nextStart !== null ? Math.max(0, nextStart - end) : previousEnd !== null ? Math.max(0, start - previousEnd) : 0;
        return {
          tabId: candidate.dataset.tabId,
          item: candidate,
          index,
          center: start + size / 2,
          shift: size + gap
        };
      });
      root.classList.add("is-reordering");
      item.classList.add("is-dragging");
      item.setAttribute("aria-grabbed", "true");
      event.dataTransfer?.setData("text/plain", draggedTabId);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        const rect = item.getBoundingClientRect();
        event.dataTransfer.setDragImage(
          item,
          Math.max(0, event.clientX - rect.left),
          Math.max(0, event.clientY - rect.top)
        );
      }
    };
    root.ondragover = (event) => {
      if (!draggedTabId || !dragMetrics) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      const pointerPosition = orientation === "vertical" ? event.clientY : event.clientX;
      if (Number.isFinite(pointerPosition)) updateDragPosition(pointerPosition);
    };
    root.ondrop = (event) => {
      if (!draggedTabId || !dragMetrics) return;
      event.preventDefault();
      const pointerPosition = orientation === "vertical" ? event.clientY : event.clientX;
      if (Number.isFinite(pointerPosition)) updateDragPosition(pointerPosition);
      if (!dropTarget) {
        clearDragState();
        return;
      }
      const sourceTabId = draggedTabId;
      const target = dropTarget;
      clearDragState();
      callbacks.onReorder?.(sourceTabId, target.tabId, target.position);
    };
    root.ondragend = clearDragState;
    const requestedIds = new Set(tabs.map((tab) => tab.id));
    const existing = new Map(
      [...root.querySelectorAll(":scope > .ldu-tab-item[data-tab-id]")].map((item) => [item.dataset.tabId, item])
    );
    for (const [tabId, item] of existing) {
      if (!requestedIds.has(tabId)) {
        item.remove();
        existing.delete(tabId);
      }
    }
    const desiredItems = tabs.map((tab) => {
      const item = existing.get(tab.id) ?? createTabItem(root);
      updateTabItem(item, tab, activeTabId, callbacks);
      return item;
    });
    const existingHeaders = new Map(
      [...root.querySelectorAll(":scope > .ldu-tab-group-header[data-group-key]")].map((header) => [header.dataset.groupKey, header])
    );
    const desiredNodes = [];
    if (grouped) {
      const groups = /* @__PURE__ */ new Map();
      tabs.forEach((tab, index) => {
        const category = resolveFixedPrimaryCategory(tab.title);
        const key = category?.name ?? "other";
        const group = groups.get(key) ?? {
          label: category?.name ?? "\u5176\u4ED6",
          color: category?.color ?? null,
          items: []
        };
        group.items.push(desiredItems[index]);
        groups.set(key, group);
      });
      for (const [key, group] of groups) {
        const header = existingHeaders.get(key) ?? createGroupHeader(key);
        header.querySelector(".ldu-tab-group-label").textContent = `${group.label} ${group.items.length}`;
        if (group.color) header.style.setProperty("--ldu-tab-category-color", group.color);
        else header.style.removeProperty("--ldu-tab-category-color");
        desiredNodes.push(header, ...group.items);
        existingHeaders.delete(key);
      }
    } else {
      desiredNodes.push(...desiredItems);
    }
    existingHeaders.forEach((header) => header.remove());
    let cursor = root.firstElementChild;
    for (const node of desiredNodes) {
      if (node !== cursor) root.insertBefore(node, cursor);
      cursor = node.nextElementSibling;
    }
  }

  // src/ui/styles.ts
  var APP_STYLE_ID = "linuxdo-ultimate-styles";
  var EMBEDDED_STYLE_ID = "linuxdo-ultimate-embedded-styles";
  var APP_STYLES = `
:root {
  --ldu-sidebar-width: 216px;
  --ldu-topic-track: 0.65fr;
  --ldu-list-track: 0.35fr;
  /* Set by LayoutController from the rendered Discourse header. */
  --ldu-header-height: var(--header-height, 0px);
  --ldu-border: var(--primary-low, #d9d9d9);
  --ldu-surface: var(--secondary, #fff);
  --ldu-surface-muted: var(--primary-very-low, #f5f5f5);
  --ldu-text: var(--primary, #222);
  --ldu-accent: var(--tertiary, #0088cc);
  --ldu-danger: var(--danger, #d04437);
  --ldu-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ldu-vertical-tabs-collapsed: calc(var(--font-0, 1rem) * 2.75);
}

html[data-ldu-hide-notices="true"] #global-notice-alert-global-notice,
html[data-ldu-hide-posters="true"] #main-outlet .topic-list .posters,
html[data-ldu-hide-category-badges="true"] #main-outlet .topic-list .badge-category__wrapper,
html[data-ldu-hide-tags="true"] #main-outlet .topic-list a.discourse-tag {
  display: none !important;
}

html[data-ldu-low-end="true"] *,
html[data-ldu-low-end="true"] *::before,
html[data-ldu-low-end="true"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

body.ldu-layout-active {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

html.ldu-layout-two-root {
  scrollbar-width: none;
}

html.ldu-layout-two-root::-webkit-scrollbar {
  width: 0;
  height: 0;
}

body.ldu-layout-active #main-container {
  width: 100% !important;
  max-width: none !important;
  padding-inline: 0 !important;
}

body.ldu-layout-active .d-header .wrap,
body.ldu-layout-active .d-header .contents {
  width: 100% !important;
  max-width: none !important;
}

body.ldu-layout-active .d-header .wrap {
  padding-inline: 8px !important;
}

body.ldu-layout-active #main-outlet-wrapper {
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  min-height: calc(100vh - var(--ldu-header-height)) !important;
  padding: 0 !important;
}

#ldu-layout-shell {
  position: fixed;
  z-index: 3;
  inset: var(--ldu-header-height) 0 0;
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  pointer-events: none;
}

#ldu-layout-shell[hidden] { display: none !important; }

body.ldu-layout-active.ldu-layout-three #ldu-layout-shell {
  grid-template-columns: var(--ldu-sidebar-width) minmax(0, var(--ldu-topic-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "sidebar topic list" !important;
}

body.ldu-layout-active.ldu-layout-three:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-topic-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "topic list" !important;
}

body.ldu-layout-active.ldu-layout-three.ldu-secondary-open #ldu-layout-shell {
  grid-template-columns: var(--ldu-sidebar-width) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "sidebar topic secondary-topic list" !important;
}

body.ldu-layout-active.ldu-layout-three.ldu-secondary-open:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "topic secondary-topic list" !important;
}

body.ldu-layout-active.ldu-layout-two #ldu-layout-shell {
  grid-template-columns: minmax(52px, var(--ldu-sidebar-width)) minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-track)) !important;
  grid-template-areas: "sidebar list topic" !important;
}

body.ldu-layout-active.ldu-layout-two:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-track)) !important;
  grid-template-areas: "list topic" !important;
}

body.ldu-layout-active.ldu-layout-two.ldu-secondary-open #ldu-layout-shell {
  grid-template-columns: minmax(52px, var(--ldu-sidebar-width)) minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) !important;
  grid-template-areas: "sidebar list topic secondary-topic" !important;
}

body.ldu-layout-active.ldu-layout-two.ldu-secondary-open:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) !important;
  grid-template-areas: "list topic secondary-topic" !important;
}

body.ldu-layout-active #main-outlet-wrapper > .sidebar-wrapper {
  position: fixed !important;
  z-index: 6;
  top: var(--ldu-header-height) !important;
  bottom: 0;
  left: 0;
  width: var(--ldu-sidebar-width) !important;
  min-width: 0 !important;
  height: calc(100vh - var(--ldu-header-height)) !important;
  max-height: none !important;
  overflow: auto !important;
  background: var(--ldu-surface);
  border-right: 1px solid var(--ldu-border);
}

body.ldu-layout-active:not(.has-sidebar-page) #main-outlet-wrapper > .sidebar-wrapper {
  display: none !important;
}

body.ldu-layout-active #main-outlet {
  display: none !important;
}

.ldu-list-content {
  position: relative;
  grid-area: list;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  pointer-events: auto;
  background: var(--ldu-surface);
  border-inline: 1px solid var(--ldu-border);
}

.ldu-list-content.is-native-handoff {
  overflow: auto;
  overscroll-behavior: contain;
}

.ldu-list-content.is-native-handoff > #main-outlet {
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  min-height: 100% !important;
  margin: 0 !important;
  padding-inline: 8px !important;
  box-sizing: border-box;
}

.ldu-list-content.is-native-handoff > .ldu-list-frame {
  visibility: hidden;
  pointer-events: none;
}

.ldu-list-frame {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-height: none !important;
  border: 0;
  background: var(--ldu-surface);
}

@container (max-width: 480px) {
  #main-outlet .topic-list .views { display: none !important; }
  #main-outlet .topic-list .topic-list-data { padding-inline: 6px !important; }
}

@container (max-width: 410px) {
  #main-outlet .topic-list .activity { display: none !important; }
  #main-outlet .topic-list .main-link { width: 100% !important; }
}

#ldu-topic-panel,
#ldu-secondary-topic-panel {
  grid-area: topic;
  position: sticky;
  top: var(--ldu-header-height);
  display: flex;
  height: calc(100vh - var(--ldu-header-height));
  min-width: 0;
  min-height: 0;
  align-self: start;
  flex-direction: column;
  overflow: hidden;
  background: var(--ldu-surface);
  color: var(--ldu-text);
  border-inline: 1px solid var(--ldu-border);
  container-type: inline-size;
}

#ldu-layout-shell #ldu-topic-panel,
#ldu-layout-shell #ldu-secondary-topic-panel {
  position: relative;
  top: auto;
  width: auto;
  height: 100%;
  pointer-events: auto;
}

#ldu-topic-panel[hidden],
#ldu-secondary-topic-panel[hidden] { display: none !important; }

#ldu-secondary-topic-panel {
  grid-area: secondary-topic;
  border-left: 0;
}

body.ldu-layout-three:not(.has-sidebar-page) #ldu-topic-panel { border-left: 0; }
body.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel,
body.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel { border-right: 0; }

.ldu-topic-toolbar {
  display: flex;
  min-height: 38px;
  align-items: center;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
}

/* Vertical rails have four explicit states: left/right and auto/static. */
body.ldu-tabs-vertical #ldu-topic-panel,
body.ldu-tabs-vertical #ldu-secondary-topic-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
}

body.ldu-tabs-vertical .ldu-topic-content {
  grid-row: 1;
}

body.ldu-tabs-vertical .ldu-topic-toolbar {
  --ldu-tabs-collapsed-clip: inset(0 calc(100% - var(--ldu-vertical-tabs-collapsed)) 0 0);
  z-index: 4;
  grid-row: 1;
  display: flex;
  width: min(17rem, max(10rem, calc(100cqi - .75rem)));
  min-height: 0;
  height: 100%;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  border-right: 1px solid var(--ldu-border);
  box-shadow: 4px 0 14px rgb(0 0 0 / 12%);
  clip-path: var(--ldu-tabs-collapsed-clip);
  transition: clip-path 180ms var(--ldu-ease-out), opacity 180ms ease-out;
  transition-delay: 180ms;
}

/* A middle detail pane keeps its rail on the left. */
body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-topic-panel,
body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-secondary-topic-panel,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-topic-panel {
  grid-template-columns: var(--ldu-vertical-tabs-collapsed) minmax(0, 1fr);
}

body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-topic-panel > .ldu-topic-toolbar,
body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-secondary-topic-panel > .ldu-topic-toolbar,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-topic-panel > .ldu-topic-toolbar {
  position: relative;
  grid-column: 1;
}

body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-topic-panel > .ldu-topic-content,
body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-secondary-topic-panel > .ldu-topic-content,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-topic-panel > .ldu-topic-content {
  grid-column: 2;
}

/* The rightmost detail pane overlays its compact rail on the iframe scrollbar. */
body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel {
  grid-template-columns: minmax(0, 1fr);
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel > .ldu-topic-toolbar,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel > .ldu-topic-toolbar {
  --ldu-tabs-collapsed-clip: inset(0 0 0 calc(100% - var(--ldu-vertical-tabs-collapsed)));
  position: absolute;
  inset-block: 0;
  right: 0;
  border-right: 0;
  border-left: 1px solid var(--ldu-border);
  box-shadow: -4px 0 14px rgb(0 0 0 / 12%);
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel > .ldu-topic-content,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel > .ldu-topic-content {
  grid-column: 1;
}

body.ldu-tabs-vertical .ldu-topic-toolbar:hover,
body.ldu-tabs-vertical .ldu-topic-toolbar:has(:focus-visible),
body.ldu-tabs-vertical .ldu-topic-toolbar.is-interaction-locked,
body.ldu-tabs-vertical .ldu-topic-toolbar:has(.ldu-tab-strip.is-reordering) {
  clip-path: inset(0);
  transition-delay: 80ms;
}

/* Fixed left rail. */
body.ldu-tabs-vertical.ldu-vertical-tabs-static:not(.ldu-layout-two) #ldu-topic-panel,
body.ldu-tabs-vertical.ldu-vertical-tabs-static:not(.ldu-layout-two) #ldu-secondary-topic-panel,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open.ldu-vertical-tabs-static #ldu-topic-panel {
  grid-template-columns: min(17rem, max(10rem, 46%)) minmax(0, 1fr);
}

/* Fixed right rail. */
body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open).ldu-vertical-tabs-static #ldu-topic-panel,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open.ldu-vertical-tabs-static #ldu-secondary-topic-panel {
  grid-template-columns: minmax(0, 1fr) min(17rem, max(10rem, 46%));
}

body.ldu-tabs-vertical.ldu-vertical-tabs-static .ldu-topic-toolbar {
  position: relative;
  width: 100%;
  clip-path: inset(0);
  transition: none;
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open).ldu-vertical-tabs-static #ldu-topic-panel > .ldu-topic-toolbar,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open.ldu-vertical-tabs-static #ldu-secondary-topic-panel > .ldu-topic-toolbar {
  right: auto;
  grid-column: 2;
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel .ldu-topic-actions,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel .ldu-topic-actions {
  justify-content: flex-end;
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel .ldu-vertical-tabs-heading,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel .ldu-vertical-tabs-heading {
  justify-content: flex-end;
  padding-right: 7px;
  padding-left: 0;
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel .ldu-vertical-tabs-heading > .ldu-symbol,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel .ldu-vertical-tabs-heading > .ldu-symbol {
  order: 2;
  transform: scaleX(-1);
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel .ldu-vertical-tabs-heading-label,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel .ldu-vertical-tabs-heading-label {
  text-align: right;
}

body.ldu-tabs-vertical .ldu-tab-title,
body.ldu-tabs-vertical .ldu-tab-group-label {
  text-align: start;
}

body.ldu-tabs-vertical .ldu-topic-toolbar .ldu-tab-strip {
  flex-direction: column;
  min-height: 0;
  align-items: stretch;
  gap: .35em;
  padding: .55em .35em;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel > .ldu-topic-toolbar .ldu-tab-strip,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel > .ldu-topic-toolbar .ldu-tab-strip {
  scrollbar-width: none;
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel > .ldu-topic-toolbar .ldu-tab-strip::-webkit-scrollbar,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel > .ldu-topic-toolbar .ldu-tab-strip::-webkit-scrollbar {
  display: none;
}

body.ldu-tabs-vertical .ldu-topic-toolbar .ldu-topic-actions {
  order: -1;
  justify-content: flex-start;
  min-height: 2.75em;
  border-bottom: 1px solid var(--ldu-border);
}

.ldu-vertical-tabs-heading { display: none; }

body.ldu-tabs-vertical .ldu-vertical-tabs-heading {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8px;
  padding-left: 7px;
  color: var(--primary-medium, #777);
  font-size: var(--font-down-1, .875rem);
  font-weight: 600;
  white-space: nowrap;
}

body.ldu-tabs-vertical .ldu-tab-item {
  position: relative;
  width: auto;
  min-width: 0;
  max-width: none;
  min-height: 2.75em;
  flex: 0 0 2.75em;
  border: 0;
  border-radius: .35em;
  font-size: var(--font-0, 1rem);
}

body.ldu-tabs-vertical .ldu-tab-button {
  display: flex;
  min-height: 2.75em;
  align-items: center;
  gap: .625em;
  padding: .625em .5em .625em .75em;
  font-size: var(--font-0, 1rem);
}

.ldu-tab-glyph {
  display: none;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  place-items: center;
  color: var(--ldu-tab-category-color, var(--primary-medium, #777));
}

body.ldu-tabs-vertical .ldu-tab-glyph { display: inline-grid; }

body.ldu-tabs-vertical .ldu-tab-close {
  width: 1.75em;
  height: 1.75em;
  margin-right: .25em;
}

body.ldu-tabs-vertical .ldu-tab-close .ldu-symbol {
  width: 1em;
  height: 1em;
}

.ldu-tab-title {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (hover: none) {
  body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-topic-panel,
  body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-secondary-topic-panel,
  body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-topic-panel {
    grid-template-columns: min(17rem, max(10rem, 46%)) minmax(0, 1fr);
  }

  body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel,
  body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel {
    grid-template-columns: minmax(0, 1fr) min(17rem, max(10rem, 46%));
  }

  body.ldu-tabs-vertical .ldu-topic-toolbar {
    position: relative;
    width: 100%;
    clip-path: inset(0);
    transition: none;
  }

  body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel > .ldu-topic-toolbar,
  body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel > .ldu-topic-toolbar {
    right: auto;
    grid-column: 2;
  }
}

body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-title,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-close,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-group-label,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-vertical-tabs-heading-label {
  visibility: hidden;
}

body.ldu-tabs-vertical .ldu-tab-item.is-active {
  box-shadow: inset 3px 0 0 var(--ldu-accent);
}

body.ldu-tabs-vertical .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active {
  background: color-mix(in srgb, var(--ldu-tab-category-color) 22%, var(--ldu-surface));
  box-shadow: inset 3px 0 0 color-mix(in srgb, var(--ldu-tab-category-color) 88%, var(--ldu-text));
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel .ldu-tab-item.is-active,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel .ldu-tab-item.is-active {
  box-shadow: inset -3px 0 0 var(--ldu-accent);
}

body.ldu-tabs-vertical.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active,
body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active {
  box-shadow: inset -3px 0 0 color-mix(in srgb, var(--ldu-tab-category-color) 88%, var(--ldu-text));
}

.ldu-tab-group-header {
  display: flex;
  min-height: 26px;
  align-items: center;
  gap: 7px;
  padding: 6px 8px 2px;
  color: var(--primary-medium, #777);
  font-size: var(--font-down-1, .875rem);
  font-weight: 600;
  letter-spacing: 0;
  white-space: nowrap;
}

.ldu-tab-group-marker {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: var(--ldu-tab-category-color, var(--primary-medium, #777));
}

.ldu-tab-group-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-tab-group-header {
  padding-left: 18px;
}

body.ldu-tabs-vertical .ldu-tab-item.is-drop-before::before,
body.ldu-tabs-vertical .ldu-tab-item.is-drop-after::after {
  top: auto;
  bottom: auto;
  left: 5px;
  right: 5px;
  width: auto;
  height: 2px;
}

body.ldu-tabs-vertical .ldu-tab-item.is-drop-before::before { top: -2px; }
body.ldu-tabs-vertical .ldu-tab-item.is-drop-after::after { bottom: -2px; }

@media (prefers-reduced-motion: reduce) {
  body.ldu-tabs-vertical .ldu-topic-toolbar { transition-duration: .01ms; }
}

.ldu-tab-strip {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: stretch;
  gap: 3px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.ldu-tab-item {
  --ldu-tab-category-color: transparent;
  display: flex;
  width: auto;
  min-width: 72px;
  max-width: 220px;
  flex: 1 1 0;
  align-items: center;
  box-sizing: border-box;
  border-inline: 1px solid color-mix(in srgb, var(--ldu-border) 72%, transparent);
  background: transparent;
}

.ldu-tab-strip.is-category-colors-enabled .ldu-tab-item {
  background: color-mix(in srgb, var(--ldu-tab-category-color) 14%, transparent);
}

.ldu-tab-item.is-active {
  background: var(--ldu-surface);
  box-shadow: inset 0 -3px 0 var(--ldu-accent);
}

.ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active {
  background: color-mix(in srgb, var(--ldu-tab-category-color) 22%, var(--ldu-surface));
  box-shadow: inset 0 -3px 0 color-mix(in srgb, var(--ldu-tab-category-color) 88%, var(--ldu-text));
}

.ldu-tab-context-menu {
  position: fixed;
  z-index: 1000002;
  width: max-content;
  min-width: 270px;
  max-width: min(340px, calc(100vw - 16px));
  padding: 6px 0;
  overflow: hidden;
  color: var(--primary, #202124);
  border: 1px solid color-mix(in srgb, var(--primary, #202124) 14%, transparent);
  border-radius: 6px;
  background: var(--secondary, #fff);
  box-shadow: 0 8px 24px rgb(0 0 0 / 24%), 0 2px 6px rgb(0 0 0 / 18%);
  font-family: var(--font-family, Arial, sans-serif);
  font-size: var(--font-down-1, 0.875rem);
}

.ldu-context-item {
  display: grid;
  width: 100%;
  min-height: 32px;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 10px;
  padding: 5px 18px;
  color: inherit;
  border: 0;
  background: transparent;
  font: inherit;
  letter-spacing: 0;
  text-align: left;
  white-space: nowrap;
  cursor: default;
}

.ldu-context-item:hover,
.ldu-context-item:focus-visible { background: var(--primary-low, #e8eaed); outline: none; }
.ldu-context-item:disabled { opacity: 0.42; }
.ldu-context-icon { display: inline-flex; width: 18px; flex: none; align-items: center; justify-content: center; color: var(--primary-medium, #5f6368); pointer-events: none; }
.ldu-context-label { min-width: 0; justify-self: start; text-align: left; }
.ldu-context-item:disabled .ldu-context-icon { opacity: .75; }
.ldu-symbol { display: block; flex: none; pointer-events: none; }
.ldu-symbol-fill { fill: currentColor; }

.ldu-tab-item[draggable="true"] { cursor: grab; }
.ldu-tab-strip.is-reordering .ldu-tab-item {
  will-change: transform;
  transition: transform 150ms cubic-bezier(.2, .8, .2, 1), opacity 100ms ease-out;
}
.ldu-tab-item.is-dragging { cursor: grabbing; opacity: .52; }
.ldu-tab-item.is-drop-before::before,
.ldu-tab-item.is-drop-after::after {
  position: absolute;
  z-index: 2;
  top: 3px;
  bottom: 3px;
  width: 2px;
  border-radius: 1px;
  background: var(--ldu-accent);
  content: "";
  pointer-events: none;
}
.ldu-tab-item.is-drop-before::before { left: -3px; }
.ldu-tab-item.is-drop-after::after { right: -3px; }

@media (prefers-reduced-motion: reduce) {
  .ldu-tab-strip.is-reordering .ldu-tab-item { transition-duration: .01ms; }
}
.ldu-context-shortcut { justify-self: end; color: var(--primary-medium, #5f6368); }
.ldu-context-separator { height: 1px; margin: 5px 0; background: var(--primary-low, #dadce0); }

.ldu-tab-button {
  min-width: 0;
  flex: 1;
  padding: 7px 6px 7px 10px;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: var(--ldu-text);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-down-1, .875rem);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ldu-tab-close {
  display: grid;
  width: 24px;
  height: 24px;
  margin-right: 2px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--primary-medium, #777);
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .ldu-tab-item:hover { background: var(--primary-low, #ddd); }
  .ldu-tab-item.is-active:hover { background: var(--ldu-surface); }
  .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item:hover { background: color-mix(in srgb, var(--ldu-tab-category-color) 18%, var(--primary-low, #ddd)); }
  .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active:hover { background: color-mix(in srgb, var(--ldu-tab-category-color) 24%, var(--ldu-surface)); }
  .ldu-tab-close:hover { background: var(--ldu-danger); color: #fff; }
}

.ldu-topic-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  padding-inline: 4px;
}

.ldu-icon-button {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--ldu-text);
  cursor: pointer;
  transition: background-color 120ms ease, transform 120ms var(--ldu-ease-out);
}

.ldu-icon-button:active { transform: scale(0.97); }
.ldu-icon-button:focus-visible { outline: 2px solid var(--ldu-accent); outline-offset: 1px; }

@media (hover: hover) and (pointer: fine) {
  .ldu-icon-button:hover { background: var(--primary-low, #ddd); }
}

.ldu-topic-content {
  position: relative;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background: var(--ldu-surface);
}

.ldu-topic-empty {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--primary-medium, #777);
  font-size: 13px;
}

.ldu-topic-frame {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-height: none !important;
  border: 0;
  background: var(--ldu-surface);
}

.ldu-topic-frame[aria-hidden="true"] { display: none; }

.ldu-resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 5;
  width: 7px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: col-resize;
  touch-action: none;
}

.ldu-resize-handle::after {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 1px;
  background: transparent;
  content: "";
  transition: background-color 120ms ease;
}

.ldu-resize-handle:focus-visible::after,
.ldu-resize-handle:hover::after { background: var(--ldu-accent); }
.ldu-resize-before { left: -4px; }
.ldu-resize-after { right: -4px; }
body.ldu-layout-two .ldu-resize-after { display: none; }
body.ldu-layout-three:not(.has-sidebar-page) .ldu-resize-before { display: none; }


.ldu-settings-panel {
  position: fixed;
  top: calc(var(--ldu-header-height) + 4px);
  right: 8px;
  z-index: 1000001;
  display: block;
  width: min(520px, calc(100vw - 16px));
  box-sizing: border-box;
  color: var(--ldu-text);
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  transform-origin: top right;
  transition: opacity 140ms ease, transform 160ms var(--ldu-ease-out);
}

.ldu-settings-panel[hidden] { display: none; }

@starting-style {
  .ldu-settings-panel:not([hidden]) {
    opacity: 0;
    transform: translateY(-4px) scale(.98);
  }
}

.ldu-settings-host {
  position: relative;
  z-index: 1000001;
  display: inline-flex;
  align-items: center;
  list-style: none;
}

.ldu-settings-host .ldu-icon-button {
  width: 32px;
  height: 32px;
  color: var(--header_primary, var(--ldu-text));
  font-size: var(--font-0, 1rem);
}

.ldu-settings-panel .dc-modal {
  display: flex;
  width: 100%;
  max-height: inherit;
  flex-direction: column;
  overflow: visible;
  border: 1px solid var(--ldu-border);
  border-radius: 6px;
  background: var(--ldu-surface);
  box-shadow: 0 16px 36px rgb(0 0 0 / 55%);
}

.ldu-settings-panel .dc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
}

.ldu-settings-panel .dc-header h2 {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 0;
  padding: 0;
  color: var(--ldu-text);
  font-size: var(--font-up-1, 1.05rem);
  font-weight: 700;
  line-height: 1.3;
}

.ldu-settings-panel .ldu-brand-ultimate {
  color: #ffd43b;
  text-shadow: 0 1px 0 rgb(0 0 0 / 35%);
}

.ldu-settings-panel .ldu-settings-version {
  margin-left: 6px;
  color: var(--primary-medium, #8b949e);
  font-size: var(--font-down-2, .75rem);
  font-weight: 500;
  letter-spacing: 0;
}

.ldu-settings-panel .dc-close-btn {
  padding: 2px 6px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--primary-medium, #777);
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
}

.ldu-settings-panel .dc-close-btn:hover { background: var(--primary-low, #2a2d32); color: var(--ldu-text); }

.ldu-settings-panel .dc-body { padding: 18px 20px; }

.ldu-settings-panel .dc-group { margin-bottom: 24px; padding: 0; border-top: 0; }
.ldu-settings-panel .dc-group:last-child { margin-bottom: 0; }

.ldu-settings-panel .dc-group-title {
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--ldu-border);
  color: var(--ldu-text);
  font-size: var(--font-up-1, 1.125rem);
  font-weight: 700;
  letter-spacing: 0;
}

.ldu-settings-panel .dc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ldu-border) 34%, transparent);
}

.ldu-settings-panel .dc-row:last-child { border-bottom: 0; }
.ldu-settings-panel .dc-dependent-row[hidden] { display: none; }
.ldu-settings-panel .ldu-settings-parent-group {
  border-bottom: 1px solid color-mix(in srgb, var(--ldu-border) 34%, transparent);
}
.ldu-settings-panel .ldu-settings-parent-group > .dc-row,
.ldu-settings-panel .ldu-settings-parent-group .ldu-settings-tree,
.ldu-settings-panel .ldu-settings-parent-group .ldu-settings-tree-row { border-bottom: 0; }
.ldu-settings-panel .ldu-settings-tree {
  position: relative;
  margin-left: 10px;
  padding-left: 22px;
}
.ldu-settings-panel .ldu-settings-tree::before {
  position: absolute;
  top: -12px;
  left: 0;
  height: 12px;
  border-left: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  content: "";
}
.ldu-settings-panel .ldu-settings-tree-row { position: relative; }
.ldu-settings-panel .ldu-settings-tree-row::before {
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: -22px;
  border-left: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  content: "";
}
.ldu-settings-panel .ldu-settings-tree-row::after {
  position: absolute;
  top: 50%;
  left: -22px;
  width: 12px;
  border-top: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  content: "";
}
.ldu-settings-panel .ldu-settings-tree-row:last-child::before {
  width: 12px;
  bottom: 50%;
  border-bottom: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  border-bottom-left-radius: 4px;
}
.ldu-settings-panel .ldu-settings-tree-row:last-child::after { display: none; }
.ldu-settings-panel .dc-label-box { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.ldu-settings-panel .dc-item-title { color: var(--ldu-text); font-size: var(--font-down-1, .875rem); font-weight: 600; line-height: 1.3; }
.ldu-settings-panel .dc-item-desc { color: var(--primary-medium, #8b949e); font-size: var(--font-down-2, .75rem); line-height: 1.35; }
.ldu-settings-panel .dc-item-desc.alert { color: var(--danger, #f85149); }
.ldu-settings-panel .ldu-settings-risk[hidden] { display: none; }
.ldu-settings-panel .ldu-settings-compact-row { min-height: 42px; }
.ldu-settings-panel .ldu-settings-check-grid { display: flex; flex: none; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px 14px; }
.ldu-settings-panel .ldu-settings-check { display: inline-flex; align-items: center; gap: 5px; color: var(--primary-medium, #8b949e); cursor: pointer; font-size: var(--font-down-2, .75rem); line-height: 1.2; white-space: nowrap; }
.ldu-settings-panel .ldu-settings-check input { width: 14px; height: 14px; margin: 0; accent-color: var(--ldu-accent); cursor: pointer; }

.ldu-settings-panel .dc-switch { position: relative; display: inline-block; width: 38px; height: 20px; flex: none; }
.ldu-settings-panel .dc-switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.ldu-settings-panel .dc-slider { position: absolute; inset: 0; border: 1px solid color-mix(in srgb, var(--primary-medium, #777) 70%, transparent); border-radius: 20px; background: color-mix(in srgb, var(--primary-medium, #777) 42%, transparent); cursor: pointer; transition: background-color 150ms ease, border-color 150ms ease; }
.ldu-settings-panel .dc-slider::before { position: absolute; width: 14px; height: 14px; bottom: 2px; left: 2px; border-radius: 50%; background: #d1d5db; content: ""; transition: transform 150ms var(--ldu-ease-out), background-color 150ms ease; }
.ldu-settings-panel .dc-switch input:checked + .dc-slider { border-color: var(--tertiary, #3b8ce0); background: var(--tertiary, #2d7ed2); }
.ldu-settings-panel .dc-switch input:checked + .dc-slider::before { transform: translateX(18px); background: #fff; }

.ldu-settings-panel .dc-pills { display: inline-flex; flex: none; padding: 2px; border: 1px solid var(--ldu-border); border-radius: 4px; background: var(--ldu-surface-muted); }
.ldu-settings-panel .dc-pill-btn { padding: 3px 9px; border: 0; border-radius: 2px; background: transparent; color: var(--primary-medium, #8b949e); cursor: pointer; font: inherit; font-size: var(--font-down-2, .75rem); font-weight: 500; transition: background-color 100ms ease, color 100ms ease, transform 100ms ease; }
.ldu-settings-panel .dc-pill-btn:hover { color: var(--ldu-text); }
.ldu-settings-panel .dc-pill-btn.active { background: color-mix(in srgb, var(--ldu-text) 10%, var(--ldu-surface-muted)); color: var(--ldu-text); font-weight: 600; }

.ldu-settings-panel .dc-range-group { display: flex; min-width: 0; flex: none; align-items: center; gap: 10px; }
.ldu-settings-panel .dc-range { width: 100px; height: 4px; margin: 0; border-radius: 2px; outline: 0; appearance: none; background: color-mix(in srgb, var(--primary-medium, #777) 42%, transparent); cursor: pointer; }
.ldu-settings-panel .dc-range::-webkit-slider-thumb { width: 14px; height: 14px; border: 0; border-radius: 2px; appearance: none; background: var(--ldu-accent); cursor: pointer; }
.ldu-settings-panel .dc-range::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 2px; background: var(--ldu-accent); cursor: pointer; }
.ldu-settings-panel .dc-range-number { min-width: 16px; color: var(--ldu-accent); font-family: ui-monospace, monospace; font-size: var(--font-down-1, .875rem); font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }

.ldu-settings-panel .dc-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-top: 1px solid var(--ldu-border); background: var(--ldu-surface-muted); }
.ldu-settings-panel .dc-btn { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border: 1px solid var(--ldu-border); border-radius: 4px; background: color-mix(in srgb, var(--ldu-text) 5%, var(--ldu-surface-muted)); color: var(--ldu-text); cursor: pointer; font: inherit; font-size: var(--font-down-2, .8rem); font-weight: 500; text-decoration: none; transition: background-color 120ms ease, transform 120ms var(--ldu-ease-out); }
.ldu-settings-panel .ldu-update-available,
.ldu-settings-host .ldu-update-available { border-color: #ffd43b; animation: ldu-update-pulse 1.6s ease-in-out infinite; }
@keyframes ldu-update-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgb(255 212 59 / 0%); }
  50% { box-shadow: 0 0 0 4px rgb(255 212 59 / 36%); }
}
@media (prefers-reduced-motion: reduce) {
  .ldu-settings-panel .ldu-update-available,
  .ldu-settings-host .ldu-update-available { animation: none; box-shadow: 0 0 0 3px rgb(255 212 59 / 32%); }
}
.ldu-settings-panel .dc-btn:hover { border-color: var(--primary-medium, #777); background: var(--primary-low, #2a2d32); }
.ldu-settings-panel .dc-btn-ghost { border-color: transparent; background: transparent; color: var(--primary-medium, #8b949e); }
.ldu-settings-panel .dc-btn-ghost:hover { border-color: transparent; background: color-mix(in srgb, var(--danger, #e45735) 10%, transparent); color: var(--danger, #e45735); }
.ldu-settings-panel .dc-footer-right { position: relative; display: flex; gap: 8px; }
.ldu-settings-panel .ldu-update-wrap { position: relative; }
.ldu-settings-panel .dc-dropdown-menu.ldu-update-menu {
  right: 0;
  width: min(420px, calc(100vw - 32px));
  min-width: min(360px, calc(100vw - 32px));
  max-width: none;
  gap: 10px;
  padding: 16px;
  border-radius: 8px;
}
.ldu-settings-panel .ldu-update-summary {
  display: grid;
  gap: 8px;
  color: var(--ldu-text);
  font-size: var(--font-down-1, .875rem);
  line-height: 1.55;
}
.ldu-settings-panel .ldu-update-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ldu-settings-panel .ldu-update-title { font-size: var(--font-0, 1rem); font-weight: 700; }
.ldu-settings-panel .ldu-update-version {
  padding: 2px 8px;
  border: 1px solid color-mix(in srgb, #ffd43b 55%, var(--ldu-border));
  border-radius: 999px;
  background: color-mix(in srgb, #ffd43b 12%, transparent);
  color: color-mix(in srgb, #ffd43b 78%, var(--ldu-text));
  font-size: var(--font-down-2, .75rem);
  font-weight: 700;
}
.ldu-settings-panel .ldu-update-date { color: var(--primary-medium, #8b949e); font-size: var(--font-down-2, .75rem); }
.ldu-settings-panel .ldu-update-changelog { margin: 0; padding-left: 20px; text-align: left; }
.ldu-settings-panel .ldu-update-changelog li + li { margin-top: 6px; }
.ldu-settings-panel .ldu-update-changelog li::marker { color: var(--ldu-accent); }
.ldu-settings-panel .ldu-update-link {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  background: var(--ldu-accent);
  color: #fff;
  font-size: var(--font-down-1, .875rem);
  font-weight: 600;
  text-align: center;
}
.ldu-settings-panel .ldu-donate-wrap { position: relative; }
.ldu-settings-panel .dc-dropdown-menu { position: absolute; right: 0; bottom: calc(100% + 6px); z-index: 2; display: flex; min-width: 100px; flex-direction: column; padding: 4px; border: 1px solid var(--ldu-border); border-radius: 4px; background: var(--ldu-surface-muted); box-shadow: 0 6px 18px rgb(0 0 0 / 50%); }
.ldu-settings-panel .dc-dropdown-menu[hidden] { display: none; }
.ldu-settings-panel .dc-dropdown-item { display: block; width: 100%; padding: 6px 10px; border: 0; border-radius: 2px; background: transparent; color: var(--ldu-text); cursor: pointer; font: inherit; font-size: var(--font-down-2, .75rem); text-align: left; text-decoration: none; }
.ldu-settings-panel .dc-dropdown-item:hover { background: var(--ldu-accent); color: #fff; }

.ldu-settings-panel :is(.dc-close-btn, .dc-pill-btn, .dc-btn, .dc-dropdown-item):active { transform: scale(.97); }

@media (max-width: 560px) {
  .ldu-settings-panel .dc-header,
  .ldu-settings-panel .dc-body,
  .ldu-settings-panel .dc-footer { padding-inline: 12px; }
  .ldu-settings-panel .dc-row { gap: 10px; }
  .ldu-settings-panel .dc-item-desc { font-size: var(--font-down-2, .75rem); }
  .ldu-settings-panel .dc-range { width: 82px; }
}

@media (max-height: 820px) and (min-width: 561px) {
  .ldu-settings-panel .dc-header { padding-block: 9px; }
  .ldu-settings-panel .dc-body { padding-block: 9px; }
  .ldu-settings-panel .dc-group { margin-bottom: 10px; }
  .ldu-settings-panel .dc-group-title { padding-bottom: 4px; margin-bottom: 2px; }
  .ldu-settings-panel .dc-row { padding-block: 5px; }
  .ldu-settings-panel .dc-label-box { gap: 1px; }
  .ldu-settings-panel .dc-item-desc { line-height: 1.2; }
  .ldu-settings-panel .dc-footer { padding-block: 8px; }
}

.ldu-settings-panel :is(button, a, select, input):focus-visible {
  outline: 2px solid var(--ldu-accent);
  outline-offset: 2px;
}

.ldu-credit-host {
  display: flex;
  align-items: center;
  list-style: none;
}

.ldu-credit-button {
  display: flex;
  height: 26px;
  min-width: 53px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0 8px 0 0;
  padding: 4px 8px;
  border: 1px solid var(--primary-medium, #838383);
  border-radius: 4px;
  background: transparent;
  box-sizing: border-box;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  white-space: nowrap;
}

.ldu-credit-button.is-loading,
.ldu-credit-button.is-neutral { color: var(--primary-medium, #6b7280); }
.ldu-credit-button.is-positive { color: #10b981; }
.ldu-credit-button.is-negative { color: var(--danger, #ef4444); }

@media (hover: hover) and (pointer: fine) {
  .ldu-credit-button:hover { background: var(--primary-low, rgb(255 255 255 / 12%)); }
}

.ldu-credit-tooltip {
  position: fixed;
  z-index: 1000002;
  padding: 8px 10px;
  border: 1px solid var(--ldu-border);
  border-radius: 6px;
  background: var(--ldu-text);
  box-shadow: 0 6px 18px rgb(0 0 0 / 18%);
  color: var(--ldu-surface);
  font-size: var(--font-down-1, .875rem);
  line-height: 1.5;
  pointer-events: none;
  white-space: pre;
}

.ldu-credit-tooltip[hidden] { display: none; }

.ldu-action-toast {
  position: fixed;
  z-index: 10001;
  left: 50%;
  bottom: max(24px, env(safe-area-inset-bottom));
  translate: -50% 0;
  max-width: min(420px, calc(100vw - 32px));
  padding: 9px 14px;
  border: 1px solid color-mix(in srgb, var(--success, #2e7d32) 35%, var(--ldu-border));
  border-radius: 8px;
  background: var(--ldu-surface);
  color: var(--ldu-text);
  box-shadow: 0 8px 28px rgb(0 0 0 / .2);
  font-size: var(--font-down-1, .875rem);
}

.ldu-action-toast.is-error {
  border-color: color-mix(in srgb, var(--ldu-danger) 45%, var(--ldu-border));
  color: var(--ldu-danger);
}

@media (prefers-reduced-motion: reduce) {
  .ldu-icon-button,
  .ldu-resize-handle::after,
  .ldu-settings-panel,
  .ldu-settings-reset,
  .ldu-settings-action,
  .ldu-donate-menu a { transition-duration: 0ms !important; }
}
`;
  var EMBEDDED_STYLES = `
:root {
  --ldu-sidebar-width: 216px;
  --ldu-topic-track: 0.65fr;
  --ldu-list-track: 0.35fr;
  --ldu-header-height: var(--header-height, 0px);
  --ldu-border: var(--primary-low, #d9d9d9);
  --ldu-surface: var(--secondary, #fff);
  --ldu-surface-muted: var(--primary-very-low, #f5f5f5);
  --ldu-text: var(--primary, #222);
  --ldu-accent: var(--tertiary, #0088cc);
  --ldu-danger: var(--danger, #d04437);
  --ldu-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}

html[data-ldu-hide-notices="true"] #global-notice-alert-global-notice,
html[data-ldu-hide-posters="true"] #main-outlet .topic-list .posters,
html[data-ldu-hide-category-badges="true"] #main-outlet .topic-list .badge-category__wrapper,
html[data-ldu-hide-tags="true"] #main-outlet .topic-list a.discourse-tag {
  display: none !important;
}

html[data-ldu-low-end="true"] *,
html[data-ldu-low-end="true"] *::before,
html[data-ldu-low-end="true"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

html[data-ldu-embedded-topic="true"] #d-sidebar,
html[data-ldu-embedded-topic="true"] .sidebar-wrapper,
html[data-ldu-embedded-topic="true"] .d-header,
html[data-ldu-embedded-list="true"] #d-sidebar,
html[data-ldu-embedded-list="true"] .sidebar-wrapper,
html[data-ldu-embedded-list="true"] .d-header {
  display: none !important;
}

html[data-ldu-embedded-list="true"],
html[data-ldu-embedded-list="true"] body {
  overflow-x: hidden !important;
  overflow-y: auto !important;
}

html[data-ldu-embedded-list="true"] #main-container,
html[data-ldu-embedded-list="true"] #main-outlet-wrapper,
html[data-ldu-embedded-list="true"] #main-outlet {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

html[data-ldu-embedded-list="true"] #main-outlet-wrapper {
  display: block !important;
  padding: 0 !important;
}

html[data-ldu-embedded-list="true"] #main-outlet {
  padding: 0 10px max(12px, env(safe-area-inset-bottom)) !important;
  container-type: inline-size;
}

html[data-ldu-embedded-topic="true"] #main-container,
html[data-ldu-embedded-topic="true"] #main-outlet,
html[data-ldu-embedded-topic="true"] .post-stream,
html[data-ldu-embedded-topic="true"] .topic-post,
html[data-ldu-embedded-topic="true"] .topic-body {
  width: 100% !important;
  max-width: none !important;
  margin-inline: 0 !important;
  box-sizing: border-box !important;
}

html[data-ldu-embedded-topic="true"] #main-outlet-wrapper {
  width: 100% !important;
  max-width: none !important;
  grid-template-columns: minmax(0, 1fr) !important;
  grid-template-areas: "content" !important;
}

html[data-ldu-embedded-topic="true"] #main-outlet {
  grid-area: content !important;
  padding: 12px clamp(12px, 3vw, 40px) max(12px, env(safe-area-inset-bottom)) !important;
}

html[data-ldu-embedded-topic="true"] .container.posts {
  width: 100% !important;
  max-width: none !important;
  grid-template-columns: minmax(0, 1fr) minmax(7.5rem, 16%) !important;
  grid-template-areas: "posts timeline" !important;
}

html[data-ldu-embedded-topic="true"] .topic-navigation {
  display: block !important;
  grid-area: timeline !important;
  min-width: 0 !important;
  margin-inline-start: clamp(.35rem, 1vw, .75rem) !important;
}

html[data-ldu-embedded-topic="true"] .timeline-container,
html[data-ldu-embedded-topic="true"] .topic-timeline {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: .35rem !important;
  align-items: stretch !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .ldu-owner-toggle,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .show-summary,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .top-replies {
  grid-column: 1 / -1 !important;
  width: 100% !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .reply-to-post,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button > button {
  width: 100% !important;
}
`;
  function ensureAppStyles(doc = document) {
    const existing = doc.getElementById(APP_STYLE_ID);
    if (existing instanceof HTMLStyleElement) return existing;
    const style = doc.createElement("style");
    style.id = APP_STYLE_ID;
    style.textContent = APP_STYLES;
    (doc.head ?? doc.documentElement).append(style);
    return style;
  }
  function ensureEmbeddedStyles(doc = document) {
    const existing = doc.getElementById(EMBEDDED_STYLE_ID);
    if (existing instanceof HTMLStyleElement) return existing;
    const style = doc.createElement("style");
    style.id = EMBEDDED_STYLE_ID;
    style.textContent = EMBEDDED_STYLES;
    (doc.head ?? doc.documentElement).append(style);
    return style;
  }

  // src/ui/layout-controller.ts
  var NARROW_BREAKPOINT = 1100;
  var WIDE_BREAKPOINT = 1680;
  function resolveLayoutMode(preference, viewportWidth) {
    if (viewportWidth < NARROW_BREAKPOINT) return "native";
    if (preference === "two" || preference === "three") return preference;
    return viewportWidth >= WIDE_BREAKPOINT ? "three" : "two";
  }
  var LayoutController = class {
    constructor(options) {
      this.options = options;
      this.preference = options.preference;
      this.paneSizes = { ...options.paneSizes };
      this.dualPaneSizes = { ...options.dualPaneSizes ?? options.paneSizes };
      this.tabPresentation = options.tabPresentation ?? "horizontal";
      this.verticalTabsAutoCollapse = options.verticalTabsAutoCollapse !== false;
    }
    shell = null;
    panel = null;
    content = null;
    secondaryPanel = null;
    secondaryContent = null;
    listContent = null;
    preference;
    paneSizes;
    dualPaneSizes;
    tabPresentation;
    verticalTabsAutoCollapse;
    open = false;
    secondaryOpen = false;
    listHandoff = null;
    headerResizeObserver = null;
    resizeListener = () => this.apply();
    mount() {
      ensureAppStyles();
      const wrapper = document.querySelector("#main-outlet-wrapper");
      const outlet = document.querySelector("#main-outlet");
      if (!wrapper || !outlet) return false;
      if (!this.shell) {
        this.shell = this.createShell();
        document.body.append(this.shell);
        this.panel = this.shell.querySelector("#ldu-topic-panel");
        this.content = this.panel?.querySelector(".ldu-topic-content") ?? null;
        this.secondaryPanel = this.shell.querySelector("#ldu-secondary-topic-panel");
        this.secondaryContent = this.secondaryPanel?.querySelector(".ldu-topic-content") ?? null;
        this.listContent = this.shell.querySelector(".ldu-list-content");
        window.addEventListener("resize", this.resizeListener, { passive: true });
        if (typeof ResizeObserver !== "undefined") {
          const header = document.querySelector(".d-header");
          if (header) {
            this.headerResizeObserver = new ResizeObserver(() => this.apply());
            this.headerResizeObserver.observe(header);
          }
        }
      } else if (this.shell.parentElement !== document.body) {
        document.body.append(this.shell);
      }
      this.apply();
      return true;
    }
    destroy() {
      this.finishListHandoff();
      window.removeEventListener("resize", this.resizeListener);
      this.headerResizeObserver?.disconnect();
      this.headerResizeObserver = null;
      this.shell?.remove();
      this.shell = null;
      this.panel = null;
      this.content = null;
      this.secondaryPanel = null;
      this.secondaryContent = null;
      this.listContent = null;
      this.open = false;
      this.secondaryOpen = false;
      document.body.classList.remove("ldu-layout-active", "ldu-layout-two", "ldu-layout-three", "ldu-secondary-open", "ldu-tabs-vertical", "ldu-vertical-tabs-static");
      document.documentElement.classList.remove("ldu-layout-two-root");
    }
    setOpen(open) {
      this.open = open;
      this.apply();
    }
    setSecondaryOpen(open) {
      this.secondaryOpen = open;
      this.apply();
    }
    setPreference(preference) {
      this.preference = preference;
      this.apply();
    }
    setTabPresentation(presentation, autoCollapse = this.verticalTabsAutoCollapse) {
      this.tabPresentation = presentation;
      this.verticalTabsAutoCollapse = autoCollapse;
      this.apply();
    }
    setTabInteractionLocked(locked, pane) {
      const panel = pane === "secondary" ? this.secondaryPanel : this.panel;
      panel?.querySelector(".ldu-topic-toolbar")?.classList.toggle("is-interaction-locked", locked);
    }
    setPaneSizes(paneSizes, dualPaneSizes = this.dualPaneSizes) {
      this.paneSizes = { ...paneSizes };
      this.dualPaneSizes = { ...dualPaneSizes };
      this.apply();
    }
    getContentElement() {
      return this.content;
    }
    getSecondaryContentElement() {
      return this.secondaryContent;
    }
    getListContentElement() {
      return this.listContent;
    }
    getShellElement() {
      return this.shell;
    }
    beginListHandoff(scrollY) {
      if (this.listHandoff || !this.listContent) return false;
      const outlet = document.querySelector("#main-outlet");
      const parent = outlet?.parentElement;
      if (!outlet || !parent || parent === this.listContent) return false;
      this.listHandoff = {
        outlet,
        parent,
        nextSibling: outlet.nextSibling,
        scrollY: Math.max(0, scrollY)
      };
      this.listContent.classList.add("is-native-handoff");
      this.listContent.prepend(outlet);
      this.listContent.scrollTop = this.listHandoff.scrollY;
      return true;
    }
    finishListHandoff() {
      const handoff = this.listHandoff;
      if (!handoff) return null;
      this.listHandoff = null;
      if (handoff.nextSibling?.parentNode === handoff.parent) {
        handoff.parent.insertBefore(handoff.outlet, handoff.nextSibling);
      } else {
        handoff.parent.append(handoff.outlet);
      }
      this.listContent?.classList.remove("is-native-handoff");
      if (this.listContent) this.listContent.scrollTop = 0;
      return handoff.scrollY;
    }
    getTabStripElement() {
      return this.panel?.querySelector(".ldu-tab-strip") ?? null;
    }
    getSecondaryTabStripElement() {
      return this.secondaryPanel?.querySelector(".ldu-tab-strip") ?? null;
    }
    getActionsElement() {
      return this.panel?.querySelector(".ldu-topic-actions") ?? null;
    }
    getSecondaryActionsElement() {
      return this.secondaryPanel?.querySelector(".ldu-topic-actions") ?? null;
    }
    getPanelElement() {
      return this.panel;
    }
    getSecondaryPanelElement() {
      return this.secondaryPanel;
    }
    getMode() {
      return this.open ? resolveLayoutMode(this.preference, window.innerWidth) : "native";
    }
    apply() {
      if (!this.panel || !this.secondaryPanel || !this.shell) return;
      this.syncHeaderHeight();
      const mode = this.getMode();
      const active = mode !== "native";
      this.panel.hidden = !active;
      this.secondaryPanel.hidden = !active || !this.secondaryOpen;
      this.shell.hidden = !active;
      document.body.classList.toggle("ldu-layout-active", active);
      document.body.classList.toggle("ldu-layout-two", mode === "two");
      document.body.classList.toggle("ldu-layout-three", mode === "three");
      document.documentElement.classList.toggle("ldu-layout-two-root", mode === "two");
      document.body.classList.toggle("ldu-secondary-open", active && this.secondaryOpen);
      const verticalTabs = active && this.tabPresentation === "vertical";
      document.body.classList.toggle("ldu-tabs-vertical", verticalTabs);
      document.body.classList.toggle("ldu-vertical-tabs-static", verticalTabs && !this.verticalTabsAutoCollapse);
      const paneSizes = this.getActivePaneSizes();
      document.documentElement.style.setProperty("--ldu-sidebar-width", `${paneSizes.sidebar}px`);
      document.documentElement.style.setProperty("--ldu-topic-track", `${1 - paneSizes.listRatio}fr`);
      document.documentElement.style.setProperty("--ldu-topic-split-track", `${(1 - paneSizes.listRatio) / 2}fr`);
      document.documentElement.style.setProperty("--ldu-list-track", `${paneSizes.listRatio}fr`);
      this.updateSeparatorValues();
    }
    createPanel(secondary = false) {
      const panel = document.createElement("section");
      panel.id = secondary ? "ldu-secondary-topic-panel" : "ldu-topic-panel";
      panel.className = secondary ? "ldu-secondary-topic-panel" : "";
      panel.hidden = true;
      panel.setAttribute("aria-label", secondary ? "\u7B2C\u4E8C\u5E16\u5B50\u9605\u8BFB\u533A" : "\u5E16\u5B50\u9605\u8BFB\u533A");
      panel.innerHTML = `
      <div class="ldu-topic-toolbar">
        <div class="ldu-tab-strip" role="tablist" aria-label="${secondary ? "\u7B2C\u4E8C\u9605\u8BFB\u533A" : "\u4E3B\u9605\u8BFB\u533A"}\u5DF2\u6253\u5F00\u7684\u5E16\u5B50"></div>
        <div class="ldu-topic-actions"><span class="ldu-vertical-tabs-heading">${iconSvg("tab-list", 18)}<span class="ldu-vertical-tabs-heading-label">\u5E16\u5B50\u6807\u7B7E</span></span></div>
      </div>
      <div class="ldu-topic-content">
        <div class="ldu-topic-empty">\u4ECE\u5217\u8868\u4E2D\u9009\u62E9\u5E16\u5B50</div>
      </div>
      ${secondary ? "" : '<button class="ldu-resize-handle ldu-resize-before" type="button" aria-label="\u8C03\u6574\u5DE6\u4FA7\u533A\u57DF\u5BBD\u5EA6"></button><button class="ldu-resize-handle ldu-resize-after" type="button" aria-label="\u8C03\u6574\u4E3B\u9898\u5217\u8868\u5BBD\u5EA6"></button>'}
    `;
      if (!secondary) {
        this.bindResizeHandle(panel.querySelector(".ldu-resize-before"), "before");
        this.bindResizeHandle(panel.querySelector(".ldu-resize-after"), "after");
      }
      return panel;
    }
    createShell() {
      const shell = document.createElement("div");
      shell.id = "ldu-layout-shell";
      shell.hidden = true;
      shell.setAttribute("aria-label", "Linux Do \u5206\u5C4F\u5DE5\u4F5C\u533A");
      const list = document.createElement("div");
      list.className = "ldu-list-content";
      list.setAttribute("aria-label", "\u975E\u9605\u8BFB\u9875\u533A\u57DF");
      shell.append(list, this.createPanel(), this.createPanel(true));
      return shell;
    }
    bindResizeHandle(handle, side) {
      if (!(handle instanceof HTMLElement)) return;
      handle.setAttribute("role", "separator");
      handle.setAttribute("aria-orientation", "vertical");
      handle.tabIndex = 0;
      handle.addEventListener("keydown", (event) => {
        if (!(event instanceof KeyboardEvent) || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
        const mode = this.getMode();
        const layout = this.secondaryOpen ? "dual" : "single";
        const paneSizes = this.getActivePaneSizes();
        if (side === "before" && mode === "three" && document.body.classList.contains("has-sidebar-page")) {
          paneSizes.sidebar = event.key === "Home" ? 160 : event.key === "End" ? 360 : Math.min(360, Math.max(160, paneSizes.sidebar + direction * 12));
        } else if (side === "after" && mode === "three" || side === "before" && mode === "two") {
          const ratioDirection = mode === "three" ? -direction : direction;
          paneSizes.listRatio = event.key === "Home" ? 0.3 : event.key === "End" ? 0.7 : clampRatio3(paneSizes.listRatio + ratioDirection * 0.02);
        } else {
          return;
        }
        this.apply();
        this.options.onPaneSizesChange?.({ ...paneSizes }, layout);
      });
      handle.addEventListener("pointerdown", (event) => {
        if (!(event instanceof PointerEvent) || event.button !== 0) return;
        const startX = event.clientX;
        const layout = this.secondaryOpen ? "dual" : "single";
        const paneSizes = this.getActivePaneSizes();
        const start = { ...paneSizes };
        handle.setPointerCapture(event.pointerId);
        const move = (moveEvent) => {
          const delta = moveEvent.clientX - startX;
          const mode = this.getMode();
          const wrapper = this.panel?.parentElement;
          const availableWidth = Math.max(1, (wrapper?.clientWidth ?? window.innerWidth) - paneSizes.sidebar);
          if (side === "after" && mode === "three") {
            paneSizes.listRatio = clampRatio3(start.listRatio - delta / availableWidth);
          } else if (side === "before" && mode === "two") {
            paneSizes.listRatio = clampRatio3(start.listRatio + delta / availableWidth);
          } else if (side === "before" && mode === "three" && document.body.classList.contains("has-sidebar-page")) {
            paneSizes.sidebar = Math.round(Math.min(360, Math.max(160, start.sidebar + delta)));
          }
          this.apply();
        };
        const finish = () => {
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", finish);
          handle.removeEventListener("pointercancel", finish);
          this.options.onPaneSizesChange?.({ ...paneSizes }, layout);
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", finish);
        handle.addEventListener("pointercancel", finish);
      });
    }
    updateSeparatorValues() {
      if (!this.panel) return;
      const mode = this.getMode();
      const paneSizes = this.getActivePaneSizes();
      const before = this.panel.querySelector(".ldu-resize-before");
      const after = this.panel.querySelector(".ldu-resize-after");
      const set = (handle, value, min, max) => {
        if (!handle) return;
        handle.setAttribute("aria-valuemin", String(min));
        handle.setAttribute("aria-valuemax", String(max));
        handle.setAttribute("aria-valuenow", String(value));
      };
      if (mode === "three" && document.body.classList.contains("has-sidebar-page")) {
        set(before, paneSizes.sidebar, 160, 360);
      } else {
        set(before, Math.round(paneSizes.listRatio * 100), 30, 70);
      }
      set(after, Math.round(paneSizes.listRatio * 100), 30, 70);
    }
    syncHeaderHeight() {
      const header = document.querySelector(".d-header");
      if (!header) return;
      const height = Math.ceil(header.getBoundingClientRect().height);
      if (height > 0) document.documentElement.style.setProperty("--ldu-header-height", `${height}px`);
    }
    getActivePaneSizes() {
      return this.secondaryOpen ? this.dualPaneSizes : this.paneSizes;
    }
  };
  function clampRatio3(value) {
    return Math.round(Math.min(0.7, Math.max(0.3, value)) * 1e3) / 1e3;
  }

  // src/core/update-checker.ts
  var UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/jzcangshu/linuxdo-ultimate/main/updates/latest.json";
  var UPDATE_CACHE_KEY = "linuxdo-ultimate:update-cache";
  var UPDATE_ATTEMPT_KEY = "linuxdo-ultimate:update-attempt";
  var UPDATE_CACHE_TTL_MS = 24 * 60 * 6e4;
  var UPDATE_FAILURE_COOLDOWN_MS = 60 * 6e4;
  function compareVersions(left, right) {
    const parse = (value) => {
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
  function validateUpdateManifest(value) {
    if (!value || typeof value !== "object") throw new Error("\u66F4\u65B0\u6E05\u5355\u683C\u5F0F\u65E0\u6548");
    const source = value;
    const version = typeof source.version === "string" ? source.version : "";
    const publishedAt = typeof source.publishedAt === "string" ? source.publishedAt : "";
    const releaseUrl = typeof source.releaseUrl === "string" ? source.releaseUrl : "";
    const changelog = Array.isArray(source.changelog) ? source.changelog.filter((item) => typeof item === "string").slice(0, 8) : [];
    if (source.schemaVersion !== 1 || !/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(version) || !publishedAt || changelog.length === 0) {
      throw new Error("\u66F4\u65B0\u6E05\u5355\u5185\u5BB9\u4E0D\u5B8C\u6574");
    }
    const parsedUrl = new URL(releaseUrl);
    if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "github.com" || parsedUrl.pathname !== "/jzcangshu/linuxdo-ultimate/releases/tag/v" + version.replace(/^v/i, "")) {
      throw new Error("\u66F4\u65B0\u6E05\u5355\u53D1\u5E03\u5730\u5740\u65E0\u6548");
    }
    return { schemaVersion: 1, version, publishedAt, releaseUrl, changelog };
  }
  function defaultRequest(options) {
    if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest(options);
    let aborted = false;
    void fetch(options.url, { headers: options.headers, signal: AbortSignal.timeout(options.timeout) }).then(async (response) => {
      if (!aborted) options.onload({ status: response.status, responseText: await response.text() });
    }).catch((error) => {
      if (!aborted) options.onerror(error);
    });
    return { abort: () => {
      aborted = true;
    } };
  }
  function getCurrentVersion() {
    try {
      if (typeof chrome !== "undefined") {
        const version = chrome.runtime?.getManifest?.().version;
        if (version) return version;
      }
    } catch {
    }
    try {
      if (typeof GM_info !== "undefined" && GM_info.script.version) return GM_info.script.version;
    } catch {
    }
    return "0.0.0";
  }
  var UpdateChecker = class {
    constructor(storage, request = defaultRequest, currentVersion = getCurrentVersion()) {
      this.storage = storage;
      this.request = request;
      this.currentVersion = currentVersion;
    }
    async check(force = false) {
      const now = Date.now();
      const cached = await Promise.resolve(this.storage.get(UPDATE_CACHE_KEY, null));
      if (!force && cached?.checkedByVersion === this.currentVersion && now - cached.checkedAt < UPDATE_CACHE_TTL_MS) {
        return this.compare(cached.manifest);
      }
      const lastAttempt = await Promise.resolve(this.storage.get(UPDATE_ATTEMPT_KEY, 0));
      if (!force && lastAttempt > 0 && now - lastAttempt < UPDATE_FAILURE_COOLDOWN_MS) {
        return cached ? this.compare(cached.manifest) : { status: "current", version: this.currentVersion };
      }
      this.storage.set(UPDATE_ATTEMPT_KEY, now);
      return new Promise((resolve) => {
        const finishError = (message) => resolve({ status: "error", message });
        this.request({
          method: "GET",
          url: force ? `${UPDATE_MANIFEST_URL}?t=${now}` : UPDATE_MANIFEST_URL,
          headers: { Accept: "application/json" },
          timeout: 1e4,
          onload: (response) => {
            if (response.status < 200 || response.status >= 300) {
              finishError(`HTTP ${response.status}`);
              return;
            }
            try {
              const manifest = validateUpdateManifest(JSON.parse(response.responseText));
              this.storage.set(UPDATE_CACHE_KEY, {
                checkedAt: now,
                checkedByVersion: this.currentVersion,
                manifest
              });
              resolve(this.compare(manifest));
            } catch (error) {
              finishError(error instanceof Error ? error.message : "\u66F4\u65B0\u6E05\u5355\u89E3\u6790\u5931\u8D25");
            }
          },
          onerror: () => finishError("\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25"),
          ontimeout: () => finishError("\u8BF7\u6C42\u8D85\u65F6")
        });
      });
    }
    compare(manifest) {
      return compareVersions(manifest.version, this.currentVersion) > 0 ? { status: "available", manifest } : { status: "current", version: this.currentVersion };
    }
  };

  // src/ui/settings-panel.ts
  var SettingsPanel = class {
    constructor(host, settings, callbacks) {
      this.host = host;
      this.settings = settings;
      this.callbacks = callbacks;
    }
    panel = null;
    toggleButton = null;
    updateStatusTimer = null;
    mount() {
      if (this.panel) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ldu-icon-button btn-flat no-text";
      setIcon(button, "settings", 20);
      button.title = "\u5E03\u5C40\u4E0E\u529F\u80FD\u8BBE\u7F6E";
      button.setAttribute("aria-label", "\u5E03\u5C40\u4E0E\u529F\u80FD\u8BBE\u7F6E");
      button.setAttribute("aria-controls", "ldu-settings-panel");
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", () => {
        if (!this.panel) return;
        this.setPanelOpen(this.panel.hidden);
      });
      this.toggleButton = button;
      this.host.append(button);
      const panel = document.createElement("div");
      panel.id = "ldu-settings-panel";
      panel.className = "ldu-settings-panel";
      panel.hidden = true;
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "\u5E03\u5C40\u4E0E\u529F\u80FD\u8BBE\u7F6E");
      panel.innerHTML = `
      <div class="dc-modal">
        <header class="dc-header">
          <h2 class="ldu-settings-heading">Linux Do <span class="ldu-brand-ultimate">Ultimate</span><span class="ldu-settings-version">v${getCurrentVersion()}</span></h2>
          <button type="button" class="dc-close-btn ldu-settings-close" title="\u5173\u95ED" aria-label="\u5173\u95ED\u8BBE\u7F6E">${iconSvg("close", 16)}</button>
        </header>
        <div class="dc-body">
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-layout-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-layout-heading">\u5E03\u5C40</div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u542F\u7528\u5206\u5C4F\u6A21\u5F0F</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="tabsEnabled"><span class="dc-slider"></span></span>
            </label>
            <div class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u5E16\u5B50\u6B63\u6587\u5C55\u793A\u4F4D\u7F6E</span>
              </span>
              <div class="dc-pills" data-pills-setting="layoutPreference">
                <button type="button" class="dc-pill-btn" data-val="auto">\u81EA\u52A8</button>
                <button type="button" class="dc-pill-btn" data-val="two">\u53F3\u4FA7</button>
                <button type="button" class="dc-pill-btn" data-val="three">\u4E2D\u95F4</button>
              </div>
            </div>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-reading-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-reading-heading">\u9605\u8BFB\u4E0E\u6807\u7B7E</div>
            <div class="ldu-settings-parent-group dc-dependent-row" data-depends-on="tabsEnabled">
              <div class="dc-row ldu-settings-control ldu-settings-parent-row">
                <span class="dc-label-box">
                  <span class="dc-item-title">\u6807\u7B7E\u9875\u6837\u5F0F</span>
                </span>
                <div class="dc-pills" data-pills-setting="tabPresentation">
                  <button type="button" class="dc-pill-btn" data-val="horizontal">\u6A2A\u5411</button>
                  <button type="button" class="dc-pill-btn" data-val="vertical">\u5782\u76F4</button>
                </div>
              </div>
              <div class="ldu-settings-tree">
                <label class="dc-row ldu-settings-control ldu-settings-tree-row dc-dependent-row" data-depends-on="tabPresentation" data-depends-value="vertical">
                  <span class="dc-label-box">
                    <span class="dc-item-title">\u81EA\u52A8\u6536\u8D77\u6807\u7B7E\u680F</span>
                  </span>
                  <span class="dc-switch"><input type="checkbox" data-setting="verticalTabsAutoCollapse"><span class="dc-slider"></span></span>
                </label>
                <label class="dc-row ldu-settings-control ldu-settings-tree-row dc-dependent-row" data-depends-on="tabPresentation" data-depends-value="vertical">
                  <span class="dc-label-box">
                    <span class="dc-item-title">\u81EA\u52A8\u6309\u5E16\u5B50\u5206\u7C7B\u6574\u7406\u6807\u7B7E\u9875</span>
                  </span>
                  <span class="dc-switch"><input type="checkbox" data-setting="groupVerticalTabs"><span class="dc-slider"></span></span>
                </label>
                <label class="dc-row ldu-settings-control ldu-settings-tree-row">
                  <span class="dc-label-box">
                    <span class="dc-item-title">\u6807\u7B7E\u9875\u4E0A\u8272</span>
                    <span class="dc-item-desc">\u81EA\u52A8\u6309\u5E16\u5B50\u5206\u7C7B\u4E3A\u6807\u7B7E\u9875\u4E0A\u8272</span>
                  </span>
                  <span class="dc-switch"><input type="checkbox" data-setting="colorizeTabs"><span class="dc-slider"></span></span>
                </label>
              </div>
            </div>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u6062\u590D\u4E0A\u6B21\u5173\u95ED\u524D\u6253\u5F00\u7684\u5E16\u5B50</span>
                <span class="dc-item-desc">\u4E0B\u6B21\u8BBF\u95EE\u65F6\u6062\u590D\u6700\u540E\u5173\u95ED\u7684\u6D4F\u89C8\u5668\u6807\u7B7E\u9875\u4F1A\u8BDD</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="restoreSession"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u6D3B\u52A8\u9875\u9762\u4E0A\u9650</span>
                <span class="dc-item-desc">\u9650\u5236\u540C\u65F6\u4FDD\u7559\u5728\u5185\u5B58\u4E2D\u7684\u5E16\u5B50\u9875\u9762\u6570\u91CF</span>
              </span>
              <span class="dc-range-group ldu-settings-range-control"><input type="range" class="dc-range" data-setting="maxLiveFrames" min="1" max="10" step="1"><output class="dc-range-number" data-output="maxLiveFrames"></output></span>
            </label>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-style-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-style-heading">\u8BBA\u575B\u7F8E\u5316</div>
            <div class="ldu-settings-parent-group">
              <label class="dc-row ldu-settings-control ldu-settings-parent-row">
                <span class="dc-label-box">
                  <span class="dc-item-title">\u6781\u7B80\u6A21\u5F0F</span>
                  <span class="dc-item-desc">\u6309\u9700\u9690\u85CF\u8BBA\u575B\u4E2D\u7684\u6B21\u8981\u4FE1\u606F</span>
                </span>
                <span class="dc-switch"><input type="checkbox" data-setting="cleanModeEnabled"><span class="dc-slider"></span></span>
              </label>
              <div class="ldu-settings-tree ldu-minimal-options dc-dependent-row" data-depends-on="cleanModeEnabled">
                <div class="dc-row ldu-settings-control ldu-settings-tree-row ldu-settings-compact-row">
                  <span class="dc-item-title">\u9690\u85CF\u5185\u5BB9</span>
                  <div class="ldu-settings-check-grid" role="group" aria-label="\u6781\u7B80\u6A21\u5F0F\u9690\u85CF\u5185\u5BB9">
                    <label class="ldu-settings-check"><input type="checkbox" data-setting="minimalHidePosters"><span>\u5217\u8868\u5934\u50CF</span></label>
                    <label class="ldu-settings-check"><input type="checkbox" data-setting="minimalHideNotices"><span>\u516C\u544A</span></label>
                    <label class="ldu-settings-check"><input type="checkbox" data-setting="minimalHideCategoryBadges"><span>\u5206\u7C7B\u5FBD\u7AE0</span></label>
                    <label class="ldu-settings-check"><input type="checkbox" data-setting="minimalHideTags"><span>\u8BDD\u9898\u6807\u7B7E</span></label>
                  </div>
                </div>
              </div>
            </div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u51CF\u5C11\u52A8\u753B\u4E0E\u8FC7\u6E21\u6548\u679C</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="lowEndOptimizationEnabled"><span class="dc-slider"></span></span>
            </label>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-tools-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-tools-heading">\u5B9E\u7528\u5DE5\u5177</div>
            <div class="ldu-settings-parent-group">
              <label class="dc-row ldu-settings-control ldu-settings-parent-row">
                <span class="dc-label-box">
                  <span class="dc-item-title">\u94FE\u63A5\u60AC\u6D6E\u9884\u89C8</span>
                  <span class="dc-item-desc alert ldu-settings-risk" data-depends-on="previewEnabled" role="note">\u9884\u89C8\u9875\u9762\u4F1A\u8FD0\u884C\u76EE\u6807\u7F51\u7AD9\u811A\u672C\uFF0C\u8BF7\u53EA\u9884\u89C8\u53EF\u4FE1\u94FE\u63A5\u3002</span>
                </span>
                <span class="dc-switch"><input type="checkbox" data-setting="previewEnabled"><span class="dc-slider"></span></span>
              </label>
              <div class="ldu-settings-tree dc-dependent-row" data-depends-on="previewEnabled">
                <div class="dc-row ldu-settings-control ldu-settings-tree-row">
                  <span class="dc-label-box">
                    <span class="dc-item-title">\u89E6\u53D1\u65B9\u5F0F</span>
                  </span>
                  <div class="dc-pills" data-pills-setting="previewClickMode">
                    <button type="button" class="dc-pill-btn" data-val="double">\u53CC\u51FB</button>
                    <button type="button" class="dc-pill-btn" data-val="single">\u5355\u51FB</button>
                  </div>
                </div>
              </div>
            </div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u5728\u9876\u90E8\u663E\u793A LDC \u6536\u5165</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="creditEnabled"><span class="dc-slider"></span></span>
            </label>
          </section>
        </div>
        <footer class="dc-footer ldu-settings-footer">
          <button type="button" class="dc-btn dc-btn-ghost ldu-settings-reset">\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E</button>
          <div class="dc-footer-right ldu-settings-actions">
            <div class="ldu-update-wrap">
              <button type="button" class="dc-btn ldu-settings-action ldu-settings-update" aria-expanded="false" aria-controls="ldu-update-menu">${iconSvg("refresh", 14)}\u68C0\u67E5\u66F4\u65B0</button>
              <div class="dc-dropdown-menu ldu-update-menu" id="ldu-update-menu" role="status" aria-live="polite" hidden>
                <div class="ldu-update-summary"></div>
                <a class="dc-dropdown-item ldu-update-link" href="#" target="_blank" rel="noopener noreferrer">\u67E5\u770B\u65B0\u7248\u5E76\u4E0B\u8F7D</a>
              </div>
            </div>
            <a class="dc-btn ldu-settings-action ldu-settings-github" href="https://github.com/jzcangshu/linuxdo-ultimate" target="_blank" rel="noopener noreferrer">${iconSvg("github", 14)}Github</a>
            <div class="ldu-donate-wrap">
              <button type="button" class="dc-btn ldu-settings-action ldu-settings-donate" aria-expanded="false" aria-controls="ldu-donate-menu">${iconSvg("gift", 14)}LDC \u6350\u8D60</button>
              <div class="dc-dropdown-menu ldu-donate-menu" id="ldu-donate-menu" role="menu" aria-label="\u9009\u62E9LDC\u6350\u8D60\u989D\u5EA6" hidden>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=87d0a248e696e18399f2458fcfec6b3c889059feedfbacb500af59382fe5416d" target="_blank" rel="noopener noreferrer">1 LDC</a>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=06325a8a0293c81624c065fd8922f6ed591beac0c95c1ac122463d1b4bf78be8" target="_blank" rel="noopener noreferrer">5 LDC</a>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=783190ffe634374e940ad558140c583942c8e4c13c89bc09782596b07bd63bb3" target="_blank" rel="noopener noreferrer">10 LDC</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    `;
      this.panel = panel;
      this.host.append(panel);
      this.sync();
      panel.querySelectorAll("[data-setting]").forEach((control) => {
        control.addEventListener("change", () => this.readControl(control));
        control.addEventListener("input", () => this.readControl(control));
      });
      panel.querySelectorAll("[data-pills-setting] .dc-pill-btn").forEach((button2) => {
        button2.addEventListener("click", () => this.readPill(button2));
      });
      panel.querySelector(".ldu-settings-close")?.addEventListener("click", () => this.setPanelOpen(false));
      panel.querySelector(".ldu-settings-reset")?.addEventListener("click", () => {
        if (!window.confirm("\u786E\u5B9A\u8981\u6062\u590D\u5168\u90E8\u9ED8\u8BA4\u8BBE\u7F6E\u5417\uFF1F")) return;
        this.settings = structuredClone(DEFAULT_SETTINGS);
        this.sync();
        this.callbacks.onChange({ ...this.settings });
      });
      panel.querySelector(".ldu-settings-donate")?.addEventListener("click", () => {
        const menu = panel.querySelector(".ldu-donate-menu");
        this.setDonationMenuOpen(Boolean(menu?.hidden));
      });
      panel.querySelector(".ldu-settings-update")?.addEventListener("click", () => {
        void this.callbacks.onCheckUpdates?.();
      });
      panel.querySelectorAll(".ldu-donate-menu a").forEach((link) => {
        link.addEventListener("click", () => this.setDonationMenuOpen(false));
      });
      panel.querySelector(".ldu-update-link")?.addEventListener("click", () => {
        this.setUpdateMenuOpen(false);
      });
      document.addEventListener("pointerdown", (event) => {
        if (!this.panel?.hidden && !this.host.contains(event.target)) this.setPanelOpen(false);
      }, true);
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const menu = this.panel?.querySelector(".ldu-donate-menu");
        if (menu && !menu.hidden) {
          this.setDonationMenuOpen(false);
        } else if (this.panel?.querySelector(".ldu-update-menu")?.hidden === false) {
          this.setUpdateMenuOpen(false);
        } else if (this.panel && !this.panel.hidden) {
          this.setPanelOpen(false);
          this.toggleButton?.focus({ preventScroll: true });
        }
      }, true);
    }
    setSettings(settings) {
      this.settings = settings;
      this.sync();
    }
    setUpdateState(result, showDetails = false) {
      const button = this.panel?.querySelector(".ldu-settings-update");
      const menu = this.panel?.querySelector(".ldu-update-menu");
      const summary = this.panel?.querySelector(".ldu-update-summary");
      const link = this.panel?.querySelector(".ldu-update-link");
      if (!button || !menu || !summary || !link) return;
      if (this.updateStatusTimer !== null) window.clearTimeout(this.updateStatusTimer);
      button.disabled = result.status === "checking";
      const hasUpdate = result.status === "available";
      button.classList.toggle("ldu-update-available", hasUpdate);
      this.toggleButton?.classList.toggle("ldu-update-available", hasUpdate);
      if (result.status === "checking") {
        this.setUpdateButton(button, "\u68C0\u67E5\u4E2D...");
        button.title = "\u6B63\u5728\u68C0\u67E5\u66F4\u65B0";
        this.setUpdateMenuOpen(false);
        return;
      }
      if (result.status === "available") {
        this.setUpdateButton(button, `\u53D1\u73B0 v${result.manifest.version}`);
        button.title = `\u53D1\u73B0\u65B0\u7248\u672C v${result.manifest.version}`;
        summary.replaceChildren();
        const header = document.createElement("div");
        header.className = "ldu-update-header";
        const title = document.createElement("strong");
        title.className = "ldu-update-title";
        title.textContent = "\u53D1\u73B0\u65B0\u7248\u672C";
        const version = document.createElement("span");
        version.className = "ldu-update-version";
        version.textContent = `v${result.manifest.version}`;
        header.append(title, version);
        const publishedAt = document.createElement("time");
        publishedAt.className = "ldu-update-date";
        publishedAt.dateTime = result.manifest.publishedAt;
        publishedAt.textContent = `\u53D1\u5E03\u4E8E ${result.manifest.publishedAt}`;
        const list = document.createElement("ul");
        list.className = "ldu-update-changelog";
        result.manifest.changelog.forEach((item) => {
          const entry = document.createElement("li");
          entry.textContent = item;
          list.append(entry);
        });
        summary.append(header, publishedAt, list);
        link.href = result.manifest.releaseUrl;
        this.setUpdateMenuOpen(showDetails);
        return;
      }
      this.setUpdateButton(button, result.status === "current" ? "\u5DF2\u662F\u6700\u65B0\u7248" : "\u68C0\u67E5\u5931\u8D25");
      button.title = result.status === "error" ? result.message : "\u5F53\u524D\u5DF2\u662F\u6700\u65B0\u7248\u672C";
      this.setUpdateMenuOpen(false);
      this.updateStatusTimer = window.setTimeout(() => {
        this.setUpdateButton(button, "\u68C0\u67E5\u66F4\u65B0");
        button.title = "\u68C0\u67E5\u66F4\u65B0";
      }, 2500);
    }
    setUpdateButton(button, label) {
      button.innerHTML = `${iconSvg("refresh", 14)}${label}`;
    }
    sync() {
      if (!this.panel) return;
      const tabs = this.panel.querySelector('[data-setting="tabsEnabled"]');
      const verticalTabsAutoCollapse = this.panel.querySelector('[data-setting="verticalTabsAutoCollapse"]');
      const groupVerticalTabs = this.panel.querySelector('[data-setting="groupVerticalTabs"]');
      const restore = this.panel.querySelector('[data-setting="restoreSession"]');
      const colorizeTabs = this.panel.querySelector('[data-setting="colorizeTabs"]');
      const cleanMode = this.panel.querySelector('[data-setting="cleanModeEnabled"]');
      const minimalHidePosters = this.panel.querySelector('[data-setting="minimalHidePosters"]');
      const minimalHideNotices = this.panel.querySelector('[data-setting="minimalHideNotices"]');
      const minimalHideCategoryBadges = this.panel.querySelector('[data-setting="minimalHideCategoryBadges"]');
      const minimalHideTags = this.panel.querySelector('[data-setting="minimalHideTags"]');
      const lowEndOptimization = this.panel.querySelector('[data-setting="lowEndOptimizationEnabled"]');
      const preview = this.panel.querySelector('[data-setting="previewEnabled"]');
      const credit = this.panel.querySelector('[data-setting="creditEnabled"]');
      const live = this.panel.querySelector('[data-setting="maxLiveFrames"]');
      const output = this.panel.querySelector('[data-output="maxLiveFrames"]');
      if (tabs) tabs.checked = this.settings.tabsEnabled;
      if (verticalTabsAutoCollapse) verticalTabsAutoCollapse.checked = this.settings.verticalTabsAutoCollapse;
      if (groupVerticalTabs) groupVerticalTabs.checked = this.settings.groupVerticalTabs;
      if (restore) restore.checked = this.settings.restoreSession;
      if (colorizeTabs) colorizeTabs.checked = this.settings.colorizeTabs;
      if (cleanMode) cleanMode.checked = this.settings.cleanModeEnabled;
      if (minimalHidePosters) minimalHidePosters.checked = this.settings.minimalHidePosters;
      if (minimalHideNotices) minimalHideNotices.checked = this.settings.minimalHideNotices;
      if (minimalHideCategoryBadges) minimalHideCategoryBadges.checked = this.settings.minimalHideCategoryBadges;
      if (minimalHideTags) minimalHideTags.checked = this.settings.minimalHideTags;
      if (lowEndOptimization) lowEndOptimization.checked = this.settings.lowEndOptimizationEnabled;
      if (preview) preview.checked = this.settings.previewEnabled;
      if (credit) credit.checked = this.settings.creditEnabled;
      if (live) live.value = String(this.settings.maxLiveFrames);
      if (output) output.value = String(this.settings.maxLiveFrames);
      this.syncPills("layoutPreference", this.settings.layoutPreference);
      this.syncPills("tabPresentation", this.settings.tabPresentation);
      this.syncPills("previewClickMode", this.settings.previewClickMode);
      this.syncDependencies();
    }
    readControl(control) {
      const key = control.dataset.setting;
      if (!key || key === "schemaVersion" || key === "paneSizes" || key === "dualPaneSizes") return;
      let value;
      if (control instanceof HTMLInputElement && control.type === "checkbox") value = control.checked;
      else if (control instanceof HTMLInputElement && control.type === "range") value = Number(control.value);
      else if (control instanceof HTMLSelectElement) value = control.value;
      else return;
      this.settings = { ...this.settings, [key]: value };
      const output = this.panel?.querySelector(`[data-output="${key}"]`);
      if (output) output.value = String(value);
      this.syncDependencies();
      this.callbacks.onChange({ [key]: value });
    }
    readPill(button) {
      const group = button.closest("[data-pills-setting]");
      const key = group?.dataset.pillsSetting;
      const value = button.dataset.val;
      if (!key || !value || key === "schemaVersion" || key === "paneSizes" || key === "dualPaneSizes") return;
      this.settings = { ...this.settings, [key]: value };
      this.syncPills(key, value);
      this.syncDependencies();
      this.callbacks.onChange({ [key]: value });
    }
    syncPills(key, value) {
      this.panel?.querySelectorAll(`[data-pills-setting="${key}"] .dc-pill-btn`).forEach((button) => {
        const active = button.dataset.val === value;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
    syncDependencies() {
      if (!this.panel) return;
      this.panel.querySelectorAll("[data-depends-on]").forEach((row) => {
        const key = row.dataset.dependsOn;
        const expected = row.dataset.dependsValue;
        const dependencyMatches = Boolean(key) && (expected === void 0 ? this.settings[key] === true : String(this.settings[key]) === expected);
        row.hidden = !dependencyMatches;
      });
    }
    setPanelOpen(open) {
      if (!this.panel) return;
      this.panel.hidden = !open;
      this.toggleButton?.setAttribute("aria-expanded", String(open));
      if (!open) {
        this.setDonationMenuOpen(false);
        this.setUpdateMenuOpen(false);
      }
    }
    setDonationMenuOpen(open) {
      const menu = this.panel?.querySelector(".ldu-donate-menu");
      const button = this.panel?.querySelector(".ldu-settings-donate");
      if (menu) menu.hidden = !open;
      button?.setAttribute("aria-expanded", String(open));
      if (open) this.setUpdateMenuOpen(false);
    }
    setUpdateMenuOpen(open) {
      const menu = this.panel?.querySelector(".ldu-update-menu");
      const button = this.panel?.querySelector(".ldu-settings-update");
      if (menu) menu.hidden = !open;
      button?.setAttribute("aria-expanded", String(open));
      if (open) {
        const donationMenu = this.panel?.querySelector(".ldu-donate-menu");
        const donationButton = this.panel?.querySelector(".ldu-settings-donate");
        if (donationMenu) donationMenu.hidden = true;
        donationButton?.setAttribute("aria-expanded", "false");
      }
    }
  };

  // src/ui/tab-context-menu.ts
  var GROUPS = [
    [
      { action: "onMoveToSplit", key: "split", label: "\u5411\u65B0\u7684\u62C6\u5206\u89C6\u56FE\u4E2D\u6DFB\u52A0\u6807\u7B7E\u9875", icon: "split" },
      { action: "onOpenBrowserTab", key: "browser-tab", label: "\u5728\u65B0\u7684\u6D4F\u89C8\u5668\u6807\u7B7E\u9875\u4E2D\u6253\u5F00", icon: "external" }
    ],
    [
      { action: "onReload", key: "reload", label: "\u91CD\u65B0\u52A0\u8F7D\u5F53\u524D\u5E16\u5B50", icon: "refresh" },
      { action: "onCopyLink", key: "copy", label: "\u590D\u5236\u94FE\u63A5", icon: "copy" }
    ],
    [{ action: "onBookmark", key: "bookmark", label: "\u6DFB\u52A0\u5230\u4E66\u7B7E", icon: "bookmark" }],
    [{ action: "onCloseOthers", key: "close-others", label: "\u5173\u95ED\u5176\u4ED6\u6807\u7B7E\u9875", icon: "close-others" }]
  ];
  var TabContextMenu = class {
    constructor(callbacks) {
      this.callbacks = callbacks;
    }
    root = null;
    onOutsidePointer = (event) => {
      if (!this.root?.contains(event.target)) this.close();
    };
    onKeyDown = (event) => {
      if (event.key === "Escape") this.close();
    };
    activePane = "primary";
    open(tabId, clientX, clientY, splitDisabled = false, pane = "primary") {
      this.close();
      this.activePane = pane;
      const root = document.createElement("div");
      root.className = "ldu-tab-context-menu";
      root.setAttribute("role", "menu");
      root.setAttribute("aria-label", "\u6807\u7B7E\u9875\u7BA1\u7406\u83DC\u5355");
      for (const [groupIndex, group] of GROUPS.entries()) {
        if (groupIndex > 0) {
          const separator = document.createElement("div");
          separator.className = "ldu-context-separator";
          separator.setAttribute("role", "separator");
          root.append(separator);
        }
        for (const item of group) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "ldu-context-item";
          button.dataset.action = item.key;
          button.setAttribute("role", "menuitem");
          if (item.key === "split" && splitDisabled) button.disabled = true;
          button.append(createIcon(document, item.icon));
          const label = document.createElement("span");
          label.className = "ldu-context-label";
          label.textContent = item.label;
          button.append(label);
          if (item.shortcut) {
            const shortcut = document.createElement("span");
            shortcut.className = "ldu-context-shortcut";
            shortcut.textContent = item.shortcut;
            button.append(shortcut);
          }
          button.addEventListener("click", () => {
            this.close();
            this.callbacks[item.action](tabId);
          });
          root.append(button);
        }
      }
      document.body.append(root);
      this.root = root;
      this.callbacks.onOpenChange?.(true, pane);
      const rect = root.getBoundingClientRect();
      const margin = 8;
      root.style.left = `${Math.max(margin, Math.min(clientX, window.innerWidth - rect.width - margin))}px`;
      root.style.top = `${Math.max(margin, Math.min(clientY, window.innerHeight - rect.height - margin))}px`;
      document.addEventListener("pointerdown", this.onOutsidePointer, true);
      document.addEventListener("keydown", this.onKeyDown, true);
      root.querySelector("button:not(:disabled)")?.focus();
    }
    close() {
      const hadRoot = Boolean(this.root);
      document.removeEventListener("pointerdown", this.onOutsidePointer, true);
      document.removeEventListener("keydown", this.onKeyDown, true);
      this.root?.remove();
      this.root = null;
      if (hadRoot) this.callbacks.onOpenChange?.(false, this.activePane);
    }
    destroy() {
      this.close();
    }
  };

  // src/preview/upstream-preview-controller.ts
  var PreviewController = class {
    constructor(options) {
      this.options = options;
    }
    api = null;
    loading = null;
    mount() {
      const result = this.ensureApi();
      if (result instanceof Promise) void result;
    }
    install(installer) {
      if (this.api || !this.options.isEnabled()) return this.api;
      const installed = installer({
        isEnabled: this.options.isEnabled,
        clickMode: this.options.clickMode,
        ...this.options.onClickModeChange ? { onClickModeChange: this.options.onClickModeChange } : {},
        isPreviewableUrl: (url, link) => this.isPreviewable(url, link)
      });
      this.api = installed ?? null;
      return this.api;
    }
    ensureApi() {
      if (this.api || !this.options.isEnabled()) return this.api;
      if (this.loading) return this.loading;
      try {
        const loaded = this.options.loadPreviewer();
        if (!(loaded instanceof Promise)) return this.install(loaded);
        this.loading = loaded.then((installer) => this.install(installer)).catch((error) => {
          console.error("[Linux Do Ultimate] Preview runtime failed to load", error);
          return null;
        }).finally(() => {
          this.loading = null;
        });
        return this.loading;
      } catch (error) {
        console.error("[Linux Do Ultimate] Preview runtime failed to load", error);
        return null;
      }
    }
    close() {
      this.api?.close();
    }
    syncClickMode() {
      const result = this.ensureApi();
      if (result instanceof Promise) void result.then((api) => api?.syncClickMode());
      else result?.syncClickMode();
    }
    openFromFrame(url, iframe, anchorRect) {
      if (!this.options.isEnabled() || !this.isPreviewable(url, null)) return;
      const frameRect = iframe.getBoundingClientRect();
      const rect = anchorRect ?? { left: 0, bottom: 0 };
      const open = (api) => {
        if (!api || !this.options.isEnabled()) return;
        api.openFromFrame(url, {
          left: frameRect.left + rect.left,
          top: frameRect.top + rect.bottom,
          bottom: frameRect.top + rect.bottom
        });
      };
      const result = this.ensureApi();
      if (result instanceof Promise) void result.then(open);
      else open(result);
    }
    isPreviewable(url, link) {
      if (!/^https?:/i.test(url) || getTopicInfo(url)) return false;
      if (!link) return true;
      if (link.closest(".d-header, .sidebar-wrapper, .ldu-topic-toolbar, .ldu-settings-panel")) return false;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return false;
      if (link.matches(".lightbox") || link.querySelector("img, picture")) return false;
      return !link.closest("img, picture, .lightbox-wrapper");
    }
  };

  // src/credit/credit-widget.ts
  var REFRESH_INTERVAL_MS = 3e5;
  var SHARED_CACHE_TTL_MS = 6e4;
  var SHARED_CACHE_KEY = "linuxdo-ultimate:credit-cache:v1";
  var SHARED_REQUEST_LOCK = "linuxdo-ultimate:credit-refresh";
  var CreditWidget = class {
    constructor(options = {}) {
      this.options = options;
    }
    host = null;
    button = null;
    value = null;
    tooltip = null;
    communityBalance = null;
    gamificationScore = null;
    username = null;
    tooltipContent = "\u52A0\u8F7D\u4E2D...";
    timeoutId = null;
    inFlight = null;
    requestGeneration = 0;
    activeRequestController = null;
    mounted = false;
    enabled = false;
    mount(enabled) {
      if (this.mounted || !(this.options.isTopLevel?.() ?? window.self === window.top)) return;
      this.mounted = true;
      this.createWidget();
      document.addEventListener("visibilitychange", () => this.handleVisibilityChange());
      this.ensureHost();
      this.setEnabled(enabled);
    }
    ensureHost() {
      if (!this.host) return;
      const language = document.querySelector(".d-header-icons > .language-switcher");
      if (language) {
        if (language.nextElementSibling !== this.host) language.after(this.host);
      } else {
        const icons = document.querySelector(".d-header-icons");
        if (!icons) return;
        if (this.host.parentElement !== icons) icons.append(this.host);
      }
      if (this.enabled) this.startUpdates();
    }
    setEnabled(enabled) {
      if (!this.mounted) {
        this.mount(enabled);
        return;
      }
      this.enabled = enabled;
      if (this.host) this.host.hidden = !enabled;
      if (this.tooltip) this.tooltip.hidden = true;
      if (!enabled) {
        this.requestGeneration += 1;
        this.activeRequestController?.abort();
        this.activeRequestController = null;
        this.inFlight = null;
        this.clearSchedule();
        return;
      }
      this.ensureHost();
      if (this.host?.isConnected) this.startUpdates();
    }
    startUpdates() {
      if (!this.enabled || !this.isVisible() || this.inFlight || this.timeoutId !== null) return;
      void this.fetchData(false);
    }
    createWidget() {
      const host = document.createElement("li");
      host.className = "header-dropdown-toggle ldu-credit-host";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn no-text language-switcher-trigger btn-flat ldu-credit-button is-loading";
      button.title = "Credit \u79EF\u5206\u6536\u5165\uFF0C\u70B9\u51FB\u5237\u65B0";
      button.setAttribute("aria-label", "Credit \u79EF\u5206\u6536\u5165\uFF0C\u70B9\u51FB\u5237\u65B0");
      button.setAttribute("aria-describedby", "ldu-credit-tooltip");
      const value = document.createElement("span");
      value.className = "ldu-credit-value";
      value.setAttribute("aria-live", "polite");
      value.textContent = "\xB7\xB7\xB7";
      button.append(value);
      host.append(button);
      const tooltip = document.createElement("div");
      tooltip.id = "ldu-credit-tooltip";
      tooltip.className = "ldu-credit-tooltip";
      tooltip.hidden = true;
      tooltip.setAttribute("role", "tooltip");
      document.body.append(tooltip);
      const showTooltip = () => {
        if (!this.enabled) return;
        tooltip.textContent = this.tooltipContent;
        tooltip.hidden = false;
        const rect = button.getBoundingClientRect();
        const left = Math.max(8, Math.min(window.innerWidth - tooltip.offsetWidth - 8, rect.right - tooltip.offsetWidth));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${rect.bottom + 6}px`;
      };
      const hideTooltip = () => {
        tooltip.hidden = true;
      };
      button.addEventListener("mouseenter", showTooltip);
      button.addEventListener("mouseleave", hideTooltip);
      button.addEventListener("focus", showTooltip);
      button.addEventListener("blur", hideTooltip);
      button.addEventListener("click", () => {
        this.setLoading("\u5237\u65B0\u4E2D...");
        void this.fetchData(true);
      });
      this.host = host;
      this.button = button;
      this.value = value;
      this.tooltip = tooltip;
    }
    fetchData(force) {
      if (!this.enabled || !this.isVisible()) return Promise.resolve();
      if (this.inFlight) return this.inFlight;
      const generation = ++this.requestGeneration;
      const startedAt = this.now();
      const controller = new AbortController();
      this.activeRequestController = controller;
      const task = (async () => {
        try {
          const cached = !force ? this.readSharedSnapshot() : null;
          const snapshot = cached ?? await this.fetchSnapshotCoordinated(force, startedAt, controller.signal);
          if (!this.enabled || generation !== this.requestGeneration) return;
          this.communityBalance = snapshot.communityBalance;
          this.gamificationScore = snapshot.gamificationScore;
          this.username = snapshot.username;
          if (!cached) this.writeSharedSnapshot(snapshot);
          this.updateDisplay();
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error("[Linux Do Ultimate] LDC request failed", error);
          if (this.enabled && generation === this.requestGeneration) this.showError();
        }
      })().finally(() => {
        if (this.activeRequestController === controller) this.activeRequestController = null;
        if (this.inFlight === task) this.inFlight = null;
        if (this.enabled && this.isVisible() && generation === this.requestGeneration) this.scheduleNext();
      });
      this.inFlight = task;
      return task;
    }
    async fetchSnapshot(signal) {
      const credit = await this.request("https://credit.linux.do/api/v1/oauth/user-info", signal);
      const rawBalance = credit?.data?.["community-balance"] ?? credit?.data?.community_balance;
      const username = credit?.data?.username ?? credit?.data?.nickname;
      const communityBalance = Number.parseFloat(String(rawBalance));
      if (!username || !Number.isFinite(communityBalance)) throw new Error("invalid credit response");
      const data = await this.request(`https://linux.do/u/${encodeURIComponent(username)}.json`, signal);
      const gamificationScore = Number.parseFloat(String(data?.user?.gamification_score));
      if (!Number.isFinite(gamificationScore)) throw new Error("invalid gamification response");
      return { communityBalance, gamificationScore, username, updatedAt: this.now() };
    }
    async fetchSnapshotCoordinated(force, startedAt, signal) {
      const locks = typeof navigator !== "undefined" ? navigator.locks : void 0;
      if (!locks) return this.fetchSnapshot(signal);
      return locks.request(SHARED_REQUEST_LOCK, { signal }, async () => {
        const shared = this.readSharedSnapshot();
        if (shared && (!force || shared.updatedAt >= startedAt)) return shared;
        const snapshot = await this.fetchSnapshot(signal);
        this.writeSharedSnapshot(snapshot);
        return snapshot;
      });
    }
    scheduleNext() {
      this.clearSchedule();
      this.timeoutId = window.setTimeout(() => {
        this.timeoutId = null;
        void this.fetchData(false);
      }, REFRESH_INTERVAL_MS);
    }
    clearSchedule() {
      if (this.timeoutId !== null) window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    handleVisibilityChange() {
      if (!this.isVisible()) {
        this.clearSchedule();
        return;
      }
      if (this.enabled) this.startUpdates();
    }
    isVisible() {
      return this.options.isVisible?.() ?? document.visibilityState !== "hidden";
    }
    now() {
      return this.options.now?.() ?? Date.now();
    }
    readSharedSnapshot() {
      try {
        const raw = localStorage.getItem(SHARED_CACHE_KEY);
        if (raw === null) return null;
        const value = JSON.parse(raw);
        if (!value || this.now() - Number(value.updatedAt) >= SHARED_CACHE_TTL_MS || !Number.isFinite(value.communityBalance) || !Number.isFinite(value.gamificationScore) || typeof value.username !== "string") {
          this.clearSharedSnapshot();
          return null;
        }
        return value;
      } catch {
        this.clearSharedSnapshot();
        return null;
      }
    }
    clearSharedSnapshot() {
      try {
        localStorage.removeItem(SHARED_CACHE_KEY);
      } catch {
      }
    }
    writeSharedSnapshot(snapshot) {
      try {
        localStorage.setItem(SHARED_CACHE_KEY, JSON.stringify(snapshot));
      } catch {
      }
    }
    updateDisplay() {
      if (this.communityBalance === null || this.gamificationScore === null || !this.value || !this.button) return;
      const difference = this.gamificationScore - this.communityBalance;
      this.value.textContent = `${difference > 0 ? "+" : ""}${difference.toFixed(2)}`;
      this.button.classList.remove("is-loading", "is-positive", "is-negative", "is-neutral");
      this.button.classList.add(difference > 0 ? "is-positive" : difference < 0 ? "is-negative" : "is-neutral");
      this.tooltipContent = `\u4EC5\u4F9B\u53C2\u8003\uFF0C\u53EF\u80FD\u6709\u8BEF\u5DEE\uFF01
\u5F53\u524D\u5206: ${this.gamificationScore.toFixed(2)}
\u57FA\u51C6\u503C: ${this.communityBalance.toFixed(2)}`;
    }
    setLoading(message) {
      if (this.value) this.value.textContent = "\xB7\xB7\xB7";
      this.button?.classList.remove("is-positive", "is-negative", "is-neutral");
      this.button?.classList.add("is-loading");
      this.tooltipContent = message;
    }
    showError() {
      if (this.value) this.value.textContent = "!";
      this.button?.classList.remove("is-loading", "is-positive", "is-neutral");
      this.button?.classList.add("is-negative");
      this.tooltipContent = "\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u5DF2\u767B\u5F55";
    }
    request(url, signal) {
      if (this.options.request) return this.options.request(url);
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      const headers = {
        Accept: "application/json",
        ...csrfToken ? { "x-csrf-token": csrfToken } : {}
      };
      if (url.startsWith(location.origin)) {
        return fetch(url, { credentials: "include", headers, signal }).then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.json();
        }).catch((error) => signal.aborted ? Promise.reject(error) : this.requestWithUserscript(url, headers, signal));
      }
      return this.requestWithUserscript(url, headers, signal);
    }
    requestWithUserscript(url, headers, signal) {
      return new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== "function") {
          reject(new Error("GM_xmlhttpRequest is unavailable"));
          return;
        }
        let settled = false;
        let handle = null;
        const finish = (callback) => {
          if (settled) return;
          settled = true;
          signal.removeEventListener("abort", abort);
          callback();
        };
        const abort = () => {
          try {
            handle?.abort();
          } catch {
          }
          finish(() => reject(new DOMException("Aborted", "AbortError")));
        };
        if (signal.aborted) {
          abort();
          return;
        }
        signal.addEventListener("abort", abort, { once: true });
        const request = {
          method: "GET",
          url,
          withCredentials: true,
          headers: { ...headers, Referer: "https://credit.linux.do/home" },
          timeout: 1e4,
          onload: (response) => {
            if (response.status !== 200) {
              finish(() => reject(new Error(String(response.status))));
              return;
            }
            try {
              const value = JSON.parse(response.responseText);
              finish(() => resolve(value));
            } catch (error) {
              finish(() => reject(error));
            }
          },
          onerror: (error) => finish(() => reject(error)),
          ontimeout: () => finish(() => reject(new Error("timeout")))
        };
        handle = GM_xmlhttpRequest(request);
      });
    }
  };

  // src/discourse/page-tools-client.ts
  var DEFAULT_CONFIG = {
    ownerOnlyEnabled: false,
    minimalHidePosters: false,
    minimalHideNotices: false,
    minimalHideCategoryBadges: false,
    minimalHideTags: false,
    lowEndOptimizationEnabled: false
  };
  var PageToolsClient = class {
    constructor(options = {}) {
      this.options = options;
      this.win = options.window ?? window;
      this.doc = options.document ?? document;
      this.lowEndDevice = isLowEndDevice(this.win.navigator);
    }
    config = { ...DEFAULT_CONFIG };
    active = true;
    stopped = false;
    ownerInstaller = null;
    ownerController = null;
    ownerLoad = null;
    win;
    doc;
    lowEndDevice;
    setConfig(patch) {
      if (this.stopped) return;
      const next = { ...this.config, ...patch };
      if (sameConfig(this.config, next)) return;
      this.config = next;
      this.applyStaticModes();
      this.syncOwnerView();
    }
    setActive(active) {
      if (this.stopped || this.active === active) return;
      this.active = active;
      this.syncOwnerView();
    }
    stop() {
      if (this.stopped) return;
      this.stopped = true;
      this.ownerController?.stop();
      this.ownerController = null;
      delete this.doc.documentElement.dataset.lduHidePosters;
      delete this.doc.documentElement.dataset.lduHideNotices;
      delete this.doc.documentElement.dataset.lduHideCategoryBadges;
      delete this.doc.documentElement.dataset.lduHideTags;
      delete this.doc.documentElement.dataset.lduLowEnd;
    }
    applyStaticModes() {
      const root = this.doc.documentElement;
      setDataset(root, "lduHidePosters", this.config.minimalHidePosters);
      setDataset(root, "lduHideNotices", this.config.minimalHideNotices);
      setDataset(root, "lduHideCategoryBadges", this.config.minimalHideCategoryBadges);
      setDataset(root, "lduHideTags", this.config.minimalHideTags);
      setDataset(root, "lduLowEnd", this.config.lowEndOptimizationEnabled && this.lowEndDevice);
    }
    wantsOwnerView() {
      return this.active && this.ownerViewConfigured();
    }
    ownerViewConfigured() {
      return this.options.allowOwnerView !== false && this.config.ownerOnlyEnabled && typeof this.options.loadOwnerView === "function";
    }
    syncOwnerView() {
      if (!this.ownerViewConfigured()) {
        this.ownerController?.stop(true);
        this.ownerController = null;
        return;
      }
      if (!this.active) {
        this.ownerController?.setActive(false);
        return;
      }
      if (this.ownerController) {
        this.ownerController.setActive(true);
        return;
      }
      if (this.ownerInstaller) {
        this.installOwnerView(this.ownerInstaller);
        return;
      }
      if (this.ownerLoad) return;
      try {
        const loaded = this.options.loadOwnerView();
        if (!(loaded instanceof Promise)) {
          this.ownerInstaller = loaded;
          this.installOwnerView(loaded);
          return;
        }
        this.ownerLoad = loaded.then((installer) => {
          this.ownerInstaller = installer;
          if (this.wantsOwnerView()) this.installOwnerView(installer);
          return installer;
        }).catch((error) => {
          console.error("[Linux Do Ultimate] Owner view runtime failed to load", error);
          return null;
        }).finally(() => {
          this.ownerLoad = null;
        });
      } catch (error) {
        console.error("[Linux Do Ultimate] Owner view runtime failed to load", error);
      }
    }
    installOwnerView(installer) {
      if (!this.wantsOwnerView() || this.ownerController) return;
      this.ownerController = installer({
        window: this.win,
        document: this.doc,
        ...this.options.isEmbedded !== void 0 ? { isEmbedded: this.options.isEmbedded } : {},
        ...this.options.isSplitHost ? { isSplitHost: this.options.isSplitHost } : {}
      });
      this.ownerController.setActive(true);
    }
  };
  function sameConfig(left, right) {
    return left.ownerOnlyEnabled === right.ownerOnlyEnabled && left.minimalHidePosters === right.minimalHidePosters && left.minimalHideNotices === right.minimalHideNotices && left.minimalHideCategoryBadges === right.minimalHideCategoryBadges && left.minimalHideTags === right.minimalHideTags && left.lowEndOptimizationEnabled === right.lowEndOptimizationEnabled;
  }
  function setDataset(root, key, enabled) {
    const next = String(enabled);
    if (root.dataset[key] !== next) root.dataset[key] = next;
  }
  function isLowEndDevice(navigator2) {
    const hardwareConcurrency = navigator2.hardwareConcurrency;
    const deviceMemory = navigator2.deviceMemory;
    return Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 4 || typeof deviceMemory === "number" && Number.isFinite(deviceMemory) && deviceMemory <= 4;
  }

  // src/app.ts
  var ROUTE_DEBOUNCE_MS = 100;
  var SESSION_MAINTENANCE_INTERVAL_MS = 30 * 6e4;
  var LIST_HANDOFF_TIMEOUT_MS = 3e3;
  function startLinuxDoApp(options = {}) {
    if (window.self !== window.top) return;
    const start = () => new LinuxDoApp(options).start();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  }
  var LinuxDoApp = class {
    constructor(options) {
      this.options = options;
    }
    storage = new UserscriptStorage();
    settings = normalizeSettings(DEFAULT_SETTINGS);
    session;
    tabStore;
    layout;
    frames = null;
    secondaryFrames = null;
    listFrame = null;
    preview;
    settingsPanel;
    credit;
    settingsHost = null;
    routeTimer = null;
    persistTimer = null;
    lastRoute = "";
    restoredTabsTracked = false;
    trackedTopicKey = "";
    topicTrackTimers = [];
    routeRetryTimer = null;
    routeRetryAttempts = 0;
    hostMaintenanceTimer = null;
    hasRestoredSession = false;
    sessionLease;
    leaseTimer = null;
    sessionMaintenanceTimer = null;
    tabContextMenu;
    listHandoffTimer = null;
    updateChecker = new UpdateChecker(this.storage);
    updateCheckTimer = null;
    pageTools;
    start() {
      this.settings = loadSettings(this.storage);
      ensureAppStyles();
      this.pageTools = new PageToolsClient({
        isEmbedded: false,
        isSplitHost: () => document.body.classList.contains("ldu-layout-active"),
        allowOwnerView: Boolean(getTopicInfo(location.href, location.href)),
        ...this.options.loadOwnerView ? { loadOwnerView: this.options.loadOwnerView } : {}
      });
      this.pageTools.setConfig(this.getPageToolsConfig());
      this.preview = new PreviewController({
        isEnabled: () => this.settings.enabled && this.settings.previewEnabled,
        clickMode: () => this.settings.previewClickMode,
        onClickModeChange: (previewClickMode) => this.applySettings({ previewClickMode }),
        loadPreviewer: this.options.loadPreviewer ?? (() => Promise.reject(new Error("Preview runtime is unavailable")))
      });
      this.preview.mount();
      this.tabContextMenu = new TabContextMenu({
        onMoveToSplit: (tabId) => this.moveTabToSecondary(tabId),
        onOpenBrowserTab: (tabId) => this.openTabInBrowser(tabId),
        onReload: (tabId) => this.reloadTab(tabId),
        onCopyLink: (tabId) => void this.copyTabLink(tabId),
        onBookmark: (tabId) => this.bookmarkTab(tabId),
        onCloseOthers: (tabId) => this.closeOtherTabs(tabId),
        onOpenChange: (open, pane) => this.layout.setTabInteractionLocked(open, pane)
      });
      this.sessionLease = claimSessionId(
        this.storage,
        window.sessionStorage,
        Date.now(),
        isReloadNavigation(window.performance)
      );
      const sessionId = this.sessionLease.sessionId;
      reconcileSessionClose(this.storage, sessionId);
      cleanupExpiredSessions(this.storage);
      if (!this.settings.restoreSession) clearRestorableSessions(this.storage);
      const initial = createSession(sessionId, location.href, Date.now());
      initial.paneSizes = { ...this.settings.paneSizes };
      initial.dualPaneSizes = { ...this.settings.dualPaneSizes };
      const currentSession = loadSessionIfPresent(this.storage, sessionId, location.href, Date.now());
      const previousSession = !currentSession && classifyRoute(location.href) !== "topic" && this.settings.restoreSession ? loadLatestSession(this.storage, sessionId, location.href, Date.now()) : null;
      this.session = currentSession ?? previousSession ?? initial;
      this.hasRestoredSession = Boolean(previousSession?.tabs.length);
      this.tabStore = new TopicTabStore(this.session, this.settings.maxOpenTabs, (session) => {
        this.session = session;
        saveSession(this.storage, session);
        this.renderTabs();
      });
      this.layout = new LayoutController({
        preference: this.settings.layoutPreference,
        paneSizes: this.session.paneSizes,
        dualPaneSizes: this.session.dualPaneSizes,
        tabPresentation: this.settings.tabPresentation,
        verticalTabsAutoCollapse: this.settings.verticalTabsAutoCollapse,
        onPaneSizesChange: (paneSizes, layout) => this.persistPaneSizes(paneSizes, layout)
      });
      this.mountSettings();
      this.credit = new CreditWidget();
      this.credit.mount(this.settings.enabled && this.settings.creditEnabled);
      this.lastRoute = location.href;
      this.bindGlobalEvents();
      this.leaseTimer = window.setInterval(() => refreshSessionLease(this.storage, this.sessionLease), 3e4);
      this.sessionMaintenanceTimer = window.setInterval(
        () => cleanupExpiredSessions(this.storage),
        SESSION_MAINTENANCE_INTERVAL_MS
      );
      this.syncRoute();
      if (window.__LDU_TEST_MODE__) {
        window.__LDU_TEST_API__ = {
          openTopic: (url, title) => {
            const info = getTopicInfo(url, location.href);
            if (info) this.openTopic(info.topicId, info.url.href, title, info.postNumber);
          }
        };
      }
    }
    bindGlobalEvents() {
      document.addEventListener("click", (event) => this.handleTopicLinkClick(event), true);
      window.addEventListener("message", (event) => {
        this.frames?.handleMessage(event);
        this.secondaryFrames?.handleMessage(event);
        this.listFrame?.handleMessage(event);
      });
      window.addEventListener("popstate", () => this.scheduleRouteSync());
      window.addEventListener("hashchange", () => this.scheduleRouteSync());
      window.addEventListener("pagehide", (event) => this.handlePageHide(event), { capture: true });
      new MutationObserver(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return;
        if (this.hostMaintenanceTimer === null) {
          this.hostMaintenanceTimer = window.setTimeout(() => {
            this.hostMaintenanceTimer = null;
            this.ensureSettingsHost();
            this.credit?.ensureHost();
          }, 100);
        }
        if (this.lastRoute !== location.href) this.scheduleRouteSync();
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
    dismissHostOverlays() {
      document.body.dispatchEvent(new MouseEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        button: 0
      }));
    }
    handleUserMenuLink(event, link) {
      if (!link.closest(".user-menu") || link.matches(".user-menu-tab, [role=tab]")) return false;
      let targetUrl;
      try {
        targetUrl = new URL(link.href, location.href);
      } catch {
        return false;
      }
      if (targetUrl.origin !== location.origin || link.target === "_blank" || link.hasAttribute("download")) return false;
      const topic = getTopicInfo(targetUrl.href, location.href);
      const splitActive = Boolean(this.layout.getShellElement()) && this.layout.getMode() !== "native";
      if (!topic && !splitActive) return false;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.dismissHostOverlays();
      if (topic) {
        this.openTopic(topic.topicId, topic.url.href, link.textContent?.trim() || `\u4E3B\u9898 ${topic.topicId}`, topic.postNumber);
      } else {
        this.navigateList(targetUrl.href);
      }
      return true;
    }
    handleTopicLinkClick(event) {
      if (!(event instanceof MouseEvent) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (!this.settings.enabled || !this.settings.tabsEnabled) return;
      const target = event.target;
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link) return;
      if (this.handleUserMenuLink(event, link)) return;
      let targetUrl = null;
      try {
        targetUrl = new URL(link.href, location.href);
      } catch {
      }
      const splitActive = Boolean(this.layout.getShellElement()) && this.layout.getMode() !== "native";
      if (splitActive && targetUrl && targetUrl.origin === location.origin && classifyRoute(targetUrl.href) === "chat") {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.dismissHostOverlays();
        this.navigateList(targetUrl.href);
        return;
      }
      if (link.closest("button, [role=button], .btn, .d-button, .post-controls, .actions, .topic-timeline, .no-track-view-patch")) return;
      if (classifyRoute(location.href) === "topic" && this.tabStore.getTabs().length === 0) {
        this.promoteDirectTopicNavigation(event, link);
        return;
      }
      if (isSupportedTopicTarget(link.href, location.href)) {
        const info = getTopicInfo(link.href);
        if (!info) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.openTopic(info.topicId, info.url.href, link.textContent?.trim() || `\u4E3B\u9898 ${info.topicId}`, info.postNumber);
        return;
      }
      if (!this.layout.getShellElement() || this.layout.getMode() === "native") return;
      if (!targetUrl) return;
      if (targetUrl.origin !== location.origin || targetUrl.protocol === "javascript:" || link.target === "_blank" || link.hasAttribute("download")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.navigateList(targetUrl.href);
    }
    openTopic(topicId, url, title, postNumber, pane = "primary", deferListFrame = false) {
      const shouldHandoffList = this.tabStore.getTabs().length === 0 && classifyRoute(location.href) !== "topic" && this.layout.getMode() === "native";
      const nativeListScrollY = shouldHandoffList ? window.scrollY : 0;
      if (!this.layout.mount()) return;
      if (shouldHandoffList) {
        this.tabStore.setSessionFields({
          listUrl: location.href,
          listScrollY: nativeListScrollY
        }, Date.now(), false);
      }
      this.ensureFrames();
      if (shouldHandoffList && this.layout.beginListHandoff(nativeListScrollY)) {
        this.scheduleListHandoffFallback();
      }
      this.layout.setOpen(true);
      const input = { topicId, url, title, ...postNumber ? { postNumber } : {} };
      if (pane === "secondary") this.tabStore.openSecondary(input, Date.now());
      else this.tabStore.open(input, Date.now());
      if (!deferListFrame) this.ensureListFrame();
      const info = getTopicInfo(url);
      if (info) {
        const tracker = createBrowserViewTracker();
        void tracker.track(info, "split-open", location.href).then((result) => {
          if (result.status === "failed") {
            window.setTimeout(() => void tracker.track(info, "manual-retry", location.href), 1e4);
          }
        });
      }
    }
    syncRoute() {
      this.routeTimer = null;
      if (this.lastRoute !== location.href) {
        this.lastRoute = location.href;
      }
      const route = classifyRoute(location.href);
      const shouldHostSplit = this.settings.enabled && this.settings.tabsEnabled && (isSplitRoute(location.href) || this.tabStore.getTabs().length > 0);
      if (shouldHostSplit) {
        this.clearTopicTrackSchedule();
        if (!this.layout.mount()) {
          this.scheduleRouteMountRetry();
          return;
        }
        this.routeRetryAttempts = 0;
        const hasTabs = this.tabStore.getTabs().length > 0;
        this.layout.setOpen(hasTabs);
        if (hasTabs) {
          this.ensureFrames();
          this.ensureListFrame();
          if (this.tabStore.getSecondaryTabs().length > 0) {
            this.layout.setSecondaryOpen(true);
            this.ensureSecondaryFrames();
          }
          const active = this.tabStore.getActive();
          if (active) {
            this.activateFrame(active, "primary");
            if (this.hasRestoredSession && !this.restoredTabsTracked) {
              this.restoredTabsTracked = true;
              const info = getTopicInfo(active.url);
              if (info) void createBrowserViewTracker().track(info, "restored-tab", location.href);
            }
          }
          const secondaryActive = this.tabStore.getSecondaryActive();
          if (secondaryActive) this.activateFrame(secondaryActive, "secondary");
        }
        return;
      }
      this.disposeSplitRuntime();
      if (route === "topic") {
        const info = getTopicInfo(location.href);
        if (info) this.scheduleTopicTracking(info.topicId, info.url.href);
      } else {
        this.clearTopicTrackSchedule();
      }
    }
    promoteDirectTopicNavigation(event, link) {
      const current = getTopicInfo(location.href);
      if (!current) return;
      let targetUrl;
      try {
        targetUrl = new URL(link.href, location.href);
      } catch {
        return;
      }
      if (targetUrl.origin !== location.origin) return;
      const targetRoute = classifyRoute(targetUrl.href, location.href);
      if (targetRoute === "topic" && getTopicInfo(targetUrl.href, location.href)?.topicId === current.topicId) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      const listUrl = targetRoute === "topic" ? new URL("/", location.href).href : targetUrl.href;
      if (!this.layout.mount()) return;
      this.clearTopicTrackSchedule();
      this.tabStore.setSessionFields({ listUrl, listScrollY: 0 }, Date.now(), false);
      this.ensureFrames();
      this.layout.setOpen(true);
      event.preventDefault();
      event.stopImmediatePropagation();
      this.openTopic(current.topicId, current.url.href, this.currentTopicTitle(current.topicId), current.postNumber, "primary", true);
      if (targetRoute === "topic") {
        const target = getTopicInfo(targetUrl.href, location.href);
        if (target) this.openTopic(target.topicId, target.url.href, link.textContent?.trim() || `\u4E3B\u9898 ${target.topicId}`, target.postNumber, "primary", true);
      }
      this.ensureListFrame(listUrl);
    }
    currentTopicTitle(topicId) {
      return document.querySelector("#topic-title h1, .fancy-title")?.textContent?.trim() || document.title || `\u4E3B\u9898 ${topicId}`;
    }
    scheduleRouteMountRetry() {
      if (this.routeRetryTimer !== null || this.routeRetryAttempts >= 30) return;
      this.routeRetryAttempts += 1;
      this.routeRetryTimer = window.setTimeout(() => {
        this.routeRetryTimer = null;
        this.syncRoute();
      }, 100);
    }
    scheduleRouteSync() {
      this.routeRetryAttempts = 0;
      if (this.routeTimer !== null) window.clearTimeout(this.routeTimer);
      this.routeTimer = window.setTimeout(() => this.syncRoute(), ROUTE_DEBOUNCE_MS);
    }
    ensureListFrame(requestedUrl) {
      const container = this.layout.getListContentElement();
      if (!container) return;
      if (!this.listFrame) {
        this.listFrame = new ListFrameController(
          container,
          this.session.sessionId,
          (message, iframe) => this.handleListFrameMessage(message, iframe)
        );
      }
      this.listFrame.setConfig({
        enabled: this.settings.enabled && this.settings.previewEnabled,
        clickMode: this.settings.previewClickMode,
        pageTools: this.getPageToolsConfig()
      });
      const storedListUrl = requestedUrl ?? this.tabStore.getSession().listUrl;
      let resolved;
      try {
        resolved = new URL(storedListUrl || "/", location.href);
      } catch {
        resolved = new URL("/", location.href);
      }
      const listUrl = resolved.origin !== location.origin || getTopicInfo(resolved.href, location.href) ? new URL("/", location.href).href : resolved.href;
      this.listFrame.mount(listUrl);
    }
    navigateList(url) {
      let target;
      try {
        target = new URL(url, location.href);
      } catch {
        return;
      }
      if (target.origin !== location.origin || getTopicInfo(target.href, location.href)) return;
      if (!this.layout.mount()) return;
      this.tabStore.setSessionFields({ listUrl: target.href, listScrollY: 0 }, Date.now(), false);
      saveSession(this.storage, this.tabStore.getSession());
      this.ensureListFrame(target.href);
      this.listFrame?.navigate(target.href);
    }
    handleListFrameMessage(message, iframe) {
      if (message.type === "ldu:list-interaction") {
        this.dismissHostOverlays();
        return;
      }
      if (message.type === "ldu:list-preview-open") {
        this.preview.openFromFrame(message.url ?? "", iframe, message.anchorRect);
        return;
      }
      if (message.type === "ldu:list-preview-dismiss") {
        this.preview.close();
        return;
      }
      if (message.type === "ldu:list-topic-open") {
        const info = message.url ? getTopicInfo(message.url, location.href) : null;
        if (!info) return;
        this.openTopic(info.topicId, info.url.href, message.topicTitle || `\u4E3B\u9898 ${info.topicId}`, info.postNumber);
        return;
      }
      if (message.type === "ldu:list-navigate" && message.url) {
        this.navigateList(message.url);
        return;
      }
      if (!message.url || getTopicInfo(message.url, location.href)) return;
      const previousSession = this.tabStore.getSession();
      const nextListUrl = new URL(message.url, location.href).href;
      const sameListUrl = previousSession.listUrl === nextListUrl;
      const savedScrollY = sameListUrl ? previousSession.listScrollY : 0;
      this.tabStore.setSessionFields({
        listUrl: nextListUrl,
        ...message.type === "ldu:list-state" && typeof message.scrollY === "number" ? { listScrollY: message.scrollY } : !sameListUrl ? { listScrollY: 0 } : {}
      }, Date.now(), false);
      if (message.type === "ldu:list-state") this.schedulePersist();
      if (message.type === "ldu:list-ready") {
        this.listFrame?.restoreScroll(savedScrollY);
        this.schedulePersist();
      }
      if (message.type === "ldu:list-visual-ready") {
        const handoffScrollY = this.finishListHandoff();
        if (handoffScrollY !== null) this.listFrame?.restoreScroll(handoffScrollY);
        this.schedulePersist();
      }
    }
    ensureFrames() {
      const content = this.layout.getContentElement();
      if (!content || this.frames) return;
      this.frames = new TopicFramePool(
        content,
        this.settings.maxLiveFrames,
        (message, iframe) => this.handleFrameMessage(message, iframe, "primary"),
        (tabId) => {
          this.tabStore.update(tabId, { suspended: true }, Date.now(), false);
          this.schedulePersist();
        }
      );
      this.frames.setPreviewConfig({
        enabled: this.settings.enabled && this.settings.previewEnabled,
        clickMode: this.settings.previewClickMode
      });
      this.frames.setPageToolsConfig(this.getPageToolsConfig());
      this.renderTabs();
    }
    ensureSecondaryFrames() {
      const content = this.layout.getSecondaryContentElement();
      if (!content || this.secondaryFrames) return;
      this.secondaryFrames = new TopicFramePool(
        content,
        this.settings.maxLiveFrames,
        (message, iframe) => this.handleFrameMessage(message, iframe, "secondary"),
        (tabId) => {
          this.tabStore.update(tabId, { suspended: true }, Date.now(), false);
          this.schedulePersist();
        }
      );
      this.secondaryFrames.setPreviewConfig({
        enabled: this.settings.enabled && this.settings.previewEnabled,
        clickMode: this.settings.previewClickMode
      });
      this.secondaryFrames.setPageToolsConfig(this.getPageToolsConfig());
    }
    mountSettings() {
      if (this.settingsPanel) return;
      const host = document.createElement("li");
      host.className = "ldu-settings-host";
      this.settingsHost = host;
      this.ensureSettingsHost();
      this.settingsPanel = new SettingsPanel(host, this.settings, {
        onChange: (patch) => this.applySettings(patch),
        onCheckUpdates: () => this.checkForUpdates(true)
      });
      this.settingsPanel.mount();
      this.updateCheckTimer = window.setTimeout(() => {
        this.updateCheckTimer = null;
        if (document.visibilityState === "visible") {
          void this.checkForUpdates(false);
          return;
        }
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") void this.checkForUpdates(false);
        }, { once: true });
      }, 2e4);
    }
    async checkForUpdates(force) {
      if (force) this.settingsPanel?.setUpdateState({ status: "checking" });
      const result = await this.updateChecker.check(force);
      if (force || result.status === "available") {
        this.settingsPanel?.setUpdateState(result, force && result.status === "available");
      }
    }
    ensureSettingsHost() {
      if (!this.settingsHost) return;
      const target = document.querySelector(".d-header-icons") ?? document.querySelector(".d-header .contents") ?? document.body;
      if (this.settingsHost.parentElement !== target) target.append(this.settingsHost);
    }
    getPageToolsConfig() {
      const minimalModeEnabled = this.settings.enabled && this.settings.cleanModeEnabled;
      return {
        ownerOnlyEnabled: true,
        minimalHidePosters: minimalModeEnabled && this.settings.minimalHidePosters,
        minimalHideNotices: minimalModeEnabled && this.settings.minimalHideNotices,
        minimalHideCategoryBadges: minimalModeEnabled && this.settings.minimalHideCategoryBadges,
        minimalHideTags: minimalModeEnabled && this.settings.minimalHideTags,
        lowEndOptimizationEnabled: this.settings.enabled && this.settings.lowEndOptimizationEnabled
      };
    }
    applySettings(patch) {
      this.settings = normalizeSettings({ ...this.settings, ...patch });
      saveSettings(this.storage, this.settings);
      const patchKeys = Object.keys(patch);
      const presentationOnly = patchKeys.length > 0 && patchKeys.every((key) => [
        "verticalTabsAutoCollapse",
        "tabPresentation",
        "groupVerticalTabs",
        "colorizeTabs"
      ].includes(key));
      if (presentationOnly) {
        if (patch.verticalTabsAutoCollapse !== void 0 || patch.tabPresentation !== void 0) {
          this.layout.setTabPresentation(this.settings.tabPresentation, this.settings.verticalTabsAutoCollapse);
        }
        this.settingsPanel?.setSettings(this.settings);
        if (patch.tabPresentation !== void 0 || patch.groupVerticalTabs !== void 0 || patch.colorizeTabs !== void 0) this.renderTabs(false);
        return;
      }
      this.layout.setPreference(this.settings.layoutPreference);
      this.layout.setTabPresentation(this.settings.tabPresentation, this.settings.verticalTabsAutoCollapse);
      this.pageTools?.setConfig(this.getPageToolsConfig());
      if (patch.paneSizes || patch.dualPaneSizes) {
        this.layout.setPaneSizes(this.settings.paneSizes, this.settings.dualPaneSizes);
        this.tabStore.setSessionFields({
          paneSizes: this.settings.paneSizes,
          dualPaneSizes: this.settings.dualPaneSizes
        }, Date.now(), false);
        saveSession(this.storage, this.tabStore.getSession());
      }
      this.frames?.setMaxLiveFrames(this.settings.maxLiveFrames);
      this.secondaryFrames?.setMaxLiveFrames(this.settings.maxLiveFrames);
      this.frames?.setPreviewConfig({
        enabled: this.settings.enabled && this.settings.previewEnabled,
        clickMode: this.settings.previewClickMode
      });
      this.secondaryFrames?.setPreviewConfig({
        enabled: this.settings.enabled && this.settings.previewEnabled,
        clickMode: this.settings.previewClickMode
      });
      this.frames?.setPageToolsConfig(this.getPageToolsConfig());
      this.secondaryFrames?.setPageToolsConfig(this.getPageToolsConfig());
      this.listFrame?.setConfig({
        enabled: this.settings.enabled && this.settings.previewEnabled,
        clickMode: this.settings.previewClickMode,
        pageTools: this.getPageToolsConfig()
      });
      this.settingsPanel?.setSettings(this.settings);
      this.credit?.setEnabled(this.settings.enabled && this.settings.creditEnabled);
      if (patch.previewClickMode !== void 0) this.preview.syncClickMode();
      if (this.settings.enabled && this.settings.previewEnabled) this.preview.mount();
      if (patch.restoreSession === false) clearRestorableSessions(this.storage);
      if (!this.settings.enabled || !this.settings.previewEnabled) this.preview.close();
      if (patch.colorizeTabs !== void 0 || patch.tabPresentation !== void 0 || patch.groupVerticalTabs !== void 0) this.renderTabs();
      const canShowTabs = this.settings.enabled && this.settings.tabsEnabled && (isSplitRoute(location.href) || this.tabStore.getTabs().length > 0);
      if (!canShowTabs) {
        this.disposeSplitRuntime();
        return;
      }
      if (!this.layout.mount()) return;
      const active = this.tabStore.getActive();
      const hasTabs = this.tabStore.getTabs().length > 0;
      this.layout.setOpen(hasTabs);
      if (hasTabs) {
        this.ensureFrames();
        this.ensureListFrame();
        if (active) this.activateFrame(active, "primary");
        const secondaryActive = this.tabStore.getSecondaryActive();
        if (secondaryActive) {
          this.layout.setSecondaryOpen(true);
          this.ensureSecondaryFrames();
          this.activateFrame(secondaryActive, "secondary");
        }
      }
    }
    persistPaneSizes(paneSizes, layout) {
      this.settings = normalizeSettings({
        ...this.settings,
        ...layout === "dual" ? { dualPaneSizes: paneSizes } : { paneSizes }
      });
      saveSettings(this.storage, this.settings);
      this.tabStore.setSessionFields(layout === "dual" ? { dualPaneSizes: this.settings.dualPaneSizes } : { paneSizes: this.settings.paneSizes }, Date.now(), false);
      saveSession(this.storage, this.tabStore.getSession());
      this.settingsPanel?.setSettings(this.settings);
    }
    scheduleTopicTracking(topicId, url) {
      const key = topicId;
      if (this.trackedTopicKey === key) return;
      this.clearTopicTrackSchedule();
      this.trackedTopicKey = key;
      const info = getTopicInfo(url);
      if (!info) return;
      const tracker = createBrowserViewTracker();
      this.topicTrackTimers = [2500, 1e4].map((delay) => window.setTimeout(() => {
        void tracker.track(info, "browser-open", document.referrer);
      }, delay));
    }
    clearTopicTrackSchedule() {
      for (const timer of this.topicTrackTimers) window.clearTimeout(timer);
      this.topicTrackTimers = [];
      this.trackedTopicKey = "";
    }
    activateFrame(tab, pane) {
      const pool = pane === "secondary" ? this.secondaryFrames : this.frames;
      if (!tab || !pool) return;
      pool.activate(tab, Date.now());
      const content = pane === "secondary" ? this.layout.getSecondaryContentElement() : this.layout.getContentElement();
      const empty = content?.querySelector(".ldu-topic-empty");
      if (empty) empty.hidden = true;
    }
    handleFrameMessage(message, iframe, pane) {
      const tab = this.tabStore.get(message.tabId);
      if (!tab) return;
      if (message.type === "ldu:frame-interaction") {
        this.dismissHostOverlays();
        return;
      }
      if (message.type === "ldu:bookmark-result") {
        this.showActionToast(message.message || (message.ok ? "\u5DF2\u6DFB\u52A0\u5230\u4E66\u7B7E" : "\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"), message.ok === false);
        return;
      }
      if (message.type === "ldu:list-navigate" && message.url) {
        this.navigateList(message.url);
        return;
      }
      if (message.type === "ldu:preview-open") {
        this.preview.openFromFrame(message.url ?? "", iframe, message.anchorRect);
        return;
      }
      if (message.type === "ldu:preview-dismiss") {
        this.preview.close();
        return;
      }
      if (message.type === "ldu:topic-open") {
        const info2 = message.url ? getTopicInfo(message.url, location.href) : null;
        if (!info2 || !isSupportedTopicTarget(info2.url.href, tab.url)) return;
        this.openTopic(info2.topicId, info2.url.href, message.title || `\u4E3B\u9898 ${info2.topicId}`, info2.postNumber, pane);
        return;
      }
      const info = message.url ? getTopicInfo(message.url) : null;
      const sameTopic = info?.topicId === tab.topicId;
      const patch = {
        ...message.url ? { url: message.url } : {},
        ...message.title ? { title: message.title } : {},
        ...info?.postNumber ? { postNumber: info.postNumber } : {},
        suspended: false
      };
      this.tabStore.update(tab.id, patch, Date.now(), message.type === "ldu:frame-ready" || Boolean(message.title && !sameTopic));
      if (message.type === "ldu:frame-state") this.schedulePersist();
    }
    renderTabs(activateFrames = true) {
      const root = this.layout?.getTabStripElement();
      if (!root || !this.tabStore) return;
      const primaryTabs = this.tabStore.getPrimaryTabs();
      const secondaryTabs = this.tabStore.getSecondaryTabs();
      this.layout.setSecondaryOpen(secondaryTabs.length > 0);
      if (secondaryTabs.length > 0) this.ensureSecondaryFrames();
      else if (this.secondaryFrames) {
        this.secondaryFrames.destroy();
        this.secondaryFrames = null;
      }
      renderTabStrip(root, primaryTabs, this.tabStore.getSession().activeTabId, {
        onActivate: (tabId) => {
          const tab = this.tabStore.activate(tabId, Date.now());
          if (tab) this.activateFrame(tab, "primary");
        },
        onClose: (tabId) => this.closeTab(tabId, "primary"),
        onContextMenu: (tabId, x, y) => this.tabContextMenu.open(tabId, x, y, false, "primary"),
        onReorder: (tabId, targetTabId, position) => {
          this.tabStore.reorderInPane(tabId, targetTabId, position, Date.now());
        }
      }, {
        colorizeTabs: this.settings.colorizeTabs,
        orientation: this.settings.tabPresentation,
        groupByCategory: this.settings.groupVerticalTabs
      });
      const secondaryRoot = this.layout.getSecondaryTabStripElement();
      if (secondaryRoot) {
        renderTabStrip(secondaryRoot, secondaryTabs, this.tabStore.getSession().secondaryActiveTabId, {
          onActivate: (tabId) => {
            const tab = this.tabStore.activateSecondary(tabId, Date.now());
            if (tab) this.activateFrame(tab, "secondary");
          },
          onClose: (tabId) => this.closeTab(tabId, "secondary"),
          onContextMenu: (tabId, x, y) => this.tabContextMenu.open(tabId, x, y, true, "secondary"),
          onReorder: (tabId, targetTabId, position) => {
            this.tabStore.reorderInPane(tabId, targetTabId, position, Date.now());
          }
        }, {
          colorizeTabs: this.settings.colorizeTabs,
          orientation: this.settings.tabPresentation,
          groupByCategory: this.settings.groupVerticalTabs
        });
      }
      const actions = this.layout.getActionsElement();
      if (actions && !actions.querySelector(".ldu-close-all")) {
        const close = document.createElement("button");
        close.type = "button";
        close.className = "ldu-icon-button ldu-close-all";
        setIcon(close, "close", 18);
        close.title = "\u5173\u95ED\u6240\u6709\u5E16\u5B50\u6807\u7B7E";
        close.setAttribute("aria-label", "\u5173\u95ED\u6240\u6709\u5E16\u5B50\u6807\u7B7E");
        close.addEventListener("click", () => {
          for (const tab of this.tabStore.getTabs()) {
            this.frames?.remove(tab.id);
            this.secondaryFrames?.remove(tab.id);
          }
          this.tabStore.clear(Date.now());
          this.disposeSplitRuntime();
        });
        actions.append(close);
      }
      const secondaryActions = this.layout.getSecondaryActionsElement();
      if (secondaryActions && !secondaryActions.querySelector(".ldu-close-secondary")) {
        const close = document.createElement("button");
        close.type = "button";
        close.className = "ldu-icon-button ldu-close-secondary";
        setIcon(close, "close", 18);
        close.title = "\u5173\u95ED\u7B2C\u4E8C\u9605\u8BFB\u533A";
        close.setAttribute("aria-label", "\u5173\u95ED\u7B2C\u4E8C\u9605\u8BFB\u533A\u5E76\u5C06\u6807\u7B7E\u79FB\u56DE\u4E3B\u9605\u8BFB\u533A");
        close.addEventListener("click", () => this.closeSecondaryPanel());
        secondaryActions.append(close);
      }
      const empty = this.layout.getContentElement()?.querySelector(".ldu-topic-empty");
      if (empty) empty.hidden = primaryTabs.length > 0;
      const secondaryEmpty = this.layout.getSecondaryContentElement()?.querySelector(".ldu-topic-empty");
      if (secondaryEmpty) secondaryEmpty.hidden = secondaryTabs.length > 0;
      if (!activateFrames) return;
      const active = this.tabStore.getActive();
      if (active) this.activateFrame(active, "primary");
      const secondaryActive = this.tabStore.getSecondaryActive();
      if (secondaryActive) this.activateFrame(secondaryActive, "secondary");
    }
    closeTab(tabId, pane) {
      (pane === "secondary" ? this.secondaryFrames : this.frames)?.remove(tabId);
      this.tabStore.close(tabId, Date.now(), false);
      if (pane === "primary" && this.tabStore.getPrimaryTabs().length === 0 && this.tabStore.getSecondaryTabs().length > 0) {
        this.closeSecondaryPanel();
        return;
      }
      saveSession(this.storage, this.tabStore.getSession());
      this.renderTabs();
      if (this.tabStore.getTabs().length === 0) this.disposeSplitRuntime();
    }
    moveTabToSecondary(tabId) {
      if (this.tabStore.getSession().secondaryTabIds.includes(tabId)) return;
      const tab = this.captureLiveFrameState(tabId, this.frames);
      if (!tab || !this.layout.mount()) return;
      const transfer = this.frames?.detach(tabId) ?? null;
      this.layout.setSecondaryOpen(true);
      this.ensureSecondaryFrames();
      const moved = this.tabStore.moveToSecondary(tabId, Date.now(), false);
      if (!moved) return;
      if (transfer && this.secondaryFrames) this.secondaryFrames.adopt(moved, transfer, Date.now());
      saveSession(this.storage, this.tabStore.getSession());
      this.renderTabs();
    }
    closeSecondaryPanel() {
      const secondaryTabs = this.tabStore.getSecondaryTabs();
      const transfers = secondaryTabs.flatMap((tab) => {
        const current = this.captureLiveFrameState(tab.id, this.secondaryFrames) ?? tab;
        const transfer = this.secondaryFrames?.detach(tab.id);
        return transfer ? [{ tab: current, transfer }] : [];
      });
      this.tabStore.mergeSecondaryIntoPrimary(Date.now(), false);
      for (const { tab, transfer } of transfers) this.frames?.adopt(tab, transfer, Date.now());
      saveSession(this.storage, this.tabStore.getSession());
      this.renderTabs();
    }
    openTabInBrowser(tabId) {
      const tab = this.tabStore.get(tabId);
      if (!tab) return;
      const anchor = document.createElement("a");
      anchor.href = tab.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();
    }
    reloadTab(tabId) {
      const secondary = this.tabStore.getSession().secondaryTabIds.includes(tabId);
      const pool = secondary ? this.secondaryFrames : this.frames;
      const tab = this.captureLiveFrameState(tabId, pool);
      if (!tab) return;
      if (pool?.getFrame(tabId)) pool.reload(tabId);
      else pool?.prepare(tab, Date.now());
    }
    async copyTabLink(tabId) {
      const tab = this.tabStore.get(tabId);
      if (!tab) return;
      try {
        await navigator.clipboard.writeText(tab.url);
        return;
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = tab.url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
    }
    bookmarkTab(tabId) {
      const secondary = this.tabStore.getSession().secondaryTabIds.includes(tabId);
      const tab = this.tabStore.get(tabId);
      if (!tab) return;
      const pool = secondary ? this.secondaryFrames : this.frames;
      pool?.prepare(tab, Date.now());
      pool?.sendCommand(tabId, {
        type: "ldu:bookmark",
        topicId: tab.topicId
      });
    }
    closeOtherTabs(tabId) {
      const secondary = this.tabStore.getSession().secondaryTabIds.includes(tabId);
      const paneTabs = secondary ? this.tabStore.getSecondaryTabs() : this.tabStore.getPrimaryTabs();
      for (const tab of paneTabs) {
        if (tab.id !== tabId) (secondary ? this.secondaryFrames : this.frames)?.remove(tab.id);
      }
      this.tabStore.closeOthersInPane(tabId, Date.now());
    }
    persistSession() {
      const active = this.tabStore?.getActive();
      if (active && this.frames) this.captureLiveFrameState(active.id, this.frames);
      const secondaryActive = this.tabStore?.getSecondaryActive();
      if (secondaryActive && this.secondaryFrames) this.captureLiveFrameState(secondaryActive.id, this.secondaryFrames);
      if (this.tabStore) saveSession(this.storage, this.tabStore.getSession());
    }
    captureLiveFrameState(tabId, pool) {
      const tab = this.tabStore.get(tabId);
      const iframe = pool?.getFrame(tabId);
      if (!tab || !iframe?.contentWindow) return tab;
      let url = tab.url;
      let title = tab.title;
      try {
        const currentUrl = iframe.contentWindow.location.href;
        if (getTopicInfo(currentUrl, tab.url)?.topicId === tab.topicId) url = currentUrl;
        const currentTitle = iframe.contentDocument?.title?.trim();
        if (currentTitle) title = currentTitle;
      } catch {
        return tab;
      }
      const info = getTopicInfo(url, tab.url);
      this.tabStore.update(tabId, {
        url,
        title,
        ...info?.postNumber ? { postNumber: info.postNumber } : {},
        suspended: false
      }, Date.now(), false);
      return this.tabStore.get(tabId) ?? tab;
    }
    showActionToast(message, isError) {
      document.querySelector(".ldu-action-toast")?.remove();
      const toast = document.createElement("div");
      toast.className = `ldu-action-toast${isError ? " is-error" : ""}`;
      toast.setAttribute("role", isError ? "alert" : "status");
      toast.textContent = message;
      document.body.append(toast);
      window.setTimeout(() => toast.remove(), 2800);
    }
    disposeSplitRuntime() {
      this.finishListHandoff();
      this.preview?.close();
      this.frames?.destroy();
      this.frames = null;
      this.secondaryFrames?.destroy();
      this.secondaryFrames = null;
      this.tabContextMenu?.close();
      this.listFrame?.destroy();
      this.listFrame = null;
      this.layout?.destroy();
    }
    scheduleListHandoffFallback() {
      if (this.listHandoffTimer !== null) window.clearTimeout(this.listHandoffTimer);
      this.listHandoffTimer = window.setTimeout(() => {
        this.listHandoffTimer = null;
        const scrollY = this.layout?.finishListHandoff() ?? null;
        if (scrollY !== null) this.listFrame?.restoreScroll(scrollY);
      }, LIST_HANDOFF_TIMEOUT_MS);
    }
    finishListHandoff() {
      if (this.listHandoffTimer !== null) window.clearTimeout(this.listHandoffTimer);
      this.listHandoffTimer = null;
      return this.layout?.finishListHandoff() ?? null;
    }
    handlePageHide(event) {
      this.persistSession();
      if (event.persisted) return;
      if (this.settings.restoreSession && this.tabStore?.getTabs().length > 0) {
        stageSessionClose(this.storage, this.tabStore.getSession());
      }
      if (this.leaseTimer !== null) window.clearInterval(this.leaseTimer);
      if (this.sessionMaintenanceTimer !== null) window.clearInterval(this.sessionMaintenanceTimer);
      if (this.updateCheckTimer !== null) window.clearTimeout(this.updateCheckTimer);
      this.leaseTimer = null;
      this.sessionMaintenanceTimer = null;
      this.updateCheckTimer = null;
      releaseSessionLease(this.storage, this.sessionLease);
    }
    schedulePersist() {
      if (this.persistTimer !== null) window.clearTimeout(this.persistTimer);
      this.persistTimer = window.setTimeout(() => {
        this.persistTimer = null;
        this.persistSession();
      }, 500);
    }
  };

  // src/discourse/challenge-bypass.ts
  var ERROR_TEXTS = [
    "403 error",
    "429 error",
    "\u8BE5\u54CD\u5E94\u662F\u5F88\u4E45\u4EE5\u524D\u521B\u5EFA\u7684",
    "reaction was created too long ago",
    "\u6211\u4EEC\u65E0\u6CD5\u52A0\u8F7D\u8BE5\u8BDD\u9898",
    "You are not allowed to react"
  ];
  var DIALOG_SELECTOR = ".dialog-body";
  var CHALLENGE_PATH = "/challenge";
  var NOT_FOUND_REDIRECT_GUARD_KEY = "linux_do_auto_challenge_nf_guard";
  var NOT_FOUND_REDIRECT_GUARD_MS = 5e3;
  var FAILURE_REDIRECT_GUARD_KEY = "linux_do_auto_challenge_failure_guard";
  var FAILURE_REDIRECT_GUARD_MS = 3e4;
  var MANUAL_MENU_TEXT = "\u624B\u52A8\u89E6\u53D1 Challenge \u8DF3\u8F6C";
  function buildChallengeUrl(currentHref) {
    return `${CHALLENGE_PATH}?redirect=${encodeURIComponent(currentHref)}`;
  }
  function getChallengeReturnTarget(pageHref, origin) {
    try {
      const raw = new URL(pageHref).searchParams.get("redirect");
      if (!raw) return void 0;
      const target = new URL(raw, origin);
      return target.origin === origin ? target.href : void 0;
    } catch {
      return void 0;
    }
  }
  var ChallengeBypassController = class {
    constructor(options) {
      this.options = options;
      this.navigate = options.navigate ?? ((url, mode) => {
        if (mode === "replace") options.window.location.replace(url);
        else options.window.location.assign(url);
      });
      this.now = options.now ?? Date.now;
    }
    observer = null;
    started = false;
    navigate;
    now;
    start() {
      if (this.started) return;
      this.started = true;
      if (this.isChallengePage()) {
        if (this.isNotFoundPage()) this.redirectFromNotFoundPage();
        return;
      }
      if (this.checkAndRedirect()) return;
      const body = this.options.document.body;
      if (!body) return;
      const Observer = this.options.window.MutationObserver;
      const observer = new Observer(() => this.checkAndRedirect());
      this.observer = observer;
      observer.observe(body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    stop() {
      this.observer?.disconnect();
      this.observer = null;
    }
    manualTrigger() {
      if (this.isChallengePage()) {
        this.options.window.alert("\u5DF2\u5728 Challenge \u9875\u9762\uFF0C\u65E0\u9700\u8DF3\u8F6C");
        return false;
      }
      this.redirectToChallenge();
      return true;
    }
    isChallengePage() {
      return this.options.window.location.pathname.startsWith(CHALLENGE_PATH);
    }
    isNotFoundPage() {
      return Boolean(this.options.document.querySelector(".page-not-found"));
    }
    isChallengeFailure() {
      if (this.isChallengePage()) return false;
      const dialog = this.options.document.querySelector(DIALOG_SELECTOR);
      if (!dialog) return false;
      const text = dialog.textContent ?? "";
      return ERROR_TEXTS.some((errorText) => text.includes(errorText));
    }
    checkAndRedirect() {
      if (!this.isChallengeFailure()) return false;
      this.redirectToChallenge(false);
      return true;
    }
    redirectToChallenge(manual = true) {
      if (this.isChallengePage()) return;
      this.stop();
      if (!manual && this.isRecentFailureRedirect()) return;
      if (!manual) this.setFailureRedirectGuard();
      this.navigate(buildChallengeUrl(this.options.window.location.href), "assign");
    }
    isRecentFailureRedirect() {
      try {
        const stored = JSON.parse(this.options.window.sessionStorage.getItem(this.getFailureGuardKey()) ?? "null");
        return stored?.url === this.options.window.location.href && typeof stored.timestamp === "number" && this.now() - stored.timestamp < FAILURE_REDIRECT_GUARD_MS;
      } catch {
        return false;
      }
    }
    setFailureRedirectGuard() {
      try {
        this.options.window.sessionStorage.setItem(this.getFailureGuardKey(), JSON.stringify({
          url: this.options.window.location.href,
          timestamp: this.now()
        }));
      } catch {
      }
    }
    getFailureGuardKey() {
      const frameName = this.options.window.name;
      return frameName ? `${FAILURE_REDIRECT_GUARD_KEY}:${frameName}` : FAILURE_REDIRECT_GUARD_KEY;
    }
    redirectFromNotFoundPage() {
      const { location: location2 } = this.options.window;
      const fallback = `${location2.origin}/`;
      const target = getChallengeReturnTarget(location2.href, location2.origin) ?? fallback;
      const now = this.now();
      const guardTs = this.getNotFoundRedirectGuardTs();
      if (guardTs && now - guardTs < NOT_FOUND_REDIRECT_GUARD_MS) return;
      this.setNotFoundRedirectGuardTs(now);
      this.navigate(target === location2.href ? fallback : target, "replace");
    }
    getGuardKey() {
      const frameName = this.options.window.name;
      return frameName ? `${NOT_FOUND_REDIRECT_GUARD_KEY}:${frameName}` : NOT_FOUND_REDIRECT_GUARD_KEY;
    }
    getNotFoundRedirectGuardTs() {
      try {
        const value = Number(this.options.window.sessionStorage.getItem(this.getGuardKey()) ?? 0);
        return Number.isFinite(value) ? value : 0;
      } catch {
        return 0;
      }
    }
    setNotFoundRedirectGuardTs(timestamp) {
      try {
        this.options.window.sessionStorage.setItem(this.getGuardKey(), String(timestamp));
      } catch {
      }
    }
  };
  function bootChallengeBypass(options = {}) {
    if (window.__linuxDoUltimateChallengeBypass) return window.__linuxDoUltimateChallengeBypass;
    const controller = new ChallengeBypassController({ window, document });
    window.__linuxDoUltimateChallengeBypass = controller;
    const start = () => controller.start();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
    if (options.registerManualCommand && window.self === window.top) {
      try {
        if (typeof GM_registerMenuCommand === "function") {
          GM_registerMenuCommand(MANUAL_MENU_TEXT, () => controller.manualTrigger());
        }
      } catch {
      }
    }
    return controller;
  }

  // src/frame-bridge.ts
  var DOUBLE_CLICK_DELAY_MS = 300;
  function bootFrameBridge(options = {}) {
    const frameName = window.name;
    if (frameName.startsWith("ldu-list:")) {
      bootListBridge(frameName.slice("ldu-list:".length), options);
      return;
    }
    if (!frameName.startsWith("ldu-topic:")) return;
    const tabId = frameName.slice("ldu-topic:".length);
    document.documentElement.dataset.lduEmbeddedTopic = "true";
    ensureEmbeddedStyles(document);
    const pageTools = new PageToolsClient({
      isEmbedded: true,
      ...options.loadOwnerView ? { loadOwnerView: options.loadOwnerView } : {}
    });
    let timer = null;
    let pendingSendType = null;
    let lastUrl = "";
    let lastObservedUrl = location.href;
    let lastObservedTitle = document.title;
    let previewEnabled = false;
    let previewClickMode = "double";
    let replayingClick = false;
    let clickTimer = null;
    let softFrozen = false;
    const send = (type) => {
      if (softFrozen && type === "ldu:frame-state") return;
      if (timer !== null) window.clearTimeout(timer);
      pendingSendType = type;
      timer = window.setTimeout(() => {
        timer = null;
        pendingSendType = null;
        if (softFrozen && type === "ldu:frame-state") return;
        const payload = {
          type,
          tabId
        };
        if (type === "ldu:frame-ready" || lastUrl !== location.href) {
          lastUrl = location.href;
          payload.url = location.href;
          payload.title = document.title;
        }
        window.parent.postMessage(payload, location.origin);
      }, type === "ldu:frame-ready" ? 0 : 120);
    };
    window.addEventListener("scroll", () => {
      if (lastUrl !== location.href) send("ldu:frame-state");
    }, { passive: true });
    window.addEventListener("load", () => send("ldu:frame-ready"), { once: true });
    document.addEventListener("DOMContentLoaded", () => send("ldu:frame-ready"), { once: true });
    window.addEventListener("popstate", () => send("ldu:frame-state"));
    const metadataObserver = new MutationObserver(() => {
      if (softFrozen) return;
      const urlChanged = lastObservedUrl !== location.href;
      const titleChanged = lastObservedTitle !== document.title;
      if (!urlChanged && !titleChanged) return;
      lastObservedUrl = location.href;
      lastObservedTitle = document.title;
      send("ldu:frame-state");
    });
    const observeMetadata = () => metadataObserver.observe(document.documentElement, { childList: true, subtree: true });
    observeMetadata();
    const cancelPendingClick = () => {
      if (clickTimer !== null) window.clearTimeout(clickTimer);
      clickTimer = null;
    };
    const pausedMedia = /* @__PURE__ */ new Set();
    const pausedAnimations = /* @__PURE__ */ new Set();
    const pauseVisualActivity = () => {
      for (const media of document.querySelectorAll("audio, video")) {
        if (media.paused || media.ended) continue;
        pausedMedia.add(media);
        try {
          media.pause();
        } catch {
        }
      }
      const animationDocument = document;
      for (const animation of animationDocument.getAnimations?.() ?? []) {
        if (animation.playState !== "running") continue;
        pausedAnimations.add(animation);
        try {
          animation.pause();
        } catch {
        }
      }
    };
    const resumeVisualActivity = () => {
      for (const media of pausedMedia) {
        if (!media.isConnected) continue;
        try {
          void media.play().catch(() => {
          });
        } catch {
        }
      }
      pausedMedia.clear();
      for (const animation of pausedAnimations) {
        try {
          animation.play();
        } catch {
        }
      }
      pausedAnimations.clear();
    };
    const setSoftFrozen = (frozen) => {
      if (softFrozen === frozen) return;
      softFrozen = frozen;
      pageTools.setActive(!frozen);
      if (frozen) {
        document.documentElement.dataset.lduSoftFrozen = "true";
        if (timer !== null && pendingSendType === "ldu:frame-state") {
          window.clearTimeout(timer);
          timer = null;
          pendingSendType = null;
        }
        cancelPendingClick();
        metadataObserver.disconnect();
        pauseVisualActivity();
        return;
      }
      delete document.documentElement.dataset.lduSoftFrozen;
      lastObservedUrl = location.href;
      lastObservedTitle = document.title;
      observeMetadata();
      resumeVisualActivity();
      send("ldu:frame-state");
    };
    const getPreviewableLink = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link || !/^https?:/i.test(link.href) || getTopicInfo(link.href) || new URL(link.href, location.href).origin === location.origin) return null;
      if (target instanceof Element && target.closest("img, picture, .lightbox-wrapper") || link.matches(".lightbox") || link.querySelector("img, picture")) return null;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
      return link;
    };
    const getTopicLink = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link || !isSupportedTopicTarget(link.href, location.href)) return null;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
      return link;
    };
    const getListNavigationLink = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link || !/^https?:/i.test(link.href) || new URL(link.href, location.href).origin !== location.origin || getTopicInfo(link.href)) return null;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
      return link;
    };
    const sendTopicOpen = (link) => {
      const info = getTopicInfo(link.href, location.href);
      window.parent.postMessage({
        type: "ldu:topic-open",
        tabId,
        url: link.href,
        title: link.textContent?.trim() || (info ? `\u4E3B\u9898 ${info.topicId}` : ""),
        ...info?.postNumber ? { postNumber: info.postNumber } : {}
      }, location.origin);
    };
    const sendPreviewOpen = (link) => {
      const rect = link.getBoundingClientRect();
      window.parent.postMessage({
        type: "ldu:preview-open",
        tabId,
        url: link.href,
        anchorRect: {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        }
      }, location.origin);
    };
    const isPlainPrimaryClick = (event) => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent || event.origin !== location.origin) return;
      const data = event.data;
      if (data?.type === "ldu:frame-lifecycle") {
        setSoftFrozen(data.active !== true);
        return;
      }
      if (data?.type === "ldu:bookmark") {
        const topicId = typeof data.topicId === "string" && /^\d+$/.test(data.topicId) ? data.topicId : null;
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!topicId || !csrfToken) {
          window.parent.postMessage({
            type: "ldu:bookmark-result",
            tabId,
            ok: false,
            message: "\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"
          }, location.origin);
          return;
        }
        const body = new URLSearchParams({
          bookmarkable_type: "Topic",
          bookmarkable_id: topicId
        });
        void fetch("/bookmarks.json", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-CSRF-Token": csrfToken,
            "X-Requested-With": "XMLHttpRequest"
          },
          body
        }).then(async (response) => {
          if (!response.ok) {
            let message = "\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25";
            try {
              const payload = await response.json();
              if (Array.isArray(payload.errors) && typeof payload.errors[0] === "string") message = payload.errors[0];
            } catch {
            }
            throw new Error(message);
          }
          window.parent.postMessage({
            type: "ldu:bookmark-result",
            tabId,
            ok: true,
            message: "\u5DF2\u6DFB\u52A0\u5230\u4E66\u7B7E"
          }, location.origin);
        }).catch((error) => {
          window.parent.postMessage({
            type: "ldu:bookmark-result",
            tabId,
            ok: false,
            message: error instanceof Error && error.message ? error.message : "\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"
          }, location.origin);
        });
        return;
      }
      if (data?.type === "ldu:page-tools-config") {
        pageTools.setConfig({
          ownerOnlyEnabled: data.ownerOnlyEnabled === true,
          minimalHidePosters: data.minimalHidePosters === true,
          minimalHideNotices: data.minimalHideNotices === true,
          minimalHideCategoryBadges: data.minimalHideCategoryBadges === true,
          minimalHideTags: data.minimalHideTags === true,
          lowEndOptimizationEnabled: data.lowEndOptimizationEnabled === true
        });
        return;
      }
      if (data?.type !== "ldu:preview-config") return;
      previewEnabled = data.enabled === true;
      previewClickMode = data.clickMode === "single" ? "single" : "double";
      if (!previewEnabled) cancelPendingClick();
    });
    document.addEventListener("pointerdown", (event) => {
      window.parent.postMessage({ type: "ldu:frame-interaction", tabId }, location.origin);
      if (previewEnabled && previewClickMode === "double" && event.detail >= 2) cancelPendingClick();
    }, true);
    let scrollInteractionTimer = null;
    const notifyScrollInteraction = () => {
      if (scrollInteractionTimer !== null) return;
      window.parent.postMessage({ type: "ldu:frame-interaction", tabId }, location.origin);
      scrollInteractionTimer = window.setTimeout(() => {
        scrollInteractionTimer = null;
      }, 120);
    };
    window.addEventListener("wheel", notifyScrollInteraction, { passive: true, capture: true });
    window.addEventListener("touchstart", notifyScrollInteraction, { passive: true, capture: true });
    document.addEventListener("keydown", (event) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", "Space"].includes(event.key)) {
        notifyScrollInteraction();
      }
    }, true);
    document.addEventListener("click", (event) => {
      if (replayingClick || !isPlainPrimaryClick(event)) return;
      const topicLink = getTopicLink(event.target);
      if (topicLink) {
        event.preventDefault();
        event.stopImmediatePropagation();
        sendTopicOpen(topicLink);
        return;
      }
      const listLink = getListNavigationLink(event.target);
      if (listLink) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.parent.postMessage({ type: "ldu:list-navigate", tabId, url: listLink.href }, location.origin);
        return;
      }
      if (!previewEnabled) return;
      const link = getPreviewableLink(event.target);
      if (!link) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (previewClickMode === "single") {
        sendPreviewOpen(link);
        return;
      }
      cancelPendingClick();
      if (event.detail >= 2) return;
      clickTimer = window.setTimeout(() => {
        clickTimer = null;
        if (!link.isConnected) return;
        replayingClick = true;
        try {
          link.click();
        } finally {
          replayingClick = false;
        }
      }, DOUBLE_CLICK_DELAY_MS);
    }, true);
    document.addEventListener("dblclick", (event) => {
      if (!previewEnabled || previewClickMode !== "double" || !isPlainPrimaryClick(event)) return;
      const link = getPreviewableLink(event.target);
      if (!link) return;
      cancelPendingClick();
      event.preventDefault();
      event.stopImmediatePropagation();
      sendPreviewOpen(link);
    }, true);
    document.addEventListener("keydown", (event) => {
      if (!previewEnabled || event.key !== "Escape") return;
      window.parent.postMessage({ type: "ldu:preview-dismiss", tabId }, location.origin);
    }, true);
    send("ldu:frame-ready");
  }
  function bootListBridge(frameId, options) {
    document.documentElement.dataset.lduEmbeddedList = "true";
    ensureEmbeddedStyles(document);
    const pageTools = new PageToolsClient({
      isEmbedded: true,
      allowOwnerView: false,
      ...options.loadOwnerView ? { loadOwnerView: options.loadOwnerView } : {}
    });
    let timer = null;
    let clickTimer = null;
    let visualReadySent = false;
    let visualReadyTimer = null;
    let previewEnabled = false;
    let previewClickMode = "double";
    let replayingClick = false;
    let lastUrl = "";
    let lastTitle = "";
    const send = (type) => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        const payload = { type, frameId, url: location.href, title: document.title, scrollY: window.scrollY };
        lastUrl = location.href;
        lastTitle = document.title;
        window.parent.postMessage(payload, location.origin);
      }, type === "ldu:list-ready" ? 0 : 100);
    };
    const hasRenderedListContent = () => {
      if (document.readyState === "loading") return false;
      const outlet = document.querySelector("#main-outlet");
      if (!outlet) return false;
      return [...outlet.children].some((child) => !child.matches(
        ".loading-container, .spinner, .spinner-container, .loading-indicator"
      ));
    };
    const scheduleVisualReady = () => {
      if (visualReadySent || visualReadyTimer !== null || !hasRenderedListContent()) return;
      visualReadyTimer = window.setTimeout(() => {
        visualReadyTimer = null;
        if (visualReadySent || !hasRenderedListContent()) return;
        visualReadySent = true;
        window.parent.postMessage({
          type: "ldu:list-visual-ready",
          frameId,
          url: location.href,
          title: document.title,
          scrollY: window.scrollY
        }, location.origin);
      }, 0);
    };
    const cancelPendingClick = () => {
      if (clickTimer !== null) window.clearTimeout(clickTimer);
      clickTimer = null;
    };
    const isPlainPrimaryClick = (event) => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
    const getTopicLink = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link || !isSupportedTopicTarget(link.href, location.href)) return null;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
      return link;
    };
    const getPreviewableLink = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link || !/^https?:/i.test(link.href) || getTopicInfo(link.href) || new URL(link.href, location.href).origin === location.origin) return null;
      if (target instanceof Element && target.closest("img, picture, .lightbox-wrapper") || link.matches(".lightbox") || link.querySelector("img, picture")) return null;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
      return link;
    };
    const sendTopic = (link) => {
      const info = getTopicInfo(link.href, location.href);
      window.parent.postMessage({
        type: "ldu:list-topic-open",
        frameId,
        url: link.href,
        topicId: info?.topicId,
        postNumber: info?.postNumber,
        topicTitle: link.textContent?.trim() || (info ? `\u4E3B\u9898 ${info.topicId}` : "")
      }, location.origin);
    };
    const sendPreview = (link) => {
      const rect = link.getBoundingClientRect();
      window.parent.postMessage({ type: "ldu:list-preview-open", frameId, url: link.href, anchorRect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      } }, location.origin);
    };
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent || event.origin !== location.origin) return;
      const data = event.data;
      if (data?.type === "ldu:page-tools-config") {
        pageTools.setConfig({
          ownerOnlyEnabled: data.ownerOnlyEnabled === true,
          minimalHidePosters: data.minimalHidePosters === true,
          minimalHideNotices: data.minimalHideNotices === true,
          minimalHideCategoryBadges: data.minimalHideCategoryBadges === true,
          minimalHideTags: data.minimalHideTags === true,
          lowEndOptimizationEnabled: data.lowEndOptimizationEnabled === true
        });
        return;
      }
      if (data?.type !== "ldu:preview-config") return;
      previewEnabled = data.enabled === true;
      previewClickMode = data.clickMode === "single" ? "single" : "double";
      if (!previewEnabled) cancelPendingClick();
    });
    window.addEventListener("scroll", () => send("ldu:list-state"), { passive: true });
    window.addEventListener("load", () => {
      send("ldu:list-ready");
      scheduleVisualReady();
    }, { once: true });
    document.addEventListener("DOMContentLoaded", () => {
      send("ldu:list-ready");
      scheduleVisualReady();
    }, { once: true });
    window.addEventListener("popstate", () => send("ldu:list-state"));
    window.addEventListener("hashchange", () => send("ldu:list-state"));
    document.addEventListener("pointerdown", () => {
      window.parent.postMessage({ type: "ldu:list-interaction", frameId }, location.origin);
    }, true);
    new MutationObserver(() => {
      scheduleVisualReady();
      if (lastUrl === location.href && lastTitle === document.title) return;
      send("ldu:list-state");
    }).observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("click", (event) => {
      if (replayingClick || !isPlainPrimaryClick(event)) return;
      const topic = getTopicLink(event.target);
      if (topic) {
        event.preventDefault();
        event.stopImmediatePropagation();
        sendTopic(topic);
        return;
      }
      if (!previewEnabled) return;
      const link = getPreviewableLink(event.target);
      if (!link) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (previewClickMode === "single") {
        sendPreview(link);
        return;
      }
      cancelPendingClick();
      if (event.detail >= 2) return;
      clickTimer = window.setTimeout(() => {
        clickTimer = null;
        if (!link.isConnected) return;
        replayingClick = true;
        try {
          link.click();
        } finally {
          replayingClick = false;
        }
      }, DOUBLE_CLICK_DELAY_MS);
    }, true);
    document.addEventListener("dblclick", (event) => {
      if (!previewEnabled || previewClickMode !== "double" || !isPlainPrimaryClick(event)) return;
      const link = getPreviewableLink(event.target);
      if (!link) return;
      cancelPendingClick();
      event.preventDefault();
      event.stopImmediatePropagation();
      sendPreview(link);
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      window.parent.postMessage({ type: "ldu:list-preview-dismiss", frameId }, location.origin);
    }, true);
    send("ldu:list-ready");
    scheduleVisualReady();
  }

  // src/preview/link-hover-previewer-upstream.ts
  function installLinkHoverPreviewer(options) {
    "use strict";
    options = options || {};
    const isPreviewEnabled = () => options.isEnabled ? options.isEnabled() : true;
    const syncClickMode = () => {
      if (options.clickMode) isSingleClickPreviewEnabled = options.clickMode() === "single";
    };
    const CLICK_DELAY = 300;
    const SINGLE_CLICK_PREVIEW_DELAY = 250;
    const PREHEAT_DELAY = 250;
    const WINDOW_WIDTH = 980;
    const WINDOW_HEIGHT = 650;
    const CACHE_EXPIRE_TIME = 5 * 60 * 1e3;
    const CACHE_MAX_ENTRIES = 15;
    const CACHE_MAX_BYTES = 20 * 1024 * 1024;
    const TOKEN_PLACEHOLDER = "__AGY_TOKEN__";
    const BOOKMARK_KEY = "agy_bookmarks";
    const HIDDEN_TOPIC_KEY = "agy_linux_hidden_topics";
    const HIDDEN_TOPIC_STYLE_ID = "agy-linux-hidden-topic-style";
    const PREVIEW_POSITION_KEY = "agy_preview_position";
    const PREVIEW_MAXIMIZED_KEY = "agy_preview_maximized";
    const SINGLE_CLICK_PREVIEW_KEY = "agy_single_click_preview";
    const WINDOW_MARGIN = 8;
    const IS_TOP = window.self === window.top;
    const PREVIEW_FRAME_PREFIX = "agy-preview-frame:";
    const IS_PREVIEW_FRAME = window.name.startsWith(PREVIEW_FRAME_PREFIX);
    function isPreviewRefreshKey(e) {
      return e.key === "F5" || e.code === "F5" || e.keyCode === 116;
    }
    function createPageVisibilityController() {
      let pageWindow = window;
      try {
        if (typeof unsafeWindow !== "undefined" && unsafeWindow) pageWindow = unsafeWindow;
      } catch (e) {
      }
      const pageDocument = pageWindow.document || document;
      const PageObject = pageWindow.Object || Object;
      const PageReflect = pageWindow.Reflect || Reflect;
      const PageEvent = pageWindow.Event || Event;
      try {
        const existingController = pageWindow.__agyPreviewVisibilityControllerV2;
        if (existingController && typeof existingController.setSuspended === "function" && typeof existingController.flushVisibilityChange === "function" && typeof existingController.getNativeVisibilityState === "function") return existingController;
      } catch (e) {
      }
      const controlledProperties = [];
      let isInstalled = false;
      let isSuspended = false;
      let visibilityNotificationToken = 0;
      function findDescriptor(name) {
        let target = pageDocument;
        while (target) {
          let descriptor = null;
          try {
            descriptor = PageObject.getOwnPropertyDescriptor(target, name);
          } catch (e) {
          }
          if (descriptor) return descriptor;
          try {
            target = PageObject.getPrototypeOf(target);
          } catch (e) {
            target = null;
          }
        }
        return null;
      }
      function readNativeProperty(name, fallbackValue) {
        const controlled = controlledProperties.find((item) => item.name === name);
        const descriptor = controlled && controlled.nativeDescriptor;
        try {
          if (descriptor && typeof descriptor.get === "function") {
            return PageReflect.apply(descriptor.get, pageDocument, []);
          }
          if (descriptor && PageObject.prototype.hasOwnProperty.call(descriptor, "value")) {
            return descriptor.value;
          }
        } catch (e) {
        }
        return fallbackValue;
      }
      function registerProperty(name, suspendedValue, fallbackValue) {
        const nativeDescriptor = findDescriptor(name);
        if (!nativeDescriptor && !(name in pageDocument)) return;
        let ownDescriptor = null;
        try {
          ownDescriptor = PageObject.getOwnPropertyDescriptor(pageDocument, name) || null;
        } catch (e) {
        }
        controlledProperties.push({
          name,
          suspendedValue,
          fallbackValue,
          nativeDescriptor,
          ownDescriptor
        });
      }
      registerProperty("hidden", true, false);
      registerProperty("visibilityState", "hidden", "visible");
      registerProperty("webkitHidden", true, false);
      registerProperty("webkitVisibilityState", "hidden", "visible");
      function install() {
        if (isInstalled) return true;
        const installedNames = [];
        try {
          controlledProperties.forEach((item) => {
            PageObject.defineProperty(pageDocument, item.name, {
              configurable: true,
              enumerable: Boolean(item.nativeDescriptor && item.nativeDescriptor.enumerable),
              get: function() {
                return isSuspended ? item.suspendedValue : readNativeProperty(item.name, item.fallbackValue);
              }
            });
            installedNames.push(item.name);
          });
          isInstalled = true;
          return true;
        } catch (e) {
          installedNames.forEach((name) => {
            try {
              PageReflect.deleteProperty(pageDocument, name);
            } catch (error) {
            }
          });
          return false;
        }
      }
      function uninstall() {
        if (!isInstalled) return;
        controlledProperties.forEach((item) => {
          try {
            if (item.ownDescriptor) {
              PageObject.defineProperty(pageDocument, item.name, item.ownDescriptor);
            } else {
              PageReflect.deleteProperty(pageDocument, item.name);
            }
          } catch (e) {
          }
        });
        isInstalled = false;
      }
      function dispatchVisibilityChange() {
        try {
          pageDocument.dispatchEvent(new PageEvent("visibilitychange"));
        } catch (e) {
          try {
            document.dispatchEvent(new Event("visibilitychange"));
          } catch (error) {
          }
        }
      }
      function getNativeVisibilityState() {
        return readNativeProperty("visibilityState", "visible");
      }
      function getEffectiveHidden() {
        return isSuspended || Boolean(readNativeProperty("hidden", false));
      }
      let lastNotifiedHidden = getEffectiveHidden();
      try {
        pageDocument.addEventListener("visibilitychange", function rememberVisibilityState() {
          lastNotifiedHidden = getEffectiveHidden();
        }, true);
      } catch (e) {
      }
      function flushVisibilityChange() {
        const isHidden = getEffectiveHidden();
        if (isHidden === lastNotifiedHidden) return false;
        lastNotifiedHidden = isHidden;
        dispatchVisibilityChange();
        return true;
      }
      function deferVisibilityChange(token) {
        const notify = function() {
          if (token !== visibilityNotificationToken) return;
          flushVisibilityChange();
        };
        try {
          if (pageWindow.scheduler && typeof pageWindow.scheduler.postTask === "function") {
            const task = pageWindow.scheduler.postTask(notify, { priority: "background" });
            if (task && typeof task.catch === "function") {
              task.catch(function() {
              });
            }
            return;
          }
        } catch (e) {
        }
        try {
          pageWindow.setTimeout(notify, 0);
        } catch (e) {
          setTimeout(notify, 0);
        }
      }
      const controller = {
        setSuspended(shouldSuspend, options2 = {}) {
          const nextSuspended = Boolean(shouldSuspend);
          const stateChanged = nextSuspended !== isSuspended;
          const wasHidden = getEffectiveHidden();
          if (nextSuspended && !install()) return false;
          isSuspended = nextSuspended;
          if (!isSuspended) uninstall();
          const isHidden = getEffectiveHidden();
          if (stateChanged) visibilityNotificationToken += 1;
          if (wasHidden !== isHidden && options2.notify !== false) {
            if (options2.deferNotification === true) {
              deferVisibilityChange(visibilityNotificationToken);
            } else {
              flushVisibilityChange();
            }
          }
          return true;
        },
        flushVisibilityChange,
        getNativeVisibilityState,
        isSuspended() {
          return isSuspended;
        }
      };
      try {
        PageObject.defineProperty(pageWindow, "__agyPreviewVisibilityControllerV2", {
          configurable: true,
          value: controller
        });
      } catch (e) {
      }
      return controller;
    }
    const pageVisibilityController = createPageVisibilityController();
    if (IS_PREVIEW_FRAME) {
      installPreviewFrameBridge();
      return;
    }
    function installPreviewFrameBridge() {
      if (window.__agyPreviewBridgeInstalled) return;
      window.__agyPreviewBridgeInstalled = true;
      const getLoadToken = () => Number(window.name.slice(PREVIEW_FRAME_PREFIX.length));
      const isEditableTarget = (target) => Boolean(target && target.closest && target.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""], .CodeMirror, .monaco-editor'
      ));
      let contentReadySent = false;
      let contentCheckScheduled = false;
      let contentObserver = null;
      window.addEventListener("message", function(e) {
        const data = e.data;
        if (e.source !== window.parent || !data || data.agyPreviewActivity !== true || data.agyPreviewToken !== getLoadToken()) return;
        pageVisibilityController.setSuspended(data.agyPreviewActive !== true);
      });
      function hasMeaningfulContent() {
        if (!document.body) return false;
        const renderedText = typeof document.body.innerText === "string" ? document.body.innerText : document.body.textContent || "";
        const text = renderedText.replace(/\s+/g, "");
        if (text.length >= 12) return true;
        return Boolean(document.body.querySelector('img[src], video, canvas, svg, article, main > *, [role="main"] > *'));
      }
      function checkContentReady() {
        contentCheckScheduled = false;
        if (contentReadySent || !hasMeaningfulContent()) return;
        contentReadySent = true;
        if (contentObserver) contentObserver.disconnect();
        window.parent.postMessage({
          agyPreviewContentReady: true,
          agyPreviewToken: getLoadToken()
        }, "*");
      }
      function scheduleContentReadyCheck() {
        if (contentReadySent || contentCheckScheduled) return;
        contentCheckScheduled = true;
        setTimeout(checkContentReady, 50);
      }
      try {
        contentObserver = new MutationObserver(scheduleContentReadyCheck);
        contentObserver.observe(document.documentElement || document, {
          childList: true,
          subtree: true,
          characterData: true
        });
      } catch (e) {
      }
      document.addEventListener("DOMContentLoaded", scheduleContentReadyCheck, { once: true });
      document.addEventListener("click", function(e) {
        const link = e.target && e.target.closest ? e.target.closest("a") : null;
        if (!link) return;
        const rawHref = link.getAttribute("href");
        if (!rawHref || /^javascript:/i.test(rawHref)) return;
        if (rawHref.startsWith("#")) return;
        let url = "";
        try {
          url = link.href;
        } catch (error) {
          return;
        }
        if (!/^https?:/i.test(url)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        window.parent.postMessage({
          agyPreviewNavigate: url,
          agyPreviewToken: getLoadToken()
        }, "*");
      }, true);
      document.addEventListener("keydown", function(e) {
        if (isPreviewRefreshKey(e)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (!e.repeat) {
            window.parent.postMessage({
              agyPreviewRefresh: true,
              agyPreviewToken: getLoadToken()
            }, "*");
          }
          return;
        }
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey || e.isComposing || isEditableTarget(e.target)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        window.parent.postMessage({
          agyPreviewHistoryDirection: e.key === "ArrowLeft" ? -1 : 1,
          agyPreviewToken: getLoadToken()
        }, "*");
      }, true);
      window.addEventListener("load", function() {
        const token = getLoadToken();
        window.parent.postMessage({
          agyPreviewTitle: document.title || "",
          agyPreviewUrl: location.href,
          agyPreviewToken: token
        }, "*");
        scheduleContentReadyCheck();
      }, { once: true });
    }
    const ICON_EXTERNAL = iconSvg("external", 16);
    const ICON_BOOKMARK = iconSvg("bookmark", 16);
    const ICON_BOOKMARK_FILLED = iconSvg("bookmark-filled", 16);
    const ICON_LIST = iconSvg("list", 16);
    const ICON_CHECK = iconSvg("check", 16);
    const ICON_MAXIMIZE = iconSvg("maximize", 16);
    const ICON_RESTORE = iconSvg("restore", 16);
    const ICON_REFRESH = iconSvg("refresh", 16);
    const ICON_CLOSE = iconSvg("close", 16);
    const ICON_TRASH = iconSvg("trash", 16);
    const ICON_THUMBS_UP = iconSvg("thumbs-up", 16);
    const ICON_THUMBS_DOWN = iconSvg("thumbs-down", 16);
    const LINUX_DO_COMPACT_CSS = `
        /* \u9876\u680F\u4FDD\u7559\u539F\u641C\u7D22\u7EC4\u4EF6\uFF0C\u5E76\u5C06\u5176\u56FA\u5B9A\u5230\u9876\u90E8\u680F\u6B63\u4E2D\u592E\u3002 */
        #main-outlet > .welcome-banner {
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            overflow: visible !important;
        }
        #main-outlet > .welcome-banner.--location-above-topic-content {
            display: block !important;
        }
        #main-outlet > .welcome-banner .welcome-banner__wrap {
            position: static !important;
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
        }
        #main-outlet > .welcome-banner .welcome-banner__title,
        #main-outlet > .welcome-banner .welcome-banner__wrap > :not(.welcome-banner__search-menu),
        #main-outlet > .container > .global-notice {
            display: none !important;
        }
        #main-outlet > .welcome-banner .welcome-banner__search-menu {
            position: fixed !important;
            top: 3px !important;
            left: 50% !important;
            z-index: 1100 !important;
            width: min(600px, calc(100vw - 360px)) !important;
            max-width: calc(100vw - 24px) !important;
            margin: 0 !important;
            transform: translateX(-50%) !important;
        }
        #main-outlet > .welcome-banner .welcome-banner__search-menu .search-term__input {
            width: 100% !important;
            min-width: 0 !important;
        }
        /* \u9690\u85CF\u6807\u9898\u4E0B\u65B9\u7684\u5206\u7C7B\u3001\u7B49\u7EA7\u548C\u6807\u7B7E\u4FE1\u606F\u3002 */
        .topic-list .link-bottom-line {
            display: none !important;
        }
        /* \u9690\u85CF\u53D1\u5E16\u4EBA\u5934\u50CF\u5217\u3002 */
        .topic-list tr > .posters {
            display: none !important;
        }
        /* \u6D3B\u52A8\u3001\u6D4F\u89C8\u91CF\u3001\u56DE\u590D\u56FA\u5B9A\u5728\u6700\u5DE6\u4FA7\uFF0C\u6807\u9898\u5217\u5360\u7528\u5269\u4F59\u7A7A\u95F4\u3002 */
        .topic-list {
            display: block !important;
            width: 100% !important;
            table-layout: fixed !important;
        }
        .list-container.--topic-list {
            margin-top: 0 !important;
        }
        .topic-list > thead,
        .topic-list > tbody {
            display: block !important;
            width: 100% !important;
        }
        .topic-list > thead > tr,
        .topic-list > tbody > tr.topic-list-item {
            display: grid !important;
            grid-template-columns: 72px 64px 64px minmax(0, 1fr) !important;
            min-height: 36px !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }
        .topic-list > tbody > tr.topic-list-item.agy-linux-topic-hidden {
            display: none !important;
        }
        .topic-list > thead > tr > .activity,
        .topic-list > tbody > tr.topic-list-item > .activity {
            grid-column: 1 !important;
            grid-row: 1 !important;
        }
        .topic-list > thead > tr > .views,
        .topic-list > tbody > tr.topic-list-item > .views {
            grid-column: 2 !important;
            grid-row: 1 !important;
        }
        .topic-list > thead > tr > .posts,
        .topic-list > tbody > tr.topic-list-item > .posts {
            grid-column: 3 !important;
            grid-row: 1 !important;
        }
        .topic-list > thead > tr > .default,
        .topic-list > tbody > tr.topic-list-item > .main-link {
            grid-column: 4 !important;
            grid-row: 1 !important;
            min-width: 0 !important;
            width: auto !important;
        }
        .topic-list > thead > tr > .activity,
        .topic-list > thead > tr > .views,
        .topic-list > thead > tr > .posts,
        .topic-list > tbody > tr.topic-list-item > .activity,
        .topic-list > tbody > tr.topic-list-item > .views,
        .topic-list > tbody > tr.topic-list-item > .posts {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: auto !important;
            min-width: 0 !important;
            height: 36px !important;
            padding: 4px 2px !important;
            box-sizing: border-box !important;
        }
        .topic-list > thead > tr > .default {
            display: block !important;
            height: 36px !important;
            min-height: 36px !important;
            padding: 4px 8px !important;
            box-sizing: border-box !important;
            align-content: center !important;
            overflow: hidden !important;
        }
        .topic-list > tbody > tr.topic-list-item > .main-link {
            display: flex !important;
            align-items: center !important;
            height: 36px !important;
            min-height: 36px !important;
            padding: 4px 8px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
        }
        .topic-list > tbody > tr.topic-list-item > .main-link .link-top-line {
            display: flex !important;
            flex: 1 1 auto !important;
            position: relative !important;
            align-items: center !important;
            min-width: 0 !important;
            height: 100% !important;
            padding-left: 43px !important;
            box-sizing: border-box !important;
            line-height: 1.2 !important;
            overflow: hidden !important;
        }
        .topic-list > tbody > tr.topic-list-item > .main-link .topic-statuses,
        .topic-list > tbody > tr.topic-list-item > .main-link .topic-post-badges {
            flex: 0 0 auto !important;
            display: inline-flex !important;
            align-items: center !important;
            height: 100% !important;
        }
        .topic-list > tbody > tr.topic-list-item > .main-link .raw-topic-link {
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }
        .topic-list > tbody > tr.topic-list-item > .main-link .agy-linux-topic-actions {
            position: absolute !important;
            left: 0 !important;
            top: 50% !important;
            width: 38px !important;
            margin: 0 !important;
            transform: translateY(-50%) !important;
        }
        @media (max-width: 900px) {
            #main-outlet > .welcome-banner .welcome-banner__search-menu {
                width: min(460px, calc(100vw - 180px)) !important;
            }
            .topic-list > thead > tr,
            .topic-list > tbody > tr.topic-list-item {
                grid-template-columns: 64px 56px 56px minmax(0, 1fr) !important;
            }
        }
        @media (max-width: 650px) {
            #main-outlet > .welcome-banner .welcome-banner__search-menu {
                width: min(360px, calc(100vw - 112px)) !important;
                top: 5px !important;
            }
            .topic-list > thead > tr,
            .topic-list > tbody > tr.topic-list-item {
                grid-template-columns: 58px 52px 48px minmax(0, 1fr) !important;
            }
        }
`;
    const SITE_RULES = [
      {
        // linux.do (Discourse)
        match: /(^|\.)linux\.do$/i,
        powerSavePreview: true,
        css: `${LINUX_DO_COMPACT_CSS}
                /* \u7EAF CSS \u9690\u85CF\u5DE6\u4FA7\u8FB9\u680F (\u4E0D\u70B9\u771F\u5B9E\u6298\u53E0\u6309\u94AE\uFF0C\u907F\u514D\u72B6\u6001\u88AB\u6301\u4E45\u5316) */
                :root { --d-sidebar-width: 0px !important; }
                #d-sidebar, .sidebar-wrapper { display: none !important; }
                #main-outlet-wrapper { grid-template-columns: minmax(0, 1fr) !important; gap: 0 !important; }
                /* \u56DE\u590D\u7F16\u8F91\u5668\uFF1A\u94B3\u5236\u9AD8\u5EA6 + \u9690\u85CF\u53F3\u4FA7 Markdown \u9884\u89C8\u5217\uFF0C\u7ED9\u8F93\u5165\u533A\u817E\u51FA\u7A7A\u95F4 */
                #reply-control.open {
                    height: min(60vh, 420px) !important;
                    max-height: calc(100vh - 8px) !important;
                }
                #reply-control.open .d-editor-preview-wrapper { display: none !important; }
                /* \u56DE\u590D/\u820D\u5F03\u6309\u94AE\u79FB\u5230\u8F93\u5165\u6846\u53F3\u4FA7\u7AD6\u6392 (\u5E95\u90E8\u6309\u94AE\u533A\u5728\u9884\u89C8\u7A97\u5185\u4F1A\u88AB\u88C1\u5207) */
                #reply-control.open .d-editor-textarea-wrapper {
                    margin-right: 96px !important;
                    margin-bottom: 14px !important; /* \u5E95\u90E8\u7559\u7A7A\u6321\uFF0C\u8F93\u5165\u6846\u4E0B\u8FB9\u7EBF\u4E0D\u518D\u8D34\u8FB9\u88AB\u88C1 */
                }
                #reply-control.open .save-or-cancel {
                    position: absolute !important;
                    right: 10px !important;
                    bottom: 64px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: stretch !important;
                    gap: 6px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    z-index: 30 !important;
                }
                #reply-control.open .save-or-cancel .btn { margin: 0 !important; }
            `
      }
    ];
    function getSiteRule(url) {
      try {
        const hostname = new URL(url).hostname;
        return SITE_RULES.find((r) => r.match.test(hostname)) || null;
      } catch (e) {
        return null;
      }
    }
    function shouldDirectLoad(url) {
      return isSameOrigin(url) || Boolean(getSiteRule(url)?.directLoad);
    }
    let clickTimer = null;
    let preheatTimer = null;
    let preheatLink = null;
    let previewContainer = null;
    let currentTargetUrl = "";
    let previewTabs = [];
    let activeTabId = null;
    let nextTabId = 1;
    let nextLoadToken = 1;
    let isSingleClickPreviewEnabled = options.clickMode ? options.clickMode() === "single" : loadSingleClickPreviewMode();
    let imageViewer = null;
    let bookmarkPanel = null;
    let bookmarkButtonRefreshToken = 0;
    let swallowNextClick = false;
    let swallowClickResetTimer = null;
    let pointerOpenedGesture = false;
    let pointerShieldTimer = null;
    let hiddenLinuxTopicIds = null;
    let linuxHiddenTopicStyle = null;
    let linuxTopicObserver = null;
    let linuxTopicClassObserver = null;
    let linuxObservedTopicList = null;
    let linuxTopicScanScheduled = false;
    const pendingLinuxTopicRows = /* @__PURE__ */ new Set();
    let linuxTopicEnhancementInstalled = false;
    let isPreviewMaximized = loadPreviewMaximizedState();
    let isParentPageSuspended = false;
    let parentActivityTaskToken = 0;
    let previewTabActivityTaskToken = 0;
    const cacheMap = /* @__PURE__ */ new Map();
    let lastEventTime = 0;
    const THROTTLE_LIMIT = 50;
    function loadBookmarks() {
      try {
        if (typeof GM_getValue === "function") {
          const v = GM_getValue(BOOKMARK_KEY, "[]");
          const list = typeof v === "string" ? JSON.parse(v) : v;
          return Array.isArray(list) ? list : [];
        }
      } catch (e) {
      }
      try {
        const list = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    }
    function saveBookmarks(list) {
      const s = JSON.stringify(list);
      try {
        if (typeof GM_setValue === "function") {
          GM_setValue(BOOKMARK_KEY, s);
        } else {
          localStorage.setItem(BOOKMARK_KEY, s);
        }
      } catch (e) {
        try {
          localStorage.setItem(BOOKMARK_KEY, s);
        } catch (error) {
        }
      }
      syncLinuxTopicBookmarkStates();
    }
    function loadHiddenLinuxTopicIds() {
      if (hiddenLinuxTopicIds) return hiddenLinuxTopicIds;
      let stored = null;
      try {
        if (typeof GM_getValue === "function") stored = GM_getValue(HIDDEN_TOPIC_KEY, "[]");
      } catch (e) {
      }
      if (stored === null) {
        try {
          stored = localStorage.getItem(HIDDEN_TOPIC_KEY);
        } catch (e) {
        }
      }
      try {
        const list = typeof stored === "string" ? JSON.parse(stored || "[]") : stored;
        hiddenLinuxTopicIds = new Set(Array.isArray(list) ? list.map(String) : []);
      } catch (e) {
        hiddenLinuxTopicIds = /* @__PURE__ */ new Set();
      }
      return hiddenLinuxTopicIds;
    }
    function syncLinuxHiddenTopicStyle() {
      if (!IS_TOP || !/(^|\.)linux\.do$/i.test(location.hostname)) return;
      if (!linuxHiddenTopicStyle || !linuxHiddenTopicStyle.isConnected) {
        linuxHiddenTopicStyle = document.getElementById(HIDDEN_TOPIC_STYLE_ID);
      }
      if (!linuxHiddenTopicStyle) {
        const styleParent = document.head || document.documentElement;
        if (!styleParent) return;
        linuxHiddenTopicStyle = document.createElement("style");
        linuxHiddenTopicStyle.id = HIDDEN_TOPIC_STYLE_ID;
        styleParent.appendChild(linuxHiddenTopicStyle);
      }
      const selectors = Array.from(loadHiddenLinuxTopicIds(), (topicId) => {
        if (!/^\d+$/.test(topicId)) return "";
        return `.topic-list .topic-list-item[data-topic-id="${topicId}"]`;
      }).filter(Boolean);
      linuxHiddenTopicStyle.textContent = selectors.length ? `${selectors.join(",\n")} { display: none !important; }` : "";
    }
    function saveHiddenLinuxTopicIds() {
      const list = Array.from(loadHiddenLinuxTopicIds());
      const s = JSON.stringify(list);
      try {
        if (typeof GM_setValue === "function") {
          GM_setValue(HIDDEN_TOPIC_KEY, s);
        } else {
          localStorage.setItem(HIDDEN_TOPIC_KEY, s);
        }
      } catch (e) {
        try {
          localStorage.setItem(HIDDEN_TOPIC_KEY, s);
        } catch (error) {
        }
      }
      syncLinuxHiddenTopicStyle();
    }
    function loadSingleClickPreviewMode() {
      let stored = false;
      try {
        if (typeof GM_getValue === "function") {
          stored = GM_getValue(SINGLE_CLICK_PREVIEW_KEY, false);
          return stored === true || stored === 1 || stored === "true";
        }
      } catch (e) {
      }
      try {
        stored = localStorage.getItem(SINGLE_CLICK_PREVIEW_KEY);
      } catch (e) {
      }
      return stored === true || stored === 1 || stored === "true";
    }
    function saveSingleClickPreviewMode(enabled) {
      try {
        if (typeof GM_setValue === "function") {
          GM_setValue(SINGLE_CLICK_PREVIEW_KEY, enabled);
          return;
        }
      } catch (e) {
      }
      try {
        localStorage.setItem(SINGLE_CLICK_PREVIEW_KEY, String(enabled));
      } catch (e) {
      }
    }
    function isBookmarked(url) {
      return loadBookmarks().some((b) => b.url === url);
    }
    function loadPreviewPosition() {
      let stored = null;
      try {
        if (typeof GM_getValue === "function") {
          stored = GM_getValue(PREVIEW_POSITION_KEY, null);
        }
      } catch (e) {
      }
      if (stored === null) {
        try {
          stored = localStorage.getItem(PREVIEW_POSITION_KEY);
        } catch (e) {
        }
      }
      try {
        const position = typeof stored === "string" ? JSON.parse(stored) : stored;
        if (position && Number.isFinite(position.left) && Number.isFinite(position.top)) {
          return position;
        }
      } catch (e) {
      }
      return null;
    }
    function savePreviewPosition(position) {
      const stored = JSON.stringify(position);
      try {
        if (typeof GM_setValue === "function") {
          GM_setValue(PREVIEW_POSITION_KEY, stored);
          return;
        }
      } catch (e) {
      }
      try {
        localStorage.setItem(PREVIEW_POSITION_KEY, stored);
      } catch (e) {
      }
    }
    function loadPreviewMaximizedState() {
      let stored = false;
      try {
        if (typeof GM_getValue === "function") {
          stored = GM_getValue(PREVIEW_MAXIMIZED_KEY, false);
          return stored === true || stored === 1 || stored === "true";
        }
      } catch (e) {
      }
      try {
        stored = localStorage.getItem(PREVIEW_MAXIMIZED_KEY);
      } catch (e) {
      }
      return stored === true || stored === 1 || stored === "true";
    }
    function savePreviewMaximizedState(maximized) {
      try {
        if (typeof GM_setValue === "function") {
          GM_setValue(PREVIEW_MAXIMIZED_KEY, maximized);
          return;
        }
      } catch (e) {
      }
      try {
        localStorage.setItem(PREVIEW_MAXIMIZED_KEY, String(maximized));
      } catch (e) {
      }
    }
    function formatTime(ts) {
      const d = new Date(ts);
      const p = (n) => n < 10 ? "0" + n : "" + n;
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    function armClickSwallow() {
      swallowNextClick = true;
      if (swallowClickResetTimer) clearTimeout(swallowClickResetTimer);
      swallowClickResetTimer = setTimeout(() => {
        swallowNextClick = false;
        swallowClickResetTimer = null;
      }, 500);
    }
    function getLinuxTopicInfo(row) {
      if (!row) return null;
      const topicId = String(row.dataset.topicId || "").trim();
      const link = row.querySelector("a.raw-topic-link[href]");
      const titleLine = link && link.closest(".link-top-line");
      if (!topicId || !link || !titleLine) return null;
      let url = "";
      try {
        const parsed = new URL(link.getAttribute("href"), location.origin);
        url = `${parsed.origin}${parsed.pathname}`;
      } catch (e) {
        return null;
      }
      return {
        topicId,
        url,
        title: (link.textContent || "").trim() || url,
        titleLine
      };
    }
    function syncLinuxTopicBookmarkStates() {
      if (!IS_TOP || !/(^|\.)linux\.do$/i.test(location.hostname)) return;
      const bookmarkedUrls = new Set(loadBookmarks().map((bookmark) => bookmark.url));
      document.querySelectorAll(".agy-linux-topic-actions").forEach((actions) => {
        const upButton = actions.querySelector(".agy-linux-topic-up");
        if (!upButton) return;
        const isActive = bookmarkedUrls.has(actions.dataset.topicUrl || "");
        upButton.classList.toggle("agy-is-bookmarked", isActive);
        upButton.setAttribute("aria-pressed", String(isActive));
        upButton.title = isActive ? "\u53D6\u6D88\u6536\u85CF\u6B64\u5E16\u5B50" : "\u6536\u85CF\u6B64\u5E16\u5B50";
        upButton.setAttribute("aria-label", upButton.title);
      });
    }
    function enhanceLinuxTopicRow(row, bookmarkedUrls, hiddenTopicIds) {
      const info = getLinuxTopicInfo(row);
      if (!info) return;
      const isHidden = hiddenTopicIds.has(info.topicId);
      row.classList.toggle("agy-linux-topic-hidden", isHidden);
      if (isHidden) return;
      let actions = row.querySelector(".agy-linux-topic-actions");
      if (actions && actions.dataset.agyTopicId !== info.topicId) {
        actions.remove();
        actions = null;
      }
      if (!actions) {
        actions = document.createElement("span");
        actions.className = "agy-linux-topic-actions";
        const upButton2 = document.createElement("button");
        upButton2.type = "button";
        upButton2.className = "agy-linux-topic-action agy-linux-topic-up";
        upButton2.dataset.action = "bookmark";
        upButton2.innerHTML = ICON_THUMBS_UP;
        const downButton = document.createElement("button");
        downButton.type = "button";
        downButton.className = "agy-linux-topic-action agy-linux-topic-down";
        downButton.dataset.action = "hide";
        downButton.title = "\u9690\u85CF\u6B64\u5E16\u5B50\uFF0C\u5237\u65B0\u540E\u4ECD\u4E0D\u663E\u793A";
        downButton.setAttribute("aria-label", downButton.title);
        downButton.innerHTML = ICON_THUMBS_DOWN;
        actions.appendChild(upButton2);
        actions.appendChild(downButton);
        info.titleLine.prepend(actions);
      }
      if (actions.dataset.agyTopicId !== info.topicId) actions.dataset.agyTopicId = info.topicId;
      if (actions.dataset.topicUrl !== info.url) actions.dataset.topicUrl = info.url;
      if (actions.dataset.topicTitle !== info.title) actions.dataset.topicTitle = info.title;
      const upButton = actions.querySelector(".agy-linux-topic-up");
      const isBookmarkedTopic = bookmarkedUrls.has(info.url);
      upButton.classList.toggle("agy-is-bookmarked", isBookmarkedTopic);
      upButton.setAttribute("aria-pressed", String(isBookmarkedTopic));
      upButton.title = isBookmarkedTopic ? "\u53D6\u6D88\u6536\u85CF\u6B64\u5E16\u5B50" : "\u6536\u85CF\u6B64\u5E16\u5B50";
      upButton.setAttribute("aria-label", upButton.title);
    }
    function collectLinuxTopicRows(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.matches(".topic-list-item[data-topic-id]")) pendingLinuxTopicRows.add(node);
      const containingRow = node.closest(".topic-list-item[data-topic-id]");
      if (containingRow) pendingLinuxTopicRows.add(containingRow);
      node.querySelectorAll(".topic-list-item[data-topic-id]").forEach((row) => {
        pendingLinuxTopicRows.add(row);
      });
    }
    function scanLinuxTopicRows() {
      linuxTopicScanScheduled = false;
      if (!pendingLinuxTopicRows.size) return;
      const bookmarkedUrls = new Set(loadBookmarks().map((bookmark) => bookmark.url));
      const hiddenTopicIds = loadHiddenLinuxTopicIds();
      const rows = Array.from(pendingLinuxTopicRows);
      pendingLinuxTopicRows.clear();
      rows.forEach((row) => {
        if (!row.isConnected) return;
        enhanceLinuxTopicRow(row, bookmarkedUrls, hiddenTopicIds);
      });
    }
    function scheduleLinuxTopicScan(node) {
      collectLinuxTopicRows(node);
      if (!pendingLinuxTopicRows.size) return;
      if (linuxTopicScanScheduled) return;
      linuxTopicScanScheduled = true;
      if (typeof queueMicrotask === "function") {
        queueMicrotask(scanLinuxTopicRows);
      } else {
        Promise.resolve().then(scanLinuxTopicRows);
      }
    }
    function installLinuxTopicEnhancement() {
      if (linuxTopicEnhancementInstalled) return;
      linuxTopicEnhancementInstalled = true;
      loadHiddenLinuxTopicIds();
      syncLinuxHiddenTopicStyle();
      document.addEventListener("pointerdown", function(e) {
        if (!e.target.closest || !e.target.closest(".agy-linux-topic-action")) return;
        e.preventDefault();
        e.stopImmediatePropagation();
      }, true);
      document.addEventListener("click", function(e) {
        const button = e.target.closest && e.target.closest(".agy-linux-topic-action");
        if (!button) return;
        const row = button.closest(".topic-list-item[data-topic-id]");
        const actions = button.closest(".agy-linux-topic-actions");
        if (!row || !actions) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        const topicId = String(actions.dataset.agyTopicId || "");
        const url = actions.dataset.topicUrl || "";
        const title = actions.dataset.topicTitle || url;
        if (button.dataset.action === "bookmark") {
          toggleBookmarkEntry(url, title);
          return;
        }
        if (button.dataset.action === "hide" && topicId) {
          loadHiddenLinuxTopicIds().add(topicId);
          saveHiddenLinuxTopicIds();
          row.classList.add("agy-linux-topic-hidden");
        }
      }, true);
      function handleLinuxTopicMutations(mutations) {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes") {
            collectLinuxTopicRows(mutation.target);
            return;
          }
          const containingRow = mutation.target.closest && mutation.target.closest(".topic-list-item[data-topic-id]");
          if (containingRow) pendingLinuxTopicRows.add(containingRow);
          mutation.addedNodes.forEach(collectLinuxTopicRows);
        });
        observeLinuxTopicListClasses();
        if (pendingLinuxTopicRows.size) scheduleLinuxTopicScan();
      }
      function handleLinuxTopicClassMutations(mutations) {
        const hiddenTopicIds = loadHiddenLinuxTopicIds();
        mutations.forEach((mutation) => {
          const row = mutation.target.matches && mutation.target.matches(".topic-list-item[data-topic-id]") ? mutation.target : null;
          if (!row) return;
          const topicId = String(row.dataset.topicId || "").trim();
          const shouldBeHidden = hiddenTopicIds.has(topicId);
          const hasHiddenClass = row.classList.contains("agy-linux-topic-hidden");
          const isMissingActions = !shouldBeHidden && !row.querySelector(".agy-linux-topic-actions");
          if (shouldBeHidden !== hasHiddenClass || isMissingActions) {
            pendingLinuxTopicRows.add(row);
          }
        });
        if (pendingLinuxTopicRows.size) scheduleLinuxTopicScan();
      }
      function observeLinuxTopicListClasses() {
        const topicList = document.querySelector(".topic-list");
        if (!topicList || topicList === linuxObservedTopicList) return;
        if (!linuxTopicClassObserver) {
          linuxTopicClassObserver = new MutationObserver(handleLinuxTopicClassMutations);
        } else {
          linuxTopicClassObserver.disconnect();
        }
        linuxObservedTopicList = topicList;
        linuxTopicClassObserver.observe(topicList, {
          subtree: true,
          attributes: true,
          attributeFilter: ["class"]
        });
      }
      function startObserver() {
        if (!document.documentElement || linuxTopicObserver) return;
        linuxTopicObserver = new MutationObserver(handleLinuxTopicMutations);
        linuxTopicObserver.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["data-topic-id", "href"]
        });
        syncLinuxHiddenTopicStyle();
        observeLinuxTopicListClasses();
        scheduleLinuxTopicScan(document.documentElement);
      }
      if (document.documentElement) {
        startObserver();
      } else {
        document.addEventListener("readystatechange", startObserver, { once: true });
      }
    }
    if (IS_TOP) {
      const style = document.createElement("style");
      style.textContent = `
        /* LDU ADAPTATION: host-page Linux Do layout is owned by the split app. */
        .agy-preview-container {
            position: fixed;
            width: ${WINDOW_WIDTH}px;
            height: ${WINDOW_HEIGHT}px;
            max-width: calc(100vw - ${WINDOW_MARGIN * 2}px);
            max-height: calc(100vh - ${WINDOW_MARGIN * 2}px);
            z-index: 10000000;
            background: #fdfdfd;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 16px;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18),
                        0 2px 8px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: scale(0.95) translate3d(0, 0, 0);
            transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                        transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
            box-sizing: border-box;
            contain: content;
        }
        .agy-preview-container.agy-animating {
            will-change: transform, opacity;
        }
        .agy-preview-container.agy-preview-visible {
            display: flex;
            opacity: 1;
            transform: scale(1) translate3d(0, 0, 0);
            pointer-events: auto;
        }
        .agy-preview-container.agy-instant-feedback {
            transition: none !important;
        }
        .agy-preview-container.agy-dragging {
            transition: none;
        }
        .agy-preview-container.agy-maximized {
            left: ${WINDOW_MARGIN}px !important;
            top: ${WINDOW_MARGIN}px !important;
            right: ${WINDOW_MARGIN}px !important;
            bottom: ${WINDOW_MARGIN}px !important;
            width: auto !important;
            height: auto !important;
            max-width: none !important;
            max-height: none !important;
            border-radius: 8px;
        }
        .agy-preview-container.agy-maximized .agy-preview-header {
            cursor: default;
        }
        @media (prefers-color-scheme: dark) {
            .agy-preview-container {
                background: #1c1c1e;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
            }
        }
        .agy-preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            background: linear-gradient(rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.015));
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            user-select: none;
            box-sizing: border-box;
            flex-shrink: 0;
            cursor: grab;
            touch-action: none;
            gap: 10px;
        }
        .agy-preview-container.agy-dragging .agy-preview-header {
            cursor: grabbing;
        }
        @media (prefers-color-scheme: dark) {
            .agy-preview-header {
                background: rgba(255, 255, 255, 0.03);
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            }
        }
        .agy-preview-tabs {
            display: flex;
            align-items: center;
            gap: 4px;
            flex: 1;
            min-width: 0;
            overflow-x: auto;
            scrollbar-width: none;
            cursor: grab;
        }
        .agy-preview-tabs::-webkit-scrollbar {
            display: none;
        }
        .agy-preview-tab {
            display: flex;
            align-items: center;
            gap: 5px;
            width: 150px;
            min-width: 100px;
            max-width: 180px;
            height: 28px;
            padding: 0 6px 0 9px;
            border: 1px solid transparent;
            border-radius: 6px;
            background: rgba(0, 0, 0, 0.035);
            color: #666;
            cursor: pointer;
            box-sizing: border-box;
            flex-shrink: 0;
        }
        .agy-preview-tab:hover {
            background: rgba(0, 122, 255, 0.08);
        }
        .agy-preview-tab.active {
            background: #fff;
            border-color: rgba(0, 122, 255, 0.22);
            color: #222;
        }
        .agy-preview-tab-title {
            min-width: 0;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 11px;
            font-weight: 500;
            line-height: 1;
        }
        .agy-preview-tab-close {
            width: 16px;
            height: 16px;
            padding: 0;
            border: 0;
            border-radius: 4px;
            background: transparent;
            color: #999;
            cursor: pointer;
            line-height: 16px;
            font-size: 11px;
            flex-shrink: 0;
        }
        .agy-preview-tab-close:hover {
            background: #ff3b30;
            color: #fff;
        }
        @media (prefers-color-scheme: dark) {
            .agy-preview-tab {
                background: rgba(255, 255, 255, 0.06);
                color: #aaa;
            }
            .agy-preview-tab.active {
                background: rgba(255, 255, 255, 0.13);
                border-color: rgba(10, 132, 255, 0.45);
                color: #f2f2f2;
            }
        }
        .agy-preview-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: default;
        }
        .agy-click-mode-toggle {
            position: relative;
            width: 28px;
            height: 16px;
            padding: 0;
            border: 1px solid rgba(0, 0, 0, 0.13);
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.1);
            cursor: pointer;
            flex-shrink: 0;
            transition: background 0.12s, border-color 0.12s;
        }
        .agy-click-mode-toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
            transition: transform 0.12s;
        }
        .agy-click-mode-toggle[aria-checked="true"] {
            border-color: #007aff;
            background: #007aff;
        }
        .agy-click-mode-toggle[aria-checked="true"]::after {
            transform: translateX(12px);
        }
        .agy-click-mode-toggle:focus-visible {
            outline: 2px solid rgba(0, 122, 255, 0.35);
            outline-offset: 2px;
        }
        @media (prefers-color-scheme: dark) {
            .agy-click-mode-toggle {
                border-color: rgba(255, 255, 255, 0.18);
                background: rgba(255, 255, 255, 0.14);
            }
            .agy-click-mode-toggle[aria-checked="true"] {
                border-color: #0a84ff;
                background: #0a84ff;
            }
        }
        .agy-preview-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            border-radius: 6px;
            font-size: 11px;
            color: #007aff;
            font-weight: 500;
            transition: background 0.15s, color 0.15s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .agy-preview-btn svg {
            display: block;
        }
        .agy-preview-btn:hover {
            background: rgba(0, 122, 255, 0.08);
        }
        .agy-preview-btn.agy-bm-active {
            color: #ff9500;
        }
        .agy-maximize-btn {
            width: 22px;
            height: 22px;
            padding: 0;
            border: none;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.05);
            color: #666;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .agy-maximize-btn:hover {
            background: rgba(0, 122, 255, 0.12);
            color: #007aff;
        }
        .agy-close-btn {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.05);
            color: #666;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            transition: background 0.15s, color 0.15s;
        }
        .agy-close-btn:hover {
            background: #ff3b30;
            color: #fff;
        }
        @media (prefers-color-scheme: dark) {
            .agy-maximize-btn,
            .agy-close-btn {
                background: rgba(255, 255, 255, 0.1);
                color: #bbb;
            }
            .agy-maximize-btn:hover {
                background: rgba(10, 132, 255, 0.2);
                color: #0a84ff;
            }
            .agy-close-btn:hover {
                background: #ff453a;
                color: #fff;
            }
        }
        .agy-preview-body {
            position: relative;
            flex: 1 1 0;
            min-height: 0;
            width: 100%;
            height: auto;
            overflow: hidden;
            background: #fff;
            box-sizing: border-box;
        }
        @media (prefers-color-scheme: dark) {
            .agy-preview-body {
                background: #1c1c1e;
            }
        }
        .agy-preview-pane {
            position: absolute;
            inset: 0;
            display: none;
            pointer-events: none;
            z-index: 0;
            contain: strict;
        }
        .agy-preview-pane.active {
            display: block;
            pointer-events: auto;
            z-index: 1;
        }
        .agy-preview-iframe {
            display: block;
            width: 100%;
            height: 100%;
            border: none;
            background: transparent;
        }
        .agy-loading-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(245, 247, 250, 0.7);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            transition: opacity 0.12s ease-out;
            z-index: 20;
            box-sizing: border-box;
        }
        .agy-loading-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            max-width: 80%;
            transform: translateY(clamp(70px, 10vh, 110px));
            box-sizing: border-box;
        }
        @media (prefers-color-scheme: dark) {
            .agy-loading-overlay {
                background: rgba(15, 15, 17, 0.68);
            }
        }
        .agy-spinner {
            width: 22px;
            height: 22px;
            border: 2.5px solid rgba(0, 122, 255, 0.16);
            border-top-color: #007aff;
            border-radius: 50%;
            animation: agy-spin 0.8s linear infinite;
            flex-shrink: 0;
        }
        .agy-loading-text {
            font-size: 13px;
            line-height: 1.5;
            color: #4b5563;
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
        }
        @media (prefers-color-scheme: dark) {
            .agy-loading-text {
                color: #aaa;
            }
        }
        @keyframes agy-spin {
            to { transform: rotate(360deg); }
        }
        /* \u72EC\u7ACB\u56FE\u7247\u67E5\u770B\u5668 (\u706F\u7BB1)\uFF0C\u4F4D\u4E8E\u9884\u89C8\u7A97\u4E4B\u4E0A\uFF0C\u5355\u72EC\u5F00\u5173 */
        .agy-image-viewer {
            position: fixed;
            inset: 0;
            z-index: 10000002;
            background: rgba(0, 0, 0, 0.78);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: zoom-out;
        }
        .agy-image-viewer img {
            max-width: 92vw;
            max-height: 92vh;
            border-radius: 8px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
            cursor: default;
        }
        .agy-viewer-close {
            position: absolute;
            top: 20px;
            right: 24px;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.16);
            color: #fff;
            border: none;
            cursor: pointer;
            font-size: 15px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .agy-viewer-close:hover {
            background: #ff3b30;
        }
        .agy-viewer-tip {
            position: absolute;
            bottom: 18px;
            left: 0; right: 0;
            text-align: center;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.65);
            font-family: system-ui, -apple-system, sans-serif;
            pointer-events: none;
        }
        /* \u4E66\u7B7E\u5217\u8868\u60AC\u6D6E\u9762\u677F (\u4F4D\u4E8E\u9884\u89C8\u7A97\u5DE6\u4FA7) */
        .agy-bookmark-panel {
            position: fixed;
            width: 250px;
            z-index: 10000001;
            background: #fdfdfd;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 12px;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
            .agy-bookmark-panel {
                background: #1c1c1e;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
            }
        }
        .agy-bm-header {
            padding: 4px 12px;
            color: #555;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .agy-bm-count {
            flex-shrink: 0;
            font-size: 12px;
            font-weight: 600;
            line-height: 1;
            transform: translateY(-1px);
            white-space: nowrap;
        }
        .agy-bm-search {
            min-width: 0;
            flex: 1;
            height: 22px;
            padding: 0 7px;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.85);
            color: #333;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
            font-size: 12px !important;
            font-weight: 400 !important;
            line-height: 20px !important;
            outline: none;
            box-sizing: border-box;
        }
        .agy-bm-search::placeholder {
            font-size: 12px !important;
            font-weight: 400 !important;
            opacity: 0.72;
        }
        .agy-bm-search:focus {
            border-color: rgba(0, 122, 255, 0.7);
            box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
        }
        @media (prefers-color-scheme: dark) {
            .agy-bm-header {
                color: #ccc;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }
            .agy-bm-search {
                border-color: rgba(255, 255, 255, 0.14);
                background: rgba(255, 255, 255, 0.08);
                color: #eee;
            }
        }
        .agy-bm-list {
            overflow-y: auto;
            overscroll-behavior: contain;
        }
        .agy-bm-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            cursor: pointer;
        }
        .agy-bm-item:hover {
            background: rgba(0, 122, 255, 0.08);
        }
        .agy-bm-item-title {
            flex: 1;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        @media (prefers-color-scheme: dark) {
            .agy-bm-item-title {
                color: #ddd;
            }
        }
        .agy-bm-item-del {
            width: 16px;
            height: 16px;
            border: none;
            border-radius: 4px;
            background: none;
            color: #bbb;
            font-size: 11px;
            line-height: 1;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .agy-bm-item:hover .agy-bm-item-del {
            display: flex;
        }
        .agy-bm-item-del:hover {
            background: #ff3b30;
            color: #fff;
        }
        .agy-bm-empty {
            padding: 16px 12px;
            font-size: 12px;
            color: #999;
            text-align: center;
        }
        .agy-linux-topic-actions {
            display: inline-flex !important;
            align-items: center !important;
            gap: 2px !important;
            margin-right: 5px !important;
            vertical-align: -3px !important;
            white-space: nowrap !important;
        }
        .agy-linux-topic-action {
            all: unset !important;
            width: 18px !important;
            height: 18px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 4px !important;
            color: var(--primary-medium, #777) !important;
            cursor: pointer !important;
            box-sizing: border-box !important;
        }
        .agy-linux-topic-action svg {
            display: block !important;
            pointer-events: none !important;
        }
        .agy-linux-topic-up:hover,
        .agy-linux-topic-up.agy-is-bookmarked {
            color: #28a745 !important;
            background: rgba(40, 167, 69, 0.1) !important;
        }
        .agy-linux-topic-down:hover {
            color: #e5484d !important;
            background: rgba(229, 72, 77, 0.1) !important;
        }
        .agy-linux-topic-action:focus-visible {
            outline: 2px solid rgba(0, 122, 255, 0.45) !important;
            outline-offset: 1px !important;
        }
        .topic-list-item.agy-linux-topic-hidden {
            display: none !important;
        }
        `;
      const styleParent = document.head || document.documentElement;
      if (styleParent) {
        styleParent.appendChild(style);
      } else {
        document.addEventListener("readystatechange", function appendStyle() {
          const parent = document.head || document.documentElement;
          if (!parent) return;
          document.removeEventListener("readystatechange", appendStyle);
          parent.appendChild(style);
        });
      }
    }
    if (IS_TOP) {
      window.addEventListener("pointerdown", function(e) {
        if (e.target.closest && e.target.closest(".agy-linux-topic-action")) return;
        const closeButton = e.target.closest && e.target.closest(".agy-close-btn");
        if (closeButton && previewContainer && previewContainer.contains(closeButton)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          destroyPreview();
          armClickSwallow();
          return;
        }
        const tabCloseButton = e.target.closest && e.target.closest(".agy-preview-tab-close");
        if (tabCloseButton && previewContainer && previewContainer.contains(tabCloseButton)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const tabElement2 = tabCloseButton.closest(".agy-preview-tab");
          const tabId = tabElement2 && Number(tabElement2.dataset.tabId);
          if (Number.isFinite(tabId)) closePreviewTab(tabId);
          armClickSwallow();
          return;
        }
        const tabElement = e.target.closest && e.target.closest(".agy-preview-tab");
        if (e.button === 0 && tabElement && previewContainer && previewContainer.contains(tabElement)) {
          const tabId = Number(tabElement.dataset.tabId);
          if (Number.isFinite(tabId)) activatePreviewTab(tabId);
        }
        if (imageViewer) {
          if (e.target === imageViewer || e.target.closest && e.target.closest(".agy-viewer-close")) {
            closeImageViewer();
            armClickSwallow();
          }
          return;
        }
        if (bookmarkPanel && bookmarkPanel.contains(e.target)) return;
        if (previewContainer && !previewContainer.contains(e.target)) {
          const outsideLink = e.target.closest && e.target.closest("a");
          if (isPreviewableLink(outsideLink)) return;
          destroyPreview();
          armClickSwallow();
        }
      }, true);
      window.addEventListener("pointerdown", function(e) {
        if (!isPreviewEnabled()) return;
        if (e.detail !== 2 || e.button !== 0) return;
        if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
        }
        if (isSingleClickPreviewEnabled) return;
        if (imageViewer) return;
        const link = e.target.closest && e.target.closest("a");
        if (!isPreviewableLink(link)) return;
        pointerOpenedGesture = true;
        openLinkInPreview(link);
      }, true);
      document.addEventListener("click", function(e) {
        if (swallowNextClick) {
          swallowNextClick = false;
          if (swallowClickResetTimer) {
            clearTimeout(swallowClickResetTimer);
            swallowClickResetTimer = null;
          }
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, true);
      window.addEventListener("resize", function() {
        if (!previewContainer) return;
        if (isPreviewMaximized) {
          applyPreviewMaximizedState();
          closeBookmarkPanel();
          return;
        }
        const rect = previewContainer.getBoundingClientRect();
        const position = clampPreviewPosition(rect.left, rect.top, previewContainer);
        applyPreviewPosition(previewContainer, position);
        savePreviewPosition(position);
        closeBookmarkPanel();
      });
      window.addEventListener("message", function(e) {
        const data = e.data;
        if (!data || !Number.isFinite(data.agyPreviewToken)) return;
        const tab = previewTabs.find((item) => item.iframe && e.source === item.iframe.contentWindow && item.loadToken === data.agyPreviewToken);
        if (!tab) return;
        if (typeof data.agyPreviewTitle === "string" && data.agyPreviewTitle.trim()) {
          updatePreviewTabTitle(tab, data.agyPreviewTitle);
        }
        if (data.agyPreviewContentReady === true) {
          revealLoadedPreviewTab(tab, tab.loadToken, tab.url);
        }
        if (data.agyPreviewHistoryDirection === -1 || data.agyPreviewHistoryDirection === 1) {
          if (tab.id === activeTabId) movePreviewHistory(tab, data.agyPreviewHistoryDirection);
        }
        if (data.agyPreviewRefresh === true && tab.id === activeTabId) {
          refreshPreviewTab(tab);
        }
        if (typeof data.agyPreviewNavigate === "string" && /^https?:/i.test(data.agyPreviewNavigate)) {
          navigatePreview(data.agyPreviewNavigate, tab.id);
        }
      });
      document.addEventListener("visibilitychange", function() {
        if (previewContainer) syncPreviewTabActivity();
      });
    }
    document.addEventListener("click", handleLinkClick, true);
    document.addEventListener("dblclick", handleLinkDblClick, true);
    if (IS_TOP) {
      document.addEventListener("keydown", function(e) {
        if (previewContainer && isPreviewRefreshKey(e)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (!e.repeat) refreshPreviewTab(getActiveTab());
          return;
        }
        if (e.key === "Escape" || e.keyCode === 27) {
          if (imageViewer) {
            closeImageViewer();
          } else if (bookmarkPanel) {
            closeBookmarkPanel();
          } else if (previewContainer) {
            destroyPreview();
          }
          return;
        }
        if (!previewContainer || e.key !== "ArrowLeft" && e.key !== "ArrowRight" || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey || e.isComposing || isEditableKeyboardTarget(e.target)) return;
        const tab = getActiveTab();
        if (!tab) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        movePreviewHistory(tab, e.key === "ArrowLeft" ? -1 : 1);
      }, true);
    }
    function isEditableKeyboardTarget(target) {
      return Boolean(target && target.closest && target.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""], .CodeMirror, .monaco-editor'
      ));
    }
    function isPreviewableLink(link) {
      if (!isPreviewEnabled()) return false;
      if (!link || link.closest(".agy-preview-container")) return false;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("javascript:") || href.startsWith("#") || href === "") {
        return false;
      }
      if (!/^https?:/i.test(link.href)) return false;
      return options.isPreviewableUrl ? options.isPreviewableUrl(link.href, link) : true;
    }
    function isImageUrl(url) {
      try {
        return /\.(png|jpe?g|gif|webp|avif|bmp|ico|svg)$/i.test(new URL(url).pathname);
      } catch (e) {
        return false;
      }
    }
    function isImageResponse(response) {
      return /content-type:\s*image\//i.test(response.responseHeaders || "");
    }
    function showImageViewer(url) {
      closeImageViewer();
      imageViewer = document.createElement("div");
      imageViewer.className = "agy-image-viewer";
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      const closeBtn = document.createElement("button");
      closeBtn.className = "agy-viewer-close";
      closeBtn.innerHTML = ICON_CLOSE;
      closeBtn.title = "\u5173\u95ED\u56FE\u7247 (Esc)";
      const tip = document.createElement("div");
      tip.className = "agy-viewer-tip";
      tip.textContent = "\u70B9\u51FB\u7A7A\u767D\u5904\u6216\u6309 Esc \u5173\u95ED";
      imageViewer.appendChild(img);
      imageViewer.appendChild(closeBtn);
      imageViewer.appendChild(tip);
      document.body.appendChild(imageViewer);
    }
    function closeImageViewer() {
      if (!imageViewer) return;
      const v = imageViewer;
      imageViewer = null;
      v.style.setProperty("visibility", "hidden", "important");
      v.style.setProperty("display", "none", "important");
      v.style.setProperty("pointer-events", "none", "important");
      v.style.setProperty("transition", "none", "important");
      scheduleHeavyCleanup(() => {
        const img = v.querySelector("img");
        if (img) img.removeAttribute("src");
        if (v.parentNode) v.parentNode.removeChild(v);
      });
    }
    function getPreviewTitle() {
      const tab = getActiveTab();
      try {
        const t = tab && tab.iframe && tab.iframe.contentDocument && tab.iframe.contentDocument.title;
        if (t && t.trim()) return t.trim();
      } catch (e) {
      }
      try {
        const u = new URL(currentTargetUrl);
        return u.hostname + u.pathname;
      } catch (e) {
        return currentTargetUrl;
      }
    }
    function toggleBookmarkEntry(url, title, btn) {
      if (!url) return;
      const list = loadBookmarks();
      const idx = list.findIndex((b) => b.url === url);
      if (idx >= 0) {
        list.splice(idx, 1);
        saveBookmarks(list);
      } else {
        list.unshift({
          url,
          title: title || url,
          time: Date.now()
        });
        saveBookmarks(list);
        if (btn) {
          btn.innerHTML = ICON_CHECK;
          btn.style.color = "#34c759";
          setTimeout(() => {
            btn.style.color = "";
            updateBookmarkButtonState();
          }, 700);
        }
      }
      updateBookmarkButtonState();
      if (bookmarkPanel) renderBookmarkList();
    }
    function toggleBookmark(btn) {
      if (!currentTargetUrl) return;
      toggleBookmarkEntry(currentTargetUrl, getPreviewTitle(), btn);
    }
    function updateBookmarkButtonState() {
      if (!previewContainer) return;
      const btn = previewContainer.querySelector(".agy-bm-add-btn");
      if (!btn) return;
      if (isBookmarked(currentTargetUrl)) {
        btn.innerHTML = ICON_BOOKMARK_FILLED;
        btn.classList.add("agy-bm-active");
        btn.title = "\u53D6\u6D88\u6536\u85CF";
      } else {
        btn.innerHTML = ICON_BOOKMARK;
        btn.classList.remove("agy-bm-active");
        btn.title = "\u6536\u85CF\u5F53\u524D\u9875\u9762";
      }
    }
    function scheduleBookmarkButtonStateUpdate(tabId) {
      const refreshToken = ++bookmarkButtonRefreshToken;
      cleanupAfterNextPaint(() => {
        if (refreshToken !== bookmarkButtonRefreshToken || activeTabId !== tabId) return;
        updateBookmarkButtonState();
      });
    }
    function renderBookmarkList() {
      if (!bookmarkPanel) return;
      const listEl = bookmarkPanel.querySelector(".agy-bm-list");
      const countEl = bookmarkPanel.querySelector(".agy-bm-count");
      const searchEl = bookmarkPanel.querySelector(".agy-bm-search");
      if (!listEl) return;
      const list = loadBookmarks();
      const keyword = searchEl ? searchEl.value.trim().toLocaleLowerCase() : "";
      const filteredList = keyword ? list.filter((bookmark) => {
        const title = (bookmark.title || "").toLocaleLowerCase();
        const url = (bookmark.url || "").toLocaleLowerCase();
        return title.includes(keyword) || url.includes(keyword);
      }) : list;
      if (countEl) {
        countEl.textContent = keyword ? `\u4E66\u7B7E (${filteredList.length}/${list.length})` : `\u4E66\u7B7E (${list.length})`;
      }
      listEl.textContent = "";
      if (!filteredList.length) {
        const empty = document.createElement("div");
        empty.className = "agy-bm-empty";
        empty.textContent = list.length ? "\u6CA1\u6709\u5339\u914D\u7684\u4E66\u7B7E" : "\u6682\u65E0\u4E66\u7B7E";
        listEl.appendChild(empty);
        return;
      }
      filteredList.forEach((b) => {
        const item = document.createElement("div");
        item.className = "agy-bm-item";
        item.title = `\u6536\u85CF\u4E8E ${formatTime(b.time)}
${b.url}`;
        const titleSpan = document.createElement("span");
        titleSpan.className = "agy-bm-item-title";
        titleSpan.textContent = b.title || b.url;
        const delBtn = document.createElement("button");
        delBtn.className = "agy-bm-item-del";
        delBtn.innerHTML = ICON_TRASH;
        delBtn.title = "\u5220\u9664\u6B64\u4E66\u7B7E";
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const latest = loadBookmarks().filter((x) => x.url !== b.url);
          saveBookmarks(latest);
          renderBookmarkList();
          updateBookmarkButtonState();
        });
        item.appendChild(titleSpan);
        item.appendChild(delBtn);
        item.addEventListener("click", () => {
          navigatePreview(b.url, activeTabId, { keepBookmarkPanel: true });
        });
        listEl.appendChild(item);
      });
    }
    function toggleBookmarkPanel() {
      if (bookmarkPanel) {
        closeBookmarkPanel();
        return;
      }
      if (!previewContainer) return;
      bookmarkPanel = document.createElement("div");
      bookmarkPanel.className = "agy-bookmark-panel";
      const header = document.createElement("div");
      header.className = "agy-bm-header";
      const count = document.createElement("span");
      count.className = "agy-bm-count";
      const search = document.createElement("input");
      search.className = "agy-bm-search";
      search.type = "search";
      search.placeholder = "\u641C\u7D22\u6807\u9898\u6216\u7F51\u5740";
      search.setAttribute("aria-label", "\u641C\u7D22\u4E66\u7B7E\u6807\u9898\u6216\u7F51\u5740");
      search.addEventListener("input", renderBookmarkList);
      search.addEventListener("click", (e) => e.stopPropagation());
      header.appendChild(count);
      header.appendChild(search);
      const listEl = document.createElement("div");
      listEl.className = "agy-bm-list";
      bookmarkPanel.appendChild(header);
      bookmarkPanel.appendChild(listEl);
      document.body.appendChild(bookmarkPanel);
      const rect = previewContainer.getBoundingClientRect();
      let left = rect.left - 250 - 8;
      if (left < 8) left = rect.right + 8;
      if (left + 250 > window.innerWidth - 8) left = Math.max(8, window.innerWidth - 258);
      bookmarkPanel.style.left = `${left}px`;
      bookmarkPanel.style.top = `${rect.top}px`;
      bookmarkPanel.style.maxHeight = `${rect.height}px`;
      renderBookmarkList();
    }
    function closeBookmarkPanel() {
      if (!bookmarkPanel) return;
      const p = bookmarkPanel;
      bookmarkPanel = null;
      if (p.parentNode) p.parentNode.removeChild(p);
    }
    function setCache(url, entry) {
      entry.size = (entry.html ? entry.html.length : 0) + (entry.rawHtml ? entry.rawHtml.length : 0);
      const now = Date.now();
      for (const [k, v] of cacheMap) {
        if (v.status !== "loading" && now - v.time > CACHE_EXPIRE_TIME) {
          cacheMap.delete(k);
        }
      }
      if (cacheMap.has(url)) cacheMap.delete(url);
      cacheMap.set(url, entry);
      let totalBytes = 0;
      for (const v of cacheMap.values()) totalBytes += v.size || 0;
      while (cacheMap.size > CACHE_MAX_ENTRIES || totalBytes > CACHE_MAX_BYTES) {
        const protectedUrls = new Set(previewTabs.map((tab) => tab.url));
        protectedUrls.add(url);
        const oldestKey = Array.from(cacheMap.keys()).find((key) => !protectedUrls.has(key));
        if (!oldestKey) break;
        const old = cacheMap.get(oldestKey);
        totalBytes -= old && old.size || 0;
        if (old && old.xhr) {
          try {
            old.xhr.abort();
          } catch (e) {
          }
        }
        cacheMap.delete(oldestKey);
      }
    }
    function ensurePreparedCacheEntry(url, entry) {
      if (!entry || entry.status !== "done") return null;
      if (!entry.html && typeof entry.rawHtml === "string") {
        entry.html = prepareDynamicHtml(entry.rawHtml, url, TOKEN_PLACEHOLDER);
        entry.rawHtml = null;
        entry.size = entry.html.length;
      }
      return entry.html;
    }
    function schedulePreparation(url, entry) {
      const run = () => {
        if (cacheMap.get(url) !== entry) return;
        ensurePreparedCacheEntry(url, entry);
      };
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(run, { timeout: 2e3 });
      } else {
        setTimeout(run, 150);
      }
    }
    function handleMouseOverPreheat(e) {
      if (!isPreviewEnabled()) return;
      const link = e.target.closest("a");
      if (!isPreviewableLink(link)) return;
      if (preheatLink === link) return;
      const now = Date.now();
      if (now - lastEventTime < THROTTLE_LIMIT) return;
      lastEventTime = now;
      if (preheatLink) {
        cancelPreheat(preheatLink.href);
      }
      preheatLink = link;
      link.addEventListener("mouseleave", handleMouseLeavePreheat, { once: true });
      preheatTimer = setTimeout(() => {
        prefetchUrl(link.href);
      }, PREHEAT_DELAY);
    }
    function handleMouseLeavePreheat() {
      if (preheatTimer) {
        clearTimeout(preheatTimer);
        preheatTimer = null;
      }
      if (preheatLink) {
        cancelPreheat(preheatLink.href);
        preheatLink = null;
      }
    }
    function prefetchUrl(url) {
      const cached = cacheMap.get(url);
      if (cached && cached.status === "loading") return;
      if (cached && Date.now() - cached.time < CACHE_EXPIRE_TIME) {
        return;
      }
      if (shouldDirectLoad(url) || isImageUrl(url)) return;
      const xhr = GM_xmlhttpRequest({
        method: "GET",
        url,
        timeout: 1e4,
        onload: function(response) {
          if (response.status >= 200 && response.status < 400) {
            const entry = cacheMap.get(url);
            if (!entry || entry.xhr !== xhr) return;
            if (isImageResponse(response)) {
              entry.status = "image";
              entry.html = "";
              entry.rawHtml = null;
              entry.size = 0;
            } else {
              entry.status = "done";
              entry.rawHtml = response.responseText;
              entry.html = null;
              entry.size = response.responseText.length;
            }
            entry.xhr = null;
            entry.time = Date.now();
            const waitingTabs = previewTabs.filter((tab) => isTabLoadCurrent(tab, tab.loadToken, url) && tab.loadState === "waiting-cache");
            waitingTabs.forEach((tab) => {
              if (entry.status === "image") {
                tab.loadState = "image";
                hideLoadingBar(tab.loadingBar, tab);
                if (tab.id === activeTabId) showImageViewer(url);
              } else {
                const preparedHtml = ensurePreparedCacheEntry(url, entry);
                if (preparedHtml) renderFetchedDynamicPage(tab, preparedHtml, url, tab.loadingBar, tab.loadToken);
              }
            });
            if (entry.status === "done" && !entry.html) {
              schedulePreparation(url, entry);
            }
          }
        },
        onerror: function() {
          const entry = cacheMap.get(url);
          if (!entry || entry.xhr !== xhr) return;
          previewTabs.filter((tab) => isTabLoadCurrent(tab, tab.loadToken, url) && tab.loadState === "waiting-cache").forEach((tab) => showError(tab, "\u9884\u52A0\u8F7D\u7F51\u7EDC\u8BF7\u6C42\u51FA\u9519"));
          cacheMap.delete(url);
        }
      });
      setCache(url, {
        status: "loading",
        html: "",
        xhr,
        time: Date.now()
      });
    }
    function cancelPreheat(url) {
      const cached = cacheMap.get(url);
      const isNeededByPreview = previewTabs.some((tab) => tab.url === url && (tab.loadState === "loading" || tab.loadState === "waiting-cache"));
      if (cached && cached.status === "loading" && !isNeededByPreview) {
        if (cached.xhr) cached.xhr.abort();
        cacheMap.delete(url);
      }
    }
    function frameNavigate(url) {
      window.location.href = url;
    }
    function openLinkNormally(link) {
      const target = link.getAttribute("target");
      if (previewContainer) destroyPreview();
      if (IS_TOP && target === "_blank") {
        window.open(link.href, "_blank");
      } else {
        frameNavigate(link.href);
      }
    }
    function openLinkInPreview(link) {
      if (!IS_TOP) {
        frameNavigate(link.href);
        return;
      }
      if (isImageUrl(link.href)) {
        showImageViewer(link.href);
        return;
      }
      if (previewContainer) {
        addPreviewTab(link.href);
        return;
      }
      currentTargetUrl = link.href;
      showPreviewWindow(link, link.href);
    }
    function runLinkAction(link, shouldPreview) {
      if (!link || !link.isConnected) return;
      if (shouldPreview) {
        openLinkInPreview(link);
      } else {
        openLinkNormally(link);
      }
    }
    function shieldPreviewFromDoubleClick(link) {
      if (!previewContainer || !link || !link.isConnected) return;
      const linkRect = link.getBoundingClientRect();
      const winRect = previewContainer.getBoundingClientRect();
      const overlaps = !(linkRect.right < winRect.left || linkRect.left > winRect.right || linkRect.bottom < winRect.top || linkRect.top > winRect.bottom);
      if (!overlaps) return;
      const container = previewContainer;
      container.style.pointerEvents = "none";
      if (pointerShieldTimer) clearTimeout(pointerShieldTimer);
      pointerShieldTimer = setTimeout(() => {
        pointerShieldTimer = null;
        if (container === previewContainer) container.style.pointerEvents = "";
      }, 500);
    }
    function handleLinkClick(e) {
      if (!isPreviewEnabled()) return;
      syncClickMode();
      if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
        return;
      }
      const link = e.target.closest("a");
      if (!isPreviewableLink(link)) return;
      if (link.closest(".agy-preview-container")) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("javascript:") || href.startsWith("#") || href === "") {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (e.detail < 2) {
        if (clickTimer) clearTimeout(clickTimer);
        const shouldPreview = isSingleClickPreviewEnabled;
        const delay = shouldPreview && IS_TOP ? SINGLE_CLICK_PREVIEW_DELAY : CLICK_DELAY;
        clickTimer = setTimeout(() => {
          clickTimer = null;
          runLinkAction(link, shouldPreview);
          if (shouldPreview) shieldPreviewFromDoubleClick(link);
        }, delay);
      } else if (e.detail >= 2) {
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
        }
        if (e.detail === 2) {
          if (pointerOpenedGesture) {
            pointerOpenedGesture = false;
            return;
          }
          runLinkAction(link, !isSingleClickPreviewEnabled);
        }
      }
    }
    function handleLinkDblClick(e) {
      if (!isPreviewEnabled()) return;
      pointerOpenedGesture = false;
      if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
        return;
      }
      const link = e.target.closest("a");
      if (!isPreviewableLink(link)) return;
      e.preventDefault();
      e.stopPropagation();
    }
    function cleanupAfterNextPaint(cleanup) {
      if (pageVisibilityController.getNativeVisibilityState() !== "visible") {
        setTimeout(cleanup, 0);
        return;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(cleanup);
      });
    }
    function runAfterInteractionPaint(task) {
      cleanupAfterNextPaint(() => {
        try {
          if (window.scheduler && typeof window.scheduler.postTask === "function") {
            const scheduled = window.scheduler.postTask(task, { priority: "background" });
            if (scheduled && typeof scheduled.catch === "function") {
              scheduled.catch(() => {
              });
            }
            return;
          }
        } catch (e) {
        }
        setTimeout(task, 0);
      });
    }
    function scheduleHeavyCleanup(cleanup) {
      cleanupAfterNextPaint(() => {
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(cleanup, { timeout: 250 });
        } else {
          setTimeout(cleanup, 0);
        }
      });
    }
    function shouldSuspendParentPage() {
      return Boolean(
        previewContainer && getSiteRule(location.href)?.powerSavePreview
      );
    }
    function applyParentPageActivity() {
      const shouldSuspend = shouldSuspendParentPage();
      if (shouldSuspend === isParentPageSuspended) return;
      if (pageVisibilityController.setSuspended(shouldSuspend, { deferNotification: true })) {
        isParentPageSuspended = shouldSuspend;
      }
    }
    function scheduleParentPageActivity() {
      const taskToken = ++parentActivityTaskToken;
      runAfterInteractionPaint(() => {
        if (taskToken !== parentActivityTaskToken) return;
        applyParentPageActivity();
      });
    }
    function postPreviewTabActivity(tab, isActive) {
      if (!tab || !tab.iframe || !tab.iframe.contentWindow || tab.closed) return;
      try {
        tab.iframe.contentWindow.postMessage({
          agyPreviewActivity: true,
          agyPreviewActive: Boolean(isActive),
          agyPreviewToken: tab.loadToken
        }, "*");
      } catch (e) {
      }
    }
    function isPreviewTabActive(tab) {
      return Boolean(
        tab && tab.id === activeTabId && pageVisibilityController.getNativeVisibilityState() === "visible"
      );
    }
    function syncPreviewTabActivity() {
      previewTabs.forEach((tab) => postPreviewTabActivity(tab, isPreviewTabActive(tab)));
    }
    function schedulePreviewTabActivity() {
      const taskToken = ++previewTabActivityTaskToken;
      runAfterInteractionPaint(() => {
        if (taskToken !== previewTabActivityTaskToken) return;
        syncPreviewTabActivity();
      });
    }
    function destroyPreview() {
      if (!previewContainer) return;
      const containerToRemove = previewContainer;
      const tabsToDispose = previewTabs.slice();
      const cachedLoadsToAbort = /* @__PURE__ */ new Map();
      tabsToDispose.forEach((tab) => {
        tab.closed = true;
        tab.loadToken = nextLoadToken++;
        const cached = cacheMap.get(tab.url);
        if (cached && cached.status === "loading") cachedLoadsToAbort.set(tab.url, cached);
      });
      containerToRemove.style.setProperty("visibility", "hidden", "important");
      containerToRemove.style.setProperty("display", "none", "important");
      containerToRemove.style.setProperty("opacity", "0", "important");
      containerToRemove.style.setProperty("pointer-events", "none", "important");
      containerToRemove.style.setProperty("transition", "none", "important");
      previewContainer = null;
      currentTargetUrl = "";
      previewTabs = [];
      activeTabId = null;
      previewTabActivityTaskToken += 1;
      scheduleParentPageActivity();
      closeBookmarkPanel();
      cleanupAfterNextPaint(() => {
        tabsToDispose.forEach((tab) => releasePreviewTabResources(tab));
        cachedLoadsToAbort.forEach((cached, url) => {
          const isStillNeeded = previewTabs.some((tab) => tab.url === url && (tab.loadState === "loading" || tab.loadState === "waiting-cache"));
          if (isStillNeeded) return;
          if (cached.xhr) {
            try {
              cached.xhr.abort();
            } catch (e) {
            }
          }
          if (cacheMap.get(url) === cached) {
            cacheMap.delete(url);
          }
        });
        if (containerToRemove.parentNode) {
          containerToRemove.parentNode.removeChild(containerToRemove);
        }
      });
    }
    function clearContentReadyTimer(tab) {
      if (!tab || !tab.contentReadyTimer) return;
      clearTimeout(tab.contentReadyTimer);
      tab.contentReadyTimer = null;
    }
    function showLoadingBar(tab) {
      if (tab?.pane) tab.pane.setAttribute("aria-busy", "false");
      if (tab) tab.loadingBar = null;
      return null;
    }
    function createErrorBar(tab, message) {
      if (!tab?.pane) return null;
      const bar = document.createElement("div");
      bar.className = "agy-loading-overlay";
      bar.setAttribute("role", "status");
      bar.setAttribute("aria-live", "polite");
      bar.innerHTML = `
            <div class="agy-loading-card">
                <div class="agy-loading-text"></div>
            </div>
        `;
      const textNode = bar.querySelector(".agy-loading-text");
      if (textNode) {
        textNode.textContent = `\u52A0\u8F7D\u51FA\u9519: ${message}`;
        textNode.style.color = "#ff3b30";
      }
      tab.pane.appendChild(bar);
      tab.loadingBar = bar;
      return bar;
    }
    function hideLoadingBar(bar, tab) {
      clearContentReadyTimer(tab);
      if (tab && tab.pane) tab.pane.setAttribute("aria-busy", "false");
      const b = bar || tab && tab.loadingBar;
      if (!b) return;
      if (tab && tab.loadingBar === b) tab.loadingBar = null;
      b.style.opacity = "0";
      setTimeout(() => {
        if (b.parentNode) b.parentNode.removeChild(b);
      }, 130);
    }
    function getFallbackTabTitle(url) {
      try {
        const parsed = new URL(url);
        const path = parsed.pathname === "/" ? "" : parsed.pathname;
        return `${parsed.hostname}${path}`;
      } catch (e) {
        return url;
      }
    }
    function getActiveTab() {
      return previewTabs.find((tab) => tab.id === activeTabId) || null;
    }
    function getPreviewTab(tabId) {
      return previewTabs.find((tab) => tab.id === tabId) || null;
    }
    function createPreviewTab(url) {
      return {
        id: nextTabId++,
        url,
        title: getFallbackTabTitle(url),
        pane: null,
        iframe: null,
        request: null,
        loadingBar: null,
        contentReadyTimer: null,
        loadToken: nextLoadToken++,
        loadState: "idle",
        historyEntries: [url],
        historyIndex: 0,
        element: null,
        titleElement: null,
        closed: false
      };
    }
    function mountPreviewTab(tab) {
      if (!previewContainer || !tab || tab.pane) return;
      const body = previewContainer.querySelector(".agy-preview-body");
      if (!body) return;
      const pane = document.createElement("div");
      pane.className = "agy-preview-pane";
      pane.dataset.tabId = String(tab.id);
      pane.setAttribute("role", "tabpanel");
      const iframe = document.createElement("iframe");
      iframe.className = "agy-preview-iframe";
      iframe.name = `${PREVIEW_FRAME_PREFIX}${tab.loadToken}`;
      pane.appendChild(iframe);
      body.appendChild(pane);
      tab.pane = pane;
      tab.iframe = iframe;
    }
    function mountPreviewTabElement(tab) {
      if (!previewContainer || !tab || tab.element) return;
      const tabsElement = previewContainer.querySelector(".agy-preview-tabs");
      if (!tabsElement) return;
      const tabElement = document.createElement("div");
      tabElement.className = "agy-preview-tab";
      tabElement.dataset.tabId = String(tab.id);
      tabElement.setAttribute("role", "tab");
      const title = document.createElement("span");
      title.className = "agy-preview-tab-title";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "agy-preview-tab-close";
      close.innerHTML = ICON_CLOSE;
      close.title = "\u5173\u95ED\u6B64\u6807\u7B7E\u9875";
      close.setAttribute("aria-label", "\u5173\u95ED\u6B64\u6807\u7B7E\u9875");
      close.addEventListener("click", (e) => {
        e.stopPropagation();
        closePreviewTab(tab.id);
      });
      tabElement.appendChild(title);
      tabElement.appendChild(close);
      tabElement.addEventListener("click", () => activatePreviewTab(tab.id));
      tabsElement.appendChild(tabElement);
      tab.element = tabElement;
      tab.titleElement = title;
      updatePreviewTabElement(tab);
    }
    function updatePreviewTabElement(tab) {
      if (!tab || !tab.element) return;
      tab.element.title = `${tab.title}
${tab.url}`;
      if (tab.titleElement && tab.titleElement.textContent !== tab.title) {
        tab.titleElement.textContent = tab.title;
      }
    }
    function revealPreviewTab(tab) {
      if (!tab || !tab.element) return;
      requestAnimationFrame(() => {
        if (!tab.element || !tab.element.isConnected) return;
        const tabsElement = tab.element.parentElement;
        if (!tabsElement) return;
        const left = tab.element.offsetLeft;
        const right = left + tab.element.offsetWidth;
        if (left < tabsElement.scrollLeft) {
          tabsElement.scrollLeft = left;
        } else if (right > tabsElement.scrollLeft + tabsElement.clientWidth) {
          tabsElement.scrollLeft = right - tabsElement.clientWidth;
        }
      });
    }
    function isTabLoadCurrent(tab, token, url) {
      return Boolean(
        tab && !tab.closed && previewTabs.includes(tab) && tab.loadToken === token && tab.url === url && tab.iframe
      );
    }
    function cancelPreviewTabLoad(tab) {
      if (!tab) return;
      if (tab.iframe) {
        postPreviewTabActivity(tab, false);
      }
      tab.loadToken = nextLoadToken++;
      if (tab.request) {
        try {
          tab.request.abort();
        } catch (e) {
        }
        tab.request = null;
      }
      clearContentReadyTimer(tab);
      if (tab.iframe) tab.iframe.onload = null;
      if (tab.loadingBar) {
        tab.loadingBar.remove();
        tab.loadingBar = null;
      }
      if (tab.pane) tab.pane.setAttribute("aria-busy", "false");
    }
    function releasePreviewTabResources(tab) {
      if (!tab) return;
      cancelPreviewTabLoad(tab);
      if (tab.iframe) {
        try {
          tab.iframe.src = "about:blank";
        } catch (e) {
        }
        try {
          tab.iframe.removeAttribute("srcdoc");
        } catch (e) {
        }
      }
      if (tab.pane && tab.pane.parentNode) tab.pane.parentNode.removeChild(tab.pane);
      if (tab.element && tab.element.parentNode) tab.element.parentNode.removeChild(tab.element);
      tab.iframe = null;
      tab.pane = null;
      tab.element = null;
      tab.titleElement = null;
      tab.loadState = "closed";
    }
    function syncActiveTabChrome(shouldReveal = false) {
      const tab = getActiveTab();
      if (!previewContainer || !tab) return;
      currentTargetUrl = tab.url;
      const oldTabElement = previewContainer.querySelector(".agy-preview-tab.active");
      if (oldTabElement && oldTabElement !== tab.element) {
        oldTabElement.classList.remove("active");
        oldTabElement.setAttribute("aria-selected", "false");
      }
      if (tab.element) {
        tab.element.classList.add("active");
        tab.element.setAttribute("aria-selected", "true");
      }
      const oldPane = previewContainer.querySelector(".agy-preview-pane.active");
      if (oldPane && oldPane !== tab.pane) {
        oldPane.classList.remove("active");
        oldPane.setAttribute("aria-hidden", "true");
      }
      if (tab.pane) {
        tab.pane.classList.add("active");
        tab.pane.setAttribute("aria-hidden", "false");
      }
      schedulePreviewTabActivity();
      const openButton = previewContainer.querySelector(".agy-open-btn");
      if (openButton) openButton.href = tab.url;
      scheduleBookmarkButtonStateUpdate(tab.id);
      if (shouldReveal) revealPreviewTab(tab);
    }
    function updatePreviewTabTitle(tab, title) {
      const normalizedTitle = title && title.trim();
      if (!tab || tab.closed || !normalizedTitle) return;
      tab.title = normalizedTitle;
      updatePreviewTabElement(tab);
    }
    function loadPreviewTab(tab, options2 = {}) {
      if (!tab || !previewContainer || !tab.iframe || tab.closed) return;
      cancelPreviewTabLoad(tab);
      setPreviewFrameToken(tab.iframe, tab.loadToken);
      const token = tab.loadToken;
      const url = tab.url;
      tab.loadState = "loading";
      delete tab.iframe.dataset.loaded;
      tab.iframe.style.visibility = "visible";
      const bar = showLoadingBar(tab);
      const startOptions = { ...options2 };
      delete startOptions.deferStart;
      const beginLoad = () => {
        if (!isTabLoadCurrent(tab, token, url)) return;
        startLoad(tab, url, bar, token, startOptions);
      };
      if (options2.deferStart === true) {
        cleanupAfterNextPaint(beginLoad);
      } else {
        beginLoad();
      }
    }
    function hasPreviewContent(innerDoc) {
      if (!innerDoc || !innerDoc.body) return false;
      const renderedText = typeof innerDoc.body.innerText === "string" ? innerDoc.body.innerText : innerDoc.body.textContent || "";
      const text = renderedText.replace(/\s+/g, "");
      if (text.length >= 12) return true;
      return Boolean(innerDoc.body.querySelector('img[src], video, canvas, svg, article, main > *, [role="main"] > *'));
    }
    function pollPreviewContentReady(tab, url, token, attempt = 0) {
      if (!isTabLoadCurrent(tab, token, url) || tab.loadState === "loaded") return;
      try {
        if (hasPreviewContent(tab.iframe.contentDocument)) {
          revealLoadedPreviewTab(tab, token, url);
          return;
        }
      } catch (e) {
        return;
      }
      if (attempt >= 100) return;
      tab.contentReadyTimer = setTimeout(() => {
        tab.contentReadyTimer = null;
        pollPreviewContentReady(tab, url, token, attempt + 1);
      }, 100);
    }
    function addPreviewTab(url) {
      if (isImageUrl(url)) {
        showImageViewer(url);
        return;
      }
      const tab = createPreviewTab(url);
      previewTabs.push(tab);
      mountPreviewTab(tab);
      mountPreviewTabElement(tab);
      activeTabId = tab.id;
      syncActiveTabChrome(true);
      closeBookmarkPanel();
      loadPreviewTab(tab, { deferStart: true });
    }
    function activatePreviewTab(tabId) {
      if (tabId === activeTabId || !previewTabs.some((tab) => tab.id === tabId)) return;
      activeTabId = tabId;
      syncActiveTabChrome(true);
      closeBookmarkPanel();
    }
    function closePreviewTab(tabId) {
      const index = previewTabs.findIndex((tab2) => tab2.id === tabId);
      if (index < 0) return;
      if (previewTabs.length === 1) {
        destroyPreview();
        return;
      }
      const tab = previewTabs[index];
      const wasActive = activeTabId === tabId;
      tab.closed = true;
      tab.loadToken = nextLoadToken++;
      if (tab.pane) {
        tab.pane.style.visibility = "hidden";
        tab.pane.style.pointerEvents = "none";
      }
      if (tab.element) tab.element.style.display = "none";
      previewTabs.splice(index, 1);
      if (wasActive) {
        const nextTab = previewTabs[Math.min(index, previewTabs.length - 1)];
        activeTabId = nextTab.id;
        syncActiveTabChrome(true);
      } else {
        schedulePreviewTabActivity();
      }
      scheduleHeavyCleanup(() => releasePreviewTabResources(tab));
    }
    function navigatePreview(url, tabId = activeTabId, options2 = {}) {
      if (isImageUrl(url)) {
        showImageViewer(url);
        return;
      }
      const tab = getPreviewTab(tabId);
      if (!tab) return;
      if (!options2.fromHistory) {
        tab.historyEntries = tab.historyEntries.slice(0, tab.historyIndex + 1);
        if (tab.historyEntries[tab.historyEntries.length - 1] !== url) {
          tab.historyEntries.push(url);
        }
        tab.historyIndex = tab.historyEntries.length - 1;
      }
      tab.url = url;
      tab.title = getFallbackTabTitle(url);
      if (tab.id === activeTabId) {
        syncActiveTabChrome();
        if (!options2.keepBookmarkPanel) closeBookmarkPanel();
      } else {
        updatePreviewTabElement(tab);
      }
      loadPreviewTab(tab);
    }
    function movePreviewHistory(tab, direction) {
      if (!tab || tab.closed || direction !== -1 && direction !== 1) return false;
      const nextIndex = tab.historyIndex + direction;
      if (nextIndex < 0 || nextIndex >= tab.historyEntries.length) return false;
      tab.historyIndex = nextIndex;
      navigatePreview(tab.historyEntries[nextIndex], tab.id, { fromHistory: true });
      return true;
    }
    function refreshPreviewTab(tab) {
      if (!tab || tab.closed || tab.id !== activeTabId) return false;
      closeBookmarkPanel();
      loadPreviewTab(tab, { forceReload: true });
      return true;
    }
    function startLoad(tab, url, bar, token, options2 = {}) {
      if (!isTabLoadCurrent(tab, token, url)) return;
      if (shouldDirectLoad(url)) {
        renderDirectDynamicPage(tab, url, bar, token);
        return;
      }
      if (options2.forceReload) {
        loadPageImmediate(tab, url, bar, token, options2);
        return;
      }
      const cached = cacheMap.get(url);
      if (cached && cached.status === "image") {
        tab.loadState = "image";
        if (tab.id === activeTabId) showImageViewer(url);
        hideLoadingBar(bar, tab);
      } else if (cached && cached.status === "done") {
        const preparedHtml = ensurePreparedCacheEntry(url, cached);
        if (preparedHtml) renderFetchedDynamicPage(tab, preparedHtml, url, bar, token);
      } else if (cached && cached.status === "loading") {
        tab.loadState = "waiting-cache";
      } else {
        loadPageImmediate(tab, url, bar, token);
      }
    }
    function showPreviewWindow(linkElement, url) {
      previewContainer = document.createElement("div");
      previewContainer.className = "agy-preview-container";
      const container = previewContainer;
      const header = document.createElement("div");
      header.className = "agy-preview-header";
      const tabsElement = document.createElement("div");
      tabsElement.className = "agy-preview-tabs";
      tabsElement.setAttribute("role", "tablist");
      const actions = document.createElement("div");
      actions.className = "agy-preview-actions";
      const listBtn = document.createElement("button");
      listBtn.className = "agy-preview-btn agy-bm-list-btn";
      listBtn.title = "\u4E66\u7B7E\u5217\u8868";
      listBtn.innerHTML = ICON_LIST;
      listBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBookmarkPanel();
      });
      const bmBtn = document.createElement("button");
      bmBtn.className = "agy-preview-btn agy-bm-add-btn";
      bmBtn.title = "\u6536\u85CF\u5F53\u524D\u9875\u9762";
      bmBtn.innerHTML = ICON_BOOKMARK;
      bmBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBookmark(bmBtn);
      });
      const openBtn = document.createElement("a");
      openBtn.className = "agy-preview-btn agy-open-btn";
      openBtn.href = url;
      openBtn.target = "_blank";
      openBtn.title = "\u65B0\u7A97\u53E3\u6253\u5F00";
      openBtn.innerHTML = ICON_EXTERNAL;
      openBtn.addEventListener("click", () => {
        setTimeout(destroyPreview, 0);
      });
      const refreshBtn = document.createElement("button");
      refreshBtn.type = "button";
      refreshBtn.className = "agy-preview-btn agy-refresh-btn";
      refreshBtn.title = "\u5237\u65B0\u5F53\u524D\u9884\u89C8";
      refreshBtn.setAttribute("aria-label", refreshBtn.title);
      refreshBtn.innerHTML = ICON_REFRESH;
      refreshBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        refreshPreviewTab(getActiveTab());
      });
      const maximizeBtn = document.createElement("button");
      maximizeBtn.type = "button";
      maximizeBtn.className = "agy-maximize-btn";
      maximizeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePreviewMaximized();
      });
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "agy-close-btn";
      closeBtn.innerHTML = ICON_CLOSE;
      closeBtn.title = "\u5173\u95ED\u9884\u89C8 (Esc)";
      actions.appendChild(listBtn);
      actions.appendChild(bmBtn);
      actions.appendChild(openBtn);
      actions.appendChild(refreshBtn);
      actions.appendChild(maximizeBtn);
      actions.appendChild(closeBtn);
      header.appendChild(tabsElement);
      header.appendChild(actions);
      const body = document.createElement("div");
      body.className = "agy-preview-body";
      previewContainer.appendChild(header);
      previewContainer.appendChild(body);
      document.body.appendChild(previewContainer);
      previewTabs = [createPreviewTab(url)];
      activeTabId = previewTabs[0].id;
      mountPreviewTab(previewTabs[0]);
      mountPreviewTabElement(previewTabs[0]);
      syncActiveTabChrome();
      positionPreviewWindow(linkElement);
      applyPreviewMaximizedState();
      enablePreviewDragging(header);
      container.classList.add("agy-instant-feedback");
      container.classList.add("agy-preview-visible");
      cleanupAfterNextPaint(() => {
        if (container === previewContainer) container.classList.remove("agy-instant-feedback");
      });
      loadPreviewTab(previewTabs[0], { deferStart: true });
      scheduleParentPageActivity();
    }
    function loadPageImmediate(tab, url, loadingBar, token, options2 = {}) {
      let request = null;
      const requestOptions = {
        method: "GET",
        url,
        timeout: 1e4,
        onload: function(response) {
          if (!isTabLoadCurrent(tab, token, url) || tab.request !== request) return;
          tab.request = null;
          if (response.status >= 200 && response.status < 400) {
            if (isImageResponse(response)) {
              setCache(url, { status: "image", html: "", xhr: null, time: Date.now() });
              tab.loadState = "image";
              if (tab.id === activeTabId) showImageViewer(url);
              hideLoadingBar(loadingBar, tab);
              return;
            }
            const prepared = prepareDynamicHtml(response.responseText, url, TOKEN_PLACEHOLDER);
            setCache(url, {
              status: "done",
              html: prepared,
              xhr: null,
              time: Date.now()
            });
            renderFetchedDynamicPage(tab, prepared, url, loadingBar, token);
          } else {
            showError(tab, response.statusText || "\u52A0\u8F7D\u5931\u8D25");
          }
        },
        onerror: function() {
          if (!isTabLoadCurrent(tab, token, url) || tab.request !== request) return;
          tab.request = null;
          showError(tab, "\u7F51\u7EDC\u8FDE\u63A5\u51FA\u9519");
        }
      };
      if (options2.forceReload) {
        requestOptions.headers = {
          "Cache-Control": "no-cache",
          Pragma: "no-cache"
        };
      }
      request = GM_xmlhttpRequest(requestOptions);
      tab.request = request;
    }
    function prepareDynamicHtml(htmlString, baseUrl, token) {
      const parsed = new DOMParser().parseFromString(htmlString, "text/html");
      parsed.querySelectorAll("base").forEach((node) => node.remove());
      parsed.querySelectorAll("meta[http-equiv]").forEach((meta) => {
        const directive = (meta.getAttribute("http-equiv") || "").toLowerCase();
        if (directive === "content-security-policy" || directive === "refresh") meta.remove();
      });
      const base = parsed.createElement("base");
      base.href = baseUrl;
      parsed.head.prepend(base);
      const bridge = parsed.createElement("script");
      bridge.textContent = `
            (function() {
                if (window.__agyEmbeddedPreviewBridge) return;
                window.__agyEmbeddedPreviewBridge = true;
                var loadToken = ${token};
                var contentReadySent = false;
                var contentCheckScheduled = false;
                var contentObserver = null;
                var visibilityController = (${createPageVisibilityController.toString()})();
                window.addEventListener('message', function(e) {
                    var data = e.data;
                    if (
                        e.source !== window.parent
                        || !data
                        || data.agyPreviewActivity !== true
                        || data.agyPreviewToken !== loadToken
                    ) return;
                    if (visibilityController) {
                        visibilityController.setSuspended(data.agyPreviewActive !== true);
                    }
                });
                function isEditableTarget(target) {
                    return Boolean(target && target.closest && target.closest(
                        'input, textarea, select, [contenteditable="true"], [contenteditable=""], .CodeMirror, .monaco-editor'
                    ));
                }
                function hasMeaningfulContent() {
                    if (!document.body) return false;
                    var renderedText = typeof document.body.innerText === 'string'
                        ? document.body.innerText
                        : (document.body.textContent || '');
                    var text = renderedText.replace(/\\s+/g, '');
                    if (text.length >= 12) return true;
                    return Boolean(document.body.querySelector('img[src], video, canvas, svg, article, main > *, [role="main"] > *'));
                }
                function checkContentReady() {
                    contentCheckScheduled = false;
                    if (contentReadySent || !hasMeaningfulContent()) return;
                    contentReadySent = true;
                    if (contentObserver) contentObserver.disconnect();
                    window.parent.postMessage({
                        agyPreviewContentReady: true,
                        agyPreviewToken: loadToken
                    }, '*');
                }
                function scheduleContentReadyCheck() {
                    if (contentReadySent || contentCheckScheduled) return;
                    contentCheckScheduled = true;
                    setTimeout(checkContentReady, 50);
                }
                try {
                    contentObserver = new MutationObserver(scheduleContentReadyCheck);
                    contentObserver.observe(document.documentElement || document, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                } catch (e) {}
                document.addEventListener('DOMContentLoaded', scheduleContentReadyCheck, { once: true });
                document.addEventListener('click', function(e) {
                    var link = e.target && e.target.closest ? e.target.closest('a') : null;
                    if (!link) return;
                    var rawHref = link.getAttribute('href');
                    if (!rawHref || /^javascript:/i.test(rawHref) || rawHref.charAt(0) === '#') return;
                    var url = link.href;
                    if (!/^https?:/i.test(url)) return;
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    window.parent.postMessage({
                        agyPreviewNavigate: url,
                        agyPreviewToken: loadToken
                    }, '*');
                }, true);
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'F5' || e.code === 'F5' || e.keyCode === 116) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        if (!e.repeat) {
                            window.parent.postMessage({
                                agyPreviewRefresh: true,
                                agyPreviewToken: loadToken
                            }, '*');
                        }
                        return;
                    }
                    if (
                        (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')
                        || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey
                        || e.isComposing || isEditableTarget(e.target)
                    ) return;
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    window.parent.postMessage({
                        agyPreviewHistoryDirection: e.key === 'ArrowLeft' ? -1 : 1,
                        agyPreviewToken: loadToken
                    }, '*');
                }, true);
                window.addEventListener('load', scheduleContentReadyCheck, { once: true });
            })();
        `;
      base.after(bridge);
      const siteRule = getSiteRule(baseUrl);
      if (siteRule && siteRule.css) {
        const siteStyle = parsed.createElement("style");
        siteStyle.textContent = siteRule.css;
        parsed.head.appendChild(siteStyle);
      }
      return "<!doctype html>\n" + parsed.documentElement.outerHTML;
    }
    function handleDynamicPageLoaded(tab, baseUrl, loadingBar, token) {
      if (!isTabLoadCurrent(tab, token, baseUrl)) return;
      let canInspectDocument = false;
      let hasContent = false;
      try {
        const innerDoc = tab.iframe.contentDocument;
        canInspectDocument = Boolean(innerDoc);
        hasContent = hasPreviewContent(innerDoc);
        applySiteRuleToDocument(innerDoc, baseUrl);
        if (innerDoc && innerDoc.title) updatePreviewTabTitle(tab, innerDoc.title);
      } catch (e) {
      }
      if (!canInspectDocument || hasContent) {
        revealLoadedPreviewTab(tab, token, baseUrl, loadingBar);
      } else {
        pollPreviewContentReady(tab, baseUrl, token);
      }
      if (tab.id === activeTabId) updateBookmarkButtonState();
      postPreviewTabActivity(tab, isPreviewTabActive(tab));
    }
    function revealLoadedPreviewTab(tab, token, baseUrl, loadingBar) {
      if (!isTabLoadCurrent(tab, token, baseUrl)) return;
      tab.loadState = "loaded";
      tab.iframe.style.visibility = "visible";
      hideLoadingBar(loadingBar || tab.loadingBar, tab);
    }
    function applySiteRuleToDocument(innerDoc, url) {
      const rule = getSiteRule(url);
      if (!innerDoc || !rule || !rule.css) return;
      const existingStyle = innerDoc.getElementById("agy-site-rule-style");
      if (existingStyle) {
        if (existingStyle.textContent !== rule.css) existingStyle.textContent = rule.css;
        return;
      }
      const style = innerDoc.createElement("style");
      style.id = "agy-site-rule-style";
      style.textContent = rule.css;
      (innerDoc.head || innerDoc.documentElement).appendChild(style);
    }
    function setPreviewFrameToken(iframe, token) {
      const frameName = `${PREVIEW_FRAME_PREFIX}${token}`;
      iframe.name = frameName;
      try {
        iframe.contentWindow.name = frameName;
      } catch (e) {
      }
    }
    function renderDirectDynamicPage(tab, url, loadingBar, token) {
      if (!isTabLoadCurrent(tab, token, url)) return;
      const iframe = tab.iframe;
      iframe.dataset.loaded = "true";
      setPreviewFrameToken(iframe, token);
      iframe.onload = () => handleDynamicPageLoaded(tab, url, loadingBar, token);
      iframe.removeAttribute("srcdoc");
      iframe.src = url;
    }
    function renderFetchedDynamicPage(tab, preparedHtml, baseUrl, loadingBar, token) {
      if (!isTabLoadCurrent(tab, token, baseUrl)) return;
      const iframe = tab.iframe;
      tab.loadState = "loading";
      iframe.dataset.loaded = "true";
      setPreviewFrameToken(iframe, token);
      iframe.onload = () => handleDynamicPageLoaded(tab, baseUrl, loadingBar, token);
      iframe.srcdoc = preparedHtml.replace(new RegExp(TOKEN_PLACEHOLDER, "g"), String(token));
    }
    function showError(tab, msg) {
      if (!previewContainer || !tab || tab.closed) return;
      clearContentReadyTimer(tab);
      tab.loadState = "error";
      let bar = tab.loadingBar;
      if (!bar) bar = createErrorBar(tab, msg);
      if (!bar) return;
      if (tab.pane) tab.pane.setAttribute("aria-busy", "false");
      if (tab.iframe) tab.iframe.style.visibility = "hidden";
      const textNode = bar.querySelector(".agy-loading-text");
      if (textNode) {
        textNode.textContent = `\u52A0\u8F7D\u51FA\u9519: ${msg}`;
        textNode.style.color = "#ff3b30";
      }
      const spinner = bar.querySelector(".agy-spinner");
      if (spinner) {
        spinner.style.borderTopColor = "#ff3b30";
        spinner.style.animationPlayState = "paused";
      }
    }
    function clampPreviewPosition(left, top, container) {
      const width = container ? container.offsetWidth : Math.min(WINDOW_WIDTH, window.innerWidth - WINDOW_MARGIN * 2);
      const height = container ? container.offsetHeight : Math.min(WINDOW_HEIGHT, window.innerHeight - WINDOW_MARGIN * 2);
      const maxLeft = Math.max(WINDOW_MARGIN, window.innerWidth - width - WINDOW_MARGIN);
      const maxTop = Math.max(WINDOW_MARGIN, window.innerHeight - height - WINDOW_MARGIN);
      return {
        left: Math.round(Math.min(Math.max(left, WINDOW_MARGIN), maxLeft)),
        top: Math.round(Math.min(Math.max(top, WINDOW_MARGIN), maxTop))
      };
    }
    function applyPreviewPosition(container, position) {
      container.style.left = `${position.left}px`;
      container.style.top = `${position.top}px`;
    }
    function syncPreviewMaximizeButton() {
      if (!previewContainer) return;
      const button = previewContainer.querySelector(".agy-maximize-btn");
      if (!button) return;
      button.innerHTML = isPreviewMaximized ? ICON_RESTORE : ICON_MAXIMIZE;
      button.title = isPreviewMaximized ? "\u8FD8\u539F\u9884\u89C8\u7A97\u53E3" : "\u6700\u5927\u5316\u9884\u89C8\u7A97\u53E3";
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", String(isPreviewMaximized));
    }
    function applyPreviewMaximizedState() {
      if (!previewContainer) return;
      previewContainer.classList.toggle("agy-maximized", isPreviewMaximized);
      syncPreviewMaximizeButton();
    }
    function togglePreviewMaximized() {
      if (!previewContainer) return;
      if (!isPreviewMaximized) {
        const rect = previewContainer.getBoundingClientRect();
        const position = clampPreviewPosition(rect.left, rect.top, previewContainer);
        applyPreviewPosition(previewContainer, position);
        savePreviewPosition(position);
      }
      isPreviewMaximized = !isPreviewMaximized;
      savePreviewMaximizedState(isPreviewMaximized);
      applyPreviewMaximizedState();
      if (!isPreviewMaximized) {
        const savedPosition = loadPreviewPosition();
        const position = clampPreviewPosition(
          savedPosition ? savedPosition.left : previewContainer.offsetLeft,
          savedPosition ? savedPosition.top : previewContainer.offsetTop,
          previewContainer
        );
        applyPreviewPosition(previewContainer, position);
        savePreviewPosition(position);
      }
      closeBookmarkPanel();
    }
    function enablePreviewDragging(header) {
      header.addEventListener("pointerdown", function(e) {
        if (e.button !== 0 || isPreviewMaximized || e.target.closest(".agy-preview-actions, .agy-preview-tab")) return;
        const container = header.closest(".agy-preview-container");
        if (!container || container !== previewContainer) return;
        const rect = container.getBoundingClientRect();
        const pointerId = e.pointerId;
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        e.preventDefault();
        e.stopPropagation();
        closeBookmarkPanel();
        container.classList.add("agy-preview-visible");
        container.classList.remove("agy-animating");
        container.classList.add("agy-dragging");
        try {
          header.setPointerCapture(pointerId);
        } catch (error) {
        }
        function move(event) {
          if (event.pointerId !== pointerId) return;
          const position = clampPreviewPosition(
            event.clientX - offsetX,
            event.clientY - offsetY,
            container
          );
          applyPreviewPosition(container, position);
        }
        function finish(event) {
          if (event.pointerId !== pointerId) return;
          header.removeEventListener("pointermove", move);
          header.removeEventListener("pointerup", finish);
          header.removeEventListener("pointercancel", finish);
          container.classList.remove("agy-dragging");
          try {
            header.releasePointerCapture(pointerId);
          } catch (error) {
          }
          const finalRect = container.getBoundingClientRect();
          const position = clampPreviewPosition(finalRect.left, finalRect.top, container);
          applyPreviewPosition(container, position);
          savePreviewPosition(position);
        }
        header.addEventListener("pointermove", move);
        header.addEventListener("pointerup", finish);
        header.addEventListener("pointercancel", finish);
      });
    }
    function positionPreviewWindow(targetElement) {
      if (!previewContainer) return;
      const savedPosition = loadPreviewPosition();
      if (savedPosition) {
        applyPreviewPosition(
          previewContainer,
          clampPreviewPosition(savedPosition.left, savedPosition.top, previewContainer)
        );
        return;
      }
      const rect = targetElement.getBoundingClientRect();
      let top = rect.bottom + 8;
      let left = rect.left;
      if (top + previewContainer.offsetHeight > window.innerHeight - WINDOW_MARGIN) {
        top = rect.top - WINDOW_HEIGHT - 8;
      }
      applyPreviewPosition(previewContainer, clampPreviewPosition(left, top, previewContainer));
    }
    function isSameOrigin(url) {
      try {
        return new URL(url).origin === window.location.origin;
      } catch (e) {
        return false;
      }
    }
    function openFromFrame(url, anchorRect) {
      if (!isPreviewEnabled() || !/^https?:/i.test(url)) return;
      if (options.isPreviewableUrl && !options.isPreviewableUrl(url, null)) return;
      if (isImageUrl(url)) {
        showImageViewer(url);
        return;
      }
      if (previewContainer) {
        addPreviewTab(url);
        return;
      }
      currentTargetUrl = url;
      const rect = anchorRect || { left: WINDOW_MARGIN, top: WINDOW_MARGIN, bottom: WINDOW_MARGIN };
      showPreviewWindow({ getBoundingClientRect: () => rect }, url);
    }
    function closeAndClearCache() {
      destroyPreview();
      if (preheatTimer) clearTimeout(preheatTimer);
      preheatTimer = null;
      preheatLink = null;
      cacheMap.forEach((entry) => {
        if (entry && entry.xhr) {
          try {
            entry.xhr.abort();
          } catch (e) {
          }
        }
      });
      cacheMap.clear();
    }
    return {
      openFromFrame,
      close: closeAndClearCache,
      syncClickMode
    };
  }

  // src/discourse/topic-tools.ts
  var DEFAULT_CONFIG2 = {
    ownerOnlyEnabled: true
  };
  var OWNER_STATE_KEY = "linuxdo-ultimate:owner-view:v2";
  var OWNER_STATE_PREFIX = "linuxdo-ultimate:owner-view:";
  var LEGACY_OWNER_STATE_KEY = "on_off";
  var OWNER_MIGRATION_KEY = "linuxdo-ultimate:owner-view:migrated";
  var OWNER_FILTER_PARAM = "username_filters";
  var SUMMARY_FILTER_PARAM = "filter";
  var SUMMARY_FILTER_VALUE = "summary";
  var MAX_OWNER_TOPICS = 100;
  var LEGACY_OWNER_MODE = "\u5F53\u524D\u53EA\u770B\u697C\u4E3B";
  var OWNER_BUTTON_TEXT = "\u53EA\u770B\u697C\u4E3B";
  var OWNER_CONTROL_MUTATION_SELECTOR = [
    ".timeline-footer-controls",
    "#data-preloaded",
    ".show-summary",
    ".top-replies",
    ".posts-filtered-notice",
    ".filtered-replies-show-all"
  ].join(", ");
  var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  function extractOwnerUsername(value) {
    let source = value;
    if (typeof source === "string") {
      try {
        source = JSON.parse(source);
      } catch {
        return null;
      }
    }
    if (!source || typeof source !== "object") return null;
    const details = source.details;
    if (!details || typeof details !== "object") return null;
    const createdBy = details.created_by;
    if (!createdBy || typeof createdBy !== "object") return null;
    const username = createdBy.username;
    return typeof username === "string" && username.trim() ? username.trim() : null;
  }
  var TopicToolsController = class {
    config = { ...DEFAULT_CONFIG2 };
    observer = null;
    applyQueued = false;
    started = false;
    active = true;
    lastOwnerTopicId = "";
    ownerUsername = null;
    pendingNativeClearTopicId = "";
    ownerLookupTopicId = "";
    ownerLookupPromise = null;
    documentClickBound = false;
    win;
    doc;
    embedded;
    isSplitHost;
    navigate;
    constructor(options = {}) {
      this.win = options.window ?? window;
      this.doc = options.document ?? document;
      this.embedded = options.isEmbedded === true;
      this.isSplitHost = options.isSplitHost ?? (() => this.doc.body?.classList.contains("ldu-layout-active") === true);
      this.navigate = options.navigate ?? ((url) => this.win.location.assign(url));
    }
    start() {
      if (this.started) return this;
      this.started = true;
      this.syncObserver();
      this.queueApply();
      return this;
    }
    stop(clearNativeFilter = false) {
      this.disconnectObserver();
      this.unbindDocumentClick();
      this.started = false;
      this.applyQueued = false;
      this.doc.getElementById("ldu-owner-toggle")?.remove();
      if (clearNativeFilter) this.clearNativeOwnerFilter();
      this.lastOwnerTopicId = "";
      this.ownerUsername = null;
    }
    setConfig(patch) {
      const previous = this.config.ownerOnlyEnabled;
      const next = { ...this.config, ...patch };
      if (next.ownerOnlyEnabled === previous) return;
      this.config = next;
      this.syncObserver();
      if (!next.ownerOnlyEnabled) {
        this.doc.getElementById("ldu-owner-toggle")?.remove();
        this.clearNativeOwnerFilter();
        return;
      }
      this.queueApply();
    }
    setActive(active) {
      if (this.active === active) return;
      this.active = active;
      this.syncObserver();
      if (active) this.queueApply();
    }
    queueApply() {
      if (this.applyQueued) return;
      this.applyQueued = true;
      const run = () => {
        this.applyQueued = false;
        if (!this.active || !this.config.ownerOnlyEnabled) return;
        this.apply();
      };
      if (typeof this.win.requestAnimationFrame === "function") this.win.requestAnimationFrame(run);
      else this.win.setTimeout(run, 0);
    }
    apply() {
      const topicId = this.getTopicId();
      if (topicId !== this.lastOwnerTopicId) {
        this.lastOwnerTopicId = topicId ?? "";
        this.ownerUsername = null;
        this.pendingNativeClearTopicId = "";
        this.ownerLookupTopicId = "";
        this.ownerLookupPromise = null;
      }
      this.syncOwnerControl();
      if (!topicId || this.isHiddenHostTopic()) return;
      const ownerUsername = this.findOwnerUsername();
      if (!ownerUsername) return;
      const filteredUsername = this.currentUrl().searchParams.get(OWNER_FILTER_PARAM);
      const nativeFilterActive = filteredUsername === ownerUsername;
      if (this.pendingNativeClearTopicId === topicId) {
        if (!nativeFilterActive) this.pendingNativeClearTopicId = "";
        else {
          this.updateCurrentButton(false);
          return;
        }
      }
      const remembered = this.readOwnerMode(topicId);
      if (nativeFilterActive && !remembered) {
        this.writeOwnerMode(topicId, true);
        this.updateCurrentButton(true);
        return;
      }
      if (remembered && !nativeFilterActive) {
        this.navigateWithOwnerFilter(ownerUsername);
        return;
      }
      this.updateCurrentButton(nativeFilterActive);
    }
    syncObserver() {
      const shouldObserve = this.started && this.active && this.config.ownerOnlyEnabled;
      if (!shouldObserve) {
        this.disconnectObserver();
        this.unbindDocumentClick();
        return;
      }
      this.bindDocumentClick();
      if (this.observer) return;
      const Observer = this.win.MutationObserver;
      const target = this.doc.body ?? this.doc.documentElement;
      if (!Observer || !target) return;
      this.observer = new Observer((records) => this.handleMutations(records));
      this.observer.observe(target, { childList: true, subtree: true });
    }
    disconnectObserver() {
      this.observer?.disconnect();
      this.observer = null;
    }
    bindDocumentClick() {
      if (this.documentClickBound) return;
      this.doc.addEventListener("click", this.handleDocumentClick, true);
      this.documentClickBound = true;
    }
    unbindDocumentClick() {
      if (!this.documentClickBound) return;
      this.doc.removeEventListener("click", this.handleDocumentClick, true);
      this.documentClickBound = false;
    }
    handleDocumentClick = (event) => {
      if (!this.active || !this.config.ownerOnlyEnabled || event.button > 0) return;
      const filterClear = event.target instanceof Element ? event.target.closest(".filtered-replies-show-all") : null;
      if (filterClear) {
        const topicId = this.getTopicId();
        const ownerUsername2 = this.findOwnerUsername();
        if (topicId && ownerUsername2 && this.isNativeOwnerFilterActive(ownerUsername2)) {
          this.pendingNativeClearTopicId = topicId;
          this.writeOwnerMode(topicId, false);
          this.updateCurrentButton(false);
        }
        return;
      }
      const target = event.target instanceof Element ? event.target.closest(".show-summary, .top-replies") : null;
      if (!target) return;
      const ownerUsername = this.findOwnerUsername();
      if (!ownerUsername || !this.isNativeOwnerFilterActive(ownerUsername)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const url = this.currentUrl();
      const summaryActive = url.searchParams.get(SUMMARY_FILTER_PARAM) === SUMMARY_FILTER_VALUE || target.textContent?.includes("\u5168\u90E8\u663E\u793A") === true;
      if (summaryActive) url.searchParams.delete(SUMMARY_FILTER_PARAM);
      else url.searchParams.set(SUMMARY_FILTER_PARAM, SUMMARY_FILTER_VALUE);
      this.navigate(url.href);
    };
    handleMutations(records) {
      if (this.getTopicId() !== this.lastOwnerTopicId) {
        this.queueApply();
        return;
      }
      for (const record of records) {
        for (const node of [...record.addedNodes, ...record.removedNodes]) {
          if (!(node instanceof Element)) continue;
          if (node.id === "ldu-owner-toggle") {
            if (!node.isConnected) this.queueApply();
            continue;
          }
          if (node.matches(OWNER_CONTROL_MUTATION_SELECTOR) || node.querySelector(`${OWNER_CONTROL_MUTATION_SELECTOR}, #ldu-owner-toggle`)) {
            this.queueApply();
            return;
          }
        }
      }
    }
    getTopicId() {
      return getTopicInfo(this.win.location.href, this.win.location.href)?.topicId ?? null;
    }
    currentUrl() {
      return new URL(this.win.location.href, this.win.location.href);
    }
    readOwnerMode(topicId) {
      this.migrateOwnerState(topicId);
      try {
        return Boolean(this.readOwnerState(this.win.localStorage).topics[topicId]);
      } catch {
        try {
          return Boolean(this.readOwnerState(this.win.sessionStorage).topics[topicId]);
        } catch {
          return false;
        }
      }
    }
    writeOwnerMode(topicId, ownerOnly) {
      try {
        this.writeOwnerState(this.win.localStorage, topicId, ownerOnly);
      } catch {
        try {
          this.writeOwnerState(this.win.sessionStorage, topicId, ownerOnly);
        } catch {
        }
      }
    }
    readOwnerState(storage) {
      try {
        const parsed = JSON.parse(storage.getItem(OWNER_STATE_KEY) ?? "null");
        if (!parsed || parsed.version !== 1 || !parsed.topics || typeof parsed.topics !== "object") {
          return { version: 1, topics: {} };
        }
        const topics = {};
        for (const [topicId, updatedAt] of Object.entries(parsed.topics)) {
          if (/^\d+$/.test(topicId) && typeof updatedAt === "number" && Number.isFinite(updatedAt)) topics[topicId] = updatedAt;
        }
        return { version: 1, topics };
      } catch {
        return { version: 1, topics: {} };
      }
    }
    writeOwnerState(storage, topicId, ownerOnly) {
      const state = this.readOwnerState(storage);
      if (ownerOnly) state.topics[topicId] = Date.now();
      else delete state.topics[topicId];
      const retained = Object.entries(state.topics).sort(([, left], [, right]) => right - left).slice(0, MAX_OWNER_TOPICS);
      storage.setItem(OWNER_STATE_KEY, JSON.stringify({ version: 1, topics: Object.fromEntries(retained) }));
    }
    migrateOwnerState(currentTopicId) {
      let storage;
      try {
        storage = this.win.localStorage;
        if (storage.getItem(OWNER_MIGRATION_KEY) === "1") return;
      } catch {
        return;
      }
      const state = this.readOwnerState(storage);
      const legacyMode = storage.getItem(LEGACY_OWNER_STATE_KEY);
      if (legacyMode === LEGACY_OWNER_MODE) state.topics[currentTopicId] = Date.now();
      const staleKeys = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (!key?.startsWith(OWNER_STATE_PREFIX) || key === OWNER_STATE_KEY) continue;
        staleKeys.push(key);
        const topicId = key.slice(OWNER_STATE_PREFIX.length);
        const value = storage.getItem(key);
        if (/^\d+$/.test(topicId) && (value === "owner" || value === LEGACY_OWNER_MODE)) state.topics[topicId] = Date.now();
      }
      const retained = Object.entries(state.topics).sort(([, left], [, right]) => right - left).slice(0, MAX_OWNER_TOPICS);
      storage.setItem(OWNER_STATE_KEY, JSON.stringify({ version: 1, topics: Object.fromEntries(retained) }));
      for (const key of staleKeys) storage.removeItem(key);
      storage.removeItem(LEGACY_OWNER_STATE_KEY);
      storage.setItem(OWNER_MIGRATION_KEY, "1");
    }
    findOwnerUsername() {
      if (this.ownerUsername) return this.ownerUsername;
      const ownerLink = this.doc.querySelector(
        ".topic-post.topic-owner [data-user-card], .topic-post.post--topic-owner [data-user-card], #post_1 [data-user-card]"
      );
      this.ownerUsername = ownerLink?.dataset.userCard?.trim() || this.readPreloadedOwnerUsername();
      return this.ownerUsername;
    }
    readPreloadedOwnerUsername() {
      const topicId = this.getTopicId();
      const source = this.doc.getElementById("data-preloaded")?.textContent;
      if (!topicId || !source) return null;
      try {
        const preloaded = JSON.parse(source);
        const rawTopic = preloaded[`topic_${topicId}`];
        return extractOwnerUsername(rawTopic);
      } catch {
        return null;
      }
    }
    resolveOwnerUsername(topicId) {
      const known = this.findOwnerUsername();
      if (known) return Promise.resolve(known);
      if (this.ownerLookupTopicId === topicId && this.ownerLookupPromise) return this.ownerLookupPromise;
      const fetcher = this.win.fetch?.bind(this.win);
      if (!fetcher) return Promise.resolve(null);
      this.ownerLookupTopicId = topicId;
      const request = fetcher(`/t/${topicId}.json`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      }).then(async (response) => response.ok ? extractOwnerUsername(await response.json()) : null).catch(() => null);
      this.ownerLookupPromise = request.then((username) => {
        if (this.getTopicId() === topicId && username) this.ownerUsername = username;
        return username;
      }).finally(() => {
        if (this.ownerLookupTopicId === topicId) this.ownerLookupPromise = null;
      });
      return this.ownerLookupPromise;
    }
    toggleOwnerFilter(button, topicId, ownerUsername) {
      const next = !this.isNativeOwnerFilterActive(ownerUsername);
      this.pendingNativeClearTopicId = next ? "" : topicId;
      this.writeOwnerMode(topicId, next);
      this.updateOwnerButton(button, next);
      if (next) this.navigateWithOwnerFilter(ownerUsername);
      else this.navigateWithoutOwnerFilter();
    }
    syncOwnerControl() {
      const topicId = this.getTopicId();
      const shouldShow = this.active && this.config.ownerOnlyEnabled && Boolean(topicId) && !this.isHiddenHostTopic();
      const existing = this.doc.getElementById("ldu-owner-toggle");
      if (!shouldShow) {
        existing?.remove();
        return;
      }
      if (!topicId) return;
      let button = existing;
      if (!button) {
        button = this.doc.createElement("button");
        button.id = "ldu-owner-toggle";
        button.type = "button";
        button.className = "btn btn-icon-text btn-default btn-small ldu-owner-toggle";
        const icon = this.doc.createElementNS(SVG_NAMESPACE, "svg");
        icon.setAttribute("class", "fa d-icon d-icon-user-check svg-icon fa-width-auto svg-string");
        icon.setAttribute("width", "1em");
        icon.setAttribute("height", "1em");
        icon.setAttribute("aria-hidden", "true");
        const use = this.doc.createElementNS(SVG_NAMESPACE, "use");
        use.setAttribute("href", "#user-check");
        icon.append(use);
        const label = this.doc.createElement("span");
        label.className = "d-button-label";
        label.textContent = OWNER_BUTTON_TEXT;
        button.append(icon, label);
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          const currentTopicId = this.getTopicId();
          if (!currentTopicId) return;
          const ownerUsername2 = this.findOwnerUsername();
          if (ownerUsername2) {
            this.toggleOwnerFilter(button, currentTopicId, ownerUsername2);
            return;
          }
          if (button.dataset.ownerLookupPending === "true") return;
          button.dataset.ownerLookupPending = "true";
          void this.resolveOwnerUsername(currentTopicId).then((resolvedOwner) => {
            delete button.dataset.ownerLookupPending;
            if (!resolvedOwner || this.getTopicId() !== currentTopicId) return;
            this.toggleOwnerFilter(button, currentTopicId, resolvedOwner);
          });
        });
      }
      const mount = this.doc.querySelector(".timeline-footer-controls");
      if (!mount) {
        button.remove();
        return;
      }
      const summaryButton = mount.querySelector(".show-summary, .top-replies");
      if (button.parentElement !== mount || button.nextElementSibling !== summaryButton) {
        mount.insertBefore(button, summaryButton ?? mount.firstChild);
      }
      const ownerUsername = this.findOwnerUsername();
      const nativeFilterActive = Boolean(ownerUsername && this.isNativeOwnerFilterActive(ownerUsername));
      this.updateOwnerButton(button, nativeFilterActive && this.pendingNativeClearTopicId !== topicId);
    }
    updateCurrentButton(ownerOnly) {
      const button = this.doc.getElementById("ldu-owner-toggle");
      if (button instanceof HTMLButtonElement) this.updateOwnerButton(button, ownerOnly);
    }
    updateOwnerButton(button, ownerOnly) {
      const pressed = String(ownerOnly);
      const title = ownerOnly ? "\u5173\u95ED\u53EA\u770B\u697C\u4E3B" : OWNER_BUTTON_TEXT;
      const label = button.querySelector(".d-button-label");
      if (label && label.textContent !== OWNER_BUTTON_TEXT) label.textContent = OWNER_BUTTON_TEXT;
      if (button.getAttribute("aria-pressed") !== pressed) button.setAttribute("aria-pressed", pressed);
      if (button.title !== title) button.title = title;
      button.classList.toggle("btn-primary", ownerOnly);
      button.classList.toggle("btn-default", !ownerOnly);
    }
    isNativeOwnerFilterActive(ownerUsername) {
      return this.currentUrl().searchParams.get(OWNER_FILTER_PARAM) === ownerUsername;
    }
    navigateWithOwnerFilter(ownerUsername) {
      const url = this.currentUrl();
      if (url.searchParams.get(OWNER_FILTER_PARAM) === ownerUsername) return;
      url.searchParams.set(OWNER_FILTER_PARAM, ownerUsername);
      this.navigate(url.href);
    }
    navigateWithoutOwnerFilter() {
      const url = this.currentUrl();
      if (!url.searchParams.has(OWNER_FILTER_PARAM)) return;
      url.searchParams.delete(OWNER_FILTER_PARAM);
      this.navigate(url.href);
    }
    clearNativeOwnerFilter() {
      const ownerUsername = this.findOwnerUsername();
      const topicId = this.getTopicId();
      if (topicId && ownerUsername && this.isNativeOwnerFilterActive(ownerUsername)) {
        this.pendingNativeClearTopicId = topicId;
        this.navigateWithoutOwnerFilter();
      }
    }
    isHiddenHostTopic() {
      return !this.embedded && this.isSplitHost();
    }
  };
  function installTopicTools(options = {}) {
    const win = options.window ?? window;
    if (win.__LDU_TOPIC_TOOLS__) {
      win.__LDU_TOPIC_TOOLS__.start();
      return win.__LDU_TOPIC_TOOLS__;
    }
    const controller = new TopicToolsController(options);
    win.__LDU_TOPIC_TOOLS__ = controller;
    controller.start();
    return controller;
  }

  // src/main.ts
  function boot() {
    if (window.__linuxDoUltimateLoaded) return;
    window.__linuxDoUltimateLoaded = true;
  }
  if (typeof window !== "undefined") {
    bootChallengeBypass({ registerManualCommand: true });
    if (!location.pathname.startsWith("/challenge")) {
      if (window.self !== window.top) {
        bootFrameBridge({ loadOwnerView: () => installTopicTools });
      } else {
        boot();
        startLinuxDoApp({
          loadPreviewer: () => installLinkHoverPreviewer,
          loadOwnerView: () => installTopicTools
        });
      }
    }
  }
})();
