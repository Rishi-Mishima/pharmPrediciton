import {
  Activity,
  BarChart3,
  Boxes,
  BrainCircuit,
  LayoutDashboard,
  Pill,
  RefreshCw,
  Siren,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { HealthStatus } from "../types/api";

const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Forecasting", to: "/forecasting", icon: BarChart3 },
  { label: "Inventory", to: "/inventory", icon: Boxes },
  { label: "Drugs", to: "/drugs", icon: Pill },
  { label: "Model Performance", to: "/model", icon: BrainCircuit },
  { label: "Alerts", to: "/alerts", icon: Siren },
];

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Pharmaceutical Supply Chain Command Center",
    subtitle: "Demand, inventory, and model signals in one operational view.",
  },
  "/forecasting": {
    title: "Demand Forecasting",
    subtitle: "Generate pharmaceutical demand forecasts using the current production model.",
  },
  "/inventory": {
    title: "Inventory Management",
    subtitle: "Monitor stock positions, coverage, and replenishment risk.",
  },
  "/drugs": {
    title: "Drug Catalog",
    subtitle: "Maintain pharmaceutical products used by forecasting and inventory workflows.",
  },
  "/model": {
    title: "Model Performance",
    subtitle: "Track the demand model, feature set, and evaluation metrics.",
  },
  "/alerts": {
    title: "Operational Alerts",
    subtitle: "Inventory and demand-planning exceptions derived from current records.",
  },
};

type AppShellProps = {
  health?: HealthStatus;
  onRefresh: () => void;
};

export function AppShell({ health, onRefresh }: AppShellProps) {
  const location = useLocation();
  const page = titles[location.pathname] ?? titles["/"];
  const isHealthy = health?.status === "healthy";

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-line bg-white lg:flex lg:flex-col">
        <div className="border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold text-ink">PharmaML</p>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Demand intelligence
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-brand"
                    : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-4">
          <div className="rounded-lg border border-line bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isHealthy ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm font-semibold text-ink">
                API {isHealthy ? "Online" : "Unavailable"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Model {health?.model_loaded ? "loaded" : "not confirmed"}
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-ink">
                {page.title}
              </h1>
              <p className="mt-1 text-sm text-muted">{page.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm font-medium text-slate-600">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isHealthy ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                {isHealthy ? "Healthy API" : "API offline"}
              </div>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "border-blue-200 bg-blue-50 text-brand"
                      : "border-line bg-white text-slate-600"
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
