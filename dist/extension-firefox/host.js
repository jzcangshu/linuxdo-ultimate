"use strict";(()=>{var v={schemaVersion:5,enabled:!0,layoutPreference:"auto",tabsEnabled:!0,tabPresentation:"horizontal",verticalTabsAutoCollapse:!0,groupVerticalTabs:!1,restoreSession:!1,colorizeTabs:!0,cleanModeEnabled:!0,minimalHidePosters:!0,minimalHideNotices:!0,minimalHideCategoryBadges:!0,minimalHideTags:!0,lowEndOptimizationEnabled:!1,previewEnabled:!1,creditEnabled:!0,previewClickMode:"double",maxLiveFrames:3,maxOpenTabs:50,paneSizes:{sidebar:216,listRatio:.35},dualPaneSizes:{sidebar:216,listRatio:.35}},q=1,le="linuxdo-ultimate:settings",F="linuxdo-ultimate:session:",V="linuxdo-ultimate:session-id",L="linuxdo-ultimate:session-owner:",de="linuxdo-ultimate:session-index",B="linuxdo-ultimate:latest-session",$="linuxdo-ultimate:latest-session-candidate";function H(s){if(!s||typeof s!="object")return structuredClone(v);let e=s,t=e.schemaVersion===2||e.schemaVersion===3||e.schemaVersion===4||e.schemaVersion===v.schemaVersion,i=e.schemaVersion===3||e.schemaVersion===4||e.schemaVersion===v.schemaVersion?e.cleanModeEnabled!==!1:e.cleanModeEnabled===!0||e.hidePosters!==!1,n=e.schemaVersion===4||e.schemaVersion===v.schemaVersion,a=e.paneSizes&&typeof e.paneSizes=="object"?e.paneSizes:{},r=e.dualPaneSizes&&typeof e.dualPaneSizes=="object"?e.dualPaneSizes:{};return{...v,enabled:!0,layoutPreference:e.layoutPreference==="two"||e.layoutPreference==="three"?e.layoutPreference:"auto",tabsEnabled:e.tabsEnabled!==!1,tabPresentation:e.tabPresentation==="vertical"?"vertical":"horizontal",verticalTabsAutoCollapse:e.verticalTabsAutoCollapse!==!1,groupVerticalTabs:e.groupVerticalTabs===!0,restoreSession:t&&e.restoreSession===!0,colorizeTabs:e.colorizeTabs!==!1,cleanModeEnabled:i,minimalHidePosters:n?e.minimalHidePosters!==!1:!0,minimalHideNotices:n?e.minimalHideNotices!==!1:!0,minimalHideCategoryBadges:n?e.minimalHideCategoryBadges!==!1:!0,minimalHideTags:n?e.minimalHideTags!==!1:!0,lowEndOptimizationEnabled:e.lowEndOptimizationEnabled===!0,previewEnabled:e.previewEnabled===!0,creditEnabled:e.creditEnabled!==!1,previewClickMode:e.previewClickMode==="single"?"single":"double",maxLiveFrames:D(e.maxLiveFrames,1,10,v.maxLiveFrames),maxOpenTabs:D(e.maxOpenTabs,5,50,v.maxOpenTabs),paneSizes:{sidebar:D(a.sidebar,160,360,v.paneSizes.sidebar),listRatio:He(a.listRatio,v.paneSizes.listRatio)},dualPaneSizes:{sidebar:D(r.sidebar,160,360,v.dualPaneSizes.sidebar),listRatio:He(r.listRatio,v.dualPaneSizes.listRatio)}}}function D(s,e,t,i){return typeof s=="number"&&Number.isFinite(s)?Math.round(Math.min(t,Math.max(e,s))):i}function He(s,e){return typeof s=="number"&&Number.isFinite(s)?Math.min(.7,Math.max(.3,s)):e}var Re=50;function Oe(s,e){if(!s||typeof s!="object")return{...e};let t=s;return{sidebar:Y(t.sidebar,160,360,e.sidebar),listRatio:dt(t.listRatio,e.listRatio)}}function dt(s,e){return typeof s=="number"&&Number.isFinite(s)?Math.min(.7,Math.max(.3,s)):e}function Y(s,e,t,i){return typeof s=="number"&&Number.isFinite(s)?Math.round(Math.min(t,Math.max(e,s))):i}function ct(s){if(!s||typeof s!="object")return null;let e=s;return typeof e.id!="string"||typeof e.topicId!="string"||typeof e.url!="string"?null:{id:e.id,topicId:e.topicId,url:e.url,title:typeof e.title=="string"&&e.title.trim()?e.title:`\u4E3B\u9898 ${e.topicId}`,...typeof e.postNumber=="number"&&Number.isFinite(e.postNumber)?{postNumber:Math.max(1,Math.floor(e.postNumber))}:{},suspended:e.suspended===!0,lastActiveAt:Y(e.lastActiveAt,0,Number.MAX_SAFE_INTEGER,0)}}function Fe(s,e){if(s.length<=Re)return s;let t=new Set(s.filter(i=>i.id!==e).sort((i,n)=>i.lastActiveAt-n.lastActiveAt).slice(0,s.length-Re).map(i=>i.id));return s.filter(i=>!t.has(i.id))}function z(s,e,t){return{schemaVersion:q,sessionId:s,listUrl:e,listScrollY:0,layoutMode:"native",paneSizes:{...v.paneSizes},dualPaneSizes:{...v.dualPaneSizes},tabs:[],activeTabId:null,secondaryTabIds:[],secondaryActiveTabId:null,updatedAt:t}}function ce(s,e){if(!s||typeof s!="object")return e;let t=s;if(t.schemaVersion!==q||typeof t.sessionId!="string")return e;let i=Array.isArray(t.tabs)?t.tabs.map(ct).filter(c=>c!==null):[],n=Fe(Array.from(new Map(i.map(c=>[c.topicId,c])).values()),typeof t.activeTabId=="string"?t.activeTabId:""),a=new Set(n.map(c=>c.id)),r=Array.isArray(t.secondaryTabIds)?[...new Set(t.secondaryTabIds.filter(c=>typeof c=="string"&&a.has(c)))]:[],o=new Set(r),l=n.filter(c=>!o.has(c.id)),u=l.some(c=>c.id===t.activeTabId)?t.activeTabId:l.at(-1)?.id??null,h=r.includes(t.secondaryActiveTabId??"")?t.secondaryActiveTabId:r.at(-1)??null;return{schemaVersion:q,sessionId:t.sessionId,listUrl:typeof t.listUrl=="string"&&t.listUrl?t.listUrl:e.listUrl,listScrollY:Y(t.listScrollY,0,1e7,0),layoutMode:t.layoutMode==="two"||t.layoutMode==="three"?t.layoutMode:"native",paneSizes:Oe(t.paneSizes,e.paneSizes),dualPaneSizes:Oe(t.dualPaneSizes,e.dualPaneSizes),tabs:n,activeTabId:u,secondaryTabIds:r,secondaryActiveTabId:h,updatedAt:Y(t.updatedAt,0,Number.MAX_SAFE_INTEGER,e.updatedAt)}}function ue(s,e,t){let i=s.tabs.find(o=>o.topicId===e.topicId),n=i?{...i,...e,suspended:!1,lastActiveAt:t}:{id:`topic-${e.topicId}`,topicId:e.topicId,url:e.url,title:e.title||`\u4E3B\u9898 ${e.topicId}`,...e.postNumber?{postNumber:e.postNumber}:{},suspended:!1,lastActiveAt:t},a=Fe(i?s.tabs.map(o=>o.topicId===e.topicId?n:o):[...s.tabs,n],n.id),r=s.secondaryTabIds.includes(n.id);return{...s,tabs:a,activeTabId:r?s.activeTabId:n.id,secondaryActiveTabId:r?n.id:s.secondaryActiveTabId,updatedAt:t}}function ze(s,e,t){let i=s.tabs.findIndex(h=>h.id===e);if(i<0)return s;let n=s.tabs.filter(h=>h.id!==e),a=s.secondaryTabIds.filter(h=>h!==e),r=new Set(a),o=n.filter(h=>!r.has(h.id)),l=s.activeTabId===e?o[Math.min(i,o.length-1)]?.id??o.at(-1)?.id??null:s.activeTabId,u=s.secondaryActiveTabId===e?a.at(-1)??null:s.secondaryActiveTabId;return{...s,tabs:n,activeTabId:l,secondaryTabIds:a,secondaryActiveTabId:u,updatedAt:t}}function ut(s,e){if(!s)return e;try{return JSON.parse(s)}catch{return e}}var W=class{backend=typeof GM_getValue=="function"&&typeof GM_setValue=="function"&&typeof GM_deleteValue=="function"?"userscript":"local";get(e,t){if(this.backend==="userscript")try{return GM_getValue(e,t)}catch{return t}try{return ut(window.localStorage.getItem(e),t)}catch{return t}}set(e,t){if(this.backend==="userscript"){try{GM_setValue(e,t)}catch{}return}try{window.localStorage.setItem(e,JSON.stringify(t))}catch{}}remove(e){if(this.backend==="userscript"){try{GM_deleteValue(e)}catch{}return}try{window.localStorage.removeItem(e)}catch{}}};function pt(s=window.sessionStorage){try{let e=s.getItem(V);if(e)return e;let t=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`;return s.setItem(V,t),t}catch{return"ephemeral"}}function _e(s=window.performance){try{return s.getEntriesByType("navigation")[0]?.type==="reload"}catch{return!1}}var mt=5*6e4,ht=720*60*6e4,bt=8;function pe(s){let e=s.get($,null);return Array.isArray(e)?e.filter(i=>!!(i&&typeof i=="object"&&typeof i.closedAt=="number"&&i.session&&typeof i.session.sessionId=="string")):[e,s.get(B,null)].filter(i=>!!(i&&typeof i=="object"&&typeof i.sessionId=="string")).map(i=>({session:i,closedAt:i.updatedAt||0}))}function Ue(s,e){s.set($,e),s.remove(B)}function me(s){let e=s.get(de,[]);return Array.isArray(e)?e.filter(t=>!!(t&&typeof t=="object"&&typeof t.sessionId=="string"&&typeof t.updatedAt=="number")):[]}function he(s,e){s.set(de,e)}function De(s,e,t){let i=me(s).filter(n=>n.sessionId!==e);i.push({sessionId:e,updatedAt:t}),he(s,i)}function qe(s,e=window.sessionStorage,t=Date.now(),i=!1){let n=pt(e),a=s.get(`${L}${n}`,null);if(!i&&a&&t>=a.updatedAt&&t-a.updatedAt<mt){n=Ne();try{e.setItem(V,n)}catch{}}let r={sessionId:n,ownerId:Ne()};return s.set(`${L}${n}`,{ownerId:r.ownerId,updatedAt:t}),r}function Ve(s,e,t=Date.now()){let i=s.get(`${L}${e.sessionId}`,null);i?.ownerId===e.ownerId&&(s.set(`${L}${e.sessionId}`,{...i,updatedAt:t}),De(s,e.sessionId,t))}function Be(s,e){s.get(`${L}${e.sessionId}`,null)?.ownerId===e.ownerId&&s.remove(`${L}${e.sessionId}`)}function Ne(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`}function $e(s){return H(s.get(le,v))}function be(s,e){s.set(le,H(e))}function Ye(s,e,t,i){let n=s.get(`${F}${e}`,null);return n==null?null:ce(n,z(e,t,i))}function We(s,e,t,i){let n=pe(s).filter(r=>r.session.sessionId!==e).sort((r,o)=>r.closedAt-o.closedAt).at(-1);if(!n)return null;let a=ce(n.session,z(e,t,i));return a.sessionId!==e&&gt(s,a.sessionId),N(s),a.tabs.length===0?null:{...a,sessionId:e}}function I(s,e){s.set(`${F}${e.sessionId}`,e),De(s,e.sessionId,e.updatedAt)}function Ge(s,e,t=Date.now()){if(e.tabs.length===0)return;let i=pe(s).filter(n=>n.session.sessionId!==e.sessionId);i.push({session:e,closedAt:t}),Ue(s,i.sort((n,a)=>n.closedAt-a.closedAt).slice(-bt))}function Ke(s,e){let t=pe(s).filter(i=>i.session.sessionId!==e);t.length>0?Ue(s,t):N(s)}function ge(s,e=Date.now()){let t=[];for(let i of me(s))e-i.updatedAt>=ht?(s.remove(`${F}${i.sessionId}`),s.remove(`${L}${i.sessionId}`)):t.push(i);he(s,t)}function N(s){s.remove($),s.remove(B)}function gt(s,e){s.remove(`${F}${e}`),s.remove(`${L}${e}`),he(s,me(s).filter(t=>t.sessionId!==e))}var ft=new Set(["/","/latest","/new","/unseen","/hot","/top","/read","/posted","/bookmarks","/categories","/tags"]);function vt(s){return s==="linux.do"||s.endsWith(".linux.do")?!0:globalThis.window?.__LDU_TEST_MODE__===!0&&(s==="localhost"||s==="127.0.0.1")}function f(s,e="https://linux.do/"){let t;try{t=new URL(s,e)}catch{return null}if(!vt(t.hostname))return null;let i=t.pathname.split("/").filter(Boolean),n=i.findIndex(o=>o==="t"||o==="n");if(n<0)return null;let a=i.findIndex((o,l)=>l>n&&/^\d+$/.test(o));if(a<0)return null;let r=i[a+1]&&/^\d+$/.test(i[a+1])?Number(i[a+1]):void 0;return{url:t,topicId:i[a],...r?{postNumber:r}:{}}}function P(s,e="https://linux.do/"){let t;try{t=new URL(s,e)}catch{return"other"}return f(t.href)?"topic":t.pathname==="/chat"||t.pathname.startsWith("/chat/")?"chat":t.pathname==="/search"||t.pathname.startsWith("/search/")?"search":t.pathname.startsWith("/u/")?"user":ft.has(t.pathname)||t.pathname.startsWith("/c/")||t.pathname.startsWith("/tag/")?"list":"other"}function fe(s,e="https://linux.do/"){let t=P(s,e);return t==="list"||t==="search"}function ve(s,e){let t=f(s,e),i=f(e,e);return!!(t&&(!i||t.topicId!==i.topicId))}var Se="linuxdo-ultimate:view:v1:";var je=`${Se}session-id`,G=`${Se}lock-index`;var we=class{constructor(e){this.options=e;this.fetcher=e.fetcher??fetch.bind(globalThis),this.now=e.now??Date.now,this.timeoutMs=e.timeoutMs??8e3}fetcher;now;timeoutMs;memoryLocks=new Map;async track(e,t,i,n=!1){if(e.url.origin!=="https://linux.do")return{status:"skipped"};let a=this.claim(e,t,n);if(!a)return{status:"skipped"};if(this.options.beforeClaimConfirmation?.(),!this.owns(e,a))return{status:"skipped"};let r=[];try{let o=await this.sendPageview(e,i);if(r.push(o),o.confirmed)return this.complete(e,a,t,"confirmed"),{status:"confirmed",confirmedBy:"pageview"}}catch{r.push({ok:!1,confirmed:!1})}try{let o=await this.sendTopicJson(e);if(r.push(o),o.confirmed)return this.complete(e,a,t,"confirmed"),{status:"confirmed",confirmedBy:"topic-json"}}catch{r.push({ok:!1,confirmed:!1})}return r.some(o=>o.ok)?(this.complete(e,a,t,"accepted"),{status:"accepted"}):(this.clearIfOwned(e,a),{status:"failed"})}stateKey(e){return`${Se}${e.url.hostname}:${e.topicId}`}readState(e){let t=this.stateKey(e);try{return JSON.parse(this.options.storage.getItem(t)??"null")??this.memoryLocks.get(t)??null}catch{return this.memoryLocks.get(t)??null}}claim(e,t,i){this.cleanupExpiredLocks();let n=this.readState(e);if(!i&&n?.expiresAt&&n.expiresAt>this.now())return null;let a=globalThis.crypto?.randomUUID?.()??`${this.now()}-${Math.random().toString(36).slice(2)}`;return this.writeState(this.stateKey(e),{status:"pending",token:a,source:t,expiresAt:this.now()+3e4}),this.owns(e,a)?a:null}complete(e,t,i,n){this.writeState(this.stateKey(e),{status:n,token:t,source:i,expiresAt:this.now()+288e5})}clearIfOwned(e,t){this.readState(e)?.token===t&&this.removeState(this.stateKey(e))}owns(e,t){return this.readState(e)?.token===t}writeState(e,t){this.memoryLocks.set(e,t);try{this.options.storage.setItem(e,JSON.stringify(t));let i=this.readLockIndex().filter(n=>n.key!==e);i.push({key:e,expiresAt:t.expiresAt}),this.options.storage.setItem(G,JSON.stringify(i))}catch{}}removeState(e){this.memoryLocks.delete(e);try{this.options.storage.removeItem(e),this.options.storage.setItem(G,JSON.stringify(this.readLockIndex().filter(t=>t.key!==e)))}catch{}}readLockIndex(){try{let e=JSON.parse(this.options.storage.getItem(G)??"[]");return Array.isArray(e)?e.filter(t=>!!(t&&typeof t=="object"&&typeof t.key=="string"&&typeof t.expiresAt=="number")):[]}catch{return[]}}cleanupExpiredLocks(){let e=this.now();for(let[n,a]of this.memoryLocks)a.expiresAt<=e&&this.memoryLocks.delete(n);let t=this.readLockIndex(),i=t.filter(n=>{if(n.expiresAt>e)return!0;try{this.options.storage.removeItem(n.key)}catch{}return!1});if(i.length!==t.length)try{this.options.storage.setItem(G,JSON.stringify(i))}catch{}}commonHeaders(){let e={Accept:"application/json, text/javascript, */*; q=0.01","X-Requested-With":"XMLHttpRequest","Discourse-Present":"true"},t=this.options.csrfToken();return t&&(e["X-CSRF-Token"]=t),e}async sendPageview(e,t){let i={...this.commonHeaders(),"Discourse-Track-View-Deferred":"true","Discourse-Track-View-Topic-Id":e.topicId,"Discourse-Track-View-Url":e.url.href,"Discourse-Track-View-Referrer":t,"Discourse-Track-View-Session-Id":this.options.trackingSessionId()},n=await this.fetchWithTimeout(`${e.url.origin}${this.basePath()}/pageview`,{method:"POST",credentials:"same-origin",cache:"no-store",keepalive:!0,headers:i});return this.readAttempt(n)}async sendTopicJson(e){let t=await this.fetchWithTimeout(`${e.url.origin}${this.basePath()}/t/${e.topicId}.json?track_visit=true&forceLoad=true`,{method:"GET",credentials:"same-origin",cache:"no-store",headers:{...this.commonHeaders(),"Discourse-Track-View":"true","Discourse-Track-View-Topic-Id":e.topicId}});return this.readAttempt(t)}basePath(){let e=this.options.basePath?.()??"";return e?`/${e.replace(/^\/+|\/+$/g,"")}`:""}readAttempt(e){let t=e.headers.get("x-discourse-trackview"),i=e.headers.get("x-discourse-browserpageview");return{ok:e.ok,confirmed:t==="1"||i==="1"}}async fetchWithTimeout(e,t){let i=new AbortController,n=globalThis.setTimeout(()=>i.abort(),this.timeoutMs);try{return await this.fetcher(e,{...t,signal:i.signal})}finally{globalThis.clearTimeout(n)}}};function K(){return new we({storage:window.localStorage,csrfToken:()=>document.querySelector('meta[name="csrf-token"]')?.content??"",trackingSessionId:()=>yt(window.sessionStorage,document.querySelector('meta[name="discourse-track-view-session-id"]')?.content??""),basePath:()=>document.querySelector('meta[name="discourse-base-uri"]')?.content??""})}var ye="";function yt(s,e="",t=wt){if(e)return e;try{let i=s.getItem(je);if(i)return i;let n=t();return s.setItem(je,n),n}catch{return ye||(ye=t()),ye}}function wt(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`}var _=class{constructor(e,t,i,n){this.container=e;this.maxLiveFrames=t;this.onMessage=i;this.onSuspend=n;this.liveLimit=Math.max(1,t)}frames=new Map;liveLimit;previewConfig={enabled:!1,clickMode:"double"};pageToolsConfig={ownerOnlyEnabled:!1,minimalHidePosters:!1,minimalHideNotices:!1,minimalHideCategoryBadges:!1,minimalHideTags:!1,lowEndOptimizationEnabled:!1};activeTabId=null;setMaxLiveFrames(e){this.liveLimit=Math.max(1,Math.min(10,Math.floor(e))),this.suspendOverflow("")}setPreviewConfig(e){if(!St(this.previewConfig,e)){this.previewConfig={...e};for(let t of this.frames.values())this.sendPreviewConfig(t.iframe)}}setPageToolsConfig(e){if(!Tt(this.pageToolsConfig,e)){this.pageToolsConfig={...e};for(let t of this.frames.values())this.sendPageToolsConfig(t.iframe)}}activate(e,t){let i=this.activeTabId!==e.id,n=this.ensureRecord(e,t);if(i){for(let[a,r]of this.frames)this.setFrameActive(r,a===e.id);this.activeTabId=e.id}return this.suspendOverflow(e.id),n.iframe}prepare(e,t){let i=this.activeTabId&&this.frames.has(this.activeTabId)?this.activeTabId:"",n=this.ensureRecord(e,t);return e.id!==i&&this.setFrameActive(n,!1),this.suspendOverflow(i),n.iframe}ensureRecord(e,t){let i=this.frames.get(e.id);if(i){i.lastUsedAt=t,i.iframe.title=e.title;let n=new URL(e.url,document.baseURI).href;i.iframe.src!==n&&i.reportedUrl!==n&&(i.reportedUrl=null,i.loaded=!1,i.configSentForDocument=!1,i.iframe.src=n)}else{let n=document.createElement("iframe");n.className="ldu-topic-frame",n.name=`ldu-topic:${e.id}`,n.title=e.title,n.dataset.tabId=e.id;let a=()=>{let r=this.frames.get(e.id);!r||r.iframe!==n||(r.loaded=!0,r.configSentForDocument=!1,this.sendLifecycleState(r),this.sendInitialConfigs(r),this.flushCommands(r),this.onMessage({type:"ldu:frame-ready",tabId:e.id,url:n.src},n))};n.addEventListener("load",a),n.src=e.url,i={iframe:n,lastUsedAt:t,reportedUrl:null,loaded:!1,softFrozen:!0,commands:[],loadListener:a,configSentForDocument:!1},this.frames.set(e.id,i),this.container.append(n)}return i}handleMessage(e){let t=e.data;if(!t||!["ldu:frame-state","ldu:frame-ready","ldu:frame-interaction","ldu:bookmark-result","ldu:preview-open","ldu:preview-dismiss","ldu:topic-open","ldu:list-navigate"].includes(t.type??"")||typeof t.tabId!="string")return;let i=this.frames.get(t.tabId);if(!(!i||e.source!==i.iframe.contentWindow)){if((t.type==="ldu:frame-state"||t.type==="ldu:frame-ready")&&t.url)try{i.reportedUrl=new URL(t.url,document.baseURI).href}catch{i.reportedUrl=null}t.type==="ldu:frame-ready"&&(i.loaded=!0,this.sendLifecycleState(i),this.sendInitialConfigs(i),this.flushCommands(i)),this.onMessage(t,i.iframe)}}remove(e){let t=this.frames.get(e);t&&(t.commands=[],t.iframe.removeEventListener("load",t.loadListener),t.iframe.remove(),this.frames.delete(e),this.activeTabId===e&&(this.activeTabId=null))}sendCommand(e,t){let i=this.frames.get(e);if(i){if(!i.loaded){i.commands.push(t);return}i.iframe.contentWindow?.postMessage(t,location.origin)}}getFrame(e){return this.frames.get(e)?.iframe??null}reload(e){let t=this.frames.get(e);if(!t)return!1;t.loaded=!1,t.reportedUrl=null,t.configSentForDocument=!1;try{t.iframe.contentWindow?.location.reload()}catch{t.iframe.src=t.iframe.src}return!0}detach(e){let t=this.frames.get(e);return t?(t.iframe.removeEventListener("load",t.loadListener),t.iframe.remove(),this.frames.delete(e),this.activeTabId===e&&(this.activeTabId=null),t):null}adopt(e,t,i){let n=t.iframe;n.name=`ldu-topic:${e.id}`,n.dataset.tabId=e.id,n.title=e.title;let a=()=>{let l=this.frames.get(e.id);!l||l.iframe!==n||(l.loaded=!0,l.configSentForDocument=!1,this.sendInitialConfigs(l),this.flushCommands(l),this.onMessage({type:"ldu:frame-ready",tabId:e.id,url:n.src},n))};n.addEventListener("load",a);let r=new URL(e.url,document.baseURI).href;n.src!==r&&t.reportedUrl!==r&&(n.src=r);let o={...t,lastUsedAt:i,reportedUrl:null,loaded:!1,loadListener:a,configSentForDocument:!1};return this.frames.set(e.id,o),this.container.append(n),this.activate(e,i),n}destroy(){for(let e of this.frames.values())e.commands=[],e.iframe.removeEventListener("load",e.loadListener),e.iframe.remove();this.frames.clear(),this.activeTabId=null}sendPreviewConfig(e){e.contentWindow?.postMessage({type:"ldu:preview-config",...this.previewConfig},location.origin)}sendPageToolsConfig(e){e.contentWindow?.postMessage({type:"ldu:page-tools-config",...this.pageToolsConfig},location.origin)}sendInitialConfigs(e){e.configSentForDocument||(e.configSentForDocument=!0,this.sendPreviewConfig(e.iframe),this.sendPageToolsConfig(e.iframe))}setFrameActive(e,t){let i=String(!t);e.iframe.getAttribute("aria-hidden")!==i&&e.iframe.setAttribute("aria-hidden",i);let n=t?0:-1;e.iframe.tabIndex!==n&&(e.iframe.tabIndex=n);let a=!t;e.softFrozen!==a&&(e.softFrozen=a,e.loaded&&this.sendLifecycleState(e))}sendLifecycleState(e){e.iframe.contentWindow?.postMessage({type:"ldu:frame-lifecycle",active:!e.softFrozen},location.origin)}flushCommands(e){let t=e.commands.splice(0);for(let i of t)e.iframe.contentWindow?.postMessage(i,location.origin)}suspendOverflow(e){for(;this.frames.size>this.liveLimit;){let i=[...this.frames.entries()].filter(([r])=>r!==e).sort(([,r],[,o])=>r.lastUsedAt-o.lastUsedAt)[0];if(!i)return;let[n,a]=i;a.commands=[],a.iframe.removeEventListener("load",a.loadListener),a.iframe.remove(),this.frames.delete(n),this.activeTabId===n&&(this.activeTabId=null),this.onSuspend(n)}}};function St(s,e){return s.enabled===e.enabled&&s.clickMode===e.clickMode}function Tt(s,e){return s.ownerOnlyEnabled===e.ownerOnlyEnabled&&s.minimalHidePosters===e.minimalHidePosters&&s.minimalHideNotices===e.minimalHideNotices&&s.minimalHideCategoryBadges===e.minimalHideCategoryBadges&&s.minimalHideTags===e.minimalHideTags&&s.lowEndOptimizationEnabled===e.lowEndOptimizationEnabled}var j=class{constructor(e,t,i){this.container=e;this.frameId=t;this.onMessage=i}iframe=null;reportedUrl="";frameConfig={enabled:!1,clickMode:"double",pageTools:{ownerOnlyEnabled:!1,minimalHidePosters:!1,minimalHideNotices:!1,minimalHideCategoryBadges:!1,minimalHideTags:!1,lowEndOptimizationEnabled:!1}};configSentForDocument=!1;restoreScrollY=0;restoreTimer=null;restoreDeadline=0;mount(e){if(!this.iframe){let n=document.createElement("iframe");n.className="ldu-list-frame",n.name=`ldu-list:${this.frameId}`,n.title="\u5E16\u5B50\u5217\u8868\u548C\u7AD9\u5185\u9875\u9762",n.dataset.frameId=this.frameId,n.addEventListener("load",()=>{this.configSentForDocument=!1,this.sendInitialConfigs(n),this.onMessage({type:"ldu:list-ready",frameId:this.frameId,url:n.src},n)}),this.iframe=n,this.container.append(n)}let i=(this.resolveSameOrigin(e)??new URL("/",location.href)).href;return this.iframe.src!==i&&this.reportedUrl!==i&&(this.reportedUrl="",this.configSentForDocument=!1,this.iframe.src=i),this.iframe.src||(this.iframe.src=i),this.iframe}navigate(e){let t=this.resolveSameOrigin(e);if(!t)return;if(!this.iframe){this.mount(t.href);return}let i=t.href;this.iframe.src===i||this.reportedUrl===i||(this.reportedUrl="",this.configSentForDocument=!1,this.iframe.src=i)}restoreScroll(e){!this.iframe?.contentWindow||e<=0||(this.restoreScrollY=e,this.restoreDeadline=Date.now()+5e3,this.attemptScrollRestore())}getElement(){return this.iframe}setConfig(e){let t=this.frameConfig.enabled!==e.enabled||this.frameConfig.clickMode!==e.clickMode,i=e.pageTools?{...e.pageTools}:this.frameConfig.pageTools,n=!xt(this.frameConfig.pageTools,i);this.frameConfig={...this.frameConfig,...e,pageTools:i},this.iframe&&(t&&this.sendPreviewConfig(this.iframe),n&&this.sendPageToolsConfig(this.iframe))}handleMessage(e){let t=e.data;if(!(!t||!["ldu:list-ready","ldu:list-visual-ready","ldu:list-state","ldu:list-interaction","ldu:list-topic-open","ldu:list-navigate","ldu:list-preview-open","ldu:list-preview-dismiss"].includes(t.type??""))&&!(t.frameId!==this.frameId||!this.iframe||e.source!==this.iframe.contentWindow||e.origin!==location.origin)){if((t.type==="ldu:list-ready"||t.type==="ldu:list-visual-ready"||t.type==="ldu:list-state")&&t.url)try{this.reportedUrl=new URL(t.url,document.baseURI).href}catch{this.reportedUrl=""}t.type==="ldu:list-ready"&&this.sendInitialConfigs(this.iframe),this.onMessage(t,this.iframe)}}sendPreviewConfig(e){e.contentWindow?.postMessage({type:"ldu:preview-config",...this.frameConfig},location.origin)}sendPageToolsConfig(e){e.contentWindow?.postMessage({type:"ldu:page-tools-config",...this.frameConfig.pageTools},location.origin)}sendInitialConfigs(e){this.configSentForDocument||(this.configSentForDocument=!0,this.sendPreviewConfig(e),this.sendPageToolsConfig(e))}resolveSameOrigin(e){try{let t=new URL(e,document.baseURI);return t.origin===location.origin&&/^https?:$/.test(t.protocol)?t:null}catch{return null}}attemptScrollRestore(){let e=this.iframe,t=this.restoreScrollY;if(!(!e?.contentWindow||t<=0)){if(this.restoreTimer!==null&&window.clearTimeout(this.restoreTimer),e.contentWindow.scrollTo({top:t,behavior:"instant"}),Math.abs(e.contentWindow.scrollY-t)<=2||Date.now()>=this.restoreDeadline){this.restoreScrollY=0,this.restoreDeadline=0,this.restoreTimer=null;return}this.restoreTimer=window.setTimeout(()=>{this.restoreTimer=null,this.iframe===e&&this.attemptScrollRestore()},100)}}destroy(){this.restoreTimer!==null&&window.clearTimeout(this.restoreTimer),this.restoreTimer=null,this.restoreScrollY=0,this.restoreDeadline=0,this.iframe?.remove(),this.iframe=null,this.reportedUrl="",this.configSentForDocument=!1}};function xt(s,e){return s.ownerOnlyEnabled===e.ownerOnlyEnabled&&s.minimalHidePosters===e.minimalHidePosters&&s.minimalHideNotices===e.minimalHideNotices&&s.minimalHideCategoryBadges===e.minimalHideCategoryBadges&&s.minimalHideTags===e.minimalHideTags&&s.lowEndOptimizationEnabled===e.lowEndOptimizationEnabled}var X=class{constructor(e,t,i){this.session=e;this.maxTabs=t;this.onChange=i}getSession(){return this.session}getTabs(){return this.session.tabs.map(e=>({...e}))}get(e){let t=this.session.tabs.find(i=>i.id===e);return t?{...t}:null}getPrimaryTabs(){let e=new Set(this.session.secondaryTabIds);return this.session.tabs.filter(t=>!e.has(t.id)).map(t=>({...t}))}getSecondaryTabs(){let e=new Map(this.session.tabs.map(t=>[t.id,t]));return this.session.secondaryTabIds.flatMap(t=>e.has(t)?[{...e.get(t)}]:[])}getActive(){return this.session.tabs.find(e=>e.id===this.session.activeTabId)??null}getSecondaryActive(){return this.session.tabs.find(e=>e.id===this.session.secondaryActiveTabId)??null}setSessionFields(e,t,i=!0){this.session={...this.session,...e,updatedAt:t},i&&this.emit()}open(e,t){if(this.session=ue(this.session,e,t),this.session.tabs.length>this.maxTabs){let i=this.session.tabs.filter(r=>r.id!==this.session.activeTabId),n=this.session.tabs.length-this.maxTabs,a=new Set(i.slice(0,n).map(r=>r.id));this.session={...this.session,tabs:this.session.tabs.filter(r=>!a.has(r.id))}}return this.repairPanelOwnership(),this.emit(),this.getActive()}openSecondary(e,t){this.session=ue(this.session,e,t);let i=this.session.tabs.find(n=>n.topicId===e.topicId);return this.session.secondaryTabIds.includes(i.id)||(this.session={...this.session,secondaryTabIds:[...this.session.secondaryTabIds,i.id],secondaryActiveTabId:i.id,activeTabId:this.session.activeTabId===i.id?this.getPrimaryTabs().find(n=>n.id!==i.id)?.id??null:this.session.activeTabId}),this.repairPanelOwnership(),this.emit(),{...i}}activate(e,t){return this.getPrimaryTabs().some(i=>i.id===e)?(this.session={...this.session,activeTabId:e,tabs:this.session.tabs.map(i=>i.id===e?{...i,lastActiveAt:t,suspended:!1}:i),updatedAt:t},this.emit(),this.getActive()):null}activateSecondary(e,t){return this.session.secondaryTabIds.includes(e)?(this.session={...this.session,secondaryActiveTabId:e,tabs:this.session.tabs.map(i=>i.id===e?{...i,lastActiveAt:t,suspended:!1}:i),updatedAt:t},this.emit(),this.getSecondaryActive()):null}moveToSecondary(e,t,i=!0){if(!this.session.tabs.some(o=>o.id===e))return null;if(this.session.secondaryTabIds.includes(e))return this.activateSecondary(e,t);let n=this.getPrimaryTabs(),a=n.findIndex(o=>o.id===e),r=n.filter(o=>o.id!==e);return this.session={...this.session,secondaryTabIds:[...this.session.secondaryTabIds,e],secondaryActiveTabId:e,activeTabId:this.session.activeTabId===e?r[Math.min(a,r.length-1)]?.id??null:this.session.activeTabId,tabs:this.session.tabs.map(o=>o.id===e?{...o,lastActiveAt:t,suspended:!1}:o),updatedAt:t},i&&this.emit(),this.getSecondaryActive()}mergeSecondaryIntoPrimary(e,t=!0){if(this.session.secondaryTabIds.length===0)return;let i=this.session.secondaryActiveTabId;this.session={...this.session,activeTabId:this.session.activeTabId??i,secondaryTabIds:[],secondaryActiveTabId:null,updatedAt:e},t&&this.emit()}closeOthersInPane(e,t){let i=this.session.secondaryTabIds.includes(e),a=(i?this.getSecondaryTabs():this.getPrimaryTabs()).filter(o=>o.id!==e).map(o=>o.id);if(a.length===0)return[];let r=new Set(a);return this.session={...this.session,tabs:this.session.tabs.filter(o=>!r.has(o.id)),activeTabId:i?this.session.activeTabId:e,secondaryTabIds:this.session.secondaryTabIds.filter(o=>!r.has(o)),secondaryActiveTabId:i?e:this.session.secondaryActiveTabId,updatedAt:t},this.emit(),a}reorderInPane(e,t,i,n){if(e===t)return!1;let a=this.session.secondaryTabIds.includes(e);if(a!==this.session.secondaryTabIds.includes(t))return!1;let r=(a?this.getSecondaryTabs():this.getPrimaryTabs()).map(m=>m.id),o=[...r],l=r.indexOf(e);if(l<0||!r.includes(t))return!1;r.splice(l,1);let u=r.indexOf(t);if(r.splice(u+(i==="after"?1:0),0,e),r.every((m,g)=>m===o[g]))return!1;let h=new Set(r),c=new Map(this.session.tabs.map(m=>[m.id,m])),d=0;return this.session={...this.session,tabs:this.session.tabs.map(m=>h.has(m.id)?c.get(r[d++]):m),secondaryTabIds:a?r:this.session.secondaryTabIds,updatedAt:n},this.emit(),!0}update(e,t,i,n=!0){this.session={...this.session,tabs:this.session.tabs.map(a=>a.id===e?{...a,...t,lastActiveAt:i}:a),updatedAt:i},n&&this.emit()}suspend(e,t){this.update(e,{suspended:!0},t)}close(e,t,i=!0){this.session=ze(this.session,e,t),i&&this.emit()}clear(e){this.session.tabs.length!==0&&(this.session={...this.session,tabs:[],activeTabId:null,secondaryTabIds:[],secondaryActiveTabId:null,updatedAt:e},this.emit())}emit(){this.onChange?.(this.session)}repairPanelOwnership(){let e=new Set(this.session.tabs.map(a=>a.id)),t=this.session.secondaryTabIds.filter(a=>e.has(a)),i=new Set(t),n=this.session.tabs.filter(a=>!i.has(a.id));this.session={...this.session,secondaryTabIds:t,activeTabId:this.session.activeTabId&&n.some(a=>a.id===this.session.activeTabId)?this.session.activeTabId:n.at(-1)?.id??null,secondaryActiveTabId:this.session.secondaryActiveTabId&&t.includes(this.session.secondaryActiveTabId)?this.session.secondaryActiveTabId:t.at(-1)??null}}};var Xe=[["\u5F00\u53D1\u8C03\u4F18","rgb(50, 195, 195)"],["\u56FD\u4EA7\u66FF\u4EE3","rgb(209, 44, 37)"],["\u8D44\u6E90\u835F\u8403","rgb(18, 168, 157)"],["\u6587\u6863\u5171\u5EFA","rgb(156, 182, 196)"],["\u8DF3\u86A4\u5E02\u573A","rgb(237, 32, 123)"],["\u79EF\u5206\u4E50\u56ED","rgb(252, 202, 68)"],["\u975E\u6211\u83AB\u5C5E","rgb(168, 198, 254)"],["\u8BFB\u4E66\u6210\u8BD7","rgb(224, 217, 0)"],["\u626C\u5E06\u8D77\u822A","rgb(255, 152, 56)"],["\u524D\u6CBF\u5FEB\u8BAF","rgb(187, 143, 206)"],["\u7F51\u7EDC\u8BB0\u5FC6","rgb(247, 148, 29)"],["\u798F\u5229\u7F8A\u6BDB","rgb(228, 87, 53)"],["\u641E\u4E03\u637B\u4E09","rgb(58, 181, 74)"],["\u793E\u533A\u5B75\u5316","rgb(255, 187, 0)"],["\u866B\u6D1E\u5E7F\u573A","rgb(255, 0, 247)"],["\u8FD0\u8425\u53CD\u9988","rgb(128, 130, 129)"],["\u6DF1\u6D77\u5E7D\u57DF","rgb(69, 183, 209)"]];function Te(s){let e=s.replace(/\s+-\s+LINUX DO(?:\s.*)?$/i,""),t=e.lastIndexOf(" - "),i=e.slice(t<0?0:t+3).trim(),n=Xe.find(([a])=>i===a||i.startsWith(`${a} /`)||i.startsWith(`${a},`));return n?{name:n[0],color:n[1]}:null}var Et={settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.95 4.6 1.7 1.7 0 0 0 9.98 3.04V3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>',split:'<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/><path d="M12 9v6m-3-3h6"/>',external:'<path d="M15 4h5v5M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',refresh:'<path d="M20 6v5h-5"/><path d="M19 11a7 7 0 1 0 1 5"/>',copy:'<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',bookmark:'<path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',"bookmark-filled":'<path class="ldu-symbol-fill" d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',"close-others":'<rect x="3" y="5" width="13" height="12" rx="2"/><path d="M8 3h10a3 3 0 0 1 3 3v8"/><path d="m18 16 4 4m0-4-4 4"/>',list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',"tab-list":'<path d="m4 6 5 6-5 6M11 6h9M11 12h9M11 18h9"/>',check:'<path d="m5 12 4 4L19 6"/>',maximize:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',restore:'<path d="M9 9H4V4M15 9h5V4M9 15H4v5M15 15h5v5"/>',trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',"thumbs-up":'<path d="M7 10v11M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7A2 2 0 0 1 17.5 21H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z"/>',"thumbs-down":'<path d="M17 14V3M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.6l2.3-7A2 2 0 0 1 6.5 3H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9Z"/>',github:'<path d="M15 22v-3.9c.04-1-.35-1.76-.8-2.2 2.6-.3 5.3-1.27 5.3-5.75A4.5 4.5 0 0 0 18.3 7c.12-.3.52-1.53-.12-3.18 0 0-.98-.31-3.2 1.2a11.1 11.1 0 0 0-5.83 0c-2.22-1.51-3.2-1.2-3.2-1.2C5.3 5.47 5.7 6.7 5.82 7a4.5 4.5 0 0 0-1.2 3.15c0 4.47 2.72 5.46 5.32 5.75-.34.3-.64.82-.75 1.59-.67.3-2.37.82-3.42-.98 0 0-.62-1.13-1.8-1.21M9 19c-2.25 1-2.5-1-3.5-1.5"/>',gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M7.5 8C6.1 8 5 7 5 5.7S6.1 3.5 7.5 3.5C9.6 3.5 12 8 12 8s2.4-4.5 4.5-4.5C17.9 3.5 19 4.4 19 5.7S17.9 8 16.5 8"/>'};function E(s,e=20){return`<svg class="ldu-symbol ldu-symbol-${s}" viewBox="0 0 24 24" width="${e}" height="${e}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${Et[s]}</svg>`}function C(s,e,t=20){s.innerHTML=E(e,t)}function Je(s,e,t=18){let i=s.createElement("span");return i.className="ldu-context-icon",i.innerHTML=E(e,t),i}var R=new WeakMap;function Qe(s){s.querySelectorAll(":scope > .ldu-tab-item[data-tab-id]").forEach(e=>{e.classList.remove("is-dragging","is-drop-before","is-drop-after"),e.setAttribute("aria-grabbed","false"),e.style.transform=""}),s.classList.remove("is-reordering")}function kt(s){let e=document.createElement("div");e.className="ldu-tab-item",e.setAttribute("role","presentation"),e.setAttribute("aria-grabbed","false"),e.addEventListener("contextmenu",r=>{let o=e.dataset.tabId,l=R.get(s);!o||!l||(r.preventDefault(),r.stopPropagation(),l.callbacks.onContextMenu?.(o,r.clientX,r.clientY))}),e.addEventListener("auxclick",r=>{if(r.button!==1)return;let o=e.dataset.tabId,l=R.get(s);!o||!l||(r.preventDefault(),r.stopPropagation(),l.callbacks.onClose(o))});let t=document.createElement("button");t.type="button",t.className="ldu-tab-button",t.setAttribute("role","tab");let i=document.createElement("span");i.className="ldu-tab-glyph",C(i,"list",15);let n=document.createElement("span");n.className="ldu-tab-title",t.append(i,n),t.addEventListener("click",()=>{let r=e.dataset.tabId,o=R.get(s);r&&o&&o.callbacks.onActivate(r)}),t.addEventListener("keydown",r=>{let o=e.dataset.tabId,l=R.get(s);if(!o||!l)return;let u=[...s.querySelectorAll(":scope > .ldu-tab-item[data-tab-id]")],h=u.findIndex(O=>O.dataset.tabId===o);if(h<0)return;let c=s.classList.contains("is-vertical"),d=c?"ArrowUp":"ArrowLeft",m=c?"ArrowDown":"ArrowRight",g=h;if(r.key===d||r.key===m)r.preventDefault(),g=(h+(r.key===m?1:-1)+u.length)%u.length;else if(r.key==="Home"||r.key==="End")r.preventDefault(),g=r.key==="Home"?0:u.length-1;else if(r.key==="Delete"){r.preventDefault(),l.callbacks.onClose(o);return}else return;let k=u[g];k?.dataset.tabId&&(l.callbacks.onActivate(k.dataset.tabId),k.querySelector(".ldu-tab-button")?.focus())});let a=document.createElement("button");return a.type="button",a.className="ldu-tab-close",a.draggable=!1,C(a,"close",16),a.title="\u5173\u95ED\u5E16\u5B50\u6807\u7B7E",a.addEventListener("click",r=>{r.stopPropagation();let o=e.dataset.tabId,l=R.get(s);o&&l&&l.callbacks.onClose(o)}),e.append(t,a),e}function Mt(s,e,t,i){let n=e.id===t,a=e.title||`\u4E3B\u9898 ${e.topicId}`;s.dataset.tabId=e.id,s.draggable=!!i.onReorder,s.classList.toggle("is-active",n),s.title=`${e.title}
${e.url}`;let r=Te(e.title);s.dataset.categoryGroup=r?.name??"other",r?s.style.setProperty("--ldu-tab-category-color",r.color):s.style.removeProperty("--ldu-tab-category-color");let o=s.querySelector(".ldu-tab-button");o.querySelector(".ldu-tab-title").textContent=a,o.id=`ldu-tab-${e.id}`,o.setAttribute("aria-selected",String(n)),o.tabIndex=n?0:-1,o.setAttribute("aria-label",`\u6253\u5F00 ${a}`),s.querySelector(".ldu-tab-close")?.setAttribute("aria-label",`\u5173\u95ED ${a}`)}function Lt(s){let e=document.createElement("div");e.className="ldu-tab-group-header",e.dataset.groupKey=s,e.setAttribute("role","presentation");let t=document.createElement("span");t.className="ldu-tab-group-marker";let i=document.createElement("span");return i.className="ldu-tab-group-label",e.append(t,i),e}function xe(s,e,t,i,n={}){R.set(s,{tabs:e,callbacks:i}),Qe(s);let a=n.orientation==="vertical"?"vertical":"horizontal",r=a==="vertical"&&n.groupByCategory===!0;s.classList.toggle("is-vertical",a==="vertical"),s.classList.toggle("is-grouped",r),s.setAttribute("aria-orientation",a),s.classList.toggle("is-category-colors-enabled",n.colorizeTabs!==!1);let o=null,l=null,u=null,h=null,c=()=>{Qe(s),o=null,l=null,u=null,h=null},d=p=>{if(!o||!u)return;let b=u.find(y=>y.tabId===o);if(!b)return;let T=u.filter(y=>y.tabId!==o),w=T.filter(y=>p>=y.center).length;if(w===h)return;h=w;let x=w;for(let y of u){let M=0;x>b.index&&y.index>b.index&&y.index<=x?M=-b.shift:x<b.index&&y.index>=x&&y.index<b.index&&(M=b.shift),y.item.style.transform=M?a==="vertical"?`translate3d(0, ${M}px, 0)`:`translate3d(${M}px, 0, 0)`:"",y.item.classList.remove("is-drop-before","is-drop-after")}let S=x===0?T[0]:T[x-1];if(!S){l=null;return}let A=x===0?"before":"after";S.item.classList.add(A==="before"?"is-drop-before":"is-drop-after"),l={tabId:S.tabId,position:A}};s.ondragstart=p=>{if(!i.onReorder||!(p.target instanceof Element)||p.target.closest(".ldu-tab-close")){p.preventDefault();return}let b=p.target.closest(".ldu-tab-item[data-tab-id]");if(!b?.dataset.tabId)return;o=b.dataset.tabId;let T=b.dataset.categoryGroup,w=[...s.querySelectorAll(".ldu-tab-item[data-tab-id]")].filter(S=>!r||S.dataset.categoryGroup===T),x=w.map(S=>S.getBoundingClientRect());if(u=w.map((S,A)=>{let y=x[A],M=x[A+1],oe=x[A-1],Ie=a==="vertical"?y.top:y.left,ot=a==="vertical"?y.bottom:y.right,Pe=a==="vertical"?y.height:y.width,Ce=M?a==="vertical"?M.top:M.left:null,Ae=oe?a==="vertical"?oe.bottom:oe.right:null,lt=Ce!==null?Math.max(0,Ce-ot):Ae!==null?Math.max(0,Ie-Ae):0;return{tabId:S.dataset.tabId,item:S,index:A,center:Ie+Pe/2,shift:Pe+lt}}),s.classList.add("is-reordering"),b.classList.add("is-dragging"),b.setAttribute("aria-grabbed","true"),p.dataTransfer?.setData("text/plain",o),p.dataTransfer){p.dataTransfer.effectAllowed="move";let S=b.getBoundingClientRect();p.dataTransfer.setDragImage(b,Math.max(0,p.clientX-S.left),Math.max(0,p.clientY-S.top))}},s.ondragover=p=>{if(!o||!u)return;p.preventDefault(),p.dataTransfer&&(p.dataTransfer.dropEffect="move");let b=a==="vertical"?p.clientY:p.clientX;Number.isFinite(b)&&d(b)},s.ondrop=p=>{if(!o||!u)return;p.preventDefault();let b=a==="vertical"?p.clientY:p.clientX;if(Number.isFinite(b)&&d(b),!l){c();return}let T=o,w=l;c(),i.onReorder?.(T,w.tabId,w.position)},s.ondragend=c;let m=new Set(e.map(p=>p.id)),g=new Map([...s.querySelectorAll(":scope > .ldu-tab-item[data-tab-id]")].map(p=>[p.dataset.tabId,p]));for(let[p,b]of g)m.has(p)||(b.remove(),g.delete(p));let k=e.map(p=>{let b=g.get(p.id)??kt(s);return Mt(b,p,t,i),b}),O=new Map([...s.querySelectorAll(":scope > .ldu-tab-group-header[data-group-key]")].map(p=>[p.dataset.groupKey,p])),ae=[];if(r){let p=new Map;e.forEach((b,T)=>{let w=Te(b.title),x=w?.name??"other",S=p.get(x)??{label:w?.name??"\u5176\u4ED6",color:w?.color??null,items:[]};S.items.push(k[T]),p.set(x,S)});for(let[b,T]of p){let w=O.get(b)??Lt(b);w.querySelector(".ldu-tab-group-label").textContent=`${T.label} ${T.items.length}`,T.color?w.style.setProperty("--ldu-tab-category-color",T.color):w.style.removeProperty("--ldu-tab-category-color"),ae.push(w,...T.items),O.delete(b)}}else ae.push(...k);O.forEach(p=>p.remove());let re=s.firstElementChild;for(let p of ae)p!==re&&s.insertBefore(p,re),re=p.nextElementSibling}var Ze="linuxdo-ultimate-styles";var It=`
:root {
  --ldu-sidebar-width: 216px;
  --ldu-topic-track: 0.65fr;
  --ldu-list-track: 0.35fr;
  /* Set by LayoutController from the rendered Discourse header. */
  --ldu-header-height: var(--header-height, 0px);
  --ldu-border: var(--primary-low, #d9d9d9);
  --ldu-surface: var(--secondary, #fff);
  --ldu-surface-muted: var(--primary-very-low, #f5f5f5);
  --ldu-text: var(--primary, #222);
  --ldu-accent: var(--tertiary, #0088cc);
  --ldu-danger: var(--danger, #d04437);
  --ldu-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ldu-vertical-tabs-collapsed: calc(var(--font-0, 1rem) * 2.75);
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

body.ldu-layout-active {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

html.ldu-layout-two-root {
  scrollbar-width: none;
}

html.ldu-layout-two-root::-webkit-scrollbar {
  width: 0;
  height: 0;
}

body.ldu-layout-active #main-container {
  width: 100% !important;
  max-width: none !important;
  padding-inline: 0 !important;
}

body.ldu-layout-active .d-header .wrap,
body.ldu-layout-active .d-header .contents {
  width: 100% !important;
  max-width: none !important;
}

body.ldu-layout-active .d-header .wrap {
  padding-inline: 8px !important;
}

body.ldu-layout-active #main-outlet-wrapper {
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  min-height: calc(100vh - var(--ldu-header-height)) !important;
  padding: 0 !important;
}

#ldu-layout-shell {
  position: fixed;
  z-index: 3;
  inset: var(--ldu-header-height) 0 0;
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  pointer-events: none;
}

#ldu-layout-shell[hidden] { display: none !important; }

body.ldu-layout-active.ldu-layout-three #ldu-layout-shell {
  grid-template-columns: var(--ldu-sidebar-width) minmax(0, var(--ldu-topic-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "sidebar topic list" !important;
}

body.ldu-layout-active.ldu-layout-three:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-topic-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "topic list" !important;
}

body.ldu-layout-active.ldu-layout-three.ldu-secondary-open #ldu-layout-shell {
  grid-template-columns: var(--ldu-sidebar-width) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "sidebar topic secondary-topic list" !important;
}

body.ldu-layout-active.ldu-layout-three.ldu-secondary-open:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "topic secondary-topic list" !important;
}

body.ldu-layout-active.ldu-layout-two #ldu-layout-shell {
  grid-template-columns: minmax(52px, var(--ldu-sidebar-width)) minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-track)) !important;
  grid-template-areas: "sidebar list topic" !important;
}

body.ldu-layout-active.ldu-layout-two:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-track)) !important;
  grid-template-areas: "list topic" !important;
}

body.ldu-layout-active.ldu-layout-two.ldu-secondary-open #ldu-layout-shell {
  grid-template-columns: minmax(52px, var(--ldu-sidebar-width)) minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) !important;
  grid-template-areas: "sidebar list topic secondary-topic" !important;
}

