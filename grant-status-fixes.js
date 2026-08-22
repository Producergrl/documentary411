const fs = require('fs');
const path = require('path');
const vm = require('vm');

const AUDIT_DATE_TEXT = 'August 19, 2026';
const AUDIT_DATE_ISO = '2026-08-19';

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

  if (updates.badge) {
    card = card.replace(/<span class="card-badge [^"]+">[\s\S]*?<\/span>/, `<span class="card-badge ${updates.badgeClass || 'badge-listing'}">${updates.badge}</span>`);
  }

  if (updates.meta) {
    card = card.replace(/<div class="card-meta">[\s\S]*?<\/div>/, `<div class="card-meta">${updates.meta} · Last verified ${AUDIT_DATE_TEXT}</div>`);
  } else {
    card = card.replace(/<div class="card-meta">([\s\S]*?)<\/div>/, (m, inner) => {
      if (/Last verified/i.test(inner)) return m;
      return `<div class="card-meta">${inner} · Last verified ${AUDIT_DATE_TEXT}</div>`;
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
    'Active, verified funding opportunities for documentaries — from early development through post-production and impact release.',
    'Verified documentary funding programs with current application status — including open, closed, rolling, and upcoming cycles.'
  );

  const updates = [
    {
      title: 'Sundance Documentary Fund',
      badge: 'Closed · Next Call 2027',
      meta: 'Grant · Development, Production, Post · International · 2026 cycle closed June 15, 2026',
      description: 'Nonrecoupable support for independent cinematic documentaries worldwide. The application closed June 15, 2026; Sundance says the next open call will be announced in early 2027.'
    },
    {
      title: 'IDA Documentary Fund',
      badge: 'Verify Current Programs',
      meta: 'Funding resource · International · Program availability varies',
      description: 'IDA remains a major documentary funding resource, but individual funds and application windows change. Use the IDA Grants Directory to confirm which opportunities are currently accepting applications before preparing a submission.'
    },
    {
      title: 'Redford Center Grant',
      badge: 'Closed',
      meta: 'Grant · Environmental · Any Stage · Deadline May 14, 2026',
      description: '$40,000 plus mentorship and cohort support for environmental documentary projects. The 2026 application window closed May 14, 2026.',
      tags: '<span class="tag">$40K</span><span class="tag">Environmental</span><span class="tag">Deadline <time datetime="2026-05-14">May 14</time></span>'
    },
    {
      title: 'Ford Foundation JustFilms',
      badge: 'Closed',
      meta: 'Grant · Social Justice · Feature Documentary · Applications currently closed',
      description: 'JustFilms supports artist-driven feature documentaries intersecting with Ford Foundation social justice priorities. Ford currently states that documentary film production grant submissions are closed.'
    },
    {
      title: 'Berkeley Film Foundation',
      badge: 'Closed',
      meta: 'Grant · Production, Post & Distribution · East Bay CA · Deadline April 13, 2026',
      description: '$5,000–$25,000 documentary grants for eligible East Bay filmmakers. The 2026 Documentary Grant Program closed April 13, 2026.'
    },
    {
      title: 'SFFILM Documentary Fund',
      badge: 'Closed',
      meta: 'Grant · Post-Production · International · Final deadline July 7, 2026',
      description: 'Support for feature documentaries in post-production. The 2026 Documentary Film Fund closed after its final deadline on July 7, 2026.'
    },
    {
      title: 'Mountainfilm Commitment Grant',
      badge: 'Closed',
      meta: 'Grant · Production & Post · U.S.-resident filmmakers · Final deadline July 16, 2026',
      description: 'Funding for nonfiction stories covering adventure, activism, social justice, culture, and environment. The 2026 application window closed July 16, 2026.'
    },
    {
      title: 'Film Independent Documentary Producing Lab',
      badge: 'Closed',
      meta: 'Lab + Grant · Documentary Producing · Member deadline May 18, 2026',
      description: 'Intensive lab for documentary producers combining mentorship, industry access, and professional development. The 2026 Documentary Producing Lab application is currently closed.',
      tags: '<span class="tag">Lab</span><span class="tag">Mentorship</span><span class="tag">Deadline <time datetime="2026-05-18">May 18</time></span>'
    },
    {
      title: 'Catapult Film Fund',
      badge: 'Closed',
      meta: 'Grant · Early Development · International · Applications not currently accepted',
      description: 'Early-stage documentary development funding and mentorship. Catapult accepts applications in rounds and currently states that its grant programs are not accepting applications.'
    }
  ];

  for (const update of updates) html = updateGrantCard(html, update.title, update);
  html = closeExpiredOpenBadges(html);
  html = addSemanticDates(html);
  fs.writeFileSync(file, html);
}

function addItemListSchemas() {
  const dataFile = path.join(__dirname, 'resources-data.js');
  if (!fs.existsSync(dataFile)) return;
  const sandbox = {window:{}};
  vm.runInNewContext(fs.readFileSync(dataFile, 'utf8'), sandbox, {filename:dataFile});
  const resources = sandbox.window.D411_RESOURCES || [];
  const pages = {
    'directory.html': resources,
    'open-now.html': resources.filter(resource => resource.status === 'active' || resource.rollingDeadline === true),
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

function fixResourceData() {
  const file = path.join(__dirname, 'resources-data.js');
  if (!fs.existsSync(file)) return;
  let source = fs.readFileSync(file, 'utf8');

  source = source.replace(
    /name:'Sundance Institute Documentary Fund'([\s\S]*?)deadlineMonth:'[^']*'([\s\S]*?)status:'[^']*', lastVerified:'[^']*'/,
    (m, a, b) => `name:'Sundance Institute Documentary Fund'${a}deadlineMonth:'Closed; next open call announced early 2027'${b}status:'closed', lastVerified:'${AUDIT_DATE_ISO}'`
  );
  source = source.replace(
    /name:'Ford Foundation JustFilms'([\s\S]*?)deadlineMonth:'[^']*'([\s\S]*?)status:'[^']*', lastVerified:'[^']*'/,
    (m, a, b) => `name:'Ford Foundation JustFilms'${a}deadlineMonth:'Closed'${b}status:'closed', lastVerified:'${AUDIT_DATE_ISO}'`
  );
  source = source.replace(
    /name:'Catapult Film Fund'([\s\S]*?)deadlineMonth:'[^']*'([\s\S]*?)status:'[^']*', lastVerified:'[^']*'/,
    (m, a, b) => `name:'Catapult Film Fund'${a}deadlineMonth:'Closed'${b}status:'closed', lastVerified:'${AUDIT_DATE_ISO}'`
  );

  fs.writeFileSync(file, source);
}

