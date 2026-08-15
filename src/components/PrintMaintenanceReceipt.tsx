import React, { useRef, useState, useEffect } from "react";
import Barcode from "react-barcode";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useSettings } from "../contexts/SettingsContext";
import { useBranch } from "../contexts/BranchContext";

interface PrintMaintenanceReceiptProps {
  repair: any;
}

export const PrintMaintenanceReceipt = React.forwardRef<
  HTMLDivElement,
  PrintMaintenanceReceiptProps
>(({ repair }, forwardedRef) => {
  const { settings } = useSettings();
  const { currentBranch } = useBranch();
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
      className="print-only bg-white text-black font-sans overflow-hidden"
      dir="rtl"
      style={{
        margin: 0,
        padding: 0,
        color: "#000",
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
      {/* Header - Logo & Shop Name */}
      <div className="flex flex-col items-center justify-center border-b-[3px] border-black pb-1 mb-2">
        {logo ? (
          <img
            src={logo}
            alt={shopName}
            className="w-24 h-24 object-contain mb-1 filter grayscale"
          />
        ) : (
          <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full mb-1">
            <span className="text-3xl font-black">T</span>
          </div>
        )}
        <h1
          className="text-2xl font-black tracking-widest text-center uppercase"
          dir="ltr"
        >
          {shopName}
        </h1>
        {currentBranch && (
          <div className="text-[14px] font-bold mt-1 text-center bg-gray-200 px-2 py-0.5 rounded-sm">
            فرع {currentBranch.name}
          </div>
        )}
        <div className="text-center text-[11px] font-bold mt-1 leading-tight">
          {address && <div>{address}</div>}
          {phone && (
            <div>
              ت: <span dir="ltr">{phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-center font-bold border-b border-black pb-1 mb-2 text-sm">
        إيصال استلام جهاز
      </div>

      {/* Invoice Meta */}
      <div className="flex flex-col items-center py-1 mb-2 border-b border-black pb-2 text-[11px] font-bold gap-1">
        <div className="flex gap-4 text-[12px]">
          <span>{date.toLocaleDateString("ar-EG")}</span>
          <span>
            {date.toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <span className="text-sm font-black" dir="ltr">
          #{ticketId}
        </span>
      </div>

      <div className="flex justify-between mb-2 text-xs font-bold px-1">
        <span className="truncate max-w-[60%]">
          {repair.customer_name || "عميل"}
        </span>
        <span dir="ltr">{repair.customer_phone || ""}</span>
      </div>

      {/* Device & Tech Table */}
      <table className="w-full mb-3 border-[2px] border-black text-[11px]">
        <tbody>
          <tr className="border-b-[2px] border-black">
            <td className="p-1 font-bold text-center w-[70%] border-l-[2px] border-black">
              {repair.device_name || "غير محدد"}
            </td>
            <td className="p-1 font-black text-center w-[30%] bg-gray-100">
              الجهاز
            </td>
          </tr>
          <tr>
            <td className="p-1 font-bold text-center w-[70%] border-l-[2px] border-black">
              {repair.technician_name || "غير محدد"}
            </td>
            <td className="p-1 font-black text-center w-[30%] bg-gray-100">
              الفني
            </td>
          </tr>
        </tbody>
      </table>

      {/* Issue */}
      <div className="mb-3 text-[11px]">
        <div className="font-black text-center mb-1">
          المشكلة / العطل الرئيسي
        </div>
        <div className="border border-dashed border-black p-2 text-center font-bold break-words min-h-[40px]">
          {repair.issue || "-"}
        </div>
      </div>

      {/* Totals Section */}
      <div className="flex flex-col items-center justify-center border-b border-dashed border-black py-2 mb-2">
        <span className="text-[10px] font-bold">
          التكلفة التقريبية المتوقعة
        </span>
        <div className="flex items-center gap-1 font-black text-xl">
          <span>
            {Number(repair.total_amount || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs">ج.م</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-1 mb-2">
        <span className="text-[10px] font-bold">عربون مدفوع تحت الحساب</span>
        <div className="flex items-center gap-1 font-black text-xl">
          <span>
            {Number(repair.paid_amount || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs">ج.م</span>
        </div>
      </div>

      {/* Warning Box */}
      {note && (
        <div className="border border-black p-1 text-center font-bold text-[9px] mb-3 leading-relaxed whitespace-pre-wrap">
          {note}
        </div>
      )}

      {/* Footer Text */}
      <div className="text-center font-bold text-[11px] py-1 border-b-[2px] border-black mb-2 whitespace-pre-wrap">
        {footer}
      </div>

      {/* Barcode representing invoice ID */}
      <div className="flex flex-col items-center justify-center my-2 scale-90 w-full overflow-hidden origin-top">
        <Barcode
          value={ticketId || "0000000"}
          width={1.5}
          height={40}
          fontSize={12}
          displayValue={true}
          background="transparent"
          margin={0}
        />
        <div
          className="text-[10px] items-center font-bold font-mono tracking-[0.1em] mt-1 text-center"
          dir="ltr"
        >
          {ticketId}
        </div>
      </div>

      {/* Absolute Footer */}
      <div className="bg-black text-white text-center font-bold text-[9px] py-1 mt-2 uppercase tracking-widest block w-full m-0 p-1">
        <div className="leading-none mb-0.5">Powered by TAKKA SYSTEMS</div>
        <div className="flex items-center justify-center gap-1 opacity-90 text-[10px] lowercase tracking-normal mt-1">
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

PrintMaintenanceReceipt.displayName = "PrintMaintenanceReceipt";
