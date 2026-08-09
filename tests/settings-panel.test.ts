// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../src/core/defaults";
import { SettingsPanel } from "../src/ui/settings-panel";

describe("settings panel", () => {
  it("uses the requested hierarchy, labels, and conditional controls", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const panel = new SettingsPanel(host, DEFAULT_SETTINGS, { onChange: vi.fn() });
    panel.mount();

    expect(host.querySelector(".ldu-settings-heading")?.textContent).toContain("Linux Do Ultimate");
    expect(host.querySelector(".ldu-brand-ultimate")?.textContent).toBe("Ultimate");
    expect(host.querySelector(".ldu-settings-version")?.textContent).toMatch(/^v\d+\.\d+\.\d+$/);
    expect([...host.querySelectorAll(".ldu-settings-group-title")].map((node) => node.textContent)).toEqual([
      "布局",
      "阅读与标签",
      "页面样式",
      "实用工具",
    ]);
    expect(host.querySelector('[data-setting="enabled"]')).toBeNull();
    expect(host.querySelector('[data-setting="tabsEnabled"]')?.closest("label")?.textContent).toContain("启用分屏模式");
    expect(host.querySelector('[data-setting="tabsEnabled"]')?.closest("label")?.querySelector(".dc-item-desc")?.textContent)
      .toContain("并排浏览帖子列表与正文");
    expect(host.querySelector('[data-setting="tabsEnabled"]')?.closest("section")?.querySelector(".ldu-settings-group-title")?.textContent).toBe("布局");
    expect(host.querySelector('[data-setting="restoreSession"]')?.closest("label")?.textContent).toContain("恢复上次帖子");
    expect(host.querySelector('[data-setting="hidePosters"]')).toBeNull();
    expect(host.querySelector('[data-setting="ownerOnlyEnabled"]')?.closest("label")?.textContent).toContain("只看楼主");
    expect(host.querySelector('[data-setting="cleanModeEnabled"]')?.closest("label")?.textContent).toContain("清爽模式");
    expect(host.querySelector('[data-setting="cleanModeEnabled"]')?.closest("label")?.textContent).toContain("隐藏列表头像、公告、分类徽章和标签");
    expect(host.querySelector('[data-setting="lowEndOptimizationEnabled"]')?.closest("label")?.textContent).toContain("低端设备性能优化");
    expect(host.querySelector('[data-setting="colorizeTabs"]')?.closest("label")?.textContent).toContain("标签分类上色");
    expect(host.querySelector('[data-pills-setting="tabPresentation"]')?.closest(".dc-row")?.textContent).toContain("标签栏样式");
    expect(host.querySelector('[data-setting="creditEnabled"]')?.closest("label")?.textContent).toContain("LDC 收入");
    expect(host.querySelector(".dc-child-row")).toBeNull();
    expect(host.querySelector('[data-pills-setting="tabPresentation"]')?.closest(".dc-row")?.querySelector(".dc-item-desc")).toBeNull();
    expect(host.querySelector('[data-setting="colorizeTabs"]')?.closest("label")?.querySelector(".dc-item-desc")).toBeNull();
    expect(host.querySelector('[data-pills-setting="previewClickMode"]')?.closest(".dc-row")?.querySelector(".dc-item-desc")).toBeNull();
    expect(host.querySelector('[data-setting="creditEnabled"]')?.closest("label")?.querySelector(".dc-item-desc")).toBeNull();

    const layoutRow = host.querySelector<HTMLElement>('[data-depends-on="tabsEnabled"]')!;
    const previewRow = host.querySelector<HTMLElement>('[data-depends-on="previewEnabled"]')!;
    const risk = host.querySelector<HTMLElement>('.ldu-settings-risk')!;
    expect(layoutRow.hidden).toBe(false);
    expect(previewRow.hidden).toBe(true);
    expect(host.querySelector('[data-setting="previewSameOrigin"]')).toBeNull();
    expect(risk.hidden).toBe(true);

    const split = host.querySelector<HTMLInputElement>('[data-setting="tabsEnabled"]')!;
    const colorizeTabsRow = host.querySelector<HTMLElement>('[data-setting="colorizeTabs"]')!.closest("label")!;
    const autoCollapseRow = host.querySelector<HTMLElement>('[data-setting="verticalTabsAutoCollapse"]')!.closest("label")!;
    expect(colorizeTabsRow.hidden).toBe(false);
    expect(autoCollapseRow.hidden).toBe(true);
    host.querySelector<HTMLButtonElement>('[data-pills-setting="tabPresentation"] [data-val="vertical"]')!.click();
    expect(autoCollapseRow.hidden).toBe(false);
    split.checked = false;
    split.dispatchEvent(new Event("change", { bubbles: true }));
    expect(layoutRow.hidden).toBe(true);
    expect(colorizeTabsRow.hidden).toBe(true);
    expect(autoCollapseRow.hidden).toBe(true);

    const preview = host.querySelector<HTMLInputElement>('[data-setting="previewEnabled"]')!;
    preview.checked = true;
    preview.dispatchEvent(new Event("change", { bubbles: true }));
    expect(previewRow.hidden).toBe(false);
    expect(risk.hidden).toBe(false);
    expect(risk.textContent).toContain("运行目标网站脚本");
    preview.checked = false;
    preview.dispatchEvent(new Event("change", { bubbles: true }));
    expect(risk.hidden).toBe(true);
  });

  it("names layout choices by topic-detail position and keeps the live count inline", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const panel = new SettingsPanel(host, DEFAULT_SETTINGS, { onChange: vi.fn() });
    panel.mount();

    const layout = host.querySelector<HTMLElement>('[data-pills-setting="layoutPreference"]')!;
    expect(layout.closest(".dc-row")?.textContent).toContain("详情页位置");
    expect([...layout.querySelectorAll<HTMLButtonElement>(".dc-pill-btn")].map((button) => [button.dataset.val, button.textContent])).toEqual([
      ["auto", "自动"],
      ["two", "右侧"],
      ["three", "中间"],
    ]);
    const live = host.querySelector<HTMLInputElement>('[data-setting="maxLiveFrames"]')!;
    expect(live.max).toBe("10");
    expect(live.closest(".ldu-settings-range-control")).not.toBeNull();
    expect(host.querySelector<HTMLInputElement>('[data-setting="creditEnabled"]')?.checked).toBe(true);
    expect(host.querySelector(".dc-modal")).not.toBeNull();
    expect(host.querySelector(".dc-item-desc.alert")?.textContent).toContain("运行目标网站脚本");
    expect(host.querySelectorAll(".dc-label-box").length).toBe(14);
  });

  it("provides repository and three explicit LDC donation destinations", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const panel = new SettingsPanel(host, DEFAULT_SETTINGS, { onChange: vi.fn() });
    panel.mount();

    const github = host.querySelector<HTMLAnchorElement>(".ldu-settings-github")!;
    expect(github.href).toBe("https://github.com/jzcangshu/linuxdo-ultimate");
    expect(github.target).toBe("_blank");
    expect(github.rel).toContain("noopener");
    const donate = host.querySelector<HTMLButtonElement>(".ldu-settings-donate")!;
    const menu = host.querySelector<HTMLElement>(".ldu-donate-menu")!;
    expect(menu.hidden).toBe(true);
    donate.click();
    expect(donate.getAttribute("aria-expanded")).toBe("true");
    expect(menu.hidden).toBe(false);
    expect([...menu.querySelectorAll<HTMLAnchorElement>("a")].map((link) => [link.textContent, link.href])).toEqual([
      ["1 LDC", "https://credit.linux.do/paying/online?token=87d0a248e696e18399f2458fcfec6b3c889059feedfbacb500af59382fe5416d"],
      ["5 LDC", "https://credit.linux.do/paying/online?token=06325a8a0293c81624c065fd8922f6ed591beac0c95c1ac122463d1b4bf78be8"],
      ["10 LDC", "https://credit.linux.do/paying/online?token=783190ffe634374e940ad558140c583942c8e4c13c89bc09782596b07bd63bb3"],
    ]);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(menu.hidden).toBe(true);
  });

  it("checks for updates before the existing footer actions and highlights both entry points", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const onCheckUpdates = vi.fn();
    const panel = new SettingsPanel(host, DEFAULT_SETTINGS, { onChange: vi.fn(), onCheckUpdates });
    panel.mount();

    const update = host.querySelector<HTMLButtonElement>(".ldu-settings-update")!;
    const github = host.querySelector<HTMLElement>(".ldu-settings-github")!;
    expect(update.compareDocumentPosition(github) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    update.click();
    expect(onCheckUpdates).toHaveBeenCalledOnce();

    panel.setUpdateState({
      status: "available",
      manifest: {
        schemaVersion: 1,
        version: "0.4.2",
        publishedAt: "2026-08-08",
        releaseUrl: "https://github.com/jzcangshu/linuxdo-ultimate/releases/tag/v0.4.2",
        changelog: ["新增检查更新。"],
      },
    }, true);
    expect(update.classList).toContain("ldu-update-available");
    expect(host.querySelector(".ldu-icon-button")?.classList).toContain("ldu-update-available");
    expect(host.querySelector<HTMLElement>(".ldu-update-menu")?.hidden).toBe(false);
    expect(host.querySelector(".ldu-update-summary")?.textContent).toContain("新增检查更新");
    expect(host.querySelector(".ldu-update-title")?.textContent).toBe("发现新版本");
    expect(host.querySelector(".ldu-update-version")?.textContent).toBe("v0.4.2");
    expect(host.querySelector(".ldu-update-date")?.textContent).toBe("发布于 2026-08-08");
    expect(host.querySelectorAll(".ldu-update-changelog li")).toHaveLength(1);

    panel.setUpdateState({ status: "current", version: "0.4.2" });
    expect(update.classList).not.toContain("ldu-update-available");
    expect(host.querySelector(".ldu-icon-button")?.classList).not.toContain("ldu-update-available");
  });
});
