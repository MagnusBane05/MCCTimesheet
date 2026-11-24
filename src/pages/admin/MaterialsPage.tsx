import { PlusIcon } from "@heroicons/react/16/solid";
import { MaterialTypeTable } from "../../components/admin/MaterialTypeTable";
import { Button } from "../../components/common/Button";
import { ErrorState } from "../../components/common/ErrorState";
import { LoadingState } from "../../components/common/LoadingState";
import { Title } from "../../components/common/Title";
import { CheckboxField } from "../../components/form/CheckboxField";
import { SelectField } from "../../components/form/SelectField";
import { MaterialsTable } from "../../components/materials/MaterialsTable";
import { MaterialType, MaterialTypeCategory } from "../../domain/material";
import { useLoad } from "../../hooks/useLoad";
import { timesheetService } from "../../services/service";
import { Modal } from "../../components/common/Modal";
import { MaterialEntryForm } from "../../components/materials/MaterialEntryForm";
import { NewMaterialEntryInput } from "../../services/TimesheetService";
import { ChangeEvent, useMemo, useState } from "react";
import { Project } from "../../domain/project";
import { useCustomerProjectSelection } from "../../hooks/useCustomerProjectSelection";
import { getProjectDisplayName } from "../../utils/projects";
import { useAuth } from "../../auth/useAuth";

export function MaterialsPage() {
	const { currentUser } = useAuth();
	const isAdmin = currentUser?.role === 'ADMIN';
	const isEmployee = currentUser?.role === 'EMPLOYEE';
	const [showInactiveProjects, setShowInactiveProjects] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const { data: { materialTypes, materialTypeCategories, projects }, loading, error, load } = useLoad(async () => {
		const [materialTypes, materialTypeCategories, projects] = await Promise.all([
			timesheetService.getMaterialTypes(),
			timesheetService.getMaterialTypeCategories(),
			timesheetService.getProjects(),
		]);
		return { materialTypes, materialTypeCategories, projects };
	}, [], {
		materialTypes: [] as MaterialType[], 
		materialTypeCategories: [] as MaterialTypeCategory[],
		projects: [] as Project[],
	});

	const filteredProjects = useMemo(() => showInactiveProjects ? projects : projects.filter((project) => project.active)
		, [showInactiveProjects, projects]);

	const {
		customer,
		projectId,
		customerOptions,
		projectOptions,
		selectCustomer,
		setProjectId,
		syncToProjects,
	} = useCustomerProjectSelection(filteredProjects);

	const selectedProject = useMemo(() => projects.find((project) => project.id === projectId), [projects, projectId]);

	function handleToggleActiveProjects(event: ChangeEvent<HTMLInputElement>) {
		const showInactive = event.target.checked;
		setShowInactiveProjects(showInactive);
		if (!showInactive) syncToProjects(projects.filter((project) => project.active));
	}

	async function handleCreateEntry(input: NewMaterialEntryInput) {
		await timesheetService.createMaterialEntry(input);
		setIsCreateModalOpen(false);
		await load();
	}

	return (
		<div>
			<Title>Material entries</Title>
			<div className="flex flex-col gap-2">
				{loading && <LoadingState label="Loading materials..." />}
				{!loading && error && <ErrorState message={error} onRetry={load} />}
				{!loading && !error && <>
				<div className="flex justify-between">
					<div className="flex flex-row gap-2 items-end">
						<SelectField
							id="customer"
							ariaLabel="Customer"
							value={customer}
							label="Customer"
							onChange={(e) => selectCustomer(e.target.value)}
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
						<CheckboxField 
							id="inactive-projects"
							ariaLabel="Inactive Projects Toggle"
							label="Show inactive projects"
							checked={showInactiveProjects}
							onChange={handleToggleActiveProjects}
							pt={{
								container: "pb-2"
							}}
						/>
					</div>
					{isAdmin && (
						<Button className="h-fit self-end" variant="primary" disabled={!selectedProject} onClick={() => setIsCreateModalOpen(true)} >
							<PlusIcon className="h-4 w-4" /> Create Material Entry
						</Button>
					)}	
				</div>	
				<MaterialsTable 
					materialTypes={materialTypes} 
					materialTypeCategories={materialTypeCategories} 
					project={selectedProject}
					showEnteredBy={!isEmployee}
					showActions={isAdmin}
				/>
				<Modal open={isCreateModalOpen} title="New Material Entry" onClose={() => setIsCreateModalOpen(false)}>
					{selectedProject && (
						<MaterialEntryForm
							categories={materialTypeCategories}
							materials={materialTypes}
							project={selectedProject}
							onCreateEntry={handleCreateEntry}
						/>
					)}
				</Modal>
				</>}
			</div>
			<Title className="pt-6">Material types</Title>
			<MaterialTypeTable
				materialTypes={materialTypes}
				materialTypeCategories={materialTypeCategories}
				loading={loading}
				error={error}
				onReload={load}
			/>
		</div>
	);
}
