// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { bootFrameBridge } from "../src/frame-bridge";

describe("embedded topic preview bridge", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-ldu-embedded-topic");
    document.documentElement.removeAttribute("data-ldu-embedded-list");
    document.body.replaceChildren();
    delete window.__LDU_TEST_MODE__;
  });

  it("creates a topic-level bookmark through Discourse's bookmark API", async () => {
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    document.head.innerHTML = '<meta name="csrf-token" content="csrf-value">';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 99 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    postMessage.mockClear();
    window.dispatchEvent(new MessageEvent("message", {
      origin: location.origin,
      source: window.parent,
      data: { type: "ldu:bookmark", topicId: "2715229" },
    }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/bookmarks.json");
    expect(init).toMatchObject({
      method: "POST",
      credentials: "same-origin",
      headers: expect.objectContaining({ "X-CSRF-Token": "csrf-value" }),
    });
    expect(String(init.body)).toContain("bookmarkable_type=Topic");
    expect(String(init.body)).toContain("bookmarkable_id=2715229");
    expect(postMessage).toHaveBeenCalledWith({
      type: "ldu:bookmark-result",
      tabId: "topic-1",
      ok: true,
      message: "已添加到书签",
    }, location.origin);
  });

  it("reports a topic bookmark failure without clicking any post bookmark button", async () => {
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    document.head.innerHTML = '<meta name="csrf-token" content="csrf-value">';
    document.body.innerHTML = '<button class="bookmark-menu-trigger">楼层书签</button>';
    const postBookmark = document.querySelector<HTMLButtonElement>(".bookmark-menu-trigger")!;
    const postClick = vi.spyOn(postBookmark, "click");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      errors: ["该主题已经添加过书签"],
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })));
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    postMessage.mockClear();

    window.dispatchEvent(new MessageEvent("message", {
      origin: location.origin,
      source: window.parent,
      data: { type: "ldu:bookmark", topicId: "2715229" },
    }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(postClick).not.toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith({
      type: "ldu:bookmark-result",
      tabId: "topic-1",
      ok: false,
      message: "该主题已经添加过书签",
    }, location.origin);
  });

  it("intercepts a single-click external link and forwards it to the parent preview", () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    window.dispatchEvent(new MessageEvent("message", {
      data: { type: "ldu:preview-config", enabled: true, clickMode: "single" },
      origin: location.origin,
      source: window.parent,
    }));
    postMessage.mockClear();

    const link = document.createElement("a");
    link.href = "https://example.com/page";
    link.textContent = "External";
    document.body.append(link);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "ldu:preview-open",
      tabId: "topic-1",
      url: "https://example.com/page",
    }), location.origin);
  });

  it("notifies the parent when the user interacts with the embedded page", () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    postMessage.mockClear();

    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0 }));

    expect(postMessage).toHaveBeenCalledWith({
      type: "ldu:frame-interaction",
      tabId: "topic-1",
    }, location.origin);
  });

  it("forwards a different internal topic to the parent tab manager", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    window.history.replaceState(null, "", "/t/current/1");
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    postMessage.mockClear();

    const link = document.createElement("a");
    link.href = "/t/another-topic/2";
    link.textContent = "Another topic";
    document.body.append(link);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "ldu:topic-open",
      tabId: "topic-1",
      url: expect.stringContaining("/t/another-topic/2"),
      title: "Another topic",
    }), location.origin);
  });

  it("routes a non-topic Linux Do link to the independent list pane", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    window.history.replaceState(null, "", "/t/current/1");
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    postMessage.mockClear();
    const link = document.createElement("a");
    link.href = "/c/develop/4";
    link.textContent = "开发调优";
    document.body.append(link);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "ldu:list-navigate",
      url: expect.stringContaining("/c/develop/4"),
    }), location.origin);
  });

  it("leaves same-topic and modified clicks to the embedded page", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    window.history.replaceState(null, "", "/t/current/1/4");
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    postMessage.mockClear();

    const sameTopic = document.createElement("a");
    sameTopic.href = "/t/current/1/8";
    const otherTopic = document.createElement("a");
    otherTopic.href = "/t/another/2";
    document.body.append(sameTopic, otherTopic);

    const sameClick = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    sameTopic.dispatchEvent(sameClick);
    const modifiedClick = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
    otherTopic.dispatchEvent(modifiedClick);

    expect(sameClick.defaultPrevented).toBe(false);
    expect(modifiedClick.defaultPrevented).toBe(false);
    expect(postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ldu:topic-open" }), expect.anything());
  });

  it("leaves post images to the forum lightbox", () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    window.dispatchEvent(new MessageEvent("message", {
      data: { type: "ldu:preview-config", enabled: true, clickMode: "single" },
      origin: location.origin,
      source: window.parent,
    }));
    postMessage.mockClear();

    const link = document.createElement("a");
    link.href = "https://cdn.example.com/photo.png";
    link.className = "lightbox";
    const image = document.createElement("img");
    image.src = "https://cdn.example.com/photo.png";
    link.append(image);
    document.body.append(link);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    image.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    expect(postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ldu:preview-open" }), expect.anything());
  });

  it("reports the category as soon as its topic badge appears", async () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    postMessage.mockClear();

    const wrapper = document.createElement("a");
    wrapper.className = "badge-category__wrapper";
    wrapper.style.setProperty("--category-badge-color", "#ff9838");
    const name = document.createElement("span");
    name.className = "badge-category__name";
    name.textContent = "扬帆起航";
    wrapper.append(name);
    document.body.append(wrapper);
    await Promise.resolve();
    vi.runAllTimers();

    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      categoryName: "扬帆起航",
      categoryColor: "#ff9838",
    }), location.origin);
  });
});
