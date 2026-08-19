import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Filter, MoreVertical, Edit2, Trash2, 
  Eye, AlertTriangle, Package, TrendingUp, DollarSign,
  ChevronRight, ChevronLeft, Download, Printer, Settings2,
  Loader2, Trash, FileText, Tag, Upload, ArrowUpDown,
  ArrowUp, ArrowDown, LayoutGrid, List as ListIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import AddSparePartModal from './AddSparePartModal';
import TransferItemModal from './TransferItemModal';
import { ArrowRightLeft } from 'lucide-react';
import { PrintBarcodeModal } from './PrintBarcodeModal';
import ImportSparePartsModal from './ImportSparePartsModal';
import BulkEditSparePartsModal from './BulkEditSparePartsModal';
import AddMultipleSparePartsModal from './AddMultipleSparePartsModal';

interface SparePart {
  id: number;
  created_at: string;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  barcode_type: string;
  cost_price: number;
  sell_price: number;
  wholesale_price?: number | null;
  half_wholesale_price?: number | null;
  quantity: number;
  min_quantity: number;
  notes: string;
  user_id: string;
  status?: number;
  branches?: { name: string };
}

const categories = ['الكل', 'شاشات', 'بطاريات', 'فلاتات', 'كاميرات', 'أيسيهات', 'أدوات صيانة', 'أخرى'];

