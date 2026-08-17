import { useMemo, useState, type FormEvent } from 'react';
import type { Project } from '../../domain/project';
import type { TimeEntry } from '../../domain/timeEntry';
import { formatDate, formatShortDateLabel, parseDate } from '../../utils/dates';
import { MINUTE_INCREMENT, getDurationHours, formatHours } from '../../utils/time';
import { validateTimeEntry, type TimeEntryInput } from '../../utils/validation';
import { Button } from '../common/Button';
import { TimeSelect } from './TimeSelect';

export interface TimeEntryFormValues {
  workDate: string;
  startTime: string;
  endTime: string;
  projectId: number;
  workDescription: string;
}

export function TimeEntryForm({
  today,
  workDate,
  projects,
  existingEntry,
  otherEntries,
  enforceEditWindow = true,
  dateEditable = false,
  hideHeading = false,
  onCancel,
  onSubmit,
}: {
  today: Date;
  workDate: string;
  projects: Project[];
  existingEntry?: TimeEntry;
  /** This employee's other entries — used to compute overlap and the daily total preview. */
  otherEntries: TimeEntry[];
  enforceEditWindow?: boolean;
  /** Admin contexts (report pages) allow correcting the date itself; the employee day-nav flow never sets this. */
  dateEditable?: boolean;
  /** Suppress the form's own heading when a wrapping Modal already shows a title. */
  hideHeading?: boolean;
  onCancel(): void;
  onSubmit(values: TimeEntryFormValues): Promise<void>;
}) {
  const [startTime, setStartTime] = useState(existingEntry?.startTime ?? '');
  const [endTime, setEndTime] = useState(existingEntry?.endTime ?? '');
  const [projectId, setProjectId] = useState<number | null>(existingEntry?.projectId ?? null);
  const [workDescription, setWorkDescription] = useState(existingEntry?.workDescription ?? '');
  const [internalWorkDate, setInternalWorkDate] = useState(existingEntry?.workDate ?? workDate);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // When dateEditable is false (the employee day-nav flow), always read the prop directly so
  // changing the selected day is reflected immediately with no stale internal state.
  const effectiveWorkDate = dateEditable ? internalWorkDate : workDate;

  const projectOptions = useMemo(() => {
    const active = projects.filter((project) => project.active);
    const options = existingEntry && !active.some((project) => project.id === existingEntry.projectId)
      ? [...active, ...projects.filter((project) => project.id === existingEntry.projectId)]
      : active;
    return [...options].sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, existingEntry]);

  const input: TimeEntryInput = { workDate: effectiveWorkDate, startTime, endTime, projectId, workDescription };
  const errors = validateTimeEntry(input, {
    today,
    otherEntries,
    excludeEntryId: existingEntry?.id,
    enforceEditWindow,
  });
  const visibleErrors = hasAttemptedSubmit ? errors : {};

  const thisDuration = startTime && endTime ? Math.max(getDurationHours(startTime, endTime), 0) : 0;
  const otherDailyTotal = otherEntries
    .filter((entry) => entry.workDate === effectiveWorkDate && entry.id !== existingEntry?.id)
    .reduce((total, entry) => total + getDurationHours(entry.startTime, entry.endTime), 0);

  function handleCancel() {
    setStartTime(existingEntry?.startTime ?? '');
    setEndTime(existingEntry?.endTime ?? '');
    setProjectId(existingEntry?.projectId ?? null);
    setWorkDescription(existingEntry?.workDescription ?? '');
    setInternalWorkDate(existingEntry?.workDate ?? workDate);
    setHasAttemptedSubmit(false);
    setSubmitError(null);
    onCancel();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setHasAttemptedSubmit(true);
    if (Object.keys(errors).length > 0 || projectId === null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({ workDate: effectiveWorkDate, startTime, endTime, projectId, workDescription });
    } catch {
      setSubmitError('Unable to save this entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm" noValidate>
      {!hideHeading && (
        <h2 className="text-base font-semibold text-navy-950">
          {existingEntry ? 'Edit' : 'New'} time entry
          {!dateEditable && ` for ${formatShortDateLabel(parseDate(effectiveWorkDate))}`}
        </h2>
      )}

      {dateEditable && (
        <div>
          <label htmlFor="entry-date" className="block text-sm font-medium text-navy-900">
            Date
          </label>
          <input
            id="entry-date"
            type="date"
            value={effectiveWorkDate}
            max={formatDate(today)}
            onChange={(event) => setInternalWorkDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-navy-900/20 px-3 py-2.5 text-base focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
        </div>
      )}

      {visibleErrors.workDate && (
        <p role="alert" className="text-sm text-red-700">
          {visibleErrors.workDate}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="entry-start" className="block text-sm font-medium text-navy-900">
            Start time
          </label>
          <TimeSelect
            id="entry-start"
            label="Start time"
            value={startTime}
            today={today}
            onChange={setStartTime}
            minuteStep={MINUTE_INCREMENT}
            className="mt-1 w-full rounded-lg border border-navy-900/20 px-3 py-2.5 text-base focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          {visibleErrors.startTime && <p className="mt-1 text-sm text-red-700">{visibleErrors.startTime}</p>}
        </div>
        <div>
          <label htmlFor="entry-end" className="block text-sm font-medium text-navy-900">
            End time
          </label>
          <TimeSelect
            id="entry-end"
            label="End time"
            value={endTime}
            today={today}
            onChange={setEndTime}
            minuteStep={MINUTE_INCREMENT}
            className="mt-1 w-full rounded-lg border border-navy-900/20 px-3 py-2.5 text-base focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          {visibleErrors.endTime && <p className="mt-1 text-sm text-red-700">{visibleErrors.endTime}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="entry-project" className="block text-sm font-medium text-navy-900">
          Project
        </label>
        <select
          id="entry-project"
          value={projectId ?? ''}
          onChange={(event) => setProjectId(event.target.value ? Number(event.target.value) : null)}
          className="mt-1 w-full rounded-lg border border-navy-900/20 px-3 py-2.5 text-base focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        >
          <option value="">Select a project…</option>
          {projectOptions.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} — {project.customer} ({project.projectNumber})
            </option>
          ))}
        </select>
        {visibleErrors.projectId && <p className="mt-1 text-sm text-red-700">{visibleErrors.projectId}</p>}
      </div>

      <div>
        <label htmlFor="entry-description" className="block text-sm font-medium text-navy-900">
          Work description
        </label>
        <textarea
          id="entry-description"
          value={workDescription}
          onChange={(event) => setWorkDescription(event.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-navy-900/20 px-3 py-2.5 text-base focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
        {visibleErrors.workDescription && <p className="mt-1 text-sm text-red-700">{visibleErrors.workDescription}</p>}
      </div>

      <div className="flex justify-between rounded-lg bg-cream-50 px-3 py-2 text-sm text-navy-900/80">
        <span>Duration of this entry</span>
        <span className="font-semibold">{formatHours(thisDuration)}</span>
      </div>
      <div className="flex justify-between rounded-lg bg-cream-50 px-3 py-2 text-sm text-navy-900/80">
        <span>Daily total after this entry</span>
        <span className="font-semibold">{formatHours(otherDailyTotal + thisDuration)}</span>
      </div>

      {submitError && (
        <p role="alert" className="text-sm text-red-700">
          {submitError}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {existingEntry ? (submitting ? 'Saving…' : 'Save changes') : (submitting ? 'Adding…' : 'Add entry')}
        </Button>
      </div>
    </form>
  );
}
