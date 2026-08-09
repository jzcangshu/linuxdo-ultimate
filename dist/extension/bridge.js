"use strict";(()=>{var d=window.name,a=d.startsWith("ldu-list:")?"list":d.startsWith("ldu-topic:")?"topic":null;if(window.self!==window.top&&a&&!location.pathname.startsWith("/challenge")){let t=a==="list"?"lduEmbeddedList":"lduEmbeddedTopic";document.documentElement.dataset[t]="true";let e=document.createElement("style");e.id="ldu-frame-bootstrap-style",e.textContent=`
    html[data-ldu-embedded-list="true"] .d-header,
    html[data-ldu-embedded-list="true"] #d-sidebar,
    html[data-ldu-embedded-list="true"] .sidebar-wrapper,
    html[data-ldu-embedded-topic="true"] .d-header,
    html[data-ldu-embedded-topic="true"] #d-sidebar,
    html[data-ldu-embedded-topic="true"] .sidebar-wrapper { display: none !important; }
  `,document.documentElement.append(e),import(chrome.runtime.getURL("frame-runtime.js")).catch(l=>{e.remove(),delete document.documentElement.dataset[t],console.error("[Linux Do Ultimate] Frame runtime failed to load",l)})}})();
