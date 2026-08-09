// import React, { useState, useEffect } from 'react';
// import { motion } from 'motion/react';
// import { 
//   Search, Filter, Plus, FileText, Download, Upload, 
//   Printer, Trash2, Edit, Eye, DollarSign, Headphones, 
//   Barcode, AlertCircle, LayoutGrid, ChevronDown, 
//   RotateCcw, Layers, Loader2, PackagePlus, Activity, ArrowUpDown, ArrowRightLeft,
//   ChevronLeft, ChevronRight
// } from 'lucide-react';
// import * as XLSX from 'xlsx';

// import AddAccessoryModal from './AddAccessoryModal';
// import AddAccessoryQuantityModal from './AddAccessoryQuantityModal';
// import ViewAccessoryModal from './ViewAccessoryModal';
// import EditAccessoryModal from './EditAccessoryModal';
// import DeleteAccessoryModal from './DeleteAccessoryModal';
// import ImportAccessoriesExcelModal from './ImportAccessoriesExcelModal';
// import TransferItemModal from './TransferItemModal';
// import { PrintBarcodeModal } from './PrintBarcodeModal';

// export default function Accessories({ warehouse }: { warehouse?: any }) {
//   const [accessories, setAccessories] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedItems, setSelectedItems] = useState<number[]>([]);
//   const [resolvedWarehouseId, setResolvedWarehouseId] = useState<string | null>(warehouse?.id || null);

//   // Modal states
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isAddQuantityModalOpen, setIsAddQuantityModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isImportModalOpen, setIsImportModalOpen] = useState(false);
//   const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  
//   const [selectedAccessory, setSelectedAccessory] = useState<any>(null);
//   const [transferAccessory, setTransferAccessory] = useState<any>(null);
//   const [selectedAccessoryIdForQuantity, setSelectedAccessoryIdForQuantity] = useState<number | null>(null);

//   // Filters state
//   const [filters, setFilters] = useState({
//     category: '',
//     status: '',
//     quantity: ''
//   });

//   const [currentPage, setCurrentPage] = React.useState(1);
//   const [itemsPerPage, setItemsPerPage] = React.useState(50);
//   const totalPages = 1;

//   React.useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, filters]);

//   useEffect(() => {
//     resolveAndFetch();
//   }, [warehouse]);

//   const resolveAndFetch = async () => {
//     setIsLoading(true);
//     try {
//       let targetWarehouseId = warehouse?.id;
//       const token = localStorage.getItem('access_token');
//       const userId = localStorage.getItem('user_id');

//       if (!targetWarehouseId) {
//         const activeBranchId = localStorage.getItem("takka_active_branch_id");
//         if (!activeBranchId || activeBranchId === 'ALL') {
//            targetWarehouseId = 'ALL';
//            setResolvedWarehouseId('ALL');
//         } else {
//           // Find default accessories warehouse
//           let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.accessories&is_default=eq.true&branch_id=eq.${activeBranchId}`;
//           let whRes = await fetch(url, {
//             headers: {
//               'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
//               'Authorization': `Bearer ${token}`
//             }
//           });
//           let whData = await whRes.json();
  
//           // If no default is found explicitly, pick FIRST warehouse safely
//           if (!Array.isArray(whData) || whData.length === 0) {
//              let url2 = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.accessories&branch_id=eq.${activeBranchId}&order=created_at.asc&limit=1`;
//              whRes = await fetch(url2, {
//                headers: {
//                  'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
//                  'Authorization': `Bearer ${token}`
//                }
//              });
//              whData = await whRes.json();
//           }
  
//           if (Array.isArray(whData) && whData.length > 0) {
//             targetWarehouseId = whData[0].id;
//             setResolvedWarehouseId(targetWarehouseId);
//           } else {
//             targetWarehouseId = 'ALL';
//             setResolvedWarehouseId('ALL');
//           }
//         }
//       }

//       // Auto-fix null warehouse items for this target warehouse
//       if (targetWarehouseId && targetWarehouseId !== 'NONE' && targetWarehouseId !== 'ALL') {
//         try {
//           const activeBranchId = localStorage.getItem("takka_active_branch_id");
//           let patchUrl = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?warehouse_id=is.null`;
//           if (activeBranchId && activeBranchId !== 'ALL') {
//              patchUrl += `&branch_id=eq.${activeBranchId}`;
//           }
//           await fetch(patchUrl, {
//             method: 'PATCH',
//             headers: {
//               'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json',
//               'Prefer': 'return=minimal'
//             },
//             body: JSON.stringify({ warehouse_id: targetWarehouseId })
//           });
//         } catch (patchErr) {
//           console.error('Failed to patch null warehouse accessories');
//         }
//       }

