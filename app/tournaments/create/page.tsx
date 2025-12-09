'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NationSelector from '@/app/components/NationSelector';
import FlagIcon from '@/app/components/FlagIcon';
import { HOI4Nation } from '@/app/lib/hoi4NationsComplete';
import Navbar from '@/app/components/Navbar';

interface User {
  id: string;
  uuid: string;
  username: string;
  discord_id: string;
  discord_username: string;
  discord_avatar: string;
  role: string;
  whitelisted: number;
}

export default function CreateTournamentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [tournamentName, setTournamentName] = useState('');
  const [bracketSize, setBracketSize] = useState<4 | 8 | 16 | 32>(16);
  const [selectedPlayers, setSelectedPlayers] = useState<User[]>([]);
  const [playerNations, setPlayerNations] = useState<{ [uuid: string]: string }>({});
  const [playerIdeologies, setPlayerIdeologies] = useState<{ [uuid: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any)?.role;
      if (!['admin', 'matchmaker'].includes(userRole)) {
        router.push('/');
        return;
      }
      fetchUsers();
    }
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayerSelection = (user: User) => {
    if (selectedPlayers.find(p => p.uuid === user.uuid)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.uuid !== user.uuid));
      // Remove nation assignment when player is deselected
      const newPlayerNations = { ...playerNations };
      delete newPlayerNations[user.uuid];
      setPlayerNations(newPlayerNations);
    } else if (selectedPlayers.length < bracketSize) {
      setSelectedPlayers([...selectedPlayers, user]);
      // Assign default nation (GER) when player is selected
      setPlayerNations({ ...playerNations, [user.uuid]: 'GER' });
    }
  };

  const handleNationChange = (uuid: string, tag: string, ideology?: string) => {
    setPlayerNations({ ...playerNations, [uuid]: tag });
    if (ideology) {
      setPlayerIdeologies({ ...playerIdeologies, [uuid]: ideology });
    }
  };

  const createTournamentMatches = async (tournamentId: string, players: User[], size: number) => {
    const matches = [];
    const totalRounds = Math.log2(size);

    // Round 1: Create matches with actual players and assigned nations
    const round1Matches = size / 2;
    for (let i = 0; i < round1Matches; i++) {
      const player1 = players[i * 2];
      const player2 = players[i * 2 + 1];

      matches.push({
        tournament_id: tournamentId,
        round: 1,
        match_number: i + 1,
        player1_uuid: player1.uuid,
        player2_uuid: player2.uuid,
        player1_nation: playerIdeologies[player1.uuid] ? `${playerNations[player1.uuid]}_${playerIdeologies[player1.uuid]}` : (playerNations[player1.uuid] || 'GER'),
        player2_nation: playerIdeologies[player2.uuid] ? `${playerNations[player2.uuid]}_${playerIdeologies[player2.uuid]}` : (playerNations[player2.uuid] || 'GER'),
        status: 'pending',
      });
    }

    // Subsequent rounds: Create empty matches for winners
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
  };

  const handleCreateTournament = async () => {
    if (tournamentName.trim() === '') {
      alert('Please enter a tournament name');
      return;
    }

    // Allow creating tournament without players (for signups)
    // Or with exact number of players (to start immediately)
    if (selectedPlayers.length > 0 && selectedPlayers.length !== bracketSize) {
      alert(`Please select either 0 players (for open signups) or exactly ${bracketSize} players to start immediately`);
      return;
    }

    setCreating(true);

    try {
      // Create tournament
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tournamentName,
          bracket_size: bracketSize,
          status: selectedPlayers.length > 0 ? 'not_started' : 'not_started', // Can be changed by admin later
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }

      const data = await response.json();
      const tournamentId = data.tournamentId;

      // Only create matches if players are selected
      if (selectedPlayers.length === bracketSize) {
        await createTournamentMatches(tournamentId, selectedPlayers, bracketSize);
      }

      // Redirect to tournament page
      router.push(`/tournaments/${tournamentId}`);
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Failed to create tournament');
      setCreating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (status !== 'authenticated' || !['admin', 'matchmaker'].includes((session?.user as any)?.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">Create Tournament</h1>
          <Link
            href="/"
            className="px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 text-zinc-300 text-sm sm:text-base transition-colors w-full sm:w-auto text-center"
          >
            ← Back to Home
          </Link>
        </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(113, 113, 122, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(113, 113, 122, 0.8);
        }
      `}</style>

        <div className="mx-auto max-w-screen-2xl">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[500px_1fr] 2xl:grid-cols-[600px_1fr] gap-4 sm:gap-8">
            {/* Left Column - Tournament Setup */}
            <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              {/* Tournament Details */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Tournament Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Tournament Name
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="e.g., HOI4 World Championship 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Bracket Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {([4, 8, 16, 32] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setBracketSize(size);
                        // Clear selected players if exceeding new bracket size
                        if (selectedPlayers.length > size) {
                          setSelectedPlayers(selectedPlayers.slice(0, size));
                        }
                      }}
                      className={`px-4 py-3 border-2 rounded-lg transition-all font-semibold ${
                        bracketSize === size
                          ? 'border-amber-500 bg-amber-900/30 text-amber-400'
                          : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      {size} Players
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  {bracketSize === 4 && 'Semi-finals → Finals (2 rounds)'}
                  {bracketSize === 8 && 'Quarter-finals → Semi-finals → Finals (3 rounds)'}
                  {bracketSize === 16 && 'Round of 16 → Quarter-finals → Semi-finals → Finals (4 rounds)'}
                  {bracketSize === 32 && 'Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Finals (5 rounds)'}
                </p>
              </div>
            </div>
              </div>

              {/* Player Selection */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-zinc-100 mb-4">
                  Select Players ({selectedPlayers.length}/{bracketSize})
                </h2>

                <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg text-blue-300 text-sm">
                  <p className="font-semibold mb-2">Two options:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Select 0 players:</strong> Tournament opens for player signups</li>
                    <li><strong>Select {bracketSize} players:</strong> Tournament starts with pre-selected players</li>
                  </ul>
                </div>

                {users.length < bracketSize && (
                  <div className="mb-4 p-4 bg-amber-900/20 border border-amber-800 rounded-lg text-amber-300 text-sm">
                    You have {users.length} users. Need at least {bracketSize} to pre-select all players.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {users.map((user) => {
                const isSelected = selectedPlayers.find(p => p.uuid === user.uuid);
                return (
                  <button
                    key={user.uuid}
                    onClick={() => togglePlayerSelection(user)}
                    disabled={!isSelected && selectedPlayers.length >= bracketSize}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-amber-500 bg-amber-900/30'
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                    } ${!isSelected && selectedPlayers.length >= bracketSize ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {user.discord_avatar && (
                        <img
                          src={user.discord_avatar}
                          alt={user.username}
                          className="w-8 h-8 rounded bg-zinc-700"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200 truncate">
                          {user.username}
                        </div>
                        <div className="text-xs text-zinc-500 capitalize">{user.role}</div>
                      </div>
                      {isSelected && (
                        <div className="text-amber-400">✓</div>
                      )}
                    </div>
                  </button>
                );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Nation Assignments */}
            <div className="space-y-6">
              {selectedPlayers.length > 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-zinc-100">
                        Nation Assignment
                      </h2>
                      <p className="text-sm text-zinc-400 mt-1">
                        Assign nations to {selectedPlayers.length} selected player{selectedPlayers.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Grid Layout - 2 columns max for spacious cards */}
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-3 custom-scrollbar">
                    {selectedPlayers.map((player, index) => (
                      <div key={player.uuid} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 hover:border-zinc-600 transition-colors">
                        {/* Player Info - Larger */}
                        <div className="flex items-center gap-4 mb-5">
                          <span className="text-zinc-400 font-mono text-sm bg-zinc-700 px-3 py-1.5 rounded font-semibold">
                            #{index + 1}
                          </span>
                          {player.discord_avatar && (
                            <img
                              src={player.discord_avatar}
                              alt={player.username}
                              className="w-12 h-12 rounded bg-zinc-700"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-zinc-100 truncate">
                              {player.username}
                            </div>
                            <div className="text-sm text-zinc-400 capitalize">{player.role}</div>
                          </div>
                        </div>

                        {/* Nation Selector - Full Width */}
                        <NationSelector
                          value={playerNations[player.uuid] || 'GER'}
                          onChange={(tag: string, ideology, nation) => handleNationChange(player.uuid, tag, ideology)}
                          placeholder="Select nation..."
                          compact={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
                  <div className="text-zinc-500 mb-2">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-400 mb-2">No Players Selected</h3>
                  <p className="text-sm text-zinc-500">
                    Select players from the left panel to assign nations
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Create Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 p-4 z-10">
            <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
              <div className="text-sm text-zinc-400">
                {selectedPlayers.length > 0 && selectedPlayers.length !== bracketSize && (
                  <span className="text-amber-400">⚠ Select exactly {bracketSize} players or 0 for open signups</span>
                )}
              </div>
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleCreateTournament}
                  disabled={
                    tournamentName.trim() === '' ||
                    (selectedPlayers.length > 0 && selectedPlayers.length !== bracketSize) ||
                    creating
                  }
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : selectedPlayers.length === 0 ? 'Create Tournament (Open Signups)' : 'Create Tournament (With Players)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
