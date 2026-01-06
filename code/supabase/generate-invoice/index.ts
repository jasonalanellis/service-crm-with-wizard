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

    // Fetch appointment with related data
    const apptRes = await fetch(
      `${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}&select=*,customer:customers(*),service:services(*),tenant:tenants(*)`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        }
      }
    );
    
    const appointments = await apptRes.json();
    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const appt = appointments[0];
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const invoiceDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Create invoice record
    const invoiceData = {
      tenant_id: appt.tenant_id,
      customer_id: appt.customer_id,
      appointment_id: appointmentId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      subtotal: appt.price || 0,
      tax: (appt.price || 0) * 0.08, // 8% tax
      total: (appt.price || 0) * 1.08,
      status: appt.payment_status === 'paid' ? 'paid' : 'pending',
      notes: appt.notes,
    };

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/invoices`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(invoiceData)
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Failed to create invoice: ${errText}`);
    }

    const [invoice] = await insertRes.json();

    // Generate HTML invoice for PDF conversion
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company { font-size: 24px; font-weight: bold; color: #1a56db; }
    .invoice-title { font-size: 32px; color: #374151; text-align: right; }
    .invoice-number { color: #6b7280; text-align: right; }
    .section { margin: 20px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .label { color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
    .value { color: #111827; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { text-align: left; padding: 12px; background: #f3f4f6; border-bottom: 2px solid #e5e7eb; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .totals { text-align: right; margin-top: 20px; }
    .totals .row { display: flex; justify-content: flex-end; padding: 8px 0; }
    .totals .label { width: 120px; }
    .totals .value { width: 100px; font-weight: bold; }
    .total-row { font-size: 20px; border-top: 2px solid #1a56db; padding-top: 12px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
    .status.paid { background: #d1fae5; color: #065f46; }
    .status.pending { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${appt.tenant?.name || 'Company'}</div>
      <div style="color: #6b7280; margin-top: 8px;">
        ${appt.tenant?.email || ''}<br>
        ${appt.tenant?.phone || ''}
      </div>
    </div>
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">${invoiceNumber}</div>
    </div>
  </div>

  <div style="display: flex; gap: 40px;">
    <div class="section" style="flex: 1;">
      <div class="label">Bill To</div>
      <div class="value">${appt.customer?.first_name} ${appt.customer?.last_name}</div>
      <div style="color: #6b7280;">${appt.customer?.email}</div>
      <div style="color: #6b7280;">${appt.customer?.phone || ''}</div>
    </div>
    <div class="section" style="flex: 1;">
      <div class="label">Invoice Date</div>
      <div class="value">${invoiceDate}</div>
      <div class="label" style="margin-top: 12px;">Due Date</div>
      <div class="value">${dueDate}</div>
      <div class="label" style="margin-top: 12px;">Status</div>
      <span class="status ${invoiceData.status}">${invoiceData.status.toUpperCase()}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Service Date</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${appt.service?.name || 'Service'}</strong><br>
          <span style="color: #6b7280;">${appt.service?.description || ''}</span>
        </td>
        <td>${new Date(appt.scheduled_start).toLocaleDateString()}</td>
        <td style="text-align: right;">$${(appt.price || 0).toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="row">
      <div class="label">Subtotal:</div>
      <div class="value">$${invoiceData.subtotal.toFixed(2)}</div>
    </div>
    <div class="row">
      <div class="label">Tax (8%):</div>
      <div class="value">$${invoiceData.tax.toFixed(2)}</div>
    </div>
    <div class="row total-row">
      <div class="label">Total:</div>
      <div class="value">$${invoiceData.total.toFixed(2)}</div>
    </div>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
    Thank you for your business!
  </div>
</body>
</html>`;

    return new Response(JSON.stringify({ 
      success: true,
      invoice: invoice,
      invoiceHtml: invoiceHtml
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
