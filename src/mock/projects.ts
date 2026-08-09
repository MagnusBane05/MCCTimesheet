import type { Project } from '../domain/project';

export const mockProjects: Project[] = [
  { id: 1, customer: 'Harborview Medical Center', name: 'ICU Wing Millwork', projectNumber: 'MCC-2024-101', active: true, productionStatus: 'IN_PROGRESS' },
  { id: 2, customer: 'Harborview Medical Center', name: 'Lobby Reception Desk', projectNumber: 'MCC-2024-102', active: true, productionStatus: 'READY_FOR_INSTALL' },
  { id: 3, customer: 'Cascade Public Schools', name: 'Library Casework', projectNumber: 'MCC-2024-103', active: true, productionStatus: 'ON_DECK' },
  { id: 4, customer: 'Cascade Public Schools', name: 'Science Wing Cabinets', projectNumber: 'MCC-2024-104', active: true, productionStatus: 'COMPLETE' },
  { id: 5, customer: 'Redwood Financial Group', name: 'Executive Suite Paneling', projectNumber: 'MCC-2024-105', active: true, productionStatus: 'READY_FOR_FINISHING' },
  { id: 6, customer: 'Redwood Financial Group', name: 'Boardroom Table', projectNumber: 'MCC-2024-106', active: true, productionStatus: 'IN_PROGRESS' },
  { id: 7, customer: 'Summit Hotel Group', name: 'Guest Room Vanities', projectNumber: 'MCC-2024-107', active: true, productionStatus: 'IN_PROGRESS' },
  { id: 8, customer: 'Summit Hotel Group', name: 'Rooftop Bar Millwork', projectNumber: 'MCC-2024-108', active: false, productionStatus: 'COMPLETE' },
  { id: 9, customer: 'Bluewater Credit Union', name: 'Teller Line Casework', projectNumber: 'MCC-2024-109', active: true, productionStatus: 'READY_FOR_INSTALL' },
  { id: 10, customer: 'Pinecrest Senior Living', name: 'Dining Hall Built-ins', projectNumber: 'MCC-2024-110', active: true, productionStatus: 'ON_DECK' },
  { id: 11, customer: 'Pinecrest Senior Living', name: 'Activity Room Cabinets', projectNumber: 'MCC-2024-111', active: false, productionStatus: 'ON_DECK' },
  { id: 12, customer: 'Meridian Tech Campus', name: 'Open Office Workstations', projectNumber: 'MCC-2024-112', active: true, productionStatus: 'IN_PROGRESS' },
  { id: 13, customer: 'Meridian Tech Campus', name: 'Cafeteria Servery Counters', projectNumber: 'MCC-2024-113', active: true, productionStatus: 'READY_FOR_FINISHING' },
  { id: 14, customer: 'Cedar Ridge Winery', name: 'Tasting Room Bar', projectNumber: 'MCC-2024-114', active: true, productionStatus: 'COMPLETE' },
];
