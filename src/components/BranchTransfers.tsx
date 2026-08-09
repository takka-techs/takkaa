import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowRightLeft,
  Building2,
  Package,
  Search,
  Check,
  X as CloseIcon,
  Loader2,
  Send,
} from "lucide-react";
import { useBranch } from "../contexts/BranchContext";
import { useBranchPermissions } from "../hooks/useBranchPermissions";
import { BranchTransfer, BranchTransferItem, Branch } from "../types/branch";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function BranchTransfers() {
  const { currentBranch, branches, isOwner, isBranchManager } = useBranch();
  const { canApproveTransfers } = useBranchPermissions();
  const [activeTab, setActiveTab] = useState<"list" | "new">("list");
  const [transfers, setTransfers] = useState<BranchTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Transfer State
  const [targetBranchId, setTargetBranchId] = useState("");
  const [transferItems, setTransferItems] = useState<BranchTransferItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryResults, setInventoryResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<
    "device" | "accessory" | "spare_part"
  >("device");

  const [allBranches, setAllBranches] = useState<any[]>([]);

  // Dialog States
  const [isQuantityOpen, setIsQuantityOpen] = useState(false);
  const [selectedItemToAdd, setSelectedItemToAdd] = useState<any>(null);
  const [quantityInput, setQuantityInput] = useState("1");

  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [transferToReceive, setTransferToReceive] = useState<BranchTransfer | null>(null);
  const [targetWarehouse, setTargetWarehouse] = useState<string>("");
  const [branchWarehouses, setBranchWarehouses] = useState<any[]>([]);

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [transferToReject, setTransferToReject] = useState<BranchTransfer | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  useEffect(() => {
    if (activeTab === "list" && (currentBranch || isOwner)) {
      fetchTransfers();
    }
  }, [activeTab, currentBranch, isOwner]);

  useEffect(() => {
    if (activeTab === "new" && currentBranch) {
      handleSearchInventory();
    }
  }, [activeTab, currentBranch, searchType]);

  useEffect(() => {
      if (currentBranch || isOwner) {
          fetchAllBranches();
      }
  }, [currentBranch, isOwner, branches]);

  const fetchAllBranches = async () => {
    try {
        const token = localStorage.getItem("access_token");
        const apiKey = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
        const baseUrl = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";
        
        let tenantId = currentBranch?.tenant_id;
        if (!tenantId && branches.length > 0) {
            tenantId = branches[0].tenant_id;
        }
        if (!tenantId) return;

        const res = await fetch(`${baseUrl}/branches?tenant_id=eq.${tenantId}`, {
           headers: { apikey: apiKey, Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
           const data = await res.json();
           setAllBranches(data);
        }
    } catch(err) {}
  };

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const apiKey = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
      const baseUrl = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";

      let endpoint = `${baseUrl}/branch_transfers?order=created_at.desc`;
      if (currentBranch) {
        endpoint = `${baseUrl}/branch_transfers?or=(from_branch_id.eq.${currentBranch.id},to_branch_id.eq.${currentBranch.id})&order=created_at.desc`;
      }

      const res = await fetch(endpoint, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        let data = await res.json();
        setTransfers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInventory = async () => {
    if (!currentBranch) return;
    setIsSearching(true);
    try {
      const token = localStorage.getItem("access_token");
      const apiKey = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
      const baseUrl = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";

      let endpoint = "";
      const searchStr = encodeURIComponent(inventorySearch.trim());
      
      if (searchType === "device") {
        endpoint = searchStr 
            ? `/Devices?branch_id=eq.${currentBranch.id}&or=(model.ilike.*${searchStr}*,company.ilike.*${searchStr}*,imei.ilike.*${searchStr}*,imei1.ilike.*${searchStr}*,imei2.ilike.*${searchStr}*)&status=eq.available&limit=20`
            : `/Devices?branch_id=eq.${currentBranch.id}&status=eq.available&limit=50`;
      } else if (searchType === "accessory") {
        endpoint = searchStr
            ? `/Accessories?branch_id=eq.${currentBranch.id}&or=(name.ilike.*${searchStr}*,barcode.ilike.*${searchStr}*)&quantity=gt.0&limit=20`
            : `/Accessories?branch_id=eq.${currentBranch.id}&quantity=gt.0&limit=50`;
      } else if (searchType === "spare_part") {
        endpoint = searchStr
            ? `/spare_parts?branch_id=eq.${currentBranch.id}&or=(name.ilike.*${searchStr}*,barcode.ilike.*${searchStr}*,sku.ilike.*${searchStr}*)&quantity=gt.0&limit=20`
            : `/spare_parts?branch_id=eq.${currentBranch.id}&quantity=gt.0&limit=50`;
      }

      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: { apikey: apiKey, Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setInventoryResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const addItemToTransfer = (item: any) => {
    // Check if already in list
    if (transferItems.find((i) => i.id === item.id && i.type === searchType))
      return;

    if (searchType !== "device") {
      setSelectedItemToAdd(item);
      setQuantityInput("1");
      setIsQuantityOpen(true);
      return;
    }

    const newItem: BranchTransferItem = {
      type: searchType,
      id: item.id,
      name: item.name || item.model || "بدون اسم",
      quantity: 1,
      imei: item.imei,
      original_data: item,
    };

    setTransferItems([...transferItems, newItem]);
  };

  const confirmAddItem = () => {
    if (!selectedItemToAdd) return;
    const transferQuantity = parseInt(quantityInput, 10);
    if (
      isNaN(transferQuantity) ||
      transferQuantity <= 0 ||
      transferQuantity > (selectedItemToAdd.quantity || 0)
    ) {
      alert("كمية غير صالحة");
      return;
    }
    const newItem: BranchTransferItem = {
      type: searchType,
      id: selectedItemToAdd.id,
      name: selectedItemToAdd.name || selectedItemToAdd.model || "بدون اسم",
      quantity: transferQuantity,
      imei: selectedItemToAdd.imei,
      original_data: selectedItemToAdd,
    };
    setTransferItems([...transferItems, newItem]);
    setIsQuantityOpen(false);
    setSelectedItemToAdd(null);
  };

  const removeItemFromTransfer = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const submitTransfer = async () => {
    if (!targetBranchId || transferItems.length === 0 || !currentBranch) {
      alert("الرجاء تعبئة جميع الحقول وإضافة منتجات للتحويل");
      return;
    }

    setIsSubmitting(true);
    try {
      const activeCashierStr = localStorage.getItem("active_cashier");
      const userId = activeCashierStr
        ? JSON.parse(activeCashierStr).id
        : localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");
      const apiKey = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
      const baseUrl = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";

      // UUID generation since it's required as PK by schema
      const uuid = crypto.randomUUID();

      const payload = {
        id: uuid,
        from_branch_id: currentBranch.id,
        to_branch_id: targetBranchId,
        requested_by: userId,
        status: "pending",
        items_payload: transferItems,
        notes: notes,
        tenant_id: currentBranch.tenant_id
      };

      const res = await fetch(`${baseUrl}/branch_transfers`, {
        method: "POST",
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation", // Make sure we wait for success
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // deduct quantities and mark devices instantly
        for (const item of transferItems) {
          if (item.type === "device") {
            await fetch(`${baseUrl}/Devices?id=eq.${item.id}`, {
              method: "PATCH",
              headers: {
                apikey: apiKey,
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "in_transit" }),
            });
          } else {
            const sourceTable =
              item.type === "accessory" ? "Accessories" : "spare_parts";
            const srcRes = await fetch(
              `${baseUrl}/${sourceTable}?id=eq.${item.id}`,
              {
                headers: {
                  apikey: apiKey,
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (srcRes.ok) {
              const srcData = await srcRes.json();
              if (srcData && srcData.length > 0) {
                const newQty = Math.max(
                  0,
                  (srcData[0].quantity || 0) - item.quantity
                );
                await fetch(`${baseUrl}/${sourceTable}?id=eq.${item.id}`, {
                  method: "PATCH",
                  headers: {
                    apikey: apiKey,
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ quantity: newQty }),
                });
              }
            }
          }
        }

        setActiveTab("list");
        setTransferItems([]);
        setTargetBranchId("");
        setNotes("");
        setInventoryResults([]);
        setInventorySearch("");
        fetchTransfers();
      } else {
        alert("حدث خطأ أثناء إرسال التحويل");
      }
    } catch (err) {
      console.error(err);
      alert("خطأ في الاتصال بالخادم");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReceiveModal = async (transfer: BranchTransfer) => {
      setTransferToReceive(transfer);
      setTargetWarehouse("");
      setIsReceiveOpen(true);
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/Warehouses?branch_id=eq.${transfer.to_branch_id}`, {
           headers: { apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa", Authorization: `Bearer ${token}` }
        });
        if(res.ok) setBranchWarehouses(await res.json());
      } catch(e) {}
  };

  const handleReceive = async () => {
    if (!transferToReceive) return;
    const transfer = transferToReceive;
    try {
      const token = localStorage.getItem("access_token");
      const apiKey = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
      const baseUrl = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";
      const headers = {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const activeCashierStr = localStorage.getItem("active_cashier");
      const userId = activeCashierStr
        ? JSON.parse(activeCashierStr).id
        : localStorage.getItem("user_id");

      // Processing items logically
      for (const item of transfer.items_payload) {
        if (item.type === "device") {
          // Move device branch_id
          const res = await fetch(`${baseUrl}/Devices?id=eq.${item.id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              branch_id: transfer.to_branch_id,
              warehouse_id: targetWarehouse || null,
              status: "available",
            }), // resetting warehouse to force assignment
          });
          if (!res.ok) throw new Error("Failed to receive device: " + await res.text());
        } else {
          const sourceTable =
            item.type === "accessory" ? "Accessories" : "spare_parts";

          // Fetch original source item to get full template details just in case it's new
          // (it might be deleted but we try to fetch it first)
          let originalItemConfig: any = item.original_data || null;
          try {
            const srcRes = await fetch(`${baseUrl}/${sourceTable}?id=eq.${item.id}`, { headers });
            if (srcRes.ok) {
               const data = await srcRes.json();
               if (data && data.length > 0) {
                   originalItemConfig = data[0];
               }
            }
          } catch(e) {}

          // Increase destination quantity or Create new
          const barcodeParam = originalItemConfig?.barcode ? `&barcode=eq.${encodeURIComponent(originalItemConfig.barcode)}` : `&name=eq.${encodeURIComponent(item.name)}`;
          const dstRes = await fetch(
            `${baseUrl}/${sourceTable}?branch_id=eq.${transfer.to_branch_id}${barcodeParam}`,
            { headers },
          );
          if (dstRes.ok) {
            const dstData = await dstRes.json();
            if (dstData && dstData.length > 0) {
              const match = dstData[0];
              const patchRes = await fetch(`${baseUrl}/${sourceTable}?id=eq.${match.id}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({
                  quantity: match.quantity + item.quantity,
                }),
              });
              if (!patchRes.ok) throw new Error("Failed to update qty: " + await patchRes.text());
            } else {
              // Create new item in destination using original's config if found
              if (originalItemConfig) {
                  const {
                    id,
                    created_at,
                    warehouse_id,
                    quantity,
                    user_id,
                    ...rest
                  } = originalItemConfig;
                  const insertRes = await fetch(`${baseUrl}/${sourceTable}`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                      ...rest,
                      quantity: item.quantity,
                      branch_id: transfer.to_branch_id,
                      warehouse_id: targetWarehouse || null,
                      user_id: userId,
                    }),
                  });
                  if (!insertRes.ok) throw new Error("Failed to insert item 1: " + await insertRes.text());
              } else {
                  // Fallback: minimal insert if original not found
                  const insertRes2 = await fetch(`${baseUrl}/${sourceTable}`, {
                      method: "POST",
                      headers,
                      body: JSON.stringify({
                         name: item.name,
                         quantity: item.quantity,
                         branch_id: transfer.to_branch_id,
                         warehouse_id: targetWarehouse || null,
                         tenant_id: (transfer as any).tenant_id || currentBranch?.tenant_id,
                         user_id: userId,
                      })
                  });
                  if (!insertRes2.ok) throw new Error("Failed to insert item 2: " + await insertRes2.text());
              }
            }
          } else {
             throw new Error("Failed to fetch dst: " + await dstRes.text());
          }
        }
      }

      // Mark transfer as received
      const finalRes = await fetch(`${baseUrl}/branch_transfers?id=eq.${transfer.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "received",
          received_at: new Date().toISOString(),
          received_by: userId,
        }),
      });
      if (!finalRes.ok) throw new Error("Failed to finalize transfer: " + await finalRes.text());

      setIsReceiveOpen(false);
      fetchTransfers();
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ أثناء الاستلام: " + err.message);
    }
  };

  const openRejectModal = (transfer: BranchTransfer) => {
    setTransferToReject(transfer);
    setRejectReasonInput("");
    setIsRejectOpen(true);
  };

  const handleReject = async () => {
    if (!transferToReject || !rejectReasonInput) return;
    const transfer = transferToReject;
    const reason = rejectReasonInput;
    try {
      const token = localStorage.getItem("access_token");
      const apiKey = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";
      const baseUrl = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";
      const headers = {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Revert quantities / device status back since it was deducted in submitTransfer
      for (const item of transfer.items_payload) {
        if (item.type === "device") {
          const res = await fetch(`${baseUrl}/Devices?id=eq.${item.id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: "available" }),
          });
          if (!res.ok) throw new Error("Failed to reject device: " + await res.text());
        } else {
          const sourceTable = item.type === "accessory" ? "Accessories" : "spare_parts";
          let exists = false;
          let currentQty = 0;
          try {
            const srcRes = await fetch(`${baseUrl}/${sourceTable}?id=eq.${item.id}`, { headers });
            if (srcRes.ok) {
              const data = await srcRes.json();
              if (data && data.length > 0) {
                exists = true;
                currentQty = data[0].quantity;
              }
            }
          } catch(e) {}

          if (exists) {
              const r = await fetch(`${baseUrl}/${sourceTable}?id=eq.${item.id}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ quantity: currentQty + item.quantity }),
              });
              if (!r.ok) throw new Error("Failed to revert qty: " + await r.text());
          } else if (item.original_data) {
              // Reinsert it
              const { id, created_at, ...rest } = item.original_data;
              const r = await fetch(`${baseUrl}/${sourceTable}?on_conflict=id`, {
                method: "POST",
                headers: { ...headers, "Prefer": "resolution=merge-duplicates" },
                body: JSON.stringify({ ...rest, quantity: item.quantity, id: item.id }),
              });
              if (!r.ok) throw new Error("Failed to reinsert qty: " + await r.text());
          }
        }
      }

      const f = await fetch(`${baseUrl}/branch_transfers?id=eq.${transfer.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "rejected",
          rejection_reason: reason,
        }),
      });
      if (!f.ok) throw new Error("Failed to mark rejected: " + await f.text());

      setIsRejectOpen(false);
      fetchTransfers();
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ: " + err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            تحويلات الفروع
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            إدارة حركة المنتجات والأجهزة بين فروع النظام
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-[#11151c] p-1 rounded-xl border border-slate-200 dark:border-white/5">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "list"
                ? "bg-white dark:bg-[#080c13] text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            السجل
          </button>
          <button
            onClick={() => {
              if (!currentBranch) {
                alert("الرجاء تحديد فرع من القائمة الجانبية لإنشاء تحويل.");
                return;
              }
              setActiveTab("new");
            }}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "new"
                ? "bg-white dark:bg-[#080c13] text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Send className="w-4 h-4" /> طلب تحويل
          </button>
        </div>
      </div>

      {activeTab === "new" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 p-6 rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  إلى فرع
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                >
                  <option value="">اختر الفرع الوجهة...</option>
                  {allBranches
                    .filter((b) => b.id !== currentBranch?.id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  ملاحظات التحويل (اختياري)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="سبب التحويل أو ملاحظات إضافية"
                  className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Selection */}
            <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 p-6 rounded-3xl flex flex-col h-[500px]">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                البحث عن المنتجات
              </h3>
              <div className="flex gap-2 mb-4">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
                >
                  <option value="device">جهاز مباع/جديد</option>
                  <option value="accessory">إكسسوار</option>
                  <option value="spare_part">قطعة غيار</option>
                </select>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchInventory()
                    }
                    placeholder="بحث بالاسم، أو السيريال..."
                    className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white outline-none"
                  />
                  <button
                    onClick={handleSearchInventory}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-indigo-500"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0b101a]">
                {inventoryResults.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-white/5 last:border-0 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        {item.name || item.model}
                      </p>
                      {item.imei && (
                        <p className="text-xs text-slate-500 font-mono">
                          IMEI: {item.imei}
                        </p>
                      )}
                      {item.quantity !== undefined && (
                        <p className="text-xs text-indigo-500">
                          الكمية المتاحة: {item.quantity}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => addItemToTransfer(item)}
                      className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 rounded-lg"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {inventoryResults.length === 0 && !isSearching && (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    لا توجد نتائج للبحث
                  </div>
                )}
              </div>
            </div>

            {/* Selected Items */}
            <div className="bg-slate-900 dark:bg-[#080c13] p-6 rounded-3xl flex flex-col h-[500px] border border-slate-800">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                المنتجات المحددة للتحويل ({transferItems.length})
              </h3>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                {transferItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800 dark:bg-white/5 p-3 rounded-xl flex items-center justify-between border border-slate-700 dark:border-white/5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                          {item.type === "device"
                            ? "جهاز"
                            : item.type === "accessory"
                              ? "إكسسوار"
                              : "قطعة"}
                        </span>
                        <p className="text-sm font-bold text-white">
                          {item.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        {item.quantity > 1 && (
                          <span className="text-xs text-emerald-400 font-mono">
                            الكمية: {item.quantity}
                          </span>
                        )}
                        {item.imei && (
                          <span className="text-xs text-slate-400 font-mono">
                            IMEI: {item.imei}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItemFromTransfer(idx)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {transferItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-8 text-slate-500 h-full">
                    <Package className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">لم يتم تحديد أي منتجات للنقل</p>
                  </div>
                )}
              </div>

              <button
                onClick={submitTransfer}
                disabled={
                  isSubmitting || transferItems.length === 0 || !targetBranchId
                }
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                إرسال التحويل المخزني
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "list" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
            {isLoading ? (
              <div className="flex justify-center p-20">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : transfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                <ArrowRightLeft className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-bold">لا يوجد تحويلات مسجلة</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-start whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        رقم / تاريخ
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        الاتجاه
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        المنتجات
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        الحالة
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        إجراء
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {transfers.map((tx) => {
                      const isIncoming = currentBranch
                        ? tx.to_branch_id === currentBranch.id
                        : branches.some((b) => b.id === tx.to_branch_id);
                      const otherBranchName =
                        allBranches.find(
                          (b) => b.id === (isIncoming ? tx.from_branch_id : tx.to_branch_id)
                        )?.name || "مجهول";

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-mono text-slate-900 dark:text-white leading-tight">
                              #{tx.id.split("-")[0]}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {format(
                                new Date(tx.created_at),
                                "dd MMM yyyy - hh:mm a",
                                { locale: ar },
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-bold inline-block border ${isIncoming ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400"}`}
                            >
                              {isIncoming ? "واردة من " : "صادرة إلى "}{" "}
                              {otherBranchName}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {tx.items_payload.length} أصناف
                              </span>
                              <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                {tx.items_payload.map((i) => i.name).join(", ")}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              {tx.status === "pending" && (
                                <span className="bg-amber-100 text-amber-700 px-2 py-1 flex items-center justify-center rounded text-xs font-bold w-fit">
                                  قيد الانتظار
                                </span>
                              )}
                              {tx.status === "received" && (
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center w-fit">
                                  مستلم
                                </span>
                              )}
                              {tx.status === "rejected" && (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center w-fit">
                                  مرفوض
                                </span>
                              )}
                              {tx.status === "rejected" && tx.rejection_reason && (
                                <span className="text-[10px] text-red-500 whitespace-nowrap mt-1 font-medium">السبب: {tx.rejection_reason}</span>
                              )}
                              {tx.notes && (
                                <span className="text-[10px] text-slate-500 whitespace-nowrap mt-1 font-medium italic">ملاحظة: {tx.notes}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {(isOwner || (isIncoming && (isBranchManager || canApproveTransfers))) &&
                            tx.status === "pending" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openReceiveModal(tx)}
                                  className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                                >
                                  استلام
                                </button>
                                <button
                                  onClick={() => openRejectModal(tx)}
                                  className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-600 transition-colors"
                                >
                                  رفض
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quantity Modal */}
      {isQuantityOpen && selectedItemToAdd && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#11151c] w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                تحديد الكمية المراد نقلها
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                الكمية المتاحة: {selectedItemToAdd.quantity || 0}
              </p>
              <input
                type="number"
                min="1"
                max={selectedItemToAdd.quantity || 1}
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => setIsQuantityOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmAddItem}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
              >
                إضافة للتحويل
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Receive Modal */}
      {isReceiveOpen && transferToReceive && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#11151c] w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                استلام التحويل المخزني
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                يرجى تحديد المخزن الذي سيتم إيداع المنتجات فيه لكي تظهر بالفرع.
              </p>
              
              <select
                value={targetWarehouse}
                onChange={(e) => setTargetWarehouse(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              >
                <option value="">اختر المخزن...</option>
                {branchWarehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => setIsReceiveOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleReceive}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:bg-slate-300 disabled:shadow-none"
              >
                تأكيد الاستلام
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectOpen && transferToReject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#11151c] w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                رفض التحويل
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                يرجى كتابة سبب رفض هذا التحويل لإشعار الفرع المُرسل.
              </p>
              <input
                type="text"
                placeholder="سبب الرفض..."
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b101a] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => setIsRejectOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                إلغاء
              </button>
              <button
                disabled={!rejectReasonInput}
                onClick={handleReject}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:bg-slate-300 disabled:shadow-none"
              >
                تأكيد الرفض
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
