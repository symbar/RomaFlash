const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');
if (code.charCodeAt(0) === 0xFEFF) {
  code = code.slice(1);
}
fs.writeFileSync('src/app/globals.css', code, 'utf8');
console.log("BOM removed");
