type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </div>
  );
}
