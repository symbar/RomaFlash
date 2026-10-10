const fs = require('fs');

const headerString = `
      <header className="flex items-center justify-between py-6 mb-4 border-b border-border relative z-50 px-4 md:px-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-bold tracking-tight text-secondary">Roma<span className="text-primary">Flash</span></h1>
          </Link>
          
          <div className="hidden md:block mx-4 h-6 w-px bg-border"></div>
          <h2 className="hidden md:block text-sm font-semibold text-gray-400">Notizia</h2>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 ml-8 text-sm font-semibold text-gray-500 dark:text-gray-400">
            <Link href="/" className="flex items-center gap-2 hover:text-primary transition-colors text-primary">
              Le Ultime
            </Link>
            <Link href="/calendario" className="flex items-center gap-2 hover:text-primary transition-colors text-gray-500 dark:text-gray-400">
              Calendario
            </Link>
          </nav>
        </div>
      </header>
`;

let articleCode = fs.readFileSync('src/app/article/page.tsx', 'utf8');

// Replace the main block layout
articleCode = articleCode.replace(
  /<main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-32">\n\s*<div className="bg-background">/,
  `<main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pb-32">\n      <div className="bg-background">\n${headerString}\n      <div className="max-w-3xl mx-auto">`
);

// Close the max-w-3xl div
let parts = articleCode.split('</main>');
// The last one is before `export default function ArticlePage()`
articleCode = parts[0] + parts[1] + parts[2] + `</div>\n    </main>` + parts[3];
// Wait! `</main>` occurs 3 times.
// index 0: `return <main></main>`
// index 1: `return <main>... skeleton ... </main>`
// index 2: `return <main>... not found ... </main>`
// index 3: `return <main>... actual content ... </main>`
// So parts has 5 elements.

