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

    expect(host.querySelector(".ldu-icon-button .ldu-symbol-settings")).not.toBeNull();
    expect(host.querySelector(".ldu-settings-close .ldu-symbol-close")).not.toBeNull();
    expect(host.querySelector(".ldu-settings-github .ldu-symbol-github")).not.toBeNull();
    expect(host.querySelector(".ldu-settings-donate .ldu-symbol-gift")).not.toBeNull();
    expect(host.querySelector(".ldu-settings-heading")?.textContent).toBe("Ultimate Linux Do 设置");
    expect([...host.querySelectorAll(".ldu-settings-group-title")].map((node) => node.textContent)).toEqual([
      "布局",
      "阅读与标签",
      "实用工具",
    ]);
    expect(host.querySelector('[data-setting="enabled"]')).toBeNull();
    expect(host.querySelector('[data-setting="tabsEnabled"]')?.closest("label")?.textContent).toContain("启用分屏模式");
    expect(host.querySelector('[data-setting="tabsEnabled"]')?.closest("label")?.querySelector(".dc-item-desc")?.textContent)
      .toContain("分屏阅读和页内帖子标签");
    expect(host.querySelector('[data-setting="tabsEnabled"]')?.closest("section")?.querySelector(".ldu-settings-group-title")?.textContent).toBe("布局");
    expect(host.querySelector('[data-setting="restoreSession"]')?.closest("label")?.textContent).toContain("下次访问时恢复上次打开的帖子");
    expect(host.querySelector('[data-setting="hidePosters"]')?.closest("label")?.textContent).toContain("隐藏话题列表中的用户头像列");
    expect(host.querySelector('[data-setting="colorizeTabs"]')?.closest("label")?.textContent).toContain("按分类为帖子标签上色");
    expect(host.querySelector('[data-setting="creditEnabled"]')?.closest("label")?.textContent).toContain("LDC 收入");

    const layoutRow = host.querySelector<HTMLElement>('[data-depends-on="tabsEnabled"]')!;
    const previewRow = host.querySelector<HTMLElement>('[data-depends-on="previewEnabled"]')!;
    const risk = host.querySelector<HTMLElement>('.ldu-settings-risk')!;
    expect(layoutRow.hidden).toBe(false);
    expect(previewRow.hidden).toBe(true);
    expect(host.querySelector('[data-setting="previewSameOrigin"]')).toBeNull();
    expect(risk.hidden).toBe(true);

    const split = host.querySelector<HTMLInputElement>('[data-setting="tabsEnabled"]')!;
    const colorizeTabsRow = host.querySelector<HTMLElement>('[data-setting="colorizeTabs"]')!.closest("label")!;
    expect(colorizeTabsRow.hidden).toBe(false);
    split.checked = false;
    split.dispatchEvent(new Event("change", { bubbles: true }));
    expect(layoutRow.hidden).toBe(true);
    expect(colorizeTabsRow.hidden).toBe(true);

    const preview = host.querySelector<HTMLInputElement>('[data-setting="previewEnabled"]')!;
    preview.checked = true;
    preview.dispatchEvent(new Event("change", { bubbles: true }));
    expect(previewRow.hidden).toBe(false);
    expect(risk.hidden).toBe(false);
    expect(risk.textContent).toContain("运行目标网站脚本");
    expect(risk.textContent).toContain("Linux Do 同源权限");
    preview.checked = false;
    preview.dispatchEvent(new Event("change", { bubbles: true }));
    expect(risk.hidden).toBe(true);
  });

  it("persists each control once and delays range storage until commit", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const onChange = vi.fn();
    const panel = new SettingsPanel(host, DEFAULT_SETTINGS, { onChange });
    panel.mount();
    const toggle = host.querySelector<HTMLInputElement>('[data-setting="hidePosters"]')!;
    toggle.checked = false;
    toggle.dispatchEvent(new Event("input", { bubbles: true }));
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith({ hidePosters: false });

    onChange.mockClear();
    const range = host.querySelector<HTMLInputElement>('[data-setting="maxLiveFrames"]')!;
    range.value = "8";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    expect(host.querySelector<HTMLOutputElement>('[data-output="maxLiveFrames"]')?.value).toBe("8");
    expect(onChange).not.toHaveBeenCalled();
    range.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({ maxLiveFrames: 8 });
  });

  it("names layout choices by topic-detail position and keeps the live count inline", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const panel = new SettingsPanel(host, DEFAULT_SETTINGS, { onChange: vi.fn() });
    panel.mount();

    const layout = host.querySelector<HTMLElement>('[data-pills-setting="layoutPreference"]')!;
    expect(layout.closest(".dc-row")?.textContent).toContain("帖子详情页位置");
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
    expect(host.querySelectorAll(".dc-label-box").length).toBe(9);
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
});
