import fs from 'node:fs';

const resources = JSON.parse(fs.readFileSync('resources.json', 'utf8'));
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const funding = resources.filter((resource) =>
  resource.category === 'Documentary & Film Funds / Grants' ||
  ['grants-open', 'grants-closed'].includes(resource.homepage?.section)
);
const problems = [];

for (const resource of funding) {
  if (!resource.lastVerified) {
    problems.push(`${resource.name}: missing lastVerified`);
    continue;
  }
  const verified = new Date(`${resource.lastVerified}T00:00:00Z`);
  const age = Math.floor((today - verified) / 86400000);
  if (age > 8) problems.push(`${resource.name}: last verified ${age} days ago (${resource.lastVerified})`);
  if (resource.status === 'open' && age > 3) {
    problems.push(`${resource.name}: open status must be rechecked every 3 days`);
  }
}

if (problems.length) {
  console.error(['Funding-data freshness audit failed:', ...problems.map((p) => `- ${p}`)].join('\n'));
  process.exit(1);
}

console.log(`Funding-data freshness audit passed for ${funding.length} funding resources.`);
