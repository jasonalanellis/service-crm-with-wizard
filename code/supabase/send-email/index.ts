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
        const { tenantId, to, subject, html, text } = await req.json();

        if (!tenantId || !to || !subject) {
            throw new Error('tenantId, to, and subject are required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Fetch tenant's Resend API key
        const tenantResponse = await fetch(
            `${supabaseUrl}/rest/v1/tenants?id=eq.${tenantId}&select=resend_api_key,name`,
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

        const { resend_api_key, name: tenantName } = tenants[0];
        
        if (!resend_api_key) {
            console.log('Resend not configured for tenant:', tenantId);
            return new Response(JSON.stringify({
                data: { sent: false, reason: 'Email not configured' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resend_api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `${tenantName} <noreply@resend.dev>`,
                to: [to],
                subject,
                html: html || `<p>${text}</p>`,
                text: text || subject
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
        console.error('Email error:', error.message);
        return new Response(JSON.stringify({
            error: { message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
