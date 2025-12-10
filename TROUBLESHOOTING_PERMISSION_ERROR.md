# Troubleshooting: Error 7 PERMISSION_DENIED

You're seeing: `"7 PERMISSION_DENIED: Missing or insufficient permissions"`

## Where is this error appearing?

**Check 1: Browser Console (Most Common)**
1. Open your wallet page in the browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for the exact error and which API call is failing

**Check 2: Network Tab**
1. In DevTools, go to Network tab
2. Refresh the page
3. Look for failed requests (red)
4. Click on them to see the error response

## Most Likely Cause: Functions Not Deployed

Error 7 typically means Firebase Functions are NOT deployed. To check:

```bash
# Check if you're logged into Firebase
npx firebase login

# Check current project
npx firebase projects:list

# Use the correct project
npx firebase use remiepay

# List deployed functions
npx firebase functions:list
```

**Expected output:**
```
✔ api (us-central1)
```

**If you see "No functions deployed"**, that's your problem!

## Solution 1: Deploy Functions (90% of cases)

```bash
cd /home/user/remie

# Create .env file for functions
cat > functions/.env << 'EOF'
PAYSTACK_SECRET_KEY=your_actual_secret_key_here
NODE_ENV=production
EOF

# Build and deploy
cd functions
npm install
npm run build
cd ..
npx firebase deploy --only functions

# Wait for deployment (can take 2-5 minutes)
```

**After deployment, test:**
```bash
# Test health endpoint
curl https://YOUR-PROJECT.cloudfunctions.net/api/health

# Should return:
# {"status":"success","message":"REMIE API is running","timestamp":"..."}
```

## Solution 2: Fix IAM Permissions

If functions are deployed but still failing, the Service Account needs permissions:

```bash
PROJECT_ID="remiepay"
SERVICE_ACCOUNT="firebase-adminsdk@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant Cloud Functions Developer role
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudfunctions.developer"

# Grant Firestore access
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user"

# Grant Firebase Admin
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/firebase.admin"
```

## Solution 3: Check Environment Variables

The functions need `PAYSTACK_SECRET_KEY` to be set. Two ways to do this:

**Option A: Using .env file (Recommended)**
```bash
cd /home/user/remie/functions
cat > .env << 'EOF'
PAYSTACK_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
NODE_ENV=production
EOF

# Then redeploy
npx firebase deploy --only functions
```

**Option B: Using Firebase Functions Config (Legacy)**
```bash
npx firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY"
npx firebase deploy --only functions
```

## Solution 4: Deploy Firestore Rules

Make sure Firestore rules are deployed:

```bash
cd /home/user/remie
npx firebase deploy --only firestore:rules
```

## Full Deployment Checklist

Run these commands in order:

```bash
# 1. Go to project directory
cd /home/user/remie

# 2. Login to Firebase
npx firebase login

# 3. Select project
npx firebase use remiepay

# 4. Create functions .env file with your Paystack key
nano functions/.env
# Add: PAYSTACK_SECRET_KEY=sk_test_YOUR_KEY

# 5. Install and build functions
cd functions
npm install
npm run build
cd ..

# 6. Deploy everything
npx firebase deploy

# 7. Verify deployment
npx firebase functions:list
```

## Test After Deployment

1. **Test the API directly:**
```bash
# Get your function URL
npx firebase functions:list

# Test health endpoint
curl https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/api/health
```

2. **Test in browser:**
- Open https://YOUR-PROJECT.web.app/dashboard/wallet
- Open DevTools Console (F12)
- Should see "✅ Balance loaded: { success: true, data: { balance: 0 } }"

3. **Test wallet funding:**
- Enter amount (e.g., 1000)
- Click "Continue to Paystack"
- Should redirect to Paystack payment page

## Still Getting Errors?

**Share these with me:**

1. **Function deployment status:**
```bash
npx firebase functions:list
```

2. **Function logs:**
```bash
npx firebase functions:log --limit 50
```

3. **Browser console output:**
- Open wallet page
- F12 → Console tab
- Copy all errors

4. **Network tab:**
- F12 → Network tab
- Refresh page
- Screenshot of any failed (red) requests

## Quick Test Commands

```bash
# Is Firebase CLI installed?
npx firebase --version

# Are you logged in?
npx firebase projects:list

# Which project are you using?
npx firebase use

# Are functions deployed?
npx firebase functions:list

# Check recent logs
npx firebase functions:log --limit 20

# Test API endpoint
curl https://$(npx firebase functions:list 2>/dev/null | grep api | awk '{print $2}')/health
```

---

## The Fix Already Applied

I already fixed the client-side code to use API endpoints instead of direct Firestore access. The changes are in your branch `claude/fix-wallet-permissions-01KnHMvGLQtKTcnh1BgP687r`.

**What was fixed:**
- ✅ Transactions page now uses `/api/wallet/transactions`
- ✅ Loans page now uses `/api/loans`
- ✅ Added `.env.example` for environment variables
- ✅ Fixed TypeScript build issues

**What you need to do:**
1. Create `functions/.env` with your Paystack key
2. Deploy the functions: `npx firebase deploy --only functions`
3. Test the wallet page

The error will go away once functions are deployed! 🚀
