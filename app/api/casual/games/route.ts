import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';
import { sanitizeHTML, validateWorkshopURL, validateGameName, validateDescription } from '@/app/lib/validation';

// GET /api/casual/games - Get all casual games
export async function GET(request: NextRequest) {
  try {
    // Ensure table exists
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS casual_games (
          id String,
          name String,
          description String,
          rules String DEFAULT '',
          modpack_url String DEFAULT '',
          status String DEFAULT 'open',
          created_by_uuid String,
          created_by_name String,
          max_players UInt16 DEFAULT 0,
          scheduled_time DateTime DEFAULT toDateTime('1970-01-01 00:00:00'),
          created_at DateTime DEFAULT now(),
          started_at DateTime DEFAULT toDateTime('1970-01-01 00:00:00'),
          INDEX idx_status status TYPE set(10) GRANULARITY 1,
          INDEX idx_created_by created_by_uuid TYPE minmax GRANULARITY 1,
          INDEX idx_scheduled scheduled_time TYPE minmax GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (created_at, id)
      `
    });

    const result = await clickhouse.query({
      query: 'SELECT * FROM casual_games ORDER BY created_at DESC',
      format: 'JSONEachRow',
    });
    const games = await result.json() as any[];

    // Get signups for each game
    for (const game of games) {
      const signupsResult = await clickhouse.query({
        query: 'SELECT * FROM casual_game_signups WHERE game_id = {gameId:String} ORDER BY created_at',
        query_params: { gameId: game.id },
        format: 'JSONEachRow',
      });
      game.signups = await signupsResult.json();
    }

    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching casual games:', error);
    return NextResponse.json({ error: 'Failed to fetch casual games' }, { status: 500 });
  }
}

// POST /api/casual/games - Create a new casual game
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and matchmaker can create casual games
    const userRole = (session.user as any)?.role;
    if (!['admin', 'matchmaker'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description = '', max_players = 0, scheduled_time, rules = '', modpack_url = '' } = body;

    // Validate and sanitize game name
    const nameValidation = validateGameName(name);
    if (!nameValidation.valid) {
      return NextResponse.json({ error: nameValidation.error }, { status: 400 });
    }

    // Validate and sanitize description
    const descriptionValidation = validateDescription(description);
    if (!descriptionValidation.valid) {
      return NextResponse.json({ error: descriptionValidation.error }, { status: 400 });
    }

    // Sanitize rules HTML
    const sanitizedRules = sanitizeHTML(rules);

    // Validate and sanitize workshop URL
    const workshopValidation = validateWorkshopURL(modpack_url);
    if (!workshopValidation.valid) {
      return NextResponse.json({ error: workshopValidation.error }, { status: 400 });
    }

    const gameId = randomUUID();
    const user = session.user as any;

    // Ensure tables exist
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS casual_games (
          id String,
          name String,
          description String,
          rules String DEFAULT '',
          modpack_url String DEFAULT '',
          status String DEFAULT 'open',
          created_by_uuid String,
          created_by_name String,
          max_players UInt16 DEFAULT 0,
          scheduled_time DateTime DEFAULT toDateTime('1970-01-01 00:00:00'),
          created_at DateTime DEFAULT now(),
          started_at DateTime DEFAULT toDateTime('1970-01-01 00:00:00'),
          INDEX idx_status status TYPE set(10) GRANULARITY 1,
          INDEX idx_created_by created_by_uuid TYPE minmax GRANULARITY 1,
          INDEX idx_scheduled scheduled_time TYPE minmax GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (created_at, id)
      `
    });

    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS casual_game_signups (
          id String,
          game_id String,
          user_uuid String,
          username String,
          discord_username String,
          discord_avatar String,
          preferred_nation String,
          status String DEFAULT 'pending',
          created_at DateTime DEFAULT now(),
          INDEX idx_game_id game_id TYPE minmax GRANULARITY 1,
          INDEX idx_user_uuid user_uuid TYPE minmax GRANULARITY 1,
          INDEX idx_nation preferred_nation TYPE set(100) GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (game_id, created_at, id)
      `
    });

    // Create the game
    await clickhouse.command({
      query: `
        INSERT INTO casual_games
        (id, name, description, rules, modpack_url, status, created_by_uuid, created_by_name, max_players, scheduled_time)
        VALUES ({id:String}, {name:String}, {description:String}, {rules:String}, {modpackUrl:String}, 'open', {createdByUuid:String}, {createdByName:String}, {maxPlayers:UInt16}, {scheduledTime:DateTime})
      `,
      query_params: {
        id: gameId,
        name: nameValidation.sanitized,
        description: descriptionValidation.sanitized,
        rules: sanitizedRules,
        modpackUrl: workshopValidation.sanitized,
        createdByUuid: user.id,
        createdByName: user.name || 'Unknown',
        maxPlayers: max_players,
        scheduledTime: scheduled_time || '1970-01-01 00:00:00',
      },
    });

    return NextResponse.json({
      success: true,
      gameId,
      message: 'Casual game created successfully'
    });
  } catch (error) {
    console.error('Error creating casual game:', error);
    return NextResponse.json({ error: 'Failed to create casual game' }, { status: 500 });
  }
}
