const fs = require('fs');
const { glob } = require('tinyglobby');
(async () => {
  const files = await glob(['src/**/*.{jsx,css}']);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/size=\{18\}/g, 'className="w-5 h-5"');
    content = content.replace(/size=\{16\}/g, 'className="w-4 h-4"');
    
    // Also we need to merge classNames if it looks like <Check className="w-5 h-5" className="text-green-500 mx-auto" />
    // This is because FoodManagement.jsx has <Check size={18} className="text-green-500 mx-auto" />
    // which would become <Check className="w-5 h-5" className="text-green-500 mx-auto" /> (invalid JSX).
    
    content = content.replace(/className="w-5 h-5"\s+className="([^"]+)"/g, 'className="w-5 h-5 "');
    content = content.replace(/className="w-4 h-4"\s+className="([^"]+)"/g, 'className="w-4 h-4 "');
    
    // Check for absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size={18}
    // That means it had className="..." size={18}. So it becomes className="..." className="w-5 h-5"
    content = content.replace(/className="([^"]+)"\s+className="w-5 h-5"/g, 'className=" w-5 h-5"');
    content = content.replace(/className="([^"]+)"\s+className="w-4 h-4"/g, 'className=" w-4 h-4"');

    fs.writeFileSync(file, content);
  }
})();
