# Admin Login Troubleshooting Guide

## Problem: "User not found" when trying to login as admin

This guide helps you diagnose and fix issues with admin user login.

## Common Causes

1. **No admin user exists in the database**
2. **User status is still PENDING_APPROVAL**
3. **Database connection issues**
4. **Wrong email or password**

## Understanding the Authentication Flow

### Registration Flow
When a user registers through the app:
- User is created with `status = 'PENDING_APPROVAL'`
- User gets a wallet automatically
- User **cannot login** until status is changed to `'ACTIVE'`

### Login Flow
When a user tries to login:
1. System checks if user exists (by email)
2. System verifies password
3. System checks user status:
   - `PENDING_APPROVAL` → **Login rejected** with message "Your account is pending admin approval"
   - `SUSPENDED` → Login rejected
   - `INACTIVE` → Login rejected
   - `ACTIVE` → **Login successful**

### Admin Creation
To create an admin user:
- Option 1: Register normally, then promote to admin (changes status to ACTIVE)
- Option 2: Use the `create-first-admin.ts` script to create admin directly

## Solution Steps

### Step 1: Check Database Connection

First, ensure your backend can connect to the database.

**Check environment variables:**
```bash
cd backend
cat .env | grep DATABASE_URL
```

The `DATABASE_URL` should point to your actual database, not the example values.

**Expected format:**
```
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

If this shows example values like `username:password@localhost`, you need to set up your real database connection.

### Step 2: Verify Database is Running

Check if PostgreSQL is running and accessible:

```bash
# For local PostgreSQL
psql -U youruser -d remie -c "SELECT 1"

# For Google Cloud SQL or remote database
# Use your cloud provider's connection method
```

### Step 3: Create First Admin User

We provide two methods to create an admin user:

#### Method A: Create Admin Directly (Recommended for first admin)

This creates a new admin user without requiring prior registration:

```bash
cd backend
npx ts-node scripts/create-first-admin.ts
```

Follow the prompts to enter:
- Email address
- First name
- Last name
- Password (minimum 8 characters)

#### Method B: Promote Existing User to Admin

If you already registered a user through the app:

```bash
cd backend
npx ts-node prisma/create-admin.ts <email>
```

This will:
- Find the user by email
- Set role to `ADMIN`
- Set status to `ACTIVE`
- Set emailVerified to `true`

### Step 4: Verify Admin User Exists

Create a simple script to check:

```bash
cd backend
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({ where: { role: 'ADMIN' } })
  .then(admins => {
    console.log('Admin users:', admins.map(a => ({
      email: a.email,
      status: a.status,
      role: a.role
    })));
    prisma.\$disconnect();
  });
"
```

### Step 5: Test Login

Try logging in with your admin credentials:

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

**Expected successful response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN",
      "status": "ACTIVE"
    },
    "token": "...",
    "refreshToken": "..."
  }
}
```

## Error Messages and Solutions

### "Invalid email or password"
- **Cause:** User not found in database OR password is incorrect
- **Solution:**
  1. Verify the email is correct
  2. If you forgot password, use the "forgot password" feature
  3. Or create a new admin using Method A above

### "Your account is pending admin approval"
- **Cause:** User status is still `PENDING_APPROVAL`
- **Solution:** Promote user to admin using Method B above

### "Your account has been suspended"
- **Cause:** User status is `SUSPENDED`
- **Solution:** Manually update the user status in the database:
  ```sql
  UPDATE "User" SET status = 'ACTIVE' WHERE email = 'your@email.com';
  ```

### "Connection refused" or "Database error"
- **Cause:** Backend cannot connect to database
- **Solution:**
  1. Verify DATABASE_URL in .env
  2. Ensure PostgreSQL is running
  3. Check network/firewall settings
  4. For Cloud SQL, verify connection strings and credentials

## Quick Checklist

- [ ] Backend .env file exists with correct DATABASE_URL
- [ ] Database is running and accessible
- [ ] Prisma Client is generated (`npm run prisma:generate`)
- [ ] Database migrations are applied (`npm run prisma:migrate`)
- [ ] Admin user exists in database
- [ ] Admin user has `role='ADMIN'` and `status='ACTIVE'`
- [ ] Admin user has `emailVerified=true`
- [ ] Password is correct (or recently created)
- [ ] Backend server is running

## Database Schema Reference

The User table structure:
```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password        String
  firstName       String
  lastName        String
  role            UserRole  @default(USER)   // USER | ADMIN
  status          UserStatus @default(PENDING_APPROVAL) // PENDING_APPROVAL | ACTIVE | SUSPENDED | INACTIVE
  emailVerified   Boolean   @default(false)
  ...
}
```

## Still Having Issues?

If you're still experiencing problems:

1. **Check backend logs** for detailed error messages
2. **Enable debug logging** in backend:
   ```
   LOG_LEVEL=debug npm run dev
   ```
3. **Verify API is accessible**:
   ```bash
   curl http://localhost:5000/api/v1/health
   ```
4. **Check if ports are in use**:
   ```bash
   lsof -i :5000  # Check if port 5000 is available
   ```

## Production Deployment Notes

When deploying to production:

1. **Set environment variables** properly in your hosting platform
2. **Run migrations** before starting the server
3. **Create admin user** using the production database
4. **Never commit** .env files with real credentials
5. **Use strong passwords** for admin accounts
6. **Enable 2FA** if available
7. **Monitor login attempts** for security

## Contact Support

If none of the above solutions work, please provide:
- Error message from frontend
- Backend server logs
- Database connection status
- Steps you've already tried
