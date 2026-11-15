import { ChangeEvent, useMemo, useState } from "react";
import { MaterialEntry, MaterialType, MaterialTypeCategory } from "../../domain/material";
import { timesheetService } from "../../services/service";
import { LoadingState } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";
import { Project } from "../../domain/project";
import { getProjectDisplayName } from "../../utils/projects";
import { SelectField } from "../form/SelectField";
import { Table, TableCell, TableHeader, TableRow } from "../common/Table";
import { CheckboxField } from "../form/CheckboxField";
import { useRowEditor } from "../../hooks/useRowEditor";
import { useAuth } from "../../auth/useAuth";
import { EditDelete } from "../common/EditDelete";
import { User } from "../../domain/user";
import { TextAreaField } from "../form/TextAreaField";
import { IntegerField } from "../form/IntegerField";
import { getMaterialsInCategory, getMaterialType, getMaterialTypeCategory, isMaterialTypeAvailable, MATERIAL_MIN_QUANTITY } from "../../utils/materials";
import { NewMaterialEntryInput } from "../../services/TimesheetService";
import { Error } from "../common/Error";
import { Button } from "../common/Button";
import { PlusIcon } from "@heroicons/react/24/solid";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { Modal } from "../common/Modal";
import { MaterialEntryForm } from "./MaterialEntryForm";
import { useLoad } from "../../hooks/useLoad";
import { useAction } from "../../hooks/useAction";
import { useCustomerProjectSelection } from "../../hooks/useCustomerProjectSelection";

interface MaterialsTableProps {
	materialTypes: MaterialType[];
	materialTypeCategories: MaterialTypeCategory[];
}

