// validate-locales.mjs
import fs from 'node:fs';
import path from 'node:path';

// Only validate French locale file
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

try {
  const fr = flatten(readJSON(frPath));
  console.log(`French locale validation successful. Found ${Object.keys(fr).length} translation keys.`);
} catch (error) {
  console.error('French locale validation failed:', error.message);
  process.exit(1);
}