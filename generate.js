/**
 * generate.js — Coorg Investments
 * Reads properties.json (fetched from Google Sheet CSV by GitHub Action)
 * and rebuilds index.html with live property cards.
 *
 * Run: node generate.js
 */

const fs   = require('fs');
const path = require('path');

// ── Load property data ──────────────────────────────────────────────────────
const dataPath = path.join(__dirname, 'properties.json');
if (!fs.existsSync(dataPath)) {
  console.error('❌  properties.json not found. Run the GitHub Action first.');
  process.exit(1);
}

const properties = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  .filter(p => p.status && p.status.trim().toLowerCase() === 'active')
  .filter(p => p.title && p.title.trim() !== '');

console.log(`✅  Loaded ${properties.length} active properties`);

// ── WhatsApp SVG (reused across cards) ─────────────────────────────────────
const WA_SVG = `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

// ── Helpers ─────────────────────────────────────────────────────────────────
function waLink(title) {
  const msg = encodeURIComponent(
    `Hello, I'm interested in the ${title}. Please share more details.`
  );
  return `https://wa.me/919632288853?text=${msg}`;
}

function youtubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Extract first valid Google Drive image URL from comma-separated list.
// Handles both share formats:
//   https://drive.google.com/file/d/FILE_ID/view
//   https://drive.google.com/open?id=FILE_ID   (Google Forms responses)
function driveUrls(raw) {
  if (!raw) return [];
  return raw.split(',')
    .map(u => u.trim())
    .filter(Boolean)
    .map(u => {
      const m = u.match(/\/d\/([a-zA-Z0-9_-]+)/) || u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      // thumbnail endpoint embeds far more reliably than uc?export=view
      return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000` : u;
    })
    .slice(0, 5);
}

// Escape HTML and preserve line breaks in user-entered text
function esc(text) {
  return (text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function descHtml(text) {
  return esc(text).replace(/\r?\n/g, '<br>');
}

function specItem(icon, text) {
  if (!text || text.trim() === '') return '';
  return `<div class="spec-item"><span class="icon">${icon}</span> ${text.trim()}</div>`;
}

// ── Build property card HTML ─────────────────────────────────────────────────
function buildCard(p, index) {
  const imgs   = driveUrls(p.photos);
  const imgSrc = imgs.length > 0 ? imgs[0] : 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=700&q=80';
  const ytId   = youtubeId(p.youtube_url);
  const type   = (p.type || 'estate').toLowerCase();

  const videoBtn = ytId
    ? `<a href="#" class="card-video-btn" onclick="openVideo(event,'${ytId}')" title="Watch walkthrough">▶</a>`
    : '';

  const specs = [
    specItem('📐', p.size),
    specItem('🛏️', p.bedrooms),
    specItem('✨', p.feature),
  ].filter(Boolean).join('\n');

  return `
      <!-- ${p.title} -->
      <div class="property-card fade-up" data-type="${type}">
        <div class="card-image">
          <img src="${imgSrc}" alt="${p.title}" loading="lazy">
          <span class="card-badge">${p.type || 'Estate'}</span>
          ${videoBtn}
        </div>
        <div class="card-body">
          <div class="card-location">📍 ${p.location}</div>
          <h3 class="card-title">${p.title}</h3>
          <div class="card-price">${p.price} <span>${p.price_label || ''}</span></div>
          <div class="card-specs">
            ${specs}
          </div>
          <p class="card-desc">${descHtml(p.description)}</p>
          <a href="${waLink(p.title)}" class="card-wa-btn" target="_blank" rel="noopener">
            ${WA_SVG}
            Enquire on WhatsApp
          </a>
        </div>
      </div>`;
}

// ── Build filter tabs ────────────────────────────────────────────────────────
function buildFilterTabs(properties) {
  const types = [...new Set(properties.map(p => (p.type || 'Estate').toLowerCase()))];
  const tabs  = types.map(t =>
    `<button class="filter-tab" onclick="filterProps('${t}', this)">${t.charAt(0).toUpperCase() + t.slice(1)}s</button>`
  ).join('\n        ');
  return `<button class="filter-tab active" onclick="filterProps('all', this)">All</button>
        ${tabs}`;
}

// ── Inject cards into index.html template ───────────────────────────────────
const templatePath = path.join(__dirname, 'index.template.html');
if (!fs.existsSync(templatePath)) {
  console.error('❌  index.template.html not found.');
  process.exit(1);
}

let html = fs.readFileSync(templatePath, 'utf8');

// Replace property cards block
const cardsHtml = properties.length > 0
  ? properties.map((p, i) => buildCard(p, i)).join('\n')
  : `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#666;">
       <p style="font-size:1.2rem;margin-bottom:12px;">No properties listed at the moment.</p>
       <p>Please check back soon or <a href="https://wa.me/919632288853" style="color:#1C3A2B;font-weight:600;">contact us on WhatsApp</a>.</p>
     </div>`;

html = html.replace('<!-- PROPERTY_CARDS_PLACEHOLDER -->', cardsHtml);

// Replace filter tabs block
const tabsHtml = buildFilterTabs(properties);
html = html.replace('<!-- FILTER_TABS_PLACEHOLDER -->', tabsHtml);

// Inject last updated timestamp
const now = new Date().toLocaleDateString('en-IN', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
});
html = html.replace('<!-- LAST_UPDATED_PLACEHOLDER -->', now);

// Write output
const outPath = path.join(__dirname, 'index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`✅  index.html generated with ${properties.length} properties — ${now}`);
