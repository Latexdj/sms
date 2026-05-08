const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
  });

  await client.connect();
  const res = await client.query('SELECT * FROM "User" LIMIT 5');
  console.log("Users:", res.rows);
  
  const users2 = await client.query('SELECT * FROM users LIMIT 5').catch(() => null);
  if(users2) console.log("users table:", users2.rows);

  await client.end();
}

main().catch(console.error);
