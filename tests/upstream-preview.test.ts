// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { PreviewController } from "../src/preview/upstream-preview-controller";
import { installLinkHoverPreviewer } from "../src/preview/link-hover-previewer-upstream";

const loadPreviewer = () => installLinkHoverPreviewer;

describe("vendored upstream previewer", () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
    document.head.querySelectorAll("style").forEach((style) => style.remove());
    delete window.__LDU_TEST_MODE__;
  });

  it("keeps the 4.13.1 frame lifecycle, multi-tab window and narrow host adaptations", async () => {
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

    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "double", loadPreviewer });
    controller.mount();
    const hoverLink = document.createElement("a");
    hoverLink.href = "https://hover.example/file.zip";
    document.body.append(hoverLink);
    hoverLink.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(requests).toHaveLength(0);

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
    await vi.waitFor(() => expect(requests).toHaveLength(1));

    (requests[0]!.onload as (response: Record<string, unknown>) => void)({
      status: 200,
      responseText: '<html><head><title>First</title><link rel="stylesheet" href="./app.css"><script src="/app.js"></script></head><body><main>First body</main><img srcset="./small.png 1x, /large.png 2x"></body></html>',
      responseHeaders: "content-type: text/html",
    });
    await vi.waitFor(() => expect(firstFrame.srcdoc).toContain("agyPreviewContentReady"));
    expect(firstFrame.srcdoc).toContain("agyPreviewActivity");
    expect(firstFrame.srcdoc).toContain('<base href="https://first.example/app">');
    expect(firstFrame.srcdoc).toContain('src="/app.js"');
    expect(firstFrame.srcdoc).toContain('href="./app.css"');
    expect(firstFrame.srcdoc).toContain('srcset="./small.png 1x, /large.png 2x"');

    controller.openFromFrame("https://second.example/page", owner, { left: 20, bottom: 30 });
    expect(document.querySelectorAll(".agy-preview-tab")).toHaveLength(2);
    expect(document.querySelectorAll(".agy-preview-iframe")).toHaveLength(2);
    await vi.waitFor(() => expect(requests).toHaveLength(2));

    document.querySelector<HTMLButtonElement>(".agy-refresh-btn")!.click();
    await vi.waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[2]!.headers).toEqual({ "Cache-Control": "no-cache", Pragma: "no-cache" });

    const external = document.querySelector<HTMLAnchorElement>(".agy-open-btn")!;
    external.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector(".agy-preview-container")).toBeNull());
  });

  it("delays installing the upstream runtime until preview is enabled", () => {
    let enabled = false;
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn());
    const controller = new PreviewController({ isEnabled: () => enabled, clickMode: () => "double", loadPreviewer });

    controller.mount();
    expect(document.head.textContent).not.toContain(".agy-preview-container");

    enabled = true;
    controller.mount();
    expect(document.head.textContent).toContain(".agy-preview-container");

    const styleCount = document.head.querySelectorAll("style").length;
    controller.mount();
    expect(document.head.querySelectorAll("style")).toHaveLength(styleCount);
  });

  it("keeps the upstream 4.13.1 loading core byte-equivalent", () => {
    const expected: Record<string, string> = {
      setCache: "e85ff1451484f6e42f113cb4c6d3bbcb6eb1953f86249344842dc8a5fc4fe5f7",
      ensurePreparedCacheEntry: "a02efbcf27b82cc7d5c1521f632a182f6415d7fb0cbdaa998011a938b0495389",
      prefetchUrl: "266d99edbf61c4d963cc9bc147b10bee21d596f489e0a2ea0b1714b337724b67",
      startLoad: "d4a9d12bc960a798f76f4cfa4b45e751d1b22645fd45c7f34ae7a5dc5d56eece",
      loadPageImmediate: "6c8ab40dc4348700eb8778ccf2e82bf8f49f791a91c6a7f436ad3eeb96086905",
      prepareDynamicHtml: "696a9687621386f12265444d855d9ec38df46ef1b33f9ac3c6fd8cdf1b949986",
      handleDynamicPageLoaded: "f59ef8b8b97c010501567c06ed66efb1014e63ebc3b984223918e23fd9bada1b",
      renderDirectDynamicPage: "845743d28df8a27f40714562ddf7a310d9cdfaaa6f96012ade418773b63105b8",
      renderFetchedDynamicPage: "f3bc9e62da7b8e21c37fd90240011cd000ea87177070528598a3b90374b0930d",
    };
    const path = resolve(process.cwd(), "src/preview/link-hover-previewer-upstream.ts");
    const source = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
    const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const actual: Record<string, string> = {};
    const visit = (node: ts.Node): void => {
      if (ts.isFunctionDeclaration(node) && node.name && expected[node.name.text]) {
        actual[node.name.text] = createHash("sha256").update(node.getText(file)).digest("hex");
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
    expect(actual).toEqual(expected);
  });

  it("leaves internal topic navigation to the split-layout router", () => {
    vi.useFakeTimers();
    window.__LDU_TEST_MODE__ = true;
    vi.stubGlobal("GM_getValue", vi.fn((_key: string, fallback: unknown) => fallback));
    vi.stubGlobal("GM_setValue", vi.fn());
    vi.stubGlobal("GM_xmlhttpRequest", vi.fn());
    const controller = new PreviewController({ isEnabled: () => true, clickMode: () => "double", loadPreviewer });
    controller.mount();
    const topic = document.createElement("a");
    topic.href = `${location.origin}/t/topic/42`;
    topic.textContent = "站内帖子";
    document.body.append(topic);

    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, detail: 1 });
    topic.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    const doubleClick = new MouseEvent("dblclick", { bubbles: true, cancelable: true, button: 0, detail: 2 });
    topic.dispatchEvent(doubleClick);
    expect(doubleClick.defaultPrevented).toBe(false);
  });
});
