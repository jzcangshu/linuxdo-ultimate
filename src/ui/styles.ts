export const APP_STYLE_ID = "linuxdo-ultimate-styles";

export const APP_STYLES = `
:root {
  --ldu-sidebar-width: 216px;
  --ldu-topic-track: 0.65fr;
  --ldu-list-track: 0.35fr;
  --ldu-header-height: 52px;
  --ldu-border: var(--primary-low, #d9d9d9);
  --ldu-surface: var(--secondary, #fff);
  --ldu-surface-muted: var(--primary-very-low, #f5f5f5);
  --ldu-text: var(--primary, #222);
  --ldu-accent: var(--tertiary, #0088cc);
  --ldu-danger: var(--danger, #d04437);
  --ldu-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}

body.ldu-layout-active {
  overflow-x: hidden !important;
  overflow-y: auto !important;
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
  display: grid !important;
  width: 100% !important;
  max-width: none !important;
  height: auto !important;
  min-height: calc(100vh - var(--ldu-header-height)) !important;
  padding: 0 !important;
  gap: 0 !important;
  overflow: visible !important;
  align-items: start !important;
}

body.ldu-layout-active.ldu-layout-three #main-outlet-wrapper {
  grid-template-columns: var(--ldu-sidebar-width) minmax(0, var(--ldu-topic-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "sidebar topic list" !important;
}

body.ldu-layout-active.ldu-layout-three:not(.has-sidebar-page) #main-outlet-wrapper {
  grid-template-columns: minmax(0, var(--ldu-topic-track)) minmax(0, var(--ldu-list-track)) !important;
  grid-template-areas: "topic list" !important;
}

body.ldu-layout-active.ldu-layout-two #main-outlet-wrapper {
  grid-template-columns: minmax(52px, var(--ldu-sidebar-width)) minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-track)) !important;
  grid-template-areas: "sidebar list topic" !important;
}

body.ldu-layout-active.ldu-layout-two:not(.has-sidebar-page) #main-outlet-wrapper {
  grid-template-columns: minmax(0, var(--ldu-list-track)) minmax(0, var(--ldu-topic-track)) !important;
  grid-template-areas: "list topic" !important;
}

body.ldu-layout-active #main-outlet-wrapper > .sidebar-wrapper {
  grid-area: sidebar !important;
  width: auto !important;
  min-width: 0 !important;
  position: sticky !important;
  top: var(--ldu-header-height) !important;
  height: calc(100vh - var(--ldu-header-height)) !important;
  max-height: none !important;
  align-self: start !important;
  overflow: auto !important;
  border-right: 1px solid var(--ldu-border);
}

body.ldu-layout-active:not(.has-sidebar-page) #main-outlet-wrapper > .sidebar-wrapper {
  display: none !important;
}

body.ldu-layout-active #main-outlet {
  grid-area: list !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 10px max(12px, env(safe-area-inset-bottom)) !important;
  overflow-x: hidden !important;
  overflow-y: visible !important;
  container-type: inline-size;
}

.ldu-list-scrollbar {
  position: fixed;
  z-index: 4;
  width: 10px;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
  touch-action: none;
}

.ldu-list-scrollbar[hidden] { display: none; }

.ldu-list-scrollbar-thumb {
  position: absolute;
  inset-inline: 2px;
  top: 0;
  min-height: 36px;
  border-radius: 3px;
  background: var(--primary-medium, #777);
  opacity: .62;
  cursor: grab;
  touch-action: none;
}

.ldu-list-scrollbar-thumb:active { cursor: grabbing; opacity: .82; }

body.ldu-hide-posters #main-outlet .topic-list .posters {
  display: none !important;
}

@container (max-width: 480px) {
  #main-outlet .topic-list .views { display: none !important; }
  #main-outlet .topic-list .topic-list-data { padding-inline: 6px !important; }
}

@container (max-width: 410px) {
  #main-outlet .topic-list .activity { display: none !important; }
  #main-outlet .topic-list .main-link { width: 100% !important; }
}

#ldu-topic-panel {
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
}

#ldu-topic-panel[hidden] { display: none !important; }

.ldu-topic-toolbar {
  display: flex;
  min-height: 38px;
  align-items: center;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
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

.ldu-preview-container {
  position: fixed;
  z-index: 1000000;
  display: flex;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 24px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ldu-border);
  border-radius: 6px;
  background: var(--ldu-surface);
  box-shadow: 0 12px 32px rgb(0 0 0 / 22%);
}

.ldu-preview-header {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-left: 12px;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.ldu-preview-dragging .ldu-preview-header { cursor: grabbing; }

.ldu-preview-title {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ldu-preview-actions { display: flex; flex: none; align-items: center; padding-right: 4px; }
.ldu-preview-actions button,
.ldu-preview-actions a { cursor: pointer; }
.ldu-preview-actions a { text-decoration: none; }
.ldu-preview-frame { display: block; width: 100%; min-height: 0; flex: 1; border: 0; background: #fff; }

.ldu-preview-status {
  position: absolute;
  inset: 38px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: var(--ldu-surface);
  color: var(--primary-medium, #666);
  font-size: var(--font-down-1, .875rem);
  text-align: center;
  transition: opacity 130ms ease;
}

.ldu-preview-status.is-hidden { visibility: hidden; opacity: 0; pointer-events: none; }
.ldu-preview-status.is-error { color: var(--ldu-danger); }
.ldu-preview-spinner {
  width: 18px;
  height: 18px;
  flex: none;
  border: 2px solid var(--ldu-border);
  border-top-color: var(--ldu-accent);
  border-radius: 50%;
  animation: ldu-preview-spin .75s linear infinite;
}
.ldu-preview-status.is-error .ldu-preview-spinner { display: none; }
@keyframes ldu-preview-spin { to { transform: rotate(360deg); } }

.ldu-preview-status.is-fallback {
  align-items: stretch;
  overflow-y: auto;
  color: var(--ldu-text);
  text-align: left;
}

.ldu-preview-fallback-card {
  width: min(560px, 100%);
  margin: auto;
}

.ldu-preview-fallback-image {
  display: block;
  width: min(96px, 24%);
  max-height: 96px;
  margin-bottom: 16px;
  object-fit: contain;
}

.ldu-preview-fallback-site {
  margin-bottom: 6px;
  color: var(--primary-medium, #666);
  font-size: var(--font-down-1, .875rem);
}

.ldu-preview-fallback-card h3 {
  margin: 0 0 10px;
  font-size: var(--font-up-1, 1.125rem);
  line-height: 1.35;
}

.ldu-preview-fallback-card p { margin: 0; line-height: 1.6; }
.ldu-preview-fallback-note {
  margin-top: 18px !important;
  color: var(--primary-medium, #666);
  font-size: var(--font-down-1, .875rem);
}

.ldu-settings-panel {
  position: fixed;
  top: calc(var(--ldu-header-height) + 4px);
  right: 8px;
  z-index: 1000001;
  display: block;
  width: min(520px, calc(100vw - 16px));
  box-sizing: border-box;
  color: var(--ldu-text);
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  transform-origin: top right;
  transition: opacity 140ms ease, transform 160ms var(--ldu-ease-out);
}

.ldu-settings-panel[hidden] { display: none; }

@starting-style {
  .ldu-settings-panel:not([hidden]) {
    opacity: 0;
    transform: translateY(-4px) scale(.98);
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
  max-height: inherit;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ldu-border);
  border-radius: 6px;
  background: var(--ldu-surface);
  box-shadow: 0 16px 36px rgb(0 0 0 / 55%);
}

.ldu-settings-panel .dc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--ldu-border);
  background: var(--ldu-surface-muted);
}

.ldu-settings-panel .dc-header h2 {
  margin: 0;
  padding: 0;
  color: var(--ldu-text);
  font-size: var(--font-up-1, 1.05rem);
  font-weight: 700;
  line-height: 1.3;
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

.ldu-settings-panel .dc-body { padding: 18px 20px; }

.ldu-settings-panel .dc-group { margin-bottom: 24px; padding: 0; border-top: 0; }
.ldu-settings-panel .dc-group:last-child { margin-bottom: 0; }

.ldu-settings-panel .dc-group-title {
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--ldu-border);
  color: var(--ldu-text);
  font-size: var(--font-0, 1rem);
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
.ldu-settings-panel .dc-label-box { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.ldu-settings-panel .dc-item-title { color: var(--ldu-text); font-size: var(--font-down-1, .875rem); font-weight: 600; line-height: 1.3; }
.ldu-settings-panel .dc-item-desc { color: var(--primary-medium, #8b949e); font-size: var(--font-down-2, .75rem); line-height: 1.35; }
.ldu-settings-panel .dc-item-desc.alert { color: var(--danger, #f85149); }
.ldu-settings-panel .ldu-settings-risk[hidden] { display: none; }

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

.ldu-settings-panel .dc-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-top: 1px solid var(--ldu-border); background: var(--ldu-surface-muted); }
.ldu-settings-panel .dc-btn { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border: 1px solid var(--ldu-border); border-radius: 4px; background: color-mix(in srgb, var(--ldu-text) 5%, var(--ldu-surface-muted)); color: var(--ldu-text); cursor: pointer; font: inherit; font-size: var(--font-down-2, .8rem); font-weight: 500; text-decoration: none; transition: background-color 120ms ease, transform 120ms var(--ldu-ease-out); }
.ldu-settings-panel .dc-btn:hover { border-color: var(--primary-medium, #777); background: var(--primary-low, #2a2d32); }
.ldu-settings-panel .dc-btn-ghost { border-color: transparent; background: transparent; color: var(--primary-medium, #8b949e); }
.ldu-settings-panel .dc-btn-ghost:hover { border-color: transparent; background: color-mix(in srgb, var(--danger, #e45735) 10%, transparent); color: var(--danger, #e45735); }
.ldu-settings-panel .dc-footer-right { position: relative; display: flex; gap: 8px; }
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

html[data-ldu-embedded-topic="true"] #d-sidebar,
html[data-ldu-embedded-topic="true"] .sidebar-wrapper,
html[data-ldu-embedded-topic="true"] .d-header {
  display: none !important;
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

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .show-summary {
  grid-column: 1 / -1 !important;
  width: 100% !important;
}

html[data-ldu-embedded-topic="true"] .timeline-footer-controls .reply-to-post,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button,
html[data-ldu-embedded-topic="true"] .timeline-footer-controls .topic-notifications-button > button {
  width: 100% !important;
}

html[data-ldu-embedded-topic="true"] #main-outlet {
  padding: 12px clamp(12px, 3vw, 40px) max(12px, env(safe-area-inset-bottom)) !important;
}

@media (prefers-reduced-motion: reduce) {
  .ldu-icon-button,
  .ldu-resize-handle::after,
  .ldu-settings-panel,
  .ldu-settings-reset,
  .ldu-settings-action,
  .ldu-donate-menu a { transition-duration: 0ms !important; }
  .ldu-preview-spinner { animation-duration: 1.5s; }
}
`;

export function ensureAppStyles(doc: Document = document): HTMLStyleElement {
  const existing = doc.getElementById(APP_STYLE_ID);
  if (existing instanceof HTMLStyleElement) return existing;
  const style = doc.createElement("style");
  style.id = APP_STYLE_ID;
  style.textContent = APP_STYLES;
  (doc.head ?? doc.documentElement).append(style);
  return style;
}
