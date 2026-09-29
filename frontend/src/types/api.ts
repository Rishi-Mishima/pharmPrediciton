export type Drug = {
  id: number;
  code: string;
  name: string;
};

export type Inventory = {
  id: number;
  drug_id: number;
  current_stock: number;
  safety_stock: number;
  lead_time_days: number;
};

export type DemandHistory = {
  id: number;
  drug_id: number;
  date: string;
  demand: number;
};

export type PredictionInput = {
  lag_1: number;
  lag_7: number;
  lag_14: number;
  lag_28: number;
  rolling_mean_7: number;
  rolling_mean_28: number;
  dow_sin: number;
  dow_cos: number;
  month_sin: number;
  month_cos: number;
  doy_sin: number;
  doy_cos: number;
  is_weekend: number;
};

export type PredictionResponse = {
  prediction: number;
};

export type DrugForecastResponse = {
  drug_id: number;
  drug_code: string;
  forecast_date: string;
  predicted_demand: number;
};

export type ModelInfo = {
  model_type: string;
  features: string[];
  metrics: Record<string, number | string>;
};

export type HealthStatus = {
  status: string;
  model_loaded: boolean;
};

export type ApiErrorPayload = {
  detail?: string | Array<{ loc?: Array<string | number>; msg: string; type?: string }>;
};
