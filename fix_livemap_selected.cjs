const fs = require('fs');
let content = fs.readFileSync('src/pages/public/LiveMap.tsx', 'utf8');

content = content.replace(
  /if \(active\.length > 0\) \{\s*setSelectedIncident\(active\[0\]\);\s*\}/g,
  `setSelectedIncident(prev => prev ? (active.find(i => i.id === prev.id) || active[0] || null) : (active[0] || null));`
);

fs.writeFileSync('src/pages/public/LiveMap.tsx', content);
