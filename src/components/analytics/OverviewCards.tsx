import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Heart,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { KpiCardData } from '../../types/analytics';
import { cn } from '../../utils/cn';

interface OverviewCardsProps {
  cardsData: KpiCardData[];
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ cardsData }) => {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-cyan-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-400" />;
      case 'text':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'storage':
        return <HardDrive className="w-5 h-5 text-indigo-400" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'failure':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'favorite':
        return <Heart className="w-5 h-5 text-pink-400 fill-pink-400/20" />;
      default:
        return <Activity className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getGlowColor = (type?: string) => {
    switch (type) {
      case 'image':
        return 'from-cyan-500/10 to-transparent group-hover:from-cyan-500/20';
      case 'video':
        return 'from-purple-500/10 to-transparent group-hover:from-purple-500/20';
      case 'audio':
        return 'from-emerald-500/10 to-transparent group-hover:from-emerald-500/20';
      case 'text':
        return 'from-amber-500/10 to-transparent group-hover:from-amber-500/20';
      case 'storage':
        return 'from-indigo-500/10 to-transparent group-hover:from-indigo-500/20';
      case 'success':
        return 'from-emerald-500/10 to-transparent group-hover:from-emerald-500/20';
      case 'failure':
        return 'from-rose-500/10 to-transparent group-hover:from-rose-500/20';
      case 'favorite':
        return 'from-pink-500/10 to-transparent group-hover:from-pink-500/20';
      default:
        return 'from-indigo-500/10 to-transparent group-hover:from-indigo-500/20';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5"
    >
      {cardsData.map((card) => {
        const isPositive = card.change >= 0;
        return (
          <motion.div
            key={card.id}
            variants={itemVariants}
            className="group relative bg-[#111827]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between"
          >
            {/* Ambient Background Glow */}
            <div
              className={cn(
                'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl transition-all duration-500 bg-gradient-to-br',
                getGlowColor(card.type)
              )}
            />

            <div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="p-2 bg-white/5 border border-white/10 rounded-xl group-hover:scale-105 transition-transform">
                  {getIcon(card.type)}
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2 mb-2 relative z-10">
                <span className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
                  {card.value}
                </span>

                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border',
                    isPositive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  )}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>
                    {isPositive ? '+' : ''}
                    {card.change}%
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 relative z-10">{card.subtext}</p>
            </div>

            {/* Mini Sparkline Bar Indicator */}
            {card.sparklineData && card.sparklineData.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/5 flex items-end gap-1 h-6 relative z-10">
                {card.sparklineData.map((val, idx) => {
                  const max = Math.max(...card.sparklineData!) || 1;
                  const heightPct = Math.max(15, Math.round((val / max) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-white/10 group-hover:bg-indigo-500/30 rounded-t transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};
