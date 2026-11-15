import { MaterialType, MaterialTypeCategory } from "../domain/material";

export const MATERIAL_MIN_QUANTITY = 1;

function findItem<T extends {id: number}>(items: T[], id: number) {
	return items.find((item) => item.id === id);
}

export const getMaterialType = (materialTypes: MaterialType[], id: number) => findItem(materialTypes, id);
export const getMaterialTypeCategory = (materialTypeCategories: MaterialTypeCategory[], id: number) => findItem(materialTypeCategories, id);

export function isMaterialTypeAvailable(materialType: MaterialType, materialTypeCategories: MaterialTypeCategory[]) {
	return materialType.active && !!getMaterialTypeCategory(materialTypeCategories, materialType.category)?.active;
}

export const getMaterialsInCategory = (materialTypes: MaterialType[], category: number) => materialTypes.filter((type) => type.category === category);

export function formatMaterialTypes(materialTypes: MaterialType[]) {
	return materialTypes.map(({name}) => name).join(" \u2022 ");
}
