export interface MaterialEntry {
	id: number;
	employeeId: number;
	projectId: number;
	materialType: number;
	description: string;
	quantity: number;

	createdAt: string;
	updatedAt: string;
}

export interface MaterialType {
	id: number;
	category: number;
	name: string;
	active: boolean;

	createdAt: string;
	updatedAt: string;
}

export interface MaterialTypeCategory {
	id: number;
	name: string;
	active: boolean;

	createdAt: string;
	updatedAt: string;
}
