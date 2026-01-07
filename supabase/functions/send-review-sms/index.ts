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
    const { appointment_id, manual_trigger } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    // Fetch appointment with customer and tenant details
    const appointmentRes = await fetch(
      `${supabaseUrl}/rest/v1/appointments?id=eq.${appointment_id}&select=*,customer:customers(*),tenant:tenants(*),technician:technicians(*)`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const appointments = await appointmentRes.json();
    
    if (!appointments || appointments.length === 0) {
      throw new Error('Appointment not found');
    }
    
    const apt = appointments[0];
    const tenant = apt.tenant;
    const customer = apt.customer;
    const technician = apt.technician;
    
    if (!tenant.review_sms_enabled && !manual_trigger) {
      return new Response(JSON.stringify({ success: false, message: 'Review SMS disabled for tenant' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const customerPhone = customer.phone;
    if (!customerPhone) {
      throw new Error('Customer phone not found');
    }

    // Create review request record
    const reviewRequest = {
      tenant_id: apt.tenant_id,
      appointment_id: apt.id,
      customer_id: apt.customer_id,
      technician_id: apt.technician_id,
      technician_name: technician?.name || 'Your cleaner',
      customer_phone: customerPhone,
      status: 'sent',
      sent_at: new Date().toISOString()
    };

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/review_requests`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(reviewRequest)
    });
    
    const insertedReview = await insertRes.json();

    // Send SMS via Twilio
    const techName = technician?.name || 'Your cleaner';
    const message = `Hi ${customer.first_name}! How was ${techName} today? Reply with a number 1-5 (5 being excellent). - ${tenant.name}`;
    
    if (twilioSid && twilioAuth && twilioPhone) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const formData = new URLSearchParams();
      formData.append('To', customerPhone);
      formData.append('From', twilioPhone);
      formData.append('Body', message);

      await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuth}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
    }

    // Log automation
    await fetch(`${supabaseUrl}/rest/v1/automation_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_id: apt.tenant_id,
        automation_type: 'review_request',
        trigger_type: manual_trigger ? 'manual' : 'job_complete',
        target_id: apt.id,
        target_type: 'appointment',
        customer_id: apt.customer_id,
        message_type: 'sms',
        message_content: message,
        status: 'sent'
      })
    });

    return new Response(JSON.stringify({ 
      success: true, 
      review_request_id: insertedReview[0]?.id,
      message: 'Review SMS sent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
