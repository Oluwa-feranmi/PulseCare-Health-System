/**
 * PulseCare Health System - Schema Migration Runner
 * Executes database migrations against target database (Postgres or SQLite)
 */

import fs from 'fs';
import path from 'path';
import db from './db.js';

export async function runMigrations(): Promise<void> {
  console.log('[MIGRATE] Starting database migrations...');
  await db.initialize();

  const migrationsDir = path.resolve(process.cwd(), 'database/migrations');
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at: ${migrationsDir}`);
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`[MIGRATE] Applying migration: ${file}`);
    let sqlContent = fs.readFileSync(filePath, 'utf-8');

    // If PostgreSQL, convert SQLite-specific syntax to Postgres
    const isPostgres = db.getIsPostgres();
    if (isPostgres) {
      sqlContent = sqlContent.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
    }

    // Split statements by semicolon where appropriate or run whole script
    try {
      await db.execScript(sqlContent);
      console.log(`[MIGRATE] Successfully applied ${file}`);
    } catch (err: any) {
      console.error(`[MIGRATE] Failed to execute ${file}:`, err.message);
      throw err;
    }
  }

  console.log('[MIGRATE] All database migrations completed successfully.');
}

// Run directly if called as main script
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[MIGRATE] Fatal error:', err);
      process.exit(1);
    });
}
