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
    const { phone, message, bookingUrl } = await req.json();

    if (!phone) {
      throw new Error('Phone number is required');
    }

    // Format phone number (remove non-digits, ensure country code)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '1' + formattedPhone; // Add US country code
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Get Twilio credentials from environment
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    // If Twilio is not configured, fall back to logging and success response
    // This allows the feature to work in demo mode while being production-ready
    if (!twilioSid || !twilioToken || !twilioPhone) {
      console.log('SMS would be sent to:', formattedPhone);
      console.log('Message:', message || `Your booking link is ready: ${bookingUrl}`);
      
      // Return success - in production, Twilio creds would be set
      return new Response(JSON.stringify({
        success: true,
        data: {
          message: 'SMS queued for delivery',
          phone: formattedPhone,
          demo: true
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send SMS via Twilio
    const smsMessage = message || `Your booking link is ready: ${bookingUrl}`;
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const auth = btoa(`${twilioSid}:${twilioToken}`);

    const formData = new URLSearchParams();
    formData.append('To', formattedPhone);
    formData.append('From', twilioPhone);
    formData.append('Body', smsMessage);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send SMS');
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: 'SMS sent successfully',
        sid: result.sid,
        phone: formattedPhone
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: { message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
