'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStatusDisplay, getStatusBadgeClass } from '../lib/tournamentStatus';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Navbar from '../components/Navbar';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;
  const [activeTab, setActiveTab] = useState(userRole === 'matchmaker' ? 'casual' : 'users');
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [casualGames, setCasualGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserDiscordId, setNewUserDiscordId] = useState('');
  const [newUserRole, setNewUserRole] = useState('player');
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any)?.role;
      if (!['admin', 'matchmaker'].includes(userRole)) {
        router.push('/');
        return;
      }
      fetchData();
    }
  }, [session, status, activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'users') {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(data.users || []);
      } else if (activeTab === 'sessions') {
        const res = await fetch('/api/sessions');
        const data = await res.json();
        setSessions(data.sessions || []);
      } else if (activeTab === 'tournaments') {
        const res = await fetch('/api/tournaments');
        const data = await res.json();
        setTournaments(data.tournaments || []);
      } else if (activeTab === 'casual') {
        const res = await fetch('/api/casual/games');
        const data = await res.json();
        setCasualGames(data.games || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchData();
        alert('Role updated successfully');
      }
    } catch (error) {
      alert('Error updating role');
    }
  };

  const handleSetMainTournament = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_main: true }),
      });

      if (res.ok) {
        fetchData();
        alert('Main tournament set successfully');
      }
    } catch (error) {
      alert('Error setting main tournament');
    }
  };

  const handleUnsetMainTournament = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_main: false }),
      });

      if (res.ok) {
        fetchData();
        alert('Main tournament unset successfully');
      }
    } catch (error) {
      alert('Error unsetting main tournament');
    }
  };

  const handleChangeStatus = async (tournamentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchData();
      } else {
        alert('Error changing tournament status');
      }
    } catch (error) {
      alert('Error changing tournament status');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          discord_id: newUserDiscordId || undefined,
          role: newUserRole,
        }),
      });

      if (res.ok) {
        setNewUsername('');
        setNewUserDiscordId('');
        setNewUserRole('player');
        setShowCreateUser(false);
        fetchData();
        alert('User created successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      alert('Error creating user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.uuid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editingUser.username,
          discord_id: editingUser.discord_id || '',
          role: editingUser.role,
        }),
      });

      if (res.ok) {
        setEditingUser(null);
        alert('User updated successfully!');
        // Small delay to allow ClickHouse mutation to complete
        setTimeout(() => {
          fetchData();
        }, 500);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update user');
      }
    } catch (error) {
      alert('Error updating user');
    }
  };

  const handleDeleteUser = async (uuid: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${uuid}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('User deleted successfully!');
        setTimeout(() => {
          fetchData();
        }, 500);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      alert('Error deleting user');
    }
  };

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Are you sure you want to delete tournament "${tournamentName}"? This will delete all matches and cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Tournament deleted successfully!');
        setTimeout(() => {
          fetchData();
        }, 500);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete tournament');
      }
    } catch (error) {
      alert('Error deleting tournament');
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-400">Loading...</div>
    </div>;
  }

  if (status !== 'authenticated' || !['admin', 'matchmaker'].includes((session?.user as any)?.role)) {
    return null;
  }

  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">Admin Panel</h1>
          <Link
            href="/"
            className="px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-zinc-300 text-sm sm:text-base transition-colors w-full sm:w-auto text-center"
          >
            ← Back to Home
          </Link>
        </div>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {(isAdmin ? ['users', 'sessions', 'tournaments', 'casual'] : ['tournaments', 'casual']).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setLoading(true);
              }}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-amber-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Users Tab - Admin Only */}
        {isAdmin && activeTab === 'users' && (
          <div>
            {/* Create User Button */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-100">Users</h2>
              <button
                onClick={() => setShowCreateUser(!showCreateUser)}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold  transition-colors"
              >
                {showCreateUser ? 'Cancel' : '+ Create User'}
              </button>
            </div>

            {/* Create User Form */}
            {showCreateUser && (
              <div className="bg-zinc-900/50 border border-zinc-800  p-6 mb-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-4">Create New User</h3>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Username *</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700  text-zinc-100 placeholder-zinc-500"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Discord ID (optional)</label>
                    <input
                      type="text"
                      value={newUserDiscordId}
                      onChange={(e) => setNewUserDiscordId(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700  text-zinc-100 placeholder-zinc-500"
                      placeholder="Leave empty for non-Discord users"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700  text-zinc-300 capitalize"
                    >
                      <option value="player">Player</option>
                      <option value="matchmaker">Matchmaker</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold  transition-colors"
                  >
                    Create User
                  </button>
                </form>
              </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-zinc-900 border border-zinc-800  p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-bold text-zinc-100 mb-4">Edit User</h3>
                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Username *</label>
                      <input
                        type="text"
                        value={editingUser.username}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700  text-zinc-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Discord ID (optional)</label>
                      <input
                        type="text"
                        value={editingUser.discord_id || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, discord_id: e.target.value })}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700  text-zinc-100"
                        placeholder="Leave empty for non-Discord users"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Role</label>
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700  text-zinc-300 capitalize"
                      >
                        <option value="player">Player</option>
                        <option value="matchmaker">Matchmaker</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold  transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-semibold  transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-zinc-400 font-semibold">User</th>
                    <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Discord</th>
                    <th className="text-left px-6 py-4 text-zinc-400 font-semibold">UUID</th>
                    <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Role</th>
                    <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.uuid} className="border-t border-zinc-800">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.discord_avatar && (
                            <img
                              src={user.discord_avatar}
                              alt={user.username}
                              className="w-8 h-8  bg-zinc-700"
                            />
                          )}
                          <span className="text-zinc-300">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.discord_id ? (
                          <span className="text-green-400 text-xs">Linked</span>
                        ) : (
                          <span className="text-zinc-600 text-xs">No Discord</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-sm">{user.uuid.substring(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="px-3 py-1 bg-blue-900/50 hover:bg-blue-900 border border-blue-800 text-blue-300 text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.uuid, user.username)}
                            className="px-3 py-1 bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-300 text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab - Admin Only */}
        {isAdmin && activeTab === 'sessions' && (
          <div className="bg-zinc-900/50 border border-zinc-800  p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-100">Active Sessions</h2>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30  text-sm font-semibold">
                {sessions.length} Online
              </span>
            </div>
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div key={sess.session_id} className="bg-zinc-800/50 border border-zinc-700  p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-zinc-200 font-semibold">{sess.discord_username}</div>
                      <div className="text-sm text-zinc-500">Discord ID: {sess.discord_id}</div>
                      <div className="text-sm text-zinc-500">IP: {sess.ip_address}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-400">Last Ping:</div>
                      <div className="text-sm text-zinc-300">{new Date(sess.last_ping).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center py-8 text-zinc-500">No active sessions</div>
              )}
            </div>
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="bg-zinc-900/50 border border-zinc-800  overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-100">Tournament Management</h2>
              <p className="text-sm text-zinc-400 mt-1">Set which tournament is visible to the public</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[768px]">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Tournament Name</th>
                  <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Status</th>
                  <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Created</th>
                  <th className="text-center px-6 py-4 text-zinc-400 font-semibold">Main Tournament</th>
                  <th className="text-right px-6 py-4 text-zinc-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => (
                  <tr key={tournament.id} className="border-t border-zinc-800">
                    <td className="px-6 py-4 text-zinc-300">{tournament.name}</td>
                    <td className="px-6 py-4">
                      <Select
                        value={tournament.status}
                        onValueChange={(value) => handleChangeStatus(tournament.id, value)}
                      >
                        <SelectTrigger className={`w-fit ${getStatusBadgeClass(tournament.status)} px-2 py-1 h-7 text-xs font-semibold shadow-none`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          <SelectItem value="not_started" className="text-blue-400 focus:text-blue-300 focus:bg-blue-900/30">
                            Not Started
                          </SelectItem>
                          <SelectItem value="in_progress" className="text-amber-400 focus:text-amber-300 focus:bg-amber-900/30">
                            In Progress
                          </SelectItem>
                          <SelectItem value="completed" className="text-green-400 focus:text-green-300 focus:bg-green-900/30">
                            Completed
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{new Date(tournament.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      {tournament.is_main === 1 ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30  text-xs font-semibold">
                          Main
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className="px-3 py-1 bg-blue-900/50 hover:bg-blue-900 border border-blue-800 text-blue-300 text-sm transition-colors"
                        >
                          View
                        </Link>
                        {tournament.is_main === 1 ? (
                          <button
                            onClick={() => handleUnsetMainTournament(tournament.id)}
                            className="px-3 py-1 bg-amber-900/50 hover:bg-amber-900 border border-amber-800 text-amber-300 text-sm transition-colors"
                          >
                            Unset Main
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSetMainTournament(tournament.id)}
                            className="px-3 py-1 bg-green-900/50 hover:bg-green-900 border border-green-800 text-green-300 text-sm transition-colors"
                          >
                            Set as Main
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                          className="px-3 py-1 bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-300 text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {tournaments.length === 0 && (
              <div className="text-center py-8 text-zinc-500">No tournaments found</div>
            )}
          </div>
        )}

        {/* Casual Games Tab */}
        {activeTab === 'casual' && (
          <div className="bg-zinc-900/50 border border-zinc-800  overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Casual Games Management</h2>
                <p className="text-sm text-zinc-400 mt-1">Manage all casual games and their signups</p>
              </div>
              <Link
                href="/casual"
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white  transition-colors"
              >
                + Create Game
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[768px]">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Game Name</th>
                  <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Status</th>
                  <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Signups</th>
                  <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Created By</th>
                  <th className="text-left px-6 py-4 text-zinc-400 font-semibold">Created</th>
                  <th className="text-right px-6 py-4 text-zinc-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {casualGames.map((game) => (
                  <tr key={game.id} className="border-t border-zinc-800">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-zinc-300 font-medium">{game.name}</div>
                        {game.description && (
                          <div className="text-xs text-zinc-500 mt-1">{game.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1  text-xs font-semibold ${
                        game.status === 'open'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : game.status === 'in_progress'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {game.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      <div className="flex flex-col gap-1">
                        <span>{game.signups?.length || 0} total</span>
                        <span className="text-xs text-green-400">
                          {game.signups?.filter((s: any) => s.status === 'approved').length || 0} approved
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{game.created_by_name}</td>
                    <td className="px-6 py-4 text-zinc-400">{new Date(game.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/casual/${game.id}`}
                          className="px-3 py-1 bg-blue-900/50 hover:bg-blue-900 border border-blue-800 text-blue-300 text-sm transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {casualGames.length === 0 && (
              <div className="text-center py-8 text-zinc-500">No casual games found</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
