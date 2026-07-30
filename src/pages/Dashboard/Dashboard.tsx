import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Search, Command, Activity, Box, 
  Workflow, Bot, HardDrive, Terminal, Users,
  BarChart3, ListTodo, AlertCircle, FolderOpen, Loader2
} from 'lucide-react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const [commandQuery, setCommandQuery] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Real Firestore Counts
  const [assetsCount, setAssetsCount] = useState(0);
  const [workflowsCount, setWorkflowsCount] = useState(0);
  const [agentRunsCount, setAgentRunsCount] = useState(0);
  const [storageBytes, setStorageBytes] = useState(0);
  const [apiRequestsCount, setApiRequestsCount] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  
  const [activities, setActivities] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Generations / Assets
    const unsubGenerations = onSnapshot(collection(db, 'generations'), (snapshot) => {
      setAssetsCount(snapshot.size);
      let bytes = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.fileSize && typeof data.fileSize === 'number') {
          bytes += data.fileSize;
        } else {
          bytes += 2500000; // estimated standard asset size
        }
      });
      setStorageBytes(bytes);
    }, (err) => console.error("Dashboard generations sub error:", err));

    // 2. Workflows
    const unsubWorkflows = onSnapshot(collection(db, 'workflows'), (snapshot) => {
      setWorkflowsCount(snapshot.size);
    }, (err) => console.error("Dashboard workflows sub error:", err));

    // 3. Agent Runs
    const unsubAgentRuns = onSnapshot(collection(db, 'agentRuns'), (snapshot) => {
      setAgentRunsCount(snapshot.size);
    }, (err) => console.error("Dashboard agentRuns sub error:", err));

    // 4. API Requests
    const unsubRequests = onSnapshot(collection(db, 'searchAnalytics'), (snapshot) => {
      setApiRequestsCount(snapshot.size);
    }, (err) => console.error("Dashboard analytics sub error:", err));

    // 5. Users / Workspace members
    const unsubMembers = onSnapshot(collection(db, 'workspaceMembers'), (snapshot) => {
      setActiveUsersCount(snapshot.size || 1);
    }, () => setActiveUsersCount(1));

    // 6. Activities
    const qActivities = query(collection(db, 'activities'), limit(10));
    const unsubActivities = onSnapshot(qActivities, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(list);
      setLoading(false);
    }, (err) => {
      console.error("Dashboard activities error:", err);
      setLoading(false);
    });

    // 7. Tasks
    const qTasks = query(collection(db, 'tasks'), limit(10));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(list);
    }, () => {});

    return () => {
      unsubGenerations();
      unsubWorkflows();
      unsubAgentRuns();
      unsubRequests();
      unsubMembers();
      unsubActivities();
      unsubTasks();
    };
  }, []);

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const stats = [
    { label: 'Assets Generated', value: assetsCount.toLocaleString(), icon: Box, change: assetsCount > 0 ? '+Real' : '0', color: 'from-cyan-500 to-blue-500' },
    { label: 'Active Workflows', value: workflowsCount.toLocaleString(), icon: Workflow, change: workflowsCount > 0 ? '+Real' : '0', color: 'from-purple-500 to-indigo-500' },
    { label: 'Agent Runs', value: agentRunsCount.toLocaleString(), icon: Bot, change: agentRunsCount > 0 ? '+Real' : '0', color: 'from-emerald-500 to-teal-500' },
    { label: 'Storage Usage', value: formatStorage(storageBytes), icon: HardDrive, change: storageBytes > 0 ? 'Active' : '0', color: 'from-pink-500 to-rose-500' },
    { label: 'API Requests', value: apiRequestsCount.toLocaleString(), icon: Terminal, change: apiRequestsCount > 0 ? 'Active' : '0', color: 'from-amber-500 to-orange-500' },
    { label: 'Team Activity', value: activeUsersCount.toString(), icon: Users, change: 'Members', color: 'from-blue-500 to-indigo-500' },
    { label: 'Total Compute Cost', value: '$0.00', icon: BarChart3, change: '0%', color: 'from-emerald-400 to-emerald-600' },
    { label: 'Top Model', value: 'Gemini 2.5', icon: Sparkles, change: 'Active', color: 'from-indigo-400 to-purple-600' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10 min-h-0 h-full overflow-y-auto custom-scrollbar">
      
      {/* Global Command Bar */}
      <div className="relative z-20">
        <div className="relative max-w-3xl mx-auto group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
          <div className="relative bg-[#09090B]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center">
            <Search className="w-5 h-5 text-indigo-400 ml-3 mr-2" />
            <input 
              type="text"
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              onFocus={() => setIsCommandOpen(true)}
              onBlur={() => setTimeout(() => setIsCommandOpen(false), 200)}
              placeholder="Type a command... (e.g., 'Generate 5 product ads', 'Analyze workspace')"
              className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 text-lg py-2"
            />
            <div className="flex items-center gap-2 mr-2">
               <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                 <Command className="w-3 h-3" /> K
               </span>
               <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg">
                 Execute
               </button>
            </div>
          </div>

          {/* Command Suggestions */}
          <AnimatePresence>
            {isCommandOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-50"
              >
                <div className="p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Actions</div>
                <div className="p-1">
                  {['Generate 5 product ads', 'Create social media campaign', 'Analyze workspace performance', 'Find all gaming assets'].map((cmd, i) => (
                    <button key={i} className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-xl text-slate-300 hover:text-white flex items-center gap-3 transition-colors">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      {cmd}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Executive Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111827]/40 backdrop-blur-md p-5 hover:bg-[#111827]/60 transition-colors">
            <div className={cn("absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity", stat.color)} />
            <div className="flex justify-between items-start mb-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              <div className={cn("p-1.5 rounded-lg bg-gradient-to-br bg-opacity-10 backdrop-blur-md border border-white/10", stat.color)}>
                <stat.icon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-display font-bold text-white">{stat.value}</h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center">
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main OS Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Timeline */}
        <div className="lg:col-span-2 bg-[#111827]/40 border border-white/5 rounded-[24px] p-6 shadow-xl backdrop-blur-md">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-lg font-bold text-white flex items-center gap-2">
               <Activity className="w-5 h-5 text-indigo-400" /> Activity Timeline
             </h2>
           </div>
           
           {loading ? (
             <div className="flex items-center justify-center p-8 text-indigo-400 gap-2">
               <Loader2 className="w-5 h-5 animate-spin" />
               <span className="text-sm">Loading activity...</span>
             </div>
           ) : activities.length === 0 ? (
             <div className="p-8 text-center text-slate-500 border border-white/5 rounded-2xl bg-black/20">
               <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
               <p className="text-sm font-medium">No activity recorded yet.</p>
               <p className="text-xs text-slate-600 mt-1">Actions performed in the platform will appear here.</p>
             </div>
           ) : (
             <div className="space-y-4">
               {activities.map((item, i) => (
                 <div key={item.id || i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex items-center justify-between">
                   <div>
                     <h3 className="font-bold text-white text-sm mb-0.5">{item.details || item.action || 'Workspace Event'}</h3>
                     <time className="text-xs font-mono text-slate-500">
                       {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleString() : 'Recent'}
                     </time>
                   </div>
                   <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                     {item.actorName || item.user || 'System'}
                   </span>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Global Task Center */}
        <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-6 shadow-xl backdrop-blur-md flex flex-col">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-lg font-bold text-white flex items-center gap-2">
               <ListTodo className="w-5 h-5 text-emerald-400" /> Global Tasks
             </h2>
             <span className="text-xs font-bold text-slate-400 bg-white/5 px-2 py-1 rounded">
               {tasks.length} Tasks
             </span>
           </div>
           
           <div className="flex-1 space-y-3">
             {tasks.length === 0 ? (
               <div className="p-8 text-center text-slate-500 border border-white/5 rounded-2xl bg-black/20">
                 <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-20" />
                 <p className="text-sm font-medium">No tasks found.</p>
                 <p className="text-xs text-slate-600 mt-1">Pending workspace tasks will appear here.</p>
               </div>
             ) : (
               tasks.map((task, i) => (
                 <div key={task.id || i} className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-start gap-3 hover:border-white/10 transition-colors">
                   <div>
                     <div className="text-sm font-semibold text-white mb-1 leading-tight">{task.title || task.name || 'Untitled Task'}</div>
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                         {task.project || 'General'}
                       </span>
                     </div>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>

      </div>

    </div>
  );
};
