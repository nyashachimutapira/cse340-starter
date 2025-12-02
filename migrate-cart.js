#!/usr/bin/env node

/**
 * Create Shopping Cart Table
 */

require('dotenv').config();

const pool = require('./database');

async function migrate() {
  console.log('🔄 Creating shopping_cart table...');

  const sql = `
    CREATE TABLE IF NOT EXISTS public.shopping_cart (
      cart_id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES public.account(account_id) ON DELETE CASCADE,
      inv_id INTEGER NOT NULL REFERENCES public.inventory(inv_id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      CONSTRAINT shopping_cart_unique UNIQUE (account_id, inv_id)
    );

    CREATE INDEX IF NOT EXISTS shopping_cart_account_idx ON public.shopping_cart(account_id);
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
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_cart'`
    );

    if (result.rows.length > 0) {
      console.log('\n✅ shopping_cart table created successfully!');
    }

    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

migrate();
