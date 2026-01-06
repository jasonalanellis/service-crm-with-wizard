Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { appointmentId } = await req.json();

        if (!appointmentId) {
            throw new Error('appointmentId is required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Fetch appointment with related data
        const appointmentResponse = await fetch(
            `${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}&select=*,customer:customers(*),service:services(*),tenant:tenants(*)`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey!,
                }
            }
        );

        const appointments = await appointmentResponse.json();
        if (!appointments || appointments.length === 0) {
            throw new Error('Appointment not found');
        }

        const appt = appointments[0];
        const tenant = appt.tenant;
        const customer = appt.customer;
        const service = appt.service;

        if (!tenant.resend_api_key) {
            return new Response(JSON.stringify({
                data: { sent: false, reason: 'Email not configured' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Format date/time
        const startDate = new Date(appt.scheduled_start);
        const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        const html = `
<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#2563eb;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px}.detail{margin:10px 0;padding:10px;background:white;border-radius:4px}.label{color:#6b7280;font-size:14px}.value{font-weight:600;font-size:16px}.footer{text-align:center;margin-top:20px;color:#9ca3af;font-size:12px}</style></head>
<body>
<div class="container">
<div class="header"><h1>Booking Confirmed!</h1></div>
<div class="content">
<p>Hi ${customer.first_name},</p>
<p>Your appointment with <strong>${tenant.name}</strong> has been confirmed.</p>
<div class="detail"><div class="label">Service</div><div class="value">${service.name}</div></div>
<div class="detail"><div class="label">Date</div><div class="value">${dateStr}</div></div>
<div class="detail"><div class="label">Time</div><div class="value">${timeStr}</div></div>
<div class="detail"><div class="label">Duration</div><div class="value">${service.duration} minutes</div></div>
<div class="detail"><div class="label">Total</div><div class="value">$${appt.price}</div></div>
<p style="margin-top:20px">If you need to reschedule or cancel, please contact us.</p>
</div>
<div class="footer">© ${new Date().getFullYear()} ${tenant.name}</div>
</div>
</body>
</html>`;

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tenant.resend_api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `${tenant.name} <noreply@resend.dev>`,
                to: [customer.email],
                subject: `Booking Confirmed - ${service.name} on ${dateStr}`,
                html
            })
        });

        if (!resendResponse.ok) {
            const errorData = await resendResponse.text();
            throw new Error(`Resend error: ${errorData}`);
        }

        const result = await resendResponse.json();

        return new Response(JSON.stringify({
            data: { sent: true, id: result.id }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Email notification error:', error.message);
        return new Response(JSON.stringify({
            error: { message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
