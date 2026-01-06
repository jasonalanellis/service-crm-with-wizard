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
    const { appointment_id, action, data } = await req.json();
    
    if (!appointment_id || !action) {
      return new Response(JSON.stringify({ error: 'appointment_id and action required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    let updateData: any = { updated_at: new Date().toISOString() };

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
        if (data?.checklist) updateData.checklist = data.checklist;
        break;
      case 'delay':
        updateData.delay_minutes = data?.minutes || 15;
        updateData.delay_notified = false; // Will be set true after SMS sent
        break;
      case 'cancel':
        updateData.status = 'cancelled';
        if (data?.notes) updateData.internal_notes = data.notes;
        break;
      case 'reschedule':
        updateData.status = 'rescheduled';
        if (data?.new_time) updateData.scheduled_start = data.new_time;
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action. Use: start, complete, delay, cancel, reschedule' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Update the appointment
    const response = await fetch(
      `${supabaseUrl}/rest/v1/appointments?id=eq.${appointment_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      }
    );

    const result = await response.json();

    // If delay action, trigger notification function
    if (action === 'delay') {
      const notifyUrl = `${supabaseUrl}/functions/v1/notify-delay`;
      fetch(notifyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ appointment_id, delay_minutes: updateData.delay_minutes })
      }).catch(e => console.error('Delay notification error:', e));
    }

    return new Response(JSON.stringify({ 
      success: true,
      action,
      appointment: result[0]
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
