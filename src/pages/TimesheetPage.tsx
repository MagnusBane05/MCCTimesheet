import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { timesheetService } from '../services/service';
import type { Project } from '../domain/project';
import type { TimeEntry } from '../domain/timeEntry';
import { addDays, formatDate, getWeekEnd, getWeekStart } from '../utils/dates';
import { calculateRegularAndOvertime, calculateWeeklyHours } from '../utils/overtime';
import { formatHours } from '../utils/time';
import { canEmployeeModifyDate } from '../utils/validation';
import { DayNav } from '../components/timesheets/DayNav';
import { TimeEntryCard } from '../components/timesheets/TimeEntryCard';
import { TimeEntryForm, type TimeEntryFormValues } from '../components/timesheets/TimeEntryForm';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

const TODAY = new Date();

type FormState = { mode: 'add' } | { mode: 'edit'; entry: TimeEntry } | null;

export function TimesheetPage() {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formState, setFormState] = useState<FormState>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(false);
    try {
      const [entryList, projectList] = await Promise.all([
        timesheetService.getTimeEntries({ employeeId: currentUser.id }),
        timesheetService.getProjects(),
      ]);
      setEntries(entryList);
      setProjects(projectList);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    load();
  }, [load]);

  if (!currentUser) return null;

  const selectedDateStr = formatDate(selectedDate);
  const dayEntries = entries
    .filter((entry) => entry.workDate === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const weekStart = getWeekStart(selectedDate);
  const weekEnd = getWeekEnd(selectedDate);
  const weekEntries = entries.filter((entry) => entry.workDate >= formatDate(weekStart) && entry.workDate <= formatDate(weekEnd));

  const dailyTotal = calculateWeeklyHours(dayEntries);
  const weeklyTotal = calculateWeeklyHours(weekEntries);
  const { regularHours, overtimeHours } = calculateRegularAndOvertime(weeklyTotal);

  const projectsById = new Map(projects.map((project) => [project.id, project]));

  async function handleFormSubmit(values: TimeEntryFormValues) {
    if (!currentUser) return;
    if (formState?.mode === 'edit') {
      await timesheetService.updateTimeEntry(formState.entry.id, values);
    } else {
      await timesheetService.createTimeEntry({ employeeId: currentUser.id, ...values });
    }
    setFormState(null);
    await load();
  }

  async function handleDeleteConfirm() {
    if (!deletingEntry) return;
    await timesheetService.deleteTimeEntry(deletingEntry.id);
    setDeletingEntry(null);
    await load();
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">
      <DayNav
        date={selectedDate}
        onPrevious={() => setSelectedDate((current) => addDays(current, -1))}
        onNext={() => setSelectedDate((current) => addDays(current, 1))}
        onToday={() => setSelectedDate(TODAY)}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-900/60">Daily total</p>
          <p className="mt-1 text-lg font-semibold text-navy-950">{formatHours(dailyTotal)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-900/60">Weekly total</p>
          <p className="mt-1 text-lg font-semibold text-navy-950">
            {formatHours(weeklyTotal)}
            {overtimeHours > 0 && (
              <span className="ml-1 text-xs font-medium text-accent-600">
                ({formatHours(regularHours)} reg + {formatHours(overtimeHours)} OT)
              </span>
            )}
          </p>
        </div>
      </div>

      {loading && <LoadingState label="Loading time entries…" />}
      {!loading && error && <ErrorState message="Unable to load time entries. Please try again." onRetry={load} />}

      {!loading && !error && (
        <>
          {formState ? (
            <TimeEntryForm
              today={TODAY}
              defaultDate={selectedDateStr}
              projects={projects}
              existingEntry={formState.mode === 'edit' ? formState.entry : undefined}
              otherEntries={entries}
              onCancel={() => setFormState(null)}
              onSubmit={handleFormSubmit}
            />
          ) : (
            <Button onClick={() => setFormState({ mode: 'add' })} className="w-full">
              + Add time entry
            </Button>
          )}

          <div className="flex flex-col gap-3">
            {dayEntries.length === 0 && !formState && <EmptyState message="No entries for this day." />}
            {dayEntries.map((entry) => (
              <TimeEntryCard
                key={entry.id}
                entry={entry}
                project={projectsById.get(entry.projectId)}
                editable={canEmployeeModifyDate(entry.workDate, TODAY)}
                onEdit={() => setFormState({ mode: 'edit', entry })}
                onDelete={() => setDeletingEntry(entry)}
              />
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deletingEntry}
        title="Delete this time entry?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingEntry(null)}
      />
    </div>
  );
}
