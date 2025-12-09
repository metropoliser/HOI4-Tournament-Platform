// Verification script to check database schema
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
} catch (error) {
  console.warn('Could not load .env.local file');
}

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: process.env.CLICKHOUSE_DATABASE || 'hoi4_tournament',
});

async function verify() {
  console.log('Verifying database schema...\n');

  try {
    // Check tournaments table
    const result = await clickhouse.query({
      query: 'DESCRIBE TABLE tournaments',
      format: 'JSONEachRow',
    });
    const columns = await result.json<any>();

    console.log('Tournaments table columns:');
    columns.forEach((col: any) => {
      console.log(`  - ${col.name}: ${col.type}`);
    });

    const hasIsMain = columns.some((col: any) => col.name === 'is_main');

    if (hasIsMain) {
      console.log('\n✓ is_main column exists in tournaments table');
    } else {
      console.log('\n✗ is_main column is missing from tournaments table');
    }

    // Check users table
    const usersResult = await clickhouse.query({
      query: 'DESCRIBE TABLE users',
      format: 'JSONEachRow',
    });
    const userColumns = await usersResult.json<any>();

    console.log('\nUsers table role column:');
    const roleColumn = userColumns.find((col: any) => col.name === 'role');
    if (roleColumn) {
      console.log(`  - ${roleColumn.name}: ${roleColumn.type}`);
    }

    console.log('\n✓ Schema verification complete');
  } catch (error) {
    console.error('✗ Verification failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  verify()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default verify;
