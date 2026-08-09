import React, { useState } from "react";
import { Plus, CreditCard, DollarSign, TrendingUp, Wallet, Search, Filter, Edit2, Trash2, ShoppingCart, Smartphone, Activity, BarChart3, Calendar, Clock, Download, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';


const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
const getHeaders = () => ({
  'apikey': KEY,
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json'
});

interface Machine {
  branch_id?: string | null;
  id: string;
  name: string;
  balance: number;
  totalProfit: number;
  createdAt: string;
  lowBalanceThreshold: number;
  targetAmount?: number;
  bonusAmount?: number;
  autoClaimBonus?: boolean;
  currentSalesProgress?: number;
}

interface RechargeCard {
  id: string;
  provider: string;
  machineId: string;
  costPrice: number;
  sellingPrice: number;
  createdAt: string;
}

interface ServiceTransaction {
  id: string;
  serviceType: string;
  machineId: string;
  cost: number;
  paid: number;
  profit: number;
  createdAt: string;
  type: 'card_sale' | 'service' | 'deposit' | 'bonus' | 'handover';
  isHandedOver?: boolean;
}

export default function RechargeCards() {
  const [machines, setMachines] = useState<Machine[]>([]);

  const isAdminActive = localStorage.getItem("admin_active") === "true";
  const cStr = localStorage.getItem('active_cashier');
  const actCashier = cStr ? JSON.parse(cStr) : null;
  const isOwner = isAdminActive || actCashier?.role_level === 1 || actCashier?.is_owner;
  const branchId = localStorage.getItem("takka_active_branch_id");
  const tenantId = localStorage.getItem("tenant_id") || localStorage.getItem("user_id");
  const userId = localStorage.getItem("user_id");

  
  const [branches, setBranches] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let branchFilter = `&tenant_id=eq.${tenantId}`;
      if (branchId && branchId !== 'ALL') {
        branchFilter += `&branch_id=eq.${branchId}`;
      }
      
      // Fetch branches for branch selector
      const bRes = await fetch(`${SUPABASE_URL}/rest/v1/branches?select=*&tenant_id=eq.${tenantId}`, { headers: getHeaders() });
      if (bRes.ok) setBranches(await bRes.json());

      const [macRes, cardsRes, txRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/recharge_machines?select=*${branchFilter}`, { headers: getHeaders() }),
        fetch(`${SUPABASE_URL}/rest/v1/recharge_cards?select=*${branchFilter}`, { headers: getHeaders() }),
        fetch(`${SUPABASE_URL}/rest/v1/service_transactions?select=*${branchFilter}&order=created_at.desc`, { headers: getHeaders() })
      ]);
      if (macRes.ok) {
        const data = await macRes.json();
        setMachines(data.map((m: any) => ({
          ...m,
          totalProfit: m.total_profit,
          lowBalanceThreshold: m.low_balance_threshold,
          targetAmount: m.target_amount,
          bonusAmount: m.bonus_amount,
          autoClaimBonus: m.auto_claim_bonus,
          branch_id: m.branch_id,
          currentSalesProgress: m.current_sales_progress,
          createdAt: m.created_at
        })));
      }
      if (cardsRes.ok) {
        const data = await cardsRes.json();
        setCards(data.map((c: any) => ({
          ...c,
          machineId: c.machine_id,
          costPrice: c.cost_price,
          sellingPrice: c.selling_price,
          createdAt: c.created_at
        })));
      }
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.map((t: any) => ({
          ...t,
          serviceType: t.service_type,
          machineId: t.machine_id,
          isHandedOver: t.is_handed_over,
          createdAt: t.created_at
        })));
      }
    } catch(e) {}
    setIsLoading(false);
  };

  React.useEffect(() => {
    fetchData();
    
  }, [branchId]);


  const [cards, setCards] = useState<RechargeCard[]>([]);

  const [transactions, setTransactions] = useState<ServiceTransaction[]>([]);

  const [isAddMachineModalOpen, setIsAddMachineModalOpen] = useState(false);
  const [newMachine, setNewMachine] = useState({ name: "", balance: "", threshold: "", targetAmount: "", bonusAmount: "", autoClaimBonus: false, branchId: "" });
  const [isEditMachineModalOpen, setIsEditMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverType, setHandoverType] = useState<'full' | 'partial'>('full');
  const [handoverAmount, setHandoverAmount] = useState<string>("");

  const currentDrawerAmount = transactions
    .filter(t => !t.isHandedOver && t.type !== 'bonus')
    .reduce((sum, t) => {
      if (t.type === 'handover' || t.type === 'deposit') return sum - t.paid;
      return sum + t.paid;
    }, 0);

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDrawerAmount === 0) return;
    if (handoverType === 'partial') {
      const amount = parseFloat(handoverAmount);
      if (isNaN(amount) || amount <= 0 || amount > currentDrawerAmount) { showToast("برجاء إدخال مبلغ صحيح", "error"); return; }
      await fetch(`${SUPABASE_URL}/rest/v1/service_transactions`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ type: 'handover', service_type: 'تسليم جزئي للعهدة', cost: 0, paid: amount, profit: 0, is_handed_over: false, branch_id: (branchId !== "ALL" ? branchId : null), tenant_id: tenantId, user_id: userId })
      });
      showToast(`تم تسليم عهدة بقيمة ${amount} ج.م بنجاح`, "success");
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/service_transactions?type=neq.handover&type=neq.bonus&is_handed_over=eq.false`, {
        method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ is_handed_over: true })
      });
      await fetch(`${SUPABASE_URL}/rest/v1/service_transactions`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ type: 'handover', service_type: 'تسليم العهدة بالكامل', cost: 0, paid: currentDrawerAmount, profit: 0, is_handed_over: true, branch_id: (branchId !== "ALL" ? branchId : null), tenant_id: tenantId, user_id: userId })
      });
      showToast("تم تسليم العهدة بالكامل وتصفير الدرج بنجاح", "success");
    }
    
    setIsHandoverModalOpen(false);
    setHandoverAmount("");
    setHandoverType("full");
    
    
    fetchData();
  };
  
  const [editingCard, setEditingCard] = useState<RechargeCard | null>(null);
  const [newCard, setNewCard] = useState({ provider: "", machineId: "", costPrice: "", sellingPrice: "" });
  const [newService, setNewService] = useState({ serviceType: "", machineId: "", cost: "", paid: "" });
  const [activeTab, setActiveTab] = useState<'cards' | 'transactions' | 'reports'>('cards');
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("الكل");
  const [reportFilter, setReportFilter] = useState<'daily' | 'yesterday' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [toast, setToast] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [activeMachineForDeposit, setActiveMachineForDeposit] = useState<Machine | null>(null);

  const [customProviders, setCustomProviders] = useState<string[]>(() => {
    const saved = localStorage.getItem('recharge_custom_providers');
    if (saved) return JSON.parse(saved);
    return ["فودافون", "اورنج", "اتصالات", "وي"];
  });

  React.useEffect(() => {
    localStorage.setItem('recharge_custom_providers', JSON.stringify(customProviders));
  }, [customProviders]);
  const [newProviderFilter, setNewProviderFilter] = useState("");

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMachineForDeposit || !depositAmount) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;
    
    // update machine
    await fetch(`${SUPABASE_URL}/rest/v1/recharge_machines?id=eq.${activeMachineForDeposit.id}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ balance: activeMachineForDeposit.balance + amount })
    });
    
    // insert transaction
    await fetch(`${SUPABASE_URL}/rest/v1/service_transactions`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({
        type: 'deposit', service_type: 'إيداع رصيد', machine_id: activeMachineForDeposit.id,
        cost: 0, paid: amount, profit: 0, branch_id: activeMachineForDeposit.branch_id || (branchId !== "ALL" ? branchId : null), tenant_id: tenantId, user_id: userId
      })
    });
    
    setIsDepositModalOpen(false);
    setActiveMachineForDeposit(null);
    setDepositAmount("");
    showToast("تم إيداع الرصيد بنجاح!", "success");
    
    
    fetchData();
  };

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachine.name || !newMachine.balance) return;
    const machine = {
      name: newMachine.name,
      balance: parseFloat(newMachine.balance),
      total_profit: 0,
      low_balance_threshold: parseFloat(newMachine.threshold) || 0,
      target_amount: parseFloat(newMachine.targetAmount) || null,
      bonus_amount: parseFloat(newMachine.bonusAmount) || null,
      auto_claim_bonus: newMachine.autoClaimBonus,
      current_sales_progress: 0,
      branch_id: newMachine.branchId || (branchId !== "ALL" ? branchId : null), tenant_id: tenantId, user_id: userId
    };
    await fetch(`${SUPABASE_URL}/rest/v1/recharge_machines`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(machine)
    });
    setIsAddMachineModalOpen(false);
    setNewMachine({ name: "", balance: "", threshold: "", targetAmount: "", bonusAmount: "", autoClaimBonus: false, branchId: "" });
    
    
    fetchData();
  };

  const handleEditMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachine) return;
    const machine = {
      name: editingMachine.name,
      balance: editingMachine.balance,
      branch_id: (editingMachine as any).branch_id,
      low_balance_threshold: editingMachine.lowBalanceThreshold,
      target_amount: editingMachine.targetAmount,
      bonus_amount: editingMachine.bonusAmount,
      auto_claim_bonus: editingMachine.autoClaimBonus
    };
    await fetch(`${SUPABASE_URL}/rest/v1/recharge_machines?id=eq.${editingMachine.id}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify(machine)
    });
    setIsEditMachineModalOpen(false);
    setEditingMachine(null);
    
    
    fetchData();
  };

  const handleResetMachineProfit = (machineId: string) => {
    setConfirmReset(machineId);
  };

  const executeResetMachineProfit = async () => {
    if (confirmReset) {
      await fetch(`${SUPABASE_URL}/rest/v1/recharge_machines?id=eq.${confirmReset}`, {
        method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ total_profit: 0 })
      });
      setConfirmReset(null);
      
    }
    
    fetchData();
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.provider || !newCard.machineId || !newCard.costPrice || !newCard.sellingPrice) return;
    const machine = machines.find(m => m.id === newCard.machineId);
    const card = {
      provider: newCard.provider,
      machine_id: newCard.machineId,
      cost_price: parseFloat(newCard.costPrice),
      selling_price: parseFloat(newCard.sellingPrice),
      branch_id: machine?.branch_id || (branchId !== "ALL" ? branchId : null), tenant_id: tenantId, user_id: userId
    };
    await fetch(`${SUPABASE_URL}/rest/v1/recharge_cards`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(card)
    });
    setIsAddModalOpen(false);
    setNewCard({ provider: "", machineId: "", costPrice: "", sellingPrice: "" });
    
    
    fetchData();
  };

  const handleEditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    const card = {
      provider: editingCard.provider,
      machine_id: editingCard.machineId,
      cost_price: editingCard.costPrice,
      selling_price: editingCard.sellingPrice
    };
    await fetch(`${SUPABASE_URL}/rest/v1/recharge_cards?id=eq.${editingCard.id}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify(card)
    });
    setIsEditModalOpen(false);
    setEditingCard(null);
    
    
    fetchData();
  };

  const handleDeleteCard = (id: string) => {
    setConfirmDelete(id);
  };

  const executeDeleteCard = async () => {
    if (confirmDelete) {
      await fetch(`${SUPABASE_URL}/rest/v1/recharge_cards?id=eq.${confirmDelete}`, {
        method: 'DELETE', headers: getHeaders()
      });
      setConfirmDelete(null);
      
    }
    
    fetchData();
  };

  
  const handleSellCard = async (card: RechargeCard) => {
    const machine = machines.find(m => m.id === card.machineId);
    if (!machine) { showToast("الماكينة غير موجودة!", "error"); return; }
    if (machine.balance < card.costPrice) {
      showToast(`عذراً، رصيد الماكينة (${machine.balance.toFixed(2)} ج.م) لا يكفي لإتمام العملية.`, "error"); return;
    }
    const profit = card.sellingPrice - card.costPrice;
    
    // calc target/bonus
    let newProgress = (machine.currentSalesProgress || 0) + card.costPrice;
    let balanceChange = -card.costPrice;
    let profitChange = profit;
    
    let bonusTx = null;
    if (machine.targetAmount && machine.targetAmount > 0 && machine.bonusAmount && machine.bonusAmount > 0 && machine.autoClaimBonus) {
        let bonusesEarned = 0;
        while (newProgress >= machine.targetAmount) { bonusesEarned++; newProgress -= machine.targetAmount; }
        if (bonusesEarned > 0) {
          const totalBonus = bonusesEarned * machine.bonusAmount;
          balanceChange += totalBonus; profitChange += totalBonus;
          bonusTx = { type: 'bonus', service_type: `تحقيق التارجت (${bonusesEarned}x)`, machine_id: machine.id, cost: 0, paid: 0, profit: totalBonus, branch_id: machine.branch_id || (branchId !== "ALL" ? branchId : null), tenant_id: tenantId, user_id: userId };
        }
    }
    
    await fetch(`${SUPABASE_URL}/rest/v1/recharge_machines?id=eq.${machine.id}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ balance: machine.balance + balanceChange, total_profit: machine.totalProfit + profitChange, current_sales_progress: newProgress })
    });
    
    await fetch(`${SUPABASE_URL}/rest/v1/service_transactions`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ type: 'card_sale', service_type: `كارت شحن ${card.provider}`, machine_id: card.machineId, cost: card.costPrice, paid: card.sellingPrice, profit: profit, branch_id: machine.branch_id || (branchId !== "ALL" ? branchId : null), tenant_id: tenantId, user_id: userId })
    });
    if (bonusTx) {
      await fetch(`${SUPABASE_URL}/rest/v1/service_transactions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(bonusTx) });
    }
    
    
    showToast(`تم تسجيل بيع كرت ${card.provider} بنجاح!`, "success");
    
    
    fetchData();
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.serviceType || !newService.machineId || !newService.cost || !newService.paid) return;
    const cost = parseFloat(newService.cost);
    const paid = parseFloat(newService.paid);
    const profit = paid - cost;
    const machine = machines.find(m => m.id === newService.machineId);
    if (!machine) { showToast("الماكينة غير موجودة!", "error"); return; }
    if (machine.balance < cost) { showToast(`عذراً، رصيد الماكينة (${machine.balance.toFixed(2)} ج.م) لا يكفي.`, "error"); return; }
    
    // calc target/bonus
    let newProgress = (machine.currentSalesProgress || 0) + cost;
    let balanceChange = -cost;
    let profitChange = profit;
    
    let bonusTx = null;
    if (machine.targetAmount && machine.targetAmount > 0 && machine.bonusAmount && machine.bonusAmount > 0 && machine.autoClaimBonus) {
        let bonusesEarned = 0;
        while (newProgress >= machine.targetAmount) { bonusesEarned++; newProgress -= machine.targetAmount; }
        if (bonusesEarned > 0) {
          const totalBonus = bonusesEarned * machine.bonusAmount;
          balanceChange += totalBonus; profitChange += totalBonus;
          bonusTx = { type: 'bonus', service_type: `تحقيق التارجت (${bonusesEarned}x)`, machine_id: machine.id, cost: 0, paid: 0, profit: totalBonus, branch_id: machine.branch_id || (branchId !== "ALL" ? branchId : null), tenant_id: tenantId, user_id: userId };
        }
    }
    
    await fetch(`${SUPABASE_URL}/rest/v1/recharge_machines?id=eq.${machine.id}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ balance: machine.balance + balanceChange, total_profit: machine.totalProfit + profitChange, current_sales_progress: newProgress })
    });
    
    await fetch(`${SUPABASE_URL}/rest/v1/service_transactions`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ type: 'service', service_type: newService.serviceType, machine_id: newService.machineId, cost, paid, profit, branch_id: machine.branch_id || (branchId !== "ALL" ? branchId : null), tenant_id: tenantId, user_id: userId })
    });
    if (bonusTx) {
      await fetch(`${SUPABASE_URL}/rest/v1/service_transactions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(bonusTx) });
    }
    
    
    setIsServiceModalOpen(false);
    setNewService({ serviceType: "", machineId: "", cost: "", paid: "" });
    showToast("تم تسجيل الخدمة بنجاح!", "success");
    
    
    fetchData();
  };

  const handleClaimBonus = async (machine: Machine) => {
    if (!machine.targetAmount || !machine.bonusAmount || (machine.currentSalesProgress || 0) < machine.targetAmount) return;
    let newProgress = machine.currentSalesProgress || 0;
    let bonusesEarned = 0;
    while (newProgress >= machine.targetAmount) { bonusesEarned++; newProgress -= machine.targetAmount; }
    const totalBonus = bonusesEarned * machine.bonusAmount;
    
    await fetch(`${SUPABASE_URL}/rest/v1/recharge_machines?id=eq.${machine.id}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ balance: machine.balance + totalBonus, total_profit: machine.totalProfit + totalBonus, current_sales_progress: newProgress })
    });
    await fetch(`${SUPABASE_URL}/rest/v1/service_transactions`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ type: 'bonus', service_type: `تحقيق التارجت (${bonusesEarned}x)`, machine_id: machine.id, cost: 0, paid: 0, profit: totalBonus, branch_id: machine.branch_id || (branchId !== "ALL" ? branchId : null), tenant_id: tenantId, user_id: userId })
    });
    
    
    showToast(`تم الحصول على بونص ${totalBonus} ج.م بنجاح`, "success");
    
    
    fetchData();
  };

  const filteredCards = cards.filter(card => {
    const machineName = machines.find(m => m.id === card.machineId)?.name || '';
    const matchesSearch = card.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
           machineName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = providerFilter === "الكل" || card.provider === providerFilter;
    return matchesSearch && matchesProvider;
  });

  const totalMachinesBalance = machines.reduce((sum, m) => sum + m.balance, 0);
  const totalMachinesProfit = machines.reduce((sum, m) => sum + m.totalProfit, 0);
  const todaySales = transactions
    .filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString() && (t.type === 'card_sale' || t.type === 'service'))
    .reduce((sum, t) => sum + t.paid, 0);

  const getFilteredTransactions = (filter: 'daily' | 'yesterday' | 'weekly' | 'monthly' | 'yearly') => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.createdAt);
      if (filter === 'daily') {
        return d.toDateString() === now.toDateString();
      } else if (filter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return d.toDateString() === yesterday.toDateString();
      } else if (filter === 'weekly') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return d >= startOfWeek;
      } else if (filter === 'monthly') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (filter === 'yearly') {
        return d.getFullYear() === now.getFullYear();
      }
      return false;
    });
  };

  const reportTransactions = getFilteredTransactions(reportFilter);
  const salesTx = reportTransactions.filter(t => t.type !== 'deposit' && t.type !== 'bonus' && t.type !== 'handover');
  const depositTx = reportTransactions.filter(t => t.type === 'deposit');
  const bonusTx = reportTransactions.filter(t => t.type === 'bonus');
  const handoverReportTx = reportTransactions.filter(t => t.type === 'handover');
  
  const reportStats = {
    sales: salesTx.reduce((sum, t) => sum + t.paid, 0),
    cost: salesTx.reduce((sum, t) => sum + t.cost, 0),
    profit: salesTx.reduce((sum, t) => sum + t.profit, 0) + bonusTx.reduce((sum, t) => sum + t.profit, 0),
    deposits: depositTx.reduce((sum, t) => sum + t.paid, 0),
    handovers: handoverReportTx.reduce((sum, t) => sum + t.paid, 0),
    count: salesTx.length
  };

  const reportStatsByMachine = machines.map(machine => {
    const machineTx = salesTx.filter(t => t.machineId === machine.id);
    const machineBonusTx = bonusTx.filter(t => t.machineId === machine.id);
    return {
      machine,
      count: machineTx.length,
      profit: machineTx.reduce((sum, t) => sum + t.profit, 0) + machineBonusTx.reduce((sum, t) => sum + t.profit, 0),
      sales: machineTx.reduce((sum, t) => sum + t.paid, 0),
      name: machine.name
    };
  }).filter(stat => stat.count > 0 || stat.profit > 0).sort((a, b) => b.profit - a.profit);

  const exportToExcel = () => {
    if (reportTransactions.length === 0) {
      showToast("لا توجد بيانات لتصديرها", "error");
      return;
    }

    const exportData = reportTransactions.map(tx => {
      const machineName = machines.find(m => m.id === tx.machineId)?.name || 'ماكينة غير معروفة';
      return {
        'التاريخ': new Date(tx.createdAt).toLocaleString('ar-EG'),
        'نوع العملية': tx.type === 'deposit' ? 'إيداع' : tx.type === 'bonus' ? 'بونص تارجت' : tx.type === 'handover' ? 'تسليم عهدة' : 'بيع',
        'الخدمة': tx.serviceType,
        'الماكينة': tx.type === 'handover' ? '-' : machineName,
        'التكلفة': tx.type === 'deposit' || tx.type === 'bonus' || tx.type === 'handover' ? 0 : tx.cost,
        'المبلغ المدفوع / المودع': tx.type === 'bonus' ? 0 : tx.paid,
        'الربح': tx.type === 'deposit' || tx.type === 'handover' ? 0 : tx.profit
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "العمليات");
    XLSX.writeFile(workbook, `تقرير_العمليات_${reportFilter}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("تم تصدير التقرير بنجاح", "success");
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/10 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary-500" />
            </div>
            كروت الشحن والخدمات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة كروت الشحن، تسجيل الخدمات العامة، وأرصدة الماكينة
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-2.5 rounded-xl flex items-center gap-4 ml-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium mb-0.5">درج المبيعات</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 leading-none">{currentDrawerAmount.toFixed(2)} <span className="text-sm font-normal">ج</span></p>
              </div>
            </div>
            <button 
              onClick={() => setIsHandoverModalOpen(true)}
              disabled={currentDrawerAmount === 0}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              تسليم عهدة
            </button>
          </div>
          {isOwner && (<button
            onClick={() => setIsAddMachineModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-800/30 font-medium"
          >
            <Plus className="w-5 h-5" />
            إضافة ماكينة
          </button>)}
          <button
            onClick={() => setIsServiceModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 font-medium"
          >
            <Plus className="w-5 h-5" />
            تسجيل خدمة
          </button>
          {isOwner && (<button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30 font-medium"
          >
            <Plus className="w-5 h-5" />
            إضافة كرت
          </button>)}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 end-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
            <Wallet className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الرصيد في الماكينات</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalMachinesBalance.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 end-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
            <DollarSign className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">إجمالي مبيعات اليوم</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{todaySales.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#11151c] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 end-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">إجمالي الأرباح</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalMachinesProfit.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-[#1a1f26] p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('cards')}
          className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            activeTab === 'cards' 
              ? 'bg-white dark:bg-[#11151c] text-primary-600 dark:text-primary-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          الكروت والماكينات
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            activeTab === 'transactions' 
              ? 'bg-white dark:bg-[#11151c] text-primary-600 dark:text-primary-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          سجل العمليات
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'reports' 
              ? 'bg-white dark:bg-[#11151c] text-primary-600 dark:text-primary-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          التقارير
        </button>
      </div>

      {activeTab === 'cards' && (
        <>
          {/* Machines Grid */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">الماكينات المتاحة</h2>
            </div>
            {machines.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {machines.map((machine) => (
                  <div key={machine.id} className={`p-5 rounded-2xl border shadow-sm transition-colors flex flex-col gap-3 ${machine.balance <= machine.lowBalanceThreshold ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30' : 'bg-white dark:bg-[#11151c] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${machine.balance <= machine.lowBalanceThreshold ? 'bg-red-100 dark:bg-red-500/20' : 'bg-slate-100 dark:bg-[#1a1f26]'}`}>
                          <Smartphone className={`w-5 h-5 ${machine.balance <= machine.lowBalanceThreshold ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`} />
                        </div>
                        <div>
                          <h3 className={`font-bold ${machine.balance <= machine.lowBalanceThreshold ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-white'}`}>{machine.name}</h3>
                          {machine.balance <= machine.lowBalanceThreshold && (
                            <p className="text-[10px] font-medium text-red-600 dark:text-red-400 mt-0.5">الرصيد منخفض</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setActiveMachineForDeposit(machine);
                            setIsDepositModalOpen(true);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${machine.balance <= machine.lowBalanceThreshold ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}
                          title="إيداع رصيد"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        {isOwner && (<button
                          onClick={() => {
                            setEditingMachine(machine);
                            setIsEditMachineModalOpen(true);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${machine.balance <= machine.lowBalanceThreshold ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'}`}
                          title="تعديل الماكينة"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>)}
                        {isOwner && (<button
                          onClick={() => handleResetMachineProfit(machine.id)}
                          className={`p-1.5 rounded-lg transition-colors ${machine.balance <= machine.lowBalanceThreshold ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}
                          title="تصفير الأرباح (سحب)"
                        >
                          <Activity className="w-4 h-4" />
                        </button>)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className={`p-3 rounded-xl border ${machine.balance <= machine.lowBalanceThreshold ? 'border-red-200 dark:border-red-500/20 bg-white/50 dark:bg-white/5' : 'bg-slate-50 dark:bg-[#1a1f26]/50 border-slate-100 dark:border-white/5'}`}>
                        <p className={`text-xs mb-1 ${machine.balance <= machine.lowBalanceThreshold ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-500'}`}>الرصيد</p>
                        <p className={`font-bold font-mono ${machine.balance <= machine.lowBalanceThreshold ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}`}>{machine.balance.toFixed(2)} ج</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-500/5 p-3 rounded-xl border border-purple-100 dark:border-purple-500/10">
                        <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mb-1">أرباح الماكينة</p>
                        <p className="font-bold font-mono text-purple-700 dark:text-purple-400">{machine.totalProfit.toFixed(2)} ج</p>
                      </div>
                    </div>
                    {machine.targetAmount && machine.targetAmount > 0 && machine.currentSalesProgress !== undefined && (
                      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-white/5">
                          <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[10px] font-medium text-slate-500">تارجت المبيعات ({machine.targetAmount} ج)</span>
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                  {Math.min(machine.currentSalesProgress, machine.targetAmount).toFixed(0)} ج
                              </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-1.5 mb-2 overflow-hidden">
                              <div 
                                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                                  style={{ width: `${Math.min((machine.currentSalesProgress / machine.targetAmount) * 100, 100)}%` }}
                              ></div>
                          </div>
                          {!machine.autoClaimBonus && machine.currentSalesProgress >= machine.targetAmount && (
                              <button
                                  onClick={() => handleClaimBonus(machine)}
                                  className="w-full py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-lg text-xs font-bold shadow-sm shadow-amber-500/20 hover:from-amber-500 hover:to-amber-600 transition-colors flex justify-center items-center gap-1.5"
                              >
                                  <Star className="w-4 h-4 fill-white" />
                                  الحصول على بونص ({machine.bonusAmount} ج)
                              </button>
                          )}
                          {machine.autoClaimBonus && machine.currentSalesProgress >= machine.targetAmount && (
                              <div className="w-full py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold flex justify-center items-center gap-1.5 border border-emerald-100 dark:border-emerald-500/20">
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  سيتم إضافة البونص تلقائياً
                              </div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#11151c] p-6 rounded-2xl border border-slate-200 dark:border-white/5 text-center text-slate-500">
                لا توجد ماكينات مضافة بعد. قم بإضافة ماكينة أولاً.
              </div>
            )}
          </div>

          {/* Cards List Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-[#11151c] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">الكروت المتاحة</h2>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide items-center">
                {["الكل", ...customProviders].map(provider => (
                  <button
                    key={provider}
                    onClick={() => setProviderFilter(provider)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                      providerFilter === provider 
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-primary-500 dark:border-primary-500' 
                        : 'bg-white dark:bg-[#11151c] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#1a1f26]'
                    }`}
                  >
                    {provider}
                  </button>
                ))}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newProviderFilter.trim() && !customProviders.includes(newProviderFilter.trim())) {
                      setCustomProviders([...customProviders, newProviderFilter.trim()]);
                      setProviderFilter(newProviderFilter.trim());
                      setNewProviderFilter("");
                    }
                  }}
                  className="flex items-center gap-1 min-w-fit ml-2"
                >
                  <input
                    type="text"
                    value={newProviderFilter}
                    onChange={(e) => setNewProviderFilter(e.target.value)}
                    placeholder="إضافة فلتر..."
                    className="px-3 py-1.5 bg-white dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-full text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:text-white w-28"
                  />
                  <button
                    type="submit"
                    disabled={!newProviderFilter.trim()}
                    className="p-1.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث عن مزود أو ماكينة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCards.map((card) => (
            <div key={card.id} className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col group hover:border-primary-500/50 hover:shadow-md transition-all">
              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-[#1a1f26] flex items-center justify-center shrink-0">
                      <CreditCard className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{card.provider}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>{machines.find(m => m.id === card.machineId)?.name || 'غير معروف'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-slate-50 dark:bg-[#1a1f26]/50 rounded-2xl">
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">سعر التكلفة</span>
                    <span className="text-base font-bold font-mono text-slate-700 dark:text-slate-300">{card.costPrice.toFixed(2)} ج</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">سعر البيع</span>
                    <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">{card.sellingPrice.toFixed(2)} ج</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-slate-500">الربح المتوقع:</span>
                  <span className="font-bold font-mono text-purple-600 dark:text-purple-400">+{(card.sellingPrice - card.costPrice).toFixed(2)} ج.م</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#1a1f26]/50 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-2 mt-auto">
                <button
                  onClick={() => handleSellCard(card)}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors font-medium text-sm shadow-md shadow-primary-500/20"
                >
                  <ShoppingCart className="w-4 h-4" />
                  بيع
                </button>
                <div className="flex items-center gap-2">
                  {isOwner && (<button
                    onClick={() => {
                      setEditingCard(card);
                      setIsEditModalOpen(true);
                    }}
                    className="p-2.5 bg-white dark:bg-[#11151c] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors border border-slate-200 dark:border-white/5 shadow-sm"
                    title="تعديل"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>)}
                  {isOwner && (<button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-2.5 bg-white dark:bg-[#11151c] hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-colors border border-slate-200 dark:border-white/5 shadow-sm"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#11151c] p-12 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-[#1a1f26] rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">لا توجد كروت متاحة</h3>
          <p className="text-slate-500 max-w-sm">لم يتم العثور على أي كروت مطابقة لبحثك. يمكنك إضافة كرت جديد لتبدأ.</p>
        </div>
      )}
      </>
      )}

      {activeTab === 'transactions' && (
      <>
        {/* Services Transactions List */}
        <div className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-white/5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            سجل العمليات (كروت وخدمات)
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 dark:bg-[#1a1f26]/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">الخدمة</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">الماكينة</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">التكلفة</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">المبلغ</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">الربح</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className={`font-medium ${transaction.type === 'deposit' ? 'text-blue-600 dark:text-blue-400' : transaction.type === 'bonus' ? 'text-amber-600 dark:text-amber-400' : transaction.type === 'handover' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                        {transaction.serviceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {transaction.type === 'handover' ? '-' : (machines.find(m => m.id === transaction.machineId)?.name || 'غير معروف')}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">
                      {transaction.type === 'deposit' || transaction.type === 'bonus' || transaction.type === 'handover' ? '-' : `${transaction.cost.toFixed(2)} ج.م`}
                    </td>
                    <td className={`px-6 py-4 font-mono font-medium ${transaction.type === 'deposit' ? 'text-blue-600 dark:text-blue-400' : transaction.type === 'bonus' ? 'text-amber-600 dark:text-amber-400' : transaction.type === 'handover' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {transaction.type === 'bonus' ? '-' : `${transaction.paid.toFixed(2)} ج.م`}
                    </td>
                    <td className={`px-6 py-4 font-mono font-medium ${transaction.type === 'bonus' ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'}`}>
                      {transaction.type === 'deposit' || transaction.type === 'handover' ? '-' : `${transaction.profit.toFixed(2)} ج.م`}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(transaction.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    لا توجد عمليات مسجلة حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {activeTab === 'reports' && (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#11151c] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-500" />
              تقارير الأرباح والمبيعات
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                تصدير Excel
              </button>
              <div className="flex bg-slate-100 dark:bg-[#1a1f26] p-1 rounded-xl">
                <button
                  onClick={() => setReportFilter('daily')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportFilter === 'daily' ? 'bg-white dark:bg-[#11151c] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  اليوم
                </button>
                <button
                  onClick={() => setReportFilter('yesterday')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportFilter === 'yesterday' ? 'bg-white dark:bg-[#11151c] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  الأمس
                </button>
                <button
                  onClick={() => setReportFilter('weekly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportFilter === 'weekly' ? 'bg-white dark:bg-[#11151c] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  أسبوعي
                </button>
                <button
                  onClick={() => setReportFilter('monthly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportFilter === 'monthly' ? 'bg-white dark:bg-[#11151c] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  شهري
                </button>
                <button
                  onClick={() => setReportFilter('yearly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportFilter === 'yearly' ? 'bg-white dark:bg-[#11151c] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  سنوي
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-slate-50 dark:bg-[#1a1f26]/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">عدد العمليات</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{reportStats.count}</h3>
            </div>
            
            <div className="bg-slate-50 dark:bg-[#1a1f26]/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">المبيعات (المدفوع)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{reportStats.sales.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
            </div>

            <div className="bg-slate-50 dark:bg-[#1a1f26]/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mb-3">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">التكلفة الإجمالية</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{reportStats.cost.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
            </div>

            <div className="bg-slate-50 dark:bg-[#1a1f26]/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">صافي الأرباح</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{reportStats.profit.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
            </div>

            <div className="bg-slate-50 dark:bg-[#1a1f26]/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">إجمالي الإيداعات</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{reportStats.deposits.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
            </div>

            <div className="bg-slate-50 dark:bg-[#1a1f26]/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">إجمالي العهدة المسلمة</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{reportStats.handovers.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-slate-50 dark:bg-[#1a1f26]/30 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                رسم بياني لأرباح الماكينات
              </h3>
              {reportStatsByMachine.length > 0 ? (
                <div className="h-[300px] w-full mt-4" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportStatsByMachine} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                        cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                      />
                      <Bar dataKey="profit" name="الربح" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center p-8 text-slate-500 dark:text-slate-400 bg-white dark:bg-[#11151c] rounded-xl border border-slate-200 dark:border-white/5 h-[300px] flex items-center justify-center">
                  لا توجد بيانات متاحة لعرض الرسم البياني.
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-[#1a1f26]/30 rounded-2xl border border-slate-100 dark:border-white/5 p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                العمليات في هذه الفترة
              </h3>
              {reportTransactions.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {reportTransactions.map((tx) => {
                    const machineName = machines.find(m => m.id === tx.machineId)?.name || 'ماكينة محذوفة';
                    return (
                      <div key={tx.id} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11151c] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">{tx.serviceType}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-[#1a1f26] px-2 py-1 rounded-md">
                              <Smartphone className="w-3.5 h-3.5" />
                              {machineName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(tx.createdAt).toLocaleString('ar-EG')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-4 min-w-fit">
                          {tx.type === 'deposit' ? (
                            <div className="text-left bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-500/20">
                              <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mb-0.5">المبلغ المودع</p>
                              <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">{tx.paid.toFixed(2)} ج</p>
                            </div>
                          ) : tx.type === 'bonus' ? (
                            <div className="text-left bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-500/20">
                              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mb-0.5">بونص التارجت</p>
                              <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">{tx.profit.toFixed(2)} ج</p>
                            </div>
                          ) : tx.type === 'handover' ? (
                            <div className="text-left bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-500/20">
                              <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mb-0.5">مبلغ العهدة</p>
                              <p className="font-bold text-rose-600 dark:text-rose-400 text-sm">{tx.paid.toFixed(2)} ج</p>
                            </div>
                          ) : (
                            <>
                              <div className="text-left bg-slate-50 dark:bg-[#1a1f26] px-3 py-1.5 rounded-lg">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">المدفوع</p>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{tx.paid.toFixed(2)} ج</p>
                              </div>
                              <div className="text-left bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mb-0.5">الربح</p>
                                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{tx.profit.toFixed(2)} ج</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 text-slate-500 dark:text-slate-400 bg-white dark:bg-[#11151c] rounded-xl border border-slate-200 dark:border-white/5 h-[300px] flex items-center justify-center">
                  لا توجد عمليات في هذه الفترة.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Add / Edit Modal for Cards */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#11151c] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden"
              dir="rtl"
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {isEditModalOpen ? <Edit2 className="w-5 h-5 text-blue-500" /> : <CreditCard className="w-5 h-5 text-primary-500" />}
                  {isEditModalOpen ? "تعديل كرت" : "إضافة كرت شحن"}
                </h3>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a1f26] rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={isEditModalOpen ? handleEditCard : handleAddCard} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    مزود الخدمة
                  </label>
                  <input
                    type="text"
                    required
                    value={isEditModalOpen ? editingCard?.provider : newCard.provider}
                    onChange={(e) => isEditModalOpen 
                      ? setEditingCard({ ...editingCard!, provider: e.target.value })
                      : setNewCard({ ...newCard, provider: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white"
                    placeholder="مثال: فودافون، اتصالات، أورانج، وي"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    الماكينة
                  </label>
                  <select required
                    value={isEditModalOpen ? editingCard?.machineId : newCard.machineId}
                    onChange={(e) => isEditModalOpen 
                      ? setEditingCard({ ...editingCard!, machineId: e.target.value })
                      : setNewCard({ ...newCard, machineId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white"
                  >
                    <option value="">اختر الماكينة...</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      سعر التكلفة
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={isEditModalOpen ? editingCard?.costPrice : newCard.costPrice}
                        onChange={(e) => isEditModalOpen
                          ? setEditingCard({ ...editingCard!, costPrice: parseFloat(e.target.value) || 0 })
                          : setNewCard({ ...newCard, costPrice: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white font-mono text-left"
                        placeholder="0.00"
                        dir="ltr"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      سعر البيع
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={isEditModalOpen ? editingCard?.sellingPrice : newCard.sellingPrice}
                        onChange={(e) => isEditModalOpen
                          ? setEditingCard({ ...editingCard!, sellingPrice: parseFloat(e.target.value) || 0 })
                          : setNewCard({ ...newCard, sellingPrice: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all dark:text-white font-mono text-left"
                        placeholder="0.00"
                        dir="ltr"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                    </div>
                  </div>
                </div>

                

                <div className="pt-4 flex gap-3">

                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30 font-medium"
                  >
                    {isEditModalOpen ? "حفظ التعديلات" : "إضافة الكرت"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-[#1a1f26] text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Modal for Services */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsServiceModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#11151c] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden"
              dir="rtl"
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  تسجيل خدمة
                </h3>
                <button
                  onClick={() => setIsServiceModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a1f26] rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddService} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    نوع الخدمة
                  </label>
                  <input
                    type="text"
                    list="service-types"
                    required
                    value={newService.serviceType}
                    onChange={(e) => setNewService({ ...newService, serviceType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
                    placeholder="اختر أو اكتب نوع الخدمة..."
                  />
                  <datalist id="service-types">
                    <option value="شحن غاز" />
                    <option value="شحن كهرباء" />
                    <option value="شحن مياه" />
                    <option value="شحن انترنت" />
                    <option value="دفع مصاريف دراسية" />
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    الماكينة المستخدمة
                  </label>
                  <select required
                    value={newService.machineId}
                    onChange={(e) => setNewService({ ...newService, machineId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
                  >
                    <option value="">اختر الماكينة...</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      تكلفة العملية عليك
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={newService.cost}
                        onChange={(e) => setNewService({ ...newService, cost: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white font-mono text-left"
                        placeholder="0.00"
                        dir="ltr"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      المبلغ المدفوع من العميل
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={newService.paid}
                        onChange={(e) => setNewService({ ...newService, paid: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white font-mono text-left"
                        placeholder="0.00"
                        dir="ltr"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                    </div>
                  </div>
                </div>

                {newService.cost && newService.paid && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 flex justify-between items-center">
                    <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">الربح المحسوب:</span>
                    <span className="font-bold font-mono text-blue-700 dark:text-blue-400">
                      {(parseFloat(newService.paid) - parseFloat(newService.cost)).toFixed(2)} ج.م
                    </span>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 font-medium"
                  >
                    تسجيل الخدمة
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-[#1a1f26] text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Machine Modal */}
      <AnimatePresence>
        {isAddMachineModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsAddMachineModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#11151c] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden"
              dir="rtl"
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-slate-800 dark:text-slate-200" />
                  إضافة ماكينة جديدة
                </h3>
                <button
                  onClick={() => setIsAddMachineModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a1f26] rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddMachine} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    اسم الماكينة
                  </label>
                  <input
                    type="text"
                    required
                    value={newMachine.name}
                    onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all dark:text-white"
                    placeholder="مثال: فوري 1، أمان، مصاري..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    الرصيد الحالي (ج.م)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={newMachine.balance}
                      onChange={(e) => setNewMachine({ ...newMachine, balance: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all dark:text-white font-mono text-left"
                      placeholder="0.00"
                      dir="ltr"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    الحد الأدنى للتنبيه (ج.م)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={newMachine.threshold}
                      onChange={(e) => setNewMachine({ ...newMachine, threshold: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all dark:text-white font-mono text-left"
                      placeholder="مثال: 500"
                      dir="ltr"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    تارجت المبيعات (اختياري)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newMachine.targetAmount}
                      onChange={(e) => setNewMachine({ ...newMachine, targetAmount: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all dark:text-white font-mono text-left"
                      placeholder="مثال: 1000"
                      dir="ltr"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    بونص تحقيق التارجت
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newMachine.bonusAmount}
                      onChange={(e) => setNewMachine({ ...newMachine, bonusAmount: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all dark:text-white font-mono text-left"
                      placeholder="مثال: 50"
                      dir="ltr"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="autoClaimBonus"
                    checked={newMachine.autoClaimBonus}
                    onChange={(e) => setNewMachine({ ...newMachine, autoClaimBonus: e.target.checked })}
                    className="w-4 h-4 text-amber-500 bg-slate-50 border-slate-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-[#1a1f26] dark:border-white/20"
                  />
                  <label htmlFor="autoClaimBonus" className="text-sm text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                    إضافة البونص تلقائياً عند تحقيق التارجت
                  </label>
                </div>

                {isOwner && branches.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      الفرع
                    </label>
                    <select required
                      value={newMachine.branchId || ""}
                      onChange={(e) => setNewMachine({ ...newMachine, branchId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 outline-none transition-all dark:text-white"
                    >
                      <option value="" disabled>اختر الفرع...</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-800/30 font-medium"
                  >
                    حفظ الماكينة
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddMachineModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-[#1a1f26] text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Edit Machine Modal */}
      <AnimatePresence>
        {isEditMachineModalOpen && editingMachine && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => {
                setIsEditMachineModalOpen(false);
                setEditingMachine(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#11151c] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden"
              dir="rtl"
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-slate-800 dark:text-slate-200" />
                  تعديل الماكينة
                </h3>
                <button
                  onClick={() => {
                    setIsEditMachineModalOpen(false);
                    setEditingMachine(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a1f26] rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleEditMachineSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    اسم الماكينة
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMachine.name}
                    onChange={(e) => setEditingMachine({ ...editingMachine, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    الرصيد الحالي (ج.م)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editingMachine.balance}
                      onChange={(e) => setEditingMachine({ ...editingMachine, balance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white font-mono text-left"
                      dir="ltr"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    الحد الأدنى للتنبيه (ج.م)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editingMachine.lowBalanceThreshold}
                      onChange={(e) => setEditingMachine({ ...editingMachine, lowBalanceThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white font-mono text-left"
                      dir="ltr"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    تارجت المبيعات (اختياري)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingMachine.targetAmount || ''}
                      onChange={(e) => setEditingMachine({ ...editingMachine, targetAmount: parseFloat(e.target.value) || undefined })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all dark:text-white font-mono text-left"
                      placeholder="مثال: 1000"
                      dir="ltr"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    بونص تحقيق التارجت
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingMachine.bonusAmount || ''}
                      onChange={(e) => setEditingMachine({ ...editingMachine, bonusAmount: parseFloat(e.target.value) || undefined })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all dark:text-white font-mono text-left"
                      placeholder="مثال: 50"
                      dir="ltr"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="autoClaimBonusEdit"
                    checked={editingMachine.autoClaimBonus || false}
                    onChange={(e) => setEditingMachine({ ...editingMachine, autoClaimBonus: e.target.checked })}
                    className="w-4 h-4 text-amber-500 bg-slate-50 border-slate-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-[#1a1f26] dark:border-white/20"
                  />
                  <label htmlFor="autoClaimBonusEdit" className="text-sm text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                    إضافة البونص تلقائياً عند تحقيق التارجت
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 font-medium"
                  >
                    حفظ التعديلات
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMachineModalOpen(false);
                      setEditingMachine(null);
                    }}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-[#1a1f26] text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#11151c] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/10 w-full max-w-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">تأكيد الحذف</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">هل أنت متأكد من حذف هذا الكرت؟</p>
              <div className="flex gap-3">
                <button onClick={executeDeleteCard} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors">حذف</button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-[#1a1f26] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl font-medium transition-colors">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}

        {confirmReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmReset(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#11151c] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/10 w-full max-w-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">تأكيد تصفير الأرباح</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">هل أنت متأكد من سحب/تصفير أرباح هذه الماكينة؟</p>
              <div className="flex gap-3">
                <button onClick={executeResetMachineProfit} className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors">تصفير الأرباح</button>
                <button onClick={() => setConfirmReset(null)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-[#1a1f26] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl font-medium transition-colors">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}

        {isHandoverModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsHandoverModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#11151c] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/10 w-full max-w-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                  </div>
                  تسليم عهدة
                </h3>
              </div>
              <div className="mb-6 p-4 bg-slate-50 dark:bg-[#1a1f26] rounded-xl border border-slate-200 dark:border-white/10">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">إجمالي العهدة الحالية</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{currentDrawerAmount.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></p>
              </div>
              <form onSubmit={handleHandoverSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    نوع التسليم
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHandoverType('full')}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors border ${handoverType === 'full' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-[#11151c] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      تسليم بالكامل
                    </button>
                    <button
                      type="button"
                      onClick={() => setHandoverType('partial')}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors border ${handoverType === 'partial' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-[#11151c] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      تسليم جزئي
                    </button>
                  </div>
                </div>

                {handoverType === 'partial' && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      المبلغ المراد تسليمه
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        max={currentDrawerAmount}
                        value={handoverAmount}
                        onChange={(e) => setHandoverAmount(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-white font-mono text-left"
                        placeholder="أدخل المبلغ"
                        dir="ltr"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ج.م</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 text-sm"
                  >
                    تأكيد التسليم
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHandoverModalOpen(false)}
                    className="flex-1 bg-slate-100 dark:bg-[#1a1f26] text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-white/5 transition-colors text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isDepositModalOpen && activeMachineForDeposit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsDepositModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#11151c] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/10 w-full max-w-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  إيداع رصيد للماكينة
                </h3>
              </div>
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    المبلغ (ج.م)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-white"
                    placeholder="أدخل المبلغ..."
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">
                    تأكيد الإيداع
                  </button>
                  <button type="button" onClick={() => setIsDepositModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-[#1a1f26] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl font-medium transition-colors">
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className={`fixed bottom-6 left-1/2 z-[100] px-6 py-3 text-white font-medium rounded-xl shadow-lg flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

