import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';
import { useBranch } from '../contexts/BranchContext';
import { PrintMaintenanceReceipt } from './PrintMaintenanceReceipt';
import { PrintMaintenanceReceiptDetailed } from './PrintMaintenanceReceiptDetailed';
import { PrintMaintenanceReceiptSecondDetailed } from './PrintMaintenanceReceiptSecondDetailed';
import { PrintMaintenanceInvoice } from './PrintMaintenanceInvoice';
import { PrintMaintenanceSticker } from './PrintMaintenanceSticker';
import { PrintMaintenanceSticker as PrintMaintenanceStickerFirst } from './PrintMaintenanceStickerfirst';
import { PrintMaintenanceSticker as PrintMaintenanceStickerSecond } from './PrintMaintenanceStickerseconde';
import { PrintMaintenanceSticker as PrintMaintenanceStickerThird } from './PrintMaintenanceStickerthird';
import { useSettings } from '../contexts/SettingsContext';
import {
  Search, Plus, Filter, FileText, CheckCircle2,
  Clock, AlertCircle, X, Loader2, Smartphone,
  User, Phone, Wrench, DollarSign, Calendar,
  ChevronDown, Eye, Edit, Trash2, Receipt, Settings,
  BarChart3, Package, RefreshCw, History, Printer,
  MessageSquare, CreditCard, Lock, Barcode, PenTool, CheckCircle,
  Hourglass, Check, EyeOff, Monitor, Laptop, Tablet, Link, Box, Shield, Type,
  CheckSquare, Zap, FileSpreadsheet, ChevronLeft, ChevronRight, XCircle
} from 'lucide-react';

import AddSparePartModal from './AddSparePartModal';
import ImportMaintenanceExcelModal from './ImportMaintenanceExcelModal';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

const updateSection = (text: string | null, section: string, data: any) => {
  let base = text || '';
  const regex = new RegExp(`\\n?===${section}===\\n[\\s\\S]*?(?=\\n===|$)`, 'g');
  base = base.replace(regex, '');

  if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
    // ensure base ends with newline if not empty, or prepend newline
    const prefix = base && !base.endsWith('\n') ? '\n' : '';
    base += `${prefix}===${section}===\n${JSON.stringify(data)}`;
  }
  return base.trim();
}

const logToCRM = async (repair_id: number, description: string) => {
  try {
    const token = localStorage.getItem('access_token');

    // We log just the repair_id and description without user_id relation mapping because of Foreign Key issues
    let finalDescription = description;

    // Attempt to grab full name of cashier or admin
    let userName = 'مدير النظام';
    const activeCashier = localStorage.getItem('active_cashier');
    if (activeCashier) {
      try {
        const parsed = JSON.parse(activeCashier);
        if (parsed.full_name || parsed.name) userName = parsed.full_name || parsed.name;
      } catch (e) { }
    }

    finalDescription = `${description} (بواسطة: ${userName})`;
    const payload: any = { repair_id, description: finalDescription };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/repair_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Repair Log Error Response:', response.status, await response.text());
    }
  } catch (err) {
    console.error('Failed to log event', err);
  }
};

