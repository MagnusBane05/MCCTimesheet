import { useMemo, useState, type FormEvent } from 'react';
import type { Project } from '../../domain/project';
import type { TimeEntry } from '../../domain/timeEntry';
import { formatDate } from '../../utils/dates';
import { generateTimeOptions, formatTimeLabel, getDurationHours, formatHours } from '../../utils/time';
import { validateTimeEntry, type TimeEntryInput } from '../../utils/validation';
import { Button } from '../common/Button';

const TIME_OPTIONS = generateTimeOptions();

export interface TimeEntryFormValues {
  workDate: string;
  startTime: string;
  endTime: string;
  projectId: number;
  workDescription: string;
}

export function TimeEntryForm({
  today,
  defaultDate,
  projects,
  existingEntry,
  otherEntries,
  enforceEditWindow = true,
  onCancel,
  onSubmit,
}: {
  today: Date;
  defaultDate: string;
  projects: Project[];
  existingEntry?: TimeEntry;
  /** This employee's other entries — used to compute overlap and the daily total preview. */
  otherEntries: TimeEntry[];
  enforceEditWindow?: boolean;
  onCancel(): void;
  onSubmit(values: TimeEntryFormValues): Promise<void>;
}) {
  const [workDate, setWorkDate] = useState(existingEntry?.workDate ?? defaultDate);
  const [startTime, setStartTime] = useState(existingEntry?.startTime ?? '08:00');
  const [endTime, setEndTime] = useState(existingEntry?.endTime ?? '09:00');
  const [projectId, setProjectId] = useState<number | null>(existingEntry?.projectId ?? null);
  const [workDescription, setWorkDescription] = useState(existingEntry?.workDescription ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const projectOptions = useMemo(() => {
    const active = projects.filter((project) => project.active);
    const options = existingEntry && !active.some((project) => project.id === existingEntry.projectId)
      ? [...active, ...projects.filter((project) => project.id === existingEntry.projectId)]
      : active;
    return [...options].sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, existingEntry]);

  const input: TimeEntryInput = { workDate, startTime, endTime, projectId, workDescription };
  const errors = validateTimeEntry(input, {
    today,
    otherEntries,
    excludeEntryId: existingEntry?.id,
    enforceEditWindow,
  });

  const thisDuration = Math.max(getDurationHours(startTime, endTime), 0);
  const otherDailyTotal = otherEntries
    .filter((entry) => entry.workDate === workDate && entry.id !== existingEntry?.id)
    .reduce((total, entry) => total + getDurationHours(entry.startTime, entry.endTime), 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (Object.keys(errors).length > 0 || projectId === null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({ workDate, startTime, endTime, projectId, workDescription });
    } catch {
      setSubmitError('Unable to save this entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm" noValidate>
      <div>
        <label htmlFor="entry-date" className="block text-sm font-medium text-navy-900">
          Date
        </label>
        <input
          id="entry-date"
          type="date"
          value={workDate}
          max={formatDate(today)}
          onChange={(event) => setWorkDate(event.target.value)}
          className="mt-1 w-full rounded-lg border border-navy-900/20 px-3 py-2.5 text-base focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
        {errors.workDate && <p className="mt-1 text-sm text-red-700">{errors.workDate}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="entry-start" className="block text-sm font-medium text-navy-900">
            Start time
          </label>
          <select
            id="entry-start"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="mt-1 w-full rounded-lg border border-navy-900/20 px-3 py-2.5 text-base focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {formatTimeLabel(time)}
              </option>
            ))}
          </select>
          {errors.startTime && <p className="mt-1 text-sm text-red-700">{errors.startTime}</p>}
        </div>
        <div>
          <label htmlFor="entry-end" className="block text-sm font-medium text-navy-900">
            End time
          </label>
          <select
            id="entry-end"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="mt-1 w-full rounded-lg border border-navy-900/20 px-3 py-2.5 text-base focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {formatTimeLabel(time)}
              </option>
            ))}
          </select>
          {errors.endTime && <p className="mt-1 text-sm text-red-700">{errors.endTime}</p>}
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
        {errors.projectId && <p className="mt-1 text-sm text-red-700">{errors.projectId}</p>}
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
        {errors.workDescription && <p className="mt-1 text-sm text-red-700">{errors.workDescription}</p>}
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
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save entry'}
        </Button>
      </div>
    </form>
  );
}
