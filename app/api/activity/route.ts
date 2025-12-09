import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';

// GET /api/activity - Get activity logs
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const actionType = searchParams.get('action_type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const queryParams: any = {};

    if (userId) {
      query += ' AND user_id = {userId:String}';
      queryParams.userId = userId;
    }

    if (actionType) {
      query += ' AND action_type = {actionType:String}';
      queryParams.actionType = actionType;
    }

    // Non-admin users can only see their own activity
    if (session.user.role !== 'admin' && !userId) {
      query += ' AND user_id = {currentUserId:String}';
      queryParams.currentUserId = session.user.discordId;
    } else if (session.user.role !== 'admin' && userId !== session.user.discordId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    query += ` ORDER BY timestamp DESC LIMIT ${limit}`;

    const result = await clickhouse.query({
      query,
      query_params: queryParams,
      format: 'JSONEachRow',
    });
    const activities = await result.json();

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
