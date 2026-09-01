const fs = require('fs');
const path = require('path');

function injectStyles(fileName, styleTags) {
  const file = path.join(__dirname, fileName);
  if (!fs.existsSync(file)) return '';
  let html = fs.readFileSync(file, 'utf8');
  for (const tag of styleTags) {
    if (!html.includes(tag)) html = html.replace('</head>', `  ${tag}\n</head>`);
  }
  fs.writeFileSync(file, html);
  return html;
}

function injectScript(fileName, tag) {
  const file = path.join(__dirname, fileName);
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes(tag)) html = html.replace('</body>', `  ${tag}\n</body>`);
  fs.writeFileSync(file, html);
}

const FONT_START = '<!-- D411 FONTS START -->';
const FONT_END = '<!-- D411 FONTS END -->';
const FONT_BLOCK = `${FONT_START}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
${FONT_END}`;

function normalizeFonts(html) {
  if (!html || /google17fed7e594a2d82e\.html/.test(html) && html.length < 80) return html;
  html = html.replace(/<!-- D411 FONTS START -->[\s\S]*?<!-- D411 FONTS END -->\s*/g, '');
  html = html.replace(/<link\b[^>]*fonts\.googleapis\.com\/css2[^>]*>\s*/gi, '');
  html = html.replace(/<link\b[^>]*rel\s*=\s*["']preconnect["'][^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, '');
  html = html.replace(/<link\b[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*rel\s*=\s*["']preconnect["'][^>]*>\s*/gi, '');
  if (html.includes(FONT_START)) return html;
  if (/<meta\b[^>]*name\s*=\s*["']viewport["'][^>]*>/i.test(html)) {
    return html.replace(/(<meta\b[^>]*name\s*=\s*["']viewport["'][^>]*>)/i, `$1\n${FONT_BLOCK}\n`);
  }
  if (/<\/title>/i.test(html)) {
    return html.replace(/<\/title>/i, `</title>\n${FONT_BLOCK}\n`);
  }
  return html.replace(/<head[^>]*>/i, (m) => `${m}\n${FONT_BLOCK}\n`);
}


/* Homepage */
const homeFile = path.join(__dirname, 'index.html');
let html = fs.readFileSync(homeFile, 'utf8');

const homeStyles = [
  '<link rel="stylesheet" href="/redesign.css">',
  '<link rel="stylesheet" href="/redesign-v2.css">',
  '<link rel="stylesheet" href="/directory-upgrades.css">'
];
for (const tag of homeStyles) {
  if (!html.includes(tag)) html = html.replace('</head>', `  ${tag}\n</head>`);
}

html = html.replace(/<p class="hero-eyebrow"[^>]*>.*?<\/p>/,'<p class="hero-eyebrow">Funding. Festivals. Tools. Community.</p>');
html = html.replace(/<h1>.*?<\/h1>/,'<h1>Your Insider<br>Advantage for<br>Documentary<br>Filmmaking<span class="hero-dot">.</span></h1>');
html = html.replace('Verified grants, festivals, distributors, sales agents, legal resources, equipment, and software — curated for independent documentary filmmakers at every stage.','Funding opportunities, festivals, distribution, legal resources, equipment and practical tools — curated for independent documentary filmmakers by people who know the road.');
html = html.replace('>Explore Directory</a>', '>Explore Resources</a>');
html = html.replace('<span class="stat-num">500+</span><span class="stat-label">Verified Resources</span>','<span class="stat-num" id="festivalStatCount">48</span><span class="stat-label">Verified Festivals</span>');

/* Navigation is authored in index.html (D411 NAV START). Do not re-inject
   growth links or Shop/Advertise clones on every build. */
if (!html.includes('<!-- D411 NAV START -->')) {
  html = html.replace(/\s*<a href="\/festival-strategy(?:\.html)?">Festival Strategy<\/a>/g, '');
  html = html.replace(/<a href="#festivals">Festivals<\/a>\s*<a href="#festfinder">Fest Near Me<\/a>/g,'<div class="nav-dropdown">\n        <a href="#festivals" class="nav-parent">Festivals <span class="nav-caret" aria-hidden="true">⌄</span></a>\n        <div class="nav-submenu">\n          <a href="#festfinder">Fest Near Me</a>\n        </div>\n      </div>\n      <a href="/festival-strategy.html">Festival Strategy</a>');
  html = html.replace(/\s*<a href="\/advertise(?:\.html)?">Advertise<\/a>/g, '');
  html = html.replace(/(<a href="\/funding-lab">Funding Lab<\/a>)/g,'$1\n      <a href="/shop.html">Shop</a>\n      <a href="/advertise.html">Advertise</a>');
  const growthLinks = [
    '<a href="/directory.html">Directory</a>','<a href="/documentary-grants.html">Grants+</a>','<a href="/documentary-markets.html">Markets+</a>','<a href="/fiscal-sponsorship.html">Fiscal Sponsorship</a>','<a href="/blog.html">Blog</a>','<a href="/submit-resource.html">Submit/Correct</a>','<a href="/shop.html">Shop</a>'
  ];
  for (const link of growthLinks) {
    if (!html.includes(link)) html = html.replace(/(<a href="\/advertise\.html">Advertise<\/a>)/g, `$1\n      ${link}`);
  }
}

const growthPanel = `<!-- HOME GROWTH UPGRADES -->
<section class="home-growth-panel" id="home-growth-upgrades">
  <div class="home-growth-inner">
    <div class="home-growth-card">
      <p class="cat-label">Start here</p>
      <h2>Find grants, festivals, and tools worth your time.</h2>
      <p>Documentary411 is becoming a self-correcting filmmaker directory: search resources, report broken links, and stop treating every grant, festival, market, or member-only resource as if it were the same thing.</p>
      <div class="home-growth-links"><a href="/directory.html">Search Directory</a><a href="/submit-resource.html" class="secondary">Submit a Correction</a></div>
    </div>
    <div class="home-growth-card">
      <p class="cat-label">Free workbook</p>
      <h2>Festival Budget Workbook</h2>
      <p>Before filmmakers spend on submissions, travel, PR, badges, deliverables and follow-up, help them calculate what the festival run may actually cost.</p>
      <div class="home-growth-links"><a href="/festival-budget-workbook.html">Download Free</a><a href="/festival-strategy.html" class="secondary">90 Days Out</a></div>
    </div>
  </div>
</section>`;
if (!html.includes('id="home-growth-upgrades"')) html = html.replace('</section>\n\n<!-- FEST NEAR ME -->', `</section>\n\n${growthPanel}\n\n<!-- FEST NEAR ME -->`);

/* Make the Ask a Pro post-payment expectation explicit. */
html = html.replace(
  'Payments are processed securely by Stripe. After checkout you\'ll be redirected to a confirmation page and receive scheduling instructions by email.',
  'Payments are processed securely by Stripe. After checkout, the $50 question purchase continues to a short question form; the $500 consult continues to a short intake and scheduling form.'
);

const homeScript = '<script src="/site-fixes.js" defer></script>';
if (!html.includes(homeScript)) html = html.replace('</body>', `  ${homeScript}\n</body>`);
html = html.replace('<script src="/resources-data.js"></script>', '<script src="/resources-data.js" defer></script>');
html = normalizeFonts(html);
if (!html.includes('hero-cinematic.jpg')) {
  html = html.replace(FONT_END, `${FONT_END}\n  <link rel="preload" as="image" href="/hero-cinematic.jpg" fetchpriority="high">`);
}
fs.writeFileSync(homeFile, html);

/* The Brand-Funded Documentary System is complete and available. The active
   checkout and delivery copy in funding-lab.html must not be replaced at build. */

const productStyle = '<link rel="stylesheet" href="/product-redesign.css">';
const directoryStyle = '<link rel="stylesheet" href="/directory-upgrades.css">';
const growthPages = ['directory.html','submit-resource.html','resource-thank-you.html','festival-budget-workbook.html','blog.html','blog-deauville.html','blog-festival-wins.html','documentary-grants.html','documentary-markets.html','fiscal-sponsorship.html','shop.html','about.html','privacy.html','terms.html','contact.html','affiliate-disclosure.html','newsletter-thank-you.html'];
const styledPages = [
  'funding-lab.html','festival-strategy.html','funding-report.html','funding-sprint.html','thank-you.html','welcome-festival.html','welcome-sprint.html','welcome-system.html','advertise.html','advertise-thank-you.html',
  'ask-a-pro.html','ask-a-pro-question.html','ask-a-pro-question-thank-you.html','ask-a-pro-consult.html','ask-a-pro-consult-thank-you.html','funding-report-thank-you.html','funding-lab-waitlist-thank-you.html',
  ...growthPages
];
styledPages.forEach(fileName => injectStyles(fileName, [productStyle, directoryStyle]));

const searchStyle = '<link rel="stylesheet" href="/site-search.css">';
const searchScript = '<script src="/site-search.js" defer></script>';
const publicPages = ['index.html','funding-lab.html','festival-strategy.html','funding-report.html','funding-sprint.html','advertise.html','ask-a-pro.html',...growthPages];
publicPages.forEach(fileName => {injectStyles(fileName, [searchStyle]);injectScript(fileName, searchScript);});

/* Shared chrome: one header + footer on every public HTML page.
   Pages that already have D411 NAV START are rewritten in place (idempotent)
   so this never re-injects the old 15-item growth nav. */
const NAV_START = '<!-- D411 NAV START -->';
const NAV_END = '<!-- D411 NAV END -->';
const FOOTER_START = '<!-- D411 FOOTER START -->';
const FOOTER_END = '<!-- D411 FOOTER END -->';

function festivalsHrefFor(fileName) {
  return fileName === 'index.html' ? '#festivals' : '/#festivals';
}

function chromeNav(festivalsHref) {
  return `${NAV_START}
<nav class="site-chrome" aria-label="Primary navigation">
  <div class="nav-inner">
    <a href="/" class="nav-logo">Documentary411</a>
    <div class="nav-links">
      <a href="/directory">Directory</a>
      <a href="/documentary-grants">Grants</a>
      <a href="${festivalsHref}">Festivals</a>
      <a href="/shop">Shop</a>
      <a href="/blog">Blog</a>
      <a href="/advertise">Advertise</a>
      <a href="/directory" data-open-search>Search</a>
    </div>
    <button type="button" class="nav-toggle" aria-label="Open menu" aria-expanded="false">☰</button>
  </div>
</nav>
${NAV_END}`;
}

function chromeFooter(festivalsHref) {
  return `${FOOTER_START}
<footer class="site-chrome-footer">
  <div class="footer-inner">
    <div>
      <div class="footer-brand">Documentary411</div>
      <div class="footer-tagline">Created by Kerry David · KDC and Films · a directory for independent filmmakers.</div>
    </div>
    <div class="footer-links">
      <a href="/directory">Directory</a>
      <a href="/documentary-grants">Grants</a>
      <a href="${festivalsHref}">Festivals</a>
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
${FOOTER_END}`;
}

function replaceNav(html, nav) {
  if (html.includes(NAV_START) && html.includes(NAV_END)) {
    return html.replace(/<!-- D411 NAV START -->[\s\S]*?<!-- D411 NAV END -->/, nav);
  }
  if (/<header class="site-header">[\s\S]*?<\/header>/.test(html)) {
    return html.replace(/<header class="site-header">[\s\S]*?<\/header>/, nav);
  }
  if (/<nav class="d411-nav"[^>]*>[\s\S]*?<\/nav>/.test(html)) {
    return html.replace(/<nav class="d411-nav"[^>]*>[\s\S]*?<\/nav>/, nav);
  }
  if (/<nav[^>]*aria-label="Primary navigation"[^>]*>[\s\S]*?<\/nav>/.test(html)) {
    return html.replace(/<nav[^>]*aria-label="Primary navigation"[^>]*>[\s\S]*?<\/nav>/, nav);
  }
  if (/<nav[^>]*aria-label="Primary"[^>]*>[\s\S]*?<\/nav>/.test(html)) {
    return html.replace(/<nav[^>]*aria-label="Primary"[^>]*>[\s\S]*?<\/nav>/, nav);
  }
  if (/<a class="skip-link"[^>]*>[\s\S]*?<\/a>/.test(html)) {
    return html.replace(/(<a class="skip-link"[^>]*>[\s\S]*?<\/a>)/, `$1\n${nav}`);
  }
  return null;
}

function replaceFooter(html, footer) {
  if (html.includes(FOOTER_START) && html.includes(FOOTER_END)) {
    return html.replace(/<!-- D411 FOOTER START -->[\s\S]*?<!-- D411 FOOTER END -->/, footer);
  }
  if (/<footer\b[\s\S]*?<\/footer>/.test(html)) {
    return html.replace(/<footer\b[\s\S]*?<\/footer>/, footer);
  }
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}\n</body>`);
  }
  return null;
}

const chromeStyle = '<link rel="stylesheet" href="/chrome.css">';
const siteFixesScript = '<script src="/site-fixes.js" defer></script>';
const chromePages = fs.readdirSync(__dirname).filter((f) => f.endsWith('.html') && !f.startsWith('google'));
const chromeSkipped = [];
for (const fileName of chromePages) {
  const file = path.join(__dirname, fileName);
  let html = fs.readFileSync(file, 'utf8');
  const festivalsHref = festivalsHrefFor(fileName);
  const nextNav = replaceNav(html, chromeNav(festivalsHref));
  if (!nextNav) {
    chromeSkipped.push(`${fileName}: no header/nav to convert`);
    continue;
  }
  html = nextNav;
  const nextFooter = replaceFooter(html, chromeFooter(festivalsHref));
  if (!nextFooter) {
    chromeSkipped.push(`${fileName}: no footer to convert`);
    fs.writeFileSync(file, html);
    continue;
  }
  fs.writeFileSync(file, nextFooter);
  injectStyles(fileName, [chromeStyle, searchStyle]);
  injectScript(fileName, siteFixesScript);
  injectScript(fileName, searchScript);
}
if (chromeSkipped.length) {
  console.warn('Chrome conversion skipped:\n  ' + chromeSkipped.join('\n  '));
}

/* Shop lives in the shared chrome. Do not clone it into leftover header variants
   on pages that already have D411 NAV START. */
for (const fileName of publicPages) {
  const file = path.join(__dirname, fileName);
  if (!fs.existsSync(file)) continue;
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes(NAV_START)) continue;
  if (/href=["']\/shop(?:\.html)?["'][^>]*>Shop<\/a>/i.test(source)) continue;
  if (source.includes('class="d411-links"')) {
    source = source.replace('<div class="d411-links">', '<div class="d411-links"><a href="/shop">Shop</a>');
  } else if (source.includes('class="nav-links"')) {
    source = source.replace('<div class="nav-links">', '<div class="nav-links"><a href="/shop">Shop</a>');
  } else if (source.includes('class="nav-note"')) {
    source = source.replace(/(<span class="nav-note")/, '<a class="site-shop-link" href="/shop">Shop</a>\n      $1');
  }
  fs.writeFileSync(file, source);
}


function decodeEntities(s){return String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&ndash;/g,'–').replace(/&mdash;/g,'—').replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function cleanText(source){return decodeEntities(String(source||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function firstMatch(source,re,fallback=''){const m=String(source||'').match(re);return m?cleanText(m[1]):fallback;}
function excerpt(text,max=220){const t=cleanText(text);return t.length<=max?t:t.slice(0,max).replace(/\s+\S*$/,'')+'…';}
function fileUrl(fileName){return fileName==='index.html'?'/':'/'+fileName;}

const searchEntries=[];
for(const fileName of publicPages){
  const file=path.join(__dirname,fileName); if(!fs.existsSync(file)) continue;
  const source=fs.readFileSync(file,'utf8'); const pageTitle=firstMatch(source,/<title[^>]*>([\s\S]*?)<\/title>/i,fileName); const h1=firstMatch(source,/<h1[^>]*>([\s\S]*?)<\/h1>/i,pageTitle.replace(/\s+[—|-]\s+Documentary411.*$/i,'')); const bodyText=cleanText(source);
  searchEntries.push({page:pageTitle.replace(/\s+[—|-]\s+Documentary411.*$/i,''),title:h1||pageTitle,url:fileUrl(fileName),excerpt:excerpt(bodyText),searchText:bodyText});
  if(fileName==='index.html'){
    const sectionRe=/<section\b([^>]*)>([\s\S]*?)<\/section>/gi; let section;
    while((section=sectionRe.exec(source))){const attrs=section[1]; const idMatch=attrs.match(/\bid=["']([^"']+)["']/i); if(!idMatch) continue; const id=idMatch[1]; const block=section[2]; const sectionTitle=firstMatch(block,/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i,'Documentary411 Resource'); const sectionText=cleanText(block); if(!sectionText) continue; searchEntries.push({page:'Documentary411 Directory',title:sectionTitle,url:'/#'+id,excerpt:excerpt(sectionText),searchText:sectionText});}
  }
}
fs.writeFileSync(path.join(__dirname,'search-index.json'), JSON.stringify(searchEntries));

/* Favicon: every real page gets the icon links. Skips the Google Search
   Console verification file, which must stay untouched. */
const faviconTags = [
  '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
  '<link rel="icon" href="/favicon.ico" sizes="any">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
];
const allHtmlPages = fs.readdirSync(__dirname).filter(f => f.endsWith('.html') && !f.startsWith('google'));
allHtmlPages.forEach(fileName => injectStyles(fileName, faviconTags));

allHtmlPages.forEach((fileName) => {
  const file = path.join(__dirname, fileName);
  const source = fs.readFileSync(file, 'utf8');
  const next = normalizeFonts(source);
  if (next !== source) fs.writeFileSync(file, next);
});

console.log(`Documentary411 redesign, shared chrome, directory upgrades, advertising, paid-offer safety, homepage fixes, site search, and favicon applied (${searchEntries.length} search entries, ${allHtmlPages.length} pages got favicon links)`);
