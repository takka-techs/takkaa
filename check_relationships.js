import fs from 'fs';
const doc = JSON.parse(fs.readFileSync('openapi-actual.json', 'utf8'));

const app_settings = doc.definitions.app_settings.properties;
console.log("app_settings props:", Object.keys(app_settings));
console.log("user_id description:", app_settings.user_id.description);