//       await fetchAccessories(targetWarehouseId);
//     } catch (err: any) {
//       setError('فشل تجهيز بيانات المخزن');
//       setIsLoading(false);
//     }
//   };

//   const fetchAccessories = async (warehouseId: string | null) => {
//     setIsLoading(true);
//     setError('');
//     try {
//       if (warehouseId === 'NONE') {
//          setAccessories([]);
//          setIsLoading(false);
//          return;
//       }
//       const token = localStorage.getItem('access_token');
//       const userId = localStorage.getItem('user_id');
//       const tenantId = localStorage.getItem('tenant_id') || userId;
//       const activeBranchId = localStorage.getItem("takka_active_branch_id");
//       let url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?select=*,branches(name)';
      
//       if (warehouseId === 'ALL') {
//         url += `&tenant_id=eq.${tenantId}`;
//         if (activeBranchId && activeBranchId !== 'ALL') {
//           url += `&branch_id=eq.${activeBranchId}`;
//         }
//       } else if (warehouseId) {
//         url += `&warehouse_id=eq.${warehouseId}`;
//       }
      
//       const response = await fetch(url, {
//         headers: {
//           'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
//           'Authorization': `Bearer ${token}`
//         }
//       });
      
//       if (!response.ok) {
//         throw new Error('فشل جلب بيانات الإكسسوارات');
//       }
      
//       const data = await response.json();
//       setAccessories(data);
//     } catch (err: any) {
//       setError(err.message || 'حدث خطأ غير متوقع');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFilters(prev => ({ ...prev, [name]: value }));
//   };

//   const resetFilters = () => {
//     setFilters({ category: '', status: '', quantity: '' });
//     setSearchTerm('');
//   };

//   // Apply filters
//   const filteredAccessories = accessories.filter(item => {
//     const matchSearch = searchTerm === '' || 
//       (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
      
//     const matchCategory = filters.category === '' || filters.category === 'كل الفئات' || item.category === filters.category;
//     const matchStatus = filters.status === '' || filters.status === 'كل الحالات' || item.status === filters.status;
    
//     let matchQuantity = true;
//     if (filters.quantity === 'منخفض') matchQuantity = item.quantity <= (item.alert_quantity || 5);
//     else if (filters.quantity === 'متوفر') matchQuantity = item.quantity > (item.alert_quantity || 5);
//     else if (filters.quantity === 'نفذ') matchQuantity = item.quantity === 0;

//     return matchSearch && matchCategory && matchStatus && matchQuantity;
//   });

//   // Calculate stats based on filtered accessories
//   const displayedCount = filteredAccessories.length;

//   // Apply pagination
//   const paginatedAccessories = filteredAccessories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const totalPieces = filteredAccessories.reduce((acc, item) => acc + (item.quantity || 0), 0);
//   const totalCost = filteredAccessories.reduce((acc, item) => acc + ((item.cost_price || 0) * (item.quantity || 0)), 0);
//   const totalExpectedSales = filteredAccessories.reduce((acc, item) => acc + ((item.selling_price || 0) * (item.quantity || 0)), 0);

//   const toggleSelectAll = () => {
//     if (selectedItems.length === filteredAccessories.length) {
//       setSelectedItems([]);
//     } else {
//       setSelectedItems(filteredAccessories.map(i => i.id));
//     }
//   };

//   const toggleSelectItem = (id: number) => {
//     if (selectedItems.includes(id)) {
//       setSelectedItems(selectedItems.filter(itemId => itemId !== id));
//     } else {
//       setSelectedItems([...selectedItems, id]);
//     }
//   };

//   const handleExport = () => {
//     const exportData = filteredAccessories.map(item => ({
//       'الباركود': item.barcode || '',
//       'اسم الصنف': item.name || '',
//       'التصنيف': item.category || '',
//       'الفرع': item.branches?.name || 'الافتراضي',
//       'سعر الشراء': item.cost_price || 0,
//       'سعر البيع': item.selling_price || 0,
//       'الكمية': item.quantity || 0,
//       'حد التنبيه': item.alert_quantity || 0,
//       'الحالة': item.status || '',
//       'ملاحظات': item.notes || ''
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(exportData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "الإكسسوارات");
    
//     XLSX.writeFile(workbook, "accessories_export.xlsx");
//   };

//   // Extract unique categories for filter
//   const categories = Array.from(new Set(accessories.map(a => a.category).filter(Boolean)));

//   const formatDate = (dateString: string) => {
//     if (!dateString) return '-';
//     const date = new Date(dateString);
//     return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
//   };

