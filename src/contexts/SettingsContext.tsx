import React, { createContext, useContext, useState, useEffect } from 'react';

const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';
const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';

export interface AppSettings {
  companyName: string;
  currency: string;
  taxRate: string;
  invoiceHeader: string;
  invoiceFooter: string;
  theme: string;
  accentColor: string;
  logo?: string;
  dateFormat: string;
  // Printing & Invoice Settings
  directPrint: boolean;
  paperWidth: string;
  receiptFontSize: string;
  phone: string;
  address: string;
  showDetails: boolean;
  barcodeDirectPrint: boolean;
  barcodeWidth: string;
  barcodeHeight: string;
  barcodeFontSize: string;
  barcodeRotation: boolean;
  showBarcodeOnSticker: boolean;
  maintenanceNote: string;
  warrantyTerms: string;
  maintenanceFooter: string;
  // App UI
  appFontSize: number;
  // WhatsApp Template
  whatsappMaintenanceTemplate: string;
  // TextBox
  invoiceNumbering: Record<string, { name: string, prefix: string, padding: number, last_number: number }>;
  // Transfer Settings
  transferSettings?: any;
  // License Settings
  licenseStatus?: boolean;
  licenseExpiry?: string;
  // Notifications
  enableNotifications: boolean;
  enableSounds: boolean;
  taskReminders: boolean;
  salesNotifications: boolean;
  lowStockNotifications: boolean;
  // Inventory
  lowStockAlert: boolean;
  lowStockThreshold: number;
  preventZeroStockSales: boolean;
  hasBranches: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  isLoading: boolean;
  playSound: (type: 'ting' | 'pop' | 'error' | 'success') => void;
}

const DEFAULT_INVOICE_NUMBERING = {
  accessory_sale: { name: 'مبيعات الإكسسوارات', prefix: 'ACC-', padding: 6, last_number: 0 },
  expense: { name: 'المصروفات', prefix: 'EXP-', padding: 6, last_number: 0 },
  purchase: { name: 'مشتريات', prefix: 'PUR-', padding: 6, last_number: 0 },
  repair: { name: 'إصلاحات', prefix: 'REP-', padding: 6, last_number: 0 },
  return: { name: 'مرتجعات', prefix: 'RET-', padding: 6, last_number: 0 },
  sale: { name: 'مبيعات الأجهزة', prefix: 'SAL-', padding: 6, last_number: 0 },
  stocktake: { name: 'جرد', prefix: 'ST-', padding: 4, last_number: 0 }
};

