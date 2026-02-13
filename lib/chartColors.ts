export function getChartColor(varName: string): string {
  if (typeof window === "undefined") return "#6366f1";
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value ? `hsl(${value})` : "#6366f1";
}
