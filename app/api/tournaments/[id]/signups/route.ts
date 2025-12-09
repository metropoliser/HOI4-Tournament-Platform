import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';
import { randomUUID } from 'crypto';

// GET /api/tournaments/[id]/signups - Get all signups for a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get signups with user information
    const result = await clickhouse.query({
      query: `
        SELECT
          s.id,
          s.tournament_id,
          s.user_uuid,
          s.signed_up_at,
          s.status,
          s.preferred_nation,
          u.username,
          u.discord_username,
          u.discord_avatar
        FROM tournament_signups s
        LEFT JOIN users u ON s.user_uuid = u.uuid
        WHERE s.tournament_id = {tournamentId:String} AND s.status = 'registered'
        ORDER BY s.signed_up_at ASC
      `,
      query_params: { tournamentId: id },
      format: 'JSONEachRow',
    });
    const signups = await result.json();

    return NextResponse.json({ signups });
  } catch (error) {
    console.error('Error fetching signups:', error);
    return NextResponse.json({ error: 'Failed to fetch signups' }, { status: 500 });
  }
}

// POST /api/tournaments/[id]/signups - Sign up for a tournament
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { preferred_nation } = body;
    const userUuid = (session.user as any).id;

    // Check if tournament exists and is accepting signups
    const tournamentResult = await clickhouse.query({
      query: 'SELECT status, bracket_size FROM tournaments WHERE id = {id:String}',
      query_params: { id },
      format: 'JSONEachRow',
    });
    const tournaments = await tournamentResult.json<any>();

    if (tournaments.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const tournament = tournaments[0];
    if (tournament.status !== 'not_started') {
      return NextResponse.json({ error: 'Signups are closed for this tournament' }, { status: 400 });
    }

    // Check if user is already signed up
    const existingSignupResult = await clickhouse.query({
      query: `
        SELECT id FROM tournament_signups
        WHERE tournament_id = {tournamentId:String}
        AND user_uuid = {userUuid:String}
        AND status = 'registered'
      `,
      query_params: { tournamentId: id, userUuid },
      format: 'JSONEachRow',
    });
    const existingSignups = await existingSignupResult.json();

    if (existingSignups.length > 0) {
      return NextResponse.json({ error: 'You are already signed up for this tournament' }, { status: 400 });
    }

    // Check if tournament is full
    const signupCountResult = await clickhouse.query({
      query: `
        SELECT count(*) as count FROM tournament_signups
        WHERE tournament_id = {tournamentId:String} AND status = 'registered'
      `,
      query_params: { tournamentId: id },
      format: 'JSONEachRow',
    });
    const countData = await signupCountResult.json<any>();
    const currentSignups = countData[0]?.count || 0;

    if (currentSignups >= tournament.bracket_size) {
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 });
    }

    // Create signup with preferred nation (default to 'GER' if not provided)
    const signupId = randomUUID();
    const preferredNation = preferred_nation || 'GER';

    await clickhouse.command({
      query: `
        INSERT INTO tournament_signups (id, tournament_id, user_uuid, status, preferred_nation)
        VALUES ({id:String}, {tournamentId:String}, {userUuid:String}, 'registered', {preferredNation:String})
      `,
      query_params: {
        id: signupId,
        tournamentId: id,
        userUuid,
        preferredNation,
      },
    });

    // Log activity
    await clickhouse.command({
      query: `
        INSERT INTO activity_logs (id, user_uuid, action_type, details, ip_address)
        VALUES ({id:String}, {userUuid:String}, 'signup_tournament', {details:String}, '')
      `,
      query_params: {
        id: randomUUID(),
        userUuid,
        details: `Signed up for tournament: ${id}`,
      },
    });

    return NextResponse.json({ success: true, signupId });
  } catch (error) {
    console.error('Error creating signup:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}

// DELETE /api/tournaments/[id]/signups - Cancel signup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userUuid = (session.user as any).id;

    // Update signup status to cancelled
    await clickhouse.command({
      query: `
        ALTER TABLE tournament_signups
        UPDATE status = 'cancelled'
        WHERE tournament_id = {tournamentId:String}
        AND user_uuid = {userUuid:String}
        AND status = 'registered'
      `,
      query_params: { tournamentId: id, userUuid },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling signup:', error);
    return NextResponse.json({ error: 'Failed to cancel signup' }, { status: 500 });
  }
}
