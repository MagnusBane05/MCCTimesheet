import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/common/Button';
import { Error as ErrorMessage } from '../../components/common/Error';
import { LoadingState } from '../../components/common/LoadingState';
import { timesheetService } from '../../services/service';

export function SetNewPasswordPage() {
  const navigate = useNavigate();
  const { currentUser, loading, logout, refreshUser } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  if (loading) {
    return <LoadingState label="Loading..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.mustChangePassword) {
    return <Navigate to="/" replace />;
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setFormLoading(true);
    try {
      await timesheetService.changePassword(newPassword);
      await refreshUser();
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password. Please try again.';
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-2 text-navy-950">Set Your Password</h1>
        <p className="text-gray-600 mb-6">
          You've been assigned a temporary password. Please create a new password to continue.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={formLoading}
              autoComplete="new-password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:bg-gray-100"
              placeholder="Enter new password"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={formLoading}
              autoComplete="new-password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:bg-gray-100"
              placeholder="Confirm your password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={formLoading}
            className="w-full"
          >
            {formLoading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>

        {error && <ErrorMessage message={error} />}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-3">
            Or log out and try again later.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={handleLogout}
            disabled={formLoading}
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
