import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface NodeSector {
  id: string;
  name: string;
  taluka: string;
  lat: number;
  lng: number;
  xPct: number; // percentage in visual canvas (0-100)
  yPct: number;
  status: 'critical' | 'warning' | 'normal' | 'dispatched';
  metric: string;
  metricLabel: string;
  hazard: string;
  summary: string;
  linkTo: string;
}

const PALGHAR_SECTORS: NodeSector[] = [
  {
    id: 'surya-basin',
    name: 'Surya River Basin',
    taluka: 'Manor / Palghar',
    lat: 19.7214,
    lng: 72.8512,
    xPct: 52,
    yPct: 40,
    status: 'critical',
    metric: '4,200 cusecs',
    metricLabel: 'Surge Discharge',
    hazard: 'Flash Flood Hazard',
    summary: 'Water level +1.4m above amber mark; continuous Doppler radar monitoring active.',
    linkTo: '/live-map?incident=surya'
  },
  {
    id: 'palghar-hq',
    name: 'Palghar Central Command',
    taluka: 'Palghar City',
    lat: 19.6967,
    lng: 72.7699,
    xPct: 35,
    yPct: 52,
    status: 'normal',
    metric: '99.8% Sync',
    metricLabel: 'Mesh Uptime',
    hazard: 'Operations Center',
    summary: 'District EOC master node. 14 response teams stand-by, real-time dispatch active.',
    linkTo: '/live-map'
  },
  {
    id: 'manor-junction',
    name: 'Manor Junction EOC',
    taluka: 'Manor',
    lat: 19.6542,
    lng: 72.9123,
    xPct: 62,
    yPct: 58,
    status: 'warning',
    metric: 'NH-48 Alert',
    metricLabel: 'Corridor Status',
    hazard: 'Waterlogging Risk',
    summary: 'Submerged underpass bypass activated. Traffic diversion via Boisar link route.',
    linkTo: '/live-map'
  },
  {
    id: 'dahanu-coast',
    name: 'Dahanu Coastal Station',
    taluka: 'Dahanu',
    lat: 19.9723,
    lng: 72.7311,
    xPct: 28,
    yPct: 22,
    status: 'normal',
    metric: '1.8m High Tide',
    metricLabel: 'Tidal Swell',
    hazard: 'Coastal Monitoring',
    summary: 'Tidal gauges normal. Cyclone wind velocity under 32 km/h. Sea wall stable.',
    linkTo: '/live-map'
  },
  {
    id: 'jawhar-ghats',
    name: 'Jawhar Highlands',
    taluka: 'Jawhar',
    lat: 19.9142,
    lng: 73.2312,
    xPct: 82,
    yPct: 28,
    status: 'warning',
    metric: '72mm / 3hr',
    metricLabel: 'Ghat Rainfall',
    hazard: 'Slope Landslide Risk',
    summary: 'Heavy precipitation over Ghat pass. Slope inclinometers reporting minor slip warning.',
    linkTo: '/live-map'
  },
  {
    id: 'wada-staging',
    name: 'Wada Logistics Base',
    taluka: 'Wada',
    lat: 19.6521,
    lng: 73.1345,
    xPct: 74,
    yPct: 75,
    status: 'normal',
    metric: '840 Ration Kits',
    metricLabel: 'Relief Staged',
    hazard: 'Supply Depot',
    summary: 'Clean drinking water & rescue boats mobilized for Surya river evacuation staging.',
    linkTo: '/live-map'
  }
];

// Vector conduits connecting sectors into the "VajraGrid"
const MESH_CONDUITS: [number, number][] = [
  [0, 1], // Surya -> Palghar HQ
  [0, 2], // Surya -> Manor
  [1, 2], // Palghar HQ -> Manor
  [3, 0], // Dahanu -> Surya
  [3, 1], // Dahanu -> Palghar
  [2, 5], // Manor -> Wada
  [0, 4], // Surya -> Jawhar
  [4, 5]  // Jawhar -> Wada
];

