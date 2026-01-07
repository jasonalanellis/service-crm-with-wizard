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
    const { action, tenantId, phone, rating, improvement, bug } = await req.json();
    
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Action: store feedback in user_feedback table
    if (action === 'store') {
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/user_feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          rating: rating,
          improvement_suggestion: improvement,
          bug_report: bug
        })
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        throw new Error(`Failed to store feedback: ${errorText}`);
      }

      const feedbackData = await insertResponse.json();

      return new Response(JSON.stringify({
        success: true,
        data: { feedback: feedbackData[0] }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: send feedback request SMS
    if (action === 'request') {
      if (!phone || !tenantId) {
        throw new Error('Phone and tenant ID required for feedback request');
      }

      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

      const message = `Hey! How's your booking page working out? Reply with:\n1-5 rating\nOne thing we could improve\nAny bugs?\n\nExample: "5, faster loading, none"`;

      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.length === 10) formattedPhone = '1' + formattedPhone;
      if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone;

      if (!twilioSid || !twilioToken || !twilioPhone) {
        console.log('Feedback SMS would be sent to:', formattedPhone);
        return new Response(JSON.stringify({
          success: true,
          data: { message: 'Feedback request queued', phone: formattedPhone, demo: true }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = btoa(`${twilioSid}:${twilioToken}`);

      const formData = new URLSearchParams();
      formData.append('To', formattedPhone);
      formData.append('From', twilioPhone);
      formData.append('Body', message);

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
        throw new Error(result.message || 'Failed to send feedback request');
      }

      return new Response(JSON.stringify({
        success: true,
        data: { message: 'Feedback request sent', sid: result.sid }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: get feedback for tenant from user_feedback table
    if (action === 'get') {
      const getResponse = await fetch(
        `${supabaseUrl}/rest/v1/user_feedback?tenant_id=eq.${tenantId}&order=created_at.desc`,
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          }
        }
      );

      if (!getResponse.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const feedbackList = await getResponse.json();

      return new Response(JSON.stringify({
        success: true,
        data: { feedback: feedbackList }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');

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
