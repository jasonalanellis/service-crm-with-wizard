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
      return new Response(JSON.stringify({ error: 'appointmentId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Fetch the original appointment
    const apptRes = await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}&select=*`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    });
    
    const appointments = await apptRes.json();
    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const originalAppt = appointments[0];
    const frequency = originalAppt.recurring_frequency;

    if (!frequency || frequency === 'none') {
      return new Response(JSON.stringify({ message: 'No recurring frequency set', created: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate interval in days
    let intervalDays = 7;
    switch (frequency) {
      case 'weekly': intervalDays = 7; break;
      case 'biweekly': intervalDays = 14; break;
      case 'monthly': intervalDays = 30; break;
    }

    // Generate appointments for next 3 months (~90 days)
    const newAppointments = [];
    const startDate = new Date(originalAppt.scheduled_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 90);

    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + intervalDays);

    while (currentDate <= endDate) {
      const newAppt = {
        tenant_id: originalAppt.tenant_id,
        customer_id: originalAppt.customer_id,
        service_id: originalAppt.service_id,
        scheduled_date: currentDate.toISOString().split('T')[0],
        scheduled_time: originalAppt.scheduled_time,
        duration_minutes: originalAppt.duration_minutes,
        status: 'scheduled',
        notes: originalAppt.notes,
        address: originalAppt.address,
        recurring_frequency: frequency,
        parent_appointment_id: originalAppt.id,
      };
      newAppointments.push(newAppt);
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    if (newAppointments.length === 0) {
      return new Response(JSON.stringify({ message: 'No future appointments to create', created: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Insert all recurring appointments
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/appointments`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(newAppointments)
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Failed to insert appointments: ${errText}`);
    }

    const created = await insertRes.json();

    return new Response(JSON.stringify({ 
      message: `Created ${created.length} recurring appointments`,
      created: created.length,
      appointments: created.map((a: any) => ({ id: a.id, date: a.scheduled_date }))
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
