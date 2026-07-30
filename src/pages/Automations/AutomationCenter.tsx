import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Plus, Calendar, Clock, Play, 
  Workflow, ArrowRight, MoreVertical,
  Activity, Webhook, Loader2
} from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

export const AutomationCenter = () => {
  const { user } = useAuthStore();
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('Schedule');
  const [schedule, setSchedule] = useState('Every Monday, 9AM');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'automations'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAutomations(list);
      setLoading(false);
    }, (err) => {
      console.error("AutomationCenter subscription error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'automations'), {
        name,
        trigger,
        schedule,
        actions: 1,
        status: 'active',
        lastRun: 'Never',
        userId: user.id,
        createdAt: serverTimestamp(),
      });
      setName('');
      setShowModal(false);
    } catch (err) {
      console.error("Failed to create automation:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-400" />
            Automation Engine
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">Schedule workflows, configure webhooks, and setup event-driven AI agents.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg"
        >
          <Plus className="w-4 h-4" /> Create Automation
        </button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-amber-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading automations...</span>
          </div>
        ) : automations.length === 0 ? (
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-12 text-center text-slate-500 max-w-lg mx-auto">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20 text-amber-400" />
            <h3 className="text-lg font-bold text-white mb-1">No Automations Configured</h3>
            <p className="text-sm text-slate-400 mb-6">Create automated pipelines to schedule asset generation, webhook triggers, and event loops.</p>
            <button 
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Create Automation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {automations.map((automation) => (
              <div key={automation.id} className="bg-[#111827]/40 border border-white/5 hover:border-white/10 transition-all rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                 
                 <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 shadow-lg",
                     automation.status === 'active' ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-slate-500/20 border-slate-500/50 text-slate-400"
                   )}>
                     {automation.trigger === 'Schedule' ? <Calendar className="w-5 h-5" /> : 
                      automation.trigger === 'Webhook' ? <Webhook className="w-5 h-5" /> : 
                      <Activity className="w-5 h-5" />}
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                       {automation.name}
                       <span className={cn(
                         "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded",
                         automation.status === 'active' ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"
                       )}>
                         {automation.status}
                       </span>
                     </h3>
                     <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold">
                       <span className="flex items-center gap-1">
                         <Workflow className="w-3.5 h-3.5" /> {automation.actions || 1} Actions
                       </span>
                       <span className="flex items-center gap-1">
                         <Clock className="w-3.5 h-3.5" /> Last Run: {automation.lastRun || 'Never'}
                       </span>
                     </div>
                   </div>
                 </div>

                 <div className="flex items-center justify-between md:justify-end gap-6 border-t border-white/5 md:border-t-0 pt-4 md:pt-0">
                    <div className="bg-black/30 border border-white/5 rounded-lg px-4 py-2 flex items-center gap-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{automation.trigger}</div>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <div className="text-sm font-mono text-indigo-300">
                        {automation.schedule || automation.endpoint || automation.event || 'Configured'}
                      </div>
                    </div>
                 </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Automation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Create New Automation</h2>
            <form onSubmit={handleCreateAutomation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Automation Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Weekly Report Generator" 
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Trigger Type</label>
                <select 
                  value={trigger} 
                  onChange={e => setTrigger(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Schedule">Schedule (Cron)</option>
                  <option value="Webhook">Webhook Endpoint</option>
                  <option value="Event">Asset Event</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Schedule / Details</label>
                <input 
                  type="text" 
                  value={schedule} 
                  onChange={e => setSchedule(e.target.value)} 
                  placeholder="e.g. Every Monday, 9AM" 
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating} 
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Automation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
