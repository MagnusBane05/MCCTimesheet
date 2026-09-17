import { FormEvent, useState } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Error } from "../common/Error";
import { NewEmployeeInput } from "../../services/TimesheetService";
import { USER_ROLES, UserRole } from "../../domain/user";
import { Select } from "../common/Select";

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
                <Select
                    label="Role"
                    containerClassName="w-full"
                    id="employee-role"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                >
                    {USER_ROLES.map((option: UserRole) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </Select>
                <div className="flex flex-row">
                    <div className="flex-1">
                        <Input
                            type="text"
                            label="Username"
                            containerClassName="w-full"
                            required
                            id="employee-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <Error message={visibleErrors.username} />
                    </div>
                    <div className="flex-1">
                        <Input
                            type="text"
                            label="Display Name"
                            containerClassName="w-full"
                            required
                            id="employee-display-name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                        <Error message={visibleErrors.displayName} />
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
