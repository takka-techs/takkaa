// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import App from "./App.tsx";
// import { SettingsProvider } from "./contexts/SettingsContext";
// import { BranchProvider } from "./contexts/BranchContext";
// import "./index.css";

// let refreshPromise: Promise<string | null> | null = null;

// // Branch payload injector
// const branchFetchIntercept = async (
//   input: RequestInfo | URL,
//   init?: RequestInit,
// ): Promise<Response> => {
//   let urlStr = input.toString();

//   if (urlStr.includes("supabase.co")) {
//     let branchId = localStorage.getItem("takka_active_branch_id");
//     const activeCashierStr = localStorage.getItem("active_cashier");
//     const isAdminActive = localStorage.getItem("admin_active") === "true";

//     // Determine if user is owner
//     let isOwner = isAdminActive;
//     if (activeCashierStr) {
//       try {
//         const user = JSON.parse(activeCashierStr);
//         if (user.role_level === 1 || user.is_owner) {
//           isOwner = true;
//         } else if (!isOwner && (!branchId || branchId === '') && user.branch_id) {
//           branchId = user.branch_id.toString();
//         }
//       } catch (e) {}
//     }

//     // Skip filtering on these tables
//     const skipFilterTables = [
//       "app_users",
//       "branches",
//       "branch_manager_permissions",
//       "clients",
//       "rpc/",
//       "/auth/v1",
//       "suppliers",
//       "partners",
//       "Devices",
//       "Accessories",
//       "spare_parts",
//       "Installment_Settings",
//       "cash_flow_forecast_view",
//       "installment_contracts",
//       "branch_transfers",
//       "repair_logs",
//       "Blacklist"
//     ];
//     // For RPC calls, some might need branch_id, but it's hard to append in query string since it invokes a function. Let's exclude rpc for now and handle explicitly if needed.
//     const isSkipTable = skipFilterTables.some((t) => {
//       if (t === "rpc/" || t === "/auth/v1") return urlStr.includes(t);
//       return urlStr.includes(`/rest/v1/${t}?`) || urlStr.endsWith(`/rest/v1/${t}`) || urlStr.includes(`/rest/v1/${t}&`);
//     }) || urlStr.includes("bypass_branch=true");

//     if (init && (init.method === "POST" || init.method === "PATCH")) {
//       const branchCol = urlStr.includes("v1/Repairs") ? "receiving_branch_id" : "branch_id";
//       if (init.body && typeof init.body === "string" && (!branchId || branchId === "")) {
//          try {
//            let bodyData = JSON.parse(init.body);
//            let modified = false;
//            if (Array.isArray(bodyData)) {
//               bodyData.forEach((item: any) => {
//                  if (item[branchCol] === "") { delete item[branchCol]; modified=true; }
//               });
//            } else {
//               if (bodyData[branchCol] === "") { delete bodyData[branchCol]; modified=true; }
//            }
//            if (modified) init.body = JSON.stringify(bodyData);
//          } catch(e) {}
//       }
//     }

//     if (branchId && !isSkipTable) {
//       const branchCol = urlStr.includes("v1/Repairs") ? "receiving_branch_id" : "branch_id";
      
//       if (!init || init.method === "GET" || !init.method) {
//         if (urlStr.includes("?")) {
//           if (!urlStr.includes(`${branchCol}=`)) {
//             urlStr += `&${branchCol}=eq.${branchId}`;
//           }
//         } else {
//           urlStr += `?${branchCol}=eq.${branchId}`;
//         }
//       } else if (init && (init.method === "POST" || init.method === "PATCH")) {
//         if (init.body && typeof init.body === "string") {
//           try {
//             let bodyData = JSON.parse(init.body);
//             // Apply branch_id if not present
//             if (Array.isArray(bodyData)) {
//               bodyData = bodyData.map((item: any) => ({
//                 ...item,
//                 [branchCol]: item[branchCol] || branchId,
//               }));
//             } else {
//               bodyData[branchCol] = bodyData[branchCol] || branchId;
//             }
//             init.body = JSON.stringify(bodyData);
//           } catch (e) {
//             // ignore parsing errors
//           }
//         }
//       } else if (init && init.method === "DELETE") {
//         if (!isOwner) {
//           if (urlStr.includes("?")) {
//             if (!urlStr.includes(`${branchCol}=`)) {
//               urlStr += `&${branchCol}=eq.${branchId}`;
//             }
//           } else {
//             urlStr += `?${branchCol}=eq.${branchId}`;
//           }
//         }
//       }
//     }
//   }

