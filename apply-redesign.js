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
  '<link rel="stylesheet" href="/redesign-v2.css">'
];
for (const tag of homeStyles) {
  if (!html.includes(tag)) html = html.replace('</head>', `  ${tag}\n</head>`);
}

html = html.replace(
  /<p class="hero-eyebrow"[^>]*>.*?<\/p>/,
  '<p class="hero-eyebrow">Funding. Festivals. Tools. Community.</p>'
);
html = html.replace(
  /<h1>.*?<\/h1>/,
  '<h1>Your Insider<br>Advantage for<br>Documentary<br>Filmmaking<span class="hero-dot">.</span></h1>'
);
html = html.replace(
  'Verified grants, festivals, distributors, sales agents, legal resources, equipment, and software — curated for independent documentary filmmakers at every stage.',
  'Funding opportunities, festivals, distribution, legal resources, equipment and practical tools — curated for independent documentary filmmakers by people who know the road.'
);
html = html.replace('>Explore Directory</a>', '>Explore Resources</a>');

/* Navigation hierarchy */
html = html.replace(/\s*<a href="\/festival-strategy(?:\.html)?">Festival Strategy<\/a>/g, '');
html = html.replace(
  /<a href="#festivals">Festivals<\/a>\s*<a href="#festfinder">Fest Near Me<\/a>/,
  '<div class="nav-dropdown">\n        <a href="#festivals" class="nav-parent">Festivals <span class="nav-caret" aria-hidden="true">⌄</span></a>\n        <div class="nav-submenu">\n          <a href="#festfinder">Fest Near Me</a>\n        </div>\n      </div>\n      <a href="/festival-strategy.html">Festival Strategy</a>'
);

/* Advertising tab */
html = html.replace(/\s*<a href="\/advertise(?:\.html)?">Advertise<\/a>/g, '');
html = html.replace(
  /(<a href="\/funding-lab">Funding Lab<\/a>)/,
  '$1\n      <a href="/advertise.html">Advertise</a>'
);

const homeScript = '<script src="/site-fixes.js" defer></script>';
if (!html.includes(homeScript)) html = html.replace('</body>', `  ${homeScript}\n</body>`);
fs.writeFileSync(homeFile, html);

/* Shared product/support visual system */
const productStyle = '<link rel="stylesheet" href="/product-redesign.css">';
const styledPages = [
  'funding-lab.html','festival-strategy.html','funding-report.html','funding-sprint.html',
  'thank-you.html','welcome-festival.html','welcome-sprint.html','welcome-system.html',
  'advertise.html','advertise-thank-you.html'
];
styledPages.forEach(fileName => injectStyles(fileName, [productStyle]));

/* Site-wide search: public pages only. */
const searchStyle = '<link rel="stylesheet" href="/site-search.css">';
const searchScript = '<script src="/site-search.js" defer></script>';
const publicPages = [
  'index.html','funding-lab.html','festival-strategy.html','funding-report.html',
  'funding-sprint.html','advertise.html'
];
publicPages.forEach(fileName => {
  injectStyles(fileName, [searchStyle]);
  injectScript(fileName, searchScript);
});

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/&nbsp;/g,' ').replace(/&ndash;/g,'–').replace(/&mdash;/g,'—')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
function cleanText(source) {
  return decodeEntities(String(source || '')
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' '))
    .replace(/\s+/g,' ').trim();
}
function firstMatch(source, re, fallback='') {
  const m = String(source || '').match(re);
  return m ? cleanText(m[1]) : fallback;
}
function excerpt(text, max=220) {
  const t = cleanText(text);
  return t.length <= max ? t : t.slice(0,max).replace(/\s+\S*$/,'') + '…';
}
function fileUrl(fileName) {
  return fileName === 'index.html' ? '/' : '/' + fileName;
}

const searchEntries = [];
for (const fileName of publicPages) {
  const file = path.join(__dirname, fileName);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file,'utf8');
  const pageTitle = firstMatch(source, /<title[^>]*>([\s\S]*?)<\/title>/i, fileName);
  const h1 = firstMatch(source, /<h1[^>]*>([\s\S]*?)<\/h1>/i, pageTitle.replace(/\s+[—|-]\s+Documentary411.*$/i,''));
  const bodyText = cleanText(source);
  searchEntries.push({
    page: pageTitle.replace(/\s+[—|-]\s+Documentary411.*$/i,''),
    title: h1 || pageTitle,
    url: fileUrl(fileName),
    excerpt: excerpt(bodyText),
    searchText: bodyText
  });

  /* Homepage is a large directory, so index each named section separately. */
  if (fileName === 'index.html') {
    const sectionRe = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
    let section;
    while ((section = sectionRe.exec(source))) {
      const attrs = section[1];
      const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
      if (!idMatch) continue;
      const id = idMatch[1];
      const block = section[2];
      const sectionTitle = firstMatch(block, /<h[23][^>]*>([\s\S]*?)<\/h[23]>/i, 'Documentary411 Resource');
      const sectionText = cleanText(block);
      if (!sectionText) continue;
      searchEntries.push({
        page: 'Documentary411 Directory',
        title: sectionTitle,
        url: '/#' + id,
        excerpt: excerpt(sectionText),
        searchText: sectionText
      });
    }
  }
}
fs.writeFileSync(path.join(__dirname,'search-index.json'), JSON.stringify(searchEntries));

console.log(`Documentary411 redesign, advertising, homepage fixes and site search applied (${searchEntries.length} search entries)`);
