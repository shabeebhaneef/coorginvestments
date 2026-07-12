/**
 * convert-csv.js — Coorg Investments
 * Parses properties.csv (Google Form responses export) into properties.json
 * with the field names generate.js expects.
 *
 * Handles quoted fields containing commas, newlines, and escaped quotes ("").
 */

const fs = require('fs');

const csv = fs.readFileSync('properties.csv', 'utf8');

// ── RFC-4180 CSV parser ─────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cur); cur = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.length > 1 || row[0].trim() !== '') rows.push(row);
      row = [];
    } else {
      cur += c;
    }
  }
  row.push(cur);
  if (row.length > 1 || row[0].trim() !== '') rows.push(row);
  return rows;
}

const rows = parseCSV(csv);
if (rows.length === 0) {
  console.error('❌  properties.csv is empty — aborting (not overwriting properties.json).');
  process.exit(1);
}

// Normalize headers: "Property Title" → property_title (also strips stray newlines)
const headers = rows[0].map(h =>
  h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
);

if (!headers.includes('property_title') || !headers.includes('status')) {
  console.error('❌  Unexpected CSV headers — sheet may not be public or URL is wrong.');
  console.error('    Headers found: ' + headers.join(', '));
  process.exit(1);
}

const properties = rows.slice(1).map(r => {
  const o = {};
  headers.forEach((h, i) => { o[h] = (r[i] || '').trim(); });

  const photos = ['photo_1', 'photo_2', 'photo_3', 'photo_4', 'photo_5']
    .map(k => o[k])
    .filter(Boolean)
    .join(',');

  return {
    title:       o.property_title,
    location:    o.location,
    type:        o.type,
    price:       o.price,
    price_label: o.price_label,
    size:        o.size,
    bedrooms:    o.bedrooms,
    feature:     o.key_feature,
    description: o.description,
    photos:      photos,
    youtube_url: o.youtube_video_url,
    status:      o.status,
  };
}).filter(p => p.title && p.title.trim() !== '');

fs.writeFileSync('properties.json', JSON.stringify(properties, null, 2));
console.log(`✅  Converted ${properties.length} row(s) to properties.json`);
