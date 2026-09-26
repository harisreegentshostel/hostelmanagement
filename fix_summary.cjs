const fs = require('fs');
let content = fs.readFileSync('src/pages/StudentPortal.jsx', 'utf8');

content = content.replace(/boxBg = "bg-white\/30 border-white\/50";/g, 'boxBg = "bg-white/10 border-white/30";');
content = content.replace(/textCol = "text-zinc-900";\s*statusBadge = \(\s*<span className="inline-block mt-2 px-3 py-1 bg-white\/20 text-zinc-900 text-xs font-bold rounded-full">/g, 'textCol = "text-white";\n                  statusBadge = (\n                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">');

fs.writeFileSync('src/pages/StudentPortal.jsx', content);
