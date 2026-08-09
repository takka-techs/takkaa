import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Trophy, Wrench, AlertTriangle, DollarSign, TrendingUp, Award, UserX, Calculator } from 'lucide-react';
const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

export default function ManagerAnalytics() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'leaderboard'>('analytics');
  const [isLoading, setIsLoading] = useState(true);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const activeBranchId = localStorage.getItem('takka_active_branch_id');
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');

      const headers = {
        'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
        'Authorization': `Bearer ${token}`
      };

      // 1. Fetch Repairs
      let repairsUrl = `${SUPABASE_URL}/rest/v1/Repairs?select=*&limit=5000`;
      if (tenantId) repairsUrl += `&tenant_id=eq.${tenantId}`;
      if (activeBranchId) repairsUrl += `&branch_id=eq.${activeBranchId}`;
      const repairsRes = await fetch(repairsUrl, { headers });
      const repairsData = repairsRes.ok ? await repairsRes.json() : [];
      setRepairs(repairsData);

      // 2. Fetch Sales (General Sales) for profit comparison
      let salesUrl = `${SUPABASE_URL}/rest/v1/Sales_Invoices?select=*,Sales_Items(*)&limit=5000`;
      if (tenantId) {
        salesUrl += `&tenant_id=eq.${tenantId}`;
      }
      if (activeBranchId) {
        salesUrl += `&branch_id=eq.${activeBranchId}`;
      }
      const salesRes = await fetch(salesUrl, { headers });
      const salesData = salesRes.ok ? await salesRes.json() : [];
      
      // Flatten Sales_Items
      const allSalesItems = [];
      salesData.forEach(inv => {
        if (inv.Sales_Items && Array.isArray(inv.Sales_Items)) {
          inv.Sales_Items.forEach(item => {
            allSalesItems.push({
              ...item,
              Sales_Invoices: inv
            });
          });
        }
      });
      setSales(allSalesItems);

    } catch (err) {
      console.error('Error fetching analytics data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Data Processing ---
  const currentMonthStart = dateRange.from;
  const currentMonthEnd = dateRange.to;

  const thisMonthRepairs = repairs.filter(r => {
    const d = new Date(r.created_at || r.received_date || Date.now());
    return d >= currentMonthStart && d <= currentMonthEnd;
  });

  const thisMonthSales = sales.filter(s => {
    const invDate = s.Sales_Invoices?.invoice_date || s.created_at;
    if (!invDate) return false;
    const d = new Date(invDate);
    return d >= currentMonthStart && d <= currentMonthEnd;
  });

  // 1. Most Repaired Models
  const modelsMap = new Map<string, number>();
  thisMonthRepairs.forEach(r => {
    if (r.device_name) {
      const name = r.device_name.trim();
      modelsMap.set(name, (modelsMap.get(name) || 0) + 1);
    }
  });
  const topModels = Array.from(modelsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 2. Technician Performance & Leaderboard
  const techsMap = new Map<string, { completed: number, returned: number, totalRevenue: number, totalProfit: number }>();
  thisMonthRepairs.forEach(r => {
    const tech = r.technician_name || 'غير محدد';
    if (!techsMap.has(tech)) {
      techsMap.set(tech, { completed: 0, returned: 0, totalRevenue: 0, totalProfit: 0 });
    }
    const stats = techsMap.get(tech)!;
    
    if (r.status === 'تم التسليم') {
      stats.completed += 1;
      const revenue = Number(r.paid_amount || r.total_amount || 0);
      const cost = Number(r.cost || 0);
      stats.totalRevenue += revenue;
      stats.totalProfit += (revenue - cost);
    } else if (r.status === 'مرتجع / تم الاسترداد') {
      stats.returned += 1;
    }
  });
  const techLeaderboard = Array.from(techsMap.entries())
    .map(([name, stats]) => ({
      name,
      ...stats,
      score: stats.completed - (stats.returned * 2) // Simple scoring: penalize returns
    }))
    .sort((a, b) => b.score - a.score);

  // 3. Profit Comparison (Sales vs Maintenance)
  const maintenanceProfit = thisMonthRepairs
    .filter(r => r.status === 'تم التسليم')
    .reduce((sum, r) => {
      const total = Number(r.paid_amount || r.total_amount || 0) || 0;
      const cost = Number(r.cost || 0) || 0;
      return sum + (total - cost);
    }, 0);

  const salesProfit = thisMonthSales.reduce((sum, s) => {
    const qty = Number(s.quantity || 1) || 1;
    const unitPrice = Number(s.unit_price || s.price || 0) || 0;
    const price = Number(s.total_price || (unitPrice * qty) || 0) || 0;
    const cost = Number(s.cost_price || s.cost || 0) || 0;
    return sum + (price - (cost * qty));
  }, 0);

  const profitData = [
    { name: 'أرباح الصيانة', value: Math.max(0, maintenanceProfit || 0) },
    { name: 'أرباح المبيعات', value: Math.max(0, salesProfit || 0) }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">التحليلات وحوش الصيانة</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            إحصائيات متقدمة وتقييم أداء الفنيين للفترة المحددة
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 font-medium whitespace-nowrap">من:</label>
            <input 
              type="date" 
              value={format(dateRange.from, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500 font-medium whitespace-nowrap">إلى:</label>
            <input 
              type="date" 
              value={format(dateRange.to, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          لوحة التحليلات الذكية
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex gap-2 items-center ${
            activeTab === 'leaderboard'
              ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Trophy size={16} />
          وحوش الصيانة
        </button>
      </div>

            {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profit Comparison */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <DollarSign className="text-emerald-500" />
                أرباح الصيانة مقابل المبيعات
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {(profitData[0].value === 0 && profitData[1].value === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <DollarSign size={40} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="font-bold text-slate-500 dark:text-slate-400">لا توجد بيانات أرباح كافية</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">لم يتم تسجيل إيرادات صيانة أو مبيعات بعد</p>
                    </div>
                  ) : (
                    <PieChart>
                      <Pie
                        data={profitData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {profitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#10b981'} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [`${Number(value).toFixed(2)}`, 'الربح']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Models */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="text-blue-500" />
                أكثر الموديلات صيانة (لتوفير قطع غيارها)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {topModels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <Wrench size={40} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="font-bold text-slate-500 dark:text-slate-400">لا توجد بيانات صيانة</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">لم يتم استلام أجهزة هذا الشهر</p>
                    </div>
                  ) : (
                    <BarChart data={topModels} layout="vertical" margin={{ left: 0, right: 20, top: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="count" name="عدد الأجهزة" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'leaderboard' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Top 3 Technicians */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {techLeaderboard.slice(0, 3).map((tech, idx) => (
              <div key={tech.name} className={`relative bg-white dark:bg-slate-800 rounded-2xl p-6 border shadow-sm flex flex-col items-center text-center ${idx === 0 ? 'border-amber-400 dark:border-amber-500/50 scale-105 z-10 shadow-amber-500/10' : 'border-slate-100 dark:border-white/5'}`}>
                {idx === 0 && <div className="absolute -top-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1"><Trophy size={14} /> وحش الصيانة</div>}
                {idx === 1 && <div className="absolute -top-4 bg-gradient-to-r from-slate-300 to-slate-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">المركز الثاني</div>}
                {idx === 2 && <div className="absolute -top-4 bg-gradient-to-r from-amber-700 to-amber-900 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">المركز الثالث</div>}
                
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 mt-2 ${idx === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                  <Wrench size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{tech.name}</h3>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3">
                    <div className="text-xs text-emerald-600 font-bold mb-1">أجهزة منجزة</div>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{tech.completed}</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3">
                    <div className="text-xs text-red-600 font-bold mb-1">مرتجعات (عيوب)</div>
                    <div className="text-2xl font-black text-red-700 dark:text-red-400">{tech.returned}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Leaderboard Table & Commissions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="text-amber-500" />
                أداء الفنيين
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-500">الترتيب</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-500">الفني</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-500">الأجهزة المنجزة</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-500">المرتجعات</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-500">معدل النجاح</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {techLeaderboard.map((tech, idx) => {
                    const total = tech.completed + tech.returned;
                    const successRate = total > 0 ? Math.round((tech.completed / total) * 100) : 0;
                    const commission = tech.totalProfit * 0.10;

                    return (
                      <tr key={tech.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0 ? 'bg-amber-100 text-amber-700' : 
                            idx === 1 ? 'bg-slate-200 text-slate-700' :
                            idx === 2 ? 'bg-amber-900/20 text-amber-900 dark:text-amber-600' :
                            'bg-slate-100 text-slate-500 dark:bg-slate-700'
                          }`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {tech.name}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
                            {tech.completed}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${
                            tech.returned > 0 
                              ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {tech.returned}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  successRate >= 90 ? 'bg-emerald-500' : 
                                  successRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${successRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{successRate}%</span>
                          </div>
                        </td>
                        
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
