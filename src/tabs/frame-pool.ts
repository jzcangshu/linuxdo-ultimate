import type { TopicTabState } from "../core/types";
import type { PageToolsConfig } from "../discourse/page-tools-client";

export interface FrameMessage {
  type: "ldu:frame-state" | "ldu:frame-ready" | "ldu:frame-interaction" | "ldu:bookmark-result" | "ldu:preview-open" | "ldu:preview-dismiss" | "ldu:topic-open" | "ldu:list-navigate";
  tabId: string;
  url?: string;
  title?: string;
  postNumber?: number;
  ok?: boolean;
  message?: string;
  anchorRect?: { left: number; top: number; right: number; bottom: number; width: number; height: number };
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
  softFrozen: boolean;
  commands: FrameCommand[];
  loadListener: () => void;
  configSentForDocument: boolean;
}

export type FrameCommand = { type: "ldu:bookmark"; topicId: string };
export type FrameTransfer = FrameRecord;

export class TopicFramePool {
  private readonly frames = new Map<string, FrameRecord>();
  private liveLimit: number;
  private previewConfig: FramePreviewConfig = { enabled: false, clickMode: "double" };
  private pageToolsConfig: PageToolsConfig = {
    ownerOnlyEnabled: false,
    minimalHidePosters: false,
    minimalHideNotices: false,
    minimalHideCategoryBadges: false,
    minimalHideTags: false,
    lowEndOptimizationEnabled: false,
  };
  private activeTabId: string | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly maxLiveFrames: number,
    private readonly onMessage: (message: FrameMessage, iframe: HTMLIFrameElement) => void,
    private readonly onSuspend: (tabId: string) => void,
  ) { this.liveLimit = Math.max(1, maxLiveFrames); }

  setMaxLiveFrames(value: number): void {
    this.liveLimit = Math.max(1, Math.min(10, Math.floor(value)));
    this.suspendOverflow("");
  }

  setPreviewConfig(config: FramePreviewConfig): void {
    if (samePreviewConfig(this.previewConfig, config)) return;
    this.previewConfig = { ...config };
    for (const record of this.frames.values()) this.sendPreviewConfig(record.iframe);
  }

  setPageToolsConfig(config: PageToolsConfig): void {
    if (samePageToolsConfig(this.pageToolsConfig, config)) return;
    this.pageToolsConfig = { ...config };
    for (const record of this.frames.values()) this.sendPageToolsConfig(record.iframe);
  }

  activate(tab: TopicTabState, now: number): HTMLIFrameElement {
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

  prepare(tab: TopicTabState, now: number): HTMLIFrameElement {
    const activeTabId = this.activeTabId && this.frames.has(this.activeTabId) ? this.activeTabId : "";
    const record = this.ensureRecord(tab, now);
    if (tab.id !== activeTabId) this.setFrameActive(record, false);
    this.suspendOverflow(activeTabId);
    return record.iframe;
  }

  private ensureRecord(tab: TopicTabState, now: number): FrameRecord {
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
        configSentForDocument: false,
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

  handleMessage(event: MessageEvent): void {
    const data = event.data as Partial<FrameMessage> | null;
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
    this.onMessage(data as FrameMessage, record.iframe);
  }

  remove(tabId: string): void {
    const record = this.frames.get(tabId);
    if (!record) return;
    record.commands = [];
    record.iframe.removeEventListener("load", record.loadListener);
    record.iframe.remove();
    this.frames.delete(tabId);
    if (this.activeTabId === tabId) this.activeTabId = null;
  }

  sendCommand(tabId: string, command: FrameCommand): void {
    const record = this.frames.get(tabId);
    if (!record) return;
    if (!record.loaded) {
      record.commands.push(command);
      return;
    }
    record.iframe.contentWindow?.postMessage(command, location.origin);
  }

  getFrame(tabId: string): HTMLIFrameElement | null {
    return this.frames.get(tabId)?.iframe ?? null;
  }

  reload(tabId: string): boolean {
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

  detach(tabId: string): FrameTransfer | null {
    const record = this.frames.get(tabId);
    if (!record) return null;
    record.iframe.removeEventListener("load", record.loadListener);
    record.iframe.remove();
    this.frames.delete(tabId);
    if (this.activeTabId === tabId) this.activeTabId = null;
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
      current.loaded = true;
      current.configSentForDocument = false;
      this.sendInitialConfigs(current);
      this.flushCommands(current);
      this.onMessage({ type: "ldu:frame-ready", tabId: tab.id, url: iframe.src }, iframe);
    };
    iframe.addEventListener("load", loadListener);
    const requestedUrl = new URL(tab.url, document.baseURI).href;
    if (iframe.src !== requestedUrl && transfer.reportedUrl !== requestedUrl) iframe.src = requestedUrl;
    const record: FrameRecord = {
      ...transfer,
      lastUsedAt: now,
      reportedUrl: null,
      loaded: false,
      loadListener,
      configSentForDocument: false,
    };
    this.frames.set(tab.id, record);
    this.container.append(iframe);
    this.activate(tab, now);
    return iframe;
  }

  destroy(): void {
    for (const record of this.frames.values()) {
      record.commands = [];
      record.iframe.removeEventListener("load", record.loadListener);
      record.iframe.remove();
    }
    this.frames.clear();
    this.activeTabId = null;
  }

  private sendPreviewConfig(iframe: HTMLIFrameElement): void {
    iframe.contentWindow?.postMessage({ type: "ldu:preview-config", ...this.previewConfig }, location.origin);
  }

  private sendPageToolsConfig(iframe: HTMLIFrameElement): void {
    iframe.contentWindow?.postMessage({ type: "ldu:page-tools-config", ...this.pageToolsConfig }, location.origin);
  }

  private sendInitialConfigs(record: FrameRecord): void {
    if (record.configSentForDocument) return;
    record.configSentForDocument = true;
    this.sendPreviewConfig(record.iframe);
    this.sendPageToolsConfig(record.iframe);
  }

  private setFrameActive(record: FrameRecord, active: boolean): void {
    const hidden = String(!active);
    if (record.iframe.getAttribute("aria-hidden") !== hidden) record.iframe.setAttribute("aria-hidden", hidden);
    const tabIndex = active ? 0 : -1;
    if (record.iframe.tabIndex !== tabIndex) record.iframe.tabIndex = tabIndex;
    const softFrozen = !active;
    if (record.softFrozen === softFrozen) return;
    record.softFrozen = softFrozen;
    if (record.loaded) this.sendLifecycleState(record);
  }

  private sendLifecycleState(record: FrameRecord): void {
    record.iframe.contentWindow?.postMessage({
      type: "ldu:frame-lifecycle",
      active: !record.softFrozen,
    }, location.origin);
  }

  private flushCommands(record: FrameRecord): void {
    const commands = record.commands.splice(0);
    for (const command of commands) record.iframe.contentWindow?.postMessage(command, location.origin);
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
      record.iframe.removeEventListener("load", record.loadListener);
      record.iframe.remove();
      this.frames.delete(tabId);
      if (this.activeTabId === tabId) this.activeTabId = null;
      this.onSuspend(tabId);
    }
  }
}

function samePreviewConfig(left: FramePreviewConfig, right: FramePreviewConfig): boolean {
  return left.enabled === right.enabled && left.clickMode === right.clickMode;
}

function samePageToolsConfig(left: PageToolsConfig, right: PageToolsConfig): boolean {
  return left.ownerOnlyEnabled === right.ownerOnlyEnabled
    && left.minimalHidePosters === right.minimalHidePosters
    && left.minimalHideNotices === right.minimalHideNotices
    && left.minimalHideCategoryBadges === right.minimalHideCategoryBadges
    && left.minimalHideTags === right.minimalHideTags
    && left.lowEndOptimizationEnabled === right.lowEndOptimizationEnabled;
}
