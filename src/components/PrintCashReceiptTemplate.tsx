import React from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { BadgeCheck } from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useBranch } from "../contexts/BranchContext";

interface PrintCashReceiptTemplateProps {
  receiptId: string;
  type: "قبض" | "صرف"; // Receive or Pay
  date: string;
  clientName: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  cashierName?: string;
  // --- Settings ---
  shopName?: string;
  phone?: string;
  logo?: string;
}

export const PrintCashReceiptTemplate = React.forwardRef<
  HTMLDivElement,
  PrintCashReceiptTemplateProps
>((props, ref) => {
  const { settings } = useSettings();
  const { currentBranch } = useBranch();
  const {
    receiptId,
    type,
    date,
    clientName,
    amount,
    paymentMethod,
    notes,
    cashierName,
  } = props;

  const receiptTitle = type === "قبض" ? "سند قبض نقدي" : "سند صرف نقدي";
  const mainColor = type === "قبض" ? "text-emerald-700" : "text-rose-700";

  const shopName =
    settings?.companyName || props.shopName || "تكة للإتصالات والصيانة";
  const phone = settings?.phone || props.phone || "01040324155";
  const logo = settings?.logo || props.logo;
  const address = settings?.address || "";

  return (
    <div
      ref={ref}
      className="print-only text-black py-4 px-3"
      style={{
        width: settings?.paperWidth || "80mm",
        margin: "0 auto",
        fontFamily: '"Arial", sans-serif',
        direction: "rtl",
        fontSize: settings?.receiptFontSize || "100%",
      }}
    >
      {/* --- Header --- */}
      <div className="text-center mb-4 border-b-2 border-black/80 pb-3">
        {logo ? (
          <img
            src={logo}
            alt="شعار المحل"
            className="h-10 mx-auto mb-2 filter grayscale object-contain"
          />
        ) : (
          <div className="text-xl font-black tracking-tighter mb-1">
            {shopName}
          </div>
        )}
        {currentBranch && (
          <div className="text-[14px] font-bold mt-1 text-center bg-gray-200 px-2 py-0.5 rounded-sm">
            فرع {currentBranch.name}
          </div>
        )}
        <div className="text-[11px] font-bold mt-1 leading-tight">
          {address && <div>{address}</div>}
          {phone && <div className="font-mono">ت: {phone}</div>}
        </div>
      </div>

      {/* --- Receipt Info --- */}
      <div className="text-center mb-4">
        <div
          className={`text-base font-black border border-black inline-block px-3 py-1 rounded mb-2 ${mainColor}`}
        >
          {receiptTitle}
        </div>
        <div className="text-sm font-bold font-mono">
          رقم السند: {receiptId}
        </div>
        <div className="text-xs font-bold font-mono">
          {format(new Date(date), "yyyy-MM-dd hh:mm a", { locale: ar })}
        </div>
      </div>

      <div className="border border-black/20 p-2 rounded mb-4">
        <table className="w-full text-xs font-bold">
          <tbody>
            <tr>
              <td className="py-1 w-20 text-slate-600 border-b border-black/10">
                الاسم:
              </td>
              <td className="py-1 border-b border-black/10">{clientName}</td>
            </tr>
            <tr>
              <td className="py-1 w-20 text-slate-600 border-b border-black/10">
                المبلغ:
              </td>
              <td className="py-1 border-b border-black/10 text-sm font-black font-mono">
                {amount.toLocaleString()} ج.م
              </td>
            </tr>
            <tr>
              <td className="py-1 w-20 text-slate-600 border-b border-black/10">
                طريقة الدفع:
              </td>
              <td className="py-1 border-b border-black/10 font-mono">
                {paymentMethod}
              </td>
            </tr>
            {notes && (
              <tr>
                <td className="py-1 w-20 text-slate-600">تفاصيل:</td>
                <td className="py-1 text-xs whitespace-pre-wrap">{notes}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-center mb-4 pt-2 border-t-2 border-dashed border-black/50">
        <div className="flex items-center justify-center gap-1 mb-2">
          <BadgeCheck className="w-5 h-5" />
        </div>
        <div className="text-xs font-bold">تمت العملية بنجاح</div>
      </div>

      {/* --- Footer --- */}
      <div className="text-center text-[10px] space-y-1">
        {cashierName && <div>الكاشير: {cashierName}</div>}
        <div className="font-mono mt-1 pt-1 border-t border-black/10 uppercase tracking-widest">
          {settings?.companyName || "TAKKA ERP"}
        </div>
      </div>
    </div>
  );
});

PrintCashReceiptTemplate.displayName = "PrintCashReceiptTemplate";
