import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../domain/user';
import { timesheetService } from '../services/service';

/**
 * PROTOTYPE-ONLY AUTHENTICATION.
 *
 * There is no password hashing, no tokens, no cookies, no OAuth here — every
 * demo account accepts the literal password "demo". The current "session" is
 * just a user id persisted to sessionStorage. This entire module must be
 * replaced by real Django authentication (and the API must independently
 * enforce authorization on every request) before this app goes to production.
 */
const SESSION_KEY = 'mcc_timesheet_session';
const DEV_PASSWORD = 'demo';

interface StoredSession {
  userId: number;
}

interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  login(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      setLoading(false);
      return;
    }
    const { userId }: StoredSession = JSON.parse(raw);
    timesheetService
      .getCurrentUser(userId)
      .then((user) => setCurrentUser(user && user.active ? user : null))
      .finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (password !== DEV_PASSWORD) {
      return { ok: false, error: 'Incorrect username or password.' };
    }
    const user = await timesheetService.findUserByUsername(username);
    if (!user || !user.active) {
      return { ok: false, error: 'Incorrect username or password.' };
    }
    setCurrentUser(user);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id } satisfies StoredSession));
    return { ok: true };
  }

  function logout() {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  return <AuthContext.Provider value={{ currentUser, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
