import { createClient } from '@clickhouse/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env.local
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
    console.log('Migrating player_stats table...');

    // Add player_uuid column
    console.log('Adding player_uuid column...');
    await clickhouse.command({
      query: 'ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS player_uuid String DEFAULT \'\' AFTER player_id',
    });

    // Get existing stats
    console.log('Fetching existing player stats...');
    const statsResult = await clickhouse.query({
      query: 'SELECT * FROM player_stats WHERE player_uuid = \'\'',
      format: 'JSONEachRow',
    });
    const stats = await statsResult.json<any>();

    if (stats.length === 0) {
      console.log('No stats to migrate.');
      return;
    }

    // Get user mapping
    const usersResult = await clickhouse.query({
      query: 'SELECT discord_id, uuid FROM users',
      format: 'JSONEachRow',
    });
    const users = await usersResult.json<any>();
    const discordToUuid = new Map(users.map((u: any) => [u.discord_id, u.uuid]));

    // Update player_uuid for each stat
    console.log(`Migrating ${stats.length} player stats...`);
    for (const stat of stats) {
      if (stat.player_id && discordToUuid.has(stat.player_id)) {
        const uuid = discordToUuid.get(stat.player_id);
        await clickhouse.command({
          query: `ALTER TABLE player_stats UPDATE player_uuid = {uuid:String} 
                  WHERE player_id = {playerId:String} AND tournament_id = {tournamentId:String}`,
          query_params: {
            uuid,
            playerId: stat.player_id,
            tournamentId: stat.tournament_id,
          },
        });
        console.log(`  Updated stats for player ${stat.player_id} -> ${uuid}`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await clickhouse.close();
  }
}

migrate();
