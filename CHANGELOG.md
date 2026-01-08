# Service CRM Changelog

All notable changes to the Local Service Stack CRM will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Supabase Auth integration (magic links)
- Twilio SMS notifications
- Resend email integration
- ConvertLabs data import
- Clean Town & Country tenant setup

---

## [1.0.0] - 2026-01-07

### Added

**Dashboard**
- KPI cards: Today's Jobs, New Leads (7d), Revenue (Week), Total Customers
- Upcoming Jobs widget
- Recent Activity feed
- Quick actions: New Booking, Add Customer, Create Quote, New Invoice

**Scheduling Module**
- Bookings management
- Calendar view
- Quotes with status tracking
- Waitlist management
- Work Orders

**Customer Management**
- Customer database with JSONB industry_fields
- Customer detail views
- Communication history

**Team & Ops**
- Technician management
- Technician mobile PWA (`field-service-pwa/`)

**Financials**
- Revenue tracking
- Invoice management
- Payment tracking (Stripe-ready schema)

**Services**
- Service catalog management
- Pricing configuration

**Multi-Tenant Architecture**
- Tenant isolation via RLS
- Tenant switcher in UI (ACME Inc demo)

**Database (Supabase)**
- 11 tables: tenants, customers, technicians, services, appointments, communication_logs, reviews, payments, leads, quotes, user_profiles, ai_media
- Row Level Security on all tables
- Media storage bucket (50MB limit)

**Edge Functions**
- `technician-schedule` - Get technician's daily jobs
- `update-job-status` - Start/complete/delay appointments
- `notify-delay` - Send "running late" SMS
- `public-booking` - Customer self-service booking

**Customer Booking Portal**
- 3-step wizard: Select service → Pick time → Enter details
- Multi-tenant support via URL parameter

**Technician Mobile App**
- Daily schedule view
- Job details with customer info
- Start/complete/delay actions
- PWA installable

### Technical
- React 18 + TypeScript + Vite
- Tailwind CSS + Radix UI components
- Supabase client integration
- Vercel deployment (auto-deploy from GitHub)
- Dark mode UI

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Initial MVP release |

---

## Links

- **Live App**: https://app.localservicestack.com
- **GitHub**: https://github.com/jasonalanellis/service-crm-with-wizard
- **Supabase**: jellis-vectors project
- **Vercel**: lss-app project
