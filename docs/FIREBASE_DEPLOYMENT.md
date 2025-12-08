# REMIE Firebase Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase account created
- Firebase project created

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: **remie-app**
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Firebase Services

In your Firebase project:

**Authentication:**
1. Go to Authentication → Get Started
2. Enable Email/Password sign-in method
3. (Optional) Enable Google, Phone authentication

**Firestore Database:**
1. Go to Firestore Database → Create database
2. Start in **production mode**
3. Choose a location close to your users (e.g., us-central)

**Storage:**
1. Go to Storage → Get Started
2. Start in **production mode**

**Functions:**
1. Go to Functions → Get Started
2. Upgrade to **Blaze (Pay as you go)** plan (required for Cloud Functions)

**Hosting:**
1. Go to Hosting → Get Started

### 1.3 Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Web app" (</> icon)
4. Register app with name: **REMIE Web**
5. Copy the Firebase configuration object

## Step 2: Local Setup

### 2.1 Install Dependencies

```bash
cd /home/user/remie

# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project (if not already done)
firebase init
```

When prompted:
- Select: **Firestore, Functions, Hosting, Storage**
- Use existing project: **remie-app**
- Firestore rules: `firestore.rules`
- Firestore indexes: `firestore.indexes.json`
- Functions language: **TypeScript**
- Functions source: `functions`
- Hosting public directory: `frontend/out`
- Single-page app: **Yes**
- Storage rules: `storage.rules`

### 2.2 Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

### 2.3 Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

## Step 3: Configure Environment Variables

### 3.1 Frontend Environment

Create `frontend/.env.local`:

```bash
cp frontend/.env.local.example frontend/.env.local
```

Edit `frontend/.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=remie-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=remie-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=remie-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_API_URL=https://us-central1-remie-app.cloudfunctions.net/api/api/v1
```

### 3.2 Functions Environment (Secrets)

Set Firebase Functions configuration:

```bash
# Remita configuration
firebase functions:config:set remita.merchant_id="YOUR_MERCHANT_ID"
firebase functions:config:set remita.api_key="YOUR_API_KEY"
firebase functions:config:set remita.base_url="https://remitademo.net"
firebase functions:config:set remita.service_type_id="YOUR_SERVICE_TYPE_ID"

# Email configuration
firebase functions:config:set email.host="smtp.gmail.com"
firebase functions:config:set email.port="587"
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"

# Paystack configuration
firebase functions:config:set paystack.secret_key="sk_test_xxxxx"
firebase functions:config:set paystack.public_key="pk_test_xxxxx"

# Crypto configuration
firebase functions:config:set crypto.rpc_url="https://polygon-rpc.com"
firebase functions:config:set crypto.private_key="your-wallet-private-key"
```

View configuration:
```bash
firebase functions:config:get
```

## Step 4: Test Locally (Firebase Emulators)

### 4.1 Start Emulators

```bash
# From project root
firebase emulators:start
```

This starts:
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Storage: http://localhost:9199
- Hosting: http://localhost:5000
- Emulator UI: http://localhost:4000

### 4.2 Test Frontend Locally

```bash
cd frontend
npm run dev
# Opens at http://localhost:3000
```

Update `.env.local` to point to emulators:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/remie-app/us-central1/api/api/v1
```

## Step 5: Deploy to Firebase

### 5.1 Build Functions

```bash
cd functions
npm run build
cd ..
```

### 5.2 Build Frontend

```bash
cd frontend
npm run build
npm run export
cd ..
```

### 5.3 Deploy Everything

```bash
# Deploy all services
firebase deploy

# Or deploy individually:
firebase deploy --only firestore    # Firestore rules
firebase deploy --only functions    # Cloud Functions
firebase deploy --only hosting      # Frontend
firebase deploy --only storage      # Storage rules
```

### 5.4 Verify Deployment

After deployment, you'll see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/remie-app/overview
Hosting URL: https://remie-app.web.app
```

## Step 6: Post-Deployment Configuration

