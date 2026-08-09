import type { ReactNode } from 'react';

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-navy-900/20 bg-white/60 py-12 text-center text-navy-900/70">
      <p>{message}</p>
      {action}
    </div>
  );
}
