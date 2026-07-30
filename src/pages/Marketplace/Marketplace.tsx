import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Star, Download, Heart, Users, TrendingUp, 
  Search, Filter, Plus, FileText, Image as ImageIcon, Video,
  Bot, Settings, BarChart3, ChevronRight, MessageSquare, Bookmark,
  Loader2
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

export const Marketplace = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'discover' | 'community' | 'dashboard'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [items, setItems] = useState<any[]>([]);
  const [userPublishedItems, setUserPublishedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Prompt');
  const [newPrice, setNewPrice] = useState('Free');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const categories = ['All', 'Prompts', 'Workflows', 'Agents', 'Blueprints', 'Images', 'Videos'];

  useEffect(() => {
    async function fetchMarketplaceItems() {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'marketplace'));
        const list = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setItems(list);

        if (user) {
          const userItems = list.filter((i: any) => i.userId === user.id);
          setUserPublishedItems(userItems);
        }
      } catch (err) {
        console.error("Error fetching marketplace items:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarketplaceItems();
  }, [user]);

  const handlePublishAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    setPublishing(true);
    try {
      const newItem = {
        title: newTitle,
        type: newType,
        author: user.displayName || user.email || 'Anonymous',
        userId: user.id,
        rating: 5.0,
        reviews: 0,
        downloads: 0,
        likes: 0,
        price: newPrice,
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'marketplace'), newItem);
      const created = { id: docRef.id, ...newItem };
      setItems([created, ...items]);
      setUserPublishedItems([created, ...userPublishedItems]);
      setNewTitle('');
      setShowPublishModal(false);
    } catch (err) {
      console.error("Failed to publish item:", err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-indigo-400" />
            AI Marketplace
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">Discover, share, and monetize top-tier prompts, workflows, and AI agents created by the community.</p>
        </div>
        <div className="flex bg-[#09090B] border border-white/10 rounded-xl p-1 overflow-x-auto no-scrollbar w-full md:w-auto">
          {[
            { id: 'discover', label: 'Discover', icon: Search },
            { id: 'community', label: 'Community', icon: Users },
            { id: 'dashboard', label: 'Creator Dashboard', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 bg-[#111827]/40 border border-white/5 rounded-[24px] shadow-xl overflow-hidden backdrop-blur-md relative flex flex-col min-h-0">
        
        {activeTab === 'discover' && (
          <div className="flex flex-col h-full">
            {/* Search & Filters */}
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search prompts, workflows, agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#09090B] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                      selectedCategory === cat 
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20" 
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center h-64 text-indigo-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Loading marketplace assets...</span>
                </div>
              ) : items.filter(item => 
                (selectedCategory === 'All' || item.type === selectedCategory) &&
                (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.author?.toLowerCase().includes(searchQuery.toLowerCase()))
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No marketplace assets found.</p>
                  <p className="text-xs text-slate-600 mt-1">Be the first to publish a prompt, agent, or workflow to the community!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.filter(item => 
                    (selectedCategory === 'All' || item.type === selectedCategory) &&
                    (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || item.author?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map(item => (
                    <div key={item.id} className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all group flex flex-col">
                      <div className="h-40 overflow-hidden relative bg-slate-900">
                        {item.image ? (
                          <img src={item.image || undefined} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700">No Image</div>
                        )}
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white border border-white/10">
                          {item.price || 'Free'}
                        </div>
                        <div className="absolute top-3 left-3 bg-indigo-500/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
                          {item.type || 'Asset'}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{item.title}</h3>
                        <div className="text-sm text-slate-400 mb-3">by {item.author || 'Anonymous'}</div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-300 mt-auto">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-semibold text-white">{item.rating || 5.0}</span>
                            <span className="text-slate-500">({item.reviews || 0})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{item.downloads || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 ml-auto">
                            <Heart className="w-3.5 h-3.5 text-pink-400" />
                            <span>{item.likes || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-8">
            <section className="flex-1">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Community Marketplace Hub
              </h2>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-8 text-center text-slate-400">
                <p className="text-sm mb-2">Connect with creators and browse published community templates.</p>
                <button onClick={() => setActiveTab('discover')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors">
                  Explore Discover Section
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Creator Dashboard</h2>
                <p className="text-slate-400 text-sm">Track your earnings, views, and published assets.</p>
              </div>
              <button 
                onClick={() => setShowPublishModal(true)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg"
              >
                <Plus className="w-4 h-4" /> Publish New Asset
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                <TrendingUp className="w-24 h-24 text-emerald-500/10 absolute -bottom-4 -right-4" />
                <div className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">Total Revenue</div>
                <div className="text-4xl font-bold text-white mb-1">$0.00</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Download className="w-4 h-4 text-indigo-400" /> Downloads</div>
                <div className="text-3xl font-bold text-white mb-1">{userPublishedItems.reduce((acc, i) => acc + (i.downloads || 0), 0)}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-purple-400" /> Published Items</div>
                <div className="text-3xl font-bold text-white mb-1">{userPublishedItems.length}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Rating</div>
                <div className="text-3xl font-bold text-white mb-1">{userPublishedItems.length > 0 ? '5.0' : 'N/A'}</div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-4">Your Published Assets</h3>
            {userPublishedItems.length === 0 ? (
              <div className="bg-black/40 border border-white/5 rounded-2xl p-8 text-center text-slate-500">
                You haven't published any assets yet.
              </div>
            ) : (
              <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Downloads</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {userPublishedItems.map(item => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{item.title}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">{item.type}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{item.downloads || 0}</td>
                        <td className="px-6 py-4 text-sm text-emerald-400 font-semibold">{item.price || 'Free'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* Publish Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Publish Asset to Marketplace</h2>
              <form onSubmit={handlePublishAsset} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Asset Title</label>
                  <input 
                    type="text" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    placeholder="e.g. SEO Content Generator" 
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Category / Type</label>
                  <select 
                    value={newType} 
                    onChange={e => setNewType(e.target.value)}
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Prompt">Prompt</option>
                    <option value="Workflow">Workflow</option>
                    <option value="Agent">Agent</option>
                    <option value="Blueprint">Blueprint</option>
                    <option value="Image">Image</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Price</label>
                  <select 
                    value={newPrice} 
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Free">Free</option>
                    <option value="$2.99">$2.99</option>
                    <option value="$5.00">$5.00</option>
                    <option value="$9.99">$9.99</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => setShowPublishModal(false)} 
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={publishing} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                  >
                    {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Publish Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
