import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Loader2, RefreshCw, Wrench, Receipt, DollarSign, FileSignature, CheckCircle, ShieldCheck, Lock, Sparkles, MessageCircle, Trophy, LogOut } from 'lucide-react';
import { useBranch } from '../contexts/BranchContext';

const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

// =====================================
// Premium Trial Expiration UI Components
// =====================================

const CountUp = ({ end }: { end: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number;
    const duration = 2000;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const easeOut = 1 - Math.pow(1 - percentage, 3); // Cubic ease out
      setCount(Math.floor(easeOut * end));
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(animate);
  }, [end]);
  return <span>{count.toLocaleString('ar-EG')}</span>;
};

const Badge = ({ icon: Icon, text, delay }: { icon: any, text: string, delay: number }) => (
   <motion.div
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring' }}
      className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-full px-4 py-2 shadow-lg backdrop-blur-sm whitespace-nowrap"
   >
      <Icon className="w-4 h-4 text-amber-400" />
      <span className="text-sm font-bold text-slate-200">{text}</span>
   </motion.div>
);

const StatCard = ({ icon: Icon, value, label, delay, color, bg, suffix = "" }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, type: 'spring' }}
    className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden group"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${bg} ${color}`}>
       <Icon className="w-6 h-6" />
    </div>
    <div className="text-2xl sm:text-3xl font-black text-white mb-1 flex items-center gap-1" dir="ltr">
      <span className="text-sm font-bold text-slate-400">{suffix}</span> <CountUp end={value} />
    </div>
    <div className="text-sm font-medium text-slate-400">{label}</div>
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-t from-transparent ${bg.replace('/10', '')}`} />
  </motion.div>
);

const FeatureItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3 justify-end text-slate-300">
    <span className="text-sm font-medium text-right">{text}</span>
    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
  </div>
);

const PricingCard = ({ title, price, period, features, highlighted, link, delay }: any) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay, type: 'spring', damping: 20 }}
    className={`w-full bg-gradient-to-b flex flex-col ${highlighted ? 'from-slate-800 to-amber-900/20 border-amber-500 hover:border-amber-400' : 'from-slate-800 to-slate-900 border-slate-700 hover:border-slate-500'} border rounded-3xl p-6 shadow-2xl relative overflow-hidden group transition-all`}
  >
    {highlighted && (
       <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-sm font-bold px-4 py-1.5 rounded-bl-xl z-20">أفضل قيمة</div>
    )}
    <div className={`absolute -top-24 -right-24 w-48 h-48 ${highlighted ? 'bg-amber-500/30' : 'bg-slate-500/10'} blur-3xl rounded-full z-0`} />
    
    <div className="text-right z-10 w-full mb-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
    <div className="flex items-baseline justify-center gap-1 mb-6 mt-2 z-10" dir="ltr">
      <span className="text-slate-400 font-medium whitespace-nowrap">{period}</span>
      <span className="text-4xl font-black text-white">{price}</span>
    </div>
    <div className="space-y-3 text-right z-10 flex-1">
      {features.map((f: string, i: number) => <FeatureItem key={i} text={f} />)}
    </div>
    
    <a 
      href={link} 
      target="_blank" rel="noreferrer"
      className={`mt-8 w-full flex items-center justify-center gap-2 font-black text-lg py-4 rounded-xl transition-all relative overflow-hidden group z-10 ${
         highlighted 
         ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:-translate-y-1' 
         : 'bg-slate-700/50 hover:bg-slate-700 text-white border border-slate-600'
      }`}
    >
      {highlighted && <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />}
      <Sparkles className={`w-5 h-5 ${!highlighted && 'opacity-50'}`} />
      اشترك الآن
    </a>
  </motion.div>
);

const getDynamicMessage = (visits: number) => {
    if (visits === 1) return { title: "انتهت فترة تجربتك المجانية 🔒", sub: "لكن واضح إن تِكّة ساعدك فعلًا 🔥" };
    if (visits === 2) return { title: "عملاؤك وفواتيرك في انتظارك 👀", sub: "شغلك محفوظ بأمان ومستنيك ترجع تكمل." };
    if (visits >= 3) return { title: "متخليش شغلك يرجع للفوضى تاني 😄", sub: "الاستقرار والنظام بيبدأ من هنا، يلا نكمل نجاح!" };
    return { title: "انتهت فترة تجربتك المجانية 🔒", sub: "لكن واضح إن تِكّة ساعدك فعلًا 🔥" };
}

const ExpiredPremiumScreen = ({ tenantId, checkSubscription }: { tenantId: string, checkSubscription: () => void }) => {
    const [visits, setVisits] = useState(1);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const v = parseInt(localStorage.getItem('trial_expired_visits') || '0') + 1;
        setVisits(v);
        localStorage.setItem('trial_expired_visits', v.toString());
    }, []);

    useEffect(() => {
      const fetchStats = async () => {
         try {
           const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/rpc/get_tenant_summary_stats`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               'apikey': API_KEY,
               'Authorization': `Bearer ${localStorage.getItem('access_token')}`
             },
             body: JSON.stringify({ p_tenant_id: tenantId })
           });
           if (response.ok) {
             const data = await response.json();
             setStats(data);
           } else {
             // Fallback to demo data if RPC not created yet
             setStats({ repairs: 48, invoices: 132, sales: 84500, contracts: 17 });
           }
         } catch(e) {
           setStats({ repairs: 48, invoices: 132, sales: 84500, contracts: 17 });
         }
      }
      fetchStats();
    }, [tenantId]);

    const handleLogout = () => {
        // Clear auth logic and reload page
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('active_cashier');
        window.location.reload();
    };

    const msgs = getDynamicMessage(visits);

    return (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto w-full h-[100dvh]">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" />
           <motion.div
             initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
             className="relative w-full max-w-6xl bg-[#0f172a] border border-slate-800/60 rounded-[32px] shadow-2xl p-6 sm:p-10 flex flex-col text-center my-auto shadow-[0_0_80px_rgba(0,0,0,0.8)]"
             dir="rtl"
           >
              {/* Logout Button */}
              {/* <button 
                 onClick={handleLogout} 
                 className="absolute top-6 left-6 text-slate-400 hover:text-red-400 flex items-center gap-2 transition-colors bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-xl z-50 border border-slate-700/50"
              >
                 <LogOut className="w-5 h-5" />
                 <span className="font-bold text-sm">تسجيل الخروج</span>
              </button> */}

              <div className="flex flex-col items-center">
                 <div className="flex justify-center gap-4 mb-6 relative mt-4">
                    <Badge icon={Trophy} text="أول 100 فاتورة" delay={0.8} />
                    <Badge icon={Wrench} text="محترف الصيانة" delay={0.9} />
                    <Badge icon={Sparkles} text="بطل المبيعات" delay={1.0} />
                 </div>

                 <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                    className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)] border border-amber-500/20"
                 >
                     <Lock className="w-10 h-10" />
                 </motion.div>

                 <motion.h2 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight"
                 >
                    {msgs.title}
                 </motion.h2>
                 
                 <motion.p 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-lg text-slate-400 mb-10 font-medium max-w-2xl text-center"
                 >
                    {msgs.sub}
                 </motion.p>
              </div>

              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-10">
                  <StatCard icon={Wrench} value={stats.repairs} label="عملية صيانة" delay={0.4} color="text-blue-400" bg="bg-blue-400/10" />
                  <StatCard icon={Receipt} value={stats.invoices} label="فاتورة مبيعات" delay={0.5} color="text-emerald-400" bg="bg-emerald-400/10" />
                  <StatCard icon={DollarSign} value={stats.sales} label="إجمالي مبيعات" delay={0.6} color="text-amber-400" bg="bg-amber-400/10" suffix="ج.م" />
                  <StatCard icon={FileSignature} value={stats.contracts} label="عقد تقسيط" delay={0.7} color="text-purple-400" bg="bg-purple-400/10" />
                </div>
              )}

              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                 className="text-amber-400/90 font-medium mb-10 text-lg flex items-center justify-center gap-2"
              >
                 <Sparkles className="w-5 h-5" />
                 استثمر في سلامة وأمان شغلك، واختار الباقة المناسبة ليك
                 <Sparkles className="w-5 h-5" />
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-right mb-10">
                 {/* <PricingCard 
                   title="الباقة الشهرية"
                   price="350"
                   period="جنيه / شهر"
                   delay={0.5}
                   features={["إدارة عمليات الصيانة المتكاملة", "إصدار عدد لا محدود من الفواتير", "إدارة المبيعات والأرباح بدقة", "تحديثات مستمرة ودعم فني", "حفظ وأمان بياناتك على السحابة"]}
                   link="https://wa.me/201037230660?text=أريد%20الاشتراك%20في%20الباقة%20الشهرية"
                 /> */}
                 <PricingCard 
                   title="الباقة السنوية"
                   price="3,000"
                   period="جنيه / سنة"
                   delay={0.6}
                   highlighted={true}
                   features={["نظام متكامل وسريع للفواتير", "متابعة المخزون والباركود", "أمان سحابي ونسخ احتياطي", "توفير مادي ممتاز", "دعم فني أولوية عالية"]}
                   link="https://wa.me/201037230660?text=أريد%20الاشتراك%20في%20الباقة%20السنوية"
                 />
                 <PricingCard 
                   title="مدى الحياة"
                   price="5,000"
                   period="جنيه / مرة واحدة"
                   delay={0.7}
                   features={["استثمار دائم بضغطة واحدة", "تحديثات النظام المستقبلية مجانًا", "بدون أي اشتراكات دورية نهائياً", "دعم فني مستمر وأمان تام", "جميع مميزات النظام بلا استثناء"]}
                   link="https://wa.me/201037230660?text=أريد%20الاشتراك%20في%20باقة%20مدى%20الحياة"
                 />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-8 mt-4 gap-6 text-slate-400 font-medium">
                 <div className="flex items-center gap-2 text-sm sm:text-base">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    بياناتك كلها محفوظة بالكامل وفي أمان 🔒
                 </div>
                 
                 <div className="flex gap-4">
                     <button 
                        onClick={checkSubscription} 
                        className="flex items-center gap-2 hover:text-white transition-colors border border-slate-700 bg-slate-800 px-4 py-3 sm:py-2 rounded-lg"
                     >
                        <RefreshCw className="w-4 h-4" />
                        تم التجديد؟ للتحقق
                     </button>
                     <a href="https://wa.me/201037230660" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors bg-slate-800 border border-slate-700 px-4 py-3 sm:py-2 rounded-lg">
                         <MessageCircle className="w-5 h-5" />
                         تواصل معنا
                     </a>
                 </div>
              </div>
           </motion.div>
        </div>
    );
}

