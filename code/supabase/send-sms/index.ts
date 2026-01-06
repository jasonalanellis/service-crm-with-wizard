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
        const { tenantId, to, message } = await req.json();

        if (!tenantId || !to || !message) {
            throw new Error('tenantId, to, and message are required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Fetch tenant's Twilio credentials
        const tenantResponse = await fetch(
            `${supabaseUrl}/rest/v1/tenants?id=eq.${tenantId}&select=twilio_account_sid,twilio_auth_token,twilio_phone_number`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey!,
                }
            }
        );

        const tenants = await tenantResponse.json();
        if (!tenants || tenants.length === 0) {
            throw new Error('Tenant not found');
        }

        const { twilio_account_sid, twilio_auth_token, twilio_phone_number } = tenants[0];
        
        if (!twilio_account_sid || !twilio_auth_token || !twilio_phone_number) {
            // Log but don't fail - SMS is optional
            console.log('Twilio not configured for tenant:', tenantId);
            return new Response(JSON.stringify({
                data: { sent: false, reason: 'Twilio not configured' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Send SMS via Twilio
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Messages.json`;
        const auth = btoa(`${twilio_account_sid}:${twilio_auth_token}`);

        const formData = new URLSearchParams();
        formData.append('To', to);
        formData.append('From', twilio_phone_number);
        formData.append('Body', message);

        const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (!twilioResponse.ok) {
            const errorData = await twilioResponse.text();
            throw new Error(`Twilio error: ${errorData}`);
        }

        const result = await twilioResponse.json();

        return new Response(JSON.stringify({
            data: { sent: true, sid: result.sid }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('SMS error:', error.message);
        return new Response(JSON.stringify({
            error: { message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
