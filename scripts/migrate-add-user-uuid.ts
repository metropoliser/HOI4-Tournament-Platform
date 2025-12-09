import { createClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env.local BEFORE creating client
const envPath = resolve(process.cwd(), '.env.local');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log('Loaded environment from .env.local');
} catch (error) {
  console.warn('Could not load .env.local file');
}

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'hoi4_tournament',
});

async function migrate() {
  try {
    console.log('Starting migration to add UUID to users...');

    // Step 1: Add uuid column to users table
    console.log('Adding uuid column to users table...');
    await clickhouse.command({
      query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS uuid String DEFAULT \'\' AFTER id',
    });

    // Step 2: Get all existing users
    console.log('Fetching existing users...');
    const result = await clickhouse.query({
      query: 'SELECT id, discord_id FROM users WHERE uuid = \'\'',
      format: 'JSONEachRow',
    });
    const users = await result.json<{ id: string; discord_id: string }>();

    // Step 3: Generate and assign UUIDs to existing users
    console.log(`Generating UUIDs for ${users.length} users...`);
    for (const user of users) {
      const uuid = randomUUID();
      await clickhouse.command({
        query: 'ALTER TABLE users UPDATE uuid = {uuid:String} WHERE id = {id:String}',
        query_params: { uuid, id: user.id },
      });
      console.log(`  Assigned UUID ${uuid} to user ${user.discord_id}`);
    }

    // Step 4: Create a mapping table for discord_id to uuid (for migration of related tables)
    console.log('Creating temporary mapping...');
    const mappingResult = await clickhouse.query({
      query: 'SELECT discord_id, uuid FROM users WHERE uuid != \'\'',
      format: 'JSONEachRow',
    });
    const mapping = await mappingResult.json<{ discord_id: string; uuid: string }>();
    const discordToUuid = new Map(mapping.map(m => [m.discord_id, m.uuid]));

    // Step 5: Add uuid columns to matches table
    console.log('Adding uuid columns to matches table...');
    await clickhouse.command({
      query: `ALTER TABLE matches
              ADD COLUMN IF NOT EXISTS player1_uuid String DEFAULT '' AFTER player1_id,
              ADD COLUMN IF NOT EXISTS player2_uuid String DEFAULT '' AFTER player2_id,
              ADD COLUMN IF NOT EXISTS winner_uuid String DEFAULT '' AFTER winner_id`,
    });

    // Step 6: Migrate matches data
    console.log('Migrating matches data...');
    const matchesResult = await clickhouse.query({
      query: 'SELECT id, player1_id, player2_id, winner_id FROM matches',
      format: 'JSONEachRow',
    });
    const matches = await matchesResult.json<{
      id: string;
      player1_id: string;
      player2_id: string;
      winner_id: string;
    }>();

    for (const match of matches) {
      const updates: string[] = [];
      const params: Record<string, any> = { matchId: match.id };

      if (match.player1_id && discordToUuid.has(match.player1_id)) {
        updates.push('player1_uuid = {player1Uuid:String}');
        params.player1Uuid = discordToUuid.get(match.player1_id);
      }
      if (match.player2_id && discordToUuid.has(match.player2_id)) {
        updates.push('player2_uuid = {player2Uuid:String}');
        params.player2Uuid = discordToUuid.get(match.player2_id);
      }
      if (match.winner_id && discordToUuid.has(match.winner_id)) {
        updates.push('winner_uuid = {winnerUuid:String}');
        params.winnerUuid = discordToUuid.get(match.winner_id);
      }

      if (updates.length > 0) {
        await clickhouse.command({
          query: `ALTER TABLE matches UPDATE ${updates.join(', ')} WHERE id = {matchId:String}`,
          query_params: params,
        });
      }
    }

    // Step 7: Add uuid column to tournaments table
    console.log('Adding uuid column to tournaments table...');
    await clickhouse.command({
      query: 'ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS created_by_uuid String DEFAULT \'\' AFTER created_by',
    });

    // Step 8: Migrate tournaments data
    console.log('Migrating tournaments data...');
    const tournamentsResult = await clickhouse.query({
      query: 'SELECT id, created_by FROM tournaments',
      format: 'JSONEachRow',
    });
    const tournaments = await tournamentsResult.json<{ id: string; created_by: string }>();

    for (const tournament of tournaments) {
      if (tournament.created_by && discordToUuid.has(tournament.created_by)) {
        await clickhouse.command({
          query: 'ALTER TABLE tournaments UPDATE created_by_uuid = {createdByUuid:String} WHERE id = {tournamentId:String}',
          query_params: {
            createdByUuid: discordToUuid.get(tournament.created_by),
            tournamentId: tournament.id,
          },
        });
      }
    }

    // Step 9: Add uuid column to activity_logs table
    console.log('Adding uuid column to activity_logs table...');
    await clickhouse.command({
      query: 'ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_uuid String DEFAULT \'\' AFTER user_id',
    });

    // Step 10: Migrate activity_logs data
    console.log('Migrating activity_logs data...');
    const logsResult = await clickhouse.query({
      query: 'SELECT id, user_id FROM activity_logs',
      format: 'JSONEachRow',
    });
    const logs = await logsResult.json<{ id: string; user_id: string }>();

    for (const log of logs) {
      if (log.user_id && discordToUuid.has(log.user_id)) {
        await clickhouse.command({
          query: 'ALTER TABLE activity_logs UPDATE user_uuid = {userUuid:String} WHERE id = {logId:String}',
          query_params: {
            userUuid: discordToUuid.get(log.user_id),
            logId: log.id,
          },
        });
      }
    }

    console.log('Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update application code to use uuid instead of discord_id');
    console.log('2. Test thoroughly');
    console.log('3. Drop old columns (player1_id, player2_id, winner_id, created_by, user_id) once verified');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await clickhouse.close();
  }
}

migrate();
