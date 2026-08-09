export const performBackup = async (onProgress?: (progress: number) => void) => {
  const tables = [
    'Accessories', 'Blacklist', 'Devices', 'Reminders', 'Repairs',
    'app_settings', 'app_users', 'app_users_backup', 'attendance',
    'audit_logs', 'branches', 'branches_users', 'capital', 'cash_register_shifts',
    'clients', 'company_capital', 'contracts', 'cost_settings', 'devices_import_errors',
    'employees', 'expense_categories', 'financial_transactions', 'has_branches',
    'initial_capital', 'installments', 'inventory_items', 'inventory_transactions',
    'invoice_settings', 'maintenance_invoices', 'notifications', 'partners',
    'pos_transactions', 'repairs2', 'salaries', 'sales_items_view',
    'shift_cash_logs', 'shift_transactions', 'spare_parts', 'store_config',
    'suppliers', 'takka_installments', 'tickets', 'transfer_requests',
    'wallets', 'warehouses', 'warranty_policies',
    'sales', 'sales_items', 'purchases', 'purchase_items', 'transactions',
    'Installment_Settings', 'shift_closures', 'Installment_Payments',
    'Installment_AuditLogs', 'expenses'
  ];

  const backupData: any = {};
  const token = localStorage.getItem('access_token');
  const API_KEY = 'sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa';
  const SUPABASE_URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co';

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    if (onProgress) onProgress(Math.floor((i / tables.length) * 100));
    
    const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('user_id');

    let fetchUrl = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=10000&tenant_id=eq.${tenantId}`;
    let response = await fetch(fetchUrl, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok && response.status === 400) {
      // Fallback to user_id
      fetchUrl = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=10000&user_id=eq.${tenantId}`;
      response = await fetch(fetchUrl, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok && response.status === 400) {
        // Fallback to no filter
        fetchUrl = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=10000`;
        response = await fetch(fetchUrl, {
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${token}`
          }
        });
      }
    }

    if (response.ok) {
      const rows = await response.json();
      if (rows && rows.length > 0) {
        backupData[table] = rows;
      }
    }
  }
  
  if (onProgress) onProgress(100);
  return backupData;
};

export const downloadBackupFile = (dataString: string) => {
  const blob = new Blob([dataString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Takka_Backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const handleAutoBackup = async () => {
  // Try to use electron API if available
  if ((window as any).electronAPI) {
    const backupPath = await (window as any).electronAPI.getBackupPath();
    if (backupPath) {
      const lastBackup = localStorage.getItem('last_auto_backup_date');
      const today = new Date().toISOString().split('T')[0];
      if (lastBackup !== today) {
        try {
          const data = await performBackup();
          const result = await (window as any).electronAPI.saveBackup(data);
          if (result.success) {
            localStorage.setItem('last_auto_backup_date', today);
            console.log('Auto backup completed successfully to', result.path);
          }
        } catch (e) {
          console.error("Auto backup failed", e);
        }
      }
    }
  }
};
