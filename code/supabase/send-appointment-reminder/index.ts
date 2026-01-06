Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Find appointments scheduled for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = tomorrow.toISOString().split('T')[0] + 'T00:00:00';
    const tomorrowEnd = tomorrow.toISOString().split('T')[0] + 'T23:59:59';

    const apptRes = await fetch(
      `${supabaseUrl}/rest/v1/appointments?scheduled_start=gte.${tomorrowStart}&scheduled_start=lte.${tomorrowEnd}&status=eq.scheduled&select=*,customer:customers(*),service:services(*),tenant:tenants(*)`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        }
      }
    );

    const appointments = await apptRes.json();
    const results: any[] = [];

    for (const appt of appointments) {
      if (!appt.customer?.phone && !appt.customer?.email) continue;

      const tenant = appt.tenant;
      const serviceName = appt.service?.name || 'your appointment';
      const date = new Date(appt.scheduled_start).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      const time = new Date(appt.scheduled_start).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      // Send SMS reminder
      if (appt.customer?.phone && tenant?.twilio_account_sid) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              tenantId: tenant.id,
              to: appt.customer.phone,
              message: `Reminder: Your ${serviceName} with ${tenant.name} is scheduled for ${date} at ${time}. Reply HELP for assistance.`,
            }),
          });
          results.push({ id: appt.id, sms: 'sent' });
        } catch (e) {
          results.push({ id: appt.id, sms: 'failed', error: e.message });
        }
      }

      // Send email reminder
      if (appt.customer?.email && tenant?.resend_api_key) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              tenantId: tenant.id,
              to: appt.customer.email,
              subject: `Reminder: ${serviceName} Tomorrow`,
              html: `
                <h2>Appointment Reminder</h2>
                <p>Hi ${appt.customer.first_name},</p>
                <p>This is a friendly reminder about your upcoming appointment:</p>
                <ul>
                  <li><strong>Service:</strong> ${serviceName}</li>
                  <li><strong>Date:</strong> ${date}</li>
                  <li><strong>Time:</strong> ${time}</li>
                </ul>
                <p>If you need to reschedule, please contact us.</p>
                <p>Thank you,<br>${tenant.name}</p>
              `,
            }),
          });
          results.push({ id: appt.id, email: 'sent' });
        } catch (e) {
          results.push({ id: appt.id, email: 'failed', error: e.message });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: appointments.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
