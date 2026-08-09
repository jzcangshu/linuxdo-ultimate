declare global {
  interface Window {
    __linuxDoUltimateLoaded?: boolean;
    __LDU_TEST_MODE__?: boolean;
    __LDU_TEST_API__?: { openTopic: (url: string, title: string) => void };
  }
}

import { startLinuxDoApp } from "./app";
import { bootChallengeBypass } from "./discourse/challenge-bypass";
import { bootFrameBridge } from "./frame-bridge";
import { installLinkHoverPreviewer } from "./preview/link-hover-previewer-upstream";

export function boot(): void {
  if (window.__linuxDoUltimateLoaded) return;
  window.__linuxDoUltimateLoaded = true;
}

if (typeof window !== "undefined") {
  bootChallengeBypass({ registerManualCommand: true });
  if (!location.pathname.startsWith("/challenge")) {
    if (window.self !== window.top) {
      bootFrameBridge();
    } else {
      boot();
      startLinuxDoApp({ loadPreviewer: () => installLinkHoverPreviewer });
    }
  }
}
