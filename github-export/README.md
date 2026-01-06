# Local Service CRM

A complete CRM system for local service businesses (cleaning, pool service, HVAC, etc.)

## Apps

| App | Directory | Purpose |
|-----|-----------|---------|
| Admin Dashboard | `/local-service-crm` | ConvertLabs replacement - leads, customers, calendar, quotes |
| Field Service App | `/field-service-app` | Mobile PWA for technicians |
| Booking Portal | `/booking-portal` | Customer self-service booking |

## Supabase

- `/supabase-functions` - Edge functions (APIs)
- `/supabase-migrations` - Database schema migrations

## Deployment

### Each app (Vercel):

```bash
cd local-service-crm  # or field-service-app, booking-portal
npm install
npm run build
# Deploy dist/ folder to Vercel
```

### Environment Variables (set in Vercel):

```
VITE_SUPABASE_URL=https://yglaxwekbyfjmbhcwqhi.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Custom Domains (suggested)

- `app.localservicestack.com` → Admin Dashboard
- `field.localservicestack.com` → Field Service App  
- `book.localservicestack.com` → Booking Portal

## Database

Supabase project: `jellis-vectors`

Tables: tenants, customers, technicians, services, appointments, communication_logs, reviews, payments, leads, quotes, user_profiles, ai_media
