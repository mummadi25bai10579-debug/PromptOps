import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FolderGit2, Plus, LayoutGrid, List,
  Clock, CheckCircle2, Users, BarChart3, 
  Loader2, Play, Bot, FileText, ArrowRight,
  Sparkles, Trash2, Layers
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';
import { 
  projectManagementService, 
  ProjectDoc, 
  WorkspaceDashboardStats 
} from '../../services/projectManagementService';
import { ProjectDetailsView } from './components/ProjectDetailsView';

export const ProjectManagement = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [stats, setStats] = useState<WorkspaceDashboardStats>({
    activeProjects: 0,
    completedProjects: 0,
    totalProjects: 0,
    tasksDue: 0,
    totalTasks: 0,
    workflowRuns: 0,
    agentRuns: 0,
    assetsGenerated: 0
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unSubProjects = projectManagementService.subscribeProjects((list) => {
      setProjects(list);
      setLoading(false);
    });

    const unSubStats = projectManagementService.subscribeDashboardStats(setStats);

    return () => {
      unSubProjects();
      unSubStats();
    };
  }, []);

  // If a specific projectId URL parameter is present, show Project Details View!
  if (projectId) {
    return <ProjectDetailsView />;
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const createdId = await projectManagementService.createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        businessId: businessId.trim() || undefined
      });

      setNewProjectName('');
      setNewProjectDesc('');
      setBusinessId('');
      setShowModal(false);

      // Navigate to project details
      navigate(`/projects/${createdId}`);
    } catch (err) {
      console.error('Failed to create project in Firestore:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project and all its tasks?')) {
      await projectManagementService.deleteProject(id);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto pb-12">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <FolderGit2 className="w-8 h-8" />
            </span>
            Projects Workspace
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Real Firestore-driven project management system with task tracking, workflows, AI agents, assets & analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#111827]/60 border border-white/10 rounded-xl p-1 flex">
            <button 
              onClick={() => setView('grid')}
              className={cn("p-2 rounded-lg transition-colors", view === 'grid' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white")}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("p-2 rounded-lg transition-colors", view === 'list' ? "bg-white/10 text-white" : "text-slate-500 hover:text-white")}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </header>

      {/* Real Firestore Dashboard Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 shrink-0">
        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <div className="text-xl font-bold text-white">{stats.activeProjects}</div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Active Projects</div>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <div className="text-xl font-bold text-emerald-400">{stats.completedProjects}</div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Completed</div>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <div className="text-xl font-bold text-amber-400">{stats.tasksDue}</div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Tasks Due</div>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <div className="text-xl font-bold text-indigo-400">{stats.workflowRuns}</div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Workflow Runs</div>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <div className="text-xl font-bold text-purple-400">{stats.agentRuns}</div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Agent Runs</div>
        </div>

        <div className="bg-[#111827]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <div className="text-xl font-bold text-teal-400">{stats.assetsGenerated}</div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Assets Stored</div>
        </div>
      </div>

      {/* Projects List / Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-indigo-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading projects from Firestore...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-[#111827]/40 border border-white/5 rounded-[24px] p-12 text-center text-slate-500 max-w-lg mx-auto my-8">
            <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-20 text-indigo-400" />
            <h3 className="text-lg font-bold text-white mb-1">No Projects Found</h3>
            <p className="text-xs text-slate-400 mb-6">Create your first project workspace to track deliverables, workflows, and AI agent outputs.</p>
            <button 
              onClick={() => setShowModal(true)} 
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Create New Project
            </button>
          </div>
        ) : (
          <div className={cn("grid gap-4", view === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
            {projects.map((project) => (
              <div 
                key={project.id} 
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-[#111827]/40 border border-white/10 hover:border-indigo-500/50 transition-all rounded-[24px] p-6 shadow-xl backdrop-blur-md group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{project.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                          project.status === 'active' ? "bg-emerald-500/20 text-emerald-400" :
                          project.status === 'planning' ? "bg-amber-500/20 text-amber-400" :
                          project.status === 'completed' ? "bg-indigo-500/20 text-indigo-400" :
                          "bg-slate-500/20 text-slate-400"
                        )}>
                          {project.status}
                        </span>
                        {project.businessId && (
                          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Linked Business
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-all"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {project.description && (
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">{project.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-400">Completion</span>
                      <span className="text-white font-bold">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          project.progress === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                        )}
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs font-medium text-slate-400">
                  <span className="text-slate-500 text-[10px] font-mono">{project.id}</span>
                  <span className="text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 font-semibold text-xs">
                    View Project <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Create New Project</h2>
            <p className="text-xs text-slate-400 mb-5">Stored in Firestore with full workflow & task integrations.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase block mb-1">Project Name *</label>
                <input 
                  type="text" 
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)} 
                  placeholder="e.g. Q3 Autonomous Marketing Campaign" 
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase block mb-1">Description</label>
                <textarea 
                  value={newProjectDesc} 
                  onChange={e => setNewProjectDesc(e.target.value)} 
                  placeholder="Overview of goals, deliverables, and agent assignments..." 
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase block mb-1">Connect Business ID (Optional)</label>
                <input 
                  type="text" 
                  value={businessId} 
                  onChange={e => setBusinessId(e.target.value)} 
                  placeholder="e.g. biz_172230000" 
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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
                  disabled={creating || !newProjectName.trim()} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
