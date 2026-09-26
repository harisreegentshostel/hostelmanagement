const fs = require('fs');
let content = fs.readFileSync('src/pages/StudentPortal.jsx', 'utf8');

content = content.replace(/className="w-full mt-6 py-4 bg-white\/10 backdrop-blur-3xl border border-white\/20 shadow-2xl text-white rounded-xl font-bold text-lg hover:bg-white\/80 transition-colors shadow-md disabled:opacity-50 animate-in fade-in slide-in-from-bottom-2 duration-300"/g, 'className="w-full mt-6 py-4 bg-white text-zinc-900 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors shadow-xl disabled:opacity-50 animate-in fade-in slide-in-from-bottom-2 duration-300"');

fs.writeFileSync('src/pages/StudentPortal.jsx', content);
