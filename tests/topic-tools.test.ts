// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { installTopicTools } from "../src/discourse/topic-tools";

describe("topic tools", () => {
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
    document.documentElement.removeAttribute("data-ldu-clean-mode");
    document.documentElement.removeAttribute("data-ldu-low-end");
    document.getElementById("ldu-topic-tools-style")?.remove();
    Reflect.deleteProperty(window, "__LDU_TOPIC_TOOLS__");
    Reflect.deleteProperty(window, "__LDU_TEST_MODE__");
    try { Reflect.deleteProperty(window.navigator, "hardwareConcurrency"); } catch { /* jsdom may expose a readonly property */ }
    window.localStorage.clear();
  });

  it("adds a per-topic owner toggle and remembers its state", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/123/1");
    document.body.innerHTML = `
      <div class="topic-footer-main-buttons"></div>
      <div class="topic-post" data-post-number="1"><article data-user-id="owner"></article></div>
      <div class="topic-post" data-post-number="2"><article data-user-id="reply"></article></div>
    `;
    const controller = installTopicTools();
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();

    const button = document.querySelector<HTMLButtonElement>("#ldu-owner-toggle");
    expect(button?.textContent).toBe("当前查看全部");
    expect(document.querySelector<HTMLElement>('[data-post-number="2"]')?.hidden).toBe(false);

    button?.click();
    expect(button?.textContent).toBe("当前只看楼主");
    expect(document.querySelector<HTMLElement>('[data-post-number="1"]')?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('[data-post-number="2"]')?.hidden).toBe(true);

    controller.stop();
    delete window.__LDU_TOPIC_TOOLS__;
    const restored = installTopicTools();
    restored.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();
    expect(document.querySelector<HTMLButtonElement>("#ldu-owner-toggle")?.textContent).toBe("当前只看楼主");
    expect(document.querySelector<HTMLElement>('[data-post-number="2"]')?.hidden).toBe(true);
  });

  it("applies clean mode without importing grayscale filters", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(window.navigator, "hardwareConcurrency", { configurable: true, value: 2 });
    window.history.replaceState(null, "", "/latest");
    document.body.innerHTML = `
      <div id="global-notice-alert-global-notice"></div>
      <p>${"希望你喜欢这里。有问题，请提问，或搜索现有帖子。"}</p>
      <td class="posters topic-list-data"></td>
    `;
    const controller = installTopicTools();
    controller.setConfig({ cleanModeEnabled: true, lowEndOptimizationEnabled: true });
    vi.runOnlyPendingTimers();

    expect(document.documentElement.dataset.lduCleanMode).toBe("true");
    expect(document.querySelector("p")?.dataset.lduCleanHidden).toBe("true");
    expect(document.documentElement.dataset.lduLowEnd).toBe("true");
    expect(document.getElementById("ldu-topic-tools-style")?.textContent).not.toContain("grayscale");
  });

  it("does not add a duplicate visible owner control in a split host", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/789/1");
    document.body.innerHTML = '<div class="topic-footer-main-buttons"></div>';
    const controller = installTopicTools({ isSplitHost: () => true });
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();
    expect(document.getElementById("ldu-owner-toggle")).toBeNull();
  });
});
