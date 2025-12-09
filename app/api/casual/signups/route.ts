import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// GET /api/casual/signups - Get all signups
export async function GET(request: NextRequest) {
  try {
    // Ensure table exists
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS casual_game_signups (
          id String,
          user_uuid String,
          username String,
          discord_username String,
          discord_avatar String,
          nation_tag String,
          created_at DateTime DEFAULT now(),
          INDEX idx_user_uuid user_uuid TYPE minmax GRANULARITY 1,
          INDEX idx_nation nation_tag TYPE set(100) GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (created_at, id)
      `
    });

    const result = await clickhouse.query({
      query: 'SELECT * FROM casual_game_signups ORDER BY created_at DESC',
      format: 'JSONEachRow',
    });
    const signups = await result.json();

    return NextResponse.json({ signups });
  } catch (error) {
    console.error('Error fetching signups:', error);
    return NextResponse.json({ error: 'Failed to fetch signups' }, { status: 500 });
  }
}

// POST /api/casual/signups - Create a signup
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nation_tag } = body;

    if (!nation_tag) {
      return NextResponse.json({ error: 'Nation tag is required' }, { status: 400 });
    }

    const user = session.user as any;
    const signupId = randomUUID();

    // Ensure table exists
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS casual_game_signups (
          id String,
          user_uuid String,
          username String,
          discord_username String,
          discord_avatar String,
          nation_tag String,
          created_at DateTime DEFAULT now(),
          INDEX idx_user_uuid user_uuid TYPE minmax GRANULARITY 1,
          INDEX idx_nation nation_tag TYPE set(100) GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (created_at, id)
      `
    });

    // Check if user already has a signup
    const existingResult = await clickhouse.query({
      query: 'SELECT * FROM casual_game_signups WHERE user_uuid = {userUuid:String}',
      query_params: { userUuid: user.id },
      format: 'JSONEachRow',
    });
    const existing = await existingResult.json();

    if (existing.length > 0) {
      // Update existing signup
      await clickhouse.command({
        query: `
          ALTER TABLE casual_game_signups
          DELETE WHERE user_uuid = {userUuid:String}
        `,
        query_params: { userUuid: user.id },
      });

      // Wait a moment for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Insert new signup
    await clickhouse.command({
      query: `
        INSERT INTO casual_game_signups
        (id, user_uuid, username, discord_username, discord_avatar, nation_tag)
        VALUES ({id:String}, {userUuid:String}, {username:String}, {discordUsername:String}, {discordAvatar:String}, {nationTag:String})
      `,
      query_params: {
        id: signupId,
        userUuid: user.id,
        username: user.name || 'Unknown',
        discordUsername: user.name || 'Unknown',
        discordAvatar: user.image || '',
        nationTag: nation_tag,
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

// DELETE /api/casual/signups - Cancel signup
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    await clickhouse.command({
      query: `
        ALTER TABLE casual_game_signups
        DELETE WHERE user_uuid = {userUuid:String}
      `,
      query_params: { userUuid: user.id },
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
