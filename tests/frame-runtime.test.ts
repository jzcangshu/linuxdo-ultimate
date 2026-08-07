// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { installListFrameBridge, installTopicFrameBridge } from "../src/frame-runtime";

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
    installTopicFrameBridge(window, document, "topic-1");
    postMessage.mockClear();
    window.dispatchEvent(new MessageEvent("message", {
      origin: location.origin,
      source: window.parent,
      data: { type: "ldu:bookmark", tabId: "topic-1", topicId: "2715229" },
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
    installTopicFrameBridge(window, document, "topic-1");
    postMessage.mockClear();

    window.dispatchEvent(new MessageEvent("message", {
      origin: location.origin,
      source: window.parent,
      data: { type: "ldu:bookmark", tabId: "topic-1", topicId: "2715229" },
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
    const forumHandler = vi.fn((event: Event) => event.stopImmediatePropagation());
    document.addEventListener("click", forumHandler, true);
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    installTopicFrameBridge(window, document, "topic-1");
    window.dispatchEvent(new MessageEvent("message", {
      data: { type: "ldu:preview-config", tabId: "topic-1", enabled: true, clickMode: "single" },
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
    expect(forumHandler).not.toHaveBeenCalled();
    document.removeEventListener("click", forumHandler, true);
  });

  it("notifies the parent when the user interacts with the embedded page", () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    const forumHandler = vi.fn((event: Event) => event.stopImmediatePropagation());
    document.addEventListener("pointerdown", forumHandler, true);
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    installTopicFrameBridge(window, document, "topic-1");
    postMessage.mockClear();

    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0 }));

    expect(postMessage).toHaveBeenCalledWith({
      type: "ldu:frame-interaction",
      tabId: "topic-1",
    }, location.origin);
    document.removeEventListener("pointerdown", forumHandler, true);
  });

  it("forwards a different internal topic to the parent tab manager", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    window.history.replaceState(null, "", "/t/current/1");
    const forumHandler = vi.fn((event: Event) => event.stopImmediatePropagation());
    document.addEventListener("click", forumHandler, true);
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    installTopicFrameBridge(window, document, "topic-1");
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
    expect(forumHandler).not.toHaveBeenCalled();
    document.removeEventListener("click", forumHandler, true);
  });

  it("routes a non-topic Linux Do link to the independent list pane", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    window.history.replaceState(null, "", "/t/current/1");
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    installTopicFrameBridge(window, document, "topic-1");
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
    installTopicFrameBridge(window, document, "topic-1");
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

  it("routes topics from any embedded non-reading page before the forum router", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/u/member/activity");
    const forumHandler = vi.fn((event: Event) => event.stopImmediatePropagation());
    document.addEventListener("click", forumHandler, true);
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    installListFrameBridge(window, document, "list-1");
    postMessage.mockClear();

    const link = document.createElement("a");
    link.href = "/t/from-user-page/99";
    link.textContent = "User activity topic";
    const card = document.createElement("div");
    card.setAttribute("role", "button");
    card.append(link);
    document.body.append(card);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(forumHandler).not.toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "ldu:list-topic-open",
      frameId: "list-1",
      topicId: "99",
    }), location.origin);
    document.removeEventListener("click", forumHandler, true);
  });

  it("falls back to the link's native click when the parent does not acknowledge navigation", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    window.history.replaceState(null, "", "/t/current/1");
    const nativeClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    installTopicFrameBridge(window, document, "topic-1");
    const link = document.createElement("a");
    link.href = "/t/another/2";
    document.body.append(link);

    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    vi.advanceTimersByTime(1_000);

    expect(nativeClick).toHaveBeenCalledOnce();
  });

  it("keeps target and download links under native browser control", () => {
    vi.useFakeTimers();
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    installTopicFrameBridge(window, document, "topic-1");
    window.dispatchEvent(new MessageEvent("message", {
      data: { type: "ldu:preview-config", tabId: "topic-1", enabled: true, clickMode: "single" },
      origin: location.origin,
      source: window.parent,
    }));
    postMessage.mockClear();

    const newTab = document.createElement("a");
    newTab.href = "/t/another/2";
    newTab.target = "_blank";
    const download = document.createElement("a");
    download.href = "https://files.example/archive.zip";
    download.download = "archive.zip";
    document.body.append(newTab, download);

    const newTabClick = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    const downloadClick = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    newTab.dispatchEvent(newTabClick);
    download.dispatchEvent(downloadClick);

    expect(newTabClick.defaultPrevented).toBe(false);
    expect(downloadClick.defaultPrevented).toBe(false);
    expect(postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: expect.stringMatching(/open$/) }),
      expect.anything(),
    );
  });

  it("leaves post images to the forum lightbox", () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-topic:topic-1" });
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    installTopicFrameBridge(window, document, "topic-1");
    window.dispatchEvent(new MessageEvent("message", {
      data: { type: "ldu:preview-config", tabId: "topic-1", enabled: true, clickMode: "single" },
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
    installTopicFrameBridge(window, document, "topic-1");
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
