import { ensureEmbeddedStyles } from "./ui/styles";
import { getTopicInfo, isSupportedTopicTarget } from "./discourse/routes";
import { readTopicCategory, readTopicDocumentCategory } from "./discourse/category";

const DOUBLE_CLICK_DELAY_MS = 300;

export function bootFrameBridge(): void {
  const frameName = window.name;
  if (frameName.startsWith("ldu-list:")) {
    bootListBridge(frameName.slice("ldu-list:".length));
    return;
  }
  if (!frameName.startsWith("ldu-topic:")) return;
  const tabId = frameName.slice("ldu-topic:".length);
  document.documentElement.dataset.lduEmbeddedTopic = "true";
  ensureEmbeddedStyles(document);

  let timer: number | null = null;
  let pendingSendType: "ldu:frame-state" | "ldu:frame-ready" | null = null;
  let lastUrl = "";
  let lastObservedUrl = location.href;
  let lastObservedTitle = document.title;
  let lastObservedCategoryKey = "";
  let currentCategory = readTopicDocumentCategory(document, window);
  let previewEnabled = false;
  let previewClickMode: "double" | "single" = "double";
  let replayingClick = false;
  let clickTimer: number | null = null;
  let softFrozen = false;
  const send = (type: "ldu:frame-state" | "ldu:frame-ready") => {
    if (softFrozen && type === "ldu:frame-state") return;
    if (timer !== null) window.clearTimeout(timer);
    pendingSendType = type;
    timer = window.setTimeout(() => {
      timer = null;
      pendingSendType = null;
      if (softFrozen && type === "ldu:frame-state") return;
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
  const topicMetadataSelector = 'meta[property="og:article:section"], meta[property="og:article:section:color"], title, .topic-category, #topic-title';
  const mutationAffectsTopicMetadata = (mutation: MutationRecord): boolean => {
    const target = mutation.target instanceof Element
      ? mutation.target
      : mutation.target.parentNode instanceof Element ? mutation.target.parentNode : null;
    if (target?.closest("head, .topic-category, #topic-title")) return true;
    return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return false;
      const element = node as Element;
      return element.matches(topicMetadataSelector) || Boolean(element.querySelector(topicMetadataSelector));
    });
  };
  const metadataObserver = new MutationObserver((mutations) => {
    if (softFrozen) return;
    // Post stream mutations are frequent and cannot change topic metadata.
    // Only inspect the document when title/category metadata may have changed.
    const metadataChanged = mutations.some(mutationAffectsTopicMetadata);
    const urlChanged = lastObservedUrl !== location.href;
    const titleChanged = lastObservedTitle !== document.title;
    if (!metadataChanged && !urlChanged && !titleChanged) return;
    if (urlChanged) currentCategory = null;
    if (metadataChanged) {
      const observedCategory = readTopicDocumentCategory(document, window);
      if (observedCategory) currentCategory = observedCategory;
    }
    const categoryKey = currentCategory ? `${currentCategory.categoryName}\n${currentCategory.categoryColor}` : "";
    if (lastObservedUrl === location.href && lastObservedTitle === document.title && lastObservedCategoryKey === categoryKey) return;
    lastObservedUrl = location.href;
    lastObservedTitle = document.title;
    lastObservedCategoryKey = categoryKey;
    send("ldu:frame-state");
  });
  const observeMetadata = () => metadataObserver.observe(document.documentElement, { childList: true, subtree: true });
  observeMetadata();

  const cancelPendingClick = () => {
    if (clickTimer !== null) window.clearTimeout(clickTimer);
    clickTimer = null;
  };
  const pausedMedia = new Set<HTMLMediaElement>();
  const pausedAnimations = new Set<Animation>();
  const pauseVisualActivity = () => {
    for (const media of document.querySelectorAll<HTMLMediaElement>("audio, video")) {
      if (media.paused || media.ended) continue;
      pausedMedia.add(media);
      try { media.pause(); } catch { /* media state is best-effort */ }
    }
    const animationDocument = document as Document & { getAnimations?: () => Animation[] };
    for (const animation of animationDocument.getAnimations?.() ?? []) {
      if (animation.playState !== "running") continue;
      pausedAnimations.add(animation);
      try { animation.pause(); } catch { /* animation state is best-effort */ }
    }
  };
  const resumeVisualActivity = () => {
    for (const media of pausedMedia) {
      if (!media.isConnected) continue;
      try { void media.play().catch(() => {}); } catch { /* preserve a paused media element */ }
    }
    pausedMedia.clear();
    for (const animation of pausedAnimations) {
      try { animation.play(); } catch { /* preserve a paused animation */ }
    }
    pausedAnimations.clear();
  };
  const setSoftFrozen = (frozen: boolean) => {
    if (softFrozen === frozen) return;
    softFrozen = frozen;
    if (frozen) {
      document.documentElement.dataset.lduSoftFrozen = "true";
      if (timer !== null && pendingSendType === "ldu:frame-state") {
        window.clearTimeout(timer);
        timer = null;
        pendingSendType = null;
      }
      cancelPendingClick();
      metadataObserver.disconnect();
      pauseVisualActivity();
      return;
    }
    delete document.documentElement.dataset.lduSoftFrozen;
    const urlChanged = lastObservedUrl !== location.href;
    const observedCategory = readTopicDocumentCategory(document, window);
    if (observedCategory) currentCategory = observedCategory;
    else if (urlChanged) currentCategory = null;
    lastObservedUrl = location.href;
    lastObservedTitle = document.title;
    lastObservedCategoryKey = currentCategory ? `${currentCategory.categoryName}\n${currentCategory.categoryColor}` : "";
    observeMetadata();
    resumeVisualActivity();
    send("ldu:frame-state");
  };
  const getPreviewableLink = (target: EventTarget | null): HTMLAnchorElement | null => {
    const link = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || !/^https?:/i.test(link.href) || getTopicInfo(link.href) || new URL(link.href, location.href).origin === location.origin) return null;
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
  const getListNavigationLink = (target: EventTarget | null): HTMLAnchorElement | null => {
    const link = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || !/^https?:/i.test(link.href) || new URL(link.href, location.href).origin !== location.origin || getTopicInfo(link.href)) return null;
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
    const data = event.data as {
      type?: string;
      enabled?: unknown;
      clickMode?: unknown;
      hidePosters?: unknown;
      topicId?: unknown;
      active?: unknown;
    } | null;
    if (data?.type === "ldu:frame-lifecycle") {
      setSoftFrozen(data.active !== true);
      return;
    }
    if (data?.type === "ldu:bookmark") {
      const topicId = typeof data.topicId === "string" && /^\d+$/.test(data.topicId) ? data.topicId : null;
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
      if (!topicId || !csrfToken) return;
      const body = new URLSearchParams({
        bookmarkable_type: "Topic",
        bookmarkable_id: topicId,
      });
      void fetch("/bookmarks.json", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-CSRF-Token": csrfToken,
          "X-Requested-With": "XMLHttpRequest",
        },
        body,
      }).then(async (response) => {
        if (!response.ok) {
          let message = "添加书签失败";
          try {
            const payload = await response.json() as { errors?: unknown };
            if (Array.isArray(payload.errors) && typeof payload.errors[0] === "string") message = payload.errors[0];
          } catch { /* use the stable fallback */ }
          throw new Error(message);
        }
        window.parent.postMessage({
          type: "ldu:bookmark-result",
          tabId,
          ok: true,
          message: "已添加到书签",
        }, location.origin);
      }).catch((error: unknown) => {
        window.parent.postMessage({
          type: "ldu:bookmark-result",
          tabId,
          ok: false,
          message: error instanceof Error && error.message ? error.message : "添加书签失败",
        }, location.origin);
      });
      return;
    }
    if (data?.type !== "ldu:preview-config") return;
    previewEnabled = data.enabled === true;
    previewClickMode = data.clickMode === "single" ? "single" : "double";
    document.documentElement.dataset.lduHidePosters = String(data.hidePosters !== false);
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
    const listLink = getListNavigationLink(event.target);
    if (listLink) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.parent.postMessage({ type: "ldu:list-navigate", tabId, url: listLink.href }, location.origin);
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

