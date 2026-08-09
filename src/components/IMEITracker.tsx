import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, History, AlertTriangle, Monitor, Wrench, Smartphone, RefreshCcw, Package } from 'lucide-react';
import { format } from 'date-fns';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

interface IMEIHistoryNode {
  id: string;
  type: 'purchase' | 'sale' | 'repair' | 'return';
  date: string;
  title: string;
  details: string;
  actor: string;
  price?: number;
  icon: any;
  color: string;
}

export default function IMEITracker() {
  const [imei, setImei] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<IMEIHistoryNode[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  
  // Available devices
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  useEffect(() => {
    fetchAvailableDevices();
  }, []);

  const fetchAvailableDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`
      };
      
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Devices?status=eq.available&order=created_at.desc&limit=50`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAvailableDevices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const executeSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setSearchQuery(queryToSearch);
    setImei(queryToSearch);

    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`
      };

      const query = encodeURIComponent(queryToSearch);

      // 1. Search in Devices (Purchases, Current Stock)
      let devicesRes = await fetch(`${SUPABASE_URL}/rest/v1/Devices?or=(imei1.eq.${query},imei2.eq.${query})`, { headers });
      let devicesData = devicesRes.ok ? await devicesRes.json() : [];

      let productIds = devicesData.map((d: any) => d.id);
      let salesData: any[] = [];
      
      if (productIds.length > 0) {
        // 2. Search in Sales Items using the product_id we found
        const productIdsStr = productIds.join(',');
        let salesRes = await fetch(`${SUPABASE_URL}/rest/v1/Sales_Items?select=*,Sales_Invoices(created_at,customer_name)&product_id=in.(${productIdsStr})`, { headers });
        salesData = salesRes.ok ? await salesRes.json() : [];
      } else {
        // Fallback: Sales_Items might not have imei, so we try anyway but we catch the error
        let salesRes: any = await fetch(`${SUPABASE_URL}/rest/v1/Sales_Items?select=*,Sales_Invoices(created_at,customer_name)&or=(product_name.ilike.*${query}*)`, { headers }).catch(() => ({ ok: false }));
        if (salesRes.ok) salesData = await salesRes.json();
      }

      // 3. Search in Repairs
      let repairsRes: any = await fetch(`${SUPABASE_URL}/rest/v1/Repairs?imei=eq.${query}`, { headers }).catch(() => ({ ok: false }));
      let repairsData = repairsRes.ok ? await repairsRes.json() : [];

      // Aggregate Timeline Events
      let timeline: IMEIHistoryNode[] = [];
      setDeviceInfo(null);

      devicesData.forEach((d: any) => {
        if (!deviceInfo) setDeviceInfo(d);
        // Add to timeline regardless of entry_type, it's always an addition to stock
        let entryTitle = 'دخول للمخزن';
        if (d.entry_type === 'purchase') entryTitle += ' (شراء)';
        else if (d.entry_type === 'import') entryTitle += ' (استيراد إكسيل)';
        else entryTitle += ' (إضافة يدوية)';

        timeline.push({
          id: `p-${d.id}`,
          type: 'purchase',
          date: d.created_at,
          title: entryTitle,
          details: `تم الإضافة للمخزن كـ ${d.condition === 'مستعمل' ? 'مستعمل' : 'جديد'}. الحالة الآن: ${d.status === 'sold' ? 'مُباع' : 'متاح'}`,
          actor: d.source || d.supplier || 'غير محدد',
          price: d.cost_price,
          icon: Smartphone,
          color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
        });
      });

      salesData.forEach((s: any) => {
        if (!deviceInfo) setDeviceInfo({name: s.product_name || s.item_name});
        timeline.push({
          id: `s-${s.id}`,
          type: 'sale',
          date: s.created_at || (s.Sales_Invoices && s.Sales_Invoices.created_at) || new Date().toISOString(),
          title: 'عملية بيع',
          details: `تم بيع الجهاز في فاتورة رقم ${s.invoice_id}`,
          actor: (s.Sales_Invoices && s.Sales_Invoices.customer_name) || 'عميل محلي / نقدي',
          price: s.unit_price,
          icon: Monitor,
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
        });
      });

      repairsData.forEach((r: any) => {
        if (!deviceInfo) setDeviceInfo({name: r.device_name});
        timeline.push({
          id: `r-${r.id}`,
          type: 'repair',
          date: r.created_at,
          title: 'صيانة',
          details: `عطل: ${r.issue} - الحالة: ${r.status}`,
          actor: r.customer_name || 'غير محدد',
          price: r.total_amount,
          icon: Wrench,
          color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
        });
      });

      // Sort timeline by date
      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistory(timeline);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch(searchQuery);
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-[#0b101a] text-slate-900 dark:text-white p-4 sm:p-6 lg:p-8 rounded-b-3xl min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 bg-white dark:bg-[#161b22] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 w-full md:w-auto text-center md:text-right">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
            <div className="p-3 bg-teal-50 dark:bg-teal-500/10 rounded-2xl text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20 shadow-inner">
              <History className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">قصة السيريال <span className="text-teal-500">(IMEI)</span></h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">اكتب السيريال أو الباركود لأي جهاز وتتبع قصته بالكامل</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="w-full md:w-[450px] relative z-10">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="اكتب رقم السيريال، IMEI، أو الباركود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b101a] border-2 border-slate-200 dark:border-white/10 rounded-2xl py-4 ps-14 pe-32 text-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all font-mono"
            />
            <Search className="w-6 h-6 text-slate-400 absolute start-4" />
            <button 
              type="submit" 
              disabled={isLoading || !searchQuery.trim()}
              className="absolute end-2 top-1/2 -translate-y-1/2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : 'بحث'}
            </button>
          </div>
        </form>
      </div>

      {/* Main Content Area */}
      {hasSearched && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {history.length === 0 ? (
            <div className="bg-white dark:bg-[#161b22] rounded-3xl p-12 text-center border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">السيريال غير موجود!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-lg">لم نعثر على أي سجلات أو حركات مرتبطة بهذا السيريال ({imei})</p>
              <button 
                onClick={() => {setSearchQuery(''); setHasSearched(false);}}
                className="px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl font-bold transition-colors"
              >
                بحث جديد
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {deviceInfo && (
                <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/20 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <h2 className="text-slate-800 dark:text-white text-2xl font-bold">{deviceInfo.name || deviceInfo.device_name || 'جهاز غير معروف'}</h2>
                    <p className="text-teal-600 dark:text-teal-400 font-mono mt-1 font-bold tracking-widest text-lg">{imei}</p>
                  </div>
                  {deviceInfo.status && (
                    <span className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">
                      {deviceInfo.status || 'متاح'}
                    </span>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div className="relative ps-8 border-s-4 border-slate-200 dark:border-slate-800/80 space-y-10 my-10 ms-4">
                {history.map((node, i) => {
                  const Icon = node.icon;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={node.id} 
                      className="relative"
                    >
                      {/* Timeline Dot */}
                      <div className={`absolute -start-[54px] top-0 w-12 h-12 rounded-full border-4 border-slate-50 dark:border-[#0b101a] flex items-center justify-center shadow-sm z-10 ${node.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="bg-white dark:bg-[#161b22] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute start-0 top-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity bg-teal-500"></div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 font-mono mb-1 block">
                              {format(new Date(node.date), 'dd/MM/yyyy • hh:mm a')}
                            </span>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                              {node.title}
                            </h3>
                          </div>
                          {node.price !== undefined && (
                            <div className="bg-slate-50 dark:bg-[#0b101a] px-4 py-2 rounded-xl text-center border border-slate-100 dark:border-white/5">
                              <span className="block text-[10px] text-slate-400 mb-0.5">القيمة</span>
                              <strong className="text-lg font-mono text-slate-800 dark:text-white font-bold">{node.price.toLocaleString()} <span className="text-xs">ج.م</span></strong>
                            </div>
                          )}
                        </div>

                        <div className="text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-100 dark:border-transparent mb-4">
                          {node.details}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <span className="bg-slate-200 dark:bg-white/10 px-2 py-1 rounded">الطرف المعني:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{node.actor}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State / Available Devices List */}
      {!hasSearched && !isLoading && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">الأجهزة المتاحة حالياً ({availableDevices.length})</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">اضغط على أي جهاز لمعرفة سيرته وقصته بالكامل</p>
              </div>
            </div>

            {isLoadingDevices ? (
              <div className="flex justify-center items-center py-20">
                <RefreshCcw className="w-8 h-8 text-teal-500 animate-spin" />
              </div>
            ) : availableDevices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Monitor className="w-24 h-24 text-slate-400 mb-6" />
                <p className="text-xl font-bold text-slate-500">لا يوجد أجهزة متاحة في المخزن حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableDevices.map((device) => {
                  const clickId = device.imei1 || device.barcode || device.imei2 || '';
                  return (
                    <button
                      key={device.id}
                      onClick={() => {
                        if (clickId) executeSearch(clickId);
                      }}
                      className="text-right p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md transition-all group bg-slate-50 dark:bg-[#0b101a]"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h4 className="font-bold text-slate-800 dark:text-white truncate">{device.company} {device.model}</h4>
                        <span className="text-xs bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded font-bold whitespace-nowrap">
                          {device.condition}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                          <span className="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px]">IMEI 1</span> 
                          {device.imei1 || '-'}
                        </p>
                        {device.imei2 && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                            <span className="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px]">IMEI 2</span> 
                            {device.imei2}
                          </p>
                        )}
                        {!device.imei1 && !device.imei2 && device.barcode && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                            <span className="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px]">باركود</span> 
                            {device.barcode}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>عرض قصة السيريال</span>
                        <Search className="w-4 h-4" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
