import { useCallback, useEffect, useState } from 'react';
import { timesheetService } from '../../services/service';
import type { TimeEntry } from '../../domain/timeEntry';
import type { User } from '../../domain/user';
import type { Project } from '../../domain/project';
import { formatLongDateLabel, getWeekEnd, getWeekStart, parseDate } from '../../utils/dates';
import { calculateWeeklyHours } from '../../utils/overtime';
import { WeekRangeNav } from '../../components/admin/WeekRangeNav';
import { HoursGroupCard } from '../../components/admin/HoursGroupCard';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Counter } from '../../components/common/Counter';
import { TimeEntryTable } from '../../components/admin/TimeEntryTable';
import { useAuth } from '../../auth/AuthContext';
import { useRowEditor } from '../../hooks/useRowEditor';

const TODAY = new Date();

export function ByEmployeePage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  
  const [employees, setEmployees] = useState<User[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [fromDate, setFromDate] = useState(getWeekStart(TODAY));
  const [toDate, setToDate] = useState(getWeekEnd(TODAY));
  const [employeeFilter] = useState<'all' | number>('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [employeeList, entryList, projectsList] = await Promise.all([
        timesheetService.getEmployees(),
        timesheetService.getTimeEntries({}),
        timesheetService.getProjects(),
      ]);
      setEmployees(employeeList);
      setEntries(entryList);
      setProjects(projectsList);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
    
  const {
    editingItem: editingEntry,
    startEditing,
    cancelEditing,
    updateField,
    isEditing,
  } = useRowEditor<TimeEntry>();

  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const projectsById = new Map(projects.map((project) => [project.id, project]));

  const rangeEntries = entries.filter((entry) => parseDate(entry.workDate) >= fromDate && parseDate(entry.workDate) <= toDate);

  const totalRangeHours = calculateWeeklyHours(rangeEntries);

  const groupsByEmployee = new Map<number, TimeEntry[]>();
  for (const entry of rangeEntries) {
    if (employeeFilter !== 'all' && entry.employeeId !== employeeFilter) continue;
    const list = groupsByEmployee.get(entry.employeeId) ?? [];
    list.push(entry);
    groupsByEmployee.set(entry.employeeId, list);
  }

  const groups = Array.from(groupsByEmployee.entries())
    .map(([employeeId, groupEntries]) => ({
      employeeId,
      employee: employeesById.get(employeeId),
      entries: [...groupEntries].sort((a, b) =>
        a.workDate === b.workDate ? a.startTime.localeCompare(b.startTime) : a.workDate.localeCompare(b.workDate),
      ),
      totalHours: calculateWeeklyHours(groupEntries),
    }))
    .sort((a, b) => {
      return (a.employee?.displayName ?? '').localeCompare(b.employee?.displayName ?? '');
    });

  function toggleExpanded(employeeId: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  }

  async function handleUpdateTimeEntry(entryId: number, values: Partial<TimeEntry>) {
    await timesheetService.updateTimeEntry(entryId, values);
    await load();
  }

  async function handleDeleteTimeEntry(entryId: number) {
    await timesheetService.deleteTimeEntry(entryId);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-navy-950">Week of {formatLongDateLabel(getWeekStart(fromDate))}</h1>

      {loading && <LoadingState label="Loading employee hours…" />}
      {!loading && error && <ErrorState message="Unable to load employee hours. Please try again." onRetry={load} />}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap items-end gap-3 rounded-xl">
            <WeekRangeNav fromDate={fromDate} toDate={toDate} onRangeChange={(f, t) => { setFromDate(f); setToDate(t); }} />
            <Counter title="Total entries" number={rangeEntries.length} variant="secondary" />
            <Counter title="Total hours" number={totalRangeHours} variant="primary" />
          </div>
          {groups.length === 0 && <EmptyState message="No employees have hours in this date range." />}
          {groups.map((group) => (
            <HoursGroupCard
              key={group.employeeId}
              title={group.employee?.displayName ?? 'Unknown employee'}
              badge={
                group.employee && !group.employee.active ? (
                  <span className="rounded-full bg-navy-900/10 px-2 py-0.5 text-xs font-medium text-navy-900/60">
                    Inactive
                  </span>
                ) : undefined
              }
              entryCount={group.entries.length}
              totalHours={group.totalHours}
              expanded={expandedIds.has(group.employeeId)}
              onToggle={() => toggleExpanded(group.employeeId)}
            >
              <TimeEntryTable 
                entries={group.entries}
                allEntries={entries}
                projectsById={projectsById}
                onUpdateEntry={handleUpdateTimeEntry}
                onDeleteEntry={handleDeleteTimeEntry}
                canEdit={isAdmin}
                showInvoice 
                showProject
                editingEntry={editingEntry} 
                isEditing={isEditing} 
                onStartEditing={startEditing} 
                onCancelEditing={cancelEditing} 
                onUpdateField={updateField}
              />
            </HoursGroupCard>
          ))}
        </>
      )}
    </div>
  );
}
