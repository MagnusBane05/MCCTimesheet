import { MaterialEntry, MaterialType, MaterialTypeCategory } from "../../domain/material";
import { getMaterialType, getMaterialTypeCategory } from "../../utils/materials";

interface MaterialsListProps {
	entries: MaterialEntry[];
	materialTypes: MaterialType[];
	materialTypeCategories: MaterialTypeCategory[];
}

export function MaterialsList({ entries, materialTypes, materialTypeCategories }: MaterialsListProps) {
	return (
		<ul className="divide-y divide-lakehouse-900/10 border-y border-lakehouse-900/10">
			{entries.map((entry) => {
				const type = getMaterialType(materialTypes, entry.materialType);
				const category = type ? getMaterialTypeCategory(materialTypeCategories, type.category) : undefined;
				return (
					<li key={entry.id} className="flex items-start justify-between gap-3 py-3">
						<div className="min-w-0 break-words">
							<p className="font-semibold text-midnight-950">
								{type?.name ?? "Unknown material"}
								{category && <span className="text-sm font-medium text-cedar-500"> &#x2022; {category.name}</span>}
							</p>
							<p className="text-sm text-lakehouse-900">{entry.description}</p>
						</div>
						<p className="whitespace-nowrap text-sm font-semibold text-midnight-950">Qty {entry.quantity}</p>
					</li>
				);
			})}
		</ul>
	);
}
