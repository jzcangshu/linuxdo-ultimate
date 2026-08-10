var Ki={settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.95 4.6 1.7 1.7 0 0 0 9.98 3.04V3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>',split:'<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/><path d="M12 9v6m-3-3h6"/>',external:'<path d="M15 4h5v5M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',refresh:'<path d="M20 6v5h-5"/><path d="M19 11a7 7 0 1 0 1 5"/>',copy:'<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',bookmark:'<path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',"bookmark-filled":'<path class="ldu-symbol-fill" d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',"close-others":'<rect x="3" y="5" width="13" height="12" rx="2"/><path d="M8 3h10a3 3 0 0 1 3 3v8"/><path d="m18 16 4 4m0-4-4 4"/>',list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',"tab-list":'<path d="m4 6 5 6-5 6M11 6h9M11 12h9M11 18h9"/>',check:'<path d="m5 12 4 4L19 6"/>',maximize:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',restore:'<path d="M9 9H4V4M15 9h5V4M9 15H4v5M15 15h5v5"/>',trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',"thumbs-up":'<path d="M7 10v11M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7A2 2 0 0 1 17.5 21H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z"/>',"thumbs-down":'<path d="M17 14V3M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.6l2.3-7A2 2 0 0 1 6.5 3H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9Z"/>',github:'<path d="M15 22v-3.9c.04-1-.35-1.76-.8-2.2 2.6-.3 5.3-1.27 5.3-5.75A4.5 4.5 0 0 0 18.3 7c.12-.3.52-1.53-.12-3.18 0 0-.98-.31-3.2 1.2a11.1 11.1 0 0 0-5.83 0c-2.22-1.51-3.2-1.2-3.2-1.2C5.3 5.47 5.7 6.7 5.82 7a4.5 4.5 0 0 0-1.2 3.15c0 4.47 2.72 5.46 5.32 5.75-.34.3-.64.82-.75 1.59-.67.3-2.37.82-3.42-.98 0 0-.62-1.13-1.8-1.21M9 19c-2.25 1-2.5-1-3.5-1.5"/>',gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M7.5 8C6.1 8 5 7 5 5.7S6.1 3.5 7.5 3.5C9.6 3.5 12 8 12 8s2.4-4.5 4.5-4.5C17.9 3.5 19 4.4 19 5.7S17.9 8 16.5 8"/>'};function T(x,_=20){return`<svg class="ldu-symbol ldu-symbol-${x}" viewBox="0 0 24 24" width="${_}" height="${_}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${Ki[x]}</svg>`}function Wi(x){"use strict";x=x||{};let _=()=>x.isEnabled?x.isEnabled():!0,We=()=>{x.clickMode&&(le=x.clickMode()==="single")},Dt=300,Ot=250,zt=250,Fe=980,we=650,Ge=300*1e3,Vt=15,qt=20*1024*1024,be="__AGY_TOKEN__",U="agy_bookmarks",j="agy_linux_hidden_topics",Ue="agy-linux-hidden-topic-style",ie="agy_preview_position",ne="agy_preview_maximized",re="agy_single_click_preview",b=8,N=window.self===window.top,oe="agy-preview-frame:",$t=window.name.startsWith(oe);function je(e){return e.key==="F5"||e.code==="F5"||e.keyCode===116}function Ye(){let e=window;try{typeof unsafeWindow<"u"&&unsafeWindow&&(e=unsafeWindow)}catch{}let t=e.document||document,i=e.Object||Object,n=e.Reflect||Reflect,r=e.Event||Event;try{let u=e.__agyPreviewVisibilityControllerV2;if(u&&typeof u.setSuspended=="function"&&typeof u.flushVisibilityChange=="function"&&typeof u.getNativeVisibilityState=="function")return u}catch{}let o=[],a=!1,l=!1,s=0;function d(u){let p=t;for(;p;){let w=null;try{w=i.getOwnPropertyDescriptor(p,u)}catch{}if(w)return w;try{p=i.getPrototypeOf(p)}catch{p=null}}return null}function g(u,p){let w=o.find(K=>K.name===u),k=w&&w.nativeDescriptor;try{if(k&&typeof k.get=="function")return n.apply(k.get,t,[]);if(k&&i.prototype.hasOwnProperty.call(k,"value"))return k.value}catch{}return p}function h(u,p,w){let k=d(u);if(!k&&!(u in t))return;let K=null;try{K=i.getOwnPropertyDescriptor(t,u)||null}catch{}o.push({name:u,suspendedValue:p,fallbackValue:w,nativeDescriptor:k,ownDescriptor:K})}h("hidden",!0,!1),h("visibilityState","hidden","visible"),h("webkitHidden",!0,!1),h("webkitVisibilityState","hidden","visible");function B(){if(a)return!0;let u=[];try{return o.forEach(p=>{i.defineProperty(t,p.name,{configurable:!0,enumerable:!!(p.nativeDescriptor&&p.nativeDescriptor.enumerable),get:function(){return l?p.suspendedValue:g(p.name,p.fallbackValue)}}),u.push(p.name)}),a=!0,!0}catch{return u.forEach(w=>{try{n.deleteProperty(t,w)}catch{}}),!1}}function M(){a&&(o.forEach(u=>{try{u.ownDescriptor?i.defineProperty(t,u.name,u.ownDescriptor):n.deleteProperty(t,u.name)}catch{}}),a=!1)}function Vi(){try{t.dispatchEvent(new r("visibilitychange"))}catch{try{document.dispatchEvent(new Event("visibilitychange"))}catch{}}}function qi(){return g("visibilityState","visible")}function te(){return l||!!g("hidden",!1)}let $e=te();try{t.addEventListener("visibilitychange",function(){$e=te()},!0)}catch{}function Ke(){let u=te();return u===$e?!1:($e=u,Vi(),!0)}function $i(u){let p=function(){u===s&&Ke()};try{if(e.scheduler&&typeof e.scheduler.postTask=="function"){let w=e.scheduler.postTask(p,{priority:"background"});w&&typeof w.catch=="function"&&w.catch(function(){});return}}catch{}try{e.setTimeout(p,0)}catch{setTimeout(p,0)}}let Ht={setSuspended(u,p={}){let w=!!u,k=w!==l,K=te();if(w&&!B())return!1;l=w,l||M();let Bt=te();return k&&(s+=1),K!==Bt&&p.notify!==!1&&(p.deferNotification===!0?$i(s):Ke()),!0},flushVisibilityChange:Ke,getNativeVisibilityState:qi,isSuspended(){return l}};try{i.defineProperty(e,"__agyPreviewVisibilityControllerV2",{configurable:!0,value:Ht})}catch{}return Ht}let ae=Ye();if($t){Kt();return}function Kt(){if(window.__agyPreviewBridgeInstalled)return;window.__agyPreviewBridgeInstalled=!0;let e=()=>Number(window.name.slice(oe.length)),t=s=>!!(s&&s.closest&&s.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], .CodeMirror, .monaco-editor')),i=!1,n=!1,r=null;window.addEventListener("message",function(s){let d=s.data;s.source!==window.parent||!d||d.agyPreviewActivity!==!0||d.agyPreviewToken!==e()||ae.setSuspended(d.agyPreviewActive!==!0)});function o(){return document.body?(typeof document.body.innerText=="string"?document.body.innerText:document.body.textContent||"").replace(/\s+/g,"").length>=12?!0:!!document.body.querySelector('img[src], video, canvas, svg, article, main > *, [role="main"] > *'):!1}function a(){n=!1,!(i||!o())&&(i=!0,r&&r.disconnect(),window.parent.postMessage({agyPreviewContentReady:!0,agyPreviewToken:e()},"*"))}function l(){i||n||(n=!0,setTimeout(a,50))}try{r=new MutationObserver(l),r.observe(document.documentElement||document,{childList:!0,subtree:!0,characterData:!0})}catch{}document.addEventListener("DOMContentLoaded",l,{once:!0}),document.addEventListener("click",function(s){let d=s.target&&s.target.closest?s.target.closest("a"):null;if(!d)return;let g=d.getAttribute("href");if(!g||/^javascript:/i.test(g)||g.startsWith("#"))return;let h="";try{h=d.href}catch{return}/^https?:/i.test(h)&&(s.preventDefault(),s.stopImmediatePropagation(),window.parent.postMessage({agyPreviewNavigate:h,agyPreviewToken:e()},"*"))},!0),document.addEventListener("keydown",function(s){if(je(s)){s.preventDefault(),s.stopImmediatePropagation(),s.repeat||window.parent.postMessage({agyPreviewRefresh:!0,agyPreviewToken:e()},"*");return}s.key!=="ArrowLeft"&&s.key!=="ArrowRight"||s.ctrlKey||s.shiftKey||s.altKey||s.metaKey||s.isComposing||t(s.target)||(s.preventDefault(),s.stopImmediatePropagation(),window.parent.postMessage({agyPreviewHistoryDirection:s.key==="ArrowLeft"?-1:1,agyPreviewToken:e()},"*"))},!0),window.addEventListener("load",function(){let s=e();window.parent.postMessage({agyPreviewTitle:document.title||"",agyPreviewUrl:location.href,agyPreviewToken:s},"*"),l()},{once:!0})}let Wt=T("external",16),Xe=T("bookmark",16),Ft=T("bookmark-filled",16),Gt=T("list",16),Ut=T("check",16),jt=T("maximize",16),Yt=T("restore",16),Xt=T("refresh",16),xe=T("close",16),Zt=T("trash",16),Jt=T("thumbs-up",16),Qt=T("thumbs-down",16),ei=[{match:/(^|\.)linux\.do$/i,powerSavePreview:!0,css:`
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
            `}];function se(e){try{let t=new URL(e).hostname;return ei.find(i=>i.match.test(t))||null}catch{return null}}function Ze(e){return Di(e)||!!se(e)?.directLoad}let I=null,D=null,R=null,c=null,A="",f=[],y=null,ti=1,ce=1,le=x.clickMode?x.clickMode()==="single":ri(),E=null,v=null,Je=0,de=!1,O=null,ue=!1,pe=null,Y=null,H=null,ke=null,fe=null,Qe=null,Ee=!1,P=new Set,et=!1,C=ai(),tt=!1,it=0,Te=0,m=new Map,nt=0,ii=50;function W(){try{if(typeof GM_getValue=="function"){let e=GM_getValue(U,"[]"),t=typeof e=="string"?JSON.parse(e):e;return Array.isArray(t)?t:[]}}catch{}try{let e=JSON.parse(localStorage.getItem(U)||"[]");return Array.isArray(e)?e:[]}catch{return[]}}function Pe(e){let t=JSON.stringify(e);try{typeof GM_setValue=="function"?GM_setValue(U,t):localStorage.setItem(U,t)}catch{try{localStorage.setItem(U,t)}catch{}}di()}function F(){if(Y)return Y;let e=null;try{typeof GM_getValue=="function"&&(e=GM_getValue(j,"[]"))}catch{}if(e===null)try{e=localStorage.getItem(j)}catch{}try{let t=typeof e=="string"?JSON.parse(e||"[]"):e;Y=new Set(Array.isArray(t)?t.map(String):[])}catch{Y=new Set}return Y}function Ce(){if(!N||!/(^|\.)linux\.do$/i.test(location.hostname))return;if((!H||!H.isConnected)&&(H=document.getElementById(Ue)),!H){let t=document.head||document.documentElement;if(!t)return;H=document.createElement("style"),H.id=Ue,t.appendChild(H)}let e=Array.from(F(),t=>/^\d+$/.test(t)?`.topic-list .topic-list-item[data-topic-id="${t}"]`:"").filter(Boolean);H.textContent=e.length?`${e.join(`,
`)} { display: none !important; }`:""}function ni(){let e=Array.from(F()),t=JSON.stringify(e);try{typeof GM_setValue=="function"?GM_setValue(j,t):localStorage.setItem(j,t)}catch{try{localStorage.setItem(j,t)}catch{}}Ce()}function ri(){let e=!1;try{if(typeof GM_getValue=="function")return e=GM_getValue(re,!1),e===!0||e===1||e==="true"}catch{}try{e=localStorage.getItem(re)}catch{}return e===!0||e===1||e==="true"}function Gi(e){try{if(typeof GM_setValue=="function"){GM_setValue(re,e);return}}catch{}try{localStorage.setItem(re,String(e))}catch{}}function oi(e){return W().some(t=>t.url===e)}function rt(){let e=null;try{typeof GM_getValue=="function"&&(e=GM_getValue(ie,null))}catch{}if(e===null)try{e=localStorage.getItem(ie)}catch{}try{let t=typeof e=="string"?JSON.parse(e):e;if(t&&Number.isFinite(t.left)&&Number.isFinite(t.top))return t}catch{}return null}function me(e){let t=JSON.stringify(e);try{if(typeof GM_setValue=="function"){GM_setValue(ie,t);return}}catch{}try{localStorage.setItem(ie,t)}catch{}}function ai(){let e=!1;try{if(typeof GM_getValue=="function")return e=GM_getValue(ne,!1),e===!0||e===1||e==="true"}catch{}try{e=localStorage.getItem(ne)}catch{}return e===!0||e===1||e==="true"}function si(e){try{if(typeof GM_setValue=="function"){GM_setValue(ne,e);return}}catch{}try{localStorage.setItem(ne,String(e))}catch{}}function ci(e){let t=new Date(e),i=n=>n<10?"0"+n:""+n;return`${t.getFullYear()}-${i(t.getMonth()+1)}-${i(t.getDate())} ${i(t.getHours())}:${i(t.getMinutes())}`}function ge(){de=!0,O&&clearTimeout(O),O=setTimeout(()=>{de=!1,O=null},500)}function li(e){if(!e)return null;let t=String(e.dataset.topicId||"").trim(),i=e.querySelector("a.raw-topic-link[href]"),n=i&&i.closest(".link-top-line");if(!t||!i||!n)return null;let r="";try{let o=new URL(i.getAttribute("href"),location.origin);r=`${o.origin}${o.pathname}`}catch{return null}return{topicId:t,url:r,title:(i.textContent||"").trim()||r,titleLine:n}}function di(){if(!N||!/(^|\.)linux\.do$/i.test(location.hostname))return;let e=new Set(W().map(t=>t.url));document.querySelectorAll(".agy-linux-topic-actions").forEach(t=>{let i=t.querySelector(".agy-linux-topic-up");if(!i)return;let n=e.has(t.dataset.topicUrl||"");i.classList.toggle("agy-is-bookmarked",n),i.setAttribute("aria-pressed",String(n)),i.title=n?"\u53D6\u6D88\u6536\u85CF\u6B64\u5E16\u5B50":"\u6536\u85CF\u6B64\u5E16\u5B50",i.setAttribute("aria-label",i.title)})}function ui(e,t,i){let n=li(e);if(!n)return;let r=i.has(n.topicId);if(e.classList.toggle("agy-linux-topic-hidden",r),r)return;let o=e.querySelector(".agy-linux-topic-actions");if(o&&o.dataset.agyTopicId!==n.topicId&&(o.remove(),o=null),!o){o=document.createElement("span"),o.className="agy-linux-topic-actions";let s=document.createElement("button");s.type="button",s.className="agy-linux-topic-action agy-linux-topic-up",s.dataset.action="bookmark",s.innerHTML=Jt;let d=document.createElement("button");d.type="button",d.className="agy-linux-topic-action agy-linux-topic-down",d.dataset.action="hide",d.title="\u9690\u85CF\u6B64\u5E16\u5B50\uFF0C\u5237\u65B0\u540E\u4ECD\u4E0D\u663E\u793A",d.setAttribute("aria-label",d.title),d.innerHTML=Qt,o.appendChild(s),o.appendChild(d),n.titleLine.prepend(o)}o.dataset.agyTopicId!==n.topicId&&(o.dataset.agyTopicId=n.topicId),o.dataset.topicUrl!==n.url&&(o.dataset.topicUrl=n.url),o.dataset.topicTitle!==n.title&&(o.dataset.topicTitle=n.title);let a=o.querySelector(".agy-linux-topic-up"),l=t.has(n.url);a.classList.toggle("agy-is-bookmarked",l),a.setAttribute("aria-pressed",String(l)),a.title=l?"\u53D6\u6D88\u6536\u85CF\u6B64\u5E16\u5B50":"\u6536\u85CF\u6B64\u5E16\u5B50",a.setAttribute("aria-label",a.title)}function Le(e){if(!e||e.nodeType!==1)return;e.matches(".topic-list-item[data-topic-id]")&&P.add(e);let t=e.closest(".topic-list-item[data-topic-id]");t&&P.add(t),e.querySelectorAll(".topic-list-item[data-topic-id]").forEach(i=>{P.add(i)})}function ot(){if(Ee=!1,!P.size)return;let e=new Set(W().map(n=>n.url)),t=F(),i=Array.from(P);P.clear(),i.forEach(n=>{n.isConnected&&ui(n,e,t)})}function Se(e){Le(e),P.size&&(Ee||(Ee=!0,typeof queueMicrotask=="function"?queueMicrotask(ot):Promise.resolve().then(ot)))}function Ui(){if(et)return;et=!0,F(),Ce(),document.addEventListener("pointerdown",function(r){!r.target.closest||!r.target.closest(".agy-linux-topic-action")||(r.preventDefault(),r.stopImmediatePropagation())},!0),document.addEventListener("click",function(r){let o=r.target.closest&&r.target.closest(".agy-linux-topic-action");if(!o)return;let a=o.closest(".topic-list-item[data-topic-id]"),l=o.closest(".agy-linux-topic-actions");if(!a||!l)return;r.preventDefault(),r.stopImmediatePropagation();let s=String(l.dataset.agyTopicId||""),d=l.dataset.topicUrl||"",g=l.dataset.topicTitle||d;if(o.dataset.action==="bookmark"){st(d,g);return}o.dataset.action==="hide"&&s&&(F().add(s),ni(),a.classList.add("agy-linux-topic-hidden"))},!0);function e(r){r.forEach(o=>{if(o.type==="attributes"){Le(o.target);return}let a=o.target.closest&&o.target.closest(".topic-list-item[data-topic-id]");a&&P.add(a),o.addedNodes.forEach(Le)}),i(),P.size&&Se()}function t(r){let o=F();r.forEach(a=>{let l=a.target.matches&&a.target.matches(".topic-list-item[data-topic-id]")?a.target:null;if(!l)return;let s=String(l.dataset.topicId||"").trim(),d=o.has(s),g=l.classList.contains("agy-linux-topic-hidden"),h=!d&&!l.querySelector(".agy-linux-topic-actions");(d!==g||h)&&P.add(l)}),P.size&&Se()}function i(){let r=document.querySelector(".topic-list");!r||r===Qe||(fe?fe.disconnect():fe=new MutationObserver(t),Qe=r,fe.observe(r,{subtree:!0,attributes:!0,attributeFilter:["class"]}))}function n(){!document.documentElement||ke||(ke=new MutationObserver(e),ke.observe(document.documentElement,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["data-topic-id","href"]}),Ce(),i(),Se(document.documentElement))}document.documentElement?n():document.addEventListener("readystatechange",n,{once:!0})}if(N){let e=document.createElement("style");e.textContent=`
        /* LDU ADAPTATION: host-page Linux Do layout is owned by the split app. */
        .agy-preview-container {
            position: fixed;
            width: ${Fe}px;
            height: ${we}px;
            max-width: calc(100vw - ${b*2}px);
            max-height: calc(100vh - ${b*2}px);
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
            left: ${b}px !important;
            top: ${b}px !important;
            right: ${b}px !important;
            bottom: ${b}px !important;
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
        `;let t=document.head||document.documentElement;t?t.appendChild(e):document.addEventListener("readystatechange",function i(){let n=document.head||document.documentElement;n&&(document.removeEventListener("readystatechange",i),n.appendChild(e))})}N&&(window.addEventListener("pointerdown",function(e){if(e.target.closest&&e.target.closest(".agy-linux-topic-action"))return;let t=e.target.closest&&e.target.closest(".agy-close-btn");if(t&&c&&c.contains(t)){e.preventDefault(),e.stopImmediatePropagation(),V(),ge();return}let i=e.target.closest&&e.target.closest(".agy-preview-tab-close");if(i&&c&&c.contains(i)){e.preventDefault(),e.stopImmediatePropagation();let r=i.closest(".agy-preview-tab"),o=r&&Number(r.dataset.tabId);Number.isFinite(o)&&Mt(o),ge();return}let n=e.target.closest&&e.target.closest(".agy-preview-tab");if(e.button===0&&n&&c&&c.contains(n)){let r=Number(n.dataset.tabId);Number.isFinite(r)&&St(r)}if(E){(e.target===E||e.target.closest&&e.target.closest(".agy-viewer-close"))&&(Me(),ge());return}if(!(v&&v.contains(e.target))&&c&&!c.contains(e.target)){let r=e.target.closest&&e.target.closest("a");if(X(r))return;V(),ge()}},!0),window.addEventListener("pointerdown",function(e){if(!_()||e.detail!==2||e.button!==0||e.ctrlKey||e.shiftKey||e.altKey||e.metaKey||(I&&(clearTimeout(I),I=null),le)||E)return;let t=e.target.closest&&e.target.closest("a");X(t)&&(ue=!0,dt(t))},!0),document.addEventListener("click",function(e){de&&(de=!1,O&&(clearTimeout(O),O=null),e.preventDefault(),e.stopImmediatePropagation())},!0),window.addEventListener("resize",function(){if(!c)return;if(C){qe(),L();return}let e=c.getBoundingClientRect(),t=q(e.left,e.top,c);$(c,t),me(t),L()}),window.addEventListener("message",function(e){let t=e.data;if(!t||!Number.isFinite(t.agyPreviewToken))return;let i=f.find(n=>n.iframe&&e.source===n.iframe.contentWindow&&n.loadToken===t.agyPreviewToken);i&&(typeof t.agyPreviewTitle=="string"&&t.agyPreviewTitle.trim()&&Tt(i,t.agyPreviewTitle),t.agyPreviewContentReady===!0&&De(i,i.loadToken,i.url),(t.agyPreviewHistoryDirection===-1||t.agyPreviewHistoryDirection===1)&&i.id===y&&It(i,t.agyPreviewHistoryDirection),t.agyPreviewRefresh===!0&&i.id===y&&Be(i),typeof t.agyPreviewNavigate=="string"&&/^https?:/i.test(t.agyPreviewNavigate)&&He(t.agyPreviewNavigate,i.id))}),document.addEventListener("visibilitychange",function(){c&&ht()})),document.addEventListener("click",ki,!0),document.addEventListener("dblclick",Ei,!0),N&&document.addEventListener("keydown",function(e){if(c&&je(e)){e.preventDefault(),e.stopImmediatePropagation(),e.repeat||Be(Q());return}if(e.key==="Escape"||e.keyCode===27){E?Me():v?L():c&&V();return}if(!c||e.key!=="ArrowLeft"&&e.key!=="ArrowRight"||e.ctrlKey||e.shiftKey||e.altKey||e.metaKey||e.isComposing||pi(e.target))return;let t=Q();t&&(e.preventDefault(),e.stopImmediatePropagation(),It(t,e.key==="ArrowLeft"?-1:1))},!0);function pi(e){return!!(e&&e.closest&&e.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], .CodeMirror, .monaco-editor'))}function X(e){if(!_()||!e||e.closest(".agy-preview-container"))return!1;let t=e.getAttribute("href");return!t||t.startsWith("javascript:")||t.startsWith("#")||t===""||!/^https?:/i.test(e.href)?!1:x.isPreviewableUrl?x.isPreviewableUrl(e.href,e):!0}function Z(e){try{return/\.(png|jpe?g|gif|webp|avif|bmp|ico|svg)$/i.test(new URL(e).pathname)}catch{return!1}}function at(e){return/content-type:\s*image\//i.test(e.responseHeaders||"")}function z(e){Me(),E=document.createElement("div"),E.className="agy-image-viewer";let t=document.createElement("img");t.src=e,t.alt="";let i=document.createElement("button");i.className="agy-viewer-close",i.innerHTML=xe,i.title="\u5173\u95ED\u56FE\u7247 (Esc)";let n=document.createElement("div");n.className="agy-viewer-tip",n.textContent="\u70B9\u51FB\u7A7A\u767D\u5904\u6216\u6309 Esc \u5173\u95ED",E.appendChild(t),E.appendChild(i),E.appendChild(n),document.body.appendChild(E)}function Me(){if(!E)return;let e=E;E=null,e.style.setProperty("visibility","hidden","important"),e.style.setProperty("display","none","important"),e.style.setProperty("pointer-events","none","important"),e.style.setProperty("transition","none","important"),ft(()=>{let t=e.querySelector("img");t&&t.removeAttribute("src"),e.parentNode&&e.parentNode.removeChild(e)})}function fi(){let e=Q();try{let t=e&&e.iframe&&e.iframe.contentDocument&&e.iframe.contentDocument.title;if(t&&t.trim())return t.trim()}catch{}try{let t=new URL(A);return t.hostname+t.pathname}catch{return A}}function st(e,t,i){if(!e)return;let n=W(),r=n.findIndex(o=>o.url===e);r>=0?(n.splice(r,1),Pe(n)):(n.unshift({url:e,title:t||e,time:Date.now()}),Pe(n),i&&(i.innerHTML=Ut,i.style.color="#34c759",setTimeout(()=>{i.style.color="",J()},700))),J(),v&&he()}function mi(e){A&&st(A,fi(),e)}function J(){if(!c)return;let e=c.querySelector(".agy-bm-add-btn");e&&(oi(A)?(e.innerHTML=Ft,e.classList.add("agy-bm-active"),e.title="\u53D6\u6D88\u6536\u85CF"):(e.innerHTML=Xe,e.classList.remove("agy-bm-active"),e.title="\u6536\u85CF\u5F53\u524D\u9875\u9762"))}function gi(e){let t=++Je;G(()=>{t!==Je||y!==e||J()})}function he(){if(!v)return;let e=v.querySelector(".agy-bm-list"),t=v.querySelector(".agy-bm-count"),i=v.querySelector(".agy-bm-search");if(!e)return;let n=W(),r=i?i.value.trim().toLocaleLowerCase():"",o=r?n.filter(a=>{let l=(a.title||"").toLocaleLowerCase(),s=(a.url||"").toLocaleLowerCase();return l.includes(r)||s.includes(r)}):n;if(t&&(t.textContent=r?`\u4E66\u7B7E (${o.length}/${n.length})`:`\u4E66\u7B7E (${n.length})`),e.textContent="",!o.length){let a=document.createElement("div");a.className="agy-bm-empty",a.textContent=n.length?"\u6CA1\u6709\u5339\u914D\u7684\u4E66\u7B7E":"\u6682\u65E0\u4E66\u7B7E",e.appendChild(a);return}o.forEach(a=>{let l=document.createElement("div");l.className="agy-bm-item",l.title=`\u6536\u85CF\u4E8E ${ci(a.time)}
${a.url}`;let s=document.createElement("span");s.className="agy-bm-item-title",s.textContent=a.title||a.url;let d=document.createElement("button");d.className="agy-bm-item-del",d.innerHTML=Zt,d.title="\u5220\u9664\u6B64\u4E66\u7B7E",d.addEventListener("click",g=>{g.stopPropagation();let h=W().filter(B=>B.url!==a.url);Pe(h),he(),J()}),l.appendChild(s),l.appendChild(d),l.addEventListener("click",()=>{He(a.url,y,{keepBookmarkPanel:!0})}),e.appendChild(l)})}function hi(){if(v){L();return}if(!c)return;v=document.createElement("div"),v.className="agy-bookmark-panel";let e=document.createElement("div");e.className="agy-bm-header";let t=document.createElement("span");t.className="agy-bm-count";let i=document.createElement("input");i.className="agy-bm-search",i.type="search",i.placeholder="\u641C\u7D22\u6807\u9898\u6216\u7F51\u5740",i.setAttribute("aria-label","\u641C\u7D22\u4E66\u7B7E\u6807\u9898\u6216\u7F51\u5740"),i.addEventListener("input",he),i.addEventListener("click",a=>a.stopPropagation()),e.appendChild(t),e.appendChild(i);let n=document.createElement("div");n.className="agy-bm-list",v.appendChild(e),v.appendChild(n),document.body.appendChild(v);let r=c.getBoundingClientRect(),o=r.left-250-8;o<8&&(o=r.right+8),o+250>window.innerWidth-8&&(o=Math.max(8,window.innerWidth-258)),v.style.left=`${o}px`,v.style.top=`${r.top}px`,v.style.maxHeight=`${r.height}px`,he()}function L(){if(!v)return;let e=v;v=null,e.parentNode&&e.parentNode.removeChild(e)}function Ie(e,t){t.size=(t.html?t.html.length:0)+(t.rawHtml?t.rawHtml.length:0);let i=Date.now();for(let[r,o]of m)o.status!=="loading"&&i-o.time>Ge&&m.delete(r);m.has(e)&&m.delete(e),m.set(e,t);let n=0;for(let r of m.values())n+=r.size||0;for(;m.size>Vt||n>qt;){let r=new Set(f.map(l=>l.url));r.add(e);let o=Array.from(m.keys()).find(l=>!r.has(l));if(!o)break;let a=m.get(o);if(n-=a&&a.size||0,a&&a.xhr)try{a.xhr.abort()}catch{}m.delete(o)}}function _e(e,t){return!t||t.status!=="done"?null:(!t.html&&typeof t.rawHtml=="string"&&(t.html=Nt(t.rawHtml,e,be),t.rawHtml=null,t.size=t.html.length),t.html)}function yi(e,t){let i=()=>{m.get(e)===t&&_e(e,t)};typeof requestIdleCallback=="function"?requestIdleCallback(i,{timeout:2e3}):setTimeout(i,150)}function ji(e){if(!_())return;let t=e.target.closest("a");if(!X(t)||R===t)return;let i=Date.now();i-nt<ii||(nt=i,R&&ct(R.href),R=t,t.addEventListener("mouseleave",vi,{once:!0}),D=setTimeout(()=>{wi(t.href)},zt))}function vi(){D&&(clearTimeout(D),D=null),R&&(ct(R.href),R=null)}function wi(e){let t=m.get(e);if(t&&t.status==="loading"||t&&Date.now()-t.time<Ge||Ze(e)||Z(e))return;let i=GM_xmlhttpRequest({method:"GET",url:e,timeout:1e4,onload:function(n){if(n.status>=200&&n.status<400){let r=m.get(e);if(!r||r.xhr!==i)return;at(n)?(r.status="image",r.html="",r.rawHtml=null,r.size=0):(r.status="done",r.rawHtml=n.responseText,r.html=null,r.size=n.responseText.length),r.xhr=null,r.time=Date.now(),f.filter(a=>S(a,a.loadToken,e)&&a.loadState==="waiting-cache").forEach(a=>{if(r.status==="image")a.loadState="image",ye(a.loadingBar,a),a.id===y&&z(e);else{let l=_e(e,r);l&&ze(a,l,e,a.loadingBar,a.loadToken)}}),r.status==="done"&&!r.html&&yi(e,r)}},onerror:function(){let n=m.get(e);!n||n.xhr!==i||(f.filter(r=>S(r,r.loadToken,e)&&r.loadState==="waiting-cache").forEach(r=>Ve(r,"\u9884\u52A0\u8F7D\u7F51\u7EDC\u8BF7\u6C42\u51FA\u9519")),m.delete(e))}});Ie(e,{status:"loading",html:"",xhr:i,time:Date.now()})}function ct(e){let t=m.get(e),i=f.some(n=>n.url===e&&(n.loadState==="loading"||n.loadState==="waiting-cache"));t&&t.status==="loading"&&!i&&(t.xhr&&t.xhr.abort(),m.delete(e))}function lt(e){window.location.href=e}function bi(e){let t=e.getAttribute("target");c&&V(),N&&t==="_blank"?window.open(e.href,"_blank"):lt(e.href)}function dt(e){if(!N){lt(e.href);return}if(Z(e.href)){z(e.href);return}if(c){Lt(e.href);return}A=e.href,_t(e,e.href)}function ut(e,t){!e||!e.isConnected||(t?dt(e):bi(e))}function xi(e){if(!c||!e||!e.isConnected)return;let t=e.getBoundingClientRect(),i=c.getBoundingClientRect();if(!!(t.right<i.left||t.left>i.right||t.bottom<i.top||t.top>i.bottom))return;let r=c;r.style.pointerEvents="none",pe&&clearTimeout(pe),pe=setTimeout(()=>{pe=null,r===c&&(r.style.pointerEvents="")},500)}function ki(e){if(!_()||(We(),e.button!==0||e.ctrlKey||e.shiftKey||e.altKey||e.metaKey))return;let t=e.target.closest("a");if(!X(t)||t.closest(".agy-preview-container"))return;let i=t.getAttribute("href");if(!(!i||i.startsWith("javascript:")||i.startsWith("#")||i==="")){if(e.preventDefault(),e.stopPropagation(),e.detail<2){I&&clearTimeout(I);let n=le;I=setTimeout(()=>{I=null,ut(t,n),n&&xi(t)},n&&N?Ot:Dt)}else if(e.detail>=2&&(I&&(clearTimeout(I),I=null),e.detail===2)){if(ue){ue=!1;return}ut(t,!le)}}}function Ei(e){if(!_()||(ue=!1,e.button!==0||e.ctrlKey||e.shiftKey||e.altKey||e.metaKey))return;let t=e.target.closest("a");X(t)&&(e.preventDefault(),e.stopPropagation())}function G(e){if(ae.getNativeVisibilityState()!=="visible"){setTimeout(e,0);return}requestAnimationFrame(()=>{requestAnimationFrame(e)})}function pt(e){G(()=>{try{if(window.scheduler&&typeof window.scheduler.postTask=="function"){let t=window.scheduler.postTask(e,{priority:"background"});t&&typeof t.catch=="function"&&t.catch(()=>{});return}}catch{}setTimeout(e,0)})}function ft(e){G(()=>{typeof requestIdleCallback=="function"?requestIdleCallback(e,{timeout:250}):setTimeout(e,0)})}function Ti(){return!!(c&&se(location.href)?.powerSavePreview)}function Pi(){let e=Ti();e!==tt&&ae.setSuspended(e,{deferNotification:!0})&&(tt=e)}function mt(){let e=++it;pt(()=>{e===it&&Pi()})}function Ae(e,t){if(!(!e||!e.iframe||!e.iframe.contentWindow||e.closed))try{e.iframe.contentWindow.postMessage({agyPreviewActivity:!0,agyPreviewActive:!!t,agyPreviewToken:e.loadToken},"*")}catch{}}function gt(e){return!!(e&&e.id===y&&ae.getNativeVisibilityState()==="visible")}function ht(){f.forEach(e=>Ae(e,gt(e)))}function yt(){let e=++Te;pt(()=>{e===Te&&ht()})}function V(){if(!c)return;let e=c,t=f.slice(),i=new Map;t.forEach(n=>{n.closed=!0,n.loadToken=ce++;let r=m.get(n.url);r&&r.status==="loading"&&i.set(n.url,r)}),e.style.setProperty("visibility","hidden","important"),e.style.setProperty("display","none","important"),e.style.setProperty("opacity","0","important"),e.style.setProperty("pointer-events","none","important"),e.style.setProperty("transition","none","important"),c=null,A="",f=[],y=null,Te+=1,mt(),L(),G(()=>{t.forEach(n=>Et(n)),i.forEach((n,r)=>{if(!f.some(a=>a.url===r&&(a.loadState==="loading"||a.loadState==="waiting-cache"))){if(n.xhr)try{n.xhr.abort()}catch{}m.get(r)===n&&m.delete(r)}}),e.parentNode&&e.parentNode.removeChild(e)})}function Ne(e){!e||!e.contentReadyTimer||(clearTimeout(e.contentReadyTimer),e.contentReadyTimer=null)}function Ci(e){return e?.pane&&e.pane.setAttribute("aria-busy","false"),e&&(e.loadingBar=null),null}function Li(e,t){if(!e?.pane)return null;let i=document.createElement("div");i.className="agy-loading-overlay",i.setAttribute("role","status"),i.setAttribute("aria-live","polite"),i.innerHTML=`
            <div class="agy-loading-card">
                <div class="agy-loading-text"></div>
            </div>
        `;let n=i.querySelector(".agy-loading-text");return n&&(n.textContent=`\u52A0\u8F7D\u51FA\u9519: ${t}`,n.style.color="#ff3b30"),e.pane.appendChild(i),e.loadingBar=i,i}function ye(e,t){Ne(t),t&&t.pane&&t.pane.setAttribute("aria-busy","false");let i=e||t&&t.loadingBar;i&&(t&&t.loadingBar===i&&(t.loadingBar=null),i.style.opacity="0",setTimeout(()=>{i.parentNode&&i.parentNode.removeChild(i)},130))}function vt(e){try{let t=new URL(e),i=t.pathname==="/"?"":t.pathname;return`${t.hostname}${i}`}catch{return e}}function Q(){return f.find(e=>e.id===y)||null}function Si(e){return f.find(t=>t.id===e)||null}function wt(e){return{id:ti++,url:e,title:vt(e),pane:null,iframe:null,request:null,loadingBar:null,contentReadyTimer:null,loadToken:ce++,loadState:"idle",historyEntries:[e],historyIndex:0,element:null,titleElement:null,closed:!1}}function bt(e){if(!c||!e||e.pane)return;let t=c.querySelector(".agy-preview-body");if(!t)return;let i=document.createElement("div");i.className="agy-preview-pane",i.dataset.tabId=String(e.id),i.setAttribute("role","tabpanel");let n=document.createElement("iframe");n.className="agy-preview-iframe",n.name=`${oe}${e.loadToken}`,i.appendChild(n),t.appendChild(i),e.pane=i,e.iframe=n}function xt(e){if(!c||!e||e.element)return;let t=c.querySelector(".agy-preview-tabs");if(!t)return;let i=document.createElement("div");i.className="agy-preview-tab",i.dataset.tabId=String(e.id),i.setAttribute("role","tab");let n=document.createElement("span");n.className="agy-preview-tab-title";let r=document.createElement("button");r.type="button",r.className="agy-preview-tab-close",r.innerHTML=xe,r.title="\u5173\u95ED\u6B64\u6807\u7B7E\u9875",r.setAttribute("aria-label","\u5173\u95ED\u6B64\u6807\u7B7E\u9875"),r.addEventListener("click",o=>{o.stopPropagation(),Mt(e.id)}),i.appendChild(n),i.appendChild(r),i.addEventListener("click",()=>St(e.id)),t.appendChild(i),e.element=i,e.titleElement=n,Re(e)}function Re(e){!e||!e.element||(e.element.title=`${e.title}
${e.url}`,e.titleElement&&e.titleElement.textContent!==e.title&&(e.titleElement.textContent=e.title))}function Mi(e){!e||!e.element||requestAnimationFrame(()=>{if(!e.element||!e.element.isConnected)return;let t=e.element.parentElement;if(!t)return;let i=e.element.offsetLeft,n=i+e.element.offsetWidth;i<t.scrollLeft?t.scrollLeft=i:n>t.scrollLeft+t.clientWidth&&(t.scrollLeft=n-t.clientWidth)})}function S(e,t,i){return!!(e&&!e.closed&&f.includes(e)&&e.loadToken===t&&e.url===i&&e.iframe)}function kt(e){if(e){if(e.iframe&&Ae(e,!1),e.loadToken=ce++,e.request){try{e.request.abort()}catch{}e.request=null}Ne(e),e.iframe&&(e.iframe.onload=null),e.loadingBar&&(e.loadingBar.remove(),e.loadingBar=null),e.pane&&e.pane.setAttribute("aria-busy","false")}}function Et(e){if(e){if(kt(e),e.iframe){try{e.iframe.src="about:blank"}catch{}try{e.iframe.removeAttribute("srcdoc")}catch{}}e.pane&&e.pane.parentNode&&e.pane.parentNode.removeChild(e.pane),e.element&&e.element.parentNode&&e.element.parentNode.removeChild(e.element),e.iframe=null,e.pane=null,e.element=null,e.titleElement=null,e.loadState="closed"}}function ee(e=!1){let t=Q();if(!c||!t)return;A=t.url;let i=c.querySelector(".agy-preview-tab.active");i&&i!==t.element&&(i.classList.remove("active"),i.setAttribute("aria-selected","false")),t.element&&(t.element.classList.add("active"),t.element.setAttribute("aria-selected","true"));let n=c.querySelector(".agy-preview-pane.active");n&&n!==t.pane&&(n.classList.remove("active"),n.setAttribute("aria-hidden","true")),t.pane&&(t.pane.classList.add("active"),t.pane.setAttribute("aria-hidden","false")),yt();let r=c.querySelector(".agy-open-btn");r&&(r.href=t.url),gi(t.id),e&&Mi(t)}function Tt(e,t){let i=t&&t.trim();!e||e.closed||!i||(e.title=i,Re(e))}function ve(e,t={}){if(!e||!c||!e.iframe||e.closed)return;kt(e),Oe(e.iframe,e.loadToken);let i=e.loadToken,n=e.url;e.loadState="loading",delete e.iframe.dataset.loaded,e.iframe.style.visibility="visible";let r=Ci(e),o={...t};delete o.deferStart;let a=()=>{S(e,i,n)&&Ii(e,n,r,i,o)};t.deferStart===!0?G(a):a()}function Pt(e){return!e||!e.body?!1:(typeof e.body.innerText=="string"?e.body.innerText:e.body.textContent||"").replace(/\s+/g,"").length>=12?!0:!!e.body.querySelector('img[src], video, canvas, svg, article, main > *, [role="main"] > *')}function Ct(e,t,i,n=0){if(!(!S(e,i,t)||e.loadState==="loaded")){try{if(Pt(e.iframe.contentDocument)){De(e,i,t);return}}catch{return}n>=100||(e.contentReadyTimer=setTimeout(()=>{e.contentReadyTimer=null,Ct(e,t,i,n+1)},100))}}function Lt(e){if(Z(e)){z(e);return}let t=wt(e);f.push(t),bt(t),xt(t),y=t.id,ee(!0),L(),ve(t,{deferStart:!0})}function St(e){e===y||!f.some(t=>t.id===e)||(y=e,ee(!0),L())}function Mt(e){let t=f.findIndex(r=>r.id===e);if(t<0)return;if(f.length===1){V();return}let i=f[t],n=y===e;i.closed=!0,i.loadToken=ce++,i.pane&&(i.pane.style.visibility="hidden",i.pane.style.pointerEvents="none"),i.element&&(i.element.style.display="none"),f.splice(t,1),n?(y=f[Math.min(t,f.length-1)].id,ee(!0)):yt(),ft(()=>Et(i))}function He(e,t=y,i={}){if(Z(e)){z(e);return}let n=Si(t);n&&(i.fromHistory||(n.historyEntries=n.historyEntries.slice(0,n.historyIndex+1),n.historyEntries[n.historyEntries.length-1]!==e&&n.historyEntries.push(e),n.historyIndex=n.historyEntries.length-1),n.url=e,n.title=vt(e),n.id===y?(ee(),i.keepBookmarkPanel||L()):Re(n),ve(n))}function It(e,t){if(!e||e.closed||t!==-1&&t!==1)return!1;let i=e.historyIndex+t;return i<0||i>=e.historyEntries.length?!1:(e.historyIndex=i,He(e.historyEntries[i],e.id,{fromHistory:!0}),!0)}function Be(e){return!e||e.closed||e.id!==y?!1:(L(),ve(e,{forceReload:!0}),!0)}function Ii(e,t,i,n,r={}){if(!S(e,n,t))return;if(Ze(t)){Ai(e,t,i,n);return}if(r.forceReload){At(e,t,i,n,r);return}let o=m.get(t);if(o&&o.status==="image")e.loadState="image",e.id===y&&z(t),ye(i,e);else if(o&&o.status==="done"){let a=_e(t,o);a&&ze(e,a,t,i,n)}else o&&o.status==="loading"?e.loadState="waiting-cache":At(e,t,i,n)}function _t(e,t){c=document.createElement("div"),c.className="agy-preview-container";let i=c,n=document.createElement("div");n.className="agy-preview-header";let r=document.createElement("div");r.className="agy-preview-tabs",r.setAttribute("role","tablist");let o=document.createElement("div");o.className="agy-preview-actions";let a=document.createElement("button");a.className="agy-preview-btn agy-bm-list-btn",a.title="\u4E66\u7B7E\u5217\u8868",a.innerHTML=Gt,a.addEventListener("click",M=>{M.stopPropagation(),hi()});let l=document.createElement("button");l.className="agy-preview-btn agy-bm-add-btn",l.title="\u6536\u85CF\u5F53\u524D\u9875\u9762",l.innerHTML=Xe,l.addEventListener("click",M=>{M.stopPropagation(),mi(l)});let s=document.createElement("a");s.className="agy-preview-btn agy-open-btn",s.href=t,s.target="_blank",s.title="\u65B0\u7A97\u53E3\u6253\u5F00",s.innerHTML=Wt,s.addEventListener("click",()=>{setTimeout(V,0)});let d=document.createElement("button");d.type="button",d.className="agy-preview-btn agy-refresh-btn",d.title="\u5237\u65B0\u5F53\u524D\u9884\u89C8",d.setAttribute("aria-label",d.title),d.innerHTML=Xt,d.addEventListener("click",M=>{M.preventDefault(),M.stopPropagation(),Be(Q())});let g=document.createElement("button");g.type="button",g.className="agy-maximize-btn",g.addEventListener("click",M=>{M.preventDefault(),M.stopPropagation(),Ri()});let h=document.createElement("button");h.type="button",h.className="agy-close-btn",h.innerHTML=xe,h.title="\u5173\u95ED\u9884\u89C8 (Esc)",o.appendChild(a),o.appendChild(l),o.appendChild(s),o.appendChild(d),o.appendChild(g),o.appendChild(h),n.appendChild(r),n.appendChild(o);let B=document.createElement("div");B.className="agy-preview-body",c.appendChild(n),c.appendChild(B),document.body.appendChild(c),f=[wt(t)],y=f[0].id,bt(f[0]),xt(f[0]),ee(),Bi(e),qe(),Hi(n),i.classList.add("agy-instant-feedback"),i.classList.add("agy-preview-visible"),G(()=>{i===c&&i.classList.remove("agy-instant-feedback")}),ve(f[0],{deferStart:!0}),mt()}function At(e,t,i,n,r={}){let o=null,a={method:"GET",url:t,timeout:1e4,onload:function(l){if(!(!S(e,n,t)||e.request!==o))if(e.request=null,l.status>=200&&l.status<400){if(at(l)){Ie(t,{status:"image",html:"",xhr:null,time:Date.now()}),e.loadState="image",e.id===y&&z(t),ye(i,e);return}let s=Nt(l.responseText,t,be);Ie(t,{status:"done",html:s,xhr:null,time:Date.now()}),ze(e,s,t,i,n)}else Ve(e,l.statusText||"\u52A0\u8F7D\u5931\u8D25")},onerror:function(){!S(e,n,t)||e.request!==o||(e.request=null,Ve(e,"\u7F51\u7EDC\u8FDE\u63A5\u51FA\u9519"))}};r.forceReload&&(a.headers={"Cache-Control":"no-cache",Pragma:"no-cache"}),o=GM_xmlhttpRequest(a),e.request=o}function Nt(e,t,i){let n=new DOMParser().parseFromString(e,"text/html");n.querySelectorAll("base").forEach(l=>l.remove()),n.querySelectorAll("meta[http-equiv]").forEach(l=>{let s=(l.getAttribute("http-equiv")||"").toLowerCase();(s==="content-security-policy"||s==="refresh")&&l.remove()});let r=n.createElement("base");r.href=t,n.head.prepend(r);let o=n.createElement("script");o.textContent=`
            (function() {
                if (window.__agyEmbeddedPreviewBridge) return;
                window.__agyEmbeddedPreviewBridge = true;
                var loadToken = ${i};
                var contentReadySent = false;
                var contentCheckScheduled = false;
                var contentObserver = null;
                var visibilityController = (${Ye.toString()})();
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
        `,r.after(o);let a=se(t);if(a&&a.css){let l=n.createElement("style");l.textContent=a.css,n.head.appendChild(l)}return`<!doctype html>
`+n.documentElement.outerHTML}function Rt(e,t,i,n){if(!S(e,n,t))return;let r=!1,o=!1;try{let a=e.iframe.contentDocument;r=!!a,o=Pt(a),_i(a,t),a&&a.title&&Tt(e,a.title)}catch{}!r||o?De(e,n,t,i):Ct(e,t,n),e.id===y&&J(),Ae(e,gt(e))}function De(e,t,i,n){S(e,t,i)&&(e.loadState="loaded",e.iframe.style.visibility="visible",ye(n||e.loadingBar,e))}function _i(e,t){let i=se(t);if(!e||!i||!i.css)return;let n=e.getElementById("agy-site-rule-style");if(n){n.textContent!==i.css&&(n.textContent=i.css);return}let r=e.createElement("style");r.id="agy-site-rule-style",r.textContent=i.css,(e.head||e.documentElement).appendChild(r)}function Oe(e,t){let i=`${oe}${t}`;e.name=i;try{e.contentWindow.name=i}catch{}}function Ai(e,t,i,n){if(!S(e,n,t))return;let r=e.iframe;r.dataset.loaded="true",Oe(r,n),r.onload=()=>Rt(e,t,i,n),r.removeAttribute("srcdoc"),r.src=t}function ze(e,t,i,n,r){if(!S(e,r,i))return;let o=e.iframe;e.loadState="loading",o.dataset.loaded="true",Oe(o,r),o.onload=()=>Rt(e,i,n,r),o.srcdoc=t.replace(new RegExp(be,"g"),String(r))}function Ve(e,t){if(!c||!e||e.closed)return;Ne(e),e.loadState="error";let i=e.loadingBar;if(i||(i=Li(e,t)),!i)return;e.pane&&e.pane.setAttribute("aria-busy","false"),e.iframe&&(e.iframe.style.visibility="hidden");let n=i.querySelector(".agy-loading-text");n&&(n.textContent=`\u52A0\u8F7D\u51FA\u9519: ${t}`,n.style.color="#ff3b30");let r=i.querySelector(".agy-spinner");r&&(r.style.borderTopColor="#ff3b30",r.style.animationPlayState="paused")}function q(e,t,i){let n=i?i.offsetWidth:Math.min(Fe,window.innerWidth-b*2),r=i?i.offsetHeight:Math.min(we,window.innerHeight-b*2),o=Math.max(b,window.innerWidth-n-b),a=Math.max(b,window.innerHeight-r-b);return{left:Math.round(Math.min(Math.max(e,b),o)),top:Math.round(Math.min(Math.max(t,b),a))}}function $(e,t){e.style.left=`${t.left}px`,e.style.top=`${t.top}px`}function Ni(){if(!c)return;let e=c.querySelector(".agy-maximize-btn");e&&(e.innerHTML=C?Yt:jt,e.title=C?"\u8FD8\u539F\u9884\u89C8\u7A97\u53E3":"\u6700\u5927\u5316\u9884\u89C8\u7A97\u53E3",e.setAttribute("aria-label",e.title),e.setAttribute("aria-pressed",String(C)))}function qe(){c&&(c.classList.toggle("agy-maximized",C),Ni())}function Ri(){if(c){if(!C){let e=c.getBoundingClientRect(),t=q(e.left,e.top,c);$(c,t),me(t)}if(C=!C,si(C),qe(),!C){let e=rt(),t=q(e?e.left:c.offsetLeft,e?e.top:c.offsetTop,c);$(c,t),me(t)}L()}}function Hi(e){e.addEventListener("pointerdown",function(t){if(t.button!==0||C||t.target.closest(".agy-preview-actions, .agy-preview-tab"))return;let i=e.closest(".agy-preview-container");if(!i||i!==c)return;let n=i.getBoundingClientRect(),r=t.pointerId,o=t.clientX-n.left,a=t.clientY-n.top;t.preventDefault(),t.stopPropagation(),L(),i.classList.add("agy-preview-visible"),i.classList.remove("agy-animating"),i.classList.add("agy-dragging");try{e.setPointerCapture(r)}catch{}function l(d){if(d.pointerId!==r)return;let g=q(d.clientX-o,d.clientY-a,i);$(i,g)}function s(d){if(d.pointerId!==r)return;e.removeEventListener("pointermove",l),e.removeEventListener("pointerup",s),e.removeEventListener("pointercancel",s),i.classList.remove("agy-dragging");try{e.releasePointerCapture(r)}catch{}let g=i.getBoundingClientRect(),h=q(g.left,g.top,i);$(i,h),me(h)}e.addEventListener("pointermove",l),e.addEventListener("pointerup",s),e.addEventListener("pointercancel",s)})}function Bi(e){if(!c)return;let t=rt();if(t){$(c,q(t.left,t.top,c));return}let i=e.getBoundingClientRect(),n=i.bottom+8,r=i.left;n+c.offsetHeight>window.innerHeight-b&&(n=i.top-we-8),$(c,q(r,n,c))}function Di(e){try{return new URL(e).origin===window.location.origin}catch{return!1}}function Oi(e,t){if(!_()||!/^https?:/i.test(e)||x.isPreviewableUrl&&!x.isPreviewableUrl(e,null))return;if(Z(e)){z(e);return}if(c){Lt(e);return}A=e;let i=t||{left:b,top:b,bottom:b};_t({getBoundingClientRect:()=>i},e)}function zi(){V(),D&&clearTimeout(D),D=null,R=null,m.forEach(e=>{if(e&&e.xhr)try{e.xhr.abort()}catch{}}),m.clear()}return{openFromFrame:Oi,close:zi,syncClickMode:We}}export{Wi as installLinkHoverPreviewer};
