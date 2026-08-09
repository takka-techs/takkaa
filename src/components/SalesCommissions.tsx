import React, { useState, useEffect } from 'react';
import { useBranch } from '../contexts/BranchContext';
import { DollarSign, Search, Calendar, ChevronDown, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export default function SalesCommissions() {
  const { currentBranch, isOwner } = useBranch();
  const [employees, setEmployees] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, currentBranch]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` };
      
      const customDate = new Date(selectedYear, selectedMonth - 1, 1);
      const nextMonth = new Date(selectedYear, selectedMonth, 1);
      
      // Fetch employees
      const empRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&tenant_id=eq.${tenantId}`, { headers });
      if (empRes.ok) setEmployees(await empRes.json());
      
      // Fetch invoices mapping month and salesman
      const invRes = await fetch(`${SUPABASE_URL}/rest/v1/Sales_Invoices?select=*,Sales_Items(*)&salesman_id=not.is.null&created_at=gte.${customDate.toISOString()}&created_at=lt.${nextMonth.toISOString()}`, { headers });
      if (invRes.ok) setInvoices(await invRes.json());
      
      // Fetch all products just in case to find purchase_price for profit
      const dRes = await fetch(`${SUPABASE_URL}/rest/v1/Devices?select=id,selling_price,purchase_price&tenant_id=eq.${tenantId}`, { headers });
      const aRes = await fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=id,sell_price,buy_price&tenant_id=eq.${tenantId}`, { headers });
      const spRes = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=id,price,cost_price&tenant_id=eq.${tenantId}`, { headers });
      
      const pData: any[] = [];
      if (dRes.ok) pData.push(...(await dRes.json()).map((p:any) => ({ id: p.id, type: 'device', buy: p.purchase_price })));
      if (aRes.ok) pData.push(...(await aRes.json()).map((p:any) => ({ id: p.id, type: 'accessory', buy: p.buy_price })));
      if (spRes.ok) pData.push(...(await spRes.json()).map((p:any) => ({ id: p.id, type: 'spare_part', buy: p.cost_price })));
      
      setProducts(pData);
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCommission = (emp: any) => {
    const empInvoices = invoices.filter(inv => inv.salesman_id === emp.id && inv.status !== 'مرتجعة');
    if (!empInvoices.length || emp.commission_type === 'none') {
       return { total: 0, itemsCount: 0, invoicesCount: 0 };
    }
    
    let totalComm = 0;
    let itemsCount = 0;
    
    empInvoices.forEach(inv => {
       (inv.Sales_Items || []).forEach((item: any) => {
           if (item.item_name?.includes('(مرتجع)') || item.product_name?.includes('(مرتجع)')) return;
           
           const pType = item.product_type || item.item_type || 'device';
           if (emp.commission_target === 'devices_only' && pType !== 'device') return;
           
           if (emp.commission_type === 'fixed_amount') {
               totalComm += (Number(emp.commission_value || 0) * (item.quantity || 1));
               itemsCount += (item.quantity || 1);
           } else if (emp.commission_type === 'profit_percentage') {
               const pRecord = products.find(p => p.id === (item.product_id || item.item_id) && p.type === pType);
               // الأولوية دايماً لسعر التكلفة المتسجل وقت الفاتورة عشان التعديلات المستقبلية متبوظش العمولات القديمة
               const buyPrice = item.cost_price !== undefined ? item.cost_price : (pRecord?.buy || 0);
               const itemTotalSalesPrice = item.total_price;
               const profit = itemTotalSalesPrice - (buyPrice * (item.quantity || 1));
               if (profit > 0) {
                  totalComm += profit * (Number(emp.commission_value || 0) / 100);
               }
               itemsCount += (item.quantity || 1);
           }
       });
    });
    
    return { total: totalComm, itemsCount, invoicesCount: empInvoices.length };
  };

  const displayEmps = employees.filter(emp => emp.full_name?.includes(searchTerm) && emp.commission_type && emp.commission_type !== 'none').map(emp => {
      const stats = calculateCommission(emp);
      return { ...emp, stats };
  });

  return (
    <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-3 bg-gradient-to-br from-indigo-900/40 to-[#11151c] border border-indigo-500/20 rounded-3xl p-6">
            <DollarSign className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">عمولات المبيعات 📈</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">تابع عمولات البائعين بناءً على المبيعات الشهرية ونظام العمولة الخاص بكل بائع.</p>
            </div>
        </div>

        <div className="flex gap-4">
            <div className="relative">
                 <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                 <select 
                   value={selectedMonth}
                   onChange={(e) => setSelectedMonth(Number(e.target.value))}
                   className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl pr-10 pl-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                 >
                   {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                 </select>
            </div>
            <div className="relative">
                 <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                 <select 
                   value={selectedYear}
                   onChange={(e) => setSelectedYear(Number(e.target.value))}
                   className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 pr-10 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                 >
                   {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
            </div>
        </div>
        
        {isLoading ? (
            <div className="text-center py-10 text-slate-500">جاري التحميل...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayEmps.map(emp => (
                 <div key={emp.id} className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-slate-900 dark:text-white">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">{emp.full_name}</h3>
                            <p className="text-xs text-slate-500 font-mono">نظام العمولة: {emp.commission_type === 'fixed_amount' ? 'رقم ثابت' : 'نسبة من الربح'} ({emp.commission_value}{emp.commission_type === 'fixed_amount' ? ' ج.م' : '%'})</p>
                        </div>
                    </div>
                    
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-500/20 text-center mb-4">
                        <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">العمولة المستحقة للشهر المختار</p>
                        <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">{emp.stats?.total?.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:2})} ج.م</p>
                    </div>

                    <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-1"><FileText className="w-4 h-4"/> {emp.stats?.invoicesCount} فواتير</div>
                        <div className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> {emp.stats?.itemsCount} قطع مباعة</div>
                    </div>
                 </div>
              ))}
              
              {displayEmps.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-500">لا يوجد بيانات للعرض.</div>
              )}
            </div>
        )}
    </div>
  );
}
