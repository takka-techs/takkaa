import React, { useRef, useState, useEffect } from "react";
import Barcode from "react-barcode";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useSettings } from "../contexts/SettingsContext";
import { useBranch } from "../contexts/BranchContext";

interface PrintMaintenanceReceiptProps {
  repair: any;
}

export const PrintMaintenanceReceiptDetailed = React.forwardRef<
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
           `}</style>
      )}

      {/* Header - Custom Layout */}
      <div className="flex flex-col items-center justify-center mb-2 receipt-font">
        {/* 1. Logo */}
        {logo ? (
          <img
            src={logo}
            alt={shopName}
            className="w-16 h-16 object-contain mb-1 filter grayscale"
          />
        ) : (
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg mb-1 border border-black">
            <span className="text-[2.5em] font-black">T</span>
          </div>
        )}

        {/* 2. Shop Name */}
        <h1
          className="text-[1.5em] font-black tracking-widest text-center uppercase leading-tight mb-2"
          dir="ltr"
        >
          {shopName}
        </h1>

        {/* 3. Top Header */}
        {settings?.maintenanceReceiptTopHeader && (
          <div className="text-center font-black text-slate-900 mb-2 whitespace-pre-line text-[1.25em] leading-tight border-y-[2px] border-black py-1 w-full">
            {settings.maintenanceReceiptTopHeader}
          </div>
        )}

        {/* 4. Shop Name Again (border line removed) */}
        <h2 className="text-[1.1em] font-bold text-center text-slate-800 mb-1 pb-1 px-4 inline-block">
          {shopName}
        </h2>

        {/* 5. Branch (If applicable) */}
        {currentBranch && (
          <div className="text-[1em] font-bold mt-1 text-center bg-gray-200 px-2 py-0.5 rounded-sm">
            فرع {currentBranch.name}
          </div>
        )}

        {/* 6. Phone & Address */}
        <div className="text-center text-[0.85em] font-bold mt-1 leading-tight flex flex-col gap-0.5 border-b-[2px] border-black w-full pb-2">
          {phone && (
            <div dir="ltr">{phone}</div>
          )}
          {address && <div>{address}</div>}
        </div>
      </div>

      <div className="text-center font-bold border-[2px] bg-gray-600 text-white border-black py-0.5 mb-2 mx-4 text-[1em] rounded-sm shadow-sm">
        إيصال استلام جهاز
      </div>

      {/* Invoice Meta */}
      <div className="flex flex-col items-center py-1 mb-2 border-b-[2px] border-black pb-2 text-[0.85em] font-bold gap-1">
        <span className="text-[1.15em] font-black" dir="ltr">
          #{ticketId}
        </span>
        <div className="flex gap-4 text-[0.85em]">
          <span>{date.toLocaleDateString("ar-EG")}</span>
          <span dir="ltr">
            {date.toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="mt-1 flex flex-col items-center justify-center gap-0.5">
          <span>اسم العميل: {repair.customer_name || "عميل"}</span>
          <span dir="ltr">رقم تليفون العميل: {repair.customer_phone || "-"}</span>
        </div>
      </div>

      {/* Device & Tech Table */}
      <div className="mb-3 mx-1">
        <div className="bg-gray-700 text-white text-center text-[0.85em] font-bold py-1 border-[2px] border-black border-b-0">
          بيانات الجهاز
        </div>
        <table className="w-full border-[2px] border-black text-[0.85em]">
          <tbody>
            <tr className="border-b-[1px] border-black">
              <td className="p-1 font-black text-center w-[25%] bg-gray-100 border-l-[1px] border-black">
                النوع
              </td>
              <td className="p-1 font-bold text-center w-[75%]">
                {parsedDeviceType}
              </td>
            </tr>
            <tr className="border-b-[1px] border-black">
              <td className="p-1 font-black text-center w-[25%] bg-gray-100 border-l-[1px] border-black">
                الجهاز
              </td>
              <td className="p-1 font-bold text-center w-[75%]" dir="ltr">
                {parsedDeviceName}
              </td>
            </tr>
            <tr className="border-b-[1px] border-black">
              <td className="p-1 font-black text-center w-[25%] bg-gray-100 border-l-[1px] border-black">
                الفني
              </td>
              <td className="p-1 font-bold text-center w-[75%]">
                {repair.technician_name || "غير محدد"}
              </td>
            </tr>
            <tr>
              <td className="p-1 font-black text-center w-[25%] bg-gray-100 border-l-[1px] border-black">
                المستلم
              </td>
              <td className="p-1 font-bold text-center w-[75%]">
                {repair.created_by_name || currentUser}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Issue */}
      <div className="mb-3 mx-1">
        <div className="font-black text-center mb-1 text-[0.9em] bg-gray-100 border border-black p-0.5">
          المشكلة
        </div>
        <div className="border border-dashed border-black p-2 text-center font-bold break-words min-h-[30px] text-[0.85em]">
          {repair.issue || "-"}
        </div>
      </div>

      {/* Totals Section */}
      <div className="flex flex-col items-center justify-center border-t border-b border-black py-2 mb-2">
        <span className="text-[0.85em] font-bold">
          التكلفة المتوقعة
        </span>
        <div className="flex items-center gap-1 font-black text-[1.5em]">
          <span>
            {Number(repair.total_amount || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="text-[1em]">ج.م</span>
        </div>
      </div>

      {Number(repair.paid_amount) > 0 && (
        <div className="flex flex-col items-center justify-center py-1 mb-2">
          <span className="text-[0.75em] font-bold">عربون مدفوع</span>
          <div className="flex items-center gap-1 font-black text-[1.35em]">
            <span>
              {Number(repair.paid_amount || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[0.85em]">ج.م</span>
          </div>
        </div>
      )}

      {/* Warning Box */}
      {note && (
        <div className="border-[2px] border-black p-1.5 mx-1 text-center font-bold text-[0.75em] mb-3 leading-relaxed whitespace-pre-wrap">
          {note}
        </div>
      )}

      {/* Footer Text */}
      <div className="text-center font-bold text-[0.85em] py-1 border-b-[2px] border-black mx-1 mb-2 whitespace-pre-wrap">
        {footer}
      </div>

      {/* Barcode representing invoice ID */}
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
        <div
          className="text-[0.75em] items-center font-bold font-mono tracking-[0.1em] mt-1 text-center"
          dir="ltr"
        >
          {ticketId}
        </div>
      </div>

      {/* Absolute Footer */}
      <div className="bg-[#44383a] text-white text-center font-bold text-[0.65em] py-1 mt-2 uppercase tracking-widest block w-full m-0 p-1">
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

PrintMaintenanceReceiptDetailed.displayName = "PrintMaintenanceReceiptDetailed";