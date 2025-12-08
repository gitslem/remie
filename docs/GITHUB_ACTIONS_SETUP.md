# GitHub Actions Deployment Setup

This guide shows you how to set up automatic Firebase deployment with GitHub Actions.

## 🔐 Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (remie-app or remiepay)
3. Click the ⚙️ (Settings) → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. **IMPORTANT**: Keep this file secure! Never commit it to git.

## 🔑 Step 2: Add GitHub Secrets

Go to your GitHub repository:
1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

### Required Secrets:

**FIREBASE_SERVICE_ACCOUNT**
- Click **New repository secret**
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: Paste the **entire contents** of the JSON file you downloaded
- Click **Add secret**

**FIREBASE_PROJECT_ID**
- Name: `FIREBASE_PROJECT_ID`
- Value: `remiepay` (or your project ID)

**NEXT_PUBLIC_FIREBASE_API_KEY**
- Get from Firebase Console → Project Settings → General → Your apps
- Example: `AIzaSyD...`

**NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
- Example: `remiepay.firebaseapp.com`

**NEXT_PUBLIC_FIREBASE_PROJECT_ID**
- Example: `remiepay`

**NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
- Example: `remiepay.appspot.com`

**NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
- Example: `123456789`

**NEXT_PUBLIC_FIREBASE_APP_ID**
- Example: `1:123456789:web:abc123def456`

**NEXT_PUBLIC_API_URL**
- Example: `https://us-central1-remiepay.cloudfunctions.net/api/api/v1`

## 🚀 Step 3: How It Works

Once set up, the workflow automatically deploys when you:

1. **Push to main branch**:
   ```bash
   git push origin main
   ```

2. **Push to any Claude branch**:
   ```bash
   git push origin claude/build-remie-app-*
   ```

3. **Manual trigger** (from GitHub Actions tab):
   - Go to **Actions** → **Deploy to Firebase** → **Run workflow**

## 📋 Deployment Process

The GitHub Action will:
1. ✅ Checkout your code
2. ✅ Setup Node.js 18
3. ✅ Install function dependencies
4. ✅ Build Cloud Functions (TypeScript → JavaScript)
5. ✅ Install frontend dependencies
6. ✅ Build Next.js frontend (with your env vars)
7. ✅ Deploy everything to Firebase:
   - Firestore rules
   - Storage rules
   - Cloud Functions
   - Hosting (frontend)

## 🔍 Monitoring Deployments

1. Go to **Actions** tab in your GitHub repo
2. Click on the latest workflow run
3. Watch real-time deployment logs
4. See if deployment succeeded or failed

## 🐛 Troubleshooting

### "Firebase Service Account Invalid"
- Make sure you copied the **entire JSON content**
- Check that it's valid JSON (starts with `{` and ends with `}`)
- Verify you're using the correct project

### "Permission Denied"
- Ensure the service account has **Firebase Admin** role
- Go to Firebase Console → Project Settings → Service accounts
- Verify the service account exists

### "Build Failed"
- Check the build logs in GitHub Actions
- Look for TypeScript or npm errors
- Ensure all dependencies are in package.json

### "Secrets Not Found"
- Double-check all secret names match exactly
- Secrets are case-sensitive
- Re-add any missing secrets

## 🎯 Quick Setup Commands

```bash
# 1. Commit your changes
git add -A
git commit -m "Add GitHub Actions deployment"

# 2. Push to trigger deployment
git push origin main
# OR
git push origin claude/build-remie-app-01SVWLSMDif5E2qtdmPAiUTD

# 3. Watch deployment
# Go to: https://github.com/YOUR_USERNAME/remie/actions
```

## ✅ Verification

After successful deployment, verify:

1. **Check GitHub Actions**:
   - Green checkmark ✅ on your commit
   - "Deploy to Firebase" workflow completed

2. **Check Firebase Console**:
   - Functions deployed
   - Hosting shows latest deployment

3. **Test your app**:
   - Visit: `https://remiepay.web.app`
   - API: `https://us-central1-remiepay.cloudfunctions.net/api/health`

## 🔄 Continuous Deployment

Now every push automatically deploys! 🎉

```
Push to GitHub → GitHub Actions → Build → Deploy → Live! ✨
```

## 📝 Alternative: Deploy Manually

If you prefer manual deployment:

```bash
cd /path/to/remie

# Build functions
cd functions && npm run build && cd ..

# Build frontend
cd frontend && npm run build && cd ..

# Deploy
firebase deploy
```

## 🌟 Benefits of GitHub Actions

- ✅ Automatic deployment on every push
- ✅ No need to deploy from local machine
- ✅ Consistent build environment
- ✅ Deployment history and rollback
- ✅ Team collaboration made easy
- ✅ Free for public repos (2000 minutes/month for private)

---

**Your REMIE app now has automatic deployment! 🚀**
