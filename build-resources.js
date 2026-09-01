/* Build-time renderer: resources.json is the only catalog.
   Generates resources-data.js, static HTML cards, and ItemList JSON-LD so
   listing pages are not empty without JavaScript. */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const resources = JSON.parse(fs.readFileSync(path.join(root, 'resources.json'), 'utf8'))
  .map((row) => {
    const rec = { ...row };
    delete rec._mergedFrom;
    delete rec._mergeConflicts;
    return rec;
  });

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attr(s) {
  return esc(s).replace(/'/g, '&#39;');
}

function monthName(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (!y || !m) return iso;
  return `${names[m - 1]} ${d}, ${y}`;
}

function wrapDates(text) {
  const monthNumbers = {
    January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',
    July:'07',August:'08',September:'09',October:'10',November:'11',December:'12'
  };
  return String(text || '').replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\b/g, (match, month, day, year) => {
    return `<time datetime="${year}-${monthNumbers[month]}-${String(day).padStart(2, '0')}">${match}</time>`;
  });
}

function statusClassName(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'open' || s === 'rolling') return 'green';
  if (s === 'verify' || s === 'upcoming') return 'warn';
  return '';
}

function directoryCard(res) {
  const statusClass = statusClassName(res.status);
  const access = res.access || (res.isFree === 'paid' ? 'Paid / membership may apply' : res.isFree === 'mixed' ? 'Free + paid elements' : 'Free');
  const verified = res.lastVerified
    ? `<span class="d411-pill">Last verified <time datetime="${esc(res.lastVerified)}">${esc(res.lastVerified)}</time></span>`
    : '<span class="d411-pill">Confirm dates on the official site</span>';
  return `<article class="d411-card">
      <div class="d411-meta"><span class="d411-pill gold">${esc(res.resourceType)}</span><span class="d411-pill ${statusClass}">${esc(res.status || 'verify')}</span></div>
      <h3>${esc(res.name)}</h3>
      <small>${esc(res.category)} · ${esc(res.region || '')}</small>
      <p>${esc(res.description)}</p>
      <p><strong>Best for:</strong> ${esc(res.bestFor || '')}</p>
      <div class="d411-meta">
        <span class="d411-pill">${esc(res.projectStage || '')}</span>
        <span class="d411-pill">${esc(access)}</span>
        ${verified}
      </div>
      <p><strong>Why this matters:</strong> ${esc(res.notes || '')}</p>
      <a class="d411-link" href="${attr(res.officialUrl)}" target="_blank" rel="noopener">Visit Official Site →</a>
      <a class="d411-link" href="/submit-resource?correction=${encodeURIComponent(res.name)}">Suggest correction →</a>
    </article>`;
}

function directoryGrid(items) {
  if (!items.length) return '<p class="d411-copy">No resources in this catalog yet.</p>';
  return `<div class="d411-grid">${items.map(directoryCard).join('\n')}</div>`;
}

function replaceBlock(html, start, end, inner) {
  const block = `${start}\n${inner}\n${end}`;
  const re = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  if (re.test(html)) return html.replace(re, block);
  return html;
}

function ensureScript(html, tag) {
  if (html.includes(tag)) return html;
  if (/<script src="\/resources-data\.js"/.test(html)) return html;
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function itemListSchema(name, items) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((resource, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: resource.name,
        description: resource.description,
        url: resource.officialUrl
      }
    }))
  };
  if (name) schema.name = name;
  return `<!-- D411 ITEMLIST START -->\n<script type="application/ld+json">${JSON.stringify(schema)}</script>\n<!-- D411 ITEMLIST END -->`;
}

function injectItemList(fileName, name, items) {
  const file = path.join(root, fileName);
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  const block = itemListSchema(name, items);
  if (/<!-- D411 ITEMLIST START -->[\s\S]*?<!-- D411 ITEMLIST END -->/.test(html)) {
    html = html.replace(/<!-- D411 ITEMLIST START -->[\s\S]*?<!-- D411 ITEMLIST END -->/, block);
  } else {
    html = html.replace('</head>', `${block}\n</head>`);
  }
  fs.writeFileSync(file, html);
}

