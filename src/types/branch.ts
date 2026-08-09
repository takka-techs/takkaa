export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  address?: string;
  phone?: string;
  logo_url?: string;
  invoice_header?: string;
  invoice_footer?: string;
  is_active: boolean;
  created_at: string;
}

export interface BranchManagerPermissions {
  id: string;
  branch_id: string;
  user_id: string;
  can_create_employees: boolean;
  can_delete_employees: boolean;
  can_view_reports: boolean;
  can_manage_inventory: boolean;
  can_approve_transfers: boolean;
  can_edit_prices: boolean;
}

export interface BranchTransfer {
  id: string;
  from_branch_id: string;
  to_branch_id: string;
  requested_by?: string;
  status: 'pending' | 'in_transit' | 'received' | 'rejected';
  items_payload: BranchTransferItem[];
  shipped_at?: string;
  received_at?: string;
  received_by?: string;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface BranchTransferItem {
  type: 'device' | 'accessory' | 'spare_part';
  id: number | string;
  name: string;
  quantity: number;
  imei?: string;
  original_data?: any;
}

export interface CrossBranchSettlement {
  id: string;
  payment_id: string;
  contract_branch_id: string;
  collecting_branch_id: string;
  amount: number;
  settled: boolean;
  settled_at?: string;
  notes?: string;
  created_at: string;
}
