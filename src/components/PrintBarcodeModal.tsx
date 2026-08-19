import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Tag, Smartphone, Headphones, Search, ArrowRight, Minus, Plus, Printer, Check, Copy, ClipboardList, Loader2, FileText } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { PrintBarcodeTemplate } from './PrintBarcodeTemplate';
import { useSettings } from '../contexts/SettingsContext';

interface PrintBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoSelectItem?: any;
}

// بيرجع حجم خط مناسب حسب طول اسم المنتج بدل ما يتقطع بـ "..."
// كل ما الاسم يطول، الخط يصغر تدريجيًا لحد حد أدنى معين عشان يفضل مقروء
function getAutoFontSize(text: string, baseSize: number, minSize: number = 6) {
  const len = text?.length || 0;
  if (len <= 10) return baseSize;
  const shrink = Math.floor((len - 10) / 2);
  return Math.max(baseSize - shrink, minSize);
}

export function PrintBarcodeModal({ isOpen, onClose, autoSelectItem }: PrintBarcodeModalProps) {
  const { settings } = useSettings();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<'device' | 'accessory' | 'spare_part' | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  React.useEffect(() => {
    if (isOpen && autoSelectItem) {
      if (selectedItem?.id === autoSelectItem.item.id) return; // Prevent infinite loop and reset if it's already set
      const { item, category } = autoSelectItem;
      setSelectedCategory(category);
      setSelectedItem({
        ...item,
        display_name: category === 'device' ? `${item.brand || ''} ${item.model || item.name || ''}`.trim() : item.name,
        final_price: item.selling_price || item.sell_price || item.price || 0,
        unique_code: item.barcode || item.imei1 || item.id,
      });
      setStep(3);
    } else if (isOpen && !autoSelectItem && step === 1 && !selectedItem) {
      // Only reset if we are just opening it manually
      resetState();
    }
  }, [isOpen, autoSelectItem?.item?.id]);

  // Print Config
  const [config, setConfig] = useState({
    type: 'normal' as 'normal' | 'split',
    showPrice: true,
    copies: 1
  });

  useEffect(() => {
    if (step === 2 && selectedCategory) {
      handleSearch('');
    }
  }, [step, selectedCategory]);

  const barcodeWidth = settings?.barcodeWidth || '50mm';
  const barcodeHeight = settings?.barcodeHeight || '30mm';
  const numericHeight = parseInt(barcodeHeight) || 30;
  const printPageHeight = config.type === 'split' ? `${numericHeight * 2}mm` : barcodeHeight;

  const printRef = useRef<HTMLDivElement>(null);
  const executePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Barcode',
    pageStyle: `@page { size: ${barcodeWidth} ${printPageHeight}; margin: 0; } @media print { body { margin: 0; padding: 0; overflow: hidden; } }`,
  });

  const handlePrint = () => {
    if (window.self !== window.top) {
      alert('⚠️ المتصفح يمنع الطباعة داخل نافذة المعاينة لدواعي أمنية.\n\nمن فضلك افتح التطبيق في نافذة مستقلة (Open in new tab) لتتمكن من الطباعة.');
      return;
    }

    if ((window as any).electron) {
      (window as any).electron.printSilent({
        type: 'barcode',
        data: {
          itemId: selectedItem.id,
          itemName: selectedItem.display_name,
          price: selectedItem.final_price,
          barcodeValue: selectedItem.barcode || selectedItem.id,
          brand: settings.companyName || selectedItem.brand,
          config
        }
      });
    } else {
      executePrint();
    }
  };

  const resetState = () => {
    setStep(1);
    setSelectedCategory(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedItem(null);
    setConfig({ type: 'normal', showPrice: true, copies: 1 });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiKey = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
      const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';

      const endpoint = selectedCategory === 'device' ? 'Devices' : selectedCategory === 'accessory' ? 'Accessories' : 'spare_parts';

      const userId = localStorage.getItem('user_id');

      let queryUrl = '';

      if (!text.trim()) {
        queryUrl = `${baseUrl}/${endpoint}?select=*&limit=50${userId ? `` : ''}`;
      } else {
        const safeText = encodeURIComponent(text);
        if (selectedCategory === 'device') {
          // Search in company, model, barcode, imei1
          queryUrl = `${baseUrl}/Devices?select=*&or=(model.ilike.*${safeText}*,company.ilike.*${safeText}*,barcode.ilike.*${safeText}*,imei1.ilike.*${safeText}*)&limit=15${userId ? `` : ''}`;
        } else if (selectedCategory === 'accessory') {
          queryUrl = `${baseUrl}/Accessories?select=*&or=(name.ilike.*${safeText}*,barcode.ilike.*${safeText}*)&limit=15${userId ? `` : ''}`;
        } else {
          queryUrl = `${baseUrl}/spare_parts?select=*&or=(name.ilike.*${safeText}*,barcode.ilike.*${safeText}*,sku.ilike.*${safeText}*)&limit=15${userId ? `` : ''}`;
        }
      }

      const res = await fetch(queryUrl, {
        headers: { apikey: apiKey, Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      let mapped: any[] = [];
      if (Array.isArray(data)) {
        mapped = data.map((item: any) => ({
          ...item,
          display_name: selectedCategory === 'device' ? `${item.company || item.brand || ''} ${item.model || item.name || ''}`.trim() : item.name,
          final_price: item.selling_price || item.sell_price || item.price || 0,
          unique_code: item.barcode || item.imei1 || item.sku || item.id,
        }));
      } else {
        console.error("Supabase error:", data);
      }
      setSearchResults(mapped);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectItem = (item: any) => {
    setSelectedItem(item);
    setStep(3);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className={`p-6 border-b flex justify-between items-center shrink-0 ${step < 3 ? 'bg-indigo-500 text-white border-transparent' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10'}`}>
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button onClick={() => setStep((s) => s - 1 as any)} className="p-2 hover:bg-black/10 rounded-full transition-colors ml-2">
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black">طباعة باركود</h2>
                  <Tag className={`w-6 h-6 ${step < 3 ? 'text-yellow-300' : 'text-yellow-500'}`} fill="currentColor" />
                </div>
                <p className={`text-sm ${step < 3 ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {step === 1 && 'اختر نوع المنتج ثم ابحث عنه'}
                  {step === 2 && 'ابحث عن المنتج المراد طباعته'}
                  {step === 3 && 'ضبط إعدادات الطباعة'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className={`p-2 rounded-xl transition-colors ${step < 3 ? 'bg-black/10 hover:bg-black/20 text-white' : 'bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-500/10 dark:hover:bg-rose-500/20'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-[#0f172a]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">اختر نوع المنتج</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => { setSelectedCategory('accessory'); setStep(2); }}
                      className="group bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-400 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all hover:shadow-xl hover:shadow-indigo-500/10"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Headphones className="w-10 h-10 text-indigo-500" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-2">إكسسوار</h4>
                        <p className="text-slate-500 text-sm">شواحن، سماعات، كفرات</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setSelectedCategory('device'); setStep(2); }}
                      className="group bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-400 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all hover:shadow-xl hover:shadow-indigo-500/10"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Smartphone className="w-10 h-10 text-blue-500" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-2">جهاز</h4>
                        <p className="text-slate-500 text-sm">موبايل، تابلت، لابتوب</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setSelectedCategory('spare_part'); setStep(2); }}
                      className="group bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-400 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all hover:shadow-xl hover:shadow-indigo-500/10"
                    >
                      <div className="w-20 h-20 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-4xl text-slate-500">🔧</span>
                      </div>
                      <div className="text-center">
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-2">قطعة غيار</h4>
                        <p className="text-slate-500 text-sm">شاشات، بطاريات</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">ابحث عن المنتج</h3>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو الباركود أو IMEI..."
                      className="w-full bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-500/30 rounded-2xl px-12 py-5 text-lg font-bold outline-none focus:border-blue-500 transition-colors shadow-sm"
                      autoFocus
                    />
                    <Search className="w-6 h-6 text-blue-400 absolute top-1/2 start-4 -translate-y-1/2" />
                    {isLoading && <Loader2 className="w-5 h-5 text-blue-500 absolute top-1/2 end-4 -translate-y-1/2 animate-spin" />}
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden min-h-[300px] flex flex-col">
                    {isLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-20 text-blue-500" />
                        <p className="text-lg">جاري البحث...</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <Search className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg">لا توجد نتائج مطابقة</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[400px] overflow-y-auto">
                        {searchResults.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectItem(item)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-right"
                          >
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-white text-lg">{item.display_name}</h4>
                              <p className="text-slate-500 font-mono text-sm uppercase mt-1">{item.unique_code || '---'}</p>
                            </div>
                            <div className="text-left font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                              {Number(item.final_price).toLocaleString()} ج.م
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 3 && selectedItem && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-6"
                >
                  {/* Fake Preview Area matches PrintBarcodeTemplate look roughly */}
                  <div className="bg-white dark:bg-white text-black border-2 border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[160px] shadow-inner relative overflow-hidden">
                    <div className="absolute top-2 right-4 text-xs font-bold text-slate-400 italic">معاينة مقربة</div>
                    {config.type === 'normal' ? (
                      <div className="w-[80%] max-w-[250px] border border-dashed border-gray-300 p-3 flex flex-col items-center">
                        {selectedCategory === 'device' ? (
                          <>
                            <div className="text-center font-black text-xs w-full border-b border-black/20 pb-1 mb-1">
                              {settings.companyName || selectedItem.brand || 'TAKKA'}
                            </div>
                            <div className="flex justify-between items-center w-full font-bold text-[10px] mb-2 px-1 text-slate-700" dir="rtl">
                              <span>{selectedItem.storage && selectedItem.storage !== '-' ? `المساحة: ${selectedItem.storage}` : ''}</span>
                              <span>{selectedItem.battery_percentage && selectedItem.battery_percentage !== '-' ? `البطارية: ${selectedItem.battery_percentage}%` : ''}</span>
                            </div>
                          </>
                        ) : (
                          config.showPrice && (
                            <div className="flex justify-between w-full text-xs font-black border-b border-black/20 pb-1 mb-2 px-1">
                              <span>{Number(selectedItem.final_price).toLocaleString()} L.E</span>
                              <span className="truncate max-w-[100px] text-left">{settings.companyName || selectedItem.brand || 'TAKKA'}</span>
                            </div>
                          )
                        )}
                        {/* Visual Barcode representation for preview only */}
                        <div className="h-10 w-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_4px)] opacity-80 mt-1 mb-1 relative flex items-end justify-center">
                          <span className="bg-white px-2 text-[10px] absolute -bottom-2 font-mono font-bold tracking-widest">{selectedItem.unique_code || '123456789'}</span>
                        </div>
                        {/* اسم المنتج - حجم الخط يصغر أوتوماتيك بدل ما يتقطع */}
                        <div
                          className="font-bold mt-3 text-center w-full leading-tight px-1"
                          style={{ fontSize: `${getAutoFontSize(selectedItem.display_name, 12)}px` }}
                        >
                          {selectedItem.display_name}
                        </div>
                        {selectedCategory === 'device' && config.showPrice && (
                          <div className="text-xs font-black mt-1 text-center w-full">
                            {Number(selectedItem.final_price).toLocaleString()} L.E
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-[80%] max-w-[250px] border border-dashed border-gray-300 flex flex-col divide-y divide-dashed divide-gray-400">
                        {/* Split x2 Preview - Top part */}
                        <div className="p-3 flex flex-col items-center">
                          {config.showPrice && (
                            <div className="flex justify-between w-full text-[10px] font-black border-b border-black/20 pb-0.5 mb-1 px-1">
                              <span>{Number(selectedItem.final_price).toLocaleString()} L.E</span>
                              <span className="truncate max-w-[80px] text-left">{settings.companyName || selectedItem.brand || 'TAKKA'}</span>
                            </div>
                          )}
                          <div className="h-8 w-full bg-[repeating-linear-gradient(90deg,#000,#000_1.5px,transparent_1.5px,transparent_3px)] opacity-80 mt-0.5 mb-1 relative flex items-end justify-center">
                            <span className="bg-white px-1 text-[8px] absolute -bottom-1.5 font-mono font-bold tracking-widest">{selectedItem.unique_code || '123456789'}</span>
                          </div>
                          {/* اسم المنتج - حجم الخط يصغر أوتوماتيك بدل ما يتقطع */}
                          <div
                            className="font-bold mt-2 text-center w-full leading-tight px-1"
                            style={{ fontSize: `${getAutoFontSize(selectedItem.display_name, 10)}px` }}
                          >
                            {selectedItem.display_name}
                          </div>
                        </div>
                        {/* Split x2 Preview - Bottom part */}
                        <div className="p-3 flex flex-col items-center">
                          {config.showPrice && (
                            <div className="flex justify-between w-full text-[10px] font-black border-b border-black/20 pb-0.5 mb-1 px-1">
                              <span>{Number(selectedItem.final_price).toLocaleString()} L.E</span>
                              <span className="truncate max-w-[80px] text-left">{settings.companyName || selectedItem.brand || 'TAKKA'}</span>
                            </div>
                          )}
                          <div className="h-8 w-full bg-[repeating-linear-gradient(90deg,#000,#000_1.5px,transparent_1.5px,transparent_3px)] opacity-80 mt-0.5 mb-1 relative flex items-end justify-center">
                            <span className="bg-white px-1 text-[8px] absolute -bottom-1.5 font-mono font-bold tracking-widest">{selectedItem.unique_code || '123456789'}</span>
                          </div>
                          {/* اسم المنتج - حجم الخط يصغر أوتوماتيك بدل ما يتقطع */}
                          <div
                            className="font-bold mt-2 text-center w-full leading-tight px-1"
                            style={{ fontSize: `${getAutoFontSize(selectedItem.display_name, 10)}px` }}
                          >
                            {selectedItem.display_name}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Config Form Matches Screenshot */}
                  <div className="flex flex-col gap-4">
                    {/* Label Type */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col gap-3">
                      <div className="text-sm font-bold text-slate-500">نوع الملصق:</div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setConfig({ ...config, type: 'split' })}
                          className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${config.type === 'split' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                          <ClipboardList className="w-6 h-6" />
                          <span>مقسوم (×2)</span>
                        </button>
                        <button
                          onClick={() => setConfig({ ...config, type: 'normal' })}
                          className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${config.type === 'normal' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                          <FileText className="w-6 h-6" />
                          <span>عادي</span>
                        </button>
                      </div>
                    </div>

                    {/* Show Price */}
                    <div
                      onClick={() => setConfig({ ...config, showPrice: !config.showPrice })}
                      className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded flex items-center justify-center border transition-colors shadow-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600">
                          {config.showPrice && <Check className="w-4 h-4 text-emerald-500 font-black" strokeWidth={4} />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                        <span>إظهار السعر</span>
                        <span className="text-amber-500">💰</span>
                      </div>
                    </div>

                    {/* Copies */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setConfig({ ...config, copies: Math.max(1, config.copies - 1) })}
                          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-black dark:text-white"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={config.copies}
                          onChange={(e) => setConfig({ ...config, copies: Math.max(1, Number(e.target.value)) })}
                          className="w-16 h-10 text-center font-black text-lg bg-transparent border-t border-b border-slate-200 dark:border-white/10 outline-none number-input-no-arrows"
                        />
                        <button
                          onClick={() => setConfig({ ...config, copies: config.copies + 1 })}
                          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-black dark:text-white"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                        <span>عدد النسخ</span>
                        <span className="text-amber-700">📦</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer actions for step 3 */}
          {step === 3 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-white/10 flex items-center gap-4 shrink-0">
              <button
                onClick={handleClose}
                className="flex-1 max-w-[120px] bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white py-4 rounded-xl font-bold transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handlePrint}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20"
              >
                <span>طباعة</span>
                <Printer className="w-5 h-5" />
              </button>
            </div>
          )}

        </motion.div>
      </div>

      {/* Hidden Print Content */}
      <div className="absolute -left-[9999px] invisible">
        {selectedItem && (
          <PrintBarcodeTemplate
            ref={printRef}
            itemId={selectedItem.id}
            itemName={selectedItem.display_name}
            price={selectedItem.final_price}
            barcodeValue={selectedItem.unique_code}
            brand={settings.companyName || selectedItem.brand}
            storage={selectedItem.storage}
            battery={selectedItem.battery_percentage}
            category={selectedCategory || undefined}
            config={config}
          />
        )}
      </div>
    </>
  );
}