import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { preparePreviewHtml, sanitizePreviewHtml } from "../src/preview/sanitizer";

describe("preview sanitizer", () => {
  it("removes executable and active content while preserving safe text", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const html = sanitizePreviewHtml(
      '<script>window.stolen=true</script><form><input></form><p onclick="bad()">hello</p><img src="/a.png">',
      "https://example.com/path/page",
      dom.window.document,
    );
    expect(html).toContain("hello");
    expect(html).not.toMatch(/<script|<form|<input|onclick=/i);
    expect(html).toContain("https://example.com/a.png");
  });

  it("removes unsafe URL schemes", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const html = sanitizePreviewHtml(
      '<a href="javascript:alert(1)">bad</a><img src="data:text/html,bad"><a href="https://safe.example/a">safe</a>',
      "https://example.com/",
      dom.window.document,
    );
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:text/html");
    expect(html).toContain("https://safe.example/a");
  });

  it("removes active SVG and namespaced URL attributes", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const html = sanitizePreviewHtml(
      '<svg><a xlink:href="javascript:alert(1)"><text>bad</text></a></svg><p xlink:href="https://evil.example">safe text</p>',
      "https://example.com/",
      dom.window.document,
    );
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("xlink:href");
    expect(html).toContain("safe text");
  });

  it("preserves page styles while keeping executable content removed", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const html = sanitizePreviewHtml(
      '<html><head><link rel="stylesheet" href="/assets/app.css"><link rel="preload" href="/track"><style>.card{color:red;background:url(./bg.png)}</style></head><body><main class="card" style="display:grid">Styled</main><script>bad()</script></body></html>',
      "https://example.com/path/page",
      dom.window.document,
    );
    expect(html).toContain('rel="stylesheet"');
    expect(html).toContain("https://example.com/assets/app.css");
    expect(html).toContain(".card{color:red");
    expect(html).toContain('style="display:grid"');
    expect(html).not.toContain('rel="preload"');
    expect(html).not.toContain("<script");
  });

  it("prepares script-driven pages for an isolated dynamic sandbox", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const prepared = preparePreviewHtml(
      '<html><head><meta http-equiv="Content-Security-Policy" content="default-src none"><script src="/assets/app.js"></script></head><body><div id="app"></div><script>document.querySelector("#app").textContent="Ready"</script></body></html>',
      "https://example.com/app/",
      dom.window.document,
    );

    expect(prepared.dynamic).toBe(true);
    expect(prepared.html).toContain('<base href="https://example.com/app/">');
    expect(prepared.html).toContain('src="https://example.com/assets/app.js"');
    expect(prepared.html).toContain("document.querySelector");
    expect(prepared.html).toContain("ldu:external-preview-ready");
    expect(prepared.html).toContain("observer.disconnect");
    expect(prepared.html).not.toContain("Content-Security-Policy");
  });
});
