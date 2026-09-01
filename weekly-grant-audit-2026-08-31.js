const fs = require('fs');
const path = require('path');

const ISO = '2026-08-31';

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

function updateResourceJson(){
  const file = path.join(__dirname,'resources.json');
  if(!fs.existsSync(file)) return;
  const resources = JSON.parse(fs.readFileSync(file,'utf8'));
  for (const row of resources) {
    if (audited.includes(row.name)) row.lastVerified = ISO;
  }
  fs.writeFileSync(file, JSON.stringify(resources, null, 2) + '\n');
}

function enforceOpenNow(){
  const file = path.join(__dirname,'directory-tools.js');
  if(!fs.existsSync(file)) return;
  let source = fs.readFileSync(file,'utf8');
  source = source.replace(/if\(config\.openish\) base = base\.filter\([^;]+\);/,"if(config.openish) base = base.filter(r=>r.status === 'open' || r.status === 'rolling');");
  fs.writeFileSync(file,source);
}

updateResourceJson();
enforceOpenNow();
console.log('Weekly grant audit refreshed for 2026-08-31 (resources.json only; homepage cards come from build-resources.js)');
