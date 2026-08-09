import fs from 'fs';
const data = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));

if (data.definitions) {
  console.log("Definitions:", Object.keys(data.definitions));
} else if (data.components?.schemas) {
  console.log("Schemas:", Object.keys(data.components.schemas));
} else {
  console.log("Top level keys:", Object.keys(data));
}
