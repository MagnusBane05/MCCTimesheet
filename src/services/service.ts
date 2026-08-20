import { ApiTimesheetService } from './ApiTimesheetService';
import { MockTimesheetService } from './MockTimesheetService';
import type { TimesheetService } from './TimesheetService';

/**
 * Single shared instance components import for all data access. Controlled
 * by VITE_API_MODE ('mock' | 'api', see .env.example / .env.production) so
 * switching backends never requires touching component code.
 */
const apiMode = import.meta.env.VITE_API_MODE ?? 'mock';

// A production build that forgot to set VITE_API_MODE would otherwise
// silently ship a demo site running on in-memory mock data — fail loudly
// instead of guessing.
if (import.meta.env.PROD && apiMode !== 'api' && apiMode !== 'mock') {
  throw new Error(`Invalid VITE_API_MODE "${apiMode}" — expected "api" or "mock".`);
}
if (import.meta.env.PROD && apiMode !== 'api') {
  console.warn('Production build is running against MockTimesheetService — set VITE_API_MODE=api.');
}

export const timesheetService: TimesheetService =
  apiMode === 'api' ? new ApiTimesheetService() : new MockTimesheetService();
