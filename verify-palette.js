/* Documentary411 build guard: fail the build if any file reintroduces an
   old dark-theme color. The approved system (light ivory + deep teal +
   orange/amber, "Launch Documentary411 light redesign", 2026-08-11) is the
   only palette this site should ship. Do not add hex values from the list
   below anywhere in the codebase -- if you're restoring a dark theme on
   purpose, update this list deliberately instead of letting the build fail
   silently past it. */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_HEXES = [
  '#13110d', '#1a1814', '#211f1a',              // old dark backgrounds
  '#ed9527', '#f5a942',                          // old dark-theme gold/gold2
  '#e8e3d8', '#a8a090', '#6b6358',               // old dark-theme text colors
  '#1c1d1f', '#26282b', '#3a3d41',               // old styles.css charcoal
  '#f4f1ea', '#c9c6bf', '#9a978f',               // old styles.css off-white/muted
  '#e8a13d', '#c9861f',                          // old styles.css amber
];

const SCAN_EXTENSIONS = new Set(['.css', '.html', '.js']);
const SKIP = new Set(['node_modules', '.git', 'netlify', 'downloads']);

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name === 'verify-palette.js') continue;
    else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
}

const files = [];
walk(__dirname, files);

let violations = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const lower = source.toLowerCase();
  for (const hex of FORBIDDEN_HEXES) {
    if (lower.includes(hex)) {
      const line = lower.slice(0, lower.indexOf(hex)).split('\n').length;
      violations.push(`${path.relative(__dirname, file)}:${line} contains ${hex}`);
    }
  }
}

if (violations.length) {
  console.error('\n✖ Build stopped: old dark-theme color(s) found.');
  console.error('  The approved Documentary411 palette is ivory/teal/orange/amber.');
  console.error('  If this is intentional, update verify-palette.js\'s FORBIDDEN_HEXES list.\n');
  violations.forEach((v) => console.error('  - ' + v));
  console.error('');
  process.exit(1);
}

console.log('Documentary411 palette guard passed -- no dark-theme colors found.');
