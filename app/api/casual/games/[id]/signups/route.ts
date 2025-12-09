import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// GET /api/casual/games/[id]/signups - Get signups for a specific game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params;

    const result = await clickhouse.query({
      query: 'SELECT * FROM casual_game_signups WHERE game_id = {gameId:String} ORDER BY created_at ASC',
      query_params: { gameId },
      format: 'JSONEachRow',
    });
    const signups = await result.json();

    return NextResponse.json({ signups });
  } catch (error) {
    console.error('Error fetching signups:', error);
    return NextResponse.json({ error: 'Failed to fetch signups' }, { status: 500 });
  }
}

// POST /api/casual/games/[id]/signups - Sign up for a game
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: gameId } = await params;
    const body = await request.json();
    const { preferred_nation, is_coop, manual_add, username } = body;

    if (!preferred_nation) {
      return NextResponse.json({ error: 'Preferred nation is required' }, { status: 400 });
    }

    // Check if this is a manual add by matchmaker
    const userRole = (session.user as any)?.role;
    const isManualAdd = manual_add && ['admin', 'matchmaker'].includes(userRole);

    if (isManualAdd && !username) {
      return NextResponse.json({ error: 'Username is required for manual add' }, { status: 400 });
    }

    // Ensure casual_games table exists
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

    // Ensure casual_game_signups table exists with is_coop field
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
          is_coop UInt8 DEFAULT 0,
          status String DEFAULT 'pending',
          created_at DateTime DEFAULT now(),
          INDEX idx_game_id game_id TYPE minmax GRANULARITY 1,
          INDEX idx_user_uuid user_uuid TYPE minmax GRANULARITY 1,
          INDEX idx_nation preferred_nation TYPE set(100) GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (game_id, created_at, id)
      `
    });

    // Check if game exists
    const gameResult = await clickhouse.query({
      query: 'SELECT * FROM casual_games WHERE id = {gameId:String}',
      query_params: { gameId },
      format: 'JSONEachRow',
    });
    const games = await gameResult.json();

    if (games.length === 0) {
      return NextResponse.json({ error: 'Game not found', gameId }, { status: 404 });
    }

    const user = session.user as any;

    // For manual adds, use provided username and auto-approve
    if (isManualAdd) {
      const signupId = randomUUID();

      // Find the user's avatar from the database if they exist
      let userAvatar = '';
      try {
        const userResult = await clickhouse.query({
          query: 'SELECT discord_avatar FROM users WHERE username = {username:String} LIMIT 1',
          query_params: { username: username },
          format: 'JSONEachRow',
        });
        const users = await userResult.json() as any[];
        if (users.length > 0 && users[0].discord_avatar) {
          userAvatar = users[0].discord_avatar;
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
      }

      // Insert new signup with approved status
      await clickhouse.command({
        query: `
          INSERT INTO casual_game_signups
          (id, game_id, user_uuid, username, discord_username, discord_avatar, preferred_nation, is_coop, status)
          VALUES ({id:String}, {gameId:String}, {userUuid:String}, {username:String}, {discordUsername:String}, {discordAvatar:String}, {preferredNation:String}, {isCoop:UInt8}, 'approved')
        `,
        query_params: {
          id: signupId,
          gameId,
          userUuid: 'manual_' + randomUUID(),
          username: username,
          discordUsername: username,
          discordAvatar: userAvatar,
          preferredNation: preferred_nation,
          isCoop: is_coop ? 1 : 0,
        },
      });

      return NextResponse.json({
        success: true,
        signupId,
        message: 'Player added successfully'
      });
    }

    // Regular user signup flow
    // Check if user already signed up for this game
    const existingResult = await clickhouse.query({
      query: 'SELECT * FROM casual_game_signups WHERE game_id = {gameId:String} AND user_uuid = {userUuid:String}',
      query_params: { gameId, userUuid: user.id },
      format: 'JSONEachRow',
    });
    const existing = await existingResult.json();

    if (existing.length > 0) {
      // Update existing signup
      await clickhouse.command({
        query: `
          ALTER TABLE casual_game_signups
          DELETE WHERE game_id = {gameId:String} AND user_uuid = {userUuid:String}
        `,
        query_params: { gameId, userUuid: user.id },
      });

      // Wait for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const signupId = randomUUID();

    // Insert new signup
    await clickhouse.command({
      query: `
        INSERT INTO casual_game_signups
        (id, game_id, user_uuid, username, discord_username, discord_avatar, preferred_nation, is_coop, status)
        VALUES ({id:String}, {gameId:String}, {userUuid:String}, {username:String}, {discordUsername:String}, {discordAvatar:String}, {preferredNation:String}, {isCoop:UInt8}, 'pending')
      `,
      query_params: {
        id: signupId,
        gameId,
        userUuid: user.id,
        username: user.name || 'Unknown',
        discordUsername: (user as any).discordUsername || user.name || 'Unknown',
        discordAvatar: (user as any).discordAvatar || '',
        preferredNation: preferred_nation,
        isCoop: is_coop ? 1 : 0,
      },
    });

    return NextResponse.json({
      success: true,
      signupId,
      message: 'Signed up successfully'
    });
  } catch (error) {
    console.error('Error creating signup:', error);
    return NextResponse.json({ error: 'Failed to create signup' }, { status: 500 });
  }
}

// DELETE /api/casual/games/[id]/signups - Cancel signup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: gameId } = await params;
    const user = session.user as any;

    await clickhouse.command({
      query: `
        ALTER TABLE casual_game_signups
        DELETE WHERE game_id = {gameId:String} AND user_uuid = {userUuid:String}
      `,
      query_params: { gameId, userUuid: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Signup cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling signup:', error);
    return NextResponse.json({ error: 'Failed to cancel signup' }, { status: 500 });
  }
}

// PATCH /api/casual/games/[id]/signups - Update signup status (matchmaker only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only matchmakers can update signup status
    const userRole = (session.user as any)?.role;
    if (!['admin', 'matchmaker'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: gameId } = await params;
    const body = await request.json();
    const { signup_id, signup_ids, status, action, preferred_nation, is_coop } = body;

    // Handle nation update
    if (action === 'update_nation' && signup_id && preferred_nation) {
      await clickhouse.command({
        query: `
          ALTER TABLE casual_game_signups
          UPDATE preferred_nation = {preferredNation:String}, is_coop = {isCoop:UInt8}
          WHERE id = {signupId:String} AND game_id = {gameId:String}
        `,
        query_params: {
          preferredNation: preferred_nation,
          isCoop: is_coop ? 1 : 0,
          signupId: signup_id,
          gameId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Nation and co-op status updated successfully'
      });
    }

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Bulk update
    if (action === 'bulk' && signup_ids && Array.isArray(signup_ids)) {
      for (const id of signup_ids) {
        await clickhouse.command({
          query: `
            ALTER TABLE casual_game_signups
            UPDATE status = {status:String}
            WHERE id = {signupId:String} AND game_id = {gameId:String}
          `,
          query_params: {
            status,
            signupId: id,
            gameId,
          },
        });
      }
      return NextResponse.json({
        success: true,
        message: `${signup_ids.length} signups updated successfully`
      });
    }

    // Single update
    if (!signup_id) {
      return NextResponse.json({ error: 'Signup ID is required' }, { status: 400 });
    }

    await clickhouse.command({
      query: `
        ALTER TABLE casual_game_signups
        UPDATE status = {status:String}
        WHERE id = {signupId:String} AND game_id = {gameId:String}
      `,
      query_params: {
        status,
        signupId: signup_id,
        gameId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Signup status updated'
    });
  } catch (error) {
    console.error('Error updating signup status:', error);
    return NextResponse.json({ error: 'Failed to update signup status' }, { status: 500 });
  }
}
