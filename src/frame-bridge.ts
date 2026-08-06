import { ensureAppStyles } from "./ui/styles";
import { getTopicInfo, isSupportedTopicTarget } from "./discourse/routes";
import { readTopicCategory } from "./discourse/category";

const DOUBLE_CLICK_DELAY_MS = 300;

export function bootFrameBridge(): void {
  const frameName = window.name;
  if (!frameName.startsWith("ldu-topic:")) return;
  const tabId = frameName.slice("ldu-topic:".length);
  document.documentElement.dataset.lduEmbeddedTopic = "true";
  ensureAppStyles(document);

  let timer: number | null = null;
  let lastUrl = "";
  let lastObservedUrl = location.href;
  let lastObservedTitle = document.title;
  let lastObservedCategoryKey = "";
  let currentCategory = readTopicCategory(document, window);
  let previewEnabled = false;
  let previewClickMode: "double" | "single" = "double";
  let replayingClick = false;
  let clickTimer: number | null = null;
  const send = (type: "ldu:frame-state" | "ldu:frame-ready") => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      const payload: Record<string, unknown> = {
        type,
        tabId,
        scrollY: window.scrollY,
      };
      if (currentCategory) Object.assign(payload, currentCategory);
      if (type === "ldu:frame-ready" || lastUrl !== location.href) {
        lastUrl = location.href;
        payload.url = location.href;
        payload.title = document.title;
      }
      window.parent.postMessage(payload, location.origin);
    }, type === "ldu:frame-ready" ? 0 : 120);
  };

  window.addEventListener("scroll", () => send("ldu:frame-state"), { passive: true });
  window.addEventListener("load", () => send("ldu:frame-ready"), { once: true });
  document.addEventListener("DOMContentLoaded", () => send("ldu:frame-ready"), { once: true });
  window.addEventListener("popstate", () => send("ldu:frame-state"));
  new MutationObserver(() => {
    const urlChanged = lastObservedUrl !== location.href;
    if (urlChanged) currentCategory = null;
    if (!currentCategory) currentCategory = readTopicCategory(document, window);
    const categoryKey = currentCategory ? `${currentCategory.categoryName}\n${currentCategory.categoryColor}` : "";
    if (lastObservedUrl === location.href && lastObservedTitle === document.title && lastObservedCategoryKey === categoryKey) return;
    lastObservedUrl = location.href;
    lastObservedTitle = document.title;
    lastObservedCategoryKey = categoryKey;
    send("ldu:frame-state");
  }).observe(document.documentElement, { childList: true, subtree: true });

  const cancelPendingClick = () => {
    if (clickTimer !== null) window.clearTimeout(clickTimer);
    clickTimer = null;
  };
  const getPreviewableLink = (target: EventTarget | null): HTMLAnchorElement | null => {
    const link = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || !/^https?:/i.test(link.href) || getTopicInfo(link.href)) return null;
    if ((target instanceof Element && target.closest("img, picture, .lightbox-wrapper")) || link.matches(".lightbox") || link.querySelector("img, picture")) return null;
    if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
    return link;
  };
  const getTopicLink = (target: EventTarget | null): HTMLAnchorElement | null => {
    const link = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || !isSupportedTopicTarget(link.href, location.href)) return null;
    if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
    return link;
  };
  const sendTopicOpen = (link: HTMLAnchorElement) => {
    const info = getTopicInfo(link.href, location.href);
    window.parent.postMessage({
      type: "ldu:topic-open",
      tabId,
      url: link.href,
      title: link.textContent?.trim() || (info ? `主题 ${info.topicId}` : ""),
      ...(info?.postNumber ? { postNumber: info.postNumber } : {}),
    }, location.origin);
  };
  const sendPreviewOpen = (link: HTMLAnchorElement) => {
    const rect = link.getBoundingClientRect();
    window.parent.postMessage({
      type: "ldu:preview-open",
      tabId,
      url: link.href,
      anchorRect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      },
    }, location.origin);
  };
  const isPlainPrimaryClick = (event: MouseEvent) => event.button === 0
    && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.origin !== location.origin) return;
    const data = event.data as { type?: string; enabled?: unknown; clickMode?: unknown } | null;
    if (data?.type !== "ldu:preview-config") return;
    previewEnabled = data.enabled === true;
    previewClickMode = data.clickMode === "single" ? "single" : "double";
    if (!previewEnabled) cancelPendingClick();
  });
  document.addEventListener("pointerdown", (event) => {
    window.parent.postMessage({ type: "ldu:frame-interaction", tabId }, location.origin);
    if (previewEnabled && previewClickMode === "double" && event.detail >= 2) cancelPendingClick();
  }, true);
  document.addEventListener("click", (event) => {
    if (replayingClick || !isPlainPrimaryClick(event)) return;
    const topicLink = getTopicLink(event.target);
    if (topicLink) {
      event.preventDefault();
      event.stopImmediatePropagation();
      sendTopicOpen(topicLink);
      return;
    }
    if (!previewEnabled) return;
    const link = getPreviewableLink(event.target);
    if (!link) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (previewClickMode === "single") {
      sendPreviewOpen(link);
      return;
    }
    cancelPendingClick();
    if (event.detail >= 2) return;
    clickTimer = window.setTimeout(() => {
      clickTimer = null;
      if (!link.isConnected) return;
      replayingClick = true;
      try { link.click(); } finally { replayingClick = false; }
    }, DOUBLE_CLICK_DELAY_MS);
  }, true);
  document.addEventListener("dblclick", (event) => {
    if (!previewEnabled || previewClickMode !== "double" || !isPlainPrimaryClick(event)) return;
    const link = getPreviewableLink(event.target);
    if (!link) return;
    cancelPendingClick();
    event.preventDefault();
    event.stopImmediatePropagation();
    sendPreviewOpen(link);
  }, true);
  document.addEventListener("keydown", (event) => {
    if (!previewEnabled || event.key !== "Escape") return;
    window.parent.postMessage({ type: "ldu:preview-dismiss", tabId }, location.origin);
  }, true);
  send("ldu:frame-ready");
}
