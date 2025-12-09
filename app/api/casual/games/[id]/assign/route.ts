import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';
import { validateUUID, validateNationTag } from '@/app/lib/validation';

// POST /api/casual/games/[id]/assign - Assign player to nation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and matchmaker can assign players
    const userRole = (session.user as any)?.role;
    if (!['admin', 'matchmaker'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: gameId } = await params;
    const body = await request.json();
    const { user_uuid, username, nation_tag } = body;

    if (!user_uuid || !nation_tag) {
      return NextResponse.json({ error: 'User UUID and nation tag are required' }, { status: 400 });
    }

    // SECURITY: Validate UUID format
    if (!validateUUID(user_uuid)) {
      return NextResponse.json({ error: 'Invalid user UUID format' }, { status: 400 });
    }

    // SECURITY: Validate nation tag (must be 3-letter code)
    if (!validateNationTag(nation_tag)) {
      return NextResponse.json({
        error: 'Invalid nation tag. Must be a valid 3-letter HOI4 nation code (e.g., GER, USA, SOV)'
      }, { status: 400 });
    }

    // Check if game exists
    const gameResult = await clickhouse.query({
      query: 'SELECT * FROM casual_games WHERE id = {gameId:String}',
      query_params: { gameId },
      format: 'JSONEachRow',
    });
    const games = await gameResult.json();

    if (games.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const assignmentId = randomUUID();
    const assignedBy = session.user as any;

    // Create assignment
    await clickhouse.command({
      query: `
        INSERT INTO casual_game_assignments
        (id, game_id, user_uuid, username, nation_tag, assigned_by_uuid)
        VALUES ({id:String}, {gameId:String}, {userUuid:String}, {username:String}, {nationTag:String}, {assignedByUuid:String})
      `,
      query_params: {
        id: assignmentId,
        gameId,
        userUuid: user_uuid,
        username: username || 'Unknown',
        nationTag: nation_tag,
        assignedByUuid: assignedBy.id,
      },
    });

    return NextResponse.json({
      success: true,
      assignmentId,
      message: 'Player assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning player:', error);
    return NextResponse.json({ error: 'Failed to assign player' }, { status: 500 });
  }
}

// DELETE /api/casual/games/[id]/assign - Remove player assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and matchmaker can remove assignments
    const userRole = (session.user as any)?.role;
    if (!['admin', 'matchmaker'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: gameId } = await params;
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    await clickhouse.command({
      query: `
        ALTER TABLE casual_game_assignments
        DELETE WHERE id = {assignmentId:String} AND game_id = {gameId:String}
      `,
      query_params: {
        assignmentId,
        gameId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing assignment:', error);
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
  }
}
