import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';

import { 
  CalendarDays, Download, Printer, ChevronRight, ChevronLeft,
  ArrowRight, Search, FileBarChart, DollarSign, TrendingUp,
  ShoppingCart, Wrench, Receipt, ArrowDownCircle, ArrowUpCircle,
  Loader2, Smartphone, Headphones, RotateCcw, RefreshCcw
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../contexts/SettingsContext';
import PrintDailyReportTemplate from './PrintDailyReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

// Interfaces for structured data
interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  wallet_id: string;
  created_at: string;
}

interface Sale {
  id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  selling_price: number;
  cost_price: number;
  profit: number;
  customer_name?: string;
  created_at: string;
}

interface Purchase {
  id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  purchase_price: number;
  supplier_name?: string;
  created_at: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  wallet_id?: string;
  created_at: string;
}

interface Maintenance {
  id: string;
  device_name: string;
  problem: string;
  cost: number;
  paid_amount: number;
  status: string;
  customer_name?: string;
  technician_name?: string;
  created_at: string;
  parts_cost?: number;
  profit?: number;
}

export default function DailyReport({ onBack }: { onBack: () => void }) {
  const { settings } = useSettings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Data States
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);

  // Fetch data for the selected date
  const fetchData = async () => {
    setIsLoading(true);
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    };

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const timeFilter = `created_at=gte.${startOfDay.toISOString()}&created_at=lt.${endOfDay.toISOString()}`;

    try {
      // 1. Fetch Sales and All Products (for cost fallback)
      const salesQuery = `${SUPABASE_URL}/rest/v1/Sales_Invoices?select=*,Sales_Items(*)&${timeFilter}&order=created_at.desc&limit=10000${branchSuffix}`;
      const returnsQuery = `${SUPABASE_URL}/rest/v1/Sales_Returns?select=*&${timeFilter}&order=created_at.desc&limit=10000${branchSuffix}`;

      const [salesRes, returnsRes] = await Promise.all([
        fetch(salesQuery, { headers }),
        fetch(returnsQuery, { headers })
      ]);
      
      let invoices: any[] = [];
      if (salesRes.ok) invoices = await salesRes.json();
      
      let dayReturns: any[] = [];
      if (returnsRes.ok) dayReturns = await returnsRes.json();

      const missingDeviceIds = new Set<string>();
      const missingAccIds = new Set<string>();
      const missingSpIds = new Set<string>();

      invoices.forEach((inv: any) => {
         if (inv.Sales_Items && Array.isArray(inv.Sales_Items)) {
            inv.Sales_Items.forEach((item: any) => {
               if (Number(item.cost_price || 0) === 0 && item.product_id) {
                  const pType = item.product_type || item.item_type || 'device';
                  if (pType === 'device') missingDeviceIds.add(item.product_id);
                  else if (pType === 'accessory') missingAccIds.add(item.product_id);
                  else if (pType === 'spare_part') missingSpIds.add(item.product_id);
               }
            });
         }
      });

      dayReturns.forEach((ret: any) => {
         const pType = ret.product_type || 'device';
         if (ret.product_id) {
             if (pType === 'device') missingDeviceIds.add(ret.product_id);
             else if (pType === 'accessory') missingAccIds.add(ret.product_id);
             else if (pType === 'spare_part') missingSpIds.add(ret.product_id);
         }
      });
      
      const cMap = {
        device: new Map<string, number>(),
        accessory: new Map<string, number>(),
        spare_part: new Map<string, number>(),
      };

      const promises = [];
      if (missingDeviceIds.size > 0) {
          promises.push(fetch(`${SUPABASE_URL}/rest/v1/Devices?select=id,cost_price&id=in.(${Array.from(missingDeviceIds).join(',')})`, { headers }).then(r => r.json()).then(d => {
             d.forEach((x: any) => cMap.device.set(String(x.id), x.cost_price || 0));
          }).catch(() => {}));
      }
      if (missingAccIds.size > 0) {
          promises.push(fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=id,cost_price&id=in.(${Array.from(missingAccIds).join(',')})`, { headers }).then(r => r.json()).then(d => {
             d.forEach((x: any) => cMap.accessory.set(String(x.id), x.cost_price || 0));
          }).catch(() => {}));
      }
      if (missingSpIds.size > 0) {
          promises.push(fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=id,cost_price&id=in.(${Array.from(missingSpIds).join(',')})`, { headers }).then(r => r.json()).then(d => {
             d.forEach((x: any) => cMap.spare_part.set(String(x.id), x.cost_price || 0));
          }).catch(() => {}));
      }
      
      await Promise.all(promises);
      
      // 2. Fetch Purchases
      const dpQuery = `${SUPABASE_URL}/rest/v1/Devices?select=id,company,model,cost_price,tax,created_at&entry_type=in.(purchase,manual)&${timeFilter}&order=created_at.desc&limit=10000${branchSuffix}`;
      const apQuery = `${SUPABASE_URL}/rest/v1/Accessories?select=id,name,quantity,cost_price,tax,created_at&entry_type=in.(purchase,manual)&${timeFilter}&order=created_at.desc&limit=10000${branchSuffix}`;
      const spQuery = `${SUPABASE_URL}/rest/v1/spare_parts?select=id,name,quantity,cost_price,tax,created_at&entry_type=in.(purchase,manual)&${timeFilter}&order=created_at.desc&limit=10000${branchSuffix}`;

      const dpRes = await fetch(dpQuery, { headers });
      const apRes = await fetch(apQuery, { headers });
      const spRes = await fetch(spQuery, { headers });
      
      // 3. Fetch Maintenance (created today)
      const maintRes = await fetch(`${SUPABASE_URL}/rest/v1/Repairs?select=id,device_name,issue,total_amount,paid_amount,status,created_at,customer_name,notes&${timeFilter}&order=created_at.desc&limit=10000${branchSuffix.replace('branch_id', 'receiving_branch_id')}`, { headers });
      
      // 4. Fetch Transactions
      const transRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=id,type,category,amount,description,created_at&${timeFilter}&order=created_at.desc&limit=10000${branchSuffix}`, { headers });

      if (!salesRes.ok) {
         console.error("Sales fetch err:");
      }

      // Process Sales from Invoices
      let combinedSales: Sale[] = [];
        invoices.forEach((inv: any) => {
          if (inv.Sales_Items && Array.isArray(inv.Sales_Items)) {
            inv.Sales_Items.forEach((item: any) => {
              const qty = Number(item.quantity || 1);
              const price = Number(item.total_price || ((item.unit_price || 0) * qty) || 0);
              const pType = item.product_type || item.item_type || 'device';
              const pId = String(item.product_id || item.item_id);
              let cost = Number(item.cost_price || 0);
              if (cost === 0) {
                 const unitCost = cMap[pType as keyof typeof cMap]?.get(pId) || 0;
                 cost = unitCost * qty;
              }
              const profit = price - cost;

              const productName = item.product_name || 'غير محدد';
              if (productName.includes('(مرتجع)')) {
                return; // Skip returned items completely from daily sales list
              }

              if (pType === 'maintenance') {
                return; // Skip maintenance items, they show up in Maintenance income
              }

              combinedSales.push({
                id: item.id || Math.random().toString(),
                item_type: pType,
                item_name: item.product_name || 'غير محدد',
                quantity: qty,
                selling_price: price,
                cost_price: cost,
                profit: profit,
                customer_name: inv.customer_name || 'عميل نقدي',
                created_at: inv.created_at
              });
            });
          }
        });
      
      // Process Purchases
      let combinedPurchases: Purchase[] = [];
      if (dpRes.ok) {
        const dp = await dpRes.json();
        combinedPurchases = [...combinedPurchases, ...dp.map((d: any) => ({
          id: d.id,
          item_type: 'device' as const,
          item_name: `${d.company || ''} ${d.model || ''}`.trim() || 'جهاز',
          quantity: 1,
          purchase_price: ((d.cost_price || 0) + (d.tax || 0)),
          created_at: d.created_at
        }))];
      }
      if (apRes.ok) {
        const ap = await apRes.json();
        combinedPurchases = [...combinedPurchases, ...ap.map((a: any) => ({
          id: a.id,
          item_type: 'accessory' as const,
          item_name: a.name || 'إكسسوار',
          quantity: a.quantity || 1,
          purchase_price: ((a.cost_price || 0) + (a.tax || 0)) * (a.quantity || 1),
          created_at: a.created_at
        }))];
      }
      if (spRes.ok) {
        const sp = await spRes.json();
        combinedPurchases = [...combinedPurchases, ...sp.map((s: any) => ({
          id: s.id,
          item_type: 'spare_part' as const,
          item_name: s.name || 'قطعة غيار',
          quantity: s.quantity || 1,
          purchase_price: ((s.cost_price || 0) + (s.tax || 0)) * (s.quantity || 1),
          created_at: s.created_at
        }))];
      }

      setSales(combinedSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setPurchases(combinedPurchases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      
      if (maintRes.ok) {
        const repairs = await maintRes.json();

        setMaintenance(repairs.map((r: any) => {
           let partsCost = 0;
           if (r.notes) {
               const regex = /===PARTS===\n([\s\S]*?)(?:\n===|$)/;
               const match = r.notes.match(regex);
               if (match && match[1]) {
                   try {
                       const parts = JSON.parse(match[1]);
                       if (Array.isArray(parts)) {
                           partsCost = parts.reduce((sum, p) => sum + ((Number(p.cost) || 0) * (Number(p.quantity) || 1)), 0);
                       }
                   } catch(e) {}
               }
           }
           const totalCost = Number(r.total_amount) || 0;
           return {
               id: r.id,
               device_name: r.device_name,
               problem: r.issue,
               cost: totalCost,
               paid_amount: Number(r.paid_amount) || 0,
               status: r.status || 'أخرى',
               customer_name: r.customer_name,
               created_at: r.created_at,
               parts_cost: partsCost,
               profit: totalCost - partsCost
           };
        }));
      }
      
      let dayReturnsProcessed: any[] = [];
      if (dayReturns.length > 0) {
        dayReturnsProcessed = dayReturns.map((ret: any) => {
          const refundAmt = Number(ret.refund_amount || ret.total_amount || 0);
          let itemCost = 0;
          
          const matchedInv = invoices.find((inv: any) => inv.invoice_number === ret.invoice_number);
          if (matchedInv && matchedInv.Sales_Items) {
            const matchedItem = matchedInv.Sales_Items.find((si: any) => {
               const siId = String(si.product_id || si.item_id || '');
               const retId = String(ret.product_id || ret.item_id || '');
               return siId && retId && siId === retId;
            });
            if (matchedItem) {
               const pQty = Number(matchedItem.quantity || 1);
               const retQty = Number(ret.quantity || ret.qty || pQty);
               
               let totalOriginalCost = Number(matchedItem.cost_price || 0);
               let unitCost = 0;
               
               if (totalOriginalCost > 0) {
                   unitCost = totalOriginalCost / pQty;
               } else {
                 const pType = matchedItem.product_type || matchedItem.item_type || 'device';
                 unitCost = cMap[pType as keyof typeof cMap]?.get(String(ret.product_id || ret.item_id)) || 0;
               }
               
               itemCost = (unitCost * retQty) || 0;
            }
          }
          itemCost = Math.min(itemCost, refundAmt);
          
          return {
             ...ret,
             calculated_profit: refundAmt - itemCost
          };
        });
      }
      setSalesReturns(dayReturnsProcessed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      
      if (transRes.ok) {
        const tx = await transRes.json();
        setTransactions(tx);
        
        const isOpExp = (category: string) => {
          if (!category) return true;
          const catStr = category.toLowerCase();
          const excludedKeywords = [
             'مشتريات', 'شراء', 'مخزون', 'مورد', 'دفعة',
             'تحويل', 'محافظ', 'رصيد', 'داخلية', 'رأس مال', 'راس مال', 'سحب', 'مالك',
             'سلف', 'سداد', 'مرتجع', 'استرجاع', 'refund', 'return', 'reversal', 'reverse'
          ];
          return !excludedKeywords.some(kw => catStr.includes(kw));
        };
        
        const expList = tx.filter((t: any) => 
            (t.type === 'out' || t.type === 'expense') && isOpExp(t.category)
          )
          .map((t: any) => ({
            id: t.id,
            description: t.description || t.category,
            amount: t.amount,
            created_at: t.created_at
          }));
        setExpenses(expList);
      } else {
        setTransactions([]);
        setExpenses([]);
      }

    } catch (err) {
      console.error('Error fetching daily report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));

  const exportTemplateRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: exportTemplateRef,
    documentTitle: `Daily_Report_${format(selectedDate, 'yyyy-MM-dd')}`,
    pageStyle: `@page { size: A4 landscape; margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; margin: 0; } }`,
  });

  const handleExportPDF = () => {
    if (window.self !== window.top) {
      alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في نافذة مستقلة (Open in new tab).');
      return;
    }
    handlePrint();
  };

  // Derived Calculations
  const totalSalesParams = sales.reduce((sum, item) => sum + (Number(item.selling_price) || 0), 0);
  const totalReturnsParams = salesReturns.reduce((sum, item) => sum + (Number(item.refund_amount) || Number(item.total_amount) || 0), 0);
  const netSalesParams = totalSalesParams - totalReturnsParams;
  const maintenanceRevenue = transactions.filter(t => t.category === 'إيراد صيانة' || t.category === 'إيراد صيانة - درج').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const maintenanceReturns = transactions.filter(t => t.category === 'مرتجع صيانة' || t.category === 'مرتجع صيانة - درج').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const inspectionFees = transactions.filter(t => (t.category === 'إيراد صيانة' || t.category === 'إيراد صيانة - درج') && (t.description?.includes('رسوم فحص') || t.description?.includes('كشف'))).reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const maintenancePartsCost = maintenance.reduce((sum, item) => sum + (item.parts_cost || 0), 0);
  const totalMaintenanceProfit = maintenanceRevenue - maintenanceReturns - maintenancePartsCost;

  const totalProfit = sales.reduce((sum, item) => sum + (Number(item.profit) || 0), 0) - salesReturns.reduce((sum, item) => sum + (Number(item.calculated_profit) || 0), 0) + totalMaintenanceProfit;
  const profitMargin = netSalesParams > 0 ? (totalProfit / netSalesParams) * 100 : 0;
  const totalPurchasesParams = purchases.reduce((sum, item) => sum + (Number(item.purchase_price) || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  
  const cashIn = transactions.filter(t => t.type === 'in' || t.type === 'income').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const totalInstallmentsCollected = transactions.filter(t => t.category === 'installment_collection').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const cashOut = transactions.filter(t => t.type === 'out' || t.type === 'expense').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
  const netCashflow = cashIn - cashOut;

  // Filtered lists based on search term
  const term = searchTerm.toLowerCase();
  const filteredSales = sales.filter(s => s.item_name?.toLowerCase().includes(term) || s.customer_name?.toLowerCase().includes(term));
  const filteredSalesReturns = salesReturns.filter(r => r.product_name?.toLowerCase().includes(term) || r.customer_name?.toLowerCase().includes(term) || r.invoice_number?.toLowerCase().includes(term));
  const filteredPurchases = purchases.filter(p => p.item_name?.toLowerCase().includes(term));
  const filteredMaintenance = maintenance.filter(m => m.device_name?.toLowerCase().includes(term) || m.customer_name?.toLowerCase().includes(term));
  const filteredTransactions = transactions.filter(t => t.description?.toLowerCase().includes(term) || t.category?.toLowerCase().includes(term));

  const renderTypeTag = (type: string) => {
    switch (type) {
      case 'device': return <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-500/20">جهاز</span>;
      case 'accessory': return <span className="bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-500/20">إكسسوار</span>;
      case 'spare_part': return <span className="bg-slate-500/10 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-500/20">قطعة غيار</span>;
      default: return null;
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-slate-100 dark:bg-[#080c13]" dir="rtl">
      {/* Screen UI Wrapper */}
      <div className="p-6 screen-only">
        {/* Top Header Row - Hidden when printing */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white dark:bg-[#11151c] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl">
        
        {/* Left Side: Back button and Title */}
        <div className="flex items-center gap-4">
           <button 
             onClick={onBack}
             className="px-4 py-2 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors text-sm font-bold border border-slate-200 dark:border-white/5"
           >
             <ArrowRight className="w-4 h-4" /> العودة للتقارير
           </button>
        </div>

        {/* Center/Right: Date Pager and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group ml-2">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="بحث في العمليات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-64 ps-9 pe-3 py-2.5 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handlePrevDay} className="p-2.5 bg-slate-50 dark:bg-[#161b22] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDays className="w-5 h-5 text-slate-500 dark:text-slate-400" />
               </div>
               <input 
                 type="date" 
                 value={format(selectedDate, 'yyyy-MM-dd')}
                 onChange={(e) => setSelectedDate(e.target.value ? parseISO(e.target.value) : new Date())}
                 className="block w-40 pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer text-center"
               />
            </div>
            <button onClick={handleNextDay} className="p-2.5 bg-slate-50 dark:bg-[#161b22] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <button onClick={() => {
            if (window.self !== window.top) {
              alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في نافذة مستقلة (Open in new tab).');
              return;
            }
            handlePrint();
          }} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-2 transition-colors border border-slate-200 dark:border-white/5">
            <Printer className="w-4 h-4" /> طباعة
          </button>
          
          <button 
            onClick={handleExportPDF} 
            disabled={isExporting}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(5,150,105,0.2)]"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
            تصدير PDF
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 h-[60vh]">
           <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
           <p className="text-slate-500 dark:text-slate-400 font-medium">جاري تحميل تقارير اليوم...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Print specific template (Hidden from screen) */}
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
        <PrintDailyReportTemplate 
          ref={exportTemplateRef} 
          data={{ 
             sales, 
             purchases, 
             maintenance, 
             expenses, 
             transactions, 
             selectedDate, 
             companyName: settings?.companyName || '', 
             salesReturns,
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
             totalSalesParams
          }} 
        />
          </div>

          {/* Screen Layout below */}
          <div className="text-center mb-10 print:hidden mt-4">
             <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
               {format(selectedDate, 'EEEE، dd MMMM yyyy', { locale: ar })}
             </h3>
          </div>

          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
             {/* 1. إجمالي المبيعات */}
             <div className="bg-white dark:bg-[#11151c] print:bg-white print:border-black/20 border-r-4 border-r-gray-400 rounded-2xl p-5 border-y border-l border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group hover:border-gray-400/30 transition-colors">
                 <div className="flex justify-between items-start">
                     <div>
                        <p className="text-slate-500 dark:text-slate-400 print:text-slate-500 text-xs font-bold mb-2">إجمالي المبيعات (قبل الخصم)</p>
                        <h4 className="text-2xl font-extrabold text-slate-900 dark:text-gray-100 print:text-black font-mono tracking-tight">{totalSalesParams.toLocaleString()} <span className="text-sm font-normal text-slate-500 font-sans font-sans">ج.م</span></h4>
                        <p className="text-xs text-slate-500 mt-2 font-medium">{filteredSales.length} عملية بيع</p>
                     </div>
                     <div className="p-2.5 bg-gray-500/10 text-gray-400 rounded-xl">
                        <DollarSign className="w-5 h-5" />
                     </div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gray-500/5 rounded-full blur-xl group-hover:bg-gray-500/10 transition-colors"></div>
             </div>

             {/* 1b. إجمالي المرتجعات */}
             <div className="bg-[#fffdfd] dark:bg-[#181113] print:bg-white print:border-black/20 border-r-4 border-r-rose-500 rounded-2xl p-5 border-y border-l border-rose-100 dark:border-rose-500/10 shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-colors">
                 <div className="flex justify-between items-start">
                     <div>
                        <p className="text-rose-500 dark:text-rose-450 print:text-rose-600 text-xs font-bold mb-2">إجمالي المرتجعات</p>
                        <h4 className="text-2xl font-extrabold text-rose-500 dark:text-rose-450 print:text-black font-mono tracking-tight">{totalReturnsParams.toLocaleString()} <span className="text-sm font-normal text-slate-500 font-sans">ج.م</span></h4>
                        <p className="text-xs text-rose-500 mt-2 font-medium">{salesReturns.length} عملية مرتجع</p>
                     </div>
                     <div className="p-2.5 bg-rose-500/10 text-rose-450 rounded-xl">
                        <RotateCcw className="w-5 h-5 animate-spin-slow" />
                     </div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors"></div>
             </div>

             {/* 1c. صافي المبيعات */}
             <div className="bg-[#fdffff] dark:bg-[#111c18] print:bg-white print:border-black/20 border-r-4 border-r-emerald-500 rounded-2xl p-5 border-y border-l border-emerald-100/50 dark:border-emerald-500/10 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                 <div className="flex justify-between items-start">
                     <div>
                        <p className="text-emerald-500 dark:text-emerald-450 print:text-emerald-600 text-xs font-bold mb-2">صافي المبيعات (الفعلي)</p>
                        <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 print:text-black font-mono tracking-tight">{netSalesParams.toLocaleString()} <span className="text-sm font-normal text-slate-500 font-sans">ج.م</span></h4>
                        <p className="text-xs text-slate-500 mt-2 font-medium">الصافي بعد الخصم</p>
                     </div>
                     <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                     </div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
             </div>

             {/* 2. صافي الربح */}
             <div className="bg-white dark:bg-[#11151c] print:bg-white print:border-black/20 border-r-4 border-r-sky-500 rounded-2xl p-5 border-y border-l border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group hover:border-sky-500/30 transition-colors">
                 <div className="flex justify-between items-start">
                     <div>
                        <p className="text-slate-500 dark:text-slate-400 print:text-slate-500 text-sm font-bold mb-2">صافي الربح</p>
                        <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white print:text-black font-mono tracking-tight">{totalProfit.toLocaleString()} <span className="text-lg font-normal text-slate-500">ج.م</span></h4>
                        <p className="text-xs text-slate-500 mt-2 font-medium">هامش {profitMargin.toFixed(1)}%</p>
                     </div>
                     <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                     </div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition-colors"></div>
             </div>

             {/* 3. الإجمالي المشتريات */}
             <div className="bg-white dark:bg-[#11151c] print:bg-white print:border-black/20 border-r-4 border-r-rose-500 rounded-2xl p-5 border-y border-l border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-colors">
                 <div className="flex justify-between items-start">
                     <div>
                        <p className="text-slate-500 dark:text-slate-400 print:text-slate-500 text-sm font-bold mb-2">المشتريات</p>
                        <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white print:text-black font-mono tracking-tight">{totalPurchasesParams.toLocaleString()} <span className="text-lg font-normal text-slate-500">ج.م</span></h4>
                        <p className="text-xs text-slate-500 mt-2 font-medium">{filteredPurchases.length} عملية شراء</p>
                     </div>
                     <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
                        <ShoppingCart className="w-5 h-5" />
                     </div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors"></div>
             </div>

             {/* 4. الصيانة */}
             <div className="bg-white dark:bg-[#11151c] print:bg-white print:border-black/20 border-r-4 border-r-purple-500 rounded-2xl p-5 border-y border-l border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                 <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-slate-500 dark:text-slate-400 print:text-slate-500 text-sm font-bold mb-2">إيرادات الصيانة</p>
                        <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white print:text-black font-mono tracking-tight">
                           {maintenanceRevenue.toLocaleString()} <span className="text-lg font-normal text-slate-500">ج.م</span>
                        </h4>
                        <div className="flex gap-4 mt-2">
                            <p className="text-xs text-slate-500 font-medium">{transactions.filter(t => t.category === 'إيراد صيانة' || t.category === 'إيراد صيانة - درج').length} عملية توريد</p>
                        </div>
                     </div>
                     <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
                        <Wrench className="w-5 h-5" />
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">مرتجعات (مرفوض)</p>
                        <p className="text-rose-500 font-bold font-mono">{maintenanceReturns.toLocaleString()} <span className="text-xs font-normal">ج.م</span></p>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">رسوم كشف (مرفوض)</p>
                        <p className="text-blue-500 font-bold font-mono">{inspectionFees.toLocaleString()} <span className="text-xs font-normal">ج.م</span></p>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">صافي ربح الصيانة</p>
                        <p className="text-emerald-500 font-bold font-mono">{totalMaintenanceProfit.toLocaleString()} <span className="text-xs font-normal">ج.م</span></p>
                    </div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-colors"></div>
             </div>

             {/* 5. دفعات ومصروفات */}
             <div className="bg-white dark:bg-[#11151c] print:bg-white print:border-black/20 border-r-4 border-r-amber-500 rounded-2xl p-5 border-y border-l border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                 <div className="flex justify-between items-start">
                     <div>
                        <p className="text-slate-500 dark:text-slate-400 print:text-slate-500 text-sm font-bold mb-2">المصروفات</p>
                        <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white print:text-black font-mono tracking-tight">{totalExpenses.toLocaleString()} <span className="text-lg font-normal text-slate-500">ج.م</span></h4>
                        <p className="text-xs text-slate-500 mt-2 font-medium">{expenses.length} مصروف</p>
                     </div>
                     <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                        <Receipt className="w-5 h-5" />
                     </div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
             </div>

             {/* 6. دفع الأقساط */}
             <div className="bg-white dark:bg-[#11151c] print:bg-white print:border-black/20 border-r-4 border-r-indigo-500 rounded-2xl p-5 border-y border-l border-slate-200 dark:border-white/5 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                 <div className="flex justify-between items-start">
                     <div>
                        <p className="text-slate-500 dark:text-slate-400 print:text-slate-500 text-sm font-bold mb-2">تحصيل الأقساط</p>
                        <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white print:text-black font-mono tracking-tight">{totalInstallmentsCollected.toLocaleString()} <span className="text-lg font-normal text-slate-500">ج.م</span></h4>
                        <p className="text-xs text-slate-500 mt-2 font-medium">مقبوضات أقساط (داخلة)</p>
                     </div>
                     <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                        <DollarSign className="w-5 h-5" />
                     </div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
             </div>
          </div>

          {/* Cashflow Summary Box */}
          <div className="bg-gradient-to-r from-white to-slate-50 dark:from-[#11151c] dark:to-[#161b22] print:bg-none print:border-black/20 rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
             
             <div className="absolute -left-20 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

             <div className="flex items-center gap-5 z-10">
                 <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 print:text-blue-600 flex items-center justify-center rounded-2xl shadow-inner border border-blue-500/20">
                    <DollarSign className="w-7 h-7" />
                 </div>
                 <div>
                    <h3 className="text-slate-800 dark:text-slate-200 print:text-slate-900 font-bold text-xl mb-1">صافي التدفق النقدي</h3>
                    <p className="text-sm text-slate-500 font-medium tracking-wide">إجمالي الداخل والخارج لحركة الخزائن اليوم</p>
                 </div>
             </div>

             <div className="flex items-center gap-6 md:gap-10 bg-slate-100 dark:bg-[#080c13]/50 print:bg-slate-50 px-8 py-4 rounded-2xl border border-slate-200 dark:border-white/5 print:border-slate-200 z-10 shadow-inner">
                <div className="text-center">
                   <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-widest">مقبوضات</p>
                   <p className="text-emerald-400 print:text-emerald-600 font-mono text-xl font-black">{cashIn.toLocaleString()}</p>
                </div>
                <div className="w-px h-10 bg-white/10 print:bg-slate-300"></div>
                <div className="text-center">
                   <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-widest">مدفوعات</p>
                   <p className="text-rose-400 print:text-rose-600 font-mono text-xl font-black">{cashOut.toLocaleString()}</p>
                </div>
                <div className="w-px h-10 bg-white/10 print:bg-slate-300"></div>
                <div className="text-center">
                   <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-widest">الصافي</p>
                   <p className={`font-mono text-2xl font-black ${netCashflow >= 0 ? 'text-emerald-400 print:text-emerald-600' : 'text-rose-400 print:text-rose-600'}`}>
                     {netCashflow > 0 ? '+' : ''}{netCashflow.toLocaleString()}
                   </p>
                </div>
             </div>
          </div>

          {/* Tables Sections */}
          {/* 1. المبيعات */}
          <div className="bg-white dark:bg-[#11151c] print:bg-white rounded-3xl border border-slate-200 dark:border-white/5 print:border-black/20 overflow-hidden shadow-xl">
             <div className="bg-slate-50 dark:bg-slate-900/50 print:bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-white/5 print:border-black/10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><ShoppingCart className="w-5 h-5"/></div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">حركة المبيعات</h3>
                </div>
                <span className="px-4 py-1.5 bg-emerald-500/10 print:bg-emerald-100 text-emerald-400 print:text-emerald-700 text-xs font-bold rounded-xl border border-emerald-500/20">
                   {filteredSales.length} عملية مسجلة
                </span>
             </div>
             {filteredSales.length > 0 ? (
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 dark:bg-[#161b22] print:bg-slate-50 text-slate-500 dark:text-slate-400 print:text-slate-600 font-bold border-b border-slate-200 dark:border-white/5 print:border-black/10 uppercase tracking-wider text-[11px]">
                         <tr>
                            <th className="px-6 py-4">#</th>
                            <th className="px-6 py-4">التصنيف</th>
                            <th className="px-6 py-4">الصنف / الموديل</th>
                            <th className="px-6 py-4 text-center">الكمية</th>
                            <th className="px-6 py-4 text-emerald-400">سعر البيع</th>
                            <th className="px-6 py-4 text-slate-500">التكلفة</th>
                            <th className="px-6 py-4 text-sky-400">الربح</th>
                            <th className="px-6 py-4 text-left">الوقت</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 print:divide-black/10 text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                         {filteredSales.map((sale, i) => (
                            <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] print:hover:bg-white transition-colors">
                               <td className="px-6 py-4 font-mono text-slate-500">{i + 1}</td>
                               <td className="px-6 py-4">{renderTypeTag(sale.item_type)}</td>
                               <td className="px-6 py-4 text-slate-800 dark:text-slate-200 print:text-slate-900 font-bold">{sale.item_name}</td>
                               <td className="px-6 py-4 text-center font-mono font-bold">{sale.quantity}</td>
                               <td className="px-6 py-4 font-mono font-bold text-emerald-400 print:text-emerald-600">{sale.selling_price.toLocaleString()}</td>
                               <td className="px-6 py-4 font-mono text-slate-500 print:text-slate-600">{sale.cost_price.toLocaleString()}</td>
                               <td className="px-6 py-4 font-mono font-bold text-sky-400 print:text-sky-600">{sale.profit.toLocaleString()}</td>
                               <td className="px-6 py-4 text-left text-slate-500 font-mono text-[11px]" dir="ltr">{format(new Date(sale.created_at), 'hh:mm a')}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             ) : (
                <div className="py-12 flex flex-col items-center justify-center">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                     <ShoppingCart className="w-8 h-8 text-slate-600" />
                   </div>
                   <p className="text-slate-500 font-medium">لم يتم تسجيل أي مبيعات في هذا اليوم</p>
                </div>
             )}
          </div>

          {/* 1b. مرتجعات المبيعات */}
          <div className="bg-[#fffdfd] dark:bg-[#131011] print:bg-white rounded-3xl border border-rose-100 dark:border-rose-500/10 print:border-black/20 overflow-hidden shadow-xl">
             <div className="bg-rose-500/[0.02] dark:bg-rose-950/10 print:bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-rose-100 dark:border-rose-500/10 print:border-black/10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl"><RotateCcw className="w-5 h-5"/></div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">حركة مرتجعات المبيعات اليوم</h3>
                </div>
                <span className="px-4 py-1.5 bg-rose-500/10 print:bg-rose-100 text-rose-600 print:text-rose-700 text-xs font-bold rounded-xl border border-rose-500/20">
                   {filteredSalesReturns.length} مرتجع مسجل
                </span>
             </div>
             {filteredSalesReturns.length > 0 ? (
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-right">
                      <thead className="bg-[#fcf8f8] dark:bg-[#1a1215] print:bg-slate-50 text-slate-500 dark:text-slate-400 print:text-slate-600 font-bold border-b border-rose-100 dark:border-rose-500/10 print:border-black/10 uppercase tracking-wider text-[11px]">
                         <tr>
                            <th className="px-6 py-4">#</th>
                            <th className="px-6 py-4">رقم الفاتورة</th>
                            <th className="px-6 py-4">المنتج المعني</th>
                            <th className="px-6 py-4">السبب</th>
                            <th className="px-6 py-4">العميل</th>
                            <th className="px-6 py-4 text-rose-500 font-semibold">المبلغ المسترد</th>
                            <th className="px-6 py-4">الحالة</th>
                            <th className="px-6 py-4 text-left">الوقت</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100/50 dark:divide-rose-500/5 print:divide-black/10 text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium font-sans">
                         {filteredSalesReturns.map((ret, i) => (
                            <tr key={ret.id} className="hover:bg-rose-500/[0.01] dark:hover:bg-rose-500/[0.02] print:hover:bg-white transition-colors">
                               <td className="px-6 py-4 font-mono text-slate-400">{i + 1}</td>
                               <td className="px-6 py-4">
                                  <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-white/5 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                     {ret.invoice_number || '-'}
                                  </span>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">{ret.product_name || '-'}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">{ret.product_type === 'device' ? 'جهاز' : ret.product_type === 'accessory' ? 'إكسسوار' : ret.product_type || 'غير محدد'}</div>
                               </td>
                               <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{ret.reason || 'بدون سبب'}</td>
                               <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{ret.customer_name || 'عميل نقدي'}</td>
                               <td className="px-6 py-4 font-mono font-black text-rose-500">- {(ret.refund_amount || ret.total_amount || 0).toLocaleString()} ج.م</td>
                               <td className="px-6 py-4 text-xs font-bold">
                                  <span className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-500/10">
                                     {ret.status || 'مكتمل'}
                                  </span>
                               </td>
                               <td className="px-6 py-4 text-left text-slate-500 font-mono text-[11px]" dir="ltr">{format(new Date(ret.created_at), 'hh:mm a')}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             ) : (
                <div className="py-12 flex flex-col items-center justify-center">
                   <div className="w-16 h-16 bg-rose-500/[0.03] rounded-full flex items-center justify-center mb-4">
                      <RotateCcw className="w-8 h-8 text-rose-450" />
                   </div>
                   <p className="text-slate-500 font-medium">لم يتم تسجيل أي مرتجعات مبيعات اليوم</p>
                </div>
             )}
          </div>

          {/* 2. المشتريات */}
          <div className="bg-white dark:bg-[#11151c] print:bg-white rounded-3xl border border-slate-200 dark:border-white/5 print:border-black/20 overflow-hidden shadow-xl">
             <div className="bg-slate-50 dark:bg-slate-900/50 print:bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-white/5 print:border-black/10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl"><ShoppingCart className="w-5 h-5"/></div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">حركة المشتريات</h3>
                </div>
                <span className="px-4 py-1.5 bg-rose-500/10 print:bg-rose-100 text-rose-400 print:text-rose-700 text-xs font-bold rounded-xl border border-rose-500/20">
                   {filteredPurchases.length} عملية واردة
                </span>
             </div>
             {filteredPurchases.length > 0 ? (
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 dark:bg-[#161b22] print:bg-slate-50 text-slate-500 dark:text-slate-400 print:text-slate-600 font-bold border-b border-slate-200 dark:border-white/5 print:border-black/10 uppercase tracking-wider text-[11px]">
                         <tr>
                            <th className="px-6 py-4">#</th>
                            <th className="px-6 py-4">التصنيف</th>
                            <th className="px-6 py-4">الصنف المشتراه</th>
                            <th className="px-6 py-4 text-center">الكمية</th>
                            <th className="px-6 py-4 text-rose-400">إجمالي السعر</th>
                            <th className="px-6 py-4 text-left">الوقت</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 print:divide-black/10 text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                         {filteredPurchases.map((purchase, i) => (
                            <tr key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] print:hover:bg-white transition-colors">
                               <td className="px-6 py-4 font-mono text-slate-500">{i + 1}</td>
                               <td className="px-6 py-4">{renderTypeTag(purchase.item_type)}</td>
                               <td className="px-6 py-4 text-slate-800 dark:text-slate-200 print:text-slate-900 font-bold">{purchase.item_name}</td>
                               <td className="px-6 py-4 text-center font-mono font-bold">{purchase.quantity}</td>
                               <td className="px-6 py-4 font-mono font-bold text-rose-400 print:text-rose-600">{purchase.purchase_price.toLocaleString()}</td>
                               <td className="px-6 py-4 text-left text-slate-500 font-mono text-[11px]" dir="ltr">{format(new Date(purchase.created_at), 'hh:mm a')}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             ) : (
                <div className="py-12 flex flex-col items-center justify-center">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                     <Package className="w-8 h-8 text-slate-600" />
                   </div>
                   <p className="text-slate-500 font-medium">لم تُسجل فواتير مشتريات أو إدخالات اليوم</p>
                </div>
             )}
          </div>

          {/* 3. الصيانة */}
          <div className="bg-white dark:bg-[#11151c] print:bg-white rounded-3xl border border-slate-200 dark:border-white/5 print:border-black/20 overflow-hidden shadow-xl">
             <div className="bg-slate-50 dark:bg-slate-900/50 print:bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-white/5 print:border-black/10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl"><Wrench className="w-5 h-5"/></div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">تذاكر الصيانة المستلمة والمعالجة</h3>
                </div>
                <span className="px-4 py-1.5 bg-purple-500/10 print:bg-purple-100 text-purple-400 print:text-purple-700 text-xs font-bold rounded-xl border border-purple-500/20">
                   {filteredMaintenance.length} استلام
                </span>
             </div>
             {filteredMaintenance.length > 0 ? (
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 dark:bg-[#161b22] print:bg-slate-50 text-slate-500 dark:text-slate-400 print:text-slate-600 font-bold border-b border-slate-200 dark:border-white/5 print:border-black/10 uppercase tracking-wider text-[11px]">
                         <tr>
                            <th className="px-6 py-4">رقم</th>
                            <th className="px-6 py-4">العميل والجهاز</th>
                            <th className="px-6 py-4">العطل/المشكلة</th>
                            <th className="px-6 py-4 font-bold text-emerald-400">المدفوع إيراد</th>
                            <th className="px-6 py-4 text-center">الحالة</th>
                            <th className="px-6 py-4 text-left">الوقت</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 print:divide-black/10 text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                         {filteredMaintenance.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] print:hover:bg-white transition-colors">
                               <td className="px-6 py-4 font-mono text-slate-500 text-xs">#{String(m.id).split('-')[0].toUpperCase()}</td>
                               <td className="px-6 py-4">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">{m.device_name}</div>
                                  <div className="text-xs text-slate-500 mt-1">{m.customer_name || 'بدون اسم'}</div>
                               </td>
                               <td className="px-6 py-4 text-slate-500 dark:text-slate-400 print:text-slate-600">{m.problem}</td>
                               <td className="px-6 py-4 font-mono font-bold text-emerald-400 print:text-emerald-600 py-4">+ {m.paid_amount?.toLocaleString() || 0}</td>
                               <td className="px-6 py-4 text-center font-bold text-xs">
                                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#080c13] text-slate-700 dark:text-slate-300 print:bg-slate-100 print:text-slate-800 border border-slate-200 dark:border-white/5 print:border-black/10 shadow-inner">{m.status}</span>
                               </td>
                               <td className="px-6 py-4 text-left text-slate-500 font-mono text-[11px]" dir="ltr">{format(new Date(m.created_at), 'hh:mm a')}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             ) : (
                <div className="py-12 flex flex-col items-center justify-center">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                     <Wrench className="w-8 h-8 text-slate-600" />
                   </div>
                   <p className="text-slate-500 font-medium">قائمة الصيانة اليوم فارغة</p>
                </div>
             )}
          </div>

          {/* 4. حركات الصندوق (Transactions) */}
          <div className="bg-white dark:bg-[#11151c] print:bg-white rounded-3xl border border-blue-500/10 print:border-black/20 overflow-hidden relative shadow-2xl">
             <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-blue-500 via-indigo-500 to-purple-500"></div>
             <div className="bg-slate-50 dark:bg-slate-900/50 print:bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-white/5 print:border-black/10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl"><DollarSign className="w-5 h-5"/></div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">حركة الخزينة والتدفق المالي</h3>
                </div>
                <span className="px-4 py-1.5 bg-blue-500/10 print:bg-blue-100 text-blue-400 print:text-blue-700 text-xs font-bold rounded-xl border border-blue-500/20">
                   {filteredTransactions.length} سجل مالي
                </span>
             </div>
             {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 dark:bg-[#161b22] print:bg-slate-50 text-slate-500 dark:text-slate-400 print:text-slate-600 font-bold border-b border-slate-200 dark:border-white/5 print:border-black/10 uppercase tracking-wider text-[11px]">
                         <tr>
                            <th className="px-6 py-4">#</th>
                            <th className="px-6 py-4">الاتجاه</th>
                            <th className="px-6 py-4 w-1/2">السجل التوضيحي</th>
                            <th className="px-6 py-4">المبلغ</th>
                            <th className="px-6 py-4 text-left">الوقت</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 print:divide-black/10 text-slate-700 dark:text-slate-300 print:text-slate-800 font-medium">
                         {filteredTransactions.map((tx, i) => {
                            const isIncome = tx.type === 'in' || tx.type === 'income';
                            return (
                            <tr key={tx.id} className="hover:bg-blue-500/5 print:hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                               <td className="px-6 py-4 font-mono text-slate-500">{filteredTransactions.length - i}</td>
                               <td className="px-6 py-4 font-black tracking-wide text-xs">
                                 {isIncome ? (
                                   <div className="flex items-center gap-2 text-emerald-400 print:text-emerald-600 bg-emerald-500/10 print:bg-emerald-100 px-3 py-1.5 rounded-lg w-max border border-emerald-500/20">
                                      <ArrowDownCircle className="w-4 h-4"/> إيداع / داخل
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-2 text-rose-400 print:text-rose-600 bg-rose-500/10 print:bg-rose-100 px-3 py-1.5 rounded-lg w-max border border-rose-500/20">
                                      <ArrowUpCircle className="w-4 h-4"/> سحب / خارج
                                   </div>
                                 )}
                               </td>
                               <td className="px-6 py-4 text-slate-700 dark:text-slate-300 print:text-slate-800 leading-relaxed font-bold">{tx.description || tx.category}</td>
                               <td className={`px-6 py-4 font-mono font-black text-lg ${isIncome ? 'text-emerald-400 print:text-emerald-600' : 'text-rose-400 print:text-rose-600'}`}>
                                  {isIncome ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
                               </td>
                               <td className="px-6 py-4 text-left text-slate-500 font-mono text-[11px]" dir="ltr">{format(new Date(tx.created_at), 'hh:mm a')}</td>
                            </tr>
                         )})}
                      </tbody>
                   </table>
                </div>
             ) : (
                <div className="py-12 flex flex-col items-center justify-center">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                     <Receipt className="w-8 h-8 text-slate-600" />
                   </div>
                   <p className="text-slate-500 font-medium">الخزينة فارغة من الحركات اليوم</p>
                </div>
             )}
          </div>
        </motion.div>
      )}
      </div> {/* End of Screen UI Wrapper */}

    </div>
  );
}

// Ensure the icon is imported or define a simple fallback if not available
function DollarsSign(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function Package(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
