import { getTopicInfo } from "./routes";

export interface TopicToolsConfig {
  ownerOnlyEnabled: boolean;
  cleanModeEnabled: boolean;
  lowEndOptimizationEnabled: boolean;
}

export interface TopicToolsOptions {
  window?: Window;
  document?: Document;
  isEmbedded?: boolean;
  isSplitHost?: () => boolean;
}

const DEFAULT_CONFIG: TopicToolsConfig = {
  ownerOnlyEnabled: false,
  cleanModeEnabled: false,
  lowEndOptimizationEnabled: false,
};

const STYLE_ID = "ldu-topic-tools-style";
const OWNER_STATE_PREFIX = "linuxdo-ultimate:owner-view:";
const LEGACY_OWNER_STATE_KEY = "on_off";
const OWNER_MODE = "当前只看楼主";
const ALL_MODE = "当前查看全部";
const WELCOME_TEXT = "希望你喜欢这里。有问题，请提问，或搜索现有帖子。";

declare global {
  interface Window {
    __LDU_TOPIC_TOOLS__?: TopicToolsController;
  }
}

export class TopicToolsController {
  private config: TopicToolsConfig = { ...DEFAULT_CONFIG };
  private observer: MutationObserver | null = null;
  private applyQueued = false;
  private started = false;
  private lastOwnerTopicId = "";
  private nativeSidebarCollapsed = false;
  private readonly win: Window;
  private readonly doc: Document;
  private readonly embedded: boolean;
  private readonly isSplitHost: () => boolean;

  constructor(options: TopicToolsOptions = {}) {
    this.win = options.window ?? window;
    this.doc = options.document ?? document;
    this.embedded = options.isEmbedded === true;
    this.isSplitHost = options.isSplitHost ?? (() => this.doc.body?.classList.contains("ldu-layout-active") === true);
  }

  start(): this {
    if (this.started) return this;
    this.started = true;
    ensureStyles(this.doc);
    this.queueApply();
    const Observer = (this.win as Window & typeof globalThis).MutationObserver;
    if (Observer && this.doc.documentElement) {
      this.observer = new Observer(() => this.queueApply());
      this.observer.observe(this.doc.documentElement, { childList: true, subtree: true, characterData: true });
    }
    return this;
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.started = false;
    this.clearOwnerFilter();
    this.doc.getElementById("ldu-owner-toggle")?.remove();
  }

  setConfig(patch: Partial<TopicToolsConfig>): void {
    this.config = { ...this.config, ...patch };
    ensureStyles(this.doc);
    this.applyStateAttributes();
    this.queueApply();
  }

  getConfig(): TopicToolsConfig {
    return { ...this.config };
  }

  private queueApply(): void {
    if (this.applyQueued) return;
    this.applyQueued = true;
    const run = () => {
      this.applyQueued = false;
      this.apply();
    };
    if (typeof this.win.requestAnimationFrame === "function") this.win.requestAnimationFrame(run);
    else this.win.setTimeout(run, 0);
  }

  private apply(): void {
    this.applyStateAttributes();
    if (this.config.cleanModeEnabled || this.doc.querySelector('[data-ldu-clean-hidden="true"]')) {
      this.applyCleanTextMarkers();
    }
    if (this.config.ownerOnlyEnabled || this.doc.getElementById("ldu-owner-toggle") || this.lastOwnerTopicId) {
      this.syncOwnerControl();
      this.applyOwnerFilter();
    }
    this.collapseNativeSidebarIfNeeded();
  }

  private applyStateAttributes(): void {
    const root = this.doc.documentElement;
    const cleanMode = String(this.config.cleanModeEnabled);
    const lowEnd = String(this.config.lowEndOptimizationEnabled && isLowEndDevice(this.win.navigator));
    if (root.dataset.lduCleanMode !== cleanMode) root.dataset.lduCleanMode = cleanMode;
    if (root.dataset.lduLowEnd !== lowEnd) root.dataset.lduLowEnd = lowEnd;
  }

  private isTopicPage(): boolean {
    return getTopicInfo(this.win.location.href, this.win.location.href) !== null;
  }

  private getTopicId(): string | null {
    return getTopicInfo(this.win.location.href, this.win.location.href)?.topicId ?? null;
  }

