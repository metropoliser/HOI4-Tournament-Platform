'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Player, Tournament, Match } from '../../types/tournament';
import { loadPlayers, loadTournaments, saveTournament, deleteTournament, setActiveTournament } from '../../lib/storage';

export default function TournamentManagement() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  useEffect(() => {
    setTournaments(loadTournaments());
    setPlayers(loadPlayers());
  }, []);

  const togglePlayerSelection = (player: Player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else if (selectedPlayers.length < 16) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const createTournamentMatches = (players: Player[]): Match[] => {
    const matches: Match[] = [];

    // Round 1: 8 matches
    for (let i = 0; i < 8; i++) {
      matches.push({
        id: `r1-m${i + 1}`,
        round: 1,
        matchNumber: i + 1,
        player1: players[i * 2],
        player2: players[i * 2 + 1],
        winner: null,
        status: 'pending',
      });
    }

    // Round 2: 4 matches
    for (let i = 0; i < 4; i++) {
      matches.push({
        id: `r2-m${i + 1}`,
        round: 2,
        matchNumber: i + 1,
        player1: null,
        player2: null,
        winner: null,
        status: 'pending',
      });
    }

    // Round 3: 2 matches
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: `r3-m${i + 1}`,
        round: 3,
        matchNumber: i + 1,
        player1: null,
        player2: null,
        winner: null,
        status: 'pending',
      });
    }

    // Round 4: 1 match
    matches.push({
      id: 'r4-m1',
      round: 4,
      matchNumber: 1,
      player1: null,
      player2: null,
      winner: null,
      status: 'pending',
    });

    return matches;
  };

  const handleCreateTournament = () => {
    if (tournamentName.trim() === '' || selectedPlayers.length !== 16) {
      alert('Please enter a tournament name and select exactly 16 players');
      return;
    }

    const newTournament: Tournament = {
      id: `tournament-${Date.now()}`,
      name: tournamentName,
      matches: createTournamentMatches(selectedPlayers),
      currentRound: 1,
      status: 'not_started',
    };

    const updatedTournaments = saveTournament(newTournament);
    setTournaments(updatedTournaments);

    // Reset form
    setTournamentName('');
    setSelectedPlayers([]);
    setIsCreating(false);
  };

  const handleSetActive = (tournament: Tournament) => {
    setActiveTournament(tournament);
    router.push('/');
  };

  const handleDelete = (tournamentId: string) => {
    if (confirm('Are you sure you want to delete this tournament?')) {
      const updatedTournaments = deleteTournament(tournamentId);
      setTournaments(updatedTournaments);
    }
  };

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'not_started':
        return <span className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">Not Started</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-amber-900/50 text-amber-300 text-xs rounded">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded">Completed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Tournament Management</h2>
          <p className="text-zinc-400 mt-1">
            Create and manage HOI4 tournament brackets
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
          >
            + Create Tournament
          </button>
        )}
      </div>

      {/* Create Tournament Form */}
      {isCreating && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">Create New Tournament</h3>

          <div className="space-y-4">
            {/* Tournament Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Tournament Name
              </label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-500"
                placeholder="e.g., HOI4 World Championship 2024"
              />
            </div>

            {/* Player Selection */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Select 16 Players ({selectedPlayers.length}/16)
              </label>

              {players.length < 16 && (
                <div className="mb-4 p-4 bg-amber-900/20 border border-amber-800 rounded-lg text-amber-300 text-sm">
                  You need at least 16 players to create a tournament. Go to the Players tab to add more players.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto bg-zinc-800 p-4 rounded-lg">
                {players.map((player) => {
                  const isSelected = selectedPlayers.find(p => p.id === player.id);
                  return (
                    <button
                      key={player.id}
                      onClick={() => togglePlayerSelection(player)}
                      disabled={!isSelected && selectedPlayers.length >= 16}
                      className={`p-3 rounded border-2 transition-all text-left ${
                        isSelected
                          ? 'border-amber-500 bg-amber-900/30'
                          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                      } ${!isSelected && selectedPlayers.length >= 16 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/w40/${player.countryCode.toLowerCase()}.png`}
                          alt={player.country}
                          className="w-6 h-4 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-200 truncate">
                            {player.name}
                          </div>
                          <div className="text-xs text-zinc-500">{player.country}</div>
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

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setTournamentName('');
                  setSelectedPlayers([]);
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTournament}
                disabled={tournamentName.trim() === '' || selectedPlayers.length !== 16}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Tournament
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tournament List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-200">All Tournaments</h3>
        </div>

        <div className="divide-y divide-zinc-800">
          {tournaments.length === 0 ? (
            <div className="px-6 py-8 text-center text-zinc-500">
              No tournaments yet. Create your first tournament to get started!
            </div>
          ) : (
            tournaments.map((tournament) => (
              <div key={tournament.id} className="px-6 py-4 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-zinc-200">
                        {tournament.name}
                      </h4>
                      {getStatusBadge(tournament.status)}
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">
                      Round {tournament.currentRound} of 4 • {tournament.matches.filter(m => m.status === 'completed').length}/{tournament.matches.length} matches completed
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSetActive(tournament)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
                    >
                      View Bracket
                    </button>
                    <button
                      onClick={() => handleDelete(tournament.id)}
                      className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-zinc-400">Total Tournaments:</span>
            <span className="ml-2 font-semibold text-zinc-200">{tournaments.length}</span>
          </div>
          <div>
            <span className="text-zinc-400">Available Players:</span>
            <span className="ml-2 font-semibold text-zinc-200">{players.length}</span>
          </div>
          <div>
            <span className="text-zinc-400">Active Tournaments:</span>
            <span className="ml-2 font-semibold text-zinc-200">
              {tournaments.filter(t => t.status === 'in_progress').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
