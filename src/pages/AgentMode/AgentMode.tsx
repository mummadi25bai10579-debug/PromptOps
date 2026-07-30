import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Play, CheckCircle2, CircleDashed, 
  AlertCircle, Download, Sparkles, BrainCircuit, Activity,
  Server, Loader2, ListTree, Clock, Folder, DollarSign,
  Zap, Copy, Check, ExternalLink, Image as ImageIcon, Video,
  Volume2, FileText, BarChart3, Layers, History, Trash2, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';
import { agentService, AgentRunDoc, AgentTaskDoc } from '../../services/agentService';
import { projectManagementService, ProjectDoc } from '../../services/projectManagementService';
import { db } from '../../firebase/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

export const AgentMode = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // State
  const [goal, setGoal] = useState('');
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Agent Runs & Tasks
  const [agentRuns, setAgentRuns] = useState<AgentRunDoc[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<AgentTaskDoc[]>([]);
  
  // Real Activity Logs & Generated Assets
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<any[]>([]);

  // UI Loading States
  const [isPlanning, setIsPlanning] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOutputFilter, setSelectedOutputFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'text'>('all');

  const activeRun = agentRuns.find(r => r.id === activeRunId) || agentRuns[0] || null;

  // Subscribe to Projects
  useEffect(() => {
    const unsub = projectManagementService.subscribeProjects((list) => {
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to Agent Runs
  useEffect(() => {
    const unsub = agentService.subscribeAgentRuns(user?.id, (runs) => {
      setAgentRuns(runs);
      if (runs.length > 0 && (!activeRunId || !runs.some(r => r.id === activeRunId))) {
        setActiveRunId(runs[0].id);
      }
    });
    return () => unsub();
  }, [user]);

  // Subscribe to Tasks for Active Run
  useEffect(() => {
    if (!activeRun?.id) {
      setTasks([]);
      return;
    }
    const unsub = agentService.subscribeAgentTasks(activeRun.id, (taskList) => {
      setTasks(taskList);
    });
    return () => unsub();
  }, [activeRun?.id]);

  // Subscribe to Activity Logs for Active Project
  useEffect(() => {
    const projId = activeRun?.projectId || selectedProjectId;
    if (!projId) {
      setActivityLogs([]);
      return;
    }

    const q = query(
      collection(db, 'activityLogs'),
      where('projectId', '==', projId),
      orderBy('timestamp', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(q, (snap) => {
      const logs: any[] = [];
      snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
      setActivityLogs(logs);
    }, (err) => {
      console.warn('Activity logs sub error:', err);
      setActivityLogs([]);
    });

    return () => unsub();
  }, [activeRun?.projectId, selectedProjectId]);

  // Subscribe to Generated Assets for Active Run / Project
  useEffect(() => {
    const projId = activeRun?.projectId || selectedProjectId;
    if (!projId) {
      setGeneratedAssets([]);
      return;
    }

    const q = query(
      collection(db, 'generatedAssets'),
      where('projectId', '==', projId),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      const assets: any[] = [];
      snap.forEach(d => assets.push({ id: d.id, ...d.data() }));
      setGeneratedAssets(assets);
    }, (err) => {
      console.warn('Assets sub error:', err);
      setGeneratedAssets([]);
    });

    return () => unsub();
  }, [activeRun?.projectId, selectedProjectId]);

  // Generate Execution Plan (Step 1 - Step 5)
  const handlePlanGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || !user) return;

    setIsPlanning(true);

    try {
      const { runDoc } = await agentService.createAgentRun({
        userId: user.id,
        goal: goal.trim(),
        projectId: selectedProjectId
      });

      setActiveRunId(runDoc.id);
      setGoal('');
    } catch (err: any) {
      console.error('Failed to create agent run:', err);
      alert(`Planning failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsPlanning(false);
    }
  };

  // Start Autonomous Execution (Step 6)
  const handleExecuteAllTasks = async () => {
    if (!activeRun || tasks.length === 0 || !user || isRunning) return;

    setIsRunning(true);
    let completedCount = 0;
    const executionContext: Record<string, any> = {};

    for (let i = 0; i < tasks.length; i++) {
      const currentTask = tasks[i];
      
      // Skip if already completed
      if (currentTask.status === 'success') {
        completedCount++;
        if (currentTask.result?.output) {
          executionContext[currentTask.id] = currentTask.result.output;
        }
        continue;
      }

      setActiveTaskId(currentTask.id);

      try {
        const updatedTask = await agentService.executeTask({
          runId: activeRun.id,
          task: currentTask,
          goal: activeRun.goal,
          context: executionContext,
          userId: user.id,
          projectId: activeRun.projectId
        });

        completedCount++;
        if (updatedTask.result?.output) {
          executionContext[updatedTask.id] = updatedTask.result.output;
        }
      } catch (err: any) {
        console.error(`Task ${currentTask.name} failed:`, err);
        break; // stop on failure
      }
    }

    // Finalize Run Stats in Firestore
    await agentService.finalizeRun({
      runId: activeRun.id,
      projectId: activeRun.projectId,
      completedCount,
      totalTasks: tasks.length,
      tasks
    });

    setActiveTaskId(null);
    setIsRunning(false);
  };

  // Delete Run
  const handleDeleteRun = async (runId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this agent execution run?')) {
      await agentService.deleteAgentRun(runId);
      if (activeRunId === runId) {
        const remaining = agentRuns.filter(r => r.id !== runId);
        setActiveRunId(remaining[0]?.id || null);
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculations for Active Run
  const completedTasksCount = tasks.filter(t => t.status === 'success').length;
  const progressPct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const totalRunCostVal = tasks.reduce((acc, curr) => {
    const num = parseFloat((curr.cost || '$0').replace('$', '')) || 0;
    return acc + num;
  }, 0);

  const totalRunLatencyMs = tasks.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0);

  const modelsUsedList = Array.from(new Set(tasks.map(t => t.selectedModel).filter(Boolean)));

  // Filtered Assets
  const filteredAssets = generatedAssets.filter(asset => {
    if (selectedOutputFilter === 'all') return true;
    if (selectedOutputFilter === 'image') return asset.type === 'image' || asset.url?.includes('data:image');
    if (selectedOutputFilter === 'video') return asset.type === 'video' || asset.url?.includes('data:video');
    if (selectedOutputFilter === 'audio') return asset.type === 'audio' || asset.url?.includes('data:audio');
    if (selectedOutputFilter === 'text') return asset.type === 'document' || !asset.url;
    return true;
  });

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <Bot className="w-8 h-8 text-indigo-400" />
            AI Agent Mode
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Autonomous Genblaze orchestration system. Generates plans, routes tasks to Model Hub, executes multi-modal inference, and persists real assets to Firestore.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector */}
          <div className="flex items-center gap-2 bg-[#09090B] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Folder className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="" className="bg-[#111827] text-white">Auto-Create Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#111827] text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Nav Links */}
          <div className="flex items-center gap-1 bg-[#09090B] border border-white/10 rounded-xl p-1 text-xs">
            <Link to="/projects" className="px-2.5 py-1 text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <Folder className="w-3 h-3 text-indigo-400" /> Projects
            </Link>
            <Link to="/workflows" className="px-2.5 py-1 text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" /> Workflows
            </Link>
            <Link to="/models" className="px-2.5 py-1 text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Model Hub
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

        {/* LEFT PANEL: Goal Input & Active Executions Stream (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          {/* Goal Input Card */}
          <div className="bg-[#111827]/40 border border-white/10 rounded-[24px] p-5 shadow-xl backdrop-blur-md">
            <form onSubmit={handlePlanGoal} className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Define Autonomous Goal
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Gemini 2.5 Orchestrator</span>
              </label>

              <textarea 
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. Create a complete marketing campaign for a gaming laptop..."
                className="w-full h-28 bg-black/50 border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 resize-none transition-colors shadow-inner"
                disabled={isPlanning || isRunning}
              />

              {/* Quick Preset Goal Chips */}
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="text-slate-500 py-0.5">Try:</span>
                {[
                  "Marketing campaign for a gaming laptop",
                  "Launch strategy for B2B SaaS platform",
                  "Cyberpunk brand with logo & teaser video"
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGoal(preset)}
                    className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-slate-300 transition-colors truncate max-w-[200px]"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <button 
                type="submit" 
                disabled={!goal.trim() || isPlanning || isRunning}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
              >
                {isPlanning ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Planning Real Strategy...</>
                ) : (
                  <><BrainCircuit className="w-4 h-4" /> Generate Execution Plan</>
                )}
              </button>
            </form>
          </div>

          {/* Firestore Agent Runs History Selector */}
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-5 shadow-xl backdrop-blur-md flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                Agent Executions ({agentRuns.length})
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Firestore Backed</span>
            </h3>

            {agentRuns.length === 0 ? (
              /* EMPTY STATE WHEN NO RUNS EXIST */
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
                <p className="text-slate-400 font-medium">No agent executions yet</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Describe your goal above to generate your first autonomous execution plan.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {agentRuns.map(run => {
                  const isActive = activeRunId === run.id;
                  return (
                    <div
                      key={run.id}
                      onClick={() => setActiveRunId(run.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 group",
                        isActive ? "bg-indigo-500/10 border-indigo-500/50 shadow-md" : "bg-black/30 border-white/5 hover:border-white/20 hover:bg-white/5"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-semibold",
                            run.status === 'Completed' ? "bg-emerald-500/20 text-emerald-400" :
                            run.status === 'Running' ? "bg-indigo-500/20 text-indigo-400 animate-pulse" :
                            run.status === 'Planning' ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                          )}>
                            {run.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white truncate">{run.goal}</p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-1 font-mono">
                          <span>{run.completedTasks}/{run.totalTasks} tasks</span>
                          <span>•</span>
                          <span className="text-emerald-400">{run.totalCost || '$0.000'}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteRun(run.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                        title="Delete Run"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live System Activity Stream */}
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-5 shadow-xl backdrop-blur-md flex-1 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Live Activity Stream
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-64 space-y-2">
              {activityLogs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-600">
                  No live activity recorded for this project yet.
                </div>
              ) : (
                activityLogs.map(log => (
                  <div key={log.id} className="bg-black/30 border border-white/5 rounded-xl p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[10px] font-semibold text-indigo-300 font-mono">{log.action}</span>
                      <span className="text-[9px] text-slate-500">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">{log.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Agent Dashboard, Tasks Timeline & Outputs (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

          {!activeRun ? (
            /* REAL EMPTY STATE WHEN NO ACTIVE RUN */
            <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                <Bot className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No agent executions yet</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                Enter your high-level project goal on the left to generate a real autonomous execution plan with tasks, model routing, workflows, and deliverables.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl text-left">
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                  <BrainCircuit className="w-5 h-5 text-indigo-400 mb-2" />
                  <div className="text-xs font-semibold text-white">Smart Task Planning</div>
                  <div className="text-[10px] text-slate-500 mt-1">Gemini decomposes goals into required steps.</div>
                </div>
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                  <Zap className="w-5 h-5 text-amber-400 mb-2" />
                  <div className="text-xs font-semibold text-white">Model Router</div>
                  <div className="text-[10px] text-slate-500 mt-1">Selects optimal image, video, text, & audio models.</div>
                </div>
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                  <Layers className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="text-xs font-semibold text-white">Firestore Persistence</div>
                  <div className="text-[10px] text-slate-500 mt-1">Stores execution history, assets, & activity.</div>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE RUN DASHBOARD */
            <div className="space-y-6">

              {/* 1. Dashboard Metrics Banner */}
              <div className="bg-[#111827]/60 border border-white/10 rounded-[24px] p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-wrap items-start justify-between gap-4 mb-4 pb-4 border-b border-white/10">
                  <div>
                    <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" /> Current Agent Goal
                    </div>
                    <h2 className="text-lg font-bold text-white">{activeRun.goal}</h2>
                    {activeRun.plan?.summary && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl bg-black/30 p-2.5 rounded-xl border border-white/5">
                        {activeRun.plan.summary}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5",
                      activeRun.status === 'Completed' ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" :
                      activeRun.status === 'Running' ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400 animate-pulse" :
                      activeRun.status === 'Planning' ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-red-500/20 border-red-500/40 text-red-400"
                    )}>
                      {activeRun.status === 'Running' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {activeRun.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      Status: {activeRun.status}
                    </span>

                    {/* Execute Button */}
                    <button
                      onClick={handleExecuteAllTasks}
                      disabled={isRunning || tasks.length === 0 || completedTasksCount === tasks.length}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      {isRunning ? 'Executing Agent Tasks...' : completedTasksCount === tasks.length ? 'Execution Completed' : 'Start Autonomous Execution'}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                    <span className="font-medium">Execution Progress ({completedTasksCount}/{tasks.length} tasks completed)</span>
                    <span className="font-mono font-bold text-emerald-400">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400">Total Compute Cost</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">${totalRunCostVal.toFixed(4)}</div>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400">Execution Time</div>
                    <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">{(totalRunLatencyMs / 1000).toFixed(1)}s</div>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400">Generated Assets</div>
                    <div className="text-sm font-bold text-indigo-300 font-mono mt-0.5">{generatedAssets.length} deliverables</div>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400">Models Invoked</div>
                    <div className="text-xs font-semibold text-white truncate mt-0.5 font-mono">
                      {modelsUsedList.length > 0 ? modelsUsedList.join(', ') : 'Model Router'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Tasks Timeline & Plan Execution List */}
              <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ListTree className="w-4 h-4 text-indigo-400" />
                    Execution Tasks ({tasks.length})
                  </h3>

                  {activeRun.workflowId && (
                    <Link
                      to="/workflows"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      View Linked Workflow <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {tasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No tasks generated for this agent run.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task, idx) => (
                      <div 
                        key={task.id}
                        className={cn(
                          "bg-black/40 border rounded-2xl p-4 transition-all relative overflow-hidden",
                          task.id === activeTaskId ? "border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10" :
                          task.status === 'success' ? "border-emerald-500/30" :
                          task.status === 'failed' ? "border-red-500/30" : "border-white/10"
                        )}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border mt-0.5",
                              task.status === 'pending' ? "bg-black border-white/20 text-slate-500" :
                              task.status === 'running' ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 animate-pulse" :
                              task.status === 'success' ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-red-500/20 border-red-500 text-red-400"
                            )}>
                              {task.status === 'pending' && <CircleDashed className="w-3.5 h-3.5" />}
                              {task.status === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              {task.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {task.status === 'failed' && <AlertCircle className="w-3.5 h-3.5" />}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                  {task.type}
                                </span>
                                <span className="text-sm font-semibold text-white">{task.name}</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs shrink-0 self-end md:self-auto font-mono">
                            {task.selectedModel && (
                              <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-slate-300 text-[11px]">
                                {task.selectedModel}
                              </span>
                            )}

                            {task.latencyMs && (
                              <span className="text-amber-400 text-[11px] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {(task.latencyMs / 1000).toFixed(1)}s
                              </span>
                            )}

                            {task.cost && (
                              <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> {task.cost}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Task Result Inline Output */}
                        {task.result?.output && (
                          <div className="mt-3 pt-3 border-t border-white/10 text-xs">
                            <div className="text-[10px] font-semibold text-slate-400 mb-1">Generated Result:</div>
                            {task.result.outputType === 'image' && task.result.mediaUrl ? (
                              <img src={task.result.mediaUrl} alt={task.name} className="max-h-48 rounded-xl border border-white/10 object-cover" />
                            ) : task.result.outputType === 'video' && task.result.mediaUrl ? (
                              <video src={task.result.mediaUrl} controls autoPlay loop className="max-h-48 rounded-xl border border-white/10 object-cover" />
                            ) : task.result.outputType === 'audio' && task.result.mediaUrl ? (
                              <audio src={task.result.mediaUrl} controls className="w-full my-2" />
                            ) : (
                              <div className="bg-black/50 border border-white/5 rounded-xl p-3 text-slate-300 font-mono text-[11px] max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                                {task.result.output}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Real Generated Assets Deliverables Gallery */}
              <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-6 shadow-xl backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-400" />
                      Generated Deliverables & Assets ({generatedAssets.length})
                    </h3>
                    <p className="text-xs text-slate-400">Stored in Firestore `generatedAssets` collection.</p>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex bg-black/50 border border-white/10 rounded-xl p-1 text-xs">
                    {(['all', 'image', 'video', 'audio', 'text'] as const).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setSelectedOutputFilter(filter)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg capitalize transition-colors font-medium",
                          selectedOutputFilter === filter ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredAssets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-2xl">
                    No deliverables generated for this filter yet. Run agent tasks to generate images, videos, reports, and copy.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAssets.map(asset => (
                      <div key={asset.id} className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase font-semibold">
                              {asset.type || 'Deliverable'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {asset.createdAt ? new Date(asset.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white mb-2">{asset.title}</h4>

                          {/* Asset Media Preview */}
                          {(asset.type === 'image' || asset.url?.includes('data:image')) && asset.url && (
                            <img src={asset.url} alt={asset.title} className="w-full max-h-48 rounded-xl border border-white/10 object-cover mb-2" />
                          )}

                          {(asset.type === 'video' || asset.url?.includes('data:video')) && asset.url && (
                            <video src={asset.url} controls autoPlay loop className="w-full max-h-48 rounded-xl border border-white/10 object-cover mb-2" />
                          )}

                          {(asset.type === 'audio' || asset.url?.includes('data:audio')) && asset.url && (
                            <audio src={asset.url} controls className="w-full my-2" />
                          )}

                          {asset.content && (
                            <div className="bg-black/50 border border-white/5 rounded-xl p-3 text-xs text-slate-300 leading-relaxed font-mono max-h-36 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                              {asset.content}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-500">Source: AI Agent Mode</span>
                          <button
                            onClick={() => copyToClipboard(asset.content || asset.url || '', asset.id)}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                          >
                            {copiedId === asset.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedId === asset.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Connected Platform Modules Hub */}
              <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-6 shadow-xl backdrop-blur-md">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Linked Platform Modules
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link
                    to={activeRun.projectId ? `/projects/${activeRun.projectId}` : '/projects'}
                    className="p-3 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl flex flex-col items-center text-center transition-all group"
                  >
                    <Folder className="w-5 h-5 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-semibold text-white">Project Hub</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Tasks & Files</div>
                  </Link>

                  <Link
                    to="/builder"
                    className="p-3 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl flex flex-col items-center text-center transition-all group"
                  >
                    <BarChart3 className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-semibold text-white">Business Builder</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Strategic Plans</div>
                  </Link>

                  <Link
                    to="/workflows"
                    className="p-3 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl flex flex-col items-center text-center transition-all group"
                  >
                    <Layers className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-semibold text-white">Workflow Engine</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Pipelines</div>
                  </Link>

                  <Link
                    to="/models"
                    className="p-3 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl flex flex-col items-center text-center transition-all group"
                  >
                    <Zap className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-semibold text-white">Model Hub</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Smart Router</div>
                  </Link>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
