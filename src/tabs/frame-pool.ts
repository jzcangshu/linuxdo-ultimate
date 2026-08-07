import type { TopicTabState } from "../core/types";
import { installTopicFrameBridge } from "../frame-runtime";
import { getTopicInfo } from "../discourse/routes";

export interface FrameMessage {
  type: "ldu:frame-state" | "ldu:frame-ready" | "ldu:frame-interaction" | "ldu:bookmark-result" | "ldu:preview-open" | "ldu:preview-dismiss" | "ldu:topic-open" | "ldu:list-navigate";
  tabId: string;
  url?: string;
  title?: string;
  scrollY?: number;
  postNumber?: number;
  categoryName?: string;
  categoryColor?: string;
  ok?: boolean;
  message?: string;
  anchorRect?: { left: number; top: number; right: number; bottom: number; width: number; height: number };
  requestId?: string;
}

interface FramePreviewConfig {
  enabled: boolean;
  clickMode: "double" | "single";
}

interface FrameRecord {
  iframe: HTMLIFrameElement;
  lastUsedAt: number;
  reportedUrl: string | null;
  loaded: boolean;
  commands: FrameCommand[];
  loadListener: () => void;
  restoreScrollY: number;
  restoreTimer: number | null;
  restoreDeadline: number;
  bridgeCleanup: (() => void) | null;
  expectedTopicId: string;
}

export type FrameCommand = { type: "ldu:bookmark"; topicId: string };
export type FrameTransfer = FrameRecord;

interface BudgetEntry {
  pool: TopicFramePool;
  tabId: string;
  lastUsedAt: number;
  active: boolean;
}

export class FrameBudget {
  private limit: number;
  private readonly entries = new Map<TopicFramePool, Map<string, BudgetEntry>>();

  constructor(limit: number) {
    this.limit = this.clamp(limit);
  }

  setLimit(value: number): void {
    this.limit = this.clamp(value);
    this.enforce();
  }

  activate(pool: TopicFramePool, tabId: string, now: number): void {
    const poolEntries = this.entries.get(pool) ?? new Map<string, BudgetEntry>();
    for (const entry of poolEntries.values()) entry.active = false;
    poolEntries.set(tabId, { pool, tabId, lastUsedAt: now, active: true });
    this.entries.set(pool, poolEntries);
    this.enforce();
  }

  remove(pool: TopicFramePool, tabId: string): void {
    const poolEntries = this.entries.get(pool);
    poolEntries?.delete(tabId);
    if (poolEntries?.size === 0) this.entries.delete(pool);
  }

  count(): number {
    return [...this.entries.values()].reduce((total, entries) => total + entries.size, 0);
  }

  private enforce(): void {
    while (this.count() > this.limit) {
      const candidate = [...this.entries.values()]
        .flatMap((entries) => [...entries.values()])
        .filter((entry) => !entry.active)
        .sort((a, b) => a.lastUsedAt - b.lastUsedAt)[0];
      if (!candidate) return;
      candidate.pool.suspendForBudget(candidate.tabId);
    }
  }

  private clamp(value: number): number {
    return Math.max(1, Math.min(10, Math.floor(value)));
  }
}

export class TopicFramePool {
  private readonly frames = new Map<string, FrameRecord>();
  private liveLimit: number;
  private previewConfig: FramePreviewConfig = { enabled: false, clickMode: "double" };

  constructor(
    private readonly container: HTMLElement,
    private readonly maxLiveFrames: number,
    private readonly onMessage: (message: FrameMessage, iframe: HTMLIFrameElement) => boolean,
    private readonly onSuspend: (tabId: string, iframe: HTMLIFrameElement) => void,
    private readonly budget?: FrameBudget,
  ) { this.liveLimit = Math.max(1, maxLiveFrames); }

  setMaxLiveFrames(value: number): void {
    if (this.budget) {
      this.budget.setLimit(value);
      return;
    }
    this.liveLimit = Math.max(1, Math.min(10, Math.floor(value)));
    this.suspendOverflow("");
  }

  setPreviewConfig(config: FramePreviewConfig): void {
    this.previewConfig = { ...config };
    for (const record of this.frames.values()) this.sendPreviewConfig(record.iframe);
  }

