const fs = require('fs');
let content = fs.readFileSync('src/pages/public/LiveMap.tsx', 'utf8');

const replacement = `import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MockAPI } from '../../services/mockApi';
import { Incident } from '../../types';

export function LiveMap() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      const data = await MockAPI.getIncidents();
      const active = data.filter(i => !['resolved', 'dismissed'].includes(i.status));
      setIncidents(active);
      if (active.length > 0) {
        setSelectedIncident(active[0]);
      }
    };
    fetchIncidents();
  }, []);

  return (
    <div className="bg-surface font-body-md text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed w-full h-screen overflow-hidden">
      <main className="relative w-full h-full overflow-hidden">
        <div className="flex flex-col w-full h-full bg-inverse-surface overflow-hidden relative">
          
          {/* Map Background simulated via CSS */}
          <div className="absolute inset-0 w-full h-full map-bg opacity-30 pointer-events-none" data-location="Palghar"></div>

          {/* Public Header Overlay */}
          <header className="absolute top-0 left-0 right-0 h-16 bg-inverse-surface/80 backdrop-blur-md z-30 flex items-center justify-between px-margin-desktop border-b border-outline/20">
            <div className="flex items-center gap-stack-lg">
              <Link to="/" className="flex items-center gap-stack-sm hover:opacity-90 transition-opacity">
                <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center shadow-lg shadow-primary-container/20">
                  <span className="material-symbols-outlined text-on-primary text-[24px]">shield</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-on-surface-variant text-[10px] tracking-widest text-primary-fixed-dim">PALGHAR DISTRICT</span>
                  <span className="font-headline-sm text-surface-bright leading-none text-[18px]">ResQAI <span className="text-primary-fixed text-[12px] font-data-mono">PUBLIC GIS</span></span>
                </div>
              </Link>
              <nav className="hidden md:flex items-center gap-stack-lg ml-stack-lg">
                <Link className="font-label-caps text-on-surface-variant hover:text-surface-bright transition-colors" to="/">Home</Link>
                <Link className="font-label-caps text-primary-fixed font-bold border-b-2 border-primary-fixed pb-1" to="/live-map">Live Map</Link>
                <Link className="font-label-caps text-on-surface-variant hover:text-surface-bright transition-colors" to="/live-map">Alerts</Link>
                <Link className="font-label-caps text-on-surface-variant hover:text-surface-bright transition-colors" to="/">Safety Guidelines</Link>
              </nav>
            </div>
            <div className="flex items-center gap-stack-md">
              <Link to="/report" className="bg-error hover:bg-error/90 text-on-error px-4 py-2 rounded-lg font-label-caps text-xs shadow-md transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">emergency</span>
                Report Emergency
              </Link>
              <Link to="/auth/select" className="bg-surface-container-high/20 hover:bg-surface-container-high/30 text-surface-bright px-4 py-2 rounded-lg font-label-caps text-xs border border-outline/30 transition-all">
                Login
              </Link>
            </div>
          </header>

          {/* Top Alert Banner Overlay */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 max-w-2xl w-full px-4">
            <div className="bg-error/10 border border-error/50 rounded-xl p-3 flex items-start gap-3 backdrop-blur-md shadow-lg">
              <span className="material-symbols-outlined text-error mt-0.5">warning</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-error text-[10px] tracking-wider">OFFICIAL ALERT</span>
                <span className="font-body-sm text-surface-bright">Heavy rainfall warning active for next 48 hours. Avoid low-lying areas.</span>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 pt-16 pb-10 z-10 pointer-events-auto">
            {/* Map Filters Overlay */}
            <div className="absolute top-6 left-6 z-20 bg-inverse-surface/85 backdrop-blur-md p-4 rounded-xl border border-outline/30 shadow-2xl w-64">
              <h3 className="font-label-caps text-on-surface-variant mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">layers</span> Map Layers
              </h3>
              <div className="flex flex-col gap-3 font-body-sm text-surface-bright">
                <label className="flex items-center gap-2 cursor-pointer hover:text-primary-fixed transition-colors">
                  <input defaultChecked className="accent-primary rounded" type="checkbox" />
                  <span className="w-2.5 h-2.5 rounded-full bg-error inline-block"></span> Active Disasters
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-primary-fixed transition-colors">
                  <input defaultChecked className="accent-primary rounded" type="checkbox" />
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary-container inline-block"></span> Warnings & Alerts
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-primary-fixed transition-colors">
                  <input defaultChecked className="accent-primary rounded" type="checkbox" />
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container inline-block"></span> Official Advisories
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-primary-fixed transition-colors">
                  <input defaultChecked className="accent-primary rounded" type="checkbox" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Relief / Safety Points
                </label>
              </div>
            </div>

            {/* Selected Incident Floating Card */}
            {selectedIncident && (
              <div className="absolute bottom-16 right-6 z-20 w-96 bg-inverse-surface/90 backdrop-blur-md p-5 rounded-xl border border-error/40 shadow-2xl flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={\`px-2 py-0.5 rounded text-error font-label-caps text-[10px] \${selectedIncident.aiAnalysis?.severity === 'critical' ? 'bg-error/20 text-error' : 'bg-secondary/20 text-secondary'}\`}>
                      {selectedIncident.aiAnalysis?.severity?.toUpperCase() || 'ALERT'}
                    </span>
                    <span className="font-data-mono text-outline-variant text-xs">ID: {selectedIncident.id.replace('inc_', 'INC-').toUpperCase()}</span>
                  </div>
                  <span className="font-data-mono text-xs text-secondary-fixed">Status: {selectedIncident.status.replace('_', ' ')}</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-surface-bright text-lg">{selectedIncident.title.toUpperCase()}</h3>
                  <p className="font-body-sm text-outline-variant flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">location_on</span> {selectedIncident.location.address}
                  </p>
                </div>
                <div className="bg-inverse-surface/60 p-3 rounded-lg border border-outline/20 flex flex-col gap-1">
                  <span className="font-label-caps text-[10px] text-primary-fixed">PUBLIC ADVISORY</span>
                  <p className="font-body-sm text-surface-bright">{selectedIncident.description}</p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-data-mono text-[11px] text-outline-variant">Reported: {new Date(selectedIncident.timestamp).toLocaleTimeString()}</span>
                  <button className="bg-primary hover:bg-primary/90 text-on-primary px-3 py-1.5 rounded-lg font-label-caps text-xs transition-all flex items-center gap-1">
                    View Full Alert <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* Map Legend (Compact Floating) */}
            <div className="absolute bottom-16 left-6 z-20 bg-inverse-surface/85 backdrop-blur-md px-3 py-2 rounded-xl border border-outline/30 shadow-2xl flex items-center gap-4 text-xs font-body-sm text-surface-bright">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-error"></span> Disaster</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary-container"></span> Warning</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary-container"></span> Advisory</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Relief</div>
            </div>

            {/* Map Controls (Zoom, Location, Layers) */}
            <div className="absolute top-36 right-6 z-20 flex flex-col gap-2">
              <div className="bg-inverse-surface/85 backdrop-blur-md rounded-xl border border-outline/30 shadow-2xl flex flex-col overflow-hidden">
                <button className="p-2.5 text-surface-bright hover:bg-surface-container-high/20 transition-colors" title="Zoom In"><span className="material-symbols-outlined text-[20px]">add</span></button>
                <div className="h-[1px] bg-outline/20 w-full"></div>
                <button className="p-2.5 text-surface-bright hover:bg-surface-container-high/20 transition-colors" title="Zoom Out"><span className="material-symbols-outlined text-[20px]">remove</span></button>
              </div>
              <button className="bg-inverse-surface/85 backdrop-blur-md p-2.5 rounded-xl border border-outline/30 shadow-2xl text-surface-bright hover:bg-surface-container-high/20 transition-colors" title="Locate Me">
                <span className="material-symbols-outlined text-[20px]">my_location</span>
              </button>
              <button className="bg-inverse-surface/85 backdrop-blur-md p-2.5 rounded-xl border border-outline/30 shadow-2xl text-surface-bright hover:bg-surface-container-high/20 transition-colors" title="Layers">
                <span className="material-symbols-outlined text-[20px]">layers</span>
              </button>
            </div>

            {/* Tactical Map Pins */}
            {incidents.map((incident, idx) => {
              const top = 30 + (idx * 20 % 50);
              const left = 30 + (idx * 25 % 60);
              const severity = incident.aiAnalysis?.severity || 'medium';
              const colorClass = severity === 'critical' ? 'error' : severity === 'high' ? 'secondary-container' : 'primary-container';
              const icon = severity === 'critical' ? 'location_on' : severity === 'high' ? 'warning' : 'info';
              const textColorClass = severity === 'critical' ? 'on-error' : \`on-\${colorClass}\`;

              return (
                <div 
                  key={incident.id} 
                  className={\`absolute z-10 flex flex-col items-center cursor-pointer \${severity === 'critical' ? 'animate-bounce' : ''}\`}
                  style={{ top: \`\${top}%\`, left: \`\${left}%\` }}
                  onClick={() => setSelectedIncident(incident)}
                >
                  <span className={\`px-2 py-0.5 bg-\${colorClass} text-\${textColorClass} font-data-mono text-[10px] rounded shadow-lg truncate max-w-[150px]\`}>
                    {incident.title}
                  </span>
                  <span className={\`material-symbols-outlined text-\${colorClass} text-[32px]\`}>{icon}</span>
                </div>
              );
            })}
          </div>

          {/* Bottom Minimal Status Bar */}
          <footer className="absolute bottom-0 left-0 right-0 h-10 bg-inverse-surface/95 backdrop-blur-md z-30 flex items-center justify-between px-margin-desktop border-t border-outline/20 font-data-mono text-[12px] text-outline-variant">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> LIVE FEED ACTIVE
              </span>
              <span className="text-outline/40">|</span>
              <span className="">Last updated: Just now</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="">Active Incidents: <strong className="text-surface-bright">{incidents.length}</strong></span>
              <span className="">Critical: <strong className="text-error">{incidents.filter(i => i.aiAnalysis?.severity === 'critical').length}</strong></span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
`;
fs.writeFileSync('src/pages/public/LiveMap.tsx', replacement);
