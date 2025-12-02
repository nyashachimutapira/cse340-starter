# Database Setup Guide

## Current Status
❌ **Tables Missing**: `shopping_cart` and `wishlist` tables need to be created

## How to Create the Tables

### Option 1: Using psql Command Line (Recommended)

1. **Get your database connection string** from your `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@host:port/dbname?sslmode=require
   ```

2. **Run the SQL script** (in terminal/PowerShell):
   ```powershell
   psql postgresql://username:password@host:port/dbname?sslmode=require -f database/rebuild.sql
   ```

3. **Verify the tables were created**:
   ```powershell
   psql postgresql://username:password@host:port/dbname?sslmode=require -c "\dt public.*"
   ```
   Should see:
   - shopping_cart
   - wishlist
   - Other existing tables

### Option 2: Using Database GUI Tool

If using a GUI like DBeaver, pgAdmin, or similar:

1. **Open your database connection**
2. **Open a query editor**
3. **Copy-paste the SQL from `database/rebuild.sql`**
4. **Execute the entire script**
5. **Verify tables exist**

### Option 3: Using Node.js Script

Create a file `migrate.js`:

```javascript
const fs = require('fs');
const pool = require('./database');

async function migrate() {
  try {
    const sql = fs.readFileSync('./database/rebuild.sql', 'utf8');
    const client = await pool.connect();
    await client.query(sql);
    client.release();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
```

Then run: `node migrate.js`

## Quick Verification

After running the migration, verify with these commands:

### Check if tables exist:
```sql
-- In your database query tool
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('shopping_cart', 'wishlist');
```

### Check table structure:
```sql
-- View shopping_cart table
\d public.shopping_cart

-- View wishlist table
\d public.wishlist
```

### Check table contents:
```sql
-- Count rows (should be empty initially)
SELECT COUNT(*) FROM public.shopping_cart;
SELECT COUNT(*) FROM public.wishlist;
```

## Environment Variables Needed

Make sure your `.env` file has:
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

## Troubleshooting

### Error: "relation does not exist"
**Problem**: Tables haven't been created
**Solution**: Run the migration script (rebuild.sql)

### Error: "permission denied"
**Problem**: Your database user doesn't have permission
**Solution**: Use a database user with CREATE TABLE permissions

### Error: "database does not exist"
**Problem**: Wrong database name in connection string
**Solution**: Check DATABASE_URL in .env file

### Error: "could not connect to server"
**Problem**: Database server is down or wrong host
**Solution**: 
- Check if database server is running
- Verify host name in DATABASE_URL
- Test connection with psql command

## What Gets Created

### shopping_cart Table
```
Columns:
- cart_id (Primary Key)
- account_id (Foreign Key → account)
- inv_id (Foreign Key → inventory)
- quantity (Default: 1, Min: 1)
- added_at (Timestamp)

Constraints:
- Unique (account_id, inv_id) - Prevents duplicates
- Cascade Delete - Deletes cart when account deleted
```

### wishlist Table
```
Columns:
- wishlist_id (Primary Key)
- account_id (Foreign Key → account)
- inv_id (Foreign Key → inventory)
- added_at (Timestamp)

Constraints:
- Unique (account_id, inv_id) - Prevents duplicates
- Cascade Delete - Deletes wishlist when account deleted
```

## After Migration

1. ✅ Restart your application
2. ✅ Try adding items to cart - should work now
3. ✅ Check server logs - no more "does not exist" errors

## Using render.com Database

If using Render.com (which you appear to be):

1. Go to your Render dashboard
2. Click on your PostgreSQL database
3. Click "Connect"
4. Copy the "psql" connection string
5. Run the migration:
   ```powershell
   psql <your-connection-string> -f database/rebuild.sql
   ```

Or use Render's built-in query editor:
1. Go to database settings
2. Click "Database Console" or "Query Editor"
3. Paste contents of rebuild.sql
4. Execute

---

**Next Steps**:
1. Create the tables using one of the methods above
2. Restart the server
3. Try adding items to cart again
4. Verify in server logs - should work without errors
