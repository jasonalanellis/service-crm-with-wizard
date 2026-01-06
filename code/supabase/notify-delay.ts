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
    const { appointment_id, delay_minutes } = await req.json();
    
    if (!appointment_id) {
      return new Response(JSON.stringify({ error: 'appointment_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get appointment with customer and tenant details
    const aptResponse = await fetch(
      `${supabaseUrl}/rest/v1/appointments?id=eq.${appointment_id}&select=*,customers(*),tenants:tenant_id(*)`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    const appointments = await aptResponse.json();
    if (!appointments.length) {
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apt = appointments[0];
    const customer = apt.customers;
    const tenant = apt.tenants;

    // Format delay message
    const scheduledTime = new Date(apt.scheduled_start);
    const newTime = new Date(scheduledTime.getTime() + (delay_minutes || 15) * 60000);
    const timeStr = newTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const message = `Hi ${customer.first_name}, this is ${tenant.name}. We're running about ${delay_minutes || 15} minutes behind schedule. Your technician should arrive around ${timeStr}. We apologize for any inconvenience!`;

    // Log the communication (SMS integration would go here)
    // For now, we'll store it and you can connect Twilio/your preferred SMS provider
    const logResponse = await fetch(
      `${supabaseUrl}/rest/v1/communication_logs`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: apt.tenant_id,
          customer_id: customer.id,
          appointment_id: apt.id,
          channel: 'sms',
          direction: 'outbound',
          to_address: customer.phone,
          from_address: tenant.phone,
          body: message,
          status: 'queued', // Change to 'sent' when SMS provider connected
          template_name: 'delay_notification'
        })
      }
    );

    // Mark appointment as notified
    await fetch(
      `${supabaseUrl}/rest/v1/appointments?id=eq.${appointment_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ delay_notified: true })
      }
    );

    // TODO: Add your SMS provider here (Twilio, etc.)
    // const twilioSid = Deno.env.get('TWILIO_SID');
    // const twilioToken = Deno.env.get('TWILIO_TOKEN');
    // ... send actual SMS

    return new Response(JSON.stringify({ 
      success: true,
      message_sent: message,
      customer_phone: customer.phone,
      new_eta: timeStr,
      note: 'SMS queued - connect Twilio to send actual messages'
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
