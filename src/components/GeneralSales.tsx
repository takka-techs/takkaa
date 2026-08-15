import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Calendar, Filter, ChevronDown, 
  Smartphone, Headphones, Wrench, PenTool, 
  Clock, CheckCircle2, XCircle, AlertCircle,
  MoreVertical, Download, Printer, FileText,
  ArrowRight, ArrowLeft, ChevronRight, ChevronLeft,
  CalendarDays, Zap, LayoutGrid, List, RefreshCw,
  TrendingUp, Wallet, Package, ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PrintReceiptTemplate } from './SalesReceiptPrinter';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../contexts/SettingsContext';

interface Sale {
  id: string;
  type: 'device' | 'accessory' | 'maintenance' | 'spare_part';
  product: string;
  customer: string;
  price: number;
  quantity: number;
  total: number;
  date: string;
  rawDate: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export default function GeneralSales() {
  const { settings } = useSettings();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedType, setSelectedType] = useState('الكل');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const receiptPrintRef = React.useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any>(null);

  const executePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: 'Receipt',
    pageStyle: '',
  });

  const handlePrint = (sale: Sale) => {
    let t = sale.type === 'maintenance' ? 'maintenance' : sale.type;

    const pData = {
      invoiceId: sale.id.toString(),
      items: [{
        id: sale.id.toString(),
        name: sale.product,
        price: sale.price,
        quantity: sale.quantity,
        type: t as any
      }],
      totalAmount: sale.total,
      discount: 0,
      finalAmount: sale.total,
      cashReceived: sale.total,
      changeAmount: 0,
      customerName: sale.customer,
      cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'مبيعات',
      shopName: (settings as any)?.companyName || 'تكة أصل الثقة',
      phone: (settings as any)?.phone || '',
      logo: (settings as any)?.logo || ''
    };
    setPrintData(pData);
    
    setTimeout(() => {
      if (window.self !== window.top) {
        alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في الـ Browser (Open in new tab).');
        return;
      }
      if ((window as any).electron) {
        (window as any).electron.printSilent({ type: 'receipt', data: pData });
      } else {
        executePrintReceipt();
      }
    }, 150);
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const token = localStorage.getItem('access_token');

      // Fetch Sales_Items joined with Sales_Invoices
      const response = await fetch(`${baseUrl}/Sales_Items?select=*,Sales_Invoices(*)`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('فشل جلب المبيعات');
      const data = await response.json();

      const mappedSales: Sale[] = data
        .filter((item: any) => {
          const name = item.product_name || item.item_name || '';
          return !name.includes('(مرتجع)');
        })
        .map((item: any) => ({
          id: item.id,
          type: item.product_type,
          product: item.product_name,
          customer: item.Sales_Invoices?.customer_name || 'عميل نقدي',
          price: item.unit_price,
          quantity: item.quantity,
          total: item.total_price,
          date: new Date(item.Sales_Invoices?.created_at).toLocaleString('ar-EG'),
          rawDate: item.Sales_Invoices?.created_at,
          status: 'completed' // Defaulting to completed for now
        }));

      setSales(mappedSales);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const getTypeIcon = (type: Sale['type']) => {
    switch (type) {
      case 'device': return <Smartphone className="w-4 h-4" />;
      case 'accessory': return <Headphones className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'spare_part': return <PenTool className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getTypeText = (type: Sale['type']) => {
    switch (type) {
      case 'device': return 'جهاز';
      case 'accessory': return 'إكسسوار';
      case 'maintenance': return 'صيانة';
      case 'spare_part': return 'قطع غيار';
      default: return 'أخرى';
    }
  };

  const getStatusBadge = (status: Sale['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            مكتمل
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20">
            <Clock className="w-3 h-3" />
            قيد الانتظار
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
            <XCircle className="w-3 h-3" />
            ملغي
          </span>
        );
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.product.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         sale.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'الكل' || 
                       (selectedType === 'أجهزة' && sale.type === 'device') ||
                       (selectedType === 'إكسسوارات' && sale.type === 'accessory') ||
                       (selectedType === 'قطع صيانة' && sale.type === 'maintenance') ||
                       (selectedType === 'قطع غيار (POS)' && sale.type === 'spare_part');
    
    let matchesDate = true;
    const saleDate = new Date(sale.rawDate);
    
    if (dateFrom) {
      const dFrom = new Date(dateFrom);
      dFrom.setHours(0, 0, 0, 0);
      if (saleDate < dFrom) matchesDate = false;
    }
    
    if (dateTo) {
      const dTo = new Date(dateTo);
      dTo.setHours(23, 59, 59, 999);
      if (saleDate > dTo) matchesDate = false;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const setQuickFilter = (type: string) => {
    const now = new Date();
    let from = new Date();
    let to = new Date();

    switch (type) {
      case 'اليوم':
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        from.setDate(now.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(now.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case 'هذا الأسبوع':
        const day = now.getDay(); // 0 is Sunday
        from.setDate(now.getDate() - day);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'هذا الشهر':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to.setHours(23, 59, 59, 999);
        break;
      case 'آخر 30 يوم':
        from.setDate(now.getDate() - 30);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case 'الكل':
        setDateFrom('');
        setDateTo('');
        return;
    }

    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSales();
  };

  const exportToExcel = () => {
    const exportData = filteredSales.map((sale, index) => ({
      '#': index + 1,
      'النوع': getTypeText(sale.type),
      'المنتج': sale.product,
      'العميل': sale.customer,
      'السعر': sale.price,
      'الكمية': sale.quantity,
      'الإجمالي': sale.total,
      'التاريخ': sale.date,
      'الحالة': sale.status === 'completed' ? 'مكتمل' : sale.status === 'pending' ? 'قيد الانتظار' : 'ملغي'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المبيعات");
    XLSX.writeFile(workbook, `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const completedSalesCount = filteredSales.filter(s => s.status === 'completed').length;
  const averageSale = filteredSales.length > 0 ? totalSalesAmount / filteredSales.length : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full" dir="rtl">
      {/* Sidebar Filters (Moved back to Left) */}
      <div className="w-full lg:w-80 space-y-6 shrink-0 order-2 lg:order-1">
        {/* Date Range Filter */}
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <CalendarDays className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold">نطاق التاريخ</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ms-1">من</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2" />
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ms-1">إلى</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2" />
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={() => fetchSales()}
                className="py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 dark:text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-500/20"
              >
                تحديث
              </button>
              <button 
                onClick={() => setQuickFilter('اليوم')}
                className="py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold transition-all"
              >
                اليوم
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <Zap className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold">فلترة سريعة</h3>
          </div>
          
          <div className="space-y-2">
            {['الكل', 'اليوم', 'هذا الأسبوع', 'هذا الشهر', 'آخر 30 يوم'].map((filter) => (
              <button 
                key={filter}
                onClick={() => setQuickFilter(filter)}
                className={`w-full py-2.5 px-4 text-start text-sm font-medium transition-all border border-transparent rounded-xl ${
                  (filter === 'الكل' && !dateFrom && !dateTo) || (filter === 'اليوم' && dateFrom === new Date().toISOString().split('T')[0])
                    ? 'text-teal-400 bg-teal-500/5 border-teal-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-teal-400 hover:bg-teal-500/5 hover:border-teal-500/20'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Type Filter */}
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <Search className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold">بحث</h3>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="ابحث في المبيعات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ms-1">نوع البيع</label>
              <div className="relative">
                <Filter className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2 pointer-events-none" />
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                >
                  <option>الكل</option>
                  <option>أجهزة</option>
                  <option>إكسسوارات</option>
                  <option>قطع صيانة</option>
                  <option>قطع غيار (POS)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute top-1/2 end-3 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6 overflow-hidden flex flex-col order-1 lg:order-2">
        {/* Top Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">المبيعات العامة</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">عرض وإدارة جميع عمليات البيع</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-[#11151c] p-1 rounded-xl border border-slate-200 dark:border-white/5">
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-teal-500 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-teal-500 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>

            <button 
              onClick={handleRefresh}
              className="p-2.5 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 text-slate-500 hover:text-teal-400 rounded-xl transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              تصدير Excel
            </button>
          </div>
        </div>

        {/* Stats Section (Improved Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm flex items-center gap-4 group hover:border-teal-500/30 transition-all">
            <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold mb-1">إجمالي المبيعات</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{totalSalesAmount.toLocaleString()} ج.م</div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm flex items-center gap-4 group hover:border-blue-500/30 transition-all">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold mb-1">عدد العمليات</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{sales.length} عملية</div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm flex items-center gap-4 group hover:border-purple-500/30 transition-all">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold mb-1">نسبة الإنجاز</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{sales.length > 0 ? ((completedSalesCount / sales.length) * 100).toFixed(0) : 0}%</div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm flex items-center gap-4 group hover:border-orange-500/30 transition-all">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold mb-1">متوسط العملية</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{averageSale.toLocaleString(undefined, { maximumFractionDigits: 0 })} ج.م</div>
            </div>
          </div>
        </div>

        {/* Sales Table/Grid Container */}
        <div className="flex-1 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            {viewMode === 'table' ? (
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-16">#</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-start">النوع</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-start">المنتج</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-start">العميل</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">السعر</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">الكمية</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">الإجمالي</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-start">التاريخ</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">الحالة</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                          <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
                          <p className="font-bold">جاري تحميل المبيعات...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                          <AlertCircle className="w-12 h-12 text-slate-300 dark:text-white/10" />
                          <p className="font-bold text-lg">لا يوجد مبيعات لعرضها</p>
                          <p className="text-sm">تأكد من فلاتر البحث أو جرب إضافة مبيعات جديدة</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSales.map((sale, index) => (
                    <motion.tr 
                      key={sale.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm text-slate-500 text-center font-mono">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                            {getTypeIcon(sale.type)}
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{getTypeText(sale.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{sale.product}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{getTypeText(sale.type)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{sale.customer}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white text-center font-bold">{sale.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white text-center font-bold">{sale.quantity}</td>
                      <td className="px-6 py-4 text-sm text-teal-400 text-center font-bold">{sale.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{sale.date}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          {getStatusBadge(sale.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handlePrint(sale)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6">
                {loading ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
                    <p className="font-bold">جاري تحميل المبيعات...</p>
                  </div>
                ) : filteredSales.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
                    <AlertCircle className="w-12 h-12 text-slate-300 dark:text-white/10" />
                    <p className="font-bold text-lg">لا يوجد مبيعات لعرضها</p>
                    <p className="text-sm">تأكد من فلاتر البحث أو جرب إضافة مبيعات جديدة</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredSales.map((sale, index) => (
                      <motion.div
                        key={sale.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-5 hover:border-teal-500/30 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                              {getTypeIcon(sale.type)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{sale.product}</div>
                              <div className="text-xs text-slate-500">{getTypeText(sale.type)}</div>
                            </div>
                          </div>
                          {getStatusBadge(sale.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-3 rounded-xl bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/5">
                            <div className="text-[10px] text-slate-500 mb-1 uppercase font-bold tracking-wider">السعر</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{sale.price.toLocaleString()} ج.م</div>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/5">
                            <div className="text-[10px] text-slate-500 mb-1 uppercase font-bold tracking-wider">الكمية</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{sale.quantity}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                          <div className="text-xs text-slate-500">{sale.date}</div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-teal-400">{sale.total.toLocaleString()} ج.م</span>
                            <button 
                              onClick={() => handlePrint(sale)}
                              className="p-2 text-slate-400 hover:text-teal-500 hover:bg-teal-500/10 rounded-xl transition-all"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/5 border-t border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
            <div className="text-sm text-slate-500">
              عرض <span className="font-medium text-slate-900 dark:text-white">1</span> إلى <span className="font-medium text-slate-900 dark:text-white">{filteredSales.length}</span> من <span className="font-medium text-slate-900 dark:text-white">{filteredSales.length}</span> عملية
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:bg-white dark:hover:bg-white/5 disabled:opacity-50" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-teal-500 text-slate-900 dark:text-white text-sm font-bold">1</button>
              <button className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:bg-white dark:hover:bg-white/5 disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
        {printData && (
          <PrintReceiptTemplate ref={receiptPrintRef} {...printData} />
        )}
      </div>
    </div>
  );
}
