Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Find reviews needing 24h reminder
    const reminder1Res = await fetch(
      `${supabaseUrl}/rest/v1/review_requests?status=eq.sent&sent_at=lt.${oneDayAgo}&sent_at=gt.${threeDaysAgo}&select=*,tenant:tenants(name)`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const reminder1Reviews = await reminder1Res.json();

    // Find reviews needing 3-day reminder
    const reminder2Res = await fetch(
      `${supabaseUrl}/rest/v1/review_requests?status=eq.reminded_1&reminder_1_at=lt.${threeDaysAgo}&reminder_1_at=gt.${sevenDaysAgo}&select=*,tenant:tenants(name)`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const reminder2Reviews = await reminder2Res.json();

    // Find expired reviews (7+ days, no response)
    const expiredRes = await fetch(
      `${supabaseUrl}/rest/v1/review_requests?status=in.(sent,reminded_1,reminded_2)&sent_at=lt.${sevenDaysAgo}`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const expiredReviews = await expiredRes.json();

    let sent1 = 0, sent2 = 0, expired = 0;

    // Send 24h reminders
    for (const review of reminder1Reviews || []) {
      const message = `Hi! Just checking in - how was your recent cleaning? Reply 1-5 to rate. - ${review.tenant?.name || 'Your cleaning service'}`;
      
      if (twilioSid && twilioAuth && twilioPhone) {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const formData = new URLSearchParams();
        formData.append('To', review.customer_phone);
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

      await fetch(`${supabaseUrl}/rest/v1/review_requests?id=eq.${review.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'reminded_1',
          reminder_1_at: now.toISOString()
        })
      });
      sent1++;
    }

    // Send 3-day reminders
    for (const review of reminder2Reviews || []) {
      const message = `Last chance! We'd love to hear about your cleaning experience. Reply 1-5. - ${review.tenant?.name || 'Your cleaning service'}`;
      
      if (twilioSid && twilioAuth && twilioPhone) {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const formData = new URLSearchParams();
        formData.append('To', review.customer_phone);
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

      await fetch(`${supabaseUrl}/rest/v1/review_requests?id=eq.${review.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'reminded_2',
          reminder_2_at: now.toISOString()
        })
      });
      sent2++;
    }

    // Mark expired
    for (const review of expiredReviews || []) {
      await fetch(`${supabaseUrl}/rest/v1/review_requests?id=eq.${review.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'expired' })
      });
      expired++;
    }

    return new Response(JSON.stringify({ 
      success: true,
      reminder_1_sent: sent1,
      reminder_2_sent: sent2,
      expired: expired
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
