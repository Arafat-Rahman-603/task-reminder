const fs = require('fs');

const replacements = [
  {
    file: 'src/components/public/PublicHeader.tsx',
    find: 'className="h-10 w-auto object-contain"',
    replace: 'className="h-12 w-auto object-contain"'
  },
  {
    file: 'src/components/public/PublicFooter.tsx',
    find: 'className="h-8 w-auto object-contain"',
    replace: 'className="h-10 w-auto object-contain"'
  },
  {
    file: 'src/components/Sidebar.tsx',
    find: 'className="h-10 w-auto object-contain"',
    replace: 'className="h-12 w-auto object-contain"'
  },
  {
    file: 'src/components/auth/AuthLayout.tsx',
    find: 'className="h-14 w-auto object-contain"',
    replace: 'className="h-16 w-auto object-contain"'
  },
  {
    file: 'src/app/login/page.tsx',
    find: 'className="h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]"',
    replace: 'className="h-12 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]"'
  },
  {
    file: 'src/app/login/page.tsx',
    find: 'className="relative h-20 w-auto object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]"',
    replace: 'className="relative h-24 w-auto object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]"'
  },
  {
    file: 'src/app/register/page.tsx',
    find: 'className="h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]"',
    replace: 'className="h-12 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]"'
  },
  {
    file: 'src/app/register/page.tsx',
    find: 'className="relative h-20 w-auto object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]"',
    replace: 'className="relative h-24 w-auto object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.4)]"'
  },
  {
    file: 'src/app/forgot-password/page.tsx',
    find: 'className="h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]"',
    replace: 'className="h-12 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]"'
  }
];

for (const {file, find, replace} of replacements) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(find)) {
      content = content.replace(find, replace);
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    } else {
      console.log(`Could not find pattern in ${file}`);
    }
  }
}
