import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Download, Share2, Eye, Calendar, User, 
  MessageSquare, Sparkles, Image as ImageIcon, Video,
  Lock, ArrowRight, ShieldCheck, Flag, Loader2, AlertCircle
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { cn } from '../../utils/cn';

export const PublicShowcase = () => {
  const { shareId } = useParams();
  const [asset, setAsset] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    async function fetchSharedAsset() {
      if (!shareId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Check in generations collection
        let docRef = doc(db, 'generations', shareId);
        let docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          // Check in assets collection
          docRef = doc(db, 'assets', shareId);
          docSnap = await getDoc(docRef);
        }

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAsset({
            id: docSnap.id,
            title: data.prompt || data.title || 'Untitled Asset',
            description: data.description || 'AI-generated creative asset.',
            type: data.type || 'image',
            url: data.imageUrl || data.url || data.videoUrl || '',
            creator: data.userName || data.creator || 'Creator',
            creatorAvatar: (data.userName || data.creator || 'C').charAt(0).toUpperCase(),
            date: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Recent',
            views: data.views || 1,
            likes: data.likes || 0,
            downloads: data.downloads || 0,
            tags: data.tags || ['ai', 'creative'],
            prompt: data.prompt || '',
            model: data.model || 'gemini-2.5-flash'
          });
          setLikes(data.likes || 0);

          // Optionally increment views count
          updateDoc(docRef, { views: increment(1) }).catch(() => {});
        } else {
          setAsset(null);
        }
      } catch (err) {
        console.error('Error fetching shared asset:', err);
        setAsset(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSharedAsset();
  }, [shareId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-indigo-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm font-medium">Loading showcase asset...</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-[#09090B] text-slate-300 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Asset Not Found</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          The requested shared item does not exist or may have been removed.
        </p>
        <a href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors">
          Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col">
      {/* Public Navbar */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#111827]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-display font-bold text-lg tracking-tight">PromptOps AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">
            Report Content
          </button>
          <a href="/" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
            Create Your Own
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Asset Preview */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative group">
            {asset.url ? (
              <img src={asset.url || undefined} alt={asset.title} className="w-full h-auto max-h-[70vh] object-contain" />
            ) : (
              <div className="p-12 text-center text-slate-500">No media preview available</div>
            )}
            
            {/* Watermark / Attribution overlay */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-white">Generated with PromptOps</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {asset.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-300">
                  #{tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center gap-2 bg-[#111827] border border-white/10 rounded-xl p-1">
              <button 
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isLiked ? "bg-pink-500/10 text-pink-500" : "hover:bg-white/5 text-slate-400 hover:text-white"
                )}
              >
                <Heart className={cn("w-4 h-4", isLiked && "fill-pink-500")} />
                {likes.toLocaleString()}
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              {asset.url && (
                <>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <a 
                    href={asset.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Creator */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6">
          
          <div className="bg-[#111827]/60 border border-white/10 rounded-2xl p-6 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2">{asset.title}</h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              {asset.description}
            </p>

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
                {asset.creatorAvatar}
              </div>
              <div>
                <div className="text-sm text-slate-500">Created by</div>
                <div className="text-base font-semibold text-white">{asset.creator}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-slate-500 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Views</div>
                <div className="text-sm font-semibold text-white">{asset.views.toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-slate-500 flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Downloads</div>
                <div className="text-sm font-semibold text-white">{asset.downloads.toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date</div>
                <div className="text-sm font-semibold text-white">{asset.date}</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-slate-500 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> License</div>
                <div className="text-sm font-semibold text-emerald-400">Public Domain</div>
              </div>
            </div>
            
            {/* Generation Details */}
            {asset.prompt && (
              <div className="bg-black/30 border border-white/5 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-200">Generation Details</span>
                  </div>
                  <ArrowRight className={cn("w-4 h-4 text-slate-500 transition-transform", showPrompt && "rotate-90")} />
                </button>
                
                <AnimatePresence>
                  {showPrompt && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 border-t border-white/5 space-y-4">
                        <div>
                          <div className="text-xs font-semibold text-slate-500 mb-1">Model Used</div>
                          <div className="text-sm text-white inline-flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                            {asset.model}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-500 mb-1">Original Prompt</div>
                          <div className="text-sm text-slate-300 leading-relaxed font-mono bg-black/50 p-3 rounded-lg border border-white/5">
                            "{asset.prompt}"
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </div>
        </div>

      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-slate-500 text-sm mt-auto">
        <p>&copy; {new Date().getFullYear()} PromptOps AI. All rights reserved.</p>
      </footer>
    </div>
  );
};
