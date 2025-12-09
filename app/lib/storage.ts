import { Player, Tournament } from '../types/tournament';

const STORAGE_KEYS = {
  PLAYERS: 'hoi4_players',
  TOURNAMENTS: 'hoi4_tournaments',
  ACTIVE_TOURNAMENT: 'hoi4_active_tournament',
};

// Player Storage
export function savePlayers(players: Player[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  }
}

export function loadPlayers(): Player[] {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    return data ? JSON.parse(data) : [];
  }
  return [];
}

export function addPlayer(player: Player): Player[] {
  const players = loadPlayers();
  players.push(player);
  savePlayers(players);
  return players;
}

export function updatePlayer(playerId: string, updatedPlayer: Player): Player[] {
  const players = loadPlayers();
  const index = players.findIndex(p => p.id === playerId);
  if (index !== -1) {
    players[index] = updatedPlayer;
    savePlayers(players);
  }
  return players;
}

export function deletePlayer(playerId: string): Player[] {
  const players = loadPlayers().filter(p => p.id !== playerId);
  savePlayers(players);
  return players;
}

// Tournament Storage
export function saveTournaments(tournaments: Tournament[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
  }
}

export function loadTournaments(): Tournament[] {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
    return data ? JSON.parse(data) : [];
  }
  return [];
}

export function saveTournament(tournament: Tournament): Tournament[] {
  const tournaments = loadTournaments();
  const index = tournaments.findIndex(t => t.id === tournament.id);

  if (index !== -1) {
    tournaments[index] = tournament;
  } else {
    tournaments.push(tournament);
  }

  saveTournaments(tournaments);
  return tournaments;
}

export function deleteTournament(tournamentId: string): Tournament[] {
  const tournaments = loadTournaments().filter(t => t.id !== tournamentId);
  saveTournaments(tournaments);

  // Clear active tournament if it was deleted
  const activeTournament = getActiveTournament();
  if (activeTournament?.id === tournamentId) {
    clearActiveTournament();
  }

  return tournaments;
}

// Active Tournament
export function setActiveTournament(tournament: Tournament): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TOURNAMENT, JSON.stringify(tournament));
  }
}

export function getActiveTournament(): Tournament | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOURNAMENT);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function clearActiveTournament(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TOURNAMENT);
  }
}

// Export/Import
export function exportData(): string {
  return JSON.stringify({
    players: loadPlayers(),
    tournaments: loadTournaments(),
    exportDate: new Date().toISOString(),
  }, null, 2);
}

export function importData(jsonData: string): void {
  try {
    const data = JSON.parse(jsonData);
    if (data.players) savePlayers(data.players);
    if (data.tournaments) saveTournaments(data.tournaments);
  } catch (error) {
    throw new Error('Invalid import data format');
  }
}
