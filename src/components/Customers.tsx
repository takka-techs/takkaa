import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { useSettings } from '../contexts/SettingsContext';
import { PrintStatementTemplate } from './PrintStatementTemplate';
import { PrintCashReceiptTemplate } from './PrintCashReceiptTemplate';
import { PrintConsolidatedInvoiceTemplate } from './PrintConsolidatedInvoiceTemplate';
import { format, parseISO } from 'date-fns';
import InstallmentContracts from './Installments/InstallmentContracts';
import {
  Users, Search, Plus, Download, Upload,
  Trash2, Edit, Eye, Filter, RefreshCw,
  Phone, MapPin, Calendar, CreditCard,
  TrendingUp, TrendingDown, DollarSign,
  MoreVertical, UserPlus, FileSpreadsheet,
  CheckCircle2, AlertCircle, Loader2, X,
  Printer, FileText, MessageCircle, Share2, Landmark, AlertTriangle
  , ReceiptText
} from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  initial_balance?: number;
  total_debt?: number;
  credit_limit?: number;
  category?: string;
  notes?: string;
  created_at: string;
  user_id?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [consolidatedCustomer, setConsolidatedCustomer] = useState<Customer | null>(null);
  const [consolidatedDate, setConsolidatedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [consolidatedData, setConsolidatedData] = useState<any>(null);
  const [isConsolidatedLoading, setIsConsolidatedLoading] = useState(false);
  const consolidatedPrintRef = useRef<HTMLDivElement>(null);

  const handlePrintConsolidated = useReactToPrint({
    contentRef: consolidatedPrintRef,
  });

  const fetchConsolidatedData = async () => {
    if (!consolidatedCustomer) return;
    setIsConsolidatedLoading(true);
    try {
      const tenantId = localStorage.getItem('tenant_id');
      const token = localStorage.getItem('access_token');
      const apikey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

      let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Sales_Invoices?customer_name=eq.${encodeURIComponent(consolidatedCustomer.name)}&select=*,Sales_Items(*)`;
      if (tenantId) url += `&tenant_id=eq.${tenantId}`;

      const response = await fetch(url, {
        headers: {
          'apikey': apikey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch invoices');
      const invoices = await response.json();

      // Filter by selected date
      const targetDateStr = consolidatedDate;
      const targetInvoices = invoices.filter(inv => {
        // Invoices created_at format: 2026-07-16T12:00:00Z
        const d = new Date(inv.created_at);
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 10);
        return localISOTime === targetDateStr;
      });

      // Aggregate Items
      const itemsMap = new Map<string, any>();
      let totalAmount = 0;
      let paidAmount = 0;
      let remainingAmount = 0;

      for (const inv of targetInvoices) {
        // skip cancelled or returned invoices if they are fully reversed
        // for simplicity, let's include normal invoices.
        if (inv.status === 'مرتجعة') continue;

        // Only add net amounts for valid sales
        const invNet = Number(inv.net_amount ?? inv.total_amount) || 0;
        const invPaid = Number(inv.paid_amount) || 0;
        totalAmount += invNet;
        paidAmount += invPaid;
        remainingAmount += Number(inv.remaining_amount) || 0;

        for (const item of (inv.Sales_Items || [])) {
          // if item was returned, its name might have "(مرتجع)"
          if ((item.product_name || item.item_name || '').includes('(مرتجع)')) continue; // skip returned items

          const key = item.product_id ? `${item.product_type}_${item.product_id}` : item.item_name;
          if (itemsMap.has(key)) {
            const ex = itemsMap.get(key);
            ex.quantity += Number(item.quantity) || 0;
            ex.total_price += Number(item.total_price) || 0;
          } else {
            itemsMap.set(key, {
              name: item.product_name || item.item_name,
              quantity: Number(item.quantity) || 0,
              unit_price: Number(item.unit_price) || 0,
              total_price: Number(item.total_price) || 0,
              type: item.product_type || item.item_type,
              imei: item.imei
            });
          }
        }
      }

      setConsolidatedData({
        customerName: consolidatedCustomer.name,
        date: targetDateStr,
        items: Array.from(itemsMap.values()),
        totalAmount,
        paidAmount,
        remainingAmount
      });

    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء جلب الفواتير المجمعة');
    } finally {
      setIsConsolidatedLoading(false);
    }
  };

  useEffect(() => {
    if (consolidatedCustomer) {
      fetchConsolidatedData();
    }
  }, [consolidatedCustomer, consolidatedDate]);


  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Bulk WhatsApp state
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState(false);
  const [bulkWhatsAppMessage, setBulkWhatsAppMessage] = useState('');
  const [sentWhatsAppCustomerIds, setSentWhatsAppCustomerIds] = useState<number[]>([]);

  // New/Edit Customer form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    initial_balance: 0,
    balance_type: 'debt', // 'debt' for مدين, 'credit' for دائن
    credit_limit: 0,
    category: '',
    notes: ''
  });

  // Collect variables
  const [wallets, setWallets] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveData, setReceiveData] = useState({
    clientId: '',
    amount: '',
    walletId: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statement variables
  const [statementData, setStatementData] = useState<any[]>([]);
  const [isStatementLoading, setIsStatementLoading] = useState(false);
  const [statementFilter, setStatementFilter] = useState('all');
  const [statementDateFrom, setStatementDateFrom] = useState('');
  const [statementDateTo, setStatementDateTo] = useState('');
  const [customerViewTab, setCustomerViewTab] = useState<'statement' | 'installments'>('statement');

  const { settings } = useSettings();

  // --- Printing Refs ---
  const statementPrintRef = useRef<HTMLDivElement>(null);
  const cashReceiptPrintRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  const executePrintStatement = useReactToPrint({
    contentRef: statementPrintRef,
    documentTitle: `Statement-${viewCustomer?.name || 'Customer'}`,
    pageStyle: `@page { size: A4; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; margin: 0; } }`,
  });

  const executePrintCashReceipt = useReactToPrint({
    contentRef: cashReceiptPrintRef,
    documentTitle: `Receipt-${receiptData?.receiptId || 'Payment'}`,
    pageStyle: '',
  });

  const handlePrintStatement = () => {
    executePrintStatement();
  };

  const handlePrintCashReceipt = (data: any) => {
    setReceiptData(data);
    setTimeout(() => {
      executePrintCashReceipt();
    }, 100);
  };

  const fetchStatementData = async (customer: Customer) => {
    setIsStatementLoading(true);
    setStatementData([]);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      const customerNameEnc = encodeURIComponent(customer.name);

      const invoicesRes = await fetch(`${baseUrl}/Sales_Invoices?customer_name=eq.${customerNameEnc}&select=*`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token}` }
      });
      const txsRes = await fetch(`${baseUrl}/treasury_transactions?select=*`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token}` }
      });

      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];
      let txs = txsRes.ok ? await txsRes.json() : [];

      // Filter txs: category needs to match and description should contain customer name
      const clientTxs = txs.filter((tx: any) =>
        tx.category === 'مقبوضات عملاء' && tx.description && tx.description.includes(customer.name)
      );

      const combined = [
        ...invoices.map((inv: any) => ({
          date: inv.created_at,
          type: 'فاتورة',
          description: `فاتورة مبيعات رقم #${inv.id || inv.invoice_number || ''}`,
          debt: inv.net_amount || inv.total_amount || 0,
          paid: inv.paid_amount || 0,
          id: inv.id,
          ref: `inv_${inv.id}`
        })),
        ...clientTxs.map((tx: any) => ({
          date: tx.date || tx.created_at,
          type: 'دفعة نقدية',
          description: tx.description,
          debt: 0,
          paid: tx.amount || 0,
          id: tx.id,
          ref: `tx_${tx.id}`
        }))
      ];

      combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let runningBalance = customer.initial_balance || 0; // if this is current, running balance backwards is hard. Let's just calculate "الرصيد" assuming initial is the starting. Wait, the `initial_balance` is updated with debt! It's actually the current balance.
      // Easiest is to set running balance from start. Wait, the DB updates `initial_balance` to be the running balance (decreased by payment, increased by debt). 
      // If we use `initial_balance` as starting, we need historical initial balance which we don't have.
      // So we will calculate backwards from the CURRENT initial_balance. Or we can just calculate from 0 if we assume history is complete.
      // Since it's dynamic, let's calculate backwards from current balance.
      let currentBal = customer.initial_balance || 0;
      for (let i = combined.length - 1; i >= 0; i--) {
        combined[i].balance = currentBal;
        currentBal = currentBal - combined[i].debt + combined[i].paid; // Rollback
      }

      setStatementData(combined);
    } catch (err) {
      console.error('Error fetching statement data:', err);
    } finally {
      setIsStatementLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchWalletsAndShift();
  }, []);

  const fetchWalletsAndShift = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      const userId = localStorage.getItem('user_id');
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const branchSuffix = activeBranchId && activeBranchId !== 'ALL' ? `&branch_id=eq.${activeBranchId}` : '';
      const tenantId = localStorage.getItem('tenant_id') || userId;

      const [walletsRes, shiftsRes] = await Promise.all([
        fetch(`${baseUrl}/wallets?select=*,branches(name)${branchSuffix}&tenant_id=eq.${tenantId}`, {
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/shifts?select=*${branchSuffix}&user_id=eq.${userId}${(() => { const cStr = localStorage.getItem('active_cashier'); if (cStr) { try { const c = JSON.parse(cStr); if (c && c.role_level !== 1) return '&cashier_name=eq.' + encodeURIComponent(c.full_name || c.username || c.name || 'موظف مبيعات'); else if (c && c.role_level === 1) return (c.full_name || c.username || c.name) ? `&or=(cashier_name.is.null,cashier_name.eq.${encodeURIComponent(c.full_name || c.username || c.name)})` : '&cashier_name=is.null'; } catch (e) { } } return '&cashier_name=is.null'; })()}&status=eq.open&order=created_at.desc&limit=1`, {
          headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (walletsRes.ok) {
        setWallets(await walletsRes.json());
      }
      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setActiveShift(shiftsData.length > 0 && shiftsData[0].status === 'open' ? shiftsData[0] : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${baseUrl}/clients?select=*&order=created_at.desc`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('فشل جلب بيانات العملاء');
      const data = await response.json();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiveSubmit = async () => {
    if (!activeShift) {
      alert('يجب فتح وردية أولاً');
      return;
    }
    if (!receiveData.clientId) {
      alert('الرجاء اختيار العميل');
      return;
    }
    if (!receiveData.walletId) {
      alert('الرجاء اختيار طريقة الدفع/الخزينة');
      return;
    }
    if (!receiveData.amount || isNaN(Number(receiveData.amount)) || Number(receiveData.amount) <= 0) {
      alert('الرجاء إدخال مبلغ صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const userId = localStorage.getItem('user_id');
      const headers = {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${token}`
      };

      const selectedClient = customers.find(c => c.id.toString() === receiveData.clientId.toString());
      if (!selectedClient) throw new Error('العميل غير موجود');

      const amountToReceive = Number(receiveData.amount);

      // 1. Record transaction in treasury_transactions
      await fetch(`${baseUrl}/treasury_transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          wallet_id: parseInt(receiveData.walletId),
          user_id: userId || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3',
          type: 'in',
          amount: amountToReceive,
          category: 'مقبوضات عملاء',
          description: `استلام دفعة من العميل: ${selectedClient.name} - ${receiveData.notes || ''}`.trim(),
          date: new Date().toISOString()
        })
      });

      // 2. Update wallet balance
      const selectedWallet = wallets.find(w => w.id.toString() === receiveData.walletId.toString());
      if (selectedWallet) {
        await fetch(`${baseUrl}/wallets?id=eq.${receiveData.walletId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ balance: Number(selectedWallet.balance) + amountToReceive })
        });
      }

      // 3. Update shift expected amount and deposits count
      if (activeShift) {
        const patchBody: any = { deposits_count: Number(activeShift.deposits_count || 0) + 1 };
        if (selectedWallet && selectedWallet.type === 'cash') {
          patchBody.expected_amount = Number(activeShift.expected_amount || 0) + amountToReceive;
        }
        await fetch(`${baseUrl}/shifts?id=eq.${activeShift.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(patchBody)
        });
      }

      // 4. Update client's balance (decrease their debt)
      await fetch(`${baseUrl}/clients?id=eq.${selectedClient.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          initial_balance: Number(selectedClient.initial_balance || 0) - amountToReceive
        })
      });

      alert('تم استلام الدفعة بنجاح!');
      const receiptIdStr = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      handlePrintCashReceipt({
        receiptId: receiptIdStr,
        type: 'قبض',
        date: new Date().toISOString(),
        clientName: selectedClient.name,
        amount: amountToReceive,
        paymentMethod: wallets.find(w => w.id.toString() === receiveData.walletId)?.name || 'نقدي',
        notes: receiveData.notes,
        cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'كاشير'
      });

      setIsReceiveModalOpen(false);
      setReceiveData({
        clientId: '',
        amount: '',
        walletId: '',
        notes: ''
      });
      fetchWalletsAndShift();
      fetchCustomers();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      // Get user_id from token or local storage if possible, for now we assume it's handled or we can omit if nullable
      const userDataStr = localStorage.getItem('user_data');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      const finalData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        initial_balance: formData.balance_type === 'credit' ? -Math.abs(formData.initial_balance) : Math.abs(formData.initial_balance),
        credit_limit: formData.credit_limit,
        category: formData.category,
        notes: formData.notes
      };

      const response = await fetch(`${baseUrl}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...finalData,
          user_id: userData?.id,
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('فشل إضافة العميل');

      setIsAddModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevel = actCashier?.role_level || 3;
    const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
    const specialPerms = actCashier?.permissions?.special || [];

    if (!isOwnerAct && !specialPerms.includes('تعديل البيانات')) {
      alert('ليس لديك صلاحية لتعديل البيانات');
      return;
    }

    if (!editCustomer) return;

    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      const finalData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        initial_balance: formData.balance_type === 'credit' ? -Math.abs(formData.initial_balance) : Math.abs(formData.initial_balance),
        credit_limit: formData.credit_limit,
        category: formData.category,
        notes: formData.notes
      };

      const response = await fetch(`${baseUrl}/clients?id=eq.${editCustomer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finalData)
      });

      if (!response.ok) throw new Error('فشل تحديث بيانات العميل');

      setEditCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteId) return;

    const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevel = actCashier?.role_level || 3;
    const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
    const specialPerms = actCashier?.permissions?.special || [];

    if (!isOwnerAct && !specialPerms.includes('حذف البيانات')) {
      alert('ليس لديك صلاحية لحذف البيانات');
      setDeleteId(null);
      return;
    }

    setIsDeleting(deleteId);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      const response = await fetch(`${baseUrl}/clients?id=eq.${deleteId}`, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('فشل حذف العميل');
      setDeleteId(null);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = customers.map(c => ({
      'الاسم': c.name,
      'الهاتف': c.phone,
      'العنوان': c.address || '',
      'الرصيد الافتتاحي': c.initial_balance || 0,
      'حد الائتمان': c.credit_limit || 0,
      'التصنيف': c.category || '',
      'تاريخ الإضافة': new Date(c.created_at).toLocaleDateString('ar-EG'),
      'ملاحظات': c.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "العملاء");
    XLSX.writeFile(workbook, `العملاء_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const token = localStorage.getItem('access_token');
        const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
        const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

        const userDataStr = localStorage.getItem('user_data');
        const userData = userDataStr ? JSON.parse(userDataStr) : null;

        const formattedData = data.map(row => ({
          name: row['الاسم'] || row['name'] || '',
          phone: String(row['الهاتف'] || row['phone'] || ''),
          address: row['العنوان'] || row['address'] || '',
          initial_balance: parseFloat(row['الرصيد الافتتاحي'] || row['balance'] || 0),
          credit_limit: parseFloat(row['حد الائتمان'] || row['credit_limit'] || 0),
          category: row['التصنيف'] || row['category'] || '',
          notes: row['ملاحظات'] || row['notes'] || '',
          user_id: userData?.id,
          created_at: new Date().toISOString()
        })).filter(item => item.name);

        const response = await fetch(`${baseUrl}/clients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${token}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(formattedData)
        });

        if (!response.ok) throw new Error('فشل استيراد البيانات');

        alert(`تم استيراد ${formattedData.length} عميل بنجاح`);
        fetchCustomers();
      } catch (err: any) {
        alert('خطأ في استيراد الملف: ' + err.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      initial_balance: 0,
      balance_type: 'debt',
      credit_limit: 0,
      category: '',
      notes: ''
    });
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));

    const balance = (customer.initial_balance || 0) + (customer.total_debt || 0);

    if (filterType === 'debtors') return matchesSearch && balance > 0; // In POS context usually debt > 0 means they owe you
    if (filterType === 'creditors') return matchesSearch && balance < 0;
    if (filterType === 'balanced') return matchesSearch && balance === 0;

    if (filterType === 'vip') return matchesSearch && customer.category === 'VIP ⭐';
    if (filterType === 'new') return matchesSearch && customer.category === 'جديد 🆕';
    if (filterType === 'delayed') return matchesSearch && customer.category === 'متأخر ⚠️';

    return matchesSearch;
  });

  const totals = {
    count: customers.length,
    totalDebt: customers.reduce((sum, c) => {
      const balance = (c.initial_balance || 0) + (c.total_debt || 0);
      return sum + (balance > 0 ? balance : 0);
    }, 0),
    totalCredit: customers.reduce((sum, c) => {
      const balance = (c.initial_balance || 0) + (c.total_debt || 0);
      return sum + (balance < 0 ? Math.abs(balance) : 0);
    }, 0),
    newThisMonth: customers.filter(c => {
      const date = new Date(c.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <div className="space-y-6 pb-20 fade-in" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 sm:px-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <Users className="w-6 h-6 text-indigo-500" />
            </div>
            العملاء
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">إدارة بيانات العملاء والديون والتحصيلات</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            className="hidden"
            accept=".xlsx, .xls, .csv"
          />
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl text-sm font-bold border border-indigo-500/20 transition-all"
          >
            <Download className="w-4 h-4" /> تصدير
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-400 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-500/20 transition-all disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            استيراد
          </button>
          <button
            onClick={() => setIsBulkWhatsAppOpen(true)}
            className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 px-4 py-2.5 rounded-xl text-sm font-bold border border-green-500/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> رسالة جماعية
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            <UserPlus className="w-4 h-4" /> إضافة عميل
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-0">
        <StatCard title="إجمالي العملاء" value={totals.count} icon={Users} color="indigo" />
        <StatCard title="إجمالي الديون (لنا)" value={totals.totalDebt.toLocaleString()} currency="ج.م" icon={TrendingUp} color="red" />
        <StatCard title="إجمالي الأرصدة (علينا)" value={totals.totalCredit.toLocaleString()} currency="ج.م" icon={TrendingDown} color="emerald" />
        <StatCard title="جدد هذا الشهر" value={totals.newThisMonth} icon={Calendar} color="blue" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-[2rem] p-3 flex flex-col lg:flex-row items-center gap-4 mx-4 sm:mx-0">
        <div className="relative flex-1 w-full lg:w-auto">
          <Search className="w-4 h-4 text-slate-500 absolute top-1/2 start-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-100 dark:border-white/10 rounded-2xl py-3.5 ps-12 pe-4 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-50 dark:bg-[#080c13] rounded-2xl border border-slate-100 dark:border-white/5 overflow-x-auto w-full lg:w-auto shrink-0 no-scrollbar">
          <FilterButton active={filterType === 'vip'} onClick={() => setFilterType('vip')} label="VIP ⭐" color="amber" />
          <FilterButton active={filterType === 'new'} onClick={() => setFilterType('new')} label="جديد" color="blue" />
          <FilterButton active={filterType === 'delayed'} onClick={() => setFilterType('delayed')} label="متأخر" color="red" />
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-1" />
          <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')} label="الكل" color="indigo" />
          <FilterButton active={filterType === 'debtors'} onClick={() => setFilterType('debtors')} label="مدينين" color="red" />
          <FilterButton active={filterType === 'creditors'} onClick={() => setFilterType('creditors')} label="دائنين" color="emerald" />
          <FilterButton active={filterType === 'balanced'} onClick={() => setFilterType('balanced')} label="متوازن" color="blue" />
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-1" />
          <button
            onClick={fetchCustomers}
            className="p-2.5 text-slate-500 hover:text-indigo-500 dark:text-slate-400 hover:dark:text-indigo-400 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading && customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-500 animate-pulse font-medium">جاري تحميل بيانات العملاء...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center space-y-4 mx-4 sm:mx-0">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div className="text-red-400 font-bold">{error}</div>
          <button onClick={fetchCustomers} className="text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2 rounded-xl transition-all">حاول مرة أخرى</button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl py-24 text-center mx-4 sm:mx-0">
          <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-slate-400 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500">لا يوجد عملاء</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ابدأ بإضافة أول عميل لنظامك</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm mx-4 sm:mx-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0d1117] border-b border-slate-200 dark:border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">الاسم والتصنيف</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">الهاتف والعنوان</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">الرصيد وعن الائتمان</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">الملاحظات</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">تاريخ الإضافة</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 flex items-center justify-center text-indigo-500 font-black text-sm border border-indigo-500/10">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{customer.name}</div>
                          <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">{customer.category || 'بدون تصنيف'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-indigo-500" />
                          {customer.phone || '---'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {customer.address || "لا يوجد عنوان"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold font-mono ${(customer.initial_balance || 0) < 0 ? 'text-red-500' : (customer.initial_balance || 0) > 0 ? 'text-emerald-500' : 'text-blue-500'}`}>
                        {Math.abs(customer.initial_balance || 0).toLocaleString()} <span className="text-[10px]">ج.م (الافتتاحي)</span>
                      </div>
                      {customer.total_debt !== undefined && customer.total_debt > 0 && (
                        <div className="text-sm font-bold font-mono text-orange-500 mt-1">
                          {customer.total_debt.toLocaleString()} <span className="text-[10px]">ج.م (مديونية)</span>
                        </div>
                      )}
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        حد الائتمان: {customer.credit_limit?.toLocaleString() || 0} ج.م
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap max-w-[200px]">
                      <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {customer.notes || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {new Date(customer.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">

                        <button
                          onClick={() => setConsolidatedCustomer(customer)}
                          className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg transition-all border border-purple-500/10"
                          title="فاتورة مجمعة"
                        >
                          <ReceiptText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const url = `https://wa.me/2${customer.phone}`;
                            window.open(url, '_blank');
                          }}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all border border-emerald-500/10"
                          title="تراسل واتساب"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setReceiveData({ ...receiveData, clientId: customer.id.toString(), amount: '' });
                            setIsReceiveModalOpen(true);
                          }}
                          className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-all border border-amber-500/10"
                          title="تحصيل من العميل"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setViewCustomer(customer);
                            fetchStatementData(customer);
                          }}
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-all border border-blue-500/10"
                          title="عرض كشف الحساب"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditCustomer(customer);
                            setFormData({
                              name: customer.name,
                              phone: customer.phone || '',
                              address: customer.address || '',
                              initial_balance: Math.abs(customer.initial_balance || 0),
                              balance_type: (customer.initial_balance || 0) < 0 ? 'credit' : 'debt',
                              credit_limit: customer.credit_limit || 0,
                              category: customer.category || '',
                              notes: customer.notes || ''
                            });
                          }}
                          className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg transition-all border border-indigo-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          disabled={isDeleting === customer.id}
                          onClick={() => setDeleteId(customer.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all border border-red-500/10 disabled:opacity-50"
                          title="حذف"
                        >
                          {isDeleting === customer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-[#0d1117]/50 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
            <p className="text-sm text-slate-500">عرض {filteredCustomers.length} من أصل {customers.length} عميل</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50">السابق</button>
              <button className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold">1</button>
              <button className="px-4 py-2 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">التالي</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk WhatsApp Modal */}
      <AnimatePresence>
        {isBulkWhatsAppOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#11151c] rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">رسالة واتساب جماعية</h2>
                    <p className="text-xs text-slate-500 mt-0.5">أرسل رسالة لعملائك</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBulkWhatsAppOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نص الرسالة</label>
                  <textarea
                    value={bulkWhatsAppMessage}
                    onChange={(e) => setBulkWhatsAppMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-green-500/50 transition-all resize-none"
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">قائمة العملاء ({filteredCustomers.filter(c => c.phone).length})</label>
                    <button
                      onClick={async () => {
                        const pendingCustomers = filteredCustomers.filter(c => c.phone && !sentWhatsAppCustomerIds.includes(c.id));
                        if (pendingCustomers.length === 0) {
                          alert('تم الإرسال لجميع العملاء في القائمة.');
                          return;
                        }
                        for (const customer of pendingCustomers) {
                          const msg = encodeURIComponent(bulkWhatsAppMessage);
                          const phone = customer.phone.replace(/\D/g, '');
                          const prefix = phone.startsWith('20') ? '' : '2';
                          // Use whatsapp:// protocol to force open the desktop app
                          const url = `whatsapp://send?phone=${prefix}${phone}&text=${msg}`;

                          // Open the link
                          const a = document.createElement('a');
                          a.href = url;
                          a.click();

                          // Add a delay so WhatsApp Desktop has time to open the chat and load the pre-filled text before we move to the next contact
                          await new Promise(resolve => setTimeout(resolve, 1500));
                        }
                        setSentWhatsAppCustomerIds(prev => [...prev, ...pendingCustomers.map(c => c.id)]);
                      }}
                      className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> إرسال للكل
                    </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-2">
                      {filteredCustomers.filter(c => c.phone).map(customer => {
                        const isSent = sentWhatsAppCustomerIds.includes(customer.id);
                        return (
                          <div key={customer.id} className="flex items-center justify-between bg-white dark:bg-[#11151c] border border-slate-100 dark:border-white/5 p-3 rounded-lg">
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{customer.name}</div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">{customer.phone}</div>
                            </div>
                            <button
                              onClick={() => {
                                const msg = encodeURIComponent(bulkWhatsAppMessage);
                                const phone = customer.phone.replace(/\D/g, '');
                                const prefix = phone.startsWith('20') ? '' : '2';
                                // Use whatsapp:// protocol
                                const url = `whatsapp://send?phone=${prefix}${phone}&text=${msg}`;
                                const a = document.createElement('a');
                                a.href = url;
                                a.click();
                                if (!isSent) setSentWhatsAppCustomerIds([...sentWhatsAppCustomerIds, customer.id]);
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isSent ? 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10' : 'bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20'}`}
                            >
                              {isSent ? <CheckCircle2 className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                              {isSent ? 'تم الإرسال' : 'إرسال'}
                            </button>
                          </div>
                        )
                      })}
                      {filteredCustomers.filter(c => c.phone).length === 0 && (
                        <div className="p-4 text-center text-sm text-slate-500">لا يوجد عملاء بأرقام هواتف مسجلة</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Client Modal - Redesigned */}
      <AnimatePresence>
        {(isAddModalOpen || editCustomer) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddModalOpen(false); setEditCustomer(null); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-xl shadow-2xl relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-slate-50 dark:bg-[#1a1f28] p-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-indigo-500" />
                  {editCustomer ? 'تعديل بيانات عميل' : 'إضافة عميل جديد'}
                </h3>
                <button
                  onClick={() => { setIsAddModalOpen(false); setEditCustomer(null); }}
                  className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <form onSubmit={editCustomer ? handleUpdateCustomer : handleCreateCustomer} className="space-y-6">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1 flex items-center gap-1.5">
                      الاسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                      placeholder="أدخل اسم العميل..."
                    />
                  </div>

                  {/* Phone & Balance Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">رقم الهاتف</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                        placeholder="01012345678"
                      />
                    </div>
                    {editCustomer ? (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">إجمالي المديونية من المبيعات</label>
                        <input
                          type="number"
                          step="0.01"
                          disabled
                          value={editCustomer.total_debt || 0}
                          className="w-full bg-slate-100 dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-500 dark:text-slate-500 transition-all font-mono opacity-60 cursor-not-allowed text-center"
                          title="المديونية تحسب تلقائياً من المبيعات الآجلة ولا يمكن تعديلها من هنا"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">حالة الحساب والرصيد الحالي</label>
                      <div className="flex gap-2">
                        <select
                          value={formData.balance_type}
                          onChange={(e) => setFormData({ ...formData, balance_type: e.target.value })}
                          className="bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer font-bold w-1/3"
                        >
                          <option value="debt">عليه للمحل</option>
                          <option value="credit">له عند المحل</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.initial_balance}
                          onChange={(e) => setFormData({ ...formData, initial_balance: Math.abs(parseFloat(e.target.value) || 0) })}
                          className="w-2/3 bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category & Credit Limit Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">التصنيف</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">بدون تصنيف</option>
                        <option value="VIP ⭐">VIP ⭐</option>
                        <option value="جديد 🆕">جديد 🆕</option>
                        <option value="متأخر ⚠️">متأخر ⚠️</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">حد الائتمان</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.credit_limit}
                        onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Address Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">العنوان</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                      placeholder="القاهرة - المعادي"
                    />
                  </div>

                  {/* Notes Area */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">ملاحظات</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                      placeholder="أي ملاحظات إضافية..."
                    />
                  </div>

                  {/* Form Footer */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {editCustomer ? 'حفظ التغييرات' : 'حفظ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddModalOpen(false); setEditCustomer(null); }}
                      className="px-8 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Redesigned View Customer Modal (Account Statement) */}
      <AnimatePresence>
        {viewCustomer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewCustomer(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-5xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-slate-50 dark:bg-[#1a1f28] p-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5 shrink-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <FileText className="w-6 h-6 text-indigo-500" />
                  كشف حساب العميل
                </h3>
                <button
                  onClick={() => setViewCustomer(null)}
                  className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                {/* Customer Info Header */}
                <div className="bg-slate-50 dark:bg-[#1a1f28]/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-start">
                  <div className="space-y-2">
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white">{viewCustomer.name}</h4>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 justify-center md:justify-start font-mono text-sm">
                      <Phone className="w-4 h-4 text-indigo-500" />
                      {viewCustomer.phone}
                    </div>
                  </div>

                  <div className="flex gap-8 md:gap-14">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">إجمالي المبيعات</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        {statementData.reduce((sum, item) => sum + item.debt, 0).toLocaleString()} <span className="text-[10px] text-slate-400 dark:text-slate-500">ج.م</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">المبلغ المدفوع</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        {statementData.reduce((sum, item) => sum + item.paid, 0).toLocaleString()} <span className="text-[10px] text-slate-400 dark:text-slate-500">ج.م</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">الرصيد المستحق (الديون)</div>
                      <div className={`text-xl font-black font-mono ${((viewCustomer.initial_balance || 0) + (viewCustomer.total_debt || 0)) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {Math.abs((viewCustomer.initial_balance || 0) + (viewCustomer.total_debt || 0)).toLocaleString()} <span className="text-[10px] text-slate-400 dark:text-slate-500">ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 dark:bg-[#1a1f28]/50 border border-slate-200 dark:border-white/5 rounded-2xl p-1 gap-2">
                  <button
                    onClick={() => setCustomerViewTab('statement')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${customerViewTab === 'statement' ? 'bg-white dark:bg-[#11151c] text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    كشف الحساب العام
                  </button>
                  <button
                    onClick={() => setCustomerViewTab('installments')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${customerViewTab === 'installments' ? 'bg-white dark:bg-[#11151c] text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    عقود التقسيط
                  </button>
                </div>

                {customerViewTab === 'statement' ? (
                  <>
                    {/* Filters Section */}
                    <div className="flex flex-col lg:flex-row items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-200 dark:border-white/5">
                      <div className="flex items-center gap-4 flex-1 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-slate-500">من:</span>
                          <input type="date" className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-slate-500">إلى:</span>
                          <input type="date" className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />
                        </div>
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 shrink-0">تطبيق 🔍</button>
                      </div>

                      <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-2xl shrink-0">
                        {['أسبوع', 'شهر', '3 شهور', 'سنة', 'الكل'].map((opt, i) => (
                          <button key={opt} className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${i === 4 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-500 hover:text-indigo-400'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-slate-50 dark:bg-[#1a1f28]/30 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-start border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/5">
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">التاريخ</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">النوع</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">البيان</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">عليه</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">دفع</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">الرصيد</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {isStatementLoading ? (
                              <tr>
                                <td colSpan={6} className="text-center py-8">
                                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                                </td>
                              </tr>
                            ) : statementData.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center py-8 text-slate-500 font-bold">
                                  لا توجد حركات لهذا العميل
                                </td>
                              </tr>
                            ) : statementData.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">
                                  {new Date(item.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 text-[9px] font-bold rounded-full border ${item.type === 'فاتورة' ? 'bg-red-500/10 text-red-500 border-red-500/10' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10'}`}>
                                    {item.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white font-medium">{item.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white font-black font-mono">
                                  {item.debt > 0 ? item.debt.toLocaleString() : <span className="text-slate-400 text-xs italic">---</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white font-black font-mono">
                                  {item.paid > 0 ? item.paid.toLocaleString() : <span className="text-slate-400 text-xs italic">---</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono font-bold">{item.balance?.toLocaleString() || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-50 dark:bg-[#1a1f28]/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative min-h-[400px]">
                    <InstallmentContracts customerId={viewCustomer.id.toString()} />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 dark:bg-[#1a1f28] p-6 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-center md:justify-start gap-4 shrink-0">
                <button
                  onClick={() => setViewCustomer(null)}
                  className="px-8 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all"
                >
                  إغلاق
                </button>
                <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20">
                  <Download className="w-4 h-4" /> تصدير PDF
                </button>
                <button
                  onClick={handlePrintStatement}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  <Printer className="w-4 h-4" /> طباعة
                </button>
                <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20">
                  <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
                </button>
                <button
                  onClick={() => {
                    const url = `https://wa.me/2${viewCustomer.phone}`;
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  <MessageCircle className="w-4 h-4" /> واتساب 🧮
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Consolidated Invoice Modal */}
      <AnimatePresence>
        {consolidatedCustomer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => { setConsolidatedCustomer(null); setConsolidatedData(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0d1117] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-full"
              dir="rtl"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 flex items-center justify-center rounded-xl text-purple-500">
                    <ReceiptText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">فاتورة مجمعة</h2>
                    <p className="text-sm text-slate-500">{consolidatedCustomer.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setConsolidatedCustomer(null); setConsolidatedData(null); }}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex gap-4 items-center bg-slate-50 dark:bg-[#080c13]">
                <label className="font-bold text-slate-700 dark:text-slate-300">التاريخ:</label>
                <input
                  type="date"
                  value={consolidatedDate}
                  onChange={(e) => setConsolidatedDate(e.target.value)}
                  className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-[#080c13]">
                {isConsolidatedLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
                ) : consolidatedData ? (
                  consolidatedData.items.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-[#0d1117] rounded-xl p-4 border border-slate-200 dark:border-white/10">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10">
                              <th className="text-start py-2">الصنف</th>
                              <th className="text-center py-2">الكمية</th>
                              <th className="text-end py-2">الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {consolidatedData.items.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-100 dark:border-white/5">
                                <td className="py-3 font-bold">{item.name} {item.imei && <span className="block text-xs font-mono text-slate-400">{item.imei}</span>}</td>
                                <td className="py-3 text-center font-bold">{item.quantity}</td>
                                <td className="py-3 text-end font-bold font-mono">{item.total_price.toLocaleString()} ج.م</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-1">إجمالي الفواتير</p>
                          <p className="text-xl font-black font-mono text-blue-700 dark:text-blue-300">{consolidatedData.totalAmount.toLocaleString()} ج.م</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold mb-1">المدفوع</p>
                          <p className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">{consolidatedData.paidAmount.toLocaleString()} ج.م</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-500/20">
                          <p className="text-sm text-orange-600 dark:text-orange-400 font-bold mb-1">المتبقي</p>
                          <p className="text-xl font-black font-mono text-orange-700 dark:text-orange-300">{consolidatedData.remainingAmount.toLocaleString()} ج.م</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 font-bold">لا توجد مبيعات في هذا اليوم</div>
                  )
                ) : null}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3">
                <button
                  onClick={() => { setConsolidatedCustomer(null); setConsolidatedData(null); }}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl font-bold transition-all"
                >
                  إغلاق
                </button>
                <button
                  onClick={handlePrintConsolidated}
                  disabled={!consolidatedData || consolidatedData.items.length === 0}
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Printer className="w-5 h-5" />
                  طباعة الفاتورة المجمعة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden print component */}
      <div style={{ display: 'none' }}>
        <PrintConsolidatedInvoiceTemplate ref={consolidatedPrintRef} data={consolidatedData} />
      </div>

      {/* Receive from Customer Modal */}
      <AnimatePresence>
        {isReceiveModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReceiveModalOpen(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                <button
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="w-10 h-10 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">تحصيل دفعة</h2>
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8 space-y-6">

                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl text-sm font-bold flex gap-3 text-start leading-relaxed">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>
                    إذا كان العميل يقوم بتسديد <b>(قسط)</b>، برجاء إغلاق هذه النافذة والدخول لصفحة العميل (كشف الحساب) وتسديد القسط من تبويب <b>(عقود التقسيط)</b> للتأكد من انضباط المديونية والأقساط.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-end">
                    <label className="text-sm font-bold text-slate-500">الرصيد الحالي</label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={
                          (() => {
                            const c = customers.find(x => x.id.toString() === receiveData.clientId.toString());
                            return c ? `${((c.initial_balance || 0) + (c.total_debt || 0)).toLocaleString()} ج.م` : '0 ج.م';
                          })()
                        }
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-center text-lg text-slate-900 dark:text-white font-mono opacity-80"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-end">
                    <label className="text-sm font-bold text-slate-500">اسم العميل</label>
                    <input
                      type="text"
                      disabled
                      value={customers.find(c => c.id.toString() === receiveData.clientId.toString())?.name || ''}
                      className="w-full bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-center text-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-end">
                  <label className="text-sm font-bold text-slate-500">المبلغ المحصّل <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={receiveData.amount}
                    onChange={e => setReceiveData({ ...receiveData, amount: e.target.value })}
                    className="w-full bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl py-4 px-5 text-lg text-start text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                    placeholder="أدخل المبلغ..."
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2 text-end">
                  <label className="text-sm font-bold text-slate-500 flex items-center justify-end gap-1"><Landmark className="w-4 h-4 text-slate-400" /> نوع المحفظة</label>
                  <select
                    value={receiveData.walletId}
                    onChange={e => setReceiveData({ ...receiveData, walletId: e.target.value })}
                    className="w-full bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all text-end appearance-none cursor-pointer"
                    dir="rtl"
                  >
                    <option value="" disabled hidden>-- اختر الخزينة --</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} 💵
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 text-end">
                  <label className="text-sm font-bold text-slate-500 flex items-center justify-end gap-1">رصيد المحفظة المختارة <DollarSign className="w-4 h-4 text-amber-500" /></label>
                  <div className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-center text-lg text-slate-900 dark:text-white font-black font-mono">
                    {
                      (() => {
                        const w = wallets.find(x => x.id.toString() === receiveData.walletId.toString());
                        return w ? `${w.balance.toLocaleString()} ج.م` : '0.00 ج.م';
                      })()
                    }
                  </div>
                </div>

                <div className="space-y-2 text-end">
                  <label className="text-sm font-bold text-slate-500">ملاحظات</label>
                  <input
                    type="text"
                    value={receiveData.notes}
                    onChange={e => setReceiveData({ ...receiveData, notes: e.target.value })}
                    className="w-full bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-lg text-end text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-400"
                    placeholder="سبب الدفع أو ملاحظات..."
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/5 flex gap-4 justify-start">
                <button
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-8 py-4 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl font-bold transition-all shadow-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleReceiveSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>تحصيل <DollarSign className="w-5 h-5 bg-white/20 p-0.5 rounded-full" /></>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-sm shadow-2xl relative overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا العميل نهائياً؟ <br />
                <span className="text-red-500/50 text-xs mt-2 block font-bold">لا يمكن التراجع عن هذا الإجراء.</span>
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteCustomer}
                  disabled={!!isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'نعم، حذف'}
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-8 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-4 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Hidden Print Templates --- */}
      <div className="hidden">
        {viewCustomer && (
          <PrintStatementTemplate
            ref={statementPrintRef}
            entityName={viewCustomer.name}
            entityPhone={viewCustomer.phone}
            statementData={statementData}
            totalDebt={statementData.reduce((sum, item) => sum + item.debt, 0)}
            totalPaid={statementData.reduce((sum, item) => sum + item.paid, 0)}
            currentBalance={(viewCustomer.initial_balance || 0) + (viewCustomer.total_debt || 0)}
            balanceType={((viewCustomer.initial_balance || 0) + (viewCustomer.total_debt || 0)) > 0 ? 'مدين' : ((viewCustomer.initial_balance || 0) + (viewCustomer.total_debt || 0)) < 0 ? 'دائن' : 'متوازن'}
            shopName={settings?.companyName}
            phone={settings?.phone}
            logo={settings?.logo}
          />
        )}
        {receiptData && (
          <PrintCashReceiptTemplate
            ref={cashReceiptPrintRef}
            {...receiptData}
            shopName={settings?.companyName}
            phone={settings?.phone}
            logo={settings?.logo}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, currency, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-5 group hover:border-indigo-500/30 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{value}</span>
        {currency && <span className="text-sm font-bold text-slate-500">{currency}</span>}
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, label, color = 'indigo' }: any) {
  const colorMap: Record<string, string> = {
    indigo: 'active:bg-indigo-500 active:text-white hover:text-indigo-500 border-indigo-500/0 hover:border-indigo-500/20',
    red: 'active:bg-red-500 active:text-white hover:text-red-500 border-red-500/0 hover:border-red-500/20',
    emerald: 'active:bg-emerald-500 active:text-white hover:text-emerald-500 border-emerald-500/0 hover:border-emerald-500/20',
    blue: 'active:bg-blue-500 active:text-white hover:text-blue-500 border-blue-500/0 hover:border-blue-500/20',
    amber: 'active:bg-amber-500 active:text-white hover:text-amber-500 border-amber-500/0 hover:border-amber-500/20',
  };

  const activeMap: Record<string, string> = {
    indigo: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
    red: 'bg-red-500 text-white shadow-lg shadow-red-500/20',
    emerald: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    blue: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20',
    amber: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${active ? activeMap[color] : `text-slate-500 ${colorMap[color]}`}`}
    >
      {label}
    </button>
  );
}
