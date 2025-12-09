import { Player } from '../types/tournament';
import FlagIcon from './FlagIcon';

interface PlayerCardProps {
  player: Player | null;
  isWinner?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
}

export default function PlayerCard({ player, isWinner, isClickable, onClick }: PlayerCardProps) {
  if (!player) {
    return (
      <div className="h-16 rounded border-2 border-dashed border-zinc-700 bg-zinc-900/50 flex items-center justify-center">
        <span className="text-zinc-600 text-sm">TBD</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        h-16 w-full rounded border-2 transition-all duration-200
        ${isWinner
          ? 'border-amber-500 bg-gradient-to-r from-amber-900/40 to-amber-800/30 shadow-lg shadow-amber-500/20'
          : 'border-zinc-700 bg-gradient-to-r from-zinc-800 to-zinc-900'
        }
        ${isClickable
          ? 'hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 cursor-pointer'
          : 'cursor-default'
        }
        flex items-center gap-3 px-3
      `}
    >
      {/* Nation Flag */}
      <FlagIcon tag={player.countryTag.split('_')[0]} ideology={player.countryTag.includes('_') ? player.countryTag.split('_').slice(1).join('_') as any : undefined} size="medium" />

      {/* Player Info */}
      <div className="flex-1 text-left min-w-0">
        <div className={`font-semibold text-sm truncate ${isWinner ? 'text-amber-200' : 'text-zinc-200'}`}>
          {player.name}
        </div>
        <div className="text-xs text-zinc-500 truncate">{player.country || 'Player'}</div>
      </div>

      {/* Winner Badge */}
      {isWinner && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-500 text-amber-950">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}
