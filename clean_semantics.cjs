const fs = require('fs');
let content = fs.readFileSync('src/pages/StudentPortal.jsx', 'utf8');

// The main fee status card
content = content.replace(/let bgColor = "bg-white";/g, 'let bgColor = "bg-white/10";');
content = content.replace(/bgColor = "bg-red-500";/g, 'bgColor = "bg-white/20 border border-white/50";');
content = content.replace(/bgColor = "bg-orange-500";/g, 'bgColor = "bg-white/10 border border-white/30";');

// Specific to the bottom Fee Summary section:
content = content.replace(/boxBg = "bg-red-50 border-red-100";/g, 'boxBg = "bg-white/20 border-white/50";');
content = content.replace(/textCol = "text-red-600";/g, 'textCol = "text-white";');
content = content.replace(/bg-red-100 text-red-700/g, 'bg-white/30 text-white drop-shadow-md');

content = content.replace(/boxBg = "bg-orange-50 border-orange-100";/g, 'boxBg = "bg-white/10 border-white/30";');
content = content.replace(/textCol = "text-orange-600";/g, 'textCol = "text-white";');
content = content.replace(/bg-orange-100 text-orange-700/g, 'bg-white/20 text-white drop-shadow-md');

// Logout button
content = content.replace(/bg-red-50 text-red-600/g, 'bg-white/10 text-white border border-white/30');
content = content.replace(/hover:bg-red-100/g, 'hover:bg-white/20');

// Error messages
content = content.replace(/text-red-500/g, 'text-zinc-200 bg-white/10 px-4 py-2 rounded-lg border border-white/20');
content = content.replace(/text-green-700/g, 'text-zinc-900');
content = content.replace(/bg-green-100/g, 'bg-white/80');

fs.writeFileSync('src/pages/StudentPortal.jsx', content);
