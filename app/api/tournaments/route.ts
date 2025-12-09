import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// GET /api/tournaments - List all tournaments (public access to all)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Return all tournaments for both authenticated and public users
    // Main tournament is highlighted via is_main flag
    const result = await clickhouse.query({
      query: 'SELECT * FROM tournaments ORDER BY is_main DESC, created_at DESC',
      format: 'JSONEachRow',
    });
    const tournaments = await result.json();

    return NextResponse.json({
      tournaments,
      isPublic: !session?.user
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}

// POST /api/tournaments - Create a new tournament
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and matchmaker can create tournaments
    if (!['admin', 'matchmaker'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, bracket_size = 16 } = body;

    if (!name) {
      return NextResponse.json({ error: 'Tournament name is required' }, { status: 400 });
    }

    // Validate bracket size
    if (![4, 8, 16, 32].includes(bracket_size)) {
      return NextResponse.json({ error: 'Bracket size must be 4, 8, 16, or 32' }, { status: 400 });
    }

    const tournamentId = randomUUID();

    await clickhouse.command({
      query: `INSERT INTO tournaments (id, name, status, current_round, created_by_uuid, bracket_size)
              VALUES ({id:String}, {name:String}, 'not_started', 0, {createdByUuid:String}, {bracketSize:UInt8})`,
      query_params: {
        id: tournamentId,
        name,
        createdByUuid: (session.user as any).id,
        bracketSize: bracket_size,
      },
    });

    // Log activity using user uuid
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'create_tournament', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: (session.user as any).id,
        details: `Created tournament: ${name}`,
      },
    });

    return NextResponse.json({
      success: true,
      tournamentId,
      message: 'Tournament created successfully'
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}
