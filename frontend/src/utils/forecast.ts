import type { DemandHistory, PredictionInput } from "../types/api";

export type ForecastPoint = {
  date: string;
  observed?: number;
  predicted?: number;
  marker?: string;
};

export function buildPredictionInput(history: DemandHistory[]): PredictionInput {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted.at(-1)?.demand ?? 40;
  const lag = (days: number) => sorted.at(-days)?.demand ?? last;
  const average = (days: number) => {
    const window = sorted.slice(-days);
    if (window.length === 0) {
      return last;
    }

    return window.reduce((sum, item) => sum + item.demand, 0) / window.length;
  };
  const lastDate = sorted.at(-1)?.date ?? new Date().toISOString().slice(0, 10);
  const targetDate = new Date(lastDate);
  targetDate.setDate(targetDate.getDate() + 1);
  const day = targetDate.getDay();
  const month = targetDate.getMonth() + 1;
  const start = new Date(targetDate.getFullYear(), 0, 0);
  const doy = Math.floor(
    (targetDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    lag_1: lag(1),
    lag_7: lag(7),
    lag_14: lag(14),
    lag_28: lag(28),
    rolling_mean_7: average(7),
    rolling_mean_28: average(28),
    dow_sin: Math.sin((2 * Math.PI * day) / 7),
    dow_cos: Math.cos((2 * Math.PI * day) / 7),
    month_sin: Math.sin((2 * Math.PI * month) / 12),
    month_cos: Math.cos((2 * Math.PI * month) / 12),
    doy_sin: Math.sin((2 * Math.PI * doy) / 365),
    doy_cos: Math.cos((2 * Math.PI * doy) / 365),
    is_weekend: day === 0 || day === 6 ? 1 : 0,
  };
}

export function buildForecastSeries(
  history: DemandHistory[],
  prediction?: { date?: string; demand?: number },
): ForecastPoint[] {
  const observed = history.slice(-30).map((item) => ({
    date: item.date,
    observed: item.demand,
  }));

  if (!prediction?.demand) {
    return observed;
  }

  const lastPoint = observed.at(-1);
  const forecastDate = prediction.date ?? nextDate(lastPoint?.date);

  return [
    ...observed,
    {
      date: lastPoint?.date ?? forecastDate,
      observed: lastPoint?.observed,
      predicted: lastPoint?.observed,
      marker: "Forecast begins",
    },
    {
      date: forecastDate,
      predicted: prediction.demand,
    },
  ];
}

function nextDate(value?: string): string {
  const date = value ? new Date(value) : new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
