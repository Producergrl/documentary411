const fs = require('fs');
const path = require('path');

const ISO = '2026-08-31';
const TEXT = 'August 31, 2026';

function replaceAll(source, pairs){
  for (const [from,to] of pairs) source = source.split(from).join(to);
  return source;
}

function updateHomepage(){
  const file = path.join(__dirname,'index.html');
  if(!fs.existsSync(file)) return;
  let html = fs.readFileSync(file,'utf8');
  html = html.replace(/Last verified (?:August|Aug\.) 24, 2026/g, `Last verified ${TEXT}`);
  html = html.replace(/Last verified (?:August|Aug\.) 19, 2026/g, `Last verified ${TEXT}`);
  html = html.replace(/Last verified (?:August|Aug\.) 18, 2026/g, `Last verified ${TEXT}`);
  fs.writeFileSync(file,html);
}

function updateResourceData(){
  const file = path.join(__dirname,'resources-data.js');
  if(!fs.existsSync(file)) return;
  let source = fs.readFileSync(file,'utf8');
  const audited = [
    'Sundance Institute Documentary Fund',
    'IDA Grants Directory',
    'ITVS Open Call',
    'Catapult Film Fund',
    'Chicken & Egg Pictures',
    'Ford Foundation JustFilms',
    'Women Make Movies Fiscal Sponsorship',
    'International Documentary Association Fiscal Sponsorship'
  ];
  for(const name of audited){
    const marker = `name:'${name}'`;
    const idx = source.indexOf(marker);
    if(idx === -1) continue;
    const start = source.lastIndexOf('  {',idx);
    const close = source.indexOf('\n  },',idx);
    if(start === -1 || close === -1) continue;
    const end = close + '\n  },'.length;
    let entry = source.slice(start,end);
    entry = entry.replace(/lastVerified:'\d{4}-\d{2}-\d{2}'/,`lastVerified:'${ISO}'`);
    source = source.slice(0,start)+entry+source.slice(end);
  }
  fs.writeFileSync(file,source);
}

function enforceOpenNow(){
  const file = path.join(__dirname,'directory-tools.js');
  if(!fs.existsSync(file)) return;
  let source = fs.readFileSync(file,'utf8');
  source = source.replace(/if\(config\.openish\) base = base\.filter\([^;]+\);/,"if(config.openish) base = base.filter(r=>r.status === 'open' || r.status === 'rolling');");
  fs.writeFileSync(file,source);
}

updateHomepage();
updateResourceData();
enforceOpenNow();
console.log('Weekly grant audit refreshed for 2026-08-31');
