const fs = require('fs');
const path = require('path');

function injectStyles(fileName, styleTags) {
  const file = path.join(__dirname, fileName);
  let html = fs.readFileSync(file, 'utf8');
  for (const tag of styleTags) {
    if (!html.includes(tag)) {
      html = html.replace('</head>', `  ${tag}\n</head>`);
    }
  }
  fs.writeFileSync(file, html);
  return html;
}

/* Homepage */
const homeFile = path.join(__dirname, 'index.html');
let html = fs.readFileSync(homeFile, 'utf8');

const homeStyles = [
  '<link rel="stylesheet" href="/redesign.css">',
  '<link rel="stylesheet" href="/redesign-v2.css">'
];
for (const tag of homeStyles) {
  if (!html.includes(tag)) {
    html = html.replace('</head>', `  ${tag}\n</head>`);
  }
}

/* Copy refinements only — URLs, forms, calculators and JavaScript are untouched. */
html = html.replace(
  /<p class="hero-eyebrow"[^>]*>.*?<\/p>/,
  '<p class="hero-eyebrow">Funding. Festivals. Tools. Community.</p>'
);

html = html.replace(
  /<h1>.*?<\/h1>/,
  '<h1>Your Insider<br>Advantage for<br>Documentary<br>Filmmaking<span class="hero-dot">.</span></h1>'
);

html = html.replace(
  'Verified grants, festivals, distributors, sales agents, legal resources, equipment, and software — curated for independent documentary filmmakers at every stage.',
  'Funding opportunities, festivals, distribution, legal resources, equipment and practical tools — curated for independent documentary filmmakers by people who know the road.'
);

html = html.replace('>Explore Directory</a>', '>Explore Resources</a>');
fs.writeFileSync(homeFile, html);

/* Shared Documentary411 product/support visual system. Presentation only. */
const productStyle = '<link rel="stylesheet" href="/product-redesign.css">';
[
  'funding-lab.html',
  'festival-strategy.html',
  'funding-report.html',
  'funding-sprint.html',
  'thank-you.html',
  'welcome-festival.html',
  'welcome-sprint.html',
  'welcome-system.html'
].forEach(fileName => {
  injectStyles(fileName, [productStyle]);
});

console.log('Documentary411 redesign applied across homepage, products and support pages');
