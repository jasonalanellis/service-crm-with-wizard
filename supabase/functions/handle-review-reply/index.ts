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
    // Twilio sends form data
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const body = (formData.get('Body') as string || '').trim();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    // Find the most recent pending review request for this phone
    const reviewRes = await fetch(
      `${supabaseUrl}/rest/v1/review_requests?customer_phone=eq.${encodeURIComponent(from)}&status=in.(sent,reminded_1,reminded_2)&order=created_at.desc&limit=1`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const reviews = await reviewRes.json();
    
    if (!reviews || reviews.length === 0) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    const review = reviews[0];
    
    // Fetch tenant for GBP link and owner info
    const tenantRes = await fetch(
      `${supabaseUrl}/rest/v1/tenants?id=eq.${review.tenant_id}`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const tenants = await tenantRes.json();
    const tenant = tenants[0];

    let responseMessage = '';
    let rating = parseInt(body);
    let wantsCallback = null;
    let newStatus = 'replied';

    // Check if this is a YES/NO response to callback request
    if (body.toUpperCase() === 'YES' || body.toUpperCase() === 'NO') {
      wantsCallback = body.toUpperCase() === 'YES';
      
      if (wantsCallback && tenant.owner_phone) {
        // Send alert to owner
        const ownerMessage = `🚨 Customer callback requested!\n${from}\nRating: ${review.rating}/5\nReply: "${review.reply_text || 'N/A'}"`;
        
        if (twilioSid && twilioAuth && twilioPhone) {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const ownerForm = new URLSearchParams();
          ownerForm.append('To', tenant.owner_phone);
          ownerForm.append('From', twilioPhone);
          ownerForm.append('Body', ownerMessage);

          await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuth}`),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: ownerForm
          });
        }
        
        responseMessage = "Thank you! We'll be in touch shortly.";
        newStatus = 'escalated';
        
        // Update with callback info
        await fetch(`${supabaseUrl}/rest/v1/review_requests?id=eq.${review.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wants_callback: true,
            callback_sent_at: new Date().toISOString(),
            status: newStatus
          })
        });
      } else {
        responseMessage = "Thank you for your feedback!";
        newStatus = 'completed';
        
        await fetch(`${supabaseUrl}/rest/v1/review_requests?id=eq.${review.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wants_callback: false,
            status: newStatus
          })
        });
      }
    } else if (rating >= 1 && rating <= 5) {
      // Rating response
      const techName = review.technician_name || 'your cleaner';
      
      if (rating === 5) {
        // 5 stars - ask for GBP review
        const gbpLink = tenant.gbp_review_link || '';
        responseMessage = `Amazing! 🌟 ${techName} will be thrilled! Want to leave a quick Google review? ${gbpLink}\n\nTip: Great reviews = bonuses for our team!`;
        newStatus = 'completed';
        
        await fetch(`${supabaseUrl}/rest/v1/review_requests?id=eq.${review.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rating: 5,
            status: newStatus,
            replied_at: new Date().toISOString(),
            gbp_link_sent: true
          })
        });
        
      } else if (rating === 4) {
        // 4 stars - thank and ask for improvement
        responseMessage = `Thank you! We're glad ${techName} did a great job. What's one thing we could do to make it a 5 next time?`;
        
        await fetch(`${supabaseUrl}/rest/v1/review_requests?id=eq.${review.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rating: 4,
            status: 'replied',
            replied_at: new Date().toISOString()
          })
        });
        
      } else {
        // 1-3 stars - offer owner callback
        const ownerName = tenant.owner_name || 'the owner';
        responseMessage = `We're sorry to hear that. This is ${ownerName}. Would you mind if I call for a quick chat? Reply YES or NO`;
        
        await fetch(`${supabaseUrl}/rest/v1/review_requests?id=eq.${review.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rating: rating,
            status: 'replied',
            replied_at: new Date().toISOString()
          })
        });
      }
    } else {
      // Free text response (improvement feedback for 4-star or other)
      await fetch(`${supabaseUrl}/rest/v1/review_requests?id=eq.${review.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reply_text: body,
          status: 'completed'
        })
      });
      
      responseMessage = "Thank you for the feedback! We'll use this to improve.";
    }

    // Send response SMS
    if (responseMessage && twilioSid && twilioAuth && twilioPhone) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const replyForm = new URLSearchParams();
      replyForm.append('To', from);
      replyForm.append('From', twilioPhone);
      replyForm.append('Body', responseMessage);

      await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuth}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: replyForm
      });
    }

    // Return TwiML response
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Error handling review reply:', error);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
});