function bootListBridge(frameId: string): void {
  document.documentElement.dataset.lduEmbeddedList = "true";
  ensureEmbeddedStyles(document);
  const DOUBLE_CLICK_DELAY_MS = 300;
  let timer: number | null = null;
  let clickTimer: number | null = null;
  let previewEnabled = false;
  let previewClickMode: "double" | "single" = "double";
  let replayingClick = false;
  let lastUrl = "";
  let lastTitle = "";
  const send = (type: "ldu:list-state" | "ldu:list-ready") => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      const payload: Record<string, unknown> = { type, frameId, url: location.href, title: document.title, scrollY: window.scrollY };
      lastUrl = location.href;
      lastTitle = document.title;
      window.parent.postMessage(payload, location.origin);
    }, type === "ldu:list-ready" ? 0 : 100);
  };
  const cancelPendingClick = () => {
    if (clickTimer !== null) window.clearTimeout(clickTimer);
    clickTimer = null;
  };
  const isPlainPrimaryClick = (event: MouseEvent) => event.button === 0
    && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
  const getTopicLink = (target: EventTarget | null): HTMLAnchorElement | null => {
    const link = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || !isSupportedTopicTarget(link.href, location.href)) return null;
    if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
    return link;
  };
  const getPreviewableLink = (target: EventTarget | null): HTMLAnchorElement | null => {
    const link = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || !/^https?:/i.test(link.href) || getTopicInfo(link.href) || new URL(link.href, location.href).origin === location.origin) return null;
    if ((target instanceof Element && target.closest("img, picture, .lightbox-wrapper")) || link.matches(".lightbox") || link.querySelector("img, picture")) return null;
    if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
    return link;
  };
  const sendTopic = (link: HTMLAnchorElement) => {
    const info = getTopicInfo(link.href, location.href);
    const row = link.closest(".topic-list-item, .latest-topic-list-item, .search-result");
    const category = row ? readTopicCategory(row, window) : null;
    window.parent.postMessage({
      type: "ldu:list-topic-open", frameId, url: link.href,
      topicId: info?.topicId, postNumber: info?.postNumber,
      topicTitle: link.textContent?.trim() || (info ? `主题 ${info.topicId}` : ""),
      ...(category ?? {}),
    }, location.origin);
  };
  const sendPreview = (link: HTMLAnchorElement) => {
    const rect = link.getBoundingClientRect();
    window.parent.postMessage({ type: "ldu:list-preview-open", frameId, url: link.href, anchorRect: {
      left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height,
    } }, location.origin);
  };
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.origin !== location.origin) return;
    const data = event.data as { type?: string; enabled?: unknown; clickMode?: unknown; hidePosters?: unknown } | null;
    if (data?.type !== "ldu:preview-config") return;
    previewEnabled = data.enabled === true;
    previewClickMode = data.clickMode === "single" ? "single" : "double";
    document.documentElement.dataset.lduHidePosters = String(data.hidePosters !== false);
    if (!previewEnabled) cancelPendingClick();
  });
  window.addEventListener("scroll", () => send("ldu:list-state"), { passive: true });
  window.addEventListener("load", () => send("ldu:list-ready"), { once: true });
  document.addEventListener("DOMContentLoaded", () => send("ldu:list-ready"), { once: true });
  window.addEventListener("popstate", () => send("ldu:list-state"));
  window.addEventListener("hashchange", () => send("ldu:list-state"));
  document.addEventListener("pointerdown", () => {
    window.parent.postMessage({ type: "ldu:list-interaction", frameId }, location.origin);
  }, true);
  new MutationObserver(() => {
    if (lastUrl === location.href && lastTitle === document.title) return;
    send("ldu:list-state");
  }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("click", (event) => {
    if (replayingClick || !isPlainPrimaryClick(event)) return;
    const topic = getTopicLink(event.target);
    if (topic) {
      event.preventDefault();
      event.stopImmediatePropagation();
      sendTopic(topic);
      return;
    }
    if (!previewEnabled) return;
    const link = getPreviewableLink(event.target);
    if (!link) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (previewClickMode === "single") { sendPreview(link); return; }
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
    sendPreview(link);
  }, true);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    window.parent.postMessage({ type: "ldu:list-preview-dismiss", frameId }, location.origin);
  }, true);
  send("ldu:list-ready");
}
