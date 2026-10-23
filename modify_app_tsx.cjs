const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

appContent = appContent.replace(
  /<Route path="\/report" element={<CitizenLayout \/>}>\s*<Route index element={<ReportIncident \/>} \/>\s*<\/Route>/g,
  '<Route path="/report" element={<CitizenDashboard />} />'
);

// We need to move dashboard outside of CitizenLayout
appContent = appContent.replace(
  /<Route path="\/citizen" element={<CitizenLayout \/>}>\s*<Route index element={<Navigate to="\/citizen\/dashboard" replace \/>} \/>\s*<Route path="dashboard" element={<CitizenDashboard \/>} \/>\s*<\/Route>/g,
  `<Route path="/citizen" element={<Navigate to="/citizen/dashboard" replace />} />
          <Route path="/citizen/dashboard" element={<CitizenDashboard />} />`
);

fs.writeFileSync('src/App.tsx', appContent);
console.log('App.tsx updated');
