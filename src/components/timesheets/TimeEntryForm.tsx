import { ChangeEvent, useMemo, useState, type FormEvent } from 'react';
import type { Project } from '../../domain/project';
import type { TimeEntry } from '../../domain/timeEntry';
import { formatDate, formatShortDateLabel, parseDate } from '../../utils/dates';
import { MINUTE_INCREMENT, getDurationHours, formatHours } from '../../utils/time';
import { validateTimeEntry, type TimeEntryInput } from '../../utils/validation';
import { Button } from '../common/Button';
import { getProjectDisplayName } from '../../utils/projects';
import { TimeField } from '../form/TimeField';
import { SelectField } from '../form/SelectField';
import { TextAreaField } from '../form/TextAreaField';

function getCustomerFromProject(projectId: number | null, projects: Project[]): string {
  if (projectId == null) return '';
  const project = projects.find(p => p.id === projectId);
  return project?.customer ?? '';
}

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
  const [customer, setCustomer] = useState(getCustomerFromProject(existingEntry?.projectId ?? null, projects));

  // When dateEditable is false (the employee day-nav flow), always read the prop directly so
  // changing the selected day is reflected immediately with no stale internal state.
  const effectiveWorkDate = dateEditable ? internalWorkDate : workDate;

  const activeProjects = useMemo(() => {
    return projects.filter((project) => project.active);
  }, [projects]);

  const customerOptions = useMemo(() => {
    const customers = activeProjects.map((project) => project.customer);
    return Array.from(new Set(customers)).sort((a, b) => a.localeCompare(b));
  }, [activeProjects]);

  const projectOptions = useMemo(() => {
    const customerProjects = activeProjects.filter((project) => project.customer === customer);
    const options = existingEntry && !customerProjects.some((project) => project.id === existingEntry.projectId)
      ? [...customerProjects, ...projects.filter((project) => project.id === existingEntry.projectId)]
      : customerProjects;
    return [...options].sort((a, b) => a.name.localeCompare(b.name));
  }, [activeProjects, existingEntry, customer, projects]);

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

  function handleCustomerChange(event: ChangeEvent<HTMLSelectElement>) {
    setCustomer(event.target.value);
    const customerProjects = activeProjects.filter((project) => project.customer === event.target.value);
    if (customerProjects.length === 1) {
      setProjectId(customerProjects[0].id);
    } else {
      setProjectId(null);
    }
  }

  function handleCancel() {
    setStartTime(existingEntry?.startTime ?? '');
    setEndTime(existingEntry?.endTime ?? '');
    setCustomer(getCustomerFromProject(existingEntry?.projectId ?? null, projects));
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
        <h2 className="text-base font-semibold text-midnight-950">
          {existingEntry ? 'Edit' : 'New'} entry
          {!dateEditable && ` for ${formatShortDateLabel(parseDate(effectiveWorkDate))}`}
        </h2>
      )}

      {dateEditable && (
        <div>
          <label htmlFor="entry-date" className="block text-sm font-medium text-lakehouse-900">
            Date
          </label>
          <input
            id="entry-date"
            type="date"
            value={effectiveWorkDate}
            max={formatDate(today)}
            onChange={(event) => setInternalWorkDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-lakehouse-900/20 px-3 py-2.5 text-base focus:border-cedar-500 focus:outline-none focus:ring-1 focus:ring-cedar-500"
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
          <TimeField
            id="entry-start"
            ariaLabel="Start time"
            value={startTime}
            today={today}
            onChange={setStartTime}
            minuteStep={MINUTE_INCREMENT}
            label="Start time"
            error={visibleErrors.startTime}
          />
        </div>
        <div>
          <TimeField
            id="entry-end"
            ariaLabel="End time"
            value={endTime}
            today={today}
            onChange={setEndTime}
            minuteStep={MINUTE_INCREMENT}
            label="End time"
            error={visibleErrors.endTime}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <SelectField
            id="entry-customer"
            ariaLabel="Customer"
            value={customer}
            variant="large"
            label="Customer"
            onChange={handleCustomerChange}
            className="mt-1 w-full"
          >
            <option value="">Select a customer…</option>
            {customerOptions.map((customer) => (
              <option key={customer} value={customer}>
                {customer}
              </option>
            ))}
          </SelectField>
        </div>

        <div>
          <SelectField
            id="entry-project"
            ariaLabel="Project"
            value={projectId ?? ''}
            variant="large"
            label="Project"
            error={visibleErrors.projectId}
            className="mt-1 w-full"
            disabled={projectOptions.length <= 1}
            onChange={(event) => setProjectId(event.target.value ? Number(event.target.value) : null)}
          >
            {projectOptions.length === 0 && <option value="">Select a customer first</option>}
            {projectOptions.length > 1 && <option value="">Select a project…</option>}
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.projectNumber ? `(${project.projectNumber}) ` : ''}{getProjectDisplayName(project)}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      <div>
        <TextAreaField
          id="entry-description"
          ariaLabel="Work description"
          value={workDescription}
          onChange={(event) => setWorkDescription(event.target.value)}
          label="Work description"
          error={visibleErrors.workDescription}
        />
      </div>

      <div className="flex justify-between rounded-lg bg-midnight-950/5 px-3 py-2 text-sm text-lakehouse-900/80">
        <span>Duration of this entry</span>
        <span className="font-semibold">{formatHours(thisDuration)}</span>
      </div>
      <div className="flex justify-between rounded-lg bg-midnight-950/5 px-3 py-2 text-sm text-lakehouse-900/80">
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
