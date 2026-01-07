import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yglaxwekbyfjmbhcwqhi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbGF4d2VrYnlmam1iaGN3cWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjM5OTYsImV4cCI6MjA4MzAzOTk5Nn0.2FqbdDfX_agNp5G13nF9jx10nH3JB0REoFWQYk9nwxc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type Tenant = {
  id: string;
  name: string;
  slug?: string;
  logo_url?: string;
  primary_color?: string;
  timezone?: string;
  currency?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  business_hours?: Record<string, { open: string; close: string }>;
  settings?: Record<string, unknown>;
  created_at: string;
};

export type Customer = {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  tags?: string[];
  source?: string;
  created_at: string;
};

export type Service = {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  base_price: number;
  category?: string;
  active: boolean;
  is_active: boolean;
  extras?: ServiceExtra[];
  pricing_tiers?: PricingTier[];
  created_at: string;
};

export type ServiceExtra = {
  id: string;
  name: string;
  price: number;
  duration?: number;
};

export type PricingTier = {
  id: string;
  name: string;
  min_value?: number;
  max_value?: number;
  price: number;
};

export type Technician = {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  color?: string;
  avatar_url?: string;
  active: boolean;
  is_active: boolean;
  skills?: string[];
  specialty?: string;
  hourly_rate?: number;
  rating?: number;
  created_at: string;
};

export type Appointment = {
  id: string;
  tenant_id: string;
  customer_id: string;
  technician_id?: string;
  service_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'pending' | 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  address?: string;
  price?: number;
  customer?: Customer;
  technician?: Technician;
  service?: Service;
  created_at: string;
};

export type Lead = {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  source?: string;
  service_requested?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'quote_sent' | 'booked';
  notes?: string;
  last_contacted_at?: string;
  created_at: string;
};

export type Quote = {
  id: string;
  tenant_id: string;
  lead_id?: string;
  customer_id?: string;
  items: Array<{ name: string; description?: string; quantity: number; price: number; unit_price?: number; total: number }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  valid_until?: string;
  notes?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  lead?: Lead;
  customer?: Customer;
  created_at: string;
};

export type Review = {
  id: string;
  tenant_id: string;
  customer_id?: string;
  appointment_id?: string;
  rating: number;
  comment?: string;
  platform?: string;
  status?: 'pending' | 'requested' | 'received' | 'responded' | 'completed';
  response?: string;
  responded_at?: string;
  requested_at?: string;
  review_url?: string;
  customer?: Customer;
  created_at: string;
};

export type Campaign = {
  id: string;
  tenant_id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'both';
  status: 'draft' | 'scheduled' | 'active' | 'sent' | 'completed' | 'cancelled';
  subject?: string;
  content: string;
  audience?: string[];
  scheduled_for?: string;
  scheduled_date?: string;
  sent_at?: string;
  sent_count?: number;
  open_rate?: number;
  stats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
  created_at: string;
};
