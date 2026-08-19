
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarDays, LayoutDashboard, CircleDollarSign, Smartphone, Headphones, 
  Wrench, ShoppingCart, CornerDownLeft, Package, CornerDownRight, FileText, 
  Repeat, Handshake, DollarSign, Users, Gem, Receipt, Archive, Loader2,
  Search, ArrowRight, Download, Filter
} from 'lucide-react';
import DailyReport from './DailyReport';
import DashboardReport from './DashboardReport';
import PnLReport from './PnLReport';
import DeviceReport from './DeviceReport';
import AccessoryReport from './AccessoryReport';
import SparePartReport from './SparePartReport';
import MaintenanceReport from './MaintenanceReport';
import MaintenanceCommissionReport from './MaintenanceCommissionReport';
import SalesReport from './SalesReport';
import SalesReturnsReport from './SalesReturnsReport';
import InvoicesReport from './InvoicesReport';
import TransfersReport from './TransfersReport';
import PartnersReport from './PartnersReport';
import CashflowReport from './CashflowReport';
import CustomersSuppliersReport from './CustomersSuppliersReport';
import CapitalReport from './CapitalReport';
import ExpensesReport from './ExpensesReport';
import LowStockReport from './LowStockReport';
import PurchasesReport from './PurchasesReport';
import PurchaseReturnsReport from './PurchaseReturnsReport';

const REPORT_CARDS = [
  { id: 'sales_report', title: 'تقرير المبيعات', icon: DollarSign, iconColor: 'text-amber-500', ringColor: 'focus:ring-amber-500', customBorder: 'border-amber-500/30' },
  { id: 'daily_report', title: 'تقرير يومي', icon: CalendarDays, iconColor: 'text-blue-400', ringColor: 'focus:ring-blue-500', customBorder: 'border-red-500/30' },
  { id: 'dashboard', title: 'لوحة التحكم', icon: LayoutDashboard, iconColor: 'text-pink-400', ringColor: 'focus:ring-pink-500' },
  { id: 'pnl', title: 'الأرباح والخسائر', icon: CircleDollarSign, iconColor: 'text-yellow-500', ringColor: 'focus:ring-yellow-500' },
  { id: 'devices', title: 'الأجهزة', icon: Smartphone, iconColor: 'text-indigo-400', ringColor: 'focus:ring-indigo-500' },
  { id: 'accessories', title: 'الإكسسوارات', icon: Headphones, iconColor: 'text-purple-400', ringColor: 'focus:ring-purple-500' },
  { id: 'spare_parts', title: 'قطع الغيار', icon: Wrench, iconColor: 'text-slate-300', ringColor: 'focus:ring-slate-400' },
  { id: 'maintenance', title: 'الصيانة', icon: Wrench, iconColor: 'text-emerald-300', ringColor: 'focus:ring-emerald-500' },
  { id: 'maintenance_commission', title: 'عمولة الصيانة', icon: Wrench, iconColor: 'text-amber-500', ringColor: 'focus:ring-amber-500' },
  { id: 'sales', title: 'المبيعات', icon: ShoppingCart, iconColor: 'text-slate-300', ringColor: 'focus:ring-emerald-500', customBorder: 'border-emerald-500/30' },
  { id: 'sales_returns', title: 'مرتجعات المبيعات', icon: CornerDownLeft, iconColor: 'text-sky-400', ringColor: 'focus:ring-sky-500' },
  { id: 'purchases', title: 'المشتريات', icon: Package, iconColor: 'text-amber-600', ringColor: 'focus:ring-amber-500' },
  { id: 'purchase_returns', title: 'مرتجعات المشتريات', icon: CornerDownRight, iconColor: 'text-blue-500', ringColor: 'focus:ring-blue-500' },
  { id: 'invoices', title: 'الفواتير', icon: FileText, iconColor: 'text-slate-300', ringColor: 'focus:ring-slate-400' },
  { id: 'transfers', title: 'التحويلات', icon: Repeat, iconColor: 'text-indigo-300', ringColor: 'focus:ring-indigo-500' },
  { id: 'partners', title: 'الشركاء', icon: Handshake, iconColor: 'text-yellow-500', ringColor: 'focus:ring-yellow-500' },
  { id: 'cashflow', title: 'التدفق النقدي', icon: DollarSign, iconColor: 'text-green-400', ringColor: 'focus:ring-green-500' },
  { id: 'customers', title: 'العملاء', icon: Users, iconColor: 'text-purple-500', ringColor: 'focus:ring-purple-500' },
  { id: 'capital', title: 'رأس المال', icon: Gem, iconColor: 'text-cyan-400', ringColor: 'focus:ring-cyan-500' },
  { id: 'expenses', title: 'المصروفات', icon: Receipt, iconColor: 'text-slate-300', ringColor: 'focus:ring-slate-400' },
  { id: 'low_stock', title: 'المخزون المنخفض', icon: Archive, iconColor: 'text-orange-400', ringColor: 'focus:ring-red-500', customBorder: 'border-red-900/50' },
];

