/* Build-time checks for Documentary411's conservative technical SEO layer. */

const fs = require('fs');
const path = require('path');
const { assignSlugs, resourceCanonical, resourcePath } = require('./resource-urls');

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
const SOCIAL_IMAGE = `${assetOrigin()}/documentary411-social-card.jpg`;
const SOCIAL_IMAGE_ALT = 'Documentary411.com — Grants. Festivals. Tools.';

const pages = [
  { file: 'index.html', route: '/', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'directory.html', route: '/directory', schemaType: 'CollectionPage', lastmod: '2026-09-01', itemList: true },
  { file: 'documentary-grants.html', route: '/documentary-grants', schemaType: 'CollectionPage', lastmod: '2026-09-01', itemList: true },
  { file: 'documentary-markets.html', route: '/documentary-markets', schemaType: 'CollectionPage', lastmod: '2026-09-01', itemList: true },
  { file: 'fiscal-sponsorship.html', route: '/fiscal-sponsorship', schemaType: 'CollectionPage', lastmod: '2026-09-01', itemList: true },
  { file: 'submit-resource.html', route: '/submit-resource', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'blog.html', route: '/blog', schemaType: 'CollectionPage', lastmod: '2026-09-01' },
  { file: 'blog-deauville.html', route: '/blog/deauville', schemaType: 'BlogPosting', lastmod: '2026-09-01' },
  { file: 'festival-budget-workbook.html', route: '/festival-budget-workbook', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'festival-strategy.html', route: '/festival-strategy', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'funding-lab.html', route: '/funding-lab', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'funding-sprint.html', route: '/funding-sprint', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'funding-report.html', route: '/funding-report', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'ask-a-pro.html', route: '/ask-a-pro', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'advertise.html', route: '/advertise', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'shop.html', route: '/shop', schemaType: 'CollectionPage', lastmod: '2026-09-01' },
  { file: 'about.html', route: '/about', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'privacy.html', route: '/privacy', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'terms.html', route: '/terms', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'contact.html', route: '/contact', schemaType: 'WebPage', lastmod: '2026-09-01' },
  { file: 'affiliate-disclosure.html', route: '/affiliate-disclosure', schemaType: 'WebPage', lastmod: '2026-09-01' },
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
  'og:image:type': 'image/jpeg',
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

  const orgNode = schemaNodes.find((node) => typesOf(node).includes('Organization') && node?.['@id'] === `${ORIGIN}/#organization`);
  check(Boolean(orgNode), `${page.file}: Organization schema is missing.`);
  if (orgNode) {
    const sameAs = Array.isArray(orgNode.sameAs) ? orgNode.sameAs : [];
    check(sameAs.includes('https://imdb.me/kerrydavid'), `${page.file}: Organization sameAs must include IMDb.`);
    check(sameAs.includes('https://www.linkedin.com/in/kerrydavid'), `${page.file}: Organization sameAs must include LinkedIn.`);
  }
  const person = schemaNodes.find((node) => typesOf(node).includes('Person') && node?.['@id'] === `${ORIGIN}/#person`);
  check(Boolean(person), `${page.file}: Person schema is missing.`);
  if (person) {
    check(person.name === 'Kerry David', `${page.file}: Person name must be Kerry David.`);
    const sameAs = Array.isArray(person.sameAs) ? person.sameAs : [];
    check(sameAs.includes('https://imdb.me/kerrydavid'), `${page.file}: Person sameAs must include IMDb.`);
    check(sameAs.includes('https://www.linkedin.com/in/kerrydavid'), `${page.file}: Person sameAs must include LinkedIn.`);
  }

  const visibleFaq = /<div class="faq">/i.test(html);
  const faqPages = schemaNodes.filter((node) => typesOf(node).includes('FAQPage'));
  if (visibleFaq) {
    check(faqPages.length === 1, `${page.file}: visible FAQ must have one FAQPage schema block, found ${faqPages.length}.`);
  } else {
    check(faqPages.length === 0, `${page.file}: FAQPage schema must not be invented where no visible FAQ exists.`);
  }

  const products = schemaNodes.filter((node) => typesOf(node).includes('Product'));
  const expectedProductPrices = {
    'festival-strategy.html': ['99'],
    'funding-lab.html': ['297'],
    'funding-sprint.html': ['2500'],
    'ask-a-pro.html': ['50', '500'],
  };
  if (expectedProductPrices[page.file]) {
    const prices = products.flatMap((node) => {
      const offers = Array.isArray(node.offers) ? node.offers : node.offers ? [node.offers] : [];
      return offers.map((offer) => String(offer.price));
    });
    for (const price of expectedProductPrices[page.file]) {
      check(prices.includes(price), `${page.file}: Product/Offer schema missing price ${price}.`);
    }
  } else {
    check(products.length === 0, `${page.file}: Product schema must not be added on pages without a visible price.`);
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

const catalog = assignSlugs(JSON.parse(fs.readFileSync(path.join(__dirname, 'resources.json'), 'utf8')).map((row) => {
  const rec = { ...row };
  delete rec._mergedFrom;
  delete rec._mergeConflicts;
  return rec;
}));
const resourceSitemapUrls = catalog.map((row) => resourceCanonical(row.slug));

const sitemapPath = path.join(__dirname, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const sitemapEntries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?\s*<\/url>/gi)].map((match) => ({ url: decodeEntities(match[1]), lastmod: match[2] || '' }));
const expectedSitemapUrls = pages.map((page) => `${ORIGIN}${page.route}`).concat(resourceSitemapUrls);
check(sitemapEntries.length === expectedSitemapUrls.length, `sitemap.xml: expected ${expectedSitemapUrls.length} URLs (${pages.length} canonical + ${resourceSitemapUrls.length} resources), found ${sitemapEntries.length}.`);
check(new Set(sitemapEntries.map((entry) => entry.url)).size === sitemapEntries.length, 'sitemap.xml: duplicate URL found.');
check(sitemapEntries.every((entry) => !/\.html(?:$|[?#])/.test(entry.url)), 'sitemap.xml: .html URL found.');
check(!/<(?:priority|changefreq)>/i.test(sitemap), 'sitemap.xml: priority or changefreq must not be added.');
for (const page of pages) {
  const expectedUrl = `${ORIGIN}${page.route}`;
  const entry = sitemapEntries.find((candidate) => candidate.url === expectedUrl);
  check(Boolean(entry), `sitemap.xml: missing ${expectedUrl}.`);
  if (entry) check(entry.lastmod === page.lastmod, `sitemap.xml: ${expectedUrl} lastmod changed without a content change.`);
}
for (const resourceUrl of resourceSitemapUrls) {
  check(sitemapEntries.some((entry) => entry.url === resourceUrl), `sitemap.xml: missing ${resourceUrl}.`);
}
for (const entry of sitemapEntries) check(expectedSitemapUrls.includes(entry.url), `sitemap.xml: unexpected URL ${entry.url}.`);

const robots = fs.readFileSync(path.join(__dirname, 'robots.txt'), 'utf8');
check(robots === `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`, 'robots.txt: the previously valid file changed unexpectedly.');

const socialImagePath = path.join(__dirname, 'documentary411-social-card.jpg');
check(fs.existsSync(socialImagePath), 'documentary411-social-card.jpg: social image is missing.');
if (fs.existsSync(socialImagePath)) {
  const jpg = fs.readFileSync(socialImagePath);
  check(jpg[0] === 0xFF && jpg[1] === 0xD8 && jpg[2] === 0xFF, 'documentary411-social-card.jpg: file is not a valid JPEG.');
  check(jpg.length >= 20000 && jpg.length <= 160000, `documentary411-social-card.jpg: expected ~20–160KB, found ${jpg.length} bytes.`);
  let width = 0, height = 0, i = 2;
  while (i < jpg.length - 8) {
    if (jpg[i] !== 0xFF) { i += 1; continue; }
    const marker = jpg[i + 1];
    if (marker === 0xD8 || marker === 0xD9) { i += 2; continue; }
    if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
      height = jpg.readUInt16BE(i + 5);
      width = jpg.readUInt16BE(i + 7);
      break;
    }
    const len = jpg.readUInt16BE(i + 2);
    i += 2 + len;
  }
  check(width === 1200, `documentary411-social-card.jpg: expected width 1200, found ${width}.`);
  check(height === 630, `documentary411-social-card.jpg: expected height 630, found ${height}.`);
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
const festivalTotal = catalog.filter((row) => row.category === 'Documentary Festivals').length;
check(festivalTotal === 48, `resources.json: expected 48 festival records, found ${festivalTotal}.`);
check(!/window\.FESTIVALS\s*=\s*\[/.test(home), 'index.html: must not inline a second festival array that can drift from resources.json.');
check(home.includes('src="/resources-data.js"') || home.includes("src='/resources-data.js'"), 'index.html: homepage must load the unified catalog.');
check(/id="festivalStatCount">48<\/span><span class="stat-label">Verified Festivals/.test(home), 'index.html: hero must identify the verified festival total, not imply hundreds of festivals.');
check(/id="festivalFinderCount">48<\/span> Verified Documentary Festivals/.test(home), 'index.html: festival finder count is stale.');
check(/id="festivalDatabaseCount">48<\/span> verified documentary festivals/.test(home), 'index.html: festival database description count is stale.');
check(/<!-- D411 STATIC CARDS START -->/.test(fs.readFileSync(path.join(__dirname, 'directory.html'), 'utf8')), 'directory.html: static resource cards are missing.');
check(/class="d411-card"/.test(fs.readFileSync(path.join(__dirname, 'documentary-markets.html'), 'utf8')), 'documentary-markets.html: must contain real HTML cards without JS.');
check(!fs.existsSync(path.join(__dirname, 'open-now.html')), 'open-now.html: Open Now product must stay deleted.');

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
  for (const href of ['/', '/directory', '/documentary-grants']) {
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
const rewriteRoutes = new Set(pages.filter((page) => page.route !== '/').map((page) => page.route));
for (const page of pages) {
  if (rewriteRoutes.has(page.route)) {
    const matches = redirects.filter((rule) => rule.from === page.route && rule.status === 200);
    check(matches.length === 1, `netlify.toml: expected one 200 rewrite for ${page.route}, found ${matches.length}.`);
    if (matches.length) {
      check(matches[0].to === `/${page.file}`, `netlify.toml: ${page.route} must rewrite to /${page.file}.`);
    }
    continue;
  }
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
check(redirects.some((rule) => rule.from === '/open-now' && rule.to === '/directory' && rule.status === 301), 'netlify.toml: /open-now must 301 to /directory.');
check(redirects.some((rule) => rule.from === '/open-now.html' && rule.to === '/directory' && rule.status === 301), 'netlify.toml: /open-now.html must 301 to /directory.');
check(redirects.some((rule) => rule.from === '/open-now/' && rule.to === '/directory' && rule.status === 301), 'netlify.toml: /open-now/ must 301 to /directory.');
check(!fs.existsSync(path.join(__dirname, 'open-now.html')), 'open-now.html: Open Now product must stay deleted.');

const advertisePage = fs.readFileSync(path.join(__dirname, 'advertise.html'), 'utf8');
check(/\$99 <span>\/ week<\/span>/.test(advertisePage), 'advertise.html: directory listing price must stay weekly.');
check(!/\$99 <span>\/ month<\/span>/.test(advertisePage), 'advertise.html: advertise prices must not revert to monthly.');
check(/Plans start at \$99 per week/.test(shop), 'shop.html: advertise copy must stay weekly.');
check(!/Plans start at \$99 per month/.test(shop), 'shop.html: advertise copy must not revert to monthly.');
check(/weekly advertising placement request/.test(fs.readFileSync(path.join(__dirname, 'advertise-thank-you.html'), 'utf8')), 'advertise-thank-you.html: copy must stay weekly.');

const aboutHtml = fs.readFileSync(path.join(__dirname, 'about.html'), 'utf8');
check(/href=["']https:\/\/imdb\.me\/kerrydavid["']/.test(aboutHtml), 'about.html: visible IMDb link is missing.');
check(/href=["']https:\/\/www\.linkedin\.com\/in\/kerrydavid["']/.test(aboutHtml), 'about.html: visible LinkedIn link is missing.');

const gscPath = path.join(__dirname, 'google17fed7e594a2d82e.html');
check(fs.existsSync(gscPath), 'google17fed7e594a2d82e.html: Search Console verification file is missing.');
if (fs.existsSync(gscPath)) {
  check(fs.readFileSync(gscPath, 'utf8').trim() === 'google-site-verification: google17fed7e594a2d82e.html', 'google17fed7e594a2d82e.html: Search Console verification file must remain untouched.');
}

const llms = fs.existsSync(path.join(__dirname, 'llms.txt')) ? fs.readFileSync(path.join(__dirname, 'llms.txt'), 'utf8') : '';
check(Boolean(llms), 'llms.txt: missing at site root.');
check(/resources\.md/.test(llms), 'llms.txt: must point at the markdown catalog dump.');
check(fs.existsSync(path.join(__dirname, 'resources.md')), 'resources.md: markdown catalog dump is missing.');
if (fs.existsSync(path.join(__dirname, 'resources.md'))) {
  const markdown = fs.readFileSync(path.join(__dirname, 'resources.md'), 'utf8');
  check(catalog.every((row) => markdown.includes(row.name)), 'resources.md: a resources.json name is missing from the markdown dump.');
}

const resourceRewrite = redirects.filter((rule) => rule.from === '/resources/:slug' && rule.status === 200);
check(resourceRewrite.length === 1, `netlify.toml: expected one 200 rewrite for /resources/:slug, found ${resourceRewrite.length}.`);
if (resourceRewrite.length) {
  check(resourceRewrite[0].to === '/resources/:slug.html', 'netlify.toml: /resources/:slug must rewrite to /resources/:slug.html.');
  check(!resourceRewrite[0].force, 'netlify.toml: resource pretty-URL rewrite must not be a forced 301.');
}
check(!redirects.some((rule) => rule.status === 301 && /\/resources\/.+\.html/.test(rule.from)), 'netlify.toml: do not force 301 html→pretty for resource pages.');

const resourceDir = path.join(__dirname, 'resources');
check(fs.existsSync(resourceDir), 'resources/: generated resource page directory is missing.');
if (fs.existsSync(resourceDir)) {
  const resourceFiles = fs.readdirSync(resourceDir).filter((name) => name.endsWith('.html'));
  check(resourceFiles.length === catalog.length, `resources/: expected ${catalog.length} pages, found ${resourceFiles.length}.`);
  for (const row of catalog) {
    const file = path.join(resourceDir, `${row.slug}.html`);
    check(fs.existsSync(file), `resources/${row.slug}.html: missing generated page for ${row.name}.`);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const title = titleOf(html);
    const h1 = decodeEntities(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
    check(title.includes(row.name), `resources/${row.slug}.html: title must include the resource name.`);
    check(h1 === row.name, `resources/${row.slug}.html: H1 must equal the resource name.`);
    check(descriptionOf(html).length > 0, `resources/${row.slug}.html: meta description is missing.`);
    const resourceCanonicals = canonicalTags(html);
    check(resourceCanonicals.length === 1 && attributeOf(resourceCanonicals[0], 'href') === resourceCanonical(row.slug), `resources/${row.slug}.html: canonical must be the pretty resource URL.`);
    const official = String(row.officialUrl || '');
    const escapedOfficial = official.replace(/&/g, '&amp;');
    check(Boolean(official) && (html.includes(official) || html.includes(escapedOfficial)), `resources/${row.slug}.html: official URL is missing.`);
    check(html.includes('/directory'), `resources/${row.slug}.html: internal directory link is missing.`);
  }
}
check(directoryPage.includes('View listing'), 'directory.html: resource cards must link to the resource URL.');
check(home.includes('View listing'), 'index.html: homepage cards must link to the resource URL.');
check(directoryTools.includes('/resources/'), 'directory-tools.js: filtered cards must link to resource URLs.');
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
  check(!/href\s*=\s*["']\/resources\/[^"']+\.html/i.test(html), `${file}: resource listing still uses .html.`);
}

if (failures.length) {
  console.error(`\n✖ Documentary411 technical SEO verification failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):\n`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  console.error('');
  process.exit(1);
}

console.log(`Documentary411 technical SEO verification passed — ${pages.length} canonical pages, ${sitemapEntries.length} sitemap URLs, ${searchIndex.length} public search entries, complete social metadata, valid JSON-LD, exact robots.txt, and a noindex custom 404.`);
