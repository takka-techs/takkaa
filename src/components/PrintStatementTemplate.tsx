import React from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useSettings } from "../contexts/SettingsContext";
import { useBranch } from "../contexts/BranchContext";

interface PrintStatementTemplateProps {
  entityName: string; // Customer or Supplier Name
  entityPhone?: string;
  statementData: any[]; // The table items
  dateFrom?: string;
  dateTo?: string;
  totalDebt: number; // For suppliers it means total bought, for customers total sold
  totalPaid: number;
  currentBalance: number;
  balanceType: "مدين" | "دائن" | "متوازن";
  // --- Settings ---
  shopName?: string;
  phone?: string;
  logo?: string;
}

export const PrintStatementTemplate = React.forwardRef<
  HTMLDivElement,
  PrintStatementTemplateProps
>((props, ref) => {
  const { settings } = useSettings();
  const { currentBranch } = useBranch();
  const {
    entityName,
    entityPhone,
    statementData,
    dateFrom,
    dateTo,
    totalDebt,
    totalPaid,
    currentBalance,
    balanceType,
  } = props;

  const shopName =
    settings?.companyName || props.shopName || "تكة للإتصالات والصيانة";
  const phone = settings?.phone || props.phone || "01040324155";
  const logo = settings?.logo || props.logo;
  const address = settings?.address || "";

  return (
    <div
      ref={ref}
      className="print-only text-black py-4 px-8"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        fontFamily: '"Arial", sans-serif',
        direction: "rtl",
        backgroundColor: "#ffffff",
        fontSize: settings?.receiptFontSize || "100%",
      }}
    >
      {/* --- Header --- */}
      <div className="flex justify-between items-end border-b-4 border-black/80 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black mb-2">كشف حساب مفصل</h1>
          {currentBranch && (
            <div className="text-[16px] font-bold mt-1 bg-gray-200 px-3 py-1 rounded-sm w-max mb-2">
              فرع {currentBranch.name}
            </div>
          )}
          <div className="flex gap-4 text-sm font-bold">
            <span className="font-mono">
              تاريخ الإصدار: {format(new Date(), "yyyy-MM-dd hh:mm a")}
            </span>
            {dateFrom && dateTo && (
              <span className="font-mono">
                الفترة: {dateFrom} إلى {dateTo}
              </span>
            )}
          </div>
        </div>
        <div className="text-left flex flex-col items-end">
          {logo ? (
            <img
              src={logo}
              alt="الشعار"
              className="h-16 mb-2 ml-auto filter grayscale object-contain"
            />
          ) : (
            <h2 className="text-2xl font-black tracking-tighter mb-1">
              {shopName}
            </h2>
          )}
          <div className="text-sm font-bold text-left leading-tight hidden lg:block">
            {address && <div>{address}</div>}
            {phone && (
              <div className="font-mono mt-1" dir="ltr">
                {phone} :ت
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Entity Info --- */}
      <div className="bg-gray-100 p-4 border border-black/20 rounded-xl mb-6">
        <table className="w-full text-sm font-bold">
          <tbody>
            <tr>
              <td className="py-1 w-24 text-gray-700">اسم العميل/مورد:</td>
              <td className="py-1 text-lg font-black">{entityName}</td>
              <td className="py-1 w-24 text-gray-700 text-left">رقم الهاتف:</td>
              <td className="py-1 min-w-[120px] text-left font-mono" dir="ltr">
                {entityPhone || "غير مسجل"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- Summary --- */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-black/20 p-4 rounded-xl text-center">
          <div className="text-xs font-bold text-gray-600 mb-1">
            إجمالي الحركات (عليه)
          </div>
          <div className="text-xl font-black font-mono">
            {totalDebt.toLocaleString()}
          </div>
        </div>
        <div className="border-2 border-black/20 p-4 rounded-xl text-center">
          <div className="text-xs font-bold text-gray-600 mb-1">
            إجمالي الحركات (له)
          </div>
          <div className="text-xl font-black font-mono">
            {totalPaid.toLocaleString()}
          </div>
        </div>
        <div
          className={`border-4 p-4 rounded-xl text-center ${balanceType === "مدين" ? "border-red-600 bg-red-50 text-red-900" : balanceType === "دائن" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-blue-600 bg-blue-50 text-blue-900"}`}
        >
          <div className="text-xs font-bold mb-1">
            الرصيد الحالي ({balanceType})
          </div>
          <div className={`text-2xl font-black font-mono`}>
            {Math.abs(currentBalance).toLocaleString()} ج.م
          </div>
        </div>
      </div>

      {/* --- Table --- */}
      <table className="w-full text-right border-collapse border-2 border-black/30 text-sm">
        <thead className="bg-gray-100 border-b-2 border-black/30">
          <tr>
            <th className="border border-black/20 px-3 py-2 text-center w-12">
              م
            </th>
            <th className="border border-black/20 px-3 py-2">التاريخ</th>
            <th className="border border-black/20 px-3 py-2">النوع</th>
            <th className="border border-black/20 px-3 py-2 w-1/3">البيان</th>
            <th className="border border-black/20 px-3 py-2 text-center">
              مدين (عليه)
            </th>
            <th className="border border-black/20 px-3 py-2 text-center">
              دائن (له)
            </th>
            <th className="border border-black/20 px-3 py-2 text-center bg-gray-200">
              الرصيد بعد الحركة
            </th>
          </tr>
        </thead>
        <tbody>
          {statementData.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="text-center py-6 font-bold text-gray-500"
              >
                لا توجد حركات مسجلة
              </td>
            </tr>
          ) : (
            statementData.map((item, idx) => (
              <tr key={idx} className="even:bg-gray-50 text-xs font-bold">
                <td className="border border-black/20 px-3 py-2 text-center">
                  {idx + 1}
                </td>
                <td
                  className="border border-black/20 px-3 py-2 font-mono"
                  dir="ltr"
                >
                  {format(new Date(item.date), "yyyy-MM-dd HH:mm")}
                </td>
                <td className="border border-black/20 px-3 py-2 text-center">
                  {item.type}
                </td>
                <td className="border border-black/20 px-3 py-2 text-gray-800">
                  {item.description}
                </td>
                <td className="border border-black/20 px-3 py-2 text-center font-mono">
                  {item.debt > 0 ? item.debt.toLocaleString() : "-"}
                </td>
                <td className="border border-black/20 px-3 py-2 text-center font-mono">
                  {(item.paid || item.credit) > 0
                    ? (item.paid || item.credit).toLocaleString()
                    : "-"}
                </td>
                <td className="border border-black/20 px-3 py-2 text-center font-mono bg-gray-100/50">
                  {item.balance?.toLocaleString() || 0}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* --- Footer Signature --- */}
      <div className="flex justify-between mt-12 text-sm font-bold pt-4 border-t-2 border-black/80">
        <div>توقيع العميل / المورد: ................................</div>
        <div>ختم الإدارة الماليـة: ................................</div>
      </div>

      <div className="text-center text-[10px] text-gray-500 mt-6 font-mono">
        تم إنشاء هذا الكشف بواسطة نظام {settings?.companyName || props.shopName || "تكة للإتصالات والصيانة"}
      </div>
    </div>
  );
});

PrintStatementTemplate.displayName = "PrintStatementTemplate";
