'use client';

import { useState, useEffect } from 'react';
import { Player } from '../../types/tournament';
import { loadPlayers, addPlayer, updatePlayer, deletePlayer } from '../../lib/storage';

const COUNTRY_OPTIONS = [
  { name: 'Germany', code: 'DE', tag: 'GER' },
  { name: 'Soviet Union', code: 'RU', tag: 'SOV' },
  { name: 'United States', code: 'US', tag: 'USA' },
  { name: 'United Kingdom', code: 'GB', tag: 'ENG' },
  { name: 'Italy', code: 'IT', tag: 'ITA' },
  { name: 'Japan', code: 'JP', tag: 'JAP' },
  { name: 'France', code: 'FR', tag: 'FRA' },
  { name: 'China', code: 'CN', tag: 'CHI' },
  { name: 'Australia', code: 'AU', tag: 'AST' },
  { name: 'Yugoslavia', code: 'RS', tag: 'YUG' },
  { name: 'Spain', code: 'ES', tag: 'SPR' },
  { name: 'Brazil', code: 'BR', tag: 'BRA' },
  { name: 'Poland', code: 'PL', tag: 'POL' },
  { name: 'Romania', code: 'RO', tag: 'ROM' },
  { name: 'Sweden', code: 'SE', tag: 'SWE' },
  { name: 'Turkey', code: 'TR', tag: 'TUR' },
  { name: 'Canada', code: 'CA', tag: 'CAN' },
  { name: 'Mexico', code: 'MX', tag: 'MEX' },
  { name: 'Finland', code: 'FI', tag: 'FIN' },
  { name: 'Hungary', code: 'HU', tag: 'HUN' },
];

export default function PlayerManagement() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    country: 'Germany',
    countryCode: 'DE',
    countryTag: 'GER',
    seed: 1,
  });

  useEffect(() => {
    setPlayers(loadPlayers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // Update existing player
      const updatedPlayers = updatePlayer(editingId, {
        id: editingId,
        ...formData,
      });
      setPlayers(updatedPlayers);
      setEditingId(null);
    } else {
      // Add new player
      const newPlayer: Player = {
        id: `player-${Date.now()}`,
        ...formData,
      };
      const updatedPlayers = addPlayer(newPlayer);
      setPlayers(updatedPlayers);
      setIsAdding(false);
    }

    // Reset form
    setFormData({
      name: '',
      country: 'Germany',
      countryCode: 'DE',
      countryTag: 'GER',
      seed: players.length + 1,
    });
  };

  const handleEdit = (player: Player) => {
    setEditingId(player.id);
    setFormData({
      name: player.name,
      country: player.country,
      countryCode: player.countryCode,
      countryTag: player.countryTag,
      seed: player.seed,
    });
    setIsAdding(false);
  };

  const handleDelete = (playerId: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      const updatedPlayers = deletePlayer(playerId);
      setPlayers(updatedPlayers);
    }
  };

  const handleCountryChange = (countryName: string) => {
    const country = COUNTRY_OPTIONS.find(c => c.name === countryName);
    if (country) {
      setFormData({
        ...formData,
        country: country.name,
        countryCode: country.code,
        countryTag: country.tag,
      });
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      country: 'Germany',
      countryCode: 'DE',
      countryTag: 'GER',
      seed: players.length + 1,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Player Management</h2>
          <p className="text-zinc-400 mt-1">
            Add, edit, or remove players from your database
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
          >
            + Add Player
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">
            {editingId ? 'Edit Player' : 'Add New Player'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Player Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-500"
                  placeholder="Enter player name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-500"
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Seed Number
                </label>
                <input
                  type="number"
                  value={formData.seed}
                  onChange={(e) => setFormData({ ...formData, seed: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
              >
                {editingId ? 'Update Player' : 'Add Player'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Player List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Seed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {players.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    No players yet. Add your first player to get started!
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={player.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-700 text-zinc-300 text-sm font-bold">
                        {player.seed}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-zinc-200">{player.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/w40/${player.countryCode.toLowerCase()}.png`}
                          alt={player.country}
                          className="w-6 h-4 rounded border border-zinc-600"
                        />
                        <span className="text-sm text-zinc-300">{player.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(player)}
                        className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(player.id)}
                        className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-200 text-sm rounded transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <div className="text-sm text-zinc-400">
          Total Players: <span className="font-semibold text-zinc-200">{players.length}</span>
        </div>
      </div>
    </div>
  );
}
