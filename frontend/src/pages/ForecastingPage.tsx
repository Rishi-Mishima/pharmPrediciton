import { Calculator, Package, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { forecastDrug, predictDemand } from "../api/forecast";
import { getApiErrorMessage } from "../api/client";
import { KpiCard } from "../components/KpiCard";
import { StatusBadge } from "../components/StatusBadge";
import { sampleDemandHistory } from "../data/sampleDemand";
import type { DemandHistory, Drug, PredictionInput } from "../types/api";
import { compactDate, formatNumber } from "../utils/format";
import { buildForecastSeries, buildPredictionInput } from "../utils/forecast";
import {
  calculateCoverageDays,
  getInventoryStatus,
  getReorderRecommendation,
  type EnrichedInventory,
} from "../utils/inventory";

type ForecastingPageProps = {
  drugs: Drug[];
  inventory: EnrichedInventory[];
  demandHistory: DemandHistory[];
};

const fieldLabels: Record<keyof PredictionInput, string> = {
  lag_1: "Lag 1",
  lag_7: "Lag 7",
  lag_14: "Lag 14",
  lag_28: "Lag 28",
  rolling_mean_7: "Rolling Mean 7",
  rolling_mean_28: "Rolling Mean 28",
  dow_sin: "DOW Sin",
  dow_cos: "DOW Cos",
  month_sin: "Month Sin",
  month_cos: "Month Cos",
  doy_sin: "DOY Sin",
  doy_cos: "DOY Cos",
  is_weekend: "Weekend",
};

export function ForecastingPage({
  drugs,
  inventory,
  demandHistory,
}: ForecastingPageProps) {
  const [selectedDrugId, setSelectedDrugId] = useState<number | "">(
    drugs[0]?.id ?? "",
  );
  const selectedDrug = drugs.find((drug) => drug.id === selectedDrugId);
  const selectedInventory = inventory.find(
    (item) => item.drug_id === selectedDrugId,
  );
  const selectedHistory =
    demandHistory.length > 0 ? demandHistory : sampleDemandHistory;
  const [form, setForm] = useState<PredictionInput>(() =>
    buildPredictionInput(selectedHistory),
  );
  const [prediction, setPrediction] = useState<number | null>(null);
  const [forecastDate, setForecastDate] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const coverage = calculateCoverageDays(
    selectedInventory?.current_stock ?? 0,
    prediction,
  );
  const status = getInventoryStatus(
    selectedInventory?.current_stock ?? 0,
    selectedInventory?.safety_stock ?? 0,
  );
  const recommendation = getReorderRecommendation(
    selectedInventory?.current_stock ?? 0,
    selectedInventory?.safety_stock ?? 0,
    prediction ?? 0,
  );
  const chartData = useMemo(
    () =>
      buildForecastSeries(
        selectedHistory,
        prediction
          ? {
              date: forecastDate,
              demand: prediction,
            }
          : undefined,
      ),
    [forecastDate, prediction, selectedHistory],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (selectedDrugId) {
        try {
          const forecast = await forecastDrug(selectedDrugId);
          setPrediction(forecast.predicted_demand);
          setForecastDate(forecast.forecast_date);
          return;
        } catch {
          // Fall back to direct prediction when the drug lacks persisted history.
        }
      }

      const response = await predictDemand(form);
      setPrediction(response.prediction);
      setForecastDate(undefined);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  function applySuggestedInputs() {
    setForm(buildPredictionInput(selectedHistory));
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-line bg-white p-5 shadow-soft"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-ink" htmlFor="drug">
                Drug
              </label>
              <select
                id="drug"
                value={selectedDrugId}
                onChange={(event) => setSelectedDrugId(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
              >
                {drugs.map((drug) => (
                  <option key={drug.id} value={drug.id}>
                    {drug.name} ({drug.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm">
              <div>
                <p className="text-muted">Drug Code</p>
                <p className="font-semibold text-ink">{selectedDrug?.code ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-muted">Current Stock</p>
                <p className="font-semibold text-ink">
                  {formatNumber(selectedInventory?.current_stock)}
                </p>
              </div>
              <div>
                <p className="text-muted">Safety Stock</p>
                <p className="font-semibold text-ink">
                  {formatNumber(selectedInventory?.safety_stock)}
                </p>
              </div>
              <div>
                <p className="text-muted">Lead Time</p>
                <p className="font-semibold text-ink">
                  {selectedInventory?.lead_time_days ?? "N/A"} days
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Prediction Inputs</h2>
              <button
                type="button"
                onClick={applySuggestedInputs}
                className="text-sm font-semibold text-brand hover:text-blue-700"
              >
                Use history
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(fieldLabels) as Array<keyof PredictionInput>).map(
                (field) => (
                  <label key={field} className="text-xs font-semibold text-slate-600">
                    {fieldLabels[field]}
                    <input
                      type="number"
                      step="0.001"
                      value={form[field]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field]: Number(event.target.value),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-line px-2.5 py-2 text-sm text-ink"
                    />
                  </label>
                ),
              )}
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || drugs.length === 0}
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Generating forecast..." : "Generate Forecast"}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-4">
            <KpiCard
              label="Current Stock"
              value={formatNumber(selectedInventory?.current_stock)}
              detail="Units available"
              icon={Package}
            />
            <KpiCard
              label="Safety Stock"
              value={formatNumber(selectedInventory?.safety_stock)}
              detail="Planning threshold"
              icon={ShieldCheck}
              tone="bg-emerald-50 text-emerald-600"
            />
            <KpiCard
              label="Lead Time"
              value={`${selectedInventory?.lead_time_days ?? "N/A"}d`}
              detail="Supplier cycle"
              icon={Truck}
              tone="bg-teal-50 text-teal"
            />
            <KpiCard
              label="Predicted Demand"
              value={
                prediction === null ? "N/A" : `${formatNumber(prediction, 1)}`
              }
              detail="Units per day"
              icon={Calculator}
              tone="bg-amber-50 text-amber-600"
            />
          </section>

          <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">Forecast Result</h2>
                <p className="mt-1 text-sm text-muted">
                  Coverage is calculated as current stock divided by predicted daily demand.
                </p>
              </div>
              <StatusBadge status={status} />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-muted">Predicted Daily Demand</p>
                <p className="mt-2 text-3xl font-semibold text-ink">
                  {prediction === null ? "Run forecast" : `${formatNumber(prediction, 1)} units/day`}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-muted">Inventory Coverage</p>
                <p className="mt-2 text-3xl font-semibold text-ink">
                  {coverage === null ? "N/A" : `${formatNumber(coverage, 1)} days`}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-muted">Reorder Risk</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink">
                  {prediction === null ? "Awaiting model output." : recommendation}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-ink">Demand Forecast</h2>
        <div className="mt-5 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e5edf5" vertical={false} />
              <XAxis dataKey="date" tickFormatter={compactDate} tickLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value, name) => [
                  `${formatNumber(Number(value), 1)} units`,
                  name,
                ]}
              />
              <Legend />
              {prediction ? (
                <ReferenceLine
                  x={chartData.at(-2)?.date}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: "Forecast begins", position: "insideTopRight", fill: "#64748b" }}
                />
              ) : null}
              <Line
                type="monotone"
                dataKey="observed"
                name="Observed Demand"
                stroke="#1667b7"
                strokeWidth={2.5}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted Demand"
                stroke="#0f8c8c"
                strokeDasharray="6 6"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
