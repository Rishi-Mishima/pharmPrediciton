import { ArrowUpDown, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { createInventory } from "../api/inventory";
import { getApiErrorMessage } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import type { Drug } from "../types/api";
import { formatNumber } from "../utils/format";
import type { EnrichedInventory, InventoryStatus } from "../utils/inventory";

type InventoryPageProps = {
  drugs: Drug[];
  inventory: EnrichedInventory[];
  onRefresh: () => Promise<void>;
};

type SortKey = "drug" | "stock" | "safety" | "coverage" | "status";

export function InventoryPage({ drugs, inventory, onRefresh }: InventoryPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    return inventory
      .filter((item) => {
        const text = `${item.drug?.name ?? ""} ${item.drug?.code ?? ""}`.toLowerCase();
        const matchesQuery = text.includes(query.toLowerCase());
        const matchesStatus =
          statusFilter === "All" ? true : item.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortKey === "drug") {
          return (a.drug?.name ?? "").localeCompare(b.drug?.name ?? "");
        }
        if (sortKey === "stock") {
          return b.current_stock - a.current_stock;
        }
        if (sortKey === "safety") {
          return b.safety_stock - a.safety_stock;
        }
        if (sortKey === "coverage") {
          return (a.coverageDays ?? 9999) - (b.coverageDays ?? 9999);
        }
        return a.status.localeCompare(b.status);
      });
  }, [inventory, query, sortKey, statusFilter]);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-muted" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search drug or code"
                className="w-full rounded-lg border border-line py-2 pl-10 pr-3 text-sm"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as InventoryStatus | "All")
              }
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            >
              <option>All</option>
              <option>Healthy</option>
              <option>Low Stock</option>
              <option>Critical</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Create Inventory
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        {filtered.length === 0 ? (
          <EmptyState
            title="No inventory records"
            message="Create inventory for drugs that need stock monitoring."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  {[
                    ["drug", "Drug"],
                    ["stock", "Current Stock"],
                    ["safety", "Safety Stock"],
                    ["coverage", "Inventory Coverage"],
                    ["status", "Status"],
                  ].map(([key, label]) => (
                    <th key={key} className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setSortKey(key as SortKey)}
                        className="inline-flex items-center gap-1"
                      >
                        {label}
                        <ArrowUpDown size={13} />
                      </button>
                    </th>
                  ))}
                  <th className="px-5 py-3">Lead Time</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{item.drug?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted">{item.drug?.code ?? item.drug_id}</p>
                    </td>
                    <td className="px-5 py-4">{formatNumber(item.current_stock)}</td>
                    <td className="px-5 py-4">{formatNumber(item.safety_stock)}</td>
                    <td className="px-5 py-4">
                      {item.coverageDays === null
                        ? "Needs forecast"
                        : `${formatNumber(item.coverageDays, 1)} days`}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-4">{item.lead_time_days} days</td>
                    <td className="px-5 py-4 text-muted">
                      Edit/delete not exposed by API
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCreate ? (
        <CreateInventoryModal
          drugs={drugs}
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await onRefresh();
          }}
        />
      ) : null}
    </div>
  );
}

function CreateInventoryModal({
  drugs,
  onClose,
  onCreated,
}: {
  drugs: Drug[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [drugId, setDrugId] = useState(drugs[0]?.id ?? 0);
  const [currentStock, setCurrentStock] = useState(500);
  const [safetyStock, setSafetyStock] = useState(200);
  const [leadTime, setLeadTime] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await createInventory({
        drug_id: drugId,
        current_stock: currentStock,
        safety_stock: safetyStock,
        lead_time_days: leadTime,
      });
      await onCreated();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create Inventory" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold text-ink">
          Drug
          <select
            value={drugId}
            onChange={(event) => setDrugId(Number(event.target.value))}
            className="mt-2 w-full rounded-lg border border-line px-3 py-2"
          >
            {drugs.map((drug) => (
              <option key={drug.id} value={drug.id}>
                {drug.name} ({drug.code})
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField label="Current Stock" value={currentStock} onChange={setCurrentStock} />
          <NumberField label="Safety Stock" value={safetyStock} onChange={setSafetyStock} />
          <NumberField label="Lead Time Days" value={leadTime} onChange={setLeadTime} />
        </div>
        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={isSaving || drugs.length === 0}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          {isSaving ? "Saving..." : "Create"}
        </button>
      </form>
    </Modal>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full rounded-lg border border-line px-3 py-2"
      />
    </label>
  );
}
