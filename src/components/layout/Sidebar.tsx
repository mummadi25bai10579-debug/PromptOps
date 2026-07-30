import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wand2, Library, GitMerge, History, Settings, LogOut, Activity, ChevronLeft, ChevronRight, Scale, FileText, Users, PenTool, Replace, Search, Tag, Share2, Bell, Bot, Network, ShoppingBag, Terminal, FolderGit2, Zap, Building2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/useAuthStore';
import { auth } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Command Center', path: '/', icon: LayoutDashboard },
  { name: 'Business Builder', path: '/builder', icon: Building2 },
  { name: 'Projects', path: '/projects', icon: FolderGit2 },
  { name: 'Multi-Agent', path: '/multi-agent', icon: Users },
  { name: 'Automations', path: '/automations', icon: Zap },
  { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
  { name: 'Model Hub', path: '/models', icon: Network },
  { name: 'Developer Portal', path: '/developer', icon: Terminal },
  { name: 'AI Agent Mode', path: '/agent', icon: Bot },
  { name: 'Activity & Collab', path: '/activity', icon: Activity },
  { name: 'Public Shares', path: '/shares', icon: Share2 },
  { name: 'Semantic Search', path: '/search', icon: Search },
  { name: 'AI Metadata Engine', path: '/metadata', icon: Tag },
  { name: 'Prompt Assistant', path: '/assistant', icon: PenTool },
  { name: 'Generate', path: '/generate', icon: Wand2 },
  { name: 'Remix Studio', path: '/remix', icon: Replace },
  { name: 'Team Collaboration', path: '/team', icon: Users },
  { name: 'Assets', path: '/assets', icon: Library },
  { name: 'Compare', path: '/compare', icon: Scale },
  { name: 'Workflows', path: '/workflows', icon: GitMerge },
  { name: 'Prompt History', path: '/history', icon: History },
  { name: 'Analytics', path: '/analytics', icon: Activity },
  { name: 'Settings', path: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
  mobile?: boolean;
}

export const Sidebar = ({ className, mobile }: SidebarProps) => {
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  const isCollapsed = collapsed && !mobile;

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className={cn(
        "border-r border-white/5 bg-[#09090B]/40 backdrop-blur-2xl z-10 flex-col h-screen sticky top-0 relative", 
        className, 
        mobile ? 'flex w-72' : ''
      )}
    >
      {!mobile && (
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white hover:bg-white/20 transition-colors z-50 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      )}

      <div className={cn("p-6 flex-1 overflow-y-auto overflow-x-hidden", isCollapsed ? "px-4" : "")}>
        <div className={cn("flex items-center gap-3 mb-10", isCollapsed ? "justify-center" : "")}>
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-display font-bold tracking-tight text-white whitespace-nowrap"
            >
              PromptOps
            </motion.span>
          )}
        </div>

        <nav className="space-y-1.5">
          {!isCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Platform</div>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative group overflow-hidden',
                  isActive
                    ? 'text-white bg-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                  isCollapsed ? 'justify-center' : ''
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full"
                    />
                  )}
                  <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-indigo-400" : "")} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={cn("p-4 border-t border-white/5 bg-white/[0.02]", isCollapsed ? "px-2" : "")}>
        <div className={cn("flex items-center", isCollapsed ? "flex-col gap-4" : "justify-between gap-3")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 flex items-center justify-center font-bold text-white shadow-inner overflow-hidden shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL || undefined} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.email?.[0].toUpperCase() || 'U'
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-slate-200 truncate max-w-[120px]">
                  {user?.displayName || 'Pro User'}
                </span>
                <span className="text-xs text-slate-500 truncate max-w-[120px]">{user?.email}</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};
