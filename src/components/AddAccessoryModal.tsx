// import React, { useState } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import { X, PackagePlus, Barcode as BarcodeIcon, Loader2, Building2 } from 'lucide-react';
// import { useBranch } from '../contexts/BranchContext';

// interface AddAccessoryModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   warehouseId?: string | null;
// }

// export default function AddAccessoryModal(props: AddAccessoryModalProps) {
//   const { isOpen, onClose, onSuccess } = props;
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [barcodeMode, setBarcodeMode] = useState<'auto' | 'manual'>('auto');
//   const [suppliers, setSuppliers] = useState<any[]>([]);
//   const [wallets, setWallets] = useState<any[]>([]);
//   const [selectedBranchId, setSelectedBranchId] = useState<string>('');
//   const [paidAmount, setPaidAmount] = useState<string>('');
//   const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  
//   const { isOwner, branches, currentBranchId } = useBranch();

//   React.useEffect(() => {
//     if (isOpen) {
//       if (currentBranchId && currentBranchId !== 'ALL') {
//         setSelectedBranchId(currentBranchId);
//       } else if (branches && branches.length > 0) {
//         setSelectedBranchId(branches[0].id.toString());
//       }
//     }
//   }, [isOpen, currentBranchId, branches]);

//   const [formData, setFormData] = useState({
//     name: '',
//     brand: '',
//     category: '',
//     barcode: '',
//     cost_price: '',
//     selling_price: '',
//     tax: '0',
//     quantity: '0',
//     alert_quantity: '5',
//     supplier: '',
//     entry_type: 'purchase',
//     status: 'جديد',
//     location: '',
//     notes: ''
//   });

//   React.useEffect(() => {
//     if (isOpen) {
//       const fetchSuppliers = async () => {
//         try {
//           const token = localStorage.getItem('access_token');
//           const userId = localStorage.getItem('user_id');
//           const headers = {
//             'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
//             'Authorization': `Bearer ${token}`
//           };

//           const tenantId = localStorage.getItem('tenant_id') || userId;
//           let walletsUrl = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?select=*,branches(name)&tenant_id=eq.${tenantId}`;
//           const activeBranchId = localStorage.getItem('takka_active_branch_id');
//           if (activeBranchId && activeBranchId !== 'ALL') {
//              walletsUrl += `&branch_id=eq.${activeBranchId}`;
//           }

//           const promises = [
//             fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers?select=id,name&tenant_id=eq.${tenantId}&order=name.asc`, { headers }),
//             fetch(walletsUrl, { headers })
//           ];

//           const results = await Promise.all(promises);

//           if (results[0].ok) {
//             setSuppliers(await results[0].json());
//           }
//           if (results[1].ok) {
//             setWallets(await results[1].json());
//           }
//         } catch (error) {
//           console.error('Error fetching defaults:', error);
//         }
//       };
//       fetchSuppliers();
//     }
//   }, [isOpen]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError('');

//     try {
//       const token = localStorage.getItem('access_token');
//       const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
//       const tenantId = localStorage.getItem('tenant_id') || userId;
//       const commonHeaders = {
//         'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//         'Prefer': 'return=representation'
//       };

//       let finalBarcode = formData.barcode;
//       if (barcodeMode === 'auto') {
//         finalBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
//       }

//       const targetBranchId = (isOwner && selectedBranchId) ? selectedBranchId : (currentBranchId || null);
//       let formWarehouseId = ((props as any).warehouseId === 'ALL' || (props as any).warehouseId === 'NONE') ? null : ((props as any).warehouseId || null);
      
//       if (!formWarehouseId && targetBranchId) {
//         // Find default warehouse for this branch
//         try {
//           let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.accessories&is_default=eq.true&branch_id=eq.${targetBranchId}`;
//           let whRes = await fetch(url, { headers: commonHeaders });
//           if (whRes.ok) {
//             let whData = await whRes.json();
//             if (whData && whData.length > 0) formWarehouseId = whData[0].id;
//             else {
//               let url2 = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.accessories&branch_id=eq.${targetBranchId}&order=created_at.asc&limit=1`;
//               let whRes2 = await fetch(url2, { headers: commonHeaders });
//               if (whRes2.ok) {
//                 let whData2 = await whRes2.json();
//                 if (whData2 && whData2.length > 0) formWarehouseId = whData2[0].id;
//               }
//             }
//           }
//         } catch (e) {
//           console.error("Error fetching branch warehouse", e);
//         }
//       }

