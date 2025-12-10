#!/bin/bash
set -e

echo "🚀 REMIE Deployment Script - Fixing Permission Error 7"
echo "======================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found. Please run from /home/user/remie"
    exit 1
fi

# Step 1: Check Firebase CLI
echo "📋 Step 1: Checking Firebase CLI..."
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Installing Firebase tools..."
    npm install -g firebase-tools
fi
echo "✅ Firebase CLI ready"
echo ""

# Step 2: Login check
echo "📋 Step 2: Checking Firebase login..."
npx firebase projects:list > /dev/null 2>&1 || {
    echo "❌ Not logged in to Firebase. Running login..."
    npx firebase login
}
echo "✅ Logged in to Firebase"
echo ""

# Step 3: Select project
echo "📋 Step 3: Selecting Firebase project..."
npx firebase use remiepay
echo "✅ Using project: remiepay"
echo ""

# Step 4: Check for .env file
echo "📋 Step 4: Checking environment variables..."
if [ ! -f "functions/.env" ]; then
    echo "⚠️  WARNING: functions/.env not found!"
    echo ""
    echo "You need to create functions/.env with your Paystack key:"
    echo "PAYSTACK_SECRET_KEY=sk_test_YOUR_KEY_HERE"
    echo ""
    read -p "Do you want to create it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Paystack Secret Key: " PAYSTACK_KEY
        cat > functions/.env << EOF
PAYSTACK_SECRET_KEY=${PAYSTACK_KEY}
NODE_ENV=production
EOF
        echo "✅ Created functions/.env"
    else
        echo "⚠️  Skipping .env creation. Functions may not work without it!"
    fi
else
    echo "✅ functions/.env exists"
fi
echo ""

# Step 5: Install functions dependencies
echo "📋 Step 5: Installing functions dependencies..."
cd functions
npm install
echo "✅ Dependencies installed"
echo ""

# Step 6: Build functions
echo "📋 Step 6: Building functions..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi
echo "✅ Functions built successfully"
cd ..
echo ""

# Step 7: Deploy functions
echo "📋 Step 7: Deploying Firebase Functions..."
echo "This may take 2-5 minutes..."
npx firebase deploy --only functions
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed! Check errors above."
    exit 1
fi
echo "✅ Functions deployed successfully"
echo ""

# Step 8: Deploy Firestore rules
echo "📋 Step 8: Deploying Firestore rules..."
npx firebase deploy --only firestore:rules
echo "✅ Firestore rules deployed"
echo ""

# Step 9: Verify deployment
echo "📋 Step 9: Verifying deployment..."
npx firebase functions:list
echo ""

# Step 10: Test API
echo "📋 Step 10: Testing API endpoint..."
echo "Fetching function URL..."
FUNCTION_URL=$(npx firebase functions:list 2>/dev/null | grep "api" | awk '{print $2}' | head -1)
if [ -n "$FUNCTION_URL" ]; then
    echo "Testing: ${FUNCTION_URL}/health"
    curl -s "${FUNCTION_URL}/health" | grep -q "success" && echo "✅ API is responding!" || echo "⚠️  API test failed"
else
    echo "⚠️  Could not determine function URL. Check manually."
fi
echo ""

# Summary
echo "======================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================================================="
echo ""
echo "Next steps:"
echo "1. Open your app: https://remiepay.web.app/dashboard/wallet"
echo "2. Try funding your wallet"
echo "3. Check browser console (F12) for any errors"
echo ""
echo "If you still see errors:"
echo "- Check functions logs: npx firebase functions:log --limit 50"
echo "- Review: TROUBLESHOOTING_PERMISSION_ERROR.md"
echo ""
echo "🎉 The permission error should be fixed now!"
