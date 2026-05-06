const fs = require('fs');
const path = require('path');

const files = [
  'pdf-core.service.ts',
  'pdf-components.service.ts',
  'pdf-chart-drawer.service.ts'
];

for (const file of files) {
  const filePath = path.join(__dirname, 'src', 'report', 'pdf', file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove features: isRTL ? ['rtla'] : undefined
  content = content.replace(/features:\s*isRTL\s*\?\s*\['rtla'\]\s*:\s*undefined,?/g, '');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Replaced in ${file}`);
}
