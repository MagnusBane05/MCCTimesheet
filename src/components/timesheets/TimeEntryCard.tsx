import type { TimeEntry } from '../../domain/timeEntry';
import type { Project } from '../../domain/project';
import { formatTimeLabel, getDurationHours, formatHours } from '../../utils/time';
import { Button } from '../common/Button';

export function TimeEntryCard({
  entry,
  project,
  editable,
  onEdit,
  onDelete,
}: {
  entry: TimeEntry;
  project: Project | undefined;
  editable: boolean;
  onEdit(): void;
  onDelete(): void;
}) {
  const duration = getDurationHours(entry.startTime, entry.endTime);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-navy-950">
            {formatTimeLabel(entry.startTime)} – {formatTimeLabel(entry.endTime)}
          </p>
          <p className="text-sm font-medium text-accent-600">{project?.name ?? 'Unknown project'}</p>
          {project && (
            <p className="text-xs text-navy-900/60">
              {project.customer} · {project.projectNumber}
            </p>
          )}
        </div>
        <p className="whitespace-nowrap text-sm font-semibold text-navy-950">{formatHours(duration)}</p>
      </div>

      {entry.workDescription && <p className="mt-2 text-sm text-navy-900/80">{entry.workDescription}</p>}

      <div className="mt-3 flex items-center justify-between">
        {editable ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="ghost" className="text-red-700 hover:bg-red-50" onClick={onDelete}>
              Delete
            </Button>
          </div>
        ) : (
          <span className="rounded-full bg-navy-900/5 px-3 py-1 text-xs font-medium text-navy-900/60">
            Editing period closed
          </span>
        )}
      </div>
    </div>
  );
}
