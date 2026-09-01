/* Shared pretty-URL helpers for Documentary411 resource pages.
   Slugs are derived from existing resource names only — never stored in resources.json. */

const ORIGIN = 'https://documentary411.com';

function slugifyName(name) {
  return String(name || 'resource')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'resource';
}

function assignSlugs(records) {
  const used = new Set();
  return records.map((row) => {
    let base = slugifyName(row.name);
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    return { ...row, slug };
  });
}

function resourcePath(slug) {
  return `/resources/${slug}`;
}

function resourceCanonical(slug) {
  return `${ORIGIN}${resourcePath(slug)}`;
}

const CANONICAL_SITEMAP = [
  { loc: `${ORIGIN}/`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/directory`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/documentary-grants`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/documentary-markets`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/fiscal-sponsorship`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/submit-resource`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/blog`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/blog/deauville`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/festival-budget-workbook`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/festival-strategy`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/funding-lab`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/funding-sprint`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/funding-report`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/ask-a-pro`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/advertise`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/shop`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/about`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/privacy`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/terms`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/contact`, lastmod: '2026-09-01' },
  { loc: `${ORIGIN}/affiliate-disclosure`, lastmod: '2026-09-01' },
];

const CATEGORY_LANDING = {
  'Documentary & Film Funds / Grants': '/documentary-grants',
  'Documentary Festivals': '/#festivals',
  'Documentary Markets': '/documentary-markets',
  'Fiscal Sponsorship': '/fiscal-sponsorship',
};

module.exports = {
  ORIGIN,
  slugifyName,
  assignSlugs,
  resourcePath,
  resourceCanonical,
  CANONICAL_SITEMAP,
  CATEGORY_LANDING,
};
