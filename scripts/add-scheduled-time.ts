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

async function addScheduledTime() {
  try {
    console.log('Adding scheduled_time field to casual_games table...');

    // Drop existing table
    console.log('Dropping existing table...');
    await clickhouse.command({
      query: 'DROP TABLE IF EXISTS casual_games'
    });

    console.log('✓ Dropped existing table');

    // Recreate with scheduled_time field
    console.log('Creating new table with scheduled_time field...');
    await clickhouse.command({
      query: `
        CREATE TABLE casual_games (
          id String,
          name String,
          description String,
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

    console.log('✓ Migration completed successfully!');
    console.log('✓ casual_games table now has scheduled_time field');
    console.log('Note: All existing games have been cleared. Games will need to be created again.');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

addScheduledTime();
