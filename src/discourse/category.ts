export const PRIMARY_CATEGORY_COLORS = [
  ["开发调优", "rgb(50, 195, 195)"],
  ["国产替代", "rgb(209, 44, 37)"],
  ["资源荟萃", "rgb(18, 168, 157)"],
  ["文档共建", "rgb(156, 182, 196)"],
  ["跳蚤市场", "rgb(237, 32, 123)"],
  ["积分乐园", "rgb(252, 202, 68)"],
  ["非我莫属", "rgb(168, 198, 254)"],
  ["读书成诗", "rgb(224, 217, 0)"],
  ["扬帆起航", "rgb(255, 152, 56)"],
  ["前沿快讯", "rgb(187, 143, 206)"],
  ["网络记忆", "rgb(247, 148, 29)"],
  ["福利羊毛", "rgb(228, 87, 53)"],
  ["搞七捻三", "rgb(58, 181, 74)"],
  ["社区孵化", "rgb(255, 187, 0)"],
  ["虫洞广场", "rgb(255, 0, 247)"],
  ["运营反馈", "rgb(128, 130, 129)"],
  ["深海幽域", "rgb(69, 183, 209)"],
] as const;

export function resolveFixedCategoryColor(title: string): string | null {
  const titleWithoutSite = title.replace(/\s+-\s+LINUX DO(?:\s.*)?$/i, "");
  const separatorIndex = titleWithoutSite.lastIndexOf(" - ");
  const category = titleWithoutSite.slice(separatorIndex < 0 ? 0 : separatorIndex + 3).trim();
  const match = PRIMARY_CATEGORY_COLORS.find(([name]) => (
    category === name
    || category.startsWith(`${name} /`)
    || category.startsWith(`${name},`)
  ));
  return match?.[1] ?? null;
}
