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
 * Data-access contract shared by MockTimesheetService and ApiTimesheetService
 * so components never need to know which backend is active.
 */
export interface TimesheetService {
  /** Resolves the signed-in user from the current session, or null if not signed in. */
  getCurrentUser(): Promise<User | null>;
  /** Throws with a user-facing message (e.g. "Incorrect username or password.") on failure. */
  login(username: string, password: string): Promise<User>;
  logout(): Promise<void>;

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
