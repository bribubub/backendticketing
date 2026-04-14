import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.connect((err) => {
  if (!err) {
    console.log('✅ PostgreSQL Lokal Terhubung! 🐘');
    pool.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS image_url_2 TEXT;`)
      .catch(e => console.log("Info: Kolom image_url_2 sudah ada atau tabel belum dibuat."));

    pool.query(`
      CREATE TABLE IF NOT EXISTS ticket_histories (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
        title VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(e => console.log("Gagal buat tabel history:", e.message));
  } else {
    console.error('❌ Database Gagal:', err.message);
  }
});