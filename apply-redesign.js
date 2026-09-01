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
fs.writeFileSync(homeFile, html);

/* The Brand-Funded Documentary System is complete and available. The active
   checkout and delivery copy in funding-lab.html must not be replaced at build. */

const productStyle = '<link rel="stylesheet" href="/product-redesign.css">';
const directoryStyle = '<link rel="stylesheet" href="/directory-upgrades.css">';
const growthPages = ['directory.html','submit-resource.html','resource-thank-you.html','festival-budget-workbook.html','blog.html','blog-festival-wins.html','documentary-grants.html','documentary-markets.html','fiscal-sponsorship.html','shop.html','about.html','privacy.html','terms.html','contact.html','affiliate-disclosure.html','newsletter-thank-you.html'];
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

/* Keep the requested Shop entry visible across the site's existing header variants. */
for (const fileName of publicPages) {
  const file = path.join(__dirname, fileName);
  if (!fs.existsSync(file)) continue;
  let source = fs.readFileSync(file, 'utf8');
  if (/href=["']\/shop(?:\.html)?["'][^>]*>Shop<\/a>/i.test(source)) continue;
  if (source.includes('class="d411-links"')) {
    source = source.replace('<div class="d411-links">', '<div class="d411-links"><a href="/shop.html">Shop</a>');
  } else if (source.includes('class="nav-links"')) {
    source = source.replace('<div class="nav-links">', '<div class="nav-links"><a href="/shop.html">Shop</a>');
  } else if (source.includes('class="nav-note"')) {
    source = source.replace(/(<span class="nav-note")/, '<a class="site-shop-link" href="/shop.html">Shop</a>\n      $1');
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

console.log(`Documentary411 redesign, directory upgrades, advertising, paid-offer safety, homepage fixes, site search, and favicon applied (${searchEntries.length} search entries, ${allHtmlPages.length} pages got favicon links)`);
