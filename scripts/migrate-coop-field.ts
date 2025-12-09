import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@clickhouse/client';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Create a new client instance after environment variables are loaded
const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  database: process.env.CLICKHOUSE_DATABASE || 'hoi4_tournament',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
});

async function migrateCoopField() {
  try {
    console.log('Migrating casual_game_signups table to add is_coop field...');

    // Drop existing table
    console.log('Dropping existing table...');
    await clickhouse.command({
      query: 'DROP TABLE IF EXISTS casual_game_signups'
    });

    console.log('✓ Dropped existing table');

    // Recreate with is_coop field
    console.log('Creating new table with is_coop field...');
    await clickhouse.command({
      query: `
        CREATE TABLE casual_game_signups (
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

    console.log('✓ Migration completed successfully!');
    console.log('✓ casual_game_signups table now has is_coop field');
    console.log('Note: All existing signups have been cleared. Users will need to sign up again.');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateCoopField();
