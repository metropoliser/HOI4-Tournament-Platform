const fs = require('fs');
const path = require('path');

console.log('🔧 Final ideology updates...');

// 1. Update signup to send combined TAG_IDEOLOGY format
const pageFile = path.join(__dirname, '..', 'app', 'page.tsx');
let pageContent = fs.readFileSync(pageFile, 'utf-8');

pageContent = pageContent.replace(
  /body: JSON\.stringify\(\{\s*preferred_nation: selectedNation,\s*preferred_ideology: selectedIdeology,\s*\}\),/,
  `body: JSON.stringify({\n          preferred_nation: selectedIdeology ? \`\${selectedNation}_\${selectedIdeology}\` : selectedNation,\n        }),`
);

fs.writeFileSync(pageFile, pageContent, 'utf-8');
console.log('✅ Updated signup to send TAG_IDEOLOGY format');

// 2. Update create tournament to send combined format
const createFile = path.join(__dirname, '..', 'app', 'tournaments', 'create', 'page.tsx');
let createContent = fs.readFileSync(createFile, 'utf-8');

// Update createTournamentMatches to use combined format
createContent = createContent.replace(
  /player1_nation: playerNations\[player1\.uuid\] \|\| 'GER',\s*player2_nation: playerNations\[player2\.uuid\] \|\| 'GER',/,
  `player1_nation: playerIdeologies[player1.uuid] ? \`\${playerNations[player1.uuid]}_\${playerIdeologies[player1.uuid]}\` : (playerNations[player1.uuid] || 'GER'),\n        player2_nation: playerIdeologies[player2.uuid] ? \`\${playerNations[player2.uuid]}_\${playerIdeologies[player2.uuid]}\` : (playerNations[player2.uuid] || 'GER'),`
);

fs.writeFileSync(createFile, createContent, 'utf-8');
console.log('✅ Updated tournament creation to send TAG_IDEOLOGY format');

// 3. Update match editing to send combined format
const detailFile = path.join(__dirname, '..', 'app', 'tournaments', '[id]', 'page.tsx');
let detailContent = fs.readFileSync(detailFile, 'utf-8');

// Find and update the PATCH request for match editing
detailContent = detailContent.replace(
  /body: JSON\.stringify\(\{\s*player1_uuid: editPlayer1,\s*player2_uuid: editPlayer2,\s*player1_nation: editPlayer1Nation,\s*player2_nation: editPlayer2Nation,\s*\}\),/,
  `body: JSON.stringify({\n          player1_uuid: editPlayer1,\n          player2_uuid: editPlayer2,\n          player1_nation: editPlayer1Ideology ? \`\${editPlayer1Nation}_\${editPlayer1Ideology}\` : editPlayer1Nation,\n          player2_nation: editPlayer2Ideology ? \`\${editPlayer2Nation}_\${editPlayer2Ideology}\` : editPlayer2Nation,\n        }),`
);

fs.writeFileSync(detailFile, detailContent, 'utf-8');
console.log('✅ Updated match editing to send TAG_IDEOLOGY format');

// 4. Update PlayerCard to parse and display ideology
const playerCardFile = path.join(__dirname, '..', 'app', 'components', 'PlayerCard.tsx');
let playerCardContent = fs.readFileSync(playerCardFile, 'utf-8');

// Update FlagIcon to parse ideology from countryTag
playerCardContent = playerCardContent.replace(
  /<FlagIcon tag=\{player\.countryTag\} size="medium" \/>/,
  `<FlagIcon tag={player.countryTag.split('_')[0]} ideology={player.countryTag.includes('_') ? player.countryTag.split('_').slice(1).join('_') as any : undefined} size="medium" />`
);

fs.writeFileSync(playerCardFile, playerCardContent, 'utf-8');
console.log('✅ Updated PlayerCard to parse ideology from countryTag');

console.log('\n🎉 All ideology updates complete!');
console.log('   Nations are now stored as TAG or TAG_IDEOLOGY format');
console.log('   Flags will display the correct ideology variant');
