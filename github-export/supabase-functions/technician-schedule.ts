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
    const { technician_id, date } = await req.json();
    
    if (!technician_id) {
      return new Response(JSON.stringify({ error: 'technician_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get technician's schedule for the day
    const response = await fetch(
      `${supabaseUrl}/rest/v1/appointments?technician_id=eq.${technician_id}&scheduled_start=gte.${targetDate}T00:00:00&scheduled_start=lt.${targetDate}T23:59:59&order=scheduled_start.asc&select=*,customers(*),services(*)`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    const appointments = await response.json();

    // Format for mobile app
    const schedule = appointments.map((apt: any) => ({
      id: apt.id,
      time: apt.scheduled_start,
      end_time: apt.scheduled_end,
      status: apt.status,
      customer: {
        name: `${apt.customers.first_name} ${apt.customers.last_name}`,
        phone: apt.customers.phone,
        address: `${apt.customers.address_line1}, ${apt.customers.city}`,
        lat: apt.customers.lat,
        lng: apt.customers.lng,
        notes: apt.customers.notes,
        industry_fields: apt.customers.industry_fields
      },
      service: apt.services?.name || 'General Service',
      price: apt.price,
      notes: apt.notes,
      internal_notes: apt.internal_notes,
      checklist: apt.checklist,
      delay_minutes: apt.delay_minutes
    }));

    return new Response(JSON.stringify({ 
      date: targetDate,
      total_jobs: schedule.length,
      schedule 
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
