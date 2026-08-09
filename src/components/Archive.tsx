import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Archive as ArchiveIcon, Database, HardDrive, Cpu, Loader2, ArrowRightLeft, PackageOpen, MoreHorizontal, FileText, Smartphone, RefreshCw, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ArchivedDevice {
  id: number;
  name: string;
  imei1: string;
  imei2: string;
  cost_price: number;
  selling_price: number;
  status: string;
  created_at: string;
  color?: string;
  company?: string;
}

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';

export default function Archive() {
  const [items, setItems] = useState<ArchivedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchArchivedItems();
  }, []);

  const fetchArchivedItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/Devices?status=eq.مؤرشف&order=created_at.desc`, {
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('فشل في جلب بيانات الأرشيف');
      
      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      // Fallback: Just clear if error
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من استعادة هذا الجهاز إلى المخزن؟')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/Devices?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'متاح' })
      });

      if (!response.ok) throw new Error('فشل استعادة الجهاز');
      
      // Update local state to remove the restored item
      setItems(items.filter(item => item.id !== id));
      alert('تم استعادة الجهاز بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الاستعادة');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.imei1?.includes(searchQuery) ||
      item.imei2?.includes(searchQuery) ||
      item.company?.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (filterType === 'all') return matchesSearch;
    // Add additional logic if you have different types archived
    return matchesSearch;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
            <ArchiveIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">الأرشيف المركزي</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">سجل العناصر المؤرشفة والمحذوفة من النظام</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="flex bg-slate-100 dark:bg-[#080c13] p-1 rounded-xl border border-slate-200 dark:border-white/5">
             <button 
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'all' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
             >
               كل الأجهزة
             </button>
             {/* We can add more tabs here if needed like accessories/spare_parts in the future */}
           </div>
        </div>
      </div>

      {/* Search Bar matching the image */}
      <div className="relative group">
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث في الأرشيف (موديل، IMEI، نوع)..."
          className="block w-full pr-12 pl-4 py-4 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
        />
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
           <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md tracking-wider">Ctrl+K</span>
        </div>
      </div>

      {/* Data Visualization */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">جاري جلب بيانات الأرشيف...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.id}
              className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-500/30 transition-all group relative overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl">
                    <Smartphone className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1" title={item.name}>{item.name}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{item.company || 'غير محدد'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRestore(item.id)}
                  title="استعادة الجهاز"
                  className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors cursor-pointer group/btn"
                >
                  <RefreshCw className="w-5 h-5 text-slate-400 group-hover/btn:text-indigo-500 group-hover/btn:rotate-180 transition-all duration-300" />
                </button>
              </div>

              <div className="space-y-3 mb-6 relative z-10">
                <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-[#080c13] p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <span className="text-slate-500 flex items-center gap-2"><HardDrive className="w-4 h-4"/> IMEI 1</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.imei1 || 'N/A'}</span>
                </div>
                {item.imei2 && (
                  <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-[#080c13] p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <span className="text-slate-500 flex items-center gap-2"><HardDrive className="w-4 h-4"/> IMEI 2</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.imei2}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">تاريخ الأرشفة</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy', { locale: ar }) : 'غير متوفر'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                  <Database className="w-3.5 h-3.5" />
                  مؤرشف
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-24 text-center bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full bg-gradient-to-b from-slate-100 dark:from-white/5 to-transparent pointer-events-none opacity-50" />
          
          <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
             <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
             <div className="relative bg-white dark:bg-[#1a1f26] w-24 h-24 rounded-3xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-white/10 rotate-12 transform hover:rotate-0 transition-all duration-300">
                <PackageOpen className="w-12 h-12 text-indigo-500" />
             </div>
          </div>
          
          <h2 className="text-2xl font-black mb-3 text-slate-800 dark:text-white">لا توجد أجهزة في الأرشيف</h2>
          <p className="text-slate-500 font-medium max-w-sm">
            {searchQuery 
              ? 'لم يتم العثور على أجهزة تتطابق مع بحثك الحالي. جرب كلمات مفتاحية مختلفة.'
              : 'لم تقم بأرشفة أي أجهزة حتى الآن. ستظهر جميع الأجهزة المؤرشفة هنا.'}
          </p>

          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-6 px-6 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              مسح البحث
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
