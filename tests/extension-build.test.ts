import { readFile, stat } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("browser extension build", () => {
  it.each([
    ["chrome", "dist/extension"],
    ["firefox", "dist/extension-firefox"],
  ])("isolates host, bridge and lazy preview artifacts for %s", async (_browser, outdir) => {
    const [manifestSource, packageSource, host, bridge, frameRuntime, ownerRuntime, challenge, preview] = await Promise.all([
      readFile(`${outdir}/manifest.json`, "utf8"),
      readFile("package.json", "utf8"),
      readFile(`${outdir}/host.js`, "utf8"),
      readFile(`${outdir}/bridge.js`, "utf8"),
      readFile(`${outdir}/frame-runtime.js`, "utf8"),
      readFile(`${outdir}/topic-tools-runtime.js`, "utf8"),
      readFile(`${outdir}/challenge.js`, "utf8"),
      readFile(`${outdir}/preview-runtime.js`, "utf8"),
    ]);
    const manifest = JSON.parse(manifestSource) as {
      name: string;
      version: string;
      icons: Record<string, string>;
      content_scripts: Array<{ js: string[]; all_frames: boolean }>;
      web_accessible_resources: Array<{ resources: string[] }>;
    };
    const version = (JSON.parse(packageSource) as { version: string }).version;

    expect(manifest.version).toBe(version);
    expect(manifest.name).toBe("Linux Do Ultimate");
    expect(manifest.icons).toEqual({
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png",
    });
    expect(manifest.content_scripts).toEqual(expect.arrayContaining([
      expect.objectContaining({ js: ["host.js"], all_frames: false }),
      expect.objectContaining({ js: ["bridge.js"], all_frames: true }),
      expect.objectContaining({ js: ["challenge.js"], all_frames: true }),
    ]));
    expect(manifest.web_accessible_resources[0]?.resources).toContain("preview-runtime.js");
    expect(manifest.web_accessible_resources[0]?.resources).toEqual(expect.arrayContaining([
      "frame-runtime.js",
      "topic-tools-runtime.js",
    ]));
    expect(host).toContain("preview-runtime.js");
    expect(host).toContain("topic-tools-runtime.js");
    expect(host).not.toContain("agy-preview-container");
    expect(host).not.toContain("当前只看楼主");
    expect(bridge).toContain("frame-runtime.js");
    expect(bridge).not.toContain("ldu:frame-ready");
    expect(bridge.length).toBeLessThan(5_000);
    expect(bridge).not.toContain("LinuxDoApp");
    expect(bridge).not.toContain("agy-preview-container");
    expect(frameRuntime).toContain("ldu:frame-ready");
    expect(frameRuntime).toContain("topic-tools-runtime.js");
    expect(frameRuntime).toContain("ldu-topic:");
    expect(frameRuntime).not.toContain("当前只看楼主");
    expect(ownerRuntime).toContain("ldu-owner-toggle");
    expect(challenge).toContain("linux_do_auto_challenge_nf_guard");
    expect(challenge).toContain("403 error");
    expect(challenge).not.toContain("LinuxDoApp");
    expect(challenge).not.toContain("agy-preview-container");
    expect(preview).toContain("agy-preview-container");
    expect((await stat(`${outdir}/background.js`)).size).toBeGreaterThan(0);
    await Promise.all([16, 32, 48, 128].map(async (size) => {
      expect((await stat(`${outdir}/icons/icon-${size}.png`)).size).toBeGreaterThan(0);
    }));
  });

  it("uses browser-specific background declarations", async () => {
    const [chromeManifest, firefoxManifest] = await Promise.all([
      readFile("dist/extension/manifest.json", "utf8").then((source) => JSON.parse(source)),
      readFile("dist/extension-firefox/manifest.json", "utf8").then((source) => JSON.parse(source)),
    ]);
    expect(chromeManifest.background).toEqual({ service_worker: "background.js" });
    expect(firefoxManifest.background).toEqual({ scripts: ["background.js"] });
    expect(firefoxManifest.browser_specific_settings.gecko.id).toBe("linuxdo-ultimate@jzcangshu");
    expect(firefoxManifest.browser_specific_settings.gecko.strict_min_version).toBe("140.0");
  });
});
