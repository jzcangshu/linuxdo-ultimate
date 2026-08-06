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

export function readTopicCategory(
  root: ParentNode,
  view: Window | null = typeof window === "undefined" ? null : window,
): TopicCategoryPresentation | null {
  const rootElement = root instanceof Element ? root : null;
  const wrapper = (rootElement?.matches(".badge-category__wrapper") ? rootElement : null)
    ?? root.querySelector<HTMLElement>(".badge-category__wrapper");
  if (!(wrapper instanceof HTMLElement)) return null;
  const categoryName = wrapper.querySelector<HTMLElement>(".badge-category__name")?.textContent?.trim() ?? "";
  const categoryColor = normalizeCategoryColor(
    wrapper.style.getPropertyValue("--category-badge-color")
      || view?.getComputedStyle(wrapper).getPropertyValue("--category-badge-color"),
  );
  return categoryName && categoryColor ? { categoryName, categoryColor } : null;
}
