import type { DemandHistory, Drug, ModelInfo } from "../types/api";
import type { EnrichedInventory } from "../utils/inventory";

export type DashboardData = {
  drugs: Drug[];
  inventory: EnrichedInventory[];
  enrichedInventory: EnrichedInventory[];
  demandHistory: DemandHistory[];
  latestForecast?: { date: string; demand: number };
  modelInfo?: ModelInfo;
};