//   return (
//     <motion.div 
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="space-y-6" 
//       dir="rtl"
//     >
//       {/* Page Header */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden">
//         <div className="absolute top-0 end-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
//         <div className="relative z-10 flex items-center gap-4">
//           <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
//             <Headphones className="w-7 h-7 text-white" />
//           </div>
//           <div>
//             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
//               {warehouse ? warehouse.name : 'مخزون الإكسسوارات'}
//             </h2>
//             <p className="text-sm text-slate-500 dark:text-slate-400">
//               {warehouse ? (warehouse.description || 'إدارة وتتبع الإكسسوارات في هذا المخزن') : 'إدارة وتتبع جميع الإكسسوارات في المخزن الافتراضي'}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Header Stats */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//           className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-blue-500/30 transition-colors"
//         >
//           <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
//             <LayoutGrid className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" /> الأصناف المعروضة
//           </p>
//           <h3 className="text-2xl font-bold text-blue-400 tracking-wider">
//             {displayedCount.toLocaleString('ar-EG')}
//           </h3>
//         </motion.div>
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//           className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
//         >
//           <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
//             <PackagePlus className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" /> إجمالي القطع
//           </p>
//           <h3 className="text-2xl font-bold text-emerald-400 tracking-wider">
//             {totalPieces.toLocaleString('ar-EG')}
//           </h3>
//         </motion.div>
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//           className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-purple-500/30 transition-colors"
//         >
//           <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
//             <DollarSign className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" /> قيمة التكلفة
//           </p>
//           <h3 className="text-2xl font-bold text-purple-400 tracking-wider">
//             {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//           </h3>
//         </motion.div>
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.4 }}
//           className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-slate-400/30 transition-colors"
//         >
//           <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
//             <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" /> قيمة البيع المتوقعة
//           </p>
//           <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wider">
//             {totalExpectedSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//           </h3>
//         </motion.div>
//       </div>

//       {/* Filters & Actions Bar */}
//       <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 justify-between items-center">
//         {/* Search and Filters */}
//         <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
//           <div className="relative flex-1 min-w-[200px]">
//             <Search className="w-4 h-4 text-blue-400 absolute top-1/2 start-3 -translate-y-1/2" />
//             <input 
//               type="text" 
//               placeholder="بحث بالاسم أو الباركود..." 
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
//             />
//             {searchTerm && (
//               <button onClick={() => setSearchTerm('')} className="absolute top-1/2 end-3 -translate-y-1/2 text-slate-500 hover:text-slate-600 dark:text-slate-300">
//                 &times;
//               </button>
//             )}
//           </div>
          
//           <div className="relative min-w-[140px]">
//             <select 
//               name="category"
//               value={filters.category}
//               onChange={handleFilterChange}
//               className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
//             >
//               <option value="">كل الفئات</option>
//               {categories.map((cat, idx) => (
//                 <option key={idx} value={cat}>{cat}</option>
//               ))}
//             </select>
//             <ChevronDown className="w-4 h-4 text-slate-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
//           </div>

//           <div className="relative min-w-[140px]">
//             <select 
//               name="status"
//               value={filters.status}
//               onChange={handleFilterChange}
//               className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
//             >
//               <option value="">كل الحالات</option>
//               <option value="Available">متاح</option>
//               <option value="Out of Stock">نفذ</option>
//             </select>
//             <ChevronDown className="w-4 h-4 text-slate-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
//           </div>

//           <div className="relative min-w-[140px]">
//             <select 
//               name="quantity"
//               value={filters.quantity}
//               onChange={handleFilterChange}
//               className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
//             >
//               <option value="">كل الكميات</option>
//               <option value="متوفر">متوفر</option>
//               <option value="منخفض">منخفض</option>
//               <option value="نفذ">نفذ</option>
//             </select>
//             <ChevronDown className="w-4 h-4 text-slate-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
//           </div>

//           {(searchTerm || filters.category || filters.status || filters.quantity) && (
//             <button 
//               onClick={resetFilters}
//               className="p-2.5 bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 transition-colors"
//               title="إلغاء الفلاتر"
//             >
//               <span className="text-lg leading-none">&times;</span>
//             </button>
//           )}
//         </div>

//         {/* Actions */}
//         <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
//           <button 
//             onClick={() => setIsImportModalOpen(true)}
//             className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-cyan-500/20"
//           >
//             <Upload className="w-4 h-4" /> استيراد
//           </button>
//           <button 
//             onClick={handleExport} 
//             className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-cyan-500/20"
//           >
//             <Download className="w-4 h-4" /> تصدير
//           </button>
//           <button 
//             onClick={() => {
//               setSelectedAccessoryIdForQuantity(null);
//               setIsAddQuantityModalOpen(true);
//             }}
//             className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 border border-orange-500/20"
//           >
//             <PackagePlus className="w-4 h-4" /> إضافة كمية
//           </button>
//           <button 
//             onClick={() => setIsAddModalOpen(true)}
//             className="bg-cyan-500 hover:bg-cyan-400 text-[#080c13] px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
//           >
//             <Plus className="w-4 h-4" /> إضافة صنف
//           </button>
//         </div>
//       </div>

