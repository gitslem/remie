# 🚨 Fix "PERMISSION_DENIED" Error

## What This Error Means

**Error**: `7 PERMISSION_DENIED: Missing or insufficient permissions`

This is a **Firestore permissions error** - your Firebase Functions can't access Firestore.

---

## ✅ Quick Fix (90% of cases)

The Functions are probably **not deployed yet**. Deploy them:

```bash
cd /home/user/remie

# Deploy Functions
firebase deploy --only functions
```

**Expected output:**
```
✔  Deploy complete!
✔  functions[api(us-central1)]
```

---

## 🧪 Test After Deploying

### Method 1: Use the Test Tool

1. Deploy the frontend:
   ```bash
   firebase deploy --only hosting
   ```

2. Open in browser:
   ```
   https://YOUR-PROJECT.web.app/test-wallet.html
   ```

3. Log in first, then click "Run All Tests"

### Method 2: Manual Browser Test

1. Open: `https://YOUR-PROJECT.web.app/dashboard/wallet`
2. Open Console (F12)
3. Run:
   ```javascript
   // Test banks API (no auth needed)
   fetch('/api/wallet/banks')
     .then(r => r.json())
     .then(d => console.log('✅ Banks:', d))
     .catch(e => console.error('❌ Banks:', e));

   // Test wallet API (needs auth)
   firebase.auth().currentUser.getIdToken()
     .then(token => fetch('/api/wallet', {
       headers: { Authorization: `Bearer ${token}` }
     }))
     .then(r => r.json())
     .then(d => console.log('✅ Wallet:', d))
     .catch(e => console.error('❌ Wallet:', e));
   ```

---

## 🔍 If Still Getting Error

### Check 1: Functions Deployed?

```bash
firebase functions:list
```

Should show:
```
✔ api (us-central1)
```

If empty or error: **Functions not deployed**

### Check 2: Paystack Key Set?

```bash
firebase functions:config:get
```

Should show:
```json
{
  "paystack": {
    "secret_key": "sk_test_..."
  }
}
```

If empty: **Set the key**
```bash
firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY"
firebase deploy --only functions
```

### Check 3: Check Function Logs

In Firebase Console:
1. Go to **Functions**
2. Click **Logs**
3. Look for errors

Or via CLI:
```bash
npx firebase functions:log --limit 50
```

Look for:
- "Paystack not configured"
- "Missing or insufficient permissions"
- Any error messages

### Check 4: Verify Project

```bash
firebase projects:list
```

Make sure you're using the correct project:
```bash
firebase use YOUR-PROJECT-ID
```

---

## 🎯 Root Causes & Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "PERMISSION_DENIED" | Functions not deployed | `firebase deploy --only functions` |
| "Paystack not configured" | API key not set | `firebase functions:config:set paystack.secret_key="sk_test_..."` |
| "401 Unauthorized" | User not logged in | Log in first |
| "404 Not Found" | Wrong API URL | Check `/api/wallet` endpoint exists |
| Functions not listed | Never deployed | Deploy for first time |

---

## 📋 Complete Deployment Checklist

Run these commands in order:

```bash
# 1. Navigate to project
cd /home/user/remie

# 2. Check you're on correct Firebase project
firebase use remiepay  # or your project ID

# 3. Set Paystack key (if not already set)
firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY_HERE"

# 4. Build functions
cd functions
npm run build

# 5. Deploy everything
cd ..
firebase deploy

# 6. Verify deployment
firebase functions:list
firebase functions:config:get

# 7. Test
# Open https://YOUR-PROJECT.web.app/test-wallet.html
```

---

## 🔧 Nuclear Option (If Nothing Works)

Start completely fresh:

```bash
# 1. Clean everything
cd /home/user/remie
rm -rf functions/lib
rm -rf frontend/.next frontend/out

# 2. Rebuild
cd functions && npm run build && cd ..

# 3. Make sure Paystack key is set
firebase functions:config:set paystack.secret_key="sk_test_YOUR_ACTUAL_KEY"

# 4. Deploy with force
firebase deploy --force

# 5. Wait 2 minutes for propagation

# 6. Hard refresh browser (Ctrl+Shift+R)
```

---

## 💡 Understanding the Error

**Why "PERMISSION_DENIED"?**

1. **Firebase Functions use Admin SDK** - bypasses Firestore rules
2. **If you get this error** - Functions aren't running or not deployed
3. **Client-side code** would get this error if trying to access Firestore directly
4. **Our new wallet code** uses `/api/wallet` (Functions), not Firestore directly

**What's happening:**
```
Browser → /api/wallet → Firebase Functions → Firestore (with Admin SDK) ✅
Browser → Firestore directly → PERMISSION_DENIED ❌
```

Our code does the first one, so this error means Functions aren't running.

---

## ✅ How to Verify It's Fixed

After deploying, you should see:

**In browser console:**
```
✅ Balance loaded: { success: true, data: { balance: 0 } }
```

**Not:**
```
❌ PERMISSION_DENIED
```

**Test with:**
1. Open wallet page
2. F12 console
3. Should load without errors
4. Try funding ₦1000
5. Should redirect to Paystack

---

## 📞 Still Stuck?

Share these details:

1. **Functions list output:**
   ```bash
   firebase functions:list
   ```

2. **Config output:**
   ```bash
   firebase functions:config:get
   ```

3. **Browser console output** (with network tab open)

4. **Functions logs:**
   ```bash
   npx firebase functions:log --limit 20
   ```

The error is **99% likely** because Functions aren't deployed. Deploy them and it will work! 🚀
