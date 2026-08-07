// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreviewController } from "../src/preview/upstream-preview-controller";

describe("vendored upstream previewer", () => {
  const controllers: PreviewController[] = [];

  const createController = (options: ConstructorParameters<typeof PreviewController>[0]): PreviewController => {
    const controller = new PreviewController(options);
    controllers.push(controller);
    return controller;
  };

  afterEach(() => {
    controllers.splice(0).forEach((controller) => controller.setEnabled(false));
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
    document.head.querySelectorAll("style").forEach((style) => style.remove());
  });

  it("keeps the 4.12.2 frame lifecycle, multi-tab window and local adaptations", async () => {
    const requests: Array<Record<string, unknown>> = [];
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn((options: Record<string, unknown>) => {
      requests.push(options);
      return { abort: vi.fn() };
    }));
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      callback();
      return 1;
    });

    const controller = createController({ isEnabled: () => true, clickMode: () => "double" });
    controller.mount();
    const owner = document.createElement("iframe");
    owner.getBoundingClientRect = () => ({ left: 100, top: 80 } as DOMRect);
    document.body.append(owner);

    controller.openFromFrame("https://first.example/app", owner, { left: 20, bottom: 30 });
    const firstFrame = document.querySelector<HTMLIFrameElement>(".agy-preview-iframe")!;
    expect(firstFrame.hasAttribute("sandbox")).toBe(false);
    expect(firstFrame.name).toMatch(/^agy-preview-frame:\d+$/);
    expect(document.querySelector(".agy-refresh-btn")).not.toBeNull();
    expect(document.querySelectorAll(".agy-preview-actions > :is(button, a) .ldu-symbol")).toHaveLength(6);
    expect(document.querySelector(".agy-refresh-btn .ldu-symbol-refresh")).not.toBeNull();
    expect(document.querySelector(".agy-close-btn .ldu-symbol-close")).not.toBeNull();
    expect(document.querySelector(".agy-preview-tab-close .ldu-symbol-close")).not.toBeNull();
    expect(document.querySelector(".agy-error-state")).toBeNull();
    expect(document.querySelector(".agy-click-mode-toggle")).toBeNull();
    expect(requests).toHaveLength(1);

    (requests[0]!.onload as (response: Record<string, unknown>) => void)({
      status: 200,
      responseText: '<html><head><title>First</title><link rel="stylesheet" href="./app.css"><script src="/app.js"></script></head><body><main>First body</main><img srcset="./small.png 1x, /large.png 2x"></body></html>',
      responseHeaders: "content-type: text/html",
      finalUrl: "https://first.example/redirected/index.html",
    });
    await vi.waitFor(() => expect(firstFrame.srcdoc).toContain("agyPreviewContentReady"));
    expect(firstFrame.srcdoc).toContain('src="https://first.example/app.js"');
    expect(firstFrame.srcdoc).toContain('href="https://first.example/redirected/app.css"');
    expect(firstFrame.srcdoc).toContain('srcset="https://first.example/redirected/small.png 1x, https://first.example/large.png 2x"');

    controller.openFromFrame("https://second.example/page", owner, { left: 20, bottom: 30 });
    expect(document.querySelectorAll(".agy-preview-tab")).toHaveLength(2);
    expect(document.querySelectorAll(".agy-preview-iframe")).toHaveLength(2);

    document.querySelector<HTMLButtonElement>(".agy-refresh-btn")!.click();
    expect(requests).toHaveLength(3);
    expect(requests[2]!.headers).toEqual({ "Cache-Control": "no-cache", Pragma: "no-cache" });

    const external = document.querySelector<HTMLAnchorElement>(".agy-open-btn")!;
    external.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector(".agy-preview-container")).toBeNull());
  });

  it("installs no global preview runtime while disabled and fully removes it after opt-out", () => {
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn(() => ({ abort: vi.fn() })));
    let enabled = false;
    const controller = createController({ isEnabled: () => enabled, clickMode: () => "double" });

    controller.mount();
    expect(document.querySelector("style")?.textContent ?? "").not.toContain("agy-preview-container");

    enabled = true;
    controller.setEnabled(true);
    expect([...document.querySelectorAll("style")].some((style) => style.textContent?.includes("agy-preview-container"))).toBe(true);
    enabled = false;
    controller.setEnabled(false);
    expect([...document.querySelectorAll("style")].some((style) => style.textContent?.includes("agy-preview-container"))).toBe(false);
  });

  it("keeps unlimited preview tab state while releasing inactive iframe runtimes", () => {
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn(() => ({ abort: vi.fn() })));
    const controller = createController({ isEnabled: () => true, clickMode: () => "double" });
    controller.mount();
    const owner = document.createElement("iframe");
    document.body.append(owner);
    for (let index = 1; index <= 6; index += 1) {
      controller.openFromFrame(`https://example${index}.com/page`, owner, { left: 0, bottom: 0 });
    }

    expect(document.querySelectorAll(".agy-preview-tab")).toHaveLength(6);
    expect(document.querySelectorAll(".agy-preview-iframe")).toHaveLength(3);
  });

  it("does not preview download links or known binary file targets", () => {
    const request = vi.fn(() => ({ abort: vi.fn() }));
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", request);
    const controller = createController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const download = document.createElement("a");
    download.href = "https://files.example/archive.zip";
    download.download = "archive.zip";
    document.body.append(download);
    download.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true }));

    expect(request).not.toHaveBeenCalled();
    expect(document.querySelector(".agy-preview-container")).toBeNull();
  });

  it("leaves same-origin forum pages to the split navigation controller", () => {
    const request = vi.fn(() => ({ abort: vi.fn() }));
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", request);
    const controller = createController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const link = document.createElement("a");
    link.href = "/u/member/activity";
    link.addEventListener("click", (event) => event.preventDefault());
    document.body.append(link);

    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));

    expect(request).not.toHaveBeenCalled();
    expect(document.querySelector(".agy-preview-container")).toBeNull();
  });

  it("aborts a cross-origin response once progress exceeds eight MiB", () => {
    const abort = vi.fn();
    const requests: Array<Record<string, unknown>> = [];
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn((options: Record<string, unknown>) => {
      requests.push(options);
      return { abort };
    }));
    const controller = createController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const owner = document.createElement("iframe");
    document.body.append(owner);

    controller.openFromFrame("https://large.example/page", owner, { left: 0, bottom: 0 });
    const onprogress = requests[0]?.onprogress as ((progress: { loaded: number; total: number }) => void) | undefined;
    expect(onprogress).toBeTypeOf("function");
    onprogress?.({ loaded: 8 * 1024 * 1024 + 1, total: 0 });

    expect(abort).toHaveBeenCalledOnce();
  });

  it("rejects an oversized response even when progress metadata is missing", () => {
    const requests: Array<Record<string, unknown>> = [];
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn((options: Record<string, unknown>) => {
      requests.push(options);
      return { abort: vi.fn() };
    }));
    const controller = createController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const owner = document.createElement("iframe");
    document.body.append(owner);
    controller.openFromFrame("https://large.example/page", owner, { left: 0, bottom: 0 });

    (requests[0]!.onload as (response: Record<string, unknown>) => void)({
      status: 200,
      responseText: "x".repeat(4 * 1024 * 1024 + 1),
      responseHeaders: "content-type: text/html",
      finalUrl: "https://large.example/page",
    });

    expect(document.querySelector(".agy-error-state")?.textContent).toContain("页面过大");
  });

  it("expires warmed preview responses without requiring another cache write", () => {
    vi.useFakeTimers();
    const requests: Array<Record<string, unknown>> = [];
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn((options: Record<string, unknown>) => {
      requests.push(options);
      return { abort: vi.fn() };
    }));
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      callback();
      return 1;
    });
    const controller = createController({ isEnabled: () => true, clickMode: () => "double" });
    controller.mount();
    const link = document.createElement("a");
    link.href = "https://cache.example/page";
    document.body.append(link);

    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    vi.advanceTimersByTime(250);
    expect(requests).toHaveLength(1);
    (requests[0]!.onload as (response: Record<string, unknown>) => void)({
      status: 200,
      responseText: "<html><body>cached preview content</body></html>",
      responseHeaders: "content-type: text/html",
      finalUrl: link.href,
    });
    link.dispatchEvent(new MouseEvent("mouseleave"));

    vi.advanceTimersByTime(5 * 60_000 + 1);
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    vi.advanceTimersByTime(250);

    expect(requests).toHaveLength(2);
    controller.setEnabled(false);
  });

  it("cancels preview cache maintenance when the feature is uninstalled", () => {
    vi.useFakeTimers();
    const requests: Array<Record<string, unknown>> = [];
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn((options: Record<string, unknown>) => {
      requests.push(options);
      return { abort: vi.fn() };
    }));
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      callback();
      return 1;
    });
    const controller = createController({ isEnabled: () => true, clickMode: () => "double" });
    controller.mount();
    const link = document.createElement("a");
    link.href = "https://cache.example/page";
    document.body.append(link);
    link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    vi.advanceTimersByTime(250);
    (requests[0]!.onload as (response: Record<string, unknown>) => void)({
      status: 200,
      responseText: "<html><body>cached preview content</body></html>",
      responseHeaders: "content-type: text/html",
      finalUrl: link.href,
    });

    expect(vi.getTimerCount()).toBeGreaterThan(0);
    controller.setEnabled(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