const defaultSettings: AppSettings = {
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
  maintenanceFooter: 'شكراً لثقتكم — نتمنى لكم خدمة مميزة',
  appFontSize: 100,
  whatsappMaintenanceTemplate: 'السلام عليكم {customer_name}\nمن {company_name}\n\nتحديث حالة جهازك:\n📱 الجهاز: {device}\n🔖 رقم التذكرة: {ticket_no}\n📌 الحالة: {status}\n💰 التكلفة: {total_cost} ج.م\n\nشكراً لثقتكم 🙏 {tech_name}',
  invoiceNumbering: DEFAULT_INVOICE_NUMBERING,
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
  licenseExpiry: null,
  enableNotifications: true,
  enableSounds: true,
  taskReminders: true,
  salesNotifications: true,
  lowStockNotifications: true,
  lowStockAlert: true,
  lowStockThreshold: 10,
  preventZeroStockSales: false,
  hasBranches: true
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  refreshSettings: async () => {},
  updateSettings: async () => {},
  isLoading: true,
  playSound: () => {}
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Also save to database
    const token = localStorage.getItem('access_token');
    const userId = localStorage.getItem('user_id');
    
    const updatedSettings = { ...settings, ...newSettings };
    if (userId) {
      localStorage.setItem(`takka_settings_${userId}`, JSON.stringify(updatedSettings));
    } else {
      localStorage.setItem('takka_settings', JSON.stringify(updatedSettings));
    }
    
    if (!userId) return;
    
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?user_id=eq.${userId}`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      let settingsId = null;
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          settingsId = data[0].id;
        }
      }

      const payload = {
          user_id: userId,
          company_name: updatedSettings.companyName,
          currency: updatedSettings.currency,
          tax_rate: updatedSettings.taxRate,
          invoice_header: updatedSettings.invoiceHeader,
          invoice_footer: updatedSettings.invoiceFooter,
          theme: updatedSettings.theme,
          accent_color: updatedSettings.accentColor,
          logo: updatedSettings.logo,
          date_format: updatedSettings.dateFormat,
          direct_print: updatedSettings.directPrint,
          paper_width: updatedSettings.paperWidth,
          receipt_font_size: updatedSettings.receiptFontSize,
          phone: updatedSettings.phone,
          address: updatedSettings.address,
          show_details: updatedSettings.showDetails,
          barcode_direct_print: updatedSettings.barcodeDirectPrint,
          barcode_width: updatedSettings.barcodeWidth,
          barcode_height: updatedSettings.barcodeHeight,
          barcode_font_size: updatedSettings.barcodeFontSize,
          maintenance_note: updatedSettings.maintenanceNote,
          warranty_terms: updatedSettings.warrantyTerms,
          maintenance_footer: updatedSettings.maintenanceFooter,
          app_font_size: updatedSettings.appFontSize,
          whatsapp_maintenance_template: updatedSettings.whatsappMaintenanceTemplate,
          invoice_numbering: updatedSettings.invoiceNumbering,
          transfer_settings: updatedSettings.transferSettings,
          enable_notifications: updatedSettings.enableNotifications,
          enable_sounds: updatedSettings.enableSounds,
          task_reminders: updatedSettings.taskReminders,
          sales_notifications: updatedSettings.salesNotifications,
          low_stock_notifications: updatedSettings.lowStockNotifications,
          low_stock_alert: updatedSettings.lowStockAlert,
          low_stock_threshold: updatedSettings.lowStockThreshold,
          prevent_zero_stock_sales: updatedSettings.preventZeroStockSales,
          has_branches: updatedSettings.hasBranches
      };
      
      const method = settingsId ? 'PATCH' : 'POST';
      const url = settingsId ? `${SUPABASE_URL}/rest/v1/app_settings?id=eq.${settingsId}&user_id=eq.${userId}` : `${SUPABASE_URL}/rest/v1/app_settings`;
      
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      
      if (!userId) {
        // Fallback to local storage
        const saved = localStorage.getItem('takka_settings');
        if (saved) setSettings(JSON.parse(saved));
        setIsLoading(false);
        return;
      }

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
          const savedLocal = localStorage.getItem(`takka_settings_${userId}`);
          const parsedLocal = savedLocal ? JSON.parse(savedLocal) : null;
          
          const newSettings = {
            companyName: dbSettings.company_name || defaultSettings.companyName,
            currency: dbSettings.currency || defaultSettings.currency,
            taxRate: dbSettings.tax_rate?.toString() || defaultSettings.taxRate,
            invoiceHeader: dbSettings.invoice_header || defaultSettings.invoiceHeader,
            invoiceFooter: dbSettings.invoice_footer || defaultSettings.invoiceFooter,
            theme: dbSettings.theme || defaultSettings.theme,
            accentColor: dbSettings.accent_color || defaultSettings.accentColor,
            logo: dbSettings.logo || defaultSettings.logo,
            dateFormat: dbSettings.date_format || defaultSettings.dateFormat,
            directPrint: dbSettings.direct_print ?? defaultSettings.directPrint,
            paperWidth: dbSettings.paper_width || defaultSettings.paperWidth,
            receiptFontSize: dbSettings.receipt_font_size || defaultSettings.receiptFontSize,
            phone: dbSettings.phone || defaultSettings.phone,
            address: dbSettings.address || defaultSettings.address,
            showDetails: dbSettings.show_details ?? defaultSettings.showDetails,
            barcodeDirectPrint: dbSettings.barcode_direct_print ?? defaultSettings.barcodeDirectPrint,
            barcodeWidth: dbSettings.barcode_width || defaultSettings.barcodeWidth,
            barcodeHeight: dbSettings.barcode_height || defaultSettings.barcodeHeight,
            barcodeFontSize: dbSettings.barcode_font_size || defaultSettings.barcodeFontSize,
            barcodeRotation: parsedLocal?.barcodeRotation ?? defaultSettings.barcodeRotation,
            showBarcodeOnSticker: parsedLocal?.showBarcodeOnSticker ?? defaultSettings.showBarcodeOnSticker,
            maintenanceNote: dbSettings.maintenance_note || defaultSettings.maintenanceNote,
            warrantyTerms: dbSettings.warranty_terms || defaultSettings.warrantyTerms,
            maintenanceFooter: dbSettings.maintenance_footer || defaultSettings.maintenanceFooter,
            appFontSize: dbSettings.app_font_size ?? defaultSettings.appFontSize,
            whatsappMaintenanceTemplate: dbSettings.whatsapp_maintenance_template || defaultSettings.whatsappMaintenanceTemplate,
            invoiceNumbering: dbSettings.invoice_numbering || defaultSettings.invoiceNumbering,
            transferSettings: dbSettings.transfer_settings || (parsedLocal?.transferSettings) || defaultSettings.transferSettings,
            licenseStatus: dbSettings.license_status ?? defaultSettings.licenseStatus,
            licenseExpiry: dbSettings.license_expiry ?? defaultSettings.licenseExpiry,
            enableNotifications: dbSettings.enable_notifications ?? defaultSettings.enableNotifications,
            enableSounds: dbSettings.enable_sounds ?? defaultSettings.enableSounds,
            taskReminders: dbSettings.task_reminders ?? defaultSettings.taskReminders,
            salesNotifications: dbSettings.sales_notifications ?? defaultSettings.salesNotifications,
            lowStockNotifications: dbSettings.low_stock_notifications ?? defaultSettings.lowStockNotifications,
            lowStockAlert: dbSettings.low_stock_alert ?? defaultSettings.lowStockAlert,
            lowStockThreshold: dbSettings.low_stock_threshold ?? defaultSettings.lowStockThreshold,
            preventZeroStockSales: dbSettings.prevent_zero_stock_sales ?? defaultSettings.preventZeroStockSales,
            hasBranches: dbSettings.has_branches ?? parsedLocal?.hasBranches ?? defaultSettings.hasBranches
          };
          setSettings(newSettings);
          // Sync local storage as backup
          localStorage.setItem(`takka_settings_${userId}`, JSON.stringify(newSettings));
        } else {
            // New account without settings in DB
            // Clear settings context config to default if needed or rely on locally saved from signup
            const fallbackLocal = localStorage.getItem(`takka_settings_${userId}`) || localStorage.getItem('takka_settings');
            if (fallbackLocal) {
              setSettings(JSON.parse(fallbackLocal));
            } else {
              setSettings(defaultSettings);
            }
        }
      }
    } catch (err) {
      console.error('Failed to load global settings', err);
      const userId = localStorage.getItem('user_id');
      const saved = userId ? localStorage.getItem(`takka_settings_${userId}`) : localStorage.getItem('takka_settings');
      if (saved) setSettings(JSON.parse(saved));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    window.addEventListener('login_state_changed', fetchSettings);
    return () => {
      window.removeEventListener('login_state_changed', fetchSettings);
    };
  }, []);

  const playSound = (type: 'ting' | 'pop' | 'error' | 'success') => {
    if (!settings.enableSounds) return;
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
      } else if (type === 'error') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else if (type === 'success') {
        oscillator.type = 'sine';
        
        // First note
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        // Second note
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);
        osc2.start(audioCtx.currentTime + 0.1);
        osc2.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.log('Audio error', e);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings, updateSettings, isLoading, playSound }}>
      {children}
    </SettingsContext.Provider>
  );
}