type MotionMode = 'radar' | 'mesh' | 'surge';

export function VajraGridMotionVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<MotionMode>('radar');
  const [selectedNode, setSelectedNode] = useState<NodeSector>(PALGHAR_SECTORS[0]);
  const [hoveredNode, setHoveredNode] = useState<NodeSector | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isPlaying, setIsPlaying] = useState(true);
  const [pulseCount, setPulseCount] = useState(148);

  // Track user mouse over canvas for dynamic tactical HUD crosshair
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setMousePos({ x, y });
  }, []);

  // Main 60fps Canvas Motion Graphics Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0; // radar rotation angle
    let packetOffset = 0; // data packet traversal along conduits
    let waveRadius = 0; // Doppler / flood surge wave
    let lightningTimer = 0;

    // Handle high DPI displays
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      if (!isPlaying) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Radar center point anchored around Palghar HQ / Surya Valley
      const centerX = w * 0.48;
      const centerY = h * 0.46;
      const maxRadarRadius = Math.max(w, h) * 0.75;

      // 1. Draw Range Rings & Polar Grid
      ctx.lineWidth = 1;
      const ringRadii = [60, 130, 210, 300];
      ringRadii.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 1 ? 'rgba(79, 141, 255, 0.22)' : 'rgba(79, 141, 255, 0.08)';
        ctx.stroke();

        // Range text in km
        if (w > 360) {
          ctx.fillStyle = 'rgba(160, 166, 178, 0.45)';
          ctx.font = '9px monospace';
          ctx.fillText(`${(idx + 1) * 15}km`, centerX + r + 4, centerY - 4);
        }
      });

      // Crosshairs through radar center
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(79, 141, 255, 0.12)';
      ctx.moveTo(centerX - 320, centerY);
      ctx.lineTo(centerX + 320, centerY);
      ctx.moveTo(centerX, centerY - 280);
      ctx.lineTo(centerX, centerY + 280);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. MODE-SPECIFIC MOTION GRAPHICS

      // A) Doppler Radar Sweep
      if (activeMode === 'radar' || activeMode === 'surge') {
        angle = (angle + 0.024) % (Math.PI * 2);

        // Sweep gradient sector
        const sweepGradient = ctx.createRadialGradient(
          centerX, centerY, 5,
          centerX, centerY, maxRadarRadius
        );
        sweepGradient.addColorStop(0, 'rgba(79, 141, 255, 0.4)');
        sweepGradient.addColorStop(0.5, 'rgba(79, 141, 255, 0.1)');
        sweepGradient.addColorStop(1, 'rgba(79, 141, 255, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, maxRadarRadius, angle - 0.45, angle);
        ctx.closePath();
        ctx.fillStyle = sweepGradient;
        ctx.fill();

        // Leading edge bright beam
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * maxRadarRadius,
          centerY + Math.sin(angle) * maxRadarRadius
        );
        ctx.strokeStyle = 'rgba(117, 169, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#4F8DFF';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }

      // B) Surge Wave / Flood Doppler rings (expanding concentric circles)
      waveRadius = (waveRadius + 1.2) % 240;
      const suryaNode = PALGHAR_SECTORS[0];
      const suryaX = (suryaNode.xPct / 100) * w;
      const suryaY = (suryaNode.yPct / 100) * h;

      if (activeMode === 'surge' || activeMode === 'radar') {
        const waves = [waveRadius, (waveRadius + 80) % 240, (waveRadius + 160) % 240];
        waves.forEach((r) => {
          const alpha = Math.max(0, 1 - r / 240) * (activeMode === 'surge' ? 0.7 : 0.35);
          ctx.beginPath();
          ctx.arc(suryaX, suryaY, r, 0, Math.PI * 2);
          ctx.strokeStyle = activeMode === 'surge' 
            ? `rgba(229, 57, 70, ${alpha})`
            : `rgba(79, 141, 255, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }

      // C) Vajra Mesh Conduits & Traveling Data Packets
      packetOffset = (packetOffset + 0.008) % 1;

      MESH_CONDUITS.forEach(([fromIdx, toIdx], conduitIdx) => {
        const from = PALGHAR_SECTORS[fromIdx];
        const to = PALGHAR_SECTORS[toIdx];
        const x1 = (from.xPct / 100) * w;
        const y1 = (from.yPct / 100) * h;
        const x2 = (to.xPct / 100) * w;
        const y2 = (to.yPct / 100) * h;

        // Base Conduit Wire
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = activeMode === 'mesh'
          ? 'rgba(79, 141, 255, 0.35)'
          : 'rgba(79, 141, 255, 0.16)';
        ctx.lineWidth = activeMode === 'mesh' ? 1.5 : 1;
        ctx.stroke();

        // Glowing Data Packets traveling along conduit
        const progress = (packetOffset + conduitIdx * 0.15) % 1;
        const px = x1 + (x2 - x1) * progress;
        const py = y1 + (y2 - y1) * progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, activeMode === 'mesh' ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = activeMode === 'mesh' ? '#F5A23A' : '#4F8DFF';
        ctx.shadowColor = activeMode === 'mesh' ? '#F5A23A' : '#75A9FF';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      // D) Vajra Energy Arc (Thunderbolt / Lightning Pulse between high-priority nodes)
      lightningTimer++;
      if (activeMode === 'mesh' && lightningTimer % 90 > 75) {
        // Draw segmented lightning beam from Palghar HQ to Surya Basin
        const p1 = PALGHAR_SECTORS[1];
        const p2 = PALGHAR_SECTORS[0];
        const lx1 = (p1.xPct / 100) * w;
        const ly1 = (p1.yPct / 100) * h;
        const lx2 = (p2.xPct / 100) * w;
        const ly2 = (p2.yPct / 100) * h;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(lx1, ly1);
        const segments = 6;
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const jitterX = (Math.random() - 0.5) * 16;
          const jitterY = (Math.random() - 0.5) * 16;
          ctx.lineTo(lx1 + (lx2 - lx1) * t + jitterX, ly1 + (ly2 - ly1) * t + jitterY);
        }
        ctx.lineTo(lx2, ly2);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#4F8DFF';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw Tactical Sector Nodes
      PALGHAR_SECTORS.forEach((sector) => {
        const nx = (sector.xPct / 100) * w;
        const ny = (sector.yPct / 100) * h;
        const isSelected = selectedNode.id === sector.id;
        const isHovered = hoveredNode?.id === sector.id;

        const color = sector.status === 'critical'
          ? '#E53946'
          : sector.status === 'warning'
            ? '#F5A23A'
            : '#16B58A';

        // Outer Reticle if selected/hovered
        if (isSelected || isHovered) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(nx, ny, 16, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.stroke();

          // 4-corner bracket marks
          const bSize = 6;
          const d = 19;
          ctx.beginPath();
          ctx.moveTo(nx - d, ny - d + bSize); ctx.lineTo(nx - d, ny - d); ctx.lineTo(nx - d + bSize, ny - d);
          ctx.moveTo(nx + d, ny - d + bSize); ctx.lineTo(nx + d, ny - d); ctx.lineTo(nx + d - bSize, ny - d);
          ctx.moveTo(nx - d, ny + d - bSize); ctx.lineTo(nx - d, ny + d); ctx.lineTo(nx - d + bSize, ny + d);
          ctx.moveTo(nx + d, ny + d - bSize); ctx.lineTo(nx + d, ny + d); ctx.lineTo(nx + d - bSize, ny + d);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }

        // Inner Beacon Core
        ctx.save();
        ctx.beginPath();
        ctx.arc(nx, ny, isSelected ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = isSelected ? 12 : 6;
        ctx.fill();
        ctx.restore();

        // Node Label
        if (w > 420) {
          ctx.fillStyle = isSelected ? '#FFFFFF' : 'rgba(244, 240, 235, 0.85)';
          ctx.font = isSelected ? 'bold 11px monospace' : '10px monospace';
          ctx.fillText(sector.name, nx + 14, ny + 4);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeMode, selectedNode, hoveredNode, isPlaying]);

  // Periodic pulse counter to emphasize live telemetry stream
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount((prev) => prev + 1);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-[500px] lg:h-[560px] rounded-2xl border border-[#38302A] bg-[#090909] shadow-2xl overflow-hidden select-none group"
      aria-label="VajraGrid Interactive Tactical Radar & Mesh Motion Visualizer"
    >
      {/* 1. Underlying Satellite Terrain Imagery with Subtle Parallax Zoom */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105 opacity-40 mix-blend-luminosity"
        style={{
          backgroundImage: "url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/11/900/1441')",
          backgroundPosition: 'center 40%',
        }}
      />

      {/* 2. Tactical Gradient Mesh & Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/60 to-[#090909]/85 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#4F8DFF_1px,transparent_1px)] [background-size:28px_28px] opacity-20 pointer-events-none" />

      {/* 3. 60fps Motion Graphics Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 cursor-crosshair pointer-events-none"
      />

      {/* 4. Interactive Node Touchpoints (DOM overlay for accessibility & crisp click/hover) */}
      <div className="absolute inset-0 z-20 pointer-events-auto">
        {PALGHAR_SECTORS.map((sector) => (
          <button
            key={sector.id}
            type="button"
            onClick={() => setSelectedNode(sector)}
            onMouseEnter={() => setHoveredNode(sector)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{
              left: `${sector.xPct}%`,
              top: `${sector.yPct}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#4F8DFF] cursor-pointer group/node"
            aria-label={`Select ${sector.name} node (${sector.hazard})`}
          >
            <span className="sr-only">{sector.name}</span>
          </button>
        ))}
      </div>

      {/* 5. Top Tactical HUD Bar */}
      <div className="absolute top-0 inset-x-0 bg-[#0B0B0A]/90 backdrop-blur-md border-b border-[#38302A] px-4 py-2.5 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16B58A] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16B58A]" />
          </span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#F5F1EC] uppercase">
            <span>VAJRA-MESH TELEMETRY</span>
            <span className="text-[#38302A] hidden sm:inline">&bull;</span>
            <span className="text-[#A0A6B2] text-[11px] font-normal hidden sm:inline">PALGHAR SECTOR</span>
          </div>
        </div>

        {/* Live Coordinate Tracker reacting to mouse / simulated reticle */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-[#A0A6B2] hidden md:inline">
            LAT {(19.60 + mousePos.y * 0.38).toFixed(4)}°N · LON {(72.70 + mousePos.x * 0.55).toFixed(4)}°E
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#4F8DFF]/15 text-[#4F8DFF] border border-[#4F8DFF]/40 font-bold">
            CYCLE #{pulseCount}
          </span>
        </div>
      </div>

      {/* 6. Mode Switcher Toolbar (Top-Right Floating Pills) */}
      <div className="absolute top-12 left-4 z-30 flex items-center gap-1 p-1 bg-[#0E0E0D]/90 border border-[#38302A] rounded-xl backdrop-blur-md shadow-lg">
        <button
          type="button"
          onClick={() => setActiveMode('radar')}
          className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeMode === 'radar'
              ? 'bg-[#4F8DFF] text-white shadow-md shadow-blue-600/30'
              : 'text-[#A0A6B2] hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>RADAR</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('mesh')}
          className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeMode === 'mesh'
              ? 'bg-[#F5A23A] text-black font-bold shadow-md shadow-amber-500/30'
              : 'text-[#A0A6B2] hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span>VAJRA MESH</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('surge')}
          className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeMode === 'surge'
              ? 'bg-[#E53946] text-white shadow-md shadow-red-600/30'
              : 'text-[#A0A6B2] hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>SURGE</span>
        </button>

        {/* Play / Pause toggle */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Motion Graphics' : 'Resume Motion Graphics'}
          className="p-1 rounded-md text-[#A0A6B2] hover:text-white hover:bg-white/10 ml-0.5"
          aria-label={isPlaying ? 'Pause radar motion' : 'Play radar motion'}
        >
          <span className="material-symbols-outlined text-[15px]">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
      </div>

      {/* 7. Active Telemetry Inspection Card (Dynamic info for selected node) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="absolute top-12 right-4 z-30 w-72 bg-[#12110F]/95 border border-[#38302A] rounded-xl shadow-2xl p-3.5 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedNode.status === 'critical'
                    ? 'bg-[#E53946] animate-ping'
                    : selectedNode.status === 'warning'
                      ? 'bg-[#F5A23A]'
                      : 'bg-[#16B58A]'
                }`}
              />
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#A0A6B2] uppercase">
                {selectedNode.hazard}
              </span>
            </div>
            <span
              className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                selectedNode.status === 'critical'
                  ? 'bg-[#851D2A]/80 text-[#FF525A] border-[#FF525A]/50'
                  : selectedNode.status === 'warning'
                    ? 'bg-[#F5A23A]/15 text-[#F5A23A] border-[#F5A23A]/40'
                    : 'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/40'
              }`}
            >
              {selectedNode.status}
            </span>
          </div>

          <div className="text-sm font-bold text-[#F5F1EC] leading-tight mb-0.5">
            {selectedNode.name}
          </div>
          <div className="text-[11px] font-mono text-[#75A9FF] mb-2">
            Taluka: {selectedNode.taluka} · {selectedNode.lat.toFixed(2)}°N, {selectedNode.lng.toFixed(2)}°E
          </div>

          <div className="bg-[#1A1815] border border-[#2B2621] rounded-lg p-2 mb-2 flex items-center justify-between">
            <span className="text-[11px] text-[#A0A6B2]">{selectedNode.metricLabel}</span>
            <span className="text-xs font-mono font-bold text-[#F5F1EC]">
              {selectedNode.metric}
            </span>
          </div>

          <p className="text-[11px] text-[#C0C4CC] leading-relaxed mb-3">
            {selectedNode.summary}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-[#26211C]">
            <span className="text-[10px] font-mono text-[#7C756E]">
              SIMULATED TELEMETRY
            </span>
            <Link
              to={selectedNode.linkTo}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F8DFF] hover:text-[#75A9FF] transition-colors"
            >
              <span>Inspect on Map</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 8. Bottom Tactical Telemetry Stream & Map Launcher */}
      <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between gap-3 bg-[#0B0B0A]/85 border border-[#38302A] rounded-xl px-3.5 py-2 backdrop-blur-md">
        {/* Animated Soundwave / Frequency bar */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-0.5 h-3">
            {[40, 90, 60, 100, 75, 45, 80].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-[#4F8DFF] rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.6 + i * 0.15}s`,
                }}
              />
            ))}
          </div>
          <div className="text-[11px] font-mono text-[#C0C4CC] hidden sm:inline">
            <span className="text-[#4F8DFF] font-bold">RADAR ACTIVE:</span> 6 Nodes Linked · Palghar EOC
          </div>
        </div>

        {/* Interactive Launch Map Link */}
        <Link
          to="/live-map"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#27211B] hover:bg-[#342c24] text-[#F5F1EC] hover:text-white border border-[#38302A] hover:border-[#4F8DFF]/40 text-xs font-semibold transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[15px] text-[#4F8DFF]">open_in_full</span>
          <span>Full GIS Map</span>
        </Link>
      </div>
    </div>
  );
}
