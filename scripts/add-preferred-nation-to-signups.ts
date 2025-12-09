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

async function addPreferredNation() {
  console.log('Adding preferred_nation field to tournament_signups table...');

  try {
    // Add preferred_nation column with default value
    await clickhouse.command({
      query: `ALTER TABLE tournament_signups
              ADD COLUMN IF NOT EXISTS preferred_nation String DEFAULT 'GER'`,
    });
    console.log('✓ Column preferred_nation added successfully');

    // Verify the column was added
    const result = await clickhouse.query({
      query: 'DESCRIBE tournament_signups',
      format: 'JSONEachRow',
    });
    const columns = await result.json();
    console.log('Updated table structure:');
    console.log(columns);
    console.log('✓ Migration complete!');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  }
}

// Run the migration
addPreferredNation()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
