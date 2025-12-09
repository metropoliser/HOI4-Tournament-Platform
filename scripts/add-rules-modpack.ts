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

async function addRulesAndModpack() {
  try {
    console.log('Adding rules and modpack fields to casual_games table...');

    // Drop existing table
    console.log('Dropping existing table...');
    await clickhouse.command({
      query: 'DROP TABLE IF EXISTS casual_games'
    });

    console.log('✓ Dropped existing table');

    // Recreate with rules and modpack fields
    console.log('Creating new table with rules and modpack fields...');
    await clickhouse.command({
      query: `
        CREATE TABLE casual_games (
          id String,
          name String,
          description String,
          rules String DEFAULT '',
          modpack_url String DEFAULT '',
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

    console.log('✓ Created casual_games table with rules and modpack fields');

    // Create rules templates table
    console.log('Creating rules_templates table...');
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS rules_templates (
          id String,
          name String,
          rules String,
          created_by_uuid String,
          created_by_name String,
          created_at DateTime DEFAULT now(),
          INDEX idx_created_by created_by_uuid TYPE minmax GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (created_at, id)
      `
    });

    console.log('✓ Created rules_templates table');

    console.log('✓ Migration completed successfully!');
    console.log('✓ casual_games table now has rules and modpack_url fields');
    console.log('✓ rules_templates table created for saving rule templates');
    console.log('Note: All existing games have been cleared. Games will need to be created again.');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

addRulesAndModpack();
