import fs from 'fs';
const data = JSON.parse(fs.readFileSync('openapi-actual.json', 'utf8'));

if (data.definitions && data.definitions.spare_parts) {
    console.log(Object.keys(data.definitions.spare_parts.properties));
} else {
    console.log("No spare_parts in definitions");
}
