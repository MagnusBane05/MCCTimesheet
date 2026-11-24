import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Button } from "../common/Button";
import { Error } from "../common/Error";
import { IntegerField } from "../form/IntegerField";
import { SelectField } from "../form/SelectField";
import { TextAreaField } from "../form/TextAreaField";
import { MaterialType, MaterialTypeCategory } from "../../domain/material";
import { NewMaterialEntryInput } from "../../services/TimesheetService";
import { getMaterialsInCategory, isMaterialTypeAvailable, MATERIAL_MIN_QUANTITY } from "../../utils/materials";
import { Project } from "../../domain/project";
import { useAuth } from "../../auth/useAuth";
import { useAction } from "../../hooks/useAction";

interface MaterialEntryFormProps {
	categories: MaterialTypeCategory[];
	materials: MaterialType[];
	project: Project;
	onCreateEntry: (material: NewMaterialEntryInput) => Promise<void>;
}

export function MaterialEntryForm({categories, materials, project, onCreateEntry}: MaterialEntryFormProps) {
	const [category, setCategory] = useState<number | null>(null);
	const [material, setMaterial] = useState<number | null>(null);
	const [quantity, setQuantity] = useState<number>(MATERIAL_MIN_QUANTITY);
	const [description, setDescription] = useState('');
	const submit = useAction();

	const { currentUser } = useAuth();

	const categoryOptions = useMemo(() => categories.filter((c) => c.active), [categories]);
	const materialOptions = useMemo(() => category
		? getMaterialsInCategory(materials, category).filter((m) => isMaterialTypeAvailable(m, categories))
		: []
	, [materials, categories, category]);

	function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
		const newCategory = event.target.value ? Number(event.target.value) : null;
		setCategory(newCategory);
		const options = newCategory
			? getMaterialsInCategory(materials, newCategory).filter((m) => isMaterialTypeAvailable(m, categories))
			: [];
		setMaterial(options.length === 1 ? options[0].id : null);
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		if (!currentUser) return;
		if (material == null) {
			submit.setError("Select a material type.");
			return;
		}
		if (!Number.isInteger(quantity) || quantity < MATERIAL_MIN_QUANTITY) {
			submit.setError(`Quantity must be at least ${MATERIAL_MIN_QUANTITY}.`);
			return;
		}
		if (!description.trim()) {
			submit.setError("Description cannot be empty.");
			return;
		}
		await submit.run(() => onCreateEntry({
			type: material,
			quantity,
			description: description.trim(),
			employeeId: currentUser.id,
			projectId: project.id,
		}));
	}

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-4 sm:flex-row sm:gap-2">
				<SelectField
					id="entry-category"
					ariaLabel="Category"
					pt={{container: "min-w-0 sm:flex-1"}}
					variant="large"
					selectClassName="w-full"
					label="Category"
					required
					value={category ?? ''}
					onChange={handleCategoryChange}
				>
					<option key="" value="">{categoryOptions.length === 0 ? "No categories available" : "Select a category..."}</option>
					{categoryOptions.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name}
						</option>
					))}
				</SelectField>
				<SelectField 
					id="entry-type"
					ariaLabel="Type"
					pt={{container: "min-w-0 sm:flex-1"}}
					variant="large"
					selectClassName="w-full"
					label="Material"
					required
					value={material ?? ''}
					disabled={materialOptions.length === 0}
					onChange={(e) => setMaterial(e.target.value ? Number(e.target.value) : null)}
				>
					{materialOptions.length === 0 && <option key="" value="">{category ? "No materials in this category" : "Select a category first"}</option>}
					{materialOptions.length > 1 && <option key="" value="">Select a material type...</option>}
					{materialOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
				</SelectField>
				<IntegerField
					id="entry-quantity"
					ariaLabel="Quantity"
					pt={{container: "shrink-0"}}
					variant="large"
					className="w-full sm:w-14"
					min={MATERIAL_MIN_QUANTITY}
					label="Quantity"
					required
					value={Number.isNaN(quantity) ? '' : quantity}
					onChange={(e) => setQuantity(e.target.valueAsNumber)}
				/>
			</div>
				<TextAreaField
					id="entry-description"
					ariaLabel="Description"
					label="Description"
					required
					value={description}
					onChange={(e) => setDescription(e.target.value)}	
				/>
			<div className="w-full flex flex-col justify-stretch">
				<Error message={submit.error} />
				<Button type="submit" disabled={submit.pending}>
					{submit.pending ? "Submitting..." : "Submit Entry"}
				</Button>
			</div>
		</form>
	);
}