export default function Reports() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReportData = async (reportId: string) => {
    setIsLoading(true);
    setActiveReport(reportId);
    
    // Simulate API fetch delay
    setTimeout(() => {
      setReportData([
        { id: 1, name: 'سجل تجريبي 1', value: 1500, date: '2026-04-18', status: 'مكتمل' },
        { id: 2, name: 'سجل تجريبي 2', value: 3400, date: '2026-04-18', status: 'قيد الانتظار' },
        { id: 3, name: 'سجل تجريبي 3', value: 890, date: '2026-04-17', status: 'مكتمل' },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  const filteredCards = REPORT_CARDS.filter(card => card.title.includes(searchQuery));

  return (
    <div className="w-full min-h-[calc(100vh-100px)] p-6 dark:bg-[#080c13]" dir="rtl">
      <AnimatePresence mode="wait">
        {!activeReport ? (
          <motion.div 
            key="reports_menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    التقارير
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    اختر التقرير المطلوب لعرض التفاصيل والإحصائيات
                  </p>
               </div>
               <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن تقرير..."
                    className="block w-full pl-3 pr-10 py-2 border border-slate-200 dark:border-white/10 rounded-xl leading-5 bg-white dark:bg-[#11151c] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all sm:text-sm"
                  />
               </div>
            </div>

            {/* Grid Layout matching the screenshot exactly */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
               {filteredCards.map((card, index) => {
                 const Icon = card.icon;
                 return (
                   <motion.button
                     key={card.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: index * 0.03 }}
                     onClick={() => fetchReportData(card.id)}
                     className={`flex flex-col items-center justify-center p-6 gap-4 w-full aspect-square bg-white dark:bg-[#121620] border ${card.customBorder || 'border-slate-100 dark:border-white/5'} rounded-2xl hover:bg-slate-50 dark:hover:bg-[#161b26] transition-all duration-200 focus:outline-none focus:ring-2 ${card.ringColor} focus:ring-offset-2 dark:focus:ring-offset-[#080c13] shadow-sm hover:shadow-md cursor-pointer group`}
                   >
                      <div className="p-3 rounded-full bg-slate-50 dark:bg-white/5 group-hover:scale-110 transition-transform duration-300">
                         <Icon className={`w-8 h-8 ${card.iconColor}`} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center">
                        {card.title}
                      </span>
                   </motion.button>
                 );
               })}
               {filteredCards.length === 0 && (
                 <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <p>لا توجد تقارير مطابقة لبحثك</p>
                 </div>
               )}
            </div>
          </motion.div>
        ) : activeReport === 'daily_report' ? (
          <motion.div
            key="daily_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <DailyReport onBack={() => setActiveReport(null)} />
          </motion.div>
        ) : activeReport === 'dashboard' ? (
          <motion.div
            key="dashboard_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-white/[0.02]">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveReport(null)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0"
                  >
                     <ArrowRight className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </button>
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                        <LayoutDashboard className="w-6 h-6" />
                     </div>
                     <div>
                       <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                         لوحة التحكم (المالية والعمليات)
                       </h2>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                         نظرة شاملة وديناميكية من قاعدة البيانات
                       </p>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="flex-1 bg-slate-50 dark:bg-[#080c13]/50">
               <DashboardReport />
            </div>
          </motion.div>
        ) : activeReport === 'pnl' ? (
          <motion.div
            key="pnl_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1">
                   <PnLReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'devices' ? (
          <motion.div
            key="devices_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center gap-4 bg-slate-50 dark:bg-white/[0.02]">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                         <Smartphone className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white">تقارير الأجهزة</h2>
                   </div>
                </div>
                <div className="flex-1 p-0 sm:p-6 bg-slate-50 dark:bg-[#0b101a]">
                   <DeviceReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'accessories' ? (
          <motion.div
            key="accessories_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <AccessoryReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'spare_parts' ? (
          <motion.div
            key="spare_parts_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <SparePartReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'maintenance' ? (
          <motion.div
            key="maintenance_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <MaintenanceReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'maintenance_commission' ? (
          <motion.div
            key="maintenance_commission_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <MaintenanceCommissionReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'sales_report' || activeReport === 'sales' ? (
          <motion.div
            key="sales_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <SalesReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'sales_returns' ? (
          <motion.div
            key="sales_returns_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <SalesReturnsReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'purchases' ? (
          <motion.div
            key="purchases_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <PurchasesReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'purchase_returns' ? (
          <motion.div
            key="purchase_returns_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <PurchaseReturnsReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'invoices' ? (
          <motion.div
            key="invoices_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <InvoicesReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'transfers' ? (
          <motion.div
            key="transfers_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <TransfersReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'partners' ? (
          <motion.div
            key="partners_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <PartnersReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'cashflow' ? (
          <motion.div
            key="cashflow_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <CashflowReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'customers' ? (
          <motion.div
            key="customers_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <CustomersSuppliersReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'capital' ? (
          <motion.div
            key="capital_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <CapitalReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'expenses' ? (
          <motion.div
            key="expenses_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <ExpensesReport />
                </div>
             </div>
          </motion.div>
        ) : activeReport === 'low_stock' ? (
          <motion.div
            key="low_stock_report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col"
          >
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                >
                   العودة للتقارير <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
             
             <div className="bg-slate-50 dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex-1 p-0 sm:p-4 bg-slate-50 dark:bg-[#0b101a]">
                   <LowStockReport />
                </div>
             </div>
          </motion.div>
        ) : (
          <motion.div 
            key="report_view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden min-h-[600px] flex flex-col"
          >
            {/* Dynamic Report Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-white/[0.02]">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveReport(null)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0"
                  >
                     <ArrowRight className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </button>
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        {(() => {
                           const c = REPORT_CARDS.find(c => c.id === activeReport);
                           const Icon = c?.icon || FileText;
                           return <Icon className="w-6 h-6" />;
                        })()}
                     </div>
                     <div>
                       <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                         {REPORT_CARDS.find(c => c.id === activeReport)?.title}
                       </h2>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                         يتم جلب البيانات ديناميكياً من الخادم
                       </p>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                 <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                    <Filter className="w-4 h-4" /> فرز
                 </button>
                 <button className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg text-sm font-medium hover:bg-teal-500/20 transition-colors">
                    <Download className="w-4 h-4" /> تصدير CSV
                 </button>
               </div>
            </div>

            {/* Dynamic Report Body */}
            <div className="p-6 flex-1 bg-white dark:bg-[#080c13]/50">
               {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                     <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
                     <p className="text-slate-500 font-medium">جاري التجهيز وجلب البيانات من الـ API...</p>
                  </div>
               ) : (
                 <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11151c]">
                    <table className="w-full text-sm text-right text-slate-500 dark:text-slate-400">
                       <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-white/5 dark:text-slate-300">
                          <tr>
                             <th scope="col" className="px-6 py-4 rounded-tr-xl">م #</th>
                             <th scope="col" className="px-6 py-4">البيان</th>
                             <th scope="col" className="px-6 py-4">القيمة</th>
                             <th scope="col" className="px-6 py-4">التاريخ</th>
                             <th scope="col" className="px-6 py-4 rounded-tl-xl text-center">الحالة</th>
                          </tr>
                       </thead>
                       <tbody>
                          {reportData.map((row, idx) => (
                             <tr key={row.id} className={`border-b dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] ${idx === reportData.length - 1 ? 'border-b-0' : ''}`}>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                   REQ-{1000 + row.id}
                                </td>
                                <td className="px-6 py-4">
                                   {row.name}
                                </td>
                                <td className="px-6 py-4 font-mono font-medium">
                                   {row.value.toLocaleString()} ج.م
                                </td>
                                <td className="px-6 py-4">
                                   {row.date}
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                                      {row.status}
                                   </span>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                    {reportData.length === 0 && (
                      <div className="py-12 text-center text-slate-500">لا توجد بيانات مسجلة لهذا التقرير</div>
                    )}
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
