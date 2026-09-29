import { Plus } from "lucide-react";
import { useState } from "react";
import { createDrug } from "../api/drugs";
import { getApiErrorMessage } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import type { Drug } from "../types/api";
import { formatNumber } from "../utils/format";
import type { EnrichedInventory } from "../utils/inventory";

type DrugsPageProps = {
  drugs: Drug[];
  inventory: EnrichedInventory[];
  onRefresh: () => Promise<void>;
};

export function DrugsPage({ drugs, inventory, onRefresh }: DrugsPageProps) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Create Drug
        </button>
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        {drugs.length === 0 ? (
          <EmptyState
            title="No drugs available"
            message="Create a drug before adding inventory or running forecasts."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Drug Name</th>
                  <th className="px-5 py-3">Inventory</th>
                  <th className="px-5 py-3">Safety Stock</th>
                  <th className="px-5 py-3">Lead Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {drugs.map((drug) => {
                  const inv = inventory.find((item) => item.drug_id === drug.id);
                  return (
                    <tr key={drug.id}>
                      <td className="px-5 py-4 font-semibold text-ink">{drug.code}</td>
                      <td className="px-5 py-4">{drug.name}</td>
                      <td className="px-5 py-4">{formatNumber(inv?.current_stock)}</td>
                      <td className="px-5 py-4">{formatNumber(inv?.safety_stock)}</td>
                      <td className="px-5 py-4">{inv ? `${inv.lead_time_days} days` : "N/A"}</td>
                      <td className="px-5 py-4">
                        {inv ? <StatusBadge status={inv.status} /> : "No inventory"}
                      </td>
                      <td className="px-5 py-4 text-muted">Edit endpoint not exposed</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCreate ? (
        <CreateDrugModal
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

function CreateDrugModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await createDrug({ code, name });
      await onCreated();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create Drug" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold text-ink">
          Code
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="mt-2 w-full rounded-lg border border-line px-3 py-2"
            placeholder="N02BE"
            required
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Drug Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-line px-3 py-2"
            placeholder="Paracetamol"
            required
          />
        </label>
        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
        >
          {isSaving ? "Saving..." : "Create"}
        </button>
      </form>
    </Modal>
  );
}
