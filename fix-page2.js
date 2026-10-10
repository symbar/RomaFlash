const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');
code = code.replace(/import \{ ThemeToggle \} from '@\/components\/ThemeToggle';/, '');
fs.writeFileSync('src/app/page.tsx', code, 'utf8');
