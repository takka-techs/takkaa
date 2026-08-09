import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, Plus, FileText, CheckCircle, Clock, 
  Search, ArrowRight, Save, X, Loader2, Play
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

import { useBranchPermissions } from '../hooks/useBranchPermissions';
import { useBranch } from '../contexts/BranchContext';

const INVENTORIES_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/store_inventories';
const INVENTORY_ITEMS_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/store_inventory_items';
const WAREHOUSES_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function Inventory({ onNavigate }: { onNavigate: (view: string, data?: any) => void }) {
  const { canManageInventory } = useBranchPermissions();
  const [inventories, setInventories] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeInventory, setActiveInventory] = useState<any>(null); // If set, we are viewing/editing an inventory

  // New Inventory Form State
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchInventories();
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      let url = `${WAREHOUSES_URL}?select=id,name`;
      if (activeBranchId) url += `&branch_id=eq.${activeBranchId}`;
      else if (tenantId) url += `&tenant_id=eq.${tenantId}`;
      
      const res = await fetch(url, {
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInventories = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`${INVENTORIES_URL}?select=*,Warehouses(name)&order=created_at.desc`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setInventories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      const takkaActiveBranchId = localStorage.getItem('takka_active_branch_id');

      // 1. Create the inventory session
      const invPayload = {
        name: newTitle,
        warehouse_id: null, // No primary warehouse anymore
        status: 'draft',
        user_id: userId,
        tenant_id: tenantId,
        ...(takkaActiveBranchId ? { branch_id: takkaActiveBranchId } : {})
      };

      const res = await fetch(INVENTORIES_URL, {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(invPayload)
      });
      if (!res.ok) throw new Error('Failed to create inventory');
      const createdInv = (await res.json())[0];

      // Note: We no longer fetch all items here.
      // Items will be added dynamically inside the InventorySession when a warehouse is selected.

      setIsNewModalOpen(false);
      setNewTitle('');
      fetchInventories();
      setActiveInventory(createdInv);
      
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء بدء الجرد');
    } finally {
      setIsLoading(false);
    }
  };

  if (activeInventory) {
    return <InventorySession 
             inventory={activeInventory} 
             onClose={() => { setActiveInventory(null); fetchInventories(); }} 
           />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('warehouses')}
            className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
            <ClipboardList className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">جرد المخازن</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">سجلات مطابقة المخزون والعهد</p>
          </div>
        </div>

        {canManageInventory && (
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-4 h-4" /> جرد جديد
          </button>
        )}
      </div>

      {/* Inventories List */}
      <div className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
             <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : inventories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
             <FileText className="w-16 h-16 mb-4 opacity-20" />
             <p className="text-lg font-bold text-slate-600 dark:text-slate-300">لا يوجد سجلات جرد حالياً</p>
             <p className="text-sm mt-1">قم بإنشاء جرد جديد للبدء بمطابقة المخزون</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4 rounded-tr-xl">اسم الجرد / المرجع</th>
                  <th className="px-6 py-4">المخزن</th>
                  <th className="px-6 py-4">تاريخ الإنشاء</th>
                  <th className="px-6 py-4">تاريخ الانتهاء</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-left rounded-tl-xl">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {inventories.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{inv.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">ID: {inv.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                        {inv.Warehouses?.name || 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {format(new Date(inv.created_at), 'yyyy/MM/dd hh:mm a', { locale: ar })}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {inv.completed_at ? format(new Date(inv.completed_at), 'yyyy/MM/dd', { locale: ar }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {inv.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500">
                          <CheckCircle className="w-3.5 h-3.5" /> مكتمل
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                          <Clock className="w-3.5 h-3.5" /> مسودة (قيد العمل)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button 
                        onClick={() => setActiveInventory(inv)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          inv.status === 'completed' 
                            ? 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        }`}
                      >
                        {inv.status === 'completed' ? 'عرض التقرير' : 'استكمال الجرد'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsNewModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">بدء جرد جديد</h2>
                <button onClick={() => setIsNewModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateInventory} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">اسم/مرجع الجرد</label>
                  <input 
                    type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="مثال: جرد الربع الأول 2026 - المخزن الرئيسي"
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="pt-4">
                   <button 
                     type="submit" disabled={isLoading || !newTitle}
                     className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                   >
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                     بدء سجل الجرد
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------
// Sub-Component: Inventory Session (The actual checking tool)
// ---------------------------------------------------------
function InventorySession({ inventory, onClose }: { inventory: any, onClose: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchSelectedWarehouses();
  }, [inventory]);

  const fetchSelectedWarehouses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      let url = `${WAREHOUSES_URL}?select=id,name`;
      if (activeBranchId) url += `&branch_id=eq.${activeBranchId}`;
      else if (tenantId) url += `&tenant_id=eq.${tenantId}`;
      
      const res = await fetch(url, {
        headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Add a virtual warehouse for items with no assigned warehouse
        data.push({ id: 'NONE', name: 'غير مسند لمخزن (موجود بالفرع)' });
        setWarehouses(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const syncWarehouseItems = async (warehouseId: string) => {
    setIsAddingWarehouse(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      // Check if we already have items for this warehouse in the inventory
      // We rely on the `notes` column containing the warehouse_id
      const existingRes = await fetch(`${INVENTORY_ITEMS_URL}?inventory_id=eq.${inventory.id}&notes=eq.${warehouseId}&limit=1`, {
         headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` }
      });
      const existing = await existingRes.json();
      
      if (existing.length > 0) {
        // Already added
        setActiveWarehouseId(warehouseId);
        setIsAddingWarehouse(false);
        return;
      }

      // Fetch items from the chosen warehouse
      const warehouseFilter = warehouseId === 'NONE' ? `warehouse_id=is.null` : `warehouse_id=eq.${warehouseId}`;

      const [devRes, accRes, spRes] = await Promise.all([
        fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices?select=*&${warehouseFilter}&limit=10000`, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` } }),
        fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?select=id,name,quantity,cost_price&${warehouseFilter}&limit=10000`, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` } }),
        fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/spare_parts?select=id,name,quantity,cost_price&${warehouseFilter}&limit=10000`, { headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` } })
      ]);

      const devices = devRes.ok ? await devRes.json() : [];
      const accessories = accRes.ok ? await accRes.json() : [];
      const spareParts = spRes.ok ? await spRes.json() : [];

      const itemsPayload: any[] = [];

      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      const takkaActiveBranchId = localStorage.getItem('takka_active_branch_id');

      // Filter Devices to exclude sold ones
      const availableDevices = devices.filter((d: any) => {
        if (!d.status) return true; // Include null or undefined status
        const s = String(d.status).toLowerCase();
        return !s.includes('sold') && !s.includes('مباع') && !s.includes('installment');
      });

      availableDevices.forEach((d: any) => {
        itemsPayload.push({
          tenant_id: tenantId,
          ...(takkaActiveBranchId ? { branch_id: takkaActiveBranchId } : {}),
          inventory_id: inventory.id,
          item_type: 'devices',
          item_id: String(d.id),
          item_name: `${d.company || ''} ${d.model || ''} ${d.color || ''} ${d.storage || ''} ${d.ram ? d.ram+'GB' : ''}`.trim().replace(/\s+/g, ' ') || 'جهاز بدون اسم',
          expected_quantity: 1, 
          actual_quantity: 0,
          cost_price: d.cost_price || 0,
          notes: warehouseId // SToring warehouse in notes so we can filter later!
        });
      });

      accessories.forEach((a: any) => {
        itemsPayload.push({
          tenant_id: tenantId,
          ...(takkaActiveBranchId ? { branch_id: takkaActiveBranchId } : {}),
          inventory_id: inventory.id,
          item_type: 'accessories',
          item_id: String(a.id),
          item_name: a.name || 'إكسسوار غير معروف',
          expected_quantity: a.quantity || 0,
          actual_quantity: 0,
          cost_price: a.cost_price || 0,
          notes: warehouseId
        });
      });

      spareParts.forEach((s: any) => {
        itemsPayload.push({
          tenant_id: tenantId,
          ...(takkaActiveBranchId ? { branch_id: takkaActiveBranchId } : {}),
          inventory_id: inventory.id,
          item_type: 'spare_parts',
          item_id: String(s.id),
          item_name: s.name || 'قطعة غيار غير معروفة',
          expected_quantity: s.quantity || 0,
          actual_quantity: 0,
          cost_price: s.cost_price || 0,
          notes: warehouseId
        });
      });

      if (itemsPayload.length === 0) {
        itemsPayload.push({
          tenant_id: tenantId,
          ...(takkaActiveBranchId ? { branch_id: takkaActiveBranchId } : {}),
          inventory_id: inventory.id,
          item_type: 'devices',
          item_id: 'empty_' + warehouseId,
          item_name: 'المخزن فارغ (لا يوجد أصناف)',
          expected_quantity: 0,
          actual_quantity: 0,
          cost_price: 0,
          notes: warehouseId
        });
      }

      if (itemsPayload.length > 0) {
        const invRes = await fetch(INVENTORY_ITEMS_URL, {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(itemsPayload)
        });
        
        if (!invRes.ok) {
          const errText = await invRes.text();
          console.error("Failed to insert inventory items:", errText);
          if (errText.includes('row-level security')) {
            alert('خطأ في الصلاحيات (RLS): لا توجد صلاحية لإضافة أصناف الجرد. يجب تشغيل السكربت المرفق في قاعدة البيانات لحل هذه المشكلة.');
          } else {
            alert('حدث خطأ أثناء إضافة الأصناف إلى الجرد: ' + errText);
          }
          setIsAddingWarehouse(false);
          return;
        }
      }

      await fetchItems();
      setActiveWarehouseId(warehouseId);

    } catch (e) {
      console.error(e);
      alert('خطأ أثناء جلب أصناف هذا المخزن');
    } finally {
      setIsAddingWarehouse(false);
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${INVENTORY_ITEMS_URL}?inventory_id=eq.${inventory.id}&order=item_name.asc&limit=10000`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemQty = async (itemId: string, newQty: number) => {
    // Optimistic Update
    setItems(items.map(i => i.id === itemId ? { ...i, actual_quantity: newQty } : i));
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${INVENTORY_ITEMS_URL}?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actual_quantity: newQty })
      });
    } catch (e) {
      console.error(e);
      // Revert if error
      fetchItems();
    }
  };

  const handleComplete = async () => {
    setIsConfirming(false);
    try {
      const token = localStorage.getItem('access_token');
      
      // Update actual quantities in original tables
      const updatePromises = items.map(async (item) => {
        if (item.item_id.startsWith('empty_')) return;
        if (item.actual_quantity !== item.expected_quantity) {
           let endpoint = '';
           let body: any = {};
           if (item.item_type === 'devices') {
              endpoint = 'Devices';
              body = { status: item.actual_quantity === 0 ? 'مفقود' : 'available' }; // Devices doesn't have quantity, we mark lost devices
           } else if (item.item_type === 'accessories') {
              endpoint = 'Accessories';
              body = { quantity: item.actual_quantity };
           } else if (item.item_type === 'spare_parts') {
              endpoint = 'spare_parts';
              body = { quantity: item.actual_quantity };
           }

           if (endpoint) {
             const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${endpoint}?id=eq.${item.item_id}`, {
               method: 'PATCH',
               headers: {
                 'apikey': API_KEY,
                 'Authorization': `Bearer ${token}`,
                 'Content-Type': 'application/json',
                 'Prefer': 'return=minimal'
               },
               body: JSON.stringify(body)
             });
             if (!res.ok) {
                 console.error(`Failed to update item ${item.item_name}`);
             }
           }
        }
      });
      
      await Promise.all(updatePromises);

      const statusRes = await fetch(`${INVENTORIES_URL}?id=eq.${inventory.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString() })
      });
      
      if (!statusRes.ok) throw new Error('فشل في إنهاء سجل الجرد');

      alert('تم اعتماد الجرد وتحديث الكميات بالمخازن بنجاح!');
      onClose();
    } catch (e) {
      console.error(e);
      alert('خطأ أثناء إغلاق الجرد واعتماد الكميات');
    }
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = i.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || i.item_type === filterType;
    const matchesWarehouse = activeWarehouseId === 'all' || i.notes === activeWarehouseId;
    return matchesSearch && matchesFilter && matchesWarehouse;
  });

  const activeItems = items.filter(i => activeWarehouseId === 'all' || i.notes === activeWarehouseId);
  const totalExpected = activeItems.reduce((sum, i) => sum + (i.expected_quantity || 0), 0);
  const totalActual = activeItems.reduce((sum, i) => sum + (i.actual_quantity || 0), 0);
  const totalDiff = totalActual - totalExpected;

  // Find added warehouses to show in filter (by checking unique 'notes')
  const addedWarehouseIds = Array.from(new Set(items.map(i => i.notes).filter(Boolean)));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <h1 className="text-xl font-bold text-slate-900 dark:text-white">{inventory.name}</h1>
               {inventory.status === 'completed' && <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-0.5 rounded-full font-bold">مكتمل</span>}
            </div>
            <p className="text-sm text-slate-500">عدد الأصناف في الجرد: {items.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {inventory.status === 'draft' && (
            <button 
              onClick={() => setIsConfirming(true)}
              className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> إنهاء الجرد واعتماد الكميات
            </button>
          )}
        </div>
      </div>

      {/* Warehouse Selector (Dynamic Loading) */}
      {inventory.status === 'draft' && (
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-200/50 dark:border-blue-500/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              إضافة مخزن للجرد
            </h3>
            <p className="text-sm text-slate-500">اختر المخزن لجلب وتقييد أصنافه في هذا الجرد.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <select 
                className="w-full sm:w-64 bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm appearance-none outline-none focus:border-blue-500"
                onChange={(e) => {
                  if (e.target.value) syncWarehouseItems(e.target.value);
                  e.target.value = ''; // reset immediately
                }}
                disabled={isAddingWarehouse}
             >
                <option value="">-- اختر المخزن لإضافته --</option>
                {warehouses.filter(w => !addedWarehouseIds.includes(w.id)).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
             </select>
             {isAddingWarehouse && <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />}
          </div>
        </div>
      )}

      {/* Tabs for added warehouses */}
      {addedWarehouseIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button 
             onClick={() => setActiveWarehouseId('all')}
             className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
               activeWarehouseId === 'all' 
                 ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                 : 'bg-white dark:bg-[#11151c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
             }`}
          >
            تفاصيل كل المخازن المضافة
          </button>
          
          {addedWarehouseIds.map(wId => {
             const w = warehouses.find(wh => wh.id == wId);
             if (!w) return null;
             return (
               <button 
                 key={w.id}
                 onClick={() => setActiveWarehouseId(w.id)}
                 className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                   activeWarehouseId === w.id 
                     ? 'bg-blue-600 text-white shadow-md' 
                     : 'bg-white dark:bg-[#11151c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                 }`}
               >
                 جرد: {w.name}
               </button>
             );
          })}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#11151c] p-5 rounded-2xl border border-slate-200 dark:border-white/10">
           <div className="text-sm text-slate-500 mb-1">الكمية الدفترية (النظام)</div>
           <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalExpected}</div>
        </div>
        <div className="bg-white dark:bg-[#11151c] p-5 rounded-2xl border border-slate-200 dark:border-white/10">
           <div className="text-sm text-slate-500 mb-1">الكمية الفعلية (الجرد)</div>
           <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalActual}</div>
        </div>
        <div className={`p-5 rounded-2xl border ${totalDiff === 0 ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10' : totalDiff > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
           <div className={`text-sm mb-1 ${totalDiff === 0 ? 'text-slate-500' : totalDiff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>الفروقات</div>
           <div className={`text-2xl font-bold ${totalDiff === 0 ? 'text-slate-900 dark:text-white' : totalDiff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
             {totalDiff > 0 ? '+' : ''}{totalDiff}
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-[#11151c] p-4 rounded-2xl border border-slate-200 dark:border-white/10">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute top-1/2 start-3 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="البحث باسم الصنف..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#080c13] border border-transparent focus:border-emerald-500 rounded-xl py-2.5 ps-10 pe-4 text-sm outline-none transition-all"
          />
        </div>
        <select 
          value={filterType} onChange={e => setFilterType(e.target.value)}
          className="w-full sm:w-48 bg-slate-50 dark:bg-[#080c13] border border-transparent focus:border-emerald-500 rounded-xl py-2.5 px-4 text-sm outline-none transition-all appearance-none"
        >
          <option value="all">كل الأقسام</option>
          <option value="devices">الأجهزة</option>
          <option value="accessories">الإكسسوارات</option>
          <option value="spare_parts">قطع الغيار</option>
        </select>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-4 rounded-tr-xl">اسم الصنف</th>
                  <th className="px-6 py-4">القسم</th>
                  <th className="px-6 py-4 text-center">الكمية المسجلة</th>
                  <th className="px-6 py-4 text-center">الكمية الفعلية</th>
                  <th className="px-6 py-4 text-center rounded-tl-xl">الفرق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {filteredItems.map(item => {
                  const diff = (item.actual_quantity || 0) - (item.expected_quantity || 0);
                  const isCompleted = inventory.status === 'completed';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{item.item_name}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300">
                          {item.item_type === 'devices' ? 'أجهزة' : item.item_type === 'accessories' ? 'إكسسوارات' : 'قطع غيار'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-mono text-lg">{item.expected_quantity}</td>
                      <td className="px-6 py-4 text-center">
                        {isCompleted ? (
                           <span className="font-bold font-mono text-lg text-slate-900 dark:text-white">{item.actual_quantity}</span>
                        ) : (
                          <input 
                            type="number"
                            value={item.actual_quantity}
                            onChange={e => updateItemQty(item.id, Number(e.target.value))}
                            className="w-20 text-center bg-slate-100 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 focus:border-emerald-500 outline-none font-mono text-lg font-bold mx-auto block disabled:opacity-50"
                            min="0"
                            disabled={item.item_id.startsWith('empty_')}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-mono text-lg font-bold ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirming && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsConfirming(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                  تأكيد اعتماد الجرد
                </h2>
                <button onClick={() => setIsConfirming(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
                اعتماد هذا الجرد سيقوم بتحديث الكميات أو الحالة في المخازن بشكل فعلي.<br /><br />
                <span className="text-rose-500 font-bold">تنبيه: هل أنت متأكد من الاعتماد وإنهاء الجرد؟ لا يمكن التراجع بعد هذه الخطوة.</span>
              </p>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleComplete}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  نعم، متأكد
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
