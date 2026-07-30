import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { GenerationJob, AssetType } from '../../types';
import { Search, Image as ImageIcon, Video, Music, FileText, Check, Sparkles, Filter, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AssetSelectorModalProps {
  selectedAsset: GenerationJob | null;
  onSelect: (job: GenerationJob | null) => void;
  excludeId?: string;
  title?: string;
}

export const AssetSelectorModal: React.FC<AssetSelectorModalProps> = ({
  selectedAsset,
  onSelect,
  excludeId,
  title = 'Select Generation Version',
}) => {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<AssetType | 'all'>('all');

  useEffect(() => {
    if (!user) return;

    const fetchJobs = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'generations'),
          where('userId', '==', user.id),
          where('status', '==', 'completed')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as GenerationJob[];
        data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime());
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime());
          return timeB - timeA;
        });
        setJobs(data);
      } catch (err) {
        console.error('Failed to fetch generations for comparison', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user]);

  if (selectedAsset) {
    return (
      <div className="w-full h-full relative group rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex flex-col items-center justify-center min-h-[300px]">
        {selectedAsset.type === 'image' && (selectedAsset.resultUrl || selectedAsset.fileUrl || selectedAsset.b2Url) && (
          <img src={selectedAsset.resultUrl || selectedAsset.fileUrl || selectedAsset.b2Url || undefined} alt="Selected" className="w-full h-full object-cover" />
        )}
        {selectedAsset.type === 'video' && (selectedAsset.resultUrl || selectedAsset.fileUrl || selectedAsset.b2Url) && (
          <video src={selectedAsset.resultUrl || selectedAsset.fileUrl || selectedAsset.b2Url || undefined} className="w-full h-full object-cover" muted loop autoPlay />
        )}
        {selectedAsset.type === 'audio' && (
          <div className="p-6 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Music className="w-8 h-8" />
            </div>
            <p className="font-semibold text-white text-sm line-clamp-2">{selectedAsset.prompt}</p>
            <span className="text-xs text-slate-400">{selectedAsset.model}</span>
          </div>
        )}
        {(selectedAsset.type === 'text' || selectedAsset.type === 'document') && (
          <div className="p-6 flex flex-col gap-2 text-left w-full h-full justify-between">
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold uppercase tracking-wider">
              <FileText className="w-4 h-4" /> Text Output
            </div>
            <p className="text-xs font-mono text-slate-300 line-clamp-6 bg-black/60 p-3 rounded-xl border border-white/5">
              {selectedAsset.generatedText || selectedAsset.prompt}
            </p>
            <span className="text-xs text-slate-500">{selectedAsset.model}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm p-4">
          <button
            onClick={() => onSelect(null)}
            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-md font-semibold text-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Change Selection
          </button>
        </div>
      </div>
    );
  }

  const filteredJobs = jobs.filter((job) => {
    if (job.id === excludeId) return false;
    if (selectedType !== 'all' && job.type !== selectedType) return false;
    if (search) {
      const matchPrompt = job.prompt?.toLowerCase().includes(search.toLowerCase());
      const matchModel = job.model?.toLowerCase().includes(search.toLowerCase());
      return matchPrompt || matchModel;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-black/30 rounded-2xl overflow-hidden border border-white/10">
      <div className="p-4 border-b border-white/10 flex flex-col gap-3 bg-white/[0.02]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by prompt or model..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
          {(['all', 'image', 'video', 'audio', 'text'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5",
                selectedType === t ? "bg-indigo-600 text-white shadow-sm" : "bg-white/5 text-slate-400 hover:text-white"
              )}
            >
              {t === 'image' && <ImageIcon className="w-3 h-3" />}
              {t === 'video' && <Video className="w-3 h-3" />}
              {t === 'audio' && <Music className="w-3 h-3" />}
              {t === 'text' && <FileText className="w-3 h-3" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No matching versions found.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredJobs.map((job) => {
              const url = job.resultUrl || job.fileUrl;
              return (
                <button
                  key={job.id}
                  onClick={() => onSelect(job)}
                  className={cn(
                    "aspect-square rounded-xl overflow-hidden relative group border-2 transition-all text-left bg-black/40 flex flex-col justify-between p-2 cursor-pointer",
                    "border-white/5 hover:border-indigo-500/80 hover:scale-[1.02]"
                  )}
                >
                  {job.type === 'image' && url && (
                    <img src={url} className="absolute inset-0 w-full h-full object-cover" loading="lazy" alt="Preview" />
                  )}

                  {job.type === 'video' && url && (
                    <video src={url} className="absolute inset-0 w-full h-full object-cover" muted />
                  )}

                  {job.type === 'audio' && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                      <Music className="w-6 h-6 text-emerald-400 mb-1" />
                      <span className="text-[10px] text-slate-400 line-clamp-2">{job.prompt}</span>
                    </div>
                  )}

                  {(job.type === 'text' || job.type === 'document') && (
                    <div className="w-full h-full flex flex-col justify-between p-1">
                      <FileText className="w-5 h-5 text-indigo-400" />
                      <p className="text-[10px] font-mono text-slate-300 line-clamp-3">
                        {job.generatedText || job.prompt}
                      </p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between z-10">
                    <p className="text-[10px] text-white line-clamp-3 font-medium">{job.prompt}</p>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-white/10 pt-1">
                      <span className="truncate">{job.model}</span>
                      <span className="uppercase text-indigo-300 font-bold">{job.type}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
