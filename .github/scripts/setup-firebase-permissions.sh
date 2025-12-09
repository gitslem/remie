#!/bin/bash

# Firebase Permissions Setup Script
# This script grants the necessary IAM permissions for Firebase Functions deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if project ID is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Project ID is required${NC}"
    echo "Usage: ./setup-firebase-permissions.sh <PROJECT_ID> [SERVICE_ACCOUNT_EMAIL]"
    exit 1
fi

PROJECT_ID="$1"
SERVICE_ACCOUNT_EMAIL="${2:-firebase-adminsdk@${PROJECT_ID}.iam.gserviceaccount.com}"

echo -e "${GREEN}Setting up Firebase permissions for project: ${PROJECT_ID}${NC}"
echo -e "${GREEN}Service Account: ${SERVICE_ACCOUNT_EMAIL}${NC}"

# Function to grant a role
grant_role() {
    local role=$1
    echo -e "${YELLOW}Granting role: ${role}${NC}"
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="$role" \
        --condition=None \
        2>/dev/null || echo -e "${YELLOW}Role ${role} may already be granted${NC}"
}

# Required roles for Firebase Functions deployment
echo -e "\n${GREEN}Granting required IAM roles...${NC}"

# Service Account User - Required for actAs permission
grant_role "roles/iam.serviceAccountUser"

# Cloud Functions roles
grant_role "roles/cloudfunctions.developer"

# Firebase roles
grant_role "roles/firebase.admin"

# Additional roles for complete functionality
grant_role "roles/cloudscheduler.admin"  # For scheduled functions
grant_role "roles/pubsub.admin"          # For pub/sub triggers
grant_role "roles/datastore.owner"       # For Firestore
grant_role "roles/storage.admin"         # For Cloud Storage

echo -e "\n${GREEN}✓ Permissions setup complete!${NC}"
echo -e "${YELLOW}Note: Changes may take a few minutes to propagate${NC}"
echo -e "\n${GREEN}To create a service account key for GitHub Actions:${NC}"
echo "gcloud iam service-accounts keys create firebase-service-account.json \\"
echo "  --iam-account=${SERVICE_ACCOUNT_EMAIL}"
