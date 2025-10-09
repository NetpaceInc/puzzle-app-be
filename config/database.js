const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = null;
  }

  async init() {
    this.pool = new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'puzzle_app'
    });

    await this.pool.query('SELECT 1');
    console.log('Connected to Postgres');
    await this.createTables();
  }

  async createTables() {
    const puzzlesTable = `
      CREATE TABLE IF NOT EXISTS puzzles (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        clues TEXT NOT NULL,
        solution TEXT NOT NULL,
        picas TEXT NOT NULL,
        centros TEXT NOT NULL,
        hint TEXT NOT NULL,
        difficulty TEXT DEFAULT 'medium',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const statsTable = `
      CREATE TABLE IF NOT EXISTS game_stats (
        id SERIAL PRIMARY KEY,
        puzzle_id INTEGER REFERENCES puzzles(id),
        puzzle_date DATE NOT NULL,
        user_id TEXT NOT NULL,
        solve_time INTEGER,
        duration_in_seconds INTEGER,
        completed BOOLEAN DEFAULT FALSE,
        attempts INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await this.pool.query(puzzlesTable);
    await this.pool.query(statsTable);
  }

  async run(sql, params = []) {
    const result = await this.pool.query(sql, params);
    // For INSERT ... RETURNING id
    if (result.rows && result.rows[0] && 'id' in result.rows[0]) {
      return { id: result.rows[0].id, changes: result.rowCount };
    }
    return { id: undefined, changes: result.rowCount };
  }

  async get(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows[0] || null;
  }

  async all(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }
}

module.exports = new Database();
