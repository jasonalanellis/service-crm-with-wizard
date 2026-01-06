export interface Tenant {
  name: string;
  phone: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

export interface TimeSlot {
  time: string;
  start: string;
  available: boolean;
}

export interface BookingData {
  service_id: string;
  scheduled_start: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}
