import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Shield,
  Mail,
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  Trash2,
  ShieldAlert,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { workspaceService } from '../../services/workspaceService';
import { WorkspaceMember, WorkspaceRole } from '../../types/workspace';
import { cn } from '../../utils/cn';

export const TeamManagement: React.FC = () => {
  const { user } = useAuthStore();
  const { currentWorkspace, members, userRole, permissions, searchQuery } = useWorkspaceStore();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [roleDropdownId, setRoleDropdownId] = useState<string | null>(null);

  // Filter members by search query
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.email.toLowerCase().includes(q) ||
      (m.displayName && m.displayName.toLowerCase().includes(q)) ||
      m.role.toLowerCase().includes(q)
    );
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !user || !inviteEmail.trim()) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await workspaceService.inviteMemberByEmail(
        currentWorkspace.id,
        currentWorkspace.name,
        inviteEmail.trim().toLowerCase(),
        inviteRole,
        {
          id: user.id,
          name: user.displayName || user.email || 'User',
          email: user.email || '',
          avatar: user.photoURL || '',
        }
      );
      setSuccessMsg(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => {
        setInviteModalOpen(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (member: WorkspaceMember, newRole: WorkspaceRole) => {
    if (!currentWorkspace || !user) return;
    setRoleDropdownId(null);
    try {
      await workspaceService.updateMemberRole(
        currentWorkspace.id,
        member.id,
        member.email,
        newRole,
        {
          id: user.id,
          name: user.displayName || user.email || 'User',
          email: user.email || '',
        }
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (member: WorkspaceMember) => {
    if (!currentWorkspace || !user) return;
    if (member.role === 'owner') {
      alert('Workspace owner cannot be removed.');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${member.displayName || member.email} from this workspace?`)) {
      return;
    }
    try {
      await workspaceService.removeMember(currentWorkspace.id, member.id, member.email, {
        id: user.id,
        name: user.displayName || user.email || 'User',
        email: user.email || '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  const getRoleBadge = (role: WorkspaceRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'admin':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'editor':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'viewer':
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-[#09090B]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            Workspace Members
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {members.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your team, invite collaborators, and assign access permissions.
          </p>
        </div>

        {permissions.canManageMembers && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
      </div>

      {/* Role Explanations Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { role: 'Owner', desc: 'Full control over workspace, billing, & settings', color: 'border-purple-500/30 bg-purple-500/5' },
          { role: 'Admin', desc: 'Manage team members, roles, & shared assets', color: 'border-indigo-500/30 bg-indigo-500/5' },
          { role: 'Editor', desc: 'Generate AI content, edit prompts, & comment', color: 'border-emerald-500/30 bg-emerald-500/5' },
          { role: 'Viewer', desc: 'Read-only access to assets, prompts, & analytics', color: 'border-slate-500/30 bg-slate-500/5' },
        ].map((r) => (
          <div key={r.role} className={cn('p-3.5 rounded-xl border', r.color)}>
            <span className="text-xs font-bold text-white uppercase tracking-wider block mb-1">{r.role}</span>
            <span className="text-[11px] text-slate-400 leading-relaxed block">{r.desc}</span>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="bg-[#09090B]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white/[0.02]">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Last Active</th>
                {permissions.canManageMembers && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No members found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm overflow-hidden shrink-0 shadow-inner">
                          {member.photoURL ? (
                            <img src={member.photoURL || undefined} alt={member.displayName} className="w-full h-full object-cover" />
                          ) : (
                            (member.displayName || member.email)[0].toUpperCase()
                          )}
                          <span
                            className={cn(
                              'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#09090B]',
                              member.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                            )}
                          />
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-semibold text-white block truncate">
                            {member.displayName || member.email.split('@')[0]}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge & Picker */}
                    <td className="px-6 py-4 relative">
                      {permissions.canManageMembers && member.role !== 'owner' ? (
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setRoleDropdownId(roleDropdownId === member.id ? null : member.id)
                            }
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-colors cursor-pointer',
                              getRoleBadge(member.role)
                            )}
                          >
                            {member.role}
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>

                          {roleDropdownId === member.id && (
                            <div className="absolute left-0 top-full mt-1 w-36 bg-[#18181D] border border-white/10 rounded-xl shadow-2xl z-30 p-1">
                              {(['admin', 'editor', 'viewer'] as WorkspaceRole[]).map((r) => (
                                <button
                                  key={r}
                                  onClick={() => handleRoleChange(member, r)}
                                  className={cn(
                                    'w-full text-left px-3 py-2 text-xs font-semibold rounded-lg uppercase tracking-wider transition-colors cursor-pointer',
                                    member.role === r
                                      ? 'bg-indigo-500/20 text-indigo-300'
                                      : 'text-slate-300 hover:bg-white/5'
                                  )}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border inline-block',
                            getRoleBadge(member.role)
                          )}
                        >
                          {member.role}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        {member.status === 'online' ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-400">Online</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            <span className="text-slate-500">Offline</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(member.joinedAt)}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(member.lastActive)}
                      </span>
                    </td>

                    {/* Actions */}
                    {permissions.canManageMembers && (
                      <td className="px-6 py-4 text-right">
                        {member.role !== 'owner' && member.userId !== user?.id && (
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121216] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setInviteModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white tracking-tight">Invite Team Member</h3>
                  <p className="text-xs text-slate-400">Send an invitation link to collaborate on this workspace.</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    User Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assign Role *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['admin', 'editor', 'viewer'] as WorkspaceRole[]).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={cn(
                          'p-3 border rounded-xl text-center transition-all cursor-pointer',
                          inviteRole === r
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        )}
                      >
                        <span className="text-xs uppercase block">{r}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
