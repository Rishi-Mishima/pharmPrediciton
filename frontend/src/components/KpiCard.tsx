import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: string;
};

export function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "bg-emerald-50 text-emerald-700",
}: KpiCardProps) {
  return (
    <section className="rounded-md border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {value}
          </p>
        </div>
        <span className={`rounded-md p-2 ${tone}`}>
          <Icon size={18} />
        </span>
      </div>
      {detail ? <p className="mt-2 text-xs text-muted">{detail}</p> : null}
    </section>
  );
}
