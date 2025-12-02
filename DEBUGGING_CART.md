# Debugging Cart & Wishlist Features

## Quick Checklist

- [ ] Are you logged in? (Check if JWT token exists in cookies)
- [ ] Are the buttons visible on the detail page?
- [ ] What error message do you see?
- [ ] Check browser console (F12 → Console tab)
- [ ] Check network requests (F12 → Network tab)

## Step-by-Step Debugging

### Step 1: Verify Authentication

**In Browser Console:**
```javascript
// Check if JWT token exists
console.log(document.cookie);

// Should see something like: jwt=<token_here>
```

**In Network Tab:**
1. Click "Add to Cart"
2. Look for request to `/cart/add`
3. Check response status:
   - 200 = Success
   - 401 = Not authenticated
   - 400 = Invalid input
   - 404 = Vehicle not found
   - 500 = Server error

### Step 2: Check if Buttons Exist

**In Browser Console:**
```javascript
// Check if buttons are rendered
document.querySelectorAll('.add-to-cart-btn').length; // Should be > 0

// Check button data
const btn = document.querySelector('.add-to-cart-btn');
console.log(btn); // Should show button element
console.log(btn?.dataset.invId); // Should show vehicle ID
```

### Step 3: Verify Server Response

**Network Tab → /cart/add → Response Tab:**

Should see JSON like:
```json
{
  "success": true,
  "message": "Item added to cart.",
  "redirect": "/cart"
}
```

Or if not authenticated:
```json
{
  "success": false,
  "message": "Please log in to add items to your cart.",
  "redirect": "/account/login"
}
```

### Step 4: Check Server Logs

Look for console output when you click the button:
- Success: No error message
- Not logged in: "not authorized" or similar
- Database error: SQL error message

## Common Issues & Solutions

### Issue 1: Button Says "Not logged in" / "Log in to..."

**Problem**: You're not authenticated

**Solution**:
1. Click the link in the message
2. Log in with your account
3. Return to the product page
4. Try again

**Debug Check**:
```javascript
// In console, check if JWT token exists
console.log(document.cookie);
// Should include: jwt=...
```

### Issue 2: Button Doesn't Respond When Clicked

**Problem**: JavaScript event listener not attached

**Solution**:
1. Refresh the page
2. Check console for JavaScript errors
3. Verify buttons have class `add-to-cart-btn`

**Debug Check**:
```javascript
// Check if buttons exist
document.querySelectorAll('.add-to-cart-btn');
// Should show NodeList with 1+ items

// Check if event listeners are attached
const btn = document.querySelector('.add-to-cart-btn');
console.log(btn._onclick); // May not show listeners, but button should work
```

### Issue 3: 404 Error When Adding to Cart

**Problem**: Vehicle ID is wrong or vehicle doesn't exist

**Solution**:
1. Check URL - what's the inv_id?
2. Go to home page and navigate to a product again
3. Try with a different product

**Debug Check**:
```javascript
// Check what vehicle ID is being sent
const btn = document.querySelector('.add-to-cart-btn');
console.log('Vehicle ID:', btn?.dataset.invId);
```

### Issue 4: 500 Error When Adding to Cart

**Problem**: Database error

**Solution**:
1. Check server logs for error message
2. Verify database tables exist
3. Check database connection

**Debug Check**:
- Check terminal running npm start
- Look for error messages with "cart" in them
- Verify shopping_cart table exists in database

### Issue 5: Button Text Stuck on "Adding..."

**Problem**: Request timed out or failed silently

**Solution**:
1. Refresh the page
2. Check Network tab for request that didn't complete
3. Check server logs

**Debug Check**:
```javascript
// In console, check response
fetch('/cart/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ invId: 5, quantity: 1 })
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

### Issue 6: Toast Message Doesn't Appear

**Problem**: Toast element not in DOM or JavaScript error

**Solution**:
1. Check if #toast-container exists
2. Refresh page
3. Check console for errors

**Debug Check**:
```javascript
// Check if container exists
document.getElementById('toast-container');
// Should show the element

// Try showing toast manually
showToast('Test message', 'success');
```

## Network Debugging Guide

### Using Browser DevTools

1. **Open DevTools**: Press F12
2. **Go to Network Tab**: Click "Network" tab
3. **Click "Add to Cart"**: Watch for requests
4. **Look for `/cart/add`**: Click to see details

### Check Request
- Method: Should be `POST`
- Body: Should include `invId` and `quantity`
- Headers: Should include `Content-Type: application/json`

### Check Response
- Status: Look for 200, 401, 400, 404, or 500
- Headers: Check `content-type: application/json`
- Preview: Should show JSON response

## Console Debugging Commands

```javascript
// Test the fetch request manually
async function testCart() {
  try {
    const res = await fetch('/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invId: 2, quantity: 1 })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testCart();

// Check if button exists
console.log('Buttons found:', document.querySelectorAll('.add-to-cart-btn').length);

// Check JWT token
console.log('Has JWT?', document.cookie.includes('jwt'));

// Check authentication
console.log('Auth status:', fetch('/cart', { method: 'GET' }).then(r => r.status));
```

## Database Debugging

### Check if tables exist
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'shopping_cart';
SELECT * FROM information_schema.tables WHERE table_name = 'wishlist';
```

### Check user's cart
```sql
SELECT * FROM public.shopping_cart WHERE account_id = 5;
```

### Check wishlist
```sql
SELECT * FROM public.wishlist WHERE account_id = 5;
```

## Server Log Debugging

### Watch for these messages

**Success**:
```
No error messages - request completed successfully
```

**Authentication Error**:
```
req.account is undefined
or
user not authenticated
```

**Database Error**:
```
Error: Cannot insert cart item
Error: Invalid foreign key reference
Error: Database connection failed
```

## Final Checklist Before Testing

- [ ] Server is running (`npm start`)
- [ ] Database is running and accessible
- [ ] Shopping cart tables exist in database
- [ ] User is logged in (JWT token in cookies)
- [ ] Browser console shows no errors
- [ ] Network requests complete (no 500 errors)
- [ ] Buttons have correct classes (add-to-cart-btn, add-to-wishlist-btn)
- [ ] Buttons have data-inv-id attribute

## If Nothing Works

1. **Clear cache and cookies**
   - F12 → Application → Clear all

2. **Restart server**
   - Stop: Ctrl+C
   - Start: `npm start`

3. **Restart browser**
   - Close all tabs
   - Reopen browser
   - Log in again

4. **Check logs**
   - Terminal running npm start
   - Browser console (F12)
   - Network tab in DevTools

5. **Ask for help**
   - Provide screenshots of:
     - Console errors
     - Network response
     - What you expect vs actual
   - Describe steps to reproduce
   - Include browser and OS info

---

**Remember**: Always check the Network tab first - it usually shows exactly what's wrong!
