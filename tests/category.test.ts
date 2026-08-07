// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { readTopicCategory, readTopicDocumentCategory } from "../src/discourse/category";

describe("topic category metadata", () => {
  it("uses the most specific Open Graph category", () => {
    document.head.innerHTML = `
      <meta property="og:article:section" content="福利羊毛">
      <meta property="og:article:section:color" content="E45735">
      <meta property="og:article:section" content="福利羊毛, Lv1">
      <meta property="og:article:section:color" content="0088CC">
    `;

    expect(readTopicDocumentCategory(document)).toEqual({
      categoryName: "福利羊毛, Lv1",
      categoryColor: "#0088CC",
    });
  });

  it("falls back only to the topic title category area", () => {
    document.head.replaceChildren();
    document.body.innerHTML = `
      <a class="badge-category__wrapper" style="--category-badge-color:#808281">
        <span class="badge-category__name">运营反馈</span>
      </a>
      <div class="topic-category">
        <a class="badge-category__wrapper" style="--category-badge-color:#E45735">
          <span class="badge-category__name">福利羊毛</span>
        </a>
        <a class="badge-category__wrapper" style="--category-badge-color:#0088CC">
          <span class="badge-category__name">福利羊毛, Lv1</span>
        </a>
      </div>
    `;

    expect(readTopicDocumentCategory(document)).toEqual({
      categoryName: "福利羊毛, Lv1",
      categoryColor: "#0088CC",
    });
  });

  it("reads only the supplied topic row and prefers its last category", () => {
    document.body.innerHTML = `
      <div class="topic-list-item" id="wrong">
        <a class="badge-category__wrapper" style="--category-badge-color:#808281">
          <span class="badge-category__name">运营反馈</span>
        </a>
      </div>
      <div class="topic-list-item" id="target">
        <a class="badge-category__wrapper" style="--category-badge-color:#E45735">
          <span class="badge-category__name">福利羊毛</span>
        </a>
        <a class="badge-category__wrapper" style="--category-badge-color:#0088CC">
          <span class="badge-category__name">福利羊毛, Lv1</span>
        </a>
      </div>
    `;

    expect(readTopicCategory(document.querySelector("#target")!)).toEqual({
      categoryName: "福利羊毛, Lv1",
      categoryColor: "#0088CC",
    });
  });
});
