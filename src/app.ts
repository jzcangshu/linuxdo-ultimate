import { createSession } from "./core/session";
import { DEFAULT_SETTINGS, normalizeSettings } from "./core/defaults";
import {
  UserscriptStorage,
  clearRestorableSessions,
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
} from "./core/storage";
import type { SessionLease } from "./core/storage";
import type { SessionState, Settings } from "./core/types";
import { classifyRoute, getTopicInfo, isSplitRoute, isSupportedTopicTarget } from "./discourse/routes";
import { createBrowserViewTracker } from "./discourse/view-tracker";
import { consumeDirectTopicHandoff, peekDirectTopicHandoff, saveDirectTopicHandoff } from "./discourse/direct-topic-handoff";
import { readTopicCategory, type TopicCategoryPresentation } from "./discourse/category";
import { TopicFramePool, type FrameMessage } from "./tabs/frame-pool";
import { TopicTabStore } from "./tabs/tab-store";
import { renderTabStrip } from "./tabs/tab-strip";
import { LayoutController } from "./ui/layout-controller";
import { SettingsPanel } from "./ui/settings-panel";
import { ensureAppStyles } from "./ui/styles";
import { PreviewController } from "./preview/upstream-preview-controller";
import { CreditWidget } from "./credit/credit-widget";

const ROUTE_DEBOUNCE_MS = 100;

export function startLinuxDoApp(): void {
  if (window.self !== window.top) return;
  const start = () => new LinuxDoApp().start();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}

class LinuxDoApp {
  private readonly storage = new UserscriptStorage();
  private settings: Settings = normalizeSettings(DEFAULT_SETTINGS);
  private session!: SessionState;
  private tabStore!: TopicTabStore;
  private layout!: LayoutController;
  private frames!: TopicFramePool;
  private preview!: PreviewController;
  private settingsPanel!: SettingsPanel;
  private credit!: CreditWidget;
  private settingsHost: HTMLElement | null = null;
  private routeTimer: number | null = null;
  private persistTimer: number | null = null;
  private lastRoute = "";
  private listScrollBound = false;
  private restoredTabsTracked = false;
  private trackedTopicKey = "";
  private topicTrackTimers: number[] = [];
  private routeRetryTimer: number | null = null;
  private routeRetryAttempts = 0;
  private hostMaintenanceTimer: number | null = null;
  private hasRestoredSession = false;
  private sessionLease!: SessionLease;
  private leaseTimer: number | null = null;

