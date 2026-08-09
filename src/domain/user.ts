export type UserRole = 'EMPLOYEE' | 'VIEWER' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
  active: boolean;
}