//       {/* Table Area */}
//       <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col overflow-hidden relative min-h-[400px]">
//         {isLoading && (
//           <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#11151c]/50 backdrop-blur-sm z-20">
//             <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
//           </div>
//         )}
        
//         {error && !isLoading && (
//           <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#11151c]/50 backdrop-blur-sm z-20">
//             <div className="text-center text-red-400">
//               <AlertCircle className="w-8 h-8 mx-auto mb-2" />
//               <p>{error}</p>
//               <button onClick={() => fetchAccessories(resolvedWarehouseId)} className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-sm transition-colors">
//                 إعادة المحاولة
//               </button>
//             </div>
//           </div>
//         )}

//         <div className="flex-1 overflow-x-auto custom-scrollbar">
//           <table className="w-full text-sm text-right">
//             <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#080c13]/50 border-b border-slate-200 dark:border-white/5">
//               <tr>
//                 <th className="p-4 w-10">
//                   <input 
//                     type="checkbox" 
//                     checked={selectedItems.length === filteredAccessories.length && filteredAccessories.length > 0}
//                     onChange={toggleSelectAll}
//                     className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080c13] text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0"
//                   />
//                 </th>
//                 <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
//                   <div className="flex items-center gap-1">الباركود <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
//                 </th>
//                 <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
//                   <div className="flex items-center gap-1">اسم الصنف <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
//                 </th>
//                 <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
//                   <div className="flex items-center gap-1">الماركة <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
//                 </th>
//                 <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
//                   <div className="flex items-center gap-1">التصنيف <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
//                 </th>
//                 <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
//                   <div className="flex items-center gap-1">سعر الشراء <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
//                 </th>
//                 <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
//                   <div className="flex items-center gap-1">سعر البيع <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
//                 </th>
//                 <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
//                   <div className="flex items-center gap-1">الكمية <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
//                 </th>
//                 <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
//                   <div className="flex items-center gap-1">المخزن <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
//                 </th>
//                 <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
//                   <div className="flex items-center gap-1">آخر تحديث <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
//                 </th>
//                 <th className="p-4 font-medium text-center">إجراءات</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-white/5">
//               {filteredAccessories.length === 0 && !isLoading && !error ? (
//                 <tr>
//                   <td colSpan={10} className="p-8 text-center text-slate-500 dark:text-slate-400">
//                     <Headphones className="w-12 h-12 mx-auto mb-3 opacity-20" />
//                     لا توجد أصناف مطابقة للبحث
//                   </td>
//                 </tr>
//               ) : (
//                 paginatedAccessories.map((item, index) => (
//                   <motion.tr 
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: index * 0.05 }}
//                     key={item.id} 
//                     className="hover:bg-slate-50 dark:hover:bg-white/10 dark:bg-white/[0.02] transition-all group"
//                   >
//                     <td className="p-4">
//                       <input 
//                         type="checkbox" 
//                         checked={selectedItems.includes(item.id)}
//                         onChange={() => toggleSelectItem(item.id)}
//                         className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080c13] text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 transition-all"
//                       />
//                     </td>
//                     <td className="p-4 font-mono text-slate-900 dark:text-white">{item.barcode || '-'}</td>
//                     <td className="p-4 font-bold text-slate-900 dark:text-white">
//                       <div className="flex flex-col">
//                         <span>{item.name || '-'}</span>
//                         <div className="flex gap-2 mt-0.5">
//                           <span className="text-[10px] text-slate-500 font-normal">
//                             {item.entry_type === 'stock' ? 'رصيد أول مدة' : 'توريد مشتريات'}
//                           </span>
//                           {resolvedWarehouseId === 'ALL' && (
//                             <span className="text-[10px] text-cyan-500 font-normal bg-cyan-500/10 px-1.5 rounded">{item.branches?.name || 'الفرع الافتراضي'}</span>
//                           )}
//                         </div>
//                       </div>
//                     </td>
//                     <td className="p-4 text-slate-900 dark:text-white font-medium">{item.brand || '-'}</td>
//                     <td className="p-4">
//                       <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
//                         {item.category || 'غير مصنف'}
//                       </span>
//                     </td>
//                     <td className="p-4 text-slate-600 dark:text-slate-300 font-mono">
//                       <div className="flex flex-col">
//                         <span>{(item.cost_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500">ج.م</span></span>
//                         {item.tax > 0 && <span className="text-[10px] text-emerald-500">ضريبة: {item.tax}%</span>}
//                       </div>
//                     </td>
//                     <td className="p-4 font-bold text-slate-900 dark:text-white font-mono">
//                       {(item.selling_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500">ج.م</span>
//                     </td>
//                     <td className="p-4">
//                       <span className={`font-bold ${item.quantity <= (item.alert_quantity || 5) ? 'text-red-400' : 'text-emerald-400'}`}>
//                         {item.quantity || 0}
//                       </span>
//                     </td>
//                     <td className="p-4 text-slate-600 dark:text-slate-300">
//                       {warehouse ? warehouse.name : 'الإكسسوارات'}
//                     </td>
//                     <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
//                       {formatDate(item.created_at)}
//                     </td>
//                     <td className="p-4">
//                       <div className="flex items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
//                         <button 
//                           onClick={() => {
//                             setSelectedAccessory(item);
//                             setIsViewModalOpen(true);
//                           }}
//                           className="p-1.5 bg-slate-500/10 text-slate-500 dark:text-slate-400 hover:bg-slate-500 hover:text-slate-900 dark:text-white rounded-lg transition-all" 
//                           title="عرض التفاصيل"
//                         >
//                           <Eye className="w-4 h-4" />
//                         </button>
//                         <button 
//                           onClick={() => {
//                             setSelectedAccessory(item);
//                             setIsEditModalOpen(true);
//                           }}
//                           className="p-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-slate-900 dark:text-white rounded-lg transition-all" 
//                           title="تعديل"
//                         >
//                           <Edit className="w-4 h-4" />
//                         </button>
//                         <button 
//                           onClick={() => setTransferAccessory(item)}
//                           className="p-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-900 dark:text-white rounded-lg transition-all" 
//                           title="تحويل"
//                         >
//                           <ArrowRightLeft className="w-4 h-4" />
//                         </button>
//                         <button 
//                           onClick={() => { setSelectedAccessory(item); setIsBarcodeModalOpen(true); }}
//                           className="p-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-slate-900 dark:text-white rounded-lg transition-all" 
//                           title="طباعة باركود"
//                         >
//                           <Printer className="w-4 h-4" />
//                         </button>
//                         <button 
//                           onClick={() => {
//                             setSelectedAccessory(item);
//                             setIsDeleteModalOpen(true);
//                           }}
//                           className="p-1.5 bg-slate-500/10 text-slate-500 dark:text-slate-400 hover:bg-slate-500 hover:text-slate-900 dark:text-white rounded-lg transition-all" 
//                           title="حذف"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </td>
//                   </motion.tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination Controls */}
//         {totalPages > 1 && (
//           <div className="p-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#080c13]/30">
//             <div>
//               عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, filteredAccessories.length)} من أصل {filteredAccessories.length}
//             </div>
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
//                 disabled={currentPage === 1}
//                 className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
//               >
//                 <ChevronRight className="w-4 h-4" />
//               </button>
//               <div className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
//                 {currentPage}
//               </div>
//               <button
//                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
//                 disabled={currentPage === totalPages}
//                 className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
//               >
//                 <ChevronLeft className="w-4 h-4" />
//               </button>
//             </div>
//             <div className="flex items-center gap-2">
//               <span>عدد الصفوف:</span>
//               <select 
//                 value={itemsPerPage}
//                 onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
//                 className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 outline-none"
//               >
//                 <option value="25">25</option>
//                 <option value="50">50</option>
//                 <option value="100">100</option>
//               </select>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modals */}
//       <AddAccessoryModal 
//         isOpen={isAddModalOpen} 
//         onClose={() => setIsAddModalOpen(false)} 
//         onSuccess={resolveAndFetch} 
//         warehouseId={resolvedWarehouseId}
//       />
      
