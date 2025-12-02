#!/usr/bin/env node

/**
 * Create Orders and Order Items Tables
 */

require('dotenv').config();

const pool = require('./database');

async function migrate() {
  console.log('🔄 Creating orders and order_items tables...');

  const sql = `
    CREATE TABLE IF NOT EXISTS public.orders (
      order_id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES public.account(account_id) ON DELETE CASCADE,
      order_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
      total_amount NUMERIC(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      shipping_address VARCHAR(255),
      shipping_city VARCHAR(100),
      shipping_state VARCHAR(50),
      shipping_zip VARCHAR(20),
      shipping_phone VARCHAR(20),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.order_items (
      order_item_id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
      inv_id INTEGER NOT NULL REFERENCES public.inventory(inv_id),
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      price_at_purchase NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS orders_account_idx ON public.orders(account_id);
    CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items(order_id);
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
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('orders', 'order_items')`
    );

    if (result.rows.length > 0) {
      console.log('\n✅ Tables created successfully!');
      result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    }

    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

migrate();
