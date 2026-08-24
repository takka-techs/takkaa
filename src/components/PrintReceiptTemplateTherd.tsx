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
  cashierName: string;
  shopName?: string;
  phone?: string;
  logo?: string;
  paymentMethod?: string;
  installmentInterestCost?: number;
  date?: string | Date;
}

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 shrink-0">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 shrink-0">
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

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 shrink-0">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 shrink-0">
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
    cashierName,
    paymentMethod,
    installmentInterestCost,
    date,
  } = props;

  const innerRef = useRef<HTMLDivElement>(null);
  const [pageHeightMm, setPageHeightMm] = useState(0);

  useEffect(() => {
    if (innerRef.current) {
      setTimeout(() => {
        if (innerRef.current) {
          const h = innerRef.current.offsetHeight;
          setPageHeightMm(Math.ceil(h * 0.264583) + 15);
        }
      }, 50);
    }
  });

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

  const currentDate = (date ? new Date(date) : new Date()).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
  const currentTime = (date ? new Date(date) : new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dueAmount = Math.max(0, finalAmount - cashReceived);

  const formattedInvoiceId = String(invoiceId).includes('-') ? invoiceId : `INV-${invoiceId}`;
  const cleanBarcodeValue = String(invoiceId).replace(/\D/g, "") || "0000000";

  return (
    <div
      ref={setRefs}
      className="print-only bg-white font-sans overflow-hidden p-[2mm] text-[#0a192f]"
      dir="rtl"
      style={{
        margin: 0,
        color: "#0a192f",
        width: settings?.paperWidth || "80mm",
        fontSize: settings?.receiptFontSize || "100%",
      }}
    >
      {pageHeightMm > 0 && (
        <style>{`
          @page { size: ${settings?.paperWidth || "80mm"} ${pageHeightMm}mm; margin: 0; }
          @media print { body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; overflow: hidden; } }
        `}</style>
      )}

      {/* Main Bordered Container */}
      <div className="border-[1.5px] border-[#0a192f] rounded-[8px] flex flex-col overflow-hidden relative bg-white">

        {/* Header Section */}
        <div className="flex flex-col items-center justify-center p-3 text-center pb-2">
          {/* Logo Area */}
          <div className="w-[50px] h-[50px] border border-dashed border-[#0a192f] p-1 flex items-center justify-center rounded-[6px] mb-2 bg-gray-50/50">
            {logo ? (
              <img src={logo} alt={shopName} className="w-full h-full object-contain" />
            ) : (
              <div className="text-[9px] font-bold leading-tight">هنا<br />اللوجو</div>
            )}
          </div>

          <h1 className="text-xl font-black tracking-tight leading-snug mb-1">
            {shopName}
          </h1>
          {currentBranch && (
            <div className="text-[10px] font-bold opacity-75 mb-1">
              فرع {currentBranch.name}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[9.5px] font-bold mt-0.5">
            {address && (
              <span className="flex items-center gap-1">
                <MapPinIcon /> {address}
              </span>
            )}
            {phone && (
              <span className="flex items-center gap-1" dir="ltr">
                {phone} <PhoneIcon />
              </span>
            )}
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center font-bold text-[10.5px] pb-2 px-2 opacity-90 whitespace-pre-line">
          {header}
        </div>

        <hr className="border-t-[1.5px] border-[#0a192f] opacity-20 mx-3" />

        {/* Meta Row (Date, Time, Invoice ID) */}
        <div className="flex items-center justify-between text-[9px] font-bold py-2 px-2">
          <div className="flex items-center gap-1 justify-center flex-1">
            <CalendarIcon /> <span dir="ltr">{currentDate}</span>
          </div>
          <div className="w-[1px] h-3 bg-[#0a192f] opacity-20"></div>
          <div className="flex items-center gap-1 justify-center flex-1">
            <ClockIcon /> <span dir="ltr">{currentTime}</span>
          </div>
          <div className="w-[1px] h-3 bg-[#0a192f] opacity-20"></div>
          <div className="flex items-center gap-1 justify-center flex-[1.2]" dir="ltr">
            <FileIcon /> <span className="truncate">#{formattedInvoiceId}</span>
          </div>
        </div>

        {/* Cashier / Customer */}
        <div className="text-center font-bold text-[10px] py-1.5 px-2 bg-gray-50 border-y border-[#0a192f]/10">
          الكاشير: {cashierName} {customerName && `| العميل: ${customerName}`}
        </div>

        {/* Table */}
        <table className="w-full text-[10.5px] font-bold border-b border-[#0a192f]">
          <thead className="bg-[#0a192f] text-white">
            <tr>
              <th className="py-1.5 px-2.5 text-right w-[55%]">الصنف</th>
              <th className="py-1.5 px-1 text-center w-[15%] border-x border-white/20">ك</th>
              <th className="py-1.5 px-2.5 text-center w-[30%]">السعر</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {safeItems.map((item, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td className="py-2 px-2.5 text-right leading-snug">{item.name}</td>
                  <td className="py-2 px-1 text-center border-x border-gray-200">
                    {item.quantity || (item as any).cartQuantity}
                  </td>
                  <td className="py-2 px-2.5 text-center" dir="ltr">
                    {Number(item.price).toFixed(2)}
                  </td>
                </tr>
                {settings?.showDetails !== false && (item as any).imei1 && (
                  <tr>
                    <td colSpan={3} className="pt-0 pb-1.5 px-2.5 text-right text-[8.5px] opacity-75" dir="ltr">
                      <span className="font-bold">IMEI:</span> {(item as any).imei1}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="p-2.5 pt-3 flex flex-col gap-1.5 text-[10.5px] font-bold">
          <div className="flex justify-between items-center px-1">
            <span className="opacity-80">المجموع الفرعي:</span>
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

          {/* Grand Total Block */}
          <div className="flex justify-between items-center bg-[#0a192f] text-white p-2 px-3 rounded-[6px] text-[12px] mt-1 shadow-sm">
            <span>الإجمالي النهائي:</span>
            <span dir="ltr" className="font-black">{Number(finalAmount).toFixed(2)} ج.م</span>
          </div>

          {/* Paid / Due */}
          <div className="flex justify-between items-center text-[10px] px-1 pt-1 opacity-90 border-t border-dashed border-gray-300 mt-1">
            <span>المدفوع: <strong dir="ltr">{cashReceived}</strong></span>
            <span>المتبقي (آجل): <strong dir="ltr">{dueAmount}</strong></span>
          </div>
        </div>

        {/* Policy Box */}
        <div className="mx-3 my-1.5 border-[1.5px] border-[#0a192f] rounded-[6px] flex items-center justify-center p-2 text-[9.5px] font-bold gap-1.5 text-center leading-snug bg-gray-50/50">
          <span className="whitespace-pre-line">{footer}</span> <ShieldIcon />
        </div>

        {/* Barcode */}
        <div className="flex flex-col items-center justify-center my-2 scale-95 origin-bottom">
          <Barcode
            value={cleanBarcodeValue}
            width={1.5}
            height={32}
            fontSize={10}
            displayValue={true}
            background="transparent"
            lineColor="#0a192f"
            margin={0}
            textMargin={2}
          />
        </div>

        {/* Bottom Absolute Footer (Inside Border) */}
        <div className="bg-[#0a192f] text-white text-center text-[10.5px] font-black py-2 w-full mt-auto tracking-wide">
          شكراً لتفضلكم بالزيارة
        </div>
      </div>

      {/* Powered By TAKKA (Outside Border) */}
      <div className="text-center text-[8.5px] font-black mt-2 mb-1 flex items-center justify-center gap-1 opacity-70">
        
        <span className="tracking-wider">TAKKA</span>
        <span>Powered by</span>
        <span className="mx-1">|</span>
        <span className="tracking-widest">takka.fun</span>
      </div>
    </div>
  );
});

PrintReceiptTemplate.displayName = "PrintReceiptTemplate";