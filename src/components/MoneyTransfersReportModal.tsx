import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface Props { isOpen: boolean; onClose: () => void; }
interface Transaction { id: number; amount: number; created_at: string; description: string; wallet_id: number; category: string; type: string; }

export default function MoneyTransfersReportModal({ isOpen, onClose }: Props) {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [transfers, setTransfers] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ count: 0, totalAmount: 0 });

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fromDate, toDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token') || '';
      const userId = localStorage.getItem('user_id') || '';
      
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const response = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?category=eq.تحويل صادرة&created_at=gte.${fromDate}T00:00:00Z&created_at=lte.${toDate}T23:59:59Z&order=created_at.desc${branchSuffix}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransfers(data);
        
        let total = 0;
        data.forEach((tx: any) => total += tx.amount);
        setStats({ count: data.length, totalAmount: total });
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleExportPDF = () => {
    const input = document.getElementById('money-transfers-report-content');
    if (!input) return;
    toPng(input, { pixelRatio: 2 }).then(dataUrl => {
      const imgData = dataUrl;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (input.offsetHeight * pdfWidth) / input.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`money_transfers_${fromDate}_to_${toDate}.pdf`);
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#f8fafc] dark:bg-[#1a1f26] w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-white/10 my-8">
          <div className="flex justify-between items-center p-5 bg-slate-100 dark:bg-[#11151c] border-b border-slate-200 dark:border-white/5">
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">تقرير تحويلات الأموال <button onClick={handleExportPDF} className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-500/20 dark:text-blue-300"><Download className="w-4 h-4" /> تصوير PDF</button></h2>
          </div>

          <div className="p-6 space-y-6" id="money-transfers-report-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">من تاريخ</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-blue-400 dark:border-blue-500 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-bold outline-none ring-2 ring-blue-100 dark:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">إلى تاريخ</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-bold outline-none" />
              </div>
            </div>

            {isLoading ? (
               <div className="py-20 flex justify-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-slate-100 dark:bg-[#11151c] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/50 text-center">
                           <p className="text-2xl font-black text-slate-800 dark:text-white mb-1">{stats.count}</p>
                           <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي التحويلات</p>
                       </div>
                       <div className="bg-blue-50 dark:bg-blue-500/5 p-5 rounded-2xl border border-blue-200 dark:border-blue-500/20 text-center">
                           <p className="text-2xl font-black text-blue-600 mb-1" dir="ltr">{stats.totalAmount.toLocaleString()} ج.م</p>
                           <p className="text-sm font-bold text-slate-500 dark:text-slate-400">مجموع المبالغ المحولة</p>
                       </div>
                       <div className="bg-rose-50 dark:bg-rose-500/5 p-5 rounded-2xl border border-rose-200 dark:border-rose-500/20 text-center">
                           <p className="text-2xl font-black text-rose-600 mb-1">0.00 ج.م</p>
                           <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي رسوم التحويلات</p>
                       </div>
                    </div>

                    <div className="bg-white dark:bg-[#0a0e14] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-6">
                      <div className="bg-slate-50 dark:bg-[#11151c] p-4 text-start font-bold border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white">
                         عمليات التحويل
                      </div>
                      {transfers.length > 0 ? (
                          <div className="overflow-x-auto max-h-64 overflow-y-auto">
                           <table className="w-full text-sm text-start">
                              <thead className="bg-[#f0f4f8] dark:bg-[#1a1f26] text-slate-600 dark:text-slate-400 sticky top-0">
                                 <tr>
                                   <th className="p-3 font-bold">التاريخ</th>
                                   <th className="p-3 font-bold">الوصف</th>
                                   <th className="p-3 font-bold text-end">المبلغ</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                 {transfers.map(tx => (
                                   <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{new Date(tx.created_at).toLocaleDateString('ar-EG')}</td>
                                      <td className="p-3 text-slate-600 dark:text-slate-400">{tx.description || tx.category}</td>
                                      <td className="p-3 font-black text-end text-blue-600" dir="ltr">{tx.amount.toLocaleString()} ج.م</td>
                                   </tr>
                                 ))}
                              </tbody>
                           </table>
                          </div>
                      ) : (
                          <div className="p-8 text-center text-slate-500 font-bold">لا توجد تحويلات في هذه الفترة</div>
                      )}
                    </div>
                </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
