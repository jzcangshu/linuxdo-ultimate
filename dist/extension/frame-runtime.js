var _="linuxdo-ultimate-embedded-styles";var q=`
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

html[data-ldu-hide-notices="true"] #global-notice-alert-global-notice,
html[data-ldu-hide-posters="true"] #main-outlet .topic-list .posters,
html[data-ldu-hide-category-badges="true"] #main-outlet .topic-list .badge-category__wrapper,
html[data-ldu-hide-tags="true"] #main-outlet .topic-list a.discourse-tag {
  display: none !important;
}

html[data-ldu-low-end="true"] *,
html[data-ldu-low-end="true"] *::before,
html[data-ldu-low-end="true"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
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

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .ldu-owner-toggle,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .show-summary,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .top-replies {
  grid-column: 1 / -1 !important;
  width: 100% !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .reply-to-post,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button > button {
  width: 100% !important;
}
`;function A(a=document){let i=a.getElementById(_);if(i instanceof HTMLStyleElement)return i;let r=a.createElement("style");return r.id=_,r.textContent=q,(a.head??a.documentElement).append(r),r}function X(a){return a==="linux.do"||a.endsWith(".linux.do")?!0:globalThis.window?.__LDU_TEST_MODE__===!0&&(a==="localhost"||a==="127.0.0.1")}function f(a,i="https://linux.do/"){let r;try{r=new URL(a,i)}catch{return null}if(!X(r.hostname))return null;let l=r.pathname.split("/").filter(Boolean),d=l.findIndex(u=>u==="t"||u==="n");if(d<0)return null;let s=l.findIndex((u,g)=>g>d&&/^\d+$/.test(u));if(s<0)return null;let m=l[s+1]&&/^\d+$/.test(l[s+1])?Number(l[s+1]):void 0;return{url:r,topicId:l[s],...m?{postNumber:m}:{}}}function D(a,i){let r=f(a,i),l=f(i,i);return!!(r&&(!l||r.topicId!==l.topicId))}var $={ownerOnlyEnabled:!1,minimalHidePosters:!1,minimalHideNotices:!1,minimalHideCategoryBadges:!1,minimalHideTags:!1,lowEndOptimizationEnabled:!1},M=class{constructor(i={}){this.options=i;this.win=i.window??window,this.doc=i.document??document,this.lowEndDevice=J(this.win.navigator)}config={...$};active=!0;stopped=!1;ownerInstaller=null;ownerController=null;ownerLoad=null;win;doc;lowEndDevice;setConfig(i){if(this.stopped)return;let r={...this.config,...i};G(this.config,r)||(this.config=r,this.applyStaticModes(),this.syncOwnerView())}setActive(i){this.stopped||this.active===i||(this.active=i,this.syncOwnerView())}stop(){this.stopped||(this.stopped=!0,this.ownerController?.stop(),this.ownerController=null,delete this.doc.documentElement.dataset.lduHidePosters,delete this.doc.documentElement.dataset.lduHideNotices,delete this.doc.documentElement.dataset.lduHideCategoryBadges,delete this.doc.documentElement.dataset.lduHideTags,delete this.doc.documentElement.dataset.lduLowEnd)}applyStaticModes(){let i=this.doc.documentElement;z(i,"lduHidePosters",this.config.minimalHidePosters),z(i,"lduHideNotices",this.config.minimalHideNotices),z(i,"lduHideCategoryBadges",this.config.minimalHideCategoryBadges),z(i,"lduHideTags",this.config.minimalHideTags),z(i,"lduLowEnd",this.config.lowEndOptimizationEnabled&&this.lowEndDevice)}wantsOwnerView(){return this.active&&this.ownerViewConfigured()}ownerViewConfigured(){return this.options.allowOwnerView!==!1&&this.config.ownerOnlyEnabled&&typeof this.options.loadOwnerView=="function"}syncOwnerView(){if(!this.ownerViewConfigured()){this.ownerController?.stop(!0),this.ownerController=null;return}if(!this.active){this.ownerController?.setActive(!1);return}if(this.ownerController){this.ownerController.setActive(!0);return}if(this.ownerInstaller){this.installOwnerView(this.ownerInstaller);return}if(!this.ownerLoad)try{let i=this.options.loadOwnerView();if(!(i instanceof Promise)){this.ownerInstaller=i,this.installOwnerView(i);return}this.ownerLoad=i.then(r=>(this.ownerInstaller=r,this.wantsOwnerView()&&this.installOwnerView(r),r)).catch(r=>(console.error("[Linux Do Ultimate] Owner view runtime failed to load",r),null)).finally(()=>{this.ownerLoad=null})}catch(i){console.error("[Linux Do Ultimate] Owner view runtime failed to load",i)}}installOwnerView(i){!this.wantsOwnerView()||this.ownerController||(this.ownerController=i({window:this.win,document:this.doc,...this.options.isEmbedded!==void 0?{isEmbedded:this.options.isEmbedded}:{},...this.options.isSplitHost?{isSplitHost:this.options.isSplitHost}:{}}),this.ownerController.setActive(!0))}};function G(a,i){return a.ownerOnlyEnabled===i.ownerOnlyEnabled&&a.minimalHidePosters===i.minimalHidePosters&&a.minimalHideNotices===i.minimalHideNotices&&a.minimalHideCategoryBadges===i.minimalHideCategoryBadges&&a.minimalHideTags===i.minimalHideTags&&a.lowEndOptimizationEnabled===i.lowEndOptimizationEnabled}function z(a,i,r){let l=String(r);a.dataset[i]!==l&&(a.dataset[i]=l)}function J(a){let i=a.hardwareConcurrency,r=a.deviceMemory;return Number.isFinite(i)&&i<=4||typeof r=="number"&&Number.isFinite(r)&&r<=4}var U=300;function F(a={}){let i=window.name;if(i.startsWith("ldu-list:")){Q(i.slice(9),a);return}if(!i.startsWith("ldu-topic:"))return;let r=i.slice(10);document.documentElement.dataset.lduEmbeddedTopic="true",A(document);let l=new M({isEmbedded:!0,...a.loadOwnerView?{loadOwnerView:a.loadOwnerView}:{}}),d=null,s=null,m="",u=location.href,g=document.title,b=!1,w="double",k=!1,c=null,h=!1,p=t=>{h&&t==="ldu:frame-state"||(d!==null&&window.clearTimeout(d),s=t,d=window.setTimeout(()=>{if(d=null,s=null,h&&t==="ldu:frame-state")return;let e={type:t,tabId:r};(t==="ldu:frame-ready"||m!==location.href)&&(m=location.href,e.url=location.href,e.title=document.title),window.parent.postMessage(e,location.origin)},t==="ldu:frame-ready"?0:120))};window.addEventListener("scroll",()=>{m!==location.href&&p("ldu:frame-state")},{passive:!0}),window.addEventListener("load",()=>p("ldu:frame-ready"),{once:!0}),document.addEventListener("DOMContentLoaded",()=>p("ldu:frame-ready"),{once:!0}),window.addEventListener("popstate",()=>p("ldu:frame-state"));let E=new MutationObserver(()=>{if(h)return;let t=u!==location.href,e=g!==document.title;!t&&!e||(u=location.href,g=document.title,p("ldu:frame-state"))}),O=()=>E.observe(document.documentElement,{childList:!0,subtree:!0});O();let x=()=>{c!==null&&window.clearTimeout(c),c=null},T=new Set,H=new Set,V=()=>{for(let e of document.querySelectorAll("audio, video"))if(!(e.paused||e.ended)){T.add(e);try{e.pause()}catch{}}let t=document;for(let e of t.getAnimations?.()??[])if(e.playState==="running"){H.add(e);try{e.pause()}catch{}}},o=()=>{for(let t of T)if(t.isConnected)try{t.play().catch(()=>{})}catch{}T.clear();for(let t of H)try{t.play()}catch{}H.clear()},n=t=>{if(h!==t){if(h=t,l.setActive(!t),t){document.documentElement.dataset.lduSoftFrozen="true",d!==null&&s==="ldu:frame-state"&&(window.clearTimeout(d),d=null,s=null),x(),E.disconnect(),V();return}delete document.documentElement.dataset.lduSoftFrozen,u=location.href,g=document.title,O(),o(),p("ldu:frame-state")}},v=t=>{let e=t instanceof Element?t.closest("a[href]"):null;return!e||!/^https?:/i.test(e.href)||f(e.href)||new URL(e.href,location.href).origin===location.origin||t instanceof Element&&t.closest("img, picture, .lightbox-wrapper")||e.matches(".lightbox")||e.querySelector("img, picture")||e.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:e},j=t=>{let e=t instanceof Element?t.closest("a[href]"):null;return!e||!D(e.href,location.href)||e.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:e},W=t=>{let e=t instanceof Element?t.closest("a[href]"):null;return!e||!/^https?:/i.test(e.href)||new URL(e.href,location.href).origin!==location.origin||f(e.href)||e.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:e},K=t=>{let e=f(t.href,location.href);window.parent.postMessage({type:"ldu:topic-open",tabId:r,url:t.href,title:t.textContent?.trim()||(e?`\u4E3B\u9898 ${e.topicId}`:""),...e?.postNumber?{postNumber:e.postNumber}:{}},location.origin)},B=t=>{let e=t.getBoundingClientRect();window.parent.postMessage({type:"ldu:preview-open",tabId:r,url:t.href,anchorRect:{left:e.left,top:e.top,right:e.right,bottom:e.bottom,width:e.width,height:e.height}},location.origin)},N=t=>t.button===0&&!t.ctrlKey&&!t.metaKey&&!t.shiftKey&&!t.altKey;window.addEventListener("message",t=>{if(t.source!==window.parent||t.origin!==location.origin)return;let e=t.data;if(e?.type==="ldu:frame-lifecycle"){n(e.active!==!0);return}if(e?.type==="ldu:bookmark"){let C=typeof e.topicId=="string"&&/^\d+$/.test(e.topicId)?e.topicId:null,y=document.querySelector('meta[name="csrf-token"]')?.content;if(!C||!y){window.parent.postMessage({type:"ldu:bookmark-result",tabId:r,ok:!1,message:"\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"},location.origin);return}let Y=new URLSearchParams({bookmarkable_type:"Topic",bookmarkable_id:C});fetch("/bookmarks.json",{method:"POST",credentials:"same-origin",headers:{Accept:"application/json","Content-Type":"application/x-www-form-urlencoded; charset=UTF-8","X-CSRF-Token":y,"X-Requested-With":"XMLHttpRequest"},body:Y}).then(async L=>{if(!L.ok){let R="\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25";try{let I=await L.json();Array.isArray(I.errors)&&typeof I.errors[0]=="string"&&(R=I.errors[0])}catch{}throw new Error(R)}window.parent.postMessage({type:"ldu:bookmark-result",tabId:r,ok:!0,message:"\u5DF2\u6DFB\u52A0\u5230\u4E66\u7B7E"},location.origin)}).catch(L=>{window.parent.postMessage({type:"ldu:bookmark-result",tabId:r,ok:!1,message:L instanceof Error&&L.message?L.message:"\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"},location.origin)});return}if(e?.type==="ldu:page-tools-config"){l.setConfig({ownerOnlyEnabled:e.ownerOnlyEnabled===!0,minimalHidePosters:e.minimalHidePosters===!0,minimalHideNotices:e.minimalHideNotices===!0,minimalHideCategoryBadges:e.minimalHideCategoryBadges===!0,minimalHideTags:e.minimalHideTags===!0,lowEndOptimizationEnabled:e.lowEndOptimizationEnabled===!0});return}e?.type==="ldu:preview-config"&&(b=e.enabled===!0,w=e.clickMode==="single"?"single":"double",b||x())}),document.addEventListener("pointerdown",t=>{window.parent.postMessage({type:"ldu:frame-interaction",tabId:r},location.origin),b&&w==="double"&&t.detail>=2&&x()},!0);let P=null,S=()=>{P===null&&(window.parent.postMessage({type:"ldu:frame-interaction",tabId:r},location.origin),P=window.setTimeout(()=>{P=null},120))};window.addEventListener("wheel",S,{passive:!0,capture:!0}),window.addEventListener("touchstart",S,{passive:!0,capture:!0}),document.addEventListener("keydown",t=>{["ArrowDown","ArrowUp","PageDown","PageUp","Home","End","Space"].includes(t.key)&&S()},!0),document.addEventListener("click",t=>{if(k||!N(t))return;let e=j(t.target);if(e){t.preventDefault(),t.stopImmediatePropagation(),K(e);return}let C=W(t.target);if(C){t.preventDefault(),t.stopImmediatePropagation(),window.parent.postMessage({type:"ldu:list-navigate",tabId:r,url:C.href},location.origin);return}if(!b)return;let y=v(t.target);if(y){if(t.preventDefault(),t.stopImmediatePropagation(),w==="single"){B(y);return}x(),!(t.detail>=2)&&(c=window.setTimeout(()=>{if(c=null,!!y.isConnected){k=!0;try{y.click()}finally{k=!1}}},U))}},!0),document.addEventListener("dblclick",t=>{if(!b||w!=="double"||!N(t))return;let e=v(t.target);e&&(x(),t.preventDefault(),t.stopImmediatePropagation(),B(e))},!0),document.addEventListener("keydown",t=>{!b||t.key!=="Escape"||window.parent.postMessage({type:"ldu:preview-dismiss",tabId:r},location.origin)},!0),p("ldu:frame-ready")}function Q(a,i){document.documentElement.dataset.lduEmbeddedList="true",A(document);let r=new M({isEmbedded:!0,allowOwnerView:!1,...i.loadOwnerView?{loadOwnerView:i.loadOwnerView}:{}}),l=null,d=null,s=!1,m=null,u=!1,g="double",b=!1,w="",k="",c=o=>{l!==null&&window.clearTimeout(l),l=window.setTimeout(()=>{l=null;let n={type:o,frameId:a,url:location.href,title:document.title,scrollY:window.scrollY};w=location.href,k=document.title,window.parent.postMessage(n,location.origin)},o==="ldu:list-ready"?0:100)},h=()=>{if(document.readyState==="loading")return!1;let o=document.querySelector("#main-outlet");return o?[...o.children].some(n=>!n.matches(".loading-container, .spinner, .spinner-container, .loading-indicator")):!1},p=()=>{s||m!==null||!h()||(m=window.setTimeout(()=>{m=null,!(s||!h())&&(s=!0,window.parent.postMessage({type:"ldu:list-visual-ready",frameId:a,url:location.href,title:document.title,scrollY:window.scrollY},location.origin))},0))},E=()=>{d!==null&&window.clearTimeout(d),d=null},O=o=>o.button===0&&!o.ctrlKey&&!o.metaKey&&!o.shiftKey&&!o.altKey,x=o=>{let n=o instanceof Element?o.closest("a[href]"):null;return!n||!D(n.href,location.href)||n.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:n},T=o=>{let n=o instanceof Element?o.closest("a[href]"):null;return!n||!/^https?:/i.test(n.href)||f(n.href)||new URL(n.href,location.href).origin===location.origin||o instanceof Element&&o.closest("img, picture, .lightbox-wrapper")||n.matches(".lightbox")||n.querySelector("img, picture")||n.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:n},H=o=>{let n=f(o.href,location.href);window.parent.postMessage({type:"ldu:list-topic-open",frameId:a,url:o.href,topicId:n?.topicId,postNumber:n?.postNumber,topicTitle:o.textContent?.trim()||(n?`\u4E3B\u9898 ${n.topicId}`:"")},location.origin)},V=o=>{let n=o.getBoundingClientRect();window.parent.postMessage({type:"ldu:list-preview-open",frameId:a,url:o.href,anchorRect:{left:n.left,top:n.top,right:n.right,bottom:n.bottom,width:n.width,height:n.height}},location.origin)};window.addEventListener("message",o=>{if(o.source!==window.parent||o.origin!==location.origin)return;let n=o.data;if(n?.type==="ldu:page-tools-config"){r.setConfig({ownerOnlyEnabled:n.ownerOnlyEnabled===!0,minimalHidePosters:n.minimalHidePosters===!0,minimalHideNotices:n.minimalHideNotices===!0,minimalHideCategoryBadges:n.minimalHideCategoryBadges===!0,minimalHideTags:n.minimalHideTags===!0,lowEndOptimizationEnabled:n.lowEndOptimizationEnabled===!0});return}n?.type==="ldu:preview-config"&&(u=n.enabled===!0,g=n.clickMode==="single"?"single":"double",u||E())}),window.addEventListener("scroll",()=>c("ldu:list-state"),{passive:!0}),window.addEventListener("load",()=>{c("ldu:list-ready"),p()},{once:!0}),document.addEventListener("DOMContentLoaded",()=>{c("ldu:list-ready"),p()},{once:!0}),window.addEventListener("popstate",()=>c("ldu:list-state")),window.addEventListener("hashchange",()=>c("ldu:list-state")),document.addEventListener("pointerdown",()=>{window.parent.postMessage({type:"ldu:list-interaction",frameId:a},location.origin)},!0),new MutationObserver(()=>{p(),!(w===location.href&&k===document.title)&&c("ldu:list-state")}).observe(document.documentElement,{childList:!0,subtree:!0}),document.addEventListener("click",o=>{if(b||!O(o))return;let n=x(o.target);if(n){o.preventDefault(),o.stopImmediatePropagation(),H(n);return}if(!u)return;let v=T(o.target);if(v){if(o.preventDefault(),o.stopImmediatePropagation(),g==="single"){V(v);return}E(),!(o.detail>=2)&&(d=window.setTimeout(()=>{if(d=null,!!v.isConnected){b=!0;try{v.click()}finally{b=!1}}},U))}},!0),document.addEventListener("dblclick",o=>{if(!u||g!=="double"||!O(o))return;let n=T(o.target);n&&(E(),o.preventDefault(),o.stopImmediatePropagation(),V(n))},!0),document.addEventListener("keydown",o=>{o.key==="Escape"&&window.parent.postMessage({type:"ldu:list-preview-dismiss",frameId:a},location.origin)},!0),c("ldu:list-ready"),p()}F({loadOwnerView:async()=>(await import(chrome.runtime.getURL("topic-tools-runtime.js"))).installOwnerView});document.getElementById("ldu-frame-bootstrap-style")?.remove();
