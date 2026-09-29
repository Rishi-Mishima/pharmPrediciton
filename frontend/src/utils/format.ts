export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatMetric(value: number | string | undefined): string {
  if (value === undefined) {
    return "N/A";
  }

  if (typeof value === "number") {
    return formatNumber(value, value < 10 ? 3 : 2);
  }

  return value;
}

export function compactDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
