import type { User, UserRole } from '../domain/user';
import type { Project } from '../domain/project';
import type { TimeEntry } from '../domain/timeEntry';

export interface TimeEntryFilter {
  employeeId?: number;
  dateFrom?: string; // YYYY-MM-DD, inclusive
  dateTo?: string; // YYYY-MM-DD, inclusive
}

export interface NewTimeEntryInput {
  employeeId: number;
  projectId: number;
  workDate: string;
  startTime: string;
  endTime: string;
  workDescription: string;
  invoiceNumber?: string | null;
}

export type UpdateTimeEntryInput = Partial<Omit<NewTimeEntryInput, 'employeeId'>>;

export interface NewProjectInput {
  customer: string;
  name: string;
  projectNumber: string;
  active?: boolean;
  productionStatus?: Project['productionStatus'];
}

export type UpdateProjectInput = Partial<NewProjectInput>;

export interface NewEmployeeInput {
  username: string;
  displayName: string;
  role: UserRole;
  active?: boolean;
}

export type UpdateEmployeeInput = Partial<NewEmployeeInput>;

/**
 * Prototype data-access contract. The mock implementation is the only thing
 * components should depend on today (see MockTimesheetService) — swapping in
 * a real Django REST client later means implementing this same interface
 * with fetch() calls, with no changes required in components/pages.
 */
export interface TimesheetService {
  getCurrentUser(userId: number): Promise<User | null>;
  findUserByUsername(username: string): Promise<User | null>;

  getTimeEntries(filter: TimeEntryFilter): Promise<TimeEntry[]>;
  createTimeEntry(input: NewTimeEntryInput): Promise<TimeEntry>;
  updateTimeEntry(id: number, input: UpdateTimeEntryInput): Promise<TimeEntry>;
  deleteTimeEntry(id: number): Promise<void>;

  getProjects(): Promise<Project[]>;
  createProject(input: NewProjectInput): Promise<Project>;
  updateProject(id: number, input: UpdateProjectInput): Promise<Project>;

  getEmployees(): Promise<User[]>;
  createEmployee(input: NewEmployeeInput): Promise<User>;
  updateEmployee(id: number, input: UpdateEmployeeInput): Promise<User>;
}
