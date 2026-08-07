interface CreditWidgetOptions {
  request?: (url: string) => Promise<unknown>;
  isTopLevel?: () => boolean;
  isVisible?: () => boolean;
  now?: () => number;
}

interface CreditUserInfo {
  data?: {
    "community-balance"?: string | number;
    community_balance?: string | number;
    username?: string;
    nickname?: string;
  };
}

interface GamificationInfo {
  user?: { gamification_score?: string | number };
}

const REFRESH_INTERVAL_MS = 300_000;
const SHARED_CACHE_TTL_MS = 60_000;
const SHARED_CACHE_KEY = "linuxdo-ultimate:credit-cache:v1";
const SHARED_REQUEST_LOCK = "linuxdo-ultimate:credit-refresh";

interface CreditSnapshot {
  communityBalance: number;
  gamificationScore: number;
  username: string;
  updatedAt: number;
}

export class CreditWidget {
  private host: HTMLLIElement | null = null;
  private button: HTMLButtonElement | null = null;
  private value: HTMLSpanElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private communityBalance: number | null = null;
  private gamificationScore: number | null = null;
  private username: string | null = null;
  private tooltipContent = "加载中...";
  private timeoutId: number | null = null;
  private inFlight: Promise<void> | null = null;
  private requestGeneration = 0;
  private activeRequestController: AbortController | null = null;
  private mounted = false;
  private enabled = false;

  constructor(private readonly options: CreditWidgetOptions = {}) {}

  mount(enabled: boolean): void {
    if (this.mounted || !(this.options.isTopLevel?.() ?? window.self === window.top)) return;
    this.mounted = true;
    this.createWidget();
    document.addEventListener("visibilitychange", () => this.handleVisibilityChange());
    this.ensureHost();
    this.setEnabled(enabled);
  }

  ensureHost(): void {
    if (!this.host) return;
    const language = document.querySelector<HTMLElement>(".d-header-icons > .language-switcher");
    if (!language) return;
    if (language.nextElementSibling !== this.host) language.after(this.host);
    if (this.enabled) this.startUpdates();
  }

  setEnabled(enabled: boolean): void {
    if (!this.mounted) {
      this.mount(enabled);
      return;
    }
    this.enabled = enabled;
    if (this.host) this.host.hidden = !enabled;
    if (this.tooltip) this.tooltip.hidden = true;
    if (!enabled) {
      this.requestGeneration += 1;
      this.activeRequestController?.abort();
      this.activeRequestController = null;
      this.inFlight = null;
      this.clearSchedule();
      return;
    }
    this.ensureHost();
    if (this.host?.isConnected) this.startUpdates();
  }

  private startUpdates(): void {
    if (!this.enabled || !this.isVisible() || this.inFlight || this.timeoutId !== null) return;
    void this.fetchData(false);
  }

