import type { ReactNode } from 'react';
import { formatHours } from '../../utils/time';

/** Collapsible group card used by both the By Employee and By Job report pages. */
export function HoursGroupCard({
  title,
  subtitle,
  badge,
  entryCount,
  totalHours,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  entryCount: number;
  totalHours: number;
  expanded: boolean;
  onToggle(): void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2 font-semibold text-navy-950">
            {title}
            {badge}
          </span>
          {subtitle && <span className="truncate text-sm text-navy-900/60">{subtitle}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="text-sm text-navy-900/60">
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          </span>
          <span className="text-sm font-semibold text-navy-950">{formatHours(totalHours)}</span>
          <span className={`text-navy-900/60 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true">
            ▾
          </span>
        </div>
      </button>
      {expanded && <div className="flex flex-col gap-3 border-t border-navy-900/10 p-4">{children}</div>}
    </div>
  );
}
