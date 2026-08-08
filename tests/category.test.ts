// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { PRIMARY_CATEGORY_COLORS, resolveFixedCategoryColor } from "../src/discourse/category";

describe("fixed topic category colors", () => {
  it("uses only the fixed primary-category table", () => {
    expect(PRIMARY_CATEGORY_COLORS).toContainEqual(["福利羊毛", "rgb(228, 87, 53)"]);
    expect(resolveFixedCategoryColor("帖子标题 - 福利羊毛 - LINUX DO")).toBe("rgb(228, 87, 53)");
  });

  it("prefers the fixed parent color for nested categories", () => {
    expect(resolveFixedCategoryColor("帖子标题 - 福利羊毛 / 福利羊毛, Lv1 - LINUX DO"))
      .toBe("rgb(228, 87, 53)");
    expect(resolveFixedCategoryColor("帖子标题 - 搞七捻三, Lv1 - LINUX DO"))
      .toBe("rgb(58, 181, 74)");
  });

  it("never reads colors from page metadata or category badges", () => {
    document.body.innerHTML = `
      <meta property="og:article:section:color" content="ff0000">
      <a class="badge-category__wrapper" style="--category-badge-color:#00ff00">
        <span class="badge-category__name">自定义分类</span>
      </a>
    `;
    expect(resolveFixedCategoryColor("帖子标题 - 自定义分类 - LINUX DO")).toBeNull();
  });
});
