import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'audit-results') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

const decode = (text) => text
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&rarr;|&rightarrow;/g, '→').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
  .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] || '';

const pages = htmlFiles.sort().map((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const links = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map((match) => ({
    text: decode(match[0]), href: attr(match[0].match(/<a\b[^>]*>/i)?.[0] || '', 'href')
  })).filter((link) => link.href);
  const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/gi)].map((match) => ({
    text: decode(match[0]), type: attr(match[0].match(/<button\b[^>]*>/i)?.[0] || '', 'type') || 'submit'
  }));
  const forms = [...html.matchAll(/<form\b[\s\S]*?<\/form>/gi)].map((match) => {
    const open = match[0].match(/<form\b[^>]*>/i)?.[0] || '';
    const fields = [...match[0].matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)].map((field) => ({
      name: attr(field[0], 'name'), type: attr(field[0], 'type') || field[0].match(/^<(\w+)/i)?.[1]?.toLowerCase(), required: /\brequired\b/i.test(field[0])
    })).filter((field) => field.name && field.type !== 'hidden');
    return { name: attr(open, 'name'), method: attr(open, 'method') || 'GET', action: attr(open, 'action') || '(scripted/current page)', netlify: /data-netlify|\bnetlify\b/i.test(open), fields };
  });
  const contentStatements = [...html.matchAll(/<(?:h1|h2|h3|p|li|summary)\b[^>]*>[\s\S]*?<\/(?:h1|h2|h3|p|li|summary)>/gi)]
    .map((match) => decode(match[0])).filter(Boolean);
  return {
    file: rel,
    title: decode(html.match(/<title[^>]*>[\s\S]*?<\/title>/i)?.[0] || ''),
    canonical: attr(html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || '', 'href'),
    robots: attr(html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)?.[0] || '', 'content'),
    links, buttons, forms, contentStatements
  };
});

const resources = JSON.parse(fs.readFileSync('resources.json', 'utf8')).map((resource) => ({
  name: resource.name, slug: resource.slug, resourceType: resource.resourceType, category: resource.category,
  status: resource.status, lastVerified: resource.lastVerified || null, officialUrl: resource.officialUrl,
  description: resource.description, bestFor: resource.bestFor, deadline: resource.deadlineMonth,
  cost: resource.cost, access: resource.access, notes: resource.notes
}));

const inventory = {
  generatedAt: new Date().toISOString(),
  totals: {
    pages: pages.length,
    links: pages.reduce((sum, page) => sum + page.links.length, 0),
    buttons: pages.reduce((sum, page) => sum + page.buttons.length, 0),
    forms: pages.reduce((sum, page) => sum + page.forms.length, 0),
    resources: resources.length
  },
  interactiveFeatures: [
    'Global search dialog and search index', 'Festival finder with keyword, region, genre, audience, fee and qualification filters',
    'Location-based nearest-festival search', 'Festival cost calculator with client-side PDF generation',
    'Newsletter signup', 'Festival Budget Workbook signup and download', 'Funding Reality Report signup and download',
    'Resource submission and correction forms', 'Advertising request and price estimator',
    'Ask a Pro question intake', 'Professional Consult intake', 'Funding Package Sprint Tally application and buyer intake'
  ],
  pages,
  resources
};

fs.mkdirSync('audit-results', { recursive: true });
fs.writeFileSync('audit-results/site-inventory.json', `${JSON.stringify(inventory, null, 2)}\n`);
console.log(JSON.stringify(inventory.totals));
