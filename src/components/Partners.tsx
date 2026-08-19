import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Handshake, Plus, Calculator, Edit, Trash2, 
  WalletCards, Calendar as CalendarIcon, RefreshCw, X, Shield, Search, Info, DollarSign, ListOrdered, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Partners() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editPartner, setEditPartner] = useState<any>(null);
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [transactionsPartner, setTransactionsPartner] = useState<any>(null);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [deletePartnerId, setDeletePartnerId] = useState<any>(null);
  const [showProfitSuccess, setShowProfitSuccess] = useState(false);

  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    partnership_type: 'المحل كله',
    profit_percentage: 0,
    investment: 0,
    start_date: '',
    end_date: '',
    terms: '',
    notes: '',
    status: 'نشط'
  });

  // Wallets & Investment state
  const [wallets, setWallets] = useState<any[]>([]);
  const [investments, setInvestments] = useState([{ wallet_id: '', amount: 0 }]);

  // Profit Calculation Form
  const [profitMonth, setProfitMonth] = useState('');
  const [profitPayoutMode, setProfitPayoutMode] = useState<'accrue' | 'payout'>('accrue');
  const [profitWalletId, setProfitWalletId] = useState<string>('');
  const [profitCalculation, setProfitCalculation] = useState<any>(null);

  // Transactions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txFormData, setTxFormData] = useState({
    type: 'إيداع رأس مال',
    amount: 0,
    description: ''
  });
  const [txWalletId, setTxWalletId] = useState<string>('');

  const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
  const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  const token = localStorage.getItem('access_token');

  const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`${baseUrl}/partners?select=*&order=created_at.desc`, { headers });
      if (!res.ok) throw new Error('فشل جلب بيانات الشركاء');
      const data = await res.json();
      setPartners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallets = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`${baseUrl}/wallets?tenant_id=eq.${userId}`, { headers });
      if (res.ok) {
         const data = await res.json();
         setWallets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPartners();
    fetchWallets();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalPercentage = partners.reduce((sum, p) => sum + (p.profit_percentage || 0), 0);
      if (totalPercentage + Number(formData.profit_percentage) > 100) {
         alert(`عفواً، إجمالي نسب الشركاء (${totalPercentage}%) مع النسبة المدخلة يتجاوز 100%`);
         return;
      }

      if (formData.investment > 0) {
        const invalidInvestment = investments.some(inv => inv.amount > 0 && !inv.wallet_id);
        if (invalidInvestment) {
           alert('الرجاء اختيار الخزنة لكل مبلغ استثمار تم إدخاله');
           return;
        }
      }

      const userId = localStorage.getItem('user_id');
      const payload = { ...formData, user_id: userId };
      const res = await fetch(`${baseUrl}/partners`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('فشل إضافة الشريك');
      const newPartner = (await res.json())[0];
      
      // Auto create an 'investment' transaction
      if (formData.investment > 0) {
        await fetch(`${baseUrl}/partner_transactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            partner_id: newPartner.id,
            user_id: userId,
            type: 'إيداع رأس مال',
            amount: formData.investment,
            description: 'إيداع رأس مال مبدئي / بداية العقد'
          })
        });

        // Add to wallets
        for (const inv of investments) {
           if (inv.amount > 0 && inv.wallet_id) {
              const wallet = wallets.find(w => w.id.toString() === inv.wallet_id.toString());
              if (wallet) {
                 await fetch(`${baseUrl}/wallets?id=eq.${inv.wallet_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                       balance: (wallet.balance || 0) + inv.amount
                    })
                 });
                 
                 await fetch(`${baseUrl}/wallet_transactions`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                       wallet_id: inv.wallet_id,
                       type: 'إيداع',
                       amount: inv.amount,
                       description: `إيداع استثمار من الشريك ${newPartner.name}`,
                       tenant_id: userId
                    })
                 });
              }
           }
        }
      }

      setIsAddModalOpen(false);
      resetForm();
      fetchPartners();
      fetchWallets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalPercentage = partners
        .filter(p => p.id !== editPartner.id)
        .reduce((sum, p) => sum + (p.profit_percentage || 0), 0);
        
      if (totalPercentage + Number(formData.profit_percentage) > 100) {
         alert(`عفواً، إجمالي نسب الشركاء (${totalPercentage}%) مع النسبة المدخلة يتجاوز 100%`);
         return;
      }

      const userId = localStorage.getItem('user_id');
      const res = await fetch(`${baseUrl}/partners?id=eq.${editPartner.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('فشل تعديل بيانات الشريك');
      setEditPartner(null);
      resetForm();
      fetchPartners();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      await fetch(`${baseUrl}/partners?id=eq.${deletePartnerId}`, { method: 'DELETE', headers });
      setDeletePartnerId(null);
      fetchPartners();
    } catch (err) {
      console.error("فشل الحذف");
    }
  };

  const fetchTransactions = async (partnerId: string) => {
    try {
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`${baseUrl}/partner_transactions?partner_id=eq.${partnerId}&order=created_at.desc`, { headers });
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenTransactions = (partner: any) => {
    setTransactionsPartner(partner);
    fetchTransactions(partner.id);
  };

  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if ((txFormData.type === 'سحب' || txFormData.type === 'إيداع رأس مال') && !txWalletId) {
         alert('الرجاء اختيار الخزنة للمعاملة');
         return;
      }

      const userId = localStorage.getItem('user_id');
      const tenantId = localStorage.getItem('tenant_id') || userId;
      
      // 1. Add transaction
      await fetch(`${baseUrl}/partner_transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          partner_id: transactionsPartner.id,
          user_id: userId,
          tenant_id: tenantId,
          ...txFormData
        })
      });

      // 2. Update wallet and treasury if applicable
      if (txWalletId && (txFormData.type === 'سحب' || txFormData.type === 'إيداع رأس مال')) {
         const wallet = wallets.find(w => w.id.toString() === txWalletId);
         if (wallet) {
            const isDeposit = txFormData.type === 'إيداع رأس مال';
            const newBalance = isDeposit ? (wallet.balance + txFormData.amount) : (wallet.balance - txFormData.amount);
            
            await fetch(`${baseUrl}/wallets?id=eq.${txWalletId}`, {
               method: 'PATCH',
               headers,
               body: JSON.stringify({ balance: newBalance })
            });

            await fetch(`${baseUrl}/treasury_transactions`, {
               method: 'POST',
               headers,
               body: JSON.stringify({
                  wallet_id: txWalletId,
                  type: isDeposit ? 'in' : 'out',
                  amount: txFormData.amount,
                  category: isDeposit ? 'إيداع رأس مال شركاء' : 'سحوبات شركاء',
                  description: `معاملة شريك (${transactionsPartner.name}): ${txFormData.description || txFormData.type}`,
                  user_id: userId,
                  tenant_id: tenantId
               })
            });
         }
      }

      // 3. Update totals on partner
      let updatePayload: any = {};
      
      if (txFormData.type === 'سحب') {
         updatePayload = { withdrawals: (transactionsPartner.withdrawals || 0) + txFormData.amount };
      } else if (txFormData.type === 'إيداع رأس مال') {
         updatePayload = { investment: (transactionsPartner.investment || 0) + txFormData.amount };
      } else if (txFormData.type === 'توزيع أرباح') {
         updatePayload = { profits: (transactionsPartner.profits || 0) + txFormData.amount };
      }

      await fetch(`${baseUrl}/partners?id=eq.${transactionsPartner.id}`, {
         method: 'PATCH',
         headers,
         body: JSON.stringify(updatePayload)
      });

      setIsAddTransactionModalOpen(false);
      setTxFormData({ type: 'إيداع رأس مال', amount: 0, description: '' });
      setTxWalletId('');
      fetchTransactions(transactionsPartner.id);
      fetchPartners();
      fetchWallets();
    } catch (err) {
      alert("فشل إضافة المعاملة");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', partnership_type: 'المحل كله',
      profit_percentage: 0, investment: 0, start_date: '', end_date: '',
      terms: '', notes: '', status: 'نشط'
    });
    setInvestments([{ wallet_id: '', amount: 0 }]);
  };

  const calculateProfits = async () => {
    if (!profitMonth) return;
    try {
      const userId = localStorage.getItem('user_id');
      const [year, month] = profitMonth.split('-');
      
      // Fetch Sales Items joined with Invoices to get the date
      // We'll filter in JS to avoid complex Supabase nested date filtering issues
      const salesRes = await fetch(`${baseUrl}/Sales_Items?select=*,Sales_Invoices!inner(created_at,user_id)`, { headers });
      if (!salesRes.ok) throw new Error('فشل جلب المبيعات');
      let salesData = await salesRes.json();
      salesData = salesData.filter((item: any) => item.Sales_Invoices?.user_id === userId || item.Sales_Invoices?.tenant_id === userId || item.Sales_Invoices?.created_by === userId);

      // Fetch Salaries for the selected month/year
      const salariesRes = await fetch(`${baseUrl}/salary_payments?tenant_id=eq.${userId}&month=eq.${month}&year=eq.${year}`, { headers });
      const salariesData = salariesRes.ok ? await salariesRes.json() : [];

      // Fetch product costs to calculate real profit
      let devicesMap: Record<string, number> = {};
      let accessoriesMap: Record<string, number> = {};
      let partsMap: Record<string, number> = {};
      const repairsMap: Record<string, any> = {};

      try {
         const devRes = await fetch(`${baseUrl}/Devices?select=id,cost_price&tenant_id=eq.${userId}`, { headers });
         if (devRes.ok) (await devRes.json()).forEach((d:any) => devicesMap[d.id] = parseFloat(d.cost_price || 0));
         
         const accRes = await fetch(`${baseUrl}/Accessories?select=id,cost_price&tenant_id=eq.${userId}`, { headers });
         if (accRes.ok) (await accRes.json()).forEach((a:any) => accessoriesMap[a.id] = parseFloat(a.cost_price || 0));

         const spRes = await fetch(`${baseUrl}/spare_parts?select=id,cost_price&tenant_id=eq.${userId}`, { headers });
         if (spRes.ok) (await spRes.json()).forEach((p:any) => partsMap[p.id] = parseFloat(p.cost_price || 0));

         // Also fetch Repairs for maintenance component
         const repRes = await fetch(`${baseUrl}/Repairs?select=id,notes&tenant_id=eq.${userId}`, { headers });
         if (repRes.ok) (await repRes.json()).forEach((r:any) => repairsMap[r.id.toString()] = r);
      } catch (e) {
         console.warn("Could not fetch costs from products tables", e);
      }

      let devices = 0;
      let accessories = 0;
      let sparePorts = 0;
      let maintenance = 0;

      // Filter sales by selected month and calculate category totals
      salesData.forEach((item: any) => {
        if (item.Sales_Invoices?.created_at) {
          const itemDate = new Date(item.Sales_Invoices.created_at);
          if (itemDate.getFullYear() === parseInt(year) && (itemDate.getMonth() + 1) === parseInt(month)) {
             // Calculate real profit: sell price - total cost price
             let unitCost = 0;
             const pId = item.product_id;
             if (item.product_type === 'device') unitCost = devicesMap[pId] || 0;
             else if (item.product_type === 'accessory') unitCost = accessoriesMap[pId] || 0;
             else if (item.product_type === 'spare_part') unitCost = partsMap[pId] || 0;

             let isMaintenance = false;
             if (item.product_type === 'maintenance') isMaintenance = true;
             else if (item.product_name && item.product_name.includes('صيانة')) isMaintenance = true;

             if (isMaintenance) {
                 let matchedRepairId = null;
                 if (item.Sales_Invoices?.invoice_number) {
                    const invNumber = item.Sales_Invoices.invoice_number;
                    if (invNumber.includes('MNT-') || invNumber.includes('M-RET-')) {
                       const parts = invNumber.split('-');
                       matchedRepairId = parts[parts.length - 1];
                    }
                 }
                 
                 let partsCost = 0;
                 if (matchedRepairId && repairsMap[matchedRepairId]) {
                    const repair = repairsMap[matchedRepairId];
                    if (repair.notes && repair.notes.includes('===PARTS===')) {
                        try {
                           const partsStr = repair.notes.split('===PARTS===\n')[1].split('\n===')[0];
                           const repairParts = JSON.parse(partsStr);
                           partsCost = repairParts.reduce((sum: number, p: any) => sum + (Number(p.cost || p.cost_price || 0) * Number(p.quantity || 1)), 0);
                        } catch(e) {}
                    }
                 }
                 // profit = total_price (service + parts sell price) - parts cost
                 const profit = (item.total_price || 0) - partsCost;
                 maintenance += profit;
             } else {
                 const totalCost = unitCost * (item.quantity || 1);
                 const profit = (item.total_price || 0) - totalCost;

                 if (item.product_type === 'device') devices += profit;
                 else if (item.product_type === 'accessory') accessories += profit;
                 else if (item.product_type === 'spare_part') sparePorts += profit;
             }
          }
        }
      });

      const totalGross = devices + accessories + sparePorts + maintenance;
      const totalSalaries = salariesData.reduce((sum: number, s: any) => sum + (s.paid_amount || s.net_salary || 0), 0);
      const vaultExpenses = 0; // Currently no API for vault expenses

      setProfitCalculation({
         devices,
         accessories,
         sparePorts,
         maintenance,
         totalGross,
         vaultExpenses,
         salaries: totalSalaries,
         netProfit: totalGross - (totalSalaries + vaultExpenses)
      });
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حساب الأرباح');
    }
  };

  const confirmProfitDistribution = async () => {
    try {
      const [year, month] = profitMonth.split('-');
      
      const tenantId = localStorage.getItem('tenant_id');
      const userId = localStorage.getItem('user_id');

      // Check if this month was already distributed
      const targetDesc = `شهر ${month}/${year}`;
      
      const [ptRes, ttRes] = await Promise.all([
        fetch(`${baseUrl}/partner_transactions?select=description`, { headers }),
        fetch(`${baseUrl}/treasury_transactions?select=description`, { headers })
      ]);

      let isDistributed = false;

      if (ptRes.ok) {
         const ptData = await ptRes.json();
         if (ptData.some((tx: any) => tx.description?.includes(`أرباح شهر ${month}/${year}`))) {
            isDistributed = true;
         }
      }

      if (ttRes.ok && !isDistributed) {
         const ttData = await ttRes.json();
         if (ttData.some((tx: any) => tx.description?.includes(targetDesc) && tx.description?.includes('أرباح'))) {
            isDistributed = true;
         }
      }

      if (isDistributed) {
          alert(`عفواً، تم توزيع وتأكيد أرباح شهر ${month}/${year} مسبقاً! لا يمكن توزيع أرباح نفس الشهر أكثر من مرة.`);
          return;
      }

      // Calculate and save distribution for each partner
      for (const p of partners) {
           let baseProfit = 0;
           if (p.partnership_type === 'المحل كله') baseProfit = profitCalculation.netProfit;
           else if (p.partnership_type === 'أجهزة فقط') baseProfit = profitCalculation.devices;
           else if (p.partnership_type === 'إكسسوارات فقط') baseProfit = profitCalculation.accessories;
           else if (p.partnership_type === 'أجهزة + إكسسوارات') baseProfit = profitCalculation.devices + profitCalculation.accessories;
           else if (p.partnership_type === 'صيانة فقط') baseProfit = profitCalculation.maintenance;
           else if (p.partnership_type === 'قطع غيار فقط') baseProfit = profitCalculation.sparePorts;
           else baseProfit = profitCalculation.netProfit;

           const partnerShare = parseFloat(((p.profit_percentage / 100) * baseProfit).toFixed(2));
           
           if (partnerShare > 0) {
             await fetch(`${baseUrl}/partner_transactions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  partner_id: p.id,
                  type: 'توزيع أرباح',
                  amount: partnerShare,
                  description: `أرباح شهر ${month}/${year}`,
                  user_id: userId,
                  tenant_id: tenantId
                })
             });

             let newWithdrawals = p.withdrawals || 0;

             if (profitPayoutMode === 'payout' && profitWalletId) {
                // Record withdrawal for the partner
                await fetch(`${baseUrl}/partner_transactions`, {
                   method: 'POST',
                   headers,
                   body: JSON.stringify({
                     partner_id: p.id,
                     type: 'سحب',
                     amount: partnerShare,
                     description: `تسليم أرباح شهر ${month}/${year} نقداً`,
                     user_id: userId,
                     tenant_id: tenantId
                   })
                });

                newWithdrawals += partnerShare;
                
                // Record treasury transaction
                await fetch(`${baseUrl}/treasury_transactions`, {
                   method: 'POST',
                   headers,
                   body: JSON.stringify({
                     wallet_id: profitWalletId,
                     type: 'out',
                     amount: partnerShare,
                     category: 'سحوبات شركاء',
                     description: `تسليم أرباح الشريك ${p.name} (شهر ${month}/${year})`,
                     user_id: userId,
                     tenant_id: tenantId
                   })
                });
                
                // Deduct from wallet balance
                const wallet = wallets.find(w => w.id.toString() === profitWalletId.toString());
                if (wallet) {
                   await fetch(`${baseUrl}/wallets?id=eq.${profitWalletId}`, {
                      method: 'PATCH',
                      headers,
                      body: JSON.stringify({ balance: wallet.balance - partnerShare })
                   });
                   wallet.balance -= partnerShare; // Update local state tentatively
                }
             }

             // Update total profits and withdrawals on the partner record
             await fetch(`${baseUrl}/partners?id=eq.${p.id}`, {
               method: 'PATCH',
               headers,
               body: JSON.stringify({ 
                 profits: (p.profits || 0) + partnerShare,
                 withdrawals: newWithdrawals
               })
             });
           }
      }

      setShowProfitSuccess(true);
      fetchPartners(); // Refresh partners data to include new profits
      setTimeout(() => {
        setShowProfitSuccess(false);
        setIsProfitModalOpen(false);
        setProfitCalculation(null);
      }, 2500);
      
    } catch (err: any) {
       alert("حدث خطأ أثناء توزيع الأرباح: " + err.message);
    }
  };

  const filteredPartners = partners.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  const totalInvestments = partners.reduce((sum, p) => sum + (p.investment || 0), 0);
  const totalWithdrawals = partners.reduce((sum, p) => sum + (p.withdrawals || 0), 0);
  const totalProfits = partners.reduce((sum, p) => sum + (p.profits || 0), 0);
  const netTotal = totalInvestments + totalProfits - totalWithdrawals;

  return (
    <div className="space-y-6 pb-20" dir="rtl">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'الصافي', value: netTotal, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
          { title: 'السحوبات', value: totalWithdrawals, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
          { title: 'الاستثمارات', value: totalInvestments, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { title: 'الشركاء', value: partners.length, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', isCount: true }
        ].map((card, i) => (
          <div key={i} className={`rounded-2xl p-6 border border-slate-200 dark:border-white/5 ${card.bg} flex flex-col items-center justify-center text-center shadow-sm`}>
             <div className={`text-3xl font-black font-mono ${card.color} mb-2`}>
                {card.isCount ? card.value : `${(card.value/1000).toFixed(1)}k`}
             </div>
             <div className="text-slate-600 dark:text-slate-300 font-bold">{card.title}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151c] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <Handshake className="w-6 h-6 text-amber-500" /> قائمة الشركاء
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute top-1/2 start-3 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الهاتف..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm focus:outline-none focus:border-amber-500 dark:text-white"
            />
          </div>
          <button 
            onClick={() => setIsProfitModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
          >
            <Calculator className="w-4 h-4" /> حساب الأرباح
          </button>
          <button 
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> إضافة شريك
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#11151c] rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-start font-bold text-slate-500">#</th>
                  <th className="px-6 py-4 text-start font-bold text-slate-500">الشريك</th>
                  <th className="px-6 py-4 text-start font-bold text-slate-500">الهاتف</th>
                  <th className="px-6 py-4 text-start font-bold text-slate-500">نوع الشراكة</th>
                  <th className="px-6 py-4 text-center font-bold text-slate-500">الاستثمار</th>
                  <th className="px-6 py-4 text-center font-bold text-slate-500">إجمالي الأرباح</th>
                  <th className="px-6 py-4 text-center font-bold text-slate-500">السحوبات</th>
                  <th className="px-6 py-4 text-center font-bold text-slate-500">الرصيد الصافي</th>
                  <th className="px-6 py-4 text-center font-bold text-slate-500">الحالة</th>
                  <th className="px-6 py-4 text-center font-bold text-slate-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredPartners.length > 0 ? filteredPartners.map((p, i) => {
                  const pNet = (p.investment || 0) + (p.profits || 0) - (p.withdrawals || 0);
                  
                  return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{i + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-[13px]">{p.phone}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                        {p.partnership_type} ({p.profit_percentage}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                      {(p.investment || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-emerald-500">
                      {(p.profits || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-red-500">
                      {(p.withdrawals || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-black text-indigo-600 dark:text-indigo-400 text-base">
                      {pNet.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                         <button onClick={() => {
                            setEditPartner(p);
                            setFormData(p);
                         }} className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1 px-2 text-xs font-bold">
                            <Edit className="w-3 h-3" /> تعديل
                         </button>
                         <button onClick={() => handleOpenTransactions(p)} className="p-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 flex items-center gap-1 px-2 text-xs font-bold">
                            <WalletCards className="w-3 h-3" /> المعاملات
                         </button>
                         <button onClick={() => setDeletePartnerId(p.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1 px-2 text-xs font-bold">
                            <Trash2 className="w-3 h-3" /> حذف
                         </button>
                      </div>
                    </td>
                  </tr>
                )}) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500">لا يوجد بيانات شركاء لعرضها</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || editPartner) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white dark:bg-[#11151c] rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-xl"
             >
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Handshake className="w-6 h-6 text-amber-500" />
                    {editPartner ? 'تعديل بيانات الشريك' : 'إضافة شريك جديد'}
                  </h3>
                  <button onClick={() => { setIsAddModalOpen(false); setEditPartner(null); }} className="text-slate-400 hover:text-red-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <form onSubmit={editPartner ? handleUpdateSubmit : handleAddSubmit} className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                   <div className="space-y-6">
                      
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم الشريك *</label>
                           <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 dark:text-white" />
                         </div>
                         <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رقم الهاتف</label>
                           <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 dark:text-white" />
                         </div>
                      </div>

                      {/* Partnership Type */}
                      <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">نوع الشراكة *</label>
                         <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {['المحل كله', 'أجهزة فقط', 'إكسسوارات فقط', 'أجهزة + إكسسوارات', 'صيانة فقط', 'قطع غيار فقط'].map(type => (
                              <label key={type} className={`cursor-pointer flex flex-col items-center p-3 rounded-xl border-2 transition-all ${formData.partnership_type === type ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-slate-200 dark:border-white/10 hover:border-amber-500/50 text-slate-600 dark:text-slate-400'}`}>
                                 <input type="radio" value={type} checked={formData.partnership_type === type} onChange={e => setFormData({...formData, partnership_type: e.target.value})} className="hidden" />
                                 <span className="font-bold text-sm block text-center mt-1">{type}</span>
                              </label>
                            ))}
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نسبة الربح من {formData.partnership_type} (%)</label>
                           <input type="number" required value={formData.profit_percentage} onChange={e => setFormData({...formData, profit_percentage: parseFloat(e.target.value) || 0})} className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 dark:text-white" />
                         </div>
                         <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">مبلغ الاستثمار وتوزيعه على الخزائن</label>
                           {investments.map((inv, index) => (
                              <div key={index} className="flex items-center gap-2 mb-2">
                                <input type="number" placeholder="المبلغ" value={inv.amount || ''} onChange={e => {
                                   const newInv = [...investments];
                                   newInv[index].amount = parseFloat(e.target.value) || 0;
                                   setInvestments(newInv);
                                   const total = newInv.reduce((sum, item) => sum + (item.amount || 0), 0);
                                   setFormData({...formData, investment: total});
                                }} className="w-1/3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 dark:text-white" />
                                
                                <select value={inv.wallet_id} onChange={e => {
                                   const newInv = [...investments];
                                   newInv[index].wallet_id = e.target.value;
                                   setInvestments(newInv);
                                }} className="w-2/3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 dark:text-white">
                                   <option value="">اختر الخزنة</option>
                                   {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.balance})</option>)}
                                </select>
                                
                                {investments.length > 1 && (
                                  <button type="button" onClick={() => {
                                     const newInv = investments.filter((_, i) => i !== index);
                                     setInvestments(newInv);
                                     const total = newInv.reduce((sum, item) => sum + (item.amount || 0), 0);
                                     setFormData({...formData, investment: total});
                                  }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                           ))}
                           <button type="button" onClick={() => setInvestments([...investments, { wallet_id: '', amount: 0 }])} className="text-xs text-indigo-500 font-bold flex items-center gap-1 mt-1 hover:text-indigo-600 transition-colors">
                             <Plus className="w-3 h-3" /> إضافة خزنة أخرى
                           </button>
                           <div className="mt-2 text-xs font-bold text-slate-500">إجمالي الاستثمار: {formData.investment}</div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">بداية الاتفاق</label>
                           <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 dark:text-white" />
                         </div>
                         <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نهاية الاتفاق</label>
                           <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 dark:text-white" />
                         </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">شروط الاتفاق</label>
                          <textarea value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} rows={3} className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 dark:text-white resize-none" placeholder="اكتب شروط الاتفاق هنا..."></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ملاحظات إضافية</label>
                          <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 dark:text-white resize-none" placeholder="أي ملاحظات..."></textarea>
                        </div>
                      </div>

                   </div>
                   
                   <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 pt-6">
                      <button type="button" onClick={() => { setIsAddModalOpen(false); setEditPartner(null); }} className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">إلغاء</button>
                      <button type="submit" className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg">حفظ</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Calculate Profit Modal */}
      <AnimatePresence>
        {isProfitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white dark:bg-[#11151c] rounded-2xl w-full max-w-md shadow-xl flex flex-col"
            >
              <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-white/5">
                 <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                   <Calculator className="w-5 h-5 text-emerald-500" /> حساب أرباح الشركاء
                 </h3>
                 <button onClick={() => setIsProfitModalOpen(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-4">
                {!profitCalculation ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اختر الشهر *</label>
                      <input type="month" required value={profitMonth} onChange={e => setProfitMonth(e.target.value)} className="w-full bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 dark:text-white" />
                    </div>
                    <button onClick={calculateProfits} disabled={!profitMonth} className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                       <RefreshCw className="w-4 h-4" /> حساب الأرباح الآن
                    </button>
                  </>
                ) : showProfitSuccess ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 mb-3">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-500">تم تأكيد التوزيع بنجاح</h3>
                  </div>
                ) : (
                  <div className="space-y-3">
                     <div className="bg-slate-50 dark:bg-[#0d1117] rounded-xl p-3 space-y-2 font-mono text-sm border border-slate-200 dark:border-white/5">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>ربح الأجهزة</span>
                          <span className="font-bold">{profitCalculation.devices} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>ربح الإكسسوارات</span>
                          <span className="font-bold">{profitCalculation.accessories} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>ربح الصيانة وقطع الغيار</span>
                          <span className="font-bold">{profitCalculation.maintenance + profitCalculation.sparePorts} ج.م</span>
                        </div>
                        <div className="h-px bg-slate-200 dark:bg-white/10 my-1.5"></div>
                        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-bold">
                          <span>إجمالي الربح العام</span>
                          <span>{profitCalculation.totalGross} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center text-red-500 text-xs">
                          <span>مصاريف الخزنة والرواتب</span>
                          <span>- {profitCalculation.vaultExpenses + profitCalculation.salaries} ج.م</span>
                        </div>
                        <div className="h-px bg-slate-200 dark:bg-white/10 my-1.5"></div>
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-black">
                          <span>صافي الربح الموزع</span>
                          <span>{profitCalculation.netProfit} ج.م</span>
                        </div>
                     </div>

                     <div>
                       <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                         <Users className="w-4 h-4 text-indigo-500" /> توزيع الأرباح على الشركاء
                       </h4>
                       <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                         {partners.map(p => {
                           let baseProfit = 0;
                           if (p.partnership_type === 'المحل كله') baseProfit = profitCalculation.netProfit;
                           else if (p.partnership_type === 'أجهزة فقط') baseProfit = profitCalculation.devices;
                           else if (p.partnership_type === 'إكسسوارات فقط') baseProfit = profitCalculation.accessories;
                           else if (p.partnership_type === 'أجهزة + إكسسوارات') baseProfit = profitCalculation.devices + profitCalculation.accessories;
                           else if (p.partnership_type === 'صيانة فقط') baseProfit = profitCalculation.maintenance;
                           else if (p.partnership_type === 'قطع غيار فقط') baseProfit = profitCalculation.sparePorts;
                           else baseProfit = profitCalculation.netProfit;

                           const partnerShare = ((p.profit_percentage / 100) * baseProfit).toFixed(2);
                           
                           return (
                             <div key={p.id} className="flex justify-between items-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-2 rounded-lg">
                                <div>
                                  <div className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</div>
                                  <div className="text-[10px] text-slate-500">{p.partnership_type} ({p.profit_percentage}%)</div>
                                </div>
                                <div className="text-emerald-500 font-bold font-mono text-base">
                                   {/* Calculate proper portion based on partnership type */}
                                   {partnerShare} ج.م
                                </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>

                     <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-3">
                       <div>
                         <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">طريقة التسليم</label>
                         <select 
                           value={profitPayoutMode} 
                           onChange={e => setProfitPayoutMode(e.target.value as 'accrue' | 'payout')} 
                           className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:text-white"
                         >
                           <option value="accrue">تسجيل في رصيد الشركاء فقط</option>
                           <option value="payout">تسليم نقداً من الخزنة الآن</option>
                         </select>
                       </div>

                       {profitPayoutMode === 'payout' && (
                         <div>
                           <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الخزنة / الصندوق *</label>
                           <select 
                             value={profitWalletId} 
                             onChange={e => setProfitWalletId(e.target.value)} 
                             className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:text-white"
                           >
                             <option value="" disabled>-- اختر الخزنة لخصم المبالغ منها --</option>
                             {wallets.map(w => (
                               <option key={w.id} value={w.id}>{w.name} (الرصيد: {w.balance} ج.م)</option>
                             ))}
                           </select>
                         </div>
                       )}

                       <div className="flex gap-2 w-full pt-1">
                         <button 
                           onClick={confirmProfitDistribution} 
                           disabled={profitPayoutMode === 'payout' && !profitWalletId}
                           className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-sm font-bold rounded-xl transition-colors disabled:cursor-not-allowed"
                         >
                           تأكيد التوزيع
                         </button>
                         <button onClick={() => setProfitCalculation(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors">إلغاء الحساب</button>
                       </div>
                     </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transactions Modal */}
      <AnimatePresence>
        {transactionsPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white dark:bg-[#11151c] rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col h-[80vh]"
             >
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 shrink-0">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <WalletCards className="w-6 h-6 text-amber-500" />
                    معاملات الشريك: {transactionsPartner.name}
                  </h3>
                  <button onClick={() => setTransactionsPartner(null)} className="text-slate-400 hover:text-red-500"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-end shrink-0">
                  <button onClick={() => setIsAddTransactionModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-bold">
                    <Plus className="w-4 h-4" /> إضافة معاملة
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0">
                  <table className="w-full text-start text-sm">
                    <thead className="bg-slate-50 dark:bg-white/5 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-start font-bold text-slate-500">التاريخ</th>
                        <th className="px-6 py-3 text-start font-bold text-slate-500">النوع</th>
                        <th className="px-6 py-3 text-start font-bold text-slate-500">المبلغ</th>
                        <th className="px-6 py-3 text-start font-bold text-slate-500">الوصف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {transactions.length > 0 ? transactions.map((tx: any, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-6 py-3 text-slate-500 dark:text-slate-400" dir="ltr">{new Date(tx.created_at).toLocaleString('ar-EG')}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                               tx.type === 'إيداع رأس مال' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                               tx.type === 'توزيع أرباح' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                               'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                            }`}>{tx.type}</span>
                          </td>
                          <td className="px-6 py-3 font-mono font-bold text-slate-900 dark:text-white">
                            {tx.amount.toLocaleString()} ج.م
                          </td>
                          <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{tx.description}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="text-center py-10 text-slate-500">لا توجد معاملات مسجلة لهذا الشريك</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAddTransactionModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#11151c] rounded-2xl w-full max-w-md shadow-xl">
               <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">إضافة معاملة</h3>
                 <button onClick={() => setIsAddTransactionModalOpen(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5"/></button>
               </div>
               <form onSubmit={handleAddTransactionSubmit} className="p-6 space-y-4">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع المعاملة *</label>
                   <select value={txFormData.type} onChange={e => setTxFormData({...txFormData, type: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white">
                     <option>إيداع رأس مال</option>
                     <option>سحب</option>
                     <option>توزيع أرباح</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المبلغ *</label>
                   <input type="number" required value={txFormData.amount} onChange={e => setTxFormData({...txFormData, amount: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الوصف</label>
                   <textarea value={txFormData.description} onChange={e => setTxFormData({...txFormData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white resize-none" rows={3}></textarea>
                 </div>
                 
                 {(txFormData.type === 'إيداع رأس مال' || txFormData.type === 'سحب') && (
                   <div>
                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الخزنة *</label>
                     <select 
                       value={txWalletId} 
                       onChange={e => setTxWalletId(e.target.value)} 
                       className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 dark:text-white"
                     >
                       <option value="">-- اختر الخزنة --</option>
                       {wallets.map(w => (
                         <option key={w.id} value={w.id}>{w.name} (الرصيد: {w.balance} ج.م)</option>
                       ))}
                     </select>
                   </div>
                 )}

                 <div className="flex gap-2 pt-2">
                   <button type="submit" className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold">حفظ</button>
                   <button type="button" onClick={() => setIsAddTransactionModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl font-bold">إلغاء</button>
                 </div>
               </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletePartnerId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#11151c] rounded-2xl w-full max-w-sm shadow-xl overflow-hidden text-center">
              <div className="p-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  هل أنت متأكد من حذف الشريك؟ <br />
                  <span className="text-red-500 font-bold border-b border-red-500/30">سيتم حذف جميع معاملاته أيضاً بشكل نهائي!</span>
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-white/5 flex grid-cols-2 divide-x divide-x-reverse divide-slate-100 dark:divide-white/5">
                <button onClick={handleDelete} className="flex-1 p-4 font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">نعم، احذف</button>
                <button onClick={() => setDeletePartnerId(null)} className="flex-1 p-4 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
