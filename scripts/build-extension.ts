import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build, type BuildOptions } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const outdir = path.join(root, "dist", "extension");
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as { version: string };

const shared: BuildOptions = {
  bundle: true,
  platform: "browser",
  target: ["chrome110"],
  minify: false,
  sourcemap: false,
  legalComments: "none",
};

await mkdir(outdir, { recursive: true });
await Promise.all([
  build({ ...shared, entryPoints: [path.join(root, "src/extension/host.ts")], outfile: path.join(outdir, "host.js"), format: "iife" }),
  build({ ...shared, entryPoints: [path.join(root, "src/extension/bridge.ts")], outfile: path.join(outdir, "bridge.js"), format: "iife" }),
  build({ ...shared, entryPoints: [path.join(root, "src/extension/background.ts")], outfile: path.join(outdir, "background.js"), format: "iife" }),
  build({ ...shared, entryPoints: [path.join(root, "src/extension/preview-runtime.ts")], outfile: path.join(outdir, "preview-runtime.js"), format: "esm" }),
]);

const manifestTemplate = await readFile(path.join(root, "extension", "manifest.template.json"), "utf8");
await writeFile(
  path.join(outdir, "manifest.json"),
  manifestTemplate.replace("__VERSION__", packageJson.version),
  "utf8",
);
