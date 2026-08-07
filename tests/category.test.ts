// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { normalizeCategoryColor, readTopicCategory } from "../src/discourse/category";

describe("topic category presentation", () => {
  it("reads elements from an iframe realm through that frame's constructors", () => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const frameWindow = iframe.contentWindow!;
    const frameDocument = iframe.contentDocument!;
    frameDocument.body.innerHTML = `
      <a class="badge-category__wrapper" style="--category-badge-color: #ff9838">
        <span class="badge-category__name">扬帆起航</span>
      </a>
    `;

    expect(frameDocument.body instanceof window.Element).toBe(false);
    expect(readTopicCategory(frameDocument, frameWindow)).toEqual({
      categoryName: "扬帆起航",
      categoryColor: "#ff9838",
    });
  });

  it("accepts modern forum color syntax without accepting CSS injection", () => {
    expect(normalizeCategoryColor("oklch(72% 0.18 45)")).toBe("oklch(72% 0.18 45)");
    expect(normalizeCategoryColor("color(display-p3 1 0.5 0)")).toBe("color(display-p3 1 0.5 0)");
    expect(normalizeCategoryColor("red; background: url(x)")).toBeNull();
  });
});
