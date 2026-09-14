import fs from 'node:fs';

// This file is the deploy-time record of the most recent human-reviewed audit.
// Update only after checking each controlling official source. The scheduled
// freshness workflow fails when this evidence becomes stale.
const AUDIT_DATE = '2026-09-14';

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
  'Black Public Media Open Call': {
    status: 'open',
    lastVerified: AUDIT_DATE,
    deadlineMonth: 'Open — deadline October 1, 2026 at 11:59 p.m. PT',
    access: 'Open · closes October 1 at 11:59 p.m. PT · public-media licensing agreement',
    homepage: {
      badge: 'Open · Oct 1, 2026',
      badgeClass: 'badge-open',
      meta: 'Public media funding · United States · Deadline October 1, 2026 at 11:59 p.m. PT',
      description: 'Selects feature-length nonfiction projects for talent development and a chance to compete for production funding at PitchBLACK. The 2026 submission portal is open through October 1 at 11:59 p.m. PT.',
      section: 'grants-open'
    }
  },
  'CAAM Building Bridges Documentary Fund': { status: 'closed', lastVerified: AUDIT_DATE },
  'Catapult Film Fund': { status: 'closed', lastVerified: AUDIT_DATE },
  'Chicken & Egg Pictures': { status: 'closed', lastVerified: AUDIT_DATE },
  'Ellis-Beauregard Foundation': { status: 'closed', lastVerified: AUDIT_DATE },
  'Ford Foundation JustFilms': { status: 'closed', lastVerified: AUDIT_DATE },
  'Impact Partners': {
    status: 'upcoming',
    lastVerified: AUDIT_DATE,
    deadlineMonth: 'Reopens September 21, 2026',
    access: 'Upcoming · LOI submissions reopen September 21, 2026'
  },
  'Perspective Fund': {
    status: 'rolling',
    lastVerified: AUDIT_DATE,
    deadlineMonth: 'Rolling — no submission deadline',
    access: 'Rolling · Letter of Inquiry reviewed on an ongoing basis'
  },
  'Southern Documentary Fund Production Grant': { status: 'closed', lastVerified: AUDIT_DATE },
  'Sundance Institute Documentary Fund': { status: 'closed', lastVerified: AUDIT_DATE },
  'Vision Maker Media Biomimicry and Indigenous Knowledge Fund': {
    status: 'open',
    lastVerified: AUDIT_DATE,
    deadlineMonth: 'Open — deadline September 30, 2026'
  },
  'ITVS Open Call': { status: 'closed', lastVerified: AUDIT_DATE },
  'IDA Grants Directory': { status: 'active', lastVerified: AUDIT_DATE },
  'Working Films': {
    status: 'closed',
    lastVerified: AUDIT_DATE,
    deadlineMonth: 'Closed — deadline was September 11, 2026 at 11:59 p.m. ET',
    access: 'Closed · $10,000–$20,000 · 2026 application deadline passed',
    notes: 'Impact Kickstart applications closed September 11, 2026 at 11:59 p.m. ET. The program supports impact campaigns for underrepresented filmmakers with $10,000–$20,000 plus mentorship.',
    homepage: {
      badge: 'Closed',
      badgeClass: 'badge-listing',
      meta: 'Grant / cohort · Impact · 2026 deadline September 11 at 11:59 p.m. ET',
      description: 'Impact Kickstart supports impact campaigns for underrepresented filmmakers with $10,000–$20,000 plus mentorship. The 2026 application window closed September 11 at 11:59 p.m. ET.',
      section: 'grants-closed'
    }
  }
};

const resources = JSON.parse(fs.readFileSync('resources.json', 'utf8'));
const found = new Set();
for (const resource of resources) {
  const update = updates[resource.name];
  if (!update) continue;

  const { homepage, ...topLevel } = update;
  Object.assign(resource, topLevel);
  if (homepage) resource.homepage = { ...(resource.homepage || {}), ...homepage };
  found.add(resource.name);
}

const missing = Object.keys(updates).filter((name) => !found.has(name));
if (missing.length) {
  console.error(`Funding audit could not find: ${missing.join(', ')}`);
  process.exit(1);
}

fs.writeFileSync('resources.json', `${JSON.stringify(resources, null, 2)}\n`);
console.log(`Applied ${AUDIT_DATE} official-source audit to ${found.size} funding records.`);
