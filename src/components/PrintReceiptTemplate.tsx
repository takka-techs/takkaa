import React, { useRef, useState, useEffect } from "react";
import Barcode from "react-barcode";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
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
}

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
    changeAmount,
    customerName,
    cashierName,
    paymentMethod,
    installmentInterestCost,
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

  const shopName = settings?.companyName || props.shopName || "تكة للإتصالات والصيانة";
  const phone = currentBranch?.phone || settings?.phone || props.phone || "01040324155";
  const logo = currentBranch?.logo_url || settings?.logo || props.logo;
  const address = currentBranch?.address || settings?.address || "";
  const header = currentBranch?.invoice_header || settings?.invoiceHeader || "مرحباً بكم";
  const footer = currentBranch?.invoice_footer || settings?.invoiceFooter || "شكراً لتعاملكم معنا";

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
      <div className="flex flex-col items-center justify-center border-b-[3px] border-black pb-1 mb-1">
        {logo ? (
          <img
            src={logo}
            alt={shopName}
            className="w-24 h-24 object-contain mb-1"
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
          {phone && <div>{phone}</div>}
        </div>
        {header && (
          <div className="text-center font-bold text-[11px] mt-1 italic">
            {header}
          </div>
        )}
      </div>

      {/* Invoice Meta */}
      <div className="flex flex-col items-center py-1 mb-2 border-b-[2px] border-black pb-2 text-[11px] font-bold gap-1 mt-1">
        <div className="flex gap-4 text-[12px]">
          <span>{new Date().toLocaleDateString("ar-EG")}</span>
          <span>
            {new Date().toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <span className="text-sm font-black" dir="ltr">
          #{invoiceId}
        </span>
        {(customerName || cashierName) && (
          <div className="flex flex-col items-center text-[10px] w-full px-2 mt-1 gap-1">
            {customerName && (
              <div className="text-right w-full">العميل: {customerName}</div>
            )}
            {cashierName && (
              <div className="text-left w-full">الكاشير: {cashierName}</div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <table className="w-full mb-1 border-b-[3px] border-black text-[11px]">
        <thead className="bg-black text-white font-bold">
          <tr>
            <th className="py-1 px-1 text-right w-3/5">الصنف</th>
            <th className="py-1 px-1 text-center w-1/5 border-r border-white">
              ك
            </th>
            <th className="py-1 px-1 text-center w-1/5 border-r border-white">
              السعر
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black font-bold">
          {safeItems.map((item, index) => (
            <React.Fragment key={index}>
              <tr>
                <td className="py-1 px-1 text-right truncate max-w-[40mm]">
                  {item.name}
                </td>
                <td className="py-1 px-1 text-center border-r border-black">
                  {item.quantity || (item as any).cartQuantity}
                </td>
                <td className="py-1 px-1 text-center border-r border-black">
                  {Number(item.price).toFixed(2)}
                </td>
              </tr>
              {settings?.showDetails !== false && (item as any).imei1 && (
                <tr>
                  <td
                    colSpan={3}
                    className="pt-0 pb-1 px-1 text-right text-[9px] font-normal"
                    dir="ltr"
                  >
                    <span className="font-bold">IMEI:</span>{" "}
                    {(item as any).imei1}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="flex flex-col border-b-[2px] border-black py-2 mb-1 text-[11px] font-bold">
        <div className="flex justify-between w-full px-2">
          <span>المجموع الفرعي:</span>
          <span>{Number(totalAmount).toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between w-full px-2">
            <span>الخصم:</span>
            <span>{Number(discount).toFixed(2)}-</span>
          </div>
        )}
        {paymentMethod === "installment" &&
        installmentInterestCost &&
        installmentInterestCost > 0 ? (
          <div className="flex justify-between w-full px-2">
            <span>الفوائد (إضافي):</span>
            <span>{Number(installmentInterestCost).toFixed(2)}+</span>
          </div>
        ) : null}
        <div className="flex justify-between w-full px-2 mt-1 border-t border-black/20 pt-1 text-sm font-black">
          <span>الإجمالي:</span>
          <span>{Number(finalAmount).toFixed(2)} ج.م</span>
        </div>
      </div>

      {/* Payment Method Details */}
      <div className="text-center font-bold text-[11px] border-b-[2px] border-black py-1 mb-1">
        {paymentMethod === "installment"
          ? `نظام تقسيط | مقدم: ${cashReceived} | آجل: ${Math.max(0, finalAmount - cashReceived)}`
          : `دفع: ${cashReceived} | آجل: ${Math.max(0, finalAmount - cashReceived)}`}
      </div>

      {/* Footer Text */}
      <div className="text-center font-bold text-[11px] py-1 whitespace-pre-line">
        {footer}
      </div>

      {/* Barcode representing invoice ID */}
      <div className="flex flex-col items-center justify-center my-2 scale-90 w-full overflow-hidden origin-top">
        <Barcode
          value={invoiceId?.toString().replace(/\D/g, "") || "0000000"}
          width={1.5}
          height={40}
          fontSize={12}
          displayValue={true}
          background="transparent"
          margin={0}
        />
        <div
          className="text-[10px] items-center font-bold font-mono tracking-[0.2em] mt-1 text-center"
          dir="ltr"
        >
          {/* If invoice has a prefix, display it under barcode plainly */}
          {invoiceId}
        </div>
      </div>

      {/* Absolute Footer */}
      <div className="bg-black text-white text-center font-bold text-[9px] py-1 mt-2 uppercase tracking-widest">
        {settings?.companyName || "TAKKA ERP"}
      </div>
    </div>
  );
});

PrintReceiptTemplate.displayName = "PrintReceiptTemplate";