//   // Remove backend-incompatible bypass markers from URL before passing to PostgREST
//   if (typeof urlStr === "string") {
//     urlStr = urlStr
//       .replace("&bypass_branch=true", "")
//       .replace("?bypass_branch=true&", "?")
//       .replace("?bypass_branch=true", "");
//   }

//   // Use original fetch
//   let response = await _originalFetch(urlStr, init);

//   if (response.status === 401 && urlStr.includes("supabase.co") && !urlStr.includes("/auth/v1/")) {
//     const refreshToken = localStorage.getItem("refresh_token");
//     if (refreshToken) {
//       // Check if it's really an expired JWT
//       let isJwtError = false;
//       const resClone = response.clone();
//       try {
//         const body = await resClone.json();
//         if (body?.message === "JWT expired" || body?.error === "invalid_token" || body?.code === "PGRST303") {
//           isJwtError = true;
//         }
//       } catch(e) {}
      
//       const authHeader = response.headers.get("www-authenticate");
//       if (authHeader && authHeader.includes("invalid_token")) isJwtError = true;

//       // In PostgREST, "PGRST303" code is often used for JWT errors.
//       if (isJwtError || response.status === 401) {
//           if (!refreshPromise) {
//             refreshPromise = _originalFetch(
//               "https://hoohxkrrndtfpwsrnpyr.supabase.co/auth/v1/token?grant_type=refresh_token",
//               {
//                 method: "POST",
//                 headers: {
//                   "Content-Type": "application/json",
//                   apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//                 },
//                 body: JSON.stringify({ refresh_token: refreshToken }),
//               }
//             ).then(async (r: Response) => {
//                if (r.ok) {
//                  const data = await r.json();
//                  if (data.access_token) {
//                    localStorage.setItem("access_token", data.access_token);
//                    if (data.refresh_token) {
//                      localStorage.setItem("refresh_token", data.refresh_token);
//                    }
//                    return data.access_token;
//                  }
//                } else {
//                  if (r.status >= 400 && r.status < 500) {
//                     window.dispatchEvent(new Event('auth_expired'));
//                  }
//                }
//                return null;
//             }).catch(() => null).finally(() => {
//                refreshPromise = null;
//             });
//           }

//           const newAccessToken = await refreshPromise;
          
//           if (newAccessToken) {
//              const newInit = { ...init };
//              if (newInit.headers) {
//                if (newInit.headers instanceof Headers) {
//                  const newHeaders = new Headers(newInit.headers);
//                  newHeaders.set("Authorization", `Bearer ${newAccessToken}`);
//                  newInit.headers = newHeaders;
//                } else if (Array.isArray(newInit.headers)) {
//                  const newHeaders = newInit.headers.map(([k, v]) => k.toLowerCase() === 'authorization' ? [k as string, `Bearer ${newAccessToken}`] : [k, v]);
//                  newInit.headers = newHeaders as HeadersInit;
//                } else if (typeof newInit.headers === 'object') {
//                  newInit.headers = { ...newInit.headers } as any;
//                  for (const k of Object.keys(newInit.headers)) {
//                    if (k.toLowerCase() === 'authorization') {
//                      (newInit.headers as any)[k] = `Bearer ${newAccessToken}`;
//                    }
//                  }
//                  if (!Object.keys(newInit.headers).some(k => k.toLowerCase() === 'authorization')) {
//                    (newInit.headers as any)['Authorization'] = `Bearer ${newAccessToken}`;
//                  }
//                }
//              } else {
//                newInit.headers = { 'Authorization': `Bearer ${newAccessToken}` };
//              }
             
