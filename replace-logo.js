const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const rep of replacements) {
    if (rep.regex) {
      content = content.replace(rep.regex, rep.replacement);
    } else {
      content = content.split(rep.search).join(rep.replacement);
    }
  }
  
  if (original !== content) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

// 1. PublicHeader.tsx
replaceInFile(path.join(baseDir, 'components', 'public', 'PublicHeader.tsx'), [
  {
    search: `<div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-high p-1 shadow-sm">
                <img src="/fav.png" alt="Logo" className="w-full h-full object-contain rounded" />
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">Personal OS</span>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />`
  }
]);

// 2. PublicFooter.tsx
replaceInFile(path.join(baseDir, 'components', 'public', 'PublicFooter.tsx'), [
  {
    search: `<div className="flex items-center gap-2">
            <img src="/fav.png" alt="Logo" className="w-6 h-6 object-contain rounded" />
            <span className="text-sm font-bold text-on-surface">Personal OS</span>
          </div>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-6 w-auto object-contain" />`
  },
  {
    search: `&copy; {currentYear} Personal OS.`,
    replacement: `&copy; {currentYear}.`
  }
]);

// 3. Sidebar.tsx
replaceInFile(path.join(baseDir, 'components', 'Sidebar.tsx'), [
  {
    search: `<div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 bg-surface-container-high p-1">
            <img src="/fav.png" alt="Manageo" className="w-full h-full object-contain rounded drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold tracking-wider text-stitch-primary uppercase leading-none">Manageo</span>
            <span className="text-[10px] font-medium text-on-surface-variant/70 leading-none mt-1">Personal OS</span>
          </div>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />`
  }
]);

// 4. MobileNav.tsx
replaceInFile(path.join(baseDir, 'components', 'MobileNav.tsx'), [
  {
    search: `<div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-md shadow-primary/20 bg-surface-container-high p-0.5">
                <img src="/fav.png" alt="Logo" className="w-full h-full object-contain rounded drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />
              </div>
              <span className="text-base font-headline font-bold tracking-tight text-on-surface">Manageo</span>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />`
  },
  {
    search: `<div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 bg-surface-container-high p-1">
                <img src="/fav.png" alt="Logo" className="w-full h-full object-contain rounded" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold tracking-wider text-stitch-primary uppercase leading-none">Manageo</span>
                <span className="text-[10px] font-medium text-on-surface-variant/70 leading-none mt-1">Personal OS</span>
              </div>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />`
  }
]);

// 5. AuthLayout.tsx
replaceInFile(path.join(baseDir, 'components', 'auth', 'AuthLayout.tsx'), [
  {
    search: `<div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 bg-surface-container-high p-1">
              <img src="/fav.png" alt="Logo" className="w-full h-full object-contain rounded drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-primary">Manageo</span>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]" />`
  },
  {
    search: `<div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 bg-surface-container-high p-1">
              <img src="/fav.png" alt="Logo" className="w-full h-full object-contain rounded drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-primary">Personal OS</span>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]" />`
  }
]);

// 6. login/page.tsx
replaceInFile(path.join(baseDir, 'app', 'login', 'page.tsx'), [
  {
    search: `<div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 bg-surface-container-high/80 p-1">
                <img src="/fav.png" alt="Logo" className="w-full h-full object-contain rounded drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold tracking-wider text-stitch-primary uppercase leading-none">Manageo</span>
                <span className="text-xs font-bold text-on-surface mt-1 leading-none">Personal OS</span>
              </div>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />`
  },
  {
    search: `<div className="w-16 h-16 rounded-2xl bg-surface-container-high/80 p-2 shadow-2xl shadow-primary/20 backdrop-blur-sm border border-surface-variant/30 mb-8 mx-auto hidden lg:flex">
                <img src="/fav.png" alt="Manageo" className="w-full h-full object-contain rounded-xl drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]" />
              </div>`,
    replacement: `<div className="mb-8 mx-auto hidden lg:flex justify-center">
                <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]" />
              </div>`
  }
]);

// 7. register/page.tsx
replaceInFile(path.join(baseDir, 'app', 'register', 'page.tsx'), [
  {
    search: `<div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 bg-surface-container-high/80 p-1">
                <img src="/fav.png" alt="Logo" className="w-full h-full object-contain rounded drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold tracking-wider text-stitch-primary uppercase leading-none">Manageo</span>
                <span className="text-xs font-bold text-on-surface mt-1 leading-none">Personal OS</span>
              </div>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />`
  },
  {
    search: `<div className="w-16 h-16 rounded-2xl bg-surface-container-high/80 p-2 shadow-2xl shadow-primary/20 backdrop-blur-sm border border-surface-variant/30 mb-8 mx-auto hidden lg:flex">
                <img src="/fav.png" alt="Manageo" className="w-full h-full object-contain rounded-xl drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]" />
              </div>`,
    replacement: `<div className="mb-8 mx-auto hidden lg:flex justify-center">
                <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]" />
              </div>`
  }
]);

// 8. forgot-password/page.tsx
replaceInFile(path.join(baseDir, 'app', 'forgot-password', 'page.tsx'), [
  {
    search: `<div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 bg-surface-container-high/80 p-1">
                <img src="/fav.png" alt="Logo" className="w-full h-full object-contain rounded drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold tracking-wider text-stitch-primary uppercase leading-none">Manageo</span>
                <span className="text-xs font-bold text-on-surface mt-1 leading-none">Personal OS</span>
              </div>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />`
  }
]);

// 9. (public)/contact/page.tsx
replaceInFile(path.join(baseDir, 'app', '(public)', 'contact', 'page.tsx'), [
  {
    search: `<div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 bg-surface-container-high/80 p-0.5">
                <img src="/fav.png" alt="Logo" className="w-full h-full object-contain rounded drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />
              </div>
              <span className="text-sm font-semibold text-on-surface">Manageo</span>
            </div>`,
    replacement: `<img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />`
  }
]);

// Regex replacements across the codebase for Title/Manageo
function regexReplace(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace remaining 'Personal OS' plain text where appropriate
  // e.g. `<title>Personal OS</title>` -> let's keep the title maybe, but remove text in the body.
  // Wait, if it's text like "About Personal OS", should I replace it? The user said "Personal OS remove it from every where and use logo.png". This implies in the UI headers/footers it should be the logo. In the text, they might mean everywhere as a brand name, but you can't put an image in a page title.
  // I will just let the explicit component replacements handle the visual UI headers/footers.

  if (original !== content) {
    fs.writeFileSync(filePath, content);
  }
}

console.log('Logo replacements complete.');
