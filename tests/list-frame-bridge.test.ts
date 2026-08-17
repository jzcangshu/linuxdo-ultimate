// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { bootFrameBridge } from "../src/frame-bridge";
import { APP_STYLE_ID, EMBEDDED_STYLE_ID } from "../src/ui/styles";

describe("embedded list bridge", () => {
  afterEach(async () => {
    document.documentElement.removeAttribute("data-ldu-embedded-list");
    document.body.replaceChildren();
    document.getElementById(APP_STYLE_ID)?.remove();
    document.getElementById(EMBEDDED_STYLE_ID)?.remove();
    window.__LDU_TOPIC_TOOLS__?.stop();
    delete window.__LDU_TOPIC_TOOLS__;
    delete window.__LDU_TEST_MODE__;
    await Promise.resolve();
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("turns a named list iframe into a topic-opening bridge", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-list:session-1" });
    window.history.replaceState(null, "", "/latest");
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    bootFrameBridge();
    expect(document.getElementById(EMBEDDED_STYLE_ID)).toBeInstanceOf(HTMLStyleElement);
    expect(document.getElementById(APP_STYLE_ID)).toBeNull();
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
    document.body.insertAdjacentHTML("beforeend", `
      <table>
        <tbody>
          <tr class="topic-list-item" data-topic-id="26463">
            <td class="main-link topic-list-data">
              <h2><a class="title raw-link raw-topic-link" href="/t/topic/26463">帖子标题</a></h2>
              <span class="row-whitespace"></span>
              <a class="badge-category__wrapper" href="#category">开发调优</a>
            </td>
          </tr>
        </tbody>
      </table>
    `);
    postMessage.mockClear();

    const whitespaceClick = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    document.querySelector<HTMLElement>(".row-whitespace")!.dispatchEvent(whitespaceClick);

    expect(whitespaceClick.defaultPrevented).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "ldu:list-topic-open",
      frameId: "session-1",
      topicId: "26463",
      topicTitle: "帖子标题",
    }), location.origin);

    postMessage.mockClear();
    const categoryClick = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    document.querySelector<HTMLAnchorElement>(".badge-category__wrapper")!.dispatchEvent(categoryClick);
    expect(categoryClick.defaultPrevented).toBe(false);
    expect(postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: "ldu:list-topic-open",
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

  it("reports visual readiness only after the list outlet has rendered content", async () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-list:session-visual" });
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    document.body.innerHTML = '<main id="main-outlet"><div class="loading-container"></div></main>';
    bootFrameBridge();
    vi.runOnlyPendingTimers();
    expect(postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
      type: "ldu:list-visual-ready",
    }), location.origin);

    document.querySelector(".loading-container")?.replaceWith(document.createElement("section"));
    await Promise.resolve();
    vi.runOnlyPendingTimers();

    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "ldu:list-visual-ready",
      frameId: "session-visual",
    }), location.origin);
  });

  it("does not load owner-view code in the list frame", () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "name", { configurable: true, value: "ldu-list:session-owner" });
    const loadOwnerView = vi.fn();
    bootFrameBridge({ loadOwnerView });
    window.dispatchEvent(new MessageEvent("message", {
      data: { type: "ldu:page-tools-config", ownerOnlyEnabled: true },
      origin: location.origin,
      source: window.parent,
    }));
    expect(loadOwnerView).not.toHaveBeenCalled();
  });
});
