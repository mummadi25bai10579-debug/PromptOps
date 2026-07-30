import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Cpu,
  CheckCircle2,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { GenerationJob } from '../../types';
import { cn } from '../../utils/cn';
import { formatBytes, getEstimatedFileSize } from '../../services/analyticsService';

interface AnalyticsChartsProps {
  generations: GenerationJob[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ generations }) => {
  const [activeChartTab, setActiveChartTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Colors for charts
  const COLORS = ['#22d3ee', '#c084fc', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

  // 1. Daily Generation Activity
  const dailyData = React.useMemo(() => {
    const daysMap = new Map();
    const daysName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      daysMap.set(key, {
        name: daysName[d.getDay()],
        images: 0,
        videos: 0,
        audio: 0,
        text: 0,
        total: 0,
      });
    }

    generations.forEach((g) => {
      const d = g.createdAt?.toDate ? g.createdAt.toDate() : new Date(g.createdAt || Date.now());
      if (!d) return;
      const key = d.toDateString();
      if (daysMap.has(key)) {
        const entry = daysMap.get(key);
        if (g.type === 'image') entry.images += 1;
        else if (g.type === 'video') entry.videos += 1;
        else if (g.type === 'audio') entry.audio += 1;
        else entry.text += 1;
        entry.total += 1;
      }
    });

    return Array.from(daysMap.values());
  }, [generations]);

  // 2. Weekly Activity
  const weeklyData = React.useMemo(() => {
    const weeks = [
      { name: '4 Weeks Ago', count: 0, storageMB: 0 },
      { name: '3 Weeks Ago', count: 0, storageMB: 0 },
      { name: '2 Weeks Ago', count: 0, storageMB: 0 },
      { name: 'This Week', count: 0, storageMB: 0 },
    ];

    const now = new Date();
    generations.forEach((g) => {
      const d = g.createdAt?.toDate ? g.createdAt.toDate() : new Date(g.createdAt || Date.now());
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 4) {
        weeks[3 - weekIndex].count += 1;
        weeks[3 - weekIndex].storageMB += Math.round(getEstimatedFileSize(g) / (1024 * 1024));
      }
    });

    return weeks;
  }, [generations]);

  // 3. Monthly Activity
  const monthlyData = React.useMemo(() => {
    const monthsMap = new Map();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]}`;
      monthsMap.set(label, { name: label, completed: 0, failed: 0, total: 0 });
    }

    generations.forEach((g) => {
      const d = g.createdAt?.toDate ? g.createdAt.toDate() : new Date(g.createdAt || Date.now());
      const label = months[d.getMonth()];
      if (monthsMap.has(label)) {
        const entry = monthsMap.get(label);
        if (g.status === 'failed') entry.failed += 1;
        else entry.completed += 1;
        entry.total += 1;
      }
    });

    return Array.from(monthsMap.values());
  }, [generations]);

  // 4. Generation Type Distribution
  const typeDistribution = React.useMemo(() => {
    const counts: Record<string, number> = { Image: 0, Video: 0, Audio: 0, Text: 0 };
    generations.forEach((g) => {
      if (g.type === 'image') counts.Image += 1;
      else if (g.type === 'video') counts.Video += 1;
      else if (g.type === 'audio') counts.Audio += 1;
      else counts.Text += 1;
    });

    return [
      { name: 'Images', value: counts.Image, color: '#22d3ee' },
      { name: 'Videos', value: counts.Video, color: '#c084fc' },
      { name: 'Audio', value: counts.Audio, color: '#10b981' },
      { name: 'Text / Docs', value: counts.Text, color: '#f59e0b' },
    ];
  }, [generations]);

  // 5. AI Model Usage Leaderboard
  const modelUsageData = React.useMemo(() => {
    const counts: Record<string, { count: number; totalTokens: number }> = {};
    generations.forEach((g) => {
      const name = g.model || 'Unknown Model';
      if (!counts[name]) counts[name] = { count: 0, totalTokens: 0 };
      counts[name].count += 1;
      counts[name].totalTokens += g.tokens?.totalTokens || 120;
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        tokens: data.totalTokens,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [generations]);

  // 6. Storage Growth Trend
  const storageGrowthData = React.useMemo(() => {
    const sorted = [...generations].sort((a, b) => {
      const tA = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || 0;
      const tB = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || 0;
      return tA - tB;
    });

    let runningTotal = 0;
    const chartPoints: { label: string; sizeMB: number }[] = [];

    sorted.forEach((g, idx) => {
      runningTotal += getEstimatedFileSize(g);
      if (idx % Math.max(1, Math.floor(sorted.length / 8)) === 0 || idx === sorted.length - 1) {
        const d = g.createdAt?.toDate ? g.createdAt.toDate() : new Date(g.createdAt || Date.now());
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        chartPoints.push({
          label,
          sizeMB: Math.round((runningTotal / (1024 * 1024)) * 10) / 10,
        });
      }
    });

    return chartPoints;
  }, [generations]);

  // 7. Success vs Failure Rate
  const successVsFailureData = React.useMemo(() => {
    const completed = generations.filter((g) => g.status === 'completed').length;
    const failed = generations.filter((g) => g.status === 'failed').length;
    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Failed', value: failed, color: '#f43f5e' },
    ];
  }, [generations]);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Activity Timeline Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Generation Activity Trends
            </h3>
            <p className="text-xs text-slate-400">
              Track throughput across images, videos, audio, and text responses over time
            </p>
          </div>

          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 self-start md:self-auto">
            {(['daily', 'weekly', 'monthly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveChartTab(t)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer',
                  activeChartTab === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                )}
              >
                {t} View
              </button>
            ))}
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === 'daily' ? (
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorImages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVideos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAudio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="images" name="Images" stroke="#22d3ee" fill="url(#colorImages)" strokeWidth={2} />
                <Area type="monotone" dataKey="videos" name="Videos" stroke="#c084fc" fill="url(#colorVideos)" strokeWidth={2} />
                <Area type="monotone" dataKey="audio" name="Audio" stroke="#10b981" fill="url(#colorAudio)" strokeWidth={2} />
              </AreaChart>
            ) : activeChartTab === 'weekly' ? (
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="count" name="Generations" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Grid Row 2: Distribution & Storage Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111827]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="mb-4">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-cyan-400" />
              Generation Type Distribution
            </h3>
            <p className="text-xs text-slate-400">Share of total assets created by category</p>
          </div>

          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Storage Growth Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111827]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="mb-4">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-purple-400" />
              Storage Usage Growth (MB)
            </h3>
            <p className="text-xs text-slate-400">Cumulative storage consumption trajectory</p>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={storageGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} MB`, 'Cumulative Storage']}
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Area type="monotone" dataKey="sizeMB" stroke="#818cf8" fill="url(#colorStorage)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Grid Row 3: Model Usage Leaderboard & Success vs Failure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Used AI Models Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[#111827]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                Most Used AI Models
              </h3>
              <p className="text-xs text-slate-400">Ranked by total generation calls and token consumption</p>
            </div>
          </div>

          <div className="space-y-4">
            {modelUsageData.map((item, idx) => {
              const max = modelUsageData[0]?.count || 1;
              const pct = Math.round((item.count / max) * 100);
              return (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center justify-center text-[10px]">
                        #{idx + 1}
                      </span>
                      <span className="text-white font-semibold">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 font-mono">
                      <span>{item.count} jobs</span>
                      <span className="text-indigo-400">{item.tokens.toLocaleString()} tokens</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Success vs Failure Rate Donut */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111827]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
        >
          <div className="mb-2">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Job Health & Success Rate
            </h3>
            <p className="text-xs text-slate-400">Completion vs failure status</p>
          </div>

          <div className="h-[220px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successVsFailureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {successVsFailureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
