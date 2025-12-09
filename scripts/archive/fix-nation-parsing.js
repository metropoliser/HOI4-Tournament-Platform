const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'tournaments', '[id]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Add helper function at the top of the component
const helperFunction = `
  // Helper to parse nation tag (handles TAG or TAG_IDEOLOGY format)
  const parseNationTag = (nationStr: string) => {
    if (!nationStr) return 'GER';
    const underscoreIndex = nationStr.indexOf('_');
    return underscoreIndex !== -1 ? nationStr.substring(0, underscoreIndex) : nationStr;
  };
`;

// Insert helper after the component declaration
content = content.replace(
  /(export default function TournamentDetailPage\(\) \{[^}]*const tournamentId = params\.id as string;)/,
  `$1${helperFunction}`
);

// Replace all HOI4_NATIONS[...] lookups that might have ideology
content = content.replace(
  /HOI4_NATIONS\[(match\.player1_nation \|\| 'GER')\]/g,
  'HOI4_NATIONS[parseNationTag(match.player1_nation || \'GER\')]'
);

content = content.replace(
  /HOI4_NATIONS\[(match\.player2_nation \|\| 'GER')\]/g,
  'HOI4_NATIONS[parseNationTag(match.player2_nation || \'GER\')]'
);

content = content.replace(
  /HOI4_NATIONS\[(signup\.preferred_nation \|\| 'GER')\]/g,
  'HOI4_NATIONS[parseNationTag(signup.preferred_nation || \'GER\')]'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Fixed nation tag parsing to handle TAG_IDEOLOGY format');
