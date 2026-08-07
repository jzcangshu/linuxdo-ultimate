import { createSession } from "./core/session";
import { DEFAULT_SETTINGS, normalizeSettings } from "./core/defaults";
import {
  UserscriptStorage,
  clearRestorableSessions,
  cleanupExpiredSessions,
  hasStorageFailure,
  claimSessionId,
  isReloadNavigation,
  loadSessionIfPresent,
  loadLatestSession,
  loadSettings,
  reconcileSessionClose,
  refreshSessionLease,
  releaseSessionLease,
  saveSettings,
  saveSession,
  stageSessionClose,
  STORAGE_FAILURE_EVENT,
} from "./core/storage";
import type { SessionLease } from "./core/storage";
import type { SessionState, Settings, TopicTabState } from "./core/types";
import { classifyRoute, getTopicInfo, isNavigableForumPage, isSplitRoute, isSupportedTopicTarget } from "./discourse/routes";
import { createBrowserViewTracker } from "./discourse/view-tracker";
import { readTopicCategory, type TopicCategoryPresentation } from "./discourse/category";
import { FrameBudget, TopicFramePool, type FrameMessage } from "./tabs/frame-pool";
import { ListFrameController, type ListFrameMessage } from "./tabs/list-frame";
import { TopicTabStore } from "./tabs/tab-store";
import { renderTabStrip } from "./tabs/tab-strip";
import { LayoutController } from "./ui/layout-controller";
import { SettingsPanel } from "./ui/settings-panel";
import { ensureAppStyles } from "./ui/styles";
import { TabContextMenu } from "./ui/tab-context-menu";
import { setIcon } from "./ui/icons";
import { PreviewController } from "./preview/upstream-preview-controller";
import { CreditWidget } from "./credit/credit-widget";

const ROUTE_DEBOUNCE_MS = 100;
const SESSION_MAINTENANCE_INTERVAL_MS = 30 * 60_000;

export function startLinuxDoApp(): void {
  if (window.self !== window.top) return;
  if (window.__linuxDoUltimateAppStarted) return;
  window.__linuxDoUltimateAppStarted = true;
  const start = () => new LinuxDoApp().start();
  if (document.body) {
    start();
    return;
  }
  const observer = new MutationObserver(() => {
    if (!document.body) return;
    observer.disconnect();
    start();
  });
  observer.observe(document, { childList: true, subtree: true });
}

class LinuxDoApp {
  private readonly storage = new UserscriptStorage();
  private settings: Settings = normalizeSettings(DEFAULT_SETTINGS);
  private session!: SessionState;
  private tabStore!: TopicTabStore;
  private layout!: LayoutController;
  private frames: TopicFramePool | null = null;
  private secondaryFrames: TopicFramePool | null = null;
  private frameBudget!: FrameBudget;
  private listFrame: ListFrameController | null = null;
  private preview!: PreviewController;
  private settingsPanel!: SettingsPanel;
  private credit!: CreditWidget;
  private settingsHost: HTMLElement | null = null;
  private routeTimer: number | null = null;
  private persistTimer: number | null = null;
  private lastRoute = "";
  private restoredTabsTracked = false;
  private trackedTopicKey = "";
  private topicTrackTimers: number[] = [];
  private routeHostObserver: MutationObserver | null = null;
  private hostMaintenanceTimer: number | null = null;
  private hasRestoredSession = false;
  private sessionLease!: SessionLease;
  private leaseTimer: number | null = null;
  private sessionMaintenanceTimer: number | null = null;
  private tabContextMenu!: TabContextMenu;

