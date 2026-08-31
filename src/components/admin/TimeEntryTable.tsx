import type { TimeEntry } from "../../domain/timeEntry";
import { Table, TableCell, TableHeader, TableRow } from "../common/Table";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { useMemo, useState } from "react";
import type { Project } from "../../domain/project";
import type { User } from "../../domain/user";
import type { TimeEntryInput, TimeEntryValidationErrors } from "../../utils/validation";
import { validateTimeEntry } from "../../utils/validation";
import { formatDate, formatLongDateLabel, parseDate } from "../../utils/dates";
import { formatHours, formatTimeLabel, getDurationHours, MINUTE_INCREMENT } from "../../utils/time";
import { EditDelete } from "../common/EditDelete";
import { EditableText } from "../common/EditableText";
import { EditableDate } from "../common/EditableDate";
import { EditableTime } from "../common/EditableTime";
import { InvoiceNumberField } from "./InvoiceNumberField";
import { EditableSelect } from "../common/EditableSelect";
import { Error } from "../common/Error";

const TODAY = new Date();

function getSortedSelectableValues<T extends { id: number; active: boolean }>(
  valuesById: Map<number, T> | undefined,
  currentId: number | undefined,
  getLabel: (value: T) => string,
): T[] {
  if (!valuesById) return [];
  return Array.from(valuesById.values())
    .filter((value) => value.active || value.id === currentId)
    .sort((a, b) => getLabel(a).localeCompare(getLabel(b)));
}

interface TimeEntryTableProps {
  entries: TimeEntry[];
  editingEntry: TimeEntry | null;
  allEntries: TimeEntry[];
  projectsById?: Map<number, Project>;
  employeesById?: Map<number, User>;
  showInvoice?: boolean;
  showProject?: boolean;
  showEmployee?: boolean;
  canEdit?: boolean;
  isEditing: (entry: TimeEntry) => boolean;
  onStartEditing: (entry: TimeEntry) => void;
  onCancelEditing: () => void;
  onUpdateField: <K extends keyof TimeEntry>(field: K, value: TimeEntry[K]) => void;
  onUpdateEntry: (entryId: number, values: Partial<TimeEntry>) => Promise<void>;
  onDeleteEntry: (entryId: number) => Promise<void>;
}

