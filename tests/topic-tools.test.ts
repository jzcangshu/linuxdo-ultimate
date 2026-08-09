// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { installTopicTools } from "../src/discourse/topic-tools";

function topicMarkup(): string {
  const preloaded = JSON.stringify({
    topic_123: JSON.stringify({ details: { created_by: { id: 1, username: "neo" } } }),
  });
  return `
    <script id="data-preloaded" type="application/json">${preloaded}</script>
    <div class="timeline-footer-controls"><button class="show-summary">热门回复</button></div>
    <div class="topic-post" data-post-number="3858"><article data-user-id="999"></article></div>
  `;
}

describe("topic tools", () => {
  afterEach(() => {
    vi.runOnlyPendingTimers();
    window.__LDU_TOPIC_TOOLS__?.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
    Reflect.deleteProperty(window, "__LDU_TOPIC_TOOLS__");
    Reflect.deleteProperty(window, "__LDU_TEST_MODE__");
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("uses the native author filter without hiding loaded posts", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/123/3858");
    document.body.innerHTML = topicMarkup();
    const navigate = vi.fn();
    const controller = installTopicTools({ navigate });
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();

    const button = document.querySelector<HTMLButtonElement>("#ldu-owner-toggle")!;
    button.click();

    expect(button.textContent).toBe("只看楼主");
    expect(button.classList.contains("btn-primary")).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-post-number="3858"]')?.hidden).toBe(false);
    expect(document.querySelector("[data-ldu-owner-hidden]")).toBeNull();
    expect(navigate).toHaveBeenCalledWith(new URL("/t/topic/123/3858?username_filters=neo", window.location.href).href);
  });

  it("reads the owner username from a mounted owner post when metadata is unavailable", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/123/1");
    document.body.innerHTML = `
      <div class="timeline-footer-controls"><button class="show-summary">热门回复</button></div>
      <div class="topic-post topic-owner" data-post-number="1">
        <article data-user-id="1"><a class="username" data-user-card="neo">neo</a></article>
      </div>
    `;
    const navigate = vi.fn();
    const controller = installTopicTools({ navigate });
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();

    document.querySelector<HTMLButtonElement>("#ldu-owner-toggle")!.click();
    expect(navigate).toHaveBeenCalledWith(new URL("/t/topic/123/1?username_filters=neo", window.location.href).href);
  });

  it("turns off immediately and removes only the owner filter", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/123/108?filter=summary&username_filters=neo");
    document.body.innerHTML = topicMarkup();
    const navigate = vi.fn();
    const controller = installTopicTools({ navigate });
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();

    const button = document.querySelector<HTMLButtonElement>("#ldu-owner-toggle")!;
    expect(button.getAttribute("aria-pressed")).toBe("true");
    button.click();

    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.classList.contains("btn-default")).toBe(true);
    expect(navigate).toHaveBeenCalledWith(new URL("/t/topic/123/108?filter=summary", window.location.href).href);
  });

  it("preserves the owner filter when toggling native popular replies", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/123/108?username_filters=neo");
    document.body.innerHTML = topicMarkup();
    const navigate = vi.fn();
    const controller = installTopicTools({ navigate });
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();

    document.querySelector<HTMLButtonElement>(".show-summary")!.click();
    expect(navigate).toHaveBeenCalledWith(new URL("/t/topic/123/108?username_filters=neo&filter=summary", window.location.href).href);

    window.history.replaceState(null, "", "/t/topic/123/108?username_filters=neo&filter=summary");
    document.querySelector<HTMLButtonElement>(".show-summary")!.textContent = "全部显示";
    document.querySelector<HTMLButtonElement>(".show-summary")!.click();
    expect(navigate).toHaveBeenLastCalledWith(new URL("/t/topic/123/108?username_filters=neo", window.location.href).href);
  });

  it("restores a remembered topic through the native route", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/123/3858");
    document.body.innerHTML = topicMarkup();
    window.localStorage.setItem("linuxdo-ultimate:owner-view:v2", JSON.stringify({
      version: 1,
      topics: { 123: Date.now() },
    }));
    const navigate = vi.fn();

    installTopicTools({ navigate });
    vi.runOnlyPendingTimers();

    expect(navigate).toHaveBeenCalledWith(new URL("/t/topic/123/3858?username_filters=neo", window.location.href).href);
  });

  it("does not observe character data and pauses with the iframe lifecycle", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/123/1");
    document.body.innerHTML = topicMarkup();
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const controller = installTopicTools({ navigate: vi.fn() });
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
    document.body.innerHTML = topicMarkup().replaceAll("topic_123", "topic_111");
    const controller = installTopicTools({ navigate: vi.fn() });
    vi.runOnlyPendingTimers();
    const original = document.querySelector<HTMLButtonElement>("#ldu-owner-toggle")!;

    window.history.replaceState(null, "", "/t/topic-b/222/1");
    document.querySelector("#data-preloaded")!.textContent = document.querySelector("#data-preloaded")!.textContent!.replaceAll("topic_111", "topic_222");
    document.body.append(document.createElement("span"));
    vi.runOnlyPendingTimers();
    expect(document.querySelector("#ldu-owner-toggle")).toBe(original);
    original.click();

    const stored = JSON.parse(window.localStorage.getItem("linuxdo-ultimate:owner-view:v2") ?? "null") as { topics: Record<string, number> };
    expect(stored.topics[222]).toBeTypeOf("number");
    expect(stored.topics[111]).toBeUndefined();
  });

  it("consumes the legacy global owner state only once", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.localStorage.setItem("on_off", "当前只看楼主");
    window.history.replaceState(null, "", "/t/topic/123/1");
    document.body.innerHTML = topicMarkup();
    installTopicTools({ navigate: vi.fn() });
    vi.runOnlyPendingTimers();
    expect(window.localStorage.getItem("on_off")).toBeNull();
    expect(window.localStorage.getItem("linuxdo-ultimate:owner-view:migrated")).toBe("1");
  });

  it("does not add a duplicate visible owner control in a split host", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/123/1");
    document.body.innerHTML = topicMarkup();
    const controller = installTopicTools({ isSplitHost: () => true, navigate: vi.fn() });
    controller.setConfig({ ownerOnlyEnabled: true });
    vi.runOnlyPendingTimers();
    expect(document.getElementById("ldu-owner-toggle")).toBeNull();
  });

  it("waits for the timeline instead of falling back to the topic footer", async () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/topic/123/1");
    document.body.innerHTML = '<div class="topic-footer-main-buttons"></div>';
    installTopicTools({ navigate: vi.fn() });
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
