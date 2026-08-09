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

  it("does not observe character data and pauses with the iframe lifecycle", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/456/1");
    document.body.innerHTML = '<div class="topic-footer-main-buttons"></div>';
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const controller = installTopicTools();
    vi.runOnlyPendingTimers();
    expect(observe).toHaveBeenCalledWith(expect.any(Node), { childList: true, subtree: true });
    controller.setActive(false);
    expect(disconnect).toHaveBeenCalled();
    controller.setActive(true);
    expect(observe).toHaveBeenCalledTimes(2);
  });

  it("uses the current SPA topic id when the reused button is clicked", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic-a/111/1");
    document.body.innerHTML = '<div class="topic-footer-main-buttons"></div>';
    const controller = installTopicTools();
    vi.runOnlyPendingTimers();
    const original = document.querySelector<HTMLButtonElement>("#ldu-owner-toggle")!;

    window.history.replaceState(null, "", "/t/topic-b/222/1");
    document.body.append(document.createElement("span"));
    vi.runOnlyPendingTimers();
    expect(document.querySelector("#ldu-owner-toggle")).toBe(original);
    original.click();

    const stored = JSON.parse(window.localStorage.getItem("linuxdo-ultimate:owner-view:v2") ?? "null") as { topics: Record<string, number> };
    expect(stored.topics[222]).toBeTypeOf("number");
    expect(stored.topics[111]).toBeUndefined();
    controller.stop();
  });

  it("consumes the legacy global owner state only once", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.localStorage.setItem("on_off", "当前只看楼主");
    window.history.replaceState(null, "", "/t/topic/333/1");
    document.body.innerHTML = '<div class="topic-footer-main-buttons"></div>';
    installTopicTools();
    vi.runOnlyPendingTimers();
    expect(window.localStorage.getItem("on_off")).toBeNull();
    expect(window.localStorage.getItem("linuxdo-ultimate:owner-view:migrated")).toBe("1");
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
