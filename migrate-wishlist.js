#!/usr/bin/env node

/**
 * Create Wishlist Table
 */

require('dotenv').config();

const pool = require('./database');

async function migrate() {
  console.log('🔄 Creating wishlist table...');

  const sql = `
    CREATE TABLE IF NOT EXISTS public.wishlist (
      wishlist_id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES public.account(account_id) ON DELETE CASCADE,
      inv_id INTEGER NOT NULL REFERENCES public.inventory(inv_id) ON DELETE CASCADE,
      added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      CONSTRAINT wishlist_unique UNIQUE (account_id, inv_id)
    );

    CREATE INDEX IF NOT EXISTS wishlist_account_idx ON public.wishlist(account_id);
  `;

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Split and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    for (const stmt of statements) {
      await client.query(stmt);
      console.log('✅ Executed:', stmt.substring(0, 50) + '...');
    }

    // Verify
    const result = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wishlist'`
    );

    if (result.rows.length > 0) {
      console.log('\n✅ wishlist table created successfully!');
    }

    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

migrate();
