import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/common/Button';

const DEMO_ACCOUNTS = [
  { username: 'employee1', role: 'Employee' },
  { username: 'employee2', role: 'Employee' },
  { username: 'viewer', role: 'Viewer' },
  { username: 'admin', role: 'Admin' },
];

export function LoginPage() {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    navigate(currentUser.role === 'EMPLOYEE' ? '/timesheets' : '/admin/by-employee', { replace: true });
  }, [currentUser, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await login(username, password);
    setSubmitting(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-navy-950">MCC Timesheets</h1>
        <p className="mt-1 text-sm text-navy-900/60">Sign in to continue.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-navy-900">
              Username
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-900/20 px-3 py-2.5 text-base focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-navy-900">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-900/20 px-3 py-2.5 text-base focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 rounded-lg bg-cream-50 p-4 text-xs text-navy-900/60">
          <p className="font-semibold text-navy-900/80">Prototype demo accounts (password: demo)</p>
          <ul className="mt-2 space-y-1">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.username}>
                <span className="font-mono">{account.username}</span> — {account.role}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
