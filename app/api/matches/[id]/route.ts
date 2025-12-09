import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';
import { validateUUID, validateNationTag } from '@/app/lib/validation';

// GET /api/matches/[id] - Get match details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await clickhouse.query({
      query: 'SELECT * FROM matches WHERE id = {id:String}',
      query_params: { id },
      format: 'JSONEachRow',
    });
    const matches = await result.json<any>();

    if (matches.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({ match: matches[0] });
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}

// PATCH /api/matches/[id] - Update match (including results)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    console.log('PATCH /api/matches/[id] - Session:', { user: session?.user, role: (session?.user as any)?.role });

    if (!session?.user) {
      console.error('PATCH /api/matches/[id] - No session');
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    if (!['admin', 'matchmaker'].includes((session.user as any).role)) {
      console.error('PATCH /api/matches/[id] - Forbidden. User role:', (session.user as any).role);
      return NextResponse.json({ error: `Forbidden - Requires admin or matchmaker role. Your role: ${(session.user as any).role}` }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { winner_id, status, player1_uuid, player2_uuid, player1_nation, player2_nation, scheduled_time } = body;

    // SECURITY: Validate UUIDs if provided
    if (player1_uuid !== undefined && player1_uuid !== '' && player1_uuid !== null && !validateUUID(player1_uuid)) {
      return NextResponse.json({ error: 'Invalid player1 UUID format' }, { status: 400 });
    }
    if (player2_uuid !== undefined && player2_uuid !== '' && player2_uuid !== null && !validateUUID(player2_uuid)) {
      return NextResponse.json({ error: 'Invalid player2 UUID format' }, { status: 400 });
    }
    if (winner_id !== undefined && winner_id !== '' && winner_id !== null && !validateUUID(winner_id)) {
      return NextResponse.json({ error: 'Invalid winner UUID format' }, { status: 400 });
    }

    // SECURITY: Validate nation tags if provided
    if (player1_nation !== undefined && player1_nation !== '' && player1_nation !== null && !validateNationTag(player1_nation)) {
      return NextResponse.json({
        error: 'Invalid player1 nation tag. Must be a valid 3-letter HOI4 nation code (e.g., GER, USA, SOV)'
      }, { status: 400 });
    }
    if (player2_nation !== undefined && player2_nation !== '' && player2_nation !== null && !validateNationTag(player2_nation)) {
      return NextResponse.json({
        error: 'Invalid player2 nation tag. Must be a valid 3-letter HOI4 nation code (e.g., GER, USA, SOV)'
      }, { status: 400 });
    }

    console.log('PATCH /api/matches/[id] - Updating match:', { id, winner_id, status, player1_uuid, player2_uuid, player1_nation, player2_nation, scheduled_time });

    const updates: string[] = [];
    const queryParams: any = { id };

    if (winner_id !== undefined) {
      updates.push('winner_uuid = {winnerUuid:String}');
      queryParams.winnerUuid = winner_id;
    }
    if (status) {
      updates.push('status = {status:String}');
      queryParams.status = status;
    }
    if (status === 'completed') {
      updates.push('completed_at = now()');
    }
    if (player1_uuid !== undefined) {
      updates.push('player1_uuid = {player1Uuid:String}');
      queryParams.player1Uuid = player1_uuid;
    }
    if (player2_uuid !== undefined) {
      updates.push('player2_uuid = {player2Uuid:String}');
      queryParams.player2Uuid = player2_uuid;
    }
    if (player1_nation !== undefined) {
      updates.push('player1_nation = {player1Nation:String}');
      queryParams.player1Nation = player1_nation;
    }
    if (player2_nation !== undefined) {
      updates.push('player2_nation = {player2Nation:String}');
      queryParams.player2Nation = player2_nation;
    }
    if (scheduled_time !== undefined) {
      // Format datetime for ClickHouse (YYYY-MM-DD HH:MM:SS)
      const date = new Date(scheduled_time);
      const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
      updates.push('scheduled_time = {scheduledTime:DateTime}');
      queryParams.scheduledTime = formattedDate;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await clickhouse.command({
      query: `ALTER TABLE matches UPDATE ${updates.join(', ')} WHERE id = {id:String}`,
      query_params: queryParams,
    });

    // If match is completed, update player stats and advance winner
    if (status === 'completed' && winner_id) {
      // Get match details
      const matchResult = await clickhouse.query({
        query: 'SELECT tournament_id, player1_uuid, player2_uuid, round, match_number FROM matches WHERE id = {id:String}',
        query_params: { id },
        format: 'JSONEachRow',
      });
      const match = (await matchResult.json<any>())[0];

      if (match) {
        const loserId = match.player1_uuid === winner_id ? match.player2_uuid : match.player1_uuid;

        // Update winner stats
        await clickhouse.command({
          query: `INSERT INTO player_stats (player_uuid, tournament_id, matches_played, matches_won, matches_lost, total_time_played)
                  VALUES ({playerUuid:String}, {tournamentId:String}, 1, 1, 0, 0)`,
          query_params: {
            playerUuid: winner_id,
            tournamentId: match.tournament_id,
          },
        });

        // Update loser stats
        if (loserId) {
          await clickhouse.command({
            query: `INSERT INTO player_stats (player_uuid, tournament_id, matches_played, matches_won, matches_lost, total_time_played)
                    VALUES ({playerUuid:String}, {tournamentId:String}, 1, 0, 1, 0)`,
            query_params: {
              playerUuid: loserId,
              tournamentId: match.tournament_id,
            },
          });
        }

        // Advance winner to next round (if not final)
        if (match.round < 4) {
          const nextRound = match.round + 1;
          const nextMatchNumber = Math.ceil(match.match_number / 2);
          // Odd match numbers go to player1 position, even to player2
          const playerPosition = match.match_number % 2 === 1 ? 'player1_uuid' : 'player2_uuid';

          await clickhouse.command({
            query: `ALTER TABLE matches UPDATE ${playerPosition} = {winnerUuid:String}
                    WHERE tournament_id = {tournamentId:String}
                    AND round = {nextRound:Int32}
                    AND match_number = {nextMatchNumber:Int32}`,
            query_params: {
              winnerUuid: winner_id,
              tournamentId: match.tournament_id,
              nextRound,
              nextMatchNumber,
            },
          });
        }
      }
    }

    // Log activity using user uuid
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'update_match', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: (session.user as any).id,
        details: `Updated match ${id}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/matches/[id] - Error updating match:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to update match: ${errorMessage}` }, { status: 500 });
  }
}

// DELETE /api/matches/[id] - Delete match
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'matchmaker'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await clickhouse.command({
      query: 'ALTER TABLE matches DELETE WHERE id = {id:String}',
      query_params: { id },
    });

    // Log activity
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'delete_match', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: (session.user as any).id,
        details: `Deleted match ${id}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}
