'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Bracket from '@/app/components/Bracket';
import { Match as MatchType, Player } from '@/app/types/tournament';
import { getRoundName } from '@/app/lib/tournamentData';
import { getStatusDisplay, getStatusBadgeClass } from '@/app/lib/tournamentStatus';
import NationSelector from '@/app/components/NationSelector';
import { HOI4Nation, getFlagUrl, getNationByTag } from '@/app/lib/hoi4Nations';
import Navbar from '@/app/components/Navbar';

interface Tournament {
  id: string;
  name: string;
  status: string;
  current_round: number;
  created_by_uuid: string;
  created_at: string;
  is_main: number;
  bracket_size: number;
}

interface BackendMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_uuid: string;
  player2_uuid: string;
  player1_nation: string;
  player2_nation: string;
  winner_uuid: string;
  status: string;
  scheduled_time: string;
  completed_at: string;
}

interface User {
  uuid: string;
  username: string;
  discord_username: string;
  discord_avatar: string;
}

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [backendMatches, setBackendMatches] = useState<BackendMatch[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signups, setSignups] = useState<any[]>([]);
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [selectedSignups, setSelectedSignups] = useState<string[]>([]);
  const [creatingMatches, setCreatingMatches] = useState(false);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editPlayer1, setEditPlayer1] = useState<string>('');
  const [editPlayer2, setEditPlayer2] = useState<string>('');
  const [editPlayer1Nation, setEditPlayer1Nation] = useState<string>('GER');
  const [editPlayer2Nation, setEditPlayer2Nation] = useState<string>('GER');
  const [editPlayer1Ideology, setEditPlayer1Ideology] = useState<string | undefined>();
  const [editPlayer2Ideology, setEditPlayer2Ideology] = useState<string | undefined>();
  const [editScheduledTime, setEditScheduledTime] = useState<string>('');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const tournamentId = params.id as string;

  // Helper to parse nation tag (handles TAG or TAG_IDEOLOGY format)
  const parseNationTag = (nationStr: string): string => {
    if (!nationStr) return 'GER';
    const underscoreIndex = nationStr.indexOf('_');
    return underscoreIndex !== -1 ? nationStr.substring(0, underscoreIndex) : nationStr;
  };

  useEffect(() => {
    fetchTournamentData();
    fetchAllUsers();

    // Auto-refresh every 10 seconds for live updates (reduced from 5s)
    const interval = setInterval(() => {
      fetchTournamentData();
    }, 10000);

    return () => clearInterval(interval);
  }, [tournamentId]);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTournamentData = async () => {
    try {
      const [tournamentResponse, signupsResponse] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`),
        fetch(`/api/tournaments/${tournamentId}/signups`),
      ]);

      if (!tournamentResponse.ok) {
        throw new Error('Tournament not found');
      }

      const data = await tournamentResponse.json();
      const signupsData = await signupsResponse.json();

      setTournament(data.tournament);
      setBackendMatches(data.matches || []);
      setSignups(signupsData.signups || []);

      // Collect all player UUIDs from matches
      const playerUuids = new Set<string>();
      data.matches?.forEach((match: BackendMatch) => {
        if (match.player1_uuid) playerUuids.add(match.player1_uuid);
        if (match.player2_uuid) playerUuids.add(match.player2_uuid);
      });

      // Only fetch users we don't already have cached
      setUsers((prevUsers) => {
        const newUuids = Array.from(playerUuids).filter(uuid => !prevUsers[uuid]);

        // If no new users, return existing cache
        if (newUuids.length === 0) {
          return prevUsers;
        }

        // Fetch only new users in background
        Promise.all(
          newUuids.map(async (uuid) => {
            try {
              const userResponse = await fetch(`/api/users/${uuid}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                setUsers((prev) => ({
                  ...prev,
                  [uuid]: userData.user,
                }));
              } else {
                // Fallback if user not found
                setUsers((prev) => ({
                  ...prev,
                  [uuid]: {
                    uuid: uuid,
                    username: uuid,
                    discord_username: uuid,
                    discord_avatar: '',
                  },
                }));
              }
            } catch (error) {
              console.error(`Error fetching user ${uuid}:`, error);
              setUsers((prev) => ({
                ...prev,
                [uuid]: {
                  uuid: uuid,
                  username: uuid,
                  discord_username: uuid,
                  discord_avatar: '',
                },
              }));
            }
          })
        );

        // Return existing users for now, updates will come from setUsers calls above
        return prevUsers;
      });
    } catch (error) {
      console.error('Error fetching tournament:', error);
      setError('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  // Check if current user can edit (matchmakers and admins can edit any tournament)
  const canEdit = session?.user && tournament && (
    ['admin', 'matchmaker'].includes((session.user as any)?.role)
  );

  // Convert backend matches to frontend format
  const convertToFrontendMatches = (): MatchType[] => {
    return backendMatches.map((match) => {
      const player1 = match.player1_uuid && users[match.player1_uuid]
        ? {
            id: match.player1_uuid,
            name: users[match.player1_uuid].username || users[match.player1_uuid].discord_username,
            country: getNationByTag(parseNationTag(match.player1_nation || 'GER'))?.name || 'Germany',
            countryCode: getNationByTag(parseNationTag(match.player1_nation || 'GER'))?.flagCode || 'de',
            countryTag: match.player1_nation || 'GER',
            seed: 0,
            avatar: users[match.player1_uuid].discord_avatar,
          } as Player
        : null;

      const player2 = match.player2_uuid && users[match.player2_uuid]
        ? {
            id: match.player2_uuid,
            name: users[match.player2_uuid].username || users[match.player2_uuid].discord_username,
            country: getNationByTag(parseNationTag(match.player2_nation || 'GER'))?.name || 'Germany',
            countryCode: getNationByTag(parseNationTag(match.player2_nation || 'GER'))?.flagCode || 'de',
            countryTag: match.player2_nation || 'GER',
            seed: 0,
            avatar: users[match.player2_uuid].discord_avatar,
          } as Player
        : null;

      const winner = match.winner_uuid && users[match.winner_uuid]
        ? {
            id: match.winner_uuid,
            name: users[match.winner_uuid].username || users[match.winner_uuid].discord_username,
            country: match.winner_uuid === match.player1_uuid
              ? getNationByTag(parseNationTag(match.player1_nation || 'GER'))?.name || 'Germany'
              : getNationByTag(parseNationTag(match.player2_nation || 'GER'))?.name || 'Germany',
            countryCode: match.winner_uuid === match.player1_uuid
              ? getNationByTag(parseNationTag(match.player1_nation || 'GER'))?.flagCode || 'de'
              : getNationByTag(parseNationTag(match.player2_nation || 'GER'))?.flagCode || 'de',
            countryTag: match.winner_uuid === match.player1_uuid
              ? match.player1_nation || 'GER'
              : match.player2_nation || 'GER',
            seed: 0,
            avatar: users[match.winner_uuid].discord_avatar,
          } as Player
        : null;

      return {
        id: match.id,
        round: match.round,
        matchNumber: match.match_number,
        player1,
        player2,
        winner,
        status: match.status as 'pending' | 'in_progress' | 'completed',
        scheduledTime: match.scheduled_time,
        completedAt: match.completed_at,
      };
    });
  };

  const handleSelectWinner = async (matchId: string, playerId: string) => {
    if (!canEdit) {
      alert('Only the tournament creator can edit matches');
      return;
    }

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winner_id: playerId,
          status: 'completed'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to update match');
      }

      // Small delay to allow database mutations to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh tournament data
      await fetchTournamentData();
    } catch (error) {
      console.error('Error updating match:', error);
      alert(`Failed to update match: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleResetMatch = async (matchId: string) => {
    if (!canEdit) {
      alert('Only the tournament creator can reset matches');
      return;
    }

    try {
      const response = await fetch(`/api/matches/${matchId}/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset match');
      }

      // Small delay to allow database mutations to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh tournament data
      await fetchTournamentData();
    } catch (error) {
      console.error('Error resetting match:', error);
      alert('Failed to reset match');
    }
  };

  const handleToggleSignupSelection = (userUuid: string) => {
    if (selectedSignups.includes(userUuid)) {
      setSelectedSignups(selectedSignups.filter(id => id !== userUuid));
    } else if (selectedSignups.length < (tournament?.bracket_size || 16)) {
      setSelectedSignups([...selectedSignups, userUuid]);
    }
  };

  const handleCreateMatchesFromSignups = async () => {
    if (!tournament || !canEdit) return;

    if (selectedSignups.length !== tournament.bracket_size) {
      alert(`Please select exactly ${tournament.bracket_size} players`);
      return;
    }

    if (!confirm(`Create matches with ${selectedSignups.length} selected players?`)) {
      return;
    }

    setCreatingMatches(true);

    try {
      const totalRounds = Math.log2(tournament.bracket_size);
      const matches = [];

      // Get preferred nations for selected players
      const playerNations: Record<string, string> = {};
      selectedSignups.forEach(uuid => {
        const signup = signups.find(s => s.user_uuid === uuid);
        playerNations[uuid] = signup?.preferred_nation || 'GER';
      });

      // Round 1: Create matches with selected players and their preferred nations
      const round1Matches = tournament.bracket_size / 2;
      for (let i = 0; i < round1Matches; i++) {
        const player1Uuid = selectedSignups[i * 2];
        const player2Uuid = selectedSignups[i * 2 + 1];

        matches.push({
          tournament_id: tournamentId,
          round: 1,
          match_number: i + 1,
          player1_uuid: player1Uuid,
          player2_uuid: player2Uuid,
          player1_nation: playerNations[player1Uuid],
          player2_nation: playerNations[player2Uuid],
          status: 'pending',
        });
      }

      // Subsequent rounds: Create empty matches
      for (let round = 2; round <= totalRounds; round++) {
        const matchesInRound = Math.pow(2, totalRounds - round);
        for (let i = 0; i < matchesInRound; i++) {
          matches.push({
            tournament_id: tournamentId,
            round: round,
            match_number: i + 1,
            player1_uuid: '',
            player2_uuid: '',
            status: 'pending',
          });
        }
      }

      // Create all matches
      for (const match of matches) {
        await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(match),
        });
      }

      // Small delay for database
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh and close modal
      await fetchTournamentData();
      setShowPlayerManagement(false);
      setSelectedSignups([]);
      alert('Matches created successfully!');
    } catch (error) {
      console.error('Error creating matches:', error);
      alert('Failed to create matches');
    } finally {
      setCreatingMatches(false);
    }
  };

  const handleEditMatchPlayers = (matchId: string, player1Uuid: string, player2Uuid: string) => {
    setEditingMatch(matchId);
    setEditPlayer1(player1Uuid);
    setEditPlayer2(player2Uuid);

    // Get current nations and scheduled time from the match
    const match = backendMatches.find(m => m.id === matchId);
    if (match) {
      setEditPlayer1Nation(match.player1_nation || 'GER');
      setEditPlayer2Nation(match.player2_nation || 'GER');
      // Format datetime for input (convert from ISO to datetime-local format)
      if (match.scheduled_time) {
        const date = new Date(match.scheduled_time);
        const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setEditScheduledTime(localDateTime);
      } else {
        setEditScheduledTime('');
      }
    } else {
      setEditPlayer1Nation('GER');
      setEditPlayer2Nation('GER');
      setEditScheduledTime('');
    }
  };

  const handleSaveMatchPlayers = async () => {
    if (!editingMatch || !canEdit) return;

    if (!editPlayer1 || !editPlayer2) {
      alert('Please select both players');
      return;
    }

    if (editPlayer1 === editPlayer2) {
      alert('Players must be different');
      return;
    }

    try {
      const body: any = {
        player1_uuid: editPlayer1,
        player2_uuid: editPlayer2,
        player1_nation: editPlayer1Ideology ? `${editPlayer1Nation}_${editPlayer1Ideology}` : editPlayer1Nation,
        player2_nation: editPlayer2Ideology ? `${editPlayer2Nation}_${editPlayer2Ideology}` : editPlayer2Nation,
      };

      // Add scheduled time if set
      if (editScheduledTime) {
        body.scheduled_time = new Date(editScheduledTime).toISOString();
      }

      const response = await fetch(`/api/matches/${editingMatch}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to update match');
      }

      // Small delay for database
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh and close modal
      await fetchTournamentData();
      setEditingMatch(null);
      setEditPlayer1('');
      setEditPlayer2('');
      setEditPlayer1Nation('GER');
      setEditPlayer2Nation('GER');
      setEditScheduledTime('');
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Failed to update match players');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading tournament...</div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Navbar />
        <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h1 className="text-3xl font-bold text-zinc-100">Tournament Not Found</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-zinc-300 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800  p-12 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">Tournament Not Found</h3>
            <p className="text-zinc-500 mb-6">
              The tournament you're looking for doesn't exist or has been deleted.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold  transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const frontendMatches = convertToFrontendMatches();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Tournament Header */}
        <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-zinc-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">{tournament.name}</h1>
                {tournament.is_main === 1 && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold">
                    Main Tournament
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span className={`px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(tournament.status)}`}>
                  {getStatusDisplay(tournament.status, backendMatches.length > 0).label}
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold">
                  {tournament.bracket_size || 16} Players
                </span>
                <span className="text-zinc-400 text-sm">Round {tournament.current_round}</span>
                <span className="text-zinc-500 text-sm">
                  Created {new Date(tournament.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/"
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-zinc-300 text-sm sm:text-base transition-colors text-center"
              >
                ← Back
              </Link>
            </div>
          </div>
        </div>
        {/* Permission Notice */}
        {!canEdit && session?.user && (
          <div className="mb-6 bg-blue-900/20 border border-blue-800  p-4">
            <p className="text-blue-300 text-sm">
              👁️ You are viewing this tournament. Only the tournament creator can edit matches.
            </p>
          </div>
        )}

        {canEdit && (
          <div className="mb-6 bg-green-900/20 border border-green-800  p-4">
            <p className="text-green-300 text-sm">
              ✏️ You can edit this tournament. Click on player cards to select winners.
            </p>
          </div>
        )}

        {/* Player Management Section */}
        {canEdit && backendMatches.length === 0 && signups.length > 0 && (
          <div className="mb-6 bg-blue-900/20 border border-blue-800  p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-blue-300 mb-1">Player Management</h3>
                <p className="text-sm text-blue-400">
                  {signups.length} players signed up • Select {tournament?.bracket_size} to create matches
                </p>
              </div>
              <button
                onClick={() => setShowPlayerManagement(!showPlayerManagement)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold  transition-colors"
              >
                {showPlayerManagement ? 'Hide' : 'Manage Players'}
              </button>
            </div>

            {showPlayerManagement && (
              <div className="mt-4 bg-zinc-900/50 border border-zinc-800  p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-zinc-300">
                      Selected: {selectedSignups.length}/{tournament?.bracket_size}
                    </span>
                    <button
                      onClick={() => setSelectedSignups([])}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Clear Selection
                    </button>
                  </div>
                  <div className="w-full bg-zinc-700  h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${(selectedSignups.length / (tournament?.bracket_size || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto mb-4">
                  {signups.map((signup) => {
                    const isSelected = selectedSignups.includes(signup.user_uuid);
                    const preferredNation = getNationByTag(parseNationTag(signup.preferred_nation || 'GER'));
                    return (
                      <button
                        key={signup.user_uuid}
                        onClick={() => handleToggleSignupSelection(signup.user_uuid)}
                        disabled={!isSelected && selectedSignups.length >= (tournament?.bracket_size || 0)}
                        className={`p-3  border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-900/30'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        } ${!isSelected && selectedSignups.length >= (tournament?.bracket_size || 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          {signup.discord_avatar && (
                            <img
                              src={signup.discord_avatar}
                              alt={signup.username}
                              className="w-8 h-8  bg-zinc-700"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-zinc-200 truncate">
                              {signup.username}
                            </div>
                            <div className="text-xs text-zinc-500 flex items-center gap-1">
                              <img
                                src={getFlagUrl(parseNationTag(signup.preferred_nation || 'GER')) || '/flags/GER_neutrality.png'}
                                alt={preferredNation?.name || 'Flag'}
                                className="w-4 h-3 inline-block"
                              />
                              {preferredNation?.name || 'Germany'}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="text-blue-400">✓</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const firstPlayers = signups.slice(0, tournament?.bracket_size || 0);
                      setSelectedSignups(firstPlayers.map(s => s.user_uuid));
                    }}
                    disabled={signups.length < (tournament?.bracket_size || 0)}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-semibold  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select First {tournament?.bracket_size}
                  </button>
                  <button
                    onClick={handleCreateMatchesFromSignups}
                    disabled={selectedSignups.length !== (tournament?.bracket_size || 0) || creatingMatches}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingMatches ? 'Creating Matches...' : `Create Matches with ${selectedSignups.length} Players`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {backendMatches.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800  p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Matches Yet</h3>
            <p className="text-zinc-500">
              This tournament hasn't started yet. Matches will appear here once they're created.
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <Bracket
              matches={frontendMatches}
              currentRound={tournament?.current_round || 1}
              onSelectWinner={handleSelectWinner}
              onResetMatch={canEdit ? handleResetMatch : undefined}
              onEditPlayers={canEdit ? handleEditMatchPlayers : undefined}
              canEdit={canEdit || false}
            />
          </div>
        )}
      </main>

      {/* Edit Match Players Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border-2 border-zinc-700 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-100">Edit Match</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Match Configuration Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Match Configuration</h3>

                {/* Scheduled Time */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Scheduled Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editScheduledTime}
                    onChange={(e) => setEditScheduledTime(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Set when this match is scheduled to start</p>
                </div>
              </div>

              {/* Players Section - Two Columns */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Players</h3>

                <div className="grid grid-cols-2 gap-6">
                  {/* Player 1 Column */}
                  <div className="space-y-4 p-4 bg-zinc-800/30 border border-zinc-800">
                    <h4 className="text-sm font-semibold text-zinc-300">Player 1</h4>

                    {/* Player 1 Selection */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-2">
                        Select Player
                      </label>
                      <select
                        value={editPlayer1}
                        onChange={(e) => setEditPlayer1(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Player 1</option>
                        {allUsers.map((user) => (
                          <option key={user.uuid} value={user.uuid}>
                            {user.username || user.discord_username}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Player 1 Nation */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-2">
                        Nation
                      </label>
                      <NationSelector
                        value={editPlayer1Nation}
                        onChange={(tag: string, ideology, nation) => {
                          setEditPlayer1Nation(tag);
                          setEditPlayer1Ideology(ideology);
                        }}
                        placeholder="Select nation..."
                      />
                    </div>
                  </div>

                  {/* Player 2 Column */}
                  <div className="space-y-4 p-4 bg-zinc-800/30 border border-zinc-800">
                    <h4 className="text-sm font-semibold text-zinc-300">Player 2</h4>

                    {/* Player 2 Selection */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-2">
                        Select Player
                      </label>
                      <select
                        value={editPlayer2}
                        onChange={(e) => setEditPlayer2(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Player 2</option>
                        {allUsers.map((user) => (
                          <option key={user.uuid} value={user.uuid}>
                            {user.username || user.discord_username}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Player 2 Nation */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-2">
                        Nation
                      </label>
                      <NationSelector
                        value={editPlayer2Nation}
                        onChange={(tag: string, ideology, nation) => {
                          setEditPlayer2Nation(tag);
                          setEditPlayer2Ideology(ideology);
                        }}
                        placeholder="Select nation..."
                      />
                    </div>
                  </div>
                </div>

                {/* Warning if same player selected */}
                {editPlayer1 && editPlayer2 && editPlayer1 === editPlayer2 && (
                  <div className="p-3 bg-red-900/20 border border-red-800 text-red-300 text-sm">
                    ⚠️ Players must be different
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => {
                  setEditingMatch(null);
                  setEditPlayer1('');
                  setEditPlayer2('');
                  setEditScheduledTime('');
                }}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMatchPlayers}
                disabled={!editPlayer1 || !editPlayer2 || editPlayer1 === editPlayer2}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
