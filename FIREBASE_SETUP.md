# Firebase Production Setup Guide for REMIE

## Overview

This guide will help you set up Firebase for the REMIE application in production.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `remie-production` (or your choice)
4. Enable Google Analytics (recommended)
5. Click "Create project"

## 2. Enable Firebase Services

### Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. (Optional) Enable other providers:
   - Google
   - Facebook
   - Phone
4. Configure authorized domains:
   - Add your production domain
   - Add localhost for testing

### Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **production mode**
3. Choose a location (select closest to your users)
4. Database will be created with default rules
5. Rules will be deployed from `firestore.rules` file

### Cloud Storage

1. Go to **Storage** → **Get Started**
2. Start in **production mode**
3. Use same location as Firestore
4. Rules will be deployed from `storage.rules` file

### Cloud Functions

1. Go to **Functions** → **Get Started**
2. Upgrade to **Blaze (Pay as you go)** plan
   - Required for Cloud Functions
   - Free tier is generous
   - Set up billing alerts

### Hosting

1. Go to **Hosting** → **Get Started**
2. Will be configured via Firebase CLI

## 3. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click **Web** icon (</>) to add a web app
4. Register app name: "REMIE Web App"
5. Copy the Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

## 4. Configure Environment Variables

1. Copy `.env.production` to `frontend/.env.local`:
   ```bash
   cp .env.production frontend/.env.local
   ```

2. Update `frontend/.env.local` with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_API_URL=https://us-central1-your-project-id.cloudfunctions.net/api/v1
   ```

3. **IMPORTANT**: Add `.env.local` to `.gitignore`:
   ```bash
   echo "frontend/.env.local" >> .gitignore
   ```

## 5. Update Firebase Project Reference

1. Edit `.firebaserc`:
   ```json
   {
     "projects": {
       "default": "your-actual-project-id"
     }
   }
   ```

2. Replace `your-actual-project-id` with your Firebase project ID

## 6. Install Firebase CLI

```bash
npm install -g firebase-tools
```

## 7. Login to Firebase

```bash
firebase login
```

This will open a browser for authentication.

## 8. Initialize Firebase (if needed)

If you need to reconfigure Firebase:

```bash
firebase init
```

Select:
- ☑ Hosting
- ☑ Firestore
- ☑ Functions
- ☑ Storage

Use existing project and select your project.

## 9. Deploy Security Rules

Deploy Firestore and Storage rules:

```bash
firebase deploy --only firestore:rules,storage:rules
```

Verify rules are deployed:
1. Go to **Firestore Database** → **Rules**
2. Go to **Storage** → **Rules**

## 10. Build and Deploy Frontend

```bash
# Build frontend
cd frontend
npm install
npm run build
cd ..

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## 11. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## 12. Configure Firestore Indexes

Firestore indexes are defined in `firestore.indexes.json`. Deploy them:

```bash
firebase deploy --only firestore:indexes
```

Monitor index creation in Firebase Console → Firestore → Indexes.

## 13. Set Up Budget Alerts

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **Billing** → **Budgets & alerts**
4. Create a budget:
   - Name: "REMIE Monthly Budget"
   - Budget amount: e.g., $50/month
   - Set alert thresholds: 50%, 90%, 100%

## 14. Configure CORS (for API calls)

If using Firebase Functions as API:

```bash
firebase functions:config:set cors.origin="https://yourdomain.com"
firebase deploy --only functions
```

## 15. Security Best Practices

### Environment Variables

- ✅ Never commit `.env.local` or `.env.production` with real credentials
- ✅ Use Firebase App Check for production
- ✅ Enable multi-factor authentication for admin accounts

### API Keys

- Firebase API keys are safe to expose in client code
- They identify your Firebase project
- Security is enforced by Firestore/Storage rules

### Firestore Rules

- Rules are already configured in `firestore.rules`
- Test rules before deployment
- Monitor rule violations in Console

### Storage Rules

- Rules are configured in `storage.rules`
- File size limits: 5MB for profile photos
- Only authenticated users can upload

## 16. Enable App Check (Recommended)

1. Go to **App Check** in Firebase Console
2. Register your web app
3. Choose provider: reCAPTCHA v3 (recommended for web)
4. Add site key to environment variables
5. Update frontend code to initialize App Check

## 17. Set Up Firebase Analytics

1. Go to **Analytics** → **Dashboard**
2. Configure analytics settings
3. Link to Google Analytics (if using)
4. Set up conversion events

## 18. Configure Performance Monitoring

1. Go to **Performance**
2. Enable Performance Monitoring
3. Add SDK to frontend (already included in Firebase SDK)

## 19. Set Up Error Tracking

Integrate with error tracking service:

```bash
# Using Sentry (example)
npm install --save @sentry/nextjs
```

Configure Sentry in `next.config.js`.

## 20. Test Everything

### Authentication

```bash
# Test signup
# Test login
# Test password reset
# Test logout
```

### Firestore

```bash
# Test read/write operations
# Verify security rules work
```

### Storage

```bash
# Test file upload
# Test file download
# Verify size limits
```

### Functions

```bash
# Test API endpoints
# Check function logs
firebase functions:log
```

## Verification Checklist

- [ ] Firebase project created
- [ ] All services enabled (Auth, Firestore, Storage, Functions, Hosting)
- [ ] Environment variables configured
- [ ] .firebaserc updated with project ID
- [ ] Security rules deployed
- [ ] Firestore indexes created
- [ ] Frontend built and deployed
- [ ] Functions deployed
- [ ] Budget alerts configured
- [ ] App Check enabled (optional)
- [ ] Analytics configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate provisioned
- [ ] All features tested in production

## Monitoring

### Firebase Console

Monitor daily:
- **Authentication**: User signups, login attempts
- **Firestore**: Read/write operations, errors
- **Functions**: Executions, errors, duration
- **Hosting**: Bandwidth usage
- **Storage**: Storage used, downloads

### Set Up Alerts

1. Go to **Alerts** in Firebase Console
2. Configure alerts for:
   - High error rates
   - Unusual traffic
   - Budget thresholds
   - Function timeouts

## Troubleshooting

### Build Errors

```bash
cd frontend
rm -rf .next node_modules out
npm install
npm run build
```

### Deployment Errors

```bash
firebase deploy --debug
```

### Permission Errors

```bash
firebase login --reauth
```

### Rules Not Working

1. Check Firebase Console → Firestore → Rules
2. Use Rules Playground to test
3. Check timestamps (createdAt should be server timestamp)

## Support

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support/contact
- Stack Overflow: https://stackoverflow.com/questions/tagged/firebase

## Next Steps

After successful deployment:

1. Monitor logs for first 24 hours
2. Set up continuous deployment (CI/CD)
3. Configure staging environment
4. Set up database backups
5. Configure monitoring and alerting
6. Plan for scaling

## Cost Estimation

### Spark Plan (Free)

- 10GB Hosting
- 1GB Storage
- 20K Cloud Function calls/day
- Good for development/testing

### Blaze Plan (Pay as you go)

For 1,000 active users/month:

- **Firestore**: ~$1-5
- **Cloud Functions**: ~$5-10
- **Storage**: ~$0.50-2
- **Hosting**: Free (within limits)
- **Total**: ~$10-20/month

Actual costs vary based on usage.

## License

Copyright © 2024 REMIE. All rights reserved.
