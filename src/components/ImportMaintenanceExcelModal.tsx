import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileSpreadsheet, Loader2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportMaintenanceExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branchId?: string | null;
  branches?: any[];
}

export default function ImportMaintenanceExcelModal({ isOpen, onClose, onSuccess, branchId, branches }: ImportMaintenanceExcelModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (branchId && branchId !== 'ALL') {
        setSelectedBranchId(branchId);
      }
    }
  }, [isOpen, branchId]);

  const handleDownloadTemplate = () => {
    const templateData = [{
      'الفاتورة': '1000',
      'الاسم': 'محمد احمد',
      'الهاتف': '01012345678',
      'موديل الجهاز': 'ايفون 13',
      'العطل': 'شاشة',
      'إضافي': 'خدوش بالظهر',
      'تاريخ الاستلام': '2024-01-01',
      'المطلوب': 1500,
      'المدفوع': 500,
      'المتبقي': 1000,
      'المهندس': 'علي',
      'حالة الكشف': 'تم',
      'حالة الصيانة': 'جاري الصيانة',
      'حالة التسليم': ''
    }];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "قالب الصيانة");
    XLSX.writeFile(workbook, "maintenance_template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedBranchId && (!branchId || branchId === 'ALL')) {
        setError('يرجى اختيار الفرع أولاً قبل رفع الملف');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        throw new Error('الملف فارغ أو لا يحتوي على بيانات صالحة');
      }

      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      const tenantId = localStorage.getItem('tenant_id') || userId;
      
      const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
      const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

      const repairsToAdd = jsonData.map((row: any) => {
        let status = 'مستلم';
        const deliveryStatus = (row['حالة التسليم'] || '').toString();
        const maintenanceStatus = (row['حالة الصيانة'] || '').toString();
        const inspectionStatus = (row['حالة الكشف'] || '').toString();

        if (deliveryStatus.includes('تم التسليم')) {
            status = 'تم التسليم';
        } else if (deliveryStatus.includes('جاهز')) {
            status = 'جاهز';
        } else if (maintenanceStatus.includes('مرفوض')) {
            status = 'مرفوض';
        } else if (maintenanceStatus.includes('جاري') || maintenanceStatus.includes('تحت')) {
            status = 'تحت الصيانة';
        } else if (maintenanceStatus.includes('تم الصيانة')) {
            status = 'جاهز';
        } else if (inspectionStatus.includes('مرفوض') || inspectionStatus.includes('رفض')) {
            status = 'مرفوض';
        } else if (inspectionStatus.includes('جاري')) {
            status = 'مستلم';
        } else if (inspectionStatus.includes('تم')) {
            status = 'قيد الانتظار';
        }

        let total = Number(row['المطلوب']) || 0;
        let paid = Number(row['المدفوع']) || 0;
        let remaining = Number(row['المتبقي']) !== undefined && !isNaN(Number(row['المتبقي'])) 
          ? Number(row['المتبقي']) 
          : (total - paid);

        let notes = row['إضافي'] || '';
        
        // Add extra unmapped info to notes
        if (row['الفاتورة']) notes = `الفاتورة الأصلية: ${row['الفاتورة']}\n` + notes;
        if (row['الكشف']) notes += `\nرسوم الكشف: ${row['الكشف']}`;

        let createdAt = row['تاريخ الاستلام'];
        let created_at = new Date().toISOString();
        if (createdAt) {
            try {
                if (createdAt instanceof Date) {
                    created_at = createdAt.toISOString();
                } else if (typeof createdAt === 'string') {
                    // Try parsing DD/MM/YYYY
                    const parts = createdAt.split(/[\/\-]/);
                    if (parts.length === 3) {
                       const d = parseInt(parts[0]);
                       const m = parseInt(parts[1]) - 1;
                       const y = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2]);
                       const parsedDate = new Date(y, m, d);
                       if (!isNaN(parsedDate.getTime())) {
                           created_at = parsedDate.toISOString();
                       }
                    } else {
                       const d = new Date(createdAt);
                       if (!isNaN(d.getTime())) {
                           created_at = d.toISOString();
                       }
                    }
                }
            } catch (e) {}
        }
        
        return {
          customer_name: row['الاسم'] || 'عميل بدون اسم',
          customer_phone: row['الهاتف']?.toString() || null,
          device_name: row['موديل الجهاز'] || 'جهاز غير معروف',
          issue: row['العطل'] || 'غير محدد',
          notes: notes.trim() || null,
          total_amount: total,
          paid_amount: paid,
          remaining_amount: remaining,
          status: status,
          technician_name: row['المهندس'] || null,
          user_id: userId,
          receiving_branch_id: selectedBranchId || null,
          repairing_branch_id: selectedBranchId || null,
          tenant_id: tenantId,
          created_at: created_at
        };
      }).filter((d: any) => d.customer_name);

      if (repairsToAdd.length === 0) {
        throw new Error('لم يتم العثور على بيانات صالحة في الملف');
      }

      const CHUNK_SIZE = 500;
      for (let i = 0; i < repairsToAdd.length; i += CHUNK_SIZE) {
        const chunk = repairsToAdd.slice(i, i + CHUNK_SIZE);
        const response = await fetch(`${SUPABASE_URL}/rest/v1/Repairs`, {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(chunk)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Error uploading chunk ${i / CHUNK_SIZE + 1}:`, errText);
          throw new Error('فشل في رفع بعض أو كل البيانات إلى السيرفر. يرجى التأكد من صحة البيانات.');
        }
      }

      setSuccess(`تم بنجاح رفع ${repairsToAdd.length} حالة صيانة`);
      onSuccess();
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2500);

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
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:pr-72" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-50/80 dark:bg-[#080c13]/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">استيراد بيانات الصيانة</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid gap-6">
            <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <FileText className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-blue-900 dark:text-blue-400">قالب جاهز</h3>
                  <p className="text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                    قم بتحميل ملف القالب واملأه ببيانات الصيانة (رقم الفاتورة، الاسم، الهاتف، العطل وغيرها)، ثم ارفعه هنا.
                  </p>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2"
                  >
                    <Upload className="w-4 h-4 rotate-180" />
                    تحميل القالب
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-teal-600 dark:text-teal-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}

            {(!branchId || branchId === 'ALL') && branches && branches.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">الفرع</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  <option value="">اختر الفرع (إلزامي)</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              ref={fileInputRef}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full h-32 border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">جاري الاستيراد...</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-bold text-slate-900 dark:text-white">اختر ملف Excel</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">.xlsx أو .xls أو .csv</p>
                  </div>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
