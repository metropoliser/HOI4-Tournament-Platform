import { createClient } from '@clickhouse/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  database: process.env.CLICKHOUSE_DATABASE || 'hoi4_tournament',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
});

console.log('Using ClickHouse config:', {
  url: process.env.CLICKHOUSE_HOST,
  database: process.env.CLICKHOUSE_DATABASE,
  username: process.env.CLICKHOUSE_USERNAME,
});

async function setupCasualGamesTables() {
  try {
    console.log('Creating casual_game_signups table...');
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS casual_game_signups (
          id String,
          user_uuid String,
          username String,
          discord_username String,
          discord_avatar String,
          nation_tag String,
          created_at DateTime DEFAULT now(),
          INDEX idx_user_uuid user_uuid TYPE minmax GRANULARITY 1,
          INDEX idx_nation nation_tag TYPE set(100) GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (created_at, id)
      `
    });
    console.log('✓ casual_game_signups table created');

    console.log('Creating casual_games table...');
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS casual_games (
          id String,
          name String,
          description String,
          status String DEFAULT 'open',
          created_by_uuid String,
          created_by_name String,
          max_players UInt16 DEFAULT 0,
          created_at DateTime DEFAULT now(),
          started_at DateTime DEFAULT toDateTime('1970-01-01 00:00:00'),
          INDEX idx_status status TYPE set(10) GRANULARITY 1,
          INDEX idx_created_by created_by_uuid TYPE minmax GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (created_at, id)
      `
    });
    console.log('✓ casual_games table created');

    console.log('Creating casual_game_assignments table...');
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS casual_game_assignments (
          id String,
          game_id String,
          user_uuid String,
          username String,
          nation_tag String,
          assigned_at DateTime DEFAULT now(),
          assigned_by_uuid String,
          INDEX idx_game_id game_id TYPE minmax GRANULARITY 1,
          INDEX idx_user_uuid user_uuid TYPE minmax GRANULARITY 1,
          INDEX idx_nation nation_tag TYPE set(100) GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (game_id, assigned_at, id)
      `
    });
    console.log('✓ casual_game_assignments table created');

    console.log('\n✓ All casual game tables created successfully!');
  } catch (error) {
    console.error('Error setting up tables:', error);
    throw error;
  } finally {
    await clickhouse.close();
  }
}

setupCasualGamesTables().catch(console.error);
