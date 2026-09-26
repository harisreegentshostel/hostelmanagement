const fs = require('fs');

let content = fs.readFileSync('src/pages/StudentPortal.jsx', 'utf8');

// Background gradient
content = content.replace(/bg-gradient-to-br from-\[\#ffd1ba\] via-\[\#ffb6c1\] to-\[\#d492f5\]/g, 'bg-gradient-to-br from-zinc-900 via-black to-zinc-900');

// Cards and glass panels
content = content.replace(/bg-white\/20 backdrop-blur-xl border-white\/40 shadow-xl/g, 'bg-white/10 backdrop-blur-2xl border-white/10 shadow-2xl');
content = content.replace(/bg-white\/20 backdrop-blur-2xl border border-white\/40 shadow-2xl/g, 'bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl');

// Orange accents
content = content.replace(/bg-\[\#ff5722\]\/40/g, 'bg-white/20');
content = content.replace(/bg-\[\#ff5722\]\/70/g, 'bg-white/50');
content = content.replace(/bg-\[\#ff5722\]/g, 'bg-white');

content = content.replace(/text-\[\#ff5722\]/g, 'text-zinc-900');
content = content.replace(/text-indigo-900/g, 'text-zinc-900');
content = content.replace(/ring-\[\#6366f1\]/g, 'ring-white');
content = content.replace(/ring-\[\#ff5722\]/g, 'ring-white');

// Card headers/colors specific
content = content.replace(/bg-gradient-to-br from-\[\#6366f1\] to-\[\#ff5722\]/g, 'bg-gradient-to-br from-zinc-700 to-zinc-900');

// Toggles active state
// Was: bg-white/30 text-[#ff5722]
content = content.replace(/bg-white\/30 text-zinc-900/g, 'bg-white text-black'); // since we just replaced text-[#ff5722] with text-zinc-900

// Inactive toggles
// bg-white/10 text-white/60 - this is fine

fs.writeFileSync('src/pages/StudentPortal.jsx', content);
