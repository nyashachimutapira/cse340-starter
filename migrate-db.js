#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * Usage: node migrate-db.js
 * 
 * This script runs the rebuild.sql file against your database to create
 * the shopping_cart and wishlist tables.
 */

const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function migrate() {
  const sqlFile = path.join(__dirname, 'database', 'rebuild.sql');
  
  console.log('🔄 Starting database migration...');
  console.log(`📄 Reading SQL from: ${sqlFile}`);
  
  try {
    // Read the SQL file
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`SQL file not found: ${sqlFile}`);
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log(`✅ SQL file read (${sql.length} bytes)`);
    
    // Connect to database
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    try {
      // Split SQL into individual statements
      // Remove comments and empty lines
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));
      
      console.log(`⚙️  Found ${statements.length} SQL statements to execute`);
      console.log('⚙️  Executing migration script...\n');
      
      let successCount = 0;
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';
        try {
          await client.query(stmt);
          successCount++;
          // Show progress every 5 statements
          if ((i + 1) % 5 === 0 || i === statements.length - 1) {
            console.log(`   ✅ Executed ${i + 1}/${statements.length} statements`);
          }
        } catch (stmtErr) {
          console.error(`\n   ❌ Statement ${i + 1} failed: ${stmtErr.message}`);
          console.error(`   SQL: ${stmt.substring(0, 100)}...`);
          throw stmtErr;
        }
      }
      
      console.log(`\n✅ All ${successCount} statements executed successfully`);
      
      // Verify tables were created
      console.log('\n📊 Verifying tables...');
      const result = await client.query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name IN ('shopping_cart', 'wishlist', 'classification', 'inventory', 'account')
         ORDER BY table_name`
      );
      
      if (result.rows.length > 0) {
        console.log('✅ Tables verified:');
        result.rows.forEach(row => console.log(`   - ${row.table_name}`));
      } else {
        console.warn('⚠️  No tables found - migration may have failed');
      }
      
      console.log('\n✅ Database migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Restart your application (npm start)');
      console.log('   2. Try adding items to cart - it should now work');
      console.log('   3. Check server logs for any errors');
      
    } finally {
      // Always release the connection
      client.release();
    }
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:');
    console.error(`   Error: ${err.message}`);
    if (err.detail) console.error(`   Detail: ${err.detail}`);
    if (err.hint) console.error(`   Hint: ${err.hint}`);
    if (err.code) console.error(`   Code: ${err.code}`);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Check DATABASE_URL in .env file');
    console.error('   - Verify database server is running');
    console.error('   - Check database user permissions');
    console.error('   - Review rebuild.sql for syntax errors');
    process.exit(1);
  }
}

// Run migration
migrate();
