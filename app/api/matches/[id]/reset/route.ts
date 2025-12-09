import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// POST /api/matches/[id]/reset - Reset a match (clear winner and set back to pending)
export async function POST(
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

    // Get match details to clear players from next round
    const matchResult = await clickhouse.query({
      query: 'SELECT tournament_id, winner_uuid, round, match_number FROM matches WHERE id = {id:String}',
      query_params: { id },
      format: 'JSONEachRow',
    });
    const match = (await matchResult.json<any>())[0];

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // If there was a winner, remove them from next round
    if (match.winner_uuid && match.round < 4) {
      const nextRound = match.round + 1;
      const nextMatchNumber = Math.ceil(match.match_number / 2);
      const playerPosition = match.match_number % 2 === 1 ? 'player1_uuid' : 'player2_uuid';

      await clickhouse.command({
        query: `ALTER TABLE matches UPDATE ${playerPosition} = ''
                WHERE tournament_id = {tournamentId:String}
                AND round = {nextRound:Int32}
                AND match_number = {nextMatchNumber:Int32}`,
        query_params: {
          tournamentId: match.tournament_id,
          nextRound,
          nextMatchNumber,
        },
      });
    }

    // Reset the match
    await clickhouse.command({
      query: `ALTER TABLE matches UPDATE winner_uuid = '', status = 'pending', completed_at = toDateTime(0)
              WHERE id = {id:String}`,
      query_params: { id },
    });

    // Log activity using user uuid
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'reset_match', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: (session.user as any).id,
        details: `Reset match ${id}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting match:', error);
    return NextResponse.json({ error: 'Failed to reset match' }, { status: 500 });
  }
}