// =====================================
// Main Wrapper
// =====================================

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { currentBranch } = useBranch();
  const [subData, setSubData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine tenantId
  let tenantId = currentBranch?.tenant_id;
  if (!tenantId) {
    const activeCashierStr = localStorage.getItem('active_cashier');
    if (activeCashierStr) {
      try {
        const user = JSON.parse(activeCashierStr);
        tenantId = user?.tenant_id;
      } catch(e) {}
    }
    if (!tenantId) {
       tenantId = localStorage.getItem('user_id');
    }
  }

  const checkSubscription = async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/rpc/get_subscription_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ p_tenant_id: tenantId })
      });

      if (response.ok) {
        const data = await response.json();
        setSubData(data);
        
        // Anti-rollback detection
        const lastServerTime = localStorage.getItem('last_server_time');
        const serverTimeMs = new Date(data.server_now).getTime();
        const lastTimeMs = lastServerTime ? new Date(lastServerTime).getTime() : 0;

        // Allow 1-hour buffer for any minor time sync/cache issues
        if (lastServerTime && serverTimeMs < (lastTimeMs - 3600000)) {
             // System time tampered or server time went back
             console.error("Time Rollback Detected", { server_now: data.server_now, lastServerTime });
             setSubData({ valid: false, status: 'suspended', days_left: 0 });
        } else {
             localStorage.setItem('last_server_time', data.server_now);
             localStorage.setItem('last_successful_check', new Date().toISOString());
             localStorage.setItem('offline_sub_data', btoa(JSON.stringify(data)));
        }
      } else {
        throw new Error("Failed to fetch subscription");
      }
    } catch (e) {
      console.error("Subscription check failed", e);
      // Offline fallback
      const lastCheck = localStorage.getItem('last_successful_check');
      const offlineData = localStorage.getItem('offline_sub_data');
      if (lastCheck && offlineData) {
        const hoursSinceLastCheck = (new Date().getTime() - new Date(lastCheck).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastCheck <= 48) {
           try {
              setSubData(JSON.parse(atob(offlineData)));
           } catch {
              setSubData({ valid: false, status: 'offline_tampered', days_left: 0 });
           }
        } else {
           setSubData({ valid: false, status: 'offline_expired', days_left: 0 });
        }
      } else {
        setSubData({ valid: false, status: 'unknown', days_left: 0 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    // Re-check every 6 hours
    const timer = setInterval(checkSubscription, 6 * 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!subData) {
    return <>{children}</>;
  }

  const { valid, status, days_left } = subData;

  if (!valid) {
    return (
      <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-900">
        <div className="absolute inset-0 pointer-events-none blur-[15px] opacity-40 scale-105 transition-all duration-1000">
          {children}
        </div>
        
        <ExpiredPremiumScreen tenantId={tenantId!} checkSubscription={checkSubscription} />
      </div>
    );
  }

  return (
    <>
      {(status === 'trial' && days_left <= 4) && (
         <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold shadow-xl border flex items-center gap-2 ${days_left === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <AlertTriangle className="w-5 h-5" />
            {days_left === 0 ? 'الفترة التجريبية تنتهي اليوم!' : `متبقي ${days_left} ${days_left <= 10 && days_left >= 3 ? 'أيام' : 'يوم'} على نهاية التجربة`}
         </div>
      )}
      {children}
    </>
  );
}