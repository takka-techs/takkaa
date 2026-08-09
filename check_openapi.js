import fs from 'fs';
try {
  let doc = JSON.parse(fs.readFileSync('openapi-anon.json', 'utf8'));
  console.log(Object.keys(doc));
  if (doc.definitions) {
     console.log(doc.definitions.app_settings.properties.user_id.description);
  } else if (doc.components) {
     console.log(doc.components.schemas.app_settings.properties.user_id.description);
  }
} catch(e) { console.error(e) }
