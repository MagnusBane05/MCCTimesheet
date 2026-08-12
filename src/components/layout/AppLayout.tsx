import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../common/Button';

const ADMIN_NAV = [
  { to: '/admin/by-employee', label: 'By Employee' },
  { to: '/admin/by-job', label: 'By Job' },
  // { to: '/admin/hours-summary', label: 'Hours Summary' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/employees', label: 'Employees' },
];

export function AppLayout() {
  const { currentUser, logout } = useAuth();
  const isAdminOrViewer = currentUser?.role === 'ADMIN' || currentUser?.role === 'VIEWER';

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="bg-navy-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">MCC Timesheets</span>
          {currentUser && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-white/70 sm:inline">
                {currentUser.displayName}
                {currentUser.role === 'VIEWER' && ' · Viewer'}
              </span>
              <Button variant="ghost" className="!text-white hover:!bg-white/10" onClick={logout}>
                Log out
              </Button>
            </div>
          )}
        </div>
        {isAdminOrViewer && (
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Admin navigation">
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-accent-500 text-white'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
