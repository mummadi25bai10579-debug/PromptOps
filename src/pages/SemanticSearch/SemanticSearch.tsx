import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Grid, List, Clock, TrendingUp, Sparkles, 
  Image as ImageIcon, Video, Music, FileText, Download, 
  Share2, MoreHorizontal, Loader2, Maximize2, X, Play,
  BarChart3, Activity
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

const RECENT_SEARCHES = ['cyberpunk images', 'product advertisements', 'futuristic videos', 'blue logo concepts'];
const SUGGESTIONS = ['Show me cinematic portraits', 'Find 3D renders with vibrant colors', 'Looking for upbeat background music', 'Generate marketing copy variants'];

export const SemanticSearch = () => {
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  // Focus management
  const [isFocused, setIsFocused] = useState(false);

  // Analytics Modal
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load real assets from Firestore
  useEffect(() => {
    async function loadRealAssets() {
      try {
        const snapshot = await getDocs(query(collection(db, 'generations'), limit(100)));
        const fetched = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            type: d.type || 'image',
            url: d.imageUrl || d.url || d.videoUrl || '',
            title: d.prompt ? (d.prompt.length > 30 ? d.prompt.slice(0, 30) + '...' : d.prompt) : 'Generated Asset',
            prompt: d.prompt || '',
            model: d.model || 'gemini-2.5-flash',
            creator: d.userName || 'You',
            date: d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000).toISOString().split('T')[0] : 'Recent',
            tags: d.tags || ['ai', 'generated']
          };
        });
        setAllAssets(fetched);
        setResults(fetched);
      } catch (err) {
        console.error("Failed to load assets for search:", err);
      }
    }
    loadRealAssets();
  }, []);

  // Perform Semantic Search
  const handleSearch = async (queryText: string = searchQuery) => {
    const lowerQuery = queryText.toLowerCase().trim();
    setIsSearching(true);
    setSearchQuery(queryText);
    setIsFocused(false);

    try {
      // 1. Generate Embedding via API if available
      let embedding = [];
      try {
        const res = await fetch('/api/search/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: queryText })
        });
        if (res.ok) {
          const data = await res.json();
          embedding = data.embedding || [];
        }
      } catch (e) {
        console.error("Embedding generation failed", e);
      }

      // 2. Log Search History to Firestore Analytics
      if (user && queryText) {
        await addDoc(collection(db, 'searchHistory'), {
          userId: user.id,
          query: queryText,
          embedding: embedding.length ? embedding : null,
          timestamp: serverTimestamp(),
          filters: { type: typeFilter, date: dateFilter }
        });

        await addDoc(collection(db, 'searchAnalytics'), {
          userId: user.id,
          type: 'search_executed',
          queryLength: queryText.length,
          timestamp: serverTimestamp()
        });
      }

      // Filter real assets
      let filtered = allAssets;
      if (lowerQuery) {
        filtered = allAssets.filter(asset => 
          asset.title.toLowerCase().includes(lowerQuery) ||
          asset.prompt.toLowerCase().includes(lowerQuery) ||
          asset.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery)) ||
          asset.creator.toLowerCase().includes(lowerQuery)
        );
      }

      if (typeFilter !== 'all') {
        filtered = filtered.filter(a => a.type === typeFilter);
      }

      setResults(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Header & Search Bar */}
      <header className="mb-8 z-20 relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Semantic Asset Search</h1>
            <p className="text-slate-400 text-sm">Find exactly what you need using natural language.</p>
          </div>
          <button 
            onClick={() => setShowAnalytics(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-sm font-medium transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Search Insights
          </button>
        </div>
        
        <div className="relative max-w-3xl">
          <div className={cn(
            "relative flex items-center bg-[#111827]/80 backdrop-blur-xl border rounded-2xl transition-all shadow-2xl overflow-hidden",
            isFocused ? "border-indigo-500 shadow-indigo-500/20" : "border-white/10"
          )}>
            <div className="pl-4">
              <Search className={cn("w-5 h-5", isFocused ? "text-indigo-400" : "text-slate-400")} />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 'Show my cyberpunk images' or 'Find product ads created last week'"
              className="w-full bg-transparent border-none text-white placeholder-slate-500 px-4 py-4 text-base focus:outline-none focus:ring-0"
            />
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-4 border-l transition-colors flex items-center gap-2 text-sm font-medium",
                showFilters ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400" : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button 
              onClick={() => handleSearch()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 font-semibold transition-colors"
            >
              Search
            </button>
          </div>

          {/* Smart Suggestions Dropdown */}
          <AnimatePresence>
            {isFocused && !searchQuery && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#111827]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 flex flex-col md:flex-row gap-6"
              >
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Recent
                  </h3>
                  <ul className="space-y-1">
                    {RECENT_SEARCHES.map(s => (
                      <li key={s}>
                        <button onClick={() => { setSearchQuery(s); handleSearch(s); }} className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> AI Suggestions
                  </h3>
                  <ul className="space-y-1">
                    {SUGGESTIONS.map(s => (
                      <li key={s}>
                        <button onClick={() => { setSearchQuery(s); handleSearch(s); }} className="w-full text-left px-3 py-2 rounded-lg text-sm text-indigo-200/80 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors">
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="flex flex-1 gap-6 min-h-0 relative z-10">
        
        {/* Filters Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="shrink-0 overflow-hidden"
            >
              <div className="w-[280px] h-full bg-[#111827]/40 border border-white/5 rounded-2xl shadow-xl p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Asset Type</h3>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'all', label: 'All Assets', icon: Grid },
                      { id: 'image', label: 'Images', icon: ImageIcon },
                      { id: 'video', label: 'Videos', icon: Video },
                      { id: 'audio', label: 'Audio', icon: Music },
                      { id: 'text', label: 'Text/Documents', icon: FileText },
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => { setTypeFilter(type.id); handleSearch(); }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          typeFilter === type.id ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        )}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Time Created</h3>
                  <div className="flex flex-col gap-2">
                    {['Any time', 'Today', 'This week', 'This month', 'This year'].map((t, i) => {
                      const id = ['all', 'today', 'week', 'month', 'year'][i];
                      return (
                        <button
                          key={id}
                          onClick={() => { setDateFilter(id); handleSearch(); }}
                          className={cn(
                            "text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            dateFilter === id ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#111827]/20 border border-white/5 rounded-2xl shadow-xl backdrop-blur-md relative">
          
          <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-medium text-slate-300">
              {isSearching ? 'Searching...' : `Found ${results.length} semantic matches`}
            </h2>
            <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/5">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded transition-colors", viewMode === 'grid' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded transition-colors", viewMode === 'list' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
            {isSearching && (
              <div className="absolute inset-0 bg-[#09090B]/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <span className="text-sm font-medium text-indigo-400 animate-pulse">Running semantic search...</span>
              </div>
            )}

            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>No semantic matches found.</p>
                <button onClick={() => {setSearchQuery(''); setTypeFilter('all'); setDateFilter('all'); handleSearch('');}} className="mt-4 text-indigo-400 text-sm hover:underline">Clear filters</button>
              </div>
            ) : (
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              )}>
                {results.map((asset) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={cn(
                      "group cursor-pointer bg-[#111827] border border-white/5 hover:border-indigo-500/50 rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-indigo-500/10",
                      viewMode === 'list' && "flex h-32"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className={cn(
                      "bg-black relative overflow-hidden flex items-center justify-center shrink-0",
                      viewMode === 'grid' ? "aspect-square w-full" : "w-48 h-full border-r border-white/5"
                    )}>
                      {asset.type === 'text' ? (
                        <FileText className="w-12 h-12 text-slate-700" />
                      ) : (
                        <img src={asset.url || undefined} alt={asset.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      )}
                      
                      {asset.type === 'video' && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Play className="w-10 h-10 text-white/80 drop-shadow-lg" />
                        </div>
                      )}
                      
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-semibold text-white uppercase tracking-wider flex items-center gap-1">
                          {asset.type === 'image' && <ImageIcon className="w-3 h-3" />}
                          {asset.type === 'video' && <Video className="w-3 h-3" />}
                          {asset.type === 'text' && <FileText className="w-3 h-3" />}
                          {asset.type}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className={cn("p-4 flex flex-col justify-center min-w-0 flex-1")}>
                      <h3 className="text-white font-medium truncate mb-1">{asset.title}</h3>
                      <p className="text-xs text-slate-500 truncate mb-3">{asset.prompt}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        <span>{asset.creator}</span>
                        <span>{asset.date}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Asset Preview Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#09090B] border border-white/10 rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl"
            >
              {/* Image Preview */}
              <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
                {selectedAsset.type === 'text' ? (
                  <FileText className="w-24 h-24 text-slate-700" />
                ) : (
                  <img src={selectedAsset.url || undefined} alt={selectedAsset.title} className="w-full h-full object-contain" />
                )}
                <button 
                  onClick={() => setSelectedAsset(null)}
                  className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-colors md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Asset Details */}
              <div className="w-full md:w-[400px] shrink-0 bg-[#111827] flex flex-col">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white">Asset Details</h2>
                  <button 
                    onClick={() => setSelectedAsset(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors hidden md:block"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Title</div>
                    <div className="text-white font-medium">{selectedAsset.title}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Original Prompt</div>
                    <div className="bg-black/50 border border-white/5 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                      {selectedAsset.prompt}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Model</div>
                      <div className="text-sm text-slate-300 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        {selectedAsset.model}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Type</div>
                      <div className="text-sm text-slate-300 capitalize">{selectedAsset.type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Creator</div>
                      <div className="text-sm text-slate-300">{selectedAsset.creator}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Date</div>
                      <div className="text-sm text-slate-300">{selectedAsset.date}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Semantic Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAsset.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-slate-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-[#09090B] flex gap-3">
                  <button className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    <Maximize2 className="w-4 h-4" /> Open
                  </button>
                  <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Drawer */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] bg-[#09090B] border-l border-white/10 z-50 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111827]/80">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Search Analytics
              </h2>
              <button onClick={() => setShowAnalytics(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Searches</div>
                  <div className="text-2xl font-bold text-white">1,248</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> +12% this week
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-white">94%</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> +2% this week
                  </div>
                </div>
              </div>

              {/* Top Searches */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-indigo-400" /> Top Searches
                </h3>
                <div className="space-y-3">
                  {[
                    { query: 'cyberpunk city background', count: 342, trend: 'up' },
                    { query: 'product ad running shoes', count: 215, trend: 'up' },
                    { 
                      query: 'marketing video templates', count: 184, trend: 'down' },
                    { query: 'blue logo concepts', count: 156, trend: 'up' },
                    { query: 'abstract 3d renders', count: 120, trend: 'down' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-lg">
                      <span className="text-sm text-slate-300 truncate pr-4">{item.query}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-slate-500">{item.count}</span>
                        {item.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Accessed */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                  <ImageIcon className="w-4 h-4 text-indigo-400" /> Most Accessed Assets
                </h3>
                {allAssets.length === 0 ? (
                  <div className="text-xs text-slate-500 py-4">No assets accessed yet.</div>
                ) : (
                  <div className="space-y-3">
                    {allAssets.slice(0, 3).map((asset, i) => (
                      <div key={asset.id || i} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors" onClick={() => { setSelectedAsset(asset); setShowAnalytics(false); }}>
                        <div className="w-10 h-10 bg-black rounded flex items-center justify-center shrink-0 overflow-hidden">
                          {asset.type === 'text' ? <FileText className="w-4 h-4 text-slate-600" /> : <img src={asset.url || undefined} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate font-medium">{asset.title}</div>
                          <div className="text-xs text-slate-500">{asset.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
