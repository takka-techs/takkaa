import React, { useRef, useState, useEffect } from "react";
import Barcode from "react-barcode";
import { useSettings } from "../contexts/SettingsContext";
import { useBranch } from "../contexts/BranchContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
}

interface PrintReceiptTemplateProps {
  invoiceId: string;
  items: CartItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  cashReceived: number;
  changeAmount: number;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  shopName?: string;
  phone?: string;
  logo?: string;
  paymentMethod?: string;
  installmentInterestCost?: number;
}

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 shrink-0">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 shrink-0">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 shrink-0">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 shrink-0">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
);

export const PrintReceiptTemplate = React.forwardRef<
  HTMLDivElement,
  PrintReceiptTemplateProps
>((props, forwardedRef) => {
  const { settings } = useSettings();
  const {
    invoiceId,
    items,
    totalAmount,
    discount,
    finalAmount,
    cashReceived,
    customerName,
    customerPhone,
    cashierName,
    paymentMethod,
    installmentInterestCost,
  } = props;

  const innerRef = useRef<HTMLDivElement>(null);
  const [pageHeightMm, setPageHeightMm] = useState<number>(0);

  // Theme color variables
  const themeColor = "#c48323";
  const textColor = "#111111";
  const paperWidth = settings?.paperWidth || "80mm";

  // تم تعديل هذا الجزء لضمان حساب الطول بدقة تامة بعد تحميل كامل العناصر
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const calculateHeight = () => {
      if (innerRef.current) {
        // نستخدم getBoundingClientRect للحصول على الارتفاع الفعلي الكلي
        const rect = innerRef.current.getBoundingClientRect();
        const heightInPx = rect.height;
        // تحويل البيكسل إلى مليمتر (1px = 0.264583 mm) مع إضافة هامش أمان بسيط (2mm)
        const heightInMm = Math.ceil(heightInPx * 0.264583) + 2;
        setPageHeightMm(heightInMm);
      }
    };

    // التشغيل المبدئي
    calculateHeight();
    // تشغيل مرة أخرى بعد نصف ثانية لضمان إن الريندر (Rendering) للخطوط والباركود اكتمل
    timeoutId = setTimeout(calculateHeight, 500);

    return () => clearTimeout(timeoutId);
  }, [items, invoiceId]); // تم ربطها بتغير العناصر عشان ميحصلش Infinite Loop

  const setRefs = React.useCallback(
    (node: HTMLDivElement) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  const { currentBranch } = useBranch();
  const safeItems = Array.isArray(items) ? items : [];

  const shopName = settings?.companyName || props.shopName || "اسم المحل";
  const phone = currentBranch?.phone || settings?.phone || props.phone || "01553212429";
  const logo = currentBranch?.logo_url || settings?.logo || props.logo;
  const address = currentBranch?.address || settings?.address || "طنطا";
  const header = currentBranch?.invoice_header || settings?.maintenanceReceiptTopHeader || settings?.invoiceHeader || "مرحباً بكم في ثقة أصل الثقة";
  const footer = currentBranch?.invoice_footer || settings?.maintenanceFooter || settings?.invoiceFooter || "البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوم";

  const currentDate = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
  const currentTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dueAmount = Math.max(0, finalAmount - cashReceived);

  const formattedInvoiceId = String(invoiceId).includes('-') ? invoiceId : `INV-${invoiceId}`;
  const cleanBarcodeValue = String(invoiceId).replace(/\D/g, "") || "0000000";

  return (
    <div
      ref={setRefs}
      className="print-only bg-white font-sans overflow-hidden p-[2mm]"
      dir="rtl"
      style={{
        margin: 0,
        color: textColor,
        width: paperWidth,
        fontSize: settings?.receiptFontSize || "100%",
        boxSizing: "border-box"
      }}
    >
      {/* تحسين كود الطباعة لإجبار المتصفح على حجم الورقة الفعلي */}
      {pageHeightMm > 0 && (
        <style>{`
          @page { 
            size: ${paperWidth} ${pageHeightMm}mm; 
            margin: 0 !important; 
          }
          @media print { 
            html, body { 
              width: ${paperWidth} !important;
              height: ${pageHeightMm}mm !important;
              margin: 0 !important; 
              padding: 0 !important; 
              overflow: hidden;
              background-color: white;
            }
            /* للتأكد إن مفيش أي عناصر تانية في الصفحة بتبوظ المقاسات */
            body > *:not(.print-only) {
              display: none !important;
            }
          }
        `}</style>
      )}

      {/* Main Bordered Container */}
      <div
        className="border-[1.5px] rounded-[8px] flex flex-col overflow-hidden relative bg-white"
        style={{ borderColor: themeColor }}
      >

        {/* Header Section */}
        <div className="flex items-start justify-between px-3 pt-4 pb-2">
          {/* Shop Info (Right) */}
          <div className="flex flex-col flex-1 items-center justify-center text-center">
            <h1
              className="text-2xl font-black tracking-tight leading-snug mb-1"
              style={{ color: themeColor }}
            >
              {shopName}
            </h1>
            {currentBranch && (
              <div className="text-[10px] font-bold opacity-80 mb-1.5">
                فرع {currentBranch.name}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 text-[10.5px] font-bold mt-1">
              {phone && (
                <span className="flex items-center gap-1.5" dir="ltr">
                  <span style={{ color: themeColor }}><PhoneIcon /></span> {phone}
                </span>
              )}
              {address && (
                <span className="flex items-center gap-1.5">
                  <span style={{ color: themeColor }}><MapPinIcon /></span> {address}
                </span>
              )}
            </div>
          </div>

          {/* Logo Area (Left) */}
          <div
            className="w-[60px] h-[60px] border-[1.5px] border-dashed p-1 flex items-center justify-center rounded-[6px] ml-1 shrink-0 bg-gray-50/50"
            style={{ borderColor: themeColor }}
          >
            {logo ? (
              <img src={logo} alt={shopName} className="w-full h-full object-contain" />
            ) : (
              <div className="text-[11px] font-bold leading-tight text-center">هنا<br />اللوجو</div>
            )}
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center font-black text-[11.5px] pb-3 px-2 whitespace-pre-line">
          {header}
        </div>

        <hr className="border-t-[2px] mx-4 opacity-80" style={{ borderColor: themeColor }} />

        {/* Meta Row (Date, Time) */}
        <div className="flex items-center justify-center gap-6 text-[10.5px] font-bold py-2.5 px-2">
          <div className="flex items-center gap-1.5">
            <span style={{ color: themeColor }}><CalendarIcon /></span> <span dir="ltr">{currentDate}</span>
          </div>
          <div className="w-[1.5px] h-3.5" style={{ backgroundColor: themeColor }}></div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: themeColor }}><ClockIcon /></span> <span dir="ltr">{currentTime}</span>
          </div>
        </div>

        {/* Cashier / Customer */}
        <div className="flex flex-col gap-1 text-center font-bold text-[11px] pb-2 px-2 bg-gray-50/30">
          <div>الكاشير: {cashierName}</div>
          {(customerName || customerPhone) && (
            <div className="text-[11px] pt-1 border-t border-dashed border-gray-200 mx-4">
              العميل: {customerName || "غير مسجل"}
              {customerPhone && <span dir="ltr" className="mr-1">| {customerPhone}</span>}
            </div>
          )}
        </div>

        {/* Table */}
        <table className="w-full text-[11px] font-bold border-b-[1.5px]" style={{ borderColor: themeColor }}>
          <thead className="text-white" style={{ backgroundColor: themeColor }}>
            <tr>
              <th className="py-1.5 px-2.5 text-right w-[55%]">الصنف</th>
              <th className="py-1.5 px-1 text-center w-[15%] border-x border-white/40">ك</th>
              <th className="py-1.5 px-2.5 text-center w-[30%]">السعر</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {safeItems.map((item, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td className="py-2.5 px-2.5 text-right leading-snug">{item.name}</td>
                  <td className="py-2.5 px-1 text-center border-x border-gray-200">
                    {item.quantity || (item as any).cartQuantity}
                  </td>
                  <td className="py-2.5 px-2.5 text-center" dir="ltr">
                    {Number(item.price).toFixed(2)}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="p-2 pt-3 flex flex-col gap-1.5 text-[11px] font-bold">

          <div className="flex justify-between items-center px-1 mb-0.5">
            <span>المجموع الفرعي:</span>
            <span dir="ltr">{Number(totalAmount).toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between items-center px-1 text-red-600">
              <span>الخصم:</span>
              <span dir="ltr">-{Number(discount).toFixed(2)}</span>
            </div>
          )}

          {paymentMethod === "installment" && installmentInterestCost && installmentInterestCost > 0 ? (
            <div className="flex justify-between items-center px-1">
              <span>الفوائد (إضافي):</span>
              <span dir="ltr">+{Number(installmentInterestCost).toFixed(2)}</span>
            </div>
          ) : null}

          {/* Grand Total Block (Styled Ribbon) */}
          <div
            className="relative flex justify-between items-center text-white p-2.5 px-3 mt-1.5 shadow-sm font-black overflow-hidden"
            style={{
              backgroundColor: themeColor,
              clipPath: 'polygon(3% 0, 100% 0, 100% 100%, 3% 100%, 0 50%)'
            }}
          >
            {/* Black Accent on the Right */}
            <div
              className="absolute top-0 right-0 bottom-0 w-[40%] bg-black z-0"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 15% 100%)' }}
            ></div>

            <span className="relative z-10 text-[13px] mr-1">الإجمالي:</span>
            <span dir="ltr" className="relative z-10 text-[15px]">{Number(finalAmount).toFixed(2)} ج.م</span>
          </div>

          {/* Paid / Due */}
          <div className="text-center text-[11px] px-1 pt-2 pb-0.5 font-bold">
            دفع: <span dir="ltr">{cashReceived}</span> | أجل: <span dir="ltr">{dueAmount}</span>
          </div>
        </div>

        {/* Policy Box */}
        <div
          className="mx-4 my-2 border-[1.5px] rounded-[6px] flex items-center justify-center p-2 text-[10px] font-bold gap-2 text-center leading-snug"
          style={{ borderColor: themeColor }}
        >
          <span className="whitespace-pre-line">{footer}</span>
          <span style={{ color: themeColor }}><ShieldIcon /></span>
        </div>

        {/* Barcode */}
        <div className="flex flex-col items-center justify-center mt-2 mb-3 scale-95 origin-bottom">
          <Barcode
            value={cleanBarcodeValue}
            width={1.6}
            height={38}
            displayValue={false}
            background="transparent"
            lineColor="#111"
            margin={0}
          />
          <div className="text-[11px] font-bold mt-2 tracking-widest uppercase text-center">
            {formattedInvoiceId}
          </div>
        </div>

        {/* Bottom Absolute Footer */}
        <div
          className="text-white text-center text-[12px] font-black py-2.5 w-full mt-auto tracking-wide"
          style={{ backgroundColor: themeColor }}
        >
          شكراً لتفضلكم
        </div>
      </div>

      {/* Powered By TAKKA (Outside Border) */}
      <div className="text-center text-[9px] font-black mt-2 mb-1 flex items-center justify-center gap-1 opacity-60">
        <span className="tracking-wider">TAKKA</span>
        <span>Powered by</span>
        <span className="mx-1">|</span>
        <span className="tracking-widest">takka.fun</span>
      </div>
    </div>
  );
});

PrintReceiptTemplate.displayName = "PrintReceiptTemplate";