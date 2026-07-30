import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, FolderGit2, CheckCircle2, Clock, AlertTriangle, 
  BarChart3, Plus, Play, Bot, FileText, Activity, Layers, 
  Users, Trash2, Edit3, Image, Video, Music, HardDrive, 
  Database, Sparkles, Check, ChevronRight, Loader2, ExternalLink
} from 'lucide-react';
import { 
  projectManagementService, 
  ProjectDoc, 
  ProjectTaskDoc, 
  ProjectWorkflowDoc, 
  ProjectWorkflowRunDoc, 
  ProjectAgentTaskDoc, 
  ProjectAssetDoc, 
  ProjectActivityDoc 
} from '../../../services/projectManagementService';
import { CreateTaskModal } from './CreateTaskModal';
import { CreateAssetModal } from './CreateAssetModal';
import { cn } from '../../../utils/cn';

export const ProjectDetailsView = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tasks' | 'workflows' | 'agents' | 'assets' | 'activity' | 'analytics'
  >('overview');

  // Subscribed collections state
  const [tasks, setTasks] = useState<ProjectTaskDoc[]>([]);
  const [workflows, setWorkflows] = useState<ProjectWorkflowDoc[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<ProjectWorkflowRunDoc[]>([]);
  const [agentTasks, setAgentTasks] = useState<ProjectAgentTaskDoc[]>([]);
  const [assets, setAssets] = useState<ProjectAssetDoc[]>([]);
  const [activities, setActivities] = useState<ProjectActivityDoc[]>([]);

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Agent Execution Form
  const [selectedAgent, setSelectedAgent] = useState<'Research Agent' | 'Marketing Agent' | 'Content Agent' | 'Analytics Agent'>('Research Agent');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentExecuting, setAgentExecuting] = useState(false);

  // Workflow trigger state
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);

  // Asset Filter
  const [assetFilter, setAssetFilter] = useState<'all' | 'document' | 'image' | 'video' | 'audio'>('all');

  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    const unSubDetail = projectManagementService.subscribeProjectDetail(projectId, (p) => {
      setProject(p);
      setLoading(false);
    });

    const unSubTasks = projectManagementService.subscribeProjectTasks(projectId, setTasks);
    const unSubWf = projectManagementService.subscribeProjectWorkflows(projectId, setWorkflows);
    const unSubRuns = projectManagementService.subscribeProjectWorkflowRuns(projectId, setWorkflowRuns);
    const unSubAgent = projectManagementService.subscribeProjectAgentTasks(projectId, setAgentTasks);
    const unSubAssets = projectManagementService.subscribeProjectAssets(projectId, setAssets);
    const unSubAct = projectManagementService.subscribeProjectActivities(projectId, setActivities);

    return () => {
      unSubDetail();
      unSubTasks();
      unSubWf();
      unSubRuns();
      unSubAgent();
      unSubAssets();
      unSubAct();
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-indigo-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm font-medium">Loading project workspace from Firestore...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-12 text-center text-slate-400 max-w-lg mx-auto my-12">
        <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-400" />
        <h3 className="text-xl font-bold text-white mb-2">Project Not Found</h3>
        <p className="text-xs text-slate-400 mb-6">The requested project ID does not exist or has been deleted from Firestore.</p>
        <button 
          onClick={() => navigate('/projects')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Back to Projects Workspace
        </button>
      </div>
    );
  }

  // Real calculated analytics metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const blockedTasks = tasks.filter(t => t.status === 'Blocked').length;
  const totalWorkflowRuns = workflowRuns.length;
  const totalAssetsGenerated = assets.length;
  const totalAgentRuns = agentTasks.length;

  const handleUpdateTaskStatus = async (taskId: string, newStatus: ProjectTaskDoc['status']) => {
    if (!projectId) return;
    await projectManagementService.updateTaskStatus(projectId, taskId, newStatus);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) return;
    await projectManagementService.deleteTask(projectId, taskId);
  };

  const handleRunWorkflow = async (workflowId: string, workflowName: string) => {
    if (!projectId) return;
    setRunningWorkflowId(workflowId);
    try {
      await projectManagementService.triggerWorkflowRun(projectId, workflowId, workflowName);
    } finally {
      setTimeout(() => setRunningWorkflowId(null), 1000);
    }
  };

  const handleExecuteAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !agentPrompt.trim()) return;
    setAgentExecuting(true);
    try {
      await projectManagementService.triggerAgentExecution(projectId, selectedAgent, agentPrompt.trim());
      setAgentPrompt('');
    } finally {
      setAgentExecuting(false);
    }
  };

  const handleUpdateProjectStatus = async (status: ProjectDoc['status']) => {
    if (!projectId) return;
    await projectManagementService.updateProjectStatus(projectId, status);
  };

  const filteredAssets = assets.filter(a => {
    if (assetFilter === 'all') return true;
    if (assetFilter === 'document') return a.type === 'document' || a.type === 'strategy' || a.type === 'copy';
    return a.type === assetFilter;
  });

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto pb-12">
      {/* Top Header Breadcrumb & Actions */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <button 
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#111827]/60 hover:bg-[#111827] border border-white/10 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
          <button 
            onClick={() => setShowAssetModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Asset
          </button>
        </div>
      </div>

      {/* Project Overview Card Header */}
      <div className="bg-[#111827]/60 border border-white/10 rounded-[24px] p-6 mb-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <FolderGit2 className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
              <select 
                value={project.status}
                onChange={e => handleUpdateProjectStatus(e.target.value as any)}
                className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer",
                  project.status === 'active' ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" :
                  project.status === 'completed' ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" :
                  project.status === 'planning' ? "bg-amber-500/20 border-amber-500/40 text-amber-400" :
                  "bg-slate-500/20 border-slate-500/40 text-slate-400"
                )}
              >
                <option value="active" className="bg-[#111827] text-emerald-400">ACTIVE</option>
                <option value="planning" className="bg-[#111827] text-amber-400">PLANNING</option>
                <option value="completed" className="bg-[#111827] text-indigo-400">COMPLETED</option>
                <option value="on_hold" className="bg-[#111827] text-slate-400">ON HOLD</option>
              </select>
            </div>
            {project.description && (
              <p className="text-xs text-slate-400 max-w-3xl ml-12">{project.description}</p>
            )}
          </div>

          {/* Quick links to connected modules */}
          <div className="flex items-center gap-2 shrink-0">
            {project.businessId && (
              <Link 
                to={`/builder?businessId=${project.businessId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium transition-colors"
              >
                <Layers className="w-3.5 h-3.5" /> Business Builder
              </Link>
            )}
            <Link 
              to="/workflows"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-xl text-xs font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Workflows
            </Link>
            <Link 
              to="/agent"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 rounded-xl text-xs font-medium transition-colors"
            >
              <Bot className="w-3.5 h-3.5" /> AI Agent
            </Link>
          </div>
        </div>

        {/* Progress meter */}
        <div className="bg-[#09090B]/60 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Overall Project Completion
              </span>
              <span className="text-white font-bold text-sm">{project.progress || 0}%</span>
            </div>
            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  project.progress === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"
                )}
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6 w-full md:w-auto justify-around">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{completedTasks}/{totalTasks}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tasks Done</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-400">{totalWorkflowRuns}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Workflow Runs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{totalAgentRuns}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Agent Runs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{totalAssetsGenerated}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Assets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 mb-6 overflow-x-auto custom-scrollbar pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: FolderGit2 },
          { id: 'tasks', label: `Tasks (${totalTasks})`, icon: CheckCircle2 },
          { id: 'workflows', label: `Workflows (${workflows.length})`, icon: Play },
          { id: 'agents', label: `AI Agents (${totalAgentRuns})`, icon: Bot },
          { id: 'assets', label: `Assets (${totalAssetsGenerated})`, icon: FileText },
          { id: 'activity', label: 'Activity Timeline', icon: Activity },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                isActive 
                  ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg" 
                  : "bg-[#111827]/40 border-transparent text-slate-400 hover:text-white hover:bg-[#111827]"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-slate-500")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Project Summary Card */}
            <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-400" /> Project Brief & Architecture
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {project.description || 'No detailed project description provided yet.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Owner Email</div>
                  <div className="text-xs font-semibold text-slate-200 mt-1 truncate">{project.ownerEmail || 'Unassigned'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Project ID</div>
                  <div className="text-xs font-mono text-indigo-300 mt-1 truncate">{project.id}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Created Date</div>
                  <div className="text-xs font-semibold text-slate-200 mt-1">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Just now'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Task Summary */}
            <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active Deliverables
                </h3>
                <button 
                  onClick={() => setActiveTab('tasks')} 
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  View All ({totalTasks}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-[#09090B]/40 rounded-xl border border-white/5">
                  <p className="text-xs mb-3">No tasks created for this project yet.</p>
                  <button 
                    onClick={() => setShowTaskModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    + Create Task
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 4).map((t) => (
                    <div key={t.id} className="p-3 bg-[#09090B]/60 border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          t.status === 'Completed' ? 'bg-emerald-400' :
                          t.status === 'In Progress' ? 'bg-indigo-400' :
                          t.status === 'Blocked' ? 'bg-rose-400' : 'bg-slate-500'
                        )} />
                        <div>
                          <div className="text-xs font-semibold text-white">{t.title}</div>
                          <div className="text-[10px] text-slate-400">Assigned: {t.assignee}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Modules & Recent Activity */}
          <div className="space-y-6">
            <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" /> Recent Activity
              </h3>

              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No activity logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((act) => (
                    <div key={act.id} className="text-xs border-l-2 border-indigo-500/50 pl-3 py-1">
                      <div className="font-semibold text-slate-200">{act.action}</div>
                      <div className="text-[11px] text-slate-400">{act.details}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. TASKS TAB */}
      {activeTab === 'tasks' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Project Tasks ({totalTasks})</h2>
              <p className="text-xs text-slate-400">Manage deliverables, update statuses, and assign AI agents.</p>
            </div>
            <button 
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-12 text-center text-slate-500 max-w-md mx-auto my-8">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20 text-indigo-400" />
              <h3 className="text-base font-bold text-white mb-1">No Tasks Found</h3>
              <p className="text-xs text-slate-400 mb-6">Create your first task to start tracking deliverables for this project.</p>
              <button 
                onClick={() => setShowTaskModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Create First Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {(['Todo', 'In Progress', 'Review', 'Completed', 'Blocked'] as const).map((status) => {
                const columnTasks = tasks.filter(t => t.status === status);
                return (
                  <div key={status} className="bg-[#111827]/30 border border-white/5 rounded-2xl p-4 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">{status}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {columnTasks.map((t) => (
                        <div key={t.id} className="bg-[#09090B] border border-white/10 hover:border-white/20 rounded-xl p-3 shadow-md space-y-2 group">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-semibold text-white line-clamp-2">{t.title}</span>
                            <button 
                              onClick={() => handleDeleteTask(t.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {t.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                          )}

                          <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px]">
                            <span className={cn(
                              "font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                              t.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-400' :
                              t.priority === 'High' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-500/20 text-slate-400'
                            )}>
                              {t.priority}
                            </span>
                            <span className="text-indigo-400 flex items-center gap-1">
                              {t.assignedType === 'agent' ? <Bot className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                              {t.assignee}
                            </span>
                          </div>

                          {/* Quick Status Change selector */}
                          <div className="pt-1">
                            <select 
                              value={t.status}
                              onChange={e => handleUpdateTaskStatus(t.id, e.target.value as any)}
                              className="w-full bg-[#111827] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none"
                            >
                              <option value="Todo">Move to Todo</option>
                              <option value="In Progress">Move to In Progress</option>
                              <option value="Review">Move to Review</option>
                              <option value="Completed">Move to Completed</option>
                              <option value="Blocked">Move to Blocked</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. WORKFLOWS TAB */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">Workflow Integration ({workflows.length})</h2>
              <p className="text-xs text-slate-400">Automated pipelines and workflow history for this project.</p>
            </div>
            <Link 
              to="/workflows"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg"
            >
              <Play className="w-3.5 h-3.5" /> Workflow Builder
            </Link>
          </div>

          {workflows.length === 0 ? (
            <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-12 text-center text-slate-500 max-w-md mx-auto my-8">
              <Play className="w-12 h-12 mx-auto mb-3 opacity-20 text-indigo-400" />
              <h3 className="text-base font-bold text-white mb-1">No Workflows Connected</h3>
              <p className="text-xs text-slate-400 mb-6">Create or link a workflow run for this project workspace.</p>
              <button 
                onClick={() => handleRunWorkflow('default_wf', 'Core Project Pipeline')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Initialize Standard Workflow
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map((wf) => (
                <div key={wf.id} className="bg-[#111827]/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-bold text-white">{wf.name}</h3>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                        wf.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        wf.status === 'Running' ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' :
                        'bg-slate-500/20 text-slate-400'
                      )}>
                        {wf.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Pipeline type: {wf.type || 'Autonomous'}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-[10px] text-slate-500 font-mono">{wf.id}</span>
                    <button 
                      onClick={() => handleRunWorkflow(wf.id, wf.name)}
                      disabled={runningWorkflowId === wf.id}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      {runningWorkflowId === wf.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Execute Run
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Workflow Runs History */}
          <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Execution History ({workflowRuns.length})
            </h3>

            {workflowRuns.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No previous runs logged.</p>
            ) : (
              <div className="space-y-3">
                {workflowRuns.map((run) => (
                  <div key={run.id} className="bg-[#09090B] border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white">{run.workflowName}</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                        run.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        run.status === 'Running' ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-rose-500/20 text-rose-400'
                      )}>
                        {run.status}
                      </span>
                    </div>
                    {run.logs && run.logs.length > 0 && (
                      <div className="bg-black/60 border border-white/5 rounded-lg p-2 font-mono text-[10px] text-slate-400 max-h-24 overflow-y-auto space-y-1">
                        {run.logs.map((l, idx) => <div key={idx}>{l}</div>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. AGENTS TAB */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" /> AI Agent Dispatch Engine
            </h2>
            <p className="text-xs text-slate-400 mb-6">Select a specialized agent and issue direct instructions to produce project deliverables.</p>

            <form onSubmit={handleExecuteAgent} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Research Agent', desc: 'Market analysis & data gathering' },
                  { name: 'Marketing Agent', desc: 'Campaign strategies & positioning' },
                  { name: 'Content Agent', desc: 'Copywriting, guides & specs' },
                  { name: 'Analytics Agent', desc: 'Performance metrics & audits' },
                ].map((ag) => (
                  <button
                    key={ag.name}
                    type="button"
                    onClick={() => setSelectedAgent(ag.name as any)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      selectedAgent === ag.name 
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg" 
                        : "bg-[#09090B] border-white/10 text-slate-400 hover:text-white"
                    )}
                  >
                    <div className="text-xs font-bold text-white">{ag.name}</div>
                    <div className="text-[10px] opacity-70 mt-1">{ag.desc}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Task Prompt for {selectedAgent}
                </label>
                <textarea 
                  value={agentPrompt} 
                  onChange={e => setAgentPrompt(e.target.value)} 
                  placeholder={`Instruct ${selectedAgent} (e.g. "Draft an executive positioning statement for our Q3 launch")...`}
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={agentExecuting || !agentPrompt.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-colors"
                >
                  {agentExecuting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Dispatch Agent Task
                </button>
              </div>
            </form>
          </div>

          {/* Agent Task History */}
          <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" /> Agent Task Logs & Outputs ({agentTasks.length})
            </h3>

            {agentTasks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No agent tasks recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {agentTasks.map((at) => (
                  <div key={at.id} className="bg-[#09090B] border border-white/10 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400">{at.agentName}</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                        at.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        at.status === 'Running' ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' :
                        'bg-rose-500/20 text-rose-400'
                      )}>
                        {at.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium">"{at.description}"</p>

                    {at.resultSummary && (
                      <div className="bg-white/5 p-3 rounded-lg text-xs text-slate-300 border border-white/5">
                        {at.resultSummary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. ASSETS TAB */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Project Assets ({assets.length})</h2>
              <p className="text-xs text-slate-400">Stored documents, media files from Backblaze B2, Firestore, & AI Studio.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-[#111827]/60 border border-white/10 rounded-xl p-1">
                {(['all', 'document', 'image', 'video', 'audio'] as const).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => setAssetFilter(ft)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-colors",
                      assetFilter === ft ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    )}
                  >
                    {ft}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowAssetModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Upload Asset
              </button>
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-12 text-center text-slate-500 max-w-md mx-auto my-8">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20 text-indigo-400" />
              <h3 className="text-base font-bold text-white mb-1">No Assets Found</h3>
              <p className="text-xs text-slate-400 mb-6">Upload or generate project assets to store in Firestore & Backblaze B2.</p>
              <button 
                onClick={() => setShowAssetModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Upload First Asset
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="bg-[#111827]/40 border border-white/10 hover:border-white/20 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between group shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="p-2 bg-white/5 border border-white/10 rounded-xl text-indigo-400">
                        {asset.type === 'image' ? <Image className="w-4 h-4" /> :
                         asset.type === 'video' ? <Video className="w-4 h-4" /> :
                         asset.type === 'audio' ? <Music className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                        asset.source === 'Backblaze B2' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                        asset.source === 'AI Studio' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' :
                        'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                      )}>
                        {asset.source}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{asset.title}</h4>
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">{asset.summary}</p>

                    {asset.content && (
                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 text-[11px] text-slate-300 font-mono line-clamp-3 mb-4">
                        {asset.content}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-slate-500">
                    <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                    {asset.url ? (
                      <a 
                        href={asset.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                      >
                        Open Asset <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400 font-semibold">Stored in Firestore</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Real Audit Activity Feed
          </h2>
          <p className="text-xs text-slate-400 mb-6">Real-time log of project modifications stored in Firestore `activityLogs`.</p>

          {activities.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No activities recorded for this project yet.</p>
          ) : (
            <div className="relative border-l border-white/10 ml-4 space-y-6">
              {activities.map((act) => (
                <div key={act.id} className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-[#111827]" />
                  <div className="bg-[#09090B] border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white">{act.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{act.details}</p>
                    <div className="text-[10px] text-slate-500 font-semibold">By: {act.actor}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
              <div className="text-2xl font-bold text-white">{project.progress}%</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Project Progress</div>
            </div>
            <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
              <div className="text-2xl font-bold text-emerald-400">{completedTasks} / {totalTasks}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Completed Tasks</div>
            </div>
            <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
              <div className="text-2xl font-bold text-indigo-400">{totalWorkflowRuns}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Workflow Runs</div>
            </div>
            <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md">
              <div className="text-2xl font-bold text-purple-400">{totalAssetsGenerated}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Assets Stored</div>
            </div>
          </div>

          <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Task Status Distribution</h3>
            <div className="space-y-3">
              {[
                { label: 'Completed', count: completedTasks, color: 'bg-emerald-500' },
                { label: 'In Progress', count: inProgressTasks, color: 'bg-indigo-500' },
                { label: 'Blocked', count: blockedTasks, color: 'bg-rose-500' },
                { label: 'Pending / Todo', count: pendingTasks - inProgressTasks - blockedTasks, color: 'bg-slate-500' },
              ].map((item) => {
                const pct = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">{item.label} ({item.count})</span>
                      <span className="text-white">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <CreateTaskModal 
        projectId={project.id} 
        isOpen={showTaskModal} 
        onClose={() => setShowTaskModal(false)} 
      />

      <CreateAssetModal 
        projectId={project.id} 
        isOpen={showAssetModal} 
        onClose={() => setShowAssetModal(false)} 
      />
    </div>
  );
};
