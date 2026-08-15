import { format } from "date-fns";
import { ar } from "date-fns/locale";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Smartphone,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  Home,
  ShoppingCart,
  Wrench,
  Warehouse,
  Headphones,
  PenTool,
  LineChart,
  Download,
  Calculator,
  Landmark,
  Users,
  Truck,
  Briefcase,
  Shield,
  Handshake,
  FileText,
  Settings,
  AlarmClock,
  Archive,
  Ban,
  BookOpen,
  TrendingUp,
  Package,
  LogOut,
  Bell,
  Search,
  Plus,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronDown,
  Menu,
  DollarSign,
  User,
  KeyRound,
  ArrowRight,
  MessageCircle,
  Maximize,
  Minimize,
  X,
  Building2,
  ArrowRightLeft,
  BarChart3,
  CreditCard,
} from "lucide-react";

import Maintenance from "./components/Maintenance";
import Devices from "./components/Devices";
import Warehouses from "./components/Warehouses";
import Accessories from "./components/Accessories";
import SpareParts from "./components/SpareParts";
import GeneralSales from "./components/GeneralSales";
import DeviceSales from "./components/DeviceSales";
import AccessorySales from "./components/AccessorySales";
import SparePartSales from "./components/SparePartSales";
import GeneralPurchases from "./components/GeneralPurchases";
import DevicePurchases from "./components/DevicePurchases";
import AccessoryPurchases from "./components/AccessoryPurchases";
import SparePartPurchases from "./components/SparePartPurchases";
import RechargeCards from "./components/RechargeCards";
import POS from "./components/POS";
import Customers from "./components/Customers";
import { Capital } from "./components/Capital";
import { handleAutoBackup } from "./utils/backup";

import Suppliers from "./components/Suppliers";
import Employees from "./components/Employees";
import UsersPage from "./components/Users";
import Salaries from "./components/Salaries";
import SalesCommissions from "./components/SalesCommissions";
import Reports from "./components/Reports";
import GeneralAccounts from "./components/GeneralAccounts";
import Partners from "./components/Partners";
import Treasury from "./components/Treasury";
import Reminders from "./components/Reminders";
import Inventory from "./components/Inventory";
import LowStockReport from "./components/LowStockReport";
import Expenses from "./components/Expenses";

import DashboardHome from "./components/DashboardHome";
import InstallmentsDashboard from "./components/Installments/InstallmentsDashboard";
import InstallmentContracts from "./components/Installments/InstallmentContracts";
import CashFlowForecastReport from "./components/Installments/CashFlowForecastReport";
import InstallmentAuditLogs from "./components/Installments/InstallmentAuditLogs";
import IMEITracker from "./components/IMEITracker";
import Blacklist from "./components/Blacklist";
import ArchivePage from "./components/Archive";
import SettingsPage from "./components/Settings";
import { useSettings } from "./contexts/SettingsContext";
import Manual from "./components/Manual";
import BranchSelector from "./components/BranchSelector";
import BranchManagement from "./components/BranchManagement";
import BranchTransfers from "./components/BranchTransfers";
import BranchAnalytics from "./components/BranchAnalytics";
import { useBranchPermissions } from "./hooks/useBranchPermissions";
import { useBranch } from "./contexts/BranchContext";
import { SignupWizard } from "./components/SignupWizard";
import ManagerAnalytics from "./components/ManagerAnalytics";

// ==========================================
// 1. Live Clock Component
// ==========================================
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <span className="font-mono">
        {format(time, "hh:mm a", { locale: ar })}
      </span>
      <span className="text-slate-600">|</span>
      <span>{format(time, "EEEE dd MMMM", { locale: ar })}</span>
    </>
  );
}

