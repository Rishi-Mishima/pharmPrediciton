import { apiClient } from "./client";
import type { ModelInfo } from "../types/api";

export async function getModelInfo(): Promise<ModelInfo> {
  const response = await apiClient.get<ModelInfo>("/model/info");
  return response.data;
}
