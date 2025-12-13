# Quick Start: Create Admin User with Google Cloud SQL

## Your Setup ✓
- ✅ Google Cloud SQL Proxy running on port 5433
- ✅ Database name: `remie-database`
- ✅ Proxy command: `./cloud-sql-proxy remiepay:us-central1:remie-app --port 5433`

## Step-by-Step Guide

### Step 1: Update DATABASE_URL in .env

Edit `backend/.env` and update the DATABASE_URL with your Google Cloud SQL credentials:

```bash
DATABASE_URL="postgresql://USERNAME:PASSWORD@127.0.0.1:5433/remie-database?schema=public"
```

**Replace:**
- `USERNAME` - Your Cloud SQL database username (likely `postgres`)
- `PASSWORD` - Your Cloud SQL database password

**Example:**
```bash
DATABASE_URL="postgresql://postgres:mySecretPassword123@127.0.0.1:5433/remie-database?schema=public"
```

### Step 2: Make sure Cloud SQL Proxy is running

In one terminal, keep this running:
```bash
./cloud-sql-proxy remiepay:us-central1:remie-app --port 5433
```

You should see:
```
The proxy has started successfully and is ready for new connections!
```

### Step 3: Run the admin creation script

In a **new terminal**, navigate to the backend directory and run:

```bash
cd backend
npm run create-admin
```

Or use the direct command:
```bash
cd backend
npx ts-node prisma/create-admin.ts smuggslem@gmail.com
```

### Step 4: Expected Output

If successful, you'll see:
```
=========================================
         Create Admin User
=========================================

Searching for user: smuggslem@gmail.com...

📋 User found:
   Name: [Your Name]
   Email: smuggslem@gmail.com
   Current Role: STUDENT
   Current Status: PENDING_VERIFICATION

✅ User successfully promoted to ADMIN!

📋 Updated user details:
   Name: [Your Name]
   Email: smuggslem@gmail.com
   Role: ADMIN
   Status: ACTIVE
   Email Verified: true

🎉 The user can now access admin features!
```

## Troubleshooting

### Issue: "User not found"
**Solution:** The user must register first through your app's signup flow.

### Issue: "Connection refused"
**Solutions:**
1. Ensure Cloud SQL Proxy is running: `./cloud-sql-proxy remiepay:us-central1:remie-app --port 5433`
2. Check if you can see "ready for new connections!" in the proxy output
3. Verify port 5433 is correct in DATABASE_URL

### Issue: "Authentication failed"
**Solutions:**
1. Double-check your database username in DATABASE_URL
2. Verify your database password is correct (no special characters need escaping in the URL)
3. Test connection with psql:
   ```bash
   psql "postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5433/remie-database"
   ```

### Finding Your Database Credentials

**From Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to SQL > Your Instance (remie-app)
3. Click on "Users" tab
4. Your username is listed there (usually `postgres`)
5. Use "Change password" if you don't remember it

**Testing the connection:**
```bash
# Install postgresql client if needed (on Mac)
brew install postgresql

# Test connection
psql "postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5433/remie-database" -c "\dt"
```

This should list all tables if connection is successful.

## Alternative Method: Using psql directly

If you prefer, you can also set the admin directly with psql:

```bash
# Make sure proxy is running first
psql "postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5433/remie-database" -c "
UPDATE \"user\"
SET role = 'ADMIN', status = 'ACTIVE', \"emailVerified\" = true
WHERE email = 'smuggslem@gmail.com';
"

# Verify it worked
psql "postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5433/remie-database" -c "
SELECT email, role, status, \"emailVerified\"
FROM \"user\"
WHERE email = 'smuggslem@gmail.com';
"
```

## Security Note

⚠️ **Never commit your .env file!**

The `.env` file contains sensitive credentials. It's already in `.gitignore`, but double-check:
```bash
git status
# Make sure .env is NOT listed in "Changes to be committed"
```
