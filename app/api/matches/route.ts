import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// GET /api/matches - List matches (optionally filter by tournament)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournament_id');

    let query = 'SELECT * FROM matches';
    const queryParams: any = {};

    if (tournamentId) {
      query += ' WHERE tournament_id = {tournamentId:String}';
      queryParams.tournamentId = tournamentId;
    }

    query += ' ORDER BY round, match_number';

    const result = await clickhouse.query({
      query,
      query_params: queryParams,
      format: 'JSONEachRow',
    });
    const matches = await result.json();

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

// POST /api/matches - Create a new match
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'matchmaker'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { tournament_id, round, match_number, player1_uuid, player2_uuid, player1_nation, player2_nation, scheduled_time } = body;

    if (!tournament_id || round === undefined || match_number === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const matchId = randomUUID();

    await clickhouse.command({
      query: `INSERT INTO matches (id, tournament_id, round, match_number, player1_uuid, player2_uuid, player1_nation, player2_nation, winner_uuid, status, scheduled_time)
              VALUES ({id:String}, {tournamentId:String}, {round:Int32}, {matchNumber:Int32},
                      {player1Uuid:String}, {player2Uuid:String}, {player1Nation:String}, {player2Nation:String}, '', 'pending', now())`,
      query_params: {
        id: matchId,
        tournamentId: tournament_id,
        round,
        matchNumber: match_number,
        player1Uuid: player1_uuid || '',
        player2Uuid: player2_uuid || '',
        player1Nation: player1_nation || '',
        player2Nation: player2_nation || '',
      },
    });

    // Log activity using user uuid
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'create_match', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: (session.user as any).id,
        details: `Created match in tournament ${tournament_id}`,
      },
    });

    return NextResponse.json({
      success: true,
      matchId,
      message: 'Match created successfully'
    });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}
