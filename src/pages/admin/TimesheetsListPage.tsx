import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { timesheetService } from '../../services/service';
import type { Project } from '../../domain/project';
import type { TimeEntry } from '../../domain/timeEntry';
import type { User } from '../../domain/user';
import { addWeeks, areSameDay, formatLongDateLabel, getWeekEnd, getWeekStart, isFutureDate, parseDate } from '../../utils/dates';
import { calculateWeeklyHours } from '../../utils/overtime';
import { HoursGroupCard } from '../../components/admin/HoursGroupCard';
import { getProjectDisplayName } from '../../utils/projects';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { TimeEntryTable } from '../../components/admin/TimeEntryTable';
import { useRowEditor } from '../../hooks/useRowEditor';
import { SelectField } from '../../components/form/SelectField';
import { TextField } from '../../components/form/TextField';
import { Button } from '../../components/common/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { Title } from '../../components/common/Title';
import { Counter } from '../../components/common/Counter';
import { Badge } from '../../components/common/Badge';

const TODAY = new Date();

type SortBy = 'customer' | 'name' | 'hours';
type GroupBy = 'project' | 'employee';

export function TimesheetsListPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [employees, setEmployees] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [fromDate, setFromDate] = useState(getWeekStart(TODAY));
  const [toDate, setToDate] = useState(getWeekEnd(TODAY));
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('customer');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupBy>('project');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const dateFrom = fromDate.toISOString().split('T')[0];
      const dateTo = toDate.toISOString().split('T')[0];
      const [employeeList, projectList, entryList] = await Promise.all([
        timesheetService.getEmployees(),
        timesheetService.getProjects(),
        timesheetService.getTimeEntries({ dateFrom, dateTo }),
      ]);
      setEmployees(employeeList);
      setProjects(projectList);
      setEntries(entryList);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

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

  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));

  const rangeEntries = entries.filter((entry) => parseDate(entry.workDate) >= fromDate && parseDate(entry.workDate) <= toDate);
  const totalRangeHours = calculateWeeklyHours(rangeEntries);

  const searchTerm = search.trim().toLowerCase();

  const groupsByProject = new Map<number, TimeEntry[]>();
  for (const entry of rangeEntries) {
    const project = projectsById.get(entry.projectId);
    if (searchTerm) {
      const haystack = `${project?.name ?? ''} ${project?.customer ?? ''} ${project?.projectNumber ?? ''}`.toLowerCase();
      if (!haystack.includes(searchTerm)) continue;
    }
    const list = groupsByProject.get(entry.projectId) ?? [];
    list.push(entry);
    groupsByProject.set(entry.projectId, list);
  }

  const groupsByEmployee = new Map<number, TimeEntry[]>();
  for (const entry of rangeEntries) {
    const employee = employeesById.get(entry.employeeId);
    if (searchTerm) {
      const haystack = `${employee?.displayName ?? ''}`.toLowerCase();
      if (!haystack.includes(searchTerm)) continue;
    }
    const list = groupsByEmployee.get(entry.employeeId) ?? [];
    list.push(entry);
    groupsByEmployee.set(entry.employeeId, list);
  }

  const groupsArray = groupBy === 'project' ? Array.from(groupsByProject.entries()) : Array.from(groupsByEmployee.entries());
  const groups = groupsArray
    .map(([groupId, groupEntries]) => {
      const isProjectGrouping = groupBy === 'project';
      return {
        groupId,
        project: isProjectGrouping ? projectsById.get(groupId) : undefined,
        employee: !isProjectGrouping ? employeesById.get(groupId) : undefined,
        entries: [...groupEntries].sort((a, b) =>
          a.workDate === b.workDate ? a.startTime.localeCompare(b.startTime) : a.workDate.localeCompare(b.workDate),
        ),
        totalHours: calculateWeeklyHours(groupEntries),
      };
    })
    .sort((a, b) => {
      if (groupBy === 'project') {
        if (sortBy === 'hours') return b.totalHours - a.totalHours;
        if (sortBy === 'name') return (a.project?.name ?? '').localeCompare(b.project?.name ?? '');
        return (a.project?.customer ?? '').localeCompare(b.project?.customer ?? '');
      } else {
        if (sortBy === 'hours') return b.totalHours - a.totalHours;
        return (a.employee?.displayName ?? '').localeCompare(b.employee?.displayName ?? '');
      }
    });

  function toggleExpanded(groupId: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
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

  function handleWeekRangeChange(fromDate: Date, toDate: Date) {
    setFromDate(fromDate);
    setToDate(toDate);
  }

  function shiftWeek(direction: 1 | -1) {
    const shiftedFrom = addWeeks(getWeekStart(fromDate), direction);
    const shiftedTo = addWeeks(getWeekEnd(fromDate), direction);
    handleWeekRangeChange(shiftedFrom, shiftedTo);
  }

  const includeYearInFromDate = fromDate.getFullYear() !== toDate.getFullYear();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center items-center gap-3 rounded-md">
        <Button variant="ghost" onClick={() => shiftWeek(-1)} className="!px-3">
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <Title className="!mb-0">
          { areSameDay(fromDate, getWeekStart(fromDate))
            && areSameDay(toDate, getWeekEnd(fromDate)) ? 
          `Week of ${formatLongDateLabel(getWeekStart(fromDate))}` : 
          `${formatLongDateLabel(fromDate, includeYearInFromDate)} to ${formatLongDateLabel(toDate)}`
          }
        </Title>
        <DateRangePicker fromDate={fromDate} toDate={toDate} onRangeChange={handleWeekRangeChange} />
        <Button 
          variant="ghost"
          disabled={isFutureDate(addWeeks(fromDate, 1), new Date())}
          onClick={() => shiftWeek(1)} 
          className="!px-3">
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex gap-3">
        <Counter title="Total entries" number={rangeEntries.length} variant="secondary" />
        <Counter title="Total hours" number={totalRangeHours} variant="primary" />
      </div>

      <div className='flex justify-between'>
        <div className="flex flex-wrap gap-3">
          <SelectField
            id="group-by"
            ariaLabel="Group by"
            label="Group by"
            labelVariant="small"
            className="min-w-36"
            value={groupBy}
            onChange={(event) => setGroupBy(event.target.value as GroupBy)}
          >
            <option value="project">Project</option>
            <option value="employee">Employee</option>
          </SelectField>
          <SelectField
            id="sort-by"
            ariaLabel="Sort by"
            label="Sort by"
            labelVariant="small"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
          >
            {groupBy === 'project' ? (
              <>
                <option value="customer">Customer (A–Z)</option>
                <option value="name">Project name (A–Z)</option>
                <option value="hours">Total hours (high to low)</option>
              </>
            ) : (
              <>
                <option value="name">Employee name (A–Z)</option>
                <option value="hours">Total hours (high to low)</option>
              </>
            )}
          </SelectField>
          <TextField
            id="job-search"
            ariaLabel="Search"
            label="Search"
            labelVariant="small"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={groupBy === 'project' ? "Project, customer, or project #" : "Employee name"}
          />
        </div>
      </div>

      {loading && <LoadingState label="Loading job hours…" />}
      {!loading && error && <ErrorState message="Unable to load time entries. Please try again." onRetry={load} />}

      {!loading && !error && (
        <>
          {groups.length === 0 && <EmptyState message={groupBy === 'project' ? "No projects match these filters." : "No employees match these filters."} />}
          {groups.map((group) => {
            if (groupBy === 'project') {
              const allInvoiced = group.entries.every(entry => entry.invoiceNumber);
              return (
                <HoursGroupCard
                  key={group.groupId}
                  title={group.project ? getProjectDisplayName(group.project) : 'Unknown project'}
                  subtitle={group.project ? `${group.project.customer} · ${group.project.projectNumber}` : undefined}
                  badge={
                    group.project && !group.project.active ? (
                      <Badge variant="secondary">
                        Inactive
                      </Badge>
                    ) : undefined
                  }
                  secondaryBadge={
                    allInvoiced ? (
                      <Badge variant="success">
                        Invoiced
                      </Badge>
                    ) : undefined
                  }
                  entryCount={group.entries.length}
                  totalHours={group.totalHours}
                  expanded={expandedIds.has(group.groupId)}
                  onToggle={() => toggleExpanded(group.groupId)}
                >
                  <TimeEntryTable
                    entries={group.entries}
                    allEntries={entries}
                    projectsById={projectsById}
                    employeesById={employeesById}
                    onUpdateEntry={handleUpdateTimeEntry}
                    onDeleteEntry={handleDeleteTimeEntry}
                    canEdit={isAdmin}
                    showInvoice
                    showEmployee
                    editingEntry={editingEntry}
                    isEditing={isEditing}
                    onStartEditing={startEditing}
                    onCancelEditing={cancelEditing}
                    onUpdateField={updateField}
                  />
                </HoursGroupCard>
              );
            } else {
              return (
                <HoursGroupCard
                  key={group.groupId}
                  title={group.employee?.displayName ?? 'Unknown employee'}
                  badge={
                    group.employee && !group.employee.active ? (
                      <Badge variant="secondary">
                        Inactive
                      </Badge>
                    ) : undefined
                  }
                  entryCount={group.entries.length}
                  totalHours={group.totalHours}
                  expanded={expandedIds.has(group.groupId)}
                  onToggle={() => toggleExpanded(group.groupId)}
                >
                  <TimeEntryTable
                    entries={group.entries}
                    allEntries={entries}
                    projectsById={projectsById}
                    employeesById={employeesById}
                    onUpdateEntry={handleUpdateTimeEntry}
                    onDeleteEntry={handleDeleteTimeEntry}
                    canEdit={isAdmin}
                    showProject
                    editingEntry={editingEntry}
                    isEditing={isEditing}
                    onStartEditing={startEditing}
                    onCancelEditing={cancelEditing}
                    onUpdateField={updateField}
                  />
                </HoursGroupCard>
              );
            }
          })}
        </>
      )}
    </div>
  );
}