  start(): void {
    this.settings = loadSettings(this.storage);
    ensureAppStyles();
    this.preview = new PreviewController({
      isEnabled: () => this.settings.enabled && this.settings.previewEnabled,
      clickMode: () => this.settings.previewClickMode,
      onClickModeChange: (previewClickMode) => this.applySettings({ previewClickMode }),
    });
    this.preview.setEnabled(this.settings.enabled && this.settings.previewEnabled);
    this.tabContextMenu = new TabContextMenu({
      onMoveToSplit: (tabId) => this.moveTabToSecondary(tabId),
      onOpenBrowserTab: (tabId) => this.openTabInBrowser(tabId),
      onReload: (tabId) => this.reloadTab(tabId),
      onCopyLink: (tabId) => void this.copyTabLink(tabId),
      onBookmark: (tabId) => this.bookmarkTab(tabId),
      onCloseOthers: (tabId) => this.closeOtherTabs(tabId),
    });
    this.sessionLease = claimSessionId(
      this.storage,
      window.sessionStorage,
      Date.now(),
      isReloadNavigation(window.performance),
    );
    const sessionId = this.sessionLease.sessionId;
    reconcileSessionClose(this.storage, sessionId);
    cleanupExpiredSessions(this.storage);
    if (!this.settings.restoreSession) clearRestorableSessions(this.storage);
    const initial = createSession(sessionId, location.href, Date.now());
    initial.paneSizes = { ...this.settings.paneSizes };
    const currentSession = loadSessionIfPresent(this.storage, sessionId, location.href, Date.now());
    const previousSession = !currentSession
      && classifyRoute(location.href) !== "topic"
      && this.settings.restoreSession
      ? loadLatestSession(this.storage, sessionId, location.href, Date.now())
      : null;
    this.session = currentSession ?? previousSession ?? initial;
    this.hasRestoredSession = Boolean(previousSession?.tabs.length);
    this.tabStore = new TopicTabStore(this.session, (session) => {
      this.session = session;
      saveSession(this.storage, session);
      this.renderTabs();
    });
    if (this.settings.enabled && this.settings.tabsEnabled && this.session.tabs.length > 0) {
      document.documentElement.classList.add("ldu-split-booting");
    }
    this.frameBudget = new FrameBudget(this.settings.maxLiveFrames);
    this.layout = new LayoutController({
      preference: this.settings.layoutPreference,
      paneSizes: this.session.paneSizes,
      hidePosters: this.settings.hidePosters,
      onPaneSizesChange: (paneSizes) => this.persistPaneSizes(paneSizes),
    });
    this.mountSettings();
    this.credit = new CreditWidget();
    this.credit.mount(this.settings.enabled && this.settings.creditEnabled);
    this.lastRoute = location.href;
    this.bindGlobalEvents();
    if (hasStorageFailure()) window.setTimeout(() => this.showActionToast("本地存储不可用，设置和阅读状态可能无法保存", true), 0);
    this.leaseTimer = window.setInterval(() => refreshSessionLease(this.storage, this.sessionLease), 30_000);
    this.sessionMaintenanceTimer = window.setInterval(
      () => cleanupExpiredSessions(this.storage),
      SESSION_MAINTENANCE_INTERVAL_MS,
    );
    this.syncRoute();
    if (window.__LDU_TEST_MODE__) {
      window.__LDU_TEST_API__ = {
        openTopic: (url, title) => {
          const info = getTopicInfo(url, location.href);
          if (info) this.openTopic(info.topicId, info.url.href, title, info.postNumber);
        },
      };
    }
  }

