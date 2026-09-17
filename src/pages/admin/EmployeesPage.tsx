import { Table, TableCell, TableHeader } from "../../components/common/Table";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { User, UserRole, USER_ROLES, EmployeeCreationResult } from "../../domain/user";
import { timesheetService } from "../../services/service";
import { LoadingState } from "../../components/common/LoadingState";
import { ErrorState } from "../../components/common/ErrorState";
import { ActiveToggle } from "../../components/common/ActiveToggle";
import { EditDelete } from "../../components/common/EditDelete";
import { useRowEditor } from "../../hooks/useRowEditor";
import { EditableText } from "../../components/common/EditableText";
import { Error } from "../../components/common/Error";
import { EditableSelect } from "../../components/common/EditableSelect";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Badge } from "../../components/common/Badge";
import { CreateEmployeeForm } from "../../components/admin/CreateEmployeeForm";
import { EmployeeCreationSuccess } from "../../components/admin/EmployeeCreationSuccess";
import { ResetPasswordSuccess } from "../../components/admin/ResetPasswordSuccess";
import { NewEmployeeInput } from "../../services/TimesheetService";

type ModalState = 'create' | 'creation-success' | 'reset-success' | null;

interface ResetConfirmation {
  employeeId: number;
  username: string;
}

export function EmployeesPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [modalState, setModalState] = useState<ModalState>(null);
  const [creationResult, setCreationResult] = useState<EmployeeCreationResult | null>(null);
  const [resetResult, setResetResult] = useState<{ username: string; temporaryPassword: string } | null>(null);
  const [resetConfirmation, setResetConfirmation] = useState<ResetConfirmation | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const employeeList = await timesheetService.getEmployees();
      setEmployees(employeeList);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const {
    editingItem,
    startEditing,
    cancelEditing,
    updateField,
    isEditing
  } = useRowEditor<User>();

  async function handleSave() {
    if (!editingItem) return;
    try {
      await timesheetService.updateEmployee(editingItem.id, editingItem);
      cancelEditing();
      await load();
    } catch (e) {
      console.error("Failed to update employee:", e);
      setSaveError("Failed to update employee. Please try again.");
    }
  }

  function handleCancelEditing() {
    cancelEditing();
    setSaveError(null);
  }

  async function handleCreateEmployee(employeeInput: NewEmployeeInput) {
    try {
      const result = await timesheetService.createEmployee(employeeInput);
      setCreationResult(result);
      setModalState('creation-success');
    } catch (e) {
      console.error("Failed to create employee:", e);
      throw e;
    }
  }

  function handleResetPasswordClick(employeeId: number, username: string) {
    setResetConfirmation({ employeeId, username });
  }

  async function handleResetPasswordConfirm() {
    if (!resetConfirmation) return;
    try {
      const result = await timesheetService.resetEmployeePassword(resetConfirmation.employeeId);
      setResetResult({ username: resetConfirmation.username, temporaryPassword: result.temporaryPassword });
      setModalState('reset-success');
      setResetConfirmation(null);
      setResetError(null);
    } catch (e) {
      console.error("Failed to reset password:", e);
      setResetError("Failed to reset password. Please try again.");
    }
  }

  function handleResetPasswordCancel() {
    setResetConfirmation(null);
    setResetError(null);
  }

  function handleCreationDone() {
    setModalState(null);
    setCreationResult(null);
    load();
  }

  function handleResetDone() {
    setModalState(null);
    setResetResult(null);
    load();
  }

  const getModalTitle = () => {
    if (modalState === 'create') return 'Create Employee';
    if (modalState === 'creation-success') return 'Employee Created';
    if (modalState === 'reset-success') return 'Password Reset';
    return '';
  };

  const closeModal = () => {
    if (modalState === 'creation-success') {
      handleCreationDone();
    } else if (modalState === 'reset-success') {
      handleResetDone();
    } else {
      setModalState(null);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    if (filter === 'active') return employee.active;
    if (filter === 'inactive') return !employee.active;
    return true;
  });

  const anyHavePasswordChangeRequired = filteredEmployees.some(employee => employee.mustChangePassword);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center justify-start gap-2">
          <Button variant={filter === "active" ? "primary" : "secondary"} onClick={() => setFilter('active')}>Active</Button>
          <Button variant={filter === "inactive" ? "primary" : "secondary"} onClick={() => setFilter('inactive')}>Inactive</Button>
          <Button variant={filter === "all" ? "primary" : "secondary"} onClick={() => setFilter('all')}>All</Button>
        </div>
        <div>
          <Button variant="primary" onClick={() => setModalState('create')}>Create Employee</Button>
        </div>
      </div>

      <ConfirmDialog
        open={resetConfirmation !== null}
        title="Reset Password?"
        description={
          resetConfirmation && (
            <div>
              <p>Are you sure you want to reset the password for <strong>{resetConfirmation.username}</strong>?</p>
              <p className="mt-2 text-xs text-gray-600">A new temporary password will be generated and must be changed on next login.</p>
              {resetError && <Error message={resetError} />}
            </div>
          )
        }
        confirmLabel="Reset Password"
        cancelLabel="Cancel"
        onConfirm={handleResetPasswordConfirm}
        onCancel={handleResetPasswordCancel}
      />

      <Modal
        open={modalState !== null}
        title={getModalTitle()}
        onClose={closeModal}
      >
        {modalState === 'create' && (
          <CreateEmployeeForm onCreateEmployee={handleCreateEmployee} />
        )}
        {modalState === 'creation-success' && creationResult && (
          <EmployeeCreationSuccess result={creationResult} onDone={handleCreationDone} />
        )}
        {modalState === 'reset-success' && resetResult && (
          <ResetPasswordSuccess
            username={resetResult.username}
            temporaryPassword={resetResult.temporaryPassword}
            onDone={handleResetDone}
          />
        )}
      </Modal>

      {loading && <LoadingState label="Loading employees..." />}
      {!loading && error && <ErrorState message="Unable to load employees. Please try again." onRetry={load} />}

      {!loading && !error && (
        <Table striped rounded bordered>
          <thead>
            <tr>
              <TableHeader>Username</TableHeader>
              <TableHeader>Display Name</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Active</TableHeader>
              {anyHavePasswordChangeRequired && <TableHeader>Password Status</TableHeader>}
              {isAdmin && <TableHeader>Actions</TableHeader>}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="text-center text-navy-950/50">
                  No employees found.
                </td>
              </tr>
            )}
            {filteredEmployees.length > 0 && filteredEmployees.map((employee) => {
              const editing = isEditing(employee);
              const displayedEntry = editing ? editingItem ?? employee : employee;
              return (
                <tr key={employee.id}>
                  <TableCell>
                    <EditableText
                      text={displayedEntry.username}
                      isEditing={editing}
                      onEdit={(newText) => updateField('username', newText)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableText
                      text={displayedEntry.displayName}
                      isEditing={editing}
                      onEdit={(newText) => updateField('displayName', newText)}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableSelect
                      text={displayedEntry.role}
                      id={`role-select-${employee.id}`}
                      value={displayedEntry.role}
                      isEditing={editing}
                      onChange={(newValue) => updateField('role', newValue as UserRole)}
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </EditableSelect>
                  </TableCell>
                    <TableCell>
                      <ActiveToggle
                        active={displayedEntry.active}
                        editing={editing}
                        onToggle={(e) => updateField('active', e.target.value === 'Active')}>
                      </ActiveToggle>
                    </TableCell>
                  {anyHavePasswordChangeRequired && (
                  <TableCell>
                    {displayedEntry.mustChangePassword && (
                      <Badge variant="warning">Must Change Password</Badge>
                    )}
                  </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell>
                      {!editing && (
                        <div className="flex gap-2">
                          <EditDelete
                            isEditing={editing}
                            onEdit={() => startEditing(employee)}
                            onCancelEdit={handleCancelEditing}
                            onSave={handleSave}
                          />
                          <Button
                            variant="inline"
                            onClick={() => handleResetPasswordClick(employee.id, employee.username)}
                            className="text-xs px-2 py-1 rounded-full"
                          >
                            Reset Password
                          </Button>
                        </div>
                      )}
                      {editing && (
                        <EditDelete
                          isEditing={editing}
                          onEdit={() => startEditing(employee)}
                          onCancelEdit={handleCancelEditing}
                          onSave={handleSave}
                        />
                      )}
                      {editing && saveError && (
                        <Error message={saveError} />
                      )}
                    </TableCell>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
