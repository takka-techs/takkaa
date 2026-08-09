import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Calendar, Filter, ChevronDown, 
  ShoppingBag, Clock, CheckCircle2, XCircle, 
  Printer, Eye, RefreshCw, Download,
  CalendarDays, Zap, LayoutGrid, List,
  History, Target, Star, ChevronRight, ChevronLeft,
  FileText, Users, ArrowUpRight, ArrowDownRight,
  Wallet, TrendingUp, Truck, Package, AlertCircle,
  CreditCard, Receipt, MoreHorizontal, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PrintReceiptTemplate } from './PrintReceiptTemplate';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../contexts/SettingsContext';

interface Purchase {
  id: string | number;
  date: string;
  type: string;
  product: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  total: number;
}

export default function GeneralPurchases() {
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedType, setSelectedType] = useState('الكل');
  const [quickFilter, setQuickFilter] = useState('الكل');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const receiptPrintRef = React.useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any>(null);

  const executePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: 'Receipt',
    pageStyle: '',
  });

  const handlePrint = (purchase: Purchase) => {
    let type = 'device';
    if (purchase.type === 'إكسسوارات') type = 'accessory';
    if (purchase.type === 'قطع غيار') type = 'spare_part';

    const pData = {
      invoiceId: purchase.id.toString(),
      items: [{
        id: purchase.id.toString(),
        name: purchase.product,
        price: purchase.unitPrice,
        quantity: purchase.quantity,
        type: type as any
      }],
      totalAmount: purchase.total,
      discount: 0,
      finalAmount: purchase.total,
      cashReceived: purchase.total,
      changeAmount: 0,
      customerName: purchase.supplier,
      cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'مشتريات',
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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const branchId = localStorage.getItem('takka_active_branch_id');
      const headers = {
        'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
        'Authorization': `Bearer ${token}`
      };
      
      let qs = userId ? `&user_id=eq.${userId}` : '';
      if (branchId) qs += `&branch_id=eq.${branchId}`;

      const [devicesRes, accessoriesRes, sparePartsRes] = await Promise.all([
        fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=*&entry_type=eq.purchase${qs}`, { headers }),
        fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?select=*&entry_type=eq.purchase${qs}`, { headers }),
        fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?select=*&entry_type=eq.purchase${qs}`, { headers })
      ]);

      const devices = devicesRes.ok ? await devicesRes.json() : [];
      const accessories = accessoriesRes.ok ? await accessoriesRes.json() : [];
      const spareParts = sparePartsRes.ok ? await sparePartsRes.json() : [];

      const allPurchases: Purchase[] = [
        ...devices.filter((d: any) => d.status !== 'returned').map((d: any) => ({
          id: `device-${d.id}`,
          date: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : '',
          type: 'أجهزة',
          product: `${d.company || ''} ${d.model || ''}`.trim(),
          supplier: d.source || 'غير محدد',
          quantity: 1, 
          unitPrice: d.cost_price || 0,
          tax: d.tax || 0,
          total: (d.cost_price || 0) + (d.tax || 0)
        })),
        ...accessories.filter((a: any) => a.status !== 'returned').map((a: any) => ({
           id: `accessory-${a.id}`,
           date: a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : '',
           type: 'إكسسوارات',
           product: a.name || 'غير محدد',
           supplier: a.supplier || 'غير محدد',
           quantity: a.quantity || 0,
           unitPrice: a.cost_price || 0,
           tax: a.tax || 0,
           total: ((a.cost_price || 0) + (a.tax || 0)) * (a.quantity || 0)
        })),
        ...spareParts.filter((s: any) => s.status !== 'returned').map((s: any) => ({
           id: `spare-${s.id}`,
           date: s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : '',
           type: 'قطع غيار',
           product: s.name || 'غير محدد',
           supplier: s.supplier || 'غير محدد',
           quantity: s.quantity || 0,
           unitPrice: s.cost_price || 0,
           tax: s.tax || 0,
           total: ((s.cost_price || 0) + (s.tax || 0)) * (s.quantity || 0)
        }))
      ];

      allPurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPurchases(allPurchases);
    } catch (error) {
      console.error('Error fetching general purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.product.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'الكل' || purchase.type === selectedType;
    
    let matchesDate = true;
    const purchaseDate = new Date(purchase.date);
    
    if (dateFrom) {
      const dFrom = new Date(dateFrom);
      dFrom.setHours(0, 0, 0, 0);
      if (purchaseDate < dFrom) matchesDate = false;
    }
    
    if (dateTo) {
      const dTo = new Date(dateTo);
      dTo.setHours(23, 59, 59, 999);
      if (purchaseDate > dTo) matchesDate = false;
    }

    return matchesSearch && matchesType && matchesDate;
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

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredPurchases);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, "general_purchases.xlsx");
  };

  const stats = [
    { label: 'إجمالي المشتريات', value: filteredPurchases.reduce((acc, curr) => acc + curr.total, 0).toLocaleString(), icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'عدد الفواتير/العمليات', value: `${filteredPurchases.length}`, icon: Receipt, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full font-sans" dir="rtl">
      {/* Sidebar Filters */}
      <div className="w-full lg:w-80 space-y-6 shrink-0 order-1">
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm sticky top-6">
          <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
            <Filter className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold">فلاتر البحث</h3>
          </div>
          
          <div className="space-y-6">
            {/* Date Range */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 ms-1 uppercase tracking-widest">من تاريخ</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute top-1/2 start-3 -translate-y-1/2" />
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
                  <Calendar className="w-4 h-4 text-slate-400 absolute top-1/2 start-3 -translate-y-1/2" />
                  <input 
                    type="date" 
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 ms-1 uppercase tracking-widest">نوع المشتريات</label>
              <div className="relative">
                <Package className="w-4 h-4 text-slate-400 absolute top-1/2 start-3 -translate-y-1/2" />
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                >
                  <option>الكل</option>
                  <option>أجهزة</option>
                  <option>إكسسوارات</option>
                  <option>قطع غيار</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute top-1/2 end-3 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Search */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 ms-1 uppercase tracking-widest">بحث نصي</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute top-1/2 start-3 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="اسم المنتج، المورد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-slate-500 ms-1 uppercase tracking-widest">فلترة سريعة</label>
              <div className="grid grid-cols-2 gap-2">
                {['الكل', 'اليوم', 'هذا الأسبوع', 'هذا الشهر', 'هذه السنة'].map((filter) => (
                  <button 
                    key={filter}
                    onClick={() => handleQuickFilter(filter)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                      quickFilter === filter 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' 
                        : 'bg-slate-50 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/5 hover:border-blue-500/30'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={fetchData} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-4">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </button>
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

        {/* Content Card */}
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm flex-1">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/2">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-500" />
                سجل المشتريات
              </h2>
              
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
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                تصدير Excel
              </button>
              <button className="p-2.5 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all border border-transparent hover:border-blue-500/20">
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar p-6 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-[#11151c]/50 z-10 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}
            <AnimatePresence mode="wait">
              {filteredPurchases.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4"
                >
                  <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <Package className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">لا توجد مشتريات لعرضها</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">جرب تغيير الفلاتر أو نطاق التاريخ للوصول إلى نتائج.</p>
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
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start">النوع</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start">المنتج</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-start">المورد</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">الكمية</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">سعر الوحدة</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">الإجمالي</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {filteredPurchases.map((purchase, index) => (
                          <tr key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-white/2 transition-colors group">
                            <td className="px-6 py-5 text-xs text-slate-500 text-center font-mono">{index + 1}</td>
                            <td className="px-6 py-5 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">{purchase.date}</td>
                            <td className="px-6 py-5">
                              <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                {purchase.type}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white">{purchase.product}</td>
                            <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 font-medium">{purchase.supplier}</td>
                            <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white text-center font-mono">{purchase.quantity}</td>
                            <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white text-center font-mono">{purchase.unitPrice.toLocaleString()}</td>
                            <td className="px-6 py-5 text-sm font-black text-slate-900 dark:text-white text-center font-mono">{purchase.total.toLocaleString()}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handlePrint(purchase)}
                                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setSelectedPurchase(purchase)}
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
                    {filteredPurchases.map((purchase) => (
                      <motion.div
                        key={purchase.id}
                        whileHover={{ y: -5 }}
                        className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 relative overflow-hidden group"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                            <Truck className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{purchase.product}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{purchase.supplier}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl p-3">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">الكمية</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">{purchase.quantity}</div>
                          </div>
                          <div className="bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/5 rounded-2xl p-3">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">الإجمالي</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">{purchase.total.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/5">
                          <div className="text-[10px] font-bold text-slate-500 font-mono">{purchase.date}</div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handlePrint(purchase)}
                              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setSelectedPurchase(purchase)}
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

      {/* Details Modal */}
      <AnimatePresence>
        {selectedPurchase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPurchase(null)}
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
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">تفاصيل الفاتورة</h2>
                </div>
                <button 
                  onClick={() => setSelectedPurchase(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-6 custom-scrollbar">
                {/* Product Info */}
                <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">المنتج</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{selectedPurchase.product}</div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">الكمية</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{selectedPurchase.quantity}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">سعر الوحدة</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{selectedPurchase.unitPrice.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-4 col-span-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">الإجمالي الكلي</div>
                    <div className="text-2xl font-black text-blue-500 font-mono">EGP {selectedPurchase.total.toLocaleString()}</div>
                  </div>
                </div>

                {/* Payment Info Removed */}

                {/* Supplier */}
                <div className="bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">المورد</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedPurchase.supplier}</div>
                </div>

                {/* Date */}
                <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  تاريخ الفاتورة: {selectedPurchase.date}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50 dark:bg-white/2 border-t border-slate-200 dark:border-white/5 flex gap-4">
                <button 
                  onClick={() => handlePrint(selectedPurchase)}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
                >
                  <Printer className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  طباعة الفاتورة
                </button>
                <button 
                  onClick={() => setSelectedPurchase(null)}
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
