import { NextRequest, NextResponse } from 'next/server';
import clickhouse from '@/app/lib/clickhouse';

// GET /api/players/[id]/stats - Get player statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournament_id');

    // Get user info
    const userResult = await clickhouse.query({
      query: 'SELECT discord_id, discord_username, discord_avatar FROM users WHERE discord_id = {id:String}',
      query_params: { id },
      format: 'JSONEachRow',
    });
    const users = await userResult.json<any>();

    if (users.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Get aggregated stats
    let statsQuery = `
      SELECT
        player_id,
        sum(matches_played) as total_matches,
        sum(matches_won) as total_wins,
        sum(matches_lost) as total_losses,
        sum(total_time_played) as total_time
      FROM player_stats
      WHERE player_id = {playerId:String}
    `;
    const queryParams: any = { playerId: id };

    if (tournamentId) {
      statsQuery += ' AND tournament_id = {tournamentId:String}';
      queryParams.tournamentId = tournamentId;
    }

    statsQuery += ' GROUP BY player_id';

    const statsResult = await clickhouse.query({
      query: statsQuery,
      query_params: queryParams,
      format: 'JSONEachRow',
    });
    const stats = await statsResult.json<any>();

    // Get recent matches
    let matchesQuery = `
      SELECT m.*, t.name as tournament_name
      FROM matches m
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE (m.player1_id = {playerId:String} OR m.player2_id = {playerId:String})
    `;

    if (tournamentId) {
      matchesQuery += ' AND m.tournament_id = {tournamentId:String}';
    }

    matchesQuery += ' ORDER BY m.created_at DESC LIMIT 10';

    const matchesResult = await clickhouse.query({
      query: matchesQuery,
      query_params: queryParams,
      format: 'JSONEachRow',
    });
    const recentMatches = await matchesResult.json();

    return NextResponse.json({
      player: users[0],
      stats: stats[0] || {
        total_matches: 0,
        total_wins: 0,
        total_losses: 0,
        total_time: 0
      },
      recentMatches
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500 });
  }
}
