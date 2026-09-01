/* Generate one pretty URL per resources.json record, plus llms.txt,
   a markdown catalog dump, sitemap resource URLs, and search-index entries.
   Pages regenerate from JSON; do not invent fields. */

const fs = require('fs');
const path = require('path');
const {
  ORIGIN,
  assignSlugs,
  resourcePath,
  resourceCanonical,
  CANONICAL_SITEMAP,
  CATEGORY_LANDING,
} = require('./resource-urls');

const root = __dirname;
const SOCIAL_IMAGE = `${ORIGIN}/documentary411-social-card.jpg`;
const SOCIAL_IMAGE_ALT = 'Documentary411.com — Grants. Festivals. Tools.';
const SAME_AS = [
  'https://imdb.me/kerrydavid',
  'https://www.linkedin.com/in/kerrydavid',
];

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

function xml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function cleanRecord(row) {
  const rec = { ...row };
  delete rec._mergedFrom;
  delete rec._mergeConflicts;
  return rec;
}

function truncateMeta(text, max) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (raw.length <= max) return raw;
  return raw.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

function metaDescription(res) {
  const body = res.description || res.notes || res.bestFor || 'Documentary411 filmmaker resource listing. Confirm details on the official site.';
  return truncateMeta(`${res.name}: ${body}`, 160);
}

function pageTitle(res) {
  return `${res.name} — Documentary411`;
}

function leadText(res) {
  const status = res.status || 'verify';
  const deadline = String(res.deadlineMonth || '').trim();
  const statusBit = deadline
    ? `Current listed status is ${status}; listed deadline: ${deadline}.`
    : `Current listed status is ${status}.`;
  const what = res.description || 'Confirm what this resource is on the official site before applying.';
  return `${statusBit} ${what}`;
}

function lastVerifiedLine(res) {
  if (res.lastVerified) {
    return `Last verified ${res.lastVerified}. Deadlines change — confirm on the official site before applying.`;
  }
  return 'Confirm dates and eligibility on the official site before applying.';
}

function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': `${ORIGIN}/#organization`,
    name: 'Documentary411',
    url: `${ORIGIN}/`,
    email: 'admin@kdcandfilms.com',
    founder: { '@id': `${ORIGIN}/#person` },
    sameAs: SAME_AS,
    logo: {
      '@type': 'ImageObject',
      url: `${ORIGIN}/apple-touch-icon.png`,
      width: 180,
      height: 180,
    },
  };
}

function personNode() {
  return {
    '@type': 'Person',
    '@id': `${ORIGIN}/#person`,
    name: 'Kerry David',
    url: `${ORIGIN}/about`,
    email: 'admin@kdcandfilms.com',
    affiliation: { '@type': 'Organization', name: 'KDC and Films' },
    worksFor: { '@id': `${ORIGIN}/#organization` },
    sameAs: SAME_AS,
  };
}

function pageSchema(canonical, title, description) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(),
      personNode(),
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        isPartOf: { '@id': `${ORIGIN}/#website` },
        publisher: { '@id': `${ORIGIN}/#organization` },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: SOCIAL_IMAGE,
          width: 1200,
          height: 630,
        },
        inLanguage: 'en-US',
      },
    ],
  };
}

function relatedResources(res, all) {
  return all
    .filter((other) => other.slug !== res.slug && other.category === res.category)
    .slice(0, 6);
}

