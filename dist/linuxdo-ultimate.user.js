// ==UserScript==
// @name         Linux.do Ultimate Optimizer
// @name:zh-CN   Linux.do 社区终极优化脚本
// @namespace    https://linux.do/
// @version      0.2.2
// @description  Independent split reading, in-page topic tabs, reliable view tracking and multi-tab link previews for Linux.do.
// @description:zh-CN 持久化分屏阅读、页内帖子标签、阅读计数修复与多标签链接预览。
// @author       Linux.do Community
// @license      MIT
// @match        https://linux.do/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-start
// ==/UserScript==

"use strict";
(() => {
  // src/core/defaults.ts
  var DEFAULT_SETTINGS = {
    schemaVersion: 2,
    enabled: true,
    layoutPreference: "auto",
    tabsEnabled: true,
    restoreSession: false,
    hidePosters: true,
    colorizeTabs: true,
    previewEnabled: false,
    creditEnabled: true,
    previewClickMode: "double",
    maxLiveFrames: 3,
    maxOpenTabs: 50,
    paneSizes: { sidebar: 216, listRatio: 0.35 }
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
    const isCurrentSchema = source.schemaVersion === DEFAULT_SETTINGS.schemaVersion;
    const paneSizes = source.paneSizes && typeof source.paneSizes === "object" ? source.paneSizes : {};
    return {
      ...DEFAULT_SETTINGS,
      enabled: true,
      layoutPreference: source.layoutPreference === "two" || source.layoutPreference === "three" ? source.layoutPreference : "auto",
      tabsEnabled: source.tabsEnabled !== false,
      restoreSession: isCurrentSchema && source.restoreSession === true,
      hidePosters: source.hidePosters !== false,
      colorizeTabs: source.colorizeTabs !== false,
      previewEnabled: source.previewEnabled === true,
      creditEnabled: source.creditEnabled !== false,
      previewClickMode: source.previewClickMode === "single" ? "single" : "double",
      maxLiveFrames: clampSetting(source.maxLiveFrames, 1, 10, DEFAULT_SETTINGS.maxLiveFrames),
      maxOpenTabs: clampSetting(source.maxOpenTabs, 5, 50, DEFAULT_SETTINGS.maxOpenTabs),
      paneSizes: {
        sidebar: clampSetting(paneSizes.sidebar, 160, 360, DEFAULT_SETTINGS.paneSizes.sidebar),
        listRatio: clampRatio(paneSizes.listRatio, DEFAULT_SETTINGS.paneSizes.listRatio)
      }
    };
  }
  function clampSetting(value, min, max, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? Math.round(Math.min(max, Math.max(min, value))) : fallback;
  }
  function clampRatio(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? Math.min(0.7, Math.max(0.3, value)) : fallback;
  }

  // src/discourse/category.ts
  function normalizeCategoryColor(value) {
    if (typeof value !== "string") return null;
    const color = value.trim();
    return /^(?:#[\da-f]{3,8}|rgba?\([\d\s.,%+-]+\)|hsla?\([\d\s.,%+-]+\))$/i.test(color) ? color : null;
  }
  function readWrapperCategory(wrapper, view) {
    const htmlWrapper = wrapper;
    const categoryName = wrapper.querySelector(".badge-category__name")?.textContent?.trim() ?? "";
    const categoryColor = normalizeCategoryColor(
      htmlWrapper.style?.getPropertyValue("--category-badge-color") || view?.getComputedStyle(htmlWrapper).getPropertyValue("--category-badge-color")
    );
    return categoryName && categoryColor ? { categoryName, categoryColor } : null;
  }
  function readTopicCategory(root, view = typeof window === "undefined" ? null : window) {
    const realm = view;
    const rootElement = realm?.Element && root instanceof realm.Element ? root : null;
    const wrappers = rootElement?.matches(".badge-category__wrapper") ? [rootElement] : [...root.querySelectorAll(".badge-category__wrapper")];
    for (const wrapper of wrappers) {
      const category = readWrapperCategory(wrapper, view);
      if (category) return category;
    }
    return null;
  }
  function readTopicDocumentCategory(document2, view = document2.defaultView) {
    let pendingName = "";
    const metadata = document2.querySelectorAll(
      'meta[property="og:article:section"], meta[property="og:article:section:color"]'
    );
    for (const meta of metadata) {
      if (meta.getAttribute("property") === "og:article:section") {
        pendingName = meta.content.trim();
        continue;
      }
      const rawColor = meta.content.trim();
      const categoryColor = normalizeCategoryColor(/^[\da-f]{3,8}$/i.test(rawColor) ? `#${rawColor}` : rawColor);
      if (pendingName && categoryColor) return { categoryName: pendingName, categoryColor };
      pendingName = "";
    }
    const topicCategory = document2.querySelector(".topic-category");
    return topicCategory ? readTopicCategory(topicCategory, view) : null;
  }

  // src/core/session.ts
  var MAX_TABS = 50;
  function normalizePaneSizes(value) {
    if (!value || typeof value !== "object") return { ...DEFAULT_SETTINGS.paneSizes };
    const candidate = value;
    return {
      sidebar: clampNumber(candidate.sidebar, 160, 360, DEFAULT_SETTINGS.paneSizes.sidebar),
      listRatio: clampRatio2(candidate.listRatio, DEFAULT_SETTINGS.paneSizes.listRatio)
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
      ...typeof tab.categoryName === "string" && tab.categoryName.trim() && normalizeCategoryColor(tab.categoryColor) ? { categoryName: tab.categoryName.trim(), categoryColor: normalizeCategoryColor(tab.categoryColor) } : {},
      ...typeof tab.postNumber === "number" && Number.isFinite(tab.postNumber) ? { postNumber: Math.max(1, Math.floor(tab.postNumber)) } : {},
      scrollY: clampNumber(tab.scrollY, 0, 1e7, 0),
      suspended: tab.suspended === true,
      lastActiveAt: clampNumber(tab.lastActiveAt, 0, Number.MAX_SAFE_INTEGER, 0)
    };
  }
  function createSession(sessionId, listUrl, now) {
    return {
      schemaVersion: SESSION_SCHEMA_VERSION,
      sessionId,
      listUrl,
      listScrollY: 0,
      layoutMode: "native",
      paneSizes: { ...DEFAULT_SETTINGS.paneSizes },
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
    const uniqueTabs = Array.from(new Map(tabs.map((tab) => [tab.topicId, tab])).values()).sort((a, b) => a.lastActiveAt - b.lastActiveAt).slice(-MAX_TABS);
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
      paneSizes: normalizePaneSizes(source.paneSizes),
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
      ...input.categoryName && input.categoryColor ? { categoryName: input.categoryName, categoryColor: input.categoryColor } : {},
      scrollY: 0,
      suspended: false,
      lastActiveAt: now
    };
    const tabs = [...session.tabs.filter((tab) => tab.topicId !== input.topicId), nextTab].sort((a, b) => a.lastActiveAt - b.lastActiveAt).slice(-MAX_TABS);
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
    setMaxLiveFrames(value) {
      this.liveLimit = Math.max(1, Math.min(10, Math.floor(value)));
      this.suspendOverflow("");
    }
    setPreviewConfig(config) {
      this.previewConfig = { ...config };
      for (const record of this.frames.values()) this.sendPreviewConfig(record.iframe);
    }
    activate(tab, now) {
      const record = this.ensureRecord(tab, now);
      for (const [tabId, current] of this.frames) {
        const active = tabId === tab.id;
        current.iframe.setAttribute("aria-hidden", String(!active));
        current.iframe.tabIndex = active ? 0 : -1;
      }
      this.suspendOverflow(tab.id);
      return record.iframe;
    }
    prepare(tab, now) {
      const activeTabId = [...this.frames.entries()].find(([, current]) => current.iframe.getAttribute("aria-hidden") === "false")?.[0] ?? "";
      const record = this.ensureRecord(tab, now);
      if (tab.id !== activeTabId) {
        record.iframe.setAttribute("aria-hidden", "true");
        record.iframe.tabIndex = -1;
      }
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
          this.restoreScroll(current);
          this.sendPreviewConfig(iframe);
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
          commands: [],
          loadListener,
          restoreScrollY: tab.scrollY,
          restoreTimer: null,
          restoreDeadline: 0
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
          record.restoreScrollY = tab.scrollY;
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
        this.restoreScroll(record);
        this.sendPreviewConfig(record.iframe);
        this.flushCommands(record);
      }
      this.onMessage(data, record.iframe);
    }
    remove(tabId) {
      const record = this.frames.get(tabId);
      if (!record) return;
      record.commands = [];
      this.cancelScrollRestore(record);
      record.iframe.removeEventListener("load", record.loadListener);
      record.iframe.remove();
      this.frames.delete(tabId);
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
      this.cancelScrollRestore(record);
      record.iframe.removeEventListener("load", record.loadListener);
      record.iframe.remove();
      this.frames.delete(tabId);
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
        this.restoreScroll(current);
        this.sendPreviewConfig(iframe);
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
        restoreScrollY: tab.scrollY,
        restoreTimer: null,
        restoreDeadline: 0
      };
      this.frames.set(tab.id, record);
      this.container.append(iframe);
      this.activate(tab, now);
      return iframe;
    }
    destroy() {
      for (const record of this.frames.values()) {
        record.commands = [];
        this.cancelScrollRestore(record);
        record.iframe.removeEventListener("load", record.loadListener);
        record.iframe.remove();
      }
      this.frames.clear();
    }
    sendPreviewConfig(iframe) {
      iframe.contentWindow?.postMessage({ type: "ldu:preview-config", ...this.previewConfig }, location.origin);
    }
    flushCommands(record) {
      const commands = record.commands.splice(0);
      for (const command of commands) record.iframe.contentWindow?.postMessage(command, location.origin);
    }
    restoreScroll(record) {
      const target = record.restoreScrollY;
      if (target <= 0 || !record.iframe.contentWindow) return;
      if (record.restoreTimer !== null) window.clearTimeout(record.restoreTimer);
      if (record.restoreDeadline === 0) record.restoreDeadline = Date.now() + 5e3;
      record.iframe.contentWindow.scrollTo({ top: target, behavior: "instant" });
      if (Math.abs(record.iframe.contentWindow.scrollY - target) <= 2 || Date.now() >= record.restoreDeadline) {
        record.restoreScrollY = 0;
        record.restoreDeadline = 0;
        record.restoreTimer = null;
        return;
      }
      record.restoreTimer = window.setTimeout(() => {
        record.restoreTimer = null;
        if ([...this.frames.values()].includes(record)) this.restoreScroll(record);
      }, 100);
    }
    cancelScrollRestore(record) {
      if (record.restoreTimer !== null) window.clearTimeout(record.restoreTimer);
      record.restoreTimer = null;
      record.restoreDeadline = 0;
    }
    suspendOverflow(activeTabId) {
      while (this.frames.size > this.liveLimit) {
        const candidates = [...this.frames.entries()].filter(([tabId2]) => tabId2 !== activeTabId).sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt);
        const candidate = candidates[0];
        if (!candidate) return;
        const [tabId, record] = candidate;
        record.commands = [];
        this.cancelScrollRestore(record);
        record.iframe.removeEventListener("load", record.loadListener);
        record.iframe.remove();
        this.frames.delete(tabId);
        this.onSuspend(tabId, record.iframe);
      }
    }
  };

  // src/tabs/list-frame.ts
  var ListFrameController = class {
    constructor(container, frameId, onMessage) {
      this.container = container;
      this.frameId = frameId;
      this.onMessage = onMessage;
    }
    iframe = null;
    reportedUrl = "";
    frameConfig = { enabled: false, clickMode: "double", hidePosters: true };
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
          this.sendPreviewConfig(iframe);
          this.onMessage({ type: "ldu:list-ready", frameId: this.frameId, url: iframe.src }, iframe);
        });
        this.iframe = iframe;
        this.container.append(iframe);
      }
      const requestedUrl = this.resolveSameOrigin(url) ?? new URL("/", location.href);
      const requested = requestedUrl.href;
      if (this.iframe.src !== requested && this.reportedUrl !== requested) {
        this.reportedUrl = "";
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
      this.frameConfig = { ...config };
      if (this.iframe) this.sendPreviewConfig(this.iframe);
    }
    handleMessage(event) {
      const data = event.data;
      if (!data || !["ldu:list-ready", "ldu:list-state", "ldu:list-interaction", "ldu:list-topic-open", "ldu:list-navigate", "ldu:list-preview-open", "ldu:list-preview-dismiss"].includes(data.type ?? "")) return;
      if (data.frameId !== this.frameId || !this.iframe || event.source !== this.iframe.contentWindow || event.origin !== location.origin) return;
      if ((data.type === "ldu:list-ready" || data.type === "ldu:list-state") && data.url) {
        try {
          this.reportedUrl = new URL(data.url, document.baseURI).href;
        } catch {
          this.reportedUrl = "";
        }
      }
      this.onMessage(data, this.iframe);
    }
    sendPreviewConfig(iframe) {
      iframe.contentWindow?.postMessage({ type: "ldu:preview-config", ...this.frameConfig }, location.origin);
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
    }
  };

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
  function resolveTabCategoryColor(title, root = document) {
    const titleWithoutSite = title.replace(/\s+-\s+LINUX DO(?:\s.*)?$/i, "");
    const matches = [...root.querySelectorAll('.sidebar-wrapper a[href^="/c/"], .sidebar-wrapper a[href*="linux.do/c/"]')].map((link) => {
      const name = link.textContent?.trim() ?? "";
      const matchesTitle = name && (titleWithoutSite.endsWith(` - ${name}`) || titleWithoutSite.includes(` - ${name} / `) || titleWithoutSite.endsWith(` / ${name}`));
      if (!matchesTitle) return null;
      const icon = link.querySelector(".sidebar-section-link-prefix.icon, .sidebar-section-link-prefix, .sidebar-section-link-icon");
      const color = icon ? root.defaultView?.getComputedStyle(icon).color.trim() : "";
      return color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)" ? { name, color } : null;
    }).filter((match) => match !== null).sort((a, b) => a.name.length - b.name.length);
    return matches[0]?.color ?? null;
  }
  function renderTabStrip(root, tabs, activeTabId, callbacks, options = {}) {
    root.replaceChildren();
    root.classList.remove("is-reordering");
    root.classList.toggle("is-category-colors-enabled", options.colorizeTabs !== false);
    let draggedTabId = null;
    let dropTarget = null;
    let dragMetrics = null;
    let insertionIndex = null;
    const clearDragState = () => {
      root.querySelectorAll(".is-dragging, .is-drop-before, .is-drop-after").forEach((item) => {
        item.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
        item.setAttribute("aria-grabbed", "false");
        item.style.transform = "";
      });
      root.classList.remove("is-reordering");
      draggedTabId = null;
      dropTarget = null;
      dragMetrics = null;
      insertionIndex = null;
    };
    const updateDragPosition = (clientX) => {
      if (!draggedTabId || !dragMetrics) return;
      const source = dragMetrics.find((metric) => metric.tabId === draggedTabId);
      if (!source) return;
      const available = dragMetrics.filter((metric) => metric.tabId !== draggedTabId);
      const nextInsertionIndex = available.filter((metric) => clientX >= metric.center).length;
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
        metric.item.style.transform = offset ? `translate3d(${offset}px, 0, 0)` : "";
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
      const items = [...root.querySelectorAll(".ldu-tab-item[data-tab-id]")];
      const rects = items.map((candidate) => candidate.getBoundingClientRect());
      dragMetrics = items.map((candidate, index) => {
        const rect = rects[index];
        const nextRect = rects[index + 1];
        const previousRect = rects[index - 1];
        const gap = nextRect ? Math.max(0, nextRect.left - rect.right) : previousRect ? Math.max(0, rect.left - previousRect.right) : 0;
        return {
          tabId: candidate.dataset.tabId,
          item: candidate,
          index,
          center: rect.left + rect.width / 2,
          shift: rect.width + gap
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
      if (Number.isFinite(event.clientX)) updateDragPosition(event.clientX);
    };
    root.ondrop = (event) => {
      if (!draggedTabId || !dragMetrics) return;
      event.preventDefault();
      if (Number.isFinite(event.clientX)) updateDragPosition(event.clientX);
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
    const focusTab = (index) => {
      const buttons = root.querySelectorAll(".ldu-tab-button");
      buttons[Math.min(buttons.length - 1, Math.max(0, index))]?.focus();
    };
    tabs.forEach((tab, index) => {
      const item = document.createElement("div");
      item.className = "ldu-tab-item";
      item.dataset.tabId = tab.id;
      item.draggable = Boolean(callbacks.onReorder);
      item.setAttribute("role", "presentation");
      item.setAttribute("aria-grabbed", "false");
      item.classList.toggle("is-active", tab.id === activeTabId);
      item.title = `${tab.title}
${tab.url}`;
      item.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        callbacks.onContextMenu?.(tab.id, event.clientX, event.clientY);
      });
      const categoryColor = tab.categoryColor || resolveTabCategoryColor(tab.title, root.ownerDocument);
      if (categoryColor) item.style.setProperty("--ldu-tab-category-color", categoryColor);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ldu-tab-button";
      button.textContent = tab.title || `\u4E3B\u9898 ${tab.topicId}`;
      button.id = `ldu-tab-${tab.id}`;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(tab.id === activeTabId));
      button.tabIndex = tab.id === activeTabId ? 0 : -1;
      button.setAttribute("aria-label", `\u6253\u5F00 ${button.textContent}`);
      button.addEventListener("click", () => callbacks.onActivate(tab.id));
      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const next = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
          callbacks.onActivate(tabs[next].id);
          focusTab(next);
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          const next = event.key === "Home" ? 0 : tabs.length - 1;
          callbacks.onActivate(tabs[next].id);
          focusTab(next);
        } else if (event.key === "Delete") {
          event.preventDefault();
          callbacks.onClose(tab.id);
        }
      });
      const close = document.createElement("button");
      close.type = "button";
      close.className = "ldu-tab-close";
      close.draggable = false;
      setIcon(close, "close", 16);
      close.title = "\u5173\u95ED\u5E16\u5B50\u6807\u7B7E";
      close.setAttribute("aria-label", `\u5173\u95ED ${button.textContent}`);
      close.addEventListener("click", (event) => {
        event.stopPropagation();
        callbacks.onClose(tab.id);
      });
      item.append(button, close);
      root.append(item);
    });
  }

  // src/ui/styles.ts
  var APP_STYLE_ID = "linuxdo-ultimate-styles";
  var APP_STYLES = `
:root {
  --ldu-sidebar-width: 216px;
  --ldu-topic-track: 0.65fr;
  --ldu-list-track: 0.35fr;
  --ldu-header-height: 52px;
  --ldu-border: var(--primary-low, #d9d9d9);
  --ldu-surface: var(--secondary, #fff);
  --ldu-surface-muted: var(--primary-very-low, #f5f5f5);
  --ldu-text: var(--primary, #222);
  --ldu-accent: var(--tertiary, #0088cc);
  --ldu-danger: var(--danger, #d04437);
  --ldu-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
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

body.ldu-hide-posters #main-outlet .topic-list .posters {
  display: none !important;
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

.ldu-topic-toolbar {
  display: flex;
  min-height: 38px;
  align-items: center;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
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

.ldu-preview-container {
  position: fixed;
  z-index: 1000000;
  display: flex;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 24px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ldu-border);
  border-radius: 6px;
  background: var(--ldu-surface);
  box-shadow: 0 12px 32px rgb(0 0 0 / 22%);
}

.ldu-preview-header {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-left: 12px;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.ldu-preview-dragging .ldu-preview-header { cursor: grabbing; }

.ldu-preview-title {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ldu-preview-actions { display: flex; flex: none; align-items: center; padding-right: 4px; }
.ldu-preview-actions button,
.ldu-preview-actions a { cursor: pointer; }
.ldu-preview-actions a { text-decoration: none; }
.ldu-preview-frame { display: block; width: 100%; min-height: 0; flex: 1; border: 0; background: #fff; }

.ldu-preview-status {
  position: absolute;
  inset: 38px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: var(--ldu-surface);
  color: var(--primary-medium, #666);
  font-size: var(--font-down-1, .875rem);
  text-align: center;
  transition: opacity 130ms ease;
}

.ldu-preview-status.is-hidden { visibility: hidden; opacity: 0; pointer-events: none; }
.ldu-preview-status.is-error { color: var(--ldu-danger); }
.ldu-preview-spinner {
  width: 18px;
  height: 18px;
  flex: none;
  border: 2px solid var(--ldu-border);
  border-top-color: var(--ldu-accent);
  border-radius: 50%;
  animation: ldu-preview-spin .75s linear infinite;
}
.ldu-preview-status.is-error .ldu-preview-spinner { display: none; }
@keyframes ldu-preview-spin { to { transform: rotate(360deg); } }

.ldu-preview-status.is-fallback {
  align-items: stretch;
  overflow-y: auto;
  color: var(--ldu-text);
  text-align: left;
}

.ldu-preview-fallback-card {
  width: min(560px, 100%);
  margin: auto;
}

.ldu-preview-fallback-image {
  display: block;
  width: min(96px, 24%);
  max-height: 96px;
  margin-bottom: 16px;
  object-fit: contain;
}

.ldu-preview-fallback-site {
  margin-bottom: 6px;
  color: var(--primary-medium, #666);
  font-size: var(--font-down-1, .875rem);
}

.ldu-preview-fallback-card h3 {
  margin: 0 0 10px;
  font-size: var(--font-up-1, 1.125rem);
  line-height: 1.35;
}

.ldu-preview-fallback-card p { margin: 0; line-height: 1.6; }
.ldu-preview-fallback-note {
  margin-top: 18px !important;
  color: var(--primary-medium, #666);
  font-size: var(--font-down-1, .875rem);
}

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
  overflow: hidden;
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
  margin: 0;
  padding: 0;
  color: var(--ldu-text);
  font-size: var(--font-up-1, 1.05rem);
  font-weight: 700;
  line-height: 1.3;
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
  font-size: var(--font-0, 1rem);
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
.ldu-settings-panel .dc-label-box { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.ldu-settings-panel .dc-item-title { color: var(--ldu-text); font-size: var(--font-down-1, .875rem); font-weight: 600; line-height: 1.3; }
.ldu-settings-panel .dc-item-desc { color: var(--primary-medium, #8b949e); font-size: var(--font-down-2, .75rem); line-height: 1.35; }
.ldu-settings-panel .dc-item-desc.alert { color: var(--danger, #f85149); }
.ldu-settings-panel .ldu-settings-risk[hidden] { display: none; }

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
.ldu-settings-panel .dc-btn:hover { border-color: var(--primary-medium, #777); background: var(--primary-low, #2a2d32); }
.ldu-settings-panel .dc-btn-ghost { border-color: transparent; background: transparent; color: var(--primary-medium, #8b949e); }
.ldu-settings-panel .dc-btn-ghost:hover { border-color: transparent; background: color-mix(in srgb, var(--danger, #e45735) 10%, transparent); color: var(--danger, #e45735); }
.ldu-settings-panel .dc-footer-right { position: relative; display: flex; gap: 8px; }
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

html[data-ldu-embedded-topic="true"] #d-sidebar,
html[data-ldu-embedded-topic="true"] .sidebar-wrapper,
html[data-ldu-embedded-topic="true"] .d-header {
  display: none !important;
}

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

html[data-ldu-embedded-list="true"][data-ldu-hide-posters="true"] #main-outlet .topic-list .posters {
  display: none !important;
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

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .show-summary {
  grid-column: 1 / -1 !important;
  width: 100% !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .reply-to-post,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button > button {
  width: 100% !important;
}

html[data-ldu-embedded-topic="true"] #main-outlet {
  padding: 12px clamp(12px, 3vw, 40px) max(12px, env(safe-area-inset-bottom)) !important;
}

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
  .ldu-preview-spinner { animation-duration: 1.5s; }
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
      this.hidePosters = options.hidePosters;
    }
    shell = null;
    panel = null;
    content = null;
    secondaryPanel = null;
    secondaryContent = null;
    listContent = null;
    preference;
    paneSizes;
    hidePosters;
    open = false;
    secondaryOpen = false;
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
      } else if (this.shell.parentElement !== document.body) {
        document.body.append(this.shell);
      }
      document.body.classList.toggle("ldu-hide-posters", this.hidePosters);
      this.apply();
      return true;
    }
    destroy() {
      window.removeEventListener("resize", this.resizeListener);
      this.shell?.remove();
      this.shell = null;
      this.panel = null;
      this.content = null;
      this.secondaryPanel = null;
      this.secondaryContent = null;
      this.listContent = null;
      this.open = false;
      this.secondaryOpen = false;
      document.body.classList.remove("ldu-layout-active", "ldu-layout-two", "ldu-layout-three", "ldu-hide-posters", "ldu-secondary-open");
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
    setPaneSizes(paneSizes) {
      this.paneSizes = { ...paneSizes };
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
    setHidePosters(hide) {
      this.hidePosters = hide;
      document.body.classList.toggle("ldu-hide-posters", hide);
    }
    getMode() {
      return this.open ? resolveLayoutMode(this.preference, window.innerWidth) : "native";
    }
    apply() {
      if (!this.panel || !this.secondaryPanel || !this.shell) return;
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
      document.documentElement.style.setProperty("--ldu-sidebar-width", `${this.paneSizes.sidebar}px`);
      document.documentElement.style.setProperty("--ldu-topic-track", `${1 - this.paneSizes.listRatio}fr`);
      document.documentElement.style.setProperty("--ldu-topic-split-track", `${(1 - this.paneSizes.listRatio) / 2}fr`);
      document.documentElement.style.setProperty("--ldu-list-track", `${this.paneSizes.listRatio}fr`);
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
        <div class="ldu-topic-actions"></div>
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
        if (side === "before" && mode === "three" && document.body.classList.contains("has-sidebar-page")) {
          this.paneSizes.sidebar = event.key === "Home" ? 160 : event.key === "End" ? 360 : Math.min(360, Math.max(160, this.paneSizes.sidebar + direction * 12));
        } else if (side === "after" && mode === "three" || side === "before" && mode === "two") {
          const ratioDirection = mode === "three" ? -direction : direction;
          this.paneSizes.listRatio = event.key === "Home" ? 0.3 : event.key === "End" ? 0.7 : clampRatio3(this.paneSizes.listRatio + ratioDirection * 0.02);
        } else {
          return;
        }
        this.apply();
        this.options.onPaneSizesChange?.({ ...this.paneSizes });
      });
      handle.addEventListener("pointerdown", (event) => {
        if (!(event instanceof PointerEvent) || event.button !== 0) return;
        const startX = event.clientX;
        const start = { ...this.paneSizes };
        handle.setPointerCapture(event.pointerId);
        const move = (moveEvent) => {
          const delta = moveEvent.clientX - startX;
          const mode = this.getMode();
          const wrapper = this.panel?.parentElement;
          const availableWidth = Math.max(1, (wrapper?.clientWidth ?? window.innerWidth) - this.paneSizes.sidebar);
          if (side === "after" && mode === "three") {
            this.paneSizes.listRatio = clampRatio3(start.listRatio - delta / availableWidth);
          } else if (side === "before" && mode === "two") {
            this.paneSizes.listRatio = clampRatio3(start.listRatio + delta / availableWidth);
          } else if (side === "before" && mode === "three" && document.body.classList.contains("has-sidebar-page")) {
            this.paneSizes.sidebar = Math.round(Math.min(360, Math.max(160, start.sidebar + delta)));
          }
          this.apply();
        };
        const finish = () => {
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", finish);
          handle.removeEventListener("pointercancel", finish);
          this.options.onPaneSizesChange?.({ ...this.paneSizes });
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", finish);
        handle.addEventListener("pointercancel", finish);
      });
    }
    updateSeparatorValues() {
      if (!this.panel) return;
      const mode = this.getMode();
      const before = this.panel.querySelector(".ldu-resize-before");
      const after = this.panel.querySelector(".ldu-resize-after");
      const set = (handle, value, min, max) => {
        if (!handle) return;
        handle.setAttribute("aria-valuemin", String(min));
        handle.setAttribute("aria-valuemax", String(max));
        handle.setAttribute("aria-valuenow", String(value));
      };
      if (mode === "three" && document.body.classList.contains("has-sidebar-page")) {
        set(before, this.paneSizes.sidebar, 160, 360);
      } else {
        set(before, Math.round(this.paneSizes.listRatio * 100), 30, 70);
      }
      set(after, Math.round(this.paneSizes.listRatio * 100), 30, 70);
    }
  };
  function clampRatio3(value) {
    return Math.round(Math.min(0.7, Math.max(0.3, value)) * 1e3) / 1e3;
  }

  // src/ui/settings-panel.ts
  var SettingsPanel = class {
    constructor(host, settings, callbacks) {
      this.host = host;
      this.settings = settings;
      this.callbacks = callbacks;
    }
    panel = null;
    toggleButton = null;
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
          <h2 class="ldu-settings-heading">Ultimate Linux Do \u8BBE\u7F6E</h2>
          <button type="button" class="dc-close-btn ldu-settings-close" title="\u5173\u95ED" aria-label="\u5173\u95ED\u8BBE\u7F6E">${iconSvg("close", 16)}</button>
        </header>
        <div class="dc-body">
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-layout-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-layout-heading">\u5E03\u5C40</div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u542F\u7528\u5206\u5C4F\u6A21\u5F0F</span>
                <span class="dc-item-desc">\u63A7\u5236\u5206\u5C4F\u9605\u8BFB\u548C\u9875\u5185\u5E16\u5B50\u6807\u7B7E\u529F\u80FD</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="tabsEnabled"><span class="dc-slider"></span></span>
            </label>
            <div class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u5E16\u5B50\u8BE6\u60C5\u9875\u4F4D\u7F6E</span>
                <span class="dc-item-desc">\u81EA\u52A8\u6A21\u5F0F\u5C06\u7531\u5C4F\u5E55\u53EF\u7528\u6A2A\u5411\u7A7A\u95F4\u51B3\u5B9A</span>
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
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u4E0B\u6B21\u8BBF\u95EE\u65F6\u6062\u590D\u4E0A\u6B21\u6253\u5F00\u7684\u5E16\u5B50</span>
                <span class="dc-item-desc">\u5173\u95ED\u6D4F\u89C8\u5668\u6807\u7B7E\u9875\u540E\u91CD\u65B0\u8FDB\u5165\u65F6\u6062\u590D\u4E0A\u6B21\u9605\u8BFB\u72B6\u6001</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="restoreSession"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u9690\u85CF\u8BDD\u9898\u5217\u8868\u4E2D\u7684\u7528\u6237\u5934\u50CF\u5217</span>
                <span class="dc-item-desc">\u9690\u85CF\u53C2\u4E0E\u8005\u5934\u50CF\u5217\uFF0C\u4E3A\u6807\u9898\u817E\u51FA\u66F4\u591A\u7A7A\u95F4</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="hidePosters"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u6309\u5206\u7C7B\u4E3A\u5E16\u5B50\u6807\u7B7E\u4E0A\u8272</span>
                <span class="dc-item-desc">\u4F7F\u7528\u5E16\u5B50\u6240\u5C5E\u5206\u7C7B\u56FE\u6807\u989C\u8272\u4E3A\u6807\u7B7E\u6DFB\u52A0\u80CC\u666F\u8272</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="colorizeTabs"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u6700\u591A\u4FDD\u7559\u6D3B\u52A8\u9875\u9762</span>
                <span class="dc-item-desc">\u9650\u5236\u540C\u65F6\u4FDD\u7559\u5728\u5185\u5B58\u4E2D\u7684\u5E16\u5B50\u9875\u9762\u6570\u91CF</span>
              </span>
              <span class="dc-range-group ldu-settings-range-control"><input type="range" class="dc-range" data-setting="maxLiveFrames" min="1" max="10" step="1"><output class="dc-range-number" data-output="maxLiveFrames"></output></span>
            </label>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-tools-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-tools-heading">\u5B9E\u7528\u5DE5\u5177</div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u542F\u7528\u94FE\u63A5\u60AC\u6D6E\u9884\u89C8</span>
                <span class="dc-item-desc alert ldu-settings-risk" data-depends-on="previewEnabled" role="note">\u9884\u89C8\u9875\u9762\u4F1A\u8FD0\u884C\u76EE\u6807\u7F51\u7AD9\u811A\u672C\uFF0C\u8BF7\u53EA\u9884\u89C8\u53EF\u4FE1\u94FE\u63A5\u3002</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="previewEnabled"><span class="dc-slider"></span></span>
            </label>
            <div class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="previewEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u9884\u89C8\u89E6\u53D1\u65B9\u5F0F</span>
                <span class="dc-item-desc">\u9009\u62E9\u89E6\u53D1\u60AC\u6D6E\u9884\u89C8\u7A97\u53E3\u7684\u64CD\u4F5C\u65B9\u5F0F</span>
              </span>
              <div class="dc-pills" data-pills-setting="previewClickMode">
                <button type="button" class="dc-pill-btn" data-val="double">\u53CC\u51FB</button>
                <button type="button" class="dc-pill-btn" data-val="single">\u5355\u51FB</button>
              </div>
            </div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u5728\u9876\u90E8\u663E\u793A LDC \u6536\u5165</span>
                <span class="dc-item-desc">\u5728\u9876\u90E8\u5BFC\u822A\u6761\u8BED\u8A00\u5207\u6362\u65C1\u663E\u793A\u6536\u5165\u503C\uFF0C\u70B9\u51FB\u53EF\u5237\u65B0</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="creditEnabled"><span class="dc-slider"></span></span>
            </label>
          </section>
        </div>
        <footer class="dc-footer ldu-settings-footer">
          <button type="button" class="dc-btn dc-btn-ghost ldu-settings-reset">\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E</button>
          <div class="dc-footer-right ldu-settings-actions">
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
      panel.querySelectorAll(".ldu-donate-menu a").forEach((link) => {
        link.addEventListener("click", () => this.setDonationMenuOpen(false));
      });
      document.addEventListener("pointerdown", (event) => {
        if (!this.panel?.hidden && !this.host.contains(event.target)) this.setPanelOpen(false);
      }, true);
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const menu = this.panel?.querySelector(".ldu-donate-menu");
        if (menu && !menu.hidden) {
          this.setDonationMenuOpen(false);
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
    sync() {
      if (!this.panel) return;
      const tabs = this.panel.querySelector('[data-setting="tabsEnabled"]');
      const restore = this.panel.querySelector('[data-setting="restoreSession"]');
      const posters = this.panel.querySelector('[data-setting="hidePosters"]');
      const colorizeTabs = this.panel.querySelector('[data-setting="colorizeTabs"]');
      const preview = this.panel.querySelector('[data-setting="previewEnabled"]');
      const credit = this.panel.querySelector('[data-setting="creditEnabled"]');
      const live = this.panel.querySelector('[data-setting="maxLiveFrames"]');
      const output = this.panel.querySelector('[data-output="maxLiveFrames"]');
      if (tabs) tabs.checked = this.settings.tabsEnabled;
      if (restore) restore.checked = this.settings.restoreSession;
      if (posters) posters.checked = this.settings.hidePosters;
      if (colorizeTabs) colorizeTabs.checked = this.settings.colorizeTabs;
      if (preview) preview.checked = this.settings.previewEnabled;
      if (credit) credit.checked = this.settings.creditEnabled;
      if (live) live.value = String(this.settings.maxLiveFrames);
      if (output) output.value = String(this.settings.maxLiveFrames);
      this.syncPills("layoutPreference", this.settings.layoutPreference);
      this.syncPills("previewClickMode", this.settings.previewClickMode);
      this.syncDependencies();
    }
    readControl(control) {
      const key = control.dataset.setting;
      if (!key || key === "schemaVersion" || key === "paneSizes") return;
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
      if (!key || !value || key === "schemaVersion" || key === "paneSizes") return;
      this.settings = { ...this.settings, [key]: value };
      this.syncPills(key, value);
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
        row.hidden = !key || this.settings[key] !== true;
      });
    }
    setPanelOpen(open) {
      if (!this.panel) return;
      this.panel.hidden = !open;
      this.toggleButton?.setAttribute("aria-expanded", String(open));
      if (!open) this.setDonationMenuOpen(false);
    }
    setDonationMenuOpen(open) {
      const menu = this.panel?.querySelector(".ldu-donate-menu");
      const button = this.panel?.querySelector(".ldu-settings-donate");
      if (menu) menu.hidden = !open;
      button?.setAttribute("aria-expanded", String(open));
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
    open(tabId, clientX, clientY, splitDisabled = false) {
      this.close();
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
      const rect = root.getBoundingClientRect();
      const margin = 8;
      root.style.left = `${Math.max(margin, Math.min(clientX, window.innerWidth - rect.width - margin))}px`;
      root.style.top = `${Math.max(margin, Math.min(clientY, window.innerHeight - rect.height - margin))}px`;
      document.addEventListener("pointerdown", this.onOutsidePointer, true);
      document.addEventListener("keydown", this.onKeyDown, true);
      root.querySelector("button:not(:disabled)")?.focus();
    }
    close() {
      document.removeEventListener("pointerdown", this.onOutsidePointer, true);
      document.removeEventListener("keydown", this.onKeyDown, true);
      this.root?.remove();
      this.root = null;
    }
    destroy() {
      this.close();
    }
  };

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
    const WINDOW_MARGIN = 8;
    const IS_TOP = window.self === window.top;
    const PREVIEW_FRAME_PREFIX = "agy-preview-frame:";
    const IS_PREVIEW_FRAME = window.name.startsWith(PREVIEW_FRAME_PREFIX);
    function isPreviewRefreshKey(e) {
      return e.key === "F5" || e.code === "F5" || e.keyCode === 116;
    }
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
            align-items: center !important;
            min-width: 0 !important;
            height: 100% !important;
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
            flex: 0 0 auto !important;
            align-self: center !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            vertical-align: middle !important;
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
    let isSingleClickPreviewEnabled = options.clickMode ? options.clickMode() === "single" : false;
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
    let linuxTopicScanTimer = null;
    const pendingLinuxTopicRows = /* @__PURE__ */ new Set();
    let linuxTopicEnhancementInstalled = false;
    let isPreviewMaximized = loadPreviewMaximizedState();
    const cacheMap = /* @__PURE__ */ new Map();
    let cacheCleanupTimer = null;
    let cacheCleanupDeadline = 0;
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
      linuxTopicScanTimer = null;
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
      if (linuxTopicScanTimer !== null) return;
      linuxTopicScanTimer = setTimeout(scanLinuxTopicRows, 0);
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
        /* LDU ADAPTATION: compact Linux Do page CSS is only injected inside previews. */
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
    }
    document.addEventListener("click", handleLinkClick, true);
    document.addEventListener("dblclick", handleLinkDblClick, true);
    if (IS_TOP) {
      document.addEventListener("mouseover", handleMouseOverPreheat, true);
    }
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
    function clearCacheCleanupTimer() {
      if (cacheCleanupTimer) clearTimeout(cacheCleanupTimer);
      cacheCleanupTimer = null;
      cacheCleanupDeadline = 0;
    }
    function scheduleCacheCleanup() {
      let deadline = Infinity;
      for (const entry of cacheMap.values()) {
        if (entry.status === "loading") continue;
        deadline = Math.min(deadline, entry.time + CACHE_EXPIRE_TIME);
      }
      if (!Number.isFinite(deadline)) {
        clearCacheCleanupTimer();
        return;
      }
      if (cacheCleanupTimer && cacheCleanupDeadline === deadline) return;
      clearCacheCleanupTimer();
      cacheCleanupDeadline = deadline;
      cacheCleanupTimer = setTimeout(() => {
        cacheCleanupTimer = null;
        cacheCleanupDeadline = 0;
        const now = Date.now();
        for (const [url, entry] of cacheMap) {
          if (entry.status !== "loading" && now - entry.time >= CACHE_EXPIRE_TIME) {
            cacheMap.delete(url);
          }
        }
        scheduleCacheCleanup();
      }, Math.max(0, deadline - Date.now()));
    }
    function enforceCacheLimits() {
      let totalBytes = 0;
      for (const entry of cacheMap.values()) totalBytes += entry.size || 0;
      while (cacheMap.size > CACHE_MAX_ENTRIES || totalBytes > CACHE_MAX_BYTES) {
        const oldestKey = cacheMap.keys().next().value;
        if (!oldestKey) break;
        const oldest = cacheMap.get(oldestKey);
        totalBytes -= oldest && oldest.size || 0;
        if (oldest && oldest.xhr) {
          try {
            oldest.xhr.abort();
          } catch (e) {
          }
        }
        cacheMap.delete(oldestKey);
      }
    }
    function setCache(url, entry) {
      entry.size = ((entry.html ? entry.html.length : 0) + (entry.rawHtml ? entry.rawHtml.length : 0)) * 2;
      const now = Date.now();
      for (const [k, v] of cacheMap) {
        if (v.status !== "loading" && now - v.time >= CACHE_EXPIRE_TIME) {
          cacheMap.delete(k);
        }
      }
      if (cacheMap.has(url)) cacheMap.delete(url);
      cacheMap.set(url, entry);
      enforceCacheLimits();
      scheduleCacheCleanup();
    }
    function ensurePreparedCacheEntry(url, entry) {
      if (!entry || entry.status !== "done") return null;
      if (!entry.html && typeof entry.rawHtml === "string") {
        entry.html = prepareDynamicHtml(entry.rawHtml, url, TOKEN_PLACEHOLDER);
        entry.rawHtml = null;
        entry.size = entry.html.length * 2;
        enforceCacheLimits();
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
            entry.size = ((entry.html ? entry.html.length : 0) + (entry.rawHtml ? entry.rawHtml.length : 0)) * 2;
            enforceCacheLimits();
            scheduleCacheCleanup();
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
      if (!link || link.closest(".agy-preview-container")) return;
      e.preventDefault();
      e.stopPropagation();
    }
    function cleanupAfterNextPaint(cleanup) {
      if (document.visibilityState !== "visible") {
        setTimeout(cleanup, 0);
        return;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(cleanup);
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
      const token = tab.loadToken;
      const url = tab.url;
      tab.loadState = "loading";
      delete tab.iframe.dataset.loaded;
      tab.iframe.style.visibility = "visible";
      const bar = showLoadingBar(tab);
      startLoad(tab, url, bar, token, options2);
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
      loadPreviewTab(tab);
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
      syncClickMode();
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
      actions.appendChild(refreshBtn);
      actions.appendChild(openBtn);
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
      container.classList.add("agy-preview-visible");
      loadPreviewTab(previewTabs[0]);
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
      const resolveEmbeddedUrl = (value) => {
        const raw = (value || "").trim();
        if (!raw || raw.charAt(0) === "#" || /^(?:data|blob|javascript|mailto|tel):/i.test(raw)) return value;
        try {
          return new URL(raw, baseUrl).href;
        } catch (e) {
          return value;
        }
      };
      parsed.querySelectorAll("[src], [href], [poster], [action], [formaction]").forEach((element) => {
        ["src", "href", "poster", "action", "formaction"].forEach((attribute) => {
          if (!element.hasAttribute(attribute)) return;
          element.setAttribute(attribute, resolveEmbeddedUrl(element.getAttribute(attribute)));
        });
      });
      parsed.querySelectorAll("[srcset]").forEach((element) => {
        const rewritten = (element.getAttribute("srcset") || "").split(",").map((candidate) => {
          const parts = candidate.trim().split(/\s+/);
          if (!parts[0]) return candidate;
          parts[0] = resolveEmbeddedUrl(parts[0]);
          return parts.join(" ");
        }).join(", ");
        element.setAttribute("srcset", rewritten);
      });
      const rewriteCssUrls = (css) => css.replace(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi, (match, quote, value) => {
        const resolved = resolveEmbeddedUrl(value);
        return resolved === value ? match : `url("${resolved}")`;
      });
      parsed.querySelectorAll("[style]").forEach((element) => {
        element.setAttribute("style", rewriteCssUrls(element.getAttribute("style") || ""));
      });
      parsed.querySelectorAll("style").forEach((style) => {
        style.textContent = rewriteCssUrls(style.textContent || "");
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
      clearCacheCleanupTimer();
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

  // src/preview/upstream-preview-controller.ts
  var PreviewController = class {
    constructor(options) {
      this.options = options;
    }
    api = null;
    mount() {
      if (this.api) return;
      this.api = installLinkHoverPreviewer({
        isEnabled: this.options.isEnabled,
        clickMode: this.options.clickMode,
        onClickModeChange: this.options.onClickModeChange,
        isPreviewableUrl: (url, link) => this.isPreviewable(url, link)
      });
    }
    close() {
      this.api?.close();
    }
    syncClickMode() {
      this.api?.syncClickMode();
    }
    openFromFrame(url, iframe, anchorRect) {
      if (!this.api || !this.options.isEnabled() || !this.isPreviewable(url, null)) return;
      const frameRect = iframe.getBoundingClientRect();
      const rect = anchorRect ?? { left: 0, bottom: 0 };
      this.api.openFromFrame(url, {
        left: frameRect.left + rect.left,
        top: frameRect.top + rect.bottom,
        bottom: frameRect.top + rect.bottom
      });
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
      if (!language) return;
      if (language.nextElementSibling !== this.host) language.after(this.host);
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
          console.error("[Linux.do Ultimate] LDC request failed", error);
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

  // src/app.ts
  var ROUTE_DEBOUNCE_MS = 100;
  var SESSION_MAINTENANCE_INTERVAL_MS = 30 * 6e4;
  function startLinuxDoApp() {
    if (window.self !== window.top) return;
    const start = () => new LinuxDoApp().start();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  }
  var LinuxDoApp = class {
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
    start() {
      this.settings = loadSettings(this.storage);
      ensureAppStyles();
      this.preview = new PreviewController({
        isEnabled: () => this.settings.enabled && this.settings.previewEnabled,
        clickMode: () => this.settings.previewClickMode,
        onClickModeChange: (previewClickMode) => this.applySettings({ previewClickMode })
      });
      this.preview.mount();
      this.tabContextMenu = new TabContextMenu({
        onMoveToSplit: (tabId) => this.moveTabToSecondary(tabId),
        onOpenBrowserTab: (tabId) => this.openTabInBrowser(tabId),
        onReload: (tabId) => this.reloadTab(tabId),
        onCopyLink: (tabId) => void this.copyTabLink(tabId),
        onBookmark: (tabId) => this.bookmarkTab(tabId),
        onCloseOthers: (tabId) => this.closeOtherTabs(tabId)
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
        hidePosters: this.settings.hidePosters,
        onPaneSizesChange: (paneSizes) => this.persistPaneSizes(paneSizes)
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
    handleTopicLinkClick(event) {
      if (!(event instanceof MouseEvent) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (!this.settings.enabled || !this.settings.tabsEnabled) return;
      const target = event.target;
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link) return;
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
        const row = link.closest(".topic-list-item, .latest-topic-list-item, .search-result");
        const category = row ? readTopicCategory(row) : null;
        this.openTopic(info.topicId, info.url.href, link.textContent?.trim() || `\u4E3B\u9898 ${info.topicId}`, info.postNumber, category ?? void 0);
        return;
      }
      if (!this.layout.getShellElement() || this.layout.getMode() === "native") return;
      let targetUrl;
      try {
        targetUrl = new URL(link.href, location.href);
      } catch {
        return;
      }
      if (targetUrl.origin !== location.origin || targetUrl.protocol === "javascript:" || link.target === "_blank" || link.hasAttribute("download")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.navigateList(targetUrl.href);
    }
    openTopic(topicId, url, title, postNumber, category, pane = "primary") {
      if (!this.layout.mount()) return;
      this.ensureListFrame();
      this.ensureFrames();
      this.layout.setOpen(true);
      const input = { topicId, url, title, ...postNumber ? { postNumber } : {}, ...category };
      if (pane === "secondary") this.tabStore.openSecondary(input, Date.now());
      else this.tabStore.open(input, Date.now());
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
          this.ensureListFrame();
          this.ensureFrames();
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
      this.ensureListFrame(listUrl);
      this.ensureFrames();
      this.layout.setOpen(true);
      event.preventDefault();
      event.stopImmediatePropagation();
      this.openTopic(current.topicId, current.url.href, this.currentTopicTitle(current.topicId), current.postNumber);
      if (targetRoute === "topic") {
        const target = getTopicInfo(targetUrl.href, location.href);
        if (target) this.openTopic(target.topicId, target.url.href, link.textContent?.trim() || `\u4E3B\u9898 ${target.topicId}`, target.postNumber);
      }
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
        hidePosters: this.settings.hidePosters
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
        document.body.dispatchEvent(new MouseEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          button: 0
        }));
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
        const category = message.categoryName && message.categoryColor ? { categoryName: message.categoryName, categoryColor: message.categoryColor } : void 0;
        this.openTopic(info.topicId, info.url.href, message.topicTitle || `\u4E3B\u9898 ${info.topicId}`, info.postNumber, category);
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
    }
    ensureFrames() {
      const content = this.layout.getContentElement();
      if (!content || this.frames) return;
      this.frames = new TopicFramePool(
        content,
        this.settings.maxLiveFrames,
        (message, iframe) => this.handleFrameMessage(message, iframe, "primary"),
        (tabId, iframe) => {
          const scrollY = iframe.contentWindow?.scrollY ?? 0;
          this.tabStore.update(tabId, { scrollY, suspended: true }, Date.now(), false);
          this.schedulePersist();
        }
      );
      this.frames.setPreviewConfig({
        enabled: this.settings.enabled && this.settings.previewEnabled,
        clickMode: this.settings.previewClickMode
      });
      this.renderTabs();
    }
    ensureSecondaryFrames() {
      const content = this.layout.getSecondaryContentElement();
      if (!content || this.secondaryFrames) return;
      this.secondaryFrames = new TopicFramePool(
        content,
        this.settings.maxLiveFrames,
        (message, iframe) => this.handleFrameMessage(message, iframe, "secondary"),
        (tabId, iframe) => {
          const scrollY = iframe.contentWindow?.scrollY ?? 0;
          this.tabStore.update(tabId, { scrollY, suspended: true }, Date.now(), false);
          this.schedulePersist();
        }
      );
      this.secondaryFrames.setPreviewConfig({
        enabled: this.settings.enabled && this.settings.previewEnabled,
        clickMode: this.settings.previewClickMode
      });
    }
    mountSettings() {
      if (this.settingsPanel) return;
      const host = document.createElement("li");
      host.className = "ldu-settings-host";
      this.settingsHost = host;
      this.ensureSettingsHost();
      this.settingsPanel = new SettingsPanel(host, this.settings, {
        onChange: (patch) => this.applySettings(patch)
      });
      this.settingsPanel.mount();
    }
    ensureSettingsHost() {
      if (!this.settingsHost) return;
      const target = document.querySelector(".d-header-icons") ?? document.querySelector(".d-header .contents") ?? document.body;
      if (this.settingsHost.parentElement !== target) target.append(this.settingsHost);
    }
    applySettings(patch) {
      this.settings = normalizeSettings({ ...this.settings, ...patch });
      saveSettings(this.storage, this.settings);
      this.layout.setPreference(this.settings.layoutPreference);
      this.layout.setHidePosters(this.settings.hidePosters);
      if (patch.paneSizes) {
        this.layout.setPaneSizes(this.settings.paneSizes);
        this.tabStore.setSessionFields({ paneSizes: this.settings.paneSizes }, Date.now(), false);
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
      this.listFrame?.setConfig({
        enabled: this.settings.enabled && this.settings.previewEnabled,
        clickMode: this.settings.previewClickMode,
        hidePosters: this.settings.hidePosters
      });
      this.settingsPanel?.setSettings(this.settings);
      this.credit?.setEnabled(this.settings.enabled && this.settings.creditEnabled);
      if (patch.previewClickMode !== void 0) this.preview.syncClickMode();
      if (patch.restoreSession === false) clearRestorableSessions(this.storage);
      if (!this.settings.enabled || !this.settings.previewEnabled) this.preview.close();
      if (patch.colorizeTabs !== void 0) this.renderTabs();
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
        this.ensureListFrame();
        this.ensureFrames();
        if (active) this.activateFrame(active, "primary");
        const secondaryActive = this.tabStore.getSecondaryActive();
        if (secondaryActive) {
          this.layout.setSecondaryOpen(true);
          this.ensureSecondaryFrames();
          this.activateFrame(secondaryActive, "secondary");
        }
      }
    }
    persistPaneSizes(paneSizes) {
      this.settings = normalizeSettings({ ...this.settings, paneSizes });
      saveSettings(this.storage, this.settings);
      this.tabStore.setSessionFields({ paneSizes: this.settings.paneSizes }, Date.now(), false);
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
      const tab = this.tabStore.getTabs().find((candidate) => candidate.id === message.tabId);
      if (!tab) return;
      if (message.type === "ldu:frame-interaction") {
        document.body.dispatchEvent(new MouseEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          button: 0
        }));
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
        this.openTopic(info2.topicId, info2.url.href, message.title || `\u4E3B\u9898 ${info2.topicId}`, info2.postNumber, void 0, pane);
        return;
      }
      const info = message.url ? getTopicInfo(message.url) : null;
      const sameTopic = info?.topicId === tab.topicId;
      const categoryChanged = Boolean(
        message.categoryName && message.categoryColor && (message.categoryName !== tab.categoryName || message.categoryColor !== tab.categoryColor)
      );
      const patch = {
        ...message.url ? { url: message.url } : {},
        ...message.title ? { title: message.title } : {},
        ...message.categoryName && message.categoryColor ? { categoryName: message.categoryName, categoryColor: message.categoryColor } : {},
        ...typeof message.scrollY === "number" ? { scrollY: message.scrollY } : {},
        ...info?.postNumber ? { postNumber: info.postNumber } : {},
        suspended: false
      };
      this.tabStore.update(tab.id, patch, Date.now(), message.type === "ldu:frame-ready" || Boolean(message.title && !sameTopic) || categoryChanged);
      if (message.type === "ldu:frame-state") this.schedulePersist();
      if (message.type === "ldu:frame-ready" && tab.scrollY > 0) {
        iframe.contentWindow?.scrollTo({ top: tab.scrollY, behavior: "instant" });
      }
    }
    renderTabs() {
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
        onContextMenu: (tabId, x, y) => this.tabContextMenu.open(tabId, x, y),
        onReorder: (tabId, targetTabId, position) => {
          this.tabStore.reorderInPane(tabId, targetTabId, position, Date.now());
        }
      }, { colorizeTabs: this.settings.colorizeTabs });
      const secondaryRoot = this.layout.getSecondaryTabStripElement();
      if (secondaryRoot) {
        renderTabStrip(secondaryRoot, secondaryTabs, this.tabStore.getSession().secondaryActiveTabId, {
          onActivate: (tabId) => {
            const tab = this.tabStore.activateSecondary(tabId, Date.now());
            if (tab) this.activateFrame(tab, "secondary");
          },
          onClose: (tabId) => this.closeTab(tabId, "secondary"),
          onContextMenu: (tabId, x, y) => this.tabContextMenu.open(tabId, x, y, true),
          onReorder: (tabId, targetTabId, position) => {
            this.tabStore.reorderInPane(tabId, targetTabId, position, Date.now());
          }
        }, { colorizeTabs: this.settings.colorizeTabs });
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
      const tab = this.tabStore.getTabs().find((candidate) => candidate.id === tabId);
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
      const tab = this.tabStore.getTabs().find((candidate) => candidate.id === tabId);
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
      const tab = this.tabStore.getTabs().find((candidate) => candidate.id === tabId) ?? null;
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
      const tab = this.tabStore.getTabs().find((candidate) => candidate.id === tabId) ?? null;
      const iframe = pool?.getFrame(tabId);
      if (!tab || !iframe?.contentWindow) return tab;
      let url = tab.url;
      let title = tab.title;
      let scrollY = tab.scrollY;
      try {
        const currentUrl = iframe.contentWindow.location.href;
        if (getTopicInfo(currentUrl, tab.url)?.topicId === tab.topicId) url = currentUrl;
        const currentTitle = iframe.contentDocument?.title?.trim();
        if (currentTitle) title = currentTitle;
        scrollY = iframe.contentWindow.scrollY;
      } catch {
        return tab;
      }
      const info = getTopicInfo(url, tab.url);
      this.tabStore.update(tabId, {
        url,
        title,
        scrollY,
        ...info?.postNumber ? { postNumber: info.postNumber } : {},
        suspended: false
      }, Date.now(), false);
      return this.tabStore.getTabs().find((candidate) => candidate.id === tabId) ?? tab;
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
    handlePageHide(event) {
      this.persistSession();
      if (event.persisted) return;
      if (this.settings.restoreSession && this.tabStore?.getTabs().length > 0) {
        stageSessionClose(this.storage, this.tabStore.getSession());
      }
      if (this.leaseTimer !== null) window.clearInterval(this.leaseTimer);
      if (this.sessionMaintenanceTimer !== null) window.clearInterval(this.sessionMaintenanceTimer);
      this.leaseTimer = null;
      this.sessionMaintenanceTimer = null;
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

  // src/frame-bridge.ts
  var DOUBLE_CLICK_DELAY_MS = 300;
  function bootFrameBridge() {
    const frameName = window.name;
    if (frameName.startsWith("ldu-list:")) {
      bootListBridge(frameName.slice("ldu-list:".length));
      return;
    }
    if (!frameName.startsWith("ldu-topic:")) return;
    const tabId = frameName.slice("ldu-topic:".length);
    document.documentElement.dataset.lduEmbeddedTopic = "true";
    ensureAppStyles(document);
    let timer = null;
    let lastUrl = "";
    let lastObservedUrl = location.href;
    let lastObservedTitle = document.title;
    let lastObservedCategoryKey = "";
    let currentCategory = readTopicDocumentCategory(document, window);
    let previewEnabled = false;
    let previewClickMode = "double";
    let replayingClick = false;
    let clickTimer = null;
    const send = (type) => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        const payload = {
          type,
          tabId,
          scrollY: window.scrollY
        };
        if (currentCategory) Object.assign(payload, currentCategory);
        if (type === "ldu:frame-ready" || lastUrl !== location.href) {
          lastUrl = location.href;
          payload.url = location.href;
          payload.title = document.title;
        }
        window.parent.postMessage(payload, location.origin);
      }, type === "ldu:frame-ready" ? 0 : 120);
    };
    window.addEventListener("scroll", () => send("ldu:frame-state"), { passive: true });
    window.addEventListener("load", () => send("ldu:frame-ready"), { once: true });
    document.addEventListener("DOMContentLoaded", () => send("ldu:frame-ready"), { once: true });
    window.addEventListener("popstate", () => send("ldu:frame-state"));
    new MutationObserver(() => {
      const urlChanged = lastObservedUrl !== location.href;
      if (urlChanged) currentCategory = null;
      const observedCategory = readTopicDocumentCategory(document, window);
      if (observedCategory) currentCategory = observedCategory;
      const categoryKey = currentCategory ? `${currentCategory.categoryName}
