import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';
import { useSettings } from '../contexts/SettingsContext';

interface PrintMaintenanceStickerProps {
  repair: any;
}

export const PrintMaintenanceSticker = forwardRef<HTMLDivElement, PrintMaintenanceStickerProps>(
  ({ repair }, ref) => {
    const { settings } = useSettings();
    if (!repair) return null;

    const date = new Date(repair.created_at || Date.now());
    const ticketId = repair.id ? `R-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}-${repair.id.toString().padStart(5, "0")}` : "R-NEW";

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
          @media print { body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; overflow: hidden; } }
          
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
          <div 
            className="sticker-content p-[1mm] flex bg-white" 
          >
            {settings?.showBarcodeOnSticker ? (
              <div className="w-full h-full border-[1.5px] border-black box-border rounded-[2px] flex flex-col" dir="rtl" style={{ fontSize: barcodeFontSize }}>
                {/* Top Row: Name and Date */}
                <div className="flex border-b-[1.5px] border-black h-[25%] items-center shrink-0">
                  <div className="flex-[2] font-bold px-1 overflow-hidden truncate border-l-[1.5px] border-black min-w-0" style={{ fontSize: `calc(${barcodeFontSize} * 0.9)` }}>
                    {repair.customer_name || 'عميل'}
                  </div>
                  <div className="flex-1 text-center font-bold px-1" dir="ltr" style={{ fontSize: `calc(${barcodeFontSize} * 0.8)` }}>
                    {formattedDate}
                  </div>
                </div>
                
                {/* Middle Row: Phone and Issue */}
                <div className="flex border-b-[1.5px] border-black h-[35%] items-center shrink-0">
                  <div className="flex-1 font-bold px-1 text-center border-l-[1.5px] border-black" dir="ltr" style={{ fontSize: `calc(${barcodeFontSize} * 0.9)` }}>
                    {repair.customer_phone || '-'}
                  </div>
                  <div className="flex-[2] px-1 font-bold overflow-hidden" style={{ fontSize: `calc(${barcodeFontSize} * 0.85)` }}>
                    <span className="line-clamp-2 leading-none">{repair.issue || '-'}</span>
                  </div>
                </div>

                {/* Bottom Row: Barcode */}
                <div className="flex-1 flex flex-col items-center justify-center p-[1px] pt-[5px] overflow-hidden">
                  <div className="w-full flex items-center justify-center mb-[1px]">
                    <Barcode
                      value={repair.id ? `-${repair.id}` : '00000'}
                      text={ticketId}
                      width={1.8}
                      height={30}
                      fontSize={11}
                      displayValue={true}
                      margin={0}
                      textMargin={1}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex w-full h-full border-[1.5px] border-black box-border rounded-[2px]" dir="rtl" style={{ fontSize: barcodeFontSize }}>
                <div className="flex-1 flex flex-col overflow-hidden h-full">
                  <div className="border-b-[1.5px] border-black flex items-center justify-center font-bold px-1 text-center shrink-0" style={{ height: '30%', overflow: 'hidden' }}>
                    <span className="truncate w-full">{repair.customer_name || 'عميل'}</span>
                  </div>
                  <div className="border-b-[1.5px] border-black flex items-center justify-center font-bold px-1 text-center shrink-0" dir="ltr" style={{ height: '25%', overflow: 'hidden' }}>
                    <span className="truncate w-full tracking-[0.05em]">{repair.customer_phone || '-'}</span>
                  </div>
                  <div className="flex items-center justify-center flex-1 font-bold px-1 py-1 text-center overflow-hidden h-[45%]">
                    <span className="line-clamp-2 leading-tight max-w-full block">
                      {repair.issue || '-'}
                    </span>
                  </div>
                </div>

                <div className="flex border-r-[1.5px] border-black shrink-0 w-[35%]" dir="ltr">
                  <div className="flex-1 border-r-[1.5px] border-black relative flex items-center justify-center h-full">
                    <span className="-rotate-90 absolute whitespace-nowrap font-black" style={{ fontSize: `calc(${barcodeFontSize} * 1.1)` }}>
                      {repair.id}
                    </span>
                  </div>
                  <div className="flex-[1.2] relative flex items-center justify-center h-full">
                    <span className="-rotate-90 absolute whitespace-nowrap font-bold tracking-[0.1em]" style={{ fontSize: `calc(${barcodeFontSize} * 0.85)` }}>
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

PrintMaintenanceSticker.displayName = 'PrintMaintenanceSticker';
