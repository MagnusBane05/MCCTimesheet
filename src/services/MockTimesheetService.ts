import type { User } from '../domain/user';
import type { Project } from '../domain/project';
import type { TimeEntry } from '../domain/timeEntry';
import { mockUsers } from '../mock/users';
import { mockProjects } from '../mock/projects';
import { mockTimeEntries } from '../mock/timeEntries';
import type {
  NewEmployeeInput,
  NewProjectInput,
  NewTimeEntryInput,
  TimeEntryFilter,
  TimesheetService,
  UpdateEmployeeInput,
  UpdateProjectInput,
  UpdateTimeEntryInput,
} from './TimesheetService';

const SIMULATED_LATENCY_MS = 250;

// PROTOTYPE-ONLY: every account accepts this literal password. Session is
// just a user id in sessionStorage — nothing like this exists once
// ApiTimesheetService (real Django auth) is the active service.
const DEV_PASSWORD = 'demo';
const SESSION_KEY = 'mcc_timesheet_mock_session';

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

function nextId(records: { id: number }[]): number {
  return records.reduce((max, record) => Math.max(max, record.id), 0) + 1;
}

/**
 * In-memory prototype implementation of TimesheetService. Every method
 * returns a Promise so a future ApiTimesheetService (backed by the Django
 * REST API) can be swapped in without changing any component code.
 */
export class MockTimesheetService implements TimesheetService {
  private users: User[] = mockUsers.map((user) => ({ ...user }));
  private projects: Project[] = mockProjects.map((project) => ({ ...project }));
  private timeEntries: TimeEntry[] = mockTimeEntries.map((entry) => ({ ...entry }));

  async getCurrentUser(): Promise<User | null> {
    const userId = Number(sessionStorage.getItem(SESSION_KEY));
    const user = this.users.find((u) => u.id === userId) ?? null;
    return delay(user && user.active ? { ...user } : null);
  }

  async login(username: string, password: string): Promise<User> {
    if (password !== DEV_PASSWORD) {
      throw new Error('Incorrect username or password.');
    }
    const user = this.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user || !user.active) {
      throw new Error('Incorrect username or password.');
    }
    sessionStorage.setItem(SESSION_KEY, String(user.id));
    return delay({ ...user });
  }

  async logout(): Promise<void> {
    sessionStorage.removeItem(SESSION_KEY);
    return delay(undefined);
  }

  async getTimeEntries(filter: TimeEntryFilter): Promise<TimeEntry[]> {
    const results = this.timeEntries.filter((entry) => {
      if (filter.employeeId !== undefined && entry.employeeId !== filter.employeeId) return false;
      if (filter.dateFrom !== undefined && entry.workDate < filter.dateFrom) return false;
      if (filter.dateTo !== undefined && entry.workDate > filter.dateTo) return false;
      return true;
    });
    return delay(results.map((entry) => ({ ...entry })));
  }

  async createTimeEntry(input: NewTimeEntryInput): Promise<TimeEntry> {
    const now = new Date().toISOString();
    const entry: TimeEntry = {
      id: nextId(this.timeEntries),
      employeeId: input.employeeId,
      projectId: input.projectId,
      workDate: input.workDate,
      startTime: input.startTime,
      endTime: input.endTime,
      workDescription: input.workDescription,
      invoiceNumber: input.invoiceNumber ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.timeEntries.push(entry);
    return delay({ ...entry });
  }

  async updateTimeEntry(id: number, input: UpdateTimeEntryInput): Promise<TimeEntry> {
    const existing = this.timeEntries.find((entry) => entry.id === id);
    if (!existing) throw new Error(`Time entry ${id} not found`);
    Object.assign(existing, input, { updatedAt: new Date().toISOString() });
    return delay({ ...existing });
  }

  async deleteTimeEntry(id: number): Promise<void> {
    const index = this.timeEntries.findIndex((entry) => entry.id === id);
    if (index === -1) throw new Error(`Time entry ${id} not found`);
    this.timeEntries.splice(index, 1);
    return delay(undefined);
  }

  async getProjects(): Promise<Project[]> {
    return delay(this.projects.map((project) => ({ ...project })));
  }

  async createProject(input: NewProjectInput): Promise<Project> {
    const project: Project = {
      id: nextId(this.projects),
      customer: input.customer,
      name: input.name,
      projectNumber: input.projectNumber,
      active: input.active ?? true,
      productionStatus: input.productionStatus ?? 'ON_DECK',
    };
    this.projects.push(project);
    return delay({ ...project });
  }

  async updateProject(id: number, input: UpdateProjectInput): Promise<Project> {
    const existing = this.projects.find((project) => project.id === id);
    if (!existing) throw new Error(`Project ${id} not found`);
    Object.assign(existing, input);
    return delay({ ...existing });
  }

  async getEmployees(): Promise<User[]> {
    return delay(this.users.map((user) => ({ ...user })));
  }

  async createEmployee(input: NewEmployeeInput): Promise<User> {
    const user: User = {
      id: nextId(this.users),
      username: input.username,
      displayName: input.displayName,
      role: input.role,
      active: input.active ?? true,
    };
    this.users.push(user);
    return delay({ ...user });
  }

  async updateEmployee(id: number, input: UpdateEmployeeInput): Promise<User> {
    const existing = this.users.find((user) => user.id === id);
    if (!existing) throw new Error(`Employee ${id} not found`);
    Object.assign(existing, input);
    return delay({ ...existing });
  }
}
