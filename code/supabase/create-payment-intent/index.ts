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
        const { amount, currency = 'usd', tenantId, customerEmail, description } = await req.json();

        if (!amount || amount <= 0) {
            throw new Error('Valid amount is required');
        }
        if (!tenantId) {
            throw new Error('Tenant ID is required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // Fetch tenant's Stripe secret key from database
        const tenantResponse = await fetch(
            `${supabaseUrl}/rest/v1/tenants?id=eq.${tenantId}&select=stripe_secret_key`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey!,
                }
            }
        );

        const tenants = await tenantResponse.json();
        if (!tenants || tenants.length === 0 || !tenants[0].stripe_secret_key) {
            throw new Error('Stripe not configured for this tenant');
        }

        const stripeSecretKey = tenants[0].stripe_secret_key;

        // Create payment intent with Stripe
        const stripeParams = new URLSearchParams();
        stripeParams.append('amount', Math.round(amount * 100).toString());
        stripeParams.append('currency', currency);
        stripeParams.append('payment_method_types[]', 'card');
        stripeParams.append('metadata[tenant_id]', tenantId);
        stripeParams.append('metadata[customer_email]', customerEmail || '');
        if (description) {
            stripeParams.append('description', description);
        }

        const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: stripeParams.toString()
        });

        if (!stripeResponse.ok) {
            const errorData = await stripeResponse.text();
            throw new Error(`Stripe error: ${errorData}`);
        }

        const paymentIntent = await stripeResponse.json();

        return new Response(JSON.stringify({
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: { message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
