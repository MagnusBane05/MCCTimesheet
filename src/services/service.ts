import { MockTimesheetService } from './MockTimesheetService';
import type { TimesheetService } from './TimesheetService';

/**
 * Single shared instance components import for all data access. Swapping
 * the prototype for the real Django REST API later means replacing this one
 * line with `new ApiTimesheetService(...)` — no component changes required.
 */
export const timesheetService: TimesheetService = new MockTimesheetService();
