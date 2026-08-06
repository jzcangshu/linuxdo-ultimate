import { getTopicInfo } from "../discourse/routes";
import {
  prepareCompatiblePreviewHtml,
  preparePreviewHtml,
  type PreparedPreviewHtml,
  type PreviewMetadata,
} from "./sanitizer";

interface CacheEntry {
  html: string;
  dynamic: boolean;
  title: string;
  compatible: boolean;
  metadata: PreviewMetadata;
  time: number;
  size: number;
}

interface RequestHandle {
  abort: () => void;
  promise: Promise<PreviewResponse | null>;
}

interface PreviewOptions {
  isEnabled: () => boolean;
  clickMode: () => "double" | "single";
  allowSameOrigin?: () => boolean;
  contentReadyTimeoutMs?: number;
}

interface PreviewAnchorRect {
  left: number;
  bottom: number;
}

type PreviewResponse =
  | { kind: "html"; html: string; finalUrl: string }
  | { kind: "image" }
  | { kind: "unsupported" };

const CACHE_TTL_MS = 5 * 60 * 1_000;
const MAX_CACHE_ENTRIES = 8;
const MAX_CACHE_BYTES = 10 * 1024 * 1_024;
const CONTENT_READY_TIMEOUT_MS = 12_000;

export class PreviewController {
  private container: HTMLElement | null = null;
  private activeRequest: RequestHandle | null = null;
  private prefetchRequest: { url: string; handle: RequestHandle } | null = null;
  private readonly cache = new Map<string, CacheEntry>();
  private hoverTimer: number | null = null;
  private hoveredLink: HTMLAnchorElement | null = null;
  private readyTimer: number | null = null;
  private contentPollTimer: number | null = null;
  private loadToken = 0;
  private currentUrl: string | null = null;
  private currentMetadata: PreviewMetadata | null = null;
  private mounted = false;
  private stopDragging: (() => void) | null = null;

  constructor(private readonly options: PreviewOptions) {}

