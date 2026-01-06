export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  industry_fields: Record<string, unknown>;
}

export interface Job {
  appointment_id: string;
  scheduled_time: string;
  estimated_duration: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  job_type: string;
  customer: Customer;
  notes: string;
  internal_notes: string;
}

export interface ScheduleResponse {
  date: string;
  total_jobs: number;
  schedule: Job[];
}

export type JobAction = 'start' | 'complete' | 'delay' | 'cancel';

export interface UpdateJobData {
  notes?: string;
  photos?: string[];
  signature_url?: string;
  minutes?: 15 | 30 | 45 | 60;
}
