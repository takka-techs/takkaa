import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  Wallet,
  Wrench,
  Package,
  ArrowUpRight,
  Award,
  Smartphone,
  Headphones,
  Search,
  Handshake,
  Briefcase,
  BarChart2,
  Settings,
  DollarSign,
  Building2,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useBranch } from "../contexts/BranchContext";

const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co";
const SUPABASE_KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

export default function DashboardReport() {
  const { isOwner, branches, currentBranch } = useBranch();
  const [crossBranch, setCrossBranch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>({
    salesTotal: 0,
    profitTotal: 0,
    maintenanceTotal: 0,
    installmentsTotal: 0,
    devicesValue: 0,
    accessoriesValue: 0,
    sparePartsValue: 0,
    partnersCapital: 0,
    devicesCount: 0,
    accessoriesCount: 0,
    maintenanceCount: 0,
    partnersCount: 0,
    salesBreakdown: "",
    trendData: [],
    revenueData: [],
    topProducts: [],
    topCustomers: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers = {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${token}`,
        };

        const branchSuffix = crossBranch ? "&bypass_branch=true" : "";

        const [
          salesRes,
          devicesRes,
          accessoriesRes,
          sparePartsRes,
          repairsRes,
          partnersRes,
          installmentsRes,
          returnsRes,
        ] = await Promise.all([
          fetch(
            `${SUPABASE_URL}/rest/v1/Sales_Invoices?select=*,Sales_Items(*)${branchSuffix}`,
            { headers },
          ),
          fetch(
            `${SUPABASE_URL}/rest/v1/Devices?select=id,quantity,cost_price,selling_price,status&limit=10000`,
            { headers },
          ),
          fetch(
            `${SUPABASE_URL}/rest/v1/Accessories?select=id,quantity,cost_price,selling_price&limit=10000`,
            { headers },
          ),
          fetch(
            `${SUPABASE_URL}/rest/v1/spare_parts?select=id,quantity,cost_price,selling_price&limit=10000`,
            { headers },
          ),
          fetch(`${SUPABASE_URL}/rest/v1/Repairs?select=*&limit=10000${branchSuffix.replace('branch_id', 'receiving_branch_id')}`, {
            headers,
          }),
          fetch(`${SUPABASE_URL}/rest/v1/partners?select=*${branchSuffix}`, {
            headers,
          }),
          fetch(
            `${SUPABASE_URL}/rest/v1/treasury_transactions?select=amount&category=eq.installment_collection${branchSuffix}`,
            { headers },
          ),
          fetch(
            `${SUPABASE_URL}/rest/v1/Sales_Returns?select=*${branchSuffix}`,
            { headers },
          ),
        ]);
        
        const cMap = {
          device: new Map<string, number>(),
          accessory: new Map<string, number>(),
          spare_part: new Map<string, number>(),
        };

        let devsData: any[] = [];
        if (devicesRes && devicesRes.ok) {
          devsData = await devicesRes.json();
          devsData.forEach((d: any) => cMap.device.set(String(d.id), d.cost_price || 0));
        }
        let accsData: any[] = [];
        if (accessoriesRes && accessoriesRes.ok) {
           accsData = await accessoriesRes.json();
           accsData.forEach((a: any) => cMap.accessory.set(String(a.id), a.cost_price || 0));
        }
        let spsData: any[] = [];
        if (sparePartsRes && sparePartsRes.ok) {
           spsData = await sparePartsRes.json();
           spsData.forEach((s: any) => cMap.spare_part.set(String(s.id), s.cost_price || 0));
        }

        let salesTotal = 0,
          profitTotal = 0,
          maintTotal = 0;
        let dRev = 0,
          aRev = 0;
        let dSold = 0,
          aSold = 0,
          sSold = 0;

        const trendMap: Record<
          string,
          { date: string; المبيعات: number; الأرباح: number }
        > = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = format(d, "d/M");
          trendMap[dateStr] = { date: dateStr, المبيعات: 0, الأرباح: 0 };
        }

        const productMap: Record<string, any> = {};
        const customerMap: Record<string, any> = {};

        if (salesRes.ok) {
          const invoices = await salesRes.json();
          invoices.forEach((inv: any) => {
            // Check invoice status
            if (['مرتجع', 'ملغي', 'مرفوض'].includes(inv.status)) return;
            
            let invTotal = 0;
            let invProfit = 0;
            const dStr = format(new Date(inv.created_at || new Date()), "d/M");

            inv.Sales_Items?.forEach((item: any) => {
              const name = item.product_name || item.item_name || '';
              if (name.includes('(مرتجع)')) return;

              const price = item.total_price || ((item.unit_price || 0) * (item.quantity || 1)) || 0;
              let cost = item.cost_price || 0;
              
              const pType = item.product_type || item.item_type || 'device';
              const pId = String(item.product_id || item.item_id);

              if (cost === 0) {
                 const unitCost = cMap[pType as keyof typeof cMap]?.get(pId) || 0;
                 cost = unitCost * (item.quantity || 1);
              }

              const profit = cost > 0 ? price - cost : 0;

              invTotal += price;
              invProfit += profit;

              salesTotal += price;
              profitTotal += profit;

              const pQty = Number(item.quantity || 1);
              if (item.product_type === "device") {
                dSold += pQty;
                dRev += price;
              } else if (item.product_type === "accessory") {
                aSold += pQty;
                aRev += price;
              } else {
                sSold += pQty;
              }

              const pName = item.product_name || "غير محدد";
              if (!productMap[pName])
                productMap[pName] = {
                  name: pName,
                  type: item.product_type,
                  qty: 0,
                  revenue: 0,
                };
              productMap[pName].qty += item.quantity || 1;
              productMap[pName].revenue += price;
            });

            if (trendMap[dStr]) {
              trendMap[dStr].المبيعات += invTotal;
              trendMap[dStr].الأرباح += invProfit;
            }

            const cName = inv.customer_name || "عميل نقدي";
            if (!customerMap[cName])
              customerMap[cName] = { name: cName, count: 0, total: 0 };
            customerMap[cName].count += 1;
            customerMap[cName].total += invTotal;
          });

          if (returnsRes && returnsRes.ok) {
            const returns = await returnsRes.json();
            returns.forEach((ret: any) => {
              const refundAmt = Number(ret.refund_amount || 0);
              let itemCost = 0;
              const dStr = format(new Date(ret.created_at || new Date()), "d/M");

              const matchedInv = invoices.find((inv: any) => inv.invoice_number === ret.invoice_number);
              if (matchedInv && matchedInv.Sales_Items) {
                const matchedItem = matchedInv.Sales_Items.find((si: any) => {
                  const siId = String(si.product_id || si.item_id || '');
                  const retId = String(ret.product_id || ret.item_id || '');
                  return siId && retId && siId === retId;
                });
                
                if (matchedItem) {
                  const pQty = Number(matchedItem.quantity || 1);
                  const retQty = Number(ret.quantity || ret.qty || pQty);
                  
                  let totalOriginalCost = Number(matchedItem.cost_price || 0);
                  let unitCost = 0;
                  
                  if (totalOriginalCost > 0) {
                      unitCost = totalOriginalCost / pQty;
                  } else {
                     const pType = matchedItem.product_type || matchedItem.item_type || 'device';
                     unitCost = cMap[pType as keyof typeof cMap]?.get(String(ret.product_id || ret.item_id)) || 0;
                  }
                  
                  itemCost = (unitCost * retQty) || 0;
                  
                  // Adjust units logic
                  if (matchedItem.product_type === "device") {
                    dSold = Math.max(0, dSold - retQty);
                    dRev = Math.max(0, dRev - refundAmt);
                  } else if (matchedItem.product_type === "accessory") {
                    aSold = Math.max(0, aSold - retQty);
                    aRev = Math.max(0, aRev - refundAmt);
                  } else {
                    sSold = Math.max(0, sSold - retQty);
                  }

                  const pName = matchedItem.product_name || "غير محدد";
                  if (productMap[pName]) {
                    productMap[pName].qty = Math.max(0, productMap[pName].qty - retQty);
                    productMap[pName].revenue = Math.max(0, productMap[pName].revenue - refundAmt);
                  }
                }
              }

              itemCost = Math.min(itemCost, refundAmt);
              const retProfit = refundAmt - itemCost;
              
              salesTotal -= refundAmt;
              profitTotal -= retProfit;
              
              if (trendMap[dStr]) {
                trendMap[dStr].المبيعات -= refundAmt;
                trendMap[dStr].الأرباح -= retProfit;
              }
            });
          }
        }

        let maintenanceCount = 0;
        let maintProfit = 0;
        if (repairsRes.ok) {
          const repairs = await repairsRes.json();
          repairs.forEach((r: any) => {
            if (['مرتجع / تم الاسترداد', 'محذوف', 'ملغي'].includes(r.status)) return;
            maintenanceCount++;
            
            const rTotal = Number(r.paid_amount || r.total_amount || 0);
            let cost = 0;
            let hasParsedCost = false;

            if (r.notes && r.notes.includes('===PARTS===')) {
                try {
                   const partsStr = r.notes.split('===PARTS===\n')[1].split('\n===')[0];
                   const repairParts = JSON.parse(partsStr);
                   cost = repairParts.reduce((sum: number, p: any) => sum + (Number(p.cost || p.cost_price || 0) * Number(p.quantity || 1)), 0);
                   hasParsedCost = true;
                } catch(e) {}
            }

            if (!hasParsedCost) {
               cost = Number(r.spare_parts_cost || r.cost || 0);
            }
            
            const profit = rTotal - cost;
            
            maintTotal += rTotal;
            maintProfit += profit;
            
            salesTotal += rTotal;
            profitTotal += profit;
            
            const dStr = format(new Date(r.created_at || new Date()), "d/M");
            if (trendMap[dStr]) {
              trendMap[dStr].المبيعات += rTotal;
              trendMap[dStr].الأرباح += profit;
            }
          });
        }

        let dVal = 0,
          dCount = 0;
        if (devicesRes.ok) {
          const ds = devsData;
          const availableStatuses = ['متاح', 'متوفر', 'في المخزن', 'available', 'in_stock'];
          const available = ds.filter((d: any) => availableStatuses.includes(d.status) || (!d.status && d.quantity > 0));
          dCount = available.length;
          dVal = available.reduce(
            (s: number, i: any) => s + Number(i.cost_price || 0),
            0,
          );
        }

        let aVal = 0,
          aCount = 0;
        if (accessoriesRes.ok) {
          const as = accsData;
          aCount = as.reduce(
            (s: number, i: any) => s + Number(i.quantity || 0),
            0,
          );
          aVal = as.reduce(
            (s: number, i: any) =>
              s + Number(i.cost_price || 0) * Number(i.quantity || 0),
            0,
          );
        }

        let sVal = 0,
          sCount = 0;
        if (sparePartsRes.ok) {
          const sps = spsData;
          sCount = sps.reduce(
            (s: number, i: any) => s + Number(i.quantity || 0),
            0,
          );
          sVal = sps.reduce(
            (s: number, i: any) =>
              s + Number(i.cost_price || 0) * Number(i.quantity || 0),
            0,
          );
        }

        let pCapital = 0,
          pCount = 0;
        if (partnersRes.ok) {
          const ps = await partnersRes.json();
          pCount = ps.length;
          pCapital = ps.reduce(
            (s: number, i: any) => s + Number(i.capital || 0),
            0,
          );
        }

        let installmentsCollected = 0;
        if (installmentsRes && installmentsRes.ok) {
          const txs = await installmentsRes.json();
          installmentsCollected = txs.reduce(
            (sum: number, tx: any) => sum + Number(tx.amount || 0),
            0,
          );
        }

        const topProducts = Object.values(productMap)
          .sort((a: any, b: any) => b.revenue - a.revenue)
          .slice(0, 5);
        const topCustomers = Object.values(customerMap)
          .sort((a: any, b: any) => b.total - a.total)
          .slice(0, 5);

        setData({
          salesTotal,
          profitTotal,
          maintenanceTotal: maintTotal,
          installmentsTotal: installmentsCollected,
          devicesValue: dVal,
          accessoriesValue: aVal,
          sparePartsValue: sVal,
          partnersCapital: pCapital,
          devicesCount: dCount,
          accessoriesCount: aCount,
          maintenanceCount,
          partnersCount: pCount,
          salesBreakdown: `${dSold} جهاز + ${aSold} إكسسوار + ${sSold} قطعة`,
          trendData: Object.values(trendMap),
          revenueData: [
            { name: "الأجهزة", value: dRev },
            { name: "الإكسسوارات", value: aRev },
            { name: "الصيانة", value: maintTotal },
          ],
          topProducts,
          topCustomers,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [crossBranch]);

  const totalInventoryValue =
    data.devicesValue + data.accessoriesValue + data.sparePartsValue;
  const PIE_COLORS = ["#3b82f6", "#a855f7", "#f59e0b"];

  const renderTypeTag = (type: string) => {
    switch (type) {
      case "device":
        return (
          <span className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded text-xs border border-blue-500/20">
            جهاز
          </span>
        );
      case "accessory":
        return (
          <span className="text-purple-400 bg-purple-500/10 px-2 py-1 rounded text-xs border border-purple-500/20">
            إكسسوار
          </span>
        );
      case "spare_part":
        return (
          <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded text-xs border border-red-500/20">
            قطعة غيار
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="w-full bg-white dark:bg-[#0b101a] text-slate-900 dark:text-white p-6 rounded-3xl mt-4 border border-slate-200 dark:border-white/5"
      dir="rtl"
    >
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-primary-500" />
          لوحة تقارير الإدارة
        </h2>
        {isOwner && (
          <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-white/5 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={crossBranch}
              onChange={(e) => setCrossBranch(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <Building2 className="w-4 h-4 text-slate-500" />
            عرض تقرير مجمع لجميع الفروع
          </label>
        )}
      </div>

      {/* KPIs Grid */}
      <div className="flex flex-nowrap overflow-x-auto lg:grid lg:grid-cols-7 gap-4 xl:gap-2 mb-6 pb-2 scrollbar-thin">
        {/* 1. إجمالي المبيعات */}
        <div className="min-w-[190px] mr-1 bg-slate-50 dark:bg-[#161b22] border-r-4 border-r-emerald-500 rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md p-1.5">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              إجمالي المبيعات
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {data.salesTotal.toLocaleString()}{" "}
              <span className="text-sm font-normal text-slate-500">ج.م</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-500">{data.salesBreakdown}</p>
        </div>

        {/* 2. صافي الربح */}
        <div className="min-w-[190px] bg-slate-50 dark:bg-[#161b22] border-r-4 border-r-purple-500 rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md p-1.5">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              صافي الربح
            </p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {data.profitTotal.toLocaleString()}{" "}
              <span className="text-sm font-normal text-slate-500">ج.م</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-500">
            مؤشر الربح التقديري للفترة
          </p>
        </div>

        {/* 3. إيراد الصيانة */}
        <div className="min-w-[190px] bg-slate-50 dark:bg-[#161b22] border-r-4 border-r-orange-500 rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-md p-1.5">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              إيراد الصيانة
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {data.maintenanceTotal.toLocaleString()}{" "}
              <span className="text-sm font-normal text-slate-500">ج.م</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-500">
            {data.maintenanceCount} تذكرة صيانة مسجلة
          </p>
        </div>

        {/* 3.5. الأقساط المحصلة */}
        <div className="min-w-[190px] bg-slate-50 dark:bg-[#161b22] border-r-4 border-r-indigo-500 rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md p-1.5">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              تحصيل الأقساط
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {(data.installmentsTotal || 0).toLocaleString()}{" "}
              <span className="text-sm font-normal text-slate-500">ج.م</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-500">مقبوضات الأقساط</p>
        </div>

        {/* 4. مخزون الأجهزة */}
        <div className="min-w-[190px] bg-slate-50 dark:bg-[#161b22] border-r-4 border-r-blue-500 rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md p-1.5">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              مخزون الأجهزة
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {data.devicesValue.toLocaleString()}{" "}
              <span className="text-sm font-normal text-slate-500">ج.م</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-500">
            {data.devicesCount} جهاز متاح
          </p>
        </div>

        {/* 5. مخزون الإكسسوارات */}
        <div className="min-w-[190px] bg-slate-50 dark:bg-[#161b22] border-r-4 border-r-cyan-500 rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-md p-1.5">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              مخزون الإكسسوارات
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {data.accessoriesValue.toLocaleString()}{" "}
              <span className="text-sm font-normal text-slate-500">ج.م</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-500">
            {data.accessoriesCount} قطعة
          </p>
        </div>

        {/* 6. مخزون قطع الغيار */}
        <div className="min-w-[190px] bg-slate-50 dark:bg-[#161b22] border-r-4 border-r-rose-500 rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md p-1.5">
              <Settings className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              مخزون قطع الغيار
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {data.sparePartsValue.toLocaleString()}{" "}
              <span className="text-sm font-normal text-slate-500">ج.م</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-500">تقييم القطع المتاحة</p>
        </div>

        {/* 7. رأس مال الشركاء */}
        <div className="min-w-[190px] bg-slate-50 dark:bg-[#161b22] border-r-4 border-r-pink-500 rounded-xl p-4 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-md p-1.5">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              رأس مال الشركاء
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {data.partnersCapital.toLocaleString()}{" "}
              <span className="text-sm font-normal text-slate-500">ج.م</span>
            </h3>
          </div>
          <p className="text-[10px] text-slate-500">
            {data.partnersCount} شريك مسجل
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Donut Chart */}
        <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-md flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <BarChart2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              توزيع الإيرادات
            </h3>
          </div>
          <div className="flex-1 h-[250px] relative z-10">
            {data.revenueData.some((d: any) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.revenueData.filter((d: any) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.revenueData.filter((d: any) => d.value > 0).map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tw-colors-slate-800)",
                      border: "1px solid var(--tw-colors-slate-700)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                لا توجد إيرادات لعرضها بيانياً
              </div>
            )}
          </div>
        </div>

        {/* Line Chart */}
        <div className="md:col-span-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-md relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              اتجاه المبيعات والأرباح (آخر 7 أيام)
            </h3>
          </div>
          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--tw-colors-slate-300)"
                  strokeOpacity={0.5}
                  vertical={false}
                  className="dark:stroke-slate-700"
                />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tw-colors-slate-800)",
                    border: "1px solid var(--tw-colors-slate-700)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend iconType="plainline" />
                <Line
                  type="monotone"
                  dataKey="المبيعات"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="الأرباح"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summaries Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Partners Summary */}
        <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-md">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-white/5 pb-3 text-slate-800 dark:text-slate-200">
            <Handshake className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            <h3 className="font-bold">ملخص الشركاء</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                عدد الشركاء
              </span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {data.partnersCount}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                إجمالي رأس المال
              </span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {data.partnersCapital.toLocaleString()} ج.م
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                أرباح الفترة التقديرية
              </span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {data.profitTotal.toLocaleString()} ج.م
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-md">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-white/5 pb-3 text-slate-800 dark:text-slate-200">
            <Package className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            <h3 className="font-bold">ملخص المخزون</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                أجهزة متاحة
              </span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {data.devicesCount}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                الإكسسوارات المتاحة
              </span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {data.accessoriesCount}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                قيمة المخزون الإجمالية
              </span>
              <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                {totalInventoryValue.toLocaleString()} ج.م
              </span>
            </div>
          </div>
        </div>

        {/* Sales Summary */}
        <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-md">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-white/5 pb-3 text-slate-800 dark:text-slate-200">
            <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            <h3 className="font-bold">ملخص مبيعات الفترة</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                إجمالي المبيعات
              </span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {data.salesTotal.toLocaleString()} ج.م
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                مبيعات الأجهزة
              </span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {data.revenueData[0]?.value.toLocaleString()} ج.م
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                صافي الربح التقديري
              </span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {data.profitTotal.toLocaleString()} ج.م
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-md flex-1">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                أفضل العملاء
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-slate-500 text-xs uppercase tracking-wider bg-slate-100 dark:bg-black/20">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-r-lg">الاسم</th>
                  <th className="py-3 px-4 font-medium text-center">
                    المعاملات
                  </th>
                  <th className="py-3 px-4 font-medium rounded-l-lg">
                    الإجمالي
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.topCustomers.map((c: any, i: number) => (
                  <tr
                    key={i}
                    className="hover:bg-white dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                      {c.count}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {c.total.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.topCustomers.length === 0 && (
            <div className="py-6 text-center text-slate-500 text-sm">
              لا توجد داتا كافية للعملاء
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-md flex-1">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                أفضل المنتجات مبيعاً
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-slate-500 text-xs uppercase tracking-wider bg-slate-100 dark:bg-black/20">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-r-lg">المنتج</th>
                  <th className="py-3 px-4 font-medium text-center">النوع</th>
                  <th className="py-3 px-4 font-medium text-center">الكمية</th>
                  <th className="py-3 px-4 font-medium rounded-l-lg">
                    الإيرادات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.topProducts.map((p: any, i: number) => (
                  <tr
                    key={i}
                    className="hover:bg-white dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderTypeTag(p.type)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                      {p.qty}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {p.revenue.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.topProducts.length === 0 && (
            <div className="py-6 text-center text-slate-500 text-sm">
              لا توجد داتا كافية للمنتجات
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
