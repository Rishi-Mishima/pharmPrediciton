import type { EnrichedInventory } from "./inventory";

export type OperationalAlert = {
  level: "CRITICAL" | "LOW STOCK" | "MODEL";
  message: string;
  tone: string;
};

export function buildAlerts(
  inventory: EnrichedInventory[],
  forecastDemand?: number,
): OperationalAlert[] {
  const alerts = inventory
    .filter((item) => item.status !== "Healthy")
    .slice(0, 4)
    .map((item): OperationalAlert => {
      const isCritical = item.status === "Critical";

      return {
        level: isCritical ? "CRITICAL" : "LOW STOCK",
        message: `${item.drug?.name ?? "Unknown drug"} inventory ${
          isCritical ? "below critical threshold" : "approaching safety stock"
        }.`,
        tone: isCritical
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-amber-200 bg-amber-50 text-amber-800",
      };
    });

  if (forecastDemand && forecastDemand > 45) {
    alerts.push({
      level: "MODEL",
      message: "Forecast indicates elevated near-term demand.",
      tone: "border-blue-200 bg-blue-50 text-blue-800",
    });
  }

  if (alerts.length === 0) {
    return [
      {
        level: "MODEL",
        message: "No immediate inventory risks detected from current records.",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      },
    ];
  }

  return alerts;
}
