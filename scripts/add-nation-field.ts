import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import clickhouse from '../app/lib/clickhouse';

async function addNationField() {
  try {
    console.log('Adding nation field to users table...');

    // Add nation column to users table
    await clickhouse.command({
      query: `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS nation String DEFAULT 'GER'
      `,
    });

    console.log('✅ Successfully added nation field to users table');
    console.log('Default nation set to GER (Germany) for all users');

  } catch (error) {
    console.error('❌ Error adding nation field:', error);
    process.exit(1);
  }
}

addNationField();
