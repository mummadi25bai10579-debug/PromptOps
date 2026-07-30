import React, { useState } from 'react';
import { AssetDocument } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBytes, formatDate, getTypeColorAndIcon } from './AssetCard';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Download, 
  Trash2, 
  Heart, 
  Copy, 
  Share2, 
  Edit3, 
  Check, 
  Plus, 
  RefreshCw, 
  CopyPlus, 
  GitMerge, 
  Sparkles, 
  Maximize2, 
  Music, 
  FileText, 
  Tag 
} from 'lucide-react';

interface AssetPreviewPanelProps {
  asset: AssetDocument | null;
  onClose: () => void;
  onFavoriteToggle: (asset: AssetDocument) => void;
  onDownload: (url: string, filename: string) => void;
  onDelete: (id: string) => void;
  onCopyPrompt: (prompt: string) => void;
  onRename: (asset: AssetDocument, newName: string) => void;
  onDuplicate: (asset: AssetDocument) => void;
  onShare: (asset: AssetDocument) => void;
  onAddTag: (assetId: string, tag: string) => void;
  onRemoveTag: (assetId: string, tag: string) => void;
}

export const AssetPreviewPanel: React.FC<AssetPreviewPanelProps> = ({
  asset,
  onClose,
  onFavoriteToggle,
  onDownload,
  onDelete,
  onCopyPrompt,
  onRename,
  onDuplicate,
  onShare,
  onAddTag,
  onRemoveTag,
}) => {
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!asset) return null;

  const typeInfo = getTypeColorAndIcon(asset.type);
  const mediaUrl = asset.fileUrl || asset.resultUrl || asset.b2Url;
  const displayFileName = asset.fileName || `${asset.type}-${asset.id.slice(0, 6)}`;

  const handleStartEditingTitle = () => {
    setTitleInput(displayFileName);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (titleInput.trim() && titleInput !== displayFileName) {
      onRename(asset, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim()) {
      onAddTag(asset.id, tagInput.trim());
      setTagInput('');
    }
  };

  const handleCopyPromptClick = (text: string) => {
    onCopyPrompt(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleGenerateAgain = () => {
    onClose();
    navigate('/generate', { state: { initialPrompt: asset.prompt, initialModel: asset.model } });
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/85 backdrop-blur-2xl"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-7xl max-h-[92vh] bg-[#09090B] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Media Preview Section */}
          <div className="flex-1 bg-black/60 flex items-center justify-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 min-h-[35vh] lg:min-h-[80vh]">
            {/* Checkerboard Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.04] pointer-events-none" 
              style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
            />

            {asset.type === 'image' && mediaUrl ? (
              <img 
                src={mediaUrl} 
                alt={asset.prompt} 
                className="max-w-full max-h-[75vh] object-contain p-4 rounded-2xl drop-shadow-2xl" 
              />
            ) : asset.type === 'video' && mediaUrl ? (
              <video 
                src={mediaUrl} 
                className="max-w-full max-h-[75vh] object-contain p-4 rounded-2xl" 
                controls 
                autoPlay 
                loop 
              />
            ) : asset.type === 'audio' && mediaUrl ? (
              <div className="w-full max-w-lg p-8 bg-gradient-to-br from-emerald-950/30 to-black border border-white/10 rounded-3xl text-center">
                <Music className="w-20 h-20 text-emerald-400 mx-auto mb-6 animate-pulse" />
                <p className="text-lg font-semibold text-white mb-6 font-mono">{displayFileName}</p>
                <audio src={mediaUrl} controls className="w-full" />
              </div>
            ) : asset.type === 'text' || asset.generatedText ? (
              <div className="w-full max-w-3xl max-h-[70vh] p-6 overflow-y-auto custom-scrollbar">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-slate-200 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                  {asset.generatedText || asset.prompt}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <FileText className="w-20 h-20 text-amber-400/50 mb-4" />
                <p className="text-lg font-semibold text-white">{displayFileName}</p>
                <p className="text-sm text-slate-500 mt-1">Document Asset ({asset.fileType || 'binary'})</p>
              </div>
            )}
          </div>

          {/* Right Sidebar Details */}
          <div className="w-full lg:w-[460px] xl:w-[520px] bg-[#111827] flex flex-col h-full max-h-[50vh] lg:max-h-[92vh] overflow-y-auto custom-scrollbar">
            
            <div className="p-6 sm:p-8 space-y-6 flex-1">
              
              {/* Header Title & Rename */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${typeInfo.bg}`}>
                    {typeInfo.label}
                  </span>
                  {asset.model && (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-white/5 text-slate-300 border border-white/5">
                      {asset.model}
                    </span>
                  )}
                </div>

                {isEditingTitle ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="text" 
                      value={titleInput} 
                      onChange={(e) => setTitleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                      autoFocus
                      className="flex-1 bg-black/60 border border-indigo-500/50 rounded-xl px-3 py-1.5 text-sm text-white font-mono focus:outline-none"
                    />
                    <button 
                      onClick={handleSaveTitle}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group/title">
                    <h2 className="text-xl font-display font-bold text-white font-mono truncate tracking-tight pr-2">
                      {displayFileName}
                    </h2>
                    <button 
                      onClick={handleStartEditingTitle}
                      className="p-1.5 text-slate-500 hover:text-white transition-colors opacity-0 group-hover/title:opacity-100"
                      title="Rename Asset"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {mediaUrl && (
                  <button
                    onClick={() => onDownload(mediaUrl, displayFileName)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                )}

                <button
                  onClick={handleGenerateAgain}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-colors"
                  title="Generate Again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onFavoriteToggle(asset)}
                  className={`p-2.5 border rounded-xl transition-colors ${
                    asset.favorite 
                      ? 'bg-pink-500/20 border-pink-500/40 text-pink-400' 
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                  title={asset.favorite ? 'Unfavorite' : 'Favorite'}
                >
                  <Heart className={`w-4 h-4 ${asset.favorite ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => onDuplicate(asset)}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-colors"
                  title="Duplicate Asset"
                >
                  <CopyPlus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onShare(asset)}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-colors"
                  title="Share Asset"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Prompt Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prompt</span>
                  <button 
                    onClick={() => handleCopyPromptClick(asset.prompt)} 
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPrompt ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-slate-200 text-sm leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
                  {asset.prompt || 'No prompt specified'}
                </div>
              </div>

              {/* Negative Prompt if available */}
              {asset.negativePrompt && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Negative Prompt</span>
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-3 text-slate-400 text-xs leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                    {asset.negativePrompt}
                  </div>
                </div>
              )}

              {/* Tags Manager */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" /> Tags
                </span>
                
                <div className="flex flex-wrap gap-1.5 items-center">
                  {(asset.tags || []).map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5"
                    >
                      #{tag}
                      <button 
                        onClick={() => onRemoveTag(asset.id, tag)} 
                        className="text-indigo-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <form onSubmit={handleAddTagSubmit} className="inline-flex items-center">
                    <input 
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="+ Add tag..."
                      className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 w-24 focus:w-32 transition-all font-mono"
                    />
                  </form>
                </div>
              </div>

              {/* Detailed Metadata Grid */}
              <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">AI Model</span>
                  <span className="font-semibold text-slate-200">{asset.model || 'Standard AI'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Provider</span>
                  <span className="font-semibold text-slate-200">{asset.provider || 'PromptOps AI'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Created Date</span>
                  <span className="font-semibold text-slate-200">{formatDate(asset.createdAt)}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">File Size</span>
                  <span className="font-semibold text-slate-200">{formatBytes(asset.fileSize)}</span>
                </div>

                {asset.resolution && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Resolution</span>
                    <span className="font-semibold text-slate-200 font-mono">{asset.resolution}</span>
                  </div>
                )}

                {asset.duration && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Duration</span>
                    <span className="font-semibold text-slate-200 font-mono">{asset.duration}</span>
                  </div>
                )}

                {asset.seed !== undefined && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Seed</span>
                    <span className="font-semibold text-slate-200 font-mono">{asset.seed}</span>
                  </div>
                )}

                {asset.workflowId && (
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Genblaze Pipeline</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono font-medium">
                      <GitMerge className="w-3.5 h-3.5 text-purple-400" />
                      {asset.workflowId}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Delete Action */}
            <div className="p-6 border-t border-white/5 bg-black/20">
              <button
                onClick={() => onDelete(asset.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-medium text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Asset Permanently
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
