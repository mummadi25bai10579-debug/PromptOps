import React, { useState } from 'react';
import { GenerationJob } from '../../types';
import { computeWordDiff, computeLineDiff, computeTextStats } from '../../utils/diff';
import { Copy, Check, FileText, SplitSquareHorizontal, Layers, Hash, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TextComparisonViewProps {
  assetA?: GenerationJob;
  assetB?: GenerationJob;
}

export const TextComparisonView: React.FC<TextComparisonViewProps> = ({ assetA, assetB }) => {
  const [diffMode, setDiffMode] = useState<'inline' | 'sideBySide' | 'promptDiff'>('inline');
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  const textA = assetA?.generatedText || assetA?.prompt || '';
  const textB = assetB?.generatedText || assetB?.prompt || '';

  const promptA = assetA?.prompt || '';
  const promptB = assetB?.prompt || '';

  const wordDiff = computeWordDiff(textA, textB);
  const promptWordDiff = computeWordDiff(promptA, promptB);
  const lineDiffs = computeLineDiff(textA, textB);

  const statsA = computeTextStats(textA);
  const statsB = computeTextStats(textB);

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Mode Controls */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-white text-sm">Text & Prompt Diff Engine</span>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setDiffMode('inline')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              diffMode === 'inline' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Inline Diff
          </button>
          <button
            onClick={() => setDiffMode('sideBySide')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              diffMode === 'sideBySide' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            )}
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
            Side-by-Side
          </button>
          <button
            onClick={() => setDiffMode('promptDiff')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              diffMode === 'promptDiff' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Prompt Diff
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Words (A vs B)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-400">{statsA.wordCount}</span>
            <span className="text-slate-600">/</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{statsB.wordCount}</span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Chars (A vs B)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-400">{statsA.charCount}</span>
            <span className="text-slate-600">/</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{statsB.charCount}</span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Est. Tokens (A vs B)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-400">{statsA.estimatedTokens}</span>
            <span className="text-slate-600">/</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{statsB.estimatedTokens}</span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Lines (A vs B)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-400">{statsA.lineCount}</span>
            <span className="text-slate-600">/</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{statsB.lineCount}</span>
          </div>
        </div>
      </div>

      {/* Main Diff Content Display */}
      {diffMode === 'inline' && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm leading-relaxed overflow-x-auto">
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Inline Word Diff (Version A &rarr; Version B)</span>
            <div className="flex items-center gap-4 text-xs font-sans">
              <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/50"></span> Added in B</span>
              <span className="flex items-center gap-1 text-rose-400"><span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/50"></span> Removed from A</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {wordDiff.map((part, idx) => {
              if (part.type === 'added') {
                return (
                  <span key={idx} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded px-1.5 py-0.5">
                    +{part.text}
                  </span>
                );
              }
              if (part.type === 'removed') {
                return (
                  <span key={idx} className="bg-rose-500/20 text-rose-300 border border-rose-500/30 line-through rounded px-1.5 py-0.5">
                    -{part.text}
                  </span>
                );
              }
              return <span key={idx} className="text-slate-300 py-0.5 px-0.5">{part.text}</span>;
            })}
          </div>
        </div>
      )}

      {diffMode === 'sideBySide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Version A */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Version A Output</span>
              <button
                onClick={() => handleCopy(textA, setCopiedA)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy text"
              >
                {copiedA ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="p-5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar bg-black/40">
              {textA || <span className="text-slate-500 italic">No output text</span>}
            </div>
          </div>

          {/* Version B */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Version B Output</span>
              <button
                onClick={() => handleCopy(textB, setCopiedB)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy text"
              >
                {copiedB ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="p-5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar bg-black/40">
              {textB || <span className="text-slate-500 italic">No output text</span>}
            </div>
          </div>
        </div>
      )}

      {diffMode === 'promptDiff' && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Prompt Difference Analysis
          </h4>
          <div className="font-mono text-sm leading-relaxed p-4 bg-white/[0.02] rounded-xl border border-white/5 flex flex-wrap gap-1.5">
            {promptWordDiff.map((part, idx) => {
              if (part.type === 'added') {
                return (
                  <span key={idx} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded px-1.5 py-0.5">
                    +{part.text}
                  </span>
                );
              }
              if (part.type === 'removed') {
                return (
                  <span key={idx} className="bg-rose-500/20 text-rose-300 border border-rose-500/30 line-through rounded px-1.5 py-0.5">
                    -{part.text}
                  </span>
                );
              }
              return <span key={idx} className="text-slate-300">{part.text}</span>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};
