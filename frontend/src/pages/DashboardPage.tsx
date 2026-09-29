import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard } from "../components/KpiCard";
import { ProductDrawer } from "../components/ProductDrawer";
import { StatusBadge } from "../components/StatusBadge";
import type { HealthStatus } from "../types/api";
import { compactDate, formatNumber } from "../utils/format";
import type { EnrichedInventory, InventoryStatus } from "../utils/inventory";
import type { DashboardData } from "./types";

type DashboardPageProps = {
  data: DashboardData;
  health?: HealthStatus;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
};

type Range = 7 | 14 | 30;
type StatusFilter = InventoryStatus | "All";
type DemandPoint = {
  date: string;
  demand?: number;
  average?: number;
  forecast?: number;
};

const PAGE_SIZE = 8;

export function DashboardPage({
  data,
  health,
  isLoading,
  onRefresh,
}: DashboardPageProps) {
  const [range, setRange] = useState<Range>(14);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] =
    useState<EnrichedInventory | null>(null);

  const totalStock = data.inventory.reduce(
    (total, item) => total + item.current_stock,
    0,
  );
  const forecastDemand =
    data.latestForecast?.demand ?? data.demandHistory.at(-1)?.demand ?? 0;
  const atRiskCount = data.inventory.filter(
    (item) => item.status !== "Healthy",
  ).length;

  const chartData = useMemo(() => {
    const visibleHistory = [...data.demandHistory]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-range);

    const points: DemandPoint[] = visibleHistory.map((item, index) => {
      const rollingWindow = visibleHistory.slice(Math.max(0, index - 6), index + 1);
      const rollingAverage =
        rollingWindow.reduce((sum, point) => sum + point.demand, 0) /
        rollingWindow.length;

      return {
        date: item.date,
        demand: item.demand,
        average: Number(rollingAverage.toFixed(1)),
      };
    });

    if (data.latestForecast && points.length > 0) {
      const lastPoint = points.at(-1);
      if (lastPoint) {
        lastPoint.forecast = lastPoint.demand;
      }
      points.push({
        date: data.latestForecast.date,
        forecast: data.latestForecast.demand,
      });
    }

    return points;
  }, [data.demandHistory, data.latestForecast, range]);

  const filteredInventory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.inventory.filter((item) => {
      const searchable = `${item.drug?.name ?? ""} ${item.drug?.code ?? ""}`.toLowerCase();
      const matchesSearch = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data.inventory, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / PAGE_SIZE));
  const pageItems = filteredInventory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const firstResult =
    filteredInventory.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(currentPage * PAGE_SIZE, filteredInventory.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const apiOnline = health?.status === "healthy";

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
              P
            </div>
            <div>
              <h1 className="text-xl font-semibold">PharmaML</h1>
              <p className="text-xs text-muted">Inventory intelligence</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="flex rounded-md border border-line bg-slate-50 p-1" aria-label="Demand range">
              {([7, 14, 30] as Range[]).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRange(days)}
                  className={`min-w-12 rounded px-3 py-1.5 text-sm font-medium transition ${
                    range === days
                      ? "bg-white text-ink shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-2 text-sm text-muted sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${apiOnline ? "bg-emerald-500" : "bg-red-500"}`}
              />
              {apiOnline ? "API online" : "API offline"}
            </div>
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={isLoading}
              title="Refresh dashboard"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-muted transition hover:bg-slate-50 hover:text-ink disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              <span className="sr-only">Refresh dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Supply overview</h2>
          <p className="mt-1 text-sm text-muted">
            Current stock, forecast demand, and products that need attention.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <KpiCard
            label="Total stock"
            value={formatNumber(totalStock)}
            detail={`${formatNumber(data.inventory.length)} inventory records`}
            icon={Package}
          />
          <KpiCard
            label="Next forecast"
            value={formatNumber(forecastDemand, 1)}
            detail={data.latestForecast?.date ?? "Using latest observed demand"}
            icon={TrendingUp}
            tone="bg-cyan-50 text-cyan-700"
          />
          <KpiCard
            label="At risk"
            value={formatNumber(atRiskCount)}
            detail={atRiskCount === 1 ? "Product below target" : "Products below target"}
            icon={AlertTriangle}
            tone="bg-amber-50 text-amber-700"
          />
        </section>

        <section className="mt-6 rounded-md border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">Demand trend</h3>
                <p className="mt-1 text-sm text-muted">
                  Daily demand and seven-day moving average.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                <ChartKey color="bg-emerald-500" label="Demand" />
                <ChartKey color="bg-sky-500" label="7-day average" />
                {data.latestForecast ? (
                  <ChartKey color="bg-amber-500" label="Forecast" />
                ) : null}
              </div>
            </div>
          </div>
          <div className="h-72 px-2 pb-4 pt-5 sm:px-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 14, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#e7ebef" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={compactDate}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                />
                <YAxis tickLine={false} axisLine={false} width={52} />
                <Tooltip
                  labelFormatter={(label) => compactDate(String(label))}
                  contentStyle={{
                    border: "1px solid #dfe4e8",
                    borderRadius: 6,
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="demand"
                  name="Demand"
                  stroke="#159a76"
                  strokeWidth={2.25}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  name="7-day average"
                  stroke="#2684c7"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#d79019"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-md border border-line bg-white">
          <div className="grid gap-3 border-b border-line p-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <span className="sr-only">Search products</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search drug name or code"
                className="h-10 w-full rounded-md border border-line bg-white pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                <option value="All">All statuses</option>
                <option value="Healthy">Healthy</option>
                <option value="Low Stock">Low stock</option>
                <option value="Critical">Critical</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-line bg-slate-50 text-left text-xs font-semibold uppercase text-muted">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="hidden px-5 py-3 sm:table-cell">Code</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="hidden px-5 py-3 md:table-cell">Safety stock</th>
                  <th className="hidden px-5 py-3 lg:table-cell">Coverage</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedProduct(item)}
                    className={`cursor-pointer transition hover:bg-slate-50 ${
                      item.status === "Critical" ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="px-5 py-4 font-medium text-ink">
                      {item.drug?.name ?? "Unknown drug"}
                    </td>
                    <td className="hidden px-5 py-4 text-muted sm:table-cell">
                      {item.drug?.code ?? item.drug_id}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {formatNumber(item.current_stock)}
                    </td>
                    <td className="hidden px-5 py-4 tabular-nums md:table-cell">
                      {formatNumber(item.safety_stock)}
                    </td>
                    <td className="hidden px-5 py-4 text-muted lg:table-cell">
                      {item.coverageDays === null
                        ? "No forecast"
                        : `${formatNumber(item.coverageDays, 1)} days`}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageItems.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="font-medium text-ink">No inventory records found</p>
              <p className="mt-1 text-sm text-muted">
                {apiOnline
                  ? "Try a different search or add inventory through the API."
                  : "Start the API to load live inventory data."}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Showing {firstResult}-{lastResult} of {filteredInventory.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                title="Previous page"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted hover:bg-slate-50 hover:text-ink disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                <span className="sr-only">Previous page</span>
              </button>
              <span className="min-w-14 text-center text-sm text-muted">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                title="Next page"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted hover:bg-slate-50 hover:text-ink disabled:opacity-40"
              >
                <ChevronRight size={16} />
                <span className="sr-only">Next page</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <ProductDrawer
        product={selectedProduct}
        forecastDemand={
          selectedProduct?.drug_id === data.drugs[0]?.id
            ? data.latestForecast?.demand
            : undefined
        }
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

function ChartKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
