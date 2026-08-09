import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, Clock, Loader2, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Transaction {
  id: number;
  type: string;
  category: string;
  amount: number;
  description: string;
  created_at: string;
}

export default function DailyReportModal({ isOpen, onClose }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ income: 0, purchaseWithdraws: 0, otherExpenses: 0, net: 0 });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token') || '';
      const userId = localStorage.getItem('user_id') || '';
      
      const startDate = `${selectedDate}T00:00:00Z`;
      const endDate = `${selectedDate}T23:59:59Z`;

      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const response = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?created_at=gte.${startDate}&created_at=lte.${endDate}&order=created_at.desc${branchSuffix}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
        
        let income = 0;
        let purchaseWithdraws = 0;
        let otherExpenses = 0;

        data.forEach((tx: Transaction) => {
          if (tx.type === 'in' || tx.type === 'income') {
            income += tx.amount;
          } else if (tx.type === 'out' || tx.type === 'expense') {
            if (!tx.category) {
              otherExpenses += tx.amount;
            } else {
              const catStr = tx.category.toLowerCase();
              const excludedKeywords = [
                 'مشتريات', 'شراء', 'مخزون', 'مورد', 'دفعة',
                 'تحويل', 'محافظ', 'رصيد', 'داخلية', 'رأس مال', 'راس مال', 'سحب', 'مالك',
                 'سلف', 'سداد', 'مرتجع', 'استرجاع', 'refund', 'return', 'reversal', 'reverse'
              ];
              if (excludedKeywords.some(kw => catStr.includes(kw))) {
                purchaseWithdraws += tx.amount;
              } else {
                otherExpenses += tx.amount;
              }
            }
          }
        });

        setStats({
          income,
          purchaseWithdraws,
          otherExpenses,
          net: income - purchaseWithdraws - otherExpenses
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    const input = document.getElementById('daily-report-content');
    if (!input) return;
    
    toPng(input, { pixelRatio: 2 }).then(dataUrl => {
      const imgData = dataUrl;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (input.offsetHeight * pdfWidth) / input.offsetWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`daily_report_${selectedDate}.pdf`);
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        dir="rtl"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
           className="bg-[#f8fafc] dark:bg-[#1a1f26] w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-white/10 my-8"
        >
          <div className="flex justify-between items-center p-5 bg-slate-100 dark:bg-[#11151c] border-b border-slate-200 dark:border-white/5">
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10">
               <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              التقرير اليومي 
              <button onClick={handleExportPDF} className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-500/20 dark:text-blue-300">
                <Download className="w-4 h-4" /> تصوير PDF
              </button>
            </h2>
          </div>

          <div className="p-6 space-y-6" id="daily-report-content">
            <div className="w-full md:w-1/3 mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اختر اليوم</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-blue-500/20 transition-all" 
                />
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> جاري تحميل التقرير...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-500/5 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 text-center">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-black text-emerald-600 mb-1" dir="ltr">+{stats.income.toLocaleString()} ج.م</p>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إيداعات (إيرادات اليوم)</p>
                  </div>
                  
                  <div className="bg-rose-50 dark:bg-rose-500/5 p-5 rounded-2xl border border-rose-200 dark:border-rose-500/20 text-center">
                      <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <TrendingDown className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-black text-rose-600 mb-1" dir="ltr">-{stats.purchaseWithdraws.toLocaleString()} ج.م</p>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">سحوبات المشتريات</p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-500/5 p-5 rounded-2xl border border-amber-200 dark:border-amber-500/20 text-center">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-black text-amber-600 mb-1" dir="ltr">-{stats.otherExpenses.toLocaleString()} ج.م</p>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">سحوبات المصروفات الأخرى</p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-500/5 p-5 rounded-2xl border border-blue-200 dark:border-blue-500/20 text-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <p className={`text-2xl font-black mb-1 ${stats.net >= 0 ? 'text-blue-600' : 'text-rose-600'}`} dir="ltr">
                        {stats.net >= 0 ? '+' : ''}{stats.net.toLocaleString()} ج.م
                      </p>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">الصافي</p>
                  </div>
                </div>

                <div className="mt-8 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 dark:bg-[#11151c] p-4 text-start font-bold flex justify-between border-b border-slate-200 dark:border-slate-800">
                      <h3 className="text-slate-800 dark:text-white flex gap-2 items-center">المعاملات ({transactions.length})</h3>
                    </div>
                    {transactions.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 font-bold">
                        لا توجد معاملات مسجلة في هذا اليوم
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm text-start">
                          <thead className="bg-[#f0f4f8] dark:bg-[#1a1f26] text-slate-600 dark:text-slate-400 sticky top-0">
                            <tr>
                              <th className="p-3 font-bold">الوقت</th>
                              <th className="p-3 font-bold">التصنيف</th>
                              <th className="p-3 font-bold w-1/2">الوصف</th>
                              <th className="p-3 font-bold text-end">المبلغ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {transactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <td className="p-3 font-medium text-slate-700 dark:text-slate-300" dir="ltr">
                                  {new Date(tx.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                                  <span className={`px-2 py-1 rounded-md text-xs ${tx.type === 'in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20'}`}>
                                    {tx.category || (tx.type === 'in' ? 'إيداع' : 'سحب')}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">{tx.description || '-'}</td>
                                <td className={`p-3 font-black text-end ${(tx.type === 'in' || tx.type === 'income') ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                                  {(tx.type === 'in' || tx.type === 'income') ? '+' : '-'}{tx.amount.toLocaleString()} ج.م
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
