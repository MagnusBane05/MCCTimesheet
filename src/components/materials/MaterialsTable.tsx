import { ChangeEvent, useMemo, useState } from "react";
import { MaterialEntry, MaterialType, MaterialTypeCategory } from "../../domain/material";
import { timesheetService } from "../../services/service";
import { Project } from "../../domain/project";
import { SelectField } from "../form/SelectField";
import { Table, TableCell, TableHeader, TableRow } from "../common/Table";
import { useRowEditor } from "../../hooks/useRowEditor";
import { EditDelete } from "../common/EditDelete";
import { User } from "../../domain/user";
import { TextAreaField } from "../form/TextAreaField";
import { IntegerField } from "../form/IntegerField";
import { getMaterialsInCategory, getMaterialType, getMaterialTypeCategory, isMaterialTypeAvailable, MATERIAL_MIN_QUANTITY } from "../../utils/materials";
import { Error } from "../common/Error";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { useLoad } from "../../hooks/useLoad";
import { useAction } from "../../hooks/useAction";
import { LoadingState } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";

interface MaterialsTableProps {
	project: Project | undefined;
	materialTypes: MaterialType[];
	materialTypeCategories: MaterialTypeCategory[];
	showEnteredBy?: boolean;
	showActions?: boolean;
}

export function MaterialsTable({ 
	materialTypes, 
	materialTypeCategories, 
	project,
	showEnteredBy = false,
	showActions = false,
}: MaterialsTableProps) {
	const [deletingEntry, setDeletingEntry] = useState<MaterialEntry | null>(null);
	const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

	const {
		data: { materialEntries, employees },
		loading,
		error,
		load,
	} = useLoad(async () => {
		const [materialEntries, employees] = await Promise.all([
			timesheetService.getMaterialEntries({}),
			timesheetService.getEmployees(),
		]);
		return { materialEntries, employees };
	}, [], {
		materialEntries: [] as MaterialEntry[],
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

	const filteredMaterialEntries = useMemo(() => (
		project ? materialEntries.filter((entry) => entry.projectId === project.id) : []
	), [materialEntries, project]);
		

	const getEmployee = (id: number) => {
		return employees.find((employee) => employee.id === id);
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

	async function handleDeleteConfirm() {
		if (!deletingEntry) return;
		await remove.run(() => timesheetService.deleteMaterialEntry(deletingEntry.id), () => {
			if (isEditing(deletingEntry)) cancelEditing();
			setDeletingEntry(null);
		});
	}
	
	return (
		<div>	
			{loading && <LoadingState label="Loading material entries..." />}
			{!loading && error && <ErrorState message={error} onRetry={load} />}
			<Error message={save.error} />
			<Table rounded bordered>
				<thead>
					<tr>
						<TableHeader>Material type</TableHeader>
						<TableHeader>Material description</TableHeader>
						<TableHeader>Quantity</TableHeader>
						{showEnteredBy && <TableHeader>Entered by</TableHeader>}
						{showActions &&<TableHeader>Actions</TableHeader>}
					</tr>
				</thead>
				<tbody>
					{filteredMaterialEntries.length === 0 && (
						<tr>
							<td colSpan={3 + Number(showEnteredBy) + Number(showActions)} className="text-center">
								{project == null ? "Please select a project." 
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
								{showEnteredBy && (
									<TableCell>
										{employee?.displayName ?? "Unknown employee"}
									</TableCell>
								)}
								{showActions && (
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
		</div>
	);
}
