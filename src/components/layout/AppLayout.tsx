import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../common/Button';
import { Logo } from '../common/Logo';

const ADMIN_NAV = [
  { to: '/admin/timesheets', label: 'Timesheets' },
  { to: '/admin/materials', label: 'Materials' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/employees', label: 'Employees' },
];

export function AppLayout() {
  const { currentUser, logout } = useAuth();
  const isAdminOrViewer = currentUser?.role === 'ADMIN' || currentUser?.role === 'VIEWER';

  return (
    <div className="min-h-screen">
      <header className="bg-midnight-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo variant="primary" />
          {currentUser && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-birch-50 sm:inline">
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
          <nav className="mx-auto flex max-w-6xl overflow-x-auto px-4 sm:px-6" aria-label="Admin navigation">
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative isolate -ml-[9px] flex h-[42px] shrink-0 items-center whitespace-nowrap px-4 text-sm transition-colors first:ml-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white sm:px-6 before:absolute before:inset-0 before:-z-10 before:content-[''] before:[clip-path:polygon(0_0,calc(100%-13px)_0,100%_100%,13px_100%)] ${
                    isActive
                      ? 'font-semibold text-white before:bg-[linear-gradient(theme(colors.lake.800)_calc(100%-5px),theme(colors.cedar.500)_calc(100%-5px))]'
                      : 'font-medium text-white/60 hover:text-white hover:before:bg-white/5'
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
