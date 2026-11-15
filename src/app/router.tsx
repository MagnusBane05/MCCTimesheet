import { Navigate, createBrowserRouter } from 'react-router-dom';
import { TimesheetsListPage } from '../pages/admin/TimesheetsListPage';
import { AppLayout } from '../components/layout/AppLayout';
import { RequireRole } from '../auth/RequireRole';
import { RequirePasswordChange } from '../auth/RequirePasswordChange';
import { LoginPage } from '../pages/LoginPage';
import { SetNewPasswordPage } from '../pages/auth/SetNewPasswordPage';
import { TimesheetPage } from '../pages/TimesheetPage';
import { EmployeePage } from '../pages/EmployeePage';
import { EmployeeMaterialsPage } from '../pages/EmployeeMaterialsPage';
import { ProjectsPage } from '../pages/admin/ProjectsPage';
import { EmployeesPage } from '../pages/admin/EmployeesPage';
import { MaterialsPage } from '../pages/admin/MaterialsPage';

/**
 * These guards are prototype UX only (see RequireRole) — the future Django
 * API must independently authorize every request regardless of what routes
 * the front end exposes.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/set-new-password', element: <SetNewPasswordPage /> },
  {
    element: (
      <RequirePasswordChange>
        <AppLayout />
      </RequirePasswordChange>
    ),
    children: [
      {
        element: <RequireRole allowedRoles={['EMPLOYEE']} />,
        children: [
          {
            element: <EmployeePage />,
            children: [
              { path: '/timesheets', element: <TimesheetPage /> },
              { path: '/materials', element: <EmployeeMaterialsPage /> },
            ],
          },
        ],
      },
      {
        path: '/admin',
        element: <RequireRole allowedRoles={['VIEWER', 'ADMIN']} />,
        children: [
          { path: 'timesheets', element: <TimesheetsListPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'employees', element: <EmployeesPage /> },
          { path: 'materials', element: <MaterialsPage /> },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
