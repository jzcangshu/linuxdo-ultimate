// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { startLinuxDoApp } from "../src/app";

describe("native direct topic startup", () => {
  it("keeps a first direct topic visit in the native topic page", () => {
    localStorage.clear();
    sessionStorage.clear();
    history.replaceState({}, "", "/t/topic/88");
    window.__LDU_TEST_MODE__ = true;
    vi.stubGlobal("MutationObserver", class {
      observe(): void {}
      disconnect(): void {}
    });
    document.head.innerHTML = "";
    document.body.innerHTML = `
      <header class="d-header"><div class="contents"><ul class="d-header-icons"></ul></div></header>
      <div id="main-outlet-wrapper"><aside class="sidebar-wrapper"></aside><main id="main-outlet"><h1 class="fancy-title">原生直达帖子</h1></main></div>
    `;

    startLinuxDoApp();
    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(location.pathname).toBe("/t/topic/88");
    expect(document.body.classList.contains("ldu-layout-active")).toBe(false);
    expect(document.querySelector("#ldu-topic-panel")).toBeNull();
  });
});