//       const payload = {
//         name: formData.name,
//         brand: formData.brand,
//         category: formData.category,
//         barcode: finalBarcode,
//         cost_price: Number(formData.cost_price),
//         selling_price: Number(formData.selling_price),
//         tax: Number(formData.tax),
//         quantity: Number(formData.quantity),
//         alert_quantity: Number(formData.alert_quantity),
//         supplier: formData.supplier,
//         entry_type: formData.entry_type,
//         status: formData.status,
//         location: formData.location || null,
//         notes: formData.notes,
//         user_id: userId,
//         warehouse_id: formWarehouseId,
//         branch_id: targetBranchId,
//         tenant_id: tenantId
//       };

//       const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories', {
//         method: 'POST',
//         headers: commonHeaders,
//         body: JSON.stringify(payload)
//       });

//       if (!response.ok) {
//         const errText = await response.text();
//         console.error("Add accessory error:", errText);
//         throw new Error(`فشل في إضافة الصنف: ${errText}`);
//       }

//       if (formData.supplier && Number(paidAmount) > 0 && selectedWalletId) {
//         const wallet = wallets.find(w => w.id.toString() === selectedWalletId);
//         if (wallet) {
//            await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?id=eq.${selectedWalletId}`, {
//              method: 'PATCH',
//              headers: commonHeaders,
//              body: JSON.stringify({ balance: Number(wallet.balance || 0) - Number(paidAmount) })
//            });
//         }
//         await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions`, {
//           method: 'POST',
//           headers: commonHeaders,
//           body: JSON.stringify({
//             wallet_id: Number(selectedWalletId),
//             user_id: userId,
//             type: 'out',
//             amount: Number(paidAmount),
//             category: 'سداد دفعة للمورد',
//             description: `سداد المورد ${formData.supplier} (إكسسوار: ${formData.name})`,
//             branch_id: targetBranchId,
//             tenant_id: tenantId
//           })
//         });
//       }

//       onSuccess();
//       onClose();
//       setPaidAmount('');
//       setSelectedWalletId('');
//       setFormData({
//         name: '',
//         brand: '',
//         category: '',
//         barcode: '',
//         cost_price: '',
//         selling_price: '',
//         tax: '',
//         quantity: '0',
//         alert_quantity: '5',
//         supplier: '',
//         entry_type: 'purchase',
//         status: 'جديد',
//         location: '',
//         notes: ''
//       });
//     } catch (err: any) {
//       setError(err.message || 'حدث خطأ أثناء الإضافة');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <AnimatePresence>
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:pr-72" dir="rtl">
//         <motion.div 
//           initial={{ opacity: 0 }} 
//           animate={{ opacity: 1 }} 
//           exit={{ opacity: 0 }} 
//           className="absolute inset-0 bg-slate-50 dark:bg-[#080c13]/80 backdrop-blur-sm"
//           onClick={onClose}
//         />
        
//         <motion.div 
//           initial={{ opacity: 0, scale: 0.95, y: 20 }} 
//           animate={{ opacity: 1, scale: 1, y: 0 }} 
//           exit={{ opacity: 0, scale: 0.95, y: 20 }}
//           className="relative w-full max-w-2xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
//             <div className="flex items-center gap-3">
//               <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة صنف جديد</h2>
//             </div>
//             <button 
//               onClick={onClose}
//               className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-xl transition-colors"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           {/* Body */}
//           <div className="p-6 overflow-y-auto custom-scrollbar">
//             {error && (
//               <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
//                 {error}
//               </div>
//             )}

