// src/ui/icons.ts
var ICON_CONTENT = {
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.95 4.6 1.7 1.7 0 0 0 9.98 3.04V3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  split: '<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/><path d="M12 9v6m-3-3h6"/>',
  external: '<path d="M15 4h5v5M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
  refresh: '<path d="M20 6v5h-5"/><path d="M19 11a7 7 0 1 0 1 5"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  bookmark: '<path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',
  "bookmark-filled": '<path class="ldu-symbol-fill" d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',
  "close-others": '<rect x="3" y="5" width="13" height="12" rx="2"/><path d="M8 3h10a3 3 0 0 1 3 3v8"/><path d="m18 16 4 4m0-4-4 4"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  maximize: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  restore: '<path d="M9 9H4V4M15 9h5V4M9 15H4v5M15 15h5v5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
  "thumbs-up": '<path d="M7 10v11M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7A2 2 0 0 1 17.5 21H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z"/>',
  "thumbs-down": '<path d="M17 14V3M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.6l2.3-7A2 2 0 0 1 6.5 3H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9Z"/>',
  github: '<path d="M15 22v-3.9c.04-1-.35-1.76-.8-2.2 2.6-.3 5.3-1.27 5.3-5.75A4.5 4.5 0 0 0 18.3 7c.12-.3.52-1.53-.12-3.18 0 0-.98-.31-3.2 1.2a11.1 11.1 0 0 0-5.83 0c-2.22-1.51-3.2-1.2-3.2-1.2C5.3 5.47 5.7 6.7 5.82 7a4.5 4.5 0 0 0-1.2 3.15c0 4.47 2.72 5.46 5.32 5.75-.34.3-.64.82-.75 1.59-.67.3-2.37.82-3.42-.98 0 0-.62-1.13-1.8-1.21M9 19c-2.25 1-2.5-1-3.5-1.5"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M7.5 8C6.1 8 5 7 5 5.7S6.1 3.5 7.5 3.5C9.6 3.5 12 8 12 8s2.4-4.5 4.5-4.5C17.9 3.5 19 4.4 19 5.7S17.9 8 16.5 8"/>'
};
function iconSvg(name, size = 20) {
  return `<svg class="ldu-symbol ldu-symbol-${name}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_CONTENT[name]}</svg>`;
}

