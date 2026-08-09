import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Calendar, Filter, ChevronDown, 
  Wrench, Clock, CheckCircle2, XCircle, 
  Printer, Eye, RefreshCw, Download,
  CalendarDays, Zap, LayoutGrid, List,
  History, Target, Star, ChevronRight, ChevronLeft,
  FileText, Users, ArrowUpRight, ArrowDownRight,
  Wallet, Settings, TrendingUp, ShoppingBag
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PrintReceiptTemplate } from './PrintReceiptTemplate';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../contexts/SettingsContext';

interface SparePartSale {
  id: string;
  date: string;
  rawDate: string;
  partName: string;
  category: string;
  invoiceNumber: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  customer: string;
  deliveryDate: string;
  source: string;
}

export default function SparePartSales() {
  const { settings } = useSettings();
  const [sales, setSales] = useState<SparePartSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickFilter, setQuickFilter] = useState('الكل');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedSale, setSelectedSale] = useState<SparePartSale | null>(null);

  const receiptPrintRef = React.useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any>(null);

  const executePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: 'Receipt',
    pageStyle: '',
  });

  const handlePrint = (sale: SparePartSale) => {
    const pData = {
      invoiceId: sale.invoiceNumber.replace('#', ''),
      items: [{
        id: sale.id.toString(),
        name: sale.partName,
        price: sale.unitPrice,
        quantity: sale.quantity,
        type: 'spare_part'
      }],
      totalAmount: sale.total,
      discount: sale.discount || 0,
      finalAmount: sale.total,
      cashReceived: sale.total,
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

      // Fetch Sales_Items where product_type is 'spare_part'
      const response = await fetch(`${baseUrl}/Sales_Items?product_type=eq.spare_part&select=*,Sales_Invoices(*)`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('فشل جلب مبيعات قطع الغيار');
      const data = await response.json();

      const mappedSales: SparePartSale[] = data
        .filter((item: any) => {
          const name = item.product_name || item.item_name || '';
          return !name.includes('(مرتجع)');
        })
        .map((item: any) => ({
          id: item.id,
          date: new Date(item.Sales_Invoices?.created_at).toLocaleString('ar-EG'),
          rawDate: item.Sales_Invoices?.created_at,
          partName: item.product_name,
          category: 'قطعة غيار',
          invoiceNumber: item.Sales_Invoices?.invoice_number || `#${item.id}`,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: 0,
          total: item.total_price,
          customer: item.Sales_Invoices?.customer_name || 'عميل نقدي',
          deliveryDate: new Date(item.Sales_Invoices?.created_at).toLocaleString('ar-EG'),
          source: 'نقطة البيع'
        }));

      setSales(mappedSales);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.partName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const handleQuickFilter = (type: string) => {
    const now = new Date();
    let from = new Date();
    let to = new Date();
    setQuickFilter(type);

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
      case 'هذه السنة':
        from = new Date(now.getFullYear(), 0, 1);
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
    fetchSales();
  };

  const exportToExcel = () => {
    if (filteredSales.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filteredSales);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Spare Part Sales");
    XLSX.writeFile(wb, "spare_part_sales.xlsx");
  };

  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItemsSold = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalInvoices = new Set(filteredSales.map(s => s.invoiceNumber)).size;

  const stats = [
    { label: 'إجمالي المبيعات', value: `EGP ${totalSalesAmount.toLocaleString()}`, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'قطع مباعة', value: `${totalItemsSold} قطعة`, icon: Wrench, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'الفواتير', value: `${totalInvoices} فاتورة`, icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'صافي الربح', value: `EGP ${(totalSalesAmount * 0.25).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }, // Mock profit
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full font-sans" dir="rtl">
      {/* Sidebar Filters */}
      <div className="w-full lg:w-80 space-y-6 shrink-0 order-1">
        {/* Date Filter */}
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold">تصفية بالتاريخ</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 ms-1 uppercase tracking-widest">من تاريخ</label>
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
              <label className="text-[10px] font-bold text-slate-500 ms-1 uppercase tracking-widest">إلى تاريخ</label>
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
            <button 
              onClick={() => handleRefresh()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <Zap className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold">فلاتر سريعة</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['الكل', 'اليوم', 'هذا الأسبوع', 'هذا الشهر', 'هذه السنة'].map((filter) => (
              <button 
                key={filter}
                onClick={() => handleQuickFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  quickFilter === filter 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-slate-50 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/5 hover:border-blue-500/30'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <Search className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold">بحث</h3>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="بحث في المبيعات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6 overflow-hidden flex flex-col order-2">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm flex-1">
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/2">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="بحث سريع في الجدول..."
                  className="w-full bg-transparent border-none py-1 ps-9 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={exportToExcel}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                تصدير Excel
              </button>
              <button className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar p-6">
            <AnimatePresence mode="wait">
              {filteredSales.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4"
                >
                  <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-700 rotate-45" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">لا توجد مبيعات قطع غيار لعرضها</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">ابدأ بإضافة مبيعات جديدة من خلال قسم الصيانة أو نقطة البيع.</p>
                </motion.div>
              ) : (
                viewMode === 'table' ? (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="overflow-x-auto w-full"
                  >
                    <table className="w-full text-start border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-white/2 border-b border-slate-200 dark:border-white/5">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-12">#</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start">التاريخ</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start">القطعة</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start">الفئة</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">رقم التذكرة / الفاتورة</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">الكمية</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">سعر الوحدة</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">الخصم</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">الإجمالي</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start">العميل</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start">تاريخ التسليم</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">المصدر</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {filteredSales.map((sale, index) => (
                          <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-white/2 transition-colors group">
                            <td className="px-6 py-5 text-xs text-slate-500 text-center font-mono">{index + 1}</td>
                            <td className="px-6 py-5 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">{sale.date}</td>
                            <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white">{sale.partName}</td>
                            <td className="px-6 py-5 text-xs text-slate-500 font-medium">{sale.category}</td>
                            <td className="px-6 py-5 text-center text-xs font-bold text-blue-500 font-mono">{sale.invoiceNumber}</td>
                            <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white text-center font-mono">{sale.quantity.toFixed(2)}</td>
                            <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white text-center font-mono">{sale.unitPrice.toFixed(2)}</td>
                            <td className="px-6 py-5 text-sm font-bold text-slate-500 text-center font-mono">-</td>
                            <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white text-center font-mono">{sale.total.toFixed(2)}</td>
                            <td className="px-6 py-5 text-sm text-slate-500 font-medium">{sale.customer}</td>
                            <td className="px-6 py-5 text-xs text-slate-500 font-mono whitespace-nowrap">{sale.deliveryDate}</td>
                            <td className="px-6 py-5 text-center">
                              <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-500 flex items-center justify-center gap-1">
                                <ShoppingBag className="w-3 h-3" />
                                {sale.source}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handlePrint(sale)}
                                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setSelectedSale(sale)}
                                  className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-500/10 rounded-xl transition-all"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full"
                  >
                    {filteredSales.map((sale) => (
                      <motion.div
                        key={sale.id}
                        whileHover={{ y: -5 }}
                        className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 end-0 p-4">
                          <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500">
                            {sale.invoiceNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center">
                            <Wrench className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{sale.partName}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{sale.category}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl p-3">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">الكمية</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">{sale.quantity}</div>
                          </div>
                          <div className="bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl p-3">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">السعر</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">{sale.unitPrice.toFixed(2)}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">الإجمالي</div>
                            <div className="text-xl font-black text-blue-500 font-mono">EGP {sale.total.toFixed(2)}</div>
                          </div>
                          <div className="text-end">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">العميل</div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{sale.customer}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/5">
                          <div className="text-[10px] font-bold text-slate-500 font-mono">{sale.date}</div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handlePrint(sale)}
                              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setSelectedSale(sale)}
                              className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-500/10 rounded-xl transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )
              )}
            </AnimatePresence>
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
              className="relative w-full max-w-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 pb-4 flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">تفاصيل قطعة الغيار</h2>
                </div>
                <button 
                  onClick={() => setSelectedSale(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-6 custom-scrollbar">
                {/* Part Info */}
                <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">اسم القطعة</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{selectedSale.partName}</div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">
                    <FileText className="w-4 h-4" />
                    فاتورة رقم: {selectedSale.invoiceNumber}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">الكمية</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{selectedSale.quantity}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">سعر الوحدة</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">EGP {selectedSale.unitPrice.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-4 col-span-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">الإجمالي النهائي</div>
                    <div className="text-2xl font-black text-emerald-500 font-mono">EGP {selectedSale.total.toFixed(2)}</div>
                  </div>
                </div>

                {/* Customer & Delivery */}
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">العميل</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedSale.customer}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">تاريخ التسليم</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">{selectedSale.deliveryDate}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">المصدر</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{selectedSale.source}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50 dark:bg-white/2 border-t border-slate-200 dark:border-white/5 flex gap-4">
                <button 
                  onClick={() => handlePrint(selectedSale)}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
                >
                  <Printer className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  طباعة الفاتورة
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
