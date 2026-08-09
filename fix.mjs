import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
const target = `                    body: JSON.stringify({ settings: newSettings, full_name: wizardData.fullName })
                  }
                );
              }
            }`;
const replacement = `                    body: JSON.stringify({ settings: newSettings, full_name: wizardData.fullName })
                  }
                );
                
                await fetch(
                  "https://hoohxkrrndtfpwsrnpyr.supabase.co/rest/v1/app_settings",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      apikey: "sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa",
                      Authorization: \`Bearer \${data.session.access_token}\`,
                      Prefer: "resolution=merge-duplicates"
                    },
                    body: JSON.stringify({
                      user_id: data.user.id,
                      company_name: wizardData.companyName || "",
                      currency: wizardData.currency || "EGP",
                      date_format: wizardData.dateFormat || "DD/MM/YYYY",
                      low_stock_threshold: wizardData.lowStockThreshold || 10,
                      has_branches: true
                    })
                  }
                );
              }
            }`;
code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
