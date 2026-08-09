import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Building2,
  Plus,
  Edit,
  CheckCircle,
  Ban,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { useBranch } from "../contexts/BranchContext";
import { Branch } from "../types/branch";

export default function BranchManagement() {
  const { isOwner } = useBranch();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    logo_url: "",
    invoice_header: "",
    invoice_footer: "",
    is_active: true,
  });

  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const userId = localStorage.getItem("user_id");
      const apiKey = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
      const baseUrl = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";

      if (!token || !userId) return;

      const headers = {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
      };

      const activeCashierStr = localStorage.getItem("active_cashier");
      const activeCashier = activeCashierStr ? JSON.parse(activeCashierStr) : null;
      let tenantId = activeCashier?.tenant_id || userId;

      // Double check for actual tenant id
      if (!activeCashier?.tenant_id && userId) {
          try {
              const uRes = await fetch(`${baseUrl}/app_users?user_id=eq.${userId}&select=tenant_id`, { headers });
              if (uRes.ok) {
                  const uData = await uRes.json();
                  if (uData && uData.length > 0 && uData[0].tenant_id) {
                      tenantId = uData[0].tenant_id;
                  }
              }
          } catch (e) {
              console.error("Failed to fetch accurate tenant_id", e);
          }
      }

      const res = await fetch(
        `${baseUrl}/branches?tenant_id=eq.${tenantId}&order=created_at.asc`,
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        setBranches(data);

        // Fetch some basic stats per branch using rpc or parallel fetches
        // Since we don't have RPC for counts ready, we'll fetch them individually
        const newStats: Record<string, any> = {};
        for (const b of data) {
          const [empRes, whRes] = await Promise.all([
            fetch(`${baseUrl}/app_users?branch_id=eq.${b.id}&select=id`, {
              headers,
            }),
            fetch(`${baseUrl}/warehouses?branch_id=eq.${b.id}&select=id`, {
              headers,
            }),
          ]);
          newStats[b.id] = {
            employees: empRes.ok ? (await empRes.json()).length : 0,
            warehouses: whRes.ok ? (await whRes.json()).length : 0,
          };
        }
        setStats(newStats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const userId = localStorage.getItem("user_id");
      const apiKey = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
      const baseUrl = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";

      const headers = {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (editingBranch) {
        let response = await fetch(`${baseUrl}/branches?id=eq.${editingBranch.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.clone().json().catch(() => null);
          if (errorData && (errorData.code === 'PGRST204' || errorData.code === 'PGRST205' || errorData.message?.includes('column'))) {
             const safeUpdate = {
               name: formData.name,
               address: formData.address,
               is_active: formData.is_active
             };
             await fetch(`${baseUrl}/branches?id=eq.${editingBranch.id}`, {
               method: "PATCH",
               headers,
               body: JSON.stringify(safeUpdate),
             });
          }
        }
      } else {
        const activeCashierStr = localStorage.getItem("active_cashier");
        const activeCashier = activeCashierStr ? JSON.parse(activeCashierStr) : null;
        let tenantId = activeCashier?.tenant_id || userId;

        // Double check tenantId from app_users just to be absolutely certain, especially for owners
        if (!activeCashier?.tenant_id && userId) {
            try {
                const uRes = await fetch(`${baseUrl}/app_users?user_id=eq.${userId}&select=tenant_id`, { headers });
                if (uRes.ok) {
                    const uData = await uRes.json();
                    if (uData && uData.length > 0 && uData[0].tenant_id) {
                        tenantId = uData[0].tenant_id;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch accurate tenant_id", e);
            }
        }

        const payload = {
          ...formData,
          tenant_id: tenantId,
        };
        let res = await fetch(`${baseUrl}/branches`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify([payload]),
        });

        if (!res.ok) {
           const clonedRes = res.clone();
           const errorData = await clonedRes.json().catch(() => null);
           console.error("Branch insert err 1:", errorData);
           if (errorData && (errorData.code === 'PGRST204' || errorData.code === 'PGRST205' || (errorData.message && errorData.message.includes('column')))) {
              const safePayload = {
                 name: formData.name,
                 address: formData.address,
                 is_active: formData.is_active,
                 tenant_id: tenantId
              };
              res = await fetch(`${baseUrl}/branches`, {
                method: "POST",
                headers: { ...headers, Prefer: "return=representation" },
                body: JSON.stringify([safePayload]),
              });
           }
        }

        if (!res.ok) {
           const err = await res.text();
           throw new Error(`فشل حفظ الفرع: ${err}`);
        }

        if (res.ok) {
          const newBranch = await res.json();
          let branchId = null;
          if (Array.isArray(newBranch) && newBranch.length > 0) {
              branchId = newBranch[0].id;
          } else if (newBranch && newBranch.id) {
              branchId = newBranch.id;
          }
          
          if (branchId) {
            // Setup default wallet
            try {
              const walletsPayload = [
                {
                  name: "الخزينة الرئيسية الكاش",
                  type: "cash",
                  is_default: true,
                  status: "active",
                  balance: 0,
                  branch_id: branchId,
                  user_id: userId,
                  tenant_id: tenantId,
                },
                {
                  name: "الخزينة الرئيسية المحفظة الإلكترونية",
                  type: "e_wallet",
                  is_default: false,
                  status: "active",
                  balance: 0,
                  branch_id: branchId,
                  user_id: userId,
                  tenant_id: tenantId,
                },
                {
                  name: "الخزينة الرئيسية الحساب البنكي",
                  type: "bank",
                  is_default: false,
                  status: "active",
                  balance: 0,
                  branch_id: branchId,
                  user_id: userId,
                  tenant_id: tenantId,
                }
              ];
              let wRes = await fetch(`${baseUrl}/wallets`, {
                method: "POST",
                headers,
                body: JSON.stringify(walletsPayload),
              });
              if (!wRes.ok) {
                console.error("Wallet insert failed, trying minimal payload");
                // Try minimal payload
                await fetch(`${baseUrl}/wallets`, {
                  method: "POST",
                  headers,
                  body: JSON.stringify(walletsPayload.map(w => ({
                    name: w.name,
                    balance: w.balance,
                    branch_id: w.branch_id,
                    is_default: w.is_default
                  }))),
                });
              }
            } catch (e) {
              console.error("Wallet default error", e);
            }

            // Setup default app_settings
            await fetch(`${baseUrl}/app_settings`, {
              method: "POST",
              headers,
              body: JSON.stringify([{ branch_id: branchId, user_id: userId, tenant_id: tenantId }]),
            }).catch((e) => console.error("AppSettings default error", e));

            // Setup default warehouses
            const types = ["devices", "accessories", "spare_parts"];
            const typeLabels: Record<string, string> = {
              devices: "الأجهزة (الرئيسي)",
              accessories: "الإكسسوارات (الرئيسي)",
              spare_parts: "قطع الغيار (الرئيسي)",
            };
            const wPayloads = types.map((t) => ({
              name: typeLabels[t],
              type: t,
              is_default: true,
              branch_id: branchId,
              color: "blue",
              icon: "📦",
              user_id: userId,
              tenant_id: tenantId
            }));
            await fetch(`${baseUrl}/Warehouses`, {
              method: "POST",
              headers,
              body: JSON.stringify(wPayloads),
            }).catch((e) => console.error("Warehouse default error", e));
          }
        }
      }

      setIsModalOpen(false);
      fetchBranches();

      // Update global context branch list if possible
      window.dispatchEvent(new CustomEvent("login_state_changed"));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingBranch(null);
    setFormData({ name: "", address: "", phone: "", logo_url: "", invoice_header: "", invoice_footer: "", is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (b: Branch) => {
    setEditingBranch(b);
    setFormData({
      name: b.name,
      address: b.address || "",
      phone: b.phone || "",
      logo_url: b.logo_url || "",
      invoice_header: b.invoice_header || "",
      invoice_footer: b.invoice_footer || "",
      is_active: b.is_active,
    });
    setIsModalOpen(true);
  };

  const toggleStatus = async (b: Branch) => {
    try {
      const token = localStorage.getItem("access_token");
      const apiKey = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
      const baseUrl = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";

      await fetch(`${baseUrl}/branches?id=eq.${b.id}`, {
        method: "PATCH",
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !b.is_active }),
      });
      fetchBranches();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center text-slate-500">
        <Ban className="w-16 h-16 mb-4 text-red-300" />
        <h2 className="text-2xl font-bold mb-2 text-slate-700 dark:text-slate-300">
          غير مصرح لك
        </h2>
        <p>هذه الصفحة مخصصة لمالك النظام فقط.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
              <Building2 className="w-5 h-5" />
            </div>
            إدارة الفروع
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            إضافة وإدارة فروع النظام والمخازن التابعة لكل فرع
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-primary-500/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">إضافة فرع جديد</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`absolute top-0 right-0 w-1.5 h-full ${b.is_active ? "bg-green-500" : "bg-red-500"}`}
              ></div>

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      {b.name}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.is_active ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"}`}
                    >
                      {b.is_active ? "نشط" : "متوقف"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors"
                    title="تعديل فرع"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(b)}
                    className={`p-2 rounded-lg transition-colors ${b.is_active ? "text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-green-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10"}`}
                    title={b.is_active ? "إيقاف الفرع" : "تنشيط الفرع"}
                  >
                    {b.is_active ? (
                      <Ban className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {b.address && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    العنوان:{" "}
                  </span>
                  {b.address}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mt-6 border-t border-slate-100 dark:border-white/5 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-800 dark:text-white mb-1">
                    {stats[b.id]?.employees || 0}
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    موظف
                  </div>
                </div>
                <div className="text-center border-r border-slate-100 dark:border-white/5">
                  <div className="text-2xl font-black text-slate-800 dark:text-white mb-1">
                    {stats[b.id]?.warehouses || 0}
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    مخزن
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white dark:bg-[#11151c] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5"
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingBranch ? "تعديل فرع" : "إضافة فرع جديد"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  اسم الفرع *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white"
                  placeholder="مثال: فرع القاهرة"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  العنوان
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white"
                  placeholder="عنوان الفرع بالتفصيل"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    رقم الهاتف للفواتير
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    رابط الشعار المخصص
                  </label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) =>
                      setFormData({ ...formData, logo_url: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  ترويسة الفاتورة المخصصة (Header)
                </label>
                <input
                  type="text"
                  value={formData.invoice_header}
                  onChange={(e) =>
                    setFormData({ ...formData, invoice_header: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  تذييل الفاتورة المخصصة (Footer)
                </label>
                <input
                  type="text"
                  value={formData.invoice_footer}
                  onChange={(e) =>
                    setFormData({ ...formData, invoice_footer: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 mt-4 bg-slate-50 dark:bg-[#0d1117] p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <input
                  type="checkbox"
                  id="is_active_toggle"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <label
                  htmlFor="is_active_toggle"
                  className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  الفرع نشط
                </label>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] flex justify-center items-center gap-2 px-4 py-3 text-white font-bold bg-primary-500 hover:bg-primary-600 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_var(--accent-500)] shadow-primary-500/20"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  حفظ البيانات
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
