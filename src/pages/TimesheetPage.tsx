import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { timesheetService } from '../services/service';
import type { Project } from '../domain/project';
import type { TimeEntry } from '../domain/timeEntry';
import { addDays, formatDate, getWeekEnd, getWeekStart, parseDate } from '../utils/dates';
import { calculateWeeklyHours } from '../utils/overtime';
import { formatHours } from '../utils/time';
import { canEmployeeModifyDate } from '../utils/validation';
import { DayNav } from '../components/timesheets/DayNav';
import { TimeEntryCard } from '../components/timesheets/TimeEntryCard';
import { TimeEntryForm, type TimeEntryFormValues } from '../components/timesheets/TimeEntryForm';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Counter } from '../components/common/Counter';

const TODAY = new Date();

type FormState = { mode: 'add' } | { mode: 'edit'; entry: TimeEntry };

export function TimesheetPage() {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formState, setFormState] = useState<FormState>({ mode: 'add' });
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
  const insideEditWindow = canEmployeeModifyDate(selectedDateStr, TODAY);
  const dayEntries = entries
    .filter((entry) => entry.workDate === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const weekStart = getWeekStart(selectedDate);
  const weekEnd = getWeekEnd(selectedDate);
  const weekEntries = entries.filter((entry) => entry.workDate >= formatDate(weekStart) && entry.workDate <= formatDate(weekEnd));

  const dailyTotal = calculateWeeklyHours(dayEntries);
  const weeklyTotal = calculateWeeklyHours(weekEntries);

  const projectsById = new Map(projects.map((project) => [project.id, project]));

  async function handleFormSubmit(values: TimeEntryFormValues) {
    if (!currentUser) return;
    if (formState?.mode === 'edit') {
      await timesheetService.updateTimeEntry(formState.entry.id, values);
    } else {
      await timesheetService.createTimeEntry({ employeeId: currentUser.id, ...values });
    }
    setFormState({ mode: 'add' });
    await load();
  }

  async function handleDeleteConfirm() {
    if (!deletingEntry) return;
    await timesheetService.deleteTimeEntry(deletingEntry.id);
    setDeletingEntry(null);
    await load();
  }

  function handleDateChange(newDate: Date) {
    setSelectedDate(newDate);
    setFormState({ mode: 'add' });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">
      <DayNav
        date={selectedDate}
        today={TODAY}
        onPrevious={() => handleDateChange(addDays(selectedDate, -1))}
        onNext={() => handleDateChange(addDays(selectedDate, 1))}
        onDateChange={(newDate) => handleDateChange(parseDate(newDate))}
      />

      {loading && <LoadingState label="Loading time entries…" />}
      {!loading && error && <ErrorState message="Unable to load time entries. Please try again." onRetry={load} />}

      {!loading && !error && (
        <>
          {insideEditWindow &&
            <TimeEntryForm
              key={formState.mode === 'edit' ? `edit-${formState.entry.id}` : 'add'}
              today={TODAY}
              workDate={selectedDateStr}
              projects={projects}
              existingEntry={formState.mode === 'edit' ? formState.entry : undefined}
              otherEntries={entries}
              onCancel={() => setFormState({ mode: 'add' })}
              onSubmit={handleFormSubmit}
            />
          }

          <div className="grid grid-cols-2 gap-3">
            <Counter title='Daily total' number={formatHours(dailyTotal)} />
            <Counter title='Weekly total' number={formatHours(weeklyTotal)} />
          </div>

          <div className="flex flex-col gap-3">
            {dayEntries.length === 0 && formState.mode === 'add' && <EmptyState message="No entries for this day." />}
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
