export interface TopicCategoryPresentation {
  categoryName: string;
  categoryColor: string;
}

export function normalizeCategoryColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const color = value.trim();
  return /^(?:#[\da-f]{3,8}|rgba?\([\d\s.,%+-]+\)|hsla?\([\d\s.,%+-]+\)|(?:oklab|oklch|lab|lch|color)\([^;{}]+\))$/i.test(color)
    ? color
    : null;
}

export function readTopicCategory(
  root: ParentNode,
  view: Window | null = typeof window === "undefined" ? null : window,
): TopicCategoryPresentation | null {
  const realm = view as (Window & { Element: typeof Element; HTMLElement: typeof HTMLElement }) | null;
  const ElementCtor = realm?.Element;
  const HTMLElementCtor = realm?.HTMLElement;
  const rootElement = ElementCtor && root instanceof ElementCtor ? root as Element : null;
  const wrapper = (rootElement?.matches(".badge-category__wrapper") ? rootElement : null)
    ?? root.querySelector<HTMLElement>(".badge-category__wrapper");
  if (!wrapper || (HTMLElementCtor && !(wrapper instanceof HTMLElementCtor))) return null;
  const htmlWrapper = wrapper as HTMLElement;
  const categoryName = wrapper.querySelector<HTMLElement>(".badge-category__name")?.textContent?.trim() ?? "";
  const categoryColor = normalizeCategoryColor(
    htmlWrapper.style.getPropertyValue("--category-badge-color")
      || view?.getComputedStyle(htmlWrapper).getPropertyValue("--category-badge-color"),
  );
  return categoryName && categoryColor ? { categoryName, categoryColor } : null;
}
