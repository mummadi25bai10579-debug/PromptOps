import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssetDocument } from '../../types';
import { X, Copy, Check, Share2, Code, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  asset: AssetDocument | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ asset, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!asset) return null;

  const mediaUrl = asset.fileUrl || asset.resultUrl || asset.b2Url || window.location.href;
  const embedCode = `<iframe src="${mediaUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

  const copyToClipboard = (text: string, isEmbed = false) => {
    navigator.clipboard.writeText(text);
    if (isEmbed) {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-[#09090B] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white">Share Asset</h3>
                <p className="text-xs text-slate-400">Share or embed generated PromptOps AI media</p>
              </div>
            </div>

            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {/* Direct Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" /> Asset Direct Link
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={mediaUrl} 
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(mediaUrl)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Embed Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-purple-400" /> HTML Embed Code
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={embedCode} 
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(embedCode, true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEmbed ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
