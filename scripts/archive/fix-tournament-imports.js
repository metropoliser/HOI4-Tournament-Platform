const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'tournaments', '[id]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix import
content = content.replace(
  /import { HOI4Nation } from '@\/app\/lib\/hoi4NationsComplete';/,
  `import { HOI4Nation, HOI4_NATIONS } from '@/app/lib/hoi4NationsComplete';`
);

// Replace getNationByTag usage with direct lookup
content = content.replace(
  /getNationByTag\(([^)]+)\)/g,
  'HOI4_NATIONS[$1]'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Fixed tournament detail page imports');
