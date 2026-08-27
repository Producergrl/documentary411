/* Documentary411 technical SEO build step.
   Adds only metadata that is absent in source, normalizes links to the
   established extensionless public URLs, and keeps noindex pages out of the
   generated site-search index. */

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
const SOCIAL_IMAGE_ALT = 'Documentary411 — Funding. Festivals. Tools. Community.';
const SEO_START = '<!-- D411 TECHNICAL SEO START -->';
const SEO_END = '<!-- D411 TECHNICAL SEO END -->';

const pages = [
  { file: 'index.html', route: '/', schemaType: 'WebPage' },
  { file: 'directory.html', route: '/directory', schemaType: 'CollectionPage' },
  { file: 'open-now.html', route: '/open-now', schemaType: 'CollectionPage' },
  { file: 'documentary-grants.html', route: '/documentary-grants', schemaType: 'CollectionPage' },
  { file: 'documentary-markets.html', route: '/documentary-markets', schemaType: 'CollectionPage' },
  { file: 'fiscal-sponsorship.html', route: '/fiscal-sponsorship', schemaType: 'CollectionPage' },
  { file: 'submit-resource.html', route: '/submit-resource', schemaType: 'WebPage' },
  { file: 'blog.html', route: '/blog', schemaType: 'CollectionPage' },
  { file: 'blog-festival-wins.html', route: '/blog-festival-wins', schemaType: 'WebPage' },
  { file: 'festival-budget-workbook.html', route: '/festival-budget-workbook', schemaType: 'WebPage' },
  { file: 'festival-strategy.html', route: '/festival-strategy', schemaType: 'WebPage' },
  { file: 'funding-lab.html', route: '/funding-lab', schemaType: 'WebPage' },
  { file: 'funding-sprint.html', route: '/funding-sprint', schemaType: 'WebPage' },
  { file: 'funding-report.html', route: '/funding-report', schemaType: 'WebPage' },
  { file: 'ask-a-pro.html', route: '/ask-a-pro', schemaType: 'WebPage' },
  { file: 'advertise.html', route: '/advertise', schemaType: 'WebPage' },
];

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

function titleOf(html) {
  return decodeEntities(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
}

function metaOf(html, attribute, value) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (attributeOf(tag, attribute).toLowerCase() === value.toLowerCase()) {
      return attributeOf(tag, 'content');
    }
  }
  return '';
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function pageSchema(page, canonical, title, description) {
  const pageNode = {
    '@type': page.schemaType,
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
  };

  if (page.route !== '/') {
    return { '@context': 'https://schema.org', ...pageNode };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${ORIGIN}/#organization`,
        name: 'Documentary411',
        url: `${ORIGIN}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${ORIGIN}/apple-touch-icon.png`,
          width: 180,
          height: 180,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${ORIGIN}/#website`,
        url: `${ORIGIN}/`,
        name: 'Documentary411',
        publisher: { '@id': `${ORIGIN}/#organization` },
        inLanguage: 'en-US',
      },
      pageNode,
    ],
  };
}

function metadataBlock(page, title, description) {
  const canonical = `${ORIGIN}${page.route}`;
  const titleAttr = escapeAttribute(title);
  const descriptionAttr = escapeAttribute(description);
  const canonicalAttr = escapeAttribute(canonical);
  const imageAttr = escapeAttribute(SOCIAL_IMAGE);
  const imageAltAttr = escapeAttribute(SOCIAL_IMAGE_ALT);
  const schema = pageSchema(page, canonical, title, description);

  return `${SEO_START}
  <link rel="canonical" href="${canonicalAttr}">
  <meta property="og:title" content="${titleAttr}">
  <meta property="og:description" content="${descriptionAttr}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalAttr}">
  <meta property="og:site_name" content="Documentary411">
  <meta property="og:locale" content="en_US">
  <meta property="og:image" content="${imageAttr}">
  <meta property="og:image:secure_url" content="${imageAttr}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${imageAltAttr}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${titleAttr}">
  <meta name="twitter:description" content="${descriptionAttr}">
  <meta name="twitter:image" content="${imageAttr}">
  <meta name="twitter:image:alt" content="${imageAltAttr}">
  <script type="application/ld+json">${safeJson(schema)}</script>
${SEO_END}`;
}

