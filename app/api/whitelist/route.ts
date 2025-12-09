import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// GET /api/whitelist - List all whitelisted users
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await clickhouse.query({
      query: 'SELECT * FROM whitelist ORDER BY added_at DESC',
      format: 'JSONEachRow',
    });
    const whitelist = await result.json();

    return NextResponse.json({ whitelist });
  } catch (error) {
    console.error('Error fetching whitelist:', error);
    return NextResponse.json({ error: 'Failed to fetch whitelist' }, { status: 500 });
  }
}

// POST /api/whitelist - Add user to whitelist
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { discord_id, reason } = body;

    if (!discord_id) {
      return NextResponse.json({ error: 'Discord ID is required' }, { status: 400 });
    }

    // Check if already whitelisted
    const checkResult = await clickhouse.query({
      query: 'SELECT discord_id FROM whitelist WHERE discord_id = {discordId:String}',
      query_params: { discordId: discord_id },
      format: 'JSONEachRow',
    });
    const existing = await checkResult.json<any>();

    if (existing.length > 0) {
      return NextResponse.json({ error: 'User already whitelisted' }, { status: 400 });
    }

    await clickhouse.command({
      query: `INSERT INTO whitelist (discord_id, added_by_uuid, reason)
              VALUES ({discordId:String}, {addedByUuid:String}, {reason:String})`,
      query_params: {
        discordId: discord_id,
        addedByUuid: session.user.id,
        reason: reason || 'No reason provided',
      },
    });

    // Log activity
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'add_whitelist', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: session.user.id,
        details: `Added ${discord_id} to whitelist`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User added to whitelist'
    });
  } catch (error) {
    console.error('Error adding to whitelist:', error);
    return NextResponse.json({ error: 'Failed to add to whitelist' }, { status: 500 });
  }
}

// DELETE /api/whitelist - Remove user from whitelist
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const discordId = searchParams.get('discord_id');

    if (!discordId) {
      return NextResponse.json({ error: 'Discord ID is required' }, { status: 400 });
    }

    await clickhouse.command({
      query: 'ALTER TABLE whitelist DELETE WHERE discord_id = {discordId:String}',
      query_params: { discordId },
    });

    // Log activity
    await clickhouse.command({
      query: `INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
              VALUES ({id:String}, {userUuid:String}, 'remove_whitelist', {details:String}, '')`,
      query_params: {
        id: randomUUID(),
        userUuid: session.user.id,
        details: `Removed ${discordId} from whitelist`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from whitelist:', error);
    return NextResponse.json({ error: 'Failed to remove from whitelist' }, { status: 500 });
  }
}
