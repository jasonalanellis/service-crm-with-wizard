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
    
    if (!technician_id || !date) {
      return new Response(JSON.stringify({ error: 'Missing technician_id or date' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey };

    // Get appointments for this technician on this date
    const appointmentsRes = await fetch(
      `${supabaseUrl}/rest/v1/appointments?technician_id=eq.${technician_id}&scheduled_start=gte.${date}T00:00:00&scheduled_start=lt.${date}T23:59:59&order=scheduled_start.asc`,
      { headers }
    );
    const appointments = await appointmentsRes.json();
    if (!Array.isArray(appointments) || appointments.length === 0) {
      return new Response(JSON.stringify({ date, total_jobs: 0, schedule: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get all unique customer IDs and service IDs
    const customerIds = [...new Set(appointments.map((a: any) => a.customer_id))];
    const serviceIds = [...new Set(appointments.map((a: any) => a.service_id))];

    // Fetch customers
    const customersRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=in.(${customerIds.join(',')})`,
      { headers }
    );
    const customers = await customersRes.json();
    const customerMap = new Map((customers || []).map((c: any) => [c.id, c]));

    // Fetch services
    const servicesRes = await fetch(
      `${supabaseUrl}/rest/v1/services?id=in.(${serviceIds.join(',')})`,
      { headers }
    );
    const services = await servicesRes.json();
    const serviceMap = new Map((services || []).map((s: any) => [s.id, s]));

    // Build schedule
    const schedule = appointments.map((a: any) => {
      const c = customerMap.get(a.customer_id) || {};
      const s = serviceMap.get(a.service_id) || {};
      return {
        appointment_id: a.id,
        scheduled_time: a.scheduled_start,
        estimated_duration: s.duration_minutes || 60,
        status: a.status,
        job_type: s.name || 'Service',
        notes: a.notes || '',
        internal_notes: a.internal_notes || '',
        customer: {
          id: c.id || a.customer_id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Customer',
          phone: c.phone || '',
          email: c.email || '',
          address: c.address_line1 ? `${c.address_line1}, ${c.city || ''}, ${c.state || ''} ${c.zip || ''}` : '',
          industry_fields: c.industry_fields || {},
        },
      };
    });

    return new Response(JSON.stringify({ date, total_jobs: schedule.length, schedule }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
