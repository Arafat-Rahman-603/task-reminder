const fs = require('fs');
const path = require('path');
const dirs = ['acceptable-use', 'cookies', 'financial-disclaimer', 'privacy', 'terms'];
const basePath = 'src/app/(public)';

const titles = {
  'acceptable-use': { es: 'Uso Aceptable', en: 'Acceptable Use' },
  'cookies': { es: 'Política de Cookies', en: 'Cookie Policy' },
  'financial-disclaimer': { es: 'Aviso Financiero', en: 'Financial Disclaimer' },
  'privacy': { es: 'Política de Privacidad', en: 'Privacy Policy' },
  'terms': { es: 'Términos de Servicio', en: 'Terms of Service' }
};

for (const dir of dirs) {
  const filePath = path.join(basePath, dir, 'page.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it already has getServerLanguage to avoid duplicating it
    if (!content.includes('generateMetadata')) {
      content = content.replace(/import type { Metadata } from "next";\r?\n\r?\nexport const metadata: Metadata = \{[^}]*\};/m, 
        `import type { Metadata } from "next";\nimport { getLocalizedMetadata } from "@/lib/seo/metadata";\nimport { getServerLanguage } from "@/lib/seo/server-language";\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const lang = await getServerLanguage();\n  return getLocalizedMetadata({\n    lang,\n    path: "/${dir}",\n    title: lang === "es" ? "${titles[dir].es}" : "${titles[dir].en}",\n  });\n}`
      );
      
      fs.writeFileSync(filePath, content);
      console.log('Updated metadata for ' + dir);
    }
  }
}
