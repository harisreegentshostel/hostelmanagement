const fs = require('fs');
const { glob } = require('tinyglobby');

const lucideToHero = {
  'LayoutDashboard': 'Squares2X2Icon',
  'Users': 'UsersIcon',
  'CreditCard': 'CreditCardIcon',
  'Utensils': 'ShoppingBagIcon',
  'LogOut': 'ArrowRightOnRectangleIcon',
  'CheckCircle': 'CheckCircleIcon',
  'Home': 'HomeIcon',
  'Calendar': 'CalendarIcon',
  'MessageSquare': 'ChatBubbleLeftIcon',
  'Settings': 'Cog8ToothIcon',
  'Bell': 'BellIcon',
  'MapPin': 'MapPinIcon',
  'ChevronRight': 'ChevronRightIcon',
  'User': 'UserIcon',
  'Coffee': 'SunIcon', 
  'Sun': 'FireIcon', 
  'Moon': 'MoonIcon',
  'Activity': 'ChartBarIcon',
  'Check': 'CheckIcon',
  'X': 'XMarkIcon',
  'Edit': 'PencilSquareIcon',
  'Search': 'MagnifyingGlassIcon',
  'UserPlus': 'UserPlusIcon'
};

(async () => {
  const files = await glob(['src/**/*.{jsx,css}']);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('lucide-react')) {
      const regex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"];?/;
      const match = content.match(regex);
      if (match) {
        const symbols = match[1].split(',').map(s => s.trim()).filter(s => s);
        let heroImports = [];
        symbols.forEach(sym => {
          if (lucideToHero[sym]) {
             heroImports.push(lucideToHero[sym] + ' as ' + sym);
          } else {
             heroImports.push('SparklesIcon as ' + sym);
          }
        });
        const newImport = "import { " + heroImports.join(', ') + " } from '@heroicons/react/24/outline';";
        content = content.replace(regex, newImport);
        
        // Let's replace size={14} -> className="w-3 h-3" etc.
        content = content.replace(/size=\{14\}/g, 'className="w-4 h-4"');
        content = content.replace(/size=\{20\}/g, 'className="w-5 h-5"');
        content = content.replace(/size=\{22\}/g, 'className="w-6 h-6"');
        content = content.replace(/size=\{24\}/g, 'className="w-6 h-6"');
        content = content.replace(/size=\{48\}/g, 'className="w-12 h-12"');
        
        fs.writeFileSync(file, content);
      }
    }
  }
})();
