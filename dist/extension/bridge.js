"use strict";(()=>{function n(t){if(!(t instanceof HTMLElement))return null;let i=t.dataset.lduPageTools;if(!i)return null;try{let e=JSON.parse(i);return!e||typeof e!="object"?null:{ownerOnlyEnabled:e.ownerOnlyEnabled===!0,minimalHidePosters:e.minimalHidePosters===!0,minimalHideNotices:e.minimalHideNotices===!0,minimalHideCategoryBadges:e.minimalHideCategoryBadges===!0,minimalHideTags:e.minimalHideTags===!0,lowEndOptimizationEnabled:e.lowEndOptimizationEnabled===!0}}catch{return null}}function d(t,i,e){a(t,"lduHidePosters",e.minimalHidePosters),a(t,"lduHideNotices",e.minimalHideNotices),a(t,"lduHideCategoryBadges",e.minimalHideCategoryBadges),a(t,"lduHideTags",e.minimalHideTags),a(t,"lduLowEnd",e.lowEndOptimizationEnabled&&r(i))}function a(t,i,e){let o=String(e);t.dataset[i]!==o&&(t.dataset[i]=o)}function r(t){let i=t.hardwareConcurrency,e=t.deviceMemory;return Number.isFinite(i)&&i<=4||typeof e=="number"&&Number.isFinite(e)&&e<=4}var l=window.name,m=l.startsWith("ldu-list:")?"list":l.startsWith("ldu-topic:")?"topic":null;if(window.self!==window.top&&m&&!location.pathname.startsWith("/challenge")){let t=m==="list"?"lduEmbeddedList":"lduEmbeddedTopic";document.documentElement.dataset[t]="true";let i=n(window.frameElement);i&&d(document.documentElement,navigator,i);let e=document.createElement("style");e.id="ldu-frame-bootstrap-style",e.textContent=`
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
  `,document.documentElement.append(e),import(chrome.runtime.getURL("frame-runtime.js")).catch(s=>{e.remove(),delete document.documentElement.dataset[t],console.error("[Linux Do Ultimate] Frame runtime failed to load",s)})}})();
