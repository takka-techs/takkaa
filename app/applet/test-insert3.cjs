const fetch = require('node-fetch');
const URL = 'https://hoohxkrrndtfpwsrnpyr.supabase.co'; 
const KEY='sb_publishable_83FGyADwb-SAJtS27eYWZA_1eNNUrwa'; 
fetch(URL+'/rest/v1/Repairs?limit=1', {headers:{apikey:KEY}})
.then(r=>r.json())
.then(repairs=>{ 
    if(repairs.length>0) { 
        fetch(URL+'/rest/v1/crm_logs', {
            method:'POST', 
            body:JSON.stringify({repair_id:repairs[0].id, description:'Test without user_id'}), 
            headers:{apikey:KEY, 'Content-Type':'application/json', Prefer:'return=representation'}
        }).then(r2=>r2.text()).then(t=>console.log('INSERT:', t)); 
    } 
});
