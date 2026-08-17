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
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical \.ldu-tab-button\s*\{[^}]+min-height:\s*2\.75em[^}]+font-size:\s*var\(--font-0,/s);
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical \.ldu-topic-toolbar \.ldu-tab-strip\s*\{[^}]+gap:\s*\.35em/s);
    expect(APP_STYLES).toContain("--ldu-vertical-tabs-collapsed: calc(var(--font-0, 1rem) * 2.75)");
    expect(APP_STYLES).not.toContain(".ldu-tab-pin");
    expect(APP_STYLES).toMatch(/\.ldu-tab-strip\s*\{[^}]+gap:\s*3px/s);
    expect(APP_STYLES).toMatch(/\.ldu-tab-item\s*\{[^}]+flex:\s*1 1 0/s);
    expect(APP_STYLES).toMatch(/\.ldu-tab-item\s*\{[^}]+min-width:\s*72px/s);
    expect(APP_STYLES).not.toMatch(/\.ldu-tab-item\s*\{[^}]+width:\s*min\(210px/s);
    expect(APP_STYLES).toMatch(/\.ldu-tab-strip\.is-category-colors-enabled \.ldu-tab-item\s*\{[^}]+color-mix\(in srgb,\s*var\(--ldu-tab-category-color\)\s*14%,\s*transparent\)/s);
    expect(APP_STYLES).toMatch(/\.ldu-tab-strip\.is-category-colors-enabled \.ldu-tab-item\.is-active\s*\{[^}]+box-shadow:\s*inset 0 -3px/s);
  });

  it("expands vertical tabs as an overlay without resizing the active iframe on hover", () => {
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical:not\(\.ldu-layout-two\)[^}]+#ldu-topic-panel[^{]*\{[^}]+grid-template-columns:\s*var\(--ldu-vertical-tabs-collapsed\)\s+minmax\(0,\s*1fr\)/s);
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical \.ldu-topic-toolbar\s*\{[^}]+--ldu-tabs-collapsed-clip:\s*inset\(0 calc\(100% - var\(--ldu-vertical-tabs-collapsed\)\) 0 0\)[^}]+clip-path:\s*var\(--ldu-tabs-collapsed-clip\)/s);
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical:not\(\.ldu-layout-two\) \.ldu-topic-content\s*\{[^}]+grid-column:\s*2/s);
    expect(APP_STYLES).toMatch(/ldu-topic-toolbar:hover[^}]+clip-path:\s*inset\(0\)/s);
    expect(APP_STYLES).not.toMatch(/#ldu-(?:secondary-)?topic-panel > \.ldu-topic-toolbar[^}]+clip-path:\s*inset\(0 (?:calc|0)/s);
    expect(APP_STYLES).not.toMatch(/ldu-tabs-vertical \.ldu-topic-toolbar\s*\{[^}]+transition:[^;}]*width/s);
    expect(APP_STYLES).toMatch(/prefers-reduced-motion:\s*reduce[^}]+ldu-topic-toolbar[^}]+transition-duration:\s*\.01ms/s);
  });

  it("anchors the vertical rail itself to the viewport edge", () => {
    expect(APP_STYLES).not.toContain("ldu-vertical-tabs-edge-hit");
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical\.ldu-layout-two[^}]+#ldu-topic-panel[^{]+#ldu-secondary-topic-panel[^}]+grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical\.ldu-layout-two \.ldu-topic-toolbar[^}]+--ldu-tabs-collapsed-clip:\s*inset\(0 0 0 calc\(100% - var\(--ldu-vertical-tabs-collapsed\)\)\)[^}]+position:\s*absolute[^}]+right:\s*0/s);
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical\.ldu-vertical-tabs-static \.ldu-topic-toolbar[^}]+position:\s*relative[^}]+clip-path:\s*inset\(0\)/s);
    expect(APP_STYLES).toMatch(/ldu-layout-two\.ldu-vertical-tabs-static \.ldu-topic-toolbar[^}]+grid-column:\s*2/s);
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical\.ldu-layout-two \.ldu-topic-content[^}]+grid-column:\s*1/s);
    expect(APP_STYLES).toMatch(/ldu-layout-two[^}]+ldu-tab-strip[^}]+scrollbar-width:\s*none/s);
    expect(APP_STYLES).toMatch(/ldu-layout-three:not\(\.has-sidebar-page\)[^}]+#ldu-topic-panel[^}]+border-left:\s*0/s);
    expect(APP_STYLES).toMatch(/ldu-layout-two:not\(\.ldu-secondary-open\)[^}]+#ldu-topic-panel[^}]+border-right:\s*0/s);
    expect(APP_STYLES).not.toMatch(/is-pointer-focused/);
    expect(APP_STYLES).not.toMatch(/ldu-topic-toolbar:focus-within/);
  });

  it("lets every expanded vertical-rail state override either collapsed direction", () => {
    expect(APP_STYLES).toMatch(/ldu-topic-toolbar:hover,[^{]+ldu-topic-toolbar:has\(:focus-visible\),[^{]+ldu-topic-toolbar\.is-interaction-locked,[^{]+ldu-tab-strip\.is-reordering\)[^{]*\{[^}]+clip-path:\s*inset\(0\)/s);
    expect(APP_STYLES).toMatch(/ldu-vertical-tabs-static \.ldu-topic-toolbar\s*\{[^}]+clip-path:\s*inset\(0\)/s);
    expect(APP_STYLES).toMatch(/@media \(hover:\s*none\)[\s\S]+?ldu-tabs-vertical \.ldu-topic-toolbar\s*\{[^}]+clip-path:\s*inset\(0\)/s);
  });

  it("mirrors right-side vertical tab indicators and the heading icon", () => {
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical\.ldu-layout-two \.ldu-tab-item\.is-active\s*\{[^}]+box-shadow:\s*inset -3px 0 0 var\(--ldu-accent\)/s);
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical\.ldu-layout-two \.ldu-tab-strip\.is-category-colors-enabled \.ldu-tab-item\.is-active\s*\{[^}]+box-shadow:\s*inset -3px 0 0 color-mix/s);
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical\.ldu-layout-two \.ldu-vertical-tabs-heading > \.ldu-symbol[^}]+order:\s*2[^}]+transform:\s*scaleX\(-1\)/s);
    expect(APP_STYLES).toMatch(/ldu-tabs-vertical\.ldu-layout-two \.ldu-vertical-tabs-heading-label[^}]+text-align:\s*right/s);
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

  it("gives update notes a readable card without restyling dependent rows", () => {
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-modal\s*\{[^}]+overflow:\s*hidden/s);
    expect(APP_STYLES).not.toContain(".dc-child-row");
    expect(APP_STYLES).toMatch(/\.dc-dropdown-menu\.ldu-update-menu\s*\{[^}]+box-sizing:\s*border-box[^}]+width:\s*min\(400px,\s*calc\(100vw - 24px\)\)[^}]+padding:\s*16px/s);
    expect(APP_STYLES).toMatch(/\.ldu-update-summary\s*\{[^}]+font-size:\s*var\(--font-down-1,/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-version\s*\{[^}]+font-size:\s*var\(--font-down-2,/s);
    expect(APP_STYLES).toMatch(/\.ldu-tab-group-header\s*\{[^}]+font-size:\s*var\(--font-down-1,/s);
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

  it("keeps both vertical rails on the side selected by the overall layout", () => {
    expect(APP_STYLES).toContain("body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-topic-panel,\nbody.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-secondary-topic-panel");
    expect(APP_STYLES).toContain("body.ldu-tabs-vertical.ldu-layout-two #ldu-topic-panel,\nbody.ldu-tabs-vertical.ldu-layout-two #ldu-secondary-topic-panel");
    expect(APP_STYLES).not.toContain("body.ldu-tabs-vertical.ldu-layout-two.ldu-secondary-open #ldu-topic-panel");
  });

  it("uses the supplied compact hierarchical settings surface", () => {
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel\s*\{[^}]+font-family:\s*var\(--font-family,/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel\s*\{[^}]+top:\s*var\(--ldu-header-height\)[^}]+right:\s*0[^}]+bottom:\s*0/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel\s*\{[^}]+width:\s*min\(440px,\s*100vw\)[^}]+overflow:\s*hidden/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-modal\s*\{[^}]+height:\s*100%[^}]+overflow:\s*hidden/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-body\s*\{[^}]+min-height:\s*0[^}]+overflow-x:\s*hidden[^}]+overflow-y:\s*auto/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-header[^}]+flex:\s*none/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-footer[^}]+flex:\s*none/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-btn\s*\{[^}]+white-space:\s*nowrap/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-group-title\s*\{[^}]+font-size:\s*var\(--font-up-1,/s);
    expect(APP_STYLES).toContain(".ldu-settings-panel .ldu-settings-tree-row::after");
    expect(APP_STYLES).toContain(".ldu-settings-panel .ldu-settings-parent-group");
    expect(APP_STYLES).toContain('html[data-ldu-hide-posters="true"]');
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-item-title\s*\{[^}]+font-size:\s*var\(--font-down-1,/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-item-desc\s*\{[^}]+font-size:\s*var\(--font-down-2,/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-row\s*\{[^}]+padding:\s*10px 0/s);
    expect(APP_STYLES).toMatch(/\.ldu-settings-panel \.dc-dependent-row\[hidden\]\s*\{\s*display:\s*none/s);
    expect(APP_STYLES).toMatch(/\.ldu-brand-ultimate\s*\{[^}]+color:\s*#ffd43b/s);
    expect(APP_STYLES).toMatch(/\.ldu-update-available[^}]+border-color:\s*#ffd43b/s);
    expect(APP_STYLES).toContain("@keyframes ldu-update-pulse");
    expect(APP_STYLES).not.toContain("width: min(600px");
    expect(APP_STYLES).toContain("transform: translateX(100%)");
  });

  it("styles the Base64 utility in both direct and embedded topics", () => {
    for (const styles of [APP_STYLES, EMBEDDED_STYLES]) {
      expect(styles).toContain('[data-identifier="post-text-selection-toolbar"] .ldu-base64-trigger');
      expect(styles).toMatch(/\.ldu-base64-dialog\s*\{[^}]+position:\s*fixed[^}]+width:\s*min\(440px,/s);
      expect(styles).toMatch(/\.ldu-base64-body\s*\{[^}]+overflow-y:\s*auto/s);
      expect(styles).toMatch(/\.ldu-base64-drag-handle\s*\{[^}]+cursor:\s*move/s);
    }
  });
});
