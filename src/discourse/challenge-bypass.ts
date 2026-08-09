const ERROR_TEXTS = [
  "403 error",
  "该响应是很久以前创建的",
  "reaction was created too long ago",
  "我们无法加载该话题",
  "You are not allowed to react",
] as const;

const DIALOG_SELECTOR = ".dialog-body";
const CHALLENGE_PATH = "/challenge";
const NOT_FOUND_REDIRECT_GUARD_KEY = "linux_do_auto_challenge_nf_guard";
const NOT_FOUND_REDIRECT_GUARD_MS = 5_000;
const MANUAL_MENU_TEXT = "手动触发 Challenge 跳转";

type NavigationMode = "assign" | "replace";

interface ChallengeBypassOptions {
  window: Window;
  document: Document;
  navigate?: (url: string, mode: NavigationMode) => void;
  now?: () => number;
}

interface BootChallengeBypassOptions {
  registerManualCommand?: boolean;
}

declare global {
  interface Window {
    __linuxDoUltimateChallengeBypass?: ChallengeBypassController;
  }
}

export function buildChallengeUrl(currentHref: string): string {
  return `${CHALLENGE_PATH}?redirect=${encodeURIComponent(currentHref)}`;
}

export function getChallengeReturnTarget(pageHref: string, origin: string): string | undefined {
  try {
    const raw = new URL(pageHref).searchParams.get("redirect");
    if (!raw) return undefined;
    const target = new URL(raw, origin);
    return target.origin === origin ? target.href : undefined;
  } catch {
    return undefined;
  }
}

export class ChallengeBypassController {
  private observer: MutationObserver | null = null;
  private started = false;
  private readonly navigate: (url: string, mode: NavigationMode) => void;
  private readonly now: () => number;

  constructor(private readonly options: ChallengeBypassOptions) {
    this.navigate = options.navigate ?? ((url, mode) => {
      if (mode === "replace") options.window.location.replace(url);
      else options.window.location.assign(url);
    });
    this.now = options.now ?? Date.now;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    if (this.isChallengePage()) {
      if (this.isNotFoundPage()) this.redirectFromNotFoundPage();
      return;
    }
    if (this.checkAndRedirect()) return;
    const body = this.options.document.body;
    if (!body) return;
    const Observer = (this.options.window as Window & typeof globalThis).MutationObserver;
    const observer = new Observer(() => this.checkAndRedirect());
    this.observer = observer;
    observer.observe(body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  manualTrigger(): boolean {
    if (this.isChallengePage()) {
      this.options.window.alert("已在 Challenge 页面，无需跳转");
      return false;
    }
    this.redirectToChallenge();
    return true;
  }

  private isChallengePage(): boolean {
    return this.options.window.location.pathname.startsWith(CHALLENGE_PATH);
  }

  private isNotFoundPage(): boolean {
    return Boolean(this.options.document.querySelector(".page-not-found"));
  }

  private isChallengeFailure(): boolean {
    if (this.isChallengePage()) return false;
    const dialog = this.options.document.querySelector(DIALOG_SELECTOR);
    if (!dialog) return false;
    const text = dialog.textContent ?? "";
    return ERROR_TEXTS.some((errorText) => text.includes(errorText));
  }

  private checkAndRedirect(): boolean {
    if (!this.isChallengeFailure()) return false;
    this.redirectToChallenge();
    return true;
  }

  private redirectToChallenge(): void {
    if (this.isChallengePage()) return;
    this.stop();
    this.navigate(buildChallengeUrl(this.options.window.location.href), "assign");
  }

  private redirectFromNotFoundPage(): void {
    const { location } = this.options.window;
    const fallback = `${location.origin}/`;
    const target = getChallengeReturnTarget(location.href, location.origin) ?? fallback;
    const now = this.now();
    const guardTs = this.getNotFoundRedirectGuardTs();
    if (guardTs && now - guardTs < NOT_FOUND_REDIRECT_GUARD_MS) return;
    this.setNotFoundRedirectGuardTs(now);
    this.navigate(target === location.href ? fallback : target, "replace");
  }

  private getGuardKey(): string {
    const frameName = this.options.window.name;
    return frameName ? `${NOT_FOUND_REDIRECT_GUARD_KEY}:${frameName}` : NOT_FOUND_REDIRECT_GUARD_KEY;
  }

  private getNotFoundRedirectGuardTs(): number {
    try {
      const value = Number(this.options.window.sessionStorage.getItem(this.getGuardKey()) ?? 0);
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }

  private setNotFoundRedirectGuardTs(timestamp: number): void {
    try {
      this.options.window.sessionStorage.setItem(this.getGuardKey(), String(timestamp));
    } catch {
      // The redirect still works when session storage is unavailable.
    }
  }
}

export function bootChallengeBypass(options: BootChallengeBypassOptions = {}): ChallengeBypassController {
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
      // Extension builds have no userscript menu API.
    }
  }
  return controller;
}
