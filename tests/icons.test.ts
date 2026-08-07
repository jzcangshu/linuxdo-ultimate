// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createIcon, iconSvg, setIcon } from "../src/ui/icons";

describe("shared icons", () => {
  it("renders consistent decorative SVG icons", () => {
    expect(iconSvg("refresh", 18)).toContain('class="ldu-symbol ldu-symbol-refresh"');
    expect(iconSvg("refresh", 18)).toContain('aria-hidden="true"');
    const button = document.createElement("button");
    setIcon(button, "close", 16);
    expect(button.querySelector(".ldu-symbol-close")).not.toBeNull();
    expect(createIcon(document, "bookmark").querySelector(".ldu-symbol-bookmark")).not.toBeNull();
  });
});
