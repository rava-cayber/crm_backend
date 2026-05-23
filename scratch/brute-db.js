const { Pool } = require('pg');

const passwords = ['12345', '123456', 'postgres', 'root', 'admin', '1234'];
const connectionStringBase = 'postgresql://postgres:';
const connectionStringSuffix = '@localhost:5432/crm?schema=public';

async function testAll() {
  for (const pw of passwords) {
    console.log(`Testing password: ${pw}`);
    const pool = new Pool({
      connectionString: `${connectionStringBase}${pw}${connectionStringSuffix}`,
      connectionTimeoutMillis: 2000,
    });

    try {
      const client = await pool.connect();
      console.log(`SUCCESS with password: ${pw}`);
      client.release();
      process.exit(0);
    } catch (err) {
      console.log(`Failed: ${err.message}`);
    } finally {
      await pool.end();
    }
  }
}

testAll();
