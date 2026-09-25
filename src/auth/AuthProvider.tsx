import { useState, useEffect, type ReactNode } from 'react';
import type { User } from '../domain/user';
import { timesheetService } from '../services/service';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    timesheetService
      .getCurrentUser()
      .then((user) => setCurrentUser(user && user.active ? user : null))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const user = await timesheetService.login(username, password);
      setCurrentUser(user);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Incorrect username or password.';
      return { ok: false, error: message };
    }
  }

  function logout() {
    setCurrentUser(null);
    // Best-effort: the local session state is already cleared either way.
    timesheetService.logout().catch(() => {});
  }

  async function refreshUser() {
    try {
      const user = await timesheetService.getCurrentUser();
      setCurrentUser(user && user.active ? user : null);
    } catch {
      setCurrentUser(null);
    }
  }

  return <AuthContext.Provider value={{ currentUser, loading, login, logout, refreshUser }}>{children}</AuthContext.Provider>;
}