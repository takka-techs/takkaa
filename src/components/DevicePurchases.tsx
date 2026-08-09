import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Layers, Zap, RotateCcw, Search, Calendar, Filter, 
  Trash2, FileText, Tag, Printer, MoreHorizontal, CheckCircle2,
  Package, ShoppingCart, Warehouse, DollarSign, TrendingUp,
  X, ChevronDown, List, LayoutGrid, Clock, Smartphone,
  ArrowUpRight, ArrowDownRight, RefreshCw, Loader2
} from 'lucide-react';
import AddDeviceModal from './AddDeviceModal';
import AddMultipleDevicesModal from './AddMultipleDevicesModal';
import SelectPurchaseReturnModal from './SelectPurchaseReturnModal';
import ReturnPurchaseModal from './ReturnPurchaseModal';
import DeviceDetailsModal from './DeviceDetailsModal';
import { PrintBarcodeModal } from './PrintBarcodeModal';
import { PrintReceiptTemplate } from './PrintReceiptTemplate';
import { useReactToPrint } from 'react-to-print';
import { useSettings } from '../contexts/SettingsContext';

interface Device {
  id: number;
  created_at: string;
  company: string;
  model: string;
  source: string;
  cost_price: number;
  selling_price: number;
  imei1: string;
  imei2: string | null;
  condition: string;
  storage: string;
  ram: string;
  color: string;
  has_box: boolean;
  status: string;
  notes: string | null;
  tax: number;
}

