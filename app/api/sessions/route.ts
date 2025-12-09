import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// GET /api/sessions - Get active user sessions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can see all sessions
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get sessions active in the last 5 minutes
    const result = await clickhouse.query({
      query: `
        SELECT s.*, u.discord_username, u.discord_id
        FROM user_sessions s
        LEFT JOIN users u ON s.user_uuid = u.uuid
        WHERE s.last_ping > now() - INTERVAL 5 MINUTE
        ORDER BY s.last_ping DESC
      `,
      format: 'JSONEachRow',
    });
    const sessions = await result.json();

    return NextResponse.json({ sessions, count: sessions.length });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST /api/sessions - Create/update user session (heartbeat)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.id) {
      return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    // Delete any existing sessions for this user (to ensure only one session per user)
    await clickhouse.command({
      query: 'ALTER TABLE user_sessions DELETE WHERE user_uuid = {userUuid:String}',
      query_params: { userUuid: session.user.id },
    });

    // Insert fresh session for this user
    await clickhouse.command({
      query: `INSERT INTO user_sessions (session_id, user_uuid, connected_at, last_ping, ip_address, user_agent)
              VALUES ({sessionId:String}, {userUuid:String}, now(), now(), {ipAddress:String}, {userAgent:String})`,
      query_params: {
        sessionId: session.user.id, // Use user UUID as session ID for simplicity
        userUuid: session.user.id,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({
      error: 'Failed to update session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/sessions - Remove session (logout)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await clickhouse.command({
      query: 'ALTER TABLE user_sessions DELETE WHERE session_id = {sessionId:String}',
      query_params: { sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
