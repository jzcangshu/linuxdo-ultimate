var R="linuxdo-ultimate-embedded-styles",F=`
[data-identifier="post-text-selection-toolbar"] .ldu-base64-trigger {
  flex: 0 0 auto;
}
[data-identifier="post-text-selection-toolbar"]:has(.ldu-base64-trigger) {
  max-width: min(500px, calc(100dvw - 20px)) !important;
}
@media (max-width: 520px) {
  [data-identifier="post-text-selection-toolbar"]:has(.ldu-base64-trigger) .quote-button .buttons {
    flex-wrap: wrap;
  }
}

.ldu-base64-dialog {
  position: fixed;
  z-index: 1000004;
  display: flex;
  width: min(440px, calc(100vw - 16px));
  max-height: min(560px, calc(100vh - 16px));
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ldu-border, #313131);
  border-radius: 6px;
  background: var(--ldu-surface, #222);
  box-shadow: 0 14px 34px rgb(0 0 0 / 42%);
  color: var(--ldu-text, #ddd);
  font-family: var(--font-family, Inter, Arial, sans-serif);
  opacity: 1;
  transform: translateY(0) scale(1);
  transform-origin: top left;
  transition: opacity 160ms ease-out, transform 180ms var(--ldu-ease-out, cubic-bezier(.23, 1, .32, 1));
}

.ldu-base64-dialog[hidden] { display: none; }
.ldu-base64-dialog[data-state="error"] { border-color: color-mix(in srgb, var(--ldu-danger, #d04437) 70%, var(--ldu-border, #313131)); }
.ldu-base64-dialog.is-dragging { cursor: move; user-select: none; }
.ldu-base64-dialog.is-dragging textarea { pointer-events: none; }
.ldu-base64-header,
.ldu-base64-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: none;
  padding: 10px 12px;
  border-color: var(--ldu-border, #313131);
  background: var(--ldu-surface-muted, #2a2a2a);
}
.ldu-base64-header { border-bottom: 1px solid var(--ldu-border, #313131); }
.ldu-base64-footer { justify-content: flex-end; border-top: 1px solid var(--ldu-border, #313131); }
.ldu-base64-drag-handle { display: flex; min-width: 0; flex: 1; align-items: baseline; gap: 8px; cursor: move; outline: 0; }
.ldu-base64-title { color: var(--ldu-text, #ddd); font-size: 15px; font-weight: 700; }
.ldu-base64-subtitle { color: var(--primary-medium, #999); font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.ldu-base64-close { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 4px; background: transparent; color: var(--primary-medium, #999); cursor: pointer; }
.ldu-base64-close:hover { background: var(--primary-low, #333); color: var(--ldu-text, #ddd); }
.ldu-base64-body { display: grid; min-height: 0; gap: 12px; overflow-x: hidden; overflow-y: auto; padding: 14px 12px; }
.ldu-base64-field { display: grid; gap: 6px; color: var(--primary-medium, #aaa); font-size: 12px; font-weight: 600; }
.ldu-base64-field textarea { width: 100%; min-height: 92px; max-height: 220px; box-sizing: border-box; resize: vertical; border: 1px solid var(--ldu-border, #313131); border-radius: 4px; background: color-mix(in srgb, var(--ldu-text, #ddd) 5%, var(--ldu-surface, #222)); color: var(--ldu-text, #ddd); font: inherit; font-size: 13px; font-weight: 400; line-height: 1.5; padding: 9px 10px; }
.ldu-base64-field textarea:focus { border-color: var(--ldu-accent, #0088cc); outline: 2px solid color-mix(in srgb, var(--ldu-accent, #0088cc) 35%, transparent); outline-offset: 1px; }
.ldu-base64-output { background: color-mix(in srgb, var(--ldu-surface-muted, #2a2a2a) 78%, var(--ldu-surface, #222)); }
.ldu-base64-mode { display: inline-flex; justify-self: start; padding: 2px; border: 1px solid var(--ldu-border, #313131); border-radius: 4px; background: var(--ldu-surface-muted, #2a2a2a); }
.ldu-base64-mode-button { min-width: 58px; padding: 5px 10px; border: 0; border-radius: 2px; background: transparent; color: var(--primary-medium, #aaa); cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
.ldu-base64-mode-button.is-active { background: var(--ldu-accent, #0088cc); color: #fff; }
.ldu-base64-status { min-height: 18px; color: var(--primary-medium, #aaa); font-size: 12px; line-height: 1.5; }
.ldu-base64-dialog[data-state="error"] .ldu-base64-status { color: var(--ldu-danger, #f85149); }
.ldu-base64-footer button { display: inline-flex; align-items: center; gap: 5px; min-height: 30px; padding: 5px 9px; border: 1px solid var(--ldu-border, #313131); border-radius: 4px; background: transparent; color: var(--ldu-text, #ddd); cursor: pointer; font: inherit; font-size: 12px; }
.ldu-base64-footer .ldu-base64-copy { border-color: var(--ldu-accent, #0088cc); background: var(--ldu-accent, #0088cc); color: #fff; }
.ldu-base64-dialog :is(button):active { transform: scale(.97); }
.ldu-base64-dialog :is(button, textarea):focus-visible { outline: 2px solid var(--ldu-accent, #0088cc); outline-offset: 2px; }
@media (max-width: 480px) {
  .ldu-base64-dialog { width: calc(100vw - 16px); }
  .ldu-base64-footer { flex-wrap: wrap; }
}
@media (prefers-reduced-motion: reduce) {
  .ldu-base64-dialog { transition-duration: 0ms; }
}
`,at=`
:root {
  --ldu-sidebar-width: 216px;
  --ldu-topic-track: 0.65fr;
  --ldu-list-track: 0.35fr;
  /* Set by LayoutController from the rendered Discourse header. */
  --ldu-header-height: var(--header-height, 0px);
  --ldu-border: var(--primary-low, #d9d9d9);
  --ldu-surface: var(--secondary, #fff);
  --ldu-surface-muted: var(--primary-very-low, #f5f5f5);
  --ldu-text: var(--primary, #222);
  --ldu-accent: var(--tertiary, #0088cc);
  --ldu-danger: var(--danger, #d04437);
  --ldu-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ldu-vertical-tabs-collapsed: calc(var(--font-0, 1rem) * 2.75);
}

html[data-ldu-hide-notices="true"] #global-notice-alert-global-notice,
html[data-ldu-hide-posters="true"] #main-outlet .topic-list .posters,
html[data-ldu-hide-category-badges="true"] #main-outlet .topic-list .badge-category__wrapper,
html[data-ldu-hide-tags="true"] #main-outlet .topic-list a.discourse-tag {
  display: none !important;
}

html[data-ldu-low-end="true"] *,
html[data-ldu-low-end="true"] *::before,
html[data-ldu-low-end="true"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

body.ldu-layout-active {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

html.ldu-layout-two-root {
  scrollbar-width: none;
}

html.ldu-layout-two-root::-webkit-scrollbar {
  width: 0;
  height: 0;
}

body.ldu-layout-active #main-container {
  width: 100% !important;
  max-width: none !important;
  padding-inline: 0 !important;
}

body.ldu-layout-active .d-header .wrap,
body.ldu-layout-active .d-header .contents {
  width: 100% !important;
  max-width: none !important;
}

body.ldu-layout-active .d-header .wrap {
  padding-inline: 8px !important;
}

body.ldu-layout-active #main-outlet-wrapper {
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  min-height: calc(100vh - var(--ldu-header-height)) !important;
  padding: 0 !important;
}

#ldu-layout-shell {
  position: fixed;
  z-index: 3;
  inset: var(--ldu-header-height) 0 0;
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  pointer-events: none;
}

#ldu-layout-shell[hidden] { display: none !important; }

body.ldu-layout-active.ldu-layout-three #ldu-layout-shell {
  grid-template-columns: var(--ldu-sidebar-width) minmax(0, var(--ldu-topic-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "sidebar topic list" !important;
}

body.ldu-layout-active.ldu-layout-three:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-topic-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "topic list" !important;
}

body.ldu-layout-active.ldu-layout-three.ldu-secondary-open #ldu-layout-shell {
  grid-template-columns: var(--ldu-sidebar-width) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "sidebar topic secondary-topic list" !important;
}

body.ldu-layout-active.ldu-layout-three.ldu-secondary-open:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "topic secondary-topic list" !important;
}

body.ldu-layout-active.ldu-layout-two #ldu-layout-shell {
  grid-template-columns: minmax(52px, var(--ldu-sidebar-width)) minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-track)) !important;
  grid-template-areas: "sidebar list topic" !important;
}

body.ldu-layout-active.ldu-layout-two:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-track)) !important;
  grid-template-areas: "list topic" !important;
}

body.ldu-layout-active.ldu-layout-two.ldu-secondary-open #ldu-layout-shell {
  grid-template-columns: minmax(52px, var(--ldu-sidebar-width)) minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) !important;
  grid-template-areas: "sidebar list topic secondary-topic" !important;
}

body.ldu-layout-active.ldu-layout-two.ldu-secondary-open:not(.has-sidebar-page) #ldu-layout-shell {
  grid-template-columns: minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-split-track)) minmax(0, var(--ldu-topic-split-track)) !important;
  grid-template-areas: "list topic secondary-topic" !important;
}

body.ldu-layout-active #main-outlet-wrapper > .sidebar-wrapper {
  position: fixed !important;
  z-index: 6;
  top: var(--ldu-header-height) !important;
  bottom: 0;
  left: 0;
  width: var(--ldu-sidebar-width) !important;
  min-width: 0 !important;
  height: calc(100vh - var(--ldu-header-height)) !important;
  max-height: none !important;
  overflow: auto !important;
  background: var(--ldu-surface);
  border-right: 1px solid var(--ldu-border);
}

body.ldu-layout-active:not(.has-sidebar-page) #main-outlet-wrapper > .sidebar-wrapper {
  display: none !important;
}

body.ldu-layout-active #main-outlet {
  display: none !important;
}

.ldu-list-content {
  position: relative;
  grid-area: list;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  pointer-events: auto;
  background: var(--ldu-surface);
  border-inline: 1px solid var(--ldu-border);
}

.ldu-list-content.is-native-handoff {
  overflow: auto;
  overscroll-behavior: contain;
}

.ldu-list-content.is-native-handoff > #main-outlet {
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  min-height: 100% !important;
  margin: 0 !important;
  padding-inline: 8px !important;
  box-sizing: border-box;
}

.ldu-list-content.is-native-handoff > .ldu-list-frame {
  visibility: hidden;
  pointer-events: none;
}

.ldu-list-frame {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-height: none !important;
  border: 0;
  background: var(--ldu-surface);
}

@container (max-width: 480px) {
  #main-outlet .topic-list .views { display: none !important; }
  #main-outlet .topic-list .topic-list-data { padding-inline: 6px !important; }
}

@container (max-width: 410px) {
  #main-outlet .topic-list .activity { display: none !important; }
  #main-outlet .topic-list .main-link { width: 100% !important; }
}

#ldu-topic-panel,
#ldu-secondary-topic-panel {
  grid-area: topic;
  position: sticky;
  top: var(--ldu-header-height);
  display: flex;
  height: calc(100vh - var(--ldu-header-height));
  min-width: 0;
  min-height: 0;
  align-self: start;
  flex-direction: column;
  overflow: hidden;
  background: var(--ldu-surface);
  color: var(--ldu-text);
  border-inline: 1px solid var(--ldu-border);
  container-type: inline-size;
}

#ldu-layout-shell #ldu-topic-panel,
#ldu-layout-shell #ldu-secondary-topic-panel {
  position: relative;
  top: auto;
  width: auto;
  height: 100%;
  pointer-events: auto;
}

#ldu-topic-panel[hidden],
#ldu-secondary-topic-panel[hidden] { display: none !important; }

#ldu-secondary-topic-panel {
  grid-area: secondary-topic;
  border-left: 0;
}

body.ldu-layout-three:not(.has-sidebar-page) #ldu-topic-panel { border-left: 0; }
body.ldu-layout-two:not(.ldu-secondary-open) #ldu-topic-panel,
body.ldu-layout-two.ldu-secondary-open #ldu-secondary-topic-panel { border-right: 0; }

.ldu-topic-toolbar {
  display: flex;
  min-height: 38px;
  align-items: center;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
}

/* Vertical rails have four explicit states: left/right and auto/static. */
body.ldu-tabs-vertical #ldu-topic-panel,
body.ldu-tabs-vertical #ldu-secondary-topic-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
}

body.ldu-tabs-vertical .ldu-topic-content {
  grid-row: 1;
}

body.ldu-tabs-vertical .ldu-topic-toolbar {
  --ldu-tabs-collapsed-clip: inset(0 calc(100% - var(--ldu-vertical-tabs-collapsed)) 0 0);
  z-index: 4;
  grid-row: 1;
  display: flex;
  width: min(17rem, max(10rem, calc(100cqi - .75rem)));
  min-height: 0;
  height: 100%;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  border-right: 1px solid var(--ldu-border);
  box-shadow: 4px 0 14px rgb(0 0 0 / 12%);
  clip-path: var(--ldu-tabs-collapsed-clip);
  transition: clip-path 180ms var(--ldu-ease-out), opacity 180ms ease-out;
  transition-delay: 180ms;
}

/* A left-side detail layout keeps every rail on the left. */
body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-topic-panel,
body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-secondary-topic-panel {
  grid-template-columns: var(--ldu-vertical-tabs-collapsed) minmax(0, 1fr);
}

body.ldu-tabs-vertical:not(.ldu-layout-two) .ldu-topic-toolbar {
  position: relative;
  grid-column: 1;
}

body.ldu-tabs-vertical:not(.ldu-layout-two) .ldu-topic-content {
  grid-column: 2;
}

/* A right-side detail layout keeps every rail on the right. */
body.ldu-tabs-vertical.ldu-layout-two #ldu-topic-panel,
body.ldu-tabs-vertical.ldu-layout-two #ldu-secondary-topic-panel {
  grid-template-columns: minmax(0, 1fr);
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-toolbar {
  --ldu-tabs-collapsed-clip: inset(0 0 0 calc(100% - var(--ldu-vertical-tabs-collapsed)));
  position: absolute;
  inset-block: 0;
  right: 0;
  border-right: 0;
  border-left: 1px solid var(--ldu-border);
  box-shadow: -4px 0 14px rgb(0 0 0 / 12%);
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-content {
  grid-column: 1;
}

body.ldu-tabs-vertical .ldu-topic-toolbar:hover,
body.ldu-tabs-vertical .ldu-topic-toolbar:has(:focus-visible),
body.ldu-tabs-vertical .ldu-topic-toolbar.is-interaction-locked,
body.ldu-tabs-vertical .ldu-topic-toolbar:has(.ldu-tab-strip.is-reordering) {
  clip-path: inset(0);
  transition-delay: 80ms;
}

/* Fixed left rail. */
body.ldu-tabs-vertical.ldu-vertical-tabs-static:not(.ldu-layout-two) #ldu-topic-panel,
body.ldu-tabs-vertical.ldu-vertical-tabs-static:not(.ldu-layout-two) #ldu-secondary-topic-panel {
  grid-template-columns: min(17rem, max(10rem, 46%)) minmax(0, 1fr);
}

/* Fixed right rail. */
body.ldu-tabs-vertical.ldu-layout-two.ldu-vertical-tabs-static #ldu-topic-panel,
body.ldu-tabs-vertical.ldu-layout-two.ldu-vertical-tabs-static #ldu-secondary-topic-panel {
  grid-template-columns: minmax(0, 1fr) min(17rem, max(10rem, 46%));
}

body.ldu-tabs-vertical.ldu-vertical-tabs-static .ldu-topic-toolbar {
  position: relative;
  width: 100%;
  clip-path: inset(0);
  transition: none;
}

body.ldu-tabs-vertical.ldu-layout-two.ldu-vertical-tabs-static .ldu-topic-toolbar {
  right: auto;
  grid-column: 2;
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-actions {
  justify-content: flex-end;
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-vertical-tabs-heading {
  justify-content: flex-end;
  padding-right: 7px;
  padding-left: 0;
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-vertical-tabs-heading > .ldu-symbol {
  order: 2;
  transform: scaleX(-1);
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-vertical-tabs-heading-label {
  text-align: right;
}

body.ldu-tabs-vertical .ldu-tab-title,
body.ldu-tabs-vertical .ldu-tab-group-label {
  text-align: start;
}

body.ldu-tabs-vertical .ldu-topic-toolbar .ldu-tab-strip {
  flex-direction: column;
  min-height: 0;
  align-items: stretch;
  gap: .35em;
  padding: .55em .35em;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-toolbar .ldu-tab-strip {
  scrollbar-width: none;
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-toolbar .ldu-tab-strip::-webkit-scrollbar {
  display: none;
}

body.ldu-tabs-vertical .ldu-topic-toolbar .ldu-topic-actions {
  order: -1;
  justify-content: flex-start;
  min-height: 2.75em;
  border-bottom: 1px solid var(--ldu-border);
}

.ldu-vertical-tabs-heading { display: none; }

body.ldu-tabs-vertical .ldu-vertical-tabs-heading {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8px;
  padding-left: 7px;
  color: var(--primary-medium, #777);
  font-size: var(--font-down-1, .875rem);
  font-weight: 600;
  white-space: nowrap;
}

body.ldu-tabs-vertical .ldu-tab-item {
  position: relative;
  width: auto;
  min-width: 0;
  max-width: none;
  min-height: 2.75em;
  flex: 0 0 2.75em;
  border: 0;
  border-radius: .35em;
  font-size: var(--font-0, 1rem);
}

body.ldu-tabs-vertical .ldu-tab-button {
  display: flex;
  min-height: 2.75em;
  align-items: center;
  gap: .625em;
  padding: .625em .5em .625em .75em;
  font-size: var(--font-0, 1rem);
}

.ldu-tab-glyph {
  display: none;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  place-items: center;
  color: var(--ldu-tab-category-color, var(--primary-medium, #777));
}

body.ldu-tabs-vertical .ldu-tab-glyph { display: inline-grid; }

body.ldu-tabs-vertical .ldu-tab-close {
  width: 1.75em;
  height: 1.75em;
  margin-right: .25em;
}

body.ldu-tabs-vertical .ldu-tab-close .ldu-symbol {
  width: 1em;
  height: 1em;
}

.ldu-tab-title {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (hover: none) {
  body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-topic-panel,
  body.ldu-tabs-vertical:not(.ldu-layout-two) #ldu-secondary-topic-panel {
    grid-template-columns: min(17rem, max(10rem, 46%)) minmax(0, 1fr);
  }

  body.ldu-tabs-vertical.ldu-layout-two #ldu-topic-panel,
  body.ldu-tabs-vertical.ldu-layout-two #ldu-secondary-topic-panel {
    grid-template-columns: minmax(0, 1fr) min(17rem, max(10rem, 46%));
  }

  body.ldu-tabs-vertical .ldu-topic-toolbar {
    position: relative;
    width: 100%;
    clip-path: inset(0);
    transition: none;
  }

  body.ldu-tabs-vertical.ldu-layout-two .ldu-topic-toolbar {
    right: auto;
    grid-column: 2;
  }
}

body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-title,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-close,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-tab-group-label,
body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-topic-toolbar:not(:hover):not(:has(:focus-visible)):not(.is-interaction-locked):not(:has(.ldu-tab-strip.is-reordering)) .ldu-vertical-tabs-heading-label {
  visibility: hidden;
}

body.ldu-tabs-vertical .ldu-tab-item.is-active {
  box-shadow: inset 3px 0 0 var(--ldu-accent);
}

body.ldu-tabs-vertical .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active {
  background: color-mix(in srgb, var(--ldu-tab-category-color) 22%, var(--ldu-surface));
  box-shadow: inset 3px 0 0 color-mix(in srgb, var(--ldu-tab-category-color) 88%, var(--ldu-text));
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-tab-item.is-active {
  box-shadow: inset -3px 0 0 var(--ldu-accent);
}

body.ldu-tabs-vertical.ldu-layout-two .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active {
  box-shadow: inset -3px 0 0 color-mix(in srgb, var(--ldu-tab-category-color) 88%, var(--ldu-text));
}

.ldu-tab-group-header {
  display: flex;
  min-height: 26px;
  align-items: center;
  gap: 7px;
  padding: 6px 8px 2px;
  color: var(--primary-medium, #777);
  font-size: var(--font-down-1, .875rem);
  font-weight: 600;
  letter-spacing: 0;
  white-space: nowrap;
}

.ldu-tab-group-marker {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: var(--ldu-tab-category-color, var(--primary-medium, #777));
}

.ldu-tab-group-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

body.ldu-tabs-vertical:not(.ldu-vertical-tabs-static) .ldu-tab-group-header {
  padding-left: 18px;
}

body.ldu-tabs-vertical .ldu-tab-item.is-drop-before::before,
body.ldu-tabs-vertical .ldu-tab-item.is-drop-after::after {
  top: auto;
  bottom: auto;
  left: 5px;
  right: 5px;
  width: auto;
  height: 2px;
}

body.ldu-tabs-vertical .ldu-tab-item.is-drop-before::before { top: -2px; }
body.ldu-tabs-vertical .ldu-tab-item.is-drop-after::after { bottom: -2px; }

@media (prefers-reduced-motion: reduce) {
  body.ldu-tabs-vertical .ldu-topic-toolbar { transition-duration: .01ms; }
}

.ldu-tab-strip {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: stretch;
  gap: 3px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.ldu-tab-item {
  --ldu-tab-category-color: transparent;
  display: flex;
  width: auto;
  min-width: 72px;
  max-width: 220px;
  flex: 1 1 0;
  align-items: center;
  box-sizing: border-box;
  border-inline: 1px solid color-mix(in srgb, var(--ldu-border) 72%, transparent);
  background: transparent;
}

.ldu-tab-strip.is-category-colors-enabled .ldu-tab-item {
  background: color-mix(in srgb, var(--ldu-tab-category-color) 14%, transparent);
}

.ldu-tab-item.is-active {
  background: var(--ldu-surface);
  box-shadow: inset 0 -3px 0 var(--ldu-accent);
}

.ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active {
  background: color-mix(in srgb, var(--ldu-tab-category-color) 22%, var(--ldu-surface));
  box-shadow: inset 0 -3px 0 color-mix(in srgb, var(--ldu-tab-category-color) 88%, var(--ldu-text));
}

.ldu-tab-context-menu {
  position: fixed;
  z-index: 1000002;
  width: max-content;
  min-width: 270px;
  max-width: min(340px, calc(100vw - 16px));
  padding: 6px 0;
  overflow: hidden;
  color: var(--primary, #202124);
  border: 1px solid color-mix(in srgb, var(--primary, #202124) 14%, transparent);
  border-radius: 6px;
  background: var(--secondary, #fff);
  box-shadow: 0 8px 24px rgb(0 0 0 / 24%), 0 2px 6px rgb(0 0 0 / 18%);
  font-family: var(--font-family, Arial, sans-serif);
  font-size: var(--font-down-1, 0.875rem);
}

.ldu-context-item {
  display: grid;
  width: 100%;
  min-height: 32px;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 10px;
  padding: 5px 18px;
  color: inherit;
  border: 0;
  background: transparent;
  font: inherit;
  letter-spacing: 0;
  text-align: left;
  white-space: nowrap;
  cursor: default;
}

.ldu-context-item:hover,
.ldu-context-item:focus-visible { background: var(--primary-low, #e8eaed); outline: none; }
.ldu-context-item:disabled { opacity: 0.42; }
.ldu-context-icon { display: inline-flex; width: 18px; flex: none; align-items: center; justify-content: center; color: var(--primary-medium, #5f6368); pointer-events: none; }
.ldu-context-label { min-width: 0; justify-self: start; text-align: left; }
.ldu-context-item:disabled .ldu-context-icon { opacity: .75; }
.ldu-symbol { display: block; flex: none; pointer-events: none; }
.ldu-symbol-fill { fill: currentColor; }

.ldu-tab-item[draggable="true"] { cursor: grab; }
.ldu-tab-strip.is-reordering .ldu-tab-item {
  will-change: transform;
  transition: transform 150ms cubic-bezier(.2, .8, .2, 1), opacity 100ms ease-out;
}
.ldu-tab-item.is-dragging { cursor: grabbing; opacity: .52; }
.ldu-tab-item.is-drop-before::before,
.ldu-tab-item.is-drop-after::after {
  position: absolute;
  z-index: 2;
  top: 3px;
  bottom: 3px;
  width: 2px;
  border-radius: 1px;
  background: var(--ldu-accent);
  content: "";
  pointer-events: none;
}
.ldu-tab-item.is-drop-before::before { left: -3px; }
.ldu-tab-item.is-drop-after::after { right: -3px; }

@media (prefers-reduced-motion: reduce) {
  .ldu-tab-strip.is-reordering .ldu-tab-item { transition-duration: .01ms; }
}
.ldu-context-shortcut { justify-self: end; color: var(--primary-medium, #5f6368); }
.ldu-context-separator { height: 1px; margin: 5px 0; background: var(--primary-low, #dadce0); }

.ldu-tab-button {
  min-width: 0;
  flex: 1;
  padding: 7px 6px 7px 10px;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: var(--ldu-text);
  cursor: pointer;
  font: inherit;
  font-size: var(--font-down-1, .875rem);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ldu-tab-close {
  display: grid;
  width: 24px;
  height: 24px;
  margin-right: 2px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--primary-medium, #777);
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .ldu-tab-item:hover { background: var(--primary-low, #ddd); }
  .ldu-tab-item.is-active:hover { background: var(--ldu-surface); }
  .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item:hover { background: color-mix(in srgb, var(--ldu-tab-category-color) 18%, var(--primary-low, #ddd)); }
  .ldu-tab-strip.is-category-colors-enabled .ldu-tab-item.is-active:hover { background: color-mix(in srgb, var(--ldu-tab-category-color) 24%, var(--ldu-surface)); }
  .ldu-tab-close:hover { background: var(--ldu-danger); color: #fff; }
}

.ldu-topic-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  padding-inline: 4px;
}

.ldu-icon-button {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--ldu-text);
  cursor: pointer;
  transition: background-color 120ms ease, transform 120ms var(--ldu-ease-out);
}

.ldu-icon-button:active { transform: scale(0.97); }
.ldu-icon-button:focus-visible { outline: 2px solid var(--ldu-accent); outline-offset: 1px; }

@media (hover: hover) and (pointer: fine) {
  .ldu-icon-button:hover { background: var(--primary-low, #ddd); }
}

.ldu-topic-content {
  position: relative;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background: var(--ldu-surface);
}

.ldu-topic-empty {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--primary-medium, #777);
  font-size: 13px;
}

.ldu-topic-frame {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-height: none !important;
  border: 0;
  background: var(--ldu-surface);
}

.ldu-topic-frame[aria-hidden="true"] { display: none; }

.ldu-resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 5;
  width: 7px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: col-resize;
  touch-action: none;
}

.ldu-resize-handle::after {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 1px;
  background: transparent;
  content: "";
  transition: background-color 120ms ease;
}

.ldu-resize-handle:focus-visible::after,
.ldu-resize-handle:hover::after { background: var(--ldu-accent); }
.ldu-resize-before { left: -4px; }
.ldu-resize-after { right: -4px; }
body.ldu-layout-two .ldu-resize-after { display: none; }
body.ldu-layout-three:not(.has-sidebar-page) .ldu-resize-before { display: none; }


.ldu-settings-panel {
  position: fixed;
  top: var(--ldu-header-height);
  right: 0;
  bottom: 0;
  z-index: 1000001;
  display: block;
  width: min(440px, 100vw);
  max-height: none;
  box-sizing: border-box;
  overflow: hidden;
  color: var(--ldu-text);
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  transform-origin: center right;
  transition: opacity 180ms ease-out, transform 220ms var(--ldu-ease-out);
}

.ldu-settings-panel[hidden] { display: none; }

@starting-style {
  .ldu-settings-panel:not([hidden]) {
    opacity: 0;
    transform: translateX(100%);
  }
}

.ldu-settings-host {
  position: relative;
  z-index: 1000001;
  display: inline-flex;
  align-items: center;
  list-style: none;
}

.ldu-settings-host .ldu-icon-button {
  width: 32px;
  height: 32px;
  color: var(--header_primary, var(--ldu-text));
  font-size: var(--font-0, 1rem);
}

.ldu-settings-panel .dc-modal {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-right: 0;
  border-radius: 6px 0 0 6px;
  border: 1px solid var(--ldu-border);
  border-radius: 6px;
  background: var(--ldu-surface);
  box-shadow: 0 16px 36px rgb(0 0 0 / 55%);
}

.ldu-settings-panel .dc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 14px 20px;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
}

.ldu-settings-panel .dc-header h2 {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 0;
  padding: 0;
  color: var(--ldu-text);
  font-size: var(--font-up-1, 1.05rem);
  font-weight: 700;
  line-height: 1.3;
}

.ldu-settings-panel .ldu-brand-ultimate {
  color: #ffd43b;
  text-shadow: 0 1px 0 rgb(0 0 0 / 35%);
}

.ldu-settings-panel .ldu-settings-version {
  margin-left: 6px;
  color: var(--primary-medium, #8b949e);
  font-size: var(--font-down-2, .75rem);
  font-weight: 500;
  letter-spacing: 0;
}

.ldu-settings-panel .dc-close-btn {
  padding: 2px 6px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--primary-medium, #777);
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
}

.ldu-settings-panel .dc-close-btn:hover { background: var(--primary-low, #2a2d32); color: var(--ldu-text); }

.ldu-settings-panel .dc-body { min-height: 0; flex: 1 1 auto; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; padding: 18px 20px; scrollbar-gutter: stable; }

.ldu-settings-panel .dc-group { margin-bottom: 24px; padding: 0; border-top: 0; }
.ldu-settings-panel .dc-group:last-child { margin-bottom: 0; }

.ldu-settings-panel .dc-group-title {
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--ldu-border);
  color: var(--ldu-text);
  font-size: var(--font-up-1, 1.125rem);
  font-weight: 700;
  letter-spacing: 0;
}

.ldu-settings-panel .dc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ldu-border) 34%, transparent);
}

.ldu-settings-panel .dc-row:last-child { border-bottom: 0; }
.ldu-settings-panel .dc-dependent-row[hidden] { display: none; }
.ldu-settings-panel .ldu-settings-parent-group {
  border-bottom: 1px solid color-mix(in srgb, var(--ldu-border) 34%, transparent);
}
.ldu-settings-panel .ldu-settings-parent-group > .dc-row,
.ldu-settings-panel .ldu-settings-parent-group .ldu-settings-tree,
.ldu-settings-panel .ldu-settings-parent-group .ldu-settings-tree-row { border-bottom: 0; }
.ldu-settings-panel .ldu-settings-tree {
  position: relative;
  margin-left: 10px;
  padding-left: 22px;
}
.ldu-settings-panel .ldu-settings-tree::before {
  position: absolute;
  top: -12px;
  left: 0;
  height: 12px;
  border-left: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  content: "";
}
.ldu-settings-panel .ldu-settings-tree-row { position: relative; }
.ldu-settings-panel .ldu-settings-tree-row::before {
  position: absolute;
  top: -1px;
  bottom: -1px;
  left: -22px;
  border-left: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  content: "";
}
.ldu-settings-panel .ldu-settings-tree-row::after {
  position: absolute;
  top: 50%;
  left: -22px;
  width: 12px;
  border-top: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  content: "";
}
.ldu-settings-panel .ldu-settings-tree-row:last-child::before {
  width: 12px;
  bottom: 50%;
  border-bottom: 1px solid color-mix(in srgb, var(--primary-medium, #777) 38%, transparent);
  border-bottom-left-radius: 4px;
}
.ldu-settings-panel .ldu-settings-tree-row:last-child::after { display: none; }
.ldu-settings-panel .dc-label-box { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.ldu-settings-panel .dc-item-title { color: var(--ldu-text); font-size: var(--font-down-1, .875rem); font-weight: 600; line-height: 1.3; }
.ldu-settings-panel .dc-item-desc { color: var(--primary-medium, #8b949e); font-size: var(--font-down-2, .75rem); line-height: 1.35; }
.ldu-settings-panel .dc-item-desc.alert { color: var(--danger, #f85149); }
.ldu-settings-panel .ldu-settings-risk[hidden] { display: none; }
.ldu-settings-panel .ldu-settings-compact-row { min-height: 42px; }
.ldu-settings-panel .ldu-settings-check-grid { display: flex; flex: none; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px 14px; }
.ldu-settings-panel .ldu-settings-check { display: inline-flex; align-items: center; gap: 5px; color: var(--primary-medium, #8b949e); cursor: pointer; font-size: var(--font-down-2, .75rem); line-height: 1.2; white-space: nowrap; }
.ldu-settings-panel .ldu-settings-check input { width: 14px; height: 14px; margin: 0; accent-color: var(--ldu-accent); cursor: pointer; }

.ldu-settings-panel .dc-switch { position: relative; display: inline-block; width: 38px; height: 20px; flex: none; }
.ldu-settings-panel .dc-switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.ldu-settings-panel .dc-slider { position: absolute; inset: 0; border: 1px solid color-mix(in srgb, var(--primary-medium, #777) 70%, transparent); border-radius: 20px; background: color-mix(in srgb, var(--primary-medium, #777) 42%, transparent); cursor: pointer; transition: background-color 150ms ease, border-color 150ms ease; }
.ldu-settings-panel .dc-slider::before { position: absolute; width: 14px; height: 14px; bottom: 2px; left: 2px; border-radius: 50%; background: #d1d5db; content: ""; transition: transform 150ms var(--ldu-ease-out), background-color 150ms ease; }
.ldu-settings-panel .dc-switch input:checked + .dc-slider { border-color: var(--tertiary, #3b8ce0); background: var(--tertiary, #2d7ed2); }
.ldu-settings-panel .dc-switch input:checked + .dc-slider::before { transform: translateX(18px); background: #fff; }

.ldu-settings-panel .dc-pills { display: inline-flex; flex: none; padding: 2px; border: 1px solid var(--ldu-border); border-radius: 4px; background: var(--ldu-surface-muted); }
.ldu-settings-panel .dc-pill-btn { padding: 3px 9px; border: 0; border-radius: 2px; background: transparent; color: var(--primary-medium, #8b949e); cursor: pointer; font: inherit; font-size: var(--font-down-2, .75rem); font-weight: 500; transition: background-color 100ms ease, color 100ms ease, transform 100ms ease; }
.ldu-settings-panel .dc-pill-btn:hover { color: var(--ldu-text); }
.ldu-settings-panel .dc-pill-btn.active { background: color-mix(in srgb, var(--ldu-text) 10%, var(--ldu-surface-muted)); color: var(--ldu-text); font-weight: 600; }

.ldu-settings-panel .dc-range-group { display: flex; min-width: 0; flex: none; align-items: center; gap: 10px; }
.ldu-settings-panel .dc-range { width: 100px; height: 4px; margin: 0; border-radius: 2px; outline: 0; appearance: none; background: color-mix(in srgb, var(--primary-medium, #777) 42%, transparent); cursor: pointer; }
.ldu-settings-panel .dc-range::-webkit-slider-thumb { width: 14px; height: 14px; border: 0; border-radius: 2px; appearance: none; background: var(--ldu-accent); cursor: pointer; }
.ldu-settings-panel .dc-range::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 2px; background: var(--ldu-accent); cursor: pointer; }
.ldu-settings-panel .dc-range-number { min-width: 16px; color: var(--ldu-accent); font-family: ui-monospace, monospace; font-size: var(--font-down-1, .875rem); font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }

.ldu-settings-panel .dc-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex: none; padding: 12px 20px; border-top: 1px solid var(--ldu-border); background: var(--ldu-surface-muted); }
.ldu-settings-panel .dc-btn { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border: 1px solid var(--ldu-border); border-radius: 4px; background: color-mix(in srgb, var(--ldu-text) 5%, var(--ldu-surface-muted)); color: var(--ldu-text); cursor: pointer; font: inherit; font-size: var(--font-down-2, .8rem); font-weight: 500; text-decoration: none; white-space: nowrap; transition: background-color 120ms ease, transform 120ms var(--ldu-ease-out); }
.ldu-settings-panel .ldu-update-available,
.ldu-settings-host .ldu-update-available { border-color: #ffd43b; animation: ldu-update-pulse 1.6s ease-in-out infinite; }
@keyframes ldu-update-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgb(255 212 59 / 0%); }
  50% { box-shadow: 0 0 0 4px rgb(255 212 59 / 36%); }
}
@media (prefers-reduced-motion: reduce) {
  .ldu-settings-panel .ldu-update-available,
  .ldu-settings-host .ldu-update-available { animation: none; box-shadow: 0 0 0 3px rgb(255 212 59 / 32%); }
}
.ldu-settings-panel .dc-btn:hover { border-color: var(--primary-medium, #777); background: var(--primary-low, #2a2d32); }
.ldu-settings-panel .dc-btn-ghost { border-color: transparent; background: transparent; color: var(--primary-medium, #8b949e); }
.ldu-settings-panel .dc-btn-ghost:hover { border-color: transparent; background: color-mix(in srgb, var(--danger, #e45735) 10%, transparent); color: var(--danger, #e45735); }
.ldu-settings-panel .dc-footer-right { position: relative; display: flex; gap: 8px; }
.ldu-settings-panel .ldu-update-wrap { position: relative; }
.ldu-settings-panel .dc-dropdown-menu.ldu-update-menu {
  right: 0;
  width: min(420px, calc(100vw - 32px));
  min-width: min(360px, calc(100vw - 32px));
  max-width: none;
  gap: 10px;
  padding: 16px;
  border-radius: 8px;
}
.ldu-settings-panel .ldu-update-summary {
  display: grid;
  gap: 8px;
  color: var(--ldu-text);
  font-size: var(--font-down-1, .875rem);
  line-height: 1.55;
}
.ldu-settings-panel .ldu-update-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ldu-settings-panel .ldu-update-title { font-size: var(--font-0, 1rem); font-weight: 700; }
.ldu-settings-panel .ldu-update-version {
  padding: 2px 8px;
  border: 1px solid color-mix(in srgb, #ffd43b 55%, var(--ldu-border));
  border-radius: 999px;
  background: color-mix(in srgb, #ffd43b 12%, transparent);
  color: color-mix(in srgb, #ffd43b 78%, var(--ldu-text));
  font-size: var(--font-down-2, .75rem);
  font-weight: 700;
}
.ldu-settings-panel .ldu-update-date { color: var(--primary-medium, #8b949e); font-size: var(--font-down-2, .75rem); }
.ldu-settings-panel .ldu-update-changelog { margin: 0; padding-left: 20px; text-align: left; }
.ldu-settings-panel .ldu-update-changelog li + li { margin-top: 6px; }
.ldu-settings-panel .ldu-update-changelog li::marker { color: var(--ldu-accent); }
.ldu-settings-panel .ldu-update-link {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  background: var(--ldu-accent);
  color: #fff;
  font-size: var(--font-down-1, .875rem);
  font-weight: 600;
  text-align: center;
}
.ldu-settings-panel .ldu-donate-wrap { position: relative; }
.ldu-settings-panel .dc-dropdown-menu { position: absolute; right: 0; bottom: calc(100% + 6px); z-index: 2; display: flex; min-width: 100px; flex-direction: column; padding: 4px; border: 1px solid var(--ldu-border); border-radius: 4px; background: var(--ldu-surface-muted); box-shadow: 0 6px 18px rgb(0 0 0 / 50%); }
.ldu-settings-panel .dc-dropdown-menu[hidden] { display: none; }
.ldu-settings-panel .dc-dropdown-item { display: block; width: 100%; padding: 6px 10px; border: 0; border-radius: 2px; background: transparent; color: var(--ldu-text); cursor: pointer; font: inherit; font-size: var(--font-down-2, .75rem); text-align: left; text-decoration: none; }
.ldu-settings-panel .dc-dropdown-item:hover { background: var(--ldu-accent); color: #fff; }

.ldu-settings-panel :is(.dc-close-btn, .dc-pill-btn, .dc-btn, .dc-dropdown-item):active { transform: scale(.97); }

@media (max-width: 560px) {
  .ldu-settings-panel .dc-header,
  .ldu-settings-panel .dc-body,
  .ldu-settings-panel .dc-footer { padding-inline: 12px; }
  .ldu-settings-panel .dc-row { gap: 10px; }
  .ldu-settings-panel .dc-item-desc { font-size: var(--font-down-2, .75rem); }
  .ldu-settings-panel .dc-range { width: 82px; }
  .ldu-settings-panel .dc-footer { align-items: flex-start; flex-wrap: wrap; }
  .ldu-settings-panel .dc-footer-right { flex-wrap: wrap; justify-content: flex-end; }
}

@media (max-height: 820px) and (min-width: 561px) {
  .ldu-settings-panel .dc-header { padding-block: 9px; }
  .ldu-settings-panel .dc-body { padding-block: 9px; }
  .ldu-settings-panel .dc-group { margin-bottom: 10px; }
  .ldu-settings-panel .dc-group-title { padding-bottom: 4px; margin-bottom: 2px; }
  .ldu-settings-panel .dc-row { padding-block: 5px; }
  .ldu-settings-panel .dc-label-box { gap: 1px; }
  .ldu-settings-panel .dc-item-desc { line-height: 1.2; }
  .ldu-settings-panel .dc-footer { padding-block: 8px; }
}

.ldu-settings-panel :is(button, a, select, input):focus-visible {
  outline: 2px solid var(--ldu-accent);
  outline-offset: 2px;
}

.ldu-credit-host {
  display: flex;
  align-items: center;
  list-style: none;
}

.ldu-credit-button {
  display: flex;
  height: 26px;
  min-width: 53px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0 8px 0 0;
  padding: 4px 8px;
  border: 1px solid var(--primary-medium, #838383);
  border-radius: 4px;
  background: transparent;
  box-sizing: border-box;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  white-space: nowrap;
}

.ldu-credit-button.is-loading,
.ldu-credit-button.is-neutral { color: var(--primary-medium, #6b7280); }
.ldu-credit-button.is-positive { color: #10b981; }
.ldu-credit-button.is-negative { color: var(--danger, #ef4444); }

@media (hover: hover) and (pointer: fine) {
  .ldu-credit-button:hover { background: var(--primary-low, rgb(255 255 255 / 12%)); }
}

.ldu-credit-tooltip {
  position: fixed;
  z-index: 1000002;
  padding: 8px 10px;
  border: 1px solid var(--ldu-border);
  border-radius: 6px;
  background: var(--ldu-text);
  box-shadow: 0 6px 18px rgb(0 0 0 / 18%);
  color: var(--ldu-surface);
  font-size: var(--font-down-1, .875rem);
  line-height: 1.5;
  pointer-events: none;
  white-space: pre;
}

.ldu-credit-tooltip[hidden] { display: none; }

.ldu-action-toast {
  position: fixed;
  z-index: 10001;
  left: 50%;
  bottom: max(24px, env(safe-area-inset-bottom));
  translate: -50% 0;
  max-width: min(420px, calc(100vw - 32px));
  padding: 9px 14px;
  border: 1px solid color-mix(in srgb, var(--success, #2e7d32) 35%, var(--ldu-border));
  border-radius: 8px;
  background: var(--ldu-surface);
  color: var(--ldu-text);
  box-shadow: 0 8px 28px rgb(0 0 0 / .2);
  font-size: var(--font-down-1, .875rem);
}

.ldu-action-toast.is-error {
  border-color: color-mix(in srgb, var(--ldu-danger) 45%, var(--ldu-border));
  color: var(--ldu-danger);
}

@media (prefers-reduced-motion: reduce) {
  .ldu-icon-button,
  .ldu-resize-handle::after,
  .ldu-settings-panel,
  .ldu-settings-reset,
  .ldu-settings-action,
  .ldu-donate-menu a { transition-duration: 0ms !important; }
}

${F}
`,tt=`
:root {
  --ldu-sidebar-width: 216px;
  --ldu-topic-track: 0.65fr;
  --ldu-list-track: 0.35fr;
  --ldu-header-height: var(--header-height, 0px);
  --ldu-border: var(--primary-low, #d9d9d9);
  --ldu-surface: var(--secondary, #fff);
  --ldu-surface-muted: var(--primary-very-low, #f5f5f5);
  --ldu-text: var(--primary, #222);
  --ldu-accent: var(--tertiary, #0088cc);
  --ldu-danger: var(--danger, #d04437);
  --ldu-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}

html[data-ldu-hide-notices="true"] #global-notice-alert-global-notice,
html[data-ldu-hide-posters="true"] #main-outlet .topic-list .posters,
html[data-ldu-hide-category-badges="true"] #main-outlet .topic-list .badge-category__wrapper,
html[data-ldu-hide-tags="true"] #main-outlet .topic-list a.discourse-tag {
  display: none !important;
}

html[data-ldu-low-end="true"] *,
html[data-ldu-low-end="true"] *::before,
html[data-ldu-low-end="true"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

html[data-ldu-embedded-topic="true"] #d-sidebar,
html[data-ldu-embedded-topic="true"] .sidebar-wrapper,
html[data-ldu-embedded-topic="true"] .d-header,
html[data-ldu-embedded-list="true"] #d-sidebar,
html[data-ldu-embedded-list="true"] .sidebar-wrapper,
html[data-ldu-embedded-list="true"] .d-header {
  display: none !important;
}

html[data-ldu-embedded-list="true"],
html[data-ldu-embedded-list="true"] body {
  overflow-x: hidden !important;
  overflow-y: auto !important;
}

html[data-ldu-embedded-list="true"] #main-container,
html[data-ldu-embedded-list="true"] #main-outlet-wrapper,
html[data-ldu-embedded-list="true"] #main-outlet {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

html[data-ldu-embedded-list="true"] #main-outlet-wrapper {
  display: block !important;
  padding: 0 !important;
}

html[data-ldu-embedded-list="true"] #main-outlet {
  padding: 0 10px max(12px, env(safe-area-inset-bottom)) !important;
  container-type: inline-size;
}

html[data-ldu-embedded-topic="true"] #main-container,
html[data-ldu-embedded-topic="true"] #main-outlet,
html[data-ldu-embedded-topic="true"] .post-stream,
html[data-ldu-embedded-topic="true"] .topic-post,
html[data-ldu-embedded-topic="true"] .topic-body {
  width: 100% !important;
  max-width: none !important;
  margin-inline: 0 !important;
  box-sizing: border-box !important;
}

html[data-ldu-embedded-topic="true"] #main-outlet-wrapper {
  width: 100% !important;
  max-width: none !important;
  grid-template-columns: minmax(0, 1fr) !important;
  grid-template-areas: "content" !important;
}

html[data-ldu-embedded-topic="true"] #main-outlet {
  grid-area: content !important;
  padding: 12px clamp(12px, 3vw, 40px) max(12px, env(safe-area-inset-bottom)) !important;
}

html[data-ldu-embedded-topic="true"] .container.posts {
  width: 100% !important;
  max-width: none !important;
  grid-template-columns: minmax(0, 1fr) minmax(7.5rem, 16%) !important;
  grid-template-areas: "posts timeline" !important;
}

html[data-ldu-embedded-topic="true"] .topic-navigation {
  display: block !important;
  grid-area: timeline !important;
  min-width: 0 !important;
  margin-inline-start: clamp(.35rem, 1vw, .75rem) !important;
}

html[data-ldu-embedded-topic="true"] .timeline-container,
html[data-ldu-embedded-topic="true"] .topic-timeline {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: .35rem !important;
  align-items: stretch !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .ldu-owner-toggle,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .show-summary,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .top-replies {
  grid-column: 1 / -1 !important;
  width: 100% !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .reply-to-post,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button > button {
  width: 100% !important;
}

${F}
`;function A(a=document){let o=a.getElementById(R);if(o instanceof HTMLStyleElement)return o;let i=a.createElement("style");return i.id=R,i.textContent=tt,(a.head??a.documentElement).append(i),i}function et(a){return a==="linux.do"||a.endsWith(".linux.do")?!0:globalThis.window?.__LDU_TEST_MODE__===!0&&(a==="localhost"||a==="127.0.0.1")}function h(a,o="https://linux.do/"){let i;try{i=new URL(a,o)}catch{return null}if(!et(i.hostname))return null;let l=i.pathname.split("/").filter(Boolean),d=l.findIndex(u=>u==="t"||u==="n");if(d<0)return null;let s=l.findIndex((u,g)=>g>d&&/^\d+$/.test(u));if(s<0)return null;let m=l[s+1]&&/^\d+$/.test(l[s+1])?Number(l[s+1]):void 0;return{url:i,topicId:l[s],...m?{postNumber:m}:{}}}function D(a,o){let i=h(a,o),l=h(o,o);return!!(i&&(!l||i.topicId!==l.topicId))}var j={ownerOnlyEnabled:!1,minimalHidePosters:!1,minimalHideNotices:!1,minimalHideCategoryBadges:!1,minimalHideTags:!1,lowEndOptimizationEnabled:!1};function U(a){if(!(a instanceof HTMLElement))return null;let o=a.dataset.lduPageTools;if(!o)return null;try{let i=JSON.parse(o);return!i||typeof i!="object"?null:{ownerOnlyEnabled:i.ownerOnlyEnabled===!0,minimalHidePosters:i.minimalHidePosters===!0,minimalHideNotices:i.minimalHideNotices===!0,minimalHideCategoryBadges:i.minimalHideCategoryBadges===!0,minimalHideTags:i.minimalHideTags===!0,lowEndOptimizationEnabled:i.lowEndOptimizationEnabled===!0,base64Enabled:i.base64Enabled!==!1}}catch{return null}}function W(a,o,i){z(a,"lduHidePosters",i.minimalHidePosters),z(a,"lduHideNotices",i.minimalHideNotices),z(a,"lduHideCategoryBadges",i.minimalHideCategoryBadges),z(a,"lduHideTags",i.minimalHideTags),z(a,"lduLowEnd",i.lowEndOptimizationEnabled&&it(o))}function K(a,o){return a.ownerOnlyEnabled===o.ownerOnlyEnabled&&a.minimalHidePosters===o.minimalHidePosters&&a.minimalHideNotices===o.minimalHideNotices&&a.minimalHideCategoryBadges===o.minimalHideCategoryBadges&&a.minimalHideTags===o.minimalHideTags&&a.lowEndOptimizationEnabled===o.lowEndOptimizationEnabled&&a.base64Enabled!==!1==(o.base64Enabled!==!1)}function z(a,o,i){let l=String(i);a.dataset[o]!==l&&(a.dataset[o]=l)}function it(a){let o=a.hardwareConcurrency,i=a.deviceMemory;return Number.isFinite(o)&&o<=4||typeof i=="number"&&Number.isFinite(i)&&i<=4}var P=class{constructor(o={}){this.options=o;this.win=o.window??window,this.doc=o.document??document}config={...j};active=!0;stopped=!1;ownerInstaller=null;ownerController=null;ownerLoad=null;win;doc;setConfig(o){if(this.stopped)return;let i={...this.config,...o};K(this.config,i)||(this.config=i,this.applyStaticModes(),this.ownerController?.setConfig?.({ownerOnlyEnabled:i.ownerOnlyEnabled,base64Enabled:i.base64Enabled!==!1}),this.syncOwnerView())}setActive(o){this.stopped||this.active===o||(this.active=o,this.syncOwnerView())}stop(){this.stopped||(this.stopped=!0,this.ownerController?.stop(),this.ownerController=null,delete this.doc.documentElement.dataset.lduHidePosters,delete this.doc.documentElement.dataset.lduHideNotices,delete this.doc.documentElement.dataset.lduHideCategoryBadges,delete this.doc.documentElement.dataset.lduHideTags,delete this.doc.documentElement.dataset.lduLowEnd)}applyStaticModes(){W(this.doc.documentElement,this.win.navigator,this.config)}wantsOwnerView(){return this.active&&this.ownerViewConfigured()}ownerViewConfigured(){return this.options.allowOwnerView!==!1&&this.config.ownerOnlyEnabled&&typeof this.options.loadOwnerView=="function"}syncOwnerView(){if(!this.ownerViewConfigured()){this.ownerController?.stop(!0),this.ownerController=null;return}if(!this.active){this.ownerController?.setActive(!1);return}if(this.ownerController){this.ownerController.setActive(!0);return}if(this.ownerInstaller){this.installOwnerView(this.ownerInstaller);return}if(!this.ownerLoad)try{let o=this.options.loadOwnerView();if(!(o instanceof Promise)){this.ownerInstaller=o,this.installOwnerView(o);return}this.ownerLoad=o.then(i=>(this.ownerInstaller=i,this.wantsOwnerView()&&this.installOwnerView(i),i)).catch(i=>(console.error("[Linux Do Ultimate] Owner view runtime failed to load",i),null)).finally(()=>{this.ownerLoad=null})}catch(o){console.error("[Linux Do Ultimate] Owner view runtime failed to load",o)}}installOwnerView(o){!this.wantsOwnerView()||this.ownerController||(this.ownerController=o({window:this.win,document:this.doc,...this.options.isEmbedded!==void 0?{isEmbedded:this.options.isEmbedded}:{},...this.options.isSplitHost?{isSplitHost:this.options.isSplitHost}:{},base64Enabled:this.config.base64Enabled!==!1}),this.ownerController.setActive(!0))}};var Y=300;function q(a={}){let o=window.name;if(o.startsWith("ldu-list:")){ot(o.slice(9),a);return}if(!o.startsWith("ldu-topic:"))return;let i=o.slice(10);document.documentElement.dataset.lduEmbeddedTopic="true",A(document);let l=new P({isEmbedded:!0,...a.loadOwnerView?{loadOwnerView:a.loadOwnerView}:{}});a.initialPageToolsConfig&&l.setConfig(a.initialPageToolsConfig);let d=null,s=null,m="",u=location.href,g=document.title,b=!1,w="double",k=!1,c=null,f=!1,p=t=>{f&&t==="ldu:frame-state"||(d!==null&&window.clearTimeout(d),s=t,d=window.setTimeout(()=>{if(d=null,s=null,f&&t==="ldu:frame-state")return;let e={type:t,tabId:i};(t==="ldu:frame-ready"||m!==location.href)&&(m=location.href,e.url=location.href,e.title=document.title),window.parent.postMessage(e,location.origin)},t==="ldu:frame-ready"?0:120))};window.addEventListener("scroll",()=>{m!==location.href&&p("ldu:frame-state")},{passive:!0}),window.addEventListener("load",()=>p("ldu:frame-ready"),{once:!0}),document.addEventListener("DOMContentLoaded",()=>p("ldu:frame-ready"),{once:!0}),window.addEventListener("popstate",()=>p("ldu:frame-state"));let E=new MutationObserver(()=>{if(f)return;let t=u!==location.href,e=g!==document.title;!t&&!e||(u=location.href,g=document.title,p("ldu:frame-state"))}),L=()=>E.observe(document.documentElement,{childList:!0,subtree:!0});L();let x=()=>{c!==null&&window.clearTimeout(c),c=null},T=new Set,C=new Set,M=()=>{for(let e of document.querySelectorAll("audio, video"))if(!(e.paused||e.ended)){T.add(e);try{e.pause()}catch{}}let t=document;for(let e of t.getAnimations?.()??[])if(e.playState==="running"){C.add(e);try{e.pause()}catch{}}},r=()=>{for(let t of T)if(t.isConnected)try{t.play().catch(()=>{})}catch{}T.clear();for(let t of C)try{t.play()}catch{}C.clear()},n=t=>{if(f!==t){if(f=t,l.setActive(!t),t){document.documentElement.dataset.lduSoftFrozen="true",d!==null&&s==="ldu:frame-state"&&(window.clearTimeout(d),d=null,s=null),x(),E.disconnect(),M();return}delete document.documentElement.dataset.lduSoftFrozen,u=location.href,g=document.title,L(),r(),p("ldu:frame-state")}},v=t=>{let e=t instanceof Element?t.closest("a[href]"):null;return!e||!/^https?:/i.test(e.href)||h(e.href)||new URL(e.href,location.href).origin===location.origin||t instanceof Element&&t.closest("img, picture, .lightbox-wrapper")||e.matches(".lightbox")||e.querySelector("img, picture")||e.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:e},G=t=>{let e=t instanceof Element?t.closest("a[href]"):null;return!e||!D(e.href,location.href)||e.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:e},J=t=>{let e=t instanceof Element?t.closest("a[href]"):null;return!e||!/^https?:/i.test(e.href)||new URL(e.href,location.href).origin!==location.origin||h(e.href)||e.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:e},Q=t=>{let e=h(t.href,location.href);window.parent.postMessage({type:"ldu:topic-open",tabId:i,url:t.href,title:t.textContent?.trim()||(e?`\u4E3B\u9898 ${e.topicId}`:""),...e?.postNumber?{postNumber:e.postNumber}:{}},location.origin)},_=t=>{let e=t.getBoundingClientRect();window.parent.postMessage({type:"ldu:preview-open",tabId:i,url:t.href,anchorRect:{left:e.left,top:e.top,right:e.right,bottom:e.bottom,width:e.width,height:e.height}},location.origin)},N=t=>t.button===0&&!t.ctrlKey&&!t.metaKey&&!t.shiftKey&&!t.altKey;window.addEventListener("message",t=>{if(t.source!==window.parent||t.origin!==location.origin)return;let e=t.data;if(e?.type==="ldu:frame-lifecycle"){n(e.active!==!0);return}if(e?.type==="ldu:bookmark"){let H=typeof e.topicId=="string"&&/^\d+$/.test(e.topicId)?e.topicId:null,y=document.querySelector('meta[name="csrf-token"]')?.content;if(!H||!y){window.parent.postMessage({type:"ldu:bookmark-result",tabId:i,ok:!1,message:"\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"},location.origin);return}let Z=new URLSearchParams({bookmarkable_type:"Topic",bookmarkable_id:H});fetch("/bookmarks.json",{method:"POST",credentials:"same-origin",headers:{Accept:"application/json","Content-Type":"application/x-www-form-urlencoded; charset=UTF-8","X-CSRF-Token":y,"X-Requested-With":"XMLHttpRequest"},body:Z}).then(async O=>{if(!O.ok){let B="\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25";try{let I=await O.json();Array.isArray(I.errors)&&typeof I.errors[0]=="string"&&(B=I.errors[0])}catch{}throw new Error(B)}window.parent.postMessage({type:"ldu:bookmark-result",tabId:i,ok:!0,message:"\u5DF2\u6DFB\u52A0\u5230\u4E66\u7B7E"},location.origin)}).catch(O=>{window.parent.postMessage({type:"ldu:bookmark-result",tabId:i,ok:!1,message:O instanceof Error&&O.message?O.message:"\u6DFB\u52A0\u4E66\u7B7E\u5931\u8D25"},location.origin)});return}if(e?.type==="ldu:page-tools-config"){l.setConfig({ownerOnlyEnabled:e.ownerOnlyEnabled===!0,minimalHidePosters:e.minimalHidePosters===!0,minimalHideNotices:e.minimalHideNotices===!0,minimalHideCategoryBadges:e.minimalHideCategoryBadges===!0,minimalHideTags:e.minimalHideTags===!0,lowEndOptimizationEnabled:e.lowEndOptimizationEnabled===!0,base64Enabled:e.base64Enabled!==!1});return}e?.type==="ldu:preview-config"&&(b=e.enabled===!0,w=e.clickMode==="single"?"single":"double",b||x())}),document.addEventListener("pointerdown",t=>{window.parent.postMessage({type:"ldu:frame-interaction",tabId:i},location.origin),b&&w==="double"&&t.detail>=2&&x()},!0);let S=null,V=()=>{S===null&&(window.parent.postMessage({type:"ldu:frame-interaction",tabId:i},location.origin),S=window.setTimeout(()=>{S=null},120))};window.addEventListener("wheel",V,{passive:!0,capture:!0}),window.addEventListener("touchstart",V,{passive:!0,capture:!0}),document.addEventListener("keydown",t=>{["ArrowDown","ArrowUp","PageDown","PageUp","Home","End","Space"].includes(t.key)&&V()},!0),document.addEventListener("click",t=>{if(k||!N(t))return;let e=G(t.target);if(e){t.preventDefault(),t.stopImmediatePropagation(),Q(e);return}let H=J(t.target);if(H){t.preventDefault(),t.stopImmediatePropagation(),window.parent.postMessage({type:"ldu:list-navigate",tabId:i,url:H.href},location.origin);return}if(!b)return;let y=v(t.target);if(y){if(t.preventDefault(),t.stopImmediatePropagation(),w==="single"){_(y);return}x(),!(t.detail>=2)&&(c=window.setTimeout(()=>{if(c=null,!!y.isConnected){k=!0;try{y.click()}finally{k=!1}}},Y))}},!0),document.addEventListener("dblclick",t=>{if(!b||w!=="double"||!N(t))return;let e=v(t.target);e&&(x(),t.preventDefault(),t.stopImmediatePropagation(),_(e))},!0),document.addEventListener("keydown",t=>{!b||t.key!=="Escape"||window.parent.postMessage({type:"ldu:preview-dismiss",tabId:i},location.origin)},!0),p("ldu:frame-ready")}function ot(a,o){document.documentElement.dataset.lduEmbeddedList="true",A(document);let i=new P({isEmbedded:!0,allowOwnerView:!1,...o.loadOwnerView?{loadOwnerView:o.loadOwnerView}:{}});o.initialPageToolsConfig&&i.setConfig(o.initialPageToolsConfig);let l=null,d=null,s=!1,m=null,u=!1,g="double",b=!1,w="",k="",c=r=>{l!==null&&window.clearTimeout(l),l=window.setTimeout(()=>{l=null;let n={type:r,frameId:a,url:location.href,title:document.title,scrollY:window.scrollY};w=location.href,k=document.title,window.parent.postMessage(n,location.origin)},r==="ldu:list-ready"?0:100)},f=()=>{if(document.readyState==="loading")return!1;let r=document.querySelector("#main-outlet");return r?[...r.children].some(n=>!n.matches(".loading-container, .spinner, .spinner-container, .loading-indicator")):!1},p=()=>{s||m!==null||!f()||(m=window.setTimeout(()=>{m=null,!(s||!f())&&(s=!0,window.parent.postMessage({type:"ldu:list-visual-ready",frameId:a,url:location.href,title:document.title,scrollY:window.scrollY},location.origin))},0))},E=()=>{d!==null&&window.clearTimeout(d),d=null},L=r=>r.button===0&&!r.ctrlKey&&!r.metaKey&&!r.shiftKey&&!r.altKey,x=r=>{let n=r instanceof Element?r.closest("a[href]"):null;return!n||!D(n.href,location.href)||n.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:n},T=r=>{let n=r instanceof Element?r.closest("a[href]"):null;return!n||!/^https?:/i.test(n.href)||h(n.href)||new URL(n.href,location.href).origin===location.origin||r instanceof Element&&r.closest("img, picture, .lightbox-wrapper")||n.matches(".lightbox")||n.querySelector("img, picture")||n.closest("button, [role=button], .btn, .d-button, input, textarea, select")?null:n},C=r=>{let n=h(r.href,location.href);window.parent.postMessage({type:"ldu:list-topic-open",frameId:a,url:r.href,topicId:n?.topicId,postNumber:n?.postNumber,topicTitle:r.textContent?.trim()||(n?`\u4E3B\u9898 ${n.topicId}`:"")},location.origin)},M=r=>{let n=r.getBoundingClientRect();window.parent.postMessage({type:"ldu:list-preview-open",frameId:a,url:r.href,anchorRect:{left:n.left,top:n.top,right:n.right,bottom:n.bottom,width:n.width,height:n.height}},location.origin)};window.addEventListener("message",r=>{if(r.source!==window.parent||r.origin!==location.origin)return;let n=r.data;if(n?.type==="ldu:page-tools-config"){i.setConfig({ownerOnlyEnabled:n.ownerOnlyEnabled===!0,minimalHidePosters:n.minimalHidePosters===!0,minimalHideNotices:n.minimalHideNotices===!0,minimalHideCategoryBadges:n.minimalHideCategoryBadges===!0,minimalHideTags:n.minimalHideTags===!0,lowEndOptimizationEnabled:n.lowEndOptimizationEnabled===!0,base64Enabled:n.base64Enabled!==!1});return}n?.type==="ldu:preview-config"&&(u=n.enabled===!0,g=n.clickMode==="single"?"single":"double",u||E())}),window.addEventListener("scroll",()=>c("ldu:list-state"),{passive:!0}),window.addEventListener("load",()=>{c("ldu:list-ready"),p()},{once:!0}),document.addEventListener("DOMContentLoaded",()=>{c("ldu:list-ready"),p()},{once:!0}),window.addEventListener("popstate",()=>c("ldu:list-state")),window.addEventListener("hashchange",()=>c("ldu:list-state")),document.addEventListener("pointerdown",()=>{window.parent.postMessage({type:"ldu:list-interaction",frameId:a},location.origin)},!0),new MutationObserver(()=>{p(),!(w===location.href&&k===document.title)&&c("ldu:list-state")}).observe(document.documentElement,{childList:!0,subtree:!0}),document.addEventListener("click",r=>{if(b||!L(r))return;let n=x(r.target);if(n){r.preventDefault(),r.stopImmediatePropagation(),C(n);return}if(!u)return;let v=T(r.target);if(v){if(r.preventDefault(),r.stopImmediatePropagation(),g==="single"){M(v);return}E(),!(r.detail>=2)&&(d=window.setTimeout(()=>{if(d=null,!!v.isConnected){b=!0;try{v.click()}finally{b=!1}}},Y))}},!0),document.addEventListener("dblclick",r=>{if(!u||g!=="double"||!L(r))return;let n=T(r.target);n&&(E(),r.preventDefault(),r.stopImmediatePropagation(),M(n))},!0),document.addEventListener("keydown",r=>{r.key==="Escape"&&window.parent.postMessage({type:"ldu:list-preview-dismiss",frameId:a},location.origin)},!0),c("ldu:list-ready"),p()}var $=window.name.startsWith("ldu-topic:")?import(chrome.runtime.getURL("topic-tools-runtime.js")):null,X=U(window.frameElement);q({...X?{initialPageToolsConfig:X}:{},...$?{loadOwnerView:()=>$.then(a=>a.installOwnerView)}:{}});document.getElementById("ldu-frame-bootstrap-style")?.remove();