body.ldu-layout-active.ldu-layout-two.ldu-secondary-open:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) !important;
  grid-template-areas: "list topic secondary-topic" !important;
}

body.ldu-layout-active #main-outlet-wrapper > .sidebar-wrapper {
  position: fixed !important;
  z-index: 6;
  top: var(--ldu-header-height) !important;
  bottom: 0;
  left: 0;
  width: var(--ldu-sidebar-width) !important;
  min-width: 0 !important;
  height: calc(100vh - var(--ldu-header-height)) !important;
  max-height: none !important;
  overflow: auto !important;
  background: var(--ldu-surface);
  border-right: 1px solid var(--ldu-border);
}

body.ldu-layout-active:not(.has-sidebar-page) #main-outlet-wrapper > .sidebar-wrapper {
  display: none !important;
}

body.ldu-layout-active #main-outlet {
  display: none !important;
}

.ldu-list-content {
  position: relative;
  grid-area: list;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  pointer-events: auto;
  background: var(--ldu-surface);
  border-inline: 1px solid var(--ldu-border);
}

.ldu-list-content.is-native-handoff {
  overflow: auto;
  overscroll-behavior: contain;
}

.ldu-list-content.is-native-handoff > #main-outlet {
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  min-height: 100% !important;
  margin: 0 !important;
  padding-inline: 8px !important;
  box-sizing: border-box;
}

