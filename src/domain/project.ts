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
  ON_DECK: 'bg-lake-800/10 text-midnight-950',
  IN_PROGRESS: 'bg-warning-100 text-midnight-950',
  READY_FOR_FINISHING: 'bg-pine-400/40 text-midnight-950',
  READY_FOR_INSTALL: 'bg-info-100 text-midnight-950',
  COMPLETE: 'bg-success-100 text-midnight-950',
};

export const PRODUCTION_STATUSES: ProductionStatus[] = [
  'ON_DECK',
  'IN_PROGRESS',
  'READY_FOR_FINISHING',
  'READY_FOR_INSTALL',
  'COMPLETE',
];

export function sortProjectStatuses(a: ProductionStatus, b: ProductionStatus): number {
  return PRODUCTION_STATUSES.indexOf(a) - PRODUCTION_STATUSES.indexOf(b);
}

export interface Project {
  id: number;
  customer: string;
  name: string;
  projectNumber: string;
  active: boolean;
  productionStatus: ProductionStatus;
}
