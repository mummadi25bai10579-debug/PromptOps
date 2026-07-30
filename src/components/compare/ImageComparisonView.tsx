import React, { useState, useRef } from 'react';
import { GenerationJob } from '../../types';
import { ZoomIn, ZoomOut, Maximize2, ArrowRightLeft, Layers, Sliders, SplitSquareHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ImageComparisonViewProps {
  assetA?: GenerationJob;
  assetB?: GenerationJob;
}

export const ImageComparisonView: React.FC<ImageComparisonViewProps> = ({ assetA, assetB }) => {
  const [viewMode, setViewMode] = useState<'slider' | 'side' | 'blend'>('slider');
  const [sliderPos, setSliderPos] = useState(50);
  const [blendOpacity, setBlendOpacity] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const urlA = assetA?.resultUrl || assetA?.fileUrl;
  const urlB = assetB?.resultUrl || assetB?.fileUrl;

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent | any) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Controls Bar */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-2xl p-3">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setViewMode('slider')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              viewMode === 'slider' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            )}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Curtain Slider
          </button>
          <button
            onClick={() => setViewMode('side')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              viewMode === 'side' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            )}
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
            Side-by-Side
          </button>
          <button
            onClick={() => setViewMode('blend')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              viewMode === 'blend' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Opacity Blend
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          {viewMode === 'blend' && (
            <div className="flex items-center gap-2 mr-4 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
              <span className="text-xs text-slate-400 font-medium">A/B Blend:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={blendOpacity}
                onChange={(e) => setBlendOpacity(Number(e.target.value))}
                className="w-24 accent-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-mono text-indigo-300 w-8">{blendOpacity}%</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-300 px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-2 py-0.5 text-xs font-semibold text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Image Stage Container */}
      <div className="bg-black/60 border border-white/10 rounded-2xl min-h-[500px] max-h-[700px] relative overflow-hidden flex items-center justify-center p-4">
        {/* Checkerboard transparency grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        />

        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* CURTAIN SLIDER MODE */}
          {viewMode === 'slider' && (
            <div
              className="relative w-full h-full max-w-4xl max-h-[600px] flex items-center justify-center select-none shadow-2xl rounded-xl overflow-hidden"
              ref={sliderRef}
              onMouseMove={handleSliderMove}
              onTouchMove={handleSliderMove}
              onMouseUp={() => setIsDragging(false)}
              onTouchEnd={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              {urlB && (
                <img
                  src={urlB}
                  alt="Version B"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}
              {urlA && (
                <img
                  src={urlA}
                  alt="Version A"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                />
              )}

              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 cursor-ew-resize group z-20"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-indigo-600 border-2 border-white text-white rounded-full shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
              </div>

              <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 uppercase tracking-widest pointer-events-none shadow-lg">
                Version A
              </div>
              <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/30 uppercase tracking-widest pointer-events-none shadow-lg">
                Version B
              </div>
            </div>
          )}

          {/* SIDE BY SIDE MODE */}
          {viewMode === 'side' && (
            <div className="flex w-full h-full gap-4 items-center justify-center">
              <div className="flex-1 max-w-xl h-full relative rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center min-h-[400px]">
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/70 backdrop-blur-md text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 uppercase tracking-widest">
                  Version A
                </div>
                {urlA ? (
                  <img src={urlA} alt="Version A" className="max-w-full max-h-[550px] object-contain" />
                ) : (
                  <div className="text-slate-500 text-sm">No Image A</div>
                )}
              </div>

              <div className="flex-1 max-w-xl h-full relative rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center min-h-[400px]">
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/70 backdrop-blur-md text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/30 uppercase tracking-widest">
                  Version B
                </div>
                {urlB ? (
                  <img src={urlB} alt="Version B" className="max-w-full max-h-[550px] object-contain" />
                ) : (
                  <div className="text-slate-500 text-sm">No Image B</div>
                )}
              </div>
            </div>
          )}

          {/* OPACITY BLEND MODE */}
          {viewMode === 'blend' && (
            <div className="relative w-full h-full max-w-3xl max-h-[600px] flex items-center justify-center shadow-2xl rounded-xl overflow-hidden">
              {urlA && (
                <img
                  src={urlA}
                  alt="Version A"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}
              {urlB && (
                <img
                  src={urlB}
                  alt="Version B"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-75"
                  style={{ opacity: blendOpacity / 100 }}
                />
              )}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/80 backdrop-blur-md text-slate-200 text-xs rounded-full border border-white/10 font-mono">
                Showing {100 - blendOpacity}% A / {blendOpacity}% B
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
