import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { GenerationJob } from '../../types';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ImageSelectorProps {
  selected: GenerationJob | null;
  onSelect: (job: GenerationJob) => void;
  excludeId?: string;
}

export const ImageSelector = ({ selected, onSelect, excludeId }: ImageSelectorProps) => {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    
    const fetchJobs = async () => {
      try {
        const q = query(
          collection(db, 'generations'),
          where('userId', '==', user.id),
          where('status', '==', 'completed'),
          where('type', '==', 'image')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GenerationJob[];
        data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime());
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime());
          return timeB - timeA;
        });
        setJobs(data);
      } catch (err) {
        console.error('Failed to fetch jobs for selection', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [user]);

  if (selected) {
    const selectedSrc = selected.resultUrl || selected.fileUrl || selected.b2Url;
    return (
      <div className="w-full h-full relative group">
        {selectedSrc ? (
          <img src={selectedSrc} alt="Selected" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-slate-500">No Image</div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
           <button 
             onClick={() => onSelect(null as any)}
             className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-md font-medium transition-colors"
           >
             Change Image
           </button>
        </div>
      </div>
    );
  }

  const filteredJobs = jobs.filter(job => 
    job.id !== excludeId && 
    (search ? job.prompt.toLowerCase().includes(search.toLowerCase()) : true)
  );

  return (
    <div className="flex flex-col h-full bg-black/20">
      <div className="p-4 border-b border-white/5 pt-14">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search generations..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-xl" />
             ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No images found. Generate some images first.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
             {filteredJobs.map(job => {
               const jobUrl = job.resultUrl || job.fileUrl || job.b2Url;
               return (
                 <button
                   key={job.id}
                   onClick={() => onSelect(job)}
                   className={cn(
                     "aspect-square rounded-xl overflow-hidden relative group border-2 transition-all",
                     "border-transparent hover:border-indigo-500/50"
                   )}
                 >
                   {jobUrl ? (
                     <img src={jobUrl} className="w-full h-full object-cover" loading="lazy" alt="Preview" />
                   ) : (
                     <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-slate-500">No Image</div>
                   )}
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                     <p className="text-[10px] text-white line-clamp-3 text-left font-medium">
                       {job.prompt}
                     </p>
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
