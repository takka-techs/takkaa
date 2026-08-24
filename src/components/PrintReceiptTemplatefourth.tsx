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
  date?: string | Date;
}

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[1.2em] h-[1.2em] shrink-0">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[1.2em] h-[1.2em] shrink-0">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[1.2em] h-[1.2em] shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[1.2em] h-[1.2em] shrink-0">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
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
    date,
  } = props;

  const innerRef = useRef<HTMLDivElement>(null);
  const [pageHeightMm, setPageHeightMm] = useState<number>(0);

  const themeDark = "#1a1a1b";
  const paperWidth = settings?.paperWidth || "80mm";

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const calculateHeight = () => {
      if (innerRef.current) {
        const rect = innerRef.current.getBoundingClientRect();
        const heightInPx = rect.height;
        const heightInMm = Math.ceil(heightInPx * 0.264583) + 2;
        setPageHeightMm(heightInMm);
      }
    };

    calculateHeight();
    timeoutId = setTimeout(calculateHeight, 500);

    return () => clearTimeout(timeoutId);
  }, [items, invoiceId, settings?.receiptFontSize]);

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
      className="print-only bg-white font-sans overflow-hidden p-[2mm]"
      dir="rtl"
      style={{
        margin: 0,
        color: themeDark,
        width: paperWidth,
        fontSize: settings?.receiptFontSize || "100%",
        boxSizing: "border-box"
      }}
    >
      {pageHeightMm > 0 && (
        <style>{`
          @page { size: ${paperWidth} ${pageHeightMm}mm; margin: 0 !important; }
          @media print { 
            html, body { 
              width: ${paperWidth} !important;
              height: ${pageHeightMm}mm !important;
              margin: 0 !important; padding: 0 !important; overflow: hidden; background-color: white;
            }
            body > *:not(.print-only) { display: none !important; }
          }
        `}</style>
      )}

      <div
        className="flex flex-row w-full bg-white relative overflow-hidden"
        style={{
          border: `1.5px solid ${themeDark}`,
          borderRadius: "1em",
          minHeight: "30em"
        }}
      >

        {/* --- العمود الأيمن (المحتوى الرئيسي) --- */}
        <div className="w-[65%] flex flex-col p-[0.8em] z-10">

          <div className="text-center mb-[0.5em]">
            <h1 className="font-black text-[1.5em] leading-tight mb-[0.1em]">{shopName}</h1>
            {currentBranch && (
              <div className="text-[0.7em] font-bold opacity-80 mb-[0.3em]">
                فرع {currentBranch.name}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-[0.8em] text-[0.65em] font-bold mt-[0.5em]">
              {phone && (
                <span className="flex items-center gap-[0.3em]" dir="ltr">
                  <PhoneIcon /> {phone}
                </span>
              )}
              {address && (
                <span className="flex items-center gap-[0.3em]">
                  <MapPinIcon /> {address}
                </span>
              )}
            </div>
          </div>

          <div className="text-center font-bold text-[0.7em] mt-[0.3em] mb-[0.8em] whitespace-pre-line">
            {header}
          </div>

          <div className="overflow-hidden mt-[0.5em]" style={{ border: `1.5px solid ${themeDark}`, borderRadius: "0.8em" }}>
            <div className="text-white flex text-[0.7em] font-bold p-[0.4em]" style={{ backgroundColor: themeDark }}>
              <div className="w-[55%] text-right pr-[0.5em]">الصنف</div>
              <div className="w-[15%] text-center border-x border-white/40">ك</div>
              <div className="w-[30%] text-center">السعر</div>
            </div>
            <div className="flex flex-col text-[0.65em] font-bold divide-y divide-gray-300">
              {safeItems.map((item, index) => (
                <div key={index} className="flex p-[0.5em]">
                  <div className="w-[55%] text-right pr-[0.3em] leading-snug">{item.name}</div>
                  <div className="w-[15%] text-center border-x border-gray-300">{item.quantity || (item as any).cartQuantity}</div>
                  <div className="w-[30%] text-center" dir="ltr">{Number(item.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[0.5em] mt-[0.8em]">
            <div className="flex justify-between items-center px-[0.5em] text-[0.75em] font-bold">
              <span>المجموع الفرعي:</span>
              <span dir="ltr">{Number(totalAmount).toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between items-center px-[0.5em] text-[0.75em] font-bold text-red-600">
                <span>الخصم:</span>
                <span dir="ltr">-{Number(discount).toFixed(2)}</span>
              </div>
            )}

            {paymentMethod === "installment" && installmentInterestCost && installmentInterestCost > 0 ? (
              <div className="flex justify-between items-center px-[0.5em] text-[0.75em] font-bold">
                <span>الفوائد:</span>
                <span dir="ltr">+{Number(installmentInterestCost).toFixed(2)}</span>
              </div>
            ) : null}
          </div>

          <div className="text-white flex flex-col items-center justify-center p-[0.7em] mt-[0.8em]" style={{ backgroundColor: themeDark, borderRadius: "1.2em" }}>
            <span className="text-[0.75em] opacity-90">الإجمالي</span>
            <span className="text-[1.3em] font-black mt-[0.1em]" dir="ltr">{Number(finalAmount).toFixed(2)} ج.م</span>
          </div>

          <div className="text-center text-[0.7em] font-bold mt-[0.6em]">
            دفع : <span dir="ltr">{cashReceived}</span> | أجل : <span dir="ltr">{dueAmount}</span>
          </div>

          <div className="text-center p-[0.4em] mt-[1em] text-[0.6em] font-bold mx-[0.5em]" style={{ border: `1.5px solid ${themeDark}`, borderRadius: "999px" }}>
            {footer}
          </div>

          <div className="mt-[1em] flex flex-col items-center justify-center scale-95 origin-top">
            <Barcode
              value={cleanBarcodeValue}
              width={1.3}
              height={35}
              displayValue={false}
              background="transparent"
              lineColor={themeDark}
              margin={0}
            />
            <div className="text-[0.65em] font-bold mt-[0.5em] tracking-widest uppercase text-center">
              {formattedInvoiceId}
            </div>
          </div>

        </div>

        {/* --- العمود الأيسر (الشريط الجانبي) --- */}
        <div className="w-[35%] relative flex flex-col pt-[1em]">

          <div
            className="absolute top-0 left-0 right-0"
            style={{
              bottom: "4em",
              backgroundColor: themeDark,
              clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 2.5em), 0 100%)"
            }}
          ></div>

          <div className="relative z-10 flex flex-col items-center text-white px-[0.5em]">

            <div className="border-[1.5px] border-white flex items-center justify-center overflow-hidden bg-white/5 mt-[0.5em]" style={{ width: "4.5em", height: "4.5em", borderRadius: "0.8em" }}>
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[0.7em] font-bold text-center leading-tight">هنا<br />اللوجو</span>
              )}
            </div>

            <div className="flex items-center w-[75%] my-[1.2em] opacity-80">
              <div className="h-[1px] bg-white flex-1"></div>
              <div className="w-[0.4em] h-[0.4em] bg-white rounded-full mx-[0.4em]"></div>
              <div className="h-[1px] bg-white flex-1"></div>
            </div>

            <div className="flex flex-col gap-[0.8em] w-full px-[0.2em] items-start pl-[0.5em]">
              <div className="flex items-center gap-[0.5em] text-[0.6em] font-bold">
                <CalendarIcon /> <span dir="ltr">{currentDate}</span>
              </div>
              <div className="flex items-center gap-[0.5em] text-[0.6em] font-bold">
                <ClockIcon /> <span dir="ltr">{currentTime}</span>
              </div>
            </div>

            <hr className="w-[75%] border-t-[1px] border-white/30 my-[1.5em]" />

            <div className="text-center flex flex-col gap-[0.3em] text-[0.65em] font-bold w-full">
              <span className="opacity-80">الكاشير:</span>
              <span className="break-words">{cashierName}</span>
            </div>
            {(customerName || customerPhone) && (
              <div className="text-center flex flex-col gap-[0.3em] text-[0.65em] font-bold mt-[1em] pt-[1em] border-t border-dashed border-white/30 w-full">
                <span className="opacity-80">العميل:</span>
                <span className="break-words">{customerName || "غير مسجل"}</span>
              </div>
            )}
          </div>

          <div className="flex-1"></div>

          <div className="relative z-10 h-[4.5em] flex flex-col items-center justify-end pb-[1em]">
            <div className="flex items-center gap-[0.3em] opacity-70 mb-[0.4em]">
              <span className="w-[1em] h-[1px]" style={{ backgroundColor: themeDark }}></span>
              <span className="w-[0.3em] h-[0.3em] rounded-full" style={{ backgroundColor: themeDark }}></span>
              <span className="w-[1em] h-[1px]" style={{ backgroundColor: themeDark }}></span>
            </div>
            <span className="text-[0.65em] font-black" style={{ color: themeDark }}>شكراً لثقتكم</span>
          </div>

        </div>

      </div>
    </div>
  );
});

PrintReceiptTemplate.displayName = "PrintReceiptTemplate";