export type UserRole = 'EMPLOYEE' | 'VIEWER' | 'ADMIN';

export const USER_ROLES: UserRole[] = ['EMPLOYEE', 'VIEWER', 'ADMIN'];

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
}

export interface EmployeeCreationResult extends User {
  temporaryPassword: string;
}
