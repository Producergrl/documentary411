const fs = require('fs');
const path = require('path');

function injectStyles(fileName, styleTags) {
  const file = path.join(__dirname, fileName);
  if (!fs.existsSync(file)) return '';
  let html = fs.readFileSync(file, 'utf8');
  for (const tag of styleTags) {
    if (!html.includes(tag)) html = html.replace('</head>', `  ${tag}\n</head>`);
  }
  fs.writeFileSync(file, html);
  return html;
}

function injectScript(fileName, tag) {
  const file = path.join(__dirname, fileName);
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes(tag)) html = html.replace('</body>', `  ${tag}\n</body>`);
  fs.writeFileSync(file, html);
}

/* Homepage */
const homeFile = path.join(__dirname, 'index.html');
let html = fs.readFileSync(homeFile, 'utf8');

const homeStyles = [
  '<link rel="stylesheet" href="/redesign.css">',
  '<link rel="stylesheet" href="/redesign-v2.css">',
  '<link rel="stylesheet" href="/directory-upgrades.css">'
];
for (const tag of homeStyles) {
  if (!html.includes(tag)) html = html.replace('</head>', `  ${tag}\n</head>`);
}

html = html.replace(/<p class="hero-eyebrow"[^>]*>.*?<\/p>/,'<p class="hero-eyebrow">Funding. Festivals. Tools. Community.</p>');
html = html.replace(/<h1>.*?<\/h1>/,'<h1>Your Insider<br>Advantage for<br>Documentary<br>Filmmaking<span class="hero-dot">.</span></h1>');
html = html.replace('Verified grants, festivals, distributors, sales agents, legal resources, equipment, and software — curated for independent documentary filmmakers at every stage.','Funding opportunities, festivals, distribution, legal resources, equipment and practical tools — curated for independent documentary filmmakers by people who know the road.');
html = html.replace('>Explore Directory</a>', '>Explore Resources</a>');

/* Navigation hierarchy */
html = html.replace(/\s*<a href="\/festival-strategy(?:\.html)?">Festival Strategy<\/a>/g, '');
html = html.replace(/<a href="#festivals">Festivals<\/a>\s*<a href="#festfinder">Fest Near Me<\/a>/g,'<div class="nav-dropdown">\n        <a href="#festivals" class="nav-parent">Festivals <span class="nav-caret" aria-hidden="true">⌄</span></a>\n        <div class="nav-submenu">\n          <a href="#festfinder">Fest Near Me</a>\n        </div>\n      </div>\n      <a href="/festival-strategy.html">Festival Strategy</a>');
html = html.replace(/\s*<a href="\/advertise(?:\.html)?">Advertise<\/a>/g, '');
html = html.replace(/(<a href="\/funding-lab">Funding Lab<\/a>)/g,'$1\n      <a href="/advertise.html">Advertise</a>');

const growthLinks = [
  '<a href="/directory.html">Directory</a>','<a href="/open-now.html">Open Now</a>','<a href="/crew-jobs.html">Crew & Jobs</a>','<a href="/documentary-grants.html">Grants+</a>','<a href="/documentary-markets.html">Markets+</a>','<a href="/fiscal-sponsorship.html">Fiscal Sponsorship</a>','<a href="/blog.html">Blog</a>','<a href="/submit-resource.html">Submit/Correct</a>'
];
for (const link of growthLinks) {
  if (!html.includes(link)) html = html.replace(/(<a href="\/advertise\.html">Advertise<\/a>)/g, `$1\n      ${link}`);
}

const growthPanel = `<!-- HOME GROWTH UPGRADES -->
<section class="home-growth-panel" id="home-growth-upgrades">
  <div class="home-growth-inner">
    <div class="home-growth-card">
      <p class="cat-label">Start here</p>
      <h2>Find what is open, useful, and worth your time.</h2>
      <p>Documentary411 is becoming a self-correcting filmmaker directory: search resources, check what is open or needs verification, report broken links, and stop treating every grant, festival, market, or member-only resource as if it were the same thing.</p>
      <div class="home-growth-links"><a href="/directory.html">Search Directory</a><a href="/open-now.html">Open Now</a><a href="/submit-resource.html" class="secondary">Submit a Correction</a></div>
    </div>
    <div class="home-growth-card">
      <p class="cat-label">Free workbook</p>
      <h2>Festival Budget Workbook</h2>
      <p>Before filmmakers spend on submissions, travel, PR, badges, deliverables and follow-up, help them calculate what the festival run may actually cost.</p>
      <div class="home-growth-links"><a href="/festival-budget-workbook.html">Download Free</a><a href="/festival-strategy.html" class="secondary">90 Days Out</a></div>
    </div>
  </div>
</section>`;
if (!html.includes('id="home-growth-upgrades"')) html = html.replace('</section>\n\n<!-- FEST NEAR ME -->', `</section>\n\n${growthPanel}\n\n<!-- FEST NEAR ME -->`);

