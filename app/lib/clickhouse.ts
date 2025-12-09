import { createClient } from '@clickhouse/client';

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  database: process.env.CLICKHOUSE_DATABASE || 'hoi4_tournament',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
});

export default clickhouse;

// Test connection
export async function testConnection() {
  try {
    const result = await clickhouse.query({
      query: 'SELECT 1',
      format: 'JSONEachRow',
    });
    const data = await result.json();
    console.log('ClickHouse connection successful:', data);
    return true;
  } catch (error) {
    console.error('ClickHouse connection failed:', error);
    return false;
  }
}
