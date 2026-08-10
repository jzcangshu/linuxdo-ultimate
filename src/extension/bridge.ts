import { applyStaticPageToolsConfig, readFramePageToolsConfig } from "../discourse/page-tools-config";

const frameName = window.name;
const role = frameName.startsWith("ldu-list:")
  ? "list"
  : frameName.startsWith("ldu-topic:") ? "topic" : null;

if (window.self !== window.top && role && !location.pathname.startsWith("/challenge")) {
  const attribute = role === "list" ? "lduEmbeddedList" : "lduEmbeddedTopic";
  document.documentElement.dataset[attribute] = "true";
  const initialPageToolsConfig = readFramePageToolsConfig(window.frameElement);
  if (initialPageToolsConfig) {
    applyStaticPageToolsConfig(document.documentElement, navigator, initialPageToolsConfig);
  }
  const bootstrapStyle = document.createElement("style");
  bootstrapStyle.id = "ldu-frame-bootstrap-style";
  bootstrapStyle.textContent = `
    html[data-ldu-embedded-list="true"] .d-header,
    html[data-ldu-embedded-list="true"] #d-sidebar,
    html[data-ldu-embedded-list="true"] .sidebar-wrapper,
    html[data-ldu-embedded-topic="true"] .d-header,
    html[data-ldu-embedded-topic="true"] #d-sidebar,
    html[data-ldu-embedded-topic="true"] .sidebar-wrapper { display: none !important; }

    html[data-ldu-hide-notices="true"] #global-notice-alert-global-notice,
    html[data-ldu-hide-posters="true"] #main-outlet .topic-list .posters,
    html[data-ldu-hide-category-badges="true"] #main-outlet .topic-list .badge-category__wrapper,
    html[data-ldu-hide-tags="true"] #main-outlet .topic-list a.discourse-tag { display: none !important; }

    html[data-ldu-low-end="true"] *,
    html[data-ldu-low-end="true"] *::before,
    html[data-ldu-low-end="true"] *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  `;
  document.documentElement.append(bootstrapStyle);
  const runtimeUrl = chrome.runtime.getURL("frame-runtime.js");
  void import(runtimeUrl).catch((error: unknown) => {
    bootstrapStyle.remove();
    delete document.documentElement.dataset[attribute];
    console.error("[Linux Do Ultimate] Frame runtime failed to load", error);
  });
}
