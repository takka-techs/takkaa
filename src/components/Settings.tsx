import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import { 
  Building2, Palette, Wallet, Receipt, DatabaseBackup, 
  BellRing, Wifi, Smartphone, Info, AlertOctagon, 
  Save, Upload, Moon, Sun, Monitor, Paintbrush, 
  CreditCard, Store, Printer, HardDrive, ShieldAlert,
  CheckCircle2, AlertCircle, Loader2, Globe, Trash2,
  Type, Plus, Minus, Tag, Wrench, RefreshCcw, ArrowRightLeft, AlertTriangle, Box
} from 'lucide-react';
import ManageWalletsModal from './ManageWalletsModal';

// A "Different Program" feel: Sleek vertical sidebar, frosted glass, smooth transitions.

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'الإعدادات العامة', icon: Building2, desc: 'اسم الشركة، الشعار، والعملة', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'invoice_numbering', label: 'أرقام وقوالب الفواتير', icon: Type, desc: 'تسلسل أرقام الفواتير وقوالب الرسائل', color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { id: 'appearance', label: 'المظهر والتفضيلات', icon: Palette, desc: 'الألوان، الوضع الداكن والتنسيق', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'invoices', label: 'إعدادات الطباعة', icon: Receipt, desc: 'رأس الفاتورة، الشروط ومقاسات الورق', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'wallets', label: 'المحافظ المالية', icon: Wallet, desc: 'إدارة حسابات الدفع والبنوك', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'transfers', label: 'إعدادات التحويلات', icon: ArrowRightLeft, desc: 'عمولات خدمات تحويل الأموال', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: DatabaseBackup, desc: 'حفظ نسخة من بياناتك', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'notifications', label: 'الإشعارات', icon: BellRing, desc: 'تنبيهات النواقص والمهام', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { id: 'about', label: 'حول البرنامج', icon: Info, desc: 'الإصدار والتراخيص والدعم', color: 'text-slate-500', bg: 'bg-slate-500/10' },
];

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

const defaultSettings = {
  whatsappMaintenanceTemplate: 'السلام عليكم {customer_name}\nمن {company_name}\n\nتحديث حالة جهازك:\n📱 الجهاز: {device}\n🔖 رقم التذكرة: {ticket_no}\n📌 الحالة: {status}\n💰 التكلفة: {total_cost} ج.م\n\nشكراً لثقتكم 🙏 {tech_name}',
};

