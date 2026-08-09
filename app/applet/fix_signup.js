const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the handleWizardComplete function with a standard sign-up phase that sets showWizard
code = code.replace(
  `  const handleWizardComplete = async (wizardData: any) => {`,
  `  const [showWizard, setShowWizard] = useState(false);
  const [wizardInitData, setWizardInitData] = useState<any>(null);
  
  const handleWizardComplete = async (wizardData: any) => {`
);

// We need to bring back the signup submit
const handleSignupSnippet = `
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
            body: JSON.stringify({ email, password: adminPassword, data: { company_name: signupCompany, has_branches: signupHasBranches, full_name: 'مدير النظام' } }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error_description ||
              data.msg ||
              "حدث خطأ أثناء إنشاء الحساب",
          );
        }
        
        if (data.session) {
           setWizardInitData({
             email: email,
             companyName: signupCompany,
             password: adminPassword,
             sessionData: data
           });
           setShowWizard(true);
        } else {
           setError("تم إنشاء الحساب بنجاح! يرجي تسجيل الدخول");
           setLoginMode("admin");
        }
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء الاتصال بالخادم");
      } finally {
        setIsLoading(false);
      }
    } else if (loginMode === "admin") {`;

code = code.replace(`    if (loginMode === "admin") {`, handleSignupSnippet);

// Next we fix the handleWizardComplete to save logic
const newHandleWizardCode = `
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
         hasBranches: true
      };

      // Save to local storage right away so ui updates
      if (data?.user?.id) {
         localStorage.setItem(\`takka_settings_\${data.user.id}\`, JSON.stringify(newSettings));
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
           await new Promise(r => setTimeout(r, 1000));
           const appUsersRes = await fetch(
             \`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?user_id=eq.\${data.user.id}\`,
             {
               headers: {
                 apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                 Authorization: \`Bearer \${data.session.access_token}\`,
               },
             }
           );
           if (appUsersRes.ok) {
             const appUsersList = await appUsersRes.json();
             if (appUsersList && appUsersList.length > 0) {
               appUser = appUsersList[0];
               
               // Optionally update their app_users.settings directly here since trigger might not have set full settings
               await fetch(
                 \`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_users?id=eq.\${appUser.id}\`,
                 {
                   method: "PATCH",
                   headers: {
                     "Content-Type": "application/json",
                     apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                     Authorization: \`Bearer \${data.session.access_token}\`,
                   },
                   body: JSON.stringify({ settings: newSettings, full_name: wizardData.fullName })
                 }
               );
             }
           }
         } catch (e) {
           console.error("Could not fetch app_user for admin", e);
         }
         
         onLogin("admin", appUser);
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };`

code = code.replace(/  const handleWizardComplete = async \(wizardData: any\) => \{[\s\S]*?const handleLogin = async/m, newHandleWizardCode + "\n\n  const handleLogin = async");

// Fix the early return for the wizard
code = code.replace(
  /if \(loginMode === "signup"\) \{\s*return \(\s*<SignupWizard[\s\S]*?\/>\s*\);\s*\}/,
  \`if (showWizard) {
    return (
        <SignupWizard 
            initialEmail={email}
            initialCompany={signupCompany}
            onCancel={() => { setShowWizard(false); setLoginMode("admin"); }} 
            onComplete={handleWizardComplete} 
            isSubmitting={isLoading} 
            error={error} 
        />
    );
  }\`
);

// We need to re-add the signup inputs to the JSX
const signupTabs = \`
               <button
                onClick={() => {
                  setLoginMode("signup");
                  setError("");
                }}
                className={\`flex-1 py-4 text-center font-bold text-sm transition-colors \${loginMode === "signup" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}\`}
              >
                إنشاء حساب
              </button>
              <button\`

code = code.replace(\`<button\n                onClick={() => {\n                  setLoginMode("admin");\n                  setError("");\n                }}\n                className={\\\`flex-1 py-4 text-center font-bold text-sm transition-colors \${loginMode === "admin"\`, signupTabs.replace('<button', '<button\\n                onClick={() => {\\n                  setLoginMode("admin");\\n                  setError("");\\n                }}\\n                className={`flex - 1 py - 4 text - center font - bold text - sm transition - colors ${ loginMode === "admin"'));

// Re-add signup jsx
const loginModeContent = \`
                {loginMode === "signup" ? (
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    إنشاء حساب جديد
                  </h3>
                ) : loginMode === "admin" ? (
\`
code = code.replace('{loginMode === "admin" ? (', loginModeContent);

const pText = \`
                  {loginMode === "signup"
                    ? "الاشتراك وإدارة محلك الذكي"
                    : loginMode === "admin"
\`;
code = code.replace('{loginMode === "admin"', pText);

const signupForm = \`
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
                              onChange={(e) => setSignupHasBranches(e.target.checked)}
                              className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">هل تمتلك فروع متعددة؟</span>
                       </label>
                    </div>
                    
                    <div className="text-center mt-4">
                       <button type="button" onClick={() => setLoginMode("admin")} className="text-primary-500 text-sm font-bold hover:underline">
                         لديك حساب بالفعل؟ قم بتسجيل الدخول
                       </button>
                    </div>
                  </>
                ) : loginMode === "admin" ? (
\`

code = code.replace('{loginMode === "admin" ? (', signupForm);

const buttonReplace = \`
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : loginMode === "signup" ? (
                    "إنشاء الحساب"
                  ) : (
                    "تسجيل الدخول"
                  )}
\`
code = code.replace(\`{isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "تسجيل الدخول"
                  )}\`, buttonReplace);

fs.writeFileSync('src/App.tsx', code);
console.log("Done fixed app");
