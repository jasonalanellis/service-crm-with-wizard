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
    const { quoteId, amount, customerEmail, description, successUrl, cancelUrl } = await req.json();

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': description || 'Service Quote',
        'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': successUrl || 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url': cancelUrl || 'https://example.com/cancel',
        'customer_email': customerEmail || '',
        'metadata[quote_id]': quoteId || '',
      }),
    });

    const session = await response.json();

    if (!response.ok) {
      throw new Error(session.error?.message || 'Failed to create checkout session');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      checkoutUrl: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
