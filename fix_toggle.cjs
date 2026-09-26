const fs = require('fs');
let content = fs.readFileSync('src/pages/StudentPortal.jsx', 'utf8');

content = content.replace(
  /className={\bsolute top-1 bg-white\/10 backdrop-blur-2xl border-white\/10 shadow-2xl w-6 h-6 rounded-full transition-transform duration-300 shadow-sm \$\{checked \? 'left-7' : 'left-1'\}\}<\/div>/g,
  'className={\bsolute top-1 w-6 h-6 rounded-full transition-transform duration-300 shadow-md \$\{checked ? "left-7 bg-zinc-900" : "left-1 bg-white"\}\}></div>'
);

fs.writeFileSync('src/pages/StudentPortal.jsx', content);
