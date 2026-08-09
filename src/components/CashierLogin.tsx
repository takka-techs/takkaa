import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface CashierLoginProps {
  onSuccess: (user: any) => void;
  onLogoutOwner: () => void;
}

export default function CashierLogin({ onSuccess, onLogoutOwner }: CashierLoginProps) {
  const { settings } = useSettings();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      if (!token || !userId) {
        throw new Error('جلسة النظام غير صالحة. يرجى تسجيل الدخول كمسؤول مجدداً.');
      }

      // We use the owner's token to query the app_users table
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/app_users?username=eq.${username}&password=eq.${password}&status=eq.نشط`, 
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('فشل الاتصال بالخادم');
      }

      const users = await response.json();

      if (users.length === 0) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب غير نشط.');
      }

      const cashier = users[0];
      
      // Save cashier session
      localStorage.setItem('active_cashier', JSON.stringify(cashier));
      
      // Update last login
      await fetch(`${SUPABASE_URL}/rest/v1/app_users?id=eq.${cashier.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ last_login: new Date().toISOString() })
      });

      onSuccess(cashier);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c13] text-slate-900 dark:text-white relative overflow-hidden flex flex-col items-center justify-center p-4" dir="rtl">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[100%] h-[40%] bg-gradient-to-b from-primary-900/20 to-transparent pointer-events-none" />

      {/* Header Logo */}
      <div className="absolute top-8 start-8 flex items-center gap-4 z-20">
        {settings.logo ? (
          <img src={settings.logo} alt="Logo" className="h-14 w-auto max-w-[150px] object-contain drop-shadow-md" />
        ) : (
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Lock className="w-5 h-5 text-white" />
          </div>
        )}
        <span className="font-black text-xl tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{settings.companyName}</span>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top Bar inside card */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
          
          <div className="text-center mb-8 mt-2">
            <div className="w-20 h-20 bg-slate-100 dark:bg-[#1a2333] rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/5 shadow-inner">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">تسجيل دخول الموظف</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">نظام جاهز.. يرجى إثبات هويتك للبدء</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm text-center font-bold">
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ms-1">اسم المستخدم</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="block w-full ps-11 pe-4 py-3.5 bg-slate-50 dark:bg-[#1a2333] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none font-bold" 
                  placeholder="أدخل اسم المستخدم..."
                  dir="ltr"
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ms-1">كلمة المرور / الرمز السري</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="block w-full ps-11 pe-4 py-3.5 bg-slate-50 dark:bg-[#1a2333] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none font-mono" 
                  placeholder="••••••" 
                  dir="ltr"
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#11151c] focus:ring-primary-500 transition-all disabled:opacity-70 mt-4 shadow-lg shadow-primary-500/25"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'دخول للنظام'}
              {!isLoading && <ArrowRight className="w-5 h-5 rotate-180" />}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 text-center">
             <button 
                onClick={onLogoutOwner}
                className="text-sm font-bold text-slate-500 hover:text-red-500 transition-colors"
              >
                هل أنت صاحب المحل؟ تسجيل الخروج من الجهاز
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
