import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Zap, BrainCircuit, Activity, 
  BarChart3, Loader2, Sparkles, Image as ImageIcon, 
  Video, FileText, CheckCircle2, Play, Folder, 
  Clock, DollarSign, AlertCircle, History, ExternalLink, Volume2, Copy, Check
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';
import { modelHubService, ConfiguredModel, TaskRouteResult, ModelExecutionDoc } from '../../services/modelHubService';
import { projectManagementService, ProjectDoc } from '../../services/projectManagementService';

export const ModelHub = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'router' | 'compare' | 'analytics' | 'history'>('router');
  
  // Projects Context
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Configured Models
  const [configuredModels, setConfiguredModels] = useState<ConfiguredModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Router State
  const [routePrompt, setRoutePrompt] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [routeResult, setRouteResult] = useState<TaskRouteResult | null>(null);
  const [lastExecution, setLastExecution] = useState<ModelExecutionDoc | null>(null);

  // Compare State
  const [comparePrompt, setComparePrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResults, setCompareResults] = useState<any[]>([]);

  // Real Analytics State
  const [executions, setExecutions] = useState<ModelExecutionDoc[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Subscribe to Projects & Configured Models
  useEffect(() => {
    let unsubProjects = projectManagementService.subscribeProjects((projList) => {
      setProjects(projList);
      if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projList[0].id);
      }
    });

    modelHubService.getConfiguredModels().then(models => {
      const active = models.filter(m => m.configured);
      setConfiguredModels(active);
      setIsLoadingModels(false);
      // Preselect up to 2 models for comparison
      if (active.length > 0) {
        setSelectedModels(active.slice(0, 2).map(m => m.id));
      }
    }).catch(err => {
      console.warn('Failed loading configured models:', err);
      setIsLoadingModels(false);
    });

    return () => {
      if (unsubProjects) unsubProjects();
    };
  }, []);

  // Subscribe to Real Firestore Executions
  useEffect(() => {
    const unsubExec = modelHubService.subscribeExecutions(user?.id, (data) => {
      setExecutions(data);
    });
    return () => {
      if (unsubExec) unsubExec();
    };
  }, [user]);

  // Handle Smart Routing Only
  const handleRouteOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routePrompt.trim()) return;
    
    setIsRouting(true);
    setRouteResult(null);

    try {
      const result = await modelHubService.routeTask(routePrompt);
      setRouteResult(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRouting(false);
    }
  };

  // Handle Smart Route & Immediate Execution
  const handleRouteAndExecute = async () => {
    if (!routePrompt.trim() || !user) return;

    setIsExecuting(true);
    setLastExecution(null);

    try {
      let route = routeResult;
      if (!route) {
        setIsRouting(true);
        route = await modelHubService.routeTask(routePrompt);
        setRouteResult(route);
        setIsRouting(false);
      }

      const execDoc = await modelHubService.executeModelTask({
        prompt: routePrompt,
        model: route.selectedModel,
        taskType: route.taskType,
        reason: route.reason,
        projectId: selectedProjectId,
        userId: user.id
      });

      setLastExecution(execDoc);
    } catch (err: any) {
      console.error('Execution error:', err);
    } finally {
      setIsRouting(false);
      setIsExecuting(false);
    }
  };

  // Handle Multi-Model Comparison
  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comparePrompt.trim() || selectedModels.length === 0 || !user) return;

    setIsComparing(true);
    setCompareResults([]);

    try {
      const compDoc = await modelHubService.compareModels({
        prompt: comparePrompt,
        models: selectedModels,
        projectId: selectedProjectId,
        userId: user.id
      });
      setCompareResults(compDoc.results || []);
    } catch (err) {
      console.error('Comparison failed:', err);
    } finally {
      setIsComparing(false);
    }
  };

  const toggleCompareModel = (id: string) => {
    if (selectedModels.includes(id)) {
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter(m => m !== id));
      }
    } else {
      if (selectedModels.length < 3) {
        setSelectedModels([...selectedModels, id]);
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Analytics Math derived from real Firestore executions
  const totalExecs = executions.length;
  const successfulExecs = executions.filter(e => e.status === 'Completed').length;
  const successRate = totalExecs > 0 ? Math.round((successfulExecs / totalExecs) * 100) : 0;
  
  const avgLatencyMs = totalExecs > 0 
    ? Math.round(executions.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0) / totalExecs) 
    : 0;

  const totalCostVal = executions.reduce((acc, curr) => {
    const numericCost = parseFloat((curr.cost || '$0').replace('$', '')) || 0;
    return acc + numericCost;
  }, 0);

  const assetsGeneratedCount = executions.filter(e => e.outputType === 'image' || e.outputType === 'video' || e.outputType === 'audio').length;

  // Calculate model distribution
  const modelDistributionMap: Record<string, number> = {};
  executions.forEach(e => {
    modelDistributionMap[e.selectedModel] = (modelDistributionMap[e.selectedModel] || 0) + 1;
  });

  return (
    <div className="flex flex-col h-full w-full">
      {/* Page Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <Network className="w-8 h-8 text-indigo-400" />
            AI Model Hub & Router
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Real production model orchestration engine. Connects directly to real model execution backends, projects, asset libraries, and execution logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector */}
          <div className="flex items-center gap-2 bg-[#09090B] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Folder className="w-3.5 h-3.5 text-indigo-400" />
            <span>Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#111827] text-white">General Workspace</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#111827] text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-[#09090B] border border-white/10 rounded-xl p-1">
            {[
              { id: 'router', label: 'Smart Router', icon: BrainCircuit },
              { id: 'compare', label: 'Model Compare', icon: Activity },
              { id: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
              { id: 'history', label: 'Execution History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeTab === tab.id ? "bg-white/10 text-white shadow" : "text-slate-400 hover:text-white"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 bg-[#111827]/40 border border-white/5 rounded-[24px] shadow-xl overflow-hidden backdrop-blur-md relative flex flex-col">
        
        {/* SMART ROUTER TAB */}
        {activeTab === 'router' && (
          <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar relative">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-3xl z-10">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/20 border border-white/10">
                  <BrainCircuit className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Smart Model Router</h2>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Describe any task. Our router analyzes content type, complexity, and cost requirements, then executes the task on the optimal model.
                </p>
              </div>

              {/* Input Form */}
              <form onSubmit={handleRouteOnly} className="relative mb-6">
                <textarea 
                  value={routePrompt}
                  onChange={e => setRoutePrompt(e.target.value)}
                  placeholder="e.g. Generate a cinematic video of a futuristic cyberpunk city skyline at sunset..."
                  className="w-full h-32 bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none shadow-inner"
                  disabled={isRouting || isExecuting}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-slate-500 self-center">Try:</span>
                    <button
                      type="button"
                      onClick={() => setRoutePrompt("Generate a cinematic video of a serene waterfall surrounded by autumn trees")}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors"
                    >
                      Cinematic Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoutePrompt("Design a high-tech vector logo concept for an AI startup named GenBlaze")}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors"
                    >
                      Flux Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoutePrompt("Draft a comprehensive Q3 strategic go-to-market plan for B2B SaaS expansion")}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors"
                    >
                      Gemini Text
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      type="submit"
                      disabled={!routePrompt.trim() || isRouting || isExecuting}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border border-white/10"
                    >
                      {isRouting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                      Analyze Route
                    </button>

                    <button 
                      type="button"
                      onClick={handleRouteAndExecute}
                      disabled={!routePrompt.trim() || isRouting || isExecuting}
                      className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Auto-Route & Execute
                    </button>
                  </div>
                </div>
              </form>

              {/* Route Decision Banner */}
              <AnimatePresence>
                {routeResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Optimal Model Decision
                        </div>
                        <div className="text-lg font-bold text-white">
                          {configuredModels.find(m => m.id === routeResult.selectedModel)?.name || routeResult.selectedModel}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                          Type: {routeResult.taskType}
                        </span>
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300">
                          Complexity: {routeResult.complexity || 'Medium'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed mb-3">
                      {routeResult.reason}
                    </p>

                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                        <Zap className="w-3 h-3 text-amber-400" /> Latency: {routeResult.estimatedLatency}
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                        <DollarSign className="w-3 h-3 text-emerald-400" /> Cost: {routeResult.estimatedCost}
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                        <Sparkles className="w-3 h-3 text-indigo-400" /> Content: {routeResult.contentType}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Execution Loading Indicator */}
              {isExecuting && (
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                  <div className="text-sm font-semibold text-white mb-1">Executing Model Inference...</div>
                  <div className="text-xs text-indigo-300">
                    Running task on model {routeResult?.selectedModel || 'selected engine'}
                  </div>
                </div>
              )}

              {/* Execution Result Display */}
              {lastExecution && !isExecuting && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black/60 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl"
                >
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h3 className="text-sm font-bold text-white">Execution Result</h3>
                      <span className="text-xs text-slate-400 font-mono">({lastExecution.selectedModel})</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="bg-white/5 px-2 py-1 rounded border border-white/10 text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {(lastExecution.latencyMs! / 1000).toFixed(1)}s
                      </span>
                      <span className="bg-white/5 px-2 py-1 rounded border border-white/10 text-emerald-300 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> {lastExecution.cost}
                      </span>
                    </div>
                  </div>

                  {/* Render Image Output */}
                  {lastExecution.outputType === 'image' && lastExecution.mediaUrl && (
                    <div className="flex flex-col items-center gap-4">
                      <img 
                        src={lastExecution.mediaUrl} 
                        alt="Generated Output" 
                        className="max-h-96 w-auto rounded-xl border border-white/10 shadow-lg object-contain" 
                      />
                      <p className="text-xs text-slate-400 italic text-center">{lastExecution.output}</p>
                    </div>
                  )}

                  {/* Render Video Output */}
                  {lastExecution.outputType === 'video' && lastExecution.mediaUrl && (
                    <div className="flex flex-col items-center gap-4">
                      <video 
                        src={lastExecution.mediaUrl} 
                        controls 
                        autoPlay 
                        loop 
                        className="max-h-96 w-full rounded-xl border border-white/10 shadow-lg object-cover" 
                      />
                      <p className="text-xs text-slate-400 italic text-center">{lastExecution.output}</p>
                    </div>
                  )}

                  {/* Render Audio Output */}
                  {lastExecution.outputType === 'audio' && lastExecution.mediaUrl && (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <Volume2 className="w-12 h-12 text-indigo-400 animate-bounce" />
                      <audio src={lastExecution.mediaUrl} controls autoPlay className="w-full max-w-md" />
                      <p className="text-xs text-slate-400 italic">{lastExecution.output}</p>
                    </div>
                  )}

                  {/* Render Text Output */}
                  {lastExecution.outputType === 'text' && (
                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
                      {lastExecution.output}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Persisted to Firestore & Asset Library</span>
                    <button 
                      onClick={() => copyToClipboard(lastExecution.output || '', lastExecution.id)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === lastExecution.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === lastExecution.id ? 'Copied' : 'Copy Output'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* MODEL COMPARE TAB */}
        {activeTab === 'compare' && (
          <div className="flex-1 flex flex-col p-6 h-full overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
              
              {/* Compare Settings Sidebar */}
              <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider text-slate-400">
                    Configured Models (Select 2-3)
                  </h3>
                  
                  {isLoadingModels ? (
                    <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Loading models...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {configuredModels.map(model => {
                        const isSelected = selectedModels.includes(model.id);
                        const isDisabled = !isSelected && selectedModels.length >= 3;
                        return (
                          <button
                            key={model.id}
                            onClick={() => toggleCompareModel(model.id)}
                            disabled={isDisabled}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                              isSelected ? "bg-indigo-500/10 border-indigo-500/50 shadow-md" : 
                              isDisabled ? "bg-black/40 border-white/5 opacity-40 cursor-not-allowed" : "bg-black/30 border-white/10 hover:border-white/30 hover:bg-white/5"
                            )}
                          >
                            <div>
                              <div className={cn("text-xs font-semibold", isSelected ? "text-white" : "text-slate-300")}>
                                {model.name}
                              </div>
                              <div className="text-[10px] text-slate-500">{model.provider} • {model.type}</div>
                            </div>
                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center text-[10px]", isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-600")}>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex-1 flex flex-col">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Comparison Prompt
                  </h3>
                  <textarea 
                    value={comparePrompt}
                    onChange={e => setComparePrompt(e.target.value)}
                    placeholder="Enter a prompt to run simultaneously across selected models..."
                    className="w-full flex-1 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 resize-none mb-4 min-h-[100px]"
                  />
                  <button 
                    onClick={handleCompare}
                    disabled={!comparePrompt.trim() || selectedModels.length === 0 || isComparing}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    {isComparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Run Real Inference
                  </button>
                </div>
              </div>

              {/* Compare Outputs Display Area */}
              <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col relative min-h-[400px]">
                {isComparing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#09090B]/80 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                    <div className="text-white font-semibold text-sm">Executing Multi-Model Parallel Inference...</div>
                    <div className="text-xs text-slate-400">Running real execution across {selectedModels.length} models simultaneously.</div>
                  </div>
                ) : compareResults.length > 0 ? (
                  <div className="flex-1 p-6 flex gap-4 overflow-x-auto custom-scrollbar">
                    {compareResults.map((result, idx) => {
                      const modelInfo = configuredModels.find(m => m.id === result.model);
                      return (
                        <div key={idx} className="flex-1 min-w-[320px] bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-3 pb-3 border-b border-white/10">
                              <div>
                                <div className="text-sm font-bold text-white mb-0.5">{modelInfo?.name || result.model}</div>
                                <div className="text-[10px] text-slate-400">{modelInfo?.provider || 'AI Engine'}</div>
                              </div>
                              <div className="text-right flex flex-col gap-1">
                                <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded border border-white/5 text-amber-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {(result.latencyMs / 1000).toFixed(1)}s
                                </span>
                                <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded border border-white/5 text-emerald-400 flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" /> {result.cost}
                                </span>
                              </div>
                            </div>

                            {/* Output Preview */}
                            <div className="mt-2 text-xs text-slate-300">
                              {result.outputType === 'image' && result.mediaUrl ? (
                                <img src={result.mediaUrl} alt="Output" className="w-full max-h-60 rounded-xl border border-white/10 object-cover" />
                              ) : result.outputType === 'video' && result.mediaUrl ? (
                                <video src={result.mediaUrl} controls autoPlay loop className="w-full max-h-60 rounded-xl border border-white/10 object-cover" />
                              ) : result.outputType === 'audio' && result.mediaUrl ? (
                                <audio src={result.mediaUrl} controls className="w-full my-4" />
                              ) : (
                                <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-xs leading-relaxed max-h-72 overflow-y-auto custom-scrollbar font-mono whitespace-pre-wrap">
                                  {result.output}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                            <span className="text-[10px] text-slate-500">Status: {result.success ? 'Success' : 'Failed'}</span>
                            <button 
                              onClick={() => copyToClipboard(result.output || '', `comp_${idx}`)}
                              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              Copy Result
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                    <Activity className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm text-slate-400 font-medium">No model comparisons run yet.</p>
                    <p className="text-xs text-slate-600 max-w-sm mt-1">Select configured models on the left and enter a prompt to compare real outputs side by side.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* USAGE ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
            {totalExecs === 0 ? (
              /* REAL EMPTY STATE WHEN NO EXECUTIONS EXIST */
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No model executions found</h3>
                <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                  You haven't executed any prompts through the Smart Router or Model Compare yet. Run tasks to populate real execution history, latency metrics, and compute cost tracking.
                </p>
                <button
                  onClick={() => setActiveTab('router')}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg"
                >
                  <BrainCircuit className="w-4 h-4" />
                  Route Your First Task
                </button>
              </div>
            ) : (
              /* REAL COMPUTED ANALYTICS FROM FIRESTORE */
              <div className="space-y-8">
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="text-xs text-slate-400 mb-1">Total Executions</div>
                    <div className="text-2xl font-bold text-white font-mono">{totalExecs}</div>
                    <div className="text-[10px] text-emerald-400 mt-1">Real Firestore Log</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="text-xs text-slate-400 mb-1">Success Rate</div>
                    <div className="text-2xl font-bold text-white font-mono">{successRate}%</div>
                    <div className="text-[10px] text-emerald-400 mt-1">{successfulExecs} successful runs</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="text-xs text-slate-400 mb-1">Average Latency</div>
                    <div className="text-2xl font-bold text-white font-mono">{(avgLatencyMs / 1000).toFixed(2)}s</div>
                    <div className="text-[10px] text-indigo-400 mt-1">Real time elapsed</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="text-xs text-slate-400 mb-1">Total Compute Cost</div>
                    <div className="text-2xl font-bold text-white font-mono">${totalCostVal.toFixed(4)}</div>
                    <div className="text-[10px] text-amber-400 mt-1">{assetsGeneratedCount} assets generated</div>
                  </div>
                </div>

                {/* Model Usage Distribution */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    Real Model Usage Distribution
                  </h3>

                  <div className="space-y-3">
                    {Object.entries(modelDistributionMap).map(([mId, count], i) => {
                      const pct = Math.round((count / totalExecs) * 100);
                      return (
                        <div key={mId} className="flex items-center gap-4 text-xs">
                          <div className="w-36 font-mono text-slate-300 truncate">{mId}</div>
                          <div className="flex-1 h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                          <div className="w-16 text-right font-mono text-slate-400">{count} ({pct}%)</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXECUTION HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
            {executions.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
                <History className="w-12 h-12 text-slate-600 mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">No execution history</h3>
                <p className="text-xs text-slate-500">Run a task in the Smart Router to view detailed logs.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white mb-3">Firestore Execution Records ({executions.length})</h3>
                <div className="space-y-3">
                  {executions.map(exec => (
                    <div key={exec.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-indigo-300 font-mono">{exec.selectedModel}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 uppercase">
                            {exec.taskType}
                          </span>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded font-semibold", exec.status === 'Completed' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                            {exec.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 truncate font-mono">{exec.prompt}</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-slate-400 shrink-0">
                        <div>Latency: {((exec.latencyMs || 0) / 1000).toFixed(1)}s</div>
                        <div>Cost: {exec.cost || '$0.001'}</div>
                        <button
                          onClick={() => copyToClipboard(exec.output || '', exec.id)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
