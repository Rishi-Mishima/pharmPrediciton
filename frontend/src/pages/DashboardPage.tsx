import {
  AlertTriangle,
  Boxes,
  BrainCircuit,
  LineChart as LineChartIcon,
  PackageCheck,
  Pill,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard } from "../components/KpiCard";
import { StatusBadge } from "../components/StatusBadge";
import { buildAlerts } from "../utils/alerts";
import { compactDate, formatMetric, formatNumber } from "../utils/format";
import { buildForecastSeries } from "../utils/forecast";
import type { DashboardData } from "./types";

type DashboardPageProps = {
  data: DashboardData;
};

const riskColors = {
  Healthy: "#10b981",
  "Low Stock": "#f59e0b",
  Critical: "#ef4444",
};

export function DashboardPage({ data }: DashboardPageProps) {
  const totalUnits = data.inventory.reduce(
    (sum, item) => sum + item.current_stock,
    0,
  );
  const lowStock = data.enrichedInventory.filter(
    (item) => item.status === "Low Stock",
  ).length;
  const critical = data.enrichedInventory.filter(
    (item) => item.status === "Critical",
  ).length;
  const averageSafetyStock =
    data.inventory.length > 0
      ? data.inventory.reduce((sum, item) => sum + item.safety_stock, 0) /
        data.inventory.length
      : 0;
  const chartData = buildForecastSeries(data.demandHistory, data.latestForecast);
  const riskData = (["Healthy", "Low Stock", "Critical"] as const).map(
    (status) => ({
      status,
      count: data.enrichedInventory.filter((item) => item.status === status)
        .length,
    }),
  );
  const alerts = buildAlerts(
    data.enrichedInventory,
    data.latestForecast?.demand,
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          label="Total Drugs"
          value={formatNumber(data.drugs.length)}
          detail="Catalog records"
          icon={Pill}
        />
        <KpiCard
          label="Inventory Units"
          value={formatNumber(totalUnits)}
          detail="Current stock"
          icon={Boxes}
          tone="bg-teal-50 text-teal"
        />
        <KpiCard
          label="Low Stock"
          value={formatNumber(lowStock)}
          detail="At or below safety"
          icon={AlertTriangle}
          tone="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="Critical Stock"
          value={formatNumber(critical)}
          detail="Below half safety"
          icon={PackageCheck}
          tone="bg-red-50 text-red-600"
        />
        <KpiCard
          label="Avg Safety Stock"
          value={formatNumber(averageSafetyStock)}
          detail="Units per item"
          icon={LineChartIcon}
          tone="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="Model MAE"
          value={formatMetric(data.modelInfo?.metrics?.mae)}
          detail={data.modelInfo?.model_type ?? "Model pending"}
          icon={BrainCircuit}
          tone="bg-slate-100 text-slate-700"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Demand Forecast Overview
              </h2>
              <p className="mt-1 text-sm text-muted">
                Historical demand with the latest available forecast signal.
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e5edf5" vertical={false} />
                <XAxis dataKey="date" tickFormatter={compactDate} tickLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={(label) => `Date: ${label}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="observed"
                  name="Observed demand"
                  stroke="#1667b7"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="Forecast"
                  stroke="#0f8c8c"
                  strokeWidth={2.5}
                  strokeDasharray="6 6"
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-ink">Inventory Risk Overview</h2>
          <p className="mt-1 text-sm text-muted">Status derived from stock against safety stock.</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <CartesianGrid stroke="#e5edf5" vertical={false} />
                <XAxis dataKey="status" tickLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Items" radius={[6, 6, 0, 0]}>
                  {riskData.map((item) => (
                    <Cell key={item.status} fill={riskColors[item.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Inventory Risk Table</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Drug</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Current Stock</th>
                  <th className="px-5 py-3">Safety Stock</th>
                  <th className="px-5 py-3">Lead Time</th>
                  <th className="px-5 py-3">Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {data.enrichedInventory.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-medium text-ink">{item.drug?.name ?? "Unknown"}</td>
                    <td className="px-5 py-4 text-muted">{item.drug?.code ?? item.drug_id}</td>
                    <td className="px-5 py-4">{formatNumber(item.current_stock)}</td>
                    <td className="px-5 py-4">{formatNumber(item.safety_stock)}</td>
                    <td className="px-5 py-4">{item.lead_time_days} days</td>
                    <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-ink">Alerts</h2>
          <div className="mt-4 space-y-3">
            {alerts.map((alert, index) => (
              <div key={`${alert.level}-${index}`} className={`rounded-lg border p-4 ${alert.tone}`}>
                <p className="text-xs font-bold tracking-wide">{alert.level}</p>
                <p className="mt-1 text-sm font-medium">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
