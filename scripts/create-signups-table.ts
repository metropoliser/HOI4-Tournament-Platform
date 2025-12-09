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

async function createTable() {
  console.log('Creating tournament_signups table...');

  try {
    await clickhouse.command({
      query: `CREATE TABLE IF NOT EXISTS tournament_signups (
        id String,
        tournament_id String,
        user_uuid String,
        signed_up_at DateTime DEFAULT now(),
        status Enum('registered' = 1, 'confirmed' = 2, 'cancelled' = 3) DEFAULT 'registered'
      ) ENGINE = MergeTree()
      ORDER BY (tournament_id, user_uuid, signed_up_at)`,
    });
    console.log('✓ Table tournament_signups created successfully');

    // Verify the table was created
    const result = await clickhouse.query({
      query: 'DESCRIBE tournament_signups',
      format: 'JSONEachRow',
    });
    const columns = await result.json();
    console.log('Table structure:');
    console.log(columns);
    console.log('✓ Migration complete!');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createTable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default createTable;
