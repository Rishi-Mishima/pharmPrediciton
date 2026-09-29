import { statusTone, type InventoryStatus } from "../utils/inventory";

type StatusBadgeProps = {
  status: InventoryStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(
        status,
      )}`}
    >
      {status}
    </span>
  );
}
