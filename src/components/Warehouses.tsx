import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, Plus, ClipboardList, Smartphone, Headphones, 
  Wrench, Package, ArrowUpRight, ArrowDownRight, 
  Edit, Trash2, Download, Upload, X, Save, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ImportExcelModal from './ImportExcelModal';
import { useBranch } from '../contexts/BranchContext';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

const colorMap: Record<string, { bg: string, text: string, border: string, gradient: string }> = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', gradient: 'from-emerald-500/20 to-transparent' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', gradient: 'from-blue-500/20 to-transparent' },
  slate: { bg: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500', gradient: 'from-slate-500/20 to-transparent' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', gradient: 'from-purple-500/20 to-transparent' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', gradient: 'from-orange-500/20 to-transparent' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', gradient: 'from-rose-500/20 to-transparent' },
};

export default function Warehouses({ onNavigate }: { onNavigate: (view: string, warehouse?: any) => void }) {
  const { isOwner, branches, currentBranchId } = useBranch();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [transferWarehouse, setTransferWarehouse] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetWarehouse, setImportTargetWarehouse] = useState<any>(null);
  const [warehouseToDelete, setWarehouseToDelete] = useState<any>(null);

  const fetchWarehouses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      
      let url = `${SUPABASE_URL}?select=*,branches(name)`;
      if (activeBranchId) {
          url += `&branch_id=eq.${activeBranchId}`;
      } else if (tenantId) {
          url += `&tenant_id=eq.${tenantId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('فشل في جلب المخازن');
      const data = await response.json();
      
      let finalWarehouses = data.map((item: any) => {
        return {
          id: item.id,
          name: item.name,
          branchName: item.branches?.name || item.branch?.name || '',
          description: item.description || '',
          type: item.type || 'mixed',
          icon: item.icon || '📦',
          color: item.color || 'blue',
          location: item.location || '',
          manager: item.manager_name || '',
          isDefault: item.is_default || false,
          itemCount: 0, // TODO: Fetch from actual items
          totalQuantity: 0,
          totalValue: 0
        };
      });

      // Get the default warehouses for null fallbacks
      const defaultDevicesId = data.find((w: any) => w.type === 'devices' && w.is_default)?.id;
      const defaultAccessoriesId = data.find((w: any) => w.type === 'accessories' && w.is_default)?.id;
      const defaultSparePartsId = data.find((w: any) => w.type === 'spare_parts' && w.is_default)?.id;

      let devicesData: any[] = [];
      let accessoriesData: any[] = [];
      let sparePartsData: any[] = [];

      try {
        let devUrl = `${SUPABASE_URL.replace('/Warehouses', '/Devices')}?select=warehouse_id,cost_price&status=not.in.(sold,sold_installment)&tenant_id=eq.${tenantId}`;
        let accUrl = `${SUPABASE_URL.replace('/Warehouses', '/Accessories')}?select=warehouse_id,quantity,cost_price&tenant_id=eq.${tenantId}`;
        let spareUrl = `${SUPABASE_URL.replace('/Warehouses', '/spare_parts')}?select=warehouse_id,quantity,cost_price&tenant_id=eq.${tenantId}`;

        if (activeBranchId) {
            devUrl += `&branch_id=eq.${activeBranchId}`;
            accUrl += `&branch_id=eq.${activeBranchId}`;
            spareUrl += `&branch_id=eq.${activeBranchId}`;
        }

        const [devRes, accRes, spareRes] = await Promise.all([
          fetch(devUrl, {
            headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
          }),
          fetch(accUrl, {
            headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
          }),
          fetch(spareUrl, {
            headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (devRes.ok) devicesData = await devRes.json();
        if (accRes.ok) accessoriesData = await accRes.json();
        if (spareRes.ok) sparePartsData = await spareRes.json();
      } catch (e) {
        console.error('Failed to fetch items for stats calculation', e);
      }

      // Aggregate stats
      const statsMap = new Map(); // warehouse_id -> { itemCount, totalQuantity, totalValue }

      const addToMap = (whId: any, qty: number, cost: number) => {
        if (!whId) return; // Skip if still null (no default)
        const key = String(whId);
        const current = statsMap.get(key) || { itemCount: 0, totalQuantity: 0, totalValue: 0 };
        current.itemCount += 1;
        current.totalQuantity += qty;
        current.totalValue += (qty * cost);
        statsMap.set(key, current);
      };

      devicesData.forEach(d => {
        // Only count available devices if there's a status column, or count all if not? Let's just fix the ID first
        const whId = d.warehouse_id || defaultDevicesId;
        const qty = Number(d.quantity) || 1; // Devices default to 1
        const cost = Number(d.cost_price) || 0;
        addToMap(whId, qty, cost);
      });

      accessoriesData.forEach(a => {
        const whId = a.warehouse_id || defaultAccessoriesId;
        const qty = Number(a.quantity) || 0;
        const cost = Number(a.cost_price) || 0;
        addToMap(whId, qty, cost);
      });

      sparePartsData.forEach(s => {
        const whId = s.warehouse_id || defaultSparePartsId;
        const qty = Number(s.quantity) || 0;
        const cost = Number(s.cost_price) || 0;
        addToMap(whId, qty, cost);
      });

      finalWarehouses = finalWarehouses.map(w => {
        const stats = statsMap.get(String(w.id));
        if (stats) {
          return { ...w, itemCount: stats.itemCount, totalQuantity: stats.totalQuantity, totalValue: stats.totalValue };
        }
        return w;
      });

      setWarehouses(finalWarehouses);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء جلب المخازن');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    autoFixNullWarehouses();
  }, []);

  const autoFixNullWarehouses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      if (!token || !userId) return;

      const headers = {
        'apikey': API_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      };

      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      let url = `${SUPABASE_URL}?select=id,type&is_default=eq.true`;
      if (activeBranchId) {
          url += `&branch_id=eq.${activeBranchId}`;
      } else {
          const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
          if (tenantId) url += `&tenant_id=eq.${tenantId}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) return;
      const defaults = await res.json();
      const defaultDevices = defaults.find((d: any) => d.type === 'devices')?.id;
      const defaultAccessories = defaults.find((d: any) => d.type === 'accessories')?.id;
      const defaultSpareParts = defaults.find((d: any) => d.type === 'spare_parts')?.id;

      if (defaultDevices) {
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?warehouse_id=is.null`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ warehouse_id: defaultDevices })
        });
      }
      if (defaultAccessories) {
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?warehouse_id=is.null`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ warehouse_id: defaultAccessories })
        });
      }
      if (defaultSpareParts) {
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?warehouse_id=is.null`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ warehouse_id: defaultSpareParts })
        });
      }
    } catch (err) {
      console.error('Error auto-fixing warehouses:', err);
    }
  };

  const handleAddWarehouse = async (newWarehouse: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      
      const activeCashierStr = localStorage.getItem("active_cashier");
      const activeCashier = activeCashierStr ? JSON.parse(activeCashierStr) : null;
      let tenantId = activeCashier?.tenant_id || userId;

      const payload: any = {
        name: newWarehouse.name,
        description: newWarehouse.description || '',
        type: newWarehouse.type || 'devices',
        is_default: false,
        icon: newWarehouse.icon,
        color: newWarehouse.color,
        location: newWarehouse.location,
        manager_name: newWarehouse.manager,
        user_id: userId,
        tenant_id: tenantId
      };

      if (newWarehouse.branch_id) {
        payload.branch_id = newWarehouse.branch_id;
      } else if (activeBranchId) {
        payload.branch_id = activeBranchId;
      }

      const response = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Add warehouse error:', errData);
        throw new Error('فشل في إضافة المخزن: ' + (errData.message || ''));
      }
      
      await fetchWarehouses();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إضافة المخزن');
    }
  };

  const handleEditWarehouse = async (updatedWarehouse: any) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const payload = {
        name: updatedWarehouse.name,
        description: updatedWarehouse.description || '',
        icon: updatedWarehouse.icon,
        color: updatedWarehouse.color,
        location: updatedWarehouse.location,
        manager_name: updatedWarehouse.manager,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${SUPABASE_URL}?id=eq.${updatedWarehouse.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('فشل في تحديث المخزن');
      
      await fetchWarehouses();
      setEditingWarehouse(null);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء تحديث المخزن');
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevel = actCashier?.role_level || 3;
    const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
    const specialPerms = actCashier?.permissions?.special || [];

    if (!isOwnerAct && !specialPerms.includes('حذف البيانات')) {
      alert('ليس لديك صلاحية لحذف البيانات');
      setWarehouseToDelete(null);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${SUPABASE_URL}?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('فشل في حذف المخزن');
      
      setWarehouses(warehouses.filter(w => w.id !== id));
      setWarehouseToDelete(null);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حذف المخزن');
    }
  };

  const handleOpenWarehouse = (warehouse: any) => {
    if (warehouse.type === 'devices') onNavigate('devices', warehouse);
    else if (warehouse.type === 'accessories') onNavigate('accessories', warehouse);
    else if (warehouse.type === 'spare_parts') onNavigate('spare_parts', warehouse);
    else onNavigate('custom_warehouse', warehouse);
  };

  const handleImportClick = (warehouse: any) => {
    if (warehouse.type !== 'devices') {
      alert('الاستيراد متاح حالياً لمخزن الأجهزة فقط');
      return;
    }
    setImportTargetWarehouse(warehouse);
    setIsImportModalOpen(true);
  };

  const handleExport = async (warehouse: any) => {
    if (warehouse.type !== 'devices') {
      alert('التصدير متاح حالياً لمخزن الأجهزة فقط');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=*`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('فشل في جلب البيانات للتصدير');
      const data = await response.json();
      
      const exportData = data.map((item: any) => ({
        'الاسم': item.name,
        'الفئة': item.category,
        'الماركة': item.brand,
        'الموديل': item.model,
        'سعر التكلفة': item.cost_price,
        'سعر البيع': item.selling_price,
        'الكمية': item.stock,
        'الباركود': item.barcode,
        'المورد': item.supplier,
        'ملاحظات': item.notes
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'الأجهزة');
      XLSX.writeFile(wb, `مخزن_${warehouse.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء التصدير');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6" 
      dir="rtl"
    >
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10">
            <Store className="w-6 h-6 text-slate-900 dark:text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">المخازن المتاحة</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">إدارة ومتابعة جميع مخازن النظام</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('inventory')}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <ClipboardList className="w-4 h-4" /> الجرد
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <Plus className="w-4 h-4" /> إضافة مخزن تخزين
          </button>
        </div>
      </div>

      {/* Warehouses Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {warehouses.map((warehouse, index) => {
              const colors = colorMap[warehouse.color] || colorMap.slate;

              return (
                <motion.div 
                  key={warehouse.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => handleOpenWarehouse(warehouse)}
                  className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden relative group hover:border-slate-200 dark:border-white/10 transition-all flex flex-col cursor-pointer"
                >
                  {/* Top Gradient Accent */}
                  <div className={`absolute top-0 inset-x-0 h-1 ${colors.bg}`} />
                  <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${colors.gradient} opacity-50 pointer-events-none`} />

                  <div className="p-6 relative z-10 flex-1 flex flex-col">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                          {warehouse.name}
                          {warehouse.branchName && (
                            <span className="text-sm font-normal text-slate-500 mr-2 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                              {warehouse.branchName}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{warehouse.description || 'لا يوجد وصف'}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/5 flex items-center justify-center shadow-inner shrink-0 text-2xl`}>
                        {warehouse.icon}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-3 mt-auto">
                      <div className="bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">عدد الأصناف</p>
                        <p className={`text-xl font-bold ${colors.text}`}>{warehouse.itemCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الكمية الإجمالية</p>
                        <p className={`text-xl font-bold ${colors.text}`}>{warehouse.totalQuantity.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-center mb-6">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">القيمة الإجمالية</p>
                      <p className={`text-2xl font-bold ${colors.text}`}>EGP {warehouse.totalValue.toLocaleString()}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleImportClick(warehouse)}
                          className="w-8 h-8 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-slate-900 dark:text-white rounded-lg flex items-center justify-center transition-all" 
                          title="استيراد"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleExport(warehouse)}
                          className="w-8 h-8 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-900 dark:text-white rounded-lg flex items-center justify-center transition-all" 
                          title="تصدير"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingWarehouse(warehouse)}
                          className="w-8 h-8 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center transition-all" 
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!warehouse.isDefault && (
                          <button 
                            onClick={() => setWarehouseToDelete(warehouse)}
                            className="w-8 h-8 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-900 dark:text-white rounded-lg flex items-center justify-center transition-all" 
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setTransferWarehouse(warehouse)}
                          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap"
                        >
                          تحويل
                        </button>
                        <button 
                          onClick={() => handleOpenWarehouse(warehouse)}
                          className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] whitespace-nowrap"
                        >
                          فتح المخزن
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Warehouse Modal */}
      <WarehouseModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleAddWarehouse}
        title="إضافة مخزن تخزين"
        isOwner={isOwner}
        branches={branches}
        currentBranchId={currentBranchId}
      />

      {/* Edit Warehouse Modal */}
      <WarehouseModal 
        isOpen={!!editingWarehouse} 
        onClose={() => setEditingWarehouse(null)} 
        onSave={handleEditWarehouse}
        initialData={editingWarehouse}
        title="تعديل بيانات المخزن"
        isOwner={isOwner}
        branches={branches}
        currentBranchId={currentBranchId}
      />

      {/* Transfer Modal */}
      <TransferModal 
        isOpen={!!transferWarehouse}
        onClose={() => setTransferWarehouse(null)}
        onSuccess={fetchWarehouses}
        sourceWarehouse={transferWarehouse}
        warehouses={warehouses}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {warehouseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:pr-72" dir="rtl">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-50 dark:bg-[#080c13]/80 backdrop-blur-sm"
              onClick={() => setWarehouseToDelete(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">حذف المخزن</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  هل أنت متأكد من حذف مخزن <span className="text-slate-900 dark:text-white font-bold">{warehouseToDelete.name}</span>؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setWarehouseToDelete(null)}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={() => handleDeleteWarehouse(warehouseToDelete.id)}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                  >
                    تأكيد الحذف
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Excel Modal */}
      <ImportExcelModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchWarehouses}
      />
    </motion.div>
  );
}

