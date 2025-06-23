const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:xmUeKVhuRSCogxbaKKvXSBhZcKDtaTHb@interchange.proxy.rlwy.net:59977/railway';

const pool = new Pool({
  connectionString,
});

const createSchema = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS elements (
        id SERIAL PRIMARY KEY,
        room_code TEXT NOT NULL,
        element_data TEXT NOT NULL,
        is_undone INTEGER DEFAULT 0,
        FOREIGN KEY (room_code) REFERENCES rooms (code) ON DELETE CASCADE
      )
    `);
    console.log('PostgreSQL schema checked/created successfully.');
  } catch (err) {
    console.error('Error creating schema:', err.stack);
  } finally {
    client.release();
  }
};

createSchema().catch(err => console.error('Failed to setup database schema:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
}; 