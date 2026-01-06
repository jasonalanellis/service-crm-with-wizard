Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'get_services';
    const tenantSlug = url.searchParams.get('tenant');

    if (!tenantSlug) {
      return new Response(JSON.stringify({ error: 'tenant parameter required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get tenant
    const tenantRes = await fetch(
      `${supabaseUrl}/rest/v1/tenants?slug=eq.${tenantSlug}&select=*`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const tenants = await tenantRes.json();
    if (!tenants.length) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const tenant = tenants[0];

    // GET SERVICES
    if (action === 'get_services') {
      const servicesRes = await fetch(
        `${supabaseUrl}/rest/v1/services?tenant_id=eq.${tenant.id}&is_active=eq.true&select=id,name,description,duration_minutes,price`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const services = await servicesRes.json();
      return new Response(JSON.stringify({ tenant: { name: tenant.name, phone: tenant.phone }, services }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET AVAILABLE SLOTS
    if (action === 'get_slots') {
      const date = url.searchParams.get('date');
      const serviceId = url.searchParams.get('service_id');
      
      if (!date) {
        return new Response(JSON.stringify({ error: 'date parameter required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get existing appointments for the date
      const aptsRes = await fetch(
        `${supabaseUrl}/rest/v1/appointments?tenant_id=eq.${tenant.id}&scheduled_start=gte.${date}T00:00:00&scheduled_start=lt.${date}T23:59:59&status=neq.cancelled&select=scheduled_start,scheduled_end`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const existingApts = await aptsRes.json();

      // Generate available slots (9 AM - 5 PM, 1 hour slots)
      const slots = [];
      for (let hour = 9; hour <= 16; hour++) {
        const slotStart = `${date}T${hour.toString().padStart(2, '0')}:00:00`;
        const slotEnd = `${date}T${(hour + 1).toString().padStart(2, '0')}:00:00`;
        
        const isBooked = existingApts.some((apt: any) => {
          const aptStart = new Date(apt.scheduled_start).getTime();
          const aptEnd = new Date(apt.scheduled_end || apt.scheduled_start).getTime();
          const checkStart = new Date(slotStart).getTime();
          return checkStart >= aptStart && checkStart < aptEnd;
        });

        slots.push({
          time: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
          start: slotStart,
          available: !isBooked
        });
      }

      return new Response(JSON.stringify({ date, slots }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // CREATE BOOKING
    if (action === 'book' && req.method === 'POST') {
      const body = await req.json();
      const { service_id, scheduled_start, first_name, last_name, email, phone, address, notes } = body;

      if (!service_id || !scheduled_start || !first_name || !phone) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get service details
      const svcRes = await fetch(
        `${supabaseUrl}/rest/v1/services?id=eq.${service_id}&select=*`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const services = await svcRes.json();
      const service = services[0];

      // Create or find customer
      let customerId;
      const existingCustomerRes = await fetch(
        `${supabaseUrl}/rest/v1/customers?tenant_id=eq.${tenant.id}&phone=eq.${encodeURIComponent(phone)}&select=id`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const existingCustomers = await existingCustomerRes.json();

      if (existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
      } else {
        const newCustomerRes = await fetch(
          `${supabaseUrl}/rest/v1/customers`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              tenant_id: tenant.id,
              first_name,
              last_name: last_name || '',
              email: email || '',
              phone,
              address_line1: address || '',
              status: 'active'
            })
          }
        );
        const newCustomer = await newCustomerRes.json();
        customerId = newCustomer[0].id;
      }

      // Calculate end time
      const startDate = new Date(scheduled_start);
      const endDate = new Date(startDate.getTime() + (service?.duration_minutes || 60) * 60000);

      // Create appointment
      const aptRes = await fetch(
        `${supabaseUrl}/rest/v1/appointments`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            tenant_id: tenant.id,
            customer_id: customerId,
            service_id,
            scheduled_start,
            scheduled_end: endDate.toISOString(),
            status: 'scheduled',
            price: service?.price || 0,
            notes: notes || ''
          })
        }
      );
      const appointment = await aptRes.json();

      // Log confirmation (would send SMS/email here)
      await fetch(
        `${supabaseUrl}/rest/v1/communication_logs`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tenant_id: tenant.id,
            customer_id: customerId,
            appointment_id: appointment[0].id,
            channel: 'sms',
            direction: 'outbound',
            to_address: phone,
            body: `Your appointment with ${tenant.name} is confirmed for ${new Date(scheduled_start).toLocaleString()}. We'll see you then!`,
            status: 'queued',
            template_name: 'booking_confirmation'
          })
        }
      );

      return new Response(JSON.stringify({ 
        success: true, 
        appointment_id: appointment[0].id,
        message: `Booking confirmed! ${tenant.name} will see you on ${new Date(scheduled_start).toLocaleDateString()}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