export function MaterialsTable({ materialTypes, materialTypeCategories }: MaterialsTableProps) {
	const { currentUser } = useAuth();
	const isAdmin = currentUser?.role === 'ADMIN';

	const [showInactiveProjects, setShowInactiveProjects] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [deletingEntry, setDeletingEntry] = useState<MaterialEntry | null>(null);
	const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

	const {
		data: { materialEntries, projects, employees },
		loading,
		error,
		load,
	} = useLoad(async () => {
		const [materialEntries, projects, employees] = await Promise.all([
			timesheetService.getMaterialEntries({}),
			timesheetService.getProjects(),
			timesheetService.getEmployees(),
		]);
		return { materialEntries, projects, employees };
	}, [], {
		materialEntries: [] as MaterialEntry[],
		projects: [] as Project[],
		employees: [] as User[],
	});
	const remove = useAction(load);
	const save = useAction(load);

	const {
		editingItem,
		startEditing,
		cancelEditing,
		updateField,
		isEditing,
	} = useRowEditor<MaterialEntry>();

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

	const filteredMaterialEntries = useMemo(
		() => materialEntries.filter((entry) => entry.projectId === projectId),
		[materialEntries, projectId])

	const getEmployee = (id: number) => {
		return employees.find((employee) => employee.id === id);
	}

	function handleToggleActiveProjects(event: ChangeEvent<HTMLInputElement>) {
		const showInactive = event.target.checked;
		setShowInactiveProjects(showInactive);
		if (!showInactive) syncToProjects(projects.filter((project) => project.active));
	}

	const originalEditingType = useMemo(() => {
		const original = editingItem ? materialEntries.find((entry) => entry.id === editingItem.id) : undefined;
		return original ? getMaterialType(materialTypes, original.materialType) : undefined;
	}, [editingItem, materialEntries, materialTypes]);

	const editCategoryOptions = useMemo(
		() => materialTypeCategories.filter((category) => category.active || category.id === originalEditingType?.category),
		[materialTypeCategories, originalEditingType]);

	const getEditTypeOptions = (categoryId: number | null) => categoryId == null ? [] :
		getMaterialsInCategory(materialTypes, categoryId)
			.filter((type) => isMaterialTypeAvailable(type, materialTypeCategories) || type.id === originalEditingType?.id);
	const editTypeOptions = getEditTypeOptions(editingCategoryId);

	function handleStartEdit(entry: MaterialEntry) {
		save.setError(null);
		startEditing(entry);
		setEditingCategoryId(getMaterialType(materialTypes, entry.materialType)?.category ?? null);
	}

	function handleEditCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
		const categoryId = event.target.value ? Number(event.target.value) : null;
		setEditingCategoryId(categoryId);
		const options = getEditTypeOptions(categoryId);
		updateField('materialType', options.length === 1 ? options[0].id : NaN);
	}

	function handleCancel() {
		cancelEditing();
		save.setError(null);
	}

	async function handleSave() {
		if (!editingItem) return;
		const description = editingItem.description.trim();
		if (!description) {
			save.setError("Description cannot be empty.");
			return;
		}
		if (Number.isNaN(editingItem.materialType)) {
			save.setError("Select a material type.");
			return;
		}
		if (!Number.isInteger(editingItem.quantity) || editingItem.quantity < MATERIAL_MIN_QUANTITY) {
			save.setError(`Quantity must be at least ${MATERIAL_MIN_QUANTITY}.`);
			return;
		}
		await save.run(
			() => timesheetService.updateMaterialEntry(editingItem.id, {
				type: editingItem.materialType,
				description,
				quantity: editingItem.quantity,
			}),
			cancelEditing,
		);
	}

	async function handleCreateEntry(input: NewMaterialEntryInput) {
		await timesheetService.createMaterialEntry(input);
		setIsCreateModalOpen(false);
		await load();
	}

	async function handleDeleteConfirm() {
		if (!deletingEntry) return;
		await remove.run(() => timesheetService.deleteMaterialEntry(deletingEntry.id), () => {
			if (isEditing(deletingEntry)) cancelEditing();
			setDeletingEntry(null);
		});
	}
	
	return (
		<div className="flex flex-col gap-2">
			{loading && <LoadingState label="Loading material entries..." />}
			{!loading && error && <ErrorState message={error} onRetry={load} />}
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
			<Error message={save.error} />
			<Table rounded bordered>
				<thead>
					<tr>
						<TableHeader>Material type</TableHeader>
						<TableHeader>Material description</TableHeader>
						<TableHeader>Quantity</TableHeader>
						<TableHeader>Entered by</TableHeader>
						{isAdmin &&<TableHeader>Actions</TableHeader>}
					</tr>
				</thead>
				<tbody>
					{filteredMaterialEntries.length === 0 && (
						<tr>
							<td colSpan={isAdmin ? 5 : 4} className="text-center">
								{projectId == null ? "Please select a project." 
								: "No materials found for this project."}
							</td>
						</tr>
					)}
					{filteredMaterialEntries.length > 0 && filteredMaterialEntries.map((entry) => {
						const materialType = getMaterialType(materialTypes, entry.materialType);
						const materialTypeCategory = materialType ? getMaterialTypeCategory(materialTypeCategories, materialType.category) : undefined;
						const employee = getEmployee(entry.employeeId);
						const editing = isEditing(entry);
						const displayedEntry = editing ? editingItem ?? entry : entry;
						return (
							<TableRow key={entry.id}>
								<TableCell>
									{editing ? (
										<div className="flex flex-col gap-1">
											<SelectField
												id={`entry-${entry.id}-category`}
												ariaLabel="Category"
												variant="inline"
												value={editingCategoryId ?? ''}
												disabled={save.pending}
												onChange={handleEditCategoryChange}
											>
												<option key="" value="">Select a category...</option>
												{editCategoryOptions.map((category) => (
													<option key={category.id} value={category.id}>
														{category.name}{category.active ? '' : ' (expired)'}
													</option>
												))}
											</SelectField>
											<SelectField
												id={`entry-${entry.id}-type`}
												ariaLabel="Material"
												variant="inline"
												value={Number.isNaN(displayedEntry.materialType) ? '' : displayedEntry.materialType}
												disabled={save.pending || editTypeOptions.length === 0}
												onChange={(e) => updateField('materialType', e.target.value ? Number(e.target.value) : NaN)}
											>
												{editTypeOptions.length === 0 && <option key="" value="">{editingCategoryId == null ? "Select a category first" : "No materials in this category"}</option>}
												{editTypeOptions.length > 1 && <option key="" value="">Select a material type...</option>}
												{editTypeOptions.map((type) => (
													<option key={type.id} value={type.id}>
														{type.name}{isMaterialTypeAvailable(type, materialTypeCategories) ? '' : ' (expired)'}
													</option>
												))}
											</SelectField>
										</div>
									) : (
										<div>{materialType?.name}  &#x2022; <span className="italic text-lakehouse-900/60">{materialTypeCategory?.name}</span></div>
									)}
								</TableCell>
								<TableCell>
									<TextAreaField 
										id={`entry-${entry.id}-desc`} 
										ariaLabel="Description" 
										value={displayedEntry.description}
										readOnly={!editing}
										onChange={(e) => updateField('description', e.target.value)}
									/>
								</TableCell>
								<TableCell>
									<IntegerField 
										id={`entry-${entry.id}-quantity`}
										ariaLabel="Quantity"
										readOnly={!editing}
										min={MATERIAL_MIN_QUANTITY}
										value={Number.isNaN(displayedEntry.quantity) ? '' : displayedEntry.quantity}
										onChange={(e) => updateField('quantity', e.target.valueAsNumber)}
									/>
								</TableCell>
								<TableCell>{employee?.displayName ?? "Unknown employee"}</TableCell>
								{isAdmin && (
									<TableCell>
										<EditDelete
											isEditing={editing}
											submitting={save.pending}
											onEdit={() => handleStartEdit(entry)}
											onCancelEdit={handleCancel}
											onSave={handleSave}
											onDelete={() => setDeletingEntry(entry)}
										/>
									</TableCell>
								)}
							</TableRow>
						);
					})}
				</tbody>
			</Table>
			<ConfirmDialog
				open={!!deletingEntry}
				title="Delete this material entry?"
				description="This cannot be undone."
				confirmLabel="Delete"
				busy={remove.pending}
				error={remove.error}
				onConfirm={handleDeleteConfirm}
				onCancel={() => { setDeletingEntry(null); remove.setError(null); }}
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
		</div>
	);
}
