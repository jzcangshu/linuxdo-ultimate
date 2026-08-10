import { getTopicInfo } from "./routes";

export interface TopicToolsConfig {
  ownerOnlyEnabled: boolean;
}

export interface TopicToolsOptions {
  window?: Window;
  document?: Document;
  isEmbedded?: boolean;
  isSplitHost?: () => boolean;
  navigate?: (url: string) => void;
}

const DEFAULT_CONFIG: TopicToolsConfig = {
  ownerOnlyEnabled: true,
};

const OWNER_STATE_KEY = "linuxdo-ultimate:owner-view:v2";
const OWNER_STATE_PREFIX = "linuxdo-ultimate:owner-view:";
const LEGACY_OWNER_STATE_KEY = "on_off";
const OWNER_MIGRATION_KEY = "linuxdo-ultimate:owner-view:migrated";
const OWNER_FILTER_PARAM = "username_filters";
const SUMMARY_FILTER_PARAM = "filter";
const SUMMARY_FILTER_VALUE = "summary";
const MAX_OWNER_TOPICS = 100;
const LEGACY_OWNER_MODE = "当前只看楼主";
const OWNER_BUTTON_TEXT = "只看楼主";
const OWNER_CONTROL_MUTATION_SELECTOR = [
  ".timeline-footer-controls",
  "#data-preloaded",
  ".show-summary",
  ".top-replies",
  ".posts-filtered-notice",
  ".filtered-replies-show-all",
].join(", ");
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

interface OwnerState {
  version: 1;
  topics: Record<string, number>;
}

