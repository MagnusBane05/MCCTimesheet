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
import { MaterialEntry, MaterialType, MaterialTypeCategory } from "../domain/material";
import { NewMaterialEntryInput } from "../services/TimesheetService";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { MaterialsList } from "../components/materials/MaterialsList";

export function EmployeeMaterialsPage() {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const {
		data: { projects, materialTypes, materialTypeCategories, materialEntries },
		loading,
		error,
		load,
	} = useLoad(async () => {
		const [projects, materialTypes, materialTypeCategories, materialEntries] = await Promise.all([
			timesheetService.getProjects(),
			timesheetService.getMaterialTypes(),
			timesheetService.getMaterialTypeCategories(),
			timesheetService.getMaterialEntries({}),
		]);
		return { projects, materialTypes, materialTypeCategories, materialEntries }
	}, [], {
		projects: [] as Project[],
		materialTypes: [] as MaterialType[],
		materialTypeCategories: [] as MaterialTypeCategory[],
		materialEntries: [] as MaterialEntry[],
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

	const projectEntries = useMemo(() => materialEntries.filter((entry) => entry.projectId === projectId), [materialEntries, projectId]);

	async function handleCreateEntry(input: NewMaterialEntryInput) {
		await timesheetService.createMaterialEntry(input);
		setIsCreateModalOpen(false);
		await load();
	}

	return (
		<div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-4">
			<div>
				<h2 className="rounded-t-md bg-lakehouse-900 p-2 text-center text-base font-semibold text-white">Project materials</h2>
				<div className="flex flex-col gap-4 rounded-b-md bg-white p-4 shadow-sm">
					<div className="grid gap-3 md:grid-cols-2">
						<SelectField
							id="customer"
							ariaLabel="Customer"
							value={customer}
							label="Customer"
							variant="large"
							onChange={(e) => selectCustomer(e.target.value)}
							pt={{container: "min-w-0"}}
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
							pt={{container: "min-w-0"}}
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
					{!loading && !error && !selectedProject && (
						<p className="rounded bg-cedar-500/10 px-3 py-6 text-center text-sm text-lakehouse-900/80">Please select a project to view the materials used for it.</p>
					)}
					{!loading && !error && selectedProject && <>
						{projectEntries.length === 0 ? (
							<p className="rounded bg-cedar-500/10 px-3 py-6 text-center text-sm text-lakehouse-900/80">No materials found for this project.</p>
						) : (
							<MaterialsList
								entries={projectEntries}
								materialTypes={materialTypes}
								materialTypeCategories={materialTypeCategories}
							/>
						)}
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
			</div>
		</div>
	);
}
