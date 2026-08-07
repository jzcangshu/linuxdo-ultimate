// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreviewController } from "../src/preview/preview-controller";

describe("preview controller", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("opens a cross-origin preview without iframe permission restrictions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      '<html><head><title>Example</title></head><body><form></form><p>Preview body</p></body></html>',
      { status: 200 },
    )));
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1600);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(1000);
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const link = document.createElement("a");
    link.href = "https://example.com/page";
    link.textContent = "Example";
    document.body.append(link);

    const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(document.querySelector<HTMLIFrameElement>(".ldu-preview-frame")?.srcdoc).toContain("Preview body"));

    const frame = document.querySelector<HTMLIFrameElement>(".ldu-preview-frame")!;
    expect(frame.hasAttribute("sandbox")).toBe(false);
    expect(frame.srcdoc).not.toContain("<script");
    expect(frame.srcdoc).not.toContain("<form");
    expect(document.querySelector(".ldu-preview-title")?.textContent).toBe("Example");
    controller.close();
  });

  it("opens a preview positioned from an embedded topic link", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      "<html><head><title>Embedded</title></head><body>Frame link</body></html>",
      { status: 200 },
    )));
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1600);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(1000);
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const frame = document.createElement("iframe");
    frame.getBoundingClientRect = () => ({ left: 200, top: 100 } as DOMRect);
    document.body.append(frame);

    controller.openFromFrame("https://example.com/embedded", frame, { left: 25, bottom: 40 });
    await vi.waitFor(() => expect(document.querySelector(".ldu-preview-title")?.textContent).toBe("Embedded"));
    const preview = document.querySelector<HTMLElement>(".ldu-preview-container")!;
    expect(preview.style.left).toBe("225px");
    expect(preview.style.top).toBe("148px");
    controller.close();
  });

  it("does not hijack structural navigation links", () => {
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const header = document.createElement("header");
    header.className = "d-header";
    const logo = document.createElement("a");
    logo.href = "https://linux.do/";
    header.append(logo);
    document.body.append(header);
    let preventedByController = true;
    document.addEventListener("click", (event) => {
      preventedByController = event.defaultPrevented;
      event.preventDefault();
    }, { capture: true, once: true });

    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    logo.dispatchEvent(click);
    expect(preventedByController).toBe(false);
    expect(document.querySelector(".ldu-preview-container")).toBeNull();
  });

  it("moves the preview by dragging its header and keeps it inside the viewport", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html><body>Preview</body></html>", { status: 200 })));
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1200);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const frame = document.createElement("iframe");
    frame.getBoundingClientRect = () => ({ left: 0, top: 0 } as DOMRect);
    document.body.append(frame);
    controller.openFromFrame("https://example.com/drag", frame, { left: 100, bottom: 100 });
    await vi.waitFor(() => expect(document.querySelector(".ldu-preview-container")).not.toBeNull());

    const title = document.querySelector<HTMLElement>(".ldu-preview-title")!;
    title.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: 150, clientY: 150 }));
    window.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, cancelable: true, clientX: 350, clientY: 300 }));
    window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 350, clientY: 300 }));

    const preview = document.querySelector<HTMLElement>(".ldu-preview-container")!;
    expect(preview.style.left).toBe("208px");
    expect(preview.style.top).toBe("138px");
    expect(preview.classList.contains("ldu-preview-dragging")).toBe(false);
    controller.close();
  });

  it("closes after opening the preview target in a new tab without cancelling the link", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html><body>Preview</body></html>", { status: 200 })));
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const frame = document.createElement("iframe");
    document.body.append(frame);
    controller.openFromFrame("https://example.com/open", frame, { left: 0, bottom: 0 });
    await vi.waitFor(() => expect(document.querySelector(".ldu-preview-container")).not.toBeNull());

    const external = document.querySelector<HTMLAnchorElement>('.ldu-preview-actions a[target="_blank"]')!;
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    external.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    expect(document.querySelector(".ldu-preview-container")).toBeNull();
  });

  it("renders an image response as an image instead of binary text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("binary image bytes", {
      status: 200,
      headers: { "Content-Type": "image/png" },
    })));
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const frame = document.createElement("iframe");
    document.body.append(frame);
    controller.openFromFrame("https://example.com/photo", frame, { left: 0, bottom: 0 });

    await vi.waitFor(() => expect(document.querySelector(".ldu-preview-title")?.textContent).toBe("图片预览"));
    const previewFrame = document.querySelector<HTMLIFrameElement>(".ldu-preview-frame")!;
    expect(previewFrame.src).toBe("https://example.com/photo");
    expect(previewFrame.srcdoc).toBe("");
    controller.close();
  });

  it("uses the final redirected URL without restricting script-driven pages", async () => {
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn((options: {
      onload: (response: Record<string, unknown>) => void;
    }) => {
      options.onload({
        status: 200,
        responseText: '<html><head><script src="./app.js"></script></head><body><main id="app"></main></body></html>',
        responseHeaders: "content-type: text/html; charset=utf-8",
        finalUrl: "https://cdn.example.net/application/",
      });
      return { abort: vi.fn() };
    }));
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const frame = document.createElement("iframe");
    document.body.append(frame);
    controller.openFromFrame("https://example.com/redirect", frame, { left: 0, bottom: 0 });

    await vi.waitFor(() => expect(document.querySelector<HTMLIFrameElement>(".ldu-preview-frame")?.srcdoc)
      .toContain("https://cdn.example.net/application/app.js"));
    const previewFrame = document.querySelector<HTMLIFrameElement>(".ldu-preview-frame")!;
    expect(previewFrame.hasAttribute("sandbox")).toBe(false);
    controller.close();
  });

  it("keeps compatible previews unrestricted after explicit opt-in", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      '<html><head><script src="/app.js"></script></head><body><main id="app"></main></body></html>',
      { status: 200, headers: { "Content-Type": "text/html" } },
    )));
    const controller = new PreviewController({
      isEnabled: () => true,
      clickMode: () => "single",
      allowSameOrigin: () => true,
    });
    controller.mount();
    const owner = document.createElement("iframe");
    document.body.append(owner);
    controller.openFromFrame("https://example.com/app", owner, { left: 0, bottom: 0 });

    await vi.waitFor(() => expect(document.querySelector<HTMLIFrameElement>(".ldu-preview-frame")?.srcdoc)
      .toContain('src="/app.js"'));
    expect(document.querySelector<HTMLIFrameElement>(".ldu-preview-frame")?.hasAttribute("sandbox"))
      .toBe(false);
    const previewFrame = document.querySelector<HTMLIFrameElement>(".ldu-preview-frame")!;
    expect(previewFrame.contentWindow?.name).toBe(previewFrame.name);
    controller.close();
  });

  it("does not let a cancelled response replace a newer preview", async () => {
    const requests: Array<{ onload: (response: Record<string, unknown>) => void }> = [];
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn((options: { onload: (response: Record<string, unknown>) => void }) => {
      requests.push(options);
      return { abort: vi.fn() };
    }));
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const owner = document.createElement("iframe");
    document.body.append(owner);

    controller.openFromFrame("https://first.example/page", owner, { left: 0, bottom: 0 });
    controller.openFromFrame("https://second.example/page", owner, { left: 0, bottom: 0 });
    requests[1]!.onload({
      status: 200,
      responseText: "<html><head><title>Second</title></head><body>new content</body></html>",
      responseHeaders: "content-type: text/html",
      finalUrl: "https://second.example/page",
    });
    requests[0]!.onload({
      status: 200,
      responseText: "<html><head><title>First</title></head><body>stale content</body></html>",
      responseHeaders: "content-type: text/html",
      finalUrl: "https://first.example/page",
    });

    await vi.waitFor(() => expect(document.querySelector(".ldu-preview-title")?.textContent).toBe("Second"));
    expect(document.querySelector<HTMLIFrameElement>(".ldu-preview-frame")?.srcdoc).toContain("new content");
    expect(document.querySelector<HTMLIFrameElement>(".ldu-preview-frame")?.srcdoc).not.toContain("stale content");
    controller.close();
  });

  it("aborts an unfinished request when the preview closes", () => {
    const abort = vi.fn();
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn(() => ({ abort })));
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const owner = document.createElement("iframe");
    document.body.append(owner);

    controller.openFromFrame("https://slow.example/page", owner, { left: 0, bottom: 0 });
    controller.close();

    expect(abort).toHaveBeenCalledOnce();
    expect(document.querySelector(".ldu-preview-container")).toBeNull();
  });

  it("refreshes only the preview with no-cache headers from its toolbar button", async () => {
    const requests: Array<Record<string, unknown>> = [];
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn((options: Record<string, unknown>) => {
      requests.push(options);
      const onload = options.onload as (response: Record<string, unknown>) => void;
      onload({
        status: 200,
        responseText: "<html><head><title>Fresh</title></head><body>content</body></html>",
        responseHeaders: "content-type: text/html",
        finalUrl: "https://example.com/page",
      });
      return { abort: vi.fn() };
    }));
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "single" });
    controller.mount();
    const owner = document.createElement("iframe");
    document.body.append(owner);
    controller.openFromFrame("https://example.com/page", owner, { left: 0, bottom: 0 });
    await vi.waitFor(() => expect(document.querySelector(".ldu-preview-title")?.textContent).toBe("Fresh"));

    document.querySelector<HTMLButtonElement>('[aria-label="刷新预览"]')!.click();
    await vi.waitFor(() => expect(requests).toHaveLength(2));

    expect(requests[1]?.headers).toEqual({ "Cache-Control": "no-cache", Pragma: "no-cache" });
    expect(document.querySelector(".ldu-preview-container")).not.toBeNull();
    controller.close();
  });
});
