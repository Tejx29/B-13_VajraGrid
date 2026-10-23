const fs = require('fs');
let content = fs.readFileSync('src/services/mockApi.ts', 'utf8');

const newContent = content.replace(
  /getIncidents: async \(\) => {[\s\S]*?return \[\.\.\.incidents\];/,
  `getIncidents: async () => {
    await delay(200);
    incidents = getPersistedIncidents(); // re-read from local storage for cross-tab sync
    return [...incidents];`
);

fs.writeFileSync('src/services/mockApi.ts', newContent);
