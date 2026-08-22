const fs = require('fs');
const path = require('path');

const root = __dirname;
const crewLinkRe = /\s*<a\b[^>]*href=["']\/crew-jobs(?:\.html)?["'][^>]*>[\s\S]*?<\/a>/gi;

for (const fileName of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const filePath = path.join(root, fileName);
  let html = fs.readFileSync(filePath, 'utf8');
  const cleaned = html.replace(crewLinkRe, '');
  if (cleaned !== html) fs.writeFileSync(filePath, cleaned);
}

const searchIndex = path.join(root, 'search-index.json');
if (fs.existsSync(searchIndex)) {
  let text = fs.readFileSync(searchIndex, 'utf8');
  text = text.replace(/Crew & Jobs/g, '').replace(/\/crew-jobs(?:\.html)?/g, '/directory.html');
  fs.writeFileSync(searchIndex, text);
}

console.log('Crew & Jobs links removed from generated site output.');
