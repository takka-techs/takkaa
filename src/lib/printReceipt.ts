export function printReceipt(invoiceNumber: string, items: any[], subtotal: number, discount: number, total: number, date: string, type: 'sale' | 'return' = 'sale') {
  // Create an iframe to hold the receipt document
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-1000px';
  iframe.style.bottom = '-1000px';
  iframe.style.width = '300px'; // typical thermal printer width
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const headerLabel = type === 'sale' ? 'فاتورة مبيعات' : 'فاتورة مرتجع';
  
  // Load settings globally from localStorage (fallback to defaults)
  let shopName = 'تكة للهواتف والصيانة';
  let currency = 'EGP';
  let invoiceHeaderDesc = 'مرحباً بكم في تكة أصل الثقة';
  let invoiceFooterText = 'البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوم';
  
  try {
    const userId = localStorage.getItem('user_id');
    const saved = userId ? localStorage.getItem(`takka_settings_${userId}`) : localStorage.getItem('takka_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.companyName) shopName = parsed.companyName;
      if (parsed.currency) currency = parsed.currency;
      if (parsed.invoiceHeader) invoiceHeaderDesc = parsed.invoiceHeader;
      if (parsed.invoiceFooter) invoiceFooterText = parsed.invoiceFooter;
    }
  } catch(e) {}


  // Build rows
  let rowsHtml = '';
  items.forEach(item => {
    rowsHtml += `
      <tr>
        <td class="col-item">${item.name}</td>
        <td class="col-qty">${item.cartQuantity || item.quantity}</td>
        <td class="col-price">${item.price || item.unit_price}</td>
        <td class="col-total">${(item.price || item.unit_price) * (item.cartQuantity || item.quantity)}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <html>
      <head>
        <title>Receipt - ${invoiceNumber}</title>
        <style>
          body {
            font-family: 'Tahoma', sans-serif;
            font-size: 12px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 10px;
            direction: rtl;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .mb-1 { margin-bottom: 5px; }
          .mb-2 { margin-bottom: 10px; }
          
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .header h1 { font-size: 18px; margin: 0 0 5px 0; }
          .header p { margin: 2px 0; }
          
          .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
          }
            
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { border-bottom: 1px dashed #000; padding: 5px 0; text-align: right; }
          td { padding: 5px 0; border-bottom: 1px dotted #ccc; }
          .col-item { width: 50%; }
          .col-qty { width: 15%; text-align: center; }
          .col-price { width: 15%; text-align: center; }
          .col-total { width: 20%; text-align: left; }
          
          .totals {
            margin-top: 10px;
            border-top: 1px dashed #000;
            padding-top: 5px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .grand-total {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${shopName}</h1>
          <p class="font-bold">${invoiceHeaderDesc}</p>
          <p style="margin-top: 5px; font-weight: normal; border-top: 1px dotted #ccc; padding-top: 5px;">${headerLabel}</p>
        </div>
        
        <div class="meta">
          <span>رقم الفاتورة:</span>
          <span>${invoiceNumber}</span>
        </div>
        <div class="meta mb-2">
          <span>التاريخ/الوقت:</span>
          <span style="direction: ltr;">${new Date(date).toLocaleString('ar-EG')}</span>
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="col-item">الصنف</th>
              <th class="col-qty" style="text-align: center;">كمية</th>
              <th class="col-price" style="text-align: center;">سعر</th>
              <th class="col-total" style="text-align: left;">إجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">
            <span>المجموع (قبل الخصم):</span>
            <span>${subtotal} ${currency}</span>
          </div>
          ${discount > 0 ? `
          <div class="total-row">
            <span>الخصم:</span>
            <span>${discount} ${currency}</span>
          </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>الصافي المطلوب:</span>
            <span>${total} ${currency}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>${invoiceFooterText}</p>
          <p style="margin-top: 10px; font-size: 10px; color: #555;">TAKKA POS SYSTEM</p>
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for images/fonts if any, then print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Clean up
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}
