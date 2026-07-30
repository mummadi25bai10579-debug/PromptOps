import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Key, Activity, BookOpen, Webhook, 
  Copy, CheckCircle2, Plus, Trash2, RefreshCw,
  Code2, Zap, Server, Shield, FileJson, 
  BarChart3, Clock, AlertCircle, ChevronRight, Play, Loader2
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

export const DeveloperPortal = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'keys' | 'usage' | 'webhooks' | 'docs'>('keys');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    async function fetchDevData() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch API Keys
        const keysSnap = await getDocs(query(collection(db, 'api_keys'), where('userId', '==', user.id)));
        setApiKeys(keysSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch Webhooks
        const webhooksSnap = await getDocs(query(collection(db, 'webhooks'), where('userId', '==', user.id)));
        setWebhooks(webhooksSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch Recent Search/API logs
        const logsSnap = await getDocs(query(collection(db, 'searchAnalytics'), where('userId', '==', user.id)));
        setLogs(logsSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            time: data.timestamp?.seconds ? new Date(data.timestamp.seconds * 1000).toLocaleTimeString() : 'Just now',
            method: 'POST',
            path: '/v1/generations/execute',
            status: 200,
            latency: '240ms'
          };
        }));
      } catch (err) {
        console.error("Error fetching developer portal data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDevData();
  }, [user]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !user) return;
    setCreatingKey(true);
    try {
      const prefix = `pk_live_${Math.random().toString(36).substring(2, 8)}...`;
      const keyObj = {
        name: newKeyName,
        prefix,
        userId: user.id,
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Just now',
        status: 'active',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'api_keys'), keyObj);
      setApiKeys([{ id: docRef.id, ...keyObj }, ...apiKeys]);
      setNewKeyName('');
      setShowKeyModal(false);
    } catch (err) {
      console.error("Failed to create key:", err);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await updateDoc(doc(db, 'api_keys', keyId), { status: 'revoked' });
      setApiKeys(apiKeys.map(k => k.id === keyId ? { ...k, status: 'revoked' } : k));
    } catch (err) {
      console.error("Failed to revoke key:", err);
    }
  };

  const handleCopy = (id: string, prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <Terminal className="w-8 h-8 text-indigo-400" />
            Developer Platform
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">Integrate PromptOps AI into your own applications with our robust API, SDKs, and Webhooks.</p>
        </div>
        <div className="flex bg-[#09090B] border border-white/10 rounded-xl p-1 overflow-x-auto no-scrollbar w-full md:w-auto">
          {[
            { id: 'keys', label: 'API Keys', icon: Key },
            { id: 'usage', label: 'Usage & Logs', icon: Activity },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'docs', label: 'Documentation', icon: BookOpen }
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
        
        {activeTab === 'keys' && (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">API Keys</h2>
                <p className="text-slate-400 text-sm">Manage your API keys for authenticating requests to PromptOps AI.</p>
              </div>
              <button 
                onClick={() => setShowKeyModal(true)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg"
              >
                <Plus className="w-4 h-4" /> Create New Key
              </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-400 mb-1">Keep your keys secure</div>
                <div className="text-xs text-amber-400/80 leading-relaxed">Your API keys carry many privileges, so be sure to keep them secure. Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.</div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48 text-indigo-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">Loading API keys...</span>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="bg-black/40 border border-white/5 rounded-2xl p-8 text-center text-slate-500">
                <Key className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No API keys generated yet.</p>
                <button onClick={() => setShowKeyModal(true)} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
                  Create Key
                </button>
              </div>
            ) : (
              <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Key</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Used</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {apiKeys.map(key => (
                      <tr key={key.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{key.name}</span>
                            {key.status === 'revoked' && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase font-semibold">Revoked</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{key.prefix}</code>
                            {key.status !== 'revoked' && (
                              <button 
                                onClick={() => handleCopy(key.id, key.prefix)}
                                className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                              >
                                {copiedKey === key.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{key.created}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{key.lastUsed}</td>
                        <td className="px-6 py-4 text-right">
                          {key.status !== 'revoked' && (
                            <button 
                              onClick={() => handleRevokeKey(key.id)}
                              className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors" 
                              title="Revoke Key"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">API Usage & Logs</h2>
                <p className="text-slate-400 text-sm">Monitor your API traffic, view request logs, and track activity.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <Clock className="w-3.5 h-3.5" /> Recent Requests
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
               <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-sm text-slate-400 mb-2">Total Logged Requests</div>
                <div className="text-3xl font-bold text-white mb-1">{logs.length}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-sm text-slate-400 mb-2">Error Rate</div>
                <div className="text-3xl font-bold text-white mb-1">0%</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-sm text-slate-400 mb-2">Avg Latency</div>
                <div className="text-3xl font-bold text-white mb-1">240ms</div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-4">Recent Request Logs</h3>
            {logs.length === 0 ? (
              <div className="bg-black/40 border border-white/5 rounded-2xl p-8 text-center text-slate-500">
                No recent API requests logged.
              </div>
            ) : (
              <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Endpoint</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((log, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-400 font-mono">{log.time}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">
                            {log.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-300">{log.path}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-400 text-right">{log.latency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Webhooks</h2>
                <p className="text-slate-400 text-sm">Configure webhooks to receive real-time HTTP notifications for events in your account.</p>
              </div>
            </div>

            {webhooks.length === 0 ? (
              <div className="bg-black/40 border border-white/5 rounded-2xl p-8 text-center text-slate-500">
                <Webhook className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No webhook endpoints configured.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map(webhook => (
                  <div key={webhook.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 flex items-start justify-between group hover:border-white/10 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white font-mono">{webhook.url}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-emerald-500/20 text-emerald-400">
                          active
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal for creating key */}
        {showKeyModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Create API Key</h2>
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase block mb-1">Key Identifier / Name</label>
                  <input 
                    type="text" 
                    value={newKeyName} 
                    onChange={e => setNewKeyName(e.target.value)} 
                    placeholder="e.g. Production Backend Service" 
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => setShowKeyModal(false)} 
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={creatingKey} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                  >
                    {creatingKey && <Loader2 className="w-4 h-4 animate-spin" />}
                    Generate Key
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex h-full">
              {/* Docs Sidebar */}
              <div className="w-64 border-r border-white/10 bg-black/20 p-4 overflow-y-auto custom-scrollbar shrink-0">
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Getting Started</div>
                    <div className="space-y-1">
                      <button className="w-full text-left px-3 py-1.5 text-sm text-indigo-400 font-medium bg-indigo-500/10 rounded-lg">Introduction</button>
                      <button className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg">Authentication</button>
                      <button className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg">SDKs & Libraries</button>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">API Reference</div>
                    <div className="space-y-1">
                      <button className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg">Text Generation</button>
                      <button className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg">Image Generation</button>
                      <button className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg">AI Agents</button>
                      <button className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg">Workflows</button>
                      <button className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg">Assets</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Docs Content */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <Code2 className="w-5 h-5" />
                    <span className="font-semibold">PromptOps API v1</span>
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">Introduction</h2>
                  <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                    The PromptOps API is organized around REST. Our API has predictable resource-oriented URLs, accepts form-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
                  </p>

                  <h3 className="text-2xl font-bold text-white mb-4">Authentication</h3>
                  <p className="text-slate-300 mb-4 leading-relaxed">
                    The PromptOps API uses API keys to authenticate requests. You can view and manage your API keys in the Dashboard.
                  </p>
                  <p className="text-slate-300 mb-6 leading-relaxed">
                    Authentication to the API is performed via HTTP Bearer Auth. Provide your API key as the bearer token value.
                  </p>

                  <div className="bg-[#09090B] border border-white/10 rounded-xl p-4 mb-8 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                      <span className="ml-4 text-xs text-slate-400 font-mono">cURL request</span>
                    </div>
                    <pre className="pt-12 text-sm font-mono text-slate-300 overflow-x-auto">
                      <code>
{`curl https://api.promptops.ai/v1/generations/text \\
  -H "Authorization: Bearer pk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Write a compelling product description...",
    "model": "gemini-2.5-pro"
  }'`}
                      </code>
                    </pre>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4">Official SDKs</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <FileJson className="w-6 h-6 text-yellow-400" />
                        <h4 className="font-bold text-white">Node.js / TypeScript</h4>
                      </div>
                      <p className="text-sm text-slate-400">npm install @promptops/sdk</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors cursor-pointer">
                       <div className="flex items-center gap-3 mb-2">
                        <FileJson className="w-6 h-6 text-blue-400" />
                        <h4 className="font-bold text-white">Python</h4>
                      </div>
                      <p className="text-sm text-slate-400">pip install promptops-ai</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
