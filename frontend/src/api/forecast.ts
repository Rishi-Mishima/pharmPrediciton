import { apiClient } from "./client";
import type {
  DrugForecastResponse,
  PredictionInput,
  PredictionResponse,
} from "../types/api";

export async function predictDemand(
  payload: PredictionInput,
): Promise<PredictionResponse> {
  const response = await apiClient.post<PredictionResponse>("/predict", payload);
  return response.data;
}

export async function forecastDrug(drugId: number): Promise<DrugForecastResponse> {
  const response = await apiClient.post<DrugForecastResponse>(
    `/drugs/${drugId}/forecast`,
  );
  return response.data;
}
