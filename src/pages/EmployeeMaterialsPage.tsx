import { useMemo, useState } from "react";
import { useCustomerProjectSelection } from "../hooks/useCustomerProjectSelection";
import { useLoad } from "../hooks/useLoad";
import { timesheetService } from "../services/service";
import { SelectField } from "../components/form/SelectField";
import { getProjectDisplayName } from "../utils/projects";
import { Button } from "../components/common/Button";
import { PlusIcon } from "@heroicons/react/24/solid";
import { MaterialEntryForm } from "../components/materials/MaterialEntryForm";
import { Modal } from "../components/common/Modal";
import { Project } from "../domain/project";
import { MaterialType, MaterialTypeCategory } from "../domain/material";
import { NewMaterialEntryInput } from "../services/TimesheetService";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { MaterialsTable } from "../components/materials/MaterialsTable";

export function EmployeeMaterialsPage() {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const {
		data: { projects, materialTypes, materialTypeCategories },
		loading,
		error,
		load,
	} = useLoad(async () => {
		const [projects, materialTypes, materialTypeCategories] = await Promise.all([
			timesheetService.getProjects(),
			timesheetService.getMaterialTypes(),
			timesheetService.getMaterialTypeCategories(),
		]);
		return { projects, materialTypes, materialTypeCategories }
	}, [], {
		projects: [] as Project[],
		materialTypes: [] as MaterialType[],
		materialTypeCategories: [] as MaterialTypeCategory[]
	});

	const activeProjects = useMemo(() => projects.filter((project) => project.active), [projects]);

	const {
		customer,
		projectId,
		customerOptions,
		projectOptions,
		selectCustomer,
		setProjectId,
	} = useCustomerProjectSelection(activeProjects);	

	const selectedProject = useMemo(() => projects.find((project) => project.id === projectId), [projects, projectId]);

	async function handleCreateEntry(input: NewMaterialEntryInput) {
		await timesheetService.createMaterialEntry(input);
		setIsCreateModalOpen(false);
		await load();
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col sm:flex-row sm:justify-between gap-2 w-full">
				<SelectField
					id="customer"
					ariaLabel="Customer"
					value={customer}
					label="Customer"
					variant="large"
					onChange={(e) => selectCustomer(e.target.value)}
					pt={{container: "w-full sm:w-1/2"}}
					selectClassName="w-full"
				>
					<option key="" value="">{customerOptions.length === 0 ? "No projects available" : "Select a customer..."}</option>
					{customerOptions.map((customer) => (
						<option key={customer} value={customer}>
							{customer}
						</option>
					))}
				</SelectField>
				<SelectField
				id="project"
					ariaLabel="Project"
					value={projectId ?? ''}
					label="Project"
					variant="large"
					pt={{container: "w-full sm:w-1/2"}}
					selectClassName="w-full"
					onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
					disabled={projectOptions.length <= 1}
				>
					{projectOptions.length === 0 && <option key="" value="">Select a customer first</option>}
					{projectOptions.length > 1 && <option key="" value="">Select a project...</option>}
					{projectOptions.map((project) => (
						<option key={project.id} value={project.id}>
							{project.projectNumber ? `(${project.projectNumber}) ` : ''}{getProjectDisplayName(project)}
						</option>
					))}
				</SelectField>
			</div>
			{loading && <LoadingState label="Loading material entries..." />}
			{!loading && error && <ErrorState message={error} onRetry={load} />}
			{!loading && !error && !selectedProject && <span>Please select a project to view the materials used for it.</span>}
			{!loading && !error && selectedProject && <>
				<MaterialsTable 
					project={selectedProject} 
					materialTypes={materialTypes} 
					materialTypeCategories={materialTypeCategories}					
				/>
				<Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
					<PlusIcon className="h-4 w-4" /> Add Entry
				</Button>
				<Modal open={isCreateModalOpen} title="New Material Entry" onClose={() => setIsCreateModalOpen(false)}>
					<MaterialEntryForm
						categories={materialTypeCategories}
						materials={materialTypes}
						project={selectedProject}
						onCreateEntry={handleCreateEntry}
					/>
				</Modal>
			</>}
		</div>
	);
}
