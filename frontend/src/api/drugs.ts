import { apiClient } from "./client";
import type { DemandHistory, Drug } from "../types/api";

export type CreateDrugPayload = Pick<Drug, "code" | "name">;

export async function getDrugs(): Promise<Drug[]> {
  const response = await apiClient.get<Drug[]>("/drugs");
  return response.data;
}

export async function createDrug(payload: CreateDrugPayload): Promise<Drug> {
  const response = await apiClient.post<Drug>("/drugs", payload);
  return response.data;
}

export async function getDemandHistory(drugId: number): Promise<DemandHistory[]> {
  const response = await apiClient.get<DemandHistory[]>(
    `/drugs/${drugId}/demand-history`,
  );
  return response.data;
}
