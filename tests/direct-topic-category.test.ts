// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { startLinuxDoApp } from "../src/app";

describe("direct topic category promotion", () => {
  it("promotes a top topic category link into the independent list pane", () => {
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
        <main id="main-outlet">
          <h1 class="fancy-title">原先阅读的帖子</h1>
          <div class="topic-map"><a class="badge-category__wrapper" href="/c/develop/4">开发调优</a></div>
        </main>
      </div>
    `;

    startLinuxDoApp();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    const category = document.querySelector<HTMLAnchorElement>(".badge-category__wrapper")!;
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    category.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(location.pathname).toBe("/t/current/66");
    expect(document.body.classList.contains("ldu-layout-active")).toBe(true);
    expect(document.querySelectorAll(".ldu-tab-item")).toHaveLength(1);
    expect(document.querySelector<HTMLIFrameElement>(".ldu-list-frame")?.src)
      .toBe(`${location.origin}/c/develop/4`);
  });
});
