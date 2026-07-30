import React, { useState, useRef, useEffect } from 'react';
import { GenerationJob } from '../../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Music, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AudioComparisonViewProps {
  assetA?: GenerationJob;
  assetB?: GenerationJob;
}

export const AudioComparisonView: React.FC<AudioComparisonViewProps> = ({ assetA, assetB }) => {
  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volumeA, setVolumeA] = useState(1);
  const [volumeB, setVolumeB] = useState(1);
  const [activeSolo, setActiveSolo] = useState<'all' | 'A' | 'B'>('all');

  const urlA = assetA?.resultUrl || assetA?.fileUrl;
  const urlB = assetB?.resultUrl || assetB?.fileUrl;

  useEffect(() => {
    const handleTime = () => {
      if (audioRefA.current) {
        setCurrentTime(audioRefA.current.currentTime);
        if (!duration && audioRefA.current.duration) {
          setDuration(audioRefA.current.duration);
        }
      }
    };

    const aA = audioRefA.current;
    if (aA) {
      aA.addEventListener('timeupdate', handleTime);
      aA.addEventListener('loadedmetadata', () => setDuration(aA.duration));
    }

    return () => {
      if (aA) aA.removeEventListener('timeupdate', handleTime);
    };
  }, []);

  useEffect(() => {
    if (audioRefA.current) audioRefA.current.volume = activeSolo === 'B' ? 0 : volumeA;
    if (audioRefB.current) audioRefB.current.volume = activeSolo === 'A' ? 0 : volumeB;
  }, [activeSolo, volumeA, volumeB]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRefA.current?.pause();
      audioRefB.current?.pause();
      setIsPlaying(false);
    } else {
      audioRefA.current?.play().catch(console.error);
      audioRefB.current?.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRefA.current) audioRefA.current.currentTime = time;
    if (audioRefB.current) audioRefB.current.currentTime = time;
  };

  // Generate deterministic pseudo-waveform bars for visual audio presentation
  const generateBars = (seed: string, count: number) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return Array.from({ length: count }, (_, i) => {
      const pseudoVal = Math.abs(Math.sin((hash + i * 3) * 0.1)) * 80 + 20;
      return Math.round(pseudoVal);
    });
  };

  const barsA = generateBars(assetA?.id || 'audioA', 40);
  const barsB = generateBars(assetB?.id || 'audioB', 40);

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Invisible Audio Elements */}
      {urlA && <audio ref={audioRefA} src={urlA} preload="metadata" />}
      {urlB && <audio ref={audioRefB} src={urlB} preload="metadata" />}

      {/* Audio Waveforms Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Version A Audio Card */}
        <div className={cn(
          "bg-white/[0.02] border rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden transition-all",
          activeSolo === 'A' ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]" : "border-white/10"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-4 h-4" /> Version A Waveform
            </span>
            <button
              onClick={() => setActiveSolo(activeSolo === 'A' ? 'all' : 'A')}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                activeSolo === 'A' ? "bg-emerald-500 text-black border-emerald-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              )}
            >
              Solo A
            </button>
          </div>

          {/* Waveform Visualizer */}
          <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-1 h-28 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 border-r border-emerald-500/50 transition-all pointer-events-none"
              style={{ width: `${progressPct}%` }}
            />
            {barsA.map((height, i) => {
              const isPast = (i / barsA.length) * 100 <= progressPct;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-all duration-150",
                    isPast ? "bg-emerald-400" : "bg-white/10"
                  )}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Model: {assetA?.model || 'N/A'}</span>
            <span>Vol A: {Math.round(volumeA * 100)}%</span>
          </div>
        </div>

        {/* Version B Audio Card */}
        <div className={cn(
          "bg-white/[0.02] border rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden transition-all",
          activeSolo === 'B' ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]" : "border-white/10"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-4 h-4" /> Version B Waveform
            </span>
            <button
              onClick={() => setActiveSolo(activeSolo === 'B' ? 'all' : 'B')}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                activeSolo === 'B' ? "bg-indigo-500 text-white border-indigo-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              )}
            >
              Solo B
            </button>
          </div>

          {/* Waveform Visualizer */}
          <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-1 h-28 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-indigo-500/10 border-r border-indigo-500/50 transition-all pointer-events-none"
              style={{ width: `${progressPct}%` }}
            />
            {barsB.map((height, i) => {
              const isPast = (i / barsB.length) * 100 <= progressPct;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-all duration-150",
                    isPast ? "bg-indigo-400" : "bg-white/10"
                  )}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Model: {assetB?.model || 'N/A'}</span>
            <span>Vol B: {Math.round(volumeB * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Synchronized Audio Control Dock */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
        {/* Scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-12 text-right">
            {currentTime.toFixed(1)}s
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 accent-indigo-500 bg-white/10 rounded-lg h-2 cursor-pointer"
          />
          <span className="text-xs font-mono text-slate-400 w-12">
            {(duration || 0).toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentTime(0);
                if (audioRefA.current) audioRefA.current.currentTime = 0;
                if (audioRefB.current) audioRefB.current.currentTime = 0;
              }}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause Audio' : 'Play Both'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Mode: {activeSolo === 'all' ? 'Stereo Dual Mix' : `Solo ${activeSolo}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
