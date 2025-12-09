import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { sanitizeHTML, validateWorkshopURL, validateGameName, validateDescription } from '@/app/lib/validation';

// GET /api/casual/games/[id] - Get a specific game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    const result = await clickhouse.query({
      query: 'SELECT * FROM casual_games WHERE id = {gameId:String}',
      query_params: { gameId },
      format: 'JSONEachRow',
    });
    const games = await result.json() as any[];

    if (games.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Get signups for the game
    const signupsResult = await clickhouse.query({
      query: 'SELECT * FROM casual_game_signups WHERE game_id = {gameId:String} ORDER BY created_at',
      query_params: { gameId },
      format: 'JSONEachRow',
    });
    const signups = await signupsResult.json();

    const game: any = games[0];
    game.signups = signups;

    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}

// PATCH /api/casual/games/[id] - Update game details or status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and matchmaker can update games
    const userRole = (session.user as any)?.role;
    if (!['admin', 'matchmaker'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: gameId } = await params;
    const body = await request.json();
    const { name, description, status, scheduled_time, rules, modpack_url } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const params_obj: any = { gameId };

    if (name !== undefined) {
      const nameValidation = validateGameName(name);
      if (!nameValidation.valid) {
        return NextResponse.json({ error: nameValidation.error }, { status: 400 });
      }
      updates.push('name = {name:String}');
      params_obj.name = nameValidation.sanitized;
    }
    if (description !== undefined) {
      const descriptionValidation = validateDescription(description);
      if (!descriptionValidation.valid) {
        return NextResponse.json({ error: descriptionValidation.error }, { status: 400 });
      }
      updates.push('description = {description:String}');
      params_obj.description = descriptionValidation.sanitized;
    }
    if (status !== undefined) {
      if (!['open', 'in_progress', 'completed'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.push('status = {status:String}');
      params_obj.status = status;
    }
    if (scheduled_time !== undefined) {
      updates.push('scheduled_time = {scheduledTime:DateTime}');
      params_obj.scheduledTime = scheduled_time || '1970-01-01 00:00:00';
    }
    if (rules !== undefined) {
      const sanitizedRules = sanitizeHTML(rules);
      updates.push('rules = {rules:String}');
      params_obj.rules = sanitizedRules;
    }
    if (modpack_url !== undefined) {
      const workshopValidation = validateWorkshopURL(modpack_url);
      if (!workshopValidation.valid) {
        return NextResponse.json({ error: workshopValidation.error }, { status: 400 });
      }
      updates.push('modpack_url = {modpackUrl:String}');
      params_obj.modpackUrl = workshopValidation.sanitized;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await clickhouse.command({
      query: `
        ALTER TABLE casual_games
        UPDATE ${updates.join(', ')}
        WHERE id = {gameId:String}
      `,
      query_params: params_obj,
    });

    return NextResponse.json({
      success: true,
      message: 'Game updated successfully'
    });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

// DELETE /api/casual/games/[id] - Delete a game
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and matchmaker can delete games
    const userRole = (session.user as any)?.role;
    if (!['admin', 'matchmaker'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: gameId } = await params;

    // Delete all signups for this game first
    await clickhouse.command({
      query: `
        ALTER TABLE casual_game_signups
        DELETE WHERE game_id = {gameId:String}
      `,
      query_params: { gameId },
    });

    // Delete the game
    await clickhouse.command({
      query: `
        ALTER TABLE casual_games
        DELETE WHERE id = {gameId:String}
      `,
      query_params: { gameId },
    });

    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}
