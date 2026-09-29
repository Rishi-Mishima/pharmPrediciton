import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { buildAlerts } from "../utils/alerts";
import type { EnrichedInventory } from "../utils/inventory";

type AlertsPageProps = {
  inventory: EnrichedInventory[];
  forecastDemand?: number;
};

export function AlertsPage({ inventory, forecastDemand }: AlertsPageProps) {
  const alerts = buildAlerts(inventory, forecastDemand);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {alerts.map((alert, index) => (
        <section
          key={`${alert.level}-${index}`}
          className={`rounded-lg border p-5 shadow-soft ${alert.tone}`}
        >
          <div className="flex items-start gap-3">
            {alert.level === "MODEL" ? (
              <CheckCircle2 size={22} />
            ) : (
              <AlertTriangle size={22} />
            )}
            <div>
              <p className="text-xs font-bold tracking-wide">{alert.level}</p>
              <p className="mt-2 text-base font-semibold">{alert.message}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