  private bindGlobalEvents(): void {
    window.addEventListener(STORAGE_FAILURE_EVENT, () => {
      this.showActionToast("本地存储不可用，设置和阅读状态可能无法保存", true);
    });
    window.addEventListener("click", (event) => this.handleTopicLinkClick(event), true);
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

  private handleTopicLinkClick(event: Event): void {
    if (!(event instanceof MouseEvent) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!this.settings.enabled || !this.settings.tabsEnabled) return;
    const target = event.target;
    const link = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link) return;
    if (link.hasAttribute("download") || (link.target && link.target.toLowerCase() !== "_self")) return;
    if (classifyRoute(location.href) === "topic" && this.tabStore.getTabs().length === 0) {
      this.promoteDirectTopicNavigation(event, link);
      return;
    }
    if (isSupportedTopicTarget(link.href, location.href)) {
      const info = getTopicInfo(link.href);
      if (!info) return;
      const category = readTopicCategory(link.closest(".topic-list-item, .latest-topic-list-item, .search-result") ?? document);
      if (!this.openTopic(info.topicId, info.url.href, link.textContent?.trim() || `主题 ${info.topicId}`, info.postNumber, category ?? undefined)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (link.closest(".post-controls, .actions, .topic-timeline, .no-track-view-patch")) return;
    if (!this.layout.getShellElement() || this.layout.getMode() === "native") return;
    let targetUrl: URL;
    try { targetUrl = new URL(link.href, location.href); } catch { return; }
    if (!isNavigableForumPage(targetUrl.href, location.href) || link.target === "_blank" || link.hasAttribute("download")) return;
    if (this.navigateList(targetUrl.href)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  private openTopic(
    topicId: string,
    url: string,
    title: string,
    postNumber?: number,
    category?: TopicCategoryPresentation,
    pane: "primary" | "secondary" = "primary",
  ): boolean {
    if (!this.layout.mount()) return false;
    this.ensureListFrame();
    this.ensureFrames();
    this.layout.setOpen(true);
    const input = { topicId, url, title, ...(postNumber ? { postNumber } : {}), ...category };
    if (pane === "secondary") this.tabStore.openSecondary(input, Date.now());
    else this.tabStore.open(input, Date.now());
    const info = getTopicInfo(url);
    if (info) {
      const tracker = createBrowserViewTracker();
      void tracker.track(info, "split-open", location.href).then((result) => {
        if (result.status === "failed") {
          window.setTimeout(() => void tracker.track(info, "manual-retry", location.href), 10_000);
        }
      });
    }
    return true;
  }

  private syncRoute(): void {
    try {
      this.syncRouteInternal();
    } catch (error) {
      console.error("[Linux.do Ultimate] 分屏启动失败，已恢复论坛原始页面", error);
      document.documentElement.classList.remove("ldu-split-booting");
      this.disposeSplitRuntime();
    } finally {
      document.getElementById("linuxdo-ultimate-boot-style")?.remove();
    }
  }

  private syncRouteInternal(): void {
    this.routeTimer = null;
    if (this.lastRoute !== location.href) {
      this.lastRoute = location.href;
    }
    const route = classifyRoute(location.href);
    const shouldHostSplit = this.settings.enabled
      && this.settings.tabsEnabled
      && (isSplitRoute(location.href) || this.tabStore.getTabs().length > 0);
    if (shouldHostSplit) {
      this.clearTopicTrackSchedule();
      if (!this.layout.mount()) {
        this.scheduleRouteMountRetry();
        return;
      }
      this.routeHostObserver?.disconnect();
      this.routeHostObserver = null;
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
    document.documentElement.classList.remove("ldu-split-booting");
    this.disposeSplitRuntime();
    if (route === "topic") {
      const info = getTopicInfo(location.href);
      if (info) this.scheduleTopicTracking(info.topicId, info.url.href);
    } else {
      this.clearTopicTrackSchedule();
    }
  }

  private promoteDirectTopicNavigation(event: MouseEvent, link: HTMLAnchorElement): void {
    const current = getTopicInfo(location.href);
    if (!current) return;
    let targetUrl: URL;
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
      if (target) this.openTopic(target.topicId, target.url.href, link.textContent?.trim() || `主题 ${target.topicId}`, target.postNumber);
    }
  }

  private currentTopicTitle(topicId: string): string {
    return document.querySelector<HTMLElement>("#topic-title h1, .fancy-title")?.textContent?.trim()
      || document.title
      || `主题 ${topicId}`;
  }

  private scheduleRouteMountRetry(): void {
    if (this.routeHostObserver) return;
    const root = document.body ?? document.documentElement;
    this.routeHostObserver = new MutationObserver(() => {
      if (!document.querySelector("#main-outlet-wrapper") || !document.querySelector("#main-outlet")) return;
      this.routeHostObserver?.disconnect();
      this.routeHostObserver = null;
      this.syncRoute();
    });
    this.routeHostObserver.observe(root, { childList: true, subtree: true });
    const failOpen = () => {
      if (!document.querySelector("#main-outlet-wrapper") || !document.querySelector("#main-outlet")) {
        document.documentElement.classList.remove("ldu-split-booting");
      }
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", failOpen, { once: true });
    else failOpen();
  }

  private scheduleRouteSync(): void {
    if (this.routeTimer !== null) window.clearTimeout(this.routeTimer);
    this.routeTimer = window.setTimeout(() => this.syncRoute(), ROUTE_DEBOUNCE_MS);
  }

  private ensureListFrame(requestedUrl?: string): void {
    const container = this.layout.getListContentElement();
    if (!container) return;
    if (!this.listFrame) {
      this.listFrame = new ListFrameController(
        container,
        this.session.sessionId,
        (message, iframe) => this.handleListFrameMessage(message, iframe),
      );
    }
    this.listFrame.setConfig({
      enabled: this.settings.enabled && this.settings.previewEnabled,
      clickMode: this.settings.previewClickMode,
      hidePosters: this.settings.hidePosters,
    });
    const storedListUrl = requestedUrl ?? this.tabStore.getSession().listUrl;
    let resolved: URL;
    try { resolved = new URL(storedListUrl || "/", location.href); } catch { resolved = new URL("/", location.href); }
    const listUrl = resolved.origin !== location.origin || getTopicInfo(resolved.href, location.href)
      ? new URL("/", location.href).href
      : resolved.href;
    this.listFrame.mount(listUrl);
  }

  private navigateList(url: string): boolean {
    let target: URL;
    try { target = new URL(url, location.href); } catch { return false; }
    if (!isNavigableForumPage(target.href, location.href)) return false;
    if (!this.layout.mount()) return false;
    this.tabStore.setSessionFields({ listUrl: target.href, listScrollY: 0 }, Date.now(), false);
    saveSession(this.storage, this.tabStore.getSession());
    this.ensureListFrame(target.href);
    this.listFrame?.navigate(target.href);
    return true;
  }

  private handleListFrameMessage(message: ListFrameMessage, iframe: HTMLIFrameElement): boolean {
    if (message.type === "ldu:list-interaction") {
      document.body.dispatchEvent(new MouseEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        button: 0,
      }));
      return true;
    }
    if (message.type === "ldu:list-preview-open") {
      this.preview.openFromFrame(message.url ?? "", iframe, message.anchorRect);
      return true;
    }
    if (message.type === "ldu:list-preview-dismiss") {
      this.preview.close();
      return true;
    }
    if (message.type === "ldu:list-topic-open") {
      const info = message.url ? getTopicInfo(message.url, location.href) : null;
      if (!info) return false;
      const category = message.categoryName && message.categoryColor
        ? { categoryName: message.categoryName, categoryColor: message.categoryColor }
        : undefined;
      return this.openTopic(info.topicId, info.url.href, message.topicTitle || `主题 ${info.topicId}`, info.postNumber, category);
    }
    if (message.type === "ldu:list-navigate" && message.url) {
      return this.navigateList(message.url);
    }
    if (!message.url || getTopicInfo(message.url, location.href)) return false;
    const previousSession = this.tabStore.getSession();
    const nextListUrl = new URL(message.url, location.href).href;
    const sameListUrl = previousSession.listUrl === nextListUrl;
    const savedScrollY = sameListUrl ? previousSession.listScrollY : 0;
    this.tabStore.setSessionFields({
      listUrl: nextListUrl,
      ...(message.type === "ldu:list-state" && typeof message.scrollY === "number"
        ? { listScrollY: message.scrollY }
        : !sameListUrl ? { listScrollY: 0 } : {}),
    }, Date.now(), false);
    if (message.type === "ldu:list-state") this.schedulePersist();
    if (message.type === "ldu:list-ready") {
      this.listFrame?.restoreScroll(savedScrollY);
      this.schedulePersist();
    }
    return true;
  }

  private ensureFrames(): void {
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
      },
      this.frameBudget,
    );
    this.frames.setPreviewConfig({
      enabled: this.settings.enabled && this.settings.previewEnabled,
      clickMode: this.settings.previewClickMode,
    });
    this.renderTabs();
  }

  private ensureSecondaryFrames(): void {
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
      },
      this.frameBudget,
    );
    this.secondaryFrames.setPreviewConfig({
      enabled: this.settings.enabled && this.settings.previewEnabled,
      clickMode: this.settings.previewClickMode,
    });
  }

  private mountSettings(): void {
    if (this.settingsPanel) return;
    const host = document.createElement("li");
    host.className = "ldu-settings-host";
    this.settingsHost = host;
    this.ensureSettingsHost();
    this.settingsPanel = new SettingsPanel(host, this.settings, {
      onChange: (patch) => this.applySettings(patch),
    });
    this.settingsPanel.mount();
  }

  private ensureSettingsHost(): void {
    if (!this.settingsHost) return;
    const target = document.querySelector<HTMLElement>(".d-header-icons")
      ?? document.querySelector<HTMLElement>(".d-header .contents")
      ?? document.body;
    if (this.settingsHost.parentElement !== target) target.append(this.settingsHost);
  }

  private applySettings(patch: Partial<Omit<Settings, "schemaVersion">>): void {
    this.settings = normalizeSettings({ ...this.settings, ...patch });
    saveSettings(this.storage, this.settings);
    this.layout.setPreference(this.settings.layoutPreference);
    this.layout.setHidePosters(this.settings.hidePosters);
    if (patch.paneSizes) {
      this.layout.setPaneSizes(this.settings.paneSizes);
      this.tabStore.setSessionFields({ paneSizes: this.settings.paneSizes }, Date.now(), false);
      saveSession(this.storage, this.tabStore.getSession());
    }
    this.frameBudget.setLimit(this.settings.maxLiveFrames);
    this.frames?.setPreviewConfig({
      enabled: this.settings.enabled && this.settings.previewEnabled,
      clickMode: this.settings.previewClickMode,
    });
    this.secondaryFrames?.setPreviewConfig({
      enabled: this.settings.enabled && this.settings.previewEnabled,
      clickMode: this.settings.previewClickMode,
    });
    this.listFrame?.setConfig({
      enabled: this.settings.enabled && this.settings.previewEnabled,
      clickMode: this.settings.previewClickMode,
      hidePosters: this.settings.hidePosters,
    });
    this.settingsPanel?.setSettings(this.settings);
    this.preview.setEnabled(this.settings.enabled && this.settings.previewEnabled);
    this.credit?.setEnabled(this.settings.enabled && this.settings.creditEnabled);
    if (patch.previewClickMode !== undefined) this.preview.syncClickMode();
    if (patch.restoreSession === false) clearRestorableSessions(this.storage);
    if (!this.settings.enabled || !this.settings.previewEnabled) this.preview.close();
    if (patch.colorizeTabs !== undefined) this.renderTabs();
    const canShowTabs = this.settings.enabled
      && this.settings.tabsEnabled
      && (isSplitRoute(location.href) || this.tabStore.getTabs().length > 0);
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

  private persistPaneSizes(paneSizes: Settings["paneSizes"]): void {
    this.settings = normalizeSettings({ ...this.settings, paneSizes });
    saveSettings(this.storage, this.settings);
    this.tabStore.setSessionFields({ paneSizes: this.settings.paneSizes }, Date.now(), false);
    saveSession(this.storage, this.tabStore.getSession());
    this.settingsPanel?.setSettings(this.settings);
  }

  private scheduleTopicTracking(topicId: string, url: string): void {
    const key = topicId;
    if (this.trackedTopicKey === key) return;
    this.clearTopicTrackSchedule();
    this.trackedTopicKey = key;
    const info = getTopicInfo(url);
    if (!info) return;
    const tracker = createBrowserViewTracker();
    this.topicTrackTimers = [2_500, 10_000].map((delay) => window.setTimeout(() => {
      void tracker.track(info, "browser-open", document.referrer);
    }, delay));
  }

  private clearTopicTrackSchedule(): void {
    for (const timer of this.topicTrackTimers) window.clearTimeout(timer);
    this.topicTrackTimers = [];
    this.trackedTopicKey = "";
  }

  private activateFrame(tab: ReturnType<TopicTabStore["getActive"]>, pane: "primary" | "secondary"): void {
    const pool = pane === "secondary" ? this.secondaryFrames : this.frames;
    if (!tab || !pool) return;
    pool.activate(tab, Date.now());
    const content = pane === "secondary" ? this.layout.getSecondaryContentElement() : this.layout.getContentElement();
    const empty = content?.querySelector<HTMLElement>(".ldu-topic-empty");
    if (empty) empty.hidden = true;
  }

  private handleFrameMessage(message: FrameMessage, iframe: HTMLIFrameElement, pane: "primary" | "secondary"): boolean {
    const tab = this.tabStore.getTabs().find((candidate) => candidate.id === message.tabId);
    if (!tab) return false;
    if (message.type === "ldu:frame-interaction") {
      document.body.dispatchEvent(new MouseEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        button: 0,
      }));
      return true;
    }
    if (message.type === "ldu:bookmark-result") {
      this.showActionToast(message.message || (message.ok ? "已添加到书签" : "添加书签失败"), message.ok === false);
      return true;
    }
    if (message.type === "ldu:list-navigate" && message.url) {
      return this.navigateList(message.url);
    }
    if (message.type === "ldu:preview-open") {
      this.preview.openFromFrame(message.url ?? "", iframe, message.anchorRect);
      return true;
    }
    if (message.type === "ldu:preview-dismiss") {
      this.preview.close();
      return true;
    }
    if (message.type === "ldu:topic-open") {
      const info = message.url ? getTopicInfo(message.url, location.href) : null;
      if (!info || !isSupportedTopicTarget(info.url.href, tab.url)) return false;
      return this.openTopic(info.topicId, info.url.href, message.title || `主题 ${info.topicId}`, info.postNumber, undefined, pane);
    }
    const info = message.url ? getTopicInfo(message.url) : null;
    const sameTopic = info?.topicId === tab.topicId;
    const categoryChanged = Boolean(
      message.categoryName && message.categoryColor
      && (message.categoryName !== tab.categoryName || message.categoryColor !== tab.categoryColor),
    );
    const patch = {
      ...(message.url ? { url: message.url } : {}),
      ...(message.title ? { title: message.title } : {}),
      ...(message.categoryName && message.categoryColor
        ? { categoryName: message.categoryName, categoryColor: message.categoryColor }
        : {}),
      ...(typeof message.scrollY === "number" ? { scrollY: message.scrollY } : {}),
      ...(info?.postNumber ? { postNumber: info.postNumber } : {}),
      suspended: false,
    };
    this.tabStore.update(tab.id, patch, Date.now(), message.type === "ldu:frame-ready" || Boolean(message.title && !sameTopic) || categoryChanged);
    if (message.type === "ldu:frame-state") this.schedulePersist();
    return true;
  }

  private renderTabs(): void {
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
      },
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
        },
      }, { colorizeTabs: this.settings.colorizeTabs });
    }
    const actions = this.layout.getActionsElement();
    if (actions && !actions.querySelector(".ldu-close-all")) {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "ldu-icon-button ldu-close-all";
      setIcon(close, "close", 18);
      close.title = "关闭所有帖子标签";
      close.setAttribute("aria-label", "关闭所有帖子标签");
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
      close.title = "关闭第二阅读区";
      close.setAttribute("aria-label", "关闭第二阅读区并将标签移回主阅读区");
      close.addEventListener("click", () => this.closeSecondaryPanel());
      secondaryActions.append(close);
    }
    const empty = this.layout.getContentElement()?.querySelector<HTMLElement>(".ldu-topic-empty");
    if (empty) empty.hidden = primaryTabs.length > 0;
    const secondaryEmpty = this.layout.getSecondaryContentElement()?.querySelector<HTMLElement>(".ldu-topic-empty");
    if (secondaryEmpty) secondaryEmpty.hidden = secondaryTabs.length > 0;
    const active = this.tabStore.getActive();
    if (active) this.activateFrame(active, "primary");
    const secondaryActive = this.tabStore.getSecondaryActive();
    if (secondaryActive) this.activateFrame(secondaryActive, "secondary");
  }

  private closeTab(tabId: string, pane: "primary" | "secondary"): void {
    (pane === "secondary" ? this.secondaryFrames : this.frames)?.remove(tabId);
    this.tabStore.close(tabId, Date.now());
    if (this.tabStore.getTabs().length === 0) {
      this.disposeSplitRuntime();
      return;
    }
    if (this.tabStore.getPrimaryTabs().length === 0 && this.tabStore.getSecondaryTabs().length > 0) {
      this.closeSecondaryPanel();
    }
  }

  private moveTabToSecondary(tabId: string): void {
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

  private closeSecondaryPanel(): void {
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

  private openTabInBrowser(tabId: string): void {
    const tab = this.tabStore.getTabs().find((candidate) => candidate.id === tabId);
    if (!tab) return;
    const anchor = document.createElement("a");
    anchor.href = tab.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  }

  private reloadTab(tabId: string): void {
    const secondary = this.tabStore.getSession().secondaryTabIds.includes(tabId);
    this.captureLiveFrameState(tabId, secondary ? this.secondaryFrames : this.frames);
    const tab = secondary ? this.tabStore.activateSecondary(tabId, Date.now()) : this.tabStore.activate(tabId, Date.now());
    if (!tab) return;
    const pool = secondary ? this.secondaryFrames : this.frames;
    this.activateFrame(tab, secondary ? "secondary" : "primary");
    pool?.reload(tabId);
  }

  private async copyTabLink(tabId: string): Promise<void> {
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

  private bookmarkTab(tabId: string): void {
    const secondary = this.tabStore.getSession().secondaryTabIds.includes(tabId);
    const tab = secondary ? this.tabStore.activateSecondary(tabId, Date.now()) : this.tabStore.activate(tabId, Date.now());
    if (!tab) return;
    this.activateFrame(tab, secondary ? "secondary" : "primary");
    (secondary ? this.secondaryFrames : this.frames)?.sendCommand(tabId, {
      type: "ldu:bookmark",
      topicId: tab.topicId,
    });
  }

  private closeOtherTabs(tabId: string): void {
    const secondary = this.tabStore.getSession().secondaryTabIds.includes(tabId);
    const paneTabs = secondary ? this.tabStore.getSecondaryTabs() : this.tabStore.getPrimaryTabs();
    for (const tab of paneTabs) {
      if (tab.id !== tabId) (secondary ? this.secondaryFrames : this.frames)?.remove(tab.id);
    }
    this.tabStore.closeOthersInPane(tabId, Date.now());
  }

  private persistSession(): void {
    const active = this.tabStore?.getActive();
    if (active && this.frames) this.captureLiveFrameState(active.id, this.frames);
    const secondaryActive = this.tabStore?.getSecondaryActive();
    if (secondaryActive && this.secondaryFrames) this.captureLiveFrameState(secondaryActive.id, this.secondaryFrames);
    if (this.tabStore) saveSession(this.storage, this.tabStore.getSession());
  }

  private captureLiveFrameState(tabId: string, pool: TopicFramePool | null): TopicTabState | null {
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
      ...(info?.postNumber ? { postNumber: info.postNumber } : {}),
      suspended: false,
    }, Date.now(), false);
    return this.tabStore.getTabs().find((candidate) => candidate.id === tabId) ?? tab;
  }

  private showActionToast(message: string, isError: boolean): void {
    document.querySelector(".ldu-action-toast")?.remove();
    const toast = document.createElement("div");
    toast.className = `ldu-action-toast${isError ? " is-error" : ""}`;
    toast.setAttribute("role", isError ? "alert" : "status");
    toast.textContent = message;
    document.body.append(toast);
    window.setTimeout(() => toast.remove(), 2_800);
  }

  private disposeSplitRuntime(): void {
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

  private handlePageHide(event: PageTransitionEvent): void {
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

  private schedulePersist(): void {
    if (this.persistTimer !== null) window.clearTimeout(this.persistTimer);
    this.persistTimer = window.setTimeout(() => {
      this.persistTimer = null;
      this.persistSession();
    }, 500);
  }
}
