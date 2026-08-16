"use strict";(()=>{function n(t){if(!(t instanceof HTMLElement))return null;let a=t.dataset.lduPageTools;if(!a)return null;try{let e=JSON.parse(a);return!e||typeof e!="object"?null:{ownerOnlyEnabled:e.ownerOnlyEnabled===!0,minimalHidePosters:e.minimalHidePosters===!0,minimalHideNotices:e.minimalHideNotices===!0,minimalHideCategoryBadges:e.minimalHideCategoryBadges===!0,minimalHideTags:e.minimalHideTags===!0,lowEndOptimizationEnabled:e.lowEndOptimizationEnabled===!0,base64Enabled:e.base64Enabled!==!1}}catch{return null}}function d(t,a,e){i(t,"lduHidePosters",e.minimalHidePosters),i(t,"lduHideNotices",e.minimalHideNotices),i(t,"lduHideCategoryBadges",e.minimalHideCategoryBadges),i(t,"lduHideTags",e.minimalHideTags),i(t,"lduLowEnd",e.lowEndOptimizationEnabled&&r(a))}function i(t,a,e){let o=String(e);t.dataset[a]!==o&&(t.dataset[a]=o)}function r(t){let a=t.hardwareConcurrency,e=t.deviceMemory;return Number.isFinite(a)&&a<=4||typeof e=="number"&&Number.isFinite(e)&&e<=4}var l=window.name,s=l.startsWith("ldu-list:")?"list":l.startsWith("ldu-topic:")?"topic":null;if(window.self!==window.top&&s&&!location.pathname.startsWith("/challenge")){let t=s==="list"?"lduEmbeddedList":"lduEmbeddedTopic";document.documentElement.dataset[t]="true";let a=n(window.frameElement);a&&d(document.documentElement,navigator,a);let e=document.createElement("style");e.id="ldu-frame-bootstrap-style",e.textContent=`
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
  `,document.documentElement.append(e),import(chrome.runtime.getURL("frame-runtime.js")).catch(m=>{e.remove(),delete document.documentElement.dataset[t],console.error("[Linux Do Ultimate] Frame runtime failed to load",m)})}})();
