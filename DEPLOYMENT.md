# REMIE Production Deployment Guide

## Prerequisites

1. **Firebase CLI**: Install Firebase CLI globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Create a Firebase project at https://console.firebase.google.com/

3. **Enable Firebase Services**:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Storage
   - Cloud Functions
   - Hosting

## Setup Steps

### 1. Configure Firebase Project

1. Login to Firebase:
   ```bash
   firebase login
   ```

2. Initialize Firebase (if not already done):
   ```bash
   firebase init
   ```
   - Select: Hosting, Firestore, Functions, Storage
   - Use existing project or create new one

3. Update `.firebaserc` with your project ID:
   ```json
   {
     "projects": {
       "default": "your-actual-project-id"
     }
   }
   ```

### 2. Configure Environment Variables

1. Copy `.env.production` to `.env.local`:
   ```bash
   cp .env.production frontend/.env.local
   ```

2. Update `frontend/.env.local` with your actual Firebase credentials from:
   - Firebase Console → Project Settings → General → Your apps → Web app

3. **Important**: Never commit `.env.local` to version control!

### 3. Build Frontend

```bash
cd frontend
npm install
npm run build
```

This creates a static export in `frontend/out/` directory.

### 4. Deploy to Firebase

Deploy everything:
```bash
firebase deploy
```

Or deploy specific services:

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage:rules

# Deploy only Functions
firebase deploy --only functions
```

### 5. Configure Custom Domain (Optional)

1. Go to Firebase Console → Hosting → Add custom domain
2. Follow the DNS configuration steps
3. Firebase will provision SSL certificate automatically

## Security Configuration

### Firestore Security Rules

The `firestore.rules` file contains production-ready security rules:
- User data is protected (users can only read/write their own data)
- Admin role is supported for administrative operations
- All writes require authentication
- Collection-level and document-level security

### Storage Security Rules

The `storage.rules` file contains:
- User-specific folder access
- File size limits (5MB for profile photos)
- File type restrictions (images only for profiles)
- Only authenticated users can upload

### Firebase Authentication

Configure sign-in methods in Firebase Console:
1. Go to Authentication → Sign-in method
2. Enable Email/Password
3. (Optional) Enable Google, Facebook, etc.

## Environment-Specific Configuration

### Production
- Use `frontend/.env.local` with production credentials
- Enable error tracking (Sentry, LogRocket, etc.)
- Enable analytics (Firebase Analytics, Google Analytics)

### Staging
- Create a separate Firebase project for staging
- Use different environment variables
- Test all features before deploying to production

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test authentication (signup, login, logout)
- [ ] Test payment flows (RRR, P2P, Loans)
- [ ] Verify Firestore rules are working
- [ ] Test file uploads (profile photos, documents)
- [ ] Check Cloud Functions are running
- [ ] Monitor logs for errors
- [ ] Set up Firebase Performance Monitoring
- [ ] Configure Firebase Analytics
- [ ] Set up error tracking

## Monitoring & Maintenance

### Firebase Console

Monitor your app at: https://console.firebase.google.com/

Key sections:
- **Hosting**: View deployment history, rollback if needed
- **Authentication**: Monitor user signups and logins
- **Firestore**: View database usage and costs
- **Functions**: Monitor function executions and errors
- **Performance**: Track app performance metrics
- **Analytics**: User behavior and engagement

### Logs

View function logs:
```bash
firebase functions:log
```

### Rollback

Rollback to previous deployment:
```bash
firebase hosting:channel:deploy preview
# Test the preview
# If good, promote to live:
firebase hosting:channel:clone preview:live
```

## Costs & Billing

Firebase has a generous free tier (Spark Plan), but for production:

1. Upgrade to Blaze Plan (pay-as-you-go)
2. Set up budget alerts in Firebase Console
3. Monitor usage regularly

### Cost Optimization Tips

- Use Firebase Hosting CDN for static assets
- Optimize Firestore queries (use indexes)
- Set appropriate cache headers
- Compress images before upload
- Use Cloud Functions wisely (avoid unnecessary calls)

## Troubleshooting

### Build Errors

```bash
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

### Deployment Errors

```bash
firebase deploy --debug
```

### Clear Firebase Cache

```bash
firebase hosting:channel:delete preview
firebase deploy --only hosting
```

## Support

For issues or questions:
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support
- REMIE Support: support@remie.app

## CI/CD Integration (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Build
        run: cd frontend && npm run build
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting
        env:
          FIREBASE_TOKEN: \${{ secrets.FIREBASE_TOKEN }}
```

Get Firebase token:
```bash
firebase login:ci
```

Add the token to GitHub Secrets as `FIREBASE_TOKEN`.

## License

Copyright © 2024 REMIE. All rights reserved.