  private storageKey(topicId: string): string {
    return `${OWNER_STATE_PREFIX}${topicId}`;
  }

  private readOwnerMode(topicId: string): boolean {
    try {
      const stored = this.win.localStorage.getItem(this.storageKey(topicId));
      if (stored === "owner" || stored === OWNER_MODE) return true;
      if (stored === "all" || stored === ALL_MODE) return false;
      // 一次性兼容小助手原来的状态键；之后写入按主题的新键，避免不同帖子互相影响。
      const legacy = this.win.localStorage.getItem(LEGACY_OWNER_STATE_KEY);
      if (legacy === OWNER_MODE || legacy === ALL_MODE) {
        const ownerOnly = legacy === OWNER_MODE;
        this.writeOwnerMode(topicId, ownerOnly);
        return ownerOnly;
      }
      return false;
    } catch {
      try {
        return this.win.sessionStorage.getItem(this.storageKey(topicId)) === "owner";
      } catch {
        return false;
      }
    }
  }

  private writeOwnerMode(topicId: string, ownerOnly: boolean): void {
    try {
      this.win.localStorage.setItem(this.storageKey(topicId), ownerOnly ? "owner" : "all");
    } catch {
      try { this.win.sessionStorage.setItem(this.storageKey(topicId), ownerOnly ? "owner" : "all"); } catch { /* best effort */ }
    }
  }

  private findOwnerId(): string | null {
    const ownerPost = this.doc.querySelector<HTMLElement>(
      '#post_1[data-user-id], #post_1 [data-user-id], article[data-post-number="1"][data-user-id], .topic-post[data-post-number="1"] [data-user-id]',
    );
    return ownerPost?.dataset.userId ?? ownerPost?.getAttribute("data-user-id") ?? null;
  }

  private syncOwnerControl(): void {
    const topicId = this.getTopicId();
    const shouldShow = this.config.ownerOnlyEnabled && Boolean(topicId) && !this.isHiddenHostTopic();
    const existing = this.doc.getElementById("ldu-owner-toggle");
    if (!shouldShow) {
      existing?.remove();
      this.clearOwnerFilter();
      this.lastOwnerTopicId = "";
      return;
    }
    if (!topicId) return;
    let button = existing as HTMLButtonElement | null;
    if (!button) {
      button = this.doc.createElement("button");
      button.id = "ldu-owner-toggle";
      button.type = "button";
      button.className = "ldu-owner-toggle";
      button.addEventListener("click", () => {
        const next = !this.readOwnerMode(topicId);
        this.writeOwnerMode(topicId, next);
        this.updateOwnerButton(button!, next);
        this.applyOwnerFilter();
      });
    }
    const mount = this.findOwnerMount();
    if (mount && button.parentElement !== mount) mount.append(button);
    const mode = this.readOwnerMode(topicId);
    this.updateOwnerButton(button, mode);
    if (this.lastOwnerTopicId !== topicId) {
      this.clearOwnerFilter();
      this.lastOwnerTopicId = topicId;
    }
  }

  private findOwnerMount(): HTMLElement | null {
    const candidates = [
      ".topic-footer-main-buttons",
      ".timeline-footer-controls",
      ".topic-controls",
      "#topic-title",
      ".topic-category",
      ".post-stream",
    ];
    for (const selector of candidates) {
      const node = this.doc.querySelector<HTMLElement>(selector);
      if (node) return node;
    }
    return this.doc.body;
  }

  private updateOwnerButton(button: HTMLButtonElement, ownerOnly: boolean): void {
    button.textContent = ownerOnly ? OWNER_MODE : ALL_MODE;
    button.setAttribute("aria-pressed", String(ownerOnly));
    button.title = ownerOnly ? "显示全部回复" : "只看楼主";
  }

  private applyOwnerFilter(): void {
    if (!this.config.ownerOnlyEnabled || !this.isTopicPage()) {
      this.clearOwnerFilter();
      return;
    }
    const topicId = this.getTopicId();
    if (!topicId || !this.readOwnerMode(topicId)) {
      this.clearOwnerFilter();
      return;
    }
    const ownerId = this.findOwnerId();
    if (!ownerId) return;
    for (const post of this.doc.querySelectorAll<HTMLElement>(".topic-post")) {
      const author = post.dataset.userId
        ?? post.querySelector<HTMLElement>("[data-user-id]")?.dataset.userId
        ?? post.querySelector<HTMLElement>("[data-user-id]")?.getAttribute("data-user-id");
      const hidden = author !== ownerId;
      if (post.hidden !== hidden) post.hidden = hidden;
      if (hidden) post.dataset.lduOwnerHidden = "true";
      else delete post.dataset.lduOwnerHidden;
    }
  }

