import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { USERSCRIPT_HEADER } from "../src/meta";

const root = path.resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
) as { version: string };

const result = await build({
  entryPoints: [path.join(root, "src/main.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome110", "firefox115"],
  minifySyntax: true,
  minifyWhitespace: true,
  minifyIdentifiers: false,
  sourcemap: false,
  write: false,
  legalComments: "none",
});

const output = result.outputFiles[0];
if (!output) throw new Error("esbuild produced no userscript output");

await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(
  path.join(root, "dist/linuxdo-ultimate.user.js"),
  `${USERSCRIPT_HEADER.replace("__VERSION__", packageJson.version)}\n\n${output.text}`,
  "utf8",
);
