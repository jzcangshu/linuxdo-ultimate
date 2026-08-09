import { getTopicInfo } from "./routes";

export interface TopicToolsConfig {
  ownerOnlyEnabled: boolean;
}

export interface TopicToolsOptions {
  window?: Window;
  document?: Document;
  isEmbedded?: boolean;
  isSplitHost?: () => boolean;
}

const DEFAULT_CONFIG: TopicToolsConfig = {
  ownerOnlyEnabled: true,
};

const OWNER_STATE_KEY = "linuxdo-ultimate:owner-view:v2";
const OWNER_STATE_PREFIX = "linuxdo-ultimate:owner-view:";
const LEGACY_OWNER_STATE_KEY = "on_off";
const OWNER_MIGRATION_KEY = "linuxdo-ultimate:owner-view:migrated";
const MAX_OWNER_TOPICS = 100;
const LEGACY_OWNER_MODE = "当前只看楼主";
const OWNER_BUTTON_TEXT = "只看楼主";

interface OwnerState {
  version: 1;
  topics: Record<string, number>;
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
  private ownerId: string | null = null;
  private pendingPosts = new Set<HTMLElement>();
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
    this.queueApply();
    this.syncObserver();
    return this;
  }

  stop(): void {
    this.disconnectObserver();
    this.started = false;
    this.applyQueued = false;
    this.pendingPosts.clear();
    this.clearOwnerFilter();
    this.doc.getElementById("ldu-owner-toggle")?.remove();
    this.lastOwnerTopicId = "";
    this.ownerId = null;
  }

  setConfig(patch: Partial<TopicToolsConfig>): void {
    const next = { ...this.config, ...patch };
    if (next.ownerOnlyEnabled === this.config.ownerOnlyEnabled) return;
    this.config = next;
    this.syncObserver();
    this.queueApply();
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    this.syncObserver();
    if (!active) return;
    this.queueApply();
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
      this.clearOwnerFilter();
      this.pendingPosts.clear();
      this.ownerId = null;
      this.lastOwnerTopicId = topicId ?? "";
      this.syncOwnerControl();
      this.applyOwnerFilter();
      return;
    }
    this.syncOwnerControl();
    this.applyPendingPosts();
  }

  private syncObserver(): void {
    const shouldObserve = this.started && this.active && this.config.ownerOnlyEnabled;
    if (!shouldObserve) {
      this.disconnectObserver();
      if (!this.config.ownerOnlyEnabled) {
        this.clearOwnerFilter();
        this.doc.getElementById("ldu-owner-toggle")?.remove();
        this.lastOwnerTopicId = "";
        this.ownerId = null;
      }
      return;
    }
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

  private handleMutations(records: MutationRecord[]): void {
    let needsControlSync = false;
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.id === "ldu-owner-toggle" || node.closest("#ldu-owner-toggle")) continue;
        if (node.matches(".topic-post")) this.pendingPosts.add(node as HTMLElement);
        for (const post of node.querySelectorAll<HTMLElement>(".topic-post")) this.pendingPosts.add(post);
        if (node.matches(".timeline-footer-controls") || node.querySelector(".timeline-footer-controls")) {
          needsControlSync = true;
        }
      }
      for (const node of record.removedNodes) {
        if (node instanceof Element && (node.id === "ldu-owner-toggle" || node.querySelector("#ldu-owner-toggle"))) {
          needsControlSync = true;
        }
      }
    }
    if (needsControlSync || this.pendingPosts.size > 0 || this.getTopicId() !== this.lastOwnerTopicId) this.queueApply();
  }

  private isTopicPage(): boolean {
    return getTopicInfo(this.win.location.href, this.win.location.href) !== null;
  }

  private getTopicId(): string | null {
    return getTopicInfo(this.win.location.href, this.win.location.href)?.topicId ?? null;
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

  private findOwnerId(): string | null {
    if (this.ownerId) return this.ownerId;
    const ownerPost = this.doc.querySelector<HTMLElement>(
      '.topic-post.topic-owner [data-user-id], .topic-post.post--topic-owner [data-user-id], #post_1[data-user-id], #post_1 [data-user-id], article[data-post-number="1"][data-user-id], .topic-post[data-post-number="1"] [data-user-id]',
    );
    this.ownerId = ownerPost?.dataset.userId ?? ownerPost?.getAttribute("data-user-id") ?? this.readPreloadedOwnerId();
    return this.ownerId;
  }

  private readPreloadedOwnerId(): string | null {
    const topicId = this.getTopicId();
    const source = this.doc.getElementById("data-preloaded")?.textContent;
    if (!topicId || !source?.includes(`\"topic_${topicId}\"`)) return null;
    const escaped = source.match(/\\"created_by\\":\{[^}]{0,320}?\\"id\\":(\d+)/);
    if (escaped?.[1]) return escaped[1];
    return source.match(/"created_by":\{[^}]{0,320}?"id":(\d+)/)?.[1] ?? null;
  }

  private syncOwnerControl(): void {
    const topicId = this.getTopicId();
    const shouldShow = this.active && this.config.ownerOnlyEnabled && Boolean(topicId) && !this.isHiddenHostTopic();
    const existing = this.doc.getElementById("ldu-owner-toggle");
    if (!shouldShow) {
      existing?.remove();
      this.clearOwnerFilter();
      return;
    }
    if (!topicId) return;
    let button = existing as HTMLButtonElement | null;
    if (!button) {
      button = this.doc.createElement("button");
      button.id = "ldu-owner-toggle";
      button.type = "button";
      button.className = "btn btn-icon-text btn-default btn-small ldu-owner-toggle";
      button.addEventListener("click", () => {
        const currentTopicId = this.getTopicId();
        if (!currentTopicId) return;
        const next = !this.readOwnerMode(currentTopicId);
        this.writeOwnerMode(currentTopicId, next);
        this.updateOwnerButton(button!, next);
        this.applyOwnerFilter();
      });
    }
    const mount = this.findOwnerMount();
    if (!mount) {
      button.remove();
      return;
    }
    const summaryButton = mount.querySelector(".show-summary, .top-replies");
    if (button.parentElement !== mount || button.nextElementSibling !== summaryButton) {
      mount.insertBefore(button, summaryButton ?? mount.firstChild);
    }
    const mode = this.readOwnerMode(topicId);
    this.updateOwnerButton(button, mode);
  }

  private findOwnerMount(): HTMLElement | null {
    return this.doc.querySelector<HTMLElement>(".timeline-footer-controls");
  }

  private updateOwnerButton(button: HTMLButtonElement, ownerOnly: boolean): void {
    const pressed = String(ownerOnly);
    const title = ownerOnly ? "关闭只看楼主" : OWNER_BUTTON_TEXT;
    if (button.textContent !== OWNER_BUTTON_TEXT) button.textContent = OWNER_BUTTON_TEXT;
    if (button.getAttribute("aria-pressed") !== pressed) button.setAttribute("aria-pressed", pressed);
    if (button.title !== title) button.title = title;
    button.classList.toggle("btn-primary", ownerOnly);
    button.classList.toggle("btn-default", !ownerOnly);
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
    this.filterPosts(this.doc.querySelectorAll<HTMLElement>(".topic-post"), ownerId);
  }

  private applyPendingPosts(): void {
    if (this.pendingPosts.size === 0) return;
    const posts = [...this.pendingPosts];
    this.pendingPosts.clear();
    const topicId = this.getTopicId();
    if (!topicId || !this.readOwnerMode(topicId)) return;
    const ownerId = this.findOwnerId();
    if (!ownerId) {
      if (posts.some((post) => post.dataset.postNumber === "1" || post.querySelector('[data-post-number="1"]'))) {
        this.ownerId = null;
        this.applyOwnerFilter();
      }
      return;
    }
    this.filterPosts(posts, ownerId);
  }

  private filterPosts(posts: Iterable<HTMLElement>, ownerId: string): void {
    for (const post of posts) {
      const authorNode = post.matches("[data-user-id]") ? post : post.querySelector<HTMLElement>("[data-user-id]");
      const author = post.dataset.userId ?? authorNode?.dataset.userId ?? authorNode?.getAttribute("data-user-id");
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
