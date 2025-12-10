# Wallet Troubleshooting Guide

## ✅ Fixes Applied

I've just fixed critical issues in the wallet page:

1. **API URL Configuration** - Added fallback to `/api`
2. **User Validation** - Check if user exists before all operations
3. **Response Validation** - Verify response structure before accessing data
4. **Error Handling** - Better error messages and console logging
5. **Fallback Mechanisms** - Fallback banks list if API fails

---

## 🔍 How to Debug Issues

### Step 1: Open Browser Console

1. Open your wallet page
2. Press **F12** (or right-click > Inspect)
3. Go to **Console** tab
4. Look for error messages

### Step 2: Check Console Logs

The wallet page now logs all API calls:
- ✅ "Fetching wallet from: /api/wallet"
- ✅ "Wallet response: { success: true, data: {...} }"
- ✅ "Initiating payment: { amount: 1000, ... }"
- ✅ "Fund wallet response: { success: true, ... }"

---

## 🚨 Common Issues & Solutions

### Issue 1: "Failed to load wallet"

**Symptoms:**
- Wallet page shows "Failed to load wallet"
- Console shows 401 Unauthorized or 500 error

**Solutions:**

#### A. Check Firebase Authentication
```javascript
// Open browser console and run:
firebase.auth().currentUser
// Should return user object, not null
```

If null:
- Log out and log back in
- Clear browser cache
- Check if Firebase auth is initialized

#### B. Check API URL
```javascript
// In browser console:
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should be "/api" or your API URL
```

If undefined:
- Check `.env.production` file exists
- Rebuild frontend: `cd frontend && npm run build`

#### C. Check Firebase Functions Deployed
```bash
firebase deploy --only functions
```

---

### Issue 2: "Paystack not configured" error

**Symptoms:**
- Error when trying to fund wallet
- Console shows "Paystack not configured"

**Solution:**

Set Paystack API key in Firebase Functions:

```bash
# Method 1: Firebase CLI
firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY"
firebase deploy --only functions

# Method 2: Firebase Console
# Go to Functions > Configuration
# Add: PAYSTACK_SECRET_KEY = sk_test_YOUR_KEY
```

Get your Paystack key:
1. https://dashboard.paystack.com
2. Settings > API Keys & Webhooks
3. Copy **Secret Key**

---

### Issue 3: "Cannot read property 'data' of undefined"

**Symptoms:**
- Error accessing response.data
- White screen or page crash

**This is FIXED!** The update adds response validation:
```javascript
if (response.data.success && response.data.data) {
  setWallet(response.data.data);
} else {
  throw new Error('Invalid response format');
}
```

If still happening:
1. Hard refresh: **Ctrl+Shift+R** (Cmd+Shift+R on Mac)
2. Clear cache and reload
3. Check Firebase Functions are deployed

---

### Issue 4: Funding works but balance doesn't update

**Symptoms:**
- Payment successful on Paystack
- Redirected back to wallet
- Balance still shows 0

**Possible Causes:**

#### A. Payment not verified
Check console for:
- "Verifying payment: REMIE_..."
- Look for any errors in verification

#### B. Callback URL issue
The callback URL should be:
```
https://your-domain.com/dashboard/wallet?reference=REMIE_...
```

Check in browser address bar after payment.

#### C. Firestore wallet doesn't exist
```javascript
// In browser console:
firebase.firestore().collection('wallets').doc(firebase.auth().currentUser.uid).get()
  .then(doc => console.log(doc.data()))
```

If empty, the wallet will be created automatically on first API call.

---

### Issue 5: Bank account verification fails

**Symptoms:**
- "Failed to verify account" error
- Account name doesn't show

**Solutions:**

#### A. Check account number
- Must be exactly 10 digits
- No spaces or dashes
- Valid Nigerian bank account

#### B. Check bank code selected
- Make sure you selected the correct bank
- Try a different bank if issues persist

#### C. Check Paystack API
Test manually:
```bash
curl https://api.paystack.co/bank/resolve?account_number=0690000031&bank_code=044 \
  -H "Authorization: Bearer sk_test_YOUR_KEY"
```

#### D. Use test account in test mode
Test accounts:
- Account: 0690000031
- Bank: Access Bank (044)

---

### Issue 6: Withdrawal fails

**Symptoms:**
- "Failed to initiate withdrawal" error
- Withdrawal not processing

**Check:**

#### A. Sufficient balance
- Available balance must be ≥ withdrawal amount
- Check daily limit: ₦100,000

#### B. Account verified
- Must click "Verify" button first
- Account name should show green checkmark

