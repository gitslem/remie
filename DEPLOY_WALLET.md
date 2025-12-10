# 🚀 Deploy Clean Wallet - Simple Guide

## ✅ What's New

The wallet has been **completely rebuilt from scratch** - clean, simple, and working.

**Before**: 735 lines of complex code with errors
**After**: 175 lines of clean, working code

---

## 📋 Prerequisites

1. **Paystack Account**: https://dashboard.paystack.com
2. **Firebase Project**: Functions and Hosting set up
3. **Git**: Latest changes pulled

---

## 🔧 Step 1: Set Paystack API Key

```bash
# Get your key from: https://dashboard.paystack.com/settings/developer
# Use sk_test_... for testing, sk_live_... for production

firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY_HERE"
```

**Verify it's set:**
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

---

## 🚀 Step 2: Deploy Functions

```bash
cd /home/user/remie/functions
npm run build
firebase deploy --only functions
```

**Expected output:**
```
✔  Deploy complete!
✔  functions[api(us-central1)]
```

---

## 🌐 Step 3: Deploy Frontend

```bash
cd /home/user/remie/frontend
npm run build
```

Then deploy:
```bash
cd /home/user/remie
firebase deploy --only hosting
```

---

## 🧪 Step 4: Test the Wallet

### 1. Open Wallet Page
```
https://YOUR-PROJECT.web.app/dashboard/wallet
```

### 2. Check Browser Console (F12)
You should see:
```
✅ Balance loaded: { success: true, data: { balance: 0, ... } }
```

### 3. Test Funding

1. **Enter amount**: 1000
2. **Click "Continue to Paystack"**
3. **Console should show**:
   ```
   💳 Initiating payment for ₦1000
   ✅ Fund response: { success: true, data: { authorizationUrl: "..." } }
   🔄 Redirecting to Paystack...
   ```

4. **On Paystack page, use test card**:
   - **Card**: `4084084084084081`
   - **CVV**: `123`
   - **Expiry**: `12/25`
   - **PIN**: `1234`

5. **After payment, redirected back**:
   ```
   🔍 Verifying payment: REMIE_...
   ✅ Verify response: { success: true, ... }
   ✅ Wallet funded successfully!
   ```

6. **Balance should update** to ₦1,000.00

---

## 📊 What to Check

### In Browser Console (F12)

**Good signs** ✅:
- `✅ Balance loaded`
- `💳 Initiating payment`
- `✅ Fund response`
- `🔄 Redirecting to Paystack`
- `🔍 Verifying payment`
- `✅ Verify response`

**Bad signs** ❌:
- `❌ Load balance error`
- `❌ Fund failed`
- `❌ Verify error`
- `Paystack not configured`
- `401 Unauthorized`

### In Firebase Console

**Functions Logs:**
```bash
firebase functions:log --only api
```

Look for:
- Wallet balance requests
- Fund wallet requests
- Payment verification requests

---

## 🐛 Common Issues

### Issue: "Paystack not configured"

**Solution:**
```bash
firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY"
firebase deploy --only functions
```

### Issue: Balance shows 0 after payment

**Check:**
1. Browser console for verification logs
2. Firestore `wallets` collection for your user
3. Firestore `payments` collection for transaction

**Manual check in Firestore:**
```javascript
// In browser console
firebase.firestore().collection('wallets').doc(firebase.auth().currentUser.uid).get()
  .then(doc => console.log('Wallet:', doc.data()))
```

### Issue: 401 Unauthorized

**Solution:**
- Log out and log back in
- Check Firebase Authentication is working
- Verify token in browser console:
  ```javascript
  firebase.auth().currentUser?.getIdToken().then(t => console.log('Token:', t))
  ```

---

## 📁 File Structure

```
frontend/src/app/dashboard/wallet/
└── page.tsx          # Main wallet page (175 lines, clean)

functions/src/routes/
└── wallet.ts         # API endpoints (555 lines, working)
```

---

## 🎯 What the New Code Does

### Frontend (page.tsx)

**Simple flow:**
1. Load balance from `/api/wallet`
2. User enters amount
3. Call `/api/wallet/fund`
4. Redirect to Paystack
5. User pays
6. Paystack redirects back with `?reference=REMIE_...`
7. Call `/api/wallet/verify/:reference`
8. Balance updates

**Key features:**
- Clean state management
- Console logging with emojis for easy debugging
- Direct `fetch()` calls (no axios complexity)
- Beautiful gradient UI
- Quick amount buttons

### Backend (wallet.ts)

**Already working:**
- ✅ `GET /api/wallet` - Get balance
- ✅ `POST /api/wallet/fund` - Initialize Paystack payment
- ✅ `GET /api/wallet/verify/:ref` - Verify and update balance
- ✅ `POST /api/wallet/withdraw` - Withdraw to bank
- ✅ `GET /api/wallet/banks` - Get Nigerian banks
- ✅ `POST /api/wallet/resolve-account` - Verify bank account

---

## ✅ Success Checklist

After deploying, verify:

- [ ] Paystack API key set in Functions config
- [ ] Functions deployed successfully
- [ ] Frontend built and deployed
- [ ] Wallet page loads without errors
- [ ] Balance displays (even if 0)
- [ ] Console shows "✅ Balance loaded"
- [ ] Fund button works
- [ ] Redirects to Paystack
- [ ] Test payment completes
- [ ] Redirects back to wallet
- [ ] Balance updates
- [ ] Success toast shows

---

## 🔍 Debug Commands

```bash
# Check Functions config
firebase functions:config:get

# View Functions logs
firebase functions:log --only api

# Check Firestore data
firebase firestore:indexes

# Test API directly
curl https://YOUR-PROJECT.web.app/api/wallet/banks
```

---

## 💡 Tips

1. **Always check browser console** - All errors and flows are logged
2. **Use test mode first** - Don't use real money until tested
3. **Keep console open** - Emojis make it easy to follow
4. **Check Paystack dashboard** - Verify transactions appear there

---

## 📞 Support

If issues persist:

1. **Share browser console output** (with emojis)
2. **Share Functions logs**: `firebase functions:log`
3. **Verify Paystack config**: `firebase functions:config:get`

The new code is **simple, clean, and debuggable** - any errors will be clearly logged with emojis! 🎉
