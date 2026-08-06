// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { bootFrameBridge } from "../src/frame-bridge";

describe("embedded topic preview bridge", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-ldu-embedded-topic");
    document.body.replaceChildren();
    delete window.__LDU_TEST_MODE__;
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