  mount(): void {
    if (this.mounted) return;
    this.mounted = true;
    document.addEventListener("click", (event) => this.handleClick(event), true);
    document.addEventListener("dblclick", (event) => this.handleDoubleClick(event), true);
    document.addEventListener("pointerdown", (event) => this.handleOutsidePointer(event), true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.close();
      if ((event.key === "F5" || event.code === "F5") && this.container) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void this.reload();
      }
    }, true);
    window.addEventListener("message", (event) => this.handleFrameMessage(event));
    document.addEventListener("mouseover", (event) => this.handleHover(event), true);
    document.addEventListener("mouseout", (event) => this.handleHoverOut(event), true);
  }

  close(): void {
    this.cancelHover();
    this.clearReadyTimer();
    this.clearContentPoll();
    this.activeRequest?.abort();
    this.activeRequest = null;
    this.prefetchRequest?.handle.abort();
    this.prefetchRequest = null;
    this.loadToken += 1;
    this.currentUrl = null;
    this.currentMetadata = null;
    this.stopDragging?.();
    this.stopDragging = null;
    this.container?.remove();
    this.container = null;
  }

  openFromFrame(
    url: string,
    iframe: HTMLIFrameElement,
    anchorRect: { left: number; bottom: number } | undefined,
  ): void {
    if (!this.options.isEnabled() || !this.isPreviewableUrl(url)) return;
    const frameRect = iframe.getBoundingClientRect();
    const rect = anchorRect ?? { left: 0, bottom: 0 };
    void this.open(url, {
      left: frameRect.left + rect.left,
      bottom: frameRect.top + rect.bottom,
    });
  }

  private handleClick(event: Event): void {
    if (!this.options.isEnabled() || this.options.clickMode() !== "single") return;
    if (!(event instanceof MouseEvent) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = this.getPreviewableLink(event.target);
    if (!link) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.open(link.href, link);
  }

  private handleDoubleClick(event: Event): void {
    if (!this.options.isEnabled() || this.options.clickMode() !== "double") return;
    if (!(event instanceof MouseEvent) || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = this.getPreviewableLink(event.target);
    if (!link) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.open(link.href, link);
  }

  private handleOutsidePointer(event: PointerEvent): void {
    if (!this.container || this.container.contains(event.target as Node)) return;
    this.close();
  }

  private handleHover(event: Event): void {
    if (!this.options.isEnabled()) return;
    const link = this.getPreviewableLink(event.target);
    if (!link || this.isSameOrigin(link.href)) return;
    if (this.hoveredLink === link) return;
    this.cancelHover();
    this.hoveredLink = link;
    this.hoverTimer = window.setTimeout(() => {
      this.hoverTimer = null;
      void this.prefetch(link.href);
    }, 350);
  }

  private handleHoverOut(event: MouseEvent): void {
    if (!this.hoveredLink) return;
    const next = event.relatedTarget;
    if (next instanceof Node && this.hoveredLink.contains(next)) return;
    this.cancelHover();
  }

  private cancelHover(): void {
    if (this.hoverTimer !== null) window.clearTimeout(this.hoverTimer);
    this.hoverTimer = null;
    const url = this.hoveredLink?.href;
    this.hoveredLink = null;
    if (url && this.prefetchRequest?.url === url) {
      this.prefetchRequest.handle.abort();
      this.prefetchRequest = null;
    }
  }

  private getPreviewableLink(target: EventTarget | null): HTMLAnchorElement | null {
    const link = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || link.closest(".ldu-preview-container") || !this.isPreviewableUrl(link.href)) return null;
    if ((target instanceof Element && target.closest("img, picture, .lightbox-wrapper")) || link.matches(".lightbox") || link.querySelector("img, picture")) return null;
    if (link.closest(".d-header, .sidebar-wrapper, .ldu-topic-toolbar, .ldu-settings-panel")) return null;
    if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
    return link;
  }

  private isPreviewableUrl(url: string): boolean {
    return /^https?:/i.test(url) && !getTopicInfo(url);
  }

  private isSameOrigin(url: string): boolean {
    try { return new URL(url, location.href).origin === location.origin; } catch { return false; }
  }

  private async open(url: string, anchor: PreviewAnchorRect | HTMLAnchorElement): Promise<void> {
    this.close();
    const token = ++this.loadToken;
    this.currentUrl = url;
    const container = document.createElement("section");
    container.className = "ldu-preview-container";
    container.setAttribute("role", "dialog");
    container.setAttribute("aria-label", "链接预览");
    container.setAttribute("aria-busy", "true");
    const header = document.createElement("header");
    header.className = "ldu-preview-header";
    const title = document.createElement("span");
    title.className = "ldu-preview-title";
    title.textContent = "链接预览";
    const actions = document.createElement("div");
    actions.className = "ldu-preview-actions";
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "ldu-icon-button";
    refresh.textContent = "↻";
    refresh.title = "刷新预览";
    refresh.setAttribute("aria-label", "刷新预览");
    refresh.addEventListener("click", () => void this.reload());
    const external = document.createElement("a");
    external.href = url;
    external.target = "_blank";
    external.rel = "noopener noreferrer";
    external.className = "ldu-icon-button";
    external.textContent = "↗";
    external.title = "在新标签页打开";
    external.setAttribute("aria-label", "在新标签页打开");
    external.addEventListener("click", () => this.close());
    const close = document.createElement("button");
    close.type = "button";
    close.className = "ldu-icon-button";
    close.textContent = "×";
    close.title = "关闭预览";
    close.setAttribute("aria-label", "关闭预览");
    close.addEventListener("click", () => this.close());
    actions.append(refresh, external, close);
    header.append(title, actions);
    header.addEventListener("pointerdown", (event) => this.startDragging(event, container, header));
    const frame = document.createElement("iframe");
    frame.className = "ldu-preview-frame";
    frame.title = "链接预览内容";
    const status = document.createElement("div");
    status.className = "ldu-preview-status is-loading";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.innerHTML = '<span class="ldu-preview-spinner" aria-hidden="true"></span><span class="ldu-preview-status-text">页面加载中…</span>';
    container.append(header, frame, status);
    document.body.append(container);
    this.container = container;
    this.position(container, anchor);

    if (this.isSameOrigin(url)) {
      frame.addEventListener("load", () => this.markReady(container, token), { once: true });
      frame.src = url;
      this.armReadyTimeout(container, token);
      return;
    }
    frame.setAttribute("sandbox", "");
    const compatible = this.isCompatibilityMode();
    const cached = this.getCached(url, compatible);
    if (cached) {
      this.renderHtml(container, frame, title, cached, token);
      return;
    }
    title.textContent = "正在加载预览…";
    const handle = this.startExternalRequest(url);
    this.activeRequest = handle;
    const response = await handle.promise;
    if (this.activeRequest === handle) this.activeRequest = null;
    if (!this.isCurrent(container, token)) return;
    if (!response) {
      this.showError(container, title, "预览加载失败，请在新标签页中打开");
      return;
    }
    if (response.kind === "image") {
      title.textContent = "图片预览";
      frame.addEventListener("load", () => this.markReady(container, token), { once: true });
      frame.src = url;
      this.armReadyTimeout(container, token);
      return;
    }
    if (response.kind === "unsupported") {
      this.showError(container, title, "此内容不支持预览，请在新标签页中打开");
      return;
    }
    const prepared = this.prepareHtml(response.html, response.finalUrl, compatible);
    this.setCache(url, prepared, compatible);
    this.renderHtml(container, frame, title, prepared, token);
  }

  private async prefetch(url: string): Promise<void> {
    const compatible = this.isCompatibilityMode();
    if (this.getCached(url, compatible)) return;
    if (this.prefetchRequest?.url === url) return;
    this.prefetchRequest?.handle.abort();
    const handle = this.startExternalRequest(url);
    this.prefetchRequest = { url, handle };
    const response = await handle.promise;
    if (this.prefetchRequest?.handle === handle) this.prefetchRequest = null;
    if (response?.kind !== "html") return;
    this.setCache(
      url,
      this.prepareHtml(response.html, response.finalUrl, compatible),
      compatible,
    );
  }

  private startExternalRequest(url: string, forceReload = false): RequestHandle {
    if (typeof GM_xmlhttpRequest === "function") {
      let abort = () => {};
      const promise = new Promise<PreviewResponse | null>((resolve) => {
        let settled = false;
        const finish = (value: PreviewResponse | null) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };
        const xhr = GM_xmlhttpRequest({
          method: "GET",
          url,
          timeout: 10_000,
          ...(forceReload ? { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } } : {}),
          onload: (response) => finish(response.status >= 200 && response.status < 400
            ? this.classifyResponse(
              response.responseText,
              this.getContentType(response.responseHeaders),
              response.finalUrl || url,
            )
            : null),
          onerror: () => finish(null),
          ontimeout: () => finish(null),
          onabort: () => finish(null),
        });
        abort = () => {
          try { xhr.abort(); } finally { finish(null); }
        };
      });
      return { promise, abort };
    }
    const controller = new AbortController();
    const promise = fetch(url, {
      credentials: "omit",
      cache: forceReload ? "reload" : "default",
      signal: controller.signal,
    }).then(async (response) => response.ok
      ? this.classifyResponse(await response.text(), response.headers.get("content-type") ?? "", response.url || url)
      : null).catch(() => null);
    return { promise, abort: () => controller.abort() };
  }

  private renderHtml(
    container: HTMLElement,
    frame: HTMLIFrameElement,
    title: HTMLElement,
    prepared: Pick<CacheEntry, "html" | "dynamic" | "title" | "metadata">,
    token: number,
  ): void {
    const dynamicSandbox = this.options.allowSameOrigin?.() === true
      ? "allow-scripts allow-same-origin allow-forms"
      : "allow-scripts allow-forms";
    frame.setAttribute("sandbox", prepared.dynamic ? dynamicSandbox : "");
    this.setFrameToken(frame, token);
    title.textContent = prepared.title;
    this.currentMetadata = prepared.metadata;
    frame.addEventListener("load", () => {
      if (prepared.dynamic) this.handleDynamicFrameLoad(container, frame, token);
      else this.markReady(container, token);
    }, { once: true });
    frame.srcdoc = prepared.html;
    this.armReadyTimeout(container, token);
  }

  private setFrameToken(frame: HTMLIFrameElement, token: number): void {
    const name = `ldu-external-preview-${token}`;
    frame.name = name;
    try {
      if (frame.contentWindow) frame.contentWindow.name = name;
    } catch {
      // The injected bridge still reads the iframe name after navigation.
    }
  }

  private handleDynamicFrameLoad(
    container: HTMLElement,
    frame: HTMLIFrameElement,
    token: number,
  ): void {
    if (!this.isCurrent(container, token)) return;
    try {
      if (this.hasPreviewContent(frame.contentDocument)) {
        this.markReady(container, token);
        return;
      }
      this.pollPreviewContent(container, frame, token);
    } catch {
      // Opaque-origin mode relies on the injected content-ready bridge.
    }
  }

  private hasPreviewContent(innerDocument: Document | null): boolean {
    if (!innerDocument?.body) return false;
    const renderedText = innerDocument.body.innerText || innerDocument.body.textContent || "";
    if (renderedText.replace(/\s+/g, "").length >= 12) return true;
    return Boolean(innerDocument.body.querySelector(
      "img[src], video, canvas, svg, article, main > *, [role=main] > *",
    ));
  }

  private pollPreviewContent(
    container: HTMLElement,
    frame: HTMLIFrameElement,
    token: number,
    attempt = 0,
  ): void {
    if (!this.isCurrent(container, token) || attempt >= 100) return;
    try {
      if (this.hasPreviewContent(frame.contentDocument)) {
        this.markReady(container, token);
        return;
      }
    } catch {
      return;
    }
    this.contentPollTimer = window.setTimeout(() => {
      this.contentPollTimer = null;
      this.pollPreviewContent(container, frame, token, attempt + 1);
    }, 100);
  }

  private handleFrameMessage(event: MessageEvent): void {
    const container = this.container;
    const frame = container?.querySelector<HTMLIFrameElement>(".ldu-preview-frame");
    if (!container || !frame || event.source !== frame.contentWindow || !event.data || typeof event.data !== "object") return;
    const expected = frame.name;
    if (event.data.token !== expected) return;
    if (event.data.type === "ldu:external-preview-ready") this.markReady(container, this.loadToken);
  }

  private async reload(): Promise<void> {
    const url = this.currentUrl;
    const container = this.container;
    if (!url || !container) return;
    const token = ++this.loadToken;
    const frame = container.querySelector<HTMLIFrameElement>(".ldu-preview-frame");
    const title = container.querySelector<HTMLElement>(".ldu-preview-title");
    if (!frame || !title) return;
    this.clearReadyTimer();
    this.clearContentPoll();
    this.activeRequest?.abort();
    this.activeRequest = null;
    this.showLoading(container);
    if (this.isSameOrigin(url)) {
      frame.addEventListener("load", () => this.markReady(container, token), { once: true });
      frame.src = url;
      this.armReadyTimeout(container, token);
      return;
    }
    const handle = this.startExternalRequest(url, true);
    this.activeRequest = handle;
    const response = await handle.promise;
    if (this.activeRequest === handle) this.activeRequest = null;
    if (!this.isCurrent(container, token)) return;
    if (!response || response.kind === "unsupported") {
      this.showError(container, title, "预览刷新失败，请在新标签页中打开");
      return;
    }
    if (response.kind === "image") {
      title.textContent = "图片预览";
      frame.addEventListener("load", () => this.markReady(container, token), { once: true });
      frame.removeAttribute("srcdoc");
      frame.src = `${url}${url.includes("?") ? "&" : "?"}_ldu=${Date.now()}`;
      this.armReadyTimeout(container, token);
      return;
    }
    const compatible = this.isCompatibilityMode();
    const prepared = this.prepareHtml(response.html, response.finalUrl, compatible);
    this.setCache(url, prepared, compatible);
    this.renderHtml(container, frame, title, prepared, token);
  }

  private isCompatibilityMode(): boolean {
    return this.options.allowSameOrigin?.() === true;
  }

  private prepareHtml(html: string, baseUrl: string, compatible: boolean): PreparedPreviewHtml {
    return compatible
      ? prepareCompatiblePreviewHtml(html, baseUrl, document)
      : preparePreviewHtml(html, baseUrl, document);
  }

  private isCurrent(container: HTMLElement, token: number): boolean {
    return this.container === container && this.loadToken === token;
  }

  private armReadyTimeout(container: HTMLElement, token: number): void {
    this.clearReadyTimer();
    this.readyTimer = window.setTimeout(() => {
      this.readyTimer = null;
      if (!this.isCurrent(container, token)) return;
      const title = container.querySelector<HTMLElement>(".ldu-preview-title");
      if (!title) return;
      if (this.currentMetadata) this.showFallback(container, title, this.currentMetadata);
      else this.showError(container, title, "页面未能正常呈现，请在新标签页中打开");
    }, this.options.contentReadyTimeoutMs ?? CONTENT_READY_TIMEOUT_MS);
  }

  private clearReadyTimer(): void {
    if (this.readyTimer !== null) window.clearTimeout(this.readyTimer);
    this.readyTimer = null;
  }

  private clearContentPoll(): void {
    if (this.contentPollTimer !== null) window.clearTimeout(this.contentPollTimer);
    this.contentPollTimer = null;
  }

  private markReady(container: HTMLElement, token: number): void {
    if (!this.isCurrent(container, token)) return;
    this.clearReadyTimer();
    this.clearContentPoll();
    container.querySelector(".ldu-preview-status")?.classList.add("is-hidden");
    container.querySelector<HTMLIFrameElement>(".ldu-preview-frame")?.removeAttribute("aria-hidden");
    container.setAttribute("aria-busy", "false");
  }

  private showLoading(container: HTMLElement): void {
    container.setAttribute("aria-busy", "true");
    const status = container.querySelector<HTMLElement>(".ldu-preview-status");
    status?.classList.remove("is-hidden", "is-error");
    status?.classList.add("is-loading");
    if (status) this.renderStatusMessage(status, "页面加载中…", true);
  }

  private showError(container: HTMLElement, title: HTMLElement, message: string): void {
    this.clearReadyTimer();
    this.clearContentPoll();
    title.textContent = "预览加载失败";
    container.setAttribute("aria-busy", "false");
    const status = container.querySelector<HTMLElement>(".ldu-preview-status");
    status?.classList.remove("is-hidden", "is-loading");
    status?.classList.add("is-error");
    if (status) this.renderStatusMessage(status, message, false);
  }

  private showFallback(container: HTMLElement, title: HTMLElement, metadata: PreviewMetadata): void {
    this.clearReadyTimer();
    this.clearContentPoll();
    title.textContent = metadata.title;
    container.setAttribute("aria-busy", "false");
    container.querySelector<HTMLIFrameElement>(".ldu-preview-frame")?.setAttribute("aria-hidden", "true");
    const status = container.querySelector<HTMLElement>(".ldu-preview-status");
    if (!status) return;
    status.classList.remove("is-hidden", "is-loading", "is-error");
    status.classList.add("is-fallback");
    const card = document.createElement("article");
    card.className = "ldu-preview-fallback-card";
    if (metadata.image) {
      const image = document.createElement("img");
      image.className = "ldu-preview-fallback-image";
      image.src = metadata.image;
      image.alt = "";
      card.append(image);
    }
    const site = document.createElement("div");
    site.className = "ldu-preview-fallback-site";
    try {
      site.textContent = metadata.siteName || new URL(metadata.url).hostname;
    } catch {
      site.textContent = metadata.siteName;
    }
    const heading = document.createElement("h3");
    heading.textContent = metadata.title;
    const description = document.createElement("p");
    description.textContent = metadata.description || "该页面没有提供可读取的摘要。";
    const note = document.createElement("p");
    note.className = "ldu-preview-fallback-note";
    note.textContent = "该网站限制内嵌运行，已显示页面摘要。请使用右上角按钮完整打开。";
    card.append(site, heading, description, note);
    status.replaceChildren(card);
  }

  private renderStatusMessage(status: HTMLElement, message: string, loading: boolean): void {
    const spinner = document.createElement("span");
    spinner.className = "ldu-preview-spinner";
    spinner.setAttribute("aria-hidden", "true");
    if (!loading) spinner.hidden = true;
    const text = document.createElement("span");
    text.className = "ldu-preview-status-text";
    text.textContent = message;
    status.replaceChildren(spinner, text);
  }

  private getContentType(headers: string): string {
    return headers.match(/^content-type:\s*([^;\r\n]+)/im)?.[1]?.trim().toLowerCase() ?? "";
  }

  private classifyResponse(body: string, contentType: string, finalUrl: string): PreviewResponse {
    const type = contentType.toLowerCase();
    if (type.startsWith("image/")) return { kind: "image" };
    if (type.includes("text/html") || type.includes("application/xhtml+xml")) return { kind: "html", html: body, finalUrl };
    if ((!type || type.startsWith("text/plain")) && /<(?:!doctype\s+html|html|head|body)\b/i.test(body.slice(0, 2_048))) {
      return { kind: "html", html: body, finalUrl };
    }
    return { kind: "unsupported" };
  }

  private setCache(url: string, prepared: PreparedPreviewHtml, compatible: boolean): void {
    this.cache.set(url, {
      html: prepared.html,
      dynamic: prepared.dynamic,
      title: prepared.title,
      compatible,
      metadata: prepared.metadata,
      time: Date.now(),
      size: prepared.html.length,
    });
    while (this.cache.size > MAX_CACHE_ENTRIES || this.cacheBytes() > MAX_CACHE_BYTES) {
      const first = this.cache.keys().next().value as string | undefined;
      if (!first) break;
      this.cache.delete(first);
    }
  }

  private getCached(url: string, compatible: boolean): CacheEntry | null {
    const entry = this.cache.get(url);
    if (!entry) return null;
    if (entry.compatible !== compatible) {
      this.cache.delete(url);
      return null;
    }
    if (Date.now() - entry.time >= CACHE_TTL_MS) {
      this.cache.delete(url);
      return null;
    }
    this.cache.delete(url);
    this.cache.set(url, entry);
    return entry;
  }

  private cacheBytes(): number {
    return [...this.cache.values()].reduce((sum, entry) => sum + entry.size, 0);
  }

  private position(container: HTMLElement, anchor: PreviewAnchorRect | HTMLAnchorElement): void {
    const rect = anchor instanceof HTMLAnchorElement ? anchor.getBoundingClientRect() : anchor;
    const width = Math.min(980, Math.max(320, window.innerWidth - 24));
    const height = Math.min(650, Math.max(260, window.innerHeight - 24));
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.left = `${Math.max(12, Math.min(window.innerWidth - width - 12, rect.left))}px`;
    container.style.top = `${Math.max(12, Math.min(window.innerHeight - height - 12, rect.bottom + 8))}px`;
  }

  private startDragging(event: PointerEvent, container: HTMLElement, header: HTMLElement): void {
    if (event.button !== 0 || (event.target as Element | null)?.closest(".ldu-preview-actions")) return;
    event.preventDefault();
    this.stopDragging?.();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = Number.parseFloat(container.style.left) || 0;
    const startTop = Number.parseFloat(container.style.top) || 0;
    const width = container.getBoundingClientRect().width || Number.parseFloat(container.style.width) || 0;
    const height = container.getBoundingClientRect().height || Number.parseFloat(container.style.height) || 0;
    container.classList.add("ldu-preview-dragging");

    const move = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const maxLeft = Math.max(12, window.innerWidth - width - 12);
      const maxTop = Math.max(12, window.innerHeight - height - 12);
      container.style.left = `${Math.max(12, Math.min(maxLeft, startLeft + moveEvent.clientX - startX))}px`;
      container.style.top = `${Math.max(12, Math.min(maxTop, startTop + moveEvent.clientY - startY))}px`;
    };
    const stop = () => {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", stop, true);
      window.removeEventListener("pointercancel", stop, true);
      container.classList.remove("ldu-preview-dragging");
      this.stopDragging = null;
    };
    this.stopDragging = stop;
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", stop, true);
    window.addEventListener("pointercancel", stop, true);
    header.focus({ preventScroll: true });
  }
}
