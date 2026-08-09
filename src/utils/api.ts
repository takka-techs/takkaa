export const apiFetch = async (
  url: string | URL | Request,
  options?: RequestInit,
): Promise<Response> => {
  let urlStr = url.toString();

  // Only intercept supabase calls
  if (urlStr.includes("supabase.co")) {
    let branchId = localStorage.getItem("takka_active_branch_id");
    const activeCashierStr = localStorage.getItem("active_cashier");
    let isOwner = localStorage.getItem("admin_active") === "true";

    if (activeCashierStr) {
      try {
        const user = JSON.parse(activeCashierStr);
        if (user.role_level === 1 || user.is_owner) {
          isOwner = true;
        } else if (!isOwner && (!branchId || branchId === '') && user.branch_id) {
          branchId = user.branch_id.toString();
        }
      } catch (e) {}
    }

    // We don't filter certain system tables
    const skipFilterTables = [
      "app_users",
      "branches",
      "branch_manager_permissions",
      "clients",
      "suppliers",
      "partners",
      "Devices",
      "Accessories",
      "spare_parts",
      "Installment_Settings",
      "cash_flow_forecast_view",
      "installment_contracts",
      "branch_transfers",
      "repair_logs",
      "Blacklist"
    ];
    const isSkipTable = skipFilterTables.some((t) => {
      // similar to main.tsx for robustness
      if (t === "rpc/" || t === "/auth/v1") return urlStr.includes(t);
      return urlStr.includes(`/rest/v1/${t}?`) || urlStr.endsWith(`/rest/v1/${t}`) || urlStr.includes(`/rest/v1/${t}&`);
    }) || urlStr.includes("bypass_branch=true");

    if (branchId && !isSkipTable) {
      const branchCol = urlStr.includes("/rest/v1/Repairs") ? "receiving_branch_id" : "branch_id";
      
      if (!options || options.method === "GET" || !options.method) {
        // For GET, add branch_id to query string
        if (urlStr.includes("?")) {
          // Append if missing, but be careful with complex queries
          // simplest: add to the end
          if (!urlStr.includes(`${branchCol}=eq.`)) {
            urlStr += `&${branchCol}=eq.${branchId}`;
          }
        } else {
          urlStr += `?${branchCol}=eq.${branchId}`;
        }
      } else if (
        options &&
        (options.method === "POST" || options.method === "PATCH")
      ) {
        // For POST/PATCH, inject branch_id into payload
        if (options.body && typeof options.body === "string") {
          try {
            let bodyData = JSON.parse(options.body);
            // In case of array of objects (bulk insert)
            if (Array.isArray(bodyData)) {
              bodyData = bodyData.map((item) => ({
                ...item,
                [branchCol]: item[branchCol] || branchId,
              }));
            } else {
              bodyData[branchCol] = bodyData[branchCol] || branchId;
            }
            options.body = JSON.stringify(bodyData);
          } catch (e) {
            // ignore parsing errors
          }
        }
      } else if (options && options.method === "DELETE") {
        // For DELETE, add branch_id to query to ensure they can't delete other branch's stuff
        // Except ifowner
        if (!isOwner) {
          if (urlStr.includes("?")) {
            if (!urlStr.includes(`${branchCol}=eq.`)) {
              urlStr += `&${branchCol}=eq.${branchId}`;
            }
          }
        }
      }
    }
  }

  // Remove backend-incompatible bypass markers from URL
  if (typeof urlStr === "string") {
    urlStr = urlStr
      .replace("&bypass_branch=true", "")
      .replace("?bypass_branch=true&", "?")
      .replace("?bypass_branch=true", "");
  }

  return fetch(urlStr, options);
};
