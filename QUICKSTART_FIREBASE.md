# REMIE - Firebase Quick Start Guide

## 🚀 Deploy REMIE to Firebase in 10 Minutes

This guide will get your REMIE app live on Firebase quickly.

## Prerequisites

- Node.js 18+ installed
- A Google account
- 10 minutes of your time

## Step 1: Install Firebase CLI (2 minutes)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

A browser window will open - login with your Google account.

## Step 2: Create Firebase Project (2 minutes)

### Option A: Using Firebase Console (Recommended for first-time)

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Project name: **remie-app** (or your preferred name)
4. Disable Google Analytics (or enable if you want)
5. Click **"Create project"** and wait ~30 seconds
6. Click **"Continue"** when ready

### Enable Required Services:

**Authentication:**
1. Click "Authentication" → "Get started"
2. Click "Email/Password" → Toggle "Enable" → Save

**Firestore Database:**
1. Click "Firestore Database" → "Create database"
2. Select "Start in production mode"
3. Choose location closest to you (e.g., us-central)
4. Click "Enable"

**Cloud Functions:**
1. Click "Functions" → "Get started"
2. **Upgrade to Blaze Plan** (Pay as you go - Free tier is generous!)
   - You need a credit card but won't be charged unless you exceed free limits
   - Free tier: 125K function calls, 40K GB-seconds/month

**Storage:**
1. Click "Storage" → "Get started"
2. Start in production mode
3. Click "Done"

## Step 3: Configure Your Local Project (2 minutes)

```bash
cd /home/user/remie

# Initialize Firebase (use existing project)
firebase use --add
# Select your project: remie-app
# Alias: default

# Copy and configure frontend environment
cp frontend/.env.local.example frontend/.env.local
```

### Get Firebase Config

1. Go to Firebase Console → Project Settings (⚙️ icon)
2. Scroll to "Your apps" → Click Web icon (</>)
3. Register app: Name it "REMIE Web"
4. Copy the config values

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=remie-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=remie-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=remie-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_API_URL=https://us-central1-remie-app.cloudfunctions.net/api/api/v1
```

## Step 4: Set Environment Secrets (2 minutes)

```bash
# Email configuration (for notifications)
firebase functions:config:set email.host="smtp.gmail.com"
firebase functions:config:set email.port="587"
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-gmail-app-password"

# Remita (for RRR payments - optional for testing)
firebase functions:config:set remita.merchant_id="DEMO"
firebase functions:config:set remita.api_key="DEMO"
firebase functions:config:set remita.base_url="https://remitademo.net"
firebase functions:config:set remita.service_type_id="4430731"

# Paystack (optional - use test keys)
firebase functions:config:set paystack.secret_key="sk_test_your_key"
firebase functions:config:set paystack.public_key="pk_test_your_key"
```

**Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords → Generate → Copy password
4. Use that password in the config above

## Step 5: Install Dependencies (1 minute)

```bash
# Install function dependencies
cd functions
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Step 6: Deploy to Firebase (3 minutes)

```bash
# Build functions
cd functions
npm run build
cd ..

# Build and export frontend
cd frontend
npm run export
cd ..

# Deploy everything to Firebase
firebase deploy
```

Wait 2-3 minutes for deployment to complete.

## Step 7: Your App is Live! 🎉

After deployment, you'll see:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/remie-app/overview
Hosting URL: https://remie-app.web.app
Functions URL: https://us-central1-remie-app.cloudfunctions.net/api
```

**Your REMIE app is now live at:** `https://remie-app.web.app`

## Testing Your Deployment

### 1. Test Frontend

Visit: `https://remie-app.web.app`

You should see the REMIE landing page.

### 2. Test API

```bash
curl https://us-central1-remie-app.cloudfunctions.net/api/health
```

Response:
```json
{
  "status": "success",
  "message": "REMIE API is running"
}
```

### 3. Create Test User

Use Firebase Console:
1. Go to Authentication → Users → Add user
2. Email: `test@remie.app`
3. Password: `Test123!`
4. Click "Add user"

Or use the app's registration page (when implemented).

## Local Development with Emulators

For local testing without deploying:

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start frontend
cd frontend
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Emulator UI: http://localhost:4000

## Quick Commands Reference

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only frontend
firebase deploy --only hosting

# Deploy only database rules
firebase deploy --only firestore

# View function logs
firebase functions:log

# Open Firebase console
firebase open

# View current project
firebase projects:list

# Switch project
firebase use remie-app
```

## What's Deployed?

✅ **Cloud Functions (API):**
- User authentication & profiles
- RRR payment generation
- P2P money transfers
- Microloan applications
- Wallet management
- Payment history

✅ **Firestore Database:**
- Users collection
- Wallets
- Payments
- Loans
- P2P transfers
- Notifications

✅ **Firebase Authentication:**
- Email/password sign-in
- User management

✅ **Firebase Hosting:**
- Next.js frontend
- Static assets
- Global CDN

✅ **Firebase Storage:**
- Receipt storage
- Document uploads

## Next Steps

1. **Customize Domain (Optional):**
   - Firebase Console → Hosting → Add custom domain
   - Follow DNS instructions

2. **Add More Auth Methods:**
   - Firebase Console → Authentication
   - Enable Google, Phone, etc.

3. **Monitor Usage:**
   - Firebase Console → Usage and billing
   - Set up budget alerts

4. **View Logs:**
   ```bash
   firebase functions:log
   ```

5. **Update Code:**
   ```bash
   # Make changes
   git commit -m "Your changes"

   # Rebuild and redeploy
   firebase deploy
   ```

## Free Tier Limits

You get FREE every month:
- **Functions:** 2 million invocations
- **Firestore:** 50K reads, 20K writes, 20K deletes per day
- **Hosting:** 10 GB storage, 360 MB/day transfer
- **Storage:** 5 GB storage, 1 GB/day transfer

Perfect for development and small-scale production!

## Troubleshooting

**"Billing account not configured":**
- Upgrade to Blaze plan in Firebase Console
- Required for Cloud Functions

**"Functions not deploying":**
```bash
cd functions
rm -rf node_modules
npm install
npm run build
cd ..
firebase deploy --only functions
```

**"Frontend 404 errors":**
```bash
cd frontend
npm run export
cd ..
firebase deploy --only hosting
```

**"CORS errors":**
- Check that API URL in `.env.local` matches your functions URL
- Ensure CORS is enabled in functions (already configured)

## Cost Estimate

For ~1000 active users:
- **Functions:** ~$1-2/month
- **Firestore:** ~$0.50-1/month
- **Hosting:** Free (under 10GB)
- **Total:** ~$2-3/month

## Support

- 📚 Full docs: [docs/FIREBASE_DEPLOYMENT.md](docs/FIREBASE_DEPLOYMENT.md)
- 🔧 Firebase docs: https://firebase.google.com/docs
- 💬 Issues: GitHub repository

---

**Congratulations! Your REMIE app is live on Firebase! 🎊**
