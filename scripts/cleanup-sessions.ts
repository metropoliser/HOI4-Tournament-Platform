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

async function cleanup() {
  try {
    console.log('Cleaning up duplicate sessions...');

    // Delete all existing sessions (they'll be recreated on next heartbeat)
    await clickhouse.command({
      query: 'TRUNCATE TABLE user_sessions',
    });

    console.log('Successfully cleaned up all sessions!');
    console.log('Active users will create fresh sessions on their next heartbeat.');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await clickhouse.close();
  }
}

cleanup();