  activate(tab: TopicTabState, now: number): HTMLIFrameElement {
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
        current.loaded = false;
        this.installBridge(tab.id, current);
        this.sendPreviewConfig(iframe);
        iframe.dataset.lduReady = "true";
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
        restoreDeadline: 0,
        bridgeCleanup: null,
        expectedTopicId: tab.topicId,
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
        record.expectedTopicId = tab.topicId;
        record.restoreScrollY = tab.scrollY;
        record.bridgeCleanup?.();
        record.bridgeCleanup = null;
        delete record.iframe.dataset.lduReady;
        record.iframe.src = requestedUrl;
      }
    }

    for (const [tabId, current] of this.frames) {
      const active = tabId === tab.id;
      current.iframe.setAttribute("aria-hidden", String(!active));
      current.iframe.tabIndex = active ? 0 : -1;
    }
    if (this.budget) this.budget.activate(this, tab.id, now);
    else this.suspendOverflow(tab.id);
    return record.iframe;
  }

  handleMessage(event: MessageEvent): void {
    const data = event.data as Partial<FrameMessage> | null;
    if (!data || !["ldu:frame-state", "ldu:frame-ready", "ldu:frame-interaction", "ldu:bookmark-result", "ldu:preview-open", "ldu:preview-dismiss", "ldu:topic-open", "ldu:list-navigate"].includes(data.type ?? "") || typeof data.tabId !== "string") return;
    const record = this.frames.get(data.tabId);
    if (!record || event.origin !== location.origin || event.source !== record.iframe.contentWindow) return;
    if ((data.type === "ldu:frame-state" || data.type === "ldu:frame-ready") && data.url) {
      try {
        const reportedUrl = new URL(data.url, document.baseURI).href;
        if (getTopicInfo(reportedUrl, document.baseURI)?.topicId !== record.expectedTopicId) return;
        record.reportedUrl = reportedUrl;
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
    const accepted = this.onMessage(data as FrameMessage, record.iframe);
    if (accepted && data.requestId && (data.type === "ldu:topic-open" || data.type === "ldu:list-navigate")) {
      record.iframe.contentWindow?.postMessage({
        type: "ldu:navigation-ack",
        tabId: data.tabId,
        requestId: data.requestId,
      }, location.origin);
    }
  }

  remove(tabId: string): void {
    const record = this.frames.get(tabId);
    if (!record) return;
    record.commands = [];
    record.bridgeCleanup?.();
    record.bridgeCleanup = null;
    this.cancelScrollRestore(record);
    record.iframe.removeEventListener("load", record.loadListener);
    record.iframe.remove();
    this.frames.delete(tabId);
    this.budget?.remove(this, tabId);
  }

  sendCommand(tabId: string, command: FrameCommand): void {
    const record = this.frames.get(tabId);
    if (!record) return;
    if (!record.loaded) {
      record.commands.push(command);
      return;
    }
    record.iframe.contentWindow?.postMessage({ ...command, tabId }, location.origin);
  }

  getFrame(tabId: string): HTMLIFrameElement | null {
    return this.frames.get(tabId)?.iframe ?? null;
  }

  reload(tabId: string): boolean {
    const record = this.frames.get(tabId);
    if (!record) return false;
    record.loaded = false;
    record.reportedUrl = null;
    record.bridgeCleanup?.();
    record.bridgeCleanup = null;
    delete record.iframe.dataset.lduReady;
    try {
      record.iframe.contentWindow?.location.reload();
    } catch {
      record.iframe.src = record.iframe.src;
    }
    return true;
  }

  detach(tabId: string): FrameTransfer | null {
    const record = this.frames.get(tabId);
    if (!record) return null;
    this.cancelScrollRestore(record);
    record.iframe.removeEventListener("load", record.loadListener);
    record.iframe.remove();
    this.frames.delete(tabId);
    this.budget?.remove(this, tabId);
    return record;
  }

  adopt(tab: TopicTabState, transfer: FrameTransfer, now: number): HTMLIFrameElement {
    const iframe = transfer.iframe;
    iframe.name = `ldu-topic:${tab.id}`;
    iframe.dataset.tabId = tab.id;
    iframe.title = tab.title;
    const loadListener = () => {
      const current = this.frames.get(tab.id);
      if (!current || current.iframe !== iframe) return;
      current.loaded = false;
      this.installBridge(tab.id, current);
      this.sendPreviewConfig(iframe);
      iframe.dataset.lduReady = "true";
    };
    iframe.addEventListener("load", loadListener);
    const requestedUrl = new URL(tab.url, document.baseURI).href;
    const needsNavigation = iframe.src !== requestedUrl && transfer.reportedUrl !== requestedUrl;
    const record: FrameRecord = {
      ...transfer,
      lastUsedAt: now,
      reportedUrl: needsNavigation ? null : transfer.reportedUrl,
      loaded: needsNavigation ? false : transfer.loaded,
      loadListener,
      restoreScrollY: tab.scrollY,
      restoreTimer: null,
      restoreDeadline: 0,
      expectedTopicId: tab.topicId,
    };
    if (needsNavigation) {
      record.bridgeCleanup?.();
      record.bridgeCleanup = null;
      delete iframe.dataset.lduReady;
      iframe.src = requestedUrl;
    }
    this.frames.set(tab.id, record);
    this.container.append(iframe);
    if (record.loaded) {
      iframe.dataset.lduReady = "true";
      this.sendPreviewConfig(iframe);
      this.flushCommands(record);
    }
    this.activate(tab, now);
    return iframe;
  }

  destroy(): void {
    for (const record of this.frames.values()) {
      record.commands = [];
      record.bridgeCleanup?.();
      record.bridgeCleanup = null;
      this.cancelScrollRestore(record);
      record.iframe.removeEventListener("load", record.loadListener);
      record.iframe.remove();
      this.budget?.remove(this, record.iframe.dataset.tabId ?? "");
    }
    this.frames.clear();
  }

  private sendPreviewConfig(iframe: HTMLIFrameElement): void {
    iframe.contentWindow?.postMessage({ type: "ldu:preview-config", tabId: iframe.dataset.tabId, ...this.previewConfig }, location.origin);
  }

  private installBridge(tabId: string, record: FrameRecord): void {
    record.bridgeCleanup?.();
    record.bridgeCleanup = null;
    try {
      if (record.iframe.contentWindow && record.iframe.contentDocument) {
        record.bridgeCleanup = installTopicFrameBridge(record.iframe.contentWindow, record.iframe.contentDocument, tabId);
      }
    } catch {
      // Same-origin topic loads install normally; browser error documents are left untouched.
    }
  }

  private flushCommands(record: FrameRecord): void {
    const commands = record.commands.splice(0);
    for (const command of commands) {
      record.iframe.contentWindow?.postMessage({ ...command, tabId: record.iframe.dataset.tabId }, location.origin);
    }
  }

  private restoreScroll(record: FrameRecord): void {
    const target = record.restoreScrollY;
    if (target <= 0 || !record.iframe.contentWindow) return;
    if (record.restoreTimer !== null) window.clearTimeout(record.restoreTimer);
    if (record.restoreDeadline === 0) record.restoreDeadline = Date.now() + 5_000;
    record.iframe.contentWindow.scrollTo({ top: target, behavior: "instant" });
    record.restoreScrollY = 0;
    record.restoreDeadline = 0;
    record.restoreTimer = null;
  }

  private cancelScrollRestore(record: FrameRecord): void {
    if (record.restoreTimer !== null) window.clearTimeout(record.restoreTimer);
    record.restoreTimer = null;
    record.restoreDeadline = 0;
  }

  private suspendOverflow(activeTabId: string): void {
    while (this.frames.size > this.liveLimit) {
      const candidates = [...this.frames.entries()]
        .filter(([tabId]) => tabId !== activeTabId)
        .sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt);
      const candidate = candidates[0];
      if (!candidate) return;
      const [tabId, record] = candidate;
      record.commands = [];
      record.bridgeCleanup?.();
      record.bridgeCleanup = null;
      this.cancelScrollRestore(record);
      record.iframe.removeEventListener("load", record.loadListener);
      record.iframe.remove();
      this.frames.delete(tabId);
      this.onSuspend(tabId, record.iframe);
    }
  }

  suspendForBudget(tabId: string): void {
    const record = this.frames.get(tabId);
    if (!record) {
      this.budget?.remove(this, tabId);
      return;
    }
    record.commands = [];
    record.bridgeCleanup?.();
    record.bridgeCleanup = null;
    this.cancelScrollRestore(record);
    record.iframe.removeEventListener("load", record.loadListener);
    record.iframe.remove();
    this.frames.delete(tabId);
    this.budget?.remove(this, tabId);
    this.onSuspend(tabId, record.iframe);
  }
}
