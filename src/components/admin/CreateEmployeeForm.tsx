import { FormEvent, useState } from "react";
import { validateEmployee } from "../../utils/validation";
import { Button } from "../common/Button";
import { Error } from "../common/Error";
import { NewEmployeeInput } from "../../services/TimesheetService";
import { USER_ROLES, UserRole } from "../../domain/user";
import { SelectField } from "../form/SelectField";
import { TextField } from "../form/TextField";
import { useAction } from "../../hooks/useAction";

export interface CreateEmployeeFormProps {
    onCreateEmployee: (employee: NewEmployeeInput) => Promise<void>;
}

export function CreateEmployeeForm({ onCreateEmployee }: CreateEmployeeFormProps) {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<UserRole>('EMPLOYEE');
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const submit = useAction();

    const errors = validateEmployee({ username, displayName, role });
    const visibleErrors = hasAttemptedSubmit ? errors : {};

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setHasAttemptedSubmit(true);
        if (Object.keys(errors).length > 0) return;
        await submit.run(() => onCreateEmployee({
                username,
                displayName,
                role,
                active: true,
            }));
    }

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-row">
                    <SelectField
                        id="employee-role"
                        ariaLabel="Role"
                        label="Role"
                        required
                        value={role}
                        pt={{container: "w-full"}}
                        className="w-full"
                        onChange={(e) => setRole(e.target.value as UserRole)}
                    >
                        {USER_ROLES.map((option: UserRole) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </SelectField>
                    <div className="flex-1 min-w-64"></div>
                </div>
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
                <Error message={submit.error} />
                <Button type="submit" disabled={submit.pending}>
                    {submit.pending ? "Creating..." : "Create Employee"}
                </Button>
            </div>
        </form>
    );
}
