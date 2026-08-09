  import React, { useRef, useState } from 'react';
  import { motion, AnimatePresence } from 'motion/react';
  import { X, Upload, Download, FileSpreadsheet, Loader2, AlertCircle, FileText, Store } from 'lucide-react';
  import * as XLSX from 'xlsx';
  import { useBranch } from '../contexts/BranchContext';

  interface ImportExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    warehouseId?: string | null;
  }

  export default function ImportExcelModal({ isOpen, onClose, onSuccess, warehouseId }: ImportExcelModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isOwner, branches, currentBranchId } = useBranch();
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');

    React.useEffect(() => {
      if (isOpen) {
        if (currentBranchId && currentBranchId !== 'ALL') {
          setSelectedBranchId(currentBranchId);
        } else if (branches && branches.length > 0) {
          setSelectedBranchId(branches[0].id.toString());
        }
      }
    }, [isOpen, currentBranchId, branches]);

    const handleDownloadTemplate = () => {
      const templateData = [{
        'الشركة': 'Apple',
        'الموديل': 'iPhone 13',
        'المساحة': '128GB',
        'اللون': 'Black',
        'الرام': '8GB',
        'الحالة': 'جديد',
        'الكرتونة': 'نعم',
        'المصدر': 'Supplier',
        'IMEI 1': '111111111111111',
        'IMEI 2': '222222222222222',
        'سعر التكلفة': 15000,
        'سعر البيع': 18000,
        'الضريبة': 0,
        'ملاحظات': 'ملاحظات إضافية'
      }];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "قالب الأجهزة");
      
      XLSX.writeFile(workbook, "devices_template.xlsx");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError('');

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const token = localStorage.getItem('access_token');
        const userId = localStorage.getItem('user_id');
        const tenantId = localStorage.getItem('tenant_id') || userId;

        const devicesToAdd = jsonData.map((row: any) => ({
          company: row['الشركة'] || '',
          model: row['الموديل'] || '',
          storage: row['المساحة'] || '',
          color: row['اللون'] || '',
          ram: row['الرام'] || '',
          condition: row['الحالة'] || 'جديد',
          has_box: row['الكرتونة'] === 'نعم',
          source: row['المصدر'] || '',
          imei1: row['IMEI 1']?.toString() || '',
          imei2: row['IMEI 2']?.toString() || '',
          cost_price: Number(row['سعر التكلفة']) || 0,
          selling_price: Number(row['سعر البيع']) || 0,
          tax: Number(row['الضريبة']) || 0,
          notes: row['ملاحظات'] || '',
          user_id: userId,
          status: 'available',
          is_locked_for_installment: false,
          entry_type: 'import',
          warehouse_id: (!warehouseId || warehouseId === 'ALL' || warehouseId === 'NONE') ? null : warehouseId,
          branch_id: selectedBranchId ? selectedBranchId : null,
          tenant_id: tenantId
        })).filter((d: any) => d.imei1 || d.model);

        if (devicesToAdd.length === 0) {
          throw new Error('لم يتم العثور على بيانات صالحة في الملف');
        }

        const response = await fetch('https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Devices', {
          method: 'POST',
          headers: {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(devicesToAdd)
        });

        if (!response.ok) {
          throw new Error('فشل في رفع البيانات');
        }

        onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء استيراد الملف');
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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
            className="relative w-full max-w-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">استيراد الأجهزة من Excel</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {isOwner && branches && branches.length > 0 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Store className="w-4 h-4 text-cyan-400" /> الفرع الذي سيتم إضافة الأجهزة إليه
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

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Template Download */}
              <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  حمل القالب واملأه بالبيانات ثم استورده 💡
                </p>
                <button 
                  onClick={handleDownloadTemplate}
                  className="bg-orange-500 hover:bg-orange-600 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                >
                  <FileText className="w-4 h-4" /> تحميل القالب
                </button>
              </div>

              {/* Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-blue-500/50 bg-slate-50 dark:bg-white/[0.02] hover:bg-blue-500/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
                <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-medium mb-1">اضغط لاختيار ملف Excel</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">صيغ الملفات المدعومة: .xlsx, .xls</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0 flex items-center justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/5 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }
