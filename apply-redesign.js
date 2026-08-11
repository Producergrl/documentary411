const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const tag = '<link rel="stylesheet" href="/redesign.css">';

if (!html.includes(tag)) {
  html = html.replace('</head>', `  ${tag}\n</head>`);
  fs.writeFileSync(file, html);
  console.log('Documentary411 redesign stylesheet injected into index.html');
} else {
  console.log('Documentary411 redesign stylesheet already present');
}
