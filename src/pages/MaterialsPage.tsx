import { MaterialTypeTable } from "../components/admin/MaterialTypeTable";
import { Title } from "../components/common/Title";
import { MaterialsTable } from "../components/materials/MaterialsTable";
import { MaterialType, MaterialTypeCategory } from "../domain/material";
import { useLoad } from "../hooks/useLoad";
import { timesheetService } from "../services/service";

export function MaterialsPage() {
	const { data: { materialTypes, materialTypeCategories }, loading, error, load } = useLoad(async () => {
		const [materialTypes, materialTypeCategories] = await Promise.all([
			timesheetService.getMaterialTypes(),
			timesheetService.getMaterialTypeCategories(),
		]);
		return { materialTypes, materialTypeCategories };
	}, [], { materialTypes: [] as MaterialType[], materialTypeCategories: [] as MaterialTypeCategory[] });

	return (
		<div>
			<Title>Material entries</Title>
			<MaterialsTable materialTypes={materialTypes} materialTypeCategories={materialTypeCategories} />
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
