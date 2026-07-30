import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { useAuthStore } from '../../store/useAuthStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

interface WorkspaceModalProps {
  type: 'create' | 'rename' | 'delete' | null;
  onClose: () => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ type, onClose }) => {
  const { user } = useAuthStore();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

  const [name, setName] = useState(type === 'rename' && currentWorkspace ? currentWorkspace.name : '');
  const [description, setDescription] = useState(type === 'create' ? '' : (currentWorkspace?.description || ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!type) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (type === 'create') {
      if (!name.trim()) {
        setError('Workspace name is required.');
        return;
      }
      setLoading(true);
      try {
        const newId = await workspaceService.createWorkspace(
          user.id,
          user.email || 'user@promptops.ai',
          user.displayName || 'User',
          user.photoURL || '',
          name.trim(),
          description.trim()
        );
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to create workspace.');
      } finally {
        setLoading(false);
      }
    } else if (type === 'rename') {
      if (!currentWorkspace || !name.trim()) return;
      setLoading(true);
      try {
        await workspaceService.renameWorkspace(currentWorkspace.id, name.trim(), {
          id: user.id,
          name: user.displayName || user.email || 'User',
          email: user.email || ''
        });
        setCurrentWorkspace({ ...currentWorkspace, name: name.trim() });
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to rename workspace.');
      } finally {
        setLoading(false);
      }
    } else if (type === 'delete') {
      if (!currentWorkspace) return;
      setLoading(true);
      try {
        await workspaceService.deleteWorkspace(currentWorkspace.id);
        setCurrentWorkspace(null);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to delete workspace.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-[#121216] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              {type === 'create' && <Building2 className="w-5 h-5" />}
              {type === 'rename' && <Edit2 className="w-5 h-5" />}
              {type === 'delete' && <Trash2 className="w-5 h-5 text-red-200" />}
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">
                {type === 'create' && 'Create Workspace'}
                {type === 'rename' && 'Rename Workspace'}
                {type === 'delete' && 'Delete Workspace'}
              </h3>
              <p className="text-xs text-slate-400">
                {type === 'create' && 'Set up a new workspace for team AI asset collaboration.'}
                {type === 'rename' && 'Update the display name of your team workspace.'}
                {type === 'delete' && 'This action cannot be undone and deletes all team data.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {type !== 'delete' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Marketing AI Studio"
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {type === 'create' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Briefly describe what this workspace is for..."
                      className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none resize-none"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-slate-300 space-y-2">
                <p>
                  Are you sure you want to delete <strong className="text-white">{currentWorkspace?.name}</strong>?
                </p>
                <p className="text-xs text-slate-400">
                  All shared prompts, team members, comments, and activity logs for this workspace will be permanently removed.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-300 flex items-center gap-2 shadow-lg cursor-pointer ${
                  type === 'delete'
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-indigo-500/20'
                }`}
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {type === 'create' && 'Create Workspace'}
                {type === 'rename' && 'Save Changes'}
                {type === 'delete' && 'Confirm Delete'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
