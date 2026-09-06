import fs from 'node:fs';

// This file is the deploy-time record of the most recent human-reviewed audit.
// Update only after checking each controlling official source. The scheduled
// freshness workflow fails when this evidence becomes stale.
const AUDIT_DATE = '2026-09-06';

const updates = {
  'AFAC Documentary Film Program': { status: 'closed', lastVerified: AUDIT_DATE },
  'Alter-Ciné Foundation Documentary Film Grants': { status: 'closed', lastVerified: AUDIT_DATE },
  'Bertha Film Fund': {
    status: 'closed',
    lastVerified: AUDIT_DATE,
    deadlineMonth: 'No public application — unsolicited proposals are not accepted',
    access: 'No public application · invitation / relationship based',
    notes: 'Bertha Foundation states that it does not accept unsolicited proposals. Documentary411 does not label this fund as publicly open.'
  },
  'Black Public Media Open Call': { status: 'open', lastVerified: AUDIT_DATE },
  'CAAM Building Bridges Documentary Fund': { status: 'closed', lastVerified: AUDIT_DATE },
  'Catapult Film Fund': { status: 'closed', lastVerified: AUDIT_DATE },
  'Chicken & Egg Pictures': { status: 'closed', lastVerified: AUDIT_DATE },
  'Ellis-Beauregard Foundation': { status: 'closed', lastVerified: AUDIT_DATE },
  'Ford Foundation JustFilms': { status: 'closed', lastVerified: AUDIT_DATE },
  'Impact Partners': { status: 'upcoming', lastVerified: AUDIT_DATE },
  'Perspective Fund': { status: 'rolling', lastVerified: AUDIT_DATE },
  'Southern Documentary Fund Production Grant': { status: 'closed', lastVerified: AUDIT_DATE },
  'Sundance Institute Documentary Fund': { status: 'closed', lastVerified: AUDIT_DATE },
  'Vision Maker Media Biomimicry and Indigenous Knowledge Fund': { status: 'open', lastVerified: AUDIT_DATE },
  'ITVS Open Call': { status: 'closed', lastVerified: AUDIT_DATE },
  'IDA Grants Directory': { status: 'active', lastVerified: AUDIT_DATE },
  'Working Films': { status: 'open', lastVerified: AUDIT_DATE }
};

const resources = JSON.parse(fs.readFileSync('resources.json', 'utf8'));
const found = new Set();
for (const resource of resources) {
  const update = updates[resource.name];
  if (!update) continue;
  Object.assign(resource, update);
  found.add(resource.name);
}

const missing = Object.keys(updates).filter((name) => !found.has(name));
if (missing.length) {
  console.error(`Funding audit could not find: ${missing.join(', ')}`);
  process.exit(1);
}

fs.writeFileSync('resources.json', `${JSON.stringify(resources, null, 2)}\n`);
console.log(`Applied ${AUDIT_DATE} official-source audit to ${found.size} funding records.`);
