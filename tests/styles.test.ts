import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/core/defaults";
import { APP_STYLES, EMBEDDED_STYLES } from "../src/ui/styles";

describe("split reading styles", () => {
  it("allocates the topic and list panes with adaptive proportions", () => {
    expect(DEFAULT_SETTINGS.paneSizes.listRatio).toBe(0.35);
    expect(APP_STYLES).toContain("--ldu-topic-track: 0.65fr");
    expect(APP_STYLES).toContain("--ldu-list-track: 0.35fr");
    expect(APP_STYLES).not.toContain("--ldu-list-width");
  });

  it("keeps a compact Discourse timeline in embedded topic geometry", () => {
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-topic[^}]+#main-outlet-wrapper[^}]+grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-topic[^}]+#main-outlet-wrapper[^}]+grid-template-areas:\s*"content"/s);
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-topic[^}]+\.container\.posts[^}]+grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(7\.5rem,\s*16%\)/s);
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-topic[^}]+\.container\.posts[^}]+grid-template-areas:\s*"posts timeline"/s);
    expect(EMBEDDED_STYLES).not.toMatch(/data-ldu-embedded-topic[^}]+\.topic-(?:navigation|timeline)[^}]+display:\s*none/s);
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-list[^}]+body[^}]+overflow-x:\s*hidden/s);
  });

  it("stacks timeline footer actions into a compact two-row grid", () => {
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-topic[^}]+\.timeline-footer-controls[^}]+display:\s*grid/s);
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-topic[^}]+\.timeline-footer-controls[^}]+grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-topic[^}]+\.show-summary[^}]+grid-column:\s*1\s*\/\s*-1/s);
  });

  it("keeps host and embedded rules in separate style payloads", () => {
    expect(APP_STYLES).not.toContain("data-ldu-embedded-topic");
    expect(APP_STYLES).not.toContain("data-ldu-embedded-list");
    expect(EMBEDDED_STYLES).not.toContain("#ldu-layout-shell");
    expect(EMBEDDED_STYLES).not.toContain(".ldu-settings-panel");
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-topic[^}]+\.d-header[^}]+display:\s*none\s*!important/s);
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-list[^}]+\.d-header[^}]+display:\s*none\s*!important/s);
  });

  it("uses the forum body size for topic tabs", () => {
    expect(APP_STYLES).toMatch(/\.ldu-tab-button\s*\{[^}]+font-size:\s*var\(--font-down-1,/s);
    expect(APP_STYLES).not.toContain(".ldu-tab-pin");
    expect(APP_STYLES).toMatch(/\.ldu-tab-strip\s*\{[^}]+gap:\s*3px/s);
    expect(APP_STYLES).toMatch(/\.ldu-tab-item\s*\{[^}]+flex:\s*1 1 0/s);
    expect(APP_STYLES).toMatch(/\.ldu-tab-item\s*\{[^}]+min-width:\s*72px/s);
    expect(APP_STYLES).not.toMatch(/\.ldu-tab-item\s*\{[^}]+width:\s*min\(210px/s);
    expect(APP_STYLES).toMatch(/\.ldu-tab-strip\.is-category-colors-enabled \.ldu-tab-item\s*\{[^}]+color-mix\(in srgb,\s*var\(--ldu-tab-category-color\)\s*14%,\s*transparent\)/s);
    expect(APP_STYLES).toMatch(/\.ldu-tab-strip\.is-category-colors-enabled \.ldu-tab-item\.is-active\s*\{[^}]+box-shadow:\s*inset 0 -3px/s);
  });

  it("removes the sidebar grid track when Discourse collapses the sidebar", () => {
    expect(APP_STYLES).toMatch(/ldu-layout-three:not\(\.has-sidebar-page\)[^}]+grid-template-areas:\s*"topic list"/s);
    expect(APP_STYLES).toMatch(/ldu-layout-two:not\(\.has-sidebar-page\)[^}]+grid-template-areas:\s*"list topic"/s);
    expect(APP_STYLES).toMatch(/ldu-layout-active:not\(\.has-sidebar-page\)[^}]+sidebar-wrapper[^}]+display:\s*none/s);
  });

  it("aligns the header to the viewport and keeps settings in the header", () => {
    expect(APP_STYLES).toMatch(/ldu-layout-active[^}]+\.d-header \.wrap[^}]+max-width:\s*none/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-host\s*\{[^}]+position:\s*relative/s);
    expect(APP_STYLES).not.toMatch(/\.ldu-settings-host\s*\{[^}]+bottom:\s*12px/s);
    expect(APP_STYLES).toContain("--ldu-header-height: var(--header-height, 0px)");
    expect(APP_STYLES).not.toContain("--ldu-header-height: 52px");
  });

  it("does not reserve fixed blank space below embedded content", () => {
    expect(APP_STYLES).not.toContain("padding: 12px clamp(12px, 3vw, 40px) 72px");
    expect(APP_STYLES).not.toContain("padding: 0 10px 32px");
    expect(APP_STYLES).toMatch(/\.ldu-topic-frame\s*\{[^}]+max-height:\s*none\s*!important/s);
  });

  it("keeps Discourse infinite loading on the independent list-frame scroll root", () => {
    expect(APP_STYLES).toMatch(/body\.ldu-layout-active\s*\{[^}]+overflow-y:\s*hidden\s*!important/s);
    expect(EMBEDDED_STYLES).toMatch(/data-ldu-embedded-list[^}]+body[^}]+overflow-y:\s*auto\s*!important/s);
    expect(APP_STYLES).toMatch(/\.ldu-list-frame\s*\{[^}]+height:\s*100%/s);
    expect(APP_STYLES).toMatch(/\.ldu-list-frame\s*\{[^}]+max-height:\s*none\s*!important/s);
    expect(APP_STYLES).toMatch(/#ldu-layout-shell\s*\{[^}]+position:\s*fixed/s);
  });

  it("uses the list iframe native scrollbar in right-detail mode", () => {
    expect(APP_STYLES).toMatch(/\.ldu-list-content\s*\{[^}]+grid-area:\s*list/s);
    expect(APP_STYLES).toMatch(/\.ldu-list-frame\s*\{[^}]+border:\s*0/s);
  });

  it("uses the supplied compact hierarchical settings surface", () => {
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel\s*\{[^}]+font-family:\s*var\(--font-family,/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel\s*\{[^}]+width:\s*min\(520px,/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-group-title\s*\{[^}]+font-size:\s*var\(--font-0,/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-item-title\s*\{[^}]+font-size:\s*var\(--font-down-1,/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-item-desc\s*\{[^}]+font-size:\s*var\(--font-down-2,/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-row\s*\{[^}]+padding:\s*10px 0/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-dependent-row\[hidden\]\s*\{\s*display:\s*none/s);
    expect(APP_STYLES).toMatch(/\.ldu-brand-ultimate\s*\{[^}]+color:\s*#ffd43b/s);
    expect(APP_STYLES).not.toContain("width: min(600px");
    expect(APP_STYLES).not.toMatch(/\.ldu-settings-panel\s*\{[^}]+max-height:/s);
    expect(APP_STYLES).not.toMatch(/\.ldu-settings-panel \.dc-body\s*\{[^}]+overflow(?:-y)?:/s);
  });
});
