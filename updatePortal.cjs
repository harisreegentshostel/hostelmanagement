const fs = require('fs');
let content = fs.readFileSync('src/pages/StudentPortal.jsx', 'utf8');

// The glassmorphic design requires a nice background. The image has a soft gradient from peach/orange to pink to light purple.
// Let's replace the top level bg-[#f4f6f9] with our gradient.
content = content.replace(/bg-\[#f4f6f9\]/g, 'bg-gradient-to-br from-[#ffd1ba] via-[#ffb6c1] to-[#d492f5]');

// Text colors to white/translucent white
content = content.replace(/text-slate-900/g, 'text-white drop-shadow-md');
content = content.replace(/text-slate-800/g, 'text-white drop-shadow-md');
content = content.replace(/text-slate-700/g, 'text-white/90 drop-shadow-sm');
content = content.replace(/text-slate-600/g, 'text-white/80');
content = content.replace(/text-slate-500/g, 'text-white/70');
content = content.replace(/text-slate-400/g, 'text-white/60');
content = content.replace(/text-black/g, 'text-[#ff5722]'); 
content = content.replace(/text-teal-900/g, 'text-white');

// Accents to Orange (#ff5722)
content = content.replace(/bg-\[#6366f1\]/g, 'bg-[#ff5722]');
content = content.replace(/text-\[#6366f1\]/g, 'text-[#ff5722]');
content = content.replace(/text-\[#4f46e5\]/g, 'text-[#ff5722]');
content = content.replace(/to-\[#4f46e5\]/g, 'to-[#ff5722]');

// Glassmorphism cards and elements
// Let's replace "bg-white " (with space) or 'bg-white"' with 'bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl'
content = content.replace(/bg-white([\s"])/g, 'bg-white/20 backdrop-blur-xl border-white/40 shadow-xl');

// Adjust the borders
content = content.replace(/border-slate-50/g, 'border-white/30');
content = content.replace(/border-slate-100/g, 'border-white/30');
content = content.replace(/border-slate-200\/50/g, 'border-white/40');
content = content.replace(/border-slate-200/g, 'border-white/40');

// Other slate backgrounds (buttons, inputs)
content = content.replace(/bg-slate-50/g, 'bg-white/10');
content = content.replace(/bg-slate-100/g, 'bg-white/10');
content = content.replace(/bg-slate-200/g, 'bg-white/20');

// Custom backgrounds that were mapped to indigo earlier
content = content.replace(/bg-\[#e0e7ff\]/g, 'bg-white/30'); // light blue -> light glass
content = content.replace(/border-\[#c7d2fe\]/g, 'border-white/50');
content = content.replace(/bg-\[#a5b4fc\]/g, 'bg-[#ff5722]/40');
content = content.replace(/bg-\[#818cf8\]/g, 'bg-[#ff5722]/70');

// Bottom Nav
content = content.replace(/bg-\[#1c1c1e\]/g, 'bg-white/20 backdrop-blur-2xl border border-white/40 shadow-2xl');
content = content.replace(/hover:bg-black/g, 'hover:bg-[#ff5722]/80');
content = content.replace(/bg-white\/20 backdrop-blur-xl border-white\/40 shadow-xl\/10/g, 'bg-white/10');
content = content.replace(/bg-white\/20 backdrop-blur-xl border-white\/40 shadow-xl\/20/g, 'bg-white/20');

// Fix toggle buttons: checked ? 'bg-[#ff5722]' : 'bg-slate-200' -> 'bg-white/20'
// Just to be sure, any specific text
content = content.replace(/text-white drop-shadow-md drop-shadow-md/g, 'text-white drop-shadow-md');

fs.writeFileSync('src/pages/StudentPortal.jsx', content);
console.log("Done");
