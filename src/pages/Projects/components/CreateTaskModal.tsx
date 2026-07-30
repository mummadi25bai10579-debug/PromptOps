import React, { useState } from 'react';
import { X, Check, Loader2, Bot, User, AlertCircle } from 'lucide-react';
import { projectManagementService, ProjectTaskDoc } from '../../../services/projectManagementService';

interface CreateTaskModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ projectId, isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectTaskDoc['priority']>('Medium');
  const [assignedType, setAssignedType] = useState<'agent' | 'user'>('agent');
  const [agentName, setAgentName] = useState<'Research Agent' | 'Marketing Agent' | 'Content Agent' | 'Analytics Agent'>('Research Agent');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const assignee = assignedType === 'agent' ? agentName : (userName.trim() || 'Team Member');
      await projectManagementService.createTask(projectId, {
        title: title.trim(),
        description: description.trim(),
        status: 'Todo',
        priority,
        assignee,
        assignedType,
        agentName: assignedType === 'agent' ? agentName : undefined
      });

      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Create Project Task</h2>
        <p className="text-xs text-slate-400 mb-5">Add a new deliverable and assign it to a team member or AI Agent.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Task Title *</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Conduct Competitor Pricing Analysis" 
              className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Details on requirements and output expectations..." 
              className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Priority</label>
              <select 
                value={priority} 
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Assignment Type</label>
              <div className="flex bg-[#09090B] border border-white/10 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setAssignedType('agent')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded-lg font-medium transition-colors ${assignedType === 'agent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <Bot className="w-3.5 h-3.5" /> AI Agent
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedType('user')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded-lg font-medium transition-colors ${assignedType === 'user' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <User className="w-3.5 h-3.5" /> User
                </button>
              </div>
            </div>
          </div>

          {assignedType === 'agent' ? (
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Select AI Agent</label>
              <select 
                value={agentName} 
                onChange={e => setAgentName(e.target.value as any)}
                className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Research Agent">Research Agent</option>
                <option value="Marketing Agent">Marketing Agent</option>
                <option value="Content Agent">Content Agent</option>
                <option value="Analytics Agent">Analytics Agent</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Assignee Name</label>
              <input 
                type="text" 
                value={userName} 
                onChange={e => setUserName(e.target.value)} 
                placeholder="e.g. Sarah Connor" 
                className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting || !title.trim()} 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