export function TimeEntryTable({ 
  entries, 
  editingEntry,
  allEntries,
  projectsById,
  employeesById,
  onUpdateEntry,
  onDeleteEntry,
  showInvoice = false,
  showProject = false,
  showEmployee = false,
  canEdit = false,
  isEditing,
  onStartEditing,
  onCancelEditing,
  onUpdateField,
}: TimeEntryTableProps) {
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const projectOptions = useMemo(() => getSortedSelectableValues(
    projectsById, editingEntry?.projectId, (project) => project.name),
  [projectsById, editingEntry?.projectId]);

  const employeeOptions = useMemo(() => getSortedSelectableValues(
    employeesById, editingEntry?.employeeId, (user) => user.displayName),
  [employeesById, editingEntry?.employeeId]);

  const validationInput: TimeEntryInput | null = editingEntry ? {
    workDate: editingEntry.workDate,
    startTime: editingEntry.startTime,
    endTime: editingEntry.endTime,
    projectId: editingEntry.projectId,
    workDescription: editingEntry.workDescription,
  } : null;

  const otherEntries = editingEntry ? allEntries.filter(
    (entry) => entry.employeeId === editingEntry.employeeId
  ) : [];

  const errors: TimeEntryValidationErrors = 
    validationInput && editingEntry ? validateTimeEntry(validationInput, {
      today: TODAY,
      otherEntries: otherEntries,
      excludeEntryId: editingEntry.id,
      enforceEditWindow: false
  }) : {};

  const visibleErrors = hasAttemptedSubmit ? errors : {};
  const isAnyEntryEditing = editingEntry !== null;

  function handleStartEditing(entry: TimeEntry) {
    setHasAttemptedSubmit(false);
    setSubmitError(null);
    onStartEditing(entry);
  }

  function handleCancelEditing() {
    setHasAttemptedSubmit(false);
    setSubmitError(null);
    onCancelEditing();
  }

  async function handleEditSubmit() {
    if (!editingEntry) return;
    setHasAttemptedSubmit(true);
    if (Object.keys(errors).length > 0 ) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onUpdateEntry(editingEntry.id, editingEntry);
      setHasAttemptedSubmit(false);
      onCancelEditing();
    } catch (error) {
      console.error("Failed to update entry:", error);
      setSubmitError("Failed to update entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  
  async function handleSaveInvoice(entry: TimeEntry, invoiceNumber: string | null) {
    await onUpdateEntry(entry.id, { invoiceNumber });
  }

  async function handleDeleteConfirm() {
    if (!deletingEntry) return;
    await onDeleteEntry(deletingEntry.id);
    setDeletingEntry(null);
  }
  
  return (
    <div className='overflow-x-auto w-full'>
      <Table>
        <thead>
          <tr>
            <TableHeader>Date</TableHeader>
            <TableHeader>Start</TableHeader>
            <TableHeader>End</TableHeader>
            <TableHeader>Hours</TableHeader>
            {showProject && <TableHeader>Project</TableHeader>}
            {showEmployee && <TableHeader>Employee</TableHeader>}
            {showInvoice && <TableHeader>Invoice</TableHeader>}
            <TableHeader>Description</TableHeader>
            {canEdit && <TableHeader />}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const editing = isEditing(entry);
            const displayedEntry = isEditing(entry) ? editingEntry ?? entry : entry;
            const rowErrors = editing ? visibleErrors : {};
            return (
              <TableRow key={entry.id}>
                <TableCell>
                  <EditableDate
                    date={parseDate(displayedEntry.workDate ?? '')}
                    isEditing={editing}
                    onEdit={(newDate) => onUpdateField('workDate', formatDate(newDate))}
                  />
                  <Error message={rowErrors.workDate} />
                </TableCell>
                <TableCell>
                  <EditableTime
                    time={displayedEntry.startTime}
                    isEditing={editing}
                    onEdit={(newTime) => onUpdateField('startTime', newTime)}
                    variant={'24'}
                    minuteStep={MINUTE_INCREMENT}
                    label="Start Time"
                  />
                  <Error message={rowErrors.startTime} />
                </TableCell>
                <TableCell className="overflow-visible">
                  <EditableTime
                    time={displayedEntry.endTime}
                    isEditing={editing}
                    onEdit={(newTime) => onUpdateField('endTime', newTime)}
                    variant={'24'}
                    minuteStep={MINUTE_INCREMENT}
                    label="End Time"
                  />
                  <Error message={rowErrors.endTime} />
                </TableCell>
                <TableCell>
                  {formatHours(getDurationHours(displayedEntry.startTime, displayedEntry.endTime), 'short')}
                </TableCell>
                {showProject && projectsById && projectOptions && (
                  <TableCell>
                    <EditableSelect 
                      text={displayedEntry.projectId ? projectsById.get(displayedEntry.projectId)?.name ?? 'Unknown project' : ''} 
                      id={`project-select-${entry.id}`} 
                      value={displayedEntry.projectId ?? -1}
                      isEditing={editing} 
                      onChange={(newValue) => onUpdateField('projectId', Number(newValue))}>
                        {projectOptions.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                    </EditableSelect>
                    <Error message={rowErrors.projectId} />
                  </TableCell>
                )}
                {showEmployee && employeesById && employeeOptions && (
                  <TableCell>
                    <EditableSelect 
                      text={displayedEntry.employeeId ? employeesById.get(displayedEntry.employeeId)?.displayName ?? 'Unknown employee' : ''} 
                      id={`employee-select-${entry.id}`} 
                      value={displayedEntry.employeeId ?? -1}
                      isEditing={editing} 
                      onChange={(newValue) => onUpdateField('employeeId', Number(newValue))}>
                        {employeeOptions.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.displayName}
                          </option>
                        ))}
                    </EditableSelect>
                  </TableCell>
                )}
                {showInvoice && (
                  <TableCell>
                    <InvoiceNumberField
                      id={`invoice-number-${entry.id}`}
                      value={entry.invoiceNumber ?? null}
                      readOnly={!canEdit || isAnyEntryEditing}
                      onSave={(newInvoiceNumber) => handleSaveInvoice(entry, newInvoiceNumber)}
                    />
                  </TableCell>
                )}
                <TableCell className="max-w-xs truncate">
                  <EditableText
                    text={displayedEntry.workDescription ?? ''}
                    isEditing={editing}
                    onEdit={(newText) => onUpdateField('workDescription', newText)}
                  />
                  <Error message={rowErrors.workDescription} />
                </TableCell>
                {canEdit && 
                  <TableCell>
                    <EditDelete
                      isEditing={editing}
                      disabled={editingEntry !== null && !editing}
                      submitting={submitting}
                      onEdit={() => handleStartEditing(entry)}
                      onCancelEdit={handleCancelEditing}
                      onSave={handleEditSubmit}
                      onDelete={() => setDeletingEntry(entry)}
                    />
                    {editing && submitError && (
                      <p role="alert" className="text-sm text-red-700">
                        {submitError}
                      </p>
                    )}
                  </TableCell>
                }
              </TableRow>
            );
          })}
        </tbody>
      </Table>

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
              {showProject && projectsById && (projectsById.get(deletingEntry.projectId)?.name ?? 'Unknown project')}
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

