# Service CRM Project Log

**Quick Start:** Read this file for full context. Main doc: /workspace/docs/SERVICE-CRM-PROJECT.md

---
## URLS
- Admin: https://zmkjq00dtbcq.space.minimax.io
- Technician App: https://qpzi6faccegl.space.minimax.io
- Booking Portal: https://4w71xzq5ogw8.space.minimax.io/?tenant=bravo-maids
- Supabase: yglaxwekbyfjmbhcwqhi

---
## SESSION LOG

### Session 1 (Jan 6) - DONE
Built MVP: 11 tables, 3 apps, 4 edge functions, media bucket

### Session 2 (Jan 6, ~11pm) - DONE
- Reviewed 29 ConvertLabs UI screenshots
- Built all major feature pages:
  - ✅ Bookings, Service Providers, Payouts, Invoices
  - ✅ Providers Activity, Coupons, Services, Marketing, Reports
  - ✅ Settings: Notifications, Schedule, Payment, Portal
- Latest deploy: https://55x8ek30wzt0.space.minimax.io

---
## FEATURE BACKLOG (from ConvertLabs analysis)

### Priority 1 - Core Pages
- [x] Bookings list (date, client, address, provider, payment, revenue) ✅
- [x] Service Providers page (wage, rating, contact) ✅
- [ ] Providers Activity (today's jobs per provider)
- [ ] Payouts (track technician earnings)
- [ ] Invoices

### Priority 2 - Settings
- [ ] Services catalog (pricing tiers, extras, durations)
- [ ] Payment settings (auto-charge, fees, referrals)
- [ ] Time & Scheduling (business hours, blocked dates)
- [ ] Notifications config
- [ ] Portal settings

### Priority 3 - Other
- [ ] Marketing (leads, campaigns, analytics)
- [ ] Discounts
- [ ] Getting Started checklist

### Auth (needed before production)
- [ ] Supabase Auth on admin dashboard
- [ ] Login on technician app

---
## DECISIONS / NOTES
- Replacing ConvertLabs ($297-497/mo) with this CRM
- Two tenants: Bravo Maids, Clean Town & Country
- Using: Supabase, Buffer, Twilio, Resend

## PENDING FEATURES (Pre-GitHub)
### Smart Review System
- Trigger: Tech completes job → SMS "Rate 1-5"
- 5 stars: Tech photo + "Leave GBP review for tip!" + GBP link
- 4 stars: Thank you + improvement ask
- 1-3 stars: "This is Jason, the owner. Would you mind if I call?" → YES sends SMS to Jason
- Follow-ups: 24h reminder, 3 days final
- Dashboard: Review status tracking
- Manual trigger toggle

### Email Parsing (ConvertLabs)
- Gmail forwarding from support@bravomaids.com
- Parse: New Lead, New Booking emails from hello@convertlabs.io
- Insert to leads/appointments tables

### Config
- GBP Link: https://g.page/r/CXubSUgYwpLFEBM/review
- Jason's phone: 6185817272
- Tech photos: Stock cleaner photo + cleaner name (no individual photos)

---
## KEY FILES
- Full doc: /workspace/docs/SERVICE-CRM-PROJECT.md
- ConvertLabs screenshots: /workspace/imgs/cl_1.png through cl_29.png
- Code: /workspace/code/supabase/
- Apps: /workspace/service-crm/, /workspace/field-service-pwa/, /workspace/booking-portal/