//             <form id="add-accessory-form" onSubmit={handleSubmit} className="space-y-6">
//               {isOwner && branches && branches.length > 0 && (
//                 <div className="space-y-2">
//                   <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
//                     <Building2 className="w-4 h-4 text-cyan-400" /> الفرع الذي سيتم إضافة الصنف إليه
//                   </label>
//                   <select 
//                     value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} required
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-cyan-500 focus:border-cyan-500 outline-none transition-all appearance-none"
//                   >
//                     {branches.map(branch => (
//                       <option key={branch.id} value={branch.id}>{branch.name}</option>
//                     ))}
//                   </select>
//                 </div>
//               )}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اسم الصنف *</label>
//                   <input 
//                     type="text" 
//                     name="name"
//                     required
//                     value={formData.name}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الماركة / النوع</label>
//                   <input 
//                     type="text" 
//                     name="brand"
//                     value={formData.brand}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">التصنيف</label>
//                   <input 
//                     type="text" 
//                     name="category"
//                     value={formData.category}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نوع الإدخال</label>
//                   <select 
//                     name="entry_type"
//                     value={formData.entry_type}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none"
//                   >
//                     <option value="purchase">مشتريات</option>
//                     <option value="stock">رصيد أول مدة</option>
//                     <option value="manual">إدخال يدوي</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
//                     <BarcodeIcon className="w-4 h-4 text-cyan-400" /> الباركود
//                   </label>
//                   <div className="flex items-center gap-4 text-sm">
//                     <label className="flex items-center gap-2 cursor-pointer">
//                       <input 
//                         type="radio" 
//                         checked={barcodeMode === 'auto'}
//                         onChange={() => setBarcodeMode('auto')}
//                         className="text-cyan-500 focus:ring-cyan-500/50 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
//                       />
//                       <span className="text-slate-600 dark:text-slate-300">تلقائي 🔄</span>
//                     </label>
//                     <label className="flex items-center gap-2 cursor-pointer">
//                       <input 
//                         type="radio" 
//                         checked={barcodeMode === 'manual'}
//                         onChange={() => setBarcodeMode('manual')}
//                         className="text-cyan-500 focus:ring-cyan-500/50 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
//                       />
//                       <span className="text-slate-600 dark:text-slate-300">يدوي/سكان 📷</span>
//                     </label>
//                   </div>
//                 </div>
//                 {barcodeMode === 'manual' && (
//                   <input 
//                     type="text" 
//                     name="barcode"
//                     value={formData.barcode}
//                     onChange={handleChange}
//                     placeholder="امسح الباركود هنا..."
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                   />
//                 )}
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر الشراء *</label>
//                   <input 
//                     type="number" 
//                     name="cost_price"
//                     required
//                     min="0"
//                     step="0.01"
//                     value={formData.cost_price}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300" title="قيمة الضريبة">الضريبة (%)</label>
//                   <input 
//                     type="number" 
//                     name="tax"
//                     min="0"
//                     step="0.01"
//                     value={formData.tax}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع *</label>
//                   <input 
//                     type="number" 
//                     name="selling_price"
//                     required
//                     min="0"
//                     step="0.01"
//                     value={formData.selling_price}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الكمية</label>
//                   <input 
//                     type="number" 
//                     name="quantity"
//                     min="0"
//                     value={formData.quantity}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-slate-600 dark:text-slate-300">حد التنبيه</label>
//                   <input 
//                     type="number" 
//                     name="alert_quantity"
//                     min="0"
//                     value={formData.alert_quantity}
//                     onChange={handleChange}
//                     className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-4">
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium text-slate-600 dark:text-slate-300">المورد</label>
//                     <select 
//                       name="supplier"
//                       value={formData.supplier}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none"
//                     >
//                       <option value="">بدون مورد</option>
//                       {suppliers.map(s => (
//                         <option key={s.id} value={s.name}>{s.name}</option>
//                       ))}
//                     </select>
//                   </div>
//                   {formData.supplier && (
//                     <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
//                        <div className="flex justify-between items-center text-sm font-bold">
//                           <span className="text-slate-600 dark:text-slate-400">إجمالي المطلوب:</span>
//                           <span className="text-rose-600 dark:text-rose-400">
//                             {((Number(formData.cost_price) || 0) * (Number(formData.quantity) || 1) + (Number(formData.tax) || 0) * (Number(formData.quantity) || 1)).toLocaleString()} ج.م
//                           </span>
//                        </div>
//                        <div className="space-y-2">
//                          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">المبلغ المدفوع (اختياري)</label>
//                          <input 
//                            type="number"
//                            min="0"
//                            step="0.01"
//                            value={paidAmount}
//                            onChange={(e) => setPaidAmount(e.target.value)}
//                            placeholder="المبلغ المدفوع الآن"
//                            className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                          />
//                        </div>
//                        {Number(paidAmount) > 0 && (
//                          <div className="space-y-2">
//                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">خصم من المحفظة</label>
//                            <select
//                              value={selectedWalletId}
//                              onChange={(e) => setSelectedWalletId(e.target.value)}
//                              required={Number(paidAmount) > 0}
//                              className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                            >
//                              <option value="">اختر المحفظة...</option>
//                              {wallets.map(w => (
//                                <option key={w.id} value={w.id}>{w.name} ({w.balance} ج.م)</option>
//                              ))}
//                            </select>
//                          </div>
//                        )}
//                     </div>
//                   )}
//                 </div>
//                 <div className="space-y-4">
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الحالة</label>
//                     <select 
//                       name="status"
//                       value={formData.status}
//                       onChange={handleChange}
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none"
//                     >
//                       <option value="جديد">جديد</option>
//                       <option value="مستعمل">مستعمل</option>
//                     </select>
//                   </div>
//                   <div className="space-y-2">
//                     <label className="text-sm font-medium text-slate-600 dark:text-slate-300">مكان التخزين (اختياري)</label>
//                     <input 
//                       type="text"
//                       name="location"
//                       value={formData.location}
//                       onChange={handleChange}
//                       placeholder="مثال: شوكة رقم 100"
//                       className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات</label>
//                 <textarea 
//                   name="notes"
//                   value={formData.notes}
//                   onChange={handleChange}
//                   rows={3}
//                   className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors resize-none"
//                 />
//               </div>
//             </form>
//           </div>

