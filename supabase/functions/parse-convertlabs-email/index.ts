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
    const { subject, body, from, tenant_id } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Only process emails from ConvertLabs
    if (!from?.includes('convertlabs.io')) {
      return new Response(JSON.stringify({ success: false, message: 'Not a ConvertLabs email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const isNewLead = subject?.toLowerCase().includes('new lead');
    const isNewBooking = subject?.toLowerCase().includes('new booking');

    if (!isNewLead && !isNewBooking) {
      return new Response(JSON.stringify({ success: false, message: 'Not a lead or booking email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse email body using regex patterns
    const extractField = (text: string, fieldName: string): string => {
      const patterns = [
        new RegExp(`${fieldName}:\\s*([^\\n]+)`, 'i'),
        new RegExp(`${fieldName}\\s*([^\\n]+)`, 'i'),
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1].trim();
      }
      return '';
    };

    const extractPrice = (text: string): number => {
      const match = text.match(/\$?([\d,]+\.?\d*)/);
      return match ? parseFloat(match[1].replace(',', '')) : 0;
    };

    const extractPhone = (text: string): string => {
      const match = text.match(/\+?\d[\d\s\-()]{9,}/);
      return match ? match[0].replace(/[\s\-()]/g, '') : '';
    };

    if (isNewLead) {
      // Parse lead details
      const firstName = extractField(body, 'First Name');
      const lastName = extractField(body, 'Last Name');
      const email = extractField(body, 'Email');
      const phone = extractField(body, 'Phone') || extractPhone(body);
      const zip = extractField(body, 'Zip');
      const service = extractField(body, 'Service');
      const frequency = extractField(body, 'Frequency');
      const price = extractPrice(extractField(body, 'Price'));

      // Insert as customer/lead
      const { data: customer, error: custError } = await fetch(`${supabaseUrl}/rest/v1/customers`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          tenant_id,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          address: zip ? `Zip: ${zip}` : null,
          source: 'convertlabs',
          notes: `Service: ${service}, Frequency: ${frequency}, Quoted: $${price}`
        })
      }).then(r => r.json());

      // Log automation
      await fetch(`${supabaseUrl}/rest/v1/automation_logs`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenant_id,
          automation_type: 'email_parse',
          trigger_type: 'convertlabs_lead',
          target_type: 'customer',
          message_content: `New lead: ${firstName} ${lastName} - ${email}`,
          status: 'processed',
          metadata: { service, frequency, price, zip }
        })
      });

      return new Response(JSON.stringify({ 
        success: true, 
        type: 'lead',
        customer_id: customer?.[0]?.id,
        parsed: { firstName, lastName, email, phone, service, frequency, price }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (isNewBooking) {
      // Parse booking details
      const nameMatch = body.match(/from\s+([^\n]+)/i);
      const fullName = nameMatch ? nameMatch[1].trim() : '';
      const [firstName, ...lastParts] = fullName.split(' ');
      const lastName = lastParts.join(' ');
      
      const email = body.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || '';
      const phone = extractPhone(body);
      
      const date = extractField(body, 'Date');
      const time = extractField(body, 'Time');
      const address = extractField(body, 'Address');
      const service = extractField(body, 'Service');
      const frequency = extractField(body, 'Frequency');
      const total = extractPrice(extractField(body, 'Total'));

      // Find or create customer
      let customerId = null;
      
      if (email) {
        const existingRes = await fetch(
          `${supabaseUrl}/rest/v1/customers?tenant_id=eq.${tenant_id}&email=eq.${encodeURIComponent(email)}`,
          { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
        );
        const existing = await existingRes.json();
        
        if (existing && existing.length > 0) {
          customerId = existing[0].id;
        } else {
          const newCustRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              tenant_id,
              first_name: firstName,
              last_name: lastName,
              email,
              phone,
              address,
              source: 'convertlabs'
            })
          });
          const newCust = await newCustRes.json();
          customerId = newCust?.[0]?.id;
        }
      }

      // Parse date/time into ISO format
      let scheduledStart = new Date().toISOString();
      if (date) {
        const dateParts = date.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
        if (dateParts) {
          const [_, month, day, year] = dateParts;
          let hour = 9;
          if (time) {
            const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (timeMatch) {
              hour = parseInt(timeMatch[1]);
              if (timeMatch[3]?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
              if (timeMatch[3]?.toUpperCase() === 'AM' && hour === 12) hour = 0;
            }
          }
          scheduledStart = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour).toISOString();
        }
      }

      // Create appointment
      const { data: appointment } = await fetch(`${supabaseUrl}/rest/v1/appointments`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          tenant_id,
          customer_id: customerId,
          scheduled_start: scheduledStart,
          status: 'confirmed',
          address,
          notes: `Service: ${service}\nFrequency: ${frequency}\nTotal: $${total}\n\nParsed from ConvertLabs email`,
          source: 'convertlabs'
        })
      }).then(r => r.json());

      // Log automation
      await fetch(`${supabaseUrl}/rest/v1/automation_logs`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenant_id,
          automation_type: 'email_parse',
          trigger_type: 'convertlabs_booking',
          target_id: appointment?.[0]?.id,
          target_type: 'appointment',
          customer_id: customerId,
          message_content: `New booking: ${firstName} ${lastName} - ${date} ${time}`,
          status: 'processed',
          metadata: { date, time, address, service, frequency, total }
        })
      });

      return new Response(JSON.stringify({ 
        success: true, 
        type: 'booking',
        appointment_id: appointment?.[0]?.id,
        customer_id: customerId,
        parsed: { firstName, lastName, email, phone, date, time, address, service, total }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, message: 'Could not parse email' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