function fieldRow(label, value) {
  if (value == null || String(value).trim() === '') return '';
  return `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
}

function chromeNav() {
  return `<!-- D411 NAV START -->
<nav class="site-chrome" aria-label="Primary navigation">
  <div class="nav-inner">
    <a href="/" class="nav-logo">Documentary411</a>
    <div class="nav-links">
      <a href="/directory">Directory</a>
      <a href="/documentary-grants">Grants</a>
      <a href="/#festivals">Festivals</a>
      <a href="/shop">Shop</a>
      <a href="/blog">Blog</a>
      <a href="/advertise">Advertise</a>
      <a href="/directory" data-open-search>Search</a>
    </div>
    <button type="button" class="nav-toggle" aria-label="Open menu" aria-expanded="false">☰</button>
  </div>
</nav>
<!-- D411 NAV END -->`;
}

function chromeFooter() {
  return `<!-- D411 FOOTER START -->
<footer class="site-chrome-footer">
  <div class="footer-inner">
    <div>
      <div class="footer-brand">Documentary411</div>
      <div class="footer-tagline">Created by Kerry David · KDC and Films · a directory for independent filmmakers.</div>
    </div>
    <div class="footer-links">
      <a href="/directory">Directory</a>
      <a href="/documentary-grants">Grants</a>
      <a href="/#festivals">Festivals</a>
      <a href="/shop">Shop</a>
      <a href="/blog">Blog</a>
      <a href="/advertise">Advertise</a>
      <a href="/directory" data-open-search>Search</a>
      <a href="/about">About</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/contact">Contact</a>
      <a href="/affiliate-disclosure">Affiliate</a>
      <a href="mailto:admin@kdcandfilms.com">admin@kdcandfilms.com</a>
    </div>
    <div class="footer-copy">© 2026 Documentary411. Created by Kerry David, KDC and Films.</div>
  </div>
</footer>
<!-- D411 FOOTER END -->`;
}

function renderResourcePage(res, all) {
  const canonical = resourceCanonical(res.slug);
  const title = pageTitle(res);
  const description = metaDescription(res);
  const lead = leadText(res);
  const landing = CATEGORY_LANDING[res.category] || '/directory';
  const related = relatedResources(res, all);
  const schema = pageSchema(canonical, title, description);
  const titleAttr = attr(title);
  const descAttr = attr(description);
  const canonicalAttr = attr(canonical);
  const imageAttr = attr(SOCIAL_IMAGE);
  const imageAltAttr = attr(SOCIAL_IMAGE_ALT);

  const dl = [
    fieldRow('Type', res.resourceType),
    fieldRow('Category', res.category),
    fieldRow('Status', res.status),
    fieldRow('Deadline', res.deadlineMonth),
    fieldRow('Region', res.region),
    fieldRow('Best for', res.bestFor),
    fieldRow('Project stage', res.projectStage),
    fieldRow('Access', res.access),
    fieldRow('Cost / award', res.cost),
  ].filter(Boolean).join('\n        ');

  const notesBlock = res.notes
    ? `<p class="d411-copy"><strong>From the directory:</strong> ${esc(res.notes)}</p>`
    : '';

  const relatedBlock = related.length
    ? `<ul class="d411-related">${related.map((other) => `<li><a href="${attr(resourcePath(other.slug))}">${esc(other.name)}</a></li>`).join('')}</ul>`
    : '<p class="d411-copy">See the full directory for more listings in this category.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${descAttr}">
<!-- D411 FONTS START -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<!-- D411 FONTS END -->
  <link rel="stylesheet" href="/directory-upgrades.css">
  <link rel="stylesheet" href="/product-redesign.css">
  <link rel="stylesheet" href="/site-search.css">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="stylesheet" href="/chrome.css">
<!-- D411 TECHNICAL SEO START -->
  <link rel="canonical" href="${canonicalAttr}">
  <meta property="og:title" content="${titleAttr}">
  <meta property="og:description" content="${descAttr}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalAttr}">
  <meta property="og:site_name" content="Documentary411">
  <meta property="og:locale" content="en_US">
  <meta property="og:image" content="${imageAttr}">
  <meta property="og:image:secure_url" content="${imageAttr}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${imageAltAttr}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titleAttr}">
  <meta name="twitter:description" content="${descAttr}">
  <meta name="twitter:image" content="${imageAttr}">
  <meta name="twitter:image:alt" content="${imageAltAttr}">
  <script type="application/ld+json">${safeJson(schema)}</script>
<!-- D411 TECHNICAL SEO END -->
</head>
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  ${chromeNav()}
  <main id="main">
  <header class="d411-hero">
    <p class="d411-eyebrow">${esc(res.category || 'Directory')}</p>
    <h1>${esc(res.name)}</h1>
    <p class="d411-sub">${esc(lead)}</p>
    <div class="d411-actions">
      <a class="d411-btn primary" href="${attr(res.officialUrl)}" target="_blank" rel="noopener">Official site</a>
      <a class="d411-btn" href="/directory">Directory</a>
      <a class="d411-btn" href="${attr(landing)}">${esc(res.category === 'Documentary Festivals' ? 'Festivals' : 'Category')}</a>
    </div>
  </header>
  <section class="d411-section">
    <div class="d411-inner" style="max-width:820px">
      <p class="d411-kicker">Listing</p>
      <h2>What Documentary411 has on file</h2>
      <p class="d411-copy">${esc(lastVerifiedLine(res))}</p>
      <dl class="d411-resource-dl">
        ${dl}
      </dl>
      ${notesBlock}
      <p><a class="d411-link" href="${attr(res.officialUrl)}" target="_blank" rel="noopener">Visit official site →</a></p>
      <p><a class="d411-link" href="/submit-resource?correction=${encodeURIComponent(res.name)}">Suggest a correction →</a></p>
      <p class="d411-kicker" style="margin-top:32px">Related</p>
      <h2>More in ${esc(res.category || 'the directory')}</h2>
      ${relatedBlock}
      <p class="d411-copy" style="margin-top:18px"><a href="/directory">Back to the full directory</a> · <a href="${attr(landing)}">Category page</a> · <a href="/documentary-grants">Grants</a> · <a href="/fiscal-sponsorship">Fiscal sponsorship</a> · <a href="/festival-budget-workbook">Festival budget workbook</a></p>
    </div>
  </section>
  </main>
  ${chromeFooter()}
  <script src="/site-search.js" defer></script>
  <script src="/site-fixes.js" defer></script>
</body>
</html>
`;
}

