import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";

describe("extension release archive", () => {
  it.each(["chrome", "firefox"])("contains the complete %s extension at the archive root", async (browser) => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8")) as { version: string };
    const archive = await readFile(`dist/linuxdo-ultimate-v${packageJson.version}-${browser}.zip`);
    const files = unzipSync(new Uint8Array(archive));
    const manifest = JSON.parse(strFromU8(files["manifest.json"]!)) as { name: string; version: string };

    expect(Object.keys(files).sort()).toEqual([
      "background.js",
      "bridge.js",
      "host.js",
      "icons/icon-128.png",
      "icons/icon-16.png",
      "icons/icon-32.png",
      "icons/icon-48.png",
      "manifest.json",
      "preview-runtime.js",
    ]);
    expect(manifest.name).toBe("Linux Do Ultimate");
    expect(manifest.version).toBe(packageJson.version);
  });
});
