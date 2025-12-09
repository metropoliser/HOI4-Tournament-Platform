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

async function createNewsTable() {
  try {
    console.log('Creating news table...');

    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS news (
          id String,
          title String,
          excerpt String,
          content String,
          category String,
          published UInt8 DEFAULT 1,
          created_by_uuid String,
          created_by_name String,
          created_at DateTime DEFAULT now(),
          updated_at DateTime DEFAULT now(),
          INDEX idx_category category TYPE set(10) GRANULARITY 1,
          INDEX idx_published published TYPE minmax GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (created_at, id)
      `
    });

    console.log('✓ News table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating news table:', error);
    process.exit(1);
  }
}

createNewsTable();
