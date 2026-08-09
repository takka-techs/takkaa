import React, { useState, useEffect } from 'react';
import { ArrowRight, Calculator, Calendar, ChevronDown, CreditCard, Percent, Smartphone, User, Wallet, Info } from 'lucide-react';
// import removed

type CreateInstallmentProps = {
  onBack?: () => void;
  onSuccess?: () => void;
};

export default function CreateInstallment({ onBack, onSuccess }: CreateInstallmentProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [saveCustomClient, setSaveCustomClient] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState('');
  const [cashPrice, setCashPrice] = useState<number | ''>('');
  
  const [interestMode, setInterestMode] = useState<'percentage' | 'final_price'>('percentage');
  const [interestInput, setInterestInput] = useState<number | ''>('');
  
  const [downPayment, setDownPayment] = useState<number | ''>('');
  const [monthsCount, setMonthsCount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWalletId, setSelectedWalletId] = useState('');

  // Guarantor state
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorNationalId, setGuarantorNationalId] = useState('');
  const [guarantorAddress, setGuarantorAddress] = useState('');

  // Setup initial load
  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
      const headers = { 'apikey': API_KEY, 'Authorization': `Bearer ${token}` };
      
      const branchId = localStorage.getItem('takka_active_branch_id');
      let whQuery = '';
      if (branchId && branchId !== 'ALL') {
        const whRes = await fetch(`${SUPABASE_URL}/rest/v1/Warehouses?select=id&branch_id=eq.${branchId}`, { headers });
        if (whRes.ok) {
          const whData = await whRes.json();
          if (whData && whData.length > 0) {
            const whIds = whData.map((w: any) => w.id).join(',');
            whQuery = `&warehouse_id=in.(${whIds})`;
          } else {
            whQuery = `&warehouse_id=eq.0`; // branch has no warehouses
          }
        }
      }

      const userId = localStorage.getItem("user_id");
      const _tenantId = localStorage.getItem("tenant_id") || userId;

      let tenantQuery = _tenantId ? `&tenant_id=eq.${_tenantId}` : '';
      let branchIdQuery = branchId && branchId !== 'ALL' ? `&branch_id=eq.${branchId}` : '';

      // Fetch Clients
      const clientsRes = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=id,name,branches(name)${tenantQuery}${branchIdQuery}`, { headers });
      if (clientsRes.ok) setClients(await clientsRes.json());

      // Fetch Items (Devices, Accessories, Spare Parts)
      const devicesRes = await fetch(`${SUPABASE_URL}/rest/v1/Devices?select=id,company,model,selling_price,status,is_locked_for_installment${whQuery}${tenantQuery}`, { headers });
      const accessoriesRes = await fetch(`${SUPABASE_URL}/rest/v1/Accessories?select=*${whQuery}${tenantQuery}`, { headers });
      const sparePartsRes = await fetch(`${SUPABASE_URL}/rest/v1/spare_parts?select=*${whQuery}${tenantQuery}`, { headers });
      
      let allItems: any[] = [];
      if (devicesRes.ok) {
         const devs = await devicesRes.json();
         const availableDevs = devs.filter((d: any) => {
           if (d.is_locked_for_installment === true) return false;
           const s = (d.status || '').toLowerCase();
           return s === 'available' || s === 'متاح' || s === 'active';
         });
         allItems.push(...availableDevs.map((d:any) => ({ id: `device-${d.id}`, type: 'device', realId: d.id, name: `${d.company} ${d.model}`, price: d.selling_price || 0 })));
      }
      if (accessoriesRes.ok) {
         const accs = await accessoriesRes.json();
         const availableAccs = accs.filter((a: any) => Number(a.quantity || 0) > 0);
         allItems.push(...availableAccs.map((a:any) => ({ id: `accessory-${a.id}`, type: 'accessory', realId: a.id, name: `إكسسوار: ${a.name}`, price: a.selling_price || a.price || 0 })));
      }
      if (sparePartsRes.ok) {
         const sps = await sparePartsRes.json();
         const availableSps = sps.filter((s: any) => Number(s.quantity || 0) > 0);
         allItems.push(...availableSps.map((s:any) => ({ id: `spare-${s.id}`, type: 'spare_part', realId: s.id, name: `قطعة غيار: ${s.name}`, price: s.selling_price || s.price || 0 })));
      }
      setItems(allItems);

      // Fetch Wallets
      const walletsRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=id,name,type,branches(name)${tenantQuery}${branchIdQuery}`, { headers });
      if (walletsRes.ok) setWallets(await walletsRes.json());

      // Try grabbing users to map current user id
      const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/app_users?select=id,name,branches(name)${tenantQuery}`, { headers });
      if (usersRes.ok) setUsers(await usersRes.json());

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // When item is selected, pre-fill cash price
  useEffect(() => {
    if (selectedItemId) {
      const itm = items.find(d => d.id === selectedItemId);
      if (itm && itm.price) {
        setCashPrice(itm.price);
      }
    }
  }, [selectedItemId, items]);

  // Derived state calculations
  const calcCashPrice = Number(cashPrice) || 0;
  const calcInterestInput = Number(interestInput) || 0;
  const calcDownPayment = Number(downPayment) || 0;
  const calcMonths = Number(monthsCount) || 1;

  let calculatedInterestAmount = 0;
  let calculatedTotalPrice = 0;
  let calculatedInterestPercentage = 0;

  if (interestMode === 'percentage') {
    const remainingForInterest = Math.max(0, calcCashPrice - calcDownPayment);
    calculatedInterestAmount = remainingForInterest * (calcInterestInput / 100);
    calculatedTotalPrice = calcCashPrice + calculatedInterestAmount;
    calculatedInterestPercentage = calcInterestInput;
  } else {
    calculatedTotalPrice = calcInterestInput > 0 ? calcInterestInput : calcCashPrice;
    calculatedInterestAmount = calculatedTotalPrice - calcCashPrice;
    const remainingForInterest = Math.max(0, calcCashPrice - calcDownPayment);
    calculatedInterestPercentage = remainingForInterest > 0 ? (calculatedInterestAmount / remainingForInterest) * 100 : 0;
  }

  const generatedRemaining = calculatedTotalPrice - calcDownPayment;
  const installmentAmount = generatedRemaining > 0 ? generatedRemaining / calcMonths : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientId === 'new' && !newClientName.trim()) return alert("أدخل اسم العميل");
    if (!selectedClientId) return alert("اختر العميل");
    if (!selectedItemId) return alert("اختر الصنف المباع");
    if (!selectedWalletId && calcDownPayment > 0) return alert("بما أن هناك مقدم، يجب اختيار الخزينة/المحفظة");

    setSubmitting(true);
    try {
      const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
      const headers = { 
        'apikey': API_KEY, 
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      };
      
      let finalClientId = selectedClientId;
      if (selectedClientId === 'new') {
        if (saveCustomClient) {
            // save to clients
            const cRes = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
               method: 'POST',
               headers: { ...headers, 'Prefer': 'return=representation' },
               body: JSON.stringify({ name: newClientName, phone: '', address: '' })
            });
            if (cRes.ok) {
               const cData = await cRes.json();
               finalClientId = cData[0].id;
            } else {
               throw new Error("فشل حفظ العميل الجديد في قاعدة البيانات");
            }
        } else {
            // Cannot use temporary name without writing SQL. 
            // the backend `create_installment_contract` expects BIGINT client_id which must exist.
            // If they don't want to save, we create a temporary client and maybe add a note.
            const cRes = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
               method: 'POST',
               headers: { ...headers, 'Prefer': 'return=representation' },
               body: JSON.stringify({ name: newClientName + " (غير مسجل)", phone: '', address: '' })
            });
            if (cRes.ok) {
               const cData = await cRes.json();
               finalClientId = cData[0].id;
            } else {
               throw new Error("فشل تهيئة العميل في قاعدة البيانات");
            }
        }
      }

      const start = new Date(startDate);
      const generatedPaymentsArray = [];
      for (let i = 0; i < calcMonths; i++) {
          const dueDate = new Date(start);
          dueDate.setMonth(start.getMonth() + i);
          generatedPaymentsArray.push({
              installment_no: i + 1,
              due_amount: installmentAmount,
              due_date: dueDate.toISOString().split('T')[0],
              status: 'pending'
          });
      }

      const currentUserStr = localStorage.getItem('user_id');
      const activeCashierStr = localStorage.getItem('active_cashier');
      const _tenantId = localStorage.getItem('tenant_id') || currentUserStr;
      const bId = localStorage.getItem('takka_active_branch_id');

      let author = currentUserStr;
      if (activeCashierStr) {
          try {
             const cx = JSON.parse(activeCashierStr);
             if (cx && cx.id) author = cx.id;
          } catch(e) {}
      }

      // decode selected item
      const itemSegments = selectedItemId.split('-');
      const itemType = itemSegments[0];
      const itemRealId = parseInt(itemSegments[1]);

      let p_device_id = null;
      let p_accessory_id = null;
      let p_spare_part_id = null;

      if (itemType === 'device') p_device_id = itemRealId;
      else if (itemType === 'accessory') p_accessory_id = itemRealId;
      else if (itemType === 'spare') p_spare_part_id = itemRealId;

      const payload = {
        tenant_id: _tenantId,
        branch_id: bId && bId !== 'ALL' ? bId : null,
        client_id: finalClientId,
        device_id: p_device_id,
        accessory_id: p_accessory_id,
        spare_part_id: p_spare_part_id,
        invoice_id: null,
        wallet_id: selectedWalletId ? parseInt(selectedWalletId) : null,
        total_price: calculatedTotalPrice,
        down_payment: calcDownPayment,
        installment_amount: installmentAmount,
        installment_count: calcMonths,
        start_date: startDate,
        created_by: author,
        status: 'active',
        guarantor_name: guarantorName ? guarantorName : null,
        guarantor_phone: guarantorPhone ? guarantorPhone : null,
        guarantor_national_id: guarantorNationalId ? guarantorNationalId : null,
        guarantor_address: guarantorAddress ? guarantorAddress : null
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/installment_contracts`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(payload)
      });

      if (!res.ok) {
          const err = await res.text();
          throw new Error(err);
      }
      
      const resData = await res.json();
      const contractId = resData[0].id;
      
      // ---- Handle Down Payment in Treasury ----
      if (calcDownPayment > 0 && selectedWalletId) {
         try {
            await fetch(`${SUPABASE_URL}/rest/v1/treasury_transactions`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                wallet_id: parseInt(selectedWalletId),
                user_id: author,
                type: 'in',
                amount: calcDownPayment,
                category: 'مقدم تقسيط',
                description: `مقدم عقد تقسيط #${contractId}`,
                tenant_id: _tenantId,
                branch_id: bId && bId !== 'ALL' ? bId : null
              })
            });

            // Update wallet balance
            const wRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${selectedWalletId}&select=balance`, { headers });
            if (wRes.ok) {
               const wData = await wRes.json();
               if (wData && wData.length > 0) {
                  const newBalance = Number(wData[0].balance || 0) + calcDownPayment;
                  await fetch(`${SUPABASE_URL}/rest/v1/wallets?id=eq.${selectedWalletId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ balance: newBalance })
                  });
               }
            }

            // Update active shift if any
            const activeBranchId = localStorage.getItem('takka_active_branch_id');
            const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
            const branchSuffix = activeBranchId && activeBranchId !== 'ALL' ? `&branch_id=eq.${activeBranchId}` : '';
            const shiftRes = await fetch(`${SUPABASE_URL}/rest/v1/shifts?select=*&status=eq.open${branchSuffix}&user_id=eq.${userId}${(() => { const cStr = localStorage.getItem('active_cashier'); if (cStr) { try { const c = JSON.parse(cStr); if (c && c.role_level !== 1) return '&cashier_name=eq.' + encodeURIComponent(c.full_name || c.username || c.name || 'موظف مبيعات'); else if (c && c.role_level === 1) return (c.full_name || c.username || c.name) ? `&or=(cashier_name.is.null,cashier_name.eq.${encodeURIComponent(c.full_name || c.username || c.name)})` : '&cashier_name=is.null'; } catch (e) {} } return '&cashier_name=is.null'; })()}&order=created_at.desc&limit=1`, { headers });
            if (shiftRes.ok) {
               const shifts = await shiftRes.json();
               if (shifts && shifts.length > 0) {
                  const activeShift = shifts[0];
                  const patchBody: any = { deposits_count: Number(activeShift.deposits_count || 0) + 1 };
                  const targetWallet = wallets.find((w: any) => w.id.toString() === selectedWalletId.toString());
                  if (targetWallet && targetWallet.type === 'cash') {
                     patchBody.expected_amount = Number(activeShift.expected_amount || 0) + calcDownPayment;
                  }
                  await fetch(`${SUPABASE_URL}/rest/v1/shifts?id=eq.${activeShift.id}`, {
                     method: 'PATCH',
                     headers,
                     body: JSON.stringify(patchBody)
                  });
               }
            }
         } catch(e) { console.error('Failed to update treasury for down payment', e); }
      }
      // ------------------------------------------

      // Automatically inserting to installment_contracts triggers an auto-generation of monthly payments
      // We delete them to handle weekly or custom ones properly, then insert our paymentsArray.
      await fetch(`${SUPABASE_URL}/rest/v1/installment_payments?contract_id=eq.${contractId}`, {
          method: 'DELETE',
          headers
      });

      const paymentsToInsert = generatedPaymentsArray.map((p, index) => ({
          contract_id: contractId,
          installment_no: index + 1,
          due_amount: p.due_amount,
          due_date: p.due_date,
          status: p.status,
          tenant_id: _tenantId,
          branch_id: bId && bId !== 'ALL' ? bId : null
      }));

      await fetch(`${SUPABASE_URL}/rest/v1/installment_payments`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify(paymentsToInsert)
      });

      // Mark the item as locked/sold or decrement quantity
      if (itemType === 'device') {
        await fetch(`${SUPABASE_URL}/rest/v1/Devices?id=eq.${itemRealId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'sold_installment',
            is_locked_for_installment: true,
            installment_contract_id: contractId
          })
        });
      } else if (itemType === 'accessory' || itemType === 'spare') {
        const invTable = itemType === 'accessory' ? 'Accessories' : 'spare_parts';
        // Need to fetch current quantity first, or ideally use an RPC
        const itmRes = await fetch(`${SUPABASE_URL}/rest/v1/${invTable}?id=eq.${itemRealId}&select=quantity`, { headers });
        if (itmRes.ok) {
          const itmData = await itmRes.json();
          if (itmData && itmData.length > 0) {
            const currentQty = itmData[0].quantity || 0;
            await fetch(`${SUPABASE_URL}/rest/v1/${invTable}?id=eq.${itemRealId}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                quantity: Math.max(0, currentQty - 1)
              })
            });
          }
        }
      }

      alert("تم إنشاء العقد بنجاح");
      if (onSuccess) onSuccess();
      if (onBack) onBack();

    } catch (e: any) {
      console.error(e);
      alert(e.message || "فشل إنشاء العقد");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/50 dark:bg-[#11151c]/50 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-l from-slate-900 to-slate-700 dark:from-white dark:to-white/70 bg-clip-text text-transparent">
              عقد تقسيط جديد
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              إدخال تفاصيل القسط والمستفيد
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200 dark:border-white/10">
            {/* Client */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <User className="w-4 h-4 text-emerald-500" />
                العميل <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white appearance-none"
                >
                  <option value="">-- اختر عميل --</option>
                  <option value="new" className="font-bold text-emerald-600">+ عميل جديد (كتابة يدوية)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>

              {selectedClientId === 'new' && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3 border border-slate-100 dark:border-white/5">
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسم العميل الجديد..."
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveCustomClient}
                      onChange={(e) => setSaveCustomClient(e.target.checked)}
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 border-slate-300 dark:border-white/10"
                    />
                    حفظ العميل في قائمة العملاء الدائمين
                  </label>
                </div>
              )}
            </div>

            {/* Device / Item */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                الصنف المباع <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white appearance-none"
                >
                  <option value="">-- اختر الصنف --</option>
                  {items.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            
            {/* Cash Price */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Calculator className="w-4 h-4 text-emerald-500" />
                سعر الكاش (أساسي)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={cashPrice}
                onChange={(e) => setCashPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-right font-mono"
                placeholder="0"
              />
            </div>
          </div>

          {/* Settings & Interest Setup */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] pointer-events-none rounded-full"></div>
            
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-500" />
              إعدادات الفائدة والأقساط
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              
              {/* Interest Mode */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">طريقة احتساب الفائدة</label>
                <div className="flex bg-slate-200 dark:bg-[#11151c] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInterestMode('percentage')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${interestMode === 'percentage' ? 'bg-white dark:bg-[#1e2532] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    نسبة مئوية (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterestMode('final_price')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${interestMode === 'final_price' ? 'bg-white dark:bg-[#1e2532] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    السعر النهائي للقسط
                  </button>
                </div>
              </div>

              {/* Interest Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {interestMode === 'percentage' ? 'نسبة الفائدة (%)' : 'إجمالي سعر القسط النهائي (ج)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-right font-mono"
                  placeholder="0"
                />
              </div>

              {/* Down Payment */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">المقدم المدفوع</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-right font-mono"
                  placeholder="0"
                />
              </div>

              {/* Installment count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">عدد الشهور / الأقساط</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={monthsCount}
                  onChange={(e) => setMonthsCount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-right font-mono"
                  placeholder="12"
                />
              </div>

              {/* Wallet / Safe */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  خزينة استلام المقدم
                </label>
                <div className="relative">
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    required={calcDownPayment > 0}
                    className="w-full pl-4 pr-10 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white appearance-none"
                  >
                    <option value="">-- اختر المحفظة/الخزينة --</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} {w.branches?.name ? ` - (${w.branches.name})` : ""}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  تاريخ بداية القسط
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-6 rounded-2xl">
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
               <Info className="w-5 h-5" />
               ملخص العملية
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <div>
                  <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mb-1">نسبة الفائدة</div>
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{calculatedInterestPercentage.toFixed(2)}%</div>
               </div>
               <div>
                  <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mb-1">قيمة الفائدة</div>
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{calculatedInterestAmount.toLocaleString()} ج</div>
               </div>
               <div>
                  <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mb-1">الإجمالي (بعد الفائدة)</div>
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{calculatedTotalPrice.toLocaleString()} ج</div>
               </div>
               <div>
                  <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mb-1">قيمة القسط الشهري</div>
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-lg">{installmentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج</div>
               </div>
            </div>
          </div>

          {/* Guarantor Details */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col gap-6">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              بيانات الضامن (اختياري)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">اسم الضامن</label>
                <input
                  type="text"
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white"
                  placeholder="مثال: أحمد محمود"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">رقم هاتف الضامن</label>
                <input
                  type="text"
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white"
                  placeholder="مثال: 01000000000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">الرقم القومي (اختياري)</label>
                <input
                  type="text"
                  value={guarantorNationalId}
                  onChange={(e) => setGuarantorNationalId(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white"
                  placeholder="14 رقم"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">العنوان (اختياري)</label>
                <input
                  type="text"
                  value={guarantorAddress}
                  onChange={(e) => setGuarantorAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all dark:text-white"
                  placeholder="عنوان الإقامة"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              {submitting ? 'جاري الحفظ...' : 'تأكيد العقد'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
