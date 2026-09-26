const fs = require('fs');
let content = fs.readFileSync('src/pages/StudentPortal.jsx', 'utf8');

content = content.replace(/bg-white\/10 backdrop-blur-2xl border-white\/10 shadow-2xl text-zinc-900 scale-105 shadow-md/g, 'bg-white text-zinc-900 scale-105 shadow-xl');

fs.writeFileSync('src/pages/StudentPortal.jsx', content);
