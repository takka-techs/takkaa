const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The whole replacement was hard to do via script, let's just make the changes using replace directly.

code = code.replace(
  'const handleWizardComplete = async (wizardData: any) => {',
  'const [showWizard, setShowWizard] = useState(false);\n  const [wizardInitData, setWizardInitData] = useState<any>(null);\n\n  const handleWizardComplete = async (wizardData: any) => {'
);


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
           
         let appUser = null;
         try {
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
  };`;

// we just replace from handleWizardComplete (...) => {  all the way to the end of that function
code = code.replace(/  const handleWizardComplete = async \(wizardData: any\) => \{[\s\S]*?const handleLogin = async/m, newHandleWizardCode + "\n\n  const handleLogin = async");

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

code = code.replace('    if (loginMode === "admin") {', handleSignupSnippet);

code = code.replace(
  /if \(loginMode === "signup"\) \{\s*return \(\s*<SignupWizard[\s\S]*?\/>\s*\);\s*\}/,
  `if (showWizard) {
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
  }`
);

fs.writeFileSync('src/App.tsx', code);
