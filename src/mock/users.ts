import type { User } from '../domain/user';

/**
 * Prototype-only demo accounts. Passwords are NOT modeled here — see
 * src/auth/AuthContext.tsx for the mocked login flow (every account uses the
 * password "demo"). This must be replaced by real Django-authenticated user
 * records before production.
 */
export const mockUsers: User[] = [
  { id: 1, username: 'employee1', displayName: 'Jamie Rivera', role: 'EMPLOYEE', active: true },
  { id: 2, username: 'employee2', displayName: 'Sam Okafor', role: 'EMPLOYEE', active: true },
  { id: 3, username: 'employee3', displayName: 'Casey Nguyen', role: 'EMPLOYEE', active: true },
  { id: 4, username: 'employee4', displayName: 'Morgan Ellis', role: 'EMPLOYEE', active: true },
  { id: 5, username: 'employee5', displayName: 'Taylor Brooks', role: 'EMPLOYEE', active: true },
  { id: 6, username: 'employee6', displayName: 'Riley Chen', role: 'EMPLOYEE', active: false },
  { id: 7, username: 'viewer', displayName: 'Pat Sullivan', role: 'VIEWER', active: true },
  { id: 8, username: 'admin', displayName: 'Dana Whitfield', role: 'ADMIN', active: true },
  { id: 9, username: 'admin2', displayName: 'Alex Kowalski', role: 'ADMIN', active: true },
];