//              response = await _originalFetch(urlStr, newInit);
//           }
//       }
//     }
//   }

//   return response;
// };

// // Store real original fetch outside
// const _originalFetch = (window as any)._nativeFetch || window.fetch;
// (window as any)._nativeFetch = _originalFetch;

// try {
//   window.fetch = async (...args: any[]) => {
//     return branchFetchIntercept(args[0], args[1]);
//   };
// } catch (e) {
//   try {
//     Object.defineProperty(window, 'fetch', {
//       value: async (...args: any[]) => {
//         return branchFetchIntercept(args[0], args[1]);
//       },
//       configurable: true,
//       writable: true,
//     });
//   } catch(e2) {
//     console.warn("Failed to redefine window.fetch:", e2);
//   }
// }

// const originalAlert = window.alert;
// window.alert = (msg) => {
//   const container = document.createElement("div");
//   container.className =
//     "fixed top-4 right-4 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl z-[9999] flex items-center gap-3 transition-all transform duration-300 ease-in-out font-bold text-sm max-w-sm border border-slate-700";
//   container.dir = "rtl";

//   const icon = document.createElement("div");
//   icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

//   const text = document.createElement("span");
//   text.textContent = typeof msg === "string" ? msg : String(msg);

//   container.appendChild(icon);
//   container.appendChild(text);
//   document.body.appendChild(container);

//   container.style.opacity = "0";
//   container.style.transform = "translateX(20px)";

//   requestAnimationFrame(() => {
//     container.style.opacity = "1";
//     container.style.transform = "translateX(0)";
//   });

//   setTimeout(() => {
//     container.style.opacity = "0";
//     container.style.transform = "translateX(20px)";
//     setTimeout(() => container.remove(), 300);
//   }, 4000);
// };

// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//     <SettingsProvider>
//       <BranchProvider>
//         <App />
//       </BranchProvider>
//     </SettingsProvider>
//   </StrictMode>,
// );
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { SettingsProvider } from "./contexts/SettingsContext";
import { BranchProvider } from "./contexts/BranchContext";
import "./index.css";

let refreshPromise: Promise<string | null> | null = null;

