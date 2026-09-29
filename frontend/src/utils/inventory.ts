import type { Drug, Inventory } from "../types/api";

export type InventoryStatus = "Critical" | "Low Stock" | "Healthy";

export type EnrichedInventory = Inventory & {
  drug?: Drug;
  status: InventoryStatus;
  coverageDays: number | null;
};

export function getInventoryStatus(
  currentStock: number,
  safetyStock: number,
): InventoryStatus {
  if (currentStock <= safetyStock * 0.5) {
    return "Critical";
  }

  if (currentStock <= safetyStock) {
    return "Low Stock";
  }

  return "Healthy";
}

export function calculateCoverageDays(
  currentStock: number,
  dailyDemand: number | null | undefined,
): number | null {
  if (!dailyDemand || dailyDemand <= 0) {
    return null;
  }

  return currentStock / dailyDemand;
}

export function enrichInventory(
  inventory: Inventory[],
  drugs: Drug[],
  demandByDrugId: Record<number, number | undefined> = {},
): EnrichedInventory[] {
  return inventory.map((item) => ({
    ...item,
    drug: drugs.find((drug) => drug.id === item.drug_id),
    status: getInventoryStatus(item.current_stock, item.safety_stock),
    coverageDays: calculateCoverageDays(
      item.current_stock,
      demandByDrugId[item.drug_id],
    ),
  }));
}

export function statusTone(status: InventoryStatus): string {
  if (status === "Critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "Low Stock") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function getReorderRecommendation(
  currentStock: number,
  safetyStock: number,
  predictedDemand: number,
): string {
  const coverage = calculateCoverageDays(currentStock, predictedDemand);

  if (getInventoryStatus(currentStock, safetyStock) === "Critical") {
    return "Critical stock level. Create a replenishment action for this product.";
  }

  if (coverage !== null && coverage < 7) {
    return "Reorder may be required soon based on forecast coverage.";
  }

  if (currentStock <= safetyStock) {
    return "Stock is close to the safety threshold. Monitor replenishment timing.";
  }

  return "Healthy inventory position for the current forecast.";
}
