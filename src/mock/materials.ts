import type { MaterialEntry, MaterialType, MaterialTypeCategory } from '../domain/material';

const SEEDED_AT = '2024-01-01T00:00:00.000Z';

export const mockMaterialTypeCategories: MaterialTypeCategory[] = [
  { id: 1, name: 'Sheet Goods', active: true, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
  { id: 2, name: 'Hardware', active: true, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
  { id: 3, name: 'Finishes', active: true, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
];

export const mockMaterialTypes: MaterialType[] = [
  { id: 1, category: 1, name: 'Plywood', active: true, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
  { id: 2, category: 1, name: 'MDF', active: true, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
  { id: 3, category: 2, name: 'Hinges', active: true, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
  { id: 4, category: 2, name: 'Drawer Slides', active: true, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
  { id: 5, category: 3, name: 'Lacquer', active: true, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
];

export const mockMaterialEntries: MaterialEntry[] = [
  { id: 1, employeeId: 1, projectId: 1, materialType: 1, description: '3/4" Maple Plywood - sheets for ICU cabinet boxes', quantity: 12, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
  { id: 2, employeeId: 1, projectId: 1, materialType: 3, description: 'Concealed soft-close hinges', quantity: 48, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
  { id: 3, employeeId: 2, projectId: 2, materialType: 2, description: '3/4" MDF - reception desk substrate, sheets', quantity: 8, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
  { id: 4, employeeId: 2, projectId: 6, materialType: 5, description: 'Satin pre-cat lacquer - gallons', quantity: 5, createdAt: SEEDED_AT, updatedAt: SEEDED_AT },
];
