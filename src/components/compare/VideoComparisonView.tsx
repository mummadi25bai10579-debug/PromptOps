import React, { useState, useRef, useEffect } from 'react';
import { GenerationJob } from '../../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, FastForward, Film, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '../../utils/cn';

interface VideoComparisonViewProps {
  assetA?: GenerationJob;
  assetB?: GenerationJob;
}

export const VideoComparisonView: React.FC<VideoComparisonViewProps> = ({ assetA, assetB }) => {
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const urlA = assetA?.resultUrl || assetA?.fileUrl;
  const urlB = assetB?.resultUrl || assetB?.fileUrl;

  useEffect(() => {
    const handleTimeUpdate = () => {
      if (videoRefA.current) {
        setCurrentTime(videoRefA.current.currentTime);
        if (!duration && videoRefA.current.duration) {
          setDuration(videoRefA.current.duration);
        }
      }
    };

    const vA = videoRefA.current;
    if (vA) {
      vA.addEventListener('timeupdate', handleTimeUpdate);
      vA.addEventListener('loadedmetadata', () => setDuration(vA.duration));
    }

    return () => {
      if (vA) {
        vA.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      videoRefA.current?.pause();
      videoRefB.current?.pause();
      setIsPlaying(false);
    } else {
      videoRefA.current?.play().catch(console.error);
      videoRefB.current?.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRefA.current) videoRefA.current.currentTime = time;
    if (videoRefB.current) videoRefB.current.currentTime = time;
  };

  const handleStepFrame = (deltaSeconds: number) => {
    if (isPlaying) togglePlay();
    const newTime = Math.max(0, Math.min(duration, currentTime + deltaSeconds));
    setCurrentTime(newTime);
    if (videoRefA.current) videoRefA.current.currentTime = newTime;
    if (videoRefB.current) videoRefB.current.currentTime = newTime;
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRefA.current) videoRefA.current.playbackRate = speed;
    if (videoRefB.current) videoRefB.current.playbackRate = speed;
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (videoRefA.current) videoRefA.current.muted = nextMute;
    if (videoRefB.current) videoRefB.current.muted = nextMute;
  };

  const handleRestart = () => {
    setCurrentTime(0);
    if (videoRefA.current) videoRefA.current.currentTime = 0;
    if (videoRefB.current) videoRefB.current.currentTime = 0;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Dual Video Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video A */}
        <div className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden relative group flex items-center justify-center min-h-[300px]">
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/70 backdrop-blur-md text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 uppercase tracking-widest">
            Version A
          </div>
          {urlA ? (
            <video
              ref={videoRefA}
              src={urlA}
              muted={isMuted}
              playsInline
              className="w-full max-h-[450px] object-contain"
            />
          ) : (
            <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
              <Film className="w-8 h-8 text-slate-600" />
              <span>No Video A Available</span>
            </div>
          )}
        </div>

        {/* Video B */}
        <div className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden relative group flex items-center justify-center min-h-[300px]">
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/70 backdrop-blur-md text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/30 uppercase tracking-widest">
            Version B
          </div>
          {urlB ? (
            <video
              ref={videoRefB}
              src={urlB}
              muted={isMuted}
              playsInline
              className="w-full max-h-[450px] object-contain"
            />
          ) : (
            <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
              <Film className="w-8 h-8 text-slate-600" />
              <span>No Video B Available</span>
            </div>
          )}
        </div>
      </div>

      {/* Synchronized Player Control Dock */}
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

        {/* Action Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleStepFrame(-0.1)}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="-1 Frame (0.1s)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause Both' : 'Sync Play'}</span>
            </button>

            <button
              onClick={() => handleStepFrame(0.1)}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="+1 Frame (0.1s)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              {[0.5, 1, 1.5, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer",
                    playbackSpeed === s ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