// src/preview/link-hover-previewer-upstream.ts
function installLinkHoverPreviewer(options) {
  "use strict";
  options = options || {};
  const isPreviewEnabled = () => options.isEnabled ? options.isEnabled() : true;
  const syncClickMode = () => {
    if (options.clickMode) isSingleClickPreviewEnabled = options.clickMode() === "single";
  };
  const CLICK_DELAY = 300;
  const SINGLE_CLICK_PREVIEW_DELAY = 250;
  const PREHEAT_DELAY = 250;
  const WINDOW_WIDTH = 980;
  const WINDOW_HEIGHT = 650;
  const CACHE_EXPIRE_TIME = 5 * 60 * 1e3;
  const CACHE_MAX_ENTRIES = 15;
  const CACHE_MAX_BYTES = 20 * 1024 * 1024;
  const TOKEN_PLACEHOLDER = "__AGY_TOKEN__";
  const BOOKMARK_KEY = "agy_bookmarks";
  const HIDDEN_TOPIC_KEY = "agy_linux_hidden_topics";
  const HIDDEN_TOPIC_STYLE_ID = "agy-linux-hidden-topic-style";
  const PREVIEW_POSITION_KEY = "agy_preview_position";
  const PREVIEW_MAXIMIZED_KEY = "agy_preview_maximized";
  const SINGLE_CLICK_PREVIEW_KEY = "agy_single_click_preview";
  const WINDOW_MARGIN = 8;
  const IS_TOP = window.self === window.top;
  const PREVIEW_FRAME_PREFIX = "agy-preview-frame:";
  const IS_PREVIEW_FRAME = window.name.startsWith(PREVIEW_FRAME_PREFIX);
  function isPreviewRefreshKey(e) {
    return e.key === "F5" || e.code === "F5" || e.keyCode === 116;
  }
  function createPageVisibilityController() {
    let pageWindow = window;
    try {
      if (typeof unsafeWindow !== "undefined" && unsafeWindow) pageWindow = unsafeWindow;
    } catch (e) {
    }
    const pageDocument = pageWindow.document || document;
    const PageObject = pageWindow.Object || Object;
    const PageReflect = pageWindow.Reflect || Reflect;
    const PageEvent = pageWindow.Event || Event;
    try {
      const existingController = pageWindow.__agyPreviewVisibilityControllerV2;
      if (existingController && typeof existingController.setSuspended === "function" && typeof existingController.flushVisibilityChange === "function" && typeof existingController.getNativeVisibilityState === "function") return existingController;
    } catch (e) {
    }
    const controlledProperties = [];
    let isInstalled = false;
    let isSuspended = false;
    let visibilityNotificationToken = 0;
    function findDescriptor(name) {
      let target = pageDocument;
      while (target) {
        let descriptor = null;
        try {
          descriptor = PageObject.getOwnPropertyDescriptor(target, name);
        } catch (e) {
        }
        if (descriptor) return descriptor;
        try {
          target = PageObject.getPrototypeOf(target);
        } catch (e) {
          target = null;
        }
      }
      return null;
    }
    function readNativeProperty(name, fallbackValue) {
      const controlled = controlledProperties.find((item) => item.name === name);
      const descriptor = controlled && controlled.nativeDescriptor;
      try {
        if (descriptor && typeof descriptor.get === "function") {
          return PageReflect.apply(descriptor.get, pageDocument, []);
        }
        if (descriptor && PageObject.prototype.hasOwnProperty.call(descriptor, "value")) {
          return descriptor.value;
        }
      } catch (e) {
      }
      return fallbackValue;
    }
    function registerProperty(name, suspendedValue, fallbackValue) {
      const nativeDescriptor = findDescriptor(name);
      if (!nativeDescriptor && !(name in pageDocument)) return;
      let ownDescriptor = null;
      try {
        ownDescriptor = PageObject.getOwnPropertyDescriptor(pageDocument, name) || null;
      } catch (e) {
      }
      controlledProperties.push({
        name,
        suspendedValue,
        fallbackValue,
        nativeDescriptor,
        ownDescriptor
      });
    }
    registerProperty("hidden", true, false);
    registerProperty("visibilityState", "hidden", "visible");
    registerProperty("webkitHidden", true, false);
    registerProperty("webkitVisibilityState", "hidden", "visible");
    function install() {
      if (isInstalled) return true;
      const installedNames = [];
      try {
        controlledProperties.forEach((item) => {
          PageObject.defineProperty(pageDocument, item.name, {
            configurable: true,
            enumerable: Boolean(item.nativeDescriptor && item.nativeDescriptor.enumerable),
            get: function() {
              return isSuspended ? item.suspendedValue : readNativeProperty(item.name, item.fallbackValue);
            }
          });
          installedNames.push(item.name);
        });
        isInstalled = true;
        return true;
      } catch (e) {
        installedNames.forEach((name) => {
          try {
            PageReflect.deleteProperty(pageDocument, name);
          } catch (error) {
          }
        });
        return false;
      }
    }
    function uninstall() {
      if (!isInstalled) return;
      controlledProperties.forEach((item) => {
        try {
          if (item.ownDescriptor) {
            PageObject.defineProperty(pageDocument, item.name, item.ownDescriptor);
          } else {
            PageReflect.deleteProperty(pageDocument, item.name);
          }
        } catch (e) {
        }
      });
      isInstalled = false;
    }
    function dispatchVisibilityChange() {
      try {
        pageDocument.dispatchEvent(new PageEvent("visibilitychange"));
      } catch (e) {
        try {
          document.dispatchEvent(new Event("visibilitychange"));
        } catch (error) {
        }
      }
    }
    function getNativeVisibilityState() {
      return readNativeProperty("visibilityState", "visible");
    }
    function getEffectiveHidden() {
      return isSuspended || Boolean(readNativeProperty("hidden", false));
    }
    let lastNotifiedHidden = getEffectiveHidden();
    try {
      pageDocument.addEventListener("visibilitychange", function rememberVisibilityState() {
        lastNotifiedHidden = getEffectiveHidden();
      }, true);
    } catch (e) {
    }
    function flushVisibilityChange() {
      const isHidden = getEffectiveHidden();
      if (isHidden === lastNotifiedHidden) return false;
      lastNotifiedHidden = isHidden;
      dispatchVisibilityChange();
      return true;
    }
    function deferVisibilityChange(token) {
      const notify = function() {
        if (token !== visibilityNotificationToken) return;
        flushVisibilityChange();
      };
      try {
        if (pageWindow.scheduler && typeof pageWindow.scheduler.postTask === "function") {
          const task = pageWindow.scheduler.postTask(notify, { priority: "background" });
          if (task && typeof task.catch === "function") {
            task.catch(function() {
            });
          }
          return;
        }
      } catch (e) {
      }
      try {
        pageWindow.setTimeout(notify, 0);
      } catch (e) {
        setTimeout(notify, 0);
      }
    }
    const controller = {
      setSuspended(shouldSuspend, options2 = {}) {
        const nextSuspended = Boolean(shouldSuspend);
        const stateChanged = nextSuspended !== isSuspended;
        const wasHidden = getEffectiveHidden();
        if (nextSuspended && !install()) return false;
        isSuspended = nextSuspended;
        if (!isSuspended) uninstall();
        const isHidden = getEffectiveHidden();
        if (stateChanged) visibilityNotificationToken += 1;
        if (wasHidden !== isHidden && options2.notify !== false) {
          if (options2.deferNotification === true) {
            deferVisibilityChange(visibilityNotificationToken);
          } else {
            flushVisibilityChange();
          }
        }
        return true;
      },
      flushVisibilityChange,
      getNativeVisibilityState,
      isSuspended() {
        return isSuspended;
      }
    };
    try {
      PageObject.defineProperty(pageWindow, "__agyPreviewVisibilityControllerV2", {
        configurable: true,
        value: controller
      });
    } catch (e) {
    }
    return controller;
  }
  const pageVisibilityController = createPageVisibilityController();
  if (IS_PREVIEW_FRAME) {
    installPreviewFrameBridge();
    return;
  }
  function installPreviewFrameBridge() {
    if (window.__agyPreviewBridgeInstalled) return;
    window.__agyPreviewBridgeInstalled = true;
    const getLoadToken = () => Number(window.name.slice(PREVIEW_FRAME_PREFIX.length));
    const isEditableTarget = (target) => Boolean(target && target.closest && target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], .CodeMirror, .monaco-editor'
    ));
    let contentReadySent = false;
    let contentCheckScheduled = false;
    let contentObserver = null;
    window.addEventListener("message", function(e) {
      const data = e.data;
      if (e.source !== window.parent || !data || data.agyPreviewActivity !== true || data.agyPreviewToken !== getLoadToken()) return;
      pageVisibilityController.setSuspended(data.agyPreviewActive !== true);
    });
    function hasMeaningfulContent() {
      if (!document.body) return false;
      const renderedText = typeof document.body.innerText === "string" ? document.body.innerText : document.body.textContent || "";
      const text = renderedText.replace(/\s+/g, "");
      if (text.length >= 12) return true;
      return Boolean(document.body.querySelector('img[src], video, canvas, svg, article, main > *, [role="main"] > *'));
    }
    function checkContentReady() {
      contentCheckScheduled = false;
      if (contentReadySent || !hasMeaningfulContent()) return;
      contentReadySent = true;
      if (contentObserver) contentObserver.disconnect();
      window.parent.postMessage({
        agyPreviewContentReady: true,
        agyPreviewToken: getLoadToken()
      }, "*");
    }
    function scheduleContentReadyCheck() {
      if (contentReadySent || contentCheckScheduled) return;
      contentCheckScheduled = true;
      setTimeout(checkContentReady, 50);
    }
    try {
      contentObserver = new MutationObserver(scheduleContentReadyCheck);
      contentObserver.observe(document.documentElement || document, {
        childList: true,
        subtree: true,
        characterData: true
      });
    } catch (e) {
    }
    document.addEventListener("DOMContentLoaded", scheduleContentReadyCheck, { once: true });
    document.addEventListener("click", function(e) {
      const link = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!link) return;
      const rawHref = link.getAttribute("href");
      if (!rawHref || /^javascript:/i.test(rawHref)) return;
      if (rawHref.startsWith("#")) return;
      let url = "";
      try {
        url = link.href;
      } catch (error) {
        return;
      }
      if (!/^https?:/i.test(url)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.parent.postMessage({
        agyPreviewNavigate: url,
        agyPreviewToken: getLoadToken()
      }, "*");
    }, true);
    document.addEventListener("keydown", function(e) {
      if (isPreviewRefreshKey(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) {
          window.parent.postMessage({
            agyPreviewRefresh: true,
            agyPreviewToken: getLoadToken()
          }, "*");
        }
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey || e.isComposing || isEditableTarget(e.target)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.parent.postMessage({
        agyPreviewHistoryDirection: e.key === "ArrowLeft" ? -1 : 1,
        agyPreviewToken: getLoadToken()
      }, "*");
    }, true);
    window.addEventListener("load", function() {
      const token = getLoadToken();
      window.parent.postMessage({
        agyPreviewTitle: document.title || "",
        agyPreviewUrl: location.href,
        agyPreviewToken: token
      }, "*");
      scheduleContentReadyCheck();
    }, { once: true });
  }
  const ICON_EXTERNAL = iconSvg("external", 16);
  const ICON_BOOKMARK = iconSvg("bookmark", 16);
  const ICON_BOOKMARK_FILLED = iconSvg("bookmark-filled", 16);
  const ICON_LIST = iconSvg("list", 16);
  const ICON_CHECK = iconSvg("check", 16);
  const ICON_MAXIMIZE = iconSvg("maximize", 16);
  const ICON_RESTORE = iconSvg("restore", 16);
  const ICON_REFRESH = iconSvg("refresh", 16);
  const ICON_CLOSE = iconSvg("close", 16);
  const ICON_TRASH = iconSvg("trash", 16);
  const ICON_THUMBS_UP = iconSvg("thumbs-up", 16);
  const ICON_THUMBS_DOWN = iconSvg("thumbs-down", 16);
  const LINUX_DO_COMPACT_CSS = `
        /* \u9876\u680F\u4FDD\u7559\u539F\u641C\u7D22\u7EC4\u4EF6\uFF0C\u5E76\u5C06\u5176\u56FA\u5B9A\u5230\u9876\u90E8\u680F\u6B63\u4E2D\u592E\u3002 */
        #main-outlet > .welcome-banner {
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            overflow: visible !important;
        }
        #main-outlet > .welcome-banner.--location-above-topic-content {
            display: block !important;
        }
        #main-outlet > .welcome-banner .welcome-banner__wrap {
            position: static !important;
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
        }
        #main-outlet > .welcome-banner .welcome-banner__title,
        #main-outlet > .welcome-banner .welcome-banner__wrap > :not(.welcome-banner__search-menu),
        #main-outlet > .container > .global-notice {
            display: none !important;
        }
        #main-outlet > .welcome-banner .welcome-banner__search-menu {
            position: fixed !important;
            top: 3px !important;
            left: 50% !important;
            z-index: 1100 !important;
            width: min(600px, calc(100vw - 360px)) !important;
            max-width: calc(100vw - 24px) !important;
            margin: 0 !important;
            transform: translateX(-50%) !important;
        }
        #main-outlet > .welcome-banner .welcome-banner__search-menu .search-term__input {
            width: 100% !important;
            min-width: 0 !important;
        }
        /* \u9690\u85CF\u6807\u9898\u4E0B\u65B9\u7684\u5206\u7C7B\u3001\u7B49\u7EA7\u548C\u6807\u7B7E\u4FE1\u606F\u3002 */
        .topic-list .link-bottom-line {
            display: none !important;
        }
        /* \u9690\u85CF\u53D1\u5E16\u4EBA\u5934\u50CF\u5217\u3002 */
        .topic-list tr > .posters {
            display: none !important;
        }
        /* \u6D3B\u52A8\u3001\u6D4F\u89C8\u91CF\u3001\u56DE\u590D\u56FA\u5B9A\u5728\u6700\u5DE6\u4FA7\uFF0C\u6807\u9898\u5217\u5360\u7528\u5269\u4F59\u7A7A\u95F4\u3002 */
        .topic-list {
            display: block !important;
            width: 100% !important;
            table-layout: fixed !important;
        }
        .list-container.--topic-list {
            margin-top: 0 !important;
        }
        .topic-list > thead,
        .topic-list > tbody {
            display: block !important;
            width: 100% !important;
        }
        .topic-list > thead > tr,
        .topic-list > tbody > tr.topic-list-item {
            display: grid !important;
            grid-template-columns: 72px 64px 64px minmax(0, 1fr) !important;
            min-height: 36px !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }
        .topic-list > tbody > tr.topic-list-item.agy-linux-topic-hidden {
            display: none !important;
        }
        .topic-list > thead > tr > .activity,
        .topic-list > tbody > tr.topic-list-item > .activity {
            grid-column: 1 !important;
            grid-row: 1 !important;
        }
        .topic-list > thead > tr > .views,
        .topic-list > tbody > tr.topic-list-item > .views {
            grid-column: 2 !important;
            grid-row: 1 !important;
        }
        .topic-list > thead > tr > .posts,
        .topic-list > tbody > tr.topic-list-item > .posts {
            grid-column: 3 !important;
            grid-row: 1 !important;
        }
        .topic-list > thead > tr > .default,
        .topic-list > tbody > tr.topic-list-item > .main-link {
            grid-column: 4 !important;
            grid-row: 1 !important;
            min-width: 0 !important;
            width: auto !important;
        }
        .topic-list > thead > tr > .activity,
        .topic-list > thead > tr > .views,
        .topic-list > thead > tr > .posts,
        .topic-list > tbody > tr.topic-list-item > .activity,
        .topic-list > tbody > tr.topic-list-item > .views,
        .topic-list > tbody > tr.topic-list-item > .posts {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: auto !important;
            min-width: 0 !important;
            height: 36px !important;
            padding: 4px 2px !important;
            box-sizing: border-box !important;
        }
        .topic-list > thead > tr > .default {
            display: block !important;
            height: 36px !important;
            min-height: 36px !important;
            padding: 4px 8px !important;
            box-sizing: border-box !important;
            align-content: center !important;
            overflow: hidden !important;
        }
        .topic-list > tbody > tr.topic-list-item > .main-link {
            display: flex !important;
            align-items: center !important;
            height: 36px !important;
            min-height: 36px !important;
            padding: 4px 8px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
        }
        .topic-list > tbody > tr.topic-list-item > .main-link .link-top-line {
            display: flex !important;
            flex: 1 1 auto !important;
            position: relative !important;
            align-items: center !important;
            min-width: 0 !important;
            height: 100% !important;
            padding-left: 43px !important;
            box-sizing: border-box !important;
            line-height: 1.2 !important;
            overflow: hidden !important;
        }
        .topic-list > tbody > tr.topic-list-item > .main-link .topic-statuses,
        .topic-list > tbody > tr.topic-list-item > .main-link .topic-post-badges {
            flex: 0 0 auto !important;
            display: inline-flex !important;
            align-items: center !important;
            height: 100% !important;
        }
        .topic-list > tbody > tr.topic-list-item > .main-link .raw-topic-link {
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }
        .topic-list > tbody > tr.topic-list-item > .main-link .agy-linux-topic-actions {
            position: absolute !important;
            left: 0 !important;
            top: 50% !important;
            width: 38px !important;
            margin: 0 !important;
            transform: translateY(-50%) !important;
        }
        @media (max-width: 900px) {
            #main-outlet > .welcome-banner .welcome-banner__search-menu {
                width: min(460px, calc(100vw - 180px)) !important;
            }
            .topic-list > thead > tr,
            .topic-list > tbody > tr.topic-list-item {
                grid-template-columns: 64px 56px 56px minmax(0, 1fr) !important;
            }
        }
        @media (max-width: 650px) {
            #main-outlet > .welcome-banner .welcome-banner__search-menu {
                width: min(360px, calc(100vw - 112px)) !important;
                top: 5px !important;
            }
            .topic-list > thead > tr,
            .topic-list > tbody > tr.topic-list-item {
                grid-template-columns: 58px 52px 48px minmax(0, 1fr) !important;
            }
        }
    `;
  const SITE_RULES = [
    {
      // linux.do (Discourse)
      match: /(^|\.)linux\.do$/i,
      powerSavePreview: true,
      css: `${LINUX_DO_COMPACT_CSS}
                /* \u7EAF CSS \u9690\u85CF\u5DE6\u4FA7\u8FB9\u680F (\u4E0D\u70B9\u771F\u5B9E\u6298\u53E0\u6309\u94AE\uFF0C\u907F\u514D\u72B6\u6001\u88AB\u6301\u4E45\u5316) */
                :root { --d-sidebar-width: 0px !important; }
                #d-sidebar, .sidebar-wrapper { display: none !important; }
                #main-outlet-wrapper { grid-template-columns: minmax(0, 1fr) !important; gap: 0 !important; }
                /* \u56DE\u590D\u7F16\u8F91\u5668\uFF1A\u94B3\u5236\u9AD8\u5EA6 + \u9690\u85CF\u53F3\u4FA7 Markdown \u9884\u89C8\u5217\uFF0C\u7ED9\u8F93\u5165\u533A\u817E\u51FA\u7A7A\u95F4 */
                #reply-control.open {
                    height: min(60vh, 420px) !important;
                    max-height: calc(100vh - 8px) !important;
                }
                #reply-control.open .d-editor-preview-wrapper { display: none !important; }
                /* \u56DE\u590D/\u820D\u5F03\u6309\u94AE\u79FB\u5230\u8F93\u5165\u6846\u53F3\u4FA7\u7AD6\u6392 (\u5E95\u90E8\u6309\u94AE\u533A\u5728\u9884\u89C8\u7A97\u5185\u4F1A\u88AB\u88C1\u5207) */
                #reply-control.open .d-editor-textarea-wrapper {
                    margin-right: 96px !important;
                    margin-bottom: 14px !important; /* \u5E95\u90E8\u7559\u7A7A\u6321\uFF0C\u8F93\u5165\u6846\u4E0B\u8FB9\u7EBF\u4E0D\u518D\u8D34\u8FB9\u88AB\u88C1 */
                }
                #reply-control.open .save-or-cancel {
                    position: absolute !important;
                    right: 10px !important;
                    bottom: 64px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: stretch !important;
                    gap: 6px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    z-index: 30 !important;
                }
                #reply-control.open .save-or-cancel .btn { margin: 0 !important; }
            `
    }
  ];
  function getSiteRule(url) {
    try {
      const hostname = new URL(url).hostname;
      return SITE_RULES.find((r) => r.match.test(hostname)) || null;
    } catch (e) {
      return null;
    }
  }
  function shouldDirectLoad(url) {
    return isSameOrigin(url) || Boolean(getSiteRule(url)?.directLoad);
  }
  let clickTimer = null;
  let preheatTimer = null;
  let preheatLink = null;
  let previewContainer = null;
  let currentTargetUrl = "";
  let previewTabs = [];
  let activeTabId = null;
  let nextTabId = 1;
  let nextLoadToken = 1;
  let isSingleClickPreviewEnabled = options.clickMode ? options.clickMode() === "single" : loadSingleClickPreviewMode();
  let imageViewer = null;
  let bookmarkPanel = null;
  let bookmarkButtonRefreshToken = 0;
  let swallowNextClick = false;
  let swallowClickResetTimer = null;
  let pointerOpenedGesture = false;
  let pointerShieldTimer = null;
  let hiddenLinuxTopicIds = null;
  let linuxHiddenTopicStyle = null;
  let linuxTopicObserver = null;
  let linuxTopicClassObserver = null;
  let linuxObservedTopicList = null;
  let linuxTopicScanScheduled = false;
  const pendingLinuxTopicRows = /* @__PURE__ */ new Set();
  let linuxTopicEnhancementInstalled = false;
  let isPreviewMaximized = loadPreviewMaximizedState();
  let isParentPageSuspended = false;
  let parentActivityTaskToken = 0;
  let previewTabActivityTaskToken = 0;
  const cacheMap = /* @__PURE__ */ new Map();
  let lastEventTime = 0;
  const THROTTLE_LIMIT = 50;
  function loadBookmarks() {
    try {
      if (typeof GM_getValue === "function") {
        const v = GM_getValue(BOOKMARK_KEY, "[]");
        const list = typeof v === "string" ? JSON.parse(v) : v;
        return Array.isArray(list) ? list : [];
      }
    } catch (e) {
    }
    try {
      const list = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }
  function saveBookmarks(list) {
    const s = JSON.stringify(list);
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(BOOKMARK_KEY, s);
      } else {
        localStorage.setItem(BOOKMARK_KEY, s);
      }
    } catch (e) {
      try {
        localStorage.setItem(BOOKMARK_KEY, s);
      } catch (error) {
      }
    }
    syncLinuxTopicBookmarkStates();
  }
  function loadHiddenLinuxTopicIds() {
    if (hiddenLinuxTopicIds) return hiddenLinuxTopicIds;
    let stored = null;
    try {
      if (typeof GM_getValue === "function") stored = GM_getValue(HIDDEN_TOPIC_KEY, "[]");
    } catch (e) {
    }
    if (stored === null) {
      try {
        stored = localStorage.getItem(HIDDEN_TOPIC_KEY);
      } catch (e) {
      }
    }
    try {
      const list = typeof stored === "string" ? JSON.parse(stored || "[]") : stored;
      hiddenLinuxTopicIds = new Set(Array.isArray(list) ? list.map(String) : []);
    } catch (e) {
      hiddenLinuxTopicIds = /* @__PURE__ */ new Set();
    }
    return hiddenLinuxTopicIds;
  }
  function syncLinuxHiddenTopicStyle() {
    if (!IS_TOP || !/(^|\.)linux\.do$/i.test(location.hostname)) return;
    if (!linuxHiddenTopicStyle || !linuxHiddenTopicStyle.isConnected) {
      linuxHiddenTopicStyle = document.getElementById(HIDDEN_TOPIC_STYLE_ID);
    }
    if (!linuxHiddenTopicStyle) {
      const styleParent = document.head || document.documentElement;
      if (!styleParent) return;
      linuxHiddenTopicStyle = document.createElement("style");
      linuxHiddenTopicStyle.id = HIDDEN_TOPIC_STYLE_ID;
      styleParent.appendChild(linuxHiddenTopicStyle);
    }
    const selectors = Array.from(loadHiddenLinuxTopicIds(), (topicId) => {
      if (!/^\d+$/.test(topicId)) return "";
      return `.topic-list .topic-list-item[data-topic-id="${topicId}"]`;
    }).filter(Boolean);
    linuxHiddenTopicStyle.textContent = selectors.length ? `${selectors.join(",\n")} { display: none !important; }` : "";
  }
  function saveHiddenLinuxTopicIds() {
    const list = Array.from(loadHiddenLinuxTopicIds());
    const s = JSON.stringify(list);
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(HIDDEN_TOPIC_KEY, s);
      } else {
        localStorage.setItem(HIDDEN_TOPIC_KEY, s);
      }
    } catch (e) {
      try {
        localStorage.setItem(HIDDEN_TOPIC_KEY, s);
      } catch (error) {
      }
    }
    syncLinuxHiddenTopicStyle();
  }
  function loadSingleClickPreviewMode() {
    let stored = false;
    try {
      if (typeof GM_getValue === "function") {
        stored = GM_getValue(SINGLE_CLICK_PREVIEW_KEY, false);
        return stored === true || stored === 1 || stored === "true";
      }
    } catch (e) {
    }
    try {
      stored = localStorage.getItem(SINGLE_CLICK_PREVIEW_KEY);
    } catch (e) {
    }
    return stored === true || stored === 1 || stored === "true";
  }
  function saveSingleClickPreviewMode(enabled) {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(SINGLE_CLICK_PREVIEW_KEY, enabled);
        return;
      }
    } catch (e) {
    }
    try {
      localStorage.setItem(SINGLE_CLICK_PREVIEW_KEY, String(enabled));
    } catch (e) {
    }
  }
  function isBookmarked(url) {
    return loadBookmarks().some((b) => b.url === url);
  }
  function loadPreviewPosition() {
    let stored = null;
    try {
      if (typeof GM_getValue === "function") {
        stored = GM_getValue(PREVIEW_POSITION_KEY, null);
      }
    } catch (e) {
    }
    if (stored === null) {
      try {
        stored = localStorage.getItem(PREVIEW_POSITION_KEY);
      } catch (e) {
      }
    }
    try {
      const position = typeof stored === "string" ? JSON.parse(stored) : stored;
      if (position && Number.isFinite(position.left) && Number.isFinite(position.top)) {
        return position;
      }
    } catch (e) {
    }
    return null;
  }
  function savePreviewPosition(position) {
    const stored = JSON.stringify(position);
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(PREVIEW_POSITION_KEY, stored);
        return;
      }
    } catch (e) {
    }
    try {
      localStorage.setItem(PREVIEW_POSITION_KEY, stored);
    } catch (e) {
    }
  }
  function loadPreviewMaximizedState() {
    let stored = false;
    try {
      if (typeof GM_getValue === "function") {
        stored = GM_getValue(PREVIEW_MAXIMIZED_KEY, false);
        return stored === true || stored === 1 || stored === "true";
      }
    } catch (e) {
    }
    try {
      stored = localStorage.getItem(PREVIEW_MAXIMIZED_KEY);
    } catch (e) {
    }
    return stored === true || stored === 1 || stored === "true";
  }
  function savePreviewMaximizedState(maximized) {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(PREVIEW_MAXIMIZED_KEY, maximized);
        return;
      }
    } catch (e) {
    }
    try {
      localStorage.setItem(PREVIEW_MAXIMIZED_KEY, String(maximized));
    } catch (e) {
    }
  }
  function formatTime(ts) {
    const d = new Date(ts);
    const p = (n) => n < 10 ? "0" + n : "" + n;
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function armClickSwallow() {
    swallowNextClick = true;
    if (swallowClickResetTimer) clearTimeout(swallowClickResetTimer);
    swallowClickResetTimer = setTimeout(() => {
      swallowNextClick = false;
      swallowClickResetTimer = null;
    }, 500);
  }
  function getLinuxTopicInfo(row) {
    if (!row) return null;
    const topicId = String(row.dataset.topicId || "").trim();
    const link = row.querySelector("a.raw-topic-link[href]");
    const titleLine = link && link.closest(".link-top-line");
    if (!topicId || !link || !titleLine) return null;
    let url = "";
    try {
      const parsed = new URL(link.getAttribute("href"), location.origin);
      url = `${parsed.origin}${parsed.pathname}`;
    } catch (e) {
      return null;
    }
    return {
      topicId,
      url,
      title: (link.textContent || "").trim() || url,
      titleLine
    };
  }
  function syncLinuxTopicBookmarkStates() {
    if (!IS_TOP || !/(^|\.)linux\.do$/i.test(location.hostname)) return;
    const bookmarkedUrls = new Set(loadBookmarks().map((bookmark) => bookmark.url));
    document.querySelectorAll(".agy-linux-topic-actions").forEach((actions) => {
      const upButton = actions.querySelector(".agy-linux-topic-up");
      if (!upButton) return;
      const isActive = bookmarkedUrls.has(actions.dataset.topicUrl || "");
      upButton.classList.toggle("agy-is-bookmarked", isActive);
      upButton.setAttribute("aria-pressed", String(isActive));
      upButton.title = isActive ? "\u53D6\u6D88\u6536\u85CF\u6B64\u5E16\u5B50" : "\u6536\u85CF\u6B64\u5E16\u5B50";
      upButton.setAttribute("aria-label", upButton.title);
    });
  }
  function enhanceLinuxTopicRow(row, bookmarkedUrls, hiddenTopicIds) {
    const info = getLinuxTopicInfo(row);
    if (!info) return;
    const isHidden = hiddenTopicIds.has(info.topicId);
    row.classList.toggle("agy-linux-topic-hidden", isHidden);
    if (isHidden) return;
    let actions = row.querySelector(".agy-linux-topic-actions");
    if (actions && actions.dataset.agyTopicId !== info.topicId) {
      actions.remove();
      actions = null;
    }
    if (!actions) {
      actions = document.createElement("span");
      actions.className = "agy-linux-topic-actions";
      const upButton2 = document.createElement("button");
      upButton2.type = "button";
      upButton2.className = "agy-linux-topic-action agy-linux-topic-up";
      upButton2.dataset.action = "bookmark";
      upButton2.innerHTML = ICON_THUMBS_UP;
      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.className = "agy-linux-topic-action agy-linux-topic-down";
      downButton.dataset.action = "hide";
      downButton.title = "\u9690\u85CF\u6B64\u5E16\u5B50\uFF0C\u5237\u65B0\u540E\u4ECD\u4E0D\u663E\u793A";
      downButton.setAttribute("aria-label", downButton.title);
      downButton.innerHTML = ICON_THUMBS_DOWN;
      actions.appendChild(upButton2);
      actions.appendChild(downButton);
      info.titleLine.prepend(actions);
    }
    if (actions.dataset.agyTopicId !== info.topicId) actions.dataset.agyTopicId = info.topicId;
    if (actions.dataset.topicUrl !== info.url) actions.dataset.topicUrl = info.url;
    if (actions.dataset.topicTitle !== info.title) actions.dataset.topicTitle = info.title;
    const upButton = actions.querySelector(".agy-linux-topic-up");
    const isBookmarkedTopic = bookmarkedUrls.has(info.url);
    upButton.classList.toggle("agy-is-bookmarked", isBookmarkedTopic);
    upButton.setAttribute("aria-pressed", String(isBookmarkedTopic));
    upButton.title = isBookmarkedTopic ? "\u53D6\u6D88\u6536\u85CF\u6B64\u5E16\u5B50" : "\u6536\u85CF\u6B64\u5E16\u5B50";
    upButton.setAttribute("aria-label", upButton.title);
  }
  function collectLinuxTopicRows(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches(".topic-list-item[data-topic-id]")) pendingLinuxTopicRows.add(node);
    const containingRow = node.closest(".topic-list-item[data-topic-id]");
    if (containingRow) pendingLinuxTopicRows.add(containingRow);
    node.querySelectorAll(".topic-list-item[data-topic-id]").forEach((row) => {
      pendingLinuxTopicRows.add(row);
    });
  }
  function scanLinuxTopicRows() {
    linuxTopicScanScheduled = false;
    if (!pendingLinuxTopicRows.size) return;
    const bookmarkedUrls = new Set(loadBookmarks().map((bookmark) => bookmark.url));
    const hiddenTopicIds = loadHiddenLinuxTopicIds();
    const rows = Array.from(pendingLinuxTopicRows);
    pendingLinuxTopicRows.clear();
    rows.forEach((row) => {
      if (!row.isConnected) return;
      enhanceLinuxTopicRow(row, bookmarkedUrls, hiddenTopicIds);
    });
  }
  function scheduleLinuxTopicScan(node) {
    collectLinuxTopicRows(node);
    if (!pendingLinuxTopicRows.size) return;
    if (linuxTopicScanScheduled) return;
    linuxTopicScanScheduled = true;
    if (typeof queueMicrotask === "function") {
      queueMicrotask(scanLinuxTopicRows);
    } else {
      Promise.resolve().then(scanLinuxTopicRows);
    }
  }
  function installLinuxTopicEnhancement() {
    if (linuxTopicEnhancementInstalled) return;
    linuxTopicEnhancementInstalled = true;
    loadHiddenLinuxTopicIds();
    syncLinuxHiddenTopicStyle();
    document.addEventListener("pointerdown", function(e) {
      if (!e.target.closest || !e.target.closest(".agy-linux-topic-action")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);
    document.addEventListener("click", function(e) {
      const button = e.target.closest && e.target.closest(".agy-linux-topic-action");
      if (!button) return;
      const row = button.closest(".topic-list-item[data-topic-id]");
      const actions = button.closest(".agy-linux-topic-actions");
      if (!row || !actions) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const topicId = String(actions.dataset.agyTopicId || "");
      const url = actions.dataset.topicUrl || "";
      const title = actions.dataset.topicTitle || url;
      if (button.dataset.action === "bookmark") {
        toggleBookmarkEntry(url, title);
        return;
      }
      if (button.dataset.action === "hide" && topicId) {
        loadHiddenLinuxTopicIds().add(topicId);
        saveHiddenLinuxTopicIds();
        row.classList.add("agy-linux-topic-hidden");
      }
    }, true);
    function handleLinuxTopicMutations(mutations) {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
          collectLinuxTopicRows(mutation.target);
          return;
        }
        const containingRow = mutation.target.closest && mutation.target.closest(".topic-list-item[data-topic-id]");
        if (containingRow) pendingLinuxTopicRows.add(containingRow);
        mutation.addedNodes.forEach(collectLinuxTopicRows);
      });
      observeLinuxTopicListClasses();
      if (pendingLinuxTopicRows.size) scheduleLinuxTopicScan();
    }
    function handleLinuxTopicClassMutations(mutations) {
      const hiddenTopicIds = loadHiddenLinuxTopicIds();
      mutations.forEach((mutation) => {
        const row = mutation.target.matches && mutation.target.matches(".topic-list-item[data-topic-id]") ? mutation.target : null;
        if (!row) return;
        const topicId = String(row.dataset.topicId || "").trim();
        const shouldBeHidden = hiddenTopicIds.has(topicId);
        const hasHiddenClass = row.classList.contains("agy-linux-topic-hidden");
        const isMissingActions = !shouldBeHidden && !row.querySelector(".agy-linux-topic-actions");
        if (shouldBeHidden !== hasHiddenClass || isMissingActions) {
          pendingLinuxTopicRows.add(row);
        }
      });
      if (pendingLinuxTopicRows.size) scheduleLinuxTopicScan();
    }
    function observeLinuxTopicListClasses() {
      const topicList = document.querySelector(".topic-list");
      if (!topicList || topicList === linuxObservedTopicList) return;
      if (!linuxTopicClassObserver) {
        linuxTopicClassObserver = new MutationObserver(handleLinuxTopicClassMutations);
      } else {
        linuxTopicClassObserver.disconnect();
      }
      linuxObservedTopicList = topicList;
      linuxTopicClassObserver.observe(topicList, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class"]
      });
    }
    function startObserver() {
      if (!document.documentElement || linuxTopicObserver) return;
      linuxTopicObserver = new MutationObserver(handleLinuxTopicMutations);
      linuxTopicObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-topic-id", "href"]
      });
      syncLinuxHiddenTopicStyle();
      observeLinuxTopicListClasses();
      scheduleLinuxTopicScan(document.documentElement);
    }
    if (document.documentElement) {
      startObserver();
    } else {
      document.addEventListener("readystatechange", startObserver, { once: true });
    }
  }
  if (IS_TOP) {
    const style = document.createElement("style");
    style.textContent = `
        /* LDU ADAPTATION: host-page Linux Do layout is owned by the split app. */
        .agy-preview-container {
            position: fixed;
            width: ${WINDOW_WIDTH}px;
            height: ${WINDOW_HEIGHT}px;
            max-width: calc(100vw - ${WINDOW_MARGIN * 2}px);
            max-height: calc(100vh - ${WINDOW_MARGIN * 2}px);
            z-index: 10000000;
            background: #fdfdfd;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 16px;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18),
                        0 2px 8px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: scale(0.95) translate3d(0, 0, 0);
            transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                        transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
            box-sizing: border-box;
            contain: content;
        }
        .agy-preview-container.agy-animating {
            will-change: transform, opacity;
        }
        .agy-preview-container.agy-preview-visible {
            display: flex;
            opacity: 1;
            transform: scale(1) translate3d(0, 0, 0);
            pointer-events: auto;
        }
        .agy-preview-container.agy-instant-feedback {
            transition: none !important;
        }
        .agy-preview-container.agy-dragging {
            transition: none;
        }
        .agy-preview-container.agy-maximized {
            left: ${WINDOW_MARGIN}px !important;
            top: ${WINDOW_MARGIN}px !important;
            right: ${WINDOW_MARGIN}px !important;
            bottom: ${WINDOW_MARGIN}px !important;
            width: auto !important;
            height: auto !important;
            max-width: none !important;
            max-height: none !important;
            border-radius: 8px;
        }
        .agy-preview-container.agy-maximized .agy-preview-header {
            cursor: default;
        }
        @media (prefers-color-scheme: dark) {
            .agy-preview-container {
                background: #1c1c1e;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
            }
        }
        .agy-preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            background: linear-gradient(rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.015));
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            user-select: none;
            box-sizing: border-box;
            flex-shrink: 0;
            cursor: grab;
            touch-action: none;
            gap: 10px;
        }
        .agy-preview-container.agy-dragging .agy-preview-header {
            cursor: grabbing;
        }
        @media (prefers-color-scheme: dark) {
            .agy-preview-header {
                background: rgba(255, 255, 255, 0.03);
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            }
        }
        .agy-preview-tabs {
            display: flex;
            align-items: center;
            gap: 4px;
            flex: 1;
            min-width: 0;
            overflow-x: auto;
            scrollbar-width: none;
            cursor: grab;
        }
        .agy-preview-tabs::-webkit-scrollbar {
            display: none;
        }
        .agy-preview-tab {
            display: flex;
            align-items: center;
            gap: 5px;
            width: 150px;
            min-width: 100px;
            max-width: 180px;
            height: 28px;
            padding: 0 6px 0 9px;
            border: 1px solid transparent;
            border-radius: 6px;
            background: rgba(0, 0, 0, 0.035);
            color: #666;
            cursor: pointer;
            box-sizing: border-box;
            flex-shrink: 0;
        }
        .agy-preview-tab:hover {
            background: rgba(0, 122, 255, 0.08);
        }
        .agy-preview-tab.active {
            background: #fff;
            border-color: rgba(0, 122, 255, 0.22);
            color: #222;
        }
        .agy-preview-tab-title {
            min-width: 0;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 11px;
            font-weight: 500;
            line-height: 1;
        }
        .agy-preview-tab-close {
            width: 16px;
            height: 16px;
            padding: 0;
            border: 0;
            border-radius: 4px;
            background: transparent;
            color: #999;
            cursor: pointer;
            line-height: 16px;
            font-size: 11px;
            flex-shrink: 0;
        }
        .agy-preview-tab-close:hover {
            background: #ff3b30;
            color: #fff;
        }
        @media (prefers-color-scheme: dark) {
            .agy-preview-tab {
                background: rgba(255, 255, 255, 0.06);
                color: #aaa;
            }
            .agy-preview-tab.active {
                background: rgba(255, 255, 255, 0.13);
                border-color: rgba(10, 132, 255, 0.45);
                color: #f2f2f2;
            }
        }
        .agy-preview-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: default;
        }
        .agy-click-mode-toggle {
            position: relative;
            width: 28px;
            height: 16px;
            padding: 0;
            border: 1px solid rgba(0, 0, 0, 0.13);
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.1);
            cursor: pointer;
            flex-shrink: 0;
            transition: background 0.12s, border-color 0.12s;
        }
        .agy-click-mode-toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
            transition: transform 0.12s;
        }
        .agy-click-mode-toggle[aria-checked="true"] {
            border-color: #007aff;
            background: #007aff;
        }
        .agy-click-mode-toggle[aria-checked="true"]::after {
            transform: translateX(12px);
        }
        .agy-click-mode-toggle:focus-visible {
            outline: 2px solid rgba(0, 122, 255, 0.35);
            outline-offset: 2px;
        }
        @media (prefers-color-scheme: dark) {
            .agy-click-mode-toggle {
                border-color: rgba(255, 255, 255, 0.18);
                background: rgba(255, 255, 255, 0.14);
            }
            .agy-click-mode-toggle[aria-checked="true"] {
                border-color: #0a84ff;
                background: #0a84ff;
            }
        }
        .agy-preview-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            border-radius: 6px;
            font-size: 11px;
            color: #007aff;
            font-weight: 500;
            transition: background 0.15s, color 0.15s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .agy-preview-btn svg {
            display: block;
        }
        .agy-preview-btn:hover {
            background: rgba(0, 122, 255, 0.08);
        }
        .agy-preview-btn.agy-bm-active {
            color: #ff9500;
        }
        .agy-maximize-btn {
            width: 22px;
            height: 22px;
            padding: 0;
            border: none;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.05);
            color: #666;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .agy-maximize-btn:hover {
            background: rgba(0, 122, 255, 0.12);
            color: #007aff;
        }
        .agy-close-btn {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.05);
            color: #666;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            transition: background 0.15s, color 0.15s;
        }
        .agy-close-btn:hover {
            background: #ff3b30;
            color: #fff;
        }
        @media (prefers-color-scheme: dark) {
            .agy-maximize-btn,
            .agy-close-btn {
                background: rgba(255, 255, 255, 0.1);
                color: #bbb;
            }
            .agy-maximize-btn:hover {
                background: rgba(10, 132, 255, 0.2);
                color: #0a84ff;
            }
            .agy-close-btn:hover {
                background: #ff453a;
                color: #fff;
            }
        }
        .agy-preview-body {
            position: relative;
            flex: 1 1 0;
            min-height: 0;
            width: 100%;
            height: auto;
            overflow: hidden;
            background: #fff;
            box-sizing: border-box;
        }
        @media (prefers-color-scheme: dark) {
            .agy-preview-body {
                background: #1c1c1e;
            }
        }
        .agy-preview-pane {
            position: absolute;
            inset: 0;
            display: none;
            pointer-events: none;
            z-index: 0;
            contain: strict;
        }
        .agy-preview-pane.active {
            display: block;
            pointer-events: auto;
            z-index: 1;
        }
        .agy-preview-iframe {
            display: block;
            width: 100%;
            height: 100%;
            border: none;
            background: transparent;
        }
        .agy-loading-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(245, 247, 250, 0.7);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            transition: opacity 0.12s ease-out;
            z-index: 20;
            box-sizing: border-box;
        }
        .agy-loading-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            max-width: 80%;
            transform: translateY(clamp(70px, 10vh, 110px));
            box-sizing: border-box;
        }
        @media (prefers-color-scheme: dark) {
            .agy-loading-overlay {
                background: rgba(15, 15, 17, 0.68);
            }
        }
        .agy-spinner {
            width: 22px;
            height: 22px;
            border: 2.5px solid rgba(0, 122, 255, 0.16);
            border-top-color: #007aff;
            border-radius: 50%;
            animation: agy-spin 0.8s linear infinite;
            flex-shrink: 0;
        }
        .agy-loading-text {
            font-size: 13px;
            line-height: 1.5;
            color: #4b5563;
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
        }
        @media (prefers-color-scheme: dark) {
            .agy-loading-text {
                color: #aaa;
            }
        }
        @keyframes agy-spin {
            to { transform: rotate(360deg); }
        }
        /* \u72EC\u7ACB\u56FE\u7247\u67E5\u770B\u5668 (\u706F\u7BB1)\uFF0C\u4F4D\u4E8E\u9884\u89C8\u7A97\u4E4B\u4E0A\uFF0C\u5355\u72EC\u5F00\u5173 */
        .agy-image-viewer {
            position: fixed;
            inset: 0;
            z-index: 10000002;
            background: rgba(0, 0, 0, 0.78);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: zoom-out;
        }
        .agy-image-viewer img {
            max-width: 92vw;
            max-height: 92vh;
            border-radius: 8px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
            cursor: default;
        }
        .agy-viewer-close {
            position: absolute;
            top: 20px;
            right: 24px;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.16);
            color: #fff;
            border: none;
            cursor: pointer;
            font-size: 15px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .agy-viewer-close:hover {
            background: #ff3b30;
        }
        .agy-viewer-tip {
            position: absolute;
            bottom: 18px;
            left: 0; right: 0;
            text-align: center;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.65);
            font-family: system-ui, -apple-system, sans-serif;
            pointer-events: none;
        }
        /* \u4E66\u7B7E\u5217\u8868\u60AC\u6D6E\u9762\u677F (\u4F4D\u4E8E\u9884\u89C8\u7A97\u5DE6\u4FA7) */
        .agy-bookmark-panel {
            position: fixed;
            width: 250px;
            z-index: 10000001;
            background: #fdfdfd;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 12px;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
            .agy-bookmark-panel {
                background: #1c1c1e;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
            }
        }
        .agy-bm-header {
            padding: 4px 12px;
            color: #555;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .agy-bm-count {
            flex-shrink: 0;
            font-size: 12px;
            font-weight: 600;
            line-height: 1;
            transform: translateY(-1px);
            white-space: nowrap;
        }
        .agy-bm-search {
            min-width: 0;
            flex: 1;
            height: 22px;
            padding: 0 7px;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.85);
            color: #333;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
            font-size: 12px !important;
            font-weight: 400 !important;
            line-height: 20px !important;
            outline: none;
            box-sizing: border-box;
        }
        .agy-bm-search::placeholder {
            font-size: 12px !important;
            font-weight: 400 !important;
            opacity: 0.72;
        }
        .agy-bm-search:focus {
            border-color: rgba(0, 122, 255, 0.7);
            box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
        }
        @media (prefers-color-scheme: dark) {
            .agy-bm-header {
                color: #ccc;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }
            .agy-bm-search {
                border-color: rgba(255, 255, 255, 0.14);
                background: rgba(255, 255, 255, 0.08);
                color: #eee;
            }
        }
        .agy-bm-list {
            overflow-y: auto;
            overscroll-behavior: contain;
        }
        .agy-bm-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            cursor: pointer;
        }
        .agy-bm-item:hover {
            background: rgba(0, 122, 255, 0.08);
        }
        .agy-bm-item-title {
            flex: 1;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        @media (prefers-color-scheme: dark) {
            .agy-bm-item-title {
                color: #ddd;
            }
        }
        .agy-bm-item-del {
            width: 16px;
            height: 16px;
            border: none;
            border-radius: 4px;
            background: none;
            color: #bbb;
            font-size: 11px;
            line-height: 1;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .agy-bm-item:hover .agy-bm-item-del {
            display: flex;
        }
        .agy-bm-item-del:hover {
            background: #ff3b30;
            color: #fff;
        }
        .agy-bm-empty {
            padding: 16px 12px;
            font-size: 12px;
            color: #999;
            text-align: center;
        }
        .agy-linux-topic-actions {
            display: inline-flex !important;
            align-items: center !important;
            gap: 2px !important;
            margin-right: 5px !important;
            vertical-align: -3px !important;
            white-space: nowrap !important;
        }
        .agy-linux-topic-action {
            all: unset !important;
            width: 18px !important;
            height: 18px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            border-radius: 4px !important;
            color: var(--primary-medium, #777) !important;
            cursor: pointer !important;
            box-sizing: border-box !important;
        }
        .agy-linux-topic-action svg {
            display: block !important;
            pointer-events: none !important;
        }
        .agy-linux-topic-up:hover,
        .agy-linux-topic-up.agy-is-bookmarked {
            color: #28a745 !important;
            background: rgba(40, 167, 69, 0.1) !important;
        }
        .agy-linux-topic-down:hover {
            color: #e5484d !important;
            background: rgba(229, 72, 77, 0.1) !important;
        }
        .agy-linux-topic-action:focus-visible {
            outline: 2px solid rgba(0, 122, 255, 0.45) !important;
            outline-offset: 1px !important;
        }
        .topic-list-item.agy-linux-topic-hidden {
            display: none !important;
        }
        `;
    const styleParent = document.head || document.documentElement;
    if (styleParent) {
      styleParent.appendChild(style);
    } else {
      document.addEventListener("readystatechange", function appendStyle() {
        const parent = document.head || document.documentElement;
        if (!parent) return;
        document.removeEventListener("readystatechange", appendStyle);
        parent.appendChild(style);
      });
    }
  }
  if (IS_TOP) {
    window.addEventListener("pointerdown", function(e) {
      if (e.target.closest && e.target.closest(".agy-linux-topic-action")) return;
      const closeButton = e.target.closest && e.target.closest(".agy-close-btn");
      if (closeButton && previewContainer && previewContainer.contains(closeButton)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        destroyPreview();
        armClickSwallow();
        return;
      }
      const tabCloseButton = e.target.closest && e.target.closest(".agy-preview-tab-close");
      if (tabCloseButton && previewContainer && previewContainer.contains(tabCloseButton)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const tabElement2 = tabCloseButton.closest(".agy-preview-tab");
        const tabId = tabElement2 && Number(tabElement2.dataset.tabId);
        if (Number.isFinite(tabId)) closePreviewTab(tabId);
        armClickSwallow();
        return;
      }
      const tabElement = e.target.closest && e.target.closest(".agy-preview-tab");
      if (e.button === 0 && tabElement && previewContainer && previewContainer.contains(tabElement)) {
        const tabId = Number(tabElement.dataset.tabId);
        if (Number.isFinite(tabId)) activatePreviewTab(tabId);
      }
      if (imageViewer) {
        if (e.target === imageViewer || e.target.closest && e.target.closest(".agy-viewer-close")) {
          closeImageViewer();
          armClickSwallow();
        }
        return;
      }
      if (bookmarkPanel && bookmarkPanel.contains(e.target)) return;
      if (previewContainer && !previewContainer.contains(e.target)) {
        const outsideLink = e.target.closest && e.target.closest("a");
        if (isPreviewableLink(outsideLink)) return;
        destroyPreview();
        armClickSwallow();
      }
    }, true);
    window.addEventListener("pointerdown", function(e) {
      if (!isPreviewEnabled()) return;
      if (e.detail !== 2 || e.button !== 0) return;
      if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      if (isSingleClickPreviewEnabled) return;
      if (imageViewer) return;
      const link = e.target.closest && e.target.closest("a");
      if (!isPreviewableLink(link)) return;
      pointerOpenedGesture = true;
      openLinkInPreview(link);
    }, true);
    document.addEventListener("click", function(e) {
      if (swallowNextClick) {
        swallowNextClick = false;
        if (swallowClickResetTimer) {
          clearTimeout(swallowClickResetTimer);
          swallowClickResetTimer = null;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
    window.addEventListener("resize", function() {
      if (!previewContainer) return;
      if (isPreviewMaximized) {
        applyPreviewMaximizedState();
        closeBookmarkPanel();
        return;
      }
      const rect = previewContainer.getBoundingClientRect();
      const position = clampPreviewPosition(rect.left, rect.top, previewContainer);
      applyPreviewPosition(previewContainer, position);
      savePreviewPosition(position);
      closeBookmarkPanel();
    });
    window.addEventListener("message", function(e) {
      const data = e.data;
      if (!data || !Number.isFinite(data.agyPreviewToken)) return;
      const tab = previewTabs.find((item) => item.iframe && e.source === item.iframe.contentWindow && item.loadToken === data.agyPreviewToken);
      if (!tab) return;
      if (typeof data.agyPreviewTitle === "string" && data.agyPreviewTitle.trim()) {
        updatePreviewTabTitle(tab, data.agyPreviewTitle);
      }
      if (data.agyPreviewContentReady === true) {
        revealLoadedPreviewTab(tab, tab.loadToken, tab.url);
      }
      if (data.agyPreviewHistoryDirection === -1 || data.agyPreviewHistoryDirection === 1) {
        if (tab.id === activeTabId) movePreviewHistory(tab, data.agyPreviewHistoryDirection);
      }
      if (data.agyPreviewRefresh === true && tab.id === activeTabId) {
        refreshPreviewTab(tab);
      }
      if (typeof data.agyPreviewNavigate === "string" && /^https?:/i.test(data.agyPreviewNavigate)) {
        navigatePreview(data.agyPreviewNavigate, tab.id);
      }
    });
    document.addEventListener("visibilitychange", function() {
      if (previewContainer) syncPreviewTabActivity();
    });
  }
  document.addEventListener("click", handleLinkClick, true);
  document.addEventListener("dblclick", handleLinkDblClick, true);
  if (IS_TOP) {
    document.addEventListener("keydown", function(e) {
      if (previewContainer && isPreviewRefreshKey(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) refreshPreviewTab(getActiveTab());
        return;
      }
      if (e.key === "Escape" || e.keyCode === 27) {
        if (imageViewer) {
          closeImageViewer();
        } else if (bookmarkPanel) {
          closeBookmarkPanel();
        } else if (previewContainer) {
          destroyPreview();
        }
        return;
      }
      if (!previewContainer || e.key !== "ArrowLeft" && e.key !== "ArrowRight" || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey || e.isComposing || isEditableKeyboardTarget(e.target)) return;
      const tab = getActiveTab();
      if (!tab) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      movePreviewHistory(tab, e.key === "ArrowLeft" ? -1 : 1);
    }, true);
  }
  function isEditableKeyboardTarget(target) {
    return Boolean(target && target.closest && target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], .CodeMirror, .monaco-editor'
    ));
  }
  function isPreviewableLink(link) {
    if (!isPreviewEnabled()) return false;
    if (!link || link.closest(".agy-preview-container")) return false;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("javascript:") || href.startsWith("#") || href === "") {
      return false;
    }
    if (!/^https?:/i.test(link.href)) return false;
    return options.isPreviewableUrl ? options.isPreviewableUrl(link.href, link) : true;
  }
  function isImageUrl(url) {
    try {
      return /\.(png|jpe?g|gif|webp|avif|bmp|ico|svg)$/i.test(new URL(url).pathname);
    } catch (e) {
      return false;
    }
  }
  function isImageResponse(response) {
    return /content-type:\s*image\//i.test(response.responseHeaders || "");
  }
  function showImageViewer(url) {
    closeImageViewer();
    imageViewer = document.createElement("div");
    imageViewer.className = "agy-image-viewer";
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    const closeBtn = document.createElement("button");
    closeBtn.className = "agy-viewer-close";
    closeBtn.innerHTML = ICON_CLOSE;
    closeBtn.title = "\u5173\u95ED\u56FE\u7247 (Esc)";
    const tip = document.createElement("div");
    tip.className = "agy-viewer-tip";
    tip.textContent = "\u70B9\u51FB\u7A7A\u767D\u5904\u6216\u6309 Esc \u5173\u95ED";
    imageViewer.appendChild(img);
    imageViewer.appendChild(closeBtn);
    imageViewer.appendChild(tip);
    document.body.appendChild(imageViewer);
  }
  function closeImageViewer() {
    if (!imageViewer) return;
    const v = imageViewer;
    imageViewer = null;
    v.style.setProperty("visibility", "hidden", "important");
    v.style.setProperty("display", "none", "important");
    v.style.setProperty("pointer-events", "none", "important");
    v.style.setProperty("transition", "none", "important");
    scheduleHeavyCleanup(() => {
      const img = v.querySelector("img");
      if (img) img.removeAttribute("src");
      if (v.parentNode) v.parentNode.removeChild(v);
    });
  }
  function getPreviewTitle() {
    const tab = getActiveTab();
    try {
      const t = tab && tab.iframe && tab.iframe.contentDocument && tab.iframe.contentDocument.title;
      if (t && t.trim()) return t.trim();
    } catch (e) {
    }
    try {
      const u = new URL(currentTargetUrl);
      return u.hostname + u.pathname;
    } catch (e) {
      return currentTargetUrl;
    }
  }
  function toggleBookmarkEntry(url, title, btn) {
    if (!url) return;
    const list = loadBookmarks();
    const idx = list.findIndex((b) => b.url === url);
    if (idx >= 0) {
      list.splice(idx, 1);
      saveBookmarks(list);
    } else {
      list.unshift({
        url,
        title: title || url,
        time: Date.now()
      });
      saveBookmarks(list);
      if (btn) {
        btn.innerHTML = ICON_CHECK;
        btn.style.color = "#34c759";
        setTimeout(() => {
          btn.style.color = "";
          updateBookmarkButtonState();
        }, 700);
      }
    }
    updateBookmarkButtonState();
    if (bookmarkPanel) renderBookmarkList();
  }
  function toggleBookmark(btn) {
    if (!currentTargetUrl) return;
    toggleBookmarkEntry(currentTargetUrl, getPreviewTitle(), btn);
  }
  function updateBookmarkButtonState() {
    if (!previewContainer) return;
    const btn = previewContainer.querySelector(".agy-bm-add-btn");
    if (!btn) return;
    if (isBookmarked(currentTargetUrl)) {
      btn.innerHTML = ICON_BOOKMARK_FILLED;
      btn.classList.add("agy-bm-active");
      btn.title = "\u53D6\u6D88\u6536\u85CF";
    } else {
      btn.innerHTML = ICON_BOOKMARK;
      btn.classList.remove("agy-bm-active");
      btn.title = "\u6536\u85CF\u5F53\u524D\u9875\u9762";
    }
  }
  function scheduleBookmarkButtonStateUpdate(tabId) {
    const refreshToken = ++bookmarkButtonRefreshToken;
    cleanupAfterNextPaint(() => {
      if (refreshToken !== bookmarkButtonRefreshToken || activeTabId !== tabId) return;
      updateBookmarkButtonState();
    });
  }
  function renderBookmarkList() {
    if (!bookmarkPanel) return;
    const listEl = bookmarkPanel.querySelector(".agy-bm-list");
    const countEl = bookmarkPanel.querySelector(".agy-bm-count");
    const searchEl = bookmarkPanel.querySelector(".agy-bm-search");
    if (!listEl) return;
    const list = loadBookmarks();
    const keyword = searchEl ? searchEl.value.trim().toLocaleLowerCase() : "";
    const filteredList = keyword ? list.filter((bookmark) => {
      const title = (bookmark.title || "").toLocaleLowerCase();
      const url = (bookmark.url || "").toLocaleLowerCase();
      return title.includes(keyword) || url.includes(keyword);
    }) : list;
    if (countEl) {
      countEl.textContent = keyword ? `\u4E66\u7B7E (${filteredList.length}/${list.length})` : `\u4E66\u7B7E (${list.length})`;
    }
    listEl.textContent = "";
    if (!filteredList.length) {
      const empty = document.createElement("div");
      empty.className = "agy-bm-empty";
      empty.textContent = list.length ? "\u6CA1\u6709\u5339\u914D\u7684\u4E66\u7B7E" : "\u6682\u65E0\u4E66\u7B7E";
      listEl.appendChild(empty);
      return;
    }
    filteredList.forEach((b) => {
      const item = document.createElement("div");
      item.className = "agy-bm-item";
      item.title = `\u6536\u85CF\u4E8E ${formatTime(b.time)}
${b.url}`;
      const titleSpan = document.createElement("span");
      titleSpan.className = "agy-bm-item-title";
      titleSpan.textContent = b.title || b.url;
      const delBtn = document.createElement("button");
      delBtn.className = "agy-bm-item-del";
      delBtn.innerHTML = ICON_TRASH;
      delBtn.title = "\u5220\u9664\u6B64\u4E66\u7B7E";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const latest = loadBookmarks().filter((x) => x.url !== b.url);
        saveBookmarks(latest);
        renderBookmarkList();
        updateBookmarkButtonState();
      });
      item.appendChild(titleSpan);
      item.appendChild(delBtn);
      item.addEventListener("click", () => {
        navigatePreview(b.url, activeTabId, { keepBookmarkPanel: true });
      });
      listEl.appendChild(item);
    });
  }
  function toggleBookmarkPanel() {
    if (bookmarkPanel) {
      closeBookmarkPanel();
      return;
    }
    if (!previewContainer) return;
    bookmarkPanel = document.createElement("div");
    bookmarkPanel.className = "agy-bookmark-panel";
    const header = document.createElement("div");
    header.className = "agy-bm-header";
    const count = document.createElement("span");
    count.className = "agy-bm-count";
    const search = document.createElement("input");
    search.className = "agy-bm-search";
    search.type = "search";
    search.placeholder = "\u641C\u7D22\u6807\u9898\u6216\u7F51\u5740";
    search.setAttribute("aria-label", "\u641C\u7D22\u4E66\u7B7E\u6807\u9898\u6216\u7F51\u5740");
    search.addEventListener("input", renderBookmarkList);
    search.addEventListener("click", (e) => e.stopPropagation());
    header.appendChild(count);
    header.appendChild(search);
    const listEl = document.createElement("div");
    listEl.className = "agy-bm-list";
    bookmarkPanel.appendChild(header);
    bookmarkPanel.appendChild(listEl);
    document.body.appendChild(bookmarkPanel);
    const rect = previewContainer.getBoundingClientRect();
    let left = rect.left - 250 - 8;
    if (left < 8) left = rect.right + 8;
    if (left + 250 > window.innerWidth - 8) left = Math.max(8, window.innerWidth - 258);
    bookmarkPanel.style.left = `${left}px`;
    bookmarkPanel.style.top = `${rect.top}px`;
    bookmarkPanel.style.maxHeight = `${rect.height}px`;
    renderBookmarkList();
  }
  function closeBookmarkPanel() {
    if (!bookmarkPanel) return;
    const p = bookmarkPanel;
    bookmarkPanel = null;
    if (p.parentNode) p.parentNode.removeChild(p);
  }
  function setCache(url, entry) {
    entry.size = (entry.html ? entry.html.length : 0) + (entry.rawHtml ? entry.rawHtml.length : 0);
    const now = Date.now();
    for (const [k, v] of cacheMap) {
      if (v.status !== "loading" && now - v.time > CACHE_EXPIRE_TIME) {
        cacheMap.delete(k);
      }
    }
    if (cacheMap.has(url)) cacheMap.delete(url);
    cacheMap.set(url, entry);
    let totalBytes = 0;
    for (const v of cacheMap.values()) totalBytes += v.size || 0;
    while (cacheMap.size > CACHE_MAX_ENTRIES || totalBytes > CACHE_MAX_BYTES) {
      const protectedUrls = new Set(previewTabs.map((tab) => tab.url));
      protectedUrls.add(url);
      const oldestKey = Array.from(cacheMap.keys()).find((key) => !protectedUrls.has(key));
      if (!oldestKey) break;
      const old = cacheMap.get(oldestKey);
      totalBytes -= old && old.size || 0;
      if (old && old.xhr) {
        try {
          old.xhr.abort();
        } catch (e) {
        }
      }
      cacheMap.delete(oldestKey);
    }
  }
  function ensurePreparedCacheEntry(url, entry) {
    if (!entry || entry.status !== "done") return null;
    if (!entry.html && typeof entry.rawHtml === "string") {
      entry.html = prepareDynamicHtml(entry.rawHtml, url, TOKEN_PLACEHOLDER);
      entry.rawHtml = null;
      entry.size = entry.html.length;
    }
    return entry.html;
  }
  function schedulePreparation(url, entry) {
    const run = () => {
      if (cacheMap.get(url) !== entry) return;
      ensurePreparedCacheEntry(url, entry);
    };
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 2e3 });
    } else {
      setTimeout(run, 150);
    }
  }
  function handleMouseOverPreheat(e) {
    if (!isPreviewEnabled()) return;
    const link = e.target.closest("a");
    if (!isPreviewableLink(link)) return;
    if (preheatLink === link) return;
    const now = Date.now();
    if (now - lastEventTime < THROTTLE_LIMIT) return;
    lastEventTime = now;
    if (preheatLink) {
      cancelPreheat(preheatLink.href);
    }
    preheatLink = link;
    link.addEventListener("mouseleave", handleMouseLeavePreheat, { once: true });
    preheatTimer = setTimeout(() => {
      prefetchUrl(link.href);
    }, PREHEAT_DELAY);
  }
  function handleMouseLeavePreheat() {
    if (preheatTimer) {
      clearTimeout(preheatTimer);
      preheatTimer = null;
    }
    if (preheatLink) {
      cancelPreheat(preheatLink.href);
      preheatLink = null;
    }
  }
  function prefetchUrl(url) {
    const cached = cacheMap.get(url);
    if (cached && cached.status === "loading") return;
    if (cached && Date.now() - cached.time < CACHE_EXPIRE_TIME) {
      return;
    }
    if (shouldDirectLoad(url) || isImageUrl(url)) return;
    const xhr = GM_xmlhttpRequest({
      method: "GET",
      url,
      timeout: 1e4,
      onload: function(response) {
        if (response.status >= 200 && response.status < 400) {
          const entry = cacheMap.get(url);
          if (!entry || entry.xhr !== xhr) return;
          if (isImageResponse(response)) {
            entry.status = "image";
            entry.html = "";
            entry.rawHtml = null;
            entry.size = 0;
          } else {
            entry.status = "done";
            entry.rawHtml = response.responseText;
            entry.html = null;
            entry.size = response.responseText.length;
          }
          entry.xhr = null;
          entry.time = Date.now();
          const waitingTabs = previewTabs.filter((tab) => isTabLoadCurrent(tab, tab.loadToken, url) && tab.loadState === "waiting-cache");
          waitingTabs.forEach((tab) => {
            if (entry.status === "image") {
              tab.loadState = "image";
              hideLoadingBar(tab.loadingBar, tab);
              if (tab.id === activeTabId) showImageViewer(url);
            } else {
              const preparedHtml = ensurePreparedCacheEntry(url, entry);
              if (preparedHtml) renderFetchedDynamicPage(tab, preparedHtml, url, tab.loadingBar, tab.loadToken);
            }
          });
          if (entry.status === "done" && !entry.html) {
            schedulePreparation(url, entry);
          }
        }
      },
      onerror: function() {
        const entry = cacheMap.get(url);
        if (!entry || entry.xhr !== xhr) return;
        previewTabs.filter((tab) => isTabLoadCurrent(tab, tab.loadToken, url) && tab.loadState === "waiting-cache").forEach((tab) => showError(tab, "\u9884\u52A0\u8F7D\u7F51\u7EDC\u8BF7\u6C42\u51FA\u9519"));
        cacheMap.delete(url);
      }
    });
    setCache(url, {
      status: "loading",
      html: "",
      xhr,
      time: Date.now()
    });
  }
  function cancelPreheat(url) {
    const cached = cacheMap.get(url);
    const isNeededByPreview = previewTabs.some((tab) => tab.url === url && (tab.loadState === "loading" || tab.loadState === "waiting-cache"));
    if (cached && cached.status === "loading" && !isNeededByPreview) {
      if (cached.xhr) cached.xhr.abort();
      cacheMap.delete(url);
    }
  }
  function frameNavigate(url) {
    window.location.href = url;
  }
  function openLinkNormally(link) {
    const target = link.getAttribute("target");
    if (previewContainer) destroyPreview();
    if (IS_TOP && target === "_blank") {
      window.open(link.href, "_blank");
    } else {
      frameNavigate(link.href);
    }
  }
  function openLinkInPreview(link) {
    if (!IS_TOP) {
      frameNavigate(link.href);
      return;
    }
    if (isImageUrl(link.href)) {
      showImageViewer(link.href);
      return;
    }
    if (previewContainer) {
      addPreviewTab(link.href);
      return;
    }
    currentTargetUrl = link.href;
    showPreviewWindow(link, link.href);
  }
  function runLinkAction(link, shouldPreview) {
    if (!link || !link.isConnected) return;
    if (shouldPreview) {
      openLinkInPreview(link);
    } else {
      openLinkNormally(link);
    }
  }
  function shieldPreviewFromDoubleClick(link) {
    if (!previewContainer || !link || !link.isConnected) return;
    const linkRect = link.getBoundingClientRect();
    const winRect = previewContainer.getBoundingClientRect();
    const overlaps = !(linkRect.right < winRect.left || linkRect.left > winRect.right || linkRect.bottom < winRect.top || linkRect.top > winRect.bottom);
    if (!overlaps) return;
    const container = previewContainer;
    container.style.pointerEvents = "none";
    if (pointerShieldTimer) clearTimeout(pointerShieldTimer);
    pointerShieldTimer = setTimeout(() => {
      pointerShieldTimer = null;
      if (container === previewContainer) container.style.pointerEvents = "";
    }, 500);
  }
  function handleLinkClick(e) {
    if (!isPreviewEnabled()) return;
    syncClickMode();
    if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
      return;
    }
    const link = e.target.closest("a");
    if (!isPreviewableLink(link)) return;
    if (link.closest(".agy-preview-container")) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("javascript:") || href.startsWith("#") || href === "") {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (e.detail < 2) {
      if (clickTimer) clearTimeout(clickTimer);
      const shouldPreview = isSingleClickPreviewEnabled;
      const delay = shouldPreview && IS_TOP ? SINGLE_CLICK_PREVIEW_DELAY : CLICK_DELAY;
      clickTimer = setTimeout(() => {
        clickTimer = null;
        runLinkAction(link, shouldPreview);
        if (shouldPreview) shieldPreviewFromDoubleClick(link);
      }, delay);
    } else if (e.detail >= 2) {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      if (e.detail === 2) {
        if (pointerOpenedGesture) {
          pointerOpenedGesture = false;
          return;
        }
        runLinkAction(link, !isSingleClickPreviewEnabled);
      }
    }
  }
  function handleLinkDblClick(e) {
    if (!isPreviewEnabled()) return;
    pointerOpenedGesture = false;
    if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
      return;
    }
    const link = e.target.closest("a");
    if (!isPreviewableLink(link)) return;
    e.preventDefault();
    e.stopPropagation();
  }
  function cleanupAfterNextPaint(cleanup) {
    if (pageVisibilityController.getNativeVisibilityState() !== "visible") {
      setTimeout(cleanup, 0);
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(cleanup);
    });
  }
  function runAfterInteractionPaint(task) {
    cleanupAfterNextPaint(() => {
      try {
        if (window.scheduler && typeof window.scheduler.postTask === "function") {
          const scheduled = window.scheduler.postTask(task, { priority: "background" });
          if (scheduled && typeof scheduled.catch === "function") {
            scheduled.catch(() => {
            });
          }
          return;
        }
      } catch (e) {
      }
      setTimeout(task, 0);
    });
  }
  function scheduleHeavyCleanup(cleanup) {
    cleanupAfterNextPaint(() => {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(cleanup, { timeout: 250 });
      } else {
        setTimeout(cleanup, 0);
      }
    });
  }
  function shouldSuspendParentPage() {
    return Boolean(
      previewContainer && getSiteRule(location.href)?.powerSavePreview
    );
  }
  function applyParentPageActivity() {
    const shouldSuspend = shouldSuspendParentPage();
    if (shouldSuspend === isParentPageSuspended) return;
    if (pageVisibilityController.setSuspended(shouldSuspend, { deferNotification: true })) {
      isParentPageSuspended = shouldSuspend;
    }
  }
  function scheduleParentPageActivity() {
    const taskToken = ++parentActivityTaskToken;
    runAfterInteractionPaint(() => {
      if (taskToken !== parentActivityTaskToken) return;
      applyParentPageActivity();
    });
  }
  function postPreviewTabActivity(tab, isActive) {
    if (!tab || !tab.iframe || !tab.iframe.contentWindow || tab.closed) return;
    try {
      tab.iframe.contentWindow.postMessage({
        agyPreviewActivity: true,
        agyPreviewActive: Boolean(isActive),
        agyPreviewToken: tab.loadToken
      }, "*");
    } catch (e) {
    }
  }
  function isPreviewTabActive(tab) {
    return Boolean(
      tab && tab.id === activeTabId && pageVisibilityController.getNativeVisibilityState() === "visible"
    );
  }
  function syncPreviewTabActivity() {
    previewTabs.forEach((tab) => postPreviewTabActivity(tab, isPreviewTabActive(tab)));
  }
  function schedulePreviewTabActivity() {
    const taskToken = ++previewTabActivityTaskToken;
    runAfterInteractionPaint(() => {
      if (taskToken !== previewTabActivityTaskToken) return;
      syncPreviewTabActivity();
    });
  }
  function destroyPreview() {
    if (!previewContainer) return;
    const containerToRemove = previewContainer;
    const tabsToDispose = previewTabs.slice();
    const cachedLoadsToAbort = /* @__PURE__ */ new Map();
    tabsToDispose.forEach((tab) => {
      tab.closed = true;
      tab.loadToken = nextLoadToken++;
      const cached = cacheMap.get(tab.url);
      if (cached && cached.status === "loading") cachedLoadsToAbort.set(tab.url, cached);
    });
    containerToRemove.style.setProperty("visibility", "hidden", "important");
    containerToRemove.style.setProperty("display", "none", "important");
    containerToRemove.style.setProperty("opacity", "0", "important");
    containerToRemove.style.setProperty("pointer-events", "none", "important");
    containerToRemove.style.setProperty("transition", "none", "important");
    previewContainer = null;
    currentTargetUrl = "";
    previewTabs = [];
    activeTabId = null;
    previewTabActivityTaskToken += 1;
    scheduleParentPageActivity();
    closeBookmarkPanel();
    cleanupAfterNextPaint(() => {
      tabsToDispose.forEach((tab) => releasePreviewTabResources(tab));
      cachedLoadsToAbort.forEach((cached, url) => {
        const isStillNeeded = previewTabs.some((tab) => tab.url === url && (tab.loadState === "loading" || tab.loadState === "waiting-cache"));
        if (isStillNeeded) return;
        if (cached.xhr) {
          try {
            cached.xhr.abort();
          } catch (e) {
          }
        }
        if (cacheMap.get(url) === cached) {
          cacheMap.delete(url);
        }
      });
      if (containerToRemove.parentNode) {
        containerToRemove.parentNode.removeChild(containerToRemove);
      }
    });
  }
  function clearContentReadyTimer(tab) {
    if (!tab || !tab.contentReadyTimer) return;
    clearTimeout(tab.contentReadyTimer);
    tab.contentReadyTimer = null;
  }
  function showLoadingBar(tab) {
    if (tab?.pane) tab.pane.setAttribute("aria-busy", "false");
    if (tab) tab.loadingBar = null;
    return null;
  }
  function createErrorBar(tab, message) {
    if (!tab?.pane) return null;
    const bar = document.createElement("div");
    bar.className = "agy-loading-overlay";
    bar.setAttribute("role", "status");
    bar.setAttribute("aria-live", "polite");
    bar.innerHTML = `
            <div class="agy-loading-card">
                <div class="agy-loading-text"></div>
            </div>
        `;
    const textNode = bar.querySelector(".agy-loading-text");
    if (textNode) {
      textNode.textContent = `\u52A0\u8F7D\u51FA\u9519: ${message}`;
      textNode.style.color = "#ff3b30";
    }
    tab.pane.appendChild(bar);
    tab.loadingBar = bar;
    return bar;
  }
  function hideLoadingBar(bar, tab) {
    clearContentReadyTimer(tab);
    if (tab && tab.pane) tab.pane.setAttribute("aria-busy", "false");
    const b = bar || tab && tab.loadingBar;
    if (!b) return;
    if (tab && tab.loadingBar === b) tab.loadingBar = null;
    b.style.opacity = "0";
    setTimeout(() => {
      if (b.parentNode) b.parentNode.removeChild(b);
    }, 130);
  }
  function getFallbackTabTitle(url) {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname === "/" ? "" : parsed.pathname;
      return `${parsed.hostname}${path}`;
    } catch (e) {
      return url;
    }
  }
  function getActiveTab() {
    return previewTabs.find((tab) => tab.id === activeTabId) || null;
  }
  function getPreviewTab(tabId) {
    return previewTabs.find((tab) => tab.id === tabId) || null;
  }
  function createPreviewTab(url) {
    return {
      id: nextTabId++,
      url,
      title: getFallbackTabTitle(url),
      pane: null,
      iframe: null,
      request: null,
      loadingBar: null,
      contentReadyTimer: null,
      loadToken: nextLoadToken++,
      loadState: "idle",
      historyEntries: [url],
      historyIndex: 0,
      element: null,
      titleElement: null,
      closed: false
    };
  }
  function mountPreviewTab(tab) {
    if (!previewContainer || !tab || tab.pane) return;
    const body = previewContainer.querySelector(".agy-preview-body");
    if (!body) return;
    const pane = document.createElement("div");
    pane.className = "agy-preview-pane";
    pane.dataset.tabId = String(tab.id);
    pane.setAttribute("role", "tabpanel");
    const iframe = document.createElement("iframe");
    iframe.className = "agy-preview-iframe";
    iframe.name = `${PREVIEW_FRAME_PREFIX}${tab.loadToken}`;
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
    pane.appendChild(iframe);
    body.appendChild(pane);
    tab.pane = pane;
    tab.iframe = iframe;
  }
  function mountPreviewTabElement(tab) {
    if (!previewContainer || !tab || tab.element) return;
    const tabsElement = previewContainer.querySelector(".agy-preview-tabs");
    if (!tabsElement) return;
    const tabElement = document.createElement("div");
    tabElement.className = "agy-preview-tab";
    tabElement.dataset.tabId = String(tab.id);
    tabElement.setAttribute("role", "tab");
    const title = document.createElement("span");
    title.className = "agy-preview-tab-title";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "agy-preview-tab-close";
    close.innerHTML = ICON_CLOSE;
    close.title = "\u5173\u95ED\u6B64\u6807\u7B7E\u9875";
    close.setAttribute("aria-label", "\u5173\u95ED\u6B64\u6807\u7B7E\u9875");
    close.addEventListener("click", (e) => {
      e.stopPropagation();
      closePreviewTab(tab.id);
    });
    tabElement.appendChild(title);
    tabElement.appendChild(close);
    tabElement.addEventListener("click", () => activatePreviewTab(tab.id));
    tabsElement.appendChild(tabElement);
    tab.element = tabElement;
    tab.titleElement = title;
    updatePreviewTabElement(tab);
  }
  function updatePreviewTabElement(tab) {
    if (!tab || !tab.element) return;
    tab.element.title = `${tab.title}
${tab.url}`;
    if (tab.titleElement && tab.titleElement.textContent !== tab.title) {
      tab.titleElement.textContent = tab.title;
    }
  }
  function revealPreviewTab(tab) {
    if (!tab || !tab.element) return;
    requestAnimationFrame(() => {
      if (!tab.element || !tab.element.isConnected) return;
      const tabsElement = tab.element.parentElement;
      if (!tabsElement) return;
      const left = tab.element.offsetLeft;
      const right = left + tab.element.offsetWidth;
      if (left < tabsElement.scrollLeft) {
        tabsElement.scrollLeft = left;
      } else if (right > tabsElement.scrollLeft + tabsElement.clientWidth) {
        tabsElement.scrollLeft = right - tabsElement.clientWidth;
      }
    });
  }
  function isTabLoadCurrent(tab, token, url) {
    return Boolean(
      tab && !tab.closed && previewTabs.includes(tab) && tab.loadToken === token && tab.url === url && tab.iframe
    );
  }
  function cancelPreviewTabLoad(tab) {
    if (!tab) return;
    if (tab.iframe) {
      postPreviewTabActivity(tab, false);
    }
    tab.loadToken = nextLoadToken++;
    if (tab.request) {
      try {
        tab.request.abort();
      } catch (e) {
      }
      tab.request = null;
    }
    clearContentReadyTimer(tab);
    if (tab.iframe) tab.iframe.onload = null;
    if (tab.loadingBar) {
      tab.loadingBar.remove();
      tab.loadingBar = null;
    }
    if (tab.pane) tab.pane.setAttribute("aria-busy", "false");
  }
  function releasePreviewTabResources(tab) {
    if (!tab) return;
    cancelPreviewTabLoad(tab);
    if (tab.iframe) {
      try {
        tab.iframe.src = "about:blank";
      } catch (e) {
      }
      try {
        tab.iframe.removeAttribute("srcdoc");
      } catch (e) {
      }
    }
    if (tab.pane && tab.pane.parentNode) tab.pane.parentNode.removeChild(tab.pane);
    if (tab.element && tab.element.parentNode) tab.element.parentNode.removeChild(tab.element);
    tab.iframe = null;
    tab.pane = null;
    tab.element = null;
    tab.titleElement = null;
    tab.loadState = "closed";
  }
  function syncActiveTabChrome(shouldReveal = false) {
    const tab = getActiveTab();
    if (!previewContainer || !tab) return;
    currentTargetUrl = tab.url;
    const oldTabElement = previewContainer.querySelector(".agy-preview-tab.active");
    if (oldTabElement && oldTabElement !== tab.element) {
      oldTabElement.classList.remove("active");
      oldTabElement.setAttribute("aria-selected", "false");
    }
    if (tab.element) {
      tab.element.classList.add("active");
      tab.element.setAttribute("aria-selected", "true");
    }
    const oldPane = previewContainer.querySelector(".agy-preview-pane.active");
    if (oldPane && oldPane !== tab.pane) {
      oldPane.classList.remove("active");
      oldPane.setAttribute("aria-hidden", "true");
    }
    if (tab.pane) {
      tab.pane.classList.add("active");
      tab.pane.setAttribute("aria-hidden", "false");
    }
    schedulePreviewTabActivity();
    const openButton = previewContainer.querySelector(".agy-open-btn");
    if (openButton) openButton.href = tab.url;
    scheduleBookmarkButtonStateUpdate(tab.id);
    if (shouldReveal) revealPreviewTab(tab);
  }
  function updatePreviewTabTitle(tab, title) {
    const normalizedTitle = title && title.trim();
    if (!tab || tab.closed || !normalizedTitle) return;
    tab.title = normalizedTitle;
    updatePreviewTabElement(tab);
  }
  function loadPreviewTab(tab, options2 = {}) {
    if (!tab || !previewContainer || !tab.iframe || tab.closed) return;
    cancelPreviewTabLoad(tab);
    setPreviewFrameToken(tab.iframe, tab.loadToken);
    const token = tab.loadToken;
    const url = tab.url;
    tab.loadState = "loading";
    delete tab.iframe.dataset.loaded;
    tab.iframe.style.visibility = "visible";
    const bar = showLoadingBar(tab);
    const startOptions = { ...options2 };
    delete startOptions.deferStart;
    const beginLoad = () => {
      if (!isTabLoadCurrent(tab, token, url)) return;
      startLoad(tab, url, bar, token, startOptions);
    };
    if (options2.deferStart === true) {
      cleanupAfterNextPaint(beginLoad);
    } else {
      beginLoad();
    }
  }
  function hasPreviewContent(innerDoc) {
    if (!innerDoc || !innerDoc.body) return false;
    const renderedText = typeof innerDoc.body.innerText === "string" ? innerDoc.body.innerText : innerDoc.body.textContent || "";
    const text = renderedText.replace(/\s+/g, "");
    if (text.length >= 12) return true;
    return Boolean(innerDoc.body.querySelector('img[src], video, canvas, svg, article, main > *, [role="main"] > *'));
  }
  function pollPreviewContentReady(tab, url, token, attempt = 0) {
    if (!isTabLoadCurrent(tab, token, url) || tab.loadState === "loaded") return;
    try {
      if (hasPreviewContent(tab.iframe.contentDocument)) {
        revealLoadedPreviewTab(tab, token, url);
        return;
      }
    } catch (e) {
      return;
    }
    if (attempt >= 100) return;
    tab.contentReadyTimer = setTimeout(() => {
      tab.contentReadyTimer = null;
      pollPreviewContentReady(tab, url, token, attempt + 1);
    }, 100);
  }
  function addPreviewTab(url) {
    if (isImageUrl(url)) {
      showImageViewer(url);
      return;
    }
    const tab = createPreviewTab(url);
    previewTabs.push(tab);
    mountPreviewTab(tab);
    mountPreviewTabElement(tab);
    activeTabId = tab.id;
    syncActiveTabChrome(true);
    closeBookmarkPanel();
    loadPreviewTab(tab, { deferStart: true });
  }
  function activatePreviewTab(tabId) {
    if (tabId === activeTabId || !previewTabs.some((tab) => tab.id === tabId)) return;
    activeTabId = tabId;
    syncActiveTabChrome(true);
    closeBookmarkPanel();
  }
  function closePreviewTab(tabId) {
    const index = previewTabs.findIndex((tab2) => tab2.id === tabId);
    if (index < 0) return;
    if (previewTabs.length === 1) {
      destroyPreview();
      return;
    }
    const tab = previewTabs[index];
    const wasActive = activeTabId === tabId;
    tab.closed = true;
    tab.loadToken = nextLoadToken++;
    if (tab.pane) {
      tab.pane.style.visibility = "hidden";
      tab.pane.style.pointerEvents = "none";
    }
    if (tab.element) tab.element.style.display = "none";
    previewTabs.splice(index, 1);
    if (wasActive) {
      const nextTab = previewTabs[Math.min(index, previewTabs.length - 1)];
      activeTabId = nextTab.id;
      syncActiveTabChrome(true);
    } else {
      schedulePreviewTabActivity();
    }
    scheduleHeavyCleanup(() => releasePreviewTabResources(tab));
  }
  function navigatePreview(url, tabId = activeTabId, options2 = {}) {
    if (isImageUrl(url)) {
      showImageViewer(url);
      return;
    }
    const tab = getPreviewTab(tabId);
    if (!tab) return;
    if (!options2.fromHistory) {
      tab.historyEntries = tab.historyEntries.slice(0, tab.historyIndex + 1);
      if (tab.historyEntries[tab.historyEntries.length - 1] !== url) {
        tab.historyEntries.push(url);
      }
      tab.historyIndex = tab.historyEntries.length - 1;
    }
    tab.url = url;
    tab.title = getFallbackTabTitle(url);
    if (tab.id === activeTabId) {
      syncActiveTabChrome();
      if (!options2.keepBookmarkPanel) closeBookmarkPanel();
    } else {
      updatePreviewTabElement(tab);
    }
    loadPreviewTab(tab);
  }
  function movePreviewHistory(tab, direction) {
    if (!tab || tab.closed || direction !== -1 && direction !== 1) return false;
    const nextIndex = tab.historyIndex + direction;
    if (nextIndex < 0 || nextIndex >= tab.historyEntries.length) return false;
    tab.historyIndex = nextIndex;
    navigatePreview(tab.historyEntries[nextIndex], tab.id, { fromHistory: true });
    return true;
  }
  function refreshPreviewTab(tab) {
    if (!tab || tab.closed || tab.id !== activeTabId) return false;
    closeBookmarkPanel();
    loadPreviewTab(tab, { forceReload: true });
    return true;
  }
  function startLoad(tab, url, bar, token, options2 = {}) {
    if (!isTabLoadCurrent(tab, token, url)) return;
    if (shouldDirectLoad(url)) {
      renderDirectDynamicPage(tab, url, bar, token);
      return;
    }
    if (options2.forceReload) {
      loadPageImmediate(tab, url, bar, token, options2);
      return;
    }
    const cached = cacheMap.get(url);
    if (cached && cached.status === "image") {
      tab.loadState = "image";
      if (tab.id === activeTabId) showImageViewer(url);
      hideLoadingBar(bar, tab);
    } else if (cached && cached.status === "done") {
      const preparedHtml = ensurePreparedCacheEntry(url, cached);
      if (preparedHtml) renderFetchedDynamicPage(tab, preparedHtml, url, bar, token);
    } else if (cached && cached.status === "loading") {
      tab.loadState = "waiting-cache";
    } else {
      loadPageImmediate(tab, url, bar, token);
    }
  }
  function showPreviewWindow(linkElement, url) {
    previewContainer = document.createElement("div");
    previewContainer.className = "agy-preview-container";
    const container = previewContainer;
    const header = document.createElement("div");
    header.className = "agy-preview-header";
    const tabsElement = document.createElement("div");
    tabsElement.className = "agy-preview-tabs";
    tabsElement.setAttribute("role", "tablist");
    const actions = document.createElement("div");
    actions.className = "agy-preview-actions";
    const listBtn = document.createElement("button");
    listBtn.className = "agy-preview-btn agy-bm-list-btn";
    listBtn.title = "\u4E66\u7B7E\u5217\u8868";
    listBtn.innerHTML = ICON_LIST;
    listBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBookmarkPanel();
    });
    const bmBtn = document.createElement("button");
    bmBtn.className = "agy-preview-btn agy-bm-add-btn";
    bmBtn.title = "\u6536\u85CF\u5F53\u524D\u9875\u9762";
    bmBtn.innerHTML = ICON_BOOKMARK;
    bmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBookmark(bmBtn);
    });
    const openBtn = document.createElement("a");
    openBtn.className = "agy-preview-btn agy-open-btn";
    openBtn.href = url;
    openBtn.target = "_blank";
    openBtn.title = "\u65B0\u7A97\u53E3\u6253\u5F00";
    openBtn.innerHTML = ICON_EXTERNAL;
    openBtn.addEventListener("click", () => {
      setTimeout(destroyPreview, 0);
    });
    const refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.className = "agy-preview-btn agy-refresh-btn";
    refreshBtn.title = "\u5237\u65B0\u5F53\u524D\u9884\u89C8";
    refreshBtn.setAttribute("aria-label", refreshBtn.title);
    refreshBtn.innerHTML = ICON_REFRESH;
    refreshBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      refreshPreviewTab(getActiveTab());
    });
    const maximizeBtn = document.createElement("button");
    maximizeBtn.type = "button";
    maximizeBtn.className = "agy-maximize-btn";
    maximizeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePreviewMaximized();
    });
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "agy-close-btn";
    closeBtn.innerHTML = ICON_CLOSE;
    closeBtn.title = "\u5173\u95ED\u9884\u89C8 (Esc)";
    actions.appendChild(listBtn);
    actions.appendChild(bmBtn);
    actions.appendChild(openBtn);
    actions.appendChild(refreshBtn);
    actions.appendChild(maximizeBtn);
    actions.appendChild(closeBtn);
    header.appendChild(tabsElement);
    header.appendChild(actions);
    const body = document.createElement("div");
    body.className = "agy-preview-body";
    previewContainer.appendChild(header);
    previewContainer.appendChild(body);
    document.body.appendChild(previewContainer);
    previewTabs = [createPreviewTab(url)];
    activeTabId = previewTabs[0].id;
    mountPreviewTab(previewTabs[0]);
    mountPreviewTabElement(previewTabs[0]);
    syncActiveTabChrome();
    positionPreviewWindow(linkElement);
    applyPreviewMaximizedState();
    enablePreviewDragging(header);
    container.classList.add("agy-instant-feedback");
    container.classList.add("agy-preview-visible");
    cleanupAfterNextPaint(() => {
      if (container === previewContainer) container.classList.remove("agy-instant-feedback");
    });
    loadPreviewTab(previewTabs[0], { deferStart: true });
    scheduleParentPageActivity();
  }
  function loadPageImmediate(tab, url, loadingBar, token, options2 = {}) {
    let request = null;
    const requestOptions = {
      method: "GET",
      url,
      timeout: 1e4,
      onload: function(response) {
        if (!isTabLoadCurrent(tab, token, url) || tab.request !== request) return;
        tab.request = null;
        if (response.status >= 200 && response.status < 400) {
          if (isImageResponse(response)) {
            setCache(url, { status: "image", html: "", xhr: null, time: Date.now() });
            tab.loadState = "image";
            if (tab.id === activeTabId) showImageViewer(url);
            hideLoadingBar(loadingBar, tab);
            return;
          }
          const prepared = prepareDynamicHtml(response.responseText, url, TOKEN_PLACEHOLDER);
          setCache(url, {
            status: "done",
            html: prepared,
            xhr: null,
            time: Date.now()
          });
          renderFetchedDynamicPage(tab, prepared, url, loadingBar, token);
        } else {
          showError(tab, response.statusText || "\u52A0\u8F7D\u5931\u8D25");
        }
      },
      onerror: function() {
        if (!isTabLoadCurrent(tab, token, url) || tab.request !== request) return;
        tab.request = null;
        showError(tab, "\u7F51\u7EDC\u8FDE\u63A5\u51FA\u9519");
      }
    };
    if (options2.forceReload) {
      requestOptions.headers = {
        "Cache-Control": "no-cache",
        Pragma: "no-cache"
      };
    }
    request = GM_xmlhttpRequest(requestOptions);
    tab.request = request;
  }
  function prepareDynamicHtml(htmlString, baseUrl, token) {
    const parsed = new DOMParser().parseFromString(htmlString, "text/html");
    parsed.querySelectorAll("base").forEach((node) => node.remove());
    parsed.querySelectorAll("meta[http-equiv]").forEach((meta) => {
      const directive = (meta.getAttribute("http-equiv") || "").toLowerCase();
      if (directive === "content-security-policy" || directive === "refresh") meta.remove();
    });
    const base = parsed.createElement("base");
    base.href = baseUrl;
    parsed.head.prepend(base);
    const bridge = parsed.createElement("script");
    bridge.textContent = `
            (function() {
                if (window.__agyEmbeddedPreviewBridge) return;
                window.__agyEmbeddedPreviewBridge = true;
                var loadToken = ${token};
                var contentReadySent = false;
                var contentCheckScheduled = false;
                var contentObserver = null;
                var visibilityController = (${createPageVisibilityController.toString()})();
                window.addEventListener('message', function(e) {
                    var data = e.data;
                    if (
                        e.source !== window.parent
                        || !data
                        || data.agyPreviewActivity !== true
                        || data.agyPreviewToken !== loadToken
                    ) return;
                    if (visibilityController) {
                        visibilityController.setSuspended(data.agyPreviewActive !== true);
                    }
                });
                function isEditableTarget(target) {
                    return Boolean(target && target.closest && target.closest(
                        'input, textarea, select, [contenteditable="true"], [contenteditable=""], .CodeMirror, .monaco-editor'
                    ));
                }
                function hasMeaningfulContent() {
                    if (!document.body) return false;
                    var renderedText = typeof document.body.innerText === 'string'
                        ? document.body.innerText
                        : (document.body.textContent || '');
                    var text = renderedText.replace(/\\s+/g, '');
                    if (text.length >= 12) return true;
                    return Boolean(document.body.querySelector('img[src], video, canvas, svg, article, main > *, [role="main"] > *'));
                }
                function checkContentReady() {
                    contentCheckScheduled = false;
                    if (contentReadySent || !hasMeaningfulContent()) return;
                    contentReadySent = true;
                    if (contentObserver) contentObserver.disconnect();
                    window.parent.postMessage({
                        agyPreviewContentReady: true,
                        agyPreviewToken: loadToken
                    }, '*');
                }
                function scheduleContentReadyCheck() {
                    if (contentReadySent || contentCheckScheduled) return;
                    contentCheckScheduled = true;
                    setTimeout(checkContentReady, 50);
                }
                try {
                    contentObserver = new MutationObserver(scheduleContentReadyCheck);
                    contentObserver.observe(document.documentElement || document, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                } catch (e) {}
                document.addEventListener('DOMContentLoaded', scheduleContentReadyCheck, { once: true });
                document.addEventListener('click', function(e) {
                    var link = e.target && e.target.closest ? e.target.closest('a') : null;
                    if (!link) return;
                    var rawHref = link.getAttribute('href');
                    if (!rawHref || /^javascript:/i.test(rawHref) || rawHref.charAt(0) === '#') return;
                    var url = link.href;
                    if (!/^https?:/i.test(url)) return;
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    window.parent.postMessage({
                        agyPreviewNavigate: url,
                        agyPreviewToken: loadToken
                    }, '*');
                }, true);
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'F5' || e.code === 'F5' || e.keyCode === 116) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        if (!e.repeat) {
                            window.parent.postMessage({
                                agyPreviewRefresh: true,
                                agyPreviewToken: loadToken
                            }, '*');
                        }
                        return;
                    }
                    if (
                        (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')
                        || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey
                        || e.isComposing || isEditableTarget(e.target)
                    ) return;
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    window.parent.postMessage({
                        agyPreviewHistoryDirection: e.key === 'ArrowLeft' ? -1 : 1,
                        agyPreviewToken: loadToken
                    }, '*');
                }, true);
                window.addEventListener('load', scheduleContentReadyCheck, { once: true });
            })();
        `;
    base.after(bridge);
    const siteRule = getSiteRule(baseUrl);
    if (siteRule && siteRule.css) {
      const siteStyle = parsed.createElement("style");
      siteStyle.textContent = siteRule.css;
      parsed.head.appendChild(siteStyle);
    }
    return "<!doctype html>\n" + parsed.documentElement.outerHTML;
  }
  function handleDynamicPageLoaded(tab, baseUrl, loadingBar, token) {
    if (!isTabLoadCurrent(tab, token, baseUrl)) return;
    let canInspectDocument = false;
    let hasContent = false;
    try {
      const innerDoc = tab.iframe.contentDocument;
      canInspectDocument = Boolean(innerDoc);
      hasContent = hasPreviewContent(innerDoc);
      applySiteRuleToDocument(innerDoc, baseUrl);
      if (innerDoc && innerDoc.title) updatePreviewTabTitle(tab, innerDoc.title);
    } catch (e) {
    }
    if (!canInspectDocument || hasContent) {
      revealLoadedPreviewTab(tab, token, baseUrl, loadingBar);
    } else {
      pollPreviewContentReady(tab, baseUrl, token);
    }
    if (tab.id === activeTabId) updateBookmarkButtonState();
    postPreviewTabActivity(tab, isPreviewTabActive(tab));
  }
  function revealLoadedPreviewTab(tab, token, baseUrl, loadingBar) {
    if (!isTabLoadCurrent(tab, token, baseUrl)) return;
    tab.loadState = "loaded";
    tab.iframe.style.visibility = "visible";
    hideLoadingBar(loadingBar || tab.loadingBar, tab);
  }
  function applySiteRuleToDocument(innerDoc, url) {
    const rule = getSiteRule(url);
    if (!innerDoc || !rule || !rule.css) return;
    const existingStyle = innerDoc.getElementById("agy-site-rule-style");
    if (existingStyle) {
      if (existingStyle.textContent !== rule.css) existingStyle.textContent = rule.css;
      return;
    }
    const style = innerDoc.createElement("style");
    style.id = "agy-site-rule-style";
    style.textContent = rule.css;
    (innerDoc.head || innerDoc.documentElement).appendChild(style);
  }
  function setPreviewFrameToken(iframe, token) {
    const frameName = `${PREVIEW_FRAME_PREFIX}${token}`;
    iframe.name = frameName;
    try {
      iframe.contentWindow.name = frameName;
    } catch (e) {
    }
  }
  function renderDirectDynamicPage(tab, url, loadingBar, token) {
    if (!isTabLoadCurrent(tab, token, url)) return;
    const iframe = tab.iframe;
    iframe.dataset.loaded = "true";
    setPreviewFrameToken(iframe, token);
    iframe.onload = () => handleDynamicPageLoaded(tab, url, loadingBar, token);
    iframe.removeAttribute("srcdoc");
    iframe.src = url;
  }
  function renderFetchedDynamicPage(tab, preparedHtml, baseUrl, loadingBar, token) {
    if (!isTabLoadCurrent(tab, token, baseUrl)) return;
    const iframe = tab.iframe;
    tab.loadState = "loading";
    iframe.dataset.loaded = "true";
    setPreviewFrameToken(iframe, token);
    iframe.onload = () => handleDynamicPageLoaded(tab, baseUrl, loadingBar, token);
    iframe.srcdoc = preparedHtml.replace(new RegExp(TOKEN_PLACEHOLDER, "g"), String(token));
  }
  function showError(tab, msg) {
    if (!previewContainer || !tab || tab.closed) return;
    clearContentReadyTimer(tab);
    tab.loadState = "error";
    let bar = tab.loadingBar;
    if (!bar) bar = createErrorBar(tab, msg);
    if (!bar) return;
    if (tab.pane) tab.pane.setAttribute("aria-busy", "false");
    if (tab.iframe) tab.iframe.style.visibility = "hidden";
    const textNode = bar.querySelector(".agy-loading-text");
    if (textNode) {
      textNode.textContent = `\u52A0\u8F7D\u51FA\u9519: ${msg}`;
      textNode.style.color = "#ff3b30";
    }
    const spinner = bar.querySelector(".agy-spinner");
    if (spinner) {
      spinner.style.borderTopColor = "#ff3b30";
      spinner.style.animationPlayState = "paused";
    }
  }
  function clampPreviewPosition(left, top, container) {
    const width = container ? container.offsetWidth : Math.min(WINDOW_WIDTH, window.innerWidth - WINDOW_MARGIN * 2);
    const height = container ? container.offsetHeight : Math.min(WINDOW_HEIGHT, window.innerHeight - WINDOW_MARGIN * 2);
    const maxLeft = Math.max(WINDOW_MARGIN, window.innerWidth - width - WINDOW_MARGIN);
    const maxTop = Math.max(WINDOW_MARGIN, window.innerHeight - height - WINDOW_MARGIN);
    return {
      left: Math.round(Math.min(Math.max(left, WINDOW_MARGIN), maxLeft)),
      top: Math.round(Math.min(Math.max(top, WINDOW_MARGIN), maxTop))
    };
  }
  function applyPreviewPosition(container, position) {
    container.style.left = `${position.left}px`;
    container.style.top = `${position.top}px`;
  }
  function syncPreviewMaximizeButton() {
    if (!previewContainer) return;
    const button = previewContainer.querySelector(".agy-maximize-btn");
    if (!button) return;
    button.innerHTML = isPreviewMaximized ? ICON_RESTORE : ICON_MAXIMIZE;
    button.title = isPreviewMaximized ? "\u8FD8\u539F\u9884\u89C8\u7A97\u53E3" : "\u6700\u5927\u5316\u9884\u89C8\u7A97\u53E3";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(isPreviewMaximized));
  }
  function applyPreviewMaximizedState() {
    if (!previewContainer) return;
    previewContainer.classList.toggle("agy-maximized", isPreviewMaximized);
    syncPreviewMaximizeButton();
  }
  function togglePreviewMaximized() {
    if (!previewContainer) return;
    if (!isPreviewMaximized) {
      const rect = previewContainer.getBoundingClientRect();
      const position = clampPreviewPosition(rect.left, rect.top, previewContainer);
      applyPreviewPosition(previewContainer, position);
      savePreviewPosition(position);
    }
    isPreviewMaximized = !isPreviewMaximized;
    savePreviewMaximizedState(isPreviewMaximized);
    applyPreviewMaximizedState();
    if (!isPreviewMaximized) {
      const savedPosition = loadPreviewPosition();
      const position = clampPreviewPosition(
        savedPosition ? savedPosition.left : previewContainer.offsetLeft,
        savedPosition ? savedPosition.top : previewContainer.offsetTop,
        previewContainer
      );
      applyPreviewPosition(previewContainer, position);
      savePreviewPosition(position);
    }
    closeBookmarkPanel();
  }
  function enablePreviewDragging(header) {
    header.addEventListener("pointerdown", function(e) {
      if (e.button !== 0 || isPreviewMaximized || e.target.closest(".agy-preview-actions, .agy-preview-tab")) return;
      const container = header.closest(".agy-preview-container");
      if (!container || container !== previewContainer) return;
      const rect = container.getBoundingClientRect();
      const pointerId = e.pointerId;
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      e.preventDefault();
      e.stopPropagation();
      closeBookmarkPanel();
      container.classList.add("agy-preview-visible");
      container.classList.remove("agy-animating");
      container.classList.add("agy-dragging");
      try {
        header.setPointerCapture(pointerId);
      } catch (error) {
      }
      function move(event) {
        if (event.pointerId !== pointerId) return;
        const position = clampPreviewPosition(
          event.clientX - offsetX,
          event.clientY - offsetY,
          container
        );
        applyPreviewPosition(container, position);
      }
      function finish(event) {
        if (event.pointerId !== pointerId) return;
        header.removeEventListener("pointermove", move);
        header.removeEventListener("pointerup", finish);
        header.removeEventListener("pointercancel", finish);
        container.classList.remove("agy-dragging");
        try {
          header.releasePointerCapture(pointerId);
        } catch (error) {
        }
        const finalRect = container.getBoundingClientRect();
        const position = clampPreviewPosition(finalRect.left, finalRect.top, container);
        applyPreviewPosition(container, position);
        savePreviewPosition(position);
      }
      header.addEventListener("pointermove", move);
      header.addEventListener("pointerup", finish);
      header.addEventListener("pointercancel", finish);
    });
  }
  function positionPreviewWindow(targetElement) {
    if (!previewContainer) return;
    const savedPosition = loadPreviewPosition();
    if (savedPosition) {
      applyPreviewPosition(
        previewContainer,
        clampPreviewPosition(savedPosition.left, savedPosition.top, previewContainer)
      );
      return;
    }
    const rect = targetElement.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left;
    if (top + previewContainer.offsetHeight > window.innerHeight - WINDOW_MARGIN) {
      top = rect.top - WINDOW_HEIGHT - 8;
    }
    applyPreviewPosition(previewContainer, clampPreviewPosition(left, top, previewContainer));
  }
  function isSameOrigin(url) {
    try {
      return new URL(url).origin === window.location.origin;
    } catch (e) {
      return false;
    }
  }
  function openFromFrame(url, anchorRect) {
    if (!isPreviewEnabled() || !/^https?:/i.test(url)) return;
    if (options.isPreviewableUrl && !options.isPreviewableUrl(url, null)) return;
    if (isImageUrl(url)) {
      showImageViewer(url);
      return;
    }
    if (previewContainer) {
      addPreviewTab(url);
      return;
    }
    currentTargetUrl = url;
    const rect = anchorRect || { left: WINDOW_MARGIN, top: WINDOW_MARGIN, bottom: WINDOW_MARGIN };
    showPreviewWindow({ getBoundingClientRect: () => rect }, url);
  }
  function closeAndClearCache() {
    destroyPreview();
    if (preheatTimer) clearTimeout(preheatTimer);
    preheatTimer = null;
    preheatLink = null;
    cacheMap.forEach((entry) => {
      if (entry && entry.xhr) {
        try {
          entry.xhr.abort();
        } catch (e) {
        }
      }
    });
    cacheMap.clear();
  }
  return {
    openFromFrame,
    close: closeAndClearCache,
    syncClickMode
  };
}
export {
  installLinkHoverPreviewer
};
