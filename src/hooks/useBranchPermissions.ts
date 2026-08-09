import { useBranch } from "../contexts/BranchContext";

export function useBranchPermissions() {
  const { isOwner, isBranchManager, permissions, currentBranch } = useBranch();

  // If user is owner, they have all permissions
  if (isOwner) {
    return {
      canCreateEmployees: true,
      canDeleteEmployees: true,
      canViewReports: true,
      canManageInventory: true,
      canApproveTransfers: true,
      canEditPrices: true,
    };
  }

  // If user is a branch manager and permissions object exists for the current branch
  if (
    isBranchManager &&
    permissions &&
    permissions.branch_id === currentBranch?.id
  ) {
    return {
      canCreateEmployees: !!permissions.can_create_employees,
      canDeleteEmployees: !!permissions.can_delete_employees,
      canViewReports: !!permissions.can_view_reports,
      canManageInventory: !!permissions.can_manage_inventory,
      canApproveTransfers: !!permissions.can_approve_transfers,
      canEditPrices: !!permissions.can_edit_prices,
    };
  }

  // Regular staff / cashier defaults (Role = 3)
  // These could be strict static limits, or perhaps some basic functionality is allowed
  // For safety, only minimum features:
  return {
    canCreateEmployees: false,
    canDeleteEmployees: false,
    canViewReports: false,
    canManageInventory: false,
    canApproveTransfers: false,
    canEditPrices: false,
  };
}
