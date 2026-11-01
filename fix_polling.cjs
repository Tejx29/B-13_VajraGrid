const fs = require('fs');

function addPolling(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('setInterval')) return;
  
  content = content.replace(
    /fetchIncidents\(\);\s*\}, \[\]\);/g,
    `fetchIncidents();
    const interval = setInterval(() => {
      fetchIncidents();
    }, 5000);
    return () => clearInterval(interval);
  }, []);`
  );
  fs.writeFileSync(file, content);
}

addPolling('src/pages/authority/Dashboard.tsx');
addPolling('src/pages/public/LiveMap.tsx');

let incidentsContent = fs.readFileSync('src/pages/authority/Incidents.tsx', 'utf8');
if (!incidentsContent.includes('setInterval')) {
  incidentsContent = incidentsContent.replace(
    /fetchIncidents\(\);\s*\}, \[\]\);/g,
    `fetchIncidents();
    const interval = setInterval(() => {
      fetchIncidents();
    }, 5000);
    return () => clearInterval(interval);
  }, []);`
  );
  fs.writeFileSync('src/pages/authority/Incidents.tsx', incidentsContent);
}

