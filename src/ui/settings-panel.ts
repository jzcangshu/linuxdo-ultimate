import type { Settings } from "../core/types";
import { DEFAULT_SETTINGS } from "../core/defaults";
import { iconSvg, setIcon } from "./icons";
import { getCurrentVersion, type UpdateResult } from "../core/update-checker";

type SettingsPatch = Partial<Omit<Settings, "schemaVersion">>;

interface SettingsPanelCallbacks {
  onChange: (patch: SettingsPatch) => void;
  onCheckUpdates?: () => void | Promise<void>;
}

export class SettingsPanel {
  private panel: HTMLElement | null = null;
  private toggleButton: HTMLButtonElement | null = null;
  private updateStatusTimer: number | null = null;

  constructor(
    private readonly host: HTMLElement,
    private settings: Settings,
    private readonly callbacks: SettingsPanelCallbacks,
  ) {}

  mount(): void {
    if (this.panel) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ldu-icon-button btn-flat no-text";
    setIcon(button, "settings", 20);
    button.title = "布局与功能设置";
    button.setAttribute("aria-label", "布局与功能设置");
    button.setAttribute("aria-controls", "ldu-settings-panel");
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      if (!this.panel) return;
      this.setPanelOpen(this.panel.hidden);
    });
    this.toggleButton = button;
    this.host.append(button);

    const panel = document.createElement("div");
    panel.id = "ldu-settings-panel";
    panel.className = "ldu-settings-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "布局与功能设置");
    panel.innerHTML = `
      <div class="dc-modal">
        <header class="dc-header">
          <h2 class="ldu-settings-heading">Linux Do <span class="ldu-brand-ultimate">Ultimate</span><span class="ldu-settings-version">v${getCurrentVersion()}</span></h2>
          <button type="button" class="dc-close-btn ldu-settings-close" title="关闭" aria-label="关闭设置">${iconSvg("close", 16)}</button>
        </header>
        <div class="dc-body">
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-layout-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-layout-heading">布局</div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">启用分屏模式</span>
                <span class="dc-item-desc">在当前页面并排浏览帖子列表与正文</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="tabsEnabled"><span class="dc-slider"></span></span>
            </label>
            <div class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">详情页位置</span>
                <span class="dc-item-desc">“自动”会根据窗口宽度选择</span>
              </span>
              <div class="dc-pills" data-pills-setting="layoutPreference">
                <button type="button" class="dc-pill-btn" data-val="auto">自动</button>
                <button type="button" class="dc-pill-btn" data-val="two">右侧</button>
                <button type="button" class="dc-pill-btn" data-val="three">中间</button>
              </div>
            </div>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-reading-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-reading-heading">阅读与标签</div>
            <div class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">标签栏样式</span>
              </span>
              <div class="dc-pills" data-pills-setting="tabPresentation">
                <button type="button" class="dc-pill-btn" data-val="horizontal">横向</button>
                <button type="button" class="dc-pill-btn" data-val="vertical">垂直</button>
              </div>
            </div>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled" data-requires-setting="tabPresentation" data-requires-value="vertical">
              <span class="dc-label-box">
                <span class="dc-item-title">自动收起</span>
                <span class="dc-item-desc">移开鼠标后收起为图标栏</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="verticalTabsAutoCollapse"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled" data-requires-setting="tabPresentation" data-requires-value="vertical">
              <span class="dc-label-box">
                <span class="dc-item-title">按分区分组</span>
                <span class="dc-item-desc">按帖子主分类整理垂直标签</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="groupVerticalTabs"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">恢复上次帖子</span>
                <span class="dc-item-desc">下次访问时恢复最后关闭的浏览器标签页会话</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="restoreSession"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">只看楼主</span>
                <span class="dc-item-desc">在帖子页显示切换按钮并按主题记住状态</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="ownerOnlyEnabled"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">标签分类上色</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="colorizeTabs"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="tabsEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">活动页面上限</span>
                <span class="dc-item-desc">限制同时保留在内存中的帖子页面数量</span>
              </span>
              <span class="dc-range-group ldu-settings-range-control"><input type="range" class="dc-range" data-setting="maxLiveFrames" min="1" max="10" step="1"><output class="dc-range-number" data-output="maxLiveFrames"></output></span>
            </label>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-style-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-style-heading">页面样式</div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">清爽模式</span>
                <span class="dc-item-desc">隐藏列表头像、公告、分类徽章和标签</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="cleanModeEnabled"><span class="dc-slider"></span></span>
            </label>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">低端设备性能优化</span>
                <span class="dc-item-desc">减少动画和过渡效果，降低设备负担</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="lowEndOptimizationEnabled"><span class="dc-slider"></span></span>
            </label>
          </section>
          <section class="dc-group ldu-settings-group" aria-labelledby="ldu-settings-tools-heading">
            <div class="dc-group-title ldu-settings-group-title" id="ldu-settings-tools-heading">实用工具</div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">链接悬浮预览</span>
                <span class="dc-item-desc alert ldu-settings-risk" data-depends-on="previewEnabled" role="note">预览页面会运行目标网站脚本，请只预览可信链接。</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="previewEnabled"><span class="dc-slider"></span></span>
            </label>
            <div class="dc-row dc-dependent-row ldu-settings-control" data-depends-on="previewEnabled">
              <span class="dc-label-box">
                <span class="dc-item-title">触发方式</span>
              </span>
              <div class="dc-pills" data-pills-setting="previewClickMode">
                <button type="button" class="dc-pill-btn" data-val="double">双击</button>
                <button type="button" class="dc-pill-btn" data-val="single">单击</button>
              </div>
            </div>
            <label class="dc-row ldu-settings-control">
              <span class="dc-label-box">
                <span class="dc-item-title">在顶部显示 LDC 收入</span>
              </span>
              <span class="dc-switch"><input type="checkbox" data-setting="creditEnabled"><span class="dc-slider"></span></span>
            </label>
          </section>
        </div>
        <footer class="dc-footer ldu-settings-footer">
          <button type="button" class="dc-btn dc-btn-ghost ldu-settings-reset">恢复默认设置</button>
          <div class="dc-footer-right ldu-settings-actions">
            <div class="ldu-update-wrap">
              <button type="button" class="dc-btn ldu-settings-action ldu-settings-update" aria-expanded="false" aria-controls="ldu-update-menu">${iconSvg("refresh", 14)}检查更新</button>
              <div class="dc-dropdown-menu ldu-update-menu" id="ldu-update-menu" role="status" aria-live="polite" hidden>
                <div class="ldu-update-summary"></div>
                <a class="dc-dropdown-item ldu-update-link" href="#" target="_blank" rel="noopener noreferrer">查看新版并下载</a>
              </div>
            </div>
            <a class="dc-btn ldu-settings-action ldu-settings-github" href="https://github.com/jzcangshu/linuxdo-ultimate" target="_blank" rel="noopener noreferrer">${iconSvg("github", 14)}Github</a>
            <div class="ldu-donate-wrap">
              <button type="button" class="dc-btn ldu-settings-action ldu-settings-donate" aria-expanded="false" aria-controls="ldu-donate-menu">${iconSvg("gift", 14)}LDC 捐赠</button>
              <div class="dc-dropdown-menu ldu-donate-menu" id="ldu-donate-menu" role="menu" aria-label="选择LDC捐赠额度" hidden>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=87d0a248e696e18399f2458fcfec6b3c889059feedfbacb500af59382fe5416d" target="_blank" rel="noopener noreferrer">1 LDC</a>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=06325a8a0293c81624c065fd8922f6ed591beac0c95c1ac122463d1b4bf78be8" target="_blank" rel="noopener noreferrer">5 LDC</a>
                <a class="dc-dropdown-item" role="menuitem" href="https://credit.linux.do/paying/online?token=783190ffe634374e940ad558140c583942c8e4c13c89bc09782596b07bd63bb3" target="_blank" rel="noopener noreferrer">10 LDC</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    `;
    this.panel = panel;
    this.host.append(panel);
    this.sync();
    panel.querySelectorAll<HTMLElement>("[data-setting]").forEach((control) => {
      control.addEventListener("change", () => this.readControl(control));
      control.addEventListener("input", () => this.readControl(control));
    });
    panel.querySelectorAll<HTMLButtonElement>("[data-pills-setting] .dc-pill-btn").forEach((button) => {
      button.addEventListener("click", () => this.readPill(button));
    });
    panel.querySelector<HTMLButtonElement>(".ldu-settings-close")?.addEventListener("click", () => this.setPanelOpen(false));
    panel.querySelector<HTMLButtonElement>(".ldu-settings-reset")?.addEventListener("click", () => {
      if (!window.confirm("确定要恢复全部默认设置吗？")) return;
      this.settings = structuredClone(DEFAULT_SETTINGS);
      this.sync();
      this.callbacks.onChange({ ...this.settings });
    });
    panel.querySelector<HTMLButtonElement>(".ldu-settings-donate")?.addEventListener("click", () => {
      const menu = panel.querySelector<HTMLElement>(".ldu-donate-menu");
      this.setDonationMenuOpen(Boolean(menu?.hidden));
    });
    panel.querySelector<HTMLButtonElement>(".ldu-settings-update")?.addEventListener("click", () => {
      void this.callbacks.onCheckUpdates?.();
    });
    panel.querySelectorAll<HTMLAnchorElement>(".ldu-donate-menu a").forEach((link) => {
      link.addEventListener("click", () => this.setDonationMenuOpen(false));
    });
    panel.querySelector<HTMLAnchorElement>(".ldu-update-link")?.addEventListener("click", () => {
      this.setUpdateMenuOpen(false);
    });
    document.addEventListener("pointerdown", (event) => {
      if (!this.panel?.hidden && !this.host.contains(event.target as Node)) this.setPanelOpen(false);
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const menu = this.panel?.querySelector<HTMLElement>(".ldu-donate-menu");
      if (menu && !menu.hidden) {
        this.setDonationMenuOpen(false);
      } else if (this.panel?.querySelector<HTMLElement>(".ldu-update-menu")?.hidden === false) {
        this.setUpdateMenuOpen(false);
      } else if (this.panel && !this.panel.hidden) {
        this.setPanelOpen(false);
        this.toggleButton?.focus({ preventScroll: true });
      }
    }, true);
  }

  setSettings(settings: Settings): void {
    this.settings = settings;
    this.sync();
  }

  setUpdateState(result: UpdateResult, showDetails = false): void {
    const button = this.panel?.querySelector<HTMLButtonElement>(".ldu-settings-update");
    const menu = this.panel?.querySelector<HTMLElement>(".ldu-update-menu");
    const summary = this.panel?.querySelector<HTMLElement>(".ldu-update-summary");
    const link = this.panel?.querySelector<HTMLAnchorElement>(".ldu-update-link");
    if (!button || !menu || !summary || !link) return;
    if (this.updateStatusTimer !== null) window.clearTimeout(this.updateStatusTimer);
    button.disabled = result.status === "checking";
    const hasUpdate = result.status === "available";
    button.classList.toggle("ldu-update-available", hasUpdate);
    this.toggleButton?.classList.toggle("ldu-update-available", hasUpdate);
    if (result.status === "checking") {
      this.setUpdateButton(button, "检查中...");
      button.title = "正在检查更新";
      this.setUpdateMenuOpen(false);
      return;
    }
    if (result.status === "available") {
      this.setUpdateButton(button, `发现 v${result.manifest.version}`);
      button.title = `发现新版本 v${result.manifest.version}`;
      summary.replaceChildren();
      const header = document.createElement("div");
      header.className = "ldu-update-header";
      const title = document.createElement("strong");
      title.className = "ldu-update-title";
      title.textContent = "发现新版本";
      const version = document.createElement("span");
      version.className = "ldu-update-version";
      version.textContent = `v${result.manifest.version}`;
      header.append(title, version);
      const publishedAt = document.createElement("time");
      publishedAt.className = "ldu-update-date";
      publishedAt.dateTime = result.manifest.publishedAt;
      publishedAt.textContent = `发布于 ${result.manifest.publishedAt}`;
      const list = document.createElement("ul");
      list.className = "ldu-update-changelog";
      result.manifest.changelog.forEach((item) => {
        const entry = document.createElement("li");
        entry.textContent = item;
        list.append(entry);
      });
      summary.append(header, publishedAt, list);
      link.href = result.manifest.releaseUrl;
      this.setUpdateMenuOpen(showDetails);
      return;
    }
    this.setUpdateButton(button, result.status === "current" ? "已是最新版" : "检查失败");
    button.title = result.status === "error" ? result.message : "当前已是最新版本";
    this.setUpdateMenuOpen(false);
    this.updateStatusTimer = window.setTimeout(() => {
      this.setUpdateButton(button, "检查更新");
      button.title = "检查更新";
    }, 2_500);
  }

  private setUpdateButton(button: HTMLButtonElement, label: string): void {
    button.innerHTML = `${iconSvg("refresh", 14)}${label}`;
  }

  private sync(): void {
    if (!this.panel) return;
    const tabs = this.panel.querySelector<HTMLInputElement>('[data-setting="tabsEnabled"]');
    const verticalTabsAutoCollapse = this.panel.querySelector<HTMLInputElement>('[data-setting="verticalTabsAutoCollapse"]');
    const groupVerticalTabs = this.panel.querySelector<HTMLInputElement>('[data-setting="groupVerticalTabs"]');
    const restore = this.panel.querySelector<HTMLInputElement>('[data-setting="restoreSession"]');
    const ownerOnly = this.panel.querySelector<HTMLInputElement>('[data-setting="ownerOnlyEnabled"]');
    const colorizeTabs = this.panel.querySelector<HTMLInputElement>('[data-setting="colorizeTabs"]');
    const cleanMode = this.panel.querySelector<HTMLInputElement>('[data-setting="cleanModeEnabled"]');
    const lowEndOptimization = this.panel.querySelector<HTMLInputElement>('[data-setting="lowEndOptimizationEnabled"]');
    const preview = this.panel.querySelector<HTMLInputElement>('[data-setting="previewEnabled"]');
    const credit = this.panel.querySelector<HTMLInputElement>('[data-setting="creditEnabled"]');
    const live = this.panel.querySelector<HTMLInputElement>('[data-setting="maxLiveFrames"]');
    const output = this.panel.querySelector<HTMLOutputElement>('[data-output="maxLiveFrames"]');
    if (tabs) tabs.checked = this.settings.tabsEnabled;
    if (verticalTabsAutoCollapse) verticalTabsAutoCollapse.checked = this.settings.verticalTabsAutoCollapse;
    if (groupVerticalTabs) groupVerticalTabs.checked = this.settings.groupVerticalTabs;
    if (restore) restore.checked = this.settings.restoreSession;
    if (ownerOnly) ownerOnly.checked = this.settings.ownerOnlyEnabled;
    if (colorizeTabs) colorizeTabs.checked = this.settings.colorizeTabs;
    if (cleanMode) cleanMode.checked = this.settings.cleanModeEnabled;
    if (lowEndOptimization) lowEndOptimization.checked = this.settings.lowEndOptimizationEnabled;
    if (preview) preview.checked = this.settings.previewEnabled;
    if (credit) credit.checked = this.settings.creditEnabled;
    if (live) live.value = String(this.settings.maxLiveFrames);
    if (output) output.value = String(this.settings.maxLiveFrames);
    this.syncPills("layoutPreference", this.settings.layoutPreference);
    this.syncPills("tabPresentation", this.settings.tabPresentation);
    this.syncPills("previewClickMode", this.settings.previewClickMode);
    this.syncDependencies();
  }

  private readControl(control: HTMLElement): void {
    const key = control.dataset.setting as keyof Settings | undefined;
    if (!key || key === "schemaVersion" || key === "paneSizes" || key === "dualPaneSizes") return;
    let value: Settings[keyof Settings];
    if (control instanceof HTMLInputElement && control.type === "checkbox") value = control.checked;
    else if (control instanceof HTMLInputElement && control.type === "range") value = Number(control.value);
    else if (control instanceof HTMLSelectElement) value = control.value as Settings[keyof Settings];
    else return;
    this.settings = { ...this.settings, [key]: value } as Settings;
    const output = this.panel?.querySelector<HTMLOutputElement>(`[data-output="${key}"]`);
    if (output) output.value = String(value);
    this.syncDependencies();
    this.callbacks.onChange({ [key]: value });
  }

  private readPill(button: HTMLButtonElement): void {
    const group = button.closest<HTMLElement>("[data-pills-setting]");
    const key = group?.dataset.pillsSetting as keyof Settings | undefined;
    const value = button.dataset.val;
    if (!key || !value || key === "schemaVersion" || key === "paneSizes" || key === "dualPaneSizes") return;
    this.settings = { ...this.settings, [key]: value } as Settings;
    this.syncPills(key, value);
    this.syncDependencies();
    this.callbacks.onChange({ [key]: value });
  }

  private syncPills(key: string, value: string): void {
    this.panel?.querySelectorAll<HTMLButtonElement>(`[data-pills-setting="${key}"] .dc-pill-btn`).forEach((button) => {
      const active = button.dataset.val === value;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  private syncDependencies(): void {
    if (!this.panel) return;
    this.panel.querySelectorAll<HTMLElement>("[data-depends-on]").forEach((row) => {
      const key = row.dataset.dependsOn as keyof Settings | undefined;
      const expected = row.dataset.dependsValue;
      const dependencyMatches = Boolean(key) && (expected === undefined
        ? this.settings[key!] === true
        : String(this.settings[key!]) === expected);
      const requiredKey = row.dataset.requiresSetting as keyof Settings | undefined;
      const requiredValue = row.dataset.requiresValue;
      const requirementMatches = !requiredKey || requiredValue === undefined
        || String(this.settings[requiredKey]) === requiredValue;
      row.hidden = !dependencyMatches || !requirementMatches;
    });
  }

  private setPanelOpen(open: boolean): void {
    if (!this.panel) return;
    this.panel.hidden = !open;
    this.toggleButton?.setAttribute("aria-expanded", String(open));
    if (!open) {
      this.setDonationMenuOpen(false);
      this.setUpdateMenuOpen(false);
    }
  }

  private setDonationMenuOpen(open: boolean): void {
    const menu = this.panel?.querySelector<HTMLElement>(".ldu-donate-menu");
    const button = this.panel?.querySelector<HTMLButtonElement>(".ldu-settings-donate");
    if (menu) menu.hidden = !open;
    button?.setAttribute("aria-expanded", String(open));
    if (open) this.setUpdateMenuOpen(false);
  }

  private setUpdateMenuOpen(open: boolean): void {
    const menu = this.panel?.querySelector<HTMLElement>(".ldu-update-menu");
    const button = this.panel?.querySelector<HTMLButtonElement>(".ldu-settings-update");
    if (menu) menu.hidden = !open;
    button?.setAttribute("aria-expanded", String(open));
    if (open) {
      const donationMenu = this.panel?.querySelector<HTMLElement>(".ldu-donate-menu");
      const donationButton = this.panel?.querySelector<HTMLButtonElement>(".ldu-settings-donate");
      if (donationMenu) donationMenu.hidden = true;
      donationButton?.setAttribute("aria-expanded", "false");
    }
  }
}