// ==========================================
// 2. شاشة تسجيل الدخول (Login Screen)
// ==========================================
function Login({
  onLogin,
}: {
  onLogin: (type: "admin" | "cashier", data?: any) => void;
}) {
  const { settings } = useSettings();
  const [loginMode, setLoginMode] = useState<"admin" | "employee" | "signup">(
    "admin",
  );

  const [email, setEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [signupCompany, setSignupCompany] = useState("");
  const [signupHasBranches, setSignupHasBranches] = useState(true);

  const [username, setUsername] = useState("");
  const [empPassword, setEmpPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardInitData, setWizardInitData] = useState<any>(null);

  const handleWizardComplete = async (wizardData: any) => {
    setError("");
    setIsLoading(true);

    try {
      if (!wizardInitData || !wizardInitData.sessionData) {
        throw new Error("Missing session data");
      }

      const data = wizardInitData.sessionData;

      const newSettings = {
        companyName: wizardData.companyName,
        logo: wizardData.logo,
        currency: wizardData.currency,
        dateFormat: wizardData.dateFormat,
        lowStockThreshold: wizardData.lowStockThreshold,
        lowStockAlert: wizardData.enableLowStockAlerts,
        preventZeroStockSales: wizardData.preventZeroStockSales,
        autoTrackInventory: wizardData.autoTrackInventory,
        directPrint: wizardData.autoPrint,
        enableNotifications: wizardData.notifications,
        enableSounds: wizardData.sounds,
        hasBranches: true,
        phone: wizardData.phone,
        managerName: wizardData.fullName,
      };

      // Save to local storage right away so ui updates
      if (data?.user?.id) {
        localStorage.setItem(
          `takka_settings_${data.user.id}`,
          JSON.stringify(newSettings),
        );
      } else {
        localStorage.setItem("takka_settings", JSON.stringify(newSettings));
      }

      if (data.session) {
        localStorage.setItem("access_token", data.session.access_token);
        localStorage.setItem("user_id", data.user.id);
        if (data.session.refresh_token)
          localStorage.setItem("refresh_token", data.session.refresh_token);

        // Fetch the app_user that was automatically created by the trigger
        let appUser = null;
        try {
          // small delay to let trigger finish
          await new Promise((r) => setTimeout(r, 1000));
          const appUsersRes = await fetch(
            `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?user_id=eq.${data.user.id}&role_level=eq.1`,
            {
              headers: {
                apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                Authorization: `Bearer ${data.session.access_token}`,
              },
            },
          );
          if (appUsersRes.ok) {
            const appUsersList = await appUsersRes.json();
            if (appUsersList && appUsersList.length > 0) {
              appUser = appUsersList[0];

              // Save settings into app_settings table instead of app_users since app_users does not have a settings column.
              try {
                const checkSettings = await fetch(
                  `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_settings?user_id=eq.${data.user.id}`,
                  {
                    headers: {
                      apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                      Authorization: `Bearer ${data.session.access_token}`,
                    },
                  },
                );
                const settingsDataArr = await checkSettings.json();
                const method =
                  settingsDataArr && settingsDataArr.length > 0
                    ? "PATCH"
                    : "POST";
                const url =
                  method === "PATCH"
                    ? `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_settings?user_id=eq.${data.user.id}`
                    : "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_settings";
                const bodyPayload: any = {
                  company_name: wizardData.companyName || "",
                  currency: wizardData.currency || "EGP",
                  date_format: wizardData.dateFormat || "DD/MM/YYYY",
                  low_stock_threshold: wizardData.lowStockThreshold || 10,
                  has_branches: true,
                  phone: wizardData.phone || "",
                  managerName: wizardData.fullName || "",
                };
                if (method === "POST") bodyPayload.user_id = data.user.id;

                await fetch(url, {
                  method: method,
                  headers: {
                    "Content-Type": "application/json",
                    apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                    Authorization: `Bearer ${data.session.access_token}`,
                  },
                  body: JSON.stringify(bodyPayload),
                });
              } catch (e) {
                console.error("Could not save settings", e);
              }
            }
          }
        } catch (e) {
          console.error("Could not fetch app_user for admin", e);
        }

        localStorage.setItem("open_settings_on_load", "true");
        onLogin("admin", appUser);
      } else {
        // Maybe email confirmation required
        setError(
          "تم إنشاء الحساب بنجاح! يرجي تسجيل الدخول",
        );
        setLoginMode("admin");
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (loginMode === "signup") {
      try {
        const response = await fetch(
          "https://hoohxkrrndtfpwsrnpyr.supabase.co/auth/v1/signup",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
            },
            body: JSON.stringify({
              email,
              password: adminPassword,
              data: {
                company_name: signupCompany,
                has_branches: signupHasBranches,
                full_name: "مدير النظام",
              },
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error_description || data.msg || "حدث خطأ أثناء إنشاء الحساب",
          );
        }

        if (data.session) {
          setWizardInitData({
            email: email,
            companyName: signupCompany,
            password: adminPassword,
            sessionData: data,
          });
          setShowWizard(true);
        } else {
          setError(
            "تم إنشاء الحساب بنجاح! يرجي تسجيل الدخول",
          );
          setLoginMode("admin");
        }
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء الاتصال بالخادم");
      } finally {
        setIsLoading(false);
      }
    } else if (loginMode === "admin") {
      try {
        const response = await fetch(
          "https://hoohxkrrndtfpwsrnpyr.supabase.co/auth/v1/token?grant_type=password",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
            },
            body: JSON.stringify({ email, password: adminPassword }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error_description ||
            data.msg ||
            "تأكد من صحة البريد الإلكتروني وكلمة المرور",
          );
        }

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user_id", data.user.id);
        if (data.refresh_token)
          localStorage.setItem("refresh_token", data.refresh_token);

        let appUser = null;
        try {
          const appUsersRes = await fetch(
            `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?user_id=eq.${data.user.id}&role_level=eq.1`,
            {
              headers: {
                apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                Authorization: `Bearer ${data.access_token}`,
              },
            },
          );
          if (appUsersRes.ok) {
            const appUsersList = await appUsersRes.json();
            if (appUsersList && appUsersList.length > 0) {
              appUser = appUsersList[0];
            }
          }
        } catch (e) {
          console.error("Could not fetch app_user for admin", e);
        }

        let hasSettings = false;
        try {
          const settingsRes = await fetch(
            `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_settings?user_id=eq.${data.user.id}`,
            {
              headers: {
                apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                Authorization: `Bearer ${data.access_token}`,
              },
            },
          );
          if (settingsRes.ok) {
            const settingsList = await settingsRes.json();
            if (settingsList && settingsList.length > 0) {
              if (settingsList[0].date_format) {
                hasSettings = true;
              }
            }
          }
        } catch (e) {
          console.error("Could not fetch app_settings", e);
        }
        if (!hasSettings) {
          setWizardInitData({
            email: email,
            companyName: appUser?.company_name || "",
            password: adminPassword,
            sessionData: {
              user: data.user,
              session: {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
              },
            },
          });
          setShowWizard(true);
          setIsLoading(false);
          return;
        }

        onLogin("admin", appUser);
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء الاتصال بالخادم");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Employee Login
      try {
        let token = localStorage.getItem("access_token");
        const userId = localStorage.getItem("user_id");
        const refreshToken = localStorage.getItem("refresh_token");

        if (!token || !userId) {
          throw new Error(
            "لم يتم ربط الجهاز. يرجى من المالك الدخول بحساب الإدارة مرة واحدة على الأقل لتهيئة الجهاز.",
          );
        }

        const fetchCashierStatus = async (currentToken: string) => {
          return await fetch(
            `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?username=eq.${username}&password=eq.${empPassword}&status=eq.نشط`,
            {
              headers: {
                apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                Authorization: `Bearer ${currentToken}`,
              },
            },
          );
        };

        let response = await fetchCashierStatus(token);

        if (response.status === 401 && refreshToken) {
          // Token might be expired, let's try to refresh it silently using the Owner's refresh token
          const refreshRes = await fetch(
            "https://hoohxkrrndtfpwsrnpyr.supabase.co/auth/v1/token?grant_type=refresh_token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
            },
          );

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            token = refreshData.access_token;
            localStorage.setItem("access_token", token);
            if (refreshData.refresh_token) {
              localStorage.setItem("refresh_token", refreshData.refresh_token);
            }
            // Retry fetch with new token
            response = await fetchCashierStatus(token!);
          } else {
            throw new Error(
              "انتهت صلاحية الإدارة على هذا الجهاز، يرجى دخول الإدارة أولاً لتنشيط الوصول",
            );
          }
        } else if (!response.ok) {
          throw new Error(
            "حدث خطأ أثناء التواصل مع السيرفر، يرجى المحاولة لاحقاً",
          );
        }

        const users = await response.json();

        if (users.length === 0) {
          throw new Error(
            "اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب غير نشط.",
          );
        }

        const cashier = users[0];

        localStorage.setItem("active_cashier", JSON.stringify(cashier));

        // Update last login
        fetch(
          `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?id=eq.${cashier.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ last_login: new Date().toISOString() }),
          },
        );

        onLogin("cashier", cashier);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (showWizard) {
    return (
      <SignupWizard
        initialEmail={email}
        initialCompany={signupCompany}
        onCancel={() => {
          setShowWizard(false);
          setLoginMode("admin");
        }}
        onComplete={handleWizardComplete}
        isSubmitting={isLoading}
        error={error}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-[#080c13] text-slate-900 dark:text-white relative overflow-hidden flex flex-col items-center justify-center p-4"
      dir="rtl"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[100%] h-[40%] bg-gradient-to-b from-primary-900/20 to-transparent pointer-events-none" />

      <div className="absolute top-8 start-8 flex items-center gap-4 z-20">
        {settings.logo ? (
          <img
            src={settings.logo}
            alt="Logo"
            className="h-16 w-auto max-w-[180px] object-contain drop-shadow-md"
          />
        ) : (
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-[0_0_15px_var(--accent-500)] shadow-primary-500/50">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
        )}
        <span className="font-black text-2xl tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]">
          {settings.companyName}
        </span>
      </div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center mt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-800 dark:text-slate-200 tracking-tight">
            إدارة النــــظام
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-primary-500 tracking-tight">
            تسجيل الدخول
          </h2>
        </motion.div>

        <div className="w-full relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-[0_0_40px_-15px_var(--accent-500)] shadow-primary-500/10 relative z-10"
          >
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-white/5">
              <button
                onClick={() => {
                  setLoginMode("signup");
                  setError("");
                }}
                className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${loginMode === "signup" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                إنشاء حساب
              </button>
              <button
                onClick={() => {
                  setLoginMode("admin");
                  setError("");
                }}
                className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${loginMode === "admin" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                دخول الإدارة (المالك)
              </button>
              <button
                onClick={() => {
                  setLoginMode("employee");
                  setError("");
                }}
                className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${loginMode === "employee" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                دخول الموظفين
              </button>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                {loginMode === "signup" ? (
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    إنشاء حساب جديد
                  </h3>
                ) : loginMode === "admin" ? (
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    مرحباً بعودتك
                  </h3>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-[#1a2333] rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/5 shadow-inner">
                      <User className="w-8 h-8 text-primary-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      تسجيل دخول الموظف
                    </h3>
                  </div>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {loginMode === "signup"
                    ? "الاشتراك وإدارة محلك الذكي"
                    : loginMode === "admin"
                      ? "التحكم الكامل في النظام"
                      : "برجاء إدخال بياناتك للمتابعة"}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm justify-center leading-relaxed font-bold text-center flex items-center"
                  >
                    {error}
                  </motion.div>
                )}

                {loginMode === "signup" ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
                        اسم الشركة (المحل)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          type="text"
                          value={signupCompany}
                          onChange={(e) => setSignupCompany(e.target.value)}
                          className="block w-full ps-11 pe-4 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                          placeholder="مثال: شركة تكنو جروب"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
                        البريد الإلكتروني
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full ps-11 pe-4 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                          placeholder="أدخل البريد الإلكتروني"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
                        كلمة المرور
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="block w-full ps-11 pe-12 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 end-0 pe-4 flex items-center text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center cursor-pointer gap-2 ms-1">
                        <input
                          type="checkbox"
                          checked={signupHasBranches}
                          onChange={(e) =>
                            setSignupHasBranches(e.target.checked)
                          }
                          className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          هل تمتلك فروع متعددة؟
                        </span>
                      </label>
                    </div>

                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setLoginMode("admin")}
                        className="text-primary-500 text-sm font-bold hover:underline"
                      >
                        لديك حساب بالفعل؟ قم بتسجيل الدخول
                      </button>
                    </div>
                  </>
                ) : loginMode === "admin" ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
                        البريد الإلكتروني
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full ps-11 pe-4 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                          placeholder="أدخل البريد الإلكتروني"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
                        كلمة المرور
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="block w-full ps-11 pe-12 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 end-0 pe-4 flex items-center text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setLoginMode("signup")}
                        className="text-primary-500 text-sm font-bold hover:underline"
                      >
                        ليس لديك حساب؟ إنشاء حساب جديد
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
                        اسم المستخدم
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="block w-full ps-11 pe-4 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none font-bold"
                          placeholder="أدخل اسم المستخدم..."
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
                        كلمة المرور / الرمز السري
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                          <KeyRound className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={empPassword}
                          onChange={(e) => setEmpPassword(e.target.value)}
                          className="block w-full ps-11 pe-12 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none font-mono"
                          placeholder="••••••••"
                          dir="ltr"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 end-0 pe-4 flex items-center text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#11151c] focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-[0_0_20px_var(--accent-500)] shadow-primary-500/30 hover:shadow-primary-500/40"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : loginMode === "signup" ? (
                    "إنشاء الحساب"
                  ) : (
                    "تسجيل الدخول"
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. لوحة التحكم (Dashboard Screen)
// ==========================================
function Dashboard({
  onLogout,
  onUnlinkDevice,
  isDarkMode,
  toggleDarkMode,
  isFullscreen,
  toggleFullscreen,
}: {
  onLogout: () => void;
  onUnlinkDevice: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}) {
  const { settings } = useSettings();
  const { isOwner, isBranchManager } = useBranch();
  const { canViewReports } = useBranchPermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState(() => {
    const activeCashierUser = localStorage.getItem("active_cashier")
      ? JSON.parse(localStorage.getItem("active_cashier") || "{}")
      : null;
    if (!activeCashierUser) return "dashboard"; // Admin

    // Employee logic: pick first allowed page
    const allowed = activeCashierUser?.permissions?.pages || [];
    if (allowed.length > 0) return allowed[0];
    return "pos"; // Fallback
  });
  const [activeWarehouse, setActiveWarehouse] = useState<any>(null);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    sales: false,
    purchases: false,
  });

  useEffect(() => {
    if (localStorage.getItem("open_settings_on_load") === "true") {
      localStorage.removeItem("open_settings_on_load");
      setTimeout(() => {
        setActiveView("settings");
      }, 0);
    }
  }, []);

  useEffect(() => {
    const handleNavigation = (e: CustomEvent) => {
      if (e.detail) setActiveView(e.detail);
    };

    // @ts-ignore
    window.addEventListener("navigate", handleNavigation);
    return () => {
      // @ts-ignore
      window.removeEventListener("navigate", handleNavigation);
    };
  }, []);

  const handleLogoutClick = () => {
    onLogout();
  };

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sidebarActiveId =
    activeWarehouse &&
      ["devices", "accessories", "spare_parts", "custom_warehouse"].includes(
        activeView,
      )
      ? "warehouses"
      : activeView;

  // هيكل المنيو بالكامل بناءً على الصور
  const fullMenuStructure = [
    { type: "header", label: "الأساسية", group: "main" },
    { type: "item", icon: Home, label: "الرئيسية", id: "dashboard" },
    { type: "item", icon: ShoppingCart, label: "نقطة البيع", id: "pos" },
    { type: "item", icon: Wrench, label: "الصيانة", id: "maintenance" },

    { type: "header", label: "المخزون", group: "warehouses" },
    { type: "item", icon: Warehouse, label: "المخازن", id: "warehouses" },
    {
      type: "item",
      icon: ArrowRightLeft,
      label: "تحويلات الفروع",
      id: "branch_transfers",
    },
    {
      type: "item",
      icon: Smartphone,
      label: "الأجهزة",
      id: "devices",
      onClick: () => {
        setActiveWarehouse(null);
        setActiveView("devices");
      },
    },
    {
      type: "item",
      icon: Headphones,
      label: "الإكسسوارات",
      id: "accessories",
      onClick: () => {
        setActiveWarehouse(null);
        setActiveView("accessories");
      },
    },
    {
      type: "item",
      icon: PenTool,
      label: "مخزن قطع الغيار",
      id: "spare_parts",
      onClick: () => {
        setActiveWarehouse(null);
        setActiveView("spare_parts");
      },
    },
    {
      type: "item",
      icon: CreditCard,
      label: "مكن الشحن ",
      id: "recharge_cards",
      onClick: () => {
        setActiveWarehouse(null);
        setActiveView("recharge_cards");
      },
    },

    { type: "header", label: "العمليات", group: "sales_purchases" },
    {
      type: "collapse",
      icon: LineChart,
      label: "المبيعات",
      id: "sales",
      subItems: [
        { label: "المبيعات العامة", id: "general_sales" },
        { label: "مبيعات الأجهزة", id: "device_sales" },
        { label: "مبيعات الإكسسوارات", id: "accessory_sales" },
        { label: "مبيعات قطع الغيار", id: "spare_part_sales" },
      ],
    },
    {
      type: "collapse",
      icon: DollarSign,
      label: "التقسيط",
      id: "installments_menu",
      subItems: [
        { label: "لوحة تحكم التقسيط", id: "installments_dashboard" },
        { label: "العقود", id: "installment_contracts" },
        { label: "توقعات التدفق النقدي", id: "installment_cashflow" },
        { label: "سجل الحركات (Audit)", id: "installment_audit_logs" },
      ],
    },
    {
      type: "collapse",
      icon: Download,
      label: "المشتريات",
      id: "purchases",
      subItems: [
        { label: "المشتريات العامة", id: "general_purchases" },
        { label: "مشتريات الأجهزة", id: "device_purchases" },
        { label: "مشتريات الإكسسوارات", id: "accessory_purchases" },
        { label: "مشتريات قطع الغيار", id: "spare_part_purchases" },
      ],
    },

    { type: "header", label: "الحسابات", group: "finance" },
    {
      type: "item",
      icon: Calculator,
      label: "الحسابات العامة",
      id: "accounting",
    }, // We'll tie to treasury
    { type: "item", icon: Landmark, label: "الخزينة", id: "treasury" },
    { type: "item", icon: DollarSign, label: "رأس المال", id: "capital" },
    { type: "item", icon: ArrowDownRight, label: "المصروفات", id: "expenses" },
    { type: "item", icon: Users, label: "العملاء", id: "customers" },
    { type: "item", icon: Truck, label: "الموردين", id: "suppliers" },

    { type: "header", label: "الإدارة", group: "admin" },
    {
      type: "item",
      icon: Building2,
      label: "إدارة الفروع",
      id: "branch_management",
    },
    {
      type: "item",
      icon: BarChart3,
      label: "أداء الفروع",
      id: "branch_analytics",
    },
    { type: "item", icon: Briefcase, label: "الموظفين", id: "employees" },
    { type: "item", icon: DollarSign, label: "الرواتب", id: "salaries" }, // Tied to employees
    {
      type: "item",
      icon: TrendingUp,
      label: "عمولات البيع",
      id: "sales_commissions",
    },
    { type: "item", icon: Shield, label: "المستخدمين", id: "users" }, // Admin only
    { type: "item", icon: Handshake, label: "الشركاء", id: "partners" },
    { type: "item", icon: FileText, label: "التقارير", id: "reports" },
    { type: "item", icon: LineChart, label: "تحليلات الصيانه", id: "manager_analytics" },
    { type: "item", icon: Settings, label: "الإعدادات", id: "settings" },

    { type: "header", label: "أدوات ذكية", group: "tools" },
    {
      type: "item",
      icon: FileText,
      label: "قصة السيريال (IMEI)",
      id: "imei_tracker",
    },

    { type: "header", label: "أدوات", group: "tools" },
    { type: "item", icon: AlarmClock, label: "التذكيرات", id: "reminders" },
    { type: "item", icon: Archive, label: "الأرشيف", id: "archive" },
    { type: "item", icon: Ban, label: "البلاك ليست", id: "blacklist" },
    { type: "item", icon: BookOpen, label: "دليل المستخدم", id: "manual" },
  ].filter((item) => {
    if (settings.hasBranches === false) {
      if (
        ["branch_transfers", "branch_management", "branch_analytics"].includes(
          (item as any).id,
        )
      ) {
        return false;
      }
    }
    return true;
  });

  const activeCashierUser = localStorage.getItem("active_cashier")
    ? JSON.parse(localStorage.getItem("active_cashier") || "{}")
    : null;
  const isAdmin = !activeCashierUser;
  const allowedPages = activeCashierUser?.permissions?.pages || [];

  const checkPermission = (id: string, group?: string) => {
    if (isOwner) return true;
    if (isBranchManager) {
      if (id === "branch_management" || id === "branch_analytics") return false; // Owner only
      if (id === "reports" && !canViewReports) return false;
      return true;
    }

    if (
      id === "dashboard" ||
      id === "branch_management" ||
      id === "branch_analytics"
    )
      return false; // Strictly owner
    if (id === "users") return false; // Strictly owner/manager

    const permMap: Record<string, string[]> = {
      pos: ["pos"],
      maintenance: ["maintenance"],
      warehouses: ["warehouses"],
      branch_transfers: ["warehouses"],
      inventory: ["warehouses"],
      devices: ["warehouses"],
      accessories: ["warehouses"],
      spare_parts: ["warehouses"],
      sales: ["sales"],
      installments_dashboard: ["sales"],
      installment_contracts: ["sales"],
      installment_cashflow: ["sales", "reports"],
      installment_audit_logs: ["sales", "reports"],
      purchases: ["purchases"],
      accounting: ["accounting"],
      treasury: ["treasury"],
      expenses: ["treasury", "accounting"],
      customers: ["customers"],
      suppliers: ["suppliers"],
      employees: ["employees"],
      salaries: ["employees"],
      sales_commissions: ["employees"],
      branch_management: [], // Strictly admin
      branch_analytics: [], // Strictly admin
      capital: [], // Strictly admin
      users: [], // Strictly admin
      partners: ["partners"],
      reports: ["reports"],
      settings: ["settings"],
      reminders: ["reminders"],
      imei_tracker: ["pos", "sales", "maintenance", "warehouses"], // Allow if they have related modules
      manager_analytics: [],
      archive: ["reports", "settings"],
      blacklist: ["customers", "sales"],
      manual: ["pos", "sales", "warehouses"],
    };

    const requiredPerms = permMap[id];
    if (!requiredPerms) return true; // Allow unmapped headers/items by default unless they are empty array

    if (id === "users") {
      const special = activeCashierUser?.permissions?.special || [];
      return special.includes("إدارة المستخدمين");
    }

    if (requiredPerms.length === 0) return false; // Admin only

    return requiredPerms.some((p) => allowedPages.includes(p));
  };

  const menuStructure = fullMenuStructure.filter((item) => {
    if (isOwner || isBranchManager) {
      if (
        item.id === "branch_management" ||
        item.id === "branch_analytics" ||
        item.id === "capital"
      )
        return isOwner;
      if (item.type === "header" && item.group === "branch") return isOwner;
      return true;
    }
    if (item.type === "header") {
      // Only show headers if at least one item below them isn't filtered out, but for simplicity, we will just let it be.
      // A better way is to do a 2-pass filter, but we can also just broadly show headers if the group has any permissions.
      if (item.group === "warehouses" && !allowedPages.includes("warehouses"))
        return false;
      if (
        item.group === "sales_purchases" &&
        !allowedPages.includes("sales") &&
        !allowedPages.includes("purchases")
      )
        return false;
      if (
        item.group === "finance" &&
        !allowedPages.includes("treasury") &&
        !allowedPages.includes("customers") &&
        !allowedPages.includes("suppliers")
      )
        return false;
      if (
        item.group === "admin" &&
        !allowedPages.includes("employees") &&
        !allowedPages.includes("partners") &&
        !allowedPages.includes("reports") &&
        !allowedPages.includes("settings") &&
        !(activeCashierUser?.permissions?.special || []).includes(
          "إدارة المستخدمين",
        )
      )
        return false;
      return true;
    }
    return checkPermission(item.id as string);
  });

  return (
    <div
      className="flex h-screen bg-slate-50 dark:bg-[#080c13] text-slate-900 dark:text-white overflow-hidden"
      dir="rtl"
    >
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 right-0 w-56 bg-white dark:bg-[#11151c] flex flex-col z-50 border-l border-slate-200 dark:border-white/5 md:hidden"
            >
              <div className="h-20 flex items-center px-4 shrink-0 justify-between">
                <div className="flex items-center">
                  {settings.logo ? (
                    <img
                      src={settings.logo}
                      alt="Logo"
                      className="h-10 w-auto max-w-[80px] object-contain me-3 drop-shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--accent-500)] shadow-primary-500/50 me-2 shrink-0">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <span className="font-black text-xl tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                    {settings.companyName}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Scrollable Menu Area */}
              <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
                {menuStructure.map((item: any, index) => {
                  if (item.type === "header") {
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 ${index !== 0 ? "mt-6" : "mt-2"} mb-2 px-2`}
                      >
                        <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                        <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full uppercase">
                          {item.label}
                        </span>
                        <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                      </div>
                    );
                  }

                  if (item.type === "collapse") {
                    const isOpen = openMenus[item.id];
                    return (
                      <div key={index} className="mb-1">
                        <button
                          onClick={() => toggleMenu(item.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300 transition-colors" />
                            <span className="text-sm font-medium">
                              {item.label}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {/* Sub items */}
                        <motion.div
                          initial={false}
                          animate={{
                            height: isOpen ? "auto" : 0,
                            opacity: isOpen ? 1 : 0,
                          }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 space-y-1 px-3 ps-11 pb-2">
                            {item.subItems.map((sub: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setActiveWarehouse(null);
                                  sub.id && setActiveView(sub.id);
                                  setIsMobileMenuOpen(false);
                                }}
                                className={`w-full text-start py-1.5 text-[13px] font-medium transition-colors relative before:content-[''] before:absolute before:start-[-16px] before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full ${sidebarActiveId === sub.id ? "text-primary-600 dark:text-primary-400 before:bg-primary-600 dark:before:bg-primary-400" : "text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 before:bg-slate-300 dark:before:bg-slate-700 hover:before:bg-primary-600 dark:hover:before:bg-primary-400"}`}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    );
                  }

                  // Normal Item
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else if (item.id) {
                          setActiveWarehouse(null);
                          setActiveView(item.id);
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className={`mb-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${sidebarActiveId === item.id
                        ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
                        }`}
                    >
                      <item.icon
                        className={`w-4 h-4 ${sidebarActiveId === item.id ? "text-primary-600 dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`}
                      />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* User Profile & Logout */}
              <div className="p-4 border-t border-slate-200 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-[#0d1117]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 mb-3 border border-slate-200 dark:border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-inner flex-shrink-0">
                    {(() => {
                      let initial = "M";
                      const c = localStorage.getItem("active_cashier");
                      if (c) {
                        try {
                          const parsed = JSON.parse(c);
                          const nameStr =
                            parsed.full_name ||
                            parsed.username ||
                            parsed.email ||
                            parsed.name ||
                            "M";
                          if (nameStr)
                            initial = nameStr.charAt(0).toUpperCase();
                        } catch (e) { }
                      } else if (
                        localStorage.getItem("admin_active") === "true"
                      ) {
                        initial = "A";
                      }
                      return initial;
                    })()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {(() => {
                        let name = "المدير";
                        const c = localStorage.getItem("active_cashier");
                        if (c) {
                          try {
                            const parsed = JSON.parse(c);
                            name =
                              parsed.full_name ||
                              parsed.username ||
                              parsed.email ||
                              parsed.name ||
                              "المدير";
                          } catch (e) { }
                        }
                        return name;
                      })()}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {(() => {
                        let roleStr = "موظف مبيعات";
                        if (localStorage.getItem("admin_active") === "true") {
                          return "إدارة النظام";
                        }
                        const c = localStorage.getItem("active_cashier");
                        if (c) {
                          try {
                            const parsed = JSON.parse(c);
                            if (
                              parsed.role_level === 1 ||
                              parsed.role === "owner" ||
                              parsed.role === "admin"
                            )
                              roleStr = "إدارة النظام";
                            else if (
                              parsed.role_level === 2 ||
                              parsed.role === "manager"
                            )
                              roleStr = "مدير فرع";
                            else roleStr = "موظف مبيعات";
                          } catch (e) { }
                        }
                        return roleStr;
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={handleLogoutClick}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                    title="تسجيل خروج"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-56 bg-white dark:bg-[#11151c] flex flex-col hidden md:flex z-20 border-l border-slate-200 dark:border-white/5">
        <div className="h-20 flex items-center px-4 shrink-0">
          {settings.logo ? (
            <img
              src={settings.logo}
              alt="Logo"
              className="h-10 w-auto max-w-[80px] object-contain me-3 drop-shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--accent-500)] shadow-primary-500/50 me-2 shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="font-black text-xl tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
            {settings.companyName}
          </span>
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
          {menuStructure.map((item: any, index) => {
            if (item.type === "header") {
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 ${index !== 0 ? "mt-6" : "mt-2"} mb-2 px-2`}
                >
                  <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                  <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full uppercase">
                    {item.label}
                  </span>
                  <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
                </div>
              );
            }

            if (item.type === "collapse") {
              const isOpen = openMenus[item.id];
              return (
                <div key={index} className="mb-1">
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300 transition-colors" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {/* Sub items */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: isOpen ? "auto" : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 space-y-1 px-3 ps-11 pb-2">
                      {item.subItems.map((sub: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveWarehouse(null);
                            sub.id && setActiveView(sub.id);
                          }}
                          className={`w-full text-start py-1.5 text-[13px] font-medium transition-colors relative before:content-[''] before:absolute before:start-[-16px] before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full ${sidebarActiveId === sub.id ? "text-primary-600 dark:text-primary-400 before:bg-primary-600 dark:before:bg-primary-400" : "text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 before:bg-slate-300 dark:before:bg-slate-700 hover:before:bg-primary-600 dark:hover:before:bg-primary-400"}`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              );
            }

            // Normal Item
            return (
              <button
                key={index}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.id) {
                    setActiveWarehouse(null);
                    setActiveView(item.id);
                  }
                }}
                className={`mb-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${sidebarActiveId === item.id
                  ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <item.icon
                  className={`w-4 h-4 ${sidebarActiveId === item.id ? "text-primary-600 dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`}
                />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-[#0d1117]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 mb-3 border border-slate-200 dark:border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-inner flex-shrink-0">
              {(() => {
                let initial = "M";
                const c = localStorage.getItem("active_cashier");
                if (c) {
                  try {
                    const parsed = JSON.parse(c);
                    const nameStr =
                      parsed.full_name ||
                      parsed.username ||
                      parsed.email ||
                      parsed.name ||
                      "M";
                    if (nameStr) initial = nameStr.charAt(0).toUpperCase();
                  } catch (e) { }
                } else if (localStorage.getItem("admin_active") === "true") {
                  initial = "A";
                }
                return initial;
              })()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {(() => {
                  let name = "المدير";
                  const c = localStorage.getItem("active_cashier");
                  if (c) {
                    try {
                      const parsed = JSON.parse(c);
                      name =
                        parsed.full_name ||
                        parsed.username ||
                        parsed.email ||
                        parsed.name ||
                        "المدير";
                    } catch (e) { }
                  }
                  return name;
                })()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {(() => {
                  let roleStr = "موظف مبيعات";
                  if (localStorage.getItem("admin_active") === "true") {
                    return "إدارة النظام";
                  }
                  const c = localStorage.getItem("active_cashier");
                  if (c) {
                    try {
                      const parsed = JSON.parse(c);
                      if (
                        parsed.role_level === 1 ||
                        parsed.role === "owner" ||
                        parsed.role === "admin"
                      )
                        roleStr = "إدارة النظام";
                      else if (
                        parsed.role_level === 2 ||
                        parsed.role === "manager"
                      )
                        roleStr = "مدير فرع";
                      else roleStr = "موظف مبيعات";
                    } catch (e) { }
                  }
                  return roleStr;
                })()}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLogoutClick}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
            <button
              onClick={onUnlinkDevice}
              title="إلغاء ربط الجهاز"
              className="w-10 flex items-center justify-center rounded-xl text-sm font-bold text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-950/50 dark:hover:bg-red-900/50 transition-all"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#080c13]/80 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              {activeView === "pos" && (
                <ShoppingCart className="w-6 h-6 text-slate-900 dark:text-white hidden sm:block" />
              )}
              {activeView === "accessories" && (
                <Headphones className="w-6 h-6 text-slate-900 dark:text-white hidden sm:block" />
              )}
              <h1 className="text-2xl font-black text-slate-900 dark:text-white hidden sm:block">
                {activeWarehouse
                  ? activeWarehouse.name
                  : activeView === "dashboard"
                    ? "الرئيسية"
                    : activeView === "accessories"
                      ? "الإكسسوارات"
                      : activeView === "devices"
                        ? "الأجهزة"
                        : activeView === "maintenance"
                          ? "الصيانة"
                          : activeView === "spare_parts"
                            ? "مخزن قطع الغيار"
                            : activeView === "recharge_cards"
                              ? "مكن الشحن"
                              : activeView === "general_sales"
                                ? "المبيعات العامة"
                                : activeView === "device_sales"
                                  ? "مبيعات الأجهزة"
                                  : activeView === "accessory_sales"
                                    ? "مبيعات الإكسسوارات"
                                    : activeView === "spare_part_sales"
                                      ? "مبيعات قطع الغيار"
                                      : activeView === "general_purchases"
                                        ? "المشتريات العامة"
                                        : activeView === "device_purchases"
                                          ? "مشتريات الأجهزة"
                                          : activeView === "accessory_purchases"
                                            ? "مشتريات الإكسسوارات"
                                            : activeView ===
                                              "spare_part_purchases"
                                              ? "مشتريات قطع الغيار"
                                              : activeView ===
                                                "installments_dashboard"
                                                ? "لوحة تحكم التقسيط"
                                                : activeView ===
                                                  "installment_contracts"
                                                  ? "عقود التقسيط"
                                                  : activeView === "pos"
                                                    ? "نقطة البيع"
                                                    : activeView ===
                                                      "accounting"
                                                      ? "الحسابات العامة"
                                                      : activeView ===
                                                        "treasury"
                                                        ? "الخزينة"
                                                        : activeView ===
                                                          "customers"
                                                          ? "العملاء"
                                                          : activeView ===
                                                            "warehouses"
                                                            ? "المخازن"
                                                            : activeView ===
                                                              "branch_transfers"
                                                              ? "تحويلات الفروع"
                                                              : activeView ===
                                                                "inventory"
                                                                ? "الجرد"
                                                                : activeView ===
                                                                  "salaries"
                                                                  ? "الرواتب والأجور"
                                                                  : activeView ===
                                                                    "branch_management"
                                                                    ? "إدارة الفروع"
                                                                    : activeView ===
                                                                      "reports"
                                                                      ? "التقارير"
                                                                      : activeView ===
                                                                        "users"
                                                                        ? "المستخدمين"
                                                                        : activeView ===
                                                                          "settings"
                                                                          ? "الإعدادات"
                                                                          : "الرئيسية"}
              </h1>
              <div id="header-actions" className="ms-6">
                {settings.hasBranches !== false && <BranchSelector />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 text-primary-400 absolute top-1/2 start-3 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث Ctrl+K"
                className="w-48 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl py-2 ps-9 pe-4 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-colors"
              />
            </div>

            <div className="hidden xl:flex items-center gap-2 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <LiveClock />
            </div>

            {checkPermission("blacklist") && (
              <button
                onClick={() => setActiveView("blacklist")}
                className="hidden sm:flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <Ban className="w-4 h-4" />
                البلاك ليست
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 w-10 h-10 rounded-xl transition-colors"
              title={isFullscreen ? "إنهاء ملء الشاشة" : "ملء الشاشة"}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={toggleDarkMode}
              className="hidden sm:flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {isDarkMode ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  وضع فاتح
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  وضع داكن
                </>
              )}
            </button>

            {checkPermission("dashboard") && activeView !== "dashboard" && (
              <button
                onClick={() => setActiveView("dashboard")}
                className="flex items-center gap-2 bg-white dark:bg-[#11151c] hover:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                رجوع
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Scrollable Area */}
        <main
          className={`flex-1 overflow-y-auto z-10 custom-scrollbar ${activeView === "pos" ? "p-2 md:p-4" : "p-4 md:p-6 lg:p-8"}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`w-full mx-auto space-y-6 pb-10 ${activeView === "pos" ? "max-w-full h-full pb-0" : "xl:max-w-[1400px] 2xl:max-w-[1600px]"}`}
            >
              {activeView === "imei_tracker" && <IMEITracker />}

              {activeView === "blacklist" && <Blacklist />}

              {activeView === "reminders" && <Reminders />}

              {activeView === "dashboard" && (
                <DashboardHome setActiveView={setActiveView} />
              )}

              {activeView === "installments_dashboard" && (
                <InstallmentsDashboard onNavigate={setActiveView} />
              )}

              {activeView === "installment_contracts" && (
                <InstallmentContracts onNavigate={setActiveView} />
              )}

              {activeView === "installment_cashflow" && (
                <CashFlowForecastReport />
              )}

              {activeView === "installment_audit_logs" && (
                <InstallmentAuditLogs />
              )}

              {activeView === "maintenance" && <Maintenance />}

              {activeView === "pos" && <POS />}

              {activeView === "devices" && (
                <Devices warehouse={activeWarehouse} />
              )}

              {activeView === "accessories" && (
                <Accessories warehouse={activeWarehouse} />
              )}

              {activeView === "spare_parts" && (
                <SpareParts warehouse={activeWarehouse} />
              )}

              {activeView === "recharge_cards" && <RechargeCards />}

              {activeView === "general_sales" && <GeneralSales />}

              {activeView === "device_sales" && <DeviceSales />}

              {activeView === "accessory_sales" && <AccessorySales />}

              {activeView === "spare_part_sales" && <SparePartSales />}

              {activeView === "general_purchases" && <GeneralPurchases />}

              {activeView === "device_purchases" && <DevicePurchases />}

              {activeView === "accessory_purchases" && <AccessoryPurchases />}

              {activeView === "spare_part_purchases" && <SparePartPurchases />}

              {activeView === "warehouses" && (
                <Warehouses
                  onNavigate={(view, warehouse) => {
                    setActiveWarehouse(warehouse || null);
                    setActiveView(view);
                  }}
                />
              )}

              {activeView === "branch_transfers" && <BranchTransfers />}

              {activeView === "inventory" && (
                <Inventory
                  onNavigate={(view, warehouse) => {
                    setActiveWarehouse(warehouse || null);
                    setActiveView(view);
                  }}
                />
              )}

              {activeView === "customers" && <Customers />}

              {activeView === "suppliers" && <Suppliers />}

              {activeView === "employees" && <Employees />}

              {activeView === "branch_management" && <BranchManagement />}

              {activeView === "branch_analytics" && <BranchAnalytics />}

              {activeView === "users" && <UsersPage />}

              {activeView === "salaries" && <Salaries />}

              {activeView === "sales_commissions" && <SalesCommissions />}

              {activeView === "accounting" && <GeneralAccounts />}

              {activeView === "partners" && <Partners />}

              {activeView === "reports" && <Reports />}
              {activeView === "manager_analytics" && <ManagerAnalytics />}

              {activeView === "treasury" && <Treasury />}
              {activeView === "capital" && <Capital />}
              {activeView === "expenses" && <Expenses />}

              {activeView === "archive" && <ArchivePage />}

              {activeView === "low_stock" && (
                <div className="p-6 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => setActiveView("dashboard")}
                      className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
                    >
                      العودة للرئيسية <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                  <div className="flex-1 bg-white dark:bg-[#11151c] rounded-3xl overflow-hidden shadow">
                    <LowStockReport />
                  </div>
                </div>
              )}

              {activeView === "settings" && <SettingsPage />}
              {activeView === "manual" && <Manual />}

              {/* Empty state for components that don't exist yet */}
              {["reminders"].includes(activeView) && (
                <div className="flex flex-col items-center justify-center p-20 text-center text-slate-500">
                  <Wrench className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-700" />
                  <h2 className="text-2xl font-bold mb-2 text-slate-700 dark:text-slate-300">
                    يتم العمل على هذه الصفحة
                  </h2>
                  <p>
                    هذا القسم قيد التطوير وسيتم توفيره قريباً في التحديثات
                    القادمة.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

import SubscriptionGuard from "./components/SubscriptionGuard";

// ==========================================
// 3. المكون الرئيسي (App) الذي يدير التنقل
// ==========================================
export default function App() {
  useEffect(() => {
    handleAutoBackup();
    const interval = setInterval(handleAutoBackup, 1000 * 60 * 60); // Check every hour
    return () => clearInterval(interval);
  }, []);
  const { settings, updateSettings } = useSettings();

  const [isAdminActive, setIsAdminActive] = useState<boolean>(
    localStorage.getItem("admin_active") === "true",
  );

  const [activeCashier, setActiveCashier] = useState<any>(
    localStorage.getItem("active_cashier")
      ? JSON.parse(localStorage.getItem("active_cashier") || "{}")
      : null,
  );

  const [isFullscreen, setIsFullscreen] = useState(
    () => !!document.fullscreenElement,
  );

  const isAuthenticated = isAdminActive || !!activeCashier;

  const isDarkMode =
    settings.theme === "dark" ||
    (settings.theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    document.documentElement.style.fontSize = `${settings.appFontSize}%`;

    const colors: Record<string, any> = {
      teal: {
        50: "#f0fdfa",
        100: "#ccfbf1",
        200: "#99f6e4",
        300: "#5eead4",
        400: "#2dd4bf",
        500: "#14b8a6",
        600: "#0d9488",
        700: "#0f766e",
        800: "#115e59",
        900: "#134e4a",
        950: "#042f2e",
      },
      blue: {
        50: "#eff6ff",
        100: "#dbeafe",
        200: "#bfdbfe",
        300: "#93c5fd",
        400: "#60a5fa",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
        800: "#1e40af",
        900: "#1e3a8a",
        950: "#172554",
      },
      purple: {
        50: "#faf5ff",
        100: "#f3e8ff",
        200: "#e9d5ff",
        300: "#d8b4fe",
        400: "#c084fc",
        500: "#a855f7",
        600: "#9333ea",
        700: "#7e22ce",
        800: "#6b21a8",
        900: "#581c87",
        950: "#3b0764",
      },
      emerald: {
        50: "#ecfdf5",
        100: "#d1fae5",
        200: "#a7f3d0",
        300: "#6ee7b7",
        400: "#34d399",
        500: "#10b981",
        600: "#059669",
        700: "#047857",
        800: "#065f46",
        900: "#064e3b",
        950: "#022c22",
      },
      rose: {
        50: "#fff1f2",
        100: "#ffe4e6",
        200: "#fecdd3",
        300: "#fda4af",
        400: "#fb7185",
        500: "#f43f5e",
        600: "#e11d48",
        700: "#be123c",
        800: "#9f1239",
        900: "#881337",
        950: "#4c0519",
      },
      amber: {
        50: "#fffbeb",
        100: "#fef3c7",
        200: "#fde68a",
        300: "#fcd34d",
        400: "#fbbf24",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
        800: "#92400e",
        900: "#78350f",
        950: "#451a03",
      },
    };

    const selectedColor = colors[settings.accentColor] || colors["teal"];

    Object.keys(selectedColor).forEach((shade) => {
      document.documentElement.style.setProperty(
        `--accent-${shade}`,
        selectedColor[shade],
      );
    });
  }, [isDarkMode, settings.appFontSize, settings.accentColor]);

  const toggleDarkMode = () => {
    updateSettings({ theme: isDarkMode ? "light" : "dark" });
  };

  const handleLogout = () => {
    if (activeCashier) {
      localStorage.removeItem("active_cashier");
      setActiveCashier(null);
    }
    if (isAdminActive) {
      localStorage.removeItem("admin_active");
      setIsAdminActive(false);
    }
    // Also clear branch selection and notify listeners
    localStorage.removeItem("takka_active_branch_id");
    window.dispatchEvent(new CustomEvent("login_state_changed"));
  };

  const unlinkDevice = () => {
    // Iframe environment often blocks window.confirm.
    // Removed dialog to ensure it functions.
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("admin_active");
    localStorage.removeItem("active_cashier");
    localStorage.removeItem("takka_active_branch_id");
    setActiveCashier(null);
    setIsAdminActive(false);
    window.dispatchEvent(new CustomEvent("login_state_changed"));
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      // Instead of wiping the entire device, just log out the current active session
      // But if the tokens are dead, the owner actually has to log in again.
      // The user requested that we don't force them to "login again and not stay saved" for transient token expirations.
      alert("انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول");
      localStorage.removeItem("admin_active");
      localStorage.removeItem("active_cashier");
      setActiveCashier(null);
      setIsAdminActive(false);
      window.dispatchEvent(new CustomEvent("login_state_changed"));
    };
    window.addEventListener("auth_expired", handleAuthExpired);

    // Proactive token refresh loop every 5 minutes
    const checkToken = async () => {
      const token = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");
      if (!token || !refreshToken) return;

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const exp = payload.exp * 1000;
        const now = Date.now();
        const timeToExpiry = exp - now;

        // If it expires in less than 10 minutes, renew it proactively
        if (timeToExpiry < 10 * 60 * 1000) {
          const refreshRes = await fetch(
            "https://hoohxkrrndtfpwsrnpyr.supabase.co/auth/v1/token?grant_type=refresh_token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
            },
          );
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            if (data.access_token)
              localStorage.setItem("access_token", data.access_token);
            if (data.refresh_token)
              localStorage.setItem("refresh_token", data.refresh_token);
          }
        }
      } catch (e) {
        // ignore errors in background refresh
      }
    };

    const interval = setInterval(checkToken, 5 * 60 * 1000);
    checkToken();

    return () => {
      window.removeEventListener("auth_expired", handleAuthExpired);
      clearInterval(interval);
    };
  }, []);

  const onLoginComplete = (type: "admin" | "cashier", data?: any) => {
    if (type === "admin") {
      setActiveCashier(data || null);
      if (data) {
        localStorage.setItem("active_cashier", JSON.stringify(data));
      } else {
        localStorage.removeItem("active_cashier");
      }

      setIsAdminActive(true);
      localStorage.setItem("admin_active", "true");
    } else {
      setActiveCashier(data);
      localStorage.setItem("active_cashier", JSON.stringify(data));

      setIsAdminActive(false);
      localStorage.removeItem("admin_active");
    }
    window.dispatchEvent(new CustomEvent("login_state_changed"));
  };

  return (
    <>
      {isAuthenticated ? (
        <SubscriptionGuard>
          <Dashboard
            onLogout={handleLogout}
            onUnlinkDevice={unlinkDevice}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
          />
        </SubscriptionGuard>
      ) : (
        <Login onLogin={onLoginComplete} />
      )}

      {/* Floating WhatsApp Support Button */}
      <a
        href="https://wa.me/201037230660"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[100] group flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebd5a] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap font-bold text-sm">
          تواصل مع الدعم الفني
        </span>
        <MessageCircle className="w-6 h-6" />
      </a>
    </>
  );
}
// ////
// import { format } from "date-fns";
// import { ar } from "date-fns/locale";
// import React, { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "motion/react";
// import {
//   Smartphone,
//   Lock,
//   Mail,
//   Eye,
//   EyeOff,
//   Loader2,
//   Home,
//   ShoppingCart,
//   Wrench,
//   Warehouse,
//   Headphones,
//   PenTool,
//   LineChart,
//   Download,
//   Calculator,
//   Landmark,
//   Users,
//   Truck,
//   Briefcase,
//   Shield,
//   Handshake,
//   FileText,
//   Settings,
//   AlarmClock,
//   Archive,
//   Ban,
//   BookOpen,
//   TrendingUp,
//   Package,
//   LogOut,
//   Bell,
//   Search,
//   Plus,
//   AlertTriangle,
//   Wallet,
//   ArrowUpRight,
//   ArrowDownRight,
//   Clock,
//   ChevronDown,
//   Menu,
//   DollarSign,
//   User,
//   KeyRound,
//   ArrowRight,
//   MessageCircle,
//   Maximize,
//   Minimize,
//   X,
//   Building2,
//   ArrowRightLeft,
//   BarChart3,
//   CreditCard,
// } from "lucide-react";

// import Maintenance from "./components/Maintenance";
// import Devices from "./components/Devices";
// import Warehouses from "./components/Warehouses";
// import Accessories from "./components/Accessories";
// import SpareParts from "./components/SpareParts";
// import GeneralSales from "./components/GeneralSales";
// import DeviceSales from "./components/DeviceSales";
// import AccessorySales from "./components/AccessorySales";
// import SparePartSales from "./components/SparePartSales";
// import GeneralPurchases from "./components/GeneralPurchases";
// import DevicePurchases from "./components/DevicePurchases";
// import AccessoryPurchases from "./components/AccessoryPurchases";
// import SparePartPurchases from "./components/SparePartPurchases";
// import RechargeCards from "./components/RechargeCards";
// import POS from "./components/POS";
// import Customers from "./components/Customers";
// import { Capital } from "./components/Capital";
// import { handleAutoBackup } from "./utils/backup";

// import Suppliers from "./components/Suppliers";
// import Employees from "./components/Employees";
// import UsersPage from "./components/Users";
// import Salaries from "./components/Salaries";
// import SalesCommissions from "./components/SalesCommissions";
// import Reports from "./components/Reports";
// import GeneralAccounts from "./components/GeneralAccounts";
// import Partners from "./components/Partners";
// import Treasury from "./components/Treasury";
// import Reminders from "./components/Reminders";
// import Inventory from "./components/Inventory";
// import LowStockReport from "./components/LowStockReport";

// import DashboardHome from "./components/DashboardHome";
// import InstallmentsDashboard from "./components/Installments/InstallmentsDashboard";
// import InstallmentContracts from "./components/Installments/InstallmentContracts";
// import CashFlowForecastReport from "./components/Installments/CashFlowForecastReport";
// import InstallmentAuditLogs from "./components/Installments/InstallmentAuditLogs";
// import IMEITracker from "./components/IMEITracker";
// import Blacklist from "./components/Blacklist";
// import ArchivePage from "./components/Archive";
// import SettingsPage from "./components/Settings";
// import { useSettings } from "./contexts/SettingsContext";
// import Manual from "./components/Manual";
// import BranchSelector from "./components/BranchSelector";
// import BranchManagement from "./components/BranchManagement";
// import BranchTransfers from "./components/BranchTransfers";
// import BranchAnalytics from "./components/BranchAnalytics";
// import { useBranchPermissions } from "./hooks/useBranchPermissions";
// import { useBranch } from "./contexts/BranchContext";
// import { SignupWizard } from "./components/SignupWizard";
// import ManagerAnalytics from "./components/ManagerAnalytics";

// // ==========================================
// // 1. Live Clock Component
// // ==========================================
// function LiveClock() {
//   const [time, setTime] = useState(new Date());

//   useEffect(() => {
//     const timer = setInterval(() => setTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   return (
//     <>
//       <span className="font-mono">
//         {format(time, "hh:mm a", { locale: ar })}
//       </span>
//       <span className="text-slate-600">|</span>
//       <span>{format(time, "EEEE dd MMMM", { locale: ar })}</span>
//     </>
//   );
// }

// // ==========================================
// // 2. شاشة تسجيل الدخول (Login Screen)
// // ==========================================
// function Login({
//   onLogin,
// }: {
//   onLogin: (type: "admin" | "cashier", data?: any) => void;
// }) {
//   const { settings } = useSettings();
//   const [loginMode, setLoginMode] = useState<"admin" | "employee" | "signup">(
//     "admin",
//   );

//   const [email, setEmail] = useState("");
//   const [adminPassword, setAdminPassword] = useState("");
//   const [signupCompany, setSignupCompany] = useState("");
//   const [signupHasBranches, setSignupHasBranches] = useState(true);

//   const [username, setUsername] = useState("");
//   const [empPassword, setEmpPassword] = useState("");

//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [showWizard, setShowWizard] = useState(false);
//   const [wizardInitData, setWizardInitData] = useState<any>(null);

//   const handleWizardComplete = async (wizardData: any) => {
//     setError("");
//     setIsLoading(true);

//     try {
//       if (!wizardInitData || !wizardInitData.sessionData) {
//         throw new Error("Missing session data");
//       }

//       const data = wizardInitData.sessionData;

//       const newSettings = {
//         companyName: wizardData.companyName,
//         phone: wizardData.phone,
//         logo: wizardData.logo,
//         currency: wizardData.currency,
//         dateFormat: wizardData.dateFormat,
//         lowStockThreshold: wizardData.lowStockThreshold,
//         lowStockAlert: wizardData.enableLowStockAlerts,
//         preventZeroStockSales: wizardData.preventZeroStockSales,
//         autoTrackInventory: wizardData.autoTrackInventory,
//         directPrint: wizardData.autoPrint,
//         enableNotifications: wizardData.notifications,
//         enableSounds: wizardData.sounds,
//         hasBranches: true,
//       };

//       // Save to local storage right away so ui updates
//       if (data?.user?.id) {
//         localStorage.setItem(
//           `takka_settings_${data.user.id}`,
//           JSON.stringify(newSettings),
//         );
//       } else {
//         localStorage.setItem("takka_settings", JSON.stringify(newSettings));
//       }

//       if (data.session) {
//         localStorage.setItem("access_token", data.session.access_token);
//         localStorage.setItem("user_id", data.user.id);
//         if (data.session.refresh_token)
//           localStorage.setItem("refresh_token", data.session.refresh_token);

//         // Fetch the app_user that was automatically created by the trigger
//         let appUser = null;
//         try {
//           // small delay to let trigger finish
//           await new Promise((r) => setTimeout(r, 1000));
//           const appUsersRes = await fetch(
//             `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?user_id=eq.${data.user.id}&role_level=eq.1`,
//             {
//               headers: {
//                 apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//                 Authorization: `Bearer ${data.session.access_token}`,
//               },
//             },
//           );
//           if (appUsersRes.ok) {
//             const appUsersList = await appUsersRes.json();
//             if (appUsersList && appUsersList.length > 0) {
//               appUser = appUsersList[0];
              
//               // Update app_user with phone and fullName
//               try {
//                 await fetch(
//                   `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?id=eq.${appUser.id}`,
//                   {
//                     method: "PATCH",
//                     headers: {
//                       "Content-Type": "application/json",
//                       apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//                       Authorization: `Bearer ${data.session.access_token}`,
//                     },
//                     body: JSON.stringify({
//                       full_name: wizardData.fullName || appUser.full_name,
//                       phone: wizardData.phone || appUser.phone,
//                       company_name: wizardData.companyName || appUser.company_name
//                     }),
//                   }
//                 );
//               } catch (e) {
//                 console.error("Could not update app_user", e);
//               }

//               // Save settings into app_settings table instead of app_users since app_users does not have a settings column.
//               try {
//                 const checkSettings = await fetch(
//                   `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_settings?user_id=eq.${data.user.id}`,
//                   {
//                     headers: {
//                       apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//                       Authorization: `Bearer ${data.session.access_token}`,
//                     },
//                   },
//                 );
//                 const settingsDataArr = await checkSettings.json();
//                 const method =
//                   settingsDataArr && settingsDataArr.length > 0
//                     ? "PATCH"
//                     : "POST";
//                 const url =
//                   method === "PATCH"
//                     ? `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_settings?user_id=eq.${data.user.id}`
//                     : "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_settings";
//                 const bodyPayload: any = {
//                   company_name: wizardData.companyName || "",
//                   phone: wizardData.phone || "",
//                   currency: wizardData.currency || "EGP",
//                   date_format: wizardData.dateFormat || "DD/MM/YYYY",
//                   low_stock_threshold: wizardData.lowStockThreshold || 10,
//                   has_branches: true,
//                 };
//                 if (method === "POST") bodyPayload.user_id = data.user.id;

//                 await fetch(url, {
//                   method: method,
//                   headers: {
//                     "Content-Type": "application/json",
//                     apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//                     Authorization: `Bearer ${data.session.access_token}`,
//                   },
//                   body: JSON.stringify(bodyPayload),
//                 });
//               } catch (e) {
//                 console.error("Could not save settings", e);
//               }
//             }
//           }
//         } catch (e) {
//           console.error("Could not fetch app_user for admin", e);
//         }

//         localStorage.setItem("open_settings_on_load", "true");
//         onLogin("admin", appUser);
//       } else {
//         // Maybe email confirmation required
//         setError(
//           "تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.",
//         );
//         setLoginMode("admin");
//       }
//     } catch (err: any) {
//       setError(err.message || "حدث خطأ أثناء الاتصال بالخادم");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setIsLoading(true);

//     if (loginMode === "signup") {
//       try {
//         const response = await fetch(
//           "https://hoohxkrrndtfpwsrnpyr.supabase.co/auth/v1/signup",
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//             },
//             body: JSON.stringify({
//               email,
//               password: adminPassword,
//               data: {
//                 company_name: signupCompany,
//                 has_branches: signupHasBranches,
//                 full_name: "مدير النظام",
//               },
//             }),
//           },
//         );

//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(
//             data.error_description || data.msg || "حدث خطأ أثناء إنشاء الحساب",
//           );
//         }

//         if (data.session) {
//           setWizardInitData({
//             email: email,
//             companyName: signupCompany,
//             password: adminPassword,
//             sessionData: data,
//           });
//           setShowWizard(true);
//         } else {
//           setError(
//             "تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.",
//           );
//           setLoginMode("admin");
//         }
//       } catch (err: any) {
//         setError(err.message || "حدث خطأ أثناء الاتصال بالخادم");
//       } finally {
//         setIsLoading(false);
//       }
//     } else if (loginMode === "admin") {
//       try {
//         const response = await fetch(
//           "https://hoohxkrrndtfpwsrnpyr.supabase.co/auth/v1/token?grant_type=password",
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//             },
//             body: JSON.stringify({ email, password: adminPassword }),
//           },
//         );

//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(
//             data.error_description ||
//               data.msg ||
//               "تأكد من صحة البريد الإلكتروني وكلمة المرور",
//           );
//         }

//         localStorage.setItem("access_token", data.access_token);
//         localStorage.setItem("user_id", data.user.id);
//         if (data.refresh_token)
//           localStorage.setItem("refresh_token", data.refresh_token);

//         let appUser = null;
//         try {
//           const appUsersRes = await fetch(
//             `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?user_id=eq.${data.user.id}&role_level=eq.1`,
//             {
//               headers: {
//                 apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//                 Authorization: `Bearer ${data.access_token}`,
//               },
//             },
//           );
//           if (appUsersRes.ok) {
//             const appUsersList = await appUsersRes.json();
//             if (appUsersList && appUsersList.length > 0) {
//               appUser = appUsersList[0];
//             }
//           }
//         } catch (e) {
//           console.error("Could not fetch app_user for admin", e);
//         }

//         let hasSettings = false;
//         try {
//           const settingsRes = await fetch(
//             `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_settings?user_id=eq.${data.user.id}`,
//             {
//               headers: {
//                 apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//                 Authorization: `Bearer ${data.access_token}`,
//               },
//             },
//           );
//           if (settingsRes.ok) {
//             const settingsList = await settingsRes.json();
//             if (settingsList && settingsList.length > 0) {
//               if (settingsList[0].date_format) {
//                 hasSettings = true;
//               }
//             }
//           }
//         } catch (e) {
//           console.error("Could not fetch app_settings", e);
//         }
//         if (!hasSettings) {
//           setWizardInitData({
//             email: email,
//             companyName: appUser?.company_name || "",
//             password: adminPassword,
//             sessionData: {
//               user: data.user,
//               session: {
//                 access_token: data.access_token,
//                 refresh_token: data.refresh_token,
//               },
//             },
//           });
//           setShowWizard(true);
//           setIsLoading(false);
//           return;
//         }

//         onLogin("admin", appUser);
//       } catch (err: any) {
//         setError(err.message || "حدث خطأ أثناء الاتصال بالخادم");
//       } finally {
//         setIsLoading(false);
//       }
//     } else {
//       // Employee Login
//       try {
//         let token = localStorage.getItem("access_token");
//         const userId = localStorage.getItem("user_id");
//         const refreshToken = localStorage.getItem("refresh_token");

//         if (!token || !userId) {
//           throw new Error(
//             "لم يتم ربط الجهاز. يرجى من المالك الدخول بحساب الإدارة مرة واحدة على الأقل لتهيئة الجهاز.",
//           );
//         }

//         const fetchCashierStatus = async (currentToken: string) => {
//           return await fetch(
//             `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?username=eq.${username}&password=eq.${empPassword}&status=eq.نشط`,
//             {
//               headers: {
//                 apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//                 Authorization: `Bearer ${currentToken}`,
//               },
//             },
//           );
//         };

//         let response = await fetchCashierStatus(token);

//         if (response.status === 401 && refreshToken) {
//           // Token might be expired, let's try to refresh it silently using the Owner's refresh token
//           const refreshRes = await fetch(
//             "https://hoohxkrrndtfpwsrnpyr.supabase.co/auth/v1/token?grant_type=refresh_token",
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//               },
//               body: JSON.stringify({ refresh_token: refreshToken }),
//             },
//           );

//           if (refreshRes.ok) {
//             const refreshData = await refreshRes.json();
//             token = refreshData.access_token;
//             localStorage.setItem("access_token", token);
//             if (refreshData.refresh_token) {
//               localStorage.setItem("refresh_token", refreshData.refresh_token);
//             }
//             // Retry fetch with new token
//             response = await fetchCashierStatus(token!);
//           } else {
//             throw new Error(
//               "انتهت صلاحية الإدارة على هذا الجهاز، يرجى دخول الإدارة أولاً لتنشيط الوصول",
//             );
//           }
//         } else if (!response.ok) {
//           throw new Error(
//             "حدث خطأ أثناء التواصل مع السيرفر، يرجى المحاولة لاحقاً",
//           );
//         }

//         const users = await response.json();

//         if (users.length === 0) {
//           throw new Error(
//             "اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب غير نشط.",
//           );
//         }

//         const cashier = users[0];

//         localStorage.setItem("active_cashier", JSON.stringify(cashier));

//         // Update last login
//         fetch(
//           `https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?id=eq.${cashier.id}`,
//           {
//             method: "PATCH",
//             headers: {
//               "Content-Type": "application/json",
//               apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//               Authorization: `Bearer ${token}`,
//             },
//             body: JSON.stringify({ last_login: new Date().toISOString() }),
//           },
//         );

//         onLogin("cashier", cashier);
//       } catch (err: any) {
//         setError(err.message);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };

//   if (showWizard) {
//     return (
//       <SignupWizard
//         initialEmail={email}
//         initialCompany={signupCompany}
//         onCancel={() => {
//           setShowWizard(false);
//           setLoginMode("admin");
//         }}
//         onComplete={handleWizardComplete}
//         isSubmitting={isLoading}
//         error={error}
//       />
//     );
//   }

//   return (
//     <div
//       className="min-h-screen bg-slate-50 dark:bg-[#080c13] text-slate-900 dark:text-white relative overflow-hidden flex flex-col items-center justify-center p-4"
//       dir="rtl"
//     >
//       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none" />
//       <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[100%] h-[40%] bg-gradient-to-b from-primary-900/20 to-transparent pointer-events-none" />

//       <div className="absolute top-8 start-8 flex items-center gap-4 z-20">
//         {settings.logo ? (
//           <img
//             src={settings.logo}
//             alt="Logo"
//             className="h-16 w-auto max-w-[180px] object-contain drop-shadow-md"
//           />
//         ) : (
//           <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-[0_0_15px_var(--accent-500)] shadow-primary-500/50">
//             <Smartphone className="w-6 h-6 text-white" />
//           </div>
//         )}
//         <span className="font-black text-2xl tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]">
//           {settings.companyName}
//         </span>
//       </div>

//       <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center mt-8">
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//           className="text-center mb-8"
//         >
//           <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-800 dark:text-slate-200 tracking-tight">
//             إدارة النــــظام
//           </h1>
//           <h2 className="text-2xl md:text-3xl font-bold text-primary-500 tracking-tight">
//             تسجيل الدخول
//           </h2>
//         </motion.div>

//         <div className="w-full relative">
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 0.5, delay: 0.2 }}
//             className="bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-[0_0_40px_-15px_var(--accent-500)] shadow-primary-500/10 relative z-10"
//           >
//             {/* Tabs */}
//             <div className="flex border-b border-slate-200 dark:border-white/5">
//               <button
//                 onClick={() => {
//                   setLoginMode("signup");
//                   setError("");
//                 }}
//                 className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${loginMode === "signup" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
//               >
//                 إنشاء حساب
//               </button>
//               <button
//                 onClick={() => {
//                   setLoginMode("admin");
//                   setError("");
//                 }}
//                 className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${loginMode === "admin" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
//               >
//                 دخول الإدارة (المالك)
//               </button>
//               <button
//                 onClick={() => {
//                   setLoginMode("employee");
//                   setError("");
//                 }}
//                 className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${loginMode === "employee" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
//               >
//                 دخول الموظفين
//               </button>
//             </div>

//             <div className="p-8">
//               <div className="text-center mb-8">
//                 {loginMode === "signup" ? (
//                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
//                     إنشاء حساب جديد
//                   </h3>
//                 ) : loginMode === "admin" ? (
//                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
//                     مرحباً بعودتك
//                   </h3>
//                 ) : (
//                   <div className="flex flex-col items-center">
//                     <div className="w-16 h-16 bg-slate-100 dark:bg-[#1a2333] rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/5 shadow-inner">
//                       <User className="w-8 h-8 text-primary-500" />
//                     </div>
//                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
//                       تسجيل دخول الموظف
//                     </h3>
//                   </div>
//                 )}
//                 <p className="text-sm text-slate-500 dark:text-slate-400">
//                   {loginMode === "signup"
//                     ? "الاشتراك وإدارة محلك الذكي"
//                     : loginMode === "admin"
//                       ? "التحكم الكامل في النظام"
//                       : "برجاء إدخال بياناتك للمتابعة"}
//                 </p>
//               </div>

//               <form onSubmit={handleLogin} className="space-y-5">
//                 {error && (
//                   <motion.div
//                     initial={{ opacity: 0, height: 0 }}
//                     animate={{ opacity: 1, height: "auto" }}
//                     className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm justify-center leading-relaxed font-bold text-center flex items-center"
//                   >
//                     {error}
//                   </motion.div>
//                 )}

//                 {loginMode === "signup" ? (
//                   <>
//                     <div className="space-y-1.5">
//                       <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
//                         اسم الشركة (المحل)
//                       </label>
//                       <div className="relative">
//                         <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
//                           <Building2 className="h-5 w-5 text-slate-500" />
//                         </div>
//                         <input
//                           type="text"
//                           value={signupCompany}
//                           onChange={(e) => setSignupCompany(e.target.value)}
//                           className="block w-full ps-11 pe-4 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
//                           placeholder="مثال: شركة تكنو جروب"
//                           required
//                         />
//                       </div>
//                     </div>
//                     <div className="space-y-1.5">
//                       <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
//                         البريد الإلكتروني
//                       </label>
//                       <div className="relative">
//                         <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
//                           <Mail className="h-5 w-5 text-slate-500" />
//                         </div>
//                         <input
//                           type="email"
//                           value={email}
//                           onChange={(e) => setEmail(e.target.value)}
//                           className="block w-full ps-11 pe-4 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
//                           placeholder="أدخل البريد الإلكتروني"
//                           required
//                         />
//                       </div>
//                     </div>
//                     <div className="space-y-1.5">
//                       <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
//                         كلمة المرور
//                       </label>
//                       <div className="relative">
//                         <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
//                           <Lock className="h-5 w-5 text-slate-500" />
//                         </div>
//                         <input
//                           type={showPassword ? "text" : "password"}
//                           value={adminPassword}
//                           onChange={(e) => setAdminPassword(e.target.value)}
//                           className="block w-full ps-11 pe-12 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
//                           placeholder="••••••••"
//                           required
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setShowPassword(!showPassword)}
//                           className="absolute inset-y-0 end-0 pe-4 flex items-center text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors"
//                         >
//                           {showPassword ? (
//                             <EyeOff className="h-5 w-5" />
//                           ) : (
//                             <Eye className="h-5 w-5" />
//                           )}
//                         </button>
//                       </div>
//                     </div>

//                     <div className="pt-2">
//                       <label className="flex items-center cursor-pointer gap-2 ms-1">
//                         <input
//                           type="checkbox"
//                           checked={signupHasBranches}
//                           onChange={(e) =>
//                             setSignupHasBranches(e.target.checked)
//                           }
//                           className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
//                         />
//                         <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
//                           هل تمتلك فروع متعددة؟
//                         </span>
//                       </label>
//                     </div>

//                     <div className="text-center mt-4">
//                       <button
//                         type="button"
//                         onClick={() => setLoginMode("admin")}
//                         className="text-primary-500 text-sm font-bold hover:underline"
//                       >
//                         لديك حساب بالفعل؟ قم بتسجيل الدخول
//                       </button>
//                     </div>
//                   </>
//                 ) : loginMode === "admin" ? (
//                   <>
//                     <div className="space-y-1.5">
//                       <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
//                         البريد الإلكتروني
//                       </label>
//                       <div className="relative">
//                         <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
//                           <Mail className="h-5 w-5 text-slate-500" />
//                         </div>
//                         <input
//                           type="email"
//                           value={email}
//                           onChange={(e) => setEmail(e.target.value)}
//                           className="block w-full ps-11 pe-4 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
//                           placeholder="أدخل البريد الإلكتروني"
//                           required
//                         />
//                       </div>
//                     </div>
//                     <div className="space-y-1.5">
//                       <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
//                         كلمة المرور
//                       </label>
//                       <div className="relative">
//                         <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
//                           <Lock className="h-5 w-5 text-slate-500" />
//                         </div>
//                         <input
//                           type={showPassword ? "text" : "password"}
//                           value={adminPassword}
//                           onChange={(e) => setAdminPassword(e.target.value)}
//                           className="block w-full ps-11 pe-12 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
//                           placeholder="••••••••"
//                           required
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setShowPassword(!showPassword)}
//                           className="absolute inset-y-0 end-0 pe-4 flex items-center text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors"
//                         >
//                           {showPassword ? (
//                             <EyeOff className="h-5 w-5" />
//                           ) : (
//                             <Eye className="h-5 w-5" />
//                           )}
//                         </button>
//                       </div>
//                     </div>
//                     <div className="text-center mt-4">
//                       <button
//                         type="button"
//                         onClick={() => setLoginMode("signup")}
//                         className="text-primary-500 text-sm font-bold hover:underline"
//                       >
//                         ليس لديك حساب؟ إنشاء حساب جديد
//                       </button>
//                     </div>
//                   </>
//                 ) : (
//                   <>
//                     <div className="space-y-1.5">
//                       <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
//                         اسم المستخدم
//                       </label>
//                       <div className="relative">
//                         <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
//                           <User className="h-5 w-5 text-slate-500" />
//                         </div>
//                         <input
//                           type="text"
//                           value={username}
//                           onChange={(e) => setUsername(e.target.value)}
//                           className="block w-full ps-11 pe-4 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none font-bold"
//                           placeholder="أدخل اسم المستخدم..."
//                           dir="ltr"
//                           required
//                         />
//                       </div>
//                     </div>
//                     <div className="space-y-1.5">
//                       <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 ms-1">
//                         كلمة المرور / الرمز السري
//                       </label>
//                       <div className="relative">
//                         <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
//                           <KeyRound className="h-5 w-5 text-slate-500" />
//                         </div>
//                         <input
//                           type={showPassword ? "text" : "password"}
//                           value={empPassword}
//                           onChange={(e) => setEmpPassword(e.target.value)}
//                           className="block w-full ps-11 pe-12 py-3.5 bg-slate-100 dark:bg-[#1a1f26] border border-transparent rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none font-mono"
//                           placeholder="••••••••"
//                           dir="ltr"
//                           required
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setShowPassword(!showPassword)}
//                           className="absolute inset-y-0 end-0 pe-4 flex items-center text-slate-500 hover:text-slate-600 dark:text-slate-300 transition-colors"
//                         >
//                           {showPassword ? (
//                             <EyeOff className="h-5 w-5" />
//                           ) : (
//                             <Eye className="h-5 w-5" />
//                           )}
//                         </button>
//                       </div>
//                     </div>
//                   </>
//                 )}

//                 <button
//                   type="submit"
//                   disabled={isLoading}
//                   className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#11151c] focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-[0_0_20px_var(--accent-500)] shadow-primary-500/30 hover:shadow-primary-500/40"
//                 >
//                   {isLoading ? (
//                     <Loader2 className="h-5 w-5 animate-spin" />
//                   ) : loginMode === "signup" ? (
//                     "إنشاء الحساب"
//                   ) : (
//                     "تسجيل الدخول"
//                   )}
//                 </button>
//               </form>
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ==========================================
// // 2. لوحة التحكم (Dashboard Screen)
// // ==========================================
// function Dashboard({
//   onLogout,
//   onUnlinkDevice,
//   isDarkMode,
//   toggleDarkMode,
//   isFullscreen,
//   toggleFullscreen,
// }: {
//   onLogout: () => void;
//   onUnlinkDevice: () => void;
//   isDarkMode: boolean;
//   toggleDarkMode: () => void;
//   isFullscreen: boolean;
//   toggleFullscreen: () => void;
// }) {
//   const { settings } = useSettings();
//   const { isOwner, isBranchManager } = useBranch();
//   const { canViewReports } = useBranchPermissions();
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [activeView, setActiveView] = useState(() => {
//     const activeCashierUser = localStorage.getItem("active_cashier")
//       ? JSON.parse(localStorage.getItem("active_cashier") || "{}")
//       : null;
//     if (!activeCashierUser) return "dashboard"; // Admin

//     // Employee logic: pick first allowed page
//     const allowed = activeCashierUser?.permissions?.pages || [];
//     if (allowed.length > 0) return allowed[0];
//     return "pos"; // Fallback
//   });
//   const [activeWarehouse, setActiveWarehouse] = useState<any>(null);
//   const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
//     sales: false,
//     purchases: false,
//   });

//   useEffect(() => {
//     if (localStorage.getItem("open_settings_on_load") === "true") {
//       localStorage.removeItem("open_settings_on_load");
//       setTimeout(() => {
//         setActiveView("settings");
//       }, 0);
//     }
//   }, []);

//   useEffect(() => {
//     const handleNavigation = (e: CustomEvent) => {
//       if (e.detail) setActiveView(e.detail);
//     };

//     // @ts-ignore
//     window.addEventListener("navigate", handleNavigation);
//     return () => {
//       // @ts-ignore
//       window.removeEventListener("navigate", handleNavigation);
//     };
//   }, []);

//   const handleLogoutClick = () => {
//     onLogout();
//   };

//   const toggleMenu = (id: string) => {
//     setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
//   };

//   const sidebarActiveId =
//     activeWarehouse &&
//     ["devices", "accessories", "spare_parts", "custom_warehouse"].includes(
//       activeView,
//     )
//       ? "warehouses"
//       : activeView;

//   // هيكل المنيو بالكامل بناءً على الصور
//   const fullMenuStructure = [
//     { type: "header", label: "الأساسية", group: "main" },
//     { type: "item", icon: Home, label: "الرئيسية", id: "dashboard" },
//     { type: "item", icon: ShoppingCart, label: "نقطة البيع", id: "pos" },
//     { type: "item", icon: Wrench, label: "الصيانة", id: "maintenance" },

//     { type: "header", label: "المخزون", group: "warehouses" },
//     { type: "item", icon: Warehouse, label: "المخازن", id: "warehouses" },
//     {
//       type: "item",
//       icon: ArrowRightLeft,
//       label: "تحويلات الفروع",
//       id: "branch_transfers",
//     },
//     {
//       type: "item",
//       icon: Smartphone,
//       label: "الأجهزة",
//       id: "devices",
//       onClick: () => {
//         setActiveWarehouse(null);
//         setActiveView("devices");
//       },
//     },
//     {
//       type: "item",
//       icon: Headphones,
//       label: "الإكسسوارات",
//       id: "accessories",
//       onClick: () => {
//         setActiveWarehouse(null);
//         setActiveView("accessories");
//       },
//     },
//     {
//       type: "item",
//       icon: PenTool,
//       label: "مخزن قطع الغيار",
//       id: "spare_parts",
//       onClick: () => {
//         setActiveWarehouse(null);
//         setActiveView("spare_parts");
//       },
//     },
//     {
//       type: "item",
//       icon: CreditCard,
//       label: "مكن الشحن ",
//       id: "recharge_cards",
//       onClick: () => {
//         setActiveWarehouse(null);
//         setActiveView("recharge_cards");
//       },
//     },

//     { type: "header", label: "العمليات", group: "sales_purchases" },
//     {
//       type: "collapse",
//       icon: LineChart,
//       label: "المبيعات",
//       id: "sales",
//       subItems: [
//         { label: "المبيعات العامة", id: "general_sales" },
//         { label: "مبيعات الأجهزة", id: "device_sales" },
//         { label: "مبيعات الإكسسوارات", id: "accessory_sales" },
//         { label: "مبيعات قطع الغيار", id: "spare_part_sales" },
//       ],
//     },
//     {
//       type: "collapse",
//       icon: DollarSign,
//       label: "التقسيط",
//       id: "installments_menu",
//       subItems: [
//         { label: "لوحة تحكم التقسيط", id: "installments_dashboard" },
//         { label: "العقود", id: "installment_contracts" },
//         { label: "توقعات التدفق النقدي", id: "installment_cashflow" },
//         { label: "سجل الحركات (Audit)", id: "installment_audit_logs" },
//       ],
//     },
//     {
//       type: "collapse",
//       icon: Download,
//       label: "المشتريات",
//       id: "purchases",
//       subItems: [
//         { label: "المشتريات العامة", id: "general_purchases" },
//         { label: "مشتريات الأجهزة", id: "device_purchases" },
//         { label: "مشتريات الإكسسوارات", id: "accessory_purchases" },
//         { label: "مشتريات قطع الغيار", id: "spare_part_purchases" },
//       ],
//     },

//     { type: "header", label: "الحسابات", group: "finance" },
//     {
//       type: "item",
//       icon: Calculator,
//       label: "الحسابات العامة",
//       id: "accounting",
//     }, // We'll tie to treasury
//     { type: "item", icon: Landmark, label: "الخزينة", id: "treasury" },
//     { type: "item", icon: DollarSign, label: "رأس المال", id: "capital" },
//     { type: "item", icon: Users, label: "العملاء", id: "customers" },
//     { type: "item", icon: Truck, label: "الموردين", id: "suppliers" },

//     { type: "header", label: "الإدارة", group: "admin" },
//     {
//       type: "item",
//       icon: Building2,
//       label: "إدارة الفروع",
//       id: "branch_management",
//     },
//     {
//       type: "item",
//       icon: BarChart3,
//       label: "أداء الفروع",
//       id: "branch_analytics",
//     },
//     { type: "item", icon: Briefcase, label: "الموظفين", id: "employees" },
//     { type: "item", icon: DollarSign, label: "الرواتب", id: "salaries" }, // Tied to employees
//     {
//       type: "item",
//       icon: TrendingUp,
//       label: "عمولات البيع",
//       id: "sales_commissions",
//     },
//     { type: "item", icon: Shield, label: "المستخدمين", id: "users" }, // Admin only
//     { type: "item", icon: Handshake, label: "الشركاء", id: "partners" },
//     { type: "item", icon: FileText, label: "التقارير", id: "reports" },
//     { type: "item", icon: LineChart, label: "تحليلات الإدارة", id: "manager_analytics" },
//     { type: "item", icon: Settings, label: "الإعدادات", id: "settings" },

//     { type: "header", label: "أدوات ذكية", group: "tools" },
//     {
//       type: "item",
//       icon: FileText,
//       label: "قصة السيريال (IMEI)",
//       id: "imei_tracker",
//     },

//     { type: "header", label: "أدوات", group: "tools" },
//     { type: "item", icon: AlarmClock, label: "التذكيرات", id: "reminders" },
//     { type: "item", icon: Archive, label: "الأرشيف", id: "archive" },
//     { type: "item", icon: Ban, label: "البلاك ليست", id: "blacklist" },
//     { type: "item", icon: BookOpen, label: "دليل المستخدم", id: "manual" },
//   ].filter((item) => {
//     if (settings.hasBranches === false) {
//       if (
//         ["branch_transfers", "branch_management", "branch_analytics"].includes(
//           (item as any).id,
//         )
//       ) {
//         return false;
//       }
//     }
//     return true;
//   });

//   const activeCashierUser = localStorage.getItem("active_cashier")
//     ? JSON.parse(localStorage.getItem("active_cashier") || "{}")
//     : null;
//   const isAdmin = !activeCashierUser;
//   const allowedPages = activeCashierUser?.permissions?.pages || [];

//   const checkPermission = (id: string, group?: string) => {
//     if (isOwner) return true;
//     if (isBranchManager) {
//       if (id === "branch_management" || id === "branch_analytics") return false; // Owner only
//       if (id === "reports" && !canViewReports) return false;
//       return true;
//     }

//     if (
//       id === "dashboard" ||
//       id === "branch_management" ||
//       id === "branch_analytics"
//     )
//       return false; // Strictly owner
//     if (id === "users") return false; // Strictly owner/manager

//     const permMap: Record<string, string[]> = {
//       pos: ["pos"],
//       maintenance: ["maintenance"],
//       warehouses: ["warehouses"],
//       branch_transfers: ["warehouses"],
//       inventory: ["warehouses"],
//       devices: ["warehouses"],
//       accessories: ["warehouses"],
//       spare_parts: ["warehouses"],
//       sales: ["sales"],
//       installments_dashboard: ["sales"],
//       installment_contracts: ["sales"],
//       installment_cashflow: ["sales", "reports"],
//       installment_audit_logs: ["sales", "reports"],
//       purchases: ["purchases"],
//       accounting: ["accounting"],
//       treasury: ["treasury"],
//       customers: ["customers"],
//       suppliers: ["suppliers"],
//       employees: ["employees"],
//       salaries: ["employees"],
//       sales_commissions: ["employees"],
//       branch_management: [], // Strictly admin
//       branch_analytics: [], // Strictly admin
//       capital: [], // Strictly admin
//       users: [], // Strictly admin
//       partners: ["partners"],
//       reports: ["reports"],
//       settings: ["settings"],
//       reminders: ["reminders"],
//       imei_tracker: ["pos", "sales", "maintenance", "warehouses"], // Allow if they have related modules
//       manager_analytics: [],
//       archive: ["reports", "settings"],
//       blacklist: ["customers", "sales"],
//       manual: ["pos", "sales", "warehouses"],
//     };

//     const requiredPerms = permMap[id];
//     if (!requiredPerms) return true; // Allow unmapped headers/items by default unless they are empty array

//     if (id === "users") {
//       const special = activeCashierUser?.permissions?.special || [];
//       return special.includes("إدارة المستخدمين");
//     }

//     if (requiredPerms.length === 0) return false; // Admin only

//     return requiredPerms.some((p) => allowedPages.includes(p));
//   };

//   const menuStructure = fullMenuStructure.filter((item) => {
//     if (isOwner || isBranchManager) {
//       if (
//         item.id === "branch_management" ||
//         item.id === "branch_analytics" ||
//         item.id === "capital"
//       )
//         return isOwner;
//       if (item.type === "header" && item.group === "branch") return isOwner;
//       return true;
//     }
//     if (item.type === "header") {
//       // Only show headers if at least one item below them isn't filtered out, but for simplicity, we will just let it be.
//       // A better way is to do a 2-pass filter, but we can also just broadly show headers if the group has any permissions.
//       if (item.group === "warehouses" && !allowedPages.includes("warehouses"))
//         return false;
//       if (
//         item.group === "sales_purchases" &&
//         !allowedPages.includes("sales") &&
//         !allowedPages.includes("purchases")
//       )
//         return false;
//       if (
//         item.group === "finance" &&
//         !allowedPages.includes("treasury") &&
//         !allowedPages.includes("customers") &&
//         !allowedPages.includes("suppliers")
//       )
//         return false;
//       if (
//         item.group === "admin" &&
//         !allowedPages.includes("employees") &&
//         !allowedPages.includes("partners") &&
//         !allowedPages.includes("reports") &&
//         !allowedPages.includes("settings") &&
//         !(activeCashierUser?.permissions?.special || []).includes(
//           "إدارة المستخدمين",
//         )
//       )
//         return false;
//       return true;
//     }
//     return checkPermission(item.id as string);
//   });

//   return (
//     <div
//       className="flex h-screen bg-slate-50 dark:bg-[#080c13] text-slate-900 dark:text-white overflow-hidden"
//       dir="rtl"
//     >
//       {/* Mobile Sidebar Overlay */}
//       <AnimatePresence>
//         {isMobileMenuOpen && (
//           <>
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               onClick={() => setIsMobileMenuOpen(false)}
//               className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
//             />
//             <motion.aside
//               initial={{ x: "100%" }}
//               animate={{ x: 0 }}
//               exit={{ x: "100%" }}
//               transition={{ type: "spring", damping: 25, stiffness: 200 }}
//               className="fixed top-0 bottom-0 right-0 w-56 bg-white dark:bg-[#11151c] flex flex-col z-50 border-l border-slate-200 dark:border-white/5 md:hidden"
//             >
//               <div className="h-20 flex items-center px-4 shrink-0 justify-between">
//                 <div className="flex items-center">
//                   {settings.logo ? (
//                     <img
//                       src={settings.logo}
//                       alt="Logo"
//                       className="h-10 w-auto max-w-[80px] object-contain me-3 drop-shadow-sm"
//                     />
//                   ) : (
//                     <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--accent-500)] shadow-primary-500/50 me-2 shrink-0">
//                       <Smartphone className="w-5 h-5 text-white" />
//                     </div>
//                   )}
//                   <span className="font-black text-xl tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
//                     {settings.companyName}
//                   </span>
//                 </div>
//                 <button
//                   onClick={() => setIsMobileMenuOpen(false)}
//                   className="p-2 text-slate-500"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//               {/* Scrollable Menu Area */}
//               <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
//                 {menuStructure.map((item: any, index) => {
//                   if (item.type === "header") {
//                     return (
//                       <div
//                         key={index}
//                         className={`flex items-center gap-2 ${index !== 0 ? "mt-6" : "mt-2"} mb-2 px-2`}
//                       >
//                         <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
//                         <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full uppercase">
//                           {item.label}
//                         </span>
//                         <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
//                       </div>
//                     );
//                   }

//                   if (item.type === "collapse") {
//                     const isOpen = openMenus[item.id];
//                     return (
//                       <div key={index} className="mb-1">
//                         <button
//                           onClick={() => toggleMenu(item.id)}
//                           className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group"
//                         >
//                           <div className="flex items-center gap-3">
//                             <item.icon className="w-4 h-4 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300 transition-colors" />
//                             <span className="text-sm font-medium">
//                               {item.label}
//                             </span>
//                           </div>
//                           <ChevronDown
//                             className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
//                           />
//                         </button>
//                         {/* Sub items */}
//                         <motion.div
//                           initial={false}
//                           animate={{
//                             height: isOpen ? "auto" : 0,
//                             opacity: isOpen ? 1 : 0,
//                           }}
//                           className="overflow-hidden"
//                         >
//                           <div className="mt-1 space-y-1 px-3 ps-11 pb-2">
//                             {item.subItems.map((sub: any, idx: number) => (
//                               <button
//                                 key={idx}
//                                 onClick={() => {
//                                   setActiveWarehouse(null);
//                                   sub.id && setActiveView(sub.id);
//                                   setIsMobileMenuOpen(false);
//                                 }}
//                                 className={`w-full text-start py-1.5 text-[13px] font-medium transition-colors relative before:content-[''] before:absolute before:start-[-16px] before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full ${sidebarActiveId === sub.id ? "text-primary-600 dark:text-primary-400 before:bg-primary-600 dark:before:bg-primary-400" : "text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 before:bg-slate-300 dark:before:bg-slate-700 hover:before:bg-primary-600 dark:hover:before:bg-primary-400"}`}
//                               >
//                                 {sub.label}
//                               </button>
//                             ))}
//                           </div>
//                         </motion.div>
//                       </div>
//                     );
//                   }

//                   // Normal Item
//                   return (
//                     <button
//                       key={index}
//                       onClick={() => {
//                         if (item.onClick) {
//                           item.onClick();
//                         } else if (item.id) {
//                           setActiveWarehouse(null);
//                           setActiveView(item.id);
//                         }
//                         setIsMobileMenuOpen(false);
//                       }}
//                       className={`mb-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
//                         sidebarActiveId === item.id
//                           ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold"
//                           : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
//                       }`}
//                     >
//                       <item.icon
//                         className={`w-4 h-4 ${sidebarActiveId === item.id ? "text-primary-600 dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`}
//                       />
//                       <span className="text-sm">{item.label}</span>
//                     </button>
//                   );
//                 })}
//               </div>

//               {/* User Profile & Logout */}
//               <div className="p-4 border-t border-slate-200 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-[#0d1117]">
//                 <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 mb-3 border border-slate-200 dark:border-white/5">
//                   <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-inner flex-shrink-0">
//                     {(() => {
//                       let initial = "M";
//                       const c = localStorage.getItem("active_cashier");
//                       if (c) {
//                         try {
//                           const parsed = JSON.parse(c);
//                           const nameStr =
//                             parsed.full_name ||
//                             parsed.username ||
//                             parsed.email ||
//                             parsed.name ||
//                             "M";
//                           if (nameStr)
//                             initial = nameStr.charAt(0).toUpperCase();
//                         } catch (e) {}
//                       } else if (
//                         localStorage.getItem("admin_active") === "true"
//                       ) {
//                         initial = "A";
//                       }
//                       return initial;
//                     })()}
//                   </div>
//                   <div className="flex-1 overflow-hidden">
//                     <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
//                       {(() => {
//                         let name = "المدير";
//                         const c = localStorage.getItem("active_cashier");
//                         if (c) {
//                           try {
//                             const parsed = JSON.parse(c);
//                             name =
//                               parsed.full_name ||
//                               parsed.username ||
//                               parsed.email ||
//                               parsed.name ||
//                               "المدير";
//                           } catch (e) {}
//                         }
//                         return name;
//                       })()}
//                     </div>
//                     <div className="text-xs text-slate-500 truncate">
//                       {(() => {
//                         let roleStr = "موظف مبيعات";
//                         if (localStorage.getItem("admin_active") === "true") {
//                           return "إدارة النظام";
//                         }
//                         const c = localStorage.getItem("active_cashier");
//                         if (c) {
//                           try {
//                             const parsed = JSON.parse(c);
//                             if (
//                               parsed.role_level === 1 ||
//                               parsed.role === "owner" ||
//                               parsed.role === "admin"
//                             )
//                               roleStr = "إدارة النظام";
//                             else if (
//                               parsed.role_level === 2 ||
//                               parsed.role === "manager"
//                             )
//                               roleStr = "مدير فرع";
//                             else roleStr = "موظف مبيعات";
//                           } catch (e) {}
//                         }
//                         return roleStr;
//                       })()}
//                     </div>
//                   </div>
//                   <button
//                     onClick={handleLogoutClick}
//                     className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
//                     title="تسجيل خروج"
//                   >
//                     <LogOut className="w-5 h-5" />
//                   </button>
//                 </div>
//               </div>
//             </motion.aside>
//           </>
//         )}
//       </AnimatePresence>

//       {/* Desktop Sidebar */}
//       <aside className="w-56 bg-white dark:bg-[#11151c] flex flex-col hidden md:flex z-20 border-l border-slate-200 dark:border-white/5">
//         <div className="h-20 flex items-center px-4 shrink-0">
//           {settings.logo ? (
//             <img
//               src={settings.logo}
//               alt="Logo"
//               className="h-10 w-auto max-w-[80px] object-contain me-3 drop-shadow-sm"
//             />
//           ) : (
//             <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--accent-500)] shadow-primary-500/50 me-2 shrink-0">
//               <Smartphone className="w-5 h-5 text-white" />
//             </div>
//           )}
//           <span className="font-black text-xl tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
//             {settings.companyName}
//           </span>
//         </div>

//         {/* Scrollable Menu Area */}
//         <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
//           {menuStructure.map((item: any, index) => {
//             if (item.type === "header") {
//               return (
//                 <div
//                   key={index}
//                   className={`flex items-center gap-2 ${index !== 0 ? "mt-6" : "mt-2"} mb-2 px-2`}
//                 >
//                   <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
//                   <span className="text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full uppercase">
//                     {item.label}
//                   </span>
//                   <div className="h-px bg-slate-200 dark:bg-white/10 flex-1"></div>
//                 </div>
//               );
//             }

//             if (item.type === "collapse") {
//               const isOpen = openMenus[item.id];
//               return (
//                 <div key={index} className="mb-1">
//                   <button
//                     onClick={() => toggleMenu(item.id)}
//                     className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 transition-all group"
//                   >
//                     <div className="flex items-center gap-3">
//                       <item.icon className="w-4 h-4 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300 transition-colors" />
//                       <span className="text-sm font-medium">{item.label}</span>
//                     </div>
//                     <ChevronDown
//                       className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
//                     />
//                   </button>
//                   {/* Sub items */}
//                   <motion.div
//                     initial={false}
//                     animate={{
//                       height: isOpen ? "auto" : 0,
//                       opacity: isOpen ? 1 : 0,
//                     }}
//                     className="overflow-hidden"
//                   >
//                     <div className="mt-1 space-y-1 px-3 ps-11 pb-2">
//                       {item.subItems.map((sub: any, idx: number) => (
//                         <button
//                           key={idx}
//                           onClick={() => {
//                             setActiveWarehouse(null);
//                             sub.id && setActiveView(sub.id);
//                           }}
//                           className={`w-full text-start py-1.5 text-[13px] font-medium transition-colors relative before:content-[''] before:absolute before:start-[-16px] before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full ${sidebarActiveId === sub.id ? "text-primary-600 dark:text-primary-400 before:bg-primary-600 dark:before:bg-primary-400" : "text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 before:bg-slate-300 dark:before:bg-slate-700 hover:before:bg-primary-600 dark:hover:before:bg-primary-400"}`}
//                         >
//                           {sub.label}
//                         </button>
//                       ))}
//                     </div>
//                   </motion.div>
//                 </div>
//               );
//             }

//             // Normal Item
//             return (
//               <button
//                 key={index}
//                 onClick={() => {
//                   if (item.onClick) {
//                     item.onClick();
//                   } else if (item.id) {
//                     setActiveWarehouse(null);
//                     setActiveView(item.id);
//                   }
//                 }}
//                 className={`mb-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
//                   sidebarActiveId === item.id
//                     ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold"
//                     : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
//                 }`}
//               >
//                 <item.icon
//                   className={`w-4 h-4 ${sidebarActiveId === item.id ? "text-primary-600 dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`}
//                 />
//                 <span className="text-sm">{item.label}</span>
//               </button>
//             );
//           })}
//         </div>

//         {/* User Profile & Logout */}
//         <div className="p-4 border-t border-slate-200 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-[#0d1117]">
//           <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 mb-3 border border-slate-200 dark:border-white/5">
//             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-inner flex-shrink-0">
//               {(() => {
//                 let initial = "M";
//                 const c = localStorage.getItem("active_cashier");
//                 if (c) {
//                   try {
//                     const parsed = JSON.parse(c);
//                     const nameStr =
//                       parsed.full_name ||
//                       parsed.username ||
//                       parsed.email ||
//                       parsed.name ||
//                       "M";
//                     if (nameStr) initial = nameStr.charAt(0).toUpperCase();
//                   } catch (e) {}
//                 } else if (localStorage.getItem("admin_active") === "true") {
//                   initial = "A";
//                 }
//                 return initial;
//               })()}
//             </div>
//             <div className="flex-1 overflow-hidden">
//               <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
//                 {(() => {
//                   let name = "المدير";
//                   const c = localStorage.getItem("active_cashier");
//                   if (c) {
//                     try {
//                       const parsed = JSON.parse(c);
//                       name =
//                         parsed.full_name ||
//                         parsed.username ||
//                         parsed.email ||
//                         parsed.name ||
//                         "المدير";
//                     } catch (e) {}
//                   }
//                   return name;
//                 })()}
//               </div>
//               <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
//                 {(() => {
//                   let roleStr = "موظف مبيعات";
//                   if (localStorage.getItem("admin_active") === "true") {
//                     return "إدارة النظام";
//                   }
//                   const c = localStorage.getItem("active_cashier");
//                   if (c) {
//                     try {
//                       const parsed = JSON.parse(c);
//                       if (
//                         parsed.role_level === 1 ||
//                         parsed.role === "owner" ||
//                         parsed.role === "admin"
//                       )
//                         roleStr = "إدارة النظام";
//                       else if (
//                         parsed.role_level === 2 ||
//                         parsed.role === "manager"
//                       )
//                         roleStr = "مدير فرع";
//                       else roleStr = "موظف مبيعات";
//                     } catch (e) {}
//                   }
//                   return roleStr;
//                 })()}
//               </div>
//             </div>
//           </div>
//           <div className="flex gap-2">
//             <button
//               onClick={handleLogoutClick}
//               className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
//             >
//               <LogOut className="w-4 h-4" />
//               خروج
//             </button>
//             <button
//               onClick={onUnlinkDevice}
//               title="إلغاء ربط الجهاز"
//               className="w-10 flex items-center justify-center rounded-xl text-sm font-bold text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-950/50 dark:hover:bg-red-900/50 transition-all"
//             >
//               <Ban className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       </aside>

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col overflow-hidden relative">
//         {/* Header */}
//         <header className="h-20 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#080c13]/80 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
//           <div className="flex items-center gap-4">
//             <button
//               onClick={() => setIsMobileMenuOpen(true)}
//               className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
//             >
//               <Menu className="w-6 h-6" />
//             </button>
//             <div className="flex items-center gap-3">
//               {activeView === "pos" && (
//                 <ShoppingCart className="w-6 h-6 text-slate-900 dark:text-white hidden sm:block" />
//               )}
//               {activeView === "accessories" && (
//                 <Headphones className="w-6 h-6 text-slate-900 dark:text-white hidden sm:block" />
//               )}
//               <h1 className="text-2xl font-black text-slate-900 dark:text-white hidden sm:block">
//                 {activeWarehouse
//                   ? activeWarehouse.name
//                   : activeView === "dashboard"
//                     ? "الرئيسية"
//                     : activeView === "accessories"
//                       ? "الإكسسوارات"
//                       : activeView === "devices"
//                         ? "الأجهزة"
//                         : activeView === "maintenance"
//                           ? "الصيانة"
//                           : activeView === "spare_parts"
//                             ? "مخزن قطع الغيار"
//                             : activeView === "recharge_cards"
//                               ? "مكن الشحن"
//                               : activeView === "general_sales"
//                                 ? "المبيعات العامة"
//                                 : activeView === "device_sales"
//                                   ? "مبيعات الأجهزة"
//                                   : activeView === "accessory_sales"
//                                     ? "مبيعات الإكسسوارات"
//                                     : activeView === "spare_part_sales"
//                                       ? "مبيعات قطع الغيار"
//                                       : activeView === "general_purchases"
//                                         ? "المشتريات العامة"
//                                         : activeView === "device_purchases"
//                                           ? "مشتريات الأجهزة"
//                                           : activeView === "accessory_purchases"
//                                             ? "مشتريات الإكسسوارات"
//                                             : activeView ===
//                                                 "spare_part_purchases"
//                                               ? "مشتريات قطع الغيار"
//                                               : activeView ===
//                                                   "installments_dashboard"
//                                                 ? "لوحة تحكم التقسيط"
//                                                 : activeView ===
//                                                     "installment_contracts"
//                                                   ? "عقود التقسيط"
//                                                   : activeView === "pos"
//                                                     ? "نقطة البيع"
//                                                     : activeView ===
//                                                         "accounting"
//                                                       ? "الحسابات العامة"
//                                                       : activeView ===
//                                                           "treasury"
//                                                         ? "الخزينة"
//                                                         : activeView ===
//                                                             "customers"
//                                                           ? "العملاء"
//                                                           : activeView ===
//                                                               "warehouses"
//                                                             ? "المخازن"
//                                                             : activeView ===
//                                                                 "branch_transfers"
//                                                               ? "تحويلات الفروع"
//                                                               : activeView ===
//                                                                   "inventory"
//                                                                 ? "الجرد"
//                                                                 : activeView ===
//                                                                     "salaries"
//                                                                   ? "الرواتب والأجور"
//                                                                   : activeView ===
//                                                                       "branch_management"
//                                                                     ? "إدارة الفروع"
//                                                                     : activeView ===
//                                                                         "reports"
//                                                                       ? "التقارير"
//                                                                       : activeView ===
//                                                                           "users"
//                                                                         ? "المستخدمين"
//                                                                         : activeView ===
//                                                                             "settings"
//                                                                           ? "الإعدادات"
//                                                                           : "الرئيسية"}
//               </h1>
//               <div id="header-actions" className="ms-6">
//                 {settings.hasBranches !== false && <BranchSelector />}
//               </div>
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <div className="relative hidden lg:block">
//               <Search className="w-4 h-4 text-primary-400 absolute top-1/2 start-3 -translate-y-1/2" />
//               <input
//                 type="text"
//                 placeholder="بحث Ctrl+K"
//                 className="w-48 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl py-2 ps-9 pe-4 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-colors"
//               />
//             </div>

//             <div className="hidden xl:flex items-center gap-2 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
//               <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
//               <LiveClock />
//             </div>

//             {checkPermission("blacklist") && (
//               <button
//                 onClick={() => setActiveView("blacklist")}
//                 className="hidden sm:flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
//               >
//                 <Ban className="w-4 h-4" />
//                 البلاك ليست
//               </button>
//             )}

//             <button
//               onClick={toggleFullscreen}
//               className="hidden sm:flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 w-10 h-10 rounded-xl transition-colors"
//               title={isFullscreen ? "إنهاء ملء الشاشة" : "ملء الشاشة"}
//             >
//               {isFullscreen ? (
//                 <Minimize className="w-4 h-4" />
//               ) : (
//                 <Maximize className="w-4 h-4" />
//               )}
//             </button>

//             <button
//               onClick={toggleDarkMode}
//               className="hidden sm:flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
//             >
//               {isDarkMode ? (
//                 <>
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
//                     />
//                   </svg>
//                   وضع فاتح
//                 </>
//               ) : (
//                 <>
//                   <svg
//                     className="w-4 h-4"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
//                     />
//                   </svg>
//                   وضع داكن
//                 </>
//               )}
//             </button>

//             {checkPermission("dashboard") && activeView !== "dashboard" && (
//               <button
//                 onClick={() => setActiveView("dashboard")}
//                 className="flex items-center gap-2 bg-white dark:bg-[#11151c] hover:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
//               >
//                 رجوع
//                 <svg
//                   className="w-4 h-4"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M10 19l-7-7m0 0l7-7m-7 7h18"
//                   />
//                 </svg>
//               </button>
//             )}
//           </div>
//         </header>

//         {/* Dashboard Scrollable Area */}
//         <main
//           className={`flex-1 overflow-y-auto z-10 custom-scrollbar ${activeView === "pos" ? "p-2 md:p-4" : "p-4 md:p-6 lg:p-8"}`}
//         >
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={activeView}
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               transition={{ duration: 0.2 }}
//               className={`w-full mx-auto space-y-6 pb-10 ${activeView === "pos" ? "max-w-full h-full pb-0" : "xl:max-w-[1400px] 2xl:max-w-[1600px]"}`}
//             >
//               {activeView === "imei_tracker" && <IMEITracker />}

//               {activeView === "blacklist" && <Blacklist />}

//               {activeView === "reminders" && <Reminders />}

//               {activeView === "dashboard" && (
//                 <DashboardHome setActiveView={setActiveView} />
//               )}

//               {activeView === "installments_dashboard" && (
//                 <InstallmentsDashboard onNavigate={setActiveView} />
//               )}

//               {activeView === "installment_contracts" && (
//                 <InstallmentContracts onNavigate={setActiveView} />
//               )}

//               {activeView === "installment_cashflow" && (
//                 <CashFlowForecastReport />
//               )}

//               {activeView === "installment_audit_logs" && (
//                 <InstallmentAuditLogs />
//               )}

//               {activeView === "maintenance" && <Maintenance />}

//               {activeView === "pos" && <POS />}

//               {activeView === "devices" && (
//                 <Devices warehouse={activeWarehouse} />
//               )}

//               {activeView === "accessories" && (
//                 <Accessories warehouse={activeWarehouse} />
//               )}

//               {activeView === "spare_parts" && (
//                 <SpareParts warehouse={activeWarehouse} />
//               )}

//               {activeView === "recharge_cards" && <RechargeCards />}

//               {activeView === "general_sales" && <GeneralSales />}

//               {activeView === "device_sales" && <DeviceSales />}

//               {activeView === "accessory_sales" && <AccessorySales />}

//               {activeView === "spare_part_sales" && <SparePartSales />}

//               {activeView === "general_purchases" && <GeneralPurchases />}

//               {activeView === "device_purchases" && <DevicePurchases />}

//               {activeView === "accessory_purchases" && <AccessoryPurchases />}

//               {activeView === "spare_part_purchases" && <SparePartPurchases />}

//               {activeView === "warehouses" && (
//                 <Warehouses
//                   onNavigate={(view, warehouse) => {
//                     setActiveWarehouse(warehouse || null);
//                     setActiveView(view);
//                   }}
//                 />
//               )}

//               {activeView === "branch_transfers" && <BranchTransfers />}

//               {activeView === "inventory" && (
//                 <Inventory
//                   onNavigate={(view, warehouse) => {
//                     setActiveWarehouse(warehouse || null);
//                     setActiveView(view);
//                   }}
//                 />
//               )}

//               {activeView === "customers" && <Customers />}

//               {activeView === "suppliers" && <Suppliers />}

//               {activeView === "employees" && <Employees />}

//               {activeView === "branch_management" && <BranchManagement />}

//               {activeView === "branch_analytics" && <BranchAnalytics />}

//               {activeView === "users" && <UsersPage />}

//               {activeView === "salaries" && <Salaries />}

//               {activeView === "sales_commissions" && <SalesCommissions />}

//               {activeView === "accounting" && <GeneralAccounts />}

//               {activeView === "partners" && <Partners />}

//               {activeView === "reports" && <Reports />}
//               {activeView === "manager_analytics" && <ManagerAnalytics />}

//               {activeView === "treasury" && <Treasury />}
//               {activeView === "capital" && <Capital />}

//               {activeView === "archive" && <ArchivePage />}

//               {activeView === "low_stock" && (
//                 <div className="p-6 h-full flex flex-col">
//                   <div className="flex justify-between items-center mb-4">
//                     <button
//                       onClick={() => setActiveView("dashboard")}
//                       className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
//                     >
//                       العودة للرئيسية <ArrowRight className="w-4 h-4 ml-2" />
//                     </button>
//                   </div>
//                   <div className="flex-1 bg-white dark:bg-[#11151c] rounded-3xl overflow-hidden shadow">
//                     <LowStockReport />
//                   </div>
//                 </div>
//               )}

//               {activeView === "settings" && <SettingsPage />}
//               {activeView === "manual" && <Manual />}

//               {/* Empty state for components that don't exist yet */}
//               {["reminders"].includes(activeView) && (
//                 <div className="flex flex-col items-center justify-center p-20 text-center text-slate-500">
//                   <Wrench className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-700" />
//                   <h2 className="text-2xl font-bold mb-2 text-slate-700 dark:text-slate-300">
//                     يتم العمل على هذه الصفحة
//                   </h2>
//                   <p>
//                     هذا القسم قيد التطوير وسيتم توفيره قريباً في التحديثات
//                     القادمة.
//                   </p>
//                 </div>
//               )}
//             </motion.div>
//           </AnimatePresence>
//         </main>
//       </div>
//     </div>
//   );
// }

// import SubscriptionGuard from "./components/SubscriptionGuard";

// // ==========================================
// // 3. المكون الرئيسي (App) الذي يدير التنقل
// // ==========================================
// export default function App() {
//   useEffect(() => {
//     handleAutoBackup();
//     const interval = setInterval(handleAutoBackup, 1000 * 60 * 60); // Check every hour
//     return () => clearInterval(interval);
//   }, []);
//   const { settings, updateSettings } = useSettings();

//   const [isAdminActive, setIsAdminActive] = useState<boolean>(
//     localStorage.getItem("admin_active") === "true",
//   );

//   const [activeCashier, setActiveCashier] = useState<any>(
//     localStorage.getItem("active_cashier")
//       ? JSON.parse(localStorage.getItem("active_cashier") || "{}")
//       : null,
//   );

//   const [isFullscreen, setIsFullscreen] = useState(
//     () => !!document.fullscreenElement,
//   );

//   const isAuthenticated = isAdminActive || !!activeCashier;

//   const isDarkMode =
//     settings.theme === "dark" ||
//     (settings.theme === "system" &&
//       window.matchMedia("(prefers-color-scheme: dark)").matches);

//   useEffect(() => {
//     const handleFullscreenChange = () => {
//       setIsFullscreen(!!document.fullscreenElement);
//     };

//     document.addEventListener("fullscreenchange", handleFullscreenChange);
//     return () =>
//       document.removeEventListener("fullscreenchange", handleFullscreenChange);
//   }, []);

//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       document.documentElement.requestFullscreen().catch((err) => {
//         console.error(`Error attempting to enable fullscreen: ${err.message}`);
//       });
//     } else {
//       document.exitFullscreen();
//     }
//   };

//   useEffect(() => {
//     if (isDarkMode) {
//       document.documentElement.classList.add("dark");
//     } else {
//       document.documentElement.classList.remove("dark");
//     }

//     document.documentElement.style.fontSize = `${settings.appFontSize}%`;

//     const colors: Record<string, any> = {
//       teal: {
//         50: "#f0fdfa",
//         100: "#ccfbf1",
//         200: "#99f6e4",
//         300: "#5eead4",
//         400: "#2dd4bf",
//         500: "#14b8a6",
//         600: "#0d9488",
//         700: "#0f766e",
//         800: "#115e59",
//         900: "#134e4a",
//         950: "#042f2e",
//       },
//       blue: {
//         50: "#eff6ff",
//         100: "#dbeafe",
//         200: "#bfdbfe",
//         300: "#93c5fd",
//         400: "#60a5fa",
//         500: "#3b82f6",
//         600: "#2563eb",
//         700: "#1d4ed8",
//         800: "#1e40af",
//         900: "#1e3a8a",
//         950: "#172554",
//       },
//       purple: {
//         50: "#faf5ff",
//         100: "#f3e8ff",
//         200: "#e9d5ff",
//         300: "#d8b4fe",
//         400: "#c084fc",
//         500: "#a855f7",
//         600: "#9333ea",
//         700: "#7e22ce",
//         800: "#6b21a8",
//         900: "#581c87",
//         950: "#3b0764",
//       },
//       emerald: {
//         50: "#ecfdf5",
//         100: "#d1fae5",
//         200: "#a7f3d0",
//         300: "#6ee7b7",
//         400: "#34d399",
//         500: "#10b981",
//         600: "#059669",
//         700: "#047857",
//         800: "#065f46",
//         900: "#064e3b",
//         950: "#022c22",
//       },
//       rose: {
//         50: "#fff1f2",
//         100: "#ffe4e6",
//         200: "#fecdd3",
//         300: "#fda4af",
//         400: "#fb7185",
//         500: "#f43f5e",
//         600: "#e11d48",
//         700: "#be123c",
//         800: "#9f1239",
//         900: "#881337",
//         950: "#4c0519",
//       },
//       amber: {
//         50: "#fffbeb",
//         100: "#fef3c7",
//         200: "#fde68a",
//         300: "#fcd34d",
//         400: "#fbbf24",
//         500: "#f59e0b",
//         600: "#d97706",
//         700: "#b45309",
//         800: "#92400e",
//         900: "#78350f",
//         950: "#451a03",
//       },
//     };

//     const selectedColor = colors[settings.accentColor] || colors["teal"];

//     Object.keys(selectedColor).forEach((shade) => {
//       document.documentElement.style.setProperty(
//         `--accent-${shade}`,
//         selectedColor[shade],
//       );
//     });
//   }, [isDarkMode, settings.appFontSize, settings.accentColor]);

//   const toggleDarkMode = () => {
//     updateSettings({ theme: isDarkMode ? "light" : "dark" });
//   };

//   const handleLogout = () => {
//     if (activeCashier) {
//       localStorage.removeItem("active_cashier");
//       setActiveCashier(null);
//     }
//     if (isAdminActive) {
//       localStorage.removeItem("admin_active");
//       setIsAdminActive(false);
//     }
//     // Also clear branch selection and notify listeners
//     localStorage.removeItem("takka_active_branch_id");
//     window.dispatchEvent(new CustomEvent("login_state_changed"));
//   };

//   const unlinkDevice = () => {
//     // Iframe environment often blocks window.confirm.
//     // Removed dialog to ensure it functions.
//     localStorage.removeItem("access_token");
//     localStorage.removeItem("user_id");
//     localStorage.removeItem("refresh_token");
//     localStorage.removeItem("admin_active");
//     localStorage.removeItem("active_cashier");
//     localStorage.removeItem("takka_active_branch_id");
//     setActiveCashier(null);
//     setIsAdminActive(false);
//     window.dispatchEvent(new CustomEvent("login_state_changed"));
//   };

//   useEffect(() => {
//     const handleAuthExpired = () => {
//       if (!localStorage.getItem("access_token")) return;
//       // Instead of wiping the entire device, just log out the current active session
//       // But if the tokens are dead, the owner actually has to log in again.
//       // The user requested that we don't force them to "login again and not stay saved" for transient token expirations.
//       alert("انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول");
//       localStorage.removeItem("admin_active");
//       localStorage.removeItem("active_cashier");
//       localStorage.removeItem("access_token");
//       localStorage.removeItem("refresh_token");
//       localStorage.removeItem("user_id");
//       setActiveCashier(null);
//       setIsAdminActive(false);
//       window.dispatchEvent(new CustomEvent("login_state_changed"));
//     };
//     window.addEventListener("auth_expired", handleAuthExpired);

//     // Proactive token refresh loop every 5 minutes
//     const checkToken = async () => {
//       const token = localStorage.getItem("access_token");
//       const refreshToken = localStorage.getItem("refresh_token");
//       if (!token || !refreshToken) return;

//       try {
//         const payload = JSON.parse(atob(token.split(".")[1]));
//         const exp = payload.exp * 1000;
//         const now = Date.now();
//         const timeToExpiry = exp - now;

//         // If it expires in less than 10 minutes, renew it proactively
//         if (timeToExpiry < 10 * 60 * 1000) {
//           const refreshRes = await fetch(
//             "https://hoohxkrrndtfpwsrnpyr.supabase.co/auth/v1/token?grant_type=refresh_token",
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
//               },
//               body: JSON.stringify({ refresh_token: refreshToken }),
//             },
//           );
//           if (refreshRes.ok) {
//             const data = await refreshRes.json();
//             if (data.access_token)
//               localStorage.setItem("access_token", data.access_token);
//             if (data.refresh_token)
//               localStorage.setItem("refresh_token", data.refresh_token);
//           }
//         }
//       } catch (e) {
//         // ignore errors in background refresh
//       }
//     };

//     const interval = setInterval(checkToken, 5 * 60 * 1000);
//     checkToken();

//     return () => {
//       window.removeEventListener("auth_expired", handleAuthExpired);
//       clearInterval(interval);
//     };
//   }, []);

//   const onLoginComplete = (type: "admin" | "cashier", data?: any) => {
//     if (type === "admin") {
//       setActiveCashier(data || null);
//       if (data) {
//         localStorage.setItem("active_cashier", JSON.stringify(data));
//       } else {
//         localStorage.removeItem("active_cashier");
//       }

//       setIsAdminActive(true);
//       localStorage.setItem("admin_active", "true");
//     } else {
//       setActiveCashier(data);
//       localStorage.setItem("active_cashier", JSON.stringify(data));

//       setIsAdminActive(false);
//       localStorage.removeItem("admin_active");
//     }
//     window.dispatchEvent(new CustomEvent("login_state_changed"));
//   };

//   return (
//     <>
//       {isAuthenticated ? (
//         <SubscriptionGuard>
//           <Dashboard
//             onLogout={handleLogout}
//             onUnlinkDevice={unlinkDevice}
//             isDarkMode={isDarkMode}
//             toggleDarkMode={toggleDarkMode}
//             isFullscreen={isFullscreen}
//             toggleFullscreen={toggleFullscreen}
//           />
//         </SubscriptionGuard>
//       ) : (
//         <Login onLogin={onLoginComplete} />
//       )}

//       {/* Floating WhatsApp Support Button */}
//       <a
//         href="https://wa.me/201037230660"
//         target="_blank"
//         rel="noopener noreferrer"
//         className="fixed bottom-6 right-6 z-[100] group flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebd5a] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
//       >
//         <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap font-bold text-sm">
//           تواصل مع الدعم الفني
//         </span>
//         <MessageCircle className="w-6 h-6" />
//       </a>
//     </>
//   );
// }
