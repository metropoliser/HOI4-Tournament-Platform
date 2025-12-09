const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'tournaments', 'create', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace the entire layout section with optimized version
const oldLayout = `      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">`;

const newLayout = `      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">`;

content = content.replace(oldLayout, newLayout);

// Optimize nation assignment section - use grid instead of vertical list
const oldNationSection = `          {/* Nation Assignment for Selected Players */}
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
                        onChange={(tag: string, ideology, nation) => handleNationChange(player.uuid, tag, ideology)}
                        placeholder="Select nation..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}`;

const newNationSection = `          {/* Nation Assignment for Selected Players */}
          {selectedPlayers.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">
                    Nation Assignment
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {selectedPlayers.length}/{bracketSize} players selected
                  </p>
                </div>
                <div className="text-xs text-zinc-500 bg-zinc-800 px-3 py-2 rounded">
                  Scroll to see all players
                </div>
              </div>

              {/* Grid Layout - 2 columns for better space usage */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedPlayers.map((player, index) => (
                  <div key={player.uuid} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-colors">
                    {/* Player Info - Compact */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-zinc-500 font-mono text-xs bg-zinc-700 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      {player.discord_avatar && (
                        <img
                          src={player.discord_avatar}
                          alt={player.username}
                          className="w-8 h-8 rounded bg-zinc-700"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200 truncate">
                          {player.username}
                        </div>
                        <div className="text-xs text-zinc-500 capitalize">{player.role}</div>
                      </div>
                    </div>

                    {/* Nation Selector - Full Width */}
                    <NationSelector
                      value={playerNations[player.uuid] || 'GER'}
                      onChange={(tag: string, ideology, nation) => handleNationChange(player.uuid, tag, ideology)}
                      placeholder="Select nation..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}`;

content = content.replace(oldNationSection, newNationSection);

// Add custom scrollbar styles
const styleSection = `      <main className="container mx-auto px-6 py-8">`;
const styleWithCSS = `      <style jsx global>{\`
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
      \`}</style>
      <main className="container mx-auto px-6 py-8">`;

content = content.replace(styleSection, styleWithCSS);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Optimized tournament create page layout!');
console.log('   - Changed max-width from 4xl to 7xl');
console.log('   - 2-column grid layout for nation assignments');
console.log('   - Max height with scroll (600px)');
console.log('   - Custom dark scrollbar');
console.log('   - More compact player cards');
