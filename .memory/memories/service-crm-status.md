# Service CRM Project Log

**Quick Start:** Read this file for full context. Main doc: /workspace/docs/SERVICE-CRM-PROJECT.md

---
## URLS
- Admin: https://vck4b0t25wgd.space.minimax.io
- Technician App: https://qpzi6faccegl.space.minimax.io
- Booking Portal: https://4w71xzq5ogw8.space.minimax.io/?tenant=bravo-maids
- Supabase: yglaxwekbyfjmbhcwqhi

---
## SESSION LOG

### Session 1 (Jan 6) - DONE
Built MVP: 11 tables, 3 apps, 4 edge functions, media bucket

### Session 2 (Jan 6, ~11pm) - IN PROGRESS
- Reviewed 29 ConvertLabs UI screenshots (saved in /workspace/imgs/cl_*.png)
- Analyzed missing features (see below)

---
## FEATURE BACKLOG (from ConvertLabs analysis)

### Priority 1 - Core Pages
- [ ] Bookings list (date, client, address, provider, payment, revenue)
- [ ] Service Providers page (wage, rating, contact)
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

---
## KEY FILES
- Full doc: /workspace/docs/SERVICE-CRM-PROJECT.md
- ConvertLabs screenshots: /workspace/imgs/cl_1.png through cl_29.png
- Code: /workspace/code/supabase/
- Apps: /workspace/service-crm/, /workspace/field-service-pwa/, /workspace/booking-portal/
