// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { startLinuxDoApp } from "../src/app";
import {
  DEFAULT_SETTINGS,
  SESSION_ID_KEY,
  SESSION_KEY_PREFIX,
  SESSION_OWNER_KEY_PREFIX,
  SETTINGS_KEY,
} from "../src/core/defaults";
import { createSession, upsertTopicTab } from "../src/core/session";

describe("app refresh startup", () => {
  it("keeps the current split session when the previous document lease is still present", () => {
    const now = Date.now();
    history.replaceState({}, "", "/");
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    vi.spyOn(performance, "getEntriesByType").mockImplementation((type) => (
      type === "navigation" ? [{ type: "reload" } as PerformanceNavigationTiming] : []
    ));
    window.__LDU_TEST_MODE__ = true;
    Object.defineProperty(document, "readyState", { configurable: true, value: "loading" });
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

    const sessionId = "refreshing-browser-tab";
    let session = upsertTopicTab(createSession(sessionId, "https://linux.do/", now - 10), {
      topicId: "42",
      url: "https://linux.do/t/topic/42",
      title: "Current topic",
    }, now - 5);
    session = upsertTopicTab(session, {
      topicId: "43",
      url: "https://linux.do/t/topic/43",
      title: "Second topic",
    }, now - 4);
    session.secondaryTabIds = ["topic-43"];
    session.secondaryActiveTabId = "topic-43";
    session.activeTabId = "topic-42";
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, restoreSession: false }));
    localStorage.setItem(`${SESSION_KEY_PREFIX}${sessionId}`, JSON.stringify(session));
    localStorage.setItem(`${SESSION_OWNER_KEY_PREFIX}${sessionId}`, JSON.stringify({
      ownerId: "previous-document",
      updatedAt: now,
    }));

    startLinuxDoApp();

    expect(sessionStorage.getItem(SESSION_ID_KEY)).toBe(sessionId);
    expect(document.body.classList.contains("ldu-layout-active")).toBe(true);
    expect(document.querySelectorAll(".ldu-tab-item")).toHaveLength(2);
    expect(document.querySelectorAll("iframe.ldu-list-frame, iframe.ldu-topic-frame")).toHaveLength(3);
    expect(document.querySelector<HTMLIFrameElement>(".ldu-topic-frame")?.src).toContain("/t/topic/42");
  });
});
