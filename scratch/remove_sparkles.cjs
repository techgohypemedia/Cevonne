const fs = require('fs');
const filePath = 'components/Navbar.tsx';
let c = fs.readFileSync(filePath, 'utf8');

c = c.replace(/,\s*Sparkles/, '');
c = c.replace(/Sparkles,\s*/, '');
c = c.replace(
  `<span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200 border border-amber-200/30">
                          <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" />
                          Virtual AR Studio
                        </span>`,
  `<span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-md px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-200 border border-white/20">
                          Virtual AR Studio
                        </span>`
);

fs.writeFileSync(filePath, c, 'utf8');
console.log('Successfully removed Sparkles icon');

