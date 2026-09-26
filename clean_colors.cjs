const fs = require('fs');
let content = fs.readFileSync('src/pages/StudentPortal.jsx', 'utf8');

content = content.replace(/hover:bg-\[\#4f46e5\]/g, 'hover:bg-zinc-200');
content = content.replace(/bg-\[\#c7d2fe\]\/50/g, 'bg-white/20');
content = content.replace(/hover:bg-\[\#ff5722\]\/80/g, 'hover:bg-white/20');

fs.writeFileSync('src/pages/StudentPortal.jsx', content);
