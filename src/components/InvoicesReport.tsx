import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Download, FileText, Printer, CheckCircle2, XCircle, Search, AlertCircle, CornerDownLeft, DollarSign, Filter, RefreshCcw, Wrench, X, Tag, User, MapPin, Phone
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../contexts/SettingsContext';
import { PrintReceiptTemplate } from './PrintReceiptTemplate';
import { PrintReportTemplate } from './PrintReportTemplate';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function InvoicesReport() {
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({ 
    period: 'آخر شهر', // 'الكل', 'آخر أسبوع', 'آخر شهر'
    type: 'الكل', // 'الكل', 'مبيعات', 'مرتجعات'
    searchQuery: ''
  });
  
  const [stats, setStats] = useState({
    totalInvoicesCount: 0,
    totalSalesAmount: 0,
    returnsCount: 0,
    totalReturnsAmount: 0,
  });

  const [displayData, setDisplayData] = useState<any[]>([]);

  // Modals state
  const [viewModalData, setViewModalData] = useState<any | null>(null);
  const [editModalData, setEditModalData] = useState<any | null>(null);

  // --- Printing Configuration ---
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const [printInvoiceData, setPrintInvoiceData] = useState<any>(null);

  const executePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: 'Receipt',
    pageStyle: '',
  });

  const printReceiptAction = (dataPayload: any) => {
    setPrintInvoiceData(dataPayload);
    setTimeout(() => {
      if (window.self !== window.top) {
        alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة المصغرة لدواعي أمنية.\n\nمن فضلك اضغط على زر "Open in new tab" (بالأعلى على اليمين) لفتح التطبيق في نافذة مستقلة عبر المتصفح لتتمكن من استخدام الطباعة بصورة طبيعية.');
        return;
      }
      if ((window as any).electron) {
        (window as any).electron.printSilent({ type: 'receipt', data: dataPayload });
      } else {
        executePrintReceipt();
      }
    }, 200);
  };
  // -----------------------------

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const _activeBranchId = localStorage.getItem("takka_active_branch_id");
      const _tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
      const branchSuffix = (_activeBranchId && _activeBranchId !== 'ALL') ? `&branch_id=eq.${_activeBranchId}` : (_tenantId ? `&tenant_id=eq.${_tenantId}` : "");
      const branchSuffixFirst = (_activeBranchId && _activeBranchId !== 'ALL') ? `?branch_id=eq.${_activeBranchId}` : (_tenantId ? `?tenant_id=eq.${_tenantId}` : "");
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${localStorage.getItem('access_token') || SUPABASE_KEY}`
      };
      
      const userId = localStorage.getItem('user_id');

      const [invRes, retRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?select=*,Sales_Items(*)&order=created_at.desc${branchSuffix}`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/Sales_Returns?select=*&order=created_at.desc${branchSuffix}`, { headers })
      ]);

      const invData = invRes.ok ? await invRes.json() : [];
      const retData = retRes.ok ? await retRes.json() : [];

      setInvoices(invData);
      setReturns(retData);
      processDashboard(invData, retData, filters);
    } catch (err) {
      console.error('Error fetching invoices report:', err);
      processDashboard([], [], filters);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    processDashboard(invoices, returns, filters);
  }, [filters, invoices, returns]);

  const processDashboard = (invs: any[], rets: any[], currentFilters: any) => {
    let combined: any[] = [];

    // Format Invoices
    invs.forEach(inv => {
      combined.push({
        type: 'مبيعات',
        id: inv.id,
        invoice_number: inv.invoice_number,
        date: inv.created_at,
        customer: inv.customer_name || 'عميل نقدي',
        itemsCount: inv.Sales_Items?.length || 0,
        itemsStr: inv.Sales_Items ? `${inv.Sales_Items.length} عنصر (${inv.Sales_Items[0]?.product_name || '...'})` : '0 عنصر',
        total: inv.net_amount || inv.total_amount || 0,
        paid: inv.paid_amount ?? (inv.net_amount || inv.total_amount || 0),
        status: inv.payment_method === 'installment' ? 'تقسيط' : inv.payment_method === 'deferred' ? 'آجل' : 'مدفوع',
        raw: inv
      });
    });

    // Format Returns
    rets.forEach(ret => {
      combined.push({
        type: 'مرتجعات',
        id: ret.id,
        invoice_number: ret.invoice_number || `RET-${ret.id}`,
        date: ret.created_at,
        customer: ret.customer_name || 'عميل نقدي',
        itemsCount: 1,
        itemsStr: `1 عنصر (${ret.product_name || '...'})`,
        total: ret.refund_amount || ret.total_amount || 0,
        paid: ret.refund_amount || ret.total_amount || 0,
        status: ret.status || 'مكتمل',
        raw: ret
      });
    });

    // Default Sort (date desc)
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply Period Filter
    if (currentFilters.period === 'آخر شهر') {
      const lastMonth = subDays(new Date(), 30);
      combined = combined.filter(i => new Date(i.date) >= lastMonth);
    } else if (currentFilters.period === 'آخر أسبوع') {
      const lastWeek = subDays(new Date(), 7);
      combined = combined.filter(i => new Date(i.date) >= lastWeek);
    }

    // Calc Stats before Type & Search Filter to see context of period
    let invAmt = 0;
    let invCnt = 0;
    let retAmt = 0;
    let retCnt = 0;

    combined.forEach(c => {
      if (c.type === 'مبيعات') {
        invAmt += Number(c.total);
        invCnt++;
      } else {
        retAmt += Number(c.total);
        retCnt++;
      }
    });

    setStats({
      totalInvoicesCount: invCnt + retCnt,
      totalSalesAmount: invAmt,
      returnsCount: retCnt,
      totalReturnsAmount: retAmt
    });

    // Apply Type Filter
    if (currentFilters.type !== 'الكل') {
      combined = combined.filter(c => c.type === currentFilters.type);
    }

    // Apply Search Filter
    if (currentFilters.searchQuery) {
      const q = currentFilters.searchQuery.toLowerCase();
      combined = combined.filter(c => 
        (c.invoice_number && c.invoice_number.toLowerCase().includes(q)) || 
        (c.customer && c.customer.toLowerCase().includes(q))
      );
    }

    setDisplayData(combined);
  };

  const handleExportExcel = () => {
    const exportData = displayData.map((item, index) => {
      return {
        '#': index + 1,
        'رقم الفاتورة': item.invoice_number,
        'النوع': item.type,
        'التاريخ': format(new Date(item.date), 'yyyy/MM/dd'),
        'العميل': item.customer,
        'العناصر': item.itemsStr,
        'الإجمالي': Number(item.total).toFixed(2),
        'المدفوع': Number(item.paid).toFixed(2),
        'الحالة': item.status
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'فواتير نقطة البيع');
    XLSX.writeFile(workbook, `فواتير_POS_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportReportRef = useRef<HTMLDivElement>(null);
  const executePrintReport = useReactToPrint({
    contentRef: exportReportRef,
    documentTitle: `Invoices_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const handleExportPDF = () => {
    if (window.self !== window.top) {
      alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في نافذة مستقلة (Open in new tab).');
      return;
    }
    executePrintReport();
  };

  const getTypeStyle = (type: string) => {
    if (type === 'مبيعات') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (type === 'مرتجعات') return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'تقسيط') return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20';
    if (status === 'مرتجعة') return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20';
    if (status === 'آجل') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    if (status === 'مكتمل' || status === 'مدفوع' || status === 'paid') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
    if (status === 'غير مدفوع' || status === 'unpaid') return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400';
  };

  const handlePrint = (item: any) => {
    if (item.type === 'مبيعات') {
      const inv = item.raw;
      const itemsForPrint = (inv.Sales_Items || []).map((si: any, idx: number) => ({
        id: si.product_id || si.item_id || idx,
        name: si.product_name || si.item_name || 'منتج غير معروف',
        price: Number(si.unit_price) || (Number(si.total_price) / (Number(si.quantity) || 1)) || 0,
        stock: 0,
        category: 'عام',
        type: si.product_type || 'device',
        cartQuantity: si.quantity || 1
      }));
      const dataPayload = {
        invoiceId: inv.invoice_number,
        items: itemsForPrint,
        totalAmount: inv.total_amount + (inv.discount || 0),
        discount: inv.discount || 0,
        finalAmount: inv.net_amount || inv.total_amount,
        cashReceived: inv.paid_amount || inv.net_amount || inv.total_amount,
        changeAmount: 0,
        customerName: inv.customer_name || 'عميل نقدي',
        cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'كاشير',
        shopName: settings?.companyName || 'تكة أصل الثقة',
        phone: settings?.phone || '',
        logo: settings?.logo || ''
      };
      printReceiptAction(dataPayload);
    } else {
      const ret = item.raw;
      const itemsForPrint = [{
        id: ret.id || 0,
        name: ret.product_name || 'مرتجع عام',
        price: ret.refund_amount || ret.total_amount || 0,
        stock: 0,
        category: 'عام',
        type: 'return',
        cartQuantity: 1
      }];
      const dataPayload = {
        invoiceId: ret.invoice_number || `RET-${ret.id}`,
        items: itemsForPrint,
        totalAmount: ret.refund_amount || ret.total_amount || 0,
        discount: 0,
        finalAmount: ret.refund_amount || ret.total_amount || 0,
        cashReceived: ret.refund_amount || ret.total_amount || 0,
        changeAmount: 0,
        customerName: ret.customer_name || 'عميل نقدي',
        cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'كاشير',
        shopName: settings?.companyName || 'تكة أصل الثقة',
        phone: settings?.phone || '',
        logo: settings?.logo || ''
      };
      printReceiptAction(dataPayload);
    }
  };

  const handleSaveEdit = async (updatedData: any) => {
    if (!editModalData) return;
    setIsLoading(true);
    try {
      const isSale = editModalData.type === 'مبيعات';
      const table = isSale ? 'Sales_Invoices' : 'Sales_Returns';
      
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${editModalData.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${localStorage.getItem('access_token') || SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updatedData)
      });

      if (res.ok) {
        setEditModalData(null);
        await fetchData();
      } else {
        console.error('Failed to update');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full text-slate-900 dark:text-white" dir="rtl">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-[#0b101a]/50 z-50 flex items-center justify-center rounded-3xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-[#161b22] px-6 py-4 rounded-2xl shadow-xl border dark:border-white/10">
             <div className="w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-blue-500 animate-spin"></div>
             <div className="text-slate-600 dark:text-slate-400 font-bold">جاري تحميل الفواتير...</div>
          </div>
        </div>
      )}

      {/* Header & Main Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
         <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            </div>
            فواتير نقطة البيع
         </h2>
         <div className="flex items-center gap-2">
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-600/20">
               <Printer className="w-4 h-4" /> طباعة / PDF
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-emerald-500/20">
               <Download className="w-4 h-4" /> تصدير Excel
            </button>
         </div>
      </div>

      <PrintReportTemplate
        ref={exportReportRef}
        title="تقرير الفواتير الشامل"
        subtitle={`الفترة: ${filters.period} | النوع: ${filters.type}`}
        summary={[
          { label: 'إجمالي الفواتير', value: stats.totalInvoicesCount },
          { label: 'إجمالي المبيعات', value: stats.totalSalesAmount.toLocaleString(), isCurrency: true },
          { label: 'صافي المبيعات', value: (stats.totalSalesAmount - stats.totalReturnsAmount).toLocaleString(), isCurrency: true },
          { label: 'إجمالي المرتجعات', value: stats.totalReturnsAmount.toLocaleString(), isCurrency: true }
        ]}
        columns={[
          { header: 'التاريخ', accessor: (item) => format(new Date(item.date), 'yyyy/MM/dd hh:mm a', { locale: ar }) },
          { header: 'النوع', accessor: 'type' },
          { header: 'رقم الفاتورة', accessor: 'invoice_number' },
          { header: 'العميل', accessor: 'customer' },
          { header: 'الحالة', accessor: 'status' },
          { header: 'المدفوع', accessor: (item) => Number(item.paid).toLocaleString(), isNumeric: true }
        ]}
        data={displayData}
      />

      {/* KPI Cards (Matches Screenshot precisely) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <motion.div 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
           className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/5 rounded-[1.5rem] overflow-hidden shadow-sm flex flex-col relative"
         >
            <div className="h-4 w-full bg-blue-500"></div>
            <div className="p-8">
               <div className="flex justify-between items-start mb-2">
                   <div className="p-3 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/20">
                      <FileText className="w-6 h-6" />
                   </div>
               </div>
               <div className="text-5xl font-black font-mono mb-2 text-slate-900 dark:text-white text-end mt-4">{stats.totalInvoicesCount}</div>
               <div className="text-sm font-bold text-slate-500 dark:text-slate-400 text-end">إجمالي الفواتير</div>
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
           className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/5 rounded-[1.5rem] overflow-hidden shadow-sm flex flex-col relative"
         >
            <div className="h-4 w-full bg-emerald-500"></div>
            <div className="p-8">
               <div className="flex justify-between items-start mb-2">
                   <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
                      <DollarSign className="w-6 h-6" />
                   </div>
               </div>
               <div className="text-4xl font-black font-mono text-emerald-500 mb-2 text-end mt-4">{(stats.totalSalesAmount - stats.totalReturnsAmount).toLocaleString()} ج.م</div>
               <div className="text-sm font-bold text-slate-500 dark:text-slate-400 text-end">إجمالي المبيعات (الصافي)</div>
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
           className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/5 rounded-[1.5rem] overflow-hidden shadow-sm flex flex-col relative"
         >
            <div className="h-4 w-full bg-orange-500"></div>
            <div className="p-8">
               <div className="flex justify-between items-start mb-2">
                   <div className="p-3 bg-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20">
                      <RefreshCcw className="w-6 h-6" />
                   </div>
               </div>
               <div className="text-4xl font-black font-mono text-slate-900 dark:text-white mb-2 text-end mt-4">{stats.totalReturnsAmount.toLocaleString()} ج.م</div>
               <div className="text-sm font-bold text-slate-500 dark:text-slate-400 text-end flex justify-end gap-2 items-center">
                 فواتير المرتجعات <span className="px-2 py-0.5 bg-orange-500 text-white rounded-md text-xs font-mono">{stats.returnsCount}</span>
               </div>
            </div>
         </motion.div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 dark:bg-[#121620] border border-slate-200 dark:border-white/5 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
         <div className="flex flex-wrap items-center gap-4 w-full justify-between">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">الفترة</span>
                  <select 
                     value={filters.period} 
                     onChange={e => setFilters({...filters, period: e.target.value})}
                     className="bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-lg px-6 py-2.5 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                     <option value="الكل">الكل</option>
                     <option value="آخر أسبوع">آخر أسبوع</option>
                     <option value="آخر شهر">آخر شهر</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">نوع الفاتورة</span>
                  <select 
                     value={filters.type} 
                     onChange={e => setFilters({...filters, type: e.target.value})}
                     className="bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-lg px-6 py-2.5 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                     <option value="الكل">الكل</option>
                     <option value="مبيعات">مبيعات</option>
                     <option value="مرتجعات">مرتجعات</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">بحث</span>
                  <input 
                     type="text"
                     placeholder="رقم الفاتورة أو اسم العميل..."
                     value={filters.searchQuery}
                     onChange={e => setFilters({...filters, searchQuery: e.target.value})}
                     className="bg-white dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
                  />
                </div>
            </div>
            
            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-600/20">تطبيق</button>
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
           <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              قائمة الفواتير
           </h3>
           <div className="text-sm font-bold text-slate-500">
             {displayData.length} فاتورة
           </div>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-right">
             <thead className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-white/2">
                <tr>
                   <th className="px-6 py-4">#</th>
                   <th className="px-6 py-4">رقم الفاتورة</th>
                   <th className="px-6 py-4 text-center">النوع</th>
                   <th className="px-6 py-4">التاريخ</th>
                   <th className="px-6 py-4">العميل</th>
                   <th className="px-6 py-4">العناصر</th>
                   <th className="px-6 py-4">الإجمالي</th>
                   <th className="px-6 py-4">المدفوع</th>
                   <th className="px-6 py-4 text-center">الحالة</th>
                   <th className="px-6 py-4 text-center">إجراءات</th>
                </tr>
             </thead>
             <tbody>
                {displayData.map((item, idx) => {
                  const isReturned = item.status === 'مرتجعة';
                  return (
                  <tr key={`${item.type}-${item.id}`} className={`border-b hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${isReturned ? 'bg-orange-50/50 dark:bg-orange-900/10 opacity-75 border-orange-100 dark:border-orange-900/20' : 'border-slate-100 dark:border-white/5'}`}>
                     <td className={`px-6 py-4 font-mono font-bold ${isReturned ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{idx + 1}</td>
                     <td className={`px-6 py-4 font-mono font-bold ${isReturned ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{item.invoice_number}</td>
                     <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getTypeStyle(item.type)}`}>
                          {item.type}
                        </span>
                     </td>
                     <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{format(new Date(item.date), 'yyyy/MM/dd')}</td>
                     <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{item.customer}</td>
                     <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{item.itemsStr}</td>
                     <td className={`px-6 py-4 font-black font-mono ${item.type === 'مرتجعات' ? 'text-rose-500' : isReturned ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                       {Number(item.total).toLocaleString()} ج.م
                     </td>
                     <td className={`px-6 py-4 font-black font-mono ${item.type === 'مرتجعات' ? 'text-rose-500' : isReturned ? 'text-slate-400 line-through' : 'text-emerald-500'}`}>
                       {Number(item.paid).toLocaleString()} ج.م
                     </td>
                     <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                           <button onClick={() => setViewModalData(item)} className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 rounded-xl transition-all" title="عرض التفاصيل">
                              <Search className="w-5 h-5" />
                           </button>
                           <button onClick={() => handlePrint(item)} className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all border border-slate-200 dark:border-white/10" title="طباعة">
                              <Printer className="w-5 h-5" />
                           </button>
                           {!isReturned && (
                           <button onClick={() => setEditModalData(item)} className="w-9 h-9 flex items-center justify-center bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white rounded-xl transition-all" title="تعديل">
                              <Wrench className="w-5 h-5" />
                           </button>
                           )}
                        </div>
                     </td>
                  </tr>
                )})}
                {displayData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50 dark:bg-white/[0.01]">
                      لا توجد فواتير تطابق معايير البحث
                    </td>
                  </tr>
                )}
             </tbody>
           </table>
        </div>
      </div>

      <AnimatePresence>
        {viewModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewModalData(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#161b22] w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
               <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white">تفاصيل {viewModalData.type === 'مبيعات' ? 'فاتورة المبيعات' : 'فاتورة المرتجع'}</h3>
                       <p className="text-sm font-mono text-slate-500">{viewModalData.invoice_number}</p>
                     </div>
                  </div>
                  <button onClick={() => setViewModalData(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                        <div className="text-xs text-slate-500 mb-1 font-bold">التاريخ</div>
                        <div className="font-mono text-sm">{format(new Date(viewModalData.date), 'yyyy/MM/dd HH:mm a')}</div>
                     </div>
                     <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                        <div className="text-xs text-slate-500 mb-1 font-bold">العميل</div>
                        <div className="font-bold text-sm">{viewModalData.customer}</div>
                     </div>
                     <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                        <div className="text-xs text-slate-500 mb-1 font-bold">الحالة</div>
                        <div className="font-bold text-sm">{viewModalData.status}</div>
                     </div>
                     <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                        <div className="text-xs text-slate-500 mb-1 font-bold">الإجمالي</div>
                        <div className="font-black text-emerald-500 font-mono text-lg">{Number(viewModalData.total).toLocaleString()} ج.م</div>
                     </div>
                  </div>

                  <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                     <Tag className="w-4 h-4" /> العناصر
                  </h4>
                  
                  <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                     <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">
                           <tr>
                              <th className="px-4 py-3">المنتج</th>
                              <th className="px-4 py-3 text-center">الكمية</th>
                              <th className="px-4 py-3 text-center">السعر</th>
                              <th className="px-4 py-3 text-left">الإجمالي</th>
                           </tr>
                        </thead>
                        <tbody>
                           {viewModalData.type === 'مبيعات' ? (
                             (viewModalData.raw.Sales_Items || []).map((si: any, idx: number) => (
                               <tr key={idx} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                  <td className="px-4 py-3 font-medium">{si.product_name}</td>
                                  <td className="px-4 py-3 text-center font-mono">{si.quantity}</td>
                                  <td className="px-4 py-3 text-center font-mono">{Number(si.unit_price).toLocaleString()}</td>
                                  <td className="px-4 py-3 text-left font-mono font-bold">{Number(si.total_price).toLocaleString()}</td>
                               </tr>
                             ))
                           ) : (
                              <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                 <td className="px-4 py-3 font-medium">{viewModalData.raw.product_name || 'مرتجع فاتورة'}</td>
                                 <td className="px-4 py-3 text-center font-mono">1</td>
                                 <td className="px-4 py-3 text-center font-mono">{Number(viewModalData.raw.refund_amount || viewModalData.raw.total_amount).toLocaleString()}</td>
                                 <td className="px-4 py-3 text-left font-mono font-bold text-rose-500">{Number(viewModalData.raw.refund_amount || viewModalData.raw.total_amount).toLocaleString()}</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-end gap-3">
                   <button onClick={() => handlePrint(viewModalData)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2">
                       <Printer className="w-4 h-4" /> طباعة
                   </button>
                   <button onClick={() => setViewModalData(null)} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl text-sm font-bold transition-all">
                       إغلاق
                   </button>
               </div>
            </motion.div>
          </div>
        )}

        {editModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditModalData(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#161b22] w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col">
               <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
                        <Wrench className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">تعديل معلومات الفاتورة</h3>
                  </div>
                  <button onClick={() => setEditModalData(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="p-6 space-y-4">
                  <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
                     <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                     <p className="text-sm font-bold text-orange-700 dark:text-orange-400">التعديل متاح فقط لمعلومات العميل والملاحظات لتجنب الأخطاء المحاسبية في الإجماليات.</p>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 mt-4">اسم العميل</label>
                     <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                           type="text" 
                           defaultValue={editModalData.customer}
                           id="edit-customer-name"
                           className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl pr-10 pl-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ملاحظات / رقم الهاتف</label>
                     <div className="relative">
                        <Phone className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                        <textarea 
                           rows={3}
                           defaultValue={editModalData.raw.notes || editModalData.raw.customer_phone || ''}
                           id="edit-customer-notes"
                           className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl pr-10 pl-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        ></textarea>
                     </div>
                  </div>
               </div>

               <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center gap-3">
                   <button 
                     onClick={() => {
                        const newName = (document.getElementById('edit-customer-name') as HTMLInputElement)?.value;
                        const newNotes = (document.getElementById('edit-customer-notes') as HTMLTextAreaElement)?.value;
                        handleSaveEdit({ customer_name: newName, notes: newNotes });
                     }} 
                     className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
                     disabled={isLoading}
                   >
                       {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                   </button>
                   <button onClick={() => setEditModalData(null)} disabled={isLoading} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl text-sm font-bold transition-all">
                       إلغاء
                   </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Components */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
        {printInvoiceData && (
           <PrintReceiptTemplate ref={receiptPrintRef} {...printInvoiceData} />
        )}
      </div>
    </div>
  );
}
