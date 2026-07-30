import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Comparison, GenerationJob } from '../../types';
import {
  ArrowLeft,
  Trophy,
  Download,
  Copy,
  Trash2,
  Repeat,
  Share2,
  Heart,
  Sliders,
  Eye,
  Check,
  Sparkles,
  FileText,
} from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { cn } from '../../utils/cn';
import { computeWordDiff } from '../../utils/diff';
import { ImageComparisonView } from '../../components/compare/ImageComparisonView';
import { VideoComparisonView } from '../../components/compare/VideoComparisonView';
import { AudioComparisonView } from '../../components/compare/AudioComparisonView';
import { TextComparisonView } from '../../components/compare/TextComparisonView';
import { SettingsDiffTable } from '../../components/compare/SettingsDiffTable';

interface ComparisonViewProps {
  comparison: Comparison;
  onBack: () => void;
  onUpdate: (updated: Comparison) => void;
}

export const ComparisonView = ({ comparison, onBack, onUpdate }: ComparisonViewProps) => {
  const [activeTab, setActiveTab] = useState<'media' | 'settings'>('media');
  const [copiedPromptA, setCopiedPromptA] = useState(false);
  const [copiedPromptB, setCopiedPromptB] = useState(false);
  const [favA, setFavA] = useState(false);
  const [favB, setFavB] = useState(false);

  const { assetA, assetB } = comparison;

  // Determine dominant asset type
  const mediaType = assetA?.type || assetB?.type || 'image';

  const setWinner = async (winnerId: string | null) => {
    try {
      await updateDoc(doc(db, 'comparisons', comparison.id), {
        winnerId,
      });
      onUpdate({ ...comparison, winnerId });
    } catch (err) {
      console.error('Failed to set winner', err);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this comparison session?')) {
      try {
        await deleteDoc(doc(db, 'comparisons', comparison.id));
        onBack();
      } catch (err) {
        console.error('Failed to delete comparison', err);
      }
    }
  };

  const handleExportReport = () => {
    const reportData = {
      comparisonId: comparison.id,
      createdAt: comparison.createdAt,
      winnerId: comparison.winnerId,
      assetA: {
        id: assetA?.id,
        prompt: assetA?.prompt,
        model: assetA?.model,
        type: assetA?.type,
        settings: assetA?.settings || assetA?.parameters,
      },
      assetB: {
        id: assetB?.id,
        prompt: assetB?.prompt,
        model: assetB?.model,
        type: assetB?.type,
        settings: assetB?.settings || assetB?.parameters,
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PromptOps-Comparison-${comparison.id.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDiffPrompt = (job: GenerationJob, otherJob?: GenerationJob) => {
    if (!otherJob || job.prompt === otherJob.prompt) {
      return job.prompt;
    }
    const diff = computeWordDiff(otherJob.prompt, job.prompt);

    return (
      <span className="leading-relaxed">
        {diff.map((part, i) => {
          if (part.type === 'unchanged') return <span key={i}>{part.text} </span>;
          if (part.type === 'added')
            return (
              <span key={i} className="bg-emerald-500/20 text-emerald-300 font-semibold rounded px-1">
                {part.text}{' '}
              </span>
            );
          return null;
        })}
      </span>
    );
  };

  const renderJobDetails = (
    job?: GenerationJob,
    otherJob?: GenerationJob,
    isWinner?: boolean,
    onSetWinner?: () => void,
    isFav?: boolean,
    onToggleFav?: () => void
  ) => {
    if (!job) return <div className="text-slate-500 text-xs">Asset missing or deleted</div>;

    return (
      <div
        className={cn(
          "flex flex-col h-full bg-white/[0.02] border rounded-2xl p-5 transition-all relative",
          isWinner ? "border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.12)]" : "border-white/10"
        )}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-semibold text-white uppercase tracking-wider">
              {job.provider || job.type || 'AI Output'}
            </span>
            {isWinner && (
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1 uppercase tracking-wider border border-emerald-500/30">
                <Trophy className="w-3 h-3" /> Winner
              </span>
            )}
          </div>

          <button
            onClick={onSetWinner}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer flex items-center gap-1",
              isWinner
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "bg-white/10 hover:bg-white/20 text-white"
            )}
          >
            <Trophy className="w-3.5 h-3.5" />
            {isWinner ? 'Winner Picked' : 'Mark as Winner'}
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Prompt</h4>
            <div className="p-3 bg-black/50 rounded-xl text-slate-300 text-xs border border-white/5 relative group leading-relaxed font-sans">
              {renderDiffPrompt(job, otherJob)}
              <button
                onClick={() => navigator.clipboard.writeText(job.prompt)}
                className="absolute top-2 right-2 p-1 bg-white/10 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Copy prompt"
              >
                <Copy className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Model</p>
              <p className="font-semibold text-slate-200 text-xs truncate" title={job.model}>
                {job.model}
              </p>
            </div>
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Type / Resolution</p>
              <p className="font-semibold text-slate-200 text-xs truncate">
                {job.resolution || job.type || 'Standard'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-4 gap-2">
          {job.resultUrl && (
            <a
              href={job.resultUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer"
              title="Download asset"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => navigator.clipboard.writeText(job.prompt)}
            className="flex items-center justify-center p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-indigo-400 cursor-pointer"
            title="Copy prompt"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleFav}
            className={cn(
              "flex items-center justify-center p-2 rounded-xl transition-colors cursor-pointer",
              isFav ? "bg-pink-500/20 text-pink-400" : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-pink-400"
            )}
            title="Favorite"
          >
            <Heart className={cn("w-4 h-4", isFav && "fill-pink-400")} />
          </button>
          <button
            onClick={() => alert(`Re-generating prompt with ${job.model}...`)}
            className="flex items-center justify-center p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-emerald-400 cursor-pointer"
            title="Re-generate"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#09090B]">
      {/* Top Bar */}
      <header className="px-8 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#09090B]/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors cursor-pointer border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
              Version Comparison Studio
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-sans uppercase tracking-wider font-semibold">
                {mediaType}
              </span>
            </h1>
            <p className="text-xs text-slate-400">Evaluate side-by-side outputs, parameters, and declare the winning version.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Main Mode Toggle: Media vs Settings */}
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setActiveTab('media')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'media' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <Eye className="w-4 h-4" />
              Visual / Output Diff
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'settings' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <Sliders className="w-4 h-4" />
              Settings & Params
            </button>
          </div>

          <div className="w-px h-6 bg-white/10"></div>

          <button
            onClick={handleExportReport}
            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export Comparison Report"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>

          <button
            onClick={handleDelete}
            className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-colors cursor-pointer border border-rose-500/20"
            title="Delete Session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Stage */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 custom-scrollbar">
        {/* Left Area: View Component based on Media Type or Settings */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeTab === 'settings' ? (
            <SettingsDiffTable jobs={[assetA, assetB].filter(Boolean) as GenerationJob[]} labels={['Version A', 'Version B']} />
          ) : (
            <>
              {mediaType === 'image' && <ImageComparisonView assetA={assetA} assetB={assetB} />}
              {mediaType === 'video' && <VideoComparisonView assetA={assetA} assetB={assetB} />}
              {mediaType === 'audio' && <AudioComparisonView assetA={assetA} assetB={assetB} />}
              {(mediaType === 'text' || mediaType === 'document') && (
                <TextComparisonView assetA={assetA} assetB={assetB} />
              )}
            </>
          )}
        </div>

        {/* Right Details Sidebar */}
        <div className="w-full md:w-80 shrink-0 flex flex-col gap-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Version Specifications</span>
            <span className="text-indigo-400">{comparison.winnerId ? 'Winner Selected' : 'Pending Selection'}</span>
          </div>

          {renderJobDetails(
            assetA,
            assetB,
            comparison.winnerId === assetA?.id,
            () => setWinner(comparison.winnerId === assetA?.id ? null : assetA?.id!),
            favA,
            () => setFavA(!favA)
          )}

          {renderJobDetails(
            assetB,
            assetA,
            comparison.winnerId === assetB?.id,
            () => setWinner(comparison.winnerId === assetB?.id ? null : assetB?.id!),
            favB,
            () => setFavB(!favB)
          )}
        </div>
      </div>
    </div>
  );
};
