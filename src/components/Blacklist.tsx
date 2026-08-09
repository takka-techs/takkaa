import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, ShieldCheck, Search, Plus, ScanLine, 
  AlertTriangle, Phone, User, Monitor, CheckCircle2, 
  Clock, X, FileText, Loader2, Trash2, Edit, ChevronDown, Check
} from 'lucide-react';
import { format } from 'date-fns';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface BlacklistRecord {
  id: string;
  created_at: string;
  imei: string;
  brand: string;
  model: string;
  status: 'stolen' | 'lost' | 'recovered' | 'investigating';
  reporter_name: string;
  reporter_phone: string;
  notes: string;
  evidence_url: string;
  user_id?: string;
}

export default function Blacklist() {
  const [records, setRecords] = useState<BlacklistRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  
  const currentUserId = localStorage.getItem('user_id');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` };
      
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Blacklist?order=created_at.desc`, { headers });
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذا الجهاز من البلاك ليست بشكل نهائي؟')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Blacklist?id=eq.${id}`, {
        method: 'DELETE',
        headers
      });
      if(res.ok) {
        setRecords(records.filter(r => r.id !== id));
      } else {
        alert("فشل الحذف");
      }
    } catch (e) {
      console.error(e);
      alert("خطأ في الاتصال");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Blacklist?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if(res.ok) {
        setRecords(records.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
        setEditingStatusId(null);
      } else {
        alert("فشل التحديث");
      }
    } catch(e) {
      console.error(e);
      alert("خطأ في الاتصال");
    }
  };

  const stats = {
    stolen: records.filter(r => r.status === 'stolen').length,
    lost: records.filter(r => r.status === 'lost').length,
    investigating: records.filter(r => r.status === 'investigating').length,
    recovered: records.filter(r => r.status === 'recovered').length,
  };

  const filteredRecords = records.filter(r => 
    r.imei.includes(searchQuery) ||
    (r.reporter_name && r.reporter_name.includes(searchQuery)) ||
    (r.reporter_phone && r.reporter_phone.includes(searchQuery))
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'stolen': return { label: 'مسروق', color: 'bg-red-500 text-white border-red-600', icon: AlertTriangle, badge: '🔴 مسروق' };
      case 'lost': return { label: 'مفقود', color: 'bg-amber-500 text-white border-amber-600', icon: Search, badge: '🟡 مفقود' };
      case 'investigating': return { label: 'تحت التحقيق', color: 'bg-slate-700 text-white border-slate-800', icon: Clock, badge: '⚫ تحت التحقيق' };
      case 'recovered': return { label: 'تم استرجاعه', color: 'bg-emerald-500 text-white border-emerald-600', icon: CheckCircle2, badge: '🟢 تم استرجاعه' };
      default: return { label: 'مجهول', color: 'bg-slate-500 text-white border-slate-600', icon: AlertTriangle, badge: '🔘 مجهول' };
    }
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-[#0b101a] text-slate-900 dark:text-white p-4 sm:p-6 lg:p-8 rounded-b-3xl min-h-screen font-sans" dir="rtl">
      
      {/* Header & Stats */}
      <div className="bg-slate-900 dark:bg-[#111620] p-8 rounded-3xl mb-8 relative overflow-hidden border border-slate-800 dark:border-white/5">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-red-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-red-500 border-4 border-red-400/30 rounded-2xl text-white shadow-xl shadow-red-500/20">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">نظام الأمان <span className="text-red-400 opacity-90 text-2xl bg-white/10 px-3 py-1 rounded-xl ms-2">Blacklist</span></h1>
              <p className="text-slate-400 text-lg font-medium max-w-xl">
                نظام حماية شامل متصل بمنظومة المبيعات والصيانة لشل حركة الأجهزة المسروقة ومنع تداولها.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={() => setIsCheckModalOpen(true)}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all flex items-center gap-3 backdrop-blur-md border border-white/10 shadow-lg flex-1 lg:flex-none justify-center"
            >
              <ScanLine className="w-5 h-5" />
              فحص IMEI سريع
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all flex items-center gap-3 shadow-lg shadow-red-500/20 flex-1 lg:flex-none justify-center"
            >
              <Plus className="w-5 h-5" />
              إضافة جهاز للبلاك ليست
            </button>
          </div>
        </div>

        {/* Powerful Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 relative z-10">
          <div className="bg-black/40 border border-red-500/20 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2 opacity-80 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-widest">المسروقة</h3>
            </div>
            <div className="text-4xl font-black text-white">{stats.stolen}</div>
          </div>
          
          <div className="bg-black/40 border border-amber-500/20 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2 opacity-80 text-amber-400">
              <Search className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-widest">المفقودة</h3>
            </div>
            <div className="text-4xl font-black text-white">{stats.lost}</div>
          </div>

          <div className="bg-black/40 border border-emerald-500/20 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2 opacity-80 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-widest">تم استرجاعها</h3>
            </div>
            <div className="text-4xl font-black text-white">{stats.recovered}</div>
          </div>

          <div className="bg-black/40 border border-slate-500/20 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2 opacity-80 text-slate-400">
              <Clock className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-widest">تحت التحقيق</h3>
            </div>
            <div className="text-4xl font-black text-white">{stats.investigating}</div>
          </div>
        </div>
      </div>

      {/* Modern Search */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="بحث قوي برقم الـ IMEI، اسم المبلغ، أو رقم التليفون..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl py-4 ps-14 pe-6 text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-mono shadow-sm"
          />
          <Search className="w-6 h-6 text-slate-400 absolute start-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5 shadow-inner">
            <ShieldCheck className="w-16 h-16 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">الدنيا أمان!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-lg mx-auto mb-8 leading-relaxed">
            مفيش أي أجهزة متسجلة في نظام الأمان حالياً. لو في أي جهاز مسروق أو مفقود تقدر تسجله عشان توقف حركته في محلك.
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-500/20 text-lg flex items-center gap-3 mx-auto"
          >
            <Plus className="w-6 h-6" />
            إضافة بلاغ جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => {
            const statusConfig = getStatusConfig(record.status);
            const isOwner = record.user_id === currentUserId;
            
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={record.id}
                className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow group relative flex flex-col"
              >
                {/* Status Bar */}
                <div className={`h-2 w-full ${statusConfig.color.split(' ')[0]}`}></div>
                
                <div className="p-6 flex-1 flex flex-col">
                  {/* Actions for owner */}
                  {isOwner && (
                    <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        title="تعديل الحالة"
                        onClick={() => setEditingStatusId(editingStatusId === record.id ? null : record.id)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        title="حذف البلاغ"
                        onClick={() => handleDelete(record.id)}
                        className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-extrabold text-xl text-slate-900 dark:text-white pr-2">{record.brand || 'جهاز مجهول'} {record.model}</h3>
                      <p className="text-slate-500 text-sm mt-1 font-mono tracking-widest text-[16px] font-bold">{record.imei}</p>
                    </div>
                    {editingStatusId === record.id ? (
                      <select 
                        value={record.status}
                        onChange={(e) => handleUpdateStatus(record.id, e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border-none text-sm font-bold rounded-xl px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none pr-8"
                      >
                        <option value="stolen">🔴 مسروق</option>
                        <option value="lost">🟡 مفقود</option>
                        <option value="investigating">⚫ قيد التحقيق</option>
                        <option value="recovered">🟢 استرجاعه</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm shrink-0 mt-1 ${statusConfig.color}`}>
                        {statusConfig.badge}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 space-y-3 border border-slate-100 dark:border-white/5 mb-6 flex-1">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm"><User className="w-4 h-4" /></div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">المُبلغ</div>
                        <div className="text-sm font-bold">{record.reporter_name || 'غير معروف'}</div>
                      </div>
                    </div>
                    {record.reporter_phone && (
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                        <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm"><Phone className="w-4 h-4" /></div>
                        <div>
                           <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">التليفون</div>
                           <div className="text-sm font-bold font-mono">{record.reporter_phone}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {record.notes && (
                    <div className="flex bg-amber-50 dark:bg-amber-500/5 text-amber-700 dark:text-amber-400 text-sm p-4 rounded-2xl font-medium border border-amber-200 dark:border-amber-500/20 mb-6 leading-relaxed">
                      <FileText className="w-5 h-5 me-3 shrink-0 opacity-70" />
                      {record.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">تاريخ البلاغ</div>
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300">{format(new Date(record.created_at), 'dd MMM yyyy')}</div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#161b22] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <ShieldAlert className="w-7 h-7 text-red-500" />
                  تسجيل في نظام الأمان
                </h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <AddBlacklistForm onClose={() => setIsAddModalOpen(false)} onSuccess={fetchRecords} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Check Modal */}
      <AnimatePresence>
         {isCheckModalOpen && (
           <QuickCheckModal onClose={() => setIsCheckModalOpen(false)} />
         )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------
// Add Form Component
const AddBlacklistForm = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    imei: '',
    brand: '',
    model: '',
    status: 'stolen',
    reporter_name: '',
    reporter_phone: '',
    notes: '',
    evidence_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imei) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      const res = await fetch(`${SUPABASE_URL}/rest/v1/Blacklist`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ ...formData, user_id: userId })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errData = await res.json().catch(() => ({ message: 'غير معروف' }));
        alert(`حدث خطأ من الداتا بيز: ${errData.message || JSON.stringify(errData)}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`مشكلة في الاتصال: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Evidence Banner */}
      <div className="bg-red-50 dark:bg-red-500/5 text-red-700 dark:text-red-400 p-4 rounded-2xl flex items-start gap-4 border border-red-200 dark:border-red-500/20">
        <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-base mb-1">تسجيل أمني حساس</h4>
          <p className="text-sm font-medium opacity-90">الإدراج في البلاك ليست هيمنع بيعه أو صيانته في النظام تماماً. يرجى التأكد من البيانات.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">رقم IMEI *</label>
          <div className="relative">
            <input 
              type="text" required
              value={formData.imei} onChange={(e) => setFormData({...formData, imei: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 font-mono text-xl focus:border-red-500" 
            />
            <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><ScanLine className="w-5 h-5"/></button>
          </div>
        </div>
        
        <div className="space-y-2">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">الماركة (اختياري)</label>
           <input type="text" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-red-500" />
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">الموديل (اختياري)</label>
           <input type="text" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-red-500" />
        </div>

        <div className="space-y-2 md:col-span-2">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">حالة الجهاز *</label>
           <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-red-500 font-bold">
             <option value="stolen">🔴 مسروق</option>
             <option value="lost">🟡 مفقود</option>
             <option value="investigating">⚫ تحت التحقيق</option>
             <option value="recovered">🟢 تم استرجاعه</option>
           </select>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">اسم المُبلغ *</label>
           <input type="text" required value={formData.reporter_name} onChange={(e) => setFormData({...formData, reporter_name: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-red-500" />
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">رقم تليفونه *</label>
           <input type="text" required value={formData.reporter_phone} onChange={(e) => setFormData({...formData, reporter_phone: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-red-500 font-mono" dir="ltr" />
        </div>
        
        <div className="space-y-2 md:col-span-2">
           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ملاحظات والتفاصيل</label>
           <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-red-500" />
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-500/20 text-lg flex items-center justify-center gap-3">
        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ShieldAlert className="w-6 h-6" /> تأكيد الإدراج في البلاك ليست</>}
      </button>
    </form>
  )
}

// ----------------------------------------------------
// Quick Check Component
const QuickCheckModal = ({ onClose }: { onClose: () => void }) => {
  const [imei, setImei] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!imei.trim()) return;
    
    setIsChecking(true);
    setSearched(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` };
      
      const query = encodeURIComponent(imei);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Blacklist?imei=eq.${query}`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        setResult(data.length > 0 ? data[0] : null);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#161b22] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 p-8 text-center relative"
      >
        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-white/10 shadow-inner">
          <ScanLine className="w-10 h-10 text-slate-500" />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">فحص السيريال السريع</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">اكتب أو سكان السيريال عشان تتأكد إن الجهاز سليم</p>
        
        <form onSubmit={handleCheck} className="space-y-4">
          <input 
            type="text" autoFocus required placeholder="IMEI / Barcode..." 
            value={imei} onChange={(e) => setImei(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0b101a] border-2 border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-center text-xl font-mono focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all font-bold tracking-widest text-slate-900 dark:text-white"
          />
          <button type="submit" disabled={isChecking} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-[#161b22] rounded-2xl font-bold transition-all shadow-xl hover:scale-[1.02] active:scale-95 text-lg flex items-center justify-center gap-3">
            {isChecking ? <Loader2 className="w-6 h-6 animate-spin" /> : 'افحص فوراً'}
          </button>
        </form>

        {searched && !isChecking && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            {result ? (
              <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-500 p-6 rounded-2xl">
                 <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
                 <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mb-2">تحذير! الجهاز مسجل في نظام الأمان</h3>
                 <p className="text-red-800 dark:text-red-300 font-medium mb-4">هذا الجهاز مبلغ عنه وممنوع تداوله</p>
                 <div className="bg-white dark:bg-black/20 p-3 rounded-xl text-start space-y-2">
                   <div className="text-sm"><strong>الحالة:</strong> {result.status === 'stolen' ? 'مسروق' : result.status === 'lost' ? 'مفقود' : 'تحت التحقيق'}</div>
                   <div className="text-sm"><strong>المُبلغ:</strong> {result.reporter_name}</div>
                   <div className="text-sm"><strong>التليفون:</strong> <span className="font-mono">{result.reporter_phone}</span></div>
                 </div>
              </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500 p-6 rounded-2xl">
                 <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                 <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-2">الجهاز سليم 100%</h3>
                 <p className="text-emerald-800 dark:text-emerald-300 font-medium">الجهاز غير مدرج في نظام الأمان (البلاك ليست) ويمكنك التعامل عليه بأمان.</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
