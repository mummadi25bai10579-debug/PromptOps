import React, { useState } from 'react';
import { X, Loader2, FileText, Image, Video, Music, HardDrive, Database, Sparkles } from 'lucide-react';
import { projectManagementService, ProjectAssetDoc } from '../../../services/projectManagementService';

interface CreateAssetModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({ projectId, isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProjectAssetDoc['type']>('document');
  const [source, setSource] = useState<ProjectAssetDoc['source']>('Firestore');
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await projectManagementService.addProjectAsset(projectId, {
        title: title.trim(),
        type,
        source,
        url: url.trim() || undefined,
        summary: summary.trim() || 'Uploaded asset file linked to project.',
        content: content.trim() || undefined
      });

      setTitle('');
      setUrl('');
      setSummary('');
      setContent('');
      onClose();
    } catch (err) {
      console.error('Failed to create asset:', err);
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

        <h2 className="text-xl font-bold text-white mb-1">Add Project Asset</h2>
        <p className="text-xs text-slate-400 mb-5">Link documents, media from Backblaze B2, Firestore, or AI Studio.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Asset Title *</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Q3 Strategic Growth Presentation" 
              className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Asset Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="document">Document</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="brand_logo">Brand / Logo</option>
                <option value="strategy">Strategy</option>
                <option value="copy">Copywriting</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Storage Source</label>
              <select 
                value={source} 
                onChange={e => setSource(e.target.value as any)}
                className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Backblaze B2">Backblaze B2</option>
                <option value="Firestore">Firestore</option>
                <option value="AI Studio">AI Studio</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Resource URL (Optional)</label>
            <input 
              type="url" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="https://f000.backblazeb2.com/file/..." 
              className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Summary / Brief</label>
            <input 
              type="text" 
              value={summary} 
              onChange={e => setSummary(e.target.value)} 
              placeholder="Brief overview of content..." 
              className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">Asset Content / Notes</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="Document body, strategy copy, or asset specification..." 
              className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
            />
          </div>

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
              Save Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
