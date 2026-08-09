import React, { useState, useEffect } from "react";
import { useBranch } from "../contexts/BranchContext";
import { Loader2, TrendingUp, TrendingDown, Store, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function BranchAnalytics() {
  const { branches, isOwner } = useBranch();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOwner) {
      fetchAnalytics();
    }
  }, [isOwner]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const apiKey = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
      const baseUrl = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";

      const headers = {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
      };

      // Since we want branch comparison, we fetch data for all active branches and aggregate.
      // This could be heavy, ideally we should have an RPC.
      
      const salesRes = await fetch(`${baseUrl}/Sales_Invoices?select=id,net_amount,total_amount,branch_id&bypass_branch=true`, { headers });
      const sales = salesRes.ok ? await salesRes.json() : [];

      const maintenanceRes = await fetch(`${baseUrl}/Repairs?select=id,total_amount,receiving_branch_id&status=eq.تم التسليم&bypass_branch=true`, { headers });
      const maintenance = maintenanceRes.ok ? await maintenanceRes.json() : [];

      const expensesRes = await fetch(`${baseUrl}/treasury_transactions?select=amount,branch_id&type=eq.out&bypass_branch=true`, { headers });
      const expenses = expensesRes.ok ? await expensesRes.json() : [];

      const branchAnalytics = branches.map(branch => {
        const branchSales = sales.filter((s: any) => s.branch_id === branch.id).reduce((acc: number, s: any) => acc + Number(s.net_amount || s.total_amount || 0), 0);
        const branchMaintenance = maintenance.filter((m: any) => m.receiving_branch_id === branch.id).reduce((acc: number, m: any) => acc + Number(m.total_amount || 0), 0);
        const branchExpenses = expenses.filter((e: any) => e.branch_id === branch.id).reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);

        const totalIncome = branchSales + branchMaintenance;
        const totalOutcome = branchExpenses;
        const netProfit = totalIncome - totalOutcome;

        return {
          ...branch,
          totalIncome,
          totalOutcome,
          netProfit,
          sales: branchSales,
          maintenance: branchMaintenance
        };
      });

      // Sort by netProfit descending
      branchAnalytics.sort((a, b) => b.netProfit - a.netProfit);

      setData(branchAnalytics);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return <div className="p-8 text-center text-red-500 font-bold">غير مصرح لك بالدخول لهذه الصفحة</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">تقييم أداء الفروع</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">مقارنة شاملة لحجم المبيعات والأرباح لكل فرع</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid gap-6">
          {data.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-[#11151c] rounded-3xl p-6 border border-slate-100 dark:border-white/5 relative overflow-hidden"
            >
              {index === 0 && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-black px-4 py-1 rounded-bl-xl shadow-lg">
                  الفرع الأفضل أداءً 🏆
                </div>
              )}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{branch.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`flex items-center gap-1 text-sm font-bold ${branch.is_active ? 'text-green-500' : 'text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${branch.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {branch.is_active ? "نشط" : "غير نشط"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-[#0d1117] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الدخل</div>
                  <div className="text-xl font-black text-green-600 dark:text-green-500 flex items-center gap-1">
                    {branch.totalIncome.toLocaleString()} <span className="text-sm">ج.م</span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-[#0d1117] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">المبيعات</div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-500 flex items-center gap-1">
                    {branch.sales.toLocaleString()} <span className="text-sm">ج.م</span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-[#0d1117] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي المصروفات</div>
                  <div className="text-xl font-black text-red-600 dark:text-red-500 flex items-center gap-1">
                    {branch.totalOutcome.toLocaleString()} <span className="text-sm">ج.م</span>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl border ${branch.netProfit >= 0 ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20'}`}>
                  <div className={`text-sm font-bold mb-1 ${branch.netProfit >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>صافي الربح</div>
                  <div className={`text-2xl font-black flex items-center gap-1 ${branch.netProfit >= 0 ? 'text-primary-700 dark:text-primary-500' : 'text-red-700 dark:text-red-500'}`}>
                    {branch.netProfit.toLocaleString()} <span className="text-sm">ج.م</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {data.length === 0 && (
            <div className="text-center py-12 text-slate-500 font-bold bg-white dark:bg-white/5 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
              لا توجد بيانات للفروع
            </div>
          )}
        </div>
      )}
    </div>
  );
}
