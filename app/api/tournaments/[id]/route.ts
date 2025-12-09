import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// GET /api/tournaments/[id] - Get tournament details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await clickhouse.query({
      query: 'SELECT * FROM tournaments WHERE id = {id:String}',
      query_params: { id },
      format: 'JSONEachRow',
    });
    const tournaments = await result.json<any>();

    if (tournaments.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Get matches for this tournament
    const matchesResult = await clickhouse.query({
      query: 'SELECT * FROM matches WHERE tournament_id = {id:String} ORDER BY round, match_number',
      query_params: { id },
      format: 'JSONEachRow',
    });
    const matches = await matchesResult.json();

    return NextResponse.json({
      tournament: tournaments[0],
      matches
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 });
  }
}

// PATCH /api/tournaments/[id] - Update tournament
export async function PATCH(
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
    const body = await request.json();
    const { status, current_round, is_main } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const queryParams: any = { id };

    if (status) {
      updates.push('status = {status:String}');
      queryParams.status = status;
    }
    if (current_round !== undefined) {
      updates.push('current_round = {currentRound:Int32}');
      queryParams.currentRound = current_round;
    }
    if (is_main !== undefined) {
      // If setting this tournament as main, first unset all other main tournaments
      if (is_main) {
        await clickhouse.command({
          query: 'ALTER TABLE tournaments UPDATE is_main = 0 WHERE is_main = 1',
        });
      }
      updates.push('is_main = {isMain:UInt8}');
      queryParams.isMain = is_main ? 1 : 0;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // In ClickHouse, we use mutations for updates (they're asynchronous)
    // For production, consider using a ReplacingMergeTree or inserting new versions
    await clickhouse.command({
      query: `ALTER TABLE tournaments UPDATE ${updates.join(', ')}, updated_at = now() WHERE id = {id:String}`,
      query_params: queryParams,
    });

    // Log activity using user uuid
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'update_tournament', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: (session.user as any).id,
        details: `Updated tournament ${id}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 });
  }
}

// DELETE /api/tournaments/[id] - Delete tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Delete matches first
    await clickhouse.command({
      query: 'ALTER TABLE matches DELETE WHERE tournament_id = {id:String}',
      query_params: { id },
    });

    // Delete tournament
    await clickhouse.command({
      query: 'ALTER TABLE tournaments DELETE WHERE id = {id:String}',
      query_params: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
  }
}
