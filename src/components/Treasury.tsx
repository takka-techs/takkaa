import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Plus, Minus, ArrowLeftRight, Menu, RefreshCw, 
  Wallet, Landmark, Smartphone, Eye, MoreVertical, Vault,
  TrendingUp, TrendingDown, Lock, Unlock, FileText, ChevronDown,
  ArrowDown, Check, X, Calendar, Download, PieChart as PieChartIcon,
  BarChart3, Settings, Loader2
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import ComprehensiveReportModal from './ComprehensiveReportModal';
import MoneyTransfersReportModal from './MoneyTransfersReportModal';
import DailyReportModal from './DailyReportModal';
import MonthlyReportModal from './MonthlyReportModal';
import ShiftClosuresReportModal from './ShiftClosuresReportModal';
import PeriodComparisonModal from './PeriodComparisonModal';
import ShiftManagementModal from './ShiftManagementModal';

// --- Types ---
interface WalletType {
  id: number;
  name: string;
  type?: string;
  status?: string;
  balance: number;
  branch_id?: string;
  branch_name?: string;
}

interface Transaction {
  id: number;
  wallet_id: number;
  wallet_name?: string;
  type: string;
  category: string;
  title: string;
  description?: string;
  amount: number;
  date: string;
}

interface Shift {
  id: number;
  user_name: string;
  closed_at: string;
  expected_amount: number;
  actual_amount: number;
  difference: number;
  sales_count: number;
  deposit_count: number;
  withdraw_count: number;
  status: string;
}

interface TreasurySummary {
  total_balance: number;
  total_cash: number;
  total_e_wallets: number;
  total_banks: number;
}