// Branch payload injector
const branchFetchIntercept = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  let urlStr = input.toString();

  if (urlStr.includes("supabase.co")) {
    let branchId = localStorage.getItem("takka_active_branch_id");
    const activeCashierStr = localStorage.getItem("active_cashier");
    const isAdminActive = localStorage.getItem("admin_active") === "true";

    // Determine if user is owner
    let isOwner = isAdminActive;
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

    // Skip filtering on these tables
    const skipFilterTables = [
      "app_users",
      "branches",
      "branch_manager_permissions",
      "clients",
      "rpc/",
      "/auth/v1",
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
    // For RPC calls, some might need branch_id, but it's hard to append in query string since it invokes a function. Let's exclude rpc for now and handle explicitly if needed.
    const isSkipTable = skipFilterTables.some((t) => {
      if (t === "rpc/" || t === "/auth/v1") return urlStr.includes(t);
      return urlStr.includes(`/rest/v1/${t}?`) || urlStr.endsWith(`/rest/v1/${t}`) || urlStr.includes(`/rest/v1/${t}&`);
    }) || urlStr.includes("bypass_branch=true");

    if (init && (init.method === "POST" || init.method === "PATCH")) {
      const branchCol = urlStr.includes("v1/Repairs") ? "receiving_branch_id" : "branch_id";
      if (init.body && typeof init.body === "string" && (!branchId || branchId === "")) {
         try {
           let bodyData = JSON.parse(init.body);
           let modified = false;
           if (Array.isArray(bodyData)) {
              bodyData.forEach((item: any) => {
                 if (item[branchCol] === "") { delete item[branchCol]; modified=true; }
              });
           } else {
              if (bodyData[branchCol] === "") { delete bodyData[branchCol]; modified=true; }
           }
           if (modified) init.body = JSON.stringify(bodyData);
         } catch(e) {}
      }
    }

    if (branchId && !isSkipTable) {
      const branchCol = urlStr.includes("v1/Repairs") ? "receiving_branch_id" : "branch_id";
      
      if (!init || init.method === "GET" || !init.method) {
        if (urlStr.includes("?")) {
          if (!urlStr.includes(`${branchCol}=`)) {
            urlStr += `&${branchCol}=eq.${branchId}`;
          }
        } else {
          urlStr += `?${branchCol}=eq.${branchId}`;
        }
      } else if (init && (init.method === "POST" || init.method === "PATCH")) {
        if (init.body && typeof init.body === "string") {
          try {
            let bodyData = JSON.parse(init.body);
            // Apply branch_id if not present
            if (Array.isArray(bodyData)) {
              bodyData = bodyData.map((item: any) => ({
                ...item,
                [branchCol]: item[branchCol] || branchId,
              }));
            } else {
              bodyData[branchCol] = bodyData[branchCol] || branchId;
            }
            init.body = JSON.stringify(bodyData);
          } catch (e) {
            // ignore parsing errors
          }
        }
      } else if (init && init.method === "DELETE") {
        if (!isOwner) {
          if (urlStr.includes("?")) {
            if (!urlStr.includes(`${branchCol}=`)) {
              urlStr += `&${branchCol}=eq.${branchId}`;
            }
          } else {
            urlStr += `?${branchCol}=eq.${branchId}`;
          }
        }
      }
    }
  }

  // Remove backend-incompatible bypass markers from URL before passing to PostgREST
  if (typeof urlStr === "string") {
    urlStr = urlStr
      .replace("&bypass_branch=true", "")
      .replace("?bypass_branch=true&", "?")
      .replace("?bypass_branch=true", "");
  }

  // Use original fetch
  let response = await _originalFetch(urlStr, init);

  if (response.status === 401 && urlStr.includes("supabase.co") && !urlStr.includes("/auth/v1/")) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      // Check if it's really an expired JWT
      let isJwtError = false;
      const resClone = response.clone();
      try {
        const body = await resClone.json();
        if (body?.message === "JWT expired" || body?.error === "invalid_token" || body?.code === "PGRST303") {
          isJwtError = true;
        }
      } catch(e) {}
      
      const authHeader = response.headers.get("www-authenticate");
      if (authHeader && authHeader.includes("invalid_token")) isJwtError = true;

      // In PostgREST, "PGRST303" code is often used for JWT errors.
      if (isJwtError) {
          let sentToken = "";
          if (init && init.headers) {
             if (init.headers instanceof Headers) {
                sentToken = init.headers.get("Authorization") || "";
             } else if (Array.isArray(init.headers)) {
                const h = init.headers.find(([k]) => k.toLowerCase() === 'authorization');
                if (h) sentToken = h[1];
             } else if (typeof init.headers === 'object') {
                for (const k of Object.keys(init.headers)) {
                   if (k.toLowerCase() === 'authorization') sentToken = (init.headers as any)[k];
                }
             }
          }
          if (sentToken.startsWith("Bearer ")) sentToken = sentToken.substring(7);

          const currentToken = localStorage.getItem("access_token");
          
          let newAccessToken: string | null = null;
          
          // If the token in localStorage is DIFFERENT from the one we sent and failed,
          // it means another tab/request already refreshed it! We can just use it.
          if (sentToken && currentToken && sentToken !== currentToken) {
             newAccessToken = currentToken;
          } else {
             if (!refreshPromise) {
            refreshPromise = _originalFetch(
              "https://hoohxkrrndtfpwsrnpyr.supabase.co/auth/v1/token?grant_type=refresh_token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
              }
            ).then(async (r: Response) => {
               if (r.ok) {
                 const data = await r.json();
                 if (data.access_token) {
                   localStorage.setItem("access_token", data.access_token);
                   if (data.refresh_token) {
                     localStorage.setItem("refresh_token", data.refresh_token);
                   }
                   return data.access_token;
                 }
               } else {
                 if (r.status >= 400 && r.status < 500) {
                    window.dispatchEvent(new Event('auth_expired'));
                 }
               }
               return null;
            }).catch(() => null).finally(() => {
               refreshPromise = null;
            });
          }

          newAccessToken = await refreshPromise;
          }
          
          if (newAccessToken) {
             const newInit = { ...init };
             if (newInit.headers) {
               if (newInit.headers instanceof Headers) {
                 const newHeaders = new Headers(newInit.headers);
                 newHeaders.set("Authorization", `Bearer ${newAccessToken}`);
                 newInit.headers = newHeaders;
               } else if (Array.isArray(newInit.headers)) {
                 const newHeaders = newInit.headers.map(([k, v]) => k.toLowerCase() === 'authorization' ? [k as string, `Bearer ${newAccessToken}`] : [k, v]);
                 newInit.headers = newHeaders as HeadersInit;
               } else if (typeof newInit.headers === 'object') {
                 newInit.headers = { ...newInit.headers } as any;
                 for (const k of Object.keys(newInit.headers)) {
                   if (k.toLowerCase() === 'authorization') {
                     (newInit.headers as any)[k] = `Bearer ${newAccessToken}`;
                   }
                 }
                 if (!Object.keys(newInit.headers).some(k => k.toLowerCase() === 'authorization')) {
                   (newInit.headers as any)['Authorization'] = `Bearer ${newAccessToken}`;
                 }
               }
             } else {
               newInit.headers = { 'Authorization': `Bearer ${newAccessToken}` };
             }
             
             response = await _originalFetch(urlStr, newInit);
          }
      }
    }
  }

  return response;
};

