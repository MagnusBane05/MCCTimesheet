import { Table, TableCell, TableHeader } from "../../components/common/Table";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { User, UserRole, USER_ROLES } from "../../domain/user";
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

export function EmployeesPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'inactive' | 'all'>('active');

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
  };

  function handleCancelEditing() {
    cancelEditing();
    setSaveError(null);
  }

  const filteredEmployees = employees.filter(employee => {
    if (filter === 'active') return employee.active;
    if (filter === 'inactive') return !employee.active;
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center justify-start gap-2">
          <Button variant={filter === "active" ? "primary" : "secondary"} onClick={() => setFilter('active')}>Active</Button>
          <Button variant={filter === "inactive" ? "primary" : "secondary"} onClick={() => setFilter('inactive')}>Inactive</Button>
          <Button variant={filter === "all" ? "primary" : "secondary"} onClick={() => setFilter('all')}>All</Button>
        </div>
        <div>
          <Button variant="primary" onClick={() => { /* TODO: Open create employee modal */ }}>+ Create Employee</Button>
        </div>
      </div>
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
              {isAdmin && <TableHeader/>}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="text-center text-navy-950/50">
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
                  {isAdmin && (
                    <TableCell>
                      <EditDelete
                        isEditing={editing}
                        onEdit={() => startEditing(employee)}
                        onCancelEdit={handleCancelEditing}
                        onSave={handleSave}
                      />
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
