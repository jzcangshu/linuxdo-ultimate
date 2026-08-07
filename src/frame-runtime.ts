import { readTopicCategory } from "./discourse/category";
import { getTopicInfo, isNavigableForumPage, isSupportedTopicTarget } from "./discourse/routes";
import { ensureFrameStyles } from "./ui/styles";

const DOUBLE_CLICK_DELAY_MS = 300;
const NAVIGATION_ACK_TIMEOUT_MS = 700;
const installedBridges = new WeakMap<Document, () => void>();

type PreviewMode = "double" | "single";
type BridgeRole = "list" | "topic";

interface BridgeOptions {
  role: BridgeRole;
  id: string;
  win: Window;
  doc: Document;
}

export function installTopicFrameBridge(win: Window, doc: Document, tabId: string): () => void {
  return installBridge({ role: "topic", id: tabId, win, doc });
}

export function installListFrameBridge(win: Window, doc: Document, frameId: string): () => void {
  return installBridge({ role: "list", id: frameId, win, doc });
}

function installBridge(options: BridgeOptions): () => void {
  const { role, id, win, doc } = options;
  const root = doc.documentElement;
  if (!root) return () => {};
  const bridgeMarker = `${role}:${id}`;
  const existing = installedBridges.get(doc);
  if (existing && root.dataset.lduFrameBridge === bridgeMarker) return existing;
  existing?.();
  ensureFrameStyles(role, doc);

  let disposed = false;
  let stateTimer: number | null = null;
  let clickTimer: number | null = null;
  let lastUrl = "";
  let lastTitle = "";
  let lastCategoryKey = "";
  let previewEnabled = false;
  let previewClickMode: PreviewMode = "double";
  let replayingClick = false;
  let navigationSequence = 0;
  let currentCategory = role === "topic" ? readTopicCategory(doc, win) : null;
  const listeners: Array<() => void> = [];
  const pendingNavigations = new Map<string, { timer: number; link: HTMLAnchorElement }>();

  const on = (target: EventTarget, type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => {
    target.addEventListener(type, listener, options);
    listeners.push(() => target.removeEventListener(type, listener, options));
  };
  const post = (payload: Record<string, unknown>) => {
    if (!disposed) win.parent.postMessage(payload, win.location.origin);
  };
  const cancelClick = () => {
    if (clickTimer !== null) win.clearTimeout(clickTimer);
    clickTimer = null;
  };
  const sendNavigation = (payload: Record<string, unknown>, link: HTMLAnchorElement) => {
    const requestId = `${id}:${Date.now()}:${navigationSequence += 1}`;
    const timer = win.setTimeout(() => {
      pendingNavigations.delete(requestId);
      if (!link.isConnected) return;
      replayingClick = true;
      try { link.click(); } finally { replayingClick = false; }
    }, NAVIGATION_ACK_TIMEOUT_MS);
    pendingNavigations.set(requestId, { timer, link });
    post({ ...payload, requestId });
  };
  const sendState = (ready = false) => {
    if (stateTimer !== null) win.clearTimeout(stateTimer);
    stateTimer = win.setTimeout(() => {
      stateTimer = null;
      if (role === "list") {
        lastUrl = win.location.href;
        lastTitle = doc.title;
        post({
          type: ready ? "ldu:list-ready" : "ldu:list-state",
          frameId: id,
          url: win.location.href,
          title: doc.title,
          scrollY: win.scrollY,
        });
        return;
      }
      const payload: Record<string, unknown> = {
        type: ready ? "ldu:frame-ready" : "ldu:frame-state",
        tabId: id,
        scrollY: win.scrollY,
      };
      if (currentCategory) Object.assign(payload, currentCategory);
      if (ready || lastUrl !== win.location.href) {
        lastUrl = win.location.href;
        payload.url = win.location.href;
        payload.title = doc.title;
      }
      post(payload);
    }, ready ? 0 : role === "list" ? 100 : 120);
  };

  const MutationObserverCtor = (win as unknown as { MutationObserver: typeof MutationObserver }).MutationObserver;
  const observer = new MutationObserverCtor(() => {
    if (role === "list") {
      if (lastUrl !== win.location.href || lastTitle !== doc.title) sendState();
      return;
    }
    if (lastUrl !== win.location.href) currentCategory = null;
    if (!currentCategory) currentCategory = readTopicCategory(doc, win);
    const categoryKey = currentCategory ? `${currentCategory.categoryName}\n${currentCategory.categoryColor}` : "";
    if (lastUrl === win.location.href && lastTitle === doc.title && lastCategoryKey === categoryKey) return;
    lastTitle = doc.title;
    lastCategoryKey = categoryKey;
    sendState();
  });
  observer.observe(doc.body ?? root, { childList: true, subtree: true });

  on(win, "scroll", () => sendState(), { passive: true });
  on(win, "popstate", () => sendState());
  on(win, "hashchange", () => sendState());
  on(win, "message", ((event: MessageEvent) => {
    if (event.origin !== win.location.origin || event.source !== win.parent) return;
    const data = event.data as { type?: string; enabled?: unknown; clickMode?: unknown; hidePosters?: unknown; topicId?: unknown; tabId?: unknown; frameId?: unknown; requestId?: unknown } | null;
    const targetId = role === "topic" ? data?.tabId : data?.frameId;
    if (targetId !== id) return;
    if (data?.type === "ldu:navigation-ack" && typeof data.requestId === "string") {
      const pending = pendingNavigations.get(data.requestId);
      if (!pending) return;
      win.clearTimeout(pending.timer);
      pendingNavigations.delete(data.requestId);
      return;
    }
    if (role === "topic" && data?.type === "ldu:bookmark") {
      void bookmarkTopic(options, data.topicId);
      return;
    }
    if (data?.type !== "ldu:preview-config") return;
    previewEnabled = data.enabled === true;
    previewClickMode = data.clickMode === "single" ? "single" : "double";
    root.dataset.lduHidePosters = String(data.hidePosters !== false);
    if (!previewEnabled) cancelClick();
  }) as EventListener);

  // The bridge is installed after Discourse. Window capture still runs before
  // Discourse's document-level router, so managed navigation remains authoritative.
  on(win, "pointerdown", ((event: PointerEvent) => {
    post(role === "topic"
      ? { type: "ldu:frame-interaction", tabId: id }
      : { type: "ldu:list-interaction", frameId: id });
    if (previewEnabled && previewClickMode === "double" && event.detail >= 2) cancelClick();
  }) as EventListener, true);

  const handleClick = (event: MouseEvent) => {
    if (replayingClick || !isPlainPrimaryClick(event)) return;
    const link = closestLink(event.target, win);
    if (!link || preservesNativeNavigation(link)) return;
    if (isSupportedTopicTarget(link.href, win.location.href)) {
      const info = getTopicInfo(link.href, win.location.href);
      if (!info) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (role === "list") {
        const category = readTopicCategory(link.closest(".topic-list-item, .latest-topic-list-item, .search-result") ?? doc, win);
        sendNavigation({
          type: "ldu:list-topic-open",
          frameId: id,
          url: link.href,
          topicId: info.topicId,
          postNumber: info.postNumber,
          topicTitle: link.textContent?.trim() || `主题 ${info.topicId}`,
          ...(category ?? {}),
        }, link);
      } else {
        sendNavigation({
          type: "ldu:topic-open",
          tabId: id,
          url: link.href,
          title: link.textContent?.trim() || `主题 ${info.topicId}`,
          ...(info.postNumber ? { postNumber: info.postNumber } : {}),
        }, link);
      }
      return;
    }
    if (role === "topic" && isSameOriginPage(link, win)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      sendNavigation({ type: "ldu:list-navigate", tabId: id, url: link.href }, link);
      return;
    }
    if (isControlLink(link)) return;
    if (!previewEnabled || !isPreviewableLink(link, event.target, win)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (previewClickMode === "single") {
      sendPreview(options, link);
      return;
    }
    cancelClick();
    if (event.detail >= 2) return;
    clickTimer = win.setTimeout(() => {
      clickTimer = null;
      if (!link.isConnected) return;
      replayingClick = true;
      try { link.click(); } finally { replayingClick = false; }
    }, DOUBLE_CLICK_DELAY_MS);
  };
  on(win, "click", handleClick as EventListener, true);
  on(win, "dblclick", ((event: MouseEvent) => {
    if (!previewEnabled || previewClickMode !== "double" || !isPlainPrimaryClick(event)) return;
    const link = closestLink(event.target, win);
    if (!link || preservesNativeNavigation(link) || !isPreviewableLink(link, event.target, win)) return;
    cancelClick();
    event.preventDefault();
    event.stopImmediatePropagation();
    sendPreview(options, link);
  }) as EventListener, true);
  on(win, "keydown", ((event: KeyboardEvent) => {
    if (event.key !== "Escape" || !previewEnabled) return;
    post(role === "topic"
      ? { type: "ldu:preview-dismiss", tabId: id }
      : { type: "ldu:list-preview-dismiss", frameId: id });
  }) as EventListener, true);

  const sendReady = () => sendState(true);
  root.dataset.lduFrameBridge = bridgeMarker;
  root.dataset[role === "topic" ? "lduEmbeddedTopic" : "lduEmbeddedList"] = "true";
  if (doc.readyState === "loading") on(doc, "DOMContentLoaded", sendReady, { once: true });
  else sendReady();
  const destroy = () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    for (const remove of listeners.splice(0)) remove();
    cancelClick();
    for (const pending of pendingNavigations.values()) win.clearTimeout(pending.timer);
    pendingNavigations.clear();
    if (stateTimer !== null) win.clearTimeout(stateTimer);
    stateTimer = null;
    if (root.dataset.lduFrameBridge === bridgeMarker) delete root.dataset.lduFrameBridge;
    if (installedBridges.get(doc) === destroy) installedBridges.delete(doc);
  };
  installedBridges.set(doc, destroy);
  return destroy;
}

async function bookmarkTopic(options: BridgeOptions, value: unknown): Promise<void> {
  const { win, doc, id } = options;
  const topicId = typeof value === "string" && /^\d+$/.test(value) ? value : null;
  const csrfToken = doc.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
  if (!topicId || !csrfToken) return;
  try {
    const response = await win.fetch("/bookmarks.json", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-CSRF-Token": csrfToken,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: new URLSearchParams({ bookmarkable_type: "Topic", bookmarkable_id: topicId }),
    });
    if (!response.ok) {
      let message = "添加书签失败";
      try {
        const payload = await response.json() as { errors?: unknown };
        if (Array.isArray(payload.errors) && typeof payload.errors[0] === "string") message = payload.errors[0];
      } catch { /* use fallback */ }
      throw new Error(message);
    }
    win.parent.postMessage({ type: "ldu:bookmark-result", tabId: id, ok: true, message: "已添加到书签" }, win.location.origin);
  } catch (error) {
    win.parent.postMessage({
      type: "ldu:bookmark-result",
      tabId: id,
      ok: false,
      message: error instanceof Error && error.message ? error.message : "添加书签失败",
    }, win.location.origin);
  }
}

