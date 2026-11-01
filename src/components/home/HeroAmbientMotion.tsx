import React, { useEffect, useRef } from 'react';

export function HeroAmbientMotion() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Grid coordinates
    const particles: { x: number; y: number; baseAlpha: number; speed: number }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        baseAlpha: 0.1 + Math.random() * 0.25,
        speed: 0.0003 + Math.random() * 0.0006
      });
    }

    const render = () => {
      time += 0.015;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Render subtle drifting telemetry particles
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) p.y = 1;

        const px = p.x * w;
        const py = p.y * h;
        const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(time + p.x * 10));

        ctx.fillStyle = `rgba(79, 141, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle horizontal scanning wave line across background
      const scanY = (Math.sin(time * 0.4) * 0.5 + 0.5) * h;
      const grad = ctx.createLinearGradient(0, scanY, w, scanY);
      grad.addColorStop(0, 'rgba(79, 141, 255, 0)');
      grad.addColorStop(0.5, 'rgba(79, 141, 255, 0.04)');
      grad.addColorStop(1, 'rgba(79, 141, 255, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 30, w, 60);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70"
    />
  );
}

// Simulated Telemetry Marquee for Palghar District
const TELEMETRY_STREAMS = [
  { label: 'DOPPLER SWEEP', val: 'Surya River 360° Pass Complete', status: 'live' },
  { label: 'WATER DISCHARGE', val: 'Dhamani Dam: 3,420 cusecs (Watch Level)', status: 'alert' },
  { label: 'COASTAL SENSOR', val: 'Dahanu Port Tide: 1.82m · Winds 28 km/h', status: 'live' },
  { label: 'HIGHWAY LOGISTICS', val: 'Manor NH-48 Corridor Open · Diversion Ready', status: 'live' },
  { label: 'VAJRA MESH', val: '6 Taluka EOC Hubs Synced · 99.8% Packet Success', status: 'live' },
  { label: 'SLOPE SENSORS', val: 'Jawhar Ghat Inclinometers: Normal Gradient', status: 'live' }
];

export function HeroTelemetryTicker() {
  return (
    <div className="w-full bg-[#0B0B0A] border-t border-b border-[#26211C] py-2.5 overflow-hidden z-20 relative select-none">
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
        {/* Static badge */}
        <div className="flex-shrink-0 flex items-center gap-2 pr-4 border-r border-[#26211C]">
          <span className="w-2 h-2 rounded-full bg-[#16B58A] animate-pulse" />
          <span className="text-[11px] font-mono font-black text-[#F4F0EB] tracking-wider uppercase">
            LIVE TELEMETRY
          </span>
          <span className="text-[9px] font-mono text-[#7C756E] border border-[#38302A] px-1.5 py-0.2 rounded">
            SIMULATED
          </span>
        </div>

        {/* Scrolling ticker track */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-8 whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
            {[...TELEMETRY_STREAMS, ...TELEMETRY_STREAMS].map((item, idx) => (
              <div key={idx} className="inline-flex items-center gap-2 text-xs font-mono text-[#C0C4CC]">
                <span className={`text-[10px] font-bold ${item.status === 'alert' ? 'text-[#FF525A]' : 'text-[#75A9FF]'}`}>
                  [{item.label}]
                </span>
                <span className="text-[#E5E9F0]">{item.val}</span>
                <span className="text-[#38302A] font-bold mx-2">/</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