  start(): void {
    this.settings = loadSettings(this.storage);
    ensureAppStyles();
    this.preview = new PreviewController({
      isEnabled: () => this.settings.enabled && this.settings.previewEnabled,
      clickMode: () => this.settings.previewClickMode,
      onClickModeChange: (previewClickMode) => this.applySettings({ previewClickMode }),
    });
    this.preview.mount();
    this.sessionLease = claimSessionId(
      this.storage,
      window.sessionStorage,
      Date.now(),
      isReloadNavigation(window.performance),
    );
    const sessionId = this.sessionLease.sessionId;
    if (this.settings.restoreSession) reconcileSessionClose(this.storage, sessionId);
    else clearRestorableSessions(this.storage);
    const initial = createSession(sessionId, location.href, Date.now());
    initial.paneSizes = { ...this.settings.paneSizes };
    const currentSession = loadSessionIfPresent(this.storage, sessionId, location.href, Date.now());
    const hasDirectTopicHandoff = Boolean(peekDirectTopicHandoff(window.sessionStorage, Date.now(), location.href));
    const previousSession = !currentSession
      && !hasDirectTopicHandoff
      && classifyRoute(location.href) !== "topic"
      && this.settings.restoreSession
      ? loadLatestSession(this.storage, sessionId, location.href, Date.now())
      : null;
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
      onPaneSizesChange: (paneSizes) => this.persistPaneSizes(paneSizes),
    });
    this.mountSettings();
    this.credit = new CreditWidget();
    this.credit.mount(this.settings.enabled && this.settings.creditEnabled);
    this.lastRoute = location.href;
    this.bindGlobalEvents();
    this.leaseTimer = window.setInterval(() => refreshSessionLease(this.storage, this.sessionLease), 30_000);
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
    document.addEventListener("click", (event) => this.handleTopicLinkClick(event), true);
    window.addEventListener("message", (event) => this.frames?.handleMessage(event));
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
    if (link.closest("button, [role=button], .btn, .d-button, .post-controls, .actions, .topic-map, .topic-timeline, .no-track-view-patch")) return;
    if (classifyRoute(location.href) === "topic") {
      this.promoteDirectTopicNavigation(event, link);
      return;
    }
    if (!isSupportedTopicTarget(link.href, location.href)) return;
    const info = getTopicInfo(link.href);
    if (!info) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const category = readTopicCategory(link.closest(".topic-list-item, .latest-topic-list-item, .search-result") ?? document);
    this.openTopic(info.topicId, info.url.href, link.textContent?.trim() || `主题 ${info.topicId}`, info.postNumber, category ?? undefined);
  }

  private openTopic(
    topicId: string,
    url: string,
    title: string,
    postNumber?: number,
    category?: TopicCategoryPresentation,
  ): void {
    if (!this.layout.mount()) return;
    this.ensureFrames();
    this.layout.setOpen(true);
    this.tabStore.open({ topicId, url, title, ...(postNumber ? { postNumber } : {}), ...category }, Date.now());
    const info = getTopicInfo(url);
    if (info) {
      const tracker = createBrowserViewTracker();
      void tracker.track(info, "split-open", location.href).then((result) => {
        if (result.status === "failed") {
          window.setTimeout(() => void tracker.track(info, "manual-retry", location.href), 10_000);
        }
      });
    }
  }

  private syncRoute(): void {
    this.routeTimer = null;
    if (this.lastRoute !== location.href) {
      this.lastRoute = location.href;
    }
    const route = classifyRoute(location.href);
    const pendingHandoff = peekDirectTopicHandoff(window.sessionStorage, Date.now(), location.href);
    if (route === "topic" && pendingHandoff) {
      location.replace(pendingHandoff.listUrl);
      return;
    }
    if (route === "topic" && this.tabStore.getTabs().length > 0) {
      const info = getTopicInfo(location.href);
      if (info) {
        this.tabStore.open({
          topicId: info.topicId,
          url: info.url.href,
          title: this.currentTopicTitle(info.topicId),
          ...(info.postNumber ? { postNumber: info.postNumber } : {}),
        }, Date.now());
      }
      const listUrl = isSplitRoute(this.tabStore.getSession().listUrl)
        ? this.tabStore.getSession().listUrl
        : new URL("/", location.href).href;
      location.replace(listUrl);
      return;
    }
    const shouldHostSplit = this.settings.enabled
      && this.settings.tabsEnabled
      && (isSplitRoute(location.href) || this.tabStore.getTabs().length > 0);
    if (shouldHostSplit) {
      this.clearTopicTrackSchedule();
      if (!this.layout.mount()) {
        this.scheduleRouteMountRetry();
        return;
      }
      this.routeRetryAttempts = 0;
      this.bindListScroll();
      this.ensureFrames();
      const hasTabs = this.tabStore.getTabs().length > 0;
      this.layout.setOpen(hasTabs);
      if (hasTabs) {
        const active = this.tabStore.getActive();
        if (active) {
          this.activateFrame(active);
          if (this.hasRestoredSession && !this.restoredTabsTracked) {
            this.restoredTabsTracked = true;
            const info = getTopicInfo(active.url);
            if (info) void createBrowserViewTracker().track(info, "restored-tab", location.href);
          }
        }
        this.restoreListScroll();
      }
      const handoff = consumeDirectTopicHandoff(window.sessionStorage, Date.now(), location.href);
      if (handoff) {
        this.tabStore.setSessionFields({ listUrl: handoff.listUrl, listScrollY: 0 }, Date.now(), false);
        for (const topic of handoff.topics) {
          const info = getTopicInfo(topic.url, location.href);
          if (info) this.openTopic(info.topicId, info.url.href, topic.title, info.postNumber);
        }
      }
      return;
    }
    this.layout?.setOpen(false);
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
    const currentTopic = { url: current.url.href, title: this.currentTopicTitle(current.topicId) };
    if (targetRoute === "topic") {
      const target = getTopicInfo(targetUrl.href, location.href);
      if (!target || target.topicId === current.topicId) return;
      const saved = saveDirectTopicHandoff(window.sessionStorage, {
        listUrl: new URL("/", location.href).href,
        topics: [currentTopic, {
          url: target.url.href,
          title: link.textContent?.trim() || `主题 ${target.topicId}`,
        }],
      }, Date.now());
      if (!saved) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign(new URL("/", location.href).href);
      return;
    }
    if (targetRoute === "list" || targetRoute === "search") {
      saveDirectTopicHandoff(window.sessionStorage, {
        listUrl: targetUrl.href,
        topics: [currentTopic],
      }, Date.now());
    }
  }

  private currentTopicTitle(topicId: string): string {
    return document.querySelector<HTMLElement>("#topic-title h1, .fancy-title")?.textContent?.trim()
      || document.title
      || `主题 ${topicId}`;
  }

  private scheduleRouteMountRetry(): void {
    if (this.routeRetryTimer !== null || this.routeRetryAttempts >= 30) return;
    this.routeRetryAttempts += 1;
    this.routeRetryTimer = window.setTimeout(() => {
      this.routeRetryTimer = null;
      this.syncRoute();
    }, 100);
  }

  private scheduleRouteSync(): void {
    if (this.routeTimer !== null) window.clearTimeout(this.routeTimer);
    this.routeTimer = window.setTimeout(() => this.syncRoute(), ROUTE_DEBOUNCE_MS);
  }

  private ensureFrames(): void {
    const content = this.layout.getContentElement();
    if (!content || this.frames) return;
    this.frames = new TopicFramePool(
      content,
      this.settings.maxLiveFrames,
      (message, iframe) => this.handleFrameMessage(message, iframe),
      (tabId, iframe) => {
        const scrollY = iframe.contentWindow?.scrollY ?? 0;
        this.tabStore.update(tabId, { scrollY, suspended: true }, Date.now(), false);
        this.schedulePersist();
      },
    );
    this.frames.setPreviewConfig({
      enabled: this.settings.enabled && this.settings.previewEnabled,
      clickMode: this.settings.previewClickMode,
    });
    this.renderTabs();
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
    this.frames?.setMaxLiveFrames(this.settings.maxLiveFrames);
    this.frames?.setPreviewConfig({
      enabled: this.settings.enabled && this.settings.previewEnabled,
      clickMode: this.settings.previewClickMode,
    });
    this.settingsPanel?.setSettings(this.settings);
    this.credit?.setEnabled(this.settings.enabled && this.settings.creditEnabled);
    if (patch.previewClickMode !== undefined) this.preview.syncClickMode();
    if (patch.restoreSession === false) clearRestorableSessions(this.storage);
    if (!this.settings.enabled || !this.settings.previewEnabled) this.preview.close();
    if (patch.colorizeTabs !== undefined) this.renderTabs();
    const canShowTabs = this.settings.enabled
      && this.settings.tabsEnabled
      && (isSplitRoute(location.href) || this.tabStore.getTabs().length > 0);
    if (!canShowTabs) {
      this.layout.setOpen(false);
      return;
    }
    const active = this.tabStore.getActive();
    this.layout.setOpen(Boolean(active));
    if (active) this.activateFrame(active);
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

  private activateFrame(tab: ReturnType<TopicTabStore["getActive"]>): void {
    if (!tab || !this.frames) return;
    const iframe = this.frames.activate(tab, Date.now());
    const empty = this.layout.getContentElement()?.querySelector<HTMLElement>(".ldu-topic-empty");
    if (empty) empty.hidden = true;
  }

  private handleFrameMessage(message: FrameMessage, iframe: HTMLIFrameElement): void {
    const tab = this.tabStore.getTabs().find((candidate) => candidate.id === message.tabId);
    if (!tab) return;
    if (message.type === "ldu:frame-interaction") {
      document.body.dispatchEvent(new MouseEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        button: 0,
      }));
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
      const info = message.url ? getTopicInfo(message.url, location.href) : null;
      if (!info || !isSupportedTopicTarget(info.url.href, tab.url)) return;
      this.openTopic(info.topicId, info.url.href, message.title || `主题 ${info.topicId}`, info.postNumber);
      return;
    }
    const info = message.url ? getTopicInfo(message.url) : null;
    const sameTopic = info?.topicId === tab.topicId;
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
    this.tabStore.update(tab.id, patch, Date.now(), message.type === "ldu:frame-ready" || Boolean(message.title && !sameTopic));
    if (message.type === "ldu:frame-state") this.schedulePersist();
    if (message.type === "ldu:frame-ready" && tab.scrollY > 0) {
      iframe.contentWindow?.scrollTo({ top: tab.scrollY, behavior: "instant" });
    }
  }

  private renderTabs(): void {
    const root = this.layout?.getTabStripElement();
    if (!root || !this.tabStore) return;
    renderTabStrip(root, this.tabStore.getTabs(), this.tabStore.getSession().activeTabId, {
      onActivate: (tabId) => {
        const tab = this.tabStore.activate(tabId, Date.now());
        if (tab) this.activateFrame(tab);
      },
      onClose: (tabId) => {
        this.frames?.remove(tabId);
        this.tabStore.close(tabId, Date.now());
        const active = this.tabStore.getActive();
        if (active) this.activateFrame(active);
        else this.layout.setOpen(false);
      },
    }, { colorizeTabs: this.settings.colorizeTabs });
    const actions = this.layout.getActionsElement();
    if (actions && !actions.querySelector(".ldu-close-all")) {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "ldu-icon-button ldu-close-all";
      close.textContent = "×";
      close.title = "关闭所有帖子标签";
      close.setAttribute("aria-label", "关闭所有帖子标签");
      close.addEventListener("click", () => {
        for (const tab of this.tabStore.getTabs()) this.frames?.remove(tab.id);
        this.tabStore.clear(Date.now());
        this.layout.setOpen(false);
      });
      actions.append(close);
    }
    const empty = this.layout.getContentElement()?.querySelector<HTMLElement>(".ldu-topic-empty");
    if (empty) empty.hidden = this.tabStore.getTabs().length > 0;
    const active = this.tabStore.getActive();
    if (active) this.activateFrame(active);
  }

  private bindListScroll(): void {
    if (this.listScrollBound) return;
    this.listScrollBound = true;
    let timer: number | null = null;
    window.addEventListener("scroll", () => {
      if (!isSplitRoute(location.href)) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        if (!isSplitRoute(location.href)) return;
        this.tabStore.setSessionFields({ listUrl: location.href, listScrollY: window.scrollY }, Date.now(), false);
        this.schedulePersist();
      }, 180);
    }, { passive: true });
  }

  private restoreListScroll(): void {
    if (this.tabStore.getSession().listUrl !== location.href) return;
    window.setTimeout(() => window.scrollTo({ top: this.tabStore.getSession().listScrollY, behavior: "instant" }), 0);
  }

  private persistSession(): void {
    const active = this.tabStore?.getActive();
    if (active && this.frames) {
      const iframe = document.querySelector<HTMLIFrameElement>(`iframe[data-tab-id="${CSS.escape(active.id)}"]`);
      if (iframe) this.tabStore.update(active.id, { scrollY: iframe.contentWindow?.scrollY ?? active.scrollY }, Date.now(), false);
    }
    if (this.tabStore) saveSession(this.storage, this.tabStore.getSession());
  }

  private handlePageHide(event: PageTransitionEvent): void {
    this.persistSession();
    if (event.persisted) return;
    if (this.settings.restoreSession && this.tabStore?.getTabs().length > 0) {
      stageSessionClose(this.storage, this.tabStore.getSession());
    }
    if (this.leaseTimer !== null) window.clearInterval(this.leaseTimer);
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