function writeLlmsTxt(resources) {
  const lines = [
    '# Documentary411',
    '',
    '> A directory for independent filmmakers, with a documentary niche — grants, festivals, fiscal sponsors, markets, and practical tools. Not a watch catalog and not a streaming guide.',
    '',
    'Founded by Kerry David of KDC and Films (admin@kdcandfilms.com). 25-year film veteran; credits and campaigns associated with that work have earned her projects, 75+ film festival awards and over $90 million in cumulative box office receipts. IMDb: https://imdb.me/kerrydavid. LinkedIn: https://www.linkedin.com/in/kerrydavid.',
    '',
    'Maker queries this site is built to answer: documentary grants, fiscal sponsorship, and festival-budget planning. Confirm every deadline on the official resource URL.',
    '',
    '## Resource catalog',
    '',
    `- [Full catalog (markdown)](${ORIGIN}/resources.md): name, category, status, deadline, official URL, and lastVerified for all ${resources.length} listings generated from resources.json.`,
    '',
    '## Maker pages',
    '',
    `- [Directory](${ORIGIN}/directory)`,
    `- [Documentary grants](${ORIGIN}/documentary-grants)`,
    `- [Fiscal sponsorship](${ORIGIN}/fiscal-sponsorship)`,
    `- [Festival budget workbook](${ORIGIN}/festival-budget-workbook)`,
    `- [Blog](${ORIGIN}/blog)`,
    `- [Was Deauville Worth the Trip?](${ORIGIN}/blog/deauville)`,
    `- [About](${ORIGIN}/about)`,
    '',
    '## Optional',
    '',
    `- [Sitemap](${ORIGIN}/sitemap.xml)`,
    '',
  ];
  fs.writeFileSync(path.join(root, 'llms.txt'), lines.join('\n'));
}

function writeMarkdownCatalog(resources) {
  const chunks = [
    '# Documentary411 resource catalog',
    '',
    'Generated from resources.json. Fields below are only name, category, status, deadline (from deadlineMonth), official URL, and lastVerified. Deadlines change — confirm on the official site.',
    '',
  ];
  for (const res of resources) {
    chunks.push(`## ${res.name}`);
    chunks.push('');
    chunks.push(`- Category: ${res.category || ''}`);
    chunks.push(`- Status: ${res.status || ''}`);
    if (res.deadlineMonth) chunks.push(`- Deadline: ${res.deadlineMonth}`);
    chunks.push(`- Official URL: ${res.officialUrl || ''}`);
    if (res.lastVerified) chunks.push(`- Last verified: ${res.lastVerified}`);
    chunks.push(`- Documentary411 URL: ${resourceCanonical(res.slug)}`);
    chunks.push('');
  }
  fs.writeFileSync(path.join(root, 'resources.md'), chunks.join('\n'));
}

function writeSitemap(resources) {
  const urls = CANONICAL_SITEMAP.map((entry) => ({ loc: entry.loc, lastmod: entry.lastmod }));
  for (const res of resources) {
    const lastmod = /^\d{4}-\d{2}-\d{2}$/.test(String(res.lastVerified || '')) ? res.lastVerified : '2026-09-01';
    urls.push({ loc: resourceCanonical(res.slug), lastmod });
  }
  const body = urls.map((entry) => `  <url><loc>${xml(entry.loc)}</loc><lastmod>${xml(entry.lastmod)}</lastmod></url>`).join('\n');
  const xmlDoc = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  fs.writeFileSync(path.join(root, 'sitemap.xml'), xmlDoc);
}

function excerpt(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function upsertSearchIndex(resources) {
  const file = path.join(root, 'search-index.json');
  let entries = [];
  if (fs.existsSync(file)) {
    try { entries = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_err) { entries = []; }
  }
  entries = entries.filter((entry) => !String(entry.url || '').startsWith('/resources/'));
  for (const res of resources) {
    const searchText = [res.name, res.category, res.status, res.deadlineMonth, res.description, res.bestFor, res.notes]
      .filter(Boolean)
      .join(' ');
    entries.push({
      page: res.category || 'Directory',
      title: res.name,
      url: resourcePath(res.slug),
      excerpt: excerpt(res.description || res.notes || res.name, 220),
      searchText,
    });
  }
  fs.writeFileSync(file, JSON.stringify(entries));
}

function main() {
  const source = JSON.parse(fs.readFileSync(path.join(root, 'resources.json'), 'utf8'));
  const resources = assignSlugs(source.map(cleanRecord));

  const dir = path.join(root, 'resources');
  fs.mkdirSync(dir, { recursive: true });
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.html')) fs.unlinkSync(path.join(dir, name));
  }

  for (const res of resources) {
    fs.writeFileSync(path.join(dir, `${res.slug}.html`), renderResourcePage(res, resources));
  }

  writeLlmsTxt(resources);
  writeMarkdownCatalog(resources);
  writeSitemap(resources);
  upsertSearchIndex(resources);

  console.log(`Documentary411 resource pages built (${resources.length} pages at /resources/{slug}; llms.txt + resources.md + sitemap updated).`);
}

if (require.main === module) main();

module.exports = { main };
