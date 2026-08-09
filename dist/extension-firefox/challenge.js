"use strict";
(() => {
  // src/discourse/challenge-bypass.ts
  var ERROR_TEXTS = [
    "403 error",
    "\u8BE5\u54CD\u5E94\u662F\u5F88\u4E45\u4EE5\u524D\u521B\u5EFA\u7684",
    "reaction was created too long ago",
    "\u6211\u4EEC\u65E0\u6CD5\u52A0\u8F7D\u8BE5\u8BDD\u9898",
    "You are not allowed to react"
  ];
  var DIALOG_SELECTOR = ".dialog-body";
  var CHALLENGE_PATH = "/challenge";
  var NOT_FOUND_REDIRECT_GUARD_KEY = "linux_do_auto_challenge_nf_guard";
  var NOT_FOUND_REDIRECT_GUARD_MS = 5e3;
  var MANUAL_MENU_TEXT = "\u624B\u52A8\u89E6\u53D1 Challenge \u8DF3\u8F6C";
  function buildChallengeUrl(currentHref) {
    return `${CHALLENGE_PATH}?redirect=${encodeURIComponent(currentHref)}`;
  }
  function getChallengeReturnTarget(pageHref, origin) {
    try {
      const raw = new URL(pageHref).searchParams.get("redirect");
      if (!raw) return void 0;
      const target = new URL(raw, origin);
      return target.origin === origin ? target.href : void 0;
    } catch {
      return void 0;
    }
  }
  var ChallengeBypassController = class {
    constructor(options) {
      this.options = options;
      this.navigate = options.navigate ?? ((url, mode) => {
        if (mode === "replace") options.window.location.replace(url);
        else options.window.location.assign(url);
      });
      this.now = options.now ?? Date.now;
    }
    observer = null;
    started = false;
    navigate;
    now;
    start() {
      if (this.started) return;
      this.started = true;
      if (this.isChallengePage()) {
        if (this.isNotFoundPage()) this.redirectFromNotFoundPage();
        return;
      }
      if (this.checkAndRedirect()) return;
      const body = this.options.document.body;
      if (!body) return;
      const Observer = this.options.window.MutationObserver;
      const observer = new Observer(() => this.checkAndRedirect());
      this.observer = observer;
      observer.observe(body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    stop() {
      this.observer?.disconnect();
      this.observer = null;
    }
    manualTrigger() {
      if (this.isChallengePage()) {
        this.options.window.alert("\u5DF2\u5728 Challenge \u9875\u9762\uFF0C\u65E0\u9700\u8DF3\u8F6C");
        return false;
      }
      this.redirectToChallenge();
      return true;
    }
    isChallengePage() {
      return this.options.window.location.pathname.startsWith(CHALLENGE_PATH);
    }
    isNotFoundPage() {
      return Boolean(this.options.document.querySelector(".page-not-found"));
    }
    isChallengeFailure() {
      if (this.isChallengePage()) return false;
      const dialog = this.options.document.querySelector(DIALOG_SELECTOR);
      if (!dialog) return false;
      const text = dialog.textContent ?? "";
      return ERROR_TEXTS.some((errorText) => text.includes(errorText));
    }
    checkAndRedirect() {
      if (!this.isChallengeFailure()) return false;
      this.redirectToChallenge();
      return true;
    }
    redirectToChallenge() {
      if (this.isChallengePage()) return;
      this.stop();
      this.navigate(buildChallengeUrl(this.options.window.location.href), "assign");
    }
    redirectFromNotFoundPage() {
      const { location } = this.options.window;
      const fallback = `${location.origin}/`;
      const target = getChallengeReturnTarget(location.href, location.origin) ?? fallback;
      const now = this.now();
      const guardTs = this.getNotFoundRedirectGuardTs();
      if (guardTs && now - guardTs < NOT_FOUND_REDIRECT_GUARD_MS) return;
      this.setNotFoundRedirectGuardTs(now);
      this.navigate(target === location.href ? fallback : target, "replace");
    }
    getGuardKey() {
      const frameName = this.options.window.name;
      return frameName ? `${NOT_FOUND_REDIRECT_GUARD_KEY}:${frameName}` : NOT_FOUND_REDIRECT_GUARD_KEY;
    }
    getNotFoundRedirectGuardTs() {
      try {
        const value = Number(this.options.window.sessionStorage.getItem(this.getGuardKey()) ?? 0);
        return Number.isFinite(value) ? value : 0;
      } catch {
        return 0;
      }
    }
    setNotFoundRedirectGuardTs(timestamp) {
      try {
        this.options.window.sessionStorage.setItem(this.getGuardKey(), String(timestamp));
      } catch {
      }
    }
  };
  function bootChallengeBypass(options = {}) {
    if (window.__linuxDoUltimateChallengeBypass) return window.__linuxDoUltimateChallengeBypass;
    const controller = new ChallengeBypassController({ window, document });
    window.__linuxDoUltimateChallengeBypass = controller;
    const start = () => controller.start();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
    if (options.registerManualCommand && window.self === window.top) {
      try {
        if (typeof GM_registerMenuCommand === "function") {
          GM_registerMenuCommand(MANUAL_MENU_TEXT, () => controller.manualTrigger());
        }
      } catch {
      }
    }
    return controller;
  }

  // src/extension/challenge.ts
  bootChallengeBypass();
})();