function extractOwnerUsername(value: unknown): string | null {
  let source = value;
  if (typeof source === "string") {
    try { source = JSON.parse(source) as unknown; } catch { return null; }
  }
  if (!source || typeof source !== "object") return null;
  const details = (source as Record<string, unknown>).details;
  if (!details || typeof details !== "object") return null;
  const createdBy = (details as Record<string, unknown>).created_by;
  if (!createdBy || typeof createdBy !== "object") return null;
  const username = (createdBy as Record<string, unknown>).username;
  return typeof username === "string" && username.trim() ? username.trim() : null;
}

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
  private active = true;
  private lastOwnerTopicId = "";
  private ownerUsername: string | null = null;
  private pendingNativeClearTopicId = "";
  private ownerLookupTopicId = "";
  private ownerLookupPromise: Promise<string | null> | null = null;
  private documentClickBound = false;
  private readonly win: Window;
  private readonly doc: Document;
  private readonly embedded: boolean;
  private readonly isSplitHost: () => boolean;
  private readonly navigate: (url: string) => void;

  constructor(options: TopicToolsOptions = {}) {
    this.win = options.window ?? window;
    this.doc = options.document ?? document;
    this.embedded = options.isEmbedded === true;
    this.isSplitHost = options.isSplitHost ?? (() => this.doc.body?.classList.contains("ldu-layout-active") === true);
    this.navigate = options.navigate ?? ((url) => this.win.location.assign(url));
  }

  start(): this {
    if (this.started) return this;
    this.started = true;
    this.syncObserver();
    this.queueApply();
    return this;
  }

  stop(clearNativeFilter = false): void {
    this.disconnectObserver();
    this.unbindDocumentClick();
    this.started = false;
    this.applyQueued = false;
    this.doc.getElementById("ldu-owner-toggle")?.remove();
    if (clearNativeFilter) this.clearNativeOwnerFilter();
    this.lastOwnerTopicId = "";
    this.ownerUsername = null;
  }

  setConfig(patch: Partial<TopicToolsConfig>): void {
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

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    this.syncObserver();
    if (active) this.queueApply();
  }

  private queueApply(): void {
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

  private apply(): void {
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

  private syncObserver(): void {
    const shouldObserve = this.started && this.active && this.config.ownerOnlyEnabled;
    if (!shouldObserve) {
      this.disconnectObserver();
      this.unbindDocumentClick();
      return;
    }
    this.bindDocumentClick();
    if (this.observer) return;
    const Observer = (this.win as Window & typeof globalThis).MutationObserver;
    const target = this.doc.body ?? this.doc.documentElement;
    if (!Observer || !target) return;
    this.observer = new Observer((records) => this.handleMutations(records));
    this.observer.observe(target, { childList: true, subtree: true });
  }

  private disconnectObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private bindDocumentClick(): void {
    if (this.documentClickBound) return;
    this.doc.addEventListener("click", this.handleDocumentClick, true);
    this.documentClickBound = true;
  }

  private unbindDocumentClick(): void {
    if (!this.documentClickBound) return;
    this.doc.removeEventListener("click", this.handleDocumentClick, true);
    this.documentClickBound = false;
  }

  private readonly handleDocumentClick = (event: MouseEvent): void => {
    if (!this.active || !this.config.ownerOnlyEnabled || event.button > 0) return;
    const filterClear = event.target instanceof Element
      ? event.target.closest<HTMLElement>(".filtered-replies-show-all")
      : null;
    if (filterClear) {
      const topicId = this.getTopicId();
      const ownerUsername = this.findOwnerUsername();
      if (topicId && ownerUsername && this.isNativeOwnerFilterActive(ownerUsername)) {
        this.pendingNativeClearTopicId = topicId;
        this.writeOwnerMode(topicId, false);
        this.updateCurrentButton(false);
      }
      return;
    }
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>(".show-summary, .top-replies") : null;
    if (!target) return;
    const ownerUsername = this.findOwnerUsername();
    if (!ownerUsername || !this.isNativeOwnerFilterActive(ownerUsername)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const url = this.currentUrl();
    const summaryActive = url.searchParams.get(SUMMARY_FILTER_PARAM) === SUMMARY_FILTER_VALUE
      || target.textContent?.includes("全部显示") === true;
    if (summaryActive) url.searchParams.delete(SUMMARY_FILTER_PARAM);
    else url.searchParams.set(SUMMARY_FILTER_PARAM, SUMMARY_FILTER_VALUE);
    this.navigate(url.href);
  };

  private handleMutations(records: MutationRecord[]): void {
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
        if (node.matches(OWNER_CONTROL_MUTATION_SELECTOR)
          || node.querySelector(`${OWNER_CONTROL_MUTATION_SELECTOR}, #ldu-owner-toggle`)) {
          this.queueApply();
          return;
        }
      }
    }
  }

  private getTopicId(): string | null {
    return getTopicInfo(this.win.location.href, this.win.location.href)?.topicId ?? null;
  }

  private currentUrl(): URL {
    return new URL(this.win.location.href, this.win.location.href);
  }

  private readOwnerMode(topicId: string): boolean {
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

  private writeOwnerMode(topicId: string, ownerOnly: boolean): void {
    try {
      this.writeOwnerState(this.win.localStorage, topicId, ownerOnly);
    } catch {
      try { this.writeOwnerState(this.win.sessionStorage, topicId, ownerOnly); } catch { /* best effort */ }
    }
  }

  private readOwnerState(storage: Storage): OwnerState {
    try {
      const parsed = JSON.parse(storage.getItem(OWNER_STATE_KEY) ?? "null") as Partial<OwnerState> | null;
      if (!parsed || parsed.version !== 1 || !parsed.topics || typeof parsed.topics !== "object") {
        return { version: 1, topics: {} };
      }
      const topics: Record<string, number> = {};
      for (const [topicId, updatedAt] of Object.entries(parsed.topics)) {
        if (/^\d+$/.test(topicId) && typeof updatedAt === "number" && Number.isFinite(updatedAt)) topics[topicId] = updatedAt;
      }
      return { version: 1, topics };
    } catch {
      return { version: 1, topics: {} };
    }
  }

  private writeOwnerState(storage: Storage, topicId: string, ownerOnly: boolean): void {
    const state = this.readOwnerState(storage);
    if (ownerOnly) state.topics[topicId] = Date.now();
    else delete state.topics[topicId];
    const retained = Object.entries(state.topics)
      .sort(([, left], [, right]) => right - left)
      .slice(0, MAX_OWNER_TOPICS);
    storage.setItem(OWNER_STATE_KEY, JSON.stringify({ version: 1, topics: Object.fromEntries(retained) } satisfies OwnerState));
  }

  private migrateOwnerState(currentTopicId: string): void {
    let storage: Storage;
    try {
      storage = this.win.localStorage;
      if (storage.getItem(OWNER_MIGRATION_KEY) === "1") return;
    } catch {
      return;
    }
    const state = this.readOwnerState(storage);
    const legacyMode = storage.getItem(LEGACY_OWNER_STATE_KEY);
    if (legacyMode === LEGACY_OWNER_MODE) state.topics[currentTopicId] = Date.now();
    const staleKeys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(OWNER_STATE_PREFIX) || key === OWNER_STATE_KEY) continue;
      staleKeys.push(key);
      const topicId = key.slice(OWNER_STATE_PREFIX.length);
      const value = storage.getItem(key);
      if (/^\d+$/.test(topicId) && (value === "owner" || value === LEGACY_OWNER_MODE)) state.topics[topicId] = Date.now();
    }
    const retained = Object.entries(state.topics)
      .sort(([, left], [, right]) => right - left)
      .slice(0, MAX_OWNER_TOPICS);
    storage.setItem(OWNER_STATE_KEY, JSON.stringify({ version: 1, topics: Object.fromEntries(retained) } satisfies OwnerState));
    for (const key of staleKeys) storage.removeItem(key);
    storage.removeItem(LEGACY_OWNER_STATE_KEY);
    storage.setItem(OWNER_MIGRATION_KEY, "1");
  }

  private findOwnerUsername(): string | null {
    if (this.ownerUsername) return this.ownerUsername;
    const ownerLink = this.doc.querySelector<HTMLElement>(
      ".topic-post.topic-owner [data-user-card], .topic-post.post--topic-owner [data-user-card], #post_1 [data-user-card]",
    );
    this.ownerUsername = ownerLink?.dataset.userCard?.trim() || this.readPreloadedOwnerUsername();
    return this.ownerUsername;
  }

  private readPreloadedOwnerUsername(): string | null {
    const topicId = this.getTopicId();
    const source = this.doc.getElementById("data-preloaded")?.textContent;
    if (!topicId || !source) return null;
    try {
      const preloaded = JSON.parse(source) as Record<string, unknown>;
      const rawTopic = preloaded[`topic_${topicId}`];
      return extractOwnerUsername(rawTopic);
    } catch {
      return null;
    }
  }

  private resolveOwnerUsername(topicId: string): Promise<string | null> {
    const known = this.findOwnerUsername();
    if (known) return Promise.resolve(known);
    if (this.ownerLookupTopicId === topicId && this.ownerLookupPromise) return this.ownerLookupPromise;
    const fetcher = this.win.fetch?.bind(this.win);
    if (!fetcher) return Promise.resolve(null);
    this.ownerLookupTopicId = topicId;
    const request = fetcher(`/t/${topicId}.json`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => response.ok ? extractOwnerUsername(await response.json()) : null)
      .catch(() => null);
    this.ownerLookupPromise = request.then((username) => {
      if (this.getTopicId() === topicId && username) this.ownerUsername = username;
      return username;
    }).finally(() => {
      if (this.ownerLookupTopicId === topicId) this.ownerLookupPromise = null;
    });
    return this.ownerLookupPromise;
  }

  private toggleOwnerFilter(button: HTMLButtonElement, topicId: string, ownerUsername: string): void {
    const next = !this.isNativeOwnerFilterActive(ownerUsername);
    this.pendingNativeClearTopicId = next ? "" : topicId;
    this.writeOwnerMode(topicId, next);
    this.updateOwnerButton(button, next);
    if (next) this.navigateWithOwnerFilter(ownerUsername);
    else this.navigateWithoutOwnerFilter();
  }

  private syncOwnerControl(): void {
    const topicId = this.getTopicId();
    const shouldShow = this.active && this.config.ownerOnlyEnabled && Boolean(topicId) && !this.isHiddenHostTopic();
    const existing = this.doc.getElementById("ldu-owner-toggle") as HTMLButtonElement | null;
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
        const ownerUsername = this.findOwnerUsername();
        if (ownerUsername) {
          this.toggleOwnerFilter(button!, currentTopicId, ownerUsername);
          return;
        }
        if (button!.dataset.ownerLookupPending === "true") return;
        button!.dataset.ownerLookupPending = "true";
        void this.resolveOwnerUsername(currentTopicId).then((resolvedOwner) => {
          delete button!.dataset.ownerLookupPending;
          if (!resolvedOwner || this.getTopicId() !== currentTopicId) return;
          this.toggleOwnerFilter(button!, currentTopicId, resolvedOwner);
        });
      });
    }
    const mount = this.doc.querySelector<HTMLElement>(".timeline-footer-controls");
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

  private updateCurrentButton(ownerOnly: boolean): void {
    const button = this.doc.getElementById("ldu-owner-toggle");
    if (button instanceof HTMLButtonElement) this.updateOwnerButton(button, ownerOnly);
  }

  private updateOwnerButton(button: HTMLButtonElement, ownerOnly: boolean): void {
    const pressed = String(ownerOnly);
    const title = ownerOnly ? "关闭只看楼主" : OWNER_BUTTON_TEXT;
    const label = button.querySelector<HTMLElement>(".d-button-label");
    if (label && label.textContent !== OWNER_BUTTON_TEXT) label.textContent = OWNER_BUTTON_TEXT;
    if (button.getAttribute("aria-pressed") !== pressed) button.setAttribute("aria-pressed", pressed);
    if (button.title !== title) button.title = title;
    button.classList.toggle("btn-primary", ownerOnly);
    button.classList.toggle("btn-default", !ownerOnly);
  }

  private isNativeOwnerFilterActive(ownerUsername: string): boolean {
    return this.currentUrl().searchParams.get(OWNER_FILTER_PARAM) === ownerUsername;
  }

  private navigateWithOwnerFilter(ownerUsername: string): void {
    const url = this.currentUrl();
    if (url.searchParams.get(OWNER_FILTER_PARAM) === ownerUsername) return;
    url.searchParams.set(OWNER_FILTER_PARAM, ownerUsername);
    this.navigate(url.href);
  }

  private navigateWithoutOwnerFilter(): void {
    const url = this.currentUrl();
    if (!url.searchParams.has(OWNER_FILTER_PARAM)) return;
    url.searchParams.delete(OWNER_FILTER_PARAM);
    this.navigate(url.href);
  }

  private clearNativeOwnerFilter(): void {
    const ownerUsername = this.findOwnerUsername();
    const topicId = this.getTopicId();
    if (topicId && ownerUsername && this.isNativeOwnerFilterActive(ownerUsername)) {
      this.pendingNativeClearTopicId = topicId;
      this.navigateWithoutOwnerFilter();
    }
  }

  private isHiddenHostTopic(): boolean {
    return !this.embedded && this.isSplitHost();
  }
}

export function installTopicTools(options: TopicToolsOptions = {}): TopicToolsController {
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