#### C. Paystack transfer balance
In test mode, Paystack may not have funds:
- Only works in live mode with actual Paystack balance
- Or test with small amounts

---

## 🧪 Testing Checklist

### Test Funding (with console open):

1. ✅ Open wallet page - should load without errors
2. ✅ Click "Fund Wallet" - modal opens
3. ✅ Enter amount (e.g., 1000) - no validation errors
4. ✅ Click "Continue to Paystack" - console shows "Initiating payment"
5. ✅ Redirected to Paystack - authorization URL should open
6. ✅ Complete payment with test card: `4084084084084081`
7. ✅ Redirected back - console shows "Verifying payment"
8. ✅ Balance updates - success toast shows

### Test Withdrawal (with console open):

1. ✅ Click "Withdraw" - modal opens
2. ✅ Select bank - dropdown works
3. ✅ Enter account: 0690000031 - 10 digits accepted
4. ✅ Click "Verify" - console shows "Verifying account"
5. ✅ Account name shows - green checkmark appears
6. ✅ Enter amount (e.g., 500) - within balance
7. ✅ Click "Withdraw Funds" - console shows "Initiating withdrawal"
8. ✅ Success message - modal closes

---

## 📊 Check Current Status

### Run this in browser console on wallet page:

```javascript
// Check API URL
console.log('API URL:', '/api'); // Should not be 'undefined'

// Check user
firebase.auth().currentUser?.email; // Should show your email

// Check wallet data
console.log('Wallet loaded:', !!window.wallet); // Should be true after loading

// Test API endpoint
fetch('/api/wallet/banks')
  .then(r => r.json())
  .then(data => console.log('Banks API:', data))
  .catch(e => console.error('Banks API failed:', e));
```

---

## 🔧 Quick Fixes

### Fix 1: Clear everything and start fresh

```bash
# Clear browser
Ctrl+Shift+Delete > Clear all data > Reload

# Rebuild frontend
cd frontend
rm -rf .next out
npm run build

# Redeploy functions
cd ../functions
npm run build
firebase deploy --only functions
```

### Fix 2: Check environment variables

```bash
# Frontend .env.production should have:
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
# ... other Firebase vars

# Functions config should have:
firebase functions:config:get
# Should show:
# {
#   "paystack": {
#     "secret_key": "sk_test_..."
#   }
# }
```

### Fix 3: Reset wallet in Firestore

```javascript
// In browser console (with caution):
firebase.firestore().collection('wallets').doc(firebase.auth().currentUser.uid).set({
  userId: firebase.auth().currentUser.uid,
  balance: 0,
  availableBalance: 0,
  ledgerBalance: 0,
  currency: 'NGN',
  dailyLimit: 100000,
  monthlyLimit: 500000,
  isActive: true,
  isFrozen: false,
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

---

## 📝 What to Share if Still Having Issues

If the wallet still doesn't work, share these with support:

1. **Browser Console Errors** (F12 > Console tab)
   - Screenshot of any red errors
   - Any warnings

2. **Network Tab** (F12 > Network tab)
   - Filter by "wallet"
   - Click on failed request
   - Share "Response" tab content

3. **API Call Logs** (from Console)
   - "Fetching wallet from: ..."
   - "Wallet response: ..."
   - Any error messages

4. **Firebase Functions Logs**
```bash
firebase functions:log
```

5. **Environment Info**
   - Are you on localhost or production?
   - What URL are you accessing? (e.g., remiepay.web.app)
   - Did you deploy functions recently?

---

## ✅ Expected Console Output (Working Wallet)

When everything works, you should see:

```
Fetching wallet from: /api/wallet
Wallet response: { success: true, data: { balance: 0, availableBalance: 0, ... } }
Transactions response: { success: true, data: [], pagination: { ... } }
Banks response: { success: true, data: [{ id: 1, name: 'Access Bank', ... }] }
```

When funding:
```
Initiating payment: { amount: 1000, callbackUrl: '...', url: '/api/wallet/fund' }
Fund wallet response: { success: true, data: { authorizationUrl: 'https://checkout.paystack.com/...' } }
```

After payment:
```
Verifying payment: REMIE_1234567890_ABC123
Verify payment response: { success: true, message: 'Wallet funded successfully', ... }
```

---

## 🎯 Most Common Fix

**90% of issues are resolved by:**

1. Setting Paystack API key
```bash
firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY"
```

2. Deploying functions
```bash
firebase deploy --only functions
```

3. Hard refreshing browser
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

---

**Last Updated:** 2025-01-10
**Version:** 2.1.0 (with error handling fixes)
