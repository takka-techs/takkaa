import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Building2, Store, Calendar, TrendingUp, Trophy, ArrowLeftRight, CreditCard,
  Phone, History, Download, MapPin, DollarSign, ArrowUpRight, ArrowDownRight, Package,
  FileText, Activity, RefreshCw, Printer
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

// We map colors for pie charts based on index
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16', '#06b6d4', '#64748b'];

export default function CustomersSuppliersReport() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Stats
  const [customersCount, setCustomersCount] = useState(0);
  const [suppliersCount, setSuppliersCount] = useState(0);
  
  // Top 10 Customers & Suppliers
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);

  // Raw data for other use cases
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`
      };

      // 1. Fetch Customers and Suppliers Base info
      const [cRes, sRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/customers?select=*${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/suppliers?select=*${branchSuffix}`, { headers })
      ]);
      const baseCustomers = cRes.ok ? await cRes.json() : [];
      const baseSuppliers = sRes.ok ? await sRes.json() : [];

      setCustomersCount(baseCustomers.length);
      setSuppliersCount(baseSuppliers.length);
      setAllCustomers(baseCustomers);
      setAllSuppliers(baseSuppliers);

      // 2. Fetch Sales Invoices for Customers Activity
      const invRes = await fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?select=id,customer_name,net_amount,created_at${branchSuffix}`, { headers });
      const invoices = invRes.ok ? await invRes.json() : [];

      // 3. Fetch Purchases for Suppliers Activity
      const [devRes, accRes, srRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/Devices?select=source,cost_price,created_at&entry_type=eq.purchase${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=supplier,cost_price,quantity,created_at&entry_type=eq.purchase${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=supplier_name,cost,quantity,created_at&entry_type=eq.purchase${branchSuffix}`, { headers })
      ]);
      
      const pDev = devRes.ok ? await devRes.json() : [];
      const pAcc = accRes.ok ? await accRes.json() : [];
      const pSr = srRes.ok ? await srRes.json() : [];

      // Process Top Customers
      const custMap: Record<string, any> = {};
      invoices.forEach((inv: any) => {
        const cName = inv.customer_name || 'نقدي';
        if (!custMap[cName]) {
          custMap[cName] = { name: cName, count: 0, total: 0, lastActivity: inv.created_at };
        }
        custMap[cName].count++;
        custMap[cName].total += (inv.net_amount || 0);
        if (new Date(inv.created_at) > new Date(custMap[cName].lastActivity)) {
          custMap[cName].lastActivity = inv.created_at;
        }
      });

      const topC = Object.values(custMap)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10);
      setTopCustomers(topC);

      // Process Top Suppliers
      const supMap: Record<string, any> = {};
      
      const processSup = (name: string, amt: number, date: string) => {
         const sName = name || 'غير محدد';
         if (!supMap[sName]) {
           supMap[sName] = { name: sName, count: 0, total: 0, lastActivity: date };
         }
         supMap[sName].count++;
         supMap[sName].total += amt;
         if (new Date(date) > new Date(supMap[sName].lastActivity)) {
           supMap[sName].lastActivity = date;
         }
      };

      pDev.forEach((d: any) => processSup(d.source, d.cost_price || 0, d.created_at));
      pAcc.forEach((a: any) => processSup(a.supplier, (a.cost_price || 0) * (a.quantity || 1), a.created_at));
      pSr.forEach((s: any) => processSup(s.supplier_name, (s.cost || 0) * (s.quantity || 1), s.created_at));

      const topS = Object.values(supMap)
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 10);
      setTopSuppliers(topS);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReportRef = useRef<HTMLDivElement>(null);
  const handleExportPDF = () => {
    if (window.self !== window.top) {
      alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في نافذة مستقلة (Open in new tab).');
      return;
    }
    executePrint();
  };
  const executePrint = useReactToPrint({
    contentRef: exportReportRef,
    documentTitle: `Customers_Suppliers_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  return (
    <div className="space-y-6" dir="rtl">
       <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
               <Users className="w-8 h-8 text-indigo-500" />
               تقارير العملاء والموردين
             </h2>
          </div>
          <div className="flex gap-2">
            <button 
               onClick={handleExportPDF}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-500/20"
            >
              <Printer className="w-4 h-4" /> طباعة / PDF
            </button>
          </div>
       </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقارير العملاء والموردين"
        summary={[
          { label: 'إجمالي العملاء', value: customersCount },
          { label: 'إجمالي الموردين', value: suppliersCount }
        ]}
        columns={[
          { header: 'الجهة', accessor: 'type' },
          { header: 'الاسم', accessor: 'name' },
          { header: 'المعاملات', accessor: 'count', isNumeric: true },
          { header: 'الإجمالي', accessor: (item) => Number(item.total).toLocaleString(), isNumeric: true },
          { header: 'آخر معاملة', accessor: (item) => item.lastActivity ? format(new Date(item.lastActivity), 'yyyy/MM/dd') : '-' }
        ]}
        data={[
          ...topCustomers.map(c => ({ ...c, type: 'عميل' })),
          ...topSuppliers.map(s => ({ ...s, type: 'مورد' }))
        ].sort((a, b) => b.total - a.total)}
      />

       {isLoading ? (
          <div className="h-40 flex items-center justify-center">
             <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
       ) : (
          <>
             {/* KPIs */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#11151c] rounded-2xl p-6 border-r-4 border-indigo-500 border border-slate-200 dark:border-white/5 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                     <span className="text-sm font-bold text-slate-500">إجمالي العملاء</span>
                     <Users className="w-6 h-6 text-indigo-500" />
                   </div>
                   <div className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                      {customersCount}
                   </div>
                </div>

                <div className="bg-white dark:bg-[#11151c] rounded-2xl p-6 border-r-4 border-teal-500 border border-slate-200 dark:border-white/5 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                     <span className="text-sm font-bold text-slate-500">إجمالي الموردين</span>
                     <Store className="w-6 h-6 text-teal-500" />
                   </div>
                   <div className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                      {suppliersCount}
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 10 Customers Table */}
                <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                   <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-white/[0.02]">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                         <Trophy className="w-5 h-5 text-amber-400" /> أفضل 10 عملاء
                      </h3>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-start whitespace-nowrap">
                         <thead className="bg-slate-50 dark:bg-[#11151c] text-slate-500 text-xs font-bold uppercase tracking-wider text-right">
                            <tr>
                               <th className="px-6 py-4">#</th>
                               <th className="px-6 py-4">العميل</th>
                               <th className="px-6 py-4">المعاملات</th>
                               <th className="px-6 py-4">الإجمالي</th>
                               <th className="px-6 py-4">آخر معاملة</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                            {topCustomers.map((c, i) => (
                               <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                  <td className="px-6 py-4 text-sm text-slate-500">{i + 1}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{c.name}</td>
                                  <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300">{c.count}</td>
                                  <td className="px-6 py-4 text-sm font-mono font-bold text-indigo-500">
                                     {c.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                     {c.lastActivity ? format(new Date(c.lastActivity), 'yyyy/MM/dd') : '-'}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Top 10 Suppliers Table */}
                <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                   <div className="p-5 border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-white/[0.02]">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                         <Store className="w-5 h-5 text-teal-400" /> أفضل 10 موردين
                      </h3>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-start whitespace-nowrap">
                         <thead className="bg-slate-50 dark:bg-[#11151c] text-slate-500 text-xs font-bold uppercase tracking-wider text-right">
                            <tr>
                               <th className="px-6 py-4">#</th>
                               <th className="px-6 py-4">المورد</th>
                               <th className="px-6 py-4">التوريدات</th>
                               <th className="px-6 py-4">الإجمالي</th>
                               <th className="px-6 py-4">آخر توريد</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                            {topSuppliers.map((s, i) => (
                               <tr key={s.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                  <td className="px-6 py-4 text-sm text-slate-500">{i + 1}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{s.name}</td>
                                  <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300">{s.count}</td>
                                  <td className="px-6 py-4 text-sm font-mono font-bold text-teal-500">
                                     {s.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                     {s.lastActivity ? format(new Date(s.lastActivity), 'yyyy/MM/dd') : '-'}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
             
             {/* Charts Row added as extra feature */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Customers Spread */}
                 <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                         <PieChart className="w-5 h-5 text-indigo-500" /> تركيز المبيعات للعملاء
                     </h3>
                     <div className="h-64 w-full" dir="ltr">
                         <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                             <Pie
                             data={topCustomers.slice(0, 5)}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="total"
                             >
                             {topCustomers.slice(0, 5).map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                             </Pie>
                             <RechartsTooltip 
                                formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'المبيعات']} 
                                contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', textAlign: 'right' }}
                             />
                             <Legend />
                         </PieChart>
                         </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Suppliers Spread */}
                 <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                         <TrendingUp className="w-5 h-5 text-teal-500" /> تركيز المشتريات من الموردين
                     </h3>
                     <div className="h-64 w-full" dir="ltr">
                         <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                             <Pie
                             data={topSuppliers.slice(0, 5)}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="total"
                             >
                             {topSuppliers.slice(0, 5).map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                             ))}
                             </Pie>
                             <RechartsTooltip 
                                formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'المشتريات']}
                                contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', textAlign: 'right' }} 
                             />
                             <Legend />
                         </PieChart>
                         </ResponsiveContainer>
                     </div>
                 </div>
             </div>
          </>
       )}
    </div>
  );
}
