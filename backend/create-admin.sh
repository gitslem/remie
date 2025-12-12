#!/bin/bash

# Create admin user script
# This sets an existing user as admin

DATABASE_URL="postgresql://postgres@127.0.0.1:5433/remie-database"

echo "========================================="
echo "Create Admin User"
echo "========================================="

# Prompt for email
read -p "Enter the email address to make admin: " ADMIN_EMAIL

echo ""
echo "Setting $ADMIN_EMAIL as admin..."

# Update user to admin and active
psql "$DATABASE_URL" -c "
UPDATE \"user\"
SET role = 'ADMIN', status = 'ACTIVE'
WHERE email = '$ADMIN_EMAIL';
"

# Verify
psql "$DATABASE_URL" -c "
SELECT id, email, role, status, \"firstName\", \"lastName\"
FROM \"user\"
WHERE email = '$ADMIN_EMAIL';
"

echo ""
echo "========================================="
echo "Done!"
echo "========================================="
