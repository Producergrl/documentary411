const fs = require('fs');
const path = require('path');
const vm = require('vm');

const AUDIT_DATE_TEXT = 'August 24, 2026';
const AUDIT_DATE_ISO = '2026-08-24';

function updateGrantCard(html, title, updates) {
  const titleMarker = `<div class="card-title">${title}</div>`;
  const titleIndex = html.indexOf(titleMarker);
  if (titleIndex === -1) return html;

  const cardStart = html.lastIndexOf('<div class="card">', titleIndex);
  if (cardStart === -1) return html;

  const linkEnd = html.indexOf('</a>', titleIndex);
  if (linkEnd === -1) return html;
  const cardEnd = html.indexOf('</div>', linkEnd);
  if (cardEnd === -1) return html;

  const end = cardEnd + '</div>'.length;
  let card = html.slice(cardStart, end);

  if (updates.newTitle) {
    card = card.replace(titleMarker, `<div class="card-title">${updates.newTitle}</div>`);
  }

  if (updates.badge) {
    card = card.replace(/<span class="card-badge [^"]+">[\s\S]*?<\/span>/, `<span class="card-badge ${updates.badgeClass || 'badge-listing'}">${updates.badge}</span>`);
  }

  if (updates.meta) {
    card = card.replace(/<div class="card-meta">[\s\S]*?<\/div>/, `<div class="card-meta">${updates.meta} · Last verified ${AUDIT_DATE_TEXT}</div>`);
  } else {
    card = card.replace(/<div class="card-meta">([\s\S]*?)<\/div>/, (m, inner) => {
      const clean = inner.replace(/\s*·\s*Last verified[^<]*/i, '');
      return `<div class="card-meta">${clean} · Last verified ${AUDIT_DATE_TEXT}</div>`;
    });
  }

  if (updates.description) {
    card = card.replace(/<div class="card-desc">[\s\S]*?<\/div>/, `<div class="card-desc">${updates.description}</div>`);
  }

  if (updates.tags) {
    card = card.replace(/<div class="card-tags">[\s\S]*?<\/div>/, `<div class="card-tags">${updates.tags}</div>`);
  }

  return html.slice(0, cardStart) + card + html.slice(end);
}

function closeExpiredOpenBadges(html) {
  const months = {
    january:0,february:1,march:2,april:3,may:4,june:5,
    july:6,august:7,september:8,october:9,november:10,december:11
  };
  const today = new Date();
  today.setHours(0,0,0,0);

  return html.replace(/<div class="card">[\s\S]*?<\/a>\s*<\/div>/g, (card) => {
    if (!/card-badge badge-open">Open Now/i.test(card)) return card;
    const match = card.match(/Deadline\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(20\d{2})/i);
    if (!match) return card;
    const deadline = new Date(Number(match[3]), months[match[1].toLowerCase()], Number(match[2]));
    deadline.setHours(23,59,59,999);
    if (deadline >= today) return card;
    return card.replace('<span class="card-badge badge-open">Open Now</span>', '<span class="card-badge badge-listing">Closed</span>');
  });
}

function addSemanticDates(html) {
  const monthNumbers = {
    January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',
    July:'07',August:'08',September:'09',October:'10',November:'11',December:'12'
  };
  const scriptBoundary = html.indexOf('<script src="https://cdnjs.cloudflare.com');
  const contentEnd = scriptBoundary === -1 ? html.length : scriptBoundary;
  const visibleHtml = html.slice(0, contentEnd);
  const scripts = html.slice(contentEnd).replace(/<time\b[^>]*>([^<]*)<\/time>/gi, '$1');
  const semanticHtml = visibleHtml.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\b/g, (match, month, day, year, offset, source) => {
    const before = source.slice(Math.max(0, offset - 80), offset);
    if (/<time\b[^>]*>[^<]*$/i.test(before)) return match;
    return `<time datetime="${year}-${monthNumbers[month]}-${String(day).padStart(2, '0')}">${match}</time>`;
  });
  return semanticHtml + scripts;
}

