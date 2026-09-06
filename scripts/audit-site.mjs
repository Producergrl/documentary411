import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const warnings = [];
const inventory = { pages: 0, links: 0, forms: 0, resources: 0 };

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules') return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const allFiles = walk(root);
const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
const rootHtml = new Map(
  htmlFiles.map((file) => [path.relative(root, file).replaceAll(path.sep, '/'), file])
);
const routeRewrites = new Map();
const netlifyPath = path.join(root, 'netlify.toml');
if (fs.existsSync(netlifyPath)) {
  const netlify = fs.readFileSync(netlifyPath, 'utf8');
  for (const block of netlify.matchAll(/\[\[redirects\]\]([\s\S]*?)(?=\n\[\[redirects\]\]|$)/g)) {
    const from = block[1].match(/\bfrom\s*=\s*["']([^"']+)["']/)?.[1];
    const to = block[1].match(/\bto\s*=\s*["']([^"']+)["']/)?.[1];
    const status = block[1].match(/\bstatus\s*=\s*(\d+)/)?.[1];
    if (from && to && status === '200') routeRewrites.set(from, to);
  }
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match?.[1] ?? null;
}

function targetFor(urlPath) {
  let clean = urlPath.split('?')[0].split('#')[0];
  clean = routeRewrites.get(clean) || clean;
  try { clean = decodeURIComponent(clean); } catch {}
  clean = clean.replace(/^\/+/, '');
  if (!clean) return rootHtml.get('index.html');
  const candidates = [clean, `${clean}.html`, `${clean}/index.html`];
  for (const candidate of candidates) {
    if (rootHtml.has(candidate)) return rootHtml.get(candidate);
    const diskPath = path.join(root, candidate);
    if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) return diskPath;
  }
  return null;
}

for (const file of htmlFiles) {
  inventory.pages += 1;
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const html = fs.readFileSync(file, 'utf8');
  const ids = [...html.matchAll(/(?:^|\s)id\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) failures.push(`${rel}: duplicate id(s): ${[...new Set(duplicates)].join(', ')}`);

  if (/\$\s*1(?:\.00)?(?=\s|<|$)/im.test(html) || /\b(?:test offer|test price|\$1 trial)\b/i.test(html)) {
    failures.push(`${rel}: contains a $1/test-offer reference`);
  }
  if (/\bOpen Now\b/i.test(html)) failures.push(`${rel}: still presents the removed Open Now feature`);
  if (/href\s*=\s*["']\s*#["']/i.test(html)) failures.push(`${rel}: contains an empty hash link`);

  const tags = [...html.matchAll(/<(a|link|script|img|iframe)\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of tags) {
    const kind = tag.match(/^<(\w+)/i)?.[1]?.toLowerCase();
    const raw = kind === 'a' || kind === 'link' ? attr(tag, 'href') : attr(tag, 'src');
    if (!raw || /^(?:mailto:|tel:|javascript:|data:)/i.test(raw)) continue;
    inventory.links += 1;
    if (/^https?:\/\//i.test(raw) || raw.startsWith('//')) continue;
    const resolved = raw.startsWith('#')
      ? `/${rel}`
      : raw.startsWith('/')
      ? raw
      : `/${path.posix.normalize(path.posix.join(path.posix.dirname(`/${rel}`), raw))}`;
    const target = targetFor(resolved);
    if (!target) failures.push(`${rel}: missing internal ${kind} target ${raw}`);
    const fragment = raw.includes('#') ? raw.slice(raw.indexOf('#') + 1).split('?')[0] : '';
    if (target && fragment) {
      const targetHtml = fs.readFileSync(target, 'utf8');
      const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`\\bid\\s*=\\s*["']${escaped}["']`, 'i').test(targetHtml)) {
        failures.push(`${rel}: missing fragment #${fragment} in ${raw.split('#')[0] || rel}`);
      }
    }
  }

  for (const form of html.matchAll(/<form\b[\s\S]*?<\/form>/gi)) {
    inventory.forms += 1;
    const open = form[0].match(/<form\b[^>]*>/i)?.[0] || '';
    const action = attr(open, 'action');
    if (action && action.startsWith('/') && !targetFor(action)) {
      failures.push(`${rel}: form action target does not exist: ${action}`);
    }
    if (/data-netlify\s*=\s*["']true["']/i.test(open) && !/name\s*=\s*["'][^"']+["']/i.test(open)) {
      failures.push(`${rel}: Netlify form has no name`);
    }
  }
}

const resourcesPath = path.join(root, 'resources.json');
if (fs.existsSync(resourcesPath)) {
  const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
  inventory.resources = resources.length;
  const names = new Set();
  const slugs = new Set();
  for (const resource of resources) {
    if (!resource.name || !resource.officialUrl) {
      failures.push(`resources.json: incomplete resource ${resource.name || '(unnamed)'}`);
    }
    if (names.has(resource.name)) failures.push(`resources.json: duplicate name ${resource.name}`);
    if (resource.slug && slugs.has(resource.slug)) failures.push(`resources.json: duplicate slug ${resource.slug}`);
    names.add(resource.name);
    if (resource.slug) slugs.add(resource.slug);
    if (resource.lastVerified && !/^\d{4}-\d{2}-\d{2}$/.test(resource.lastVerified)) {
      failures.push(`resources.json: invalid lastVerified for ${resource.name}`);
    }
  }
}

const requiredProducts = [
  ['festival-strategy.html', '90 Day Film Festival Strategy', '$99'],
  ['funding-lab.html', 'Brand-Funded Documentary', '$297'],
  ['funding-sprint.html', 'The Funding Package Sprint', '$2,500'],
  ['ask-a-pro.html', 'Ask A Pro', '$50'],
  ['ask-a-pro.html', 'Professional Consult', '$500'],
];
for (const [file, name, price] of requiredProducts) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (!html.includes(name)) failures.push(`${file}: missing product name ${name}`);
  if (!html.includes(price)) failures.push(`${file}: missing product price ${price}`);
}

const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (/Updated<\/span><span class="stat-label">Weekly/i.test(homepage) || /updated weekly by Documentary411/i.test(homepage)) {
  failures.push('index.html: claims Documentary411 is updated weekly');
}

console.log(JSON.stringify({ inventory, failures, warnings }, null, 2));
if (failures.length) process.exitCode = 1;
