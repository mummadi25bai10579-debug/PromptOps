import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Tag, Image as ImageIcon, Sparkles, Folder,
  BarChart3, BrainCircuit, Activity, Info, Loader2,
  FileText, Video, Music, Layers, Palette
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

interface AssetInsights {
  tags: string[];
  categories: string[];
  mainSubject: string;
  dominantColors: string[];
  visualStyle: string;
  mood: string;
  summary: string;
  confidenceScore: number;
  recommendations: string[];
}

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&q=80&w=800', // Cyberpunk
  'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800', // Shoes
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800', // Futuristic UI
];

export const MetadataEngine = () => {
  const { user } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<AssetInsights | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDemoSelect = async (url: string) => {
    setSelectedImage(url);
    await analyzeAsset(url, null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file for preview and analysis
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      setSelectedImage(base64Data);
      
      const mimeType = file.type;
      const base64 = base64Data.split(',')[1];
      
      await analyzeAsset(null, { base64, mimeType, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const analyzeAsset = async (url: string | null, fileData: { base64: string, mimeType: string, name: string } | null) => {
    setIsAnalyzing(true);
    setInsights(null);
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 15, 90));
    }, 500);

    try {
      let body: any = {};
      
      if (fileData) {
        body = {
          base64: fileData.base64,
          mimeType: fileData.mimeType,
          text: "Please analyze this image asset."
        };
      } else if (url) {
        // We need to fetch the image and convert to base64 for Gemini
        // For demo purposes, we will send the URL as text if it's a URL
        body = { text: `Please analyze this image asset at URL: ${url}` };
      }

      const res = await fetch('/api/metadata/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        setInsights(data);
        
        // Save to Firestore
        if (user) {
          try {
            await addDoc(collection(db, 'assetMetadata'), {
              userId: user.id,
              insights: data,
              sourceUrl: url,
              fileName: fileData?.name || 'demo_asset',
              timestamp: serverTimestamp()
            });
            
            // Log tags separately for easy querying
            data.tags.forEach(async (tag: string) => {
               await addDoc(collection(db, 'assetTags'), {
                 tag,
                 assetId: 'temp', // in a real app, link to the actual asset doc
                 userId: user.id
               });
            });
          } catch (e) {
             console.error("Firestore error", e);
          }
        }
      } else {
        console.error("Analysis failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => setIsAnalyzing(false), 500);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">AI Metadata Engine</h1>
        <p className="text-slate-400 text-sm">Automatically extract intelligent tags, categories, and deep insights from your assets.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Column: Asset Selection & Preview */}
        <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-6">
          
          {/* Upload Area */}
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Upload className="w-4 h-4 text-indigo-400" />
              Upload Asset
            </h3>
            
            <label className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/[0.02]">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-white mb-1">Click or drag to upload</span>
              <span className="text-xs text-slate-500">Supports JPG, PNG, GIF, MP4, MP3, TXT</span>
              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*,audio/*,text/plain" />
            </label>

            <div className="mt-6">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Or try a demo asset</div>
              <div className="grid grid-cols-3 gap-3">
                {DEMO_IMAGES.map((url, i) => (
                  <button 
                    key={i}
                    onClick={() => handleDemoSelect(url)}
                    className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-indigo-500 transition-colors"
                  >
                    <img src={url || undefined} alt={`Demo ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Area */}
          {selectedImage && (
            <div className="flex-1 bg-black border border-white/5 rounded-[24px] overflow-hidden shadow-xl relative min-h-[300px]">
              <img src={selectedImage || undefined} alt="Selected Asset" className="w-full h-full object-contain" />
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-[#09090B]/80 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                  <div className="relative w-20 h-20 mb-6">
                    <svg className="animate-spin w-full h-full text-indigo-500/20" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <BrainCircuit className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="text-indigo-400 font-semibold mb-2">Analyzing Asset...</div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden">
                    <motion.div 
                      className="bg-indigo-500 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 text-center">
                    Running neural network inference<br/>Extracting semantic tags and categories...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: AI Insights Dashboard */}
        <div className="flex-1 bg-[#111827]/40 border border-white/5 rounded-[24px] shadow-xl overflow-hidden flex flex-col relative backdrop-blur-md">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Asset Intelligence Report
            </h2>
            {insights && (
              <div className="flex items-center gap-2 text-sm bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                <Activity className="w-4 h-4" />
                Confidence: {insights.confidenceScore}%
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative">
            {!insights && !isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
                <p>Upload or select an asset to generate AI metadata.</p>
              </div>
            )}

            <AnimatePresence>
              {insights && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  
                  {/* Summary */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" /> Summary
                    </h3>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 text-slate-300 leading-relaxed text-sm">
                      {insights.summary}
                    </div>
                  </div>

                  {/* Smart Tags & Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-400" /> Auto-Generated Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {insights.tags.map((tag, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 transition-colors cursor-default">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Folder className="w-4 h-4 text-indigo-400" /> Smart Categories
                      </h3>
                      <div className="flex flex-col gap-2">
                        {insights.categories.map((cat, i) => (
                          <div key={i} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                            {cat}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Deep Analysis Grid */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" /> Visual Analysis
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Main Subject</div>
                        <div className="text-sm text-white font-medium capitalize">{insights.mainSubject}</div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Visual Style</div>
                        <div className="text-sm text-white font-medium capitalize">{insights.visualStyle}</div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Detected Mood</div>
                        <div className="text-sm text-white font-medium capitalize">{insights.mood}</div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Dominant Colors</div>
                        <div className="flex gap-2">
                          {insights.dominantColors.map((color, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              {/* Simple approximation, real implementation would use actual hex from API if possible */}
                              <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color.toLowerCase() }} />
                              <span className="text-xs text-slate-300 capitalize">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" /> AI Recommendations
                    </h3>
                    <div className="space-y-2">
                      {insights.recommendations.map((rec, i) => (
                        <div key={i} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 flex items-start gap-3">
                          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
