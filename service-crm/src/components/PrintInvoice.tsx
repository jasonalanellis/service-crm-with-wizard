import { Printer } from 'lucide-react';

type InvoiceData = {
  id: string;
  number: string;
  date: string;
  dueDate?: string;
  customer: { name: string; email: string; address?: string };
  items: { description: string; quantity: number; price: number }[];
  subtotal: number;
  tax?: number;
  total: number;
  businessName: string;
  status: string;
};

type Props = {
  invoice: InvoiceData;
};

export default function PrintInvoice({ invoice }: Props) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .invoice-title { text-align: right; }
          .invoice-title h1 { font-size: 28px; color: #111; }
          .invoice-title p { color: #666; margin-top: 4px; }
          .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .details-section h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
          .details-section p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; padding: 12px; background: #f3f4f6; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #666; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          .amount { text-align: right; }
          .totals { width: 300px; margin-left: auto; }
          .totals tr td { padding: 8px 12px; }
          .totals .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #111; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .status.paid { background: #dcfce7; color: #166534; }
          .status.unpaid { background: #fee2e2; color: #991b1b; }
          .status.pending { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 60px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${invoice.businessName}</div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <p>#${invoice.number}</p>
          </div>
        </div>
        <div class="details">
          <div class="details-section">
            <h3>Bill To</h3>
            <p><strong>${invoice.customer.name}</strong></p>
            <p>${invoice.customer.email}</p>
            ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ''}
          </div>
          <div class="details-section" style="text-align: right;">
            <h3>Invoice Details</h3>
            <p>Date: ${invoice.date}</p>
            ${invoice.dueDate ? `<p>Due: ${invoice.dueDate}</p>` : ''}
            <p>Status: <span class="status ${invoice.status.toLowerCase()}">${invoice.status}</span></p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Qty</th>
              <th class="amount">Price</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="amount">${item.quantity}</td>
                <td class="amount">$${item.price.toFixed(2)}</td>
                <td class="amount">$${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <table class="totals">
          <tr>
            <td>Subtotal</td>
            <td class="amount">$${invoice.subtotal.toFixed(2)}</td>
          </tr>
          ${invoice.tax ? `<tr><td>Tax</td><td class="amount">$${invoice.tax.toFixed(2)}</td></tr>` : ''}
          <tr class="total-row">
            <td>Total</td>
            <td class="amount">$${invoice.total.toFixed(2)}</td>
          </tr>
        </table>
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      title="Print Invoice"
    >
      <Printer size={16} />
      <span className="hidden sm:inline">Print</span>
    </button>
  );
}
