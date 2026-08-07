// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { bootFrameBridge } from "../src/frame-bridge";

describe("embedded list bridge", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-ldu-embedded-list");
    document.body.replaceChildren();
    delete window.__LDU_TEST_MODE__;
  });

  it("turns a named list iframe into a topic-opening bridge", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-list:session-1" });
    window.history.replaceState(null, "", "/latest");
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    postMessage.mockClear();
    const link = document.createElement("a");
    link.href = "/t/another/2";
    link.textContent = "另一个帖子";
    document.body.append(link);
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    expect(document.documentElement.dataset.lduEmbeddedList).toBe("true");
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "ldu:list-topic-open",
      frameId: "session-1",
      topicId: "2",
    }), location.origin);
  });

  it("notifies the parent when the user interacts with the list iframe", () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-list:session-1" });
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    postMessage.mockClear();

    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0 }));

    expect(postMessage).toHaveBeenCalledWith({
      type: "ldu:list-interaction",
      frameId: "session-1",
    }, location.origin);
  });
});
