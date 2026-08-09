import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, Minus, Loader2, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface Props { isOpen: boolean; onClose: () => void; }

export default function PeriodComparisonModal({ isOpen, onClose }: Props) {
  const [period1, setPeriod1] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [period2, setPeriod2] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    p1: { income: 0, expense: 0, net: 0, name: '' },
    p2: { income: 0, expense: 0, net: 0, name: '' }
  });

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, period1, period2]);

  const fetchPeriodStats = async (periodStr: string) => {
    const token = localStorage.getItem('access_token') || '';
    const userId = localStorage.getItem('user_id') || '';
    
    const [year, month] = periodStr.split('-');
    const startDate = `${year}-${month}-01T00:00:00Z`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay}T23:59:59Z`;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?created_at=gte.${startDate}&created_at=lte.${endDate}`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
    });
    
    let income = 0, expense = 0;
    if (res.ok) {
        const data = await res.json();
        data.forEach((tx: any) => {
            if (tx.type === 'in' || tx.type === 'income') income += tx.amount;
            else expense += tx.amount;
        });
    }
    
    const d = new Date(Number(year), Number(month) - 1);
    const monthName = d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    
    return { income, expense, net: income - expense, name: monthName };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [s1, s2] = await Promise.all([fetchPeriodStats(period1), fetchPeriodStats(period2)]);
      setStats({ p1: s1, p2: s2 });
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleExportPDF = () => {
    const input = document.getElementById('period-comparison-content');
    if (!input) return;
    toPng(input, { pixelRatio: 2 }).then(dataUrl => {
      const imgData = dataUrl;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (input.offsetHeight * pdfWidth) / input.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`comparison_${period1}_vs_${period2}.pdf`);
    });
  };

  const calcDiff = (v1: number, v2: number) => {
    const diff = v1 - v2;
    const perc = v2 === 0 ? (v1 > 0 ? 100 : 0) : ((diff / v2) * 100);
    return { diff, perc: perc.toFixed(1), isUp: diff >= 0 };
  };

  if (!isOpen) return null;

  const compareRows = [
    { label: 'إجمالي الإيداعات', ...calcDiff(stats.p1.income, stats.p2.income), v1: stats.p1.income, v2: stats.p2.income, inverse: false },
    { label: 'إجمالي المصروفات', ...calcDiff(stats.p1.expense, stats.p2.expense), v1: stats.p1.expense, v2: stats.p2.expense, inverse: true },
    { label: 'صافي التدفق', ...calcDiff(stats.p1.net, stats.p2.net), v1: stats.p1.net, v2: stats.p2.net, inverse: false }
  ];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#f8fafc] dark:bg-[#1a1f26] w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-white/10 my-8">
          <div className="flex justify-between items-center p-5 bg-slate-100 dark:bg-[#11151c] border-b border-slate-200 dark:border-white/5">
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">مقارنة الفترات <button onClick={handleExportPDF} className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-500/20 dark:text-blue-300"><Download className="w-4 h-4" /> تصوير PDF</button></h2>
          </div>

          <div className="p-6 space-y-6" id="period-comparison-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الفترة الأولى (مثال: الشهر الحالي)</label>
                    <input type="month" value={period1} onChange={e => setPeriod1(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-blue-400 dark:border-blue-500 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-bold outline-none ring-2 ring-blue-100 dark:ring-blue-500/20" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الفترة الاخرى (مثال: الشهر السابق)</label>
                    <input type="month" value={period2} onChange={e => setPeriod2(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-bold outline-none" />
                </div>
            </div>

            {isLoading ? (
               <div className="py-20 flex justify-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
               <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                   <table className="w-full text-sm text-start">
                       <thead className="bg-[#f0f4f8] dark:bg-[#1a1f26] text-slate-600 dark:text-slate-400">
                           <tr>
                           <th className="p-4 font-bold text-start">البيان</th>
                           <th className="p-4 font-bold text-start">الفترة الأولى ({stats.p1.name})</th>
                           <th className="p-4 font-bold text-start">الفترة الاخرى ({stats.p2.name})</th>
                           <th className="p-4 font-bold text-center">الفرق</th>
                           <th className="p-4 font-bold text-center">نسبة التغير</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                           {compareRows.map((row, idx) => (
                               <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                               <td className="p-4 font-bold text-slate-800 dark:text-white">{row.label}</td>
                               <td className="p-4 font-medium text-slate-600 dark:text-slate-400" dir="ltr">{row.v1.toLocaleString()}</td>
                               <td className="p-4 font-medium text-slate-600 dark:text-slate-400" dir="ltr">{row.v2.toLocaleString()}</td>
                               <td className="p-4 font-black text-center text-slate-800 dark:text-white" dir="ltr">{row.diff > 0 ? '+' : ''}{row.diff.toLocaleString()}</td>
                               <td className="p-4 text-center">
                                   <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${(row.isUp && !row.inverse) || (!row.isUp && row.inverse) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`} dir="ltr">
                                   {row.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                   {row.perc}%
                                   </span>
                               </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
