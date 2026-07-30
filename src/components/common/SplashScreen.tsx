import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Terminal, Cpu, Network, Layers, Command } from 'lucide-react';

interface SplashScreenProps {
  children: React.ReactNode;
}

const INIT_STEPS = [
  { text: 'Initializing AI Models...', icon: Cpu },
  { text: 'Connecting Workflows...', icon: Network },
  { text: 'Loading Agent Network...', icon: Layers },
  { text: 'Syncing Assets...', icon: Terminal },
  { text: 'Preparing Command Center...', icon: Command },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // Check session storage
    if (typeof window !== 'undefined') {
      const seen = sessionStorage.getItem('promptops_splash_shown');
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (seen || prefersReduced) {
        return false;
      }
    }
    return true;
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Handle sequence timeline
  useEffect(() => {
    if (!showSplash) return;

    // Progress bar and step interval
    const duration = 3200; // 3.2 seconds total
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      const stepIdx = Math.min(
        INIT_STEPS.length - 1,
        Math.floor((elapsed / duration) * INIT_STEPS.length)
      );
      setCurrentStepIndex(stepIdx);

      if (elapsed >= duration) {
        clearInterval(progressInterval);
        setIsFadingOut(true);
        setTimeout(() => {
          setShowSplash(false);
          sessionStorage.setItem('promptops_splash_shown', 'true');
        }, 600); // match exit transition duration
      }
    }, 40);

    return () => clearInterval(progressInterval);
  }, [showSplash]);

  // Handle Neural Network Canvas Particle Animation
  useEffect(() => {
    if (!showSplash || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = Math.min(65, Math.floor((width * height) / 22000));
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw particle connections
      const maxDist = 130;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Move particle
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p1.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showSplash]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('promptops_splash_shown', 'true');
    }, 300);
  };

  const CurrentStepIcon = INIT_STEPS[currentStepIndex].icon;

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="promptops-splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: isFadingOut ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-[#030308] text-white select-none overflow-hidden font-sans"
          >
            {/* Ambient Deep Purple & Violet Radial Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Neural Canvas Background */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

            {/* Top Bar / Skip Action */}
            <div className="relative z-10 w-full max-w-7xl px-6 py-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">System Boot</span>
              </div>

              <button
                onClick={handleSkip}
                className="text-[11px] font-mono tracking-wider text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 transition-all"
              >
                SKIP Intro ↵
              </button>
            </div>

            {/* Center Core Branding Experience */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 my-auto">
              
              {/* Logo Symbol with Animated Glow Sweep */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative mb-8"
              >
                {/* Outer Ring Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-3xl blur-xl opacity-40 animate-pulse" />

                {/* Logo Glass Card */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-b from-[#111122] to-[#080812] border border-white/15 rounded-3xl p-4 flex items-center justify-center shadow-2xl backdrop-blur-xl overflow-hidden group">
                  {/* Subtle Light Sweep Pass */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  />

                  {/* Geometric Neural Logo Vector */}
                  <div className="relative z-10 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-indigo-300 drop-shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
                  </div>
                </div>
              </motion.div>

              {/* Title & Tagline */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="space-y-2"
              >
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                  PromptOps <span className="text-indigo-400">AI</span>
                </h1>
                <p className="text-sm md:text-base font-medium text-slate-400 tracking-wide">
                  Enterprise AI Operations Platform
                </p>
              </motion.div>

              {/* Initialization Sequence Text with Icon */}
              <div className="mt-10 h-12 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={INIT_STEPS[currentStepIndex].text}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-full backdrop-blur-md shadow-lg"
                  >
                    <CurrentStepIcon className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                    <span className="text-xs font-mono text-slate-300">
                      {INIT_STEPS[currentStepIndex].text}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Progress Bar & Version Info */}
            <div className="relative z-10 w-full max-w-md px-6 pb-10 flex flex-col items-center gap-3">
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden p-[1px] backdrop-blur-sm">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>PromptOps v2.5.0 Enterprise</span>
                <span>{progress}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual App Content */}
      <div className={showSplash ? 'hidden' : 'block h-full w-full'}>
        {children}
      </div>
    </>
  );
};
