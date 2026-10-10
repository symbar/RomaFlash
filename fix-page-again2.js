const fs = require('fs');
let code = fs.readFileSync('src/app/formazioni/page.tsx', 'utf8');
code = code.replace(/<DynamicBallottaggi[^>]*>/g, '');
fs.writeFileSync('src/app/formazioni/page.tsx', code, 'utf8');
