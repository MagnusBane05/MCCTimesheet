import { FormEvent, useState } from "react";
import { Button } from "../common/Button";
import { Error } from "../common/Error";
import { NewEmployeeInput } from "../../services/TimesheetService";
import { USER_ROLES, UserRole } from "../../domain/user";
import { SelectField } from "../form/SelectField";
import { TextField } from "../form/TextField";

export interface CreateEmployeeFormProps {
    onCreateEmployee: (employee: NewEmployeeInput) => void;
}

function validateEmployeeForm(data: { username: string; displayName: string; role: UserRole }) {
    const errors: Partial<Record<keyof typeof data, string>> = {};
    if (!data.username?.trim()) {
        errors.username = "Username is required";
    }
    if (!data.displayName?.trim()) {
        errors.displayName = "Display name is required";
    }
    return errors;
}

export function CreateEmployeeForm({ onCreateEmployee }: CreateEmployeeFormProps) {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<UserRole>('EMPLOYEE');
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const errors = validateEmployeeForm({ username, displayName, role });
    const visibleErrors = hasAttemptedSubmit ? errors : {};

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setHasAttemptedSubmit(true);
        if (Object.keys(errors).length > 0) return;
        setSubmitting(true);
        setFormError(null);
        try {
            await onCreateEmployee({
                username,
                displayName,
                role,
                active: true,
            });
        } catch (error) {
            setFormError((error as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
                <SelectField
                    id="employee-role"
                    ariaLabel="Role"
                    label="Role"
                    required
                    value={role}
                    pt={{container: "w-full"}}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                >
                    {USER_ROLES.map((option: UserRole) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </SelectField>
                <div className="flex flex-row">
                    <div className="flex-1">
                        <TextField
                            id="employee-username"
                            ariaLabel="Username"
                            label="Username"
                            required
                            value={username}
                            error={visibleErrors.username}
                            pt={{container: "w-full"}}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <TextField
                            id="employee-display-name"
                            ariaLabel="Display Name"
                            label="Display Name"
                            required
                            value={displayName}
                            error={visibleErrors.displayName}
                            pt={{container: "w-full"}}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="w-full flex flex-col justify-stretch">
                {formError && <Error message={formError} />}
                <Button type="submit" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Employee"}
                </Button>
            </div>
        </form>
    );
}
