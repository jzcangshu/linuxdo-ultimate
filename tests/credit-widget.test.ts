// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreditWidget } from "../src/credit/credit-widget";

describe("credit widget", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
    localStorage.removeItem("linuxdo-ultimate:credit-cache:v1");
  });

  it("mounts once beside the language switcher and preserves the original score calculation", async () => {
    const headerIcons = document.createElement("ul");
    headerIcons.className = "d-header-icons";
    const language = document.createElement("li");
    language.className = "language-switcher";
    const chat = document.createElement("li");
    chat.className = "chat-header-icon";
    headerIcons.append(language, chat);
    document.body.append(headerIcons);
    const request = vi.fn(async (url: string) => url.includes("credit.linux.do")
      ? { data: { "community-balance": "12.50", username: "tester" } }
      : { user: { gamification_score: "16" } });
    const widget = new CreditWidget({ request, isTopLevel: () => true });

    widget.mount(true);
    widget.ensureHost();
    await vi.waitFor(() => expect(document.querySelector(".ldu-credit-value")?.textContent).toBe("+3.50"));

    const host = document.querySelector(".ldu-credit-host")!;
    expect(language.nextElementSibling).toBe(host);
    expect(document.querySelectorAll(".ldu-credit-host")).toHaveLength(1);
    const button = document.querySelector<HTMLButtonElement>(".ldu-credit-button")!;
    expect(button.classList.contains("language-switcher-trigger")).toBe(true);
    button.dispatchEvent(new MouseEvent("mouseenter"));
    expect(document.querySelector(".ldu-credit-tooltip")?.textContent).toContain("当前分: 16.00");
    expect(request).toHaveBeenCalledWith("https://credit.linux.do/api/v1/oauth/user-info");
    expect(request).toHaveBeenCalledWith("https://linux.do/u/tester.json");
  });

  it("does not mount or request data inside an embedded page", () => {
    const request = vi.fn();
    const widget = new CreditWidget({ request, isTopLevel: () => false });
    widget.mount(true);
    expect(document.querySelector(".ldu-credit-host")).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it("keeps the original credentialed userscript request contract", async () => {
    const headerIcons = document.createElement("ul");
    headerIcons.className = "d-header-icons";
    const language = document.createElement("li");
    language.className = "language-switcher";
    headerIcons.append(language);
    document.body.append(headerIcons);
    const xhr = vi.fn((details: {
      url: string;
      withCredentials: boolean;
      headers: Record<string, string>;
      timeout: number;
      onload: (response: { status: number; responseText: string }) => void;
    }) => {
      const payload = details.url.includes("credit.linux.do")
        ? { data: { "community-balance": 20, username: "tester" } }
        : { user: { gamification_score: 21.25 } };
      queueMicrotask(() => details.onload({ status: 200, responseText: JSON.stringify(payload) }));
      return {};
    });
    vi.stubGlobal("GM_xmlhttpRequest", xhr);
    const widget = new CreditWidget({ isTopLevel: () => true });
    widget.mount(true);

    await vi.waitFor(() => expect(document.querySelector(".ldu-credit-value")?.textContent).toBe("+1.25"));
    expect(xhr).toHaveBeenCalledTimes(2);
    const firstRequest = xhr.mock.calls[0]![0];
    expect(firstRequest.withCredentials).toBe(true);
    expect(firstRequest.headers.Referer).toBe("https://credit.linux.do/home");
    expect(firstRequest.headers["x-csrf-token"]).toBeUndefined();
    expect(firstRequest.timeout).toBe(10_000);
  });

  it("aborts an in-flight userscript request when the feature is disabled", () => {
    const headerIcons = document.createElement("ul");
    headerIcons.className = "d-header-icons";
    const language = document.createElement("li");
    language.className = "language-switcher";
    headerIcons.append(language);
    document.body.append(headerIcons);
    const abort = vi.fn();
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn(() => ({ abort })));
    const widget = new CreditWidget({ isTopLevel: () => true });

    widget.mount(true);
    widget.setEnabled(false);

    expect(abort).toHaveBeenCalledOnce();
  });

  it("pauses all polling while the page is hidden and resumes when visible", async () => {
    const headerIcons = document.createElement("ul");
    headerIcons.className = "d-header-icons";
    const language = document.createElement("li");
    language.className = "language-switcher";
    headerIcons.append(language);
    document.body.append(headerIcons);
    let visible = false;
    const request = vi.fn(async (url: string) => url.includes("credit.linux.do")
      ? { data: { "community-balance": 1, username: "tester" } }
      : { user: { gamification_score: 2 } });
    const widget = new CreditWidget({ request, isTopLevel: () => true, isVisible: () => visible });
    widget.mount(true);
    expect(request).not.toHaveBeenCalled();

    visible = true;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it("deduplicates a manual refresh with an in-flight scheduled request", async () => {
    const headerIcons = document.createElement("ul");
    headerIcons.className = "d-header-icons";
    const language = document.createElement("li");
    language.className = "language-switcher";
    headerIcons.append(language);
    document.body.append(headerIcons);
    let resolveCredit!: (value: unknown) => void;
    const request = vi.fn((url: string) => url.includes("credit.linux.do")
      ? new Promise((resolve) => { resolveCredit = resolve; })
      : Promise.resolve({ user: { gamification_score: 2 } }));
    const widget = new CreditWidget({ request, isTopLevel: () => true });
    widget.mount(true);
    document.querySelector<HTMLButtonElement>(".ldu-credit-button")!.click();
    expect(request).toHaveBeenCalledTimes(1);
    resolveCredit({ data: { "community-balance": 1, username: "tester" } });
    await vi.waitFor(() => expect(document.querySelector(".ldu-credit-value")?.textContent).toBe("+1.00"));
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("restarts immediately when re-enabled during an obsolete request", async () => {
    const headerIcons = document.createElement("ul");
    headerIcons.className = "d-header-icons";
    const language = document.createElement("li");
    language.className = "language-switcher";
    headerIcons.append(language);
    document.body.append(headerIcons);
    let resolveFirst!: (value: unknown) => void;
    let creditCalls = 0;
    const request = vi.fn((url: string) => {
      if (!url.includes("credit.linux.do")) return Promise.resolve({ user: { gamification_score: 8 } });
      creditCalls += 1;
      if (creditCalls === 1) return new Promise((resolve) => { resolveFirst = resolve; });
      return Promise.resolve({ data: { "community-balance": 5, username: "tester" } });
    });
    const widget = new CreditWidget({ request, isTopLevel: () => true });
    widget.mount(true);
    widget.setEnabled(false);
    widget.setEnabled(true);
    resolveFirst({ data: { "community-balance": 1, username: "stale" } });

    await vi.waitFor(() => expect(document.querySelector(".ldu-credit-value")?.textContent).toBe("+3.00"));
    expect(creditCalls).toBe(2);
    expect(request).toHaveBeenCalledWith("https://linux.do/u/tester.json");
  });

  it("leaves the loading state and reports malformed API responses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const headerIcons = document.createElement("ul");
    headerIcons.className = "d-header-icons";
    const language = document.createElement("li");
    language.className = "language-switcher";
    headerIcons.append(language);
    document.body.append(headerIcons);
    const request = vi.fn(async () => ({ data: { "community-balance": "invalid" } }));
    const widget = new CreditWidget({ request, isTopLevel: () => true });
    widget.mount(true);
    await vi.waitFor(() => expect(document.querySelector(".ldu-credit-value")?.textContent).toBe("!"));
  });

  it.each([
    ["expired", JSON.stringify({ communityBalance: 1, gamificationScore: 2, username: "old", updatedAt: 1 })],
    ["malformed", "{not-json"],
  ])("removes %s shared cache data before fetching a fresh snapshot", async (_case, stored) => {
    const headerIcons = document.createElement("ul");
    headerIcons.className = "d-header-icons";
    const language = document.createElement("li");
    language.className = "language-switcher";
    headerIcons.append(language);
    document.body.append(headerIcons);
    localStorage.setItem("linuxdo-ultimate:credit-cache:v1", stored);
    const removeItem = vi.spyOn(Storage.prototype, "removeItem");
    const request = vi.fn(async (url: string) => url.includes("credit.linux.do")
      ? { data: { "community-balance": 3, username: "tester" } }
      : { user: { gamification_score: 4 } });
    const widget = new CreditWidget({ request, isTopLevel: () => true, now: () => 120_000 });

    widget.mount(true);
    await vi.waitFor(() => expect(document.querySelector(".ldu-credit-value")?.textContent).toBe("+1.00"));

    expect(removeItem).toHaveBeenCalledWith("linuxdo-ultimate:credit-cache:v1");
  });
});
