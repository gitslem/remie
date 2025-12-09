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

# Get project number
echo -e "\n${YELLOW}Fetching project number...${NC}"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
echo -e "${GREEN}Project Number: ${PROJECT_NUMBER}${NC}"

# App Engine default service account
APPENGINE_SA="${PROJECT_ID}@appspot.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Function to grant a project-level role
grant_project_role() {
    local role=$1
    echo -e "${YELLOW}Granting project role: ${role}${NC}"
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="$role" \
        --condition=None \
        2>/dev/null || echo -e "${YELLOW}Role ${role} may already be granted${NC}"
}

# Function to grant service account impersonation
grant_sa_impersonation() {
    local target_sa=$1
    echo -e "${YELLOW}Granting iam.serviceAccountUser on ${target_sa}${NC}"
    gcloud iam service-accounts add-iam-policy-binding "$target_sa" \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="roles/iam.serviceAccountUser" \
        --project="$PROJECT_ID" \
        2>/dev/null || echo -e "${YELLOW}Permission may already be granted${NC}"
}

# Required roles for Firebase Functions deployment
echo -e "\n${GREEN}Step 1: Granting project-level IAM roles...${NC}"

# Service Account User - Required for actAs permission (project level)
grant_project_role "roles/iam.serviceAccountUser"

# Cloud Functions roles
grant_project_role "roles/cloudfunctions.developer"

# Firebase roles
grant_project_role "roles/firebase.admin"

# Additional roles for complete functionality
grant_project_role "roles/cloudscheduler.admin"  # For scheduled functions
grant_project_role "roles/pubsub.admin"          # For pub/sub triggers
grant_project_role "roles/datastore.owner"       # For Firestore
grant_project_role "roles/storage.admin"         # For Cloud Storage

# CRITICAL: Grant permission to impersonate App Engine default service account
echo -e "\n${GREEN}Step 2: Granting service account impersonation permissions...${NC}"
echo -e "${YELLOW}This is critical for Cloud Functions deployment!${NC}"

grant_sa_impersonation "$APPENGINE_SA"
grant_sa_impersonation "$COMPUTE_SA"

echo -e "\n${GREEN}✓ All permissions setup complete!${NC}"
echo -e "${YELLOW}Note: Changes may take 1-2 minutes to propagate${NC}"
echo -e "\n${GREEN}To create a service account key for GitHub Actions:${NC}"
echo "gcloud iam service-accounts keys create firebase-service-account.json \\"
echo "  --iam-account=${SERVICE_ACCOUNT_EMAIL}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Wait 1-2 minutes for IAM changes to propagate"
echo "2. Re-run your GitHub Actions workflow"
echo "3. The deployment should now succeed!"
