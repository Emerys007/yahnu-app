// validate-locales.mjs
import fs from 'node:fs';
import path from 'node:path';

// Adjust these paths to point to your actual locale files
const enPath = path.join(process.cwd(), 'src/locales/en.json');
const frPath = path.join(process.cwd(), 'src/locales/fr.json');

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

const en = flatten(readJSON(enPath));
const fr = flatten(readJSON(frPath));

const missingInEn = [];
const missingInFr = [];

for (const key of Object.keys(en)) {
  if (!(key in fr)) missingInFr.push(key);
}
for (const key of Object.keys(fr)) {
  if (!(key in en)) missingInEn.push(key);
}

if (missingInEn.length || missingInFr.length) {
  console.log('Missing keys detected:');
  if (missingInEn.length) {
    console.log(`  In English only (${missingInEn.length}):`, missingInEn.join(', '));
  }
  if (missingInFr.length) {
    console.log(`  In French only (${missingInFr.length}):`, missingInFr.join(', '));
  }
  process.exit(1); // non‑zero exit code to make CI fail
} else {
  console.log('All keys match between en.json and fr.json');
}
