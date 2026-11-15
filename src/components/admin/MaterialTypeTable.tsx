import { useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { MaterialType, MaterialTypeCategory } from "../../domain/material";
import { timesheetService } from "../../services/service";
import { formatError } from "../../utils/errors";
import { LoadingState } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";
import { formatMaterialTypes, getMaterialsInCategory } from "../../utils/materials";
import { IconButton } from "../common/IconButton";
import { PlusCircleIcon, PlusIcon } from "@heroicons/react/24/solid";
import { Button } from "../common/Button";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { EditDelete } from "../common/EditDelete";
import { useRowEditor } from "../../hooks/useRowEditor";
import { TextField } from "../form/TextField";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EditableCard } from "../common/EditableCard";
import { CheckboxField } from "../form/CheckboxField";
import { useAction } from "../../hooks/useAction";

interface TypeDraft {
	id: number;
	name: string;
	expired: boolean;
}

interface NewTypeDraft {
	categoryId: number;
	name: string;
}

interface MaterialTypeTableProps {
	materialTypes: MaterialType[];
	materialTypeCategories: MaterialTypeCategory[];
	loading: boolean;
	error: string | null;
	onReload: () => Promise<void>;
}

export function MaterialTypeTable({ materialTypes, materialTypeCategories, loading, error, onReload: load }: MaterialTypeTableProps) {
	const { currentUser } = useAuth();
	const isAdmin = currentUser?.role === 'ADMIN';

	const [expiringCategory, setExpiringCategory] = useState<MaterialTypeCategory | null>(null);
	const [typeDrafts, setTypeDrafts] = useState<TypeDraft[]>([]);
	const [newType, setNewType] = useState<NewTypeDraft | null>(null);
	const [showExpired, setShowExpired] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState<string | null>(null);

	const save = useAction(load);

	const {
		editingItem,
		startEditing,
		cancelEditing,
		updateField,
		isEditing,
	} = useRowEditor<MaterialTypeCategory>();

	const visibleCategories = showExpired
		? materialTypeCategories
		: materialTypeCategories.filter((category) => category.active);
	const getActiveTypesInCategory = (categoryId: number) =>
		getMaterialsInCategory(materialTypes, categoryId).filter((type) => type.active);
	const getExpiredTypesInCategory = (categoryId: number) =>
		getMaterialsInCategory(materialTypes, categoryId).filter((type) => !type.active);

	async function handleExpireConfirm() {
		if (!expiringCategory) return;
		await save.run(() => timesheetService.updateMaterialTypeCategory(expiringCategory.id, { active: false }), () => {
			if (isEditing(expiringCategory)) handleCancelEdit();
			setExpiringCategory(null);
		});
	}

	function handleStartEdit(category: MaterialTypeCategory) {
		save.setError(null);
		setNewType(null);
		setNewCategoryName(null);
		startEditing(category);
		setTypeDrafts(
			getActiveTypesInCategory(category.id)
				.map(({ id, name }) => ({ id, name, expired: false }))
		);
	}

	function handleCancelEdit() {
		cancelEditing();
		setTypeDrafts([]);
		save.setError(null);
	}

	function updateTypeDraft(id: number, patch: Partial<TypeDraft>) {
		setTypeDrafts((drafts) => drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
	}
	
	function createRequests(original: MaterialTypeCategory, updated: MaterialTypeCategory) {
		const categoryName = updated.name.trim();
		const requests: Promise<unknown>[] = [];
		if (categoryName !== original.name) {
			requests.push(timesheetService.updateMaterialTypeCategory(original.id, { name: categoryName }));
		}
		for (const draft of typeDrafts) {
			const originalType = materialTypes.find((type) => type.id === draft.id);
			if (!originalType) continue;
			if (draft.expired) {
				requests.push(timesheetService.updateMaterialType(draft.id, { active: false }));
			} else if (draft.name.trim() !== originalType.name) {
				requests.push(timesheetService.updateMaterialType(draft.id, { name: draft.name.trim() }));
			}
		}
		return requests;
	}

	function hasEmptyName(category: MaterialTypeCategory, drafts: TypeDraft[]) {
		return !category.name.trim() || drafts.some((draft) => !draft.name.trim());
	}

	async function handleSaveCategory(original: MaterialTypeCategory) {
		if (!editingItem) return;

		const keptTypes = typeDrafts.filter((draft) => !draft.expired);
		if (hasEmptyName(editingItem, keptTypes)) {
			save.setError("Names cannot be empty.");
			return;
		}

		await save.run(async () => {
			const results = await Promise.allSettled(createRequests(original, editingItem));
			const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
			if (failures.length > 0) {
				if (failures.length < results.length) await load();
				throw new Error(failures.map((failure) => formatError(failure.reason)).join(" "));
			}
		}, handleCancelEdit);
	}

	function handleStartCreateCategory() {
		handleCancelEdit();
		setNewType(null);
		setNewCategoryName("");
	}

	function handleCancelCreateCategory() {
		setNewCategoryName(null);
		save.setError(null);
	}

	async function handleCreateCategory() {
		if (newCategoryName === null) return;
		const name = newCategoryName.trim();
		if (!name) {
			save.setError("Names cannot be empty.");
			return;
		}
		await save.run(() => timesheetService.createMaterialTypeCategory({ name }), () => setNewCategoryName(null));
	}

	function handleStartCreateType(category: MaterialTypeCategory) {
		save.setError(null);
		setNewType({ categoryId: category.id, name: "" });
	}

	async function handleCreateType() {
		if (!newType) return;
		const name = newType.name.trim();
		if (!name) {
			setNewType(null);
			return;
		}

		await save.run(() => timesheetService.createMaterialType({ category: newType.categoryId, name }), () => setNewType(null));
	}

	return (
		<div>
			{loading && <LoadingState label="Loading material types..." />}
			{!loading && error && <ErrorState message={error} onRetry={load} />}
			{isAdmin &&
				<div className="flex justify-between items-end pb-2">
					<CheckboxField
						id="show-expired-material-types"
						ariaLabel="Show expired material types"
						label="Show expired"
						checked={showExpired}
						onChange={(e) => setShowExpired(e.target.checked)}
					/>
					<Button
						className="h-fit"
						variant="primary"
						disabled={save.pending || newCategoryName !== null}
						onClick={handleStartCreateCategory}
					>
						<PlusIcon className="h-4 w-4" /> Create Material Category
					</Button>
				</div>
			}
			{save.error && <p role="alert" className="mb-2 text-sm text-red-700">{save.error}</p>}
			{!loading && !error && visibleCategories.length === 0 && newCategoryName === null &&
				<p className="text-sm text-lakehouse-900/60">
					{materialTypeCategories.length === 0 ? "No material type categories yet." : "All categories are expired."}
				</p>
			}
			{!loading && (visibleCategories.length > 0 || newCategoryName !== null) &&
			<div className="flex flex-col gap-2">
				{newCategoryName !== null &&
					<div className="flex justify-between border border-lakehouse-900/20 bg-white rounded-lg p-2 gap-4">
						<div className="font-bold text-midnight-950">
							<TextField
								id="new-category-name"
								ariaLabel="New material category name"
								variant="inline"
								style={{"fieldSizing": "content"}}
								placeholder="Category name"
								autoFocus
								disabled={save.pending}
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleCreateCategory();
									if (e.key === 'Escape') handleCancelCreateCategory();
								}}
							/>
						</div>
						<EditDelete
							isEditing
							submitting={save.pending}
							onEdit={() => {}}
							onCancelEdit={handleCancelCreateCategory}
							onSave={handleCreateCategory}
						/>
					</div>
				}
				{visibleCategories.map((category) => {
					const categoryTypes = getActiveTypesInCategory(category.id);
					const categoryTypesString = formatMaterialTypes(categoryTypes);
					const expiredTypes = showExpired ? getExpiredTypesInCategory(category.id) : [];
					const editing = isEditing(category);
					const displayCategory = editing ? editingItem : category;
					const creatingHere = newType?.categoryId === category.id;
					return (
						<div
							key={category.id}
							className={`flex justify-between border border-lakehouse-900/20 bg-white rounded-lg p-2 gap-4 ${category.active ? '' : 'opacity-60'}`}
						>
							<div className="flex gap-2">
								<div className="font-bold text-midnight-950">
									<TextField
										id={`category-${category.id}-name`}
										ariaLabel="Name"
										readOnly={!editing}
										variant="inline"
										style={{"fieldSizing": "content"}}
										value={displayCategory?.name ?? ''}
										readOnlyContent={`${displayCategory?.name ?? 'Unnamed category'}${category.active ? '' : ' (expired)'}:`}
										onChange={(e) => updateField('name', e.target.value)}
									/>
								</div>
								<div className="flex gap-1 text-lakehouse-900/60">
									{editing ?
										typeDrafts
											.filter((draft) => !draft.expired)
											.map((draft) => (
												<EditableCard
													key={draft.id}
													content={draft.name}
													ariaLabel="Material type name"
													deleteLabel={`Expire ${draft.name}`}
													disabled={save.pending}
													onChange={(e) => updateTypeDraft(draft.id, { name: e.target.value })}
													onDelete={() => updateTypeDraft(draft.id, { expired: true })}
												/>
											))
									 :
									categoryTypesString}
									{!editing && expiredTypes.map((type) => (
										<span
											key={type.id}
											className="flex items-center gap-1 rounded-full border border-dashed px-2 line-through"
										>
											{type.name}
											{isAdmin &&
												<IconButton
													icon={ArrowUturnLeftIcon}
													className="w-3 h-auto text-midnight-950"
													aria-label={`Restore ${type.name}`}
													disabled={save.pending}
													onClick={() => save.run(() => timesheetService.updateMaterialType(type.id, { active: true }))}
												/>
											}
										</span>
									))}
								</div>
								{isAdmin && category.active && !editing && (creatingHere ?
									<EditableCard
										content={newType.name}
										ariaLabel="New material type name"
										deleteLabel="Cancel"
										autoFocus
										disabled={save.pending}
										onChange={(e) => setNewType({ categoryId: category.id, name: e.target.value })}
										onSave={handleCreateType}
										onCancel={() => setNewType(null)}
										onDelete={() => setNewType(null)}
									/>
									:
									<IconButton
										icon={PlusCircleIcon}
										className="text-pine-400"
										aria-label={`Add material type to ${category.name}`}
										disabled={save.pending}
										onClick={() => handleStartCreateType(category)}
									/>
								)}
							</div>
							<div>
								{isAdmin && !category.active &&
									<IconButton
										icon={ArrowUturnLeftIcon}
										className="p-1 hover:bg-midnight-950/10 hover:rounded"
										aria-label={`Restore ${category.name}`}
										disabled={save.pending}
										onClick={() => save.run(() => timesheetService.updateMaterialTypeCategory(category.id, { active: true }))}
									/>
								}
								{isAdmin && category.active &&
									<EditDelete
										isEditing={editing}
										submitting={save.pending}
										onEdit={() => handleStartEdit(category)}
										onCancelEdit={handleCancelEdit}
										onSave={() => handleSaveCategory(category)}
										deleteLabel={`Expire ${category.name}`}
										onDelete={() => setExpiringCategory(category)}
									/>
								}
							</div>
						</div>
					);
				})}
			</div>
			}
			<ConfirmDialog
				open={!!expiringCategory}
				title={`Expire ${expiringCategory?.name ?? "unknown"} category?`}
				description={
					expiringCategory &&
					"Its material types will no longer be available for new material entries. Existing entries will keep them."
				}
				confirmLabel="Expire"
				busy={save.pending}
				error={save.error}
				onConfirm={handleExpireConfirm}
				onCancel={() => { setExpiringCategory(null); save.setError(null); }}
			/>
		</div>
	);
}
