// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreviewController } from "../src/preview/upstream-preview-controller";

describe("vendored upstream previewer", () => {
  afterEach(() => {
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

    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "double" });
    controller.mount();
    const owner = document.createElement("iframe");
    owner.getBoundingClientRect = () => ({ left: 100, top: 80 } as DOMRect);
    document.body.append(owner);

    controller.openFromFrame("https://first.example/app", owner, { left: 20, bottom: 30 });
    const firstFrame = document.querySelector<HTMLIFrameElement>(".agy-preview-iframe")!;
    expect(firstFrame.getAttribute("sandbox")).toBe("allow-scripts allow-same-origin allow-forms");
    expect(firstFrame.name).toMatch(/^agy-preview-frame:\d+$/);
    expect(document.querySelector(".agy-refresh-btn")).not.toBeNull();
    expect(document.querySelector(".agy-loading-overlay")).toBeNull();
    expect(document.querySelector(".agy-click-mode-toggle")).toBeNull();
    expect(requests).toHaveLength(1);

    (requests[0]!.onload as (response: Record<string, unknown>) => void)({
      status: 200,
      responseText: '<html><head><title>First</title><link rel="stylesheet" href="./app.css"><script src="/app.js"></script></head><body><main>First body</main><img srcset="./small.png 1x, /large.png 2x"></body></html>',
      responseHeaders: "content-type: text/html",
    });
    await vi.waitFor(() => expect(firstFrame.srcdoc).toContain("agyPreviewContentReady"));
    expect(firstFrame.srcdoc).toContain('src="https://first.example/app.js"');
    expect(firstFrame.srcdoc).toContain('href="https://first.example/app.css"');
    expect(firstFrame.srcdoc).toContain('srcset="https://first.example/small.png 1x, https://first.example/large.png 2x"');

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
});
