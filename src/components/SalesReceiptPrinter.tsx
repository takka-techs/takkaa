/**
 * SalesReceiptPrinter.tsx
 * مكون وسيط يختار قالب فاتورة المبيعات بناءً على إعداد المستخدم.
 */

import React from "react";
import { useSettings } from "../contexts/SettingsContext";
import { PrintReceiptTemplate as DefaultTemplate } from "./PrintReceiptTemplate";
import { PrintReceiptTemplate as FirstTemplate } from "./PrintReceiptTemplatefirest";
import { PrintReceiptTemplate as SecondeTemplate } from "./PrintReceiptTemplateSeconde";
import { PrintReceiptTemplate as TherdTemplate } from "./PrintReceiptTemplateTherd";
import { PrintReceiptTemplate as FourthTemplate } from "./PrintReceiptTemplatefourth";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
}

export interface SalesReceiptProps {
  invoiceId: string;
  items: CartItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  cashReceived: number;
  changeAmount: number;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  shopName?: string;
  phone?: string;
  logo?: string;
  paymentMethod?: string;
  installmentInterestCost?: number;
}

export const PrintReceiptTemplate = React.forwardRef<HTMLDivElement, SalesReceiptProps>(
  (props, ref) => {
    const { settings } = useSettings();
    const template = settings?.salesReceiptTemplate || "default";

    switch (template) {
      case "first":
        return <FirstTemplate {...props} ref={ref} />;
      case "seconde":
        return <SecondeTemplate {...props} ref={ref} />;
      case "third":
        return <TherdTemplate {...props} ref={ref} />;
      case "fourth":
        return <FourthTemplate {...props} ref={ref} />;
      case "default":
      default:
        return <DefaultTemplate {...props} ref={ref} />;
    }
  }
);

PrintReceiptTemplate.displayName = "PrintReceiptTemplate";
