"use strict";
(() => {
  // src/core/defaults.ts
  var DEFAULT_SETTINGS = {
    schemaVersion: 2,
    enabled: true,
    layoutPreference: "auto",
    tabsEnabled: true,
    tabPresentation: "horizontal",
    verticalTabsAutoCollapse: true,
    groupVerticalTabs: false,
    restoreSession: false,
    hidePosters: true,
    colorizeTabs: true,
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
    const isCurrentSchema = source.schemaVersion === DEFAULT_SETTINGS.schemaVersion;
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
      scrollY: clampNumber(tab.scrollY, 0, 1e7, 0),
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
      scrollY: 0,
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
  var SCROLL_RESTORE_TIMEOUT_MS = 15e3;
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
    activeTabId = null;
    setMaxLiveFrames(value) {
      this.liveLimit = Math.max(1, Math.min(10, Math.floor(value)));
      this.suspendOverflow("");
    }
    setPreviewConfig(config) {
      this.previewConfig = { ...config };
      for (const record of this.frames.values()) this.sendPreviewConfig(record.iframe);
    }
    activate(tab, now) {
      const switchingToAnotherFrame = this.activeTabId !== tab.id;
      const record = this.ensureRecord(tab, now);
      if (switchingToAnotherFrame) {
        for (const [tabId, current] of this.frames) {
          this.setFrameActive(current, tabId === tab.id);
        }
        this.activeTabId = tab.id;
        if (record.loaded) {
          this.cancelScrollRestore(record);
          record.restoreScrollY = tab.scrollY;
          if (tab.scrollY > 0) this.restoreScroll(record);
        }
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
          this.restoreScroll(current);
          this.sendLifecycleState(current);
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
          softFrozen: true,
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
        this.sendLifecycleState(record);
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
      this.activeTabId = null;
    }
    sendPreviewConfig(iframe) {
      iframe.contentWindow?.postMessage({ type: "ldu:preview-config", ...this.previewConfig }, location.origin);
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
    restoreScroll(record) {
      const target = record.restoreScrollY;
      if (target <= 0 || !record.iframe.contentWindow) return;
      if (record.restoreTimer !== null) window.clearTimeout(record.restoreTimer);
      if (record.restoreDeadline === 0) record.restoreDeadline = Date.now() + SCROLL_RESTORE_TIMEOUT_MS;
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
        const scrollY = record.iframe.contentWindow?.scrollY ?? 0;
        record.commands = [];
        this.cancelScrollRestore(record);
        record.iframe.removeEventListener("load", record.loadListener);
        record.iframe.remove();
        this.frames.delete(tabId);
        if (this.activeTabId === tabId) this.activeTabId = null;
        this.onSuspend(tabId, scrollY);
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
      if (!data || !["ldu:list-ready", "ldu:list-visual-ready", "ldu:list-state", "ldu:list-interaction", "ldu:list-topic-open", "ldu:list-navigate", "ldu:list-preview-open", "ldu:list-preview-dismiss"].includes(data.type ?? "")) return;
      if (data.frameId !== this.frameId || !this.iframe || event.source !== this.iframe.contentWindow || event.origin !== location.origin) return;
      if ((data.type === "ldu:list-ready" || data.type === "ldu:list-visual-ready" || data.type === "ldu:list-state") && data.url) {
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
  --ldu-vertical-tabs-collapsed: 2.625rem;
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

.ldu-topic-toolbar {
  display: flex;
  min-height: 38px;
  align-items: center;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
}

/* The vertical rail reserves only its compact marker width. Its expanded surface
   overlays the current reading pane, so iframe geometry never jumps on hover. */
body.ldu-tabs-vertical #ldu-topic-panel,
body.ldu-tabs-vertical #ldu-secondary-topic-panel {
  display: grid;
  grid-template-columns: var(--ldu-vertical-tabs-collapsed) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
}

body.ldu-tabs-vertical .ldu-topic-toolbar {
  position: relative;
  z-index: 4;
  grid-column: 1;
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
  clip-path: inset(0 calc(100% - var(--ldu-vertical-tabs-collapsed)) 0 0);
  transition: clip-path 180ms var(--ldu-ease-out), opacity 180ms ease-out;
  transition-delay: 180ms;
}

body.ldu-tabs-vertical .ldu-topic-toolbar:hover,
body.ldu-tabs-vertical .ldu-topic-toolbar:focus-within,
body.ldu-tabs-vertical .ldu-topic-toolbar.is-interaction-locked,
body.ldu-tabs-vertical .ldu-topic-toolbar:has(.ldu-tab-strip.is-reordering) {
  clip-path: inset(0);
  transition-delay: 80ms;
}

body.ldu-tabs-vertical.ldu-vertical-tabs-static #ldu-topic-panel,
body.ldu-tabs-vertical.ldu-vertical-tabs-static #ldu-secondary-topic-panel {
  grid-template-columns: min(17rem, max(10rem, 46%)) minmax(0, 1fr);
}

body.ldu-tabs-vertical.ldu-vertical-tabs-static .ldu-topic-toolbar {
  width: 100%;
  clip-path: inset(0);
  transition: none;
}

body.ldu-tabs-vertical .ldu-topic-content {
  grid-column: 2;
  grid-row: 1;
}

body.ldu-tabs-vertical .ldu-topic-toolbar .ldu-tab-strip {
  flex-direction: column;
  min-height: 0;
  align-items: stretch;
  gap: 2px;
  padding: 6px 4px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
}

body.ldu-tabs-vertical .ldu-topic-toolbar .ldu-topic-actions {
  order: -1;
  justify-content: flex-start;
  min-height: 38px;
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
  min-height: 36px;
  flex: 0 0 36px;
  border: 0;
  border-radius: 4px;
}

body.ldu-tabs-vertical .ldu-tab-button {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 9px;
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

.ldu-tab-title {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (hover: none) {
  body.ldu-tabs-vertical #ldu-topic-panel,
  body.ldu-tabs-vertical #ldu-secondary-topic-panel {
    grid-template-columns: min(17rem, max(10rem, 46%)) minmax(0, 1fr);
  }

  body.ldu-tabs-vertical .ldu-topic-toolbar {
    width: 100%;
    clip-path: inset(0);
    transition: none;
  }
}

body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:focus-within):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-title,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:focus-within):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-close,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:focus-within):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-group-label,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:focus-within):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-vertical-tabs-heading-label {
  visibility: hidden;
}

body.ldu-tabs-vertical .ldu-tab-item.is-active {
  box-shadow: inset 3px 0 0 var(--ldu-accent);
}

body.ldu-tabs-vertical .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active {
  background: color-mix(in srgb, var(--ldu-tab-category-color) 22%, var(--ldu-surface));
  box-shadow: inset 3px 0 0 color-mix(in srgb, var(--ldu-tab-category-color) 88%, var(--ldu-text));
}

.ldu-tab-group-header {
  display: flex;
  min-height: 26px;
  align-items: center;
  gap: 7px;
  padding: 6px 8px 2px;
  color: var(--primary-medium, #777);
  font-size: var(--font-down-2, .75rem);
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

.ldu-settings-panel .ldu-brand-ultimate {
  color: #ffd43b;
  text-shadow: 0 1px 0 rgb(0 0 0 / 35%);
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
.ldu-settings-panel .ldu-update-menu { right: 0; min-width: 250px; max-width: min(360px, 80vw); padding: 10px; }
.ldu-settings-panel .ldu-update-summary { color: var(--ldu-text); font-size: var(--font-down-2, .75rem); line-height: 1.45; }
.ldu-settings-panel .ldu-update-summary ul { margin: 6px 0 8px; padding-left: 18px; text-align: left; }
.ldu-settings-panel .ldu-update-link { background: var(--ldu-accent); color: #fff; text-align: center; }
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
      this.dualPaneSizes = { ...options.dualPaneSizes ?? options.paneSizes };
      this.hidePosters = options.hidePosters;
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
    hidePosters;
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
      document.body.classList.toggle("ldu-hide-posters", this.hidePosters);
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
      document.body.classList.remove("ldu-layout-active", "ldu-layout-two", "ldu-layout-three", "ldu-hide-posters", "ldu-secondary-open", "ldu-tabs-vertical", "ldu-vertical-tabs-static");
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
    setHidePosters(hide) {
      this.hidePosters = hide;
      document.body.classList.toggle("ldu-hide-posters", hide);
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
        <div class="ldu-topic-actions"><span class="ldu-vertical-tabs-heading">${iconSvg("list", 16)}<span class="ldu-vertical-tabs-heading-label">\u5E16\u5B50\u6807\u7B7E</span></span></div>
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
          <h2 class="ldu-settings-heading">Linux Do <span class="ldu-brand-ultimate">Ultimate</span></h2>
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
            <div class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u5E16\u5B50\u6807\u7B7E\u680F\u6837\u5F0F</span>
                <span class="dc-item-desc">\u53EF\u4F7F\u7528\u4F20\u7EDF\u6A2A\u5411\u6807\u7B7E\uFF0C\u6216\u7A7A\u95F4\u66F4\u5145\u88D5\u7684\u5782\u76F4\u6807\u7B7E\u680F</span>
              </span>
              <div class="dc-pills" data-pills-setting="tabPresentation">
                <button type="button" class="dc-pill-btn" data-val="horizontal">\u6A2A\u5411</button>
                <button type="button" class="dc-pill-btn" data-val="vertical">\u5782\u76F4</button>
              </div>
            </div>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled" data-requires-setting="tabPresentation" data-requires-value="vertical">
              <span class="dc-label-box">
                <span class="dc-item-title">\u81EA\u52A8\u6536\u8D77\u5782\u76F4\u6807\u7B7E\u680F</span>
                <span class="dc-item-desc">\u5E73\u65F6\u53EA\u663E\u793A\u7D27\u51D1\u56FE\u6807\uFF0C\u60AC\u505C\u6216\u805A\u7126\u65F6\u8986\u76D6\u5C55\u5F00</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="verticalTabsAutoCollapse"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled" data-requires-setting="tabPresentation" data-requires-value="vertical">
              <span class="dc-label-box">
                <span class="dc-item-title">\u6309\u5E16\u5B50\u5206\u533A\u81EA\u52A8\u5206\u7EC4</span>
                <span class="dc-item-desc">\u4F7F\u7528\u5185\u7F6E\u4E3B\u5206\u7C7B\u8868\u6574\u7406\u6807\u7B7E\uFF0C\u4E0D\u989D\u5916\u626B\u63CF\u9875\u9762\u6216\u8BF7\u6C42\u7F51\u7EDC</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="groupVerticalTabs"><span class="dc-slider"></span></span>
            </label>
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
            <div class="ldu-update-wrap">
              <button type="button" class="dc-btn ldu-settings-action ldu-settings-update" aria-expanded="false" aria-controls="ldu-update-menu">${iconSvg("refresh", 14)}\u68C0\u67E5\u66F4\u65B0</button>
              <div class="dc-dropdown-menu ldu-update-menu" id="ldu-update-menu" role="status" aria-live="polite" hidden>
                <div class="ldu-update-summary"></div>
                <a class="dc-dropdown-item ldu-update-link" href="#" target="_blank" rel="noopener noreferrer">\u524D\u5F80\u4E0B\u8F7D</a>
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
        summary.textContent = `\u53D1\u73B0\u65B0\u7248\u672C v${result.manifest.version}`;
        const list = document.createElement("ul");
        result.manifest.changelog.forEach((item) => {
          const entry = document.createElement("li");
          entry.textContent = item;
          list.append(entry);
        });
        summary.append(list);
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
      const posters = this.panel.querySelector('[data-setting="hidePosters"]');
      const colorizeTabs = this.panel.querySelector('[data-setting="colorizeTabs"]');
      const preview = this.panel.querySelector('[data-setting="previewEnabled"]');
      const credit = this.panel.querySelector('[data-setting="creditEnabled"]');
      const live = this.panel.querySelector('[data-setting="maxLiveFrames"]');
      const output = this.panel.querySelector('[data-output="maxLiveFrames"]');
      if (tabs) tabs.checked = this.settings.tabsEnabled;
      if (verticalTabsAutoCollapse) verticalTabsAutoCollapse.checked = this.settings.verticalTabsAutoCollapse;
      if (groupVerticalTabs) groupVerticalTabs.checked = this.settings.groupVerticalTabs;
      if (restore) restore.checked = this.settings.restoreSession;
      if (posters) posters.checked = this.settings.hidePosters;
      if (colorizeTabs) colorizeTabs.checked = this.settings.colorizeTabs;
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
        const requiredKey = row.dataset.requiresSetting;
        const requiredValue = row.dataset.requiresValue;
        const requirementMatches = !requiredKey || requiredValue === void 0 || String(this.settings[requiredKey]) === requiredValue;
        row.hidden = !dependencyMatches || !requirementMatches;
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
    start() {
      this.settings = loadSettings(this.storage);
      ensureAppStyles();
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
        hidePosters: this.settings.hidePosters,
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
        this.openTopic(info.topicId, info.url.href, link.textContent?.trim() || `\u4E3B\u9898 ${info.topicId}`, info.postNumber);
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
        (tabId, scrollY) => {
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
        (tabId, scrollY) => {
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
    applySettings(patch) {
      this.settings = normalizeSettings({ ...this.settings, ...patch });
      saveSettings(this.storage, this.settings);
      this.layout.setPreference(this.settings.layoutPreference);
      this.layout.setTabPresentation(this.settings.tabPresentation, this.settings.verticalTabsAutoCollapse);
      this.layout.setHidePosters(this.settings.hidePosters);
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
      this.listFrame?.setConfig({
        enabled: this.settings.enabled && this.settings.previewEnabled,
        clickMode: this.settings.previewClickMode,
        hidePosters: this.settings.hidePosters
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
        this.openTopic(info2.topicId, info2.url.href, message.title || `\u4E3B\u9898 ${info2.topicId}`, info2.postNumber, pane);
        return;
      }
      const info = message.url ? getTopicInfo(message.url) : null;
      const sameTopic = info?.topicId === tab.topicId;
      const patch = {
        ...message.url ? { url: message.url } : {},
        ...message.title ? { title: message.title } : {},
        // A freshly loaded frame always reports 0, which would clobber the position we are about to restore.
        ...message.type !== "ldu:frame-ready" && typeof message.scrollY === "number" ? { scrollY: message.scrollY } : {},
        ...info?.postNumber ? { postNumber: info.postNumber } : {},
        suspended: false
      };
      this.tabStore.update(tab.id, patch, Date.now(), message.type === "ldu:frame-ready" || Boolean(message.title && !sameTopic));
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

  // src/extension/request-protocol.ts
  var EXTENSION_REQUEST = "ldu:extension-request";
  var EXTENSION_REQUEST_CANCEL = "ldu:extension-request-cancel";

  // src/extension/request-client.ts
  function createExtensionRequest(runtime = chrome.runtime) {
    return (options) => {
      const requestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      let settled = false;
      let aborted = false;
      const message = {
        type: EXTENSION_REQUEST,
        requestId,
        method: options.method ?? "GET",
        url: options.url,
        headers: { ...options.headers ?? {} },
        ...typeof options.data === "string" ? { body: options.data } : {},
        timeout: Math.max(0, options.timeout ?? 3e4)
      };
      void runtime.sendMessage(message).then((raw) => {
        if (settled || aborted) return;
        settled = true;
        const result = raw;
        if (!result?.ok) {
          if (result?.error === "timeout") options.ontimeout?.();
          else options.onerror?.(result ?? new Error("Extension request failed"));
          return;
        }
        options.onload?.(result);
      }).catch((error) => {
        if (settled || aborted) return;
        settled = true;
        options.onerror?.(error);
      });
      return {
        abort: () => {
          if (settled || aborted) return;
          aborted = true;
          settled = true;
          options.onabort?.();
          void runtime.sendMessage({ type: EXTENSION_REQUEST_CANCEL, requestId }).catch(() => {
          });
        }
      };
    };
  }
  function installExtensionRequestBridge(runtime = chrome.runtime) {
    Object.defineProperty(globalThis, "GM_xmlhttpRequest", {
      configurable: true,
      value: createExtensionRequest(runtime)
    });
  }

  // src/extension/host.ts
  installExtensionRequestBridge();
  startLinuxDoApp({
    loadPreviewer: async () => {
      const runtimeUrl = chrome.runtime.getURL("preview-runtime.js");
      const module = await import(runtimeUrl);
      return module.installLinkHoverPreviewer;
    }
  });
})();
