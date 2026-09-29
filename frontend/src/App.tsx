import { useCallback, useEffect, useMemo, useState } from "react";
import { getDemandHistory, getDrugs } from "./api/drugs";
import { forecastDrug } from "./api/forecast";
import { getHealth } from "./api/health";
import { getInventory } from "./api/inventory";
import { sampleDemandHistory } from "./data/sampleDemand";
import { DashboardPage } from "./pages/DashboardPage";
import type { DemandHistory, Drug, HealthStatus, Inventory } from "./types/api";
import { enrichInventory } from "./utils/inventory";

export function App() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [history, setHistory] = useState<DemandHistory[]>(sampleDemandHistory);
  const [health, setHealth] = useState<HealthStatus>();
  const [latestForecast, setLatestForecast] = useState<{
    date: string;
    demand: number;
  }>();
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const [healthResult, drugsResult, inventoryResult] =
        await Promise.allSettled([getHealth(), getDrugs(), getInventory()]);

      setHealth(
        healthResult.status === "fulfilled" ? healthResult.value : undefined,
      );

      const loadedDrugs =
        drugsResult.status === "fulfilled" ? drugsResult.value : [];
      setDrugs(loadedDrugs);
      setInventory(
        inventoryResult.status === "fulfilled" ? inventoryResult.value : [],
      );

      const primaryDrug = loadedDrugs[0];
      if (!primaryDrug) {
        setHistory(sampleDemandHistory);
        setLatestForecast(undefined);
        return;
      }

      const [historyResult, forecastResult] = await Promise.allSettled([
        getDemandHistory(primaryDrug.id),
        forecastDrug(primaryDrug.id),
      ]);

      setHistory(
        historyResult.status === "fulfilled" && historyResult.value.length > 0
          ? historyResult.value
          : sampleDemandHistory,
      );

      setLatestForecast(
        forecastResult.status === "fulfilled"
          ? {
              date: forecastResult.value.forecast_date,
              demand: forecastResult.value.predicted_demand,
            }
          : undefined,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const demandByDrugId = useMemo(() => {
    const primaryDrugId = drugs[0]?.id;
    if (!primaryDrugId || latestForecast?.demand === undefined) {
      return {};
    }

    return { [primaryDrugId]: latestForecast.demand };
  }, [drugs, latestForecast]);

  const enrichedInventory = useMemo(
    () => enrichInventory(inventory, drugs, demandByDrugId),
    [demandByDrugId, drugs, inventory],
  );

  return (
    <DashboardPage
      data={{
        drugs,
        inventory: enrichedInventory,
        enrichedInventory,
        demandHistory: history,
        latestForecast,
      }}
      health={health}
      isLoading={isLoading}
      onRefresh={refresh}
    />
  );
}
