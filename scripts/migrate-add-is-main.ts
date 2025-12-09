// Migration script to add is_main column to existing tournaments table
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
  console.log('Running migration to add is_main column...');

  try {
    // Check if column exists
    const result = await clickhouse.query({
      query: 'DESCRIBE TABLE tournaments',
      format: 'JSONEachRow',
    });
    const columns = await result.json<any>();
    const hasIsMain = columns.some((col: any) => col.name === 'is_main');

    if (hasIsMain) {
      console.log('✓ Column is_main already exists, no migration needed');
      return;
    }

    // Add the is_main column
    await clickhouse.command({
      query: 'ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_main UInt8 DEFAULT 0',
    });

    console.log('✓ Successfully added is_main column to tournaments table');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default migrate;
