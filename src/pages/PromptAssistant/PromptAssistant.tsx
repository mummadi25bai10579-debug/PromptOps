import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PenTool, Wand2, Maximize2, Minimize2, Check, Copy, Save, 
  RotateCw, Loader2, Sparkles, AlertCircle, History, Info, Play
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

const STYLE_PRESETS = [
  'Cinematic', 'Photorealistic', 'Anime', 'Cyberpunk', 
  'Fantasy', 'Sci-Fi', 'Product Photography', 'YouTube Thumbnail',
  'Marketing', 'Social Media'
];

interface Analysis {
  clarityScore: number;
  detailScore: number;
  creativityScore: number;
  structureScore: number;
  generationReadinessScore: number;
  suggestions: string[];
  missingDetails: string[];
  negativePrompts: string[];
}

interface PromptRecord {
  id: string;
  original: string;
  improved: string;
  score: number;
  createdAt: any;
}

export const PromptAssistant = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [isLiveSuggesting, setIsLiveSuggesting] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [history, setHistory] = useState<PromptRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'prompt_history'), 
      where('userId', '==', user.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptRecord));
      records.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime());
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime());
        return timeB - timeA;
      });
      setHistory(records);
    }, (err) => {
      console.error('Prompt history listener error:', err);
    });
    return () => unsub();
  }, [user]);

  // Live suggestions logic
  useEffect(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    if (prompt.trim().length > 10) {
      typingTimeoutRef.current = setTimeout(() => {
        fetchLiveSuggestions(prompt);
      }, 1500); // 1.5s debounce
    } else {
      setLiveSuggestions([]);
    }
  }, [prompt]);

  const fetchLiveSuggestions = async (currentPrompt: string) => {
    setIsLiveSuggesting(true);
    try {
      const res = await fetch('/api/assistant/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, action: 'live' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestions) setLiveSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLiveSuggesting(false);
    }
  };

  const handleAction = async (action: 'rewrite' | 'expand' | 'shorten' | 'optimize') => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setImprovedPrompt('');
    setSaved(false);
    try {
      const res = await fetch('/api/assistant/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, action, preset: activePreset })
      });
      if (res.ok) {
        const data = await res.json();
        setImprovedPrompt(data.result);
        // Once improved, automatically analyze the new prompt
        handleAnalyze(data.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyze = async (textToAnalyze: string = prompt) => {
    if (!textToAnalyze.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/assistant/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToAnalyze, action: 'analyze' })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(improvedPrompt || prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!user || !improvedPrompt) return;
    try {
      await addDoc(collection(db, 'prompt_history'), {
        userId: user.id,
        original: prompt,
        improved: improvedPrompt,
        score: analysis?.generationReadinessScore || 0,
        createdAt: serverTimestamp()
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = () => {
    navigate('/generate', { state: { prompt: improvedPrompt || prompt } });
  };

  const overallScore = analysis?.generationReadinessScore || 0;

  return (
    <div className="flex flex-col gap-6 h-full w-full pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Prompt Assistant</h1>
        <p className="text-slate-400">Craft, optimize, and analyze your AI prompts in real-time.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column - Input & Actions */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl flex flex-col focus-within:border-indigo-500/50 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-indigo-400" />
                Your Prompt
              </label>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors bg-indigo-500/10 px-3 py-1 rounded-full"
              >
                <History className="w-3 h-3" /> {showHistory ? 'Hide History' : 'Show History'}
              </button>
            </div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              className="w-full h-40 bg-transparent text-lg text-white placeholder-slate-600 focus:outline-none resize-none custom-scrollbar"
            />
            
            {/* Live Suggestions Bar */}
            <AnimatePresence>
              {(isLiveSuggesting || liveSuggestions.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/5 overflow-hidden"
                >
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium mb-3 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> AI Suggestions
                    {isLiveSuggesting && <Loader2 className="w-3 h-3 animate-spin ml-2" />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {liveSuggestions.map((sug, i) => (
                      <button 
                        key={i}
                        onClick={() => setPrompt(prompt + ' ' + sug)}
                        className="text-sm bg-indigo-500/10 text-indigo-200 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors text-left"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions Toolbar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleAction('optimize')}
              disabled={!prompt.trim() || isProcessing}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white font-medium flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Optimize</span>
            </button>
            <button
              onClick={() => handleAction('rewrite')}
              disabled={!prompt.trim() || isProcessing}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white font-medium flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RotateCw className="w-5 h-5 text-blue-400" />
              <span>Rewrite</span>
            </button>
            <button
              onClick={() => handleAction('expand')}
              disabled={!prompt.trim() || isProcessing}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white font-medium flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Maximize2 className="w-5 h-5 text-emerald-400" />
              <span>Expand</span>
            </button>
            <button
              onClick={() => handleAction('shorten')}
              disabled={!prompt.trim() || isProcessing}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white font-medium flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Minimize2 className="w-5 h-5 text-purple-400" />
              <span>Shorten</span>
            </button>
          </div>

          {/* Style Presets */}
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Style Presets</h3>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setActivePreset(preset === activePreset ? null : preset)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                    preset === activePreset 
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                      : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Output Box */}
          <AnimatePresence>
            {improvedPrompt && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-b from-[#111827]/80 to-[#111827]/40 border border-indigo-500/30 rounded-[24px] backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-indigo-400" />
                    Improved Prompt
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors flex items-center gap-2 text-sm"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saved}
                      className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {saved ? 'Saved' : 'Save'}
                    </button>
                    <button 
                      onClick={handleGenerate}
                      className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 rounded-lg text-black transition-colors flex items-center gap-2 text-sm font-semibold shadow-lg shadow-emerald-500/20"
                    >
                      <Play className="w-4 h-4" />
                      Generate
                    </button>
                  </div>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                    {improvedPrompt}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column - Analysis */}
        <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6">
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl shadow-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-400" />
                Prompt Analysis
              </h2>
              <button
                onClick={() => handleAnalyze(improvedPrompt || prompt)}
                disabled={isAnalyzing || (!prompt.trim() && !improvedPrompt.trim())}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Analyze'}
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8">
              {analysis ? (
                <>
                  {/* Overall Score */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <motion.circle 
                          initial={{ strokeDasharray: "0 1000" }}
                          animate={{ strokeDasharray: `${(overallScore / 100) * 283} 283` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          cx="50" cy="50" r="45" fill="none" 
                          stroke={overallScore > 80 ? '#10b981' : overallScore > 50 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="8" strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-white">{overallScore}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-4">
                    <MetricBar label="Clarity" score={analysis.clarityScore} />
                    <MetricBar label="Detail" score={analysis.detailScore} />
                    <MetricBar label="Creativity" score={analysis.creativityScore} />
                    <MetricBar label="Structure" score={analysis.structureScore} />
                  </div>

                  {/* Missing Details */}
                  {analysis.missingDetails && analysis.missingDetails.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Missing Elements
                      </h4>
                      <ul className="space-y-2">
                        {analysis.missingDetails.map((detail, i) => (
                          <li key={i} className="text-sm text-red-200/70 flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Negative Prompts */}
                  {analysis.negativePrompts && analysis.negativePrompts.length > 0 && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                        Suggested Negative Prompts
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.negativePrompts.map((neg, i) => (
                          <span key={i} className="px-2 py-1 bg-black/40 border border-white/5 rounded text-xs text-slate-300">
                            {neg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center h-48">
                  <Info className="w-10 h-10 mb-4 opacity-50" />
                  <p>Click Analyze to evaluate your prompt's readiness, clarity, and detail.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Modal / Drawer */}
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
                Prompt History
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
                      <span className="text-[10px] text-slate-500">
                        {record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        record.score > 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      )}>
                        Score {record.score}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Original</div>
                      <p className="text-sm text-slate-300 line-clamp-2">{record.original}</p>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Improved</div>
                      <p className="text-sm text-white line-clamp-3">{record.improved}</p>
                    </div>
                    <button
                      onClick={() => {
                        setPrompt(record.original);
                        setImprovedPrompt(record.improved);
                        setShowHistory(false);
                      }}
                      className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium text-left"
                    >
                      Load this prompt &rarr;
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MetricBar = ({ label, score }: { label: string, score: number }) => (
  <div>
    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-1.5">
      <span className="text-slate-400">{label}</span>
      <span className={score > 80 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-red-400'}>{score}%</span>
    </div>
    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn(
          "h-full rounded-full",
          score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-amber-500' : 'bg-red-500'
        )}
      />
    </div>
  </div>
);
