/* Build-time checks for Documentary411's conservative technical SEO layer. */

const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://documentary411.com';
function assetOrigin() {
  if (process.env.CONTEXT !== 'deploy-preview' || !process.env.DEPLOY_PRIME_URL) return ORIGIN;
  try {
    const candidate = new URL(process.env.DEPLOY_PRIME_URL);
    if (candidate.protocol === 'https:' && candidate.hostname.endsWith('.netlify.app')) {
      return candidate.origin;
    }
  } catch (_error) {
    // Fall back to the production asset origin when Netlify's value is absent or invalid.
  }
  return ORIGIN;
}
const SOCIAL_IMAGE = `${assetOrigin()}/documentary411-social-card.png`;
const SOCIAL_IMAGE_ALT = 'Documentary411.com — Films. Insights. Resources.';

const pages = [
  { file: 'index.html', route: '/', schemaType: 'WebPage', lastmod: '2026-08-20' },
  { file: 'directory.html', route: '/directory', schemaType: 'CollectionPage', lastmod: '2026-08-20', itemList: true },
  { file: 'open-now.html', route: '/open-now', schemaType: 'CollectionPage', lastmod: '2026-08-20', itemList: true },
  { file: 'documentary-grants.html', route: '/documentary-grants', schemaType: 'CollectionPage', lastmod: '2026-08-20', itemList: true },
  { file: 'documentary-markets.html', route: '/documentary-markets', schemaType: 'CollectionPage', lastmod: '2026-08-20', itemList: true },
  { file: 'fiscal-sponsorship.html', route: '/fiscal-sponsorship', schemaType: 'CollectionPage', lastmod: '2026-08-20', itemList: true },
  { file: 'submit-resource.html', route: '/submit-resource', schemaType: 'WebPage', lastmod: '2026-08-20' },
  { file: 'blog.html', route: '/blog', schemaType: 'CollectionPage', lastmod: '2026-08-20' },
  { file: 'blog-festival-wins.html', route: '/blog-festival-wins', schemaType: 'WebPage', lastmod: '2026-08-20' },
  { file: 'festival-budget-workbook.html', route: '/festival-budget-workbook', schemaType: 'WebPage', lastmod: '2026-08-20' },
  { file: 'festival-strategy.html', route: '/festival-strategy', schemaType: 'WebPage', lastmod: '2026-08-20' },
  { file: 'funding-lab.html', route: '/funding-lab', schemaType: 'WebPage', lastmod: '2026-08-20' },
  { file: 'funding-sprint.html', route: '/funding-sprint', schemaType: 'WebPage', lastmod: '2026-08-20' },
  { file: 'funding-report.html', route: '/funding-report', schemaType: 'WebPage', lastmod: '2026-08-20' },
  { file: 'ask-a-pro.html', route: '/ask-a-pro', schemaType: 'WebPage', lastmod: '2026-08-22' },
  { file: 'advertise.html', route: '/advertise', schemaType: 'WebPage', lastmod: '2026-08-20' },
  { file: 'shop.html', route: '/shop', schemaType: 'CollectionPage', lastmod: '2026-08-27' },
];

const failures = [];
function check(condition, message) {
  if (!condition) failures.push(message);
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:0*39|x0*27);/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function attributeOf(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? decodeEntities(match[1]) : '';
}

function metaTags(html, attribute, value) {
  return (html.match(/<meta\b[^>]*>/gi) || []).filter((tag) => attributeOf(tag, attribute).toLowerCase() === value.toLowerCase());
}

function metaValue(html, attribute, value) {
  return attributeOf(metaTags(html, attribute, value)[0] || '', 'content');
}

