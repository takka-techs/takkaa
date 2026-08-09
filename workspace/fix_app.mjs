import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
const target = `        const hasSettings = appUser && appUser.settings && Object.keys(appUser.settings).length > 0;`;
const replacement = `        let hasSettings = false;
        try {
          const settingsRes = await fetch(
            \`https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_settings?user_id=eq.\${data.user.id}\`,
            {
              headers: {
                apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                Authorization: \`Bearer \${data.access_token}\`,
              },
            }
          );
          if (settingsRes.ok) {
            const settingsList = await settingsRes.json();
            if (settingsList && settingsList.length > 0) {
               hasSettings = true;
            }
          }
        } catch(e) {}`;
code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
