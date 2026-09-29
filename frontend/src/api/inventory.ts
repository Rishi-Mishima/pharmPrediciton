import { apiClient } from "./client";
import type { Inventory } from "../types/api";

export type CreateInventoryPayload = {
  drug_id: number;
  current_stock: number;
  safety_stock: number;
  lead_time_days: number;
};

export async function getInventory(): Promise<Inventory[]> {
  const response = await apiClient.get<Inventory[]>("/inventory");
  return response.data;
}

export async function createInventory(
  payload: CreateInventoryPayload,
): Promise<Inventory> {
  const response = await apiClient.post<Inventory>("/inventory", payload);
  return response.data;
}
