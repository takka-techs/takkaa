import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { useSettings } from '../contexts/SettingsContext';
import { PrintStatementTemplate } from './PrintStatementTemplate';
import { PrintCashReceiptTemplate } from './PrintCashReceiptTemplate';
import { 
  Truck, Search, Plus, Download, Upload, 
  Trash2, Edit, Eye, Filter, RefreshCw,
  X, Phone, MapPin, MessageCircle, 
  FileText, Loader2, UserPlus, MoreHorizontal,
  ChevronRight, ArrowUpRight, ArrowDownRight, Printer, 
  FileSpreadsheet, CreditCard, ShoppingBag
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  initial_balance: number;
  notes: string | null;
  created_at: string;
  user_id: string;
}

const SupplierBalance = ({ supplier, calculateStatement }: { supplier: Supplier, calculateStatement: any }) => {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    calculateStatement(supplier).then((res: any) => {
      if (isMounted && res) {
        setBalance(res.currentBalance);
      }
    });
    return () => { isMounted = false; };
  }, [supplier, calculateStatement]);

  if (balance === null) return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;

  return (
    <div className={`text-sm font-bold font-mono ${balance < 0 ? 'text-red-500' : balance > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
      {Math.abs(balance).toLocaleString()} <span className="text-[10px]">ج.م</span>
      {balance !== 0 && (
         <span className={`text-[10px] ml-1 px-1.5 py-0.5 rounded-full ${balance < 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
           {balance < 0 ? 'عليه' : 'له'}
         </span>
      )}
    </div>
  );
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    initial_balance: 0,
    notes: ''
  });

  const { settings } = useSettings();
  const statementPrintRef = useRef<HTMLDivElement>(null);

  const [statementData, setStatementData] = useState<any[]>([]);
  const [allStatementData, setAllStatementData] = useState<any[]>([]);
  const [statementStats, setStatementStats] = useState({ totalBought: 0, totalPaid: 0, totalReturned: 0, balance: 0 });
  const [isStatementLoading, setIsStatementLoading] = useState(false);
  const [statementDates, setStatementDates] = useState({ from: '', to: '' });

  const [paySupplier, setPaySupplier] = useState<Supplier | null>(null);
  const [payOperationType, setPayOperationType] = useState<'pay' | 'receive'>('pay');
  const [paySupplierBalance, setPaySupplierBalance] = useState<number | null>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payWalletId, setPayWalletId] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);

  const [purchasesSupplier, setPurchasesSupplier] = useState<Supplier | null>(null);
  const [purchasesData, setPurchasesData] = useState<any[]>([]);
  const [isPurchasesLoading, setIsPurchasesLoading] = useState(false);
  const [purchasesStats, setPurchasesStats] = useState({ totalBought: 0, itemsCount: 0 });

  const calculateSupplierStatement = useCallback(async (supplier: Supplier) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const headers = { 'apikey': apiKey, 'Authorization': `Bearer ${token}` };
      const supplierName = supplier.name;

      const [devRes, accRes, spRes, trRes] = await Promise.all([
        fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=id,created_at,company,model,cost_price,tax,status,entry_type,source&source=eq.${encodeURIComponent(supplierName)}`, { headers }),
        fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?select=id,created_at,name,cost_price,tax,status,entry_type,quantity,supplier&supplier=eq.${encodeURIComponent(supplierName)}`, { headers }),
        fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?select=id,created_at,name,cost_price,tax,status,entry_type,quantity,supplier&supplier=eq.${encodeURIComponent(supplierName)}`, { headers }),
        fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions?select=id,created_at,type,amount,description&or=(category.eq.${encodeURIComponent('سداد دفعة للمورد')},category.eq.${encodeURIComponent('مقبوضات من مورد')})`, { headers })
      ]);

      const devices = devRes.ok ? await devRes.json() : [];
      const accessories = accRes.ok ? await accRes.json() : [];
      const spareParts = spRes.ok ? await spRes.json() : [];
      let treasury = trRes.ok ? await trRes.json() : [];
      treasury = treasury.filter((t: any) => {
        if (!t.description) return false;
        const d = t.description;
        return d.includes(`سداد المورد ${supplierName} (`) || 
               d === `دفعة للمورد: ${supplierName}` ||
               d === `استلام من المورد: ${supplierName}` ||
               d.includes(` ${supplierName} `) ||
               d.endsWith(` ${supplierName}`);
      });

      let allTransactions: any[] = [];

      allTransactions.push({
        date: supplier.created_at || new Date().toISOString(),
        type: 'رصيد افتتاحي',
        description: 'رصيد افتتاحي',
        debt: supplier.initial_balance < 0 ? Math.abs(supplier.initial_balance) : 0,
        credit: supplier.initial_balance > 0 ? Math.abs(supplier.initial_balance) : 0,
      });

      devices.forEach((d: any) => {
        if (d.entry_type === 'purchase' || d.source === supplierName) {
          const qty = d.quantity || 1; 
          const amount = ((d.cost_price || 0) + (d.tax || 0)) * qty;
          if (d.status === 'returned') {
            allTransactions.push({ date: d.created_at, type: 'مشتريات جهاز', description: `${d.company} ${d.model}`, debt: 0, credit: amount });
            allTransactions.push({ date: d.created_at, type: 'مرتجع جهاز', description: `${d.company} ${d.model}`, debt: amount, credit: 0 });
          } else {
            allTransactions.push({ date: d.created_at, type: 'مشتريات جهاز', description: `${d.company} ${d.model}`, debt: 0, credit: amount });
          }
        }
      });

      accessories.forEach((a: any) => {
        if (a.entry_type === 'purchase' || a.supplier === supplierName) {
          const qty = a.quantity || 1;
          const amount = ((a.cost_price || 0) + (a.tax || 0)) * qty;
          if (a.status === 'returned') {
            allTransactions.push({ date: a.created_at, type: 'مشتريات إكسسوار', description: a.name, debt: 0, credit: amount });
            allTransactions.push({ date: a.created_at, type: 'مرتجع إكسسوار', description: a.name, debt: amount, credit: 0 });
          } else {
            allTransactions.push({ date: a.created_at, type: 'مشتريات إكسسوار', description: a.name, debt: 0, credit: amount });
          }
        }
      });

      spareParts.forEach((s: any) => {
        if (s.entry_type === 'purchase' || s.supplier === supplierName) {
           const qty = s.quantity || 1;
           const amount = ((s.cost_price || 0) + (s.tax || 0)) * qty;
          if (s.status === 'returned') {
            allTransactions.push({ date: s.created_at, type: 'مشتريات قطعة غيار', description: s.name, debt: 0, credit: amount });
            allTransactions.push({ date: s.created_at, type: 'مرتجع قطعة غيار', description: s.name, debt: amount, credit: 0 });
          } else {
            allTransactions.push({ date: s.created_at, type: 'مشتريات قطعة غيار', description: s.name, debt: 0, credit: amount });
          }
        }
      });

      treasury.forEach((t: any) => {
        if (t.type === 'out' || t.type === 'expense' || t.type === 'payment') {
          allTransactions.push({ date: t.created_at, type: 'سداد', description: t.description || 'سداد نقدية', debt: Number(t.amount) || 0, credit: 0 });
        } else if (t.type === 'in' || t.type === 'income' || t.type === 'receipt') {
          allTransactions.push({ date: t.created_at, type: 'مقبوضات', description: t.description || 'استرداد نقدية', debt: 0, credit: Number(t.amount) || 0 });
        }
      });

      allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let currentBalance = 0;
      let totalBought = 0;
      let totalPaid = 0;
      let totalReturned = 0;

      const processed = allTransactions.map(t => {
        currentBalance += (t.credit - t.debt);
        if (t.type.includes('مشتريات')) totalBought += t.credit;
        if (t.type.includes('سداد')) totalPaid += t.debt;
        if (t.type.includes('مرتجع')) totalReturned += t.debt;
        return { ...t, balance: currentBalance };
      });

      return { processed, currentBalance, totalBought, totalPaid, totalReturned };
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchStatement = async () => {
      if (!viewSupplier) return;
      setIsStatementLoading(true);
      const res = await calculateSupplierStatement(viewSupplier);
      if (res) {
        setAllStatementData(res.processed);
        setStatementData(res.processed);
        setStatementStats({ totalBought: res.totalBought, totalPaid: res.totalPaid, totalReturned: res.totalReturned, balance: res.currentBalance });
      }
      setIsStatementLoading(false);
    };
    fetchStatement();
  }, [viewSupplier]);

  const handleApplyStatementFilters = () => {
    let filtered = allStatementData;
    if (statementDates.from) {
      filtered = filtered.filter(item => new Date(item.date) >= new Date(statementDates.from));
    }
    if (statementDates.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0,0,0,0);
        const toDate = new Date(statementDates.to);
        toDate.setHours(23,59,59,999);
        return itemDate <= toDate;
      });
    }
    setStatementData(filtered);
  };

  useEffect(() => {
    if (paySupplier) {
      const fetchWalletsAndBalance = async () => {
        const token = localStorage.getItem('access_token');
        const userId = localStorage.getItem('user_id');
        const activeBranchId = localStorage.getItem("takka_active_branch_id");
        
        const tenantId = localStorage.getItem('tenant_id') || userId;
        let walletQuery = '';
        if (tenantId) walletQuery += `&tenant_id=eq.${tenantId}`;
        if (activeBranchId && activeBranchId !== 'ALL') walletQuery += `&branch_id=eq.${activeBranchId}`;

        const headers = { 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa', 'Authorization': `Bearer ${token}` };
        const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?select=*,branches(name)${walletQuery}`, { headers });
        if (res.ok) {
          let wData = await res.json();
          wData = wData.map((w: any) => ({
             ...w,
             name: w.branches && w.branches.name ? `${w.name} - (${w.branches.name})` : w.name
          }));
          setWallets(wData);
        }

        const statRes = await calculateSupplierStatement(paySupplier);
        if (statRes) {
          setPaySupplierBalance(statRes.currentBalance);
          setPayOperationType(statRes.currentBalance < 0 ? 'receive' : 'pay');
        }
      };
      fetchWalletsAndBalance();
    } else {
      setPaySupplierBalance(null);
      setPayOperationType('pay');
    }
  }, [paySupplier]);

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplier || !payAmount || !payWalletId) return;

    setIsPaying(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const headers = {
        'apikey': apiKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const tenantId = localStorage.getItem('tenant_id');
      const branchId = localStorage.getItem('branch_id'); // Optional if it uses current context
      
      const type = payOperationType === 'receive' ? 'in' : 'out';
      const category = payOperationType === 'receive' ? 'مقبوضات من مورد' : 'سداد دفعة للمورد';
      const description = payOperationType === 'receive' ? `استلام من المورد: ${paySupplier.name}` : `دفعة للمورد: ${paySupplier.name}`;

      const transactionPayload = {
        wallet_id: Number(payWalletId),
        user_id: userId,
        tenant_id: tenantId,
        branch_id: branchId && branchId !== 'ALL' ? branchId : null,
        type: type,
        amount: Number(payAmount),
        category: category,
        description: description
      };

      const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(transactionPayload)
      });

      if (!res.ok) throw new Error('Failed to save payment transaction');

      const wallet = wallets.find(w => w.id === Number(payWalletId));
      if (wallet) {
        const newBalance = type === 'out' ? wallet.balance - Number(payAmount) : wallet.balance + Number(payAmount);
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?id=eq.${wallet.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ balance: newBalance })
        });
      }

      setPaySupplier(null);
      setPayAmount('');
      setPayWalletId('');
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء السداد');
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!purchasesSupplier) return;
      setIsPurchasesLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
        const headers = {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        };
        const supplierName = purchasesSupplier.name;

        const devRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=id,created_at,company,model,cost_price,tax,status,entry_type,source&source=eq.${encodeURIComponent(supplierName)}`, { headers });
        const devices = devRes.ok ? await devRes.json() : [];

        const accRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?select=id,created_at,name,cost_price,tax,status,entry_type,quantity,supplier&supplier=eq.${encodeURIComponent(supplierName)}`, { headers });
        const accessories = accRes.ok ? await accRes.json() : [];

        const spRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?select=id,created_at,name,cost_price,tax,status,entry_type,quantity,supplier&supplier=eq.${encodeURIComponent(supplierName)}`, { headers });
        const spareParts = spRes.ok ? await spRes.json() : [];

        let allPurchases: any[] = [];
        let totalBought = 0;
        let itemsCount = 0;

        devices.forEach((d: any) => {
          if (d.entry_type === 'purchase' || d.source === supplierName) {
            const qty = d.quantity || 1;
            const amount = ((d.cost_price || 0) + (d.tax || 0)) * qty;
            allPurchases.push({
              date: d.created_at,
              type: 'جهاز',
              name: `${d.company || ''} ${d.model || ''}`,
              quantity: qty,
              cost: amount,
              status: d.status || 'مكتمل'
            });
            if (d.status !== 'returned') {
              totalBought += amount;
              itemsCount += qty;
            }
          }
        });

        accessories.forEach((a: any) => {
          if (a.entry_type === 'purchase' || a.supplier === supplierName) {
            const qty = a.quantity || 1;
            const amount = ((a.cost_price || 0) + (a.tax || 0)) * qty;
            allPurchases.push({
              date: a.created_at,
              type: 'إكسسوار',
              name: a.name,
              quantity: qty,
              cost: amount,
              status: a.status || 'مكتمل'
            });
            if (a.status !== 'returned') {
              totalBought += amount;
              itemsCount += qty;
            }
          }
        });

        spareParts.forEach((s: any) => {
          if (s.supplier === supplierName || s.entry_type === 'purchase') {
            const qty = s.quantity || 1;
            const amount = ((s.cost_price || 0) + (s.tax || 0)) * qty;
            allPurchases.push({
              date: s.created_at,
              type: 'قطعة غيار',
              name: s.name,
              quantity: qty,
              cost: amount,
              status: s.status || 'مكتمل'
            });
            if (s.status !== 'returned') {
              totalBought += amount;
              itemsCount += qty;
            }
          }
        });

        allPurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPurchasesData(allPurchases);
        setPurchasesStats({ totalBought, itemsCount });

      } catch (error) {
        console.error('Error fetching purchases:', error);
      } finally {
        setIsPurchasesLoading(false);
      }
    };
    fetchPurchases();
  }, [purchasesSupplier]);

  const executePrintStatement = useReactToPrint({
    contentRef: statementPrintRef,
    documentTitle: `Statement-${viewSupplier?.name || 'Supplier'}`,
    pageStyle: `@page { size: A4; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; margin: 0; } }`,
  });

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      const userId = localStorage.getItem('user_id');
      const response = await fetch(`${baseUrl}/suppliers?select=*&order=created_at.desc`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errInfo = await response.text();
        throw new Error('فشل جلب البيانات: ' + errInfo);
      }
      const data = await response.json();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      
      const userId = localStorage.getItem('user_id');

      const response = await fetch(`${baseUrl}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...formData,
          user_id: userId,
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('فشل إضافة المورد');
      
      setIsAddModalOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevel = actCashier?.role_level || 3;
    const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
    const specialPerms = actCashier?.permissions?.special || [];

    if (!isOwnerAct && !specialPerms.includes('تعديل البيانات')) {
      alert('ليس لديك صلاحية لتعديل البيانات');
      return;
    }

    if (!editSupplier) return;

    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      const response = await fetch(`${baseUrl}/suppliers?id=eq.${editSupplier.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('فشل تحديث البيانات');
      
      setEditSupplier(null);
      resetForm();
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSupplier = async () => {
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

      const response = await fetch(`${baseUrl}/suppliers?id=eq.${deleteId}`, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('فشل حذف المورد');
      setDeleteId(null);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = suppliers.map(s => ({
      'الاسم': s.name,
      'الهاتف': s.phone,
      'العنوان': s.address || '',
      'الرصيد الافتتاحي': s.initial_balance || 0,
      'تاريخ الإضافة': new Date(s.created_at).toLocaleDateString('ar-EG'),
      'ملاحظات': s.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الموردين");
    XLSX.writeFile(workbook, `الموردين_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
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
        
        const userId = localStorage.getItem('user_id');

        const formattedData = data.map(row => ({
          name: row['الاسم'] || row['name'] || '',
          phone: String(row['الهاتف'] || row['phone'] || ''),
          address: row['العنوان'] || row['address'] || '',
          initial_balance: parseFloat(row['الرصيد الافتتاحي'] || row['balance'] || 0),
          notes: row['ملاحظات'] || row['notes'] || '',
          user_id: userId,
          created_at: new Date().toISOString()
        })).filter(item => item.name);

        const response = await fetch(`${baseUrl}/suppliers`, {
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
        
        alert(`تم استيراد ${formattedData.length} مورد بنجاح`);
        fetchSuppliers();
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
      notes: ''
    });
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.phone && s.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#11151c] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-indigo-500 absolute top-1/2 start-4 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الهاتف أو العنوان..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-2xl py-3.5 ps-12 pe-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
            />
          </div>
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
            onClick={fetchSuppliers}
            className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl border border-blue-500/10 transition-all"
            title="تحديث"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" /> إضافة مورد
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="flex items-center gap-3">
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl px-6 py-3 flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-sm">
             {suppliers.length}
           </div>
           <span className="text-sm font-bold text-slate-600 dark:text-slate-400">قائمة الموردين</span>
        </div>
      </div>

      {/* Main Table Container */}
      {isLoading && suppliers.length === 0 ? (
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">جاري تحميل البيانات...</h3>
          <p className="text-slate-500 text-sm mt-2">يرجى الانتظار قليلاً بينما نجلب قائمة الموردين</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-slate-200 dark:border-white/5">
            <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">لا يوجد موردين</h3>
          <p className="text-slate-500 text-sm mt-2">ابدأ بإضافة أول مورد لك الآن لتنظيم حساباتك</p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="mt-8 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-5 h-5" /> إضافة مورد جديد
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0d1117] border-b border-slate-200 dark:border-white/5">
                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">#</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">المورد</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">الهاتف</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">الرصيد</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">آخر معاملة</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {filteredSuppliers.map((supplier, index) => (
                  <tr key={supplier.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold font-mono text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 flex items-center justify-center text-indigo-500 font-black text-sm border border-indigo-500/10 uppercase">
                          {supplier.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{supplier.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">مورد</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-indigo-500" />
                          {supplier.phone || '---'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {supplier.address || "لا يوجد عنوان"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SupplierBalance supplier={supplier} calculateStatement={calculateSupplierStatement} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {new Date(supplier.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                         <button 
                          onClick={() => setViewSupplier(supplier)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-all border border-amber-500/10 text-[10px] font-bold"
                          title="كشف حساب"
                        >
                          <FileText className="w-3.5 h-3.5" /> كشف حساب
                        </button>
                        <button 
                          onClick={() => setPurchasesSupplier(supplier)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg transition-all border border-indigo-500/10 text-[10px] font-bold"
                          title="كشف مشتريات"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> كشف مشتريات
                        </button>
                        <button 
                          onClick={() => setPaySupplier(supplier)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all border border-emerald-500/10 text-[10px] font-bold"
                          title="سداد"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> سداد
                        </button>
                        <button 
                          onClick={() => {
                            if (supplier.phone) {
                              const cleanPhone = supplier.phone.replace(/\D/g, '');
                              const waPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : (cleanPhone.startsWith('2') ? cleanPhone : '2' + cleanPhone);
                              window.open(`https://wa.me/${waPhone}`, '_blank');
                            }
                          }}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all border border-emerald-500/10"
                          title="واتساب"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditSupplier(supplier);
                            setFormData({
                              name: supplier.name,
                              phone: supplier.phone || '',
                              address: supplier.address || '',
                              initial_balance: supplier.initial_balance || 0,
                              notes: supplier.notes || ''
                            });
                          }}
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-all border border-blue-500/10"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          disabled={isDeleting === supplier.id}
                          onClick={() => setDeleteId(supplier.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all border border-red-500/10 disabled:opacity-50"
                          title="حذف"
                        >
                          {isDeleting === supplier.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || editSupplier) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddModalOpen(false); setEditSupplier(null); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-xl shadow-2xl relative overflow-hidden"
            >
              <div className="bg-slate-50 dark:bg-[#1a1f28] p-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <Truck className="w-6 h-6 text-indigo-500" />
                  {editSupplier ? 'تعديل بيانات مورد' : 'إضافة مورد جديد'}
                </h3>
                <button 
                  onClick={() => { setIsAddModalOpen(false); setEditSupplier(null); }}
                  className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <form onSubmit={editSupplier ? handleUpdateSupplier : handleCreateSupplier} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1 uppercase tracking-wider">اسم المورد *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-bold"
                      placeholder="أدخل اسم المورد..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1 uppercase tracking-wider">الرصيد الافتتاحي</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.initial_balance}
                        onChange={(e) => setFormData({...formData, initial_balance: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-mono text-center"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1 uppercase tracking-wider text-end block">رقم الهاتف</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition-all font-mono text-end"
                        placeholder="01xxxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1 uppercase tracking-wider text-end block">العنوان</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-end"
                      placeholder="العنوان الكامل..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1 uppercase tracking-wider text-end block">ملاحظات</label>
                    <textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={4}
                      className="w-full bg-slate-50 dark:bg-[#1a1f28] border border-slate-200 dark:border-white/5 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all text-end resize-none"
                      placeholder="ملاحظات إضافية..."
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button 
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <img src="https://img.icons8.com/fluency/48/save.png" className="w-5 h-5 invert" alt="save" />
                      حفظ
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setIsAddModalOpen(false); setEditSupplier(null); }}
                      className="px-8 bg-slate-200 dark:bg-[#1e293b] hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-700 dark:text-blue-400 py-4 rounded-xl text-sm font-bold transition-all active:scale-[0.98] border border-blue-400/20"
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

      {/* Account Statement / View Modal */}
      <AnimatePresence>
        {viewSupplier && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-white">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setViewSupplier(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-5xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-50 dark:bg-[#1a1f28] p-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5 shrink-0">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <FileText className="w-6 h-6 text-indigo-500" />
                  كشف حساب مورد
                </h3>
                <button 
                  onClick={() => setViewSupplier(null)}
                  className="w-10 h-10 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 text-slate-900 dark:text-white">
                 {/* Header Stats */}
                 <div className="bg-slate-50 dark:bg-[#1a1f28]/50 border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-start">
                  <div className="space-y-2">
                    <h4 className="text-3xl font-black">{viewSupplier.name}</h4>
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-sm leading-none">
                        <Phone className="w-4 h-4 text-indigo-500" />
                        {viewSupplier.phone}
                      </div>
                      {viewSupplier.phone && (
                        <button 
                          onClick={() => {
                            const cleanPhone = viewSupplier.phone!.replace(/\D/g, '');
                            const waPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : (cleanPhone.startsWith('2') ? cleanPhone : '2' + cleanPhone);
                            window.open(`https://wa.me/${waPhone}`, '_blank');
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          واتساب
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-8 md:gap-14">
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 font-bold">إجمالي المشتريات</div>
                      <div className="text-xl font-black font-mono">{statementStats.totalBought.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-[10px] text-slate-400 dark:text-slate-500">ج.م</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 font-bold">إجمالي المدفوعات</div>
                      <div className="text-xl font-black font-mono">{statementStats.totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-[10px] text-slate-400 dark:text-slate-500">ج.م</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 font-bold">إجمالي المرتجعات</div>
                      <div className="text-xl font-black font-mono">{statementStats.totalReturned.toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-[10px] text-slate-400 dark:text-slate-500">ج.م</span></div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 font-bold">الرصيد الحالي</div>
                      <div className={`text-xl font-black font-mono ${statementStats.balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {Math.abs(statementStats.balance).toLocaleString(undefined, {minimumFractionDigits: 2})} <span className="text-[10px] text-slate-400 dark:text-slate-500">ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row items-center gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-3xl border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-4 flex-1 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-500">من:</span>
                      <input 
                        type="date"
                        value={statementDates.from}
                        onChange={(e) => setStatementDates({...statementDates, from: e.target.value})}
                        className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-500">إلى:</span>
                      <input 
                        type="date" 
                        value={statementDates.to}
                        onChange={(e) => setStatementDates({...statementDates, to: e.target.value})}
                        className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <button 
                      onClick={handleApplyStatementFilters}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 shrink-0"
                    >
                      تطبيق 🔍
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-slate-50 dark:bg-[#1a1f28]/30 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/5">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">التاريخ</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">النوع</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">البيان</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">عليه</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">له</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {isStatementLoading ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                              جاري التحميل...
                            </td>
                          </tr>
                        ) : statementData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                              لا توجد حركات مسجلة
                            </td>
                          </tr>
                        ) : (
                          statementData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">
                                {new Date(row.date).toLocaleDateString('ar-EG')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 text-[9px] font-bold rounded-full border ${
                                  row.type.includes('مرتجع') ? 'bg-amber-500/10 text-amber-600 border-amber-500/10' :
                                  row.type.includes('سداد') ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' :
                                  row.type.includes('مشتريات') ? 'bg-blue-500/10 text-blue-600 border-blue-500/10' :
                                  'bg-indigo-500/10 text-indigo-500 border-indigo-500/10'
                                }`}>
                                  {row.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap dark:text-white font-medium">{row.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-400 dark:text-slate-500 font-mono text-xs">
                                {row.debt > 0 ? <span className="text-red-500 font-bold">{row.debt.toLocaleString()}</span> : <span className="italic">---</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-400 dark:text-slate-500 font-mono text-xs">
                                {row.credit > 0 ? <span className="text-emerald-500 font-bold">{row.credit.toLocaleString()}</span> : <span className="italic">---</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono font-bold">
                                {Math.abs(row.balance).toLocaleString()} <span className="text-[9px] font-normal">{row.balance < 0 ? 'عليه' : 'له'}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#1a1f28] p-6 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-center md:justify-start gap-4 shrink-0">
                <button 
                  onClick={() => setViewSupplier(null)}
                  className="px-8 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all"
                >
                  إغلاق
                </button>
                <button 
                  onClick={() => executePrintStatement()}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Printer className="w-4 h-4" /> طباعة
                </button>
                <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20">
                  <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals will be inserted below */}
      <AnimatePresence>
        {purchasesSupplier && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setPurchasesSupplier(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center gap-4 bg-slate-50 dark:bg-white/5">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/20 shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">كشف مشتريات: {purchasesSupplier?.name}</h3>
                  <div className="flex items-center gap-4 text-xs font-bold font-mono">
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10">مجموع: {purchasesStats.totalBought.toLocaleString()} ج.م</span>
                    <span className="text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/10">عدد العناصر: {purchasesStats.itemsCount}</span>
                  </div>
                </div>
                <button onClick={() => setPurchasesSupplier(null)} className="mr-auto text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-transparent">
                {isPurchasesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                    <p className="text-slate-500">جاري تحميل المشتريات...</p>
                  </div>
                ) : purchasesData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                      <ShoppingBag className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">لا توجد مشتريات</h3>
                    <p className="text-slate-500">لم يتم تسجيل أي مشتريات من هذا المورد</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 uppercase font-black text-xs">
                      <tr>
                        <th className="px-4 py-3 rounded-tr-xl">التاريخ</th>
                        <th className="px-4 py-3">النوع</th>
                        <th className="px-4 py-3">الصنف</th>
                        <th className="px-4 py-3">الكمية</th>
                        <th className="px-4 py-3">التكلفة</th>
                        <th className="px-4 py-3 rounded-tl-xl text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {purchasesData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-400">
                            {new Date(item.date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{item.type}</td>
                          <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{item.name}</td>
                          <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400 font-mono">{item.quantity}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 font-mono">{item.cost.toLocaleString()} ج.م</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${
                              item.status === 'returned' 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              {item.status === 'returned' ? 'مرتجع' : 'مكتمل'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paySupplier && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setPaySupplier(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payOperationType === 'receive' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  {payOperationType === 'receive' ? 'استلام من مورد' : 'سداد لمورد'}
                </h3>
                <button onClick={() => setPaySupplier(null)} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePaySupplier} className="p-6 space-y-6">
                <div className="flex gap-4">
                  <button type="button" onClick={() => setPayOperationType('pay')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${payOperationType === 'pay' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-slate-50 dark:bg-[#11151c] text-slate-500 border-slate-200 dark:border-white/10'}`}>سداد لمورد</button>
                  <button type="button" onClick={() => setPayOperationType('receive')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${payOperationType === 'receive' ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20' : 'bg-slate-50 dark:bg-[#11151c] text-slate-500 border-slate-200 dark:border-white/10'}`}>استلام من مورد</button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم المورد</label>
                  <input type="text" value={paySupplier.name} disabled className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none text-slate-500 cursor-not-allowed" />
                </div>
                {paySupplierBalance !== null && (
                  <div className={`p-4 rounded-xl border ${paySupplierBalance < 0 ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' : paySupplierBalance > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-slate-400'}`}>
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span>{paySupplierBalance > 0 ? 'المورد له مديونية بقيمة:' : paySupplierBalance < 0 ? 'رصيد لصالحنا عند المورد بقيمة:' : 'رصيد المورد خالص'}</span>
                      <span className="font-mono text-lg">
                        {Math.abs(paySupplierBalance).toLocaleString()} <span className="text-xs ml-1">ج.م</span>
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{payOperationType === 'receive' ? 'المبلغ المراد استلامه' : 'المبلغ المراد سداده'}</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all font-mono pl-12"
                      placeholder="0.00"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">ج.م</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{payOperationType === 'receive' ? 'إيداع في محفظة' : 'سحب من محفظة'}</label>
                  <select
                    required
                    value={payWalletId}
                    onChange={(e) => setPayWalletId(e.target.value)}
                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="">-- اختر المحفظة --</option>
                    {wallets.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name} (الرصيد: {w.balance} ج.م)</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                  <button type="submit" disabled={isPaying || !payAmount || !payWalletId} className={`flex-1 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2 ${payOperationType === 'receive' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}>
                    {isPaying ? <Loader2 className="w-5 h-5 animate-spin"/> : <><CreditCard className="w-4 h-4"/> {payOperationType === 'receive' ? 'استلام' : 'سداد'}</>}
                  </button>
                  <button type="button" onClick={() => setPaySupplier(null)} className="px-6 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-all active:scale-[0.98]">
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-bold">تأكيد حذف المورد</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed font-medium">
                هل أنت متأكد من حذف هذا المورد؟ سيتم حذف جميع البيانات المرتبطة به ولا يمكن التراجع عن هذا الإجراء.
              </p>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDeleteSupplier}
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
         {viewSupplier && (
            <PrintStatementTemplate
              ref={statementPrintRef}
              entityName={viewSupplier.name}
              entityPhone={viewSupplier.phone || ''}
              statementData={statementData}
              totalDebt={statementStats.totalBought}
              totalPaid={statementStats.totalPaid}
              currentBalance={Math.abs(statementStats.balance)}
              balanceType={statementStats.balance > 0 ? 'دائن' : statementStats.balance < 0 ? 'مدين' : 'متوازن'}
              shopName={settings?.companyName}
              phone={settings?.phone}
              logo={settings?.logo}
            />
         )}
      </div>
    </div>
  );
}
