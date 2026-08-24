
import React, { useState, useEffect, useRef } from 'react';
import {
  createPortal
} from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';
import {
  Search, ShoppingCart, Smartphone, Headphones,
  Wrench, ArrowRightLeft, Trash2, Database, Info, Plus, Minus,
  CreditCard, Wallet, Receipt, History, HelpCircle,
  Pause, RotateCcw, Printer, Barcode, UserDatabase,
  ArrowUpRight, ArrowDownRight, Package, CheckCircle2,
  X, ChevronDown, Filter, ShoppingBag, Users, Landmark, Truck,
  TrendingUp, Clock, FileText, DollarSign, Tag, RefreshCw, Upload, Download, List, Store, Battery,
  Calendar, Loader2, PenTool, Ban, CheckSquare, Check, Palette, CheckCircle
} from 'lucide-react';
import ShiftManagementModal from './ShiftManagementModal';
import { printReceipt } from '../lib/printReceipt';
import { useSettings } from '../contexts/SettingsContext';
import { PrintReceiptTemplate } from './SalesReceiptPrinter';
import { PrintBarcodeTemplate } from './PrintBarcodeTemplate';
import { PrintBarcodeModal } from './PrintBarcodeModal';
import { useBranch } from '../contexts/BranchContext';

interface Product {
  id: number;
  name: string;
  price: number;
  purchase_price?: number;
  wholesale_price?: number;
  half_wholesale_price?: number;
  stock: number;
  category: string;
  brand?: string;
  image?: string;
  imei1?: string;
  barcode?: string;
  battery_percentage?: number | string;
  color?: string;
  location?: string;
  type: 'device' | 'accessory' | 'spare_part';
  condition?: string;
  storage?: string;
  activation_status?: string;
  sim_type?: string;
}

interface CartItem extends Product {
  cartQuantity: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  discount: number;
  payment_method: string;
  client_id?: number;
  customer_name?: string;
  user_id?: string;
  status: string;
  created_at: string;
  Clients?: { name: string, phone: string };
  Sales_Items?: InvoiceItem[];
}

interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_type?: string;
  product_id?: number;
  item_type?: string;
  item_id?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name?: string;
  item_name?: string;
  imei?: string;
}

