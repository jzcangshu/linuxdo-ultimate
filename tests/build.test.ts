import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("userscript build", () => {
  it("emits an installable single-file userscript", async () => {
    const [output, packageSource] = await Promise.all([
      readFile("dist/linuxdo-ultimate.user.js", "utf8"),
      readFile("package.json", "utf8"),
    ]);
    const packageVersion = (JSON.parse(packageSource) as { version: string }).version;

    expect(output).toContain("// ==UserScript==");
    expect(output).toContain("// @match        https://linux.do/*");
    expect(output).toContain(`// @version      ${packageVersion}`);
    expect(output).toContain("__linuxDoUltimateLoaded");
    expect(output).not.toContain("__VERSION__");
  });
});
