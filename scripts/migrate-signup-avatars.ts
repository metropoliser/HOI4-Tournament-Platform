/**
 * Migration script to update existing casual_game_signups with discord_avatar from users table
 * Run this with: npx tsx scripts/migrate-signup-avatars.ts
 */

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

async function migrateSignupAvatars() {
  console.log('Starting migration to add avatars to existing signups...');

  try {
    // Get all signups that don't have avatars
    const signupsResult = await clickhouse.query({
      query: `
        SELECT id, user_uuid, username
        FROM casual_game_signups
        WHERE discord_avatar = '' OR discord_avatar IS NULL
      `,
      format: 'JSONEachRow',
    });
    const signups = await signupsResult.json() as any[];

    console.log(`Found ${signups.length} signups without avatars`);

    if (signups.length === 0) {
      console.log('No signups to update. Migration complete!');
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (const signup of signups) {
      // Skip manual signups (they don't have real user_uuids)
      if (signup.user_uuid.startsWith('manual_')) {
        // Try to find user by username for manual signups
        const userResult = await clickhouse.query({
          query: `
            SELECT discord_avatar, discord_username
            FROM users
            WHERE username = {username:String}
            LIMIT 1
          `,
          query_params: { username: signup.username },
          format: 'JSONEachRow',
        });
        const users = await userResult.json() as any[];

        if (users.length > 0 && users[0].discord_avatar) {
          await clickhouse.command({
            query: `
              ALTER TABLE casual_game_signups
              UPDATE
                discord_avatar = {discordAvatar:String},
                discord_username = {discordUsername:String}
              WHERE id = {signupId:String}
            `,
            query_params: {
              discordAvatar: users[0].discord_avatar,
              discordUsername: users[0].discord_username,
              signupId: signup.id,
            },
          });
          updated++;
          console.log(`✓ Updated manual signup for ${signup.username} with avatar`);
        } else {
          skipped++;
          console.log(`⊘ No user found for manual signup: ${signup.username}`);
        }
        continue;
      }

      // For regular signups, get avatar from users table
      const userResult = await clickhouse.query({
        query: `
          SELECT discord_avatar, discord_username
          FROM users
          WHERE uuid = {userUuid:String}
          LIMIT 1
        `,
        query_params: { userUuid: signup.user_uuid },
        format: 'JSONEachRow',
      });
      const users = await userResult.json() as any[];

      if (users.length > 0 && users[0].discord_avatar) {
        await clickhouse.command({
          query: `
            ALTER TABLE casual_game_signups
            UPDATE
              discord_avatar = {discordAvatar:String},
              discord_username = {discordUsername:String}
            WHERE id = {signupId:String}
          `,
          query_params: {
            discordAvatar: users[0].discord_avatar,
            discordUsername: users[0].discord_username,
            signupId: signup.id,
          },
        });
        updated++;
        console.log(`✓ Updated signup for ${signup.username} with avatar`);
      } else {
        skipped++;
        console.log(`⊘ No user found for signup: ${signup.username} (${signup.user_uuid})`);
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n=== Migration Complete ===');
    console.log(`✓ Updated: ${updated} signups`);
    console.log(`⊘ Skipped: ${skipped} signups`);

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateSignupAvatars()
  .then(() => {
    console.log('\nMigration finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
