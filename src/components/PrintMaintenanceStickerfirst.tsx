import React, { forwardRef, useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface PrintMaintenanceStickerProps {
  repair: any;
}

// مكون فرعي مسؤول عن تصغير النص بشكل مثالي دون أي تقطيع أو خروج عن الإطار
const FitText = ({ text }: { text: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fit = () => {
      if (containerRef.current && textRef.current) {
        // إعادة الحجم للطبيعي لحساب العرض الحقيقي للنص بدقة
        textRef.current.style.transform = 'scale(1)';

        const containerW = containerRef.current.offsetWidth;
        const textW = textRef.current.scrollWidth;

        // إذا كان النص أكبر من المساحة المتاحة، نقوم بتصغيره
        if (textW > containerW && containerW > 0) {
          const scale = (containerW - 4) / textW; // ترك 4 بكسل هامش أمان إضافي
          textRef.current.style.transform = `scale(${scale})`;
        }
      }
    };

    fit();
    // إعادة التطبيق بعد جزء من الثانية لضمان اكتمال تحميل الخطوط والطباعة
    const timer = setTimeout(fit, 30);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden min-w-0">
      <span
        ref={textRef}
        className="whitespace-nowrap font-black text-black inline-block origin-center"
      >
        {text}
      </span>
    </div>
  );
};

export const PrintMaintenanceSticker = forwardRef<HTMLDivElement, PrintMaintenanceStickerProps>(
  ({ repair }, ref) => {
    const { settings } = useSettings();
    if (!repair) return null;

    const date = new Date(repair.created_at || Date.now());

    // تقسيم رقم التذكرة إلى جزئين لعرضهم بشكل أنيق
    const ticketPrefix = repair.id ? `R-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}` : "R-NEW";
    const ticketSuffix = repair.id ? repair.id.toString().padStart(5, "0") : "";

    const barcodeWidth = settings?.barcodeWidth || '50mm';
    const barcodeHeight = settings?.barcodeHeight || '30mm';
    const barcodeFontSize = settings?.barcodeFontSize || '12px';
    const isRotated = settings?.barcodeRotation === true;

    const pageW = isRotated ? barcodeHeight : barcodeWidth;
    const pageH = isRotated ? barcodeWidth : barcodeHeight;

    const formattedDate = [
      date.getDate().toString().padStart(2, '0'),
      (date.getMonth() + 1).toString().padStart(2, '0'),
      date.getFullYear()
    ].join('/');

    return (
      <div ref={ref}>
        <style>{`
          @page { size: ${pageW} ${pageH}; margin: 0; }
          @media print { 
            body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; overflow: hidden; } 
          }
          
          .sticker-wrapper {
             width: ${pageW};
             height: ${pageH};
             position: relative;
             overflow: hidden;
             background: white;
             margin: 0 auto;
             -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
          }

          .sticker-content {
             width: ${barcodeWidth};
             height: ${barcodeHeight};
             box-sizing: border-box;
             ${isRotated ? `
               position: absolute;
               top: 50%;
               left: 50%;
               transform: translate(-50%, -50%) rotate(-90deg);
             ` : ''}
          }
        `}</style>

        <div className="sticker-wrapper">
          <div className="sticker-content p-[2mm] flex bg-white font-sans text-black">
            <div className="w-full h-full border-[2px] border-black box-border rounded-[8px] flex overflow-hidden" dir="ltr">

              {/* Left Side - Details (زادت مساحته إلى 78% ليكون النص أكبر وأوضح) */}
              <div
                className="w-[78%] shrink-0 flex flex-col justify-center h-full border-r-[2px] border-black box-border"
                style={{ fontSize: `calc(${barcodeFontSize} * 0.90)` }}
              >
                <div className="flex-1 flex items-center justify-center w-full border-b-[1.5px] border-dashed border-gray-400 box-border px-1.5 overflow-hidden min-h-0">
                  <FitText text={formattedDate} />
                </div>
                <div className="flex-1 flex items-center justify-center w-full border-b-[1.5px] border-dashed border-gray-400 box-border px-1.5 overflow-hidden min-h-0">
                  <FitText text={repair.customer_name || '-'} />
                </div>
                <div className="flex-1 flex items-center justify-center w-full border-b-[1.5px] border-dashed border-gray-400 box-border px-1.5 overflow-hidden min-h-0">
                  <FitText text={repair.issue || '-'} />
                </div>
                <div className="flex-1 flex items-center justify-center w-full box-border px-1.5 overflow-hidden min-h-0">
                  <FitText text={repair.customer_phone || '-'} />
                </div>
              </div>

              {/* Right Side - Ticket ID (تم تقليله إلى 22% وتغيير شكل العرض) */}
              <div className="flex-1 shrink-0 flex flex-col items-center justify-center px-[2px] py-[4px] bg-white overflow-hidden min-w-0">
                {/* السطر الأول: التاريخ/البادئة */}
                <div
                  className="w-full text-center tracking-tight text-gray-700 font-bold mb-1"
                  style={{ fontSize: `calc(${barcodeFontSize} * 0.55)` }}
                >
                  {ticketPrefix}
                  <div className="w-full h-[1px] bg-gray-300 mt-1"></div> {/* خط فاصل صغير */}
                </div>

                {/* السطر الثاني: رقم التذكرة البارز */}
                <div
                  className="w-full flex-1 flex items-center justify-center overflow-hidden text-center tracking-tight text-black"
                  style={{ fontSize: `calc(${barcodeFontSize} * 1.1)` }}
                >
                  <FitText text={ticketSuffix} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }
);

PrintMaintenanceSticker.displayName = 'PrintMaintenanceSticker';