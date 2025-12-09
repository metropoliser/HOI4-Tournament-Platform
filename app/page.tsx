'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import {
  Trophy,
  Gamepad2,
  Users,
  Calendar,
  ArrowRight,
  Activity,
  Tv,
  Newspaper,
  Star,
  Zap,
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  status: string;
  current_round: number;
  created_at: string;
  bracket_size?: number;
  is_main?: number;
}

interface CasualGame {
  id: string;
  name: string;
  description: string;
  status: string;
  scheduled_time: string;
  created_at: string;
  signups?: any[];
}

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  created_at: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [casualGames, setCasualGames] = useState<CasualGame[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // PERFORMANCE: Use AbortController to prevent memory leaks
    const abortController = new AbortController();

    const fetchAllData = async () => {
      try {
        const [tournamentsRes, casualRes, newsRes] = await Promise.all([
          fetch('/api/tournaments', { signal: abortController.signal }),
          fetch('/api/casual/games', { signal: abortController.signal }),
          fetch('/api/news', { signal: abortController.signal }),
        ]);

        const tournamentsData = await tournamentsRes.json();
        const casualData = await casualRes.json();
        const newsData = await newsRes.json();

        setTournaments(tournamentsData.tournaments || []);
        setCasualGames(casualData.games || []);
        setNews((newsData.news || []).slice(0, 3));
      } catch (error) {
        // Ignore AbortError when component unmounts
        if ((error as Error).name === 'AbortError') return;
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData(); // Initial fetch
    // PERFORMANCE: Reduced from 10s to 30s to minimize API load
    const interval = setInterval(fetchAllData, 30000);

    return () => {
      abortController.abort(); // Cancel in-flight requests
      clearInterval(interval);
    };
  }, [session]);

  const liveTournaments = tournaments.filter(t => t.status === 'in_progress').slice(0, 4);
  const upcomingTournaments = tournaments.filter(t => t.status === 'not_started').slice(0, 4);
  const openCasualGames = casualGames.filter(g => g.status === 'open').slice(0, 4);
  const scheduledGames = casualGames
    .filter(g => g.scheduled_time && g.scheduled_time !== '1970-01-01 00:00:00' && new Date(g.scheduled_time) > new Date())
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navbar />

      {/* Hero Section - Full Width */}
      <div className="w-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-b border-zinc-800/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/80"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Trophy className="size-16 sm:size-20 text-zinc-400" />
              <h1 className="text-5xl sm:text-7xl font-bold text-zinc-100 tracking-tight">
                HoI4 Tournament Platform
              </h1>
            </div>
            <p className="text-xl sm:text-2xl text-zinc-400 mb-8 max-w-4xl mx-auto leading-relaxed">
              The premier competitive platform for Hearts of Iron IV. Join tournaments, compete in casual matches,
              and prove your strategic supremacy in the ultimate WW2 grand strategy game.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {!session ? (
                <>
                  <Link
                    href="/auth/signin"
                    className="px-8 py-4 bg-zinc-100 hover:bg-white text-zinc-900 text-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    Join the Platform
                  </Link>
                  <Link
                    href="/tournaments"
                    className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-lg font-semibold transition-all"
                  >
                    Browse Tournaments
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/tournaments"
                    className="px-8 py-4 bg-zinc-100 hover:bg-white text-zinc-900 text-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    View Tournaments
                  </Link>
                  <Link
                    href="/casual"
                    className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-lg font-semibold transition-all"
                  >
                    Casual Games
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Platform Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800/80 p-6 text-center hover:border-zinc-700 transition-all">
              <Trophy className="size-10 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-zinc-100 mb-2">Competitive Tournaments</h3>
              <p className="text-sm text-zinc-500">Battle for glory in structured bracket competitions</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800/80 p-6 text-center hover:border-zinc-700 transition-all">
              <Gamepad2 className="size-10 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-zinc-100 mb-2">Casual Matches</h3>
              <p className="text-sm text-zinc-500">Flexible games with nation selection and co-op</p>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800/80 p-6 text-center hover:border-zinc-700 transition-all">
              <Star className="size-10 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-zinc-100 mb-2">Rankings & Stats</h3>
              <p className="text-sm text-zinc-400 font-medium">Coming Soon</p>
              <p className="text-sm text-zinc-500 mt-1">Track your performance and climb the leaderboard</p>
            </div>
            <a
              href="https://discord.gg/your-discord-invite"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-900/80 backdrop-blur border border-zinc-800/80 hover:border-zinc-700 p-6 text-center transition-all hover:bg-zinc-900"
            >
              <svg className="size-10 text-zinc-400 mx-auto mb-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">Join our Discord</h3>
              <p className="text-sm text-zinc-500">Connect with the community and get updates</p>
            </a>
          </div>
        </div>
      </div>

      <main className="w-full">
        {/* Main Content Grid */}
        <div className="max-w-[1920px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Tournaments & Games (2/3 width) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Live Tournaments */}
              {liveTournaments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-800 p-3 border border-zinc-700">
                        <Activity className="size-6 text-zinc-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-zinc-100">Live Tournaments</h2>
                        <p className="text-sm text-zinc-500">Ongoing competitive matches</p>
                      </div>
                    </div>
                    <Link
                      href="/tournaments"
                      className="text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-medium transition-colors"
                    >
                      View All
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveTournaments.map((tournament) => (
                      <Link
                        key={tournament.id}
                        href={`/tournaments/${tournament.id}`}
                        className="block bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 p-6 transition-all relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 bg-red-950/50 text-red-300 px-3 py-1 text-xs font-medium flex items-center gap-2 border-l border-b border-red-900/50">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full bg-red-500 opacity-40"></span>
                            <span className="relative inline-flex h-2 w-2 bg-red-500"></span>
                          </span>
                          LIVE
                        </div>
                        <h3 className="text-xl font-bold text-zinc-100 mb-3 pr-20 group-hover:text-zinc-300 transition-colors">
                          {tournament.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {tournament.bracket_size && (
                            <span className="px-2 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-medium">
                              {tournament.bracket_size} Players
                            </span>
                          )}
                          {tournament.is_main === 1 && (
                            <span className="px-2 py-1 bg-amber-950/30 text-amber-400 border border-amber-900/50 text-xs font-medium">
                              Main Tournament
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Open for Signup */}
              {upcomingTournaments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-800 p-3 border border-zinc-700">
                        <Zap className="size-6 text-zinc-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-zinc-100">Open for Signup</h2>
                        <p className="text-sm text-zinc-500">Join upcoming tournaments</p>
                      </div>
                    </div>
                    <Link
                      href="/tournaments"
                      className="text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-medium transition-colors"
                    >
                      View All
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingTournaments.map((tournament) => (
                      <Link
                        key={tournament.id}
                        href={`/tournaments/${tournament.id}`}
                        className="block bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 p-6 transition-all group"
                      >
                        <h3 className="text-xl font-bold text-zinc-100 mb-3 group-hover:text-zinc-300 transition-colors">
                          {tournament.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {tournament.bracket_size && (
                            <span className="px-2 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-medium">
                              {tournament.bracket_size} Players
                            </span>
                          )}
                          {tournament.is_main === 1 && (
                            <span className="px-2 py-1 bg-amber-950/30 text-amber-400 border border-amber-900/50 text-xs font-medium">
                              Main Tournament
                            </span>
                          )}
                          <span className="px-2 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 text-xs font-medium">
                            Ready to Join
                          </span>
                        </div>
                        <div className="text-sm text-zinc-500">
                          Created {new Date(tournament.created_at).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Casual Games */}
              {openCasualGames.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-800 p-3 border border-zinc-700">
                        <Gamepad2 className="size-6 text-zinc-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-zinc-100">Casual Games</h2>
                        <p className="text-sm text-zinc-500">No brackets, just nation selection</p>
                      </div>
                    </div>
                    <Link
                      href="/casual"
                      className="text-zinc-400 hover:text-zinc-100 flex items-center gap-1 font-medium transition-colors"
                    >
                      View All
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {openCasualGames.map((game) => {
                      const approvedCount = game.signups?.filter(s => s.status === 'approved').length || 0;
                      const totalSignups = game.signups?.length || 0;

                      return (
                        <Link
                          key={game.id}
                          href={`/casual/${game.id}`}
                          className="block bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 p-6 transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 text-xs font-medium">
                              OPEN
                            </span>
                            {game.scheduled_time && game.scheduled_time !== '1970-01-01 00:00:00' && (
                              <span className="px-2 py-1 bg-blue-950/30 text-blue-400 border border-blue-900/50 text-xs font-medium">
                                SCHEDULED
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-zinc-300 transition-colors">
                            {game.name}
                          </h3>
                          {game.description && (
                            <p className="text-sm text-zinc-500 mb-3 line-clamp-2">{game.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Users className="size-4" />
                            <span>{approvedCount} approved / {totalSignups} signups</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Streams & News (1/3 width) */}
            <div className="space-y-8">
              {/* Twitch Stream */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-zinc-800 p-3 border border-zinc-700">
                    <Tv className="size-6 text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-100">Live Stream</h2>
                    <p className="text-sm text-zinc-500">Watch tournament action</p>
                  </div>
                </div>
                <div className="bg-zinc-900/70 border border-zinc-800 overflow-hidden">
                  <div className="aspect-video bg-zinc-950 relative">
                    <iframe
                      src="https://player.twitch.tv/?channel=bokoen&parent=localhost&muted=true"
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="p-4 border-t border-zinc-800">
                    <p className="text-sm text-zinc-500">
                      Watch live tournament matches and top players in action
                    </p>
                  </div>
                </div>
              </div>

              {/* News & Announcements */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-zinc-800 p-3 border border-zinc-700">
                    <Newspaper className="size-6 text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-100">Latest News</h2>
                    <p className="text-sm text-zinc-500">Platform updates</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {news.length === 0 ? (
                    <div className="bg-zinc-900/70 border border-zinc-800 p-8 text-center">
                      <Newspaper className="size-12 text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">No news items yet</p>
                    </div>
                  ) : (
                    news.map((item) => {
                      const categoryColors = {
                        'Tournament': 'bg-amber-950/30 text-amber-400 border-amber-900/50',
                        'Update': 'bg-blue-950/30 text-blue-400 border-blue-900/50',
                        'Announcement': 'bg-purple-950/30 text-purple-400 border-purple-900/50',
                      };
                      const colorClass = categoryColors[item.category as keyof typeof categoryColors] || 'bg-zinc-800 text-zinc-400 border-zinc-700';

                      return (
                        <Link
                          key={item.id}
                          href={`/news/${item.id}`}
                          className="block bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 p-5 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 ${colorClass} border text-xs font-medium`}>
                              {item.category}
                            </span>
                            <span className="text-xs text-zinc-600">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-zinc-100 mb-2 group-hover:text-amber-400 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-sm text-zinc-500">
                            {item.excerpt}
                          </p>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!loading &&
          liveTournaments.length === 0 &&
          upcomingTournaments.length === 0 &&
          openCasualGames.length === 0 && (
            <div className="max-w-7xl mx-auto px-6 py-20">
              <div className="bg-zinc-900/30 border-2 border-zinc-800 p-16 text-center">
                <Trophy className="size-20 text-zinc-600 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-zinc-300 mb-4">No Active Games</h3>
                <p className="text-lg text-zinc-500 mb-8 max-w-2xl mx-auto">
                  There are no active tournaments or casual games at the moment. Check back soon or browse our platform!
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/tournaments"
                    className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white text-lg font-semibold transition-colors"
                  >
                    Browse Tournaments
                  </Link>
                  <Link
                    href="/casual"
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold transition-colors"
                  >
                    Browse Casual Games
                  </Link>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
