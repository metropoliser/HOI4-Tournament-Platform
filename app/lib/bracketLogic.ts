import { Match, Player, Tournament } from '../types/tournament';

export function selectWinner(
  tournament: Tournament,
  matchId: string,
  winnerId: string
): Tournament {
  const updatedMatches = [...tournament.matches];
  const matchIndex = updatedMatches.findIndex(m => m.id === matchId);

  if (matchIndex === -1) return tournament;

  const match = updatedMatches[matchIndex];
  const winner = match.player1?.id === winnerId ? match.player1 : match.player2;

  if (!winner) return tournament;

  // Update current match
  updatedMatches[matchIndex] = {
    ...match,
    winner,
    status: 'completed',
  };

  // Advance winner to next round
  const nextRound = match.round + 1;
  if (nextRound <= 4) {
    const nextMatchNumber = Math.ceil(match.matchNumber / 2);
    const nextMatchIndex = updatedMatches.findIndex(
      m => m.round === nextRound && m.matchNumber === nextMatchNumber
    );

    if (nextMatchIndex !== -1) {
      const nextMatch = updatedMatches[nextMatchIndex];
      const isPlayer1Slot = match.matchNumber % 2 === 1;

      updatedMatches[nextMatchIndex] = {
        ...nextMatch,
        player1: isPlayer1Slot ? winner : nextMatch.player1,
        player2: !isPlayer1Slot ? winner : nextMatch.player2,
      };
    }
  }

  // Check if round is completed and update current round
  const currentRoundMatches = updatedMatches.filter(m => m.round === tournament.currentRound);
  const allCompleted = currentRoundMatches.every(m => m.status === 'completed');

  const newCurrentRound = allCompleted && tournament.currentRound < 4
    ? tournament.currentRound + 1
    : tournament.currentRound;

  // Check if tournament is completed
  const finalMatch = updatedMatches.find(m => m.round === 4);
  const tournamentStatus = finalMatch?.status === 'completed'
    ? 'completed'
    : 'in_progress';

  return {
    ...tournament,
    matches: updatedMatches,
    currentRound: newCurrentRound,
    status: tournamentStatus,
  };
}

export function resetMatch(tournament: Tournament, matchId: string): Tournament {
  const updatedMatches = [...tournament.matches];
  const matchIndex = updatedMatches.findIndex(m => m.id === matchId);

  if (matchIndex === -1) return tournament;

  const match = updatedMatches[matchIndex];

  // Reset current match
  updatedMatches[matchIndex] = {
    ...match,
    winner: null,
    status: 'pending',
  };

  // Remove winner from next round
  const nextRound = match.round + 1;
  if (nextRound <= 4 && match.winner) {
    const nextMatchNumber = Math.ceil(match.matchNumber / 2);
    const nextMatchIndex = updatedMatches.findIndex(
      m => m.round === nextRound && m.matchNumber === nextMatchNumber
    );

    if (nextMatchIndex !== -1) {
      const nextMatch = updatedMatches[nextMatchIndex];
      const isPlayer1Slot = match.matchNumber % 2 === 1;

      updatedMatches[nextMatchIndex] = {
        ...nextMatch,
        player1: isPlayer1Slot ? null : nextMatch.player1,
        player2: !isPlayer1Slot ? null : nextMatch.player2,
        winner: null,
        status: 'pending',
      };
    }
  }

  return {
    ...tournament,
    matches: updatedMatches,
  };
}

export function getMatchesByRound(matches: Match[], round: number): Match[] {
  return matches.filter(m => m.round === round);
}
