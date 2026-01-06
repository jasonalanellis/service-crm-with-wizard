# Local Service CRM Project

**Created:** January 6, 2026
**Updated:** January 6, 2026 (Session 1 - COMPLETE)
**Status:** MVP Built - Ready for Auth + Data Migration

---

## SESSION 1 SUMMARY

### What Was Built Tonight

| Component | Status | URL/Location |
|-----------|--------|--------------|
| Database (11 tables) | ✅ Done | Supabase: jellis-vectors |
| Row Level Security | ✅ Done | All tables secured |
| Admin Dashboard | ✅ Done | https://vck4b0t25wgd.space.minimax.io |
| Technician Mobile App | ✅ Done | https://qpzi6faccegl.space.minimax.io |
| Customer Booking Portal | ✅ Done | https://4w71xzq5ogw8.space.minimax.io/?tenant=bravo-maids |
| 4 Edge Functions | ✅ Done | See API section |
| Media Storage Bucket | ✅ Done | 50MB limit, images + videos |
| AI Media Library Table | ✅ Done | For Veo3/Sora output storage |

---

## Architecture: Simplified Stack

### KEEP
- **Supabase** - Database + Auth + Storage + Edge Functions
- **Vercel** - Website hosting
- **Buffer** - Social media scheduling ($15/mo)
- **Twilio** - SMS notifications
- **Resend** - Email (simpler than SendGrid)
- **n8n** - CRM automations only

### DROP
- Blotato → Buffer
- ConvertLabs → This CRM
- Notion (for content) → Buffer
- Hostinger PostgreSQL → Supabase
- Complex AI auto-posting → AI generates, you review, Buffer posts

---

## Database Schema (Supabase)

**Project:** jellis-vectors (yglaxwekbyfjmbhcwqhi)

**Tables (11):**
| Table | Purpose |
|-------|---------|
| `tenants` | Businesses (multi-tenant root) |
| `customers` | End customers with JSONB industry_fields |
| `technicians` | Service workers |
| `services` | Service catalog |
| `appointments` | Jobs with status tracking |
| `communication_logs` | SMS/email history |
| `reviews` | Review tracking |
| `payments` | Stripe-ready |
| `leads` | Lead pipeline |
| `quotes` | Quote generation |
| `user_profiles` | Auth users → tenant mapping |
| `ai_media` | AI-generated images/videos library |

**Storage:**
- `media` bucket - 50MB file limit, images + videos

---

## API Layer (Edge Functions)

Base URL: `https://yglaxwekbyfjmbhcwqhi.supabase.co/functions/v1`

| Function | Purpose |
|----------|---------|
| `technician-schedule` | Get technician's daily jobs |
| `update-job-status` | Start/complete/delay appointments |
| `notify-delay` | Send "running late" SMS |
| `public-booking` | Customer self-service booking |

---

## Deployed Apps

### Admin Dashboard (ConvertLabs replacement)
- **URL:** https://vck4b0t25wgd.space.minimax.io
- **Features:** Lead kanban, customers, calendar, quotes, reviews, settings
- **Auth:** Not yet implemented (demo mode)

### Technician Mobile App
- **URL:** https://qpzi6faccegl.space.minimax.io
- **Test ID:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- **Features:** Daily schedule, job details, start/complete/delay

### Customer Booking Portal
- **URL:** https://4w71xzq5ogw8.space.minimax.io/?tenant=bravo-maids
- **Features:** 3-step booking (select service → pick time → enter details)
- **Multi-tenant:** Change `?tenant=` parameter for different businesses

---

## What's Left (Next Session)

### Priority 1: Production Security
- [ ] Add Supabase Auth UI to admin dashboard
- [ ] Add login to technician app
- [ ] Rate limiting on public endpoints

### Priority 2: Integrations
- [ ] Connect Twilio (need SID + Token)
- [ ] Connect Resend (need API key)
- [ ] Connect your Veo3/Sora workflow to `ai_media` table

### Priority 3: Data
- [ ] Export customers from ConvertLabs
- [ ] Import into Supabase
- [ ] Add Clean Town & Country as second tenant

---

## AI Media Workflow (New)

Your existing Veo3/Sora workflow should store output here:

```
INSERT INTO ai_media (tenant_id, media_type, url, prompt, model, brand)
VALUES ('tenant-uuid', 'video', 'https://...', 'prompt used', 'veo3', 'bravo-maids');
```

Then review in admin dashboard → pick best → upload to Buffer.

---

## Code Locations

```
/workspace/code/supabase/
├── technician-schedule.ts
├── update-job-status.ts
├── notify-delay.ts
└── public-booking.ts
```

---

## Next Session Quick Start

```
Read /workspace/docs/SERVICE-CRM-PROJECT.md for context on my Local Service CRM.
```

Then pick a task:
1. Add Supabase Auth
2. Connect Twilio SMS
3. Connect Resend email
4. Import ConvertLabs data
5. Add second tenant (Clean Town & Country)

---

## URLs Quick Reference

| What | URL |
|------|-----|
| Admin Dashboard | https://vck4b0t25wgd.space.minimax.io |
| Technician App | https://qpzi6faccegl.space.minimax.io |
| Booking Portal | https://4w71xzq5ogw8.space.minimax.io/?tenant=bravo-maids |
| Supabase Dashboard | https://supabase.com/dashboard/project/yglaxwekbyfjmbhcwqhi |
| API Base | https://yglaxwekbyfjmbhcwqhi.supabase.co/functions/v1 |

---

## Cost Summary

| Before | After |
|--------|-------|
| ConvertLabs $297-497 | $0 |
| Blotato $29 | Buffer $15 |
| Multiple DBs | Supabase Pro $25 |
| **~$350-550/mo** | **~$40/mo** |

**Annual savings: $3,700 - $6,100**
