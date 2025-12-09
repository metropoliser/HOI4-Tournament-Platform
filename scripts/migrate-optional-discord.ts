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
    console.log('Starting migration to make Discord optional...');

    // Add username column to users table
    console.log('Adding username column to users table...');
    await clickhouse.command({
      query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS username String DEFAULT \'\' AFTER uuid',
    });

    // Populate username with discord_username for existing users
    console.log('Populating username field from discord_username...');
    await clickhouse.command({
      query: `ALTER TABLE users UPDATE username = discord_username WHERE username = ''`,
    });

    console.log('Migration completed successfully!');
    console.log('Discord fields (discord_id, discord_username, discord_avatar) are now optional.');
    console.log('All users now have a username field (copied from discord_username for existing users).');
    console.log('You can now create users without Discord accounts.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await clickhouse.close();
  }
}

migrate();
