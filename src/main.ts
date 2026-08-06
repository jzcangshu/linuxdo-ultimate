declare global {
  interface Window {
    __linuxDoUltimateLoaded?: boolean;
    __LDU_TEST_MODE__?: boolean;
    __LDU_TEST_API__?: { openTopic: (url: string, title: string) => void };
  }
}

import { startLinuxDoApp } from "./app";
import { bootFrameBridge } from "./frame-bridge";

export function boot(): void {
  if (window.__linuxDoUltimateLoaded) return;
  window.__linuxDoUltimateLoaded = true;
}

if (typeof window !== "undefined") {
  if (window.self !== window.top) {
    bootFrameBridge();
  } else {
    boot();
    startLinuxDoApp();
  }
}
