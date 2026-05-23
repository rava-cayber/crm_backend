const { Pool } = require('pg');

async function test() {
  const connectionString = 'postgresql://postgres@localhost:5432/crm?schema=public';
  const pool = new Pool({ connectionString });
  try {
    const client = await pool.connect();
    console.log('SUCCESS with NO password');
    client.release();
  } catch (err) {
    console.log('Failed NO password');
  } finally {
    await pool.end();
  }
}
test();
