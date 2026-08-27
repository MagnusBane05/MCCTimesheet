export type ProductionStatus =
  | 'ON_DECK'
  | 'IN_PROGRESS'
  | 'READY_FOR_FINISHING'
  | 'READY_FOR_INSTALL'
  | 'COMPLETE';

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  ON_DECK: 'On Deck',
  IN_PROGRESS: 'In Progress',
  READY_FOR_FINISHING: 'Ready for Finishing',
  READY_FOR_INSTALL: 'Ready for Install',
  COMPLETE: 'Complete',
};

export const PRODUCTION_STATUS_COLOURS: Record<ProductionStatus, string> = {
  ON_DECK: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  READY_FOR_FINISHING: 'bg-purple-100 text-purple-700',
  READY_FOR_INSTALL: 'bg-blue-100 text-blue-700',
  COMPLETE: 'bg-green-100 text-green-700',
};

export const PRODUCTION_STATUSES: ProductionStatus[] = [
  'ON_DECK',
  'IN_PROGRESS',
  'READY_FOR_FINISHING',
  'READY_FOR_INSTALL',
  'COMPLETE',
];

export interface Project {
  id: number;
  customer: string;
  name: string;
  projectNumber: string;
  active: boolean;
  productionStatus: ProductionStatus;
}
