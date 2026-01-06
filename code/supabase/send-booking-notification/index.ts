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

        if (!tenant.twilio_account_sid || !tenant.twilio_auth_token || !tenant.twilio_phone_number) {
            return new Response(JSON.stringify({
                data: { sent: false, reason: 'Twilio not configured' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Format date/time
        const startDate = new Date(appt.scheduled_start);
        const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        // Customer confirmation message
        const customerMsg = `Hi ${customer.first_name}! Your ${service.name} with ${tenant.name} is confirmed for ${dateStr} at ${timeStr}. Reply HELP for assistance.`;

        // Send SMS via Twilio
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${tenant.twilio_account_sid}/Messages.json`;
        const auth = btoa(`${tenant.twilio_account_sid}:${tenant.twilio_auth_token}`);

        const results = [];

        // Send to customer
        if (customer.phone) {
            const formData = new URLSearchParams();
            formData.append('To', customer.phone);
            formData.append('From', tenant.twilio_phone_number);
            formData.append('Body', customerMsg);

            const twilioResponse = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            });

            if (twilioResponse.ok) {
                const result = await twilioResponse.json();
                results.push({ to: 'customer', sid: result.sid });
            }
        }

        return new Response(JSON.stringify({
            data: { sent: true, results }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Notification error:', error.message);
        return new Response(JSON.stringify({
            error: { message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
