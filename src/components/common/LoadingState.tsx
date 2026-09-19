export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-lakehouse-900/70">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-lakehouse-900/20 border-t-cedar-500"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