function injectStaticApp(fileName, targetId, items, noscriptCountLabel) {
  const file = path.join(root, fileName);
  let html = fs.readFileSync(file, 'utf8');
  const start = '<!-- D411 STATIC CARDS START -->';
  const end = '<!-- D411 STATIC CARDS END -->';
  const inner = directoryGrid(items);
  const payload = `<div id="${targetId}">${start}\n${inner}\n${end}</div>\n`;
  const reApp = new RegExp(`<div id="${targetId}"[^>]*>[\\s\\S]*?(?=<noscript|</section>)`);
  if (reApp.test(html)) html = html.replace(reApp, payload);
  html = html.replace(end + '</div>\n</section>', end + '</div></div></section>');
  const noscript = `<noscript><p class="d411-copy">JavaScript is optional for browsing. ${items.length} ${noscriptCountLabel} are listed above. Official links stay on each card.</p></noscript>`;
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, noscript);
  html = ensureScript(html, '<script src="/resources-data.js" defer></script>');
  fs.writeFileSync(file, html);
}

function homepageGrantCard(res) {
  const h = res.homepage || {};
  const title = h.title || res.name;
  const badge = h.badge || (res.status === 'open' ? 'Open' : res.status === 'rolling' ? 'Rolling' : res.status === 'upcoming' ? 'Upcoming' : 'Listing');
  const badgeClass = h.badgeClass || ((res.status === 'open' || res.status === 'rolling') ? 'badge-open' : 'badge-listing');
  const metaCore = h.meta || [res.resourceType, res.region, res.deadlineMonth].filter(Boolean).join(' · ');
  const verified = res.lastVerified
    ? ` · Last verified <time datetime="${esc(res.lastVerified)}">${esc(monthName(res.lastVerified))}</time>`
    : '';
  const desc = wrapDates(esc(h.description || res.description));
  const tags = (h.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  return `      <div class="card">
        <span class="card-badge ${esc(badgeClass)}">${esc(badge)}</span>
        <div class="card-title">${esc(title)}</div>
        <div class="card-meta">${wrapDates(esc(metaCore))}${verified}</div>
        <div class="card-desc">${desc}</div>
        <div class="card-tags">${tags}</div>
        <a class="card-link" href="${attr(res.officialUrl)}" target="_blank" rel="noopener">View →</a>
        <a class="card-link" href="/submit-resource?correction=${encodeURIComponent(res.name)}">Suggest correction →</a>
      </div>`;
}

function homepageFestivalCard(res) {
  const f = res.festival || {};
  let badge;
  if (f.needsVerification) badge = '<span class="card-badge badge-listing">Verify Current Programs</span>';
  else if (f.featured) badge = '<span class="card-badge badge-featured">★ Featured</span>';
  else if (f.oscar) badge = '<span class="card-badge badge-oscar">Oscar-Qualifying</span>';
  else if (f.feeLevel === 'free') badge = '<span class="card-badge badge-free">Free Submission</span>';
  else if (f.focus && f.focus.length && f.focus[0] !== 'General') badge = `<span class="card-badge badge-id">${esc(f.focus[0])} Focus</span>`;
  else if (f.feeLevel === 'low') badge = '<span class="card-badge badge-low">Low Fee</span>';
  else badge = '<span class="card-badge badge-listing">Free Listing</span>';
  const tags = [];
  if (f.oscar) tags.push('Oscar-Qualifying');
  if (f.market) tags.push('Industry Market');
  (f.focus || []).forEach((x) => { if (x !== 'General' && !tags.includes(x)) tags.push(x); });
  (f.genres || []).forEach((g) => { if (g !== 'General' && tags.length < 5 && !tags.includes(g)) tags.push(g); });
  if (f.feeLevel === 'free' && !tags.includes('Free Submission')) tags.push('Free Submission');
  else if (f.feeLevel === 'low' && !tags.includes('Low Fee')) tags.push('Low Fee');
  const meta = [f.city, f.dates, f.fee].filter(Boolean).join(' · ');
  return `<div class="card">${badge}
      <div class="card-title">${esc(res.name)}</div>
      <div class="card-meta">${wrapDates(esc(meta))}</div>
      <div class="card-desc">${esc(f.desc || res.description)}</div>
      <div class="card-tags">${tags.slice(0, 5).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <a class="card-link" href="${attr(res.officialUrl)}" target="_blank" rel="noopener">View →</a>
      <a class="card-link" href="/submit-resource?correction=${encodeURIComponent(res.name)}">Suggest correction →</a>
    </div>`;
}

function wrapHomeCards(html, startMarker, endMarker, cardsHtml, fallbackFind, fallbackWrap) {
  const start = `<!-- ${startMarker} -->`;
  const end = `<!-- ${endMarker} -->`;
  if (html.includes(start) && html.includes(end)) {
    return replaceBlock(html, start, end, cardsHtml);
  }
  return fallbackWrap(html, cardsHtml);
}

/* ---------- write resources-data.js (browser catalog, no second copy) ---------- */
const browserRecords = resources.map((row) => {
  const rec = { ...row };
  delete rec._mergedFrom;
  delete rec._mergeConflicts;
  return rec;
});
const dataJs = `window.D411_RESOURCES = ${JSON.stringify(browserRecords, null, 2)};\n`;
fs.writeFileSync(path.join(root, 'resources-data.js'), dataJs);

const festivals = resources.filter((r) => r.category === 'Documentary Festivals');
const grantsPage = resources.filter((r) => r.category === 'Documentary & Film Funds / Grants' || (r.homepage && ['grants-open', 'grants-closed'].includes(r.homepage.section)));
const markets = resources.filter((r) => r.category === 'Documentary Markets');
const fiscal = resources.filter((r) => r.category === 'Fiscal Sponsorship');
const grantsOpen = resources.filter((r) => r.homepage && r.homepage.section === 'grants-open');
const grantsClosed = resources.filter((r) => r.homepage && r.homepage.section === 'grants-closed');
const fiscalHome = resources.filter((r) => r.homepage && r.homepage.section === 'fiscal');

injectStaticApp('directory.html', 'directoryApp', resources, 'resources');
injectStaticApp('documentary-grants.html', 'grantsApp', grantsPage, 'grant and funding listings');
injectStaticApp('documentary-markets.html', 'marketsApp', markets, 'market listings');
injectStaticApp('fiscal-sponsorship.html', 'fiscalApp', fiscal, 'fiscal sponsorship listings');

injectItemList('directory.html', 'Documentary411 Filmmaker Resource Directory', resources);
injectItemList('documentary-grants.html', undefined, grantsPage);
injectItemList('documentary-markets.html', undefined, markets);
injectItemList('fiscal-sponsorship.html', undefined, fiscal);

/* ---------- homepage cards + festival view from the same JSON ---------- */
const homeFile = path.join(root, 'index.html');
let home = fs.readFileSync(homeFile, 'utf8');

if (!home.includes('<!-- D411 HOME GRANTS OPEN START -->')) {
  home = home.replace(
    /<div class="cards">\s*\n\s*\n\s*<div class="card">[\s\S]*?<\/div>\s*\n\s*\n\s*<\/div>\s*\n\s*<p class="section-desc" style="margin-top:18px">Also open/,
    `<div class="cards">\n<!-- D411 HOME GRANTS OPEN START -->\n<!-- D411 HOME GRANTS OPEN END -->\n    </div>\n    <p class="section-desc" style="margin-top:18px">Also open`
  );
}
if (!home.includes('<!-- D411 HOME GRANTS CLOSED START -->')) {
  home = home.replace(
    /<summary>Recently closed \/ next cycle<\/summary>\s*<div class="cards">[\s\S]*?<\/div>\s*<\/details>/,
    `<summary>Recently closed / next cycle</summary>\n      <div class="cards">\n<!-- D411 HOME GRANTS CLOSED START -->\n<!-- D411 HOME GRANTS CLOSED END -->\n      </div>\n    </details>`
  );
}
if (!home.includes('<!-- D411 HOME FISCAL START -->')) {
  home = home.replace(
    /<p class="section-desc">Access grants and tax-deductible donations[\s\S]*?<div class="cards">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*\n\s*<!-- MUSIC -->/,
    (match) => {
      const desc = home.match(/<p class="section-desc">Access grants and tax-deductible donations[\s\S]*?<\/p>/)[0];
      return `${desc}\n    <div class="cards">\n<!-- D411 HOME FISCAL START -->\n<!-- D411 HOME FISCAL END -->\n    </div>\n  </div>\n</section>\n\n<!-- MUSIC -->`;
    }
  );
}

home = replaceBlock(home, '<!-- D411 HOME GRANTS OPEN START -->', '<!-- D411 HOME GRANTS OPEN END -->', grantsOpen.map(homepageGrantCard).join('\n\n'));
home = replaceBlock(home, '<!-- D411 HOME GRANTS CLOSED START -->', '<!-- D411 HOME GRANTS CLOSED END -->', grantsClosed.map(homepageGrantCard).join('\n\n'));
home = replaceBlock(home, '<!-- D411 HOME FISCAL START -->', '<!-- D411 HOME FISCAL END -->', fiscalHome.map(homepageGrantCard).join('\n\n'));

if (!home.includes('<!-- D411 HOME FESTIVALS START -->')) {
  home = home.replace('<div id="festResults" class="cards"></div>', '<div id="festResults" class="cards"><!-- D411 HOME FESTIVALS START --><!-- D411 HOME FESTIVALS END --></div>');
}
home = replaceBlock(home, '<!-- D411 HOME FESTIVALS START -->', '<!-- D411 HOME FESTIVALS END -->', festivals.map(homepageFestivalCard).join('\n'));

const festTotal = festivals.length;
home = home.replace(/id="festivalStatCount">\d+<\/span>/, `id="festivalStatCount">${festTotal}</span>`);
home = home.replace(/id="festivalFinderCount">\d+<\/span>/, `id="festivalFinderCount">${festTotal}</span>`);
home = home.replace(/id="festivalDatabaseCount">\d+<\/span>/, `id="festivalDatabaseCount">${festTotal}</span>`);

/* Replace the inlined FESTIVALS array with a view over D411_RESOURCES. */
const festScriptStart = home.indexOf('/* SEARCHABLE FESTIVAL DATABASE */');
const festArrayStart = home.indexOf('window.FESTIVALS = [', festScriptStart);
if (festArrayStart !== -1) {
  const festArrayEnd = home.indexOf('\n];', festArrayStart);
  if (festArrayEnd !== -1) {
    const derived = `window.FESTIVALS = (window.D411_RESOURCES || []).filter(function(r){return r.category === 'Documentary Festivals';}).map(function(r){
  var f = r.festival || {};
  return {
    name: r.name,
    url: r.officialUrl,
    city: f.city,
    region: f.region || r.region,
    dates: f.dates,
    fee: f.fee,
    feeLevel: f.feeLevel,
    oscar: !!f.oscar,
    market: !!f.market,
    genres: f.genres || [],
    focus: f.focus || [],
    featured: !!f.featured,
    needsVerification: !!f.needsVerification,
    desc: f.desc || r.description
  };
});
window.FEST_LL = window.FEST_LL || {};
(window.D411_RESOURCES || []).forEach(function(r){
  var f = r.festival || {};
  if (f.city && f.lat != null && f.lng != null) window.FEST_LL[f.city] = [f.lat, f.lng];
});`;
    // Keep original FEST_LL object as fallback geocodes; derived fills from JSON first.
    // Remove only the literal array, not FEST_LL city table (US_CITIES still needed).
    home = home.slice(0, festArrayStart) + derived + home.slice(festArrayEnd + 3);
  }
}

if (!home.includes('src="/resources-data.js"')) {
  home = home.replace(
    '<script>\n/* SEARCHABLE FESTIVAL DATABASE */',
    '<script src="/resources-data.js"></script>\n<script>\n/* SEARCHABLE FESTIVAL DATABASE */'
  );
}

fs.writeFileSync(homeFile, home);

/* Grants page JS filter should include homepage grant cards that live in other categories. */
const grantsFile = path.join(root, 'documentary-grants.html');
if (fs.existsSync(grantsFile)) {
  let g = fs.readFileSync(grantsFile, 'utf8');
  g = g.replace(
    "D411.renderDirectory({target:'#grantsApp',category:'Documentary & Film Funds / Grants'})",
    "D411.renderDirectory({target:'#grantsApp',category:'Documentary & Film Funds / Grants',includeHomepageSection:['grants-open','grants-closed']})"
  );
  fs.writeFileSync(grantsFile, g);
}

console.log(`Documentary411 resources built from resources.json (${resources.length} records; ${festivals.length} festivals; ${grantsPage.length} grants-page; ${markets.length} markets; ${fiscal.length} fiscal).`);