interface DailySummary {
  income: number;
  expense: number;
  other_expense: number;
  net: number;
}

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function Treasury() {
  const isCashier = !!localStorage.getItem('active_cashier') && localStorage.getItem('admin_active') !== "true";
  const [activeTab, setActiveTab] = useState('all');
  const [modalType, setModalType] = useState<string | null>(null);

  // Transaction form states
  const [txWalletId, setTxWalletId] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txFromWallet, setTxFromWallet] = useState('');
  const [txToWallet, setTxToWallet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (modalType === 'deposit' || modalType === 'withdraw') {
       if (isCashier) {
          const did = localStorage.getItem('takka_active_drawer_id');
          if (did) setTxWalletId(did);
       }
    }
  }, [modalType, isCashier]);

  // States for API data
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  
  // States for Charts
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [flowData, setFlowData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setFormError(null);
    try {
      const token = localStorage.getItem('access_token') || '';
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      
      const isCashierCheck = !!localStorage.getItem('active_cashier') && localStorage.getItem('admin_active') !== "true";
      const activeDrawerId = localStorage.getItem('takka_active_drawer_id');
      
      let branchOrTenantQuery = '';
      if (activeBranchId && activeBranchId !== 'ALL') {
        branchOrTenantQuery = `&branch_id=eq.${activeBranchId}`;
      } else if (tenantId) {
        branchOrTenantQuery = `&tenant_id=eq.${tenantId}`;
      }
      
      let txQuery = branchOrTenantQuery;
      if (isCashierCheck && activeDrawerId) {
        txQuery += `&wallet_id=eq.${activeDrawerId}`;
      }
      
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      // 0. Branches
      let branchesMap: Record<string, string> = {};
      try {
        const branchesRes = await fetch(`${SUPABASE_URL}/rest/v1/branches?select=id,name`, { headers });
        if (branchesRes.ok) {
           const branchesData = await branchesRes.json();
           branchesData.forEach((b: any) => { branchesMap[b.id] = b.name; });
        }
      } catch (e) {
         console.error('Branches fetch error', e);
      }

      // 1. Wallets
      let wData: WalletType[] = [];
      try {
        const wRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=*${branchOrTenantQuery}`, { headers });
        if (wRes.ok) {
           const rawWallets = await wRes.json();
           wData = rawWallets.map((w: any) => ({
              ...w,
              branch_name: w.branch_id ? branchesMap[w.branch_id] : undefined
           }));
           if (isCashierCheck) {
             if (activeDrawerId) {
                wData = wData.filter(w => w.id.toString() === activeDrawerId);
             } else {
                wData = [];
             }
           }
        } else console.error('Wallets error:', await wRes.text());
      } catch (e) {
        console.error('Wallets fetch error', e);
      }

      // 2. Transactions
      let txData: Transaction[] = [];
      try {
         // use created_at for ordering as it's the default supabase column type
         const txRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=*${txQuery}&order=created_at.desc&limit=10`, { headers });
         if (txRes.ok) {
           const rawTx = await txRes.json();
           txData = rawTx.map((tx: any) => {
             let title = tx.category || tx.type;
             if (tx.category === 'installment_collection') title = 'تحصيل قسط';
             if (tx.category === 'installment_penalty') title = 'غرامة تأخير قسط';
             if (tx.category === 'sale') title = 'مبيعات';
             if (tx.category === 'purchase') title = 'مشتريات';
             if (tx.category === 'refund') title = 'مردودات مشتريات';
             if (tx.category && tx.category.includes('إيراد صيانة')) {
                if (tx.description?.includes('عربون') || tx.description?.includes('مقدم')) {
                    title = `عربون صيانة${tx.category.includes('درج') ? ' (بالدرج)' : ''}`;
                } else if (tx.description?.includes('باقي حساب')) {
                    title = `باقي حساب صيانة${tx.category.includes('درج') ? ' (بالدرج)' : ''}`;
                } else {
                    title = `إيرادات صيانة${tx.category.includes('درج') ? ' (بالدرج)' : ''}`;
                }
             }
             if (tx.category === 'مرتجع صيانة' || tx.category === 'مرتجع صيانة - درج') title = `مرتجع صيانة${tx.category.includes('درج') ? ' (بالدرج)' : ''}`;
             
             return {
               ...tx,
               wallet_name: wData.find(w => w.id === tx.wallet_id)?.name || 'محفظة مجهولة',
               title, 
               date: tx.date || tx.created_at
             };
           });
         } else {
           console.error('Transactions error:', await txRes.text());
         }
      } catch (e) {
        console.error('Transactions fetch error', e);
      }

      // 2.5 Fetch Cashiers/Employees
      let usersMap: Record<number, string> = {};
      try {
         const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/app_users?select=id,name,username`, { headers });
         if (usersRes.ok) {
           const users = await usersRes.json();
           users.forEach((u: any) => { usersMap[u.id] = u.name || u.username; });
         }
      } catch (e) { console.error('Users load error', e); }

      // 3. Shifts
      let shData: Shift[] = [];
      try {
        const shRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts?select=*${branchOrTenantQuery}&order=created_at.desc&limit=5`, { headers });
        if (shRes.ok) {
          const rawShifts = await shRes.json();
          shData = rawShifts.map((shift: any) => ({
            id: shift.id,
            user_name: shift.cashier_name ? shift.cashier_name : (shift.employee_id || shift.user_id ? 'كاشير' : 'إدارة النظام'),
            closed_at: shift.end_time || shift.created_at,
            expected_amount: shift.expected_amount || 0,
            actual_amount: shift.actual_amount || 0,
            difference: shift.difference_amount || shift.difference || 0,
            sales_count: shift.sales_count || 0,
            deposit_count: shift.deposits_count || 0,
            withdraw_count: shift.withdrawals_count || 0,
            status: shift.status
          }));
        } else {
          console.error('Shifts error:', await shRes.text());
        }
      } catch (e) {
        console.error('Shifts fetch error', e);
      }

      // 4. Summaries
      const sumData: TreasurySummary = {
        total_balance: wData.reduce((acc, w) => acc + Number(w.balance || 0), 0),
        total_cash: wData.filter(w => w.type === 'cash' || !w.type).reduce((acc, w) => acc + Number(w.balance || 0), 0),
        total_e_wallets: wData.filter(w => w.type === 'e_wallet').reduce((acc, w) => acc + Number(w.balance || 0), 0),
        total_banks: wData.filter(w => w.type === 'bank').reduce((acc, w) => acc + Number(w.balance || 0), 0)
      };

      // 5. Daily Summary
      let dSumData: DailySummary = { income: 0, expense: 0, other_expense: 0, net: 0 };
      try {
        const todayDate = new Date().toISOString().split('T')[0];
        // Try fetching with created_at instead of date
        const dRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=amount,type&created_at=gte.${todayDate}T00:00:00Z${txQuery}`, { headers });
        if (dRes.ok) {
          const todayTxs = await dRes.json();
          let income = 0;
          let expense = 0;
          todayTxs.forEach((tx: any) => {
            if (tx.type === 'in' || tx.type === 'income') income += Number(tx.amount || 0);
            else if (tx.type === 'out' || tx.type === 'expense') expense += Number(tx.amount || 0);
          });
          dSumData = { income, expense, other_expense: 0, net: income - expense };
        } else {
           console.error('Daily Summary error:', await dRes.text());
        }
      } catch (e) {
        console.error('Daily Summary fetch error', e);
      }

      // 6. Chart Data
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const chartRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=amount,type,category,created_at&created_at=gte.${sevenDaysAgo.toISOString()}${txQuery}`, { headers });
        if (chartRes.ok) {
          const chartTxs = await chartRes.json();
          
          // Expenses Pie Chart
          const expensesMap: Record<string, number> = {};
          chartTxs.forEach((tx: any) => {
             if(tx.type === 'out' || tx.type === 'expense') {
                let catName = tx.category || 'أخرى';
                if (catName === 'installment_collection') catName = 'تحصيل قسط';
                if (catName === 'installment_penalty') catName = 'غرامة تأخير قسط';
                if (catName === 'sale') catName = 'مبيعات';
                if (catName === 'purchase') catName = 'مشتريات';
                expensesMap[catName] = (expensesMap[catName] || 0) + Number(tx.amount || 0);
             }
          });
          const generatedExpenses = Object.keys(expensesMap).map((cat, index) => ({
            name: cat,
            value: expensesMap[cat],
            color: ['#a855f7', '#f59e0b', '#3b82f6', '#f43f5e', '#10b981', '#ec4899'][index % 6]
          }));
          setExpensesData(generatedExpenses);

          // Flow Bar Chart
          const daysMap: Record<string, { income: number, expense: number }> = {};
          const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
          
          for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = arabicDays[d.getDay()];
            daysMap[dayName] = { income: 0, expense: 0 };
          }

          chartTxs.forEach((tx: any) => {
            const txDate = new Date(tx.date || tx.created_at);
            const dayName = arabicDays[txDate.getDay()];
            if (daysMap[dayName]) {
              if(tx.type === 'in' || tx.type === 'income') daysMap[dayName].income += Number(tx.amount || 0);
              if(tx.type === 'out' || tx.type === 'expense') daysMap[dayName].expense += Number(tx.amount || 0);
            }
          });

          const generatedFlow = Object.keys(daysMap).map(day => ({
            name: day,
            'إيداعات': daysMap[day].income,
            'مصروفات': daysMap[day].expense
          }));
          setFlowData(generatedFlow);
        }
      } catch (e) {
        console.error('Charts fetch error', e);
      }

      setWallets(wData);
      setTransactions(txData);
      setShifts(shData);
      setSummary(sumData);
      setDailySummary(dSumData);
    } catch (error) {
      console.error('Error loading treasury data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const closeModal = () => {
    setModalType(null);
    setTxWalletId('');
    setTxCategory('');
    setTxAmount('');
    setTxDescription('');
    setTxFromWallet('');
    setTxToWallet('');
    setIsSubmitting(false);
  };

  const handleTransactionSubmit = async () => {
    if (isSubmitting) return;
    setFormError(null);

    const parsedAmount = parseFloat(txAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('الرجاء إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (modalType === 'deposit' || modalType === 'withdraw') {
      if (!txWalletId || !txCategory) {
        setFormError('الرجاء تعبئة جميع الحقول المطلوبة');
        return;
      }
    } else if (modalType === 'transfer') {
      if (!txFromWallet || !txToWallet) {
        setFormError('الرجاء تحديد المحفظتين');
        return;
      }
      if (txFromWallet === txToWallet) {
        alert('لا يمكن التحويل لنفس المحفظة');
        return;
      }
    } else {
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('access_token') || '';
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      if (modalType === 'deposit' || modalType === 'withdraw') {
        const type = modalType === 'deposit' ? 'in' : 'out';
        
        // 1. Insert transaction
        const txRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            wallet_id: Number(txWalletId),
            user_id: userId,
            type,
            amount: parsedAmount,
            category: txCategory,
            description: txDescription
          })
        });

        if (!txRes.ok) {
          const errorData = await txRes.json().catch(() => ({ message: 'فشل تسجيل الحركة' }));
          throw new Error(errorData.message || 'فشل تسجيل الحركة');
        }

        // 2. Update wallet balance
        const targetWallet = wallets.find(w => w.id.toString() === txWalletId);
        if (targetWallet) {
           const newBalance = type === 'in'
              ? Number(targetWallet.balance || 0) + parsedAmount
              : Number(targetWallet.balance || 0) - parsedAmount;
              
           const wUpdateRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${txWalletId}`, {
             method: 'PATCH',
             headers,
             body: JSON.stringify({ balance: newBalance })
           });
           
           if (!wUpdateRes.ok) {
             const errorData = await wUpdateRes.json();
             console.error('Wallet Update Error:', errorData);
           }
        }

        // 3. Update active shift manually 
        try {
           const activeBranchId = localStorage.getItem('takka_active_branch_id');
           const activeDrawerIdStr = localStorage.getItem('takka_active_drawer_id');
           const branchSuffix = activeBranchId && activeBranchId !== 'ALL' ? `&branch_id=eq.${activeBranchId}` : '';
           const shiftRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts?select=*&status=eq.open${branchSuffix}&user_id=eq.${userId}${(() => {
              const cashierStr = localStorage.getItem('active_cashier');
              let cashierFilter = '&cashier_name=is.null';
              if (cashierStr) {
                 try {
                   const c = JSON.parse(cashierStr);
                   if (c && c.role_level !== 1) cashierFilter = `&cashier_name=eq.${encodeURIComponent(c.full_name || c.username || c.name || 'موظف مبيعات')}`;
                   else if (c && c.role_level === 1) cashierFilter = (c.full_name || c.username || c.name) ? `&or=(cashier_name.is.null,cashier_name.eq.${encodeURIComponent(c.full_name || c.username || c.name)})` : `&cashier_name=is.null`;
                 } catch(e) {}
              }
              return cashierFilter;
            })()}&order=created_at.desc&limit=1`, { headers });
           if (shiftRes.ok) {
              const shifts = await shiftRes.json();
              if (shifts && shifts.length > 0) {
                 const activeShift = shifts[0];
                 const patchData: any = {};
                 
                 // If the cashier deposits/withdraws from their own drawer OR we are globally applying
                 const targetWallet = wallets.find((w: any) => w.id.toString() === txWalletId.toString());
                 const isDrawerTx = activeDrawerIdStr ? activeDrawerIdStr === txWalletId : true;
                 
                 if (isDrawerTx) {
                   if (type === 'in') {
                      patchData.deposits_count = Number(activeShift.deposits_count || 0) + 1;
                      if (targetWallet && targetWallet.type === 'cash') {
                         patchData.expected_amount = Number(activeShift.expected_amount || 0) + parsedAmount;
                      }
                   } else {
                      patchData.withdrawals_count = Number(activeShift.withdrawals_count || 0) + 1;
                      if (targetWallet && targetWallet.type === 'cash') {
                         patchData.expected_amount = Number(activeShift.expected_amount || 0) - parsedAmount;
                      }
                   }
                   await fetch(`${SUPABASE_URL}/rest/v1/shifts?id=eq.${activeShift.id}`, {
                      method: 'PATCH',
                      headers,
                      body: JSON.stringify(patchData)
                   });
                 }
              }
           }
        } catch(e) { console.error('Failed to update shift', e); }
      } else if (modalType === 'transfer') {
         // 1. Expense from source
         const res1 = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            wallet_id: Number(txFromWallet),
            user_id: userId,
            type: 'out',
            amount: parsedAmount,
            category: 'تحويل صادرة',
            description: txDescription || 'تحويل رصيد إلى محفظة أخرى'
          })
        });
        if (!res1.ok) {
          const err = await res1.json().catch(() => ({ message: 'فشل تسجيل حركة السحب للتحويل' }));
          throw new Error(err.message || 'فشل تسجيل حركة السحب للتحويل');
        }

        // 2. Income to destination
        const res2 = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            wallet_id: Number(txToWallet),
            user_id: userId,
            type: 'in',
            amount: parsedAmount,
            category: 'تحويل واردة',
            description: txDescription || 'تحويل رصيد من محفظة أخرى'
          })
        });
        if (!res2.ok) {
          const err = await res2.json().catch(() => ({ message: 'فشل تسجيل حركة الإيداع للتحويل' }));
          throw new Error(err.message || 'فشل تسجيل حركة الإيداع للتحويل');
        }

        // 3. Update balances
         const srcWallet = wallets.find(w => w.id.toString() === txFromWallet);
         const dstWallet = wallets.find(w => w.id.toString() === txToWallet);
         
         if (srcWallet) {
           await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${txFromWallet}`, {
             method: 'PATCH',
             headers,
             body: JSON.stringify({ balance: Number(srcWallet.balance || 0) - parsedAmount })
           });
         }
         if (dstWallet) {
           await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${txToWallet}`, {
             method: 'PATCH',
             headers,
             body: JSON.stringify({ balance: Number(dstWallet.balance || 0) + parsedAmount })
           });
         }
         
         // 4. Update shift for transfers (if one of the wallets is the drawer)
         try {
            const activeBranchId = localStorage.getItem('takka_active_branch_id');
            const activeDrawerIdStr = localStorage.getItem('takka_active_drawer_id');
            const branchSuffix = activeBranchId && activeBranchId !== 'ALL' ? `&branch_id=eq.${activeBranchId}` : '';
            
            const cashierStr = localStorage.getItem('active_cashier');
            let cashierFilter = '';
            if (cashierStr) {
               try {
                 const c = JSON.parse(cashierStr);
                 if (c && c.role_level !== 1) {
                    const cName = c.full_name || c.username || c.name || 'موظف مبيعات';
                    cashierFilter = `&cashier_name=eq.${encodeURIComponent(cName)}`;
                 } else {
                    const cName = c ? (c.full_name || c.username || c.name) : null;
                    cashierFilter = cName ? `&or=(cashier_name.is.null,cashier_name.eq.${encodeURIComponent(cName)})` : `&cashier_name=is.null`;
                 }
               } catch(e) {}
            } else { cashierFilter = `&cashier_name=is.null`; }

            const shiftRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts?select=*&status=eq.open${branchSuffix}&user_id=eq.${userId}${cashierFilter}&order=created_at.desc&limit=1`, { headers });
            if (shiftRes.ok) {
               const shifts = await shiftRes.json();
               if (shifts && shifts.length > 0) {
                  const activeShift = shifts[0];
                  const patchData: any = {};
                  let shouldPatch = false;
                  
                  const srcWallet = wallets.find((w: any) => w.id.toString() === txFromWallet.toString());
                  const dstWallet = wallets.find((w: any) => w.id.toString() === txToWallet.toString());
 
                  if (activeDrawerIdStr === txFromWallet) {
                     patchData.withdrawals_count = Number(activeShift.withdrawals_count || 0) + 1;
                     if (srcWallet && srcWallet.type === 'cash') {
                         patchData.expected_amount = Number(activeShift.expected_amount || 0) - parsedAmount;
                     }
                     shouldPatch = true;
                  } else if (activeDrawerIdStr === txToWallet) {
                     patchData.deposits_count = Number(activeShift.deposits_count || 0) + 1;
                     if (dstWallet && dstWallet.type === 'cash') {
                         patchData.expected_amount = Number(activeShift.expected_amount || 0) + parsedAmount;
                     }
                     shouldPatch = true;
                  }
 
                  if (shouldPatch) {
                    await fetch(`${SUPABASE_URL}/rest/v1/shifts?id=eq.${activeShift.id}`, {
                       method: 'PATCH',
                       headers,
                       body: JSON.stringify(patchData)
                    });
                  }
               }
            }
         } catch(e) { console.error('Failed to update shift for transfer', e); }
      }
      
      // Refresh page data
      await loadData();
      closeModal();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'حدث خطأ أثناء تنفيذ العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWallets = activeTab === 'all' 
    ? wallets 
    : wallets.filter(w => {
        if (activeTab === 'كاش') return w.type === 'cash';
        if (activeTab === 'محافظ إلكترونية') return w.type === 'e_wallet';
        if (activeTab === 'بنوك') return w.type === 'bank';
        return true;
      });

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* 1. أزرار الإجراءات العلوية */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setModalType('deposit')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all">
          <Plus className="w-5 h-5" /> إيداع
        </button>
        <button onClick={() => setModalType('withdraw')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all">
          <Minus className="w-5 h-5" /> سحب
        </button>
        <button onClick={() => setModalType('transfer')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all">
          <ArrowLeftRight className="w-5 h-5" /> تحويل
        </button>
        <button onClick={() => setModalType('comprehensive_report')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-all">
          <Menu className="w-5 h-5" /> تقرير شامل
        </button>
        <button onClick={() => setModalType('money_transfers')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-all">
          <RefreshCw className="w-5 h-5" /> تحويلات الأموال
        </button>
      </div>

      {/* 2. المحافظ والحسابات */}
      <div className="space-y-4">
        {isCashier ? (
           <h2 className="text-lg font-bold text-slate-800 dark:text-white">درج الكاشير الحالي</h2>
        ) : (
           <div className="flex flex-col gap-4">
             <h2 className="text-lg font-bold text-slate-800 dark:text-white">المحافظ والحسابات</h2>
             {/* التابات */}
             <div className="flex flex-wrap items-center gap-2">
               {['الكل', 'كاش', 'محافظ إلكترونية', 'بنوك'].map((tab, idx) => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(idx === 0 ? 'all' : tab)}
                   className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                     (activeTab === 'all' && idx === 0) || activeTab === tab
                       ? 'bg-blue-600 text-white' 
                       : 'bg-white dark:bg-[#11151c] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'
                   }`}
                 >
                   {tab}
                 </button>
               ))}
               <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' })) || setTimeout(() => window.dispatchEvent(new CustomEvent('open-settings-tab', { detail: 'wallets' })), 100)} className="px-5 py-2 rounded-lg text-sm font-bold bg-white dark:bg-[#11151c] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all outline-none">
                 إدارة المحافظ
               </button>
             </div>
           </div>
        )}

        {/* بطاقات المحافظ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
               <div className="col-span-full py-4 text-center text-slate-500">جاري التحميل...</div>
            ) : filteredWallets.map(wallet => (
            <div key={wallet.id} className="bg-white dark:bg-[#11151c] rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
              <div className={`p-5 pb-8 relative ${wallet.type === 'cash' ? 'bg-emerald-100 dark:bg-emerald-500/10' : wallet.type === 'e_wallet' ? 'bg-purple-100 dark:bg-purple-500/10' : 'bg-blue-100 dark:bg-blue-500/10'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="w-[85%] flex flex-col items-start gap-1">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight break-words w-full">
                      {wallet.name}
                    </h3>
                    {!localStorage.getItem("takka_active_branch_id") && wallet.branch_name && (
                      <span className="text-[11px] bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300 px-2 py-1 rounded-md leading-tight break-words w-fit inline-block max-w-full">
                        فرع: {wallet.branch_name}
                      </span>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {wallet.type === 'cash' ? 'كاش سائل' : wallet.type === 'e_wallet' ? 'محفظة إلكترونية' : 'حساب بنكي'}
                    </p>
                  </div>
                  {!isCashier && (
                     <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' })) || setTimeout(() => window.dispatchEvent(new CustomEvent('open-settings-tab', { detail: 'wallets' })), 100)} className="text-slate-400 hover:text-slate-600 shrink-0"><Settings className="w-5 h-5" /></button>
                  )}
                </div>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">EGP</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{wallet.balance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50 dark:bg-[#0a0e14]">
                 <button onClick={() => { setModalType('deposit'); setTxWalletId(wallet.id.toString()); }} className="py-2 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg transition-colors">إيداع</button>
                 <button onClick={() => { setModalType('withdraw'); setTxWalletId(wallet.id.toString()); }} className="py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors">سحب</button>
                 <button onClick={() => { setModalType('transfer'); setTxFromWallet(wallet.id.toString()); }} className="py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-colors">تحويل</button>
                 <button onClick={() => { setModalType('comprehensive_report'); setTxWalletId(wallet.id.toString()); }} className="py-2 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white rounded-lg transition-colors">كشف</button>
              </div>
            </div>
            ))}
          </div>
      </div>

      {/* 3. ملخصات الخزينة (بطاقات كبيرة) */}
      {!isCashier && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الخزنة', value: summary?.total_balance.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00', color: 'text-blue-600 dark:text-blue-400' },
            { label: 'إجمالي الكاش', value: summary?.total_cash.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00', color: 'text-emerald-500' },
            { label: 'المحافظ الإلكترونية', value: summary?.total_e_wallets.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00', color: 'text-purple-600 dark:text-purple-400' },
            { label: 'الحسابات البنكية', value: summary?.total_banks.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00', color: 'text-blue-600 dark:text-blue-400' },

          ].map((stat, i) => (
            <div key={i} className="bg-slate-50 dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center">
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{stat.label}</h4>
              <span className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* 4. ملخص حركة اليوم (بطاقات صغيرة) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إيداعات اليوم', value: dailySummary?.income.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00', badge: '↑ دخل', badgeColor: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20', iconColor: 'bg-emerald-100 dark:bg-emerald-500/20' },
            { label: 'مصروفات أخرى', value: dailySummary?.other_expense.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00', badge: null, iconColor: 'bg-orange-100 dark:bg-orange-500/20' },
            { label: 'سحوبات المشتريات', value: dailySummary?.expense.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00', badge: '↓ خرج', badgeColor: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20', iconColor: 'bg-rose-100 dark:bg-rose-500/20' },
            { label: 'صافي اليوم', value: dailySummary?.net.toLocaleString('en-US', {minimumFractionDigits: 2}) || '0.00', badge: null, iconColor: 'bg-purple-100 dark:bg-purple-500/20' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-[#11151c] p-5 rounded-2xl border border-slate-200 dark:border-white/5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.iconColor}`}></div>
                {stat.badge && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${stat.badgeColor}`}>{stat.badge}</span>
                )}
              </div>
              <div className="flex justify-between items-end">
                 <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.label}</span>
                 <span className="text-2xl font-black text-slate-900 dark:text-white" dir="ltr">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

      {/* 5. القوائم والرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* العمود الأيمن (تقفيلات الشفت) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          <div className="bg-slate-50 dark:bg-[#11151c] p-5 rounded-2xl border border-slate-200 dark:border-white/5 flex-1 h-full">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-slate-800 dark:text-white">أحدث تقفيلات الشفت</h3>
               <button onClick={() => setModalType('manage_shift')} className="flex items-center gap-1 text-sm bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors dark:bg-indigo-500/20 dark:text-indigo-300">
                  <Unlock className="w-4 h-4" /> إدارة الوردية
               </button>
            </div>
            
            <button onClick={() => setModalType('shift_closures')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-sm mb-4 transition-colors">
              عرض كل التقفيلات ←
            </button>

            <div className="space-y-3">
              {shifts.map((shift) => (
                <div key={shift.id} className={`p-4 rounded-xl border ${shift.difference >= 0 ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5' : 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5'}`}>
                    <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-white dark:bg-[#1a1f26] shadow-sm p-2 rounded-lg border border-slate-100 dark:border-white/5">
                        <Lock className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        {shift.status === 'open' ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> وردية مفتوحة
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> تم الإغلاق
                          </div>
                        )}
                        <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate max-w-[150px]" title={shift.user_name}>{shift.user_name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1" dir="ltr">{new Date(shift.closed_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short'})}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      {shift.status === 'open' ? (
                         <>
                           <p className="font-black text-slate-400 tracking-tight">--</p>
                           <p className="text-[10px] font-bold text-slate-400">جاري...</p>
                         </>
                      ) : (
                         <>
                           <p className={`font-black tracking-tight ${shift.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{Math.abs(shift.difference).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                           <p className={`text-[10px] font-bold ${shift.difference === 0 ? 'text-emerald-500' : shift.difference > 0 ? 'text-amber-500' : 'text-rose-500'}`}>{shift.difference === 0 ? 'مطابق' : shift.difference > 0 ? '+ زيادة' : '- عجز'}</p>
                         </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm inline-block"></span> {shift.sales_count} مبيعات</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm inline-block"></span> {shift.deposit_count} إيداع</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm inline-block"></span> {shift.withdraw_count} سحب</span>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>

        {/* العمود الأيسر (آخر المعاملات) */}
        <div className="lg:col-span-8 flex flex-col h-[700px] lg:h-auto">
          <div className="bg-slate-50 dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex-1 flex flex-col overflow-hidden">
             <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white">آخر المعاملات</h3>
                <button onClick={() => setModalType('comprehensive_report')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
                  عرض الكل ←
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto pe-2 custom-scrollbar">
               <div className="relative border-s-4 border-blue-600 ps-4 space-y-4 ms-2 py-4">
                 {/* علامات البداية والنهاية للخط */}
                 <div className="absolute -top-2 -start-[9px] text-blue-600">▲</div>
                 <div className="absolute -bottom-2 -start-[9px] text-blue-600">▼</div>

                 {transactions.map((tx) => (
                  <div key={tx.id} className="bg-white dark:bg-[#1a1f26] p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-end">
                        <p className={`font-black font-mono text-lg ${ (tx.type === 'in' || tx.type === 'income') ? 'text-emerald-500' : 'text-rose-500'}`} dir="ltr">{(tx.type === 'in' || tx.type === 'income') ? '+' : '-'}{tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{new Date(tx.date).toLocaleDateString('ar-EG', {month: 'short', day: 'numeric'})}</p>
                      </div>
                    </div>

                    <div className="text-end space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white">{tx.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1"><Building2 className="w-3 h-3"/> {tx.wallet_name || 'محفظة مجهولة'}</p>
                      <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded inline-block">{tx.description}</p>
                    </div>
                    
                    <div className={`w-10 h-10 shrink-0 ms-4 rounded-xl flex items-center justify-center ${(tx.type === 'in' || tx.type === 'income') ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                       {(tx.type === 'in' || tx.type === 'income') ? <TrendingUp className={`w-5 h-5 text-emerald-500`} /> : <Vault className={`w-5 h-5 text-rose-500`} />}
                    </div>
                  </div>
                ))}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* 6. الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* توزيع المصروفات */}
         <div className="bg-slate-50 dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/5">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 text-center lg:text-start">توزيع المصروفات</h3>
            <div className="flex justify-center items-center h-[250px] relative">
               <ResponsiveContainer width="100%" height="100%">
                 {expensesData.length > 0 ? (
                 <PieChart>
                  <Pie
                    data={expensesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {expensesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip wrapperClassName="dark:!bg-[#1a1f26] dark:!border-white/10 dark:!text-white rounded-xl" />
                 </PieChart>
                 ) : (
                   <div className="flex items-center justify-center h-full text-slate-500">لا توجد بيانات مصروفات</div>
                 )}
               </ResponsiveContainer>
               
               {/* Custom Legend */}
               <div className="absolute top-1/2 -translate-y-1/2 end-0 lg:end-10 flex flex-col gap-3">
                 {expensesData.map((item, i) => (
                   <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                     <span className="w-6 h-3 rounded-sm" style={{ backgroundColor: item.color }}></span>
                     {item.name}
                   </div>
                 ))}
               </div>
            </div>
         </div>

         {/* تدفق الأموال */}
         <div className="bg-slate-50 dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/5">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 text-center lg:text-start">تدفق الأموال (آخز 7 أيام)</h3>
            
            <div className="flex justify-center gap-6 mb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                     <span className="w-8 h-3 rounded-sm bg-[#34d399]"></span> إيداعات
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                     <span className="w-8 h-3 rounded-sm bg-[#f87171]"></span> مصروفات
                </div>
            </div>

            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 {flowData.length > 0 ? (
                 <BarChart data={flowData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                   <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Bar dataKey="إيداعات" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   <Bar dataKey="مصروفات" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
                 </BarChart>
                 ) : (
                   <div className="flex items-center justify-center h-full text-slate-500">لا توجد بيانات</div>
                 )}
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* 7. التقارير */}
      <div className="bg-slate-50 dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/5">
        <h3 className="font-bold text-slate-800 dark:text-white mb-6">التقارير</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'daily_report', title: 'تقرير يومي', desc: 'ملخص معاملات اليوم', icon: null },
            { id: 'monthly_report', title: 'تقرير شهري', desc: 'مقارنة الإيرادات والمصروفات', icon: null },
            { id: 'shift_closures', title: 'تقرير التقفيلات', desc: 'سجل كامل لتقفيلات الشفت', icon: null },
            { id: 'period_comparison', title: 'مقارنة الفترات', desc: 'مقارنة الشهر الحالي بالسابق', icon: BarChart3, highlight: true },
          ].map((report, i) => (
            <button key={i} onClick={() => setModalType(report.id)} className={`p-6 rounded-xl border transition-all flex flex-col items-center justify-center text-center gap-3 ${report.highlight ? 'bg-white dark:bg-[#1a1f26] border-slate-200 dark:border-white/10 shadow-sm hover:border-blue-500' : 'bg-transparent border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5'}`}>
              {report.icon && <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center"><report.icon className="w-6 h-6" /></div>}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1">{report.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{report.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>


      {/* ================================== MODALS ================================== */}
      <AnimatePresence>
        {(modalType === 'deposit' || modalType === 'withdraw' || modalType === 'transfer') && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            dir="rtl"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#f0f4f8] dark:bg-[#1a1f26] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10"
            >
              
              {/* Header */}
              <div className="flex justify-between items-center p-5 bg-white dark:bg-[#11151c] border-b border-slate-200 dark:border-white/5">
                <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"><X className="w-6 h-6" /></button>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {modalType === 'deposit' && <>إيداع نقدي <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1 rounded"><Landmark size={20}/></span></>}
                  {modalType === 'withdraw' && <>سحب نقدي <span className="text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-1 rounded"><Landmark size={20}/></span></>}
                  {modalType === 'transfer' && <>تحويل بين المحافظ <span className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 p-1 rounded"><RefreshCw size={20}/></span></>}
                </h2>
              </div>

              {/* Body */}
              <div className="p-6 bg-white dark:bg-[#11151c] space-y-5">
                
                {formError && (
                  <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-bold text-center animate-in fade-in slide-in-from-top-2">
                    {formError}
                  </div>
                )}
                
                {modalType !== 'transfer' ? (
                  <>
                    {/* المحفظة */}
                    {isCashier && localStorage.getItem('takka_active_drawer_id') ? (
                       <div className="space-y-1.5">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 justify-end">المحفظة <span className="text-rose-500">*</span> <Wallet className="w-4 h-4 text-emerald-500"/></label>
                          <div className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-500 flex items-center justify-between">
                            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md">يتم الخصم/الإيداع من الدرج تلقائياً</span>
                            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">درج الكاشير ({wallets.find(w => w.id.toString() === localStorage.getItem('takka_active_drawer_id'))?.name || ''})</div>
                          </div>
                       </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 justify-end">المحفظة <span className="text-rose-500">*</span> <Wallet className="w-4 h-4 text-amber-700"/></label>
                        <div className="relative">
                          <select value={txWalletId} onChange={(e) => setTxWalletId(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-end dir-rtl">
                            <option value="">-- اختر المحفظة --</option>
                            {wallets.map(w => (
                              <option key={w.id} value={w.id}>{w.name} {w.branch_name ? ` - (${w.branch_name})` : ''} - {w.balance} ج.م</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {/* نوع العملية */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 justify-end">
                         {modalType === 'deposit' ? 'نوع الإيداع' : 'نوع السحب'} <span className="text-rose-500">*</span> <FileText className="w-4 h-4 text-amber-500"/>
                      </label>
                      <div className="relative">
                        <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-end dir-rtl">
                          <option value="">-- اختر نوع {modalType === 'deposit' ? 'الإيداع' : 'السحب'} --</option>
                          {modalType === 'deposit' ? (
                            <>
                              <option value="رأس مال (رصيد افتتاحي أو إضافة رأس مال)">رأس مال (رصيد افتتاحي أو إضافة رأس مال) 💰</option>
                              <option value="إيرادات/أرباح (أرباح من خارج النظام)">إيرادات/أرباح (أرباح من خارج النظام) 📈</option>
                              <option value="تحصيل دين (تحصيل من عميل)">تحصيل دين (تحصيل من عميل) 💳</option>
                              <option value="قرض/سلفة مستلمة (التزام)">قرض/سلفة مستلمة (التزام) 🏦</option>
                            </>
                          ) : (
                            <>
                              <option value="سحب شخصي (مسحوبات المالك)">سحب شخصي (مسحوبات المالك) 👤</option>
                              <option value="مصروفات تشغيلية (إيجار، كهرباء، مياه)">مصروفات تشغيلية (إيجار، كهرباء، مياه) 🧾</option>
                              <option value="رواتب (رواتب الموظفين)">رواتب (رواتب الموظفين) 💵</option>
                              <option value="سداد مورد (سداد دين لمورد)">سداد مورد (سداد دين لمورد) 🏭</option>
                              <option value="سداد قرض/سلفة">سداد قرض/سلفة 🏦</option>
                              <option value="تحويل لدرج الكاش (نقطة البيع)">تحويل لدرج الكاش (نقطة البيع) 🗃️</option>
                            </>
                          )}
                        </select>
                        <ChevronDown className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Transfer Specific Fields */}
                     <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 justify-end">من محفظة <span className="text-rose-500">*</span> <span className="text-rose-500 font-bold">↑</span></label>
                      <div className="relative">
                        <select value={txFromWallet} onChange={(e) => setTxFromWallet(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-end dir-rtl">
                           <option value="">-- اختر نوع المحفظة --</option>
                           {wallets.map(w => (
                             <option key={w.id} value={w.id}>{w.name} {w.branch_name ? ` - (${w.branch_name})` : ''} - {w.balance} ج.م</option>
                           ))}
                        </select>
                        <ChevronDown className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex justify-center -my-2 relative z-10">
                       <div className="bg-blue-500 text-white p-1 rounded border-2 border-[#11151c]">
                          <ArrowDown className="w-5 h-5" />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 justify-end">إلى محفظة <span className="text-rose-500">*</span> <span className="text-blue-500 font-bold">↓</span></label>
                      <div className="relative">
                        <select value={txToWallet} onChange={(e) => setTxToWallet(e.target.value)} className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold text-sm appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-end dir-rtl">
                           <option value="">-- اختر نوع المحفظة --</option>
                           {wallets.map(w => (
                             <option key={w.id} value={w.id}>{w.name} {w.branch_name ? ` - (${w.branch_name})` : ''} - {w.balance} ج.م</option>
                           ))}
                        </select>
                        <ChevronDown className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </>
                )}

                {/* المبلغ */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 justify-end">المبلغ <span className="text-rose-500">*</span> 💰</label>
                  <input value={txAmount} onChange={(e) => setTxAmount(e.target.value)} type="number" placeholder="0.00" className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-4 text-center text-slate-800 dark:text-white font-black text-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dir-ltr" />
                </div>

                {/* الوصف */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 justify-end">الوصف / الملاحظات 📝</label>
                  <textarea value={txDescription} onChange={(e) => setTxDescription(e.target.value)} rows={3} placeholder={modalType === 'deposit' ? 'تفاصيل الإيداع (اختياري)...' : modalType === 'withdraw' ? 'تفاصيل السحب (اختياري)...' : 'سبب التحويل (اختياري)...'} className="w-full bg-white dark:bg-[#0a0e14] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none text-end"></textarea>
                </div>

              </div>

              {/* Footer / Actions */}
              <div className="p-5 bg-slate-50 dark:bg-[#11151c] flex items-center justify-end gap-3 border-t border-slate-200 dark:border-white/5">
                <button onClick={closeModal} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  إلغاء
                </button>
                <button disabled={isSubmitting} onClick={handleTransactionSubmit} className={`px-6 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 transition-transform transform active:scale-95 ${
                  modalType === 'deposit' ? 'bg-[#059669] hover:bg-[#047857]' : 
                  modalType === 'withdraw' ? 'bg-[#dc2626] hover:bg-[#b91c1c]' : 
                  'bg-blue-600 hover:bg-blue-700'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 bg-white/20 rounded p-0.5" />}
                  {modalType === 'deposit' ? 'تأكيد الإيداع' : modalType === 'withdraw' ? 'تأكيد السحب' : 'تأكيد التحويل'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ComprehensiveReportModal isOpen={modalType === 'comprehensive_report'} onClose={() => {setModalType(null); setTxWalletId('');}} initialWalletId={txWalletId} />
      <MoneyTransfersReportModal isOpen={modalType === 'money_transfers'} onClose={() => setModalType(null)} />
      <DailyReportModal isOpen={modalType === 'daily_report'} onClose={() => setModalType(null)} />
      <MonthlyReportModal isOpen={modalType === 'monthly_report'} onClose={() => setModalType(null)} />
      <ShiftClosuresReportModal isOpen={modalType === 'shift_closures'} onClose={() => setModalType(null)} />
      <PeriodComparisonModal isOpen={modalType === 'period_comparison'} onClose={() => setModalType(null)} />
      <ShiftManagementModal isOpen={modalType === 'manage_shift'} onClose={() => setModalType(null)} onShiftUpdate={loadData} />

    </div>
  );
}