function closestLink(target: EventTarget | null, win: Window): HTMLAnchorElement | null {
  const ElementCtor = (win as unknown as { Element: typeof Element }).Element;
  return target instanceof ElementCtor ? target.closest<HTMLAnchorElement>("a[href]") : null;
}

function preservesNativeNavigation(link: HTMLAnchorElement): boolean {
  return link.hasAttribute("download") || Boolean(link.target && link.target.toLowerCase() !== "_self");
}

function isControlLink(link: HTMLAnchorElement): boolean {
  return Boolean(link.closest("button, [role=button], .btn, .d-button, input, textarea, select, .post-controls, .actions"));
}

function isPlainPrimaryClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}

function isSameOriginPage(link: HTMLAnchorElement, win: Window): boolean {
  return isNavigableForumPage(link.href, win.location.href);
}

function isPreviewableLink(link: HTMLAnchorElement, target: EventTarget | null, win: Window): boolean {
  try {
    const url = new URL(link.href, win.location.href);
    if (!/^https?:$/.test(url.protocol) || url.origin === win.location.origin || getTopicInfo(url.href)) return false;
  } catch {
    return false;
  }
  const ElementCtor = (win as unknown as { Element: typeof Element }).Element;
  if (target instanceof ElementCtor && target.closest("img, picture, .lightbox-wrapper")) return false;
  return !link.matches(".lightbox") && !link.querySelector("img, picture") && !isControlLink(link);
}

function sendPreview(options: BridgeOptions, link: HTMLAnchorElement): void {
  const rect = link.getBoundingClientRect();
  const anchorRect = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
  options.win.parent.postMessage(options.role === "topic"
    ? { type: "ldu:preview-open", tabId: options.id, url: link.href, anchorRect }
    : { type: "ldu:list-preview-open", frameId: options.id, url: link.href, anchorRect }, options.win.location.origin);
}
