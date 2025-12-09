const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'tournaments', '[id]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Update imports
content = content.replace(
  `import { getNationByTag, HOI4_NATIONS, getHistoricalFlagUrl } from '@/app/lib/hoi4Nations';`,
  `import NationSelector from '@/app/components/NationSelector';
import { HOI4Nation } from '@/app/lib/hoi4NationsComplete';`
);

// Replace Player 1 Nation Selection
content = content.replace(
  `{/* Player 1 Nation Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Player 1 Country
                </label>
                <select
                  value={editPlayer1Nation}
                  onChange={(e) => setEditPlayer1Nation(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700  text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  {HOI4_NATIONS.map((nation) => (
                    <option key={nation.tag} value={nation.tag}>
                      {nation.name} ({nation.tag})
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={getHistoricalFlagUrl(editPlayer1Nation)}
                    alt={getNationByTag(editPlayer1Nation)?.name || 'Flag'}
                    className="w-12 h-8 border border-zinc-600 object-cover"
                  />
                  <span className="text-xs text-zinc-500">1945 flag preview</span>
                </div>
              </div>`,
  `{/* Player 1 Nation Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Player 1 Nation
                </label>
                <NationSelector
                  value={editPlayer1Nation}
                  onChange={(tag: string, nation: HOI4Nation) => setEditPlayer1Nation(tag)}
                  placeholder="Select nation for Player 1..."
                />
              </div>`
);

// Replace Player 2 Nation Selection
content = content.replace(
  `{/* Player 2 Nation Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Player 2 Country
                </label>
                <select
                  value={editPlayer2Nation}
                  onChange={(e) => setEditPlayer2Nation(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700  text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  {HOI4_NATIONS.map((nation) => (
                    <option key={nation.tag} value={nation.tag}>
                      {nation.name} ({nation.tag})
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={getHistoricalFlagUrl(editPlayer2Nation)}
                    alt={getNationByTag(editPlayer2Nation)?.name || 'Flag'}
                    className="w-12 h-8 border border-zinc-600 object-cover"
                  />
                  <span className="text-xs text-zinc-500">1945 flag preview</span>
                </div>
              </div>`,
  `{/* Player 2 Nation Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Player 2 Nation
                </label>
                <NationSelector
                  value={editPlayer2Nation}
                  onChange={(tag: string, nation: HOI4Nation) => setEditPlayer2Nation(tag)}
                  placeholder="Select nation for Player 2..."
                />
              </div>`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Successfully updated tournament detail page with NationSelector!');
