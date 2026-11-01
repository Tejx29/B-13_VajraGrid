const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove routes
content = content.replace(/<Route path="citizen\/login" element=\{<CitizenLogin \/>} \/>/g, '');
content = content.replace(/<Route path="citizen\/register" element=\{<CitizenRegister \/>} \/>/g, '');

// Remove imports
content = content.replace(/import \{ CitizenLogin \} from '\.\/pages\/auth\/CitizenLogin';/g, '');
content = content.replace(/import \{ CitizenRegister \} from '\.\/pages\/auth\/CitizenRegister';/g, '');

fs.writeFileSync('src/App.tsx', content);

let roleSelectionContent = fs.readFileSync('src/pages/auth/RoleSelection.tsx', 'utf8');
roleSelectionContent = roleSelectionContent.replace(/to="\/auth\/citizen\/login"/g, 'to="/report"');
fs.writeFileSync('src/pages/auth/RoleSelection.tsx', roleSelectionContent);

