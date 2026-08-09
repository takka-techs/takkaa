import React, { createContext, useContext, useState, useEffect } from "react";
import { Branch, BranchManagerPermissions } from "../types/branch";

interface BranchContextType {
  currentBranchId: string;
  currentBranch: Branch | null;
  branches: Branch[];
  switchBranch: (branchId: string) => void;
  canSwitchBranch: boolean;
  isOwner: boolean;
  isBranchManager: boolean;
  isLoading: boolean;
  permissions: BranchManagerPermissions | null;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const SUPABASE_URL = "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1";
const SUPABASE_API_KEY = "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa";

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [currentBranchId, setCurrentBranchId] = useState<string>("");
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [canSwitchBranch, setCanSwitchBranch] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isBranchManager, setIsBranchManager] = useState(false);
  const [permissions, setPermissions] =
    useState<BranchManagerPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBranchContext();
    window.addEventListener("login_state_changed", loadBranchContext);
    return () =>
      window.removeEventListener("login_state_changed", loadBranchContext);
  }, []);

  const loadBranchContext = async () => {
    setIsLoading(true);
    try {
      const activeCashierStr = localStorage.getItem("active_cashier");
      const activeCashier = activeCashierStr
        ? JSON.parse(activeCashierStr)
        : null;
      const isAdminActive = localStorage.getItem("admin_active") === "true";
      const token = localStorage.getItem("access_token");
      const userId = localStorage.getItem("user_id");

      if (!token || !userId) {
        setBranches([]);
        setCurrentBranch(null);
        setIsLoading(false);
        return;
      }

      const headers = {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${token}`,
      };

      if (isAdminActive) {
        setIsOwner(true);
        setCanSwitchBranch(true);
        setIsBranchManager(false);

        let tenantId = activeCashier?.tenant_id || userId;
        
        // Double check for actual tenant id
        if (!activeCashier?.tenant_id && userId) {
            try {
                const uRes = await fetch(`${SUPABASE_URL}/app_users?user_id=eq.${userId}&select=tenant_id`, { headers });
                if (uRes.ok) {
                    const uData = await uRes.json();
                    if (uData && uData.length > 0 && uData[0].tenant_id) {
                        tenantId = uData[0].tenant_id;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch accurate tenant_id", e);
            }
        }
        
        // Fetch all branches for the tenant
        const res = await fetch(
          `${SUPABASE_URL}/branches?tenant_id=eq.${tenantId}&order=created_at.asc`,
          { headers },
        );
        if (res.ok) {
          const allBranches = await res.json();
          if (allBranches && allBranches.length > 0) {
            setBranches(allBranches);
            // Default to previously selected branch or empty (all branches)
            let savedBranchId = localStorage.getItem("takka_active_branch_id");
            if (savedBranchId === null) {
              savedBranchId = ""; // Default to all branches
            }

            if (savedBranchId === "") {
               setCurrentBranchId("");
               setCurrentBranch(null);
               localStorage.setItem("takka_active_branch_id", "");
            } else {
              const targetBranch =
                allBranches.find((b: Branch) => b.id === savedBranchId) ||
                allBranches.find((b: Branch) => b.is_active) ||
                allBranches[0];
              setCurrentBranchId(targetBranch.id);
              setCurrentBranch(targetBranch);
              localStorage.setItem("takka_active_branch_id", targetBranch.id);
            }
          }
        }
      } else if (activeCashier) {
        // Evaluate role
        const roleLevel = activeCashier.role_level || 3; // 1 = Owner, 2 = Branch Manager, 3 = Cashier

        if (roleLevel === 1) {
          setIsOwner(true);
          setCanSwitchBranch(true);
          setIsBranchManager(false);

          let tenantId = activeCashier.tenant_id || userId;
          
          const res = await fetch(
            `${SUPABASE_URL}/branches?tenant_id=eq.${tenantId}`,
            { headers },
          );
          if (res.ok) {
            const allBranches = await res.json();
            if (allBranches && allBranches.length > 0) {
              setBranches(allBranches);
              let savedBranchId = localStorage.getItem("takka_active_branch_id");
              if (savedBranchId === null) {
                savedBranchId = "";
              }

              if (savedBranchId === "") {
                setCurrentBranchId("");
                setCurrentBranch(null);
              } else {
                const targetBranch =
                  allBranches.find((b: Branch) => b.id === savedBranchId) ||
                  allBranches[0];
                setCurrentBranchId(targetBranch.id);
                setCurrentBranch(targetBranch);
                localStorage.setItem("takka_active_branch_id", targetBranch.id);
              }
            } else {
                setBranches([]);
                setCurrentBranchId("");
                setCurrentBranch(null);
            }
          }
        } else if (roleLevel === 2) {
          setIsBranchManager(true);
          setIsOwner(false);
          // Branch manager can access their own branch + any authorized ones
          const res = await fetch(
            `${SUPABASE_URL}/branch_manager_permissions?user_id=eq.${activeCashier.id}&select=*,branches(*)`,
            { headers },
          );
          let userBranches: Branch[] = [];

          if (activeCashier.branch_id) {
            const bRes = await fetch(
              `${SUPABASE_URL}/branches?id=eq.${activeCashier.branch_id}`,
              { headers },
            );
            if (bRes.ok) {
              const bData = await bRes.json();
              if (bData.length > 0) userBranches.push(bData[0]);
            }
          }

          if (res.ok) {
            const perms = await res.json();
            if (perms && perms.length > 0) {
              setPermissions(
                perms.find(
                  (p: any) => p.branch_id === activeCashier.branch_id,
                ) || perms[0],
              );
              const permBranches = perms
                .map((p: any) => p.branches)
                .filter(Boolean);
              permBranches.forEach((pb: Branch) => {
                if (!userBranches.find((ub) => ub.id === pb.id)) {
                  userBranches.push(pb);
                }
              });
            }
          }

          setBranches(userBranches);
          setCanSwitchBranch(userBranches.length > 1);

          let savedBranchId = localStorage.getItem("takka_active_branch_id");
          if (savedBranchId === null && userBranches.length > 1) {
             savedBranchId = "";
          }

          if (savedBranchId === "") {
             setCurrentBranchId("");
             setCurrentBranch(null);
             localStorage.setItem("takka_active_branch_id", "");
          } else {
            const targetBranch =
              userBranches.find((b) => b.id === savedBranchId) || userBranches[0];

            if (targetBranch) {
              setCurrentBranchId(targetBranch.id);
              setCurrentBranch(targetBranch);
              localStorage.setItem("takka_active_branch_id", targetBranch.id);
            }
          }
        } else {
          // Cashier (role_level 3)
          setIsOwner(false);
          setIsBranchManager(false);
          setCanSwitchBranch(false);

          if (activeCashier.branch_id) {
            setCurrentBranchId(activeCashier.branch_id);
            localStorage.setItem(
              "takka_active_branch_id",
              activeCashier.branch_id,
            );

            const bRes = await fetch(
              `${SUPABASE_URL}/branches?id=eq.${activeCashier.branch_id}`,
              { headers },
            );
            if (bRes.ok) {
              const bData = await bRes.json();
              if (bData.length > 0) {
                setBranches([bData[0]]);
                setCurrentBranch(bData[0]);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading branch context:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchBranch = async (branchId: string) => {
    if (!canSwitchBranch) return;
    
    if (branchId === "") {
      setCurrentBranchId("");
      setCurrentBranch(null);
      localStorage.setItem("takka_active_branch_id", "");
      setPermissions(null); // All branches means owner or multi-branch manager view
      window.dispatchEvent(new CustomEvent("branch_switched", { detail: "" }));
      return;
    }

    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      setCurrentBranchId(branch.id);
      setCurrentBranch(branch);
      localStorage.setItem("takka_active_branch_id", branch.id);

      // Update permissions if branch manager
      if (isBranchManager) {
        const activeCashierStr = localStorage.getItem("active_cashier");
        const activeCashier = activeCashierStr
          ? JSON.parse(activeCashierStr)
          : null;
        const token = localStorage.getItem("access_token");
        if (activeCashier && token) {
          const headers = {
            apikey: SUPABASE_API_KEY,
            Authorization: `Bearer ${token}`,
          };
          const res = await fetch(
            `${SUPABASE_URL}/branch_manager_permissions?user_id=eq.${activeCashier.id}&branch_id=eq.${branch.id}`,
            { headers },
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) setPermissions(data[0]);
          }
        }
      }

      // Disperse event so that components refetch their data
      window.dispatchEvent(
        new CustomEvent("branch_switched", { detail: branchId }),
      );
    }
  };

  return (
    <BranchContext.Provider
      value={{
        currentBranchId,
        currentBranch,
        branches,
        switchBranch,
        canSwitchBranch,
        isOwner,
        isBranchManager,
        isLoading,
        permissions,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
