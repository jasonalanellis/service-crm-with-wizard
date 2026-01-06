import { ScheduleResponse, JobAction, UpdateJobData } from './types';

const BASE_URL = 'https://yglaxwekbyfjmbhcwqhi.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbGF4d2VrYnlmam1iaGN3cWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjM5OTYsImV4cCI6MjA4MzAzOTk5Nn0.2FqbdDfX_agNp5G13nF9jx10nH3JB0REoFWQYk9nwxc';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ANON_KEY}`,
};

export async function fetchSchedule(technicianId: string, date: string): Promise<ScheduleResponse> {
  const res = await fetch(`${BASE_URL}/technician-schedule`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ technician_id: technicianId, date }),
  });
  if (!res.ok) throw new Error('Failed to fetch schedule');
  return res.json();
}

export async function updateJobStatus(
  appointmentId: string,
  action: JobAction,
  data?: UpdateJobData
): Promise<void> {
  const res = await fetch(`${BASE_URL}/update-job-status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ appointment_id: appointmentId, action, data }),
  });
  if (!res.ok) throw new Error('Failed to update job');
}
