import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { User, Bell, Shield, Database, Cloud, AlertCircle, CheckCircle2, Loader2, CreditCard, Sparkles, KeyRound } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { auth, db } from '../../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export const Settings = () => {
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'integrations', label: 'Integrations', icon: Cloud },
    { id: 'billing', label: 'Billing & Premium', icon: CreditCard },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleSaveProfile = async () => {
    if (!auth.currentUser || !user) return;
    
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL
      });

      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        displayName,
        photoURL,
        updatedAt: serverTimestamp()
      });

      setUser({
        ...user,
        displayName,
        photoURL
      });

      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">Settings</h1>
        <p className="text-slate-400">Manage your account, preferences, and platform integrations.</p>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row items-start">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-1.5 p-2 bg-[#111827]/40 border border-white/5 rounded-[20px] backdrop-blur-xl">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-500/10 text-indigo-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500'}`} /> 
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 w-full space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }} 
                animate={{ opacity: 1, y: 0, height: 'auto' }} 
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-[16px] flex items-center gap-3 shadow-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm font-medium text-red-400">{error}</p>
              </motion.div>
            )}
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }} 
                animate={{ opacity: 1, y: 0, height: 'auto' }} 
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[16px] flex items-center gap-3 shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-sm font-medium text-emerald-400">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'account' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl overflow-hidden shadow-xl"
            >
              <div className="p-6 md:p-8 border-b border-white/5">
                <h2 className="text-xl font-display font-semibold text-white">Profile Information</h2>
                <p className="text-sm text-slate-400 mt-1">Update your photo and personal details.</p>
              </div>
              
              <div className="p-6 md:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-display font-bold text-white shadow-xl shadow-indigo-500/20 border-2 border-[#09090B] overflow-hidden shrink-0">
                    {photoURL ? (
                      <img src={photoURL || undefined} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="space-y-2 w-full max-w-md">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Avatar URL</label>
                    <input 
                      type="text"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      placeholder="https://example.com/avatar.jpg" 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Display Name</label>
                    <input 
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your Name" 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
                    <input 
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#111827]/40 border border-white/5 rounded-[24px] backdrop-blur-xl overflow-hidden shadow-xl"
            >
              <div className="p-6 md:p-8 border-b border-white/5">
                <h2 className="text-xl font-display font-semibold text-white">API Keys & Integrations</h2>
                <p className="text-sm text-slate-400 mt-1">Manage connection credentials for external services.</p>
              </div>
              
              <div className="p-6 md:p-8 space-y-8">
                <div className="group relative overflow-hidden rounded-[16px] border border-white/5 bg-black/20 p-6 transition-colors hover:bg-black/40">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                      <KeyRound className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-semibold text-slate-200">OpenAI API Key</h3>
                        <p className="text-xs text-slate-500 mt-1">Used for Genblaze workflow reasoning and prompt enhancement.</p>
                      </div>
                      <div className="flex gap-3">
                        <input type="password" value="sk-................................" readOnly className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
                        <button disabled className="px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-medium cursor-not-allowed">Configured</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-[16px] border border-white/5 bg-black/20 p-6 transition-colors hover:bg-black/40">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                      <Database className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-semibold text-slate-200">Backblaze B2 Application Key</h3>
                        <p className="text-xs text-slate-500 mt-1">Used for secure cloud storage of generated assets.</p>
                      </div>
                      <div className="flex gap-3">
                        <input type="password" value="................................" readOnly className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
                        <button disabled className="px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-medium cursor-not-allowed">Configured</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Placeholders for other tabs */}
          {['billing', 'storage', 'notifications', 'security'].includes(activeTab) && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center justify-center py-32 bg-[#111827]/20 border border-white/5 rounded-[24px] backdrop-blur-xl text-slate-400"
            >
              <Sparkles className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-xl font-display font-medium text-slate-300 capitalize">{activeTab} Settings</p>
              <p className="text-sm mt-1 text-slate-500">This section is being redesigned for the new Pro experience.</p>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};