.ldu-list-content.is-native-handoff > .ldu-list-frame {
  visibility: hidden;
  pointer-events: none;
}

.ldu-list-frame {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-height: none !important;
  border: 0;
  background: var(--ldu-surface);
}

@container (max-width: 480px) {
  #main-outlet .topic-list .views { display: none !important; }
  #main-outlet .topic-list .topic-list-data { padding-inline: 6px !important; }
}

@container (max-width: 410px) {
  #main-outlet .topic-list .activity { display: none !important; }
  #main-outlet .topic-list .main-link { width: 100% !important; }
}

#ldu-topic-panel,
#ldu-secondary-topic-panel {
  grid-area: topic;
  position: sticky;
  top: var(--ldu-header-height);
  display: flex;
  height: calc(100vh - var(--ldu-header-height));
  min-width: 0;
  min-height: 0;
  align-self: start;
  flex-direction: column;
  overflow: hidden;
  background: var(--ldu-surface);
  color: var(--ldu-text);
  border-inline: 1px solid var(--ldu-border);
  container-type: inline-size;
}

#ldu-layout-shell #ldu-topic-panel,
#ldu-layout-shell #ldu-secondary-topic-panel {
  position: relative;
  top: auto;
  width: auto;
  height: 100%;
  pointer-events: auto;
}

#ldu-topic-panel[hidden],
#ldu-secondary-topic-panel[hidden] { display: none !important; }

#ldu-secondary-topic-panel {
  grid-area: secondary-topic;
  border-left: 0;
}

body.ldu-layout-three:not(.has-sidebar-page) #ldu-topic-panel { border-left: 0; }
body.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel,
body.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel { border-right: 0; }

.ldu-topic-toolbar {
  display: flex;
  min-height: 38px;
  align-items: center;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
}

/* Vertical rails have four explicit states: left/right and auto/static. */
body.ldu-tabs-vertical #ldu-topic-panel,
body.ldu-tabs-vertical #ldu-secondary-topic-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
}

body.ldu-tabs-vertical .ldu-topic-content {
  grid-row: 1;
}

body.ldu-tabs-vertical .ldu-topic-toolbar {
  z-index: 4;
  grid-row: 1;
  display: flex;
  width: min(17rem, max(10rem, calc(100cqi - .75rem)));
  min-height: 0;
  height: 100%;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  border-right: 1px solid var(--ldu-border);
  box-shadow: 4px 0 14px rgb(0 0 0 / 12%);
  transition: clip-path 180ms var(--ldu-ease-out), opacity 180ms ease-out;
  transition-delay: 180ms;
}

/* Detail in the middle: keep the compact rail on the left. */
body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-topic-panel,
body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-secondary-topic-panel {
  grid-template-columns: var(--ldu-vertical-tabs-collapsed) minmax(0, 1fr);
}

body.ldu-tabs-vertical:not(.ldu-layout-two) .ldu-topic-toolbar {
  position: relative;
  grid-column: 1;
  clip-path: inset(0 calc(100% - var(--ldu-vertical-tabs-collapsed)) 0 0);
}

body.ldu-tabs-vertical:not(.ldu-layout-two) .ldu-topic-content {
  grid-column: 2;
}

/* Detail on the right: overlay the compact rail on the iframe scrollbar. */
body.ldu-tabs-vertical.ldu-layout-two #ldu-topic-panel,
body.ldu-tabs-vertical.ldu-layout-two #ldu-secondary-topic-panel {
  grid-template-columns: minmax(0, 1fr);
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-toolbar {
  position: absolute;
  inset-block: 0;
  right: 0;
  border-right: 0;
  border-left: 1px solid var(--ldu-border);
  clip-path: inset(0 0 0 calc(100% - var(--ldu-vertical-tabs-collapsed)));
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-content {
  grid-column: 1;
}

body.ldu-tabs-vertical .ldu-topic-toolbar:hover,
body.ldu-tabs-vertical .ldu-topic-toolbar:has(:focus-visible),
body.ldu-tabs-vertical .ldu-topic-toolbar.is-interaction-locked,
body.ldu-tabs-vertical .ldu-topic-toolbar:has(.ldu-tab-strip.is-reordering) {
  clip-path: inset(0);
  transition-delay: 80ms;
}

/* Fixed left rail. */
body.ldu-tabs-vertical.ldu-vertical-tabs-static:not(.ldu-layout-two) #ldu-topic-panel,
body.ldu-tabs-vertical.ldu-vertical-tabs-static:not(.ldu-layout-two) #ldu-secondary-topic-panel {
  grid-template-columns: min(17rem, max(10rem, 46%)) minmax(0, 1fr);
}

/* Fixed right rail. */
body.ldu-tabs-vertical.ldu-layout-two.ldu-vertical-tabs-static #ldu-topic-panel,
body.ldu-tabs-vertical.ldu-layout-two.ldu-vertical-tabs-static #ldu-secondary-topic-panel {
  grid-template-columns: minmax(0, 1fr) min(17rem, max(10rem, 46%));
}

body.ldu-tabs-vertical.ldu-vertical-tabs-static .ldu-topic-toolbar {
  position: relative;
  width: 100%;
  clip-path: inset(0);
  transition: none;
}

