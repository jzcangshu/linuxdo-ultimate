declare global {
  interface Window {
    __linuxDoUltimateLoaded?: boolean;
    __LDU_TEST_MODE__?: boolean;
    __LDU_TEST_API__?: { openTopic: (url: string, title: string) => void };
    __linuxDoUltimateAppStarted?: boolean;
  }
}

import { startLinuxDoApp } from "./app";
import { SESSION_ID_KEY } from "./core/defaults";
import { UserscriptStorage, loadSessionIfPresent, loadSettings, reconcileSessionClose } from "./core/storage";

export function boot(): boolean {
  if (window.__linuxDoUltimateLoaded) return false;
  window.__linuxDoUltimateLoaded = true;
  return true;
}

function reconcileRefreshAtDocumentStart(): void {
  try {
    const sessionId = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (sessionId) reconcileSessionClose(new UserscriptStorage(), sessionId);
  } catch {
    // Session storage is optional; the normal startup path still works without it.
  }
}

function prepareSplitBootMask(): void {
  try {
    const sessionId = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) return;
    const storage = new UserscriptStorage();
    const settings = loadSettings(storage);
    const session = loadSessionIfPresent(storage, sessionId, location.href, Date.now());
    if (!settings.enabled || !settings.tabsEnabled || !session?.tabs.length) return;
    document.documentElement.classList.add("ldu-split-booting");
    const style = document.createElement("style");
    style.id = "linuxdo-ultimate-boot-style";
    style.textContent = "html.ldu-split-booting #main-container{visibility:hidden!important}";
    document.documentElement.append(style);
  } catch {
    // A missing storage backend must never hide the native forum page.
  }
}

if (typeof window !== "undefined") {
  if (window.self === window.top && boot()) {
    reconcileRefreshAtDocumentStart();
    prepareSplitBootMask();
    startLinuxDoApp();
  }
}