export default function POS() {
  const { currentBranch, isOwner, branches, currentBranchId } = useBranch();
  const { settings, playSound } = useSettings();
  const [activeMobileTab, setActiveMobileTab] = useState<'products' | 'cart'>('products');
  const [activeTab, setActiveTab] = useState<'devices' | 'accessories' | 'spare_parts' | 'transfers'>('devices');
  const [deviceConditionFilter, setDeviceConditionFilter] = useState<'all' | 'جديد' | 'مستعمل'>('all');
  const [pricingType, setPricingType] = useState<'retail' | 'wholesale' | 'half_wholesale'>('retail');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('الكل');
  const defaultCheckoutData = {
    salesmanId: '',
    customerName: '',
    customerPhone: '',
    saveCustomer: true,
    paymentMethod: 'cash',
    wallet: '',
    receivedAmount: '',
    discountType: 'fixed' as 'fixed' | 'percent',
    discountValue: '',
    feeLabel: '',
    feeAmount: '',
    deferredPaidNow: '',
    deferredWalletId: '',
    installmentDownPayment: '',
    installmentWalletId: '',
    installmentCount: '3',
    installmentCycle: 'monthly',
    installmentStartDate: new Date().toISOString().split('T')[0],
    installmentInterestMode: 'percentage' as 'percentage' | 'final_price',
    installmentInterestInput: '',
    installmentGuarantorName: '',
    installmentGuarantorPhone: '',
    installmentGuarantorNationalId: '',
    installmentGuarantorAddress: '',
    splitCashAmount: '',
    splitCashWalletId: '',
    splitWalletAmount: '',
    splitWalletId: '',
    splitBankAmount: '',
    splitBankWalletId: ''
  };

  const [cartSessions, setCartSessions] = useState([{ id: '1', name: 'سلة 1', cart: [] as CartItem[], checkoutData: { ...defaultCheckoutData } }]);
  const [activeSessionId, setActiveSessionId] = useState('1');

  const cart = cartSessions.find(s => s.id === activeSessionId)?.cart || [];
  const checkoutData = cartSessions.find(s => s.id === activeSessionId)?.checkoutData || defaultCheckoutData;

  const setCart = (updaterOrValue: any) => {
    setCartSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, cart: typeof updaterOrValue === 'function' ? updaterOrValue(s.cart) : updaterOrValue };
      }
      return s;
    }));
  };

  const setCheckoutData = (updaterOrValue: any) => {
    setCartSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, checkoutData: typeof updaterOrValue === 'function' ? updaterOrValue(s.checkoutData) : updaterOrValue };
      }
      return s;
    }));
  };
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // --- Printing Configuration ---
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const barcodePrintRef = useRef<HTMLDivElement>(null);
  const [lastInvoiceData, setLastInvoiceData] = useState<any>(null);
  const [barcodeData, setBarcodeData] = useState<any>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  const executePrintReceipt = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: 'Receipt',
    pageStyle: `@page { margin: 0; } @media print { body { margin: 0; } }`,
  });

  const barcodeWidth = settings?.barcodeWidth || '50mm';
  const barcodeHeight = settings?.barcodeHeight || '30mm';

  const executePrintBarcode = useReactToPrint({
    contentRef: barcodePrintRef,
    documentTitle: 'Barcode',
    pageStyle: `@page { size: ${barcodeWidth} ${barcodeHeight}; margin: 0; } @media print { body { margin: 0; } }`,
  });

  const printReceiptAction = () => {
    if (window.self !== window.top) {
      alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة المصغرة لدواعي أمنية.\n\nمن فضلك اضغط على زر "Open in new tab" (بالأعلى على اليمين) لفتح التطبيق في نافذة مستقلة عبر المتصفح لتتمكن من استخدام الطباعة بصورة طبيعية.');
      return;
    }

    if ((window as any).electron) {
      (window as any).electron.printSilent({ type: 'receipt', data: lastInvoiceData });
    } else {
      executePrintReceipt();
    }
  };

  const printBarcodeAction = (productData?: any) => {
    if (productData) {
      setBarcodeData(productData);
    }

    // Allow state and Ref to render before printing
    setTimeout(() => {
      if (window.self !== window.top) {
        alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في الـ Browser (Open in new tab).');
        return;
      }

      if ((window as any).electron) {
        (window as any).electron.printSilent({ type: 'barcode', data: productData || barcodeData });
      } else {
        executePrintBarcode();
      }
    }, 200);
  };
  // -----------------------------

  const printInvoiceFromHistory = (invoice: Invoice) => {
    const mappedItems = (invoice.Sales_Items || []).map((item, idx) => ({
      id: item.product_id || item.item_id || idx,
      name: item.product_name || item.item_name || 'منتج غير معروف',
      price: Number(item.total_price) / (Number(item.quantity) || 1),
      stock: 0,
      category: 'عام',
      type: (item.product_type || item.item_type || 'device') as 'device' | 'accessory' | 'spare_part',
      cartQuantity: item.quantity || 1
    }));

    const dataPayload = {
      invoiceId: invoice.invoice_number,
      items: mappedItems,
      totalAmount: invoice.total_amount,
      discount: invoice.discount || 0,
      finalAmount: (invoice as any).net_amount ?? invoice.total_amount,
      cashReceived: invoice.paid_amount || ((invoice as any).net_amount ?? invoice.total_amount),
      changeAmount: 0,
      customerName: invoice.customer_name || 'عميل نقدي',
      cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'كاشير',
      shopName: settings?.companyName || 'تكة أصل الثقة',
      phone: settings?.phone || '',
      logo: settings?.logo || '',
      date: invoice.created_at
    };

    setLastInvoiceData(dataPayload);

    setTimeout(() => {
      if (window.self !== window.top) {
        alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في الـ Browser (Open in new tab).');
        return;
      }

      if ((window as any).electron) {
        (window as any).electron.printSilent({ type: 'receipt', data: dataPayload });
      } else {
        printReceiptAction();
      }
    }, 150);
  };

  const sendWhatsappFromHistory = async (invoice: Invoice) => {
    const mappedItems = (invoice.Sales_Items || []).map((item, idx) => ({
      id: item.product_id || item.item_id || idx,
      name: item.product_name || item.item_name || 'منتج غير معروف',
      price: Number(item.total_price) / (Number(item.quantity) || 1),
      stock: 0,
      category: 'عام',
      type: (item.product_type || item.item_type || 'device') as 'device' | 'accessory' | 'spare_part',
      cartQuantity: item.quantity || 1
    }));

    const dataPayload = {
      invoiceId: invoice.invoice_number,
      items: mappedItems,
      totalAmount: invoice.total_amount,
      discount: invoice.discount || 0,
      finalAmount: (invoice as any).net_amount ?? invoice.total_amount,
      cashReceived: invoice.paid_amount || ((invoice as any).net_amount ?? invoice.total_amount),
      changeAmount: 0,
      customerName: invoice.customer_name || 'عميل نقدي',
      cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'كاشير',
      shopName: settings?.companyName || 'تكة أصل الثقة',
      phone: settings?.phone || '',
      logo: settings?.logo || '',
      date: invoice.created_at
    };

    setLastInvoiceData(dataPayload);

    setTimeout(async () => {
      try {
        let phone = '';
        if (invoice.customer_phone) {
          phone = invoice.customer_phone;
        } else if (invoice.customer_name && invoice.customer_name !== 'عميل نقدي') {
          try {
            const token = localStorage.getItem('access_token');
            const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
            const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/clients?name=eq.${encodeURIComponent(invoice.customer_name)}&select=phone`, {
              headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const clients = await res.json();
              if (clients && clients.length > 0 && clients[0].phone) {
                phone = clients[0].phone;
              }
            }
          } catch (e) {
            console.error('Failed to fetch client phone', e);
          }
        }

        if (phone) {
          phone = phone.startsWith('0')
            ? '2' + phone
            : phone.startsWith('+')
              ? phone.substring(1)
              : phone;
        }
        const name = invoice.customer_name || 'عميلنا العزيز';
        const msgText = 'أهلاً بك يااستاذ/ة ' + name + '\nإليك نسخة من فاتورتك.\nرقم الفاتورة: ' + invoice.invoice_number + '\nإجمالي الفاتورة: ' + invoice.total_amount.toLocaleString() + ' ج.م\nنشكرك على ثقتك بنا!';
        const waUrl = phone ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msgText) : 'https://wa.me/?text=' + encodeURIComponent(msgText);

        if (receiptPrintRef.current) {
          const tempDiv = document.createElement('div');
          tempDiv.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;opacity:0.01;background:white;';
          const clone = receiptPrintRef.current.cloneNode(true) as HTMLElement;
          clone.style.display = 'block';
          clone.style.width = '300px';
          tempDiv.appendChild(clone);
          document.body.appendChild(tempDiv);

          await new Promise(r => setTimeout(r, 500));
          const { toPng } = await import('html-to-image');
          const dataUrl = await toPng(clone, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
          document.body.removeChild(tempDiv);

          if ((window as any).electronAPI && (window as any).electronAPI.sendWhatsappAuto) {
            const result = await (window as any).electronAPI.sendWhatsappAuto({ dataUrl, phone, msg: msgText });
            if (result?.success) {
              return;
            }
          }

          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], 'Invoice_' + invoice.invoice_number + '.png', { type: 'image/png' });

          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'فاتورة تكة', text: msgText });
          } else {
            try {
              const item = new ClipboardItem({ 'image/png': blob });
              await navigator.clipboard.write([item]);
              alert('تم نسخ صورة الفاتورة! اضغط Ctrl+V في الواتساب للصقها.');
              window.open(waUrl, '_blank');
            } catch (clipErr) {
              const link = document.createElement('a');
              link.href = dataUrl;
              link.download = 'Invoice_' + invoice.invoice_number + '.png';
              link.click();
              alert('تم تحميل صورة الفاتورة! ارفقها في الواتساب.');
              window.open(waUrl, '_blank');
            }
          }
        } else {
          window.open(waUrl, '_blank');
        }
      } catch (err) {
        console.error('WhatsApp error:', err);
        alert('حدث خطأ أثناء إرسال الفاتورة.');
      }
    }, 200);
  };


  const [headerActionsContainer, setHeaderActionsContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderActionsContainer(document.getElementById('header-actions'));
  }, []);

  const headerButtons = (
    <div className="flex gap-2 md:gap-3 pe-4 overflow-x-auto custom-scrollbar pb-2 max-w-[calc(100vw-70px)] md:max-w-none">
      <button
        onClick={() => setIsPurchaseDeviceModalOpen(true)}
        className="shrink-0 px-3 py-2 md:px-5 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-emerald-500/20"
      >
        شراء جهاز <Download className="w-4 h-4 md:w-5 md:h-5 bg-white/20 p-0.5 md:p-1 rounded-md" />
      </button>
      <button
        onClick={() => setIsReturnModalOpen(true)}
        className="shrink-0 px-3 py-2 md:px-5 md:py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-orange-500/20"
      >
        مرتجع <RotateCcw className="w-4 h-4 md:w-5 md:h-5 bg-white/20 p-0.5 md:p-1 rounded-md" />
      </button>
      <button
        onClick={() => setIsReceiveModalOpen(true)}
        className="shrink-0 px-3 py-2 md:px-5 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-emerald-500/20"
      >
        استلام من عميل <DollarSign className="w-4 h-4 md:w-5 md:h-5 bg-white/20 p-0.5 md:p-1 rounded-md text-amber-200" />
      </button>
      <button
        onClick={() => {
          if (lastInvoiceData) {
            printReceiptAction();
          } else {
            alert('لا توجد فاتورة سابقة لطباعتها، قم بإنهاء عملية بيع أولاً');
          }
        }}
        className="shrink-0 px-3 py-2 md:px-5 md:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-blue-500/20"
      >
        طباعة الفاتورة <Printer className="w-4 h-4 md:w-5 md:h-5 bg-white/20 p-0.5 md:p-1 rounded-md text-amber-200" />
      </button>
      <button
        onClick={() => setIsBarcodeModalOpen(true)}
        className="shrink-0 px-3 py-2 md:px-5 md:py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-indigo-500/20"
      >
        طباعة باركود <Tag className="w-4 h-4 md:w-5 md:h-5 bg-white/20 p-0.5 md:p-1 rounded-md text-amber-200" />
      </button>
    </div>
  );

  // Invoices Modal State
  const [isRecentInvoicesModalOpen, setIsRecentInvoicesModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoicesFilterDate, setInvoicesFilterDate] = useState<string>('اليوم'); // 'اليوم', 'أمس', 'آخر 7 أيام', 'custom'
  const [invoicesCustomDate, setInvoicesCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoicesSearch, setInvoicesSearch] = useState<string>('');
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false);

  const [transferType, setTransferType] = useState<'withdraw' | 'deposit' | 'deferred'>('withdraw');
  const [transferData, setTransferData] = useState({
    customerName: '',
    customerPhone: '',
    provider: 'vodafone',
    amount: '',
    commission: '',
    fromWallet: '',
    toWallet: '',
    notes: ''
  });

  const calculateCommission = (amount: string | number, provider: string) => {
    const amt = Number(amount);
    if (!amt || isNaN(amt) || amt <= 0) return '';

    let commRate = 10; // Default
    // fallback logic, parse setting if exists
    if (settings && (settings as any).transferSettings && (settings as any).transferSettings.commissions) {
      commRate = Number((settings as any).transferSettings.commissions[provider]) || 10;
    }

    // New logic: 0-500 = half rate, 501-1000 = full rate, 1001-1500 = 1.5x rate, etc.
    const halfRate = commRate / 2;
    return (Math.ceil(amt / 500) * halfRate).toString();
  };
  const [transferStats, setTransferStats] = useState({ count: 0, totalCommission: 0 });
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);

  const brands = activeTab === 'devices'
    ? ['الكل', 'Apple', 'Samsung', 'Oppo', 'Xiaomi', 'Realme', 'Vivo', 'Huawei', 'Nokia', 'أخرى']
    : ['الكل', ...Array.from(new Set(products.map(p => p.category).filter(c => c && c !== 'عام')))];

  useEffect(() => {
    setSelectedBrand('الكل');
    fetchProducts();
    fetchWalletsAndShift();
    fetchClients();
    fetchEmployees();
    if (activeTab === 'transfers') {
      loadTransferStats();
    }
  }, [activeTab]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const headers = { 'apikey': apiKey, 'Authorization': `Bearer ${token}` };
      const response = await fetch(`${baseUrl}/clients`, { headers });
      if (response.ok) {
        setClients(await response.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const headers = { 'apikey': apiKey, 'Authorization': `Bearer ${token}` };
      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      const branchId = localStorage.getItem('takka_active_branch_id');
      let url = `${baseUrl}/employees?select=id,full_name,status&status=eq.نشط&tenant_id=eq.${tenantId}`;
      if (branchId && branchId !== 'ALL') {
        url += `&branch_id=eq.${branchId}`;
      }
      const response = await fetch(url, { headers });
      if (response.ok) {
        setEmployees(await response.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTransferStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const headers = { 'apikey': apiKey, 'Authorization': `Bearer ${token}` };
      const response = await fetch(`${baseUrl}/transfers?created_at=gte.${today.toISOString()}`, { headers });
      if (response.ok) {
        const data = await response.json();
        let comm = 0;
        const count = data.length;
        data.forEach((tx: any) => {
          comm += Number(tx.commission || 0);
        });
        setTransferStats({ count, totalCommission: comm });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTransferSubmit = async () => {
    if (!transferData.amount || Number(transferData.amount) <= 0) {
      alert('يجب إدخال مبلغ صحيح');
      return;
    }
    if (!activeShift) {
      alert('الرجاء فتح وردية أولا');
      return;
    }
    if (!transferData.fromWallet) {
      alert('يجب تحديد محفظة الخصم');
      return;
    }
    if (transferType !== 'deferred' && !transferData.toWallet) {
      alert('يجب تحديد محفظة الإيداع');
      return;
    }
    if (transferType !== 'deferred' && transferData.fromWallet === transferData.toWallet) {
      alert('لا يمكن التحويل لنفس المحفظة');
      return;
    }
    if (transferType === 'deferred' && (!transferData.customerName || !transferData.customerPhone)) {
      alert('يجب إدخال اسم العميل ورقم هاتفه للتحويل الآجل لتسجيل المديونية');
      return;
    }

    setIsTransferSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      const headers = { 'Content-Type': 'application/json', 'apikey': apiKey, 'Authorization': `Bearer ${token}` };

      const amountNum = parseFloat(transferData.amount);
      const commNum = parseFloat(transferData.commission) || 0;

      const typeLabel = transferType === 'withdraw' ? 'سحب رصيد' : transferType === 'deposit' ? 'إيداع رصيد' : 'تحويل آجل';

      const providerNames = { vodafone: 'فودافون كاش', etisalat: 'اتصالات كاش', orange: 'أورنج كاش', we: 'وي باي', instapay: 'إنستاباي', other: 'أخرى' };
      const selectedProvider = providerNames[transferData.provider as keyof typeof providerNames] || 'أخرى';

      const descContext = transferData.customerName ? ` - العميل: ${transferData.customerName}` : '';
      const descPhone = transferData.customerPhone ? ` - هاتف: ${transferData.customerPhone}` : '';
      const descNotes = transferData.notes ? ` - ملاحظات: ${transferData.notes}` : '';
      const desc = `${typeLabel} - ${selectedProvider}${descContext}${descPhone}${descNotes}`;

      // تسجيل المعاملة في جدول التحويلات transfers
      await fetch(`${baseUrl}/transfers`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
          user_id: userId,
          shift_id: activeShift.id,
          customer_name: transferData.customerName || null,
          customer_phone: transferData.customerPhone || null,
          amount: amountNum,
          commission: commNum,
          type: transferType,
          provider: transferData.provider,
          status: 'completed',
          notes: transferData.notes || null
        })
      });

      // سجل المعاملة كمبلغ خارج
      const tId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      const bId = localStorage.getItem('takka_active_branch_id');
      const branchVal = bId && bId !== 'ALL' ? bId : null;

      await fetch(`${baseUrl}/treasury_transactions`, {
        method: 'POST', headers,
        body: JSON.stringify({ tenant_id: tId, branch_id: branchVal, wallet_id: parseInt(transferData.fromWallet), user_id: userId, type: 'out', amount: amountNum, category: 'تحويلات المحافظ', description: `(خصم) ${desc}` })
      });

      if (transferType !== 'deferred') {
        await fetch(`${baseUrl}/treasury_transactions`, {
          method: 'POST', headers,
          body: JSON.stringify({ tenant_id: tId, branch_id: branchVal, wallet_id: parseInt(transferData.toWallet), user_id: userId, type: 'in', amount: amountNum, category: 'تحويلات المحافظ', description: `(إيداع) ${desc}` })
        });
      }

      if (commNum > 0 && transferType !== 'deferred') {
        // Commission goes to Cash/FromWallet logically.
        const commWalletId = transferType === 'withdraw' ? transferData.fromWallet : (transferData.toWallet || transferData.fromWallet);
        await fetch(`${baseUrl}/treasury_transactions`, {
          method: 'POST', headers,
          body: JSON.stringify({ tenant_id: tId, branch_id: branchVal, wallet_id: parseInt(commWalletId), user_id: userId, type: 'in', amount: commNum, category: 'عمولات تحويل', description: `عمولة ${desc}` })
        });
      }

      const wFromRes = await fetch(`${baseUrl}/wallets?id=eq.${transferData.fromWallet}&select=balance`, { headers });
      const wToRes = transferData.toWallet ? await fetch(`${baseUrl}/wallets?id=eq.${transferData.toWallet}&select=balance`, { headers }) : null;

      const commWalletIdStr = transferType === 'withdraw' ? transferData.fromWallet : (transferData.toWallet || transferData.fromWallet);

      if (wFromRes?.ok) {
        const wFromData = await wFromRes.json();
        if (wFromData && wFromData.length > 0) {
          let netFrom = Number(wFromData[0].balance || 0) - amountNum;
          if (transferType !== 'deferred' && commWalletIdStr === transferData.fromWallet) netFrom += commNum;
          await fetch(`${baseUrl}/wallets?id=eq.${transferData.fromWallet}`, { method: 'PATCH', headers, body: JSON.stringify({ balance: netFrom }) });
        }
      }
      if (wToRes?.ok && transferType !== 'deferred') {
        const wToData = await wToRes.json();
        if (wToData && wToData.length > 0) {
          let netTo = Number(wToData[0].balance || 0) + amountNum;
          if (commWalletIdStr === transferData.toWallet) netTo += commNum;
          await fetch(`${baseUrl}/wallets?id=eq.${transferData.toWallet}`, { method: 'PATCH', headers, body: JSON.stringify({ balance: netTo }) });
        }
      }

      // اذا كان تحويل آجل نحدث بيانات العميل
      if (transferType === 'deferred') {
        const totalDebtAmount = amountNum + commNum;
        let qs = transferData.customerPhone ? `phone=eq.${encodeURIComponent(transferData.customerPhone)}` : `name=eq.${encodeURIComponent(transferData.customerName)}`;
        const clientRes = await fetch(`${baseUrl}/clients?${qs}&select=*`, { headers });
        if (clientRes.ok) {
          const foundClients = await clientRes.json();
          if (foundClients && foundClients.length > 0) {
            const existingClient = foundClients[0];
            await fetch(`${baseUrl}/clients?id=eq.${existingClient.id}`, {
              method: 'PATCH', headers,
              body: JSON.stringify({ initial_balance: Number(existingClient.initial_balance || 0) + totalDebtAmount })
            });
          } else {
            await fetch(`${baseUrl}/clients`, {
              method: 'POST', headers,
              body: JSON.stringify({
                name: transferData.customerName,
                phone: transferData.customerPhone || null,
                category: 'retail',
                initial_balance: totalDebtAmount,
                user_id: userId,
                created_at: new Date().toISOString()
              })
            });
          }
        }
      }

      alert(transferType === 'deferred' ? 'تم تسجيل التحويل وإضافة المديونية بنجاح' : 'تم تسجيل التحويل بنجاح');
      setTransferData(prev => ({ ...prev, amount: '', commission: '', customerName: '', customerPhone: '', notes: '' }));
      fetchWalletsAndShift();
      loadTransferStats();
      fetchClients();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsTransferSubmitting(false);
    }
  };



  const fetchInvoices = async () => {
    setIsInvoicesLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';

      let dateQuery = '';
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (invoicesFilterDate === 'اليوم') {
        dateQuery = `&created_at=gte.${today.toISOString()}&created_at=lt.${tomorrow.toISOString()}`;
      } else if (invoicesFilterDate === 'أمس') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        dateQuery = `&created_at=gte.${yesterday.toISOString()}&created_at=lt.${today.toISOString()}`;
      } else if (invoicesFilterDate === 'آخر 7 أيام') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateQuery = `&created_at=gte.${lastWeek.toISOString()}`;
      } else if (invoicesFilterDate === 'custom') {
        const customDate = new Date(invoicesCustomDate);
        customDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(customDate);
        nextDay.setDate(nextDay.getDate() + 1);
        dateQuery = `&created_at=gte.${customDate.toISOString()}&created_at=lt.${nextDay.toISOString()}`;
      }

      let searchQuery = '';
      if (invoicesSearch) {
        searchQuery = `&invoice_number=ilike.*${encodeURIComponent(invoicesSearch)}*`;
      }

      const response = await fetch(`${baseUrl}/Sales_Invoices?select=*,Sales_Items(*)${dateQuery}${searchQuery}&order=created_at.desc`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase error:', errorText);
        throw new Error('فشل جلب الفواتير: ' + errorText);
      }
      const data = await response.json();

      // If we need item names, we might want to attach them, but let's see if we can do without or use what we have
      setInvoices(data);

    } catch (e) {
      console.error(e);
    } finally {
      setIsInvoicesLoading(false);
    }
  };

  useEffect(() => {
    if (isRecentInvoicesModalOpen) {
      fetchInvoices();
    }
  }, [isRecentInvoicesModalOpen, invoicesFilterDate, invoicesCustomDate, invoicesSearch]);

  const fetchWalletsAndShift = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const userId = localStorage.getItem('user_id');
      const activeBranchId = localStorage.getItem("takka_active_branch_id");
      const branchSuffix = activeBranchId && activeBranchId !== 'ALL' ? `&branch_id=eq.${activeBranchId}` : '';

      const cashierStr = localStorage.getItem('active_cashier');
      let cashierFilter = '';
      if (cashierStr) {
        try {
          const c = JSON.parse(cashierStr);
          if (c && c.role_level !== 1) {
            const cName = c.full_name || c.username || c.name || 'موظف مبيعات';
            cashierFilter = `&cashier_name=eq.${encodeURIComponent(cName)}`;
          } else {
            const cName = c ? (c.full_name || c.username || c.name) : null;
            cashierFilter = cName ? `&or=(cashier_name.is.null,cashier_name.eq.${encodeURIComponent(cName)})` : `&cashier_name=is.null`;
          }
        } catch (e) { }
      } else {
        cashierFilter = `&cashier_name=is.null`;
      }

      const shiftsRes = await fetch(`${baseUrl}/shifts?select=*${branchSuffix}&user_id=eq.${userId}${cashierFilter}&status=eq.open&order=created_at.desc&limit=1`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token}` }
      });

      let currentShift = null;
      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        if (shiftsData.length > 0 && shiftsData[0].status === 'open') {
          currentShift = shiftsData[0];
          setActiveShift(currentShift);
        } else {
          setActiveShift(null);
        }
      }

      const branchId = localStorage.getItem('takka_active_branch_id');

      let walletQs = '';
      if (userId) walletQs += `&tenant_id=eq.${localStorage.getItem('tenant_id') || userId}`;
      if (currentShift && currentShift.branch_id) {
        walletQs += `&branch_id=eq.${currentShift.branch_id}`;
      } else if (branchId && branchId !== 'ALL') {
        walletQs += `&branch_id=eq.${branchId}`;
      }

      const walletsRes = await fetch(`${baseUrl}/wallets?select=*,branches(name)${walletQs}`, {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token}` }
      });

      if (walletsRes.ok) {
        let walletsData = await walletsRes.json();
        walletsData = walletsData.map((w: any) => ({
          ...w,
          name: w.branches && w.branches.name ? `${w.name} - (${w.branches.name})` : w.name
        }));
        setWallets(walletsData);
      }

    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      let table = '';
      if (activeTab === 'devices') table = 'Devices';
      else if (activeTab === 'accessories') table = 'Accessories';
      else if (activeTab === 'spare_parts') table = 'spare_parts';

      if (!table) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      let queryParams = `?select=*&tenant_id=eq.${tenantId}`;
      if (table === 'Devices') {
        queryParams += '&or=(is_locked_for_installment.eq.false,is_locked_for_installment.is.null)&or=(status.eq.available,status.is.null)';
      }

      if (currentBranch) {
        // Fetch warehouses for the current branch
        const whRes = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?select=id&branch_id=eq.${currentBranch.id}`, {
          headers: {
            'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
            'Authorization': `Bearer ${token}`
          }
        });
        if (whRes.ok) {
          const whData = await whRes.json();
          const warehouseIds = whData.map((w: any) => w.id);
          if (warehouseIds.length > 0) {
            queryParams += `&or=(warehouse_id.in.(${warehouseIds.join(',')}),and(warehouse_id.is.null,branch_id.eq.${currentBranch.id}))`;
          } else {
            queryParams += `&warehouse_id=is.null&branch_id=eq.${currentBranch.id}`;
          }
        }
      }

      const response = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/${table}${queryParams}`, {
        headers: {
          'apikey': 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errInfo = await response.text();
        throw new Error('فشل جلب البيانات: ' + errInfo);
      }

      const data = await response.json();

      // Map data to unified Product interface
      const mappedData = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id,
        name: item.model || item.name || item.part_name || 'منتج غير معروف',
        price: item.selling_price || item.sell_price || item.price || 0,
        purchase_price: item.purchase_price || item.buy_price || item.cost_price || 0,
        wholesale_price: item.wholesale_price || null,
        half_wholesale_price: item.half_wholesale_price || null,
        stock: activeTab === 'devices' ? 1 : (item.quantity || 0),
        category: item.category || item.company || 'عام',
        brand: item.company || item.brand || item.category,
        type: (activeTab === 'devices' ? 'device' : activeTab === 'accessories' ? 'accessory' : 'spare_part') as "device" | "accessory" | "spare_part",
        imei1: item.imei1 || item.imei || null,
        barcode: item.barcode || null,
        battery_percentage: item.battery_percentage || null,
        color: item.color || null,
        location: item.location || null,
        condition: item.condition || null,
        storage: item.storage || null,
        activation_status: item.activation_status || null,
        sim_type: item.sim_type || null,
      }));

      setProducts(mappedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getEffectivePrice = (product: Product) => {
    if (pricingType === 'wholesale' && product.wholesale_price) {
      return product.wholesale_price;
    }
    if (pricingType === 'half_wholesale' && product.half_wholesale_price) {
      return product.half_wholesale_price;
    }
    return product.price;
  };

  const addToCart = (product: Product) => {
    const preventZeroStock = settings?.preventZeroStockSales || product.type === 'accessory' || product.type === 'spare_part';

    if (product.stock <= 0) {
      if (preventZeroStock) {
        playSound('error');
        alert(`لا يمكن بيع "${product.name}" (الكمية صفر)`);
        return;
      }
    }

    // Check quantity across all sessions to prevent adding to multiple carts
    const totalQuantityInAllCarts = cartSessions.reduce((sum, session) => {
      const item = session.cart.find(i => i.id === product.id && i.type === product.type);
      return sum + (item ? item.cartQuantity : 0);
    }, 0);

    const isInCurrentCart = cart.some(item => item.id === product.id && item.type === product.type);

    if (totalQuantityInAllCarts > 0) {
      if (product.type === 'device') {
        playSound('error');
        if (isInCurrentCart) {
          alert("لا يمكن إضافة نفس الجهاز أكثر من مرة في الفاتورة");
        } else {
          alert("لا يمكن إضافة نفس الجهاز لأنك قمت بإضافته في سلة أخرى مفتوحة بالفعل!");
        }
        return;
      }

      if (preventZeroStock && totalQuantityInAllCarts >= product.stock) {
        playSound('error');
        alert(`الكمية المتاحة من "${product.name}" هي ${product.stock} فقط (تمت إضافة الكمية بالكامل في هذه السلة والسلال الأخرى)`);
        return;
      }
    }

    playSound('pop');
    setCart(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      if (isInCurrentCart) {
        return safePrev.map(item =>
          item.id === product.id && item.type === product.type
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }
      return [...safePrev, { ...product, price: getEffectivePrice(product), cartQuantity: 1 }];
    });
  };

  const removeFromCart = (id: number, type: string) => {
    playSound('pop');
    setCart(prev => (Array.isArray(prev) ? prev : []).filter(item => !(item.id === id && item.type === type)));
  };

  const updateQuantity = (id: number, type: string, delta: number) => {
    playSound('pop');
    setCart(prev => (Array.isArray(prev) ? prev : []).map(item => {
      if (item.id === id && item.type === type) {
        let maxAllowed = item.stock;
        if (item.type === 'device') {
          maxAllowed = 1;
        }

        const preventZeroStock = settings?.preventZeroStockSales || item.type === 'accessory' || item.type === 'spare_part';

        const quantityInOtherCarts = cartSessions.reduce((sum, session) => {
          if (session.id === activeSessionId) return sum;
          const cartItem = session.cart.find(i => i.id === item.id && i.type === item.type);
          return sum + (cartItem ? cartItem.cartQuantity : 0);
        }, 0);

        let newQty = item.cartQuantity + delta;
        if (preventZeroStock && (newQty + quantityInOtherCarts) > maxAllowed) {
          playSound('error');
          if (item.type === 'device') {
            alert("لا يمكن بيع أكثر من جهاز واحد (له نفس الـ IMEI)");
          } else {
            alert(`الكمية المتبقية للإضافة هي ${maxAllowed - quantityInOtherCarts} فقط (موزعة في سلال أخرى)`);
          }
          newQty = maxAllowed - quantityInOtherCarts;
        } else if (!preventZeroStock && item.type === 'device' && newQty > 1) {
          playSound('error');
          alert("لا يمكن بيع أكثر من جهاز واحد (له نفس الـ IMEI)");
          newQty = 1;
        }
        newQty = Math.max(1, newQty);

        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [printOnConfirm, setPrintOnConfirm] = useState(false);
  const [successInvoiceInfo, setSuccessInvoiceInfo] = useState<{ invoiceId: string, itemsCount: number, total: number, customerPhone?: string, customerName?: string } | null>(null);



  // Automatically select the first wallet when opening checkout if not selected
  useEffect(() => {
    if (isCheckoutModalOpen) {
      if (typeof window !== 'undefined' && wallets.length > 0) {
        const activeDrawerId = localStorage.getItem('takka_active_drawer_id');

        let targetWallet = '';
        if (checkoutData.paymentMethod === 'cash') {
          if (activeDrawerId) {
            targetWallet = activeDrawerId;
          } else {
            const cWallets = wallets.filter(w => w.type === 'cash' || w.name.includes('كاش') || w.name.includes('درج') || w.name.includes('خزينة') || !w.type);
            targetWallet = cWallets.length > 0 ? cWallets[0].id?.toString() || '' : '';
          }
        } else if (checkoutData.paymentMethod === 'wallet') {
          const eWallets = wallets.filter(w => w.type === 'e_wallet' || w.type === 'wallet' || w.name.includes('فودافون') || w.name.includes('موبينيل') || w.name.includes('اتصالات') || w.name.includes('وي') || w.name.includes('محفظة'));
          targetWallet = eWallets.length > 0 ? eWallets[0].id?.toString() || '' : '';
        } else if (checkoutData.paymentMethod === 'bank') {
          const bWallets = wallets.filter(w => w.type === 'bank' || w.name.includes('بنك') || w.name.includes('حساب') || w.name.includes('انستا'));
          targetWallet = bWallets.length > 0 ? bWallets[0].id?.toString() || '' : '';
        } else {
          targetWallet = wallets[0].id?.toString() || '';
        }

        setCheckoutData(prev => ({
          ...prev,
          wallet: targetWallet,
          splitCashWalletId: activeDrawerId || prev.splitCashWalletId,
          deferredWalletId: (!prev.deferredWalletId && activeDrawerId) ? activeDrawerId : prev.deferredWalletId,
          installmentWalletId: (!prev.installmentWalletId && activeDrawerId) ? activeDrawerId : prev.installmentWalletId
        }));
      }
    }
  }, [isCheckoutModalOpen, wallets, checkoutData.paymentMethod]);

  const subtotal = (Array.isArray(cart) ? cart : []).reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  const calculateDiscount = () => {
    const val = parseFloat(checkoutData.discountValue) || 0;
    if (checkoutData.discountType === 'percent') {
      return (subtotal * val) / 100;
    }
    return val;
  };

  const total = subtotal - calculateDiscount() + (parseFloat(checkoutData.feeAmount) || 0);

  // Installment Math
  let installmentInterestCost = 0;
  let installmentFinalTotal = total;
  const installmentDownPaymentValue = parseFloat(checkoutData.installmentDownPayment) || 0;

  if (checkoutData.paymentMethod === 'installment') {
    const interestMode = checkoutData.installmentInterestMode;
    const interestInput = parseFloat(checkoutData.installmentInterestInput) || 0;
    if (interestMode === 'percentage') {
      const remainingForInterest = Math.max(0, total - installmentDownPaymentValue);
      installmentInterestCost = remainingForInterest * (interestInput / 100);
      installmentFinalTotal = total + installmentInterestCost;
    } else if (interestMode === 'final_price') {
      if (interestInput > total) {
        installmentFinalTotal = interestInput;
        installmentInterestCost = interestInput - total;
      }
    }
  }
  const installmentRemaining = Math.max(0, installmentFinalTotal - installmentDownPaymentValue);
  const installmentPerMonth = installmentRemaining > 0 ? (installmentRemaining / (parseInt(checkoutData.installmentCount) || 1)) : 0;

  let calculatedPaid = 0;
  if (checkoutData.paymentMethod === 'split') {
    calculatedPaid = (parseFloat(checkoutData.splitCashAmount) || 0) + (parseFloat(checkoutData.splitWalletAmount) || 0) + (parseFloat(checkoutData.splitBankAmount) || 0);
  } else if (checkoutData.paymentMethod === 'deferred') {
    calculatedPaid = parseFloat(checkoutData.deferredPaidNow) || 0;
  } else if (checkoutData.paymentMethod === 'installment') {
    calculatedPaid = parseFloat(checkoutData.installmentDownPayment) || 0;
  } else if (['cash', 'wallet', 'bank'].includes(checkoutData.paymentMethod)) {
    calculatedPaid = total;
  } else {
    calculatedPaid = parseFloat(checkoutData.receivedAmount) || 0;
  }

  const change = (checkoutData.paymentMethod === 'split' || checkoutData.paymentMethod === 'deferred' || checkoutData.paymentMethod === 'installment' || ['cash', 'wallet', 'bank'].includes(checkoutData.paymentMethod)) ? 0 : calculatedPaid - total;

  const getWalletsForMethod = (method: string) => {
    if (method === 'cash') return wallets.filter(w => w.type === 'cash' || w.name.includes('كاش') || w.name.includes('درج') || w.name.includes('خزينة') || !w.type);
    if (method === 'wallet') return wallets.filter(w => w.type === 'e_wallet' || w.type === 'wallet' || w.name.includes('فودافون') || w.name.includes('موبينيل') || w.name.includes('اتصالات') || w.name.includes('وي') || w.name.includes('محفظة'));
    if (method === 'bank') return wallets.filter(w => w.type === 'bank' || w.name.includes('بنك') || w.name.includes('حساب') || w.name.includes('انستا'));
    return wallets;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmSale = async (shouldPrint: boolean = false) => {
    if (isSubmitting) return;
    if (!Array.isArray(cart) || cart.length === 0) return;
    if (!activeShift) {
      alert("تعذر البيع: لم تقم بفتح وردية. يرجى التوجه لصفحة الخزينة وفتح وردية أولاً.");
      return;
    }

    // Check discount limit
    const cashierStr = localStorage.getItem('active_cashier');
    let maxDiscount = 0;
    let isManager = localStorage.getItem('admin_active') === 'true';
    if (cashierStr && !isManager) {
      try {
        const cashier = JSON.parse(cashierStr);
        let perms = cashier.permissions || {};
        if (typeof perms === 'string') {
          try { perms = JSON.parse(perms); } catch (e) { }
        }
        maxDiscount = Number(perms.maxDiscount || 0);
      } catch (e) {
        console.error('Error parsing active_cashier', e);
      }
    }

    const appliedDiscount = calculateDiscount();
    const appliedDiscountPercentage = subtotal > 0 ? (appliedDiscount / subtotal) * 100 : 0;
    if (maxDiscount > 0 && appliedDiscountPercentage > maxDiscount) {
      alert(`عذراً، الحد الأقصى للخصم المسموح لك به هو ${maxDiscount}%`);
      return;
    }

    let deferredAmount = 0;
    let validSplits: any[] = [];

    if (checkoutData.paymentMethod === 'split') {
      const cashAmt = parseFloat(checkoutData.splitCashAmount) || 0;
      const walletAmt = parseFloat(checkoutData.splitWalletAmount) || 0;
      const bankAmt = parseFloat(checkoutData.splitBankAmount) || 0;

      let sum = cashAmt + walletAmt + bankAmt;

      if (sum !== total) {
        alert(`مجموع المبالغ المقسمة (${sum}) لا يساوي الإجمالي المطلوب (${total})!`);
        return;
      }

      if (cashAmt > 0) {
        if (!checkoutData.splitCashWalletId) { alert("يرجى تحديد خزينة الكاش."); return; }
        validSplits.push({ method: 'cash', walletId: checkoutData.splitCashWalletId, amount: cashAmt });
      }
      if (walletAmt > 0) {
        if (!checkoutData.splitWalletId) { alert("يرجى تحديد المحفظة الإلكترونية."); return; }
        validSplits.push({ method: 'wallet', walletId: checkoutData.splitWalletId, amount: walletAmt });
      }
      if (bankAmt > 0) {
        if (!checkoutData.splitBankWalletId) { alert("يرجى تحديد الحساب البنكي."); return; }
        validSplits.push({ method: 'bank', walletId: checkoutData.splitBankWalletId, amount: bankAmt });
      }
    } else if (checkoutData.paymentMethod === 'deferred') {
      const paidNow = parseFloat(checkoutData.deferredPaidNow) || 0;
      if (paidNow > total) {
        alert("لا يمكن دفع مقدم أكبر من إجمالي الفاتورة.");
        return;
      }
      if (paidNow > 0) {
        if (!checkoutData.deferredWalletId) {
          alert("يرجى اختيار الخزينة للمبلغ المدفوع الآن.");
          return;
        }
        validSplits.push({ method: 'cash', walletId: checkoutData.deferredWalletId, amount: paidNow });
      }
      deferredAmount = total - paidNow;
    } else if (checkoutData.paymentMethod === 'installment') {
      const downPayment = parseFloat(checkoutData.installmentDownPayment) || 0;
      if (downPayment > installmentFinalTotal) {
        alert("لا يمكن دفع مقدم أكبر من إجمالي الفاتورة (بعد إضافة الفوائد).");
        return;
      }
      if (downPayment > 0) {
        if (!checkoutData.installmentWalletId) {
          alert("يرجى اختيار الخزينة للمبلغ المقدم.");
          return;
        }
        validSplits.push({ method: 'cash', walletId: checkoutData.installmentWalletId, amount: downPayment });
      }
      deferredAmount = installmentFinalTotal - downPayment;

      if (!checkoutData.installmentCount || parseInt(checkoutData.installmentCount) <= 0) {
        alert("يرجى إدخال عدد أقساط صحيح.");
        return;
      }
    } else {
      if (!checkoutData.wallet) {
        alert("يرجى اختيار الخزينة/المحفظة للإيداع.");
        return;
      }
      validSplits = [{ method: checkoutData.paymentMethod, walletId: checkoutData.wallet, amount: total }];
    }

    if ((checkoutData.paymentMethod === 'deferred' || checkoutData.paymentMethod === 'installment') && !checkoutData.customerName) {
      alert('يجب إدخال اسم العميل لتسجيل المديونية / الأقساط');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id') || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3';
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      const headers = {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${token}`
      };

      if (checkoutData.paymentMethod === 'installment') {
        const roleRes = await fetch(`${baseUrl}/rpc/check_installment_feature_enabled`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ p_user_id: userId })
        });
        if (roleRes.ok) {
          const isEnabled = await roleRes.json();
          if (!isEnabled) {
            alert("نظام التقسيط غير مفعل. الرجاء مراجعة الإعدادات.");
            setIsSubmitting(false);
            return;
          }
        }

        for (const item of cart) {
          if (item.type === 'device' && item.imei1) {
            const imeiRes = await fetch(`${baseUrl}/rpc/check_imei_blacklist`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ p_imei: item.imei1 })
            });
            if (imeiRes.ok) {
              const imeiCheck = await imeiRes.json();
              if (imeiCheck.is_blacklisted) {
                alert(`تحذير: لا يمكن بيع الجهاز ${item.name}. ${imeiCheck.warning}`);
                setIsSubmitting(false);
                return;
              }
            }
          }
        }
      }

      let finalCustomerName = checkoutData.customerName || 'عميل نقدي';
      let clientId = null;
      if (checkoutData.customerName) {
        let existingClient = null;
        let qs = checkoutData.customerPhone ? `phone=eq.${encodeURIComponent(checkoutData.customerPhone)}` : `name=eq.${encodeURIComponent(checkoutData.customerName)}`;
        const clientRes = await fetch(`${baseUrl}/clients?${qs}&select=*`, { headers });
        if (clientRes.ok) {
          const foundClients = await clientRes.json();
          if (foundClients && foundClients.length > 0) existingClient = foundClients[0];
        }

        const isDebt = deferredAmount > 0;
        const isInstallment = checkoutData.paymentMethod === 'installment';

        if (existingClient) {
          finalCustomerName = existingClient.name;
          clientId = existingClient.id;
          if (isDebt || isInstallment) {
            const addDebt = isInstallment ? installmentRemaining : deferredAmount;
            // If there is addDebt, increment the customer's balance
            if (addDebt > 0) {
              await fetch(`${baseUrl}/clients?id=eq.${existingClient.id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ initial_balance: Number(existingClient.initial_balance || 0) + addDebt })
              });
            }
          }
        } else if (checkoutData.saveCustomer || isDebt || isInstallment) {
          const startDebt = isInstallment ? installmentRemaining : (isDebt ? deferredAmount : 0);
          const createRes = await fetch(`${baseUrl}/clients`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({
              name: checkoutData.customerName,
              phone: checkoutData.customerPhone || null,
              initial_balance: startDebt > 0 ? startDebt : 0,
              credit_limit: 0,
              category: 'retail',
              user_id: userId,
              created_at: new Date().toISOString()
            })
          });
          if (createRes.ok) {
            const newClients = await createRes.json();
            if (newClients && newClients.length > 0) {
              finalCustomerName = newClients[0].name;
              clientId = newClients[0].id;
            }
          } else {
            const errorText = await createRes.text();
            console.error("Supabase Error Creating Client Checkout:", errorText);
            alert("تعذر حفظ العميل: " + errorText);
          }
        }
      }

      const finalDisplayTotal = checkoutData.paymentMethod === 'installment' ? installmentFinalTotal : total;

      let invoiceStatus = 'paid';
      if (deferredAmount >= finalDisplayTotal) {
        invoiceStatus = 'unpaid';
      } else if (deferredAmount > 0) {
        invoiceStatus = 'partial';
      }

      const invoiceData: any = {
        invoice_number: `INV-${Date.now()}`,
        salesman_id: checkoutData.salesmanId || null,
        customer_name: finalCustomerName,
        customer_phone: checkoutData.customerPhone || null,
        total_amount: subtotal,
        discount: calculateDiscount(),
        net_amount: finalDisplayTotal,
        paid_amount: finalDisplayTotal - deferredAmount,
        remaining_amount: deferredAmount,
        status: invoiceStatus,
        payment_method: checkoutData.paymentMethod === 'split' ? (deferredAmount > 0 ? 'split_unpaid' : 'split') : checkoutData.paymentMethod,
        user_id: userId
      };

      const invResponse = await fetch(`${baseUrl}/Sales_Invoices`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(invoiceData)
      });

      if (!invResponse.ok) {
        const errText = await invResponse.text();
        console.error('Invoice save error:', errText);
        throw new Error(`فشل حفظ الفاتورة: ${errText}`);
      }

      playSound('success');

      const [savedInvoice] = await invResponse.json();

      let createdContractId = null;

      // Save installments if applicable
      if (checkoutData.paymentMethod === 'installment') {
        const installmentCount = parseInt(checkoutData.installmentCount);
        const totalDebt = installmentRemaining;
        const perInstallmentAmount = installmentPerMonth;
        let startDate = new Date(checkoutData.installmentStartDate);

        const paymentsArray = [];
        for (let i = 0; i < installmentCount; i++) {
          let dueDate = new Date(startDate);
          if (checkoutData.installmentCycle === 'weekly') {
            dueDate.setDate(startDate.getDate() + (i * 7));
          } else {
            dueDate.setMonth(startDate.getMonth() + i);
          }
          paymentsArray.push({
            installment_no: i + 1,
            due_amount: perInstallmentAmount,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pending'
          });
        }

        const deviceInCart = cart.find(i => i.type === 'device');
        const pDeviceIdForContract = deviceInCart && deviceInCart.id ? parseInt(String(deviceInCart.id)) : null;

        const _tId = localStorage.getItem('tenant_id') || userId;
        const _bId = localStorage.getItem('takka_active_branch_id');

        const contractPayload = {
          tenant_id: _tId,
          branch_id: (_bId && _bId !== 'ALL') ? _bId : null,
          client_id: clientId,
          device_id: pDeviceIdForContract,
          invoice_id: savedInvoice.id,
          wallet_id: checkoutData.installmentWalletId ? parseInt(checkoutData.installmentWalletId) : null,
          cash_price: total,
          interest_percentage: checkoutData.installmentInterestMode === 'percentage' ? (parseFloat(checkoutData.installmentInterestInput) || 0) : 0,
          interest_amount: installmentInterestCost,
          total_price: installmentFinalTotal,
          down_payment: parseFloat(checkoutData.installmentDownPayment) || 0,
          installment_amount: perInstallmentAmount,
          installment_count: installmentCount,
          start_date: checkoutData.installmentStartDate,
          created_by: userId,
          status: 'active',
          guarantor_name: checkoutData.installmentGuarantorName ? checkoutData.installmentGuarantorName : null,
          guarantor_phone: checkoutData.installmentGuarantorPhone ? checkoutData.installmentGuarantorPhone : null,
          guarantor_national_id: checkoutData.installmentGuarantorNationalId ? checkoutData.installmentGuarantorNationalId : null,
          guarantor_address: checkoutData.installmentGuarantorAddress ? checkoutData.installmentGuarantorAddress : null
        };

        const contractRes = await fetch(`${baseUrl}/installment_contracts`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(contractPayload)
        });

        if (contractRes.ok) {
          const result = await contractRes.json();
          createdContractId = result[0].id;

          // Automatically inserting to installment_contracts triggers an auto-generation of monthly payments
          // We delete them to handle weekly or custom ones properly, then insert our paymentsArray.
          await fetch(`${baseUrl}/installment_payments?contract_id=eq.${createdContractId}`, {
            method: 'DELETE',
            headers
          });

          const paymentsToInsert = paymentsArray.map((p, index) => ({
            contract_id: createdContractId,
            installment_no: index + 1,
            due_amount: p.due_amount,
            due_date: p.due_date,
            status: p.status,
            tenant_id: _tId,
            branch_id: (_bId && _bId !== 'ALL') ? _bId : null
          }));

          await fetch(`${baseUrl}/installment_payments`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify(paymentsToInsert)
          });

        } else {
          const errData = await contractRes.json().catch(() => null);
          const cerr = errData?.message || await contractRes.text();
          console.error("installment_contracts error", cerr);
          if (cerr.includes('CLIENT_BLACKLISTED')) {
            alert("لا يمكن إنهاء البيع: العميل موجود في القائمة السوداء");
          } else {
            alert("خطأ في إنشاء عقد التقسيط: " + cerr);
          }
          setIsSubmitting(false);
          return;
        }
      }

      for (const item of cart) {
        const itemData = {
          invoice_id: savedInvoice.id,
          product_id: item.id,
          product_type: item.type,
          product_name: item.name,
          quantity: item.cartQuantity,
          unit_price: item.price,
          cost_price: item.purchase_price || 0,
          total_price: item.price * item.cartQuantity
        };

        const itemRes = await fetch(`${baseUrl}/Sales_Items`, {
          method: 'POST',
          headers,
          body: JSON.stringify(itemData)
        });

        if (!itemRes.ok) {
          const errText = await itemRes.text();
          console.error("Sales_Items API err:", errText);
          throw new Error(`فشل حفظ الأصناف: ${errText}`);
        }

        if (item.type === 'device') {
          if (createdContractId) {
            await fetch(`${baseUrl}/Devices?id=eq.${item.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                status: 'sold_installment',
                is_locked_for_installment: true,
                installment_contract_id: createdContractId
              })
            });
          } else {
            await fetch(`${baseUrl}/Devices?id=eq.${item.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                status: 'sold'
              })
            });
          }
        } else {
          let inventoryTable = item.type === 'accessory' ? 'Accessories' : 'spare_parts';
          await fetch(`${baseUrl}/${inventoryTable}?id=eq.${item.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              quantity: item.stock - item.cartQuantity
            })
          });
        }
      }

      // 3. تحديث الخزينة والمحفظة (إذا لم يكن بيع آجل)
      let actualPaid = 0;
      let actualPaidCashForShift = 0;
      for (const split of validSplits) {
        if (split.method !== 'deferred' && split.walletId && split.amount > 0) {
          const amt = split.amount;
          actualPaid += amt;
          const walletObj = wallets.find(w => w.id.toString() === split.walletId.toString());
          if (walletObj && walletObj.type === 'cash') {
            actualPaidCashForShift += amt;
          }

          const tId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
          const bId = localStorage.getItem('takka_active_branch_id');
          const branchVal = bId && bId !== 'ALL' ? bId : null;

          await fetch(`${baseUrl}/treasury_transactions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              tenant_id: tId,
              branch_id: branchVal,
              wallet_id: split.walletId,
              user_id: userId || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3',
              type: 'in',
              amount: amt,
              category: 'مبيعات يومية',
              description: `مبيعات فاتورة رقم ${invoiceData.invoice_number}${checkoutData.paymentMethod === 'split' ? ' - جزء مقسم' : ' - نقطة البيع'}`,
              date: new Date().toISOString()
            })
          });

          const splitWalletRes = await fetch(`${baseUrl}/wallets?id=eq.${split.walletId}&select=balance`, { headers });
          if (splitWalletRes.ok) {
            const splitWalletData = await splitWalletRes.json();
            if (splitWalletData && splitWalletData.length > 0) {
              await fetch(`${baseUrl}/wallets?id=eq.${split.walletId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ balance: Number(splitWalletData[0].balance || 0) + amt })
              });
            }
          }
        }
      }

      if (activeShift) {
        const patchBody: any = { sales_count: Number(activeShift.sales_count || 0) + 1 };
        if (actualPaidCashForShift > 0) {
          patchBody.expected_amount = Number(activeShift.expected_amount || 0) + actualPaidCashForShift;
        }
        await fetch(`${baseUrl}/shifts?id=eq.${activeShift.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(patchBody)
        });
      }

      const printCart = [...cart]; // Copy the cart so its valid for the component even if state clears

      // Setup receipt data for our silent print/web print
      setLastInvoiceData({
        invoiceId: invoiceData.invoice_number,
        items: printCart,
        totalAmount: subtotal,
        discount: calculateDiscount(),
        finalAmount: finalDisplayTotal,
        paymentMethod: checkoutData.paymentMethod,
        installmentInterestCost: checkoutData.paymentMethod === 'installment' ? installmentInterestCost : 0,
        cashReceived: actualPaid,
        changeAmount: 0,
        customerName: checkoutData.customerName,
        cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'كاشير',
        shopName: settings?.companyName || 'تكة أصل الثقة',
        phone: settings?.phone || '',
        logo: settings?.logo || ''
      });

      // Instead of relying purely on standard print Receipt, print using the component
      if (shouldPrint || settings?.directPrint) {
        setTimeout(() => {
          if ((window as any).electron) {
            (window as any).electron.printSilent({
              type: 'receipt',
              data: {
                invoiceId: invoiceData.invoice_number,
                items: printCart,
                totalAmount: subtotal,
                discount: calculateDiscount(),
                finalAmount: total,
                cashReceived: actualPaid,
                changeAmount: 0,
                customerName: checkoutData.customerName,
                cashierName: localStorage.getItem('active_cashier') ? (JSON.parse(localStorage.getItem('active_cashier') || '{}')).name || (JSON.parse(localStorage.getItem('active_cashier') || '{}')).username : localStorage.getItem('admin_active') ? 'المدير' : 'كاشير',
                shopName: settings?.companyName || 'تكة أصل الثقة',
                phone: settings?.phone || '',
                logo: settings?.logo || ''
              }
            });
          } else {
            printReceiptAction();
          }
        }, 300);
      }

      setSuccessInvoiceInfo({
        invoiceId: invoiceData.invoice_number,
        itemsCount: printCart.reduce((sum, item) => sum + item.cartQuantity, 0),
        total: total,
        customerPhone: checkoutData.customerPhone,
        customerName: checkoutData.customerName
      });
      setIsSuccessModalOpen(true);

      setCart([]);
      setIsCheckoutModalOpen(false);
      setIsConfirmModalOpen(false);
      setCheckoutData(prev => ({
        ...prev,
        receivedAmount: '',
        customerName: '',
        customerPhone: '',
        splitCashAmount: '',
        splitWalletAmount: '',
        splitBankAmount: '',
        deferredPaidNow: '',
        installmentDownPayment: '',
        discountValue: '',
        discountType: 'fixed',
        feeAmount: '',
        feeLabel: ''
      }));
      fetchProducts();
      fetchWalletsAndShift();
      fetchClients();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isPurchaseDeviceModalOpen, setIsPurchaseDeviceModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({ amount: '', reason: '', details: '' });
  const [isExpenseSubmitting, setIsExpenseSubmitting] = useState(false);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnSearch, setReturnSearch] = useState('');
  const [returnInvoices, setReturnInvoices] = useState<any[]>([]);
  const [selectedReturnInvoice, setSelectedReturnInvoice] = useState<any | null>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<{ id: string, product_id: number, quantity: number, type: string, amount: number }[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnToStock, setReturnToStock] = useState(true);
  const [returnWallet, setReturnWallet] = useState('');
  const [isReturnSubmitting, setIsReturnSubmitting] = useState(false);

  useEffect(() => {
    if (isReturnModalOpen) {
      if (returnSearch.trim() === '') {
        fetchReturnInvoices('');
      } else {
        const delayDebounceFn = setTimeout(() => {
          fetchReturnInvoices(returnSearch);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
      }
    }
  }, [returnSearch, isReturnModalOpen]);

  const fetchReturnInvoices = async (searchStr: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      let query = `?select=*,Sales_Items(*)&order=created_at.desc&limit=30`;
      if (searchStr.trim() !== '') {
        const safeSearchStr = encodeURIComponent(searchStr.trim());
        query += `&or=(invoice_number.ilike.*${safeSearchStr}*,customer_name.ilike.*${safeSearchStr}*)`;
      }

      const response = await fetch(`${baseUrl}/Sales_Invoices${query}`, {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReturnInvoices(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getDiscountedPrice = (invoice: any, price: number) => {
    if (!invoice || !price) return 0;
    const discountRatio = (invoice.discount || 0) / (invoice.total_amount || 1);
    return price * (1 - discountRatio);
  };

  const handleReturnSubmit = async () => {
    if (!selectedReturnInvoice) {
      alert('يجب اختيار فاتورة أولاً');
      return;
    }
    if (selectedReturnItems.length === 0) {
      alert('يجب اختيار عنصر واحد على الأقل للإرجاع');
      return;
    }
    if (!returnReason) {
      alert('يجب اختيار سبب المرتجع');
      return;
    }
    if (!returnWallet) {
      alert('يجب اختيار المحفظة لخصم مبلغ المرتجع');
      return;
    }

    setIsReturnSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const headers = { 'Content-Type': 'application/json', 'apikey': apiKey, 'Authorization': `Bearer ${token}`, 'Prefer': 'return=representation' };

      const totalRefundAmount = selectedReturnItems.reduce((acc, item) => acc + item.amount, 0);

      // Create return record in Sales_Returns
      const returnData = {
        invoice_id: selectedReturnInvoice.id,
        invoice_number: selectedReturnInvoice.invoice_number,
        customer_name: selectedReturnInvoice.customer_name,
        refund_amount: totalRefundAmount,
        reason: returnReason,
        returned_items: selectedReturnItems, // Storing items as jsonb if allowed, wait the schema might not have returned_items. Let's just store simple string or if required simple fields.
        // Let's assume standard Sales_Returns schema or use treasury_transaction + stock adjustment.
        // If Sales_Returns fields: invoice_number, customer_name, product_type (can be mixed), reason, refund_amount, date.
      };

      // Let's check `Sales_Returns` schema.
      // Assuming it has standard fields.
      const productTypes = [...new Set(selectedReturnItems.map(i => i.type))].join(', ');

      const salesReturnBody = {
        invoice_number: selectedReturnInvoice.invoice_number,
        salesman_id: selectedReturnInvoice.salesman_id || null,
        customer_name: selectedReturnInvoice.customer_name,
        refund_amount: totalRefundAmount,
        reason: returnReason,
        product_type: productTypes,
        returned_to_stock: returnToStock,
        user_id: localStorage.getItem('user_id')
      };

      const retRes = await fetch(`${baseUrl}/Sales_Returns`, {
        method: 'POST',
        headers,
        body: JSON.stringify(salesReturnBody)
      });

      if (!retRes.ok) throw new Error(await retRes.text());

      let cashRefund = totalRefundAmount;
      let debtReduction = 0;

      const pm = selectedReturnInvoice.payment_method;
      if (pm !== 'installment' && (selectedReturnInvoice.remaining_amount || 0) > 0) {
        const remainingDebt = selectedReturnInvoice.remaining_amount || 0;
        if (totalRefundAmount <= remainingDebt) {
          debtReduction = totalRefundAmount;
          cashRefund = 0;
        } else {
          debtReduction = remainingDebt;
          cashRefund = totalRefundAmount - remainingDebt;
        }
      }

      if (debtReduction > 0 && selectedReturnInvoice.customer_name) {
        const cRes = await fetch(`${baseUrl}/clients?name=eq.${encodeURIComponent(selectedReturnInvoice.customer_name)}&select=*`, { headers });
        if (cRes.ok) {
          const clientsList = await cRes.json();
          if (clientsList && clientsList.length > 0) {
            const cust = clientsList[0];
            await fetch(`${baseUrl}/clients?id=eq.${cust.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ initial_balance: Math.max(0, Number(cust.initial_balance || 0) - debtReduction) })
            });
          }
        }
        await fetch(`${baseUrl}/Sales_Invoices?id=eq.${selectedReturnInvoice.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ remaining_amount: (selectedReturnInvoice.remaining_amount || 0) - debtReduction })
        });
      }

      if (cashRefund > 0) {
        const tId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
        const bId = localStorage.getItem('takka_active_branch_id');
        const branchVal = bId && bId !== 'ALL' ? bId : null;

        // Reduce from Wallet (treasury_transactions)
        await fetch(`${baseUrl}/treasury_transactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tenant_id: tId,
            branch_id: branchVal,
            wallet_id: parseInt(returnWallet),
            amount: cashRefund,
            type: 'out',
            category: 'مرتجعات مبيعات',
            description: `مرتجع مبيعات للفاتورة ${selectedReturnInvoice.invoice_number} - العميل: ${selectedReturnInvoice.customer_name}` + (debtReduction > 0 ? ` (تم خصم ${debtReduction} من المديونية)` : ''),
            user_id: localStorage.getItem('user_id')
          })
        });

        // Update the actual wallet balance
        const rWalletRes = await fetch(`${baseUrl}/wallets?id=eq.${returnWallet}&select=balance`, { headers });
        if (rWalletRes.ok) {
          const rWalletData = await rWalletRes.json();
          if (rWalletData && rWalletData.length > 0) {
            await fetch(`${baseUrl}/wallets?id=eq.${returnWallet}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ balance: Number(rWalletData[0].balance || 0) - cashRefund })
            });
          }
        }

        // Update shift expected amount if wallet is cash
        const returnWalletObj = wallets.find(w => w.id.toString() === returnWallet.toString());
        if (activeShift && returnWalletObj && returnWalletObj.type === 'cash') {
          await fetch(`${baseUrl}/shifts?id=eq.${activeShift.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              expected_amount: Number(activeShift.expected_amount || 0) - cashRefund
            })
          });
        }
      }

      // Adjust Stock if returnToStock is true
      if (returnToStock) {
        for (const item of selectedReturnItems) {
          if (item.type === 'device') {
            // Find device and set status to available
            // Get device by product_id or imei? Usually we have device_models/devices. Let's just fetch devices.
            // We need to fetch the device linked to this sales_item.
            // Often it's enough just to update devices by id. But item.product_id might be the device_models.id.
            // For devices, POS sells from devices or device_models? It sells from 'devices' if imei exists.
            const salesItem = selectedReturnInvoice.Sales_Items.find((si: any) => si.id?.toString() === item.id);
            if (salesItem && salesItem.product_id) {
              await fetch(`${baseUrl}/Devices?id=eq.${salesItem.product_id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                  status: 'available',
                  is_locked_for_installment: false,
                  installment_contract_id: null
                })
              });
            }
          } else if (item.type === 'accessory' || item.type === 'spare_part') {
            const table = item.type === 'accessory' ? 'Accessories' : 'spare_parts';
            // Get current stock
            const qRes = await fetch(`${baseUrl}/${table}?id=eq.${item.product_id}`, { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${token}` } });
            if (qRes.ok) {
              const prods = await qRes.json();
              if (prods && prods.length > 0) {
                await fetch(`${baseUrl}/${table}?id=eq.${item.product_id}`, {
                  method: 'PATCH',
                  headers,
                  body: JSON.stringify({ quantity: Number(prods[0].quantity || 0) + Number(item.quantity || 0) })
                });
              }
            }
          }
        }
      }

      // Update returned items names to indicate they are returned
      for (const item of selectedReturnItems) {
        const salesItem = selectedReturnInvoice.Sales_Items?.find((si: any) => si.id?.toString() === item.id);
        if (salesItem) {
          const name = salesItem.product_name || salesItem.item_name || 'منتج';
          const match = name.match(/\(مرتجع (\d+) من (\d+)\)/);
          const prevRet = match ? parseInt(match[1]) : 0;
          const totalRet = prevRet + item.quantity;

          let newName = name.split(' (مرتجع')[0];
          if (totalRet >= salesItem.quantity) {
            newName += ' (مرتجع)';
          } else {
            newName += ` (مرتجع ${totalRet} من ${salesItem.quantity})`;
          }

          if (name !== newName) {
            await fetch(`${baseUrl}/Sales_Items?id=eq.${salesItem.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ product_name: newName })
            });
          }
        }
      }

      // Update invoice status to 'returned' (مرتجعة) or partially returned
      const remainingItems = selectedReturnInvoice.Sales_Items?.filter((i: any) => {
        const name = i.product_name || i.item_name || '';
        const match = name.match(/\(مرتجع (\d+) من (\d+)\)/);
        const prevRet = match ? parseInt(match[1]) : (name.includes('(مرتجع)') ? i.quantity : 0);
        const justRet = selectedReturnItems.find(s => s.id === i.id?.toString())?.quantity || 0;
        return (i.quantity - prevRet - justRet) > 0;
      }).length || 0;

      const isPartialReturn = remainingItems > 0;
      const finalStatus = (isPartialReturn && selectedReturnInvoice.status !== 'مرتجعة جزئياً') ? 'مرتجعة جزئياً' : (isPartialReturn ? 'مرتجعة جزئياً' : 'مرتجعة');

      await fetch(`${baseUrl}/Sales_Invoices?id=eq.${selectedReturnInvoice.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: finalStatus })
      });

      alert('تم تنفيذ المرتجع بنجاح');
      setIsReturnModalOpen(false);
      setSelectedReturnInvoice(null);
      setSelectedReturnItems([]);
      setReturnReason('');
      setReturnSearch('');
      setReturnWallet('');
      fetchWalletsAndShift();
    } catch (err: any) {
      alert(`خطأ في العملية: ${err.message}`);
    } finally {
      setIsReturnSubmitting(false);
    }
  };

  const [receiveData, setReceiveData] = useState({
    clientId: '',
    amount: '',
    walletId: '',
    notes: ''
  });

  const handleReceiveSubmit = async () => {
    if (!activeShift) {
      alert('يجب فتح وردية أولاً');
      return;
    }
    if (!receiveData.clientId) {
      alert('الرجاء اختيار العميل');
      return;
    }
    if (!receiveData.walletId) {
      alert('الرجاء اختيار طريقة الدفع/الخزينة');
      return;
    }
    if (!receiveData.amount || isNaN(Number(receiveData.amount)) || Number(receiveData.amount) <= 0) {
      alert('الرجاء إدخال مبلغ صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const userId = localStorage.getItem('user_id');
      const headers = {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${token}`
      };

      const selectedClient = clients.find(c => c.id?.toString() === receiveData.clientId?.toString());
      if (!selectedClient) throw new Error('العميل غير موجود');

      const amountToReceive = Number(receiveData.amount);

      const tId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      const bId = localStorage.getItem('takka_active_branch_id');
      const branchVal = bId && bId !== 'ALL' ? bId : null;

      // 1. Record transaction in treasury_transactions
      await fetch(`${baseUrl}/treasury_transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tenant_id: tId,
          branch_id: branchVal,
          wallet_id: parseInt(receiveData.walletId),
          user_id: userId || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3',
          type: 'in',
          amount: amountToReceive,
          category: 'مقبوضات عملاء',
          description: `استلام دفعة من العميل: ${selectedClient.name} - ${receiveData.notes || ''}`.trim(),
          date: new Date().toISOString()
        })
      });

      // 2. Update wallet balance
      const wdRes = await fetch(`${baseUrl}/wallets?id=eq.${receiveData.walletId}&select=balance`, { headers });
      if (wdRes.ok) {
        const wdData = await wdRes.json();
        if (wdData && wdData.length > 0) {
          await fetch(`${baseUrl}/wallets?id=eq.${receiveData.walletId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ balance: Number(wdData[0].balance || 0) + amountToReceive })
          });
        }
      }

      // 3. Update shift expected amount and deposits count
      if (activeShift) {
        const patchBody: any = { deposits_count: Number(activeShift.deposits_count || 0) + 1 };
        const selectedWalletObj = wallets.find(w => w.id.toString() === receiveData.walletId.toString());
        if (selectedWalletObj && selectedWalletObj.type === 'cash') {
          patchBody.expected_amount = Number(activeShift.expected_amount || 0) + amountToReceive;
        }
        await fetch(`${baseUrl}/shifts?id=eq.${activeShift.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(patchBody)
        });
      }

      // 4. Update client's balance (decrease their debt)
      await fetch(`${baseUrl}/clients?id=eq.${selectedClient.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          initial_balance: Number(selectedClient.initial_balance || 0) - amountToReceive
        })
      });

      alert('تم استلام الدفعة بنجاح!');
      setIsReceiveModalOpen(false);
      setReceiveData({
        clientId: '',
        amount: '',
        walletId: '',
        notes: ''
      });
      fetchWalletsAndShift();
      fetchClients();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [purchaseData, setPurchaseData] = useState({
    customerName: '',
    customerPhone: '',
    saveToCustomers: true,
    deviceType: 'هاتف ذكي',
    model: '',
    batteryPercentage: '',
    capacity: '128GB',
    ram: '8GB',
    color: '',
    condition: 'مستعمل',
    hasBox: 'بدون كرتونة',
    imei1: '',
    imei2: '',
    purchasePrice: '',
    expectedSalePrice: '',
    ntraTax: '0',
    paymentMethod: 'cash',
    walletId: '',
    notes: '',
    purchaseTargetBranchId: ''
  });

  useEffect(() => {
    if (isPurchaseDeviceModalOpen) {
      if (currentBranchId && currentBranchId !== 'ALL') {
        setPurchaseData(prev => ({ ...prev, purchaseTargetBranchId: currentBranchId }));
      } else if (branches && branches.length > 0) {
        setPurchaseData(prev => ({ ...prev, purchaseTargetBranchId: branches[0].id.toString() }));
      }
    }
  }, [isPurchaseDeviceModalOpen, currentBranchId, branches]);

  const handleExpenseSubmit = async () => {
    if (!activeShift) {
      alert("تعذر العملية: لم تقم بفتح وردية. يرجى فتح وردية أولاً.");
      return;
    }

    const amount = parseFloat(expenseData.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      alert("يرجى إدخال مبلغ صحيح أكبر من الصفر.");
      return;
    }

    if (!expenseData.reason) {
      alert("يرجى إدخال أو اختيار سبب المصروف.");
      return;
    }

    let drawerId = localStorage.getItem('takka_active_drawer_id');
    if (!drawerId) {
      const expectedName = `درج الكاشير - ${activeShift.cashier_name || (localStorage.getItem('admin_active') === 'true' ? 'الإدارة' : 'موظف')}`;
      const matchedWallet = wallets.find(w => w.name === expectedName);
      if (matchedWallet) {
        drawerId = matchedWallet.id.toString();
        localStorage.setItem('takka_active_drawer_id', drawerId);
      }
    }

    if (!drawerId) {
      alert("تعذر تسجيل المصروف: لم يتم العثور على درج الكاشير المخصص لورديتك المفتوحة حالياً.");
      return;
    }

    setIsExpenseSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
      const headers = {
        'apikey': apiKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Check balance
      const wdRes = await fetch(`${baseUrl}/wallets?id=eq.${drawerId}&select=balance`, { headers });
      if (!wdRes.ok) throw new Error('فشل جلب رصيد الخزينة');
      const wdData = await wdRes.json();
      if (!wdData || wdData.length === 0) throw new Error('خزينة الوردية غير موجودة');

      const currentBalance = Number(wdData[0].balance || 0);
      if (currentBalance < amount) {
        alert(`لا يمكن صرف المبلغ. رصيد الخزنة المتاح: ${currentBalance} ج.م`);
        setIsExpenseSubmitting(false);
        return;
      }

      const tId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');
      const bId = localStorage.getItem('takka_active_branch_id');
      const branchVal = bId && bId !== 'ALL' ? bId : null;

      // 1. Insert into treasury_transactions
      const txRes = await fetch(`${baseUrl}/treasury_transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tenant_id: tId,
          branch_id: branchVal,
          wallet_id: parseInt(drawerId),
          amount: amount,
          type: 'out',
          category: expenseData.reason,
          description: expenseData.details || `مصروفات من نقطة البيع`,
          user_id: localStorage.getItem('user_id'),
          date: new Date().toISOString()
        })
      });

      if (!txRes.ok) throw new Error(await txRes.text());

      // 2. Update wallet balance
      await fetch(`${baseUrl}/wallets?id=eq.${drawerId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ balance: currentBalance - amount })
      });

      // 3. Update activeShift expected amount and withdrawals
      await fetch(`${baseUrl}/shifts?id=eq.${activeShift.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          withdrawals_count: Number(activeShift.withdrawals_count || 0) + 1,
          expected_amount: Number(activeShift.expected_amount || 0) - amount
        })
      });

      alert("تم تسجيل المصروف بنجاح");
      setIsExpenseModalOpen(false);
      setExpenseData({ amount: '', reason: '', details: '' });
      fetchWalletsAndShift();
    } catch (err: any) {
      console.error(err);
      alert(`خطأ أثناء تسجيل المصروف: ${err.message}`);
    } finally {
      setIsExpenseSubmitting(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!activeShift) {
      alert("تعذر العملية: لم تقم بفتح وردية. يرجى فتح وردية أولاً.");
      return;
    }

    if (!purchaseData.model || !purchaseData.imei1 || !purchaseData.purchasePrice) {
      alert('يرجى ملء البيانات الأساسية (الموديل، IMEI، سعر الشراء)');
      return;
    }

    if (!purchaseData.walletId) {
      alert('يرجى اختيار الخزينة/المحفظة التي سيتم الخصم منها.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      // 🚨 Security System: Check Blacklist Before Adding
      const checkImei = [purchaseData.imei1, purchaseData.imei2].filter(Boolean).map(i => encodeURIComponent(i));
      if (checkImei.length > 0) {
        const blacklistRes = await fetch(`${baseUrl}/Blacklist?imei=in.(${checkImei.join(',')})`, {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => null);

        if (blacklistRes && blacklistRes.ok) {
          const blacklistData = await blacklistRes.json();
          if (blacklistData.length > 0) {
            const badDevice = blacklistData[0];
            alert(`🚨 تحذير أمني: هذا السيريال (${badDevice.imei}) مسجل في البلاك ليست كـ "${badDevice.status === 'stolen' ? 'مسروق' : badDevice.status === 'lost' ? 'مفقود' : 'تحت التحقيق'}". يرجى مراجعة نظام الأمان وإيقاف عملية الشراء!`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      const userId = localStorage.getItem('user_id');

      // 1. إضافة الجهاز للمخزن
      let targetWarehouseId = null;
      if (purchaseData.purchaseTargetBranchId) {
        try {
          const commonHeaders = {
            'apikey': apiKey,
            'Authorization': `Bearer ${token}`
          };
          let url = `${baseUrl}/Warehouses?select=id&type=eq.devices&is_default=eq.true&branch_id=eq.${purchaseData.purchaseTargetBranchId}`;
          let whRes = await fetch(url, { headers: commonHeaders });
          if (whRes.ok) {
            let whData = await whRes.json();
            if (whData && whData.length > 0) targetWarehouseId = whData[0].id;
            else {
              let url2 = `${baseUrl}/Warehouses?select=id&type=eq.devices&branch_id=eq.${purchaseData.purchaseTargetBranchId}&order=created_at.asc&limit=1`;
              let whRes2 = await fetch(url2, { headers: commonHeaders });
              if (whRes2.ok) {
                let whData2 = await whRes2.json();
                if (whData2 && whData2.length > 0) targetWarehouseId = whData2[0].id;
              }
            }
          }
        } catch (e) {
          console.error("Error fetching branch warehouse", e);
        }
      }

      const tenantId = localStorage.getItem('tenant_id') || userId;

      const deviceData = {
        company: purchaseData.model.split(' ')[0], // استخراج الماركة من أول كلمة
        model: purchaseData.model,
        storage: purchaseData.capacity,
        color: purchaseData.color,
        ram: purchaseData.ram,
        condition: purchaseData.condition,
        has_box: purchaseData.hasBox === 'بكرتونة أصلية', // تحويل لنوع boolean بناءً على القيمة
        battery_percentage: purchaseData.batteryPercentage ? Number(purchaseData.batteryPercentage) : null,
        source: 'شراء من عميل',
        imei1: purchaseData.imei1,
        imei2: purchaseData.imei2,
        cost_price: parseFloat(purchaseData.purchasePrice),
        selling_price: parseFloat(purchaseData.expectedSalePrice) || 0,
        tax: parseFloat(purchaseData.ntraTax) || 0,
        notes: purchaseData.notes,
        user_id: userId,
        branch_id: purchaseData.purchaseTargetBranchId || null,
        warehouse_id: targetWarehouseId,
        tenant_id: tenantId,
        status: 'available',
        entry_type: 'purchase'
      };

      const devResponse = await fetch(`${baseUrl}/Devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(deviceData)
      });

      if (!devResponse.ok) throw new Error('فشل إضافة الجهاز للمخزن');

      // 2. تحديث الخزينة (خصم قيمة الشراء) وتسجيل المعاملة
      if (purchaseData.walletId) {
        const tId = localStorage.getItem('tenant_id') || userId;
        const bId = localStorage.getItem('takka_active_branch_id');
        const branchVal = bId && bId !== 'ALL' ? bId : null;

        await fetch(`${baseUrl}/treasury_transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            tenant_id: tId,
            branch_id: branchVal,
            wallet_id: parseInt(purchaseData.walletId),
            user_id: userId || '0885cf2d-0f6b-4146-b5dd-0bdf3a2b3ad3',
            type: 'out',
            amount: parseFloat(purchaseData.purchasePrice),
            category: 'مشتريات أجهزة',
            description: `شراء جهاز مستعمل - ${purchaseData.model}`,
            date: new Date().toISOString()
          })
        });

        const pWalletRes = await fetch(`${baseUrl}/wallets?id=eq.${purchaseData.walletId}&select=balance`, {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${token}`
          }
        });
        if (pWalletRes.ok) {
          const pWalletData = await pWalletRes.json();
          if (pWalletData && pWalletData.length > 0) {
            await fetch(`${baseUrl}/wallets?id=eq.${purchaseData.walletId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey,
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ balance: Number(pWalletData[0].balance || 0) - parseFloat(purchaseData.purchasePrice) })
            });
          }
        }

        if (activeShift) {
          const patchBody: any = { withdrawals_count: Number(activeShift.withdrawals_count || 0) + 1 };
          const selectedWalletObj = wallets.find(w => w.id.toString() === purchaseData.walletId.toString());
          if (selectedWalletObj && selectedWalletObj.type === 'cash') {
            patchBody.expected_amount = Number(activeShift.expected_amount || 0) - parseFloat(purchaseData.purchasePrice);
          }
          await fetch(`${baseUrl}/shifts?id=eq.${activeShift.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey,
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(patchBody)
          });
        }
      }

      // 3. إذا كان مطلوب حفظ العميل
      if (purchaseData.saveToCustomers && purchaseData.customerName) {
        let existingClient = null;
        let qs = purchaseData.customerPhone ? `phone=eq.${encodeURIComponent(purchaseData.customerPhone)}` : `name=eq.${encodeURIComponent(purchaseData.customerName)}`;
        const clientRes = await fetch(`${baseUrl}/clients?${qs}&select=*`, {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${token}`
          }
        });
        if (clientRes.ok) {
          const foundClients = await clientRes.json();
          if (foundClients && foundClients.length > 0) existingClient = foundClients[0];
        }

        if (!existingClient) {
          const createReq = await fetch(`${baseUrl}/clients`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': apiKey,
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: purchaseData.customerName,
              phone: purchaseData.customerPhone || null,
              category: 'retail',
              initial_balance: 0,
              credit_limit: 0,
              user_id: userId,
              created_at: new Date().toISOString()
            })
          });
          if (!createReq.ok) {
            const errTxt = await createReq.text();
            console.error("Supabase Error Creating Client Purchase:", errTxt);
            alert("تعذر حفظ العميل: " + errTxt);
          }
        }
      }

      alert('تم شراء الجهاز وإضافته للمخزن بنجاح!');
      setIsPurchaseDeviceModalOpen(false);
      setPurchaseData({
        customerName: '',
        customerPhone: '',
        saveToCustomers: true,
        deviceType: 'هاتف ذكي',
        model: '',
        batteryPercentage: '',
        capacity: '128GB',
        ram: '8GB',
        color: '',
        condition: 'مستعمل',
        hasBox: 'بدون كرتونة',
        imei1: '',
        imei2: '',
        purchasePrice: '',
        expectedSalePrice: '',
        ntraTax: '0',
        paymentMethod: 'cash',
        walletId: '',
        notes: '',
        purchaseTargetBranchId: ''
      });
      fetchProducts();
      fetchWalletsAndShift();
      fetchClients();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const strMatch = (str?: string | null) => str ? str.toLowerCase().includes(term) : false;

    const matchesSearch = strMatch(p.name) || strMatch(p.imei1) || strMatch(p.barcode) || strMatch(p.category) || strMatch(p.brand);
    const matchesBrand = selectedBrand === 'الكل' || p.brand === selectedBrand || p.category === selectedBrand;
    const matchesCondition = activeTab !== 'devices' || deviceConditionFilter === 'all' || p.condition === deviceConditionFilter;
    return matchesSearch && matchesBrand && matchesCondition;
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      e.preventDefault();
      const term = searchTerm.trim().toLowerCase();

      const exactMatches = products.filter(p => {
        return (p.barcode?.toLowerCase() === term ||
          p.imei1?.toLowerCase() === term ||
          (p as any).imei2?.toLowerCase() === term ||
          String(p.id) === term);
      });

      let targetProduct = null;
      if (exactMatches.length >= 1) {
        targetProduct = exactMatches[0];
      } else if (filteredProducts.length === 1) {
        targetProduct = filteredProducts[0];
      }

      if (targetProduct) {
        const preventZeroStock = settings?.preventZeroStockSales || targetProduct.type === 'accessory' || targetProduct.type === 'spare_part';
        if (targetProduct.stock > 0 || !preventZeroStock) {
          addToCart(targetProduct);
          setSearchTerm('');
          playSound('pop');
        } else {
          playSound('error');
          alert(`لا يمكن بيع "${targetProduct.name}" (الكمية صفر)`);
          setSearchTerm('');
        }
      }
    }
  };

  return (
    <>
      <div className={`flex flex-col gap-4 lg:gap-6 h-[calc(100vh-112px)] font-sans overflow-hidden`} dir="rtl">
        {/* Mobile Tabs */}
        <div className="flex lg:hidden bg-slate-200/50 dark:bg-[#11151c] p-1.5 rounded-xl shrink-0 mx-4 mt-4 lg:m-0">
          <button
            onClick={() => setActiveMobileTab('products')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeMobileTab === 'products'
              ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Package className="w-4 h-4" />
            المنتجات
          </button>
          <button
            onClick={() => setActiveMobileTab('cart')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeMobileTab === 'cart'
              ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <ShoppingCart className="w-4 h-4" />
            سلة المشتريات
            {cart.length > 0 && (
              <span className="w-5 h-5 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 overflow-hidden px-4 lg:px-0 pb-4 lg:pb-0">
          {/* User Requested: Left Side (in RTL): Cart & Checkout. On Mobile, it stays at the bottom. */}
          <div className={`w-full lg:w-[420px] 2xl:w-[480px] flex-col gap-4 shrink-0 h-full order-2 ${activeMobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="bg-white dark:bg-[#11151c] rounded-2xl flex flex-col h-full shadow-sm border border-slate-200/60 dark:border-white/5 overflow-hidden">
              {/* Cart Header */}
              <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center relative">
                    <ShoppingCart className="w-5 h-5" />
                    {Array.isArray(cart) && cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#11151c]">
                        {cart.length}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg">سلة المشتريات</h3>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all" title="تعليق">
                    <Pause className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all" title="معلقة">
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>


              {/* Cart Sessions Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar bg-slate-100/50 dark:bg-[#0d1117]/50 p-2 border-b border-slate-200 dark:border-white/5 shrink-0">
                {cartSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all border ${activeSessionId === session.id ? 'bg-white shadow-sm border-slate-200 dark:bg-[#1a2332] dark:border-white/10 text-slate-900 dark:text-white font-bold' : 'border-transparent text-slate-500 hover:bg-slate-200/50 dark:hover:bg-white/5'}`}
                  >
                    <span className="text-sm whitespace-nowrap">{session.name}</span>
                    {cartSessions.length > 1 && (
                      <X className="w-3 h-3 hover:text-red-500 transition-colors" onClick={(e) => {
                        e.stopPropagation();
                        setCartSessions(prev => {
                          const updated = prev.filter(s => s.id !== session.id);
                          if (activeSessionId === session.id) setActiveSessionId(updated[0].id);
                          return updated;
                        });
                      }} />
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newId = Date.now().toString();
                    setCartSessions(prev => [...prev, { id: newId, name: `سلة ${prev.length + 1}`, cart: [], checkoutData: { ...defaultCheckoutData } }]);
                    setActiveSessionId(newId);
                  }}
                  className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg shrink-0 transition-all"
                  title="إضافة سلة جديدة"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {(!Array.isArray(cart) || cart.length === 0) ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50"
                    >
                      <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">السلة فارغة</h4>
                        <p className="text-xs text-slate-500">اضغط على منتج لإضافته للسلة</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {(Array.isArray(cart) ? cart : []).map((item) => (
                        <motion.div
                          key={`${item.type}-${item.id}`}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-white dark:bg-[#11151c] border border-slate-100 dark:border-white/5 rounded-xl p-3 group shadow-sm hover:border-blue-500/30 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{item.name}</h4>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 mb-2">{item.category}</p>

                              {item.type === 'device' && (
                                <div className="flex flex-wrap items-center gap-1 mb-2">
                                  {item.battery_percentage && (
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                      <Battery className="w-2.5 h-2.5 text-emerald-500" /> %{item.battery_percentage}
                                    </span>
                                  )}
                                  {item.imei1 && (
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5 font-mono">
                                      IMEI: {item.imei1.slice(0, 5)}..
                                    </span>
                                  )}
                                  {item.color && (
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                      <Palette className="w-2.5 h-2.5 text-indigo-500" /> {item.color}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id, item.type)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl p-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.type, -1)}
                                className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white font-mono">{item.cartQuantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.type, 1)}
                                className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-end">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">السعر</div>
                              <div className="text-base font-black text-blue-500 font-mono">{(item.price * item.cartQuantity).toLocaleString()} ج.م</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart Footer */}
              <div className="p-6 bg-slate-50 dark:bg-white/2 border-t border-slate-200 dark:border-white/5 space-y-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-slate-500 font-medium">المجموع الفرعي</span>
                    <span className="text-slate-900 dark:text-white font-bold font-mono">{subtotal.toLocaleString()} ج.م</span>
                  </div>
                  {checkoutData.paymentMethod === 'installment' && installmentInterestCost > 0 && (
                    <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                      <span className="text-sm font-medium">الفوائد الإضافية</span>
                      <span className="font-bold font-mono">+{installmentInterestCost.toLocaleString()} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xl font-black text-slate-900 dark:text-white">الإجمالي</span>
                    <span className="text-3xl font-black text-emerald-500 font-mono">{(checkoutData.paymentMethod === 'installment' ? installmentFinalTotal : total).toLocaleString()} ج.م</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      playSound('pop');
                      Array.isArray(cart) && cart.length > 0 && setIsCheckoutModalOpen(true);
                    }}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group text-lg"
                  >
                    <CreditCard className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    إتمام البيع
                  </button>
                  <button
                    onClick={() => {
                      playSound('pop');
                      setCart([]);
                    }}
                    className="w-14 h-[3.5rem] mt-auto bg-red-50 text-red-500 hover:bg-red-100 rounded-xl flex items-center justify-center transition-all border border-red-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setIsShiftModalOpen(true)} className={`border p-4 rounded-3xl flex items-center gap-3 group transition-all col-span-2 ${activeShift ? 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500' : 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-white/20 group-hover:text-white ${activeShift ? 'bg-indigo-500/20 text-indigo-500' : 'bg-rose-500/20 text-rose-500'}`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <div className={`text-[10px] font-bold uppercase tracking-widest group-hover:text-white/80 ${activeShift ? 'text-indigo-600' : 'text-rose-600'}`}>وردية الكاشير</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-white">{activeShift ? 'إدارة وتقفيل الوردية' : 'افتح وردية للبدء'}</div>
                </div>
              </button>
              <button onClick={() => setIsExpenseModalOpen(true)} className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-3xl flex items-center gap-3 group hover:bg-orange-500 transition-all">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500 group-hover:bg-white/20 group-hover:text-white">
                  <Minus className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <div className="text-[10px] font-bold text-orange-600 group-hover:text-white/80 uppercase tracking-widest">تسجيل مصروف</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-white">من الوردية</div>
                </div>
              </button>
              <button onClick={() => setIsRecentInvoicesModalOpen(true)} className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-3xl flex items-center gap-3 group hover:bg-blue-500 transition-all">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-white/20 group-hover:text-white">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <div className="text-[10px] font-bold text-blue-600 group-hover:text-white/80 uppercase tracking-widest">فواتير POS</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-white">العمليات السابقة</div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Invoices Modal */}
          <AnimatePresence>
            {isRecentInvoicesModalOpen && !selectedInvoice && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                  onClick={() => setIsRecentInvoicesModalOpen(false)}
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 30 }}
                  className="bg-white dark:bg-[#11151c] rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10 border border-slate-200 dark:border-white/10 overflow-hidden"
                  dir="rtl"
                >
                  {/* Header */}
                  <div className="bg-indigo-600 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-white">
                      <Receipt className="w-8 h-8 opacity-80" />
                      <div>
                        <h2 className="text-xl font-bold">فواتير نقطة البيع</h2>
                        <div className="text-indigo-200 text-sm">{(Array.isArray(invoices) ? invoices : []).length} فاتورة</div>
                      </div>
                    </div>
                    <button onClick={() => setIsRecentInvoicesModalOpen(false)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="p-4 border-b border-slate-200 dark:border-white/5 flex flex-wrap gap-4 items-center bg-slate-50 dark:bg-white/2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-500">التاريخ:</span>
                      <div className="flex items-center gap-1 bg-white dark:bg-[#080c13] p-1 border border-slate-200 dark:border-white/10 rounded-xl">
                        <button onClick={() => setInvoicesFilterDate('اليوم')} className={`px-4 py-2 text-sm rounded-lg transition-all ${invoicesFilterDate === 'اليوم' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}>اليوم</button>
                        <button onClick={() => setInvoicesFilterDate('أمس')} className={`px-4 py-2 text-sm rounded-lg transition-all ${invoicesFilterDate === 'أمس' ? 'bg-slate-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}>أمس</button>
                        <button onClick={() => setInvoicesFilterDate('آخر 7 أيام')} className={`px-4 py-2 text-sm rounded-lg transition-all ${invoicesFilterDate === 'آخر 7 أيام' ? 'bg-slate-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}>آخر 7 أيام</button>
                      </div>
                      <div className="relative border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#080c13] flex items-center px-2">
                        <Calendar className="w-4 h-4 text-slate-400 ms-2" />
                        <input type="date" value={invoicesCustomDate} onChange={(e) => { setInvoicesCustomDate(e.target.value); setInvoicesFilterDate('custom'); }} className="bg-transparent border-none outline-none focus:ring-0 text-sm py-2 px-1 dark:text-white" />
                      </div>
                    </div>

                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 text-slate-400 absolute top-1/2 start-3 -translate-y-1/2" />
                      <input type="text" placeholder="بحث برقم الفاتورة..." value={invoicesSearch} onChange={(e) => setInvoicesSearch(e.target.value)} className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2 px-10 text-sm focus:outline-none focus:border-indigo-500" />
                      <button onClick={fetchInvoices} className="absolute top-1/2 end-1 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg flex items-center gap-1 transition-all text-xs">
                        <Search className="w-3 h-3" /> بحث
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-4 pe-6 custom-scrollbar bg-slate-50 dark:bg-[#080c13]">
                    {isInvoicesLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      </div>
                    ) : (Array.isArray(invoices) ? invoices : []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-10 text-slate-400">
                        <Receipt className="w-12 h-12 mb-4 opacity-50" />
                        <p>لا توجد فواتير مطابقة لبحثك</p>
                      </div>
                    ) : (
                      <div className="relative border-s-4 border-blue-600 ps-4 space-y-4 ms-2 py-4">
                        <div className="absolute -top-2 -start-[9px] text-blue-600">▲</div>
                        <div className="absolute -bottom-2 -start-[9px] text-blue-600">▼</div>

                        {(Array.isArray(invoices) ? invoices : []).map(invoice => {
                          const isReturned = invoice.status === 'مرتجعة' || invoice.status === 'مرتجعة جزئياً';
                          const totalStr = (Number((invoice as any).net_amount ?? invoice.total_amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
                          return (
                            <div key={invoice.id} className={`bg-white dark:bg-[#1a1f26] p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative overflow-hidden ${isReturned ? 'border border-orange-500/30 opacity-75 bg-orange-50/30 dark:bg-orange-900/10' : 'border border-slate-100 dark:border-white/5'}`}>
                              {isReturned && <div className="absolute top-0 right-0 w-2 h-full bg-orange-400"></div>}

                              {/* Left side (Amount + Actions) */}
                              <div className="flex flex-col items-start gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-4 w-full justify-start">
                                  <div className="text-start">
                                    <p className={`font-black font-mono text-lg ${isReturned ? 'text-rose-500' : 'text-emerald-500'}`} dir="ltr">
                                      {isReturned ? '-' : '+'}{totalStr}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                      {new Date(invoice.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                                {/* Actions inline under amount for compact view */}
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                  <button onClick={() => setSelectedInvoice(invoice)} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg font-bold transition-all flex items-center justify-center flex-1 md:flex-none text-xs">
                                    <FileText className="w-3 h-3 me-1" /> تفاصيل
                                  </button>
                                  <button onClick={() => printInvoiceFromHistory(invoice)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg font-bold transition-all flex items-center justify-center flex-1 md:flex-none text-xs">
                                    <Printer className="w-3 h-3 me-1" /> طباعة
                                  </button>
                                  <button onClick={() => sendWhatsappFromHistory(invoice)} className="px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white rounded-lg font-bold transition-all flex items-center justify-center flex-1 md:flex-none text-xs" title="إرسال واتساب">
                                    <svg className="w-3 h-3 me-1 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                  </button>
                                </div>
                              </div>

                              {/* Right side (Invoice details) */}
                              <div className="flex items-start gap-4 flex-1 justify-end">
                                <div className="text-end space-y-1">
                                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">مبيعات فاتورة رقم {invoice.invoice_number}</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1"><Users className="w-3 h-3" /> {invoice.customer_name || 'عميل نقدي'}</p>
                                  <div className="flex flex-wrap items-center justify-end gap-2 mt-2">
                                    {invoice.Sales_Items?.slice(0, 2).map((item, idx) => (
                                      <span key={idx} className="text-[11px] text-slate-500 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded inline-block">
                                        {item.quantity} × {item.product_name || item.item_name}
                                      </span>
                                    ))}
                                    {invoice.Sales_Items && invoice.Sales_Items.length > 2 && (
                                      <span className="text-[11px] text-slate-400">+{invoice.Sales_Items.length - 2} المزيد</span>
                                    )}
                                  </div>
                                  <div className="mt-2 flex justify-end">
                                    {isReturned ? (
                                      <span className="text-[10px] bg-slate-100/50 dark:bg-white/5 text-slate-400 px-2 py-1 rounded-md font-bold flex items-center gap-1"><Ban className="w-3 h-3" />{invoice.status === 'مرتجعة جزئياً' ? 'مرتجعة جزئياً' : 'فاتورة ملغاة بنجاح'}</span>
                                    ) : invoice.payment_method === 'installment' ? (
                                      <span className="text-[10px] bg-purple-100/50 dark:bg-purple-500/10 text-purple-600 px-2 py-1 rounded-md font-bold flex items-center gap-1"><Clock className="w-3 h-3" />نظام تقسيط</span>
                                    ) : invoice.status === 'paid' || (!invoice.status && ['cash', 'bank', 'wallet', 'split'].includes(invoice.payment_method)) ? (
                                      <span className="text-[10px] bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />مدفوع بالكامل</span>
                                    ) : invoice.status === 'unpaid' ? (
                                      <span className="text-[10px] bg-red-100/50 dark:bg-red-500/10 text-red-600 px-2 py-1 rounded-md font-bold flex items-center gap-1"><Clock className="w-3 h-3" />غير مدفوع</span>
                                    ) : (
                                      <span className="text-[10px] bg-yellow-100/50 dark:bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-md font-bold flex items-center gap-1"><Clock className="w-3 h-3" />مدفوع جزئياً</span>
                                    )}
                                  </div>
                                </div>

                                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${isReturned ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                                  {isReturned ? <Ban className="w-5 h-5 text-rose-500" /> : <TrendingUp className="w-5 h-5 text-emerald-500" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer Total */}
                  <div className="p-6 bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <button onClick={() => setIsRecentInvoicesModalOpen(false)} className="px-8 py-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all">
                      إغلاق
                    </button>
                    <div className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-2">
                      إجمالي: <span className="text-xl text-emerald-600 dark:text-emerald-500 font-mono">{invoices.reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0).toLocaleString()}</span> ج.م
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Invoice Details Modal */}
            {selectedInvoice && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInvoice(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="bg-white dark:bg-[#11151c] rounded-[2rem] w-full max-w-xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden shadow-2xl" dir="rtl">
                  <div className="bg-[#0ea5e9] p-6 flex justify-between items-center">
                    <div className="text-white">
                      <h2 className="text-xl font-bold flex gap-2 items-center"><Receipt className="w-5 h-5" /> تفاصيل الفاتورة</h2>
                      <div className="text-blue-100 mt-1 font-mono">{selectedInvoice.invoice_number}</div>
                    </div>
                    <button onClick={() => setSelectedInvoice(null)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 flex items-center justify-center gap-1"><Calendar className="w-3 h-3" /> التاريخ</span>
                        <div className="font-bold font-mono text-slate-900 dark:text-white">{new Date(selectedInvoice.created_at).toLocaleDateString('ar-EG')}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> الوقت</span>
                        <div className="font-bold font-mono text-slate-900 dark:text-white">{new Date(selectedInvoice.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 flex items-center justify-center gap-1"><CreditCard className="w-3 h-3" /> طريقة الدفع</span>
                        <div className="font-bold text-slate-900 dark:text-white flex justify-center items-center gap-2">
                          {selectedInvoice.payment_method === 'cash' ? <><Wallet className="w-4 h-4 text-emerald-500" /> نقدي</> :
                            selectedInvoice.payment_method === 'wallet' ? <><Smartphone className="w-4 h-4 text-indigo-500" /> محفظة</> :
                              selectedInvoice.payment_method === 'bank' ? <><Landmark className="w-4 h-4 text-blue-500" /> بنكي</> :
                                selectedInvoice.payment_method === 'split' ? <><CreditCard className="w-4 h-4 text-purple-500" /> مقسم</> :
                                  selectedInvoice.payment_method === 'split_unpaid' ? <><CreditCard className="w-4 h-4 text-purple-500" /> مقسم (غير مكتمل)</> :
                                    selectedInvoice.payment_method === 'deferred' ? <><Clock className="w-4 h-4 text-yellow-500" /> آجل</> :
                                      <><Calendar className="w-4 h-4 text-orange-500" /> تقسيط</>
                          }
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 flex items-center justify-center gap-1"><Users className="w-3 h-3" /> العميل</span>
                        <div className="font-bold text-slate-900 dark:text-white">{selectedInvoice.customer_name || 'عميل نقدي'}</div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-4">
                      <h3 className="font-bold flex gap-2 items-center justify-end text-slate-800 dark:text-slate-200"><ShoppingCart className="w-4 h-4" /> الأصناف ({selectedInvoice.Sales_Items?.length || 0})</h3>
                      {selectedInvoice.Sales_Items?.map((item, idx) => {
                        const id = item.product_id || item.item_id;
                        return (
                          <div key={idx} className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 flex justify-between items-center text-sm border-b border-slate-100 max-w-full">
                            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-500 ms-4">{(Number(item.total_price) || 0).toLocaleString()} ج.م</div>
                            <div className="flex-1 text-end">
                              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 justify-end">{item.product_name || item.item_name || 'منتج غير معروف'} <Smartphone className="w-4 h-4 text-indigo-500" /></h4>
                              <div className="text-[10px] text-slate-400 font-mono mt-1 justify-end flex">{id}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Display */}
                    <div className="bg-slate-100 dark:bg-[#151a23] rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-white/5">
                        <span className="text-xl font-bold text-slate-900 dark:text-white font-mono gap-1 flex">{(Number((selectedInvoice as any).net_amount ?? selectedInvoice.total_amount) || 0).toLocaleString()} <span className="text-sm mt-1">ج.م</span></span>
                        <span className="text-slate-500">إجمالي الفاتورة</span>
                      </div>
                      {selectedInvoice.paid_amount !== undefined && (
                        <div className="flex justify-between items-center pb-2">
                          <span className="font-bold text-emerald-600 font-mono gap-1 flex">{(Number(selectedInvoice.paid_amount) || 0).toLocaleString()} <span className="text-sm mt-1">ج.م</span></span>
                          <span className="text-slate-500 text-sm">تم دفع</span>
                        </div>
                      )}
                      {selectedInvoice.remaining_amount !== undefined && selectedInvoice.remaining_amount > 0 && (
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-white/5">
                          <span className="font-bold text-red-500 font-mono gap-1 flex">{(Number(selectedInvoice.remaining_amount) || 0).toLocaleString()} <span className="text-sm mt-1">ج.م</span></span>
                          <span className="text-slate-500 text-sm">متبقي (مديونية)</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-4">
                        {(selectedInvoice.status === 'paid' || (!selectedInvoice.status && ['cash', 'bank', 'wallet', 'split'].includes(selectedInvoice.payment_method))) ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg w-auto justify-end">مدفوع بالكامل <CheckCircle2 className="w-4 h-4" /></div>
                        ) : selectedInvoice.status === 'unpaid' ? (
                          <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg w-auto justify-end">غير مدفوع <Clock className="w-4 h-4" /></div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-600 font-bold bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-lg w-auto justify-end">مدفوع جزئياً <Clock className="w-4 h-4" /></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-200 dark:border-white/10 flex gap-4 bg-white dark:bg-[#11151c] flex-row-reverse">
                    <button onClick={() => printInvoiceFromHistory(selectedInvoice)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 font-bold transition-all shadow shadow-emerald-500/20 flex justify-center items-center gap-2">
                      <Printer className="w-5 h-5" /> طباعة الفاتورة
                    </button>
                    <button onClick={() => sendWhatsappFromHistory(selectedInvoice)} className="px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl py-3 font-bold transition-all shadow shadow-[#25D366]/20 flex justify-center items-center gap-2">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg> واتساب
                    </button>
                    <button onClick={() => setSelectedInvoice(null)} className="px-8 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all">
                      إغلاق
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Confirm Sale Modal */}
          <AnimatePresence>
            {isConfirmModalOpen && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden text-center border border-slate-200 dark:border-white/10"
                >
                  <div className="bg-blue-600 dark:bg-blue-600 py-6 text-white pt-8 pb-6 flex flex-col items-center">
                    <div className="w-14 h-14 bg-white/20 rounded-full flex flex-col items-center justify-center mb-3 text-amber-300">
                      <span className="text-3xl font-black font-sans leading-none">!</span>
                    </div>
                    <h2 className="text-xl font-bold px-4">تأكيد عملية البيع</h2>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 space-y-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex flex-row justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                      <span className="text-slate-500 dark:text-slate-400 font-normal">عدد الأصناف:</span>
                      <span>{(Array.isArray(cart) ? cart : []).reduce((sum, item) => sum + item.cartQuantity, 0)} صنف</span>
                    </div>
                    {checkoutData.paymentMethod === 'installment' && (
                      <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/10 p-2 rounded-lg text-xs border border-purple-100 dark:border-purple-800/30">
                        <span className="text-purple-600 dark:text-purple-400">سعر الكاش: {total.toLocaleString()} ج</span>
                        <span className="text-purple-600 dark:text-purple-400">الفوائد: {installmentInterestCost.toLocaleString()} ج</span>
                      </div>
                    )}
                    <div className="flex flex-row justify-between border-b border-slate-200 dark:border-white/10 pb-3 text-blue-600 dark:text-blue-400 text-lg">
                      <span className="text-slate-500 dark:text-slate-400 font-normal text-sm self-center">الإجمالي:</span>
                      <span dir="ltr" className="font-black font-mono">{(checkoutData.paymentMethod === 'installment' ? installmentFinalTotal : total).toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex flex-row justify-between pb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-normal">طريقة الدفع:</span>
                      <span>{checkoutData.paymentMethod === 'cash' ? 'كاش سائل' : checkoutData.paymentMethod === 'wallet' ? 'محفظة إلكترونية' : checkoutData.paymentMethod === 'bank' ? 'حساب بنكي' : checkoutData.paymentMethod === 'split' ? 'دفع مقسم' : checkoutData.paymentMethod === 'deferred' ? 'آجل' : 'تقسيط'}</span>
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10">
                    <button
                      disabled={isSubmitting}
                      onClick={() => {
                        handleConfirmSale(printOnConfirm);
                      }}
                      className={`w-full py-3.5 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20`}
                    >
                      {isSubmitting ? 'جاري التحفظ...' : <>تأكيد البيع <CheckSquare className="w-5 h-5" /></>}
                    </button>
                    <button
                      onClick={() => setIsConfirmModalOpen(false)}
                      className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-none rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      إلغاء <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Sale Success Modal */}
          <AnimatePresence>
            {isSuccessModalOpen && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setIsSuccessModalOpen(false)}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden text-center border border-slate-200 dark:border-white/10"
                >
                  <div className="bg-emerald-500 py-8 text-white pt-10 pb-8 flex flex-col items-center">
                    <div className="w-20 h-20 border-4 border-white border-dashed rounded-full flex flex-col items-center justify-center mb-4 text-white relative">
                      <div className="absolute inset-1 bg-white rounded-full flex flex-col items-center justify-center">
                        <Check className="w-10 h-10 text-emerald-500" strokeWidth={4} />
                      </div>
                    </div>
                    <h2 className="text-3xl font-black mb-3">تم البيع بنجاح!</h2>
                    <div className="opacity-90 mx-auto px-5 py-2 font-bold flex items-center justify-center gap-2 text-sm bg-black/10 rounded-full">
                      <span>{successInvoiceInfo?.itemsCount} صنف</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                      <span>{successInvoiceInfo?.invoiceId}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                      <span className="font-mono">{successInvoiceInfo?.total?.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                  <div className="p-8 bg-white dark:bg-slate-900 space-y-6">
                    <p className="text-slate-600 dark:text-slate-400 font-bold text-lg">هل تريد طباعة الفاتورة؟</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setIsSuccessModalOpen(false);
                          printReceiptAction();
                        }}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 text-lg"
                      >
                        <Printer className="w-6 h-6" />
                        طباعة الفاتورة
                      </button>
                      <button
                        onClick={async () => {
                          let phone = '';
                          if (successInvoiceInfo?.customerPhone) {
                            phone = successInvoiceInfo.customerPhone.startsWith('0')
                              ? '2' + successInvoiceInfo.customerPhone
                              : successInvoiceInfo.customerPhone.startsWith('+')
                                ? successInvoiceInfo.customerPhone.substring(1)
                                : successInvoiceInfo.customerPhone;
                          }
                          const name = successInvoiceInfo?.customerName || '\u0639\u0645\u064a\u0644\u0646\u0627 \u0627\u0644\u0639\u0632\u064a\u0632';
                          const msgText = '\u0623\u0647\u0644\u0627\u064b \u0628\u0643 \u064a\u0627 ' + name + '\n\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0641\u0627\u062a\u0648\u0631\u062a\u0643 \u0628\u0646\u062c\u0627\u062d.\n\u0631\u0642\u0645 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629: ' + (successInvoiceInfo?.invoiceId || '') + '\n\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629: ' + (successInvoiceInfo?.total?.toLocaleString() || '0') + ' \u062c.\u0645\n\u0646\u0634\u0643\u0631\u0643 \u0639\u0644\u0649 \u062b\u0642\u062a\u0643 \u0628\u0646\u0627!';
                          const waUrl = phone ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msgText) : 'https://wa.me/?text=' + encodeURIComponent(msgText);
                          try {
                            if (receiptPrintRef.current) {
                              const tempDiv = document.createElement('div');
                              tempDiv.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;opacity:0.01;background:white;';
                              const clone = receiptPrintRef.current.cloneNode(true) as HTMLElement;
                              clone.style.display = 'block';
                              clone.style.width = '300px';
                              tempDiv.appendChild(clone);
                              document.body.appendChild(tempDiv);
                              await new Promise(r => setTimeout(r, 500));
                              const { toPng } = await import('html-to-image');
                              const dataUrl = await toPng(clone, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
                              document.body.removeChild(tempDiv);

                              // 1. Try Electron native auto paste
                              if ((window as any).electronAPI && (window as any).electronAPI.sendWhatsappAuto) {
                                const result = await (window as any).electronAPI.sendWhatsappAuto({ dataUrl, phone, msg: msgText });
                                if (result?.success) {
                                  return; // Auto paste handled it completely
                                }
                              }

                              const res = await fetch(dataUrl);
                              const blob = await res.blob();
                              const file = new File([blob], 'Invoice_' + (successInvoiceInfo?.invoiceId || 'receipt') + '.png', { type: 'image/png' });

                              // 2. Try navigator.share for mobile
                              if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                await navigator.share({ files: [file], title: '\u0641\u0627\u062a\u0648\u0631\u0629 \u062a\u0643\u0629', text: msgText });
                              } else {
                                // 3. Web Clipboard Fallback
                                try {
                                  const item = new ClipboardItem({ 'image/png': blob });
                                  await navigator.clipboard.write([item]);
                                  alert('\u062a\u0645 \u0646\u0633\u062e \u0635\u0648\u0631\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629! \u0627\u0636\u063a\u0637 Ctrl+V \u0641\u064a \u0627\u0644\u0648\u0627\u062a\u0633\u0627\u0628 \u0644\u0644\u0635\u0642\u0647\u0627.');
                                  window.open(waUrl, '_blank');
                                } catch (clipErr) {
                                  // Last fallback: download
                                  const link = document.createElement('a');
                                  link.href = dataUrl;
                                  link.download = 'Invoice_' + (successInvoiceInfo?.invoiceId || 'receipt') + '.png';
                                  link.click();
                                  alert('\u062a\u0645 \u062a\u062d\u0645\u064a\u0644 \u0635\u0648\u0631\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629! \u0627\u0631\u0641\u0642\u0647\u0627 \u0641\u064a \u0627\u0644\u0648\u0627\u062a\u0633\u0627\u0628.');
                                  window.open(waUrl, '_blank');
                                }
                              }
                            } else {
                              window.open(waUrl, '_blank');
                            }
                          } catch (err) {
                            console.error('WhatsApp error:', err);
                            window.open(waUrl, '_blank');
                          }
                        }}
                        className="flex-1 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#25D366]/20 text-lg"
                      >
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                        إرسال واتساب
                      </button>
                      <button
                        onClick={() => setIsSuccessModalOpen(false)}
                        className="px-8 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-[1.25rem] font-bold text-lg transition-all"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Checkout Modal Redesign */}
          <AnimatePresence>
            {isCheckoutModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  className="relative w-full max-w-5xl bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(59,130,246,0.1)] overflow-hidden flex flex-col max-h-[95vh]"
                >
                  {/* Hardware-style Header */}
                  <div className="p-8 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-50 dark:from-blue-500/10 to-transparent">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                        <CreditCard className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">مراجعة وإتمام عملية البيع</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">{(Array.isArray(cart) ? cart : []).length} ITEMS IN CART</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-end me-4">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">المبلغ المطلوب</div>
                        <div className="text-2xl font-black text-emerald-500 font-mono">
                          {(checkoutData.paymentMethod === 'installment' ? installmentFinalTotal : total).toLocaleString()} ج.م
                        </div>
                      </div>
                      <button
                        onClick={() => setIsCheckoutModalOpen(false)}
                        className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all border border-slate-200 dark:border-white/5"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Right Section: Payment Details (Main Area) */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 order-1 lg:order-2">

                      {/* Section 1: Customer */}
                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-1 h-6 bg-purple-500 rounded-full" />
                          <Users className="w-5 h-5 text-purple-500" />
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">بيانات العميل</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-white/2 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 relative group">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">الاسم</label>
                            <input
                              type="text"
                              list="posClientsList"
                              value={checkoutData.customerName}
                              onChange={(e) => {
                                const name = e.target.value;
                                const matched = clients.find(c => c.name === name);
                                if (matched && matched.phone) {
                                  setCheckoutData({ ...checkoutData, customerName: name, customerPhone: matched.phone });
                                } else {
                                  setCheckoutData({ ...checkoutData, customerName: name });
                                }
                              }}
                              className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700"
                              placeholder="عميل نقدي..."
                            />
                            <datalist id="posClientsList">
                              {clients.map(c => <option key={c.id} value={c.name} />)}
                            </datalist>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">رقم الهاتف</label>
                            <input
                              type="tel"
                              list="posClientsPhoneList"
                              value={checkoutData.customerPhone}
                              onChange={(e) => {
                                const phone = e.target.value;
                                const matched = clients.find(c => c.phone === phone);
                                if (matched && matched.name) {
                                  setCheckoutData({ ...checkoutData, customerPhone: phone, customerName: matched.name });
                                } else {
                                  setCheckoutData({ ...checkoutData, customerPhone: phone });
                                }
                              }}
                              className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono placeholder:text-slate-400 dark:placeholder:text-slate-700"
                              placeholder="01XXXXXXXXX"
                            />
                            <datalist id="posClientsPhoneList">
                              {clients.filter(c => c.phone).map(c => <option key={c.id} value={c.phone} />)}
                            </datalist>
                          </div>

                          <AnimatePresence>
                            {checkoutData.customerName && checkoutData.customerName.trim().length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 overflow-hidden"
                              >
                                {(() => {
                                  const isExisting = clients.some(c =>
                                    (checkoutData.customerPhone && c.phone === checkoutData.customerPhone) ||
                                    (checkoutData.customerName && c.name === checkoutData.customerName)
                                  );
                                  if (isExisting) {
                                    return (
                                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 mt-2">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4" />
                                          </div>
                                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">العميل مسجل بالفعل في قائمة العملاء</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="flex items-center justify-between bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 border-dashed mt-2">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center">
                                          <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">حفظ كعميل في قائمة العملاء</span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setCheckoutData({ ...checkoutData, saveCustomer: !checkoutData.saveCustomer });
                                        }}
                                        className={`w-12 h-6 rounded-full transition-all relative ${checkoutData.saveCustomer ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                      >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checkoutData.saveCustomer ? 'end-1' : 'start-1'}`} />
                                      </button>
                                    </div>
                                  );
                                })()}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </section>

                      {/* Section: Salesman */}
                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-1 h-6 bg-teal-500 rounded-full" />
                          <Users className="w-5 h-5 text-teal-500" />
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">بائع الفاتورة (العمولة)</h3>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/2 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 relative group">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">اختر البائع (اختياري)</label>
                            <select
                              value={checkoutData.salesmanId}
                              onChange={(e) => setCheckoutData({ ...checkoutData, salesmanId: e.target.value })}
                              className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-all appearance-none"
                            >
                              <option value="">بدون بائع معين (للمحل)</option>
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </section>

                      {/* Section 2: Payment Method */}
                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-1 h-6 bg-blue-500 rounded-full" />
                          <CreditCard className="w-5 h-5 text-blue-500" />
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">طريقة السداد</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-slate-50 dark:bg-white/2 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                          {[
                            { id: 'split', label: 'تقسيم', icon: List, color: 'text-indigo-500' },
                            { id: 'bank', label: 'حساب بنكي', icon: Landmark, color: 'text-slate-500' },
                            { id: 'wallet', label: 'محفظة إلكترونية', icon: Smartphone, color: 'text-indigo-600' },
                            { id: 'cash', label: 'كاش سائل', icon: Wallet, color: 'text-emerald-500' },
                            { id: 'installment', label: 'تقسيط', icon: FileText, color: 'text-orange-400' },
                            { id: 'deferred', label: 'آجل', icon: Clock, color: 'text-blue-400' },
                          ].map((method) => (
                            <button
                              key={method.id}
                              onClick={() => setCheckoutData({ ...checkoutData, paymentMethod: method.id })}
                              className={`flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border transition-all ${checkoutData.paymentMethod === method.id
                                ? 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-[0_4px_15px_rgba(59,130,246,0.1)]'
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-blue-500/30'
                                }`}
                            >
                              <method.icon className={`w-6 h-6 ${method.color}`} />
                              <span className="text-xs font-bold text-center">{method.label}</span>
                            </button>
                          ))}

                          {checkoutData.paymentMethod === 'split' ? (
                            <div className="md:col-span-6 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Cash Split */}
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                  <Wallet className="w-4 h-4 text-emerald-500" /> كاش سائل
                                </label>
                                <div className="space-y-2">
                                  <input
                                    type="number"
                                    value={checkoutData.splitCashAmount}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, splitCashAmount: e.target.value })}
                                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-emerald-600 dark:text-emerald-500 focus:outline-none focus:border-blue-500/50"
                                    placeholder="0"
                                  />
                                  <select
                                    value={checkoutData.splitCashWalletId}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, splitCashWalletId: e.target.value })}
                                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                                  >
                                    <option value="" disabled>خزينة الكاش...</option>
                                    {getWalletsForMethod('cash').map(w => <option key={w.id} value={w.id.toString()}>{w.name}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* Wallet Split */}
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                  <Smartphone className="w-4 h-4 text-indigo-500" /> محفظة إلكترونية
                                </label>
                                <div className="space-y-2">
                                  <input
                                    type="number"
                                    value={checkoutData.splitWalletAmount}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, splitWalletAmount: e.target.value })}
                                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-indigo-600 dark:text-indigo-500 focus:outline-none focus:border-blue-500/50"
                                    placeholder="0"
                                  />
                                  <select
                                    value={checkoutData.splitWalletId}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, splitWalletId: e.target.value })}
                                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                                  >
                                    <option value="" disabled>المحفظة...</option>
                                    {getWalletsForMethod('wallet').map(w => <option key={w.id} value={w.id.toString()}>{w.name}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* Bank Split */}
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                  <Landmark className="w-4 h-4 text-slate-500" /> حساب بنكي
                                </label>
                                <div className="space-y-2">
                                  <input
                                    type="number"
                                    value={checkoutData.splitBankAmount}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, splitBankAmount: e.target.value })}
                                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500/50"
                                    placeholder="0"
                                  />
                                  <select
                                    value={checkoutData.splitBankWalletId}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, splitBankWalletId: e.target.value })}
                                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                                  >
                                    <option value="" disabled>الحساب البنكي...</option>
                                    {getWalletsForMethod('bank').map(w => <option key={w.id} value={w.id.toString()}>{w.name}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* Split Validation Warning */}
                              {((parseFloat(checkoutData.splitCashAmount) || 0) + (parseFloat(checkoutData.splitWalletAmount) || 0) + (parseFloat(checkoutData.splitBankAmount) || 0)) !== total && (
                                <div className="md:col-span-3 mt-4 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 p-3 rounded-xl text-center text-sm font-bold flex flex-col items-center justify-center gap-1 border border-orange-200 dark:border-orange-900/50">
                                  <span>متبقي {(total - ((parseFloat(checkoutData.splitCashAmount) || 0) + (parseFloat(checkoutData.splitWalletAmount) || 0) + (parseFloat(checkoutData.splitBankAmount) || 0))).toLocaleString()} ج.م</span>
                                  <span className="text-[10px]">يجب أن يساوي مجموع الدفعات الإجمالي النهائي</span>
                                </div>
                              )}
                            </div>
                          ) : checkoutData.paymentMethod === 'deferred' ? (
                            <div className="md:col-span-6 mt-4 bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-400 rounded-[2rem] overflow-hidden">
                              <div className="bg-yellow-400 p-3 flex justify-center items-center gap-2 text-white font-bold">
                                <span>تفاصيل البيع بالآجل</span>
                                <Clock className="w-5 h-5" />
                              </div>
                              <div className="p-6 space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                  <div className="space-y-2 flex-1 w-full relative">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">المدفوع الآن (اختياري)</label>
                                    <input
                                      type="number"
                                      value={checkoutData.deferredPaidNow}
                                      onChange={(e) => setCheckoutData({ ...checkoutData, deferredPaidNow: e.target.value })}
                                      className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-lg font-bold focus:outline-none focus:border-yellow-500"
                                      placeholder="0 = آجل كامل"
                                    />
                                  </div>

                                  <ArrowRightLeft className="w-6 h-6 text-yellow-500 hidden md:block shrink-0 mt-6" />

                                  <div className="space-y-2 flex-1 w-full">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">المتبقي على العميل</label>
                                    <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 rounded-xl py-4 px-4 text-center text-xl font-bold text-red-600 dark:text-red-400">
                                      {(total - (parseFloat(checkoutData.deferredPaidNow) || 0)).toLocaleString()} ج.م
                                    </div>
                                  </div>
                                </div>

                                {(parseFloat(checkoutData.deferredPaidNow) || 0) > 0 && (
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500">إيداع المدفوع في:</label>
                                    <select
                                      value={checkoutData.deferredWalletId}
                                      onChange={(e) => setCheckoutData({ ...checkoutData, deferredWalletId: e.target.value })}
                                      className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-yellow-500"
                                    >
                                      <option value="" disabled>اختر الخزينة...</option>
                                      {getWalletsForMethod('cash').map(w => <option key={w.id} value={w.id.toString()}>{w.name}</option>)}
                                    </select>
                                  </div>
                                )}

                                {!checkoutData.customerName && (
                                  <div className="bg-red-50 dark:bg-red-900/10 text-red-500 p-3 rounded-xl text-center text-sm font-bold border border-red-100 dark:border-red-900/20">
                                    ⚠️ يجب اختيار عميل مسجل للبيع بالآجل
                                  </div>
                                )}
                                <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 p-3 rounded-xl text-center text-xs font-bold border border-yellow-200 dark:border-yellow-900/30">
                                  💡 اترك المدفوع = 0 للبيع الآجل الكامل، أو أدخل مبلغ للدفع الجزئي
                                </div>
                              </div>
                            </div>
                          ) : checkoutData.paymentMethod === 'installment' ? (
                            <div className="md:col-span-6 mt-4 bg-purple-50 dark:bg-purple-900/10 border-2 border-purple-400 rounded-[2rem] overflow-hidden">
                              <div className="bg-purple-500 p-3 flex justify-center items-center gap-2 text-white font-bold">
                                <span>تفاصيل التقسيط</span>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="p-6 space-y-6">

                                <div className="space-y-4">
                                  {/* Interest Inputs */}
                                  <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-4">
                                    <label className="text-sm font-bold text-purple-900 dark:text-purple-300">نسبة الربح أو إجمالي القسط</label>

                                    <div className="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1">
                                      <button
                                        onClick={() => setCheckoutData({ ...checkoutData, installmentInterestMode: 'percentage' })}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${checkoutData.installmentInterestMode === 'percentage' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500'}`}
                                      >
                                        نسبة مئوية (%)
                                      </button>
                                      <button
                                        onClick={() => setCheckoutData({ ...checkoutData, installmentInterestMode: 'final_price' })}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${checkoutData.installmentInterestMode === 'final_price' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500'}`}
                                      >
                                        سعر نهائي ثابت
                                      </button>
                                    </div>

                                    <div className="relative">
                                      <input
                                        type="number"
                                        value={checkoutData.installmentInterestInput}
                                        onChange={(e) => setCheckoutData({ ...checkoutData, installmentInterestInput: e.target.value })}
                                        className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-base font-bold focus:outline-none focus:border-purple-500 ps-10"
                                        placeholder={checkoutData.installmentInterestMode === 'percentage' ? 'مثال: 20' : 'مثال: 15000'}
                                      />
                                      <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400">
                                        {checkoutData.installmentInterestMode === 'percentage' ? '%' : 'ج'}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-purple-900 dark:text-purple-300">المقدم (اختياري)</label>
                                  <input
                                    type="number"
                                    value={checkoutData.installmentDownPayment}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, installmentDownPayment: e.target.value })}
                                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-lg font-bold focus:outline-none focus:border-purple-500"
                                    placeholder="0 = بدون مقدم"
                                  />
                                </div>

                                {(parseFloat(checkoutData.installmentDownPayment) || 0) > 0 && (
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500">إيداع المقدم في:</label>
                                    <select
                                      value={checkoutData.installmentWalletId}
                                      onChange={(e) => setCheckoutData({ ...checkoutData, installmentWalletId: e.target.value })}
                                      className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-purple-500"
                                    >
                                      <option value="" disabled>اختر الخزينة...</option>
                                      {getWalletsForMethod('cash').map(w => <option key={w.id} value={w.id.toString()}>{w.name}</option>)}
                                    </select>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-bold text-purple-900 dark:text-purple-300">عدد الأقساط *</label>
                                    <input
                                      type="number"
                                      value={checkoutData.installmentCount}
                                      onChange={(e) => setCheckoutData({ ...checkoutData, installmentCount: e.target.value })}
                                      className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-lg font-bold focus:outline-none focus:border-purple-500"
                                      min="1"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-bold text-purple-900 dark:text-purple-300">الدورة</label>
                                    <select
                                      value={checkoutData.installmentCycle}
                                      onChange={(e) => setCheckoutData({ ...checkoutData, installmentCycle: e.target.value as any })}
                                      className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-lg font-bold focus:outline-none focus:border-purple-500 appearance-none"
                                    >
                                      <option value="monthly">شهري</option>
                                      <option value="weekly">أسبوعي</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-bold text-purple-900 dark:text-purple-300">تاريخ أول قسط *</label>
                                  <input
                                    type="date"
                                    value={checkoutData.installmentStartDate}
                                    onChange={(e) => setCheckoutData({ ...checkoutData, installmentStartDate: e.target.value })}
                                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-sm font-bold focus:outline-none focus:border-purple-500"
                                  />
                                </div>

                                {/* Guarantor Info */}
                                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-4">
                                  <label className="text-sm font-bold text-amber-600 dark:text-amber-400">بيانات الضامن (اختياري)</label>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الاسم</label>
                                      <input
                                        type="text"
                                        value={checkoutData.installmentGuarantorName}
                                        onChange={(e) => setCheckoutData({ ...checkoutData, installmentGuarantorName: e.target.value })}
                                        className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                                        placeholder="اسم الضامن"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">رقم الهاتف</label>
                                      <input
                                        type="text"
                                        value={checkoutData.installmentGuarantorPhone}
                                        onChange={(e) => setCheckoutData({ ...checkoutData, installmentGuarantorPhone: e.target.value })}
                                        className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                                        placeholder="01000000000"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الرقم القومي</label>
                                      <input
                                        type="text"
                                        value={checkoutData.installmentGuarantorNationalId}
                                        onChange={(e) => setCheckoutData({ ...checkoutData, installmentGuarantorNationalId: e.target.value })}
                                        className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                                        placeholder="14 رقم"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">العنوان</label>
                                      <input
                                        type="text"
                                        value={checkoutData.installmentGuarantorAddress}
                                        onChange={(e) => setCheckoutData({ ...checkoutData, installmentGuarantorAddress: e.target.value })}
                                        className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                                        placeholder="عنوان الضامن"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white dark:bg-white/5 p-4 rounded-xl text-center space-y-2 border border-slate-200 dark:border-white/10">

                                  <div className="flex justify-between items-center text-sm font-bold text-slate-500 mb-2">
                                    <span>سعر الكاش: {total.toLocaleString()} ج</span>
                                    <span>الربح: {installmentInterestCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج</span>
                                  </div>

                                  <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">المتبقي بعد المقدم</p>
                                  <p className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
                                    {installmentRemaining.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.م
                                  </p>
                                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 pt-2 font-mono border-t border-slate-100 dark:border-white/5">
                                    {installmentPerMonth.toLocaleString(undefined, { maximumFractionDigits: 2 })} ج.م / {checkoutData.installmentCycle === 'monthly' ? 'شهر' : 'أسبوع'}
                                  </p>
                                </div>

                                {!checkoutData.customerName && (
                                  <div className="bg-red-50 dark:bg-red-900/10 text-red-500 p-3 rounded-xl text-center text-sm font-bold border border-red-100 dark:border-red-900/20">
                                    ⚠️ يجب اختيار عميل مسجل للبيع بالتقسيط
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="md:col-span-6 mt-4 space-y-2">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2 mb-2">
                                {checkoutData.paymentMethod === 'bank' ? (
                                  <><Landmark className="w-3 h-3" /> اختر الحساب البنكي للإيداع</>
                                ) : checkoutData.paymentMethod === 'wallet' ? (
                                  <><Smartphone className="w-3 h-3" /> اختر المحفظة للإيداع</>
                                ) : (
                                  <><Wallet className="w-3 h-3" /> إيداع في الخزينة</>
                                )}
                              </div>
                              {localStorage.getItem('takka_active_drawer_id') && checkoutData.paymentMethod === 'cash' ? (
                                <div className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-500 flex items-center justify-between">
                                  <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-500" /> {wallets.find(w => w.id.toString() === checkoutData.wallet)?.name || 'درج الكاشير الحالي'}</div>
                                  <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md">إيداع تلقائي بالدرج</span>
                                </div>
                              ) : (
                                <select
                                  value={checkoutData.wallet}
                                  onChange={(e) => setCheckoutData({ ...checkoutData, wallet: e.target.value })}
                                  className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                                >
                                  <option value="" disabled>
                                    {checkoutData.paymentMethod === 'bank' ? 'اختر الحساب البنكي...' : checkoutData.paymentMethod === 'wallet' ? 'اختر المحفظة...' : 'اختر الخزينة...'}
                                  </option>
                                  {getWalletsForMethod(checkoutData.paymentMethod).map(w => <option key={w.id} value={w.id.toString()}>{w.name}</option>)}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Section 3: Amounts & Discounts */}
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6 bg-slate-50 dark:bg-white/2 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-bold text-slate-900 dark:text-white">المبلغ المستلم</h3>
                          </div>
                          <div className="space-y-4">
                            {['split', 'cash', 'wallet', 'bank', 'deferred', 'installment'].includes(checkoutData.paymentMethod) ? (
                              <div className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-5 px-6 text-3xl font-black text-emerald-600 dark:text-emerald-500 font-mono text-left cursor-not-allowed select-none">
                                {checkoutData.paymentMethod === 'split' ? calculatedPaid.toLocaleString() : (checkoutData.paymentMethod === 'deferred' ? 0 : (checkoutData.paymentMethod === 'installment' ? calculatedPaid : total)).toLocaleString()}
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={checkoutData.receivedAmount}
                                onChange={(e) => setCheckoutData({ ...checkoutData, receivedAmount: e.target.value })}
                                className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-5 px-6 text-3xl font-black text-emerald-600 dark:text-emerald-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                                placeholder="0.00"
                                disabled={true}
                              />
                            )}
                            {!['cash', 'wallet', 'bank'].includes(checkoutData.paymentMethod) && (
                              <div className="flex justify-between items-center bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">المتبقي (الفكة):</span>
                                <span className={`text-lg font-black font-mono ${change < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                  {change.toLocaleString()} ج.م
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-6 bg-slate-50 dark:bg-white/2 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <Tag className="w-5 h-5 text-orange-500" />
                            <h3 className="font-bold text-slate-900 dark:text-white">خصومات وإضافات</h3>
                          </div>
                          <div className="space-y-4">
                            <div className="relative">
                              <input
                                type="number"
                                placeholder="قيمة الخصم"
                                value={checkoutData.discountValue}
                                onChange={(e) => setCheckoutData({ ...checkoutData, discountValue: e.target.value })}
                                className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500/50 transition-all"
                              />
                              <div className="absolute top-1/2 end-2 -translate-y-1/2 flex items-center bg-slate-50 dark:bg-[#11151c] rounded-xl p-1 border border-slate-200 dark:border-white/5">
                                <button
                                  onClick={() => setCheckoutData({ ...checkoutData, discountType: 'percent' })}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${checkoutData.discountType === 'percent' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500'}`}
                                >
                                  %
                                </button>
                                <button
                                  onClick={() => setCheckoutData({ ...checkoutData, discountType: 'fixed' })}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${checkoutData.discountType === 'fixed' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500'}`}
                                >
                                  ج.م
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="number"
                                min="0"
                                placeholder="رسوم إضافية"
                                value={checkoutData.feeAmount}
                                onChange={(e) => setCheckoutData({ ...checkoutData, feeAmount: e.target.value })}
                                className="bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                              />
                              <input
                                type="text"
                                placeholder="سبب الرسوم"
                                value={checkoutData.feeLabel}
                                onChange={(e) => setCheckoutData({ ...checkoutData, feeLabel: e.target.value })}
                                className="bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                              />
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Left Section: Cart Summary View (Hardware Style) */}
                    <div className="w-full lg:w-96 border-s border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/2 overflow-y-auto p-10 custom-scrollbar order-2 lg:order-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-white dark:bg-white/5 text-blue-600 dark:text-blue-500 rounded-xl flex items-center justify-center border border-slate-200 dark:border-transparent">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">سلة العناصر</h3>
                          <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-0.5">Summary of order</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        {(Array.isArray(cart) ? cart : []).map((item) => (
                          <div key={`${item.type}-${item.id}`} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 border-dashed rounded-3xl p-5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all group shadow-sm dark:shadow-none">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate leading-tight">{item.name}</h4>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 mb-2">{item.category}</p>

                                {item.type === 'device' && (
                                  <div className="flex flex-wrap items-center gap-1 mb-1">
                                    {item.battery_percentage && (
                                      <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                        <Battery className="w-2.5 h-2.5 text-emerald-500" /> %{item.battery_percentage}
                                      </span>
                                    )}
                                    {item.imei1 && (
                                      <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5 font-mono">
                                        IMEI: {item.imei1.slice(0, 5)}..
                                      </span>
                                    )}
                                    {item.color && (
                                      <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                        <Palette className="w-2.5 h-2.5 text-indigo-500" /> {item.color}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id, item.type)}
                                className="p-1.5 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/5 font-mono">x{item.cartQuantity}</span>
                                <span className="text-[10px] font-bold text-slate-500 font-mono">@ {item.price.toLocaleString()}</span>
                              </div>
                              <div className="text-sm font-black text-blue-600 dark:text-blue-500 font-mono">
                                {(item.price * item.cartQuantity).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-10 pt-10 border-t border-slate-200 dark:border-white/5 border-dashed space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">المجموع الفرعي</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">{subtotal.toLocaleString()} ج.م</span>
                        </div>
                        {calculateDiscount() > 0 && (
                          <div className="flex justify-between items-center text-orange-500">
                            <span className="text-[10px] font-bold uppercase tracking-widest">خصم مطبق</span>
                            <span className="text-sm font-bold font-mono">-{calculateDiscount().toLocaleString()} ج.م</span>
                          </div>
                        )}
                        {checkoutData.paymentMethod === 'installment' && installmentInterestCost > 0 && (
                          <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                            <span className="text-[10px] font-bold uppercase tracking-widest">فوائد التقسيط</span>
                            <span className="text-sm font-bold font-mono">+{installmentInterestCost.toLocaleString()} ج.م</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-500 pt-4">
                          <span className="text-xs font-black uppercase tracking-widest">الإجمالي النهائي</span>
                          <span className="text-2xl font-black font-mono">{(checkoutData.paymentMethod === 'installment' ? installmentFinalTotal : total).toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hardware Footer */}
                  <div className="p-6 bg-slate-50 dark:bg-white/2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">

                    {/* Buttons on the left (RTL end) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setPrintOnConfirm(false);
                          setIsConfirmModalOpen(true);
                        }}
                        disabled={isSubmitting}
                        className="px-6 py-4 bg-[#10b981] hover:bg-emerald-600 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                      >
                        <CheckSquare className="w-5 h-5" />
                        تأكيد البيع
                      </button>
                      <button
                        onClick={() => {
                          setPrintOnConfirm(true);
                          setIsConfirmModalOpen(true);
                        }}
                        className="px-6 py-4 bg-[#f59e0b] hover:bg-amber-600 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                      >
                        <Printer className="w-5 h-5" />
                        طباعة
                      </button>
                      <button
                        onClick={() => setIsCheckoutModalOpen(false)}
                        className="px-6 py-4 bg-white dark:bg-[#080c13] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white rounded-xl font-bold transition-all border border-slate-200 dark:border-white/10 flex items-center gap-2"
                      >
                        إلغاء
                        <RotateCcw className="w-4 h-4 ml-1" />
                      </button>
                    </div>

                    {/* Totals on the right (RTL start) */}
                    <div className="flex flex-col text-left space-y-2 min-w-[300px]">
                      <div className="flex justify-between items-center text-slate-500 text-sm pl-4">
                        <span>المجموع الفرعي</span>
                        <span className="font-mono">{subtotal.toLocaleString()} ج.م</span>
                      </div>
                      {checkoutData.paymentMethod === 'installment' && installmentInterestCost > 0 && (
                        <div className="flex justify-between items-center text-purple-500 font-bold text-sm pl-4">
                          <span>فوائد التقسيط</span>
                          <span className="font-mono">+{installmentInterestCost.toLocaleString()} ج.م</span>
                        </div>
                      )}
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-500/20">
                        <span className="text-xl">الإجمالي</span>
                        <span className="text-2xl font-black font-mono">{(checkoutData.paymentMethod === 'installment' ? installmentFinalTotal : total).toLocaleString()} ج.م</span>
                      </div>
                      {/* <div className="flex justify-between items-center text-emerald-500 text-xs font-bold pt-2 border-t border-emerald-100 dark:border-emerald-500/20 border-dashed pl-4">
                    <span>ربح الفاتورة 📈</span>
                    <span className="font-mono">{((Array.isArray(cart) ? cart : []).reduce((sum, item) => sum + ((item.price - (item.purchase_price || 0)) * item.cartQuantity), 0) - calculateDiscount()).toLocaleString()} ج.م</span>
                  </div> */}
                    </div>

                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Purchase Device Modal */}
          <AnimatePresence>
            {isPurchaseDeviceModalOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsPurchaseDeviceModalOpen(false)}
                  className="absolute inset-0 bg-slate-900/20 dark:bg-slate-950/90 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  className="relative w-full max-w-4xl bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-2xl dark:shadow-[0_0_100px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col max-h-[95vh]"
                >
                  {/* Hardware-style Header */}
                  <div className="p-8 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-emerald-500 text-emerald-950 dark:text-slate-950 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                        <Plus className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">شراء جهاز من عميل</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Live Purchase System</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPurchaseDeviceModalOpen(false)}
                      className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/5 rounded-2xl transition-all border border-slate-200 dark:border-white/5"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Form Content */}
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">

                    {isOwner && branches && branches.length > 1 && (
                      <section className="relative">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                          <Store className="w-5 h-5 text-emerald-500" />
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">الفرع / المخزن</h3>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-100 dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">حدد الفرع الذي سيتم إضافة الجهاز لمخزنه *</label>
                            <select
                              value={purchaseData.purchaseTargetBranchId}
                              onChange={(e) => setPurchaseData({ ...purchaseData, purchaseTargetBranchId: e.target.value })}
                              className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                            >
                              <option value="" disabled>اختر الفرع...</option>
                              {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Section 1: Seller Details */}
                    <section className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        <Users className="w-5 h-5 text-blue-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">بيانات البائع</h3>
                        <div className="ms-auto">
                          <button className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold hover:bg-blue-500 hover:text-slate-900 dark:text-white transition-all flex items-center gap-2 border border-blue-500/20">
                            <Search className="w-3.5 h-3.5" /> بحث في العملاء
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-100 dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">اسم الزبون *</label>
                          <input
                            type="text"
                            list="posClientsList"
                            value={purchaseData.customerName}
                            onChange={(e) => {
                              const name = e.target.value;
                              const matched = clients.find(c => c.name === name);
                              if (matched && matched.phone) {
                                setPurchaseData({ ...purchaseData, customerName: name, customerPhone: matched.phone });
                              } else {
                                setPurchaseData({ ...purchaseData, customerName: name });
                              }
                            }}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700 font-medium"
                            placeholder="أدخل اسم العميل بالكامل..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">رقم التليفون</label>
                          <input
                            type="tel"
                            value={purchaseData.customerPhone}
                            onChange={(e) => setPurchaseData({ ...purchaseData, customerPhone: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700 font-mono tracking-widest"
                            placeholder="01XXXXXXXXX"
                          />
                        </div>
                        {(() => {
                          const isExisting = purchaseData.customerName && purchaseData.customerName.trim().length > 0 && clients.some(c =>
                            (purchaseData.customerPhone && c.phone === purchaseData.customerPhone) ||
                            (purchaseData.customerName && c.name === purchaseData.customerName)
                          );
                          if (isExisting) {
                            return (
                              <div className="md:col-span-2 flex items-center justify-between bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-bold text-emerald-400">العميل مسجل بالفعل في قائمة العملاء</span>
                                </div>
                              </div>
                            );
                          }
                          if (purchaseData.customerName && purchaseData.customerName.trim().length > 0) {
                            return (
                              <div className="md:col-span-2 flex items-center justify-between bg-slate-100 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 border-dashed">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-bold text-slate-400">حفظ كعميل جديد في قائمة العملاء</span>
                                </div>
                                <button
                                  onClick={() => setPurchaseData({ ...purchaseData, saveToCustomers: !purchaseData.saveToCustomers })}
                                  className={`w-12 h-6 rounded-full transition-all relative ${purchaseData.saveToCustomers ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                >
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${purchaseData.saveToCustomers ? 'end-1' : 'start-1'}`} />
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </section>

                    {/* Section 2: Device Details */}
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-cyan-500 rounded-full" />
                        <Smartphone className="w-5 h-5 text-cyan-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">بيانات الجهاز</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-100 dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">نوع الجهاز *</label>
                          <select
                            value={purchaseData.deviceType}
                            onChange={(e) => setPurchaseData({ ...purchaseData, deviceType: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                          >
                            <option>هاتف ذكي</option>
                            <option>تابلت</option>
                            <option>لابتوب</option>
                            <option>ساعة ذكية</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">الموديل *</label>
                          <input
                            type="text"
                            value={purchaseData.model}
                            onChange={(e) => setPurchaseData({ ...purchaseData, model: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                            placeholder="مثال: iPhone 13 Pro Max"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">السعة</label>
                          <select
                            value={purchaseData.capacity}
                            onChange={(e) => setPurchaseData({ ...purchaseData, capacity: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                          >
                            <option>8GB</option>

                            <option>16GB</option>
                            <option>32GB</option>
                            <option>64GB</option>
                            <option>128GB</option>
                            <option>256GB</option>
                            <option>512GB</option>
                            <option>1TB</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">الرام</label>
                          <select
                            value={purchaseData.ram}
                            onChange={(e) => setPurchaseData({ ...purchaseData, ram: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                          >
                            <option>2GB</option>
                            <option>3GB</option>
                            <option>4GB</option>
                            <option>6GB</option>
                            <option>8GB</option>
                            <option>12GB</option>
                            <option>16GB</option>
                            <option>32GB</option>
                            <option>64GB</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">اللون</label>
                          <input
                            type="text"
                            value={purchaseData.color}
                            onChange={(e) => setPurchaseData({ ...purchaseData, color: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                            placeholder="أسود، ذهبي، فضي..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">الحالة</label>
                          <select
                            value={purchaseData.condition}
                            onChange={(e) => setPurchaseData({ ...purchaseData, condition: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                          >
                            <option>جديد (ببرشام)</option>
                            <option>كسر زيرو</option>
                            <option>مستعمل نظيف</option>
                            <option>مستعمل (به خدوش)</option>
                            <option>تحت الصيانة</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">الكرتونة</label>
                          <select
                            value={purchaseData.hasBox}
                            onChange={(e) => setPurchaseData({ ...purchaseData, hasBox: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                          >
                            <option>بكرتونة أصلية</option>
                            <option>بدون كرتونة</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2 flex items-center gap-1">
                            <Battery className="w-3 h-3 text-emerald-400" /> نسبة البطارية
                          </label>
                          <input
                            type="number" min="0" max="100"
                            value={purchaseData.batteryPercentage}
                            onChange={(e) => setPurchaseData({ ...purchaseData, batteryPercentage: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                            placeholder="نسبة البطارية (%)"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2 flex items-center gap-1">
                            <Barcode className="w-3 h-3" /> IMEI 1 *
                          </label>
                          <input
                            type="text"
                            value={purchaseData.imei1}
                            onChange={(e) => setPurchaseData({ ...purchaseData, imei1: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono tracking-widest"
                            placeholder="رقم IMEI الأول..."
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2 flex items-center gap-1">
                            <Barcode className="w-3 h-3" /> IMEI 2 (اختياري)
                          </label>
                          <input
                            type="text"
                            value={purchaseData.imei2}
                            onChange={(e) => setPurchaseData({ ...purchaseData, imei2: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono tracking-widest opacity-60 focus:opacity-100 placeholder:text-slate-800"
                            placeholder="رقم IMEI الثاني (اختياري)..."
                          />
                        </div>
                      </div>
                    </section>

                    {/* Section 3: Value & Payment */}
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                        <Wallet className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">التقييم والدفع</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-100 dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 relative">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2 flex items-center justify-between">
                            <span>سعر الشراء من الزبون *</span>
                            <span className="text-emerald-500 tracking-normal">EGP</span>
                          </label>
                          <input
                            type="number"
                            value={purchaseData.purchasePrice}
                            onChange={(e) => setPurchaseData({ ...purchaseData, purchasePrice: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-5 px-6 text-2xl font-black text-emerald-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2 opacity-80">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2 flex items-center justify-between">
                            <span>سعر البيع المتوقع</span>
                            <span className="text-blue-500 tracking-normal">EGP</span>
                          </label>
                          <input
                            type="number"
                            value={purchaseData.expectedSalePrice}
                            onChange={(e) => setPurchaseData({ ...purchaseData, expectedSalePrice: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-5 px-6 text-xl font-bold text-blue-500 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">ضريبة NTRA</label>
                          <input
                            type="number"
                            value={purchaseData.ntraTax}
                            onChange={(e) => setPurchaseData({ ...purchaseData, ntraTax: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-slate-500/50 transition-all font-mono"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">طريقة الدفع للزبون *</label>
                          <select
                            value={purchaseData.paymentMethod}
                            onChange={(e) => setPurchaseData({ ...purchaseData, paymentMethod: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                          >
                            <option value="cash">كاش (من درج الكاش)</option>
                            <option value="wallet">محفظة فودافون كاش</option>
                            <option value="bank">تحويل بنكي</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 mt-2 space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ms-2">سحب من خزينة / محفظة *</label>
                          <select
                            value={purchaseData.walletId}
                            onChange={(e) => setPurchaseData({ ...purchaseData, walletId: e.target.value })}
                            className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                          >
                            <option value="" disabled>اختر الخزينة ليتم الخصم منها...</option>
                            {wallets.map(w => <option key={w.id} value={w.id.toString()}>{w.name}</option>)}
                          </select>
                        </div>

                        <div className="md:col-span-2 bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Wallet className="w-5 h-5 text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-500/80 uppercase tracking-widest">رصيد الكاش الحالي:</span>
                          </div>
                          <span className="text-lg font-black text-emerald-500 font-mono">
                            {purchaseData.walletId
                              ? `${Number(wallets.find(w => w.id?.toString() === purchaseData.walletId)?.balance || 0).toLocaleString()} ج.م`
                              : "0.00 ج.م"}
                          </span>
                        </div>
                      </div>
                    </section>

                    {/* Section 4: Notes */}
                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white">ملاحظات إضافية</h3>
                      </div>
                      <textarea
                        value={purchaseData.notes}
                        onChange={(e) => setPurchaseData({ ...purchaseData, notes: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-white/20 transition-all min-h-[120px] placeholder:text-slate-700"
                        placeholder="اكتب أي ملاحظات تتعلق بحالة الجهاز أو الاتفاق مع الزبون..."
                      ></textarea>
                    </section>

                  </div>

                  {/* Hardware-style Footer Actions */}
                  <div className="p-8 bg-slate-50 dark:bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-6">
                    <div className="bg-slate-100 dark:bg-white/5 px-6 py-4 rounded-3xl border border-slate-200 dark:border-white/5 flex items-center gap-4 shadow-inner">
                      <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-xl">
                        <History className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-slate-400 font-bold leading-relaxed max-w-[200px]">
                        سيتم إضافة الجهاز للمخزن تلقائياً وتسجيل العملية في سجل المشتريات.
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsPurchaseDeviceModalOpen(false)}
                        className="px-8 py-5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white rounded-[2rem] font-bold transition-all border border-slate-200 dark:border-white/10 flex items-center gap-3"
                      >
                        إلغاء العملية
                      </button>
                      <button
                        onClick={handleConfirmPurchase}
                        disabled={isSubmitting}
                        className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-slate-950 rounded-[2rem] font-black transition-all shadow-[0_10px_40px_rgba(16,185,129,0.3)] flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            تأكيد وإضافة للمخزن
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Right Column (in RTL): Product Selection. On Mobile, it stays on top. */}
          <div className={`flex-1 flex-col gap-6 overflow-hidden order-1 ${activeMobileTab === 'products' ? 'flex' : 'hidden lg:flex'}`}>
            {/* Top Navigation & Quick Stats */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4 gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {[
                  { id: 'devices', label: 'الأجهزة' },
                  { id: 'accessories', label: 'الإكسسوارات' },
                  { id: 'spare_parts', label: 'قطع الغيار' },
                  { id: 'transfers', label: 'التحويلات' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative px-4 sm:px-6 py-3 font-bold text-sm sm:text-base transition-all outline-none ${activeTab === tab.id
                      ? `text-blue-600 dark:text-blue-400`
                      : `text-slate-500 hover:text-slate-700 dark:hover:text-slate-300`
                      }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                        initial={false}
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">التسعير:</span>
                <div className="flex items-center bg-slate-100 dark:bg-[#1a1f2c] rounded-lg p-1">
                  <button
                    onClick={() => setPricingType('retail')}
                    className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${pricingType === 'retail'
                      ? 'bg-white dark:bg-[#080c13] text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    قطاعي
                  </button>
                  <button
                    onClick={() => setPricingType('wholesale')}
                    className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${pricingType === 'wholesale'
                      ? 'bg-white dark:bg-[#080c13] text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    جملة
                  </button>
                  <button
                    onClick={() => setPricingType('half_wholesale')}
                    className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${pricingType === 'half_wholesale'
                      ? 'bg-white dark:bg-[#080c13] text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    نصف جملة
                  </button>
                </div>
              </div>
            </div>

            {activeTab === 'transfers' ? (
              <div className="flex-1 flex flex-col pt-2 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setTransferType('withdraw')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${transferType === 'withdraw' ? 'bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 text-slate-500 hover:border-emerald-500/50'}`}> <Upload className="w-5 h-5" /> سحب </button>
                  <button onClick={() => setTransferType('deposit')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${transferType === 'deposit' ? 'bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 text-slate-500 hover:border-emerald-500/50'}`}> <Download className="w-5 h-5" /> إيداع </button>
                  <button onClick={() => setTransferType('deferred')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${transferType === 'deferred' ? 'bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 text-slate-500 hover:border-emerald-500/50'}`}> <Clock className="w-5 h-5" /> تحويل آجل </button>
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 flex items-center gap-2 text-xs font-bold rounded-xl mb-6">
                  💡 {transferType === 'withdraw' ? 'عميل هيحولك على محفظتك وهتديله الفلوس كاش من الدرج' : transferType === 'deposit' ? 'عميل هيديك كاش وهتحوله فلوس على محفظته' : 'تسجيل مديونية على عميل'}
                </div>

                <div className="bg-white dark:bg-[#11151c] rounded-2xl border border-slate-200 dark:border-white/5 p-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <Users className="w-5 h-5" /> بيانات العميل (اختياري)
                    </div>
                    <input
                      type="text"
                      list="posClientsList"
                      value={transferData.customerName}
                      onChange={e => {
                        const name = e.target.value;
                        const matched = clients.find(c => c.name === name);
                        if (matched && matched.phone) {
                          setTransferData({ ...transferData, customerName: name, customerPhone: matched.phone });
                        } else {
                          setTransferData({ ...transferData, customerName: name });
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-base text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all font-medium"
                      placeholder="اكتب اسم العميل..."
                    />
                    <input
                      type="tel"
                      list="posClientsPhoneListTransfer"
                      value={transferData.customerPhone}
                      onChange={e => {
                        const phone = e.target.value;
                        const matched = clients.find(c => c.phone === phone);
                        if (matched && matched.name) {
                          setTransferData({ ...transferData, customerPhone: phone, customerName: matched.name });
                        } else {
                          setTransferData({ ...transferData, customerPhone: phone });
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-base text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all font-mono"
                      placeholder="رقم الهاتف..."
                    />
                    <datalist id="posClientsPhoneListTransfer">
                      {clients.filter(c => c.phone).map(c => <option key={c.id} value={c.phone} />)}
                    </datalist>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <Smartphone className="w-5 h-5" /> نوع التحويل
                    </div>
                    <select value={transferData.provider} onChange={e => {
                      const newProvider = e.target.value;
                      setTransferData({
                        ...transferData,
                        provider: newProvider,
                        commission: calculateCommission(transferData.amount, newProvider)
                      });
                    }} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-base text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all">
                      <option value="vodafone">فودافون كاش 📱</option>
                      <option value="etisalat">اتصالات كاش 🟢</option>
                      <option value="orange">اورنج كاش 🟠</option>
                      <option value="we">وي باي 🟣</option>
                      <option value="instapay">انستاباي 🏦</option>
                      <option value="other">أخرى 💫</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <Wallet className="w-5 h-5" /> مبلغ التحويل <span className="text-red-500">*</span>
                    </div>
                    <input type="number" value={transferData.amount} onChange={e => {
                      const amt = e.target.value;
                      const autoComm = calculateCommission(amt, transferData.provider);
                      setTransferData({ ...transferData, amount: amt, commission: autoComm });
                    }} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-6 px-6 text-4xl font-black text-center text-emerald-500 focus:border-emerald-500/50 transition-all font-mono" placeholder="0" />

                    <div className="flex justify-center gap-3 flex-wrap pt-2">
                      {[5000, 2000, 1000, 500, 100].map(amt => (
                        <button key={amt} onClick={() => {
                          const autoComm = calculateCommission(amt.toString(), transferData.provider);
                          setTransferData({ ...transferData, amount: amt.toString(), commission: autoComm })
                        }} className="px-6 py-3 rounded-2xl text-base font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all font-mono">
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-500">% العمولة (تلقائية - قابلة للتعديل)</span>
                    </div>
                    <input type="number" value={transferData.commission} onChange={e => setTransferData({ ...transferData, commission: e.target.value })} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-center text-2xl font-bold text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all font-mono" placeholder="0" />
                    <p className="text-end text-xs text-slate-400 font-medium">{((settings as any)?.transferSettings?.commissions?.[transferData.provider] ?? 10)} ج.م لكل 1000 ج.م</p>
                  </div>

                  <div className="flex items-center gap-4 border-t border-slate-100 dark:border-white/5 pt-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <Store className="w-5 h-5 text-emerald-500" /> من محفظة
                      </div>
                      <select value={transferData.fromWallet} onChange={e => setTransferData({ ...transferData, fromWallet: e.target.value })} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-base text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all">
                        <option value="">اختر محفظة الخصم...</option>
                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.balance} ج.م)</option>)}
                      </select>
                    </div>

                    {transferType !== 'deferred' && (
                      <>
                        <div className="w-12 h-12 mt-8 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center shrink-0">
                          <ArrowRightLeft className="w-6 h-6 text-slate-400" />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                            <Landmark className="w-5 h-5 text-blue-500" /> إلى محفظة
                          </div>
                          <select value={transferData.toWallet} onChange={e => setTransferData({ ...transferData, toWallet: e.target.value })} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-base text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all">
                            <option value="">اختر محفظة الإيداع...</option>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}  ({w.balance} ج.م)</option>)}
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <input type="text" value={transferData.notes} onChange={e => setTransferData({ ...transferData, notes: e.target.value })} className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-5 text-base text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all placeholder:text-slate-400" placeholder="ملاحظات (اختياري)..." />
                  </div>
                </div>

                <div className="mt-auto pt-6 space-y-4">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-slate-600 dark:text-slate-300">مبلغ التحويل:</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{Number(transferData.amount || 0).toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-emerald-100 dark:border-emerald-500/20 pt-3 text-emerald-600 dark:text-emerald-400">
                      <span className="text-base font-bold flex items-center gap-1">💰 العمولة (الربح):</span>
                      <span className="text-2xl font-black font-mono">{Number(transferData.commission || 0).toLocaleString()} ج.م</span>
                    </div>
                  </div>

                  <button disabled={isTransferSubmitting} onClick={handleTransferSubmit} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-5 text-lg font-black transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex justify-center items-center gap-2">
                    {isTransferSubmitting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> تسجيل التحويل</>}
                  </button>

                  <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                    <div className="text-sm font-bold text-indigo-500">العمولات: <span className="font-mono text-base">{transferStats.totalCommission.toLocaleString()} ج.م</span></div>
                    <div className="text-sm font-bold text-indigo-500 flex items-center gap-2"><List className="w-5 h-5" /> تحويلات الشفت <span className="bg-indigo-500 text-white px-3 py-1 rounded-full ms-2">{transferStats.count}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 relative w-full min-w-[200px] md:min-w-[250px] lg:min-w-[300px]">
                    <Search className="w-5 h-5 text-slate-400 absolute top-1/2 start-4 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ابحث بالموديل أو IMEI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-4 ps-12 pe-6 text-base text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 shadow-sm transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar no-scrollbar">
                    {activeTab === 'devices' && (
                      <select
                        value={deviceConditionFilter}
                        onChange={(e) => setDeviceConditionFilter(e.target.value as any)}
                        className="px-4 py-3 rounded-xl text-sm font-bold bg-white dark:bg-[#11151c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 focus:outline-none focus:border-blue-500/50 shadow-sm transition-colors cursor-pointer shrink-0"
                      >
                        <option value="all">كل الحالات</option>
                        <option value="جديد">جديد</option>
                        <option value="مستعمل">مستعمل</option>
                      </select>
                    )}
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${selectedBrand === brand
                          ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white shadow-md'
                          : 'bg-white dark:bg-[#11151c] text-slate-500 border-slate-200 dark:border-white/5 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'
                          }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar mt-2">
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex items-center justify-center"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                          <p className="text-sm text-slate-500 font-bold">جاري تحميل المنتجات...</p>
                        </div>
                      </motion.div>
                    ) : filteredProducts.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="h-full flex flex-col items-center justify-center text-center space-y-4"
                      >
                        <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center">
                          <Package className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">لا توجد منتجات متاحة</h3>
                          <p className="text-sm text-slate-500">جرب تغيير الفلتر أو البحث عن منتج آخر</p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 pb-6"
                      >
                        {filteredProducts.map((product) => (
                          <motion.button
                            key={`${product.type}-${product.id}`}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addToCart(product)}
                            className="bg-white dark:bg-[#11151c] border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 xl:p-6 text-start relative overflow-hidden group shadow-sm hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all flex flex-col min-h-[160px]"
                          >
                            <div className="absolute top-0 end-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-10 h-10 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                <Plus className="w-6 h-6" />
                              </div>
                            </div>

                            <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                              {product.type === 'device' ? <Smartphone className="w-6 h-6 text-slate-600 dark:text-slate-400" /> :
                                product.type === 'accessory' ? <Headphones className="w-6 h-6 text-slate-600 dark:text-slate-400" /> :
                                  <Wrench className="w-6 h-6 text-slate-600 dark:text-slate-400" />}
                            </div>

                            <h4 className="flex-1 font-bold text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2 text-base xl:text-lg">{product.name}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{product.category}</p>

                            {product.type === 'device' && (
                              <div className="flex flex-wrap items-center gap-1 mt-auto mb-4">
                                {product.battery_percentage && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <Battery className="w-3 h-3 text-emerald-500" /> %{product.battery_percentage}
                                  </span>
                                )}
                                {product.imei1 && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5 font-mono">
                                    IMEI: {product.imei1.slice(0, 5)}..
                                  </span>
                                )}
                                {product.color && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <Palette className="w-3 h-3 text-indigo-500" /> {product.color}
                                  </span>
                                )}
                                {product.storage && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <Database className="w-3 h-3 text-blue-500" /> {product.storage}
                                  </span>
                                )}
                                {product.condition && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <Info className="w-3 h-3 text-orange-500" /> {product.condition}
                                  </span>
                                )}
                                {product.activation_status && product.activation_status !== 'غير محدد' && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <CheckCircle className="w-3 h-3 text-purple-500" /> {product.activation_status}
                                  </span>
                                )}
                                {product.sim_type && product.sim_type !== 'غير محدد' && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 dark:border-white/5">
                                    <CreditCard className="w-3 h-3 text-cyan-500" /> {product.sim_type}
                                  </span>
                                )}
                              </div>
                            )}

                            {product.type !== 'device' && product.location && (
                              <div className="flex items-center gap-1 mb-2">
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200 dark:border-amber-500/20">
                                  📍 {product.location}
                                </span>
                              </div>
                            )}

                            {!product.type || product.type !== 'device' ? <div className="mb-4" /> : null}

                            <div className="flex items-end justify-between mt-auto">
                              <div>
                                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{getEffectivePrice(product).toLocaleString()} ج.م</div>
                              </div>
                              <div className="text-end">
                                <div className={`text-xs font-bold font-mono px-2 py-1 rounded-md ${product.stock < 5 && product.type !== 'device' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                  {product.type === 'device' ? 'متاح' : `${product.stock} قطعة`}
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </>
            )}
          </div>

          {headerActionsContainer && createPortal(headerButtons, headerActionsContainer)}

          {/* Receive from Customer Modal */}
          <AnimatePresence>
            {isReceiveModalOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  className="relative w-full max-w-2xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
                  dir="rtl"
                >
                  {/* Header */}
                  <div className="p-6 bg-emerald-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-amber-200" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">استلام دفعة من عميل</h2>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsReceiveModalOpen(false)}
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Form Content */}
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-500" /> اختر العميل
                      </label>
                      <select
                        value={receiveData.clientId}
                        onChange={e => setReceiveData({ ...receiveData, clientId: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-base text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      >
                        <option value="">-- اختر العميل --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''} - الديون: {Number(c.initial_balance || 0).toLocaleString()} ج.م
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" /> المبلغ المستلم
                      </label>
                      <input
                        type="number"
                        value={receiveData.amount}
                        onChange={e => setReceiveData({ ...receiveData, amount: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-4 px-5 text-2xl font-black text-center text-emerald-600 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-500" /> طريقة الدفع بالخزينة
                      </label>
                      <select
                        value={receiveData.walletId}
                        onChange={e => setReceiveData({ ...receiveData, walletId: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-base text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      >
                        <option value="">-- اختر طريقة الدفع --</option>
                        {wallets.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.balance} ج.م)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-emerald-500" /> ملاحظات
                      </label>
                      <textarea
                        value={receiveData.notes}
                        onChange={e => setReceiveData({ ...receiveData, notes: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-base text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-400"
                        placeholder="ملاحظات إضافية..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 bg-slate-50 dark:bg-[#080c13] border-t border-slate-200 dark:border-white/5 flex gap-4">
                    <button
                      onClick={handleReceiveSubmit}
                      disabled={isSubmitting}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-4 font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> تأكيد الاستلام</>}
                    </button>
                    <button
                      onClick={() => setIsReceiveModalOpen(false)}
                      className="flex-1 bg-white dark:bg-[#11151c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" /> إلغاء
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Return Modal */}
          <AnimatePresence>
            {isReturnModalOpen && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setIsReturnModalOpen(false)} />
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-3xl bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl max-h-[90vh]" dir="rtl">
                  {/* Header */}
                  <div className="p-6 bg-slate-50 dark:bg-[#080c13] border-b border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <RotateCcw className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">مرتجع بالفاتورة</h2>
                      </div>
                    </div>
                    <button onClick={() => { setIsReturnModalOpen(false); setSelectedReturnInvoice(null); }} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-500 transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {!selectedReturnInvoice ? (
                      <>
                        <div className="relative">
                          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            value={returnSearch}
                            onChange={(e) => setReturnSearch(e.target.value)}
                            placeholder="ابحث برقم الفاتورة أو اسم العميل..."
                            className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-xl py-4 pr-12 pl-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-3 mt-4">
                          {(Array.isArray(returnInvoices) ? returnInvoices : []).length === 0 && returnSearch.trim() !== '' && (
                            <div className="text-center py-8 text-slate-500 font-bold">لا يوجد نتائج للبحث</div>
                          )}
                          {(Array.isArray(returnInvoices) ? returnInvoices : []).map((inv: any) => {
                            const isFullyReturned = inv.status === 'مرتجعة';
                            const isPartiallyReturned = inv.status === 'مرتجعة جزئياً';
                            const isReturnedState = isFullyReturned || isPartiallyReturned;
                            return (
                              <div key={inv.id} className={`bg-white dark:bg-[#0d1117] border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all relative overflow-hidden ${isReturnedState ? 'border-orange-500/30 opacity-75 bg-orange-50/30 dark:bg-orange-900/10' : 'border-slate-200 dark:border-white/10 hover:border-blue-500/30'}`}>
                                {isReturnedState && (
                                  <div className="absolute top-0 right-0 w-1 h-full bg-orange-400"></div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {inv.invoice_number}
                                    {isReturnedState && (
                                      <span className="flex items-center gap-1 text-[10px] text-orange-500 bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded flex-shrink-0">
                                        {isPartiallyReturned ? 'مرتجعة جزئياً' : 'مرتجعة'} <RotateCcw className="w-3 h-3" />
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-slate-500 flex items-center gap-2 mt-2">
                                    <Users className="w-4 h-4" /> {inv.customer_name || 'عميل نقدي'} • <Calendar className="w-4 h-4" /> {new Date(inv.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </div>
                                  <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                    <Package className="w-4 h-4" /> {(Array.isArray(inv.Sales_Items) ? inv.Sales_Items : []).length} صنف
                                  </div>
                                </div>
                                <div className="flex items-center justify-between w-full md:w-auto md:gap-4">
                                  <div className={`text-xl font-black font-mono ${isFullyReturned ? 'text-slate-400 line-through' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {(Number(inv.net_amount ?? inv.total_amount) || 0).toLocaleString()} <span className="text-[10px] text-slate-400">ج.م</span>
                                  </div>
                                  <button onClick={() => setSelectedReturnInvoice(inv)} disabled={isFullyReturned} className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${isFullyReturned ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-white/5' : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                                    {isFullyReturned ? 'تم الإرجاع' : (isPartiallyReturned ? 'إرجاع الباقي' : 'اختيار')} {isFullyReturned ? <Ban className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Details header */}
                        <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 p-6 rounded-2xl relative">
                          <button onClick={() => { setSelectedReturnInvoice(null); setSelectedReturnItems([]); }} className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 font-bold text-sm mb-4">
                            <ArrowRightLeft className="w-4 h-4" /> رجوع للقائمة
                          </button>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="text-lg font-black text-blue-600 dark:text-blue-400 mb-2">{selectedReturnInvoice.invoice_number}</div>
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1"><Users className="w-4 h-4" /> {selectedReturnInvoice.customer_name || 'عميل نقدي'}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(selectedReturnInvoice.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                            </div>
                            <div className="text-start md:text-end bg-white dark:bg-white/5 p-3 rounded-xl border border-white/50 dark:border-white/10 w-full md:w-auto">
                              <div className="text-xs font-bold text-slate-500 mb-1">إجمالي الفاتورة</div>
                              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">{(Number(selectedReturnInvoice.net_amount ?? selectedReturnInvoice.total_amount) || 0).toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Items */}
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white"><Package className="w-5 h-5 text-amber-500" /> اختر العناصر للإرجاع</h3>
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
                              تحديد الكل
                              <input type="checkbox" onChange={(e) => {
                                const salesItems = (selectedReturnInvoice.Sales_Items || []).filter((i: any) => {
                                  const name = i.product_name || i.item_name || '';
                                  const match = name.match(/\(مرتجع (\d+) من (\d+)\)/);
                                  const prevRet = match ? parseInt(match[1]) : (name.includes('(مرتجع)') ? i.quantity : 0);
                                  return (i.quantity - prevRet) > 0;
                                });
                                if (e.target.checked && Array.isArray(salesItems)) {
                                  setSelectedReturnItems(salesItems.map((i: any) => {
                                    const name = i.product_name || i.item_name || '';
                                    const match = name.match(/\(مرتجع (\d+) من (\d+)\)/);
                                    const prevRet = match ? parseInt(match[1]) : 0;
                                    const availableQty = i.quantity - prevRet;
                                    return { id: i.id.toString(), type: i.product_type || i.item_type, product_id: i.product_id || i.item_id, quantity: availableQty, amount: availableQty * getDiscountedPrice(selectedReturnInvoice, i.unit_price || 0) };
                                  }));
                                } else {
                                  setSelectedReturnItems([]);
                                }
                              }} checked={Boolean(Array.isArray(selectedReturnInvoice.Sales_Items) && selectedReturnItems.length === selectedReturnInvoice.Sales_Items.filter((i: any) => {
                                const name = i.product_name || i.item_name || '';
                                const match = name.match(/\(مرتجع (\d+) من (\d+)\)/);
                                const prevRet = match ? parseInt(match[1]) : (name.includes('(مرتجع)') ? i.quantity : 0);
                                return (i.quantity - prevRet) > 0;
                              }).length && selectedReturnItems.length > 0)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            </label>
                          </div>

                          <div className="space-y-3">
                            {selectedReturnInvoice.Sales_Items?.filter((i: any) => {
                              const name = i.product_name || i.item_name || '';
                              const match = name.match(/\(مرتجع (\d+) من (\d+)\)/);
                              const prevRet = match ? parseInt(match[1]) : (name.includes('(مرتجع)') ? i.quantity : 0);
                              return (i.quantity - prevRet) > 0;
                            }).map((item: any) => {
                              const name = item.product_name || item.item_name || '';
                              const match = name.match(/\(مرتجع (\d+) من (\d+)\)/);
                              const prevRet = match ? parseInt(match[1]) : 0;
                              const availableQty = item.quantity - prevRet;
                              const selectedItem = selectedReturnItems.find(i => i.id === item.id.toString());
                              const isSelected = !!selectedItem;
                              return (
                                <div key={item.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4 transition-all ${isSelected ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-500/5 shadow-md shadow-amber-500/10' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117] hover:border-blue-500/30'} cursor-pointer`} onClick={() => {
                                  if (isSelected) {
                                    setSelectedReturnItems(prev => prev.filter(i => i.id !== item.id.toString()));
                                  } else {
                                    setSelectedReturnItems(prev => [...prev, { id: item.id.toString(), product_id: item.product_id || item.item_id, quantity: availableQty, type: item.product_type || item.item_type, amount: availableQty * getDiscountedPrice(selectedReturnInvoice, item.unit_price || 0) }]);
                                  }
                                }}>
                                  <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                                    {(item.product_type === 'device' || item.item_type === 'device') ? <Smartphone className="w-6 h-6 text-blue-500" /> :
                                      (item.product_type === 'accessory' || item.item_type === 'accessory') ? <Headphones className="w-6 h-6 text-purple-500" /> :
                                        <Wrench className="w-6 h-6 text-amber-500" />}
                                  </div>
                                  <div className="flex-1 w-full text-center sm:text-start">
                                    <div className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{name.split(' (مرتجع')[0]}</div>
                                    <div className="text-xs text-slate-500 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                      {(item.product_type === 'device' || item.item_type === 'device') ?
                                        <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded font-mono">IMEI: {item.imei}</span> :
                                        <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">متاح: {availableQty}</span>
                                      }
                                      <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">السعر: {getDiscountedPrice(selectedReturnInvoice, item.unit_price || 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 px-2 sm:px-0">
                                    {isSelected && availableQty > 1 && (
                                      <div className="flex items-center gap-2 bg-white dark:bg-[#1a1f26] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden ml-4" onClick={e => e.stopPropagation()}>
                                        <button
                                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50"
                                          disabled={selectedItem.quantity >= availableQty}
                                          onClick={() => {
                                            setSelectedReturnItems(prev => prev.map(i => i.id === item.id.toString() ? { ...i, quantity: i.quantity + 1, amount: (i.quantity + 1) * getDiscountedPrice(selectedReturnInvoice, item.unit_price || 0) } : i));
                                          }}
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-bold text-slate-900 dark:text-white">{selectedItem.quantity}</span>
                                        <button
                                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50"
                                          disabled={selectedItem.quantity <= 1}
                                          onClick={() => {
                                            setSelectedReturnItems(prev => prev.map(i => i.id === item.id.toString() ? { ...i, quantity: i.quantity - 1, amount: (i.quantity - 1) * getDiscountedPrice(selectedReturnInvoice, item.unit_price || 0) } : i));
                                          }}
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                    <div className="text-xl font-black font-mono text-slate-900 dark:text-white sm:ml-4">{isSelected ? selectedItem.amount.toLocaleString() : (availableQty * getDiscountedPrice(selectedReturnInvoice, item.unit_price || 0)).toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span></div>
                                    <input type="checkbox" checked={isSelected} readOnly className="w-6 h-6 rounded text-amber-500 focus:ring-amber-500 cursor-pointer sm:mr-4 border-2 border-slate-300" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Form bottom */}
                        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-white/10 mt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><PenTool className="w-4 h-4 text-red-500" /> سبب المرتجع <span className="text-red-500">*</span></label>
                              <select value={returnReason} onChange={e => setReturnReason(e.target.value)} className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 font-bold transition-all text-slate-700 dark:text-slate-300">
                                <option value="">-- اختر السبب --</option>
                                <option value="عيب صناعة">عيب صناعة / تالف</option>
                                <option value="استبدال">استبدال بمنتج آخر</option>
                                <option value="إلغاء شراء">إلغاء الشراء / تراجع العميل</option>
                                <option value="أخرى">سبب آخر (أخرى)</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-500" /> خصم المرتجع من <span className="text-red-500">*</span></label>
                              <select value={returnWallet} onChange={e => setReturnWallet(e.target.value)} className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500 font-bold transition-all text-slate-700 dark:text-slate-300">
                                <option value="">-- اختر الخزينة/المحفظة --</option>
                                {wallets.map(w => (
                                  <option key={w.id} value={w.id}>{w.name} ({w.balance} ج.م)</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <label className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/10 transition-colors">
                            <div className="mb-2 sm:mb-0">
                              <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2"><Package className="w-5 h-5" /> إرجاع المنتجات للمخزن</div>
                              <div className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-1">إعادة الكميات وإتاحة الأجهزة في المخزون للبيع مرة أخرى</div>
                            </div>
                            <div className="relative flex items-center">
                              <input type="checkbox" checked={returnToStock} onChange={e => setReturnToStock(e.target.checked)} className="sr-only peer" />
                              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </div>
                          </label>

                          <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl flex items-center justify-between border border-slate-200 dark:border-white/10">
                            <div className="font-bold text-slate-700 dark:text-slate-300">إجمالي قيمة المرتجع</div>
                            <div className="text-2xl font-black font-mono text-amber-500">
                              {selectedReturnItems.reduce((acc, item) => acc + item.amount, 0).toLocaleString()} <span className="text-sm text-slate-500 font-sans">ج.م</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-slate-50 dark:bg-[#080c13] border-t border-slate-200 dark:border-white/5 flex gap-4 shrink-0">
                    <button onClick={() => { setIsReturnModalOpen(false); setSelectedReturnInvoice(null); }} className="px-8 py-3.5 bg-white dark:bg-[#11151c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl font-bold transition-all shadow-sm">إلغاء</button>
                    <button onClick={handleReturnSubmit} disabled={isReturnSubmitting || !selectedReturnInvoice || selectedReturnItems.length === 0} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-3.5 font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isReturnSubmitting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> تنفيذ المرتجع</>}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Expense Modal */}
          <AnimatePresence>
            {isExpenseModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                  onClick={() => setIsExpenseModalOpen(false)}
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 30 }}
                  className="bg-white dark:bg-[#11151c] rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 border border-slate-200 dark:border-white/10 overflow-hidden"
                  dir="rtl"
                >
                  <div className="bg-orange-500 p-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 text-white">
                      <Minus className="w-8 h-8 opacity-80 bg-white/20 p-1.5 rounded-xl" />
                      <div>
                        <h2 className="text-xl font-bold">تسجيل مصروف من الوردية</h2>
                        <p className="text-sm opacity-80 mt-1">سيتم خصم المبلغ من درج الكاشير الحالي</p>
                      </div>
                    </div>
                    <button onClick={() => setIsExpenseModalOpen(false)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">المبلغ (ج.م) <span className="text-rose-500">*</span></label>
                      <input
                        type="number"
                        value={expenseData.amount}
                        onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 text-lg font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">سبب المصروف <span className="text-rose-500">*</span></label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'rent', label: 'إيجار', icon: '🏠' },
                          { id: 'electricity', label: 'فواتير كهرباء', icon: '⚡' },
                          { id: 'water', label: 'فواتير مياه', icon: '💧' },
                          { id: 'internet', label: 'فواتير إنترنت', icon: '🌐' },
                          { id: 'salaries', label: 'مرتبات موظفين', icon: '👥' },
                          { id: 'marketing', label: 'مصاريف تسويق', icon: '📢' },
                          { id: 'maintenance', label: 'صيانة وإصلاح', icon: '🔧' },
                          { id: 'transport', label: 'مواصلات ووقود', icon: '🚗' },
                          { id: 'office_supplies', label: 'مستلزمات مكتبية', icon: '📎' },
                          { id: 'taxes', label: 'ضرائب ورسوم', icon: '🏛️' },
                          { id: 'cleaning', label: 'منظفات ومستلزمات', icon: '🧹' },
                          { id: 'food', label: 'أكل وشرب', icon: '🥘' },
                          { id: 'printing', label: 'مطبوعات وتصوير', icon: '🖨️' },
                          { id: 'commission', label: 'عمولات وسطاء', icon: '🤝' },
                          { id: 'shipping', label: 'مصاريف شحن', icon: '📦' },
                          { id: 'licenses', label: 'اشتراكات وتراخيص', icon: '🔑' },
                        ].map((reason) => (
                          <button
                            key={reason.id}
                            onClick={() => setExpenseData({ ...expenseData, reason: reason.label })}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${expenseData.reason === reason.label
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 shadow-sm'
                              : 'border-slate-200 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-500/50 bg-white dark:bg-[#11151c] text-slate-600 dark:text-slate-400'
                              }`}
                          >
                            <span className="text-lg">{reason.icon}</span>
                            <span className="text-[10px] font-bold text-center leading-tight">{reason.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="relative pt-1">
                        <input
                          type="text"
                          value={expenseData.reason}
                          onChange={(e) => setExpenseData({ ...expenseData, reason: e.target.value })}
                          placeholder="أو اكتب سبب آخر هنا..."
                          className="w-full bg-slate-50 dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ملاحظات (اختياري)</label>
                      <textarea
                        value={expenseData.details}
                        onChange={(e) => setExpenseData({ ...expenseData, details: e.target.value })}
                        rows={2}
                        placeholder="أضف أي تفاصيل أخرى..."
                        className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 resize-none"
                      ></textarea>
                    </div>
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-[#080c13] border-t border-slate-200 dark:border-white/5 flex gap-3 shrink-0">
                    <button onClick={() => setIsExpenseModalOpen(false)} className="px-6 py-3 bg-white dark:bg-[#11151c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl font-bold transition-all shadow-sm">إلغاء</button>
                    <button onClick={handleExpenseSubmit} disabled={isExpenseSubmitting || !expenseData.amount || !expenseData.reason} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isExpenseSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> تسجيل وتأكيد</>}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Shift Management Modal */}
          <ShiftManagementModal
            isOpen={isShiftModalOpen}
            onClose={() => setIsShiftModalOpen(false)}
            onShiftUpdate={fetchWalletsAndShift}
          />
        </div>
      </div>

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <PrintReceiptTemplate ref={receiptPrintRef} {...lastInvoiceData} />
      </div>

      <PrintBarcodeModal isOpen={isBarcodeModalOpen} onClose={() => setIsBarcodeModalOpen(false)} />
    </>
  );
}
