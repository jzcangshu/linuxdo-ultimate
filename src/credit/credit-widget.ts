interface CreditWidgetOptions {
  request?: (url: string) => Promise<unknown>;
  isTopLevel?: () => boolean;
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

export class CreditWidget {
  private host: HTMLLIElement | null = null;
  private button: HTMLButtonElement | null = null;
  private value: HTMLSpanElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private communityBalance: number | null = null;
  private gamificationScore: number | null = null;
  private username: string | null = null;
  private tooltipContent = "加载中...";
  private intervalId: number | null = null;
  private mounted = false;
  private enabled = false;

  constructor(private readonly options: CreditWidgetOptions = {}) {}

  mount(enabled: boolean): void {
    if (this.mounted || !(this.options.isTopLevel?.() ?? window.self === window.top)) return;
    this.mounted = true;
    this.createWidget();
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
      if (this.intervalId !== null) window.clearInterval(this.intervalId);
      this.intervalId = null;
      return;
    }
    this.ensureHost();
    if (this.host?.isConnected) this.startUpdates();
  }

  private startUpdates(): void {
    if (this.intervalId !== null) return;
    void this.fetchData();
    this.intervalId = window.setInterval(() => void this.fetchData(), REFRESH_INTERVAL_MS);
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
      void this.fetchData();
    });

    this.host = host;
    this.button = button;
    this.value = value;
    this.tooltip = tooltip;
  }

  private async fetchData(): Promise<void> {
    if (!this.enabled) return;
    try {
      const credit = await this.request<CreditUserInfo>("https://credit.linux.do/api/v1/oauth/user-info");
      if (!credit?.data) return;
      this.communityBalance = Number.parseFloat(String(
        credit.data["community-balance"] ?? credit.data.community_balance ?? 0,
      ));
      this.username = credit.data.username ?? credit.data.nickname ?? null;
      this.updateDisplay();
      if (this.username) await this.fetchGamification();
    } catch (error) {
      console.error("[Linux.do Ultimate] Credit request failed", error);
      this.showError();
    }
  }

  private async fetchGamification(): Promise<void> {
    try {
      const data = await this.request<GamificationInfo>(
        `https://linux.do/u/${encodeURIComponent(this.username ?? "")}.json`,
      );
      if (data?.user?.gamification_score === undefined) return;
      this.gamificationScore = Number.parseFloat(String(data.user.gamification_score));
      this.updateDisplay();
    } catch (error) {
      console.error("[Linux.do Ultimate] Gamification request failed", error);
    }
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

  private request<T>(url: string): Promise<T> {
    if (this.options.request) return this.options.request(url) as Promise<T>;
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    const headers = {
      Accept: "application/json",
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
    };
    if (url.startsWith(location.origin)) {
      return fetch(url, { credentials: "include", headers }).then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<T>;
      }).catch(() => this.requestWithUserscript<T>(url, headers));
    }
    return this.requestWithUserscript<T>(url, headers);
  }

  private requestWithUserscript<T>(url: string, headers: Record<string, string>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== "function") {
        reject(new Error("GM_xmlhttpRequest is unavailable"));
        return;
      }
      const request = {
        method: "GET",
        url,
        withCredentials: true,
        headers: { ...headers, Referer: "https://credit.linux.do/home" },
        timeout: 10_000,
        onload: (response) => {
          if (response.status !== 200) {
            reject(new Error(String(response.status)));
            return;
          }
          try { resolve(JSON.parse(response.responseText) as T); } catch (error) { reject(error); }
        },
        onerror: reject,
        ontimeout: () => reject(new Error("timeout")),
      } as Parameters<typeof GM_xmlhttpRequest>[0] & { withCredentials: boolean };
      GM_xmlhttpRequest(request);
    });
  }
}
