import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
const seen = new Map();

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of html.matchAll(/<(?:a|iframe)\b[^>]*(?:href|src)=["'](https?:\/\/[^"']+)["']/gi)) {
    const url = match[1].replaceAll('&amp;', '&');
    if (!seen.has(url)) seen.set(url, []);
    seen.get(url).push(file);
  }
}

const urls = [...seen.keys()];
const results = [];
let cursor = 0;

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 Documentary411 launch link audit' }
    });
    return { url, status: response.status, finalUrl: response.url, ok: response.status >= 200 && response.status < 400 };
  } catch (error) {
    return { url, status: 0, finalUrl: '', ok: false, error: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function worker() {
  while (cursor < urls.length) {
    const index = cursor++;
    results[index] = await check(urls[index]);
  }
}

await Promise.all(Array.from({ length: 12 }, worker));
const withPages = (result) => ({
  ...result,
  pages: [...new Set(seen.get(result.url))]
});
const broken = results.filter((result) => [404, 410].includes(result.status)).map(withPages);
const inconclusive = results.filter((result) => !result.ok && ![404, 410].includes(result.status)).map(withPages);
const report = {
  checkedAt: new Date().toISOString(),
  uniqueExternalLinks: urls.length,
  passed: results.filter((result) => result.ok).length,
  broken,
  inconclusive
};
fs.mkdirSync('audit-results', { recursive: true });
fs.writeFileSync('audit-results/external-links.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (broken.length) process.exitCode = 1;
