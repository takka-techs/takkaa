import React from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useBranch } from "../contexts/BranchContext";
import { useSettings } from "../contexts/SettingsContext";

interface Column {
  header: string;
  accessor: string | ((item: any) => React.ReactNode);
  isNumeric?: boolean;
  isCurrency?: boolean;
}

interface PrintReportTemplateProps {
  title: string;
  subtitle?: string;
  columns: Column[];
  data: any[];
  summary?: { label: string; value: React.ReactNode; isCurrency?: boolean }[];
}

export const PrintReportTemplate = React.forwardRef<
  HTMLDivElement,
  PrintReportTemplateProps
>(({ title, subtitle, columns, data, summary }, ref) => {
  const { currentBranch } = useBranch();
  const { settings } = useSettings();
  return (
    <div className="print-only" style={{ display: "none", direction: "rtl" }}>
      <div
        ref={ref}
        className="bg-white text-black font-sans px-8 py-8 mx-auto w-full"
      >
        <style>{`
            @media print {
              @page { size: A4 portrait; margin: 10mm; }
              body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; font-size: 11pt; direction: rtl; }
              .screen-only { display: none !important; }
              .print-only { display: block !important; position: static !important; width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; }
              table { width: 100%; border-collapse: collapse; page-break-inside: auto; margin-bottom: 20px; font-size: 12px; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
              thead { display: table-header-group; background-color: #f1f5f9; }
              tfoot { display: table-footer-group; }
              * { overflow: visible !important; }
            }
          `}</style>

        <div className="text-center mb-8 border-b-2 border-slate-200 pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          {currentBranch && (
            <div className="inline-block mt-2 font-bold px-3 py-1 bg-slate-100 border border-slate-200 rounded-md">
              فرع {currentBranch.name}
            </div>
          )}
          {subtitle && (
            <p className="text-lg text-slate-600 mt-2 font-medium">
              {subtitle}
            </p>
          )}
          <p className="text-sm text-slate-500 mt-2">
            تاريخ الطباعة:{" "}
            {format(new Date(), "yyyy/MM/dd hh:mm a", { locale: ar })}
          </p>
        </div>

        {summary && summary.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {summary.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center"
              >
                <p className="text-slate-500 text-sm font-bold mb-1">
                  {item.label}
                </p>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {item.value}{" "}
                  {item.isCurrency && (
                    <span className="text-sm font-normal text-slate-500">
                      ج.م
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        {data.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                {columns.map((col, i) => (
                  <th key={i} className={col.isNumeric ? "text-center" : ""}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="text-center font-mono text-slate-500">
                    {idx + 1}
                  </td>
                  {columns.map((col, i) => (
                    <td
                      key={i}
                      className={col.isNumeric ? "text-center font-mono" : ""}
                    >
                      {typeof col.accessor === "function"
                        ? col.accessor(row)
                        : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-slate-500 border border-slate-200 rounded-xl bg-slate-50">
            لا توجد بيانات متاحة في هذا التقرير
          </div>
        )}

        <div className="mt-12 text-center text-sm text-slate-500">
          تم إصدار هذا التقرير من نظام {settings?.companyName || "TAKKA ERP"}
        </div>
      </div>
    </div>
  );
});
