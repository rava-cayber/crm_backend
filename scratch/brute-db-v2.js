const { Pool } = require('pg');

const passwords = ['12345', '123456', '12345678', 'postgres', 'root', 'admin', '1234', '1234567', 'password', 'qwerty', '1111', '123456789'];
const connectionStringBase = 'postgresql://postgres:';
const connectionStringSuffix = '@localhost:5432/crm?schema=public';

async function testAll() {
  for (const pw of passwords) {
    process.stdout.write(`Testing password: ${pw}... `);
    const pool = new Pool({
      connectionString: `${connectionStringBase}${pw}${connectionStringSuffix}`,
      connectionTimeoutMillis: 1000,
    });

    try {
      const client = await pool.connect();
      console.log(`\nSUCCESS with password: ${pw}`);
      client.release();
      process.exit(0);
    } catch (err) {
      console.log(`Failed`);
    } finally {
      await pool.end();
    }
  }
  console.log('All attempts failed.');
}

testAll();