/* Make the Ask a Pro post-payment expectation explicit. */
html = html.replace(
  'Payments are processed securely by Stripe. After checkout you\'ll be redirected to a confirmation page and receive scheduling instructions by email.',
  'Payments are processed securely by Stripe. After checkout, the $50 question purchase continues to a short question form; the $500 consult continues to a short intake and scheduling form.'
);

const homeScript = '<script src="/site-fixes.js" defer></script>';
if (!html.includes(homeScript)) html = html.replace('</body>', `  ${homeScript}\n</body>`);
fs.writeFileSync(homeFile, html);

/* Funding Lab checkout safety: do not accept payment until the actual modules
   and templates are attached to the buyer access page. */
const fundingLabFile = path.join(__dirname, 'funding-lab.html');
if (fs.existsSync(fundingLabFile)) {
  let fundingLab = fs.readFileSync(fundingLabFile, 'utf8');
  fundingLab = fundingLab.replace(/href="https:\/\/buy\.stripe\.com\/8x2cN4abZ9IB32C55F6J200"/g, 'href="#funding-lab-waitlist"');
  fundingLab = fundingLab.replace(/>Get the System — \$297</g, '>Join the Waitlist<');
  fundingLab = fundingLab.replace(
    '<span class="btn-sub">Founding price $297 <em>(goes to $397 on August 1, 2026)</em></span>',
    '<span class="btn-sub">Checkout is paused until every module and template is attached for immediate delivery.</span>'
  );
  fundingLab = fundingLab.replace(
    '<p class="muted">Founding price goes to $397 on August 1, 2026. The live Q&amp;A calls are a launch-cohort bonus.</p>',
    '<p class="muted">Launch price: $297. Sales reopen when the complete seven-module system and all templates are ready for immediate access.</p>'
  );
  fundingLab = fundingLab.replace(
    '<h2>The founding price and the live Q&amp;A calls end August 1, 2026.</h2>',
    '<h2>Be first to know when the complete Funding Lab reopens.</h2>'
  );
  fundingLab = fundingLab.replace(
    '<p>Instant. You\'ll receive login/access by email within 5 minutes of checkout. Questions: <a href="mailto:admin@kdcandfilms.com">admin@kdcandfilms.com</a>.</p>',
    '<p>Checkout is temporarily paused while the complete module and template delivery package is finalized. Join the waitlist below and we will email you when immediate access is ready.</p>'
  );
  fundingLab = fundingLab.replace(
    '<summary>What\'s the refund policy?</summary>\n          <p>14-day full refund, any reason. Email <a href="mailto:admin@kdcandfilms.com">admin@kdcandfilms.com</a>.</p>',
    '<summary>Why is checkout paused?</summary>\n          <p>Because we will not accept payment until every promised module and template is attached and ready for immediate buyer access.</p>'
  );
  fundingLab = fundingLab.replace(
    /<div class="guarantee" style="margin-top:32px">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
    '<div class="honesty" style="margin-top:32px"><h3>Sales status</h3><p><strong>Checkout is paused.</strong> We will reopen sales only when the complete system can be delivered immediately after payment.</p></div>\n    </div>\n  </section>'
  );

  const fundingWaitlist = `
  <section class="band-soft" id="funding-lab-waitlist">
    <div class="wrap">
      <p class="eyebrow">Funding Lab waitlist</p>
      <h2>Get the reopening email.</h2>
      <p class="lead">We will email you when the complete seven-module system and every promised template are attached and ready for immediate delivery.</p>
      <form name="funding-lab-waitlist" method="POST" action="/funding-lab-waitlist-thank-you.html" data-netlify="true" style="max-width:620px;margin-top:24px">
        <input type="hidden" name="form-name" value="funding-lab-waitlist">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <input name="name" type="text" required placeholder="Your name" style="padding:12px;border:1px solid rgba(7,63,69,.18);border-radius:7px;font:inherit">
          <input name="email" type="email" required placeholder="Your email" style="padding:12px;border:1px solid rgba(7,63,69,.18);border-radius:7px;font:inherit">
        </div>
        <input name="film" type="text" placeholder="Film / project name (optional)" style="width:100%;padding:12px;border:1px solid rgba(7,63,69,.18);border-radius:7px;font:inherit;margin-top:12px">
        <button class="btn btn-primary" type="submit" style="border:0;margin-top:14px;cursor:pointer">Join the Waitlist</button>
      </form>
    </div>
  </section>`;
  if (!fundingLab.includes('id="funding-lab-waitlist"')) fundingLab = fundingLab.replace('<footer class="site-footer">', `${fundingWaitlist}\n\n  <footer class="site-footer">`);
  fs.writeFileSync(fundingLabFile, fundingLab);
}