//       <AddAccessoryQuantityModal 
//         isOpen={isAddQuantityModalOpen} 
//         onClose={() => setIsAddQuantityModalOpen(false)} 
//         onSuccess={resolveAndFetch}
//         accessories={accessories}
//         selectedAccessoryId={selectedAccessoryIdForQuantity}
//       />

//       <ViewAccessoryModal 
//         isOpen={isViewModalOpen} 
//         onClose={() => setIsViewModalOpen(false)} 
//         accessory={selectedAccessory} 
//       />

//       <EditAccessoryModal 
//         isOpen={isEditModalOpen} 
//         onClose={() => setIsEditModalOpen(false)} 
//         onSuccess={resolveAndFetch}
//         accessory={selectedAccessory} 
//       />

//       <DeleteAccessoryModal 
//         isOpen={isDeleteModalOpen} 
//         onClose={() => setIsDeleteModalOpen(false)} 
//         onSuccess={resolveAndFetch}
//         accessory={selectedAccessory} 
//       />

//       <ImportAccessoriesExcelModal 
//         isOpen={isImportModalOpen} 
//         onClose={() => setIsImportModalOpen(false)} 
//         onSuccess={resolveAndFetch} 
//         warehouseId={resolvedWarehouseId}
//       />

//       <TransferItemModal 
//         isOpen={!!transferAccessory}
//         onClose={() => setTransferAccessory(null)}
//         onSuccess={() => {
//           setTransferAccessory(null);
//           resolveAndFetch();
//         }}
//         item={transferAccessory}
//         itemType="accessories"
//         sourceWarehouse={warehouse || { id: resolvedWarehouseId, name: 'مخزن الإكسسوارات الافتراضي', type: 'accessories' }}
//       />
      
