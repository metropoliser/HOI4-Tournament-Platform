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
    username String DEFAULT '',
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
    bracket_size UInt8 DEFAULT 8,
    created_by_uuid String,
    is_main UInt8 DEFAULT 0,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
  ) ENGINE = MergeTree()
  ORDER BY (id, created_at)`,

  // Tournament signups table
  `CREATE TABLE IF NOT EXISTS tournament_signups (
    id String,
    tournament_id String,
    user_uuid String,
    preferred_nation String DEFAULT 'GER',
    signed_up_at DateTime DEFAULT now(),
    status Enum('registered' = 1, 'confirmed' = 2, 'cancelled' = 3) DEFAULT 'registered'
  ) ENGINE = MergeTree()
  ORDER BY (tournament_id, user_uuid, signed_up_at)`,

  // Matches table - uses user uuids for players
  `CREATE TABLE IF NOT EXISTS matches (
    id String,
    tournament_id String,
    round Int32,
    match_number Int32,
    player1_uuid String,
    player2_uuid String,
    player1_nation String DEFAULT '',
    player2_nation String DEFAULT '',
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

  // News table
  `CREATE TABLE IF NOT EXISTS news (
    id String,
    title String,
    excerpt String,
    content String,
    category String,
    published UInt8 DEFAULT 1,
    created_by_uuid String,
    created_by_name String,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now(),
    INDEX idx_category category TYPE set(10) GRANULARITY 1,
    INDEX idx_published published TYPE minmax GRANULARITY 1
  ) ENGINE = MergeTree()
  ORDER BY (created_at, id)`,

  // Casual games table
  `CREATE TABLE IF NOT EXISTS casual_games (
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
  ORDER BY (created_at, id)`,

  // Casual game signups table
  `CREATE TABLE IF NOT EXISTS casual_game_signups (
    id String,
    game_id String,
    user_uuid String,
    username String,
    discord_username String,
    discord_avatar String,
    preferred_nation String DEFAULT 'GER',
    is_coop UInt8 DEFAULT 0,
    status String DEFAULT 'pending',
    created_at DateTime DEFAULT now(),
    INDEX idx_game_id game_id TYPE minmax GRANULARITY 1,
    INDEX idx_user_uuid user_uuid TYPE minmax GRANULARITY 1,
    INDEX idx_nation preferred_nation TYPE set(100) GRANULARITY 1
  ) ENGINE = MergeTree()
  ORDER BY (game_id, created_at, id)`,

  // Rules templates table
  `CREATE TABLE IF NOT EXISTS rules_templates (
    id String,
    name String,
    rules String,
    created_by_uuid String,
    created_by_name String,
    created_at DateTime DEFAULT now(),
    INDEX idx_created_by created_by_uuid TYPE minmax GRANULARITY 1
  ) ENGINE = MergeTree()
  ORDER BY (created_at, id)`,
];

async function initDatabase() {
  console.log('Initializing ClickHouse database...');
  const dbName = process.env.CLICKHOUSE_DATABASE || 'hoi4_tournament';

  try {
    // Create database if it doesn't exist
    await clickhouse.command({
      query: `CREATE DATABASE IF NOT EXISTS ${dbName}`,
    });
    console.log('✓ Database created/verified');

    // Create all tables with database prefix
    for (const [index, tableQuery] of tables.entries()) {
      // Add database prefix to table creation
      const queryWithDb = tableQuery.replace('CREATE TABLE IF NOT EXISTS', `CREATE TABLE IF NOT EXISTS ${dbName}.`);
      await clickhouse.command({ query: queryWithDb });
      console.log(`✓ Table ${index + 1}/${tables.length} created/verified`);
    }

    console.log('\n✓ Database initialization complete!');
    console.log('\nCreated tables:');
    console.log('  1. users - User accounts with Discord integration');
    console.log('  2. tournaments - Tournament information');
    console.log('  3. tournament_signups - Player signups for tournaments');
    console.log('  4. matches - Tournament matches');
    console.log('  5. activity_logs - Audit logs');
    console.log('  6. player_stats - Player statistics');
    console.log('  7. whitelist - Whitelisted users');
    console.log('  8. user_sessions - Active user sessions');
    console.log('  9. news - News articles');
    console.log(' 10. casual_games - Casual game sessions');
    console.log(' 11. casual_game_signups - Casual game signups');
    console.log(' 12. rules_templates - Reusable game rules templates');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  } finally {
    await clickhouse.close();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default initDatabase;
