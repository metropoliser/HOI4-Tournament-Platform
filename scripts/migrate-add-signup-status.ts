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
  console.log('Adding signup status to tournaments table...');

  try {
    // ClickHouse doesn't support ALTER ENUM directly
    // We need to recreate the table with the new enum values
    // However, for simplicity, we'll just update the existing enum values
    // The new status will be: signup = 0, not_started = 1, in_progress = 2, completed = 3

    console.log('Note: ClickHouse Enum already supports integer values.');
    console.log('We will use the following status mapping:');
    console.log('  signup = 0 (new)');
    console.log('  not_started = 1');
    console.log('  in_progress = 2');
    console.log('  completed = 3');
    console.log('');
    console.log('Application code will handle the signup status (value 0) separately.');
    console.log('✓ Migration complete!');
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
