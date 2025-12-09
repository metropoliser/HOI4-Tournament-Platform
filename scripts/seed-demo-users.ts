// Script to insert 16 demo users for testing
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';

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
} catch (error) {
  console.warn('Could not load .env.local file');
}

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'hoi4_tournament',
});

// Demo users representing different countries/players
// Using DiceBear avatars API for sample profile pictures
const demoUsers = [
  { username: 'General_Schmidt', discordId: 'demo_user_1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Schmidt', country: 'Germany' },
  { username: 'Commander_Ivanov', discordId: 'demo_user_2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivanov', country: 'Soviet Union' },
  { username: 'General_Patton', discordId: 'demo_user_3', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patton', country: 'United States' },
  { username: 'Marshal_Churchill', discordId: 'demo_user_4', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Churchill', country: 'United Kingdom' },
  { username: 'Generale_Romano', discordId: 'demo_user_5', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Romano', country: 'Italy' },
  { username: 'General_Yamamoto', discordId: 'demo_user_6', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yamamoto', country: 'Japan' },
  { username: 'General_Dubois', discordId: 'demo_user_7', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dubois', country: 'France' },
  { username: 'Commander_Zhang', discordId: 'demo_user_8', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang', country: 'China' },
  { username: 'General_MacArthur', discordId: 'demo_user_9', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MacArthur', country: 'Australia' },
  { username: 'Marshal_Tito', discordId: 'demo_user_10', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tito', country: 'Yugoslavia' },
  { username: 'General_Franco', discordId: 'demo_user_11', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Franco', country: 'Spain' },
  { username: 'Commander_Silva', discordId: 'demo_user_12', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Silva', country: 'Brazil' },
  { username: 'General_Nowak', discordId: 'demo_user_13', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nowak', country: 'Poland' },
  { username: 'Marshal_Antonescu', discordId: 'demo_user_14', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Antonescu', country: 'Romania' },
  { username: 'Commander_Eriksson', discordId: 'demo_user_15', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eriksson', country: 'Sweden' },
  { username: 'General_Pasha', discordId: 'demo_user_16', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pasha', country: 'Turkey' },
];

async function seedDemoUsers() {
  console.log('Seeding 16 demo users...\n');

  try {
    // Check if demo users already exist
    const checkResult = await clickhouse.query({
      query: "SELECT discord_id FROM users WHERE discord_id LIKE 'demo_user_%'",
      format: 'JSONEachRow',
    });
    const existingUsers = await checkResult.json<any>();

    if (existingUsers.length > 0) {
      console.log(`Found ${existingUsers.length} existing demo users. Deleting them first...`);
      await clickhouse.command({
        query: "ALTER TABLE users DELETE WHERE discord_id LIKE 'demo_user_%'",
      });
      await clickhouse.command({
        query: "ALTER TABLE whitelist DELETE WHERE discord_id LIKE 'demo_user_%'",
      });
      console.log('Existing demo users deleted.\n');
    }

    // Insert demo users
    for (const user of demoUsers) {
      const userId = randomUUID();
      const userUuid = randomUUID();

      // Insert into users table
      await clickhouse.command({
        query: `INSERT INTO users (id, uuid, discord_id, discord_username, discord_avatar, role, whitelisted)
                VALUES ({id:String}, {uuid:String}, {discordId:String}, {username:String}, {avatar:String}, 'player', 1)`,
        query_params: {
          id: userId,
          uuid: userUuid,
          discordId: user.discordId,
          username: user.username,
          avatar: user.avatar,
        },
      });

      // Add to whitelist using user uuid
      await clickhouse.command({
        query: `INSERT INTO whitelist (user_uuid, discord_id, added_by_uuid, reason)
                VALUES ({userUuid:String}, {discordId:String}, '', {reason:String})`,
        query_params: {
          userUuid: userUuid,
          discordId: user.discordId,
          reason: `Demo user for ${user.country}`,
        },
      });

      console.log(`✓ Created user: ${user.username} (${user.country}) [UUID: ${userUuid}]`);
    }

    console.log('\n✓ Successfully created 16 demo users!');
    console.log('\nDemo users info:');
    demoUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} (${user.country})`);
    });

    console.log('\nYou can now create a tournament with these users!');
  } catch (error) {
    console.error('✗ Error seeding demo users:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedDemoUsers;
