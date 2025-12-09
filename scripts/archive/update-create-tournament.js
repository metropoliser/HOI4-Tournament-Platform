const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'tournaments', 'create', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

// Replace imports
let updated = content.replace(
  `import { HOI4_NATIONS } from '@/app/lib/hoi4Nations';`,
  `import NationSelector from '@/app/components/NationSelector';
import FlagIcon from '@/app/components/FlagIcon';
import { HOI4Nation } from '@/app/lib/hoi4NationsComplete';`
);

// Add playerNations state
updated = updated.replace(
  `const [selectedPlayers, setSelectedPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);`,
  `const [selectedPlayers, setSelectedPlayers] = useState<User[]>([]);
  const [playerNations, setPlayerNations] = useState<{ [uuid: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);`
);

// Update togglePlayerSelection
updated = updated.replace(
  `const togglePlayerSelection = (user: User) => {
    if (selectedPlayers.find(p => p.uuid === user.uuid)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.uuid !== user.uuid));
    } else if (selectedPlayers.length < bracketSize) {
      setSelectedPlayers([...selectedPlayers, user]);
    }
  };`,
  `const togglePlayerSelection = (user: User) => {
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

  const handleNationChange = (uuid: string, tag: string) => {
    setPlayerNations({ ...playerNations, [uuid]: tag });
  };`
);

// Update createTournamentMatches to use assigned nations
updated = updated.replace(
  `// Shuffle nations and assign to players
    const shuffledNations = [...HOI4_NATIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, size)
      .map(n => n.tag);

    // Round 1: Create matches with actual players and assigned nations
    const round1Matches = size / 2;
    for (let i = 0; i < round1Matches; i++) {
      matches.push({
        tournament_id: tournamentId,
        round: 1,
        match_number: i + 1,
        player1_uuid: players[i * 2].uuid,
        player2_uuid: players[i * 2 + 1].uuid,
        player1_nation: shuffledNations[i * 2],
        player2_nation: shuffledNations[i * 2 + 1],
        status: 'pending',
      });
    }`,
  `// Round 1: Create matches with actual players and assigned nations
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
        player1_nation: playerNations[player1.uuid] || 'GER',
        player2_nation: playerNations[player2.uuid] || 'GER',
        status: 'pending',
      });
    }`
);

// Update the UI section
updated = updated.replace(
  `{/* Selected Players Preview */}
          {selectedPlayers.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800  p-6 mb-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">Selected Players</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {selectedPlayers.map((player, index) => (
                  <div key={player.uuid} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-zinc-500">#{index + 1}</span>
                    <span className="truncate">{player.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}`,
  `{/* Nation Assignment for Selected Players */}
          {selectedPlayers.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800  p-6 mb-6">
              <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                Assign Nations to Players ({selectedPlayers.length}/{bracketSize})
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                Select which nation each player will play as in the tournament
              </p>
              <div className="space-y-3">
                {selectedPlayers.map((player, index) => (
                  <div key={player.uuid} className="flex items-center gap-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-zinc-500 font-mono text-sm">#{index + 1}</span>
                      {player.discord_avatar && (
                        <img
                          src={player.discord_avatar}
                          alt={player.username}
                          className="w-10 h-10 rounded bg-zinc-700"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200 truncate">
                          {player.username}
                        </div>
                        <div className="text-xs text-zinc-500 capitalize">{player.role}</div>
                      </div>
                    </div>
                    <div className="flex-1 max-w-md">
                      <NationSelector
                        value={playerNations[player.uuid] || 'GER'}
                        onChange={(tag: string, nation: HOI4Nation) => handleNationChange(player.uuid, tag)}
                        placeholder="Select nation..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}`
);

fs.writeFileSync(filePath, updated, 'utf-8');
console.log('✅ Successfully updated create tournament page!');
