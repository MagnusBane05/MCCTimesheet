import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { timesheetService } from '../../services/service';
import type { Project } from '../../domain/project';
import type { TimeEntry } from '../../domain/timeEntry';
import type { User } from '../../domain/user';
import { formatDate, formatLongDateLabel, getWeekEnd, getWeekStart, parseDate } from '../../utils/dates';
import { calculateWeeklyHours } from '../../utils/overtime';
import { formatTimeLabel } from '../../utils/time';
import { WeekRangeNav } from '../../components/admin/WeekRangeNav';
import { HoursGroupCard } from '../../components/admin/HoursGroupCard';
import { TimeEntryDetailRow } from '../../components/admin/TimeEntryDetailRow';
import { TimeEntryForm, type TimeEntryFormValues } from '../../components/timesheets/TimeEntryForm';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';

const TODAY = new Date();

type SortBy = 'customer' | 'name' | 'hours';

export function ByJobPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [employees, setEmployees] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [fromDate, setFromDate] = useState(formatDate(getWeekStart(TODAY)));
  const [toDate, setToDate] = useState(formatDate(getWeekEnd(TODAY)));
  const [customerFilter, setCustomerFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('customer');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [employeeList, projectList, entryList] = await Promise.all([
        timesheetService.getEmployees(),
        timesheetService.getProjects(),
        timesheetService.getTimeEntries({}),
      ]);
      setEmployees(employeeList);
      setProjects(projectList);
      setEntries(entryList);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const customers = Array.from(new Set(projects.map((project) => project.customer))).sort((a, b) => a.localeCompare(b));

  const rangeEntries = entries.filter((entry) => entry.workDate >= fromDate && entry.workDate <= toDate);

  const searchTerm = search.trim().toLowerCase();

  const groupsByProject = new Map<number, TimeEntry[]>();
  for (const entry of rangeEntries) {
    const project = projectsById.get(entry.projectId);
    if (customerFilter !== 'all' && project?.customer !== customerFilter) continue;
    if (searchTerm) {
      const haystack = `${project?.name ?? ''} ${project?.customer ?? ''} ${project?.projectNumber ?? ''}`.toLowerCase();
      if (!haystack.includes(searchTerm)) continue;
    }
    const list = groupsByProject.get(entry.projectId) ?? [];
    list.push(entry);
    groupsByProject.set(entry.projectId, list);
  }

  const groups = Array.from(groupsByProject.entries())
    .map(([projectId, groupEntries]) => ({
      projectId,
      project: projectsById.get(projectId),
      entries: [...groupEntries].sort((a, b) =>
        a.workDate === b.workDate ? a.startTime.localeCompare(b.startTime) : a.workDate.localeCompare(b.workDate),
      ),
      totalHours: calculateWeeklyHours(groupEntries),
    }))
    .sort((a, b) => {
      if (sortBy === 'hours') return b.totalHours - a.totalHours;
      if (sortBy === 'name') return (a.project?.name ?? '').localeCompare(b.project?.name ?? '');
      return (a.project?.customer ?? '').localeCompare(b.project?.customer ?? '');
    });

  function toggleExpanded(projectId: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  async function handleSaveInvoice(entry: TimeEntry, invoiceNumber: string | null) {
    await timesheetService.updateTimeEntry(entry.id, { invoiceNumber });
    await load();
  }

  async function handleEditSubmit(values: TimeEntryFormValues) {
    if (!editingEntry) return;
    await timesheetService.updateTimeEntry(editingEntry.id, values);
    setEditingEntry(null);
    await load();
  }

  async function handleDeleteConfirm() {
    if (!deletingEntry) return;
    await timesheetService.deleteTimeEntry(deletingEntry.id);
    setDeletingEntry(null);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-navy-950">By Job</h1>

      <WeekRangeNav fromDate={fromDate} toDate={toDate} onRangeChange={(f, t) => { setFromDate(f); setToDate(t); }} />

      <div className="flex flex-wrap gap-3">
        <div>
          <label htmlFor="customer-filter" className="block text-xs font-medium uppercase tracking-wide text-navy-900/60">
            Customer
          </label>
          <select
            id="customer-filter"
            value={customerFilter}
            onChange={(event) => setCustomerFilter(event.target.value)}
            className="mt-1 rounded-lg border border-navy-900/20 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          >
            <option value="all">All customers</option>
            {customers.map((customer) => (
              <option key={customer} value={customer}>
                {customer}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="job-search" className="block text-xs font-medium uppercase tracking-wide text-navy-900/60">
            Search
          </label>
          <input
            id="job-search"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Project, customer, or project #"
            className="mt-1 w-56 rounded-lg border border-navy-900/20 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
        </div>
        <div>
          <label htmlFor="sort-by" className="block text-xs font-medium uppercase tracking-wide text-navy-900/60">
            Sort by
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            className="mt-1 rounded-lg border border-navy-900/20 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          >
            <option value="customer">Customer (A–Z)</option>
            <option value="name">Project name (A–Z)</option>
            <option value="hours">Total hours (high to low)</option>
          </select>
        </div>
      </div>

      {loading && <LoadingState label="Loading job hours…" />}
      {!loading && error && <ErrorState message="Unable to load time entries. Please try again." onRetry={load} />}

      {!loading && !error && (
        <>
          {groups.length === 0 && <EmptyState message="No projects match these filters." />}
          {groups.map((group) => (
            <HoursGroupCard
              key={group.projectId}
              title={group.project?.name ?? 'Unknown project'}
              subtitle={group.project ? `${group.project.customer} · ${group.project.projectNumber}` : undefined}
              badge={
                group.project && !group.project.active ? (
                  <span className="rounded-full bg-navy-900/10 px-2 py-0.5 text-xs font-medium text-navy-900/60">
                    Inactive
                  </span>
                ) : undefined
              }
              entryCount={group.entries.length}
              totalHours={group.totalHours}
              expanded={expandedIds.has(group.projectId)}
              onToggle={() => toggleExpanded(group.projectId)}
            >
              {group.entries.map((entry) => (
                <TimeEntryDetailRow
                  key={entry.id}
                  entry={entry}
                  project={group.project}
                  showProject={false}
                  employeeName={employeesById.get(entry.employeeId)?.displayName ?? 'Unknown employee'}
                  isAdmin={isAdmin}
                  onEdit={() => setEditingEntry(entry)}
                  onDelete={() => setDeletingEntry(entry)}
                  onSaveInvoice={(invoiceNumber) => handleSaveInvoice(entry, invoiceNumber)}
                />
              ))}
            </HoursGroupCard>
          ))}
        </>
      )}

      <Modal open={!!editingEntry} title="Edit time entry" onClose={() => setEditingEntry(null)}>
        {editingEntry && (
          <TimeEntryForm
            key={editingEntry.id}
            today={TODAY}
            workDate={editingEntry.workDate}
            projects={projects}
            existingEntry={editingEntry}
            otherEntries={entries.filter((entry) => entry.employeeId === editingEntry.employeeId)}
            enforceEditWindow={false}
            dateEditable
            hideHeading
            onCancel={() => setEditingEntry(null)}
            onSubmit={handleEditSubmit}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingEntry}
        title="Delete this time entry?"
        description={
          deletingEntry && (
            <>
              {formatLongDateLabel(parseDate(deletingEntry.workDate))}
              <br />
              {formatTimeLabel(deletingEntry.startTime)} – {formatTimeLabel(deletingEntry.endTime)}
              <br />
              {projectsById.get(deletingEntry.projectId)?.name ?? 'Unknown project'}
            </>
          )
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingEntry(null)}
      />
    </div>
  );
}
