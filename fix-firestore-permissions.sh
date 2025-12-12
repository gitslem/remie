#!/bin/bash

# Fix Cloud Functions IAM Permissions for Firestore Access
# This script grants the necessary permissions to the Cloud Functions service account

set -e

PROJECT_ID="remiepay"
echo "🔧 Fixing IAM permissions for project: $PROJECT_ID"
echo ""

# Get the Cloud Functions service account
echo "📋 Identifying service accounts..."
APPENGINE_SA="${PROJECT_ID}@appspot.gserviceaccount.com"
FIREBASE_SA="firebase-adminsdk-xxxxx@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Service Accounts:"
echo "  - App Engine: $APPENGINE_SA"
echo "  - Firebase Admin SDK: Check your Firebase Console for the exact address"
echo ""

# Grant Cloud Datastore User role (required for Firestore access)
echo "1️⃣ Granting Cloud Datastore User role to App Engine service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${APPENGINE_SA}" \
  --role="roles/datastore.user" \
  --condition=None

echo ""
echo "2️⃣ Granting Firebase Admin role to App Engine service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${APPENGINE_SA}" \
  --role="roles/firebase.admin" \
  --condition=None

echo ""
echo "3️⃣ Granting Service Account User role (for Cloud Functions)..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${APPENGINE_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None

echo ""
echo "✅ IAM permissions granted successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Wait 1-2 minutes for permissions to propagate"
echo "2. Test the wallet page again"
echo "3. If still having issues, run: firebase functions:log --limit 50"
echo ""
echo "Note: If you're still getting errors, you may need to grant the same permissions"
echo "to the Firebase Admin SDK service account. Check Firebase Console > Project Settings >"
echo "Service Accounts to find the exact service account email."
