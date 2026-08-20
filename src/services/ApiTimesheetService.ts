import type { User, UserRole } from '../domain/user';
import type { Project } from '../domain/project';
import type { TimeEntry } from '../domain/timeEntry';
import { apiRequest } from './apiClient';
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

// Wire shapes returned by Django (snake_case) — mapping to/from the
// frontend's camelCase domain types is centralized here, never in components.

interface ApiUser {
  id: number;
  username: string;
  display_name: string;
  role: UserRole;
  active: boolean;
}

interface ApiProject {
  id: number;
  customer: string;
  name: string;
  project_number: string;
  active: boolean;
  production_status: Project['productionStatus'];
}

interface ApiTimeEntry {
  id: number;
  employee: number;
  project: number;
  work_date: string;
  start_time: string;
  end_time: string;
  work_description: string;
  invoice_number: string | null;
  created_at: string;
  updated_at: string;
}

function userFromApi(user: ApiUser): User {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    active: user.active,
  };
}

function projectFromApi(project: ApiProject): Project {
  return {
    id: project.id,
    customer: project.customer,
    name: project.name,
    projectNumber: project.project_number,
    active: project.active,
    productionStatus: project.production_status,
  };
}

function timeEntryFromApi(entry: ApiTimeEntry): TimeEntry {
  return {
    id: entry.id,
    employeeId: entry.employee,
    projectId: entry.project,
    workDate: entry.work_date,
    startTime: entry.start_time,
    endTime: entry.end_time,
    workDescription: entry.work_description,
    invoiceNumber: entry.invoice_number,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}

/**
 * Django REST implementation of TimesheetService
 */
export class ApiTimesheetService implements TimesheetService {
  async getCurrentUser(userId: number): Promise<User | null> {
    // TODO(Phase B): Django must authenticate the *session*, not trust a
    // client-supplied id — this should become a parameterless
    // GET /api/auth/me/ once real auth lands, and AuthContext will need to
    // stop persisting a userId itself.
    const user = await apiRequest<ApiUser>(`/employees/${userId}/`);
    return user ? userFromApi(user) : null;
  }

  async findUserByUsername(): Promise<User | null> {
    // TODO(Phase B): replaced entirely by POST /api/auth/login/ — the mock's
    // "look up by username, check a hardcoded dev password" flow has no
    // real backend equivalent and should not be ported as-is.
    throw new Error('Not implemented — use POST /api/auth/login/ (Phase B).');
  }

  async getTimeEntries(filter: TimeEntryFilter): Promise<TimeEntry[]> {
    const entries = await apiRequest<ApiTimeEntry[]>('/time-entries/', {
      query: { employeeId: filter.employeeId, from: filter.dateFrom, to: filter.dateTo },
    });
    return entries.map(timeEntryFromApi);
  }

  async createTimeEntry(input: NewTimeEntryInput): Promise<TimeEntry> {
    const entry = await apiRequest<ApiTimeEntry>('/time-entries/', {
      method: 'POST',
      body: {
        employee: input.employeeId,
        project: input.projectId,
        work_date: input.workDate,
        start_time: input.startTime,
        end_time: input.endTime,
        work_description: input.workDescription,
        invoice_number: input.invoiceNumber ?? null,
      },
    });
    return timeEntryFromApi(entry);
  }

  async updateTimeEntry(id: number, input: UpdateTimeEntryInput): Promise<TimeEntry> {
    const entry = await apiRequest<ApiTimeEntry>(`/time-entries/${id}/`, {
      method: 'PATCH',
      body: {
        project: input.projectId,
        work_date: input.workDate,
        start_time: input.startTime,
        end_time: input.endTime,
        work_description: input.workDescription,
        invoice_number: input.invoiceNumber,
      },
    });
    return timeEntryFromApi(entry);
  }

  async deleteTimeEntry(id: number): Promise<void> {
    await apiRequest<void>(`/time-entries/${id}/`, { method: 'DELETE' });
  }

  async getProjects(): Promise<Project[]> {
    const projects = await apiRequest<ApiProject[]>('/projects/');
    return projects.map(projectFromApi);
  }

  async createProject(input: NewProjectInput): Promise<Project> {
    const project = await apiRequest<ApiProject>('/projects/', {
      method: 'POST',
      body: {
        customer: input.customer,
        name: input.name,
        project_number: input.projectNumber,
        active: input.active,
        production_status: input.productionStatus,
      },
    });
    return projectFromApi(project);
  }

  async updateProject(id: number, input: UpdateProjectInput): Promise<Project> {
    const project = await apiRequest<ApiProject>(`/projects/${id}/`, {
      method: 'PATCH',
      body: {
        customer: input.customer,
        name: input.name,
        project_number: input.projectNumber,
        active: input.active,
        production_status: input.productionStatus,
      },
    });
    return projectFromApi(project);
  }

  async getEmployees(): Promise<User[]> {
    const users = await apiRequest<ApiUser[]>('/employees/');
    return users.map(userFromApi);
  }

  async createEmployee(input: NewEmployeeInput): Promise<User> {
    const user = await apiRequest<ApiUser>('/employees/', {
      method: 'POST',
      body: {
        username: input.username,
        display_name: input.displayName,
        role: input.role,
        active: input.active,
      },
    });
    return userFromApi(user);
  }

  async updateEmployee(id: number, input: UpdateEmployeeInput): Promise<User> {
    const user = await apiRequest<ApiUser>(`/employees/${id}/`, {
      method: 'PATCH',
      body: {
        username: input.username,
        display_name: input.displayName,
        role: input.role,
        active: input.active,
      },
    });
    return userFromApi(user);
  }
}
