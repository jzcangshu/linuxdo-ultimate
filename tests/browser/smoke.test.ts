// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startLinuxDoApp } from "../../src/app";

describe("DOM integration smoke", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    history.replaceState({}, "", "/");
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    window.__LDU_TEST_MODE__ = true;
    vi.stubGlobal("MutationObserver", class {
      observe(): void {}
      disconnect(): void {}
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    document.head.innerHTML = "";
    document.body.innerHTML = `
      <header class="d-header"><div class="wrap"><div class="contents"><ul class="d-header-icons">
        <li class="chat-header-icon"><a class="btn" href="/chat">Chat</a></li>
      </ul></div></div></header>
      <div id="main-container"><div id="main-outlet-wrapper">
        <aside class="sidebar-wrapper"><a class="category-link" href="/c/develop/4">开发调优</a></aside>
        <main id="main-outlet"><table class="topic-list"><tbody><tr>
          <td><a class="title" href="/t/topic/42">Test topic</a></td>
          <td class="posters">avatars</td>
        </tr></tbody></table></main>
      </div></div>
    `;
  });

  it("opens a topic, preserves split navigation, and avoids activation listener growth", async () => {
    startLinuxDoApp();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    document.querySelector<HTMLAnchorElement>("a.title")!.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    }));

    expect(location.pathname).toBe("/");
    expect(document.body.classList.contains("ldu-layout-two")).toBe(true);
    expect(document.querySelectorAll(".ldu-tab-item")).toHaveLength(1);
    expect(document.querySelector<HTMLIFrameElement>(".ldu-topic-frame")?.src).toContain("/t/topic/42");
    const retainedTopicFrame = document.querySelector<HTMLIFrameElement>(".ldu-topic-frame")!;
    document.querySelector<HTMLAnchorElement>(".category-link")!.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    }));
    expect(location.pathname).toBe("/");
    expect(document.querySelector<HTMLIFrameElement>(".ldu-list-frame")?.src).toContain("/c/develop/4");
    expect(document.querySelector<HTMLIFrameElement>(".ldu-topic-frame")).toBe(retainedTopicFrame);
    expect(getComputedStyle(document.querySelector<HTMLElement>(".posters")!).display).toBe("none");
    expect(document.querySelector(".d-header-icons > .ldu-settings-host")).not.toBeNull();

    const contextEvent = new MouseEvent("contextmenu", {
      bubbles: true, cancelable: true, clientX: 180, clientY: 80,
    });
    document.querySelector<HTMLElement>("#ldu-topic-panel .ldu-tab-item")!.dispatchEvent(contextEvent);
    expect(contextEvent.defaultPrevented).toBe(true);
    document.querySelector<HTMLButtonElement>('.ldu-tab-context-menu [data-action="split"]')!.click();
    expect(document.querySelectorAll("#ldu-topic-panel .ldu-tab-item")).toHaveLength(0);
    expect(document.querySelectorAll("#ldu-secondary-topic-panel .ldu-tab-item")).toHaveLength(1);
    expect(document.querySelector("#ldu-secondary-topic-panel .ldu-topic-frame")).toBe(retainedTopicFrame);
    expect(document.body.classList.contains("ldu-secondary-open")).toBe(true);
    retainedTopicFrame.contentWindow!.history.replaceState({}, "", "/t/topic/42/15");
    Object.defineProperty(retainedTopicFrame.contentWindow, "scrollY", { configurable: true, value: 1800 });
    document.querySelector<HTMLButtonElement>(".ldu-close-secondary")!.click();
    expect(document.querySelectorAll("#ldu-topic-panel .ldu-tab-item")).toHaveLength(1);
    expect(document.querySelectorAll("#ldu-secondary-topic-panel .ldu-tab-item")).toHaveLength(0);
    expect(document.querySelector("#ldu-topic-panel .ldu-topic-frame")).toBe(retainedTopicFrame);
    expect(new URL(retainedTopicFrame.src).pathname).toBe("/t/topic/42/15");

    const nativeChatHandler = vi.fn((event: Event) => event.preventDefault());
    document.querySelector<HTMLAnchorElement>('.chat-header-icon a')!.addEventListener("click", nativeChatHandler);
    const chatClick = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    document.querySelector<HTMLAnchorElement>('.chat-header-icon a')!.dispatchEvent(chatClick);
    expect(nativeChatHandler).not.toHaveBeenCalled();
    expect(document.querySelector<HTMLIFrameElement>(".ldu-list-frame")?.src).toContain("/chat");

    document.querySelector<HTMLButtonElement>('.ldu-settings-host > button')!.click();
    expect(document.querySelector<HTMLElement>('#ldu-settings-panel')?.hidden).toBe(false);
    const frame = document.querySelector<HTMLIFrameElement>(".ldu-topic-frame")!;
    const frameInteraction = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-interaction", tabId: "topic-42" },
    });
    Object.defineProperty(frameInteraction, "source", { value: frame.contentWindow });
    window.dispatchEvent(frameInteraction);
    expect(document.querySelector<HTMLElement>('#ldu-settings-panel')?.hidden).toBe(true);

    const separator = document.querySelector<HTMLElement>(".ldu-resize-before")!;
    separator.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const dragged = JSON.parse(localStorage.getItem("linuxdo-ultimate:settings")!);
    expect(dragged.paneSizes.listRatio).toBe(0.37);

    document.querySelector<HTMLButtonElement>(".ldu-settings-reset")!.click();
    const reset = JSON.parse(localStorage.getItem("linuxdo-ultimate:settings")!);
    expect(reset.paneSizes.listRatio).toBe(0.35);

    const toggle = document.querySelector<HTMLInputElement>('[data-setting="tabsEnabled"]')!;
    toggle.checked = false;
    toggle.dispatchEvent(new Event("change"));
    expect(document.body.classList.contains("ldu-layout-active")).toBe(false);
    expect(document.querySelector(".ldu-settings-host")).not.toBeNull();

    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    expect(document.body.classList.contains("ldu-layout-two")).toBe(true);
    expect(document.querySelectorAll(".ldu-tab-item")).toHaveLength(1);

    const addFrameListener = vi.spyOn(frame, "addEventListener");
    const frameState = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-state", tabId: "topic-42", url: frame.src, scrollY: 320 },
    });
    Object.defineProperty(frameState, "source", { value: frame.contentWindow });
    window.dispatchEvent(frameState);
    document.querySelector<HTMLButtonElement>(".ldu-tab-button")!.click();
    document.querySelector<HTMLButtonElement>(".ldu-tab-button")!.click();
    expect(addFrameListener).not.toHaveBeenCalledWith("load", expect.any(Function), expect.anything());

    history.pushState({}, "", "/c/develop/4");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    expect(document.body.classList.contains("ldu-layout-active")).toBe(true);
    expect(document.querySelector<HTMLElement>("#ldu-topic-panel")?.hidden).toBe(false);
    expect(document.querySelectorAll(".ldu-tab-item")).toHaveLength(1);

    history.pushState({}, "", "/u/jzcangshu/activity");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    expect(document.body.classList.contains("ldu-layout-active")).toBe(true);
    expect(document.querySelector<HTMLElement>("#ldu-topic-panel")?.hidden).toBe(false);
    expect(document.querySelectorAll(".ldu-tab-item")).toHaveLength(1);
  });
});
