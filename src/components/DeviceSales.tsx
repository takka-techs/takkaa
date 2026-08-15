import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Calendar, Filter, ChevronDown, 
  Smartphone, Clock, CheckCircle2, XCircle, 
  MoreVertical, Download, RefreshCw,
  TrendingUp, Wallet, Package, ArrowUpRight, ArrowDownRight,
  CalendarDays, Zap, LayoutGrid, List, Eye, Trash2, Edit3,
  Trophy, Target, History, Star, ChevronRight, ChevronLeft,
  FileText, Users, Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { PrintReceiptTemplate } from './SalesReceiptPrinter';
import { useSettings } from '../contexts/SettingsContext';

interface DeviceSale {
  id: string;
  saleNumber: string;
  brand: string;
  model: string;
  capacity: string;
  price: number;
  cost: number;
  paid: number;
  imei: string;
  condition: string;
  customer: string;
  date: string;
  rawDate: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export default function DeviceSales() {
  const { settings } = useSettings();
  const [sales, setSales] = useState<DeviceSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSale, setSelectedSale] = useState<DeviceSale | null>(null);

  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any>(null);

  const executePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: 'Receipt',
    pageStyle: '',
  });

  const handlePrint = (sale: DeviceSale) => {
    const pData = {
      invoiceId: sale.saleNumber.replace('#', ''),
      items: [{
        id: sale.id,
        name: `${sale.brand} ${sale.model}`,
        price: sale.price,
        quantity: 1,
        type: 'device',
        imei1: sale.imei
      }],
      totalAmount: sale.price,
      discount: 0,
      finalAmount: sale.price,
      cashReceived: sale.paid,
      changeAmount: 0,
      customerName: sale.customer,
      cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'كاشير',
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

      // Fetch Sales_Items where product_type is 'device'
      const response = await fetch(`${baseUrl}/Sales_Items?product_type=eq.device&select=*,Sales_Invoices(*)`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('فشل جلب مبيعات الأجهزة');
      const data = await response.json();

      const mappedSales: DeviceSale[] = data
        .filter((item: any) => {
          const name = item.product_name || item.item_name || '';
          return !name.includes('(مرتجع)');
        })
        .map((item: any) => ({
          id: item.id,
          saleNumber: item.Sales_Invoices?.invoice_number || `#${item.id}`,
          brand: 'جهاز', // We might need to fetch more details if we want brand/model separately
          model: item.product_name,
          capacity: '-',
          price: item.unit_price,
          cost: 0, // Cost is not in Sales_Items
          paid: item.total_price,
          imei: '-',
          condition: '-',
          customer: item.Sales_Invoices?.customer_name || 'عميل نقدي',
          date: new Date(item.Sales_Invoices?.created_at).toLocaleString('ar-EG'),
          rawDate: item.Sales_Invoices?.created_at,
          status: 'completed'
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

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         sale.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
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

    return matchesSearch && matchesDate;
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
      case 'هذا الأسبوع':
        const day = now.getDay();
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
      'م': index + 1,
      '#بيع': sale.saleNumber,
      'النوع': sale.brand,
      'الموديل': sale.model,
      'السعة': sale.capacity,
      'السعر': sale.price,
      'العميل': sale.customer,
      'التاريخ': sale.date,
      'الحالة': sale.status === 'completed' ? 'مكتمل' : sale.status === 'pending' ? 'قيد الانتظار' : 'ملغي'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "مبيعات الأجهزة");
    XLSX.writeFile(workbook, `device_sales_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.price, 0);
  const totalCount = filteredSales.length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full font-sans" dir="rtl">
      {/* Sidebar Filters & Stats */}
      <div className="w-full lg:w-85 space-y-6 shrink-0 order-2 lg:order-1">
        {/* Main Actions */}
        <div className="bg-white dark:bg-[#11151c]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
          
          <div className="space-y-4 mb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ms-1">من</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2" />
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
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
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={() => fetchSales()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mb-4 group/btn"
          >
            <RefreshCw className={`w-5 h-5 group-hover/btn:rotate-180 transition-transform ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setQuickFilter('الكل')}
              className="py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              الكل
            </button>
            <button 
              onClick={() => setQuickFilter('اليوم')}
              className="py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              اليوم
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="bg-white dark:bg-[#11151c]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <Zap className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold tracking-tight">فلاتر سريعة</h3>
          </div>
          
          <div className="space-y-2">
            {[
              { label: 'اليوم', icon: CalendarDays },
              { label: 'هذا الأسبوع', icon: History },
              { label: 'هذا الشهر', icon: Target },
              { label: 'آخر 30 يوم', icon: Zap }
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => setQuickFilter(item.label)}
                className={`w-full py-3 px-4 text-start text-sm font-medium transition-all border rounded-2xl flex items-center gap-3 group ${
                  (item.label === 'اليوم' && dateFrom === new Date().toISOString().split('T')[0])
                    ? 'text-blue-400 bg-blue-500/5 border-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-400 hover:bg-blue-500/5 border-transparent hover:border-blue-500/20'
                }`}
              >
                <item.icon className="w-4 h-4 transition-colors" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-[#11151c]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold tracking-tight">إحصائيات سريعة</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 opacity-50" />
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">إجمالي المبيعات</span>
                <Trophy className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{totalSalesAmount.toLocaleString()} ج.م</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 h-full bg-blue-500 opacity-50" />
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">عدد الأجهزة</span>
                <Wallet className="w-3 h-3 text-blue-400" />
              </div>
              <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{totalCount} <span className="text-xs text-slate-500 font-sans">(جهاز)</span></div>
            </div>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-white dark:bg-[#11151c]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <Star className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold tracking-tight">الأكثر مبيعاً</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-bold text-xs">1</div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Samsung test</div>
                  <div className="text-[10px] text-slate-500">Samsung</div>
                </div>
              </div>
              <div className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-bold">1 جهاز</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6 overflow-hidden flex flex-col order-1 lg:order-2">
        {/* Top Search & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[300px] relative group">
            <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="ابحث في المبيعات... (موديل، نوع، عميل، سعر)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl py-4 ps-12 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all shadow-sm font-medium"
            />
            <div className="absolute inset-y-0 end-0 pe-4 flex items-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5">Ctrl+K</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-[#11151c] p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>

            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 group"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              تصدير Excel
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-slate-500">نتائج: <span className="font-bold text-blue-500">{filteredSales.length}</span></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">مكتمل</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">قيد الانتظار</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ملغي</span>
            </div>
          </div>
        </div>

        {/* Sales Table/Grid Container */}
        <div className="flex-1 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          <div className="overflow-x-auto flex-1 custom-scrollbar relative z-10">
            {viewMode === 'table' ? (
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/2 border-b border-slate-200 dark:border-white/5">
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center w-16">م</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">#بيع</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-start">النوع</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-start">الموديل</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">السعة</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">السعر</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-start">العميل</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-start">التاريخ</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {filteredSales.map((sale, index) => (
                      <motion.tr 
                        key={sale.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-blue-500/5 dark:hover:bg-blue-500/10 transition-colors group/row"
                      >
                        <td className="px-6 py-5 text-sm text-slate-500 text-center font-mono">{index + 1}</td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white text-center font-mono">{sale.saleNumber}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/5 group-hover/row:border-blue-500/30 transition-colors">
                              <Smartphone className="w-5 h-5 text-slate-400 group-hover/row:text-blue-400 transition-colors" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{sale.brand}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{sale.model}</div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 font-mono">{sale.capacity}GB</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="text-sm font-black text-emerald-500 font-mono tracking-tighter">{sale.price.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-500 font-medium">{sale.customer}</td>
                        <td className="px-6 py-5 text-sm text-slate-500 font-mono whitespace-nowrap">{sale.date}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              sale.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                              sale.status === 'pending' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                              'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                            }`} />
                            <button 
                              onClick={() => setSelectedSale(sale)}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            ) : (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredSales.map((sale, index) => (
                    <motion.div
                      key={sale.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#11151c] flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform">
                            <Smartphone className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{sale.model}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sale.brand}</div>
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          sale.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                          sale.status === 'pending' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                          'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                        }`} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/5">
                          <div className="text-[10px] text-slate-500 mb-1 uppercase font-bold tracking-widest">السعر</div>
                          <div className="text-lg font-black text-emerald-500 font-mono tracking-tighter">{sale.price.toLocaleString()}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/5">
                          <div className="text-[10px] text-slate-500 mb-1 uppercase font-bold tracking-widest">السعة</div>
                          <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{sale.capacity}GB</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 font-mono">{sale.date}</div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setSelectedSale(sale)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="px-8 py-6 bg-slate-50/50 dark:bg-white/2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0 relative z-10">
            <div className="text-sm text-slate-500 font-medium">
              عرض <span className="font-bold text-slate-900 dark:text-white">1</span> إلى <span className="font-bold text-slate-900 dark:text-white">{filteredSales.length}</span> من <span className="font-bold text-slate-900 dark:text-white">{filteredSales.length}</span> عملية
            </div>
            <div className="flex items-center gap-3">
              <button className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-400 hover:bg-white dark:hover:bg-white/5 disabled:opacity-50 transition-all" disabled>
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                <button className="w-10 h-10 rounded-2xl bg-blue-600 text-white text-sm font-black shadow-lg shadow-blue-600/20">1</button>
                <button className="w-10 h-10 rounded-2xl hover:bg-white dark:hover:bg-white/5 text-slate-500 text-sm font-bold transition-all">2</button>
                <button className="w-10 h-10 rounded-2xl hover:bg-white dark:hover:bg-white/5 text-slate-500 text-sm font-bold transition-all">3</button>
              </div>
              <button className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Details Modal */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSale(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 pb-4 flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">تفاصيل عملية البيع</h2>
                </div>
                <button 
                  onClick={() => setSelectedSale(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8 custom-scrollbar">
                {/* Sale Number & Status */}
                <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mb-2">رقم البيع</div>
                    <div className="text-5xl font-black text-blue-500 font-mono mb-4">{selectedSale.saleNumber}</div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      {selectedSale.status === 'completed' ? 'مكتمل' : selectedSale.status === 'pending' ? 'قيد الانتظار' : 'ملغي'}
                    </div>
                  </div>
                </div>

                {/* Device Info Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Smartphone className="w-5 h-5" />
                    <h3 className="font-bold text-sm uppercase tracking-widest">الجهاز</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">الموديل</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedSale.model}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">النوع / السعة</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedSale.brand} • {selectedSale.capacity}GB</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">الحالة</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedSale.condition}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">IMEI</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{selectedSale.imei}</div>
                    </div>
                  </div>
                </div>

                {/* Financial Info Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Wallet className="w-5 h-5" />
                    <h3 className="font-bold text-sm uppercase tracking-widest">المالية</h3>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-6 text-center mb-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">سعر البيع</div>
                    <div className="text-3xl font-black text-emerald-500 font-mono tracking-tighter">EGP {selectedSale.price.toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">التكلفة</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">EGP {selectedSale.cost.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">المدفوع</div>
                      <div className="text-lg font-bold text-emerald-500 font-mono">EGP {selectedSale.paid.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex justify-between items-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">الهامش</div>
                    <div className="text-lg font-bold text-emerald-500 font-mono">
                      EGP ({( (selectedSale.price - selectedSale.cost) / selectedSale.cost * 100 ).toFixed(1)}%) {(selectedSale.price - selectedSale.cost).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Customer Info Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Users className="w-5 h-5" />
                    <h3 className="font-bold text-sm uppercase tracking-widest">العميل</h3>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">الاسم</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{selectedSale.customer}</div>
                  </div>
                </div>

                {/* Sale Date */}
                <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex justify-between items-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">تاريخ البيع</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">{selectedSale.date}</div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50 dark:bg-white/2 border-t border-slate-200 dark:border-white/5 flex gap-4">
                <button 
                  onClick={() => handlePrint(selectedSale)}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
                >
                  <Printer className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  طباعة
                </button>
                <button 
                  onClick={() => setSelectedSale(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-white rounded-2xl font-bold transition-all border border-slate-200 dark:border-white/5"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
        {printData && (
          <PrintReceiptTemplate ref={receiptPrintRef} {...printData} />
        )}
      </div>
    </div>
  );
}
