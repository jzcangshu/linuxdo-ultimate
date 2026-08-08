"use strict";
(() => {
  // src/ui/styles.ts
  var EMBEDDED_STYLE_ID = "linuxdo-ultimate-embedded-styles";
  var EMBEDDED_STYLES = `
:root {
  --ldu-sidebar-width: 216px;
  --ldu-topic-track: 0.65fr;
  --ldu-list-track: 0.35fr;
  --ldu-header-height: var(--header-height, 0px);
  --ldu-border: var(--primary-low, #d9d9d9);
  --ldu-surface: var(--secondary, #fff);
  --ldu-surface-muted: var(--primary-very-low, #f5f5f5);
  --ldu-text: var(--primary, #222);
  --ldu-accent: var(--tertiary, #0088cc);
  --ldu-danger: var(--danger, #d04437);
  --ldu-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}

html[data-ldu-embedded-topic="true"] #d-sidebar,
html[data-ldu-embedded-topic="true"] .sidebar-wrapper,
html[data-ldu-embedded-topic="true"] .d-header,
html[data-ldu-embedded-list="true"] #d-sidebar,
html[data-ldu-embedded-list="true"] .sidebar-wrapper,
html[data-ldu-embedded-list="true"] .d-header {
  display: none !important;
}

html[data-ldu-embedded-list="true"],
html[data-ldu-embedded-list="true"] body {
  overflow-x: hidden !important;
  overflow-y: auto !important;
}

html[data-ldu-embedded-list="true"] #main-container,
html[data-ldu-embedded-list="true"] #main-outlet-wrapper,
html[data-ldu-embedded-list="true"] #main-outlet {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

html[data-ldu-embedded-list="true"] #main-outlet-wrapper {
  display: block !important;
  padding: 0 !important;
}

html[data-ldu-embedded-list="true"] #main-outlet {
  padding: 0 10px max(12px, env(safe-area-inset-bottom)) !important;
  container-type: inline-size;
}

html[data-ldu-embedded-list="true"][data-ldu-hide-posters="true"] #main-outlet .topic-list .posters {
  display: none !important;
}

html[data-ldu-embedded-topic="true"] #main-container,
html[data-ldu-embedded-topic="true"] #main-outlet,
html[data-ldu-embedded-topic="true"] .post-stream,
html[data-ldu-embedded-topic="true"] .topic-post,
html[data-ldu-embedded-topic="true"] .topic-body {
  width: 100% !important;
  max-width: none !important;
  margin-inline: 0 !important;
  box-sizing: border-box !important;
}

html[data-ldu-embedded-topic="true"] #main-outlet-wrapper {
  width: 100% !important;
  max-width: none !important;
  grid-template-columns: minmax(0, 1fr) !important;
  grid-template-areas: "content" !important;
}

html[data-ldu-embedded-topic="true"] #main-outlet {
  grid-area: content !important;
  padding: 12px clamp(12px, 3vw, 40px) max(12px, env(safe-area-inset-bottom)) !important;
}

html[data-ldu-embedded-topic="true"] .container.posts {
  width: 100% !important;
  max-width: none !important;
  grid-template-columns: minmax(0, 1fr) minmax(7.5rem, 16%) !important;
  grid-template-areas: "posts timeline" !important;
}

html[data-ldu-embedded-topic="true"] .topic-navigation {
  display: block !important;
  grid-area: timeline !important;
  min-width: 0 !important;
  margin-inline-start: clamp(.35rem, 1vw, .75rem) !important;
}

html[data-ldu-embedded-topic="true"] .timeline-container,
html[data-ldu-embedded-topic="true"] .topic-timeline {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: .35rem !important;
  align-items: stretch !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .show-summary {
  grid-column: 1 / -1 !important;
  width: 100% !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .reply-to-post,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button > button {
  width: 100% !important;
}
`;
  function ensureEmbeddedStyles(doc = document) {
    const existing = doc.getElementById(EMBEDDED_STYLE_ID);
    if (existing instanceof HTMLStyleElement) return existing;
    const style = doc.createElement("style");
    style.id = EMBEDDED_STYLE_ID;
    style.textContent = EMBEDDED_STYLES;
    (doc.head ?? doc.documentElement).append(style);
    return style;
  }

  // src/discourse/routes.ts
  function isAllowedHost(hostname) {
    if (hostname === "linux.do" || hostname.endsWith(".linux.do")) return true;
    const testWindow = globalThis.window;
    return testWindow?.__LDU_TEST_MODE__ === true && (hostname === "localhost" || hostname === "127.0.0.1");
  }
  function getTopicInfo(rawUrl, baseUrl = "https://linux.do/") {
    let url;
    try {
      url = new URL(rawUrl, baseUrl);
    } catch {
      return null;
    }
    if (!isAllowedHost(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((part) => part === "t" || part === "n");
    if (marker < 0) return null;
    const idIndex = parts.findIndex((part, index) => index > marker && /^\d+$/.test(part));
    if (idIndex < 0) return null;
    const postNumber = parts[idIndex + 1] && /^\d+$/.test(parts[idIndex + 1]) ? Number(parts[idIndex + 1]) : void 0;
    return { url, topicId: parts[idIndex], ...postNumber ? { postNumber } : {} };
  }
  function isSupportedTopicTarget(targetUrl, currentUrl) {
    const target = getTopicInfo(targetUrl, currentUrl);
    const current = getTopicInfo(currentUrl, currentUrl);
    return Boolean(target && (!current || target.topicId !== current.topicId));
  }

  // src/discourse/category.ts
  function normalizeCategoryColor(value) {
    if (typeof value !== "string") return null;
    const color = value.trim();
    return /^(?:#[\da-f]{3,8}|rgba?\([\d\s.,%+-]+\)|hsla?\([\d\s.,%+-]+\))$/i.test(color) ? color : null;
  }
  function readWrapperCategory(wrapper, view) {
    const htmlWrapper = wrapper;
    const categoryName = wrapper.querySelector(".badge-category__name")?.textContent?.trim() ?? "";
    const categoryColor = normalizeCategoryColor(
      htmlWrapper.style?.getPropertyValue("--category-badge-color") || view?.getComputedStyle(htmlWrapper).getPropertyValue("--category-badge-color")
    );
    return categoryName && categoryColor ? { categoryName, categoryColor } : null;
  }
  function readTopicCategory(root, view = typeof window === "undefined" ? null : window) {
    const realm = view;
    const rootElement = realm?.Element && root instanceof realm.Element ? root : null;
    const wrappers = rootElement?.matches(".badge-category__wrapper") ? [rootElement] : [...root.querySelectorAll(".badge-category__wrapper")];
    for (const wrapper of wrappers) {
      const category = readWrapperCategory(wrapper, view);
      if (category) return category;
    }
    return null;
  }
  function readTopicDocumentCategory(document2, view = document2.defaultView) {
    let pendingName = "";
    const metadata = document2.querySelectorAll(
      'meta[property="og:article:section"], meta[property="og:article:section:color"]'
    );
    for (const meta of metadata) {
      if (meta.getAttribute("property") === "og:article:section") {
        pendingName = meta.content.trim();
        continue;
      }
      const rawColor = meta.content.trim();
      const categoryColor = normalizeCategoryColor(/^[\da-f]{3,8}$/i.test(rawColor) ? `#${rawColor}` : rawColor);
      if (pendingName && categoryColor) return { categoryName: pendingName, categoryColor };
      pendingName = "";
    }
    const topicCategory = document2.querySelector(".topic-category");
    return topicCategory ? readTopicCategory(topicCategory, view) : null;
  }

  // src/frame-bridge.ts
  var DOUBLE_CLICK_DELAY_MS = 300;
  function bootFrameBridge() {
    const frameName = window.name;
    if (frameName.startsWith("ldu-list:")) {
      bootListBridge(frameName.slice("ldu-list:".length));
      return;
    }
    if (!frameName.startsWith("ldu-topic:")) return;
    const tabId = frameName.slice("ldu-topic:".length);
    document.documentElement.dataset.lduEmbeddedTopic = "true";
    ensureEmbeddedStyles(document);
    let timer = null;
    let pendingSendType = null;
    let lastUrl = "";
    let lastObservedUrl = location.href;
    let lastObservedTitle = document.title;
    let lastObservedCategoryKey = "";
    let currentCategory = readTopicDocumentCategory(document, window);
    let previewEnabled = false;
    let previewClickMode = "double";
    let replayingClick = false;
    let clickTimer = null;
    let softFrozen = false;
    const send = (type) => {
      if (softFrozen && type === "ldu:frame-state") return;
      if (timer !== null) window.clearTimeout(timer);
      pendingSendType = type;
      timer = window.setTimeout(() => {
        timer = null;
        pendingSendType = null;
        if (softFrozen && type === "ldu:frame-state") return;
        const payload = {
          type,
          tabId,
          scrollY: window.scrollY
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
    const mutationAffectsTopicMetadata = (mutation) => {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentNode instanceof Element ? mutation.target.parentNode : null;
      if (target?.closest("head, .topic-category, #topic-title")) return true;
      return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        const element = node;
        return element.matches(topicMetadataSelector) || Boolean(element.querySelector(topicMetadataSelector));
      });
    };
    const metadataObserver = new MutationObserver((mutations) => {
      if (softFrozen) return;
      const metadataChanged = mutations.some(mutationAffectsTopicMetadata);
      const urlChanged = lastObservedUrl !== location.href;
      const titleChanged = lastObservedTitle !== document.title;
      if (!metadataChanged && !urlChanged && !titleChanged) return;
      if (urlChanged) currentCategory = null;
      if (metadataChanged) {
        const observedCategory = readTopicDocumentCategory(document, window);
        if (observedCategory) currentCategory = observedCategory;
      }
      const categoryKey = currentCategory ? `${currentCategory.categoryName}
${currentCategory.categoryColor}` : "";
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
    const pausedMedia = /* @__PURE__ */ new Set();
    const pausedAnimations = /* @__PURE__ */ new Set();
    const pauseVisualActivity = () => {
      for (const media of document.querySelectorAll("audio, video")) {
        if (media.paused || media.ended) continue;
        pausedMedia.add(media);
        try {
          media.pause();
        } catch {
        }
      }
      const animationDocument = document;
      for (const animation of animationDocument.getAnimations?.() ?? []) {
        if (animation.playState !== "running") continue;
        pausedAnimations.add(animation);
        try {
          animation.pause();
        } catch {
        }
      }
    };
    const resumeVisualActivity = () => {
      for (const media of pausedMedia) {
        if (!media.isConnected) continue;
        try {
          void media.play().catch(() => {
          });
        } catch {
        }
      }
      pausedMedia.clear();
      for (const animation of pausedAnimations) {
        try {
          animation.play();
        } catch {
        }
      }
      pausedAnimations.clear();
    };
    const setSoftFrozen = (frozen) => {
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
      lastObservedCategoryKey = currentCategory ? `${currentCategory.categoryName}
${currentCategory.categoryColor}` : "";
      observeMetadata();
      resumeVisualActivity();
      send("ldu:frame-state");
    };
    const getPreviewableLink = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link || !/^https?:/i.test(link.href) || getTopicInfo(link.href) || new URL(link.href, location.href).origin === location.origin) return null;
      if (target instanceof Element && target.closest("img, picture, .lightbox-wrapper") || link.matches(".lightbox") || link.querySelector("img, picture")) return null;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
      return link;
    };
    const getTopicLink = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link || !isSupportedTopicTarget(link.href, location.href)) return null;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
      return link;
    };
    const getListNavigationLink = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link || !/^https?:/i.test(link.href) || new URL(link.href, location.href).origin !== location.origin || getTopicInfo(link.href)) return null;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
      return link;
    };
    const sendTopicOpen = (link) => {
      const info = getTopicInfo(link.href, location.href);
      window.parent.postMessage({
        type: "ldu:topic-open",
        tabId,
        url: link.href,
        title: link.textContent?.trim() || (info ? `\u4E3B\u9898 ${info.topicId}` : ""),
        ...info?.postNumber ? { postNumber: info.postNumber } : {}
      }, location.origin);
    };
    const sendPreviewOpen = (link) => {
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
          height: rect.height
        }
      }, location.origin);
    };
    const isPlainPrimaryClick = (event) => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent || event.origin !== location.origin) return;
      const data = event.data;
      if (data?.type === "ldu:frame-lifecycle") {
        setSoftFrozen(data.active !== true);
        return;
      }
      if (data?.type === "ldu:bookmark") {
        const topicId = typeof data.topicId === "string" && /^\d+$/.test(data.topicId) ? data.topicId : null;
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!topicId || !csrfToken) {
          window.parent.postMessage({
            type: "ldu:bookmark-result",
            tabId,
            ok: false,
            message: "\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"
          }, location.origin);
          return;
        }
        const body = new URLSearchParams({
          bookmarkable_type: "Topic",
          bookmarkable_id: topicId
        });
        void fetch("/bookmarks.json", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-CSRF-Token": csrfToken,
            "X-Requested-With": "XMLHttpRequest"
          },
          body
        }).then(async (response) => {
          if (!response.ok) {
            let message = "\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25";
            try {
              const payload = await response.json();
              if (Array.isArray(payload.errors) && typeof payload.errors[0] === "string") message = payload.errors[0];
            } catch {
            }
            throw new Error(message);
          }
          window.parent.postMessage({
            type: "ldu:bookmark-result",
            tabId,
            ok: true,
            message: "\u5DF2\u6DFB\u52A0\u5230\u4E66\u7B7E"
          }, location.origin);
        }).catch((error) => {
          window.parent.postMessage({
            type: "ldu:bookmark-result",
            tabId,
            ok: false,
            message: error instanceof Error && error.message ? error.message : "\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"
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
        try {
          link.click();
        } finally {
          replayingClick = false;
        }
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
  function bootListBridge(frameId) {
    document.documentElement.dataset.lduEmbeddedList = "true";
    ensureEmbeddedStyles(document);
    let timer = null;
    let clickTimer = null;
    let visualReadySent = false;
    let visualReadyTimer = null;
    let previewEnabled = false;
    let previewClickMode = "double";
    let replayingClick = false;
    let lastUrl = "";
    let lastTitle = "";
    const send = (type) => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        const payload = { type, frameId, url: location.href, title: document.title, scrollY: window.scrollY };
        lastUrl = location.href;
        lastTitle = document.title;
        window.parent.postMessage(payload, location.origin);
      }, type === "ldu:list-ready" ? 0 : 100);
    };
    const hasRenderedListContent = () => {
      if (document.readyState === "loading") return false;
      const outlet = document.querySelector("#main-outlet");
      if (!outlet) return false;
      return [...outlet.children].some((child) => !child.matches(
        ".loading-container, .spinner, .spinner-container, .loading-indicator"
      ));
    };
    const scheduleVisualReady = () => {
      if (visualReadySent || visualReadyTimer !== null || !hasRenderedListContent()) return;
      visualReadyTimer = window.setTimeout(() => {
        visualReadyTimer = null;
        if (visualReadySent || !hasRenderedListContent()) return;
        visualReadySent = true;
        window.parent.postMessage({
          type: "ldu:list-visual-ready",
          frameId,
          url: location.href,
          title: document.title,
          scrollY: window.scrollY
        }, location.origin);
      }, 0);
    };
    const cancelPendingClick = () => {
      if (clickTimer !== null) window.clearTimeout(clickTimer);
      clickTimer = null;
    };
    const isPlainPrimaryClick = (event) => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
    const getTopicLink = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link || !isSupportedTopicTarget(link.href, location.href)) return null;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
      return link;
    };
    const getPreviewableLink = (target) => {
      const link = target instanceof Element ? target.closest("a[href]") : null;
      if (!link || !/^https?:/i.test(link.href) || getTopicInfo(link.href) || new URL(link.href, location.href).origin === location.origin) return null;
      if (target instanceof Element && target.closest("img, picture, .lightbox-wrapper") || link.matches(".lightbox") || link.querySelector("img, picture")) return null;
      if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return null;
      return link;
    };
    const sendTopic = (link) => {
      const info = getTopicInfo(link.href, location.href);
      const row = link.closest(".topic-list-item, .latest-topic-list-item, .search-result");
      const category = row ? readTopicCategory(row, window) : null;
      window.parent.postMessage({
        type: "ldu:list-topic-open",
        frameId,
        url: link.href,
        topicId: info?.topicId,
        postNumber: info?.postNumber,
        topicTitle: link.textContent?.trim() || (info ? `\u4E3B\u9898 ${info.topicId}` : ""),
        ...category ?? {}
      }, location.origin);
    };
    const sendPreview = (link) => {
      const rect = link.getBoundingClientRect();
      window.parent.postMessage({ type: "ldu:list-preview-open", frameId, url: link.href, anchorRect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      } }, location.origin);
    };
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent || event.origin !== location.origin) return;
      const data = event.data;
      if (data?.type !== "ldu:preview-config") return;
      previewEnabled = data.enabled === true;
      previewClickMode = data.clickMode === "single" ? "single" : "double";
      document.documentElement.dataset.lduHidePosters = String(data.hidePosters !== false);
      if (!previewEnabled) cancelPendingClick();
    });
    window.addEventListener("scroll", () => send("ldu:list-state"), { passive: true });
    window.addEventListener("load", () => {
      send("ldu:list-ready");
      scheduleVisualReady();
    }, { once: true });
    document.addEventListener("DOMContentLoaded", () => {
      send("ldu:list-ready");
      scheduleVisualReady();
    }, { once: true });
    window.addEventListener("popstate", () => send("ldu:list-state"));
    window.addEventListener("hashchange", () => send("ldu:list-state"));
    document.addEventListener("pointerdown", () => {
      window.parent.postMessage({ type: "ldu:list-interaction", frameId }, location.origin);
    }, true);
    new MutationObserver(() => {
      scheduleVisualReady();
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
      if (previewClickMode === "single") {
        sendPreview(link);
        return;
      }
      cancelPendingClick();
      if (event.detail >= 2) return;
      clickTimer = window.setTimeout(() => {
        clickTimer = null;
        if (!link.isConnected) return;
        replayingClick = true;
        try {
          link.click();
        } finally {
          replayingClick = false;
        }
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
    scheduleVisualReady();
  }

  // src/extension/bridge.ts
  bootFrameBridge();
})();
