# Admin User Setup Guide

This guide explains how to create and manage admin users in the REMIE platform.

## Prerequisites

1. A user account must already exist (register through the normal signup flow)
2. You need access to the database or the backend environment
3. Node.js and npm must be installed

## Method 1: Using the Create Admin Script (Recommended)

### Step 1: Set up your environment

Create a `.env` file in the `backend` directory if it doesn't exist:

```bash
cd backend
cp .env.example .env
```

### Step 2: Configure DATABASE_URL

Edit the `.env` file and set the `DATABASE_URL` to match your database connection:

```env
# For Google Cloud SQL (via cloud-sql-proxy on port 5433)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5433/remie-database?schema=public"

# For local development with Docker
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/remie?schema=public"

# For production (example)
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

**📌 Using Google Cloud SQL?** See [QUICKSTART_GOOGLE_CLOUD.md](./QUICKSTART_GOOGLE_CLOUD.md) for detailed setup instructions.

### Step 3: Run the create admin script

You can run the script in three ways:

**Option A: Using npm script**
```bash
npm run create-admin
```

**Option B: Using the shell script directly**
```bash
./create-admin.sh
```

**Option C: Using the TypeScript script with an email argument**
```bash
npx ts-node prisma/create-admin.ts smuggslem@gmail.com
```

The script will:
- ✅ Find the user by email
- ✅ Promote them to ADMIN role
- ✅ Set their status to ACTIVE
- ✅ Verify their email
- ✅ Display confirmation

### Example Output

```
=========================================
         Create Admin User
=========================================

Enter the email address to make admin: smuggslem@gmail.com

Searching for user: smuggslem@gmail.com...

📋 User found:
   Name: John Doe
   Email: smuggslem@gmail.com
   Current Role: STUDENT
   Current Status: PENDING_VERIFICATION

✅ User successfully promoted to ADMIN!

📋 Updated user details:
   Name: John Doe
   Email: smuggslem@gmail.com
   Role: ADMIN
   Status: ACTIVE
   Email Verified: true

🎉 The user can now access admin features!

=========================================
                Done!
=========================================
```

## Method 2: Using the API (For Existing Admins)

If you already have an admin user and want to promote another user:

### Endpoint
```
PUT /api/v1/admin/users/:userId/role
```

### Headers
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  "role": "ADMIN"
}
```

### Example using curl
```bash
curl -X PUT https://your-api.com/api/v1/admin/users/USER_ID_HERE/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'
```

### Available Roles
- `ADMIN` - Full administrative access
- `SUPPORT` - Support staff access
- `STUDENT` - Regular user (default)

## Method 3: Direct Database Access

If you have direct database access (not recommended for production):

### Using psql
```bash
psql "$DATABASE_URL" -c "
UPDATE \"user\"
SET role = 'ADMIN', status = 'ACTIVE', \"emailVerified\" = true
WHERE email = 'smuggslem@gmail.com';
"
```

### Using Prisma Studio
```bash
npm run prisma:studio
```

Then navigate to the User table and manually update the role field.

## Troubleshooting

### Error: "User not found"
- **Cause**: The email address doesn't exist in the database
- **Solution**: Make sure the user has registered first through the normal signup flow

### Error: "connection to server ... failed: Connection refused"
- **Cause**: Database is not running or DATABASE_URL is incorrect
- **Solution**:
  1. **For Google Cloud SQL**: Make sure cloud-sql-proxy is running:
     ```bash
     ./cloud-sql-proxy remiepay:us-central1:remie-app --port 5433
     ```
     You should see: "The proxy has started successfully and is ready for new connections!"
  2. **For Docker**: Check if your database is running: `docker ps`
  3. Verify DATABASE_URL in your `.env` file matches your setup:
     - Google Cloud SQL: port `5433`, database `remie-database`
     - Docker: port `5432`, database `remie`
  4. Test connection with psql:
     ```bash
     psql "$DATABASE_URL" -c "SELECT version();"
     ```

### Error: "DATABASE_URL not found"
- **Cause**: Missing `.env` file or DATABASE_URL not set
- **Solution**: Create a `.env` file and set DATABASE_URL (see Step 1 above)

### Database Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**Examples:**

- **Google Cloud SQL (via proxy)**: `postgresql://postgres:yourpassword@127.0.0.1:5433/remie-database?schema=public`
- **Local Docker**: `postgresql://postgres:postgres@localhost:5432/remie?schema=public`
- **Local PostgreSQL**: `postgresql://postgres:yourpassword@localhost:5432/remie?schema=public`
- **Production (direct)**: `postgresql://user:pass@db.example.com:5432/remie_prod?schema=public`

## Verifying Admin Access

After creating an admin user, you can verify by:

1. **Logging in** to the application with the admin email
2. **Accessing admin dashboard** at `/admin`
3. **Testing admin endpoints** like:
   - `GET /api/v1/admin/stats` - Dashboard statistics
   - `GET /api/v1/admin/users` - User list

## Security Notes

⚠️ **Important Security Considerations:**

1. **Protect admin accounts** - Use strong passwords for admin users
2. **Limit admin users** - Only promote trusted users to admin role
3. **Audit admin actions** - All admin actions are logged in the AuditLog table
4. **Database access** - Restrict direct database access in production
5. **Environment variables** - Never commit `.env` files to version control

## Next Steps

After creating your admin user:

1. ✅ Log in with the admin credentials
2. ✅ Access the admin dashboard
3. ✅ Review pending user approvals
4. ✅ Configure system settings
5. ✅ Monitor platform activity

For more information, see the main [README.md](../README.md) or contact the development team.
