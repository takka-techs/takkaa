import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Wallet, Wrench, Package, 
  AlertTriangle, Plus, Smartphone, Clock, ChevronLeft,
  Activity, Bell, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  LayoutDashboard, Users
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, TooltipProps
} from 'recharts';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

const activityTabs = ['المبيعات', 'المصروفات', 'الصيانة'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl z-50">
        <p className="text-sm font-bold text-slate-300 mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 text-sm font-medium">
               <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: entry.color }}></div>
               <span className="text-white">{entry.name}:</span>
               <span className="font-black text-white ml-auto pl-4">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};


export default function DashboardHome({ setActiveView }: { setActiveView: (view: string) => void }) {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayExpenses: 0,
    treasuryBalance: 0,
    maintenanceCount: 0,
    accessoriesCount: 0,
    lowStockCount: 0,
    lateMaintenanceCount: 0,
    lateInstallmentsCount: 0,
    receivedTodayCount: 0,
    readyToDeliverCount: 0,
    customersCount: 0,
    reminders: [] as any[]
  });
  const [chartsData, setChartsData] = useState({
    last7DaysData: [] as any[],
    paymentDistribution: [] as any[],
    topCustomers: [] as any[],
    treasuryFlow: [] as any[],
    recentActivities: [] as any[],
    allActivities: {
      'المبيعات': [] as any[],
      'المشتريات': [] as any[],
      'الصيانة': [] as any[],
      'المصروفات': [] as any[],
    }
  });
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('المبيعات');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
        const headers = {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        };

        const activeBranchId = localStorage.getItem("takka_active_branch_id");
        const tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
        let branchOrTenantQuery = '';
        if (activeBranchId && activeBranchId !== 'ALL') {
             branchOrTenantQuery = `&branch_id=eq.${activeBranchId}`;
        } else if (tenantId) {
             branchOrTenantQuery = `&tenant_id=eq.${tenantId}`;
        }

        // Fetch System Alerts
        fetch(`${SUPABASE_URL}/rest/v1/system_alerts?resolved_at=is.null&order=created_at.desc${branchOrTenantQuery}`, { headers })
          .then(res => {
            if (!res.ok) {
              res.json().then(e => console.error('Supabase error fetching alerts:', e));
              return [];
            }
            return res.json();
          })
          .then(data => {
            console.log('System Alerts Fetched from DB:', data);
            setSystemAlerts(data);
          })
          .catch(e => console.error('Network/Parse error fetching system alerts:', e));

        const todayDate = new Date().toISOString().split('T')[0];

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        // 1. Treasury, Sales, Expenses, and Customers
        const [walletsRes, todayTxsRes, treas30dRes, inv30dRes, recentActRes, custRes, expRes, recentMaintRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/wallets?select=balance${branchOrTenantQuery}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=amount,type,category&created_at=gte.${todayDate}T00:00:00Z${branchOrTenantQuery}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=amount,type,category,created_at&created_at=gte.${thirtyDaysAgo.toISOString()}${branchOrTenantQuery}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?select=id,customer_name,net_amount,payment_method,created_at&created_at=gte.${thirtyDaysAgo.toISOString()}${branchOrTenantQuery}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?select=id,customer_name,net_amount,created_at&order=created_at.desc&limit=15${branchOrTenantQuery}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/clients?select=id${branchOrTenantQuery}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=amount,created_at,description,category&type=eq.out&order=created_at.desc&limit=15${branchOrTenantQuery}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/Repairs?select=id,customer_name,total_amount,created_at,status&order=created_at.desc&limit=15${branchOrTenantQuery.replace('branch_id', 'receiving_branch_id')}`, { headers })
        ]);

        let treasuryBalance = 0;
        if (walletsRes.ok) {
          const wData = await walletsRes.json();
          treasuryBalance = wData.reduce((acc: number, w: any) => acc + Number(w.balance || 0), 0);
        }

        let todaySales = 0;
        let todayExpenses = 0;
        if (todayTxsRes.ok) {
          const tData = await todayTxsRes.json();
          todaySales = tData.filter((t: any) => t.type === 'in' || t.type === 'income').reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
          todayExpenses = tData.filter((t: any) => {
             const isOut = t.type === 'out' || t.type === 'expense';
             const isPartner = t.category?.includes('سحوبات') || t.category?.includes('شريك') || t.category?.includes('شركاء') || t.category?.includes('أرباح');
             return isOut && !isPartner;
          }).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
        }

        let expensesList: any[] = [];
        if (expRes.ok) {
          const expData = await expRes.json();
          expensesList = expData.filter((t: any) => {
             return !(t.category?.includes('سحوبات') || t.category?.includes('شريك') || t.category?.includes('شركاء') || t.category?.includes('أرباح'));
          });
        }

        let customersCount = 0;
        if (custRes.ok) {
          const custData = await custRes.json();
          customersCount = custData.length;
        }

        // 2. Inventory Alerts
        const [accessoriesRes, sparePartsRes, devicesRes, remindersRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=quantity,alert_quantity${branchOrTenantQuery}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=quantity,alert_quantity${branchOrTenantQuery}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/Devices?select=quantity,alert_quantity,minimum_quantity${branchOrTenantQuery}`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/Reminders?select=id,title,due_date,due_time,status,priority&status=neq.مكتمل&order=due_date.asc&limit=5${branchOrTenantQuery}`, { headers })
        ]);

        let accessoriesCount = 0;
        let lowStockCount = 0;

        if (accessoriesRes.ok) {
          const accs = await accessoriesRes.json();
          accessoriesCount += accs.reduce((acc: number, item: any) => acc + Number(item.quantity || 0), 0);
          lowStockCount += accs.filter((a: any) => Number(a.quantity || 0) <= Number(a.alert_quantity || 5)).length;
        }

        if (sparePartsRes.ok) {
          const spares = await sparePartsRes.json();
          lowStockCount += spares.filter((s: any) => Number(s.quantity || 0) <= Number(s.alert_quantity || 5)).length;
        }

        if (devicesRes.ok) {
          const devs = await devicesRes.json();
          accessoriesCount += devs.reduce((acc: number, item: any) => acc + Number(item.quantity || 0), 0);
          lowStockCount += devs.filter((d: any) => Number(d.quantity || 0) <= Number(d.alert_quantity || d.minimum_quantity || 5)).length;
        }

        let remindersList: any[] = [];
        if (remindersRes.ok) {
          remindersList = await remindersRes.json();
        }

        // 3. Maintenance Metrics
        const maintRes = await fetch(`${SUPABASE_URL}/rest/v1/Repairs?select=id,status,expected_delivery,created_at&order=created_at.desc&limit=10000${branchOrTenantQuery.replace('branch_id', 'receiving_branch_id')}`, { headers });
        
        let maintenanceCount = 0;
        let lateMaintenanceCount = 0;
        let receivedTodayCount = 0;
        let readyToDeliverCount = 0;

        if (maintRes.ok) {
          const maintsData = await maintRes.json();
          const activeMaints = maintsData.filter((m: any) => m.status !== 'delivered' && m.status !== 'تم التسليم' && m.status !== 'مرفوض');
          maintenanceCount = activeMaints.length;
          
          readyToDeliverCount = maintsData.filter((m: any) => m.status === 'ready' || m.status === 'جاهز').length;
          receivedTodayCount = maintsData.filter((m: any) => m.created_at && m.created_at.startsWith(todayDate)).length;
          
          const now = new Date();
          now.setHours(0, 0, 0, 0); 
          lateMaintenanceCount = activeMaints.filter((m: any) => {
             if (!m.expected_delivery) return false;
             return new Date(m.expected_delivery) < now;
          }).length;
        }

        // 4. Installments Metrics
        let lateInstallmentsCount = 0;
        try {
          const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
          const _activeBranchId = localStorage.getItem("takka_active_branch_id");
          
          let instQueryUrl = `${SUPABASE_URL}/rest/v1/installment_payments?select=due_amount,due_date,status&status=in.(pending,overdue)&deleted_at=is.null`;
          if (_tenantId) instQueryUrl += `&tenant_id=eq.${_tenantId}`;
          if (_activeBranchId && _activeBranchId !== 'ALL') instQueryUrl += `&branch_id=eq.${_activeBranchId}`;

          const instRes = await fetch(instQueryUrl, { headers });
          if (instRes.ok) {
            const instData = await instRes.json();
            const now = new Date();
            now.setHours(0,0,0,0);
            
            lateInstallmentsCount = instData.filter((ip: any) => {
               if (ip.status === 'overdue') return true;
               const duedate = new Date(ip.due_date);
               duedate.setHours(0,0,0,0);
               return ip.status === 'pending' && duedate < now;
            }).length;
          }
        } catch (e) {
          console.error('Error fetching installment stats:', e);
        }

        // Dynamic Charts Processing
          let charts = {
          last7DaysData: [] as any[],
          paymentDistribution: [] as any[],
          topCustomers: [] as any[],
          treasuryFlow: [] as any[],
          recentActivities: [] as any[],
          allActivities: {
            'المبيعات': [] as any[],
            'المشتريات': [] as any[],
            'الصيانة': [] as any[],
            'المصروفات': [] as any[],
          }
        };

        if (treas30dRes && treas30dRes.ok) {
          const tData = await treas30dRes.json();
          const daysMap7 = new Map();
          const daysMap30 = new Map();
          
          for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            const displayStr = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric' }).format(d);
            daysMap7.set(dateStr, { day: displayStr, sales: 0, dateKey: dateStr });
          }

          for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            const dateStr = d.toISOString().split('T')[0];
            const displayStr = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' }).format(d);
            daysMap30.set(dateStr, { day: displayStr, 'تدفق داخلي': 0, 'تدفق خارجي': 0, dateKey: dateStr });
          }

          tData.forEach((t: any) => {
            const dStr = t.created_at.split('T')[0];
            const isIncome = t.type === 'in' || t.type === 'income';
            
            if (daysMap7.has(dStr) && isIncome) {
              daysMap7.get(dStr).sales += Number(t.amount || 0);
            }
            if (daysMap30.has(dStr)) {
               const obj = daysMap30.get(dStr);
               if (isIncome) obj['تدفق داخلي'] += Number(t.amount || 0);
               else obj['تدفق خارجي'] += Number(t.amount || 0);
            }
          });

          charts.last7DaysData = Array.from(daysMap7.values());
          charts.treasuryFlow = Array.from(daysMap30.values());
        }

        if (inv30dRes && inv30dRes.ok) {
          const invs = await inv30dRes.json();
          const payMap = { cash: 0, card: 0, transfer: 0, deferred: 0 };
          const custMap = new Map();

          invs.forEach((inv: any) => {
            const amount = Number(inv.net_amount || 0);
            const p = inv.payment_method || 'cash';
            if (payMap[p as keyof typeof payMap] !== undefined) {
               payMap[p as keyof typeof payMap] += amount;
            } else {
               payMap.cash += amount;
            }

            const cName = inv.customer_name || 'عميل نقدي';
            if (!custMap.has(cName)) custMap.set(cName, 0);
            custMap.set(cName, custMap.get(cName) + amount);
          });

          const totalPaid = Object.values(payMap).reduce((a, b) => a + b, 0);
          
          if (totalPaid > 0) {
             charts.paymentDistribution = [
               { name: 'نقدي', value: payMap.cash, color: '#10b981' },
               { name: 'كارت', value: payMap.card, color: '#3b82f6' },
               { name: 'تحويل', value: payMap.transfer, color: '#a855f7' },
               { name: 'آجل', value: payMap.deferred, color: '#f59e0b' }
             ].filter(p => p.value > 0);
          } else {
             charts.paymentDistribution = [{ name: 'لا توجد بيانات', value: 1, color: '#e2e8f0' }];
          }

          const sortedCust = Array.from(custMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, val]) => ({ name, value: val }));
          
          charts.topCustomers = sortedCust.length ? sortedCust : [{ name: 'لا توجد مبيعات', value: 0 }];
        }

        if (recentActRes && recentActRes.ok) {
           const acts = await recentActRes.json();
           const formattedSales = acts.map((act: any, idx: number) => {
             const dt = new Date(act.created_at);
             const today = new Date();
             const isToday = dt.toDateString() === today.toDateString();
             const timeStr = isToday ? 'اليوم' : dt.toLocaleDateString('ar-EG');
             
             return {
               id: act.id || idx,
               title: 'فاتورة مبيعات',
               subtitle: `${act.customer_name || 'عميل نقدي'} • ${timeStr}`,
               price: Number(act.net_amount || 0).toLocaleString() + ' ج.م',
               priceColor: 'text-emerald-600 dark:text-emerald-400', 
               icon: Package, 
               iconColor: 'text-indigo-500', 
               bg: 'bg-indigo-50'
             };
           });
           charts.allActivities['المبيعات'] = formattedSales;
           charts.recentActivities = formattedSales; // Default
        }

        if (recentMaintRes && recentMaintRes.ok) {
           const acts = await recentMaintRes.json();
           charts.allActivities['الصيانة'] = acts.map((act: any, idx: number) => {
             const dt = new Date(act.created_at);
             const today = new Date();
             const isToday = dt.toDateString() === today.toDateString();
             const timeStr = isToday ? 'اليوم' : dt.toLocaleDateString('ar-EG');
             
             return {
               id: act.id || idx,
               title: 'عملية صيانة',
               subtitle: `${act.customer_name || 'عميل'} • ${timeStr} • ${act.status === 'ready' || act.status === 'جاهز' ? 'جاهز' : 'قيد العمل'}`,
               price: Number(act.cost || 0).toLocaleString() + ' ج.م',
               priceColor: 'text-amber-600 dark:text-amber-400', 
               icon: Wrench, 
               iconColor: 'text-amber-500', 
               bg: 'bg-amber-50'
             };
           });
        }

        if (expensesList && expensesList.length > 0) {
           charts.allActivities['المصروفات'] = expensesList.map((act: any, idx: number) => {
             const dt = new Date(act.created_at);
             const today = new Date();
             const isToday = dt.toDateString() === today.toDateString();
             const timeStr = isToday ? 'اليوم' : dt.toLocaleDateString('ar-EG');
             
             return {
               id: act.id || idx,
               title: 'مصروف',
               subtitle: `${act.description || 'لا يوجد وصف'} • ${timeStr}`,
               price: Number(act.amount || 0).toLocaleString() + ' ج.م',
               priceColor: 'text-rose-600 dark:text-rose-400', 
               icon: Wallet, 
               iconColor: 'text-rose-500', 
               bg: 'bg-rose-50'
             };
           });
        }
        
        setChartsData(charts);

        setStats({
          todaySales,
          todayExpenses,
          treasuryBalance,
          maintenanceCount,
          accessoriesCount,
          lowStockCount,
          lateMaintenanceCount,
          lateInstallmentsCount,
          receivedTodayCount,
          readyToDeliverCount,
          customersCount,
          reminders: remindersList
        });

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const resolveAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${SUPABASE_URL}/rest/v1/system_alerts?id=eq.${alertId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ resolved_at: new Date().toISOString() })
      });
      if (response.ok) {
        setSystemAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch (e) {
      console.error('Error resolving alert:', e);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10" dir="rtl">
      
      {/* 0. Critical System Alerts (Floating Toast) */}
      <AnimatePresence>
        {systemAlerts.filter(a => a.severity === 'critical').map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg"
          >
            <div className="bg-red-600 text-white rounded-xl shadow-2xl p-4 flex gap-4 items-start mx-4 border border-red-400">
              <div className="bg-red-700/50 p-2 rounded-lg shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">{alert.alert_type}</h4>
                <p className="text-sm text-red-100">{alert.message}</p>
                {alert.details && (
                  <pre className="mt-2 text-xs bg-red-900/40 p-2 rounded text-left" dir="ltr">
                    {JSON.stringify(alert.details, null, 2)}
                  </pre>
                )}
              </div>
              <button 
                onClick={() => resolveAlert(alert.id)}
                className="shrink-0 text-red-200 hover:text-white bg-red-700/50 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
              >
                تجاهل
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 1. Hero Section & Quick Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="xl:col-span-2 relative overflow-hidden bg-slate-900 dark:bg-[#0a0a0a] rounded-[2.5rem] shadow-xl min-h-[280px] flex flex-col justify-center p-8 md:p-12"
        >
           <div className="absolute -top-[50%] -right-[20%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>
           <div className="absolute -bottom-[50%] -left-[20%] w-[600px] h-[600px] bg-teal-500/20 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>

           <div className="relative z-10 flex flex-col h-full justify-center">
              <span className="text-teal-400 font-bold tracking-widest mb-3 text-xs md:text-sm uppercase">نظرة عامة</span>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                مرحباً في <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-400 to-indigo-400">Takka</span>
              </h1>
              <p className="text-slate-400 md:text-lg mb-8 max-w-xl leading-relaxed">
                لوحة التحكم المركزية. تابع نشاط متجرك، من المبيعات المباشرة إلى إدارة الصيانة والمخزون، كل شيء هنا في مكان واحد.
              </p>

              <div className="flex flex-wrap gap-4 mt-auto">
                <button onClick={() => setActiveView('pos')} className="flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-2xl text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-all active:scale-95">
                  <Plus className="w-5 h-5" /> نقطة البيع
                </button>
                <button onClick={() => setActiveView('maintenance')} className="flex items-center gap-3 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-white/20 transition-all border border-white/10 active:scale-95">
                  <Wrench className="w-5 h-5" /> استلام صيانة
                </button>
              </div>
           </div>
        </motion.div>

        {/* Alerts Sidebar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="flex flex-col gap-4">
          <div className="flex-1 bg-white dark:bg-[#11151c] backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> إشعارات عاجلة
                </h3>
              </div>
            </div>
            
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <AlertBox count={stats.lowStockCount} loading={isLoading} title="مخزون منخفض" desc="صنف يحتاج طلب" zeroDesc="المخزون متوفر" onClick={() => setActiveView('low_stock')} type="warning" />
              <AlertBox count={stats.lateMaintenanceCount} loading={isLoading} title="صيانات متأخرة" desc="أجهزة متأخرة" zeroDesc="لا يوجد تأخير" onClick={() => setActiveView('maintenance')} type="danger" />
              <AlertBox count={stats.lateInstallmentsCount} loading={isLoading} title="أقساط متأخرة" desc="أقساط غير مسددة" zeroDesc="لا يوجد تأخير" onClick={() => setActiveView('installments_dashboard')} type="danger" />
              
              {systemAlerts.filter(a => a.severity !== 'critical').map(alert => (
                <div key={alert.id} className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl p-3 flex justify-between items-start gap-2 group cursor-pointer" onClick={() => resolveAlert(alert.id)}>
                  <div>
                    <h4 className="text-sm font-bold text-orange-800 dark:text-orange-400">{alert.alert_type}</h4>
                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">{alert.message}</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded dark:bg-orange-800/30 dark:text-orange-300">
                    تم
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 2. Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard delay={0.2} title="مبيعات اليوم" value={stats.todaySales} currency="ج.م" icon={TrendingUp} blurColor="bg-teal-500/20" iconColor="text-teal-500" loading={isLoading} />
        <StatCard delay={0.3} title="رصيد الخزينة" value={stats.treasuryBalance} currency="ج.م" icon={Wallet} blurColor="bg-blue-500/20" iconColor="text-blue-500" loading={isLoading} />
        <StatCard delay={0.4} title="مصروفات اليوم" value={stats.todayExpenses} currency="ج.م" icon={Activity} blurColor="bg-rose-500/20" iconColor="text-rose-500" loading={isLoading} />
        <StatCard delay={0.5} title="إجمالي العملاء" value={stats.customersCount} currency="عميل" icon={Users} blurColor="bg-indigo-500/20" iconColor="text-indigo-500" loading={isLoading} />
      </div>

      {/* 3. Main Data Areas (Split layout) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         
         {/* LEFT COLUMN: Tables / Lists (4 columns) */}
         <div className="xl:col-span-4 space-y-6 flex flex-col">
            
            {/* Contextual Tabs / Latest Activity List */}
            <div className="bg-white dark:bg-[#11151c] rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 shadow-sm flex-1 flex flex-col">
               <div className="flex flex-wrap gap-2 mb-6">
                 {activityTabs.map((tab) => (
                   <button 
                     key={tab} 
                     onClick={() => setActiveTab(tab)}
                     className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                   >
                     {tab}
                   </button>
                 ))}
               </div>
               
               <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {(chartsData.allActivities[activeTab as keyof typeof chartsData.allActivities] || chartsData.recentActivities) && (chartsData.allActivities[activeTab as keyof typeof chartsData.allActivities] || chartsData.recentActivities).length > 0 ? (chartsData.allActivities[activeTab as keyof typeof chartsData.allActivities] || chartsData.recentActivities).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                       <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} dark:bg-white/10`}>
                           <item.icon className={`w-5 h-5 ${item.iconColor} dark:text-white`} />
                         </div>
                         <div>
                           <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                           <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</div>
                         </div>
                       </div>
                       <div className={`font-black text-sm ${item.priceColor}`}>{item.price}</div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm font-bold opacity-60">
                      لا توجد حركات مؤخراً في قسم {activeTab}
                    </div>
                  )}
               </div>
            </div>

            {/* Notifications / Secondary Alerts */}
            <div className="bg-white dark:bg-[#11151c] rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 shadow-sm min-h-[200px] flex flex-col relative overflow-hidden">
               <div className="font-black text-slate-900 dark:text-white mb-6 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Bell className="w-5 h-5 text-indigo-500" /> التنبيهات
                   {stats.reminders.length > 0 && (
                     <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                       {stats.reminders.length}
                     </span>
                   )}
                 </div>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                 {stats.reminders.length > 0 ? stats.reminders.map((reminder) => {
                   const isHighPriority = reminder.priority === 'عالية_جدا' || reminder.priority === 'عالية';
                   return (
                     <div key={reminder.id} className="flex gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <div className={`w-2 rounded-full flex-shrink-0 ${isHighPriority ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{reminder.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                             <Clock className="w-3 h-3" />
                             {reminder.due_date} {reminder.due_time}
                          </div>
                        </div>
                     </div>
                   );
                 }) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 h-full">
                     <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-3">
                       <Bell className="w-8 h-8" />
                     </div>
                     <p className="font-bold text-slate-600 dark:text-slate-400">لا توجد تنبيهات</p>
                   </div>
                 )}
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN: Charts (8 columns) */}
         <div className="xl:col-span-8 flex flex-col gap-6">
            
            {/* Top Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               
               {/* 7 Days Sales Line Chart */}
               <div className="lg:col-span-2 bg-white dark:bg-[#11151c] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                       <LineChartIcon className="w-5 h-5 text-blue-500" /> مبيعات آخر 7 أيام
                    </h3>
                  </div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartsData.last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="sales" name="المبيعات" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               {/* Payment Distribution Pie Chart */}
               <div className="bg-white dark:bg-[#11151c] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                       <PieChartIcon className="w-5 h-5 text-indigo-500" /> توزيع المدفوعات
                    </h3>
                  </div>
                  <div className="flex-1 relative min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartsData.paymentDistribution}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartsData.paymentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">100%</span>
                      <span className="text-xs font-bold text-slate-500">الإجمالي</span>
                    </div>
                  </div>
                  {/* Legend below */}
                  <div className="flex justify-center gap-4 mt-2 flex-wrap">
                     {chartsData.paymentDistribution.map((item, idx) => (
                       <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                         {item.name}
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Treasury Flow Area Chart */}
            <div className="bg-white dark:bg-[#11151c] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" /> تدفق الخزينة (30 يوم)
                 </h3>
               </div>
               <div className="h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartsData.treasuryFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} minTickGap={30} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                     <RechartsTooltip content={<CustomTooltip />} />
                     <Area type="monotone" dataKey="تدفق داخلي" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" activeDot={{ r: 6 }} />
                     <Area type="monotone" dataKey="تدفق خارجي" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" activeDot={{ r: 6 }} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
               {/* Custom Legend */}
               <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-md border-2 border-emerald-500 bg-emerald-500/20"></div> التدفق الداخلي
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-md border-2 border-rose-500 bg-rose-500/20"></div> التدفق الخارجي
                  </div>
               </div>
            </div>

            {/* Bottom Row inside Charts (Top 5 & Maintenance Overview) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Top 5 Customers */}
              <div className="bg-white dark:bg-[#11151c] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                     <BarChart3 className="w-5 h-5 text-blue-500" /> أعلى 5 عملاء
                  </h3>
                </div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={chartsData.topCustomers} margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dx={-10} width={80} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                      <Bar dataKey="value" name="المبيعات" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={24}>
                        {chartsData.topCustomers.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={'#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Maintenance Metrics Simple Review */}
              <div className="bg-white dark:bg-[#11151c] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                     <Wrench className="w-5 h-5 text-teal-500" /> مؤشرات الصيانة (اليوم)
                  </h3>
                  <button onClick={() => setActiveView('maintenance')} className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                    سجل الصيانة
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="bg-slate-50 dark:bg-white/5 rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center border border-slate-100 dark:border-white/5 transition-transform hover:scale-105">
                     <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 shadow-sm">{isLoading ? '-' : stats.receivedTodayCount}</div>
                     <p className="text-xs font-bold text-slate-500">واردة اليوم</p>
                     <span className="text-[10px] text-teal-500 font-bold bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded-full mt-2">بداية جديدة</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center border border-slate-100 dark:border-white/5 transition-transform hover:scale-105">
                     <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 shadow-sm">{isLoading ? '-' : stats.readyToDeliverCount}</div>
                     <p className="text-xs font-bold text-slate-500">جاهزة للتسليم</p>
                  </div>
                  <div className="col-span-2 bg-rose-50 dark:bg-rose-500/10 rounded-[1.5rem] p-4 flex items-center justify-between border border-rose-100 dark:border-rose-500/20">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-500">
                           <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">صيانات متأخرة</p>
                          <p className="text-xs text-slate-500 font-medium">تحتاج إنهاء أو تواصل مع العميل</p>
                        </div>
                     </div>
                     <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{isLoading ? '-' : stats.lateMaintenanceCount}</div>
                  </div>
                </div>
              </div>

            </div>
         </div>
      </div>

    </div>
  );
}

function StatCard({ title, value, currency, icon: Icon, blurColor, iconColor, loading, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="relative overflow-hidden bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 group shadow-sm hover:shadow-md transition-all"
    >
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${blurColor}`}></div>
      
      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 opacity-80">{title}</p>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {loading ? '-' : (typeof value === 'number' ? value.toLocaleString() : value)}
          </h4>
          <span className="text-xs font-bold text-slate-400">{currency}</span>
        </div>
      </div>
    </motion.div>
  );
}

function AlertBox({ count, loading, title, desc, zeroDesc, onClick, type }: any) {
  const isDanger = type === 'danger';
  const isActive = count > 0;
  
  const bgClass = isActive 
    ? (isDanger ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20')
    : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5';
    
  const textClass = isActive
    ? (isDanger ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400')
    : 'text-slate-700 dark:text-slate-300';
    
  return (
    <div onClick={onClick} className={`border rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all ${bgClass}`}>
      <div>
        <div className={`font-black mb-1 ${textClass}`}>{title}</div>
        <div className={`text-xs font-bold ${isActive ? (isDanger ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-amber-600/80 dark:text-amber-400/80') : 'text-slate-500/80'}`}>
          {loading ? '...' : (isActive ? `${count} ${desc}` : zeroDesc)}
        </div>
      </div>
      <button onClick={onClick} className={`text-xs px-4 py-2 font-bold rounded-xl transition-all active:scale-95 ${isActive ? (isDanger ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:bg-rose-600' : 'bg-amber-500 text-white shadow-xl shadow-amber-500/20 hover:bg-amber-600') : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20'}`}>
        عرض
      </button>
    </div>
  );
}
