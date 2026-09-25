import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/common/Button';
import { Logo } from '../components/common/Logo';
import { Error } from '../components/common/Error';
import { TextField } from '../components/form/TextField';

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
    <div className="flex min-h-screen items-center justify-center bg-midnight-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-birch-50 p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <Logo className="h-16 w-auto" variant="secondary" />
        </div>
        <p className="text-center text-sm text-lakehouse-900/60">Sign in to continue. If you don't have an account, please contact your administrator.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <TextField
              id="username"
              ariaLabel='Username'
              name="username"
              autoComplete="username"
              label='Username'
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1 w-full py-2.5"
            />
          </div>
          <div>
            <TextField
              id="password"
              ariaLabel='Password'
              name="password"
              type="password"
              autoComplete="current-password"
              label='Password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full py-2.5"
            />
          </div>

          {error && (
            <Error message={error} />
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