  private clearOwnerFilter(): void {
    for (const post of this.doc.querySelectorAll<HTMLElement>('.topic-post[data-ldu-owner-hidden="true"]')) {
      post.hidden = false;
      delete post.dataset.lduOwnerHidden;
    }
  }

  private applyCleanTextMarkers(): void {
    const hide = this.config.cleanModeEnabled;
    if (!hide) {
      for (const paragraph of this.doc.querySelectorAll<HTMLElement>('[data-ldu-clean-hidden="true"]')) {
        delete paragraph.dataset.lduCleanHidden;
      }
      return;
    }
    for (const paragraph of this.doc.querySelectorAll<HTMLElement>("p")) {
      if (!paragraph.textContent?.includes(WELCOME_TEXT)) continue;
      paragraph.dataset.lduCleanHidden = "true";
    }
  }

  private collapseNativeSidebarIfNeeded(): void {
    if (!this.config.cleanModeEnabled || this.embedded || this.isSplitHost() || this.nativeSidebarCollapsed) return;
    const toggle = this.doc.querySelector<HTMLButtonElement>("button.btn-sidebar-toggle");
    if (toggle?.getAttribute("aria-expanded") !== "true") return;
    this.nativeSidebarCollapsed = true;
    toggle.click();
  }

  private isHiddenHostTopic(): boolean {
    return !this.embedded && this.isSplitHost();
  }
}

export function installTopicTools(options: TopicToolsOptions = {}): TopicToolsController {
  const win = options.window ?? window;
  if (win.__LDU_TOPIC_TOOLS__) return win.__LDU_TOPIC_TOOLS__;
  const controller = new TopicToolsController(options);
  win.__LDU_TOPIC_TOOLS__ = controller;
  controller.start();
  return controller;
}

function isLowEndDevice(navigator: Navigator): boolean {
  const hardwareConcurrency = navigator.hardwareConcurrency;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 4)
    || (typeof deviceMemory === "number" && Number.isFinite(deviceMemory) && deviceMemory <= 4);
}

function ensureStyles(doc: Document): HTMLStyleElement {
  const existing = doc.getElementById(STYLE_ID);
  if (existing instanceof HTMLStyleElement) return existing;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html[data-ldu-clean-mode="true"] #global-notice-alert-global-notice,
    html[data-ldu-clean-mode="true"] div.link-bottom-line a.badge-category__wrapper,
    html[data-ldu-clean-mode="true"] td.posters.topic-list-data,
    html[data-ldu-clean-mode="true"] a.discourse-tag.box[href^="/tag/"],
    html[data-ldu-clean-mode="true"] a[href="/t/topic/482293"],
    html[data-ldu-clean-mode="true"] a[href="https://linux.do/t/topic/482293"] {
      display: none !important;
    }
    html[data-ldu-clean-mode="true"] [data-ldu-clean-hidden="true"] {
      display: none !important;
    }
    html[data-ldu-low-end="true"] *,
    html[data-ldu-low-end="true"] *::before,
    html[data-ldu-low-end="true"] *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    .ldu-owner-toggle {
      display: inline-flex;
      min-height: 28px;
      align-items: center;
      justify-content: center;
      margin: 4px 6px 4px 0;
      padding: 4px 9px;
      border: 1px solid var(--primary-low, #d9d9d9);
      border-radius: 5px;
      background: var(--secondary, #fff);
      color: var(--primary, #222);
      cursor: pointer;
      font: inherit;
      font-size: var(--font-down-1, .875rem);
      line-height: 1.2;
    }
    .ldu-owner-toggle:hover { background: var(--primary-very-low, #f5f5f5); }
    .ldu-owner-toggle[aria-pressed="true"] { border-color: var(--tertiary, #0088cc); color: var(--tertiary, #0088cc); }
  `;
  (doc.head ?? doc.documentElement).append(style);
  return style;
}
