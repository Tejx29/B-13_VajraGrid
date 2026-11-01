import React, { useEffect, useRef, useState } from 'react';

interface TelemetryNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  label?: string;
  type: 'radar' | 'sensor' | 'relay' | 'marine' | 'hub';
  lastPing: number;
  radius: number;
  pulseSize: number;
}

interface DataPacket {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

interface RippleWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  color: string;
}

export function VajraMotionBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [motionMode, setMotionMode] = useState<'tactical' | 'radar' | 'seismic'>('tactical');
  const [isPaused, setIsPaused] = useState(false);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsPaused(true);
    }

    // Handle high DPI
    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initNodes();
    };

    // Telemetry Nodes setup
    let nodes: TelemetryNode[] = [];
    let packets: DataPacket[] = [];
    let ripples: RippleWave[] = [];
    let sweepAngle = 0;
    let waveOffset = 0;

    const NAMED_SENSORS = [
      { label: 'PALGHAR-HQ [19.69°N]', type: 'hub' as const, relX: 0.28, relY: 0.35 },
      { label: 'SURYA-BASIN FLOOD GAUGE', type: 'sensor' as const, relX: 0.72, relY: 0.42 },
      { label: 'DAHANU COASTAL RADAR', type: 'radar' as const, relX: 0.58, relY: 0.22 },
      { label: 'MANOR INUNDATION SENSOR', type: 'sensor' as const, relX: 0.42, relY: 0.62 },
      { label: 'TARAPUR MARINE BUOY', type: 'marine' as const, relX: 0.18, relY: 0.72 },
      { label: 'JAWHAR UPLAND RELAY', type: 'relay' as const, relX: 0.85, relY: 0.30 },
      { label: 'WADA RIVER GATE', type: 'sensor' as const, relX: 0.78, relY: 0.70 },
      { label: 'VASAI-VIRAR LINK', type: 'relay' as const, relX: 0.22, relY: 0.88 },
    ];

    const initNodes = () => {
      nodes = [];
      packets = [];
      ripples = [];

      // Add strategic named nodes
      NAMED_SENSORS.forEach((item, i) => {
        const x = item.relX * width;
        const y = item.relY * height;
        nodes.push({
          id: `node-${i}`,
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          label: item.label,
          type: item.type,
          lastPing: 0,
          radius: item.type === 'hub' ? 4.5 : item.type === 'radar' ? 4 : 3,
          pulseSize: 0,
        });
      });

      // Add ambient mesh nodes
      const ambientCount = width < 768 ? 10 : 20;
      for (let i = 0; i < ambientCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        nodes.push({
          id: `amb-${i}`,
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          type: 'sensor',
          lastPing: 0,
          radius: 2 + Math.random() * 1.5,
          pulseSize: 0,
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse movement handler
    const onMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    // Periodic ripple wave trigger (seismic / flood wave)
    let lastRippleTime = Date.now();

    // Main animation loop
    const render = (timestamp: number) => {
      if (!ctx) return;

      if (!isPaused) {
        // Clear screen with deep obsidian trail for smooth motion blur
        ctx.fillStyle = 'rgba(7, 8, 11, 0.45)';
        ctx.fillRect(0, 0, width, height);

        // 1. Draw Subtle Tactical Grid Lines & Coordinate Crosshairs
        ctx.strokeStyle = 'rgba(79, 141, 255, 0.035)';
        ctx.lineWidth = 1;

        const gridSize = 90;
        const startX = 0;
        const startY = 0;

        for (let x = startX; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = startY; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw crosshairs at select intersections
        ctx.strokeStyle = 'rgba(79, 141, 255, 0.12)';
        for (let x = startX; x < width; x += gridSize * 2) {
          for (let y = startY; y < height; y += gridSize * 2) {
            ctx.beginPath();
            ctx.moveTo(x - 4, y);
            ctx.lineTo(x + 4, y);
            ctx.moveTo(x, y - 4);
            ctx.lineTo(x, y + 4);
            ctx.stroke();
          }
        }

        // 2. Draw Undulating Atmospheric / Topographic Isobars (Monsoon / Surge currents)
        waveOffset += 0.008;
        ctx.save();
        const waveCount = 4;
        for (let w = 0; w < waveCount; w++) {
          const baseHeight = height * (0.2 + w * 0.22);
          const waveAlpha = 0.04 + w * 0.015;
          ctx.strokeStyle = `rgba(79, 141, 255, ${waveAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();

          for (let x = 0; x <= width; x += 15) {
            const freq1 = 0.0025;
            const freq2 = 0.006;
            const y =
              baseHeight +
              Math.sin(x * freq1 + waveOffset * 0.8 + w) * 28 +
              Math.cos(x * freq2 - waveOffset * 0.5) * 14;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
        ctx.restore();

        // 3. Radar Sweep Beam (Originating around satellite GIS card center or center-right)
        sweepAngle = (sweepAngle + 0.012) % (Math.PI * 2);
        const radarCenterX = width > 1024 ? width * 0.72 : width * 0.5;
        const radarCenterY = height > 700 ? height * 0.45 : height * 0.5;
        const radarRadius = Math.max(width, height) * 0.65;

        // Radar faint concentric azimuth range circles
        ctx.save();
        ctx.strokeStyle = 'rgba(79, 141, 255, 0.05)';
        ctx.lineWidth = 1;
        [0.2, 0.4, 0.6, 0.8].forEach((scale) => {
          ctx.beginPath();
          ctx.arc(radarCenterX, radarCenterY, radarRadius * scale, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Radar sweep gradient wedge
        const sweepGradient = ctx.createRadialGradient(
          radarCenterX,
          radarCenterY,
          0,
          radarCenterX,
          radarCenterY,
          radarRadius
        );
        sweepGradient.addColorStop(0, 'rgba(79, 141, 255, 0.12)');
        sweepGradient.addColorStop(0.7, 'rgba(79, 141, 255, 0.03)');
        sweepGradient.addColorStop(1, 'rgba(79, 141, 255, 0)');

        ctx.fillStyle = sweepGradient;
        ctx.beginPath();
        ctx.moveTo(radarCenterX, radarCenterY);
        ctx.arc(radarCenterX, radarCenterY, radarRadius, sweepAngle - 0.4, sweepAngle);
        ctx.closePath();
        ctx.fill();

        // Sharp leading edge line
        ctx.strokeStyle = 'rgba(117, 169, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(radarCenterX, radarCenterY);
        ctx.lineTo(
          radarCenterX + Math.cos(sweepAngle) * radarRadius,
          radarCenterY + Math.sin(sweepAngle) * radarRadius
        );
        ctx.stroke();
        ctx.restore();

        // 4. Periodic Seismic / Storm Surge Ripple Waves
        const now = Date.now();
        if (now - lastRippleTime > 3800) {
          lastRippleTime = now;
          // Spawn ripple from Surya River Basin or Palghar HQ
          const originNode = nodes[1] || nodes[0];
          if (originNode) {
            ripples.push({
              x: originNode.x,
              y: originNode.y,
              radius: 5,
              maxRadius: width < 768 ? 220 : 360,
              alpha: 0.4,
              speed: 1.8,
              color: '#FF525A', // High-alert surge pulse
            });
          }
          // Occasional secondary cyan pulse from coastal radar
          if (Math.random() > 0.4 && nodes[2]) {
            ripples.push({
              x: nodes[2].x,
              y: nodes[2].y,
              radius: 5,
              maxRadius: 280,
              alpha: 0.35,
              speed: 1.4,
              color: '#4F8DFF',
            });
          }
        }

        // Render ripples
        for (let r = ripples.length - 1; r >= 0; r--) {
          const rip = ripples[r];
          rip.radius += rip.speed;
          rip.alpha *= 0.985;

          if (rip.alpha < 0.02 || rip.radius > rip.maxRadius) {
            ripples.splice(r, 1);
            continue;
          }

          ctx.save();
          ctx.strokeStyle = rip.color === '#FF525A' ? `rgba(255, 82, 90, ${rip.alpha})` : `rgba(79, 141, 255, ${rip.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // 5. Update and Connect Telemetry Mesh Nodes
        const maxDist = width < 768 ? 140 : 210;

        // Node motion and mouse reaction
        nodes.forEach((node) => {
          node.x += node.vx;
          node.y += node.vy;

          // Gentle bounds bounce
          if (node.x < 30 || node.x > width - 30) node.vx *= -1;
          if (node.y < 30 || node.y > height - 30) node.vy *= -1;

          // Drift back towards base coordinate
          node.vx += (node.baseX - node.x) * 0.0002;
          node.vy += (node.baseY - node.y) * 0.0002;

          // Mouse proximity reaction
          if (mouseRef.current.active) {
            const dx = mouseRef.current.x - node.x;
            const dy = mouseRef.current.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              const force = (150 - dist) / 150;
              node.x -= (dx / dist) * force * 1.5;
              node.y -= (dy / dist) * force * 1.5;
              node.pulseSize = Math.max(node.pulseSize, force * 6);
            }
          }

          // Check if radar sweep just crossed this node
          const angleToNode = Math.atan2(node.y - radarCenterY, node.x - radarCenterX);
          const normalizedNodeAngle = (angleToNode + Math.PI * 2) % (Math.PI * 2);
          const angleDiff = Math.abs(sweepAngle - normalizedNodeAngle);

          if (angleDiff < 0.04) {
            node.pulseSize = 12;
            node.lastPing = now;

            // Spawn data packet to nearest neighbor
            if (Math.random() > 0.6 && packets.length < 14) {
              const neighborIdx = Math.floor(Math.random() * nodes.length);
              if (neighborIdx !== nodes.indexOf(node)) {
                packets.push({
                  fromNode: nodes.indexOf(node),
                  toNode: neighborIdx,
                  progress: 0,
                  speed: 0.025 + Math.random() * 0.02,
                  color: node.type === 'radar' ? '#F5A23A' : '#75A9FF',
                });
              }
            }
          }

          if (node.pulseSize > 0.1) {
            node.pulseSize *= 0.94;
          }
        });

        // Draw Interconnecting Mesh Lines ("The Vajra Grid")
        ctx.save();
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const na = nodes[i];
            const nb = nodes[j];
            const dx = na.x - nb.x;
            const dy = na.y - nb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * 0.18;
              ctx.strokeStyle = `rgba(79, 141, 255, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(na.x, na.y);
              ctx.lineTo(nb.x, nb.y);
              ctx.stroke();
            }
          }
        }
        ctx.restore();

        // 6. Draw High-Velocity Data Packets (Vajra Energy Pulses)
        ctx.save();
        for (let p = packets.length - 1; p >= 0; p--) {
          const pkt = packets[p];
          pkt.progress += pkt.speed;

          if (pkt.progress >= 1) {
            packets.splice(p, 1);
            continue;
          }

          const nodeA = nodes[pkt.fromNode];
          const nodeB = nodes[pkt.toNode];
          if (!nodeA || !nodeB) {
            packets.splice(p, 1);
            continue;
          }

          const curX = nodeA.x + (nodeB.x - nodeA.x) * pkt.progress;
          const curY = nodeA.y + (nodeB.y - nodeA.y) * pkt.progress;

          // Glowing energy packet
          ctx.fillStyle = pkt.color;
          ctx.shadowColor = pkt.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(curX, curY, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Small trailing pulse
          const trailX = nodeA.x + (nodeB.x - nodeA.x) * Math.max(0, pkt.progress - 0.05);
          const trailY = nodeA.y + (nodeB.y - nodeA.y) * Math.max(0, pkt.progress - 0.05);
          ctx.strokeStyle = pkt.color === '#F5A23A' ? 'rgba(245, 162, 58, 0.4)' : 'rgba(117, 169, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(curX, curY);
          ctx.lineTo(trailX, trailY);
          ctx.stroke();
        }
        ctx.restore();

        // 7. Draw Nodes and Tactical Labels
        nodes.forEach((node) => {
          const isNamed = !!node.label;

          // Expanding phosphor ping circle
          if (node.pulseSize > 0.5) {
            ctx.save();
            ctx.strokeStyle =
              node.type === 'hub'
                ? `rgba(79, 141, 255, ${node.pulseSize / 12})`
                : node.type === 'radar'
                ? `rgba(245, 162, 58, ${node.pulseSize / 12})`
                : `rgba(22, 181, 138, ${node.pulseSize / 12})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius + node.pulseSize * 1.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Node Center Core
          ctx.save();
          if (node.type === 'hub') {
            ctx.fillStyle = '#4F8DFF';
            ctx.shadowColor = '#4F8DFF';
            ctx.shadowBlur = 10;
          } else if (node.type === 'radar') {
            ctx.fillStyle = '#F5A23A';
            ctx.shadowColor = '#F5A23A';
            ctx.shadowBlur = 8;
          } else if (node.type === 'marine') {
            ctx.fillStyle = '#16B58A';
            ctx.shadowColor = '#16B58A';
            ctx.shadowBlur = 6;
          } else {
            ctx.fillStyle = isNamed ? '#75A9FF' : 'rgba(117, 169, 255, 0.5)';
            ctx.shadowColor = '#4F8DFF';
            ctx.shadowBlur = isNamed ? 6 : 0;
          }

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fill();

          // Outer target reticle for primary named stations
          if (isNamed) {
            ctx.strokeStyle = 'rgba(160, 166, 178, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
            ctx.stroke();

            // Tactical Micro Label
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(192, 196, 204, 0.65)';
            ctx.fillText(node.label!, node.x + 8, node.y - 6);

            // Small telemetry status pill
            ctx.fillStyle = 'rgba(79, 141, 255, 0.8)';
            ctx.fillRect(node.x + 8, node.y - 3, 16, 2);
          }
          ctx.restore();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isPaused, motionMode]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Underlying HTML5 Canvas with Dynamic Vajra Telemetry Graphics */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* 2. Deep Radial Ambient Glows for Cinematic Disaster Response Atmosphere */}
      <div className="absolute top-1/4 left-1/4 w-[480px] h-[480px] bg-blue-600/12 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-900/15 rounded-full blur-[140px] pointer-events-none" />

      {/* 3. High-Contrast Vignette: Softens background behind content for 100% WCAG AA Legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090909]/90 via-[#090909]/40 to-[#090909]/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090909]/80 via-transparent to-[#090909]/95 pointer-events-none" />

      {/* 4. Tactical Status Indicator (Interactive HUD badge in bottom left) */}
      <div className="absolute bottom-4 left-6 z-10 pointer-events-auto hidden sm:flex items-center gap-3 bg-[#0B0B0A]/80 border border-[#38302A] px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg text-[11px] font-mono">
        <div className="flex items-center gap-2 text-[#A0A6B2]">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPaused ? 'bg-[#A0A6B2]' : 'bg-[#4F8DFF]'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? 'bg-[#A0A6B2]' : 'bg-[#4F8DFF]'}`}></span>
          </span>
          <span className="font-bold tracking-wider text-[#D0D4DC]">VAJRAGRID MESH</span>
          <span className="text-[#38302A]">|</span>
          <span className="text-[#75A9FF]">PALGHAR SECTOR TELEMETRY</span>
        </div>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className="text-[#A0A6B2] hover:text-white px-1.5 py-0.5 rounded border border-[#38302A] hover:border-[#4F8DFF]/50 hover:bg-[#191715] transition-colors text-[10px]"
          title={isPaused ? 'Resume Motion Graphics' : 'Pause Motion Graphics'}
        >
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>
      </div>
    </div>
  );
}
