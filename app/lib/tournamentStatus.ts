// Tournament status utilities

export type TournamentStatus = 'not_started' | 'in_progress' | 'completed';

export interface StatusDisplay {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function getStatusDisplay(status: string, hasMatches: boolean = false): StatusDisplay {
  switch (status) {
    case 'not_started':
      return {
        label: hasMatches ? 'NOT STARTED' : 'SIGNUP PHASE',
        shortLabel: hasMatches ? 'Not Started' : 'Signup',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
      };
    case 'in_progress':
      return {
        label: 'RUNNING',
        shortLabel: 'Running',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
      };
    case 'completed':
      return {
        label: 'FINISHED',
        shortLabel: 'Finished',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
      };
    default:
      return {
        label: status.toUpperCase().replace('_', ' '),
        shortLabel: status,
        color: 'text-zinc-400',
        bgColor: 'bg-zinc-500/20',
        borderColor: 'border-zinc-500/30',
      };
  }
}

export function getStatusBadgeClass(status: string): string {
  const display = getStatusDisplay(status);
  return `${display.bgColor} ${display.color} border ${display.borderColor}`;
}
