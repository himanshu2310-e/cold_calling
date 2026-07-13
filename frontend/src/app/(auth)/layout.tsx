// ============================================
// Auth Shell Layout with Premium WWDC Cosmic Aurora Background
// ============================================
'use client';

import { motion } from 'framer-motion';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Deterministic 50 stars floating particles to prevent SSR/hydration mismatch
  const particles = Array.from({ length: 50 }).map((_, i) => {
    const angle = (i * 7.2) % 360;
    const speedX = Math.sin(angle) * (12 + (i % 5) * 4);
    const speedY = Math.cos(angle) * (12 + (i % 5) * 4);
    return {
      id: i,
      x: ((i * 13) + 7) % 100,
      y: ((i * 17) + 3) % 100,
      size: 1.0 + (i % 3) * 0.5,
      opacity: 0.02 + (i % 4) * 0.015,
      duration: 18 + (i % 8) * 2,
      dx: speedX,
      dy: speedY,
    };
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans select-none"
      style={{
        background: '#05070D',
      }}
      suppressHydrationWarning
    >
      {/* Visual Effects Stylesheets for Grids, Grain, Beams and Auroras */}
      <style>{`
        /* Slow organic movements */
        @keyframes driftElliptical1 {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          50% { transform: translate(70px, -50px) scale(1.15) rotate(180deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }
        @keyframes driftElliptical2 {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          50% { transform: translate(-80px, 60px) scale(0.9) rotate(-180deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(-360deg); }
        }
        @keyframes morphShape1 {
          0% { transform: translate(0px, 0px) scale(0.9) border-radius: 40% 60% 50% 50% / 40% 50% 60% 50%; }
          50% { transform: translate(50px, 40px) scale(1.1) border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%; }
          100% { transform: translate(0px, 0px) scale(0.9) border-radius: 40% 60% 50% 50% / 40% 50% 60% 50%; }
        }
        @keyframes morphShape2 {
          0% { transform: translate(0px, 0px) scale(1.05) border-radius: 50% 50% 40% 60% / 50% 40% 60% 50%; }
          50% { transform: translate(-60px, -30px) scale(0.95) border-radius: 30% 70% 50% 50% / 60% 50% 40% 60%; }
          100% { transform: translate(0px, 0px) scale(1.05) border-radius: 50% 50% 40% 60% / 50% 40% 60% 50%; }
        }
        @keyframes beam1Move {
          0% { transform: translateY(-30px) rotate(-15deg); }
          50% { transform: translateY(40px) rotate(-13deg); }
          100% { transform: translateY(-30px) rotate(-15deg); }
        }
        @keyframes beam2Move {
          0% { transform: translateY(30px) rotate(-15deg); }
          50% { transform: translateY(-40px) rotate(-17deg); }
          100% { transform: translateY(30px) rotate(-15deg); }
        }
        @keyframes grainShift {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(-2%, 1%); }
          30% { transform: translate(1%, -2%); }
          40% { transform: translate(-1%, 3%); }
          50% { transform: translate(-2%, 1%); }
          60% { transform: translate(3%, -1%); }
          70% { transform: translate(2%, 1%); }
          80% { transform: translate(-1%, -1%); }
          90% { transform: translate(1%, 2%); }
        }
        @keyframes gridMove {
          0% { background-position: 0px 0px; }
          100% { background-position: 50px 50px; }
        }

        /* Class Assignments with GPU layer acceleration triggers */
        .aurora-b1 { animation: driftElliptical1 22s ease-in-out infinite alternate; will-change: transform; }
        .aurora-b2 { animation: driftElliptical2 25s ease-in-out infinite alternate; will-change: transform; }
        .aurora-b3 { animation: morphShape1 19s ease-in-out infinite alternate; will-change: transform, border-radius; }
        .aurora-b4 { animation: driftElliptical1 21s ease-in-out infinite alternate; will-change: transform; }
        .aurora-b5 { animation: morphShape2 24s ease-in-out infinite alternate; will-change: transform, border-radius; }
        .aurora-b6 { animation: morphShape1 17s ease-in-out infinite alternate; will-change: transform, border-radius; }
        
        .beam-1 { animation: beam1Move 15s ease-in-out infinite alternate; will-change: transform; }
        .beam-2 { animation: beam2Move 18s ease-in-out infinite alternate; will-change: transform; }
        
        .noise-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          animation: grainShift 8s steps(10) infinite;
          will-change: transform;
        }

        .animate-grid {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 40s linear infinite;
          will-change: background-position;
        }

        .animate-placeholder::placeholder {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
        }
        .animate-placeholder:focus::placeholder {
          transform: translateY(-5px);
          opacity: 0.35;
        }
      `}</style>

      {/* Subtle organic noise/grain overlay */}
      <div className="absolute inset-0 pointer-events-none z-[1] opacity-[0.02] noise-grain scale-[1.05]" />

      {/* Subtle moving grid background */}
      <div className="absolute inset-0 animate-grid opacity-[0.4] pointer-events-none" />

      {/* ==================================================
          AURORA EFFECT - 6 HUGE GLOWING BLOBS
          ================================================== */}
      {/* Deep Layer (Heavily Blurred, Large Scale) */}
      <div className="absolute top-[2%] left-[5%] w-[650px] h-[650px] rounded-full bg-blue-600/[0.04] blur-[150px] pointer-events-none aurora-b1" />
      <div className="absolute bottom-[2%] right-[5%] w-[650px] h-[650px] rounded-full bg-purple-600/[0.04] blur-[160px] pointer-events-none aurora-b2" />
      
      {/* Medium Layer */}
      <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-indigo-600/[0.05] blur-[120px] pointer-events-none aurora-b3" />
      <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-cyan-600/[0.03] blur-[110px] pointer-events-none aurora-b4" />

      {/* Detail Accent Layer */}
      <div className="absolute top-[45%] left-[25%] w-[350px] h-[350px] bg-[#8B5CF6]/[0.03] blur-[100px] pointer-events-none aurora-b5" />
      <div className="absolute top-[20%] right-[30%] w-[350px] h-[350px] rounded-full bg-blue-500/[0.03] blur-[90px] pointer-events-none aurora-b6" />

      {/* ==================================================
          DIAGONAL LIGHT BEAMS (WWDC Accent Highlight)
          ================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-30%] left-[-20%] w-[160%] h-[50%] bg-gradient-to-r from-blue-500/0 via-cyan-500/[0.03] to-purple-500/0 rotate-[-15deg] blur-[100px] transform beam-1" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[160%] h-[50%] bg-gradient-to-r from-purple-500/0 via-indigo-500/[0.02] to-blue-500/0 rotate-[-15deg] blur-[110px] transform beam-2" />
      </div>

      {/* Subtle radial spotlights directly behind the login card container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-blue-500/[0.05] blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-purple-500/[0.04] blur-[130px] pointer-events-none" />

      {/* 50 Tiny Cosmic Floating Stars */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-300/[0.09] pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            x: [0, p.dx, 0],
            y: [0, p.dy, 0],
            opacity: [p.opacity * 0.5, p.opacity * 2.0, p.opacity * 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Centered card frame */}
      <div className="w-full max-w-[420px] relative z-10" suppressHydrationWarning>
        {children}
      </div>
    </div>
  );
}
