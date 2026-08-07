export interface TopicCategoryPresentation {
  categoryName: string;
  categoryColor: string;
}

export function normalizeCategoryColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const color = value.trim();
  return /^(?:#[\da-f]{3,8}|rgba?\([\d\s.,%+-]+\)|hsla?\([\d\s.,%+-]+\))$/i.test(color)
    ? color
    : null;
}

function readWrapperCategory(wrapper: Element, view: Window | null): TopicCategoryPresentation | null {
  const htmlWrapper = wrapper as HTMLElement;
  const categoryName = wrapper.querySelector<HTMLElement>(".badge-category__name")?.textContent?.trim() ?? "";
  const categoryColor = normalizeCategoryColor(
    htmlWrapper.style?.getPropertyValue("--category-badge-color")
      || view?.getComputedStyle(htmlWrapper).getPropertyValue("--category-badge-color"),
  );
  return categoryName && categoryColor ? { categoryName, categoryColor } : null;
}

export function readTopicCategory(
  root: ParentNode,
  view: Window | null = typeof window === "undefined" ? null : window,
): TopicCategoryPresentation | null {
  const realm = view as (Window & { Element: typeof Element }) | null;
  const rootElement = realm?.Element && root instanceof realm.Element ? root as Element : null;
  const wrappers = rootElement?.matches(".badge-category__wrapper")
    ? [rootElement]
    : [...root.querySelectorAll<HTMLElement>(".badge-category__wrapper")];
  for (let index = wrappers.length - 1; index >= 0; index -= 1) {
    const category = readWrapperCategory(wrappers[index]!, view);
    if (category) return category;
  }
  return null;
}

export function readTopicDocumentCategory(
  document: Document,
  view: Window | null = document.defaultView,
): TopicCategoryPresentation | null {
  let pendingName = "";
  let result: TopicCategoryPresentation | null = null;
  const metadata = document.querySelectorAll<HTMLMetaElement>(
    'meta[property="og:article:section"], meta[property="og:article:section:color"]',
  );
  for (const meta of metadata) {
    if (meta.getAttribute("property") === "og:article:section") {
      pendingName = meta.content.trim();
      continue;
    }
    const rawColor = meta.content.trim();
    const categoryColor = normalizeCategoryColor(/^[\da-f]{3,8}$/i.test(rawColor) ? `#${rawColor}` : rawColor);
    if (pendingName && categoryColor) result = { categoryName: pendingName, categoryColor };
    pendingName = "";
  }
  const topicCategory = document.querySelector(".topic-category");
  return result ?? (topicCategory ? readTopicCategory(topicCategory, view) : null);
}
