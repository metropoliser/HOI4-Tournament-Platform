import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// GET /api/users/[id] - Get user details by UUID (public for basic info)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: uuid } = await params;

    // Check if user wants full details (only for themselves or admin)
    const isOwnProfile = session?.user && (session.user as any).id === uuid;
    const isAdmin = session?.user && (session.user as any).role === 'admin';

    if (isOwnProfile || isAdmin) {
      // Return full user details (excluding discord_id for privacy)
      const result = await clickhouse.query({
        query: 'SELECT id, uuid, username, discord_username, discord_avatar, role, whitelisted, created_at, last_active FROM users WHERE uuid = {uuid:String}',
        query_params: { uuid },
        format: 'JSONEachRow',
      });
      const users = await result.json<any>();

      if (users.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ user: users[0] });
    } else {
      // Anyone (authenticated or not) can view basic display info
      const result = await clickhouse.query({
        query: 'SELECT uuid, username, discord_username, discord_avatar FROM users WHERE uuid = {uuid:String}',
        query_params: { uuid },
        format: 'JSONEachRow',
      });
      const users = await result.json<any>();

      if (users.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ user: users[0] });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Update user by UUID (role, username, discord_id)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: uuid } = await params;
    const body = await request.json();
    const { role, username, discord_id } = body;

    const updates: string[] = [];
    const params_obj: Record<string, any> = { uuid };
    const changes: string[] = [];

    // Validate and add role update
    if (role !== undefined) {
      const validRoles = ['admin', 'matchmaker', 'player'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updates.push('role = {role:String}');
      params_obj.role = role;
      changes.push(`role to ${role}`);
    }

    // Validate and add username update
    if (username !== undefined) {
      if (username.trim() === '') {
        return NextResponse.json({ error: 'Username cannot be empty' }, { status: 400 });
      }

      // Check if username is already taken by another user
      const checkResult = await clickhouse.query({
        query: 'SELECT uuid FROM users WHERE username = {username:String} AND uuid != {uuid:String}',
        query_params: { username: username.trim(), uuid },
        format: 'JSONEachRow',
      });
      const existing = await checkResult.json<any>();

      if (existing.length > 0) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }

      updates.push('username = {username:String}');
      params_obj.username = username.trim();
      changes.push(`username to ${username.trim()}`);
    }

    // Validate and add discord_id update
    if (discord_id !== undefined) {
      if (discord_id && discord_id.trim() !== '') {
        // Check if discord_id is already used by another user
        const discordCheckResult = await clickhouse.query({
          query: 'SELECT uuid FROM users WHERE discord_id = {discordId:String} AND uuid != {uuid:String}',
          query_params: { discordId: discord_id.trim(), uuid },
          format: 'JSONEachRow',
        });
        const discordExists = await discordCheckResult.json<any>();

        if (discordExists.length > 0) {
          return NextResponse.json({ error: 'Discord ID already in use' }, { status: 400 });
        }

        updates.push('discord_id = {discordId:String}');
        params_obj.discordId = discord_id.trim();
        changes.push(`discord_id to ${discord_id.trim()}`);
      } else {
        // Clear all Discord-related fields
        updates.push('discord_id = \'\'');
        updates.push('discord_username = \'\'');
        updates.push('discord_avatar = \'\'');
        changes.push('removed Discord link');
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Perform the update
    await clickhouse.command({
      query: `ALTER TABLE users UPDATE ${updates.join(', ')} WHERE uuid = {uuid:String}`,
      query_params: params_obj,
    });

    // Log activity
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'update_user', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: session.user.id,
        details: `Updated user ${uuid}: ${changes.join(', ')}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user by UUID (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: uuid } = await params;

    // Check if user exists
    const checkResult = await clickhouse.query({
      query: 'SELECT uuid, username FROM users WHERE uuid = {uuid:String}',
      query_params: { uuid },
      format: 'JSONEachRow',
    });
    const users = await checkResult.json<any>();

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const username = users[0].username;

    // Delete user from all related tables
    // Delete from user_sessions
    await clickhouse.command({
      query: 'ALTER TABLE user_sessions DELETE WHERE user_uuid = {uuid:String}',
      query_params: { uuid },
    });

    // Note: We should NOT delete matches or tournaments they're part of, just remove the user
    // Update matches to set player UUIDs to empty where this user is involved
    await clickhouse.command({
      query: `ALTER TABLE matches UPDATE
              player1_uuid = '' WHERE player1_uuid = {uuid:String}`,
      query_params: { uuid },
    });

    await clickhouse.command({
      query: `ALTER TABLE matches UPDATE
              player2_uuid = '' WHERE player2_uuid = {uuid:String}`,
      query_params: { uuid },
    });

    await clickhouse.command({
      query: `ALTER TABLE matches UPDATE
              winner_uuid = '' WHERE winner_uuid = {uuid:String}`,
      query_params: { uuid },
    });

    // Delete from users table
    await clickhouse.command({
      query: 'ALTER TABLE users DELETE WHERE uuid = {uuid:String}',
      query_params: { uuid },
    });

    // Log activity
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'delete_user', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: session.user.id,
        details: `Deleted user ${username} (${uuid})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
