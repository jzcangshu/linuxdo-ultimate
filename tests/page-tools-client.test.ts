// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageToolsClient, type OwnerViewController } from "../src/discourse/page-tools-client";

describe("page tools lazy client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-ldu-clean-mode");
    document.documentElement.removeAttribute("data-ldu-low-end");
    try { Reflect.deleteProperty(window.navigator, "hardwareConcurrency"); } catch { /* readonly browser field */ }
  });

  it("keeps the owner runtime unloaded for clean and low-end modes", () => {
    Object.defineProperty(window.navigator, "hardwareConcurrency", { configurable: true, value: 2 });
    const loadOwnerView = vi.fn();
    const client = new PageToolsClient({ loadOwnerView });
    client.setConfig({ cleanModeEnabled: true, lowEndOptimizationEnabled: true });
    expect(loadOwnerView).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.lduCleanMode).toBe("true");
    expect(document.documentElement.dataset.lduLowEnd).toBe("true");
  });

  it("loads owner view once and only pauses it while inactive", () => {
    const controller: OwnerViewController = { setActive: vi.fn(), stop: vi.fn() };
    const installer = vi.fn(() => controller);
    const loadOwnerView = vi.fn(() => installer);
    const client = new PageToolsClient({ loadOwnerView });
    client.setConfig({ ownerOnlyEnabled: true });
    expect(loadOwnerView).toHaveBeenCalledOnce();
    expect(installer).toHaveBeenCalledOnce();
    client.setActive(false);
    expect(controller.setActive).toHaveBeenLastCalledWith(false);
    expect(controller.stop).not.toHaveBeenCalled();
    client.setActive(true);
    expect(loadOwnerView).toHaveBeenCalledOnce();
    expect(installer).toHaveBeenCalledOnce();
    expect(controller.setActive).toHaveBeenLastCalledWith(true);
  });

  it("clears the native filter only when the owner feature is disabled", () => {
    const controller: OwnerViewController = { setActive: vi.fn(), stop: vi.fn() };
    const client = new PageToolsClient({ loadOwnerView: () => () => controller });
    client.setConfig({ ownerOnlyEnabled: true });

    client.setConfig({ ownerOnlyEnabled: false });

    expect(controller.stop).toHaveBeenCalledOnce();
    expect(controller.stop).toHaveBeenCalledWith(true);
  });
});