const processTreasuryTransaction = async (walletId: number | null, amount: number, type: 'in' | 'out', category: string, description: string, branchId: string | null) => {
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  if (!userId) return;

  try {
    if (walletId !== null && !isNaN(walletId)) {
      const wRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${walletId}`, {
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
      });
      if (wRes.ok) {
        const wData = await wRes.json();
        if (wData.length > 0) {
          const currentBalance = Number(wData[0].balance || 0);
          const newBalance = type === 'in' ? currentBalance + Number(amount) : currentBalance - Number(amount);
          await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${walletId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ balance: newBalance })
          });
        }
      }
    }

    await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        user_id: userId,
        wallet_id: walletId,
        amount: amount,
        type: type,
        category: category,
        description: description,
        date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        branch_id: branchId || null
      })
    });
  } catch (e) {
    console.error('Error in processTreasuryTransaction:', e);
  }
};

const addMaintenanceToSalesAndShift = async (amount: number, repairId: any, deviceName: string, customerName: string, paymentMethod: string, isRefund: boolean = false, totalRepairAmount?: number, repairRemainingAmount?: number, repairPaidAmount?: number, repairBranchId?: string) => {
  try {
    const token = localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id');
    const branchId = repairBranchId || localStorage.getItem('takka_active_branch_id');

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
      } catch (e) { }
    } else {
      cashierFilter = `&cashier_name=is.null`;
    }

    // 1. Fetch active shift
    const branchQuery = branchId ? `&branch_id=eq.${branchId}` : '';
    const shiftRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts?status=eq.open${branchQuery}&user_id=eq.${userId}${cashierFilter}&order=created_at.desc&limit=1`, {
      headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
    });
    let activeShift = null;
    if (shiftRes.ok) {
      const shifts = await shiftRes.json();
      if (shifts.length > 0) activeShift = shifts[0];
    }

    const invAmount = isRefund ? -amount : amount;
    const salesInc = isRefund ? 0 : 1;
    let invoiceNumber = '';

    // Attempt to generate a deterministic invoice number based on repair ID and payment
    if (isRefund) {
      invoiceNumber = `M-RET-${Date.now().toString().slice(-6)}-${repairId}`;
    } else {
      invoiceNumber = `MNT-${Date.now().toString().slice(-6)}-${repairId}`;
    }

    const promises = [];

    const computedTotal = totalRepairAmount !== undefined ? totalRepairAmount : Math.abs(amount);
    const computedRemaining = repairRemainingAmount !== undefined ? repairRemainingAmount : 0;
    const computedPaid = repairPaidAmount !== undefined ? repairPaidAmount : Math.abs(amount);

    // First check if an invoice for this repair already exists
    const existingInvoiceRes = await fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?invoice_number=like.*-*${repairId}&limit=1`, {
      headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
    });

    let existingInvoice = null;
    if (existingInvoiceRes.ok) {
      const invData = await existingInvoiceRes.json();
      if (invData && invData.length > 0) {
        existingInvoice = invData[0];
      }
    }

    if (existingInvoice && !isRefund) {
      // Update existing invoice instead of creating a new one to prevent revenue duplication
      const newPaid = repairPaidAmount !== undefined ? repairPaidAmount : Number(existingInvoice.paid_amount || 0) + Math.abs(amount);
      promises.push(
        fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?id=eq.${existingInvoice.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            total_amount: computedTotal,
            net_amount: computedTotal,
            paid_amount: newPaid,
            remaining_amount: computedRemaining,
            status: computedRemaining > 0 ? 'partial' : 'paid'
          })
        })
      );
    } else {
      // Insert into Sales_Invoices
      const invoiceRes = await fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          customer_name: customerName || 'عميل صيانة',
          total_amount: computedTotal,
          net_amount: computedTotal,
          paid_amount: computedPaid,
          remaining_amount: computedRemaining,
          discount: 0,
          status: isRefund ? 'مرتجعة' : (computedRemaining > 0 ? 'partial' : 'paid'),
          payment_method: paymentMethod || 'cash',
          user_id: userId,
          branch_id: branchId || null
        })
      });

      if (invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        if (invoiceData && invoiceData.length > 0) {
          const invoiceId = invoiceData[0].id;
          promises.push(
            fetch(`${SUPABASE_URL}/rest/v1/Sales_Items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                invoice_id: invoiceId,
                product_type: 'device',
                product_name: isRefund ? `استرداد صيانة - ${deviceName || 'جهاز'}` : `أعمال صيانة / دفعة صيانة - ${deviceName || 'جهاز'}`,
                quantity: 1,
                sell_price: computedTotal,
                original_price: 0,
                total_price: computedTotal
              })
            })
          );
        }
      }
    }

    // 3. Patch active shift if exists
    if (activeShift) {
      const patchBody: any = { sales_count: Number(activeShift.sales_count || 0) + salesInc };
      if (paymentMethod === 'cash') {
        patchBody.expected_amount = Number(activeShift.expected_amount || 0) + invAmount;
      }
      promises.push(
        fetch(`${SUPABASE_URL}/rest/v1/shifts?id=eq.${activeShift.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(patchBody)
        })
      );
    }
    await Promise.all(promises);
  } catch (e) {
    console.error('Error syncing maintenance with sales/shift', e);
  }
};

export default function Maintenance() {
  const { branches } = useBranch();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Shift tracking states
  const [closedCollections, setClosedCollections] = useState(0);
  const [closedRevenue, setClosedRevenue] = useState(0);

  // Modals state
  const [isNewRepairModalOpen, setIsNewRepairModalOpen] = useState(false);
  const [isDailyCloseModalOpen, setIsDailyCloseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [repairToDelete, setRepairToDelete] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    fetchRepairs();
  }, []);

  useEffect(() => {
    if (selectedRepair && isViewModalOpen) {
      const updatedRepair = repairs.find(r => r.id === selectedRepair.id);
      if (updatedRepair && JSON.stringify(updatedRepair) !== JSON.stringify(selectedRepair)) {
        setSelectedRepair(updatedRepair);
      }
    }
  }, [repairs, isViewModalOpen]);

  const fetchRepairs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const activeBranchId = localStorage.getItem('takka_active_branch_id');
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      let repairsUrl = `${SUPABASE_URL}/rest/v1/Repairs?select=*,receiving_branch:branches!receiving_branch_id(name)&order=id.desc&limit=1000`;

      if (activeBranchId) {
        repairsUrl += `&receiving_branch_id=eq.${activeBranchId}`;
      } else if (tenantId) {
        repairsUrl += `&tenant_id=eq.${tenantId}`;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const tenantQuery = activeBranchId && activeBranchId !== 'ALL' ? `branch_id.eq.${activeBranchId},branch_id.is.null` : `user_id.eq.${tenantId}`;
      let repairsData = [];
      let txData = [];

      try {
        let hasMore = true;
        let lastId = null;
        let totalFetched = 0;
        const pageSize = 1000;

        while (hasMore) {
          const fetchUrl = lastId ? `${repairsUrl}&id=lt.${lastId}` : repairsUrl;
          const repairsRes = await fetch(fetchUrl, {
            headers: {
              'apikey': API_KEY,
              'Authorization': `Bearer ${token}`
            }
          });
          if (repairsRes.ok) {
            const data = await repairsRes.json();
            repairsData = [...repairsData, ...data];
            totalFetched += data.length;
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              lastId = data[data.length - 1].id;
              // Add a hard limit to avoid infinite loops if it exceeds 30000 records
              if (totalFetched >= 30000) hasMore = false;
            }
          } else {
            console.error('Failed to fetch repairs', await repairsRes.text());
            alert('تعذر جلب جميع التذاكر من الخادم. يرجى محاولة تحديث الصفحة (Timeout in pagination).');
            hasMore = false;
          }
        }
      } catch (err) {
        console.error('Repairs fetch error', err);
      }

      try {
        const txRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=amount,category,type&or=(${tenantQuery})&category=in.(${encodeURIComponent('"إيراد صيانة - درج","مرتجع صيانة - درج"')})&created_at=gte.${todayIso}&limit=2000`, {
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          }
        });
        if (txRes.ok) {
          txData = await txRes.json();
        }
      } catch (err) {
        console.error('TX fetch error', err);
      }

      setRepairs(repairsData);

      let currentShiftColl = 0;
      txData.forEach((tx: any) => {
        if (tx.category === 'مرتجع صيانة - درج' || tx.type === 'out') {
          currentShiftColl -= Number(tx.amount || 0);
        } else {
          currentShiftColl += Number(tx.amount || 0);
        }
      });
      setClosedCollections(currentShiftColl);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const shiftCollected = closedCollections; // repurposed state to hold live current shift cash
  const todayRepairs = repairs.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString());
  const shiftRevenue = todayRepairs.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

  const confirmDeleteRepair = async () => {
    if (!repairToDelete) return;

    const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevel = actCashier?.role_level || 3;
    const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
    const specialPerms = actCashier?.permissions?.special || [];

    if (!isOwnerAct && !specialPerms.includes('حذف البيانات')) {
      alert('ليس لديك صلاحية لحذف تذاكر الصيانة (مطلوب صلاحية حذف البيانات)');
      setRepairToDelete(null);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');

      // Return parts quantity
      let partsToReturn: any[] = [];
      const notes = repairToDelete.notes || '';
      const partsMatch = notes.match(/\n?===PARTS===\n([\s\S]*?)(?=\n===|$)/);
      if (partsMatch) {
        try {
          partsToReturn = JSON.parse(partsMatch[1]);
        } catch (e) { }
      }

      const promises = [];

      for (const pt of partsToReturn) {
        if (pt.id && pt.status !== 'تالف') {
          const partRes = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts?id=eq.${pt.id}&select=quantity`, {
            headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
          });
          if (partRes.ok) {
            const pData = await partRes.json();
            if (pData.length > 0) {
              const currentQty = pData[0].quantity || 0;
              promises.push(
                fetch(`${SUPABASE_URL}/rest/v1/spare_parts?id=eq.${pt.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ quantity: currentQty + Number(pt.quantity || 1) })
                })
              );
            }
          }
        }
      }

      let paymentsToRefund: any[] = [];
      const paymentsMatch = notes.match(/\n?===PAYMENTS===\n([\s\S]*?)(?=\n===|$)/);
      if (paymentsMatch) {
        try {
          paymentsToRefund = JSON.parse(paymentsMatch[1]);
        } catch (e) { }
      }

      const userId = localStorage.getItem('user_id');

      if (repairToDelete.status !== 'مرتجع / تم الاسترداد') {
        for (const pmt of paymentsToRefund) {
          if (pmt.amount && Number(pmt.amount) > 0) {
            let targetWalletId = pmt.wallet_id || pmt.method;
            if (isNaN(Number(targetWalletId))) {
              targetWalletId = null;
            } else {
              targetWalletId = Number(targetWalletId);
            }

            promises.push(
              processTreasuryTransaction(
                targetWalletId,
                pmt.amount,
                'out',
                'مرتجع صيانة - درج',
                `استرداد دفعة (حذف تذكرة صيانة رقم #${repairToDelete.id}) - الهاتف: ${repairToDelete.device_name || ''}`,
                repairToDelete.receiving_branch_id || repairToDelete.branch_id || localStorage.getItem('takka_active_branch_id') || null
              )
            );
          }
        }
      }

      await Promise.all(promises);

      await fetch(`${SUPABASE_URL}/rest/v1/repair_logs?repair_id=eq.${repairToDelete.id}`, {
        method: 'DELETE',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
      });

      const delRes = await fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repairToDelete.id}`, {
        method: 'DELETE',
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
      });

      if (!delRes.ok) {
        throw new Error("Unable to delete repair.");
      }

      setRepairToDelete(null);
      fetchRepairs();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تم التسليم': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'تحت الصيانة': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'مستلم': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'قيد الانتظار': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getTicketId = (r: any) => {
    return r.id ? `R-${new Date(r.created_at || Date.now()).getFullYear()}${(new Date(r.created_at || Date.now()).getMonth() + 1).toString().padStart(2, "0")}-${r.id.toString().padStart(5, "0")}` : "R-NEW";
  };

  const filteredRepairs = repairs.filter(r => {
    const matchesSearch =
      r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer_phone?.includes(searchTerm) ||
      r.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id?.toString().includes(searchTerm) ||
      getTicketId(r).toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchTerm.includes(r.id?.toString()); // in case they scan 202610123

    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'not_delivered') return r.status !== 'تم التسليم' && r.status !== 'مرتجع / تم الاسترداد';
    if (activeFilter === 'ready') return r.status === 'جاهز';
    if (activeFilter === 'rejected') return r.status === 'مرفوض';
    if (activeFilter === 'in_progress') return r.status === 'تحت الصيانة';
    if (activeFilter === 'received_pending') return r.status === 'مستلم' || r.status === 'قيد الانتظار';
    if (activeFilter === 'delivered') return r.status === 'تم التسليم' || r.status === 'مرتجع / تم الاسترداد';
    return true;
  });

  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);
  const paginatedRepairs = filteredRepairs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">إجمالي التذاكر</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{repairs.length}</h3>
          </div>
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">جاهز للتسليم</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{repairs.filter(r => r.status === 'جاهز').length}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">تحصيلات الشيفت</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {shiftCollected.toFixed(2)} <span className="text-sm text-slate-500">ج.م</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">إيراد الشيفت</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {shiftRevenue.toFixed(2)} <span className="text-sm text-slate-500">ج.م</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsNewRepairModalOpen(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-[0_0_15px_rgba(20,184,166,0.2)]"
          >
            <Plus className="w-4 h-4" /> استلام جديد
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> استيراد إكسيل
          </button>
          <button
            onClick={() => setIsDailyCloseModalOpen(true)}
            className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Calendar className="w-4 h-4" /> تقفيل اليومية
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <DollarSign className="w-4 h-4" /> استلام دفعة
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث برقم التذكرة، العميل، الهاتف، الجهاز..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>
          <button className="p-2.5 bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-2 gap-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'not_delivered', label: 'في المحل (لم تسلم)' },
          { id: 'ready', label: 'جاهز للتسليم' },
          { id: 'rejected', label: 'مرفوض' },
          { id: 'in_progress', label: 'تحت الصيانة' },
          { id: 'received_pending', label: 'مستلم / قيد الانتظار' },
          { id: 'delivered', label: 'سلم للعميل / مرتجع' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => { setActiveFilter(filter.id); setCurrentPage(1); }}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeFilter === filter.id ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">رقم التذكرة</th>
                <th className="px-6 py-4 font-medium">اسم العميل</th>
                <th className="px-6 py-4 font-medium">الجهاز</th>
                <th className="px-6 py-4 font-medium">الفرع</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">الفني</th>
                <th className="px-6 py-4 font-medium">تاريخ الاستلام</th>
                <th className="px-6 py-4 font-medium text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-teal-500" />
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : paginatedRepairs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                        <Wrench className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">لا توجد أجهزة في الصيانة</h3>
                      <p className="text-slate-500 max-w-sm mx-auto">
                        لم يتم العثور على أي أجهزة مسجلة في الصيانة في الوقت الحالي، قم بتسجيل استلام جهاز جديد للبدء.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRepairs.map((repair) => (
                  <tr key={repair.id} className="hover:bg-slate-50 dark:hover:bg-white/5 dark:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      R-{new Date(repair.created_at).getFullYear()}{new Date(repair.created_at).getMonth() + 1}-{repair.id.toString().padStart(5, '0')}#
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{repair.customer_name || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {repair.device_name || '-'}
                      {(() => {
                        const locMatch = repair.notes ? repair.notes.match(/📍 مكان الجهاز:\s*([^\n]*)/) : null;
                        const fallbackMatch = repair.notes ? repair.notes.match(/📍 مکان الجهاز:\s*([^\n]*)/) : null;
                        const loc = locMatch ? locMatch[1].trim() : (fallbackMatch ? fallbackMatch[1].trim() : null);
                        return loc ? <div className="text-xs text-blue-500 font-bold mt-1.5 flex items-center gap-1"><span className="text-[10px]">📍</span> {loc}</div> : null;
                      })()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{repair.receiving_branch?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(repair.status)}`}>
                        {repair.status || 'قيد الانتظار'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{repair.technician_name || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400" dir="ltr">
                      {new Date(repair.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRepair(repair);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center gap-1 px-3"
                        >
                          <Eye className="w-4 h-4" /> فتح
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => setRepairToDelete(repair)}
                          className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors flex items-center gap-1 px-3 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" /> حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              إجمالي التذاكر: {filteredRepairs.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="px-4 py-2 rounded-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-white">
                الصفحة {currentPage} من {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ImportMaintenanceExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchRepairs}
        branchId={localStorage.getItem('takka_active_branch_id')}
        branches={branches}
      />

      <NewRepairModal
        isOpen={isNewRepairModalOpen}
        onClose={() => setIsNewRepairModalOpen(false)}
        onSuccess={fetchRepairs}
      />

      <ViewRepairModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRepair(null);
        }}
        repair={selectedRepair}
        onSuccess={fetchRepairs}
      />

      <DailyCloseModal
        isOpen={isDailyCloseModalOpen}
        onClose={() => setIsDailyCloseModalOpen(false)}
        repairs={repairs}
        closedCollections={closedCollections}
        shiftRevenue={shiftRevenue}
        onSuccess={fetchRepairs}
      />

      <ReceivePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        repairs={repairs}
        onSuccess={fetchRepairs}
      />

      <AnimatePresence>
        {repairToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setRepairToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1a1f2e] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8 flex-shrink-0" />
                </div>

                <h2 className="text-xl font-black text-slate-900 dark:text-white text-center mb-6">
                  ⚠️ حذف تذكرة نهائياً
                </h2>

                <div className="bg-slate-50 dark:bg-[#11151c] rounded-2xl p-4 mb-6 space-y-2 border border-slate-200 dark:border-white/5 font-mono text-sm dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">التذكرة:</span>
                    <span className="font-bold flex-1 text-left">#{repairToDelete.id?.toString().padStart(6, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">العميل:</span>
                    <span className="font-bold flex-1 text-left truncate px-2">{repairToDelete.customer_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الجهاز:</span>
                    <span className="font-bold flex-1 text-left truncate px-2">{repairToDelete.device_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الحالة:</span>
                    <span className="font-bold flex-1 text-left">{repairToDelete.status}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 mt-2 pt-2 border-t border-slate-200 dark:border-white/5">
                    <span>التكلفة:</span>
                    <span className="font-black">{repairToDelete.total_amount || 0} ج.م</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <p className="text-slate-600 dark:text-slate-400 font-bold text-sm leading-relaxed">
                    سيتم:
                    <br />• حذف التذكرة وكل بياناتها نهائياً
                    <br />• استرجاع المدفوعات للمحافظ (يجب مراجعة الخزينة)
                    <br />• إعادة القطع المستهلكة للمخزون
                  </p>
                  <p className="text-rose-600 dark:text-rose-400 font-black text-sm text-center bg-rose-50 dark:bg-rose-500/10 py-2 rounded-lg">
                    هذا الإجراء لا يمكن التراجع عنه!
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={confirmDeleteRepair}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-4 py-4 rounded-xl text-lg font-black transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-rose-500/20"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'حذف نهائي'}
                  </button>
                  <button
                    onClick={() => setRepairToDelete(null)}
                    disabled={isLoading}
                    className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 px-4 py-4 rounded-xl text-lg font-bold transition-all disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==========================================
// View/Edit Repair Modal Component
// ==========================================
function ViewRepairModal({ isOpen, onClose, repair, onSuccess }: { isOpen: boolean, onClose: () => void, repair: any, onSuccess: () => void | Promise<void> }) {
  const { settings } = useSettings();
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const barcodePrintRef = useRef<HTMLDivElement>(null);

  const executePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: 'Receipt',
    pageStyle: `@page { margin: 0; } @media print { body { margin: 0; } }`,
  });

  const executePrintInvoice = useReactToPrint({
    contentRef: invoicePrintRef,
    documentTitle: 'Invoice',
    pageStyle: `@page { margin: 0; } @media print { body { margin: 0; } }`,
  });

  const barcodeWidth = settings?.barcodeWidth || '50mm';
  const barcodeHeight = settings?.barcodeHeight || '30mm';

  const executePrintBarcode = useReactToPrint({
    contentRef: barcodePrintRef,
    documentTitle: 'Barcode',
    pageStyle: `@page { size: ${settings?.barcodeWidth || '50mm'} ${settings?.barcodeHeight || '30mm'}; margin: 0; } @media print { body { margin: 0; } }`,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const [activeTab, setActiveTab] = useState('details'); // details, status, financial, parts, history
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [imei, setImei] = useState('');
  const [devicePassword, setDevicePassword] = useState('');
  const [deviceLocation, setDeviceLocation] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [issue, setIssue] = useState('');

  const [statusNote, setStatusNote] = useState('');
  const [manualStatus, setManualStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [directPartName, setDirectPartName] = useState('');
  const [directPartCost, setDirectPartCost] = useState('');
  const [directPartPrice, setDirectPartPrice] = useState('');
  const [directPartQty, setDirectPartQty] = useState('1');
  const [directPartWalletId, setDirectPartWalletId] = useState('');

  const actCashierCheck = JSON.parse(localStorage.getItem('active_cashier') || '{}');
  const roleLevelCheck = actCashierCheck?.role_level || 3;
  const isOwnerActCheck = localStorage.getItem('admin_active') === 'true' || roleLevelCheck === 1;
  const specialPermsCheck = actCashierCheck?.permissions?.special || [];
  const hasEditPerm = isOwnerActCheck || specialPermsCheck.includes('تعديل البيانات');
  const canEditData = status !== 'تم التسليم' || hasEditPerm;

  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);

  const [availableParts, setAvailableParts] = useState<any[]>([]);
  const [searchPart, setSearchPart] = useState('');
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);
  const [partQuantity, setPartQuantity] = useState('1');
  const [selectedPart, setSelectedPart] = useState<any | null>(null);

  // Parse parts from notes if any
  const [repairParts, setRepairParts] = useState<any[]>([]);

  // Refund and Edit Ticket States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editReason, setEditReason] = useState('');

  const [isRefundMode, setIsRefundMode] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundWalletId, setRefundWalletId] = useState('');
  const [isConfirmRefundModalOpen, setIsConfirmRefundModalOpen] = useState(false);
  const [returnPartsToStock, setReturnPartsToStock] = useState(true);

  // Withdraw Payment States
  const [isWithdrawPaymentMode, setIsWithdrawPaymentMode] = useState(false);
  const [withdrawPaymentAmount, setWithdrawPaymentAmount] = useState('');
  const [withdrawPaymentWalletId, setWithdrawPaymentWalletId] = useState('');
  const [withdrawPaymentReason, setWithdrawPaymentReason] = useState('');

  // Reject Ticket States
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [inspectionFee, setInspectionFee] = useState(0);
  const [rejectWalletId, setRejectWalletId] = useState('');
  const [markAsHandedOver, setMarkAsHandedOver] = useState(true);


  // Cost edit state
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [customMaintenanceCost, setCustomMaintenanceCost] = useState('');

  const handleAddDirectPart = async () => {
    if (!directPartName || !directPartPrice) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');

      const partSku = 'DIR-' + Date.now().toString().slice(-6);
      const newSparePart = {
        name: directPartName,
        sku: partSku,
        quantity: 0,
        sell_price: Number(directPartPrice),
        cost_price: Number(directPartCost),
        category: 'صيانة مباشرة',
        barcode: partSku,
        barcode_type: 'CODE128',
        min_quantity: 1,
        tax: 0,
        supplier: 'صيانة مباشرة',
        entry_type: 'purchase',
        status: 'active',
        user_id: tenantId,
        tenant_id: tenantId
      };

      const partRes = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newSparePart)
      });

      let realPartId = 'direct-' + Date.now();
      if (partRes.ok) {
        const insertedPart = await partRes.json();
        if (insertedPart && insertedPart.length > 0) {
          realPartId = insertedPart[0].id;
        }
      }

      const newPartReserved = {
        id: realPartId,
        name: directPartName,
        sku: partSku,
        quantity: Number(directPartQty),
        price: Number(directPartPrice),
        cost: Number(directPartCost),
        total: Number(directPartPrice) * Number(directPartQty),
        date: new Date().toISOString(),
        status: 'محجوز (مباشر)'
      };
      const newRepairParts = [...repairParts, newPartReserved];

      let finalNotes = repair.notes || '';
      let cleanText = finalNotes.split('\n===')[0];
      cleanText = cleanText.split('\n').filter((l: string) => !l.includes('كلمة المرور') && !l.includes('مکان الجهاز:') && !l.includes('مكان الجهاز:')).join('\n');
      if (devicePassword) cleanText += (cleanText ? '\n' : '') + `🔒 كلمة المرور ${devicePassword}`;
      if (deviceLocation) cleanText += (cleanText ? '\n' : '') + `📍 مكان الجهاز: ${deviceLocation}`;
      finalNotes = cleanText;
      finalNotes = updateSection(finalNotes, 'PARTS', newRepairParts);
      finalNotes = updateSection(finalNotes, 'DISCOUNT', { type: discountType, value: discountValue });
      finalNotes = updateSection(finalNotes, 'PAYMENTS', paymentsList);

      await fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes: finalNotes })
      });

      if (directPartWalletId) {
        await processTreasuryTransaction(Number(directPartWalletId), Number(directPartCost) * Number(directPartQty), 'out', 'مشتريات قطع غيار صيانة', `شراء قطعة مباشرة للصيانة: ${directPartName} - تذكرة #${repair.id}`, repair.receiving_branch_id || repair.branch_id || null);
      }

      logToCRM(repair.id, `شراء وإضافة قطعة مباشرة: ${directPartName}`);
      setRepairParts(newRepairParts);
      setIsAddPartModalOpen(false);
      await onSuccess();
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleUpdateCost = async (previousPartsSum: number) => {
    if (!customMaintenanceCost || isNaN(Number(customMaintenanceCost))) return;
    const newTotalAmount = Number(customMaintenanceCost) + previousPartsSum;

    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ total_amount: newTotalAmount })
      });

      if (res.ok) {
        repair.total_amount = newTotalAmount;
        setIsEditingCost(false);
        await onSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=*&limit=50`, {
          headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          let data = await response.json();
          if (searchPart.trim().length > 0) {
            data = data.filter((p: any) =>
              (p.name && p.name.toLowerCase().includes(searchPart.toLowerCase())) ||
              (p.sku && p.sku.toLowerCase().includes(searchPart.toLowerCase()))
            );
          }
          setAvailableParts(data.slice(0, 15));
        } else {
          console.error('API Error:', await response.text());
        }
      } catch (e) { console.error(e); }
    };

    if (isPartDropdownOpen || searchPart) {
      const timer = setTimeout(fetchParts, searchPart ? 300 : 0);
      return () => clearTimeout(timer);
    } else {
      setAvailableParts([]);
    }
  }, [searchPart, isPartDropdownOpen]);

  // Barcode scanning effect handler
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    if (!isOpen || activeTab !== 'parts') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input text field (unless it's the search input, but we prefer catching globally)
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      const now = Date.now();
      if (now - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }

      if (e.key === 'Enter' && barcodeBuffer.current.length >= 3) {
        const code = barcodeBuffer.current;
        barcodeBuffer.current = '';

        const fetchAndSelect = async () => {
          try {
            const token = localStorage.getItem('access_token');
            const searchCode = encodeURIComponent(code);
            // search by sku (barcode)
            const response = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=*&or=(sku.eq.${searchCode},name.ilike.*${searchCode}*)`, {
              headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
              const data = await response.json();
              if (data && data.length > 0) {
                const part = data[0];
                if (part.quantity > 0) {
                  setSelectedPart(part);
                  setSearchPart(part.name);
                  setAvailableParts([]);
                  setIsPartDropdownOpen(false);
                } else {
                  alert(`القطعة المطابقة للباركود غير متوفرة: ${part.name}`);
                }
              }
            }
          } catch (e) { }
        };
        fetchAndSelect();

        if (isInputFocused && target.id === 'part_search_input') {
          e.preventDefault();
        }
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
      lastKeyTime.current = now;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab]);


  const handleReservePart = async () => {
    if (!selectedPart || Number(partQuantity) <= 0) return;
    if (selectedPart.quantity < Number(partQuantity)) {
      alert('الكمية المطلوبة غير متوفرة');
      return;
    }

    const { subTotal, discountAmount } = getFinancialTotals();
    const cashierStr = localStorage.getItem('active_cashier');
    let maxDiscountLimit = 0;
    let isManager = localStorage.getItem('admin_active') === 'true';
    if (cashierStr && !isManager) {
      try {
        const cashier = JSON.parse(cashierStr);
        let perms = cashier.permissions || {};
        if (typeof perms === 'string') {
          try { perms = JSON.parse(perms); } catch (e) { }
        }
        maxDiscountLimit = Number(perms.maxDiscount || 0);
      } catch (e) {
        console.error(e);
      }
    }
    const appliedDiscountPercentage = subTotal > 0 ? (discountAmount / subTotal) * 100 : 0;
    if (maxDiscountLimit > 0 && appliedDiscountPercentage > maxDiscountLimit) {
      alert(`عذراً، الحد الأقصى للخصم المسموح لك به هو ${maxDiscountLimit}%`);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      // Add to local state first
      const newPartReserved = {
        id: selectedPart.id,
        name: selectedPart.name,
        sku: selectedPart.sku,
        quantity: Number(partQuantity),
        price: selectedPart.sell_price,
        cost: selectedPart.cost_price,
        total: selectedPart.sell_price * Number(partQuantity),
        date: new Date().toISOString(),
        status: 'محجوز'
      };

      const newRepairParts = [...repairParts, newPartReserved];

      // Update Repair Notes
      let finalNotes = repair.notes || '';
      let cleanText = finalNotes.split('\n===')[0];
      cleanText = cleanText.split('\n').filter((l: string) => !l.includes('كلمة المرور') && !l.includes('مکان الجهاز:') && !l.includes('مكان الجهاز:')).join('\n');
      if (devicePassword) {
        cleanText += (cleanText ? '\n' : '') + `🔒 كلمة المرور ${devicePassword}`;
      }
      if (deviceLocation) {
        cleanText += (cleanText ? '\n' : '') + `📍 مكان الجهاز: ${deviceLocation}`;
      }
      finalNotes = cleanText;
      finalNotes = updateSection(finalNotes, 'PARTS', newRepairParts);
      finalNotes = updateSection(finalNotes, 'DISCOUNT', { type: discountType, value: discountValue });
      finalNotes = updateSection(finalNotes, 'PAYMENTS', paymentsList);

      const [notesRes, stockRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ notes: finalNotes })
        }),
        // Decrement stock
        fetch(`${SUPABASE_URL}/rest/v1/spare_parts?id=eq.${selectedPart.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ quantity: selectedPart.quantity - Number(partQuantity) })
        })
      ]);

      if (notesRes.ok && stockRes.ok) {
        logToCRM(repair.id, `إضافة إضافة/حجز قطعة غيار: ${selectedPart.name} (كمية ${partQuantity})`);
        fetchHistory();
        setRepairParts(newRepairParts);
        setSelectedPart(null);
        setSearchPart('');
        setPartQuantity('1');
        await onSuccess(); // Refresh list behind
      } else {
        alert('حدث خطأ أثناء الاتصال بالخادم.');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPart = async (idx: number, rp: any, isDamaged: boolean) => {
    const actCashierCheck = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevelCheck = actCashierCheck?.role_level || 3;
    const isOwnerActCheck = localStorage.getItem('admin_active') === 'true' || roleLevelCheck === 1;
    const specialPermsCheck = actCashierCheck?.permissions?.special || [];

    if (!isOwnerActCheck && !specialPermsCheck.includes('مرتجع الصيانة')) {
      alert('ليس لديك صلاحية لتعديل البيانات (مطلوب صلاحية "مرتجع الصيانة")');
      return;
    }

    const { subTotal, discountAmount } = getFinancialTotals();
    const cashierStr = localStorage.getItem('active_cashier');
    let maxDiscountLimit = 0;
    let isManager = localStorage.getItem('admin_active') === 'true';
    if (cashierStr && !isManager) {
      try {
        const cashier = JSON.parse(cashierStr);
        let perms = cashier.permissions || {};
        if (typeof perms === 'string') {
          try { perms = JSON.parse(perms); } catch (e) { }
        }
        maxDiscountLimit = Number(perms.maxDiscount || 0);
      } catch (e) { }
    }
    const appliedDiscountPercentage = subTotal > 0 ? (discountAmount / subTotal) * 100 : 0;
    if (maxDiscountLimit > 0 && appliedDiscountPercentage > maxDiscountLimit) {
      alert(`عذراً، الحد الأقصى للخصم المسموح لك به هو ${maxDiscountLimit}%`);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');

      const newRepairParts = repairParts.filter((_, i) => i !== idx);

      let finalNotes = repair.notes || '';
      let cleanText = finalNotes.split('\n===')[0];
      cleanText = cleanText.split('\n').filter((l: string) => !l.includes('كلمة المرور') && !l.includes('مکان الجهاز:') && !l.includes('مكان الجهاز:')).join('\n');
      if (devicePassword) {
        cleanText += (cleanText ? '\n' : '') + `🔒 كلمة المرور ${devicePassword}`;
      }
      if (deviceLocation) {
        cleanText += (cleanText ? '\n' : '') + `📍 مكان الجهاز: ${deviceLocation}`;
      }
      finalNotes = cleanText;
      finalNotes = updateSection(finalNotes, 'PARTS', newRepairParts);
      finalNotes = updateSection(finalNotes, 'DISCOUNT', { type: discountType, value: discountValue });
      finalNotes = updateSection(finalNotes, 'PAYMENTS', paymentsList);

      const promises = [
        fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ notes: finalNotes })
        })
      ];

      // If it's cancelled (not damaged), we restock it
      if (!isDamaged && rp.id && !String(rp.id).startsWith('direct-')) {
        // We need to fetch current quantity first to be safe, but since Supabase doesn't have native increment over API easily without RPC, 
        // we assume we can fetch it or just use an RPC if exists. For now we will fetch then update.
        const partRes = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts?id=eq.${rp.id}&select=quantity`, {
          headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
        });
        if (partRes.ok) {
          const partData = await partRes.json();
          if (partData.length > 0) {
            const currentQty = partData[0].quantity || 0;
            promises.push(fetch(`${SUPABASE_URL}/rest/v1/spare_parts?id=eq.${rp.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY,
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ quantity: currentQty + Number(rp.quantity || 1) })
            } as any));
          }
        }
      }

      await Promise.all(promises);

      logToCRM(repair.id, isDamaged ? `تسجيل قطعة كتالف: ${rp.name}` : `إلغاء جزء محجوز للصيانة: ${rp.name}`);
      fetchHistory();

      setRepairParts(newRepairParts);
      await onSuccess();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  const [repairHistory, setRepairHistory] = useState<any[]>([]);

  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [availableWallets, setAvailableWallets] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchWallets = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const userId = localStorage.getItem('user_id');
          const activeBranchId = localStorage.getItem('takka_active_branch_id');
          const repairBranchId = repair?.receiving_branch_id || repair?.branch_id;
          const queryBranch = repairBranchId || activeBranchId;
          const tenantId = localStorage.getItem('tenant_id') || userId;
          const tenantQuery = `tenant_id=eq.${tenantId}`;
          const branchQuery = queryBranch ? `&branch_id=eq.${queryBranch}` : '';
          const headers = { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` };
          const res = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=*,branches(name)&${tenantQuery}${branchQuery}&order=is_default.desc,id.asc`, { headers });
          if (res.ok) {
            let data = await res.json();
            data = data.map((w: any) => ({
              ...w,
              name: w.branches && w.branches.name ? `${w.name} - (${w.branches.name})` : w.name
            }));
            setAvailableWallets(data);
            // Set default wallet if list is not empty
            if (data.length > 0) {
              setSelectedWalletId(data[0].id.toString());
              setRefundWalletId(data[0].id.toString());
            }
          }
        } catch (e) { }
      };
      fetchWallets();
    }
  }, [isOpen]);

  const prevRepairIdRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (repair && isOpen) {
      if (prevRepairIdRef.current !== repair.id) {
        setActiveTab('details');
        setEditingSection(null);
        setStatusNote('');
        setPaymentAmount('');
        setPaymentMethod('cash');
        setPaymentNote('');
        setIsRefundMode(false);
        setRefundReason('');
        prevRepairIdRef.current = repair.id;
      }

      setStatus(repair.status || 'قيد الانتظار');
      setManualStatus(repair.status || 'قيد الانتظار');

      setCustomerName(repair.customer_name || '');
      setCustomerPhone(repair.customer_phone || '');
      setDeviceName(repair.device_name || '');
      setImei(repair.imei || '');
      setTechnicianName(repair.technician_name || '');
      setIssue(repair.issue || '');
      const pwdLine = repair.notes ? repair.notes.split('\n').find((l: string) => l.includes('كلمة المرور')) : null;
      setDevicePassword(pwdLine ? pwdLine.replace('🔒 كلمة المرور ', '') : '');
      const locLine = repair.notes ? repair.notes.split('\n').find((l: string) => l.includes('مکان الجهاز:') || l.includes('مكان الجهاز:')) : null;
      setDeviceLocation(locLine ? locLine.replace('📍 مكان الجهاز: ', '').replace('📍 مکان الجهاز: ', '').trim() : '');

      // Parse parts
      if (repair.notes && repair.notes.includes('===PARTS===')) {
        try {
          const partsStr = repair.notes.split('===PARTS===\n')[1].split('\n===')[0];
          setRepairParts(JSON.parse(partsStr));
        } catch (e) { setRepairParts([]) }
      } else {
        setRepairParts([]);
      }

      // Parse payments
      if (repair.notes && repair.notes.includes('===PAYMENTS===')) {
        try {
          const paymentsStr = repair.notes.split('===PAYMENTS===\n')[1].split('\n===')[0];
          setPaymentsList(JSON.parse(paymentsStr));
        } catch (e) { setPaymentsList([]) }
      } else {
        if (repair.paid_amount && Number(repair.paid_amount) > 0) {
          setPaymentsList([{
            id: 'initial-' + Date.now().toString(),
            amount: Number(repair.paid_amount),
            date: repair.created_at || new Date().toISOString(),
            method: 'cash',
            note: 'عربون صيانة أولي'
          }]);
        } else {
          setPaymentsList([]);
        }
      }

      // Parse discount
      if (repair.notes && repair.notes.includes('===DISCOUNT===')) {
        try {
          const discountStr = repair.notes.split('===DISCOUNT===\n')[1].split('\n===')[0];
          const parsed = JSON.parse(discountStr);
          setDiscountType(parsed.type || 'none');
          setDiscountValue(parsed.value || '');
        } catch (e) {
          setDiscountType('none');
          setDiscountValue('');
        }
      } else {
        setDiscountType('none');
        setDiscountValue('');
      }

      fetchHistory();
    } else if (!isOpen) {
      prevRepairIdRef.current = null;
    }
  }, [repair, isOpen]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${SUPABASE_URL}/rest/v1/repair_logs?repair_id=eq.${repair.id}&order=created_at.desc`, {
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setRepairHistory(await response.json());
      } else {
        const err = await response.text();
        console.error('Fetch history error:', err);
      }
    } catch (e) { console.error('History API exception:', e); }
  };

  const handlePrintReceipt = () => {
    const formattedId = repair.id
      ? `R-${new Date(repair.created_at || Date.now()).getFullYear()}${(new Date(repair.created_at || Date.now()).getMonth() + 1).toString().padStart(2, '0')}-${repair.id.toString().padStart(5, '0')}`
      : 'R-NEW';

    const receiptHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>إيصال استلام صيانة - ${formattedId}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 10px; 
            width: 80mm;
            font-size: 14px;
            color: #000;
          }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          .header h2 { margin: 0; font-size: 20px; }
          .header p { margin: 5px 0 0 0; font-size: 12px; }
          table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
          table th, table td { padding: 5px 0; text-align: right; border-bottom: 1px dotted #ccc; }
          table th { width: 35%; color: #555; font-size: 12px; }
          table td { font-weight: bold; }
          .amount { font-size: 16px; text-align: center; margin: 15px 0; padding: 10px; border: 1px dashed #000; border-radius: 5px;}
          .terms { font-size: 10px; color: #555; text-align: justify; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-weight: bold; font-size: 12px; border-top: 2px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>إيصال استلام صيانة</h2>
          <p>رقم الإيصال: ${formattedId}</p>
          <p>التاريخ: ${new Date(repair.created_at || Date.now()).toLocaleString('ar-EG')}</p>
        </div>
        
        <table>
          <tr>
            <th>اسم العميل</th>
            <td>${repair.customer_name || 'غير مسجل'}</td>
          </tr>
          <tr>
            <th>رقم الموبايل</th>
            <td dir="ltr" style="text-align: right;">${repair.customer_phone || 'غير مسجل'}</td>
          </tr>
          <tr>
            <th>الجهاز</th>
            <td>${repair.device_name || 'غير محدد'}</td>
          </tr>
          <tr>
            <th>المشكلة</th>
            <td>${repair.issue || '-'}</td>
          </tr>
        </table>

        ${repair.total_amount !== null && repair.total_amount !== undefined ? `
        <div class="amount">
           <div>التكلفة: ${repair.total_amount} ج.م</div>
           ${repair.paid_amount ? `<div>المدفوع: ${repair.paid_amount} ج.م</div>` : ''}
           <div>المتبقي: ${repair.remaining_amount} ج.م</div>
        </div>
        ` : ''}

        <div class="terms">
          <b>شروط وأحكام الصيانة:</b><br/>
          - المتجر غير مسئول عن الجهاز بعد مرور 30 يوماً من إبلاغ العميل بانتهاء الصيانة.<br/>
          - يجب إحضار هذا الإيصال عند استلام الجهاز.<br/>
          - المتجر غير مسؤول عن أي محتويات داخل الجهاز غير مذكورة بالإيصال.
        </div>

        <div class="footer">
          شكراً لاختياركم مركز صيانة I-MAXX
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(receiptHtml);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }, 300);
    }
  };

  const handlePrintInvoice = () => {
    const formattedTicketId = repair.id
      ? `R-${new Date(repair.created_at || Date.now()).getFullYear()}${(new Date(repair.created_at || Date.now()).getMonth() + 1).toString().padStart(2, '0')}-${repair.id.toString().padStart(5, '0')}`
      : 'R-NEW';
    const invoiceId = repair.id ? `REP-${repair.id.toString().padStart(6, '0')}` : 'REP-NEW';

    const invoiceHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة صيانة - ${invoiceId}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 10px; 
            width: 80mm;
            font-size: 14px;
            color: #000;
            text-align: center;
          }
          .brand { font-size: 26px; font-weight: 900; margin-bottom: 5px; letter-spacing: 1px; text-transform: uppercase; font-family: 'Arial Black', sans-serif;}
          .badge { background: #000; color: #fff; padding: 4px 15px; display: inline-block; font-weight: bold; font-size: 16px; margin-bottom: 10px; }
          
          .details { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; align-items: center; padding: 0 15px; margin-bottom: 5px; }
          .row.center { justify-content: center; gap: 10px; }
          .val { font-weight: 900; font-size: 15px; }
          .label { font-weight: bold; font-size: 14px; }
          
          .box { border: 2px solid #000; padding: 8px; margin-bottom: 10px; }
          .box-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
          .dashed-line { border-bottom: 2px dashed #000; margin-bottom: 8px; }
          .box-content { font-weight: bold; font-size: 14px; line-height: 1.5; }
          
          .total-section { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .total-title { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
          .total-val { font-weight: 900; font-size: 26px; }
          
          .status { font-weight: bold; font-size: 16px; display: flex; justify-content: center; align-items: center; gap: 5px; margin-bottom: 10px; }
          .thanks { font-weight: bold; font-size: 15px; margin-bottom: 15px; }
          
          .barcode-container { text-align: center; margin-bottom: 20px; }
          .barcode-text { font-size: 14px; font-weight: bold; letter-spacing: 2px; margin-top: 2px; }
          
          .footer { background: #000; color: #fff; font-size: 12px; font-weight: bold; padding: 6px; letter-spacing: 1px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div>
          <svg style="width: 100px; height: 100px; margin-bottom: 10px;" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
          </svg>
        </div>
        <div class="brand">I-MAXX</div>
        <div class="badge">فاتورة صيانة</div>
        
        <div class="details">
          <div class="row">
            <span class="val" style="font-size: 18px;">#${invoiceId}</span>
            <span class="val" style="text-align: left; font-size: 12px;">${new Date().toLocaleDateString('ar-EG')}<br/>${new Date().toLocaleTimeString('ar-EG')}</span>
          </div>
          <div class="row center" dir="ltr">
            <span class="val">${repair.customer_phone || ''}</span>
          </div>
          <div class="row">
            <span class="label">الجهاز</span>
            <span class="val">${repair.device_name || '-------------'}</span>
          </div>
          <div class="row">
            <span class="label">التذكرة</span>
            <span class="val">#${formattedTicketId}</span>
          </div>
        </div>

        <div class="box">
          <div class="box-title">الأعمال المنفذة</div>
          <div class="dashed-line"></div>
          <div class="box-content">${repair.notes || repair.issue || 'صيانة عامة'}</div>
        </div>

        <div class="total-section">
          <div class="total-title">الإجمالي</div>
          <div class="total-val">${parseFloat(repair.total_amount).toFixed(2) || '0.00'} <span style="font-size: 16px;">ج.م</span></div>
        </div>
        
        ${(repair.remaining_amount === 0 || !repair.remaining_amount)
        ? `<div class="status"><span style="color: #10b981; font-size: 20px;">☑</span> تم الدفع بالكامل</div>`
        : `<div class="status" style="color: #000;">المتبقي: ${parseFloat(repair.remaining_amount).toFixed(2)} ج.م</div>`}

        <div class="thanks">شكراً لتعاملكم معنا</div>

        <div class="barcode-container">
          <svg id="barcode"></svg>
          <div class="barcode-text">${invoiceId}</div>
        </div>
        
        <div class="footer">ELOS ACCOUNTING SYSTEM</div>

        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          window.onload = () => {
            try {
              JsBarcode("#barcode", "${repair.id.toString().padStart(6, '0')}", {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: false,
                margin: 0
              });
            } catch(e) {}
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(invoiceHtml);
      doc.close();

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 5000);
    }
  };

  const sendWhatsAppInvoice = async (repairObj: any, statusMessage?: string) => {
    const ticketId = repairObj.id ? `R-${new Date(repairObj.created_at || Date.now()).getFullYear()}${(new Date(repairObj.created_at || Date.now()).getMonth() + 1).toString().padStart(2, "0")}-${repairObj.id.toString().padStart(5, "0")}` : "";
    const phone = repairObj.customer_phone;
    if (!phone) {
      alert("لا يوجد رقم هاتف للعميل");
      return;
    }
    const total = repairObj.total_amount || 0;
    const paid = repairObj.paid_amount || 0;
    const remaining = Math.max(0, total - paid);

    let msg = `مرحباً ${repairObj.customer_name || 'عميلنا العزيز'}،\n\n`;
    if (statusMessage === 'جاهز') {
      msg += `جهازك (${repairObj.device_name || 'غير محدد'}) جاهز الآن للاستلام من الصيانة.\n\n`;
    } else if (statusMessage === 'مرفوض') {
      msg += `نعتذر لعدم تمكننا من إتمام صيانة جهازك (${repairObj.device_name || 'غير محدد'}). يرجى زيارتنا لاستلام الجهاز بأقرب وقت.\n\n`;
    } else {
      msg += `بخصوص صيانة جهازك (${repairObj.device_name || 'غير محدد'}).\n\n`;
    }
    msg += `المرجع: ${ticketId}\n`;
    if (repairObj.issue) msg += `الأعمال المنفذة: ${repairObj.issue}\n\n`;
    msg += `الإجمالي: ${total} ج.م\n`;
    msg += `المدفوع: ${paid} ج.م\n`;
    if (remaining > 0) {
      msg += `المتبقي: ${remaining} ج.م\n\n`;
    } else {
      msg += `خالص الحساب.\n\n`;
    }

    msg += `تفضل بزيارتنا في أوقات العمل لاستلام جهازك.\nشكراً لثقتكم بنا.`;

    const cleanPhone = phone.replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : (cleanPhone.startsWith('2') ? cleanPhone : '2' + cleanPhone);
    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;

    let pwaOpened = false;

    if (invoicePrintRef.current) {
      try {
        const { toPng } = await import('html-to-image');
        const { default: jsPDF } = await import('jspdf');

        // Ensure visibility temporarily
        const origVisibility = invoicePrintRef.current.style.visibility;
        invoicePrintRef.current.style.visibility = 'visible';

        const dataUrl = await toPng(invoicePrintRef.current, {
          pixelRatio: 2,
          backgroundColor: '#fff',
          style: { visibility: 'visible' }
        });

        invoicePrintRef.current.style.visibility = origVisibility;

        try {
          const blob = await (await fetch(dataUrl)).blob();
          await navigator.clipboard.write([
            new window.ClipboardItem({
              'image/png': blob
            })
          ]);
          alert('✅ تم نسخ الفاتورة كـ صورة بنجاح!\n\nبمجرد فتح الواتساب، اضغط (لصق / Paste) أو (Ctrl+V) لإرسالها للعميل.');
          window.open(url, '_blank');
          pwaOpened = true;
        } catch (clipboardErr) {
          console.error('Clipboard write failed:', clipboardErr);
          const pdfWidth = invoicePrintRef.current.offsetWidth || 300;
          const pdfHeight = invoicePrintRef.current.offsetHeight || 600;
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [pdfWidth, pdfHeight]
          });
          pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Invoice-${ticketId}.pdf`);
          window.open(url, '_blank');
          pwaOpened = true;
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }

    if (!pwaOpened) {
      window.open(url, '_blank');
    }
  };

  const triggerReadyWhatsApp = async (repairObj: any, finalStatus: string) => {
    if (finalStatus !== 'جاهز' && finalStatus !== 'مرفوض') return;
    await sendWhatsAppInvoice(repairObj, finalStatus);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'مرفوض') {
      setIsRejectMode(true);
      return;
    }

    if (newStatus === 'تم التسليم') {
      const paidNum = Number(repair.paid_amount || 0);
      const totalNum = Number(repair.total_amount || 0);

      if (paidNum < totalNum) {
        alert(`لا يمكن تسليم الجهاز للعميل قبل سداد كامل التكلفة المتبقية (${totalNum - paidNum} ج.م)`);
        return;
      }
    }

    let payload: any = { status: newStatus };
    const token = localStorage.getItem('access_token');

    const oldStatus = status;
    setStatus(newStatus);
    setManualStatus(newStatus);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        if (newStatus !== oldStatus) {
          logToCRM(repair.id, `تغيير الحالة: ${oldStatus || 'مستلم'} -> ${newStatus} - تغيير سريع`);
          fetchHistory();
          triggerReadyWhatsApp(repair, newStatus);
        }
        await onSuccess(); // Triggers parent to fetch latest
      } else {
        const errorText = await response.text();
        console.error('Failed to update status:', errorText);
        alert('فشل في تحديث الحالة. الرجاء المحاولة مرة أخرى.');
        setStatus(oldStatus);
        setManualStatus(oldStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('حدث خطأ في الاتصال بالخادم');
      setStatus(oldStatus);
      setManualStatus(oldStatus);
    }
  };

  const handleManualStatusUpdate = async () => {
    if (manualStatus === 'مرفوض') {
      setIsRejectMode(true);
      return;
    }

    if (manualStatus === 'تم التسليم') {
      const paidNum = Number(repair.paid_amount || 0);
      const totalNum = Number(repair.total_amount || 0);

      if (paidNum < totalNum) {
        alert(`لا يمكن تسليم الجهاز للعميل قبل سداد كامل التكلفة المتبقية (${totalNum - paidNum} ج.م)`);
        return;
      }
    }

    setIsUpdatingStatus(true);
    const oldStatus = status;
    setStatus(manualStatus);
    try {
      const token = localStorage.getItem('access_token');

      let finalNotes = repair.notes || '';
      if (statusNote.trim()) {
        const partsSplit = finalNotes.split('\n\n===PARTS===');
        const base = partsSplit[0];
        const parts = partsSplit.length > 1 ? '\n\n===PARTS===' + partsSplit[1] : '';
        finalNotes = base + `\nملاحظة حالة (${manualStatus}): ` + statusNote + parts;
      }

      const payload: any = { status: manualStatus };
      if (statusNote.trim()) {
        payload.notes = finalNotes;
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        if (manualStatus !== oldStatus) {
          logToCRM(repair.id, `تغيير الحالة: ${oldStatus || 'مستلم'} -> ${manualStatus}`);
          fetchHistory();
          triggerReadyWhatsApp(repair, manualStatus);
        }
        setStatusNote('');
        await onSuccess();
      } else {
        setStatus(oldStatus);
        alert('فشل في تحديث الحالة');
      }
    } catch (error) {
      setStatus(oldStatus);
      console.error(error);
      alert('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getFinancialTotals = () => {
    let previousPartsSum = 0;
    let oldDiscountVal = 0;
    let isOldPerc = false;

    if (repair.notes && repair.notes.includes('===PARTS===')) {
      try {
        const oldParts = JSON.parse(repair.notes.split('===PARTS===\n')[1].split('\n===')[0]);
        previousPartsSum = oldParts.reduce((a: number, p: any) => a + Number(p.price || 0), 0);
      } catch (e) { }
    }

    if (repair.notes && repair.notes.includes('===DISCOUNT===')) {
      try {
        const dStr = repair.notes.split('===DISCOUNT===\n')[1].split('\n===')[0];
        const dParsed = JSON.parse(dStr);
        oldDiscountVal = Number(dParsed.value) || 0;
        isOldPerc = dParsed.type === 'percentage';
      } catch (e) { }
    }

    let originalTotalBeforeDiscount = repair.total_amount || 0;
    if (isOldPerc && oldDiscountVal > 0 && oldDiscountVal < 100) {
      originalTotalBeforeDiscount = originalTotalBeforeDiscount / (1 - oldDiscountVal / 100);
    } else if (!isOldPerc && oldDiscountVal > 0) {
      originalTotalBeforeDiscount = originalTotalBeforeDiscount + oldDiscountVal;
    }

    const maintenanceBaseCost = Math.max(0, originalTotalBeforeDiscount - previousPartsSum);
    const newPartsSum = repairParts.reduce((a, p) => a + Number(p.price || 0), 0);
    const newSubtotal = maintenanceBaseCost + newPartsSum;

    let discountAmountObj = 0;
    const dVal = Number(discountValue) || 0;
    if (discountType === 'percentage' && dVal > 0 && dVal <= 100) {
      discountAmountObj = newSubtotal * (dVal / 100);
    } else if (discountType === 'fixed' && dVal > 0) {
      discountAmountObj = dVal;
    }

    const finalTotal = Math.max(0, newSubtotal - discountAmountObj);

    return {
      previousPartsSum,
      maintenanceBaseCost,
      partsCost: newPartsSum,
      subTotal: newSubtotal,
      discountAmount: discountAmountObj,
      finalTotal
    };
  };

  const handleCollectPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const { subTotal, discountAmount } = getFinancialTotals();
    const cashierStr = localStorage.getItem('active_cashier');
    let maxDiscountLimit = 0;
    let isManager = localStorage.getItem('admin_active') === 'true';
    if (cashierStr && !isManager) {
      try {
        const cashier = JSON.parse(cashierStr);
        let perms = cashier.permissions || {};
        if (typeof perms === 'string') {
          try { perms = JSON.parse(perms); } catch (e) { }
        }
        maxDiscountLimit = Number(perms.maxDiscount || 0);
      } catch (e) { }
    }
    const appliedDiscountPercentage = subTotal > 0 ? (discountAmount / subTotal) * 100 : 0;
    if (maxDiscountLimit > 0 && appliedDiscountPercentage > maxDiscountLimit) {
      alert(`عذراً، الحد الأقصى للخصم المسموح لك به هو ${maxDiscountLimit}%`);
      return;
    }

    setIsCollecting(true);
    try {
      const token = localStorage.getItem('access_token');

      const { finalTotal } = getFinancialTotals();

      const newPayment = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        amount: amount,
        method: paymentMethod,
        wallet_id: paymentMethod !== 'deferred' ? selectedWalletId : null,
        note: paymentNote
      };

      const newPaymentsList = [...paymentsList, newPayment];
      const totalHistoricallyPaid = newPaymentsList.reduce((a, p) => a + Number(p.amount || 0), 0);
      const newRemainingAmount = Math.max(0, finalTotal - totalHistoricallyPaid);

      let newNotes = repair.notes || '';
      let cleanText = newNotes.split('\n===')[0];
      cleanText = cleanText.split('\n').filter((l: string) => !l.includes('كلمة المرور') && !l.includes('مکان الجهاز:') && !l.includes('مكان الجهاز:')).join('\n');
      if (devicePassword) {
        cleanText += (cleanText ? '\n' : '') + `🔒 كلمة المرور ${devicePassword}`;
      }
      if (deviceLocation) {
        cleanText += (cleanText ? '\n' : '') + `📍 مكان الجهاز: ${deviceLocation}`;
      }

      newNotes = cleanText;
      newNotes = updateSection(newNotes, 'PARTS', repairParts);
      newNotes = updateSection(newNotes, 'DISCOUNT', { type: discountType, value: discountValue });
      newNotes = updateSection(newNotes, 'PAYMENTS', newPaymentsList);

      const payload = {
        total_amount: finalTotal,
        paid_amount: totalHistoricallyPaid,
        remaining_amount: newRemainingAmount,
        notes: newNotes
      };

      const promises: Promise<any>[] = [
        fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
      ];

      if (paymentMethod !== 'deferred' && amount > 0) {
        const userId = localStorage.getItem('user_id');
        const walletName = availableWallets.find(w => w.id === Number(selectedWalletId))?.name || 'محفظة النظام';

        const activeBranchId = localStorage.getItem('takka_active_branch_id');
        promises.push(
          processTreasuryTransaction(
            selectedWalletId ? Number(selectedWalletId) : null,
            amount,
            'in',
            'مشتريات قطع غيار صيانة',
            `دفع تكلفة / باقي حساب صيانة رقم #${repair.id} - الهاتف: ${repair.device_name || ''} - للعميل: ${repair.customer_name || ''}${paymentNote ? ` - ملاحظات: ${paymentNote}` : ''}`,
            activeBranchId || null
          )
        );
      }

      await Promise.all(promises);

      if (paymentMethod !== 'deferred' && amount > 0) {
        await addMaintenanceToSalesAndShift(amount, repair.id, repair.device_name, repair.customer_name, paymentMethod, false, finalTotal, newRemainingAmount, totalHistoricallyPaid, repair.receiving_branch_id);
      }

      // All done successfully:
      logToCRM(repair.id, `إضافة دفعة مالية: ${amount} ج.م`);
      fetchHistory();
      setPaymentsList(newPaymentsList);
      setPaymentAmount('');
      setPaymentNote('');
      await onSuccess(); // Fetches latest repairs, updating shift stats etc.
    } catch (e) {
      console.error(e);
      alert('حدث خطأ');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleConfirmRefund = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      const amountToRefund = Number(repair.paid_amount || repair.total_amount || 0);

      const promises: Promise<any>[] = [];

      // 1. Update ticket status to 'مرتجع / تم الاسترداد'
      promises.push(
        fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'مرتجع / تم الاسترداد', paid_amount: 0 })
        })
      );

      // 2. Insert treasury transactions for the refunded payments
      const activeBranchId = localStorage.getItem('takka_active_branch_id');
      for (const pmt of paymentsList) {
        if (pmt.amount && Number(pmt.amount) > 0) {
          let targetWalletId = pmt.wallet_id || pmt.method;
          if (isNaN(Number(targetWalletId))) { targetWalletId = null; } else { targetWalletId = Number(targetWalletId); }
          promises.push(
            processTreasuryTransaction(
              targetWalletId,
              pmt.amount,
              'out',
              'مرتجع صيانة - درج',
              `استرداد دفعة (تذكرة صيانة رقم #${repair.id}) - الهاتف: ${repair.device_name || ''}`,
              repair.receiving_branch_id || repair.branch_id || activeBranchId || null
            )
          );
        }
      }

      // 3. Return parts to stock if checked
      if (returnPartsToStock && repairParts.length > 0) {
        for (const rp of repairParts) {
          if (rp.id) {
            const partRes = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts?id=eq.${rp.id}&select=quantity`, {
              headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
            });
            if (partRes.ok) {
              const partData = await partRes.json();
              if (partData.length > 0) {
                const currentQty = partData[0].quantity || 0;
                promises.push(fetch(`${SUPABASE_URL}/rest/v1/spare_parts?id=eq.${rp.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ quantity: currentQty + Number(rp.quantity || 1) })
                } as any));
              }
            }
          }
        }
      }
      await Promise.all(promises);

      if (amountToRefund > 0) {
        await addMaintenanceToSalesAndShift(amountToRefund, repair.id, repair.device_name, repair.customer_name, 'cash', true, Number(repair.total_amount || 0), 0, amountToRefund, repair.receiving_branch_id);
      }

      await logToCRM(repair.id, `إجراء مرتجع مالي: ${amountToRefund} ج.م - السبب: ${refundReason}`);

      setIsConfirmRefundModalOpen(false);
      setIsRefundMode(false);
      await onSuccess();
      onClose(); // Optional: close the modal, or keep it open with the new status
    } catch (e) {
      console.error(e);
      alert('حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWithdrawPayment = async () => {
    if (!withdrawPaymentAmount || Number(withdrawPaymentAmount) <= 0) {
      alert('الرجاء إدخال مبلغ صحيح للسحب');
      return;
    }
    const amountToWithdraw = Number(withdrawPaymentAmount);
    if (amountToWithdraw > Number(repair.paid_amount || 0)) {
      alert('المبلغ المدخل أكبر من إجمالي المدفوعات');
      return;
    }
    if (!withdrawPaymentWalletId) {
      alert('الرجاء اختيار الخزينة/المحفظة لسحب المبلغ منها');
      return;
    }
    if (!withdrawPaymentReason.trim()) {
      alert('الرجاء كتابة سبب السحب');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem('access_token');
      const activeBranchId = localStorage.getItem('takka_active_branch_id');

      // Update repair
      const newPaidAmount = Number(repair.paid_amount || 0) - amountToWithdraw;

      const newPayment = {
        id: Date.now().toString() + '-withdraw',
        date: new Date().toISOString(),
        amount: -amountToWithdraw,
        method: 'cash',
        wallet_id: withdrawPaymentWalletId,
        note: `سحب/إلغاء دفعة: ${withdrawPaymentReason}`
      };

      let currentPayments = paymentsList || [];
      currentPayments = [...currentPayments, newPayment];

      let currentNotes = repair.notes || '';
      currentNotes = updateSection(currentNotes, 'PAYMENTS', currentPayments);

      await fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          paid_amount: newPaidAmount,
          notes: currentNotes
        })
      });

      // Treasury transaction
      const wRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${withdrawPaymentWalletId}&select=balance`, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` } });
      if (wRes.ok) {
        const wData = await wRes.json();
        if (wData && wData.length > 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${withdrawPaymentWalletId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ balance: Number(wData[0].balance || 0) - amountToWithdraw })
          });
        }
      }

      await processTreasuryTransaction(
        Number(withdrawPaymentWalletId), amountToWithdraw, 'out', 'مرتجع صيانة - درج',
        `سحب/إلغاء دفعة (تذكرة صيانة رقم #${repair.id}) - الهاتف: ${repair.device_name || ''} - السبب: ${withdrawPaymentReason}`,
        repair.receiving_branch_id || repair.branch_id || activeBranchId || null
      );

      await addMaintenanceToSalesAndShift(amountToWithdraw, repair.id, repair.device_name, repair.customer_name, 'cash', true, 0, 0, amountToWithdraw, repair.receiving_branch_id);

      await logToCRM(repair.id, `سحب/إلغاء دفعة مالية بقيمة ${amountToWithdraw} ج.م - السبب: ${withdrawPaymentReason}`);

      setIsWithdrawPaymentMode(false);
      setWithdrawPaymentAmount('');
      setWithdrawPaymentReason('');
      await onSuccess();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('الرجاء كتابة سبب رفض الصيانة');
      return;
    }

    const paidNum = Number(repair.paid_amount || 0);
    const inspectionFeeAmt = Number(inspectionFee || 0);
    const refundAmount = Math.max(0, paidNum - inspectionFeeAmt);

    if ((paidNum > 0 || inspectionFeeAmt > 0) && !rejectWalletId) {
      alert('الرجاء اختيار الخزينة/المحفظة لإتمام التسوية المالية (حتى إن كان الاسترداد صفراً، يجب تسجيل رسوم الكشف)');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem('access_token');
      const activeBranchId = localStorage.getItem('takka_active_branch_id');

      let currentPayments = paymentsList;

      // 1. Process Refund and Collection Transactions explicitly to re-classify revenue
      if (paidNum > 0 || inspectionFeeAmt > 0) {
        const wRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${rejectWalletId}&select=balance`, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` } });
        let currentBalance = 0;
        if (wRes.ok) {
          const wData = await wRes.json();
          if (wData && wData.length > 0) {
            currentBalance = Number(wData[0].balance || 0);
          }
        }

        if (paidNum > 0) {
          await processTreasuryTransaction(
            Number(rejectWalletId), paidNum, 'out', 'مرتجع صيانة - درج',
            `استرداد دفعات سابقة بالكامل (لتسوية فاتورة رفض صيانة) - تذكرة RP${repair.id.toString().padStart(6, '0')} - الهاتف: ${repair.device_name || ''}`,
            repair.receiving_branch_id || repair.branch_id || activeBranchId || null
          );
          await addMaintenanceToSalesAndShift(paidNum, repair.id, repair.device_name, repair.customer_name, 'cash', true, 0, 0, paidNum, repair.receiving_branch_id);
          currentBalance -= paidNum;

          const refundPayment = {
            id: Date.now().toString() + '-ref',
            date: new Date().toISOString(),
            amount: -paidNum,
            method: 'cash',
            wallet_id: rejectWalletId,
            note: 'استرداد دفعات سابقة لتسوية المرفوض'
          };
          currentPayments = [...currentPayments, refundPayment];
        }

        if (inspectionFeeAmt > 0) {
          await processTreasuryTransaction(
            Number(rejectWalletId), inspectionFeeAmt, 'in', 'مشتريات قطع غيار صيانة',
            `تحصيل رسوم فحص/كشف (لرفض صيانة) - تذكرة RP${repair.id.toString().padStart(6, '0')} - الهاتف: ${repair.device_name || ''}`,
            repair.receiving_branch_id || repair.branch_id || activeBranchId || null
          );
          await addMaintenanceToSalesAndShift(inspectionFeeAmt, repair.id, repair.device_name, repair.customer_name, 'cash', false, inspectionFeeAmt, 0, inspectionFeeAmt, repair.receiving_branch_id);
          currentBalance += inspectionFeeAmt;

          const feePayment = {
            id: Date.now().toString() + '-fee',
            date: new Date().toISOString(),
            amount: inspectionFeeAmt,
            method: 'cash',
            wallet_id: rejectWalletId,
            note: 'تحصيل رسوم فحص عند الرفض'
          };
          currentPayments = [...currentPayments, feePayment];
        }

        await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${rejectWalletId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ balance: currentBalance })
        });
      }

      // 2. Return parts back to stock
      let currentNotes = repair.notes || '';
      if (returnPartsToStock && (currentNotes.includes('===PARTS===') || repairParts.length > 0)) {
        try {
          if (repairParts.length > 0) {
            await Promise.all(
              repairParts.map(async (rp: any) => {
                if (!rp.id) return;
                const table = rp.source === 'Accessories' ? 'Accessories' : 'spare_parts';
                const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${rp.id}`, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` } });
                if (r.ok) {
                  const d = await r.json();
                  if (d && d.length > 0) {
                    const qtyField = rp.source === 'Accessories' ? 'stock' : 'quantity';
                    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${rp.id}`, {
                      method: 'PATCH', headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ [qtyField]: Number(d[0][qtyField] || 0) + Number(rp.quantity || 1) })
                    });
                  }
                }
              })
            );
          }

          if (currentNotes.includes('===PARTS===')) {
            const partsStr = currentNotes.split('===PARTS===\n')[1].split('\n===')[0];
            const partsSection = `\n\n===PARTS===\n${partsStr}\n===`;
            currentNotes = currentNotes.replace(partsSection, '');
          }
        } catch (e) { }
      }

      currentNotes = updateSection(currentNotes, 'PAYMENTS', currentPayments);
      currentNotes += `\n\n--- سبب الرفض ---\n${rejectReason}\nرسوم الفحص/الكشف المحصلة: ${inspectionFeeAmt} ج.م`;
      if (markAsHandedOver) {
        currentNotes += `\n* تم استلام الجهاز من قبل العميل وأخلينا الطرف.`;
      }

      await fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          status: markAsHandedOver ? 'مرتجع / تم الاسترداد' : 'مرفوض',
          notes: currentNotes.trim(),
          total_amount: inspectionFeeAmt,
          paid_amount: inspectionFeeAmt
        })
      });
      // 3. Log to history
      await logToCRM(repair.id, `تغيير الحالة إلى ${markAsHandedOver ? 'مرفوض ومُسلم' : 'مرفوض'}\nالسبب: ${rejectReason}\nرسوم الفحص: ${inspectionFee} ج.م\nاسترداد: ${refundAmount} ج.م`);

      fetchHistory();
      if (!markAsHandedOver) {
        triggerReadyWhatsApp(repair, 'مرفوض');
      }
      setIsRejectMode(false);
      await onSuccess();
    } catch (e) {
      console.error("Error rejecting...", e);
      alert('حدث خطأ أثناء إتمام عملية الرفض.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreateEditTicket = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      // Create a log in CRM for the edit ticket
      await logToCRM(repair.id, `طلب تذكرة تعديل - السبب: ${editReason}`);

      // We can change the status back to "مستلم" or "قيد الانتظار" 
      await fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'مستلم' })
      });

      setIsEditModalOpen(false);
      setEditReason('');
      await onSuccess();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إنشاء تذكرة التعديل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      const { subTotal, finalTotal, discountAmount } = getFinancialTotals();

      const cashierStr = localStorage.getItem('active_cashier');
      let maxDiscountLimit = 0;
      let isManager = localStorage.getItem('admin_active') === 'true';
      if (cashierStr && !isManager) {
        try {
          const cashier = JSON.parse(cashierStr);
          let perms = cashier.permissions || {};
          if (typeof perms === 'string') {
            try { perms = JSON.parse(perms); } catch (e) { }
          }
          maxDiscountLimit = Number(perms.maxDiscount || 0);
        } catch (e) {
          console.error('Error parsing active_cashier', e);
        }
      }
      const appliedDiscountPercentage = subTotal > 0 ? (discountAmount / subTotal) * 100 : 0;
      if (maxDiscountLimit > 0 && appliedDiscountPercentage > maxDiscountLimit) {
        alert(`عذراً، الحد الأقصى للخصم المسموح لك به هو ${maxDiscountLimit}%`);
        setIsLoading(false);
        return;
      }

      const calculatedTotalAmount = finalTotal;

      const totalHistoricallyPaid = paymentsList.reduce((a, p) => a + Number(p.amount || 0), 0);
      const newPaidAmount = totalHistoricallyPaid; // no payment entered here directly anymore

      const newRemainingAmount = Math.max(0, calculatedTotalAmount - newPaidAmount);

      if (status === 'تم التسليم' && newRemainingAmount > 0) {
        alert(`لا يمكن تسليم الجهاز للعميل قبل سداد كامل التكلفة المتبقية (${newRemainingAmount} ج.م)`);
        setIsLoading(false);
        return;
      }

      let newNotes = repair.notes || '';
      // We will preserve manual texts but use `updateSection` to clean up old JSONs
      // First, extract the pure text note before any system blocks. We can do that by taking everything before the first "==="
      let cleanText = newNotes.split('\n===')[0];
      cleanText = cleanText.split('\n').filter((l: string) => !l.includes('كلمة المرور') && !l.includes('مکان الجهاز:') && !l.includes('مكان الجهاز:')).join('\n');
      if (devicePassword) {
        cleanText += (cleanText ? '\n' : '') + `🔒 كلمة المرور ${devicePassword}`;
      }
      if (deviceLocation) {
        cleanText += (cleanText ? '\n' : '') + `📍 مكان الجهاز: ${deviceLocation}`;
      }

      newNotes = cleanText;
      newNotes = updateSection(newNotes, 'PARTS', repairParts);
      newNotes = updateSection(newNotes, 'DISCOUNT', { type: discountType, value: discountValue });
      newNotes = updateSection(newNotes, 'PAYMENTS', paymentsList);

      const payload = {
        status,
        total_amount: calculatedTotalAmount,
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
        notes: newNotes,
        customer_name: customerName,
        customer_phone: customerPhone,
        device_name: deviceName,
        imei: imei,
        technician_name: technicianName,
        issue: issue
      };

      const promises = [
        fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${repair.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
      ];

      await Promise.all(promises);
      await onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  if (!repair) return null;

  return (
    <>
      {isAddPartModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAddPartModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-6 h-6 text-blue-500" />
                إضافة قطعة مباشرة
              </h3>
              <button
                onClick={() => setIsAddPartModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2 pb-2">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 block">اسم القطعة</label>
                <input
                  type="text"
                  value={directPartName}
                  onChange={e => setDirectPartName(e.target.value)}
                  placeholder="مثال: شاشة آيفون 13 برو"
                  className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 block">سعر الشراء (التكلفة)</label>
                  <input
                    type="number"
                    value={directPartCost}
                    onChange={e => setDirectPartCost(e.target.value)}
                    className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm text-left font-mono font-bold text-lg"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 block">سعر البيع للعميل</label>
                  <input
                    type="number"
                    value={directPartPrice}
                    onChange={e => setDirectPartPrice(e.target.value)}
                    className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm text-left font-mono font-bold text-lg"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 block">الكمية</label>
                <input
                  type="number"
                  min="1"
                  value={directPartQty}
                  onChange={e => setDirectPartQty(e.target.value)}
                  className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm text-left font-mono font-bold text-lg"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 block">خصم التكلفة من خزنة:</label>
                <select
                  value={directPartWalletId}
                  onChange={(e) => setDirectPartWalletId(e.target.value)}
                  className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm font-bold appearance-none cursor-pointer"
                >
                  <option value="" disabled>-- اختر الخزنة (أو اتركها فارغة) --</option>
                  {availableWallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                {directPartCost && directPartQty && directPartWalletId && (
                  <p className="text-sm text-slate-500 mt-2 font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-lg border border-rose-100 dark:border-rose-500/20">
                    سيتم سحب <span className="font-mono text-lg mx-1">{(Number(directPartCost) * Number(directPartQty)).toFixed(2)}</span> ج.م من الخزنة المحددة.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-6 border-t border-slate-100 dark:border-white/10">
              <button
                disabled={isLoading || !directPartName || !directPartPrice || !directPartCost}
                onClick={handleAddDirectPart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                <span className="text-lg">إضافة القطعة للصيانة</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm"
              onClick={(isUpdatingStatus || isLoading) ? undefined : onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
              dir="rtl"
            >
              {/* Loading Overlay */}
              <AnimatePresence>
                {(isUpdatingStatus || isLoading) && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[100] bg-white/50 dark:bg-[#0d1117]/50 backdrop-blur-[2px] flex items-center justify-center"
                  >
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">جاري الحفظ وتحديث البيانات...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Header */}
              <div className="shrink-0 flex justify-between items-center p-6 border-b border-slate-200 dark:border-white/10 relative z-20 bg-white dark:bg-[#0d1117]">
                <div className="flex items-center gap-3">
                  <button onClick={(isUpdatingStatus || isLoading) ? undefined : onClose} disabled={isUpdatingStatus || isLoading} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><X className="w-5 h-5" /></button>
                  <div className="flex items-center bg-blue-50 dark:bg-blue-500/10 rounded-xl overflow-hidden border border-blue-100 dark:border-blue-500/20">
                    <button
                      onClick={() => {
                        const domain = localStorage.getItem('takka_tracking_domain')?.trim() || window.location.origin;
                        const baseUrl = domain.endsWith('/') ? domain.slice(0, -1) : domain;
                        const trackingUrl = `http://takka.fun/track-maintenance/?track=${repair.id}`;
                        navigator.clipboard.writeText(trackingUrl);
                        alert('تم نسخ رابط التتبع بنجاح!');
                      }}
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2 text-sm font-bold transition-colors"
                    >
                      <Link className="w-4 h-4" />
                      نسخ رابط التتبع
                    </button>
                    <div className="w-[1px] h-6 bg-blue-200 dark:bg-blue-500/30"></div>
                    <a
                      href={`https://wa.me/${repair.customer_phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(
                        `مرحباً، يمكنك تتبع حالة جهازك (${repair.device_name}) عبر هذا الرابط:\nhttp://takka.fun/track-maintenance/?track=${repair.id}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 px-4 py-2 text-sm font-bold transition-colors"
                      title="مشاركة عبر واتساب"
                    >
                      <MessageSquare className="w-4 h-4" />
                      واتساب
                    </a>
                  </div>
                </div>
                <div className="font-bold text-xl text-blue-600 dark:text-blue-500 flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-sm mr-2">{repair.id ? `#R-${new Date(repair.created_at || Date.now()).getFullYear()}${(new Date(repair.created_at || Date.now()).getMonth() + 1).toString().padStart(2, '0')}-${repair.id.toString().padStart(5, '0')}` : '#R-NEW'}</span>
                  {repair.receiving_branch?.name && (
                    <span className="text-sm bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full mr-2 font-normal whitespace-nowrap">
                      {repair.receiving_branch.name}
                    </span>
                  )}
                  تفاصيل تذكرة الصيانة
                  <FileText className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                </div>
              </div>

              {/* Scrollable Container for all content below header */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Top Summary Blocks */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#11151c]/50">
                  <div className="flex flex-wrap gap-4 justify-center items-center">
                    <div className="flex items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl min-w-[180px]">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-white/10 flex items-center justify-center rounded-xl shrink-0"><User className="w-5 h-5 text-slate-600 dark:text-slate-300" /></div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold">العميل</div>
                        <div className="text-sm font-bold truncate max-w-[100px]">{customerName || repair.customer_name || '---------'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl min-w-[180px]">
                      <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center rounded-xl shrink-0"><Phone className="w-5 h-5 text-rose-500" /></div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold">الهاتف</div>
                        <div className="text-sm font-bold truncate max-w-[100px]" dir="ltr">{customerPhone || repair.customer_phone || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl min-w-[180px]">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center rounded-xl shrink-0"><Smartphone className="w-5 h-5 text-indigo-500" /></div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold">الجهاز</div>
                        <div className="text-sm font-bold truncate max-w-[100px]">{deviceName || repair.device_name || '-'}</div>
                        {deviceLocation && (
                          <div className="text-[10px] text-blue-500 font-bold mt-0.5 truncate max-w-[100px]">📍 {deviceLocation}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl min-w-[180px]">
                      <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center rounded-xl shrink-0"><BarChart3 className="w-5 h-5 text-orange-500" /></div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold">الحالة</div>
                        <div className="text-sm font-bold text-orange-600 dark:text-orange-400 truncate max-w-[100px]">{status || repair.status || 'مستلم'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl min-w-[180px]">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-white/10 flex items-center justify-center rounded-xl shrink-0"><Wrench className="w-5 h-5 text-slate-600 dark:text-slate-300" /></div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold">الفني</div>
                        <div className="text-sm font-bold truncate max-w-[100px]">{technicianName || repair.technician_name || 'لم يُحدد'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="mt-8 flex items-center justify-between relative max-w-4xl mx-auto px-10">
                    <div className="absolute top-8 left-10 right-10 h-0.5 bg-slate-200 dark:bg-white/10 -translate-y-1/2 z-0"></div>
                    {[
                      { step: 'مستلم', icon: FileText },
                      { step: 'فحص', icon: Search },
                      { step: 'موافقة', icon: Hourglass },
                      { step: 'صيانة', icon: Wrench },
                      { step: 'جاهز', icon: CheckCircle },
                      { step: 'تسليم', icon: Package }
                    ].map((s, i) => {
                      const stepOrder = ['مستلم', 'فحص', 'موافقة', 'صيانة', 'جاهز', 'تسليم'];
                      const mappedStatus = status || repair.status ? (
                        ['قيد الانتظار', 'مستلم'].includes(status || repair.status) ? 'مستلم' :
                          (status || repair.status) === 'تحت الصيانة' ? 'صيانة' : // Just a mapping example
                            (status || repair.status) === 'جاهز' ? 'جاهز' :
                              (status || repair.status) === 'تم التسليم' ? 'تسليم' : s.step
                      ) : 'مستلم';

                      const currentIdx = stepOrder.indexOf(mappedStatus) >= 0 ? stepOrder.indexOf(mappedStatus) : 0;
                      const isCurrent = i === currentIdx;
                      const isDone = i < currentIdx;

                      return (
                        <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                          <div className={`w-12 h-12 rounded-full border-4 ${isCurrent ? 'border-blue-100 dark:border-blue-900/50 bg-blue-500 text-white' : isDone ? 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-500 text-white' : 'border-white dark:border-[#0d1117] bg-slate-100 dark:bg-white/10 text-slate-400'} flex items-center justify-center transition-all`}>
                            {isDone ? <Check className="w-5 h-5 text-white" /> : <s.icon className="w-5 h-5" />}
                          </div>
                          <span className={`text-xs font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{s.step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Locked Warning */}
                {!isRefundMode && (status === 'تم التسليم' || status === 'مرتجع / تم الاسترداد') && (
                  <div className="p-4 bg-white dark:bg-[#0d1117]">
                    <div className="max-w-4xl mx-auto bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-400 dark:border-amber-500 rounded-2xl p-6 relative overflow-hidden">
                      <div className="flex items-start justify-between relative z-10">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold border-b-2 border-amber-500 pb-1">تذكرة مقفلة مالياً</h3>
                            <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center">
                              <Lock className="w-5 h-5" />
                            </div>
                          </div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            هذه التذكرة تم إقفالها ضمن فترة محاسبية سابقة ولا يمكن تعديلها مباشرة للحفاظ على سلامة السجلات المالية.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 relative z-10">
                        <div className="text-center">
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 flex items-center justify-center gap-1"><Calendar className="w-4 h-4" /> تاريخ الإقفال</div>
                          <div className="font-bold text-slate-800 dark:text-white" dir="ltr">{new Date(repair.updated_at || repair.created_at).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}</div>
                        </div>
                        <div className="text-center border-r border-amber-200 dark:border-amber-500/20">
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 flex items-center justify-center gap-1"><FileText className="w-4 h-4" /> رقم الإقفال</div>
                          <div className="font-bold text-slate-800 dark:text-white">إقفال تلقائي</div>
                        </div>
                        <div className="text-center border-r border-amber-200 dark:border-amber-500/20">
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 flex items-center justify-center gap-1"><BarChart3 className="w-4 h-4" /> الحالة</div>
                          <div className={`font-bold ${status === 'مرتجع / تم الاسترداد' ? 'text-red-600' : 'text-orange-600'}`}>{status === 'مرتجع / تم الاسترداد' ? 'مرتجع / تم الاسترداد' : 'تم التسليم للعميل'}</div>
                        </div>
                      </div>

                      {status !== 'مرتجع / تم الاسترداد' && (
                        <div className="mt-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-xl relative z-10">
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mb-2">
                            <span className="text-lg">💡</span> ماذا يمكنك أن تفعل؟
                          </div>
                          <ul className="text-sm font-bold text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside px-2">
                            <li>يمكنك عرض جميع بيانات التذكرة والمدفوعات</li>
                            <li>يمكنك طباعة الفاتورة أو الباركود</li>
                            <li>يمكنك إنشاء تذكرة تعديل لإجراء تغييرات إضافية (للأدمن فقط)</li>
                          </ul>
                        </div>
                      )}

                      {status !== 'مرتجع / تم الاسترداد' && (
                        <div className="mt-6 flex flex-wrap gap-4 relative z-10">
                          <button onClick={() => {
                            const actCashierCheck = JSON.parse(localStorage.getItem('active_cashier') || '{}');
                            const roleLevelCheck = actCashierCheck?.role_level || 3;
                            const isOwnerActCheck = localStorage.getItem('admin_active') === 'true' || roleLevelCheck === 1;
                            const specialPermsCheck = actCashierCheck?.permissions?.special || [];

                            if (!canEditData) {
                              alert('ليس لديك صلاحية لتعديل التذكرة (مطلوب صلاحية "تعديل البيانات")');
                              return;
                            }
                            setIsEditModalOpen(true);
                          }} className="flex items-center gap-2 bg-[#ce6f11] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:-translate-y-1 transition-transform">
                            إنشاء تعديل <PenTool className="w-4 h-4" />
                          </button>

                          <button onClick={() => {
                            const actCashierCheck = JSON.parse(localStorage.getItem('active_cashier') || '{}');
                            const roleLevelCheck = actCashierCheck?.role_level || 3;
                            const isOwnerActCheck = localStorage.getItem('admin_active') === 'true' || roleLevelCheck === 1;
                            const specialPermsCheck = actCashierCheck?.permissions?.special || [];

                            if (!isOwnerActCheck && !specialPermsCheck.includes('مرتجع الصيانة')) {
                              alert('ليس لديك صلاحية لإجراء مرتجع صيانة (مطلوب صلاحية "مرتجع الصيانة")');
                              return;
                            }
                            setIsRefundMode(true);
                          }} className="flex items-center gap-2 bg-rose-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-rose-500/30 hover:-translate-y-1 transition-transform">
                            إجراء مرتجع <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Refund UI inside modal */}
                {isRefundMode ? (
                  <div className="p-6 bg-slate-50 dark:bg-white/[0.02] flex-1">
                    <div className="max-w-3xl mx-auto border-2 border-red-100 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                          مرتجع / استرداد <RefreshCw className="w-5 h-5" />
                        </h3>
                        <button onClick={() => setIsRefundMode(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm">عودة للتفاصيل</button>
                      </div>

                      <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 p-4 rounded-xl mb-6 flex justify-between items-center">
                        <div>
                          <div className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-1"><DollarSign className="w-4 h-4 text-amber-500" /> المبلغ المدفوع</div>
                          <div className="text-emerald-600 dark:text-emerald-400 font-black text-xl">{repair.paid_amount || repair.total_amount || 0} ج.م</div>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-500 flex items-center justify-end gap-1 mb-1"><Calendar className="w-4 h-4 text-slate-400" /> تاريخ التسليم</div>
                          <div className="font-bold text-slate-800 dark:text-white" dir="ltr">{new Date(repair.updated_at || Date.now()).toLocaleDateString('ar-EG')}</div>
                          <div className="mt-2 bg-emerald-100/50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/20 inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> باقي 14 يوم على انتهاء فترة الضمان
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          <FileText className="w-4 h-4 text-rose-500" /> سبب المرتجع *
                        </label>
                        <textarea
                          value={refundReason}
                          onChange={e => setRefundReason(e.target.value)}
                          placeholder="اكتب سبب المرتجع هنا... (إجباري)"
                          className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none resize-none h-24"
                        />
                      </div>

                      <div className="mb-8">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          <DollarSign className="w-4 h-4 text-amber-500" /> استرداد المبلغ من
                        </label>
                        <div className="relative">
                          <select
                            value={refundWalletId}
                            onChange={(e) => setRefundWalletId(e.target.value)}
                            className="w-full appearance-none bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-rose-500 outline-none font-bold"
                          >
                            {availableWallets.map(w => (
                              <option key={w.id} value={w.id}>💵 {w.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!refundReason.trim()) return alert('يرجى تحديد سبب المرتجع');
                          setIsConfirmRefundModalOpen(true);
                        }}
                        className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        تأكيد المرتجع والاسترداد <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Tabs Header */}
                    <div className="flex justify-center border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117] overflow-x-auto custom-scrollbar sticky top-0 z-10">
                      <div className="flex gap-6 p-4 min-w-max">
                        {[
                          { id: 'details', label: 'المعلومات', icon: FileText },
                          { id: 'status', label: 'الحالة', icon: RefreshCw },
                          { id: 'financial', label: 'المالية', icon: DollarSign },
                          { id: 'parts', label: 'قطع الغيار', icon: Wrench },
                          { id: 'history', label: 'السجل', icon: History }
                        ].filter(tab => canEditData || ['details', 'history'].includes(tab.id)).map((tab) => {
                          const isActive = activeTab === tab.id;
                          return (
                            <button key={tab.id} disabled={isUpdatingStatus || isLoading} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-2 py-2 text-sm font-bold transition-all border-b-2 ${isActive ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'} ${(isUpdatingStatus || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 bg-slate-50 dark:bg-white/[0.02] min-h-max">

                      {activeTab === 'details' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 max-w-4xl mx-auto py-2">

                          {/* Customer Info */}
                          <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">معلومات العميل</h3>
                              </div>
                              {canEditData && (
                                <button onClick={() => setEditingSection(editingSection === 'customer' ? null : 'customer')} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                                  {editingSection === 'customer' ? <><Check className="w-4 h-4" /> إتمام</> : <><Edit className="w-4 h-4" /> تعديل</>}
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-6 text-center">
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">اسم العميل</div>
                                {editingSection === 'customer' ? (
                                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-center" />
                                ) : (
                                  <div className="font-bold text-slate-900 dark:text-white">{customerName || '----------'}</div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">رقم الهاتف</div>
                                {editingSection === 'customer' ? (
                                  <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-center" dir="ltr" />
                                ) : (
                                  <div className="font-bold text-slate-900 dark:text-white" dir="ltr">{customerPhone || '-'}</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Device Info */}
                          <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">معلومات الجهاز</h3>
                              </div>
                              {canEditData && (
                                <button onClick={() => setEditingSection(editingSection === 'device' ? null : 'device')} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                                  {editingSection === 'device' ? <><Check className="w-4 h-4" /> إتمام</> : <><Edit className="w-4 h-4" /> تعديل</>}
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-6 text-center mb-8">
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">نوع الجهاز</div>
                                <div className="font-bold text-slate-900 dark:text-white">{deviceName?.split(' ')[0] || 'موبايل'}</div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">الماركة والموديل</div>
                                {editingSection === 'device' ? (
                                  <input type="text" value={deviceName} onChange={e => setDeviceName(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-center" />
                                ) : (
                                  <div className="font-bold text-slate-900 dark:text-white truncate">{deviceName || '-'}</div>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-t border-slate-100 dark:border-white/5 pt-6">
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">IMEI / الرقم التسلسلي</div>
                                {editingSection === 'device' ? (
                                  <input type="text" value={imei} onChange={e => setImei(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-center" />
                                ) : (
                                  <div className="font-bold text-slate-900 dark:text-white">{imei || '-'}</div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">كلمة مرور الجهاز</div>
                                {editingSection === 'device' ? (
                                  <input type="text" value={devicePassword} onChange={e => setDevicePassword(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-center" />
                                ) : (
                                  <div className="font-bold text-slate-900 dark:text-white">{devicePassword || '-'}</div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">مكان الجهاز</div>
                                {editingSection === 'device' ? (
                                  <input type="text" value={deviceLocation} onChange={e => setDeviceLocation(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-center" placeholder="الدرج/الرف..." />
                                ) : (
                                  <div className="font-bold text-slate-900 dark:text-white">{deviceLocation || '-'}</div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">الحالة</div>
                                <div className="inline-flex bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold">{status || repair.status || 'مستلم'}</div>
                              </div>
                            </div>
                            <div className="mt-8 text-center border-t border-slate-100 dark:border-white/5 pt-6">
                              <div className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-2">الفني</div>
                              {editingSection === 'device' ? (
                                <input type="text" value={technicianName} onChange={e => setTechnicianName(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-center" />
                              ) : (
                                <div className="font-bold text-slate-900 dark:text-white">{technicianName || '-'}</div>
                              )}
                            </div>
                          </div>

                          {/* Barcode Section */}
                          <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-white/[0.02] text-center flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 mb-4">
                              <Barcode className="w-4 h-4 text-amber-500" /> باركود التذكرة
                            </div>
                            <div className="bg-white px-8 py-4 border border-slate-200 rounded-xl mb-4">
                              <div className="flex gap-[2px] h-12 justify-center mb-2">
                                <div className="w-1 bg-black"></div><div className="w-2 bg-black"></div><div className="w-[1px] bg-black"></div><div className="w-1 bg-black"></div>
                                <div className="w-[3px] bg-black"></div><div className="w-2 bg-black"></div><div className="w-[2px] bg-black"></div><div className="w-3 bg-black"></div>
                                <div className="w-[1px] bg-black"></div><div className="w-[3px] bg-black"></div><div className="w-[1px] bg-black"></div><div className="w-2 bg-black"></div>
                                <div className="w-1 bg-black"></div><div className="w-[2px] bg-black"></div>
                              </div>
                              <div className="text-xs font-mono font-bold tracking-[0.2em] text-slate-900">{repair.id ? `RP${repair.id.toString().padStart(6, '0')}` : 'RP000000'}</div>
                            </div>
                            <button onClick={executePrintBarcode} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-500/20">
                              طباعة الباركود <Printer className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Issue Info */}
                          <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">المشكلة</h3>
                              </div>
                              {canEditData && (
                                <button onClick={() => setEditingSection(editingSection === 'issue' ? null : 'issue')} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                                  {editingSection === 'issue' ? <><Check className="w-4 h-4" /> إتمام</> : <><Edit className="w-4 h-4" /> تعديل</>}
                                </button>
                              )}
                            </div>
                            <div className="text-slate-700 dark:text-slate-300 font-bold whitespace-pre-wrap leading-relaxed text-right">
                              {editingSection === 'issue' ? (
                                <textarea value={issue} onChange={e => setIssue(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none resize-none" rows={3} />
                              ) : (
                                issue || '-'
                              )}
                            </div>
                          </div>

                        </div>
                      )}

                      {activeTab === 'status' && !isRejectMode && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 max-w-4xl mx-auto py-2">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                              تغيير حالة التذكرة
                            </h2>
                            <RefreshCw className="w-5 h-5 text-blue-600" />
                          </div>

                          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-6 text-sm font-bold text-slate-500 dark:text-slate-400">
                              <span className="text-orange-500">⚡</span> تغيير سريع (ضغطة واحدة)
                            </div>

                            <div className="flex flex-row-reverse flex-wrap items-center justify-center gap-3">
                              {[
                                { label: 'مرفوض', value: 'مرفوض', icon: XCircle, inactive: 'bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400', active: 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/30' },
                                { label: 'تم التسليم', value: 'تم التسليم', icon: Package, inactive: 'bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400', active: 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' },
                                { label: 'جاهز للتسليم', value: 'جاهز', icon: CheckSquare, inactive: 'bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400', active: 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' },
                                { label: 'بدء الإصلاح', value: 'تحت الصيانة', icon: Wrench, inactive: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:hover:bg-white/10 dark:bg-white/5 dark:border-white/10 dark:text-white', active: 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' },
                                { label: 'انتظار الموافقة', value: 'قيد الانتظار', icon: Hourglass, inactive: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:hover:bg-white/10 dark:bg-white/5 dark:border-white/10 dark:text-white', active: 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' },
                                { label: 'بدء الفحص', value: 'مستلم', icon: Search, inactive: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:hover:bg-white/10 dark:bg-white/5 dark:border-white/10 dark:text-white', active: 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' }
                              ].map(btn => {
                                const isActive = status === btn.value;
                                return (
                                  <button
                                    key={btn.value}
                                    onClick={() => handleStatusChange(btn.value)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${isActive ? btn.active : btn.inactive}`}
                                  >
                                    <btn.icon className="w-5 h-5 shrink-0" />
                                    {btn.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="relative py-4 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/10"></div></div>
                            <div className="relative bg-white dark:bg-[#0d1117] px-4 text-sm text-slate-500 font-medium">أو اختر من القائمة</div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-right font-bold text-slate-700 dark:text-slate-300 mb-2">الحالة</label>
                              <div className="relative">
                                <select
                                  value={manualStatus}
                                  onChange={e => setManualStatus(e.target.value)}
                                  className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 appearance-none text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                                >
                                  <option value="مستلم">مستلم (قيد الفحص)</option>
                                  <option value="قيد الانتظار">قيد الانتظار</option>
                                  <option value="تحت الصيانة">تحت الصيانة</option>
                                  <option value="جاهز">جاهز للتسليم</option>
                                  <option value="تم التسليم">تم التسليم</option>
                                  <option value="مرفوض">مرفوض</option>
                                </select>
                                <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-right font-bold text-slate-700 dark:text-slate-300 mb-2">ملاحظة (اختياري)</label>
                              <textarea
                                value={statusNote}
                                onChange={e => setStatusNote(e.target.value)}
                                placeholder="ملاحظة (اختياري)"
                                className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none resize-none min-h-[100px]"
                              />
                            </div>

                            <div className="flex justify-start">
                              <button
                                onClick={handleManualStatusUpdate}
                                disabled={isUpdatingStatus}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70"
                              >
                                {isUpdatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                تحديث الحالة
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'status' && isRejectMode && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 max-w-4xl mx-auto py-2">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-rose-600 flex items-center gap-2">
                              رفض الصيانة <XCircle className="w-5 h-5" />
                            </h2>
                            <button disabled={isUpdatingStatus || isLoading} onClick={() => setIsRejectMode(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">إلغاء وعودة</button>
                          </div>

                          <div className="bg-rose-50/50 dark:bg-rose-500/5 border-2 border-rose-100 dark:border-rose-500/20 rounded-2xl p-6">
                            <div className="mb-6">
                              <label className="block text-right font-bold text-slate-700 dark:text-slate-300 mb-2">سبب الرفض *</label>
                              <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="اكتب سبب الرفض هنا..."
                                className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-rose-500 outline-none resize-none min-h-[100px]"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div>
                                <label className="block text-right font-bold text-slate-700 dark:text-slate-300 mb-2">رسوم فحص/كشف وتشييك (ج.م)</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={inspectionFee}
                                    onChange={e => setInspectionFee(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-rose-500 outline-none"
                                  />
                                </div>
                                <div className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                                  المبلغ المدفوع مسبقاً للعميل: <strong className="text-emerald-600">{repair.paid_amount || 0} ج.م</strong>.{' '}
                                  {Math.max(0, Number(repair.paid_amount || 0) - inspectionFee) > 0 ? (
                                    <span>سيتم رد مبلغ <strong className="text-rose-600">{Math.max(0, Number(repair.paid_amount || 0) - inspectionFee)} ج.م</strong> للعميل.</span>
                                  ) : Math.max(0, inspectionFee - Number(repair.paid_amount || 0)) > 0 ? (
                                    <span>مطلوب تحصيل مبلغ <strong className="text-emerald-600">{Math.max(0, inspectionFee - Number(repair.paid_amount || 0))} ج.م</strong> من العميل.</span>
                                  ) : null}
                                </div>
                              </div>
                              {(Math.max(0, Number(repair.paid_amount || 0) - inspectionFee) > 0 || Math.max(0, inspectionFee - Number(repair.paid_amount || 0)) > 0) && (
                                <div>
                                  <label className="block text-right font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {Math.max(0, Number(repair.paid_amount || 0) - inspectionFee) > 0 ? 'سحب مبلغ الاسترداد من' : 'إيداع رسوم الفحص في'}
                                  </label>
                                  <select
                                    value={rejectWalletId}
                                    onChange={e => setRejectWalletId(e.target.value)}
                                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-rose-500 outline-none"
                                  >
                                    <option value="">-- اختر الخزينة/المحفظة --</option>
                                    {availableWallets.map(w => (
                                      <option key={w.id} value={w.id}>
                                        {w.name} {w.balance !== undefined ? `(${w.balance} ج.م)` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-3 mb-8">
                              <label className="flex items-start gap-3 p-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <input type="checkbox" checked={returnPartsToStock} onChange={e => setReturnPartsToStock(e.target.checked)} className="mt-1 w-4 h-4 text-rose-500 rounded border-slate-300 focus:ring-rose-500" />
                                <div>
                                  <div className="font-bold text-slate-800 dark:text-gray-200">إرجاع قطع الغيار المسحوبة إلى المخزن</div>
                                  <div className="text-xs text-slate-500 mt-1">إرجاع أي قطع غيار تمت إضافتها للتذكرة إلى المخزون تلقائياً بسبب رفض العميل للصيانة.</div>
                                </div>
                              </label>

                              <label className="flex items-start gap-3 p-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <input type="checkbox" checked={markAsHandedOver} onChange={e => setMarkAsHandedOver(e.target.checked)} className="mt-1 w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500" />
                                <div>
                                  <div className="font-bold text-emerald-700 dark:text-emerald-400">إخلاء طرف وتسليم الجهاز المرفوض للعميل</div>
                                  <div className="text-xs text-slate-500 mt-1">سيتم تغيير الحالة إلى "مرتجع / تم الاسترداد" إيذاناً بخروج الجهاز من الورشة.</div>
                                </div>
                              </label>
                            </div>

                            <div className="flex justify-start">
                              <button
                                onClick={handleConfirmReject}
                                disabled={isUpdatingStatus}
                                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20 disabled:opacity-70"
                              >
                                {isUpdatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                                تأكيد الرفض
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'financial' && (() => {
                        const { maintenanceBaseCost, partsCost, subTotal, discountAmount, finalTotal } = getFinancialTotals();
                        const totalHistoricallyPaid = paymentsList.reduce((a, p) => a + Number(p.amount || 0), 0);
                        const remainingAmount = Math.max(0, finalTotal - totalHistoricallyPaid);

                        return (
                          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 max-w-2xl mx-auto">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6">
                              <h3 className="text-slate-900 dark:text-gray-200 font-bold mb-6 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-amber-500" /> التحصيل
                              </h3>

                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-slate-600 dark:text-gray-400">
                                    <span className="block mb-2 font-medium">قطع الغيار</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{partsCost.toFixed(2)} ج.م</span>
                                  </div>
                                  <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 text-slate-600 dark:text-gray-400 relative">
                                    <span className="block mb-2 font-medium">تكلفة الصيانة</span>
                                    {isEditingCost ? (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          value={customMaintenanceCost}
                                          onChange={(e) => setCustomMaintenanceCost(e.target.value)}
                                          className="w-20 text-center bg-white dark:bg-black border border-slate-300 dark:border-white/20 rounded py-1 outline-none text-slate-900 dark:text-white"
                                          autoFocus
                                        />
                                        <button onClick={() => getFinancialTotals().previousPartsSum !== undefined && handleUpdateCost(getFinancialTotals().previousPartsSum)} className="text-emerald-500 hover:text-emerald-600"><Check className="w-5 h-5" /></button>
                                        <button onClick={() => setIsEditingCost(false)} className="text-rose-500 hover:text-rose-600"><X className="w-5 h-5" /></button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-2 group">
                                        <span className="font-bold text-slate-700 dark:text-gray-300 text-lg">{maintenanceBaseCost.toFixed(2)} ج.م</span>
                                        <button onClick={() => { setCustomMaintenanceCost(maintenanceBaseCost.toString()); setIsEditingCost(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500 dark:hover:text-blue-400">
                                          <Edit className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4 flex items-center gap-4">
                                  <label className="text-slate-600 dark:text-gray-400 font-medium whitespace-nowrap">الخصم</label>
                                  <select
                                    value={discountType}
                                    onChange={(e) => {
                                      setDiscountType(e.target.value);
                                      if (e.target.value === 'none') setDiscountValue('');
                                    }}
                                    className="flex-1 bg-transparent border-none text-slate-800 dark:text-white focus:ring-0 outline-none"
                                  >
                                    <option value="none">بدون خصم</option>
                                    <option value="percentage">نسبة مئوية (%)</option>
                                    <option value="fixed">مبلغ فني (ج.م)</option>
                                  </select>

                                  {discountType !== 'none' && (
                                    <input
                                      type="number"
                                      value={discountValue}
                                      onChange={(e) => setDiscountValue(e.target.value)}
                                      placeholder={discountType === 'percentage' ? "0%" : "0 ج.م"}
                                      className="w-24 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-center text-slate-800 dark:text-white focus:border-blue-500 outline-none"
                                    />
                                  )}
                                </div>

                                <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
                                  <span className="text-slate-800 dark:text-white font-bold text-lg">التكلفة الإجمالية</span>
                                  <span className="font-black text-slate-900 dark:text-white text-2xl">{finalTotal.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 space-y-6">
                              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
                                <div className="text-center relative">
                                  <span className="block text-slate-600 dark:text-gray-400 font-medium mb-2">إجمالي المدفوع</span>
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{totalHistoricallyPaid.toFixed(2)} ج.م</span>
                                    {totalHistoricallyPaid > 0 && (() => {
                                      const actCashierCheck = JSON.parse(localStorage.getItem('active_cashier') || '{}');
                                      const roleLevelCheck = actCashierCheck?.role_level || 3;
                                      const isOwnerActCheck = localStorage.getItem('admin_active') === 'true' || roleLevelCheck === 1;
                                      if (isOwnerActCheck) {
                                        return (
                                          <button onClick={() => setIsWithdrawPaymentMode(!isWithdrawPaymentMode)} className="text-xs bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-500/10 dark:text-rose-400 px-3 py-1 rounded-full font-bold transition-colors">
                                            سحب مبلغ
                                          </button>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <span className="block text-slate-600 dark:text-gray-400 font-medium mb-2">المتبقي</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                                    {remainingAmount.toFixed(2)} ج.م
                                  </span>
                                </div>
                              </div>

                              {isWithdrawPaymentMode && (
                                <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-white/10 mt-6 bg-rose-50/50 dark:bg-rose-900/10 p-4 rounded-xl">
                                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold mb-4">
                                    <DollarSign className="w-5 h-5" /> سحب دفعة مسجلة بالخطأ
                                  </div>
                                  <div>
                                    <label className="block text-slate-700 dark:text-gray-300 font-medium text-sm mb-2">المبلغ المراد سحبه</label>
                                    <input
                                      type="number"
                                      value={withdrawPaymentAmount}
                                      onChange={e => setWithdrawPaymentAmount(e.target.value)}
                                      className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-slate-700 dark:text-gray-300 font-medium text-sm mb-2">السحب من خزينة</label>
                                    <div className="relative">
                                      <select
                                        value={withdrawPaymentWalletId}
                                        onChange={e => setWithdrawPaymentWalletId(e.target.value)}
                                        className="w-full appearance-none bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-slate-900 dark:text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                                      >
                                        <option value="">-- اختر الخزينة --</option>
                                        {availableWallets.map(w => (
                                          <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                      </select>
                                      <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-slate-700 dark:text-gray-300 font-medium text-sm mb-2">السبب (إجباري)</label>
                                    <input
                                      type="text"
                                      value={withdrawPaymentReason}
                                      onChange={e => setWithdrawPaymentReason(e.target.value)}
                                      className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                                      placeholder="مثال: تسجيل مكرر بالخطأ"
                                    />
                                  </div>
                                  <div className="flex justify-end pt-2">
                                    <button
                                      onClick={handleConfirmWithdrawPayment}
                                      disabled={isUpdatingStatus}
                                      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isUpdatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                      تأكيد السحب
                                    </button>
                                  </div>
                                </div>
                              )}

                              {canEditData && !isWithdrawPaymentMode && (
                                <div className="space-y-4 pt-6">
                                  <div>
                                    <label className="block text-slate-700 dark:text-gray-300 font-medium text-sm mb-2">مبلغ الدفع</label>
                                    <input
                                      type="number"
                                      value={paymentAmount}
                                      onChange={e => setPaymentAmount(e.target.value)}
                                      className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-slate-700 dark:text-gray-300 font-medium text-sm mb-2">طريقة الدفع</label>
                                      <div className="relative">
                                        <select
                                          value={paymentMethod}
                                          onChange={e => {
                                            setPaymentMethod(e.target.value);
                                            // auto select first matching wallet if any
                                            if (e.target.value === 'wallet') {
                                              const ewallets = availableWallets.filter(w => w.type === 'e_wallet');
                                              if (ewallets.length > 0) setSelectedWalletId(ewallets[0].id.toString());
                                            } else if (e.target.value === 'bank') {
                                              const banks = availableWallets.filter(w => w.type === 'bank');
                                              if (banks.length > 0) setSelectedWalletId(banks[0].id.toString());
                                            } else {
                                              const cash = availableWallets.filter(w => w.type === 'cash' || w.is_default);
                                              if (cash.length > 0) setSelectedWalletId(cash[0].id.toString());
                                            }
                                          }}
                                          className="w-full appearance-none bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                        >
                                          <option value="cash">كاش</option>
                                          <option value="wallet">محفظة الكترونية</option>
                                          <option value="bank">تحويل بنكي</option>
                                          <option value="deferred">آجل</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                                      </div>
                                      {paymentMethod === 'deferred' && (
                                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
                                          <Zap className="w-3 h-3" /> الآجل متاح فقط للعملاء المسجلين في النظام
                                        </p>
                                      )}
                                    </div>

                                    {(paymentMethod === 'wallet' || paymentMethod === 'bank' || paymentMethod === 'cash') && (
                                      <div>
                                        <label className="block text-slate-700 dark:text-gray-300 font-medium text-sm mb-2">
                                          {paymentMethod === 'wallet' ? 'اختر المحفظة' : paymentMethod === 'bank' ? 'اختر البنك' : 'اختر الخزينة'}
                                        </label>
                                        <div className="relative">
                                          <select
                                            value={selectedWalletId}
                                            onChange={e => setSelectedWalletId(e.target.value)}
                                            className="w-full appearance-none bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                          >
                                            {availableWallets
                                              .filter(w => {
                                                if (paymentMethod === 'wallet') return w.type === 'e_wallet';
                                                if (paymentMethod === 'bank') return w.type === 'bank';
                                                if (paymentMethod === 'cash') return w.type === 'cash' || (!w.type && w.is_default);
                                                return true;
                                              })
                                              .map(w => (
                                                <option key={w.id} value={w.id}>
                                                  {w.name} {w.is_default && paymentMethod === 'cash' ? '(الرئيسية)' : ''}
                                                </option>
                                              ))}
                                          </select>
                                          <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-slate-700 dark:text-gray-300 font-medium text-sm mb-2">ملاحظة (اختياري)</label>
                                    <textarea
                                      value={paymentNote}
                                      onChange={e => setPaymentNote(e.target.value)}
                                      placeholder="ملاحظة اختيارية..."
                                      className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all h-24 resize-none"
                                    />
                                  </div>

                                  <div className="flex justify-end pt-2">
                                    <button
                                      onClick={handleCollectPayment}
                                      disabled={isCollecting || !paymentAmount || parseFloat(paymentAmount) <= 0}
                                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isCollecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                                      تحصيل
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 text-center">
                              {paymentsList && paymentsList.length > 0 ? (
                                <div className="space-y-4">
                                  <h4 className="text-slate-800 dark:text-white font-bold mb-4 text-right">سجل المدفوعات</h4>
                                  {paymentsList.map(p => (
                                    <div key={p.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 gap-4">
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                          <DollarSign className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-slate-900 dark:text-white">{p.amount} ج.م</p>
                                          <p className="text-sm text-slate-500 dark:text-gray-400">
                                            {new Date(p.date).toLocaleString('ar-EG-u-nu-latn')} • {p.method === 'cash' ? 'كاش' : p.method === 'wallet' ? 'محفظة' : p.method === 'bank' ? 'بنكي' : 'آجل'}
                                            {p.wallet_id && (
                                              <>
                                                {" - "}
                                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                                  {availableWallets.find(w => w.id === Number(p.wallet_id))?.name || ''}
                                                </span>
                                              </>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      {p.note && (
                                        <div className="text-sm text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg max-w-[200px] truncate">
                                          {p.note}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="py-8 opacity-50">
                                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <p className="text-slate-500 dark:text-gray-400 font-bold">لا توجد مدفوعات</p>
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })()}

                      {activeTab === 'parts' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 w-full">

                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between"><h3 className="text-slate-800 dark:text-gray-200 font-bold flex items-center gap-2"><Wrench className="w-5 h-5 text-slate-400" /> قطع الغيار</h3>{canEditData && (<button onClick={() => setIsAddPartModalOpen(true)} className="text-sm font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> إضافة قطعة مباشرة</button>)}</div>

                            {canEditData && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-slate-600 dark:text-slate-400 text-sm font-bold mb-2 block">القطعة</label>
                                  <div className="flex gap-2 relative">
                                    <div className="w-full relative">
                                      <input
                                        id="part_search_input"
                                        type="text"
                                        value={searchPart}
                                        onChange={e => setSearchPart(e.target.value)}
                                        onFocus={() => { setIsPartDropdownOpen(true); if (selectedPart) { setSelectedPart(null); setSearchPart(''); } }}
                                        onBlur={() => setTimeout(() => setIsPartDropdownOpen(false), 200)}
                                        placeholder="ابحث عن قطعة بالاسم أو الصنف..."
                                        className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm"
                                      />
                                      {(isPartDropdownOpen || searchPart) && !selectedPart && (
                                        <div className="absolute z-50 w-full bg-white dark:bg-[#1e232e] border border-slate-200 dark:border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto custom-scrollbar shadow-2xl">
                                          {availableParts.map(part => (
                                            <button
                                              key={part.id}
                                              disabled={part.quantity <= 0}
                                              onClick={() => { setSelectedPart(part); setSearchPart(part.name); setAvailableParts([]); setIsPartDropdownOpen(false); }}
                                              className="w-full text-right px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed border-b border-slate-100 dark:border-white/5 flex justify-between items-center transition-colors"
                                              dir="rtl"
                                            >
                                              <span className="text-slate-800 dark:text-gray-200">{part.name} <span className="text-slate-400 text-sm">({part.sku || '-'})</span></span>
                                              {part.quantity > 0 ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">متاح: {part.quantity}</span>
                                              ) : (
                                                <span className="text-rose-600 dark:text-rose-400 font-medium text-sm">غير متوفر</span>
                                              )}
                                            </button>
                                          ))}
                                          {availableParts.length === 0 && (
                                            <div className="p-4 text-center text-slate-500 dark:text-gray-500">جاري البحث أو لا توجد نتائج...</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-slate-600 dark:text-slate-400 text-sm font-bold mb-2 block">الكمية</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={partQuantity}
                                    onChange={e => setPartQuantity(e.target.value)}
                                    className="w-full h-12 bg-white dark:bg-[#1a1f2e] border border-slate-300 dark:border-white/10 rounded-xl px-4 text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm text-left"
                                  />
                                </div>

                                <div className="flex justify-start">
                                  <button
                                    disabled={!selectedPart || isLoading}
                                    onClick={handleReservePart}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                  >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}  حجز
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden mt-6">
                            <div className="overflow-x-auto">
                              <table className="w-full text-right">
                                <thead>
                                  <tr className="bg-slate-100/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                    <th className="p-4 font-bold text-slate-600 dark:text-gray-300">اسم القطعة</th>
                                    <th className="p-4 font-bold text-slate-600 dark:text-gray-300">الكمية</th>
                                    <th className="p-4 font-bold text-slate-600 dark:text-gray-300">سعر الوحدة</th>
                                    <th className="p-4 font-bold text-slate-600 dark:text-gray-300">الإجمالي</th>
                                    <th className="p-4 font-bold text-slate-600 dark:text-gray-300">الحالة</th>
                                    <th className="p-4 font-bold text-slate-600 dark:text-gray-300">التاريخ</th>
                                    <th className="p-4 font-bold text-slate-600 dark:text-gray-300 text-center">الإجراءات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {repairParts.map((rp, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                      <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{rp.name}</div>
                                        <div className="text-sm text-slate-500">({rp.sku})</div>
                                      </td>
                                      <td className="p-4 font-mono text-slate-700 dark:text-gray-300">{Number(rp.quantity || 1).toFixed(2)}</td>
                                      <td className="p-4 text-slate-700 dark:text-gray-300">{Number(rp.price).toFixed(2)} <span className="text-xs text-slate-400">ج.م</span></td>
                                      <td className="p-4 font-bold text-slate-900 dark:text-white">{Number(rp.total || rp.price * (rp.quantity || 1)).toFixed(2)} <span className="text-xs font-normal text-slate-500">ج.م</span></td>
                                      <td className="p-4">
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white rounded-lg text-sm font-bold">{rp.status || 'محجوز'}</span>
                                      </td>
                                      <td className="p-4 text-slate-500 text-sm font-mono" dir="ltr">
                                        {rp.date ? new Date(rp.date).toLocaleString('ar-EG-u-nu-latn') : '-'}
                                      </td>
                                      <td className="p-4">
                                        {canEditData ? (
                                          <div className="flex gap-2 justify-center">
                                            <button
                                              disabled={isLoading}
                                              onClick={() => handleCancelPart(idx, rp, true)}
                                              className="flex items-center gap-1.5 px-3 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                            >
                                              <Trash2 className="w-4 h-4" /> تالف
                                            </button>
                                            <button
                                              disabled={isLoading}
                                              onClick={() => handleCancelPart(idx, rp, false)}
                                              className="flex items-center gap-1.5 px-3 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                            >
                                              <X className="w-4 h-4" /> إلغاء
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="text-center text-slate-400">-</div>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                  {repairParts.length === 0 && (
                                    <tr>
                                      <td colSpan={7} className="p-8 text-center text-slate-400">لا توجد قطع غيار محجوزة لهذه الصيانة.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'history' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 max-w-2xl mx-auto py-6">
                          <h3 className="text-slate-800 dark:text-gray-200 font-bold flex items-center gap-2 mb-8">
                            <History className="w-5 h-5 text-blue-500" /> سجل الأحداث
                          </h3>

                          <div className="relative border-r-2 border-blue-500/20 pr-6 space-y-8">
                            {repairHistory.length > 0 ? (
                              repairHistory.map((log: any, idx: number) => {
                                // Extract icons based on description context for better visual design
                                let LogIcon = History;
                                let bgColor = 'bg-blue-50 dark:bg-blue-500/10';
                                let iconColor = 'text-blue-500';
                                let dotColor = 'bg-blue-500';

                                if (log.description.includes('الحالة')) {
                                  LogIcon = RefreshCw;
                                  bgColor = 'bg-purple-50 dark:bg-purple-500/10';
                                  iconColor = 'text-purple-500';
                                  dotColor = 'bg-purple-500';
                                } else if (log.description.includes('مستلم') || log.description.includes('استلام')) {
                                  LogIcon = FileText;
                                  bgColor = 'bg-emerald-50 dark:bg-emerald-500/10';
                                  iconColor = 'text-emerald-500';
                                  dotColor = 'bg-emerald-500';
                                } else if (log.description.includes('مالي') || log.description.includes('دفع') || log.description.includes('محفظة')) {
                                  LogIcon = DollarSign;
                                  bgColor = 'bg-rose-50 dark:bg-rose-500/10';
                                  iconColor = 'text-rose-500';
                                  dotColor = 'bg-rose-500';
                                } else if (log.description.includes('قطعة') || log.description.includes('غيار')) {
                                  LogIcon = Wrench;
                                  bgColor = 'bg-amber-50 dark:bg-amber-500/10';
                                  iconColor = 'text-amber-500';
                                  dotColor = 'bg-amber-500';
                                }

                                return (
                                  <div key={idx} className="relative">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -right-[1.95rem] top-3 w-4 h-4 rounded-full ${dotColor} ring-4 ring-white dark:ring-[#0d1117] shadow-sm z-10 flex items-center justify-center`}>
                                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>

                                    <div className="bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                      {/* Side Accent */}
                                      <div className={`absolute right-0 top-0 bottom-0 w-1 ${dotColor} opacity-50 group-hover:opacity-100 transition-opacity`}></div>

                                      <div className="flex gap-4 items-start">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bgColor}`}>
                                          <LogIcon className={`w-6 h-6 ${iconColor}`} />
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="font-bold text-slate-800 dark:text-gray-200 text-sm leading-relaxed mb-1 break-words">
                                            {log.description}
                                          </h4>
                                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400 mt-2 font-mono">
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3.5 h-3.5" />
                                              {new Date(log.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                              <Calendar className="w-3.5 h-3.5" />
                                              {new Date(log.created_at).toLocaleDateString('ar-EG')}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 border-dashed">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                  <History className="w-8 h-8 text-blue-500" />
                                </div>
                                <h4 className="text-slate-800 dark:text-gray-200 font-bold mb-2">لا يوجد سجل أحداث</h4>
                                <p className="text-slate-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                                  لم تسجل أي أحداث أو تغييرات على هذه التذكرة حتى الآن.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </>
                )}
              </div>

              {/* Action Bar */}
              <div className="shrink-0 p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117] flex flex-wrap justify-between items-center gap-4 border-b-0 rounded-b-2xl relative z-20">
                <div className="flex gap-2 flex-wrap">
                  <button disabled={isUpdatingStatus || isLoading} onClick={executePrintReceipt} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Receipt className="w-4 h-4" /> طباعه فاتورة
                  </button>
                 
                  <button disabled={isUpdatingStatus || isLoading} onClick={executePrintReceipt} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Receipt className="w-4 h-4" /> إنشاء فاتورة
                  </button>
                  <button disabled={isUpdatingStatus || isLoading} onClick={() => sendWhatsAppInvoice(repair, repair.status)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors tooltip tooltip-top disabled:opacity-50 disabled:cursor-not-allowed" data-tip="إرسال الفاتورة عبر واتساب">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {canEditData && (
                    <button onClick={handleUpdate} disabled={isLoading || isUpdatingStatus} className="px-8 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center gap-2 disabled:cursor-not-allowed">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddSparePartModal
        isOpen={isAddPartModalOpen}
        onClose={() => setIsAddPartModalOpen(false)}
        onSuccess={() => { setIsAddPartModalOpen(false); /* Force fetch next time */ setSearchPart(' '); setTimeout(() => setSearchPart(''), 10); }}
      />

      {/* Confirm Refund Modal */}
      <AnimatePresence>
        {isConfirmRefundModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm"
              onClick={() => !isLoading && setIsConfirmRefundModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0d1117] rounded-3xl shadow-2xl p-6 overflow-hidden"
              dir="rtl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-500 rounded-[2rem] flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20 text-white">
                  <RefreshCw className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">تأكيد المرتجع</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
                  سيتم استرداد مبلغ <span className="font-bold text-slate-700 dark:text-slate-300">{repair.paid_amount || repair.total_amount || 0} ج.م</span> للعميل وتغيير حالة التذكرة إلى "مرتجع".
                  <br /> السبب: {refundReason}
                </p>

                {repairParts.length > 0 && (
                  <label className="flex items-center gap-2 mb-6 cursor-pointer bg-slate-50 dark:bg-white/5 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 w-full justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <input type="checkbox" checked={returnPartsToStock} onChange={e => setReturnPartsToStock(e.target.checked)} className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 bg-white" />
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{repairParts.length} قطعة ترجع للمخزون</span>
                  </label>
                )}

                <div className="flex w-full gap-3">
                  <button onClick={handleConfirmRefund} disabled={isLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>تأكيد المرتجع <RefreshCw className="w-4 h-4" /></>}
                  </button>
                  <button onClick={() => setIsConfirmRefundModalOpen(false)} disabled={isLoading} className="flex-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold py-3 rounded-xl transition-all">
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Ticket Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0d1117] rounded-xl shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117]">
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
                <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">إنشاء تذكرة تعديل <PenTool className="w-5 h-5" /></h3>
                <div className="w-5"></div>
              </div>

              <div className="p-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">سبب التعديل (إلزامي - 20 حرف على الأقل)</label>
                <textarea
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                  placeholder="ادخل سبب التعديل (20 حرف على الأقل)..."
                  className="w-full bg-white dark:bg-black/40 border-2 border-blue-500 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none resize-none h-32 text-sm font-medium"
                />
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex gap-3 justify-end">
                <button onClick={() => setIsEditModalOpen(false)} disabled={isLoading} className="px-6 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-2">
                  إلغاء <X className="w-4 h-4" />
                </button>
                <button onClick={handleCreateEditTicket} disabled={isLoading || editReason.length < 20} className="px-6 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors flex items-center gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>إنشاء التعديل <Check className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
        {repair && (
          <>
            {settings?.maintenanceReceiptTemplate === 'second_detailed' ? (
              <PrintMaintenanceReceiptSecondDetailed
                ref={receiptPrintRef}
                repair={repair}
              />
            ) : settings?.maintenanceReceiptTemplate === 'detailed' ? (
              <PrintMaintenanceReceiptDetailed
                ref={receiptPrintRef}
                repair={repair}
              />
            ) : (
              <PrintMaintenanceReceipt
                ref={receiptPrintRef}
                repair={repair}
              />
            )}
            <PrintMaintenanceInvoice
              ref={invoicePrintRef}
              repair={repair}
            />
            {settings?.maintenanceStickerTemplate === 'first' ? (
              <PrintMaintenanceStickerFirst ref={barcodePrintRef} repair={repair} />
            ) : settings?.maintenanceStickerTemplate === 'seconde' ? (
              <PrintMaintenanceStickerSecond ref={barcodePrintRef} repair={repair} />
            ) : settings?.maintenanceStickerTemplate === 'third' ? (
              <PrintMaintenanceStickerThird ref={barcodePrintRef} repair={repair} />
            ) : (
              <PrintMaintenanceSticker ref={barcodePrintRef} repair={repair} />
            )}
          </>
        )}
      </div>
    </>
  );
}
function NewRepairModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void | Promise<void> }) {
  const { settings } = useSettings();
  const { branches } = useBranch();
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const invoicePrintRef = useRef<HTMLDivElement>(null);
  const barcodePrintRef = useRef<HTMLDivElement>(null);
  const printQueueRef = useRef<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [successData, setSuccessData] = useState<any>(null);

  const [printQueue, setPrintQueue] = useState<string>('');

  const executePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: 'Receipt',
    pageStyle: `@page { margin: 0; } @media print { body { margin: 0; } }`,
  });

  const barcodeWidth = settings?.barcodeWidth || '50mm';
  const barcodeHeight = settings?.barcodeHeight || '30mm';

  const executePrintBarcode = useReactToPrint({
    contentRef: barcodePrintRef,
    documentTitle: 'Barcode',
    onAfterPrint: () => {
      if (printQueueRef.current === 'both') {
        printQueueRef.current = '';
        setTimeout(() => executePrintReceipt(), 500);
      }
    },
    pageStyle: `@page { size: ${settings?.barcodeWidth || '50mm'} ${settings?.barcodeHeight || '30mm'}; margin: 0; } @media print { body { margin: 0; } }`,
  });
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    save_customer: false,
    device_type: 'موبايل',
    company: '',
    device_name: '',
    issue: '',
    technician_name: '',
    total_amount: '',
    paid_amount: '',
    payment_method: 'cash',
    notes: '',
    imei: '',
    password_type: 'num',
    password: '',
    has_box: false,
    selected_accessories: [] as string[],
    other_accessory: '',
    branch_id: '',
    device_location: ''
  });

  const DEVICE_TYPES = [
    { label: 'موبايل', icon: '📱' },
    { label: 'تابلت', icon: '📟' },
    { label: 'لابتوب', icon: '💻' },
    { label: 'كمبيوتر', icon: '🖥️' },
    { label: 'طابعة', icon: '🖨️' },
    { label: 'اير بودز', icon: '🎧' },
    { label: 'هيد فون', icon: '🎧' },
    { label: 'ساعه سمارت', icon: '⌚' },
    { label: 'باور بانك', icon: '🔋' },
    { label: 'صب', icon: '🔊' },
    { label: 'أخرى', icon: '📦' },
  ];

  const COMPANIES = [
    { label: 'Apple', icon: '🍎' },
    { label: 'Samsung', icon: '🗄️' },
    { label: 'Oppo', icon: '🈁' },
    { label: 'Realme', icon: '⚡' },
    { label: 'Vivo', icon: '📳' },
    { label: 'Xiaomi', icon: '🔧' },
    { label: 'Huawei', icon: '🌐' },
    { label: 'Nokia', icon: '📞' },
    { label: 'Infinix', icon: '🔥' },
    { label: 'Tecno', icon: '💡' },
    { label: 'Honor', icon: '✨' },
    { label: 'Lenovo', icon: '💻' },
    { label: 'HP', icon: '💻' },
    { label: 'Dell', icon: '💻' },
    { label: 'شاومي', icon: '📱' },
    { label: 'ريلمي', icon: '📱' },
    { label: 'هونر', icon: '📱' },
    { label: 'صودو', icon: '🎧' },
    { label: 'انكر', icon: '🔋' },
    { label: 'ساوند كور', icon: '🔊' },
    { label: 'صيني', icon: '📦' },
    { label: 'لينوفو', icon: '💻' },
    { label: 'أخرى...', icon: '✏️' },
  ];

  const ACCESSORIES = [
    { label: 'شاحن', icon: '🔌' },
    { label: 'سماعات', icon: '🎧' },
    { label: 'علبة', icon: '📦' },
    { label: 'كفر', icon: '🛡️' },
    { label: 'حامي شاشة', icon: '🔲' },
    { label: 'كابل بيانات', icon: '🔗' },
    { label: 'بطاقة ذاكرة', icon: '💾' },
  ];

  const handleAccessoryToggle = (lbl: string) => {
    setFormData(prev => ({
      ...prev,
      selected_accessories: prev.selected_accessories.includes(lbl) ? prev.selected_accessories.filter(a => a !== lbl) : [...prev.selected_accessories, lbl]
    }));
  };

  const handleClose = () => {
    setFormData({
      customer_name: '', customer_phone: '', save_customer: false, device_type: 'موبايل', company: '', device_name: '', issue: '', technician_name: '',
      total_amount: '', paid_amount: '', payment_method: '', notes: '', imei: '', password_type: 'num', password: '', has_box: false, selected_accessories: [], other_accessory: '', branch_id: '', device_location: ''
    });
    setShowExtraDetails(false);
    onClose();
  };

  const [availableWallets, setAvailableWallets] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchEmployeesAndWallets = async () => {
        try {
          const userId = localStorage.getItem('user_id');
          const token = localStorage.getItem('access_token');
          const activeBranchId = localStorage.getItem('takka_active_branch_id');
          const tenantId = localStorage.getItem('tenant_id') || userId;
          const tenantQuery = `tenant_id=eq.${tenantId}`;
          const branchQuery = (activeBranchId && activeBranchId !== 'ALL') ? `&branch_id=eq.${activeBranchId}` : '';

          const [empRes, walletsRes] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&tenant_id=eq.${tenantId}&order=created_at.desc`, {
              headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${SUPABASE_URL}/rest/v1/wallets?select=*,branches(name)&${tenantQuery}${branchQuery}&order=is_default.desc,id.asc`, {
              headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
            })
          ]);

          if (empRes.ok) {
            setEmployees(await empRes.json());
          }
          if (walletsRes.ok) {
            let data = await walletsRes.json();
            data = data.map((w: any) => ({ ...w, name: w.branches && w.branches.name ? `${w.name} - (${w.branches.name})` : w.name }));
            setAvailableWallets(data);
            if (data.length > 0) {
              setFormData(prev => ({ ...prev, payment_method: data[0].id.toString() }));
            }
          }
        } catch (err) { }
      };
      fetchEmployeesAndWallets();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      // 🚨 Security System: Check Blacklist Before Accepting Repair
      if (formData.imei) {
        const query = encodeURIComponent(formData.imei);
        const blacklistRes = await fetch(`${SUPABASE_URL}/rest/v1/Blacklist?imei=eq.${query}`, {
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => null);

        if (blacklistRes && blacklistRes.ok) {
          const blacklistData = await blacklistRes.json();
          if (blacklistData.length > 0) {
            const badDevice = blacklistData[0];
            alert(`🚨 تحذير أمني: يرجى إبلاغ الشرطة أو التحفظ على الجهاز! السيريال (${badDevice.imei}) مسجل في البلاك ليست كـ "${badDevice.status === 'stolen' ? 'مسروق' : badDevice.status === 'lost' ? 'مفقود' : 'تحت التحقيق'}" وتم الإبلاغ عنه بواسطة: ${badDevice.reporter_name} (${badDevice.reporter_phone || ''}). لا يمكنك استلام لعمل صيانة.`);
            setIsLoading(false);
            return;
          }
        }
      }


      let finalDeviceName = formData.device_name;
      if (formData.company && formData.company !== 'أخرى...' && !finalDeviceName.toLowerCase().includes(formData.company.toLowerCase())) {
        finalDeviceName = `${formData.company} ${finalDeviceName}`;
      }
      if (!finalDeviceName.includes(formData.device_type) && formData.device_type !== 'موبايل') {
        finalDeviceName = `${formData.device_type} ${finalDeviceName}`;
      }

      let finalNotes = '';
      if (formData.password) {
        finalNotes += `🔒 كلمة المرور (${formData.password_type === 'pattern' ? 'نمط' : 'نص'}): ${formData.password}\n\n`;
      }
      if (formData.device_location) {
        finalNotes += `📍 مكان الجهاز: ${formData.device_location}\n\n`;
      }
      if (formData.selected_accessories.length > 0) {
        finalNotes += `📦 الملحقات: ${formData.selected_accessories.join('، ')}\n`;
      }
      if (formData.other_accessory) {
        finalNotes += `📦 ملحقات أخرى: ${formData.other_accessory}\n`;
      }
      if (formData.notes) {
        finalNotes += `\n📝 ملاحظات: ${formData.notes}\n`;
      }

      if (formData.paid_amount && parseFloat(formData.paid_amount) > 0) {
        const initialPayment = [{
          id: 'initial-' + Date.now().toString(),
          amount: parseFloat(formData.paid_amount),
          date: new Date().toISOString(),
          method: formData.payment_method,
          note: 'عربون صيانة أولي'
        }];
        finalNotes += `\n===PAYMENTS===\n${JSON.stringify(initialPayment)}\n===`;
      }

      const activeBranchId = localStorage.getItem('takka_active_branch_id');

      const payload = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone || null,
        device_name: finalDeviceName,
        issue: formData.issue,
        imei: formData.imei || null,
        notes: finalNotes.trim() || null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        paid_amount: formData.paid_amount ? parseFloat(formData.paid_amount) : 0,
        remaining_amount: (formData.total_amount ? parseFloat(formData.total_amount) : 0) - (formData.paid_amount ? parseFloat(formData.paid_amount) : 0),
        status: 'قيد الانتظار',
        technician_name: formData.technician_name || null,
        user_id: userId,
        receiving_branch_id: formData.branch_id || activeBranchId || null,
        repairing_branch_id: formData.branch_id || activeBranchId || null,
        tenant_id: userId
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/Repairs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        const createdRepair = result[0] || payload;
        if (createdRepair.id) {
          logToCRM(createdRepair.id, `تم الاستلام - الحالة: قيد الانتظار`);

          if (formData.save_customer && formData.customer_name.trim()) {
            try {
              const userDataStr = localStorage.getItem('user_data');
              const userData = userDataStr ? JSON.parse(userDataStr) : null;
              await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': API_KEY,
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  name: formData.customer_name,
                  phone: formData.customer_phone || '',
                  initial_balance: 0,
                  created_at: new Date().toISOString(),
                  user_id: userData?.id
                })
              });
            } catch (e) {
              console.error('Failed to save customer', e);
            }
          }

          if (payload.paid_amount > 0) {
            await addMaintenanceToSalesAndShift(payload.paid_amount, createdRepair.id, createdRepair.device_name, createdRepair.customer_name, formData.payment_method, false, payload.total_amount, payload.remaining_amount, payload.paid_amount, payload.receiving_branch_id);

            // Insert to pending drawer
            try {
              const targetWalletId = formData.payment_method;
              await processTreasuryTransaction(
                isNaN(Number(formData.payment_method)) ? null : Number(formData.payment_method),
                payload.paid_amount,
                'in',
                'مشتريات قطع غيار صيانة',
                `مقدم (عربون) صيانة - تذكرة صيانة رقم #${createdRepair.id} - الهاتف: ${createdRepair.device_name || ''} - للعميل: ${createdRepair.customer_name || ''}`,
                payload.receiving_branch_id
              );
            } catch (txErr) { }
          }
        }
        setSuccessData(createdRepair);
        await onSuccess();
      } else {
        const errorData = await response.json();
        alert('حدث خطأ: ' + (errorData.message || 'فشل الحفظ'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintSticker = (repairData: any) => {
    const formattedId = repairData.id
      ? `R-${new Date(repairData.created_at || Date.now()).getFullYear()}${(new Date(repairData.created_at || Date.now()).getMonth() + 1).toString().padStart(2, '0')}-${repairData.id.toString().padStart(5, '0')}`
      : 'R-NEW';

    const stickerHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>طباعة ستيكر - ${repairData.id || ''}</title>
        <style>
          @page { size: auto; margin: 0mm; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 10px; 
            width: fit-content;
            font-size: 14px;
            color: #000;
          }
          .container {
            border: 1px dashed black; padding: 10px; width: 60mm; text-align: center;
          }
          .header { font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; display: flex; justify-content: space-between; }
          .row { margin-bottom: 3px; display: flex; justify-content: space-between; font-size: 12px; }
          .device { font-weight: bold; margin-top: 10px; text-align: center; }
          .issue { text-align: center; font-weight: bold; margin-top: 10px; margin-bottom: 10px;}
          .footer { border-top: 1px dashed #000; padding-top: 5px; text-align: left; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span>I-MAXX</span>
            <span>#${formattedId}</span>
          </div>
          <div class="row">
            <span>${repairData.customer_phone || ''}</span>
            <span>${repairData.customer_name ? '...' + repairData.customer_name.substring(0, 10) : ''}</span>
          </div>
          <div class="device">
             ${repairData.device_name || 'غير محدد'}
          </div>
          <div class="issue">
             ${repairData.issue || 'لا يوجد وصف للحالة'}
          </div>
          <div class="footer">
            ${new Date(repairData.created_at || Date.now()).toLocaleDateString('ar-EG')}
          </div>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(stickerHtml);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }, 300);
    }
  };

  const handlePrintReceipt = (repairData: any) => {
    const formattedId = repairData.id
      ? `R-${new Date(repairData.created_at || Date.now()).getFullYear()}${(new Date(repairData.created_at || Date.now()).getMonth() + 1).toString().padStart(2, '0')}-${repairData.id.toString().padStart(5, '0')}`
      : 'R-NEW';

    const receiptHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>إيصال استلام صيانة - ${formattedId}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 10px; 
            width: 80mm;
            font-size: 14px;
            color: #000;
          }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          .header h2 { margin: 0; font-size: 20px; }
          .header p { margin: 5px 0 0 0; font-size: 12px; }
          table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
          table th, table td { padding: 5px 0; text-align: right; border-bottom: 1px dotted #ccc; }
          table th { width: 35%; color: #555; font-size: 12px; }
          table td { font-weight: bold; }
          .amount { font-size: 16px; text-align: center; margin: 15px 0; padding: 10px; border: 1px dashed #000; border-radius: 5px;}
          .terms { font-size: 10px; color: #555; text-align: justify; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-weight: bold; font-size: 12px; border-top: 2px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>إيصال استلام صيانة</h2>
          <p>رقم الإيصال: ${formattedId}</p>
          <p>التاريخ: ${new Date(repairData.created_at || Date.now()).toLocaleString('ar-EG')}</p>
        </div>
        
        <table>
          <tr>
            <th>اسم العميل</th>
            <td>${repairData.customer_name || 'غير مسجل'}</td>
          </tr>
          <tr>
            <th>رقم الموبايل</th>
            <td dir="ltr" style="text-align: right;">${repairData.customer_phone || 'غير مسجل'}</td>
          </tr>
          <tr>
            <th>الجهاز</th>
            <td>${repairData.device_name || 'غير محدد'}</td>
          </tr>
          <tr>
            <th>المشكلة</th>
            <td>${repairData.issue || '-'}</td>
          </tr>
        </table>

        ${repairData.total_amount !== null && repairData.total_amount !== undefined ? `
        <div class="amount">
           <div>التكلفة المتوقعة: ${repairData.total_amount} ج.م</div>
           ${repairData.paid_amount ? `<div>المدفوع مقدماً: ${repairData.paid_amount} ج.م</div>` : ''}
           <div>المتبقي: ${repairData.remaining_amount} ج.م</div>
        </div>
        ` : ''}

        <div class="terms">
          <b>شروط وأحكام الصيانة:</b><br/>
          - المتجر غير مسئول عن الجهاز بعد مرور 30 يوماً من إبلاغ العميل بانتهاء الصيانة.<br/>
          - يجب إحضار هذا الإيصال عند استلام الجهاز.<br/>
          - المتجر غير مسؤول عن أي محتويات داخل الجهاز غير مذكورة بالإيصال.
        </div>

        <div class="footer">
          شكراً لاختياركم مركز صيانة I-MAXX
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(receiptHtml);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }, 300);
    }
  };

  if (successData) {
    const formattedId = successData.id
      ? `R-${new Date(successData.created_at || Date.now()).getFullYear()}${(new Date(successData.created_at || Date.now()).getMonth() + 1).toString().padStart(2, '0')}-${successData.id.toString().padStart(5, '0')}`
      : 'R-NEW';

    return (
      <>
        <AnimatePresence>
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              dir="rtl"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Check className="w-8 h-8 text-white" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2 mt-4">تم تسجيل الاستلام بنجاح!</h2>
                  <div className="inline-block bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 px-4 py-2 mt-2 rounded-xl font-mono text-sm font-bold border border-slate-200 dark:border-white/10">
                    رقم التذكرة: {formattedId}
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-white/5 pt-6 mt-6">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">هل تريد طباعة المستندات؟</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => executePrintBarcode()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                    >
                      طباعة ستيكر الجهاز
                      <Barcode className="w-4 h-4 text-amber-300" />
                    </button>
                    <button
                      onClick={() => executePrintReceipt()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                    >
                      طباعة إيصال الاستلام
                      <FileText className="w-4 h-4 text-white/80" />
                    </button>
                    <button
                      onClick={() => {
                        printQueueRef.current = 'both';
                        executePrintBarcode();
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-blue-600 dark:text-blue-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-blue-200 dark:border-blue-500/20"
                    >
                      طباعة الاثنين
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#080c13] flex justify-center">
                <button
                  onClick={() => {
                    setSuccessData(null);
                    onClose();
                    setFormData({
                      customer_name: '', customer_phone: '', save_customer: false, device_name: '',
                      issue: '', technician_name: '', total_amount: '', paid_amount: '', payment_method: '', notes: '', imei: '',
                      device_type: 'موبايل', company: '', password_type: 'pattern', password: '', has_box: false, selected_accessories: [], other_accessory: '', branch_id: '', device_location: ''
                    });
                  }}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors w-full max-w-[200px]"
                >
                  تخطي
                </button>
              </div>

            </motion.div>
          </div>
        </AnimatePresence>
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
          {settings?.maintenanceReceiptTemplate === 'second_detailed' ? (
            <PrintMaintenanceReceiptSecondDetailed
              ref={receiptPrintRef}
              repair={successData}
            />
          ) : settings?.maintenanceReceiptTemplate === 'detailed' ? (
            <PrintMaintenanceReceiptDetailed
              ref={receiptPrintRef}
              repair={successData}
            />
          ) : (
            <PrintMaintenanceReceipt
              ref={receiptPrintRef}
              repair={successData}
            />
          )}
          {settings?.maintenanceStickerTemplate === 'first' ? (
            <PrintMaintenanceStickerFirst ref={barcodePrintRef} repair={successData} />
          ) : settings?.maintenanceStickerTemplate === 'seconde' ? (
            <PrintMaintenanceStickerSecond ref={barcodePrintRef} repair={successData} />
          ) : settings?.maintenanceStickerTemplate === 'third' ? (
            <PrintMaintenanceStickerThird ref={barcodePrintRef} repair={successData} />
          ) : (
            <PrintMaintenanceSticker ref={barcodePrintRef} repair={successData} />
          )}
        </div>
      </>
    );
  }

  const commonIssues = [
    { label: 'شاشة مكسورة', icon: Smartphone },
    { label: 'تغيير بطارية', icon: DollarSign },
    { label: 'لا يشحن', icon: Wrench },
    { label: 'سقط في الماء', icon: AlertCircle },
    { label: 'مشكلة سوفتوير', icon: Settings },
    { label: 'سماعة / مايك', icon: Phone },
    { label: 'مشكلة كاميرا', icon: Eye },
    { label: 'هاوسنج', icon: Smartphone },
    { label: 'فرام', icon: Smartphone },
    { label: 'صوت', icon: Phone },
    { label: 'لا يعمل نهائي', icon: AlertCircle },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              dir="rtl"
            >
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#080c13]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">استلام جهاز للصيانة</h2>
                </div>
                <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="new-repair-form" onSubmit={handleSubmit} className="space-y-6">

                  {/* Common Issues Quick Select */}
                  <div className="bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      أعطال شائعة (اضغط للتعبئة التلقائية)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {commonIssues.map((issue, idx) => (
                        <button
                          key={idx} type="button"
                          onClick={() => setFormData({ ...formData, issue: formData.issue ? `${formData.issue} + ${issue.label}` : issue.label })}
                          className="flex items-center gap-2 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          <issue.icon className="w-3.5 h-3.5 text-slate-500" />
                          {issue.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 relative">
                    <h3 className="absolute -top-3 right-6 bg-white dark:bg-[#0d1117] px-2 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Edit className="w-4 h-4 text-rose-400" /> البيانات الأساسية
                    </h3>

                    <div className="space-y-6 mt-4">
                      {!localStorage.getItem('takka_active_branch_id') && branches?.length > 0 && (
                        <div className="md:col-span-2 mb-6">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 focus-within:text-blue-500">
                            الفرع <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              required
                              value={formData.branch_id}
                              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                              className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all appearance-none"
                            >
                              <option value="">— اختر الفرع —</option>
                              {branches.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 focus-within:text-blue-500">اسم العميل <span className="text-rose-500">*</span></label>
                          <input
                            type="text" required
                            value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-[#11151c]"
                            placeholder="اسم العميل..."
                          />
                          {formData.customer_name.trim().length > 0 && (
                            <label className="mt-2 flex items-center justify-start gap-2 cursor-pointer w-max">
                              <input type="checkbox" checked={formData.save_customer} onChange={e => setFormData({ ...formData, save_customer: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-black/40" />
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">حفظ في قائمة العملاء</span>
                            </label>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 focus-within:text-blue-500">رقم الهاتف</label>
                          <input
                            type="tel" dir="ltr"
                            value={formData.customer_phone} onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                            className="w-full text-right bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-[#11151c]"
                            placeholder="01012345678"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 focus-within:text-blue-500">نوع الجهاز</label>
                          <div className="relative">
                            <input
                              list="device-types-list"
                              value={formData.device_type} onChange={e => setFormData({ ...formData, device_type: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-[#11151c]"
                              placeholder="اختر أو اكتب نوع الجهاز..."
                            />
                            <datalist id="device-types-list">
                              {DEVICE_TYPES.map(dt => (
                                <option key={dt.label} value={dt.label}>{dt.label} {dt.icon}</option>
                              ))}
                            </datalist>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 focus-within:text-blue-500">الشركة</label>
                          <div className="relative">
                            <input
                              list="companies-list"
                              value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-[#11151c]"
                              placeholder="اختر أو اكتب الشركة..."
                            />
                            <datalist id="companies-list">
                              {COMPANIES.map(c => (
                                <option key={c.label} value={c.label}>{c.label} {c.icon}</option>
                              ))}
                            </datalist>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 focus-within:text-blue-500">IMEI / الرقم التسلسلي</label>
                          <input
                            type="text" dir="ltr"
                            value={formData.imei} onChange={e => setFormData({ ...formData, imei: e.target.value })}
                            className="w-full text-right bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-[#11151c]"
                            placeholder="أدخل IMEI أو الرقم التسلسلي..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 focus-within:text-blue-500">الجهاز <span className="text-rose-500">*</span></label>
                          <input
                            type="text" required
                            value={formData.device_name} onChange={e => setFormData({ ...formData, device_name: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-[#11151c]"
                            placeholder="مثال: iPhone 13 Pro, Samsung A54"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 focus-within:text-blue-500">مكان الجهاز (الدرج/الرف)</label>
                          <input
                            type="text"
                            value={formData.device_location} onChange={e => setFormData({ ...formData, device_location: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-[#11151c]"
                            placeholder="مثال: درج 5، رف 2"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 focus-within:text-blue-500">المشكلة <span className="text-rose-500">*</span></label>
                        <textarea
                          required rows={3}
                          value={formData.issue} onChange={e => setFormData({ ...formData, issue: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all resize-none focus:bg-white dark:focus:bg-[#11151c]"
                          placeholder="وصف المشكلة..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 text-center">الفني المسؤول</label>
                      <div className="relative">
                        <select
                          value={formData.technician_name} onChange={e => setFormData({ ...formData, technician_name: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all appearance-none text-center"
                        >
                          <option value="">— اختر الفني —</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    <div className={Number(formData.paid_amount) > 0 ? "col-span-1" : ""}>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 text-center flex items-center justify-center gap-1"><DollarSign className="w-3 h-3 text-emerald-500" /> العربون</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.paid_amount} onChange={e => setFormData({ ...formData, paid_amount: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pl-10 text-sm font-bold text-slate-900 dark:text-white text-center focus:border-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-[#11151c]"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {Number(formData.paid_amount) > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 text-center">طريقة الدفع</label>
                        <div className="relative">
                          <select
                            value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all appearance-none text-center"
                          >
                            {availableWallets.length === 0 ? <option value="cash">كاش</option> : null}
                            {availableWallets.map(w => (
                              <option key={w.id} value={w.id.toString()}>{w.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 text-center flex items-center justify-center gap-1"><DollarSign className="w-3 h-3 text-amber-500" /> التكلفة الإجمالية</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.total_amount} onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pl-10 text-sm font-bold text-slate-900 dark:text-white text-center focus:border-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-[#11151c]"
                          placeholder="اتركه فارغ = تحت الفحص"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Extra Details Toggle */}
                  <div className="text-center">
                    <button type="button" onClick={() => setShowExtraDetails(!showExtraDetails)} className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-2 mx-auto">
                      {showExtraDetails ? 'إخفاء التفاصيل الإضافية' : 'تفاصيل إضافية (كلمة المرور، الملحقات...)'}
                      <Plus className={`w-4 h-4 transition-transform ${showExtraDetails ? 'rotate-45' : ''}`} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {showExtraDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-6 mt-4">

                          <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">كلمة مرور الجهاز</label>
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <div className="flex bg-slate-100 dark:bg-white/5 rounded-r-xl border border-l-0 border-slate-200 dark:border-white/10 overflow-hidden">
                                    <button type="button"
                                      onClick={() => setFormData({ ...formData, password_type: 'num' })}
                                      className={`px-4 py-3 text-sm font-bold border-l border-slate-200 dark:border-white/10 flex items-center gap-2 transition-all ${formData.password_type === 'num' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                    >
                                      نص <Type className="w-4 h-4" />
                                    </button>
                                    <button type="button"
                                      onClick={() => setFormData({ ...formData, password_type: 'pattern' })}
                                      className={`px-4 py-3 text-sm font-bold flex items-center gap-2 transition-all ${formData.password_type === 'pattern' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                    >
                                      نمط <Link className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <input
                                    type={formData.password_type === 'num' ? 'text' : 'text'}
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={formData.password_type === 'num' ? "كلمة المرور..." : "اكتب أرقام النمط مثلاً (1-2-3)..."}
                                    className="flex-1 bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-l-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                                  />
                                </div>
                              </div>
                              <button type="button" className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#11151c] text-slate-400 hover:text-slate-700 dark:hover:text-white">
                                <EyeOff className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                              <Box className="w-4 h-4 text-amber-500" /> الملحقات المستلمة
                            </label>
                            <div className="flex flex-wrap gap-3">
                              {ACCESSORIES.map(acc => {
                                const isSelected = formData.selected_accessories.includes(acc.label);
                                return (
                                  <button
                                    key={acc.label} type="button"
                                    onClick={() => handleAccessoryToggle(acc.label)}
                                    className={`flex items-center gap-3 px-4 py-2.5 border rounded-xl transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#11151c] hover:border-slate-300 dark:hover:border-white/20'}`}
                                  >
                                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 whitespace-nowrap">
                                      {acc.label} <span className="text-lg opacity-80">{acc.icon}</span>
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                            <div className="mt-4 flex">
                              <button type="button" className="shrink-0 bg-blue-600 text-white font-bold px-6 py-3 rounded-r-xl outline-none hover:bg-blue-700 transition-colors">
                                + إضافة
                              </button>
                              <input
                                value={formData.other_accessory} onChange={e => setFormData({ ...formData, other_accessory: e.target.value })}
                                type="text" placeholder="أو اكتب ملحق آخر..."
                                className="flex-1 bg-slate-50 dark:bg-[#11151c] border border-r-0 border-slate-200 dark:border-white/10 rounded-l-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                              />
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 text-right">ملاحظات إضافية</label>
                            <textarea
                              rows={3}
                              value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all resize-none"
                              placeholder="أي ملاحظات أخرى..."
                            />
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </form>
              </div>

              {/* Footer */}
              <div className="shrink-0 p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#080c13] flex items-center justify-start gap-3">
                <button
                  type="submit" form="new-repair-form" disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  تسجيل الاستلام
                </button>
                <button
                  type="button" onClick={handleClose}
                  className="px-8 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
        {successData && (
          <>
            {settings?.maintenanceReceiptTemplate === 'second_detailed' ? (
              <PrintMaintenanceReceiptSecondDetailed
                ref={receiptPrintRef}
                repair={successData}
              />
            ) : settings?.maintenanceReceiptTemplate === 'detailed' ? (
              <PrintMaintenanceReceiptDetailed
                ref={receiptPrintRef}
                repair={successData}
              />
            ) : (
              <PrintMaintenanceReceipt
                ref={receiptPrintRef}
                repair={successData}
              />
            )}
            {settings?.maintenanceStickerTemplate === 'first' ? (
              <PrintMaintenanceStickerFirst ref={barcodePrintRef} repair={successData} />
            ) : settings?.maintenanceStickerTemplate === 'seconde' ? (
              <PrintMaintenanceStickerSecond ref={barcodePrintRef} repair={successData} />
            ) : settings?.maintenanceStickerTemplate === 'third' ? (
              <PrintMaintenanceStickerThird ref={barcodePrintRef} repair={successData} />
            ) : (
              <PrintMaintenanceSticker ref={barcodePrintRef} repair={successData} />
            )}
          </>
        )}
      </div>
    </>
  );
}

// ==========================================
// Daily Close Modal Component
// ==========================================
function DailyCloseModal({ isOpen, onClose, repairs, closedCollections, shiftRevenue, onSuccess }: { isOpen: boolean, onClose: () => void, repairs: any[], closedCollections: number, shiftRevenue: number, onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  const actCashierCheck = JSON.parse(localStorage.getItem('active_cashier') || '{}');
  const roleLevelCheck = actCashierCheck?.role_level || 3;
  const isOwnerActCheck = localStorage.getItem('admin_active') === 'true' || roleLevelCheck === 1;

  const todayStr = new Date().toDateString();
  const shiftTickets = repairs.filter(r => new Date(r.created_at).toDateString() === todayStr);
  const newTicketsToday = shiftTickets.length;
  // Dynamic stats based on what changed today
  const deliveredTickets = shiftTickets.filter(r => r.status === 'تم التسليم').length;
  const openTickets = shiftTickets.filter(r => r.status !== 'تم التسليم' && r.status !== 'مرفوض' && !r.status?.includes('لغ')).length;
  const cancelledTickets = shiftTickets.filter(r => r.status === 'مرفوض' || r.status?.includes('لغ')).length;

  const stats = {
    newTickets: newTicketsToday,
    delivered: deliveredTickets,
    cancelled: cancelledTickets,
    open: openTickets,
  };

  const shiftCollected = closedCollections;
  const shiftExpected = shiftRevenue;

  const deposits = shiftTickets.filter(r => (r.paid_amount || 0) > 0 && r.status !== 'تم التسليم');

  // We'll calculate total open deposits as is.
  const absoluteDepositsTotal = deposits.reduce((acc, curr) => acc + (curr.paid_amount || 0), 0);
  const depositsTotal = Math.max(0, absoluteDepositsTotal); // Use actual absolute deposits for this shift

  const [bankAmount, setBankAmount] = useState(0);
  const [walletAmount, setWalletAmount] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [partsCost, setPartsCost] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // 1. partsCost 
      let totalPartsCost = 0;
      for (const r of repairs) {
        if (new Date(r.created_at).toDateString() !== todayStr) continue;
        if (r.notes && r.notes.includes('===PARTS===')) {
          try {
            const partsStr = r.notes.split('===PARTS===\n')[1].split('\n===')[0];
            const parts = JSON.parse(partsStr);
            totalPartsCost += parts.reduce((acc: number, p: any) => acc + Number(p.price || 0), 0);
          } catch (e) { }
        }
      }
      setPartsCost(totalPartsCost);

      // 2. Fetch pending txs & wallets to split cash, bank, wallet amounts
      const fetchTxs = async () => {
        const token = localStorage.getItem('access_token');
        const userId = localStorage.getItem('user_id');
        const activeBranchId = localStorage.getItem('takka_active_branch_id');
        const tenantQuery = activeBranchId && activeBranchId !== 'ALL' ? `branch_id.eq.${activeBranchId},branch_id.is.null` : `user_id.eq.${userId}`;

        const tenantId = localStorage.getItem('tenant_id') || userId;
        try {
          const [txsRes, walletsRes] = await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=amount,type,wallet_id,category&or=(${tenantQuery})&category=in.(${encodeURIComponent('"إيراد صيانة - درج","مرتجع صيانة - درج"')})`, { headers: { apikey: API_KEY, Authorization: `Bearer ${token}` } }),
            fetch(`${SUPABASE_URL}/rest/v1/wallets?select=id,type&tenant_id=eq.${tenantId}`, { headers: { apikey: API_KEY, Authorization: `Bearer ${token}` } })
          ]);

          let bAmt = 0; let wAmt = 0; let cAmt = 0;
          if (txsRes.ok && walletsRes.ok) {
            const txs = await txsRes.json();
            const wallets = await walletsRes.json();
            for (const tx of txs) {
              const w = wallets.find((w: any) => w.id === tx.wallet_id);
              const wType = w?.type || 'cash'; // default to cash if no wallet
              const amt = tx.type === 'out' || tx.category === 'مرتجع صيانة - درج' ? -Number(tx.amount || 0) : Number(tx.amount || 0);
              if (wType === 'bank') bAmt += amt;
              else if (wType === 'e_wallet') wAmt += amt;
              else cAmt += amt;
            }
          }
          setBankAmount(bAmt);
          setWalletAmount(wAmt);
          setCashAmount(cAmt);
        } catch (e) { }
      };
      fetchTxs();
    }
  }, [isOpen, repairs, todayStr]);

  const netProfit = shiftCollected - partsCost;

  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

      if (shiftCollected > 0 || shiftExpected > 0 || true) { // Always run to process any refunds too
        const activeBranchId = localStorage.getItem('takka_active_branch_id');
        const tenantQuery = activeBranchId && activeBranchId !== 'ALL' ? `branch_id.eq.${activeBranchId},branch_id.is.null` : `user_id.eq.${userId}`;

        // Fetch all pending maintenance transactions
        const pendingRes = await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?select=*&or=(${tenantQuery})&category=in.(${encodeURIComponent('"إيراد صيانة - درج","مرتجع صيانة - درج"')})`, {
          headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
        });

        if (pendingRes.ok) {
          const pendingTxs = await pendingRes.json();

          const patchPromises = [];

          // Change category of pending transactions to completed
          patchPromises.push(
            fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?category=eq.${encodeURIComponent('مشتريات قطع غيار صيانة')}&or=(${tenantQuery})`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ category: 'إيراد صيانة' })
            })
          );
          patchPromises.push(
            fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions?category=eq.${encodeURIComponent('مرتجع صيانة - درج')}&or=(${tenantQuery})`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ category: 'مرتجع صيانة' })
            })
          );

          // Record the generic Daily Close summary row anyway just as a report event, but with 0 amount to not double count
          patchPromises.push(
            fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                wallet_id: null,
                user_id: userId,
                type: 'in',
                amount: 0,
                category: 'إيراد صيانة',
                description: `تقفيل يومية الصيانة - عدد ${stats.newTickets} تذاكر. ${notes ? `ملاحظات: ${notes}` : ''} | الإيرادات: ${shiftExpected.toFixed(2)} | المحصل: ${shiftCollected.toFixed(2)}`,
                date: new Date().toISOString(),
                branch_id: localStorage.getItem('takka_active_branch_id') === 'ALL' ? null : (localStorage.getItem('takka_active_branch_id') || null)
              })
            })
          );

          await Promise.all(patchPromises);
        }
      }

      setSubmitMessage({ type: 'success', text: 'تم التقفيل وتوريد المبلغ بنجاح!' });

      if (onSuccess) {
        setTimeout(async () => {
          await onSuccess();
          onClose();
        }, 1500);
      } else {
        setTimeout(onClose, 1500);
      }
    } catch (err) {
      console.error(err);
      setSubmitMessage({ type: 'error', text: 'حدث خطأ أثناء التقفيل' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:items-start" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-[#080c13]/80 backdrop-blur-md print:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:border-none print:bg-white print:text-black print:max-w-full"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-6 bg-slate-50 dark:bg-[#111520] border-b border-slate-200 dark:border-white/5 print:bg-white print:border-b-2 print:border-black">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg border border-slate-200 dark:border-white/10 print:hidden">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-cyan-400 print:text-black flex items-center gap-2">
                    تقفيل يومية الصيانة
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-slate-200/50 dark:bg-slate-800/50 print:bg-transparent px-3 py-1.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 print:text-black flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    من البداية حتى الآن
                  </div>
                  <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors print:hidden">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar print:overflow-visible print:max-h-full">
              {submitMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl text-sm font-bold text-center ${submitMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
                >
                  {submitMessage.text}
                </motion.div>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-[#22283a] print:bg-slate-50 border border-slate-200 dark:border-white/5 print:border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-amber-500/10 print:bg-amber-100 rounded-xl flex items-center justify-center text-amber-500 dark:text-amber-400 print:text-amber-600 mb-2">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black text-amber-500 dark:text-amber-400 print:text-amber-600 mb-1">{stats.newTickets}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">تذاكر جديدة</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#22283a] print:bg-slate-50 border border-slate-200 dark:border-white/5 print:border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-rose-500/10 print:bg-rose-100 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 print:text-rose-600 mb-2">
                    <X className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black text-rose-500 dark:text-rose-400 print:text-rose-600 mb-1">{stats.cancelled}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">ملغاة</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#22283a] print:bg-slate-50 border border-slate-200 dark:border-white/5 print:border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-emerald-500/10 print:bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-500 dark:text-emerald-400 print:text-emerald-600 mb-2">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-500 dark:text-emerald-400 print:text-emerald-600 mb-1">{stats.delivered}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">تم التسليم</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#22283a] print:bg-slate-50 border border-slate-200 dark:border-white/5 print:border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-purple-500/10 print:bg-purple-100 rounded-xl flex items-center justify-center text-purple-500 dark:text-purple-400 print:text-purple-600 mb-2">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black text-purple-500 dark:text-purple-400 print:text-purple-600 mb-1">{stats.open}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 font-medium">مفتوحة</p>
                </div>
              </div>

              {/* Financial Box */}
              <div className="bg-slate-50 dark:bg-[#1f2536] print:bg-white border border-slate-200 dark:border-white/5 print:border-slate-300 rounded-2xl p-6 relative">
                <div className="flex items-center gap-2 mb-6">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white print:text-black">الملخص المالي</h3>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 relative">
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 dark:bg-white/5 print:bg-black/10"></div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400 print:text-slate-600 text-sm mb-2 font-medium">التحصيلات</p>
                    <p className="text-3xl font-black text-purple-600 dark:text-purple-400 print:text-purple-700 font-mono">
                      {shiftCollected.toFixed(2)} <span className="text-base text-purple-600/60 dark:text-purple-400/60 font-sans">ج.م</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400 print:text-slate-600 text-sm mb-2 font-medium">الإيرادات</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 print:text-emerald-700 font-mono">
                      {shiftExpected.toFixed(2)} <span className="text-base text-emerald-600/60 dark:text-emerald-400/60 font-sans">ج.م</span>
                    </p>
                  </div>
                </div>

                {deposits.length > 0 && (
                  <>
                    <div className="border-t border-dashed border-slate-200 dark:border-white/10 print:border-slate-300 my-4"></div>
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 print:border-amber-400 print:bg-amber-50 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 print:bg-amber-200 rounded-full flex items-center justify-center shrink-0">
                        <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-500 print:text-amber-700" />
                      </div>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-500 print:text-amber-700 w-full flex justify-between items-center">
                        <span>إجمالي العربونات (غير مسلّمة):</span>
                        <span>{depositsTotal.toFixed(2)} ج.م ({deposits.length})</span>
                      </p>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white dark:bg-[#1a1f2e] print:bg-slate-50 border border-slate-200 dark:border-white/5 print:border-slate-300 rounded-xl p-3 text-center">
                    <CreditCard className="w-5 h-5 text-slate-400 dark:text-slate-500 print:text-slate-600 mb-2 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-700 mb-1">بنك</p>
                    <p className="text-lg font-bold text-blue-500 dark:text-[#38bdf8] print:text-blue-600 font-mono">{bankAmount.toFixed(2)}</p>
                  </div>
                  <div className="bg-white dark:bg-[#1a1f2e] print:bg-slate-50 border border-slate-200 dark:border-white/5 print:border-slate-300 rounded-xl p-3 text-center">
                    <Smartphone className="w-5 h-5 text-slate-400 dark:text-slate-500 print:text-slate-600 mb-2 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-700 mb-1">محفظة</p>
                    <p className="text-lg font-bold text-purple-500 dark:text-[#a78bfa] print:text-purple-600 font-mono">{walletAmount.toFixed(2)}</p>
                  </div>
                  <div className="bg-white dark:bg-[#1a1f2e] print:bg-slate-50 border border-slate-200 dark:border-white/5 print:border-slate-300 rounded-xl p-3 text-center">
                    <DollarSign className="w-5 h-5 text-slate-400 dark:text-slate-500 print:text-slate-600 mb-2 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-700 mb-1">كاش</p>
                    <p className="text-lg font-bold text-emerald-500 dark:text-[#34d399] print:text-emerald-600 font-mono">{cashAmount.toFixed(2)}</p>
                  </div>
                </div>

                {isOwnerActCheck && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white dark:bg-[#1a1f2e] print:bg-slate-50 border border-slate-200 dark:border-white/5 print:border-slate-300 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 print:text-slate-700 mb-1">صافي الربح</p>
                        <p className="text-lg font-bold text-emerald-500 dark:text-emerald-400 print:text-emerald-600 font-mono">{netProfit.toFixed(2)} <span className="text-xs font-sans text-emerald-500/50">ج.م</span></p>
                      </div>
                      <DollarSign className="w-8 h-8 text-emerald-500/10 dark:text-emerald-500/20" />
                    </div>
                    <div className="bg-white dark:bg-[#1a1f2e] print:bg-slate-50 border border-slate-200 dark:border-white/5 print:border-slate-300 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 print:text-slate-700 mb-1">تكلفة القطع</p>
                        <p className="text-lg font-bold text-rose-500 dark:text-rose-400 print:text-rose-600 font-mono">{partsCost.toFixed(2)} <span className="text-xs font-sans text-rose-500/50">ج.م</span></p>
                      </div>
                      <Wrench className="w-8 h-8 text-rose-500/10 dark:text-rose-500/20" />
                    </div>
                  </div>
                )}

              </div>

              {/* Notes Context */}
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold text-sm mb-3 flex items-center gap-2 print:text-black">
                  <Edit className="w-4 h-4 text-emerald-500" />
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111520] border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-slate-300 outline-none focus:border-emerald-500/50 transition-colors resize-none print:hidden placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="ملاحظات إضافية..."
                  rows={2}
                />
                <div className="hidden print:block min-h-[60px] border border-slate-300 rounded-xl p-4 text-black text-sm">
                  {notes || 'لا توجد ملاحظات إضافية.'}
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="shrink-0 p-4 bg-slate-50 dark:bg-[#111520] border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-3 print:hidden">
              <button
                type="button" onClick={onClose}
                className="px-5 py-3 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-24"
              >
                إغلاق
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button" onClick={handlePrint}
                  className="px-6 py-3 rounded-lg text-sm font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2 flex-1 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                >
                  <Printer className="w-4 h-4" />
                  طباعة التقرير
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-lg text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 flex-1 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  تأكيد التقفيل
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ==========================================
// Receive Payment Modal Component
// ==========================================
function ReceivePaymentModal({ isOpen, onClose, repairs, onSuccess }: { isOpen: boolean, onClose: () => void, repairs: any[], onSuccess: () => void | Promise<void> }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const fetchWallets = async () => {
        try {
          const token = localStorage.getItem('access_token');
          // Fetch ALL wallets the current user has access to.
          const userId = localStorage.getItem('user_id');
          // For an owner, it fetches all. We will filter them on the client based on selected repair!
          const activeBranchId = localStorage.getItem('takka_active_branch_id');
          // NOTE: For owner, activeBranchId might be empty. 
          const tenantQuery = `tenant_id=eq.${localStorage.getItem('tenant_id') || userId}`;
          const branchQuery = (activeBranchId && activeBranchId !== 'ALL') ? `&branch_id=eq.${activeBranchId}` : '';
          const res = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=*,branches(name)&${tenantQuery}${branchQuery}&order=is_default.desc,id.asc`, {
            headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            let data = await res.json();
            data = data.map((w: any) => ({
              ...w,
              name: w.branches && w.branches.name ? `${w.name} - (${w.branches.name})` : w.name
            }));
            setAvailableWallets(data);
          }
        } catch (e) { }
      };
      fetchWallets();
    }
  }, [isOpen]);

  // Derived filtered wallets based on selected repair
  const displayedWallets = availableWallets.filter(w => {
    if (!selectedRepair) return true; // Show all available before selection
    const repairBranchId = selectedRepair.receiving_branch_id || selectedRepair.branch_id;
    // If the repair has a branch, strictly show only that branch's wallets
    if (repairBranchId) {
      return w.branch_id === repairBranchId;
    }
    return true;
  });

  // Auto-select first wallet when selectedRepair changes
  useEffect(() => {
    if (displayedWallets.length > 0) {
      const defaultW = displayedWallets.find(w => w.is_default);
      if (defaultW) setSelectedWalletId(defaultW.id.toString());
      else setSelectedWalletId(displayedWallets[0].id.toString());
    } else {
      setSelectedWalletId('');
    }
  }, [selectedRepair, availableWallets]);


  const filteredRepairs = repairs.filter(r => {
    const ticketId = r.id ? `R-${new Date(r.created_at || Date.now()).getFullYear()}${(new Date(r.created_at || Date.now()).getMonth() + 1).toString().padStart(2, "0")}-${r.id.toString().padStart(5, "0")}` : "R-NEW";
    return r.status !== 'تم التسليم' &&
      (r.id?.toString().includes(searchTerm) ||
        r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer_phone?.includes(searchTerm) ||
        ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        searchTerm.includes(r.id?.toString()));
  });

  const handlePayment = async () => {
    if (!selectedRepair || !paymentAmount) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const amount = parseFloat(paymentAmount);

      const newPaidAmount = (selectedRepair.paid_amount || 0) + amount;
      const newRemainingAmount = (selectedRepair.total_amount || 0) - newPaidAmount;

      // Extract existing payments to append to notes
      let existingNotes = selectedRepair.notes || '';
      let existingPayments: any[] = [];
      const partsPattern = /===PAYMENTS===\n([\s\S]*?)(?=\n===|$)/;
      const match = existingNotes.match(partsPattern);
      if (match && match[1]) {
        try { existingPayments = JSON.parse(match[1]); } catch (e) { }
      }

      const selectedW = availableWallets.find(w => w.id.toString() === selectedWalletId);
      const derivedMethod = selectedW?.type === 'e_wallet' ? 'wallet' : selectedW?.type === 'bank' ? 'bank' : 'cash';

      const newPayment = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        amount: amount,
        method: derivedMethod,
        wallet_id: selectedWalletId,
        note: 'استلام دفعة نقدية سريعة'
      };
      existingPayments.push(newPayment);

      const updateSectionLocal = (text: string, sectionTitle: string, data: any) => {
        let base = text;
        const pattern = new RegExp(`\\n?===${sectionTitle}===\\n[\\s\\S]*?(?=\\n===|$)`, 'g');
        base = base.replace(pattern, '').trim();
        if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
          base += (base ? '\n' : '') + `===${sectionTitle}===\n${JSON.stringify(data)}`;
        }
        return base.trim();
      };

      existingNotes = updateSectionLocal(existingNotes, 'PAYMENTS', existingPayments);

      const payload = {
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
        notes: existingNotes
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/Repairs?id=eq.${selectedRepair.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await processTreasuryTransaction(
          selectedWalletId ? Number(selectedWalletId) : null,
          amount,
          'in',
          'مشتريات قطع غيار صيانة',
          `دفع تكلفة / باقي حساب صيانة رقم #${selectedRepair.id} - الهاتف: ${selectedRepair.device_name || ''} - للعميل: ${selectedRepair.customer_name || ''}`,
          localStorage.getItem('takka_active_branch_id') === 'ALL' ? null : (localStorage.getItem('takka_active_branch_id') || null)
        );

        await addMaintenanceToSalesAndShift(amount, selectedRepair.id, selectedRepair.device_name, selectedRepair.customer_name, derivedMethod, false, selectedRepair.total_amount, newRemainingAmount, newPaidAmount, selectedRepair.receiving_branch_id);

        await logToCRM(selectedRepair.id, `إضافة دفعة مالية: ${amount} ج.م`);

        await onSuccess();
        onClose();
        setSelectedRepair(null);
        setPaymentAmount('');
        setSearchTerm('');
      } else {
        alert('حدث خطأ أثناء تسجيل الدفعة');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            dir="rtl"
          >
            <div className="shrink-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#080c13]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">استلام دفعة نقدية</h2>
              </div>
              <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {!selectedRepair ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ابحث برقم التذكرة أو العميل أو الهاتف..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {searchTerm && filteredRepairs.length === 0 && (
                      <p className="text-center text-slate-500 text-sm py-4">لا توجد نتائج</p>
                    )}
                    {searchTerm && filteredRepairs.map(repair => (
                      <button
                        key={repair.id}
                        onClick={() => setSelectedRepair(repair)}
                        className="w-full text-right bg-slate-50 dark:bg-[#080c13] hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 transition-colors flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{repair.customer_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">R-{repair.id} | {repair.device_name}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-slate-500">المتبقي</p>
                          <p className="text-sm font-bold text-orange-400">{repair.remaining_amount || 0} ج.م</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedRepair.customer_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">R-{selectedRepair.id} | {selectedRepair.device_name}</p>
                    </div>
                    <button
                      onClick={() => setSelectedRepair(null)}
                      className="text-xs text-orange-400 hover:text-orange-300"
                    >
                      تغيير التذكرة
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">المبلغ المدفوع (ج.م)</label>
                    <input
                      type="number"
                      value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all"
                      placeholder="0.00"
                      autoFocus
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      المتبقي الحالي: <span className="text-orange-400">{selectedRepair.remaining_amount || 0} ج.م</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">إضافة إلى المحفظة</label>
                    <div className="relative">
                      <select
                        value={selectedWalletId}
                        onChange={e => setSelectedWalletId(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all pr-10"
                      >
                        {displayedWallets.map(w => (
                          <option key={w.id} value={w.id}>💵 {w.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#080c13] flex items-center justify-end gap-3">
              <button
                type="button" onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handlePayment}
                disabled={isLoading || !selectedRepair || !paymentAmount}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-slate-900 dark:text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                تأكيد الدفع
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}










