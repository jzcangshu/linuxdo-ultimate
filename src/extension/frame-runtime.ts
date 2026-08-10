import { bootFrameBridge } from "../frame-bridge";
import type { OwnerViewInstaller } from "../discourse/page-tools-client";
import { readFramePageToolsConfig } from "../discourse/page-tools-config";

interface OwnerViewRuntimeModule {
  installOwnerView: OwnerViewInstaller;
}

const topicOwnerViewRuntime = window.name.startsWith("ldu-topic:")
  ? import(chrome.runtime.getURL("topic-tools-runtime.js")) as Promise<OwnerViewRuntimeModule>
  : null;
const initialPageToolsConfig = readFramePageToolsConfig(window.frameElement);

bootFrameBridge({
  ...(initialPageToolsConfig ? { initialPageToolsConfig } : {}),
  ...(topicOwnerViewRuntime
    ? { loadOwnerView: () => topicOwnerViewRuntime.then((module) => module.installOwnerView) }
    : {}),
});

document.getElementById("ldu-frame-bootstrap-style")?.remove();
