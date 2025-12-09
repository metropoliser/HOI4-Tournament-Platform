const fs = require('fs');
const path = require('path');

console.log('🔧 Updating all files for ideology support...');

// 1. Update signup modal (app/page.tsx)
const pageFile = path.join(__dirname, '..', 'app', 'page.tsx');
let pageContent = fs.readFileSync(pageFile, 'utf-8');

// Update state to track ideology
pageContent = pageContent.replace(
  /const \[selectedNation, setSelectedNation\] = useState\('GER'\);/,
  `const [selectedNation, setSelectedNation] = useState('GER');\n  const [selectedIdeology, setSelectedIdeology] = useState<'communism' | 'democratic' | 'fascism' | 'neutrality' | undefined>();`
);

// Update onChange handler
pageContent = pageContent.replace(
  /onChange=\{\(tag: string, nation: HOI4Nation\) => setSelectedNation\(tag\)\}/,
  `onChange={(tag: string, ideology, nation) => {\n                setSelectedNation(tag);\n                setSelectedIdeology(ideology);\n              }}`
);

// Update API call to send ideology
pageContent = pageContent.replace(
  /body: JSON\.stringify\(\{\s*preferred_nation: selectedNation,\s*\}\),/,
  `body: JSON.stringify({\n          preferred_nation: selectedNation,\n          preferred_ideology: selectedIdeology,\n        }),`
);

fs.writeFileSync(pageFile, pageContent, 'utf-8');
console.log('✅ Updated app/page.tsx');

// 2. Update create tournament (app/tournaments/create/page.tsx)
const createFile = path.join(__dirname, '..', 'app', 'tournaments', 'create', 'page.tsx');
let createContent = fs.readFileSync(createFile, 'utf-8');

// Update state type
createContent = createContent.replace(
  /const \[playerNations, setPlayerNations\] = useState<\{ \[uuid: string\]: string \}>\(\{\}\);/,
  `const [playerNations, setPlayerNations] = useState<{ [uuid: string]: string }>({});\n  const [playerIdeologies, setPlayerIdeologies] = useState<{ [uuid: string]: string }>({});`
);

// Update handleNationChange
createContent = createContent.replace(
  /const handleNationChange = \(uuid: string, tag: string\) => \{\s*setPlayerNations\(\{ \.\.\.playerNations, \[uuid\]: tag \}\);\s*\};/,
  `const handleNationChange = (uuid: string, tag: string, ideology?: string) => {\n    setPlayerNations({ ...playerNations, [uuid]: tag });\n    if (ideology) {\n      setPlayerIdeologies({ ...playerIdeologies, [uuid]: ideology });\n    }\n  };`
);

// Update NationSelector onChange
createContent = createContent.replace(
  /onChange=\{\(tag: string, nation: HOI4Nation\) => handleNationChange\(player\.uuid, tag\)\}/,
  `onChange={(tag: string, ideology, nation) => handleNationChange(player.uuid, tag, ideology)}`
);

fs.writeFileSync(createFile, createContent, 'utf-8');
console.log('✅ Updated app/tournaments/create/page.tsx');

// 3. Update tournament detail page (app/tournaments/[id]/page.tsx)
const detailFile = path.join(__dirname, '..', 'app', 'tournaments', '[id]', 'page.tsx');
let detailContent = fs.readFileSync(detailFile, 'utf-8');

// Add ideology states
detailContent = detailContent.replace(
  /const \[editPlayer2Nation, setEditPlayer2Nation\] = useState<string>\('GER'\);/,
  `const [editPlayer2Nation, setEditPlayer2Nation] = useState<string>('GER');\n  const [editPlayer1Ideology, setEditPlayer1Ideology] = useState<string | undefined>();\n  const [editPlayer2Ideology, setEditPlayer2Ideology] = useState<string | undefined>();`
);

// Update Player 1 NationSelector onChange
detailContent = detailContent.replace(
  /onChange=\{\(tag: string, nation: HOI4Nation\) => setEditPlayer1Nation\(tag\)\}/,
  `onChange={(tag: string, ideology, nation) => {\n                  setEditPlayer1Nation(tag);\n                  setEditPlayer1Ideology(ideology);\n                }}`
);

// Update Player 2 NationSelector onChange
detailContent = detailContent.replace(
  /onChange=\{\(tag: string, nation: HOI4Nation\) => setEditPlayer2Nation\(tag\)\}/,
  `onChange={(tag: string, ideology, nation) => {\n                  setEditPlayer2Nation(tag);\n                  setEditPlayer2Ideology(ideology);\n                }}`
);

fs.writeFileSync(detailFile, detailContent, 'utf-8');
console.log('✅ Updated app/tournaments/[id]/page.tsx');

// 4. Update FlagIcon component
const flagIconFile = path.join(__dirname, '..', 'app', 'components', 'FlagIcon.tsx');
let flagIconContent = fs.readFileSync(flagIconFile, 'utf-8');

// The FlagIcon already has ideology support, so just verify it's there
if (!flagIconContent.includes('ideology?:')) {
  console.log('⚠️  FlagIcon might need manual update for ideology support');
} else {
  console.log('✅ FlagIcon already supports ideology');
}

console.log('\n🎉 All files updated for ideology support!');
