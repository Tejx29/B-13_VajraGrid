const fs = require('fs');
let content = fs.readFileSync('src/services/mockApi.ts', 'utf8');

// Replace the let incidents = [...] declaration to use localStorage
const newContent = content.replace(
  /let incidents: Incident\[\] = \[\s*\{[\s\S]*?\}\s*\];/g,
  `const INCIDENTS_KEY = 'resqai_incidents';
let initialIncidents: Incident[] = ${content.match(/let incidents: Incident\[\] = (\[\s*\{[\s\S]*?\}\s*\]);/)[1]};

const getPersistedIncidents = (): Incident[] => {
  const saved = localStorage.getItem(INCIDENTS_KEY);
  if (saved) return JSON.parse(saved);
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(initialIncidents));
  return initialIncidents;
};

const saveIncidents = (data: Incident[]) => {
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(data));
};

let incidents = getPersistedIncidents();`
);

// We need to update MockAPI methods to saveIncidents
const finalContent = newContent
  .replace(/incidents = \[\s*newIncident, \.\.\.incidents\s*\];/g, 'incidents = [newIncident, ...incidents];\n    saveIncidents(incidents);')
  .replace(/incidents = incidents\.map\(/g, 'incidents = incidents.map(')
  .replace(/incidents = (incidents\.map\(inc => inc\.id === id \? \{ \.\.\.inc, status \} : inc\));/g, 'incidents = $1;\n    saveIncidents(incidents);')
  .replace(/incidents = (incidents\.map\(inc => inc\.id === id \? \{ \.\.\.inc, reliefDetails: details \} : inc\));/g, 'incidents = $1;\n    saveIncidents(incidents);')
  .replace(/incidents = (incidents\.map\(inc => inc\.id === incidentId \? \{ \.\.\.inc, assignedTeam: volunteer\?\.name \|\| 'Assigned Team', status: 'assigned' \} : inc\));/g, 'incidents = $1;\n    saveIncidents(incidents);')
  
fs.writeFileSync('src/services/mockApi.ts', finalContent);
