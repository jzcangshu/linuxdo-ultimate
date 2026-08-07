// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { iconSvg, type IconName } from "../src/ui/icons";

describe("operation icon system", () => {
  it("renders every icon on one consistent line-art canvas", () => {
    const names: IconName[] = [
      "settings", "close", "split", "external", "refresh", "copy", "bookmark",
      "bookmark-filled", "close-others", "list", "check", "maximize", "restore", "trash", "github", "gift",
    ];
    for (const name of names) {
      const host = document.createElement("div");
      host.innerHTML = iconSvg(name, 18);
      const svg = host.querySelector("svg")!;
      expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
      expect(svg.getAttribute("stroke-width")).toBe("1.8");
      expect(svg.getAttribute("stroke-linecap")).toBe("round");
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.classList.contains(`ldu-symbol-${name}`)).toBe(true);
    }
  });
});
