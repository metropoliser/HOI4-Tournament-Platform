import { createClient } from '@clickhouse/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  database: process.env.CLICKHOUSE_DATABASE || 'hoi4_tournament',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
});

async function verifyTables() {
  try {
    console.log('Verifying casual game tables...\n');

    // Check casual_game_signups
    const signupsResult = await clickhouse.query({
      query: 'DESCRIBE TABLE casual_game_signups',
      format: 'JSONEachRow',
    });
    const signupsColumns = await signupsResult.json();
    console.log('✓ casual_game_signups table:');
    console.log(signupsColumns.map((col: any) => `  - ${col.name}: ${col.type}`).join('\n'));
    console.log();

    // Check casual_games
    const gamesResult = await clickhouse.query({
      query: 'DESCRIBE TABLE casual_games',
      format: 'JSONEachRow',
    });
    const gamesColumns = await gamesResult.json();
    console.log('✓ casual_games table:');
    console.log(gamesColumns.map((col: any) => `  - ${col.name}: ${col.type}`).join('\n'));
    console.log();

    // Check casual_game_assignments
    const assignmentsResult = await clickhouse.query({
      query: 'DESCRIBE TABLE casual_game_assignments',
      format: 'JSONEachRow',
    });
    const assignmentsColumns = await assignmentsResult.json();
    console.log('✓ casual_game_assignments table:');
    console.log(assignmentsColumns.map((col: any) => `  - ${col.name}: ${col.type}`).join('\n'));
    console.log();

    console.log('✓ All tables verified successfully!');
  } catch (error) {
    console.error('Error verifying tables:', error);
    throw error;
  } finally {
    await clickhouse.close();
  }
}

verifyTables().catch(console.error);
