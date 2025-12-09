import { Match as MatchType } from '../types/tournament';
import PlayerCard from './PlayerCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MatchProps {
  match: MatchType;
  onSelectWinner: (playerId: string) => void;
  onResetMatch?: () => void;
  onEditPlayers?: (matchId: string, player1Uuid: string, player2Uuid: string) => void;
  showConnector?: 'right' | 'none';
  canEdit?: boolean;
}

export default function Match({ match, onSelectWinner, onResetMatch, onEditPlayers, showConnector = 'none', canEdit = true }: MatchProps) {
  const canSelectWinner = canEdit && match.player1 && match.player2 && match.status !== 'completed';
  const isCompleted = match.status === 'completed';
  const isPending = match.status === 'pending';

  // Determine match status based on scheduled time
  const now = new Date();
  const scheduledTime = match.scheduledTime ? new Date(match.scheduledTime) : null;
  const isScheduled = scheduledTime && scheduledTime > now && !isCompleted;
  const isRunning = scheduledTime && scheduledTime <= now && !isCompleted;

  return (
    <div className="flex items-center gap-2">
      {/* Match Container */}
      <div className={`
        relative w-64 border-2 flex flex-col
        ${isCompleted ? 'border-zinc-700' : 'border-zinc-800'}
      `}>
        {/* Header - Match Number and Time */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 border-b border-zinc-800">
          <Badge className="bg-zinc-900 border-zinc-600 text-zinc-300 font-mono h-5">
            M{match.matchNumber}
          </Badge>
          {scheduledTime && (
            <span className="text-[11px] text-zinc-400 font-medium">
              {scheduledTime.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              {' '}
              {scheduledTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
          )}
        </div>

        {/* Match Card - Players */}
        <div className={`
          p-3 space-y-2 flex-1 flex flex-col justify-center
          ${isCompleted ? 'bg-zinc-900/80' : 'bg-zinc-900'}
        `}>
          <PlayerCard
            player={match.player1}
            isWinner={match.winner?.id === match.player1?.id}
            isClickable={!!canSelectWinner && !isCompleted}
            onClick={() => match.player1 && onSelectWinner(match.player1.id)}
          />

          {/* VS Divider */}
          <div className="flex items-center justify-center py-1">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="px-3 text-[10px] font-bold text-zinc-600">VS</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <PlayerCard
            player={match.player2}
            isWinner={match.winner?.id === match.player2?.id}
            isClickable={!!canSelectWinner && !isCompleted}
            onClick={() => match.player2 && onSelectWinner(match.player2.id)}
          />
        </div>

        {/* Footer - Status and Actions */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 border-t border-zinc-800">
          {/* Status Badge */}
          <div>
            {isCompleted && (
              <Badge className="bg-green-900 border-green-700 text-green-400 h-5">
                COMPLETED
              </Badge>
            )}
            {isRunning && (
              <Badge className="bg-amber-900 border-amber-700 text-amber-400 animate-pulse h-5">
                LIVE
              </Badge>
            )}
            {isScheduled && (
              <Badge className="bg-blue-900 border-blue-700 text-blue-400 h-5">
                SCHEDULED
              </Badge>
            )}
            {!isCompleted && !isRunning && !isScheduled && (
              <Badge className="bg-zinc-800 border-zinc-700 text-zinc-500 h-5">
                PENDING
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5">
            {isPending && canEdit && onEditPlayers && match.player1 && match.player2 && (
              <Badge
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPlayers(match.id, match.player1!.id, match.player2!.id);
                }}
                className="bg-blue-900/80 hover:bg-blue-900 border-blue-700 text-blue-300 cursor-pointer h-5"
              >
                EDIT
              </Badge>
            )}
            {isCompleted && canEdit && onResetMatch && (
              <Badge
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Reset this match? This will clear the winner and remove them from the next round.')) {
                    onResetMatch();
                  }
                }}
                className="bg-red-900/80 hover:bg-red-900 border-red-700 text-red-300 cursor-pointer h-5"
              >
                RESET
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Connector Line */}
      {showConnector === 'right' && (
        <div className="w-8 h-px bg-zinc-700" />
      )}
    </div>
  );
}
