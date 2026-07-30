import React, { useState } from 'react';
import { 
  FileText, Sparkles, Image, Video, Mic, Maximize2, HardDrive, 
  GitBranch, Clock, Bell, Code2, Search, Plus, Layers
} from 'lucide-react';
import { WorkflowNodeType } from '../../types/workflow';

interface NodeSidebarProps {
  onAddNode: (type: WorkflowNodeType) => void;
}

interface PaletteItem {
  type: WorkflowNodeType;
  title: string;
  category: 'input' | 'ai' | 'media' | 'logic' | 'utility';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'promptInput',
    title: 'Prompt Input',
    category: 'input',
    description: 'Entry point for text prompts & dynamic variables',
    icon: FileText,
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
  },
  {
    type: 'textGen',
    title: 'Text Generation',
    category: 'ai',
    description: 'Gemini 2.5 Flash for articles, summaries, and code',
    icon: Sparkles,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  },
  {
    type: 'imageGen',
    title: 'Image Generation',
    category: 'ai',
    description: 'FLUX / Pollinations text-to-image synthesis',
    icon: Image,
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  },
  {
    type: 'videoGen',
    title: 'Video Generation',
    category: 'media',
    description: 'Image-to-video FFmpeg & LTX motion animation',
    icon: Video,
    badgeColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20'
  },
  {
    type: 'audioGen',
    title: 'Audio Generation',
    category: 'media',
    description: 'Gemini Text-to-Speech natural voice synthesis',
    icon: Mic,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  },
  {
    type: 'imageUpscale',
    title: 'Image Upscale',
    category: 'media',
    description: '2x / 4x resolution sharpener & detail enhancer',
    icon: Maximize2,
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
  },
  {
    type: 'storage',
    title: 'Backblaze Storage',
    category: 'utility',
    description: 'Direct vault upload to Backblaze B2 bucket',
    icon: HardDrive,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    type: 'condition',
    title: 'Condition Logic',
    category: 'logic',
    description: 'If/Else conditional branch evaluator',
    icon: GitBranch,
    badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
  },
  {
    type: 'delay',
    title: 'Delay Timer',
    category: 'utility',
    description: 'Pause execution pipeline for specified seconds',
    icon: Clock,
    badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
  },
  {
    type: 'notification',
    title: 'Notification Alert',
    category: 'utility',
    description: 'In-app toast alert or webhook payload notification',
    icon: Bell,
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
  },
  {
    type: 'customApi',
    title: 'Custom API Call',
    category: 'utility',
    description: 'REST API call with custom headers & payload',
    icon: Code2,
    badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
  }
];

export const NodeSidebar: React.FC<NodeSidebarProps> = ({ onAddNode }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const onDragStart = (event: React.DragEvent, nodeType: WorkflowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredItems = PALETTE_ITEMS.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <aside className="w-72 bg-[#090d16]/95 border-r border-white/5 flex flex-col h-full select-none backdrop-blur-2xl z-10 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex items-center gap-2 text-white font-display font-semibold text-sm">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Node Palette</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="w-full bg-[#111827]/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {['all', 'ai', 'media', 'logic', 'utility'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize tracking-wider transition-colors ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider px-1">
          Drag onto canvas or click +
        </p>

        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              onClick={() => onAddNode(item.type)}
              className="group p-2.5 rounded-xl bg-[#111827]/50 hover:bg-[#1f293d]/80 border border-white/5 hover:border-indigo-500/40 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-indigo-500/10 flex items-center justify-between"
            >
              <div className="flex items-start gap-2.5 min-w-0 pr-2">
                <div className={`p-2 rounded-lg border ${item.badgeColor} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h5 className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                    {item.title}
                  </h5>
                  <p className="text-[10px] text-slate-500 group-hover:text-slate-400 truncate mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              <button 
                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-indigo-500 hover:text-white text-slate-400 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                title="Add to canvas"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
