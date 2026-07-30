import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Bot, Workflow, Sparkles, CheckCircle2, CircleDashed, 
  Loader2, ChevronRight, MessageSquare, Briefcase, Network,
  FileText, Activity, Clock, Play, Download
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

interface AgentTask {
  id: string;
  agentRole: string;
  name: string;
  description: string;
  dependsOn: string[];
  status: 'pending' | 'running' | 'success' | 'failed';
  result?: any;
  messages?: string[];
}

interface MultiAgentPlan {
  tasks: AgentTask[];
  estimatedTime: string;
  projectOverview: string;
}

const AGENT_COLORS: Record<string, string> = {
  'Project Manager Agent': 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
  'Research Agent': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  'Content Writer Agent': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  'Image Designer Agent': 'text-pink-400 bg-pink-500/20 border-pink-500/30',
  'Video Creator Agent': 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  'SEO Agent': 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  'Social Media Agent': 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  'Analytics Agent': 'text-rose-400 bg-rose-500/20 border-rose-500/30',
};

export const MultiAgentWorkspace = () => {
  const { user } = useAuthStore();
  const [goal, setGoal] = useState('');
  const [currentGoal, setCurrentGoal] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [plan, setPlan] = useState<MultiAgentPlan | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [chatLog, setChatLog] = useState<{agent: string, message: string, time: string}[]>([]);

  const handlePlanGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsPlanning(true);
    setPlan(null);
    setShowReport(false);
    setCurrentGoal(goal);
    setChatLog([
      { agent: 'Project Manager Agent', message: 'Analyzing goal and assembling the team...', time: new Date().toLocaleTimeString() }
    ]);

    try {
      const res = await fetch('/api/multiagent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal })
      });
      if (res.ok) {
        const data = await res.json();
        data.tasks = data.tasks.map((t: any) => ({ ...t, status: 'pending' }));
        setPlan(data);
        setChatLog(prev => [...prev, { agent: 'Project Manager Agent', message: `Plan complete. Assigned ${data.tasks.length} tasks across specialized agents.`, time: new Date().toLocaleTimeString() }]);
        
        if (user) {
          await addDoc(collection(db, 'agentProjects'), {
            userId: user.id,
            goal,
            plan: data,
            status: 'planned',
            timestamp: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Planning failed", error);
      setChatLog(prev => [...prev, { agent: 'System', message: 'Failed to generate plan.', time: new Date().toLocaleTimeString() }]);
    } finally {
      setIsPlanning(false);
    }
  };

  const executePlan = async () => {
    if (!plan) return;
    setIsRunning(true);
    
    let currentPlan = { ...plan };
    let executionContext: Record<string, any> = {};

    setChatLog(prev => [...prev, { agent: 'Project Manager Agent', message: 'Initiating project execution. Stand by.', time: new Date().toLocaleTimeString() }]);

    for (let i = 0; i < currentPlan.tasks.length; i++) {
      const task = currentPlan.tasks[i];
      
      task.status = 'running';
      setActiveTaskId(task.id);
      setPlan({ ...currentPlan });
      setChatLog(prev => [...prev, { agent: task.agentRole, message: `Starting task: ${task.name}`, time: new Date().toLocaleTimeString() }]);

      try {
        const res = await fetch('/api/multiagent/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            task, 
            goal: currentGoal,
            context: executionContext 
          })
        });

        if (res.ok) {
          const result = await res.json();
          task.status = 'success';
          task.result = result;
          task.messages = result.messages || [];
          executionContext[task.id] = result.output; 
          
          if (result.messages && result.messages.length > 0) {
            result.messages.forEach((msg: string) => {
              setChatLog(prev => [...prev, { agent: task.agentRole, message: msg, time: new Date().toLocaleTimeString() }]);
            });
          } else {
             setChatLog(prev => [...prev, { agent: task.agentRole, message: `Completed task: ${task.name}`, time: new Date().toLocaleTimeString() }]);
          }
        } else {
          task.status = 'failed';
          setChatLog(prev => [...prev, { agent: task.agentRole, message: `Task failed: ${task.name}`, time: new Date().toLocaleTimeString() }]);
          break; 
        }
      } catch (err) {
        task.status = 'failed';
        setChatLog(prev => [...prev, { agent: 'System', message: `Execution error on task: ${task.name}`, time: new Date().toLocaleTimeString() }]);
        break;
      }

      setPlan({ ...currentPlan });
    }

    setChatLog(prev => [...prev, { agent: 'Project Manager Agent', message: 'All tasks completed. Compiling final deliverables.', time: new Date().toLocaleTimeString() }]);
    setActiveTaskId(null);
    setIsRunning(false);
    setShowReport(true);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-400" />
            Multi-Agent Collaboration
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">Deploy a swarm of specialized AI agents working together to accomplish complex, multi-step goals.</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Column: Input & Task Board */}
        <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-6">
          
          {/* Goal Input */}
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-6 shadow-xl backdrop-blur-md">
            <form onSubmit={handlePlanGoal} className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Project Goal
              </label>
              <textarea 
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g., Create a complete product launch campaign including SEO blog posts, social media strategy, and ad copy..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none transition-colors shadow-inner"
                disabled={isPlanning || isRunning}
              />
              <button 
                type="submit" 
                disabled={!goal.trim() || isPlanning || isRunning}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                {isPlanning ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Briefing Project Manager...</>
                ) : (
                  <><Network className="w-4 h-4" /> Orchestrate Swarm</>
                )}
              </button>
            </form>
          </div>

          {/* Task Board */}
          <div className="flex-1 bg-[#111827]/40 border border-white/5 rounded-[24px] p-6 shadow-xl overflow-hidden flex flex-col relative backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Workflow className="w-4 h-4 text-indigo-400" />
                Task Board
              </h3>
              {plan && (
                <div className="text-xs text-slate-400 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                  <Clock className="w-3 h-3" /> {plan.estimatedTime}
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar relative">
              {!plan && !isPlanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm text-center px-4">
                  <Bot className="w-12 h-12 mb-3 opacity-20" />
                  Waiting for a project brief to assemble the team...
                </div>
              )}
              
              <div className="space-y-4">
                {plan?.tasks.map((task, idx) => (
                  <div key={task.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                        task.status === 'pending' ? "bg-[#09090B] border-white/10 text-slate-500" :
                        task.status === 'running' ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 animate-pulse" :
                        task.status === 'success' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                        "bg-red-500/20 border-red-500/50 text-red-400"
                      )}>
                        {task.status === 'pending' && <CircleDashed className="w-4 h-4" />}
                        {task.status === 'running' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {task.status === 'success' && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      {idx < plan.tasks.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-full my-1 rounded-full transition-colors",
                          task.status === 'success' ? "bg-emerald-500/30" : "bg-white/5"
                        )} />
                      )}
                    </div>
                    
                    <div className={cn(
                      "flex-1 pb-4 transition-opacity",
                      task.status === 'pending' && !isRunning ? "opacity-70" : "opacity-100"
                    )}>
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                        <div className={cn("inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mb-2", AGENT_COLORS[task.agentRole] || 'text-slate-400 bg-white/5 border border-white/10')}>
                          {task.agentRole}
                        </div>
                        <div className="text-sm font-semibold text-white mb-1">{task.name}</div>
                        <div className="text-xs text-slate-400 leading-relaxed">{task.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {plan && !isRunning && !showReport && (
              <button 
                onClick={executePlan}
                className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <Play className="w-4 h-4" /> Execute Project Plan
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Dashboard & Conversation */}
        <div className="flex-1 bg-[#111827]/40 border border-white/5 rounded-[24px] shadow-xl overflow-hidden flex flex-col relative backdrop-blur-md">
          
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
             <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Project Dashboard
            </h2>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col relative">
            {!plan && !isPlanning && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm text-center">
                 <Users className="w-16 h-16 mb-4 opacity-20" />
                 <p>Agents are standing by.</p>
               </div>
            )}

            {isPlanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <div className="text-lg font-semibold mb-2">Project Manager is analyzing the brief...</div>
                <div className="text-sm text-slate-400">Assigning tasks and establishing workflows.</div>
              </div>
            )}

            {/* Split View: Chat Log and Outputs */}
            {(isRunning || showReport) && (
              <div className="flex flex-col h-full">
                
                {/* Active Agents Chat Log */}
                <div className={cn("p-6 overflow-y-auto custom-scrollbar border-b border-white/5", showReport ? "h-64" : "flex-1")}>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Agent Communications Log
                  </div>
                  <div className="space-y-4">
                    {chatLog.map((log, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 w-16 shrink-0">{log.time}</div>
                        <div>
                          <span className={cn("text-xs font-bold mr-2", AGENT_COLORS[log.agent] ? AGENT_COLORS[log.agent].split(' ')[0] : 'text-slate-300')}>{log.agent}</span>
                          <span className="text-sm text-slate-300 leading-relaxed">{log.message}</span>
                        </div>
                      </div>
                    ))}
                    {isRunning && (
                       <div className="flex items-center gap-3 text-indigo-400 text-sm animate-pulse">
                         <div className="w-16 shrink-0" />
                         <span>Waiting for response...</span>
                       </div>
                    )}
                  </div>
                </div>

                {/* Final Deliverables / Active Output */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-black/20">
                  {showReport && plan ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                       <div className="flex items-center justify-between mb-6">
                         <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           <Sparkles className="w-5 h-5 text-emerald-400" /> Final Deliverables
                         </h3>
                         <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors border border-white/10">
                           <Download className="w-4 h-4" /> Download All
                         </button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {plan.tasks.filter(t => t.result).map((task, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                              <div className="flex items-center gap-2 text-xs font-mono">
                                <span className={cn(AGENT_COLORS[task.agentRole]?.split(' ')[0])}>{task.agentRole}</span>
                              </div>
                              <div className="text-sm font-semibold text-white">{task.name}</div>
                              {task.result?.assetUrl ? (
                                <div className="w-full h-40 bg-black rounded-lg border border-white/5 overflow-hidden">
                                  <img src={task.result.assetUrl || undefined} alt="Asset" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-full h-40 bg-black rounded-lg border border-white/5 p-3 overflow-y-auto custom-scrollbar">
                                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{task.result?.output}</p>
                                </div>
                              )}
                            </div>
                          ))}
                       </div>
                    </motion.div>
                  ) : isRunning && activeTaskId ? (
                     <div className="h-full flex items-center justify-center text-slate-500">
                        <div className="text-center">
                          <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p>Agents are actively working and generating outputs.</p>
                          <p className="text-xs mt-2">See communication log above for real-time updates.</p>
                        </div>
                     </div>
                  ) : null}
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