body.ldu-tabs-vertical.ldu-layout-two.ldu-vertical-tabs-static .ldu-topic-toolbar {
  right: auto;
  grid-column: 2;
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-actions {
  justify-content: flex-end;
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-vertical-tabs-heading {
  justify-content: flex-end;
  padding-right: 7px;
  padding-left: 0;
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-vertical-tabs-heading > .ldu-symbol {
  order: 2;
  transform: scaleX(-1);
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-vertical-tabs-heading-label {
  text-align: right;
}

body.ldu-tabs-vertical .ldu-tab-title,
body.ldu-tabs-vertical .ldu-tab-group-label {
  text-align: start;
}

body.ldu-tabs-vertical .ldu-topic-toolbar .ldu-tab-strip {
  flex-direction: column;
  min-height: 0;
  align-items: stretch;
  gap: .35em;
  padding: .55em .35em;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-toolbar .ldu-tab-strip {
  scrollbar-width: none;
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-toolbar .ldu-tab-strip::-webkit-scrollbar {
  display: none;
}

body.ldu-tabs-vertical .ldu-topic-toolbar .ldu-topic-actions {
  order: -1;
  justify-content: flex-start;
  min-height: 2.75em;
  border-bottom: 1px solid var(--ldu-border);
}

.ldu-vertical-tabs-heading { display: none; }

body.ldu-tabs-vertical .ldu-vertical-tabs-heading {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8px;
  padding-left: 7px;
  color: var(--primary-medium, #777);
  font-size: var(--font-down-1, .875rem);
  font-weight: 600;
  white-space: nowrap;
}

body.ldu-tabs-vertical .ldu-tab-item {
  position: relative;
  width: auto;
  min-width: 0;
  max-width: none;
  min-height: 2.75em;
  flex: 0 0 2.75em;
  border: 0;
  border-radius: .35em;
  font-size: var(--font-0, 1rem);
}

body.ldu-tabs-vertical .ldu-tab-button {
  display: flex;
  min-height: 2.75em;
  align-items: center;
  gap: .625em;
  padding: .625em .5em .625em .75em;
  font-size: var(--font-0, 1rem);
}

.ldu-tab-glyph {
  display: none;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  place-items: center;
  color: var(--ldu-tab-category-color, var(--primary-medium, #777));
}

body.ldu-tabs-vertical .ldu-tab-glyph { display: inline-grid; }

body.ldu-tabs-vertical .ldu-tab-close {
  width: 1.75em;
  height: 1.75em;
  margin-right: .25em;
}

body.ldu-tabs-vertical .ldu-tab-close .ldu-symbol {
  width: 1em;
  height: 1em;
}

.ldu-tab-title {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (hover: none) {
  body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-topic-panel,
  body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-secondary-topic-panel {
    grid-template-columns: min(17rem, max(10rem, 46%)) minmax(0, 1fr);
  }

  body.ldu-tabs-vertical.ldu-layout-two #ldu-topic-panel,
  body.ldu-tabs-vertical.ldu-layout-two #ldu-secondary-topic-panel {
    grid-template-columns: minmax(0, 1fr) min(17rem, max(10rem, 46%));
  }

  body.ldu-tabs-vertical .ldu-topic-toolbar {
    position: relative;
    width: 100%;
    clip-path: inset(0);
    transition: none;
  }

  body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-toolbar {
    right: auto;
    grid-column: 2;
  }
}

body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-title,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-close,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-group-label,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-vertical-tabs-heading-label {
  visibility: hidden;
}

body.ldu-tabs-vertical .ldu-tab-item.is-active {
  box-shadow: inset 3px 0 0 var(--ldu-accent);
}

body.ldu-tabs-vertical .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active {
  background: color-mix(in srgb, var(--ldu-tab-category-color) 22%, var(--ldu-surface));
  box-shadow: inset 3px 0 0 color-mix(in srgb, var(--ldu-tab-category-color) 88%, var(--ldu-text));
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-tab-item.is-active {
  box-shadow: inset -3px 0 0 var(--ldu-accent);
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active {
  box-shadow: inset -3px 0 0 color-mix(in srgb, var(--ldu-tab-category-color) 88%, var(--ldu-text));
}

.ldu-tab-group-header {
  display: flex;
  min-height: 26px;
  align-items: center;
  gap: 7px;
  padding: 6px 8px 2px;
  color: var(--primary-medium, #777);
  font-size: var(--font-down-1, .875rem);
  font-weight: 600;
  letter-spacing: 0;
  white-space: nowrap;
}

.ldu-tab-group-marker {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: var(--ldu-tab-category-color, var(--primary-medium, #777));
}

.ldu-tab-group-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-tab-group-header {
  padding-left: 18px;
}

body.ldu-tabs-vertical .ldu-tab-item.is-drop-before::before,
body.ldu-tabs-vertical .ldu-tab-item.is-drop-after::after {
  top: auto;
  bottom: auto;
  left: 5px;
  right: 5px;
  width: auto;
  height: 2px;
}

body.ldu-tabs-vertical .ldu-tab-item.is-drop-before::before { top: -2px; }
body.ldu-tabs-vertical .ldu-tab-item.is-drop-after::after { bottom: -2px; }

@media (prefers-reduced-motion: reduce) {
  body.ldu-tabs-vertical .ldu-topic-toolbar { transition-duration: .01ms; }
}

.ldu-tab-strip {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: stretch;
  gap: 3px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.ldu-tab-item {
  --ldu-tab-category-color: transparent;
  display: flex;
  width: auto;
  min-width: 72px;
  max-width: 220px;
  flex: 1 1 0;
  align-items: center;
  box-sizing: border-box;
  border-inline: 1px solid color-mix(in srgb, var(--ldu-border) 72%, transparent);
  background: transparent;
}

.ldu-tab-strip.is-category-colors-enabled .ldu-tab-item {
  background: color-mix(in srgb, var(--ldu-tab-category-color) 14%, transparent);
}

.ldu-tab-item.is-active {
  background: var(--ldu-surface);
  box-shadow: inset 0 -3px 0 var(--ldu-accent);
}

.ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active {
  background: color-mix(in srgb, var(--ldu-tab-category-color) 22%, var(--ldu-surface));
  box-shadow: inset 0 -3px 0 color-mix(in srgb, var(--ldu-tab-category-color) 88%, var(--ldu-text));
}

.ldu-tab-context-menu {
  position: fixed;
  z-index: 1000002;
  width: max-content;
  min-width: 270px;
  max-width: min(340px, calc(100vw - 16px));
  padding: 6px 0;
  overflow: hidden;
  color: var(--primary, #202124);
  border: 1px solid color-mix(in srgb, var(--primary, #202124) 14%, transparent);
  border-radius: 6px;
  background: var(--secondary, #fff);
  box-shadow: 0 8px 24px rgb(0 0 0 / 24%), 0 2px 6px rgb(0 0 0 / 18%);
  font-family: var(--font-family, Arial, sans-serif);
  font-size: var(--font-down-1, 0.875rem);
}

.ldu-context-item {
  display: grid;
  width: 100%;
  min-height: 32px;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 10px;
  padding: 5px 18px;
  color: inherit;
  border: 0;
  background: transparent;
  font: inherit;
  letter-spacing: 0;
  text-align: left;
  white-space: nowrap;
  cursor: default;
}

.ldu-context-item:hover,
.ldu-context-item:focus-visible { background: var(--primary-low, #e8eaed); outline: none; }
.ldu-context-item:disabled { opacity: 0.42; }
.ldu-context-icon { display: inline-flex; width: 18px; flex: none; align-items: center; justify-content: center; color: var(--primary-medium, #5f6368); pointer-events: none; }
.ldu-context-label { min-width: 0; justify-self: start; text-align: left; }
.ldu-context-item:disabled .ldu-context-icon { opacity: .75; }
.ldu-symbol { display: block; flex: none; pointer-events: none; }
.ldu-symbol-fill { fill: currentColor; }

.ldu-tab-item[draggable="true"] { cursor: grab; }
.ldu-tab-strip.is-reordering .ldu-tab-item {
  will-change: transform;
  transition: transform 150ms cubic-bezier(.2, .8, .2, 1), opacity 100ms ease-out;
}
.ldu-tab-item.is-dragging { cursor: grabbing; opacity: .52; }
.ldu-tab-item.is-drop-before::before,
.ldu-tab-item.is-drop-after::after {
  position: absolute;
  z-index: 2;
  top: 3px;
  bottom: 3px;
  width: 2px;
  border-radius: 1px;
  background: var(--ldu-accent);
  content: "";
  pointer-events: none;
}
.ldu-tab-item.is-drop-before::before { left: -3px; }
.ldu-tab-item.is-drop-after::after { right: -3px; }

@media (prefers-reduced-motion: reduce) {
  .ldu-tab-strip.is-reordering .ldu-tab-item { transition-duration: .01ms; }
}
.ldu-context-shortcut { justify-self: end; color: var(--primary-medium, #5f6368); }
.ldu-context-separator { height: 1px; margin: 5px 0; background: var(--primary-low, #dadce0); }

.ldu-tab-button {
  min-width: 0;
  flex: 1;
  padding: 7px 6px 7px 10px;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: var(--ldu-text);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-down-1, .875rem);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ldu-tab-close {
  display: grid;
  width: 24px;
  height: 24px;
  margin-right: 2px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--primary-medium, #777);
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .ldu-tab-item:hover { background: var(--primary-low, #ddd); }
  .ldu-tab-item.is-active:hover { background: var(--ldu-surface); }
  .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item:hover { background: color-mix(in srgb, var(--ldu-tab-category-color) 18%, var(--primary-low, #ddd)); }
  .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active:hover { background: color-mix(in srgb, var(--ldu-tab-category-color) 24%, var(--ldu-surface)); }
  .ldu-tab-close:hover { background: var(--ldu-danger); color: #fff; }
}

.ldu-topic-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  padding-inline: 4px;
}

.ldu-icon-button {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--ldu-text);
  cursor: pointer;
  transition: background-color 120ms ease, transform 120ms var(--ldu-ease-out);
}

.ldu-icon-button:active { transform: scale(0.97); }
.ldu-icon-button:focus-visible { outline: 2px solid var(--ldu-accent); outline-offset: 1px; }

@media (hover: hover) and (pointer: fine) {
  .ldu-icon-button:hover { background: var(--primary-low, #ddd); }
}

.ldu-topic-content {
  position: relative;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background: var(--ldu-surface);
}

.ldu-topic-empty {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--primary-medium, #777);
  font-size: 13px;
}

.ldu-topic-frame {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-height: none !important;
  border: 0;
  background: var(--ldu-surface);
}

.ldu-topic-frame[aria-hidden="true"] { display: none; }

.ldu-resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 5;
  width: 7px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: col-resize;
  touch-action: none;
}

.ldu-resize-handle::after {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 1px;
  background: transparent;
  content: "";
  transition: background-color 120ms ease;
}

.ldu-resize-handle:focus-visible::after,
.ldu-resize-handle:hover::after { background: var(--ldu-accent); }
.ldu-resize-before { left: -4px; }
.ldu-resize-after { right: -4px; }
body.ldu-layout-two .ldu-resize-after { display: none; }
body.ldu-layout-three:not(.has-sidebar-page) .ldu-resize-before { display: none; }


.ldu-settings-panel {
  position: fixed;
  top: calc(var(--ldu-header-height) + 4px);
  right: 8px;
  z-index: 1000001;
  display: block;
  width: min(520px, calc(100vw - 16px));
  box-sizing: border-box;
  color: var(--ldu-text);
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  transform-origin: top right;
  transition: opacity 140ms ease, transform 160ms var(--ldu-ease-out);
}

.ldu-settings-panel[hidden] { display: none; }

@starting-style {
  .ldu-settings-panel:not([hidden]) {
    opacity: 0;
    transform: translateY(-4px) scale(.98);
  }
}

.ldu-settings-host {
  position: relative;
  z-index: 1000001;
  display: inline-flex;
  align-items: center;
  list-style: none;
}

.ldu-settings-host .ldu-icon-button {
  width: 32px;
  height: 32px;
  color: var(--header_primary, var(--ldu-text));
  font-size: var(--font-0, 1rem);
}

.ldu-settings-panel .dc-modal {
  display: flex;
  width: 100%;
  max-height: inherit;
  flex-direction: column;
  overflow: visible;
  border: 1px solid var(--ldu-border);
  border-radius: 6px;
  background: var(--ldu-surface);
  box-shadow: 0 16px 36px rgb(0 0 0 / 55%);
}

.ldu-settings-panel .dc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
}

.ldu-settings-panel .dc-header h2 {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 0;
  padding: 0;
  color: var(--ldu-text);
  font-size: var(--font-up-1, 1.05rem);
  font-weight: 700;
  line-height: 1.3;
}

.ldu-settings-panel .ldu-brand-ultimate {
  color: #ffd43b;
  text-shadow: 0 1px 0 rgb(0 0 0 / 35%);
}

.ldu-settings-panel .ldu-settings-version {
  margin-left: 6px;
  color: var(--primary-medium, #8b949e);
  font-size: var(--font-down-2, .75rem);
  font-weight: 500;
  letter-spacing: 0;
}

.ldu-settings-panel .dc-close-btn {
  padding: 2px 6px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--primary-medium, #777);
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
}

.ldu-settings-panel .dc-close-btn:hover { background: var(--primary-low, #2a2d32); color: var(--ldu-text); }

.ldu-settings-panel .dc-body { padding: 18px 20px; }

.ldu-settings-panel .dc-group { margin-bottom: 24px; padding: 0; border-top: 0; }
.ldu-settings-panel .dc-group:last-child { margin-bottom: 0; }

.ldu-settings-panel .dc-group-title {
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--ldu-border);
  color: var(--ldu-text);
  font-size: var(--font-up-1, 1.125rem);
  font-weight: 700;
  letter-spacing: 0;
}

.ldu-settings-panel .dc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ldu-border) 34%, transparent);
}

.ldu-settings-panel .dc-row:last-child { border-bottom: 0; }
.ldu-settings-panel .dc-dependent-row[hidden] { display: none; }
.ldu-settings-panel .ldu-settings-parent-group {
  border-bottom: 1px solid color-mix(in srgb, var(--ldu-border) 34%, transparent);
}
.ldu-settings-panel .ldu-settings-parent-group > .dc-row,
.ldu-settings-panel .ldu-settings-parent-group .ldu-settings-tree,
.ldu-settings-panel .ldu-settings-parent-group .ldu-settings-tree-row { border-bottom: 0; }
.ldu-settings-panel .ldu-settings-tree {
  position: relative;
  margin-left: 10px;
  padding-left: 22px;
}
.ldu-settings-panel .ldu-settings-tree::before {
  position: absolute;
  top: -12px;
  left: 0;
  height: 12px;
  border-left: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  content: "";
}
.ldu-settings-panel .ldu-settings-tree-row { position: relative; }
.ldu-settings-panel .ldu-settings-tree-row::before {
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: -22px;
  border-left: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  content: "";
}
.ldu-settings-panel .ldu-settings-tree-row::after {
  position: absolute;
  top: 50%;
  left: -22px;
  width: 12px;
  border-top: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  content: "";
}
.ldu-settings-panel .ldu-settings-tree-row:last-child::before {
  width: 12px;
  bottom: 50%;
  border-bottom: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  border-bottom-left-radius: 4px;
}
.ldu-settings-panel .ldu-settings-tree-row:last-child::after { display: none; }
.ldu-settings-panel .dc-label-box { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.ldu-settings-panel .dc-item-title { color: var(--ldu-text); font-size: var(--font-down-1, .875rem); font-weight: 600; line-height: 1.3; }
.ldu-settings-panel .dc-item-desc { color: var(--primary-medium, #8b949e); font-size: var(--font-down-2, .75rem); line-height: 1.35; }
.ldu-settings-panel .dc-item-desc.alert { color: var(--danger, #f85149); }
.ldu-settings-panel .ldu-settings-risk[hidden] { display: none; }
.ldu-settings-panel .ldu-settings-compact-row { min-height: 42px; }
.ldu-settings-panel .ldu-settings-check-grid { display: flex; flex: none; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px 14px; }
.ldu-settings-panel .ldu-settings-check { display: inline-flex; align-items: center; gap: 5px; color: var(--primary-medium, #8b949e); cursor: pointer; font-size: var(--font-down-2, .75rem); line-height: 1.2; white-space: nowrap; }
.ldu-settings-panel .ldu-settings-check input { width: 14px; height: 14px; margin: 0; accent-color: var(--ldu-accent); cursor: pointer; }

.ldu-settings-panel .dc-switch { position: relative; display: inline-block; width: 38px; height: 20px; flex: none; }
.ldu-settings-panel .dc-switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.ldu-settings-panel .dc-slider { position: absolute; inset: 0; border: 1px solid color-mix(in srgb, var(--primary-medium, #777) 70%, transparent); border-radius: 20px; background: color-mix(in srgb, var(--primary-medium, #777) 42%, transparent); cursor: pointer; transition: background-color 150ms ease, border-color 150ms ease; }
.ldu-settings-panel .dc-slider::before { position: absolute; width: 14px; height: 14px; bottom: 2px; left: 2px; border-radius: 50%; background: #d1d5db; content: ""; transition: transform 150ms var(--ldu-ease-out), background-color 150ms ease; }
.ldu-settings-panel .dc-switch input:checked + .dc-slider { border-color: var(--tertiary, #3b8ce0); background: var(--tertiary, #2d7ed2); }
.ldu-settings-panel .dc-switch input:checked + .dc-slider::before { transform: translateX(18px); background: #fff; }

.ldu-settings-panel .dc-pills { display: inline-flex; flex: none; padding: 2px; border: 1px solid var(--ldu-border); border-radius: 4px; background: var(--ldu-surface-muted); }
.ldu-settings-panel .dc-pill-btn { padding: 3px 9px; border: 0; border-radius: 2px; background: transparent; color: var(--primary-medium, #8b949e); cursor: pointer; font: inherit; font-size: var(--font-down-2, .75rem); font-weight: 500; transition: background-color 100ms ease, color 100ms ease, transform 100ms ease; }
.ldu-settings-panel .dc-pill-btn:hover { color: var(--ldu-text); }
.ldu-settings-panel .dc-pill-btn.active { background: color-mix(in srgb, var(--ldu-text) 10%, var(--ldu-surface-muted)); color: var(--ldu-text); font-weight: 600; }

.ldu-settings-panel .dc-range-group { display: flex; min-width: 0; flex: none; align-items: center; gap: 10px; }
.ldu-settings-panel .dc-range { width: 100px; height: 4px; margin: 0; border-radius: 2px; outline: 0; appearance: none; background: color-mix(in srgb, var(--primary-medium, #777) 42%, transparent); cursor: pointer; }
.ldu-settings-panel .dc-range::-webkit-slider-thumb { width: 14px; height: 14px; border: 0; border-radius: 2px; appearance: none; background: var(--ldu-accent); cursor: pointer; }
.ldu-settings-panel .dc-range::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 2px; background: var(--ldu-accent); cursor: pointer; }
.ldu-settings-panel .dc-range-number { min-width: 16px; color: var(--ldu-accent); font-family: ui-monospace, monospace; font-size: var(--font-down-1, .875rem); font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }

.ldu-settings-panel .dc-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-top: 1px solid var(--ldu-border); background: var(--ldu-surface-muted); }
.ldu-settings-panel .dc-btn { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border: 1px solid var(--ldu-border); border-radius: 4px; background: color-mix(in srgb, var(--ldu-text) 5%, var(--ldu-surface-muted)); color: var(--ldu-text); cursor: pointer; font: inherit; font-size: var(--font-down-2, .8rem); font-weight: 500; text-decoration: none; transition: background-color 120ms ease, transform 120ms var(--ldu-ease-out); }
.ldu-settings-panel .ldu-update-available,
.ldu-settings-host .ldu-update-available { border-color: #ffd43b; animation: ldu-update-pulse 1.6s ease-in-out infinite; }
@keyframes ldu-update-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgb(255 212 59 / 0%); }
  50% { box-shadow: 0 0 0 4px rgb(255 212 59 / 36%); }
}
@media (prefers-reduced-motion: reduce) {
  .ldu-settings-panel .ldu-update-available,
  .ldu-settings-host .ldu-update-available { animation: none; box-shadow: 0 0 0 3px rgb(255 212 59 / 32%); }
}
.ldu-settings-panel .dc-btn:hover { border-color: var(--primary-medium, #777); background: var(--primary-low, #2a2d32); }
.ldu-settings-panel .dc-btn-ghost { border-color: transparent; background: transparent; color: var(--primary-medium, #8b949e); }
.ldu-settings-panel .dc-btn-ghost:hover { border-color: transparent; background: color-mix(in srgb, var(--danger, #e45735) 10%, transparent); color: var(--danger, #e45735); }
.ldu-settings-panel .dc-footer-right { position: relative; display: flex; gap: 8px; }
.ldu-settings-panel .ldu-update-wrap { position: relative; }
.ldu-settings-panel .dc-dropdown-menu.ldu-update-menu {
  right: 0;
  width: min(420px, calc(100vw - 32px));
  min-width: min(360px, calc(100vw - 32px));
  max-width: none;
  gap: 10px;
  padding: 16px;
  border-radius: 8px;
}
.ldu-settings-panel .ldu-update-summary {
  display: grid;
  gap: 8px;
  color: var(--ldu-text);
  font-size: var(--font-down-1, .875rem);
  line-height: 1.55;
}
.ldu-settings-panel .ldu-update-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ldu-settings-panel .ldu-update-title { font-size: var(--font-0, 1rem); font-weight: 700; }
.ldu-settings-panel .ldu-update-version {
  padding: 2px 8px;
  border: 1px solid color-mix(in srgb, #ffd43b 55%, var(--ldu-border));
  border-radius: 999px;
  background: color-mix(in srgb, #ffd43b 12%, transparent);
  color: color-mix(in srgb, #ffd43b 78%, var(--ldu-text));
  font-size: var(--font-down-2, .75rem);
  font-weight: 700;
}
.ldu-settings-panel .ldu-update-date { color: var(--primary-medium, #8b949e); font-size: var(--font-down-2, .75rem); }
.ldu-settings-panel .ldu-update-changelog { margin: 0; padding-left: 20px; text-align: left; }
.ldu-settings-panel .ldu-update-changelog li + li { margin-top: 6px; }
.ldu-settings-panel .ldu-update-changelog li::marker { color: var(--ldu-accent); }
.ldu-settings-panel .ldu-update-link {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  background: var(--ldu-accent);
  color: #fff;
  font-size: var(--font-down-1, .875rem);
  font-weight: 600;
  text-align: center;
}
.ldu-settings-panel .ldu-donate-wrap { position: relative; }
.ldu-settings-panel .dc-dropdown-menu { position: absolute; right: 0; bottom: calc(100% + 6px); z-index: 2; display: flex; min-width: 100px; flex-direction: column; padding: 4px; border: 1px solid var(--ldu-border); border-radius: 4px; background: var(--ldu-surface-muted); box-shadow: 0 6px 18px rgb(0 0 0 / 50%); }
.ldu-settings-panel .dc-dropdown-menu[hidden] { display: none; }
.ldu-settings-panel .dc-dropdown-item { display: block; width: 100%; padding: 6px 10px; border: 0; border-radius: 2px; background: transparent; color: var(--ldu-text); cursor: pointer; font: inherit; font-size: var(--font-down-2, .75rem); text-align: left; text-decoration: none; }
.ldu-settings-panel .dc-dropdown-item:hover { background: var(--ldu-accent); color: #fff; }

.ldu-settings-panel :is(.dc-close-btn, .dc-pill-btn, .dc-btn, .dc-dropdown-item):active { transform: scale(.97); }

@media (max-width: 560px) {
  .ldu-settings-panel .dc-header,
  .ldu-settings-panel .dc-body,
  .ldu-settings-panel .dc-footer { padding-inline: 12px; }
  .ldu-settings-panel .dc-row { gap: 10px; }
  .ldu-settings-panel .dc-item-desc { font-size: var(--font-down-2, .75rem); }
  .ldu-settings-panel .dc-range { width: 82px; }
}

@media (max-height: 820px) and (min-width: 561px) {
  .ldu-settings-panel .dc-header { padding-block: 9px; }
  .ldu-settings-panel .dc-body { padding-block: 9px; }
  .ldu-settings-panel .dc-group { margin-bottom: 10px; }
  .ldu-settings-panel .dc-group-title { padding-bottom: 4px; margin-bottom: 2px; }
  .ldu-settings-panel .dc-row { padding-block: 5px; }
  .ldu-settings-panel .dc-label-box { gap: 1px; }
  .ldu-settings-panel .dc-item-desc { line-height: 1.2; }
  .ldu-settings-panel .dc-footer { padding-block: 8px; }
}

.ldu-settings-panel :is(button, a, select, input):focus-visible {
  outline: 2px solid var(--ldu-accent);
  outline-offset: 2px;
}

.ldu-credit-host {
  display: flex;
  align-items: center;
  list-style: none;
}

.ldu-credit-button {
  display: flex;
  height: 26px;
  min-width: 53px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0 8px 0 0;
  padding: 4px 8px;
  border: 1px solid var(--primary-medium, #838383);
  border-radius: 4px;
  background: transparent;
  box-sizing: border-box;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  white-space: nowrap;
}

.ldu-credit-button.is-loading,
.ldu-credit-button.is-neutral { color: var(--primary-medium, #6b7280); }
.ldu-credit-button.is-positive { color: #10b981; }
.ldu-credit-button.is-negative { color: var(--danger, #ef4444); }

@media (hover: hover) and (pointer: fine) {
  .ldu-credit-button:hover { background: var(--primary-low, rgb(255 255 255 / 12%)); }
}

.ldu-credit-tooltip {
  position: fixed;
  z-index: 1000002;
  padding: 8px 10px;
  border: 1px solid var(--ldu-border);
  border-radius: 6px;
  background: var(--ldu-text);
  box-shadow: 0 6px 18px rgb(0 0 0 / 18%);
  color: var(--ldu-surface);
  font-size: var(--font-down-1, .875rem);
  line-height: 1.5;
  pointer-events: none;
  white-space: pre;
}

.ldu-credit-tooltip[hidden] { display: none; }

.ldu-action-toast {
  position: fixed;
  z-index: 10001;
  left: 50%;
  bottom: max(24px, env(safe-area-inset-bottom));
  translate: -50% 0;
  max-width: min(420px, calc(100vw - 32px));
  padding: 9px 14px;
  border: 1px solid color-mix(in srgb, var(--success, #2e7d32) 35%, var(--ldu-border));
  border-radius: 8px;
  background: var(--ldu-surface);
  color: var(--ldu-text);
  box-shadow: 0 8px 28px rgb(0 0 0 / .2);
  font-size: var(--font-down-1, .875rem);
}

.ldu-action-toast.is-error {
  border-color: color-mix(in srgb, var(--ldu-danger) 45%, var(--ldu-border));
  color: var(--ldu-danger);
}

@media (prefers-reduced-motion: reduce) {
  .ldu-icon-button,
  .ldu-resize-handle::after,
  .ldu-settings-panel,
  .ldu-settings-reset,
  .ldu-settings-action,
  .ldu-donate-menu a { transition-duration: 0ms !important; }
}
`;function J(s=document){let e=s.getElementById(Ze);if(e instanceof HTMLStyleElement)return e;let t=s.createElement("style");return t.id=Ze,t.textContent=It,(s.head??s.documentElement).append(t),t}var Pt=1100,Ct=1680;function At(s,e){return e<Pt?"native":s==="two"||s==="three"?s:e>=Ct?"three":"two"}var Q=class{constructor(e){this.options=e;this.preference=e.preference,this.paneSizes={...e.paneSizes},this.dualPaneSizes={...e.dualPaneSizes??e.paneSizes},this.tabPresentation=e.tabPresentation??"horizontal",this.verticalTabsAutoCollapse=e.verticalTabsAutoCollapse!==!1}shell=null;panel=null;content=null;secondaryPanel=null;secondaryContent=null;listContent=null;preference;paneSizes;dualPaneSizes;tabPresentation;verticalTabsAutoCollapse;open=!1;secondaryOpen=!1;listHandoff=null;headerResizeObserver=null;resizeListener=()=>this.apply();mount(){J();let e=document.querySelector("#main-outlet-wrapper"),t=document.querySelector("#main-outlet");if(!e||!t)return!1;if(this.shell)this.shell.parentElement!==document.body&&document.body.append(this.shell);else if(this.shell=this.createShell(),document.body.append(this.shell),this.panel=this.shell.querySelector("#ldu-topic-panel"),this.content=this.panel?.querySelector(".ldu-topic-content")??null,this.secondaryPanel=this.shell.querySelector("#ldu-secondary-topic-panel"),this.secondaryContent=this.secondaryPanel?.querySelector(".ldu-topic-content")??null,this.listContent=this.shell.querySelector(".ldu-list-content"),window.addEventListener("resize",this.resizeListener,{passive:!0}),typeof ResizeObserver<"u"){let i=document.querySelector(".d-header");i&&(this.headerResizeObserver=new ResizeObserver(()=>this.apply()),this.headerResizeObserver.observe(i))}return this.apply(),!0}destroy(){this.finishListHandoff(),window.removeEventListener("resize",this.resizeListener),this.headerResizeObserver?.disconnect(),this.headerResizeObserver=null,this.shell?.remove(),this.shell=null,this.panel=null,this.content=null,this.secondaryPanel=null,this.secondaryContent=null,this.listContent=null,this.open=!1,this.secondaryOpen=!1,document.body.classList.remove("ldu-layout-active","ldu-layout-two","ldu-layout-three","ldu-secondary-open","ldu-tabs-vertical","ldu-vertical-tabs-static"),document.documentElement.classList.remove("ldu-layout-two-root")}setOpen(e){this.open=e,this.apply()}setSecondaryOpen(e){this.secondaryOpen=e,this.apply()}setPreference(e){this.preference=e,this.apply()}setTabPresentation(e,t=this.verticalTabsAutoCollapse){this.tabPresentation=e,this.verticalTabsAutoCollapse=t,this.apply()}setTabInteractionLocked(e,t){(t==="secondary"?this.secondaryPanel:this.panel)?.querySelector(".ldu-topic-toolbar")?.classList.toggle("is-interaction-locked",e)}setPaneSizes(e,t=this.dualPaneSizes){this.paneSizes={...e},this.dualPaneSizes={...t},this.apply()}getContentElement(){return this.content}getSecondaryContentElement(){return this.secondaryContent}getListContentElement(){return this.listContent}getShellElement(){return this.shell}beginListHandoff(e){if(this.listHandoff||!this.listContent)return!1;let t=document.querySelector("#main-outlet"),i=t?.parentElement;return!t||!i||i===this.listContent?!1:(this.listHandoff={outlet:t,parent:i,nextSibling:t.nextSibling,scrollY:Math.max(0,e)},this.listContent.classList.add("is-native-handoff"),this.listContent.prepend(t),this.listContent.scrollTop=this.listHandoff.scrollY,!0)}finishListHandoff(){let e=this.listHandoff;return e?(this.listHandoff=null,e.nextSibling?.parentNode===e.parent?e.parent.insertBefore(e.outlet,e.nextSibling):e.parent.append(e.outlet),this.listContent?.classList.remove("is-native-handoff"),this.listContent&&(this.listContent.scrollTop=0),e.scrollY):null}getTabStripElement(){return this.panel?.querySelector(".ldu-tab-strip")??null}getSecondaryTabStripElement(){return this.secondaryPanel?.querySelector(".ldu-tab-strip")??null}getActionsElement(){return this.panel?.querySelector(".ldu-topic-actions")??null}getSecondaryActionsElement(){return this.secondaryPanel?.querySelector(".ldu-topic-actions")??null}getPanelElement(){return this.panel}getSecondaryPanelElement(){return this.secondaryPanel}getMode(){return this.open?At(this.preference,window.innerWidth):"native"}apply(){if(!this.panel||!this.secondaryPanel||!this.shell)return;this.syncHeaderHeight();let e=this.getMode(),t=e!=="native";this.panel.hidden=!t,this.secondaryPanel.hidden=!t||!this.secondaryOpen,this.shell.hidden=!t,document.body.classList.toggle("ldu-layout-active",t),document.body.classList.toggle("ldu-layout-two",e==="two"),document.body.classList.toggle("ldu-layout-three",e==="three"),document.documentElement.classList.toggle("ldu-layout-two-root",e==="two"),document.body.classList.toggle("ldu-secondary-open",t&&this.secondaryOpen);let i=t&&this.tabPresentation==="vertical";document.body.classList.toggle("ldu-tabs-vertical",i),document.body.classList.toggle("ldu-vertical-tabs-static",i&&!this.verticalTabsAutoCollapse);let n=this.getActivePaneSizes();document.documentElement.style.setProperty("--ldu-sidebar-width",`${n.sidebar}px`),document.documentElement.style.setProperty("--ldu-topic-track",`${1-n.listRatio}fr`),document.documentElement.style.setProperty("--ldu-topic-split-track",`${(1-n.listRatio)/2}fr`),document.documentElement.style.setProperty("--ldu-list-track",`${n.listRatio}fr`),this.updateSeparatorValues()}createPanel(e=!1){let t=document.createElement("section");return t.id=e?"ldu-secondary-topic-panel":"ldu-topic-panel",t.className=e?"ldu-secondary-topic-panel":"",t.hidden=!0,t.setAttribute("aria-label",e?"\u7B2C\u4E8C\u5E16\u5B50\u9605\u8BFB\u533A":"\u5E16\u5B50\u9605\u8BFB\u533A"),t.innerHTML=`
      <div class="ldu-topic-toolbar">
        <div class="ldu-tab-strip" role="tablist" aria-label="${e?"\u7B2C\u4E8C\u9605\u8BFB\u533A":"\u4E3B\u9605\u8BFB\u533A"}\u5DF2\u6253\u5F00\u7684\u5E16\u5B50"></div>
        <div class="ldu-topic-actions"><span class="ldu-vertical-tabs-heading">${E("tab-list",18)}<span class="ldu-vertical-tabs-heading-label">\u5E16\u5B50\u6807\u7B7E</span></span></div>
      </div>
      <div class="ldu-topic-content">
        <div class="ldu-topic-empty">\u4ECE\u5217\u8868\u4E2D\u9009\u62E9\u5E16\u5B50</div>
      </div>
      ${e?"":'<button class="ldu-resize-handle ldu-resize-before" type="button" aria-label="\u8C03\u6574\u5DE6\u4FA7\u533A\u57DF\u5BBD\u5EA6"></button><button class="ldu-resize-handle ldu-resize-after" type="button" aria-label="\u8C03\u6574\u4E3B\u9898\u5217\u8868\u5BBD\u5EA6"></button>'}
    `,e||(this.bindResizeHandle(t.querySelector(".ldu-resize-before"),"before"),this.bindResizeHandle(t.querySelector(".ldu-resize-after"),"after")),t}createShell(){let e=document.createElement("div");e.id="ldu-layout-shell",e.hidden=!0,e.setAttribute("aria-label","Linux Do \u5206\u5C4F\u5DE5\u4F5C\u533A");let t=document.createElement("div");return t.className="ldu-list-content",t.setAttribute("aria-label","\u975E\u9605\u8BFB\u9875\u533A\u57DF"),e.append(t,this.createPanel(),this.createPanel(!0)),e}bindResizeHandle(e,t){e instanceof HTMLElement&&(e.setAttribute("role","separator"),e.setAttribute("aria-orientation","vertical"),e.tabIndex=0,e.addEventListener("keydown",i=>{if(!(i instanceof KeyboardEvent)||!["ArrowLeft","ArrowRight","Home","End"].includes(i.key))return;i.preventDefault();let n=i.key==="ArrowLeft"?-1:i.key==="ArrowRight"?1:0,a=this.getMode(),r=this.secondaryOpen?"dual":"single",o=this.getActivePaneSizes();if(t==="before"&&a==="three"&&document.body.classList.contains("has-sidebar-page"))o.sidebar=i.key==="Home"?160:i.key==="End"?360:Math.min(360,Math.max(160,o.sidebar+n*12));else if(t==="after"&&a==="three"||t==="before"&&a==="two"){let l=a==="three"?-n:n;o.listRatio=i.key==="Home"?.3:i.key==="End"?.7:Ee(o.listRatio+l*.02)}else return;this.apply(),this.options.onPaneSizesChange?.({...o},r)}),e.addEventListener("pointerdown",i=>{if(!(i instanceof PointerEvent)||i.button!==0)return;let n=i.clientX,a=this.secondaryOpen?"dual":"single",r=this.getActivePaneSizes(),o={...r};e.setPointerCapture(i.pointerId);let l=h=>{let c=h.clientX-n,d=this.getMode(),m=this.panel?.parentElement,g=Math.max(1,(m?.clientWidth??window.innerWidth)-r.sidebar);t==="after"&&d==="three"?r.listRatio=Ee(o.listRatio-c/g):t==="before"&&d==="two"?r.listRatio=Ee(o.listRatio+c/g):t==="before"&&d==="three"&&document.body.classList.contains("has-sidebar-page")&&(r.sidebar=Math.round(Math.min(360,Math.max(160,o.sidebar+c)))),this.apply()},u=()=>{e.removeEventListener("pointermove",l),e.removeEventListener("pointerup",u),e.removeEventListener("pointercancel",u),this.options.onPaneSizesChange?.({...r},a)};e.addEventListener("pointermove",l),e.addEventListener("pointerup",u),e.addEventListener("pointercancel",u)}))}updateSeparatorValues(){if(!this.panel)return;let e=this.getMode(),t=this.getActivePaneSizes(),i=this.panel.querySelector(".ldu-resize-before"),n=this.panel.querySelector(".ldu-resize-after"),a=(r,o,l,u)=>{r&&(r.setAttribute("aria-valuemin",String(l)),r.setAttribute("aria-valuemax",String(u)),r.setAttribute("aria-valuenow",String(o)))};e==="three"&&document.body.classList.contains("has-sidebar-page")?a(i,t.sidebar,160,360):a(i,Math.round(t.listRatio*100),30,70),a(n,Math.round(t.listRatio*100),30,70)}syncHeaderHeight(){let e=document.querySelector(".d-header");if(!e)return;let t=Math.ceil(e.getBoundingClientRect().height);t>0&&document.documentElement.style.setProperty("--ldu-header-height",`${t}px`)}getActivePaneSizes(){return this.secondaryOpen?this.dualPaneSizes:this.paneSizes}};function Ee(s){return Math.round(Math.min(.7,Math.max(.3,s))*1e3)/1e3}var et="https://raw.githubusercontent.com/jzcangshu/linuxdo-ultimate/main/updates/latest.json",tt="linuxdo-ultimate:update-cache",it="linuxdo-ultimate:update-attempt";function Ht(s,e){let t=a=>{let r=a.trim().replace(/^v/i,"").match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);return r?[Number(r[1]),Number(r[2]),Number(r[3])]:null},i=t(s),n=t(e);if(!i||!n)return 0;for(let a=0;a<i.length;a+=1){let r=i[a]??0,o=n[a]??0;if(r!==o)return r>o?1:-1}return 0}function Rt(s){if(!s||typeof s!="object")throw new Error("\u66F4\u65B0\u6E05\u5355\u683C\u5F0F\u65E0\u6548");let e=s,t=typeof e.version=="string"?e.version:"",i=typeof e.publishedAt=="string"?e.publishedAt:"",n=typeof e.releaseUrl=="string"?e.releaseUrl:"",a=Array.isArray(e.changelog)?e.changelog.filter(o=>typeof o=="string").slice(0,8):[];if(e.schemaVersion!==1||!/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(t)||!i||a.length===0)throw new Error("\u66F4\u65B0\u6E05\u5355\u5185\u5BB9\u4E0D\u5B8C\u6574");let r=new URL(n);if(r.protocol!=="https:"||r.hostname!=="github.com"||r.pathname!=="/jzcangshu/linuxdo-ultimate/releases/tag/v"+t.replace(/^v/i,""))throw new Error("\u66F4\u65B0\u6E05\u5355\u53D1\u5E03\u5730\u5740\u65E0\u6548");return{schemaVersion:1,version:t,publishedAt:i,releaseUrl:n,changelog:a}}function Ot(s){if(typeof GM_xmlhttpRequest=="function")return GM_xmlhttpRequest(s);let e=!1;return fetch(s.url,{headers:s.headers,signal:AbortSignal.timeout(s.timeout)}).then(async t=>{e||s.onload({status:t.status,responseText:await t.text()})}).catch(t=>{e||s.onerror(t)}),{abort:()=>{e=!0}}}function ke(){try{if(typeof chrome<"u"){let s=chrome.runtime?.getManifest?.().version;if(s)return s}}catch{}try{if(typeof GM_info<"u"&&GM_info.script.version)return GM_info.script.version}catch{}return"0.0.0"}var Z=class{constructor(e,t=Ot,i=ke()){this.storage=e;this.request=t;this.currentVersion=i}async check(e=!1){let t=Date.now(),i=await Promise.resolve(this.storage.get(tt,null));if(!e&&i?.checkedByVersion===this.currentVersion&&t-i.checkedAt<864e5)return this.compare(i.manifest);let n=await Promise.resolve(this.storage.get(it,0));return!e&&n>0&&t-n<36e5?i?this.compare(i.manifest):{status:"current",version:this.currentVersion}:(this.storage.set(it,t),new Promise(a=>{let r=o=>a({status:"error",message:o});this.request({method:"GET",url:e?`${et}?t=${t}`:et,headers:{Accept:"application/json"},timeout:1e4,onload:o=>{if(o.status<200||o.status>=300){r(`HTTP ${o.status}`);return}try{let l=Rt(JSON.parse(o.responseText));this.storage.set(tt,{checkedAt:t,checkedByVersion:this.currentVersion,manifest:l}),a(this.compare(l))}catch(l){r(l instanceof Error?l.message:"\u66F4\u65B0\u6E05\u5355\u89E3\u6790\u5931\u8D25")}},onerror:()=>r("\u7F51\u7EDC\u8FDE\u63A5\u5931\u8D25"),ontimeout:()=>r("\u8BF7\u6C42\u8D85\u65F6")})}))}compare(e){return Ht(e.version,this.currentVersion)>0?{status:"available",manifest:e}:{status:"current",version:this.currentVersion}}};var ee=class{constructor(e,t,i){this.host=e;this.settings=t;this.callbacks=i}panel=null;toggleButton=null;updateStatusTimer=null;mount(){if(this.panel)return;let e=document.createElement("button");e.type="button",e.className="ldu-icon-button btn-flat no-text",C(e,"settings",20),e.title="\u5E03\u5C40\u4E0E\u529F\u80FD\u8BBE\u7F6E",e.setAttribute("aria-label","\u5E03\u5C40\u4E0E\u529F\u80FD\u8BBE\u7F6E"),e.setAttribute("aria-controls","ldu-settings-panel"),e.setAttribute("aria-expanded","false"),e.addEventListener("click",()=>{this.panel&&this.setPanelOpen(this.panel.hidden)}),this.toggleButton=e,this.host.append(e);let t=document.createElement("div");t.id="ldu-settings-panel",t.className="ldu-settings-panel",t.hidden=!0,t.setAttribute("role","dialog"),t.setAttribute("aria-label","\u5E03\u5C40\u4E0E\u529F\u80FD\u8BBE\u7F6E"),t.innerHTML=`
      <div class="dc-modal">
        <header class="dc-header">
          <h2 class="ldu-settings-heading">Linux Do <span class="ldu-brand-ultimate">Ultimate</span><span class="ldu-settings-version">v${ke()}</span></h2>
          <button type="button" class="dc-close-btn ldu-settings-close" title="\u5173\u95ED" aria-label="\u5173\u95ED\u8BBE\u7F6E">${E("close",16)}</button>
        </header>
        <div class="dc-body">
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-layout-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-layout-heading">\u5E03\u5C40</div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u542F\u7528\u5206\u5C4F\u6A21\u5F0F</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="tabsEnabled"><span class="dc-slider"></span></span>
            </label>
            <div class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u5E16\u5B50\u6B63\u6587\u5C55\u793A\u4F4D\u7F6E</span>
              </span>
              <div class="dc-pills" data-pills-setting="layoutPreference">
                <button type="button" class="dc-pill-btn" data-val="auto">\u81EA\u52A8</button>
                <button type="button" class="dc-pill-btn" data-val="two">\u53F3\u4FA7</button>
                <button type="button" class="dc-pill-btn" data-val="three">\u4E2D\u95F4</button>
              </div>
            </div>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-reading-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-reading-heading">\u9605\u8BFB\u4E0E\u6807\u7B7E</div>
            <div class="ldu-settings-parent-group dc-dependent-row" data-depends-on="tabsEnabled">
              <div class="dc-row ldu-settings-control ldu-settings-parent-row">
                <span class="dc-label-box">
                  <span class="dc-item-title">\u6807\u7B7E\u9875\u6837\u5F0F</span>
                </span>
                <div class="dc-pills" data-pills-setting="tabPresentation">
                  <button type="button" class="dc-pill-btn" data-val="horizontal">\u6A2A\u5411</button>
                  <button type="button" class="dc-pill-btn" data-val="vertical">\u5782\u76F4</button>
                </div>
              </div>
              <div class="ldu-settings-tree">
                <label class="dc-row ldu-settings-control ldu-settings-tree-row dc-dependent-row" data-depends-on="tabPresentation" data-depends-value="vertical">
                  <span class="dc-label-box">
                    <span class="dc-item-title">\u81EA\u52A8\u6536\u8D77\u6807\u7B7E\u680F</span>
                  </span>
                  <span class="dc-switch"><input type="checkbox" data-setting="verticalTabsAutoCollapse"><span class="dc-slider"></span></span>
                </label>
                <label class="dc-row ldu-settings-control ldu-settings-tree-row dc-dependent-row" data-depends-on="tabPresentation" data-depends-value="vertical">
                  <span class="dc-label-box">
                    <span class="dc-item-title">\u81EA\u52A8\u6309\u5E16\u5B50\u5206\u7C7B\u6574\u7406\u6807\u7B7E\u9875</span>
                  </span>
                  <span class="dc-switch"><input type="checkbox" data-setting="groupVerticalTabs"><span class="dc-slider"></span></span>
                </label>
                <label class="dc-row ldu-settings-control ldu-settings-tree-row">
                  <span class="dc-label-box">
                    <span class="dc-item-title">\u6807\u7B7E\u9875\u4E0A\u8272</span>
                    <span class="dc-item-desc">\u81EA\u52A8\u6309\u5E16\u5B50\u5206\u7C7B\u4E3A\u6807\u7B7E\u9875\u4E0A\u8272</span>
                  </span>
                  <span class="dc-switch"><input type="checkbox" data-setting="colorizeTabs"><span class="dc-slider"></span></span>
                </label>
              </div>
            </div>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u6062\u590D\u4E0A\u6B21\u5173\u95ED\u524D\u6253\u5F00\u7684\u5E16\u5B50</span>
                <span class="dc-item-desc">\u4E0B\u6B21\u8BBF\u95EE\u65F6\u6062\u590D\u6700\u540E\u5173\u95ED\u7684\u6D4F\u89C8\u5668\u6807\u7B7E\u9875\u4F1A\u8BDD</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="restoreSession"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u6D3B\u52A8\u9875\u9762\u4E0A\u9650</span>
                <span class="dc-item-desc">\u9650\u5236\u540C\u65F6\u4FDD\u7559\u5728\u5185\u5B58\u4E2D\u7684\u5E16\u5B50\u9875\u9762\u6570\u91CF</span>
              </span>
              <span class="dc-range-group ldu-settings-range-control"><input type="range" class="dc-range" data-setting="maxLiveFrames" min="1" max="10" step="1"><output class="dc-range-number" data-output="maxLiveFrames"></output></span>
            </label>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-style-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-style-heading">\u8BBA\u575B\u7F8E\u5316</div>
            <div class="ldu-settings-parent-group">
              <label class="dc-row ldu-settings-control ldu-settings-parent-row">
                <span class="dc-label-box">
                  <span class="dc-item-title">\u6781\u7B80\u6A21\u5F0F</span>
                  <span class="dc-item-desc">\u6309\u9700\u9690\u85CF\u8BBA\u575B\u4E2D\u7684\u6B21\u8981\u4FE1\u606F</span>
                </span>
                <span class="dc-switch"><input type="checkbox" data-setting="cleanModeEnabled"><span class="dc-slider"></span></span>
              </label>
              <div class="ldu-settings-tree ldu-minimal-options dc-dependent-row" data-depends-on="cleanModeEnabled">
                <div class="dc-row ldu-settings-control ldu-settings-tree-row ldu-settings-compact-row">
                  <span class="dc-item-title">\u9690\u85CF\u5185\u5BB9</span>
                  <div class="ldu-settings-check-grid" role="group" aria-label="\u6781\u7B80\u6A21\u5F0F\u9690\u85CF\u5185\u5BB9">
                    <label class="ldu-settings-check"><input type="checkbox" data-setting="minimalHidePosters"><span>\u5217\u8868\u5934\u50CF</span></label>
                    <label class="ldu-settings-check"><input type="checkbox" data-setting="minimalHideNotices"><span>\u516C\u544A</span></label>
                    <label class="ldu-settings-check"><input type="checkbox" data-setting="minimalHideCategoryBadges"><span>\u5206\u7C7B\u5FBD\u7AE0</span></label>
                    <label class="ldu-settings-check"><input type="checkbox" data-setting="minimalHideTags"><span>\u8BDD\u9898\u6807\u7B7E</span></label>
                  </div>
                </div>
              </div>
            </div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u51CF\u5C11\u52A8\u753B\u4E0E\u8FC7\u6E21\u6548\u679C</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="lowEndOptimizationEnabled"><span class="dc-slider"></span></span>
            </label>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-tools-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-tools-heading">\u5B9E\u7528\u5DE5\u5177</div>
            <div class="ldu-settings-parent-group">
              <label class="dc-row ldu-settings-control ldu-settings-parent-row">
                <span class="dc-label-box">
                  <span class="dc-item-title">\u94FE\u63A5\u60AC\u6D6E\u9884\u89C8</span>
                  <span class="dc-item-desc alert ldu-settings-risk" data-depends-on="previewEnabled" role="note">\u9884\u89C8\u9875\u9762\u4F1A\u8FD0\u884C\u76EE\u6807\u7F51\u7AD9\u811A\u672C\uFF0C\u8BF7\u53EA\u9884\u89C8\u53EF\u4FE1\u94FE\u63A5\u3002</span>
                </span>
                <span class="dc-switch"><input type="checkbox" data-setting="previewEnabled"><span class="dc-slider"></span></span>
              </label>
              <div class="ldu-settings-tree dc-dependent-row" data-depends-on="previewEnabled">
                <div class="dc-row ldu-settings-control ldu-settings-tree-row">
                  <span class="dc-label-box">
                    <span class="dc-item-title">\u89E6\u53D1\u65B9\u5F0F</span>
                  </span>
                  <div class="dc-pills" data-pills-setting="previewClickMode">
                    <button type="button" class="dc-pill-btn" data-val="double">\u53CC\u51FB</button>
                    <button type="button" class="dc-pill-btn" data-val="single">\u5355\u51FB</button>
                  </div>
                </div>
              </div>
            </div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u5728\u9876\u90E8\u663E\u793A LDC \u6536\u5165</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="creditEnabled"><span class="dc-slider"></span></span>
            </label>
          </section>
        </div>
        <footer class="dc-footer ldu-settings-footer">
          <button type="button" class="dc-btn dc-btn-ghost ldu-settings-reset">\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E</button>
          <div class="dc-footer-right ldu-settings-actions">
            <div class="ldu-update-wrap">
              <button type="button" class="dc-btn ldu-settings-action ldu-settings-update" aria-expanded="false" aria-controls="ldu-update-menu">${E("refresh",14)}\u68C0\u67E5\u66F4\u65B0</button>
              <div class="dc-dropdown-menu ldu-update-menu" id="ldu-update-menu" role="status" aria-live="polite" hidden>
                <div class="ldu-update-summary"></div>
                <a class="dc-dropdown-item ldu-update-link" href="#" target="_blank" rel="noopener noreferrer">\u67E5\u770B\u65B0\u7248\u5E76\u4E0B\u8F7D</a>
              </div>
            </div>
            <a class="dc-btn ldu-settings-action ldu-settings-github" href="https://github.com/jzcangshu/linuxdo-ultimate" target="_blank" rel="noopener noreferrer">${E("github",14)}Github</a>
            <div class="ldu-donate-wrap">
              <button type="button" class="dc-btn ldu-settings-action ldu-settings-donate" aria-expanded="false" aria-controls="ldu-donate-menu">${E("gift",14)}LDC \u6350\u8D60</button>
              <div class="dc-dropdown-menu ldu-donate-menu" id="ldu-donate-menu" role="menu" aria-label="\u9009\u62E9LDC\u6350\u8D60\u989D\u5EA6" hidden>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=87d0a248e696e18399f2458fcfec6b3c889059feedfbacb500af59382fe5416d" target="_blank" rel="noopener noreferrer">1 LDC</a>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=06325a8a0293c81624c065fd8922f6ed591beac0c95c1ac122463d1b4bf78be8" target="_blank" rel="noopener noreferrer">5 LDC</a>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=783190ffe634374e940ad558140c583942c8e4c13c89bc09782596b07bd63bb3" target="_blank" rel="noopener noreferrer">10 LDC</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    `,this.panel=t,this.host.append(t),this.sync(),t.querySelectorAll("[data-setting]").forEach(i=>{i.addEventListener("change",()=>this.readControl(i)),i.addEventListener("input",()=>this.readControl(i))}),t.querySelectorAll("[data-pills-setting] .dc-pill-btn").forEach(i=>{i.addEventListener("click",()=>this.readPill(i))}),t.querySelector(".ldu-settings-close")?.addEventListener("click",()=>this.setPanelOpen(!1)),t.querySelector(".ldu-settings-reset")?.addEventListener("click",()=>{window.confirm("\u786E\u5B9A\u8981\u6062\u590D\u5168\u90E8\u9ED8\u8BA4\u8BBE\u7F6E\u5417\uFF1F")&&(this.settings=structuredClone(v),this.sync(),this.callbacks.onChange({...this.settings}))}),t.querySelector(".ldu-settings-donate")?.addEventListener("click",()=>{let i=t.querySelector(".ldu-donate-menu");this.setDonationMenuOpen(!!i?.hidden)}),t.querySelector(".ldu-settings-update")?.addEventListener("click",()=>{this.callbacks.onCheckUpdates?.()}),t.querySelectorAll(".ldu-donate-menu a").forEach(i=>{i.addEventListener("click",()=>this.setDonationMenuOpen(!1))}),t.querySelector(".ldu-update-link")?.addEventListener("click",()=>{this.setUpdateMenuOpen(!1)}),document.addEventListener("pointerdown",i=>{!this.panel?.hidden&&!this.host.contains(i.target)&&this.setPanelOpen(!1)},!0),document.addEventListener("keydown",i=>{if(i.key!=="Escape")return;let n=this.panel?.querySelector(".ldu-donate-menu");n&&!n.hidden?this.setDonationMenuOpen(!1):this.panel?.querySelector(".ldu-update-menu")?.hidden===!1?this.setUpdateMenuOpen(!1):this.panel&&!this.panel.hidden&&(this.setPanelOpen(!1),this.toggleButton?.focus({preventScroll:!0}))},!0)}setSettings(e){this.settings=e,this.sync()}setUpdateState(e,t=!1){let i=this.panel?.querySelector(".ldu-settings-update"),n=this.panel?.querySelector(".ldu-update-menu"),a=this.panel?.querySelector(".ldu-update-summary"),r=this.panel?.querySelector(".ldu-update-link");if(!i||!n||!a||!r)return;this.updateStatusTimer!==null&&window.clearTimeout(this.updateStatusTimer),i.disabled=e.status==="checking";let o=e.status==="available";if(i.classList.toggle("ldu-update-available",o),this.toggleButton?.classList.toggle("ldu-update-available",o),e.status==="checking"){this.setUpdateButton(i,"\u68C0\u67E5\u4E2D..."),i.title="\u6B63\u5728\u68C0\u67E5\u66F4\u65B0",this.setUpdateMenuOpen(!1);return}if(e.status==="available"){this.setUpdateButton(i,`\u53D1\u73B0 v${e.manifest.version}`),i.title=`\u53D1\u73B0\u65B0\u7248\u672C v${e.manifest.version}`,a.replaceChildren();let l=document.createElement("div");l.className="ldu-update-header";let u=document.createElement("strong");u.className="ldu-update-title",u.textContent="\u53D1\u73B0\u65B0\u7248\u672C";let h=document.createElement("span");h.className="ldu-update-version",h.textContent=`v${e.manifest.version}`,l.append(u,h);let c=document.createElement("time");c.className="ldu-update-date",c.dateTime=e.manifest.publishedAt,c.textContent=`\u53D1\u5E03\u4E8E ${e.manifest.publishedAt}`;let d=document.createElement("ul");d.className="ldu-update-changelog",e.manifest.changelog.forEach(m=>{let g=document.createElement("li");g.textContent=m,d.append(g)}),a.append(l,c,d),r.href=e.manifest.releaseUrl,this.setUpdateMenuOpen(t);return}this.setUpdateButton(i,e.status==="current"?"\u5DF2\u662F\u6700\u65B0\u7248":"\u68C0\u67E5\u5931\u8D25"),i.title=e.status==="error"?e.message:"\u5F53\u524D\u5DF2\u662F\u6700\u65B0\u7248\u672C",this.setUpdateMenuOpen(!1),this.updateStatusTimer=window.setTimeout(()=>{this.setUpdateButton(i,"\u68C0\u67E5\u66F4\u65B0"),i.title="\u68C0\u67E5\u66F4\u65B0"},2500)}setUpdateButton(e,t){e.innerHTML=`${E("refresh",14)}${t}`}sync(){if(!this.panel)return;let e=this.panel.querySelector('[data-setting="tabsEnabled"]'),t=this.panel.querySelector('[data-setting="verticalTabsAutoCollapse"]'),i=this.panel.querySelector('[data-setting="groupVerticalTabs"]'),n=this.panel.querySelector('[data-setting="restoreSession"]'),a=this.panel.querySelector('[data-setting="colorizeTabs"]'),r=this.panel.querySelector('[data-setting="cleanModeEnabled"]'),o=this.panel.querySelector('[data-setting="minimalHidePosters"]'),l=this.panel.querySelector('[data-setting="minimalHideNotices"]'),u=this.panel.querySelector('[data-setting="minimalHideCategoryBadges"]'),h=this.panel.querySelector('[data-setting="minimalHideTags"]'),c=this.panel.querySelector('[data-setting="lowEndOptimizationEnabled"]'),d=this.panel.querySelector('[data-setting="previewEnabled"]'),m=this.panel.querySelector('[data-setting="creditEnabled"]'),g=this.panel.querySelector('[data-setting="maxLiveFrames"]'),k=this.panel.querySelector('[data-output="maxLiveFrames"]');e&&(e.checked=this.settings.tabsEnabled),t&&(t.checked=this.settings.verticalTabsAutoCollapse),i&&(i.checked=this.settings.groupVerticalTabs),n&&(n.checked=this.settings.restoreSession),a&&(a.checked=this.settings.colorizeTabs),r&&(r.checked=this.settings.cleanModeEnabled),o&&(o.checked=this.settings.minimalHidePosters),l&&(l.checked=this.settings.minimalHideNotices),u&&(u.checked=this.settings.minimalHideCategoryBadges),h&&(h.checked=this.settings.minimalHideTags),c&&(c.checked=this.settings.lowEndOptimizationEnabled),d&&(d.checked=this.settings.previewEnabled),m&&(m.checked=this.settings.creditEnabled),g&&(g.value=String(this.settings.maxLiveFrames)),k&&(k.value=String(this.settings.maxLiveFrames)),this.syncPills("layoutPreference",this.settings.layoutPreference),this.syncPills("tabPresentation",this.settings.tabPresentation),this.syncPills("previewClickMode",this.settings.previewClickMode),this.syncDependencies()}readControl(e){let t=e.dataset.setting;if(!t||t==="schemaVersion"||t==="paneSizes"||t==="dualPaneSizes")return;let i;if(e instanceof HTMLInputElement&&e.type==="checkbox")i=e.checked;else if(e instanceof HTMLInputElement&&e.type==="range")i=Number(e.value);else if(e instanceof HTMLSelectElement)i=e.value;else return;this.settings={...this.settings,[t]:i};let n=this.panel?.querySelector(`[data-output="${t}"]`);n&&(n.value=String(i)),this.syncDependencies(),this.callbacks.onChange({[t]:i})}readPill(e){let i=e.closest("[data-pills-setting]")?.dataset.pillsSetting,n=e.dataset.val;!i||!n||i==="schemaVersion"||i==="paneSizes"||i==="dualPaneSizes"||(this.settings={...this.settings,[i]:n},this.syncPills(i,n),this.syncDependencies(),this.callbacks.onChange({[i]:n}))}syncPills(e,t){this.panel?.querySelectorAll(`[data-pills-setting="${e}"] .dc-pill-btn`).forEach(i=>{let n=i.dataset.val===t;i.classList.toggle("active",n),i.setAttribute("aria-pressed",String(n))})}syncDependencies(){this.panel&&this.panel.querySelectorAll("[data-depends-on]").forEach(e=>{let t=e.dataset.dependsOn,i=e.dataset.dependsValue,n=!!t&&(i===void 0?this.settings[t]===!0:String(this.settings[t])===i);e.hidden=!n})}setPanelOpen(e){this.panel&&(this.panel.hidden=!e,this.toggleButton?.setAttribute("aria-expanded",String(e)),e||(this.setDonationMenuOpen(!1),this.setUpdateMenuOpen(!1)))}setDonationMenuOpen(e){let t=this.panel?.querySelector(".ldu-donate-menu"),i=this.panel?.querySelector(".ldu-settings-donate");t&&(t.hidden=!e),i?.setAttribute("aria-expanded",String(e)),e&&this.setUpdateMenuOpen(!1)}setUpdateMenuOpen(e){let t=this.panel?.querySelector(".ldu-update-menu"),i=this.panel?.querySelector(".ldu-settings-update");if(t&&(t.hidden=!e),i?.setAttribute("aria-expanded",String(e)),e){let n=this.panel?.querySelector(".ldu-donate-menu"),a=this.panel?.querySelector(".ldu-settings-donate");n&&(n.hidden=!0),a?.setAttribute("aria-expanded","false")}}};var Ft=[[{action:"onMoveToSplit",key:"split",label:"\u5411\u65B0\u7684\u62C6\u5206\u89C6\u56FE\u4E2D\u6DFB\u52A0\u6807\u7B7E\u9875",icon:"split"},{action:"onOpenBrowserTab",key:"browser-tab",label:"\u5728\u65B0\u7684\u6D4F\u89C8\u5668\u6807\u7B7E\u9875\u4E2D\u6253\u5F00",icon:"external"}],[{action:"onReload",key:"reload",label:"\u91CD\u65B0\u52A0\u8F7D\u5F53\u524D\u5E16\u5B50",icon:"refresh"},{action:"onCopyLink",key:"copy",label:"\u590D\u5236\u94FE\u63A5",icon:"copy"}],[{action:"onBookmark",key:"bookmark",label:"\u6DFB\u52A0\u5230\u4E66\u7B7E",icon:"bookmark"}],[{action:"onCloseOthers",key:"close-others",label:"\u5173\u95ED\u5176\u4ED6\u6807\u7B7E\u9875",icon:"close-others"}]],te=class{constructor(e){this.callbacks=e}root=null;onOutsidePointer=e=>{this.root?.contains(e.target)||this.close()};onKeyDown=e=>{e.key==="Escape"&&this.close()};activePane="primary";open(e,t,i,n=!1,a="primary"){this.close(),this.activePane=a;let r=document.createElement("div");r.className="ldu-tab-context-menu",r.setAttribute("role","menu"),r.setAttribute("aria-label","\u6807\u7B7E\u9875\u7BA1\u7406\u83DC\u5355");for(let[u,h]of Ft.entries()){if(u>0){let c=document.createElement("div");c.className="ldu-context-separator",c.setAttribute("role","separator"),r.append(c)}for(let c of h){let d=document.createElement("button");d.type="button",d.className="ldu-context-item",d.dataset.action=c.key,d.setAttribute("role","menuitem"),c.key==="split"&&n&&(d.disabled=!0),d.append(Je(document,c.icon));let m=document.createElement("span");if(m.className="ldu-context-label",m.textContent=c.label,d.append(m),c.shortcut){let g=document.createElement("span");g.className="ldu-context-shortcut",g.textContent=c.shortcut,d.append(g)}d.addEventListener("click",()=>{this.close(),this.callbacks[c.action](e)}),r.append(d)}}document.body.append(r),this.root=r,this.callbacks.onOpenChange?.(!0,a);let o=r.getBoundingClientRect(),l=8;r.style.left=`${Math.max(l,Math.min(t,window.innerWidth-o.width-l))}px`,r.style.top=`${Math.max(l,Math.min(i,window.innerHeight-o.height-l))}px`,document.addEventListener("pointerdown",this.onOutsidePointer,!0),document.addEventListener("keydown",this.onKeyDown,!0),r.querySelector("button:not(:disabled)")?.focus()}close(){let e=!!this.root;document.removeEventListener("pointerdown",this.onOutsidePointer,!0),document.removeEventListener("keydown",this.onKeyDown,!0),this.root?.remove(),this.root=null,e&&this.callbacks.onOpenChange?.(!1,this.activePane)}destroy(){this.close()}};var ie=class{constructor(e){this.options=e}api=null;loading=null;mount(){let e=this.ensureApi();e instanceof Promise}install(e){if(this.api||!this.options.isEnabled())return this.api;let t=e({isEnabled:this.options.isEnabled,clickMode:this.options.clickMode,...this.options.onClickModeChange?{onClickModeChange:this.options.onClickModeChange}:{},isPreviewableUrl:(i,n)=>this.isPreviewable(i,n)});return this.api=t??null,this.api}ensureApi(){if(this.api||!this.options.isEnabled())return this.api;if(this.loading)return this.loading;try{let e=this.options.loadPreviewer();return e instanceof Promise?(this.loading=e.then(t=>this.install(t)).catch(t=>(console.error("[Linux Do Ultimate] Preview runtime failed to load",t),null)).finally(()=>{this.loading=null}),this.loading):this.install(e)}catch(e){return console.error("[Linux Do Ultimate] Preview runtime failed to load",e),null}}close(){this.api?.close()}syncClickMode(){let e=this.ensureApi();e instanceof Promise?e.then(t=>t?.syncClickMode()):e?.syncClickMode()}openFromFrame(e,t,i){if(!this.options.isEnabled()||!this.isPreviewable(e,null))return;let n=t.getBoundingClientRect(),a=i??{left:0,bottom:0},r=l=>{!l||!this.options.isEnabled()||l.openFromFrame(e,{left:n.left+a.left,top:n.top+a.bottom,bottom:n.top+a.bottom})},o=this.ensureApi();o instanceof Promise?o.then(r):r(o)}isPreviewable(e,t){return!/^https?:/i.test(e)||f(e)?!1:t?t.closest(".d-header, .sidebar-wrapper, .ldu-topic-toolbar, .ldu-settings-panel")||t.closest("button, [role=button], .btn, .d-button, input, textarea, select")||t.matches(".lightbox")||t.querySelector("img, picture")?!1:!t.closest("img, picture, .lightbox-wrapper"):!0}};var Me="linuxdo-ultimate:credit-cache:v1",zt="linuxdo-ultimate:credit-refresh",ne=class{constructor(e={}){this.options=e}host=null;button=null;value=null;tooltip=null;communityBalance=null;gamificationScore=null;username=null;tooltipContent="\u52A0\u8F7D\u4E2D...";timeoutId=null;inFlight=null;requestGeneration=0;activeRequestController=null;mounted=!1;enabled=!1;mount(e){this.mounted||!(this.options.isTopLevel?.()??window.self===window.top)||(this.mounted=!0,this.createWidget(),document.addEventListener("visibilitychange",()=>this.handleVisibilityChange()),this.ensureHost(),this.setEnabled(e))}ensureHost(){if(!this.host)return;let e=document.querySelector(".d-header-icons > .language-switcher");if(e)e.nextElementSibling!==this.host&&e.after(this.host);else{let t=document.querySelector(".d-header-icons");if(!t)return;this.host.parentElement!==t&&t.append(this.host)}this.enabled&&this.startUpdates()}setEnabled(e){if(!this.mounted){this.mount(e);return}if(this.enabled=e,this.host&&(this.host.hidden=!e),this.tooltip&&(this.tooltip.hidden=!0),!e){this.requestGeneration+=1,this.activeRequestController?.abort(),this.activeRequestController=null,this.inFlight=null,this.clearSchedule();return}this.ensureHost(),this.host?.isConnected&&this.startUpdates()}startUpdates(){!this.enabled||!this.isVisible()||this.inFlight||this.timeoutId!==null||this.fetchData(!1)}createWidget(){let e=document.createElement("li");e.className="header-dropdown-toggle ldu-credit-host";let t=document.createElement("button");t.type="button",t.className="btn no-text language-switcher-trigger btn-flat ldu-credit-button is-loading",t.title="Credit \u79EF\u5206\u6536\u5165\uFF0C\u70B9\u51FB\u5237\u65B0",t.setAttribute("aria-label","Credit \u79EF\u5206\u6536\u5165\uFF0C\u70B9\u51FB\u5237\u65B0"),t.setAttribute("aria-describedby","ldu-credit-tooltip");let i=document.createElement("span");i.className="ldu-credit-value",i.setAttribute("aria-live","polite"),i.textContent="\xB7\xB7\xB7",t.append(i),e.append(t);let n=document.createElement("div");n.id="ldu-credit-tooltip",n.className="ldu-credit-tooltip",n.hidden=!0,n.setAttribute("role","tooltip"),document.body.append(n);let a=()=>{if(!this.enabled)return;n.textContent=this.tooltipContent,n.hidden=!1;let o=t.getBoundingClientRect(),l=Math.max(8,Math.min(window.innerWidth-n.offsetWidth-8,o.right-n.offsetWidth));n.style.left=`${l}px`,n.style.top=`${o.bottom+6}px`},r=()=>{n.hidden=!0};t.addEventListener("mouseenter",a),t.addEventListener("mouseleave",r),t.addEventListener("focus",a),t.addEventListener("blur",r),t.addEventListener("click",()=>{this.setLoading("\u5237\u65B0\u4E2D..."),this.fetchData(!0)}),this.host=e,this.button=t,this.value=i,this.tooltip=n}fetchData(e){if(!this.enabled||!this.isVisible())return Promise.resolve();if(this.inFlight)return this.inFlight;let t=++this.requestGeneration,i=this.now(),n=new AbortController;this.activeRequestController=n;let a=(async()=>{try{let r=e?null:this.readSharedSnapshot(),o=r??await this.fetchSnapshotCoordinated(e,i,n.signal);if(!this.enabled||t!==this.requestGeneration)return;this.communityBalance=o.communityBalance,this.gamificationScore=o.gamificationScore,this.username=o.username,r||this.writeSharedSnapshot(o),this.updateDisplay()}catch(r){if(n.signal.aborted)return;console.error("[Linux Do Ultimate] LDC request failed",r),this.enabled&&t===this.requestGeneration&&this.showError()}})().finally(()=>{this.activeRequestController===n&&(this.activeRequestController=null),this.inFlight===a&&(this.inFlight=null),this.enabled&&this.isVisible()&&t===this.requestGeneration&&this.scheduleNext()});return this.inFlight=a,a}async fetchSnapshot(e){let t=await this.request("https://credit.linux.do/api/v1/oauth/user-info",e),i=t?.data?.["community-balance"]??t?.data?.community_balance,n=t?.data?.username??t?.data?.nickname,a=Number.parseFloat(String(i));if(!n||!Number.isFinite(a))throw new Error("invalid credit response");let r=await this.request(`https://linux.do/u/${encodeURIComponent(n)}.json`,e),o=Number.parseFloat(String(r?.user?.gamification_score));if(!Number.isFinite(o))throw new Error("invalid gamification response");return{communityBalance:a,gamificationScore:o,username:n,updatedAt:this.now()}}async fetchSnapshotCoordinated(e,t,i){let n=typeof navigator<"u"?navigator.locks:void 0;return n?n.request(zt,{signal:i},async()=>{let a=this.readSharedSnapshot();if(a&&(!e||a.updatedAt>=t))return a;let r=await this.fetchSnapshot(i);return this.writeSharedSnapshot(r),r}):this.fetchSnapshot(i)}scheduleNext(){this.clearSchedule(),this.timeoutId=window.setTimeout(()=>{this.timeoutId=null,this.fetchData(!1)},3e5)}clearSchedule(){this.timeoutId!==null&&window.clearTimeout(this.timeoutId),this.timeoutId=null}handleVisibilityChange(){if(!this.isVisible()){this.clearSchedule();return}this.enabled&&this.startUpdates()}isVisible(){return this.options.isVisible?.()??document.visibilityState!=="hidden"}now(){return this.options.now?.()??Date.now()}readSharedSnapshot(){try{let e=localStorage.getItem(Me);if(e===null)return null;let t=JSON.parse(e);return!t||this.now()-Number(t.updatedAt)>=6e4||!Number.isFinite(t.communityBalance)||!Number.isFinite(t.gamificationScore)||typeof t.username!="string"?(this.clearSharedSnapshot(),null):t}catch{return this.clearSharedSnapshot(),null}}clearSharedSnapshot(){try{localStorage.removeItem(Me)}catch{}}writeSharedSnapshot(e){try{localStorage.setItem(Me,JSON.stringify(e))}catch{}}updateDisplay(){if(this.communityBalance===null||this.gamificationScore===null||!this.value||!this.button)return;let e=this.gamificationScore-this.communityBalance;this.value.textContent=`${e>0?"+":""}${e.toFixed(2)}`,this.button.classList.remove("is-loading","is-positive","is-negative","is-neutral"),this.button.classList.add(e>0?"is-positive":e<0?"is-negative":"is-neutral"),this.tooltipContent=`\u4EC5\u4F9B\u53C2\u8003\uFF0C\u53EF\u80FD\u6709\u8BEF\u5DEE\uFF01
\u5F53\u524D\u5206: ${this.gamificationScore.toFixed(2)}
\u57FA\u51C6\u503C: ${this.communityBalance.toFixed(2)}`}setLoading(e){this.value&&(this.value.textContent="\xB7\xB7\xB7"),this.button?.classList.remove("is-positive","is-negative","is-neutral"),this.button?.classList.add("is-loading"),this.tooltipContent=e}showError(){this.value&&(this.value.textContent="!"),this.button?.classList.remove("is-loading","is-positive","is-neutral"),this.button?.classList.add("is-negative"),this.tooltipContent="\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u5DF2\u767B\u5F55"}request(e,t){if(this.options.request)return this.options.request(e);let i=document.querySelector('meta[name="csrf-token"]')?.content,n={Accept:"application/json",...i?{"x-csrf-token":i}:{}};return e.startsWith(location.origin)?fetch(e,{credentials:"include",headers:n,signal:t}).then(a=>{if(!a.ok)throw new Error(String(a.status));return a.json()}).catch(a=>t.aborted?Promise.reject(a):this.requestWithUserscript(e,n,t)):this.requestWithUserscript(e,n,t)}requestWithUserscript(e,t,i){return new Promise((n,a)=>{if(typeof GM_xmlhttpRequest!="function"){a(new Error("GM_xmlhttpRequest is unavailable"));return}let r=!1,o=null,l=c=>{r||(r=!0,i.removeEventListener("abort",u),c())},u=()=>{try{o?.abort()}catch{}l(()=>a(new DOMException("Aborted","AbortError")))};if(i.aborted){u();return}i.addEventListener("abort",u,{once:!0});let h={method:"GET",url:e,withCredentials:!0,headers:{...t,Referer:"https://credit.linux.do/home"},timeout:1e4,onload:c=>{if(c.status!==200){l(()=>a(new Error(String(c.status))));return}try{let d=JSON.parse(c.responseText);l(()=>n(d))}catch(d){l(()=>a(d))}},onerror:c=>l(()=>a(c)),ontimeout:()=>l(()=>a(new Error("timeout")))};o=GM_xmlhttpRequest(h)})}};var Nt={ownerOnlyEnabled:!1,minimalHidePosters:!1,minimalHideNotices:!1,minimalHideCategoryBadges:!1,minimalHideTags:!1,lowEndOptimizationEnabled:!1},se=class{constructor(e={}){this.options=e;this.win=e.window??window,this.doc=e.document??document,this.lowEndDevice=Ut(this.win.navigator)}config={...Nt};active=!0;stopped=!1;ownerInstaller=null;ownerController=null;ownerLoad=null;win;doc;lowEndDevice;setConfig(e){if(this.stopped)return;let t={...this.config,...e};_t(this.config,t)||(this.config=t,this.applyStaticModes(),this.syncOwnerView())}setActive(e){this.stopped||this.active===e||(this.active=e,this.syncOwnerView())}stop(){this.stopped||(this.stopped=!0,this.ownerController?.stop(),this.ownerController=null,delete this.doc.documentElement.dataset.lduHidePosters,delete this.doc.documentElement.dataset.lduHideNotices,delete this.doc.documentElement.dataset.lduHideCategoryBadges,delete this.doc.documentElement.dataset.lduHideTags,delete this.doc.documentElement.dataset.lduLowEnd)}applyStaticModes(){let e=this.doc.documentElement;U(e,"lduHidePosters",this.config.minimalHidePosters),U(e,"lduHideNotices",this.config.minimalHideNotices),U(e,"lduHideCategoryBadges",this.config.minimalHideCategoryBadges),U(e,"lduHideTags",this.config.minimalHideTags),U(e,"lduLowEnd",this.config.lowEndOptimizationEnabled&&this.lowEndDevice)}wantsOwnerView(){return this.active&&this.ownerViewConfigured()}ownerViewConfigured(){return this.options.allowOwnerView!==!1&&this.config.ownerOnlyEnabled&&typeof this.options.loadOwnerView=="function"}syncOwnerView(){if(!this.ownerViewConfigured()){this.ownerController?.stop(!0),this.ownerController=null;return}if(!this.active){this.ownerController?.setActive(!1);return}if(this.ownerController){this.ownerController.setActive(!0);return}if(this.ownerInstaller){this.installOwnerView(this.ownerInstaller);return}if(!this.ownerLoad)try{let e=this.options.loadOwnerView();if(!(e instanceof Promise)){this.ownerInstaller=e,this.installOwnerView(e);return}this.ownerLoad=e.then(t=>(this.ownerInstaller=t,this.wantsOwnerView()&&this.installOwnerView(t),t)).catch(t=>(console.error("[Linux Do Ultimate] Owner view runtime failed to load",t),null)).finally(()=>{this.ownerLoad=null})}catch(e){console.error("[Linux Do Ultimate] Owner view runtime failed to load",e)}}installOwnerView(e){!this.wantsOwnerView()||this.ownerController||(this.ownerController=e({window:this.win,document:this.doc,...this.options.isEmbedded!==void 0?{isEmbedded:this.options.isEmbedded}:{},...this.options.isSplitHost?{isSplitHost:this.options.isSplitHost}:{}}),this.ownerController.setActive(!0))}};function _t(s,e){return s.ownerOnlyEnabled===e.ownerOnlyEnabled&&s.minimalHidePosters===e.minimalHidePosters&&s.minimalHideNotices===e.minimalHideNotices&&s.minimalHideCategoryBadges===e.minimalHideCategoryBadges&&s.minimalHideTags===e.minimalHideTags&&s.lowEndOptimizationEnabled===e.lowEndOptimizationEnabled}function U(s,e,t){let i=String(t);s.dataset[e]!==i&&(s.dataset[e]=i)}function Ut(s){let e=s.hardwareConcurrency,t=s.deviceMemory;return Number.isFinite(e)&&e<=4||typeof t=="number"&&Number.isFinite(t)&&t<=4}var Dt=100,qt=30*6e4,Vt=3e3;function nt(s={}){if(window.self!==window.top)return;let e=()=>new Le(s).start();document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e,{once:!0}):e()}var Le=class{constructor(e){this.options=e}storage=new W;settings=H(v);session;tabStore;layout;frames=null;secondaryFrames=null;listFrame=null;preview;settingsPanel;credit;settingsHost=null;routeTimer=null;persistTimer=null;lastRoute="";restoredTabsTracked=!1;trackedTopicKey="";topicTrackTimers=[];routeRetryTimer=null;routeRetryAttempts=0;hostMaintenanceTimer=null;hasRestoredSession=!1;sessionLease;leaseTimer=null;sessionMaintenanceTimer=null;tabContextMenu;listHandoffTimer=null;updateChecker=new Z(this.storage);updateCheckTimer=null;pageTools;start(){this.settings=$e(this.storage),J(),this.pageTools=new se({isEmbedded:!1,isSplitHost:()=>document.body.classList.contains("ldu-layout-active"),allowOwnerView:!!f(location.href,location.href),...this.options.loadOwnerView?{loadOwnerView:this.options.loadOwnerView}:{}}),this.pageTools.setConfig(this.getPageToolsConfig()),this.preview=new ie({isEnabled:()=>this.settings.enabled&&this.settings.previewEnabled,clickMode:()=>this.settings.previewClickMode,onClickModeChange:a=>this.applySettings({previewClickMode:a}),loadPreviewer:this.options.loadPreviewer??(()=>Promise.reject(new Error("Preview runtime is unavailable")))}),this.preview.mount(),this.tabContextMenu=new te({onMoveToSplit:a=>this.moveTabToSecondary(a),onOpenBrowserTab:a=>this.openTabInBrowser(a),onReload:a=>this.reloadTab(a),onCopyLink:a=>void this.copyTabLink(a),onBookmark:a=>this.bookmarkTab(a),onCloseOthers:a=>this.closeOtherTabs(a),onOpenChange:(a,r)=>this.layout.setTabInteractionLocked(a,r)}),this.sessionLease=qe(this.storage,window.sessionStorage,Date.now(),_e(window.performance));let e=this.sessionLease.sessionId;Ke(this.storage,e),ge(this.storage),this.settings.restoreSession||N(this.storage);let t=z(e,location.href,Date.now());t.paneSizes={...this.settings.paneSizes},t.dualPaneSizes={...this.settings.dualPaneSizes};let i=Ye(this.storage,e,location.href,Date.now()),n=!i&&P(location.href)!=="topic"&&this.settings.restoreSession?We(this.storage,e,location.href,Date.now()):null;this.session=i??n??t,this.hasRestoredSession=!!n?.tabs.length,this.tabStore=new X(this.session,this.settings.maxOpenTabs,a=>{this.session=a,I(this.storage,a),this.renderTabs()}),this.layout=new Q({preference:this.settings.layoutPreference,paneSizes:this.session.paneSizes,dualPaneSizes:this.session.dualPaneSizes,tabPresentation:this.settings.tabPresentation,verticalTabsAutoCollapse:this.settings.verticalTabsAutoCollapse,onPaneSizesChange:(a,r)=>this.persistPaneSizes(a,r)}),this.mountSettings(),this.credit=new ne,this.credit.mount(this.settings.enabled&&this.settings.creditEnabled),this.lastRoute=location.href,this.bindGlobalEvents(),this.leaseTimer=window.setInterval(()=>Ve(this.storage,this.sessionLease),3e4),this.sessionMaintenanceTimer=window.setInterval(()=>ge(this.storage),qt),this.syncRoute(),window.__LDU_TEST_MODE__&&(window.__LDU_TEST_API__={openTopic:(a,r)=>{let o=f(a,location.href);o&&this.openTopic(o.topicId,o.url.href,r,o.postNumber)}})}bindGlobalEvents(){document.addEventListener("click",e=>this.handleTopicLinkClick(e),!0),window.addEventListener("message",e=>{this.frames?.handleMessage(e),this.secondaryFrames?.handleMessage(e),this.listFrame?.handleMessage(e)}),window.addEventListener("popstate",()=>this.scheduleRouteSync()),window.addEventListener("hashchange",()=>this.scheduleRouteSync()),window.addEventListener("pagehide",e=>this.handlePageHide(e),{capture:!0}),new MutationObserver(()=>{typeof window>"u"||typeof document>"u"||(this.hostMaintenanceTimer===null&&(this.hostMaintenanceTimer=window.setTimeout(()=>{this.hostMaintenanceTimer=null,this.ensureSettingsHost(),this.credit?.ensureHost()},100)),this.lastRoute!==location.href&&this.scheduleRouteSync())}).observe(document.documentElement,{childList:!0,subtree:!0})}dismissHostOverlays(){document.body.dispatchEvent(new MouseEvent("pointerdown",{bubbles:!0,cancelable:!0,button:0}))}handleUserMenuLink(e,t){if(!t.closest(".user-menu")||t.matches(".user-menu-tab, [role=tab]"))return!1;let i;try{i=new URL(t.href,location.href)}catch{return!1}if(i.origin!==location.origin||t.target==="_blank"||t.hasAttribute("download"))return!1;let n=f(i.href,location.href),a=!!this.layout.getShellElement()&&this.layout.getMode()!=="native";return!n&&!a?!1:(e.preventDefault(),e.stopImmediatePropagation(),this.dismissHostOverlays(),n?this.openTopic(n.topicId,n.url.href,t.textContent?.trim()||`\u4E3B\u9898 ${n.topicId}`,n.postNumber):this.navigateList(i.href),!0)}handleTopicLinkClick(e){if(!(e instanceof MouseEvent)||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||!this.settings.enabled||!this.settings.tabsEnabled)return;let t=e.target,i=t instanceof Element?t.closest("a[href]"):null;if(!i||this.handleUserMenuLink(e,i))return;let n=null;try{n=new URL(i.href,location.href)}catch{}if(!!this.layout.getShellElement()&&this.layout.getMode()!=="native"&&n&&n.origin===location.origin&&P(n.href)==="chat"){e.preventDefault(),e.stopImmediatePropagation(),this.dismissHostOverlays(),this.navigateList(n.href);return}if(!i.closest("button, [role=button], .btn, .d-button, .post-controls, .actions, .topic-timeline, .no-track-view-patch")){if(P(location.href)==="topic"&&this.tabStore.getTabs().length===0){this.promoteDirectTopicNavigation(e,i);return}if(ve(i.href,location.href)){let r=f(i.href);if(!r)return;e.preventDefault(),e.stopImmediatePropagation(),this.openTopic(r.topicId,r.url.href,i.textContent?.trim()||`\u4E3B\u9898 ${r.topicId}`,r.postNumber);return}!this.layout.getShellElement()||this.layout.getMode()==="native"||n&&(n.origin!==location.origin||n.protocol==="javascript:"||i.target==="_blank"||i.hasAttribute("download")||(e.preventDefault(),e.stopImmediatePropagation(),this.navigateList(n.href)))}}openTopic(e,t,i,n,a="primary",r=!1){let o=this.tabStore.getTabs().length===0&&P(location.href)!=="topic"&&this.layout.getMode()==="native",l=o?window.scrollY:0;if(!this.layout.mount())return;o&&this.tabStore.setSessionFields({listUrl:location.href,listScrollY:l},Date.now(),!1),this.ensureFrames(),o&&this.layout.beginListHandoff(l)&&this.scheduleListHandoffFallback(),this.layout.setOpen(!0);let u={topicId:e,url:t,title:i,...n?{postNumber:n}:{}};a==="secondary"?this.tabStore.openSecondary(u,Date.now()):this.tabStore.open(u,Date.now()),r||this.ensureListFrame();let h=f(t);if(h){let c=K();c.track(h,"split-open",location.href).then(d=>{d.status==="failed"&&window.setTimeout(()=>void c.track(h,"manual-retry",location.href),1e4)})}}syncRoute(){this.routeTimer=null,this.lastRoute!==location.href&&(this.lastRoute=location.href);let e=P(location.href);if(this.settings.enabled&&this.settings.tabsEnabled&&(fe(location.href)||this.tabStore.getTabs().length>0)){if(this.clearTopicTrackSchedule(),!this.layout.mount()){this.scheduleRouteMountRetry();return}this.routeRetryAttempts=0;let i=this.tabStore.getTabs().length>0;if(this.layout.setOpen(i),i){this.ensureFrames(),this.ensureListFrame(),this.tabStore.getSecondaryTabs().length>0&&(this.layout.setSecondaryOpen(!0),this.ensureSecondaryFrames());let n=this.tabStore.getActive();if(n&&(this.activateFrame(n,"primary"),this.hasRestoredSession&&!this.restoredTabsTracked)){this.restoredTabsTracked=!0;let r=f(n.url);r&&K().track(r,"restored-tab",location.href)}let a=this.tabStore.getSecondaryActive();a&&this.activateFrame(a,"secondary")}return}if(this.disposeSplitRuntime(),e==="topic"){let i=f(location.href);i&&this.scheduleTopicTracking(i.topicId,i.url.href)}else this.clearTopicTrackSchedule()}promoteDirectTopicNavigation(e,t){let i=f(location.href);if(!i)return;let n;try{n=new URL(t.href,location.href)}catch{return}if(n.origin!==location.origin)return;let a=P(n.href,location.href);if(a==="topic"&&f(n.href,location.href)?.topicId===i.topicId||t.target==="_blank"||t.hasAttribute("download"))return;let r=a==="topic"?new URL("/",location.href).href:n.href;if(this.layout.mount()){if(this.clearTopicTrackSchedule(),this.tabStore.setSessionFields({listUrl:r,listScrollY:0},Date.now(),!1),this.ensureFrames(),this.layout.setOpen(!0),e.preventDefault(),e.stopImmediatePropagation(),this.openTopic(i.topicId,i.url.href,this.currentTopicTitle(i.topicId),i.postNumber,"primary",!0),a==="topic"){let o=f(n.href,location.href);o&&this.openTopic(o.topicId,o.url.href,t.textContent?.trim()||`\u4E3B\u9898 ${o.topicId}`,o.postNumber,"primary",!0)}this.ensureListFrame(r)}}currentTopicTitle(e){return document.querySelector("#topic-title h1, .fancy-title")?.textContent?.trim()||document.title||`\u4E3B\u9898 ${e}`}scheduleRouteMountRetry(){this.routeRetryTimer!==null||this.routeRetryAttempts>=30||(this.routeRetryAttempts+=1,this.routeRetryTimer=window.setTimeout(()=>{this.routeRetryTimer=null,this.syncRoute()},100))}scheduleRouteSync(){this.routeRetryAttempts=0,this.routeTimer!==null&&window.clearTimeout(this.routeTimer),this.routeTimer=window.setTimeout(()=>this.syncRoute(),Dt)}ensureListFrame(e){let t=this.layout.getListContentElement();if(!t)return;this.listFrame||(this.listFrame=new j(t,this.session.sessionId,(r,o)=>this.handleListFrameMessage(r,o))),this.listFrame.setConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode,pageTools:this.getPageToolsConfig()});let i=e??this.tabStore.getSession().listUrl,n;try{n=new URL(i||"/",location.href)}catch{n=new URL("/",location.href)}let a=n.origin!==location.origin||f(n.href,location.href)?new URL("/",location.href).href:n.href;this.listFrame.mount(a)}navigateList(e){let t;try{t=new URL(e,location.href)}catch{return}t.origin!==location.origin||f(t.href,location.href)||this.layout.mount()&&(this.tabStore.setSessionFields({listUrl:t.href,listScrollY:0},Date.now(),!1),I(this.storage,this.tabStore.getSession()),this.ensureListFrame(t.href),this.listFrame?.navigate(t.href))}handleListFrameMessage(e,t){if(e.type==="ldu:list-interaction"){this.dismissHostOverlays();return}if(e.type==="ldu:list-preview-open"){this.preview.openFromFrame(e.url??"",t,e.anchorRect);return}if(e.type==="ldu:list-preview-dismiss"){this.preview.close();return}if(e.type==="ldu:list-topic-open"){let o=e.url?f(e.url,location.href):null;if(!o)return;this.openTopic(o.topicId,o.url.href,e.topicTitle||`\u4E3B\u9898 ${o.topicId}`,o.postNumber);return}if(e.type==="ldu:list-navigate"&&e.url){this.navigateList(e.url);return}if(!e.url||f(e.url,location.href))return;let i=this.tabStore.getSession(),n=new URL(e.url,location.href).href,a=i.listUrl===n,r=a?i.listScrollY:0;if(this.tabStore.setSessionFields({listUrl:n,...e.type==="ldu:list-state"&&typeof e.scrollY=="number"?{listScrollY:e.scrollY}:a?{}:{listScrollY:0}},Date.now(),!1),e.type==="ldu:list-state"&&this.schedulePersist(),e.type==="ldu:list-ready"&&(this.listFrame?.restoreScroll(r),this.schedulePersist()),e.type==="ldu:list-visual-ready"){let o=this.finishListHandoff();o!==null&&this.listFrame?.restoreScroll(o),this.schedulePersist()}}ensureFrames(){let e=this.layout.getContentElement();!e||this.frames||(this.frames=new _(e,this.settings.maxLiveFrames,(t,i)=>this.handleFrameMessage(t,i,"primary"),t=>{this.tabStore.update(t,{suspended:!0},Date.now(),!1),this.schedulePersist()}),this.frames.setPreviewConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode}),this.frames.setPageToolsConfig(this.getPageToolsConfig()),this.renderTabs())}ensureSecondaryFrames(){let e=this.layout.getSecondaryContentElement();!e||this.secondaryFrames||(this.secondaryFrames=new _(e,this.settings.maxLiveFrames,(t,i)=>this.handleFrameMessage(t,i,"secondary"),t=>{this.tabStore.update(t,{suspended:!0},Date.now(),!1),this.schedulePersist()}),this.secondaryFrames.setPreviewConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode}),this.secondaryFrames.setPageToolsConfig(this.getPageToolsConfig()))}mountSettings(){if(this.settingsPanel)return;let e=document.createElement("li");e.className="ldu-settings-host",this.settingsHost=e,this.ensureSettingsHost(),this.settingsPanel=new ee(e,this.settings,{onChange:t=>this.applySettings(t),onCheckUpdates:()=>this.checkForUpdates(!0)}),this.settingsPanel.mount(),this.updateCheckTimer=window.setTimeout(()=>{if(this.updateCheckTimer=null,document.visibilityState==="visible"){this.checkForUpdates(!1);return}document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&this.checkForUpdates(!1)},{once:!0})},2e4)}async checkForUpdates(e){e&&this.settingsPanel?.setUpdateState({status:"checking"});let t=await this.updateChecker.check(e);(e||t.status==="available")&&this.settingsPanel?.setUpdateState(t,e&&t.status==="available")}ensureSettingsHost(){if(!this.settingsHost)return;let e=document.querySelector(".d-header-icons")??document.querySelector(".d-header .contents")??document.body;this.settingsHost.parentElement!==e&&e.append(this.settingsHost)}getPageToolsConfig(){let e=this.settings.enabled&&this.settings.cleanModeEnabled;return{ownerOnlyEnabled:!0,minimalHidePosters:e&&this.settings.minimalHidePosters,minimalHideNotices:e&&this.settings.minimalHideNotices,minimalHideCategoryBadges:e&&this.settings.minimalHideCategoryBadges,minimalHideTags:e&&this.settings.minimalHideTags,lowEndOptimizationEnabled:this.settings.enabled&&this.settings.lowEndOptimizationEnabled}}applySettings(e){this.settings=H({...this.settings,...e}),be(this.storage,this.settings);let t=Object.keys(e);if(t.length>0&&t.every(o=>["verticalTabsAutoCollapse","tabPresentation","groupVerticalTabs","colorizeTabs"].includes(o))){(e.verticalTabsAutoCollapse!==void 0||e.tabPresentation!==void 0)&&this.layout.setTabPresentation(this.settings.tabPresentation,this.settings.verticalTabsAutoCollapse),this.settingsPanel?.setSettings(this.settings),(e.tabPresentation!==void 0||e.groupVerticalTabs!==void 0||e.colorizeTabs!==void 0)&&this.renderTabs(!1);return}if(this.layout.setPreference(this.settings.layoutPreference),this.layout.setTabPresentation(this.settings.tabPresentation,this.settings.verticalTabsAutoCollapse),this.pageTools?.setConfig(this.getPageToolsConfig()),(e.paneSizes||e.dualPaneSizes)&&(this.layout.setPaneSizes(this.settings.paneSizes,this.settings.dualPaneSizes),this.tabStore.setSessionFields({paneSizes:this.settings.paneSizes,dualPaneSizes:this.settings.dualPaneSizes},Date.now(),!1),I(this.storage,this.tabStore.getSession())),this.frames?.setMaxLiveFrames(this.settings.maxLiveFrames),this.secondaryFrames?.setMaxLiveFrames(this.settings.maxLiveFrames),this.frames?.setPreviewConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode}),this.secondaryFrames?.setPreviewConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode}),this.frames?.setPageToolsConfig(this.getPageToolsConfig()),this.secondaryFrames?.setPageToolsConfig(this.getPageToolsConfig()),this.listFrame?.setConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode,pageTools:this.getPageToolsConfig()}),this.settingsPanel?.setSettings(this.settings),this.credit?.setEnabled(this.settings.enabled&&this.settings.creditEnabled),e.previewClickMode!==void 0&&this.preview.syncClickMode(),this.settings.enabled&&this.settings.previewEnabled&&this.preview.mount(),e.restoreSession===!1&&N(this.storage),(!this.settings.enabled||!this.settings.previewEnabled)&&this.preview.close(),(e.colorizeTabs!==void 0||e.tabPresentation!==void 0||e.groupVerticalTabs!==void 0)&&this.renderTabs(),!(this.settings.enabled&&this.settings.tabsEnabled&&(fe(location.href)||this.tabStore.getTabs().length>0))){this.disposeSplitRuntime();return}if(!this.layout.mount())return;let a=this.tabStore.getActive(),r=this.tabStore.getTabs().length>0;if(this.layout.setOpen(r),r){this.ensureFrames(),this.ensureListFrame(),a&&this.activateFrame(a,"primary");let o=this.tabStore.getSecondaryActive();o&&(this.layout.setSecondaryOpen(!0),this.ensureSecondaryFrames(),this.activateFrame(o,"secondary"))}}persistPaneSizes(e,t){this.settings=H({...this.settings,...t==="dual"?{dualPaneSizes:e}:{paneSizes:e}}),be(this.storage,this.settings),this.tabStore.setSessionFields(t==="dual"?{dualPaneSizes:this.settings.dualPaneSizes}:{paneSizes:this.settings.paneSizes},Date.now(),!1),I(this.storage,this.tabStore.getSession()),this.settingsPanel?.setSettings(this.settings)}scheduleTopicTracking(e,t){let i=e;if(this.trackedTopicKey===i)return;this.clearTopicTrackSchedule(),this.trackedTopicKey=i;let n=f(t);if(!n)return;let a=K();this.topicTrackTimers=[2500,1e4].map(r=>window.setTimeout(()=>{a.track(n,"browser-open",document.referrer)},r))}clearTopicTrackSchedule(){for(let e of this.topicTrackTimers)window.clearTimeout(e);this.topicTrackTimers=[],this.trackedTopicKey=""}activateFrame(e,t){let i=t==="secondary"?this.secondaryFrames:this.frames;if(!e||!i)return;i.activate(e,Date.now());let a=(t==="secondary"?this.layout.getSecondaryContentElement():this.layout.getContentElement())?.querySelector(".ldu-topic-empty");a&&(a.hidden=!0)}handleFrameMessage(e,t,i){let n=this.tabStore.get(e.tabId);if(!n)return;if(e.type==="ldu:frame-interaction"){this.dismissHostOverlays();return}if(e.type==="ldu:bookmark-result"){this.showActionToast(e.message||(e.ok?"\u5DF2\u6DFB\u52A0\u5230\u4E66\u7B7E":"\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"),e.ok===!1);return}if(e.type==="ldu:list-navigate"&&e.url){this.navigateList(e.url);return}if(e.type==="ldu:preview-open"){this.preview.openFromFrame(e.url??"",t,e.anchorRect);return}if(e.type==="ldu:preview-dismiss"){this.preview.close();return}if(e.type==="ldu:topic-open"){let l=e.url?f(e.url,location.href):null;if(!l||!ve(l.url.href,n.url))return;this.openTopic(l.topicId,l.url.href,e.title||`\u4E3B\u9898 ${l.topicId}`,l.postNumber,i);return}let a=e.url?f(e.url):null,r=a?.topicId===n.topicId,o={...e.url?{url:e.url}:{},...e.title?{title:e.title}:{},...a?.postNumber?{postNumber:a.postNumber}:{},suspended:!1};this.tabStore.update(n.id,o,Date.now(),e.type==="ldu:frame-ready"||!!(e.title&&!r)),e.type==="ldu:frame-state"&&this.schedulePersist()}renderTabs(e=!0){let t=this.layout?.getTabStripElement();if(!t||!this.tabStore)return;let i=this.tabStore.getPrimaryTabs(),n=this.tabStore.getSecondaryTabs();this.layout.setSecondaryOpen(n.length>0),n.length>0?this.ensureSecondaryFrames():this.secondaryFrames&&(this.secondaryFrames.destroy(),this.secondaryFrames=null),xe(t,i,this.tabStore.getSession().activeTabId,{onActivate:d=>{let m=this.tabStore.activate(d,Date.now());m&&this.activateFrame(m,"primary")},onClose:d=>this.closeTab(d,"primary"),onContextMenu:(d,m,g)=>this.tabContextMenu.open(d,m,g,!1,"primary"),onReorder:(d,m,g)=>{this.tabStore.reorderInPane(d,m,g,Date.now())}},{colorizeTabs:this.settings.colorizeTabs,orientation:this.settings.tabPresentation,groupByCategory:this.settings.groupVerticalTabs});let a=this.layout.getSecondaryTabStripElement();a&&xe(a,n,this.tabStore.getSession().secondaryActiveTabId,{onActivate:d=>{let m=this.tabStore.activateSecondary(d,Date.now());m&&this.activateFrame(m,"secondary")},onClose:d=>this.closeTab(d,"secondary"),onContextMenu:(d,m,g)=>this.tabContextMenu.open(d,m,g,!0,"secondary"),onReorder:(d,m,g)=>{this.tabStore.reorderInPane(d,m,g,Date.now())}},{colorizeTabs:this.settings.colorizeTabs,orientation:this.settings.tabPresentation,groupByCategory:this.settings.groupVerticalTabs});let r=this.layout.getActionsElement();if(r&&!r.querySelector(".ldu-close-all")){let d=document.createElement("button");d.type="button",d.className="ldu-icon-button ldu-close-all",C(d,"close",18),d.title="\u5173\u95ED\u6240\u6709\u5E16\u5B50\u6807\u7B7E",d.setAttribute("aria-label","\u5173\u95ED\u6240\u6709\u5E16\u5B50\u6807\u7B7E"),d.addEventListener("click",()=>{for(let m of this.tabStore.getTabs())this.frames?.remove(m.id),this.secondaryFrames?.remove(m.id);this.tabStore.clear(Date.now()),this.disposeSplitRuntime()}),r.append(d)}let o=this.layout.getSecondaryActionsElement();if(o&&!o.querySelector(".ldu-close-secondary")){let d=document.createElement("button");d.type="button",d.className="ldu-icon-button ldu-close-secondary",C(d,"close",18),d.title="\u5173\u95ED\u7B2C\u4E8C\u9605\u8BFB\u533A",d.setAttribute("aria-label","\u5173\u95ED\u7B2C\u4E8C\u9605\u8BFB\u533A\u5E76\u5C06\u6807\u7B7E\u79FB\u56DE\u4E3B\u9605\u8BFB\u533A"),d.addEventListener("click",()=>this.closeSecondaryPanel()),o.append(d)}let l=this.layout.getContentElement()?.querySelector(".ldu-topic-empty");l&&(l.hidden=i.length>0);let u=this.layout.getSecondaryContentElement()?.querySelector(".ldu-topic-empty");if(u&&(u.hidden=n.length>0),!e)return;let h=this.tabStore.getActive();h&&this.activateFrame(h,"primary");let c=this.tabStore.getSecondaryActive();c&&this.activateFrame(c,"secondary")}closeTab(e,t){if((t==="secondary"?this.secondaryFrames:this.frames)?.remove(e),this.tabStore.close(e,Date.now(),!1),t==="primary"&&this.tabStore.getPrimaryTabs().length===0&&this.tabStore.getSecondaryTabs().length>0){this.closeSecondaryPanel();return}I(this.storage,this.tabStore.getSession()),this.renderTabs(),this.tabStore.getTabs().length===0&&this.disposeSplitRuntime()}moveTabToSecondary(e){if(this.tabStore.getSession().secondaryTabIds.includes(e)||!this.captureLiveFrameState(e,this.frames)||!this.layout.mount())return;let i=this.frames?.detach(e)??null;this.layout.setSecondaryOpen(!0),this.ensureSecondaryFrames();let n=this.tabStore.moveToSecondary(e,Date.now(),!1);n&&(i&&this.secondaryFrames&&this.secondaryFrames.adopt(n,i,Date.now()),I(this.storage,this.tabStore.getSession()),this.renderTabs())}closeSecondaryPanel(){let t=this.tabStore.getSecondaryTabs().flatMap(i=>{let n=this.captureLiveFrameState(i.id,this.secondaryFrames)??i,a=this.secondaryFrames?.detach(i.id);return a?[{tab:n,transfer:a}]:[]});this.tabStore.mergeSecondaryIntoPrimary(Date.now(),!1);for(let{tab:i,transfer:n}of t)this.frames?.adopt(i,n,Date.now());I(this.storage,this.tabStore.getSession()),this.renderTabs()}openTabInBrowser(e){let t=this.tabStore.get(e);if(!t)return;let i=document.createElement("a");i.href=t.url,i.target="_blank",i.rel="noopener noreferrer",i.click()}reloadTab(e){let i=this.tabStore.getSession().secondaryTabIds.includes(e)?this.secondaryFrames:this.frames,n=this.captureLiveFrameState(e,i);n&&(i?.getFrame(e)?i.reload(e):i?.prepare(n,Date.now()))}async copyTabLink(e){let t=this.tabStore.get(e);if(t)try{await navigator.clipboard.writeText(t.url);return}catch{let i=document.createElement("textarea");i.value=t.url,i.style.position="fixed",i.style.opacity="0",document.body.append(i),i.select(),document.execCommand("copy"),i.remove()}}bookmarkTab(e){let t=this.tabStore.getSession().secondaryTabIds.includes(e),i=this.tabStore.get(e);if(!i)return;let n=t?this.secondaryFrames:this.frames;n?.prepare(i,Date.now()),n?.sendCommand(e,{type:"ldu:bookmark",topicId:i.topicId})}closeOtherTabs(e){let t=this.tabStore.getSession().secondaryTabIds.includes(e),i=t?this.tabStore.getSecondaryTabs():this.tabStore.getPrimaryTabs();for(let n of i)n.id!==e&&(t?this.secondaryFrames:this.frames)?.remove(n.id);this.tabStore.closeOthersInPane(e,Date.now())}persistSession(){let e=this.tabStore?.getActive();e&&this.frames&&this.captureLiveFrameState(e.id,this.frames);let t=this.tabStore?.getSecondaryActive();t&&this.secondaryFrames&&this.captureLiveFrameState(t.id,this.secondaryFrames),this.tabStore&&I(this.storage,this.tabStore.getSession())}captureLiveFrameState(e,t){let i=this.tabStore.get(e),n=t?.getFrame(e);if(!i||!n?.contentWindow)return i;let a=i.url,r=i.title;try{let l=n.contentWindow.location.href;f(l,i.url)?.topicId===i.topicId&&(a=l);let u=n.contentDocument?.title?.trim();u&&(r=u)}catch{return i}let o=f(a,i.url);return this.tabStore.update(e,{url:a,title:r,...o?.postNumber?{postNumber:o.postNumber}:{},suspended:!1},Date.now(),!1),this.tabStore.get(e)??i}showActionToast(e,t){document.querySelector(".ldu-action-toast")?.remove();let i=document.createElement("div");i.className=`ldu-action-toast${t?" is-error":""}`,i.setAttribute("role",t?"alert":"status"),i.textContent=e,document.body.append(i),window.setTimeout(()=>i.remove(),2800)}disposeSplitRuntime(){this.finishListHandoff(),this.preview?.close(),this.frames?.destroy(),this.frames=null,this.secondaryFrames?.destroy(),this.secondaryFrames=null,this.tabContextMenu?.close(),this.listFrame?.destroy(),this.listFrame=null,this.layout?.destroy()}scheduleListHandoffFallback(){this.listHandoffTimer!==null&&window.clearTimeout(this.listHandoffTimer),this.listHandoffTimer=window.setTimeout(()=>{this.listHandoffTimer=null;let e=this.layout?.finishListHandoff()??null;e!==null&&this.listFrame?.restoreScroll(e)},Vt)}finishListHandoff(){return this.listHandoffTimer!==null&&window.clearTimeout(this.listHandoffTimer),this.listHandoffTimer=null,this.layout?.finishListHandoff()??null}handlePageHide(e){this.persistSession(),!e.persisted&&(this.settings.restoreSession&&this.tabStore?.getTabs().length>0&&Ge(this.storage,this.tabStore.getSession()),this.leaseTimer!==null&&window.clearInterval(this.leaseTimer),this.sessionMaintenanceTimer!==null&&window.clearInterval(this.sessionMaintenanceTimer),this.updateCheckTimer!==null&&window.clearTimeout(this.updateCheckTimer),this.leaseTimer=null,this.sessionMaintenanceTimer=null,this.updateCheckTimer=null,Be(this.storage,this.sessionLease))}schedulePersist(){this.persistTimer!==null&&window.clearTimeout(this.persistTimer),this.persistTimer=window.setTimeout(()=>{this.persistTimer=null,this.persistSession()},500)}};var st="ldu:extension-request",at="ldu:extension-request-cancel";function Bt(s=chrome.runtime){return e=>{let t=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`,i=!1,n=!1,a={type:st,requestId:t,method:e.method??"GET",url:e.url,headers:{...e.headers??{}},...typeof e.data=="string"?{body:e.data}:{},timeout:Math.max(0,e.timeout??3e4)};return s.sendMessage(a).then(r=>{if(i||n)return;i=!0;let o=r;if(!o?.ok){o?.error==="timeout"?e.ontimeout?.():e.onerror?.(o??new Error("Extension request failed"));return}e.onload?.(o)}).catch(r=>{i||n||(i=!0,e.onerror?.(r))}),{abort:()=>{i||n||(n=!0,i=!0,e.onabort?.(),s.sendMessage({type:at,requestId:t}).catch(()=>{}))}}}}function rt(s=chrome.runtime){Object.defineProperty(globalThis,"GM_xmlhttpRequest",{configurable:!0,value:Bt(s)})}rt();location.pathname.startsWith("/challenge")||nt({loadPreviewer:async()=>(await import(chrome.runtime.getURL("preview-runtime.js"))).installLinkHoverPreviewer,loadOwnerView:async()=>(await import(chrome.runtime.getURL("topic-tools-runtime.js"))).installOwnerView});})();
