# Local Service CRM Project

**Created:** January 6, 2026
**Status:** MVP Built - Demo Stage (not production-secured yet)

---

## What Was Built

### 1. Database Schema (Supabase)
**Project:** jellis-vectors (yglaxwekbyfjmbhcwqhi)

**Tables Created:**
| Table | Purpose |
|-------|---------|
| `tenants` | Businesses using the platform (multi-tenant root) |
| `customers` | End customers with JSONB industry_fields |
| `technicians` | Service workers with location/skills |
| `services` | Service catalog with pricing |
| `appointments` | Jobs with status tracking, delay notifications |
| `communication_logs` | SMS/email history |
| `reviews` | Review request tracking |
| `payments` | Stripe-ready payment records |
| `leads` | Lead pipeline (New→Contacted→Quote Sent→Booked→Lost) |
| `quotes` | Quote generation with line items |

**Views:**
- `v_todays_schedule` - Technician daily schedule with customer details
- `v_customer_overview` - Customer with appointment count, total paid, next appointment

**Sample Data:** Bravo Maids tenant seeded with services, 1 technician (Maria Garcia), 1 customer (John Smith)

---

### 2. Edge Functions (API Layer)
Base URL: `https://yglaxwekbyfjmbhcwqhi.supabase.co/functions/v1`

| Function | Purpose |
|----------|---------|
| `technician-schedule` | GET daily schedule for technician |
| `update-job-status` | Update appointment (start/complete/delay/cancel) |
| `notify-delay` | Send "running late" SMS (queued, needs Twilio) |

---

### 3. Deployed Apps

**Admin Dashboard (ConvertLabs replacement):**
- URL: https://vck4b0t25wgd.space.minimax.io
- Features: Lead kanban, customers, calendar, quotes, reviews, settings

**Technician Mobile App:**
- URL: https://qpzi6faccegl.space.minimax.io
- Test ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Features: Daily schedule, job details, start/complete/delay actions

---

## What's NOT Done Yet

### Security (Required for Production)
- [ ] Supabase Auth (email/password login)
- [ ] Row Level Security (RLS) policies per tenant
- [ ] Move API keys from frontend to edge functions
- [ ] Rate limiting

### Integrations
- [ ] Twilio SMS (code ready, needs credentials)
- [ ] Stripe payments
- [ ] n8n workflow connections
- [ ] Real data migration from ConvertLabs

### Features Discussed for Future
- AI quote generator
- Route optimization
- Customer self-service portal
- Automated follow-up workflows
- Advanced reporting
- Inventory tracking
- Team performance/commission tracking

---

## Code Locations

```
/workspace/code/supabase/
├── technician-schedule.ts   # GET schedule API
├── update-job-status.ts     # Update appointment API
└── notify-delay.ts          # SMS notification API
```

---

## Next Session Instructions

Tell the AI:
1. "Read /workspace/docs/SERVICE-CRM-PROJECT.md for context"
2. Then specify what you want to work on next

**Priority options:**
- A) Lock down security (auth + RLS) for production use
- B) Connect Twilio for real SMS
- C) Add more features
- D) Migrate real data from ConvertLabs

---

## Supabase Credentials

Project URL: https://yglaxwekbyfjmbhcwqhi.supabase.co
(API keys are in your Supabase dashboard)