function removeGeneratedSeo(html) {
  const marker = new RegExp(`${SEO_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${SEO_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g');
  return html.replace(marker, '');
}

function assertMetadataAbsent(html, file) {
  if (/<link\b[^>]*\brel\s*=\s*["']canonical["']/i.test(html)) {
    throw new Error(`${file} already has a canonical outside the generated SEO block; review it before building.`);
  }
  if (/<meta\b[^>]*(?:\bproperty|\bname)\s*=\s*["'](?:og:|twitter:)/i.test(html)) {
    throw new Error(`${file} already has social metadata outside the generated SEO block; review it before building.`);
  }
}

function injectPageMetadata(page) {
  const filePath = path.join(__dirname, page.file);
  let html = removeGeneratedSeo(fs.readFileSync(filePath, 'utf8'));
  assertMetadataAbsent(html, page.file);

  const title = titleOf(html);
  const description = metaOf(html, 'name', 'description');
  if (!title || !description) {
    throw new Error(`${page.file} must retain a non-empty title and meta description before SEO metadata can be generated.`);
  }
  if (!/<\/head>/i.test(html)) throw new Error(`${page.file} is missing </head>.`);

  html = html.replace(/<\/head>/i, `${metadataBlock(page, title, description)}\n</head>`);
  fs.writeFileSync(filePath, html);
}

const canonicalSlugs = pages.filter((page) => page.route !== '/').map((page) => page.route.slice(1));
const slugPattern = canonicalSlugs.map((slug) => slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const htmlHrefPattern = new RegExp(`(\\bhref\\s*=\\s*["'])\\/(${slugPattern})\\.html(?=([?#]|["']))`, 'gi');
const indexHrefPattern = /(\bhref\s*=\s*["'])\/index\.html(?=([?#]|["']))/gi;

function normalizeAnchorLinks() {
  let changed = 0;
  const htmlFiles = fs.readdirSync(__dirname).filter((file) => file.endsWith('.html') && !file.startsWith('google'));
  for (const file of htmlFiles) {
    const filePath = path.join(__dirname, file);
    const source = fs.readFileSync(filePath, 'utf8');
    const normalized = source.replace(/<a\b[^>]*>/gi, (tag) => tag
      .replace(htmlHrefPattern, (_match, prefix, slug) => {
        changed += 1;
        return `${prefix}/${slug}`;
      })
      .replace(indexHrefPattern, (_match, prefix) => {
        changed += 1;
        return `${prefix}/`;
      }));
    if (normalized !== source) fs.writeFileSync(filePath, normalized);
  }
  return changed;
}

function robotsMetaOf(html) {
  return metaOf(html, 'name', 'robots').toLowerCase();
}

function updateSearchIndex() {
  const filePath = path.join(__dirname, 'search-index.json');
  if (!fs.existsSync(filePath)) return { removed: 0, normalized: 0 };

  const noindexPaths = new Set();
  for (const file of fs.readdirSync(__dirname).filter((name) => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
    if (!robotsMetaOf(html).includes('noindex')) continue;
    const stem = file.replace(/\.html$/i, '');
    noindexPaths.add(`/${file}`);
    noindexPaths.add(`/${stem}`);
  }

  const entries = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let removed = 0;
  let normalized = 0;
  const updated = [];

  for (const entry of entries) {
    const parsed = new URL(entry.url, ORIGIN);
    if (noindexPaths.has(parsed.pathname)) {
      removed += 1;
      continue;
    }

    const slugMatch = parsed.pathname.match(/^\/([^/]+)\.html$/i);
    if (slugMatch && canonicalSlugs.includes(slugMatch[1])) {
      parsed.pathname = `/${slugMatch[1]}`;
      entry.url = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      normalized += 1;
    } else if (parsed.pathname === '/index.html') {
      parsed.pathname = '/';
      entry.url = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      normalized += 1;
    }
    updated.push(entry);
  }

  fs.writeFileSync(filePath, JSON.stringify(updated));
  return { removed, normalized };
}

for (const page of pages) injectPageMetadata(page);
const normalizedLinks = normalizeAnchorLinks();
const searchIndex = updateSearchIndex();

console.log(`Documentary411 technical SEO applied to ${pages.length} canonical pages; normalized ${normalizedLinks} anchor links; removed ${searchIndex.removed} noindex search entr${searchIndex.removed === 1 ? 'y' : 'ies'} and normalized ${searchIndex.normalized} search URLs.`);