  private createWidget(): void {
    const host = document.createElement("li");
    host.className = "header-dropdown-toggle ldu-credit-host";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn no-text language-switcher-trigger btn-flat ldu-credit-button is-loading";
    button.title = "Credit 积分收入，点击刷新";
    button.setAttribute("aria-label", "Credit 积分收入，点击刷新");
    button.setAttribute("aria-describedby", "ldu-credit-tooltip");
    const value = document.createElement("span");
    value.className = "ldu-credit-value";
    value.setAttribute("aria-live", "polite");
    value.textContent = "···";
    button.append(value);
    host.append(button);

    const tooltip = document.createElement("div");
    tooltip.id = "ldu-credit-tooltip";
    tooltip.className = "ldu-credit-tooltip";
    tooltip.hidden = true;
    tooltip.setAttribute("role", "tooltip");
    document.body.append(tooltip);

    const showTooltip = () => {
      if (!this.enabled) return;
      tooltip.textContent = this.tooltipContent;
      tooltip.hidden = false;
      const rect = button.getBoundingClientRect();
      const left = Math.max(8, Math.min(window.innerWidth - tooltip.offsetWidth - 8, rect.right - tooltip.offsetWidth));
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${rect.bottom + 6}px`;
    };
    const hideTooltip = () => { tooltip.hidden = true; };
    button.addEventListener("mouseenter", showTooltip);
    button.addEventListener("mouseleave", hideTooltip);
    button.addEventListener("focus", showTooltip);
    button.addEventListener("blur", hideTooltip);
    button.addEventListener("click", () => {
      this.setLoading("刷新中...");
      void this.fetchData(true);
    });

    this.host = host;
    this.button = button;
    this.value = value;
    this.tooltip = tooltip;
  }

  private fetchData(force: boolean): Promise<void> {
    if (!this.enabled || !this.isVisible()) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    const generation = ++this.requestGeneration;
    const startedAt = this.now();
    const controller = new AbortController();
    this.activeRequestController = controller;
    const task = (async () => {
      try {
        const cached = !force ? this.readSharedSnapshot() : null;
        const snapshot = cached ?? await this.fetchSnapshotCoordinated(force, startedAt, controller.signal);
        if (!this.enabled || generation !== this.requestGeneration) return;
        this.communityBalance = snapshot.communityBalance;
        this.gamificationScore = snapshot.gamificationScore;
        this.username = snapshot.username;
        if (!cached) this.writeSharedSnapshot(snapshot);
        this.updateDisplay();
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[Linux.do Ultimate] LDC request failed", error);
        if (this.enabled && generation === this.requestGeneration) this.showError();
      }
    })().finally(() => {
      if (this.activeRequestController === controller) this.activeRequestController = null;
      if (this.inFlight === task) this.inFlight = null;
      if (!this.enabled || !this.isVisible()) return;
      if (generation !== this.requestGeneration) this.startUpdates();
      else this.scheduleNext();
    });
    this.inFlight = task;
    return task;
  }

  private async fetchSnapshotCoordinated(force: boolean, startedAt: number, signal: AbortSignal): Promise<CreditSnapshot> {
    const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (!locks) return this.fetchSnapshot(signal);
    return locks.request(SHARED_REQUEST_LOCK, { signal }, async () => {
      const shared = this.readSharedSnapshot();
      if (shared && (!force || shared.updatedAt >= startedAt)) return shared;
      const snapshot = await this.fetchSnapshot(signal);
      this.writeSharedSnapshot(snapshot);
      return snapshot;
    });
  }

  private async fetchSnapshot(signal: AbortSignal): Promise<CreditSnapshot> {
    const credit = await this.request<CreditUserInfo>("https://credit.linux.do/api/v1/oauth/user-info", signal);
    const rawBalance = credit?.data?.["community-balance"] ?? credit?.data?.community_balance;
    const username = credit?.data?.username ?? credit?.data?.nickname;
    const communityBalance = Number.parseFloat(String(rawBalance));
    if (!username || !Number.isFinite(communityBalance)) throw new Error("invalid credit response");
    const data = await this.request<GamificationInfo>(`https://linux.do/u/${encodeURIComponent(username)}.json`, signal);
    const gamificationScore = Number.parseFloat(String(data?.user?.gamification_score));
    if (!Number.isFinite(gamificationScore)) throw new Error("invalid gamification response");
    return { communityBalance, gamificationScore, username, updatedAt: this.now() };
  }

  private scheduleNext(): void {
    this.clearSchedule();
    this.timeoutId = window.setTimeout(() => {
      this.timeoutId = null;
      void this.fetchData(false);
    }, REFRESH_INTERVAL_MS);
  }

  private clearSchedule(): void {
    if (this.timeoutId !== null) window.clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }

  private handleVisibilityChange(): void {
    if (!this.isVisible()) {
      this.clearSchedule();
      return;
    }
    if (this.enabled) this.startUpdates();
  }

  private isVisible(): boolean {
    return this.options.isVisible?.() ?? document.visibilityState !== "hidden";
  }

  private now(): number {
    return this.options.now?.() ?? Date.now();
  }

  private readSharedSnapshot(): CreditSnapshot | null {
    try {
      const raw = localStorage.getItem(SHARED_CACHE_KEY);
      if (raw === null) return null;
      const value = JSON.parse(raw) as Partial<CreditSnapshot> | null;
      if (
        !value
        || this.now() - Number(value.updatedAt) >= SHARED_CACHE_TTL_MS
        || !Number.isFinite(value.communityBalance)
        || !Number.isFinite(value.gamificationScore)
        || typeof value.username !== "string"
      ) {
        this.clearSharedSnapshot();
        return null;
      }
      return value as CreditSnapshot;
    } catch {
      this.clearSharedSnapshot();
      return null;
    }
  }

  private clearSharedSnapshot(): void {
    try { localStorage.removeItem(SHARED_CACHE_KEY); } catch { /* optional cache */ }
  }

  private writeSharedSnapshot(snapshot: CreditSnapshot): void {
    try { localStorage.setItem(SHARED_CACHE_KEY, JSON.stringify(snapshot)); } catch { /* optional cache */ }
  }

  private updateDisplay(): void {
    if (this.communityBalance === null || this.gamificationScore === null || !this.value || !this.button) return;
    const difference = this.gamificationScore - this.communityBalance;
    this.value.textContent = `${difference > 0 ? "+" : ""}${difference.toFixed(2)}`;
    this.button.classList.remove("is-loading", "is-positive", "is-negative", "is-neutral");
    this.button.classList.add(difference > 0 ? "is-positive" : difference < 0 ? "is-negative" : "is-neutral");
    this.tooltipContent = `仅供参考，可能有误差！\n当前分: ${this.gamificationScore.toFixed(2)}\n基准值: ${this.communityBalance.toFixed(2)}`;
  }

  private setLoading(message: string): void {
    if (this.value) this.value.textContent = "···";
    this.button?.classList.remove("is-positive", "is-negative", "is-neutral");
    this.button?.classList.add("is-loading");
    this.tooltipContent = message;
  }

  private showError(): void {
    if (this.value) this.value.textContent = "!";
    this.button?.classList.remove("is-loading", "is-positive", "is-neutral");
    this.button?.classList.add("is-negative");
    this.tooltipContent = "请求失败，请确认已登录";
  }

  private request<T>(url: string, signal: AbortSignal): Promise<T> {
    if (this.options.request) return this.options.request(url) as Promise<T>;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (url.startsWith(location.origin)) {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
      if (csrfToken) headers["x-csrf-token"] = csrfToken;
      return fetch(url, { credentials: "include", headers, signal }).then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<T>;
      }).catch((error) => signal.aborted ? Promise.reject(error) : this.requestWithUserscript<T>(url, headers, signal));
    }
    return this.requestWithUserscript<T>(url, headers, signal);
  }

  private requestWithUserscript<T>(url: string, headers: Record<string, string>, signal: AbortSignal): Promise<T> {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== "function") {
        reject(new Error("GM_xmlhttpRequest is unavailable"));
        return;
      }
      let settled = false;
      let handle: ReturnType<typeof GM_xmlhttpRequest> | null = null;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", abort);
        callback();
      };
      const abort = () => {
        try { handle?.abort(); } catch { /* request is already closing */ }
        finish(() => reject(new DOMException("Aborted", "AbortError")));
      };
      if (signal.aborted) {
        abort();
        return;
      }
      signal.addEventListener("abort", abort, { once: true });
      const request = {
        method: "GET",
        url,
        withCredentials: true,
        headers: { ...headers, Referer: "https://credit.linux.do/home" },
        timeout: 10_000,
        onload: (response) => {
          if (response.status !== 200) {
            finish(() => reject(new Error(String(response.status))));
            return;
          }
          try {
            const value = JSON.parse(response.responseText) as T;
            finish(() => resolve(value));
          } catch (error) {
            finish(() => reject(error));
          }
        },
        onerror: (error) => finish(() => reject(error)),
        ontimeout: () => finish(() => reject(new Error("timeout"))),
      } as Parameters<typeof GM_xmlhttpRequest>[0] & { withCredentials: boolean };
      handle = GM_xmlhttpRequest(request);
    });
  }
}
