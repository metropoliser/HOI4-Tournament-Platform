// Load environment variables from .env.local
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@clickhouse/client';

const envPath = resolve(process.cwd(), '.env.local');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
  console.log('Loaded environment from .env.local');
  console.log('Using ClickHouse user:', process.env.CLICKHOUSE_USERNAME);
} catch (error) {
  console.warn('Could not load .env.local file');
}

// Create ClickHouse client AFTER loading environment variables
// Don't specify database initially - we'll create it first
const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
});

const tables = [
  // Users table - uuid is the primary identifier, discord_id is kept private
  `CREATE TABLE IF NOT EXISTS users (
    id String,
    uuid String,
    discord_id String,
    discord_username String,
    discord_avatar String,
    role Enum('admin' = 1, 'matchmaker' = 2, 'player' = 3),
    whitelisted UInt8,
    created_at DateTime DEFAULT now(),
    last_active DateTime DEFAULT now()
  ) ENGINE = MergeTree()
  ORDER BY (uuid, created_at)`,

  // Tournaments table - uses user uuid
  `CREATE TABLE IF NOT EXISTS tournaments (
    id String,
    name String,
    status Enum('not_started' = 1, 'in_progress' = 2, 'completed' = 3),
    current_round Int32,
    created_by_uuid String,
    is_main UInt8 DEFAULT 0,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
  ) ENGINE = MergeTree()
  ORDER BY (id, created_at)`,

  // Matches table - uses user uuids for players
  `CREATE TABLE IF NOT EXISTS matches (
    id String,
    tournament_id String,
    round Int32,
    match_number Int32,
    player1_uuid String,
    player2_uuid String,
    winner_uuid String,
    status Enum('pending' = 1, 'in_progress' = 2, 'completed' = 3),
    scheduled_time DateTime,
    completed_at DateTime,
    created_at DateTime DEFAULT now()
  ) ENGINE = MergeTree()
  ORDER BY (tournament_id, round, match_number)`,

  // Activity logs table (time-series) - uses user uuid
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id String,
    user_uuid String,
    action_type String,
    details String,
    ip_address String,
    timestamp DateTime DEFAULT now()
  ) ENGINE = MergeTree()
  ORDER BY timestamp`,

  // Player stats table - uses user uuid
  `CREATE TABLE IF NOT EXISTS player_stats (
    player_uuid String,
    tournament_id String,
    matches_played Int32,
    matches_won Int32,
    matches_lost Int32,
    total_time_played Int32,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
  ) ENGINE = SummingMergeTree()
  ORDER BY (player_uuid, tournament_id)`,

  // Whitelist table - uses user uuid
  `CREATE TABLE IF NOT EXISTS whitelist (
    user_uuid String,
    discord_id String,
    added_by_uuid String,
    added_at DateTime DEFAULT now(),
    reason String
  ) ENGINE = MergeTree()
  ORDER BY user_uuid`,

  // User sessions table (active users) - uses user uuid
  `CREATE TABLE IF NOT EXISTS user_sessions (
    session_id String,
    user_uuid String,
    connected_at DateTime DEFAULT now(),
    last_ping DateTime DEFAULT now(),
    ip_address String,
    user_agent String
  ) ENGINE = MergeTree()
  ORDER BY (user_uuid, connected_at)`,
];

async function initDatabase() {
  console.log('Initializing ClickHouse database...');
  const dbName = process.env.CLICKHOUSE_DATABASE || 'hoi4_tournament';

  try {
    // Create database if it doesn't exist
    await clickhouse.command({
      query: `CREATE DATABASE IF NOT EXISTS ${dbName}`,
    });
    console.log('Database created/verified');

    // Create all tables with database prefix
    for (const [index, tableQuery] of tables.entries()) {
      // Add database prefix to table creation
      const queryWithDb = tableQuery.replace('CREATE TABLE IF NOT EXISTS', `CREATE TABLE IF NOT EXISTS ${dbName}.`);
      await clickhouse.command({ query: queryWithDb });
      console.log(`Table ${index + 1}/${tables.length} created/verified`);
    }

    console.log('✓ Database initialization complete!');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default initDatabase;
