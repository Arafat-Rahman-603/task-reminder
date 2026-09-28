const fs = require('fs');
const path = require('path');

console.log("Starting Route Consistency Audit...\n");

// Read modules config
const modulesPath = path.join(__dirname, '../src/config/modules.ts');
const modulesContent = fs.readFileSync(modulesPath, 'utf8');

// Simple regex to extract route definitions from SYSTEM_MODULES
const routeRegex = /route:\s*["']([^"']+)["']/g;
const implementedRegex = /implemented:\s*(true|false)/g;
const idRegex = /id:\s*["']([^"']+)["']/g;

const blocks = modulesContent.split('id: "').slice(1);

let allValid = true;
const implementedRoutes = [];
const unimplementedRoutes = [];

blocks.forEach(block => {
  const id = block.split('"')[0];
  const routeMatch = /route:\s*["']([^"']+)["']/.exec(block);
  const implMatch = /implemented:\s*(true|false)/.exec(block);

  if (routeMatch && implMatch) {
    const route = routeMatch[1];
    const implemented = implMatch[1] === 'true';

    if (implemented) {
      implementedRoutes.push({ id, route });
    } else {
      unimplementedRoutes.push({ id, route });
    }
  }
});

console.log(`--- Audit: Implemented Modules (${implementedRoutes.length}) ---`);
implementedRoutes.forEach(({ id, route }) => {
  // Convert route to Next.js App Router path
  // e.g., /dashboard/tasks -> src/app/dashboard/tasks/page.tsx
  // /dashboard -> src/app/dashboard/page.tsx
  
  let relativePath = route.substring(1); // remove leading slash
  if (relativePath === 'dashboard') {
    relativePath = 'dashboard/page.tsx';
  } else {
    relativePath = `${relativePath}/page.tsx`;
  }

  const pagePath = path.join(__dirname, '../src/app', relativePath);
  const exists = fs.existsSync(pagePath);
  
  if (exists) {
    console.log(`✅ [${id}] Route exists: ${route}`);
  } else {
    console.log(`❌ [${id}] Route missing but marked implemented: ${route} (Expected: src/app/${relativePath})`);
    allValid = false;
  }
});

console.log(`\n--- Audit: Unimplemented Modules (${unimplementedRoutes.length}) ---`);
unimplementedRoutes.forEach(({ id, route }) => {
  console.log(`⚠️  [${id}] Route is correctly hidden: ${route}`);
});

// Check Custom Sections route
const newCustomSectionPath = path.join(__dirname, '../src/app/dashboard/custom/new/page.tsx');
if (!fs.existsSync(newCustomSectionPath)) {
    console.log(`\n❌ Custom Sections New page missing: (Expected: src/app/dashboard/custom/new/page.tsx)`);
    allValid = false;
}

if (!allValid) {
  console.error("\nFAIL: Route consistency test failed. Missing pages found for implemented features.");
  process.exit(1);
} else {
  console.log("\nPASS: All visible navigation options point to real pages.");
}
