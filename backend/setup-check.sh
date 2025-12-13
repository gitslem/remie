#!/bin/bash

echo "========================================="
echo "  Final Setup Check for Admin Creation"
echo "========================================="
echo ""

# Step 1: Check .zshrc for Supabase
echo "✓ Step 1: Checking ~/.zshrc for Supabase..."
if grep -q "supabase" ~/.zshrc 2>/dev/null; then
    echo "❌ ERROR: Supabase DATABASE_URL still found in ~/.zshrc"
    echo ""
    echo "Please run this command to remove it:"
    echo "  nano ~/.zshrc"
    echo ""
    echo "Then delete or comment out these lines:"
    grep "supabase" ~/.zshrc 2>/dev/null | sed 's/^/  /'
    echo ""
    echo "After editing, run: source ~/.zshrc"
    exit 1
else
    echo "✅ ~/.zshrc is clean (no Supabase found)"
fi

echo ""

# Step 2: Unset DATABASE_URL from current session
echo "✓ Step 2: Clearing DATABASE_URL from current session..."
unset DATABASE_URL
echo "✅ DATABASE_URL unset from current session"

echo ""

# Step 3: Verify .env file
echo "✓ Step 3: Checking backend/.env file..."
if [ -f .env ]; then
    if grep -q "127.0.0.1:5433/remie-database" .env; then
        echo "✅ .env has Google Cloud SQL configuration"
    else
        echo "❌ ERROR: .env doesn't have correct DATABASE_URL"
        exit 1
    fi
else
    echo "❌ ERROR: .env file not found"
    exit 1
fi

echo ""

# Step 4: Test Prisma connection
echo "✓ Step 4: Testing Prisma database connection..."
echo ""
echo "Running: npx prisma db execute --stdin <<< 'SELECT current_database();'"
echo ""

if npx prisma db execute --stdin <<< "SELECT current_database();" 2>&1 | grep -q "remie-database"; then
    echo ""
    echo "✅ SUCCESS! Connected to Google Cloud SQL database 'remie-database'"
else
    echo ""
    echo "Connection output:"
    npx prisma db execute --stdin <<< "SELECT current_database();" 2>&1
    echo ""
    echo "⚠️  Please check:"
    echo "  1. Cloud SQL Proxy is running: ./cloud-sql-proxy remiepay:us-central1:remie-app --port 5433"
    echo "  2. Password is correct in .env"
    exit 1
fi

echo ""
echo "========================================="
echo "  All checks passed! ✅"
echo "========================================="
echo ""
echo "You can now run:"
echo "  1. npx prisma migrate deploy"
echo "  2. npx ts-node prisma/create-admin.ts smuggslem@gmail.com"
echo ""
