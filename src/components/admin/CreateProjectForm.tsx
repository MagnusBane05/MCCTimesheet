import { FormEvent, useState } from "react";
import { Button } from "../common/Button";
import { validateProject } from "../../utils/validation";
import { Error } from "../common/Error";
import { NewProjectInput } from "../../services/TimesheetService";
import { PRODUCTION_STATUS_LABELS, PRODUCTION_STATUSES, ProductionStatus } from "../../domain/project";
import { TextField } from "../form/TextField";
import { SelectField } from "../form/SelectField";
import { useAction } from "../../hooks/useAction";

export interface CreateProjectFormProps {
    onCreateProject: (project: NewProjectInput) => Promise<void>;
}

export function CreateProjectForm({ onCreateProject }: CreateProjectFormProps) {
    const [projectNumber, setProjectNumber] = useState('');
    const [name, setName] = useState('');
    const [customer, setCustomer] = useState('');
    const [productionStatus, setProductionStatus] = useState<ProductionStatus>('ON_DECK'); 
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const submit = useAction();

    const errors = validateProject({ projectNumber, name, customer });
    const visibleErrors = hasAttemptedSubmit ? errors : {};

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setHasAttemptedSubmit(true);
        if (Object.keys(errors).length > 0) return;
        await submit.run(() => onCreateProject({ 
                projectNumber, 
                name, 
                customer,
                active: true,
                productionStatus: productionStatus,
            }));
    };

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-row">
                <div className="flex-1">
                    <TextField
                        id="project-number" 
                        ariaLabel="Project Number"
                        label="Project Number" 
                        pt={{ container: "w-full" }} 
                        value={projectNumber} 
                        onChange={(e) => setProjectNumber(e.target.value)} 
                    />
                </div>
                <div className="flex-1">
                    <TextField
                        id="project-name" 
                        ariaLabel="Project Name"
                        label="Project Name" 
                        pt={{ container: "w-full" }} 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                    />
                </div>
            </div>
            <div className="flex flex-row">
                <div className="flex-1">
                    <TextField
                        id="project-customer" 
                        ariaLabel="Customer"
                        label="Customer" 
                        pt={{ container: "w-full" }} 
                        required
                        value={customer} 
                        onChange={(e) => setCustomer(e.target.value)} 
                        error={visibleErrors.customer}
                    />
                </div>
                <div className="flex-1">
                    <SelectField
                        id="project-production-status" 
                        ariaLabel="Production Status"
                        label="Production Status" 
                        pt={{ container: "w-full" }} 
                        selectClassName="w-56"
                        required
                        value={productionStatus} 
                        onChange={(e) => setProductionStatus(e.target.value as ProductionStatus)} 
                    >
                        {PRODUCTION_STATUSES.map((option: ProductionStatus) => (
                            <option key={option} value={option}>
                                {PRODUCTION_STATUS_LABELS[option]}
                            </option>
                        ))} 
                    </SelectField>
                </div>
            </div>
            <div className="w-full flex flex-col justify-stretch">
                <Error message={submit.error} />
                <Button type="submit" disabled={submit.pending}>
                    {submit.pending ? "Creating..." : "Create Project"}
                </Button>
            </div>
        </form>
    );
}
