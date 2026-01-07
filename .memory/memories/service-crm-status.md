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

## PENDING FEATURES - FULL BUILD

### Config
- GBP Link: https://g.page/r/CXubSUgYwpLFEBM/review
- Jason's phone: 6185817272
- Tech photos: Stock cleaner photo + [Cleaner Name] dynamic
- Brand colors: Bravo Maids #37c170, CTC #0e9ede

### Phase 1: Smart Review System
- Trigger: Tech completes job → SMS "Rate 1-5"
- 5 stars: Stock photo + "[Name] cleaned today!" + GBP link + tip mention
- 4 stars: Thank you + improvement ask
- 1-3 stars: "This is Jason, the owner. Would you mind if I call?" → YES sends SMS to 6185817272
- Follow-ups: 24h reminder, 3 days final
- Dashboard: Review status tracking (Sent/Replied/Pending/Escalated)
- Manual trigger toggle

### Phase 2: Email Parsing (ConvertLabs)
- Gmail forwarding webhook
- Parse: New Lead, New Booking emails from hello@convertlabs.io
- Insert to leads/appointments tables

### Phase 3: Branding
- Logo upload per tenant
- Brand color picker per tenant
- Apply to sidebar, buttons, accents

### Phase 4: Automated Workflows (n8n)
- Smart rebooking: 14+ days since last clean → "Ready for next clean?"
- Win-back: 60 days inactive → personalized offer
- Birthday/anniversary: Auto discount/thank you
- Weather upsell: Rain + outdoor event → deep clean offer
- Referral nudge: After 5-star → referral link
- Quote follow-up: 48h no booking → reminder
- Payment reminder: Invoice unpaid 3+ days
- Recurring confirmation: 2 days before scheduled

### Phase 5: RAG/AI (n8n)
- Customer Q&A bot from knowledge base
- Smart response suggestions
- Lead qualification scoring
- Complaint resolution suggestions

---
## KEY FILES
- Full doc: /workspace/docs/SERVICE-CRM-PROJECT.md
- ConvertLabs screenshots: /workspace/imgs/cl_1.png through cl_29.png
- Code: /workspace/code/supabase/
- Apps: /workspace/service-crm/, /workspace/field-service-pwa/, /workspace/booking-portal/
