import { OrderWithDetails } from './orderTypes'
import { DEFAULT_COMPANY_INFO } from '../constants/orderConstants'
import { formatDateForPackingSlip, calculateTotalWeight } from './orderUtils'

export function printMultiplePackingSlips(orders: OrderWithDetails[]) {
  const printContent = orders.map(order => generatePackingSlipHTML(order))
    .join('<div style="page-break-after: always;"></div>')

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing Slips - ${orders.length} Orders</title>
          <meta charset="utf-8">
          <style>
            ${getPackingSlipCSS()}
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }
}

export function generatePackingSlipHTML(order: OrderWithDetails): string {
  const company = DEFAULT_COMPANY_INFO

  return `
    <div class="packing-slip">
      <div class="header">
        <div class="company-info">
          <h1>${company.name}</h1>
          <div>${company.address}</div>
          <div>${company.city}, ${company.state} ${company.zip}</div>
          <div>${company.country}</div>
          <div>Phone: ${company.phone}</div>
          <div>Email: ${company.email}</div>
          <div>Web: ${company.website}</div>
        </div>
        <div class="slip-info">
          <h2>PACKING SLIP</h2>
          <div><strong>Date:</strong> ${formatDateForPackingSlip(new Date().toISOString())}</div>
          <div><strong>Order #:</strong> ${order.orderNumber}</div>
          <div><strong>Platform:</strong> ${order.platform}</div>
        </div>
      </div>

      <div class="addresses">
        <div class="address-block">
          <h3>🏠 Ship To</h3>
          <div class="address-content">
            <strong>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</strong><br/>
            ${order.shippingAddress.address1}<br/>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br/>
            ${order.shippingAddress.country}<br/>
            ${order.shippingAddress.phone ? `Phone: ${order.shippingAddress.phone}` : ''}
          </div>
        </div>

        <div class="address-block">
          <h3>📦 Order Information</h3>
          <div class="address-content">
            <div><strong>Order Date:</strong> ${formatDateForPackingSlip(order.orderDate)}</div>
            <div><strong>Shipping Method:</strong> ${order.shippingMethod}</div>
            ${order.trackingNumber ? `<div><strong>Tracking:</strong> ${order.trackingNumber}</div>` : ''}
            <div><strong>Total Weight:</strong> ${calculateTotalWeight(order.items).toFixed(2)} kg</div>
            <div><strong>Total Items:</strong> ${order.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
          </div>
        </div>
      </div>

      <h3>📋 Items to Pack</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Variant</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Weight (kg)</th>
            <th style="text-align: center;">Packed ✓</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>
                <strong>${item.name}</strong>
                ${item.meta ? `<br/><small style="color: #666;">${Object.entries(item.meta).map(([key, value]) => `${key}: ${value}`).join(', ')}</small>` : ''}
              </td>
              <td><code>${item.sku}</code></td>
              <td>${item.variant || '-'}</td>
              <td style="text-align: center;">
                <span class="qty-badge">${item.quantity}</span>
              </td>
              <td style="text-align: right;">
                ${item.weight ? (item.weight * item.quantity).toFixed(2) : '-'}
              </td>
              <td style="text-align: center;">
                <input type="checkbox" style="width: 16px; height: 16px;" />
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${order.notes ? `
        <div class="notes">
          <h4>⚠️ Special Instructions</h4>
          <p>${order.notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        <div class="checklist">
          <h4>📋 Packing Checklist</h4>
          <ul>
            <li>☐ All items present and correct</li>
            <li>☐ Items properly protected</li>
            <li>☐ Shipping label attached</li>
            <li>☐ Return slip included</li>
          </ul>
        </div>

        <div class="checklist">
          <h4>✅ Quality Check</h4>
          <ul>
            <li>☐ Items match order</li>
            <li>☐ No damage or defects</li>
            <li>☐ Correct quantities</li>
            <li>☐ Package secure</li>
          </ul>
        </div>

        <div class="signature-area">
          <h4>✍️ Packed By</h4>
          <div class="signature-line"></div>
          <div style="font-size: 12px; margin-top: 5px;">Signature</div>
          <div style="margin-top: 15px; font-size: 12px;">Date: _______________</div>
        </div>
      </div>
    </div>
  `
}

function getPackingSlipCSS(): string {
  return `
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
      font-size: 14px;
      line-height: 1.4;
    }
    .packing-slip {
      margin-bottom: 40px;
      border: 1px solid #ddd;
      padding: 20px;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .company-info h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: bold;
    }
    .company-info div {
      margin: 2px 0;
      color: #666;
    }
    .slip-info {
      text-align: right;
    }
    .slip-info h2 {
      margin: 0 0 10px 0;
      font-size: 20px;
      font-weight: bold;
    }
    .addresses {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
    }
    .address-block {
      flex: 1;
    }
    .address-block h3 {
      margin: 0 0 10px 0;
      font-weight: bold;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    .address-content {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background: #f5f5f5;
      font-weight: bold;
    }
    .qty-badge {
      background: #e0e7ff;
      color: #3730a3;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: bold;
      text-align: center;
      display: inline-block;
      min-width: 24px;
    }
    .notes {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      display: flex;
      gap: 40px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .checklist {
      flex: 1;
    }
    .checklist h4 {
      margin: 0 0 10px 0;
      font-weight: bold;
    }
    .checklist ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .checklist li {
      margin: 5px 0;
      padding: 5px 0;
      border-bottom: 1px dotted #ccc;
    }
    .signature-area {
      flex: 1;
    }
    .signature-line {
      border-bottom: 1px solid #333;
      width: 200px;
      margin: 20px 0 5px 0;
    }
    @media print {
      body { padding: 0; }
      .packing-slip {
        border: none;
        page-break-after: always;
        margin-bottom: 0;
      }
      .packing-slip:last-child {
        page-break-after: avoid;
      }
    }
  `
}
