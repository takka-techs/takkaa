import React, { forwardRef, useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface ConsolidatedItem {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    type: string;
    imei?: string;
}

interface ConsolidatedData {
    customerName: string;
    date: string;
    items: ConsolidatedItem[];
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
}

interface Props {
    data: ConsolidatedData | null;
}

export const PrintConsolidatedInvoiceTemplate = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
    const { settings } = useSettings();

    if (!data) return null;

    return (
        <div ref={ref} className="bg-white p-8 text-black print-container font-sans" dir="rtl" style={{ width: '80mm', minHeight: '100%' }}>
            {/* Store Header */}
            <div className="text-center mb-6">
                <h1 className="text-2xl font-black mb-1">{settings?.companyName || 'اسم المحل'}</h1>
                {settings?.phone && <p className="text-sm font-bold">{settings.phone}</p>}
                                {settings?.address && <p className="text-xs mt-1">{settings.address}</p>}
            </div>

            <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-gray-300">
                <h2 className="text-lg font-bold uppercase mb-2 bg-gray-100 py-1 rounded">فاتورة مجمعة</h2>
                <div className="flex justify-between items-center text-sm font-bold mb-1">
                    <span>العميل:</span>
                    <span>{data.customerName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span>التاريخ:</span>
                    <span>{data.date}</span>
                </div>
            </div>

            {/* Items */}
            <div className="mb-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-gray-300">
                            <th className="text-start py-2 font-bold w-1/2">الصنف</th>
                            <th className="text-center py-2 font-bold w-1/4">الكمية</th>
                            <th className="text-end py-2 font-bold w-1/4">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                                <td className="py-2">
                                    <div className="font-bold text-xs">{item.name}</div>
                                    {item.imei && <div className="text-[10px] text-gray-500 font-mono">IMEI: {item.imei}</div>}
                                </td>
                                <td className="text-center py-2 font-bold text-xs">{item.quantity}</td>
                                <td className="text-end py-2 font-bold text-xs font-mono">{item.total_price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-2">
                <div className="flex justify-between items-center font-bold text-base">
                    <span>إجمالي الفواتير:</span>
                    <span className="font-mono">{data.totalAmount} ج.م</span>
                </div>
                <div className="flex justify-between items-center font-bold text-sm text-gray-600">
                    <span>المدفوع:</span>
                    <span className="font-mono">{data.paidAmount} ج.م</span>
                </div>
                <div className="flex justify-between items-center font-bold text-sm text-gray-600">
                    <span>المتبقي من اليوم:</span>
                    <span className="font-mono">{data.remainingAmount} ج.م</span>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-500 font-bold">
                <p>تم إصدار الفاتورة المجمعة من النظام</p>
                <p className="mt-1">تاريخ الطباعة: {new Date().toLocaleString('ar-EG')}</p>
            </div>
        </div>
    );
});
