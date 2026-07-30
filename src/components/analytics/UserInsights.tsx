import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Cpu,
  FileCode,
  HardDrive,
  Calendar,
  MessageSquareText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserInsightsData } from '../../types/analytics';

interface UserInsightsProps {
  insights: UserInsightsData;
}

export const UserInsights: React.FC<UserInsightsProps> = ({ insights }) => {
  const [showFullLongestPrompt, setShowFullLongestPrompt] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-display font-bold text-white">AI Intelligence & User Insights</h3>
        </div>
        <span className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full font-semibold">
          Auto-analyzed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Most Used Prompt Theme */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
            <MessageSquareText className="w-4 h-4 text-cyan-400" />
            <span>Most Used Prompt Pattern</span>
          </div>
          <div className="text-sm font-bold text-white mb-1">{insights.mostUsedPrompt}</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Used in {insights.mostUsedPromptCount} generation jobs
          </p>
        </div>

        {/* Favorite AI Model */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Favorite AI Model</span>
          </div>
          <div className="text-sm font-bold text-white mb-1">{insights.favoriteModel}</div>
          <p className="text-[11px] text-slate-400 font-mono">Primary model driving outputs</p>
        </div>

        {/* Longest Prompt */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>Longest Prompt</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">{insights.longestPromptCharCount} chars</span>
          </div>
          <p className={`text-xs text-slate-200 ${showFullLongestPrompt ? '' : 'line-clamp-2'}`}>
            "{insights.longestPrompt}"
          </p>
          <button
            onClick={() => setShowFullLongestPrompt(!showFullLongestPrompt)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mt-2 cursor-pointer self-start"
          >
            {showFullLongestPrompt ? (
              <>
                Collapse <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Expand prompt <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Fastest Generation */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Fastest Generation</span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mb-1">{insights.fastestGenerationTime}</div>
          <p className="text-[11px] text-slate-400">Peak API response latency</p>
        </div>

        {/* Largest File */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Largest File Saved</span>
          </div>
          <div className="text-sm font-bold text-white mb-1 truncate">{insights.largestFileName}</div>
          <p className="text-[11px] font-mono text-indigo-300">{insights.largestFileSize}</p>
        </div>

        {/* Most Active Day */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
            <Calendar className="w-4 h-4 text-pink-400" />
            <span>Peak Activity Day</span>
          </div>
          <div className="text-sm font-bold text-white mb-1">{insights.mostActiveDay}s</div>
          <p className="text-[11px] text-slate-400">Highest volume generation day</p>
        </div>
      </div>
    </motion.div>
  );
};
