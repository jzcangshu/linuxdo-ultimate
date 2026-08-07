// ==UserScript==
// @name         Linux.do Ultimate Optimizer
// @name:zh-CN   Linux.do 社区终极优化脚本
// @namespace    https://linux.do/
// @version      0.3.3
// @description  Independent split reading, in-page topic tabs, reliable view tracking and multi-tab link previews for Linux.do.
// @description:zh-CN 持久化分屏阅读、页内帖子标签、阅读计数修复与多标签链接预览。
// @author       Linux.do Community
// @license      MIT
// @match        https://linux.do/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-start
// @noframes
// ==/UserScript==

"use strict";(()=>{var DEFAULT_SETTINGS={schemaVersion:2,enabled:!0,layoutPreference:"auto",tabsEnabled:!0,restoreSession:!1,hidePosters:!0,colorizeTabs:!0,previewEnabled:!1,creditEnabled:!0,previewClickMode:"double",maxLiveFrames:3,paneSizes:{sidebar:216,listRatio:.35}},SESSION_SCHEMA_VERSION=1,SETTINGS_KEY="linuxdo-ultimate:settings",SESSION_KEY_PREFIX="linuxdo-ultimate:session:",SESSION_ID_KEY="linuxdo-ultimate:session-id",SESSION_OWNER_KEY_PREFIX="linuxdo-ultimate:session-owner:",SESSION_INDEX_KEY="linuxdo-ultimate:session-index",LATEST_SESSION_KEY="linuxdo-ultimate:latest-session",LATEST_SESSION_CANDIDATE_KEY="linuxdo-ultimate:latest-session-candidate";function normalizeSettings(value){if(!value||typeof value!="object")return structuredClone(DEFAULT_SETTINGS);let source=value,isCurrentSchema=source.schemaVersion===DEFAULT_SETTINGS.schemaVersion,paneSizes=source.paneSizes&&typeof source.paneSizes=="object"?source.paneSizes:{};return{...DEFAULT_SETTINGS,enabled:!0,layoutPreference:source.layoutPreference==="two"||source.layoutPreference==="three"?source.layoutPreference:"auto",tabsEnabled:source.tabsEnabled!==!1,restoreSession:isCurrentSchema&&source.restoreSession===!0,hidePosters:source.hidePosters!==!1,colorizeTabs:source.colorizeTabs!==!1,previewEnabled:source.previewEnabled===!0,creditEnabled:source.creditEnabled!==!1,previewClickMode:source.previewClickMode==="single"?"single":"double",maxLiveFrames:clampSetting(source.maxLiveFrames,1,10,DEFAULT_SETTINGS.maxLiveFrames),paneSizes:{sidebar:clampSetting(paneSizes.sidebar,160,360,DEFAULT_SETTINGS.paneSizes.sidebar),listRatio:clampRatio(paneSizes.listRatio,DEFAULT_SETTINGS.paneSizes.listRatio)}}}function clampSetting(value,min,max,fallback){return typeof value=="number"&&Number.isFinite(value)?Math.round(Math.min(max,Math.max(min,value))):fallback}function clampRatio(value,fallback){return typeof value=="number"&&Number.isFinite(value)?Math.min(.7,Math.max(.3,value)):fallback}function normalizeCategoryColor(value){if(typeof value!="string")return null;let color=value.trim();return/^(?:#[\da-f]{3,8}|rgba?\([\d\s.,%+-]+\)|hsla?\([\d\s.,%+-]+\)|(?:oklab|oklch|lab|lch|color)\([^;{}]+\))$/i.test(color)?color:null}function readTopicCategory(root,view=typeof window>"u"?null:window){let realm=view,ElementCtor=realm?.Element,HTMLElementCtor=realm?.HTMLElement,rootElement=ElementCtor&&root instanceof ElementCtor?root:null,wrapper=(rootElement?.matches(".badge-category__wrapper")?rootElement:null)??root.querySelector(".badge-category__wrapper");if(!wrapper||HTMLElementCtor&&!(wrapper instanceof HTMLElementCtor))return null;let htmlWrapper=wrapper,categoryName=wrapper.querySelector(".badge-category__name")?.textContent?.trim()??"",categoryColor=normalizeCategoryColor(htmlWrapper.style.getPropertyValue("--category-badge-color")||view?.getComputedStyle(htmlWrapper).getPropertyValue("--category-badge-color"));return categoryName&&categoryColor?{categoryName,categoryColor}:null}function normalizePaneSizes(value){if(!value||typeof value!="object")return{...DEFAULT_SETTINGS.paneSizes};let candidate=value;return{sidebar:clampNumber(candidate.sidebar,160,360,DEFAULT_SETTINGS.paneSizes.sidebar),listRatio:clampRatio2(candidate.listRatio,DEFAULT_SETTINGS.paneSizes.listRatio)}}function clampRatio2(value,fallback){return typeof value=="number"&&Number.isFinite(value)?Math.min(.7,Math.max(.3,value)):fallback}function clampNumber(value,min,max,fallback){return typeof value=="number"&&Number.isFinite(value)?Math.round(Math.min(max,Math.max(min,value))):fallback}function normalizeTab(value){if(!value||typeof value!="object")return null;let tab=value;return typeof tab.id!="string"||typeof tab.topicId!="string"||typeof tab.url!="string"?null:{id:tab.id,topicId:tab.topicId,url:tab.url,title:typeof tab.title=="string"&&tab.title.trim()?tab.title:`\u4E3B\u9898 ${tab.topicId}`,...typeof tab.categoryName=="string"&&tab.categoryName.trim()&&normalizeCategoryColor(tab.categoryColor)?{categoryName:tab.categoryName.trim(),categoryColor:normalizeCategoryColor(tab.categoryColor)}:{},...typeof tab.postNumber=="number"&&Number.isFinite(tab.postNumber)?{postNumber:Math.max(1,Math.floor(tab.postNumber))}:{},scrollY:clampNumber(tab.scrollY,0,1e7,0),suspended:tab.suspended===!0,lastActiveAt:clampNumber(tab.lastActiveAt,0,Number.MAX_SAFE_INTEGER,0)}}function createSession(sessionId,listUrl,now){return{schemaVersion:SESSION_SCHEMA_VERSION,sessionId,listUrl,listScrollY:0,layoutMode:"native",paneSizes:{...DEFAULT_SETTINGS.paneSizes},tabs:[],activeTabId:null,secondaryTabIds:[],secondaryActiveTabId:null,updatedAt:now}}function normalizeSession(value,fallback){if(!value||typeof value!="object")return fallback;let source=value;if(source.schemaVersion!==SESSION_SCHEMA_VERSION||typeof source.sessionId!="string")return fallback;let tabs=Array.isArray(source.tabs)?source.tabs.map(normalizeTab).filter(tab=>tab!==null):[],seenTopics=new Set,uniqueTabs=tabs.filter(tab=>seenTopics.has(tab.topicId)?!1:(seenTopics.add(tab.topicId),!0)),validTabIds=new Set(uniqueTabs.map(tab=>tab.id)),secondaryTabIds=Array.isArray(source.secondaryTabIds)?[...new Set(source.secondaryTabIds.filter(id=>typeof id=="string"&&validTabIds.has(id)))]:[],secondaryIds=new Set(secondaryTabIds),primaryTabs=uniqueTabs.filter(tab=>!secondaryIds.has(tab.id)),activeTabId=primaryTabs.some(tab=>tab.id===source.activeTabId)?source.activeTabId:primaryTabs.at(-1)?.id??null,secondaryActiveTabId=secondaryTabIds.includes(source.secondaryActiveTabId??"")?source.secondaryActiveTabId:secondaryTabIds.at(-1)??null;return{schemaVersion:SESSION_SCHEMA_VERSION,sessionId:source.sessionId,listUrl:typeof source.listUrl=="string"&&source.listUrl?source.listUrl:fallback.listUrl,listScrollY:clampNumber(source.listScrollY,0,1e7,0),layoutMode:source.layoutMode==="two"||source.layoutMode==="three"?source.layoutMode:"native",paneSizes:normalizePaneSizes(source.paneSizes),tabs:uniqueTabs,activeTabId,secondaryTabIds,secondaryActiveTabId,updatedAt:clampNumber(source.updatedAt,0,Number.MAX_SAFE_INTEGER,fallback.updatedAt)}}function upsertTopicTab(session,input,now){let existing=session.tabs.find(tab=>tab.topicId===input.topicId),nextTab=existing?{...existing,...input,suspended:!1,lastActiveAt:now}:{id:`topic-${input.topicId}`,topicId:input.topicId,url:input.url,title:input.title||`\u4E3B\u9898 ${input.topicId}`,...input.postNumber?{postNumber:input.postNumber}:{},...input.categoryName&&input.categoryColor?{categoryName:input.categoryName,categoryColor:input.categoryColor}:{},scrollY:0,suspended:!1,lastActiveAt:now},tabs=existing?session.tabs.map(tab=>tab.topicId===input.topicId?nextTab:tab):[...session.tabs,nextTab],staysSecondary=session.secondaryTabIds.includes(nextTab.id);return{...session,tabs,activeTabId:staysSecondary?session.activeTabId:nextTab.id,secondaryActiveTabId:staysSecondary?nextTab.id:session.secondaryActiveTabId,updatedAt:now}}function closeTopicTab(session,tabId,now){let index=session.tabs.findIndex(tab=>tab.id===tabId);if(index<0)return session;let tabs=session.tabs.filter(tab=>tab.id!==tabId),secondaryTabIds=session.secondaryTabIds.filter(id=>id!==tabId),secondaryIds=new Set(secondaryTabIds),primaryTabs=tabs.filter(tab=>!secondaryIds.has(tab.id)),nextActive=session.activeTabId===tabId?primaryTabs[Math.min(index,primaryTabs.length-1)]?.id??primaryTabs.at(-1)?.id??null:session.activeTabId,nextSecondaryActive=session.secondaryActiveTabId===tabId?secondaryTabIds.at(-1)??null:session.secondaryActiveTabId;return{...session,tabs,activeTabId:nextActive,secondaryTabIds,secondaryActiveTabId:nextSecondaryActive,updatedAt:now}}var STORAGE_FAILURE_EVENT="ldu:storage-failure",storageFailureReported=!1;function reportStorageFailure(operation,key){storageFailureReported||(storageFailureReported=!0,console.warn(`[Linux.do Ultimate] \u672C\u5730\u5B58\u50A8\u4E0D\u53EF\u7528\uFF0C${operation} ${key} \u5931\u8D25\u3002`),typeof window<"u"&&window.dispatchEvent(new CustomEvent(STORAGE_FAILURE_EVENT,{detail:{operation,key}})))}function hasStorageFailure(){return storageFailureReported}function safeJsonParse(raw,fallback){if(!raw)return fallback;try{return JSON.parse(raw)}catch{return fallback}}var UserscriptStorage=class{backend=typeof GM_getValue=="function"&&typeof GM_setValue=="function"&&typeof GM_deleteValue=="function"?"userscript":"local";get(key,fallback){if(this.backend==="userscript")try{return GM_getValue(key,fallback)}catch{return reportStorageFailure("\u8BFB\u53D6",key),fallback}try{return safeJsonParse(window.localStorage.getItem(key),fallback)}catch{return reportStorageFailure("\u8BFB\u53D6",key),fallback}}set(key,value){if(this.backend==="userscript"){try{GM_setValue(key,value)}catch{reportStorageFailure("\u5199\u5165",key)}return}try{window.localStorage.setItem(key,JSON.stringify(value))}catch{reportStorageFailure("\u5199\u5165",key)}}remove(key){if(this.backend==="userscript"){try{GM_deleteValue(key)}catch{reportStorageFailure("\u5220\u9664",key)}return}try{window.localStorage.removeItem(key)}catch{reportStorageFailure("\u5220\u9664",key)}}};function getSessionId(storage=window.sessionStorage){try{let existing=storage.getItem(SESSION_ID_KEY);if(existing)return existing;let value=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`;return storage.setItem(SESSION_ID_KEY,value),value}catch{return"ephemeral"}}function isReloadNavigation(performanceApi=window.performance){try{return performanceApi.getEntriesByType("navigation")[0]?.type==="reload"}catch{return!1}}var SESSION_OWNER_TTL_MS=5*6e4,SESSION_RETENTION_MS=720*60*6e4;function readRestorableSessions(storage){let candidate=storage.get(LATEST_SESSION_CANDIDATE_KEY,null);return Array.isArray(candidate)?candidate.filter(entry=>!!(entry&&typeof entry=="object"&&typeof entry.closedAt=="number"&&entry.session&&typeof entry.session.sessionId=="string")):[candidate,storage.get(LATEST_SESSION_KEY,null)].filter(value=>!!(value&&typeof value=="object"&&typeof value.sessionId=="string")).map(session=>({session,closedAt:session.updatedAt||0}))}function writeRestorableSessions(storage,entries){storage.set(LATEST_SESSION_CANDIDATE_KEY,entries),storage.remove(LATEST_SESSION_KEY)}function readSessionIndex(storage){let value=storage.get(SESSION_INDEX_KEY,[]);return Array.isArray(value)?value.filter(entry=>!!(entry&&typeof entry=="object"&&typeof entry.sessionId=="string"&&typeof entry.updatedAt=="number")):[]}function writeSessionIndex(storage,entries){storage.set(SESSION_INDEX_KEY,entries)}function touchSessionIndex(storage,sessionId,updatedAt){let entries=readSessionIndex(storage).filter(entry=>entry.sessionId!==sessionId);entries.push({sessionId,updatedAt}),writeSessionIndex(storage,entries)}function claimSessionId(storage,tabStorage=window.sessionStorage,now=Date.now(),reuseExistingSession=!1){let sessionId=getSessionId(tabStorage),existing=storage.get(`${SESSION_OWNER_KEY_PREFIX}${sessionId}`,null);if(!reuseExistingSession&&existing&&now>=existing.updatedAt&&now-existing.updatedAt<SESSION_OWNER_TTL_MS){sessionId=createUniqueId();try{tabStorage.setItem(SESSION_ID_KEY,sessionId)}catch{}}let lease={sessionId,ownerId:createUniqueId()};return storage.set(`${SESSION_OWNER_KEY_PREFIX}${sessionId}`,{ownerId:lease.ownerId,updatedAt:now}),lease}function refreshSessionLease(storage,lease,now=Date.now()){let owner=storage.get(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`,null);owner?.ownerId===lease.ownerId&&(storage.set(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`,{...owner,updatedAt:now}),touchSessionIndex(storage,lease.sessionId,now))}function releaseSessionLease(storage,lease){storage.get(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`,null)?.ownerId===lease.ownerId&&storage.remove(`${SESSION_OWNER_KEY_PREFIX}${lease.sessionId}`)}function createUniqueId(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`}function loadSettings(storage){return normalizeSettings(storage.get(SETTINGS_KEY,DEFAULT_SETTINGS))}function saveSettings(storage,settings){storage.set(SETTINGS_KEY,normalizeSettings(settings))}function loadSessionIfPresent(storage,sessionId,listUrl,now){let stored=storage.get(`${SESSION_KEY_PREFIX}${sessionId}`,null);return stored==null?null:normalizeSession(stored,createSession(sessionId,listUrl,now))}function loadLatestSession(storage,sessionId,listUrl,now){let entry=readRestorableSessions(storage).filter(candidate=>candidate.session.sessionId!==sessionId).sort((a,b)=>a.closedAt-b.closedAt).at(-1);if(!entry)return null;let normalized=normalizeSession(entry.session,createSession(sessionId,listUrl,now));return normalized.sessionId!==sessionId&&clearSession(storage,normalized.sessionId),clearRestorableSessions(storage),normalized.tabs.length===0?null:{...normalized,sessionId}}function saveSession(storage,session){storage.set(`${SESSION_KEY_PREFIX}${session.sessionId}`,session),touchSessionIndex(storage,session.sessionId,session.updatedAt)}function stageSessionClose(storage,session,closedAt=Date.now()){if(session.tabs.length===0)return;let entries=readRestorableSessions(storage).filter(entry=>entry.session.sessionId!==session.sessionId);entries.push({session,closedAt}),writeRestorableSessions(storage,entries.sort((a,b)=>a.closedAt-b.closedAt).slice(-8))}function reconcileSessionClose(storage,sessionId){let restorable=readRestorableSessions(storage).filter(entry=>entry.session.sessionId!==sessionId);restorable.length>0?writeRestorableSessions(storage,restorable):clearRestorableSessions(storage)}function cleanupExpiredSessions(storage,now=Date.now()){let retainedIndex=[];for(let entry of readSessionIndex(storage))now-entry.updatedAt>=SESSION_RETENTION_MS?(storage.remove(`${SESSION_KEY_PREFIX}${entry.sessionId}`),storage.remove(`${SESSION_OWNER_KEY_PREFIX}${entry.sessionId}`)):retainedIndex.push(entry);writeSessionIndex(storage,retainedIndex)}function clearRestorableSessions(storage){storage.remove(LATEST_SESSION_CANDIDATE_KEY),storage.remove(LATEST_SESSION_KEY)}function clearSession(storage,sessionId){storage.remove(`${SESSION_KEY_PREFIX}${sessionId}`),storage.remove(`${SESSION_OWNER_KEY_PREFIX}${sessionId}`),writeSessionIndex(storage,readSessionIndex(storage).filter(entry=>entry.sessionId!==sessionId))}var LIST_PATHS=new Set(["/","/latest","/new","/unseen","/hot","/top","/read","/posted","/bookmarks","/categories","/tags"]);function isAllowedHost(hostname){return hostname==="linux.do"?!0:globalThis.window?.__LDU_TEST_MODE__===!0&&(hostname==="localhost"||hostname==="127.0.0.1")}function getTopicInfo(rawUrl,baseUrl="https://linux.do/"){let url;try{url=new URL(rawUrl,baseUrl)}catch{return null}if(!isAllowedHost(url.hostname)||url.hostname==="linux.do"&&url.protocol!=="https:")return null;let parts=url.pathname.split("/").filter(Boolean);if(parts[0]!=="t"&&parts[0]!=="n"||parts.length<2)return null;let topicIndex=/^\d+$/.test(parts[1]??"")?1:2,topicId=parts[topicIndex],postPart=parts[topicIndex+1];if(!topicId||!/^\d+$/.test(topicId)||parts.length>topicIndex+2||postPart!==void 0&&!/^\d+$/.test(postPart))return null;let postNumber=postPart?Number(postPart):void 0;return{url,topicId,...postNumber?{postNumber}:{}}}function classifyRoute(rawUrl,baseUrl="https://linux.do/"){let url;try{url=new URL(rawUrl,baseUrl)}catch{return"other"}return getTopicInfo(url.href)?"topic":url.pathname==="/chat"||url.pathname.startsWith("/chat/")?"chat":url.pathname==="/search"||url.pathname.startsWith("/search/")?"search":url.pathname.startsWith("/u/")?"user":LIST_PATHS.has(url.pathname)||url.pathname.startsWith("/c/")||url.pathname.startsWith("/tag/")?"list":"other"}function isSplitRoute(rawUrl,baseUrl="https://linux.do/"){let route=classifyRoute(rawUrl,baseUrl);return route==="list"||route==="search"}function isSupportedTopicTarget(targetUrl,currentUrl){let target=getTopicInfo(targetUrl,currentUrl),current=getTopicInfo(currentUrl,currentUrl);return!!(target&&(!current||target.topicId!==current.topicId))}var NON_PAGE_PATH=/^\/(?:uploads|secure-media-uploads|user_avatar|letter_avatar_proxy|clicks)(?:\/|$)/,FILE_PATH=/\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|pdf|zip|rar|7z|tar|gz|bz2|xz|dmg|exe|msi|apk|deb|rpm|iso|mp4|mkv|avi|mov|webm|mp3|flac|wav|docx?|xlsx?|pptx?)(?:$|\/)/i;function isNavigableForumPage(targetUrl,currentUrl){let target,current;try{target=new URL(targetUrl,currentUrl),current=new URL(currentUrl)}catch{return!1}return!/^https?:$/.test(target.protocol)||target.origin!==current.origin||getTopicInfo(target.href,current.href)||target.pathname===current.pathname&&target.search===current.search&&target.hash?!1:!NON_PAGE_PATH.test(target.pathname)&&!FILE_PATH.test(target.pathname)}var PREFIX="linuxdo-ultimate:view:v1:";var TRACKING_SESSION_KEY=`${PREFIX}session-id`,LOCK_INDEX_KEY=`${PREFIX}lock-index`;var ViewTracker=class{constructor(options){this.options=options;this.fetcher=options.fetcher??fetch.bind(globalThis),this.now=options.now??Date.now,this.timeoutMs=options.timeoutMs??8e3}fetcher;now;timeoutMs;memoryLocks=new Map;async track(info,source,referrerUrl,force=!1){if(info.url.origin!=="https://linux.do")return{status:"skipped"};let token=this.claim(info,source,force);if(!token)return{status:"skipped"};if(this.options.beforeClaimConfirmation?.(),!this.owns(info,token))return{status:"skipped"};let attempts=[];try{let pageview=await this.sendPageview(info,referrerUrl);if(attempts.push(pageview),pageview.confirmed)return this.complete(info,token,source,"confirmed"),{status:"confirmed",confirmedBy:"pageview"}}catch{attempts.push({ok:!1,confirmed:!1})}try{let fallback=await this.sendTopicJson(info);if(attempts.push(fallback),fallback.confirmed)return this.complete(info,token,source,"confirmed"),{status:"confirmed",confirmedBy:"topic-json"}}catch{attempts.push({ok:!1,confirmed:!1})}return attempts.some(attempt=>attempt.ok)?(this.complete(info,token,source,"accepted"),{status:"accepted"}):(this.clearIfOwned(info,token),{status:"failed"})}stateKey(info){return`${PREFIX}${info.url.hostname}:${info.topicId}`}readState(info){let key=this.stateKey(info);try{return JSON.parse(this.options.storage.getItem(key)??"null")??this.memoryLocks.get(key)??null}catch{return this.memoryLocks.get(key)??null}}claim(info,source,force){this.cleanupExpiredLocks();let existing=this.readState(info);if(!force&&existing?.expiresAt&&existing.expiresAt>this.now())return null;let token=globalThis.crypto?.randomUUID?.()??`${this.now()}-${Math.random().toString(36).slice(2)}`,state={status:"pending",token,source,expiresAt:this.now()+3e4};return this.writeState(this.stateKey(info),state),this.owns(info,token)?token:null}complete(info,token,source,status){this.writeState(this.stateKey(info),{status,token,source,expiresAt:this.now()+288e5})}clearIfOwned(info,token){this.readState(info)?.token===token&&this.removeState(this.stateKey(info))}owns(info,token){return this.readState(info)?.token===token}writeState(key,state){this.memoryLocks.set(key,state);try{this.options.storage.setItem(key,JSON.stringify(state));let entries=this.readLockIndex().filter(entry=>entry.key!==key);entries.push({key,expiresAt:state.expiresAt}),this.options.storage.setItem(LOCK_INDEX_KEY,JSON.stringify(entries))}catch{}}removeState(key){this.memoryLocks.delete(key);try{this.options.storage.removeItem(key),this.options.storage.setItem(LOCK_INDEX_KEY,JSON.stringify(this.readLockIndex().filter(entry=>entry.key!==key)))}catch{}}readLockIndex(){try{let value=JSON.parse(this.options.storage.getItem(LOCK_INDEX_KEY)??"[]");return Array.isArray(value)?value.filter(entry=>!!(entry&&typeof entry=="object"&&typeof entry.key=="string"&&typeof entry.expiresAt=="number")):[]}catch{return[]}}cleanupExpiredLocks(){let now=this.now();for(let[key,state]of this.memoryLocks)state.expiresAt<=now&&this.memoryLocks.delete(key);let entries=this.readLockIndex(),retained=entries.filter(entry=>{if(entry.expiresAt>now)return!0;try{this.options.storage.removeItem(entry.key)}catch{}return!1});if(retained.length!==entries.length)try{this.options.storage.setItem(LOCK_INDEX_KEY,JSON.stringify(retained))}catch{}}commonHeaders(){let headers={Accept:"application/json, text/javascript, */*; q=0.01","X-Requested-With":"XMLHttpRequest","Discourse-Present":"true"},csrf=this.options.csrfToken();return csrf&&(headers["X-CSRF-Token"]=csrf),headers}async sendPageview(info,referrerUrl){let headers={...this.commonHeaders(),"Discourse-Track-View-Deferred":"true","Discourse-Track-View-Topic-Id":info.topicId,"Discourse-Track-View-Url":info.url.href,"Discourse-Track-View-Referrer":referrerUrl,"Discourse-Track-View-Session-Id":this.options.trackingSessionId()},response=await this.fetchWithTimeout(`${info.url.origin}${this.basePath()}/pageview`,{method:"POST",credentials:"same-origin",cache:"no-store",keepalive:!0,headers});return this.readAttempt(response)}async sendTopicJson(info){let response=await this.fetchWithTimeout(`${info.url.origin}${this.basePath()}/t/${info.topicId}.json?track_visit=true&forceLoad=true`,{method:"GET",credentials:"same-origin",cache:"no-store",headers:{...this.commonHeaders(),"Discourse-Track-View":"true","Discourse-Track-View-Topic-Id":info.topicId}});return this.readAttempt(response)}basePath(){let value=this.options.basePath?.()??"";return value?`/${value.replace(/^\/+|\/+$/g,"")}`:""}readAttempt(response){let trackView=response.headers.get("x-discourse-trackview"),browserPageView=response.headers.get("x-discourse-browserpageview");return{ok:response.ok,confirmed:trackView==="1"||browserPageView==="1"}}async fetchWithTimeout(url,init){let controller=new AbortController,timer=globalThis.setTimeout(()=>controller.abort(),this.timeoutMs);try{return await this.fetcher(url,{...init,signal:controller.signal})}finally{globalThis.clearTimeout(timer)}}};function createBrowserViewTracker(){return new ViewTracker({storage:window.localStorage,csrfToken:()=>document.querySelector('meta[name="csrf-token"]')?.content??"",trackingSessionId:()=>getOrCreateTrackingSessionId(window.sessionStorage,document.querySelector('meta[name="discourse-track-view-session-id"]')?.content??""),basePath:()=>document.querySelector('meta[name="discourse-base-uri"]')?.content??""})}var memoryTrackingSessionId="";function getOrCreateTrackingSessionId(storage,metaValue="",createId=randomId){if(metaValue)return metaValue;try{let existing=storage.getItem(TRACKING_SESSION_KEY);if(existing)return existing;let value=createId();return storage.setItem(TRACKING_SESSION_KEY,value),value}catch{return memoryTrackingSessionId||(memoryTrackingSessionId=createId()),memoryTrackingSessionId}}function randomId(){return globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`}var APP_STYLE_ID="linuxdo-ultimate-styles",LIST_FRAME_STYLE_ID="linuxdo-ultimate-list-frame-styles",TOPIC_FRAME_STYLE_ID="linuxdo-ultimate-topic-frame-styles",LIST_FRAME_STYLES=`
html[data-ldu-embedded-list="true"] #d-splash { display: none !important; }
html[data-ldu-embedded-list="true"] :is(#d-sidebar, .sidebar-wrapper, .d-header) { display: none !important; }
html[data-ldu-embedded-list="true"], html[data-ldu-embedded-list="true"] body { overflow-x: hidden !important; overflow-y: auto !important; }
html[data-ldu-embedded-list="true"] :is(#main-container, #main-outlet-wrapper, #main-outlet) { width: 100% !important; max-width: none !important; margin: 0 !important; box-sizing: border-box !important; }
html[data-ldu-embedded-list="true"] #main-outlet-wrapper { display: block !important; padding: 0 !important; }
html[data-ldu-embedded-list="true"] #main-outlet { padding: 0 10px max(12px, env(safe-area-inset-bottom)) !important; container-type: inline-size; }
html[data-ldu-embedded-list="true"][data-ldu-hide-posters="true"] #main-outlet .topic-list .posters { display: none !important; }
`,TOPIC_FRAME_STYLES=`
html[data-ldu-embedded-topic="true"] #d-splash { display: none !important; }
html[data-ldu-embedded-topic="true"] :is(#d-sidebar, .sidebar-wrapper, .d-header) { display: none !important; }
html[data-ldu-embedded-topic="true"] :is(#main-container, #main-outlet, .post-stream, .topic-post, .topic-body) { width: 100% !important; max-width: none !important; margin-inline: 0 !important; box-sizing: border-box !important; }
html[data-ldu-embedded-topic="true"] #main-outlet-wrapper { width: 100% !important; max-width: none !important; grid-template-columns: minmax(0, 1fr) !important; grid-template-areas: "content" !important; }
html[data-ldu-embedded-topic="true"] #main-outlet { grid-area: content !important; padding: 12px clamp(12px, 3vw, 40px) max(12px, env(safe-area-inset-bottom)) !important; }
html[data-ldu-embedded-topic="true"] .container.posts { width: 100% !important; max-width: none !important; grid-template-columns: minmax(0, 1fr) minmax(7.5rem, 16%) !important; grid-template-areas: "posts timeline" !important; }
html[data-ldu-embedded-topic="true"] .topic-navigation { display: block !important; grid-area: timeline !important; min-width: 0 !important; margin-inline-start: clamp(.35rem, 1vw, .75rem) !important; }
html[data-ldu-embedded-topic="true"] :is(.timeline-container, .topic-timeline) { display: block !important; width: 100% !important; min-width: 0 !important; }
html[data-ldu-embedded-topic="true"] .timeline-footer-controls { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: .35rem !important; align-items: stretch !important; }
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .show-summary { grid-column: 1 / -1 !important; width: 100% !important; }
html[data-ldu-embedded-topic="true"] .timeline-footer-controls :is(.reply-to-post, .topic-notifications-button, .topic-notifications-button > button) { width: 100% !important; }
`,APP_STYLES=`
:root {
  --ldu-sidebar-width: 216px;
  --ldu-topic-track: 0.65fr;
  --ldu-list-track: 0.35fr;
  --ldu-header-height: var(--header-offset, 52px);
  --ldu-border: var(--primary-low, #d9d9d9);
  --ldu-surface: var(--secondary, #fff);
  --ldu-surface-muted: var(--primary-very-low, #f5f5f5);
  --ldu-text: var(--primary, #222);
  --ldu-accent: var(--tertiary, #0088cc);
  --ldu-danger: var(--danger, #d04437);
  --ldu-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
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

body.ldu-hide-posters #main-outlet .topic-list .posters {
  display: none !important;
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

.ldu-topic-toolbar {
  display: flex;
  min-height: 38px;
  align-items: center;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
}

.ldu-tab-strip {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: stretch;
  gap: 4px;
  overflow: hidden;
}

.ldu-tab-item {
  --ldu-tab-category-color: transparent;
  display: flex;
  width: auto;
  min-width: 0;
  max-width: 220px;
  flex: 1 1 0;
  align-items: center;
  box-sizing: border-box;
  position: relative;
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
  gap: 10px;
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
.ldu-context-shortcut { color: var(--primary-medium, #5f6368); }
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
  transition: background-color 120ms ease, color 120ms ease, transform 120ms var(--ldu-ease-out);
}

.ldu-list-frame:not([data-ldu-ready="true"]),
.ldu-topic-frame:not([data-ldu-ready="true"]) {
  visibility: hidden;
}

html.ldu-split-booting #main-container {
  visibility: hidden !important;
}

.ldu-tab-close:active,
.ldu-context-item:active { transform: scale(.97); }

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
  overflow: hidden;
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
  margin: 0;
  padding: 0;
  color: var(--ldu-text);
  font-size: var(--font-up-1, 1.05rem);
  font-weight: 700;
  line-height: 1.3;
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
  font-size: var(--font-0, 1rem);
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
.ldu-settings-panel .dc-label-box { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.ldu-settings-panel .dc-item-title { color: var(--ldu-text); font-size: var(--font-down-1, .875rem); font-weight: 600; line-height: 1.3; }
.ldu-settings-panel .dc-item-desc { color: var(--primary-medium, #8b949e); font-size: var(--font-down-2, .75rem); line-height: 1.35; }
.ldu-settings-panel .dc-item-desc.alert { color: var(--danger, #f85149); }
.ldu-settings-panel .ldu-settings-risk[hidden] { display: none; }

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
.ldu-settings-panel .ldu-settings-action-icon { display: inline-flex; align-items: center; justify-content: center; }
.ldu-settings-panel .dc-btn:hover { border-color: var(--primary-medium, #777); background: var(--primary-low, #2a2d32); }
.ldu-settings-panel .dc-btn-ghost { border-color: transparent; background: transparent; color: var(--primary-medium, #8b949e); }
.ldu-settings-panel .dc-btn-ghost:hover { border-color: transparent; background: color-mix(in srgb, var(--danger, #e45735) 10%, transparent); color: var(--danger, #e45735); }
.ldu-settings-panel .dc-footer-right { position: relative; display: flex; gap: 8px; }
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

@media (max-height: 760px) and (min-width: 800px) {
  .ldu-settings-panel { width: min(860px, calc(100vw - 16px)); }
  .ldu-settings-panel .dc-header { padding-block: 10px; }
  .ldu-settings-panel .dc-body {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 24px;
    padding-block: 12px;
  }
  .ldu-settings-panel .dc-group { margin-bottom: 0; }
  .ldu-settings-panel .dc-group:last-child {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 18px;
  }
  .ldu-settings-panel .dc-group:last-child .dc-group-title { grid-column: 1 / -1; }
  .ldu-settings-panel .dc-row { gap: 10px; padding-block: 7px; }
  .ldu-settings-panel .dc-footer { padding-block: 9px; }
}

.ldu-context-icon {
  display: inline-grid;
  width: 18px;
  height: 18px;
  place-items: center;
  color: var(--primary-medium, #5f6368);
  pointer-events: none;
}
.ldu-context-item:disabled .ldu-context-icon { opacity: .75; }
.ldu-symbol { display: block; flex: none; pointer-events: none; }
.ldu-symbol-fill { fill: currentColor; }

.ldu-tab-item[draggable="true"] { cursor: grab; }
.ldu-tab-item.is-dragging { opacity: .58; }
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
  .ldu-icon-button,
  .ldu-resize-handle::after,
  .ldu-settings-panel,
  .ldu-settings-reset,
  .ldu-settings-action,
  .ldu-donate-menu a { transition-duration: 0ms !important; }
}
`;function ensureAppStyles(doc=document){let existing=doc.getElementById(APP_STYLE_ID);if(existing?.tagName==="STYLE")return existing;let style=doc.createElement("style");return style.id=APP_STYLE_ID,style.textContent=APP_STYLES,(doc.head??doc.documentElement).append(style),style}function ensureFrameStyles(role,doc){let id=role==="list"?LIST_FRAME_STYLE_ID:TOPIC_FRAME_STYLE_ID,existing=doc.getElementById(id);if(existing?.tagName==="STYLE")return existing;let style=doc.createElement("style");return style.id=id,style.textContent=role==="list"?LIST_FRAME_STYLES:TOPIC_FRAME_STYLES,(doc.head??doc.documentElement).append(style),style}var DOUBLE_CLICK_DELAY_MS=300,NAVIGATION_ACK_TIMEOUT_MS=700,installedBridges=new WeakMap;function installTopicFrameBridge(win,doc,tabId){return installBridge({role:"topic",id:tabId,win,doc})}function installListFrameBridge(win,doc,frameId){return installBridge({role:"list",id:frameId,win,doc})}function installBridge(options){let{role,id,win,doc}=options,root=doc.documentElement;if(!root)return()=>{};let bridgeMarker=`${role}:${id}`,existing=installedBridges.get(doc);if(existing&&root.dataset.lduFrameBridge===bridgeMarker)return existing;existing?.(),ensureFrameStyles(role,doc);let disposed=!1,stateTimer=null,clickTimer=null,lastUrl="",lastTitle="",lastCategoryKey="",previewEnabled=!1,previewClickMode="double",replayingClick=!1,navigationSequence=0,currentCategory=role==="topic"?readTopicCategory(doc,win):null,listeners=[],pendingNavigations=new Map,on=(target,type,listener,options2)=>{target.addEventListener(type,listener,options2),listeners.push(()=>target.removeEventListener(type,listener,options2))},post=payload=>{disposed||win.parent.postMessage(payload,win.location.origin)},cancelClick=()=>{clickTimer!==null&&win.clearTimeout(clickTimer),clickTimer=null},sendNavigation=(payload,link)=>{let requestId=`${id}:${Date.now()}:${navigationSequence+=1}`,timer=win.setTimeout(()=>{if(pendingNavigations.delete(requestId),!!link.isConnected){replayingClick=!0;try{link.click()}finally{replayingClick=!1}}},NAVIGATION_ACK_TIMEOUT_MS);pendingNavigations.set(requestId,{timer,link}),post({...payload,requestId})},sendState=(ready=!1)=>{stateTimer!==null&&win.clearTimeout(stateTimer),stateTimer=win.setTimeout(()=>{if(stateTimer=null,role==="list"){lastUrl=win.location.href,lastTitle=doc.title,post({type:ready?"ldu:list-ready":"ldu:list-state",frameId:id,url:win.location.href,title:doc.title,scrollY:win.scrollY});return}let payload={type:ready?"ldu:frame-ready":"ldu:frame-state",tabId:id,scrollY:win.scrollY};currentCategory&&Object.assign(payload,currentCategory),(ready||lastUrl!==win.location.href)&&(lastUrl=win.location.href,payload.url=win.location.href,payload.title=doc.title),post(payload)},ready?0:role==="list"?100:120)},MutationObserverCtor=win.MutationObserver,observer=new MutationObserverCtor(()=>{if(role==="list"){(lastUrl!==win.location.href||lastTitle!==doc.title)&&sendState();return}lastUrl!==win.location.href&&(currentCategory=null),currentCategory||(currentCategory=readTopicCategory(doc,win));let categoryKey=currentCategory?`${currentCategory.categoryName}
${currentCategory.categoryColor}`:"";lastUrl===win.location.href&&lastTitle===doc.title&&lastCategoryKey===categoryKey||(lastTitle=doc.title,lastCategoryKey=categoryKey,sendState())});observer.observe(doc.body??root,{childList:!0,subtree:!0}),on(win,"scroll",()=>sendState(),{passive:!0}),on(win,"popstate",()=>sendState()),on(win,"hashchange",()=>sendState()),on(win,"message",(event=>{if(event.origin!==win.location.origin||event.source!==win.parent)return;let data=event.data;if((role==="topic"?data?.tabId:data?.frameId)===id){if(data?.type==="ldu:navigation-ack"&&typeof data.requestId=="string"){let pending=pendingNavigations.get(data.requestId);if(!pending)return;win.clearTimeout(pending.timer),pendingNavigations.delete(data.requestId);return}if(role==="topic"&&data?.type==="ldu:bookmark"){bookmarkTopic(options,data.topicId);return}data?.type==="ldu:preview-config"&&(previewEnabled=data.enabled===!0,previewClickMode=data.clickMode==="single"?"single":"double",root.dataset.lduHidePosters=String(data.hidePosters!==!1),previewEnabled||cancelClick())}})),on(win,"pointerdown",(event=>{post(role==="topic"?{type:"ldu:frame-interaction",tabId:id}:{type:"ldu:list-interaction",frameId:id}),previewEnabled&&previewClickMode==="double"&&event.detail>=2&&cancelClick()}),!0),on(win,"click",event=>{if(replayingClick||!isPlainPrimaryClick(event))return;let link=closestLink(event.target,win);if(!(!link||preservesNativeNavigation(link))){if(isSupportedTopicTarget(link.href,win.location.href)){let info=getTopicInfo(link.href,win.location.href);if(!info)return;if(event.preventDefault(),event.stopImmediatePropagation(),role==="list"){let category=readTopicCategory(link.closest(".topic-list-item, .latest-topic-list-item, .search-result")??doc,win);sendNavigation({type:"ldu:list-topic-open",frameId:id,url:link.href,topicId:info.topicId,postNumber:info.postNumber,topicTitle:link.textContent?.trim()||`\u4E3B\u9898 ${info.topicId}`,...category??{}},link)}else sendNavigation({type:"ldu:topic-open",tabId:id,url:link.href,title:link.textContent?.trim()||`\u4E3B\u9898 ${info.topicId}`,...info.postNumber?{postNumber:info.postNumber}:{}},link);return}if(role==="topic"&&isSameOriginPage(link,win)){event.preventDefault(),event.stopImmediatePropagation(),sendNavigation({type:"ldu:list-navigate",tabId:id,url:link.href},link);return}if(!isControlLink(link)&&!(!previewEnabled||!isPreviewableLink(link,event.target,win))){if(event.preventDefault(),event.stopImmediatePropagation(),previewClickMode==="single"){sendPreview(options,link);return}cancelClick(),!(event.detail>=2)&&(clickTimer=win.setTimeout(()=>{if(clickTimer=null,!!link.isConnected){replayingClick=!0;try{link.click()}finally{replayingClick=!1}}},DOUBLE_CLICK_DELAY_MS))}}},!0),on(win,"dblclick",(event=>{if(!previewEnabled||previewClickMode!=="double"||!isPlainPrimaryClick(event))return;let link=closestLink(event.target,win);!link||preservesNativeNavigation(link)||!isPreviewableLink(link,event.target,win)||(cancelClick(),event.preventDefault(),event.stopImmediatePropagation(),sendPreview(options,link))}),!0),on(win,"keydown",(event=>{event.key!=="Escape"||!previewEnabled||post(role==="topic"?{type:"ldu:preview-dismiss",tabId:id}:{type:"ldu:list-preview-dismiss",frameId:id})}),!0);let sendReady=()=>sendState(!0);root.dataset.lduFrameBridge=bridgeMarker,root.dataset[role==="topic"?"lduEmbeddedTopic":"lduEmbeddedList"]="true",doc.readyState==="loading"?on(doc,"DOMContentLoaded",sendReady,{once:!0}):sendReady();let destroy=()=>{if(!disposed){disposed=!0,observer.disconnect();for(let remove of listeners.splice(0))remove();cancelClick();for(let pending of pendingNavigations.values())win.clearTimeout(pending.timer);pendingNavigations.clear(),stateTimer!==null&&win.clearTimeout(stateTimer),stateTimer=null,root.dataset.lduFrameBridge===bridgeMarker&&delete root.dataset.lduFrameBridge,installedBridges.get(doc)===destroy&&installedBridges.delete(doc)}};return installedBridges.set(doc,destroy),destroy}async function bookmarkTopic(options,value){let{win,doc,id}=options,topicId=typeof value=="string"&&/^\d+$/.test(value)?value:null,csrfToken=doc.querySelector('meta[name="csrf-token"]')?.content;if(!(!topicId||!csrfToken))try{let response=await win.fetch("/bookmarks.json",{method:"POST",credentials:"same-origin",headers:{Accept:"application/json","Content-Type":"application/x-www-form-urlencoded; charset=UTF-8","X-CSRF-Token":csrfToken,"X-Requested-With":"XMLHttpRequest"},body:new URLSearchParams({bookmarkable_type:"Topic",bookmarkable_id:topicId})});if(!response.ok){let message="\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25";try{let payload=await response.json();Array.isArray(payload.errors)&&typeof payload.errors[0]=="string"&&(message=payload.errors[0])}catch{}throw new Error(message)}win.parent.postMessage({type:"ldu:bookmark-result",tabId:id,ok:!0,message:"\u5DF2\u6DFB\u52A0\u5230\u4E66\u7B7E"},win.location.origin)}catch(error){win.parent.postMessage({type:"ldu:bookmark-result",tabId:id,ok:!1,message:error instanceof Error&&error.message?error.message:"\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"},win.location.origin)}}function closestLink(target,win){let ElementCtor=win.Element;return target instanceof ElementCtor?target.closest("a[href]"):null}function preservesNativeNavigation(link){return link.hasAttribute("download")||!!(link.target&&link.target.toLowerCase()!=="_self")}function isControlLink(link){return!!link.closest("button, [role=button], .btn, .d-button, input, textarea, select, .post-controls, .actions")}function isPlainPrimaryClick(event){return event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey}function isSameOriginPage(link,win){return isNavigableForumPage(link.href,win.location.href)}function isPreviewableLink(link,target,win){try{let url=new URL(link.href,win.location.href);if(!/^https?:$/.test(url.protocol)||url.origin===win.location.origin||getTopicInfo(url.href))return!1}catch{return!1}let ElementCtor=win.Element;return target instanceof ElementCtor&&target.closest("img, picture, .lightbox-wrapper")?!1:!link.matches(".lightbox")&&!link.querySelector("img, picture")&&!isControlLink(link)}function sendPreview(options,link){let rect=link.getBoundingClientRect(),anchorRect={left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height};options.win.parent.postMessage(options.role==="topic"?{type:"ldu:preview-open",tabId:options.id,url:link.href,anchorRect}:{type:"ldu:list-preview-open",frameId:options.id,url:link.href,anchorRect},options.win.location.origin)}var FrameBudget=class{limit;entries=new Map;constructor(limit){this.limit=this.clamp(limit)}setLimit(value){this.limit=this.clamp(value),this.enforce()}activate(pool,tabId,now){let poolEntries=this.entries.get(pool)??new Map;for(let entry of poolEntries.values())entry.active=!1;poolEntries.set(tabId,{pool,tabId,lastUsedAt:now,active:!0}),this.entries.set(pool,poolEntries),this.enforce()}remove(pool,tabId){let poolEntries=this.entries.get(pool);poolEntries?.delete(tabId),poolEntries?.size===0&&this.entries.delete(pool)}count(){return[...this.entries.values()].reduce((total,entries)=>total+entries.size,0)}enforce(){for(;this.count()>this.limit;){let candidate=[...this.entries.values()].flatMap(entries=>[...entries.values()]).filter(entry=>!entry.active).sort((a,b)=>a.lastUsedAt-b.lastUsedAt)[0];if(!candidate)return;candidate.pool.suspendForBudget(candidate.tabId)}}clamp(value){return Math.max(1,Math.min(10,Math.floor(value)))}},TopicFramePool=class{constructor(container,maxLiveFrames,onMessage,onSuspend,budget){this.container=container;this.maxLiveFrames=maxLiveFrames;this.onMessage=onMessage;this.onSuspend=onSuspend;this.budget=budget;this.liveLimit=Math.max(1,maxLiveFrames)}frames=new Map;liveLimit;previewConfig={enabled:!1,clickMode:"double"};setMaxLiveFrames(value){if(this.budget){this.budget.setLimit(value);return}this.liveLimit=Math.max(1,Math.min(10,Math.floor(value))),this.suspendOverflow("")}setPreviewConfig(config){this.previewConfig={...config};for(let record of this.frames.values())this.sendPreviewConfig(record.iframe)}activate(tab,now){let record=this.frames.get(tab.id);if(record){record.lastUsedAt=now,record.iframe.title=tab.title;let requestedUrl=new URL(tab.url,document.baseURI).href;record.iframe.src!==requestedUrl&&record.reportedUrl!==requestedUrl&&(record.reportedUrl=null,record.loaded=!1,record.expectedTopicId=tab.topicId,record.restoreScrollY=tab.scrollY,record.bridgeCleanup?.(),record.bridgeCleanup=null,delete record.iframe.dataset.lduReady,record.iframe.src=requestedUrl)}else{let iframe=document.createElement("iframe");iframe.className="ldu-topic-frame",iframe.name=`ldu-topic:${tab.id}`,iframe.title=tab.title,iframe.dataset.tabId=tab.id;let loadListener=()=>{let current=this.frames.get(tab.id);!current||current.iframe!==iframe||(current.loaded=!1,this.installBridge(tab.id,current),this.sendPreviewConfig(iframe),iframe.dataset.lduReady="true")};iframe.addEventListener("load",loadListener),iframe.src=tab.url,record={iframe,lastUsedAt:now,reportedUrl:null,loaded:!1,commands:[],loadListener,restoreScrollY:tab.scrollY,restoreTimer:null,restoreDeadline:0,bridgeCleanup:null,expectedTopicId:tab.topicId},this.frames.set(tab.id,record),this.container.append(iframe)}for(let[tabId,current]of this.frames){let active=tabId===tab.id;current.iframe.setAttribute("aria-hidden",String(!active)),current.iframe.tabIndex=active?0:-1}return this.budget?this.budget.activate(this,tab.id,now):this.suspendOverflow(tab.id),record.iframe}handleMessage(event){let data=event.data;if(!data||!["ldu:frame-state","ldu:frame-ready","ldu:frame-interaction","ldu:bookmark-result","ldu:preview-open","ldu:preview-dismiss","ldu:topic-open","ldu:list-navigate"].includes(data.type??"")||typeof data.tabId!="string")return;let record=this.frames.get(data.tabId);if(!record||event.origin!==location.origin||event.source!==record.iframe.contentWindow)return;if((data.type==="ldu:frame-state"||data.type==="ldu:frame-ready")&&data.url)try{let reportedUrl=new URL(data.url,document.baseURI).href;if(getTopicInfo(reportedUrl,document.baseURI)?.topicId!==record.expectedTopicId)return;record.reportedUrl=reportedUrl}catch{record.reportedUrl=null}data.type==="ldu:frame-ready"&&(record.loaded=!0,this.restoreScroll(record),this.sendPreviewConfig(record.iframe),this.flushCommands(record)),this.onMessage(data,record.iframe)&&data.requestId&&(data.type==="ldu:topic-open"||data.type==="ldu:list-navigate")&&record.iframe.contentWindow?.postMessage({type:"ldu:navigation-ack",tabId:data.tabId,requestId:data.requestId},location.origin)}remove(tabId){let record=this.frames.get(tabId);record&&(record.commands=[],record.bridgeCleanup?.(),record.bridgeCleanup=null,this.cancelScrollRestore(record),record.iframe.removeEventListener("load",record.loadListener),record.iframe.remove(),this.frames.delete(tabId),this.budget?.remove(this,tabId))}sendCommand(tabId,command){let record=this.frames.get(tabId);if(record){if(!record.loaded){record.commands.push(command);return}record.iframe.contentWindow?.postMessage({...command,tabId},location.origin)}}getFrame(tabId){return this.frames.get(tabId)?.iframe??null}reload(tabId){let record=this.frames.get(tabId);if(!record)return!1;record.loaded=!1,record.reportedUrl=null,record.bridgeCleanup?.(),record.bridgeCleanup=null,delete record.iframe.dataset.lduReady;try{record.iframe.contentWindow?.location.reload()}catch{record.iframe.src=record.iframe.src}return!0}detach(tabId){let record=this.frames.get(tabId);return record?(this.cancelScrollRestore(record),record.iframe.removeEventListener("load",record.loadListener),record.iframe.remove(),this.frames.delete(tabId),this.budget?.remove(this,tabId),record):null}adopt(tab,transfer,now){let iframe=transfer.iframe;iframe.name=`ldu-topic:${tab.id}`,iframe.dataset.tabId=tab.id,iframe.title=tab.title;let loadListener=()=>{let current=this.frames.get(tab.id);!current||current.iframe!==iframe||(current.loaded=!1,this.installBridge(tab.id,current),this.sendPreviewConfig(iframe),iframe.dataset.lduReady="true")};iframe.addEventListener("load",loadListener);let requestedUrl=new URL(tab.url,document.baseURI).href,needsNavigation=iframe.src!==requestedUrl&&transfer.reportedUrl!==requestedUrl,record={...transfer,lastUsedAt:now,reportedUrl:needsNavigation?null:transfer.reportedUrl,loaded:needsNavigation?!1:transfer.loaded,loadListener,restoreScrollY:tab.scrollY,restoreTimer:null,restoreDeadline:0,expectedTopicId:tab.topicId};return needsNavigation&&(record.bridgeCleanup?.(),record.bridgeCleanup=null,delete iframe.dataset.lduReady,iframe.src=requestedUrl),this.frames.set(tab.id,record),this.container.append(iframe),record.loaded&&(iframe.dataset.lduReady="true",this.sendPreviewConfig(iframe),this.flushCommands(record)),this.activate(tab,now),iframe}destroy(){for(let record of this.frames.values())record.commands=[],record.bridgeCleanup?.(),record.bridgeCleanup=null,this.cancelScrollRestore(record),record.iframe.removeEventListener("load",record.loadListener),record.iframe.remove(),this.budget?.remove(this,record.iframe.dataset.tabId??"");this.frames.clear()}sendPreviewConfig(iframe){iframe.contentWindow?.postMessage({type:"ldu:preview-config",tabId:iframe.dataset.tabId,...this.previewConfig},location.origin)}installBridge(tabId,record){record.bridgeCleanup?.(),record.bridgeCleanup=null;try{record.iframe.contentWindow&&record.iframe.contentDocument&&(record.bridgeCleanup=installTopicFrameBridge(record.iframe.contentWindow,record.iframe.contentDocument,tabId))}catch{}}flushCommands(record){let commands=record.commands.splice(0);for(let command of commands)record.iframe.contentWindow?.postMessage({...command,tabId:record.iframe.dataset.tabId},location.origin)}restoreScroll(record){let target=record.restoreScrollY;target<=0||!record.iframe.contentWindow||(record.restoreTimer!==null&&window.clearTimeout(record.restoreTimer),record.restoreDeadline===0&&(record.restoreDeadline=Date.now()+5e3),record.iframe.contentWindow.scrollTo({top:target,behavior:"instant"}),record.restoreScrollY=0,record.restoreDeadline=0,record.restoreTimer=null)}cancelScrollRestore(record){record.restoreTimer!==null&&window.clearTimeout(record.restoreTimer),record.restoreTimer=null,record.restoreDeadline=0}suspendOverflow(activeTabId){for(;this.frames.size>this.liveLimit;){let candidate=[...this.frames.entries()].filter(([tabId2])=>tabId2!==activeTabId).sort(([,a],[,b])=>a.lastUsedAt-b.lastUsedAt)[0];if(!candidate)return;let[tabId,record]=candidate;record.commands=[],record.bridgeCleanup?.(),record.bridgeCleanup=null,this.cancelScrollRestore(record),record.iframe.removeEventListener("load",record.loadListener),record.iframe.remove(),this.frames.delete(tabId),this.onSuspend(tabId,record.iframe)}}suspendForBudget(tabId){let record=this.frames.get(tabId);if(!record){this.budget?.remove(this,tabId);return}record.commands=[],record.bridgeCleanup?.(),record.bridgeCleanup=null,this.cancelScrollRestore(record),record.iframe.removeEventListener("load",record.loadListener),record.iframe.remove(),this.frames.delete(tabId),this.budget?.remove(this,tabId),this.onSuspend(tabId,record.iframe)}};var ListFrameController=class{constructor(container,frameId,onMessage){this.container=container;this.frameId=frameId;this.onMessage=onMessage}iframe=null;reportedUrl="";frameConfig={enabled:!1,clickMode:"double",hidePosters:!0};restoreScrollY=0;restoreTimer=null;restoreDeadline=0;bridgeCleanup=null;mount(url){if(!this.iframe){let iframe=document.createElement("iframe");iframe.className="ldu-list-frame",iframe.name=`ldu-list:${this.frameId}`,iframe.title="\u5E16\u5B50\u5217\u8868\u548C\u7AD9\u5185\u9875\u9762",iframe.dataset.frameId=this.frameId,iframe.addEventListener("load",()=>{this.bridgeCleanup?.(),this.bridgeCleanup=null;try{iframe.contentWindow&&iframe.contentDocument&&(this.bridgeCleanup=installListFrameBridge(iframe.contentWindow,iframe.contentDocument,this.frameId))}catch{}this.sendPreviewConfig(iframe),iframe.dataset.lduReady="true"}),this.iframe=iframe,this.container.append(iframe)}let requested=(this.resolveSameOrigin(url)??new URL("/",location.href)).href;return this.iframe.src!==requested&&this.reportedUrl!==requested&&(this.bridgeCleanup?.(),this.bridgeCleanup=null,delete this.iframe.dataset.lduReady,this.reportedUrl="",this.iframe.src=requested),this.iframe.src||(this.iframe.src=requested),this.iframe}navigate(url){let target=this.resolveSameOrigin(url);if(!target)return;if(!this.iframe){this.mount(target.href);return}let requested=target.href;this.iframe.src===requested||this.reportedUrl===requested||(this.bridgeCleanup?.(),this.bridgeCleanup=null,delete this.iframe.dataset.lduReady,this.reportedUrl="",this.iframe.src=requested)}restoreScroll(scrollY){!this.iframe?.contentWindow||scrollY<=0||(this.restoreScrollY=scrollY,this.restoreDeadline=Date.now()+5e3,this.attemptScrollRestore())}getElement(){return this.iframe}setConfig(config){this.frameConfig={...config},this.iframe&&this.sendPreviewConfig(this.iframe)}handleMessage(event){let data=event.data;if(!data||!["ldu:list-ready","ldu:list-state","ldu:list-interaction","ldu:list-topic-open","ldu:list-navigate","ldu:list-preview-open","ldu:list-preview-dismiss"].includes(data.type??"")||data.frameId!==this.frameId||!this.iframe||event.origin!==location.origin||event.source!==this.iframe.contentWindow)return;if((data.type==="ldu:list-ready"||data.type==="ldu:list-state")&&data.url)try{this.reportedUrl=new URL(data.url,document.baseURI).href}catch{this.reportedUrl=""}this.onMessage(data,this.iframe)&&typeof data.requestId=="string"&&this.iframe.contentWindow?.postMessage({type:"ldu:navigation-ack",frameId:this.frameId,requestId:data.requestId},location.origin)}sendPreviewConfig(iframe){iframe.contentWindow?.postMessage({type:"ldu:preview-config",frameId:this.frameId,...this.frameConfig},location.origin)}resolveSameOrigin(url){try{let resolved=new URL(url,document.baseURI);return resolved.origin===location.origin&&/^https?:$/.test(resolved.protocol)?resolved:null}catch{return null}}attemptScrollRestore(){let iframe=this.iframe,target=this.restoreScrollY;!iframe?.contentWindow||target<=0||(this.restoreTimer!==null&&window.clearTimeout(this.restoreTimer),iframe.contentWindow.scrollTo({top:target,behavior:"instant"}),this.restoreScrollY=0,this.restoreDeadline=0,this.restoreTimer=null)}destroy(){this.restoreTimer!==null&&window.clearTimeout(this.restoreTimer),this.restoreTimer=null,this.restoreScrollY=0,this.restoreDeadline=0,this.bridgeCleanup?.(),this.bridgeCleanup=null,this.iframe?.remove(),this.iframe=null,this.reportedUrl=""}};var TopicTabStore=class{constructor(session,onChange){this.session=session;this.onChange=onChange}getSession(){return this.session}getTabs(){return this.session.tabs.map(tab=>({...tab}))}getPrimaryTabs(){let secondary=new Set(this.session.secondaryTabIds);return this.session.tabs.filter(tab=>!secondary.has(tab.id)).map(tab=>({...tab}))}getSecondaryTabs(){let byId=new Map(this.session.tabs.map(tab=>[tab.id,tab]));return this.session.secondaryTabIds.flatMap(id=>byId.has(id)?[{...byId.get(id)}]:[])}getActive(){return this.session.tabs.find(tab=>tab.id===this.session.activeTabId)??null}getSecondaryActive(){return this.session.tabs.find(tab=>tab.id===this.session.secondaryActiveTabId)??null}setSessionFields(fields,now,notify=!0){this.session={...this.session,...fields,updatedAt:now},notify&&this.emit()}open(input,now){return this.session=upsertTopicTab(this.session,input,now),this.repairPanelOwnership(),this.emit(),this.getActive()}openSecondary(input,now){this.session=upsertTopicTab(this.session,input,now);let tab=this.session.tabs.find(candidate=>candidate.topicId===input.topicId);return this.session.secondaryTabIds.includes(tab.id)||(this.session={...this.session,secondaryTabIds:[...this.session.secondaryTabIds,tab.id],secondaryActiveTabId:tab.id,activeTabId:this.session.activeTabId===tab.id?this.getPrimaryTabs().find(candidate=>candidate.id!==tab.id)?.id??null:this.session.activeTabId}),this.repairPanelOwnership(),this.emit(),{...tab}}activate(tabId,now){return this.getPrimaryTabs().some(tab=>tab.id===tabId)?(this.session={...this.session,activeTabId:tabId,tabs:this.session.tabs.map(tab=>tab.id===tabId?{...tab,lastActiveAt:now,suspended:!1}:tab),updatedAt:now},this.emit(),this.getActive()):null}activateSecondary(tabId,now){return this.session.secondaryTabIds.includes(tabId)?(this.session={...this.session,secondaryActiveTabId:tabId,tabs:this.session.tabs.map(tab=>tab.id===tabId?{...tab,lastActiveAt:now,suspended:!1}:tab),updatedAt:now},this.emit(),this.getSecondaryActive()):null}moveToSecondary(tabId,now,notify=!0){if(!this.session.tabs.some(tab=>tab.id===tabId))return null;if(this.session.secondaryTabIds.includes(tabId))return this.activateSecondary(tabId,now);let primaryTabs=this.getPrimaryTabs(),index=primaryTabs.findIndex(tab=>tab.id===tabId),remaining=primaryTabs.filter(tab=>tab.id!==tabId);return this.session={...this.session,secondaryTabIds:[...this.session.secondaryTabIds,tabId],secondaryActiveTabId:tabId,activeTabId:this.session.activeTabId===tabId?remaining[Math.min(index,remaining.length-1)]?.id??null:this.session.activeTabId,tabs:this.session.tabs.map(tab=>tab.id===tabId?{...tab,lastActiveAt:now,suspended:!1}:tab),updatedAt:now},notify&&this.emit(),this.getSecondaryActive()}mergeSecondaryIntoPrimary(now,notify=!0){if(this.session.secondaryTabIds.length===0)return;let lastSecondary=this.session.secondaryActiveTabId;this.session={...this.session,activeTabId:this.session.activeTabId??lastSecondary,secondaryTabIds:[],secondaryActiveTabId:null,updatedAt:now},notify&&this.emit()}closeOthersInPane(tabId,now){let secondary=this.session.secondaryTabIds.includes(tabId),removeIds=(secondary?this.getSecondaryTabs():this.getPrimaryTabs()).filter(tab=>tab.id!==tabId).map(tab=>tab.id);if(removeIds.length===0)return[];let removeSet=new Set(removeIds);return this.session={...this.session,tabs:this.session.tabs.filter(tab=>!removeSet.has(tab.id)),activeTabId:secondary?this.session.activeTabId:tabId,secondaryTabIds:this.session.secondaryTabIds.filter(id=>!removeSet.has(id)),secondaryActiveTabId:secondary?tabId:this.session.secondaryActiveTabId,updatedAt:now},this.emit(),removeIds}reorderInPane(tabId,targetTabId,position,now){if(tabId===targetTabId)return!1;let secondary=this.session.secondaryTabIds.includes(tabId);if(secondary!==this.session.secondaryTabIds.includes(targetTabId))return!1;let paneIds=(secondary?this.getSecondaryTabs():this.getPrimaryTabs()).map(tab=>tab.id),original=[...paneIds],sourceIndex=paneIds.indexOf(tabId);if(sourceIndex<0||!paneIds.includes(targetTabId))return!1;paneIds.splice(sourceIndex,1);let targetIndex=paneIds.indexOf(targetTabId);if(paneIds.splice(targetIndex+(position==="after"?1:0),0,tabId),paneIds.every((id,index)=>id===original[index]))return!1;let paneSet=new Set(paneIds),byId=new Map(this.session.tabs.map(tab=>[tab.id,tab])),nextPaneIndex=0;return this.session={...this.session,tabs:this.session.tabs.map(tab=>paneSet.has(tab.id)?byId.get(paneIds[nextPaneIndex++]):tab),secondaryTabIds:secondary?paneIds:this.session.secondaryTabIds,updatedAt:now},this.emit(),!0}update(tabId,patch,now,notify=!0){this.session={...this.session,tabs:this.session.tabs.map(tab=>tab.id===tabId?{...tab,...patch,lastActiveAt:now}:tab),updatedAt:now},notify&&this.emit()}suspend(tabId,now){this.update(tabId,{suspended:!0},now)}close(tabId,now){this.session=closeTopicTab(this.session,tabId,now),this.emit()}clear(now){this.session.tabs.length!==0&&(this.session={...this.session,tabs:[],activeTabId:null,secondaryTabIds:[],secondaryActiveTabId:null,updatedAt:now},this.emit())}emit(){this.onChange?.(this.session)}repairPanelOwnership(){let validIds=new Set(this.session.tabs.map(tab=>tab.id)),secondaryTabIds=this.session.secondaryTabIds.filter(id=>validIds.has(id)),secondaryIds=new Set(secondaryTabIds),primaryTabs=this.session.tabs.filter(tab=>!secondaryIds.has(tab.id));this.session={...this.session,secondaryTabIds,activeTabId:this.session.activeTabId&&primaryTabs.some(tab=>tab.id===this.session.activeTabId)?this.session.activeTabId:primaryTabs.at(-1)?.id??null,secondaryActiveTabId:this.session.secondaryActiveTabId&&secondaryTabIds.includes(this.session.secondaryActiveTabId)?this.session.secondaryActiveTabId:secondaryTabIds.at(-1)??null}}};var ICON_CONTENT={settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.95 4.6 1.7 1.7 0 0 0 9.98 3.04V3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>',split:'<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/><path d="M12 9v6m-3-3h6"/>',external:'<path d="M15 4h5v5M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',refresh:'<path d="M20 6v5h-5"/><path d="M19 11a7 7 0 1 0 1 5"/>',copy:'<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',bookmark:'<path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',"bookmark-filled":'<path class="ldu-symbol-fill" d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',"close-others":'<rect x="3" y="5" width="13" height="12" rx="2"/><path d="M8 3h10a3 3 0 0 1 3 3v8"/><path d="m18 16 4 4m0-4-4 4"/>',list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',check:'<path d="m5 12 4 4L19 6"/>',maximize:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',restore:'<path d="M9 9H4V4M15 9h5V4M9 15H4v5M15 15h5v5"/>',trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',github:'<path d="M15 22v-3.9c.04-1-.35-1.76-.8-2.2 2.6-.3 5.3-1.27 5.3-5.75A4.5 4.5 0 0 0 18.3 7c.12-.3.52-1.53-.12-3.18 0 0-.98-.31-3.2 1.2a11.1 11.1 0 0 0-5.83 0c-2.22-1.51-3.2-1.2-3.2-1.2C5.3 5.47 5.7 6.7 5.82 7a4.5 4.5 0 0 0-1.2 3.15c0 4.47 2.72 5.46 5.32 5.75-.34.3-.64.82-.75 1.59-.67.3-2.37.82-3.42-.98 0 0-.62-1.13-1.8-1.21M9 19c-2.25 1-2.5-1-3.5-1.5"/>',gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M7.5 8C6.1 8 5 7 5 5.7S6.1 3.5 7.5 3.5C9.6 3.5 12 8 12 8s2.4-4.5 4.5-4.5C17.9 3.5 19 4.4 19 5.7S17.9 8 16.5 8"/>'};function iconSvg(name,size=20){return`<svg class="ldu-symbol ldu-symbol-${name}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_CONTENT[name]}</svg>`}function setIcon(element,name,size=20){element.innerHTML=iconSvg(name,size)}function createIcon(doc,name,size=18){let icon=doc.createElement("span");return icon.className="ldu-context-icon",icon.innerHTML=iconSvg(name,size),icon}var categoryColorCache=new WeakMap;function getCategoryColors(root){let links=[...root.querySelectorAll('.sidebar-wrapper a[href^="/c/"], .sidebar-wrapper a[href*="linux.do/c/"]')],rootClass=root.documentElement.className,cached=categoryColorCache.get(root);if(cached&&cached.rootClass===rootClass&&cached.linkCount===links.length)return cached.entries;let entries=links.flatMap(link=>{let name=link.textContent?.trim()??"",icon=link.querySelector(".sidebar-section-link-prefix.icon, .sidebar-section-link-prefix, .sidebar-section-link-icon"),color=icon?root.defaultView?.getComputedStyle(icon).color.trim()??"":"";return name&&color&&color!=="transparent"&&color!=="rgba(0, 0, 0, 0)"?[{name,color}]:[]}).sort((a,b)=>b.name.length-a.name.length);return categoryColorCache.set(root,{rootClass,linkCount:links.length,entries}),entries}function resolveTabCategoryColor(title,root=document){let titleWithoutSite=title.replace(/\s+-\s+LINUX DO(?:\s.*)?$/i,"");return getCategoryColors(root).filter(({name})=>name&&(titleWithoutSite.endsWith(` - ${name}`)||titleWithoutSite.includes(` - ${name} / `)||titleWithoutSite.endsWith(` / ${name}`))).sort((a,b)=>b.name.length-a.name.length)[0]?.color??null}function renderTabStrip(root,tabs,activeTabId,callbacks,options={}){root.replaceChildren(),root.classList.toggle("is-category-colors-enabled",options.colorizeTabs!==!1);let draggedTabId=null,dropTarget=null,clearDragState=()=>{root.querySelectorAll(".is-dragging, .is-drop-before, .is-drop-after").forEach(item=>{item.classList.remove("is-dragging","is-drop-before","is-drop-after"),item.setAttribute("aria-grabbed","false")}),draggedTabId=null,dropTarget=null};root.ondragstart=event=>{if(!callbacks.onReorder||!(event.target instanceof Element)||event.target.closest(".ldu-tab-close")){event.preventDefault();return}let item=event.target.closest(".ldu-tab-item[data-tab-id]");item?.dataset.tabId&&(draggedTabId=item.dataset.tabId,item.classList.add("is-dragging"),item.setAttribute("aria-grabbed","true"),event.dataTransfer?.setData("text/plain",draggedTabId),event.dataTransfer&&(event.dataTransfer.effectAllowed="move"))},root.ondragover=event=>{if(!draggedTabId||!(event.target instanceof Element))return;let item=event.target.closest(".ldu-tab-item[data-tab-id]"),targetTabId=item?.dataset.tabId;if(!item||!targetTabId||targetTabId===draggedTabId)return;event.preventDefault(),event.dataTransfer&&(event.dataTransfer.dropEffect="move");let rect=item.getBoundingClientRect(),position=event.clientX<rect.left+rect.width/2?"before":"after";dropTarget?.tabId===targetTabId&&dropTarget.position===position||(root.querySelectorAll(".is-drop-before, .is-drop-after").forEach(target=>{target.classList.remove("is-drop-before","is-drop-after")}),item.classList.add(position==="before"?"is-drop-before":"is-drop-after"),dropTarget={tabId:targetTabId,position})},root.ondrop=event=>{if(!draggedTabId||!dropTarget)return;event.preventDefault();let sourceTabId=draggedTabId,target=dropTarget;clearDragState(),callbacks.onReorder?.(sourceTabId,target.tabId,target.position)},root.ondragend=clearDragState;let focusTab=index=>{let buttons=root.querySelectorAll(".ldu-tab-button");buttons[Math.min(buttons.length-1,Math.max(0,index))]?.focus()},fallbackColors=new Map(tabs.filter(tab=>!tab.categoryColor).map(tab=>[tab.id,resolveTabCategoryColor(tab.title,root.ownerDocument)]));tabs.forEach((tab,index)=>{let item=document.createElement("div");item.className="ldu-tab-item",item.dataset.tabId=tab.id,item.draggable=!!callbacks.onReorder,item.setAttribute("role","presentation"),item.setAttribute("aria-grabbed","false"),item.classList.toggle("is-active",tab.id===activeTabId),item.title=`${tab.title}
${tab.url}`,item.addEventListener("contextmenu",event=>{event.preventDefault(),event.stopPropagation(),callbacks.onContextMenu?.(tab.id,event.clientX,event.clientY)});let categoryColor=tab.categoryColor||fallbackColors.get(tab.id);categoryColor&&item.style.setProperty("--ldu-tab-category-color",categoryColor);let button=document.createElement("button");button.type="button",button.className="ldu-tab-button",button.textContent=tab.title||`\u4E3B\u9898 ${tab.topicId}`,button.id=`ldu-tab-${tab.id}`,button.setAttribute("role","tab"),button.setAttribute("aria-selected",String(tab.id===activeTabId)),button.tabIndex=tab.id===activeTabId?0:-1,button.setAttribute("aria-label",`\u6253\u5F00 ${button.textContent}`),button.addEventListener("click",()=>callbacks.onActivate(tab.id)),button.addEventListener("keydown",event=>{if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();let next=(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;callbacks.onActivate(tabs[next].id),focusTab(next)}else if(event.key==="Home"||event.key==="End"){event.preventDefault();let next=event.key==="Home"?0:tabs.length-1;callbacks.onActivate(tabs[next].id),focusTab(next)}else event.key==="Delete"&&(event.preventDefault(),callbacks.onClose(tab.id))});let close=document.createElement("button");close.type="button",close.className="ldu-tab-close",close.draggable=!1,setIcon(close,"close",16),close.title="\u5173\u95ED\u5E16\u5B50\u6807\u7B7E",close.setAttribute("aria-label",`\u5173\u95ED ${button.textContent}`),close.addEventListener("click",event=>{event.stopPropagation(),callbacks.onClose(tab.id)}),item.append(button,close),root.append(item)})}var NARROW_BREAKPOINT=1100,WIDE_BREAKPOINT=1680;function resolveLayoutMode(preference,viewportWidth){return viewportWidth<NARROW_BREAKPOINT?"native":preference==="two"||preference==="three"?preference:viewportWidth>=WIDE_BREAKPOINT?"three":"two"}var LayoutController=class{constructor(options){this.options=options;this.preference=options.preference,this.paneSizes={...options.paneSizes},this.hidePosters=options.hidePosters}shell=null;panel=null;content=null;secondaryPanel=null;secondaryContent=null;listContent=null;preference;paneSizes;hidePosters;open=!1;secondaryOpen=!1;resizeListener=()=>this.apply();mount(){ensureAppStyles();let wrapper=document.querySelector("#main-outlet-wrapper"),outlet=document.querySelector("#main-outlet");return!wrapper||!outlet?!1:(this.shell?this.shell.parentElement!==document.body&&document.body.append(this.shell):(this.shell=this.createShell(),document.body.append(this.shell),this.panel=this.shell.querySelector("#ldu-topic-panel"),this.content=this.panel?.querySelector(".ldu-topic-content")??null,this.secondaryPanel=this.shell.querySelector("#ldu-secondary-topic-panel"),this.secondaryContent=this.secondaryPanel?.querySelector(".ldu-topic-content")??null,this.listContent=this.shell.querySelector(".ldu-list-content"),window.addEventListener("resize",this.resizeListener,{passive:!0})),document.body.classList.toggle("ldu-hide-posters",this.hidePosters),this.apply(),!0)}destroy(){window.removeEventListener("resize",this.resizeListener),this.shell?.remove(),this.shell=null,this.panel=null,this.content=null,this.secondaryPanel=null,this.secondaryContent=null,this.listContent=null,this.open=!1,this.secondaryOpen=!1,document.body.classList.remove("ldu-layout-active","ldu-layout-two","ldu-layout-three","ldu-hide-posters","ldu-secondary-open"),document.documentElement.classList.remove("ldu-layout-two-root"),document.documentElement.classList.remove("ldu-split-booting")}setOpen(open){this.open=open,this.apply()}setSecondaryOpen(open){this.secondaryOpen=open,this.apply()}setPreference(preference){this.preference=preference,this.apply()}setPaneSizes(paneSizes){this.paneSizes={...paneSizes},this.apply()}getContentElement(){return this.content}getSecondaryContentElement(){return this.secondaryContent}getListContentElement(){return this.listContent}getShellElement(){return this.shell}getTabStripElement(){return this.panel?.querySelector(".ldu-tab-strip")??null}getSecondaryTabStripElement(){return this.secondaryPanel?.querySelector(".ldu-tab-strip")??null}getActionsElement(){return this.panel?.querySelector(".ldu-topic-actions")??null}getSecondaryActionsElement(){return this.secondaryPanel?.querySelector(".ldu-topic-actions")??null}getPanelElement(){return this.panel}getSecondaryPanelElement(){return this.secondaryPanel}setHidePosters(hide){this.hidePosters=hide,document.body.classList.toggle("ldu-hide-posters",hide)}getMode(){return this.open?resolveLayoutMode(this.preference,window.innerWidth):"native"}apply(){if(!this.panel||!this.secondaryPanel||!this.shell)return;let mode=this.getMode(),active=mode!=="native";this.panel.hidden=!active,this.secondaryPanel.hidden=!active||!this.secondaryOpen,this.shell.hidden=!active,document.body.classList.toggle("ldu-layout-active",active),document.body.classList.toggle("ldu-layout-two",mode==="two"),document.body.classList.toggle("ldu-layout-three",mode==="three"),document.documentElement.classList.toggle("ldu-layout-two-root",mode==="two"),document.body.classList.toggle("ldu-secondary-open",active&&this.secondaryOpen),active&&document.documentElement.classList.remove("ldu-split-booting"),document.documentElement.style.setProperty("--ldu-sidebar-width",`${this.paneSizes.sidebar}px`),document.documentElement.style.setProperty("--ldu-topic-track",`${1-this.paneSizes.listRatio}fr`),document.documentElement.style.setProperty("--ldu-topic-split-track",`${(1-this.paneSizes.listRatio)/2}fr`),document.documentElement.style.setProperty("--ldu-list-track",`${this.paneSizes.listRatio}fr`),this.updateSeparatorValues()}createPanel(secondary=!1){let panel=document.createElement("section");return panel.id=secondary?"ldu-secondary-topic-panel":"ldu-topic-panel",panel.className=secondary?"ldu-secondary-topic-panel":"",panel.hidden=!0,panel.setAttribute("aria-label",secondary?"\u7B2C\u4E8C\u5E16\u5B50\u9605\u8BFB\u533A":"\u5E16\u5B50\u9605\u8BFB\u533A"),panel.innerHTML=`
      <div class="ldu-topic-toolbar">
        <div class="ldu-tab-strip" role="tablist" aria-label="${secondary?"\u7B2C\u4E8C\u9605\u8BFB\u533A":"\u4E3B\u9605\u8BFB\u533A"}\u5DF2\u6253\u5F00\u7684\u5E16\u5B50"></div>
        <div class="ldu-topic-actions"></div>
      </div>
      <div class="ldu-topic-content">
        <div class="ldu-topic-empty">\u4ECE\u5217\u8868\u4E2D\u9009\u62E9\u5E16\u5B50</div>
      </div>
      ${secondary?"":'<button class="ldu-resize-handle ldu-resize-before" type="button" aria-label="\u8C03\u6574\u5DE6\u4FA7\u533A\u57DF\u5BBD\u5EA6"></button><button class="ldu-resize-handle ldu-resize-after" type="button" aria-label="\u8C03\u6574\u4E3B\u9898\u5217\u8868\u5BBD\u5EA6"></button>'}
    `,secondary||(this.bindResizeHandle(panel.querySelector(".ldu-resize-before"),"before"),this.bindResizeHandle(panel.querySelector(".ldu-resize-after"),"after")),panel}createShell(){let shell=document.createElement("div");shell.id="ldu-layout-shell",shell.hidden=!0,shell.setAttribute("aria-label","Linux Do \u5206\u5C4F\u5DE5\u4F5C\u533A");let list=document.createElement("div");return list.className="ldu-list-content",list.setAttribute("aria-label","\u975E\u9605\u8BFB\u9875\u533A\u57DF"),shell.append(list,this.createPanel(),this.createPanel(!0)),shell}bindResizeHandle(handle,side){handle instanceof HTMLElement&&(handle.setAttribute("role","separator"),handle.setAttribute("aria-orientation","vertical"),handle.tabIndex=0,handle.addEventListener("keydown",event=>{if(!(event instanceof KeyboardEvent)||!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();let direction=event.key==="ArrowLeft"?-1:event.key==="ArrowRight"?1:0,mode=this.getMode();if(side==="before"&&mode==="three"&&document.body.classList.contains("has-sidebar-page"))this.paneSizes.sidebar=event.key==="Home"?160:event.key==="End"?360:Math.min(360,Math.max(160,this.paneSizes.sidebar+direction*12));else if(side==="after"&&mode==="three"||side==="before"&&mode==="two"){let ratioDirection=mode==="three"?-direction:direction;this.paneSizes.listRatio=event.key==="Home"?.3:event.key==="End"?.7:clampRatio3(this.paneSizes.listRatio+ratioDirection*.02)}else return;this.apply(),this.options.onPaneSizesChange?.({...this.paneSizes})}),handle.addEventListener("pointerdown",event=>{if(!(event instanceof PointerEvent)||event.button!==0)return;let startX=event.clientX,start={...this.paneSizes};handle.setPointerCapture(event.pointerId);let move=moveEvent=>{let delta=moveEvent.clientX-startX,mode=this.getMode(),wrapper=this.panel?.parentElement,sidebarWidth=document.body.classList.contains("has-sidebar-page")?start.sidebar:0,availableWidth=Math.max(1,(wrapper?.clientWidth||window.innerWidth)-sidebarWidth);side==="after"&&mode==="three"?this.paneSizes.listRatio=clampRatio3(start.listRatio-delta/availableWidth):side==="before"&&mode==="two"?this.paneSizes.listRatio=clampRatio3(start.listRatio+delta/availableWidth):side==="before"&&mode==="three"&&document.body.classList.contains("has-sidebar-page")&&(this.paneSizes.sidebar=Math.round(Math.min(360,Math.max(160,start.sidebar+delta)))),this.apply()},finish=()=>{handle.removeEventListener("pointermove",move),handle.removeEventListener("pointerup",finish),handle.removeEventListener("pointercancel",finish),this.options.onPaneSizesChange?.({...this.paneSizes})};handle.addEventListener("pointermove",move),handle.addEventListener("pointerup",finish),handle.addEventListener("pointercancel",finish)}))}updateSeparatorValues(){if(!this.panel)return;let mode=this.getMode(),before=this.panel.querySelector(".ldu-resize-before"),after=this.panel.querySelector(".ldu-resize-after"),set=(handle,value,min,max)=>{handle&&(handle.setAttribute("aria-valuemin",String(min)),handle.setAttribute("aria-valuemax",String(max)),handle.setAttribute("aria-valuenow",String(value)))};mode==="three"&&document.body.classList.contains("has-sidebar-page")?set(before,this.paneSizes.sidebar,160,360):set(before,Math.round(this.paneSizes.listRatio*100),30,70),set(after,Math.round(this.paneSizes.listRatio*100),30,70)}};function clampRatio3(value){return Math.round(Math.min(.7,Math.max(.3,value))*1e3)/1e3}var SettingsPanel=class{constructor(host,settings,callbacks){this.host=host;this.settings=settings;this.callbacks=callbacks}panel=null;toggleButton=null;mount(){if(this.panel)return;let button=document.createElement("button");button.type="button",button.className="ldu-icon-button btn-flat no-text",setIcon(button,"settings",20),button.title="\u5E03\u5C40\u4E0E\u529F\u80FD\u8BBE\u7F6E",button.setAttribute("aria-label","\u5E03\u5C40\u4E0E\u529F\u80FD\u8BBE\u7F6E"),button.setAttribute("aria-controls","ldu-settings-panel"),button.setAttribute("aria-expanded","false"),button.addEventListener("click",()=>{this.panel&&this.setPanelOpen(this.panel.hidden)}),this.toggleButton=button,this.host.append(button);let panel=document.createElement("div");panel.id="ldu-settings-panel",panel.className="ldu-settings-panel",panel.hidden=!0,panel.setAttribute("role","dialog"),panel.setAttribute("aria-label","\u5E03\u5C40\u4E0E\u529F\u80FD\u8BBE\u7F6E"),panel.innerHTML=`
      <div class="dc-modal">
        <header class="dc-header">
          <h2 class="ldu-settings-heading">Ultimate Linux Do \u8BBE\u7F6E</h2>
          <button type="button" class="dc-close-btn ldu-settings-close" title="\u5173\u95ED" aria-label="\u5173\u95ED\u8BBE\u7F6E"></button>
        </header>
        <div class="dc-body">
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-layout-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-layout-heading">\u5E03\u5C40</div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u542F\u7528\u5206\u5C4F\u6A21\u5F0F</span>
                <span class="dc-item-desc">\u63A7\u5236\u5206\u5C4F\u9605\u8BFB\u548C\u9875\u5185\u5E16\u5B50\u6807\u7B7E\u529F\u80FD</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="tabsEnabled"><span class="dc-slider"></span></span>
            </label>
            <div class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u5E16\u5B50\u8BE6\u60C5\u9875\u4F4D\u7F6E</span>
                <span class="dc-item-desc">\u81EA\u52A8\u6A21\u5F0F\u5C06\u7531\u5C4F\u5E55\u53EF\u7528\u6A2A\u5411\u7A7A\u95F4\u51B3\u5B9A</span>
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
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u4E0B\u6B21\u8BBF\u95EE\u65F6\u6062\u590D\u4E0A\u6B21\u6253\u5F00\u7684\u5E16\u5B50</span>
                <span class="dc-item-desc">\u5173\u95ED\u6D4F\u89C8\u5668\u6807\u7B7E\u9875\u540E\u91CD\u65B0\u8FDB\u5165\u65F6\u6062\u590D\u4E0A\u6B21\u9605\u8BFB\u72B6\u6001</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="restoreSession"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u9690\u85CF\u8BDD\u9898\u5217\u8868\u4E2D\u7684\u7528\u6237\u5934\u50CF\u5217</span>
                <span class="dc-item-desc">\u9690\u85CF\u53C2\u4E0E\u8005\u5934\u50CF\u5217\uFF0C\u4E3A\u6807\u9898\u817E\u51FA\u66F4\u591A\u7A7A\u95F4</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="hidePosters"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u6309\u5206\u7C7B\u4E3A\u5E16\u5B50\u6807\u7B7E\u4E0A\u8272</span>
                <span class="dc-item-desc">\u4F7F\u7528\u5E16\u5B50\u6240\u5C5E\u5206\u7C7B\u56FE\u6807\u989C\u8272\u4E3A\u6807\u7B7E\u6DFB\u52A0\u80CC\u666F\u8272</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="colorizeTabs"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u6700\u591A\u4FDD\u7559\u6D3B\u52A8\u9875\u9762</span>
                <span class="dc-item-desc">\u9650\u5236\u540C\u65F6\u4FDD\u7559\u5728\u5185\u5B58\u4E2D\u7684\u5E16\u5B50\u9875\u9762\u6570\u91CF</span>
              </span>
              <span class="dc-range-group ldu-settings-range-control"><input type="range" class="dc-range" data-setting="maxLiveFrames" min="1" max="10" step="1"><output class="dc-range-number" data-output="maxLiveFrames"></output></span>
            </label>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-tools-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-tools-heading">\u5B9E\u7528\u5DE5\u5177</div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u542F\u7528\u94FE\u63A5\u60AC\u6D6E\u9884\u89C8</span>
                <span class="dc-item-desc alert ldu-settings-risk" data-depends-on="previewEnabled" role="note">\u9884\u89C8\u5185\u5BB9\u5C06\u8FD0\u884C\u76EE\u6807\u7F51\u7AD9\u811A\u672C\uFF0C\u5E76\u53EF\u80FD\u4EE5 Linux Do \u540C\u6E90\u6743\u9650\u8BFB\u53D6\u6216\u64CD\u4F5C\u793E\u533A\u9875\u9762\u53CA\u8D26\u53F7\u6570\u636E\u3002\u4EC5\u9884\u89C8\u5B8C\u5168\u4FE1\u4EFB\u7684\u94FE\u63A5\u3002</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="previewEnabled"><span class="dc-slider"></span></span>
            </label>
            <div class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="previewEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">\u9884\u89C8\u89E6\u53D1\u65B9\u5F0F</span>
                <span class="dc-item-desc">\u9009\u62E9\u89E6\u53D1\u60AC\u6D6E\u9884\u89C8\u7A97\u53E3\u7684\u64CD\u4F5C\u65B9\u5F0F</span>
              </span>
              <div class="dc-pills" data-pills-setting="previewClickMode">
                <button type="button" class="dc-pill-btn" data-val="double">\u53CC\u51FB</button>
                <button type="button" class="dc-pill-btn" data-val="single">\u5355\u51FB</button>
              </div>
            </div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">\u5728\u9876\u90E8\u663E\u793A LDC \u6536\u5165</span>
                <span class="dc-item-desc">\u5728\u9876\u90E8\u5BFC\u822A\u6761\u8BED\u8A00\u5207\u6362\u65C1\u663E\u793A\u6536\u5165\u503C\uFF0C\u70B9\u51FB\u53EF\u5237\u65B0</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="creditEnabled"><span class="dc-slider"></span></span>
            </label>
          </section>
        </div>
        <footer class="dc-footer ldu-settings-footer">
          <button type="button" class="dc-btn dc-btn-ghost ldu-settings-reset">\u6062\u590D\u9ED8\u8BA4\u8BBE\u7F6E</button>
          <div class="dc-footer-right ldu-settings-actions">
            <a class="dc-btn ldu-settings-action ldu-settings-github" href="https://github.com/jzcangshu/linuxdo-ultimate" target="_blank" rel="noopener noreferrer"><span class="ldu-settings-action-icon" data-settings-icon="github"></span>Github</a>
            <div class="ldu-donate-wrap">
              <button type="button" class="dc-btn ldu-settings-action ldu-settings-donate" aria-expanded="false" aria-controls="ldu-donate-menu"><span class="ldu-settings-action-icon" data-settings-icon="gift"></span>LDC \u6350\u8D60</button>
              <div class="dc-dropdown-menu ldu-donate-menu" id="ldu-donate-menu" role="menu" aria-label="\u9009\u62E9LDC\u6350\u8D60\u989D\u5EA6" hidden>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=87d0a248e696e18399f2458fcfec6b3c889059feedfbacb500af59382fe5416d" target="_blank" rel="noopener noreferrer">1 LDC</a>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=06325a8a0293c81624c065fd8922f6ed591beac0c95c1ac122463d1b4bf78be8" target="_blank" rel="noopener noreferrer">5 LDC</a>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=783190ffe634374e940ad558140c583942c8e4c13c89bc09782596b07bd63bb3" target="_blank" rel="noopener noreferrer">10 LDC</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    `,this.panel=panel;let panelClose=panel.querySelector(".ldu-settings-close");panelClose&&setIcon(panelClose,"close",18);let githubIcon=panel.querySelector('[data-settings-icon="github"]'),giftIcon=panel.querySelector('[data-settings-icon="gift"]');githubIcon&&setIcon(githubIcon,"github",15),giftIcon&&setIcon(giftIcon,"gift",15),this.host.append(panel),this.sync(),panel.querySelectorAll("[data-setting]").forEach(control=>{control instanceof HTMLInputElement&&control.type==="range"?(control.addEventListener("input",()=>this.updateRangeOutput(control)),control.addEventListener("change",()=>this.readControl(control))):control.addEventListener("change",()=>this.readControl(control))}),panel.querySelectorAll("[data-pills-setting] .dc-pill-btn").forEach(button2=>{button2.addEventListener("click",()=>this.readPill(button2))}),panel.querySelector(".ldu-settings-close")?.addEventListener("click",()=>this.setPanelOpen(!1)),panel.querySelector(".ldu-settings-reset")?.addEventListener("click",()=>{window.confirm("\u786E\u5B9A\u8981\u6062\u590D\u5168\u90E8\u9ED8\u8BA4\u8BBE\u7F6E\u5417\uFF1F")&&(this.settings=structuredClone(DEFAULT_SETTINGS),this.sync(),this.callbacks.onChange({...this.settings}))}),panel.querySelector(".ldu-settings-donate")?.addEventListener("click",()=>{let menu=panel.querySelector(".ldu-donate-menu");this.setDonationMenuOpen(!!menu?.hidden)}),panel.querySelectorAll(".ldu-donate-menu a").forEach(link=>{link.addEventListener("click",()=>this.setDonationMenuOpen(!1))}),document.addEventListener("pointerdown",event=>{!this.panel?.hidden&&!this.host.contains(event.target)&&this.setPanelOpen(!1)},!0),document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;let menu=this.panel?.querySelector(".ldu-donate-menu");menu&&!menu.hidden?this.setDonationMenuOpen(!1):this.panel&&!this.panel.hidden&&(this.setPanelOpen(!1),this.toggleButton?.focus({preventScroll:!0}))},!0)}setSettings(settings){this.settings=settings,this.sync()}sync(){if(!this.panel)return;let tabs=this.panel.querySelector('[data-setting="tabsEnabled"]'),restore=this.panel.querySelector('[data-setting="restoreSession"]'),posters=this.panel.querySelector('[data-setting="hidePosters"]'),colorizeTabs=this.panel.querySelector('[data-setting="colorizeTabs"]'),preview=this.panel.querySelector('[data-setting="previewEnabled"]'),credit=this.panel.querySelector('[data-setting="creditEnabled"]'),live=this.panel.querySelector('[data-setting="maxLiveFrames"]'),output=this.panel.querySelector('[data-output="maxLiveFrames"]');tabs&&(tabs.checked=this.settings.tabsEnabled),restore&&(restore.checked=this.settings.restoreSession),posters&&(posters.checked=this.settings.hidePosters),colorizeTabs&&(colorizeTabs.checked=this.settings.colorizeTabs),preview&&(preview.checked=this.settings.previewEnabled),credit&&(credit.checked=this.settings.creditEnabled),live&&(live.value=String(this.settings.maxLiveFrames)),output&&(output.value=String(this.settings.maxLiveFrames)),this.syncPills("layoutPreference",this.settings.layoutPreference),this.syncPills("previewClickMode",this.settings.previewClickMode),this.syncDependencies()}readControl(control){let key=control.dataset.setting;if(!key||key==="schemaVersion"||key==="paneSizes")return;let value;if(control instanceof HTMLInputElement&&control.type==="checkbox")value=control.checked;else if(control instanceof HTMLInputElement&&control.type==="range")value=Number(control.value);else if(control instanceof HTMLSelectElement)value=control.value;else return;this.settings={...this.settings,[key]:value};let output=this.panel?.querySelector(`[data-output="${key}"]`);output&&(output.value=String(value)),this.syncDependencies(),this.callbacks.onChange({[key]:value})}updateRangeOutput(control){let key=control.dataset.setting,output=key?this.panel?.querySelector(`[data-output="${key}"]`):null;output&&(output.value=control.value)}readPill(button){let key=button.closest("[data-pills-setting]")?.dataset.pillsSetting,value=button.dataset.val;!key||!value||key==="schemaVersion"||key==="paneSizes"||(this.settings={...this.settings,[key]:value},this.syncPills(key,value),this.callbacks.onChange({[key]:value}))}syncPills(key,value){this.panel?.querySelectorAll(`[data-pills-setting="${key}"] .dc-pill-btn`).forEach(button=>{let active=button.dataset.val===value;button.classList.toggle("active",active),button.setAttribute("aria-pressed",String(active))})}syncDependencies(){this.panel&&this.panel.querySelectorAll("[data-depends-on]").forEach(row=>{let key=row.dataset.dependsOn;row.hidden=!key||this.settings[key]!==!0})}setPanelOpen(open){this.panel&&(this.panel.hidden=!open,this.toggleButton?.setAttribute("aria-expanded",String(open)),open||this.setDonationMenuOpen(!1))}setDonationMenuOpen(open){let menu=this.panel?.querySelector(".ldu-donate-menu"),button=this.panel?.querySelector(".ldu-settings-donate");menu&&(menu.hidden=!open),button?.setAttribute("aria-expanded",String(open))}};var GROUPS=[[{action:"onMoveToSplit",key:"split",label:"\u5411\u65B0\u7684\u62C6\u5206\u89C6\u56FE\u4E2D\u6DFB\u52A0\u6807\u7B7E\u9875",icon:"split"},{action:"onOpenBrowserTab",key:"browser-tab",label:"\u5728\u65B0\u7684\u6D4F\u89C8\u5668\u6807\u7B7E\u9875\u4E2D\u6253\u5F00",icon:"external"}],[{action:"onReload",key:"reload",label:"\u91CD\u65B0\u52A0\u8F7D\u5F53\u524D\u5E16\u5B50",icon:"refresh"},{action:"onCopyLink",key:"copy",label:"\u590D\u5236\u94FE\u63A5",icon:"copy"}],[{action:"onBookmark",key:"bookmark",label:"\u6DFB\u52A0\u5230\u4E66\u7B7E",icon:"bookmark"}],[{action:"onCloseOthers",key:"close-others",label:"\u5173\u95ED\u5176\u4ED6\u6807\u7B7E\u9875",icon:"close-others"}]],TabContextMenu=class{constructor(callbacks){this.callbacks=callbacks}root=null;onOutsidePointer=event=>{this.root?.contains(event.target)||this.close()};onKeyDown=event=>{if(event.key==="Escape"){event.preventDefault(),this.close();return}if(!this.root||!["ArrowDown","ArrowUp","Home","End"].includes(event.key))return;let items=[...this.root.querySelectorAll('[role="menuitem"]:not(:disabled)')];if(items.length===0)return;event.preventDefault();let current=items.indexOf(document.activeElement),index=event.key==="Home"?0:event.key==="End"?items.length-1:event.key==="ArrowDown"?(current+1+items.length)%items.length:(current-1+items.length)%items.length;items[index]?.focus()};open(tabId,clientX,clientY,splitDisabled=!1){this.close();let root=document.createElement("div");root.className="ldu-tab-context-menu",root.setAttribute("role","menu"),root.setAttribute("aria-label","\u6807\u7B7E\u9875\u7BA1\u7406\u83DC\u5355");for(let[groupIndex,group]of GROUPS.entries()){if(groupIndex>0){let separator=document.createElement("div");separator.className="ldu-context-separator",separator.setAttribute("role","separator"),root.append(separator)}for(let item of group){let button=document.createElement("button");button.type="button",button.className="ldu-context-item",button.dataset.action=item.key,button.setAttribute("role","menuitem"),item.key==="split"&&splitDisabled&&(button.disabled=!0),button.append(createIcon(document,item.icon));let label=document.createElement("span");if(label.textContent=item.label,button.append(label),item.shortcut){let shortcut=document.createElement("span");shortcut.className="ldu-context-shortcut",shortcut.textContent=item.shortcut,button.append(shortcut)}button.addEventListener("click",()=>{this.close(),this.callbacks[item.action](tabId)}),root.append(button)}}document.body.append(root),this.root=root;let rect=root.getBoundingClientRect(),margin=8;root.style.left=`${Math.max(margin,Math.min(clientX,window.innerWidth-rect.width-margin))}px`,root.style.top=`${Math.max(margin,Math.min(clientY,window.innerHeight-rect.height-margin))}px`,document.addEventListener("pointerdown",this.onOutsidePointer,!0),document.addEventListener("keydown",this.onKeyDown,!0),root.querySelector("button:not(:disabled)")?.focus()}close(){document.removeEventListener("pointerdown",this.onOutsidePointer,!0),document.removeEventListener("keydown",this.onKeyDown,!0),this.root?.remove(),this.root=null}destroy(){this.close()}};function installLinkHoverPreviewer(options){"use strict";options=options||{};let installationDestroyed=!1,listenerDisposers=[],listen=(target,type,listener,listenerOptions)=>{target.addEventListener(type,listener,listenerOptions),listenerDisposers.push(()=>target.removeEventListener(type,listener,listenerOptions))},isPreviewEnabled=()=>!installationDestroyed&&(options.isEnabled?options.isEnabled():!0),syncClickMode=()=>{options.clickMode&&(isSingleClickPreviewEnabled=options.clickMode()==="single")},CLICK_DELAY=300,SINGLE_CLICK_PREVIEW_DELAY=250,PREHEAT_DELAY=250,WINDOW_WIDTH=980,WINDOW_HEIGHT=650,CACHE_EXPIRE_TIME=300*1e3,CACHE_MAX_ENTRIES=15,CACHE_MAX_BYTES=20*1024*1024,MAX_RESPONSE_BYTES=8*1024*1024,PREVIEW_LIVE_FRAMES=3,TOKEN_PLACEHOLDER="__AGY_TOKEN__",BOOKMARK_KEY="agy_bookmarks",PREVIEW_POSITION_KEY="agy_preview_position",PREVIEW_MAXIMIZED_KEY="agy_preview_maximized",WINDOW_MARGIN=8,IS_TOP=window.self===window.top,PREVIEW_FRAME_PREFIX="agy-preview-frame:",IS_PREVIEW_FRAME=window.name.startsWith(PREVIEW_FRAME_PREFIX);function isPreviewRefreshKey(e){return e.key==="F5"||e.code==="F5"||e.keyCode===116}if(IS_PREVIEW_FRAME){installPreviewFrameBridge();return}function installPreviewFrameBridge(){if(window.__agyPreviewBridgeInstalled)return;window.__agyPreviewBridgeInstalled=!0;let getLoadToken=()=>Number(window.name.slice(PREVIEW_FRAME_PREFIX.length)),isEditableTarget=target=>!!(target&&target.closest&&target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], .CodeMirror, .monaco-editor')),contentReadySent=!1,contentCheckScheduled=!1,contentObserver=null;function hasMeaningfulContent(){return document.body?(typeof document.body.innerText=="string"?document.body.innerText:document.body.textContent||"").replace(/\s+/g,"").length>=12?!0:!!document.body.querySelector('img[src], video, canvas, svg, article, main > *, [role="main"] > *'):!1}function checkContentReady(){contentCheckScheduled=!1,!(contentReadySent||!hasMeaningfulContent())&&(contentReadySent=!0,contentObserver&&contentObserver.disconnect(),window.parent.postMessage({agyPreviewContentReady:!0,agyPreviewToken:getLoadToken()},"*"))}function scheduleContentReadyCheck(){contentReadySent||contentCheckScheduled||(contentCheckScheduled=!0,setTimeout(checkContentReady,50))}try{contentObserver=new MutationObserver(scheduleContentReadyCheck),contentObserver.observe(document.documentElement||document,{childList:!0,subtree:!0,characterData:!0})}catch{}document.addEventListener("DOMContentLoaded",scheduleContentReadyCheck,{once:!0}),document.addEventListener("click",function(e){let link=e.target&&e.target.closest?e.target.closest("a"):null;if(!link)return;let rawHref=link.getAttribute("href");if(!rawHref||/^javascript:/i.test(rawHref)||rawHref.startsWith("#"))return;let url="";try{url=link.href}catch{return}/^https?:/i.test(url)&&(e.preventDefault(),e.stopImmediatePropagation(),window.parent.postMessage({agyPreviewNavigate:url,agyPreviewToken:getLoadToken()},"*"))},!0),document.addEventListener("keydown",function(e){if(isPreviewRefreshKey(e)){e.preventDefault(),e.stopImmediatePropagation(),e.repeat||window.parent.postMessage({agyPreviewRefresh:!0,agyPreviewToken:getLoadToken()},"*");return}e.key!=="ArrowLeft"&&e.key!=="ArrowRight"||e.ctrlKey||e.shiftKey||e.altKey||e.metaKey||e.isComposing||isEditableTarget(e.target)||(e.preventDefault(),e.stopImmediatePropagation(),window.parent.postMessage({agyPreviewHistoryDirection:e.key==="ArrowLeft"?-1:1,agyPreviewToken:getLoadToken()},"*"))},!0),window.addEventListener("load",function(){let token=getLoadToken();window.parent.postMessage({agyPreviewTitle:document.title||"",agyPreviewUrl:location.href,agyPreviewToken:token},"*"),scheduleContentReadyCheck()},{once:!0})}let ICON_EXTERNAL=iconSvg("external",18),ICON_BOOKMARK=iconSvg("bookmark",18),ICON_BOOKMARK_FILLED=iconSvg("bookmark-filled",18),ICON_LIST=iconSvg("list",18),ICON_CHECK=iconSvg("check",18),ICON_MAXIMIZE=iconSvg("maximize",18),ICON_RESTORE=iconSvg("restore",18),ICON_REFRESH=iconSvg("refresh",18),ICON_CLOSE=iconSvg("close",18),ICON_TRASH=iconSvg("trash",16),SITE_RULES=[{match:/(^|\.)linux\.do$/i,css:`
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
            align-items: center !important;
            min-width: 0 !important;
            height: 100% !important;
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
            flex: 0 0 auto !important;
            align-self: center !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            vertical-align: middle !important;
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
            `}];function getSiteRule(url){try{let hostname=new URL(url).hostname;return SITE_RULES.find(r=>r.match.test(hostname))||null}catch{return null}}function shouldDirectLoad(url){return isSameOrigin(url)||!!getSiteRule(url)?.directLoad}let clickTimer=null,preheatTimer=null,preheatLink=null,previewContainer=null,currentTargetUrl="",previewTabs=[],activeTabId=null,nextTabId=1,nextLoadToken=1,isSingleClickPreviewEnabled=options.clickMode?options.clickMode()==="single":!1,imageViewer=null,bookmarkPanel=null,bookmarkButtonRefreshToken=0,swallowNextClick=!1,swallowClickResetTimer=null,pointerOpenedGesture=!1,pointerShieldTimer=null,isPreviewMaximized=loadPreviewMaximizedState(),cacheMap=new Map,cacheCleanupTimer=null,cacheCleanupDeadline=0,injectedStyle=null,lastEventTime=0,THROTTLE_LIMIT=50;function loadBookmarks(){try{if(typeof GM_getValue=="function"){let v=GM_getValue(BOOKMARK_KEY,"[]"),list=typeof v=="string"?JSON.parse(v):v;return Array.isArray(list)?list:[]}}catch{}try{let list=JSON.parse(localStorage.getItem(BOOKMARK_KEY)||"[]");return Array.isArray(list)?list:[]}catch{return[]}}function saveBookmarks(list){let s=JSON.stringify(list);try{typeof GM_setValue=="function"?GM_setValue(BOOKMARK_KEY,s):localStorage.setItem(BOOKMARK_KEY,s)}catch{try{localStorage.setItem(BOOKMARK_KEY,s)}catch{}}}function isBookmarked(url){return loadBookmarks().some(b=>b.url===url)}function loadPreviewPosition(){let stored=null;try{typeof GM_getValue=="function"&&(stored=GM_getValue(PREVIEW_POSITION_KEY,null))}catch{}if(stored===null)try{stored=localStorage.getItem(PREVIEW_POSITION_KEY)}catch{}try{let position=typeof stored=="string"?JSON.parse(stored):stored;if(position&&Number.isFinite(position.left)&&Number.isFinite(position.top))return position}catch{}return null}function savePreviewPosition(position){let stored=JSON.stringify(position);try{if(typeof GM_setValue=="function"){GM_setValue(PREVIEW_POSITION_KEY,stored);return}}catch{}try{localStorage.setItem(PREVIEW_POSITION_KEY,stored)}catch{}}function loadPreviewMaximizedState(){let stored=!1;try{if(typeof GM_getValue=="function")return stored=GM_getValue(PREVIEW_MAXIMIZED_KEY,!1),stored===!0||stored===1||stored==="true"}catch{}try{stored=localStorage.getItem(PREVIEW_MAXIMIZED_KEY)}catch{}return stored===!0||stored===1||stored==="true"}function savePreviewMaximizedState(maximized){try{if(typeof GM_setValue=="function"){GM_setValue(PREVIEW_MAXIMIZED_KEY,maximized);return}}catch{}try{localStorage.setItem(PREVIEW_MAXIMIZED_KEY,String(maximized))}catch{}}function formatTime(ts){let d=new Date(ts),p=n=>n<10?"0"+n:""+n;return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`}function armClickSwallow(){swallowNextClick=!0,swallowClickResetTimer&&clearTimeout(swallowClickResetTimer),swallowClickResetTimer=setTimeout(()=>{swallowNextClick=!1,swallowClickResetTimer=null},500)}if(IS_TOP){let style=document.createElement("style");injectedStyle=style,style.textContent=`
        /* LDU ADAPTATION: compact Linux Do page CSS is only injected inside previews. */
        .agy-preview-container {
            position: fixed;
            width: ${WINDOW_WIDTH}px;
            height: ${WINDOW_HEIGHT}px;
            max-width: calc(100vw - ${WINDOW_MARGIN*2}px);
            max-height: calc(100vh - ${WINDOW_MARGIN*2}px);
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
        .agy-error-state {
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
        .agy-error-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            max-width: 80%;
            transform: translateY(clamp(70px, 10vh, 110px));
            box-sizing: border-box;
        }
        @media (prefers-color-scheme: dark) {
            .agy-error-state {
                background: rgba(15, 15, 17, 0.68);
            }
        }
        .agy-error-text {
            font-size: 13px;
            line-height: 1.5;
            color: #4b5563;
            font-family: system-ui, -apple-system, sans-serif;
            text-align: center;
        }
        @media (prefers-color-scheme: dark) {
            .agy-error-text {
                color: #aaa;
            }
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
        /* LDU ADAPTATION: one calm, spacious operation-button language. */
        .agy-preview-actions {
            gap: 3px;
        }
        .agy-preview-actions > :is(.agy-preview-btn, .agy-maximize-btn, .agy-close-btn) {
            display: inline-flex;
            width: 28px;
            height: 28px;
            flex: 0 0 28px;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: 0;
            border: 0;
            border-radius: 6px;
            background: transparent;
            color: #62666d;
            cursor: pointer;
            transition: background-color 120ms ease, color 120ms ease, transform 120ms cubic-bezier(.23, 1, .32, 1);
        }
        .agy-preview-actions > :is(.agy-preview-btn, .agy-maximize-btn, .agy-close-btn):active,
        :is(.agy-preview-tab-close, .agy-bm-item-del, .agy-viewer-close):active {
            transform: scale(.96);
        }
        .agy-preview-actions > :is(.agy-preview-btn, .agy-maximize-btn, .agy-close-btn):focus-visible,
        :is(.agy-preview-tab-close, .agy-bm-item-del, .agy-viewer-close):focus-visible {
            outline: 2px solid rgba(0, 122, 255, .48);
            outline-offset: 1px;
        }
        .agy-preview-tab-close,
        .agy-bm-item-del {
            width: 20px;
            height: 20px;
            flex: 0 0 20px;
            padding: 0;
            border-radius: 5px;
            line-height: 1;
            transition: background-color 120ms ease, color 120ms ease, transform 120ms cubic-bezier(.23, 1, .32, 1);
        }
        .agy-viewer-close {
            width: 36px;
            height: 36px;
            padding: 0;
            border-radius: 8px;
            transition: background-color 120ms ease, transform 120ms cubic-bezier(.23, 1, .32, 1);
        }
        @media (hover: hover) and (pointer: fine) {
            .agy-preview-actions > :is(.agy-preview-btn, .agy-maximize-btn):hover {
                background: rgba(0, 122, 255, .1);
                color: #007aff;
            }
            .agy-preview-actions > .agy-close-btn:hover,
            :is(.agy-preview-tab-close, .agy-bm-item-del, .agy-viewer-close):hover {
                background: #e5484d;
                color: #fff;
            }
        }
        @media (prefers-color-scheme: dark) {
            .agy-preview-actions > :is(.agy-preview-btn, .agy-maximize-btn, .agy-close-btn) {
                background: transparent;
                color: #b7bbc2;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            .agy-preview-actions > :is(.agy-preview-btn, .agy-maximize-btn, .agy-close-btn),
            .agy-preview-tab-close,
            .agy-bm-item-del,
            .agy-viewer-close {
                transition-duration: 0ms;
            }
        }
        `;let styleParent=document.head||document.documentElement;styleParent?styleParent.appendChild(style):listen(document,"readystatechange",function appendStyle(){let parent=document.head||document.documentElement;parent&&(document.removeEventListener("readystatechange",appendStyle),parent.appendChild(style))})}IS_TOP&&(listen(window,"pointerdown",function(e){if(e.target.closest&&e.target.closest(".agy-linux-topic-action"))return;let closeButton=e.target.closest&&e.target.closest(".agy-close-btn");if(closeButton&&previewContainer&&previewContainer.contains(closeButton)){e.preventDefault(),e.stopImmediatePropagation(),destroyPreview(),armClickSwallow();return}let tabCloseButton=e.target.closest&&e.target.closest(".agy-preview-tab-close");if(tabCloseButton&&previewContainer&&previewContainer.contains(tabCloseButton)){e.preventDefault(),e.stopImmediatePropagation();let tabElement2=tabCloseButton.closest(".agy-preview-tab"),tabId=tabElement2&&Number(tabElement2.dataset.tabId);Number.isFinite(tabId)&&closePreviewTab(tabId),armClickSwallow();return}let tabElement=e.target.closest&&e.target.closest(".agy-preview-tab");if(e.button===0&&tabElement&&previewContainer&&previewContainer.contains(tabElement)){let tabId=Number(tabElement.dataset.tabId);Number.isFinite(tabId)&&activatePreviewTab(tabId)}if(imageViewer){(e.target===imageViewer||e.target.closest&&e.target.closest(".agy-viewer-close"))&&(closeImageViewer(),armClickSwallow());return}if(!(bookmarkPanel&&bookmarkPanel.contains(e.target))&&previewContainer&&!previewContainer.contains(e.target)){let outsideLink=e.target.closest&&e.target.closest("a");if(isPreviewableLink2(outsideLink))return;destroyPreview(),armClickSwallow()}},!0),listen(window,"pointerdown",function(e){if(!isPreviewEnabled()||e.detail!==2||e.button!==0||e.ctrlKey||e.shiftKey||e.altKey||e.metaKey||(clickTimer&&(clearTimeout(clickTimer),clickTimer=null),isSingleClickPreviewEnabled)||imageViewer)return;let link=e.target.closest&&e.target.closest("a");isPreviewableLink2(link)&&(pointerOpenedGesture=!0,openLinkInPreview(link))},!0),listen(document,"click",function(e){swallowNextClick&&(swallowNextClick=!1,swallowClickResetTimer&&(clearTimeout(swallowClickResetTimer),swallowClickResetTimer=null),e.preventDefault(),e.stopImmediatePropagation())},!0),listen(window,"resize",function(){if(!previewContainer)return;if(isPreviewMaximized){applyPreviewMaximizedState(),closeBookmarkPanel();return}let rect=previewContainer.getBoundingClientRect(),position=clampPreviewPosition(rect.left,rect.top,previewContainer);applyPreviewPosition(previewContainer,position),savePreviewPosition(position),closeBookmarkPanel()}),listen(window,"message",function(e){let data=e.data;if(!data||!Number.isFinite(data.agyPreviewToken))return;let tab=previewTabs.find(item=>item.iframe&&e.source===item.iframe.contentWindow&&item.loadToken===data.agyPreviewToken);tab&&(typeof data.agyPreviewTitle=="string"&&data.agyPreviewTitle.trim()&&updatePreviewTabTitle(tab,data.agyPreviewTitle),data.agyPreviewContentReady===!0&&revealLoadedPreviewTab(tab,tab.loadToken,tab.url),(data.agyPreviewHistoryDirection===-1||data.agyPreviewHistoryDirection===1)&&tab.id===activeTabId&&movePreviewHistory(tab,data.agyPreviewHistoryDirection),data.agyPreviewRefresh===!0&&tab.id===activeTabId&&refreshPreviewTab(tab),typeof data.agyPreviewNavigate=="string"&&/^https?:/i.test(data.agyPreviewNavigate)&&navigatePreview(data.agyPreviewNavigate,tab.id))})),listen(document,"click",handleLinkClick,!0),listen(document,"dblclick",handleLinkDblClick,!0),IS_TOP&&listen(document,"mouseover",handleMouseOverPreheat,!0),IS_TOP&&listen(document,"keydown",function(e){if(previewContainer&&isPreviewRefreshKey(e)){e.preventDefault(),e.stopImmediatePropagation(),e.repeat||refreshPreviewTab(getActiveTab());return}if(e.key==="Escape"||e.keyCode===27){imageViewer?closeImageViewer():bookmarkPanel?closeBookmarkPanel():previewContainer&&destroyPreview();return}if(!previewContainer||e.key!=="ArrowLeft"&&e.key!=="ArrowRight"||e.ctrlKey||e.shiftKey||e.altKey||e.metaKey||e.isComposing||isEditableKeyboardTarget(e.target))return;let tab=getActiveTab();tab&&(e.preventDefault(),e.stopImmediatePropagation(),movePreviewHistory(tab,e.key==="ArrowLeft"?-1:1))},!0);function isEditableKeyboardTarget(target){return!!(target&&target.closest&&target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], .CodeMirror, .monaco-editor'))}function isPreviewableLink2(link){if(!isPreviewEnabled()||!link||link.closest(".agy-preview-container"))return!1;let href=link.getAttribute("href");return!href||href.startsWith("javascript:")||href.startsWith("#")||href===""||!/^https?:/i.test(link.href)?!1:options.isPreviewableUrl?options.isPreviewableUrl(link.href,link):!0}function isImageUrl(url){try{return/\.(png|jpe?g|gif|webp|avif|bmp|ico|svg)$/i.test(new URL(url).pathname)}catch{return!1}}function isImageResponse(response){return/content-type:\s*image\//i.test(response.responseHeaders||"")}function isRenderableResponse(response){let match=/content-type:\s*([^;\r\n]+)/i.exec(response.responseHeaders||"");if(!match)return!0;let type=match[1].trim().toLowerCase();return type==="text/html"||type==="application/xhtml+xml"||type.startsWith("text/")}function getFinalUrl(response,fallback){return response&&/^https?:/i.test(response.finalUrl||"")?response.finalUrl:fallback}function responseTooLarge(progress){return Math.max(Number(progress?.loaded||0),Number(progress?.total||0))>MAX_RESPONSE_BYTES}function showImageViewer(url){closeImageViewer(),imageViewer=document.createElement("div"),imageViewer.className="agy-image-viewer";let img=document.createElement("img");img.src=url,img.alt="";let closeBtn=document.createElement("button");closeBtn.className="agy-viewer-close",closeBtn.innerHTML=ICON_CLOSE,closeBtn.title="\u5173\u95ED\u56FE\u7247 (Esc)";let tip=document.createElement("div");tip.className="agy-viewer-tip",tip.textContent="\u70B9\u51FB\u7A7A\u767D\u5904\u6216\u6309 Esc \u5173\u95ED",imageViewer.appendChild(img),imageViewer.appendChild(closeBtn),imageViewer.appendChild(tip),document.body.appendChild(imageViewer)}function closeImageViewer(){if(!imageViewer)return;let v=imageViewer;imageViewer=null,v.style.setProperty("visibility","hidden","important"),v.style.setProperty("display","none","important"),v.style.setProperty("pointer-events","none","important"),v.style.setProperty("transition","none","important"),scheduleHeavyCleanup(()=>{let img=v.querySelector("img");img&&img.removeAttribute("src"),v.parentNode&&v.parentNode.removeChild(v)})}function getPreviewTitle(){let tab=getActiveTab();try{let t=tab&&tab.iframe&&tab.iframe.contentDocument&&tab.iframe.contentDocument.title;if(t&&t.trim())return t.trim()}catch{}try{let u=new URL(currentTargetUrl);return u.hostname+u.pathname}catch{return currentTargetUrl}}function toggleBookmarkEntry(url,title,btn){if(!url)return;let list=loadBookmarks(),idx=list.findIndex(b=>b.url===url);idx>=0?(list.splice(idx,1),saveBookmarks(list)):(list.unshift({url,title:title||url,time:Date.now()}),saveBookmarks(list),btn&&(btn.innerHTML=ICON_CHECK,btn.style.color="#34c759",setTimeout(()=>{btn.style.color="",updateBookmarkButtonState()},700))),updateBookmarkButtonState(),bookmarkPanel&&renderBookmarkList()}function toggleBookmark(btn){currentTargetUrl&&toggleBookmarkEntry(currentTargetUrl,getPreviewTitle(),btn)}function updateBookmarkButtonState(){if(!previewContainer)return;let btn=previewContainer.querySelector(".agy-bm-add-btn");btn&&(isBookmarked(currentTargetUrl)?(btn.innerHTML=ICON_BOOKMARK_FILLED,btn.classList.add("agy-bm-active"),btn.title="\u53D6\u6D88\u6536\u85CF"):(btn.innerHTML=ICON_BOOKMARK,btn.classList.remove("agy-bm-active"),btn.title="\u6536\u85CF\u5F53\u524D\u9875\u9762"))}function scheduleBookmarkButtonStateUpdate(tabId){let refreshToken=++bookmarkButtonRefreshToken;cleanupAfterNextPaint(()=>{refreshToken!==bookmarkButtonRefreshToken||activeTabId!==tabId||updateBookmarkButtonState()})}function renderBookmarkList(){if(!bookmarkPanel)return;let listEl=bookmarkPanel.querySelector(".agy-bm-list"),countEl=bookmarkPanel.querySelector(".agy-bm-count"),searchEl=bookmarkPanel.querySelector(".agy-bm-search");if(!listEl)return;let list=loadBookmarks(),keyword=searchEl?searchEl.value.trim().toLocaleLowerCase():"",filteredList=keyword?list.filter(bookmark=>{let title=(bookmark.title||"").toLocaleLowerCase(),url=(bookmark.url||"").toLocaleLowerCase();return title.includes(keyword)||url.includes(keyword)}):list;if(countEl&&(countEl.textContent=keyword?`\u4E66\u7B7E (${filteredList.length}/${list.length})`:`\u4E66\u7B7E (${list.length})`),listEl.textContent="",!filteredList.length){let empty=document.createElement("div");empty.className="agy-bm-empty",empty.textContent=list.length?"\u6CA1\u6709\u5339\u914D\u7684\u4E66\u7B7E":"\u6682\u65E0\u4E66\u7B7E",listEl.appendChild(empty);return}filteredList.forEach(b=>{let item=document.createElement("div");item.className="agy-bm-item",item.title=`\u6536\u85CF\u4E8E ${formatTime(b.time)}
${b.url}`;let titleSpan=document.createElement("span");titleSpan.className="agy-bm-item-title",titleSpan.textContent=b.title||b.url;let delBtn=document.createElement("button");delBtn.className="agy-bm-item-del",delBtn.innerHTML=ICON_TRASH,delBtn.title="\u5220\u9664\u6B64\u4E66\u7B7E",delBtn.addEventListener("click",e=>{e.stopPropagation();let latest=loadBookmarks().filter(x=>x.url!==b.url);saveBookmarks(latest),renderBookmarkList(),updateBookmarkButtonState()}),item.appendChild(titleSpan),item.appendChild(delBtn),item.addEventListener("click",()=>{navigatePreview(b.url,activeTabId,{keepBookmarkPanel:!0})}),listEl.appendChild(item)})}function toggleBookmarkPanel(){if(bookmarkPanel){closeBookmarkPanel();return}if(!previewContainer)return;bookmarkPanel=document.createElement("div"),bookmarkPanel.className="agy-bookmark-panel";let header=document.createElement("div");header.className="agy-bm-header";let count=document.createElement("span");count.className="agy-bm-count";let search=document.createElement("input");search.className="agy-bm-search",search.type="search",search.placeholder="\u641C\u7D22\u6807\u9898\u6216\u7F51\u5740",search.setAttribute("aria-label","\u641C\u7D22\u4E66\u7B7E\u6807\u9898\u6216\u7F51\u5740"),search.addEventListener("input",renderBookmarkList),search.addEventListener("click",e=>e.stopPropagation()),header.appendChild(count),header.appendChild(search);let listEl=document.createElement("div");listEl.className="agy-bm-list",bookmarkPanel.appendChild(header),bookmarkPanel.appendChild(listEl),document.body.appendChild(bookmarkPanel);let rect=previewContainer.getBoundingClientRect(),left=rect.left-250-8;left<8&&(left=rect.right+8),left+250>window.innerWidth-8&&(left=Math.max(8,window.innerWidth-258)),bookmarkPanel.style.left=`${left}px`,bookmarkPanel.style.top=`${rect.top}px`,bookmarkPanel.style.maxHeight=`${rect.height}px`,renderBookmarkList()}function closeBookmarkPanel(){if(!bookmarkPanel)return;let p=bookmarkPanel;bookmarkPanel=null,p.parentNode&&p.parentNode.removeChild(p)}function clearCacheCleanupTimer(){cacheCleanupTimer&&clearTimeout(cacheCleanupTimer),cacheCleanupTimer=null,cacheCleanupDeadline=0}function scheduleCacheCleanup(){if(installationDestroyed)return;let deadline=1/0;for(let entry of cacheMap.values())entry.status!=="loading"&&(deadline=Math.min(deadline,entry.time+CACHE_EXPIRE_TIME));if(!Number.isFinite(deadline)){clearCacheCleanupTimer();return}cacheCleanupTimer&&cacheCleanupDeadline===deadline||(clearCacheCleanupTimer(),cacheCleanupDeadline=deadline,cacheCleanupTimer=setTimeout(()=>{cacheCleanupTimer=null,cacheCleanupDeadline=0;let now=Date.now();for(let[url,entry]of cacheMap)entry.status!=="loading"&&now-entry.time>=CACHE_EXPIRE_TIME&&cacheMap.delete(url);scheduleCacheCleanup()},Math.max(0,deadline-Date.now())))}function deleteCacheEntry(url){let deleted=cacheMap.delete(url);return deleted&&scheduleCacheCleanup(),deleted}function setCache(url,entry){entry.size=((entry.html?entry.html.length:0)+(entry.rawHtml?entry.rawHtml.length:0))*2;let now=Date.now();for(let[k,v]of cacheMap)v.status!=="loading"&&now-v.time>=CACHE_EXPIRE_TIME&&cacheMap.delete(k);cacheMap.has(url)&&cacheMap.delete(url),cacheMap.set(url,entry),enforceCacheLimits(),scheduleCacheCleanup()}function enforceCacheLimits(){let totalBytes=0;for(let v of cacheMap.values())totalBytes+=v.size||0;for(;cacheMap.size>CACHE_MAX_ENTRIES||totalBytes>CACHE_MAX_BYTES;){let oldestKey=cacheMap.keys().next().value;if(!oldestKey)break;let old=cacheMap.get(oldestKey);if(totalBytes-=old&&old.size||0,old&&old.xhr)try{old.xhr.abort()}catch{}cacheMap.delete(oldestKey)}}function ensurePreparedCacheEntry(url,entry){return!entry||entry.status!=="done"?null:(!entry.html&&typeof entry.rawHtml=="string"&&(entry.html=prepareDynamicHtml(entry.rawHtml,entry.finalUrl||url,TOKEN_PLACEHOLDER),entry.rawHtml=null,entry.size=entry.html.length*2,enforceCacheLimits()),entry.html)}function schedulePreparation(url,entry){let run=()=>{cacheMap.get(url)===entry&&ensurePreparedCacheEntry(url,entry)};typeof requestIdleCallback=="function"?requestIdleCallback(run,{timeout:2e3}):setTimeout(run,150)}function handleMouseOverPreheat(e){if(!isPreviewEnabled())return;let link=e.target.closest("a");if(!isPreviewableLink2(link)||link.hasAttribute("download")||isLikelyBinaryUrl(link.href)||preheatLink===link)return;let now=Date.now();now-lastEventTime<THROTTLE_LIMIT||(lastEventTime=now,preheatLink&&cancelPreheat(preheatLink.href),preheatLink=link,link.addEventListener("mouseleave",handleMouseLeavePreheat,{once:!0}),preheatTimer=setTimeout(()=>{prefetchUrl(link.href)},PREHEAT_DELAY))}function handleMouseLeavePreheat(){preheatTimer&&(clearTimeout(preheatTimer),preheatTimer=null),preheatLink&&(cancelPreheat(preheatLink.href),preheatLink=null)}function prefetchUrl(url){let cached=cacheMap.get(url);if(cached&&cached.status==="loading"||cached&&Date.now()-cached.time<CACHE_EXPIRE_TIME||shouldDirectLoad(url)||isImageUrl(url)||isLikelyBinaryUrl(url))return;let xhr=GM_xmlhttpRequest({method:"GET",url,timeout:1e4,onprogress:function(progress){if(responseTooLarge(progress)){try{xhr.abort()}catch{}cacheMap.get(url)?.xhr===xhr&&deleteCacheEntry(url)}},onload:function(response){if(response.status>=200&&response.status<400){let entry=cacheMap.get(url);if(!entry||entry.xhr!==xhr)return;if(typeof response.responseText=="string"&&response.responseText.length*2>MAX_RESPONSE_BYTES){deleteCacheEntry(url);return}if(isImageResponse(response))entry.status="image",entry.html="",entry.rawHtml=null,entry.size=0;else if(isRenderableResponse(response))entry.status="done",entry.rawHtml=response.responseText,entry.html=null,entry.size=response.responseText.length*2,entry.finalUrl=getFinalUrl(response,url);else{deleteCacheEntry(url);return}entry.xhr=null,entry.time=Date.now(),enforceCacheLimits(),previewTabs.filter(tab=>isTabLoadCurrent(tab,tab.loadToken,url)&&tab.loadState==="waiting-cache").forEach(tab=>{if(entry.status==="image")tab.loadState="image",hideLoadingBar(tab.loadingBar,tab),tab.id===activeTabId&&showImageViewer(url);else{let preparedHtml=ensurePreparedCacheEntry(url,entry);preparedHtml&&renderFetchedDynamicPage(tab,preparedHtml,url,tab.loadingBar,tab.loadToken)}}),entry.status==="done"&&!entry.html&&schedulePreparation(url,entry),scheduleCacheCleanup()}},onerror:function(){let entry=cacheMap.get(url);!entry||entry.xhr!==xhr||(previewTabs.filter(tab=>isTabLoadCurrent(tab,tab.loadToken,url)&&tab.loadState==="waiting-cache").forEach(tab=>showError(tab,"\u9884\u52A0\u8F7D\u7F51\u7EDC\u8BF7\u6C42\u51FA\u9519")),deleteCacheEntry(url))}});setCache(url,{status:"loading",html:"",xhr,time:Date.now()})}function cancelPreheat(url){let cached=cacheMap.get(url),isNeededByPreview=previewTabs.some(tab=>tab.url===url&&(tab.loadState==="loading"||tab.loadState==="waiting-cache"));cached&&cached.status==="loading"&&!isNeededByPreview&&(cached.xhr&&cached.xhr.abort(),deleteCacheEntry(url))}function frameNavigate(url){window.location.href=url}function openLinkNormally(link){let target=link.getAttribute("target");previewContainer&&destroyPreview(),IS_TOP&&target==="_blank"?window.open(link.href,"_blank"):frameNavigate(link.href)}function openLinkInPreview(link){if(!IS_TOP){frameNavigate(link.href);return}if(isImageUrl(link.href)){showImageViewer(link.href);return}if(previewContainer){addPreviewTab(link.href);return}currentTargetUrl=link.href,showPreviewWindow(link,link.href)}function runLinkAction(link,shouldPreview){!link||!link.isConnected||(shouldPreview?openLinkInPreview(link):openLinkNormally(link))}function shieldPreviewFromDoubleClick(link){if(!previewContainer||!link||!link.isConnected)return;let linkRect=link.getBoundingClientRect(),winRect=previewContainer.getBoundingClientRect();if(!!(linkRect.right<winRect.left||linkRect.left>winRect.right||linkRect.bottom<winRect.top||linkRect.top>winRect.bottom))return;let container=previewContainer;container.style.pointerEvents="none",pointerShieldTimer&&clearTimeout(pointerShieldTimer),pointerShieldTimer=setTimeout(()=>{pointerShieldTimer=null,container===previewContainer&&(container.style.pointerEvents="")},500)}function handleLinkClick(e){if(!isPreviewEnabled()||(syncClickMode(),e.button!==0||e.ctrlKey||e.shiftKey||e.altKey||e.metaKey))return;let link=e.target.closest("a");if(!isPreviewableLink2(link)||link.closest(".agy-preview-container"))return;let href=link.getAttribute("href");if(!(!href||href.startsWith("javascript:")||href.startsWith("#")||href==="")){if(e.preventDefault(),e.stopPropagation(),e.detail<2){clickTimer&&clearTimeout(clickTimer);let shouldPreview=isSingleClickPreviewEnabled;clickTimer=setTimeout(()=>{clickTimer=null,runLinkAction(link,shouldPreview),shouldPreview&&shieldPreviewFromDoubleClick(link)},shouldPreview&&IS_TOP?SINGLE_CLICK_PREVIEW_DELAY:CLICK_DELAY)}else if(e.detail>=2&&(clickTimer&&(clearTimeout(clickTimer),clickTimer=null),e.detail===2)){if(pointerOpenedGesture){pointerOpenedGesture=!1;return}runLinkAction(link,!isSingleClickPreviewEnabled)}}}function handleLinkDblClick(e){if(!isPreviewEnabled()||(pointerOpenedGesture=!1,e.button!==0||e.ctrlKey||e.shiftKey||e.altKey||e.metaKey))return;let link=e.target.closest("a");!link||link.closest(".agy-preview-container")||(e.preventDefault(),e.stopPropagation())}function cleanupAfterNextPaint(cleanup){if(document.visibilityState!=="visible"){setTimeout(cleanup,0);return}requestAnimationFrame(()=>{requestAnimationFrame(cleanup)})}function scheduleHeavyCleanup(cleanup){cleanupAfterNextPaint(()=>{typeof requestIdleCallback=="function"?requestIdleCallback(cleanup,{timeout:250}):setTimeout(cleanup,0)})}function destroyPreview(){if(!previewContainer)return;let containerToRemove=previewContainer,tabsToDispose=previewTabs.slice(),cachedLoadsToAbort=new Map;tabsToDispose.forEach(tab=>{tab.closed=!0,tab.loadToken=nextLoadToken++;let cached=cacheMap.get(tab.url);cached&&cached.status==="loading"&&cachedLoadsToAbort.set(tab.url,cached)}),containerToRemove.style.setProperty("visibility","hidden","important"),containerToRemove.style.setProperty("display","none","important"),containerToRemove.style.setProperty("opacity","0","important"),containerToRemove.style.setProperty("pointer-events","none","important"),containerToRemove.style.setProperty("transition","none","important"),previewContainer=null,currentTargetUrl="",previewTabs=[],activeTabId=null,closeBookmarkPanel(),cleanupAfterNextPaint(()=>{tabsToDispose.forEach(tab=>releasePreviewTabResources(tab)),cachedLoadsToAbort.forEach((cached,url)=>{if(!previewTabs.some(tab=>tab.url===url&&(tab.loadState==="loading"||tab.loadState==="waiting-cache"))){if(cached.xhr)try{cached.xhr.abort()}catch{}cacheMap.get(url)===cached&&deleteCacheEntry(url)}}),containerToRemove.parentNode&&containerToRemove.parentNode.removeChild(containerToRemove)})}function clearContentReadyTimer(tab){!tab||!tab.contentReadyTimer||(clearTimeout(tab.contentReadyTimer),tab.contentReadyTimer=null)}function showLoadingBar(tab){return tab?.pane&&tab.pane.setAttribute("aria-busy","false"),tab&&(tab.loadingBar=null),null}function createErrorBar(tab,message){if(!tab?.pane)return null;let bar=document.createElement("div");bar.className="agy-error-state",bar.setAttribute("role","status"),bar.setAttribute("aria-live","polite"),bar.innerHTML=`
            <div class="agy-error-card">
                <div class="agy-error-text"></div>
            </div>
        `;let textNode=bar.querySelector(".agy-error-text");return textNode&&(textNode.textContent=`\u52A0\u8F7D\u51FA\u9519: ${message}`,textNode.style.color="#ff3b30"),tab.pane.appendChild(bar),tab.loadingBar=bar,bar}function hideLoadingBar(bar,tab){clearContentReadyTimer(tab),tab&&tab.pane&&tab.pane.setAttribute("aria-busy","false");let b=bar||tab&&tab.loadingBar;b&&(tab&&tab.loadingBar===b&&(tab.loadingBar=null),b.style.opacity="0",setTimeout(()=>{b.parentNode&&b.parentNode.removeChild(b)},130))}function getFallbackTabTitle(url){try{let parsed=new URL(url),path=parsed.pathname==="/"?"":parsed.pathname;return`${parsed.hostname}${path}`}catch{return url}}function getActiveTab(){return previewTabs.find(tab=>tab.id===activeTabId)||null}function getPreviewTab(tabId){return previewTabs.find(tab=>tab.id===tabId)||null}function createPreviewTab(url){return{id:nextTabId++,url,title:getFallbackTabTitle(url),pane:null,iframe:null,request:null,loadingBar:null,contentReadyTimer:null,loadToken:nextLoadToken++,loadState:"idle",historyEntries:[url],historyIndex:0,element:null,titleElement:null,closed:!1,lastUsedAt:Date.now()}}function mountPreviewTab(tab){if(!previewContainer||!tab||tab.pane)return;let body=previewContainer.querySelector(".agy-preview-body");if(!body)return;let pane=document.createElement("div");pane.className="agy-preview-pane",pane.dataset.tabId=String(tab.id),pane.setAttribute("role","tabpanel");let iframe=document.createElement("iframe");iframe.className="agy-preview-iframe",iframe.name=`${PREVIEW_FRAME_PREFIX}${tab.loadToken}`,pane.appendChild(iframe),body.appendChild(pane),tab.pane=pane,tab.iframe=iframe}function mountPreviewTabElement(tab){if(!previewContainer||!tab||tab.element)return;let tabsElement=previewContainer.querySelector(".agy-preview-tabs");if(!tabsElement)return;let tabElement=document.createElement("div");tabElement.className="agy-preview-tab",tabElement.dataset.tabId=String(tab.id),tabElement.setAttribute("role","tab");let title=document.createElement("span");title.className="agy-preview-tab-title";let close=document.createElement("button");close.type="button",close.className="agy-preview-tab-close",close.innerHTML=ICON_CLOSE,close.title="\u5173\u95ED\u6B64\u6807\u7B7E\u9875",close.setAttribute("aria-label","\u5173\u95ED\u6B64\u6807\u7B7E\u9875"),close.addEventListener("click",e=>{e.stopPropagation(),closePreviewTab(tab.id)}),tabElement.appendChild(title),tabElement.appendChild(close),tabElement.addEventListener("click",()=>activatePreviewTab(tab.id)),tabsElement.appendChild(tabElement),tab.element=tabElement,tab.titleElement=title,updatePreviewTabElement(tab)}function updatePreviewTabElement(tab){!tab||!tab.element||(tab.element.title=`${tab.title}
${tab.url}`,tab.titleElement&&tab.titleElement.textContent!==tab.title&&(tab.titleElement.textContent=tab.title))}function revealPreviewTab(tab){!tab||!tab.element||requestAnimationFrame(()=>{if(!tab.element||!tab.element.isConnected)return;let tabsElement=tab.element.parentElement;if(!tabsElement)return;let left=tab.element.offsetLeft,right=left+tab.element.offsetWidth;left<tabsElement.scrollLeft?tabsElement.scrollLeft=left:right>tabsElement.scrollLeft+tabsElement.clientWidth&&(tabsElement.scrollLeft=right-tabsElement.clientWidth)})}function isTabLoadCurrent(tab,token,url){return!!(tab&&!tab.closed&&previewTabs.includes(tab)&&tab.loadToken===token&&tab.url===url&&tab.iframe)}function cancelPreviewTabLoad(tab){if(tab){if(tab.loadToken=nextLoadToken++,tab.request){try{tab.request.abort()}catch{}tab.request=null}clearContentReadyTimer(tab),tab.iframe&&(tab.iframe.onload=null),tab.loadingBar&&(tab.loadingBar.remove(),tab.loadingBar=null),tab.pane&&tab.pane.setAttribute("aria-busy","false")}}function releasePreviewTabResources(tab){tab&&(cancelPreviewTabLoad(tab),tab.pane&&tab.pane.parentNode&&tab.pane.parentNode.removeChild(tab.pane),tab.element&&tab.element.parentNode&&tab.element.parentNode.removeChild(tab.element),tab.iframe=null,tab.pane=null,tab.element=null,tab.titleElement=null,tab.loadState="closed")}function syncActiveTabChrome(shouldReveal=!1){let tab=getActiveTab();if(!previewContainer||!tab)return;currentTargetUrl=tab.url;let oldTabElement=previewContainer.querySelector(".agy-preview-tab.active");oldTabElement&&oldTabElement!==tab.element&&(oldTabElement.classList.remove("active"),oldTabElement.setAttribute("aria-selected","false")),tab.element&&(tab.element.classList.add("active"),tab.element.setAttribute("aria-selected","true"));let oldPane=previewContainer.querySelector(".agy-preview-pane.active");oldPane&&oldPane!==tab.pane&&(oldPane.classList.remove("active"),oldPane.setAttribute("aria-hidden","true")),tab.pane&&(tab.pane.classList.add("active"),tab.pane.setAttribute("aria-hidden","false"));let openButton=previewContainer.querySelector(".agy-open-btn");openButton&&(openButton.href=tab.url),scheduleBookmarkButtonStateUpdate(tab.id),shouldReveal&&revealPreviewTab(tab)}function updatePreviewTabTitle(tab,title){let normalizedTitle=title&&title.trim();!tab||tab.closed||!normalizedTitle||(tab.title=normalizedTitle,updatePreviewTabElement(tab))}function loadPreviewTab(tab,options2={}){if(!tab||!previewContainer||!tab.iframe||tab.closed)return;cancelPreviewTabLoad(tab);let token=tab.loadToken,url=tab.url;tab.loadState="loading",delete tab.iframe.dataset.loaded,tab.iframe.style.visibility="visible";let bar=showLoadingBar(tab);startLoad(tab,url,bar,token,options2)}function hasPreviewContent(innerDoc){return!innerDoc||!innerDoc.body?!1:(typeof innerDoc.body.innerText=="string"?innerDoc.body.innerText:innerDoc.body.textContent||"").replace(/\s+/g,"").length>=12?!0:!!innerDoc.body.querySelector('img[src], video, canvas, svg, article, main > *, [role="main"] > *')}function pollPreviewContentReady(tab,url,token,attempt=0){if(!(!isTabLoadCurrent(tab,token,url)||tab.loadState==="loaded")){try{if(hasPreviewContent(tab.iframe.contentDocument)){revealLoadedPreviewTab(tab,token,url);return}}catch{return}attempt>=100||(tab.contentReadyTimer=setTimeout(()=>{tab.contentReadyTimer=null,pollPreviewContentReady(tab,url,token,attempt+1)},100))}}function addPreviewTab(url){if(isImageUrl(url)){showImageViewer(url);return}let tab=createPreviewTab(url);previewTabs.push(tab),mountPreviewTab(tab),mountPreviewTabElement(tab),activeTabId=tab.id,syncActiveTabChrome(!0),closeBookmarkPanel(),loadPreviewTab(tab),suspendInactivePreviewTabs()}function activatePreviewTab(tabId){if(tabId===activeTabId||!previewTabs.some(tab2=>tab2.id===tabId))return;activeTabId=tabId;let tab=getPreviewTab(tabId);tab&&(tab.lastUsedAt=Date.now(),tab.pane||(mountPreviewTab(tab),loadPreviewTab(tab))),syncActiveTabChrome(!0),closeBookmarkPanel(),suspendInactivePreviewTabs()}function suspendInactivePreviewTabs(){let liveTabs=previewTabs.filter(tab=>tab.iframe);for(;liveTabs.length>PREVIEW_LIVE_FRAMES;){let candidate=liveTabs.filter(tab=>tab.id!==activeTabId).sort((a,b)=>a.lastUsedAt-b.lastUsedAt)[0];if(!candidate)return;cancelPreviewTabLoad(candidate),candidate.pane&&candidate.pane.remove(),candidate.pane=null,candidate.iframe=null,candidate.loadingBar=null,candidate.loadState="suspended",liveTabs.splice(liveTabs.indexOf(candidate),1)}}function closePreviewTab(tabId){let index=previewTabs.findIndex(tab2=>tab2.id===tabId);if(index<0)return;if(previewTabs.length===1){destroyPreview();return}let tab=previewTabs[index],wasActive=activeTabId===tabId;tab.closed=!0,tab.loadToken=nextLoadToken++,tab.pane&&(tab.pane.style.visibility="hidden",tab.pane.style.pointerEvents="none"),tab.element&&(tab.element.style.display="none"),previewTabs.splice(index,1),wasActive&&(activeTabId=previewTabs[Math.min(index,previewTabs.length-1)].id,syncActiveTabChrome(!0)),scheduleHeavyCleanup(()=>releasePreviewTabResources(tab))}function navigatePreview(url,tabId=activeTabId,options2={}){if(isImageUrl(url)){showImageViewer(url);return}let tab=getPreviewTab(tabId);tab&&(options2.fromHistory||(tab.historyEntries=tab.historyEntries.slice(0,tab.historyIndex+1),tab.historyEntries[tab.historyEntries.length-1]!==url&&tab.historyEntries.push(url),tab.historyIndex=tab.historyEntries.length-1),tab.url=url,tab.title=getFallbackTabTitle(url),tab.id===activeTabId?(syncActiveTabChrome(),options2.keepBookmarkPanel||closeBookmarkPanel()):updatePreviewTabElement(tab),loadPreviewTab(tab))}function movePreviewHistory(tab,direction){if(!tab||tab.closed||direction!==-1&&direction!==1)return!1;let nextIndex=tab.historyIndex+direction;return nextIndex<0||nextIndex>=tab.historyEntries.length?!1:(tab.historyIndex=nextIndex,navigatePreview(tab.historyEntries[nextIndex],tab.id,{fromHistory:!0}),!0)}function refreshPreviewTab(tab){return!tab||tab.closed||tab.id!==activeTabId?!1:(closeBookmarkPanel(),loadPreviewTab(tab,{forceReload:!0}),!0)}function startLoad(tab,url,bar,token,options2={}){if(!isTabLoadCurrent(tab,token,url))return;if(shouldDirectLoad(url)){renderDirectDynamicPage(tab,url,bar,token);return}if(options2.forceReload){loadPageImmediate(tab,url,bar,token,options2);return}let cached=cacheMap.get(url);if(cached&&cached.status==="image")tab.loadState="image",tab.id===activeTabId&&showImageViewer(url),hideLoadingBar(bar,tab);else if(cached&&cached.status==="done"){let preparedHtml=ensurePreparedCacheEntry(url,cached);preparedHtml&&renderFetchedDynamicPage(tab,preparedHtml,url,bar,token)}else cached&&cached.status==="loading"?tab.loadState="waiting-cache":loadPageImmediate(tab,url,bar,token)}function showPreviewWindow(linkElement,url){syncClickMode(),previewContainer=document.createElement("div"),previewContainer.className="agy-preview-container";let container=previewContainer,header=document.createElement("div");header.className="agy-preview-header";let tabsElement=document.createElement("div");tabsElement.className="agy-preview-tabs",tabsElement.setAttribute("role","tablist");let actions=document.createElement("div");actions.className="agy-preview-actions";let listBtn=document.createElement("button");listBtn.className="agy-preview-btn agy-bm-list-btn",listBtn.title="\u4E66\u7B7E\u5217\u8868",listBtn.innerHTML=ICON_LIST,listBtn.addEventListener("click",e=>{e.stopPropagation(),toggleBookmarkPanel()});let bmBtn=document.createElement("button");bmBtn.className="agy-preview-btn agy-bm-add-btn",bmBtn.title="\u6536\u85CF\u5F53\u524D\u9875\u9762",bmBtn.innerHTML=ICON_BOOKMARK,bmBtn.addEventListener("click",e=>{e.stopPropagation(),toggleBookmark(bmBtn)});let openBtn=document.createElement("a");openBtn.className="agy-preview-btn agy-open-btn",openBtn.href=url,openBtn.target="_blank",openBtn.title="\u65B0\u7A97\u53E3\u6253\u5F00",openBtn.innerHTML=ICON_EXTERNAL,openBtn.addEventListener("click",()=>{setTimeout(destroyPreview,0)});let refreshBtn=document.createElement("button");refreshBtn.type="button",refreshBtn.className="agy-preview-btn agy-refresh-btn",refreshBtn.title="\u5237\u65B0\u5F53\u524D\u9884\u89C8",refreshBtn.setAttribute("aria-label",refreshBtn.title),refreshBtn.innerHTML=ICON_REFRESH,refreshBtn.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),refreshPreviewTab(getActiveTab())});let maximizeBtn=document.createElement("button");maximizeBtn.type="button",maximizeBtn.className="agy-maximize-btn",maximizeBtn.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),togglePreviewMaximized()});let closeBtn=document.createElement("button");closeBtn.type="button",closeBtn.className="agy-close-btn",closeBtn.innerHTML=ICON_CLOSE,closeBtn.title="\u5173\u95ED\u9884\u89C8 (Esc)",actions.appendChild(listBtn),actions.appendChild(bmBtn),actions.appendChild(refreshBtn),actions.appendChild(openBtn),actions.appendChild(maximizeBtn),actions.appendChild(closeBtn),header.appendChild(tabsElement),header.appendChild(actions);let body=document.createElement("div");body.className="agy-preview-body",previewContainer.appendChild(header),previewContainer.appendChild(body),document.body.appendChild(previewContainer),previewTabs=[createPreviewTab(url)],activeTabId=previewTabs[0].id,mountPreviewTab(previewTabs[0]),mountPreviewTabElement(previewTabs[0]),syncActiveTabChrome(),positionPreviewWindow(linkElement),applyPreviewMaximizedState(),enablePreviewDragging(header),container.classList.add("agy-preview-visible"),loadPreviewTab(previewTabs[0])}function loadPageImmediate(tab,url,loadingBar,token,options2={}){let request=null,requestOptions={method:"GET",url,timeout:1e4,onload:function(response){if(!(!isTabLoadCurrent(tab,token,url)||tab.request!==request))if(tab.request=null,response.status>=200&&response.status<400){if(typeof response.responseText=="string"&&response.responseText.length*2>MAX_RESPONSE_BYTES){showError(tab,"\u9875\u9762\u8FC7\u5927\uFF0C\u8BF7\u5728\u65B0\u6807\u7B7E\u9875\u6253\u5F00");return}if(isImageResponse(response)){setCache(url,{status:"image",html:"",xhr:null,time:Date.now()}),tab.loadState="image",tab.id===activeTabId&&showImageViewer(url),hideLoadingBar(loadingBar,tab);return}if(!isRenderableResponse(response)){showError(tab,"\u6B64\u6587\u4EF6\u7C7B\u578B\u4E0D\u652F\u6301\u9884\u89C8");return}let finalUrl=getFinalUrl(response,url),prepared=prepareDynamicHtml(response.responseText,finalUrl,TOKEN_PLACEHOLDER);setCache(url,{status:"done",html:prepared,xhr:null,time:Date.now(),finalUrl}),renderFetchedDynamicPage(tab,prepared,url,loadingBar,token)}else showError(tab,response.statusText||"\u52A0\u8F7D\u5931\u8D25")},onerror:function(){!isTabLoadCurrent(tab,token,url)||tab.request!==request||(tab.request=null,showError(tab,"\u7F51\u7EDC\u8FDE\u63A5\u51FA\u9519"))},onprogress:function(progress){if(!(!responseTooLarge(progress)||tab.request!==request)){try{request.abort()}catch{}tab.request=null,showError(tab,"\u9875\u9762\u8FC7\u5927\uFF0C\u8BF7\u5728\u65B0\u6807\u7B7E\u9875\u6253\u5F00")}}};options2.forceReload&&(requestOptions.headers={"Cache-Control":"no-cache",Pragma:"no-cache"}),request=GM_xmlhttpRequest(requestOptions),tab.request=request}function prepareDynamicHtml(htmlString,baseUrl,token){let parsed=new DOMParser().parseFromString(htmlString,"text/html");parsed.querySelectorAll("base").forEach(node=>node.remove()),parsed.querySelectorAll("meta[http-equiv]").forEach(meta=>{let directive=(meta.getAttribute("http-equiv")||"").toLowerCase();(directive==="content-security-policy"||directive==="refresh")&&meta.remove()});let resolveEmbeddedUrl=value=>{let raw=(value||"").trim();if(!raw||raw.charAt(0)==="#"||/^(?:data|blob|javascript|mailto|tel):/i.test(raw))return value;try{return new URL(raw,baseUrl).href}catch{return value}};parsed.querySelectorAll("[src], [href], [poster], [action], [formaction]").forEach(element=>{["src","href","poster","action","formaction"].forEach(attribute=>{element.hasAttribute(attribute)&&element.setAttribute(attribute,resolveEmbeddedUrl(element.getAttribute(attribute)))})}),parsed.querySelectorAll("[srcset]").forEach(element=>{let rewritten=(element.getAttribute("srcset")||"").split(",").map(candidate=>{let parts=candidate.trim().split(/\s+/);return parts[0]?(parts[0]=resolveEmbeddedUrl(parts[0]),parts.join(" ")):candidate}).join(", ");element.setAttribute("srcset",rewritten)});let rewriteCssUrls=css=>css.replace(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/gi,(match,quote,value)=>{let resolved=resolveEmbeddedUrl(value);return resolved===value?match:`url("${resolved}")`});parsed.querySelectorAll("[style]").forEach(element=>{element.setAttribute("style",rewriteCssUrls(element.getAttribute("style")||""))}),parsed.querySelectorAll("style").forEach(style=>{style.textContent=rewriteCssUrls(style.textContent||"")});let base=parsed.createElement("base");base.href=baseUrl,parsed.head.prepend(base);let bridge=parsed.createElement("script");bridge.textContent=`
            (function() {
                if (window.__agyEmbeddedPreviewBridge) return;
                window.__agyEmbeddedPreviewBridge = true;
                var loadToken = ${token};
                var contentReadySent = false;
                var contentCheckScheduled = false;
                var contentObserver = null;
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
        `,base.after(bridge);let siteRule=getSiteRule(baseUrl);if(siteRule&&siteRule.css){let siteStyle=parsed.createElement("style");siteStyle.textContent=siteRule.css,parsed.head.appendChild(siteStyle)}return`<!doctype html>
`+parsed.documentElement.outerHTML}function handleDynamicPageLoaded(tab,baseUrl,loadingBar,token){if(!isTabLoadCurrent(tab,token,baseUrl))return;let canInspectDocument=!1,hasContent=!1;try{let innerDoc=tab.iframe.contentDocument;canInspectDocument=!!innerDoc,hasContent=hasPreviewContent(innerDoc),applySiteRuleToDocument(innerDoc,baseUrl),innerDoc&&innerDoc.title&&updatePreviewTabTitle(tab,innerDoc.title)}catch{}!canInspectDocument||hasContent?revealLoadedPreviewTab(tab,token,baseUrl,loadingBar):pollPreviewContentReady(tab,baseUrl,token),tab.id===activeTabId&&updateBookmarkButtonState()}function revealLoadedPreviewTab(tab,token,baseUrl,loadingBar){isTabLoadCurrent(tab,token,baseUrl)&&(tab.loadState="loaded",tab.iframe.style.visibility="visible",hideLoadingBar(loadingBar||tab.loadingBar,tab))}function applySiteRuleToDocument(innerDoc,url){let rule=getSiteRule(url);if(!innerDoc||!rule||!rule.css)return;let existingStyle=innerDoc.getElementById("agy-site-rule-style");if(existingStyle){existingStyle.textContent!==rule.css&&(existingStyle.textContent=rule.css);return}let style=innerDoc.createElement("style");style.id="agy-site-rule-style",style.textContent=rule.css,(innerDoc.head||innerDoc.documentElement).appendChild(style)}function setPreviewFrameToken(iframe,token){let frameName=`${PREVIEW_FRAME_PREFIX}${token}`;iframe.name=frameName;try{iframe.contentWindow.name=frameName}catch{}}function renderDirectDynamicPage(tab,url,loadingBar,token){if(!isTabLoadCurrent(tab,token,url))return;let iframe=tab.iframe;iframe.dataset.loaded="true",setPreviewFrameToken(iframe,token),iframe.onload=()=>handleDynamicPageLoaded(tab,url,loadingBar,token),iframe.removeAttribute("srcdoc"),iframe.src=url}function renderFetchedDynamicPage(tab,preparedHtml,baseUrl,loadingBar,token){if(!isTabLoadCurrent(tab,token,baseUrl))return;let iframe=tab.iframe;tab.loadState="loading",iframe.dataset.loaded="true",setPreviewFrameToken(iframe,token),iframe.onload=()=>handleDynamicPageLoaded(tab,baseUrl,loadingBar,token),iframe.srcdoc=preparedHtml.replace(new RegExp(TOKEN_PLACEHOLDER,"g"),String(token))}function showError(tab,msg){if(!previewContainer||!tab||tab.closed)return;clearContentReadyTimer(tab),tab.loadState="error";let bar=tab.loadingBar;if(bar||(bar=createErrorBar(tab,msg)),!bar)return;tab.pane&&tab.pane.setAttribute("aria-busy","false"),tab.iframe&&(tab.iframe.style.visibility="hidden");let textNode=bar.querySelector(".agy-error-text");textNode&&(textNode.textContent=`\u52A0\u8F7D\u51FA\u9519: ${msg}`,textNode.style.color="#ff3b30")}function clampPreviewPosition(left,top,container){let width=container?container.offsetWidth:Math.min(WINDOW_WIDTH,window.innerWidth-WINDOW_MARGIN*2),height=container?container.offsetHeight:Math.min(WINDOW_HEIGHT,window.innerHeight-WINDOW_MARGIN*2),maxLeft=Math.max(WINDOW_MARGIN,window.innerWidth-width-WINDOW_MARGIN),maxTop=Math.max(WINDOW_MARGIN,window.innerHeight-height-WINDOW_MARGIN);return{left:Math.round(Math.min(Math.max(left,WINDOW_MARGIN),maxLeft)),top:Math.round(Math.min(Math.max(top,WINDOW_MARGIN),maxTop))}}function applyPreviewPosition(container,position){container.style.left=`${position.left}px`,container.style.top=`${position.top}px`}function syncPreviewMaximizeButton(){if(!previewContainer)return;let button=previewContainer.querySelector(".agy-maximize-btn");button&&(button.innerHTML=isPreviewMaximized?ICON_RESTORE:ICON_MAXIMIZE,button.title=isPreviewMaximized?"\u8FD8\u539F\u9884\u89C8\u7A97\u53E3":"\u6700\u5927\u5316\u9884\u89C8\u7A97\u53E3",button.setAttribute("aria-label",button.title),button.setAttribute("aria-pressed",String(isPreviewMaximized)))}function applyPreviewMaximizedState(){previewContainer&&(previewContainer.classList.toggle("agy-maximized",isPreviewMaximized),syncPreviewMaximizeButton())}function togglePreviewMaximized(){if(previewContainer){if(!isPreviewMaximized){let rect=previewContainer.getBoundingClientRect(),position=clampPreviewPosition(rect.left,rect.top,previewContainer);applyPreviewPosition(previewContainer,position),savePreviewPosition(position)}if(isPreviewMaximized=!isPreviewMaximized,savePreviewMaximizedState(isPreviewMaximized),applyPreviewMaximizedState(),!isPreviewMaximized){let savedPosition=loadPreviewPosition(),position=clampPreviewPosition(savedPosition?savedPosition.left:previewContainer.offsetLeft,savedPosition?savedPosition.top:previewContainer.offsetTop,previewContainer);applyPreviewPosition(previewContainer,position),savePreviewPosition(position)}closeBookmarkPanel()}}function enablePreviewDragging(header){header.addEventListener("pointerdown",function(e){if(e.button!==0||isPreviewMaximized||e.target.closest(".agy-preview-actions, .agy-preview-tab"))return;let container=header.closest(".agy-preview-container");if(!container||container!==previewContainer)return;let rect=container.getBoundingClientRect(),pointerId=e.pointerId,offsetX=e.clientX-rect.left,offsetY=e.clientY-rect.top;e.preventDefault(),e.stopPropagation(),closeBookmarkPanel(),container.classList.add("agy-preview-visible"),container.classList.remove("agy-animating"),container.classList.add("agy-dragging");try{header.setPointerCapture(pointerId)}catch{}function move(event){if(event.pointerId!==pointerId)return;let position=clampPreviewPosition(event.clientX-offsetX,event.clientY-offsetY,container);applyPreviewPosition(container,position)}function finish(event){if(event.pointerId!==pointerId)return;header.removeEventListener("pointermove",move),header.removeEventListener("pointerup",finish),header.removeEventListener("pointercancel",finish),container.classList.remove("agy-dragging");try{header.releasePointerCapture(pointerId)}catch{}let finalRect=container.getBoundingClientRect(),position=clampPreviewPosition(finalRect.left,finalRect.top,container);applyPreviewPosition(container,position),savePreviewPosition(position)}header.addEventListener("pointermove",move),header.addEventListener("pointerup",finish),header.addEventListener("pointercancel",finish)})}function positionPreviewWindow(targetElement){if(!previewContainer)return;let savedPosition=loadPreviewPosition();if(savedPosition){applyPreviewPosition(previewContainer,clampPreviewPosition(savedPosition.left,savedPosition.top,previewContainer));return}let rect=targetElement.getBoundingClientRect(),top=rect.bottom+8,left=rect.left;top+previewContainer.offsetHeight>window.innerHeight-WINDOW_MARGIN&&(top=rect.top-WINDOW_HEIGHT-8),applyPreviewPosition(previewContainer,clampPreviewPosition(left,top,previewContainer))}function isSameOrigin(url){try{return new URL(url).origin===window.location.origin}catch{return!1}}function isLikelyBinaryUrl(url){try{return/\.(?:pdf|zip|rar|7z|tar|gz|bz2|xz|dmg|exe|msi|apk|deb|rpm|iso|mp4|mkv|avi|mov|webm|mp3|flac|wav|docx?|xlsx?|pptx?)(?:$|[?#])/i.test(new URL(url).pathname)}catch{return!0}}function openFromFrame(url,anchorRect){if(!isPreviewEnabled()||!/^https?:/i.test(url)||options.isPreviewableUrl&&!options.isPreviewableUrl(url,null))return;if(isImageUrl(url)){showImageViewer(url);return}if(previewContainer){addPreviewTab(url);return}currentTargetUrl=url;let rect=anchorRect||{left:WINDOW_MARGIN,top:WINDOW_MARGIN,bottom:WINDOW_MARGIN};showPreviewWindow({getBoundingClientRect:()=>rect},url)}function destroyInstallation(){installationDestroyed||(installationDestroyed=!0,destroyPreview(),closeImageViewer(),closeBookmarkPanel(),listenerDisposers.splice(0).forEach(dispose=>{try{dispose()}catch{}}),clickTimer&&clearTimeout(clickTimer),preheatTimer&&clearTimeout(preheatTimer),swallowClickResetTimer&&clearTimeout(swallowClickResetTimer),pointerShieldTimer&&clearTimeout(pointerShieldTimer),clearCacheCleanupTimer(),cacheMap.forEach(entry=>{if(entry&&entry.xhr)try{entry.xhr.abort()}catch{}}),cacheMap.clear(),preheatLink=null,injectedStyle?.remove(),injectedStyle=null)}return{openFromFrame,close:destroyPreview,syncClickMode,destroy:destroyInstallation}}var PreviewController=class{constructor(options){this.options=options}api=null;mount(){this.api||!this.options.isEnabled()||(this.api=installLinkHoverPreviewer({isEnabled:this.options.isEnabled,clickMode:this.options.clickMode,onClickModeChange:this.options.onClickModeChange,isPreviewableUrl:(url,link)=>this.isPreviewable(url,link)}))}setEnabled(enabled){if(enabled){this.mount();return}this.api?.destroy(),this.api=null}close(){this.api?.close()}syncClickMode(){this.api?.syncClickMode()}openFromFrame(url,iframe,anchorRect){if(!this.api||!this.options.isEnabled()||!this.isPreviewable(url,null))return;let frameRect=iframe.getBoundingClientRect(),rect=anchorRect??{left:0,bottom:0};this.api.openFromFrame(url,{left:frameRect.left+rect.left,top:frameRect.top+rect.bottom,bottom:frameRect.top+rect.bottom})}isPreviewable(url,link){if(!/^https?:/i.test(url)||getTopicInfo(url))return!1;try{let parsed=new URL(url,location.href);if(parsed.origin===location.origin||/\.(?:pdf|zip|rar|7z|tar|gz|bz2|xz|dmg|exe|msi|apk|deb|rpm|iso|mp4|mkv|avi|mov|webm|mp3|flac|wav|docx?|xlsx?|pptx?)$/i.test(parsed.pathname))return!1}catch{return!1}return link?link.hasAttribute("download")||link.target&&link.target.toLowerCase()!=="_self"||link.closest(".d-header, .sidebar-wrapper, .ldu-topic-toolbar, .ldu-settings-panel")||link.closest("button, [role=button], .btn, .d-button, input, textarea, select")||link.matches(".lightbox")||link.querySelector("img, picture")?!1:!link.closest("img, picture, .lightbox-wrapper"):!0}};var SHARED_CACHE_KEY="linuxdo-ultimate:credit-cache:v1",SHARED_REQUEST_LOCK="linuxdo-ultimate:credit-refresh",CreditWidget=class{constructor(options={}){this.options=options}host=null;button=null;value=null;tooltip=null;communityBalance=null;gamificationScore=null;username=null;tooltipContent="\u52A0\u8F7D\u4E2D...";timeoutId=null;inFlight=null;requestGeneration=0;activeRequestController=null;mounted=!1;enabled=!1;mount(enabled){this.mounted||!(this.options.isTopLevel?.()??window.self===window.top)||(this.mounted=!0,this.createWidget(),document.addEventListener("visibilitychange",()=>this.handleVisibilityChange()),this.ensureHost(),this.setEnabled(enabled))}ensureHost(){if(!this.host)return;let language=document.querySelector(".d-header-icons > .language-switcher");language&&(language.nextElementSibling!==this.host&&language.after(this.host),this.enabled&&this.startUpdates())}setEnabled(enabled){if(!this.mounted){this.mount(enabled);return}if(this.enabled=enabled,this.host&&(this.host.hidden=!enabled),this.tooltip&&(this.tooltip.hidden=!0),!enabled){this.requestGeneration+=1,this.activeRequestController?.abort(),this.activeRequestController=null,this.inFlight=null,this.clearSchedule();return}this.ensureHost(),this.host?.isConnected&&this.startUpdates()}startUpdates(){!this.enabled||!this.isVisible()||this.inFlight||this.timeoutId!==null||this.fetchData(!1)}createWidget(){let host=document.createElement("li");host.className="header-dropdown-toggle ldu-credit-host";let button=document.createElement("button");button.type="button",button.className="btn no-text language-switcher-trigger btn-flat ldu-credit-button is-loading",button.title="Credit \u79EF\u5206\u6536\u5165\uFF0C\u70B9\u51FB\u5237\u65B0",button.setAttribute("aria-label","Credit \u79EF\u5206\u6536\u5165\uFF0C\u70B9\u51FB\u5237\u65B0"),button.setAttribute("aria-describedby","ldu-credit-tooltip");let value=document.createElement("span");value.className="ldu-credit-value",value.setAttribute("aria-live","polite"),value.textContent="\xB7\xB7\xB7",button.append(value),host.append(button);let tooltip=document.createElement("div");tooltip.id="ldu-credit-tooltip",tooltip.className="ldu-credit-tooltip",tooltip.hidden=!0,tooltip.setAttribute("role","tooltip"),document.body.append(tooltip);let showTooltip=()=>{if(!this.enabled)return;tooltip.textContent=this.tooltipContent,tooltip.hidden=!1;let rect=button.getBoundingClientRect(),left=Math.max(8,Math.min(window.innerWidth-tooltip.offsetWidth-8,rect.right-tooltip.offsetWidth));tooltip.style.left=`${left}px`,tooltip.style.top=`${rect.bottom+6}px`},hideTooltip=()=>{tooltip.hidden=!0};button.addEventListener("mouseenter",showTooltip),button.addEventListener("mouseleave",hideTooltip),button.addEventListener("focus",showTooltip),button.addEventListener("blur",hideTooltip),button.addEventListener("click",()=>{this.setLoading("\u5237\u65B0\u4E2D..."),this.fetchData(!0)}),this.host=host,this.button=button,this.value=value,this.tooltip=tooltip}fetchData(force){if(!this.enabled||!this.isVisible())return Promise.resolve();if(this.inFlight)return this.inFlight;let generation=++this.requestGeneration,startedAt=this.now(),controller=new AbortController;this.activeRequestController=controller;let task=(async()=>{try{let cached=force?null:this.readSharedSnapshot(),snapshot=cached??await this.fetchSnapshotCoordinated(force,startedAt,controller.signal);if(!this.enabled||generation!==this.requestGeneration)return;this.communityBalance=snapshot.communityBalance,this.gamificationScore=snapshot.gamificationScore,this.username=snapshot.username,cached||this.writeSharedSnapshot(snapshot),this.updateDisplay()}catch(error){if(controller.signal.aborted)return;console.error("[Linux.do Ultimate] LDC request failed",error),this.enabled&&generation===this.requestGeneration&&this.showError()}})().finally(()=>{this.activeRequestController===controller&&(this.activeRequestController=null),this.inFlight===task&&(this.inFlight=null),!(!this.enabled||!this.isVisible())&&(generation!==this.requestGeneration?this.startUpdates():this.scheduleNext())});return this.inFlight=task,task}async fetchSnapshotCoordinated(force,startedAt,signal){let locks=typeof navigator<"u"?navigator.locks:void 0;return locks?locks.request(SHARED_REQUEST_LOCK,{signal},async()=>{let shared=this.readSharedSnapshot();if(shared&&(!force||shared.updatedAt>=startedAt))return shared;let snapshot=await this.fetchSnapshot(signal);return this.writeSharedSnapshot(snapshot),snapshot}):this.fetchSnapshot(signal)}async fetchSnapshot(signal){let credit=await this.request("https://credit.linux.do/api/v1/oauth/user-info",signal),rawBalance=credit?.data?.["community-balance"]??credit?.data?.community_balance,username=credit?.data?.username??credit?.data?.nickname,communityBalance=Number.parseFloat(String(rawBalance));if(!username||!Number.isFinite(communityBalance))throw new Error("invalid credit response");let data=await this.request(`https://linux.do/u/${encodeURIComponent(username)}.json`,signal),gamificationScore=Number.parseFloat(String(data?.user?.gamification_score));if(!Number.isFinite(gamificationScore))throw new Error("invalid gamification response");return{communityBalance,gamificationScore,username,updatedAt:this.now()}}scheduleNext(){this.clearSchedule(),this.timeoutId=window.setTimeout(()=>{this.timeoutId=null,this.fetchData(!1)},3e5)}clearSchedule(){this.timeoutId!==null&&window.clearTimeout(this.timeoutId),this.timeoutId=null}handleVisibilityChange(){if(!this.isVisible()){this.clearSchedule();return}this.enabled&&this.startUpdates()}isVisible(){return this.options.isVisible?.()??document.visibilityState!=="hidden"}now(){return this.options.now?.()??Date.now()}readSharedSnapshot(){try{let raw=localStorage.getItem(SHARED_CACHE_KEY);if(raw===null)return null;let value=JSON.parse(raw);return!value||this.now()-Number(value.updatedAt)>=6e4||!Number.isFinite(value.communityBalance)||!Number.isFinite(value.gamificationScore)||typeof value.username!="string"?(this.clearSharedSnapshot(),null):value}catch{return this.clearSharedSnapshot(),null}}clearSharedSnapshot(){try{localStorage.removeItem(SHARED_CACHE_KEY)}catch{}}writeSharedSnapshot(snapshot){try{localStorage.setItem(SHARED_CACHE_KEY,JSON.stringify(snapshot))}catch{}}updateDisplay(){if(this.communityBalance===null||this.gamificationScore===null||!this.value||!this.button)return;let difference=this.gamificationScore-this.communityBalance;this.value.textContent=`${difference>0?"+":""}${difference.toFixed(2)}`,this.button.classList.remove("is-loading","is-positive","is-negative","is-neutral"),this.button.classList.add(difference>0?"is-positive":difference<0?"is-negative":"is-neutral"),this.tooltipContent=`\u4EC5\u4F9B\u53C2\u8003\uFF0C\u53EF\u80FD\u6709\u8BEF\u5DEE\uFF01
\u5F53\u524D\u5206: ${this.gamificationScore.toFixed(2)}
\u57FA\u51C6\u503C: ${this.communityBalance.toFixed(2)}`}setLoading(message){this.value&&(this.value.textContent="\xB7\xB7\xB7"),this.button?.classList.remove("is-positive","is-negative","is-neutral"),this.button?.classList.add("is-loading"),this.tooltipContent=message}showError(){this.value&&(this.value.textContent="!"),this.button?.classList.remove("is-loading","is-positive","is-neutral"),this.button?.classList.add("is-negative"),this.tooltipContent="\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u5DF2\u767B\u5F55"}request(url,signal){if(this.options.request)return this.options.request(url);let headers={Accept:"application/json"};if(url.startsWith(location.origin)){let csrfToken=document.querySelector('meta[name="csrf-token"]')?.content;return csrfToken&&(headers["x-csrf-token"]=csrfToken),fetch(url,{credentials:"include",headers,signal}).then(response=>{if(!response.ok)throw new Error(String(response.status));return response.json()}).catch(error=>signal.aborted?Promise.reject(error):this.requestWithUserscript(url,headers,signal))}return this.requestWithUserscript(url,headers,signal)}requestWithUserscript(url,headers,signal){return new Promise((resolve,reject)=>{if(typeof GM_xmlhttpRequest!="function"){reject(new Error("GM_xmlhttpRequest is unavailable"));return}let settled=!1,handle=null,finish=callback=>{settled||(settled=!0,signal.removeEventListener("abort",abort),callback())},abort=()=>{try{handle?.abort()}catch{}finish(()=>reject(new DOMException("Aborted","AbortError")))};if(signal.aborted){abort();return}signal.addEventListener("abort",abort,{once:!0});let request={method:"GET",url,withCredentials:!0,headers:{...headers,Referer:"https://credit.linux.do/home"},timeout:1e4,onload:response=>{if(response.status!==200){finish(()=>reject(new Error(String(response.status))));return}try{let value=JSON.parse(response.responseText);finish(()=>resolve(value))}catch(error){finish(()=>reject(error))}},onerror:error=>finish(()=>reject(error)),ontimeout:()=>finish(()=>reject(new Error("timeout")))};handle=GM_xmlhttpRequest(request)})}};var ROUTE_DEBOUNCE_MS=100,SESSION_MAINTENANCE_INTERVAL_MS=30*6e4;function startLinuxDoApp(){if(window.self!==window.top||window.__linuxDoUltimateAppStarted)return;window.__linuxDoUltimateAppStarted=!0;let start=()=>new LinuxDoApp().start();if(document.body){start();return}let observer=new MutationObserver(()=>{document.body&&(observer.disconnect(),start())});observer.observe(document,{childList:!0,subtree:!0})}var LinuxDoApp=class{storage=new UserscriptStorage;settings=normalizeSettings(DEFAULT_SETTINGS);session;tabStore;layout;frames=null;secondaryFrames=null;frameBudget;listFrame=null;preview;settingsPanel;credit;settingsHost=null;routeTimer=null;persistTimer=null;lastRoute="";restoredTabsTracked=!1;trackedTopicKey="";topicTrackTimers=[];routeHostObserver=null;hostMaintenanceTimer=null;hasRestoredSession=!1;sessionLease;leaseTimer=null;sessionMaintenanceTimer=null;tabContextMenu;start(){this.settings=loadSettings(this.storage),ensureAppStyles(),this.preview=new PreviewController({isEnabled:()=>this.settings.enabled&&this.settings.previewEnabled,clickMode:()=>this.settings.previewClickMode,onClickModeChange:previewClickMode=>this.applySettings({previewClickMode})}),this.preview.setEnabled(this.settings.enabled&&this.settings.previewEnabled),this.tabContextMenu=new TabContextMenu({onMoveToSplit:tabId=>this.moveTabToSecondary(tabId),onOpenBrowserTab:tabId=>this.openTabInBrowser(tabId),onReload:tabId=>this.reloadTab(tabId),onCopyLink:tabId=>void this.copyTabLink(tabId),onBookmark:tabId=>this.bookmarkTab(tabId),onCloseOthers:tabId=>this.closeOtherTabs(tabId)}),this.sessionLease=claimSessionId(this.storage,window.sessionStorage,Date.now(),isReloadNavigation(window.performance));let sessionId=this.sessionLease.sessionId;reconcileSessionClose(this.storage,sessionId),cleanupExpiredSessions(this.storage),this.settings.restoreSession||clearRestorableSessions(this.storage);let initial=createSession(sessionId,location.href,Date.now());initial.paneSizes={...this.settings.paneSizes};let currentSession=loadSessionIfPresent(this.storage,sessionId,location.href,Date.now()),previousSession=!currentSession&&classifyRoute(location.href)!=="topic"&&this.settings.restoreSession?loadLatestSession(this.storage,sessionId,location.href,Date.now()):null;this.session=currentSession??previousSession??initial,this.hasRestoredSession=!!previousSession?.tabs.length,this.tabStore=new TopicTabStore(this.session,session=>{this.session=session,saveSession(this.storage,session),this.renderTabs()}),this.settings.enabled&&this.settings.tabsEnabled&&this.session.tabs.length>0&&document.documentElement.classList.add("ldu-split-booting"),this.frameBudget=new FrameBudget(this.settings.maxLiveFrames),this.layout=new LayoutController({preference:this.settings.layoutPreference,paneSizes:this.session.paneSizes,hidePosters:this.settings.hidePosters,onPaneSizesChange:paneSizes=>this.persistPaneSizes(paneSizes)}),this.mountSettings(),this.credit=new CreditWidget,this.credit.mount(this.settings.enabled&&this.settings.creditEnabled),this.lastRoute=location.href,this.bindGlobalEvents(),hasStorageFailure()&&window.setTimeout(()=>this.showActionToast("\u672C\u5730\u5B58\u50A8\u4E0D\u53EF\u7528\uFF0C\u8BBE\u7F6E\u548C\u9605\u8BFB\u72B6\u6001\u53EF\u80FD\u65E0\u6CD5\u4FDD\u5B58",!0),0),this.leaseTimer=window.setInterval(()=>refreshSessionLease(this.storage,this.sessionLease),3e4),this.sessionMaintenanceTimer=window.setInterval(()=>cleanupExpiredSessions(this.storage),SESSION_MAINTENANCE_INTERVAL_MS),this.syncRoute(),window.__LDU_TEST_MODE__&&(window.__LDU_TEST_API__={openTopic:(url,title)=>{let info=getTopicInfo(url,location.href);info&&this.openTopic(info.topicId,info.url.href,title,info.postNumber)}})}bindGlobalEvents(){window.addEventListener(STORAGE_FAILURE_EVENT,()=>{this.showActionToast("\u672C\u5730\u5B58\u50A8\u4E0D\u53EF\u7528\uFF0C\u8BBE\u7F6E\u548C\u9605\u8BFB\u72B6\u6001\u53EF\u80FD\u65E0\u6CD5\u4FDD\u5B58",!0)}),window.addEventListener("click",event=>this.handleTopicLinkClick(event),!0),window.addEventListener("message",event=>{this.frames?.handleMessage(event),this.secondaryFrames?.handleMessage(event),this.listFrame?.handleMessage(event)}),window.addEventListener("popstate",()=>this.scheduleRouteSync()),window.addEventListener("hashchange",()=>this.scheduleRouteSync()),window.addEventListener("pagehide",event=>this.handlePageHide(event),{capture:!0}),new MutationObserver(()=>{typeof window>"u"||typeof document>"u"||(this.hostMaintenanceTimer===null&&(this.hostMaintenanceTimer=window.setTimeout(()=>{this.hostMaintenanceTimer=null,this.ensureSettingsHost(),this.credit?.ensureHost()},100)),this.lastRoute!==location.href&&this.scheduleRouteSync())}).observe(document.documentElement,{childList:!0,subtree:!0})}handleTopicLinkClick(event){if(!(event instanceof MouseEvent)||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||!this.settings.enabled||!this.settings.tabsEnabled)return;let target=event.target,link=target instanceof Element?target.closest("a[href]"):null;if(!link||link.hasAttribute("download")||link.target&&link.target.toLowerCase()!=="_self")return;if(classifyRoute(location.href)==="topic"&&this.tabStore.getTabs().length===0){this.promoteDirectTopicNavigation(event,link);return}if(isSupportedTopicTarget(link.href,location.href)){let info=getTopicInfo(link.href);if(!info)return;let category=readTopicCategory(link.closest(".topic-list-item, .latest-topic-list-item, .search-result")??document);if(!this.openTopic(info.topicId,info.url.href,link.textContent?.trim()||`\u4E3B\u9898 ${info.topicId}`,info.postNumber,category??void 0))return;event.preventDefault(),event.stopImmediatePropagation();return}if(link.closest(".post-controls, .actions, .topic-timeline, .no-track-view-patch")||!this.layout.getShellElement()||this.layout.getMode()==="native")return;let targetUrl;try{targetUrl=new URL(link.href,location.href)}catch{return}!isNavigableForumPage(targetUrl.href,location.href)||link.target==="_blank"||link.hasAttribute("download")||this.navigateList(targetUrl.href)&&(event.preventDefault(),event.stopImmediatePropagation())}openTopic(topicId,url,title,postNumber,category,pane="primary"){if(!this.layout.mount())return!1;this.ensureListFrame(),this.ensureFrames(),this.layout.setOpen(!0);let input={topicId,url,title,...postNumber?{postNumber}:{},...category};pane==="secondary"?this.tabStore.openSecondary(input,Date.now()):this.tabStore.open(input,Date.now());let info=getTopicInfo(url);if(info){let tracker=createBrowserViewTracker();tracker.track(info,"split-open",location.href).then(result=>{result.status==="failed"&&window.setTimeout(()=>void tracker.track(info,"manual-retry",location.href),1e4)})}return!0}syncRoute(){try{this.syncRouteInternal()}catch(error){console.error("[Linux.do Ultimate] \u5206\u5C4F\u542F\u52A8\u5931\u8D25\uFF0C\u5DF2\u6062\u590D\u8BBA\u575B\u539F\u59CB\u9875\u9762",error),document.documentElement.classList.remove("ldu-split-booting"),this.disposeSplitRuntime()}finally{document.getElementById("linuxdo-ultimate-boot-style")?.remove()}}syncRouteInternal(){this.routeTimer=null,this.lastRoute!==location.href&&(this.lastRoute=location.href);let route=classifyRoute(location.href);if(this.settings.enabled&&this.settings.tabsEnabled&&(isSplitRoute(location.href)||this.tabStore.getTabs().length>0)){if(this.clearTopicTrackSchedule(),!this.layout.mount()){this.scheduleRouteMountRetry();return}this.routeHostObserver?.disconnect(),this.routeHostObserver=null;let hasTabs=this.tabStore.getTabs().length>0;if(this.layout.setOpen(hasTabs),hasTabs){this.ensureListFrame(),this.ensureFrames(),this.tabStore.getSecondaryTabs().length>0&&(this.layout.setSecondaryOpen(!0),this.ensureSecondaryFrames());let active=this.tabStore.getActive();if(active&&(this.activateFrame(active,"primary"),this.hasRestoredSession&&!this.restoredTabsTracked)){this.restoredTabsTracked=!0;let info=getTopicInfo(active.url);info&&createBrowserViewTracker().track(info,"restored-tab",location.href)}let secondaryActive=this.tabStore.getSecondaryActive();secondaryActive&&this.activateFrame(secondaryActive,"secondary")}return}if(document.documentElement.classList.remove("ldu-split-booting"),this.disposeSplitRuntime(),route==="topic"){let info=getTopicInfo(location.href);info&&this.scheduleTopicTracking(info.topicId,info.url.href)}else this.clearTopicTrackSchedule()}promoteDirectTopicNavigation(event,link){let current=getTopicInfo(location.href);if(!current)return;let targetUrl;try{targetUrl=new URL(link.href,location.href)}catch{return}if(targetUrl.origin!==location.origin)return;let targetRoute=classifyRoute(targetUrl.href,location.href);if(targetRoute==="topic"&&getTopicInfo(targetUrl.href,location.href)?.topicId===current.topicId||link.target==="_blank"||link.hasAttribute("download"))return;let listUrl=targetRoute==="topic"?new URL("/",location.href).href:targetUrl.href;if(this.layout.mount()&&(this.clearTopicTrackSchedule(),this.tabStore.setSessionFields({listUrl,listScrollY:0},Date.now(),!1),this.ensureListFrame(listUrl),this.ensureFrames(),this.layout.setOpen(!0),event.preventDefault(),event.stopImmediatePropagation(),this.openTopic(current.topicId,current.url.href,this.currentTopicTitle(current.topicId),current.postNumber),targetRoute==="topic")){let target=getTopicInfo(targetUrl.href,location.href);target&&this.openTopic(target.topicId,target.url.href,link.textContent?.trim()||`\u4E3B\u9898 ${target.topicId}`,target.postNumber)}}currentTopicTitle(topicId){return document.querySelector("#topic-title h1, .fancy-title")?.textContent?.trim()||document.title||`\u4E3B\u9898 ${topicId}`}scheduleRouteMountRetry(){if(this.routeHostObserver)return;let root=document.body??document.documentElement;this.routeHostObserver=new MutationObserver(()=>{!document.querySelector("#main-outlet-wrapper")||!document.querySelector("#main-outlet")||(this.routeHostObserver?.disconnect(),this.routeHostObserver=null,this.syncRoute())}),this.routeHostObserver.observe(root,{childList:!0,subtree:!0});let failOpen=()=>{(!document.querySelector("#main-outlet-wrapper")||!document.querySelector("#main-outlet"))&&document.documentElement.classList.remove("ldu-split-booting")};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",failOpen,{once:!0}):failOpen()}scheduleRouteSync(){this.routeTimer!==null&&window.clearTimeout(this.routeTimer),this.routeTimer=window.setTimeout(()=>this.syncRoute(),ROUTE_DEBOUNCE_MS)}ensureListFrame(requestedUrl){let container=this.layout.getListContentElement();if(!container)return;this.listFrame||(this.listFrame=new ListFrameController(container,this.session.sessionId,(message,iframe)=>this.handleListFrameMessage(message,iframe))),this.listFrame.setConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode,hidePosters:this.settings.hidePosters});let storedListUrl=requestedUrl??this.tabStore.getSession().listUrl,resolved;try{resolved=new URL(storedListUrl||"/",location.href)}catch{resolved=new URL("/",location.href)}let listUrl=resolved.origin!==location.origin||getTopicInfo(resolved.href,location.href)?new URL("/",location.href).href:resolved.href;this.listFrame.mount(listUrl)}navigateList(url){let target;try{target=new URL(url,location.href)}catch{return!1}return!isNavigableForumPage(target.href,location.href)||!this.layout.mount()?!1:(this.tabStore.setSessionFields({listUrl:target.href,listScrollY:0},Date.now(),!1),saveSession(this.storage,this.tabStore.getSession()),this.ensureListFrame(target.href),this.listFrame?.navigate(target.href),!0)}handleListFrameMessage(message,iframe){if(message.type==="ldu:list-interaction")return document.body.dispatchEvent(new MouseEvent("pointerdown",{bubbles:!0,cancelable:!0,button:0})),!0;if(message.type==="ldu:list-preview-open")return this.preview.openFromFrame(message.url??"",iframe,message.anchorRect),!0;if(message.type==="ldu:list-preview-dismiss")return this.preview.close(),!0;if(message.type==="ldu:list-topic-open"){let info=message.url?getTopicInfo(message.url,location.href):null;if(!info)return!1;let category=message.categoryName&&message.categoryColor?{categoryName:message.categoryName,categoryColor:message.categoryColor}:void 0;return this.openTopic(info.topicId,info.url.href,message.topicTitle||`\u4E3B\u9898 ${info.topicId}`,info.postNumber,category)}if(message.type==="ldu:list-navigate"&&message.url)return this.navigateList(message.url);if(!message.url||getTopicInfo(message.url,location.href))return!1;let previousSession=this.tabStore.getSession(),nextListUrl=new URL(message.url,location.href).href,sameListUrl=previousSession.listUrl===nextListUrl,savedScrollY=sameListUrl?previousSession.listScrollY:0;return this.tabStore.setSessionFields({listUrl:nextListUrl,...message.type==="ldu:list-state"&&typeof message.scrollY=="number"?{listScrollY:message.scrollY}:sameListUrl?{}:{listScrollY:0}},Date.now(),!1),message.type==="ldu:list-state"&&this.schedulePersist(),message.type==="ldu:list-ready"&&(this.listFrame?.restoreScroll(savedScrollY),this.schedulePersist()),!0}ensureFrames(){let content=this.layout.getContentElement();!content||this.frames||(this.frames=new TopicFramePool(content,this.settings.maxLiveFrames,(message,iframe)=>this.handleFrameMessage(message,iframe,"primary"),(tabId,iframe)=>{let scrollY=iframe.contentWindow?.scrollY??0;this.tabStore.update(tabId,{scrollY,suspended:!0},Date.now(),!1),this.schedulePersist()},this.frameBudget),this.frames.setPreviewConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode}),this.renderTabs())}ensureSecondaryFrames(){let content=this.layout.getSecondaryContentElement();!content||this.secondaryFrames||(this.secondaryFrames=new TopicFramePool(content,this.settings.maxLiveFrames,(message,iframe)=>this.handleFrameMessage(message,iframe,"secondary"),(tabId,iframe)=>{let scrollY=iframe.contentWindow?.scrollY??0;this.tabStore.update(tabId,{scrollY,suspended:!0},Date.now(),!1),this.schedulePersist()},this.frameBudget),this.secondaryFrames.setPreviewConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode}))}mountSettings(){if(this.settingsPanel)return;let host=document.createElement("li");host.className="ldu-settings-host",this.settingsHost=host,this.ensureSettingsHost(),this.settingsPanel=new SettingsPanel(host,this.settings,{onChange:patch=>this.applySettings(patch)}),this.settingsPanel.mount()}ensureSettingsHost(){if(!this.settingsHost)return;let target=document.querySelector(".d-header-icons")??document.querySelector(".d-header .contents")??document.body;this.settingsHost.parentElement!==target&&target.append(this.settingsHost)}applySettings(patch){if(this.settings=normalizeSettings({...this.settings,...patch}),saveSettings(this.storage,this.settings),this.layout.setPreference(this.settings.layoutPreference),this.layout.setHidePosters(this.settings.hidePosters),patch.paneSizes&&(this.layout.setPaneSizes(this.settings.paneSizes),this.tabStore.setSessionFields({paneSizes:this.settings.paneSizes},Date.now(),!1),saveSession(this.storage,this.tabStore.getSession())),this.frameBudget.setLimit(this.settings.maxLiveFrames),this.frames?.setPreviewConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode}),this.secondaryFrames?.setPreviewConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode}),this.listFrame?.setConfig({enabled:this.settings.enabled&&this.settings.previewEnabled,clickMode:this.settings.previewClickMode,hidePosters:this.settings.hidePosters}),this.settingsPanel?.setSettings(this.settings),this.preview.setEnabled(this.settings.enabled&&this.settings.previewEnabled),this.credit?.setEnabled(this.settings.enabled&&this.settings.creditEnabled),patch.previewClickMode!==void 0&&this.preview.syncClickMode(),patch.restoreSession===!1&&clearRestorableSessions(this.storage),(!this.settings.enabled||!this.settings.previewEnabled)&&this.preview.close(),patch.colorizeTabs!==void 0&&this.renderTabs(),!(this.settings.enabled&&this.settings.tabsEnabled&&(isSplitRoute(location.href)||this.tabStore.getTabs().length>0))){this.disposeSplitRuntime();return}if(!this.layout.mount())return;let active=this.tabStore.getActive(),hasTabs=this.tabStore.getTabs().length>0;if(this.layout.setOpen(hasTabs),hasTabs){this.ensureListFrame(),this.ensureFrames(),active&&this.activateFrame(active,"primary");let secondaryActive=this.tabStore.getSecondaryActive();secondaryActive&&(this.layout.setSecondaryOpen(!0),this.ensureSecondaryFrames(),this.activateFrame(secondaryActive,"secondary"))}}persistPaneSizes(paneSizes){this.settings=normalizeSettings({...this.settings,paneSizes}),saveSettings(this.storage,this.settings),this.tabStore.setSessionFields({paneSizes:this.settings.paneSizes},Date.now(),!1),saveSession(this.storage,this.tabStore.getSession()),this.settingsPanel?.setSettings(this.settings)}scheduleTopicTracking(topicId,url){let key=topicId;if(this.trackedTopicKey===key)return;this.clearTopicTrackSchedule(),this.trackedTopicKey=key;let info=getTopicInfo(url);if(!info)return;let tracker=createBrowserViewTracker();this.topicTrackTimers=[2500,1e4].map(delay=>window.setTimeout(()=>{tracker.track(info,"browser-open",document.referrer)},delay))}clearTopicTrackSchedule(){for(let timer of this.topicTrackTimers)window.clearTimeout(timer);this.topicTrackTimers=[],this.trackedTopicKey=""}activateFrame(tab,pane){let pool=pane==="secondary"?this.secondaryFrames:this.frames;if(!tab||!pool)return;pool.activate(tab,Date.now());let empty=(pane==="secondary"?this.layout.getSecondaryContentElement():this.layout.getContentElement())?.querySelector(".ldu-topic-empty");empty&&(empty.hidden=!0)}handleFrameMessage(message,iframe,pane){let tab=this.tabStore.getTabs().find(candidate=>candidate.id===message.tabId);if(!tab)return!1;if(message.type==="ldu:frame-interaction")return document.body.dispatchEvent(new MouseEvent("pointerdown",{bubbles:!0,cancelable:!0,button:0})),!0;if(message.type==="ldu:bookmark-result")return this.showActionToast(message.message||(message.ok?"\u5DF2\u6DFB\u52A0\u5230\u4E66\u7B7E":"\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"),message.ok===!1),!0;if(message.type==="ldu:list-navigate"&&message.url)return this.navigateList(message.url);if(message.type==="ldu:preview-open")return this.preview.openFromFrame(message.url??"",iframe,message.anchorRect),!0;if(message.type==="ldu:preview-dismiss")return this.preview.close(),!0;if(message.type==="ldu:topic-open"){let info2=message.url?getTopicInfo(message.url,location.href):null;return!info2||!isSupportedTopicTarget(info2.url.href,tab.url)?!1:this.openTopic(info2.topicId,info2.url.href,message.title||`\u4E3B\u9898 ${info2.topicId}`,info2.postNumber,void 0,pane)}let info=message.url?getTopicInfo(message.url):null,sameTopic=info?.topicId===tab.topicId,categoryChanged=!!(message.categoryName&&message.categoryColor&&(message.categoryName!==tab.categoryName||message.categoryColor!==tab.categoryColor)),patch={...message.url?{url:message.url}:{},...message.title?{title:message.title}:{},...message.categoryName&&message.categoryColor?{categoryName:message.categoryName,categoryColor:message.categoryColor}:{},...typeof message.scrollY=="number"?{scrollY:message.scrollY}:{},...info?.postNumber?{postNumber:info.postNumber}:{},suspended:!1};return this.tabStore.update(tab.id,patch,Date.now(),message.type==="ldu:frame-ready"||!!(message.title&&!sameTopic)||categoryChanged),message.type==="ldu:frame-state"&&this.schedulePersist(),!0}renderTabs(){let root=this.layout?.getTabStripElement();if(!root||!this.tabStore)return;let primaryTabs=this.tabStore.getPrimaryTabs(),secondaryTabs=this.tabStore.getSecondaryTabs();this.layout.setSecondaryOpen(secondaryTabs.length>0),secondaryTabs.length>0?this.ensureSecondaryFrames():this.secondaryFrames&&(this.secondaryFrames.destroy(),this.secondaryFrames=null),renderTabStrip(root,primaryTabs,this.tabStore.getSession().activeTabId,{onActivate:tabId=>{let tab=this.tabStore.activate(tabId,Date.now());tab&&this.activateFrame(tab,"primary")},onClose:tabId=>this.closeTab(tabId,"primary"),onContextMenu:(tabId,x,y)=>this.tabContextMenu.open(tabId,x,y),onReorder:(tabId,targetTabId,position)=>{this.tabStore.reorderInPane(tabId,targetTabId,position,Date.now())}},{colorizeTabs:this.settings.colorizeTabs});let secondaryRoot=this.layout.getSecondaryTabStripElement();secondaryRoot&&renderTabStrip(secondaryRoot,secondaryTabs,this.tabStore.getSession().secondaryActiveTabId,{onActivate:tabId=>{let tab=this.tabStore.activateSecondary(tabId,Date.now());tab&&this.activateFrame(tab,"secondary")},onClose:tabId=>this.closeTab(tabId,"secondary"),onContextMenu:(tabId,x,y)=>this.tabContextMenu.open(tabId,x,y,!0),onReorder:(tabId,targetTabId,position)=>{this.tabStore.reorderInPane(tabId,targetTabId,position,Date.now())}},{colorizeTabs:this.settings.colorizeTabs});let actions=this.layout.getActionsElement();if(actions&&!actions.querySelector(".ldu-close-all")){let close=document.createElement("button");close.type="button",close.className="ldu-icon-button ldu-close-all",setIcon(close,"close",18),close.title="\u5173\u95ED\u6240\u6709\u5E16\u5B50\u6807\u7B7E",close.setAttribute("aria-label","\u5173\u95ED\u6240\u6709\u5E16\u5B50\u6807\u7B7E"),close.addEventListener("click",()=>{for(let tab of this.tabStore.getTabs())this.frames?.remove(tab.id),this.secondaryFrames?.remove(tab.id);this.tabStore.clear(Date.now()),this.disposeSplitRuntime()}),actions.append(close)}let secondaryActions=this.layout.getSecondaryActionsElement();if(secondaryActions&&!secondaryActions.querySelector(".ldu-close-secondary")){let close=document.createElement("button");close.type="button",close.className="ldu-icon-button ldu-close-secondary",setIcon(close,"close",18),close.title="\u5173\u95ED\u7B2C\u4E8C\u9605\u8BFB\u533A",close.setAttribute("aria-label","\u5173\u95ED\u7B2C\u4E8C\u9605\u8BFB\u533A\u5E76\u5C06\u6807\u7B7E\u79FB\u56DE\u4E3B\u9605\u8BFB\u533A"),close.addEventListener("click",()=>this.closeSecondaryPanel()),secondaryActions.append(close)}let empty=this.layout.getContentElement()?.querySelector(".ldu-topic-empty");empty&&(empty.hidden=primaryTabs.length>0);let secondaryEmpty=this.layout.getSecondaryContentElement()?.querySelector(".ldu-topic-empty");secondaryEmpty&&(secondaryEmpty.hidden=secondaryTabs.length>0);let active=this.tabStore.getActive();active&&this.activateFrame(active,"primary");let secondaryActive=this.tabStore.getSecondaryActive();secondaryActive&&this.activateFrame(secondaryActive,"secondary")}closeTab(tabId,pane){if((pane==="secondary"?this.secondaryFrames:this.frames)?.remove(tabId),this.tabStore.close(tabId,Date.now()),this.tabStore.getTabs().length===0){this.disposeSplitRuntime();return}this.tabStore.getPrimaryTabs().length===0&&this.tabStore.getSecondaryTabs().length>0&&this.closeSecondaryPanel()}moveTabToSecondary(tabId){if(this.tabStore.getSession().secondaryTabIds.includes(tabId)||!this.captureLiveFrameState(tabId,this.frames)||!this.layout.mount())return;let transfer=this.frames?.detach(tabId)??null;this.layout.setSecondaryOpen(!0),this.ensureSecondaryFrames();let moved=this.tabStore.moveToSecondary(tabId,Date.now(),!1);moved&&(transfer&&this.secondaryFrames&&this.secondaryFrames.adopt(moved,transfer,Date.now()),saveSession(this.storage,this.tabStore.getSession()),this.renderTabs())}closeSecondaryPanel(){let transfers=this.tabStore.getSecondaryTabs().flatMap(tab=>{let current=this.captureLiveFrameState(tab.id,this.secondaryFrames)??tab,transfer=this.secondaryFrames?.detach(tab.id);return transfer?[{tab:current,transfer}]:[]});this.tabStore.mergeSecondaryIntoPrimary(Date.now(),!1);for(let{tab,transfer}of transfers)this.frames?.adopt(tab,transfer,Date.now());saveSession(this.storage,this.tabStore.getSession()),this.renderTabs()}openTabInBrowser(tabId){let tab=this.tabStore.getTabs().find(candidate=>candidate.id===tabId);if(!tab)return;let anchor=document.createElement("a");anchor.href=tab.url,anchor.target="_blank",anchor.rel="noopener noreferrer",anchor.click()}reloadTab(tabId){let secondary=this.tabStore.getSession().secondaryTabIds.includes(tabId);this.captureLiveFrameState(tabId,secondary?this.secondaryFrames:this.frames);let tab=secondary?this.tabStore.activateSecondary(tabId,Date.now()):this.tabStore.activate(tabId,Date.now());if(!tab)return;let pool=secondary?this.secondaryFrames:this.frames;this.activateFrame(tab,secondary?"secondary":"primary"),pool?.reload(tabId)}async copyTabLink(tabId){let tab=this.tabStore.getTabs().find(candidate=>candidate.id===tabId);if(tab)try{await navigator.clipboard.writeText(tab.url);return}catch{let textarea=document.createElement("textarea");textarea.value=tab.url,textarea.style.position="fixed",textarea.style.opacity="0",document.body.append(textarea),textarea.select(),document.execCommand("copy"),textarea.remove()}}bookmarkTab(tabId){let secondary=this.tabStore.getSession().secondaryTabIds.includes(tabId),tab=secondary?this.tabStore.activateSecondary(tabId,Date.now()):this.tabStore.activate(tabId,Date.now());tab&&(this.activateFrame(tab,secondary?"secondary":"primary"),(secondary?this.secondaryFrames:this.frames)?.sendCommand(tabId,{type:"ldu:bookmark",topicId:tab.topicId}))}closeOtherTabs(tabId){let secondary=this.tabStore.getSession().secondaryTabIds.includes(tabId),paneTabs=secondary?this.tabStore.getSecondaryTabs():this.tabStore.getPrimaryTabs();for(let tab of paneTabs)tab.id!==tabId&&(secondary?this.secondaryFrames:this.frames)?.remove(tab.id);this.tabStore.closeOthersInPane(tabId,Date.now())}persistSession(){let active=this.tabStore?.getActive();active&&this.frames&&this.captureLiveFrameState(active.id,this.frames);let secondaryActive=this.tabStore?.getSecondaryActive();secondaryActive&&this.secondaryFrames&&this.captureLiveFrameState(secondaryActive.id,this.secondaryFrames),this.tabStore&&saveSession(this.storage,this.tabStore.getSession())}captureLiveFrameState(tabId,pool){let tab=this.tabStore.getTabs().find(candidate=>candidate.id===tabId)??null,iframe=pool?.getFrame(tabId);if(!tab||!iframe?.contentWindow)return tab;let url=tab.url,title=tab.title,scrollY=tab.scrollY;try{let currentUrl=iframe.contentWindow.location.href;getTopicInfo(currentUrl,tab.url)?.topicId===tab.topicId&&(url=currentUrl);let currentTitle=iframe.contentDocument?.title?.trim();currentTitle&&(title=currentTitle),scrollY=iframe.contentWindow.scrollY}catch{return tab}let info=getTopicInfo(url,tab.url);return this.tabStore.update(tabId,{url,title,scrollY,...info?.postNumber?{postNumber:info.postNumber}:{},suspended:!1},Date.now(),!1),this.tabStore.getTabs().find(candidate=>candidate.id===tabId)??tab}showActionToast(message,isError){document.querySelector(".ldu-action-toast")?.remove();let toast=document.createElement("div");toast.className=`ldu-action-toast${isError?" is-error":""}`,toast.setAttribute("role",isError?"alert":"status"),toast.textContent=message,document.body.append(toast),window.setTimeout(()=>toast.remove(),2800)}disposeSplitRuntime(){this.preview?.close(),this.frames?.destroy(),this.frames=null,this.secondaryFrames?.destroy(),this.secondaryFrames=null,this.tabContextMenu?.close(),this.listFrame?.destroy(),this.listFrame=null,this.layout?.destroy()}handlePageHide(event){this.persistSession(),!event.persisted&&(this.settings.restoreSession&&this.tabStore?.getTabs().length>0&&stageSessionClose(this.storage,this.tabStore.getSession()),this.leaseTimer!==null&&window.clearInterval(this.leaseTimer),this.sessionMaintenanceTimer!==null&&window.clearInterval(this.sessionMaintenanceTimer),this.leaseTimer=null,this.sessionMaintenanceTimer=null,releaseSessionLease(this.storage,this.sessionLease))}schedulePersist(){this.persistTimer!==null&&window.clearTimeout(this.persistTimer),this.persistTimer=window.setTimeout(()=>{this.persistTimer=null,this.persistSession()},500)}};function boot(){return window.__linuxDoUltimateLoaded?!1:(window.__linuxDoUltimateLoaded=!0,!0)}function reconcileRefreshAtDocumentStart(){try{let sessionId=window.sessionStorage.getItem(SESSION_ID_KEY);sessionId&&reconcileSessionClose(new UserscriptStorage,sessionId)}catch{}}function prepareSplitBootMask(){try{let sessionId=window.sessionStorage.getItem(SESSION_ID_KEY);if(!sessionId)return;let storage=new UserscriptStorage,settings=loadSettings(storage),session=loadSessionIfPresent(storage,sessionId,location.href,Date.now());if(!settings.enabled||!settings.tabsEnabled||!session?.tabs.length)return;document.documentElement.classList.add("ldu-split-booting");let style=document.createElement("style");style.id="linuxdo-ultimate-boot-style",style.textContent="html.ldu-split-booting #main-container{visibility:hidden!important}",document.documentElement.append(style)}catch{}}typeof window<"u"&&window.self===window.top&&boot()&&(reconcileRefreshAtDocumentStart(),prepareSplitBootMask(),startLinuxDoApp());})();
