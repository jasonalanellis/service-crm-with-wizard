Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { appointment_id, action, data } = await req.json();
    
    if (!appointment_id || !action) {
      return new Response(JSON.stringify({ error: 'Missing appointment_id or action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    let updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'start':
        updateData.status = 'in_progress';
        updateData.actual_start = new Date().toISOString();
        break;
      case 'complete':
        updateData.status = 'completed';
        updateData.actual_end = new Date().toISOString();
        if (data?.notes) updateData.notes = data.notes;
        if (data?.photos) updateData.photos = data.photos;
        if (data?.signature_url) updateData.signature_url = data.signature_url;
        break;
      case 'delay':
        updateData.delay_notified = true;
        updateData.delay_minutes = data?.minutes || 15;
        // In production, would trigger SMS notification here
        break;
      case 'cancel':
        updateData.status = 'cancelled';
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/appointments?id=eq.${appointment_id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Update failed: ${err}`);
    }

    return new Response(JSON.stringify({ success: true, action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
