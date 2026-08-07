// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { startLinuxDoApp } from "../src/app";

describe("direct topic promotion", () => {
  it("creates the independent shell only after the user opens another topic", () => {
    localStorage.clear();
    sessionStorage.clear();
    history.replaceState({}, "", "/t/current/66");
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    vi.stubGlobal("MutationObserver", class {
      observe(): void {}
      disconnect(): void {}
    });
    document.head.innerHTML = "";
    document.body.innerHTML = `
      <header class="d-header"><div class="contents"><ul class="d-header-icons"></ul></div></header>
      <div id="main-outlet-wrapper">
        <aside class="sidebar-wrapper"></aside>
        <main id="main-outlet"><h1 class="fancy-title">原先阅读的帖子</h1><a class="next-topic" href="/t/next/77/3">随后点击的帖子</a></main>
      </div>
    `;

    startLinuxDoApp();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(document.body.classList.contains("ldu-layout-active")).toBe(false);

    const frameMountOrder: string[] = [];
    const nativeAppend = Element.prototype.append;
    vi.spyOn(Element.prototype, "append").mockImplementation(function (this: Element, ...nodes: (Node | string)[]) {
      for (const node of nodes) {
        if (node instanceof HTMLIFrameElement) frameMountOrder.push(node.className);
      }
      nativeAppend.apply(this, nodes);
    });

    document.querySelector<HTMLAnchorElement>(".next-topic")!.dispatchEvent(new MouseEvent("click", {
      bubbles: true, cancelable: true, button: 0,
    }));

    expect(location.pathname).toBe("/t/current/66");
    expect(document.body.classList.contains("ldu-layout-active")).toBe(true);
    expect(frameMountOrder.slice(0, 3)).toEqual(["ldu-topic-frame", "ldu-topic-frame", "ldu-list-frame"]);
    expect(document.querySelectorAll(".ldu-tab-item")).toHaveLength(2);
    expect([...document.querySelectorAll(".ldu-tab-button")].map((button) => button.textContent))
      .toEqual(["原先阅读的帖子", "随后点击的帖子"]);
    expect(document.querySelector<HTMLIFrameElement>(".ldu-list-frame")?.src).toBe(`${location.origin}/`);
    expect(document.querySelector("#main-outlet-wrapper #ldu-topic-panel")).toBeNull();
  });
});
