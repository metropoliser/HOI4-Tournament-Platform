'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { getStatusDisplay, getStatusBadgeClass } from '../lib/tournamentStatus';
import NationSelector from '../components/NationSelector';
import Navbar from '../components/Navbar';

interface Tournament {
  id: string;
  name: string;
  status: string;
  current_round: number;
  created_by: string;
  created_at: string;
  bracket_size?: number;
  is_main?: number;
}

interface Match {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  status: string;
}

interface Signup {
  id: string;
  user_uuid: string;
  username: string;
  discord_username: string;
  discord_avatar: string;
}

interface TournamentWithMatches extends Tournament {
  matches?: Match[];
  liveMatchCount?: number;
  completedMatchCount?: number;
  totalMatchCount?: number;
  signups?: Signup[];
  signupCount?: number;
  isUserSignedUp?: boolean;
}

export default function TournamentsPage() {
  const { data: session, status } = useSession();
  const [tournaments, setTournaments] = useState<TournamentWithMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedTournamentForSignup, setSelectedTournamentForSignup] = useState<string | null>(null);
  const [selectedNation, setSelectedNation] = useState('GER');
  const [selectedIdeology, setSelectedIdeology] = useState<'communism' | 'democratic' | 'fascism' | 'neutrality' | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    // PERFORMANCE: Use AbortController to prevent memory leaks
    const abortController = new AbortController();

    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/tournaments', { signal: abortController.signal });
        const data = await response.json();
        const tournamentsData = data.tournaments || [];

        // Fetch matches and signups for each tournament
        const tournamentsWithMatches = await Promise.all(
          tournamentsData.map(async (tournament: Tournament) => {
            try {
              const [matchesResponse, signupsResponse] = await Promise.all([
                fetch(`/api/tournaments/${tournament.id}`, { signal: abortController.signal }),
                fetch(`/api/tournaments/${tournament.id}/signups`, { signal: abortController.signal }),
              ]);

              const matchesData = await matchesResponse.json();
              const signupsData = await signupsResponse.json();

              const matches = matchesData.matches || [];
              const signups = signupsData.signups || [];

              const liveMatchCount = matches.filter((m: Match) => m.status === 'in_progress').length;
              const completedMatchCount = matches.filter((m: Match) => m.status === 'completed').length;
              const totalMatchCount = matches.length;
              const signupCount = signups.length;

              const userUuid = session?.user ? (session.user as any).id : null;
              const isUserSignedUp = userUuid ? signups.some((s: Signup) => s.user_uuid === userUuid) : false;

              return {
                ...tournament,
                matches,
                signups,
                liveMatchCount,
                completedMatchCount,
                totalMatchCount,
                signupCount,
                isUserSignedUp,
              };
            } catch (error) {
              if ((error as Error).name === 'AbortError') return tournament;
              console.error(`Error fetching data for tournament ${tournament.id}:`, error);
              return tournament;
            }
          })
        );

        setTournaments(tournamentsWithMatches);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments(); // Initial fetch
    // PERFORMANCE: Reduced from 10s to 30s to minimize API load
    const interval = setInterval(fetchTournaments, 30000);

    return () => {
      abortController.abort(); // Cancel in-flight requests
      clearInterval(interval);
    };
  }, [session, refreshTrigger]);

  const openSignupModal = (tournamentId: string) => {
    setSelectedTournamentForSignup(tournamentId);
    setSelectedNation('GER'); // Reset to default
    setShowSignupModal(true);
  };

  const handleSignup = async () => {
    if (!selectedTournamentForSignup) return;

    try {
      const response = await fetch(`/api/tournaments/${selectedTournamentForSignup}/signups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_nation: selectedIdeology ? `${selectedNation}_${selectedIdeology}` : selectedNation,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to sign up');
        return;
      }

      // Close modal and refresh tournaments
      setShowSignupModal(false);
      setSelectedTournamentForSignup(null);
      triggerRefresh();
    } catch (error) {
      console.error('Error signing up:', error);
      alert('Failed to sign up for tournament');
    }
  };

  const handleCancelSignup = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to cancel your signup?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/signups`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to cancel signup');
        return;
      }

      // Refresh tournaments to update signup status
      triggerRefresh();
    } catch (error) {
      console.error('Error cancelling signup:', error);
      alert('Failed to cancel signup');
    }
  };


  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />
      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">Tournaments</h2>
            {session && ['admin', 'matchmaker'].includes((session.user as any)?.role) && (
              <Link
                href="/tournaments/create"
                className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm sm:text-base font-semibold transition-colors w-full sm:w-auto text-center"
              >
                + Create Tournament
              </Link>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-zinc-400">Loading tournaments...</div>
          ) : tournaments.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800  p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Tournaments Yet</h3>
              <p className="text-zinc-500 mb-6">
                {session && ['admin', 'matchmaker'].includes((session.user as any)?.role)
                  ? 'Create your first tournament to get started!'
                  : 'No tournaments have been created yet. Check back later!'}
              </p>
              {session && ['admin', 'matchmaker'].includes((session.user as any)?.role) && (
                <Link
                  href="/tournaments/create"
                  className="inline-block px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold  transition-colors"
                >
                  Create Tournament
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-zinc-900/50 border border-zinc-800  p-6 transition-all relative overflow-hidden flex flex-col"
                >
                  {/* Live Indicator */}
                  {tournament.liveMatchCount! > 0 && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-xs font-bold flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full  bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex  h-2 w-2 bg-red-500"></span>
                      </span>
                      LIVE
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-zinc-100 mb-2 pr-12">{tournament.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {tournament.bracket_size && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30  text-xs font-semibold">
                          {tournament.bracket_size} Players
                        </span>
                      )}
                      {tournament.is_main === 1 && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30  text-xs font-semibold">
                          Main
                        </span>
                      )}
                      <span className={`px-2 py-1  text-xs font-semibold ${getStatusBadgeClass(tournament.status)}`}>
                        {getStatusDisplay(tournament.status, (tournament.totalMatchCount || 0) > 0).label}
                      </span>
                    </div>
                  </div>

                  {/* Match Statistics */}
                  {tournament.totalMatchCount! > 0 && (
                    <div className="mb-4 bg-zinc-800/50 border border-zinc-700  p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-400">Progress</span>
                        <span className="text-xs font-semibold text-zinc-300">
                          {tournament.completedMatchCount}/{tournament.totalMatchCount}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-700  h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all duration-500"
                          style={{ width: `${(tournament.completedMatchCount! / tournament.totalMatchCount!) * 100}%` }}
                        />
                      </div>
                      {tournament.liveMatchCount! > 0 && (
                        <div className="mt-2 text-xs text-red-400 font-semibold flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full  bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex  h-1.5 w-1.5 bg-red-500"></span>
                          </span>
                          {tournament.liveMatchCount} live
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signup Section for logged-in users */}
                  {session && tournament.status === 'not_started' && tournament.totalMatchCount === 0 && (
                    <div className="mb-3 bg-blue-900/20 border border-blue-800  p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-300">Signups</span>
                        <span className="text-xs text-blue-400">
                          {tournament.signupCount}/{tournament.bracket_size}
                        </span>
                      </div>
                      <div className="w-full bg-blue-900/30  h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all duration-500"
                          style={{ width: `${((tournament.signupCount || 0) / (tournament.bracket_size || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Created:</span>
                      <span className="text-zinc-300">{new Date(tournament.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto pt-3 border-t border-zinc-700 space-y-2">
                    {session && tournament.status === 'not_started' && tournament.totalMatchCount === 0 && (
                      tournament.isUserSignedUp ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelSignup(tournament.id);
                          }}
                          className="w-full px-3 py-2 bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold transition-colors"
                        >
                          Cancel Signup
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSignupModal(tournament.id);
                          }}
                          disabled={(tournament.signupCount || 0) >= (tournament.bracket_size || 0)}
                          className="w-full px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {(tournament.signupCount || 0) >= (tournament.bracket_size || 0) ? 'Tournament Full' : 'Sign Up'}
                        </button>
                      )
                    )}
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      className="block w-full px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors text-center"
                    >
                      View Tournament →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Sign Up for Tournament</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Select Your Preferred Nation
              </label>
              <p className="text-xs text-zinc-500 mb-3">
                Choose the nation you'd like to play. The matchmaker will try to assign your preference, but it's not guaranteed.
              </p>
              <NationSelector
                value={selectedNation}
                onChange={(tag: string, ideology, nation) => {
                setSelectedNation(tag);
                setSelectedIdeology(ideology as 'communism' | 'democratic' | 'fascism' | 'neutrality' | undefined);
              }}
                placeholder="Select a nation..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSignupModal(false);
                  setSelectedTournamentForSignup(null);
                }}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignup}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors"
              >
                Confirm Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
