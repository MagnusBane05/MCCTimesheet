import { createContext } from 'react';
import type { User } from '../domain/user';

interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  login(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }>;
  logout(): void;
  refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext, type AuthContextValue };


