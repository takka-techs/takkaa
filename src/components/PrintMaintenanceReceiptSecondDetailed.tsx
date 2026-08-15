import React, { useRef, useState, useEffect } from "react";
import Barcode from "react-barcode";
import { useSettings } from "../contexts/SettingsContext";
import { useBranch } from "../contexts/BranchContext";

interface PrintMaintenanceReceiptProps {
  repair: any;
}

/* ---------------------------------------------------------------------- */
/* Small inline icons (no external icon-library dependency)               */
/* ---------------------------------------------------------------------- */
const Icon = {
  Calendar: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Clock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
  Phone: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Smartphone: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  ),
  Wrench: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M14.7 6.3a4 4 0 0 0-5.5 5.5L3 18l3 3 6.2-6.2a4 4 0 0 0 5.5-5.5l-2.6 2.6-3-3 2.6-2.6z" />
    </svg>
  ),
  User: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  ),
  Sparkle: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2l1.8 5.6L19.4 9l-5.6 1.8L12 16l-1.8-5.2L4.6 9l5.6-1.4L12 2z" />
    </svg>
  ),
};

/* Row inside the "device data" card */
const DataRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between px-2 py-1.5 border-b border-teal-100 last:border-b-0">
    <div className="flex items-center gap-1.5 text-teal-700 font-bold text-[0.85em] shrink-0">
      {icon}
      <span>{label}</span>
    </div>
    <div className="font-bold text-[0.85em] text-slate-800 text-left break-words" dir="auto">
      {value}
    </div>
  </div>
);

export const PrintMaintenanceReceiptSecondDetailed = React.forwardRef<
  HTMLDivElement,
  PrintMaintenanceReceiptProps
