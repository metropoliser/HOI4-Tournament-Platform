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
    console.log('Starting user_sessions table migration...');

    // Add user_uuid column to user_sessions table
    console.log('Adding user_uuid column to user_sessions table...');
    await clickhouse.command({
      query: 'ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS user_uuid String DEFAULT \'\' AFTER session_id',
    });

    console.log('Migration completed successfully!');
    console.log('The user_uuid column has been added to user_sessions table.');
    console.log('Old sessions with user_id will expire naturally (they use last_ping for TTL).');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await clickhouse.close();
  }
}

migrate();
