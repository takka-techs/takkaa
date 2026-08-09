import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, Download, Filter, TrendingUp, DollarSign, TrendingDown,
  PieChart as PieChartIcon, Smartphone, Headphones, 
  Wrench, FileText, CalendarDays, AlertCircle, Percent,
  Settings, Activity, CircleDollarSign, Printer
} from 'lucide-react';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function PnLReport({ onBack }: { onBack?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [data, setData] = useState<any>({
    grossProfit: 0,
    operatingExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    externalIncome: 0,
    transferCommissions: 0,
    damagedPartsLosses: 0,
    profitByCategory: {
      devices: { rev: 0, cost: 0, profit: 0 },
      accessories: { rev: 0, cost: 0, profit: 0 },
      spareParts: { rev: 0, cost: 0, profit: 0 },
      maintenance: { rev: 0, cost: 0, profit: 0 },
    },
    dailyProfits: [],
    monthlySummary: [],
    topTransactions: []
  });

  const fetchPnLData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token || SUPABASE_KEY}`
      };

      let dateFilterStr = '';
      if (dateRange !== 'all') {
        let startDate: Date;
        if (dateRange === 'today') {
          startDate = startOfDay(new Date());
        } else {
          const days = parseInt(dateRange) || 30;
          startDate = startOfDay(subDays(new Date(), days));
        }
        dateFilterStr = `&created_at=gte.${startDate.toISOString()}`;
      }

      const [salesRes, repairsRes, txRes, devRes, accRes, spRes, returnsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?select=*,Sales_Items(*)${dateFilterStr}${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Repairs?select=*&limit=10000${dateFilterStr}${branchSuffix.replace('branch_id', 'receiving_branch_id')}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=*${dateFilterStr}${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Devices?select=id,cost_price&limit=10000`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=id,cost_price&limit=10000`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=id,cost_price&limit=10000`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Sales_Returns?select=*${dateFilterStr}${branchSuffix}`, { headers }),
      ]);
      
      const costMap = {
        device: new Map<string, number>(),
        accessory: new Map<string, number>(),
        spare_part: new Map<string, number>(),
      };

      if (devRes && devRes.ok) {
        const devs = await devRes.json();
        devs.forEach((d: any) => costMap.device.set(String(d.id), d.cost_price || 0));
      }
      if (accRes && accRes.ok) {
        const accs = await accRes.json();
        accs.forEach((a: any) => costMap.accessory.set(String(a.id), a.cost_price || 0));
      }
      if (spRes && spRes.ok) {
        const sps = await spRes.json();
        sps.forEach((s: any) => costMap.spare_part.set(String(s.id), s.cost_price || 0));
      }

      let grossP = 0;
      let opExp = 0;
      let extInc = 0;
      let txCommissions = 0;
      let dmgParts = 0;
      
      let catProfits = {
        devices: { rev: 0, cost: 0, profit: 0 },
        accessories: { rev: 0, cost: 0, profit: 0 },
        spareParts: { rev: 0, cost: 0, profit: 0 },
        maintenance: { rev: 0, cost: 0, profit: 0 }
      };

      let dProfits: Record<string, number> = {};
      let topTxs: any[] = [];
      let rMonthly: Record<string, any> = {};

      let invoices: any[] = [];
      if (salesRes.ok) {
        invoices = await salesRes.json();
        invoices.forEach((inv: any) => {
          const dateStr = format(new Date(inv.created_at || new Date()), 'yyyy-MM-dd');
          const monthStr = format(new Date(inv.created_at || new Date()), 'MMMM yyyy', { locale: ar });
          
          if (!dProfits[dateStr]) dProfits[dateStr] = 0;
          if (!rMonthly[monthStr]) rMonthly[monthStr] = { rev: 0, cost: 0, profit: 0, month: monthStr };
          
          inv.Sales_Items?.forEach((item: any) => {
            const name = item.product_name || item.item_name || '';
            if (name.includes('(مرتجع)')) {
              // Skip returned items completely from regular sales metrics
              return;
            }

            const qty = Number(item.quantity || 1);
            const rev = Number(item.total_price || ((item.unit_price || 0) * qty) || 0);
            let cost = Number(item.cost_price || 0);
            
            const pType = item.product_type || item.item_type || 'device';
            const pId = String(item.product_id || item.item_id);
            
            // Fallback for older items that don't have cost_price saved
            if (cost === 0) {
              const unitCost = costMap[pType as keyof typeof costMap]?.get(pId) || 0;
              cost = unitCost * qty;
            }

            // If we still have NO cost (e.g. deleted device or no history), calculate 0 profit
            const profit = cost > 0 ? Math.max(rev - cost, 0) : 0;
            
            grossP += profit;
            dProfits[dateStr] += profit;
            rMonthly[monthStr].rev += rev;
            rMonthly[monthStr].cost += cost;
            rMonthly[monthStr].profit += profit;
            
            let typeDesc = '';
            let catKey: keyof typeof catProfits = 'spareParts';
            
            if (pType === 'device') {
               catKey = 'devices'; typeDesc = 'جهاز';
            } else if (pType === 'accessory') {
               catKey = 'accessories'; typeDesc = 'إكسسوار';
            } else {
               catKey = 'spareParts'; typeDesc = 'قطعة غيار';
            }
            
            catProfits[catKey].rev += rev;
            catProfits[catKey].cost += cost;
            catProfits[catKey].profit += profit;
            
            if (profit !== 0) {
              topTxs.push({
                invoice_number: inv.invoice_number,
                productId: pId,
                product_name: item.product_name || '',
                date: format(new Date(inv.created_at), 'yyyy/MM/dd'),
                type: typeDesc,
                product: item.product_name || 'غير محدد',
                qty: item.quantity || 1,
                price: rev,
                cost: cost,
                profit: profit
              });
            }
          });
        });
      }

      // Deduct Sales Returns to ensure they don't produce profit or revenue in P&L
      if (returnsRes && returnsRes.ok) {
        const salesReturns = await returnsRes.json();
        salesReturns.forEach((ret: any) => {
          const refundAmt = Number(ret.refund_amount) || Number(ret.total_amount) || 0;
          const rType = ret.product_type || '';
          const dateStr = format(new Date(ret.created_at || new Date()), 'yyyy-MM-dd');
          const monthStr = format(new Date(ret.created_at || new Date()), 'MMMM yyyy', { locale: ar });

          if (!dProfits[dateStr]) dProfits[dateStr] = 0;
          if (!rMonthly[monthStr]) rMonthly[monthStr] = { rev: 0, cost: 0, profit: 0, month: monthStr };

          // Try to estimate cost and profit of returned item
          let retCost = 0;
          const matchedInv = invoices.find((inv: any) => inv.invoice_number === ret.invoice_number);
          if (matchedInv && matchedInv.Sales_Items) {
            const matchedItem = matchedInv.Sales_Items.find((si: any) => {
               const siId = String(si.product_id || si.item_id || '');
               const retId = String(ret.product_id || ret.item_id || '');
               return siId && retId && siId === retId;
            });
            if (matchedItem) {
               const siQty = Number(matchedItem.quantity || 1);
               const retQty = Number(ret.quantity || ret.qty || siQty);
               let totalOriginalCost = Number(matchedItem.cost_price || 0);
               let unitCost = 0;
               
               if (totalOriginalCost > 0) {
                   unitCost = totalOriginalCost / siQty;
               } else {
                 const pType = matchedItem.product_type || matchedItem.item_type || 'device';
                 unitCost = costMap[pType as keyof typeof costMap]?.get(String(ret.product_id || ret.item_id)) || 0;
               }
               
               retCost = unitCost * retQty;
            }
          }

          retCost = Math.min(retCost, refundAmt);
          const retProfit = refundAmt - retCost;

          // Deduct from gross profit and daily/monthly summaries
          grossP -= retProfit;
          dProfits[dateStr] -= retProfit;
          
          rMonthly[monthStr].rev -= refundAmt;
          rMonthly[monthStr].cost -= retCost;
          rMonthly[monthStr].profit -= retProfit;

          // Determine category
          let catKey: keyof typeof catProfits = 'spareParts';
          if (rType.includes('device') || rType.includes('جهاز')) {
            catKey = 'devices';
          } else if (rType.includes('accessory') || rType.includes('إكسسوار')) {
            catKey = 'accessories';
          } else if (rType.includes('صيانة') || rType.includes('repair')) {
            catKey = 'maintenance';
          }

          catProfits[catKey].rev -= refundAmt;
          catProfits[catKey].cost -= retCost;
          catProfits[catKey].profit -= retProfit;

          // Remove or adjust matching items in topTransactions
          const retQty = Number(ret.quantity || ret.qty || 1);
          const txIndex = topTxs.findIndex((tx: any) => 
             tx.invoice_number === ret.invoice_number && 
             tx.productId === String(ret.product_id || ret.item_id || '')
          );
          if (txIndex > -1) {
             const tx = topTxs[txIndex];
             tx.qty = Math.max(0, tx.qty - retQty);
             tx.price = Math.max(0, tx.price - refundAmt);
             tx.cost = Math.max(0, tx.cost - retCost);
             tx.profit = Math.max(0, tx.profit - retProfit);
             if (tx.profit <= 0 || tx.qty <= 0) {
                tx.deleted = true;
             }
          }
        });
      }

      if (repairsRes.ok) {
        const repairs = await repairsRes.json();
        repairs.forEach((rep: any) => {
          if (rep.status === 'مرتجع / تم الاسترداد') return;
          const rev = rep.paid_amount || rep.total_amount || 0;
          let cost = 0;
          let hasParsedCost = false;

          if (rep.notes && rep.notes.includes('===PARTS===')) {
              try {
                 const partsStr = rep.notes.split('===PARTS===\n')[1].split('\n===')[0];
                 const repairParts = JSON.parse(partsStr);
                 cost = repairParts.reduce((sum: number, p: any) => sum + (Number(p.cost || p.cost_price || 0) * Number(p.quantity || 1)), 0);
                 hasParsedCost = true;
              } catch(e) {}
          }

          if (!hasParsedCost) {
              cost = Number(rep.spare_parts_cost || rep.cost || 0);
          }
          const profit = rev - cost;
          
          grossP += profit;
          catProfits.maintenance.rev += rev;
          catProfits.maintenance.cost += cost;
          catProfits.maintenance.profit += profit;
          
          const dateStr = format(new Date(rep.created_at || new Date()), 'yyyy-MM-dd');
          const monthStr = format(new Date(rep.created_at || new Date()), 'MMMM yyyy', { locale: ar });
          
          if (!dProfits[dateStr]) dProfits[dateStr] = 0;
          dProfits[dateStr] += profit;
          
          if (!rMonthly[monthStr]) rMonthly[monthStr] = { rev: 0, cost: 0, profit: 0, month: monthStr };
          rMonthly[monthStr].rev += rev;
          rMonthly[monthStr].cost += cost;
          rMonthly[monthStr].profit += profit;
          
          if (profit !== 0) {
            topTxs.push({
              date: format(new Date(rep.created_at), 'yyyy/MM/dd'),
              type: 'صيانة',
              product: `صيانة - ${rep.issue_description || 'عامة'}`,
              qty: 1,
              price: rev,
              cost: cost,
              profit: profit
            });
          }
        });
      }

      if (txRes && txRes.ok) {
         const txs = await txRes.json();
         txs.forEach((tx: any) => {
            const amt = Number(tx.amount || 0);
            const type = tx.type;
            const category = tx.category || '';
            
            const monthStr = format(new Date(tx.created_at || new Date()), 'MMMM yyyy', { locale: ar });
            const dateStr = format(new Date(tx.created_at || new Date()), 'yyyy-MM-dd');

            if (!rMonthly[monthStr]) rMonthly[monthStr] = { rev: 0, cost: 0, profit: 0, month: monthStr };
            if (!dProfits[dateStr]) dProfits[dateStr] = 0;

            if (type === 'out' || type === 'مصروف') {
               const catStr = category.toLowerCase();
               const excludedKeywords = [
                  'مشتريات', 'شراء', 'مخزون', 'مورد', 'دفعة',
                  'تحويل', 'محافظ', 'رصيد', 'داخلية', 'رأس مال', 'راس مال', 'سحب', 'مالك',
                  'سلف', 'سداد', 'مرتجع', 'استرجاع', 'refund', 'return', 'reversal', 'reverse'
               ];
               const isOpExp = !excludedKeywords.some(kw => catStr.includes(kw));

               if (isOpExp) {
                  if (catStr.includes('هالك') || catStr.includes('تالف')) {
                     dmgParts += amt;
                  } else {
                     opExp += amt;
                  }
                  
                  if (rMonthly[monthStr]) {
                     rMonthly[monthStr].cost += amt;
                     rMonthly[monthStr].profit -= amt;
                  }
                  dProfits[dateStr] -= amt;
               }
            } else if (type === 'in' || type === 'income') {
               const catStr = category.toLowerCase();
               const excludedKeywords = [
                  'مبيعات', 'صيانة', 'إيراد قطع', 'مقبوضات', 'عميل', 'عملاء',
                  'تحويل م', 'تحويل ر', 'واردة', 'رأس مال', 'راس مال', 'تمويل',
                  'سلف', 'سداد', 'مرتجع', 'استرجاع', 'refund', 'return'
               ];
               const isExtInc = !excludedKeywords.some(kw => catStr.includes(kw));

               if (isExtInc) {
                  if (catStr.includes('عمولات تحويل')) {
                     txCommissions += amt;
                  } else {
                     extInc += amt;
                  }
                  
                  if (rMonthly[monthStr]) {
                     rMonthly[monthStr].rev += amt;
                     rMonthly[monthStr].profit += amt;
                  }
                  dProfits[dateStr] += amt;
               }
            }
         });
      }

      const netP = grossP + extInc + txCommissions - opExp - dmgParts;
      const totalRev = catProfits.devices.rev + catProfits.accessories.rev + catProfits.spareParts.rev + catProfits.maintenance.rev + extInc + txCommissions;
      const pMargin = totalRev > 0 ? (netP / totalRev) * 100 : 0;

      const trendArray = Object.keys(dProfits)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .slice(-14)
        .map(date => ({
          date: format(parseISO(date), 'd/M'),
          'الربح اليومي': dProfits[date]
        }));

      const topTxsFiltered = topTxs.filter(tx => !tx.deleted);
      const topTxsSorted = [...topTxsFiltered].sort((a, b) => b.profit - a.profit);
      const bestTxs = topTxsSorted.slice(0, 10);
      const worstTxs = topTxsSorted.filter(t => t.profit < 0).slice(-10).reverse();
      
      const combinedTxs = [...bestTxs, ...worstTxs].filter((v, i, a) => a.findIndex(t => t === v) === i);

      setData({
        grossProfit: grossP,
        operatingExpenses: opExp,
        netProfit: netP,
        profitMargin: pMargin,
        externalIncome: extInc,
        transferCommissions: txCommissions,
        damagedPartsLosses: dmgParts,
        profitByCategory: catProfits,
        dailyProfits: trendArray,
        monthlySummary: Object.values(rMonthly),
        topTransactions: combinedTxs
      });

    } catch (err) {
      console.error('Error fetching PnL Data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPnLData();
  }, []); // Initial fetch

  const handleExportExcel = () => {
    const BOM = "\uFEFF";
    const header = "التاريخ,النوع,المنتج,الكمية,سعر البيع,التكلفة,الربح\n";
    const csvContent = data.topTransactions.map((tx: any) => 
      `${tx.date},${tx.type},${tx.product},${tx.qty},${tx.price},${tx.cost},${tx.profit}`
    ).join("\n");
    const blob = new Blob([BOM + header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_الأرباح_والخسائر_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    documentTitle: `PnL_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const PIE_COLORS = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#6366f1', '#14b8a6'];
  const pieData = [
    { name: 'أرباح الأجهزة', value: data.profitByCategory.devices.profit, positive: data.profitByCategory.devices.profit > 0 },
    { name: 'أرباح الإكسسوارات', value: data.profitByCategory.accessories.profit, positive: data.profitByCategory.accessories.profit > 0 },
    { name: 'أرباح قطع الغيار (POS)', value: data.profitByCategory.spareParts.profit, positive: data.profitByCategory.spareParts.profit > 0 },
    { name: 'أرباح الصيانة', value: data.profitByCategory.maintenance.profit, positive: data.profitByCategory.maintenance.profit > 0 },
    { name: 'إيرادات خارجية', value: data.externalIncome, positive: data.externalIncome > 0 },
    { name: 'عمولات تحويل', value: data.transferCommissions, positive: data.transferCommissions > 0 }
  ];
  
  const positivePieData = pieData.filter(d => d.value > 0);
  const negativePieData = pieData.filter(d => d.value < 0);
  
  // Enforce some minimum for rendering if all 0
  const hasPieData = positivePieData.length > 0;
  const finalPieData = hasPieData ? positivePieData : pieData.map(p => ({...p, value: 1}));

  const renderTypeBadge = (type: string) => {
    switch(type) {
      case 'جهاز': return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[10px]">جهاز</span>;
      case 'إكسسوار': return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full text-[10px]">إكسسوار</span>;
      case 'قطعة غيار': return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px]">قطع غيار</span>;
      case 'صيانة': return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">صيانة</span>;
      default: return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded-full text-[10px]">{type}</span>;
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#0b101a] text-slate-900 dark:text-white p-6 rounded-b-3xl" dir="rtl">
      {/* Header / Actions Toolbar */}
      <div className="border-b border-slate-200 dark:border-white/5 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl text-yellow-600 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20">
               <CircleDollarSign className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                تقرير الأرباح والخسائر
              </h2>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#161b22] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 flex-1 sm:flex-none">
               <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">الفترة</span>
               <select 
                  className="bg-transparent text-sm font-bold text-slate-900 dark:text-white border-none sm:border-l border-slate-200 dark:border-white/10 sm:pl-2 sm:ml-2 outline-none"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
               >
                  <option value="today" className="bg-white dark:bg-[#161b22]">اليوم</option>
                  <option value="7" className="bg-white dark:bg-[#161b22]">آخر 7 أيام</option>
                  <option value="30" className="bg-white dark:bg-[#161b22]">آخر شهر</option>
                  <option value="90" className="bg-white dark:bg-[#161b22]">آخر 3 شهور</option>
                  <option value="all" className="bg-white dark:bg-[#161b22]">كل الفترات</option>
               </select>
               <button 
                  onClick={fetchPnLData}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm transition-colors mr-1"
               >
                  تطبيق
               </button>
            </div>
            <button 
               onClick={handleExportPDF}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 border border-slate-200 dark:border-white/10 text-white rounded-xl transition-colors flex-1 sm:flex-none shadow-md shadow-indigo-500/20"
            >
              <Printer className="w-4 h-4" />
              طباعة / PDF
            </button>
            <button 
               onClick={handleExportExcel}
               disabled={isLoading}
               className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl transition-colors font-medium flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4" />
              تصدير Excel
            </button>
         </div>
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقرير الأرباح والخسائر"
        subtitle={`الفترة: ${dateRange === 'all' ? 'الكل' : dateRange === 'today' ? 'اليوم' : `آخر ${dateRange} أيام`}`}
        summary={[
          { label: 'إجمالي الأرباح (قبل النفقات)', value: data.grossProfit.toLocaleString(), isCurrency: true },
          { label: 'مصروفات التشغيل', value: data.operatingExpenses.toLocaleString(), isCurrency: true },
          { label: 'صافي الربح', value: data.netProfit.toLocaleString(), isCurrency: true },
          { label: 'هامش الربح', value: `${data.profitMargin.toFixed(1)}%` }
        ]}
        columns={[
          { header: 'التاريخ', accessor: 'date' },
          { header: 'النوع', accessor: 'type' },
          { header: 'المنتج', accessor: 'product' },
          { header: 'الكمية', accessor: 'qty', isNumeric: true },
          { header: 'سعر البيع', accessor: 'price', isNumeric: true },
          { header: 'التكلفة', accessor: 'cost', isNumeric: true },
          { header: 'الربح', accessor: 'profit', isNumeric: true }
        ]}
        data={data.topTransactions}
      />

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-[#0b101a]/50 p-6 z-50 flex items-center justify-center rounded-3xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-[#161b22] px-6 py-4 rounded-2xl shadow-xl dark:border dark:border-white/10">
             <div className="w-10 h-10 rounded-full border-4 border-emerald-100 dark:border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
             <div className="text-emerald-600 dark:text-emerald-400 font-bold">جاري تحديث التقرير...</div>
          </div>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 mb-6 relative overflow-hidden flex flex-col justify-center shadow-sm dark:shadow-none">
         <div className="flex items-center gap-2 mb-3 relative z-10">
            <span className="text-xl">📌</span>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">كيف يُحسب صافي الربح؟</h3>
         </div>
         <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1.5 relative z-10">
            <p>إجمالي الربح = أرباح الأجهزة + الإكسسوارات + قطع الغيار + الصيانة + إيرادات خارجية + عمولات التحويل</p>
            <p>صافي الربح = إجمالي الربح - المصروفات التشغيلية - خسائر قطع غيار تالفة</p>
            <p>تكلفة البضاعة المباعة والمرتجعات = دورة رأس مال وليست خسارة (محسوبة ضمن ربح كل فئة).</p>
            <p className="border-b border-slate-200 dark:border-white/10 pb-1 inline-block">هذا الصافي هو أساس توزيع حصص الشركاء في صفحة الشركاء.</p>
         </div>
      </div>

      {/* Main KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* 1. Net Profit (rightmost) */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-100 dark:border-transparent border-r-4 border-r-emerald-500 rounded-xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-4 left-4 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-100 dark:border-transparent">▲ 0%</div>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-3 border border-emerald-100 dark:border-transparent">
               <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 truncate">صافي الربح</p>
            <h2 className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-widest">{data.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-lg text-slate-400 dark:text-slate-500">ج.م</span></h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">آخر شهر</p>
        </div>

        {/* 2. Gross Profit */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-100 dark:border-transparent border-r-4 border-r-cyan-500 rounded-xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 dark:text-cyan-400 mb-3 border border-cyan-100 dark:border-transparent">
               <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 truncate">إجمالي الربح</p>
            <h2 className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-widest">{data.grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-lg text-slate-400 dark:text-slate-500">ج.م</span></h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">أرباح المبيعات قبل خصم المصروفات</p>
        </div>

        {/* 3. Operating Expenses */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-100 dark:border-transparent border-r-4 border-r-blue-500 rounded-xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 dark:text-blue-400 mb-3 border border-blue-100 dark:border-transparent">
               <FileText className="w-5 h-5" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 truncate">المصروفات التشغيلية</p>
            <h2 className="text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-widest">{data.operatingExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-lg text-slate-400 dark:text-slate-500">ج.م</span></h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">رواتب + مصروفات تشغيلية</p>
        </div>

        {/* 4. Profit Margin */}
        <div className="bg-white dark:bg-[#161b22] border border-slate-100 dark:border-transparent border-r-4 border-r-purple-500 rounded-xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 dark:text-purple-400 mb-3 border border-purple-100 dark:border-transparent">
               <Percent className="w-5 h-5" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 truncate">هامش الربح</p>
            <h2 className="text-3xl font-bold font-mono text-white tracking-widest">{data.profitMargin.toFixed(1)}%</h2>
            <p className="text-slate-500 text-xs mt-2">نسبة صافي الربح من إجمالي الربح</p>
        </div>
      </div>

      {/* Visual Verdict Banner */}
      <div className="flex flex-col items-center justify-center py-6 mb-6 rounded-2xl bg-slate-50 dark:bg-[#161b22]/50 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${data.netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-red-50 dark:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/30'}`}>
            {data.netProfit >= 0 ? <TrendingUp className="w-8 h-8"/> : <TrendingDown className="w-8 h-8"/>}
         </div>
         <h2 className={`text-2xl font-bold mb-1 ${data.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-red-400'}`}>
           {data.netProfit >= 0 ? 'أنت رابح!' : 'أنت خاسر!'}
         </h2>
         <p className="text-slate-500 dark:text-slate-400 text-sm">صافي الربح: {data.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</p>
      </div>

      {/* Detailed Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
         {/* Right Column: Profit by Category */}
         <div className="bg-white dark:bg-[#161b22] rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-200">
               <PieChartIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
               <h3 className="font-bold">تفاصيل الأرباح حسب الفئة</h3>
               <span className="text-slate-500 dark:text-slate-600 text-xs mr-auto">ربح كل فئة = إيرادات المبيعات - تكلفة البضاعة المباعة</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm py-2 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded px-2 -mx-2">
                 <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-500 dark:text-blue-400"/> ربح الأجهزة</span>
                 <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{data.profitByCategory.devices.profit.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded px-2 -mx-2">
                 <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2"><Headphones className="w-4 h-4 text-purple-500 dark:text-purple-400"/> ربح الإكسسوارات</span>
                 <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{data.profitByCategory.accessories.profit.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded px-2 -mx-2">
                 <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2"><Settings className="w-4 h-4 text-amber-500 dark:text-amber-400"/> ربح قطع الغيار (POS)</span>
                 <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{data.profitByCategory.spareParts.profit.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded px-2 -mx-2">
                 <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2"><Wrench className="w-4 h-4 text-emerald-500 dark:text-emerald-400"/> ربح الصيانة</span>
                 <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{data.profitByCategory.maintenance.profit.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded px-2 -mx-2 opacity-50">
                 <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2"><DollarSign className="w-4 h-4"/> إيرادات خارجية</span>
                 <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{data.externalIncome ? data.externalIncome.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded px-2 -mx-2 opacity-50 border-b border-slate-100 dark:border-white/5 pb-4">
                 <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2"><Activity className="w-4 h-4"/> عمولات التحويل</span>
                 <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{data.transferCommissions ? data.transferCommissions.toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'} ج.م</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                 <strong className="text-slate-900 dark:text-white">إجمالي الربح</strong>
                 <strong className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-lg">{data.grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</strong>
              </div>
            </div>
         </div>

         {/* Left Column: Expenses and Capital info */}
         <div className="bg-white dark:bg-[#161b22] rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200">
                 <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                 <h3 className="font-bold">المصروفات التشغيلية</h3>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">المصروفات الحقيقية التي تُخصم من الربح (رواتب + مصروفات تشغيل)</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-300">مصروفات تشغيلية ورواتب</span>
                    <span className="font-bold font-mono text-rose-600 dark:text-red-400">{(data.operatingExpenses || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-100 dark:border-white/5 opacity-50">
                    <span className="text-slate-600 dark:text-slate-300">خسائر قطع غيار تالفة</span>
                    <span className="font-bold font-mono text-rose-600 dark:text-red-400">{(data.damagedPartsLosses || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center pt-1">
                    <strong className="text-slate-900 dark:text-white text-sm">إجمالي المصروفات والخسائر</strong>
                    <strong className="font-bold font-mono text-rose-600 dark:text-red-400">{((data.operatingExpenses || 0) + (data.damagedPartsLosses || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</strong>
                 </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200">
                 <FileText className="w-5 h-5 text-amber-500" />
                 <h3 className="font-bold">معلومات تفصيلية (دورة رأس المال)</h3>
              </div>
              <div className="space-y-2">
                 <p className="text-slate-500 text-xs mb-3">هذه الأرقام للمعلومة فقط ولا تُخصم من الربح — تكلفة البضاعة محسوبة ضمن ربح كل فئة</p>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-300">مبيعات الأجهزة</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{data.profitByCategory.devices.rev.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center text-sm opacity-80">
                    <span className="text-slate-500 dark:text-slate-400">تكلفة الأجهزة المباعة</span>
                    <span className="font-mono text-slate-500">{data.profitByCategory.devices.cost.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-slate-600 dark:text-slate-300">مبيعات الإكسسوارات</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{data.profitByCategory.accessories.rev.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center text-sm opacity-80">
                    <span className="text-slate-500 dark:text-slate-400">تكلفة الإكسسوارات المباعة</span>
                    <span className="font-mono text-slate-500">{data.profitByCategory.accessories.cost.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-slate-600 dark:text-slate-300">إيرادات الصيانة</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{data.profitByCategory.maintenance.rev.toLocaleString()} ج.م</span>
                 </div>
                 <div className="flex justify-between items-center text-sm opacity-80">
                    <span className="text-slate-500 dark:text-slate-400">تكلفة قطع غيار الصيانة</span>
                    <span className="font-mono text-slate-500">{data.profitByCategory.maintenance.cost.toLocaleString()} ج.م</span>
                 </div>
              </div>
            </div>
         </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
         {/* Donut Chart */}
         <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden h-[300px] shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-2 relative z-10 text-slate-800 dark:text-slate-200">
               <PieChartIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
               <h3 className="font-bold">توزيع مصادر الربح</h3>
            </div>
             <div className="flex-1 relative z-10 pt-2 flex flex-col">
               {isLoading ? (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">جاري التحميل...</div>
               ) : (
                 <>
                   {hasPieData ? (
                     <ResponsiveContainer width="100%" height={negativePieData.length > 0 ? "70%" : "100%"}>
                        <PieChart>
                           <Pie
                             data={finalPieData}
                             cx="50%"
                             cy="50%"
                             innerRadius={50}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="value"
                             stroke="none"
                           >
                             {finalPieData.map((entry: any, index: number) => (
                               <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                             ))}
                           </Pie>
                           <Tooltip 
                             formatter={(value, name, props) => [`${Number(value).toLocaleString()} ج.م`, name]}
                             contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                             itemStyle={{ color: '#fff' }}
                           />
                           <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                     </ResponsiveContainer>
                   ) : (
                     <div className="flex items-center justify-center flex-1 text-slate-500 text-sm">لا توجد أرباح كافية لعرضها بيانياً</div>
                   )}
                   
                   {negativePieData.length > 0 && (
                     <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10">
                       <h4 className="text-[11px] font-bold text-rose-500 mb-2">الفئات ذات الخسائر الصافية:</h4>
                       <div className="flex flex-wrap gap-2 text-xs">
                          {negativePieData.map(d => (
                            <div key={d.name} className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-1 rounded">
                               {d.name}: {Math.abs(d.value).toLocaleString()} ج.م
                            </div>
                          ))}
                       </div>
                     </div>
                   )}
                 </>
               )}
            </div>
         </div>

         {/* Line Chart */}
         <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 relative overflow-hidden h-[300px] shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-2 relative z-10 text-slate-800 dark:text-slate-200">
               <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
               <h3 className="font-bold">اتجاه الأرباح اليومية</h3>
            </div>
            <div className="h-[220px] w-full relative z-10 pt-2">
               {isLoading ? (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">جاري التحميل...</div>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.dailyProfits}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                       <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                       <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                       <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--tw-prose-body, #0f172a)', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                       />
                       <Legend iconType="plainline" />
                       <Line type="monotone" name="الربح اليومي" dataKey="الربح اليومي" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                 </ResponsiveContainer>
               )}
            </div>
         </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 mb-6 overflow-hidden shadow-sm dark:shadow-none">
         <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-white/5 pb-4">
             <FileText className="w-5 h-5 text-yellow-500" />
             <h3 className="font-bold">أفضل وأسوأ المعاملات</h3>
             <span className="text-slate-500 text-xs mr-auto hidden sm:block">أعلى المعاملات ربحاً وأكثرها خسارة</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
               <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-slate-50 dark:bg-black/20">
                  <tr>
                     <th className="py-3 px-4 font-medium rounded-r-lg">#</th>
                     <th className="py-3 px-4 font-medium">التاريخ</th>
                     <th className="py-3 px-4 font-medium text-center">النوع</th>
                     <th className="py-3 px-4 font-medium">المنتج</th>
                     <th className="py-3 px-4 font-medium text-center">الكمية</th>
                     <th className="py-3 px-4 font-medium text-center">سعر البيع</th>
                     <th className="py-3 px-4 font-medium text-center">التكلفة</th>
                     <th className="py-3 px-4 font-medium rounded-l-lg text-left">الربح</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {data.topTransactions.map((tx: any, i: number) => (
                     <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{i+1}</td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 tracking-wide font-mono text-xs">{tx.date}</td>
                        <td className="py-3 px-4 text-center">{renderTypeBadge(tx.type)}</td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[150px] truncate">{tx.product}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-400">{tx.qty}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-700 dark:text-slate-300">{tx.price.toLocaleString()} ج.م</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-400">{tx.cost.toLocaleString()} ج.م</td>
                        <td className={`py-3 px-4 font-mono font-bold text-left ${tx.profit < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                           {tx.profit > 0 ? '+' : ''}{tx.profit.toLocaleString()} ج.م
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {data.topTransactions.length === 0 && !isLoading && (
            <div className="py-8 text-center text-slate-500 text-sm">لا توجد معاملات بعد</div>
         )}
      </div>

      {/* Monthly Summary Table */}
      <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 overflow-hidden shadow-sm dark:shadow-none">
         <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-white/5 pb-4">
             <CalendarDays className="w-5 h-5 text-blue-500 dark:text-blue-400" />
             <h3 className="font-bold">ملخص الأرباح الشهرية</h3>
             <span className="text-slate-500 text-xs mr-auto hidden sm:block">مقارنة الإيرادات والتكاليف وصافي الربح لكل شهر</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
               <thead className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-slate-50 dark:bg-black/20">
                  <tr>
                     <th className="py-3 px-4 font-medium rounded-r-lg">الشهر</th>
                     <th className="py-3 px-4 font-medium text-center">الإيرادات</th>
                     <th className="py-3 px-4 font-medium text-center">التكاليف</th>
                     <th className="py-3 px-4 font-medium text-center">صافي الربح</th>
                     <th className="py-3 px-4 font-medium text-center">هامش الربح</th>
                     <th className="py-3 px-4 font-medium rounded-l-lg text-left">الحالة</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {data.monthlySummary.map((m: any, i: number) => {
                    const margin = m.rev > 0 ? (m.profit / m.rev) * 100 : 0;
                    return (
                     <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{m.month}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-700 dark:text-slate-300">{m.rev.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</td>
                        <td className="py-3 px-4 text-center font-mono text-rose-600 dark:text-rose-400">{m.cost.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{(m.profit >= 0 ? '+' : '')}{m.profit.toLocaleString(undefined, {minimumFractionDigits: 2})} ج.م</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300">{margin.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-left">
                           <span className={`px-2 py-1 rounded inline-flex items-center gap-1 text-xs font-medium ${m.profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-transparent' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-transparent'}`}>
                             <TrendingUp className="w-3 h-3" /> {m.profit >= 0 ? 'رابح' : 'خاسر'}
                           </span>
                        </td>
                     </tr>
                    )
                  })}
               </tbody>
            </table>
         </div>
         {data.monthlySummary.length === 0 && !isLoading && (
            <div className="py-8 text-center text-slate-500 text-sm">لا توجد بيانات شهرية مسجلة</div>
         )}
      </div>

    </div>
  );
}
