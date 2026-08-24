import React from 'react';
import Barcode from 'react-barcode';
import { useSettings } from '../contexts/SettingsContext';

export interface PrintBarcodeTemplateProps {
  itemId: string | number;
  itemName: string;
  price: number | string;
  category?: string;
  barcodeValue?: string;
  brand?: string;
  storage?: string;
  battery?: string;
  config?: {
    type: 'normal' | 'split';
    showPrice: boolean;
    copies: number;
  };
}

// بيرجع حجم خط مناسب حسب طول اسم المنتج بدل ما يتقطع بـ "..."
// كل ما الاسم يطول، الخط يصغر تدريجيًا لحد حد أدنى معين عشان يفضل مقروء على الملصق
function getAutoFontSize(text: string, baseSize: number, minSize: number = 6) {
  const len = text?.length || 0;
  if (len <= 10) return baseSize;
  const shrink = Math.floor((len - 10) / 2);
  return Math.max(baseSize - shrink, minSize);
}

export const PrintBarcodeTemplate = React.forwardRef<HTMLDivElement, PrintBarcodeTemplateProps>(
  ({ itemId, itemName, price, category, barcodeValue, brand = '', storage, battery, config }, ref) => {
    const { settings } = useSettings();
    const { type = 'normal', showPrice = true, copies = 1 } = config || {};
    const safeBarcode = barcodeValue || String(itemId);
    // Sometimes barcode generation fails if empty, ensure a fallback
    const finalBarcode = safeBarcode && safeBarcode !== 'undefined' ? safeBarcode : '000000';

    // Create an array mapping number of copies
    const copiesArray = Array.from({ length: Math.max(1, copies) });

    const barcodeWidth = settings?.barcodeWidth || '50mm';
    const barcodeHeight = settings?.barcodeHeight || '30mm';
    const barcodeFontSize = settings?.barcodeFontSize || '12px';

    // Calculate split height (double the height)
    const numericHeight = parseInt(barcodeHeight) || 30;
    const splitHeight = `${numericHeight * 2}mm`;

    const parsedBarcodeFontSize = parseInt(barcodeFontSize) || 12;
    const isRotated = settings?.barcodeRotation === true;

    const printPageHeight = type === 'split' ? splitHeight : barcodeHeight;
    const pageW = isRotated ? printPageHeight : barcodeWidth;
    const pageH = isRotated ? barcodeWidth : printPageHeight;

    // حجم خط اسم المنتج: بياخد الحجم الأساسي (خط الباركود - 2) كحد أقصى،
    // وبيصغر تلقائيًا لو الاسم طويل، بدل ما يتقطع بـ "..."
    const itemNameBaseSize = Math.max(parsedBarcodeFontSize - 2, 6);
    const itemNameFontSize = getAutoFontSize(itemName || '', itemNameBaseSize, 5);

    const LabelContent = () => (
      <div className="flex flex-col items-center justify-between w-full h-full p-1 bg-white text-black font-sans box-border overflow-hidden"
        dir="rtl"
        style={{ fontSize: barcodeFontSize }}>
        {category === 'device' ? (
          <div className="w-full flex flex-col items-center">
            <div className="text-center font-black w-full border-b border-black/30 pb-0.5 mb-0.5" style={{ fontSize: `calc(${barcodeFontSize} - 1px)` }}>
              {settings?.companyName || brand || 'المحل'}
            </div>
            <div className="flex justify-between items-center w-full font-bold px-1" style={{ fontSize: `calc(${barcodeFontSize} - 2px)` }}>
              <span>{storage && storage !== '-' ? `المساحة: ${storage}` : ''}</span>
              <span>{battery && battery !== '-' ? `البطارية: ${battery}%` : ''}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-end w-full font-black border-b border-black/30 pb-0.5 mb-0.5 leading-tight px-2"
            style={{ fontSize: `calc(${barcodeFontSize} - 1px)` }}>
            <span>{showPrice ? `${Number(price).toLocaleString('en-US')} L.E` : ''}</span>
            <span>{settings?.companyName || brand || 'المحل'}</span>
          </div>
        )}
        <div className="w-full flex items-center justify-center overflow-hidden my-0.5">
          <Barcode
            value={finalBarcode}
            width={finalBarcode.length > 12 ? 1 : 1.5}
            height={numericHeight > 25 ? 32 : 24}
            fontSize={Math.max(9, parsedBarcodeFontSize - 2)}
            margin={0}
            textMargin={1}
            displayValue={true}
          />
        </div>
        <div className="w-full flex flex-col items-center">
          <div
            className="font-bold text-center w-full max-w-full px-1 leading-tight whitespace-nowrap overflow-hidden"
            title={itemName}
            style={{ fontSize: `${itemNameFontSize}px` }}
          >
            {itemName}
          </div>
          {category === 'device' && showPrice && (
            <div className="font-black text-center w-full mt-0.5 leading-none" style={{ fontSize: `calc(${barcodeFontSize} - 1.5px)` }}>
              {Number(price).toLocaleString('en-US')} L.E
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div ref={ref} className="bg-white text-black print-only-barcode w-full" dir="ltr">
        <style>{`
          @page { size: ${pageW} ${pageH}; margin: 0; }
          @media print { body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; overflow: hidden; } }
          
          .sticker-wrapper-barcode {
             width: ${pageW};
             height: ${pageH};
             position: relative;
             overflow: hidden;
             background: white;
             margin: 0 auto;
          }

          .sticker-content-barcode {
             width: ${barcodeWidth};
             height: ${printPageHeight};
             box-sizing: border-box;
             ${isRotated ? `
               position: absolute;
               top: 50%;
               left: 50%;
               transform: translate(-50%, -50%) rotate(-90deg);
             ` : ''}
          }
        `}</style>
        {copiesArray.map((_, idx) => (
          <div key={idx} style={{
            width: '100%',
            pageBreakAfter: idx < copiesArray.length - 1 ? 'always' : 'auto',
            boxSizing: 'border-box'
          }} className="flex flex-col items-center justify-center">

            <div className="sticker-wrapper-barcode">
              <div className="sticker-content-barcode border border-dashed border-gray-300 print:border-none">
                {type === 'normal' ? (
                  <div style={{ width: '100%', height: '100%' }} className="flex items-center justify-center overflow-hidden">
                    <LabelContent />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%' }} className="flex flex-col items-center justify-center divide-y divide-dashed divide-gray-400 overflow-hidden">
                    <div className="w-full h-1/2 flex items-center justify-center overflow-hidden"><LabelContent /></div>
                    <div className="w-full h-1/2 flex items-center justify-center overflow-hidden"><LabelContent /></div>
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>
    );
  }
);

PrintBarcodeTemplate.displayName = 'PrintBarcodeTemplate';