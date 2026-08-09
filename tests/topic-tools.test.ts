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
      <div class="timeline-footer-controls"><button class="show-summary">热门回复</button></div>
      <div class="topic-post" data-post-number="1"><article data-user-id="owner"></article></div>
      <div class="topic-post" data-post-number="2"><article data-user-id="reply"></article></div>
    `;
    const controller = installTopicTools();
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();

    const button = document.querySelector<HTMLButtonElement>("#ldu-owner-toggle");
    expect(button?.textContent).toBe("只看楼主");
    expect(button?.nextElementSibling?.textContent).toBe("热门回复");
    expect(button?.classList.contains("btn-default")).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-post-number="2"]')?.hidden).toBe(false);

    button?.click();
    expect(button?.textContent).toBe("只看楼主");
    expect(button?.classList.contains("btn-primary")).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-post-number="1"]')?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('[data-post-number="2"]')?.hidden).toBe(true);

    controller.stop();
    delete window.__LDU_TOPIC_TOOLS__;
    const restored = installTopicTools();
    restored.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();
    expect(document.querySelector<HTMLButtonElement>("#ldu-owner-toggle")?.textContent).toBe("只看楼主");
    expect(document.querySelector<HTMLElement>('[data-post-number="2"]')?.hidden).toBe(true);
  });

  it("does not observe character data and pauses with the iframe lifecycle", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/456/1");
    document.body.innerHTML = '<div class="timeline-footer-controls"></div>';
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
    document.body.innerHTML = '<div class="timeline-footer-controls"></div>';
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
    document.body.innerHTML = '<div class="timeline-footer-controls"></div>';
    installTopicTools();
    vi.runOnlyPendingTimers();
    expect(window.localStorage.getItem("on_off")).toBeNull();
    expect(window.localStorage.getItem("linuxdo-ultimate:owner-view:migrated")).toBe("1");
  });

  it("does not add a duplicate visible owner control in a split host", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/789/1");
    document.body.innerHTML = '<div class="timeline-footer-controls"></div>';
    const controller = installTopicTools({ isSplitHost: () => true });
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();
    expect(document.getElementById("ldu-owner-toggle")).toBeNull();
  });

  it("reads the topic owner from preloaded metadata when the first post is not mounted", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/2696141/6098");
    document.body.innerHTML = `
      <script id="data-preloaded" type="application/json">{"topic_2696141":"{\\"details\\":{\\"created_by\\":{\\"id\\":461980}}}"}</script>
      <div class="timeline-footer-controls"><button class="show-summary">热门回复</button></div>
      <div class="topic-post" data-post-number="6097"><article data-user-id="450453"></article></div>
      <div class="topic-post topic-owner" data-post-number="6098"><article data-user-id="461980"></article></div>
    `;
    const controller = installTopicTools();
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();

    document.querySelector<HTMLButtonElement>("#ldu-owner-toggle")!.click();

    expect(document.querySelector<HTMLElement>('[data-post-number="6097"]')?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-post-number="6098"]')?.hidden).toBe(false);
  });

  it("reapplies owner filtering when the native summary rebuilds the post stream", async () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/2696141/6098");
    document.body.innerHTML = `
      <script id="data-preloaded" type="application/json">{"topic_2696141":"{\\"details\\":{\\"created_by\\":{\\"id\\":461980}}}"}</script>
      <div class="timeline-footer-controls"><button class="show-summary">热门回复</button></div>
      <div class="post-stream"><div class="topic-post" data-post-number="6097"><article data-user-id="450453"></article></div></div>
    `;
    const controller = installTopicTools();
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();
    document.querySelector<HTMLButtonElement>("#ldu-owner-toggle")!.click();

    const rebuilt = document.createElement("div");
    rebuilt.className = "post-stream";
    rebuilt.innerHTML = `
      <div class="topic-post topic-owner" data-post-number="1"><article data-user-id="461980"></article></div>
      <div class="topic-post" data-post-number="2"><article data-user-id="161140"></article></div>
      <div class="topic-post topic-owner" data-post-number="222"><article data-user-id="461980"></article></div>
    `;
    document.querySelector(".post-stream")!.replaceWith(rebuilt);
    await Promise.resolve();
    vi.runOnlyPendingTimers();

    expect(rebuilt.querySelector<HTMLElement>('[data-post-number="1"]')?.hidden).toBe(false);
    expect(rebuilt.querySelector<HTMLElement>('[data-post-number="2"]')?.hidden).toBe(true);
    expect(rebuilt.querySelector<HTMLElement>('[data-post-number="222"]')?.hidden).toBe(false);
  });

  it("waits for the timeline instead of falling back to the topic footer", async () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/321/1");
    document.body.innerHTML = '<div class="topic-footer-main-buttons"></div>';
    installTopicTools();
    vi.runOnlyPendingTimers();
    expect(document.getElementById("ldu-owner-toggle")).toBeNull();

    const timeline = document.createElement("div");
    timeline.className = "timeline-footer-controls";
    timeline.innerHTML = '<button class="show-summary">热门回复</button>';
    document.body.append(timeline);
    await vi.runOnlyPendingTimersAsync();
    expect(timeline.firstElementChild?.id).toBe("ldu-owner-toggle");
  });
});
