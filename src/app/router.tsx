import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { RequireRole } from '../auth/RequireRole';
import { LoginPage } from '../pages/LoginPage';
import { TimesheetPage } from '../pages/TimesheetPage';
import { ByEmployeePage } from '../pages/admin/ByEmployeePage';
import { ByJobPage } from '../pages/admin/ByJobPage';
import { HoursSummaryPage } from '../pages/admin/HoursSummaryPage';
import { ProjectsPage } from '../pages/admin/ProjectsPage';
import { EmployeesPage } from '../pages/admin/EmployeesPage';

/**
 * These guards are prototype UX only (see RequireRole) — the future Django
 * API must independently authorize every request regardless of what routes
 * the front end exposes.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      {
        element: <RequireRole allowedRoles={['EMPLOYEE']} />,
        children: [{ path: '/timesheets', element: <TimesheetPage /> }],
      },
      {
        path: '/admin',
        element: <RequireRole allowedRoles={['VIEWER', 'ADMIN']} />,
        children: [
          { path: 'by-employee', element: <ByEmployeePage /> },
          { path: 'by-job', element: <ByJobPage /> },
          { path: 'hours-summary', element: <HoursSummaryPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'employees', element: <EmployeesPage /> },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
