import type { Project } from '../../domain/project';
import type { TimeEntry } from '../../domain/timeEntry';
import { formatShortDateLabel, parseDate } from '../../utils/dates';
import { formatTimeLabel, getDurationHours, formatHours } from '../../utils/time';
import { Button } from '../common/Button';
import { InvoiceNumberField } from './InvoiceNumberField';

/** One time entry's detail, used by both the By Employee and By Job report pages. */
export function TimeEntryDetailRow({
  entry,
  project,
  showProject,
  employeeName,
  isAdmin,
  onEdit,
  onDelete,
  onSaveInvoice,
}: {
  entry: TimeEntry;
  project: Project | undefined;
  /** Show the project/customer/project-number block — off when the parent group is already scoped to one project. */
  showProject: boolean;
  /** Show the employee name — used when the parent group is scoped to a project rather than an employee. */
  employeeName?: string;
  isAdmin: boolean;
  onEdit(): void;
  onDelete(): void;
  onSaveInvoice(invoiceNumber: string | null): Promise<void>;
}) {
  const duration = getDurationHours(entry.startTime, entry.endTime);

  return (
    <div className="rounded-lg border border-navy-900/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-navy-950">{formatShortDateLabel(parseDate(entry.workDate))}</p>
          <p className="text-sm text-navy-900/70">
            {formatTimeLabel(entry.startTime)} – {formatTimeLabel(entry.endTime)}
          </p>
          {employeeName && <p className="text-sm text-navy-900/70">{employeeName}</p>}
          {showProject && (
            <p className="mt-1 text-sm text-accent-600">
              {project?.name ?? 'Unknown project'}
              {project && (
                <span className="text-navy-900/60"> · {project.customer} · {project.projectNumber}</span>
              )}
            </p>
          )}
        </div>
        <p className="whitespace-nowrap text-sm font-semibold text-navy-950">{formatHours(duration)}</p>
      </div>

      {entry.workDescription && <p className="mt-2 text-sm text-navy-900/80">{entry.workDescription}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-navy-900/50">Invoice #</span>
          <InvoiceNumberField value={entry.invoiceNumber} readOnly={!isAdmin} onSave={onSaveInvoice} />
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={onEdit}>
              Edit
            </Button>
            <Button
              variant="ghost"
              className="!px-3 !py-1.5 text-xs text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