${currentCategory.categoryColor}` : "";
      if (lastObservedUrl === location.href && lastObservedTitle === document.title && lastObservedCategoryKey === categoryKey) return;
      lastObservedUrl = location.href;
      lastObservedTitle = document.title;
      lastObservedCategoryKey = categoryKey;
      send("ldu:frame-state");
    }).observe(document.documentElement, { childList: true, subtree: true });
    const cancelPendingClick = () => {
      if (clickTimer !== null) window.clearTimeout(clickTimer);
      clickTimer = null;
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
      if (data?.type === "ldu:bookmark") {
        const topicId = typeof data.topicId === "string" && /^\d+$/.test(data.topicId) ? data.topicId : null;
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!topicId || !csrfToken) return;
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
      if (data?.type !== "ldu:preview-config") return;
      previewEnabled = data.enabled === true;
      previewClickMode = data.clickMode === "single" ? "single" : "double";
      document.documentElement.dataset.lduHidePosters = String(data.hidePosters !== false);
      if (!previewEnabled) cancelPendingClick();
    });
    document.addEventListener("pointerdown", (event) => {
      window.parent.postMessage({ type: "ldu:frame-interaction", tabId }, location.origin);
      if (previewEnabled && previewClickMode === "double" && event.detail >= 2) cancelPendingClick();
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
  function bootListBridge(frameId) {
    document.documentElement.dataset.lduEmbeddedList = "true";
    ensureAppStyles(document);
    const DOUBLE_CLICK_DELAY_MS2 = 300;
    let timer = null;
    let clickTimer = null;
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
      const row = link.closest(".topic-list-item, .latest-topic-list-item, .search-result");
      const category = row ? readTopicCategory(row, window) : null;
      window.parent.postMessage({
        type: "ldu:list-topic-open",
        frameId,
        url: link.href,
        topicId: info?.topicId,
        postNumber: info?.postNumber,
        topicTitle: link.textContent?.trim() || (info ? `\u4E3B\u9898 ${info.topicId}` : ""),
        ...category ?? {}
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
      if (data?.type !== "ldu:preview-config") return;
      previewEnabled = data.enabled === true;
      previewClickMode = data.clickMode === "single" ? "single" : "double";
      document.documentElement.dataset.lduHidePosters = String(data.hidePosters !== false);
      if (!previewEnabled) cancelPendingClick();
    });
    window.addEventListener("scroll", () => send("ldu:list-state"), { passive: true });
    window.addEventListener("load", () => send("ldu:list-ready"), { once: true });
    document.addEventListener("DOMContentLoaded", () => send("ldu:list-ready"), { once: true });
    window.addEventListener("popstate", () => send("ldu:list-state"));
    window.addEventListener("hashchange", () => send("ldu:list-state"));
    document.addEventListener("pointerdown", () => {
      window.parent.postMessage({ type: "ldu:list-interaction", frameId }, location.origin);
    }, true);
    new MutationObserver(() => {
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
      }, DOUBLE_CLICK_DELAY_MS2);
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
  }

  // src/main.ts
  function boot() {
    if (window.__linuxDoUltimateLoaded) return;
    window.__linuxDoUltimateLoaded = true;
  }
  if (typeof window !== "undefined") {
    if (window.self !== window.top) {
      bootFrameBridge();
    } else {
      boot();
      startLinuxDoApp();
    }
  }
})();
