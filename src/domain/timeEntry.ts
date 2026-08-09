export interface TimeEntry {
  id: number;
  employeeId: number;
  projectId: number;

  workDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm

  workDescription: string;

  invoiceNumber: string | null;

  createdAt: string;
  updatedAt: string;
}
