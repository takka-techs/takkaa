import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Search, Filter, Plus, FileText, Download, Upload, 
  Printer, RefreshCw, ArrowRightLeft, Trash2, Edit, 
  Eye, DollarSign, Smartphone, Barcode, Archive,
  CheckCircle2, AlertCircle, Clock, Settings, LayoutGrid,
  ChevronDown, RotateCcw, Layers, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import AddDeviceModal from './AddDeviceModal';
import AddMultipleDevicesModal from './AddMultipleDevicesModal';
import ImportExcelModal from './ImportExcelModal';
import ViewDeviceModal from './ViewDeviceModal';
import EditDeviceModal from './EditDeviceModal';
import DeleteDeviceModal from './DeleteDeviceModal';
import SellDeviceModal from './SellDeviceModal';
import UnifyPricesModal from './UnifyPricesModal';
import TransferItemModal from './TransferItemModal';
import { PrintBarcodeModal } from './PrintBarcodeModal';

export default function Devices({ warehouse }: { warehouse?: any }) {
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<number[]>([]);
  const [resolvedWarehouseId, setResolvedWarehouseId] = useState<string | null>(warehouse?.id || null);

  // Modals state
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [isAddMultipleModalOpen, setIsAddMultipleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Action Modals state
  const [viewDevice, setViewDevice] = useState<any>(null);
  const [editDevice, setEditDevice] = useState<any>(null);
  const [deleteDevice, setDeleteDevice] = useState<any>(null);
  const [sellDevice, setSellDevice] = useState<any>(null);
  const [transferDevice, setTransferDevice] = useState<any>(null);
  const [isUnifyPricesModalOpen, setIsUnifyPricesModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    imei: '',
    company: '',
    condition: '',
    status: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    resolveAndFetch();
  }, [warehouse]);

  const resolveAndFetch = async () => {
    setIsLoading(true);
    try {
      let targetWarehouseId = warehouse?.id;
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;

      if (!targetWarehouseId) {
        const activeBranchId = localStorage.getItem("takka_active_branch_id");
        if (!activeBranchId || activeBranchId === 'ALL') {
           // Owner viewing All Branches
           targetWarehouseId = 'ALL';
           setResolvedWarehouseId('ALL');
        } else {
          // Find default devices warehouse for the branch
          let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.devices&is_default=eq.true&branch_id=eq.${activeBranchId}`;
          
          let whRes = await fetch(url, {
            headers: {
              'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
              'Authorization': `Bearer ${token}`
            }
          });
          let whData = await whRes.json();
          
          if (!Array.isArray(whData) || whData.length === 0) {
             let url2 = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.devices&branch_id=eq.${activeBranchId}&order=created_at.asc&limit=1`;
             whRes = await fetch(url2, {
               headers: {
                 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
                 'Authorization': `Bearer ${token}`
               }
             });
             whData = await whRes.json();
          }

          if (Array.isArray(whData) && whData.length > 0) {
             targetWarehouseId = whData[0].id;
             setResolvedWarehouseId(targetWarehouseId);
          } else {
             targetWarehouseId = 'ALL';
             setResolvedWarehouseId('ALL');
          }
        }
      }

      // Auto-fix null warehouse items for this target warehouse
      if (targetWarehouseId && targetWarehouseId !== 'NONE' && targetWarehouseId !== 'ALL') {
        try {
          const activeBranchId = localStorage.getItem("takka_active_branch_id");
          let patchUrl = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?warehouse_id=is.null`;
          if (activeBranchId && activeBranchId !== 'ALL') {
             patchUrl += `&branch_id=eq.${activeBranchId}`;
          }
          await fetch(patchUrl, {
            method: 'PATCH',
            headers: {
              'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ warehouse_id: targetWarehouseId })
          });
        } catch (patchErr) {
          console.error('Failed to patch null warehouse devices');
        }
      }

      await fetchDevices(targetWarehouseId);
    } catch (err: any) {
      setError('فشل تجهيز بيانات المخزن');
      setIsLoading(false);
    }
  };

  const fetchDevices = async (warehouseId: string | null) => {
    setIsLoading(true);
    setError('');
    try {
      if (warehouseId === 'NONE') {
         setDevices([]);
         setIsLoading(false);
         return;
      }
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=*,branches(name)&status=not.in.(sold,sold_installment)`;
      
      if (warehouseId === 'ALL') {
        url += `&tenant_id=eq.${tenantId}`;
        if (activeBranchId && activeBranchId !== 'ALL') {
          url += `&branch_id=eq.${activeBranchId}`;
        }
      } else if (warehouseId) {
        url += `&warehouse_id=eq.${warehouseId}`;
      }

      const response = await fetch(url, {
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل جلب بيانات الأجهزة');
      }
      
      const data = await response.json();
      setDevices(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ imei: '', company: '', condition: '', status: '' });
    setSearchTerm('');
  };

  // Apply filters
  const filteredDevices = devices.filter(device => {
    const matchSearch = searchTerm === '' || 
      (device.model && device.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.company && device.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.barcode && device.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.imei1 && device.imei1.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.imei && device.imei.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.id && device.id.toString().includes(searchTerm));
      
    const matchImei = filters.imei === '' || 
      (device.imei1 && device.imei1.includes(filters.imei)) ||
      (device.imei2 && device.imei2.includes(filters.imei));
      
    const matchCompany = filters.company === '' || filters.company === 'عرض الكل' || device.company === filters.company;
    const matchCondition = filters.condition === '' || filters.condition === 'عرض الكل' || device.condition === filters.condition;
    
    // Assuming status is always 'متاح' for now based on API, but we can filter if needed
    const matchStatus = filters.status === '' || filters.status === 'عرض الكل' || 'متاح' === filters.status;

    return matchSearch && matchImei && matchCompany && matchCondition && matchStatus;
  });

  // Calculate stats based on filtered devices
  const totalExpectedSales = filteredDevices.reduce((acc, dev) => acc + (dev.selling_price || 0), 0);
  const totalCost = filteredDevices.reduce((acc, dev) => acc + (dev.cost_price || 0), 0);
  const displayedCount = filteredDevices.length;

  // Apply pagination
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedDevices = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedDevices.length === devices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(devices.map(d => d.id));
    }
  };

  const toggleSelectDevice = (id: number) => {
    if (selectedDevices.includes(id)) {
      setSelectedDevices(selectedDevices.filter(deviceId => deviceId !== id));
    } else {
      setSelectedDevices([...selectedDevices, id]);
    }
  };

  const handleExport = () => {
    const exportData = filteredDevices.map(device => ({
      'الشركة': device.company || '',
      'الموديل': device.model || '',
      'المساحة': device.storage || '',
      'اللون': device.color || '',
      'الرام': device.ram || '',
      'الحالة': device.condition || '',
      'الكرتونة': device.has_box ? 'نعم' : 'لا',
      'المصدر': device.source || '',
      'الفرع': device.branches?.name || 'الافتراضي',
      'IMEI 1': device.imei1 || '',
      'IMEI 2': device.imei2 || '',
      'سعر التكلفة': device.cost_price || 0,
      'سعر البيع': device.selling_price || 0,
      'الضريبة': device.tax || 0,
      'ملاحظات': device.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الأجهزة");
    
    XLSX.writeFile(workbook, "devices_export.xlsx");
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'جديد': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'كالجديد': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'مستعمل': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'عاطل': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'متاح':
      case 'available': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'مباع':
      case 'sold': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'محجوز':
      case 'reserved': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'مرتجع':
      case 'returned': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'on_installment': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'sold_installment': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'هالك': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'in_transit': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'أرشيف': return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'متاح';
      case 'sold': return 'مباع';
      case 'on_installment': return 'في التقسيط';
      case 'sold_installment': return 'في التقسيط';
      case 'reserved': return 'محجوز';
      case 'returned': return 'مرتجع';
      case 'in_transit': return 'في الطريق';
      default: return status || 'متاح';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6" 
      dir="rtl"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 end-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Smartphone className="w-7 h-7 text-slate-900 dark:text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {warehouse ? warehouse.name : 'مخزون الأجهزة'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {warehouse ? (warehouse.description || 'إدارة وتتبع الأجهزة في هذا المخزن') : 'إدارة وتتبع جميع الأجهزة في المخزن الافتراضي'}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-slate-200 dark:border-white/10 flex items-center gap-2">
            <Settings className="w-4 h-4" /> إعدادات المخزون
          </button>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> قيمة البيع المتوقعة
          </p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-wider">
            {totalExpectedSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-400" /> قيمة التكلفة
          </p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-wider">
            {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-400" /> الأجهزة المعروضة
          </p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-wider">
            {displayedCount}
          </h3>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Filters Sidebar */}
        <div className="w-full xl:w-80 shrink-0 space-y-4">
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-white/5 pb-4">
              <Filter className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">الفلاتر</h3>
            </div>

            <div className="space-y-5">
              {/* IMEI Search */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Barcode className="w-4 h-4 text-blue-400" /> بحث IMEI
                </label>
                <input 
                  type="text" 
                  name="imei"
                  value={filters.imei}
                  onChange={handleFilterChange}
                  placeholder="ابحث برقم IMEI..." 
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <LayoutGrid className="w-4 h-4 text-purple-400" /> الشركة
                </label>
                <div className="relative">
                  <select 
                    name="company"
                    value={filters.company}
                    onChange={handleFilterChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="عرض الكل">عرض الكل</option>
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Oppo">Oppo</option>
                    <option value="Realme">Realme</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Huawei">Huawei</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" /> حالة الجهاز
                </label>
                <div className="relative">
                  <select 
                    name="condition"
                    value={filters.condition}
                    onChange={handleFilterChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="عرض الكل">عرض الكل</option>
                    <option value="جديد">جديد</option>
                    <option value="كالجديد">كالجديد</option>
                    <option value="مستعمل">مستعمل</option>
                    <option value="عاطل">عاطل</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Inventory Status */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Layers className="w-4 h-4 text-emerald-400" /> حالة المخزون
                </label>
                <div className="relative">
                  <select 
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="عرض الكل">عرض الكل</option>
                    <option value="متاح">متاح</option>
                    <option value="مباع">مباع</option>
                    <option value="محجوز">محجوز</option>
                    <option value="مرتجع">مرتجع</option>
                    <option value="هالك">هالك</option>
                    <option value="أرشيف">أرشيف</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button className="col-span-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> تطبيق الفلتر
                </button>
                <button 
                  onClick={resetFilters}
                  className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10"
                >
                  <RotateCcw className="w-4 h-4" /> إعادة تعيين
                </button>
                <button 
                  onClick={resetFilters}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-blue-500/20"
                >
                  <LayoutGrid className="w-4 h-4" /> عرض الكل
                </button>
              </div>
            </div>
          </div>

          {/* Device Tracking */}
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-white/5 pb-4">
              <Smartphone className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">تتبع جهاز</h3>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <Barcode className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="أدخل IMEI للتتبع..." 
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> تتبع الآن
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-white/5">
              <Archive className="w-4 h-4" /> الأرشيف
            </button>
            <button 
              onClick={() => setIsAddDeviceModalOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-5 h-5" /> إضافة جهاز جديد
            </button>
            <button 
              onClick={() => setIsAddMultipleModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              <Layers className="w-5 h-5" /> إضافة متعددة
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col overflow-hidden">
          
          {/* Top Actions Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-white/[0.02]">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> استيراد
              </button>
              <button 
                onClick={handleExport}
                className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> تصدير
              </button>
              <button 
                onClick={() => setIsBarcodeModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> طباعة باركود
              </button>
              <button 
                onClick={() => setIsUnifyPricesModalOpen(true)}
                disabled={selectedDevices.length < 2}
                className="bg-teal-600 hover:bg-teal-500 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={selectedDevices.length < 2 ? "يجب تحديد جهازين على الأقل" : ""}
              >
                <DollarSign className="w-4 h-4" /> توحيد الأسعار
              </button>
              <button className="bg-orange-600 hover:bg-orange-500 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" /> تحويل المحدد
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-500/20">
                نتائج: {displayedCount}
              </div>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-500 absolute top-1/2 start-3 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="بحث سريع (موديل، سعة، IMEI)..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto custom-scrollbar relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#11151c]/50 backdrop-blur-sm z-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#11151c]/50 backdrop-blur-sm z-20">
                <div className="text-center text-red-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>{error}</p>
                  <button onClick={() => fetchDevices(resolvedWarehouseId)} className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-sm transition-colors">
                    إعادة المحاولة
                  </button>
                </div>
              </div>
            ) : null}

            <table className="w-full text-sm text-right">
              <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#080c13]/50 border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedDevices.length === devices.length && devices.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080c13] text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                    />
                  </th>
                  <th className="p-4 font-medium">#</th>
                  <th className="p-4 font-medium">النوع</th>
                  <th className="p-4 font-medium">الموديل</th>
                  <th className="p-4 font-medium">السعة</th>
                  <th className="p-4 font-medium">الباركود</th>
                  <th className="p-4 font-medium">IMEI</th>
                  <th className="p-4 font-medium">الحالة</th>
                  <th className="p-4 font-medium">التكلفة</th>
                  <th className="p-4 font-medium">سعر البيع</th>
                  <th className="p-4 font-medium">المخزون</th>
                  <th className="p-4 font-medium text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDevices.length === 0 && !isLoading && !error ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      لا توجد أجهزة مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  paginatedDevices.map((device, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={device.id} 
                      className="hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/[0.04] transition-all group relative"
                    >
                      <td className="p-4 relative z-10">
                        <input 
                          type="checkbox" 
                          checked={selectedDevices.includes(device.id)}
                          onChange={() => toggleSelectDevice(device.id)}
                          className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080c13] text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 transition-all"
                        />
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white relative z-10">{device.id}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-white/10">
                            {device.company ? device.company.charAt(0) : '?'}
                          </div>
                          {device.company || 'غير محدد'}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white relative z-10">
                        {device.model || 'غير محدد'}
                        {device.battery_percentage ? (
                          <div className="mt-1">
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold border border-emerald-200 dark:border-emerald-500/30">
                              % {device.battery_percentage}
                            </span>
                          </div>
                        ) : null}
                        {resolvedWarehouseId === 'ALL' && (
                          <div className="text-[10px] text-blue-500 font-normal mt-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 inline-block truncate max-w-[100px]" title={device.branches?.name || 'الفرع الافتراضي'}>
                            {device.branches?.name || 'الفرع الافتراضي'}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300 relative z-10">{device.storage || '-'}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs relative z-10">{device.id.toString().padStart(6, '0')}</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs tracking-wider relative z-10">{device.imei1 || '-'}</td>
                      <td className="p-4 relative z-10">
                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${getConditionBadge(device.condition || 'جديد')} shadow-sm`}>
                          {device.condition || 'جديد'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono relative z-10">
                        {(device.cost_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 font-bold text-emerald-400 font-mono relative z-10">
                        {(device.selling_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 relative z-10">
                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${getStatusBadge(device.status || 'available')} shadow-sm`}>
                          {getStatusText(device.status || 'available')}
                        </span>
                      </td>
                      <td className="p-4 relative z-10">
                        <div className="flex items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setViewDevice(device)}
                            className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-slate-900 dark:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-xl transition-all" 
                            title="عرض التفاصيل"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditDevice(device)}
                            className="p-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-slate-900 dark:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-xl transition-all" 
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setTransferDevice(device)}
                            className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] rounded-xl transition-all" 
                            title="تحويل"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setSelectedDevices([device.id]); setIsBarcodeModalOpen(true); }}
                            className="p-2 bg-pink-500/10 text-pink-400 hover:bg-pink-500 hover:text-white hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] rounded-xl transition-all" 
                            title="طباعة باركود"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSellDevice(device)}
                            className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-900 dark:text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] rounded-xl transition-all" 
                            title="بيع"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteDevice(device)}
                            className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-slate-900 dark:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.5)] rounded-xl transition-all" 
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, filteredDevices.length)} من أصل {filteredDevices.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                  {currentPage}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span>عدد الصفوف:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 outline-none text-slate-600 dark:text-slate-300"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddDeviceModal 
        isOpen={isAddDeviceModalOpen} 
        onClose={() => setIsAddDeviceModalOpen(false)} 
        onSuccess={() => {
          resolveAndFetch();
        }}
        onSwitchToMultiple={() => {
          setIsAddDeviceModalOpen(false);
          setIsAddMultipleModalOpen(true);
        }}
      />

      <AddMultipleDevicesModal 
        isOpen={isAddMultipleModalOpen} 
        onClose={() => setIsAddMultipleModalOpen(false)} 
        onSuccess={() => {
          resolveAndFetch();
        }}
      />

      <ImportExcelModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          resolveAndFetch();
        }}
        warehouseId={resolvedWarehouseId}
      />

      {/* Action Modals */}
      <ViewDeviceModal 
        isOpen={!!viewDevice}
        onClose={() => setViewDevice(null)}
        device={viewDevice}
      />

      <EditDeviceModal 
        isOpen={!!editDevice}
        onClose={() => setEditDevice(null)}
        onSuccess={() => {
          resolveAndFetch();
        }}
        device={editDevice}
      />

      <DeleteDeviceModal 
        isOpen={!!deleteDevice}
        onClose={() => setDeleteDevice(null)}
        onSuccess={() => {
          resolveAndFetch();
        }}
        device={deleteDevice}
      />

      <SellDeviceModal 
        isOpen={!!sellDevice}
        onClose={() => setSellDevice(null)}
        onSuccess={() => {
          resolveAndFetch();
        }}
        device={sellDevice}
      />

      <TransferItemModal 
        isOpen={!!transferDevice}
        onClose={() => setTransferDevice(null)}
        onSuccess={() => {
          setTransferDevice(null);
          resolveAndFetch();
        }}
        item={transferDevice}
        itemType="devices"
        sourceWarehouse={warehouse || { id: resolvedWarehouseId, name: 'مخزن الأجهزة الافتراضي', type: 'devices' }}
      />

      <UnifyPricesModal 
        isOpen={isUnifyPricesModalOpen}
        onClose={() => setIsUnifyPricesModalOpen(false)}
        onSuccess={() => {
          resolveAndFetch();
          setSelectedDevices([]); // Clear selection after applying
        }}
        selectedDevices={devices.filter(d => selectedDevices.includes(d.id))}
      />

      <PrintBarcodeModal 
        isOpen={isBarcodeModalOpen} 
        onClose={() => setIsBarcodeModalOpen(false)} 
        autoSelectItem={(selectedDevices.length === 1 && devices.find(d => d.id === selectedDevices[0])) ? { item: devices.find(d => d.id === selectedDevices[0]), category: 'device' } : undefined}
      />
    </motion.div>
  );
}
