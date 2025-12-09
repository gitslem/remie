# Firebase Permissions Setup Guide

## Overview

This guide explains how to resolve Firebase deployment permission errors and set up the correct IAM permissions for your Firebase project.

## Common Error

```
Error: Missing permissions required for functions deploy.
You must have permission iam.serviceAccounts.ActAs on service account
@appspot.gserviceaccount.com.
```

## Root Cause

This error occurs when the service account used for deployment lacks the necessary IAM permissions to deploy Cloud Functions. The service account needs the **Service Account User** role to impersonate the default compute service account.

## Solution Options

### Option 1: Automated Setup (Recommended)

Use the provided script to automatically grant all necessary permissions:

```bash
# Make the script executable
chmod +x .github/scripts/setup-firebase-permissions.sh

# Run the script with your project ID
./.github/scripts/setup-firebase-permissions.sh YOUR_PROJECT_ID

# If using a custom service account, specify it
./.github/scripts/setup-firebase-permissions.sh YOUR_PROJECT_ID your-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Option 2: Manual Setup via Google Cloud Console

1. Go to [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam)
2. Find your service account (usually `firebase-adminsdk@YOUR_PROJECT_ID.iam.gserviceaccount.com`)
3. Click **Edit** (pencil icon)
4. Click **Add Another Role** and add the following roles:
   - **Service Account User** (`roles/iam.serviceAccountUser`)
   - **Cloud Functions Developer** (`roles/cloudfunctions.developer`)
   - **Firebase Admin** (`roles/firebase.admin`)
   - **Cloud Scheduler Admin** (`roles/cloudscheduler.admin`)
   - **Pub/Sub Admin** (`roles/pubsub.admin`)
   - **Cloud Datastore Owner** (`roles/datastore.owner`)
   - **Storage Admin** (`roles/storage.admin`)

5. Click **Save**

### Option 3: Manual Setup via gcloud CLI

```bash
# Set your project ID
PROJECT_ID="your-project-id"
SERVICE_ACCOUNT="firebase-adminsdk@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant Service Account User role (required for actAs permission)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser"

# Grant Cloud Functions Developer role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudfunctions.developer"

# Grant Firebase Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/firebase.admin"

# Additional roles for full functionality
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudscheduler.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/pubsub.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.owner"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.admin"
```

## GitHub Actions Setup

### Required Secrets

Your GitHub repository needs the following secrets configured:

1. **FIREBASE_SERVICE_ACCOUNT**: The JSON key for your service account
2. **FIREBASE_PROJECT_ID**: Your Firebase project ID

### Creating a Service Account Key

```bash
# Create a service account key for GitHub Actions
gcloud iam service-accounts keys create firebase-service-account.json \
  --iam-account=firebase-adminsdk@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Display the content (copy this to GitHub Secrets)
cat firebase-service-account.json

# IMPORTANT: Delete the local key file after copying to GitHub
rm firebase-service-account.json
```

### Adding Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add `FIREBASE_SERVICE_ACCOUNT` with the JSON content
5. Add `FIREBASE_PROJECT_ID` with your project ID

## Wallet Functionality

The wallet functionality requires the following Firebase services to be properly configured:

### Firestore Collections

- **wallets**: Stores user wallet balances
- **payments**: Stores payment transactions
- **cryptoTransactions**: Stores cryptocurrency transactions

### Security Rules

The Firestore security rules in `firestore.rules` ensure:
- Users can only access their own wallet data
- Balance cannot go negative
- Only authenticated users can create transactions
- Admin users have elevated permissions

### Cloud Functions

The following Cloud Functions support wallet operations:

1. **api**: Main API endpoint (`/wallet` routes)
   - `GET /wallet`: Get wallet balance
   - `GET /wallet/transactions`: Get transaction history

2. **processReceipt**: Automatically generates receipts for completed payments

3. **sendNotificationEmail**: Sends email notifications for wallet activities

## Verification

After setting up permissions, verify the deployment:

```bash
# Test deployment locally first
npm run build
firebase emulators:start

# Deploy to Firebase
firebase deploy --project YOUR_PROJECT_ID
```

## Troubleshooting

### Issue: "Permission denied" during deployment

**Solution**: Ensure the service account has all required roles listed above.

### Issue: "Service account does not exist"

**Solution**: Create the service account:

```bash
gcloud iam service-accounts create firebase-adminsdk \
  --display-name="Firebase Admin SDK Service Account" \
  --project=YOUR_PROJECT_ID
```

### Issue: Deployment succeeds but functions don't work

**Solution**:
1. Check function logs: `firebase functions:log`
2. Verify environment variables are set
3. Ensure Firestore and other services are enabled in Firebase Console

### Issue: GitHub Actions still failing after permissions setup

**Solution**:
1. Wait 5-10 minutes for IAM changes to propagate
2. Re-run the GitHub Actions workflow
3. Verify the service account key in GitHub Secrets is current

## Additional Resources

- [Firebase IAM Permissions](https://firebase.google.com/docs/projects/iam/permissions)
- [Cloud Functions IAM](https://cloud.google.com/functions/docs/reference/iam/permissions)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)

## Support

If you continue to experience issues:
1. Check the Firebase Console for error messages
2. Review function logs in Google Cloud Console
3. Verify all required Firebase services are enabled
4. Ensure billing is enabled for the project (required for Cloud Functions)