// Store real original fetch outside
const _originalFetch = (window as any)._nativeFetch || window.fetch;
(window as any)._nativeFetch = _originalFetch;


try {
  const fetchDesc = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (fetchDesc && !fetchDesc.configurable && !fetchDesc.writable) {
    console.warn("window.fetch is not configurable or writable. Fetch intercept may not work.");
  } else {
    // Some environments define fetch as a getter only.
    Object.defineProperty(window, 'fetch', {
      value: async (...args: any[]) => {
        return branchFetchIntercept(args[0], args[1]);
      },
      configurable: true,
      writable: true,
    });
  }
} catch (e) {
  console.warn("Failed to redefine window.fetch:", e);
}


const originalAlert = window.alert;
window.alert = (msg) => {
  const container = document.createElement("div");
  container.className =
    "fixed top-4 right-4 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl z-[9999] flex items-center gap-3 transition-all transform duration-300 ease-in-out font-bold text-sm max-w-sm border border-slate-700";
  container.dir = "rtl";

  const icon = document.createElement("div");
  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

  const text = document.createElement("span");
  text.textContent = typeof msg === "string" ? msg : String(msg);

  container.appendChild(icon);
  container.appendChild(text);
  document.body.appendChild(container);

  container.style.opacity = "0";
  container.style.transform = "translateX(20px)";

  requestAnimationFrame(() => {
    container.style.opacity = "1";
    container.style.transform = "translateX(0)";
  });

  setTimeout(() => {
    container.style.opacity = "0";
    container.style.transform = "translateX(20px)";
    setTimeout(() => container.remove(), 300);
  }, 4000);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <BranchProvider>
        <App />
      </BranchProvider>
    </SettingsProvider>
  </StrictMode>,
);