function fixOpenNowFilter() {
  const file = path.join(__dirname, 'directory-tools.js');
  if (!fs.existsSync(file)) return;
  let source = fs.readFileSync(file, 'utf8');

  source = source.replace(
    "if(config.openish) base = base.filter(r=>r.status === 'active' || r.rollingDeadline || /rolling|verify/i.test(r.deadlineMonth||''));",
    "if(config.openish) base = base.filter(r=>r.status === 'active' || r.rollingDeadline === true);"
  );

  fs.writeFileSync(file, source);
}

function fixOpenNowCopy() {
  const file = path.join(__dirname, 'open-now.html');
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');

  html = html.replace('Open now, rolling, and <em>verify-before-applying</em> opportunities.', 'Confirmed open and <em>rolling</em> opportunities.');
  html = html.replace('This page is built for repeat visits. It highlights resources that are active, rolling, or worth checking this week — while clearly flagging items that need verification before a filmmaker spends money or time.', 'This page only surfaces opportunities confirmed as open or genuinely rolling. Programs that are closed, between cycles, or merely need verification stay out of this list.');
  html = html.replace('Open Now / Verify Before Applying', 'Open Now / Rolling');
  html = html.replace('A serious directory should not pretend every listing is free, current, or open. “Verify” is a feature, not a weakness — it protects filmmakers from dead links, old deadlines, and surprise membership walls.', 'A listing appears here only when it is confirmed open or genuinely rolling. Closed and unverified opportunities remain searchable in the full directory without being presented as live applications.');

  fs.writeFileSync(file, html);
}

fixHomepage();
fixResourceData();
fixOpenNowFilter();
fixOpenNowCopy();
addItemListSchemas();
console.log('Documentary411 grant status audit safeguards applied.');
