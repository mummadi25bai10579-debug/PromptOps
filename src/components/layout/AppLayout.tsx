import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/useAuthStore';
import { Bell, Search, Menu, Wand2, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

export const AppLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#09090B] text-slate-200 font-sans overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-900/10 blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-900/10 blur-[120px] mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-purple-900/10 blur-[120px] mix-blend-screen"></div>
      </div>

      <Sidebar className="hidden md:flex" />

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex md:hidden"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-72 h-full bg-[#09090B] shadow-2xl z-50 border-r border-white/5"
            >
              <button className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
              <Sidebar mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col z-10 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-[#09090B]/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold tracking-tight text-white">PromptOps</span>
            </div>
            
            <div className="hidden md:flex items-center group bg-[#111827]/60 border border-white/5 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 rounded-full px-4 py-2 w-96 transition-all duration-300">
              <Search className="w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 mr-2 shrink-0 transition-colors" />
              <input type="text" placeholder="Search assets, prompts, or workflows... (Cmd+K)" className="bg-transparent border-none text-sm outline-none w-full text-slate-200 placeholder:text-slate-500 font-medium" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-5">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold hover:bg-indigo-500/20 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Upgrade to Pro</span>
            </motion.button>
            
            <button className="md:hidden p-2 text-slate-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors relative group cursor-pointer">
              <Bell className="w-5 h-5 group-hover:animate-swing" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#09090B]"></span>
            </button>
            
            <div className="flex items-center gap-3 md:border-l md:border-white/10 md:pl-5 pl-2">
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0 cursor-pointer shadow-lg shadow-indigo-500/20 border border-white/10"
               >
                 {user?.photoURL ? <img src={user.photoURL || undefined} alt="Avatar" className="w-full h-full object-cover" /> : (user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U')}
               </motion.div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth" id="scroll-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto w-full min-h-full flex flex-col gap-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