export default function Settings() {
  const { refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [settingsId, setSettingsId] = useState<number | null>(null);
  
  // Custom sound and toast for notifications tab
  const [subData, setSubData] = useState<{valid: boolean; status: string; days_left: number; server_now: string} | null>(null);

  useEffect(() => {
    try {
      const offlineData = localStorage.getItem('offline_sub_data');
      if (offlineData) {
         setSubData(JSON.parse(atob(offlineData)));
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

  const playSound = (type = 'ting') => {
    if (!settingsData.enableSounds) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'ting') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'pop') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);
      }
    } catch (e) {
      console.log('Audio error', e);
    }
  };

  const showToast = (message: string) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Form States
  const [settingsData, setSettingsData] = useState({
    companyName: 'تكة للهواتف والصيانة',
    currency: 'EGP',
    taxRate: '14',
    invoiceHeader: 'مرحباً بكم في تكة أصل الثقة',
    invoiceFooter: 'البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوم',
    theme: 'system',
    accentColor: 'teal',
    logo: '',
    dateFormat: 'DD/MM/YYYY',
    directPrint: false,
    paperWidth: '80mm',
    receiptFontSize: '100%',
    phone: '',
    address: '',
    showDetails: true,
    barcodeDirectPrint: false,
    barcodeWidth: '50mm',
    barcodeHeight: '30mm',
    barcodeFontSize: '12px',
    barcodeRotation: false,
    showBarcodeOnSticker: true,
    maintenanceNote: 'يرجى الاحتفاظ بهذا الإيصال... المحل غير مسؤول عن الأجهزة التي لم تُستلم خلال 30 يوم',
    warrantyTerms: 'الضمان لا يشمل كسر الشاشة أو دخول المياه',
    maintenanceFooter: 'تنويه: المتجر غير مسؤول عن الأجهزة التي تترك لأكثر من 30 يوم',
    maintenanceReceiptTemplate: 'default',
    maintenanceStickerTemplate: 'default',
    maintenanceReceiptTopHeader: 'افضل خدمه\nافضل جوده\nافضل سعر',
    salesReceiptTemplate: 'default',
    appFontSize: 100,
    whatsappMaintenanceTemplate: 'السلام عليكم {customer_name}\nمن {company_name}\n\nتحديث حالة جهازك:\n📱 الجهاز: {device}\n🔖 رقم التذكرة: {ticket_no}\n📌 الحالة: {status}\n💰 التكلفة: {total_cost} ج.م\n\nشكراً لثقتكم 🙏 {tech_name}',
    invoiceNumbering: {
      accessory_sale: { name: 'مبيعات الإكسسوارات', prefix: 'ACC-', padding: 6, last_number: 0 },
      expense: { name: 'المصروفات', prefix: 'EXP-', padding: 6, last_number: 0 },
      purchase: { name: 'مشتريات', prefix: 'PUR-', padding: 6, last_number: 0 },
      repair: { name: 'إصلاحات', prefix: 'REP-', padding: 6, last_number: 0 },
      return: { name: 'مرتجعات', prefix: 'RET-', padding: 6, last_number: 0 },
      sale: { name: 'مبيعات الأجهزة', prefix: 'SAL-', padding: 6, last_number: 0 },
      stocktake: { name: 'جرد', prefix: 'ST-', padding: 4, last_number: 0 }
    },
    transferSettings: {
      calculationMethod: 'per_1000',
      commissions: {
        vodafone: 10,
        etisalat: 10,
        orange: 10,
        we: 10,
        instapay: 5,
        other: 10
      }
    },
    licenseStatus: true,
    licenseExpiry: '',
    enableNotifications: true,
    enableSounds: true,
    taskReminders: true,
    salesNotifications: true,
    lowStockNotifications: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
    preventZeroStockSales: false,
    hasBranches: true
  });

  useEffect(() => {
    fetchSettings();

    const handleOpenTab = (e: CustomEvent) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    
    // @ts-ignore
    window.addEventListener('open-settings-tab', handleOpenTab);
    return () => {
      // @ts-ignore
      window.removeEventListener('open-settings-tab', handleOpenTab);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      if (!userId) return;

      const res = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?user_id=eq.${userId}`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const dbSettings = data[0];
          const userId = localStorage.getItem('user_id');
          let parsedLocal: any = {};
          try {
             parsedLocal = JSON.parse(localStorage.getItem(`takka_settings_${userId}`) || localStorage.getItem('takka_settings') || '{}');
          } catch(e) {}
          
          setSettingsId(dbSettings.id);
          setSettingsData({
            companyName: dbSettings.company_name || 'تكة للهواتف والصيانة',
            currency: dbSettings.currency || 'EGP',
            taxRate: dbSettings.tax_rate?.toString() || '14',
            invoiceHeader: dbSettings.invoice_header || 'مرحباً بكم في تكة أصل الثقة',
            invoiceFooter: dbSettings.invoice_footer || 'البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوم',
            theme: dbSettings.theme || 'system',
            accentColor: dbSettings.accent_color || 'teal',
            logo: dbSettings.logo || '',
            dateFormat: dbSettings.date_format || 'DD/MM/YYYY',
            directPrint: dbSettings.direct_print ?? false,
            paperWidth: dbSettings.paper_width || '80mm',
            receiptFontSize: dbSettings.receipt_font_size || '100%',
            phone: dbSettings.phone || '',
            address: dbSettings.address || '',
            showDetails: dbSettings.show_details ?? true,
            barcodeDirectPrint: dbSettings.barcode_direct_print ?? false,
            barcodeWidth: dbSettings.barcode_width || '50mm',
            barcodeHeight: dbSettings.barcode_height || '30mm',
            barcodeFontSize: dbSettings.barcode_font_size || '12px',
            barcodeRotation: parsedLocal?.barcodeRotation ?? false,
            showBarcodeOnSticker: parsedLocal?.showBarcodeOnSticker ?? true,
            maintenanceNote: dbSettings.maintenance_note || 'يرجى الاحتفاظ بهذا الإيصال... المحل غير مسؤول عن الأجهزة التي لم تُستلم خلال 30 يوم',
            warrantyTerms: dbSettings.warranty_terms || 'الضمان لا يشمل كسر الشاشة أو دخول المياه',
            maintenanceFooter: dbSettings.maintenance_footer || 'تنويه: المتجر غير مسؤول عن الأجهزة التي تترك لأكثر من 30 يوم',
            maintenanceReceiptTemplate: dbSettings.maintenance_receipt_template || 'default',
            maintenanceStickerTemplate: dbSettings.maintenance_sticker_template || 'default',
            maintenanceReceiptTopHeader: dbSettings.maintenance_receipt_top_header || 'افضل خدمه\nافضل جوده\nافضل سعر',
            salesReceiptTemplate: dbSettings.sales_receipt_template || 'default',
            appFontSize: dbSettings.app_font_size ?? 100,
            whatsappMaintenanceTemplate: dbSettings.whatsapp_maintenance_template || 'السلام عليكم {customer_name}\nمن {company_name}\n\nتحديث حالة جهازك:\n📱 الجهاز: {device}\n🔖 رقم التذكرة: {ticket_no}\n📌 الحالة: {status}\n💰 التكلفة: {total_cost} ج.م\n\nشكراً لثقتكم 🙏 {tech_name}',
            invoiceNumbering: dbSettings.invoice_numbering || {
              accessory_sale: { name: 'مبيعات الإكسسوارات', prefix: 'ACC-', padding: 6, last_number: 0 },
              expense: { name: 'المصروفات', prefix: 'EXP-', padding: 6, last_number: 0 },
              purchase: { name: 'مشتريات', prefix: 'PUR-', padding: 6, last_number: 0 },
              repair: { name: 'إصلاحات', prefix: 'REP-', padding: 6, last_number: 0 },
              return: { name: 'مرتجعات', prefix: 'RET-', padding: 6, last_number: 0 },
              sale: { name: 'مبيعات الأجهزة', prefix: 'SAL-', padding: 6, last_number: 0 },
              stocktake: { name: 'جرد', prefix: 'ST-', padding: 4, last_number: 0 }
            },
            transferSettings: dbSettings.transfer_settings || {
              calculationMethod: 'per_1000',
              commissions: {
                vodafone: 10,
                etisalat: 10,
                orange: 10,
                we: 10,
                instapay: 5,
                other: 10
              }
            },
            licenseStatus: dbSettings.license_status ?? true,
            licenseExpiry: dbSettings.license_expiry || '',
            enableNotifications: dbSettings.enable_notifications ?? true,
            enableSounds: dbSettings.enable_sounds ?? true,
            taskReminders: dbSettings.task_reminders ?? true,
            salesNotifications: dbSettings.sales_notifications ?? true,
            lowStockNotifications: dbSettings.low_stock_notifications ?? true,
            lowStockAlert: dbSettings.low_stock_alert ?? true,
            lowStockThreshold: dbSettings.low_stock_threshold ?? 10,
            preventZeroStockSales: dbSettings.prevent_zero_stock_sales ?? false,
            hasBranches: dbSettings.has_branches ?? true
          });
        }
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const handleSave = async () => {
    // Check permissions
    const actCashier = JSON.parse(localStorage.getItem('active_cashier') || '{}');
    const roleLevel = actCashier?.role_level || 3;
    const isOwnerAct = localStorage.getItem('admin_active') === 'true' || roleLevel === 1;
    const specialPerms = actCashier?.permissions?.special || [];

    if (!isOwnerAct && !specialPerms.includes('تعديل الإعدادات')) {
      showToast('ليس لديك صلاحية لتعديل الإعدادات');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      
      // Always save locally first as a fallback/cache
      if (userId) {
        localStorage.setItem(`takka_settings_${userId}`, JSON.stringify(settingsData));
      } else {
        localStorage.setItem('takka_settings', JSON.stringify(settingsData));
      }
      
      if (!userId) {
          setIsSaving(false);
          setSaveMessage('تم الحفظ محلياً (لا يوجد مستخدم مسجل)');
          setTimeout(() => setSaveMessage(''), 3000);
          return;
      }

      const payload = {
          user_id: userId,
          company_name: settingsData.companyName,
          currency: settingsData.currency,
          tax_rate: parseFloat(settingsData.taxRate) || 0,
          invoice_header: settingsData.invoiceHeader,
          invoice_footer: settingsData.invoiceFooter,
          theme: settingsData.theme,
          accent_color: settingsData.accentColor,
          logo: settingsData.logo,
          date_format: settingsData.dateFormat,
          direct_print: settingsData.directPrint,
          paper_width: settingsData.paperWidth,
          receipt_font_size: settingsData.receiptFontSize,
          phone: settingsData.phone,
          address: settingsData.address,
          show_details: settingsData.showDetails,
          barcode_direct_print: settingsData.barcodeDirectPrint,
          barcode_width: settingsData.barcodeWidth,
          barcode_height: settingsData.barcodeHeight,
          barcode_font_size: settingsData.barcodeFontSize,
          maintenance_note: settingsData.maintenanceNote,
          warranty_terms: settingsData.warrantyTerms,
          maintenance_footer: settingsData.maintenanceFooter,
          app_font_size: settingsData.appFontSize,
          whatsapp_maintenance_template: settingsData.whatsappMaintenanceTemplate,
          maintenance_receipt_template: settingsData.maintenanceReceiptTemplate,
          maintenance_sticker_template: settingsData.maintenanceStickerTemplate,
          maintenance_receipt_top_header: settingsData.maintenanceReceiptTopHeader,
          sales_receipt_template: settingsData.salesReceiptTemplate,
          invoice_numbering: settingsData.invoiceNumbering,
          transfer_settings: settingsData.transferSettings,
          enable_notifications: settingsData.enableNotifications,
          enable_sounds: settingsData.enableSounds,
          task_reminders: settingsData.taskReminders,
          sales_notifications: settingsData.salesNotifications,
          low_stock_notifications: settingsData.lowStockNotifications,
          low_stock_alert: settingsData.lowStockAlert,
          low_stock_threshold: settingsData.lowStockThreshold,
          prevent_zero_stock_sales: settingsData.preventZeroStockSales,
          has_branches: settingsData.hasBranches
      };

      const method = settingsId ? 'PATCH' : 'POST';
      const url = settingsId 
          ? `${SUPABASE_URL}/rest/v1/app_settings?id=eq.${settingsId}&user_id=eq.${userId}` 
          : `${SUPABASE_URL}/rest/v1/app_settings`;

      const response = await fetch(url, {
          method,
          headers: {
              'Content-Type': 'application/json',
              'apikey': API_KEY,
              'Authorization': `Bearer ${token}`,
              'Prefer': settingsId ? '' : 'return=representation'
          },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DB Error details:', errorText);
        setSaveMessage('خطأ في قاعدة البيانات: ' + (errorText.substring(0, 50) || 'تحقق من الـ Console'));
      } else {
        if (!settingsId && response.ok) {
            const [newRecord] = await response.json();
            if (newRecord) setSettingsId(newRecord.id);
        }
        
        const userId = localStorage.getItem('user_id');
        if (userId) {
          localStorage.setItem(`takka_settings_${userId}`, JSON.stringify(settingsData));
        } else {
          localStorage.setItem('takka_settings', JSON.stringify(settingsData));
        }
        
        setSaveMessage('تم حفظ الإعدادات بنجاح');
      }

      await refreshSettings();
    } catch (err) {
      console.error('Save error', err);
      const userId = localStorage.getItem('user_id');
      // Fallback
      if (userId) {
        localStorage.setItem(`takka_settings_${userId}`, JSON.stringify(settingsData));
      } else {
        localStorage.setItem('takka_settings', JSON.stringify(settingsData));
      }
      setSaveMessage('تم الحفظ محلياً (خطأ في الاتصال)');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('logo', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (field: string, value: any) => {
    setSettingsData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 w-full min-h-[calc(100vh-8rem)] relative" dir="rtl">
      
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-0 h-fit flex flex-col z-10 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-white/10 lg:pl-12 pb-8 lg:pb-0">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">الإعدادات</h2>
          <p className="text-sm text-slate-500 font-medium mt-2">تحكم كامل في خصائص النظام</p>
        </div>

        <div className="space-y-2">
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === section.id 
                ? 'bg-white dark:bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-200 dark:border-white/10' 
                : 'hover:bg-slate-100/50 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className={`p-2.5 rounded-xl transition-colors ${activeTab === section.id ? section.bg : 'bg-slate-100 dark:bg-slate-800'}`}>
                <section.icon className={`w-5 h-5 ${activeTab === section.id ? section.color : 'text-slate-500 dark:text-slate-400'}`} />
              </div>
              <div className="text-right">
                <h3 className={`font-bold text-sm ${activeTab === section.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'} transition-colors`}>
                  {section.label}
                </h3>
                {activeTab === section.id && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-[10px] text-slate-400 font-medium mt-1 leading-tight"
                  >
                    {section.desc}
                  </motion.p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex-1 pb-32 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.3 }}
              className="h-full w-full mx-auto"
            >
              {/* --- General Settings --- */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                    {/* Right Card: Company Info */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
                        <div>
                           <h3 className="text-2xl font-black text-slate-900 dark:text-white">معلومات الشركة</h3>
                           <p className="text-base text-slate-500 mt-1">الاسم والشعار</p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                          <Building2 className="w-6 h-6 text-blue-500" />
                        </div>
                      </div>
                      
                      <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                          <label className="text-base font-bold text-slate-800 dark:text-slate-200 block mb-1">اسم الشركة</label>
                          <input 
                            type="text" 
                            placeholder="اسم الشركة"
                            value={settingsData.companyName}
                            onChange={(e) => handleChange('companyName', e.target.value)}
                            className="w-full bg-white dark:bg-[#1c232f] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-bold text-center"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-base font-bold text-slate-800 dark:text-slate-200 block mb-1">شعار الشركة (Logo)</label>
                          <div className="flex items-center gap-4">
                            {/* Logo Preview */}
                            <div className="w-24 h-24 shrink-0 bg-white dark:bg-[#1c232f] shadow-sm border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                              {settingsData.logo ? (
                                <img src={settingsData.logo} alt="شعار الشركة" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                              )}
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="relative">
                                <input 
                                  type="file" 
                                  accept="image/png, image/jpeg"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={handleLogoUpload}
                                />
                                <div className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                                  <span className="text-sm text-slate-500 font-medium truncate pr-2">
                                    {settingsData.logo ? 'تم اختيار صورة' : 'لم يتم اختيار ملف'}
                                  </span>
                                  <span className="px-3 py-1 bg-white dark:bg-[#11151c] text-sm font-bold border border-slate-200 dark:border-white/10 rounded-lg shadow-sm">
                                    اختر ملف
                                  </span>
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium text-center">PNG أو JPG (الحجم الأقصى: 2MB)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Remove / Save Buttons inside card (similar to user ref) */}
                      <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                        <button 
                          onClick={() => handleChange('logo', '')}
                          disabled={!settingsData.logo}
                          className="px-4 py-2 bg-slate-100/50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          إزالة الشعار
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Left Card: Regional Settings */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
                        <div>
                           <h3 className="text-2xl font-black text-slate-900 dark:text-white">الإعدادات الإقليمية</h3>
                           <p className="text-base text-slate-500 mt-1">العملة والتاريخ</p>
                        </div>
                        <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl">
                          <Globe className="w-6 h-6 text-cyan-500" />
                        </div>
                      </div>
                      
                      <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                          <label className="text-base font-bold text-slate-800 dark:text-slate-200 block mb-1">العملة</label>
                          <div className="relative">
                            <select 
                              value={settingsData.currency}
                              onChange={(e) => handleChange('currency', e.target.value)}
                              className="w-full bg-white dark:bg-[#1c232f] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold appearance-none text-center cursor-pointer"
                            >
                              <option value="EGP">جنيه مصري (EGP)</option>
                              <option value="SAR">ريال سعودي (SAR)</option>
                              <option value="USD">دولار أمريكي (USD)</option>
                            </select>
                            <Monitor className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-base font-bold text-slate-800 dark:text-slate-200 block mb-1">تنسيق التاريخ</label>
                          <div className="relative">
                            <select 
                              value={settingsData.dateFormat}
                              onChange={(e) => handleChange('dateFormat', e.target.value)}
                              className="w-full bg-white dark:bg-[#1c232f] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold appearance-none text-center cursor-pointer"
                            >
                              <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                              <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                              <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
                            </select>
                            <Monitor className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Features */}
                  <div className="flex flex-col mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
                      <div>
                         <h3 className="text-2xl font-black text-slate-900 dark:text-white">مميزات النظام المتقدمة</h3>
                         <p className="text-base text-slate-500 mt-1">تفعيل أو إيقاف الميزات حسب احتياجك</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                        <Monitor className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-white dark:bg-[#1c232f] border-2 border-slate-200 dark:border-[#2d3748] rounded-2xl transition-all">
                        <div className="flex flex-col font-bold">
                          <span className="text-slate-900 dark:text-white text-lg">نظام إدارة الفروع المتعددة</span>
                          <span className="text-slate-500 text-sm font-normal">يتيح لك إدارة عدة فروع بنظام محاسبي متكامل ومنفصل ولكن بقاعدة بيانات واحدة.</span>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settingsData.hasBranches ?? true} 
                            onChange={(e) => handleChange('hasBranches', e.target.checked)}
                            className="w-6 h-6 rounded text-purple-500 focus:ring-purple-500"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* --- Appearance Settings --- */}
              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-purple-500/10 rounded-2xl">
                      <Paintbrush className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white">المظهر والتفضيلات</h1>
                      <p className="text-slate-500">تخصيص ألوان وواجهة النظام لتناسبك</p>
                    </div>
                  </div>

                  <div className="space-y-12">
                    
                    {/* Theme Selector */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">وضع النظام (Theme)</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'light', icon: Sun, label: 'فاتح' },
                          { id: 'dark', icon: Moon, label: 'داكن' },
                          { id: 'system', icon: Monitor, label: 'تلقائي (حسب النظام)' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => handleChange('theme', t.id)}
                            className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                              settingsData.theme === t.id 
                              ? 'border-purple-500 bg-purple-500/5' 
                              : 'border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                            }`}
                          >
                            <t.icon className={`w-8 h-8 ${settingsData.theme === t.id ? 'text-purple-500' : 'text-slate-400'}`} />
                            <span className={`font-bold ${settingsData.theme === t.id ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'}`}>
                              {t.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">لون التمييز (Accent Color)</h3>
                      <div className="flex gap-4">
                        {[
                          { id: 'teal', color: 'bg-teal-500', ring: 'ring-teal-500' },
                          { id: 'blue', color: 'bg-blue-500', ring: 'ring-blue-500' },
                          { id: 'purple', color: 'bg-purple-500', ring: 'ring-purple-500' },
                          { id: 'emerald', color: 'bg-emerald-500', ring: 'ring-emerald-500' },
                          { id: 'rose', color: 'bg-rose-500', ring: 'ring-rose-500' },
                          { id: 'amber', color: 'bg-amber-500', ring: 'ring-amber-500' },
                        ].map(c => (
                          <button
                            key={c.id}
                            onClick={() => handleChange('accentColor', c.id)}
                            className={`w-12 h-12 rounded-full ${c.color} transition-all transform hover:scale-110 ${
                              settingsData.accentColor === c.id ? `ring-4 ring-offset-4 ring-offset-white dark:ring-offset-[#11151c] ${c.ring}` : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Font Size Selector */}
                    <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-3">
                          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg flex items-center justify-center shrink-0">
                            <Type className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">حجم الخط</h3>
                            <p className="text-xs text-slate-500 mt-1">تكبير أو تصغير خط البرنامج بالكامل</p>
                          </div>
                        </div>
                        <div className="bg-slate-100 dark:bg-black/20 px-6 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[100px]">
                           <span className="text-blue-600 dark:text-blue-400 font-black text-2xl" dir="ltr">{settingsData.appFontSize}%</span>
                           <span className="text-[10px] font-bold text-slate-500">مخصص</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-6" dir="ltr">
                        <button 
                          onClick={() => handleChange('appFontSize', Math.max(80, settingsData.appFontSize - 5))}
                          className="w-12 h-12 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 shrink-0 text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1 relative flex items-center px-4">
                           <input 
                              type="range" 
                              min="80" max="140" step="5"
                              value={settingsData.appFontSize}
                              onChange={(e) => handleChange('appFontSize', Number(e.target.value))}
                              className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                           />
                           <div className="absolute w-full flex justify-between text-[10px] text-slate-400 font-bold -bottom-6 pr-8">
                             <span>80%</span>
                             <span>100%</span>
                             <span>140%</span>
                           </div>
                        </div>

                        <button 
                          onClick={() => handleChange('appFontSize', Math.min(140, settingsData.appFontSize + 5))}
                          className="w-12 h-12 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 shrink-0 text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mt-10">
                        {[
                          { label: 'صغير 85%', val: 85 },
                          { label: 'عادي 100%', val: 100 },
                          { label: 'متوسط 115%', val: 115 },
                          { label: 'كبير 130%', val: 130 },
                        ].map(size => (
                          <button
                            key={size.val}
                            onClick={() => handleChange('appFontSize', size.val)}
                            className={`py-3 px-2 rounded-xl font-bold text-sm border transition-all ${
                              settingsData.appFontSize === size.val
                              ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                              : 'bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => handleChange('appFontSize', 100)}
                        className="w-full mt-4 py-3 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 transition-colors"
                      >
                         إعادة تعيين للحجم الافتراضي
                      </button>
                    </div>
                  
                      {(window as any).electronAPI && (
                        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 w-full flex flex-col items-center">
                          <h3 className="text-xl font-bold mb-4">النسخ الاحتياطي التلقائي (نسخة سطح المكتب)</h3>
                          <button
                            onClick={async () => {
                              const path = await (window as any).electronAPI.setBackupPath();
                              if (path) {
                                alert('تم تحديد مسار النسخ الاحتياطي بنجاح: ' + path);
                              }
                            }}
                            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                          >
                            <HardDrive className="w-5 h-5" />
                            <span>تحديد مسار الحفظ التلقائي</span>
                          </button>
                          <p className="mt-4 text-sm text-slate-500 max-w-md text-center">
                            سيتم تحديث الملف تلقائياً في نفس المكان كل يوم دون تحميل ملفات جديدة
                          </p>
                        </div>
                      )}

</div>
                </div>
              )}

              {/* --- Invoices Settings --- */}
              {activeTab === 'invoices' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl">
                      <Printer className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white">إعدادات الفواتير والطباعة</h1>
                      <p className="text-slate-500">تخصيص شكل ومحتوى الفواتير المطبوعة</p>
                    </div>
                  </div>

                  {/* 1. إعدادات الطابعة الحرارية */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                       <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                          <Receipt className="w-5 h-5 text-blue-500" />
                       </div>
                       <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-lg">إعدادات الطابعة الحرارية</h3>
                          <p className="text-xs text-slate-500 mt-1">تخصيص طباعة الفواتير</p>
                       </div>
                    </div>

                    <label className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl cursor-pointer transition-colors">
                      <div>
                        <span className="font-bold text-sm text-slate-800 dark:text-emerald-100 block mb-1 flex items-center gap-2">
                           <span className="text-lg">🚀</span> طباعة مباشرة (بدون نافذة الويندوز)
                        </span>
                        <span className="text-xs text-slate-500 dark:text-emerald-200/50">الفاتورة تنطبع على طول لما تدوس طباعة - بدون ما تظهر نافذة اختيار الطابعة</span>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${settingsData.directPrint ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full shadow-md absolute transition-all ${settingsData.directPrint ? 'left-1' : 'right-1'}`} />
                         <input type="checkbox" className="hidden" checked={settingsData.directPrint} onChange={(e) => handleChange('directPrint', e.target.checked)} />
                      </div>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">عرض الورقة</label>
                        <select 
                          value={settingsData.paperWidth}
                          onChange={(e) => handleChange('paperWidth', e.target.value)}
                          className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                        >
                          <option value="80mm">80mm (قياسي)</option>
                          <option value="58mm">58mm (صغير)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">حجم الخط</label>
                        <div className="relative">
                          <input 
                            type="number"
                            value={parseInt(settingsData.receiptFontSize) || 100}
                            onChange={(e) => handleChange('receiptFontSize', `${e.target.value}%`)}
                            className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold focus:border-blue-500 transition-colors"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                        </div>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">قالب إيصال الاستلام</label>
                        <select 
                          value={settingsData.maintenanceReceiptTemplate}
                          onChange={(e) => handleChange('maintenanceReceiptTemplate', e.target.value)}
                          className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                        >
                          <option value="default">الافتراضي (عادي)</option>
                          <option value="detailed">المفصل (جدول)</option>
                          <option value="second_detailed">المفصل 2 (أيقونات)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-100 dark:border-[#2d3748]">
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">قالب طباعة الباركود/الاستيكر</label>
                        <select 
                          value={settingsData.maintenanceStickerTemplate || 'default'}
                          onChange={(e) => handleChange('maintenanceStickerTemplate', e.target.value)}
                          className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                        >
                          <option value="default">الافتراضي (بسيط)</option>
                          <option value="first">الشكل الأول (نص متجاوب)</option>
                          <option value="seconde">الشكل الثاني (تقسيم 58/42)</option>
                          <option value="third">الشكل الثالث (محاذاة وأيقونات)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-100 dark:border-[#2d3748]">
                      <div className="space-y-2 col-span-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">قالب فاتورة المبيعات</label>
                        <select 
                          value={settingsData.salesReceiptTemplate || 'default'}
                          onChange={(e) => handleChange('salesReceiptTemplate', e.target.value)}
                          className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                        >
                          <option value="default">الافتراضي (كلاسيك أسود)</option>
                          <option value="first">الشكل الأول (ذهبي مع ريبون)</option>
                          <option value="seconde">الشكل الثاني (ذهبي مع لوجو)</option>
                          <option value="third">الشكل الثالث (نيفي بلو)</option>
                          <option value="fourth">الشكل الرابع (عمودين)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">رقم الهاتف (يظهر على الفاتورة)</label>
                      <input 
                        type="text" 
                        placeholder="01xxxxxxxxx"
                        value={settingsData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold placeholder-slate-400 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">العنوان (يظهر على الفاتورة)</label>
                      <input 
                        type="text" 
                        placeholder="المحل - الشارع - المدينة"
                        value={settingsData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold placeholder-slate-400 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">رسالة ترحيب الفاتورة</label>
                      <input 
                        type="text" 
                        placeholder="مرحباً بكم في محلاتنا"
                        value={settingsData.invoiceHeader}
                        onChange={(e) => handleChange('invoiceHeader', e.target.value)}
                        className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold placeholder-slate-400 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">رسالة نهاية الفاتورة</label>
                      <input 
                        type="text" 
                        placeholder="شكراً لتعاملكم معنا"
                        value={settingsData.invoiceFooter}
                        onChange={(e) => handleChange('invoiceFooter', e.target.value)}
                        className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold placeholder-slate-400 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl cursor-pointer">
                      <div>
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300 block mb-1">إظهار تفاصيل الأصناف</span>
                        <span className="text-xs text-slate-500">عرض اللون، IMEI، الملحقات في الفاتورة</span>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${settingsData.showDetails ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full shadow-md absolute transition-all ${settingsData.showDetails ? 'left-1' : 'right-1'}`} />
                         <input type="checkbox" className="hidden" checked={settingsData.showDetails} onChange={(e) => handleChange('showDetails', e.target.checked)} />
                      </div>
                    </label>

                    <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-white/5">
                      <button className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                        <Printer className="w-5 h-5" />
                        طباعة تجريبية
                      </button>
                      <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        حفظ إعدادات الطابعة
                      </button>
                    </div>
                  </div>

                  {/* 2. إعدادات طابعة الباركود */}
                  <div className="space-y-6 pt-10 mt-10 border-t border-slate-200 dark:border-white/5">
                     <div className="flex gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-4 items-center">
                       <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                          <Tag className="w-5 h-5 text-amber-500" />
                       </div>
                       <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-lg">إعدادات طابعة الباركود</h3>
                          <p className="text-xs text-slate-500 mt-1">تخصيص طباعة ملصقات الباركود</p>
                       </div>
                     </div>

                    <label className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-2xl cursor-pointer transition-colors">
                      <div>
                        <span className="font-bold text-sm text-slate-800 dark:text-purple-100 block mb-1 flex items-center gap-2">
                           <span className="text-lg">🚀</span> طباعة باركود مباشرة
                        </span>
                        <span className="text-xs text-slate-500 dark:text-purple-200/50">طباعة الملصقات على طول بدون نافذة الويندوز</span>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${settingsData.barcodeDirectPrint ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full shadow-md absolute transition-all ${settingsData.barcodeDirectPrint ? 'left-1' : 'right-1'}`} />
                         <input type="checkbox" className="hidden" checked={settingsData.barcodeDirectPrint} onChange={(e) => handleChange('barcodeDirectPrint', e.target.checked)} />
                      </div>
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">عرض الباركود</label>
                        <select 
                          value={settingsData.barcodeWidth}
                          onChange={(e) => handleChange('barcodeWidth', e.target.value)}
                          className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                        >
                          <option value="40mm">40mm</option>
                          <option value="50mm">50mm (افتراضي)</option>
                          <option value="60mm">60mm</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ارتفاع الباركود</label>
                        <select 
                          value={settingsData.barcodeHeight}
                          onChange={(e) => handleChange('barcodeHeight', e.target.value)}
                          className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                        >
                          <option value="25mm">25mm</option>
                          <option value="30mm">30mm (افتراضي)</option>
                          <option value="40mm">40mm</option>
                          <option value="50mm">50mm</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">حجم خط الباركود</label>
                        <select 
                          value={settingsData.barcodeFontSize}
                          onChange={(e) => handleChange('barcodeFontSize', e.target.value)}
                          className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                        >
                          <option value="9px">صغير جدًا</option>
                          <option value="10px">صغير</option>
                          <option value="12px">متوسط (افتراضي)</option>
                          <option value="14px">كبير</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">اتجاه الطباعة</label>
                        <select 
                          value={settingsData.barcodeRotation ? 'true' : 'false'}
                          onChange={(e) => handleChange('barcodeRotation', e.target.value === 'true')}
                          className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                        >
                          <option value="false">طبيعي (Landscape)</option>
                          <option value="true">تدوير لملائمة اللفة (Portrait)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] rounded-2xl cursor-pointer hover:border-blue-500 transition-all shadow-sm" onClick={() => handleChange('showBarcodeOnSticker', !settingsData.showBarcodeOnSticker)}>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 dark:text-white cursor-pointer">طباعة باركود في استيكر الصيانة</label>
                          <p className="text-xs text-slate-500">ملاحظة: تظهر هذه الخيارات باركود التذكرة ليسهل البحث عنها بعد الطباعة.</p>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settingsData.showBarcodeOnSticker ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settingsData.showBarcodeOnSticker ? 'translate-x-[24px]' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. إعدادات فواتير الصيانة */}
                  <div className="space-y-6 pt-10 mt-10 border-t border-slate-200 dark:border-white/5">
                     <div className="flex gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-4 items-center">
                       <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg">
                          <Wrench className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                       </div>
                       <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-lg">إعدادات فواتير الصيانة</h3>
                          <p className="text-xs text-slate-500 mt-1">تخصيص إيصالات الاستلام وفواتير الصيانة</p>
                       </div>
                     </div>

                     <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ملاحظة إيصال الاستلام</label>
                      <textarea 
                        value={settingsData.maintenanceNote}
                        onChange={(e) => handleChange('maintenanceNote', e.target.value)}
                        rows={2}
                        className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-[2rem] px-6 py-5 text-slate-900 dark:text-white outline-none font-bold resize-none placeholder-slate-400 focus:border-blue-500 transition-colors"
                        placeholder="يرجى الاحتفاظ بهذا الإيصال..."
                      />
                      <p className="text-xs text-slate-500">النص الذي يظهر في كل إيصالات الاستلام (اتركه فارغاً للنص الافتراضي)</p>
                    </div>

                    <div className="space-y-3 mt-4">
                      <label className="text-base font-bold text-slate-800 dark:text-slate-200 block mb-1">شروط وأحكام الضمان</label>
                      <textarea 
                        value={settingsData.warrantyTerms}
                        onChange={(e) => handleChange('warrantyTerms', e.target.value)}
                        rows={2}
                        className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-[2rem] px-6 py-5 text-slate-900 dark:text-white outline-none font-bold resize-none placeholder-slate-400 focus:border-blue-500 transition-colors"
                        placeholder="مثال: الضمان لا يشمل كسر الشاشة أو دخول المياه"
                      />
                      <p className="text-base text-slate-500 mt-1">يظهر في فاتورة الصيانة بعد مدة الضمان</p>
                    </div>

                    <div className="space-y-3 mt-4">
                      <label className="text-base font-bold text-slate-800 dark:text-slate-200 block mb-1">ترويسة إيصال الصيانة (السطر العلوي)</label>
                      <textarea 
                        value={settingsData.maintenanceReceiptTopHeader}
                        onChange={(e) => handleChange('maintenanceReceiptTopHeader', e.target.value)}
                        className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold placeholder-slate-400 focus:border-blue-500 transition-colors resize-none"
                        rows={3}
                        placeholder="افضل خدمه\nافضل جوده\nافضل سعر"
                      />
                    </div>

                    <div className="space-y-3 mt-4">
                      <label className="text-base font-bold text-slate-800 dark:text-slate-200 block mb-1">رسالة نهاية فاتورة الصيانة</label>
                      <input 
                        type="text" 
                        value={settingsData.maintenanceFooter}
                        onChange={(e) => handleChange('maintenanceFooter', e.target.value)}
                        className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none font-bold placeholder-slate-400 focus:border-blue-500 transition-colors"
                        placeholder="شكراً لثقتكم — نتمنى لكم خدمة مميزة"
                      />
                      <p className="text-base text-slate-500 mt-1">اتركه فارغاً لاستخدام الرسالة العامة</p>
                    </div>
                  </div>

                </div>
              )}

              {/* --- Danger Zone --- */}
              {activeTab === 'danger' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-red-500/10 rounded-2xl relative">
                      <div className="absolute inset-0 bg-red-500/20 blur animate-pulse rounded-2xl" />
                      <ShieldAlert className="w-8 h-8 text-red-500 relative z-10" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-red-500">المنطقة الخطرة</h1>
                      <p className="text-red-400">تحذير: الإجراءات هنا لا يمكن التراجع عنها بسهولة</p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-4 border-t border-red-200 dark:border-red-900/50">
                    <div className="flex items-center justify-between pb-6 border-b border-red-200 dark:border-red-900/50">
                      <div>
                        <h3 className="font-black text-red-700 dark:text-red-400 text-lg">تصفير المبيعات وحذف الفواتير</h3>
                        <p className="text-red-600 dark:text-red-300/70 text-sm mt-1">مسح جميع بيانات فواتير البيع والمرتجعات نهائياً</p>
                      </div>
                      <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                        تصفير المبيعات
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-red-700 dark:text-red-400 text-lg">إعادة ضبط المصنع بالكامل</h3>
                        <p className="text-red-600 dark:text-red-300/70 text-sm mt-1">حذف كافة البيانات (مخازن، مبيعات، موظفين، شركاء) والبدء من جديد</p>
                      </div>
                      <button className="px-6 py-3 bg-red-900 hover:bg-red-950 text-red-100 font-bold rounded-xl transition-colors">
                        ضبط المصنع
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- Transfers Settings --- */}
              {activeTab === 'transfers' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="p-4 bg-indigo-500/10 rounded-2xl">
                        <ArrowRightLeft className="w-8 h-8 text-indigo-500" />
                     </div>
                     <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">إعدادات التحويلات</h1>
                        <p className="text-slate-500 font-medium mt-1">عمولات خدمات تحويل الأموال (فودافون كاش، اتصالات كاش، إلخ)</p>
                     </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#11151c] rounded-2xl border border-slate-200 dark:border-white/5 p-8 shadow-sm">
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">طريقة حساب العمولة</label>
                           <select 
                              value={(settingsData.transferSettings as any)?.calculationMethod || 'per_1000'}
                              onChange={(e) => handleChange('transferSettings', { ...settingsData.transferSettings, calculationMethod: e.target.value })}
                              className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500/50 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;utf8,<svg width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')] bg-[position:left_1rem_center]"
                           >
                              <option value="per_1000">لكل 1000 ج.م</option>
                           </select>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                           {[
                              { id: 'vodafone', label: 'فودافون كاش 📱' },
                              { id: 'etisalat', label: 'اتصالات كاش 🟢' },
                              { id: 'orange', label: 'اورنج كاش 🟠' },
                              { id: 'we', label: 'وي باي 🟣' },
                              { id: 'instapay', label: 'انستاباي 🏦' },
                              { id: 'other', label: 'أخرى 💫' },
                           ].map(provider => (
                              <div key={provider.id} className="space-y-3">
                                 <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-center whitespace-nowrap overflow-hidden text-ellipsis px-1">{provider.label}</label>
                                 <input 
                                    type="number"
                                    value={(settingsData.transferSettings as any)?.commissions?.[provider.id] ?? 10}
                                    onChange={(e) => {
                                       const val = parseFloat(e.target.value) || 0;
                                       handleChange('transferSettings', {
                                          ...settingsData.transferSettings,
                                          commissions: {
                                             ...((settingsData.transferSettings as any)?.commissions || {}),
                                             [provider.id]: val
                                          }
                                       });
                                    }}
                                    className="w-full bg-white dark:bg-[#080c13] border border-slate-200 dark:border-white/10 rounded-xl px-2 py-4 text-center text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                 />
                              </div>
                           ))}
                        </div>

                        <div className="flex justify-end pt-8">
                           <button 
                              onClick={handleSave}
                              disabled={isSaving}
                              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                           >
                              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                              {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات التحويلات 💾'}
                           </button>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* --- Future Tabs Stub --- */}
              {activeTab === 'wallets' && (
                <div className="w-[calc(100%+5rem)] h-[calc(100%+5rem)] -mx-10 -my-10">
                  <ManageWalletsModal isOpen={true} onClose={() => {}} inlineMode={true} />
                </div>
              )}
              {activeTab === 'notifications' && (
                <div className="space-y-6 max-w-6xl mx-auto pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative items-start">
                        {/* Right Card (Inventory Settings) */}
                        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col items-center flex-1 h-full relative">
                            <div className="flex flex-col items-center text-center space-y-4 mb-8 w-full border-b border-slate-100 dark:border-white/5 pb-6">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                                    <Box className="w-8 h-8 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white">إعدادات المخزون</h2>
                                    <p className="text-sm font-medium text-slate-500 mt-1">تنبيهات وحدود البيع</p>
                                </div>
                            </div>
                            
                            <div className="w-full space-y-4 flex-1">
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">تنبيه المخزون المنخفض</p>
                                        <p className="text-xs text-slate-500">إشعار عند انخفاض المخزون عن الحد</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            playSound('pop');
                                            handleChange('lowStockAlert', !settingsData.lowStockAlert);
                                        }}
                                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${settingsData.lowStockAlert ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settingsData.lowStockAlert ? '-translate-x-1' : '-translate-x-8'}`} />
                                    </button>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col justify-center">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-1 shrink-0">حد تنبيه المخزون</p>
                                        <input
                                            type="number"
                                            value={settingsData.lowStockThreshold}
                                            onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                                            className="w-20 text-center bg-transparent border-0 outline-none text-lg font-mono font-bold"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-start">سيتم التنبيه عندما يقل المخزون عن هذا الحد</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">منع البيع بدون مخزون</p>
                                        <p className="text-xs text-slate-500">لا يمكن بيع صنف كميته صفر</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            playSound('pop');
                                            handleChange('preventZeroStockSales', !settingsData.preventZeroStockSales);
                                        }}
                                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${settingsData.preventZeroStockSales ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settingsData.preventZeroStockSales ? '-translate-x-1' : '-translate-x-8'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Left Card (Notifications Settings) */}
                        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col items-center flex-1 h-full relative">
                            <div className="flex flex-col items-center text-center space-y-4 mb-8 w-full border-b border-slate-100 dark:border-white/5 pb-6">
                                <div className="w-16 h-16 bg-pink-50 dark:bg-pink-500/10 rounded-2xl flex items-center justify-center border border-pink-100 dark:border-pink-500/20">
                                    <BellRing className="w-8 h-8 text-pink-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white">إعدادات الإشعارات</h2>
                                    <p className="text-sm font-medium text-slate-500 mt-1">التحكم في التنبيهات</p>
                                </div>
                            </div>
                            
                            <div className="w-full space-y-4 flex-1">
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">تفعيل الإشعارات</p>
                                        <p className="text-xs text-slate-500">إظهار إشعارات النظام</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            playSound('pop');
                                            handleChange('enableNotifications', !settingsData.enableNotifications);
                                        }}
                                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${settingsData.enableNotifications ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settingsData.enableNotifications ? '-translate-x-1' : '-translate-x-8'}`} />
                                    </button>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">الأصوات</p>
                                        <p className="text-xs text-slate-500">تشغيل أصوات التنبيهات</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleChange('enableSounds', !settingsData.enableSounds);
                                            // Play sound using new settings if toggling on
                                            if (!settingsData.enableSounds) {
                                                try {
                                                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                                    const oscillator = audioCtx.createOscillator();
                                                    const gainNode = audioCtx.createGain();
                                                    oscillator.connect(gainNode);
                                                    gainNode.connect(audioCtx.destination);
                                                    oscillator.type = 'sine';
                                                    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
                                                    oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
                                                    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                                                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                                                    oscillator.start(audioCtx.currentTime);
                                                    oscillator.stop(audioCtx.currentTime + 0.1);
                                                } catch(e) {}
                                            }
                                        }}
                                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${settingsData.enableSounds ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settingsData.enableSounds ? '-translate-x-1' : '-translate-x-8'}`} />
                                    </button>
                                </div>

                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">تنبيهات التذكيرات</p>
                                        <p className="text-xs text-slate-500">إشعارات المتعلقات والمهام</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            playSound('pop');
                                            handleChange('taskReminders', !settingsData.taskReminders);
                                        }}
                                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${settingsData.taskReminders ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settingsData.taskReminders ? '-translate-x-1' : '-translate-x-8'}`} />
                                    </button>
                                </div>

                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">تنبيهات المبيعات</p>
                                        <p className="text-xs text-slate-500">إشعار عند إتمام عملية بيع</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            playSound('pop');
                                            handleChange('salesNotifications', !settingsData.salesNotifications);
                                        }}
                                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${settingsData.salesNotifications ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settingsData.salesNotifications ? '-translate-x-1' : '-translate-x-8'}`} />
                                    </button>
                                </div>

                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">تنبيهات المخزون</p>
                                        <p className="text-xs text-slate-500">إشعار المخزون المنخفض</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            playSound('pop');
                                            handleChange('lowStockNotifications', !settingsData.lowStockNotifications);
                                        }}
                                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${settingsData.lowStockNotifications ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settingsData.lowStockNotifications ? '-translate-x-1' : '-translate-x-8'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 mb-24 lg:mb-10 lg:pl-10">
                        <button 
                            onClick={() => {
                                playSound('ting');
                                handleSave().then(() => showToast('تم حفظ التنبيهات بنجاح'));
                            }}
                            disabled={isSaving}
                            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات التنبيهات 💾'}
                        </button>
                    </div>
                </div>
              )}

              {activeTab === 'backup' && (
                <div className="space-y-6 max-w-5xl mx-auto h-full pb-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-orange-500/10 rounded-2xl">
                      <DatabaseBackup className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white">النسخ الاحتياطي</h1>
                      <p className="text-slate-500">حفظ نسخة من جميع بياناتك في ملف محلي للرجوع إليها</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-8 lg:p-12 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
                      <div className="w-24 h-24 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                        <HardDrive className="w-10 h-10 text-orange-500" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">أخذ نسخة احتياطية</h2>
                      <p className="text-slate-500 mb-8 max-w-md">
                        يقوم هذا الخيار بتحميل جميع الجداول والبيانات الخاصة بك من قاعدة البيانات بصيغة ملف محلي (.db).
                      </p>

                      <button
                        onClick={async () => {
                          const btn = document.getElementById('backup_btn');
                          if (btn) btn.setAttribute('disabled', 'true');
                          const progressText = document.getElementById('backup_progress');
                          if (progressText) progressText.innerText = 'جاري تهيئة النسخة الاحتياطية... 0%';
                          
                          try {
                            const tables = [
                              'Accessories', 'Blacklist', 'Devices', 'Reminders', 'Repairs',
                              'Sales_Invoices', 'Sales_Items', 'Sales_Returns', 'Warehouses',
                              'app_settings', 'app_users', 'app_users_backup', 'attendance',
                              'branch_manager_permissions', 'branch_transfers', 'branches',
                              'cash_flow_forecast', 'cash_flow_forecast_view', 'client_blacklist', 'clients',
                              'crm_logs', 'cron_health_log', 'cross_branch_settlements', 'employee_leaves',
                              'employee_loans', 'employee_points', 'employees', 'feature_flags',
                              'installment_audit_logs', 'installment_contracts', 'installment_dashboard_summary',
                              'installment_partial_payments', 'installment_payments', 'ledger_entries',
                              'money_transfers', 'partner_transactions', 'partners', 'payment_requests',
                              'repair_logs', 'salary_payments', 'sensitive_actions_report', 'shifts',
                              'spare_parts', 'store_inventories', 'store_inventory_items', 'suppliers',
                              'system_alerts', 'transfers', 'treasury_transactions', 'v_branch_tree',
                              'vw_branch_pnl', 'wallets',

                              // Legacy tables just in case
                              'sales', 'sales_items', 'purchases', 'purchase_items', 'transactions',
                              'Installment_Settings', 'shift_closures', 'Installment_Payments',
                              'Installment_AuditLogs', 'salaries', 'expenses'
                            ];
                            const backupData: any = {};
                            const token = localStorage.getItem('access_token');
                            const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
                            const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';

                            for (let i = 0; i < tables.length; i++) {
                              const table = tables[i];
                              if (progressText) progressText.innerText = `جاري تجهيز النسخة الاحتياطية... ${Math.floor((i / tables.length) * 100)}%`;
                              const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');

                              let fetchUrl = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=10000&tenant_id=eq.${tenantId}`;
                              let response = await fetch(fetchUrl, {
                                headers: {
                                  'apikey': API_KEY,
                                  'Authorization': `Bearer ${token}`
                                }
                              });

                              if (!response.ok && response.status === 400) {
                                // Fallback to user_id
                                fetchUrl = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=10000&user_id=eq.${tenantId}`;
                                response = await fetch(fetchUrl, {
                                  headers: {
                                    'apikey': API_KEY,
                                    'Authorization': `Bearer ${token}`
                                  }
                                });
                                
                                if (!response.ok && response.status === 400) {
                                  // Fallback to no filter
                                  fetchUrl = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=10000`;
                                  response = await fetch(fetchUrl, {
                                    headers: {
                                      'apikey': API_KEY,
                                      'Authorization': `Bearer ${token}`
                                    }
                                  });
                                }
                              }

                              if (response.ok) {
                                const rows = await response.json();
                                if (rows && rows.length > 0) {
                                  backupData[table] = rows;
                                }
                              }
                            }
                            
                            if (progressText) progressText.innerText = 'جاري حفظ النسخة الاحتياطية... 100%';
                            const data = JSON.stringify(backupData, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Takka_Backup_${new Date().toISOString().split('T')[0]}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            
                            setTimeout(() => {
                              if (progressText) progressText.innerText = 'تم التحميل بنجاح ✔️';
                            }, 1000);
                          } catch (e) {
                            console.error(e);
                            if (progressText) progressText.innerText = 'فشل النسخ الاحتياطي';
                          } finally {
                            if (btn) btn.removeAttribute('disabled');
                          }
                        }}
                        id="backup_btn"
                        className="px-8 py-4 bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:ring-orange-500/20 text-white font-black rounded-2xl shadow-lg shadow-orange-500/30 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <DatabaseBackup className="w-6 h-6" />
                        <span>تنزيل النسخة الاحتياطية</span>
                      </button>
                      <div id="backup_progress" className="mt-4 text-sm font-bold text-orange-500 h-6"></div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6 max-w-5xl mx-auto h-full pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        {/* Right Card (App Info) */}
                        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-8 lg:p-12 shadow-sm flex flex-col items-center text-center relative overflow-hidden h-full">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary-500/10 to-transparent pointer-events-none"></div>
                            
                            <div className="w-24 h-24 bg-slate-900 rounded-3xl shadow-xl flex items-center justify-center mb-6 relative z-10 border border-slate-800 overflow-hidden text-center bg-gradient-to-br from-[#0B2528] to-[#123A3E]">
                               <div className="flex flex-col items-center pb-1">
                                  <span className="text-[2.5rem] leading-none font-black text-[#d4af37] drop-shadow-md tracking-tighter" style={{ fontFamily: 'sans-serif' }}>
                                      T<span className="text-[#c19b28] -ml-2">K</span>
                                  </span>
                               </div>
                            </div>
                            
                            <h2 className="text-3xl lg:text-4xl font-black text-primary-600 dark:text-primary-400 mb-3 relative z-10 tracking-tight">TAKKA <span className="text-[#d4af37]">تكّة</span></h2>
                            <h3 className="text-sm font-bold text-[#d4af37] uppercase tracking-[0.2em] mb-4 relative z-10">Accounting System</h3>
                            <p className="text-sm text-slate-500 mb-6 relative z-10 px-4">النظام الشامل لإدارة المبيعات، الصيانة، والمخزون بذكاء</p>
                            
                            <div className="w-full grid grid-cols-2 gap-4 mt-auto relative z-10">
                                <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <p className="text-xs text-slate-500 mb-1">نوع الاستخدام</p>
                                    <p className={`font-bold ${subData?.valid ?? settingsData.licenseStatus ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                        {subData?.valid ?? settingsData.licenseStatus ? 'تجاري' : 'مجاني/منتهي'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <p className="text-xs text-slate-500 mb-1">تاريخ الانتهاء</p>
                                    <p className={`font-bold text-slate-800 dark:text-slate-200`}>
                                        {subData ? (
                                            subData.valid 
                                                ? new Date(new Date(subData.server_now).getTime() + (subData.days_left * 24 * 60 * 60 * 1000)).toLocaleDateString('ar-EG')
                                                : 'منتهي'
                                        ) : (settingsData.licenseStatus && settingsData.licenseExpiry 
                                            ? new Date(settingsData.licenseExpiry).toLocaleDateString('ar-EG') 
                                            : 'غير محدد')}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4 mt-4 relative z-10">
                                <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <p className="text-xs text-slate-500 mb-1">تواصل مع الدعم الفني</p>
                                    <a href="https://wa.me/201037230660" target="_blank" rel="noreferrer" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline inline-flex items-center gap-1" style={{ direction: 'ltr' }}>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 fill-current text-green-500" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                      +201037230660
                                    </a>
                                </div>
                                <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <p className="text-xs text-slate-500 mb-1">نسخة النظام</p>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">v3.1.4</p>
                                </div>
                            </div>
                        </div>

                        {/* Left Card (Support Info) */}
                        <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl p-8 lg:p-12 shadow-sm h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-white/5 shrink-0">
                                <div className="text-start">
                                    <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-1">الدعم الفني</h2>
                                    <p className="text-sm text-slate-500">تواصل معنا للمساعدة والاستفسارات</p>
                                </div>
                                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-500/10 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ms-4">
                                    <Wrench className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                                </div>
                            </div>

                            <div className="space-y-5 flex-1 flex flex-col">
                                <a href="https://wa.me/201037230660" target="_blank" rel="noopener noreferrer" className="block group">
                                    <div className="p-6 bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl transition-all group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-emerald-500/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse relative before:content-[''] before:absolute before:-inset-1 before:rounded-full before:bg-emerald-500/30 before:animate-ping"></div>
                                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">واتساب الدعم الفني</span>
                                            </div>
                                            <Smartphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="flex items-end justify-between mt-6">
                                            <p className="text-3xl font-black text-slate-800 dark:text-slate-200 tracking-wider" dir="ltr">+20 1037230660</p>
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold group-hover:underline">اضغط للفتح في واتساب &larr;</span>
                                        </div>
                                    </div>
                                </a>

                                <a href="http://takka.fun" target="_blank" rel="noopener noreferrer" className="block group">
                                    <div className="p-5 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-2xl transition-all group-hover:scale-[1.02] flex items-center justify-between">
                                        <p className="text-xl font-bold text-slate-800 dark:text-slate-200" dir="ltr">takka.fun</p>
                                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 px-3 py-1.5 rounded-xl">
                                            <span className="text-xs font-bold">الموقع الإلكتروني</span>
                                            <Globe className="w-4 h-4" />
                                        </div>
                                    </div>
                                </a>

                                <div className="p-5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl text-center mt-auto">
                                    <p className="text-xs text-slate-500 mb-1">ساعات العمل</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">طوال أيام الأسبوع - 24 ساعة</p>
                                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">الدعم متاح طوال الوقت</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* License Banner */}
                    <div className={`rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between text-center sm:text-start shadow-sm mt-4 border ${subData?.valid ?? settingsData.licenseStatus ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : 'bg-orange-50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20'}`}>
                        <div className="mb-4 sm:mb-0">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">حالة الترخيص</p>
                            {subData?.valid ?? settingsData.licenseStatus ? (
                                <div>
                                    <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-2">
                                        مفعل <CheckCircle2 className="w-5 h-5 mb-1" />
                                    </h2>
                                    {(subData?.valid || settingsData.licenseExpiry) && (
                                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-500 mt-2">
                                            صالح حتى: {subData 
                                                ? new Date(new Date(subData.server_now).getTime() + (subData.days_left * 24 * 60 * 60 * 1000)).toLocaleDateString('ar-EG')
                                                : new Date(settingsData.licenseExpiry).toLocaleDateString('ar-EG')}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-2xl font-black text-orange-600 dark:text-orange-400 flex items-center justify-center sm:justify-start gap-2">
                                        غير مفعل <AlertTriangle className="w-5 h-5 mb-1" />
                                    </h2>
                                    <p className="text-sm font-medium text-orange-700 dark:text-orange-500 mt-2">يرجى التواصل مع الدعم لتجديد الباقة</p>
                                </div>
                            )}
                        </div>
                        <div className={`px-6 py-2.5 font-bold rounded-xl text-sm ${subData?.valid ?? settingsData.licenseStatus ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400'}`}>
                            {subData?.valid ?? settingsData.licenseStatus ? 'الخدمة نشطة' : 'تفعيل الترخيص'}
                        </div>
                    </div>
                </div>
              )}

              {/* --- Invoice Numbering Tab --- */}
              {activeTab === 'invoice_numbering' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-4 bg-teal-500/10 rounded-2xl">
                      <Type className="w-8 h-8 text-teal-500" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white">أرقام الفواتير ورسائل واتساب</h1>
                      <p className="text-slate-500">تخصيص البادئات وتسلسل أرقام النماذج المختلفة</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-6">
                    {/* Left Column: WhatsApp Template */}
                    <div className="space-y-6 h-fit xl:sticky xl:top-8 pt-4">
                      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                        <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
                          <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-lg">قالب رسالة واتساب - الصيانة</h3>
                          <p className="text-xs text-slate-500 mt-1">تخصيص رسالة تحديث حالة الجهاز المرسلة للعميل</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">المتغيرات المتاحة <span className="font-normal text-xs text-slate-400">(انسخ والصق في القالب)</span></label>
                        <div className="flex flex-wrap gap-2">
                          {['{customer_name}', '{ticket_no}', '{device_brand}', '{device}', '{company_name}', '{total_cost}', '{status}', '{device_model}', '{issue}', '{paid}', '{remaining}', '{date}', '{tech_name}'].map(variable => (
                            <button
                              key={variable}
                              onClick={() => {
                                // Add to template at cursor or end
                                const newTemplate = settingsData.whatsappMaintenanceTemplate + variable;
                                handleChange('whatsappMaintenanceTemplate', newTemplate);
                              }}
                              className="px-3 py-1.5 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 hover:bg-green-100 hover:scale-105 transition-all outline-none rounded-lg text-sm font-mono"
                            >
                              {variable}
                            </button>
                          ))}
                        </div>
                        
                        <label className="text-base font-bold text-slate-800 dark:text-slate-200 block mt-6 mb-1">قالب الرسالة</label>
                        <textarea
                          value={settingsData.whatsappMaintenanceTemplate}
                          onChange={(e) => handleChange('whatsappMaintenanceTemplate', e.target.value)}
                          rows={8}
                          dir="rtl"
                          className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-[2rem] px-6 py-5 text-slate-900 dark:text-white outline-none font-medium resize-y placeholder-slate-400 focus:border-green-500 transition-colors"
                          placeholder="اكتب قالب رسالة الواتس اب هنا..."
                        />
                        <p className="text-xs text-slate-500 text-center">اضغط على أي متغير بالأعلى لإضافته في موضع المؤشر</p>
                        
                        <div className="mt-8">
                           <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">معاينة الرسالة</label>
                           <div className="bg-green-50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/20 p-5 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                             {settingsData.whatsappMaintenanceTemplate
                                .replace(/{customer_name}/g, 'أحمد محمد')
                                .replace(/{ticket_no}/g, 'R-202603-000019')
                                .replace(/{device_brand}/g, 'Samsung')
                                .replace(/{device}/g, 'Samsung A54')
                                .replace(/{company_name}/g, settingsData.companyName || 'ELOS')
                                .replace(/{total_cost}/g, '500')
                                .replace(/{status}/g, 'جاهز للتسليم')
                                .replace(/{device_model}/g, 'A54')
                                .replace(/{issue}/g, 'الشاشة مكسورة')
                                .replace(/{paid}/g, '200')
                                .replace(/{remaining}/g, '300')
                                .replace(/{date}/g, new Date().toLocaleDateString('ar-EG'))
                                .replace(/{tech_name}/g, 'محمد')
                             }
                           </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5 disabled-group">
                           <button 
                             onClick={() => {
                               if (window.confirm('هل أنت متأكد من استعادة القالب الافتراضي؟')) {
                                   handleChange('whatsappMaintenanceTemplate', defaultSettings.whatsappMaintenanceTemplate);
                               }
                             }}
                             className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                           >
                              <RefreshCcw className="w-4 h-4" /> استعادة الافتراضي
                           </button>
                           <button 
                              onClick={handleSave}
                              className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                           >
                              حفظ القالب 💾
                           </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Invoice Numbering Types */}
                    <div className="space-y-6">
                      <div className="mb-8 border-b border-slate-200 dark:border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                              <span className="text-lg">🔢</span>
                           </div>
                           <div>
                              <h3 className="font-black text-slate-900 dark:text-white text-2xl">إعدادات أرقام الفواتير</h3>
                              <p className="text-base text-slate-500 mt-1">تخصيص الـ Prefix و Padding لكل نوع فاتورة</p>
                           </div>
                        </div>
                      </div>

                      {Object.entries(settingsData.invoiceNumbering as Record<string, {name: string, prefix: string, padding: number, last_number: number}>).map(([key, config]) => {
                        const paddedLastNumber = String((config.last_number || 0) + 1).padStart(config.padding, '0');
                        const examplePreview = `${config.prefix}${paddedLastNumber}`;
                        
                        return (
                          <div key={key} className="bg-slate-50 dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4 relative group hover:border-teal-200 dark:hover:border-teal-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                              <div className="text-left" dir="ltr">
                                  <h4 className="font-bold text-slate-800 dark:text-slate-100">{key}</h4>
                                  <p className="text-base text-slate-500 mt-1">النوع: {key} • آخر رقم: {config.last_number}</p>
                              </div>
                              <h4 className="font-black text-slate-900 dark:text-white text-xl">{config.name}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-3">
                                <label className="text-base font-bold text-slate-800 dark:text-slate-200 block mb-1">Padding (عدد الأرقام)</label>
                                <input 
                                  type="number" min="3" max="10"
                                  value={config.padding}
                                  onChange={(e) => {
                                      const val = parseInt(e.target.value) || 3;
                                      handleChange('invoiceNumbering', {
                                          ...settingsData.invoiceNumbering,
                                          [key]: { ...config, padding: val }
                                      });
                                  }}
                                  className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-teal-500 text-center text-lg font-mono placeholder-slate-400 transition-colors"
                                />
                               </div>
                               
                               <div className="space-y-3">
                                <label className="text-base font-bold text-slate-800 dark:text-slate-200 block mb-1">Prefix (البادئة)</label>
                                <input 
                                  type="text" dir="ltr"
                                  value={config.prefix}
                                  onChange={(e) => {
                                      handleChange('invoiceNumbering', {
                                          ...settingsData.invoiceNumbering,
                                          [key]: { ...config, prefix: e.target.value }
                                      });
                                  }}
                                  className="w-full bg-white dark:bg-[#1a2332] border-2 border-slate-200 dark:border-[#2d3748] shadow-sm rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-teal-500 text-right text-lg font-mono placeholder-slate-400 transition-colors"
                                />
                               </div>
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 rounded-xl mt-4 text-center">
                               <p className="text-xs text-slate-500 mb-1">رقم الفاتورة القادم</p>
                               <p className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">{examplePreview}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-white/5 disabled-group">
                              <button 
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من إعادة تعيين أرقام فواتير ${config.name} إلى الصفر؟`)) {
                                      handleChange('invoiceNumbering', {
                                          ...settingsData.invoiceNumbering,
                                          [key]: { ...config, last_number: 0 }
                                      });
                                  }
                                }}
                                className="flex-1 py-3 bg-white dark:bg-[#11151c] hover:bg-slate-200 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-2"
                              >
                                <RefreshCcw className="w-4 h-4" /> إعادة تعيين
                              </button>
                              <button 
                                onClick={handleSave}
                                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                              >
                                حفظ 💾
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      {/* Unified Preview Section */}
                      <div className="mt-8 border-t border-slate-200 dark:border-white/5 pt-8">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                           <div>
                              <h3 className="font-black text-slate-900 dark:text-white text-lg">معاينة أرقام الفواتير</h3>
                              <p className="text-xs text-slate-500 mt-1">عرض رقم الفاتورة القادم لكل نوع</p>
                           </div>
                           <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                              <span className="text-lg">👁️</span>
                           </div>
                        </div>
                        <div className="space-y-3">
                           {Object.entries(settingsData.invoiceNumbering as Record<string, {name: string, prefix: string, padding: number, last_number: number}>).map(([key, config]) => {
                             const paddedLastNumber = String((config.last_number || 0) + 1).padStart(config.padding, '0');
                             const examplePreview = `${config.prefix}${paddedLastNumber}`;
                             return (
                               <div key={key} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                                 <div>
                                   <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{config.name}</p>
                                   <p className="text-xs text-slate-500">{key}</p>
                                 </div>
                                 <p className="font-mono font-bold text-blue-600 dark:text-blue-400" dir="ltr">{examplePreview}</p>
                               </div>
                             );
                           })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        {['general', 'appearance', 'invoices', 'invoice_numbering'].includes(activeTab) && (
          <div className="p-6 bg-white dark:bg-[#11151c] border-t border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-500">
              <AnimatePresence>
                {saveMessage && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {saveMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/10 flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
