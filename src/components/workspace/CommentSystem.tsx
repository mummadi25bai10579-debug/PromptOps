import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  CornerDownRight,
  Edit2,
  Trash2,
  AtSign,
  Check,
  X,
  Sparkles,
  Loader2,
  User,
  Image as ImageIcon
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useGenerations } from '../../hooks/useGenerations';
import { workspaceService } from '../../services/workspaceService';
import { Comment } from '../../types/workspace';
import { cn } from '../../utils/cn';

export const CommentSystem: React.FC = () => {
  const { user } = useAuthStore();
  const { currentWorkspace, members, permissions, searchQuery } = useWorkspaceStore();
  const { generations } = useGenerations();

  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(generations[0]?.id || '');
  const [content, setContent] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Mention autocomplete state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  // Subscribe to comments
  useEffect(() => {
    if (!currentWorkspace) return;
    const unsub = workspaceService.subscribeToWorkspaceComments(currentWorkspace.id, setComments);
    return () => unsub();
  }, [currentWorkspace]);

  const selectedAsset = generations.find((g) => g.id === selectedAssetId) || generations[0];

  // Filter comments for selected asset or search
  const filteredComments = comments.filter((c) => {
    const matchesAsset = !selectedAssetId || c.assetId === selectedAssetId;
    const matchesQuery =
      !searchQuery ||
      c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAsset && matchesQuery;
  });

  const rootComments = filteredComments.filter((c) => !c.parentId);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const lastWord = val.split(/\s+/).pop();
    if (lastWord && lastWord.startsWith('@')) {
      setShowMentionMenu(true);
      setMentionQuery(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleSelectMention = (memberEmail: string) => {
    const words = content.split(/\s+/);
    words.pop();
    setContent([...words, `@${memberEmail} `].join(' '));
    setShowMentionMenu(false);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !user || !content.trim()) return;

    setLoading(true);
    try {
      await workspaceService.addComment(
        currentWorkspace.id,
        selectedAssetId || 'general',
        selectedAsset?.prompt || 'Workspace Asset',
        content.trim(),
        {
          id: user.id,
          name: user.displayName || user.email || 'User',
          email: user.email || '',
          avatar: user.photoURL || '',
        },
        replyParentId
      );
      setContent('');
      setReplyParentId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await workspaceService.editComment(commentId, editContent.trim());
      setEditingCommentId(null);
      setEditContent('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await workspaceService.deleteComment(commentId);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const matchingMembers = members.filter(
    (m) =>
      m.email.toLowerCase().includes(mentionQuery) ||
      (m.displayName && m.displayName.toLowerCase().includes(mentionQuery))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Asset Selection Sidebar */}
      <div className="bg-[#09090B]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-indigo-400" /> Select Asset to Discuss
        </h3>

        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
          {generations.map((gen) => (
            <button
              key={gen.id}
              onClick={() => setSelectedAssetId(gen.id)}
              className={cn(
                'w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer',
                selectedAssetId === gen.id
                  ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                  : 'bg-white/5 border-white/5 hover:border-white/20'
              )}
            >
              <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden shrink-0 flex items-center justify-center">
                {gen.type === 'image' && (gen.resultUrl || gen.fileUrl || gen.b2Url) ? (
                  <img src={gen.resultUrl || gen.fileUrl || gen.b2Url || undefined} alt={gen.prompt} className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase block">{gen.model}</span>
                <p className="text-xs text-slate-200 line-clamp-1 font-medium">{gen.prompt}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Discussion & Comment Thread */}
      <div className="lg:col-span-2 bg-[#09090B]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 flex flex-col justify-between min-h-[500px]">
        <div>
          {/* Active Asset Info Bar */}
          {selectedAsset && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-black/40 overflow-hidden shrink-0 flex items-center justify-center border border-white/10">
                {selectedAsset.type === 'image' && (selectedAsset.resultUrl || selectedAsset.fileUrl || selectedAsset.b2Url) ? (
                  <img src={selectedAsset.resultUrl || selectedAsset.fileUrl || selectedAsset.b2Url || undefined} alt={selectedAsset.prompt} className="w-full h-full object-cover" />
                ) : (
                  <MessageSquare className="w-6 h-6 text-indigo-400" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Discussing Asset • {selectedAsset.model}
                </span>
                <h4 className="text-sm font-semibold text-white line-clamp-2">{selectedAsset.prompt}</h4>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {rootComments.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No comments yet. Start the conversation!</p>
              </div>
            ) : (
              rootComments.map((comment) => {
                const replies = filteredComments.filter((c) => c.parentId === comment.id);

                return (
                  <div key={comment.id} className="space-y-3">
                    {/* Main Comment */}
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                            {comment.authorAvatar ? (
                              <img src={comment.authorAvatar || undefined} alt={comment.authorName} className="w-full h-full object-cover" />
                            ) : (
                              comment.authorName[0].toUpperCase()
                            )}
                          </div>
                          <span className="text-xs font-bold text-white">{comment.authorName}</span>
                          <span className="text-[10px] text-slate-500">{formatDate(comment.createdAt)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setReplyParentId(comment.id);
                              setContent(`@${comment.authorEmail} `);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors cursor-pointer"
                            title="Reply"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                          </button>
                          {comment.authorId === user?.id && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditContent(comment.content);
                                }}
                                className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-xs font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">{comment.content}</p>
                      )}
                    </div>

                    {/* Replies */}
                    {replies.map((reply) => (
                      <div key={reply.id} className="ml-6 p-3 bg-white/[0.02] border-l-2 border-indigo-500/50 rounded-r-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-300">{reply.authorName}</span>
                            <span className="text-[10px] text-slate-500">{formatDate(reply.createdAt)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Comment Input Box with Mention Support */}
        <div className="relative pt-4 border-t border-white/5">
          {/* Mention Autocomplete Dropdown */}
          {showMentionMenu && matchingMembers.length > 0 && (
            <div className="absolute bottom-full mb-2 left-0 w-64 bg-[#18181D] border border-white/10 rounded-xl shadow-2xl p-1 z-30 max-h-40 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Mention Team Member
              </div>
              {matchingMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMention(m.email)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-white/5 hover:text-white rounded-lg flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold">{m.displayName || m.email}</span>
                  <span className="text-[10px] text-slate-500">{m.email}</span>
                </button>
              ))}
            </div>
          )}

          {replyParentId && (
            <div className="flex items-center justify-between mb-2 px-3 py-1 bg-indigo-500/10 rounded-lg text-xs text-indigo-300 border border-indigo-500/20">
              <span>Replying to comment thread...</span>
              <button onClick={() => setReplyParentId(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handlePostComment} className="flex gap-3">
            <textarea
              rows={2}
              value={content}
              onChange={handleTextChange}
              placeholder="Write a comment... (Type @ to mention team members)"
              className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
            />
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