function titleOf(html) {
  return decodeEntities(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
}

function descriptionOf(html) {
  return metaValue(html, 'name', 'description');
}

function canonicalTags(html) {
  return (html.match(/<link\b[^>]*>/gi) || []).filter((tag) => attributeOf(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical'));
}

function jsonLdBlocks(html, file) {
  const values = [];
  for (const [index, match] of [...html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
    try {
      values.push(JSON.parse(match[1]));
    } catch (error) {
      failures.push(`${file}: JSON-LD block ${index + 1} does not parse (${error.message}).`);
    }
  }
  return values;
}

function flattenSchema(blocks) {
  return blocks.flatMap((block) => Array.isArray(block?.['@graph']) ? block['@graph'] : [block]);
}

function typesOf(node) {
  return Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']].filter(Boolean);
}

const titles = new Map();
const descriptions = new Map();
const canonicalSlugs = pages.filter((page) => page.route !== '/').map((page) => page.route.slice(1));

const ogExpected = {
  'og:type': 'website',
  'og:site_name': 'Documentary411',
  'og:locale': 'en_US',
  'og:image': SOCIAL_IMAGE,
  'og:image:secure_url': SOCIAL_IMAGE,
  'og:image:type': 'image/png',
  'og:image:width': '1200',
  'og:image:height': '630',
  'og:image:alt': SOCIAL_IMAGE_ALT,
};

const twitterExpected = {
  'twitter:card': 'summary_large_image',
  'twitter:image': SOCIAL_IMAGE,
  'twitter:image:alt': SOCIAL_IMAGE_ALT,
};

for (const page of pages) {
  const filePath = path.join(__dirname, page.file);
  check(fs.existsSync(filePath), `${page.file}: file is missing.`);
  if (!fs.existsSync(filePath)) continue;

  const html = fs.readFileSync(filePath, 'utf8');
  const title = titleOf(html);
  const description = descriptionOf(html);
  const canonical = `${ORIGIN}${page.route}`;

  check(Boolean(title), `${page.file}: title is missing.`);
  check(Boolean(description), `${page.file}: meta description is missing.`);
  if (title) {
    if (titles.has(title)) failures.push(`${page.file}: title duplicates ${titles.get(title)}.`);
    else titles.set(title, page.file);
  }
  if (description) {
    if (descriptions.has(description)) failures.push(`${page.file}: meta description duplicates ${descriptions.get(description)}.`);
    else descriptions.set(description, page.file);
  }

  const robots = metaValue(html, 'name', 'robots').toLowerCase();
  check(!robots.includes('noindex'), `${page.file}: canonical public page must not be noindex.`);

  const canonicals = canonicalTags(html);
  check(canonicals.length === 1, `${page.file}: expected one canonical, found ${canonicals.length}.`);
  if (canonicals.length) check(attributeOf(canonicals[0], 'href') === canonical, `${page.file}: canonical does not equal ${canonical}.`);

  const perPageOg = { 'og:title': title, 'og:description': description, 'og:url': canonical, ...ogExpected };
  for (const [property, expected] of Object.entries(perPageOg)) {
    const tags = metaTags(html, 'property', property);
    check(tags.length === 1, `${page.file}: expected one ${property}, found ${tags.length}.`);
    if (tags.length) check(attributeOf(tags[0], 'content') === expected, `${page.file}: ${property} has an unexpected value.`);
  }

  const perPageTwitter = { 'twitter:title': title, 'twitter:description': description, ...twitterExpected };
  for (const [name, expected] of Object.entries(perPageTwitter)) {
    const tags = metaTags(html, 'name', name);
    check(tags.length === 1, `${page.file}: expected one ${name}, found ${tags.length}.`);
    if (tags.length) check(attributeOf(tags[0], 'content') === expected, `${page.file}: ${name} has an unexpected value.`);
  }
  check(metaTags(html, 'name', 'twitter:site').length === 0, `${page.file}: twitter:site must not be invented.`);

  const schemaBlocks = jsonLdBlocks(html, page.file);
  const schemaNodes = flattenSchema(schemaBlocks);
  const pageNode = schemaNodes.find((node) => node?.['@id'] === `${canonical}#webpage`);
  check(Boolean(pageNode), `${page.file}: page-level JSON-LD node is missing.`);
  if (pageNode) {
    check(typesOf(pageNode).includes(page.schemaType), `${page.file}: page schema must use ${page.schemaType}.`);
    check(pageNode.url === canonical, `${page.file}: page schema URL must match the canonical.`);
    check(pageNode.name === title, `${page.file}: page schema name must match the title.`);
    check(pageNode.description === description, `${page.file}: page schema description must match the meta description.`);
  }

  if (page.route === '/') {
    check(schemaNodes.some((node) => typesOf(node).includes('Organization') && node?.['@id'] === `${ORIGIN}/#organization`), 'index.html: Organization schema is missing.');
    check(schemaNodes.some((node) => typesOf(node).includes('WebSite') && node?.['@id'] === `${ORIGIN}/#website`), 'index.html: WebSite schema is missing.');
  }

  const itemLists = schemaNodes.filter((node) => typesOf(node).includes('ItemList'));
  check(itemLists.length === (page.itemList ? 1 : 0), `${page.file}: expected ${page.itemList ? 'one preserved' : 'no'} ItemList schema block, found ${itemLists.length}.`);
  for (const list of itemLists) {
    const items = Array.isArray(list.itemListElement) ? list.itemListElement : [];
    check(Number(list.numberOfItems) === items.length, `${page.file}: ItemList numberOfItems does not match its entries.`);
    items.forEach((entry, index) => {
      check(entry?.position === index + 1, `${page.file}: ItemList position ${index + 1} is invalid.`);
      check(Boolean(entry?.item?.name), `${page.file}: ItemList entry ${index + 1} is missing a visible resource name.`);
      check(/^https:\/\//.test(entry?.item?.url || ''), `${page.file}: ItemList entry ${index + 1} must use an absolute HTTPS URL.`);
    });
  }
}

const sitemapPath = path.join(__dirname, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const sitemapEntries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?\s*<\/url>/gi)].map((match) => ({ url: decodeEntities(match[1]), lastmod: match[2] || '' }));
const expectedSitemapUrls = pages.map((page) => `${ORIGIN}${page.route}`);
check(sitemapEntries.length === pages.length, `sitemap.xml: expected ${pages.length} URLs, found ${sitemapEntries.length}.`);
check(new Set(sitemapEntries.map((entry) => entry.url)).size === sitemapEntries.length, 'sitemap.xml: duplicate URL found.');
check(sitemapEntries.every((entry) => !/\.html(?:$|[?#])/.test(entry.url)), 'sitemap.xml: .html URL found.');
check(!/<(?:priority|changefreq)>/i.test(sitemap), 'sitemap.xml: priority or changefreq must not be added.');
for (const page of pages) {
  const expectedUrl = `${ORIGIN}${page.route}`;
  const entry = sitemapEntries.find((candidate) => candidate.url === expectedUrl);
  check(Boolean(entry), `sitemap.xml: missing ${expectedUrl}.`);
  if (entry) check(entry.lastmod === page.lastmod, `sitemap.xml: ${expectedUrl} lastmod changed without a content change.`);
}
for (const entry of sitemapEntries) check(expectedSitemapUrls.includes(entry.url), `sitemap.xml: unexpected URL ${entry.url}.`);

const robots = fs.readFileSync(path.join(__dirname, 'robots.txt'), 'utf8');
check(robots === `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`, 'robots.txt: the previously valid file changed unexpectedly.');

const socialImagePath = path.join(__dirname, 'documentary411-social-card.png');
check(fs.existsSync(socialImagePath), 'documentary411-social-card.png: social image is missing.');
if (fs.existsSync(socialImagePath)) {
  const png = fs.readFileSync(socialImagePath);
  check(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'documentary411-social-card.png: file is not a valid PNG.');
  if (png.length >= 24) {
    check(png.readUInt32BE(16) === 1200, `documentary411-social-card.png: expected width 1200, found ${png.readUInt32BE(16)}.`);
    check(png.readUInt32BE(20) === 630, `documentary411-social-card.png: expected height 630, found ${png.readUInt32BE(20)}.`);
  }
}

const htmlFiles = fs.readdirSync(__dirname).filter((file) => file.endsWith('.html') && !file.startsWith('google'));
const canonicalHtmlHref = new RegExp(`\\bhref\\s*=\\s*["']\\/(?:${canonicalSlugs.join('|')})\\.html(?=[?#"'])`, 'i');
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
  check(!canonicalHtmlHref.test(html), `${file}: internal anchor still points to a canonical page with .html.`);
}

const directoryTools = fs.readFileSync(path.join(__dirname, 'directory-tools.js'), 'utf8');
check(!canonicalHtmlHref.test(directoryTools), 'directory-tools.js: generated internal anchor still points to a canonical page with .html.');

const shop = fs.readFileSync(path.join(__dirname, 'shop.html'), 'utf8');
for (const href of ['/festival-strategy', '/funding-lab', '/funding-sprint', '/advertise', '/#equipment']) {
  check(new RegExp(`\\bhref=["']${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(shop), `shop.html: missing verified purchase path ${href}.`);
}
check(!/buy\.stripe\.com\/(?:bJe00iabZbQJ0Uubu36J204|3cI14mck79IBbz8dCb6J203)/.test(shop), 'shop.html: Ask a Pro or Pro Consult checkout must not be included.');

const home = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const festivalBlock = home.match(/window\.FESTIVALS\s*=\s*\[([\s\S]*?)\n\];/);
const festivalTotal = festivalBlock ? (festivalBlock[1].match(/\{name:/g) || []).length : 0;
check(festivalTotal === 48, `index.html: expected 48 festival records, found ${festivalTotal}.`);
check(/id="festivalStatCount">48<\/span><span class="stat-label">Verified Festivals/.test(home), 'index.html: hero must identify the verified festival total, not imply hundreds of festivals.');
check(/id="festivalFinderCount">48<\/span> Verified Documentary Festivals/.test(home), 'index.html: festival finder count is stale.');
check(/id="festivalDatabaseCount">48<\/span> verified documentary festivals/.test(home), 'index.html: festival database description count is stale.');

const directoryPage = fs.readFileSync(path.join(__dirname, 'directory.html'), 'utf8');
check(/<h1>Search funding, grants, festivals, markets, tools and <em>what to do next<\/em>\.<\/h1>/.test(directoryPage), 'directory.html: directory heading must not advertise crew or cast services.');

const fundingLab = fs.readFileSync(path.join(__dirname, 'funding-lab.html'), 'utf8');
const fundingCheckoutButtons = fundingLab.match(/buy-button-id="buy_btn_1U6wImAPixlPEv1rpHBCkIdL"/g) || [];
check(fundingCheckoutButtons.length === 3, `funding-lab.html: expected three active Stripe buy buttons, found ${fundingCheckoutButtons.length}.`);
check(!/checkout is (?:currently |temporarily )?paused|why is checkout paused|funding lab waitlist/i.test(fundingLab), 'funding-lab.html: stale paused or waitlist copy remains.');
check(!/checkout is (?:currently |temporarily )?paused|buyer library is being finalized|funding lab waitlist/i.test(shop + fs.readFileSync(path.join(__dirname, 'welcome-system.html'), 'utf8')), 'shop/welcome-system: stale Funding Lab pause copy remains.');

const festivalStrategy = fs.readFileSync(path.join(__dirname, 'festival-strategy.html'), 'utf8');
const festivalCheckoutUrl = 'https://buy.stripe.com/4gM5kC83RcUN5aK7dN6J206';
const festivalCheckoutLinks = festivalStrategy.match(new RegExp(festivalCheckoutUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || [];
check(festivalCheckoutLinks.length === 3, `festival-strategy.html: expected three verified $99 checkout links, found ${festivalCheckoutLinks.length}.`);
check(!festivalStrategy.includes('https://buy.stripe.com/aFa28qgAn2g9bz869J6J209'), 'festival-strategy.html: temporary $1 Payment Link must not be present.');
check(!/Test Checkout — \$1|Temporary \$1 live Stripe checkout|Temporary test price/.test(festivalStrategy), 'festival-strategy.html: temporary $1 checkout copy must not be present.');
check(!fs.existsSync(path.join(__dirname, 'festival-dollar-test.js')), 'festival-dollar-test.js: temporary $1 build override must not exist.');
check(!fs.existsSync(path.join(__dirname, 'netlify/functions/festival-test-checkout.mts')), 'festival-test-checkout.mts: temporary $1 checkout endpoint must not exist.');

const searchIndex = JSON.parse(fs.readFileSync(path.join(__dirname, 'search-index.json'), 'utf8'));
for (const entry of searchIndex) {
  const parsed = new URL(entry.url, ORIGIN);
  check(!/\.html$/i.test(parsed.pathname), `search-index.json: canonical search result still uses .html (${entry.url}).`);
  const matchingNoindexFile = htmlFiles.find((file) => {
    const stem = file.replace(/\.html$/i, '');
    return parsed.pathname === `/${file}` || parsed.pathname === `/${stem}`;
  });
  if (matchingNoindexFile) {
    const html = fs.readFileSync(path.join(__dirname, matchingNoindexFile), 'utf8');
    check(!metaValue(html, 'name', 'robots').toLowerCase().includes('noindex'), `search-index.json: noindex page ${entry.url} is searchable.`);
  }
}

const errorPagePath = path.join(__dirname, '404.html');
check(fs.existsSync(errorPagePath), '404.html: custom error page is missing.');
if (fs.existsSync(errorPagePath)) {
  const errorPage = fs.readFileSync(errorPagePath, 'utf8');
  check(metaValue(errorPage, 'name', 'robots').toLowerCase().includes('noindex'), '404.html: custom error page must be noindex.');
  for (const href of ['/', '/directory', '/documentary-grants', '/open-now']) {
    check(new RegExp(`\\bhref=["']${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(errorPage), `404.html: missing required link to ${href}.`);
  }
  check(/<script\b[^>]*\bsrc=["']\/site-search\.js["']/i.test(errorPage), '404.html: existing site search is not available.');
  check(/<button\b[^>]*\bdata-open-search\b/i.test(errorPage), '404.html: visible Search Documentary411 control is missing.');
}

function redirectRules(source) {
  return [...source.matchAll(/\[\[redirects\]\]([\s\S]*?)(?=\n\[\[|$)/g)].map((match) => {
    const block = match[1];
    const value = (name) => block.match(new RegExp(`^\\s*${name}\\s*=\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'))?.[1]?.trim() || '';
    return { from: value('from'), to: value('to'), status: Number(value('status')), force: value('force') === 'true' };
  });
}

const netlify = fs.readFileSync(path.join(__dirname, 'netlify.toml'), 'utf8');
const redirects = redirectRules(netlify);
for (const page of pages) {
  const from = page.route === '/' ? '/index.html' : `${page.route}.html`;
  const matches = redirects.filter((rule) => rule.from === from && rule.status === 301);
  check(matches.length === 1, `netlify.toml: expected one 301 redirect for ${from}, found ${matches.length}.`);
  if (matches.length) {
    check(matches[0].to === page.route, `netlify.toml: ${from} must redirect to ${page.route}.`);
    check(matches[0].force, `netlify.toml: ${from} canonical redirect must be forced.`);
  }
}
const permanentRedirects = redirects.filter((rule) => rule.status === 301);
for (const rule of permanentRedirects) {
  check(!permanentRedirects.some((candidate) => candidate.from === rule.to), `netlify.toml: redirect chain detected at ${rule.from} → ${rule.to}.`);
  check(!rule.from.includes('*'), `netlify.toml: blanket permanent redirect is not allowed (${rule.from}).`);
}
check(redirects.some((rule) => rule.from === '/crew-jobs' && rule.to === '/directory' && rule.status === 301), 'netlify.toml: /crew-jobs must retain its redirect without a chain.');
check(redirects.some((rule) => rule.from === '/crew-jobs.html' && rule.to === '/directory' && rule.status === 301), 'netlify.toml: /crew-jobs.html must retain its redirect without a chain.');

if (failures.length) {
  console.error(`\n✖ Documentary411 technical SEO verification failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):\n`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  console.error('');
  process.exit(1);
}

console.log(`Documentary411 technical SEO verification passed — ${pages.length} canonical pages, ${sitemapEntries.length} sitemap URLs, ${searchIndex.length} public search entries, complete social metadata, valid JSON-LD, exact robots.txt, and a noindex custom 404.`);
