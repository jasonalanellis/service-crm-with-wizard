# Service CRM - n8n Workflow Templates

## Setup Requirements

1. **n8n Instance** - Self-hosted or n8n.cloud
2. **Credentials to configure:**
   - Supabase API (URL + Service Role Key)
   - Twilio (Account SID, Auth Token, Phone Number)
   - Resend (for emails) or SendGrid

## Available Workflows

### 1. Smart Rebooking (14+ days inactive)
- **Trigger:** Scheduled (daily at 9am)
- **Logic:** Find customers with last booking > 14 days ago
- **Action:** Send SMS "Ready for your next clean?"

### 2. Win-Back Campaign (60 days inactive)
- **Trigger:** Scheduled (weekly)
- **Logic:** Find customers with last booking > 60 days ago
- **Action:** Send personalized offer email/SMS

### 3. Birthday/Anniversary Messages
- **Trigger:** Scheduled (daily at 8am)
- **Logic:** Find customers with matching birth date
- **Action:** Send birthday discount SMS

### 4. Quote Follow-Up (48h)
- **Trigger:** Scheduled (every 4 hours)
- **Logic:** Find quotes sent > 48h ago with no booking
- **Action:** Send reminder SMS

### 5. Payment Reminder (3+ days overdue)
- **Trigger:** Scheduled (daily)
- **Logic:** Find unpaid invoices > 3 days old
- **Action:** Send friendly payment reminder

### 6. Recurring Confirmation (2 days before)
- **Trigger:** Scheduled (daily at 10am)
- **Logic:** Find appointments scheduled for 2 days from now
- **Action:** Send confirmation SMS "See you Thursday at 9am!"

### 7. Referral Nudge (after 5-star review)
- **Trigger:** Webhook from review system
- **Logic:** When 5-star review received
- **Action:** Send referral request 24h later

### 8. Weather-Based Upsell
- **Trigger:** Scheduled (daily)
- **Logic:** Check weather API for rain/storms
- **Action:** Send "Need a deep clean after the storm?" to recent customers

## Supabase Connection

All workflows connect to Supabase using:
- **URL:** `https://yglaxwekbyfjmbhcwqhi.supabase.co`
- **Method:** HTTP Request node with Bearer token auth

### Example Query: Find Inactive Customers
```sql
SELECT c.*, MAX(a.scheduled_start) as last_booking
FROM customers c
LEFT JOIN appointments a ON c.id = a.customer_id
WHERE c.tenant_id = 'YOUR_TENANT_ID'
GROUP BY c.id
HAVING MAX(a.scheduled_start) < NOW() - INTERVAL '14 days'
```

## Import Instructions

1. Open n8n
2. Click "Import from File"
3. Select the JSON workflow file
4. Configure credentials
5. Activate workflow
