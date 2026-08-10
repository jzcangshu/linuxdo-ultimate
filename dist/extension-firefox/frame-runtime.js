var R="linuxdo-ultimate-embedded-styles";var Z=`
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
`;function A(n=document){let o=n.getElementById(R);if(o instanceof HTMLStyleElement)return o;let i=n.createElement("style");return i.id=R,i.textContent=Z,(n.head??n.documentElement).append(i),i}function tt(n){return n==="linux.do"||n.endsWith(".linux.do")?!0:globalThis.window?.__LDU_TEST_MODE__===!0&&(n==="localhost"||n==="127.0.0.1")}function f(n,o="https://linux.do/"){let i;try{i=new URL(n,o)}catch{return null}if(!tt(i.hostname))return null;let l=i.pathname.split("/").filter(Boolean),d=l.findIndex(u=>u==="t"||u==="n");if(d<0)return null;let s=l.findIndex((u,g)=>g>d&&/^\d+$/.test(u));if(s<0)return null;let m=l[s+1]&&/^\d+$/.test(l[s+1])?Number(l[s+1]):void 0;return{url:i,topicId:l[s],...m?{postNumber:m}:{}}}function D(n,o){let i=f(n,o),l=f(o,o);return!!(i&&(!l||i.topicId!==l.topicId))}var F={ownerOnlyEnabled:!1,minimalHidePosters:!1,minimalHideNotices:!1,minimalHideCategoryBadges:!1,minimalHideTags:!1,lowEndOptimizationEnabled:!1};function U(n){if(!(n instanceof HTMLElement))return null;let o=n.dataset.lduPageTools;if(!o)return null;try{let i=JSON.parse(o);return!i||typeof i!="object"?null:{ownerOnlyEnabled:i.ownerOnlyEnabled===!0,minimalHidePosters:i.minimalHidePosters===!0,minimalHideNotices:i.minimalHideNotices===!0,minimalHideCategoryBadges:i.minimalHideCategoryBadges===!0,minimalHideTags:i.minimalHideTags===!0,lowEndOptimizationEnabled:i.lowEndOptimizationEnabled===!0}}catch{return null}}function j(n,o,i){P(n,"lduHidePosters",i.minimalHidePosters),P(n,"lduHideNotices",i.minimalHideNotices),P(n,"lduHideCategoryBadges",i.minimalHideCategoryBadges),P(n,"lduHideTags",i.minimalHideTags),P(n,"lduLowEnd",i.lowEndOptimizationEnabled&&et(o))}function W(n,o){return n.ownerOnlyEnabled===o.ownerOnlyEnabled&&n.minimalHidePosters===o.minimalHidePosters&&n.minimalHideNotices===o.minimalHideNotices&&n.minimalHideCategoryBadges===o.minimalHideCategoryBadges&&n.minimalHideTags===o.minimalHideTags&&n.lowEndOptimizationEnabled===o.lowEndOptimizationEnabled}function P(n,o,i){let l=String(i);n.dataset[o]!==l&&(n.dataset[o]=l)}function et(n){let o=n.hardwareConcurrency,i=n.deviceMemory;return Number.isFinite(o)&&o<=4||typeof i=="number"&&Number.isFinite(i)&&i<=4}var z=class{constructor(o={}){this.options=o;this.win=o.window??window,this.doc=o.document??document}config={...F};active=!0;stopped=!1;ownerInstaller=null;ownerController=null;ownerLoad=null;win;doc;setConfig(o){if(this.stopped)return;let i={...this.config,...o};W(this.config,i)||(this.config=i,this.applyStaticModes(),this.syncOwnerView())}setActive(o){this.stopped||this.active===o||(this.active=o,this.syncOwnerView())}stop(){this.stopped||(this.stopped=!0,this.ownerController?.stop(),this.ownerController=null,delete this.doc.documentElement.dataset.lduHidePosters,delete this.doc.documentElement.dataset.lduHideNotices,delete this.doc.documentElement.dataset.lduHideCategoryBadges,delete this.doc.documentElement.dataset.lduHideTags,delete this.doc.documentElement.dataset.lduLowEnd)}applyStaticModes(){j(this.doc.documentElement,this.win.navigator,this.config)}wantsOwnerView(){return this.active&&this.ownerViewConfigured()}ownerViewConfigured(){return this.options.allowOwnerView!==!1&&this.config.ownerOnlyEnabled&&typeof this.options.loadOwnerView=="function"}syncOwnerView(){if(!this.ownerViewConfigured()){this.ownerController?.stop(!0),this.ownerController=null;return}if(!this.active){this.ownerController?.setActive(!1);return}if(this.ownerController){this.ownerController.setActive(!0);return}if(this.ownerInstaller){this.installOwnerView(this.ownerInstaller);return}if(!this.ownerLoad)try{let o=this.options.loadOwnerView();if(!(o instanceof Promise)){this.ownerInstaller=o,this.installOwnerView(o);return}this.ownerLoad=o.then(i=>(this.ownerInstaller=i,this.wantsOwnerView()&&this.installOwnerView(i),i)).catch(i=>(console.error("[Linux Do Ultimate] Owner view runtime failed to load",i),null)).finally(()=>{this.ownerLoad=null})}catch(o){console.error("[Linux Do Ultimate] Owner view runtime failed to load",o)}}installOwnerView(o){!this.wantsOwnerView()||this.ownerController||(this.ownerController=o({window:this.win,document:this.doc,...this.options.isEmbedded!==void 0?{isEmbedded:this.options.isEmbedded}:{},...this.options.isSplitHost?{isSplitHost:this.options.isSplitHost}:{}}),this.ownerController.setActive(!0))}};var K=300;function Y(n={}){let o=window.name;if(o.startsWith("ldu-list:")){it(o.slice(9),n);return}if(!o.startsWith("ldu-topic:"))return;let i=o.slice(10);document.documentElement.dataset.lduEmbeddedTopic="true",A(document);let l=new z({isEmbedded:!0,...n.loadOwnerView?{loadOwnerView:n.loadOwnerView}:{}});n.initialPageToolsConfig&&l.setConfig(n.initialPageToolsConfig);let d=null,s=null,m="",u=location.href,g=document.title,b=!1,w="double",k=!1,c=null,h=!1,p=t=>{h&&t==="ldu:frame-state"||(d!==null&&window.clearTimeout(d),s=t,d=window.setTimeout(()=>{if(d=null,s=null,h&&t==="ldu:frame-state")return;let e={type:t,tabId:i};(t==="ldu:frame-ready"||m!==location.href)&&(m=location.href,e.url=location.href,e.title=document.title),window.parent.postMessage(e,location.origin)},t==="ldu:frame-ready"?0:120))};window.addEventListener("scroll",()=>{m!==location.href&&p("ldu:frame-state")},{passive:!0}),window.addEventListener("load",()=>p("ldu:frame-ready"),{once:!0}),document.addEventListener("DOMContentLoaded",()=>p("ldu:frame-ready"),{once:!0}),window.addEventListener("popstate",()=>p("ldu:frame-state"));let E=new MutationObserver(()=>{if(h)return;let t=u!==location.href,e=g!==document.title;!t&&!e||(u=location.href,g=document.title,p("ldu:frame-state"))}),L=()=>E.observe(document.documentElement,{childList:!0,subtree:!0});L();let x=()=>{c!==null&&window.clearTimeout(c),c=null},T=new Set,C=new Set,M=()=>{for(let e of document.querySelectorAll("audio, video"))if(!(e.paused||e.ended)){T.add(e);try{e.pause()}catch{}}let t=document;for(let e of t.getAnimations?.()??[])if(e.playState==="running"){C.add(e);try{e.pause()}catch{}}},r=()=>{for(let t of T)if(t.isConnected)try{t.play().catch(()=>{})}catch{}T.clear();for(let t of C)try{t.play()}catch{}C.clear()},a=t=>{if(h!==t){if(h=t,l.setActive(!t),t){document.documentElement.dataset.lduSoftFrozen="true",d!==null&&s==="ldu:frame-state"&&(window.clearTimeout(d),d=null,s=null),x(),E.disconnect(),M();return}delete document.documentElement.dataset.lduSoftFrozen,u=location.href,g=document.title,L(),r(),p("ldu:frame-state")}},y=t=>{let e=t instanceof Element?t.closest("a[href]"):null;return!e||!/^https?:/i.test(e.href)||f(e.href)||new URL(e.href,location.href).origin===location.origin||t instanceof Element&&t.closest("img, picture, .lightbox-wrapper")||e.matches(".lightbox")||e.querySelector("img, picture")||e.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:e},$=t=>{let e=t instanceof Element?t.closest("a[href]"):null;return!e||!D(e.href,location.href)||e.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:e},G=t=>{let e=t instanceof Element?t.closest("a[href]"):null;return!e||!/^https?:/i.test(e.href)||new URL(e.href,location.href).origin!==location.origin||f(e.href)||e.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:e},J=t=>{let e=f(t.href,location.href);window.parent.postMessage({type:"ldu:topic-open",tabId:i,url:t.href,title:t.textContent?.trim()||(e?`\u4E3B\u9898 ${e.topicId}`:""),...e?.postNumber?{postNumber:e.postNumber}:{}},location.origin)},N=t=>{let e=t.getBoundingClientRect();window.parent.postMessage({type:"ldu:preview-open",tabId:i,url:t.href,anchorRect:{left:e.left,top:e.top,right:e.right,bottom:e.bottom,width:e.width,height:e.height}},location.origin)},_=t=>t.button===0&&!t.ctrlKey&&!t.metaKey&&!t.shiftKey&&!t.altKey;window.addEventListener("message",t=>{if(t.source!==window.parent||t.origin!==location.origin)return;let e=t.data;if(e?.type==="ldu:frame-lifecycle"){a(e.active!==!0);return}if(e?.type==="ldu:bookmark"){let H=typeof e.topicId=="string"&&/^\d+$/.test(e.topicId)?e.topicId:null,v=document.querySelector('meta[name="csrf-token"]')?.content;if(!H||!v){window.parent.postMessage({type:"ldu:bookmark-result",tabId:i,ok:!1,message:"\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"},location.origin);return}let Q=new URLSearchParams({bookmarkable_type:"Topic",bookmarkable_id:H});fetch("/bookmarks.json",{method:"POST",credentials:"same-origin",headers:{Accept:"application/json","Content-Type":"application/x-www-form-urlencoded; charset=UTF-8","X-CSRF-Token":v,"X-Requested-With":"XMLHttpRequest"},body:Q}).then(async O=>{if(!O.ok){let B="\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25";try{let I=await O.json();Array.isArray(I.errors)&&typeof I.errors[0]=="string"&&(B=I.errors[0])}catch{}throw new Error(B)}window.parent.postMessage({type:"ldu:bookmark-result",tabId:i,ok:!0,message:"\u5DF2\u6DFB\u52A0\u5230\u4E66\u7B7E"},location.origin)}).catch(O=>{window.parent.postMessage({type:"ldu:bookmark-result",tabId:i,ok:!1,message:O instanceof Error&&O.message?O.message:"\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"},location.origin)});return}if(e?.type==="ldu:page-tools-config"){l.setConfig({ownerOnlyEnabled:e.ownerOnlyEnabled===!0,minimalHidePosters:e.minimalHidePosters===!0,minimalHideNotices:e.minimalHideNotices===!0,minimalHideCategoryBadges:e.minimalHideCategoryBadges===!0,minimalHideTags:e.minimalHideTags===!0,lowEndOptimizationEnabled:e.lowEndOptimizationEnabled===!0});return}e?.type==="ldu:preview-config"&&(b=e.enabled===!0,w=e.clickMode==="single"?"single":"double",b||x())}),document.addEventListener("pointerdown",t=>{window.parent.postMessage({type:"ldu:frame-interaction",tabId:i},location.origin),b&&w==="double"&&t.detail>=2&&x()},!0);let S=null,V=()=>{S===null&&(window.parent.postMessage({type:"ldu:frame-interaction",tabId:i},location.origin),S=window.setTimeout(()=>{S=null},120))};window.addEventListener("wheel",V,{passive:!0,capture:!0}),window.addEventListener("touchstart",V,{passive:!0,capture:!0}),document.addEventListener("keydown",t=>{["ArrowDown","ArrowUp","PageDown","PageUp","Home","End","Space"].includes(t.key)&&V()},!0),document.addEventListener("click",t=>{if(k||!_(t))return;let e=$(t.target);if(e){t.preventDefault(),t.stopImmediatePropagation(),J(e);return}let H=G(t.target);if(H){t.preventDefault(),t.stopImmediatePropagation(),window.parent.postMessage({type:"ldu:list-navigate",tabId:i,url:H.href},location.origin);return}if(!b)return;let v=y(t.target);if(v){if(t.preventDefault(),t.stopImmediatePropagation(),w==="single"){N(v);return}x(),!(t.detail>=2)&&(c=window.setTimeout(()=>{if(c=null,!!v.isConnected){k=!0;try{v.click()}finally{k=!1}}},K))}},!0),document.addEventListener("dblclick",t=>{if(!b||w!=="double"||!_(t))return;let e=y(t.target);e&&(x(),t.preventDefault(),t.stopImmediatePropagation(),N(e))},!0),document.addEventListener("keydown",t=>{!b||t.key!=="Escape"||window.parent.postMessage({type:"ldu:preview-dismiss",tabId:i},location.origin)},!0),p("ldu:frame-ready")}function it(n,o){document.documentElement.dataset.lduEmbeddedList="true",A(document);let i=new z({isEmbedded:!0,allowOwnerView:!1,...o.loadOwnerView?{loadOwnerView:o.loadOwnerView}:{}});o.initialPageToolsConfig&&i.setConfig(o.initialPageToolsConfig);let l=null,d=null,s=!1,m=null,u=!1,g="double",b=!1,w="",k="",c=r=>{l!==null&&window.clearTimeout(l),l=window.setTimeout(()=>{l=null;let a={type:r,frameId:n,url:location.href,title:document.title,scrollY:window.scrollY};w=location.href,k=document.title,window.parent.postMessage(a,location.origin)},r==="ldu:list-ready"?0:100)},h=()=>{if(document.readyState==="loading")return!1;let r=document.querySelector("#main-outlet");return r?[...r.children].some(a=>!a.matches(".loading-container, .spinner, .spinner-container, .loading-indicator")):!1},p=()=>{s||m!==null||!h()||(m=window.setTimeout(()=>{m=null,!(s||!h())&&(s=!0,window.parent.postMessage({type:"ldu:list-visual-ready",frameId:n,url:location.href,title:document.title,scrollY:window.scrollY},location.origin))},0))},E=()=>{d!==null&&window.clearTimeout(d),d=null},L=r=>r.button===0&&!r.ctrlKey&&!r.metaKey&&!r.shiftKey&&!r.altKey,x=r=>{let a=r instanceof Element?r.closest("a[href]"):null;return!a||!D(a.href,location.href)||a.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:a},T=r=>{let a=r instanceof Element?r.closest("a[href]"):null;return!a||!/^https?:/i.test(a.href)||f(a.href)||new URL(a.href,location.href).origin===location.origin||r instanceof Element&&r.closest("img, picture, .lightbox-wrapper")||a.matches(".lightbox")||a.querySelector("img, picture")||a.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:a},C=r=>{let a=f(r.href,location.href);window.parent.postMessage({type:"ldu:list-topic-open",frameId:n,url:r.href,topicId:a?.topicId,postNumber:a?.postNumber,topicTitle:r.textContent?.trim()||(a?`\u4E3B\u9898 ${a.topicId}`:"")},location.origin)},M=r=>{let a=r.getBoundingClientRect();window.parent.postMessage({type:"ldu:list-preview-open",frameId:n,url:r.href,anchorRect:{left:a.left,top:a.top,right:a.right,bottom:a.bottom,width:a.width,height:a.height}},location.origin)};window.addEventListener("message",r=>{if(r.source!==window.parent||r.origin!==location.origin)return;let a=r.data;if(a?.type==="ldu:page-tools-config"){i.setConfig({ownerOnlyEnabled:a.ownerOnlyEnabled===!0,minimalHidePosters:a.minimalHidePosters===!0,minimalHideNotices:a.minimalHideNotices===!0,minimalHideCategoryBadges:a.minimalHideCategoryBadges===!0,minimalHideTags:a.minimalHideTags===!0,lowEndOptimizationEnabled:a.lowEndOptimizationEnabled===!0});return}a?.type==="ldu:preview-config"&&(u=a.enabled===!0,g=a.clickMode==="single"?"single":"double",u||E())}),window.addEventListener("scroll",()=>c("ldu:list-state"),{passive:!0}),window.addEventListener("load",()=>{c("ldu:list-ready"),p()},{once:!0}),document.addEventListener("DOMContentLoaded",()=>{c("ldu:list-ready"),p()},{once:!0}),window.addEventListener("popstate",()=>c("ldu:list-state")),window.addEventListener("hashchange",()=>c("ldu:list-state")),document.addEventListener("pointerdown",()=>{window.parent.postMessage({type:"ldu:list-interaction",frameId:n},location.origin)},!0),new MutationObserver(()=>{p(),!(w===location.href&&k===document.title)&&c("ldu:list-state")}).observe(document.documentElement,{childList:!0,subtree:!0}),document.addEventListener("click",r=>{if(b||!L(r))return;let a=x(r.target);if(a){r.preventDefault(),r.stopImmediatePropagation(),C(a);return}if(!u)return;let y=T(r.target);if(y){if(r.preventDefault(),r.stopImmediatePropagation(),g==="single"){M(y);return}E(),!(r.detail>=2)&&(d=window.setTimeout(()=>{if(d=null,!!y.isConnected){b=!0;try{y.click()}finally{b=!1}}},K))}},!0),document.addEventListener("dblclick",r=>{if(!u||g!=="double"||!L(r))return;let a=T(r.target);a&&(E(),r.preventDefault(),r.stopImmediatePropagation(),M(a))},!0),document.addEventListener("keydown",r=>{r.key==="Escape"&&window.parent.postMessage({type:"ldu:list-preview-dismiss",frameId:n},location.origin)},!0),c("ldu:list-ready"),p()}var q=window.name.startsWith("ldu-topic:")?import(chrome.runtime.getURL("topic-tools-runtime.js")):null,X=U(window.frameElement);Y({...X?{initialPageToolsConfig:X}:{},...q?{loadOwnerView:()=>q.then(n=>n.installOwnerView)}:{}});document.getElementById("ldu-frame-bootstrap-style")?.remove();
