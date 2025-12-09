import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import clickhouse from '@/app/lib/clickhouse';

// POST /api/admin/add-nation-field - Add nation field to users table (admin only)
export async function POST() {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Adding nation field to users table...');

    // Add nation column to users table
    await clickhouse.command({
      query: `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS nation String DEFAULT 'GER'
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully added nation field to users table. Default nation set to GER (Germany).'
    });
  } catch (error) {
    console.error('Error adding nation field:', error);
    return NextResponse.json({
      error: 'Failed to add nation field',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
