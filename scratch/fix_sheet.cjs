const fs = require('fs');
const filePath = 'components/ui/sheet.tsx';
let c = fs.readFileSync(filePath, 'utf8');
const target = 'className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"';
const replacement = 'className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:pointer-events-none"';

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync(filePath, c, 'utf8');
  console.log('Successfully updated sheet.tsx');
} else {
  console.log('Target not found in sheet.tsx');
}

