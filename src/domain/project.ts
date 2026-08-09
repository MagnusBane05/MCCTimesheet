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
