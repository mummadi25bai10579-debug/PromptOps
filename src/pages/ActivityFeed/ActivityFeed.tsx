import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, Bell, Search, Filter, MessageSquare, 
  Image as ImageIcon, Video, FileText, Settings, Sparkles, 
  Trash2, Upload, Share2, CheckCircle2, AlertCircle,
  Clock, MoreHorizontal, ChevronDown, UserPlus, Shield
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'generate': return <Sparkles className="w-4 h-4 text-indigo-400" />;
    case 'comment': return <MessageSquare className="w-4 h-4 text-blue-400" />;
    case 'upload': return <Upload className="w-4 h-4 text-emerald-400" />;
    case 'share': return <Share2 className="w-4 h-4 text-purple-400" />;
    case 'success': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case 'delete': return <Trash2 className="w-4 h-4 text-red-400" />;
    case 'role': return <Shield className="w-4 h-4 text-amber-400" />;
    default: return <Activity className="w-4 h-4 text-slate-400" />;
  }
};

export const ActivityFeed = () => {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time Firestore subscription
    const q = query(collection(db, 'activities'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const acts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user: data.userName || data.user || 'User',
          action: data.action || 'performed an action',
          target: data.target || 'item',
          type: data.type || 'activity',
          timestamp: data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          avatar: (data.userName || data.user || 'U').charAt(0).toUpperCase()
        };
      });
      setActivities(acts);
      setLoading(false);
    }, (err) => {
      console.error("Activities subscription error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredActivities = activities.filter(activity => {
    if (filter !== 'all' && activity.type !== filter) return false;
    if (searchQuery && !activity.user.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !activity.target.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full w-full">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Team Activity & Collab</h1>
          <p className="text-slate-400 text-sm">Real-time visibility into workspace activities and team presence.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {activities.slice(0, 4).map((act, i) => (
              <div key={act.id || i} className="w-8 h-8 rounded-full border-2 border-[#09090B] bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-display relative group">
                {act.avatar}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#09090B] bg-emerald-500" />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black/80 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="font-semibold">{act.user}</div>
                  <div className="text-slate-400">{act.action}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-8 h-8 rounded-full border border-dashed border-white/20 hover:border-white/40 flex items-center justify-center text-slate-400 hover:text-white transition-colors bg-white/5">
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Main Feed Column */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#111827]/40 border border-white/5 rounded-[24px] shadow-xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search activities, users, or assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#09090B] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {['all', 'generate', 'comment', 'upload', 'share'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors",
                    filter === f ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20" : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
            {filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Activity className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No activity recorded yet.</p>
                <p className="text-xs text-slate-600 mt-1">Actions performed across the workspace will appear here in real-time.</p>
              </div>
            ) : (
              <>
                <div className="absolute top-6 left-10 bottom-6 w-px bg-white/5 z-0" />
                <AnimatePresence>
                  {filteredActivities.map((activity) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={activity.id}
                      className="flex gap-4 relative z-10 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#09090B] border border-white/10 flex items-center justify-center shrink-0 z-10 mt-1 relative">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-white">
                          {activity.avatar}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#09090B] flex items-center justify-center border border-white/10">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="font-semibold text-white">{activity.user}</span>
                            <span className="text-slate-400 mx-1">{activity.action}</span>
                            <span className="font-medium text-indigo-300">{activity.target}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {activity.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar: Analytics & Online Users */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
          
          {/* Notifications Panel */}
          <div className="bg-[#111827]/60 border border-white/10 rounded-[24px] p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-indigo-400" /> Recent Alerts
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-emerald-300">Generation Complete</div>
                  <div className="text-xs text-emerald-400/70">Batch process 'Spring Campaign' finished successfully.</div>
                </div>
              </div>
              <div className="flex gap-3 items-start p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-red-300">API Rate Limit Warning</div>
                  <div className="text-xs text-red-400/70">Approaching daily generation quota limits.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Analytics */}
          <div className="bg-[#111827]/60 border border-white/10 rounded-[24px] p-5 shadow-xl flex-1">
             <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-indigo-400" /> Workspace Stats
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Top Contributors</div>
                <div className="space-y-2">
                  {activities.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-2 bg-black/40 rounded-lg border border-white/5">
                      No active contributors yet.
                    </div>
                  ) : (
                    Array.from(new Set(activities.map(a => a.actorName || a.user || 'System'))).slice(0, 3).map((userName, i) => {
                      const userCount = activities.filter(a => (a.actorName || a.user || 'System') === userName).length;
                      return (
                        <div key={i} className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                              {String(userName).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-slate-300">{String(userName)}</span>
                          </div>
                          <span className="text-xs font-mono text-indigo-400">{userCount} actions</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Activity Breakdown</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Generations</span>
                    <span className="text-white font-medium">
                      {activities.filter(a => a.action?.toLowerCase().includes('generation') || a.action?.toLowerCase().includes('prompt') || a.details?.toLowerCase().includes('generat')).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2"><Upload className="w-3.5 h-3.5 text-emerald-400" /> Uploads</span>
                    <span className="text-white font-medium">
                      {activities.filter(a => a.action?.toLowerCase().includes('upload') || a.details?.toLowerCase().includes('upload')).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Comments</span>
                    <span className="text-white font-medium">
                      {activities.filter(a => a.action?.toLowerCase().includes('comment') || a.details?.toLowerCase().includes('comment')).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
