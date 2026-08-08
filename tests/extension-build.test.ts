import { readFile, stat } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("browser extension build", () => {
  it("isolates host, bridge and lazy preview artifacts", async () => {
    const [manifestSource, packageSource, host, bridge, preview] = await Promise.all([
      readFile("dist/extension/manifest.json", "utf8"),
      readFile("package.json", "utf8"),
      readFile("dist/extension/host.js", "utf8"),
      readFile("dist/extension/bridge.js", "utf8"),
      readFile("dist/extension/preview-runtime.js", "utf8"),
    ]);
    const manifest = JSON.parse(manifestSource) as {
      version: string;
      content_scripts: Array<{ js: string[]; all_frames: boolean }>;
      web_accessible_resources: Array<{ resources: string[] }>;
    };
    const version = (JSON.parse(packageSource) as { version: string }).version;

    expect(manifest.version).toBe(version);
    expect(manifest.content_scripts).toEqual(expect.arrayContaining([
      expect.objectContaining({ js: ["host.js"], all_frames: false }),
      expect.objectContaining({ js: ["bridge.js"], all_frames: true }),
    ]));
    expect(manifest.web_accessible_resources[0]?.resources).toContain("preview-runtime.js");
    expect(host).toContain("preview-runtime.js");
    expect(host).not.toContain("agy-preview-container");
    expect(bridge).toContain("ldu:frame-ready");
    expect(bridge).not.toContain("LinuxDoApp");
    expect(bridge).not.toContain("agy-preview-container");
    expect(preview).toContain("agy-preview-container");
    expect((await stat("dist/extension/background.js")).size).toBeGreaterThan(0);
  });
});
