import { get, set, update } from 'idb-keyval';

export interface OfflineRequest {
  id: string;
  url: string;
  method: string;
  headers?: any;
  body?: any;
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'takka_offline_sync_queue';
const CACHE_PREFIX = 'takka_cache_';

// In-memory tracker for items sold/modified offline this session.
// Persisted to sessionStorage so it survives minor re-renders but resets on app restart.
// Structure: { "Devices:123": { status: "sold" }, "Accessories:456": { quantityDelta: -2 } }
const SOLD_KEY = 'takka_offline_sold';

function loadSoldMap(): Record<string, any> {
  try { return JSON.parse(sessionStorage.getItem(SOLD_KEY) || '{}'); } catch { return {}; }
}
function saveSoldMap(map: Record<string, any>) {
  try { sessionStorage.setItem(SOLD_KEY, JSON.stringify(map)); } catch {}
}
function clearSoldMap() {
  try { sessionStorage.removeItem(SOLD_KEY); } catch {}
}


export const offlineManager = {
  // Add a request to the sync queue
  async enqueueRequest(url: string, method: string, headers: any, body: any) {
    const newReq: OfflineRequest = {
      id: crypto.randomUUID(),
      url,
      method,
      headers,
      body,
      timestamp: Date.now()
    };
    
    await update(SYNC_QUEUE_KEY, (val: any) => {
      const queue = val || [];
      queue.push(newReq);
      return queue;
    });
    
    window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: await this.getQueueCount() } }));
  },
  
  // Get all queued requests
  async getQueue(): Promise<OfflineRequest[]> {
    return (await get(SYNC_QUEUE_KEY)) || [];
  },
  
  // Get queue length
  async getQueueCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  },

  // Clear a specific request
  async removeRequest(id: string) {
    await update(SYNC_QUEUE_KEY, (val: any) => {
      const queue = val || [];
      return queue.filter((r: OfflineRequest) => r.id !== id);
    });
    window.dispatchEvent(new CustomEvent('offline_queue_updated', { detail: { count: await this.getQueueCount() } }));
  },

  // Cache a GET response
  async cacheResponse(url: string, responseData: any) {
    await set(`${CACHE_PREFIX}${url}`, responseData);
    // Also cache under canonical table key for reliable offline retrieval
    const tableName = this._getTableNameFromUrl(url);
    if (tableName) {
      await set(`${CACHE_PREFIX}canonical_${tableName}`, responseData);
    }
  },

  // Get cached response — tries exact match first, then canonical key, then fuzzy search.
  // Automatically applies offline sold/quantity changes AND URL query filters.
  async getCachedResponse(url: string): Promise<any> {
    const tableName = this._getTableNameFromUrl(url);

    // Raw data from cache (try exact → canonical → fuzzy)
    let data: any;
    const exact = await get(`${CACHE_PREFIX}${url}`);
    if (exact !== undefined) {
      data = exact;
    } else if (tableName) {
      const canonical = await get(`${CACHE_PREFIX}canonical_${tableName}`);
      if (canonical !== undefined) {
        data = canonical;
      } else {
        const allKeys = await import('idb-keyval').then(m => m.keys());
        const matching = allKeys.filter(k =>
          typeof k === 'string' &&
          k.startsWith(CACHE_PREFIX) &&
          k.includes(`/rest/v1/${tableName}`)
        );
        if (matching.length > 0) data = await get(matching[0] as string);
      }
    }

    if (!Array.isArray(data)) return data;

    // ── Apply URL query filters to canonical data ──────────────────────────
    // e.g. wallets?id=eq.5 → return only the wallet with id=5
    // e.g. Devices?status=eq.available → return only available devices
    try {
      const parsed = new URL(url);
      parsed.searchParams.forEach((value, key) => {
        // Skip non-filter params
        if (['select', 'order', 'limit', 'offset', 'tenant_id'].includes(key)) return;
        // Handle eq. filter  e.g. id=eq.5
        if (value.startsWith('eq.')) {
          const filterVal = value.slice(3);
          data = data.filter((item: any) => {
            if (item[key] === undefined) return true; // can't filter, keep
            return String(item[key]) === String(filterVal);
          });
        }
        // Handle gt. filter  e.g. quantity=gt.0
        if (value.startsWith('gt.')) {
          const filterVal = Number(value.slice(3));
          data = data.filter((item: any) => {
            if (item[key] === undefined) return true;
            return Number(item[key]) > filterVal;
          });
        }
        // Handle gte. filter
        if (value.startsWith('gte.')) {
          const filterVal = Number(value.slice(4));
          data = data.filter((item: any) => {
            if (item[key] === undefined) return true;
            return Number(item[key]) >= filterVal;
          });
        }
      });
    } catch (e) { /* not a full URL, skip filter */ }

    if (!tableName) return data;

    // ── Apply offline sold/quantity changes ────────────────────────────────
    const soldMap = loadSoldMap();
    if (Object.keys(soldMap).length === 0) return data;

    return data
      .map((item: any) => {
        const key = `${tableName}:${item.id}`;
        const change = soldMap[key];
        if (!change) return item;
        if (change.status) return { ...item, status: change.status };
        if (change.quantityDelta !== undefined) {
          return { ...item, quantity: Math.max(0, (item.quantity || 0) + change.quantityDelta) };
        }
        return item;
      })
      .filter((item: any) => {
        const key = `${tableName}:${item.id}`;
        const change = soldMap[key];
        if (!change) return true;
        if (change.status === 'sold' || change.status === 'sold_installment') return false;
        if (change.quantityDelta !== undefined) {
          const newQty = Math.max(0, (item.quantity || 0) + change.quantityDelta);
          return newQty > 0;
        }
        return true;
      });
  },

  // Record an offline sale so getCachedResponse always returns filtered data
  recordOfflineSale(cartItems: Array<{ id: number | string, type: string, cartQuantity: number }>) {
    const soldMap = loadSoldMap();
    for (const item of cartItems) {
      const tableMap: Record<string, string> = {
        'device': 'Devices',
        'accessory': 'Accessories',
        'spare_part': 'spare_parts'
      };
      const tbl = tableMap[item.type];
      if (!tbl) continue;
      const key = `${tbl}:${item.id}`;
      if (item.type === 'device') {
        soldMap[key] = { status: 'sold' };
      } else {
        const existing = soldMap[key]?.quantityDelta || 0;
        soldMap[key] = { quantityDelta: existing - item.cartQuantity };
      }
    }
    saveSoldMap(soldMap);
  },

  // Extract table name from PostgREST URL
  _getTableNameFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/rest\/v1\/([^/]+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },

  // Optimistically update the cache based on POST/PATCH payload
  async updateCacheOptimistically(url: string, method: string, body: any): Promise<any> {
    if (!body || (method !== 'POST' && method !== 'PATCH')) return [{ success: true, _offline: true }];
    
    let parsedBody: any = null;
    try {
      parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch(e) { return [{ success: true, _offline: true }]; }

    const tableName = this._getTableNameFromUrl(url);
    if (!tableName) return [{ success: true, _offline: true }];

    // Try to extract ID from URL if PATCH
    let targetId: any = null;
    if (method === 'PATCH') {
       const urlObj = new URL(url);
       const idParam = urlObj.searchParams.get('id');
       if (idParam && idParam.startsWith('eq.')) {
          targetId = idParam.replace('eq.', '');
       } else if (parsedBody.id) {
          targetId = parsedBody.id;
       }
    }

    // Also collect canonical key for this table
    const canonicalKey = `${CACHE_PREFIX}canonical_${tableName}`;

    const allKeys = await import('idb-keyval').then(m => m.keys());
    const tableCacheKeys = allKeys.filter(k => 
      typeof k === 'string' && 
      k.startsWith(CACHE_PREFIX) && 
      (k.includes(`/rest/v1/${tableName}`) || k === canonicalKey)
    );

    let returnObject: any = null;

    for (const key of tableCacheKeys) {
      try {
        const cachedData: any = await get(key as string);
        if (Array.isArray(cachedData)) {
          let updatedData = [...cachedData];
          
          if (method === 'PATCH' && targetId) {
             // Find and update existing
             const index = updatedData.findIndex((item: any) => String(item.id) === String(targetId));
             if (index !== -1) {
                updatedData[index] = { ...updatedData[index], ...parsedBody };
                returnObject = [updatedData[index]];
                
                const strKey = String(key);
                const isSold = updatedData[index].status === 'sold' || updatedData[index].status === 'sold_installment';
                const isOutOfStock = Number(updatedData[index].quantity) <= 0;
                
                // Remove sold devices from ANY Devices cache (including canonical)
                if ((tableName === 'Devices') && isSold) {
                   updatedData.splice(index, 1);
                // Remove out-of-stock accessories from cache
                } else if ((tableName === 'Accessories' || tableName === 'spare_parts') && isOutOfStock) {
                   updatedData.splice(index, 1);
                // Legacy: remove if URL filter matches
                } else if (strKey.includes('status=eq.available') && isSold) {
                   updatedData.splice(index, 1);
                } else if (strKey.includes('.gt.0') && isOutOfStock) {
                   updatedData.splice(index, 1);
                }
                
             } else {
                returnObject = [{ ...parsedBody, id: targetId, _offline: true }];
             }
          } else if (method === 'POST') {
             // Append new
             const items = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
             const generatedItems: any[] = [];
             
             items.forEach(newItem => {
                if (!newItem.created_at) newItem.created_at = new Date().toISOString();
                
                // If it's a repair ticket and ticket_number is missing, generate a temp one
                if (tableName.toLowerCase() === 'repairs' && !newItem.ticket_number) {
                   newItem.ticket_number = `OFF-TCK-${Math.floor(Math.random() * 10000)}`;
                }
                
                generatedItems.push(newItem);
                updatedData = [newItem, ...updatedData];
             });
             returnObject = generatedItems;
          }
          
          await set(key as string, updatedData);
        }
      } catch(e) {}
    }

    return returnObject || (method === 'PATCH' ? [{ ...parsedBody, id: targetId }] : [{ ...parsedBody }]);
  },

  // Warm up cache on app startup — fetches fresh data when online, skips silently when offline
  async warmupCache(fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
    // ALL tables needed across the entire app (POS, Reports, Maintenance, Treasury, etc.)
    const tables = [
      // Inventory
      'Devices', 'Accessories', 'spare_parts',
      // Sales
      'Sales_Invoices', 'Sales_Items', 'Sales_Returns',
      // Maintenance / Repairs
      'Repairs', 'repair_logs',
      // Clients & Suppliers
      'clients', 'suppliers',
      // Finance
      'treasury_transactions', 'wallets', 'shifts',
      'expenses', 'general_purchases', 'general_sales',
      // Installments
      'installment_contracts', 'installment_payments',
      // HR
      'app_users', 'employees', 'attendance', 'leaves', 'salaries', 'loans',
      // Branches & Config
      'branches', 'Warehouses', 'branch_transfers',
      // Purchases
      'device_purchases', 'accessory_purchases', 'spare_part_purchases',
      'purchase_returns',
      // Partners & Commissions
      'partners', 'sales_commissions', 'maintenance_commissions',
      // Other
      'recharge_cards', 'reminders', 'Blacklist',
    ];

    if (!navigator.onLine) {
      console.log('[Offline Sync] Offline at startup — skipping warmup fetch, using cached data.');
      return;
    }

    console.log('[Offline Sync] Starting cache warmup...');
    
    const baseUrl = 'https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1';
    
    // Table-specific query overrides (to match what the app actually displays)
    const tableQueryOverrides: Record<string, string> = {
      // Only cache available, unlocked devices — matches fetchProducts filter exactly
      'Devices': `?select=*&or=(status.eq.available,status.is.null)&or=(is_locked_for_installment.eq.false,is_locked_for_installment.is.null)&order=created_at.desc&limit=5000`,
    };

    for (const table of tables) {
      try {
        // window.fetch goes through the interceptor which adds auth headers,
        // branch_id filter, and caches the response automatically.
        const qs = tableQueryOverrides[table] ?? `?select=*&order=created_at.desc&limit=5000`;
        const res = await window.fetch(`${baseUrl}/${table}${qs}`);
        if (res.ok) {
          try {
            const data = await res.clone().json();
            // Store under canonical key so offline fuzzy-match always finds it
            const { set: idbSet } = await import('idb-keyval');
            await idbSet(`${CACHE_PREFIX}canonical_${table}`, data);
          } catch(e) {}
        }
      } catch (err) {
        console.warn(`[Offline Sync] Failed to warm up table ${table}:`, err);
      }
    }
    
    console.log('[Offline Sync] Cache warmup complete.');
  },

  // Process the queue when back online
  async processQueue(fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
    if (!navigator.onLine) return;

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    console.log(`[Offline Sync] Starting sync of ${queue.length} items...`);

    // Map: offline_id (string) → real server id (string)
    // Used to fix invoice_id references in Sales_Items / installment_contracts
    const idMap = new Map<string, string>();

    for (const req of queue) {
      try {
        const rawBodyStr = req.body
          ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
          : undefined;

        let bodyStr = rawBodyStr;
        let offlineIdForThisReq: string | null = null;

        // ── Sales_Invoices POST ─────────────────────────────────────────────
        // Strip the offline-generated `id` so PostgREST auto-assigns the real one.
        // Keep it aside for the id mapping.
        if (bodyStr && req.method === 'POST' && req.url.includes('/Sales_Invoices')) {
          try {
            const parsed = JSON.parse(bodyStr);
            const obj = Array.isArray(parsed) ? parsed[0] : parsed;
            if (obj.id) {
              offlineIdForThisReq = String(obj.id);
              const { id: _removed, ...rest } = obj;
              bodyStr = JSON.stringify(Array.isArray(parsed) ? [rest] : rest);
            }
          } catch (e) {}
        }

        // ── Sales_Items POST ────────────────────────────────────────────────
        // Replace offline invoice_id with real server invoice_id.
        if (bodyStr && req.method === 'POST' && req.url.includes('/Sales_Items')) {
          try {
            const parsed = JSON.parse(bodyStr);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            let changed = false;
            items.forEach((item: any) => {
              const offlineInvId = String(item.invoice_id);
              if (idMap.has(offlineInvId)) {
                item.invoice_id = idMap.get(offlineInvId);
                changed = true;
              }
              // Also strip offline-generated item id
              if (item.id && String(item.id).startsWith('8')) {
                delete item.id;
                changed = true;
              }
            });
            if (changed) bodyStr = JSON.stringify(Array.isArray(parsed) ? items : items[0]);
          } catch (e) {}
        }

        // ── installment_contracts POST ──────────────────────────────────────
        if (bodyStr && req.method === 'POST' && req.url.includes('/installment_contracts')) {
          try {
            const parsed = JSON.parse(bodyStr);
            const obj = Array.isArray(parsed) ? parsed[0] : parsed;
            const offlineInvId = String(obj.invoice_id);
            if (idMap.has(offlineInvId)) {
              obj.invoice_id = idMap.get(offlineInvId);
              bodyStr = JSON.stringify(Array.isArray(parsed) ? [obj] : obj);
            }
          } catch (e) {}
        }

        // ── PATCH Devices/Accessories/spare_parts ──────────────────────────
        // Strip offline id from body if present (it's in the URL already)
        if (bodyStr && req.method === 'PATCH') {
          try {
            const parsed = JSON.parse(bodyStr);
            const obj = Array.isArray(parsed) ? parsed[0] : parsed;
            if (obj.id) {
              const { id: _removed, ...rest } = obj;
              bodyStr = JSON.stringify(Array.isArray(parsed) ? [rest] : rest);
            }
          } catch (e) {}
        }

        const init: RequestInit = {
          method: req.method,
          headers: { ...req.headers, 'Prefer': 'return=representation' },
          ...(bodyStr ? { body: bodyStr } : {})
        };

        const res = await fetchFn(req.url, init);

        if (res.ok) {
          // Capture real server ID for Sales_Invoices and build mapping
          if (offlineIdForThisReq && req.url.includes('/Sales_Invoices')) {
            try {
              const serverData = await res.clone().json();
              const serverInvoice = Array.isArray(serverData) ? serverData[0] : serverData;
              if (serverInvoice?.id) {
                idMap.set(offlineIdForThisReq, String(serverInvoice.id));
                console.log(`[Offline Sync] Invoice mapped: offline=${offlineIdForThisReq} → server=${serverInvoice.id}`);
              }
            } catch (e) {}
          }
          await this.removeRequest(req.id);

        } else if (res.status >= 400 && res.status < 500 && res.status !== 401 && res.status !== 403) {
          // Client-side error — drop to avoid permanently blocking the queue
          const errText = await res.text().catch(() => '');
          console.warn(`[Offline Sync] Dropping request (${res.status}) ${req.url}: ${errText}`);
          await this.removeRequest(req.id);

        } else if (res.status === 401 || res.status === 403) {
          console.warn('[Offline Sync] Auth error. Pausing queue.');
          break;
        }

      } catch (err) {
        console.error(`[Offline Sync] Failed request ${req.id}:`, err);
        break;
      }
    }

    // Do NOT clear soldMap here — clear it only after warmupCache refreshes
    // the canonical cache with server data. That way sold items stay filtered
    // during the window between sync and cache refresh.
    // clearSoldMap() is called from main.tsx after warmupCache completes.

    // Fire event so UI can refresh after sync
    window.dispatchEvent(new CustomEvent('offline_sync_complete'));
    console.log('[Offline Sync] Sync process finished.');
  }
};
