import React, { forwardRef } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useBranch } from "../contexts/BranchContext";

interface Props {
  data: {
    sales: any[];
    purchases: any[];
    maintenance: any[];
    expenses: any[];
    transactions: any[];
    selectedDate: Date;
    companyName: string;
    salesReturns?: any[];
    maintenanceRevenue: number;
    maintenanceReturns: number;
    inspectionFees: number;
    maintenancePartsCost: number;
    totalMaintenanceProfit: number;
    totalProfit: number;
    totalReturnsParams: number;
    netSalesParams: number;
    profitMargin: number;
    totalPurchasesParams: number;
    totalExpenses: number;
    cashIn: number;
    cashOut: number;
    netCashflow: number;
    totalSalesParams: number;
  };
}

const PrintDailyReportTemplate = forwardRef<HTMLDivElement, Props>(
  ({ data }, ref) => {
    const {
      sales,
      purchases,
      maintenance,
      expenses,
      transactions,
      selectedDate,
      companyName,
      salesReturns = [],
      maintenanceRevenue,
      maintenanceReturns,
      inspectionFees,
      maintenancePartsCost,
      totalMaintenanceProfit,
      totalProfit,
      totalReturnsParams,
      netSalesParams,
      profitMargin,
      totalPurchasesParams,
      totalExpenses,
      cashIn,
      cashOut,
      netCashflow,
      totalSalesParams,
    } = data;
    const { currentBranch } = useBranch();

    const dateStr = format(selectedDate, "EEEE، dd MMMM yyyy", { locale: ar });

    const translateItemType = (type: string) => {
      switch (type) {
        case "device":
          return "أجهزة";
        case "accessory":
          return "إكسسوارات";
        case "spare_part":
          return "قطع غيار";
        default:
          return "أخرى";
      }
    };

    const translateTransactionType = (type: string) => {
      if (type === "in" || type === "income") return "إيداع";
      if (type === "out" || type === "expense") return "سحب/مصروف";
      return type;
    };

    // دالة لتجميع العناصر حسب النوع (device, accessory, spare_part, ...)
    const groupItemsByType = (items: any[]) => {
      return items.reduce((acc: Record<string, any[]>, item) => {
        const type = item.item_type || "other";
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
      }, {});
    };

    const groupedSales = groupItemsByType(sales);
    const groupedPurchases = groupItemsByType(purchases);

    return (
      <div
        ref={ref}
        className="p-8 bg-white text-black font-sans w-full mx-auto"
        dir="rtl"
        style={{ direction: "rtl", maxWidth: "297mm" }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black mb-1">
            {companyName || "I-MAXX"}
          </h1>
          {currentBranch && (
            <div className="text-[16px] font-bold mt-1 text-center bg-gray-200 px-3 py-1 rounded-sm w-max mx-auto mb-2">
              فرع {currentBranch.name}
            </div>
          )}
          <p className="text-slate-600 text-lg">{dateStr}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-6 gap-3 mb-8">
          {[
            { label: "المبيعات الإجمالية", value: totalSalesParams },
            { label: "إجمالي المرتجعات", value: totalReturnsParams },
            { label: "صافي المبيعات", value: netSalesParams },
            { label: "صافي الربح", value: totalProfit },
            { label: "المشتريات", value: totalPurchasesParams },
            { label: "إيرادات الصيانة", value: maintenanceRevenue },
            { label: "مرتجعات (مرفوض)", value: maintenanceReturns },
            { label: "رسوم كشف (مرفوض)", value: inspectionFees },
            { label: "صافي ربح الصيانة", value: totalMaintenanceProfit },
            { label: "المصروفات", value: totalExpenses },
            { label: "صافي التدفق", value: netCashflow },
          ].map((item, idx) => (
            <div
              key={idx}
              className="border border-slate-300 rounded-lg p-3 text-center flex flex-col justify-center bg-white shadow-sm h-20"
            >
              <span className="text-xs font-bold text-slate-600 mb-1">
                {item.label}
              </span>
              <span className="font-bold text-base whitespace-nowrap">
                {item.value.toLocaleString()} ج.م
              </span>
            </div>
          ))}
        </div>

        <style>{`
        .print-table { width: 100%; border-collapse: collapse; text-align: right; font-size: 11px; margin-bottom: 16px; }
        .print-table th, .print-table td { border: 1px solid #d1d5db; padding: 6px 8px; }
        .print-table th { background-color: #f8fafc; font-weight: bold; color: #334155; }
        .print-section-title { background-color: #f1f5f9; padding: 8px 12px; font-weight: bold; font-size: 14px; border: 1px solid #d1d5db; border-bottom: none; display: flex; justify-content: flex-start; align-items: center; gap: 8px; border-radius: 4px 4px 0 0; }
        .group-header-row { background-color: #e2e8f0; font-weight: bold; text-align: right; color: #1e293b; }
        .empty-row { text-align: center !important; color: #64748b; padding: 12px !important; }
      `}</style>

        {/* Sales Section */}
        <div className="mb-6">
          <div className="print-section-title">
            <span>💰 المبيعات</span>
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>الصنف</th>
                <th>الكمية</th>
                <th>سعر البيع</th>
                <th>التكلفة</th>
                <th>الربح</th>
                <th>العميل</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedSales).length > 0 ? (
                Object.entries(groupedSales).map(([type, items]) => {
                  let subCounter = 1;
                  return (
                    <React.Fragment key={type}>
                      {/* Sub-header for Category */}
                      <tr className="group-header-row">
                        <td colSpan={8} className="py-1.5 px-3 bg-slate-200 text-slate-800 font-bold">
                          📁 {translateItemType(type)} ({items.length})
                        </td>
                      </tr>
                      {items.map((sale: any) => (
                        <tr key={sale.id}>
                          <td>{subCounter++}</td>
                          <td>{sale.item_name}</td>
                          <td>{sale.quantity}</td>
                          <td>{Number(sale.selling_price).toLocaleString()}</td>
                          <td>{Number(sale.cost_price).toLocaleString()}</td>
                          <td>{Number(sale.profit).toLocaleString()}</td>
                          <td>{sale.customer_name || "نقدي"}</td>
                          <td>
                            {sale.created_at
                              ? format(new Date(sale.created_at), "hh:mm a")
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="empty-row">
                    لا توجد مبيعات في هذا اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sales Returns Section */}
        <div className="mb-6">
          <div className="print-section-title">
            <span>🔄 مرتجعات المبيعات</span>
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>رقم الفاتورة</th>
                <th>العميل</th>
                <th>نوع المنتج</th>
                <th>المنتج المعني</th>
                <th>السبب</th>
                <th className="text-rose-600">المبلغ المسترد</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {salesReturns && salesReturns.length > 0 ? (
                salesReturns.map((ret, i) => (
                  <tr key={ret.id}>
                    <td>{i + 1}</td>
                    <td>{ret.invoice_number || "-"}</td>
                    <td>{ret.customer_name || "نقدي"}</td>
                    <td>
                      {ret.product_type === "device"
                        ? "جهاز"
                        : ret.product_type === "accessory"
                          ? "إكسسوار"
                          : ret.product_type || "غير محدد"}
                    </td>
                    <td>{ret.product_name || "-"}</td>
                    <td>{ret.reason || "-"}</td>
                    <td className="font-bold text-rose-600">
                      {Number(ret.refund_amount || ret.total_amount || 0).toLocaleString()} ج.م
                    </td>
                    <td>
                      {ret.created_at
                        ? format(new Date(ret.created_at), "hh:mm a")
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="empty-row">
                    لا توجد مرتجعات مبيعات في هذا اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Purchases Section */}
        <div className="mb-6">
          <div className="print-section-title">
            <span>🛒 المشتريات</span>
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>الصنف</th>
                <th>الكمية</th>
                <th>سعر الشراء</th>
                <th>المورد</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedPurchases).length > 0 ? (
                Object.entries(groupedPurchases).map(([type, items]) => {
                  let subCounter = 1;
                  return (
                    <React.Fragment key={type}>
                      {/* Sub-header for Category */}
                      <tr className="group-header-row">
                        <td colSpan={6} className="py-1.5 px-3 bg-slate-200 text-slate-800 font-bold">
                          📁 {translateItemType(type)} ({items.length})
                        </td>
                      </tr>
                      {items.map((purchase: any) => (
                        <tr key={purchase.id}>
                          <td>{subCounter++}</td>
                          <td>{purchase.item_name}</td>
                          <td>{purchase.quantity}</td>
                          <td>{Number(purchase.purchase_price).toLocaleString()}</td>
                          <td>{purchase.supplier_name || "-"}</td>
                          <td>
                            {purchase.created_at
                              ? format(new Date(purchase.created_at), "hh:mm a")
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="empty-row">
                    لا توجد مشتريات في هذا اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Maintenance Section */}
        <div className="mb-6">
          <div className="print-section-title">
            <span>🔧 الصيانة</span>
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>رقم التذكرة</th>
                <th>العميل</th>
                <th>الجهاز</th>
                <th>المشكلة</th>
                <th>التكلفة</th>
                <th>المدفوع</th>
                <th>الحالة</th>
                <th>الفني</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {maintenance.length > 0 ? (
                maintenance.map((maint, i) => (
                  <tr key={maint.id}>
                    <td>{i + 1}</td>
                    <td>{maint.id}</td>
                    <td>{maint.customer_name || "-"}</td>
                    <td>{maint.device_name}</td>
                    <td>{maint.problem}</td>
                    <td>{Number(maint.cost).toLocaleString()}</td>
                    <td>{Number(maint.paid_amount).toLocaleString()}</td>
                    <td>{maint.status}</td>
                    <td>{maint.technician_name || "-"}</td>
                    <td>
                      {maint.created_at
                        ? format(new Date(maint.created_at), "hh:mm a")
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="empty-row">
                    لا توجد صيانة في هذا اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Expenses Section */}
        <div className="mb-6">
          <div className="print-section-title">
            <span>🧾 المصروفات</span>
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>البيان</th>
                <th>المبلغ</th>
                <th>المحفظة</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? (
                expenses.map((expense, i) => (
                  <tr key={expense.id}>
                    <td>{i + 1}</td>
                    <td>{expense.description}</td>
                    <td>{Number(expense.amount).toLocaleString()}</td>
                    <td>{expense.wallet_id || "الخزينة الرئيسية"}</td>
                    <td>
                      {expense.created_at
                        ? format(new Date(expense.created_at), "hh:mm a")
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-row">
                    لا توجد مصروفات في هذا اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Transactions Section */}
        <div style={{ pageBreakInside: "avoid" }} className="mb-6">
          <div className="print-section-title">
            <span>💵 حركات الصندوق</span>
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>النوع</th>
                <th>البيان</th>
                <th>المبلغ</th>
                <th>المحفظة</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((t, i) => (
                  <tr key={t.id}>
                    <td>{i + 1}</td>
                    <td>{translateTransactionType(t.type)}</td>
                    <td>{t.description || t.category}</td>
                    <td>{Number(t.amount).toLocaleString()}</td>
                    <td>{t.wallet_id || "الخزينة الرئيسية"}</td>
                    <td>
                      {t.created_at
                        ? format(new Date(t.created_at), "hh:mm a")
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-row">
                    لا توجد حركات صندوق في هذا اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 mb-4 text-slate-400 text-[10px] tracking-widest uppercase font-mono">
          نظام {companyName || "TAKKA ERP"} للإدارة المالية والتقارير
        </div>
      </div>
    );
  }
);

export default PrintDailyReportTemplate;