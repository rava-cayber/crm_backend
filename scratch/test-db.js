const { Pool } = require('pg');
require('dotenv').config();

async function test() {
  console.log('Using URL:', process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    console.log('Successfully connected!');
    const res = await client.query('SELECT current_database()');
    console.log('Database:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Connection error:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
}

test();
