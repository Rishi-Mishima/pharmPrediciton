import { CalendarClock, Package, ShieldCheck, TrendingUp, X } from "lucide-react";
import { useEffect } from "react";
import { formatNumber } from "../utils/format";
import {
  getReorderRecommendation,
  type EnrichedInventory,
} from "../utils/inventory";
import { StatusBadge } from "./StatusBadge";

type ProductDrawerProps = {
  product: EnrichedInventory | null;
  forecastDemand?: number;
  onClose: () => void;
};

export function ProductDrawer({
  product,
  forecastDemand,
  onClose,
}: ProductDrawerProps) {
  useEffect(() => {
    if (!product) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, product]);

  if (!product) {
    return null;
  }

  const recommendation = forecastDemand
    ? getReorderRecommendation(
        product.current_stock,
        product.safety_stock,
        forecastDemand,
      )
    : product.status === "Healthy"
      ? "Stock is above the current safety threshold."
      : "Review this product's replenishment plan and forecast coverage."

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Product details">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/25"
        onClick={onClose}
        aria-label="Close product details"
      />
      <aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l border-line bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase text-muted">
              {product.drug?.code ?? `Drug ${product.drug_id}`}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">
              {product.drug?.name ?? "Unknown drug"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close details"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-slate-100 hover:text-ink"
          >
            <X size={19} />
            <span className="sr-only">Close details</span>
          </button>
        </div>

        <div className="space-y-7 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Inventory status</span>
            <StatusBadge status={product.status} />
          </div>

          <dl className="grid grid-cols-2 gap-x-5 gap-y-6">
            <Metric
              icon={Package}
              label="Current stock"
              value={formatNumber(product.current_stock)}
            />
            <Metric
              icon={ShieldCheck}
              label="Safety stock"
              value={formatNumber(product.safety_stock)}
            />
            <Metric
              icon={TrendingUp}
              label="Forecast demand"
              value={formatNumber(forecastDemand, 1)}
            />
            <Metric
              icon={CalendarClock}
              label="Lead time"
              value={`${product.lead_time_days} days`}
            />
          </dl>

          <div className="border-t border-line pt-6">
            <h3 className="text-sm font-semibold text-ink">Coverage</h3>
            <p className="mt-2 text-3xl font-semibold text-ink">
              {product.coverageDays === null
                ? "N/A"
                : `${formatNumber(product.coverageDays, 1)} days`}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Estimated from current stock and the latest daily demand forecast.
            </p>
          </div>

          <div className="rounded-md border border-line bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-ink">Recommendation</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{recommendation}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

type MetricProps = {
  icon: typeof Package;
  label: string;
  value: string;
};

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs font-medium text-muted">
        <Icon size={15} />
        {label}
      </dt>
      <dd className="mt-2 text-lg font-semibold text-ink">{value}</dd>
    </div>
  );
}
