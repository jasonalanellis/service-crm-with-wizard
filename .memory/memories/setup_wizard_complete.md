# Magic Setup Wizard - COMPLETE (Production Ready)

## Status: Deployed
- URL: https://5anvobcycq9r.space.minimax.io
- `/setup` route is PUBLIC (no login required)

## Step Order (Updated):
1. Industry Selection (4 cards + Other with "other" value)
2. GBP Autofill
3. "Where should we send your link?" (Email - framed as delivery)
4. Brand Colors
5. Services (pre-populated)
6. Preview + Password + Phone
7. Get Your Link (SMS + booking URL)

## Production Features:
1. **Google Places API Integration** (lookup-gbp edge function)
   - Real business data from GBP URLs (name, address, phone)
   - Tested: Returns actual Starbucks data with address and phone
   
2. **Logo Upload to Supabase Storage** (upload-logo edge function)
   - Uploads to 'business-logos' bucket (2MB limit)
   - Returns permanent public URL
   
3. **SMS Sending** (send-sms edge function)
   - Production-ready Twilio integration
   - Works in demo mode until Twilio creds added
   - Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

## All 7 Steps:
1. Industry Selection (4 cards + expandable Other)
2. GBP URL autofill (real Google Places API)
3. Brand Color picker
4. Logo Upload (persistent storage)
5. Services (pre-populated by industry)
6. Preview
7. Get Link (SMS feature)

## Edge Functions Deployed:
- lookup-gbp: https://yglaxwekbyfjmbhcwqhi.supabase.co/functions/v1/lookup-gbp
- upload-logo: https://yglaxwekbyfjmbhcwqhi.supabase.co/functions/v1/upload-logo
- send-sms: https://yglaxwekbyfjmbhcwqhi.supabase.co/functions/v1/send-sms

## Test Account:
- Email: gujtgmih@minimax.com
- Password: CkPaSMqC6P
- Live URL: https://ihjuxu5zaspn.space.minimax.io
- Zip file: /workspace/service-crm-with-wizard.zip

## Features Implemented:
1. **New User Detection** - TenantContext checks if user has no tenant
2. **4-Step Wizard** - Business Info → Service → Hours → Done
3. **Database Creation** - Creates tenant and links to user profile
4. **Welcome Message** - Shows on dashboard after setup
5. **RLS Policy Fix** - Fixed infinite recursion in tenant policies

## Files Changed:
- src/components/SetupWizard.tsx (new - 446 lines)
- src/context/TenantContext.tsx (added needsSetup, refreshTenants)
- src/App.tsx (restructured MainApp/AuthenticatedApp)

## Test Account:
- Email: pwrufjfb@minimax.com
- Password: pc5aEjuK8O
