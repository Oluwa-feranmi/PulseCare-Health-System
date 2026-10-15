/**
 * PulseCare Health System - Data Access Layer (DAL)
 * Unified Relational SQL Adapter supporting:
 * 1. PostgreSQL (AWS RDS / Aurora / Docker Compose) via `pg.Pool`
 * 2. SQLite (Local dev / Container preview / Zero-config) via `sql.js` WebAssembly
 */

import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import pg from 'pg';

const { Pool } = pg;

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  lastInsertId?: number;
}

class DatabaseAdapter {
  private pgPool: pg.Pool | null = null;
  private sqliteDb: SqlJsDatabase | null = null;
  private sqliteFilePath: string = path.resolve(process.cwd(), 'pulsecare.sqlite');
  private isPostgres: boolean = false;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.isPostgres = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));
  }

  public getIsPostgres(): boolean {
    return this.isPostgres;
  }

  private async initSqlite(): Promise<void> {
    console.log('[DB] Initializing local relational SQLite engine (sql.js)...');
    const SQL = await initSqlJs();
    if (fs.existsSync(this.sqliteFilePath)) {
      const fileBuffer = fs.readFileSync(this.sqliteFilePath);
      this.sqliteDb = new SQL.Database(fileBuffer);
      console.log(`[DB] Loaded existing SQLite database from ${this.sqliteFilePath}`);
    } else {
      this.sqliteDb = new SQL.Database();
      console.log(`[DB] Created fresh in-memory SQLite database (persisting to ${this.sqliteFilePath})`);
      this.persistSqlite();
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (this.isPostgres) {
        console.log('[DB] Attempting connection to PostgreSQL instance via DATABASE_URL...');
        try {
          this.pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('localhost') && !process.env.DATABASE_URL?.includes('127.0.0.1') ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 3000,
          });
          // Verify connection with a short probe
          const client = await this.pgPool.connect();
          try {
            await client.query('SELECT 1');
            console.log('[DB] PostgreSQL connected successfully.');
          } finally {
            client.release();
          }
        } catch (pgError: any) {
          console.warn(`[DB] PostgreSQL connection to ${process.env.DATABASE_URL} failed (${pgError.message}). Gracefully falling back to local relational SQLite engine.`);
          if (this.pgPool) {
            try { await this.pgPool.end(); } catch (_) {}
            this.pgPool = null;
          }
          this.isPostgres = false;
          await this.initSqlite();
        }
      } else {
        await this.initSqlite();
      }
      this.isInitialized = true;
    })();

    return this.initPromise;
  }

  private persistSqlite(): void {
    if (!this.sqliteDb || this.isPostgres) return;
    try {
      const data = this.sqliteDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.sqliteFilePath, buffer);
    } catch (err) {
      console.error('[DB] Failed to persist SQLite database to disk:', err);
    }
  }

  /**
   * Translates indexed parameters: ? to $1, $2, ... for PostgreSQL
   * or $1, $2, ... to ? for SQLite
   */
  private normalizeQuery(sql: string, params: any[]): { normalizedSql: string; normalizedParams: any[] } {
    let normalizedSql = sql.trim();
    let normalizedParams = [...params];

    if (this.isPostgres) {
      // Replace ? placeholders with $1, $2, etc.
      let counter = 1;
      normalizedSql = normalizedSql.replace(/\?/g, () => `$${counter++}`);
    } else {
      // Replace $1, $2 placeholders with ?
      normalizedSql = normalizedSql.replace(/\$\d+/g, '?');
      // For boolean params in SQLite, convert boolean to 1/0
      normalizedParams = normalizedParams.map((p) => (typeof p === 'boolean' ? (p ? 1 : 0) : p));
    }

    return { normalizedSql, normalizedParams };
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    await this.initialize();
    const { normalizedSql, normalizedParams } = this.normalizeQuery(sql, params);

    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query(normalizedSql, normalizedParams);
      return {
        rows: res.rows as T[],
        rowCount: res.rowCount || 0,
      };
    }

    if (!this.sqliteDb) {
      throw new Error('Database adapter is not initialized');
    }

    try {
      const stmt = this.sqliteDb.prepare(normalizedSql);
      stmt.bind(normalizedParams);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as T);
      }
      stmt.free();

      return {
        rows,
        rowCount: rows.length,
      };
    } catch (error: any) {
      console.error('[DB] Query execution error:', { sql: normalizedSql, params: normalizedParams, error: error.message });
      throw error;
    }
  }

  public async execute(sql: string, params: any[] = []): Promise<QueryResult> {
    await this.initialize();
    const { normalizedSql, normalizedParams } = this.normalizeQuery(sql, params);

    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query(normalizedSql, normalizedParams);
      return {
        rows: res.rows,
        rowCount: res.rowCount || 0,
      };
    }

    if (!this.sqliteDb) {
      throw new Error('Database adapter is not initialized');
    }

    try {
      this.sqliteDb.run(normalizedSql, normalizedParams);
      
      // Get last insert rowid
      const lastIdRes = this.sqliteDb.exec('SELECT last_insert_rowid() as id');
      let lastInsertId: number | undefined = undefined;
      if (lastIdRes.length > 0 && lastIdRes[0].values.length > 0) {
        lastInsertId = Number(lastIdRes[0].values[0][0]);
      }

      this.persistSqlite();

      return {
        rows: [],
        rowCount: 1,
        lastInsertId,
      };
    } catch (error: any) {
      console.error('[DB] Execute error:', { sql: normalizedSql, params: normalizedParams, error: error.message });
      throw error;
    }
  }

  public async execScript(rawSql: string): Promise<void> {
    await this.initialize();
    if (this.isPostgres && this.pgPool) {
      await this.pgPool.query(rawSql);
      return;
    }

    if (this.sqliteDb) {
      this.sqliteDb.exec(rawSql);
      this.persistSqlite();
    }
  }

  public async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy'; type: string; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.query('SELECT 1 as health_check');
      return {
        status: 'healthy',
        type: this.isPostgres ? 'postgresql' : 'sqlite',
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        type: this.isPostgres ? 'postgresql' : 'sqlite',
        latencyMs: Date.now() - start,
      };
    }
  }
}

export const db = new DatabaseAdapter();
export default db;
