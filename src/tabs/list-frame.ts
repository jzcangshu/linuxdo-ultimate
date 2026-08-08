export interface ListFrameMessage {
  type: "ldu:list-ready" | "ldu:list-visual-ready" | "ldu:list-state" | "ldu:list-interaction" | "ldu:list-topic-open" | "ldu:list-navigate" | "ldu:list-preview-open" | "ldu:list-preview-dismiss";
  frameId: string;
  url?: string;
  title?: string;
  scrollY?: number;
  topicId?: string;
  postNumber?: number;
  topicTitle?: string;
  anchorRect?: { left: number; top: number; right: number; bottom: number; width: number; height: number };
}

export class ListFrameController {
  private iframe: HTMLIFrameElement | null = null;
  private reportedUrl = "";
  private frameConfig = { enabled: false, clickMode: "double" as "double" | "single", hidePosters: true };
  private restoreScrollY = 0;
  private restoreTimer: number | null = null;
  private restoreDeadline = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly frameId: string,
    private readonly onMessage: (message: ListFrameMessage, iframe: HTMLIFrameElement) => void,
  ) {}

  mount(url: string): HTMLIFrameElement {
    if (!this.iframe) {
      const iframe = document.createElement("iframe");
      iframe.className = "ldu-list-frame";
      iframe.name = `ldu-list:${this.frameId}`;
      iframe.title = "帖子列表和站内页面";
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

  navigate(url: string): void {
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

  restoreScroll(scrollY: number): void {
    if (!this.iframe?.contentWindow || scrollY <= 0) return;
    this.restoreScrollY = scrollY;
    this.restoreDeadline = Date.now() + 5_000;
    this.attemptScrollRestore();
  }

  getElement(): HTMLIFrameElement | null { return this.iframe; }

  setConfig(config: { enabled: boolean; clickMode: "double" | "single"; hidePosters: boolean }): void {
    this.frameConfig = { ...config };
    if (this.iframe) this.sendPreviewConfig(this.iframe);
  }

  handleMessage(event: MessageEvent): void {
    const data = event.data as Partial<ListFrameMessage> | null;
    if (!data || !["ldu:list-ready", "ldu:list-visual-ready", "ldu:list-state", "ldu:list-interaction", "ldu:list-topic-open", "ldu:list-navigate", "ldu:list-preview-open", "ldu:list-preview-dismiss"].includes(data.type ?? "")) return;
    if (data.frameId !== this.frameId || !this.iframe || event.source !== this.iframe.contentWindow || event.origin !== location.origin) return;
    if ((data.type === "ldu:list-ready" || data.type === "ldu:list-visual-ready" || data.type === "ldu:list-state") && data.url) {
      try { this.reportedUrl = new URL(data.url, document.baseURI).href; } catch { this.reportedUrl = ""; }
    }
    this.onMessage(data as ListFrameMessage, this.iframe);
  }

  private sendPreviewConfig(iframe: HTMLIFrameElement): void {
    iframe.contentWindow?.postMessage({ type: "ldu:preview-config", ...this.frameConfig }, location.origin);
  }

  private resolveSameOrigin(url: string): URL | null {
    try {
      const resolved = new URL(url, document.baseURI);
      return resolved.origin === location.origin && /^https?:$/.test(resolved.protocol) ? resolved : null;
    } catch {
      return null;
    }
  }

  private attemptScrollRestore(): void {
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

  destroy(): void {
    if (this.restoreTimer !== null) window.clearTimeout(this.restoreTimer);
    this.restoreTimer = null;
    this.restoreScrollY = 0;
    this.restoreDeadline = 0;
    this.iframe?.remove();
    this.iframe = null;
    this.reportedUrl = "";
  }
}
