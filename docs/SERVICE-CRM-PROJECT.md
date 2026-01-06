# Local Service CRM Project

**Created:** January 6, 2026
**Updated:** January 6, 2026 (Session 1 - Final)
**Status:** MVP Built - Demo Stage (not production-secured yet)

---

## Architecture Decision: Simplified Stack

### KEEP
- **Supabase** - Database + Auth + Storage + Edge Functions (consolidate everything here)
- **Vercel** - Website hosting
- **Buffer** - Social media scheduling ($15/mo) - REPLACES Blotato
- **Twilio** - SMS notifications
- **SendGrid** - Email (or Resend)
- **n8n** - CRM automations only (NOT social media)

### DROP
- Blotato → Buffer
- ConvertLabs → This CRM
- Notion (for content) → Buffer handles scheduling
- Hostinger PostgreSQL → Consolidate to Supabase
- Kie.ai → Too complex, low ROI
- Complex AI social workflows → Manual scheduling in Buffer

### Why This Works
- Buffer stores social media images on THEIR servers
- Supabase Storage handles CRM images (job photos, etc.)
- Database only stores URLs, never files
- Supabase Pro ($25/mo) = 8GB database + 100GB storage = years of capacity

---

## What Was Built (Session 1)

### 1. Database Schema (Supabase)
**Project:** jellis-vectors (yglaxwekbyfjmbhcwqhi)

**Tables Created (10):**
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
| `user_profiles` | Links auth users to tenants |

**Security:**
- Row Level Security (RLS) enabled on ALL tables
- Tenant isolation policies created
- Users can only see their own tenant's data

**Views:**
- `v_todays_schedule` - Technician daily schedule with customer details
- `v_customer_overview` - Customer with appointment count, total paid, next appointment

**Sample Data:** Bravo Maids tenant seeded with services, 1 technician, 1 customer

---

### 2. Edge Functions (API Layer)
Base URL: `https://yglaxwekbyfjmbhcwqhi.supabase.co/functions/v1`

| Function | Purpose | Status |
|----------|---------|--------|
| `technician-schedule` | GET daily schedule for technician | ✅ Deployed |
| `update-job-status` | Update appointment (start/complete/delay/cancel) | ✅ Deployed |
| `notify-delay` | Send "running late" SMS | ✅ Deployed (needs Twilio) |
| `public-booking` | Customer self-service booking API | ✅ Deployed |

---

### 3. Deployed Apps

**Admin Dashboard (ConvertLabs replacement):**
- URL: https://vck4b0t25wgd.space.minimax.io
- Features: Lead kanban, customers, calendar, quotes, reviews, settings

**Technician Mobile App:**
- URL: https://qpzi6faccegl.space.minimax.io
- Test ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Features: Daily schedule, job details, start/complete/delay actions

**Customer Booking Portal:**
- Status: API ready, frontend not built yet
- API: `public-booking?tenant=bravo-maids&action=get_services`

---

## What's NOT Done Yet

### Security (Required for Production)
- [ ] Supabase Auth UI (login/signup screens)
- [x] Row Level Security (RLS) policies - DONE
- [ ] Move API keys from frontend to edge functions
- [ ] Rate limiting

### Integrations Needed
- [ ] Twilio SMS connection (code ready, needs SID + Token)
- [ ] Stripe payments
- [ ] n8n webhook endpoints
- [ ] Data migration from ConvertLabs

### Features for Later
- Customer booking portal frontend
- AI quote generator
- Route optimization
- Advanced reporting

---

## Code Locations

```
/workspace/code/supabase/
├── technician-schedule.ts   # GET schedule API
├── update-job-status.ts     # Update appointment API
├── notify-delay.ts          # SMS notification API
└── public-booking.ts        # Customer booking API
```

---

## Next Session Instructions

**Start your next session with:**
```
Read /workspace/docs/SERVICE-CRM-PROJECT.md for context on my Local Service CRM project.
```

**Then pick a task:**
1. Add Supabase Auth (login screens)
2. Connect Twilio for real SMS
3. Build customer booking portal frontend
4. Migrate data from ConvertLabs
5. Set up n8n automation workflows

---

## Credentials & URLs

| Service | URL/Info |
|---------|----------|
| Supabase Project | https://yglaxwekbyfjmbhcwqhi.supabase.co |
| Admin Dashboard | https://vck4b0t25wgd.space.minimax.io |
| Technician App | https://qpzi6faccegl.space.minimax.io |
| API Base | https://yglaxwekbyfjmbhcwqhi.supabase.co/functions/v1 |

---

## Cost Summary

| Before | After |
|--------|-------|
| ConvertLabs $297-497/mo | $0 (this CRM) |
| Blotato $29/mo | Buffer $15/mo |
| Multiple databases | Supabase Pro $25/mo |
| **~$350-550/mo** | **~$40/mo** |

**Annual savings: $3,700 - $6,100**
