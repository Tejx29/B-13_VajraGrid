const fs = require('fs');
let content = fs.readFileSync('src/pages/authority/Incidents.tsx', 'utf8');

content = content.replace(
  /useEffect\(\(\) => \{\s*MockAPI\.getIncidents\(\)\.then\(data => \{\s*setIncidents\(data\);\s*setIsLoading\(false\);\s*\}\);\s*\}, \[\]\);/g,
  `useEffect(() => {
    const fetchIncidents = () => {
      MockAPI.getIncidents().then(data => {
        setIncidents(data);
        setIsLoading(false);
      });
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, []);`
);
fs.writeFileSync('src/pages/authority/Incidents.tsx', content);
