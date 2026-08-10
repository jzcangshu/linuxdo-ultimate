import { bootFrameBridge } from "../frame-bridge";
import type { OwnerViewInstaller } from "../discourse/page-tools-client";

interface OwnerViewRuntimeModule {
  installOwnerView: OwnerViewInstaller;
}

const topicOwnerViewRuntime = window.name.startsWith("ldu-topic:")
  ? import(chrome.runtime.getURL("topic-tools-runtime.js")) as Promise<OwnerViewRuntimeModule>
  : null;

bootFrameBridge({
  ...(topicOwnerViewRuntime
    ? { loadOwnerView: () => topicOwnerViewRuntime.then((module) => module.installOwnerView) }
    : {}),
});

document.getElementById("ldu-frame-bootstrap-style")?.remove();
