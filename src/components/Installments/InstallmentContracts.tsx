import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  DollarSign,
  Calendar,
} from "lucide-react";
import InstallmentDetailsModal from "./InstallmentDetailsModal";
import CreateInstallment from "./CreateInstallment";
import PrintContractTemplate from "./PrintContractTemplate";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const API_KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

export default function InstallmentContracts({
  onNavigate,
  customerId,
}: {
  onNavigate?: (view: string) => void;
  customerId?: string;
}) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [printingContract, setPrintingContract] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isFeatureEnabled, setIsFeatureEnabled] = useState<boolean | null>(
    null,
  );
  const [crossBranch, setCrossBranch] = useState(false);

  const printComponentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `عقد_تقسيط_${printingContract?.id?.split("-")[0] || ""}`,
  });

  const printContract = (contract: any, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening details modal
    setPrintingContract(contract);
    // delay to allow state to update before printing
    setTimeout(() => {
      handlePrint();
    }, 150);
  };

  useEffect(() => {
    checkFeatureFlag().then((enabled) => {
      if (enabled) {
        fetchContracts();
      }
    });
  }, [customerId, crossBranch]);

  const checkFeatureFlag = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const userId = localStorage.getItem("user_id");
      const cashierStr = localStorage.getItem("active_cashier");
      const cashier = cashierStr ? JSON.parse(cashierStr) : null;
      if (!userId) {
        setIsFeatureEnabled(false);
        return false;
      }

      const isAdmin = localStorage.getItem("admin_active") === "true";
      const role = isAdmin
        ? "المدير (Admin)"
        : cashier?.role || "كاشير (Cashier)";

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/check_installment_feature_enabled`,
        {
          method: "POST",
          headers: {
            apikey: API_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ p_user_id: userId, p_role: role }),
        },
      );
      if (response.ok) {
        const enabled = await response.json();
        setIsFeatureEnabled(enabled);
        return enabled;
      }
      setIsFeatureEnabled(false);
      return false;
    } catch {
      setIsFeatureEnabled(false);
      return false;
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const userId = localStorage.getItem("user_id");
      const _tenantId = localStorage.getItem("tenant_id") || userId;
      const activeBranchId = localStorage.getItem("takka_active_branch_id");

      // Fetch contracts without embedding first to avoid relation errors
      let url = `${SUPABASE_URL}/rest/v1/installment_contracts?select=*&deleted_at=is.null&order=created_at.desc`;
      if (customerId) {
        url += `&client_id=eq.${customerId}`;
      }
      if (_tenantId) {
        url += `&tenant_id=eq.${_tenantId}`;
      }
      if (crossBranch) {
        url += url.includes("?")
          ? "&bypass_branch=true"
          : "?bypass_branch=true";
      }
      const response = await fetch(url, {
        headers: {
          apikey: API_KEY,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401)
          throw new Error(
            "انتهت الجلسة (JWT expired)، يرجى تحديث الصفحة أو تسجيل الدخول مجدداً",
          );
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.details ||
            errorData.hint ||
            "فشل جلب العقود",
        );
      }
      const data = await response.json();

      // Fetch clients to merge
      const clientsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/clients?select=id,name,phone${crossBranch ? "&bypass_branch=true" : ""}`,
        {
          headers: {
            apikey: API_KEY,
            Authorization: `Bearer ${token}`,
          },
        },
      );
      let clientsData: any[] = [];
      if (clientsRes.ok) {
        clientsData = await clientsRes.json();
      }

      const devicesRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Devices?select=id,company,model${crossBranch ? "&bypass_branch=true" : ""}`,
        {
          headers: { apikey: API_KEY, Authorization: `Bearer ${token}` },
        },
      );
      let devicesData: any[] = [];
      if (devicesRes.ok) devicesData = await devicesRes.json();

      const invoicesRes = await fetch(
        `${SUPABASE_URL}/rest/v1/Sales_Invoices?select=id,receipt_no,items${crossBranch ? "&bypass_branch=true" : ""}`,
        {
          headers: { apikey: API_KEY, Authorization: `Bearer ${token}` },
        },
      );
      let invoicesData: any[] = [];
      if (invoicesRes.ok) invoicesData = await invoicesRes.json();

      const mergedData = data.map((contract: any) => ({
        ...contract,
        clients: clientsData.find((c) => c.id === contract.client_id) || null,
        device: devicesData.find((d) => d.id === contract.device_id) || null,
        invoice: invoicesData.find((i) => i.id === contract.invoice_id) || null,
      }));

      setContracts(mergedData || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "overdue":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "completed":
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
      case "defaulted":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      case "rescheduled":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/10";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "نشط";
      case "overdue":
        return "متأخر";
      case "completed":
        return "مكتمل";
      case "defaulted":
        return "متعثر";
      case "rescheduled":
        return "مُعاد جدولته";
      case "draft":
        return "مسودة";
      default:
        return status;
    }
  };

  const filteredContracts = contracts.filter(
    (c) =>
      c.id.includes(searchTerm) ||
      (c.clients && c.clients.name.includes(searchTerm)) ||
      (c.clients && c.clients.phone.includes(searchTerm)),
  );

  if (isFeatureEnabled === false) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold">نظام التقسيط غير مفعّل لك</h2>
        <p className="text-sm mt-2">
          يرجى التواصل مع مدير النظام لتفعيل الصلاحية.
        </p>
      </div>
    );
  }

  if (showCreate) {
    return (
      <CreateInstallment
        onBack={() => setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false);
          fetchContracts();
        }}
      />
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute top-1/2 start-3 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم العقد، اسم العميل أو الموبايل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-white/5 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={crossBranch}
              onChange={(e) => setCrossBranch(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            عرض عقود جميع الفروع
          </label>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            عقد تقسيط جديد
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm">
          {error}
        </div>
      )}

      {/* Contracts List */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-6 py-4">رقم العقد</th>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">الصنف/الجهاز</th>
                <th className="px-6 py-4">الإجمالي</th>
                <th className="px-6 py-4">المقدم</th>
                <th className="px-6 py-4 text-center">أقساط</th>
                <th className="px-6 py-4">تاريخ العقد</th>
                <th className="px-6 py-4 text-center">الحالة</th>
                <th className="px-6 py-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex justify-center mb-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                    جاري التحميل...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    لا توجد عقود تقسيط مسجلة
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-[#1a2333] px-2 py-1 rounded inline-block">
                        {contract.id.substring(0, 8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {contract.clients?.name || "عميل غير معروف"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5" dir="ltr">
                        {contract.clients?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {contract.device ? (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {contract.device.company}
                          </div>
                          <div className="text-xs text-slate-500">
                            {contract.device.model}
                          </div>
                        </div>
                      ) : contract.invoice ? (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            فاتورة مبيعات
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-[150px]">
                            {Array.isArray(contract.invoice.items)
                              ? contract.invoice.items
                                  .map((i: any) => i.name)
                                  .join("، ")
                              : contract.invoice.receipt_no}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-xs">-</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {contract.total_price?.toLocaleString()} ج
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                      {contract.down_payment?.toLocaleString()} ج
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      <span className="bg-slate-100 dark:bg-[#1a2333] px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
                        {contract.installment_count}
                        <span className="text-xs text-slate-400">×</span>
                        {contract.installment_amount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(contract.created_at).toLocaleDateString(
                        "ar-EG",
                        { timeZone: "Africa/Cairo" },
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(contract.status)}`}
                      >
                        {getStatusLabel(contract.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => printContract(contract, e)}
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20"
                          title="طباعة العقد"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors border border-transparent hover:border-primary-100 dark:hover:border-primary-500/20"
                          title="التفاصيل"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printComponentRef && (
        <PrintContractTemplate
          contract={printingContract}
          componentRef={printComponentRef}
        />
      )}

      {selectedContract && (
        <InstallmentDetailsModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onUpdate={fetchContracts}
        />
      )}
    </div>
  );
}
