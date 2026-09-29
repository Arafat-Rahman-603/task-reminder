const fs = require('fs');
const path = require('path');
const dirs = ['acceptable-use', 'cookies', 'financial-disclaimer', 'privacy', 'terms'];
const basePath = 'src/app/(public)';

for (const dir of dirs) {
  const filePath = path.join(basePath, dir, 'page.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Extract title
    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1].split(' | ')[0] : dir;
    
    // Replace metadata block and imports
    content = content.replace(/import type { Metadata } from "next";\r?\n+export const metadata: Metadata = {[\s\S]*?};\r?\n/, 
      `import type { Metadata } from "next";\nimport { getLocalizedMetadata } from "@/lib/seo/metadata";\nimport { getServerLanguage } from "@/lib/seo/server-language";\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const lang = await getServerLanguage();\n  return getLocalizedMetadata({\n    lang,\n    path: "/${dir}",\n    title: lang === "es" ? "${title} (ES)" : "${title}",\n  });\n}\n`
    );
    
    // Add getServerLanguage to component
    content = content.replace(/export default function Page\(\) \{/, `export default async function Page() {\n  const lang = await getServerLanguage();`);
    
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + dir);
  }
}
