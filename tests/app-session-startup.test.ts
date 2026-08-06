// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { startLinuxDoApp } from "../src/app";
import { DEFAULT_SETTINGS, SESSION_ID_KEY, SESSION_KEY_PREFIX, SETTINGS_KEY } from "../src/core/defaults";
import { createSession, upsertTopicTab } from "../src/core/session";

describe("app session startup", () => {
  it("keeps the current browser-tab topics on refresh when next-visit restoration is off", () => {
    history.replaceState({}, "", "/");
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    window.__LDU_TEST_MODE__ = true;
    vi.stubGlobal("MutationObserver", class {
      observe(): void {}
      disconnect(): void {}
    });
    document.head.innerHTML = "";
    document.body.innerHTML = `
      <header class="d-header"><div class="contents"><ul class="d-header-icons"></ul></div></header>
      <div id="main-outlet-wrapper">
        <aside class="sidebar-wrapper"></aside>
        <main id="main-outlet"><table class="topic-list"></table></main>
      </div>
    `;

    const sessionId = "same-browser-tab";
    const session = upsertTopicTab(createSession(sessionId, "https://linux.do/latest", 1), {
      topicId: "42",
      url: "https://linux.do/t/topic/42",
      title: "Current topic",
    }, 2);
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, restoreSession: false }));
    localStorage.setItem(`${SESSION_KEY_PREFIX}${sessionId}`, JSON.stringify(session));

    startLinuxDoApp();
    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(document.body.classList.contains("ldu-layout-active")).toBe(true);
    expect(document.querySelectorAll(".ldu-tab-item")).toHaveLength(1);
    expect(document.querySelector<HTMLIFrameElement>(".ldu-topic-frame")?.src).toContain("/t/topic/42");
  });
});
