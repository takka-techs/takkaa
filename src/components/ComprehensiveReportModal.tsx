import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface Props { isOpen: boolean; onClose: () => void; initialWalletId?: string | null; }
interface Wallet { id: number; name: string; branches?: { name: string } }
interface Transaction {
  id: number; type: string; category: string; amount: number; description: string; created_at: string; wallet_id: number;
}

export default function ComprehensiveReportModal({ isOpen, onClose, initialWalletId }: Props) {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState(initialWalletId || 'all');
  
  useEffect(() => {
    if (isOpen) {
      if (initialWalletId) {
        setSelectedWallet(initialWalletId);
      } else {
        setSelectedWallet('all');
      }
    }
  }, [isOpen, initialWalletId]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<Record<string, number>>({});
  const [operationalExpenses, setOperationalExpenses] = useState<Record<string, number>>({});
  const [purchases, setPurchases] = useState<Record<string, number>>({});
  const [others, setOthers] = useState<Record<string, number>>({});
  
  const [totals, setTotals] = useState({ income: 0, expenses: 0, purchases: 0, net: 0 });

  useEffect(() => {
    if (isOpen) { fetchWallets(); fetchData(); }
  }, [isOpen, fromDate, toDate, selectedWallet]);

  const fetchWallets = async () => {
    try {
      const token = localStorage.getItem('access_token') || '';
      const userId = localStorage.getItem('user_id') || '';
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/wallets${branchSuffixFirst}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setWallets(await res.json());
    } catch (e) {}
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token') || '';
      const userId = localStorage.getItem('user_id') || '';
      let url = `${SUPABASE_URL}/rest/v1/treasury_transactions?created_at=gte.${fromDate}T00:00:00Z&created_at=lte.${toDate}T23:59:59Z&order=created_at.desc`;
      if (selectedWallet !== 'all') url += `&wallet_id=eq.${selectedWallet}`;
      
      const response = await fetch(url, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data: Transaction[] = await response.json();
        setTransactions(data);
        
        const dep: Record<string, number> = {};
        const op: Record<string, number> = {};
        const pur: Record<string, number> = {};
        const oth: Record<string, number> = {};
        let tInc = 0, tExp = 0, tPur = 0;

        data.forEach(tx => {
          const cat = tx.category || 'أخرى';
          if (tx.type === 'in' || tx.type === 'income') {
            dep[cat] = (dep[cat] || 0) + tx.amount;
            tInc += tx.amount;
          } else {
            if (cat.includes('مشتريات') || cat.includes('توريد')) {
              pur[cat] = (pur[cat] || 0) + tx.amount; tPur += tx.amount;
            } else if (cat.includes('رواتب') || cat.includes('مصروفات')) {
              op[cat] = (op[cat] || 0) + tx.amount; tExp += tx.amount;
            } else {
              oth[cat] = (oth[cat] || 0) + tx.amount;
            }
          }
        });

        setDeposits(dep); setOperationalExpenses(op); setPurchases(pur); setOthers(oth);
        setTotals({ income: tInc, expenses: tExp, purchases: tPur, net: tInc - tExp - tPur - Object.values(oth).reduce((a,b)=>a+b,0) });
      }
    } catch (e) {
    } finally { setIsLoading(false); }
  };

  const handleExportPDF = () => {
    const input = document.getElementById('comprehensive-report-content');
    if (!input) return;
    toPng(input, { pixelRatio: 2 }).then(dataUrl => {
      const imgData = dataUrl;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (input.offsetHeight * pdfWidth) / input.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`comprehensive_report_${fromDate}_to_${toDate}.pdf`);
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#f8fafc] dark:bg-[#1a1f26] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 my-8 flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-5 bg-slate-100 dark:bg-[#11151c] border-b border-slate-200 dark:border-white/5 shrink-0">
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">تقرير شامل للخزنة <button onClick={handleExportPDF} className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-500/20 dark:text-blue-300"><Download className="w-4 h-4" /> تصوير PDF</button></h2>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar" id="comprehensive-report-content">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">من تاريخ</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-blue-400 dark:border-blue-500 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-bold outline-none ring-2 ring-blue-100 dark:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">إلى تاريخ</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المحفظة</label>
                  <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-800 dark:text-white font-bold outline-none">
                     <option value="all">جميع المحافظ</option>
                     {wallets.map(w => <option key={w.id} value={w.id}>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>)}
                  </select>
                </div>
             </div>

             {isLoading ? (
               <div className="py-20 flex justify-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
             ) : (
               <>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-emerald-50 dark:bg-emerald-500/5 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 text-center">
                       <p className="text-xl lg:text-2xl font-black text-emerald-600 mb-1" dir="ltr">+{totals.income.toLocaleString()} ج.م</p>
                       <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي الإيداعات</p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-500/5 p-5 rounded-2xl border border-rose-200 dark:border-rose-500/20 text-center">
                       <p className="text-xl lg:text-2xl font-black text-rose-600 mb-1" dir="ltr">-{totals.expenses.toLocaleString()} ج.م</p>
                       <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي المصروفات (خسارة)</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-500/5 p-5 rounded-2xl border border-amber-200 dark:border-amber-500/20 text-center">
                       <p className="text-xl lg:text-2xl font-black text-amber-600 mb-1" dir="ltr">-{totals.purchases.toLocaleString()} ج.م</p>
                       <p className="text-sm font-bold text-slate-500 dark:text-slate-400">سحوبات (مشتريات/توريد)</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/5 p-5 rounded-2xl border border-blue-200 dark:border-blue-500/20 text-center">
                       <p className={`text-xl lg:text-2xl font-black mb-1 ${totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">{totals.net >= 0 ? '+' : ''}{totals.net.toLocaleString()} ج.م</p>
                       <p className="text-sm font-bold text-slate-500 dark:text-slate-400">صافي التدفق</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="col-span-1 space-y-3">
                       <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-center border-b border-slate-200 dark:border-slate-800 pb-2">تفاصيل الإيداعات</h3>
                       {Object.keys(deposits).length ? Object.entries(deposits).map(([k,v]) => (
                         <div key={k} className="bg-slate-100 dark:bg-[#0a0e14] p-3 rounded-xl flex justify-between items-center text-sm font-bold">
                            <span className="text-slate-700 dark:text-slate-300">{k}</span><span className="text-emerald-600" dir="ltr">+{v.toLocaleString()} ج.م</span>
                         </div>
                       )) : <div className="text-slate-400 text-sm text-center">لا توجد إيداعات</div>}
                    </div>

                    <div className="col-span-1 space-y-3 md:border-r border-slate-200 dark:border-slate-800 md:pr-6">
                       <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-center border-b border-slate-200 dark:border-slate-800 pb-2">تفاصيل المصروفات التشغيلية</h3>
                       {Object.keys(operationalExpenses).length ? Object.entries(operationalExpenses).map(([k,v]) => (
                         <div key={k} className="bg-slate-100 dark:bg-[#0a0e14] p-3 rounded-xl flex justify-between items-center text-sm font-bold">
                            <span className="text-slate-700 dark:text-slate-300">{k}</span><span className="text-rose-600" dir="ltr">-{v.toLocaleString()} ج.م</span>
                         </div>
                       )) : <div className="text-slate-400 text-sm text-center">لا توجد مصروفات</div>}
                    </div>

                    <div className="col-span-1 space-y-3 md:border-r border-slate-200 dark:border-slate-800 md:pr-6">
                       <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-center border-b border-slate-200 dark:border-slate-800 pb-2">سحوبات مشتريات وتوريد</h3>
                       {Object.keys(purchases).length ? Object.entries(purchases).map(([k,v]) => (
                         <div key={k} className="bg-slate-100 dark:bg-[#0a0e14] p-3 rounded-xl flex justify-between items-center text-sm font-bold">
                            <span className="text-slate-700 dark:text-slate-300">{k}</span><span className="text-amber-600" dir="ltr">-{v.toLocaleString()} ج.م</span>
                         </div>
                       )) : <div className="text-slate-400 text-sm text-center">لا توجد سحوبات مشتريات</div>}
                    </div>

                    <div className="col-span-1 space-y-3 md:border-r border-slate-200 dark:border-slate-800 md:pr-6">
                       <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-center border-b border-slate-200 dark:border-slate-800 pb-2">سحوبات أخرى (مرتجعات، عجز)</h3>
                       {Object.keys(others).length ? Object.entries(others).map(([k,v]) => (
                         <div key={k} className="bg-slate-100 dark:bg-[#0a0e14] p-3 rounded-xl flex justify-between items-center text-sm font-bold">
                            <span className="text-slate-700 dark:text-slate-300">{k}</span><span className="text-blue-600" dir="ltr">-{v.toLocaleString()} ج.م</span>
                         </div>
                       )) : <div className="text-slate-400 text-sm text-center">لا توجد سحوبات أخرى</div>}
                    </div>
                 </div>

                 <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 dark:bg-[#11151c] p-4 text-start font-bold flex justify-between border-b border-slate-200 dark:border-slate-800">
                      <h3 className="text-slate-800 dark:text-white flex gap-2 items-center">المعاملات للفترة المحددة ({transactions.length})</h3>
                    </div>
                    {transactions.length > 0 ? (
                      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm text-start">
                           <thead className="bg-[#f0f4f8] dark:bg-[#1a1f26] text-slate-600 dark:text-slate-400 sticky top-0">
                              <tr>
                                <th className="p-3 font-bold">التاريخ</th>
                                <th className="p-3 font-bold">النوع</th>
                                <th className="p-3 font-bold w-1/2">الوصف</th>
                                <th className="p-3 font-bold text-end">المبلغ</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                   <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{new Date(tx.created_at).toLocaleDateString('ar-EG')}</td>
                                   <td className="p-3 font-medium text-slate-700 dark:text-slate-300 text-xs">{tx.category || (tx.type === 'in' ? 'إيداع' : 'سحب')}</td>
                                   <td className="p-3 text-slate-600 dark:text-slate-400">{tx.description || '-'}</td>
                                   <td className={`p-3 font-black text-end ${(tx.type === 'in' || tx.type === 'income') ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">{(tx.type === 'in' || tx.type === 'income') ? '+' : '-'}{tx.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                    ) : <div className="p-6 text-center text-slate-400 font-bold">لا يوجد معاملات مطابقة للفلاتر</div>}
                 </div>
               </>
             )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