const productStyle = '<link rel="stylesheet" href="/product-redesign.css">';
const directoryStyle = '<link rel="stylesheet" href="/directory-upgrades.css">';
const growthPages = ['directory.html','open-now.html','crew-jobs.html','submit-resource.html','resource-thank-you.html','festival-budget-workbook.html','blog.html','blog-festival-wins.html','documentary-grants.html','documentary-markets.html','fiscal-sponsorship.html'];
const styledPages = [
  'funding-lab.html','festival-strategy.html','funding-report.html','funding-sprint.html','thank-you.html','welcome-festival.html','welcome-sprint.html','welcome-system.html','advertise.html','advertise-thank-you.html',
  'ask-a-pro-question.html','ask-a-pro-question-thank-you.html','ask-a-pro-consult.html','ask-a-pro-consult-thank-you.html','funding-lab-waitlist-thank-you.html',
  ...growthPages
];
styledPages.forEach(fileName => injectStyles(fileName, [productStyle, directoryStyle]));

const searchStyle = '<link rel="stylesheet" href="/site-search.css">';
const searchScript = '<script src="/site-search.js" defer></script>';
const publicPages = ['index.html','funding-lab.html','festival-strategy.html','funding-report.html','funding-sprint.html','advertise.html',...growthPages];
publicPages.forEach(fileName => {injectStyles(fileName, [searchStyle]);injectScript(fileName, searchScript);});

function decodeEntities(s){return String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&ndash;/g,'–').replace(/&mdash;/g,'—').replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function cleanText(source){return decodeEntities(String(source||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function firstMatch(source,re,fallback=''){const m=String(source||'').match(re);return m?cleanText(m[1]):fallback;}
function excerpt(text,max=220){const t=cleanText(text);return t.length<=max?t:t.slice(0,max).replace(/\s+\S*$/,'')+'…';}
function fileUrl(fileName){return fileName==='index.html'?'/':'/'+fileName;}

const searchEntries=[];
for(const fileName of publicPages){
  const file=path.join(__dirname,fileName); if(!fs.existsSync(file)) continue;
  const source=fs.readFileSync(file,'utf8'); const pageTitle=firstMatch(source,/<title[^>]*>([\s\S]*?)<\/title>/i,fileName); const h1=firstMatch(source,/<h1[^>]*>([\s\S]*?)<\/h1>/i,pageTitle.replace(/\s+[—|-]\s+Documentary411.*$/i,'')); const bodyText=cleanText(source);
  searchEntries.push({page:pageTitle.replace(/\s+[—|-]\s+Documentary411.*$/i,''),title:h1||pageTitle,url:fileUrl(fileName),excerpt:excerpt(bodyText),searchText:bodyText});
  if(fileName==='index.html'){
    const sectionRe=/<section\b([^>]*)>([\s\S]*?)<\/section>/gi; let section;
    while((section=sectionRe.exec(source))){const attrs=section[1]; const idMatch=attrs.match(/\bid=["']([^"']+)["']/i); if(!idMatch) continue; const id=idMatch[1]; const block=section[2]; const sectionTitle=firstMatch(block,/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i,'Documentary411 Resource'); const sectionText=cleanText(block); if(!sectionText) continue; searchEntries.push({page:'Documentary411 Directory',title:sectionTitle,url:'/#'+id,excerpt:excerpt(sectionText),searchText:sectionText});}
  }
}
fs.writeFileSync(path.join(__dirname,'search-index.json'), JSON.stringify(searchEntries));
console.log(`Documentary411 redesign, directory upgrades, advertising, paid-offer safety, homepage fixes and site search applied (${searchEntries.length} search entries)`);
