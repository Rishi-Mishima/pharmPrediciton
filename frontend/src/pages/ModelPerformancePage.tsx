import { Activity, BarChart3, BrainCircuit, Gauge, Sigma } from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import type { ModelInfo } from "../types/api";
import { formatMetric } from "../utils/format";

type ModelPerformancePageProps = {
  modelInfo?: ModelInfo;
};

function metricValue(metrics: Record<string, number | string> | undefined, names: string[]) {
  if (!metrics) {
    return undefined;
  }

  const key = Object.keys(metrics).find((item) =>
    names.some((name) => item.toLowerCase() === name.toLowerCase()),
  );

  return key ? metrics[key] : undefined;
}

export function ModelPerformancePage({ modelInfo }: ModelPerformancePageProps) {
  const metrics = modelInfo?.metrics;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard
          label="Model"
          value={modelInfo?.model_type ?? "N/A"}
          detail="Production estimator"
          icon={BrainCircuit}
        />
        <KpiCard
          label="MAE"
          value={formatMetric(metricValue(metrics, ["mae", "test_mae"]))}
          detail="Mean absolute error"
          icon={Activity}
          tone="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="RMSE"
          value={formatMetric(metricValue(metrics, ["rmse", "test_rmse"]))}
          detail="Root mean squared error"
          icon={Gauge}
          tone="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="WAPE / CV MAE"
          value={`${formatMetric(metricValue(metrics, ["wape", "test_wape"]))} / ${formatMetric(
            metricValue(metrics, ["cv_mae", "cross_validation_mae"]),
          )}`}
          detail="Forecast accuracy indicators"
          icon={Sigma}
          tone="bg-teal-50 text-teal"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-blue-50 p-2 text-brand">
              <BarChart3 size={20} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Features Used</h2>
              <p className="mt-1 text-sm text-muted">
                The model predicts pharmaceutical demand using lagged demand,
                rolling statistics, and calendar features.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {(modelInfo?.features ?? []).map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-brand"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-ink">Raw Metrics</h2>
          <dl className="mt-4 space-y-3">
            {Object.entries(metrics ?? {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0">
                <dt className="text-sm font-medium text-muted">{key}</dt>
                <dd className="text-sm font-semibold text-ink">{formatMetric(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
