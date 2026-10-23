const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace("import { ReportIncident } from './pages/citizen/ReportIncident';", "");
fs.writeFileSync('src/App.tsx', appContent);
