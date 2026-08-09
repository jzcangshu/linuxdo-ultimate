import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build, type BuildOptions } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as { version: string };
const icons = [16, 32, 48, 128] as const;
const targets = [
  { outdir: "extension", manifest: "manifest.template.json", browserTarget: "chrome110" },
  { outdir: "extension-firefox", manifest: "manifest.firefox.template.json", browserTarget: "firefox140" },
] as const;

await Promise.all(targets.map(async ({ outdir: dirname, manifest, browserTarget }) => {
  const outdir = path.join(root, "dist", dirname);
  const shared: BuildOptions = {
    bundle: true,
    platform: "browser",
    target: [browserTarget],
    minify: false,
    sourcemap: false,
    legalComments: "none",
  };

  await mkdir(path.join(outdir, "icons"), { recursive: true });
  await Promise.all([
    build({ ...shared, entryPoints: [path.join(root, "src/extension/host.ts")], outfile: path.join(outdir, "host.js"), format: "iife" }),
    build({ ...shared, entryPoints: [path.join(root, "src/extension/bridge.ts")], outfile: path.join(outdir, "bridge.js"), format: "iife" }),
    build({ ...shared, entryPoints: [path.join(root, "src/extension/challenge.ts")], outfile: path.join(outdir, "challenge.js"), format: "iife" }),
    build({ ...shared, entryPoints: [path.join(root, "src/extension/background.ts")], outfile: path.join(outdir, "background.js"), format: "iife" }),
    build({ ...shared, entryPoints: [path.join(root, "src/extension/preview-runtime.ts")], outfile: path.join(outdir, "preview-runtime.js"), format: "esm" }),
    ...icons.map((size) => copyFile(
      path.join(root, "extension", "icons", `icon-${size}.png`),
      path.join(outdir, "icons", `icon-${size}.png`),
    )),
  ]);

  const manifestTemplate = await readFile(path.join(root, "extension", manifest), "utf8");
  await writeFile(
    path.join(outdir, "manifest.json"),
    manifestTemplate.replace("__VERSION__", packageJson.version),
    "utf8",
  );
}));