//       <PrintBarcodeModal 
//         isOpen={isBarcodeModalOpen} 
//         onClose={() => { setIsBarcodeModalOpen(false); setSelectedAccessory(null); }} 
//         autoSelectItem={selectedAccessory ? { item: selectedAccessory, category: 'accessory' } : undefined}
//       />
//     </motion.div>
//   );
// }
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Filter, Plus, FileText, Download, Upload, 
  Printer, Trash2, Edit, Eye, DollarSign, Headphones, 
  Barcode, AlertCircle, LayoutGrid, ChevronDown, 
  RotateCcw, Layers, Loader2, PackagePlus, Activity, ArrowUpDown, ArrowRightLeft,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

import AddAccessoryModal from './AddAccessoryModal';
import AddAccessoryQuantityModal from './AddAccessoryQuantityModal';
import ViewAccessoryModal from './ViewAccessoryModal';
import EditAccessoryModal from './EditAccessoryModal';
import DeleteAccessoryModal from './DeleteAccessoryModal';
import ImportAccessoriesExcelModal from './ImportAccessoriesExcelModal';
import TransferItemModal from './TransferItemModal';
import { PrintBarcodeModal } from './PrintBarcodeModal';

export default function Accessories({ warehouse }: { warehouse?: any }) {
  const [accessories, setAccessories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [resolvedWarehouseId, setResolvedWarehouseId] = useState<string | null>(warehouse?.id || null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddQuantityModalOpen, setIsAddQuantityModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  
  const [selectedAccessory, setSelectedAccessory] = useState<any>(null);
  const [transferAccessory, setTransferAccessory] = useState<any>(null);
  const [selectedAccessoryIdForQuantity, setSelectedAccessoryIdForQuantity] = useState<number | null>(null);

  // Filters state
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    quantity: ''
  });

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(50);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  useEffect(() => {
    resolveAndFetch();
  }, [warehouse]);

  const resolveAndFetch = async () => {
    setIsLoading(true);
    try {
      let targetWarehouseId = warehouse?.id;
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      if (!targetWarehouseId) {
        const activeBranchId = localStorage.getItem("takka_active_branch_id");
        if (!activeBranchId || activeBranchId === 'ALL') {
           targetWarehouseId = 'ALL';
           setResolvedWarehouseId('ALL');
        } else {
          // Find default accessories warehouse
          let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.accessories&is_default=eq.true&branch_id=eq.${activeBranchId}`;
          let whRes = await fetch(url, {
            headers: {
              'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
              'Authorization': `Bearer ${token}`
            }
          });
          let whData = await whRes.json();
  
          // If no default is found explicitly, pick FIRST warehouse safely
          if (!Array.isArray(whData) || whData.length === 0) {
             let url2 = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.accessories&branch_id=eq.${activeBranchId}&order=created_at.asc&limit=1`;
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
          let patchUrl = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?warehouse_id=is.null`;
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
          console.error('Failed to patch null warehouse accessories');
        }
      }

      await fetchAccessories(targetWarehouseId);
    } catch (err: any) {
      setError('فشل تجهيز بيانات المخزن');
      setIsLoading(false);
    }
  };

  const fetchAccessories = async (warehouseId: string | null) => {
    setIsLoading(true);
    setError('');
    try {
      if (warehouseId === 'NONE') {
         setAccessories([]);
         setIsLoading(false);
         return;
      }
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      let url = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories?select=*,branches(name)';
      
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
        throw new Error('فشل جلب بيانات الإكسسوارات');
      }
      
      const data = await response.json();
      setAccessories(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ category: '', status: '', quantity: '' });
    setSearchTerm('');
  };

  // Apply filters
  const filteredAccessories = accessories.filter(item => {
    const matchSearch = searchTerm === '' || 
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchCategory = filters.category === '' || filters.category === 'كل الفئات' || item.category === filters.category;
    const matchStatus = filters.status === '' || filters.status === 'كل الحالات' || item.status === filters.status;
    
    let matchQuantity = true;
    if (filters.quantity === 'منخفض') matchQuantity = item.quantity <= (item.alert_quantity || 5);
    else if (filters.quantity === 'متوفر') matchQuantity = item.quantity > (item.alert_quantity || 5);
    else if (filters.quantity === 'نفذ') matchQuantity = item.quantity === 0;

    return matchSearch && matchCategory && matchStatus && matchQuantity;
  });

  // Calculate stats based on filtered accessories
  const displayedCount = filteredAccessories.length;

  // Apply pagination
  const totalPages = Math.max(1, Math.ceil(filteredAccessories.length / itemsPerPage));
  const paginatedAccessories = filteredAccessories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPieces = filteredAccessories.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const totalCost = filteredAccessories.reduce((acc, item) => acc + ((item.cost_price || 0) * (item.quantity || 0)), 0);
  const totalExpectedSales = filteredAccessories.reduce((acc, item) => acc + ((item.selling_price || 0) * (item.quantity || 0)), 0);

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredAccessories.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredAccessories.map(i => i.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleExport = () => {
    const exportData = filteredAccessories.map(item => ({
      'الباركود': item.barcode || '',
      'اسم الصنف': item.name || '',
      'التصنيف': item.category || '',
      'الفرع': item.branches?.name || 'الافتراضي',
      'سعر الشراء': item.cost_price || 0,
      'سعر البيع': item.selling_price || 0,
      'الكمية': item.quantity || 0,
      'حد التنبيه': item.alert_quantity || 0,
      'الحالة': item.status || '',
      'ملاحظات': item.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الإكسسوارات");
    
    XLSX.writeFile(workbook, "accessories_export.xlsx");
  };

  // Extract unique categories for filter
  const categories = Array.from(new Set(accessories.map(a => a.category).filter(Boolean)));

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
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
        <div className="absolute top-0 end-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Headphones className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {warehouse ? warehouse.name : 'مخزون الإكسسوارات'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {warehouse ? (warehouse.description || 'إدارة وتتبع الإكسسوارات في هذا المخزن') : 'إدارة وتتبع جميع الإكسسوارات في المخزن الافتراضي'}
            </p>
          </div>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-blue-500/30 transition-colors"
        >
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" /> الأصناف المعروضة
          </p>
          <h3 className="text-2xl font-bold text-blue-400 tracking-wider">
            {displayedCount.toLocaleString('ar-EG')}
          </h3>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
        >
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
            <PackagePlus className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" /> إجمالي القطع
          </p>
          <h3 className="text-2xl font-bold text-emerald-400 tracking-wider">
            {totalPieces.toLocaleString('ar-EG')}
          </h3>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-purple-500/30 transition-colors"
        >
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" /> قيمة التكلفة
          </p>
          <h3 className="text-2xl font-bold text-purple-400 tracking-wider">
            {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-slate-400/30 transition-colors"
        >
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" /> قيمة البيع المتوقعة
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wider">
            {totalExpectedSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </motion.div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 justify-between items-center">
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-blue-400 absolute top-1/2 start-3 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الباركود..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 ps-10 pe-4 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute top-1/2 end-3 -translate-y-1/2 text-slate-500 hover:text-slate-600 dark:text-slate-300">
                &times;
              </button>
            )}
          </div>
          
          <div className="relative min-w-[140px]">
            <select 
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">كل الفئات</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative min-w-[140px]">
            <select 
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">كل الحالات</option>
              <option value="Available">متاح</option>
              <option value="Out of Stock">نفذ</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative min-w-[140px]">
            <select 
              name="quantity"
              value={filters.quantity}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">كل الكميات</option>
              <option value="متوفر">متوفر</option>
              <option value="منخفض">منخفض</option>
              <option value="نفذ">نفذ</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(searchTerm || filters.category || filters.status || filters.quantity) && (
            <button 
              onClick={resetFilters}
              className="p-2.5 bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 transition-colors"
              title="إلغاء الفلاتر"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-cyan-500/20"
          >
            <Upload className="w-4 h-4" /> استيراد
          </button>
          <button 
            onClick={handleExport} 
            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-cyan-500/20"
          >
            <Download className="w-4 h-4" /> تصدير
          </button>
          <button 
            onClick={() => {
              setSelectedAccessoryIdForQuantity(null);
              setIsAddQuantityModalOpen(true);
            }}
            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 border border-orange-500/20"
          >
            <PackagePlus className="w-4 h-4" /> إضافة كمية
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-[#080c13] px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Plus className="w-4 h-4" /> إضافة صنف
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col overflow-hidden relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#11151c]/50 backdrop-blur-sm z-20">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        )}
        
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#11151c]/50 backdrop-blur-sm z-20">
            <div className="text-center text-red-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
              <button onClick={() => fetchAccessories(resolvedWarehouseId)} className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-sm transition-colors">
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-right">
            <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#080c13]/50 border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.length === filteredAccessories.length && filteredAccessories.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080c13] text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0"
                  />
                </th>
                <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
                  <div className="flex items-center gap-1">الباركود <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
                  <div className="flex items-center gap-1">اسم الصنف <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
                  <div className="flex items-center gap-1">الماركة <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
                  <div className="flex items-center gap-1">التصنيف <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
                  <div className="flex items-center gap-1">سعر الشراء <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
                  <div className="flex items-center gap-1">سعر البيع <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
                  <div className="flex items-center gap-1">الكمية <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
                  <div className="flex items-center gap-1">المخزن <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="p-4 font-medium hover:text-slate-900 dark:text-white cursor-pointer transition-colors group">
                  <div className="flex items-center gap-1">آخر تحديث <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="p-4 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAccessories.length === 0 && !isLoading && !error ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <Headphones className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    لا توجد أصناف مطابقة للبحث
                  </td>
                </tr>
              ) : (
                paginatedAccessories.map((item, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={item.id} 
                    className="hover:bg-slate-50 dark:hover:bg-white/10 dark:bg-white/[0.02] transition-all group"
                  >
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080c13] text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 transition-all"
                      />
                    </td>
                    <td className="p-4 font-mono text-slate-900 dark:text-white">{item.barcode || '-'}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex flex-col">
                        <span>{item.name || '-'}</span>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-normal">
                            {item.entry_type === 'stock' ? 'رصيد أول مدة' : 'توريد مشتريات'}
                          </span>
                          {resolvedWarehouseId === 'ALL' && (
                            <span className="text-[10px] text-cyan-500 font-normal bg-cyan-500/10 px-1.5 rounded">{item.branches?.name || 'الفرع الافتراضي'}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-900 dark:text-white font-medium">{item.brand || '-'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {item.category || 'غير مصنف'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-mono">
                      <div className="flex flex-col">
                        <span>{(item.cost_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500">ج.م</span></span>
                        {item.tax > 0 && <span className="text-[10px] text-emerald-500">ضريبة: {item.tax}%</span>}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white font-mono">
                      {(item.selling_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500">ج.م</span>
                    </td>
                    <td className="p-4">
                      <span className={`font-bold ${item.quantity <= (item.alert_quantity || 5) ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.quantity || 0}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {warehouse ? warehouse.name : 'الإكسسوارات'}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSelectedAccessory(item);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-500/10 text-slate-500 dark:text-slate-400 hover:bg-slate-500 hover:text-slate-900 dark:text-white rounded-lg transition-all" 
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAccessory(item);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-slate-900 dark:text-white rounded-lg transition-all" 
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setTransferAccessory(item)}
                          className="p-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-900 dark:text-white rounded-lg transition-all" 
                          title="تحويل"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedAccessory(item); setIsBarcodeModalOpen(true); }}
                          className="p-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-slate-900 dark:text-white rounded-lg transition-all" 
                          title="طباعة باركود"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAccessory(item);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-500/10 text-slate-500 dark:text-slate-400 hover:bg-slate-500 hover:text-slate-900 dark:text-white rounded-lg transition-all" 
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
          <div className="p-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#080c13]/30">
            <div>
              عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, filteredAccessories.length)} من أصل {filteredAccessories.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                {currentPage}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span>عدد الصفوف:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 outline-none"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddAccessoryModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={resolveAndFetch} 
        warehouseId={resolvedWarehouseId}
      />
      
      <AddAccessoryQuantityModal 
        isOpen={isAddQuantityModalOpen} 
        onClose={() => setIsAddQuantityModalOpen(false)} 
        onSuccess={resolveAndFetch}
        accessories={accessories}
        selectedAccessoryId={selectedAccessoryIdForQuantity}
      />

      <ViewAccessoryModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        accessory={selectedAccessory} 
      />

      <EditAccessoryModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={resolveAndFetch}
        accessory={selectedAccessory} 
      />

      <DeleteAccessoryModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onSuccess={resolveAndFetch}
        accessory={selectedAccessory} 
      />

      <ImportAccessoriesExcelModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={resolveAndFetch} 
        warehouseId={resolvedWarehouseId}
      />

      <TransferItemModal 
        isOpen={!!transferAccessory}
        onClose={() => setTransferAccessory(null)}
        onSuccess={() => {
          setTransferAccessory(null);
          resolveAndFetch();
        }}
        item={transferAccessory}
        itemType="accessories"
        sourceWarehouse={warehouse || { id: resolvedWarehouseId, name: 'مخزن الإكسسوارات الافتراضي', type: 'accessories' }}
      />
      
      <PrintBarcodeModal 
        isOpen={isBarcodeModalOpen} 
        onClose={() => { setIsBarcodeModalOpen(false); setSelectedAccessory(null); }} 
        autoSelectItem={selectedAccessory ? { item: selectedAccessory, category: 'accessory' } : undefined}
      />
    </motion.div>
  );
}