### 6.1 Configure Custom Domain (Optional)

1. Go to Hosting → Add custom domain
2. Enter your domain (e.g., remie.app)
3. Follow DNS configuration steps
4. Wait for SSL certificate provisioning

### 6.2 Set Up Firestore Indexes

If you get index errors:
1. Check Firebase console for index creation links
2. Or create manually in Firestore → Indexes

### 6.3 Configure CORS for Functions

If needed, update CORS in `functions/src/index.ts`:

```typescript
app.use(cors({
  origin: [
    'https://remie-app.web.app',
    'https://remie.app',
    'http://localhost:3000'
  ]
}));
```

## Step 7: Monitoring and Logs

### View Function Logs

```bash
# Real-time logs
firebase functions:log

# Specific function
firebase functions:log --only api
```

### Firebase Console

Monitor in Firebase Console:
- **Functions**: View execution logs, errors, performance
- **Firestore**: Browse collections, monitor usage
- **Authentication**: User management
- **Hosting**: Deployment history, rollback options

## Step 8: CI/CD with GitHub Actions (Optional)

Create `.github/workflows/firebase-deploy.yml`:

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
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd functions && npm ci
          cd ../frontend && npm ci

      - name: Build
        run: |
          cd functions && npm run build
          cd ../frontend && npm run build && npm run export

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: remie-app
```

## Common Commands

```bash
# Login
firebase login

# Select project
firebase use remie-app

# View current project
firebase projects:list

# Deploy specific function
firebase deploy --only functions:api

# View logs
firebase functions:log

# Open Firebase console
firebase open

# Run emulators
firebase emulators:start

# Export emulator data
firebase emulators:export ./emulator-data

# Import emulator data
firebase emulators:start --import=./emulator-data
```

## Costs and Quotas

Firebase offers generous free tier:

**Spark Plan (Free):**
- Cloud Functions: 125K invocations/month
- Firestore: 50K reads, 20K writes, 20K deletes/day
- Authentication: Unlimited
- Hosting: 10GB storage, 360MB/day transfer

**Blaze Plan (Pay as you go):**
- Required for Cloud Functions
- Only pay for usage beyond free tier
- ~$0.40 per million function invocations

## Troubleshooting

### Functions not deploying
```bash
# Check Node version (must be 18)
node --version

# Rebuild
cd functions
rm -rf node_modules
npm install
npm run build
```

### CORS errors
- Add your domain to CORS configuration
- Check Firebase Hosting rewrites

### Firestore permission denied
- Check firestore.rules
- Verify user authentication
- Check collection paths

### Functions timeout
- Increase timeout in firebase.json
- Optimize function code
- Check for infinite loops

## Security Best Practices

1. **Never commit:**
   - `.env.local` files
   - Service account keys
   - API keys in code

2. **Use environment variables:**
   - Functions config for secrets
   - Client-side env vars for public keys

3. **Firestore Security Rules:**
   - Always validate user authentication
   - Check resource ownership
   - Validate data types

4. **Functions Security:**
   - Validate all input
   - Use Firebase Auth tokens
   - Rate limit sensitive endpoints

## Next Steps

1. Set up monitoring and alerts
2. Configure backup policies
3. Implement analytics
4. Set up error reporting (Sentry)
5. Create staging environment
6. Document API endpoints
7. Write integration tests

## Support

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com
- Stack Overflow: Tag `firebase`
- GitHub Issues: Your repository

---

**Deployment Checklist:**

- [ ] Firebase project created
- [ ] Services enabled (Auth, Firestore, Functions, Hosting, Storage)
- [ ] Firebase CLI installed
- [ ] Project initialized
- [ ] Environment variables configured
- [ ] Functions dependencies installed
- [ ] Frontend dependencies installed
- [ ] Local testing with emulators
- [ ] Functions built successfully
- [ ] Frontend built and exported
- [ ] Deployed to Firebase
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Security rules reviewed
- [ ] Backup strategy in place

Your REMIE app is now live on Firebase! 🚀
