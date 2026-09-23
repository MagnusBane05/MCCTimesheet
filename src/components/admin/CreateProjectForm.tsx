import { FormEvent, useState } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { validateProject } from "../../utils/validation";
import { Error } from "../common/Error";
import { NewProjectInput } from "../../services/TimesheetService";
import { PRODUCTION_STATUS_LABELS, PRODUCTION_STATUSES, ProductionStatus } from "../../domain/project";
import { Select } from "../common/Select";

export interface CreateProjectFormProps {
    onCreateProject: (project: NewProjectInput) => void;
}

export function CreateProjectForm({ onCreateProject }: CreateProjectFormProps) {
    const [projectNumber, setProjectNumber] = useState('');
    const [name, setName] = useState('');
    const [customer, setCustomer] = useState('');
    const [productionStatus, setProductionStatus] = useState<ProductionStatus>('ON_DECK'); 
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const errors = validateProject({ projectNumber, name, customer });
    const visibleErrors = hasAttemptedSubmit ? errors : {};

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setHasAttemptedSubmit(true);
        if (Object.keys(errors).length > 0) return;
        setSubmitting(true);
        setFormError(null);
        try {
            await onCreateProject({ 
                projectNumber, 
                name, 
                customer,
                active: true,
                productionStatus: productionStatus,
            });
        } catch (error) {
            setFormError((error as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-row">
                <div className="flex-1">
                    <Input 
                        type="text" 
                        label="Project Number" 
                        containerClassName="w-full" 
                        id="project-number" 
                        value={projectNumber} 
                        onChange={(e) => setProjectNumber(e.target.value)} 
                    />
                </div>
                <div className="flex-1">
                    <Input 
                        type="text" 
                        label="Project Name" 
                        containerClassName="w-full" 
                        id="project-name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                    />
                </div>
            </div>
            <div className="flex flex-row">
                <div className="flex-1">
                    <Input 
                        type="text" 
                        label="Customer" 
                        containerClassName="w-full" 
                        required
                        id="project-customer" 
                        value={customer} 
                        onChange={(e) => setCustomer(e.target.value)} 
                    />
                    <Error message={visibleErrors.customer} />
                </div>
                <div className="flex-1">
                    <Select
                        label="Production Status"
                        containerClassName="w-full"
                        selectClassName="w-56"
                        id="project-production-status" 
                        required
                        value={productionStatus} 
                        onChange={(e) => setProductionStatus(e.target.value as ProductionStatus)} 
                    >
                    {PRODUCTION_STATUSES.map((option: ProductionStatus) => (
                        <option key={option} value={option}>
                            {PRODUCTION_STATUS_LABELS[option]}
                        </option>
                    ))} 
                    </Select>
                </div>
            </div>
            <div className="w-full flex flex-col justify-stretch">
                {formError && <Error message={formError} />}
                <Button type="submit" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Project"}
                </Button>
            </div>
        </form>
    );
}