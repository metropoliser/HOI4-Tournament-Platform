import { Match as MatchType } from '../types/tournament';
import { getRoundName } from '../lib/tournamentData';
import Match from './Match';

interface BracketProps {
  matches: MatchType[];
  currentRound: number;
  onSelectWinner: (matchId: string, playerId: string) => void;
  onResetMatch?: (matchId: string) => void;
  onEditPlayers?: (matchId: string, player1Uuid: string, player2Uuid: string) => void;
  canEdit?: boolean;
}

export default function Bracket({ matches, currentRound, onSelectWinner, onResetMatch, onEditPlayers, canEdit = true }: BracketProps) {
  const getMatchesByRound = (round: number) => {
    return matches.filter(m => m.round === round);
  };

  // Get total number of rounds dynamically
  const totalRounds = matches.length > 0 ? Math.max(...matches.map(m => m.round)) : 0;

  // Precise calculations for perfect bracket alignment
  const matchHeight = 266; // Height of each match card (header + players + footer)
  const r1Gap = 24; // Gap between Round 1 matches (gap-6 = 24px)

  // Calculate spacing for each round dynamically
  const calculateSpacing = () => {
    const spacing: { marginTop: number; gap: number }[] = [];

    for (let round = 1; round <= totalRounds; round++) {
      if (round === 1) {
        spacing.push({ marginTop: 0, gap: r1Gap });
      } else {
        const prevSpacing = spacing[round - 2];
        // Calculate where the center between two adjacent previous matches is
        // First match center: prevMarginTop + matchHeight/2
        // Second match center: prevMarginTop + matchHeight + gap + matchHeight/2
        // Midpoint between their centers: (first + second) / 2 = prevMarginTop + matchHeight + gap/2
        const midpointBetweenCenters = prevSpacing.marginTop + matchHeight + (prevSpacing.gap / 2);
        // Position this match so its center is at that midpoint
        const marginTop = midpointBetweenCenters - (matchHeight / 2);
        // Gap between matches in this round (edge-to-edge, not center-to-center)
        const gap = matchHeight + 2 * prevSpacing.gap;
        spacing.push({ marginTop, gap });
      }
    }

    return spacing;
  };

  const spacing = calculateSpacing();
  const rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className="w-full overflow-x-auto pb-8">
      <div className="min-w-max flex gap-8 px-8">
        {rounds.map((round) => {
          const roundMatches = getMatchesByRound(round);
          const isFinalRound = round === totalRounds;
          const { marginTop, gap } = spacing[round - 1];

          return (
            <div key={round} className="flex flex-col">
              <div className="mb-6 text-center">
                <h3 className={`text-lg font-bold mb-1 ${isFinalRound ? 'text-amber-400' : 'text-zinc-200'}`}>
                  {getRoundName(round, totalRounds)}
                </h3>
                <div className={`text-sm ${currentRound === round ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {currentRound === round ? '● ACTIVE' : '○'}
                </div>
              </div>
              <div
                className="flex flex-col"
                style={round === 1 ? { gap: `${gap}px` } : { marginTop: `${marginTop}px`, gap: `${gap}px` }}
              >
                {roundMatches.map(match => (
                  <div key={match.id} className="relative">
                    <Match
                      match={match}
                      onSelectWinner={(playerId) => onSelectWinner(match.id, playerId)}
                      onResetMatch={onResetMatch ? () => onResetMatch(match.id) : undefined}
                      onEditPlayers={onEditPlayers ? (matchId, p1, p2) => onEditPlayers(matchId, p1, p2) : undefined}
                      showConnector={isFinalRound ? undefined : 'right'}
                      canEdit={canEdit}
                    />
                    {/* Champion Trophy for winner of final round */}
                    {isFinalRound && match.winner && (
                      <div className="absolute -right-16 top-1/2 -translate-y-1/2">
                        <div className="flex flex-col items-center">
                          <div className="text-5xl">🏆</div>
                          <div className="text-xs text-amber-400 font-bold mt-1">CHAMPION</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