export default function DevicePurchases() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sourceFilter, setSourceFilter] = useState('الكل');
  const [quickFilter, setQuickFilter] = useState('الكل');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddMultipleOpen, setIsAddMultipleOpen] = useState(false);
  const [isSelectReturnOpen, setIsSelectReturnOpen] = useState(false);
  const [isReturnDetailOpen, setIsReturnDetailOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedReturnDevice, setSelectedReturnDevice] = useState<Device | null>(null);
  const [purchases, setPurchases] = useState<Device[]>([]);

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeItem, setBarcodeItem] = useState<any>(null);

  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const [purchasePrintData, setPurchasePrintData] = useState<any>(null);

  const executePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: 'Purchase Receipt',
    pageStyle: '',
  });

  const handlePrintInvoice = (purchase: Device) => {
    const pData = {
      invoiceId: purchase.id.toString(),
      items: [{
        id: purchase.id.toString(),
        name: `${purchase.company} ${purchase.model}`,
        price: purchase.cost_price,
        quantity: 1,
        type: 'device',
        imei1: purchase.imei1
      }],
      totalAmount: purchase.cost_price + (purchase.tax || 0),
      discount: 0,
      finalAmount: purchase.cost_price + (purchase.tax || 0),
      cashReceived: purchase.cost_price + (purchase.tax || 0),
      changeAmount: 0,
      customerName: purchase.source,
      cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'مشتريات',
      shopName: (settings as any)?.companyName || 'تكة أصل الثقة',
      phone: (settings as any)?.phone || '',
      logo: (settings as any)?.logo || ''
    };
    setPurchasePrintData(pData);
    
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

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const branchId = localStorage.getItem('takka_active_branch_id');
      let qs = userId ? `&user_id=eq.${userId}` : '';
      if (branchId) qs += `&branch_id=eq.${branchId}`;

      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=*&entry_type=eq.purchase&order=created_at.desc${qs}`, {
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

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

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = searchTerm === '' || 
      `${p.company} ${p.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.imei1.includes(searchTerm);
    
    const matchesSource = sourceFilter === 'الكل' || p.source === sourceFilter;

    let matchesDate = true;
    const purchaseDate = new Date(p.created_at);
    
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
    
    // Status filtering based on activeTab
    if (activeTab === 'returns') {
      return matchesSearch && matchesSource && matchesDate && (p as any).status === 'returned';
    }
    
    return matchesSearch && matchesSource && matchesDate && (p as any).status !== 'returned';
  });

  const currentValidPurchases = filteredPurchases.filter(p => (p as any).status !== 'returned');

  const stats = [
    { label: 'إجمالي التوريدات', value: currentValidPurchases.length, icon: Package, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'الأجهزة المشتراة', value: currentValidPurchases.length, icon: ShoppingCart, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'الأجهزة بالمخزن', value: currentValidPurchases.length, icon: Warehouse, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'التكلفة الإجمالية', value: currentValidPurchases.reduce((acc, curr) => acc + (curr.cost_price || 0) + (curr.tax || 0), 0).toLocaleString(), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'تكلُفة النطاق المختار', value: currentValidPurchases.reduce((acc, curr) => acc + (curr.cost_price || 0) + (curr.tax || 0), 0).toLocaleString(), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  const handleResetFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setSourceFilter('الكل');
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header & Quick Actions */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div className="flex flex-wrap gap-4 w-full xl:w-auto order-2 xl:order-1">
          <button 
            onClick={() => setIsAddDeviceOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold px-8 py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)] group"
          >
             <div className="w-8 h-8 rounded-lg bg-slate-900/10 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Smartphone className="w-5 h-5" />
             </div>
             <div className="text-right">
               <div className="text-sm">جهاز واحد</div>
               <div className="text-[10px] font-normal opacity-70">إضافة جهاز بمفرده</div>
             </div>
          </button>

          <button 
             onClick={() => setIsAddMultipleOpen(true)}
             className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 px-8 py-4 rounded-2xl transition-all group"
          >
             <div className="w-8 h-8 rounded-lg bg-slate-200/50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
               <LayoutGrid className="w-5 h-5 text-teal-600 dark:text-teal-400" />
             </div>
             <div className="text-right">
               <div className="text-sm">أجهزة مختلفة</div>
               <div className="text-[10px] font-normal text-slate-500 dark:opacity-50">كل جهاز بمواصفاته وسعره</div>
             </div>
          </button>

          <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 px-8 py-4 rounded-2xl transition-all group">
             <div className="w-8 h-8 rounded-lg bg-slate-200/50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
             </div>
             <div className="text-right">
               <div className="text-sm">دفعة واحدة</div>
               <div className="text-[10px] font-normal text-slate-500 dark:opacity-50">موديل واحد + عدة IMEI</div>
             </div>
          </button>

          <button 
            onClick={() => setIsSelectReturnOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 px-8 py-4 rounded-2xl transition-all group"
          >
             <div className="w-8 h-8 rounded-lg bg-slate-200/50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
               <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
             </div>
             <div className="text-right">
               <div className="text-sm">مرتجع جديد</div>
               <div className="text-[10px] font-normal text-slate-500 dark:opacity-50">إرجاع جهاز مشتري</div>
             </div>
          </button>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 order-1 xl:order-2 ml-auto xl:ml-0">
          <ShoppingCart className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">المشتريات</h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 relative overflow-hidden group hover:ring-2 hover:ring-teal-500/20 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-white/40" />
              </div>
            </div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">{stat.label}</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none tracking-tighter">
              {stat.value}
            </div>
            
            {/* Background Accent */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${stat.bg} blur-[50px] rounded-full opacity-30 pointer-events-none`} />
          </motion.div>
        ))}
      </div>

      {/* Navigation & Filters Area */}
      <div className="space-y-6">
        {/* Main Tabs */}
        <div className="bg-slate-100 dark:bg-white/2 border border-slate-200 dark:border-white/5 p-2 rounded-[2rem] flex flex-wrap gap-2">
          <TabButton label="كل التوريدات" icon={List} active={activeTab === 'all'} onClick={() => setActiveTab('all')} count={filteredPurchases.length} />
          <TabButton label="التوريد السريع" icon={Zap} active={activeTab === 'fast'} onClick={() => setActiveTab('fast')} />
          <TabButton label="التوريد المتعدد" icon={Layers} active={activeTab === 'multiple'} onClick={() => setActiveTab('multiple')} />
          <TabButton label="المرتجعات" icon={RotateCcw} active={activeTab === 'returns'} onClick={() => setActiveTab('returns')} />
        </div>

        {/* Filter Section */}
        <div className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-3 flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-1">من تاريخ</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-500 absolute top-1/2 start-4 -translate-y-1/2" />
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/5 rounded-2xl py-4 ps-12 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-3 flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-1">إلى تاريخ</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-500 absolute top-1/2 start-4 -translate-y-1/2" />
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/5 rounded-2xl py-4 ps-12 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <button 
              onClick={() => fetchPurchases()}
              className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-6 py-4 rounded-2xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 group"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
              تحديث
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-4">
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {['الكل', 'اليوم', 'هذا الأسبوع', 'هذا الشهر', 'هذه السنة'].map((filter) => (
                <button 
                  key={filter}
                  onClick={() => handleQuickFilter(filter)}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all border ${
                    quickFilter === filter 
                      ? 'bg-teal-500 text-slate-900 border-teal-500 shadow-lg shadow-teal-500/20' 
                      : 'bg-slate-50 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/5 hover:border-teal-500/30'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="relative group flex-1">
                <ChevronDown className="w-4 h-4 text-slate-500 absolute top-1/2 end-4 -translate-y-1/2 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                <select 
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/5 rounded-2xl py-4 ps-4 pe-12 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-all appearance-none"
                >
                  <option>الكل</option>
                  <option>عميل</option>
                  <option>مورد</option>
                </select>
              </div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">المصدر</label>
            </div>

            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <div className="relative flex-1 group">
                <div className="absolute top-1/2 end-4 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono hidden sm:inline">Ctrl+K</span>
                  <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="بحث بالموديل، IMEI، الاسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/5 rounded-2xl py-4 ps-4 pe-14 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-all text-end font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

              <button 
                onClick={handleResetFilters}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-sm font-bold border border-red-500/10 transition-all flex items-center gap-2 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">مسح</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-white/5" />

          {/* Table Area */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-teal-500 rounded-full" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  سجل التوريدات
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/10 rounded-xl text-xs font-bold font-mono">
                  {filteredPurchases.length} سجلات
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/5">
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-16">#</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap">التاريخ</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap text-center">النوع</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap text-center">الجهاز</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap text-center">المصدر</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap text-center">الإجمالي</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-start whitespace-nowrap text-center">الحالة</th>
                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                          <span className="text-slate-500 font-bold">جاري تحميل التوريدات...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center bg-white dark:bg-transparent">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-2">
                             <Package className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                          </div>
                          <span className="text-slate-500 dark:text-slate-500 font-bold text-lg">لا يوجد توريدات متاحة</span>
                          <span className="text-slate-400 dark:text-slate-600 text-sm">ابدأ بإضافة أجهزة جديدة لتظهر هنا</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPurchases.map((purchase, index) => (
                    <tr key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group bg-white dark:bg-transparent">
                      <td className="px-6 py-4 text-xs font-bold font-mono text-slate-400 dark:text-slate-600 text-center">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {new Date(purchase.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(purchase.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-4 py-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-black rounded-xl border border-sky-500/10">
                          {purchase.source === 'إضافة متعددة' ? 'متعدد' : 'سريع'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-black text-slate-900 dark:text-white">{purchase.company} {purchase.model}</div>
                            {purchase.status === 'returned' && (
                              <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] rounded-md font-bold whitespace-nowrap">مرتجع</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">IMEI: {purchase.imei1.substring(0, 4)}**********</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                          {purchase.source}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-black text-teal-600 dark:text-teal-400 font-mono">
                          {((purchase.cost_price || 0) + (purchase.tax || 0)).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-xl border border-emerald-500/10">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {purchase.status === 'returned' ? 'مرتجع' : 'مكتمل'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => {
                               setSelectedDevice(purchase);
                               setIsDetailsOpen(true);
                             }}
                             className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all border border-slate-200 dark:border-white/5 group-hover:border-slate-300 dark:group-hover:border-white/10" title="تفاصيل"
                           >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReturnDevice(purchase);
                              setIsReturnDetailOpen(true);
                            }}
                            className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-200 dark:border-white/5" 
                            title="إرجاع للمورد"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setBarcodeItem({ item: purchase, category: 'device' });
                              setIsBarcodeModalOpen(true);
                            }}
                            className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 group-hover:border-slate-300 dark:group-hover:border-white/10" 
                            title="طباعة ملصق"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePrintInvoice(purchase)}
                            className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 group-hover:border-slate-300 dark:group-hover:border-white/10" 
                            title="طباعة فاتورة"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/10"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>

          </div>
      </div>      </div>

      {/* Modals */}
      <AddDeviceModal 
        isOpen={isAddDeviceOpen} 
        onClose={() => setIsAddDeviceOpen(false)} 
        entryType="purchase"
        onSuccess={() => {
           fetchPurchases();
        }}
      />

      <AddMultipleDevicesModal 
        isOpen={isAddMultipleOpen} 
        onClose={() => setIsAddMultipleOpen(false)} 
        entryType="purchase"
        onSuccess={() => {
           fetchPurchases();
        }}
      />

      <SelectPurchaseReturnModal
        isOpen={isSelectReturnOpen}
        onClose={() => setIsSelectReturnOpen(false)}
        onSelect={(device) => {
          setSelectedReturnDevice(device as any);
          setIsSelectReturnOpen(false);
          setIsReturnDetailOpen(true);
        }}
      />

      <ReturnPurchaseModal
        isOpen={isReturnDetailOpen}
        device={selectedReturnDevice}
        onClose={() => setIsReturnDetailOpen(false)}
        onSuccess={() => {
          setIsReturnDetailOpen(false);
          fetchPurchases();
        }}
      />

      <DeviceDetailsModal
        isOpen={isDetailsOpen}
        device={selectedDevice}
        onClose={() => setIsDetailsOpen(false)}
      />

      <PrintBarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        autoSelectItem={barcodeItem}
      />

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
        {purchasePrintData && (
          <PrintReceiptTemplate ref={receiptPrintRef} {...purchasePrintData} />
        )}
      </div>
    </div>
  );
}

function TabButton({ label, icon: Icon, active, onClick, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] transition-all relative overflow-hidden group border ${
        active 
          ? 'bg-teal-500 text-slate-900 font-black shadow-xl border-teal-500' 
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/5 border-transparent'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-slate-900' : 'text-slate-400 dark:text-slate-600 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`} />
      <span className="text-sm">{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono ${active ? 'bg-slate-900/10 text-slate-900' : 'bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-500'}`}>
          {count}
        </span>
      )}
      
      {active && (
        <motion.div 
          layoutId="tab-active"
          className="absolute inset-0 bg-teal-500 -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}