function fixHomepage() {
  const file = path.join(__dirname, 'index.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');

  html = html.replace(
    /Verified documentary funding programs with current application status[^<]*/,
    'Verified documentary funding programs with current application status — including open, closed, rolling, and upcoming cycles.'
  );
  html = html.replace(
    'Active, verified funding opportunities for documentaries — from early development through post-production and impact release.',
    'Verified documentary funding programs with current application status — including open, closed, rolling, and upcoming cycles.'
  );

  const updates = [
    {
      title: 'Sundance Documentary Fund',
      badge: 'Closed · Next Call 2027',
      meta: 'Grant · Development, Production, Post · International · Deadline June 15, 2026',
      description: 'The Sundance Institute Documentary Fund is not currently accepting applications. The 2026 call closed June 15, 2026, and Sundance says the next open call will be announced in early 2027.'
    },
    {
      title: 'IDA Documentary Fund',
      newTitle: 'IDA Grants & Funding Programs',
      badge: 'Limited / Between Cycles',
      meta: 'Funding programs · International · Pare Lorentz expected to reopen late 2026',
      description: 'IDA says its Artist Services team is currently focused on Emergency Assistance. The Pare Lorentz Documentary Fund is expected to reopen in late 2026 with a new theme. IDA’s separate Grants Directory continues to list active third-party opportunities.'
    },
    {
      title: 'IDA Grants & Funding Programs',
      badge: 'Limited / Between Cycles',
      meta: 'Funding programs · International · Pare Lorentz expected to reopen late 2026',
      description: 'IDA says its Artist Services team is currently focused on Emergency Assistance. The Pare Lorentz Documentary Fund is expected to reopen in late 2026 with a new theme. IDA’s separate Grants Directory continues to list active third-party opportunities.'
    },
    {
      title: 'Redford Center Grant',
      badge: 'Closed',
      meta: 'Grant · Environmental · Any Stage · Applications closed',
      description: '$40,000 plus yearlong support for environmental documentary projects. Applications are closed. Redford Center’s current application page says the deadline closed May 17, 2026, while its published 2026 terms list May 14 at 5 p.m. PT; because the official materials conflict, Documentary411 does not present a single exact deadline.',
      tags: '<span class="tag">$40K</span><span class="tag">Environmental</span><span class="tag">Closed</span>'
    },
    {
      title: 'Ford Foundation JustFilms',
      badge: 'Closed',
      meta: 'Grant · Social Justice · Feature Documentary · Applications currently closed',
      description: 'JustFilms supports artist-driven feature documentaries that intersect with Ford Foundation social justice priorities. Ford currently states that documentary film production grant submissions are closed.'
    },
    {
      title: 'Berkeley Film Foundation',
      badge: 'Closed',
      meta: 'Grant · Production, Post & Distribution · East Bay CA · Deadline April 13, 2026',
      description: '$5,000–$25,000 documentary grants for eligible East Bay filmmakers. The 2026 Documentary Grant Program is closed; the deadline was April 13, 2026 at 11:59 p.m. PT.'
    },
    {
      title: 'SFFILM Documentary Fund',
      badge: 'Closed',
      meta: 'Grant · Post-Production · International · Final deadline July 7, 2026',
      description: 'The SFFILM Documentary Film Fund supports feature documentaries in post-production with grants of $10,000–$20,000. Applications for the 2026 cycle are closed; the final deadline was July 7, 2026.',
      tags: '<span class="tag">Post Only</span><span class="tag">$10K–$20K</span><span class="tag">Closed</span>'
    },
    {
      title: 'Mountainfilm Commitment Grant',
      badge: 'Closed',
      meta: 'Grant · Post-Production · International · Deadline July 16, 2026',
      description: 'Mountainfilm Commitment Grants support documentary projects in post-production, with awards of $3,000–$6,000. Applicants from any country are eligible. The 2026 application window closed July 16, 2026 at 11:59 p.m. MDT.',
      tags: '<span class="tag">Post Only</span><span class="tag">$3K–$6K</span><span class="tag">International</span>'
    },
    {
      title: 'Film Independent Documentary Producing Lab',
      badge: 'Closed',
      meta: 'Lab · Documentary Producing · Member deadline May 18, 2026',
      description: 'The 2026 Documentary Producing Lab application is currently closed. The non-member deadline was May 4, 2026 and the Film Independent member extended deadline was May 18, 2026.',
      tags: '<span class="tag">Lab</span><span class="tag">Mentorship</span><span class="tag">Closed</span>'
    },
    {
      title: 'Catapult Film Fund',
      badge: 'Closed',
      meta: 'Grant · Early Development · International · Applications not currently accepted',
      description: 'Catapult provides early-stage documentary development and research funding. Its official application page states that it is not accepting applications at this time; the 2026 Research Grant and Development Grant are both closed.'
    }
  ];

  for (const update of updates) html = updateGrantCard(html, update.title, update);
  html = closeExpiredOpenBadges(html);
  html = addSemanticDates(html);
  fs.writeFileSync(file, html);
}

function updateResource(source, name, fields) {
  const marker = `name:'${name}'`;
  const idx = source.indexOf(marker);
  if (idx === -1) return source;
  const start = source.lastIndexOf('  {', idx);
  const close = source.indexOf('\n  },', idx);
  if (start === -1 || close === -1) return source;
  const end = close + '\n  },'.length;
  let entry = source.slice(start, end);

  for (const [field, value] of Object.entries(fields)) {
    const formatted = typeof value === 'boolean' ? String(value) : `'${String(value).replace(/'/g, "\\'")}'`;
    const fieldRe = new RegExp(`${field}:(?:'[^']*'|true|false)`);
    if (fieldRe.test(entry)) entry = entry.replace(fieldRe, `${field}:${formatted}`);
  }
  return source.slice(0, start) + entry + source.slice(end);
}

