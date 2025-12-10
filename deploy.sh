#!/bin/bash
set -e

echo "🚀 REMIE Wallet Deployment Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install Frontend Dependencies
echo "📦 Step 1/5: Installing frontend dependencies..."
cd frontend
npm ci
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi

# Step 2: Install Functions Dependencies
echo ""
echo "📦 Step 2/5: Installing functions dependencies..."
cd ../functions
npm ci
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Functions dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install functions dependencies${NC}"
    exit 1
fi

# Step 3: Build Functions
echo ""
echo "🔨 Step 3/5: Building functions..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Functions built successfully${NC}"
else
    echo -e "${RED}❌ Functions build failed${NC}"
    exit 1
fi

# Step 4: Build Frontend
echo ""
echo "🔨 Step 4/5: Building frontend..."
cd ../frontend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Step 5: Check Paystack Config
echo ""
echo "🔍 Step 5/5: Checking Paystack configuration..."
cd ..
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Make sure you've set your Paystack key:${NC}"
echo ""
echo "Run this command:"
echo -e "${GREEN}firebase functions:config:set paystack.secret_key=\"sk_test_YOUR_KEY\"${NC}"
echo ""
echo "Get your key from: https://dashboard.paystack.com/settings/developer"
echo ""
echo "Then deploy with:"
echo -e "${GREEN}firebase deploy${NC}"
echo ""
echo -e "${GREEN}✅ Build complete! Ready to deploy.${NC}"