//           {/* Footer */}
//           <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-between">
//             <button 
//               type="button"
//               onClick={onClose}
//               className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 transition-colors"
//             >
//               إلغاء
//             </button>
//             <button 
//               type="submit"
//               form="add-accessory-form"
//               disabled={isLoading}
//               className="bg-[#00d0d4] hover:bg-[#00b8bc] text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
//             >
//               {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
//               إضافة الصنف
//             </button>
//           </div>
//         </motion.div>
//       </div>
//     </AnimatePresence>
//   );
// }
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PackagePlus, Barcode as BarcodeIcon, Loader2, Building2 } from 'lucide-react';
import { useBranch } from '../contexts/BranchContext';

interface AddAccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warehouseId?: string | null;
}

export default function AddAccessoryModal(props: AddAccessoryModalProps) {
  const { isOpen, onClose, onSuccess } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [barcodeMode, setBarcodeMode] = useState<'auto' | 'manual'>('auto');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  
  const { isOwner, branches, currentBranchId } = useBranch();

  React.useEffect(() => {
    if (isOpen) {
      if (currentBranchId && currentBranchId !== 'ALL') {
        setSelectedBranchId(currentBranchId);
      } else if (branches && branches.length > 0) {
        setSelectedBranchId(branches[0].id.toString());
      }
    }
  }, [isOpen, currentBranchId, branches]);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    barcode: '',
    cost_price: '',
    selling_price: '',
    wholesale_price: '',
    half_wholesale_price: '',
    tax: '0',
    quantity: '0',
    alert_quantity: '5',
    supplier: '',
    entry_type: 'purchase',
    status: 'جديد',
    location: '',
    notes: ''
  });

  React.useEffect(() => {
    if (isOpen) {
      const fetchSuppliers = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const userId = localStorage.getItem('user_id');
          const headers = {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          };

          const tenantId = localStorage.getItem('tenant_id') || userId;
          let walletsUrl = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?select=*,branches(name)&tenant_id=eq.${tenantId}`;
          const activeBranchId = localStorage.getItem('takka_active_branch_id');
          if (activeBranchId && activeBranchId !== 'ALL') {
             walletsUrl += `&branch_id=eq.${activeBranchId}`;
          }

          const promises = [
            fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/suppliers?select=id,name&tenant_id=eq.${tenantId}&order=name.asc`, { headers }),
            fetch(walletsUrl, { headers })
          ];

          const results = await Promise.all(promises);

          if (results[0].ok) {
            setSuppliers(await results[0].json());
          }
          if (results[1].ok) {
            setWallets(await results[1].json());
          }
        } catch (error) {
          console.error('Error fetching defaults:', error);
        }
      };
      fetchSuppliers();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      const tenantId = localStorage.getItem('tenant_id') || userId;
      const commonHeaders = {
        'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      let finalBarcode = formData.barcode;
      if (barcodeMode === 'auto') {
        finalBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
      }

      const targetBranchId = (isOwner && selectedBranchId) ? selectedBranchId : (currentBranchId || null);
      let formWarehouseId = ((props as any).warehouseId === 'ALL' || (props as any).warehouseId === 'NONE') ? null : ((props as any).warehouseId || null);
      
      if (!formWarehouseId && targetBranchId) {
        // Find default warehouse for this branch
        try {
          let url = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.accessories&is_default=eq.true&branch_id=eq.${targetBranchId}`;
          let whRes = await fetch(url, { headers: commonHeaders });
          if (whRes.ok) {
            let whData = await whRes.json();
            if (whData && whData.length > 0) formWarehouseId = whData[0].id;
            else {
              let url2 = `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&type=eq.accessories&branch_id=eq.${targetBranchId}&order=created_at.asc&limit=1`;
              let whRes2 = await fetch(url2, { headers: commonHeaders });
              if (whRes2.ok) {
                let whData2 = await whRes2.json();
                if (whData2 && whData2.length > 0) formWarehouseId = whData2[0].id;
              }
            }
          }
        } catch (e) {
          console.error("Error fetching branch warehouse", e);
        }
      }

      const payload = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        barcode: finalBarcode,
        cost_price: Number(formData.cost_price),
        selling_price: Number(formData.selling_price),
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : null,
        half_wholesale_price: formData.half_wholesale_price ? Number(formData.half_wholesale_price) : null,
        tax: Number(formData.tax),
        quantity: Number(formData.quantity),
        alert_quantity: Number(formData.alert_quantity),
        supplier: formData.supplier,
        entry_type: formData.entry_type,
        status: formData.status,
        location: formData.location || null,
        notes: formData.notes,
        user_id: userId,
        warehouse_id: formWarehouseId,
        branch_id: targetBranchId,
        tenant_id: tenantId
      };

      const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Accessories', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Add accessory error:", errText);
        throw new Error(`فشل في إضافة الصنف: ${errText}`);
      }

      if (formData.supplier && Number(paidAmount) > 0 && selectedWalletId) {
        const wallet = wallets.find(w => w.id.toString() === selectedWalletId);
        if (wallet) {
           await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/wallets?id=eq.${selectedWalletId}`, {
             method: 'PATCH',
             headers: commonHeaders,
             body: JSON.stringify({ balance: Number(wallet.balance || 0) - Number(paidAmount) })
           });
        }
        await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/treasury_transactions`, {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({
            wallet_id: Number(selectedWalletId),
            user_id: userId,
            type: 'out',
            amount: Number(paidAmount),
            category: 'سداد دفعة للمورد',
            description: `سداد المورد ${formData.supplier} (إكسسوار: ${formData.name})`,
            branch_id: targetBranchId,
            tenant_id: tenantId
          })
        });
      }

      onSuccess();
      onClose();
      setPaidAmount('');
      setSelectedWalletId('');
      setFormData({
        name: '',
        brand: '',
        category: '',
        barcode: '',
        cost_price: '',
        selling_price: '',
        wholesale_price: '',
        half_wholesale_price: '',
        tax: '',
        quantity: '0',
        alert_quantity: '5',
        supplier: '',
        entry_type: 'purchase',
        status: 'جديد',
        location: '',
        notes: ''
      });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الإضافة');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

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
          className="relative w-full max-w-2xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة صنف جديد</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form id="add-accessory-form" onSubmit={handleSubmit} className="space-y-6">
              {isOwner && branches && branches.length > 0 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Building2 className="w-4 h-4 text-cyan-400" /> الفرع الذي سيتم إضافة الصنف إليه
                  </label>
                  <select 
                    value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} required
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-cyan-500 focus:border-cyan-500 outline-none transition-all appearance-none"
                  >
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">اسم الصنف *</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الماركة / النوع</label>
                  <input 
                    type="text" 
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">التصنيف</label>
                  <input 
                    type="text" 
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">نوع الإدخال</label>
                  <select 
                    name="entry_type"
                    value={formData.entry_type}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none"
                  >
                    <option value="purchase">مشتريات</option>
                    <option value="stock">رصيد أول مدة</option>
                    <option value="manual">إدخال يدوي</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <BarcodeIcon className="w-4 h-4 text-cyan-400" /> الباركود
                  </label>
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={barcodeMode === 'auto'}
                        onChange={() => setBarcodeMode('auto')}
                        className="text-cyan-500 focus:ring-cyan-500/50 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
                      />
                      <span className="text-slate-600 dark:text-slate-300">تلقائي 🔄</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        checked={barcodeMode === 'manual'}
                        onChange={() => setBarcodeMode('manual')}
                        className="text-cyan-500 focus:ring-cyan-500/50 bg-slate-50 dark:bg-[#080c13] border-slate-200 dark:border-white/10"
                      />
                      <span className="text-slate-600 dark:text-slate-300">يدوي/سكان 📷</span>
                    </label>
                  </div>
                </div>
                {barcodeMode === 'manual' && (
                  <input 
                    type="text" 
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="امسح الباركود هنا..."
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر الشراء *</label>
                  <input 
                    type="number" 
                    name="cost_price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300" title="قيمة الضريبة">الضريبة (%)</label>
                  <input 
                    type="number" 
                    name="tax"
                    min="0"
                    step="0.01"
                    value={formData.tax}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع قطاعي *</label>
                  <input 
                    type="number" 
                    name="selling_price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع جملة (اختياري)</label>
                  <input 
                    type="number" 
                    name="wholesale_price"
                    min="0"
                    step="0.01"
                    value={formData.wholesale_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">سعر البيع نصف جملة (اختياري)</label>
                  <input 
                    type="number" 
                    name="half_wholesale_price"
                    min="0"
                    step="0.01"
                    value={formData.half_wholesale_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الكمية</label>
                  <input 
                    type="number" 
                    name="quantity"
                    min="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">حد التنبيه</label>
                  <input 
                    type="number" 
                    name="alert_quantity"
                    min="0"
                    value={formData.alert_quantity}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">المورد</label>
                    <select 
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none"
                    >
                      <option value="">بدون مورد</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {formData.supplier && (
                    <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4">
                       <div className="flex justify-between items-center text-sm font-bold">
                          <span className="text-slate-600 dark:text-slate-400">إجمالي المطلوب:</span>
                          <span className="text-rose-600 dark:text-rose-400">
                            {((Number(formData.cost_price) || 0) * (Number(formData.quantity) || 1) + (Number(formData.tax) || 0) * (Number(formData.quantity) || 1)).toLocaleString()} ج.م
                          </span>
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-600 dark:text-slate-300">المبلغ المدفوع (اختياري)</label>
                         <input 
                           type="number"
                           min="0"
                           step="0.01"
                           value={paidAmount}
                           onChange={(e) => setPaidAmount(e.target.value)}
                           placeholder="المبلغ المدفوع الآن"
                           className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                         />
                       </div>
                       {Number(paidAmount) > 0 && (
                         <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-600 dark:text-slate-300">خصم من المحفظة</label>
                           <select
                             value={selectedWalletId}
                             onChange={(e) => setSelectedWalletId(e.target.value)}
                             required={Number(paidAmount) > 0}
                             className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                           >
                             <option value="">اختر المحفظة...</option>
                             {wallets.map(w => (
                               <option key={w.id} value={w.id}>{w.name} ({w.balance} ج.م)</option>
                             ))}
                           </select>
                         </div>
                       )}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">الحالة</label>
                    <select 
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors appearance-none"
                    >
                      <option value="جديد">جديد</option>
                      <option value="مستعمل">مستعمل</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">مكان التخزين (اختياري)</label>
                    <input 
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="مثال: شوكة رقم 100"
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ملاحظات</label>
                <textarea 
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors resize-none"
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-between">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              form="add-accessory-form"
              disabled={isLoading}
              className="bg-[#00d0d4] hover:bg-[#00b8bc] text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              إضافة الصنف
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
