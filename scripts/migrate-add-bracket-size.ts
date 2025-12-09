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
  console.log('Adding bracket_size column to tournaments table...');

  try {
    // Add bracket_size column with default value of 16 for existing tournaments
    await clickhouse.command({
      query: `ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS bracket_size UInt8 DEFAULT 16`,
    });
    console.log('✓ Column bracket_size added successfully');

    // Verify the column was added
    const result = await clickhouse.query({
      query: 'DESCRIBE tournaments',
      format: 'JSONEachRow',
    });
    const columns = await result.json();
    const hasBracketSize = columns.some((col: any) => col.name === 'bracket_size');

    if (hasBracketSize) {
      console.log('✓ Migration complete! bracket_size column is present.');
    } else {
      console.error('✗ Migration failed! bracket_size column not found.');
    }
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