function fixResourceData() {
  const file = path.join(__dirname, 'resources-data.js');
  if (!fs.existsSync(file)) return;
  let source = fs.readFileSync(file, 'utf8');

  source = updateResource(source, 'Sundance Institute Documentary Fund', {
    deadlineMonth:'Closed; next open call announced early 2027', rollingDeadline:false, status:'closed', lastVerified:AUDIT_DATE_ISO,
    notes:'Official Sundance page confirms the Documentary Fund is not accepting applications; next open call will be announced in early 2027.'
  });
  source = updateResource(source, 'IDA Grants Directory', {
    deadlineMonth:'Directory updated weekly; not an application window', rollingDeadline:false, status:'active', lastVerified:AUDIT_DATE_ISO,
    notes:'IDA says the public directory displays active third-party opportunities only. It is a funding research resource, not itself an open grant.'
  });
  source = updateResource(source, 'ITVS Open Call', {
    deadlineMonth:'Closed; no next deadline posted', rollingDeadline:false, status:'closed', lastVerified:AUDIT_DATE_ISO,
    notes:'ITVS currently labels Open Call as not accepting applications. No new application deadline is posted on the official Open Call page.'
  });
  source = updateResource(source, 'Catapult Film Fund', {
    deadlineMonth:'Closed; upcoming deadlines not yet posted', rollingDeadline:false, status:'closed', lastVerified:AUDIT_DATE_ISO,
    notes:'Catapult states that it is not accepting applications at this time; its 2026 Research and Development grant rounds are closed.'
  });
  source = updateResource(source, 'Chicken & Egg Pictures', {
    deadlineMonth:'Closed; R&D tentatively reopens Dec 2026; (Egg)celerator next cycle early 2027', rollingDeadline:false, status:'closed', lastVerified:AUDIT_DATE_ISO,
    notes:'Current public grant calls are closed. The 2026 R&D Grant closed Feb 4; the 2027 (Egg)celerator Lab closed Apr 29; Project: Hatched is invite-only.'
  });
  source = updateResource(source, 'Ford Foundation JustFilms', {
    deadlineMonth:'Closed; no reopening date posted', rollingDeadline:false, status:'closed', lastVerified:AUDIT_DATE_ISO,
    notes:'Ford currently states that documentary film production grant submissions are closed.'
  });
  source = updateResource(source, 'Women Make Movies Fiscal Sponsorship', {
    deadlineMonth:'Rolling', rollingDeadline:true, status:'open', lastVerified:AUDIT_DATE_ISO,
    notes:'WMM accepts Production Assistance / fiscal sponsorship applications on a rolling basis. This is fiscal sponsorship, not a cash grant or loan.'
  });
  source = updateResource(source, 'International Documentary Association Fiscal Sponsorship', {
    deadlineMonth:'Rolling / year-round', rollingDeadline:true, status:'open', lastVerified:AUDIT_DATE_ISO,
    notes:'IDA accepts documentary fiscal sponsorship applications year-round. This enables fundraising through grants and donations; it is not itself a grant.'
  });

  fs.writeFileSync(file, source);
}

function fixOpenNowFilter() {
  const file = path.join(__dirname, 'directory-tools.js');
  if (!fs.existsSync(file)) return;
  let source = fs.readFileSync(file, 'utf8');
  source = source.replace(/if\(config\.openish\) base = base\.filter\([^;]+\);/, "if(config.openish) base = base.filter(r=>r.status === 'open' || r.status === 'rolling');");
  fs.writeFileSync(file, source);
}

function addItemListSchemas() {
  const dataFile = path.join(__dirname, 'resources-data.js');
  if (!fs.existsSync(dataFile)) return;
  const sandbox = {window:{}};
  vm.runInNewContext(fs.readFileSync(dataFile, 'utf8'), sandbox, {filename:dataFile});
  const resources = sandbox.window.D411_RESOURCES || [];
  const pages = {
    'directory.html': resources,
    'documentary-grants.html': resources.filter(resource => resource.category === 'Documentary & Film Funds / Grants'),
    'documentary-markets.html': resources.filter(resource => resource.category === 'Documentary Markets'),
    'fiscal-sponsorship.html': resources.filter(resource => resource.category === 'Fiscal Sponsorship')
  };
  for (const [fileName, items] of Object.entries(pages)) {
    const file = path.join(__dirname, fileName);
    if (!fs.existsSync(file)) continue;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: fileName === 'directory.html' ? 'Documentary411 Filmmaker Resource Directory' : undefined,
      numberOfItems: items.length,
      itemListElement: items.map((resource, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {'@type':'Thing', name:resource.name, description:resource.description, url:resource.officialUrl}
      }))
    };
    if (!schema.name) delete schema.name;
    const block = `<!-- D411 ITEMLIST START -->\n<script type="application/ld+json">${JSON.stringify(schema)}</script>\n<!-- D411 ITEMLIST END -->`;
    let html = fs.readFileSync(file, 'utf8');
    if (/<!-- D411 ITEMLIST START -->[\s\S]*?<!-- D411 ITEMLIST END -->/.test(html)) {
      html = html.replace(/<!-- D411 ITEMLIST START -->[\s\S]*?<!-- D411 ITEMLIST END -->/, block);
    } else {
      html = html.replace('</head>', `${block}\n</head>`);
    }
    fs.writeFileSync(file, html);
  }
}

fixHomepage();
fixResourceData();
fixOpenNowFilter();
addItemListSchemas();
console.log('Documentary411 grant status audit safeguards applied.');
