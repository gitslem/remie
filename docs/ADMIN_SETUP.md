# Admin User Setup Guide

## Quick Start

To create your first admin user and get access to the admin dashboard, follow these steps:

### Prerequisites

1. **Database must be running** - PostgreSQL database should be set up and accessible
2. **Backend dependencies installed** - Run `npm install` in the backend directory
3. **Environment variables configured** - `.env` file with correct `DATABASE_URL`
4. **Migrations applied** - Database schema must be up to date

### Step-by-Step Instructions

#### 1. Navigate to Backend Directory

```bash
cd backend
```

#### 2. Create First Admin User

Run the admin creation script:

```bash
npm run create-first-admin
```

Or directly:

```bash
npx ts-node scripts/create-first-admin.ts
```

#### 3. Follow the Prompts

The script will ask you for:
- **Email** - Your admin email address
- **First Name** - Your first name
- **Last Name** - Your last name
- **Password** - A secure password (minimum 8 characters)

Example:
```
Enter admin email: admin@remie.app
Enter first name: John
Enter last name: Doe
Enter password (min 8 characters): SecurePass123!

✅ Admin user created successfully!
```

#### 4. Login to the Application

You can now login using:
- **Email:** The email you just entered
- **Password:** The password you just entered

## Alternative Methods

### Method 1: Promote Existing User

If you already have a registered user that you want to make an admin:

```bash
npm run promote-admin <email@example.com>
```

This will:
- Find the user by email
- Change their role to `ADMIN`
- Change their status to `ACTIVE`
- Set email as verified

### Method 2: Direct Database Access

If you have direct access to the database:

```sql
-- Update existing user to admin
UPDATE "User"
SET
  role = 'ADMIN',
  status = 'ACTIVE',
  "emailVerified" = true
WHERE email = 'your@email.com';
```

## Verification

To verify your admin user was created successfully:

### Check Database

```bash
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({
  where: { role: 'ADMIN' },
  select: { email: true, status: true, role: true }
}).then(admins => {
  console.log('Admin users:', admins);
  process.exit(0);
});
"
```

### Test Login via API

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@remie.app",
    "password": "your-password"
  }'
```

Successful response should include:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "role": "ADMIN",
      "status": "ACTIVE",
      ...
    },
    "token": "...",
    "refreshToken": "..."
  }
}
```

## Troubleshooting

### "User not found" Error

**Cause:** The admin user doesn't exist in the database.

**Solution:** Run `npm run create-first-admin` to create one.

### "Account is pending admin approval" Error

**Cause:** User exists but status is still `PENDING_APPROVAL`.

**Solution:** Run `npm run promote-admin <your-email>` to promote the user.

### "Cannot connect to database" Error

**Cause:** Database connection issue.

**Solutions:**
1. Check your `.env` file has correct `DATABASE_URL`
2. Verify PostgreSQL is running
3. Test connection: `psql $DATABASE_URL -c "SELECT 1"`

For detailed troubleshooting, see [ADMIN_LOGIN_TROUBLESHOOTING.md](./ADMIN_LOGIN_TROUBLESHOOTING.md).

## Security Best Practices

1. **Use a strong password** - At least 12 characters with mixed case, numbers, and symbols
2. **Keep credentials secure** - Never commit passwords or .env files
3. **Limit admin access** - Only create admin accounts for trusted users
4. **Regular password rotation** - Change admin passwords periodically
5. **Monitor admin activity** - Review admin logs regularly
6. **Enable 2FA** - If/when two-factor authentication is implemented

## Admin Dashboard Access

Once logged in as an admin, you can access:

- **Admin Dashboard:** `/admin`
- **User Management:** Approve, suspend, or manage users
- **Transaction Monitoring:** View all platform transactions
- **System Settings:** Configure platform parameters
- **Reports:** Generate financial and usage reports

## Next Steps

After creating your admin account:

1. **Login to the frontend** at http://localhost:3000
2. **Navigate to `/admin`** to access admin features
3. **Create additional admin users** if needed via the admin dashboard
4. **Configure platform settings** as required
5. **Approve pending user registrations**

## FAQ

**Q: Can I have multiple admin users?**
A: Yes, you can create as many admin users as needed.

**Q: What's the difference between `create-first-admin` and `promote-admin`?**
A: `create-first-admin` creates a new user from scratch, while `promote-admin` upgrades an existing registered user to admin.

**Q: Can regular users access admin features?**
A: No, only users with `role='ADMIN'` can access admin features.

**Q: What if I forget my admin password?**
A: Use the "Forgot Password" feature on the login page, or reset it directly in the database.

**Q: Is the admin role reversible?**
A: Yes, you can change a user's role back to `USER` via the database or admin panel.

## Production Deployment

When deploying to production:

1. Create admin user on production database
2. Use environment-specific credentials
3. Ensure DATABASE_URL points to production database
4. Use strong, unique passwords
5. Consider using secrets management (AWS Secrets Manager, etc.)
6. Enable all security features
7. Set up monitoring and alerting

## Support

If you encounter any issues:

1. Check [ADMIN_LOGIN_TROUBLESHOOTING.md](./ADMIN_LOGIN_TROUBLESHOOTING.md)
2. Review backend logs for errors
3. Verify database connectivity
4. Ensure all migrations are applied
5. Check that environment variables are correct

---

**Need help?** File an issue on GitHub or contact the development team.
