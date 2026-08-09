import { startLinuxDoApp } from "../app";
import type { PreviewInstaller } from "../preview/upstream-preview-controller";
import type { OwnerViewInstaller } from "../discourse/page-tools-client";
import { installExtensionRequestBridge } from "./request-client";

interface PreviewRuntimeModule {
  installLinkHoverPreviewer: PreviewInstaller;
}

interface OwnerViewRuntimeModule {
  installOwnerView: OwnerViewInstaller;
}

installExtensionRequestBridge();

if (!location.pathname.startsWith("/challenge")) {
  startLinuxDoApp({
    loadPreviewer: async () => {
      const runtimeUrl = chrome.runtime.getURL("preview-runtime.js");
      const module = await import(runtimeUrl) as PreviewRuntimeModule;
      return module.installLinkHoverPreviewer;
    },
    loadOwnerView: async () => {
      const runtimeUrl = chrome.runtime.getURL("topic-tools-runtime.js");
      const module = await import(runtimeUrl) as OwnerViewRuntimeModule;
      return module.installOwnerView;
    },
  });
}
