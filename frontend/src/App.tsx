import { useCallback, useEffect, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { getDemandHistory, getDrugs } from "./api/drugs";
import { forecastDrug } from "./api/forecast";
import { getHealth } from "./api/health";
import { getInventory } from "./api/inventory";
import { getModelInfo } from "./api/model";
import { AppShell } from "./components/AppShell";
import { sampleDemandHistory } from "./data/sampleDemand";
import { AlertsPage } from "./pages/AlertsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DrugsPage } from "./pages/DrugsPage";
import { ForecastingPage } from "./pages/ForecastingPage";
import { InventoryPage } from "./pages/InventoryPage";
import { ModelPerformancePage } from "./pages/ModelPerformancePage";
import type { DemandHistory, Drug, HealthStatus, Inventory, ModelInfo } from "./types/api";
import { enrichInventory } from "./utils/inventory";

export function App() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [history, setHistory] = useState<DemandHistory[]>(sampleDemandHistory);
  const [modelInfo, setModelInfo] = useState<ModelInfo>();
  const [health, setHealth] = useState<HealthStatus>();
  const [latestForecast, setLatestForecast] = useState<{ date: string; demand: number }>();

  const refresh = useCallback(async () => {
    const [healthResult, modelResult, drugsResult, inventoryResult] =
      await Promise.allSettled([
        getHealth(),
        getModelInfo(),
        getDrugs(),
        getInventory(),
      ]);

    if (healthResult.status === "fulfilled") setHealth(healthResult.value);
    if (modelResult.status === "fulfilled") setModelInfo(modelResult.value);
    if (drugsResult.status === "fulfilled") setDrugs(drugsResult.value);
    if (inventoryResult.status === "fulfilled") setInventory(inventoryResult.value);

    const loadedDrugs =
      drugsResult.status === "fulfilled" ? drugsResult.value : drugs;
    const primaryDrug = loadedDrugs[0];

    if (primaryDrug) {
      const [historyResult, forecastResult] = await Promise.allSettled([
        getDemandHistory(primaryDrug.id),
        forecastDrug(primaryDrug.id),
      ]);

      if (historyResult.status === "fulfilled" && historyResult.value.length > 0) {
        setHistory(historyResult.value);
      }

      if (forecastResult.status === "fulfilled") {
        setLatestForecast({
          date: forecastResult.value.forecast_date,
          demand: forecastResult.value.predicted_demand,
        });
      }
    }
  }, [drugs]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const demandByDrugId = useMemo(() => {
    const latest = latestForecast?.demand;
    const drugId = drugs[0]?.id;
    return drugId && latest ? { [drugId]: latest } : {};
  }, [drugs, latestForecast]);

  const enrichedInventory = useMemo(
    () => enrichInventory(inventory, drugs, demandByDrugId),
    [demandByDrugId, drugs, inventory],
  );

  const dashboardData = {
    drugs,
    inventory: enrichedInventory,
    enrichedInventory,
    demandHistory: history,
    latestForecast,
    modelInfo,
  };

  return (
    <Routes>
      <Route element={<AppShell health={health} onRefresh={refresh} />}>
        <Route index element={<DashboardPage data={dashboardData} />} />
        <Route
          path="forecasting"
          element={
            <ForecastingPage
              drugs={drugs}
              inventory={enrichedInventory}
              demandHistory={history}
            />
          }
        />
        <Route
          path="inventory"
          element={
            <InventoryPage
              drugs={drugs}
              inventory={enrichedInventory}
              onRefresh={refresh}
            />
          }
        />
        <Route
          path="drugs"
          element={
            <DrugsPage
              drugs={drugs}
              inventory={enrichedInventory}
              onRefresh={refresh}
            />
          }
        />
        <Route path="model" element={<ModelPerformancePage modelInfo={modelInfo} />} />
        <Route
          path="alerts"
          element={
            <AlertsPage
              inventory={enrichedInventory}
              forecastDemand={latestForecast?.demand}
            />
          }
        />
      </Route>
    </Routes>
  );
}
