const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');
code = code.replace(/import \{ ThemeToggle \} from '@\/components\/ThemeToggle';\n/, '');
code = code.replace(/<ThemeToggle \/>\n?\s*/, '');
fs.writeFileSync('src/app/page.tsx', code, 'utf8');
console.log('Removed ThemeToggle from page.tsx');