export default function SpareParts({ warehouse }: { warehouse?: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortConfig, setSortConfig] = React.useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Core array states
  const [parts, setParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvedWarehouseId, setResolvedWarehouseId] = useState<string | null>(warehouse?.id || null);

  // Modal and selection states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddMultipleModalOpen, setIsAddMultipleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [transferPart, setTransferPart] = useState<SparePart | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    barcode: '',
    barcode_type: 'EAN-13',
    cost_price: 0,
    sell_price: 0,
    wholesale_price: '' as string | number | null,
    half_wholesale_price: '' as string | number | null,
    quantity: 0,
    min_quantity: 0,
    notes: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(50);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, statusFilter]);

  React.useEffect(() => {
    resolveAndFetch();
  }, [warehouse]);

  const resolveAndFetch = async () => {
    setIsLoading(true);
    try {
      let targetWarehouseId = warehouse?.id;
      const token = localStorage.getItem('access_token');
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      
      if (!targetWarehouseId && !warehouse) {
        if (!activeBranchId || activeBranchId === 'ALL') {
           setResolvedWarehouseId('ALL');
           targetWarehouseId = 'ALL';
        } else {
          // Find default device warehouse for the branch
          let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.spare_parts&is_default=eq.true&branch_id=eq.${activeBranchId}`;
          let whRes = await fetch(url, {
            headers: {
              'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
              'Authorization': `Bearer ${token}`
            }
          });
          let whData = await whRes.json();
          if (!Array.isArray(whData) || whData.length === 0) {
             let url2 = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.spare_parts&branch_id=eq.${activeBranchId}&order=created_at.asc&limit=1`;
             whRes = await fetch(url2, {
               headers: {
                 'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
                 'Authorization': `Bearer ${token}`
               }
             });
             whData = await whRes.json();
              if (Array.isArray(whData) && whData.length > 0) {
               targetWarehouseId = whData[0].id.toString();
               setResolvedWarehouseId(targetWarehouseId);
             } else {
               targetWarehouseId = 'ALL';
               setResolvedWarehouseId('ALL');
             }
          } else {
            targetWarehouseId = whData[0].id.toString();
            setResolvedWarehouseId(targetWarehouseId);
          }
        }
      }

      await fetchSpareParts(targetWarehouseId);
    } catch (err: any) {
      setError('فشل تجهيز بيانات المخزن');
      setIsLoading(false);
    }
  };

  const fetchSpareParts = async (warehouseId: string | null) => {
    if (warehouseId === 'NONE') {
      setParts([]);
      setIsLoading(false);
      return;
    }
    try {
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;
      let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?select=*,branches(name)`;

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
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) throw new Error('فشل جلب قطع الغيار');
      const data = await response.json();
      setParts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      sku: '',
      barcode: '',
      barcode_type: 'EAN-13',
      cost_price: 0,
      sell_price: 0,
      quantity: 0,
      min_quantity: 0,
      notes: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (part: SparePart) => {
    setSelectedPart(part);
    setFormData({
      name: part.name || '',
      category: part.category || '',
      sku: part.sku || '',
      barcode: part.barcode || '',
      barcode_type: part.barcode_type || 'EAN-13',
      cost_price: part.cost_price || 0,
      sell_price: part.sell_price || 0,
      wholesale_price: part.wholesale_price ?? '',
      half_wholesale_price: part.half_wholesale_price ?? '',
      quantity: part.quantity || 0,
      min_quantity: part.min_quantity || 0,
      notes: part.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (part: SparePart) => {
    setSelectedPart(part);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (part: SparePart) => {
    setSelectedPart(part);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPart) return;

    const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevel = actCashier?.role_level || 3;
    const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
    const specialPerms = actCashier?.permissions?.special || [];

    if (!isOwnerAct && !specialPerms.includes('حذف البيانات')) {
      alert('ليس لديك صلاحية لحذف البيانات');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?id=eq.${selectedPart.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) throw new Error('فشل حذف القطعة');

      setIsDeleteModalOpen(false);
      setSelectedPart(null);
      resolveAndFetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (quantity: number, min_quantity: number = 5) => {
    if (quantity === 0) return { label: 'نفذ', color: 'rose', value: 'out' };
    if (quantity <= min_quantity) return { label: 'منخفض', color: 'orange', value: 'low' };
    return { label: 'متوفر', color: 'emerald', value: 'available' };
  };

  const handleExport = () => { /* noop */ };
  const handleEditPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;

    const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevel = actCashier?.role_level || 3;
    const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
    const specialPerms = actCashier?.permissions?.special || [];

    if (!isOwnerAct && !specialPerms.includes('تعديل البيانات')) {
      alert('ليس لديك صلاحية لتعديل البيانات');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        wholesale_price: formData.wholesale_price === '' ? null : Number(formData.wholesale_price),
        half_wholesale_price: formData.half_wholesale_price === '' ? null : Number(formData.half_wholesale_price),
      };

      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?id=eq.${selectedPart.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تحديث القطعة');
      }
      setIsEditModalOpen(false);
      setSelectedPart(null);
      resolveAndFetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeletePart = handleDelete;

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const uniqueCategories = React.useMemo(() => {
    const cats = new Set(categories);
    parts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [parts]);

  const filteredParts = React.useMemo(() => {
    let result = parts.filter(part => {
      const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (part.sku && part.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (part.barcode && part.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'الكل' || part.category === selectedCategory;
      
      const status = getStatusInfo(part.quantity).value;
      const matchesStatus = statusFilter === 'الكل' || 
                           (statusFilter === 'متوفر' && status === 'available') ||
                           (statusFilter === 'على وشك النفاد' && status === 'low') ||
                           (statusFilter === 'غير متوفر' && status === 'out');

      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (sortConfig) {
      result.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || bValue === undefined) return 0;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [parts, searchTerm, selectedCategory, statusFilter, sortConfig]);

  const lowStockCount = parts.filter(p => p.quantity <= p.min_quantity).length;
  const totalValue = parts.reduce((acc, p) => acc + (p.quantity * p.cost_price), 0);

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const paginatedParts = filteredParts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredParts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredParts.map(i => i.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 end-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-600 to-teal-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.3)]">
            <Settings2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {warehouse ? warehouse.name : 'مخزن قطع الغيار'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {warehouse ? (warehouse.description || 'إدارة وتتبع قطع الغيار في هذا المخزن') : 'إدارة وتتبع قطع الغيار المتوفرة في المخزن الافتراضي'}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          {selectedItems.length > 0 && (
            <button 
              onClick={() => setIsBulkEditModalOpen(true)}
              className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-purple-500/20"
            >
              <Edit2 className="w-4 h-4" />
              تعديل مجمع ({selectedItems.length})
            </button>
          )}
          <button 
            onClick={resolveAndFetch}
            className="flex items-center gap-2 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            استيراد
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير
          </button>
          <button 
            onClick={() => setIsBarcodeModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة باركود
          </button>
          <button 
            onClick={() => setIsAddMultipleModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            <Package className="w-4 h-4" />
            إضافة متعددة
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)]"
          >
            <Plus className="w-4 h-4" />
            إضافة قطعة جديدة
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">إجمالي الأصناف</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : parts.length}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">نقص في المخزون</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : lowStockCount}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">قيمة المخزون (شراء)</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : totalValue.toLocaleString()} <span className="text-sm font-normal text-slate-500">ج.م</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">حركات اليوم</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">--</div>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute top-1/2 start-4 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="بحث باسم القطعة أو SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 ps-12 pe-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-white/10 text-teal-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-teal-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">الفئة:</span>
            <div className="flex flex-wrap gap-2">
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat 
                      ? 'bg-teal-500 text-slate-900 dark:text-white' 
                      : 'bg-slate-50 dark:bg-[#080c13] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:border-teal-500/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">الحالة:</span>
            <div className="flex gap-2">
              {['الكل', 'متوفر', 'على وشك النفاد', 'غير متوفر'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === status 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                      : 'bg-slate-50 dark:bg-[#080c13] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:border-slate-900/30 dark:hover:border-white/30'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Spare Parts Content */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.length === filteredParts.length && filteredParts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080c13] text-teal-500 focus:ring-teal-500/50 focus:ring-offset-0"
                    />
                  </th>
                  <th onClick={() => handleSort('name')} className="px-6 py-4 text-start text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-teal-500 transition-colors">
                    <div className="flex items-center gap-2">
                      الاسم
                      {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-start text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">الفئة</th>
                  <th className="px-6 py-4 text-start text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SKU</th>
                  <th onClick={() => handleSort('cost_price')} className="px-6 py-4 text-start text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-teal-500 transition-colors">
                    <div className="flex items-center gap-2">
                      سعر التكلفة
                      {sortConfig?.key === 'cost_price' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th onClick={() => handleSort('sell_price')} className="px-6 py-4 text-start text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-teal-500 transition-colors">
                    <div className="flex items-center gap-2">
                      سعر البيع
                      {sortConfig?.key === 'sell_price' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th onClick={() => handleSort('quantity')} className="px-6 py-4 text-start text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-teal-500 transition-colors">
                    <div className="flex items-center gap-2">
                      الكمية
                      {sortConfig?.key === 'quantity' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-start text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">الحد الأدنى</th>
                  <th className="px-6 py-4 text-start text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-4 text-end text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                        <span className="text-slate-500 text-sm">جاري تحميل البيانات...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      لا توجد قطع غيار مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  paginatedParts.map((part) => {
                    const statusInfo = getStatusInfo(part.quantity);
                    return (
                      <tr key={part.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedItems.includes(part.id)}
                            onChange={() => toggleSelectItem(part.id)}
                            className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080c13] text-teal-500 focus:ring-teal-500/50 focus:ring-offset-0 transition-all"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#080c13] flex items-center justify-center text-slate-400 group-hover:text-teal-400 transition-colors">
                              <Settings2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {part.name}
                                {resolvedWarehouseId === 'ALL' && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-500 font-normal">{part.branches?.name || 'الافتراضي'}</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-500">
                                {new Date(part.created_at).toLocaleDateString('ar-EG')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium">
                            {part.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600 dark:text-slate-300 font-mono">{part.sku || '--'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{part.cost_price.toLocaleString()} ج.م</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-teal-400">{part.sell_price.toLocaleString()} ج.م</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{part.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-500">{part.min_quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-end">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openViewModal(part)}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openEditModal(part)}
                              className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setTransferPart(part)}
                              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { setSelectedPart(part); setIsBarcodeModalOpen(true); }}
                              className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                              title="طباعة باركود"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(part)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
              <span className="text-slate-500">جاري تحميل البيانات...</span>
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 bg-white dark:bg-[#11151c] rounded-2xl border border-slate-200 dark:border-white/5">
              لا توجد قطع غيار مطابقة للبحث
            </div>
          ) : (
            paginatedParts.map((part) => {
              const statusInfo = getStatusInfo(part.quantity);
              return (
                <motion.div 
                  layout
                  key={part.id}
                  className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#080c13] flex items-center justify-center text-slate-400 group-hover:text-teal-400 transition-colors">
                      <Settings2 className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openViewModal(part)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEditModal(part)} className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setTransferPart(part)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"><ArrowRightLeft className="w-4 h-4" /></button>
                      <button onClick={() => openDeleteModal(part)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{part.name}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{part.sku || 'بدون SKU'}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">{part.category}</span>
                        {resolvedWarehouseId === 'ALL' && (
                           <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-500 text-[10px] font-bold truncate max-w-[80px]">{part.branches?.name || 'الافتراضي'}</span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                      <div>
                        <p className="text-[10px] text-slate-400 mb-0.5">سعر البيع</p>
                        <p className="text-sm font-bold text-teal-400">{part.sell_price.toLocaleString()} ج.م</p>
                      </div>
                      <div className="text-end">
                        <p className="text-[10px] text-slate-400 mb-0.5">الكمية</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{part.quantity}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            عرض <span className="font-medium text-slate-900 dark:text-white">1</span> إلى <span className="font-medium text-slate-900 dark:text-white">{filteredParts.length}</span> من <span className="font-medium text-slate-900 dark:text-white">{filteredParts.length}</span> قطعة
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

      <AddSparePartModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={resolveAndFetch} 
        warehouseId={resolvedWarehouseId}
      />

      <AddMultipleSparePartsModal 
        isOpen={isAddMultipleModalOpen} 
        onClose={() => setIsAddMultipleModalOpen(false)} 
        onSuccess={resolveAndFetch} 
        warehouseId={resolvedWarehouseId}
      />

      {/* Add/Edit Part Modal */}
      <AnimatePresence mode="wait">
        {(isEditModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="shrink-0 px-8 py-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${isEditModalOpen ? 'bg-blue-500/10 text-blue-400' : 'bg-teal-500/10 text-teal-400'} rounded-xl flex items-center justify-center`}>
                    <Edit2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    تعديل القطعة
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedPart(null);
                    resetForm();
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                >
                  <MoreVertical className="w-5 h-5 rotate-90" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleEditPart} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1 flex items-center gap-1">
                      اسم القطعة <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required
                      type="text"
                      placeholder="أدخل اسم القطعة بالتفصيل..."
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>

                  {/* Category & SKU */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">الفئة</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors appearance-none"
                    >
                      <option value="">اختر الفئة...</option>
                      {uniqueCategories.filter(c => c !== 'الكل').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">SKU</label>
                    <input 
                      type="text"
                      placeholder="رمز الصنف..."
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>

                  {/* Barcode Section */}
                  <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Package className="w-4 h-4" /> الباركود
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="barcode_type" 
                            checked={formData.barcode_type === 'auto'}
                            onChange={() => setFormData({...formData, barcode_type: 'auto'})}
                            className="w-4 h-4 text-teal-500 bg-slate-100 border-slate-300 focus:ring-teal-500" 
                          />
                          <span className="text-xs text-slate-600 dark:text-slate-300">تلقائي</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="barcode_type" 
                            checked={formData.barcode_type === 'manual'}
                            onChange={() => setFormData({...formData, barcode_type: 'manual'})}
                            className="w-4 h-4 text-teal-500 bg-slate-100 border-slate-300 focus:ring-teal-500" 
                          />
                          <span className="text-xs text-slate-600 dark:text-slate-300">يدوي/سكان</span>
                        </label>
                      </div>
                    </div>
                    {formData.barcode_type === 'manual' && (
                      <input 
                        type="text"
                        placeholder="أدخل الباركود أو استخدم الماسح..."
                        value={formData.barcode}
                        onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                        className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                      />
                    )}
                  </div>

                  {/* Prices */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">سعر التكلفة (ج.م) <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({...formData, cost_price: parseFloat(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">سعر البيع قطاعي (ج.م) <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.sell_price}
                      onChange={(e) => setFormData({...formData, sell_price: parseFloat(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">سعر البيع جملة (ج.م) (اختياري)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.wholesale_price ?? ''}
                      onChange={(e) => setFormData({...formData, wholesale_price: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">سعر البيع نصف جملة (ج.م) (اختياري)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.half_wholesale_price ?? ''}
                      onChange={(e) => setFormData({...formData, half_wholesale_price: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>

                  {/* Quantities */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">الكمية</label>
                    <input 
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">الحد الأدنى للمخزون</label>
                    <input 
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({...formData, min_quantity: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1">ملاحظات</label>
                    <textarea 
                      rows={3}
                      placeholder="ملاحظات إضافية..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>
                </div>

                {/* Modal Footer */}
                <div className="shrink-0 flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                      setSelectedPart(null);
                      resetForm();
                    }}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 ${isEditModalOpen ? 'bg-blue-500 hover:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-teal-500 hover:bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)]'} text-slate-900 dark:text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50`}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isEditModalOpen ? 'حفظ التغييرات' : 'حفظ القطعة'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedPart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="shrink-0 px-8 py-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">تفاصيل القطعة</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedPart(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                >
                  <MoreVertical className="w-5 h-5 rotate-90" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/5 text-center">
                  <h4 className="text-xl font-bold text-teal-400 mb-2">{selectedPart.name}</h4>
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                    <span>باركود:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">{selectedPart.barcode || '--'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-500">الفئة</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedPart.category}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-500">SKU</span>
                    <span className="text-sm font-mono text-slate-900 dark:text-white">{selectedPart.sku || '--'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-500">سعر التكلفة</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedPart.cost_price.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-500">سعر البيع قطاعي</span>
                    <span className="text-sm font-bold text-teal-400">{selectedPart.sell_price.toLocaleString()} ج.م</span>
                  </div>
                  {(selectedPart.wholesale_price !== null && selectedPart.wholesale_price !== undefined) && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                      <span className="text-sm text-slate-500">سعر البيع جملة</span>
                      <span className="text-sm font-bold text-indigo-400">{selectedPart.wholesale_price.toLocaleString()} ج.م</span>
                    </div>
                  )}
                  {(selectedPart.half_wholesale_price !== null && selectedPart.half_wholesale_price !== undefined) && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                      <span className="text-sm text-slate-500">سعر البيع نصف جملة</span>
                      <span className="text-sm font-bold text-purple-400">{selectedPart.half_wholesale_price.toLocaleString()} ج.م</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-500">الكمية المتاحة</span>
                    <span className={`text-sm font-bold ${selectedPart.quantity === 0 ? 'text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {selectedPart.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-500">الحد الأدنى</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedPart.min_quantity}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-500">الحالة</span>
                    <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${getStatusInfo(selectedPart.quantity).color}`}>
                      {getStatusInfo(selectedPart.quantity).label}
                    </span>
                  </div>
                </div>

                {selectedPart.notes && (
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                    <div className="text-xs font-bold text-slate-500 mb-2">ملاحظات:</div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedPart.notes}</p>
                  </div>
                )}

              </div>
              
              {/* Modal Footer */}
              <div className="shrink-0 flex items-center justify-between gap-3 p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3 w-full">
                  <button 
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openEditModal(selectedPart);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-slate-900 dark:text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                    <Edit2 className="w-4 h-4" />
                    تعديل
                  </button>
                  <button 
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setIsBarcodeModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white py-2.5 rounded-xl text-sm font-bold transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة الباركود
                  </button>
                  <button 
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setSelectedPart(null);
                    }}
                    className="px-6 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedPart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">تأكيد الحذف</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedPart(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                >
                  <MoreVertical className="w-5 h-5 rotate-90" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash className="w-10 h-10" />
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">هل أنت متأكد من حذف القطعة؟</h4>
                  <p className="text-red-400 font-bold text-xl mb-2">{selectedPart.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">هذا الإجراء لا يمكن التراجع عنه!</p>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                  <button 
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setSelectedPart(null);
                    }}
                    className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={handleDeletePart}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    حذف نهائي
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImportSparePartsModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          resolveAndFetch();
          setIsImportModalOpen(false);
        }}
        warehouseId={resolvedWarehouseId}
      />

      <TransferItemModal 
        isOpen={!!transferPart}
        onClose={() => setTransferPart(null)}
        onSuccess={() => {
          setTransferPart(null);
          resolveAndFetch();
        }}
        item={transferPart}
        itemType="spare_parts"
        sourceWarehouse={warehouse || { id: resolvedWarehouseId, name: 'مخزن قطع الغيار الافتراضي', type: 'spare_parts' }}
      />
      
      <PrintBarcodeModal 
        isOpen={isBarcodeModalOpen} 
        onClose={() => { setIsBarcodeModalOpen(false); setSelectedPart(null); }} 
        autoSelectItem={selectedPart ? { item: selectedPart, category: 'spare_part' } : undefined}
      />

      <BulkEditSparePartsModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        onSuccess={() => {
          setSelectedItems([]);
          resolveAndFetch();
        }}
        selectedIds={selectedItems}
      />
    </div>
  );
}
