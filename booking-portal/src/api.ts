import { Tenant, Service, TimeSlot, BookingData } from './types';

const BASE_URL = 'https://yglaxwekbyfjmbhcwqhi.supabase.co/functions/v1/public-booking';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbGF4d2VrYnlmam1iaGN3cWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjM5OTYsImV4cCI6MjA4MzAzOTk5Nn0.2FqbdDfX_agNp5G13nF9jx10nH3JB0REoFWQYk9nwxc';

const headers = {
  'Authorization': `Bearer ${ANON_KEY}`,
  'apikey': ANON_KEY,
};

export async function getServices(tenant: string): Promise<{ tenant: Tenant; services: Service[] }> {
  const res = await fetch(`${BASE_URL}?action=get_services&tenant=${tenant}`, { headers });
  if (!res.ok) throw new Error('Failed to load services');
  return res.json();
}

export async function getSlots(tenant: string, date: string): Promise<{ date: string; slots: TimeSlot[] }> {
  const res = await fetch(`${BASE_URL}?action=get_slots&tenant=${tenant}&date=${date}`, { headers });
  if (!res.ok) throw new Error('Failed to load time slots');
  return res.json();
}

export async function createBooking(tenant: string, data: BookingData): Promise<{ success: boolean; appointment_id: string; message: string }> {
  const res = await fetch(`${BASE_URL}?action=book&tenant=${tenant}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create booking');
  return res.json();
}
