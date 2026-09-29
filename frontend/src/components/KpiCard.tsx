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
  tone = "bg-blue-50 text-brand",
}: KpiCardProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            {value}
          </p>
        </div>
        <span className={`rounded-lg p-2.5 ${tone}`}>
          <Icon size={20} />
        </span>
      </div>
      {detail ? <p className="mt-3 text-sm text-muted">{detail}</p> : null}
    </section>
  );
}
