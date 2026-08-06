// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { startLinuxDoApp } from "../src/app";
import { saveDirectTopicHandoff } from "../src/discourse/direct-topic-handoff";

describe("direct topic startup", () => {
  it("waits for the real list host before consuming and opening the pending topic", async () => {
    localStorage.clear();
    sessionStorage.clear();
    history.replaceState({}, "", "/");
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    document.head.innerHTML = "";
    document.body.innerHTML = `
      <header class="d-header"><div class="wrap"><div class="contents"><ul class="d-header-icons"></ul></div></div></header>
    `;
    saveDirectTopicHandoff(sessionStorage, {
      listUrl: `${location.origin}/`,
      topics: [
        { url: `${location.origin}/t/topic/66`, title: "原先阅读的帖子" },
        { url: `${location.origin}/t/topic/77/3`, title: "随后点击的帖子" },
      ],
    }, Date.now());

    startLinuxDoApp();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(document.querySelector("#ldu-topic-panel")).toBeNull();

    const wrapper = document.createElement("div");
    wrapper.id = "main-outlet-wrapper";
    wrapper.innerHTML = '<aside class="sidebar-wrapper"></aside><main id="main-outlet"></main>';
    document.body.append(wrapper);
    await new Promise((resolve) => window.setTimeout(resolve, 450));

    expect(document.body.classList.contains("ldu-layout-active")).toBe(true);
    expect(document.querySelectorAll(".ldu-tab-item")).toHaveLength(2);
    expect([...document.querySelectorAll(".ldu-tab-button")].map((button) => button.textContent))
      .toEqual(["原先阅读的帖子", "随后点击的帖子"]);
    expect(document.querySelector(".ldu-tab-item.is-active .ldu-tab-button")?.textContent).toBe("随后点击的帖子");
    expect(document.querySelector<HTMLIFrameElement>('.ldu-topic-frame[aria-hidden="false"]')?.src).toContain("/t/topic/77/3");
  });
});
