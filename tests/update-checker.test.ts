import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { MemoryStorage } from "../src/core/storage";
import {
  UPDATE_MANIFEST_URL,
  UpdateChecker,
  compareVersions,
  validateUpdateManifest,
  type UpdateRequest,
  type UpdateRequestOptions,
} from "../src/core/update-checker";

const manifest = {
  schemaVersion: 1 as const,
  version: "0.4.2",
  publishedAt: "2026-08-08",
  releaseUrl: "https://github.com/jzcangshu/linuxdo-ultimate/releases/tag/v0.4.2",
  changelog: ["新增检查更新。"],
};

function successfulRequest(payload = manifest): { request: UpdateRequest; calls: UpdateRequestOptions[] } {
  const calls: UpdateRequestOptions[] = [];
  return {
    calls,
    request: (options) => {
      calls.push(options);
      queueMicrotask(() => options.onload({ status: 200, responseText: JSON.stringify(payload) }));
      return {};
    },
  };
}

describe("update checker", () => {
  it("compares semantic versions numerically", () => {
    expect(compareVersions("0.4.10", "0.4.2")).toBe(1);
    expect(compareVersions("0.4.1", "0.4.2")).toBe(-1);
    expect(compareVersions("v1.0.0", "1.0.0")).toBe(0);
  });

  it("accepts only the repository release destination", () => {
    expect(validateUpdateManifest(manifest)).toEqual(manifest);
    expect(() => validateUpdateManifest({ ...manifest, releaseUrl: "https://example.com/v0.4.2" })).toThrow();
  });

  it("detects an update and reuses the 24-hour cache", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T00:00:00Z"));
    const storage = new MemoryStorage();
    const transport = successfulRequest();
    const checker = new UpdateChecker(storage, transport.request, "0.4.1");

    await expect(checker.check()).resolves.toEqual({ status: "available", manifest });
    await expect(checker.check()).resolves.toEqual({ status: "available", manifest });
    expect(transport.calls).toHaveLength(1);
    expect(transport.calls[0]?.url).toBe(UPDATE_MANIFEST_URL);
    vi.useRealTimers();
  });

  it("bypasses cache for a manual check", async () => {
    const storage = new MemoryStorage();
    const transport = successfulRequest();
    const checker = new UpdateChecker(storage, transport.request, "0.4.2");
    await checker.check();
    await expect(checker.check(true)).resolves.toEqual({ status: "current", version: "0.4.2" });
    expect(transport.calls).toHaveLength(2);
    expect(transport.calls[1]?.url).toContain("?t=");
  });

  it("keeps the repository manifest version synchronized with package metadata", async () => {
    const [packageSource, manifestSource] = await Promise.all([
      readFile("package.json", "utf8"),
      readFile("updates/latest.json", "utf8"),
    ]);
    expect(JSON.parse(manifestSource).version).toBe(JSON.parse(packageSource).version);
  });
});