function WarehouseModal({ isOpen, onClose, onSave, initialData, title, isOwner, branches, currentBranchId }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void, initialData?: any, title: string, isOwner?: boolean, branches?: any[], currentBranchId?: string }) {
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    type: 'devices',
    icon: '📦',
    color: 'blue',
    location: '',
    manager: '',
    branch_id: ''
  });

  React.useEffect(() => {
    let defaultManager = '';
    const activeCashierStr = localStorage.getItem("active_cashier");
    if (activeCashierStr) {
      try {
        const cashier = JSON.parse(activeCashierStr);
        if (!isOwner) {
          defaultManager = cashier.full_name || '';
        }
      } catch (e) {}
    }

    if (initialData) {
      setFormData({
        ...initialData,
        branch_id: initialData.branch_id || currentBranchId || '',
        manager: initialData.manager || (!isOwner ? defaultManager : '')
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'devices',
        icon: '📦',
        color: 'blue',
        location: '',
        manager: !isOwner ? defaultManager : '',
        branch_id: currentBranchId || ''
      });
    }
  }, [initialData, isOpen, isOwner, currentBranchId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(initialData ? { ...initialData, ...formData } : formData);
  };

  const isDefault = initialData?.isDefault;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:pr-72" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-50 dark:bg-[#080c13]/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="warehouse-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-3 items-center">
                <span className="text-xl">📦</span>
                <p className="text-sm text-blue-200">مخزن التخزين يحتوي على بضاعة مخزنة يمكن تحويلها للمخازن الرئيسية</p>
              </div>

              {!isDefault && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نوع المخزن *</label>
                  <select 
                    required
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="devices">أجهزة (موبايلات، تابلت، لابتوب) 📱</option>
                    <option value="accessories">إكسسوارات (شواحن، سماعات، كفرات) 🎧</option>
                    <option value="spare_parts">قطع غيار (شاشات، بطاريات، فلاتات) 🔧</option>
                    <option value="mixed">مختلط (أجهزة + إكسسوارات + قطع غيار) 📦</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اسم المخزن *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="مثال: مخزن قطع الغيار"
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">أيقونة المخزن (إيموجي)</label>
                <input 
                  type="text" 
                  value={formData.icon}
                  onChange={e => setFormData({...formData, icon: e.target.value})}
                  placeholder="📦"
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all text-right"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الوصف</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="وصف مختصر للمخزن..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              {!isDefault && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الموقع</label>
                    <input 
                      type="text" 
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      placeholder="مثال: الدور الأول - القسم A"
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">المسؤول</label>
                    <input 
                      type="text" 
                      value={formData.manager}
                      onChange={e => setFormData({...formData, manager: e.target.value})}
                      placeholder="اسم المسؤول عن المخزن"
                      readOnly={!isOwner}
                      className={`w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all ${!isOwner ? 'opacity-70 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  {isOwner && branches && branches.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الفرع (اختياري)</label>
                      <select 
                        value={formData.branch_id}
                        onChange={e => setFormData({...formData, branch_id: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none"
                      >
                        <option value="">جميع الفروع (أو الفرع الحالي)</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اللون المميز</label>
                <div className="flex gap-3">
                  <select 
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    className="flex-1 bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="blue">أزرق</option>
                    <option value="emerald">أخضر</option>
                    <option value="purple">بنفسجي</option>
                    <option value="rose">أحمر</option>
                    <option value="orange">برتقالي</option>
                    <option value="slate">رمادي</option>
                  </select>
                  <div className={`w-12 h-12 rounded-xl ${colorMap[formData.color]?.bg || 'bg-blue-500'} border border-slate-200 dark:border-white/10 shrink-0`}></div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              form="warehouse-form"
              className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {initialData ? 'حفظ التعديلات' : 'إضافة المخزن'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function TransferModal({ isOpen, onClose, onSuccess, sourceWarehouse, warehouses }: { isOpen: boolean, onClose: () => void, onSuccess?: () => void, sourceWarehouse: any, warehouses: any[] }) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (isOpen && sourceWarehouse) {
      fetchItems();
      setSelectedItem('');
      setTargetWarehouse('');
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen, sourceWarehouse]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      let endpoint = '';
      
      if (sourceWarehouse.type === 'devices') endpoint = 'Devices';
      else if (sourceWarehouse.type === 'accessories') endpoint = 'Accessories';
      else if (sourceWarehouse.type === 'spare_parts') endpoint = 'spare_parts'; // fixed table name
      else return;

      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${endpoint}?select=*&warehouse_id=eq.${sourceWarehouse.id}`, { // Only show items in source warehouse
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch items for transfer', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedItem || !targetWarehouse) return;
    
    setIsTransferring(true);
    try {
      const token = localStorage.getItem('access_token');
      let endpoint = '';
      
      if (sourceWarehouse.type === 'devices') endpoint = 'Devices';
      else if (sourceWarehouse.type === 'accessories') endpoint = 'Accessories';
      else if (sourceWarehouse.type === 'spare_parts') endpoint = 'spare_parts';

      const targetW = warehouses.find(w => String(w.id) === String(targetWarehouse));
      const itemToTransfer = items.find(i => String(i.id) === String(selectedItem));

      if (!itemToTransfer) throw new Error('المنتج غير موجود');

      const headers = {
        'apikey': API_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      if (sourceWarehouse.type === 'devices') {
        const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${endpoint}?id=eq.${selectedItem}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            warehouse_id: targetWarehouse,
            notes: notes ? `[تم التحويل إلى: ${targetW?.name}] ${notes}\n${itemToTransfer.notes || ''}` : itemToTransfer.notes
          })
        });

        if (!response.ok) throw new Error('فشل التحويل');
      } else {
        if (quantity <= 0 || quantity > (itemToTransfer.quantity || 1)) {
           throw new Error('الكمية المحددة غير صحيحة');
        }

        if (quantity === itemToTransfer.quantity) {
          const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${endpoint}?id=eq.${selectedItem}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              warehouse_id: targetWarehouse,
              notes: notes ? `[تم التحويل بالكامل إلى: ${targetW?.name}]\n${notes}\n${itemToTransfer.notes || ''}` : itemToTransfer.notes
            })
          });
          if (!response.ok) throw new Error('فشل التحويل');
        } else {
          const { id, created_at, ...itemDetails } = itemToTransfer;
          const newItem = {
            ...itemDetails,
            quantity: quantity,
            warehouse_id: targetWarehouse,
            user_id: localStorage.getItem('user_id'),
            notes: notes ? `[جزء محول من المخزن: ${sourceWarehouse.name}]\n${notes}\n${itemToTransfer.notes || ''}` : itemToTransfer.notes
          };
          
          const insertRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newItem)
          });

          if (!insertRes.ok) throw new Error('فشل إضافة الكمية الجديدة المخزن الوجهة');

          const remainingQuantity = itemToTransfer.quantity - quantity;
          const updateRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${endpoint}?id=eq.${selectedItem}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ quantity: remainingQuantity })
          });

          if (!updateRes.ok) throw new Error('فشل خصم الكمية من المخزن المصدر');
        }
      }
      
      alert('تم التحويل بنجاح!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'حدث خطأ أثناء التحويل. تأكد من صلاحيات قاعدة البيانات.');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isOpen || !sourceWarehouse) return null;

  // Filter warehouses to only show those of the same type, excluding the source warehouse
  const compatibleWarehouses = warehouses.filter(w => w.type === sourceWarehouse.type && w.id !== sourceWarehouse.id);

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(searchLower)) ||
      (item.model && item.model.toLowerCase().includes(searchLower)) ||
      (item.company && item.company.toLowerCase().includes(searchLower)) ||
      (item.id && item.id.toString().includes(searchLower))
    );
  });

  const selectedItemObj = items.find(i => String(i.id) === String(selectedItem));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:pr-72" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-50 dark:bg-[#080c13]/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">تحويل من: {sourceWarehouse.name}</h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 flex gap-3 items-center">
              <span className="text-xl">🔄</span>
              <p className="text-sm text-cyan-200">اختر الصنف والكمية المراد تحويلها للمخزن الوجهة</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">المخزن الوجهة *</label>
              <select 
                required
                value={targetWarehouse}
                onChange={e => setTargetWarehouse(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value="">اختر المخزن الوجهة...</option>
                {compatibleWarehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}{w.branchName ? ` (${w.branchName})` : ''}</option>
                ))}
              </select>
              {compatibleWarehouses.length === 0 && (
                <p className="text-xs text-rose-400 mt-1">لا يوجد مخازن أخرى من نفس النوع (نوع المخزن: {sourceWarehouse.type})</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الصنف *</label>
              <div className="relative mb-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن الصنف داخل هذا المخزن..."
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                />
                <div className="absolute inset-y-0 end-0 pe-4 flex items-center pointer-events-none text-xl">
                  🔍
                </div>
              </div>
              <select 
                required
                value={selectedItem}
                onChange={e => setSelectedItem(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value="">اختر الصنف...</option>
                {isLoading ? (
                  <option disabled>جاري التحميل...</option>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name || item.model || `صنف #${item.id}`} {item.company ? `(${item.company})` : ''} - (المتاح: {item.quantity || 1})
                    </option>
                  ))
                ) : (
                  <option disabled>لا يوجد أصناف في هذا المخزن مطابقة لبحثك</option>
                )}
              </select>
            </div>

            {sourceWarehouse.type !== 'devices' && selectedItemObj && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الكمية المراد تحويلها *</label>
                <input 
                  type="number"
                  min="1"
                  max={selectedItemObj.quantity || 1}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات التحويل</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ملاحظات التحويل (اختياري)"
                rows={3}
                className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button 
              onClick={handleTransfer}
              disabled={compatibleWarehouses.length === 0 || !selectedItem || !targetWarehouse || isTransferring}
              className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isTransferring && <Loader2 className="w-4 h-4 animate-spin" />}
              تنفيذ التحويل
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
