export type IconName =
  | "settings" | "close" | "split" | "external" | "refresh" | "copy"
  | "bookmark" | "bookmark-filled" | "close-others" | "list" | "check"
  | "maximize" | "restore" | "trash" | "thumbs-up" | "thumbs-down"
  | "github" | "gift";

const ICON_CONTENT: Record<IconName, string> = {
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.95 4.6 1.7 1.7 0 0 0 9.98 3.04V3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  split: '<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/><path d="M12 9v6m-3-3h6"/>',
  external: '<path d="M15 4h5v5M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
  refresh: '<path d="M20 6v5h-5"/><path d="M19 11a7 7 0 1 0 1 5"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  bookmark: '<path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',
  "bookmark-filled": '<path class="ldu-symbol-fill" d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>',
  "close-others": '<rect x="3" y="5" width="13" height="12" rx="2"/><path d="M8 3h10a3 3 0 0 1 3 3v8"/><path d="m18 16 4 4m0-4-4 4"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  maximize: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  restore: '<path d="M9 9H4V4M15 9h5V4M9 15H4v5M15 15h5v5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
  "thumbs-up": '<path d="M7 10v11M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7A2 2 0 0 1 17.5 21H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z"/>',
  "thumbs-down": '<path d="M17 14V3M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.6l2.3-7A2 2 0 0 1 6.5 3H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9Z"/>',
  github: '<path d="M15 22v-3.9c.04-1-.35-1.76-.8-2.2 2.6-.3 5.3-1.27 5.3-5.75A4.5 4.5 0 0 0 18.3 7c.12-.3.52-1.53-.12-3.18 0 0-.98-.31-3.2 1.2a11.1 11.1 0 0 0-5.83 0c-2.22-1.51-3.2-1.2-3.2-1.2C5.3 5.47 5.7 6.7 5.82 7a4.5 4.5 0 0 0-1.2 3.15c0 4.47 2.72 5.46 5.32 5.75-.34.3-.64.82-.75 1.59-.67.3-2.37.82-3.42-.98 0 0-.62-1.13-1.8-1.21M9 19c-2.25 1-2.5-1-3.5-1.5"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M7.5 8C6.1 8 5 7 5 5.7S6.1 3.5 7.5 3.5C9.6 3.5 12 8 12 8s2.4-4.5 4.5-4.5C17.9 3.5 19 4.4 19 5.7S17.9 8 16.5 8"/>',
};

export function iconSvg(name: IconName, size = 20): string {
  return `<svg class="ldu-symbol ldu-symbol-${name}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_CONTENT[name]}</svg>`;
}

export function setIcon(element: Element, name: IconName, size = 20): void {
  element.innerHTML = iconSvg(name, size);
}

export function createIcon(doc: Document, name: IconName, size = 18): HTMLSpanElement {
  const icon = doc.createElement("span");
  icon.className = "ldu-context-icon";
  icon.innerHTML = iconSvg(name, size);
  return icon;
}
