import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Running ${files.length} migration(s)...`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`  → ${file}`);
    await client.query(sql);
  }

  await client.end();
  console.log('Migrations complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
