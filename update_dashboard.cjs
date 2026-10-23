const fs = require('fs');
let content = fs.readFileSync('src/pages/authority/Dashboard.tsx', 'utf8');

const replacement = `import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockAPI } from '../../services/mockApi';
import { Incident } from '../../types';

export function Dashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      const data = await MockAPI.getIncidents();
      setIncidents(data.filter(i => !['resolved', 'dismissed'].includes(i.status)));
    };
    fetchIncidents();
  }, []);

  return (
    <main className="flex-1 relative w-full h-full bg-slate-900 overflow-hidden">
      {/* Map Background Layer */}
      <div className="absolute inset-0 w-full h-full map-bg" data-location="San Francisco"></div>
      
      {/* Overlay Gradients / Atmospherics (Simulating map UI) */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none"></div>
      
      {incidents.map((incident, idx) => {
        // Randomize position a bit for visual effect if lat/lng are the same
        const top = 20 + (idx * 25 % 60);
        const left = 20 + (idx * 30 % 60);
        const severity = incident.aiAnalysis?.severity || 'medium';
        const colorClass = severity === 'critical' ? 'error' : severity === 'high' ? 'secondary' : 'primary';

        return (
          <div key={incident.id} className="absolute flex flex-col items-center" style={{ top: \`\${top}%\`, left: \`\${left}%\`, transform: 'translate(-50%, -50%)' }}>
            <div className={\`bg-surface-container-lowest border border-\${colorClass} px-3 py-2 rounded shadow-lg mb-2 relative z-10 \${severity === 'critical' ? 'animate-pulse' : ''}\`}>
              <div className="flex items-center gap-2">
                <span className={\`material-symbols-outlined text-\${colorClass} text-sm\`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {severity === 'critical' ? 'water_drop' : 'warning'}
                </span>
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface truncate max-w-[120px]">{incident.title}</p>
                  <p className="font-data-mono text-data-mono text-on-surface-variant text-[10px]">{incident.id.replace('inc_', 'INC-').toUpperCase()}</p>
                </div>
              </div>
              <div className={\`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-container-lowest border-r border-b border-\${colorClass} transform rotate-45\`}></div>
            </div>
            <div className={\`w-4 h-4 bg-\${colorClass} rounded-full border-2 border-white shadow-md relative\`}>
              <div className={\`absolute inset-0 bg-\${colorClass} rounded-full \${severity === 'critical' ? 'animate-ping' : ''} opacity-75\`}></div>
            </div>
          </div>
        );
      })}

      {/* Map Controls (Bottom Right) */}
      <div className="absolute bottom-margin-desktop flex flex-col gap-2 z-10 hidden lg:flex right-[276px]">
        <button className="w-10 h-10 bg-surface-container-lowest border border-outline-variant rounded shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">add</span>
        </button>
        <button className="w-10 h-10 bg-surface-container-lowest border border-outline-variant rounded shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">remove</span>
        </button>
        <button className="w-10 h-10 bg-surface-container-lowest border border-outline-variant rounded shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors mt-2">
          <span className="material-symbols-outlined">my_location</span>
        </button>
        <button className="w-10 h-10 bg-surface-container-lowest border border-outline-variant rounded shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">layers</span>
        </button>
      </div>
      
      {/* Right Sidebar: Incident Panel */}
      <aside className="absolute top-margin-desktop bottom-margin-desktop right-margin-desktop w-[340px] glass-panel rounded-xl flex flex-col z-20 shadow-lg hidden lg:flex overflow-hidden bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant">
        <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest/50">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Active Incidents</h3>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface">filter_list</span>
        </div>
        <div className="flex-1 overflow-y-auto p-stack-sm space-y-stack-sm">
          {incidents.length === 0 && (
            <p className="text-center text-on-surface-variant text-sm py-4">No active incidents.</p>
          )}
          {incidents.map(incident => {
            const severity = incident.aiAnalysis?.severity || 'medium';
            const colorClass = severity === 'critical' ? 'error' : severity === 'high' ? 'secondary' : 'primary';
            const isOpacity = severity !== 'critical' && severity !== 'high';
            
            return (
              <div key={incident.id} onClick={() => navigate(\`/admin/incidents/\${incident.id}\`)} className={\`bg-surface-container-lowest border border-\${colorClass}/30 rounded-lg p-3 hover:border-\${colorClass} transition-colors cursor-pointer group \${isOpacity ? 'opacity-80 hover:opacity-100' : ''}\`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={\`w-2 h-2 rounded-full bg-\${colorClass}\`}></span>
                    <span className={\`font-label-caps text-label-caps text-\${colorClass}\`}>{severity.toUpperCase()}</span>
                  </div>
                  <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px]">{incident.id.replace('inc_', 'INC-').toUpperCase()}</span>
                </div>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface mb-1 truncate">{incident.title}</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-3 flex items-center gap-1 truncate">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {incident.location.address || 'Unknown'}
                </p>
                <div className="flex justify-between items-end border-t border-outline-variant/50 pt-2">
                  <div className="flex -space-x-2">
                    {incident.assignedTeam && incident.assignedTeam !== 'Unassigned' ? (
                      <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] border border-surface-container-lowest z-30 font-bold" title={incident.assignedTeam}>T</div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-[10px] border border-surface-container-lowest z-30 border-dashed" title="Pending Dispatch">...</div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="block font-label-caps text-label-caps text-on-surface-variant">{incident.status.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-outline-variant bg-surface-container-lowest/50">
          <button onClick={() => navigate('/admin/incidents/new')} className="w-full bg-primary-container text-on-primary-container py-2 rounded font-body-sm text-body-sm font-semibold hover:bg-primary-container/90 transition-colors">
            New Incident Report
          </button>
        </div>
      </aside>
    </main>
  );
}
`;
fs.writeFileSync('src/pages/authority/Dashboard.tsx', replacement);
