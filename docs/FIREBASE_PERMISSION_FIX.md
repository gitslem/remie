# 🔥 URGENT: Firebase IAM Permissions Fix

## The Problem

You're getting this error:
```
Error: Missing permissions required for functions deploy.
You must have permission iam.serviceAccounts.ActAs on service account
***@appspot.gserviceaccount.com.
```

This means your service account (stored in GitHub Secrets) needs permission to **impersonate** the App Engine default service account.

## ✅ The Solution (Run These Commands NOW)

### Step 1: Run the Updated Permissions Script

```bash
# Make sure you're in the project root
cd /path/to/remie

# Run the updated script (it will grant the critical impersonation permissions)
./.github/scripts/setup-firebase-permissions.sh remiepay
```

### Step 2: Or Run These Commands Manually

If the script doesn't work, run these commands manually:

```bash
# Set your project ID
PROJECT_ID="remiepay"

# Get your service account email from GitHub Secrets
# It should be something like: firebase-adminsdk@remiepay.iam.gserviceaccount.com
SERVICE_ACCOUNT="firebase-adminsdk@${PROJECT_ID}.iam.gserviceaccount.com"

# Get project number
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")

# CRITICAL: Grant impersonation permission on App Engine service account
gcloud iam service-accounts add-iam-policy-binding \
  "${PROJECT_ID}@appspot.gserviceaccount.com" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser" \
  --project="$PROJECT_ID"

# CRITICAL: Grant impersonation permission on Compute Engine service account
gcloud iam service-accounts add-iam-policy-binding \
  "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/iam.serviceAccountUser" \
  --project="$PROJECT_ID"

# Grant other necessary roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudfunctions.developer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/firebase.admin"
```

### Step 3: Wait and Re-run

```bash
# Wait 1-2 minutes for IAM changes to propagate
sleep 120

# Re-run your GitHub Actions workflow
# Or trigger it manually from GitHub Actions UI
```

## 🎯 Why This Happens

Firebase Cloud Functions deployment requires your service account to:
1. Have project-level roles (Cloud Functions Developer, Firebase Admin, etc.)
2. **PLUS** have permission to **impersonate** the App Engine default service account

The second part is what's missing! The error message specifically says:
> "You must have permission iam.serviceAccounts.ActAs on service account ***@appspot.gserviceaccount.com"

This means we need to grant `roles/iam.serviceAccountUser` **ON** the App Engine service account, not just at the project level.

## 📋 What the Updated Script Does

The new script now:
1. Grants project-level IAM roles (Cloud Functions Developer, Firebase Admin, etc.)
2. **Grants service account impersonation permissions** on:
   - `${PROJECT_ID}@appspot.gserviceaccount.com` (App Engine SA)
   - `${PROJECT_NUMBER}-compute@developer.gserviceaccount.com` (Compute Engine SA)

This is the critical step that was missing before!

## 🚨 Common Issues

### "Permission denied" when running the script

**Cause**: You need to be a Project Owner or have `roles/iam.securityAdmin` to grant these permissions.

**Solution**:
```bash
# Make sure you're authenticated as a project owner
gcloud auth login

# Set your project
gcloud config set project remiepay

# Verify you have the right permissions
gcloud projects get-iam-policy remiepay --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL" --format="value(bindings.role)"
```

If you don't have Owner permissions, ask a project owner to run the script.

### "Service account does not exist"

**Cause**: The service account hasn't been created yet.

**Solution**:
```bash
# Create the Firebase Admin SDK service account
gcloud iam service-accounts create firebase-adminsdk \
  --display-name="Firebase Admin SDK" \
  --project=remiepay

# Then re-run the permissions script
```

### Changes still not working after waiting

**Cause**: IAM changes can take up to 5 minutes to fully propagate.

**Solution**:
1. Wait 5 full minutes
2. Clear any cached credentials
3. Re-run the GitHub Actions workflow

## ✨ What's Been Fixed

1. **Updated permissions script** (`.github/scripts/setup-firebase-permissions.sh`):
   - Now grants service account impersonation on App Engine and Compute Engine SAs
   - Shows clear progress and next steps

2. **Simplified GitHub Actions workflow** (`.github/workflows/firebase-deploy.yml`):
   - Removed automatic permission granting (which didn't work)
   - Cleaner deployment process
   - Better error handling

3. **Enhanced documentation**:
   - This guide with exact commands to run
   - Comprehensive troubleshooting section

## 🎉 After Running the Fix

Once you've run the permissions script:

1. ✅ Wait 1-2 minutes
2. ✅ Go to your GitHub repository → Actions
3. ✅ Re-run the failed workflow
4. ✅ Deployment should now succeed!

You should see:
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/remiepay/overview
Hosting URL: https://remiepay.web.app
```

## 📞 Still Having Issues?

If you're still getting errors after running these commands:

1. Check the exact error message in GitHub Actions logs
2. Verify your service account email in GitHub Secrets matches what you used
3. Make sure you're using the correct project ID (`remiepay`)
4. Ensure billing is enabled on the project
5. Check that Cloud Functions API is enabled

Run this to verify everything is set up:
```bash
# Check service account permissions
gcloud iam service-accounts get-iam-policy \
  remiepay@appspot.gserviceaccount.com \
  --project=remiepay

# You should see your firebase-adminsdk service account listed with roles/iam.serviceAccountUser
```
