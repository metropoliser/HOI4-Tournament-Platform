import { Player, Match, Tournament } from '../types/tournament';

// Sample players representing HOI4 nations
export const samplePlayers: Player[] = [
  { id: '1', name: 'General Schmidt', country: 'Germany', countryCode: 'DE', countryTag: 'GER', seed: 1 },
  { id: '2', name: 'Commander Ivanov', country: 'Soviet Union', countryCode: 'RU', countryTag: 'SOV', seed: 2 },
  { id: '3', name: 'General Patton', country: 'United States', countryCode: 'US', countryTag: 'USA', seed: 3 },
  { id: '4', name: 'Marshal Churchill', country: 'United Kingdom', countryCode: 'GB', countryTag: 'ENG', seed: 4 },
  { id: '5', name: 'Generale Romano', country: 'Italy', countryCode: 'IT', countryTag: 'ITA', seed: 5 },
  { id: '6', name: 'General Yamamoto', country: 'Japan', countryCode: 'JP', countryTag: 'JAP', seed: 6 },
  { id: '7', name: 'Général Dubois', country: 'France', countryCode: 'FR', countryTag: 'FRA', seed: 7 },
  { id: '8', name: 'Commander Zhang', country: 'China', countryCode: 'CN', countryTag: 'CHI', seed: 8 },
  { id: '9', name: 'General MacArthur', country: 'Australia', countryCode: 'AU', countryTag: 'AST', seed: 9 },
  { id: '10', name: 'Marshal Tito', country: 'Yugoslavia', countryCode: 'RS', countryTag: 'YUG', seed: 10 },
  { id: '11', name: 'General Franco', country: 'Spain', countryCode: 'ES', countryTag: 'SPR', seed: 11 },
  { id: '12', name: 'Commander Silva', country: 'Brazil', countryCode: 'BR', countryTag: 'BRA', seed: 12 },
  { id: '13', name: 'General Nowak', country: 'Poland', countryCode: 'PL', countryTag: 'POL', seed: 13 },
  { id: '14', name: 'Marshal Antonescu', country: 'Romania', countryCode: 'RO', countryTag: 'ROM', seed: 14 },
  { id: '15', name: 'Commander Eriksson', country: 'Sweden', countryCode: 'SE', countryTag: 'SWE', seed: 15 },
  { id: '16', name: 'General Pasha', country: 'Turkey', countryCode: 'TR', countryTag: 'TUR', seed: 16 },
];

// Create initial matches for Round 1 (Round of 16)
function createInitialMatches(): Match[] {
  const matches: Match[] = [];

  // Round 1: 8 matches
  for (let i = 0; i < 8; i++) {
    matches.push({
      id: `r1-m${i + 1}`,
      round: 1,
      matchNumber: i + 1,
      player1: samplePlayers[i * 2],
      player2: samplePlayers[i * 2 + 1],
      winner: null,
      status: 'pending',
    });
  }

  // Round 2: 4 matches (Quarterfinals)
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

  // Round 3: 2 matches (Semifinals)
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

  // Round 4: 1 match (Grand Final)
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
}

export function createTournament(): Tournament {
  return {
    id: 'hoi4-tournament-2024',
    name: 'HOI4 World Championship',
    matches: createInitialMatches(),
    currentRound: 1,
    status: 'in_progress',
  };
}

export function getRoundName(round: number, totalRounds?: number): string {
  // If total rounds not provided, use legacy behavior for Round of 16 bracket
  if (!totalRounds) {
    switch (round) {
      case 1: return 'Round of 16';
      case 2: return 'Quarterfinals';
      case 3: return 'Semifinals';
      case 4: return 'Grand Final';
      default: return `Round ${round}`;
    }
  }

  // Dynamic naming based on total rounds
  const roundsFromEnd = totalRounds - round;

  switch (roundsFromEnd) {
    case 0: return 'Grand Final';
    case 1: return 'Semifinals';
    case 2: return 'Quarterfinals';
    case 3: return 'Round of 16';
    case 4: return 'Round of 32';
    default: return `Round ${round}`;
  }
}
