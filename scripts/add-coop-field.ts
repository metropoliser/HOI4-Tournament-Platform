import clickhouse from '../app/lib/clickhouse';

async function addCoopField() {
  try {
    console.log('Updating casual_game_signups schema to add is_coop field...');

    // Drop existing table
    await clickhouse.command({
      query: 'DROP TABLE IF EXISTS casual_game_signups'
    });

    // Recreate with is_coop field
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS casual_game_signups (
          id String,
          game_id String,
          user_uuid String,
          username String,
          discord_username String,
          discord_avatar String,
          preferred_nation String,
          is_coop UInt8 DEFAULT 0,
          status String DEFAULT 'pending',
          created_at DateTime DEFAULT now(),
          INDEX idx_game_id game_id TYPE minmax GRANULARITY 1,
          INDEX idx_user_uuid user_uuid TYPE minmax GRANULARITY 1,
          INDEX idx_nation preferred_nation TYPE set(100) GRANULARITY 1
        ) ENGINE = MergeTree()
        ORDER BY (game_id, created_at, id)
      `
    });

    console.log('✓ Schema updated successfully!');
    console.log('✓ Added is_coop field to casual_game_signups table');
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

addCoopField();
