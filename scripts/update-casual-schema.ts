import { createClient } from '@clickhouse/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  database: process.env.CLICKHOUSE_DATABASE || 'hoi4_tournament',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
});

async function updateCasualSchema() {
  try {
    console.log('Dropping old casual_game_signups table...');
    await clickhouse.command({
      query: 'DROP TABLE IF EXISTS casual_game_signups'
    });
    console.log('✓ Old table dropped');

    console.log('Creating new casual_game_signups table (game-specific)...');
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS casual_game_signups (
          id String,
          game_id String,
          user_uuid String,
          username String,
          discord_username String,
          discord_avatar String,
          preferred_nation String,
          status String DEFAULT 'pending',
          created_at DateTime DEFAULT now(),
          INDEX idx_game_id game_id TYPE minmax GRANULARITY 1,
          INDEX idx_user_uuid user_uuid TYPE minmax GRANULARITY 1,
          INDEX idx_nation preferred_nation TYPE set(100) GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (game_id, created_at, id)
      `
    });
    console.log('✓ New casual_game_signups table created');

    console.log('Dropping casual_game_assignments table (no longer needed)...');
    await clickhouse.command({
      query: 'DROP TABLE IF EXISTS casual_game_assignments'
    });
    console.log('✓ Assignments table dropped');

    console.log('\n✓ Schema updated successfully!');
    console.log('\nNow casual games work like tournaments:');
    console.log('- Players sign up for specific games with their preferred nation');
    console.log('- Matchmakers can see all signups for each game');
    console.log('- No brackets, just nation selection');
  } catch (error) {
    console.error('Error updating schema:', error);
    throw error;
  } finally {
    await clickhouse.close();
  }
}

updateCasualSchema().catch(console.error);
