import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { zipSync } from "fflate";

const root = path.resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as { version: string };
const files = [
  "manifest.json",
  "host.js",
  "bridge.js",
  "preview-runtime.js",
  "background.js",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
] as const;
const targets = [
  { browser: "chrome", directory: "extension" },
  { browser: "firefox", directory: "extension-firefox" },
] as const;

await Promise.all(targets.map(async ({ browser, directory }) => {
  const extensionDir = path.join(root, "dist", directory);
  const entries = Object.fromEntries(await Promise.all(files.map(async (name) => [
    name,
    new Uint8Array(await readFile(path.join(extensionDir, ...name.split("/")))),
  ] as const)));
  const archive = zipSync(entries, { level: 9 });
  const output = path.join(root, "dist", `linuxdo-ultimate-v${packageJson.version}-${browser}.zip`);
  await writeFile(output, archive);
  console.log(`Created ${path.relative(root, output)} (${archive.byteLength} bytes)`);
}));
