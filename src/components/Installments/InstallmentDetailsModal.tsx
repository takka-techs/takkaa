import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, DollarSign, Clock, AlertTriangle, User, Phone, CheckCircle, Smartphone, SmartphoneNfc, Printer } from 'lucide-react';
import BulkPaymentModal from './BulkPaymentModal';
import { useReactToPrint } from 'react-to-print';
import { PrintReceiptTemplate } from '../PrintReceiptTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface props {
  contract: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function InstallmentDetailsModal({ contract, onClose, onUpdate }: props) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  
  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // Reschedule Modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newCount, setNewCount] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Change/Cancel Contract state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Printing state
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const printAllDetailsRef = useRef<HTMLDivElement>(null);

  const executePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: 'إيصال دفع قسط',
    pageStyle: '',
  });

  const executePrintAllDetails = useReactToPrint({
    contentRef: printAllDetailsRef,
    documentTitle: 'تفاصيل عقد التقسيط',
    pageStyle: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchWallets();
  }, [contract.id]);

  const fetchWallets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem("user_id");
      const _tenantId = localStorage.getItem("tenant_id") || userId;
      const activeBranchId = localStorage.getItem("takka_active_branch_id");

      let queryUrl = `${SUPABASE_URL}/rest/v1/wallets?select=*,branches(name)&order=name.asc`;
      if (_tenantId) queryUrl += `&tenant_id=eq.${_tenantId}`;
      if (activeBranchId && activeBranchId !== 'ALL') queryUrl += `&branch_id=eq.${activeBranchId}`;

      const res = await fetch(queryUrl, {
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setWallets(await res.json());
    } catch(err) { console.error(err); }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${SUPABASE_URL}/rest/v1/installment_payments?contract_id=eq.${contract.id}&deleted_at=is.null&order=due_date.asc&bypass_branch=true`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`فشل جلب الأقساط: ${errText}`);
      }
      setPayments(await response.json() || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (errData: any, defaultMsg: string) => {
      const errMsg = errData?.message || String(errData) || defaultMsg;
      if (errMsg.includes('CLIENT_BLACKLISTED')) alert('العميل في القائمة السوداء');
      else if (errMsg.includes('CONTRACT_LOCKED')) alert('العقد مكتمل ولا يمكن تعديله');
      else if (errMsg.includes('INVALID_TRANSITION')) alert('تغيير الحالة غير مسموح (العقد محذوف أو مكتمل)');
      else if (errMsg.includes('CANNOT_RESCHEDULE')) alert('لا يمكن إعادة الجدولة في الحالة الحالية');
      else if (errMsg.includes('CONTRACT_NOT_FOUND')) alert('العقد غير موجود أو محذوف');
      else alert(defaultMsg + ': ' + errMsg);
  };

  const getRealEmpId = async (userId: string, headers: any) => {
      let realEmpId: string | null = userId;
      let cashierName = 'المدير';
      const cashierStr = localStorage.getItem('active_cashier');
      if (cashierStr) {
          try {
             const cashier = JSON.parse(cashierStr);
             if (cashier && cashier.id) {
                 realEmpId = cashier.id;
                 cashierName = cashier.name || cashier.username || 'كاشير';
             }
          } catch (e) {}
      }
      
      let usedFallback = false;
      const empRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${realEmpId}&select=id`, { headers });
      if (empRes.ok) {
         const emps = await empRes.json();
         if (!emps || emps.length === 0) {
             const fallBackRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=id&limit=1`, { headers });
             if (fallBackRes.ok) {
                 const fallBackEmps = await fallBackRes.json();
                 if (fallBackEmps && fallBackEmps.length > 0) {
                     realEmpId = fallBackEmps[0].id;
                     usedFallback = true;
                 } else {
                     realEmpId = null;
                     usedFallback = true; // Still flag as used fallback to ensure the cashierName is appended to notes
                 }
             } else {
                 realEmpId = null;
                 usedFallback = true;
             }
         }
      }
      return { id: realEmpId, usedFallback, cashierName };
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      
      const headers = {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      };

      const empData = await getRealEmpId(userId, headers);

      const paymentVal = Number(paymentAmount);
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay_${selectedPayment.id}_${Date.now()}`;

      let finalNotes = paymentNotes || `تحصيل قسط #${selectedPayment.installment_no}`;
      if (empData.usedFallback) finalNotes += ` (بواسطة: ${empData.cashierName})`;

      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/process_installment_payment`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
              p_payment_id: selectedPayment.id,
              p_amount: paymentVal,
              p_employee_id: empData.id,
              p_wallet_id: parseInt(walletId) || null,
              p_idempotency_key: idempotencyKey,
              p_receipt_url: null,
              p_notes: finalNotes
          })
      });

      if (!rpcRes.ok) {
          const errData = await rpcRes.json().catch(() => null);
          throw new Error(errData?.message || await rpcRes.text());
      }

      const resData = await rpcRes.json();
      if (resData.error) throw new Error(resData.error);
      
      // ---- Update active shift manually ----
      try {
         const userId = localStorage.getItem('user_id');
         const activeBranchId = localStorage.getItem('takka_active_branch_id');
         const branchSuffix = activeBranchId && activeBranchId !== 'ALL' ? `&branch_id=eq.${activeBranchId}` : '';
         const shiftRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts?select=*&status=eq.open${branchSuffix}&user_id=eq.${userId}${(() => { const cStr = localStorage.getItem('active_cashier'); if (cStr) { try { const c = JSON.parse(cStr); if (c && c.role_level !== 1) return '&cashier_name=eq.' + encodeURIComponent(c.full_name || c.username || c.name || 'موظف مبيعات'); else if (c && c.role_level === 1) return (c.full_name || c.username || c.name) ? `&or=(cashier_name.is.null,cashier_name.eq.${encodeURIComponent(c.full_name || c.username || c.name)})` : '&cashier_name=is.null'; } catch (e) {} } return '&cashier_name=is.null'; })()}&order=created_at.desc&limit=1`, { headers });
         if (shiftRes.ok) {
            const shifts = await shiftRes.json();
            if (shifts && shifts.length > 0) {
               const activeShift = shifts[0];
               const patchBody: any = { deposits_count: Number(activeShift.deposits_count || 0) + 1 };
               const targetWallet = wallets.find((w: any) => w.id.toString() === walletId.toString());
               if (targetWallet && targetWallet.type === 'cash') {
                   patchBody.expected_amount = Number(activeShift.expected_amount || 0) + paymentVal;
               }
               await fetch(`${SUPABASE_URL}/rest/v1/shifts?id=eq.${activeShift.id}`, {
                  method: 'PATCH',
                  headers,
                  body: JSON.stringify(patchBody)
               });
            }
         }
      } catch(e) { console.error('Failed to update shift', e); }

      if (resData.status === 'already_paid') {
          alert('تم تحصيل هذا القسط مسبقاً.');
          setShowPaymentModal(false);
          setPaymentNotes('');
          fetchPayments();
          onUpdate();
      } else {
          alert('تم تحصيل الدفعة بنجاح');
          
          setReceiptData({
            installment_no: selectedPayment.installment_no,
            paymentVal: paymentVal,
            contractId: contract.id,
            cashierName: empData.cashierName
          });
          
          setShowPaymentModal(false);
          setPaymentNotes('');
          fetchPayments();
          onUpdate();
          
          setTimeout(() => {
            if ((window as any).electron) {
              const pData = {
                invoiceId: `P-${contract.id.split('-')[0]}-${selectedPayment.installment_no}`,
                items: [{ id: '1', name: `قسط رقم ${selectedPayment.installment_no}`, price: paymentVal, quantity: 1, type: 'installment' }],
                totalAmount: paymentVal,
                discount: 0,
                finalAmount: paymentVal,
                cashReceived: paymentVal,
                changeAmount: 0,
                customerName: contract.clients?.name,
                cashierName: empData.cashierName
              };
              (window as any).electron.printSilent({ type: 'receipt', data: pData });
            } else {
              executePrintReceipt();
            }
          }, 150);
      }
    } catch (err: any) {
      handleError(err.message, 'فشل معالجة الدفع');
    } finally {
      setPaymentLoading(false);
    }
  };
  
  const processCancelContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
        alert('الرجاء إدخال سبب الإلغاء');
        return;
    }
    setCancelLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      const headers = { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` };

      const empData = await getRealEmpId(userId, headers);
      let finalReason = cancelReason;
      if (empData.usedFallback) finalReason += ` (بواسطة: ${empData.cashierName})`;

      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/soft_delete_installment_contract`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              p_contract_id: contract.id, 
              p_performed_by: empData.id,
              p_reason: finalReason 
          })
      });
      
      if (res.ok) {
        alert('تم إلغاء العقد بنجاح وتم تجميده مالياً.');
        setShowCancelModal(false);
        onClose();
        onUpdate();
      } else {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || await res.text() || 'حدث خطأ غير معروف');
      }
    } catch (err: any) {
      handleError(err.message, 'فشل إلغاء العقد');
    } finally {
      setCancelLoading(false);
    }
  };

  const processReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCount || Number(newCount) <= 0) {
      alert('الرجاء إدخال عدد أقساط صحيح');
      return;
    }
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      
      const headers = {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      };

      const empData = await getRealEmpId(userId, headers);
      let finalReason = rescheduleReason || 'طلب العميل إعادة الجدولة';
      if (empData.usedFallback) finalReason += ` (بواسطة: ${empData.cashierName})`;

      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reschedule_installment_contract`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
              p_contract_id: contract.id,
              p_new_count: Number(newCount),
              p_employee_id: empData.id,
              p_reason: finalReason
          })
      });

      if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errMsg = errData?.message || await res.text() || 'حدث خطأ غير معروف';
          let displayError = errMsg;
          if (errMsg.includes('CANNOT_RESCHEDULE')) displayError = 'لا يمكن إعادة الجدولة في الحالة الحالية (يجب أن يكون نشط أو متأخر)';
          else if (errMsg.includes('INVALID_TRANSITION')) displayError = 'تغيير الحالة غير مسموح';
          throw new Error('فشل إعادة الجدولة: ' + displayError);
      }

      setShowRescheduleModal(false);
      setRescheduleReason('');
      fetchPayments();
      // Also update contract total stats by calling parent callback
      onUpdate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'paid': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">مدفوع</span>;
      case 'partial': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">جزئي</span>;
      case 'pending': return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold">معلق</span>;
      case 'overdue': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">متأخر</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold">{status}</span>;
    }
  };

  const totalRemainingDebt = payments.reduce((acc, p) => (p.status === 'pending' || p.status === 'partial' || p.status === 'overdue') ? acc + (p.due_amount + p.penalty_amount - (p.paid_amount || 0)) : acc, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#11151c] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-white/10"
      >
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary-500" />
              تفاصيل عقد التقسيط
              <button onClick={() => executePrintAllDetails()} className="mr-8 p-1.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors shadow-sm">
                 <Printer className="w-4 h-4" />
                 طباعة كشف حـســاب
              </button>
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-mono">{contract.id.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <User className="w-4 h-4" />
                <span className="font-bold">معلومات العميل</span>
              </div>
              <p className="text-lg font-black dark:text-white">{contract.clients?.name}</p>
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <Phone className="w-4 h-4" />
                <span dir="ltr" className="font-mono">{contract.clients?.phone}</span>
              </div>

              {contract.guarantor_name && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
                  <div className="text-xs text-slate-400 mb-1">الضامن</div>
                  <p className="text-sm font-bold dark:text-white">{contract.guarantor_name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400" dir="ltr">{contract.guarantor_phone}</p>
                  {contract.guarantor_national_id && <p className="text-xs text-slate-400 font-mono mt-1">{contract.guarantor_national_id}</p>}
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl space-y-3">
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-bold">الماليات</span>
                </div>
                <div className="flex gap-2">
                    {(contract.status === 'active' || contract.status === 'overdue') ? (
                      (contract.rescheduled_count || 0) < (contract.max_reschedules || 3) ? (
                        <button onClick={() => setShowRescheduleModal(true)} className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 px-2 py-1 rounded font-bold hover:bg-cyan-200 transition-colors">
                          إعادة جدولة
                        </button>
                      ) : (
                        <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded font-bold" title="تم استنفاد حد إعادة الجدولة">تم استنفاد حد الجدولة</span>
                      )
                    ) : null}
                    <button 
                         onClick={() => setShowCancelModal(true)}
                         className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded font-bold hover:bg-red-200 transition-colors">
                      إلغاء العقد
                    </button>
                </div>
               </div>
               <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-2">
                 <span className="text-sm text-slate-500">إجمالي العقد</span>
                 <span className="font-black text-emerald-600 dark:text-emerald-400">{contract.total_price?.toLocaleString()} ج</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500">الدفعات</span>
                 <span className="font-bold dark:text-white">{contract.installment_count} أقساط</span>
               </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold dark:text-white text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                جدول الدفعات
              </h3>
              {contract.status !== 'completed' && contract.status !== 'defaulted' && (
                <button
                   onClick={() => setShowBulkPaymentModal(true)}
                   className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-[0px_4px_16px_rgba(79,70,229,0.3)] transition-all flex border border-indigo-400 dark:border-indigo-500"
                >
                  تحصيل حر (شلال)
                </button>
              )}
            </div>
            
            {loading ? (
              <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div></div>
            ) : error ? (
              <div className="text-red-500 font-bold p-4 bg-red-100 rounded-lg">{error}</div>
            ) : (
              <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">تاريخ الاستحقاق</th>
                    <th className="p-3">المطلوب</th>
                    <th className="p-3">المدفوع</th>
                    <th className="p-3">الغرامة</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="p-3 font-bold dark:text-white text-slate-500">{p.installment_no}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {new Date(p.due_date).toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}
                      </td>
                      <td className="p-3 font-mono font-bold">{p.due_amount}</td>
                      <td className="p-3 text-emerald-600 font-mono font-bold">{p.paid_amount || 0}</td>
                      <td className="p-3 text-red-500 font-mono">{p.penalty_amount || 0}</td>
                      <td className="p-3">{renderStatus(p.status)}</td>
                      <td className="p-3 text-center">
                        {(p.status === 'pending' || p.status === 'partial' || p.status === 'overdue') ? (
                          <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => { setSelectedPayment(p); setPaymentAmount(String((p.due_amount - (p.paid_amount || 0)) + Number(p.penalty_amount || 0))); setShowPaymentModal(true); }}
                                className="bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 hover:bg-primary-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              >
                                تحصيل قسط
                              </button>
                              
                              {p.penalty_amount > 0 && (
                                 <button 
                                   onClick={async () => {
                                      const reason = prompt('أدخل سبب التنازل عن الغرامة:');
                                      if (reason) {
                                          let empData = await getRealEmpId(localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3', { 'apikey': API_KEY, 'Authorization': `Bearer ${localStorage.getItem('access_token')}`});
                                          let finalReason = reason;
                                          if (empData.usedFallback) finalReason += ` (بواسطة: ${empData.cashierName})`;
                                          const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/waive_installment_penalty`, {
                                              method: 'POST',
                                              headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ p_payment_id: p.id, p_employee_id: empData.id, p_reason: finalReason })
                                          });
                                          if (res.ok) { fetchPayments(); onUpdate(); }
                                          else alert('فشل التنازل عن الغرامة ' + await res.text());
                                      }
                                   }}
                                   className="bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 hover:bg-yellow-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                 >
                                    إعفاء الغرامة
                                 </button>
                              )}
                          </div>
                        ) : (
                          <div className="flex justify-center gap-2">
                             {p.status === 'paid' && (
                               <button
                                 onClick={() => {
                                   let activeName = 'كاشير';
                                   try { const c = JSON.parse(localStorage.getItem('active_cashier') || '{}'); activeName = c.name || c.username || 'كاشير'; } catch(e){}
                                   setReceiptData({
                                     installment_no: p.installment_no,
                                     paymentVal: p.paid_amount || p.due_amount,
                                     contractId: contract.id,
                                     cashierName: activeName
                                   });
                                   setTimeout(() => {
                                     if ((window as any).electron) {
                                       const pData = {
                                         invoiceId: `P-${contract.id.split('-')[0]}-${p.installment_no}`,
                                         items: [{ id: '1', name: `قسط رقم ${p.installment_no}`, price: p.paid_amount || p.due_amount, quantity: 1, type: 'installment' }],
                                         totalAmount: p.paid_amount || p.due_amount,
                                         discount: 0,
                                         finalAmount: p.paid_amount || p.due_amount,
                                         cashReceived: p.paid_amount || p.due_amount,
                                         changeAmount: 0,
                                         customerName: contract.clients?.name,
                                         cashierName: activeName
                                       };
                                       (window as any).electron.printSilent({ type: 'receipt', data: pData });
                                     } else {
                                       executePrintReceipt();
                                     }
                                   }, 150);
                                 }}
                                 className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                 title="طباعة إيصال"
                               >
                                 <Printer className="w-5 h-5 mx-auto" />
                               </button>
                             )}
                             {p.status !== 'paid' && <span className="text-slate-300 dark:text-slate-600">-</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl">
             <div className="p-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="font-black text-lg dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  تحصيل الدفعة رقم {selectedPayment.installment_no}
                </h3>
             </div>
             <form onSubmit={processPayment} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">المبلغ المحصل (ج.م)</label>
                  <input type="number" required min="1" step="0.01" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-800" />
                  <p className="text-xs text-slate-500 mt-1">المتبقي شامل الغرامة: {Number(selectedPayment.due_amount) - Number(selectedPayment.paid_amount || 0) + Number(selectedPayment.penalty_amount || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الخزنة / الحساب</label>
                  <select required value={walletId} onChange={e=>setWalletId(e.target.value)} className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-800">
                    <option value="">اختر الخزنة...</option>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>)}
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">ملاحظات (اختياري)</label>
                    <input type="text" value={paymentNotes} onChange={e=>setPaymentNotes(e.target.value)} className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-800" placeholder="مثال: محول من فودافون كاش..." />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={paymentLoading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl">
                    {paymentLoading ? 'جاري التحصيل...' : 'تأكيد التحصيل'}
                  </button>
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl">
                    إلغاء
                  </button>
                </div>
             </form>
          </motion.div>
        </div>
      )}
      
      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl">
             <div className="p-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="font-black text-lg text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  إعادة جدولة العقد
                </h3>
             </div>
             <form onSubmit={processReschedule} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">عدد الأقساط الجديد</label>
                  <input type="number" required min="1" max="100" value={newCount} onChange={e=>setNewCount(e.target.value)} className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-800" />
                  <p className="text-xs text-orange-500 font-bold mt-1">سيتم حذف الأقساط المعلقة الحالية وجدولتها من جديد</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">السبب (اختياري)</label>
                  <input type="text" value={rescheduleReason} onChange={e=>setRescheduleReason(e.target.value)} className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-800" />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={paymentLoading} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-xl">
                    {paymentLoading ? 'الرجاء الانتظار...' : 'تنفيذ الجدولة'}
                  </button>
                  <button type="button" onClick={() => setShowRescheduleModal(false)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl">
                    إلغاء
                  </button>
                </div>
             </form>
          </motion.div>
        </div>
      )}

      {/* Cancel Contract Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl">
             <div className="p-5 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-500/10">
                <h3 className="font-black text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  إلغاء العقد
                </h3>
             </div>
             <form onSubmit={processCancelContract} className="p-5 space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-bold">
                  سيتم تحويل حالة العقد إلى "متعثر" وتجميده مالياً، وسيخضع للمراجعة.
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">سبب الإلغاء (إجباري)</label>
                  <textarea 
                    required 
                    rows={3}
                    value={cancelReason} 
                    onChange={e=>setCancelReason(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-800" 
                    placeholder="اكتب سبب إلغاء العقد هنا بجملة واضحة..."
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={cancelLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl border border-transparent">
                    {cancelLoading ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
                  </button>
                  <button type="button" onClick={() => setShowCancelModal(false)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl">
                    تراجع
                  </button>
                </div>
             </form>
          </motion.div>
        </div>
      )}

      {/* Bulk Payment Modal */}
      {showBulkPaymentModal && (
        <BulkPaymentModal
          contractId={contract.id}
          totalRemainingDebt={totalRemainingDebt}
          onClose={() => setShowBulkPaymentModal(false)}
          onSuccess={() => {
            setShowBulkPaymentModal(false);
            fetchPayments();
            onUpdate();
          }}
        />
      )}

      {/* Hidden Print Templates */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <PrintReceiptTemplate
          ref={receiptPrintRef}
          invoiceId={receiptData ? `P-${receiptData.contractId.split('-')[0]}-${receiptData.installment_no}` : ''}
          items={receiptData ? [{ id: '1', name: `قسط رقم ${receiptData.installment_no}`, price: receiptData.paymentVal, quantity: 1, type: 'installment' }] : []}
          totalAmount={receiptData?.paymentVal || 0}
          discount={0}
          finalAmount={receiptData?.paymentVal || 0}
          cashReceived={receiptData?.paymentVal || 0}
          changeAmount={0}
          customerName={contract.clients?.name}
          cashierName={receiptData?.cashierName || ''}
        />
        
        {/* Full Contract Details PDF Template */}
        <div ref={printAllDetailsRef} className="print-only bg-white text-black text-right font-sans w-full min-h-screen p-8" dir="rtl">
           <style>{`
             @media print {
                @page { size: A4; margin: 20mm; }
                body { -webkit-print-color-adjust: exact; }
                .print-only { color: #000; font-family: 'Cairo', sans-serif; }
                th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
             }
           `}</style>
           <div className="text-center border-b-2 border-slate-800 pb-4 mb-6 relative">
             <h2 className="text-3xl font-black mb-2 uppercase tracking-wide">كشف حساب قسط</h2>
             <p className="text-gray-600 font-mono text-sm leading-tight tracking-wider">رقم العقد: {contract.id}</p>
             <div className="absolute top-0 right-0 text-right text-xs">
                تاريخ الطباعة:<br />
                <span dir="ltr">{new Date().toLocaleDateString('ar-EG')}</span>
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
             <div className="p-4 border border-slate-300 rounded-xl relative overflow-hidden">
               <h3 className="font-bold text-lg text-slate-800 border-b border-slate-200 pb-2 mb-3">بيانات العميل</h3>
               <table className="w-full">
                 <tbody>
                   <tr><td className="py-1 font-bold w-1/3">الاسم:</td><td className="py-1">{contract.clients?.name}</td></tr>
                   <tr><td className="py-1 font-bold w-1/3">استعلام:</td><td className="py-1 font-mono" dir="ltr">{contract.clients?.phone}</td></tr>
                   {contract.guarantor_name && (
                     <>
                        <tr><td colSpan={2} className="py-2 border-b border-slate-100"></td></tr>
                        <tr><td className="py-1 font-bold w-1/3 text-slate-500">اسم الضامن:</td><td className="py-1">{contract.guarantor_name}</td></tr>
                        <tr><td className="py-1 font-bold w-1/3 text-slate-500">رقم الضامن:</td><td className="py-1 font-mono" dir="ltr">{contract.guarantor_phone}</td></tr>
                        {contract.guarantor_national_id && <tr><td className="py-1 font-bold w-1/3 text-slate-500">الرقم القومي:</td><td className="py-1 font-mono" dir="ltr">{contract.guarantor_national_id}</td></tr>}
                     </>
                   )}
                 </tbody>
               </table>
             </div>
             <div className="p-4 border border-slate-300 rounded-xl relative overflow-hidden">
               <h3 className="font-bold text-lg text-slate-800 border-b border-slate-200 pb-2 mb-3">ملخص الدفعات</h3>
               <table className="w-full">
                 <tbody>
                   <tr><td className="py-1 font-bold w-1/2">إجمالي العقد:</td><td className="py-1 font-mono font-bold text-emerald-700">{contract.total_price?.toLocaleString()} ج.م</td></tr>
                   <tr><td className="py-1 font-bold w-1/2 ">إجمالي المدفوع:</td><td className="py-1 font-mono">{payments.filter((p: any) => p.status === 'paid').reduce((acc: number, p: any) => acc + (p.paid_amount || 0), 0).toLocaleString()} ج.م <span className="text-xs text-gray-500">({payments.filter((p:any) => p.status === 'paid').length} قسط)</span></td></tr>
                   <tr><td className="py-1 font-bold w-1/2">إجمالي المتبقي:</td><td className="py-1 font-mono border-t border-slate-300 mt-1 pt-1">{totalRemainingDebt.toLocaleString()} ج.م <span className="text-xs text-gray-500">({payments.filter((p:any) => p.status !== 'paid').length} قسط)</span></td></tr>
                 </tbody>
               </table>
             </div>
           </div>

           <div className="mb-4 text-center font-bold text-lg bg-slate-100 py-2 border-y border-slate-300">
             جدول الأقساط والتفصيل
           </div>

           <table className="w-full text-sm text-right border-collapse border border-slate-300">
             <thead>
               <tr>
                 <th className="p-3 border border-slate-300 font-bold bg-slate-100 w-12 text-center">#</th>
                 <th className="p-3 border border-slate-300 font-bold bg-slate-100">تاريخ الاستحقاق</th>
                 <th className="p-3 border border-slate-300 font-bold bg-slate-100">المطلوب</th>
                 <th className="p-3 border border-slate-300 font-bold bg-slate-100">المدفوع</th>
                 <th className="p-3 border border-slate-300 font-bold bg-slate-100">الغرامة</th>
                 <th className="p-3 border border-slate-300 font-bold bg-slate-100">الحالة</th>
               </tr>
             </thead>
             <tbody>
               {payments.map((p: any) => (
                 <tr key={p.id}>
                   <td className="p-2 border border-slate-300 text-center font-bold">{p.installment_no}</td>
                   <td className="p-2 border border-slate-300" dir="ltr">{new Date(p.due_date).toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</td>
                   <td className="p-2 border border-slate-300 font-mono">{p.due_amount}</td>
                   <td className="p-2 border border-slate-300 font-mono text-emerald-700 font-bold">{p.paid_amount || 0}</td>
                   <td className="p-2 border border-slate-300 font-mono text-red-600">{p.penalty_amount || 0}</td>
                   <td className="p-2 border border-slate-300 font-bold">
                     {p.status === 'paid' ? 'مدفوع' : p.status === 'partial' ? 'جزئي' : p.status === 'overdue' ? 'متأخر' : 'معلق'}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>

           <div className="mt-12 pt-6 border-t font-bold border-slate-300 text-center text-sm text-slate-500 max-w-sm mx-auto flex flex-col gap-2">
              <span className="uppercase tracking-widest text-[10px]">Takka Accounting System</span>
              <span>توقيع الموظف المعتمد: ........................</span>
           </div>
        </div>
      </div>
    </div>
  );
}
