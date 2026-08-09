import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, FileText, CheckCircle2, Loader2, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface Props { isOpen: boolean; onClose: () => void; }
interface Shift { id: number; employee_id: number; cashier_name?: string; user_id?: string; user_name?: string; end_time: string; difference_amount: number; sales_count: number; expected_amount: number; actual_amount: number; status: string; }

export default function ShiftClosuresReportModal({ isOpen, onClose }: Props) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [receivingShift, setReceivingShift] = useState<Shift | null>(null);
  const [targetWalletId, setTargetWalletId] = useState('');
  
  const [stats, setStats] = useState({ total: 0, matched: 0, diff: 0, netImpact: 0 });

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token') || '';
      const userId = localStorage.getItem('user_id') || '';
      
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` };

      // 1. Fetch Wallets for transfer
      try {
         const wRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=id,name,type${branchSuffix}`, { headers });
         if (wRes.ok) setWallets(await wRes.json());
      } catch (e) {}

      // 1.5 Fetch received shifts tracking
      let receivedShiftIds = new Set<number>();
      try {
         const txRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=description&category=eq.استلام عهدة`, { headers });
         if (txRes.ok) {
            const txs = await txRes.json();
            txs.forEach((tx: any) => {
               if (tx.description && tx.description.includes('رقم #')) {
                  const match = tx.description.match(/رقم #(\d+)/);
                  if (match) receivedShiftIds.add(Number(match[1]));
               }
            });
         }
      } catch(e) {}

      // 2. Fetch shifts (fetching closed shifts)
      const response = await fetch(`${SUPABASE_URL}/rest/v1/shifts?status=eq.closed&order=end_time.desc&limit=50${branchSuffix}`, { headers });
      
      if (response.ok) {
        const rawData = await response.json();
        
        let matched = 0;
        let diff = 0;
        let netImpact = 0;

        const data = rawData.map((s: any) => {
           // We override status locally based on whether it was received
           if (!receivedShiftIds.has(s.id)) {
               s.status = 'pending_delivery';
           }

           if (s.difference_amount === 0) matched++;
           else diff++;
           netImpact += s.difference_amount || 0;

           return {
             ...s,
             user_name: s.cashier_name ? s.cashier_name : (s.employee_id || s.user_id ? 'كاشير' : 'إدارة النظام')
           };
        });

        setShifts(data);
        setStats({ total: data.length, matched, diff, netImpact });
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleReceiveCash = async () => {
    if (!receivingShift || !targetWalletId) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const branchVal = (_activeBranchId && _activeBranchId !== 'ALL') ? _activeBranchId : null;
      const tId = localStorage.getItem('tenant_id') || userId;
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      // 1. Mark shift as closed
      await fetch(`${SUPABASE_URL}/rest/v1/shifts?id=eq.${receivingShift.id}`, {
         method: 'PATCH', headers,
         body: JSON.stringify({ status: 'closed' })
      });

      // 2. Transfer logic: We record "in" to target vault...
      await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
          method: 'POST', headers,
          body: JSON.stringify({
             tenant_id: tId,
             branch_id: branchVal,
             wallet_id: parseInt(targetWalletId),
             user_id: userId,
             type: 'in',
             amount: receivingShift.actual_amount,
             category: 'استلام عهدة',
             description: `استلام عهدة شفت رقم #${receivingShift.id} من المستخدم ${receivingShift.user_name || ''}`,
             date: new Date().toISOString()
          })
      });

      // 3. Deduct from Drawer wallet to zero it out physically if needed / logically match it
      try {
         const expectedName = receivingShift.cashier_name ? receivingShift.cashier_name : 'الإدارة';
         const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
         const drawerName = `درج الكاشير - ${expectedName}`;
         const dRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?tenant_id=eq.${tenantId}&name=eq.${encodeURIComponent(drawerName)}&type=eq.cash&select=id,balance`, { headers });
         if (dRes.ok) {
           const dData = await dRes.json();
           if (dData && dData.length > 0) {
             const drawerId = dData[0].id;
             // Record out transaction
             await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
                 method: 'POST', headers,
                 body: JSON.stringify({
                    tenant_id: tId, branch_id: branchVal, wallet_id: drawerId, user_id: userId, type: 'out',
                    amount: receivingShift.actual_amount, category: 'تسليم عهدة', description: `تسليم العهدة للخزينة رقم #${receivingShift.id}`, date: new Date().toISOString()
                 })
             });
             // Deduct balance
             await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${drawerId}`, {
                method: 'PATCH', headers,
                body: JSON.stringify({ balance: (Number(dData[0].balance) || 0) - Number(receivingShift.actual_amount) })
             });
           }
         }
      } catch (e) {
         console.warn("Could not deduct from Drawer Wallet:", e);
      }

      const selectedW = wallets.find(w => w.id.toString() === targetWalletId);
      if (selectedW) {
        // Adjust balance if it's stored in wallet payload (not 100% strictly tracked sum if we rely on table, but let's try to patch if needed)
        // Usually other pages do wallet balance PATCH. If we read it, we should do it correctly:
        const currentWRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${targetWalletId}&select=balance`, { headers });
        if (currentWRes.ok) {
           const [wData] = await currentWRes.json();
           await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${targetWalletId}`, {
              method: 'PATCH', headers,
              body: JSON.stringify({ balance: (Number(wData.balance) || 0) + Number(receivingShift.actual_amount) })
           });
        }
      }

      alert('تم استلام العهدة بنجاح!');
      setReceivingShift(null);
      fetchData();
    } catch (e) {
      alert('خطأ في استلام العهدة');
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    const input = document.getElementById('shift-closures-report-content');
    if (!input) return;
    toPng(input, { pixelRatio: 2 }).then(dataUrl => {
      const imgData = dataUrl;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (input.offsetHeight * pdfWidth) / input.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('shift_closures_report.pdf');
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#f8fafc] dark:bg-[#1a1f26] w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-white/10 my-8">
          <div className="flex justify-between items-center p-5 bg-slate-100 dark:bg-[#11151c] border-b border-slate-200 dark:border-white/5">
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">تقارير تقفيل الشفتات <button onClick={handleExportPDF} className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-500/20 dark:text-blue-300"><Download className="w-4 h-4" /> تصوير PDF</button></h2>
          </div>

          <div className="p-6 space-y-6" id="shift-closures-report-content">
             {isLoading ? (
               <div className="py-20 flex justify-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
             ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="bg-slate-100 dark:bg-[#11151c] p-5 rounded-2xl border border-slate-200 dark:border-slate-800/50 text-center">
                         <div className="w-10 h-10 bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-3"><Lock className="w-5 h-5" /></div>
                         <p className="text-2xl font-black text-slate-800 dark:text-white mb-1">{stats.total}</p>
                         <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي التقفيلات</p>
                     </div>
                     <div className="bg-emerald-50 dark:bg-emerald-500/5 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 text-center">
                         <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-5 h-5" /></div>
                         <p className="text-2xl font-black text-emerald-600 mb-1">{stats.matched}</p>
                         <p className="text-sm font-bold text-slate-500 dark:text-slate-400">تقفيلات متطابقة</p>
                     </div>
                     <div className="bg-rose-50 dark:bg-rose-500/5 p-5 rounded-2xl border border-rose-200 dark:border-rose-500/20 text-center">
                         <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-3"><FileText className="w-5 h-5" /></div>
                         <p className="text-2xl font-black text-rose-600 mb-1">{stats.diff}</p>
                         <p className="text-sm font-bold text-slate-500 dark:text-slate-400">تقفيلات بعجز/زيادة</p>
                     </div>
                     <div className="bg-blue-50 dark:bg-blue-500/5 p-5 rounded-2xl border border-blue-200 dark:border-blue-500/20 text-center">
                         <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3"><Lock className="w-5 h-5" /></div>
                         <p className={`text-2xl font-black mb-1 flex items-center justify-center gap-1 ${stats.netImpact >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                           <span dir="ltr">{stats.netImpact > 0 ? '+' : (stats.netImpact < 0 ? '-' : '')}{Math.abs(stats.netImpact).toLocaleString()}</span>
                           <span className="text-sm">ج.م</span>
                         </p>
                         <p className="text-sm font-bold text-slate-500 dark:text-slate-400">صافي تأثير التقفيلات</p>
                     </div>
                  </div>

                  <div className="mt-8 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 dark:bg-[#11151c] p-4 text-start font-bold border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-slate-800 dark:text-white flex gap-2 items-center">أحدث التقفيلات</h3>
                      </div>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto">
                         <table className="w-full text-sm text-start">
                            <thead className="bg-[#f0f4f8] dark:bg-[#1a1f26] text-slate-600 dark:text-slate-400 sticky top-0">
                               <tr>
                                 <th className="p-3 font-bold">رقم الشفت</th>
                                 <th className="p-3 font-bold">المستخدم</th>
                                 <th className="p-3 font-bold">التاريخ</th>
                                 <th className="p-3 font-bold text-end">العجز / الزيادة</th>
                                 <th className="p-3 font-bold text-center">الإجراء</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                               {shifts.map(shift => {
                                 try {
                                   return (
                                <tr key={shift.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-blue-600 cursor-pointer hover:underline">#SHIFT-{String(shift.id || '0').padStart(3, '0')}</td>
                                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                                       <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-bold">{String(shift.user_name || '?').charAt(0).toUpperCase()}</div>
                                          {shift.user_name || 'غير معروف'}
                                       </div>
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">
                                      <div dir="ltr" className="text-right">
                                        {(() => {
                                          try {
                                            const dateStr = shift.end_time || (shift as any).created_at || (shift as any).start_time;
                                            if (!dateStr) return new Date().toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
                                            
                                            // Handle specific string formats if needed, or simply return the string if parsing fails
                                            const d = new Date(dateStr);
                                            if (isNaN(d.getTime())) return String(dateStr);
                                            
                                            return d.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
                                          } catch (err) {
                                            return String(shift.end_time || '-');
                                          }
                                        })()}
                                      </div>
                                    </td>
                                    <td className={`p-3 font-black text-end ${shift.difference_amount > 0 ? 'text-emerald-600' : (shift.difference_amount < 0 ? 'text-rose-600' : 'text-slate-500')}`}>
                                      <div className="flex items-center justify-end gap-1">
                                        <span dir="ltr">{shift.difference_amount > 0 ? '+' : (shift.difference_amount < 0 ? '-' : '')}{Math.abs(shift.difference_amount || 0).toLocaleString()}</span>
                                        <span className="text-sm">ج.م</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center">
                                      {shift.status === 'pending_delivery' ? (
                                        <button onClick={() => setReceivingShift(shift)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">استلام العهدة</button>
                                      ) : (
                                        <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg text-xs font-bold">تم الاستلام</span>
                                      )}
                                    </td>
                                 </tr>
                                 );
                                } catch (e) { console.error('Error rendering shift', e); return null; }
                               })}
                            </tbody>
                         </table>
                         {shifts.length === 0 && <div className="p-6 text-center text-slate-400 font-bold">لا يوجد شفتات مقفلة</div>}
                      </div>
                  </div>

                 {/* Receive Modal */}
                 {receivingShift && (
                   <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-white/10 shadow-xl">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">استلام عهدة الشفت</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">المبلغ المستلم فعلياً: <strong className="text-blue-600 font-black">{receivingShift.actual_amount} ج.م</strong></p>
                        
                        <div className="mb-6">
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اختر الخزنة لتحويل المبلغ إليها</label>
                           <select value={targetWalletId} onChange={e => setTargetWalletId(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white">
                              <option value="">-- اختر الخزنة --</option>
                              {wallets.filter(w => w.type !== 'drawer' && w.type !== 'cash').map(w => (
                                 <option key={w.id} value={w.id}>{w.name} ({w.type === 'bank' ? 'بنك' : 'كاش/أخرى'})</option>
                              ))}
                              {wallets.filter(w => w.type === 'cash' || !w.type).map(w => (
                                 <option key={w.id} value={w.id}>{w.name} (كاش)</option>
                              ))}
                           </select>
                        </div>

                        <div className="flex gap-2">
                           <button onClick={() => setReceivingShift(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-colors">إلغاء</button>
                           <button onClick={handleReceiveCash} disabled={!targetWalletId || isLoading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">تأكيد الاستلام</button>
                        </div>
                      </div>
                   </div>
                 )}
                </>
             )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
