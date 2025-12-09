'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NationSelector from '@/app/components/NationSelector';
import FlagIcon from '@/app/components/FlagIcon';
import { Users, UserPlus, ArrowLeft, Check, X, Edit, Trash2, Download, CheckCheck, XCircle, UserCheck, Calendar } from 'lucide-react';
import { formatNationName } from '@/app/lib/formatNation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RichTextEditor from '@/app/components/RichTextEditor';
import RichTextViewer from '@/app/components/RichTextViewer';
import { toast } from 'sonner';

interface CasualGame {
  id: string;
  name: string;
  description: string;
  rules: string;
  modpack_url: string;
  status: string;
  created_by_uuid: string;
  created_by_name: string;
  max_players: number;
  scheduled_time: string;
  created_at: string;
}

interface Signup {
  id: string;
  game_id: string;
  user_uuid: string;
  username: string;
  discord_username: string;
  discord_avatar: string;
  preferred_nation: string;
  is_coop: number;
  status: string;
  created_at: string;
}

export default function CasualGamePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [game, setGame] = useState<CasualGame | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedNation, setSelectedNation] = useState('GER');
  const [selectedIdeology, setSelectedIdeology] = useState<'communism' | 'democratic' | 'fascism' | 'neutrality' | undefined>();
  const [isCoop, setIsCoop] = useState(false);
  const [userSignup, setUserSignup] = useState<Signup | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editScheduledTime, setEditScheduledTime] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editModpackUrl, setEditModpackUrl] = useState('');
  const [selectedSignups, setSelectedSignups] = useState<string[]>([]);
  const [showEditNationModal, setShowEditNationModal] = useState(false);
  const [editingSignup, setEditingSignup] = useState<Signup | null>(null);
  const [editNation, setEditNation] = useState('GER');
  const [editIdeology, setEditIdeology] = useState<'communism' | 'democratic' | 'fascism' | 'neutrality' | undefined>();
  const [editIsCoop, setEditIsCoop] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [addPlayerUsername, setAddPlayerUsername] = useState('');
  const [addPlayerNation, setAddPlayerNation] = useState('GER');
  const [addPlayerIdeology, setAddPlayerIdeology] = useState<'communism' | 'democratic' | 'fascism' | 'neutrality' | undefined>();
  const [addPlayerIsCoop, setAddPlayerIsCoop] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ username: string; discord_username: string; discord_avatar: string }>>([]);
  const [filteredUsers, setFilteredUsers] = useState<Array<{ username: string; discord_username: string; discord_avatar: string }>>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showModpackModal, setShowModpackModal] = useState(false);
  const [modpackData, setModpackData] = useState<{
    title: string;
    createdBy: string;
    createdDate: string;
    updatedDate: string;
    previewUrl: string;
  } | null>(null);
  const [loadingModpack, setLoadingModpack] = useState(false);

  // In client components, params is not a Promise, so we can use it directly
  const gameId = params.id as string;
  const isMatchmaker = session && ['admin', 'matchmaker'].includes((session.user as any)?.role);

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'open':
        return 'Open';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [gameId, session]);

  useEffect(() => {
    if (isMatchmaker) {
      fetchUsers();
    }
  }, [isMatchmaker]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setAvailableUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchGame(), fetchSignups()]);
  };

  const fetchGame = async () => {
    try {
      const response = await fetch('/api/casual/games');
      const data = await response.json();
      const foundGame = data.games?.find((g: CasualGame) => g.id === gameId);
      setGame(foundGame || null);
    } catch (error) {
      console.error('Error fetching game:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignups = async () => {
    try {
      const response = await fetch(`/api/casual/games/${gameId}/signups`);
      const data = await response.json();
      setSignups(data.signups || []);

      if (session?.user) {
        const userUuid = (session.user as any).id;
        const mySignup = (data.signups || []).find((s: Signup) => s.user_uuid === userUuid);
        setUserSignup(mySignup || null);
      }
    } catch (error) {
      console.error('Error fetching signups:', error);
    }
  };

  const handleSignup = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/casual/games/${gameId}/signups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_nation: selectedIdeology ? `${selectedNation}_${selectedIdeology}` : selectedNation,
          is_coop: isCoop,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to sign up');
        return;
      }

      toast.success('Successfully signed up for the game!');
      setShowSignupModal(false);
      setIsCoop(false);
      await fetchSignups();
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Failed to sign up');
    }
  };

  const handleCancelSignup = async () => {
    if (!confirm('Cancel your signup?')) return;

    try {
      const response = await fetch(`/api/casual/games/${gameId}/signups`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to cancel signup');
        return;
      }

      toast.success('Signup cancelled successfully');
      await fetchSignups();
    } catch (error) {
      console.error('Error cancelling signup:', error);
      toast.error('Failed to cancel signup');
    }
  };

  const handleUpdateStatus = async (signupId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/casual/games/${gameId}/signups`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signup_id: signupId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to update status');
        return;
      }

      toast.success(`Signup ${newStatus} successfully`);
      await fetchSignups();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleBulkUpdateStatus = async (newStatus: string) => {
    if (selectedSignups.length === 0) {
      toast.warning('No signups selected');
      return;
    }

    if (!confirm(`${newStatus === 'approved' ? 'Approve' : 'Reject'} ${selectedSignups.length} signup(s)?`)) return;

    try {
      const response = await fetch(`/api/casual/games/${gameId}/signups`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk',
          signup_ids: selectedSignups,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to update signups');
        return;
      }

      toast.success(`Successfully ${newStatus === 'approved' ? 'approved' : 'rejected'} ${selectedSignups.length} signup(s)`);
      setSelectedSignups([]);
      await fetchSignups();
    } catch (error) {
      console.error('Error bulk updating:', error);
      toast.error('Failed to update signups');
    }
  };

  const handleEditGame = () => {
    if (!game) return;
    setEditName(game.name);
    setEditDescription(game.description);
    setEditRules(game.rules || '');
    setEditModpackUrl(game.modpack_url || '');
    // Format scheduled_time for datetime-local input (yyyy-MM-ddThh:mm)
    if (game.scheduled_time && game.scheduled_time !== '1970-01-01 00:00:00') {
      const date = new Date(game.scheduled_time);
      const formatted = date.toISOString().slice(0, 16);
      setEditScheduledTime(formatted);
    } else {
      setEditScheduledTime('');
    }
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName) {
      toast.error('Game name is required');
      return;
    }

    // Convert datetime-local format (YYYY-MM-DDTHH:MM) to ClickHouse format (YYYY-MM-DD HH:MM:SS)
    const formatScheduledTime = (dateTimeLocal: string) => {
      if (!dateTimeLocal) return undefined;
      return dateTimeLocal.replace('T', ' ') + ':00';
    };

    try {
      const response = await fetch(`/api/casual/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          scheduled_time: formatScheduledTime(editScheduledTime),
          rules: editRules,
          modpack_url: editModpackUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to update game');
        return;
      }

      toast.success('Game updated successfully');
      setShowEditModal(false);
      await fetchGame();
    } catch (error) {
      console.error('Error updating game:', error);
      toast.error('Failed to update game');
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!confirm(`Change game status to "${newStatus}"?`)) return;

    try {
      const response = await fetch(`/api/casual/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to change status');
        return;
      }

      toast.success(`Game status changed to "${newStatus}"`);
      await fetchGame();
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Failed to change status');
    }
  };

  const handleDeleteGame = async () => {
    if (!confirm('Are you sure you want to delete this game? This will also delete all signups and cannot be undone.')) return;

    try {
      const response = await fetch(`/api/casual/games/${gameId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete game');
        return;
      }

      toast.success('Game deleted successfully');
      router.push('/casual');
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error('Failed to delete game');
    }
  };

  const handleEditNation = (signup: Signup) => {
    setEditingSignup(signup);
    const parts = signup.preferred_nation.split('_');
    if (parts.length > 1) {
      setEditNation(parts[0]);
      setEditIdeology(parts[parts.length - 1] as any);
    } else {
      setEditNation(signup.preferred_nation);
      setEditIdeology(undefined);
    }
    setEditIsCoop(signup.is_coop === 1);
    setShowEditNationModal(true);
  };

  const handleSaveNationEdit = async () => {
    if (!editingSignup) return;

    try {
      const response = await fetch(`/api/casual/games/${gameId}/signups`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_nation',
          signup_id: editingSignup.id,
          preferred_nation: editIdeology ? `${editNation}_${editIdeology}` : editNation,
          is_coop: editIsCoop,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to update nation');
        return;
      }

      toast.success('Player nation updated successfully');
      setShowEditNationModal(false);
      setEditingSignup(null);
      await fetchSignups();
    } catch (error) {
      console.error('Error updating nation:', error);
      toast.error('Failed to update nation');
    }
  };

  const handleUsernameInput = (value: string) => {
    setAddPlayerUsername(value);
    if (value.trim()) {
      const filtered = availableUsers.filter(user =>
        user.username.toLowerCase().includes(value.toLowerCase()) ||
        user.discord_username.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowUserDropdown(true);
    } else {
      setFilteredUsers(availableUsers);
      setShowUserDropdown(false);
    }
  };

  const selectUser = (username: string) => {
    setAddPlayerUsername(username);
    setShowUserDropdown(false);
  };

  const handleAddPlayer = async () => {
    if (!addPlayerUsername.trim()) {
      toast.error('Player username is required');
      return;
    }

    try {
      const response = await fetch(`/api/casual/games/${gameId}/signups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_nation: addPlayerIdeology ? `${addPlayerNation}_${addPlayerIdeology}` : addPlayerNation,
          is_coop: addPlayerIsCoop,
          manual_add: true,
          username: addPlayerUsername.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to add player');
        return;
      }

      toast.success('Player added successfully');
      setShowAddPlayerModal(false);
      setAddPlayerUsername('');
      setAddPlayerNation('GER');
      setAddPlayerIdeology(undefined);
      setAddPlayerIsCoop(false);
      setShowUserDropdown(false);
      await fetchSignups();
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error('Failed to add player');
    }
  };

  const handleExportPlayers = () => {
    if (!game || signups.length === 0) return;

    // Group by nation
    const byNation: Record<string, Signup[]> = {};
    signups.forEach(signup => {
      if (signup.status === 'approved') {
        const nation = signup.preferred_nation;
        if (!byNation[nation]) byNation[nation] = [];
        byNation[nation].push(signup);
      }
    });

    // Create text export
    let text = `${game.name} - Player List\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `Status: ${game.status}\n\n`;
    text += `=== APPROVED PLAYERS BY NATION ===\n\n`;

    Object.entries(byNation).forEach(([nation, players]) => {
      text += `${nation}:\n`;
      players.forEach(p => {
        text += `  - ${p.username} (${p.discord_username})\n`;
      });
      text += `\n`;
    });

    text += `\n=== ALL SIGNUPS ===\n\n`;
    signups.forEach(signup => {
      text += `${signup.username} - ${signup.preferred_nation} - ${signup.status}\n`;
    });

    // Download as text file
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game.name.replace(/[^a-z0-9]/gi, '_')}_players.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenModpackModal = async () => {
    if (!game?.modpack_url) return;

    setShowModpackModal(true);
    setLoadingModpack(true);

    try {
      // Fetch modpack data from Steam Workshop
      const response = await fetch('/api/casual/steam-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: game.modpack_url }),
      });

      if (response.ok) {
        const data = await response.json();
        setModpackData(data);
      } else {
        // If fetch fails, use default data
        setModpackData({
          title: 'Steam Workshop Modpack',
          createdBy: 'Unknown',
          createdDate: 'Unknown',
          updatedDate: 'Unknown',
          previewUrl: '',
        });
      }
    } catch (error) {
      console.error('Error fetching modpack data:', error);
      setModpackData({
        title: 'Steam Workshop Modpack',
        createdBy: 'Unknown',
        createdDate: 'Unknown',
        updatedDate: 'Unknown',
        previewUrl: '',
      });
    } finally {
      setLoadingModpack(false);
    }
  };

  // Filter signups based on user role
  const filteredSignups = isMatchmaker
    ? signups
    : signups.filter(s => s.status === 'approved');

  // Faction mapping for HOI4 nations
  const getFaction = (nationTag: string): number => {
    const tag = nationTag.split('_')[0];

    // The Allies (Democratic) - Priority 1
    const allies = ['ENG', 'FRA', 'USA', 'CAN', 'AST', 'NZL', 'SAF', 'RAJ', 'POL', 'BEL', 'HOL', 'NOR', 'DEN', 'YUG', 'GRE', 'CZE', 'MEX', 'BRA', 'CHI'];
    if (allies.includes(tag)) return 1;

    // The Axis (Fascist) - Priority 2
    const axis = ['GER', 'ITA', 'ROM', 'HUN', 'BUL', 'FIN', 'SLO', 'CRO'];
    if (axis.includes(tag)) return 2;

    // The Comintern (Communist) - Priority 3
    const comintern = ['SOV', 'MON', 'TAN', 'PRC'];
    if (comintern.includes(tag)) return 3;

    // Greater East Asian Co-Prosperity Sphere (Japan faction) - Priority 4
    const japan = ['JAP', 'MAN', 'SIA', 'KOR', 'INS'];
    if (japan.includes(tag)) return 4;

    // All others - Priority 5
    return 5;
  };

  // Get faction background color
  const getFactionBgColor = (nationTag: string): string => {
    const faction = getFaction(nationTag);
    switch (faction) {
      case 1: // Allies - Blue tint
        return 'bg-blue-950/40 hover:bg-blue-900/50';
      case 2: // Axis - White tint
        return 'bg-white/10 hover:bg-white/15';
      case 3: // Comintern - Red tint
        return 'bg-red-950/40 hover:bg-red-900/50';
      case 4: // Japan faction - Yellow tint
        return 'bg-yellow-950/40 hover:bg-yellow-900/50';
      default: // Others - Default zinc
        return 'bg-zinc-900/20 hover:bg-zinc-800/30';
    }
  };

  // Sort signups by faction, then by is_coop (Main first, then Co-op)
  const displayedSignups = [...filteredSignups].sort((a, b) => {
    const factionA = getFaction(a.preferred_nation);
    const factionB = getFaction(b.preferred_nation);

    if (factionA !== factionB) {
      return factionA - factionB;
    }

    // Within same faction, sort Main before Co-op
    return (a.is_coop || 0) - (b.is_coop || 0);
  });

  // Group signups by nation
  const signupsByNation = displayedSignups.reduce((acc, signup) => {
    const nation = signup.preferred_nation.split('_')[0];
    if (!acc[nation]) acc[nation] = [];
    acc[nation].push(signup);
    return acc;
  }, {} as Record<string, Signup[]>);

  const toggleSignupSelection = (signupId: string) => {
    setSelectedSignups(prev =>
      prev.includes(signupId)
        ? prev.filter(id => id !== signupId)
        : [...prev, signupId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSignups.length === displayedSignups.length) {
      setSelectedSignups([]);
    } else {
      setSelectedSignups(displayedSignups.map(s => s.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-100 mb-4">Game Not Found</h1>
          <Button
            onClick={() => router.push('/casual')}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-zinc-700"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Casual Games
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Back Button */}
        <Button
          onClick={() => router.push('/casual')}
          className="mb-4 bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-zinc-700"
          size="sm"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Games
        </Button>

        {/* Game Header */}
        <div className="mb-6 sm:mb-8 bg-zinc-900/50 border-2 border-zinc-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">{game.name}</h1>
              {game.description && (
                <p className="text-zinc-400 mb-3">{game.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
                <span>Created by {game.created_by_name}</span>
                <span>•</span>
                <span>{new Date(game.created_at).toLocaleDateString()}</span>
              </div>
              {game.scheduled_time && game.scheduled_time !== '1970-01-01 00:00:00' && (
                <div className="flex items-center gap-2 mt-2 text-sm text-amber-400">
                  <Calendar className="size-4" />
                  <span>Scheduled: {new Date(game.scheduled_time).toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {/* Status Badge/Selector */}
              {isMatchmaker ? (
                <Select value={game.status} onValueChange={handleChangeStatus}>
                  <SelectTrigger className="w-40 h-9 border-2 border-zinc-700 bg-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-2 border-zinc-700 text-zinc-100">
                    <SelectItem value="open" className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">Open</SelectItem>
                    <SelectItem value="in_progress" className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">In Progress</SelectItem>
                    <SelectItem value="completed" className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className="bg-green-900/30 border-green-700 text-green-400 h-6 w-fit">
                  {formatStatus(game.status)}
                </Badge>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {/* Player Actions - Available to Everyone */}
                {session && game.status === 'open' && (
                  <>
                    {!userSignup && (
                      <Button
                        onClick={() => setShowSignupModal(true)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-500 text-white border-0 h-9"
                      >
                        <UserPlus className="size-4 mr-2" />
                        Sign Up
                      </Button>
                    )}
                    {userSignup && (
                      <Button
                        onClick={handleCancelSignup}
                        size="sm"
                        className="bg-red-600 hover:bg-red-500 text-white border-0 h-9"
                      >
                        Cancel Signup
                      </Button>
                    )}
                  </>
                )}

                {/* Matchmaker Actions */}
                {isMatchmaker && (
                  <>
                    <Button
                      onClick={handleEditGame}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-9"
                    >
                      <Edit className="size-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={handleDeleteGame}
                      size="sm"
                      className="bg-red-600 hover:bg-red-500 text-white border-0 h-9"
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User's Signup Status - Only shown to signed-in users with signup */}
        {userSignup && session && (
          <div className="mb-6 bg-green-900/20 border-2 border-green-800 p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-900/50 p-3 border-2 border-green-700">
                <UserPlus className="size-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-300 mb-2">You're Signed Up!</h3>
                <div className="flex items-center gap-3">
                  <FlagIcon
                    tag={userSignup.preferred_nation.split('_')[0]}
                    ideology={userSignup.preferred_nation.includes('_') ? userSignup.preferred_nation.split('_').slice(1).join('_') as any : undefined}
                    size="medium"
                  />
                  <div>
                    <p className="text-green-200/80 text-sm">
                      Preferred Nation: <strong>{formatNationName(userSignup.preferred_nation)}</strong>
                      {userSignup.is_coop === 1 && (
                        <span className="text-blue-400 ml-2">(Co-op)</span>
                      )}
                    </p>
                    <p className="text-xs text-green-400 mt-1">
                      Status: {userSignup.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats - Only for Matchmakers */}
        {isMatchmaker && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-zinc-900/50 border-2 border-zinc-800 p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Users className="size-4 sm:size-5 text-blue-400" />
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400">Total Signups</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-100">{signups.length}</p>
            </div>

            <div className="bg-zinc-900/50 border-2 border-zinc-800 p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Users className="size-4 sm:size-5 text-green-400" />
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400">Nations</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-100">{Object.keys(signupsByNation).length}</p>
            </div>

            <div className="bg-zinc-900/50 border-2 border-zinc-800 p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Users className="size-4 sm:size-5 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-medium text-zinc-400">Approved</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-100">
                {signups.filter(s => s.status === 'approved').length}
              </p>
            </div>
          </div>
        )}

        {/* Rules and Modpack Info Bar */}
        {(game.rules || game.modpack_url) && (
          <div className="mb-6 sm:mb-8 bg-zinc-900/50 border-2 border-zinc-800 p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Game Information</h3>
            <div className="flex flex-wrap gap-3">
              {game.rules && (
                <button
                  onClick={() => setShowRulesModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-900/30 border-2 border-amber-700 text-amber-400 hover:bg-amber-900/50 transition-colors rounded"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Rules Provided</span>
                  <span className="text-xs opacity-75">(Click to view)</span>
                </button>
              )}

              {game.modpack_url && (
                <button
                  onClick={handleOpenModpackModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border-2 border-blue-700 text-blue-400 hover:bg-blue-900/50 transition-colors rounded"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Modpack Required</span>
                  <span className="text-xs opacity-75">(Click to view)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Signups List */}
        <div className="bg-zinc-900/50 border-2 border-zinc-800">
          <div className="px-4 sm:px-6 py-4 border-b-2 border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-zinc-100">
                  {isMatchmaker ? 'Player Signups' : 'Players'}
                </h2>
                {isMatchmaker && (
                  <p className="text-sm text-zinc-400 mt-1">
                    Manage player signups and preferences
                  </p>
                )}
                {/* Faction Legend */}
                <div className="flex flex-wrap gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="size-4 bg-blue-950/40 border border-blue-800 rounded"></div>
                    <span className="text-xs text-zinc-400">Allies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-4 bg-white/10 border border-white/20 rounded"></div>
                    <span className="text-xs text-zinc-400">Axis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-4 bg-red-950/40 border border-red-800 rounded"></div>
                    <span className="text-xs text-zinc-400">Comintern</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-4 bg-yellow-950/40 border border-yellow-800 rounded"></div>
                    <span className="text-xs text-zinc-400">Japan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-4 bg-zinc-900/20 border border-zinc-700 rounded"></div>
                    <span className="text-xs text-zinc-400">Other</span>
                  </div>
                </div>
              </div>
              {isMatchmaker && (
                <div className="flex gap-2">
                  {selectedSignups.length > 0 ? (
                    <>
                      <Button
                        onClick={() => handleBulkUpdateStatus('approved')}
                        className="bg-green-600 hover:bg-green-500 text-white border-0"
                      >
                        <CheckCheck className="size-4 mr-2" />
                        Approve ({selectedSignups.length})
                      </Button>
                      <Button
                        onClick={() => handleBulkUpdateStatus('rejected')}
                        className="bg-red-600 hover:bg-red-500 text-white border-0"
                      >
                        <XCircle className="size-4 mr-2" />
                        Reject ({selectedSignups.length})
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setShowAddPlayerModal(true)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 text-white border-0"
                    >
                      <UserPlus className="size-4 mr-2" />
                      Add Player
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {displayedSignups.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="size-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-zinc-400 mb-2">
                {isMatchmaker ? 'No Signups Yet' : 'No Approved Players Yet'}
              </h3>
              <p className="text-sm text-zinc-500">
                {isMatchmaker ? 'Be the first to sign up!' : 'Check back soon for approved players.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-zinc-800/50">
                  <tr>
                    {isMatchmaker && (
                      <th className="text-left px-4 py-3 w-12">
                        <input
                          type="checkbox"
                          checked={selectedSignups.length === displayedSignups.length && displayedSignups.length > 0}
                          onChange={toggleSelectAll}
                          className="size-4 rounded border-zinc-600 bg-zinc-800 text-amber-600 focus:ring-amber-600"
                        />
                      </th>
                    )}
                    <th className="text-left px-4 sm:px-6 py-3 text-zinc-400 font-semibold text-sm">Player</th>
                    <th className="text-left px-4 sm:px-6 py-3 text-zinc-400 font-semibold text-sm">Nation</th>
                    <th className="text-left px-4 sm:px-6 py-3 text-zinc-400 font-semibold text-sm">Type</th>
                    {isMatchmaker && (
                      <>
                        <th className="text-left px-4 sm:px-6 py-3 text-zinc-400 font-semibold text-sm">Status</th>
                        <th className="text-left px-4 sm:px-6 py-3 text-zinc-400 font-semibold text-sm">Signed Up</th>
                        <th className="text-right px-4 sm:px-6 py-3 text-zinc-400 font-semibold text-sm">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {displayedSignups.map((signup) => (
                    <tr key={signup.id} className={`transition-colors ${getFactionBgColor(signup.preferred_nation)}`}>
                      {isMatchmaker && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedSignups.includes(signup.id)}
                            onChange={() => toggleSignupSelection(signup.id)}
                            className="size-4 rounded border-zinc-600 bg-zinc-800 text-amber-600 focus:ring-amber-600"
                          />
                        </td>
                      )}
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-2">
                          {signup.discord_avatar && (
                            <img
                              src={signup.discord_avatar}
                              alt={signup.username}
                              className="size-8 rounded-full"
                            />
                          )}
                          <span className="text-sm text-zinc-300">{signup.username}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FlagIcon
                            tag={signup.preferred_nation.split('_')[0]}
                            ideology={signup.preferred_nation.includes('_') ? signup.preferred_nation.split('_').slice(1).join('_') as any : undefined}
                            size="small"
                          />
                          <span className="text-sm text-zinc-200">{formatNationName(signup.preferred_nation)}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        {signup.is_coop === 1 ? (
                          <Badge className="bg-blue-900/30 border-blue-700 text-blue-400 h-6">
                            <UserCheck className="size-3 mr-1" />
                            Co-op
                          </Badge>
                        ) : (
                          <Badge className="bg-green-900/30 border-green-700 text-green-400 h-6">
                            <UserCheck className="size-3 mr-1" />
                            Main
                          </Badge>
                        )}
                      </td>
                      {isMatchmaker && (
                        <>
                          <td className="px-4 sm:px-6 py-3">
                            <Badge
                              className={
                                signup.status === 'approved'
                                  ? 'bg-green-900/30 border-green-700 text-green-400 h-6'
                                  : signup.status === 'rejected'
                                  ? 'bg-red-900/30 border-red-700 text-red-400 h-6'
                                  : 'bg-amber-900/30 border-amber-700 text-amber-400 h-6'
                              }
                            >
                              {signup.status}
                            </Badge>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <span className="text-sm text-zinc-400">
                              {new Date(signup.created_at).toLocaleDateString()}
                            </span>
                          </td>
                        </>
                      )}
                      {isMatchmaker && (
                        <td className="px-4 sm:px-6 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleEditNation(signup)}
                              className="bg-blue-600 hover:bg-blue-500 text-white border-0"
                            >
                              <Edit className="size-3 mr-1" />
                              Edit
                            </Button>
                            {signup.status !== 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(signup.id, 'approved')}
                                className="bg-green-600 hover:bg-green-500 text-white border-0"
                              >
                                <Check className="size-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            {signup.status !== 'rejected' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(signup.id, 'rejected')}
                                className="bg-red-600 hover:bg-red-500 text-white border-0"
                              >
                                <X className="size-4 mr-1" />
                                Reject
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Edit Game Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-100">Edit Game</h2>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Game Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600"
                  placeholder="Enter game name..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600 min-h-[80px]"
                  placeholder="Optional description..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  value={editScheduledTime}
                  onChange={(e) => setEditScheduledTime(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600"
                />
                <p className="text-xs text-zinc-500 mt-1">Optional - leave blank for no scheduled time</p>
              </div>

              {/* Rules */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Rules
                </label>
                <RichTextEditor
                  content={editRules}
                  onChange={setEditRules}
                  placeholder="Enter game rules..."
                />
              </div>

              {/* Modpack URL */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Steam Workshop Modpack (Optional)
                </label>
                <input
                  type="url"
                  value={editModpackUrl}
                  onChange={(e) => setEditModpackUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600"
                  placeholder="https://steamcommunity.com/sharedfiles/filedetails/?id=..."
                />
                <p className="text-xs text-zinc-500 mt-1">Required modpack URL from Steam Workshop</p>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t-2 border-zinc-800">
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white border-0"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Sign Up for {game.name}</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Select Your Preferred Nation
              </label>
              <p className="text-xs text-zinc-500 mb-3">
                Choose which nation you want to play in this game.
              </p>
              <NationSelector
                value={selectedNation}
                onChange={(tag: string, ideology, nation) => {
                  setSelectedNation(tag);
                  setSelectedIdeology(ideology as 'communism' | 'democratic' | 'fascism' | 'neutrality' | undefined);
                }}
                placeholder="Select a nation..."
              />
            </div>

            <div className="mb-6 flex items-start gap-3 p-3 bg-zinc-800/50 border-2 border-zinc-700 rounded">
              <input
                type="checkbox"
                id="is_coop"
                checked={isCoop}
                onChange={(e) => setIsCoop(e.target.checked)}
                className="mt-1 size-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-600"
              />
              <div className="flex-1">
                <label htmlFor="is_coop" className="text-sm font-medium text-zinc-300 cursor-pointer">
                  Sign up as Co-op Player
                </label>
                <p className="text-xs text-zinc-400 mt-1">
                  Co-op players join alongside another player controlling the same nation
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowSignupModal(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white border-0"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSignup}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white border-0"
              >
                Confirm Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Nation Modal */}
      {showEditNationModal && editingSignup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Edit Player Nation</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Editing nation for: <strong className="text-zinc-200">{editingSignup.username}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Select New Nation
              </label>
              <NationSelector
                value={editNation}
                onChange={(tag: string, ideology, nation) => {
                  setEditNation(tag);
                  setEditIdeology(ideology as 'communism' | 'democratic' | 'fascism' | 'neutrality' | undefined);
                }}
                placeholder="Select a nation..."
              />
            </div>

            <div className="mb-6 flex items-start gap-3 p-3 bg-zinc-800/50 border-2 border-zinc-700 rounded">
              <input
                type="checkbox"
                id="edit_is_coop"
                checked={editIsCoop}
                onChange={(e) => setEditIsCoop(e.target.checked)}
                className="mt-1 size-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-600"
              />
              <div className="flex-1">
                <label htmlFor="edit_is_coop" className="text-sm font-medium text-zinc-300 cursor-pointer">
                  Co-op Player
                </label>
                <p className="text-xs text-zinc-400 mt-1">
                  Mark this player as a co-op player
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowEditNationModal(false);
                  setEditingSignup(null);
                }}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white border-0"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNationEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Add Player Manually</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Add a player to this game without requiring them to sign up
            </p>

            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Player Username *
              </label>
              <input
                type="text"
                value={addPlayerUsername}
                onChange={(e) => handleUsernameInput(e.target.value)}
                onFocus={() => addPlayerUsername && setShowUserDropdown(true)}
                onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-600"
                placeholder="Type to search users..."
              />
              {showUserDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-zinc-800 border-2 border-zinc-700 rounded shadow-lg">
                  {filteredUsers.slice(0, 10).map((user, index) => (
                    <div
                      key={index}
                      onClick={() => selectUser(user.username)}
                      className="px-4 py-2 hover:bg-zinc-700 cursor-pointer flex items-center gap-2 border-b border-zinc-700 last:border-0"
                    >
                      {user.discord_avatar && (
                        <img
                          src={user.discord_avatar}
                          alt={user.username}
                          className="size-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="text-sm text-zinc-100">{user.username}</div>
                        {user.discord_username !== user.username && (
                          <div className="text-xs text-zinc-400">{user.discord_username}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Select Nation
              </label>
              <NationSelector
                value={addPlayerNation}
                onChange={(tag: string, ideology, nation) => {
                  setAddPlayerNation(tag);
                  setAddPlayerIdeology(ideology as 'communism' | 'democratic' | 'fascism' | 'neutrality' | undefined);
                }}
                placeholder="Select a nation..."
              />
            </div>

            <div className="mb-6 flex items-start gap-3 p-3 bg-zinc-800/50 border-2 border-zinc-700 rounded">
              <input
                type="checkbox"
                id="add_is_coop"
                checked={addPlayerIsCoop}
                onChange={(e) => setAddPlayerIsCoop(e.target.checked)}
                className="mt-1 size-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-600"
              />
              <div className="flex-1">
                <label htmlFor="add_is_coop" className="text-sm font-medium text-zinc-300 cursor-pointer">
                  Co-op Player
                </label>
                <p className="text-xs text-zinc-400 mt-1">
                  Mark this player as a co-op player
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowAddPlayerModal(false);
                  setAddPlayerUsername('');
                  setAddPlayerNation('GER');
                  setAddPlayerIdeology(undefined);
                  setAddPlayerIsCoop(false);
                }}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white border-0"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPlayer}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white border-0"
              >
                Add Player
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && game && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                <div className="bg-amber-900/50 p-2 border-2 border-amber-700 rounded">
                  <svg className="size-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Game Rules
              </h2>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="bg-zinc-800/30 border-2 border-amber-700/30 p-6 rounded-lg">
              <RichTextViewer content={game.rules} />
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowRulesModal(false)}
                className="bg-amber-600 hover:bg-amber-500 text-white border-0"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modpack Modal */}
      {showModpackModal && game && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                <div className="bg-blue-900/50 p-2 border-2 border-blue-700 rounded">
                  <svg className="size-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Required Modpack
              </h2>
              <button
                onClick={() => setShowModpackModal(false)}
                className="text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="size-6" />
              </button>
            </div>

            {loadingModpack ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-zinc-700 border-t-blue-500"></div>
                  <div className="text-zinc-400">Loading modpack information...</div>
                </div>
              </div>
            ) : modpackData ? (
              <div className="space-y-4">
                {/* Title */}
                <div className="bg-zinc-800/30 border-2 border-blue-700/30 p-6 rounded-lg">
                  <h3 className="text-2xl font-bold text-zinc-100">{modpackData.title}</h3>
                </div>

                {/* Workshop Link */}
                <div className="bg-zinc-800/30 border-2 border-blue-700/30 p-6 rounded-lg">
                  <p className="text-sm text-zinc-400 mb-4">Subscribe and download this modpack from Steam Workshop:</p>
                  <a
                    href={game.modpack_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-base font-semibold shadow-lg hover:shadow-blue-900/50"
                  >
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 11h-4v-1h4v1zm6.5 6.5h-13v-13h2.5v10.5h10.5v2.5z"/>
                    </svg>
                    Open in Steam Workshop
                  </a>
                  <p className="text-xs text-zinc-500 mt-4 break-all font-mono">{game.modpack_url}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-400">
                Failed to load modpack information
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowModpackModal(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white border-0"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
