import { bootFrameBridge } from "../frame-bridge";
import type { OwnerViewInstaller } from "../discourse/page-tools-client";

interface OwnerViewRuntimeModule {
  installOwnerView: OwnerViewInstaller;
}

bootFrameBridge({
  loadOwnerView: async () => {
    const runtimeUrl = chrome.runtime.getURL("topic-tools-runtime.js");
    const module = await import(runtimeUrl) as OwnerViewRuntimeModule;
    return module.installOwnerView;
  },
});

document.getElementById("ldu-frame-bootstrap-style")?.remove();
