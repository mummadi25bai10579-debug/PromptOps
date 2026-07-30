import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { backblazeService } from '../../services/backblazeService';
import { firestoreAssetService } from '../../services/firestoreAssetService';
import { useAuthStore } from '../../store/useAuthStore';
import { AssetType } from '../../types';
import { 
  X, 
  Upload, 
  FileUp, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Tag as TagIcon 
} from 'lucide-react';

interface UploadAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadAssetModal: React.FC<UploadAssetModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [modelInput, setModelInput] = useState('Custom Upload');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['uploaded']);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const detectAssetType = (mimeType: string, filename: string): AssetType => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('text/') || filename.endsWith('.txt') || filename.endsWith('.md')) return 'text';
    return 'document';
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    if (!user) {
      setError('User authentication required');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(20);

    try {
      // 1. Upload to Backblaze B2 via backend endpoint
      setUploadProgress(50);
      const b2Res = await backblazeService.uploadFile(selectedFile);
      setUploadProgress(80);

      // 2. Detect asset type
      const type = detectAssetType(selectedFile.type, selectedFile.name);

      // 3. Save to Firestore
      await firestoreAssetService.createAsset({
        userId: user.id,
        prompt: promptInput || `Uploaded file: ${selectedFile.name}`,
        type,
        status: 'completed',
        resultUrl: b2Res.url,
        fileUrl: b2Res.url,
        b2Url: b2Res.url,
        b2FileId: b2Res.fileId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        model: modelInput,
        provider: 'Backblaze B2 Storage',
        favorite: false,
        tags,
        createdAt: new Date(),
      });

      setUploadProgress(100);
      setIsUploading(false);
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload asset to Backblaze B2');
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-[#09090B] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white">Upload Asset to B2</h3>
                <p className="text-xs text-slate-400">Backblaze B2 S3 Cloud Bucket Storage</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                selectedFile 
                  ? 'border-indigo-500 bg-indigo-500/5' 
                  : 'border-white/15 hover:border-indigo-500/50 hover:bg-white/5'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileChange} 
                className="hidden" 
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  <span className="text-sm font-semibold text-white font-mono">{selectedFile.name}</span>
                  <span className="text-xs text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Upload className="w-10 h-10 text-indigo-400 mb-1" />
                  <span className="text-sm font-semibold text-white">Click or Drag File to Upload</span>
                  <span className="text-xs text-slate-500">Supports Images, Videos, Audio, Documents, and Text</span>
                </div>
              )}
            </div>

            {/* Prompt/Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Prompt / Asset Note</label>
              <textarea 
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Describe this asset or prompt used..."
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Model & Tags */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Model / Source</label>
                <input 
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Add Tags (press Enter)</label>
                <input 
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="e.g. concept, logo..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            {/* Tag Pills */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading to Backblaze B2 ({uploadProgress}%)...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Start B2 Upload
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
