import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// GET /api/users - List all users (returns UUID, no discord_id)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and matchmaker can see all users
    const userRole = (session.user as any).role;
    if (!['admin', 'matchmaker'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Admins get full user data, matchmakers get limited data
    if (userRole === 'admin') {
      const result = await clickhouse.query({
        query: 'SELECT id, uuid, username, discord_id, discord_username, discord_avatar, role, whitelisted, created_at, last_active FROM users ORDER BY created_at DESC',
        format: 'JSONEachRow',
      });
      const users = await result.json();
      return NextResponse.json({ users });
    } else {
      // Matchmakers get fields needed for tournament/game management (no discord_id or internal IDs)
      const result = await clickhouse.query({
        query: 'SELECT uuid, username, discord_username, discord_avatar, role, whitelisted FROM users ORDER BY username ASC',
        format: 'JSONEachRow',
      });
      const users = await result.json();
      return NextResponse.json({ users });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { username, discord_id, role = 'player' } = body;

    if (!username || username.trim() === '') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if username already exists
    const checkResult = await clickhouse.query({
      query: 'SELECT uuid FROM users WHERE username = {username:String}',
      query_params: { username: username.trim() },
      format: 'JSONEachRow',
    });
    const existing = await checkResult.json<any>();

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    // If discord_id provided, check it's not already used
    if (discord_id && discord_id.trim() !== '') {
      const discordCheckResult = await clickhouse.query({
        query: 'SELECT uuid FROM users WHERE discord_id = {discordId:String}',
        query_params: { discordId: discord_id.trim() },
        format: 'JSONEachRow',
      });
      const discordExists = await discordCheckResult.json<any>();

      if (discordExists.length > 0) {
        return NextResponse.json({ error: 'Discord ID already in use' }, { status: 400 });
      }
    }

    const userId = randomUUID();
    const userUuid = randomUUID();

    // Create new user
    await clickhouse.command({
      query: `INSERT INTO users (id, uuid, username, discord_id, discord_username, discord_avatar, role, whitelisted)
              VALUES ({id:String}, {uuid:String}, {username:String}, {discordId:String}, {discordUsername:String}, {discordAvatar:String}, {role:String}, 1)`,
      query_params: {
        id: userId,
        uuid: userUuid,
        username: username.trim(),
        discordId: discord_id ? discord_id.trim() : '',
        discordUsername: discord_id ? username.trim() : '',
        discordAvatar: '',
        role: role,
      },
    });

    // Log activity
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'create_user', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: session.user.id,
        details: `Created user ${username}`,
      },
    });

    return NextResponse.json({
      success: true,
      user: { uuid: userUuid, username: username.trim(), role }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
