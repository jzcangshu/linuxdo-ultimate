import { describe, expect, it } from "vitest";
import { resolveLayoutMode } from "../src/ui/layout-controller";

describe("layout breakpoints", () => {
  it("uses three panes on wide screens when auto", () => {
    expect(resolveLayoutMode("auto", 1888)).toBe("three");
  });

  it("uses two panes on medium screens when auto", () => {
    expect(resolveLayoutMode("auto", 1440)).toBe("two");
  });

  it("falls back to native layout on narrow screens", () => {
    expect(resolveLayoutMode("auto", 900)).toBe("native");
    expect(resolveLayoutMode("three", 900)).toBe("native");
  });
});
