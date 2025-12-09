export interface Player {
  id: string;
  name: string;
  country: string;
  countryCode: string; // ISO code for flag (for backward compatibility)
  countryTag: string; // HOI4 nation tag (e.g., 'GER', 'SOV', 'USA')
  seed: number;
  avatar?: string; // Avatar URL
}

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  status: 'pending' | 'in_progress' | 'completed';
  scheduledTime?: string;
  completedAt?: string;
}

export interface Tournament {
  id: string;
  name: string;
  matches: Match[];
  currentRound: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export type RoundName = 'Round of 16' | 'Quarterfinals' | 'Semifinals' | 'Grand Final';
