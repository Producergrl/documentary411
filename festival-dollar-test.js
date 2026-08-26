const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'festival-strategy.html');
let html = fs.readFileSync(file, 'utf8');

html = html.replace(/https:\/\/buy\.stripe\.com\/4gM5kC83RcUN5aK7dN6J206/g, 'https://buy.stripe.com/aFa28qgAn2g9bz869J6J209');
html = html.replace(/Get the Strategy — \$99/g, 'Test Checkout — $1');
html = html.replace(/<p class="eyebrow">Current price<\/p>\s*<p class="price-line">\$99<\/p>/, '<p class="eyebrow">Temporary test price</p>\n      <p class="price-line">$1</p>');
html = html.replace('One payment through Stripe. Your download page opens immediately after successful payment.', 'Temporary $1 live Stripe checkout for end-to-end testing today. Your download page should open immediately after successful payment.');
html = html.replace('Secure Stripe checkout. Immediate PDF access after payment.', 'Temporary $1 live Stripe checkout for testing today. Immediate PDF access after payment.');

fs.writeFileSync(file, html);
console.log('Temporary $1 Stripe Payment Link applied to Festival Strategy');
