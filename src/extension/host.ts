import { startLinuxDoApp } from "../app";
import type { PreviewInstaller } from "../preview/upstream-preview-controller";
import { installExtensionRequestBridge } from "./request-client";

interface PreviewRuntimeModule {
  installLinkHoverPreviewer: PreviewInstaller;
}

installExtensionRequestBridge();

if (!location.pathname.startsWith("/challenge")) {
  startLinuxDoApp({
    loadPreviewer: async () => {
      const runtimeUrl = chrome.runtime.getURL("preview-runtime.js");
      const module = await import(runtimeUrl) as PreviewRuntimeModule;
      return module.installLinkHoverPreviewer;
    },
  });
}