>(({ repair }, forwardedRef) => {
  const { settings } = useSettings();
  const { currentBranch } = useBranch();
  const innerRef = useRef<HTMLDivElement>(null);
  const [pageHeightMm, setPageHeightMm] = useState(0);
  const [currentUser, setCurrentUser] = useState("المستخدم");
  const [parsedDeviceType, setParsedDeviceType] = useState("");
  const [parsedDeviceName, setParsedDeviceName] = useState("");

  useEffect(() => {
    const activeCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const user = activeCashier.name || localStorage.getItem("user_full_name") || localStorage.getItem("user_name") || "المستخدم";
    setCurrentUser(user);

    const DEVICE_TYPES = ['موبايل', 'لابتوب', 'كمبيوتر', 'بلايستيشن', 'اكس بوكس', 'شاشة', 'ايباد', 'تابلت', 'ساعة ذكية', 'ايربودز', 'اخرى'];
    let type = repair.device_type || "موبايل";
    let name = repair.device_name || "";

    const matchedType = DEVICE_TYPES.find(t => name.startsWith(t + ' '));
    if (matchedType) {
      type = matchedType;
      name = name.substring(matchedType.length + 1).trim();
    } else if (!repair.device_type && name.includes(' ')) {
      const parts = name.split(' ');
      type = parts[0];
      name = parts.slice(1).join(' ');
    }
    setParsedDeviceType(type);
    setParsedDeviceName(name);

    if (innerRef.current) {
      setTimeout(() => {
        if (innerRef.current) {
          const h = innerRef.current.offsetHeight;
          setPageHeightMm(Math.ceil(h * 0.264583) + 15);
        }
      }, 50);
    }
  }, [repair]);

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

  if (!repair) return null;

  const ticketId = repair.id
    ? `R-${new Date(repair.created_at || Date.now()).getFullYear()}${(new Date(repair.created_at || Date.now()).getMonth() + 1).toString().padStart(2, "0")}-${repair.id.toString().padStart(5, "0")}`
    : "R-NEW";

  const date = new Date(repair.created_at || Date.now());

  const shopName = settings?.companyName || "تكة للإتصالات والصيانة";
  const phone = currentBranch?.phone || settings?.phone || "01040324155";
  const logo = currentBranch?.logo_url || settings?.logo;
  const address = currentBranch?.address || settings?.address || "";
  const footer = currentBranch?.invoice_footer || settings?.maintenanceFooter || "شكراً لتعاملكم معنا";
  const note =
    currentBranch?.invoice_header || settings?.maintenanceNote ||
    "يرجى الاحتفاظ بهذا الإيصال لاستلام الجهاز - المحل غير مسؤول عن الأجهزة التي لم تستلم خلال 30 يوم";

  return (
    <div
      ref={setRefs}
      className="bg-white text-black leading-tight overflow-hidden receipt-font"
      dir="rtl"
      style={{
        width: settings?.paperWidth || "80mm",
        fontSize: settings?.receiptFontSize || "100%",
        fontFamily: "'Tahoma', 'Cairo', sans-serif"
      }}
    >
      {pageHeightMm > 0 && (
        <style>{`
             @page { size: ${settings?.paperWidth || "80mm"} ${pageHeightMm}mm; margin: 0; }
             @media print { 
               body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; overflow: hidden; } 
             }
             .receipt-font { font-family: "Tahoma", "Cairo", sans-serif !important; }
             .dotted-divider {
               background-image: radial-gradient(circle, #0f766e 1.2px, transparent 1.2px);
               background-size: 6px 2px;
               background-repeat: repeat-x;
               background-position: center;
             }
           `}</style>
      )}

      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col items-center justify-center pt-3 px-3 receipt-font">
        {/* Logo */}
        {logo ? (
          <img src={logo} alt={shopName} className="w-14 h-14 object-contain mb-1" />
        ) : (
          <div className="w-14 h-14 flex items-center justify-center bg-teal-600 rounded-2xl mb-1 shadow-sm">
            <span className="text-white text-[1.6em] font-black tracking-tight">TK</span>
          </div>
        )}

        {/* Shop name */}
        <h1 className="text-[1.6em] font-black tracking-widest text-center text-teal-700 leading-tight mb-1">
          {shopName}
        </h1>

        {/* dotted divider */}
        <div className="w-full flex items-center gap-1 my-1">
          <span className="text-teal-600 text-[0.7em]">◆</span>
          <div className="flex-1 h-[2px] dotted-divider" />
          <span className="text-teal-600 text-[0.7em]">◆</span>
        </div>

        {/* phone */}
        <div className="text-center text-[0.8em] font-bold text-teal-700 flex items-center gap-1 mb-1" dir="ltr">
          <Icon.Phone className="w-3 h-3" />
          {phone}
        </div>

        {address && (
          <div className="text-center text-[0.75em] font-semibold text-slate-500 mb-2">
            {address}
          </div>
        )}

        {currentBranch && (
          <div className="text-[0.8em] font-bold text-center text-slate-500 mb-2">
            {currentBranch.name}
          </div>
        )}
      </div>

      {/* Banner */}
      <div className="text-center font-black bg-teal-600 text-white py-1.5 mb-2 mx-3 text-[1em] rounded-lg shadow-sm">
        إيصال استلام جهاز
      </div>

      {/* Ticket id */}
      <div className="text-center font-black text-[1.15em] text-slate-900 mb-2" dir="ltr">
        #{ticketId}
      </div>

      {/* Meta row: phone / time / date */}
      <div className="flex items-center justify-center gap-3 text-[0.75em] font-bold text-slate-600 mb-3 flex-wrap">
        <span className="flex items-center gap-1" dir="ltr">
          <Icon.Phone className="w-3.5 h-3.5 text-teal-600" />
          {repair.customer_phone || phone}
        </span>
        <span className="flex items-center gap-1" dir="ltr">
          <Icon.Clock className="w-3.5 h-3.5 text-teal-600" />
          {date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="flex items-center gap-1">
          <Icon.Calendar className="w-3.5 h-3.5 text-teal-600" />
          {date.toLocaleDateString("ar-EG")}
        </span>
      </div>

      {/* ---------------- Device data card ---------------- */}
      <div className="mx-3 mb-3 rounded-lg overflow-hidden border border-teal-100">
        <div className="bg-teal-600 text-white text-center text-[0.85em] font-bold py-1.5 flex items-center justify-center gap-1.5">
          <Icon.Smartphone className="w-3.5 h-3.5" />
          بيانات الجهاز
        </div>
        <div className="bg-white">
          <DataRow icon={<Icon.Smartphone className="w-3.5 h-3.5" />} label="النوع" value={parsedDeviceType} />
          <DataRow icon={<Icon.Smartphone className="w-3.5 h-3.5" />} label="الجهاز" value={parsedDeviceName} />
          <DataRow icon={<Icon.Wrench className="w-3.5 h-3.5" />} label="الفني" value={repair.technician_name || "غير محدد"} />
          <DataRow
            icon={<Icon.User className="w-3.5 h-3.5" />}
            label="المستلم"
            value={repair.created_by_name || currentUser}
          />
        </div>
      </div>

      {/* Issue */}
      <div className="mx-3 mb-3">
        <div className="text-center text-[0.8em] font-bold text-teal-700 mb-1">المشكلة</div>
        <div className="border-2 border-dashed border-teal-300 rounded-lg p-2 text-center font-bold break-words min-h-[28px] text-[0.85em] text-slate-700">
          {repair.issue || "-"}
        </div>
      </div>

      {/* Totals */}
      <div className="flex gap-2 mx-3 mb-3">
        <div className="flex-1 flex flex-col items-center justify-center border border-teal-200 rounded-lg py-2 bg-teal-50">
          <span className="text-[0.7em] font-bold text-teal-700 mb-0.5">المبلغ الإجمالي</span>
          <div className="flex items-center gap-1 font-black text-[1.05em] text-slate-900" dir="ltr">
            {Number(repair.total_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            <span className="text-[0.7em] font-bold">ج.م</span>
          </div>
        </div>
        {Number(repair.paid_amount) > 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border border-teal-200 rounded-lg py-2">
            <span className="text-[0.7em] font-bold text-teal-700 mb-0.5">الدفعة المقدمة</span>
            <div className="flex items-center gap-1 font-black text-[1.05em] text-slate-900" dir="ltr">
              {Number(repair.paid_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <span className="text-[0.7em] font-bold">ج.م</span>
            </div>
          </div>
        )}
      </div>

      {/* Warning note */}
      {note && (
        <div className="mx-3 text-center font-semibold text-[0.7em] text-slate-500 mb-2 leading-relaxed whitespace-pre-wrap">
          {note}
        </div>
      )}

      {/* Thank you */}
      <div className="flex items-center justify-center gap-1 text-center font-black text-[0.85em] text-teal-700 py-2 mb-1">
        <Icon.Sparkle className="w-3.5 h-3.5" />
        {footer}
        <Icon.Sparkle className="w-3.5 h-3.5" />
      </div>

      {/* Barcode */}
      <div className="flex flex-col items-center justify-center my-2 scale-90 w-full overflow-hidden origin-top">
        <Barcode
          value={ticketId || "0000000"}
          width={1.2}
          height={30}
          fontSize={10}
          displayValue={true}
          background="transparent"
          margin={0}
        />
      </div>

      {/* Absolute Footer */}
      <div className="bg-teal-700 text-white text-center font-bold text-[0.65em] py-1.5 mt-2 uppercase tracking-widest block w-full m-0">
        <div className="leading-none mb-0.5">Powered by TAKKA SYSTEMS</div>
        <div className="flex items-center justify-center gap-1 opacity-90 text-[1.1em] lowercase tracking-normal mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[1.1em] h-[1.1em]">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <path d="M2 12h20"/>
          </svg>
          <span>takka.fun</span>
        </div>
      </div>
    </div>
  );
});

PrintMaintenanceReceiptSecondDetailed.displayName = "PrintMaintenanceReceiptSecondDetailed";