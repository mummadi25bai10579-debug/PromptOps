import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Lightbulb, 
  LineChart, 
  Palette, 
  TrendingUp,
  Target,
  Users,
  Briefcase,
  Wand2,
  Rocket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Plus,
  ArrowRight,
  FileText,
  Activity,
  Layers,
  Cpu,
  Sparkles,
  ExternalLink,
  Download,
  BarChart3,
  RefreshCw,
  Copy,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { 
  businessBuilderService, 
  BusinessDoc, 
  BusinessPlanDoc, 
  BusinessProjectDoc, 
  BusinessWorkflowDoc, 
  BusinessAgentTaskDoc, 
  GeneratedAssetDoc, 
  ActivityLogDoc, 
  BusinessAnalyticsDoc 
} from '../../services/businessBuilderService';

type Tab = 'wizard' | 'dashboard' | 'research' | 'brand' | 'growth' | 'activity' | 'analytics';

export function BusinessBuilder() {
  const [activeTab, setActiveTab] = useState<Tab>('wizard');
  const [idea, setIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Firestore state subscriptions
  const [businesses, setBusinesses] = useState<BusinessDoc[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessPlan, setBusinessPlan] = useState<BusinessPlanDoc | null>(null);
  const [projects, setProjects] = useState<BusinessProjectDoc[]>([]);
  const [workflows, setWorkflows] = useState<BusinessWorkflowDoc[]>([]);
  const [agentTasks, setAgentTasks] = useState<BusinessAgentTaskDoc[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssetDoc[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogDoc[]>([]);
  const [analytics, setAnalytics] = useState<BusinessAnalyticsDoc | null>(null);

  // Modal for inspecting asset detail
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAssetDoc | null>(null);
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);

  // 1. Subscribe to Businesses List
  useEffect(() => {
    const unsub = businessBuilderService.subscribeBusinesses((list) => {
      setBusinesses(list);
      if (list.length > 0 && !selectedBusinessId) {
        setSelectedBusinessId(list[0].id);
      }
    });
    return () => unsub();
  }, [selectedBusinessId]);

  // 2. Subscribe to resources for currently selected Business
  useEffect(() => {
    if (!selectedBusinessId) {
      setBusinessPlan(null);
      setProjects([]);
      setWorkflows([]);
      setAgentTasks([]);
      setGeneratedAssets([]);
      setActivityLogs([]);
      setAnalytics(null);
      return;
    }

    const unsubPlan = businessBuilderService.subscribeBusinessPlan(selectedBusinessId, setBusinessPlan);
    const unsubProjects = businessBuilderService.subscribeProjects(selectedBusinessId, setProjects);
    const unsubWorkflows = businessBuilderService.subscribeWorkflows(selectedBusinessId, setWorkflows);
    const unsubTasks = businessBuilderService.subscribeAgentTasks(selectedBusinessId, setAgentTasks);
    const unsubAssets = businessBuilderService.subscribeGeneratedAssets(selectedBusinessId, setGeneratedAssets);
    const unsubLogs = businessBuilderService.subscribeActivityLogs(selectedBusinessId, setActivityLogs);
    const unsubAnalytics = businessBuilderService.subscribeAnalytics(selectedBusinessId, setAnalytics);

    return () => {
      unsubPlan();
      unsubProjects();
      unsubWorkflows();
      unsubTasks();
      unsubAssets();
      unsubLogs();
      unsubAnalytics();
    };
  }, [selectedBusinessId]);

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId) || null;

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const newBusinessId = await businessBuilderService.createAndBuildBusiness(idea);
      setSelectedBusinessId(newBusinessId);
      setIdea('');
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error('Generation failed:', err);
      setGenerationError(err?.message || 'Failed to build business. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteBusiness = async (bId: string) => {
    if (window.confirm('Are you sure you want to delete this business and all its generated assets?')) {
      await businessBuilderService.deleteBusiness(bId);
      if (selectedBusinessId === bId) {
        const remaining = businesses.filter(b => b.id !== bId);
        setSelectedBusinessId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const handleCopyContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAssetId(id);
    setTimeout(() => setCopiedAssetId(null), 2000);
  };

  const tabs = [
    { id: 'wizard', name: 'Build Wizard', icon: Wand2 },
    { id: 'dashboard', name: 'Strategy & Progress', icon: Target },
    { id: 'research', name: 'Research Center', icon: LineChart },
    { id: 'brand', name: 'Brand Studio', icon: Palette },
    { id: 'growth', name: 'Growth & Assets', icon: TrendingUp },
    { id: 'activity', name: 'Activity Log', icon: Activity },
    { id: 'analytics', name: 'Live Analytics', icon: BarChart3 },
  ] as const;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 p-2 md:p-4">
      {/* Top Header & Business Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Autonomous Business Builder</h1>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              Firestore & Gemini AI
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Real AI agent orchestration for complete business plan, workflows, tasks, and asset generation.
          </p>
        </div>

        {businesses.length > 0 && (
          <div className="flex items-center gap-3">
            <select
              value={selectedBusinessId || ''}
              onChange={(e) => {
                setSelectedBusinessId(e.target.value);
                setActiveTab('dashboard');
              }}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.title} ({b.status})
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setActiveTab('wizard');
              }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600/20 px-3 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30"
            >
              <Plus className="h-4 w-4" />
              New Business
            </button>

            {selectedBusinessId && (
              <button
                onClick={() => handleDeleteBusiness(selectedBusinessId)}
                title="Delete Business"
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30" 
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
              {tab.id === 'growth' && generatedAssets.length > 0 && (
                <span className="ml-1 rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-300">
                  {generatedAssets.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto">
        {/* TAB: WIZARD */}
        {activeTab === 'wizard' && (
          <div className="mx-auto max-w-4xl space-y-8 pt-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Describe Your Business Idea</h2>
                  <p className="text-sm text-gray-400">
                    Our AI agent swarm will create a real business plan, project workspace, workflows, and brand assets saved directly into Firestore.
                  </p>
                </div>
              </div>

              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g., Build an AI-powered mock interview SaaS platform for software engineers that provides real-time feedback on technical code quality, system design, and communication skills."
                className="mb-6 min-h-[160px] w-full rounded-xl border border-white/10 bg-black/40 p-4 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              {generationError && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                  <span>{generationError}</span>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!idea.trim() || isGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-600/25"
              >
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Wand2 className="h-5 w-5" />
                    </motion.div>
                    <span>Orchestrating AI Agent Swarm & Firestore Storage...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    <span>Generate Production Business Plan</span>
                  </>
                )}
              </button>
            </div>

            {/* List of User's Existing Businesses in Firestore */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white flex items-center justify-between">
                <span>Created Businesses in Firestore</span>
                <span className="text-xs text-gray-400">{businesses.length} Total</span>
              </h3>

              {businesses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-8 text-center text-gray-400">
                  <Building2 className="mx-auto mb-3 h-8 w-8 text-gray-500" />
                  <p className="text-sm">No businesses created yet in Firestore.</p>
                  <p className="text-xs text-gray-500 mt-1">Enter an idea above to launch your first autonomous business build.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {businesses.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBusinessId(b.id);
                        setActiveTab('dashboard');
                      }}
                      className={cn(
                        "cursor-pointer rounded-xl border p-5 transition-all hover:border-indigo-500/50",
                        selectedBusinessId === b.id 
                          ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10" 
                          : "border-white/10 bg-black/20 hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white truncate">{b.title}</h4>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          b.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          b.status === 'generating' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-gray-500/10 text-gray-400"
                        )}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{b.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-white/5">
                        <span>Created: {new Date(b.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 text-indigo-400 font-medium">
                          Open Strategy <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMPTY STATE FOR NON-WIZARD TABS */}
        {activeTab !== 'wizard' && !selectedBusiness && (
          <div className="mx-auto max-w-xl py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Business Selected</h2>
            <p className="text-sm text-gray-400 mb-6">
              Create a new business or select an existing business from the Build Wizard to view plans, agent tasks, workflows, and generated assets.
            </p>
            <button
              onClick={() => setActiveTab('wizard')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Go to Build Wizard
            </button>
          </div>
        )}

        {/* TAB: DASHBOARD / STRATEGY */}
        {activeTab === 'dashboard' && selectedBusiness && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Business Header & Overview */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs text-indigo-400 font-semibold tracking-wide uppercase">Active Business Plan</span>
                    <h2 className="text-2xl font-bold text-white mt-1">{selectedBusiness.title}</h2>
                    <p className="text-sm text-gray-400 mt-1">{selectedBusiness.description}</p>
                  </div>
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                    {selectedBusiness.currentStage || 'Active'}
                  </span>
                </div>

                {businessPlan ? (
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-5">
                      <h3 className="mb-2 font-semibold text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-indigo-400" />
                        Executive Summary
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-300">{businessPlan.executiveSummary}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-black/40 p-5">
                        <h3 className="mb-2 font-semibold text-white flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-400" />
                          Target Market
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                          {businessPlan.targetAudience?.map((aud, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                              {aud}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/40 p-5">
                        <h3 className="mb-2 font-semibold text-white flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-indigo-400" />
                          Revenue Model
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                          {businessPlan.revenueModel?.map((rev, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              {rev}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-400" />
                    Loading business plan from Firestore...
                  </div>
                )}
              </div>

              {/* Workflows Progress Cards */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-400" />
                    Execution Workflows
                  </span>
                  <span className="text-xs text-gray-400">{workflows.length} Workflows</span>
                </h3>

                {workflows.length === 0 ? (
                  <p className="text-sm text-gray-400">No workflows available.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {workflows.map((wf) => (
                      <div key={wf.id} className="rounded-lg border border-white/10 bg-black/30 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white text-sm">{wf.name}</span>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            wf.status === 'Completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            wf.status === 'Running' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-gray-500/10 text-gray-400"
                          )}>
                            {wf.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Type: {wf.type}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Agent Status & Analytics Widget */}
            <div className="space-y-6">
              {/* Overall Progress Widget */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                  <span>Build Progress</span>
                  <span className="text-indigo-400 font-bold">{analytics?.projectProgress || 0}%</span>
                </h3>
                <div className="h-2.5 w-full rounded-full bg-black/40 overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500" 
                    style={{ width: `${analytics?.projectProgress || 0}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg border border-white/5 bg-black/30 p-3">
                    <span className="block text-xl font-bold text-white">{analytics?.completedTasks || 0}/{analytics?.totalTasks || 5}</span>
                    <span className="text-xs text-gray-400">Tasks Done</span>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-black/30 p-3">
                    <span className="block text-xl font-bold text-white">{analytics?.assetsGenerated || 0}</span>
                    <span className="text-xs text-gray-400">Assets Built</span>
                  </div>
                </div>
              </div>

              {/* Agent Status Panel */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-indigo-400" />
                  AI Agent Swarm
                </h3>
                <div className="space-y-3">
                  {agentTasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-white/5 bg-black/30 p-3.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">{task.agentName}</span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold flex items-center gap-1",
                          task.status === 'Completed' ? "bg-emerald-500/10 text-emerald-400" :
                          task.status === 'Running' ? "bg-amber-500/10 text-amber-400" :
                          "text-gray-400"
                        )}>
                          {task.status === 'Completed' && <CheckCircle2 className="h-3 w-3" />}
                          {task.status === 'Running' && <Clock className="h-3 w-3 animate-spin" />}
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{task.taskName}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: RESEARCH CENTER */}
        {activeTab === 'research' && selectedBusiness && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  Competitor Analysis Matrix
                </h2>
              </div>
              <div className="space-y-4">
                {businessPlan?.competitorAnalysis?.map((comp, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <h3 className="mb-3 font-semibold text-white text-base">{comp.name}</h3>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <span className="block text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">Key Strength</span>
                        <span className="text-gray-300">{comp.strength}</span>
                      </div>
                      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                        <span className="block text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Vulnerability</span>
                        <span className="text-gray-300">{comp.weakness}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-400" />
                  Market Position & Value Prop
                </h2>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-6">
                <h3 className="mb-3 font-semibold text-white">Core Value Proposition</h3>
                <p className="mb-6 text-sm text-gray-300 leading-relaxed">
                  {businessPlan?.valueProposition || 'Value proposition analysis completed.'}
                </p>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20">AI Automated</span>
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20">Validated Demand</span>
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20">Scalable SaaS</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: BRAND STUDIO */}
        {activeTab === 'brand' && selectedBusiness && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Brand Name Concepts */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Brand Identity Concepts</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {businessPlan?.brandConcepts?.names?.map((nc, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "rounded-xl border p-4 relative overflow-hidden transition-all",
                        nc.selected 
                          ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10" 
                          : "border-white/10 bg-black/30"
                      )}
                    >
                      {nc.selected && (
                        <div className="absolute right-0 top-0 rounded-bl-lg bg-indigo-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                          Selected
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-white mb-1">{nc.name}</h3>
                      <p className="text-xs text-gray-400">{nc.tagline}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Palette Swatches */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Brand Color Palette</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {businessPlan?.brandConcepts?.colorPalette?.map((cp, idx) => (
                    <div key={idx} className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                      <div 
                        className="h-16 w-full rounded-lg shadow-inner border border-white/10" 
                        style={{ backgroundColor: cp.hex }} 
                      />
                      <p className="text-xs font-semibold text-white">{cp.label}</p>
                      <p className="text-xs text-gray-400 font-mono">{cp.hex}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Logo Visual */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Generated Brand Emblem</h2>
              <div className="flex aspect-square items-center justify-center rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-slate-950/80 p-8 shadow-2xl">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-black text-white shadow-xl shadow-indigo-500/30 border border-indigo-400/30">
                    &lt;/&gt;
                  </div>
                  <span className="text-2xl font-bold text-white tracking-wide">
                    {businessPlan?.brandConcepts?.selectedName || selectedBusiness.title}
                  </span>
                  <span className="text-xs text-indigo-300 font-medium">
                    {businessPlan?.brandConcepts?.names?.[0]?.tagline || 'AI Powered Platform'}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-gray-400">
                {businessPlan?.brandConcepts?.logoConcept || 'Modern tech emblem designed for high recognition.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB: GROWTH & GENERATED ASSETS */}
        {activeTab === 'growth' && selectedBusiness && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Go To Market Timeline */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                Go-To-Market Timeline
              </h2>
              <div className="space-y-6">
                {businessPlan?.marketingStrategy?.phases?.map((phase, idx) => (
                  <div key={idx} className="relative pl-6 before:absolute before:left-2 before:top-2 before:h-full before:w-[2px] before:bg-indigo-500/30">
                    <div className="absolute left-[3px] top-2 h-3 w-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500" />
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">{phase.title}</span>
                    <h3 className="mb-1 font-semibold text-white text-base">{phase.phase}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{phase.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Assets Panel */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  Generated Production Assets
                </span>
                <span className="text-xs text-gray-400">{generatedAssets.length} Assets</span>
              </h2>

              {generatedAssets.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No assets generated yet.</p>
              ) : (
                <div className="space-y-3">
                  {generatedAssets.map((asset) => (
                    <div key={asset.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/20">
                            {asset.type}
                          </span>
                          <h4 className="font-semibold text-white text-sm mt-1">{asset.title}</h4>
                        </div>
                        <button
                          onClick={() => setSelectedAsset(asset)}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600/20 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30"
                        >
                          View Content <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed mb-3">{asset.summary}</p>
                      {asset.content && (
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-white/5">
                          <span>Created: {new Date(asset.createdAt).toLocaleTimeString()}</span>
                          <button
                            onClick={() => handleCopyContent(asset.content!, asset.id)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                          >
                            <Copy className="h-3 w-3" />
                            {copiedAssetId === asset.id ? 'Copied!' : 'Copy Code'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: RECENT ACTIVITY LOGS */}
        {activeTab === 'activity' && selectedBusiness && (
          <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-6 text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Real Activity Audit Log (Firestore)
            </h2>

            {activityLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No activity logs recorded.</p>
            ) : (
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 rounded-xl border border-white/5 bg-black/30 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{log.action}</span>
                        <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{log.details}</p>
                      <span className="text-[10px] text-gray-500 block mt-1">Actor: {log.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: LIVE ANALYTICS */}
        {activeTab === 'analytics' && selectedBusiness && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Assets Generated</span>
                <p className="text-3xl font-extrabold text-white mt-2">{analytics?.assetsGenerated || 0}</p>
                <span className="text-xs text-indigo-400 mt-1 block">Saved in Firestore</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Completed Tasks</span>
                <p className="text-3xl font-extrabold text-emerald-400 mt-2">{analytics?.completedTasks || 0}</p>
                <span className="text-xs text-gray-400 mt-1 block">Out of {analytics?.totalTasks || 5} Total</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Workflows Active</span>
                <p className="text-3xl font-extrabold text-amber-400 mt-2">{workflows.length}</p>
                <span className="text-xs text-gray-400 mt-1 block">Autonomous Execution</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Overall Completion</span>
                <p className="text-3xl font-extrabold text-indigo-400 mt-2">{analytics?.projectProgress || 0}%</p>
                <span className="text-xs text-gray-400 mt-1 block">Project Stage Ready</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Analytics Metrics Summary</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                All business analytics are calculated dynamically from live Firestore documents across the 9 primary collections (<code className="text-indigo-300">businesses</code>, <code className="text-indigo-300">businessPlans</code>, <code className="text-indigo-300">projects</code>, <code className="text-indigo-300">workflows</code>, <code className="text-indigo-300">workflowRuns</code>, <code className="text-indigo-300">agentTasks</code>, <code className="text-indigo-300">generatedAssets</code>, <code className="text-indigo-300">activityLogs</code>, <code className="text-indigo-300">analytics</code>).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Asset Content View Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                    {selectedAsset.type}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">{selectedAsset.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                <p className="text-sm text-gray-300">{selectedAsset.summary}</p>
                {selectedAsset.content && (
                  <pre className="rounded-xl border border-white/10 bg-black/60 p-4 text-xs font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap">
                    {selectedAsset.content}
                  </pre>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-xs text-gray-500">ID: {selectedAsset.id}</span>
                <button
                  onClick={() => handleCopyContent(selectedAsset.content || selectedAsset.summary, selectedAsset.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedAssetId === selectedAsset.id ? 'Copied!' : 'Copy Asset Data'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
