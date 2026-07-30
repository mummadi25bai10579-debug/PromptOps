import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Image as ImageIcon, Video, Layers, Wand2, ArrowRight,
  Maximize2, Save, Share2, MessageSquare, History, Settings2,
  Play, Download, Eraser, Move, Sun, Loader2, Sparkles
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

const REMIX_OPERATIONS = [
  { id: 'style_transfer', name: 'Style Transfer', icon: Layers },
  { id: 'bg_replace', name: 'Background Replacement', icon: ImageIcon },
  { id: 'obj_add', name: 'Object Addition', icon: Wand2 },
  { id: 'obj_remove', name: 'Object Removal', icon: Eraser },
  { id: 'res_enhance', name: 'Resolution Enhancement', icon: Maximize2 },
  { id: 'img_to_vid', name: 'Image to Video', icon: Video },
];

const STYLE_PRESETS = [
  'Anime', 'Realistic', 'Cinematic', '3D Render', 'Cyberpunk', 'Watercolor'
];

interface RemixRecord {
  id: string;
  originalUrl: string;
  remixedUrl: string;
  operation: string;
  prompt: string;
  style: string;
  createdAt: any;
}

export const RemixStudio = () => {
  const { user } = useAuthStore();
  
  // State
  const [originalAsset, setOriginalAsset] = useState<string | null>(null);
  const [remixedAsset, setRemixedAsset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [selectedOp, setSelectedOp] = useState(REMIX_OPERATIONS[0].id);
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [prompt, setPrompt] = useState('');
  
  const [history, setHistory] = useState<RemixRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [compareMode, setCompareMode] = useState<'side' | 'slider'>('side');
  const [sliderPos, setSliderPos] = useState(50);

  // Team Features
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{user: string, text: string, time: string}[]>([
    { user: 'Sarah L.', text: 'Love the cyberpunk vibe here. Can we make the neon a bit brighter?', time: '2h ago' },
    { user: 'Alex M.', text: 'Approved for the marketing campaign!', time: '1h ago' }
  ]);
  const [newComment, setNewComment] = useState('');

  // Load History
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'remix_history'), 
      where('userId', '==', user.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RemixRecord));
      records.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime());
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime());
        return timeB - timeA;
      });
      setHistory(records);
    }, (err) => {
      console.error('Remix history listener error:', err);
    });
    return () => unsub();
  }, [user]);

  // Handle Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Local preview
      const url = URL.createObjectURL(file);
      setOriginalAsset(url);
      setRemixedAsset(null);

      // Upload to B2
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          // use the B2 url for originalAsset instead
          setOriginalAsset(data.url);
        } else {
          console.error("Upload failed", await res.text());
        }
      } catch (err) {
        console.error("Upload error", err);
      }
    }
  };

  // Handle Remix
  const handleRemix = async () => {
    if (!originalAsset) return;
    setIsProcessing(true);
    
    try {
      // We will call the standard generate image endpoint for now, using the prompt + style
      // In a full implementation, we'd pass the originalAsset for an img2img generation.
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${prompt}, in ${selectedStyle} style. Remixed from existing asset.`,
          provider: 'pollinations',
          aspectRatio: '1:1'
        })
      });

      if (!res.ok) {
        throw new Error("Generation failed");
      }

      const data = await res.json();
      const remixedDataUrl = `data:image/jpeg;base64,${data.base64}`;
      setRemixedAsset(remixedDataUrl);

      // Save the remixed base64 to B2
      const blob = await (await fetch(remixedDataUrl)).blob();
      const file = new File([blob], `remix_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      let finalRemixedUrl = remixedDataUrl;
      const b2Res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (b2Res.ok) {
        const b2Data = await b2Res.json();
        finalRemixedUrl = b2Data.url;
      }

      // Save to history in Firestore
      if (user) {
        await addDoc(collection(db, 'remix_history'), {
          userId: user.id,
          originalUrl: originalAsset,
          remixedUrl: finalRemixedUrl,
          operation: selectedOp,
          style: selectedStyle,
          prompt,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1 tracking-tight">Content Remix Studio</h1>
          <p className="text-slate-400 text-sm">Transform, enhance, and remix assets with enterprise-grade AI.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#111827] border border-white/10 rounded-lg p-1 flex items-center">
            <button 
              onClick={() => setCompareMode('side')}
              className={cn("px-3 py-1.5 rounded text-xs font-medium transition-colors", compareMode === 'side' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white')}
            >
              Side-by-Side
            </button>
            <button 
              onClick={() => setCompareMode('slider')}
              className={cn("px-3 py-1.5 rounded text-xs font-medium transition-colors", compareMode === 'slider' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white')}
            >
              Slider
            </button>
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-medium transition-colors"
          >
            <History className="w-4 h-4 text-indigo-400" />
            History
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0">
        
        {/* Workspace Area (Left/Right or Slider) */}
        <div className="flex-1 bg-[#111827]/40 border border-white/5 rounded-[24px] overflow-hidden flex flex-col relative shadow-xl backdrop-blur-md min-h-[400px]">
          {compareMode === 'side' ? (
            <div className="flex flex-col md:flex-row h-full">
              {/* Original */}
              <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col relative min-h-[250px]">
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Original
                </div>
                {originalAsset ? (
                  <div className="flex-1 rounded-xl overflow-hidden bg-[#09090B] border border-white/5 flex items-center justify-center group relative">
                    <img src={originalAsset || undefined} alt="Original" className="w-full h-full object-contain" />
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <span className="text-white text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4"/> Change Asset</span>
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
                    </label>
                  </div>
                ) : (
                  <label className="flex-1 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center cursor-pointer text-slate-400 group">
                    <Upload className="w-8 h-8 mb-3 group-hover:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Click or drag asset to upload</span>
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
                  </label>
                )}
              </div>

              {/* Remixed */}
              <div className="flex-1 p-6 flex flex-col relative">
                <div className="absolute top-4 right-4 bg-indigo-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/30 z-10 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Remixed
                </div>
                <div className="flex-1 rounded-xl overflow-hidden bg-[#09090B] border border-white/5 flex items-center justify-center relative">
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-4 text-indigo-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-sm font-mono uppercase tracking-widest animate-pulse">Processing...</span>
                    </div>
                  ) : remixedAsset ? (
                    <img src={remixedAsset || undefined} alt="Remixed" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-2">
                      <Wand2 className="w-8 h-8 opacity-50" />
                      <span className="text-sm">Configure and hit Remix to start</span>
                    </div>
                  )}

                  {remixedAsset && !isProcessing && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors" title="Share">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setShowComments(true)}
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors" 
                        title="Comments"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 relative overflow-hidden bg-[#09090B] group">
              {/* Slider View */}
              {!originalAsset ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <label className="rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center cursor-pointer text-slate-400 group p-12">
                    <Upload className="w-8 h-8 mb-3 group-hover:text-indigo-400" />
                    <span className="text-sm font-medium">Upload asset to start</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  </label>
                </div>
              ) : (
                <>
                  {/* Original full */}
                  <img src={originalAsset || undefined} alt="Original" className="absolute inset-0 w-full h-full object-contain" />
                  
                  {/* Remixed overlay */}
                  {remixedAsset && !isProcessing && (
                    <div 
                      className="absolute inset-0 overflow-hidden border-r-2 border-indigo-500/50 shadow-[4px_0_12px_rgba(0,0,0,0.5)]"
                      style={{ width: `${sliderPos}%` }}
                    >
                      <img src={remixedAsset || undefined} alt="Remixed" className="absolute top-0 left-0 w-screen max-w-none h-full object-contain" style={{ width: '100vw' }} />
                    </div>
                  )}
                  
                  {/* Slider Control */}
                  {remixedAsset && !isProcessing && (
                    <>
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none"
                        style={{ left: `calc(${sliderPos}% - 2px)` }}
                      >
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-200">
                          <Move className="w-4 h-4 text-slate-800" />
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={sliderPos} 
                        onChange={(e) => setSliderPos(Number(e.target.value))}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                      />
                    </>
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-indigo-400 z-30">
                      <Loader2 className="w-10 h-10 animate-spin mb-4" />
                      <span className="text-sm font-mono uppercase tracking-widest animate-pulse">Processing...</span>
                    </div>
                  )}
                  
                  {/* Labels */}
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/30 z-10 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Remixed
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10 text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Original
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls Sidebar */}
        <div className="w-full lg:w-[340px] shrink-0 bg-[#111827]/40 border border-white/5 rounded-[24px] shadow-xl p-5 flex flex-col gap-6 overflow-y-auto no-scrollbar backdrop-blur-md">
          
          {/* Operations Grid */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5" /> Operations
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {REMIX_OPERATIONS.map((op) => {
                const Icon = op.icon;
                const isSelected = selectedOp === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => setSelectedOp(op.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all",
                      isSelected ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/10" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium uppercase">{op.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Style Presets */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sun className="w-3.5 h-3.5" /> Art Style
            </h3>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    selectedStyle === style 
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300" 
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5" /> Editing Prompt
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to change..."
              className="flex-1 w-full bg-[#09090B] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none min-h-[120px]"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleRemix}
            disabled={!originalAsset || isProcessing}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Remix
              </>
            )}
          </button>
        </div>
      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] bg-[#09090B] border-l border-white/10 z-50 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111827]/80">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                Remix History
              </h2>
              <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10">
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">No history found.</div>
              ) : (
                history.map(record => (
                  <div key={record.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">
                        {record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 uppercase">
                        {REMIX_OPERATIONS.find(op => op.id === record.operation)?.name || record.operation}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 h-24">
                      <div className="flex-1 bg-black rounded-lg overflow-hidden border border-white/10 relative">
                        {record.originalUrl ? (
                          <img src={record.originalUrl} alt="Original" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">No Original</div>
                        )}
                        <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 px-1 rounded text-white">Original</span>
                      </div>
                      <div className="flex-1 bg-black rounded-lg overflow-hidden border border-indigo-500/30 relative">
                        {record.remixedUrl ? (
                          <img src={record.remixedUrl} alt="Remix" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">No Remix</div>
                        )}
                        <span className="absolute bottom-1 left-1 text-[8px] bg-indigo-500/60 px-1 rounded text-white">Remixed</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-slate-300 line-clamp-2">Prompt: {record.prompt || 'No prompt'}</p>
                      <p className="text-xs text-slate-400">Style: {record.style}</p>
                    </div>

                    <button
                      onClick={() => {
                        setOriginalAsset(record.originalUrl);
                        setRemixedAsset(record.remixedUrl);
                        setSelectedOp(record.operation);
                        setSelectedStyle(record.style);
                        setPrompt(record.prompt);
                        setShowHistory(false);
                      }}
                      className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium text-left flex items-center gap-1"
                    >
                      <History className="w-3 h-3" /> Restore this version
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] bg-[#09090B] border-l border-white/10 z-50 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111827]/80">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Team Comments
              </h2>
              <button onClick={() => setShowComments(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10">
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {c.user[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{c.user}</span>
                      <span className="text-xs text-slate-500">{c.time}</span>
                    </div>
                    <p className="text-sm text-slate-300 bg-white/5 p-3 rounded-xl rounded-tl-none">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10 bg-[#111827]/80">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-[#09090B] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                />
                <button 
                  onClick={() => {
                    if (newComment.trim()) {
                      setComments([...comments, { user: user?.displayName || 'Me', text: newComment, time: 'Just now' }]);
                      setNewComment('');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

